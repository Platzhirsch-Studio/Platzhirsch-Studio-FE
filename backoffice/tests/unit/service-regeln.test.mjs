// Bereich Service (B-SER): reine Regeln – Fristen (Spiegel fristen.py), nächster Schritt (Spiegel schritte.py),
// Regeln D-1…D-3, Meldezustand, Telefon, Labels, Katalog = install.py.
//   node --test tests/unit/service-regeln.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fristen, monateDazu, iso, reaktionsfrist, tageBis } from "../../src/lib/backoffice/service/fristen.js";
import { naechsterSchritt, knopfFuer } from "../../src/lib/backoffice/service/naechsterSchritt.js";
import { abschlussMitgeteilt, bannerKandidaten, gewaehrleistungKompakt, maengelanzeigeOffen, meldezustand, mitteilungsKommentar, reaktionUeberfaellig, rotesSignal, schliessbar, fallZaehler } from "../../src/lib/backoffice/service/regeln.js";
import { normalisiereTelefon, telefonPasst, istTelefon } from "../../src/lib/backoffice/service/telefon.js";
import { FALL_STATUS, fallStatus, phaseIndex, text } from "../../src/lib/backoffice/service/labels.js";
import { FEHLERBEREICHE, FEHLERCODES } from "../../src/lib/backoffice/service/katalog.js";
import { T } from "../../src/lib/backoffice/service/texte.js";

const H = "2026-11-04";

test("Fristen: Monatsende-sicher und wie fristen.py (Verbraucher, Unternehmer, fest eingebaut)", () => {
  assert.equal(iso(monateDazu("2026-01-31", 1)), "2026-02-28");
  assert.equal(iso(monateDazu("2028-01-31", 1)), "2028-02-29");
  assert.equal(iso(monateDazu("2026-11-30", -1)), "2026-10-30");
  const v = fristen({ uebergabe: "2025-03-14", kundentyp: "Verbraucher", heute: H });
  assert.deepEqual([v.gewaehrleistung_bis, v.beweislast_bis, v.verjaehrung_bis, v.status, v.beweislast], ["2027-03-14", "2026-03-14", "2027-06-14", "Gewaehrleistung", "Kunde"]);
  const u = fristen({ uebergabe: "2026-08-01", kundentyp: "Unternehmer", heute: H });
  assert.equal(u.beweislast_bis, "2027-02-01");
  assert.equal(u.status, "Gewaehrleistung (Vermutung)");
  const fest = fristen({ uebergabe: "2026-01-10", sachart: "Unbeweglich", heute: H });
  assert.deepEqual([fest.gewaehrleistung_bis, fest.beweislast_bis], ["2029-01-10", "2026-07-10"]);
  assert.equal(fristen({ heute: H }).status, "Unbekannt");
  const alt = fristen({ uebergabe: "2023-01-01", garantie_monate: 60, heute: H });
  assert.equal(alt.status, "Nur Garantie");
  assert.equal(fristen({ uebergabe: "2026-01-01", erledigt_am: "2026-10-31 10:00:00", heute: H }).regress_frist_bis, "2026-12-31");
  assert.equal(reaktionsfrist("2026-11-06 09:00:00", 2), "2026-11-10", "Freitag + 2 Werktage = Dienstag");
  assert.equal(tageBis("2026-11-06", H), 2);
});

// Fälle wie ph_service/utils/schritte.py (gemeinsame Testdatei mit dem Python-Test, Anfrage A-S2)
const FAELLE = [
  [{ status: "Gemeldet", frist_reaktion: "2026-11-05" }, "erstreaktion_erfassen", "2026-11-05", 1001],
  [{ status: "Gemeldet", erstreaktion_am: "x", frist_loesung: "2026-11-20" }, "pruefen", "2026-11-20", 1016],
  [{ status: "Gemeldet", erstreaktion_am: "x", fehlercode: "POL-03" }, "pruefen", null, 5000],
  [{ status: "Geprueft" }, "entscheiden", null, 5000],
  [{ status: "Entscheidung", kulanz_freigabe_status: "Angefordert" }, "kulanz_freigeben", null, 5000],
  [{ status: "In Bearbeitung", ersatzteile_benoetigt: 1 }, "ersatzteile_bestellen", null, 5000],
  [{ status: "In Bearbeitung", ersatzteile_offen: 1, ersatzteile_erwartet_am: "2026-11-03" }, "ersatzteile_verfolgen", "2026-11-03", 999],
  [{ status: "Entscheidung", entscheidung: "Austausch" }, "einsatz_anlegen", null, 5000],
  [{ status: "Einsatz geplant", naechster_einsatz: "2026-11-06" }, "einsatz", "2026-11-06", 1002],
  [{ status: "In Bearbeitung", entscheidung: "Verbesserung", einsaetze_offen: 1 }, "erledigt_melden", null, 5000],
  [{ status: "Erledigt", lieferantenrelevant: 1, regress_frist_bis: "2026-12-28" }, "lieferant_informieren", "2026-12-28", 1054],
  [{ status: "Erledigt", lieferantenrelevant: 1, regress_vorhanden: 1 }, "kunde_informieren", null, 5000],
  [{ status: "Erledigt", kunde_informiert_am: "x" }, "schliessen", null, 5000],
  [{ status: "Geschlossen" }, null, null, 99999],
  [{ status: "Abgelehnt", frist_loesung: "2026-11-20" }, null, null, 99999],
];

test("Nächster Schritt: Spiegel von schritte.py – Aktion, Fälligkeit, Rang", () => {
  for (const [fall, aktion, faellig, rang] of FAELLE) {
    const r = naechsterSchritt(fall, H);
    assert.deepEqual([r.aktion, r.faellig, r.rang], [aktion, faellig, rang], JSON.stringify(fall));
  }
});

test("Nächster Schritt: Knopf der Oberfläche (E-Mail entscheidet, Blocker, Leitung)", () => {
  const s = naechsterSchritt({ status: "Gemeldet" }, H);
  assert.equal(knopfFuer({ kunde_email: "a@b.invalid" }, s).id, "eingang-senden");
  assert.equal(knopfFuer({ kunde_email: "a@b.invalid" }, s).neben.id, "telefonat");
  assert.equal(knopfFuer({}, s).id, "telefonat");
  const k = naechsterSchritt({ status: "Entscheidung", kulanz_freigabe_status: "Angefordert" }, H);
  assert.equal(knopfFuer({}, k).art, "blocker");
  assert.equal(knopfFuer({}, k, { leitung: true }).id, "kulanz-freigeben");
  assert.equal(knopfFuer({}, naechsterSchritt({ status: "Erledigt", kunde_informiert_am: "x" }, H)).titel, "Schließen");
});

test("Regeln: D-1 Reaktion überfällig, D-2 Mängelanzeige offen, D-3 Abschluss mitgeteilt, Schließen", () => {
  assert.equal(reaktionUeberfaellig({ status: "Gemeldet", frist_reaktion: "2026-11-03" }, H), true);
  assert.equal(reaktionUeberfaellig({ status: "Gemeldet", frist_reaktion: "2026-11-04" }, H), false);
  assert.equal(reaktionUeberfaellig({ status: "Gemeldet", frist_reaktion: "2026-11-03", erstreaktion_am: "x" }, H), false);
  const f = { status: "Geprueft", lieferantenrelevant: 1, mangel_bestaetigt: "Ja" };
  assert.equal(maengelanzeigeOffen(f), true);
  assert.equal(maengelanzeigeOffen(f, { regresse: [{ name: "R" }] }), false);
  assert.equal(maengelanzeigeOffen({ ...f, mangel_bestaetigt: "Nein" }), false);
  assert.equal(maengelanzeigeOffen({ ...f, lieferantenrelevant: 0, art: "Transportschaden" }), true);
  const erledigt = { status: "Erledigt", erledigt_am: "2026-11-01 10:00:00" };
  assert.equal(abschlussMitgeteilt(erledigt), false);
  const k = mitteilungsKommentar({ vorlage: "Abschluss", kanal: "Telefon", datum: "02.11.2026", person: "Anna" });
  assert.equal(abschlussMitgeteilt(erledigt, { kommentare: [{ content: k, creation: "2026-11-02 09:00:00" }] }), true);
  assert.equal(abschlussMitgeteilt(erledigt, { kommentare: [{ content: k, creation: "2026-10-30 09:00:00" }] }), false, "vor Erledigung zählt nicht");
  assert.equal(abschlussMitgeteilt({ ...erledigt, abnahme_bestaetigt: 1 }), true);
  assert.equal(schliessbar(erledigt).ok, false);
  assert.equal(schliessbar({ ...erledigt, abnahme_bestaetigt: 1 }).ok, true);
  assert.equal(schliessbar({ ...erledigt, abnahme_bestaetigt: 1, lieferantenrelevant: 1, regress_frist_bis: "2027-01-01" }).ok, false, "Forderung offen");
  assert.equal(schliessbar({ ...erledigt, lieferantenrelevant: 1 }, { leitung: true }).ok, true);
  assert.ok(schliessbar({ ...erledigt, lieferantenrelevant: 1 }, { leitung: true }).hinweis);
});

test("Regeln: Meldezustand ab Meldung (R-01), rotes Signal, Gewährleistung kompakt, Banner-Rang", () => {
  const f = { gemeldet_am: "2026-03-01 10:00:00", beweislast_bis: "2026-02-01", gewaehrleistung_bis: "2027-02-01", kundentyp: "Verbraucher" };
  assert.deepEqual(meldezustand(f), { zustand: "gewaehrleistung", stichtag: "2026-03-01", paragraf: "§ 10 VGG" });
  assert.equal(meldezustand({ ...f, erstauftreten: "2026-01-15" }).zustand, "vermutung");
  assert.equal(meldezustand({ ...f, gemeldet_am: "2027-03-01" }).zustand, "abgelaufen");
  assert.equal(meldezustand({ gemeldet_am: "2026-03-01" }).zustand, "unbekannt");
  assert.equal(rotesSignal({ status: "Gemeldet", frist_reaktion: "2026-11-01", eskalationsstufe: 2 }, H).art, "reaktion");
  assert.equal(rotesSignal({ status: "In Bearbeitung", eskalationsstufe: 1, sla_eskalationsstufe: 3 }, H).text, "Eskalation 3");
  assert.equal(rotesSignal({ status: "Geschlossen", eskalationsstufe: 3 }, H), null);
  assert.deepEqual(gewaehrleistungKompakt({ status: "Gemeldet", gewaehrleistung_bis: "2026-11-14" }, H), { text: "noch 10 Tage", ton: "warn" });
  assert.deepEqual(gewaehrleistungKompakt({ status: "Gemeldet", gewaehrleistung_bis: "2026-11-01" }, H), { text: "seit 3 Tagen abgelaufen", ton: "abgelaufen" });
  assert.equal(gewaehrleistungKompakt({ status: "Erledigt", gewaehrleistung_bis: "2026-11-14" }, H).text, "");
  const b = bannerKandidaten({ status: "Entscheidung", kulanz_freigabe_status: "Angefordert", kulanz_cent: 62000, quelle: "website", portal_sichtbar: 0 }, { heute: H });
  assert.deepEqual(b.map((x) => x.id), ["kulanz-wartet", "zuordnung"]);
  assert.match(b[0].titel, /620,00 €/);
  assert.deepEqual(fallZaehler("F1", { ersatzteile: [{ status: "Benoetigt" }, { status: "Bestellt" }], einsaetze: [{ servicefall: "F1", status: "Geplant", datum: "2026-11-06" }], regresse: [], bestellungen: [] }), { ersatzteile_benoetigt: 1, ersatzteile_offen: 1, einsaetze_offen: 1, regress_vorhanden: 0, naechster_einsatz: "2026-11-06", ersatzteile_erwartet_am: null });
});

test("Telefon: jede Schreibweise ergibt dieselbe Ziffernfolge", () => {
  for (const t of ["+43 664 123 45 67", "0043 664/1234567", "0664 1234567", "+43 (0)664 1234567"]) assert.equal(normalisiereTelefon(t), "6641234567", t);
  assert.equal(normalisiereTelefon("+49 8382 123456"), "8382123456");
  assert.ok(telefonPasst("+43 664 1234567", "0664 1234"));
  assert.ok(istTelefon("0664 1234567"));
  assert.ok(!istTelefon("Sofa grau"));
});

test("Labels: „Entschieden“ statt Entscheidung, Phasen, Umlaute", () => {
  assert.equal(FALL_STATUS.Entscheidung.text, "Entschieden");
  assert.deepEqual(fallStatus({ status: "Entscheidung", kulanz_freigabe_status: "Angefordert" }).zusatz, "wartet auf Freigabe");
  assert.equal(phaseIndex("Einsatz geplant"), 3);
  assert.equal(phaseIndex("Abgelehnt"), -1);
  assert.equal(text("Weiterer Einsatz noetig"), "Weiterer Einsatz nötig");
  assert.equal(text("Geprueft"), "Geprüft");
});

test("Katalog: identisch mit ph_service/install.py (12 Bereiche, 57 Codes)", () => {
  const src = fs.readFileSync(path.resolve("../Backend-Import/ph_service/ph_service/install.py"), "utf8");
  assert.equal(FEHLERBEREICHE.length, 12);
  assert.equal(FEHLERCODES.length, 57);
  for (const [code, bereich, bez] of FEHLERCODES) assert.ok(src.includes(`("${code}", "${bereich}", "${bez}"`), code);
});

test("Texte: keine Superlative, keine Entwicklerbegriffe", () => {
  const alle = JSON.stringify(T, (k, v) => (typeof v === "function" ? v(1, 2, 3) : v));
  assert.doesNotMatch(alle, /(beste[nrs]?|perfekt\w*|optimal\w*|einzigartig\w*|revolution\w*)/i);
  assert.doesNotMatch(alle, /DocType|workflow_state|Submit\b|GWL/);
});
