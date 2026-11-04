// src/lib/shop/handlers.js
// HTTP-Handler des Shops (dünne route.js-Dateien unter src/app/api/shop/):
//   POST /api/shop/versand    Warenkorb bepreisen + Versandtarif (Tarif-ID mit Ablaufzeit)
//   POST /api/shop/checkout   Bestellung anlegen → Stripe Checkout (Test: Mock/Testschlüssel)
//                             oder „Reservieren & im Showroom abholen“ (Zahlung vor Ort)
// SHOP_MODE off → jede Anfrage 404. Preise und Versand IMMER vom Server; der
// Browser schickt nur slug/variante/menge und die ANGEZEIGTEN Summen, die hier
// gegengeprüft werden (Abweichung → 409, nie still ein anderer Betrag).
// Mail: nur die Vertragsbestätigung (orderMail.js; live jeder Mailer, test nur
// Mock-Mailer). Kein Backoffice. Keine "@/"-Importe (node --test).
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { errorResponse, guardForm, readCapped } from "../forms/guard.js";
import { outerHeadersOf } from "../forms/forward.js";
import { EMAIL_RE, PHONE_RE } from "../forms/schemas.js";
import { baseUrl, stripeKeyKind } from "../payments/config.js";
import { QUOTE_TTL_MS, LAND_IDS, versandLandOk } from "../commerce/shipping/config.js";
import { shippingAdapterFor, versandTarif } from "../commerce/shipping/index.js";
import { heuteIso } from "../katalog/config.js";
import { textOf } from "../katalog/schema.js";
import { cartHash, normalizeCart, priceCart, totals } from "./cart.js";
import { shopMode } from "./mode.js";
import { fillCopy, shopCopy } from "./copy.js";
import { ustKlasse, ustSatz } from "./ust.js";
import { sendeVertragsbestaetigung } from "./orderMail.js";

export const MAX_BYTES = 16 * 1024;
const notFound = () => Response.json({ success: false, code: "not_found" }, { status: 404 });
const LOCALES = ["de", "en", "fr", "it"];
const newId = () => `PH-S-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
const newToken = () => randomBytes(18).toString("hex");

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

const trim = (max) => z.string().trim().max(max);
const adresseSchema = z.object({
  land: z.enum(LAND_IDS),
  plz: trim(12).regex(/^[A-Za-z0-9 -]{3,12}$/, "Bitte prüfen Sie die Postleitzahl."),
  ort: trim(80).min(2, "Bitte geben Sie den Ort an."),
  strasse: trim(120).min(2, "Bitte geben Sie die Straße an."),
  hausnr: trim(20).min(1, "Bitte geben Sie die Hausnummer an."),
  zusatz: trim(80).optional().default(""),
});
const cartSchema = z.array(z.object({ slug: z.string().max(120), variante: z.string().max(64).optional(), menge: z.coerce.number() }).loose()).max(50);

export const versandSchema = z.object({ cart: cartSchema, ziel: z.object({ land: z.enum(LAND_IDS), plz: trim(12), ort: trim(80).optional().default(""), strasse: trim(120).optional().default(""), hausnr: trim(20).optional().default("") }).optional(), locale: z.enum(LOCALES).optional().default("de") });

export const checkoutSchema = z.object({
  cart: cartSchema,
  lieferart: z.enum(["versand", "abholung"]),
  zahlung: z.enum(["online", "vorort"]),
  kunde: z.object({
    name: trim(120).min(2, "Bitte geben Sie Ihren Namen an."),
    email: trim(254).refine((v) => EMAIL_RE.test(v), "Bitte prüfen Sie die E-Mail-Adresse."),
    telefon: trim(40).optional().default("").refine((v) => !v || PHONE_RE.test(v), "Bitte prüfen Sie die Telefonnummer."),
  }),
  adresse: adresseSchema.optional(),
  tarifId: z.string().regex(/^q_[a-f0-9]{24}$/).optional(),
  angezeigt: z.object({ versandCent: z.number().int().min(0), gesamtCent: z.number().int().min(0) }),
  locale: z.enum(LOCALES).optional().default("de"),
});

/** Gemeinsamer Kontext: { env, store (orderStore), payments (payments-Kontext), now, shipping?, ossAktiv? (nur Tests; sonst ust.js OSS_AKTIV) } */
function modeOf(ctx) {
  return shopMode(ctx.env, ctx.modeOpts);
}

function priced(ctx, cart, mode) {
  return priceCart(normalizeCart(cart), { heute: heuteIso(new Date(ctx.now())), mode, produkte: ctx.produkte, testartikel: ctx.testartikel });
}

const publicZeilen = (p, locale) =>
  p.zeilen.map((z) => ({
    slug: z.slug,
    variante: z.variante,
    varianteName: z.varianteName ? textOf(z.varianteName, locale) : null,
    varianten: (z.varianten || []).map((v) => ({ id: v.id, name: v.name ? textOf(v.name, locale) : null, cent: v.cent })),
    name: z.name,
    markeName: z.markeName,
    menge: z.menge,
    einzelCent: z.einzelCent,
    summeCent: z.summeCent,
    grundpreis: z.grundpreis,
    grundpreisFehlt: z.grundpreisFehlt,
    // USt-Klasse (ust.js) – der Browser zeigt damit „inkl. X % USt.“ je Zeile.
    ustKlasse: z.ustKlasse,
    zerbrechlich: z.zerbrechlich,
    test: z.test,
    // Produktbild für Mini-Warenkorb/Warenkorb (Katalog-Pfad, kein Preis).
    bild: z.bild || null,
  }));

async function readBody(request, schema) {
  const capped = await readCapped(request, MAX_BYTES);
  if (!capped.ok) return { error: errorResponse("too_large", 413) };
  let data;
  try {
    data = JSON.parse(capped.text || "{}");
  } catch {
    return { error: errorResponse("invalid", 400) };
  }
  const r = schema.safeParse(data);
  if (!r.success) {
    const issue = r.error.issues?.[0];
    return { error: errorResponse("invalid", 400, { message: issue?.message, extra: issue?.path?.length ? { field: issue.path.join(".") } : {} }) };
  }
  return { data: r.data };
}

const shippingOf = (ctx, mode) => (ctx.shipping !== undefined ? ctx.shipping : shippingAdapterFor(ctx.env, mode));

/** Tarif berechnen und als Quote (mit Ablaufzeit) ablegen. */
async function quoteFor(ctx, mode, p, ziel) {
  const r = await versandTarif({ adapter: shippingOf(ctx, mode), zeilen: p.zeilen, ziel, warenwertCent: p.warenCent, now: ctx.now(), mode });
  if (!r.ok) return r;
  const id = `q_${randomBytes(12).toString("hex")}`;
  const ablauf = ctx.now() + QUOTE_TTL_MS;
  await ctx.store.put("tarife", id, { id, hash: cartHash(p.zeilen, ziel), land: ziel.land, cent: r.cent, quelle: r.quelle, dienst: r.dienst, service: r.service || null, pakete: r.pakete || null, versichert: r.versichert, zerbrechlich: r.zerbrechlich, kerze: r.kerze, ablauf });
  return { ...r, tarifId: id, ablauf };
}

const publicTarif = (q) => ({ tarifId: q.tarifId, cent: q.cent, quelle: q.quelle, dienst: q.dienst ? { carrier: q.dienst.carrier, name: q.dienst.name, tage: q.dienst.tage } : null, versichert: q.versichert, zerbrechlich: q.zerbrechlich, kerze: q.kerze, ablauf: q.ablauf, rueckfall: Boolean(q.rueckfall) });

export function versandHandler(ctx) {
  return async function POST(request) {
    const mode = modeOf(ctx);
    if (mode === "off") return notFound();
    if (!sameOrigin(request)) return errorResponse("forbidden", 403);
    const body = await readBody(request, versandSchema);
    if (body.error) return body.error;
    const { ziel, locale } = body.data;
    const p = priced(ctx, body.data.cart, mode);
    // Ohne Ziel: nur bepreisen (Warenkorb-Anzeige, Abholung). Nicht verkäufliche Zeilen meldet `fehler`.
    if (!ziel) return Response.json({ success: true, zeilen: publicZeilen(p, locale), fehler: p.fehler, versand: null, summen: totals(p, 0, { lieferart: "abholung" }) });
    if (!p.ok) return Response.json({ success: false, code: p.zeilen.length ? "artikel" : "leer", fehler: p.fehler }, { status: 400 });
    if (!versandLandOk(ziel.land)) return Response.json({ success: false, code: ziel.land === "CH" ? "land_ch" : "land", abholung: true }, { status: 422 });
    const q = await quoteFor(ctx, mode, p, ziel);
    if (!q.ok) return Response.json({ success: false, code: q.fehler, abholung: true, versichert: q.versichert, zerbrechlich: q.zerbrechlich }, { status: 422 });
    return Response.json({ success: true, zeilen: publicZeilen(p, locale), fehler: [], versand: publicTarif(q), summen: totals(p, q.cent, { lieferart: "versand", land: ziel.land, ossAktiv: ctx.ossAktiv }) });
  };
}

/** Satz einer gespeicherten Bestellzeile im Steuerland der Bestellung (ust.js). */
const zeilenSatz = (z, steuerland) => ustSatz({ klasse: z.ustKlasse || ustKlasse(z.kategorie), steuerland: steuerland || "AT" });

/**
 * Stripe-Checkout-Parameter: alle Beträge vom Server, Versand als eigene Zeile.
 * Jede Zeile trägt „inkl. X % USt.“ (product_data.description); Stripe Tax
 * wird NICHT verwendet – die Beträge sind Bruttopreise, die USt rechnet ust.js.
 */
export function checkoutParams(order, { env, locale }) {
  const base = baseUrl(env);
  const q = `b=${order.id}&k=${order.token}`;
  const c = shopCopy(locale);
  const steuerland = order.summen?.ust?.steuerland || "AT";
  const items = order.zeilen.map((z) => ({
    quantity: z.menge,
    price_data: { currency: "eur", unit_amount: z.einzelCent, product_data: { name: `${z.markeName} ${z.name}${z.varianteName ? ` – ${textOf(z.varianteName, locale)}` : ""}`.slice(0, 250), description: fillCopy(c.inclVatRate, { satz: zeilenSatz(z, steuerland) }) } },
  }));
  if (order.lieferart === "versand" && order.summen.versandCent > 0) {
    const vs = (order.summen.ust?.posten || []).filter((p) => p.versandCent > 0).map((p) => p.satz);
    const desc = vs.length ? vs.map((satz) => fillCopy(c.inclVatRate, { satz })).join(" / ") + (vs.length > 1 ? ` – ${c.vatShippingShare}` : "") : c.inclVat;
    items.push({ quantity: 1, price_data: { currency: "eur", unit_amount: order.summen.versandCent, product_data: { name: `Versand ${order.adresse.land}${order.versand.versichert ? " (versichert)" : ""}`, description: desc.slice(0, 500) } } });
  }
  const metadata = { art: "shop", order_id: order.id };
  return {
    mode: "payment",
    line_items: items,
    customer_email: order.kunde.email,
    client_reference_id: order.id,
    locale: locale === "de" ? "de" : locale,
    metadata,
    payment_intent_data: { metadata },
    success_url: `${base}/${locale}/shop/bestellung?${q}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/${locale}/shop/warenkorb?abbruch=1`,
  };
}

export function checkoutHandler(ctx) {
  return async function POST(request) {
    const mode = modeOf(ctx);
    if (mode === "off") return notFound();
    if (!sameOrigin(request)) return errorResponse("forbidden", 403);
    try {
      const guard = await guardForm(request, checkoutSchema, {
        route: "shop_checkout",
        maxBytes: MAX_BYTES,
        fakeSuccess: () => ({ success: true, redirect: "/de/shop/warenkorb" }),
        outerHeaders: await outerHeadersOf(ctx.resolveHeaders),
        limiter: ctx.limiter,
        now: ctx.now(),
      });
      if (!guard.ok) return guard.response;
      const d = guard.data;
      const locale = d.locale;
      const p = priced(ctx, d.cart, mode);
      if (!p.ok) return Response.json({ success: false, code: p.zeilen.length ? "artikel" : "leer", fehler: p.fehler }, { status: 400 });
      if (d.zahlung === "vorort" && d.lieferart !== "abholung") return errorResponse("invalid", 400, { message: "Zahlung vor Ort nur bei Abholung.", extra: { field: "zahlung" } });

      let versand = null;
      if (d.lieferart === "versand") {
        if (!d.adresse) return errorResponse("invalid", 400, { message: "Lieferadresse fehlt.", extra: { field: "adresse" } });
        if (!versandLandOk(d.adresse.land)) return Response.json({ success: false, code: d.adresse.land === "CH" ? "land_ch" : "land" }, { status: 422 });
        const q = d.tarifId ? await ctx.store.get("tarife", d.tarifId) : null;
        const hash = cartHash(p.zeilen, d.adresse);
        if (!q || q.ablauf < ctx.now() || q.hash !== hash) {
          // Tarif fehlt/abgelaufen/passt nicht mehr zu Warenkorb + Adresse → neu abfragen, Kunde bestätigt neu.
          const neu = await quoteFor(ctx, mode, p, d.adresse);
          if (!neu.ok) return Response.json({ success: false, code: neu.fehler, abholung: true }, { status: 422 });
          return Response.json({ success: false, code: "versand_neu", versand: publicTarif(neu), summen: totals(p, neu.cent, { lieferart: "versand", land: d.adresse.land, ossAktiv: ctx.ossAktiv }), zeilen: publicZeilen(p, locale) }, { status: 409 });
        }
        versand = q;
      }
      // USt nach Lieferart/Lieferland (ust.js: Abholung AT, DE nur mit OSS_AKTIV deutsche Sätze).
      const sum = totals(p, versand?.cent || 0, { lieferart: d.lieferart, land: d.adresse?.land || null, ossAktiv: ctx.ossAktiv });
      if (d.angezeigt.versandCent !== sum.versandCent || d.angezeigt.gesamtCent !== sum.gesamtCent) {
        return Response.json({ success: false, code: "preis_geaendert", summen: sum, zeilen: publicZeilen(p, locale), versand: versand ? publicTarif({ ...versand, tarifId: versand.id }) : null }, { status: 409 });
      }

      const t = ctx.now();
      const order = {
        id: newId(),
        token: newToken(),
        status: d.zahlung === "vorort" ? "reserviert" : "offen",
        modus: mode,
        testmodus: mode === "test",
        lieferart: d.lieferart,
        zahlung: d.zahlung,
        kunde: d.kunde,
        adresse: d.lieferart === "versand" ? d.adresse : null,
        zeilen: p.zeilen.map(({ bild, varianten, ...z }) => z),
        summen: sum,
        versand: versand ? { tarifId: versand.id, cent: versand.cent, quelle: versand.quelle, dienst: versand.dienst, service: versand.service, pakete: versand.pakete, versichert: versand.versichert, zerbrechlich: versand.zerbrechlich } : null,
        locale,
        angelegt: new Date(t).toISOString(),
        verlauf: [{ zeit: new Date(t).toISOString(), status: d.zahlung === "vorort" ? "reserviert" : "offen" }],
        // Vertragsbestätigung (§ 7 Abs 3 FAGG, orderMail.js): bei „bezahlen bei Abholung“ sofort,
        // bei Online-Zahlung erst mit „bezahlt“ (webhook.js). Bis dahin: ausstehend.
        mail: { status: "ausstehend", art: "vertragsbestaetigung" },
      };
      await ctx.store.put("bestellungen", order.id, order);
      if (versand) await ctx.store.update("tarife", versand.id, (x) => ({ ...x, ablauf: 0, verwendet: order.id }));
      const confirm = `/${locale}/shop/bestellung?b=${order.id}&k=${order.token}`;
      if (d.zahlung === "vorort") {
        console.info(`[shop] ${order.id}: reservierung (${mode})`);
        await sendeVertragsbestaetigung({ store: ctx.store, mailer: ctx.payments?.mailer || null, now: ctx.now }, order, mode);
        return Response.json({ success: true, redirect: confirm, bestellung: order.id });
      }

      // Im Test NIE ein Live-Schlüssel: ohne sk_test_ → Mock.
      const forceMock = mode === "test" && stripeKeyKind(ctx.env) !== "test";
      const gateway = ctx.payments.gatewayFor({}, { forceMock });
      if (!gateway || (mode === "test" && !gateway.testmode)) return errorResponse("unavailable", 503);
      let session;
      try {
        session = await gateway.createCheckoutSession(checkoutParams(order, { env: ctx.env, locale }), { idempotencyKey: `shop-${order.id}` });
      } catch (err) {
        console.error(`[shop] ${order.id}: checkout ${err?.type || err?.name || "error"}`);
        await ctx.store.update("bestellungen", order.id, (o) => ({ ...o, status: "checkout_fehler" }));
        return errorResponse("upstream", 502);
      }
      await ctx.store.update("bestellungen", order.id, (o) => ({ ...o, session: session.id, gateway: gateway.kind }));
      console.info(`[shop] ${order.id}: checkout ${gateway.kind}`);
      return Response.json({ success: true, redirect: session.url, bestellung: order.id });
    } catch (err) {
      console.error(`[shop] checkout: intern ${err?.message || err}`);
      return errorResponse("internal", 500);
    }
  };
}

/** Öffentliche Sicht einer Bestellung für die Bestätigungsseite (Token nötig). */
export async function orderView(ctx, id, token) {
  if (typeof id !== "string" || !/^PH-S-\d{6}-[A-F0-9]{6}$/.test(id) || typeof token !== "string" || !/^[a-f0-9]{36}$/.test(token)) return null;
  const o = await ctx.store.get("bestellungen", id);
  if (!o || o.token !== token) return null;
  return {
    id: o.id,
    status: o.status,
    testmodus: o.testmodus,
    lieferart: o.lieferart,
    zahlung: o.zahlung,
    angelegt: o.angelegt || null,
    zeilen: o.zeilen.map((z) => ({ name: z.name, markeName: z.markeName, varianteName: z.varianteName, menge: z.menge, summeCent: z.summeCent, einzelCent: z.einzelCent, ustSatz: zeilenSatz(z, o.summen?.ust?.steuerland) })),
    summen: o.summen,
    versand: o.versand ? { dienst: o.versand.dienst, versichert: o.versand.versichert } : null,
    sendung: o.sendung ? { status: o.sendung.status, awb: o.sendung.awb || null, carrier: o.sendung.carrier || null, mock: Boolean(o.sendung.mock) } : null,
    land: o.adresse?.land || null,
  };
}
