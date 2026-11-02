// src/lib/payments/withdrawal.js
// Widerrufsfunktion nach § 13a FAGG (seit 01.10.2026; DE § 356a BGB):
// Schaltfläche „Vertrag widerrufen“ → Angaben → „Widerruf bestätigen“.
// Danach sofort eine Eingangsbestätigung per E-Mail (dauerhafter
// Datenträger) mit Inhalt, Datum und Uhrzeit.
// Die Antwort ist immer gleich, ob die Bestellung existiert oder nicht
// (keine Auskunft über fremde Bestellungen). Passt die E-Mail zur Bestellung,
// wird die Bestellung markiert und noch nicht eingelöste Codes werden
// gesperrt; die Rückzahlung löst das Team im Stripe-Dashboard aus
// (→ charge.refunded im Webhook).
// Missbrauchsschutz (QA P2-2, kein Mail-Relay): Ist die Erklärung KEINER
// Bestellung zuzuordnen (Bestellnummer/Code passt nicht zur E-Mail), enthält
// die Bestätigung weder Namen noch Freitext noch die Angabe, nur
// Eingangsnummer und Zeitpunkt. Der volle Inhalt bleibt in der Ablage. Je
// Empfängeradresse gehen höchstens RECIPIENT_LIMIT solcher Bestätigungen in
// RECIPIENT_WINDOW_MS hinaus (gezählt über die Ablage, übersteht Neustarts).
// Keine "@/..."-Importe.
import { z } from "zod";
import { EMAIL_RE } from "../forms/schemas.js";
import { newOrderId, normalizeCode, codeHash, logRef } from "./codes.js";
import { mailHtml } from "./mailer.js";
import { paymentEvent } from "./backoffice.js";

export const MAX_BYTES = 6 * 1024;
export const RECIPIENT_LIMIT = 3;
export const RECIPIENT_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Wie viele nicht zugeordnete Widerrufe gingen zuletzt an diese Adresse? */
async function recentUnmatched(store, email, now) {
  const e = email.toLowerCase();
  const since = now - RECIPIENT_WINDOW_MS;
  const all = await store.list("withdrawals");
  return all.filter((w) => !w.bestellung && String(w.email || "").toLowerCase() === e && Date.parse(w.zeit) >= since).length;
}

export const withdrawalSchema = z.object({
  name: z.string({ error: "Bitte geben Sie Ihren Namen an." }).trim().min(2, "Bitte geben Sie Ihren Namen an.").max(200),
  email: z
    .string({ error: "Bitte geben Sie Ihre E-Mail-Adresse an." })
    .trim()
    .max(254)
    .refine((v) => EMAIL_RE.test(v), "Bitte prüfen Sie die E-Mail-Adresse."),
  bestellung: z
    .string({ error: "Bitte geben Sie die Bestellnummer oder den Gutscheincode an." })
    .trim()
    .min(6, "Bitte geben Sie die Bestellnummer oder den Gutscheincode an.")
    .max(40, "Diese Angabe ist zu lang."),
  nachricht: z
    .string()
    .max(1000, "Höchstens 1000 Zeichen.")
    .nullish()
    .transform((v) => (v ? v.trim() : "")),
  bestaetigt: z.literal(true, { error: "Bitte bestätigen Sie den Widerruf." }),
});

const ORDER_RE = /^G-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/** Bestellung zur Eingabe (Bestellnummer oder Code) finden. */
async function findOrder(store, input) {
  const s = input.trim().toUpperCase();
  if (ORDER_RE.test(s)) return store.get("orders", s);
  const norm = normalizeCode(s);
  if (!norm) return null;
  const entry = await store.get("register", codeHash(norm));
  return entry ? store.get("orders", entry.bestellung) : null;
}

export async function recordWithdrawal(ctx, data) {
  const now = ctx.now();
  const nowIso = new Date(now).toISOString();
  const id = newOrderId("W");
  const order = await findOrder(ctx.store, data.bestellung);
  const matches = Boolean(order && order.kaeufer?.email?.toLowerCase() === data.email.toLowerCase());
  const prior = matches ? 0 : await recentUnmatched(ctx.store, data.email, now);
  await ctx.store.put("withdrawals", id, { id, zeit: nowIso, name: data.name, email: data.email, angabe: data.bestellung, nachricht: data.nachricht, bestellung: matches ? order.id : null });

  if (matches) {
    let gesperrt = 0;
    for (const c of order.codes || []) {
      await ctx.store.update("register", c.hash, (r) => {
        if (!r || r.status !== "aktiv" || r.rest_cent < r.wert_cent) return undefined;
        gesperrt++;
        return { ...r, status: "gesperrt", grund: `widerruf ${id}` };
      });
    }
    await ctx.store.update("orders", order.id, (o) => ({ ...o, widerruf: { id, zeit: nowIso, gesperrt }, verlauf: [...o.verlauf, { zeit: nowIso, status: "widerruf_eingegangen" }] }));
    await ctx.backoffice.emit(paymentEvent({ typ: "gutschein.widerruf", art: "gutschein", referenz: order.id, betragCent: order.summe_cent, zahlungsstatus: "widerruf_eingegangen", paymentIntent: order.payment_intent, livemode: order.livemode, now: new Date(now) }));
  }

  const when = new Intl.DateTimeFormat("de-AT", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Vienna" }).format(new Date(now));
  const lines = matches
    ? [
        `Guten Tag ${data.name},`,
        `wir bestätigen den Eingang Ihres Widerrufs am ${when} (Eingangsnummer ${id}).`,
        `Ihre Angaben:\nName: ${data.name}\nE-Mail: ${data.email}\nBestellnummer oder Gutscheincode: ${data.bestellung}${data.nachricht ? `\nNachricht: ${data.nachricht}` : ""}`,
        "Wir prüfen den Widerruf und zahlen den Betrag spätestens binnen 14 Tagen über das ursprüngliche Zahlungsmittel zurück. Noch nicht eingelöste Gutscheincodes dieser Bestellung sind gesperrt.",
        "Bei Fragen erreichen Sie uns unter +43 5574 46255 oder info@platzhirsch.studio.",
        "Herzliche Grüße\nIhr Team von Platzhirsch Home Living",
      ]
    : [
        "Guten Tag,",
        `wir bestätigen den Eingang eines Widerrufs, der am ${when} mit dieser E-Mail-Adresse abgegeben wurde (Eingangsnummer ${id}).`,
        "Wir ordnen ihn der Bestellung zu und melden uns, falls wir dafür noch etwas von Ihnen brauchen.",
        "Falls Sie keinen Widerruf abgegeben haben, können Sie diese Nachricht ignorieren.",
        "Bei Fragen erreichen Sie uns unter +43 5574 46255 oder info@platzhirsch.studio.",
        "Herzliche Grüße\nIhr Team von Platzhirsch Home Living",
      ];
  const limited = !matches && prior >= RECIPIENT_LIMIT;
  if (limited) {
    console.warn(`[payments] widerruf ${id}: Bestätigung nicht gesendet, Limit je Adresse erreicht (an ${logRef(data.email)})`);
  } else {
    try {
      await ctx.mailer.send({ to: data.email, subject: `Eingangsbestätigung Ihres Widerrufs (${id})`, text: lines.join("\n\n"), html: mailHtml(lines), tag: "widerruf" });
    } catch (err) {
      console.error(`[payments] widerruf ${id}: mail ${err?.message || err}`);
    }
  }
  console.info(`[payments] widerruf ${id} (${matches ? "zugeordnet" : "nicht zugeordnet"}, an ${logRef(data.email)})`);
  return { id, zeit: nowIso };
}
