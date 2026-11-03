// tests/unit/shop-rechtstexte.test.mjs — Rechtstext-Entwürfe des Shops:
// Status bleibt "entwurf" (Live gesperrt), Widerrufsbelehrung/-formular
// wörtlich nach FAGG Anhang I, Firmendaten nur aus site.js/Impressum,
// Platzhalter sichtbar, Lieferzeit aus lieferzeit.js, Vertragsbestätigung
// enthält AGB + Widerruf + Formular (§ 7 Abs 3 FAGG), Button-Wortlaut.
// Run: node --test --test-reporter=tap tests/unit/shop-rechtstexte.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LEGAL_SLOT_STATUS, SHOP_LEGAL, legalOpen, legalPlatzhalter, legalSlot, legalSlotDraft, legalSlotReleased } from "../../src/lib/shop/legal.js";
import { AGB, ANBIETER, PLATZHALTER, WIDERRUFSFORMULAR, WIDERRUF_PATH, WIDERRUF_URL, ausnahmenFuer, blocksText, lieferzeitZeilen, platzhalterIn, slotTexte, versandbedingungen, widerrufsbelehrung } from "../../src/lib/shop/legalTexte.js";
import { BESTELLNUMMER_RE, erklaerungText, recordShopWithdrawal, shopWiderrufHandler, shopWiderrufSchema } from "../../src/lib/shop/widerruf.js";
import { createMemoryOrderAdapter } from "../../src/lib/shop/orderStore.js";
import { createRateLimiter } from "../../src/lib/forms/rateLimit.js";
import { vertragsbestaetigungEntwurf } from "../../src/lib/shop/orderMail.js";
import { liveBlockers } from "../../src/lib/shop/mode.js";
import { SHOP_RELEASE } from "../../src/lib/shop/release.js";
import { SHOP_COPY } from "../../src/lib/shop/copy.js";
import { LIEFERZEIT } from "../../src/lib/shop/lieferzeit.js";
import { ADDRESS, EMAIL, LEGAL_NAME, PHONE_DISPLAY } from "../../src/lib/site.js";

const all = (blocks) => blocksText(blocks);

test("alle fünf Slots haben einen Entwurf, keiner ist freigegeben", () => {
  assert.deepEqual(SHOP_LEGAL.map((s) => s.id), ["agb", "widerruf", "widerrufsformular", "versand", "datenschutz"]);
  for (const s of SHOP_LEGAL) {
    assert.equal(s.status, LEGAL_SLOT_STATUS.ENTWURF, s.id);
    assert.equal(s.hinweis, undefined, "kein Herkunftshinweis in den Slot-Daten (Inhaber 02.11.)");
    assert.ok(legalSlotDraft(s), s.id);
    assert.equal(legalSlotReleased(s), false, s.id);
    assert.equal(s.path, `/shop/recht/${s.id}`);
    assert.equal(s.sprache, "de");
  }
  assert.deepEqual(legalOpen(), SHOP_LEGAL.map((s) => s.id));
});

test("Live bleibt gesperrt: recht:* in liveBlockers, Freigabe-Punkte offen", () => {
  const b = liveBlockers({ SHOP_MODE: "live", NODE_ENV: "production" });
  for (const s of SHOP_LEGAL) assert.ok(b.includes(`recht:${s.id}`), s.id);
  for (const id of ["agb", "widerrufsbelehrung", "widerrufsformular", "versandbedingungen", "datenschutz", "widerrufsfunktion", "gewaehrleistung-mitteilung", "vertragsbestaetigung"]) {
    const x = SHOP_RELEASE.find((r) => r.id === id);
    assert.ok(x, id);
    assert.equal(x.erledigt, false, id);
  }
});

test("Freigabe wirkt nur mit Status freigegeben (auch für Block-Texte)", () => {
  const s = legalSlot("agb");
  assert.equal(legalSlotReleased({ ...s, status: "freigegeben" }), true);
  assert.equal(legalSlotReleased({ ...s, status: "freigegeben", text: [] }), false);
  assert.equal(legalSlotReleased({ ...s, status: "freigegeben", stand: null }), false);
});

test("Firmendaten nur aus site.js und Impressum (FN/UID gleich)", () => {
  assert.equal(ANBIETER.firma, LEGAL_NAME);
  assert.equal(ANBIETER.strasse, ADDRESS.street);
  assert.equal(ANBIETER.telefon, PHONE_DISPLAY);
  assert.equal(ANBIETER.email, EMAIL);
  const imp = readFileSync(new URL("../../src/components/Impressum/impressum.js", import.meta.url), "utf8");
  assert.ok(imp.includes(`fn: "${ANBIETER.fn}"`), "FN wie Impressum");
  assert.ok(imp.includes(`uid: "${ANBIETER.uid}"`), "UID wie Impressum");
  assert.ok(imp.includes(`court: "${ANBIETER.gericht}"`), "Gericht wie Impressum");
});

test("Widerrufsbelehrung wörtlich nach Anhang I Teil A FAGG", () => {
  const t = all(widerrufsbelehrung());
  for (const satz of [
    "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.",
    "Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.",
    "mittels einer eindeutigen Erklärung (z. B. mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.",
    "Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.",
    "in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.",
    "Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.",
    "Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden.",
    "Sie tragen die unmittelbaren Kosten der Rücksendung der Waren.",
    "Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.",
    "Wenn Sie diese Online-Funktion nutzen, übermitteln wir Ihnen auf einem dauerhaften Datenträger (z. B. durch eine E-Mail) unverzüglich eine Eingangsbestätigung",
  ])
    assert.ok(t.includes(satz), satz);
  // [2] Name, Anschrift, Telefon, E-Mail
  for (const x of [LEGAL_NAME, ADDRESS.street, PHONE_DISPLAY, EMAIL]) assert.ok(t.includes(x), x);
  // Gestaltungshinweise in eckigen Klammern dürfen nicht stehen bleiben (außer PLATZHALTER).
  assert.equal(t.replace(/\[PLATZHALTER:[^\]]*\]/g, "").match(/\[\d\]/), null);
});

test("Varianten: Teillieferung (lit c), Rücksendekosten wir, Widerrufs-URL", () => {
  const c = all(widerrufsbelehrung({ variante: "c", ruecksendekosten: "wir", widerrufsUrl: "https://platzhirsch.studio/de/shop/widerruf" }));
  assert.ok(c.includes("die letzte Ware in Besitz genommen haben bzw. hat."));
  assert.ok(c.includes("Wir tragen die Kosten der Rücksendung der Waren."));
  assert.ok(c.includes("online unter https://platzhirsch.studio/de/shop/widerruf ausüben"));
  assert.equal(platzhalterIn(widerrufsbelehrung({ widerrufsUrl: "https://x.example/w" })).length, 0);
  assert.deepEqual(platzhalterIn(widerrufsbelehrung()), [], "Widerrufsfunktion gebaut – kein Platzhalter mehr");
  assert.ok(all(widerrufsbelehrung()).includes(`online unter ${WIDERRUF_URL} ausüben`));
  assert.equal(WIDERRUF_URL, `https://platzhirsch.studio/de${WIDERRUF_PATH}`);
});

test("Muster-Widerrufsformular wörtlich nach Anhang I Teil B FAGG", () => {
  const t = all(WIDERRUFSFORMULAR);
  for (const satz of [
    "(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück)",
    "Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)",
    "Bestellt am (*)/erhalten am (*)",
    "Name des/der Verbraucher(s)",
    "Anschrift des/der Verbraucher(s)",
    "Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)",
    "(*) Unzutreffendes streichen.",
    `An ${LEGAL_NAME}, ${ADDRESS.street}`,
    EMAIL,
  ])
    assert.ok(t.includes(satz), satz);
});

test("Ausnahmen § 18 Abs 1 Z 5 (Parfum) und Z 3 (Sonderanfertigung, Inhaber 02.11.)", () => {
  assert.equal(ausnahmenFuer(["parfum", "glas"]).length, 1);
  assert.equal(ausnahmenFuer(["duftkerze", "glas", "raumduft", "bildband"]).length, 0);
  assert.equal(ausnahmenFuer(["sonderanfertigung"]).length, 1);
  const t = all(slotTexte().widerruf);
  assert.match(t, /versiegelt geliefert/);
  assert.match(t, /nach Kundenspezifikationen angefertigt/);
});

test("AGB: KSchG-konform, kein OS-Link, Button-Wortlaut, Rom I, VGG 2026", () => {
  const t = all(AGB);
  assert.match(t, /„Zahlungspflichtig bestellen“/);
  assert.match(t, /einschließlich der gesetzlichen Umsatzsteuer/);
  assert.match(t, /Eigentum/);
  assert.match(t, /Stripe/);
  assert.match(t, /Art\. 6 Abs 2 Rom-I-VO/);
  assert.match(t, /§ 14 KSchG/);
  assert.match(t, /verlängert sich die Gewährleistungsfrist einmal um ein Jahr \(§ 10 Abs 2a VGG\)/);
  assert.match(t, /innerhalb von zwei Jahren/);
  assert.match(t, /bezahlen bei Abholung/);
  // verbotene/überholte Klauseln
  assert.doesNotMatch(t, /ec\.europa\.eu\/consumers\/odr|OS-Plattform/i, "kein Link zur EU-OS-Plattform (VO 2024/3228)");
  assert.doesNotMatch(t, /Schriftform/, "keine Schriftformklausel (§ 10 Abs 3 KSchG)");
  // Haftungsbeschränkung (Inhaber 02.11.) nur in den Grenzen des § 6 Abs 1 Z 9 KSchG, DE-Rückausnahme Kardinalpflichten.
  assert.match(t, /leichter Fahrlässigkeit haften wir nicht/);
  assert.match(t, /gilt nicht für Personenschäden, für Ansprüche nach dem Produkthaftungsgesetz/);
  assert.match(t, /grob fahrlässig/);
  assert.match(t, /wesentlicher Vertragspflichten/);
  // Gerichtsstand (Inhaber 02.11.): Verbraucher § 14 KSchG, Unternehmer Wien.
  assert.match(t, /Gericht in Wien ausschließlich zuständig/);
  assert.match(t, /13\.2 Für Verbraucherinnen und Verbraucher gelten die gesetzlichen Gerichtsstände/);
  // Weitere Inhaber-Vorgaben 02.11.: Rücksendekosten vorab, Wertersatz, Zurückbehaltung, Fixtermin-Vorbehalt, Eigentumsvorbehalt.
  assert.match(t, /7\.3 Widerrufen Sie den Vertrag, tragen Sie die unmittelbaren Kosten der Rücksendung/);
  assert.match(t, /§ 14 Abs 2 FAGG/);
  assert.match(t, /keine Fixtermine/);
  assert.match(t, /vollständigen Bezahlung unser Eigentum/);
  assert.ok(t.includes(`„Vertrag widerrufen“ erklären (${WIDERRUF_URL})`));
  assert.doesNotMatch(t, /KI|Agent/, "kein Herkunftshinweis im Text");
  assert.doesNotMatch(t, /möglichst nahe/, "keine Ersetzungsklausel");
  assert.doesNotMatch(t, /Schlichtung für Verbrauchergeschäfte/, "Schlichtung nur, wenn Impressum Bereitschaft erklärt");
});

test("Versandbedingungen: AT/DE, CH Abholung, Lieferzeit aus lieferzeit.js", () => {
  const t = all(versandbedingungen());
  assert.match(t, /Österreich und Deutschland/);
  assert.match(t, /Schweiz/);
  assert.match(t, /versichert/);
  assert.match(t, /Teillieferungen/i);
  assert.match(t, /Transportschäden/i);
  assert.match(t, /§ 7a KSchG/);
  const at = LIEFERZEIT.versand.AT.lager;
  assert.ok(t.includes(`${at.min}–${at.max} Werktage`), "Wert aus lieferzeit.js");
  // folgt der Konfiguration, statt eigene Zahlen zu haben
  const cfg = { versand: { AT: { lager: { min: 9, max: 11, freigegeben: true, freigabe: { datum: "2026-11-02", durch: "Inhaber" } } } } };
  const z = lieferzeitZeilen(cfg);
  assert.ok(z[0].includes("9–11 Werktage"));
  assert.ok(!z[0].includes("Entwurf"));
  assert.ok(lieferzeitZeilen()[0].includes("Entwurf"));
});

test("Datenschutz Shop: Stripe, LetMeShip, Rechtsgrundlagen, 7 Jahre § 132 BAO", () => {
  const t = all(slotTexte().datenschutz);
  for (const x of ["Stripe Payments Europe", "LetMeShip", "Art. 6 Abs 1 lit b", "Art. 6 Abs 1 lit c", "Art. 6 Abs 1 lit f", "§ 132 Abs 1 BAO", "sieben Jahre"]) assert.ok(t.includes(x), x);
});

test("Platzhalter sind sichtbar und gelistet", () => {
  const p = legalPlatzhalter();
  for (const v of [PLATZHALTER.zahlungsartenOnline, PLATZHALTER.zahlungsartenShowroom, PLATZHALTER.letmeship, PLATZHALTER.gewaehrleistungsMitteilung]) assert.ok(p.includes(v), v);
  assert.equal(p.length, 4, "nur noch die vier Inhaber-Angaben offen (Zahlungsarten online/Showroom, LetMeShip-Anschrift, Anhang II)");
  assert.equal(PLATZHALTER.widerrufsfunktion, undefined);
  assert.equal(PLATZHALTER.versanddienste, undefined);
  for (const v of p) assert.match(v, /^\[PLATZHALTER: /);
});

test("Vertragsbestätigung (Entwurf): AGB + Widerruf + Formular, nichts versendet", () => {
  const order = {
    id: "PH-S-261031-ABC123",
    lieferart: "versand",
    zahlung: "online",
    kunde: { name: "Test Kunde", email: "kunde@example.invalid" },
    adresse: { strasse: "Teststraße", hausnr: "1", plz: "6900", ort: "Bregenz", land: "AT" },
    zeilen: [
      { markeName: "Cire Trudon", name: "Eau de Parfum", varianteName: { de: "100 ml" }, menge: 1, einzelCent: 18000, summeCent: 18000, kategorie: "parfum" },
      { markeName: "Riedel", name: "Glas", varianteName: null, menge: 2, einzelCent: 2500, summeCent: 5000, kategorie: "glas" },
    ],
    summen: { warenCent: 23000, versandCent: 990, gesamtCent: 23990, mwstCent: 3998 },
    versand: { versichert: true },
    angelegt: "2026-10-31T10:00:00.000Z",
  };
  const m = vertragsbestaetigungEntwurf(order);
  assert.equal(m.status, "entwurf");
  assert.match(m.betreff, /PH-S-261031-ABC123/);
  for (const x of ["WIDERRUFSBELEHRUNG", "Muster-Widerrufsformular".toUpperCase(), "ALLGEMEINE GESCHÄFTSBEDINGUNGEN", "239,90 €", "1 × Cire Trudon Eau de Parfum (100 ml)", "Ausschluss des Widerrufsrechts", ANBIETER.uid]) assert.ok(m.text.includes(x), x);
  assert.deepEqual(m.enthaelt.filter((x) => ["agb", "widerrufsbelehrung", "widerrufsformular"].includes(x)), ["widerrufsbelehrung", "widerrufsformular", "agb"]);
  assert.ok(m.text.includes(WIDERRUF_URL), "Rücktrittsfunktion in der Vertragsbestätigung");
  assert.ok(m.platzhalter.includes(PLATZHALTER.zahlungsartenOnline));
  assert.equal(m.hinweis, undefined);
  assert.doesNotMatch(m.text, /Anmerkung|Kanzlei prüfen/, "keine internen Notizen in der Mail");
  const ohne = vertragsbestaetigungEntwurf({ ...order, zeilen: [order.zeilen[1]], lieferart: "abholung", zahlung: "vorort" }, { teillieferung: true });
  assert.doesNotMatch(ohne.text, /Ausschluss des Widerrufsrechts/);
  assert.match(ohne.text, /Zahlung bei Abholung/);
  assert.match(ohne.text, /die letzte Ware in Besitz genommen/);
});

test("Button bei Abholung + Zahlung vor Ort: „Zahlungspflichtig bestellen“ (§ 8 Abs 2 FAGG)", () => {
  for (const l of ["de", "en", "fr", "it"]) assert.equal(SHOP_COPY[l].reserveSubmit, SHOP_COPY[l].buy, l);
  assert.equal(SHOP_COPY.de.reserveSubmit, "Zahlungspflichtig bestellen");
  assert.doesNotMatch(SHOP_COPY.de.legalNote, /\[Wortlaut/);
});

// ---------- Online-Rücktrittsfunktion § 13a FAGG (widerruf.js) ----------

const ORDER_ID = "PH-S-261102-ABC123";
const ERKLAERUNG = { bestellung: ORDER_ID, bestelltAm: "2026-11-02", erhaltenAm: "", name: "Test Kundin", anschrift: "Teststraße 1, 6900 Bregenz", email: "kundin@example.invalid", artikel: "2 × Riedel Glas", bestaetigt: true };

async function widerrufCtx({ mode = "test", mailer } = {}) {
  const store = createMemoryOrderAdapter();
  await store.put("bestellungen", ORDER_ID, { id: ORDER_ID, status: "bezahlt", kunde: { name: "Test Kundin", email: "Kundin@example.invalid" }, verlauf: [] });
  return { store, now: () => Date.parse("2026-11-02T10:00:00Z"), env: { NODE_ENV: "test" }, mode, mailer };
}

test("Widerruf: Schema = Felder des Muster-Formulars, Bestellnummer-Muster", () => {
  assert.ok(BESTELLNUMMER_RE.test(ORDER_ID));
  assert.equal(shopWiderrufSchema.safeParse(ERKLAERUNG).success, true);
  assert.equal(shopWiderrufSchema.safeParse({ ...ERKLAERUNG, bestaetigt: false }).success, false);
  assert.equal(shopWiderrufSchema.safeParse({ ...ERKLAERUNG, bestelltAm: "02.11.2026" }).success, false);
  assert.equal(shopWiderrufSchema.safeParse({ ...ERKLAERUNG, anschrift: "" }).success, false);
  // Inhaber 03.11.2026: Bestellnummer optional – die Funktion gilt auch für Verträge außerhalb des Onlineshops (/widerruf)
  const ohne = shopWiderrufSchema.safeParse({ ...ERKLAERUNG, bestellung: "" });
  assert.equal(ohne.success, true);
  assert.equal(ohne.data.bestellung, "");
  assert.equal(shopWiderrufSchema.safeParse({ ...ERKLAERUNG, bestellung: undefined }).success, true);
});

test("Widerruf ohne Bestellnummer (Vertrag außerhalb des Shops): abgelegt, nicht zugeordnet, Erklärung ohne Nummer", async () => {
  const ctx = await widerrufCtx({ mode: "test" });
  const r = await recordShopWithdrawal(ctx, { ...ERKLAERUNG, bestellung: "" });
  assert.equal(r.zugeordnet, false);
  const w = await ctx.store.get("widerrufe", r.id);
  assert.equal(w.bestellung, null);
  assert.equal(w.angabe, null);
  assert.match(erklaerungText({ ...ERKLAERUNG, bestellung: "" }), /Bestellnummer: – \(Vertrag außerhalb des Onlineshops\)/);
  const o = await ctx.store.get("bestellungen", ORDER_ID);
  assert.equal(o.widerruf, undefined, "fremde Bestellung bleibt unberührt");
});

test("Widerruf im Testmodus: abgelegt, Bestellung markiert, KEINE Mail", async () => {
  let gesendet = 0;
  const ctx = await widerrufCtx({ mode: "test", mailer: { send: async () => { gesendet++; return { ok: true }; } } });
  const r = await recordShopWithdrawal(ctx, ERKLAERUNG);
  assert.match(r.id, /^WS-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  assert.equal(r.zugeordnet, true);
  assert.equal(r.mail, "testmodus");
  assert.equal(gesendet, 0);
  const o = await ctx.store.get("bestellungen", ORDER_ID);
  assert.equal(o.widerruf.id, r.id);
  assert.equal(o.verlauf.at(-1).status, "widerruf_eingegangen");
  const w = await ctx.store.get("widerrufe", r.id);
  assert.equal(w.bestellung, ORDER_ID);
  assert.equal(w.mail, "testmodus");
});

test("Widerruf live: Eingangsbestätigung mit Inhalt, Datum, Uhrzeit; Unbekanntes ohne Freitext", async () => {
  const mails = [];
  const mailer = { send: async (m) => { mails.push(m); return { ok: true }; } };
  const ctx = await widerrufCtx({ mode: "live", mailer });
  const r = await recordShopWithdrawal(ctx, ERKLAERUNG);
  assert.equal(r.mail, "gesendet");
  assert.equal(mails[0].to, ERKLAERUNG.email);
  for (const x of [r.id, "2. November 2026", "11:00", "2 × Riedel Glas", "Teststraße 1", "Bestellnummer: " + ORDER_ID, "ursprüngliche Zahlungsmittel"]) assert.ok(mails[0].text.includes(x), x);
  const fremd = await recordShopWithdrawal(ctx, { ...ERKLAERUNG, email: "andere@example.invalid" });
  assert.equal(fremd.zugeordnet, false);
  assert.equal(fremd.mail, "gesendet");
  assert.doesNotMatch(mails[1].text, /Riedel|Teststraße/, "kein Freitext an nicht zugeordnete Adressen");
  const o = await ctx.store.get("bestellungen", ORDER_ID);
  assert.equal(o.widerruf.id, r.id, "fremde Erklärung ändert die Bestellung nicht");
});

test("POST /api/shop/widerruf: 404 bei SHOP_MODE off, sonst Eingangsnummer", async () => {
  const req = (body) => new Request("https://platzhirsch.studio/api/shop/widerruf", { method: "POST", headers: { "content-type": "application/json", host: "platzhirsch.studio", origin: "https://platzhirsch.studio" }, body: JSON.stringify(body) });
  const base = await widerrufCtx();
  const off = shopWiderrufHandler({ ...base, env: { SHOP_MODE: "off" } }, { limiter: createRateLimiter() });
  assert.equal((await off(req(ERKLAERUNG))).status, 404);
  const on = shopWiderrufHandler({ ...base, env: { SHOP_MODE: "test", NODE_ENV: "test" }, payments: { mailer: { send: async () => ({ ok: true }) } } }, { limiter: createRateLimiter() });
  const res = await on(req({ ...ERKLAERUNG, _t: 10_000 }));
  assert.equal(res.status, 200);
  const j = await res.json();
  assert.equal(j.success, true);
  assert.match(j.id, /^WS-/);
  const bad = await on(req({ ...ERKLAERUNG, email: "x", _t: 10_000 }));
  assert.equal(bad.status, 400);
});

test("Seiten: Rücktrittsfunktion verlinkt (Belehrung, Bestellseite), Route vorhanden, keine Herkunftshinweise", () => {
  const read = (p) => readFileSync(new URL("../../" + p, import.meta.url), "utf8");
  const slotPage = read("src/app/[locale]/shop/recht/[slot]/page.js");
  assert.ok(slotPage.includes("data-shop-recht-widerruf-button"));
  assert.ok(slotPage.includes("WIDERRUF_URL"));
  assert.ok(read("src/app/[locale]/shop/bestellung/page.js").includes('pathname: "/shop/recht/widerruf-formular"'));
  assert.ok(read("src/app/api/shop/widerruf/route.js").includes("shopRoutes.widerruf"));
  assert.ok(read("src/app/[locale]/shop/recht/widerruf-formular/page.js").includes("WiderrufForm"));
  assert.ok(read("src/app/[locale]/shop/recht/widerruf-formular/bestaetigung/page.js").includes("data-shop-widerruf-bestaetigung"));
  for (const p of ["src/lib/shop/legalTexte.js", "src/lib/shop/legal.js", "src/lib/shop/orderMail.js", "src/lib/shop/release.js", "src/lib/shop/widerruf.js", "src/app/[locale]/shop/recht/[slot]/page.js"]) {
    assert.doesNotMatch(read(p), /KI-Agent|LEGAL_TEXT_HINWEIS|Claude/, p);
  }
});
