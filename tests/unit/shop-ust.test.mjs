// tests/unit/shop-ust.test.mjs — Umsatzsteuer des Accessoire-Shops
// (src/lib/shop/ust.js): 20 % Normalsatz, 10 % Bildbände, Versand folgt der
// Ware bzw. anteilig bei gemischtem Warenkorb, DE mit AT-USt bis OSS_AKTIV,
// DE 19 %/7 % mit OSS, Abholung immer AT, CH-Versand nicht unterstützt.
// Dazu: Warenkorb-Summen, Stripe-Zeilen und Bestätigung (Handler) mit
// gemischtem Warenkorb in beiden OSS-Zuständen. Nur Mocks, keine Zahlungen.
// Run: node --test --test-reporter=tap tests/unit/shop-ust.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ERMAESSIGT_KATEGORIEN, OSS_AKTIV, UST_REGELN, UST_SAETZE, anteilig, anzeigeSatz, fernverkaufSchwelleErreicht, steuerLand, ustAufteilung, ustAusBrutto, ustKlasse, ustSatz } from "../../src/lib/shop/ust.js";
import { MWST_SATZ, TESTARTIKEL } from "../../src/lib/shop/catalog.js";
import { normalizeCart, priceCart, totals } from "../../src/lib/shop/cart.js";
import { checkoutHandler, checkoutParams, orderView, versandHandler } from "../../src/lib/shop/handlers.js";
import { createMemoryOrderAdapter } from "../../src/lib/shop/orderStore.js";
import { SHOP_RELEASE } from "../../src/lib/shop/release.js";
import { ADD_TO_CART_KEYS, SHOP_COPY } from "../../src/lib/shop/copy.js";
import { VERSAND_UST_SATZ } from "../../src/lib/commerce/shipping/config.js";
import { createMockShippingAdapter } from "../../src/lib/commerce/shipping/mock.js";
import { createMockGateway } from "../../src/lib/payments/gateway.js";
import { createMemoryStore } from "../../src/lib/payments/store.js";
import { createRateLimiter } from "../../src/lib/forms/rateLimit.js";
import { PREISE_PAUSIERT } from "../../src/lib/katalog/schema.js";

const HEUTE = "2026-10-31";
const NOW = Date.parse("2026-10-31T10:00:00Z");
const DEV = { NODE_ENV: "development" };

test("Grundregeln: Sätze, Klassen, Status Entwurf, OSS standardmäßig aus", () => {
  assert.equal(OSS_AKTIV, false, "Lieferschwelle nicht überschritten → AT-USt (Inhaber/Steuerberater schaltet um)");
  assert.deepEqual(UST_SAETZE, { AT: { normal: 20, ermaessigt: 10 }, DE: { normal: 19, ermaessigt: 7 } });
  assert.deepEqual(ERMAESSIGT_KATEGORIEN, ["bildband"]);
  assert.equal(ustKlasse("bildband"), "ermaessigt");
  for (const k of ["duftkerze", "glas", "raumduft", "parfum", "tragbare-leuchte", undefined]) assert.equal(ustKlasse(k), "normal", String(k));
  assert.equal(ustSatz({ kategorie: "bildband" }), 10);
  assert.equal(ustSatz({ kategorie: "glas" }), 20);
  assert.equal(ustSatz({ kategorie: "bildband", steuerland: "DE" }), 7);
  assert.equal(ustSatz({ klasse: "normal", steuerland: "DE" }), 19);
  assert.throws(() => ustSatz({ klasse: "normal", steuerland: "CH" }));
  assert.equal(UST_REGELN.status, "entwurf");
  assert.match(UST_REGELN.hinweis, /Entwurf von KI-Agenten/);
  assert.equal(MWST_SATZ, 20, "Alias bleibt AT-Normalsatz");
  assert.equal(VERSAND_UST_SATZ, 20, "Netto→Brutto-Umrechnung LetMeShip mit AT-Normalsatz");
});

test("Quelltext: keine fest verdrahteten 20 % / 1.2 mehr in Warenkorb, Bestätigung, Katalog, Versand", () => {
  const f = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
  assert.doesNotMatch(f("src/components/Shop/ShopCart.js"), /\/ 1\.2\b|\(20 %\)/);
  assert.doesNotMatch(f("src/app/[locale]/shop/bestellung/page.js"), /\(20 %\)/);
  assert.doesNotMatch(f("src/lib/shop/catalog.js"), /MWST_SATZ = 20/);
  assert.doesNotMatch(f("src/lib/commerce/shipping/config.js"), /VERSAND_UST_SATZ = 20/);
  const ust = f("src/lib/shop/ust.js");
  for (const quelle of ["ris.bka.gv.at", "eur-lex.europa.eu", "wko.at", "C-349/96", "Art. 59c", "Anlage 1"]) assert.ok(ust.includes(quelle), quelle);
});

test("Steuerland: Abholung immer AT, DE nur mit OSS deutsch, CH-Versand nicht unterstützt", () => {
  assert.equal(steuerLand({ lieferart: "abholung", land: "DE", ossAktiv: true }), "AT");
  assert.equal(steuerLand({ lieferart: "abholung", land: "CH" }), "AT");
  assert.equal(steuerLand({ lieferart: "versand", land: "AT", ossAktiv: true }), "AT");
  assert.equal(steuerLand({ lieferart: "versand", land: "DE", ossAktiv: false }), "AT");
  assert.equal(steuerLand({ lieferart: "versand", land: "DE", ossAktiv: true }), "DE");
  assert.equal(steuerLand({ lieferart: "versand", land: "CH" }), null);
  assert.equal(ustAufteilung({ zeilen: [{ summeCent: 1000, kategorie: "glas" }], lieferart: "versand", land: "CH" }).steuerland, null);
});

test("Anzeige-Satz: ohne Lieferland bei OSS kein Satz, sonst AT", () => {
  assert.equal(anzeigeSatz({ kategorie: "bildband", ossAktiv: false }), 10);
  assert.equal(anzeigeSatz({ kategorie: "glas", ossAktiv: true }), null);
  assert.equal(anzeigeSatz({ kategorie: "glas", steuerland: "DE", ossAktiv: true }), 19);
});

test("Rechnen: USt aus Brutto, anteilige Aufteilung Cent genau", () => {
  assert.equal(ustAusBrutto(12000, 20), 2000);
  assert.equal(ustAusBrutto(1100, 10), 100);
  assert.equal(ustAusBrutto(1190, 19), 190);
  assert.deepEqual(anteilig(1000, [3, 1]), [750, 250]);
  assert.deepEqual(anteilig(1001, [1, 1, 1]), [334, 334, 333]);
  assert.deepEqual(anteilig(7, [0, 0]), [7, 0]);
  for (const [g, w] of [[999, [7, 3]], [1, [1, 1]], [12345, [5, 7, 11]]]) assert.equal(anteilig(g, w).reduce((s, x) => s + x, 0), g);
});

test("Nur Normalsatz: Versand voll zu 20 %", () => {
  const a = ustAufteilung({ zeilen: [{ summeCent: 3990, kategorie: "glas" }], versandCent: 780, lieferart: "versand", land: "AT" });
  assert.deepEqual(a.posten.map((p) => [p.satz, p.warenCent, p.versandCent, p.bruttoCent, p.ustCent]), [[20, 3990, 780, 4770, 795]]);
  assert.equal(a.ustCent, 795);
});

test("Nur Bildband: Versand teilt das Schicksal der Hauptleistung → 10 %", () => {
  const a = ustAufteilung({ zeilen: [{ summeCent: 6000, kategorie: "bildband" }], versandCent: 780, lieferart: "versand", land: "AT" });
  assert.deepEqual(a.posten.map((p) => [p.satz, p.versandCent, p.ustCent]), [[10, 780, ustAusBrutto(6780, 10)]]);
});

test("Gemischter Warenkorb AT: Versand nach Warenwert aufgeteilt, Summe stimmt", () => {
  // 30 € Glas (20 %) + 90 € Bildband (10 %), Versand 8 € → 2 € zu 20 %, 6 € zu 10 %
  const zeilen = [
    { summeCent: 3000, kategorie: "glas" },
    { summeCent: 9000, kategorie: "bildband" },
  ];
  const a = ustAufteilung({ zeilen, versandCent: 800, lieferart: "versand", land: "AT" });
  assert.deepEqual(a.zeilenSaetze, [20, 10]);
  assert.deepEqual(a.posten.map((p) => [p.satz, p.warenCent, p.versandCent, p.bruttoCent]), [[20, 3000, 200, 3200], [10, 9000, 600, 9600]]);
  assert.deepEqual(a.posten.map((p) => p.ustCent), [533, 873]);
  assert.equal(a.ustCent, 533 + 873);
  assert.equal(a.posten.reduce((s, p) => s + p.bruttoCent, 0), 3000 + 9000 + 800);
  assert.equal(a.posten.reduce((s, p) => s + p.nettoCent + p.ustCent, 0), 12800);
});

test("Gemischter Warenkorb DE: ohne OSS AT-Sätze, mit OSS 19 %/7 %", () => {
  const zeilen = [
    { summeCent: 3000, ustKlasse: "normal" },
    { summeCent: 9000, ustKlasse: "ermaessigt" },
  ];
  const aus = ustAufteilung({ zeilen, versandCent: 800, lieferart: "versand", land: "DE", ossAktiv: false });
  assert.equal(aus.steuerland, "AT");
  assert.deepEqual(aus.posten.map((p) => p.satz), [20, 10]);
  const an = ustAufteilung({ zeilen, versandCent: 800, lieferart: "versand", land: "DE", ossAktiv: true });
  assert.equal(an.steuerland, "DE");
  assert.deepEqual(an.posten.map((p) => [p.satz, p.bruttoCent, p.ustCent]), [[19, 3200, ustAusBrutto(3200, 19)], [7, 9600, ustAusBrutto(9600, 7)]]);
  assert.equal(an.posten.reduce((s, p) => s + p.bruttoCent, 0), aus.posten.reduce((s, p) => s + p.bruttoCent, 0), "Bruttopreise bleiben gleich");
  // Abholung bleibt AT, auch mit OSS
  assert.equal(ustAufteilung({ zeilen, lieferart: "abholung", land: "DE", ossAktiv: true }).steuerland, "AT");
});

test("Lieferschwelle 10.000 € netto EU-weit (Vorjahr oder laufendes Jahr)", () => {
  assert.equal(fernverkaufSchwelleErreicht({ vorjahrNettoCent: 1_000_000, laufendNettoCent: 0 }), false, "genau 10.000 € = nicht überschritten");
  assert.equal(fernverkaufSchwelleErreicht({ vorjahrNettoCent: 1_000_001 }), true);
  assert.equal(fernverkaufSchwelleErreicht({ laufendNettoCent: 1_000_001 }), true);
  assert.equal(fernverkaufSchwelleErreicht(), false);
});

test("Assouline/Tom Dixon bleiben pausiert; Kategorie bildband ist für die Freigabe bereit", () => {
  assert.ok(Object.hasOwn(PREISE_PAUSIERT, "assouline"));
  assert.ok(Object.hasOwn(PREISE_PAUSIERT, "tom-dixon"));
  const bb = TESTARTIKEL.find((t) => t.kategorie === "bildband");
  assert.ok(bb && bb.test, "Testartikel Bildband prüft den 10-%-Pfad");
});

test("priceCart/totals: ustKlasse je Zeile, Summen je Satz", () => {
  const p = priceCart(normalizeCart([{ slug: "testartikel-glas", menge: 1 }, { slug: "testartikel-bildband", menge: 2 }]), { heute: HEUTE, mode: "test" });
  assert.equal(p.ok, true);
  assert.deepEqual(p.zeilen.map((z) => [z.slug, z.ustKlasse]), [["testartikel-glas", "normal"], ["testartikel-bildband", "ermaessigt"]]);
  const t = totals(p, 800, { lieferart: "versand", land: "AT" });
  assert.equal(t.gesamtCent, 1200 + 8000 + 800);
  assert.deepEqual(t.ust.posten.map((x) => x.satz), [20, 10]);
  assert.equal(t.mwstCent, t.ust.posten.reduce((s, x) => s + x.ustCent, 0));
  const tDe = totals(p, 800, { lieferart: "versand", land: "DE", ossAktiv: true });
  assert.deepEqual(tDe.ust.posten.map((x) => x.satz), [19, 7]);
  const abh = totals(p, 0, { lieferart: "abholung" });
  assert.deepEqual(abh.ust.posten.map((x) => [x.satz, x.versandCent]), [[20, 0], [10, 0]]);
});

test("Copy: inclVatRate in allen Sprachen mit {satz}, auch im Mini-Warenkorb", () => {
  assert.ok(ADD_TO_CART_KEYS.includes("inclVatRate"));
  for (const [loc, c] of Object.entries(SHOP_COPY)) {
    assert.match(c.inclVatRate, /\{satz\}/, loc);
    assert.doesNotMatch(c.inclVat, /20/, `${loc}: generischer Hinweis ohne festen Satz`);
    assert.ok(c.vatShippingShare, loc);
  }
});

test("Freigabe: Punkt ust bleibt offen und verweist auf den Entwurf", () => {
  const u = SHOP_RELEASE.find((r) => r.id === "ust");
  assert.equal(u.erledigt, false);
  assert.match(u.hinweis, /ust\.js/);
  assert.match(u.hinweis, /Entwurf von KI-Agenten/);
});

// ------------------------------------------------------------------ Handler (Mock-Gateway)

function ctxOf({ ossAktiv } = {}) {
  const payStore = createMemoryStore();
  const gw = createMockGateway(DEV, { store: payStore, now: () => NOW });
  const sessions = [];
  return {
    sessions,
    ctx: {
      env: DEV,
      store: createMemoryOrderAdapter(),
      now: () => NOW,
      produkte: [],
      testartikel: TESTARTIKEL,
      shipping: createMockShippingAdapter(),
      limiter: createRateLimiter(),
      ossAktiv,
      payments: {
        store: payStore,
        gatewayFor: () => ({
          ...gw,
          createCheckoutSession: async (params, opts) => {
            sessions.push(params);
            return gw.createCheckoutSession(params, opts);
          },
        }),
      },
    },
  };
}
const req = (url, body) => new Request(`http://localhost${url}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const KUNDE = { name: "Test Kundin", email: "kundin@example.invalid", telefon: "" };
const MIX = [
  { slug: "testartikel-glas", menge: 1 },
  { slug: "testartikel-bildband", menge: 1 },
];

for (const [land, oss, saetze] of [["AT", false, [20, 10]], ["DE", false, [20, 10]], ["DE", true, [19, 7]]]) {
  test(`Handler: gemischter Warenkorb ${land}, OSS ${oss ? "an" : "aus"} → Sätze ${saetze.join("/")} in Summen, Stripe-Zeilen, Bestätigung`, async () => {
    const { ctx, sessions } = ctxOf({ ossAktiv: oss });
    const adresse = land === "AT" ? { land, plz: "6900", ort: "Bregenz", strasse: "Testgasse", hausnr: "1" } : { land, plz: "88131", ort: "Lindau", strasse: "Testweg", hausnr: "2" };
    const v = await (await versandHandler(ctx)(req("/api/shop/versand", { cart: MIX, ziel: adresse }))).json();
    assert.equal(v.success, true, JSON.stringify(v));
    assert.deepEqual(v.zeilen.map((z) => z.ustKlasse), ["normal", "ermaessigt"]);
    assert.deepEqual(v.summen.ust.posten.map((p) => p.satz), saetze);
    assert.equal(v.summen.ust.posten.reduce((s, p) => s + p.versandCent, 0), v.versand.cent, "Versand vollständig aufgeteilt");
    const res = await checkoutHandler(ctx)(req("/api/shop/checkout", { cart: MIX, lieferart: "versand", zahlung: "online", kunde: KUNDE, adresse, tarifId: v.versand.tarifId, angezeigt: { versandCent: v.summen.versandCent, gesamtCent: v.summen.gesamtCent } }));
    assert.equal(res.status, 200, JSON.stringify(await res.clone().json()));
    const o = (await ctx.store.list("bestellungen"))[0];
    assert.deepEqual(o.summen.ust.posten.map((p) => p.satz), saetze);
    assert.equal(o.summen.mwstCent, o.summen.ust.posten.reduce((s, p) => s + p.ustCent, 0));
    const li = sessions[0].line_items;
    assert.equal(li.length, 3);
    assert.match(li[0].price_data.product_data.description, new RegExp(`inkl\\. ${saetze[0]} % USt\\.`));
    assert.match(li[1].price_data.product_data.description, new RegExp(`inkl\\. ${saetze[1]} % USt\\.`));
    assert.match(li[2].price_data.product_data.description, new RegExp(`${saetze[0]} % .*${saetze[1]} %.*anteilig`));
    assert.deepEqual(li.map((l) => l.price_data.unit_amount), [1200, 4000, v.versand.cent], "Bruttopreise unverändert");
    const view = await orderView(ctx, o.id, o.token);
    assert.deepEqual(view.zeilen.map((z) => z.ustSatz), saetze);
  });
}

test("Handler: Abholung mit OSS an → AT-Sätze; Stripe-Zeilen in Englisch", async () => {
  const { ctx } = ctxOf({ ossAktiv: true });
  const v = await (await versandHandler(ctx)(req("/api/shop/versand", { cart: MIX }))).json();
  assert.deepEqual(v.summen.ust.posten.map((p) => p.satz), [20, 10]);
  const order = { id: "PH-S-261031-ABCDEF", token: "a".repeat(36), lieferart: "abholung", kunde: KUNDE, zeilen: [{ markeName: "T", name: "Buch", menge: 1, einzelCent: 4000, ustKlasse: "ermaessigt" }], summen: { versandCent: 0, ust: { steuerland: "AT", posten: [] } } };
  assert.equal(checkoutParams(order, { env: DEV, locale: "en" }).line_items[0].price_data.product_data.description, "incl. 10% VAT");
});

test("Bestätigung: alte Bestellung ohne Aufteilung → Satz aus Kategorie, AT", async () => {
  const store = createMemoryOrderAdapter();
  const o = { id: "PH-S-261031-A1B2C3", token: "b".repeat(36), status: "bezahlt", lieferart: "abholung", zahlung: "online", zeilen: [{ name: "B", markeName: "T", menge: 1, summeCent: 4000, einzelCent: 4000, kategorie: "bildband" }], summen: { warenCent: 4000, versandCent: 0, gesamtCent: 4000, mwstCent: 364 } };
  await store.put("bestellungen", o.id, o);
  const view = await orderView({ store }, o.id, o.token);
  assert.deepEqual(view.zeilen.map((z) => z.ustSatz), [10]);
});
