// src/lib/payments/voucherOrder.js
// Gutscheinkauf über Stripe Checkout (VOUCHER_MODE=stripe).
//   1. voucherOrderSchema    prüft das Formular (Betrag frei ab 25 € oder
//                            Vorschlag, Stückzahl, Motiv, Widmung, Bestätigung
//                            der Bedingungen – nie vorangekreuzt).
//   2. checkoutParams        Checkout-Session: Preis immer vom Server, keine
//                            payment_method_types (Zahlungsarten kommen aus
//                            dem Stripe-Dashboard), Rücksprung /de/zahlung/…
//   3. fulfilVoucherOrder    NUR nach bestätigter Zahlung (Webhook): Codes
//                            erzeugen, Register, PDF, Mail, Backoffice-Ereignis.
// Keine "@/..."-Importe.
import { z } from "zod";
import { EMAIL_RE } from "../forms/schemas.js";
import { formatEuro } from "../commerce/priceRules.js";
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  GREETING_MAX,
  MOTIF_IDS,
  ONLINE_QUANTITY_MAX,
  ONLINE_TOTAL_MAX,
  motifLabel,
  parseAmount,
} from "../commerce/voucherConfig.js";
import { TERMS_STAND, VOUCHER_VALIDITY, voucherValidityText } from "../commerce/voucherTerms.js";
import { WITHDRAWAL_STAND } from "../commerce/withdrawalText.js";
import { LEGAL_NAME } from "../site.js";
import { CURRENCY, baseUrl, paymentMethodConfiguration } from "./config.js";
import { codeHash, logRef, newOrderId, newVoucherCode, normalizeCode } from "./codes.js";
import { voucherPdf } from "./pdf.js";
import { mailHtml } from "./mailer.js";
import { paymentEvent } from "./backoffice.js";

export const MAX_BYTES = 8 * 1024;
// Checkout-Session läuft nach 60 min ab (Stripe-Minimum 30 min).
export const SESSION_TTL_S = 60 * 60;

const optional = (max) =>
  z
    .string()
    .max(max, "Diese Angabe ist zu lang.")
    .nullish()
    .transform((v) => (v ? v.trim() : ""));

export const voucherOrderSchema = z
  .object({
    betrag: z.preprocess(
      parseAmount,
      z
        .number({ error: "Bitte geben Sie einen Betrag an." })
        .int("Bitte einen Betrag in ganzen Euro angeben.")
        .min(AMOUNT_MIN, `Der Betrag beginnt bei ${AMOUNT_MIN} €.`)
        .max(AMOUNT_MAX, `Für Beträge über ${formatEuro(AMOUNT_MAX)} sprechen Sie uns bitte direkt an.`)
    ),
    anzahl: z.preprocess(
      (v) => (v === undefined || v === null || v === "" ? 1 : Number(v)),
      z
        .number({ error: "Bitte eine ganze Zahl angeben." })
        .int("Bitte eine ganze Zahl angeben.")
        .min(1, "Mindestens 1 Gutschein.")
        .max(ONLINE_QUANTITY_MAX, `Online höchstens ${ONLINE_QUANTITY_MAX} Gutscheine je Bestellung.`)
    ),
    motiv: z.enum(MOTIF_IDS, { error: "Bitte wählen Sie ein Motiv." }),
    empfaenger: optional(120),
    grusstext: optional(GREETING_MAX),
    firma: optional(200),
    name: z.string({ error: "Bitte geben Sie Ihren Namen an." }).trim().min(2, "Bitte geben Sie Ihren Namen an.").max(200),
    email: z
      .string({ error: "Bitte geben Sie Ihre E-Mail-Adresse an." })
      .trim()
      .max(254)
      .refine((v) => EMAIL_RE.test(v), "Bitte prüfen Sie die E-Mail-Adresse."),
    // Bestätigung der Bedingungen: muss aktiv gesetzt sein (true), nie Standard.
    bedingungen: z.literal(true, { error: "Bitte bestätigen Sie die Gutscheinbedingungen und die Widerrufsbelehrung." }),
  })
  .superRefine((d, ctx) => {
    if (d.betrag * d.anzahl > ONLINE_TOTAL_MAX) {
      ctx.addIssue({ code: "custom", path: ["anzahl"], message: `Online bis ${formatEuro(ONLINE_TOTAL_MAX)} je Bestellung. Für mehr senden Sie uns bitte eine Anfrage.` });
    }
  });

/** Bestellung (vor der Zahlung) aus geprüften Daten. */
export function newVoucherOrder(data, { now = Date.now(), id = newOrderId("G") } = {}) {
  const betragCent = data.betrag * 100;
  return {
    id,
    art: "gutschein",
    status: "offen",
    erstellt: new Date(now).toISOString(),
    betrag_cent: betragCent,
    anzahl: data.anzahl,
    summe_cent: betragCent * data.anzahl,
    waehrung: CURRENCY,
    motiv: data.motiv,
    empfaenger: data.empfaenger || "",
    grusstext: data.grusstext || "",
    kaeufer: { name: data.name, email: data.email, firma: data.firma || "" },
    zustimmung: { bedingungen: TERMS_STAND, widerruf: WITHDRAWAL_STAND, zeit: new Date(now).toISOString() },
    session: null,
    payment_intent: null,
    codes: [],
    mail: null,
    verlauf: [{ zeit: new Date(now).toISOString(), status: "offen" }],
  };
}

/** Parameter der Checkout-Session. Preis kommt ausschließlich aus `order`. */
export function checkoutParams(order, { env = process.env, now = Date.now() } = {}) {
  const base = baseUrl(env);
  const pmc = paymentMethodConfiguration(env);
  const betrag = order.betrag_cent / 100;
  return {
    mode: "payment",
    line_items: [
      {
        quantity: order.anzahl,
        price_data: {
          currency: CURRENCY,
          unit_amount: order.betrag_cent,
          product_data: {
            name: `Gutschein Platzhirsch Home Living, ${formatEuro(betrag)}`,
            description: `Wertgutschein, Motiv ${motifLabel(order.motiv)}, als PDF per E-Mail`,
          },
        },
      },
    ],
    customer_email: order.kaeufer.email,
    client_reference_id: order.id,
    metadata: { art: "gutschein", order_id: order.id },
    payment_intent_data: { metadata: { art: "gutschein", order_id: order.id }, description: `Gutschein ${order.id}` },
    billing_address_collection: "required",
    locale: "de",
    submit_type: "pay",
    expires_at: Math.floor(now / 1000) + SESSION_TTL_S,
    custom_text: {
      submit: { message: "Der Gutschein kommt nach bestätigter Zahlung als PDF per E-Mail. Die Rechnung senden wir gesondert." },
    },
    success_url: `${base}/de/zahlung/erfolg?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/de/zahlung/abbruch?art=gutschein`,
    ...(pmc ? { payment_method_configuration: pmc } : {}),
    ...(env.STRIPE_INVOICE_CREATION === "1" ? { invoice_creation: { enabled: true } } : {}),
  };
}

/** Datum TT.MM.JJJJ in Wiener Zeit. */
export const dateAt = (ms) => new Intl.DateTimeFormat("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Vienna" }).format(new Date(ms));

/** Einzigartigen Code erzeugen (Register-Prüfung, bis zu 5 Versuche). */
export async function uniqueCode(store, { test, rng } = {}) {
  for (let i = 0; i < 5; i++) {
    const code = newVoucherCode({ test, rng });
    const hash = codeHash(normalizeCode(code));
    if (!(await store.get("register", hash))) return { code, hash };
  }
  throw new Error("Kein eindeutiger Gutscheincode");
}

/** Mail mit den Gutschein-PDFs. */
export function voucherMail(order, vouchers, { env, now, validity = VOUCHER_VALIDITY }) {
  const validityText = voucherValidityText(validity).print;
  const base = baseUrl(env);
  const many = vouchers.length > 1;
  const test = vouchers.some((v) => v.test);
  const lines = [
    `Guten Tag ${order.kaeufer.name},`,
    `danke für Ihre Bestellung ${order.id}. Ihre Zahlung ist bestätigt. Im Anhang ${many ? `finden Sie ${vouchers.length} Gutscheine` : "finden Sie Ihren Gutschein"} über je ${formatEuro(order.betrag_cent / 100)} als PDF zum Ausdrucken oder Weiterschicken.`,
    `${many ? "Gutscheincodes" : "Gutscheincode"}:\n${vouchers.map((v) => v.code).join("\n")}`,
    `Einlösbar im Showroom in Lochau und für Bestellungen im Onlineshop (Code vor der Bestellung an uns), auch in Teilbeträgen; nicht im Café. ${validityText}. Bitte behandeln Sie den Code wie Bargeld.`,
    `Rechnung: Die Rechnung senden wir Ihnen gesondert per E-Mail. Die Zahlungsbestätigung von Stripe ist kein Ersatz dafür.`,
    `Gutscheinbedingungen: ${base}/de/gutscheinbedingungen\nWiderruf innerhalb von 14 Tagen, solange der Gutschein nicht eingelöst ist: ${base}/de/zahlung/widerruf`,
    "Wir freuen uns auf den Besuch im Showroom.\nIhr Team von Platzhirsch Home Living",
  ];
  if (test) lines.unshift("TESTMODUS: Diese Gutscheine stammen aus einer Testzahlung und sind nicht einlösbar.");
  return {
    to: order.kaeufer.email,
    subject: `${test ? "[TEST] " : ""}Ihr Gutschein von Platzhirsch Home Living (${order.id})`,
    text: lines.join("\n\n"),
    html: mailHtml(lines),
    tag: "gutschein",
    attachments: vouchers.map((v, i) => ({
      filename: `Gutschein-${order.id}${many ? `-${i + 1}` : ""}.pdf`,
      contentType: "application/pdf",
      content: voucherPdf({
        code: v.code,
        amountText: formatEuro(order.betrag_cent / 100),
        recipient: order.empfaenger,
        greeting: order.grusstext,
        motif: order.motiv,
        orderId: order.id,
        issuedAt: dateAt(now),
        validity: validityText,
        issuer: LEGAL_NAME,
        termsUrl: "platzhirsch.studio/de/gutscheinbedingungen",
        test: v.test,
      }),
    })),
  };
}

/**
 * Nach bestätigter Zahlung. Idempotent: eine bereits bezahlte Bestellung
 * bekommt keine neuen Codes. Prüft Betrag und Währung gegen die Bestellung.
 * @returns {Promise<{ result: string }>}
 */
export async function fulfilVoucherOrder(ctx, session, { livemode }) {
  const orderId = session?.metadata?.order_id;
  const order = orderId ? await ctx.store.get("orders", orderId) : null;
  if (!order) {
    console.warn(`[payments] gutschein: unbekannte Bestellung (session ${logRef(session?.id)})`);
    return { result: "unbekannt" };
  }
  if (order.codes.length) return { result: "bereits_erfuellt" };
  const nowMs = ctx.now();
  if (session.amount_total !== order.summe_cent || String(session.currency).toLowerCase() !== CURRENCY) {
    await ctx.store.update("orders", order.id, (o) => ({ ...o, status: "pruefen", verlauf: [...o.verlauf, { zeit: new Date(nowMs).toISOString(), status: "pruefen", grund: "betrag" }] }));
    console.error(`[payments] gutschein ${order.id}: Betrag/Währung weicht ab, keine Codes`);
    await ctx.backoffice.emit(paymentEvent({ typ: "gutschein.pruefen", art: "gutschein", referenz: order.id, betragCent: session.amount_total, zahlungsstatus: "pruefen", session: session.id, paymentIntent: session.payment_intent, livemode, now: new Date(nowMs) }));
    return { result: "pruefen" };
  }

  const test = !livemode;
  const vouchers = [];
  for (let i = 0; i < order.anzahl; i++) {
    const { code, hash } = await uniqueCode(ctx.store, { test });
    const entry = {
      hash,
      ende: code.slice(-4),
      bestellung: order.id,
      wert_cent: order.betrag_cent,
      rest_cent: order.betrag_cent,
      status: test ? "test" : "aktiv",
      test,
      ausgestellt: new Date(nowMs).toISOString(),
      einloesungen: [],
    };
    if (!(await ctx.store.insert("register", hash, entry))) throw new Error("Register-Kollision");
    vouchers.push({ code, hash, test });
  }

  const paid = await ctx.store.update("orders", order.id, (o) => ({
    ...o,
    status: "bezahlt",
    bezahlt: new Date(nowMs).toISOString(),
    session: session.id,
    payment_intent: session.payment_intent || o.payment_intent,
    livemode: Boolean(livemode),
    codes: vouchers.map((v) => ({ hash: v.hash, ende: v.code.slice(-4) })),
    verlauf: [...o.verlauf, { zeit: new Date(nowMs).toISOString(), status: "bezahlt" }],
  }));

  // Mail: Fehler blockieren nicht (Status "fehlgeschlagen", Team stellt über
  // das Register einen Ersatzgutschein aus).
  let mail = { status: "fehlgeschlagen" };
  try {
    const r = await ctx.mailer.send(voucherMail(paid, vouchers, { env: ctx.env, now: nowMs }));
    mail = { status: r.ok ? "gesendet" : "fehlgeschlagen", adapter: ctx.mailer.kind, zeit: new Date(nowMs).toISOString() };
  } catch (err) {
    console.error(`[payments] gutschein ${order.id}: mail ${err?.message || err}`);
  }
  await ctx.store.update("orders", order.id, (o) => ({ ...o, mail }));

  const details = session.customer_details || {};
  await ctx.backoffice.emit(
    paymentEvent({
      typ: "gutschein.bezahlt",
      art: "gutschein",
      referenz: order.id,
      betragCent: order.summe_cent,
      zahlungsstatus: "bezahlt",
      session: session.id,
      paymentIntent: session.payment_intent,
      livemode,
      now: new Date(nowMs),
      beleg: { name: details.name || order.kaeufer.name, firma: order.kaeufer.firma || "", adresse: details.address || null, anzahl: order.anzahl, einzelwert_cent: order.betrag_cent, codes_ende: vouchers.map((v) => v.code.slice(-4)) },
    })
  );
  return { result: "erfuellt", codes: vouchers.length };
}
