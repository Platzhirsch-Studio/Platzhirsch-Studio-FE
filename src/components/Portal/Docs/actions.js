"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getPortal } from "@/lib/portal/dal";
import { idSchema } from "@/lib/portal/schemas";
import { getActionLimiter } from "@/lib/portal/actionLimit";
import { APPOINTMENT_CHANGE_REASONS, BUDGETS, CONTACT_OPTIONS, PASS_REQUESTS, TIMEFRAMES } from "./labels";
import { getPassEntry } from "./server/passes";

// Server Actions of Dokumente/Termine/Produktpass/Anfragen. Each one verifies
// the session itself (getPortal -> redirect to login), checks ownership through
// the customer-scoped adapter, validates with zod and only then writes via the
// existing adapter methods addFeedback() / requestPlanning().
//
// The interface has no dedicated "appointment change" or "service request"
// method yet: these are written as feedback with a structured prefix
// ("[Terminänderung …]", "[Service …]") – see kundenportal.md, Abschnitt 2.

const isoDay = z.iso
  .date({ message: "Bitte ein gültiges Datum wählen." })
  .refine((d) => d >= new Date(Date.now() - 86400000).toISOString().slice(0, 10), "Bitte ein Datum in der Zukunft wählen.");
const futureDates = z
  .array(z.string())
  .transform((arr) => arr.map((s) => s.trim()).filter(Boolean))
  .pipe(z.array(isoDay).max(3));

const text = (min, max, msg) => z.string().trim().min(min, msg).max(max, `Bitte höchstens ${max} Zeichen.`);

function errorsOf(result) {
  const out = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

// R6: every call counts per IP BEFORE the session check (getPortal), so a
// flood of action requests stops before HMAC, store reads and adapter calls.
// Valid requests count per customer as before (10 per hour), same store.
async function ipLimited() {
  return !(await getActionLimiter().checkIp(await headers())).ok;
}
async function limited(customerId) {
  return !(await getActionLimiter().checkCustomer("docs", customerId)).ok;
}

const TOO_MANY = { ok: false, message: "Zu viele Anfragen in kurzer Zeit. Bitte später erneut versuchen oder anrufen." };
const FAILED = { ok: false, message: "Die Anfrage konnte nicht gespeichert werden. Bitte erneut versuchen oder rufen Sie uns an." };

const formDates = (fd) => fd.getAll("preferredDates").map(String);

// ---------------------------------------------------------------- Termine

const appointmentChangeSchema = z.object({
  appointmentId: idSchema,
  reason: z.enum(Object.keys(APPOINTMENT_CHANGE_REASONS), { message: "Bitte einen Grund wählen." }),
  preferredDates: futureDates,
  message: text(0, 1000).optional().default(""),
});

export async function requestAppointmentChange(_prev, formData) {
  if (await ipLimited()) return TOO_MANY;
  const portal = await getPortal("/de/portal/termine");
  const parsed = appointmentChangeSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    reason: formData.get("reason"),
    preferredDates: formDates(formData),
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) return { ok: false, errors: errorsOf(parsed), message: "Bitte die markierten Felder prüfen." };
  if (await limited(portal.customerId)) return TOO_MANY;

  const { appointmentId, reason, preferredDates, message } = parsed.data;
  const appointment = (await portal.listAppointments()).find((a) => a.id === appointmentId);
  if (!appointment) return { ok: false, message: "Termin nicht gefunden." };

  const body = [
    `[Terminänderung ${appointment.id}] ${APPOINTMENT_CHANGE_REASONS[reason]}`,
    `Termin: ${appointment.title}, ${appointment.start}`,
    preferredDates.length ? `Wunschtermine: ${preferredDates.join(", ")}` : null,
    message ? `Nachricht: ${message}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = appointment.projectId
      ? await portal.addFeedback({ projectId: appointment.projectId, target: { kind: "projekt", id: appointment.projectId }, message: body })
      : await portal.requestPlanning({ room: "Terminänderung", message: body, preferredContact: "email", preferredDates });
    return { ok: true, ref: res.id, message: "Danke – wir melden uns mit einem neuen Terminvorschlag. Der bisherige Termin gilt, bis wir ihn ändern." };
  } catch (err) {
    console.error("[portal] Terminänderung fehlgeschlagen:", err);
    return FAILED;
  }
}

// ---------------------------------------------------------------- Produktpass

const passRequestSchema = z.object({
  passId: idSchema,
  kind: z.enum(Object.keys(PASS_REQUESTS), { message: "Bitte die Art der Anfrage wählen." }),
  message: text(10, 1500, "Bitte beschreiben Sie Ihr Anliegen in ein paar Worten (mind. 10 Zeichen)."),
  preferredContact: z.enum(Object.keys(CONTACT_OPTIONS)).default("email"),
});

export async function requestPassService(_prev, formData) {
  if (await ipLimited()) return TOO_MANY;
  const passId = String(formData.get("passId") || "");
  const portal = await getPortal(`/de/portal/pass/${encodeURIComponent(passId)}`);
  const parsed = passRequestSchema.safeParse({
    passId,
    kind: formData.get("kind"),
    message: formData.get("message") ?? "",
    preferredContact: formData.get("preferredContact") || "email",
  });
  if (!parsed.success) return { ok: false, errors: errorsOf(parsed), message: "Bitte die markierten Felder prüfen." };
  if (await limited(portal.customerId)) return TOO_MANY;

  const entry = await getPassEntry(portal, parsed.data.passId);
  if (!entry) return { ok: false, message: "Produktpass nicht gefunden." };

  const { kind, message, preferredContact } = parsed.data;
  const body = [
    `[${PASS_REQUESTS[kind].label.replace(" anfragen", "")} ${entry.pass.id}] ${entry.pass.product} (${entry.pass.brand})`,
    entry.pass.serialNumber ? `Seriennummer: ${entry.pass.serialNumber}` : null,
    `Kontakt gewünscht per: ${CONTACT_OPTIONS[preferredContact]}`,
    `Nachricht: ${message}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await portal.addFeedback({ projectId: entry.project.id, target: { kind: "position", id: entry.item.id }, message: body });
    return { ok: true, ref: res.id, message: "Danke – Ihre Anfrage ist bei uns. Wir melden uns innerhalb von zwei Werktagen." };
  } catch (err) {
    console.error("[portal] Produktpass-Anfrage fehlgeschlagen:", err);
    return FAILED;
  }
}

// ---------------------------------------------------------------- Neue Planung

const planningFormSchema = z
  .object({
    scope: z.enum(["neu", "erweiterung"]).default("neu"),
    projectId: z.union([idSchema, z.literal("")]).optional().default(""),
    room: text(2, 80, "Bitte den Raum angeben."),
    budget: z.enum(Object.keys(BUDGETS)).default(""),
    timeframe: z.enum(Object.keys(TIMEFRAMES)).default(""),
    message: text(10, 2500, "Bitte beschreiben Sie Ihr Vorhaben (mind. 10 Zeichen)."),
    preferredContact: z.enum(Object.keys(CONTACT_OPTIONS)).default("email"),
    preferredDates: futureDates,
  })
  .refine((v) => v.scope === "neu" || v.projectId, { path: ["projectId"], message: "Bitte das Projekt wählen, das erweitert werden soll." });

export async function startPlanning(_prev, formData) {
  if (await ipLimited()) return TOO_MANY;
  const portal = await getPortal("/de/portal/anfragen");
  const room = formData.get("room") === "__andere" ? formData.get("roomOther") : formData.get("room");
  const parsed = planningFormSchema.safeParse({
    scope: formData.get("scope") || "neu",
    projectId: formData.get("projectId") || "",
    room: room ?? "",
    budget: formData.get("budget") ?? "",
    timeframe: formData.get("timeframe") ?? "",
    message: formData.get("message") ?? "",
    preferredContact: formData.get("preferredContact") || "email",
    preferredDates: formDates(formData),
  });
  if (!parsed.success) return { ok: false, errors: errorsOf(parsed), message: "Bitte die markierten Felder prüfen." };
  if (await limited(portal.customerId)) return TOO_MANY;

  const v = parsed.data;
  if (v.scope === "erweiterung" && !(await portal.getProject(v.projectId))) return { ok: false, errors: { projectId: "Projekt nicht gefunden." } };

  const extra = [
    v.budget ? `Budgetrahmen (Angabe Kunde): ${BUDGETS[v.budget]}` : null,
    v.timeframe ? `Zeitraum: ${TIMEFRAMES[v.timeframe]}` : null,
  ].filter(Boolean);
  try {
    const res = await portal.requestPlanning({
      projectId: v.scope === "erweiterung" ? v.projectId : undefined,
      room: v.room,
      message: [v.message, ...extra].join("\n\n").slice(0, 3000),
      preferredContact: v.preferredContact,
      preferredDates: v.preferredDates,
    });
    return { ok: true, ref: res.id, message: "Danke – Ihre Planungsanfrage ist angekommen. Wir melden uns innerhalb von zwei Werktagen." };
  } catch (err) {
    console.error("[portal] Planungsanfrage fehlgeschlagen:", err);
    return FAILED;
  }
}
