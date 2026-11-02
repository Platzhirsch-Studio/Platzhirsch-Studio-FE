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
import { AGB, ANBIETER, PLATZHALTER, WIDERRUFSFORMULAR, ausnahmenFuer, blocksText, lieferzeitZeilen, platzhalterIn, slotTexte, versandbedingungen, widerrufsbelehrung } from "../../src/lib/shop/legalTexte.js";
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
    assert.equal(s.hinweis, "Entwurf von KI-Agenten, Kanzlei-Durchsicht empfohlen");
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
  assert.deepEqual(platzhalterIn(widerrufsbelehrung()), [PLATZHALTER.widerrufsfunktion]);
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

test("Ausnahme § 18 Abs 1 Z 5 FAGG nur für Parfum, keine Personalisierung (Z 3)", () => {
  assert.equal(ausnahmenFuer(["parfum", "glas"]).length, 1);
  assert.equal(ausnahmenFuer(["duftkerze", "glas", "raumduft", "bildband"]).length, 0);
  const t = all(slotTexte().widerruf);
  assert.match(t, /versiegelt geliefert/);
  assert.doesNotMatch(t, /Kundenspezifikation|personalisiert/);
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
  assert.doesNotMatch(t, /haften nicht|Haftung .*ausgeschlossen/, "kein Haftungsausschluss (§ 6 Abs 1 Z 9 KSchG)");
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
  for (const v of [PLATZHALTER.widerrufsfunktion, PLATZHALTER.zahlungsartenOnline, PLATZHALTER.letmeship, PLATZHALTER.gewaehrleistungsMitteilung]) assert.ok(p.includes(v), v);
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
  assert.ok(m.platzhalter.includes(PLATZHALTER.widerrufsfunktion));
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
