// src/lib/shop/widerruf.js
// Online-Rücktrittsfunktion des Onlineshops nach § 13a FAGG (seit 01.10.2026;
// DE § 356a BGB): Seite /[locale]/shop/recht/widerruf-formular → Angaben des
// Muster-Widerrufsformulars (Anhang I Teil B FAGG) → Schaltfläche „Widerruf
// bestätigen“ → Eingangsnummer + Zeitpunkt auf der Bestätigungsseite und
// Eingangsbestätigung auf einem dauerhaften Datenträger (E-Mail) mit Inhalt,
// Datum und Uhrzeit der Erklärung.
//
// Ablage: Sammlung "widerrufe" im Shop-Store (.data/shop, nie Backoffice).
// Passt die Bestellnummer (PH-S-…) zur E-Mail der Bestellung, wird die
// Bestellung markiert (widerruf + Verlauf); die Rückzahlung löst das Team im
// Stripe-Dashboard aus (charge.refunded → webhook.js). Die Antwort an den
// Browser ist immer gleich, ob die Bestellung existiert oder nicht (keine
// Auskunft über fremde Bestellungen).
//
// Mail: über den Payments-Mailer (src/lib/payments/mailer.js: Standard
// „outbox“ = Ordner auf der Platte, Produktion ohne Mail-Anbieter „gesperrt“).
// Im SHOP_MODE "test" wird KEINE Mail erzeugt (gleiche Regel wie handlers.js:
// mail.status "nicht_gesendet", grund "testmodus"); nur "live" sendet.
// Nicht zugeordnete Erklärungen bekommen – wie withdrawal.js – eine
// Bestätigung ohne Freitext (kein Mail-Relay), höchstens RECIPIENT_LIMIT je
// Adresse in RECIPIENT_WINDOW_MS.
// Keine "@/"-Importe (node --test).
import { z } from "zod";
import { EMAIL_RE } from "../forms/schemas.js";
import { errorResponse, guardForm } from "../forms/guard.js";
import { outerHeadersOf } from "../forms/forward.js";
import { logRef, newOrderId } from "../payments/codes.js";
import { mailHtml } from "../payments/mailer.js";
import { ANBIETER, ANSCHRIFT } from "./legalTexte.js";
import { shopMode } from "./mode.js";

export const MAX_BYTES = 8 * 1024;
export const RECIPIENT_LIMIT = 3;
export const RECIPIENT_WINDOW_MS = 24 * 60 * 60 * 1000;
export const BESTELLNUMMER_RE = /^PH-S-\d{6}-[A-F0-9]{6}$/;
const DATUM_RE = /^\d{4}-\d{2}-\d{2}$/;

const trim = (max) => z.string().trim().max(max);
const datum = () =>
  z
    .string()
    .trim()
    .max(10)
    .nullish()
    .transform((v) => v || "")
    .refine((v) => !v || DATUM_RE.test(v), "Bitte geben Sie das Datum als Jahr-Monat-Tag an.");

/**
 * Felder des Muster-Widerrufsformulars (Anhang I Teil B FAGG) als Online-Formular.
 * Bestellnummer optional (Inhaber 03.11.2026): Die Funktion steht auch für
 * Verträge außerhalb des Onlineshops offen (/widerruf); ohne Nummer wird die
 * Erklärung nicht zugeordnet und wie eine unbekannte Nummer behandelt.
 */
export const shopWiderrufSchema = z.object({
  bestellung: trim(40)
    .nullish()
    .transform((v) => v || ""),
  bestelltAm: datum(),
  erhaltenAm: datum(),
  name: trim(200).min(2, "Bitte geben Sie Ihren Namen an."),
  anschrift: trim(400).min(5, "Bitte geben Sie Ihre Anschrift an."),
  email: trim(254).refine((v) => EMAIL_RE.test(v), "Bitte prüfen Sie die E-Mail-Adresse."),
  artikel: trim(1500).min(2, "Bitte nennen Sie die Artikel, die Sie widerrufen."),
  bestaetigt: z.literal(true, { error: "Bitte bestätigen Sie den Widerruf." }),
});

async function recentUnmatched(store, email, now) {
  const e = email.toLowerCase();
  const since = now - RECIPIENT_WINDOW_MS;
  const all = await store.list("widerrufe");
  return all.filter((w) => !w.bestellung && String(w.email || "").toLowerCase() === e && Date.parse(w.zeit) >= since).length;
}

const wann = (ms) => new Intl.DateTimeFormat("de-AT", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Vienna" }).format(new Date(ms));
const tag = (iso) => (iso ? iso.split("-").reverse().join(".") : "–");

/** Inhalt der Erklärung als Klartext (für die Eingangsbestätigung, § 13a Abs 2 FAGG). */
export function erklaerungText(d) {
  return [
    `Bestellnummer: ${d.bestellung || "– (Vertrag außerhalb des Onlineshops)"}`,
    `Bestellt am: ${tag(d.bestelltAm)} · Erhalten am: ${tag(d.erhaltenAm)}`,
    `Name: ${d.name}`,
    `Anschrift: ${d.anschrift}`,
    `E-Mail: ${d.email}`,
    `Widerrufene Artikel: ${d.artikel}`,
  ].join("\n");
}

/**
 * Erklärung ablegen, Bestellung markieren, Eingangsbestätigung bauen/senden.
 * @param {{ store: object, now: () => number, env?: object, mailer?: object|null, mode?: "off"|"test"|"live" }} ctx
 * @returns {Promise<{ id: string, zeit: string, zugeordnet: boolean, mail: string }>}
 */
export async function recordShopWithdrawal(ctx, data) {
  const now = ctx.now();
  const zeit = new Date(now).toISOString();
  const id = newOrderId("WS");
  const nummer = String(data.bestellung || "").trim().toUpperCase();
  const order = BESTELLNUMMER_RE.test(nummer) ? await ctx.store.get("bestellungen", nummer) : null;
  const zugeordnet = Boolean(order && String(order.kunde?.email || "").toLowerCase() === data.email.toLowerCase());
  const prior = zugeordnet ? 0 : await recentUnmatched(ctx.store, data.email, now);
  await ctx.store.put("widerrufe", id, { id, zeit, ...data, bestaetigt: undefined, bestellung: zugeordnet ? order.id : null, angabe: nummer || null });
  if (zugeordnet) {
    await ctx.store.update("bestellungen", order.id, (o) => ({ ...o, widerruf: { id, zeit }, verlauf: [...(o.verlauf || []), { zeit, status: "widerruf_eingegangen" }] }));
  }

  const mode = ctx.mode || shopMode(ctx.env || process.env);
  const lines = zugeordnet
    ? [
        `Guten Tag ${data.name},`,
        `wir bestätigen den Eingang Ihres Widerrufs am ${wann(now)} (Eingangsnummer ${id}).`,
        `Inhalt Ihrer Erklärung:\n${erklaerungText(data)}`,
        "Bitte senden Sie die Waren binnen 14 Tagen an uns zurück oder übergeben Sie sie im Showroom. Wir erstatten alle Zahlungen einschließlich der Lieferkosten (Standardlieferung) spätestens binnen 14 Tagen über das ursprüngliche Zahlungsmittel, sobald wir die Waren zurückerhalten oder Ihren Nachweis der Rücksendung haben.",
        `${ANBIETER.firma} („${ANBIETER.marke}“), ${ANSCHRIFT} · Telefon ${ANBIETER.telefon} · ${ANBIETER.email}`,
      ]
    : [
        "Guten Tag,",
        `wir bestätigen den Eingang eines Widerrufs, der am ${wann(now)} mit dieser E-Mail-Adresse abgegeben wurde (Eingangsnummer ${id}).`,
        "Wir ordnen ihn der Bestellung zu und melden uns, falls wir dafür noch etwas von Ihnen brauchen. Falls Sie keinen Widerruf abgegeben haben, können Sie diese Nachricht ignorieren.",
        `${ANBIETER.firma} („${ANBIETER.marke}“), ${ANSCHRIFT} · Telefon ${ANBIETER.telefon} · ${ANBIETER.email}`,
      ];
  let mail = "nicht_gesendet";
  if (mode !== "live") mail = "testmodus";
  else if (!zugeordnet && prior >= RECIPIENT_LIMIT) mail = "limit";
  else if (!ctx.mailer) mail = "kein_mailer";
  else {
    try {
      const r = await ctx.mailer.send({ to: data.email, subject: `Eingangsbestätigung Ihres Widerrufs (${id})`, text: lines.join("\n\n"), html: mailHtml(lines), tag: "shop-widerruf" });
      mail = r?.ok === false ? "fehlgeschlagen" : "gesendet";
    } catch (err) {
      console.error(`[shop] widerruf ${id}: mail ${err?.message || err}`);
      mail = "fehlgeschlagen";
    }
  }
  await ctx.store.update("widerrufe", id, (w) => (w ? { ...w, mail } : w));
  console.info(`[shop] widerruf ${id} (${zugeordnet ? "zugeordnet" : "nicht zugeordnet"}, mail ${mail}, an ${logRef(data.email)})`);
  return { id, zeit, zugeordnet, mail };
}

const notFound = () => Response.json({ success: false, code: "not_found" }, { status: 404 });
function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * POST /api/shop/widerruf. SHOP_MODE off → 404 (wie alle Shop-Routen).
 * @param {{ env: object, store: object, now: () => number, payments?: { mailer?: object } }} ctx
 */
export function shopWiderrufHandler(ctx, { limiter, resolveHeaders } = {}) {
  return async function POST(request) {
    const mode = shopMode(ctx.env);
    if (mode === "off") return notFound();
    if (!sameOrigin(request)) return errorResponse("forbidden", 403, { message: "Forbidden" });
    try {
      const guard = await guardForm(request, shopWiderrufSchema, {
        route: "shop-widerruf",
        maxBytes: MAX_BYTES,
        fakeSuccess: () => ({ success: true, id: "WS-0000-0000", zeit: new Date(ctx.now()).toISOString() }),
        outerHeaders: await outerHeadersOf(resolveHeaders),
        limiter,
        now: ctx.now(),
      });
      if (!guard.ok) return guard.response;
      const r = await recordShopWithdrawal({ store: ctx.store, now: ctx.now, env: ctx.env, mode, mailer: ctx.payments?.mailer || null }, guard.data);
      return Response.json({ success: true, id: r.id, zeit: r.zeit });
    } catch (err) {
      console.error(`[shop] widerruf: intern ${err?.message || err}`);
      return errorResponse("internal", 500);
    }
  };
}
