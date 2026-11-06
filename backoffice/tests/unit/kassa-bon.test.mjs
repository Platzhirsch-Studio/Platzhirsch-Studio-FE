// Kassa – Bon-Zustand, Zahlmaske-Rechnung, Kundendisplay-Nachricht (Team B-KAS).
//   node --test tests/unit/kassa-bon.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { barZeile, bonReducer, bonSummen, idempotenzSchluessel, leererBon, mengeVon, positionenFuerServer, stueckzahl, zahlartenFuerServer, zahlstand } from "../../src/lib/backoffice/kassa/bon.js";
import { bereinige } from "../../src/lib/backoffice/kanal/protokoll.js";
import { DISPLAY_VORSCHAU } from "../../src/lib/backoffice/kassa/display.js";

const kerze = { produkt: "acc-altair", bezeichnung: "Altaïr Duftkerze", marke: "Trudon", bild: "/entwurf/lounge/p-trudon-kerze.webp", einzel_brutto_cent: 12500, steuersatz: "Normal 20" };
const glas = { produkt: "acc-bordeaux", bezeichnung: "Bordeaux Glas", einzel_brutto_cent: 6900, steuersatz: "Normal 20" };

test("Bon: gleicher Artikel erhöht die Menge, Mengenvorwahl, Entfernen, Leeren", () => {
  let b = leererBon("e1");
  b = bonReducer(b, { typ: "artikel", position: kerze });
  b = bonReducer(b, { typ: "artikel", position: kerze });
  b = bonReducer(b, { typ: "artikel", position: glas, menge: 6 });
  assert.equal(b.positionen.length, 2);
  assert.equal(mengeVon(b, "acc-altair"), 2);
  assert.equal(mengeVon(b, "acc-bordeaux"), 6);
  assert.equal(stueckzahl(b), 8);
  assert.equal(bonSummen(b).gesamt_cent, 2 * 12500 + 6 * 6900);
  assert.equal(b.aktiv, b.positionen[1].id);
  b = bonReducer(b, { typ: "menge", id: b.positionen[1].id, delta: -6 });
  assert.equal(b.positionen.length, 1, "Menge 0 entfernt die Zeile");
  b = bonReducer(b, { typ: "entfernen", id: b.positionen[0].id });
  assert.equal(b.positionen.length, 0);
  assert.equal(bonReducer(b, { typ: "leeren" }).geaendert, 0);
});

test("Bon: Gutschein und Anzahlung bleiben Menge 1, Anzahlung trägt Auftrag", () => {
  let b = leererBon("e2");
  b = bonReducer(b, { typ: "gutschein-verkauf", position: { bezeichnung: "Geschenkgutschein", einzel_brutto_cent: 5000, steuersatz: "Null 0" } });
  b = bonReducer(b, { typ: "menge", id: b.positionen[0].id, delta: 3 });
  assert.equal(b.positionen[0].menge, 1);
  b = bonReducer(b, { typ: "anzahlung", auftrag: "AB-2026-00003", position: { bezeichnung: "Anzahlung AB-2026-00003", einzel_brutto_cent: 100000 } });
  assert.equal(b.auftrag, "AB-2026-00003");
  b = bonReducer(b, { typ: "entfernen", id: b.positionen[1].id });
  assert.equal(b.auftrag, null, "ohne Anzahlungszeile kein Auftrag mehr");
});

test("Bon: Kundenkarte – Vorteile vormerken (ohne Geldwert), Kundenwechsel leert Vormerkungen", () => {
  let b = leererBon("e3");
  b = bonReducer(b, { typ: "kunde", kunde: { kontakt: "K1", titel: "Anna Muster", stufe: "Platzhirsch Plus", vorteile: [{ vorteil: "lieferung", titel: "Lieferung frei" }] } });
  b = bonReducer(b, { typ: "vorteil", id: "lieferung" });
  assert.deepEqual(b.vorgemerkt, ["lieferung"]);
  b = bonReducer(b, { typ: "artikel", position: kerze });
  assert.equal(bonSummen(b).gesamt_cent, 12500, "Vorteil ändert keinen Betrag");
  b = bonReducer(b, { typ: "kunde-weg" });
  assert.deepEqual(b.vorgemerkt, []);
});

test("Bon: Positionen für den Server ohne lokale Felder", () => {
  let b = bonReducer(leererBon("e4"), { typ: "artikel", position: kerze });
  const p = positionenFuerServer(b)[0];
  assert.deepEqual(Object.keys(p).sort(), ["art", "bezeichnung", "einzel_brutto_cent", "menge", "produkt", "steuersatz"]);
  assert.equal(idempotenzSchluessel("KASSE-LOCHAU-01", "e4"), "kassa:KASSE-LOCHAU-01:e4");
});

test("Zahlmaske: Stand, Split, Karte nicht bezahlt, Bar mit Rückgeld", () => {
  assert.deepEqual(zahlstand(12960, [{ art: "bar", betrag_cent: 12960, gegeben_cent: 15000 }]), { gesamt: 12960, gedeckt: 12960, offen: 0, rueckgeld: 2040, fertig: true, karteOffen: false });
  const s = zahlstand(10000, [{ art: "gutschein", betrag_cent: 3000 }, { art: "karte", betrag_cent: 7000, bezahlt: false }]);
  assert.equal(s.offen, 7000);
  assert.equal(s.fertig, false);
  assert.equal(zahlstand(10000, [{ art: "gutschein", betrag_cent: 3000 }, { art: "karte", betrag_cent: 7000, bezahlt: true }]).fertig, true);
  assert.deepEqual(barZeile(10000, [{ art: "gutschein", betrag_cent: 3000 }]), { art: "bar", betrag_cent: 7000, gegeben_cent: 7000 });
  const z = zahlartenFuerServer(10000, [{ art: "gutschein", betrag_cent: 3000, gutschein: "G1", rest_cent: 5000 }, { art: "bar", betrag_cent: 7000, gegeben_cent: 10000 }]);
  assert.deepEqual(z, [{ zahlart: "Gutschein", betrag_cent: 3000, gutschein: "G1", rest_cent: 5000 }, { zahlart: "Bar", betrag_cent: 7000, gegeben_cent: 10000 }]);
  assert.equal(zahlartenFuerServer(5000, [{ art: "karte", betrag_cent: 5000, terminal_payment_intent: "pi_1" }])[0].zahlart, "Karte Stripe Terminal");
});

test("Kundendisplay: Nachricht ist datensparsam (keine E-Mail, Name nur nach Einstellung)", () => {
  const n = bereinige({ zustand: "einkauf", positionen: [{ titel: "Vase", menge: 1, einzel_cent: 100, betrag_cent: 100 }], gesamt_cent: 100, kunde: { name: "Frau Anna Muster", email: "a@beispiel.invalid" }, kundenkarte: { stufe: "Platzhirsch Plus", vorteile: [{ titel: "Lieferung frei", eingeloest: true }], punkte: 99 } }, { anrede: "aus", seq: 1 });
  assert.equal(n.name, "");
  assert.equal(JSON.stringify(n).includes("beispiel.invalid"), false);
  assert.equal("punkte" in n.kundenkarte, false);
  assert.equal(bereinige({ zustand: "einkauf", positionen: [], kunde: { name: "Frau Anna Muster" } }, { anrede: "vorname" }).name, "Anna");
  for (const z of ["ruhe", "einkauf", "bezahlen", "danke"]) assert.equal(DISPLAY_VORSCHAU[z](false).zustand, z);
  assert.equal(DISPLAY_VORSCHAU.einkauf().positionen.length, 5);
  assert.equal(DISPLAY_VORSCHAU.danke(true).zahlart, "bar");
});
