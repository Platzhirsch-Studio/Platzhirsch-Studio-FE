// tests/unit/shop.test.mjs — Onlineshop Accessoire-Welt (Inhaber-Entscheidung
// Nr. 29) im TESTMODUS: Modus-Schalter mit Freigabe-Rückfall, Preise nur vom
// Server und nur für Baobab/Riedel/Trudon, Manipulationsschutz, Versand
// (LetMeShip-Adapter + Mock, Versicherung Glas, Tarif-ID mit Ablaufzeit),
// Checkout (Stripe-Mock), Reservierung ohne Zahlung, Webhook → Sendung.
// Nie echte Zahlungen, nie echte Netzwerkaufrufe (fetch immer gefälscht).
// Run: node --test tests/unit/shop.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { shopMode, shopModeRequested, liveBlockers } from "../../src/lib/shop/mode.js";
import { SHOP_RELEASE, releaseComplete, releaseDone, releaseItemDone, releaseOpen } from "../../src/lib/shop/release.js";
import { SHOP_LEGAL, legalOpen } from "../../src/lib/shop/legal.js";
import { LIEFERZEIT } from "../../src/lib/shop/lieferzeit.js";

// Lieferzeit-Konfiguration mit allen Einträgen belegt freigegeben (nur Test).
const lzFrei = (e) => ({ ...e, freigegeben: true, freigabe: { datum: "2026-11-15", durch: "Test", beleg: "Test" } });
const LIEFERZEIT_FREI = {
  versand: Object.fromEntries(Object.entries(LIEFERZEIT.versand).map(([l, z]) => [l, { lager: lzFrei(z.lager), bestellware: lzFrei(z.bestellware) }])),
  abholung: { lager: lzFrei(LIEFERZEIT.abholung.lager), bestellware: lzFrei(LIEFERZEIT.abholung.bestellware) },
};
import { TESTARTIKEL, VERKAUF_MARKEN, ausfuehrungZuVariante, findSellable, grundpreis, sellableOf, varianteZurAuswahl, variantenOf } from "../../src/lib/shop/catalog.js";
import { PAKETTYPEN, pakettypOf } from "../../src/lib/shop/paketprofile.js";
import { cartHash, mwstAus, normalizeCart, priceCart, totals } from "../../src/lib/shop/cart.js";
import { checkoutHandler, checkoutParams, orderView, versandHandler } from "../../src/lib/shop/handlers.js";
import { createMemoryOrderAdapter } from "../../src/lib/shop/orderStore.js";
import { createShopHooks } from "../../src/lib/shop/webhook.js";
import { paketeOf, profilOf, profilVollstaendig, QUOTE_TTL_MS } from "../../src/lib/commerce/shipping/config.js";
import { shippingAdapterFor, versandTarif } from "../../src/lib/commerce/shipping/index.js";
import { createLetMeShipAdapter, kundenCent, LMS_BASE, pickService, trackingLink } from "../../src/lib/commerce/shipping/letmeship.js";
import { createMockShippingAdapter, MOCK_TARIFE, MOCK_VERSICHERUNG_CENT } from "../../src/lib/commerce/shipping/mock.js";
import { createMockGateway } from "../../src/lib/payments/gateway.js";
import { createMemoryStore } from "../../src/lib/payments/store.js";
import { processEvent } from "../../src/lib/payments/webhook.js";
import { createRateLimiter } from "../../src/lib/forms/rateLimit.js";

const HEUTE = "2026-10-31";
const NOW = Date.parse("2026-10-31T10:00:00Z");
const DEV = { NODE_ENV: "development" };
const PROD = { NODE_ENV: "production" };

const done = (x) => ({ ...x, erledigt: true, beleg: "Ordner Freigaben/Shop, Dokument 1", datum: "2026-11-01", durch: "Inhaber" });
// Alle Slots wirksam frei: ohne Platzhalter (legalSlotReleased verlangt seit 03.11.2026 platzhalter.length === 0).
const legalFrei = SHOP_LEGAL.map((s) => ({ ...s, status: "freigegeben", text: "Kanzleitext", stand: "2026-11-01", platzhalter: [] }));
const LIVE_ENV = { NODE_ENV: "production", SHOP_MODE: "live", STRIPE_SECRET_KEY: "sk_live_abcdefghijk", STRIPE_WEBHOOK_SECRET: "whsec_abcdefghijk", PAYMENTS_MAIL_PROVIDER: "resend", PAYMENTS_MAIL_API_KEY: "re_x", PAYMENTS_MAIL_FROM: "shop@platzhirsch.studio" };

// Katalog-Fixtures (nur Test): gleiche Struktur wie src/lib/katalog/schema.js
const bilder = [];
const basis = (o) => ({ bereich: "accessoires", kurz: { de: "a", en: "a", fr: "a", it: "a" }, merkmale: [], bilder, herstellerUrl: "https://x.example/p", quellen: ["https://x.example/p"], stand: HEUTE, ...o });
const RIEDEL = basis({ slug: "riedel-veritas-test", marke: "riedel", kategorie: "glas", name: "Veritas Test", preis: { art: "verkaufspreis", betrag: 39.9, stand: "2026-10-15", quelle: "https://www.riedel.com/de-at/x" } });
const BAOBAB = basis({ slug: "baobab-max-test", marke: "baobab-collection", kategorie: "duftkerze", name: "Max Test", preis: { art: "verkaufspreis", varianten: [{ name: "Max 16", betrag: 79 }, { name: "Max 24", betrag: 149 }], stand: "2026-10-15", quelle: "https://eu.baobabcollection.com/de-at/x" } });
const ALT = basis({ slug: "trudon-alt", marke: "cire-trudon", kategorie: "duftkerze", name: "Alt", preis: { art: "verkaufspreis", betrag: 100, stand: "2026-06-01", quelle: "https://trudon.com/x" } });
const GAGGENAU = basis({ slug: "gaggenau-x", marke: "gaggenau", bereich: "kueche", kategorie: "backofen", name: "Ofen", preis: { art: "uvp-ab", uvpAb: 2490, stand: "2026-10-15", quelle: "https://gaggenau.com/x" } });
const FREMD = basis({ slug: "fremd-x", marke: "agape", kategorie: "duftkerze", name: "Fremd", preis: { art: "verkaufspreis", betrag: 10, stand: "2026-10-15", quelle: "https://x.example/x" } });
const RAUMDUFT_OHNE_INHALT = basis({ slug: "baobab-raumduft", marke: "baobab-collection", kategorie: "raumduft", name: "Spray", preis: { art: "verkaufspreis", betrag: 45, stand: "2026-10-15", quelle: "https://eu.baobabcollection.com/de-at/y" } });
const PRODUKTE = [RIEDEL, BAOBAB, ALT, GAGGENAU, FREMD, RAUMDUFT_OHNE_INHALT];

// ------------------------------------------------------------------ Modus

test("SHOP_MODE: Standard test lokal, off in Produktion, unbekannt → off", () => {
  assert.equal(shopMode(DEV), "test");
  assert.equal(shopMode({}), "test");
  assert.equal(shopMode(PROD), "off");
  assert.equal(shopMode({ ...DEV, SHOP_MODE: "quatsch" }), "off");
  assert.equal(shopMode({ ...DEV, SHOP_MODE: "off" }), "off");
  assert.equal(shopModeRequested(PROD), "off");
});

test("SHOP_MODE=test nie auf Produktion (außer ausdrücklicher Vorschau, nie Vercel-Produktion)", () => {
  assert.equal(shopMode({ ...PROD, SHOP_MODE: "test" }), "off");
  assert.equal(shopMode({ ...PROD, SHOP_MODE: "test", SHOP_PREVIEW: "1" }), "test");
  assert.equal(shopMode({ ...PROD, SHOP_MODE: "test", SHOP_PREVIEW: "1", VERCEL_ENV: "production" }), "off");
});

test("SHOP_MODE=live ohne vollständige Freigabe fällt auf off zurück", () => {
  // 03.11.2026 (Nr. 46): Rechtstexte, Widerrufsfunktion, Vertragsbestätigung, Mitteilung, Inhaber-OK belegt;
  // offen bleiben Inhaber-/Steuerberater-Punkte (Stripe-Live, Mail, LetMeShip, Verpackung, USt, Preise, Lieferzeiten).
  assert.equal(releaseComplete(SHOP_RELEASE), false, "Inhaber-/Steuerberater-Punkte offen");
  assert.deepEqual(releaseOpen(SHOP_RELEASE), ["versandbedingungen", "stripe-live", "mail", "versand", "verpackung", "ust", "preise"]);
  assert.deepEqual(releaseDone(SHOP_RELEASE), ["agb", "widerrufsbelehrung", "widerrufsformular", "datenschutz", "widerrufsfunktion", "gewaehrleistung-mitteilung", "vertragsbestaetigung", "insolvenzrecht", "inhaber-ok"]);
  for (const x of SHOP_RELEASE.filter((r) => r.erledigt)) assert.equal(x.datum, "2026-11-03", x.id);
  assert.equal(shopMode(LIVE_ENV), "off");
  // Auch mit allen Belegen, aber Kanzlei-Slots offen → off
  assert.equal(shopMode(LIVE_ENV, { release: SHOP_RELEASE.map(done) }), "off");
  // Alles belegt + Rechts-Slots frei, aber Lieferzeit nur Entwurf → off
  assert.equal(shopMode(LIVE_ENV, { release: SHOP_RELEASE.map(done), legal: legalFrei }), "off");
  assert.ok(liveBlockers(LIVE_ENV, { release: SHOP_RELEASE.map(done), legal: legalFrei }).includes("lieferzeit:versand.AT.lager"));
  // Alles belegt + Rechts-Slots frei + Lieferzeit freigegeben + Live-Schlüssel + Mail → live
  // … aber USt-Grundlagen offen (ust.js ustOffen) → off
  assert.equal(shopMode(LIVE_ENV, { release: SHOP_RELEASE.map(done), legal: legalFrei, lieferzeit: LIEFERZEIT_FREI }), "off");
  const UST_FREI = { regeln: { status: "freigegeben" }, fernverkaeufe: { vorjahr2025: 0, laufend2026: 0 } };
  assert.equal(shopMode(LIVE_ENV, { release: SHOP_RELEASE.map(done), legal: legalFrei, lieferzeit: LIEFERZEIT_FREI, ust: UST_FREI }), "live");
  // Ein einziger offener Punkt → off
  const eins = SHOP_RELEASE.map((x, i) => (i === 3 ? x : done(x)));
  assert.equal(shopMode(LIVE_ENV, { release: eins, legal: legalFrei }), "off");
  // Testschlüssel statt Live → off; Mail fehlt → off
  assert.equal(shopMode({ ...LIVE_ENV, STRIPE_SECRET_KEY: "sk_test_abcdefghijk" }, { release: SHOP_RELEASE.map(done), legal: legalFrei }), "off");
  assert.equal(shopMode({ ...LIVE_ENV, PAYMENTS_MAIL_PROVIDER: "" }, { release: SHOP_RELEASE.map(done), legal: legalFrei }), "off");
  const b = liveBlockers(LIVE_ENV);
  assert.ok(b.includes("freigabe:stripe-live") && b.includes("freigabe:ust"));
  assert.ok(!b.includes("freigabe:inhaber-ok"), "Inhaber-OK liegt vor (Nr. 46)");
});

test("Freigabe-Punkt zählt nur mit Beleg, Datum und Person", () => {
  const x = SHOP_RELEASE.find((r) => r.id === "stripe-live");
  assert.equal(releaseItemDone({ ...x, erledigt: true }), false);
  assert.equal(releaseItemDone({ ...x, erledigt: true, beleg: "Mail", datum: "2026-11-01", durch: "Kanzlei" }), true);
  assert.equal(releaseItemDone({ ...x, erledigt: true, beleg: "Mail", datum: "1.11.", durch: "Kanzlei" }), false);
  for (const id of ["agb", "widerrufsbelehrung", "widerrufsformular", "versandbedingungen", "datenschutz", "stripe-live", "mail", "versand", "verpackung", "ust", "insolvenzrecht", "inhaber-ok"]) assert.ok(SHOP_RELEASE.some((r) => r.id === id), id);
  // Jeder erledigte Punkt trägt Beleg mit Entscheidungsnummer, Datum und Person.
  for (const r of SHOP_RELEASE.filter((r) => r.erledigt)) {
    assert.ok(releaseItemDone(r), r.id);
    assert.match(r.beleg, /Nr\. \d+/, r.id);
  }
  // Seit 03.11.2026: alle Slots "freigegeben" mit Beleg; wirksam offen nur datenschutz (LetMeShip-Anschrift) – Details: shop-rechtstexte.test.mjs
  assert.deepEqual(legalOpen(), ["datenschutz"]);
  assert.ok(SHOP_LEGAL.every((s) => s.status === "freigegeben" && s.freigabe?.datum === "2026-11-03"));
});

// ------------------------------------------------------------------ Katalog

test("Verkäuflich nur Baobab/Riedel/Trudon mit gültigem Verkaufspreis ≤ 3 Monate", () => {
  const opts = { heute: HEUTE, mode: "test", produkte: PRODUKTE, testartikel: [] };
  // Bewusst geändert 31.10.2026 (Nr. 32/34): Shop-Marken = Verkaufspreis-Marken des Katalog-Schemas.
  assert.deepEqual([...VERKAUF_MARKEN], ["baobab-collection", "riedel", "cire-trudon", "zalto", "assouline", "kahler", "lyngby-porcelaen", "flos", "tom-dixon", "spiegelau", "nachtmann"]);
  assert.ok(findSellable("riedel-veritas-test", opts));
  assert.ok(findSellable("baobab-max-test", opts));
  assert.equal(findSellable("trudon-alt", opts), null, "Stand älter als 3 Monate");
  assert.equal(findSellable("gaggenau-x", opts), null, "Küchengeräte nie");
  assert.equal(findSellable("fremd-x", opts), null, "andere Marke nie");
  assert.equal(findSellable("riedel-veritas-test", { ...opts, mode: "off" }), null);
  assert.equal(sellableOf(RIEDEL, opts).zerbrechlich, true);
});

test("Testartikel nur im Testmodus; Raumduft ohne Inhalt live gesperrt", () => {
  assert.ok(findSellable("testartikel-kerze", { heute: HEUTE, mode: "test", produkte: [] }));
  assert.equal(findSellable("testartikel-kerze", { heute: HEUTE, mode: "live", produkte: [] }), null);
  assert.ok(findSellable("baobab-raumduft", { heute: HEUTE, mode: "test", produkte: PRODUKTE }).grundpreisFehlt);
  assert.equal(findSellable("baobab-raumduft", { heute: HEUTE, mode: "live", produkte: PRODUKTE }), null);
  assert.deepEqual(grundpreis(500, { menge: 250, einheit: "ml" }), { cent: 2000, je: "1 l" });
  assert.equal(variantenOf(BAOBAB.preis)[1].id, "max-24");
  assert.ok(TESTARTIKEL.every((t) => t.test && /Testartikel/.test(t.name)));
});

// ------------------------------------------------------------------ Warenkorb

test("Warenkorb: Preise nur vom Server, Client-Preise werden verworfen, Menge gekappt", () => {
  const lines = normalizeCart([
    { slug: "riedel-veritas-test", menge: 2, einzelCent: 1, preis: 0.01 },
    { slug: "riedel-veritas-test", menge: 20 },
    { slug: "../etc", menge: 1 },
    { slug: "baobab-max-test", variante: "max-24", menge: -3 },
  ]);
  assert.deepEqual(lines, [{ slug: "riedel-veritas-test", variante: "standard", menge: 10 }]);
  const p = priceCart(lines, { heute: HEUTE, mode: "test", produkte: PRODUKTE });
  assert.equal(p.zeilen[0].einzelCent, 3990);
  assert.equal(p.warenCent, 39900);
  assert.equal(p.mwstCent, 39900 - Math.round(39900 / 1.2));
  const bad = priceCart(normalizeCart([{ slug: "gaggenau-x", menge: 1 }, { slug: "baobab-max-test", variante: "max-99", menge: 1 }]), { heute: HEUTE, mode: "test", produkte: PRODUKTE });
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.fehler.map((f) => f.code), ["nicht_verkaeuflich", "variante"]);
  // Seit ust.js: totals liefert zusätzlich die Aufteilung je Satz (hier nur 20 %, Versand AT).
  const t = totals(p, 700);
  assert.deepEqual({ ...t, ust: undefined }, { warenCent: 39900, versandCent: 700, gesamtCent: 40600, mwstCent: mwstAus(40600), ust: undefined });
  assert.deepEqual(t.ust.posten.map((x) => [x.satz, x.bruttoCent, x.ustCent]), [[20, 40600, mwstAus(40600)]]);
  assert.notEqual(cartHash(p.zeilen, { land: "AT", plz: "6911" }), cartHash(p.zeilen, { land: "DE", plz: "6911" }));
});

// ------------------------------------------------------------------ Versand

// Bewusst geändert 31.10.2026 (K3/K17): zerbrechlich aus dem Varianten-Feld (sonst Kategorie), nicht mehr fest „Riedel“;
// Versicherung daran gekoppelt; Paketprofil: Varianten-Versanddaten → Pakettyp → nur Abholung.
test("Paketprofile: zerbrechlich aus Variante/Kategorie → versichert, ohne Profil nicht versandfähig (außer Mock)", () => {
  assert.equal(profilOf({ marke: "riedel", kategorie: "wohnaccessoire" }).zerbrechlich, false, "Riedel nicht mehr fest zerbrechlich");
  assert.equal(profilOf({ marke: "riedel", kategorie: "wohnaccessoire", zerbrechlich: true }).versichern, true);
  assert.equal(profilOf({ marke: "kahler", kategorie: "vase", zerbrechlich: false }).versichern, false, "Varianten-Feld schlägt Kategorie");
  assert.equal(profilOf({ marke: "zalto", kategorie: "glas" }).versichern, true, "Glas: Kategorie zerbrechlich");
  assert.equal(profilOf({ marke: "baobab-collection", kategorie: "duftkerze" }).kerze, true);
  assert.deepEqual(paketeOf([{ kategorie: "glas", marke: "riedel", menge: 1 }]).fehlend, ["glas-1"], "Gewicht/Maße vom Inhaber");
  assert.deepEqual(paketeOf([{ kategorie: "glas", marke: "riedel", menge: 1 }], { mock: true }).fehlend, []);
  // Herstellerangaben der Variante reichen ohne Profil
  const v = profilOf({ kategorie: "bildband", versandGewichtG: 2400, versandMasseCm: [40, 30, 8] });
  assert.equal(v.quelle, "variante");
  assert.equal(profilVollstaendig(v), true);
  // nur Gewicht, Maße fehlen (Profil null) → nicht versandfähig
  assert.equal(profilVollstaendig(profilOf({ kategorie: "bildband", versandGewichtG: 2400 })), false);
});

// Bewusst geändert 31.10.2026 (Inhaber: „Agenten entwerfen alles“): Pakettypen tragen jetzt
// Agenten-Schätzungen (geprueft: false, nur Testmodus); Details tests/unit/shop-paketprofile.test.mjs.
test("K3: Pakettypen vollständig, Schätzungen markiert (geprueft: false); Zuordnung je Kategorie", () => {
  for (const id of ["glas-1", "glas-2er-set", "glas-3er-set", "glas-4er-set", "glas-6er-set", "karaffe", "kerze-klein", "kerze-gross", "diffuser", "bildband-mittel", "vase-klein", "vase-gross", "leuchte"]) {
    assert.ok(PAKETTYPEN[id], id);
    for (const k of ["gewichtG", "laengeCm", "breiteCm", "hoeheCm"]) assert.ok(PAKETTYPEN[id][k] > 0, `${id}.${k}: geschätzt`);
    assert.equal(PAKETTYPEN[id].geprueft, false, `${id}: live erst nach Messung`);
  }
  assert.equal(pakettypOf({ kategorie: "glas", varianteName: "4er-Set" }), "glas-4er-set");
  assert.equal(pakettypOf({ kategorie: "glas", name: "Vinum Riesling", varianteName: { de: "2 Stück" } }), "glas-2er-set");
  assert.equal(pakettypOf({ kategorie: "glas", varianteName: "3er-Set" }), "glas-3er-set");
  assert.equal(pakettypOf({ kategorie: "duftkerze", varianteName: { de: "groß" } }), "kerze-gross");
  assert.equal(pakettypOf({ kategorie: "duftkerze", varianteName: "Max 24" }), null);
  assert.equal(pakettypOf({ kategorie: "tragbare-leuchte" }), "leuchte");
  const md = fs.readFileSync("qa-screenshots/shop/PAKETPROFILE.md", "utf8");
  for (const id of Object.keys(PAKETTYPEN)) assert.ok(md.includes("`" + id + "`"), `PAKETPROFILE.md: ${id}`);
});

test("K10/K17: Ausführung im Konfigurator → Warenkorb-Variante; zerbrechlich je Variante", () => {
  const T4 = (de, en, fr, it) => ({ de, en, fr, it });
  const p = basis({
    slug: "kahler-vase-test", marke: "kahler", kategorie: "vase", name: "Vase",
    preis: { art: "verkaufspreis", varianten: [{ name: T4("groß", "large", "grand", "grande"), betrag: 52.95, zerbrechlich: true }, { name: T4("klein", "small", "petit", "piccolo"), betrag: 29.95, zerbrechlich: false }], stand: "2026-10-15", quelle: "https://x.example/v" },
    ausfuehrungen: [{ gruppe: "Größe", optionen: [{ id: "large", name: T4("groß", "large", "grand", "grande"), betrag: 52.95 }, { id: "small", name: T4("klein", "small", "petit", "piccolo"), betrag: 29.95 }] }],
  });
  const z = ausfuehrungZuVariante(p, variantenOf(p.preis));
  assert.deepEqual(z, { gross: ["large"], klein: ["small"] });
  assert.equal(varianteZurAuswahl(z, ["small"]), "klein");
  assert.equal(variantenOf({ varianten: [{ id: "large", name: "groß", betrag: 1 }] })[0].id, "large", "Varianten-ID aus Datenfeld id");
  const zeilen = priceCart([{ slug: "kahler-vase-test", variante: "klein", menge: 1 }, { slug: "kahler-vase-test", variante: "gross", menge: 1 }], { heute: HEUTE, mode: "test", produkte: [p] }).zeilen;
  assert.deepEqual(zeilen.map((x) => x.zerbrechlich), [false, true]);
  assert.equal(paketeOf(zeilen.slice(0, 1)).versichern, false);
  assert.equal(paketeOf(zeilen).versichern, true);
  assert.match(fs.readFileSync("src/components/Shop/AddToCart.js", "utf8"), /addEventListener\("katalog:ausfuehrung"/);
  assert.match(fs.readFileSync("src/components/Katalog/ReservierenSlot.js", "utf8"), /zuordnung=\{zuordnung\}/);
});

const zeilenRiedel = priceCart([{ slug: "riedel-veritas-test", variante: "standard", menge: 1 }], { heute: HEUTE, mode: "test", produkte: PRODUKTE }).zeilen;

test("Versand-Mock: Versicherung im Tarif enthalten, CH nicht verfügbar, API-Ausfall ohne Pauschale → Meldung + Abholung", async () => {
  const mock = createMockShippingAdapter();
  const r = await versandTarif({ adapter: mock, zeilen: zeilenRiedel, ziel: { land: "AT", plz: "6900", ort: "Bregenz" }, warenwertCent: 3990, now: NOW });
  assert.equal(r.ok, true);
  assert.equal(r.versichert, true);
  assert.equal(r.cent, MOCK_TARIFE.AT.guenstig.cent + MOCK_VERSICHERUNG_CENT);
  assert.equal(r.quelle, "mock");
  assert.deepEqual(await versandTarif({ adapter: mock, zeilen: zeilenRiedel, ziel: { land: "CH", plz: "9000" }, warenwertCent: 1, now: NOW }), { ok: false, fehler: "land_ch" });
  const down = await versandTarif({ adapter: createMockShippingAdapter({ fail: true }), zeilen: zeilenRiedel, ziel: { land: "DE", plz: "88131" }, warenwertCent: 1, now: NOW });
  assert.equal(down.ok, false, "nie ein geschätzter Preis");
  assert.equal(down.fehler, "api");
});

test("Adapterwahl: off → keiner, Test ohne Zugangsdaten → Mock, Test nie gegen die Live-API", () => {
  assert.equal(shippingAdapterFor(DEV, "off"), null);
  assert.equal(shippingAdapterFor(DEV, "test").kind, "letmeship-mock");
  const cred = { ...DEV, LETMESHIP_API_ID: "id", LETMESHIP_API_PASSWORD: "pw", LETMESHIP_ENV: "live" };
  assert.equal(shippingAdapterFor(cred, "test").kind, "letmeship-mock");
  const t = shippingAdapterFor({ ...cred, LETMESHIP_ENV: "test", LETMESHIP_IM_TEST: "1" }, "test", { fetchImpl: async () => ({}) });
  assert.equal(t.umgebung, "test");
  assert.equal(shippingAdapterFor({ ...PROD }, "live"), null);
});

test("LetMeShip-Adapter: Basic Auth, Testumgebung, günstigster Tarif, keine Zugangsdaten im Fehler", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith("/available"))
      return new Response(JSON.stringify({ status: { code: "0" }, serviceList: [{ baseServiceDetails: { id: "2", carrier: "DPD", name: "Classic", priceInfo: { netPrice: 9 } } }, { baseServiceDetails: { id: "1", carrier: "DHL", name: "Paket", priceInfo: { netPrice: 6.5 } } }] }), { status: 200 });
    return new Response("{}", { status: 401 });
  };
  const a = createLetMeShipAdapter({ LETMESHIP_API_ID: "geheim-id", LETMESHIP_API_PASSWORD: "geheim-pw" }, { fetchImpl });
  const q = await a.quote({ ziel: { land: "AT", plz: "6900", ort: "Bregenz" }, pakete: [{ gewichtG: 800, laengeCm: 20, breiteCm: 10, hoeheCm: 10, menge: 1, inhalt: "Glas" }], versichern: true, warenwertCent: 3990, datum: "2026-11-02" });
  assert.equal(calls[0].url, `${LMS_BASE.test}/available`);
  assert.equal(calls[0].init.headers.Authorization, `Basic ${Buffer.from("geheim-id:geheim-pw").toString("base64")}`);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.shipmentDetails.shipmentSettings.insurance, true);
  assert.equal(body.shipmentDetails.goodsValue, 39.9, "Versicherungswert = Warenwert");
  assert.equal(body.pickupInfo.address.zip, "6911");
  assert.equal(q.serviceId, "1");
  assert.equal(q.cent, 780, "netto 6,50 + 20 % USt");
  await assert.rejects(a.tracking("x"), (err) => err.code === "auth" && !/geheim/.test(err.message));
  assert.equal(createLetMeShipAdapter({}), null);
  assert.equal(kundenCent({ totalPrice: 7.2, netPrice: 6 }), 720);
  assert.equal(kundenCent({}), null);
  assert.equal(pickService([]), null);
  assert.match(trackingLink("DHL", "123"), /^https:\/\/www\.dhl\.com\//);
  assert.equal(trackingLink("MOCK-Carrier", "1"), null);
});

// ------------------------------------------------------------------ Checkout (Handler)

function ctxOf({ env = DEV, shipping = createMockShippingAdapter(), now = NOW } = {}) {
  const payStore = createMemoryStore();
  const gw = createMockGateway(env, { store: payStore, now: () => now });
  const gatewayCalls = [];
  // Mock-Mailer (wie outbox): im Testmodus darf nur er senden (orderMail.js mailerErlaubt).
  const mails = [];
  const ctx = {
    env,
    store: createMemoryOrderAdapter(),
    now: () => now,
    produkte: PRODUKTE,
    testartikel: TESTARTIKEL,
    shipping,
    limiter: createRateLimiter(),
    payments: {
      store: payStore,
      mailer: { kind: "memory", send: async (m) => (mails.push(m), { ok: true }) },
      gatewayFor: (signal, opts) => {
        gatewayCalls.push(opts);
        return gw;
      },
    },
  };
  return { ctx, payStore, gatewayCalls, mails };
}
const req = (url, body) => new Request(`http://localhost${url}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const KUNDE = { name: "Test Kundin", email: "kundin@example.invalid", telefon: "" };
const ADR = { land: "AT", plz: "6900", ort: "Bregenz", strasse: "Testgasse", hausnr: "1" };
const CART = [{ slug: "riedel-veritas-test", variante: "standard", menge: 2, einzelCent: 1 }];

test("SHOP_MODE off: Versand und Checkout liefern 404", async () => {
  const { ctx } = ctxOf({ env: PROD });
  assert.equal((await versandHandler(ctx)(req("/api/shop/versand", { cart: CART }))).status, 404);
  assert.equal((await checkoutHandler(ctx)(req("/api/shop/checkout", {}))).status, 404);
});

test("Checkout: angezeigter Versand = abgerechneter Betrag; Manipulation → 409; Mock-Session mit Server-Preisen", async () => {
  const { ctx, payStore, gatewayCalls } = ctxOf();
  const v = await (await versandHandler(ctx)(req("/api/shop/versand", { cart: CART, ziel: ADR }))).json();
  assert.equal(v.success, true);
  assert.equal(v.zeilen[0].einzelCent, 3990, "Client-Preis ignoriert");
  assert.equal(v.versand.versichert, true);
  const versandCent = v.versand.cent;
  const gesamtCent = 2 * 3990 + versandCent;
  assert.equal(v.summen.gesamtCent, gesamtCent);

  // Manipulierte Summe → 409, keine Session
  const bad = await checkoutHandler(ctx)(req("/api/shop/checkout", { cart: CART, lieferart: "versand", zahlung: "online", kunde: KUNDE, adresse: ADR, tarifId: v.versand.tarifId, angezeigt: { versandCent: 0, gesamtCent: 1 } }));
  assert.equal(bad.status, 409);
  assert.equal((await bad.json()).code, "preis_geaendert");
  assert.equal(gatewayCalls.length, 0);

  const ok = await checkoutHandler(ctx)(req("/api/shop/checkout", { cart: CART, lieferart: "versand", zahlung: "online", kunde: KUNDE, adresse: ADR, tarifId: v.versand.tarifId, angezeigt: { versandCent, gesamtCent } }));
  const body = await ok.json();
  assert.equal(ok.status, 200, JSON.stringify(body));
  assert.match(body.redirect, /\/de\/zahlung\/mock\?session=cs_mock_/);
  assert.deepEqual(gatewayCalls[0], { forceMock: true }, "Test ohne sk_test_ → Mock");
  const session = (await payStore.list("mock"))[0];
  assert.equal(session.amount_total, gesamtCent, "Stripe-Betrag = angezeigter Gesamtpreis");
  assert.deepEqual(session.line_items.map((l) => l.unit_amount), [3990, versandCent]);
  assert.equal(session.metadata.art, "shop");

  // Tarif-ID ist verbraucht → zweiter Versuch muss neu abfragen
  const again = await checkoutHandler(ctx)(req("/api/shop/checkout", { cart: CART, lieferart: "versand", zahlung: "online", kunde: KUNDE, adresse: ADR, tarifId: v.versand.tarifId, angezeigt: { versandCent, gesamtCent } }));
  assert.equal(again.status, 409);
  assert.equal((await again.json()).code, "versand_neu");
});

test("Checkout: abgelaufene Tarif-ID oder geänderte Adresse → neuer Tarif, nie stiller Betrag", async () => {
  let now = NOW;
  const { ctx } = ctxOf();
  ctx.now = () => now;
  const v = await (await versandHandler(ctx)(req("/api/shop/versand", { cart: CART, ziel: ADR }))).json();
  now += QUOTE_TTL_MS + 1000;
  const r = await checkoutHandler(ctx)(req("/api/shop/checkout", { cart: CART, lieferart: "versand", zahlung: "online", kunde: KUNDE, adresse: ADR, tarifId: v.versand.tarifId, angezeigt: { versandCent: v.versand.cent, gesamtCent: v.summen.gesamtCent } }));
  assert.equal(r.status, 409);
  const neu = await r.json();
  assert.equal(neu.code, "versand_neu");
  assert.ok(neu.versand.tarifId && neu.versand.tarifId !== v.versand.tarifId);
  const v2 = await (await versandHandler(ctx)(req("/api/shop/versand", { cart: CART, ziel: ADR }))).json();
  const r2 = await checkoutHandler(ctx)(req("/api/shop/checkout", { cart: CART, lieferart: "versand", zahlung: "online", kunde: KUNDE, adresse: { ...ADR, land: "DE", plz: "88131", ort: "Lindau" }, tarifId: v2.versand.tarifId, angezeigt: { versandCent: v2.versand.cent, gesamtCent: v2.summen.gesamtCent } }));
  assert.equal(r2.status, 409);
});

test("Checkout: CH nicht verfügbar; Zahlung vor Ort nur bei Abholung; Reservierung ohne Zahlung", async () => {
  const { ctx, gatewayCalls, mails } = ctxOf();
  const ch = await versandHandler(ctx)(req("/api/shop/versand", { cart: CART, ziel: { land: "CH", plz: "9000" } }));
  assert.equal(ch.status, 422);
  assert.equal((await ch.json()).code, "land_ch");
  const vo = await checkoutHandler(ctx)(req("/api/shop/checkout", { cart: CART, lieferart: "versand", zahlung: "vorort", kunde: KUNDE, adresse: ADR, angezeigt: { versandCent: 0, gesamtCent: 7980 } }));
  assert.equal(vo.status, 400);
  const res = await checkoutHandler(ctx)(req("/api/shop/checkout", { cart: CART, lieferart: "abholung", zahlung: "vorort", kunde: KUNDE, angezeigt: { versandCent: 0, gesamtCent: 7980 } }));
  const body = await res.json();
  assert.equal(res.status, 200, JSON.stringify(body));
  assert.match(body.redirect, /^\/de\/shop\/bestellung\?b=PH-S-\d{6}-[A-F0-9]{6}&k=[a-f0-9]{36}$/);
  assert.equal(gatewayCalls.length, 0, "keine Zahlung");
  const o = (await ctx.store.list("bestellungen"))[0];
  assert.equal(o.status, "reserviert");
  assert.equal(o.versand, null);
  // Vertragsbestätigung (§ 7 Abs 3 FAGG) sofort bei „bezahlen bei Abholung“ – im Test nur über den Mock-Mailer, Betreff [TEST].
  assert.equal(o.mail.status, "gesendet");
  assert.equal(o.mail.test, true);
  assert.equal(mails.length, 1);
  assert.match(mails[0].subject, /^\[TEST\] Auftragsbestätigung PH-S-/);
  assert.ok(mails[0].text.includes("ALLGEMEINE GESCHÄFTSBEDINGUNGEN") && mails[0].text.includes("WIDERRUFSBELEHRUNG") && mails[0].text.includes("GESETZLICHE GEWÄHRLEISTUNG"));
  const [, q] = body.redirect.split("?");
  const sp = new URLSearchParams(q);
  assert.equal((await orderView(ctx, sp.get("b"), sp.get("k"))).status, "reserviert");
  assert.equal(await orderView(ctx, sp.get("b"), "0".repeat(36)), null, "ohne Token nichts");
});

test("checkoutParams: Versand als eigene Zeile, Metadaten für Webhook und Erstattung", () => {
  const order = { id: "PH-S-261031-ABCDEF", token: "a".repeat(36), lieferart: "versand", adresse: { land: "AT" }, kunde: { email: "k@example.invalid" }, versand: { versichert: true }, summen: { versandCent: 700 }, zeilen: [{ markeName: "Riedel", name: "Veritas", varianteName: null, menge: 1, einzelCent: 3990 }] };
  const p = checkoutParams(order, { env: DEV, locale: "de" });
  assert.equal(p.line_items.length, 2);
  assert.equal(p.line_items[1].price_data.unit_amount, 700);
  assert.match(p.line_items[1].price_data.product_data.name, /versichert/);
  assert.equal(p.payment_intent_data.metadata.order_id, order.id);
  assert.match(p.success_url, /\/de\/shop\/bestellung\?b=PH-S-261031-ABCDEF&k=a+&session_id=\{CHECKOUT_SESSION_ID\}$/);
});

// ------------------------------------------------------------------ Webhook → Sendung

test("Webhook: bezahlt → Sendung + Etikett + Tracking (Mock); Abholung → kein LetMeShip-Aufruf; über payments/webhook weitergeleitet", async () => {
  const { ctx, mails } = ctxOf();
  const v = await (await versandHandler(ctx)(req("/api/shop/versand", { cart: CART, ziel: ADR }))).json();
  await checkoutHandler(ctx)(req("/api/shop/checkout", { cart: CART, lieferart: "versand", zahlung: "online", kunde: KUNDE, adresse: ADR, tarifId: v.versand.tarifId, angezeigt: { versandCent: v.versand.cent, gesamtCent: v.summen.gesamtCent } }));
  assert.equal(mails.length, 0, "Online-Zahlung: Bestätigung erst mit „bezahlt“");
  assert.equal((await ctx.store.list("bestellungen"))[0].mail.status, "ausstehend");
  let shipments = 0;
  const mock = createMockShippingAdapter({ now: () => NOW });
  const counting = { ...mock, createShipment: async (a) => (shipments++, mock.createShipment(a)) };
  const hooks = createShopHooks({ env: DEV, store: ctx.store, shipping: counting, mailer: ctx.payments.mailer, now: () => NOW });
  const order = (await ctx.store.list("bestellungen"))[0];
  const event = { id: "evt_1", type: "checkout.session.completed", livemode: false, data: { object: { id: order.session, payment_status: "paid", amount_total: order.summen.gesamtCent, metadata: { art: "shop", order_id: order.id } } } };
  assert.equal(await processEvent({ shop: hooks }, event), "bezahlt");
  const after = await ctx.store.get("bestellungen", order.id);
  assert.equal(after.status, "versandbereit");
  // Vertragsbestätigung genau einmal, mit AGB, Belehrung, Formular, Versandbedingungen (Anhänge)
  assert.equal(after.mail.status, "gesendet");
  assert.equal(mails.length, 1);
  assert.match(mails[0].subject, /^\[TEST\] Auftragsbestätigung/);
  assert.deepEqual(mails[0].attachments.map((a) => a.filename), ["AGB-Onlineshop.txt", "Widerrufsbelehrung-und-Formular.txt", "Versandbedingungen.txt"]);
  assert.match(after.sendung.awb, /^MOCK/);
  assert.ok(ctx.store.labels[order.id].length > 100, "Etikett (PDF) abgelegt");
  assert.equal(Buffer.from(ctx.store.labels[order.id], "base64").subarray(0, 5).toString(), "%PDF-");
  // Doppelte Zustellung: keine zweite Sendung, keine zweite Mail
  await hooks.onEvent(event);
  assert.equal(shipments, 1);
  assert.equal(mails.length, 1);

  // Abholung, online bezahlt → kein Versandaufruf
  const pick = await checkoutHandler(ctx)(req("/api/shop/checkout", { cart: CART, lieferart: "abholung", zahlung: "online", kunde: KUNDE, angezeigt: { versandCent: 0, gesamtCent: 7980 } }));
  assert.equal(pick.status, 200);
  const o2 = (await ctx.store.list("bestellungen")).find((o) => o.lieferart === "abholung");
  await hooks.onEvent({ ...event, data: { object: { ...event.data.object, metadata: { art: "shop", order_id: o2.id } } } });
  assert.equal(shipments, 1);
  assert.equal((await ctx.store.get("bestellungen", o2.id)).status, "bezahlt");
});

// ------------------------------------------------------------------ Sicherheit (Quelltext)

test("Shop: Geheimnisse nur auf dem Server, Client-Inseln ohne payments/shipping/mode", () => {
  const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
  for (const f of ["src/components/Shop/AddToCart.js", "src/components/Shop/ShopCart.js", "src/components/Shop/cartStore.js", "src/components/CartPage/SelectionTabs.js"]) {
    const s = read(f);
    assert.doesNotMatch(s, /lib\/payments|lib\/commerce\/shipping|lib\/shop\/(mode|handlers|server|catalog|cart)["']/, f);
    assert.doesNotMatch(s, /LETMESHIP_|STRIPE_/, f);
  }
  assert.match(read("src/lib/shop/server.js"), /^[\s\S]*?import "server-only";/);
  assert.doesNotMatch(read("src/lib/commerce/shipping/letmeship.js"), /console\.[a-z]+\([^)]*(cred|pw|auth)/i);
});
