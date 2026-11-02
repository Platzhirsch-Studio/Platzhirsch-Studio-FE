// src/lib/payments/deposit.js
// Anzahlungen (ANZAHLUNG_MODE=stripe): Mitarbeitende legen über den
// Admin-Endpunkt eine Anzahlung zu einer Auftrags-/Angebotsnummer an; der
// Kunde bekommt einen signierten Link /de/zahlung/anzahlung/<token> (Portal
// oder Mail). Erst beim Klick auf "Anzahlung bezahlen" entsteht serverseitig
// eine Checkout-Session (läuft 60 min), der Link selbst gilt bis `gueltig_bis`.
// Betrag immer vom Server (aus der Anzahlung), nie aus dem Browser.
// Keine "@/..."-Importe.
import { z } from "zod";
import { EMAIL_RE } from "../forms/schemas.js";
import { formatEuro } from "../commerce/priceRules.js";
import { CURRENCY, baseUrl, linkSecret, paymentMethodConfiguration, teamEmail } from "./config.js";
import { linkToken, logRef, newOrderId } from "./codes.js";
import { mailHtml } from "./mailer.js";
import { paymentEvent } from "./backoffice.js";

export const DEPOSIT_MIN_CENT = 100;
export const DEPOSIT_MAX_CENT = 100_000_00;
export const LINK_DAYS_DEFAULT = 14;
export const LINK_DAYS_MAX = 60;
export const SESSION_TTL_S = 60 * 60;
export const PAYABLE = Object.freeze(["offen", "fehlgeschlagen"]);

/** "1.250,50" | "1250.5" | 1250.5 → Cent (Ganzzahl) oder NaN. */
export function parseEuroCents(value) {
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value * 100) : NaN;
  let s = String(value ?? "").replace(/[\s€]/g, "");
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(",", ".");
  return /^\d+(\.\d{1,2})?$/.test(s) ? Math.round(Number(s) * 100) : NaN;
}

export const depositSchema = z.object({
  auftrag: z
    .string({ error: "Auftrags- oder Angebotsnummer fehlt." })
    .trim()
    .regex(/^[A-Za-z0-9][A-Za-z0-9/._-]{2,39}$/, "Auftrags- oder Angebotsnummer: 3 bis 40 Zeichen, Buchstaben, Ziffern, - / . _"),
  betrag: z.preprocess(
    parseEuroCents,
    z
      .number({ error: "Betrag in Euro angeben, z. B. 1250,00." })
      .int()
      .min(DEPOSIT_MIN_CENT, "Mindestens 1 €.")
      .max(DEPOSIT_MAX_CENT, "Höchstens 100.000 € je Link.")
  ),
  beschreibung: z
    .string()
    .trim()
    .max(200)
    .nullish()
    .transform((v) => v || ""),
  email: z
    .string()
    .trim()
    .max(254)
    .nullish()
    .transform((v) => v || "")
    .refine((v) => !v || EMAIL_RE.test(v), "E-Mail-Adresse prüfen."),
  kunde: z
    .string()
    .trim()
    .max(64)
    .regex(/^[A-Za-z0-9_-]*$/, "Kunden-Id: nur Buchstaben, Ziffern, - und _")
    .nullish()
    .transform((v) => v || ""),
  gueltig_tage: z.preprocess(
    (v) => (v === undefined || v === null || v === "" ? LINK_DAYS_DEFAULT : Number(v)),
    z.number().int().min(1).max(LINK_DAYS_MAX)
  ),
  senden: z.boolean().optional().default(false),
});

/** Link für Kunde/Portal aus der Id (nichts gespeichert). */
export function depositLink(id, env = process.env) {
  const secret = linkSecret(env);
  if (!secret) return null;
  return `${baseUrl(env)}/de/zahlung/anzahlung/${linkToken(id, secret)}`;
}

/** Öffentliche Sicht (Seite, Portal, Admin-Antwort): ohne E-Mail. */
export function publicDeposit(d, now = Date.now()) {
  const abgelaufen = PAYABLE.includes(d.status) && Date.parse(d.gueltig_bis) < now;
  return {
    id: d.id,
    auftrag: d.auftrag,
    betrag_cent: d.betrag_cent,
    betrag: formatEuro(d.betrag_cent / 100),
    beschreibung: d.beschreibung,
    status: abgelaufen ? "abgelaufen" : d.status,
    gueltig_bis: d.gueltig_bis,
    bezahlt: d.bezahlt || null,
    testmodus: d.livemode === false ? true : undefined,
  };
}

export function newDeposit(data, { now = Date.now(), id = newOrderId("AZ") } = {}) {
  return {
    id,
    art: "anzahlung",
    status: "offen",
    erstellt: new Date(now).toISOString(),
    gueltig_bis: new Date(now + data.gueltig_tage * 86_400_000).toISOString(),
    auftrag: data.auftrag,
    betrag_cent: data.betrag,
    waehrung: CURRENCY,
    beschreibung: data.beschreibung,
    email: data.email,
    kunde: data.kunde,
    session: null,
    session_url: null,
    session_ablauf: null,
    payment_intent: null,
    verlauf: [{ zeit: new Date(now).toISOString(), status: "offen" }],
  };
}

export function depositCheckoutParams(d, { env = process.env, now = Date.now(), token }) {
  const base = baseUrl(env);
  const pmc = paymentMethodConfiguration(env);
  return {
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: d.betrag_cent,
          product_data: {
            name: `Anzahlung zu Auftrag ${d.auftrag}`,
            ...(d.beschreibung ? { description: d.beschreibung } : {}),
          },
        },
      },
    ],
    ...(d.email ? { customer_email: d.email } : {}),
    client_reference_id: d.id,
    metadata: { art: "anzahlung", deposit_id: d.id, auftrag: d.auftrag },
    payment_intent_data: { metadata: { art: "anzahlung", deposit_id: d.id, auftrag: d.auftrag }, description: `Anzahlung ${d.auftrag}` },
    billing_address_collection: "auto",
    locale: "de",
    submit_type: "pay",
    expires_at: Math.floor(now / 1000) + SESSION_TTL_S,
    custom_text: { submit: { message: "Die Anzahlung wird auf der Rechnung zu Ihrem Auftrag ausgewiesen." } },
    success_url: `${base}/de/zahlung/erfolg?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/de/zahlung/abbruch?art=anzahlung&link=${encodeURIComponent(token)}`,
    ...(pmc ? { payment_method_configuration: pmc } : {}),
  };
}

/** Mail mit dem Zahlungslink (nur auf Wunsch der Mitarbeitenden: senden=true). */
export function depositLinkMail(d, link) {
  const lines = [
    "Guten Tag,",
    `wie besprochen senden wir Ihnen den Link für die Anzahlung zu Auftrag ${d.auftrag} über ${formatEuro(d.betrag_cent / 100)} (inkl. USt).${d.beschreibung ? `\n${d.beschreibung}` : ""}`,
    `Der Link gilt bis ${new Date(d.gueltig_bis).toLocaleDateString("de-AT", { timeZone: "Europe/Vienna" })}. Die Zahlung läuft über Stripe; Kartendaten erhalten wir nicht.`,
    "Die Anzahlung weisen wir auf der Rechnung zu Ihrem Auftrag aus. Bei Fragen erreichen Sie uns unter +43 5574 46255.",
    "Herzliche Grüße\nIhr Team von Platzhirsch Home Living",
  ];
  return { to: d.email, subject: `Anzahlung zu Auftrag ${d.auftrag}`, text: [...lines.slice(0, 2), link, ...lines.slice(2)].join("\n\n"), html: mailHtml(lines, { button: { href: link, label: "Anzahlung bezahlen" } }), tag: "anzahlung-link" };
}

/** Statuswerte, ab denen eine Anzahlung schon einmal bezahlt wurde. */
const SETTLED = Object.freeze(["bezahlt", "erstattet", "teilerstattet"]);

/**
 * Zweite bezahlte Session zu einer schon bezahlten Anzahlung (QA P2-1): z. B.
 * zwei Tabs oder eine neue Session kurz vor Ablauf der alten. Nicht still
 * schlucken: an der Anzahlung vermerken, Ereignis "anzahlung.doppelt" ans
 * Backoffice, Hinweis-Mail ans Team zur Rückerstattung im Stripe-Dashboard.
 * Idempotent je Session.
 */
async function markDuplicate(ctx, d, session, { livemode }) {
  if ((d.doppelt || []).some((x) => x.session === session.id)) return { result: "bereits_erfuellt" };
  const nowIso = new Date(ctx.now()).toISOString();
  const entry = { session: session.id, payment_intent: session.payment_intent || null, betrag_cent: session.amount_total, zeit: nowIso, livemode: Boolean(livemode) };
  const updated = await ctx.store.update("deposits", d.id, (x) => ({
    ...x,
    doppelt: [...(x.doppelt || []), entry],
    verlauf: [...x.verlauf, { zeit: nowIso, status: "doppelt_bezahlt" }],
  }));
  console.warn(`[payments] anzahlung ${d.id}: doppelt bezahlt (${logRef(session.id)}), Rückerstattung nötig`);
  const lines = [
    "Hinweis für das Team:",
    `Zur Anzahlung ${d.id} (Auftrag ${d.auftrag}) ist eine zweite Zahlung über ${formatEuro((session.amount_total || 0) / 100)} eingegangen.`,
    `Bitte im Stripe-Dashboard die Zahlung ${session.payment_intent || session.id} erstatten und die Kundin oder den Kunden kurz informieren.${livemode ? "" : " (Testmodus)"}`,
  ];
  try {
    await ctx.mailer.send({ to: teamEmail(ctx.env), subject: `${livemode ? "" : "[TEST] "}Doppelte Anzahlung: Auftrag ${d.auftrag}`, text: lines.join("\n\n"), html: mailHtml(lines), tag: "anzahlung-doppelt" });
  } catch (err) {
    console.error(`[payments] anzahlung ${d.id}: mail ${err?.message || err}`);
  }
  await ctx.backoffice.emit(
    paymentEvent({
      typ: "anzahlung.doppelt",
      art: "anzahlung",
      referenz: d.auftrag,
      betragCent: session.amount_total,
      zahlungsstatus: "doppelt_bezahlt",
      session: session.id,
      paymentIntent: session.payment_intent,
      livemode,
      now: new Date(ctx.now()),
      beleg: { anzahlung_id: d.id, hinweis: "Rückerstattung im Stripe-Dashboard auslösen" },
    })
  );
  return { result: "doppelt", deposit: updated };
}

/** Webhook: Zahlung bestätigt. Idempotent. */
export async function markDepositPaid(ctx, session, { livemode }) {
  const id = session?.metadata?.deposit_id;
  const d = id ? await ctx.store.get("deposits", id) : null;
  if (!d) return { result: "unbekannt" };
  if (SETTLED.includes(d.status) || d.bezahlt) {
    const paidSession = d.bezahlt_session || d.session;
    if (session.id && paidSession && session.id !== paidSession) return markDuplicate(ctx, d, session, { livemode });
    return { result: "bereits_erfuellt" };
  }
  const nowIso = new Date(ctx.now()).toISOString();
  const ok = session.amount_total === d.betrag_cent && String(session.currency).toLowerCase() === CURRENCY;
  const status = ok ? "bezahlt" : "pruefen";
  const updated = await ctx.store.update("deposits", id, (x) => ({
    ...x,
    status,
    bezahlt: ok ? nowIso : null,
    bezahlt_session: ok ? session.id : x.bezahlt_session || null,
    session: session.id,
    payment_intent: session.payment_intent || x.payment_intent,
    livemode: Boolean(livemode),
    verlauf: [...x.verlauf, { zeit: nowIso, status }],
  }));
  const email = session.customer_details?.email || d.email;
  if (ok && email) {
    const lines = [
      "Guten Tag,",
      `Ihre Anzahlung zu Auftrag ${d.auftrag} über ${formatEuro(d.betrag_cent / 100)} ist bei uns eingegangen. Danke.`,
      "Wir weisen sie auf der Rechnung zu Ihrem Auftrag aus. Die Zahlungsbestätigung von Stripe ersetzt die Rechnung nicht.",
      "Herzliche Grüße\nIhr Team von Platzhirsch Home Living",
    ];
    try {
      await ctx.mailer.send({ to: email, subject: `${livemode ? "" : "[TEST] "}Anzahlung erhalten: Auftrag ${d.auftrag}`, text: lines.join("\n\n"), html: mailHtml(lines), tag: "anzahlung-bestaetigung" });
    } catch (err) {
      console.error(`[payments] anzahlung ${id}: mail ${err?.message || err}`);
    }
  }
  const details = session.customer_details || {};
  await ctx.backoffice.emit(
    paymentEvent({
      typ: ok ? "anzahlung.bezahlt" : "anzahlung.pruefen",
      art: "anzahlung",
      referenz: d.auftrag,
      betragCent: session.amount_total,
      zahlungsstatus: status,
      session: session.id,
      paymentIntent: session.payment_intent,
      livemode,
      now: new Date(ctx.now()),
      beleg: { anzahlung_id: d.id, name: details.name || "", adresse: details.address || null, kunde: d.kunde || "" },
    })
  );
  return { result: ok ? "erfuellt" : "pruefen", deposit: updated };
}
