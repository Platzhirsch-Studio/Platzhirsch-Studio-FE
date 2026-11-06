// Bereich Sortiment – Mock-Pfad der Fachaufrufe (MASTER § 5.3 Nr. 5) gegen den MockClient: Produkt anlegen und
// veröffentlichen, Preis mit Stand, Freigaben, Bestellkette Entwurf → Gesendet → AB → bestätigt → Wareneingang →
// Abschluss, Export IWOfurn/EDI/CSV mit Übermittlung, Seed deckt jeden Status ab, Texte ohne Rohwerte.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ladeMetaIndex } from "../../src/lib/backoffice/frappe/meta.js";
import { baueDatenbank } from "../../src/lib/backoffice/mock/seed/index.js";
import { MockClient } from "../../src/lib/backoffice/mock/client.js";
import * as M from "../../src/lib/backoffice/sortiment/methoden.js";
import { GLOSSAR, anzeigeWert } from "../../src/lib/backoffice/sortiment/texte.js";
import { TOENE, status } from "../../src/lib/backoffice/sortiment/status.js";
import { pruefeAktionen } from "../../src/lib/backoffice/commit/aktionen/index.js";
import sortimentAktionen from "../../src/lib/backoffice/commit/aktionen/sortiment.js";
import bereich from "../../src/lib/backoffice/bereiche/sortiment.js";
import { pruefeBereiche, BEREICHE } from "../../src/lib/backoffice/bereiche/index.js";
import kuerzel from "../../src/lib/backoffice/kuerzel/sortiment.js";
import aufgaben from "../../src/lib/backoffice/aufgaben/sortiment.js";
import { pruefeQuellen } from "../../src/lib/backoffice/aufgaben/index.js";
import freigaben from "../../src/lib/backoffice/freigaben/sortiment.js";
import { pruefeFreigaben } from "../../src/lib/backoffice/freigaben/index.js";

const index = ladeMetaIndex();
const LEITUNG = { user: "sortiment@demo.local", name: "Leitung", roles: ["PH Sortiment Leitung", "PH Sortiment Mitarbeiter"] };
const TEAM = { user: "team@demo.local", name: "Team", roles: ["PH Sortiment Mitarbeiter"] };

function frisch(session = LEITUNG) {
  const db = { ...baueDatenbank(index), kommentare: new Map(), versionen: new Map(), dateien: new Map() };
  return { db, client: new MockClient(session, { index, db, jetzt: () => new Date(2026, 10, 4, 10, 0) }) };
}

test("Seed: jeder Status, Leer-/Fehlerfälle und Bezüge vorhanden", () => {
  const { db } = frisch();
  const werte = (dt, feld = "status") => new Set([...db.db.get(dt).values()].map((d) => d[feld]));
  for (const s of ["Entwurf", "Geprueft", "Aktiv", "Pausiert", "Ausgelaufen"]) assert.ok(werte("PH Produkt").has(s), `Produkt ${s}`);
  for (const s of ["Entwurf", "Gesendet", "AB erhalten", "AB geprueft", "Teilgeliefert", "Geliefert", "Abgeschlossen", "Storniert"]) assert.ok(werte("PH Herstellerbestellung").has(s), `Bestellung ${s}`);
  for (const s of ["Vollstaendig", "Reklamiert"]) assert.ok(werte("PH Wareneingang").has(s), `WE ${s}`);
  for (const s of ["Hochgeladen", "Geprueft", "Uebernommen", "Verworfen"]) assert.ok(werte("PH Preisliste Import").has(s), `Preisliste ${s}`);
  for (const s of ["Exportiert", "Uebermittelt"]) assert.ok(werte("PH Herstellerbestellung", "uebermittlung_status").has(s), `Übermittlung ${s}`);
  const hb = [...db.db.get("PH Herstellerbestellung").values()];
  assert.ok(hb.some((b) => !b.lieferant), "ohne Lieferant");
  assert.ok(hb.some((b) => b.lieferadresse === "Kunde direkt"), "Strecke");
  assert.ok(hb.some((b) => b.abweichungen_offen > 0), "offene Abweichungen");
  assert.ok(hb.filter((b) => ["Abgeschlossen", "Geliefert"].includes(b.status)).every((b) => !b.abweichungen_offen), "Abgeschlossene ohne offene Abweichung");
  const lf = [...db.db.get("PH Lieferant").values()];
  assert.ok(lf.some((l) => !l.bestell_email) && lf.some((l) => l.land === "CH"), "Lieferant ohne E-Mail und Schweiz");
  const marken = [...db.db.get("PH Marke").values()];
  assert.ok(marken.some((m) => m.haendlerstatus === "Keiner") && marken.some((m) => m.bildfreigabe_status === "offen"));
  assert.ok(db.db.get("PH Produkt").size >= 60);
  // Bestehende Produktnamen bleiben (andere Bereiche verlinken sie)
  assert.ok(db.db.get("PH Produkt").has("sofa-modul-240"));
});

test("Produkt: anlegen, Dublette, Workflow mit Sperrgründen und Rollen", async () => {
  const { client } = frisch();
  const p = await M.produktAnlegen(client, { marke: "Bora", kategorie: "Kochfelder", bezeichnung: "Test Kochfeld" });
  assert.equal(p.name, "bora-test-kochfeld");
  assert.equal(p.status, "Entwurf");
  await assert.rejects(M.produktAnlegen(client, { marke: "Bora", kategorie: "Kochfelder", bezeichnung: "Test Kochfeld" }), (e) => e.code === "conflict");
  await assert.rejects(M.produktWorkflow(client, p.name, "Prüfen"), /deutscher Text/);
  const wartet = [...client.db.db.get("PH Produkt").values()].find((x) => x.status === "Geprueft" && x.bild_freigegeben && x.marke === "Bora");
  const team = new MockClient(TEAM, { index, db: client.db });
  await assert.rejects(M.produktWorkflow(team, wartet.name, "Veröffentlichen", { leitung: false }), (e) => e.code === "forbidden");
  const r = await M.produktWorkflow(client, wartet.name, "Veröffentlichen", { leitung: true });
  assert.equal(r.status, "Aktiv");
  assert.ok(r.veroeffentlicht_am);
  const gesperrt = [...client.db.db.get("PH Produkt").values()].find((x) => x.status === "Geprueft" && x.marke === "Cassina");
  await assert.rejects(M.produktWorkflow(client, gesperrt.name, "Veröffentlichen", { leitung: true }), /Marke aktiv/);
});

test("Preis mit Stand: Leitung freigegeben setzt den aktuellen Preis, Team bleibt offen, Doppel abgelehnt", async () => {
  const { client } = frisch();
  const r = await M.preisHinzufuegen(client, "sofa-modul-240", { brutto_cent: 1300000, stand: "2026-11-04", quelle: "Herstellerliste", quelle_url: "https://x.beispiel.invalid", freigegeben: 1 });
  assert.equal(r.aktueller_preis_cent, 1300000);
  assert.equal(r.preisstand_alt, 0);
  await assert.rejects(M.preisHinzufuegen(client, "sofa-modul-240", { brutto_cent: 1300000, stand: "2026-11-04", freigegeben: 1 }), (e) => e.code === "conflict");
  const t = await M.preisHinzufuegen(client, "sessel-lounge", { brutto_cent: 500000, stand: "2026-11-03", freigegeben: 0 });
  assert.notEqual(t.aktueller_preis_cent, 500000);
  await assert.rejects(M.preisHinzufuegen(client, "sessel-lounge", { brutto_cent: 0 }), /Betrag/);
});

test("Freigaben: Bild und Preis freigeben, Ablehnen nur mit Grund", async () => {
  const { client } = frisch();
  const p = [...client.db.db.get("PH Produkt").values()].find((x) => (x.bilder || []).some((b) => b.freigabe === "offen"));
  const zeile = p.bilder.find((b) => b.freigabe === "offen").name;
  await M.freigabeSetzen(client, { art: "bild", ziele: [{ produkt: p.name, zeile }], entscheidung: "freigeben" });
  const neu = await client.getDoc("PH Produkt", p.name);
  assert.equal(neu.bilder.find((b) => b.name === zeile).freigabe, "erteilt");
  assert.equal(neu.bild_freigegeben, 1);
  await assert.rejects(M.freigabeSetzen(client, { art: "preis", ziele: [{ produkt: p.name }], entscheidung: "ablehnen", grund: "zu" }), /Grund/);
  const mitPreis = [...client.db.db.get("PH Produkt").values()].find((x) => (x.preise || []).some((z) => !z.freigegeben));
  const pz = mitPreis.preise.find((z) => !z.freigegeben);
  await M.freigabeSetzen(client, { art: "preis", ziele: [{ produkt: mitPreis.name, zeile: pz.name }], entscheidung: "freigeben" });
  const nach = await client.getDoc("PH Produkt", mitPreis.name);
  assert.equal(nach.preise.find((z) => z.name === pz.name).freigegeben, 1);
});

test("Bestellkette: anlegen → senden → AB mit Abweichungen → klären → bestätigen → Eingang → abschließen", async () => {
  const { client } = frisch();
  await assert.rejects(M.bestellungAnlegen(client, { lieferant: "", positionen: [{ bezeichnung: "A", menge: 1 }] }), /Lieferant/);
  const hb = await M.bestellungAnlegen(client, { lieferant: "Bora Vertrieb Alpen", kommission: "Test", wunschtermin: "2026-12-01", positionen: [{ produkt: "sofa-modul-240", bezeichnung: "Kochfeld", hersteller_artikelnr: "BOR-1", menge: 2, ek_cent: 100000 }, { bezeichnung: "Filter", menge: 1 }] });
  assert.equal(hb.status, "Entwurf");
  assert.match(hb.name, /^HB-2026-\d{5}$/);
  const g = await M.perEmailSenden(client, hb.name, {});
  assert.equal(g.status, "Gesendet");
  assert.equal(g.uebermittlung_status, "Uebermittelt");
  await assert.rejects(M.abEinlesen(client, hb.name, { ab_nummer: "" }), /AB-Nummer/);
  const ab = await M.abEinlesen(client, hb.name, { ab_nummer: "AB-1", ab_datum: "2026-11-04", positionen: [{ idx: 1, ab_menge: 2, ab_ek_cent: 105000, bestaetigter_termin: "2026-12-10" }, { idx: 2, ab_menge: 1 }] });
  assert.equal(ab.abweichungen, 2);
  assert.equal(ab.doc.status, "AB erhalten");
  assert.equal(ab.doc.positionen[1].ab_merker, "bestaetigt");
  assert.equal(ab.doc.positionen[0].ab_merker, "abweichung");
  await assert.rejects(M.bestellWorkflow(client, hb.name, "AB freigeben", { leitung: true }), /offen/);
  const team = new MockClient(TEAM, { index, db: client.db });
  const preisZeile = ab.doc.ab_abgleich.find((z) => z.feld === "Preis");
  await assert.rejects(M.abweichungBewerten(team, hb.name, { zeile: preisZeile.idx, bewertung: "ok" }, { leitung: false }), (e) => e.code === "forbidden");
  await M.abweichungKlaeren(client, hb.name, { zeile: preisZeile.idx, aktion: "akzeptieren" }, { leitung: true });
  const termin = ab.doc.ab_abgleich.find((z) => z.feld === "Termin");
  const v = await M.abweichungBewerten(client, hb.name, { zeile: termin.idx, bewertung: "ok" }, { leitung: true });
  assert.equal(v.offen, 0);
  assert.equal(v.vollstaendig, true);
  const best = await M.bestellWorkflow(client, hb.name, "AB freigeben", { leitung: true });
  assert.equal(best.status, "AB geprueft");
  await assert.rejects(M.bestellWorkflow(client, hb.name, "Lieferung buchen"), /nicht an/);
  await assert.rejects(M.wareneingangBuchen(client, { bestellung: hb.name, positionen: [{ idx: 1, menge_erhalten: 1, zustand: "Transportschaden" }] }), /Foto oder Hinweis/);
  const we = await M.wareneingangBuchen(client, { bestellung: hb.name, lieferschein_nr_lieferant: "LS-1", positionen: [{ idx: 1, menge_erhalten: 1 }, { idx: 2, menge_erhalten: 1 }] });
  assert.equal(we.status, "Teilweise");
  assert.equal((await client.getDoc("PH Herstellerbestellung", hb.name)).status, "Teilgeliefert");
  await assert.rejects(M.wareneingangBuchen(client, { bestellung: hb.name, lieferschein_nr_lieferant: "LS-1", positionen: [{ idx: 1, menge_erhalten: 1 }] }), (e) => e.code === "conflict" && /Schon gebucht/.test(e.message));
  await M.wareneingangBuchen(client, { bestellung: hb.name, lieferschein_nr_lieferant: "LS-2", positionen: [{ idx: 1, menge_erhalten: 1 }] });
  assert.equal((await client.getDoc("PH Herstellerbestellung", hb.name)).status, "Geliefert");
  const fertig = await M.bestellWorkflow(client, hb.name, "Abschließen");
  assert.equal(fertig.status, "Abgeschlossen");
});

test("Stornieren: Entwurf frei, ab Gesendet nur Leitung mit Grund", async () => {
  const { client } = frisch();
  const hb = await M.bestellungAnlegen(client, { lieferant: "Baobab Vertrieb", positionen: [{ bezeichnung: "Kerze", menge: 6 }] });
  await M.perEmailSenden(client, hb.name, {});
  await assert.rejects(M.bestellWorkflow(client, hb.name, "Stornieren", { leitung: false, grund: "Kunde storniert" }), (e) => e.code === "forbidden");
  await assert.rejects(M.bestellWorkflow(client, hb.name, "Stornieren", { leitung: true, grund: "x" }), /Grund/);
  const s = await M.bestellWorkflow(client, hb.name, "Stornieren", { leitung: true, grund: "Hersteller hat bestätigt" });
  assert.equal(s.status, "Storniert");
});

test("Export IWOfurn/EDI/CSV: Datei angehängt, Status Exportiert, Übermittelt setzt Entwurf auf Gesendet", async () => {
  const { client } = frisch();
  const hb = await M.bestellungAnlegen(client, { lieferant: "Bora Vertrieb Alpen", positionen: [{ bezeichnung: "Kochfeld", hersteller_artikelnr: "BOR-9", menge: 1 }] });
  const e = await M.exportieren(client, hb.name, "IWOfurn");
  assert.equal(e.weg, "IWOfurn");
  assert.match(e.inhalt, /<TypNr>BOR-9<\/TypNr>/);
  assert.match(e.datei, /iwofurn\.xml$/);
  let doc = await client.getDoc("PH Herstellerbestellung", hb.name);
  assert.equal(doc.uebermittlung_status, "Exportiert");
  assert.equal(doc.uebermittlungen.length, 1);
  const edi = await M.exportieren(client, hb.name, "EDI");
  assert.match(edi.inhalt, /^UNA/);
  await M.uebermittlungSetzen(client, hb.name, { status: "Uebermittelt", hinweis: "im Portal hochgeladen" });
  doc = await client.getDoc("PH Herstellerbestellung", hb.name);
  assert.equal(doc.status, "Gesendet");
  await assert.rejects(M.uebermittlungSetzen(client, hb.name, { status: "Vorbereitet" }), /nicht möglich/);
  const ohneGln = await M.bestellungAnlegen(client, { lieferant: "Gaggenau Hausgeräte Vertrieb", positionen: [{ bezeichnung: "Ofen", menge: 1 }] });
  await assert.rejects(M.exportieren(client, ohneGln.name, "EDI"), /GLN des Lieferanten/);
  const csv = await M.exportieren(client, ohneGln.name);
  assert.equal(csv.weg, "CSV");
});

test("Preisliste: abgleichen, übernehmen nur Leitung, Preise mit Stand der Liste", async () => {
  const { client } = frisch();
  const liste = [...client.db.db.get("PH Preisliste Import").values()].find((l) => l.status === "Geprueft");
  await assert.rejects(M.preislisteMethode(client, liste.name, "uebernehmen", { leitung: false }), (e) => e.code === "forbidden");
  const r = await M.preislisteMethode(client, liste.name, "uebernehmen", { leitung: true });
  assert.ok(r.uebernommen >= 1);
  assert.equal((await client.getDoc("PH Preisliste Import", liste.name)).status, "Uebernommen");
});

test("Bestellvorschläge → Bestellentwurf je Lieferant (Admin-Sicht)", async () => {
  const { client } = frisch({ user: "admin@demo.local", roles: ["System Manager"] });
  const offen = [...client.db.db.get("PH Bestellvorschlag").values()].filter((v) => v.status === "Offen");
  assert.ok(offen.length >= 1);
  const r = await M.vorschlaegeBestellen(client, offen.map((v) => v.name));
  assert.ok(r.angelegt.length >= 1);
  const hb = await client.getDoc("PH Herstellerbestellung", r.angelegt[0]);
  assert.equal(hb.status, "Entwurf");
  assert.equal((await client.getDoc("PH Bestellvorschlag", offen[0].name)).status, "Bestellt");
});

test("Texte: jeder Status hat eine Anzeige ohne Umschreibung (Glossar § 2)", () => {
  for (const [gruppe, werte] of Object.entries(TOENE)) {
    for (const w of Object.keys(werte)) {
      const s = status(gruppe, w);
      assert.ok(s.text && s.text !== "–", `${gruppe}.${w}`);
      assert.doesNotMatch(s.text, /(?<![aeiouq])(ae|oe|ue)(?!ll|r\b)/i, `${gruppe}.${w} → ${s.text}`);
    }
  }
  assert.equal(status("produkt", "Geprueft").text, "Wartet auf Veröffentlichung");
  assert.equal(status("bestellung", "AB geprueft").text, "AB bestätigt");
  assert.equal(anzeigeWert("welt", "Kueche"), "Küche");
  assert.equal(GLOSSAR.weZustand.beschaedigt, "beschädigt ab Werk");
});

test("Register: Bereich, Kürzel, Commit-Aktionen, Zu tun, Freigaben ohne Befund", () => {
  assert.deepEqual(pruefeBereiche(BEREICHE).filter((b) => b.includes("sortiment")), []);
  assert.equal(bereich.routen["PH Herstellerbestellung"]("HB-1"), "/sortiment/bestellungen/HB-1");
  assert.ok(bereich.navigation.length >= 6);
  assert.ok(kuerzel.every((k) => k.id.startsWith("sortiment.")));
  assert.ok(kuerzel.filter((k) => k.aussenwirkung).every((k) => k.nurDialog));
  assert.deepEqual(pruefeAktionen().filter((b) => b.includes("sortiment")), []);
  assert.ok(Object.keys(sortimentAktionen).length >= 8);
  assert.deepEqual(pruefeQuellen({ sortiment: aufgaben }), []);
  assert.deepEqual(pruefeFreigaben({ sortiment: freigaben }), []);
});
