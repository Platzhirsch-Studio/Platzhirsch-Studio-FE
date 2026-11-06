// Mock-Seed – Bereich Faktura (G-01, MASTER § 3.5). Schreibt: Team B-FAK.
// anzahl: Datensätze je DocType · kern: Fachwissen je DocType (Verteilung, Bezüge, Titel) nach der
// generischen Erzeugung · default: Nachlauf (db, hilfe) nach dem Grundaufbau, Reihenfolge über `nach`.
// Keine echten Personen, E-Mails @beispiel.invalid, runde Beispielbeträge (Q-A3). Zufall nur über `r`
// (fester Startwert); Reihenfolge der r-Aufrufe nicht ändern, sonst verschieben sich alle Folgedaten.
//
// B-FAK: `anzahl`/`kern` bleiben unverändert (Zufallsfolge aller Bereiche). Der Nachlauf ersetzt die
// generisch erzeugten Faktura-Belege durch einen fachlich zusammenhängenden Bestand (10-konzept-faktura
// § 16.5 Schritt 1): 12 Angebote, 8 Aufträge (alle Zustände inkl. Kassa-Datenfehler), 30 Rechnungen (alle
// Arten/Status, Privat > 10.000 €, Geschäftskunde, CH-Montage, ohne E-Mail), 4 Gutschriften, 5 Mahnungen,
// 1 Bankimport mit 15 Umsätzen (alle Sicherheiten, AB-Nummer, Ausgang), 10 Eingangsrechnungen mit allen
// Kostenzuordnungs-Fällen, 2 Export-Läufe, 2 UVA, Journal, Zahlungsbedingungen, Bankkonto.
// Fester Bezug: 04.11.2026. Keine Zufallswerte im Nachlauf (alles ausgeschrieben, damit Tests stabil sind).

import { isoDatum } from "../../format.js";
import { tage } from "./basis.js";
import { belegSummen } from "../../faktura/betraege.js";

/** Nachläufe anderer Bereiche, die vor diesem laufen müssen. */
export const nach = [];

/** Anzahl generischer Datensätze je DocType (nicht gelistete mit Status bekommen 6). */
export const anzahl = {
  "PH Rechnung": 16,
  "PH Angebot": 10,
  "PH Zahlungsbedingung": 3,
  "PH Bankkonto": 1,
};

/** Fachliche Nachbearbeitung je DocType: (doc, { i, r, ctx, person }) – ändert doc. */
export const kern = {
  "PH Rechnung": (doc, { r, person }) => {
    doc.status = r.pick(["Entwurf", "Gestellt", "Gestellt", "Teilbezahlt", "Bezahlt", "Bezahlt", "Ueberfaellig", "Gemahnt"]);
    doc.art = r.pick(["Rechnung", "Rechnung", "Anzahlungsrechnung", "Schlussrechnung"]);
    doc.datum = isoDatum(tage(-r.int(0, 90)));
    doc.faellig = isoDatum(tage(-r.int(-14, 60)));
    doc.kunde_name = person;
    doc.brutto_cent = r.pick([249000, 580000, 1290000, 2480000]);
    doc.offen_cent = doc.status === "Bezahlt" || doc.status === "Entwurf" ? 0 : doc.status === "Teilbezahlt" ? Math.round(doc.brutto_cent / 2) : doc.brutto_cent;
    doc.docstatus = doc.status === "Entwurf" ? 0 : 1;
    doc.titel = `${doc.art} ${person}`;
    doc.workflow_state = `PH ${doc.status}`;
  },
  "PH Angebot": (doc, { r, person }) => {
    doc.status = r.pick(["Entwurf", "Gesendet", "Gesendet", "Angenommen", "Abgelehnt", "Abgelaufen"]);
    doc.datum = isoDatum(tage(-r.int(0, 60)));
    doc.gueltig_bis = isoDatum(tage(r.int(-10, 30)));
    doc.kunde_name = person;
    doc.brutto_cent = r.pick([249000, 580000, 1290000, 2480000, 5600000]);
    doc.titel = `Angebot ${person}`;
    doc.workflow_state = `PH ${doc.status}`;
  },
};

// ------------------------------------------------------------- Bausteine --

const d = (offset) => isoDatum(tage(offset));
const dz = (offset, zeit = "09:15:00") => `${d(offset)} ${zeit}`;

/** Kunden des Bestands (Namen aus den Musterlisten, keine echten Personen). */
export const KUNDEN = {
  muster: { kunde_name: "Familie Muster", vorname: "Max", nachname: "Muster", anrede: "Herr", kontaktart: "Privat", strasse: "Landstraße 5", plz: "6911", ort: "Lochau", land: "AT", email: "max.muster@beispiel.invalid" },
  beispiel: { kunde_name: "Beispiel GmbH", firma: "Beispiel GmbH", kontaktart: "Geschaeft", strasse: "Seestraße 12", plz: "6900", ort: "Bregenz", land: "AT", email: "office@beispiel-gmbh.beispiel.invalid", uid: "ATU12345678" },
  probe: { kunde_name: "Erika Probe", vorname: "Erika", nachname: "Probe", anrede: "Frau", kontaktart: "Privat", strasse: "Am Hang 3", plz: "6850", ort: "Dornbirn", land: "AT", email: "erika.probe@beispiel.invalid" },
  testner: { kunde_name: "Paul Testner", vorname: "Paul", nachname: "Testner", anrede: "Herr", kontaktart: "Privat", strasse: "Bahnhofstraße 20", plz: "88131", ort: "Lindau", land: "DE", email: "paul.testner@beispiel.invalid" },
  hotel: { kunde_name: "Demo Hotel Betriebs GmbH", firma: "Demo Hotel Betriebs GmbH", kontaktart: "Geschaeft", strasse: "Uferweg 1", plz: "6971", ort: "Hard", land: "AT", email: "empfang@demo-hotel.beispiel.invalid", uid: "ATU87654321" },
  vorlage: { kunde_name: "Clara Vorlage", vorname: "Clara", nachname: "Vorlage", anrede: "Frau", kontaktart: "Privat", strasse: "Kirchgasse 8", plz: "6890", ort: "Lustenau", land: "AT", email: "", brief: true },
  architektur: { kunde_name: "Muster Architektur ZT", firma: "Muster Architektur ZT", kontaktart: "Architekt", strasse: "Rheinstraße 4", plz: "6800", ort: "Feldkirch", land: "AT", email: "buero@muster-zt.beispiel.invalid", uid: "ATU11223344" },
  schema: { kunde_name: "Simon Schema", vorname: "Simon", nachname: "Schema", anrede: "Herr", kontaktart: "Privat", strasse: "Hauptstrasse 2", plz: "9000", ort: "St. Gallen", land: "CH", email: "simon.schema@beispiel.invalid" },
  demo: { kunde_name: "Julia Demo", vorname: "Julia", nachname: "Demo", anrede: "Frau", kontaktart: "Privat", strasse: "Lindenweg 14", plz: "6900", ort: "Bregenz", land: "AT", email: "julia.demo@beispiel.invalid" },
};

const POS = {
  kueche: { art: "Produkt", bezeichnung: "Küche mit Kochinsel, Eiche geräuchert", marke: "Poliform", raum: "Küche", menge: 1, einheit: "Pausch", einzel_netto_cent: 1660000, einkauf_cent: 1120000 },
  geraete: { art: "Produkt", bezeichnung: "Einbaugeräte-Paket (Backofen, Kochfeld, Kühlschrank)", marke: "", raum: "Küche", menge: 1, einheit: "Set", einzel_netto_cent: 320000, einkauf_cent: 240000 },
  montage: { art: "Leistung", bezeichnung: "Montage und Anschluss vor Ort", raum: "Küche", menge: 16, einheit: "Std", einzel_netto_cent: 6250, einkauf_cent: 0 },
  sofa: { art: "Produkt", bezeichnung: "Sofalandschaft, Leder Cognac", marke: "Minotti", raum: "Wohnen", menge: 1, einheit: "Stk", einzel_netto_cent: 3200000, einkauf_cent: 2050000 },
  tisch: { art: "Produkt", bezeichnung: "Esstisch Eiche, 300 cm, Maßanfertigung", marke: "", raum: "Essen", menge: 1, einheit: "Stk", einzel_netto_cent: 1238000, einkauf_cent: 760000 },
  stuhl: { art: "Produkt", bezeichnung: "Esszimmerstuhl, Bouclé Sand", marke: "Flexform", raum: "Essen", menge: 8, einheit: "Stk", einzel_netto_cent: 64000, einkauf_cent: 41000 },
  lounge: { art: "Produkt", bezeichnung: "Outdoor-Lounge, 7-teilig", marke: "", raum: "Terrasse", menge: 1, einheit: "Set", einzel_netto_cent: 510000, einkauf_cent: 330000 },
  leuchte: { art: "Produkt", bezeichnung: "Pendelleuchte Glas", marke: "", raum: "Essen", menge: 3, einheit: "Stk", einzel_netto_cent: 48000, einkauf_cent: 29000 },
  planung: { art: "Planungsleistung", bezeichnung: "Planung Wohnraum mit 3D-Visualisierung", raum: "", menge: 1, einheit: "Pausch", einzel_netto_cent: 120000, einkauf_cent: 0 },
  hotel: { art: "Produkt", bezeichnung: "Zimmerausstattung Hotel (Bett, Nachttisch, Sessel)", marke: "", raum: "Hotelzimmer", menge: 24, einheit: "Set", einzel_netto_cent: 425000, einkauf_cent: 290000 },
  accessoire: { art: "Produkt", bezeichnung: "Vase Keramik, groß", marke: "", raum: "", menge: 1, einheit: "Stk", einzel_netto_cent: 25000, einkauf_cent: 12000 },
  mosaik: { art: "Produkt", bezeichnung: "Mosaik Mix 2,5, Bad", marke: "Ezarri", raum: "Bad", menge: 18, einheit: "m²", einzel_netto_cent: 9500, einkauf_cent: 5600 },
  alternativ: { art: "Produkt", bezeichnung: "Alternative: Esstisch Nussbaum, 280 cm", marke: "", raum: "Essen", menge: 1, einheit: "Stk", einzel_netto_cent: 1150000, einkauf_cent: 690000, alternativ: 1 },
  anzahlung: (bez, netto) => ({ art: "Leistung", bezeichnung: bez, menge: 1, einheit: "Pausch", einzel_netto_cent: netto, einkauf_cent: 0 }),
};

function positionen(liste, satz = 200) {
  return liste.map((p, i) => {
    const z = { ...p, pos: i + 1, ust_satz_promille: p.ust_satz_promille ?? satz, rabatt_promille: p.rabatt_promille || 0 };
    const netto = z.alternativ ? 0 : Math.round(z.menge * z.einzel_netto_cent * (1 - z.rabatt_promille / 1000));
    z.netto_cent = netto;
    z.ust_cent = Math.round((netto * z.ust_satz_promille) / 1000);
    z.brutto_cent = netto + z.ust_cent;
    return z;
  });
}

function mitSummen(doc) {
  const s = belegSummen(doc.positionen || []);
  return { ...doc, netto_cent: s.netto_cent, rabatt_gesamt_cent: s.rabatt_gesamt_cent, ust_cent: s.ust_cent, brutto_cent: s.brutto_cent, alternativ_cent: s.alternativ_cent, ust_aufteilung: s.ust_aufteilung.map((z) => ({ bezeichnung: `USt ${z.ust_satz_promille / 10} %`, ...z })) };
}

function adresse(k) {
  return { kunde_name: k.kunde_name, firma: k.firma || "", strasse: k.strasse, plz: k.plz, ort: k.ort, land: k.land, uid_empfaenger: k.uid || "" };
}

/** Kassa-/Shop-fremde Felder, die in jedem Beleg stehen. */
const BASIS = { waehrung: "EUR", sprache: "de", quelle: "backoffice" };

// ------------------------------------------------------------- Bestand --

function angebote(kt, pr) {
  const a = (nr, k, titel, status, extra = {}) =>
    mitSummen({
      name: `AN-2026-000${nr}`,
      naming_series: "AN-.YYYY.-.#####",
      titel,
      status,
      workflow_state: `PH ${status}`,
      kontakt: kt(k),
      ...adresse(KUNDEN[k]),
      version: 1,
      vertragsort: "Showroom",
      zugewiesen_an: "crm@demo.local",
      zahlungsbedingung: "40/50/10",
      anzahlung_prozent: 40,
      ust_fall: "Steuerpflichtig AT",
      ...BASIS,
      ...extra,
    });
  return [
    a(88, "muster", "Küche Haus am See", "Gesendet", { projekt: pr(0), datum: d(-12), gueltig_bis: d(28), gesendet_am: d(-12), versandkanal: "E-Mail", positionen: positionen([POS.kueche, POS.geraete, POS.montage]) }),
    a(87, "probe", "Terrasse Probe", "Gesendet", { datum: d(-27), gueltig_bis: d(3), gesendet_am: d(-26), versandkanal: "E-Mail", zugewiesen_an: "faktura@demo.local", vertragsort: "Beim Kunden", fagg_belehrung_beigelegt: 1, positionen: positionen([POS.lounge, POS.leuchte]) }),
    a(86, "testner", "Wohnen Testner", "Gesendet", { datum: d(-21), gueltig_bis: d(2), gesendet_am: d(-21), versandkanal: "E-Mail", ust_fall: "OSS", ust_hinweistext: "Steuer des Bestimmungslands (Deutschland, 19 %).", positionen: positionen([POS.sofa], 190) }),
    a(85, "hotel", "Hotel Seeblick, 24 Zimmer", "Gesendet", { projekt: pr(2), datum: d(-18), gueltig_bis: d(12), gesendet_am: d(-17), versandkanal: "E-Mail", zugewiesen_an: "gf@demo.local", positionen: positionen([POS.hotel]) }),
    a(84, "demo", "Essen Demo", "Entwurf", { datum: d(-1), gueltig_bis: d(29), positionen: positionen([POS.tisch, POS.stuhl, POS.alternativ, POS.leuchte]) }),
    a(83, "architektur", "Büro Muster ZT", "Entwurf", { datum: d(0), gueltig_bis: d(30), positionen: positionen([POS.planung]) }),
    a(82, "beispiel", "Showroom-Ausstattung Beispiel GmbH", "Angenommen", { datum: d(-40), gueltig_bis: d(-10), gesendet_am: d(-40), angenommen_am: d(-33), auftragsbestaetigung: "AB-2026-00016", positionen: positionen([POS.sofa, POS.tisch]) }),
    a(81, "muster", "Wohnen Haus am See", "Angenommen", { projekt: pr(0), datum: d(-52), gueltig_bis: d(-22), gesendet_am: d(-52), angenommen_am: d(-45), auftragsbestaetigung: "AB-2026-00017", positionen: positionen([POS.kueche, POS.geraete]) }),
    a(80, "vorlage", "Bad Vorlage", "Abgelehnt", { datum: d(-35), gueltig_bis: d(-5), gesendet_am: d(-35), versandkanal: "Post", abgelehnt_grund: "Preis", positionen: positionen([POS.mosaik]) }),
    a(79, "probe", "Leuchten Probe", "Abgelaufen", { datum: d(-60), gueltig_bis: d(-30), gesendet_am: d(-60), versandkanal: "E-Mail", positionen: positionen([POS.leuchte]) }),
    a(78, "testner", "Wohnen Testner (v1)", "Ersetzt", { datum: d(-40), gueltig_bis: d(-10), gesendet_am: d(-40), nachfolger: "AN-2026-00086", ust_fall: "OSS", ust_hinweistext: "Steuer des Bestimmungslands (Deutschland, 19 %).", positionen: positionen([POS.sofa, POS.accessoire], 190) }),
    a(77, "schema", "Wohnung Schema, St. Gallen", "Gesendet", { datum: d(-6), gueltig_bis: d(24), gesendet_am: d(-6), versandkanal: "E-Mail", vertragsort: "Fernabsatz", fagg_belehrung_beigelegt: 1, ust_fall: "Ausfuhr", ust_hinweistext: "Steuerfreie Ausfuhrlieferung.", positionen: positionen([POS.sofa, POS.montage]) }),
  ];
}

function zahlungsplan(brutto, zeilen) {
  return zeilen.map(([art, prozent, faellig_bei, status, rechnung = "", bezahlt = 0], i) => ({
    art,
    prozent,
    betrag_cent: i === zeilen.length - 1 ? brutto - zeilen.slice(0, -1).reduce((s, z) => s + Math.round((brutto * z[1]) / 100), 0) : Math.round((brutto * prozent) / 100),
    faellig_bei,
    status,
    rechnung,
    bezahlt_cent: bezahlt,
  }));
}

function auftraege(kt, pr) {
  const ab = (nr, k, titel, status, pos, extra = {}) => {
    const doc = mitSummen({ name: `AB-2026-000${nr}`, naming_series: "AB-.YYYY.-.#####", titel, status, workflow_state: `PH ${status}`, kontakt: kt(k), ...adresse(KUNDEN[k]), vertragsort: "Showroom", zugewiesen_an: "crm@demo.local", zahlungsbedingung: "40/50/10", anzahlung_prozent: 40, ust_fall: "Steuerpflichtig AT", ...BASIS, positionen: positionen(pos), ...extra });
    doc.auftragswert_cent = doc.brutto_cent;
    doc.anzahlung_soll_cent = Math.round(doc.brutto_cent * 0.4);
    return doc;
  };
  const a17 = ab(17, "muster", "Küche Haus am See", "In Bestellung", [POS.anzahlung("Küche mit Kochinsel, Eiche geräuchert", 2080000)], { projekt: pr(0), angebot: "AN-2026-00081", datum: d(-45), liefertermin_geplant: d(26), liefertermin_bestaetigt: d(26), liefer_kw: "KW 48", montage: 1, montage_termin: d(30), lieferadresse: "Landstraße 5, 6911 Lochau" });
  Object.assign(a17, { anzahlung_ist_cent: 374400, geliefert_cent: Math.round(a17.brutto_cent * 0.75), abgerechnet_cent: 998400, bezahlt_cent: 374400, offen_cent: a17.brutto_cent - 374400, zahlungsplan: zahlungsplan(a17.brutto_cent, [["Anzahlung", 40, "Auftrag", "In Rechnung", "RE-2026-00042", 374400], ["Teilzahlung", 50, "Lieferung", "Offen"], ["Schlusszahlung", 10, "Montage", "Offen"]]) });
  const a19 = ab(19, "probe", "Terrasse Probe", "Offen", [POS.lounge, POS.leuchte], { datum: d(-3), vertragsort: "Beim Kunden", fagg_belehrung_beigelegt: 1, liefertermin_geplant: d(40), liefer_kw: "KW 50" });
  Object.assign(a19, { anzahlung_ist_cent: 0, geliefert_cent: 0, abgerechnet_cent: 0, bezahlt_cent: 0, offen_cent: a19.brutto_cent, zahlungsplan: zahlungsplan(a19.brutto_cent, [["Anzahlung", 40, "Auftrag", "Offen"], ["Teilzahlung", 50, "Lieferung", "Offen"], ["Schlusszahlung", 10, "Montage", "Offen"]]) });
  const a18 = ab(18, "demo", "Essen Demo", "Offen", [POS.tisch, POS.stuhl], { datum: d(-9), liefertermin_geplant: d(35) });
  Object.assign(a18, { anzahlung_ist_cent: a18.anzahlung_soll_cent, geliefert_cent: 0, abgerechnet_cent: a18.anzahlung_soll_cent, bezahlt_cent: a18.anzahlung_soll_cent, offen_cent: a18.brutto_cent - a18.anzahlung_soll_cent, zahlungsplan: zahlungsplan(a18.brutto_cent, [["Anzahlung", 40, "Auftrag", "Bezahlt", "RE-2026-00049", a18.anzahlung_soll_cent], ["Teilzahlung", 50, "Lieferung", "Offen"], ["Schlusszahlung", 10, "Montage", "Offen"]]) });
  const a16 = ab(16, "beispiel", "Showroom-Ausstattung Beispiel GmbH", "Teilgeliefert", [POS.sofa, POS.tisch], { angebot: "AN-2026-00082", datum: d(-33), liefertermin_bestaetigt: d(-4), liefer_kw: "KW 45", uid_geprueft_am: d(-30) });
  Object.assign(a16, { anzahlung_ist_cent: a16.anzahlung_soll_cent, geliefert_cent: Math.round(a16.brutto_cent * 0.72), abgerechnet_cent: a16.anzahlung_soll_cent, bezahlt_cent: a16.anzahlung_soll_cent, offen_cent: a16.brutto_cent - a16.anzahlung_soll_cent, zahlungsplan: zahlungsplan(a16.brutto_cent, [["Anzahlung", 40, "Auftrag", "Bezahlt", "RE-2026-00038", a16.anzahlung_soll_cent], ["Teilzahlung", 50, "Lieferung", "Offen"], ["Schlusszahlung", 10, "Montage", "Offen"]]) });
  a16.positionen[0].lieferschein_menge = 1;
  a16.positionen[1].lieferschein_menge = 0;
  const a15 = ab(15, "architektur", "Büro Muster ZT, Besprechung", "Geliefert", [POS.tisch, POS.stuhl, POS.leuchte], { datum: d(-60), liefertermin_bestaetigt: d(-8), uid_geprueft_am: d(-58) });
  Object.assign(a15, { anzahlung_ist_cent: a15.anzahlung_soll_cent, geliefert_cent: a15.brutto_cent, abgerechnet_cent: a15.anzahlung_soll_cent, bezahlt_cent: a15.anzahlung_soll_cent, offen_cent: a15.brutto_cent - a15.anzahlung_soll_cent, zahlungsplan: zahlungsplan(a15.brutto_cent, [["Anzahlung", 40, "Auftrag", "Bezahlt", "RE-2026-00033", a15.anzahlung_soll_cent], ["Schlusszahlung", 60, "Lieferung", "Offen"]]) });
  a15.positionen.forEach((p) => (p.lieferschein_menge = p.menge));
  const a14 = ab(14, "hotel", "Lobby Demo Hotel", "Abgerechnet", [POS.sofa, POS.leuchte], { datum: d(-90), liefertermin_bestaetigt: d(-40), uid_geprueft_am: d(-88) });
  Object.assign(a14, { anzahlung_ist_cent: a14.anzahlung_soll_cent, geliefert_cent: a14.brutto_cent, abgerechnet_cent: a14.brutto_cent, bezahlt_cent: a14.brutto_cent, offen_cent: 0, zahlungsplan: zahlungsplan(a14.brutto_cent, [["Anzahlung", 40, "Auftrag", "Verrechnet", "RE-2026-00031", a14.anzahlung_soll_cent], ["Schlusszahlung", 60, "Lieferung", "Bezahlt", "RE-2026-00035", a14.brutto_cent - a14.anzahlung_soll_cent]]) });
  const a13 = ab(13, "vorlage", "Bad Vorlage", "Storniert", [POS.mosaik], { datum: d(-70), storno_grund: "Kunde hat das Bauvorhaben verschoben.", storniert_am: d(-64), storniert_von: "faktura@demo.local" });
  Object.assign(a13, { anzahlung_ist_cent: 0, geliefert_cent: 0, abgerechnet_cent: 0, bezahlt_cent: 0, offen_cent: 0, zahlungsplan: zahlungsplan(a13.brutto_cent, [["Anzahlung", 40, "Auftrag", "Offen"], ["Schlusszahlung", 60, "Lieferung", "Offen"]]) });
  const a12 = ab(12, "testner", "Wohnen Testner (Kassa)", "Offen", [POS.leuchte, POS.accessoire], { datum: d(-5), kassa_datenfehler: 1 });
  Object.assign(a12, { anzahlung_ist_cent: 50000, geliefert_cent: 0, abgerechnet_cent: 0, bezahlt_cent: 50000, offen_cent: a12.brutto_cent - 50000, zahlungsplan: zahlungsplan(a12.brutto_cent, [["Anzahlung", 40, "Auftrag", "Offen", "", 50000], ["Schlusszahlung", 60, "Lieferung", "Offen"]]) });
  return [a19, a18, a17, a16, a15, a14, a13, a12];
}

function rechnungen(kt, pr) {
  const re = (nr, k, art, status, pos, extra = {}) => {
    const gestellt = status !== "Entwurf";
    const name = gestellt ? `RE-2026-000${nr}` : `ENTW-2026-0000${nr}`;
    const doc = mitSummen({ name, nummer: gestellt ? name : "", naming_series: "RE-.YYYY.-.#####", art, status, workflow_state: `PH ${status}`, kontakt: kt(k), ...adresse(KUNDEN[k]), ust_fall: "Steuerpflichtig AT", zahlungsziel_tage: 14, docstatus: gestellt ? 1 : 0, ...BASIS, positionen: positionen(pos, extra.satz ?? 200), mahnstufe: 0, export_status: "offen", email: KUNDEN[k].email, ...extra });
    delete doc.satz;
    doc.titel = `${art} ${KUNDEN[k].kunde_name}`;
    const abzug = doc.anzahlung_brutto_cent || 0;
    doc.zahlbar_cent = doc.brutto_cent - abzug;
    const bezahlt = (doc.zahlungen || []).reduce((s, z) => s + z.betrag_cent, 0);
    doc.bezahlt_cent = bezahlt;
    doc.offen_cent = gestellt && !["Storniert", "Uneinbringlich"].includes(status) ? Math.max(doc.zahlbar_cent - bezahlt, 0) : 0;
    if (gestellt) {
      doc.zahlungsreferenz = name;
      doc.qr_code_girocode = 1;
      doc.gestellt_am = doc.gestellt_am || doc.datum;
      doc.pdf = `/private/files/${name}.pdf`;
      doc.pdf_fixiert_am = `${doc.datum} 09:12:00`;
    }
    return doc;
  };
  const z = (offset, betrag, kanal = "Ueberweisung", hinweis = "") => ({ datum: d(offset), kanal, betrag_cent: betrag, hinweis });
  const anz = (bez, netto) => [POS.anzahlung(bez, netto)];
  const out = [
    // Anzahlung Fam. Muster: teilbezahlt, gemahnt Stufe 1, 12 Tage überfällig (Kernfall Konzept)
    re(42, "muster", "Anzahlungsrechnung", "Gemahnt", anz("Anzahlung 40 % zu AB-2026-00017 (Küche Haus am See)", 832000), { auftrag: "AB-2026-00017", projekt: pr(0), anzahlung_prozent: 40, anzahlungsplan_zeile: "1", datum: d(-26), faellig: d(-12), gesendet_am: d(-26), versandkanal: "E-Mail", mahnstufe: 1, letzte_mahnung: d(-3), zahlungen: [z(-10, 374400, "Ueberweisung", "Teilzahlung")], ust_faelligkeit: "faellig", export_status: "exportiert", export_lauf: "EX-2026-0010" }),
    re(44, "beispiel", "Rechnung", "Gestellt", [POS.accessoire, { ...POS.leuchte, menge: 2 }], { datum: d(-5), faellig: d(9), leistungsdatum: d(-6), leistung_quelle: "Lieferschein LS-2026-00031", gesendet_am: d(-5), versandkanal: "E-Mail", uid_geprueft_am: d(-30) }),
    re(43, "hotel", "Rechnung", "Gestellt", [POS.planung], { datum: d(-2), faellig: d(12), leistungsdatum: d(-3), leistung_quelle: "von Hand", gesendet_am: d(-2), versandkanal: "E-Mail", uid_geprueft_am: d(-88) }),
    re(41, "probe", "Rechnung", "Ueberfaellig", [POS.leuchte], { datum: d(-35), faellig: d(-21), leistungsdatum: d(-36), leistung_quelle: "Lieferschein LS-2026-00024", gesendet_am: d(-35), versandkanal: "E-Mail", export_status: "exportiert", export_lauf: "EX-2026-0010" }),
    re(40, "testner", "Rechnung", "Gemahnt", [POS.sofa], { satz: 190, ust_fall: "OSS", oss_land: "DE", ust_hinweistext: "Steuer des Bestimmungslands (Deutschland, 19 %).", datum: d(-60), faellig: d(-46), leistungsdatum: d(-61), leistung_quelle: "Lieferschein LS-2026-00019", gesendet_am: d(-60), versandkanal: "E-Mail", mahnstufe: 2, letzte_mahnung: d(-16), zahlungen: [z(-40, 1500000)], export_status: "exportiert", export_lauf: "EX-2026-0010" }),
    re(39, "beispiel", "Rechnung", "Ueberfaellig", [POS.stuhl], { datum: d(-28), faellig: d(-14), leistungsdatum: d(-29), leistung_quelle: "Lieferschein LS-2026-00022", gesendet_am: d(-28), versandkanal: "E-Mail", uid_geprueft_am: d(-30), export_status: "exportiert", export_lauf: "EX-2026-0010" }),
    re(37, "vorlage", "Rechnung", "Gemahnt", [POS.mosaik], { datum: d(-95), faellig: d(-81), leistungsdatum: d(-96), leistung_quelle: "Montage-Abnahme", gesendet_am: d(-95), versandkanal: "Post", email: "", mahnstufe: 3, letzte_mahnung: d(-20), export_status: "exportiert", export_lauf: "EX-2026-0009" }),
    re(36, "demo", "Rechnung", "Ueberfaellig", [POS.leuchte, POS.accessoire], { datum: d(-30), faellig: d(-16), leistungsdatum: d(-31), leistung_quelle: "Lieferschein LS-2026-00023", gesendet_am: d(-30), versandkanal: "E-Mail", mahnsperre: 1, mahnsperre_grund: "Reklamation offen", export_status: "exportiert", export_lauf: "EX-2026-0010" }),
    re(35, "hotel", "Schlussrechnung", "Bezahlt", [POS.sofa, POS.leuchte], { auftrag: "AB-2026-00014", datum: d(-38), faellig: d(-24), leistungsdatum: d(-40), leistung_quelle: "Lieferschein LS-2026-00011", gesendet_am: d(-38), versandkanal: "E-Mail", uid_geprueft_am: d(-88), bezahlt_am: d(-26), anzahlungen_verrechnet: [{ anzahlungsrechnung: "RE-2026-00031", datum: d(-88), ust_satz_promille: 200 }], export_status: "exportiert", export_lauf: "EX-2026-0010" }),
    re(31, "hotel", "Anzahlungsrechnung", "Bezahlt", anz("Anzahlung 40 % zu AB-2026-00014", 1667200), { auftrag: "AB-2026-00014", anzahlung_prozent: 40, datum: d(-88), faellig: d(-74), gesendet_am: d(-88), versandkanal: "E-Mail", bezahlt_am: d(-80), uid_geprueft_am: d(-88), export_status: "exportiert", export_lauf: "EX-2026-0009" }),
    re(38, "beispiel", "Anzahlungsrechnung", "Bezahlt", anz("Anzahlung 40 % zu AB-2026-00016", 1775200), { auftrag: "AB-2026-00016", anzahlung_prozent: 40, datum: d(-32), faellig: d(-18), gesendet_am: d(-32), versandkanal: "E-Mail", bezahlt_am: d(-25), uid_geprueft_am: d(-30), export_status: "exportiert", export_lauf: "EX-2026-0010" }),
    re(33, "architektur", "Anzahlungsrechnung", "Bezahlt", anz("Anzahlung 40 % zu AB-2026-00015", 666560), { auftrag: "AB-2026-00015", anzahlung_prozent: 40, datum: d(-58), faellig: d(-44), gesendet_am: d(-58), versandkanal: "E-Mail", bezahlt_am: d(-50), uid_geprueft_am: d(-58), export_status: "exportiert", export_lauf: "EX-2026-0009" }),
    re(49, "demo", "Anzahlungsrechnung", "Bezahlt", anz("Anzahlung 40 % zu AB-2026-00018", 617600), { auftrag: "AB-2026-00018", anzahlung_prozent: 40, datum: d(-8), faellig: d(6), gesendet_am: d(-8), versandkanal: "E-Mail", bezahlt_am: d(-4) }),
    re(45, "probe", "Rechnung", "Teilbezahlt", [POS.tisch], { datum: d(-12), faellig: d(2), leistungsdatum: d(-13), leistung_quelle: "Lieferschein LS-2026-00029", gesendet_am: d(-12), versandkanal: "E-Mail", zahlungen: [z(-4, 500000)] }),
    re(46, "muster", "Rechnung", "Gestellt", [POS.accessoire, POS.leuchte], { datum: d(-9), faellig: d(5), leistungsdatum: d(-10), leistung_quelle: "Kassa-Datum", gesendet_am: d(-9), versandkanal: "E-Mail" }),
    re(47, "architektur", "Rechnung", "Gestellt", [POS.planung, { ...POS.montage, menge: 4 }], { datum: d(-6), faellig: d(8), leistungsdatum: d(-7), leistung_quelle: "von Hand", gesendet_am: "", versandkanal: "", uid_geprueft_am: d(-58) }),
    re(48, "testner", "Barverkauf", "Bezahlt", [POS.accessoire], { datum: d(-15), faellig: d(-15), leistungsdatum: d(-15), leistung_quelle: "Kassa-Datum", kassenbeleg: "K1-000214", versandkanal: "Persoenlich", gesendet_am: d(-15), zahlungen: [], bezahlt_am: d(-15) }),
    re(50, "muster", "Rechnung", "Bezahlt", [{ ...POS.accessoire, menge: 1, einzel_netto_cent: 15000 }], { datum: d(-20), faellig: d(-6), leistungsdatum: d(-20), leistung_quelle: "Kassa-Datum", kleinbetragsrechnung: 1, gesendet_am: d(-20), versandkanal: "E-Mail", bezahlt_am: d(-14), export_status: "exportiert", export_lauf: "EX-2026-0010" }),
    re(51, "hotel", "Rechnung", "Storniert", [POS.planung], { datum: d(-44), faellig: d(-30), leistungsdatum: d(-45), leistung_quelle: "von Hand", gesendet_am: d(-44), versandkanal: "E-Mail", uid_geprueft_am: d(-88), storno_durch: "GU-2026-00004", storniert_am: d(-41), export_status: "exportiert", export_lauf: "EX-2026-0010" }),
    re(32, "vorlage", "Rechnung", "Uneinbringlich", [POS.accessoire, POS.leuchte], { datum: d(-150), faellig: d(-136), leistungsdatum: d(-150), leistung_quelle: "Lieferschein LS-2026-00002", gesendet_am: d(-150), versandkanal: "Post", email: "", mahnstufe: 3, letzte_mahnung: d(-90), uneinbringlich_grund: "Insolvenzverfahren eröffnet", export_status: "exportiert", export_lauf: "EX-2026-0009" }),
    re(34, "probe", "Rechnung", "Bezahlt", [POS.lounge], { datum: d(-70), faellig: d(-56), leistungsdatum: d(-71), leistung_quelle: "Lieferschein LS-2026-00009", gesendet_am: d(-70), versandkanal: "E-Mail", bezahlt_am: d(-60), export_status: "exportiert", export_lauf: "EX-2026-0009" }),
    re(52, "hotel", "Rechnung", "Gestellt", [{ ...POS.hotel, menge: 4 }], { datum: d(-1), faellig: d(13), leistungsdatum: d(-2), leistung_quelle: "Lieferschein LS-2026-00034", gesendet_am: d(-1), versandkanal: "E-Mail", uid_geprueft_am: d(-88) }),
    re(53, "demo", "Rechnung", "Gestellt", [POS.leuchte], { datum: d(-3), faellig: d(11), leistungsdatum: d(-4), leistung_quelle: "Lieferschein LS-2026-00033", gesendet_am: d(-3), versandkanal: "E-Mail" }),
    re(54, "beispiel", "Teilrechnung", "Gestellt", [{ ...POS.sofa, rechnung_menge: 1 }], { auftrag: "AB-2026-00016", datum: d(-4), faellig: d(10), leistungsdatum: d(-5), leistung_quelle: "Lieferschein LS-2026-00032", gesendet_am: d(-4), versandkanal: "E-Mail", uid_geprueft_am: d(-30) }),
    // Entwürfe
    re(7, "muster", "Rechnung", "Entwurf", [POS.accessoire], { datum: d(-6), leistungsdatum: d(-6), creation: dz(-6) }),
    re(8, "architektur", "Schlussrechnung", "Entwurf", [POS.tisch, POS.stuhl, POS.leuchte], { auftrag: "AB-2026-00015", datum: d(-1), leistungsdatum: d(-8), leistung_quelle: "Lieferschein LS-2026-00030", creation: dz(-1), uid_geprueft_am: d(-58), anzahlungen_verrechnet: [{ anzahlungsrechnung: "RE-2026-00033", datum: d(-58), ust_satz_promille: 200, netto_cent: 555467, ust_cent: 111093, brutto_cent: 666560 }], anzahlung_netto_cent: 555467, anzahlung_ust_cent: 111093, anzahlung_brutto_cent: 666560 }),
    re(9, "schema", "Rechnung", "Entwurf", [POS.sofa, POS.montage], { ust_fall: "Ausfuhr", ust_hinweistext: "Steuerfreie Ausfuhrlieferung.", satz: 0, datum: d(0), leistungsdatum: d(-1), leistung_quelle: "Lieferschein LS-2026-00035", creation: dz(0), montage_im_ausland: 1 }),
    re(6, "beispiel", "Rechnung", "Entwurf", [POS.hotel], { datum: d(-3), leistungsdatum: d(-4), leistung_quelle: "Lieferschein LS-2026-00028", creation: dz(-3), uid_empfaenger: "" }),
  ];
  // Beträge, die aus Positionen und Zahlungen folgen, für Bezahlt-Status ohne Einzelzahlungen nachziehen
  for (const r of out) {
    if (r.status === "Bezahlt" && !r.zahlungen?.length) {
      r.zahlungen = r.art === "Barverkauf" ? [{ datum: r.datum, kanal: "Kassa", betrag_cent: r.zahlbar_cent, hinweis: "Kassa K1" }] : [{ datum: r.bezahlt_am || r.datum, kanal: "Ueberweisung", betrag_cent: r.zahlbar_cent, hinweis: "" }];
      r.bezahlt_cent = r.zahlbar_cent;
      r.offen_cent = 0;
    }
  }
  // Schlussrechnung 35 zieht die bezahlte Anzahlung 31 ab
  const r35 = out.find((r) => r.name === "RE-2026-00035");
  const r31 = out.find((r) => r.name === "RE-2026-00031");
  Object.assign(r35, { anzahlung_brutto_cent: r31.brutto_cent, anzahlung_netto_cent: r31.netto_cent, anzahlung_ust_cent: r31.ust_cent });
  r35.anzahlungen_verrechnet[0] = { ...r35.anzahlungen_verrechnet[0], netto_cent: r31.netto_cent, ust_cent: r31.ust_cent, brutto_cent: r31.brutto_cent };
  r35.zahlbar_cent = r35.brutto_cent - r31.brutto_cent;
  r35.zahlungen = [{ datum: d(-26), kanal: "Ueberweisung", betrag_cent: r35.zahlbar_cent, hinweis: "" }];
  r35.bezahlt_cent = r35.zahlbar_cent;
  // Entwurf 8: zahlbar nach Abzug
  const e8 = out.find((r) => r.name === "ENTW-2026-00008");
  e8.zahlbar_cent = e8.brutto_cent - e8.anzahlung_brutto_cent;
  return out;
}

function gutschriften(kt) {
  const gs = (nr, k, art, status, rechnung, pos, extra = {}) => mitSummen({ name: status === "Entwurf" ? `ENTW-GU-2026-0000${nr}` : `GU-2026-0000${nr}`, nummer: status === "Entwurf" ? "" : `GU-2026-0000${nr}`, naming_series: "GU-.YYYY.-.#####", art, status, rechnung, titel: `Gutschrift ${KUNDEN[k].kunde_name}`, kontakt: kt(k), ...adresse(KUNDEN[k]), ust_fall: "Steuerpflichtig AT", docstatus: status === "Entwurf" ? 0 : 1, export_status: "offen", ...BASIS, positionen: positionen(pos), erstattet_cent: 0, ...extra });
  return [
    gs(4, "hotel", "Storno", "Verrechnet", "RE-2026-00051", [POS.planung], { datum: d(-41), grund: "Rechnung an falsche Adresse, neu ausgestellt.", erstattung_art: "Verrechnung mit offener Rechnung", gestellt_am: d(-41), export_status: "exportiert", export_lauf: "EX-2026-0010" }),
    gs(3, "probe", "Teilgutschrift", "Gestellt", "RE-2026-00034", [{ ...POS.lounge, bezeichnung: "Preisnachlass Lieferverzug Outdoor-Lounge", menge: 1, einzel_netto_cent: 40000 }], { datum: d(-9), grund: "Lieferverzug zwei Wochen, Nachlass vereinbart.", erstattung_art: "Rückzahlung", gestellt_am: d(-9) }),
    gs(2, "testner", "Kulanz", "Erstattet", "RE-2026-00040", [{ ...POS.accessoire, bezeichnung: "Kulanz Pflegeset" }], { datum: d(-30), grund: "Kulanz nach Reklamation Pflege.", erstattung_art: "Rückzahlung", gestellt_am: d(-30), erstattet_cent: 30000, export_status: "exportiert", export_lauf: "EX-2026-0010" }),
    gs(1, "muster", "Wertminderung", "Entwurf", "RE-2026-00046", [{ ...POS.leuchte, bezeichnung: "Wertminderung Kratzer Pendelleuchte", menge: 1, einzel_netto_cent: 9600 }], { datum: d(0), grund: "Kratzer an einer Leuchte, Kunde behält sie.", erstattung_art: "Verrechnung mit offener Rechnung" }),
  ].map((g) => (g.erstattet_cent && g.status === "Erstattet" ? { ...g, erstattet_cent: g.brutto_cent } : g));
}

function mahnungen(kt, rech) {
  const by = (n) => rech.find((r) => r.name === n);
  const ma = (nr, re, stufe, status, extra = {}) => {
    const r = by(re);
    return { name: `MA-2026-000${nr}`, naming_series: "MA-.YYYY.-.#####", titel: `Mahnung Stufe ${stufe} · ${re}`, status, rechnung: re, kontakt: r.kontakt, kunde_name: r.kunde_name, stufe, offen_cent: r.offen_cent, mahngebuehr_cent: 0, verzugszinsen_cent: 0, gesamt_cent: r.offen_cent, kanal: r.email ? "E-Mail" : "Post", text: `Zu unserer Rechnung ${re} ist ein Betrag offen.`, ...extra };
  };
  return [
    ma(21, "RE-2026-00042", 1, "Gesendet", { datum: d(-3), frist: d(7), gesendet_am: d(-3), mahnlauf: "ML-2026-11-01", verzugstage: 9 }),
    ma(20, "RE-2026-00040", 2, "Gesendet", { datum: d(-16), frist: d(-6), gesendet_am: d(-16), mahnlauf: "ML-2026-10-19", verzugstage: 30 }),
    ma(19, "RE-2026-00040", 1, "Erledigt", { datum: d(-31), frist: d(-21), gesendet_am: d(-31), erledigt_am: d(-16), mahnlauf: "ML-2026-10-04", stufe: 1, titel: "Mahnung Stufe 1 · RE-2026-00040" }),
    ma(18, "RE-2026-00037", 3, "Gesendet", { datum: d(-20), frist: d(-10), gesendet_am: d(-20), kanal: "Post", mahnlauf: "ML-2026-10-15", verzugstage: 61 }),
    ma(22, "RE-2026-00039", 1, "Entwurf", { datum: d(0), frist: d(10), mahnlauf: "ML-2026-11-04", verzugstage: 14 }),
  ];
}

function bank() {
  const bu = (nr, tag, richtung, auftraggeber, zweck, betrag, extra = {}) => ({ name: `BU-2026-00${nr}`, naming_series: "BU-.YYYY.-.######", titel: `${auftraggeber} · ${zweck}`.slice(0, 140), status: "Offen", konto: "Raiba Lochau", richtung, import: "BI-2026-0007", buchungsdatum: d(tag), valuta: d(tag), betrag_cent: betrag, waehrung: "EUR", auftraggeber, iban_gegen: extra.iban || "AT61 1904 3002 3457 3201", verwendungszweck: zweck, end_to_end_id: `E2E-${nr}`, mandatsreferenz: "", zugeordnet_cent: 0, vorschlag_doctype: "", vorschlag_beleg: "", vorschlag_grund: "", vorschlag_sicherheit: 0, zuordnungen: [], ...extra });
  return [
    bu(1201, -1, "Eingang", "Muster Max", "RE-2026-00042 Anzahlung Kueche Rest", 624000, { vorschlag_doctype: "PH Rechnung", vorschlag_beleg: "RE-2026-00042", vorschlag_grund: "Rechnungsnummer im Verwendungszweck", vorschlag_sicherheit: 100 }),
    bu(1202, -1, "Eingang", "Probe Erika", "AB-2026-00019 Terrasse Anzahlung", 211200, { vorschlag_doctype: "PH Auftragsbestaetigung", vorschlag_beleg: "AB-2026-00019", vorschlag_grund: "Auftragsnummer im Verwendungszweck", vorschlag_sicherheit: 100 }),
    bu(1203, -1, "Eingang", "Demo Julia", "Rechnung Leuchte", 172800, { vorschlag_doctype: "PH Rechnung", vorschlag_beleg: "RE-2026-00053", vorschlag_grund: "Betrag und Name", vorschlag_sicherheit: 80 }),
    bu(1204, -2, "Eingang", "Beispiel GmbH", "RE-2026-00044", 165600, { vorschlag_doctype: "PH Rechnung", vorschlag_beleg: "RE-2026-00044", vorschlag_grund: "Rechnungsnummer im Verwendungszweck", vorschlag_sicherheit: 100 }),
    bu(1205, -2, "Eingang", "M. Probe", "Tisch Rest", 1093600, { vorschlag_doctype: "PH Rechnung", vorschlag_beleg: "RE-2026-00045", vorschlag_grund: "Betrag exakt", vorschlag_sicherheit: 60 }),
    bu(1206, -2, "Eingang", "Testner P.", "Sofa Teilzahlung", 300000, { vorschlag_doctype: "PH Rechnung", vorschlag_beleg: "RE-2026-00040", vorschlag_grund: "Name oder Teilbetrag", vorschlag_sicherheit: 40 }),
    bu(1207, -2, "Ausgang", "BULTHAUP GMBH", "RG 4711 / Komm. Muster", -890000, { vorschlag_doctype: "PH Eingangsrechnung", vorschlag_beleg: "ER-2026-00018", vorschlag_grund: "Betrag exakt", vorschlag_sicherheit: 60, iban: "DE89 3704 0044 0532 0130 00" }),
    bu(1208, -2, "Ausgang", "Raiffeisenbank", "Kontoführung Oktober", -1240, { iban: "AT48 3742 2000 0000 0000" }),
    bu(1209, -3, "Eingang", "Unbekannt GmbH", "Zahlung", 99900),
    bu(1210, -3, "Eingang", "Demo Hotel Betriebs GmbH", "RE-2026-00052 Zimmer", 2040000, { vorschlag_doctype: "PH Rechnung", vorschlag_beleg: "RE-2026-00052", vorschlag_grund: "Rechnungsnummer im Verwendungszweck", vorschlag_sicherheit: 100 }),
    bu(1211, -4, "Eingang", "Probe Erika", "RE-2026-00045", 500000, { status: "Teilweise", zugeordnet_cent: 500000, vorschlag_doctype: "PH Rechnung", vorschlag_beleg: "RE-2026-00045", vorschlag_grund: "Rechnungsnummer im Verwendungszweck", vorschlag_sicherheit: 100, zuordnungen: [{ beleg_doctype: "PH Rechnung", beleg: "RE-2026-00045", betrag_cent: 500000 }], betrag_cent: 520000 }),
    bu(1212, -4, "Eingang", "Demo Julia", "RE-2026-00049 Anzahlung", 741120, { status: "Zugeordnet", zugeordnet_cent: 741120, vorschlag_doctype: "PH Rechnung", vorschlag_beleg: "RE-2026-00049", vorschlag_grund: "Rechnungsnummer im Verwendungszweck", vorschlag_sicherheit: 100, zuordnungen: [{ beleg_doctype: "PH Rechnung", beleg: "RE-2026-00049", betrag_cent: 741120 }] }),
    bu(1213, -10, "Eingang", "Testner Paul", "RE-2026-00040 teilweise", 1500000, { status: "Zugeordnet", zugeordnet_cent: 1500000, zuordnungen: [{ beleg_doctype: "PH Rechnung", beleg: "RE-2026-00040", betrag_cent: 1500000 }] }),
    bu(1214, -5, "Ausgang", "Spedition Lang", "Rechnung 2026-998", -42000, { status: "Ignoriert", ignoriert_grund: "Doppelt" }),
    bu(1215, -6, "Eingang", "Vorlage Clara", "Ruecklastschrift", -12000, { status: "Ignoriert", richtung: "Ausgang", ignoriert_grund: "Rücklastschrift – Leitung klärt" }),
  ];
}

function eingangsrechnungen() {
  const er = (nr, lieferant, rnr, status, netto, extra = {}) => {
    const ust = Math.round(netto * 0.2);
    const brutto = netto + ust;
    const sk = extra.skonto_promille || 0;
    return {
      name: `ER-2026-000${nr}`,
      naming_series: "ER-.YYYY.-.#####",
      titel: `${lieferant} · ${rnr}`,
      status,
      workflow_state: `PH ${status}`,
      lieferant_name: lieferant,
      rechnungsnummer_lieferant: rnr,
      belegart: "Rechnung",
      ust_fall: "Vorsteuer AT",
      netto_cent: netto,
      ust_cent: ust,
      brutto_cent: brutto,
      vorsteuer_cent: ust,
      skonto_cent: Math.round((brutto * sk) / 1000),
      zahlbetrag_cent: brutto - Math.round((brutto * sk) / 1000),
      export_status: "offen",
      zuordnung: [],
      zuordnung_modus: "",
      zuordnung_status: "Offen",
      zuordnung_summe_cent: 0,
      zuordnung_differenz_cent: netto,
      datei: `/private/files/ER-2026-000${nr}.pdf`,
      positionen: [],
      ...extra,
    };
  };
  const zuo = (doc, modus, zeilen) => {
    const summe = modus === "Gemeinkosten" ? doc.netto_cent : zeilen.reduce((s, z) => s + z.betrag_cent, 0);
    return { ...doc, zuordnung_modus: modus, zuordnung: zeilen, zuordnung_summe_cent: summe, zuordnung_differenz_cent: doc.netto_cent - summe, zuordnung_status: modus === "Gemeinkosten" ? "Gemeinkosten" : summe === doc.netto_cent ? "Vollstaendig" : "Offen", kostenart: zeilen[0]?.kostenart || "" };
  };
  const p = (projekt, kostenart, betrag, extra = {}) => ({ projekt, kostenart, betrag_cent: betrag, prozent: 0, ...extra });
  const pr = ["PH-PRJ-2026-0001", "PH-PRJ-2026-0002", "PH-PRJ-2026-0003"];
  return [
    zuo(er(18, "Bulthaup GmbH", "4711", "Sachlich geprueft", 726833, { datum: d(-6), eingang: d(-5), faellig: d(23), skonto_promille: 20, skonto_bis: d(2), herstellerbestellung: "HB-2026-00031", projekt: pr[0], auftrag: "AB-2026-00017", geprueft_von: "faktura@demo.local", geprueft_am: dz(-4), iban_lieferant: "DE89 3704 0044 0532 0130 00", abweichung_zur_ab: "" }), "Ganz einem Projekt", [p(pr[0], "Ware", 726833, { bezug_doctype: "PH Herstellerbestellung", bezug_name: "HB-2026-00031", vorschlag: 1 })]),
    er(19, "Spedition Lang", "2026-998", "Erfasst", 35000, { datum: d(-3), eingang: d(-2), faellig: d(9), lieferant: "" }),
    zuo(er(20, "Tischlerei Probe", "R-118", "Erfasst", 412000, { datum: d(-4), eingang: d(-4), faellig: d(10), positionen: positionen([{ art: "Leistung", bezeichnung: "Esstisch Maßanfertigung", menge: 1, einheit: "Stk", einzel_netto_cent: 312000 }, { art: "Leistung", bezeichnung: "Wandverkleidung Eiche", menge: 1, einheit: "Pausch", einzel_netto_cent: 100000 }]) }), "Nach Positionen", [p(pr[1], "Fremdgewerk", 312000, { belegposition: 1 }), p("", "", 100000, { belegposition: 2 })]),
    zuo(er(21, "Elektro Demo", "E-2026-55", "Sachlich geprueft", 180000, { datum: d(-8), eingang: d(-7), faellig: d(6), geprueft_von: "faktura@demo.local", geprueft_am: dz(-6) }), "Aliquot", [p(pr[0], "Montage extern", 108000, { prozent: 60 }), p(pr[2], "Montage extern", 72000, { prozent: 40 })]),
    zuo(er(22, "Büro Vorlage KG", "BV-7781", "Freigegeben", 24000, { datum: d(-15), eingang: d(-14), faellig: d(1), geprueft_von: "faktura@demo.local", geprueft_am: dz(-12), freigegeben_von: "faktura@demo.local", freigegeben_am: dz(-11), zahllauf: 1 }), "Gemeinkosten", []),
    zuo(er(23, "Poliform Deutschland", "PF-90211", "Freigegeben", 1120000, { datum: d(-20), eingang: d(-19), faellig: d(-2), herstellerbestellung: "HB-2026-00027", projekt: pr[0], geprueft_von: "faktura@demo.local", geprueft_am: dz(-18), freigegeben_von: "faktura@demo.local", freigegeben_am: dz(-17), zahllauf: 1, budget_hinweis: "Projekt PH-PRJ-2026-0001 · Ware: 96 % des Budgets gebunden" }), "Ganz einem Projekt", [p(pr[0], "Ware", 1120000, { bezug_doctype: "PH Herstellerbestellung", bezug_name: "HB-2026-00027" })]),
    zuo(er(24, "Minotti Spa", "MI-55120", "Bezahlt", 2050000, { datum: d(-45), eingang: d(-44), faellig: d(-15), projekt: pr[2], geprueft_von: "faktura@demo.local", geprueft_am: dz(-40), freigegeben_von: "faktura@demo.local", freigegeben_am: dz(-39), bezahlt_am: d(-16), bezahlt_cent: 2460000, export_status: "exportiert", export_lauf: "EX-2026-0010", ust_fall: "Innergemeinschaftlicher Erwerb" }), "Ganz einem Projekt", [p(pr[2], "Ware", 2050000)]),
    er(25, "Möbel Muster AG", "MM-118", "Abgelehnt", 99000, { datum: d(-10), eingang: d(-9), faellig: d(4), ablehnungsgrund: "Keine Bestellung zu dieser Rechnung." }),
    zuo(er(26, "Spedition Lang", "2026-1011", "Erfasst", 64000, { datum: d(-1), eingang: d(0), faellig: d(13) }), "Aliquot", [p(pr[0], "Fracht", 32000, { prozent: 50 }), p(pr[1], "Fracht", 25600, { prozent: 40 })]),
    er(27, "Flexform Italia", "FX-2026-0447", "Erfasst", 512000, { datum: d(-2), eingang: d(-1), faellig: d(28), herstellerbestellung: "HB-2026-00033", projekt: pr[1], skonto_promille: 30, skonto_bis: d(8) }),
  ];
}

/** Budget je Projekt/Kostenart für den Budget-Hinweis im Mock (Frappe: ph_projekte.api.projekt_kalkulation_v2). */
export const MOCK_BUDGETS = {
  "PH-PRJ-2026-0001": { titel: "Haus am See", kostenarten: { Ware: { budget_cent: 2000000, gebunden_cent: 1120000 }, "Montage extern": { budget_cent: 150000, gebunden_cent: 30000 }, Fracht: { budget_cent: 40000, gebunden_cent: 18000 } } },
  "PH-PRJ-2026-0002": { titel: "Wohnung Innsbruck", kostenarten: { Fremdgewerk: { budget_cent: 300000, gebunden_cent: 0 }, Fracht: { budget_cent: 30000, gebunden_cent: 6000 } } },
  "PH-PRJ-2026-0003": { titel: "Hotel Seeblick", kostenarten: { Ware: { budget_cent: 2500000, gebunden_cent: 2050000 } } },
};

function exporte() {
  return [
    { name: "EX-2026-0010", naming_series: "EX-.YYYY.-.####", titel: "Export Oktober 2026", status: "Bestaetigt", format: "BMD CSV", belegarten: "Alle", zeitraum_von: "2026-10-01", zeitraum_bis: "2026-10-31", nur_neue: 1, anzahl: 61, summe_brutto_cent: 21430000, pruefsumme_gesamt: "9f3a1c77e0b24d51", erzeugt_am: "2026-11-01", erstellt_von: "faktura@demo.local", uebergeben_am: "2026-11-01", uebergeben_an: "Kanzlei · E-Mail", bestaetigt_von_kanzlei_am: "2026-11-02", datei: "/private/files/EX-2026-0010.csv", belege: [{ beleg_doctype: "PH Rechnung", beleg: "RE-2026-00042", nummer: "RE-2026-00042", datum: d(-26), kontakt_name: "Familie Muster", konto: "4000", gegenkonto: "20001", steuercode: "20", netto_cent: 832000, ust_cent: 166400, brutto_cent: 998400, status: "uebergeben", pruefsumme: "a1b2c3d4" }, { beleg_doctype: "PH Rechnung", beleg: "RE-2026-00041", nummer: "RE-2026-00041", datum: d(-35), kontakt_name: "Erika Probe", konto: "4000", gegenkonto: "20003", steuercode: "20", netto_cent: 144000, ust_cent: 28800, brutto_cent: 172800, status: "uebergeben", pruefsumme: "e5f6a7b8" }] },
    { name: "EX-2026-0011", naming_series: "EX-.YYYY.-.####", titel: "Export November 2026", status: "Entwurf", format: "DATEV Buchungsstapel", belegarten: "Alle", zeitraum_von: "2026-11-01", zeitraum_bis: "2026-11-04", nur_neue: 1, anzahl: 7, summe_brutto_cent: 1840000, belege: [] },
    { name: "EX-2026-0009", naming_series: "EX-.YYYY.-.####", titel: "Export September 2026", status: "Bestaetigt", format: "BMD CSV", belegarten: "Alle", zeitraum_von: "2026-09-01", zeitraum_bis: "2026-09-30", nur_neue: 1, anzahl: 48, summe_brutto_cent: 17860000, pruefsumme_gesamt: "1b9d00e3a4c2f871", erzeugt_am: "2026-10-03", uebergeben_am: "2026-10-03", uebergeben_an: "Kanzlei · E-Mail", bestaetigt_von_kanzlei_am: "2026-10-06", belege: [] },
  ];
}

function uva() {
  const zeilen = [
    { kennzahl: "000", bezeichnung: "Lieferungen und Leistungen gesamt", bemessung_cent: 17840000, steuer_cent: 0, anzahl_belege: 61 },
    { kennzahl: "022", bezeichnung: "Inland 20 %", bemessung_cent: 17060000, steuer_cent: 3412000, anzahl_belege: 58 },
    { kennzahl: "029", bezeichnung: "Inland 10 %", bemessung_cent: 0, steuer_cent: 0, anzahl_belege: 0 },
    { kennzahl: "017", bezeichnung: "EU-Firma (innergemeinschaftliche Lieferung)", bemessung_cent: 780000, steuer_cent: 0, anzahl_belege: 2 },
    { kennzahl: "–", bezeichnung: "Anzahlungen vereinnahmt", bemessung_cent: 1240000, steuer_cent: 206667, anzahl_belege: 4 },
    { kennzahl: "060", bezeichnung: "Vorsteuer", bemessung_cent: 0, steuer_cent: 1180000, anzahl_belege: 9 },
  ];
  return [
    { name: "UVA-2026-010", naming_series: "UVA-.YYYY.-.###", titel: "UVA Oktober 2026", status: "Berechnet", zeitraum_art: "Monat", jahr: 2026, periode: 10, zeitraum_von: "2026-10-01", zeitraum_bis: "2026-10-31", berechnet_am: "2026-11-01", methode: "Sollversteuerung, Anzahlungen nach Vereinnahmung", zeilen, zahllast_cent: 3412000 + 206667 - 1180000, belegliste: "RE-2026-00031 … RE-2026-00051" },
    { name: "UVA-2026-009", naming_series: "UVA-.YYYY.-.###", titel: "UVA September 2026", status: "Uebergeben", zeitraum_art: "Monat", jahr: 2026, periode: 9, zeitraum_von: "2026-09-01", zeitraum_bis: "2026-09-30", berechnet_am: "2026-10-01", uebergeben_am: "2026-10-06", methode: "Sollversteuerung, Anzahlungen nach Vereinnahmung", zeilen: zeilen.map((z) => ({ ...z, bemessung_cent: Math.round(z.bemessung_cent * 0.8), steuer_cent: Math.round(z.steuer_cent * 0.8) })), zahllast_cent: Math.round((3412000 + 206667 - 1180000) * 0.8) },
  ];
}

function journal(rech) {
  const out = [];
  let i = 0;
  for (const r of rech.filter((x) => Number(x.docstatus) === 1).sort((a, b) => String(a.datum).localeCompare(String(b.datum)))) {
    out.push({ name: `JR-${String(++i).padStart(4, "0")}`, titel: `Gestellt ${r.name}`, zeitpunkt: r.datum, vorgang: "Gestellt", beleg_doctype: "PH Rechnung", beleg: r.name, nummer: r.name, betrag_cent: r.brutto_cent, benutzer: "faktura@demo.local", details: r.art, pruefsumme: `${(i * 2654435761 >>> 0).toString(16).padStart(8, "0")}${(i * 40503 >>> 0).toString(16).padStart(8, "0")}` });
    for (const z of r.zahlungen || []) out.push({ name: `JR-${String(++i).padStart(4, "0")}`, titel: `Zahlung ${r.name}`, zeitpunkt: z.datum, vorgang: "Zahlung", beleg_doctype: "PH Rechnung", beleg: r.name, nummer: r.name, betrag_cent: z.betrag_cent, benutzer: "faktura@demo.local", details: z.kanal, pruefsumme: `${(i * 2654435761 >>> 0).toString(16).padStart(8, "0")}${(i * 40503 >>> 0).toString(16).padStart(8, "0")}` });
  }
  return out;
}

const ZAHLUNGSBEDINGUNGEN = [
  { name: "40/50/10", titel: "40/50/10", aktiv: 1, standard: 1, anzahlung_prozent: 40, teilzahlung_prozent: 50, rest_prozent: 10, zieltage: 14, skonto_promille: 0, skonto_tage: 0, text: "40 % bei Auftrag, 50 % bei Lieferung, 10 % nach Montage." },
  { name: "Sofort netto", titel: "Sofort netto", aktiv: 1, standard: 0, anzahlung_prozent: 0, teilzahlung_prozent: 0, rest_prozent: 100, zieltage: 14, skonto_promille: 0, skonto_tage: 0, text: "Zahlbar innerhalb von 14 Tagen ohne Abzug." },
  { name: "2 % Skonto 10 Tage", titel: "2 % Skonto 10 Tage", aktiv: 1, standard: 0, anzahlung_prozent: 0, teilzahlung_prozent: 0, rest_prozent: 100, zieltage: 30, skonto_promille: 20, skonto_tage: 10, text: "30 Tage netto, 10 Tage 2 % Skonto." },
];

const BANKKONTO = { name: "Raiba Lochau", bezeichnung: "Raiba Lochau", iban: "AT12 3742 2000 0001 7890", bic: "RVVGAT2B422", bank: "Raiffeisenbank Lochau (Beispiel)", kontoinhaber: "Platzhirsch Home Living GmbH (Beispiel)", waehrung: "EUR", export_konto: "2800", standard: 1, aktiv: 1, letzter_import: "2026-11-03", saldo_cent: 4211830 };

/** Doctypes, deren generischer Bestand ersetzt wird. */
export const ERSETZT = ["PH Angebot", "PH Auftragsbestaetigung", "PH Rechnung", "PH Gutschrift", "PH Mahnung", "PH Eingangsrechnung", "PH Bankumsatz", "PH Bankimport", "PH Bankkonto", "PH Export Lauf", "PH UVA Auswertung", "PH Zahlungsbedingung", "PH Buchungsjournal"];

/**
 * Nachlauf nach dem Grundaufbau (Bezüge zwischen DocTypes, Leer-/Fehlerfälle). Eigener Zufall über hilfe.rng.
 * @param {Map<string, Map<string, object>>} db
 * @param {import("./index.js").SeedHilfe} hilfe
 */
export default function nachlauf(db, hilfe) {
  const kontakte = hilfe.kontakte || [];
  const schluessel = Object.keys(KUNDEN);
  const kt = (k) => kontakte[schluessel.indexOf(k) % Math.max(kontakte.length, 1)]?.name || "";
  const projekte = [...(db.get("PH Projekt")?.values() || [])].map((p) => p.name);
  const pr = (i) => projekte[i] || "";
  const jetzt = "2026-11-04 08:00:00";
  const stempel = (doc, i, doctype) => ({ doctype, owner: "faktura@demo.local", creation: doc.creation || `${doc.datum || doc.buchungsdatum || doc.zeitraum_von || "2026-11-01"} 09:00:00`, modified: doc.modified || (doc.datum ? `${doc.datum} 1${i % 10}:00:00` : jetzt), modified_by: "faktura@demo.local", docstatus: doc.docstatus ?? 0, idx: 0, ...doc });

  const rech = rechnungen(kt, pr);
  const bestand = {
    "PH Angebot": angebote(kt, pr),
    "PH Auftragsbestaetigung": auftraege(kt, pr),
    "PH Rechnung": rech,
    "PH Gutschrift": gutschriften(kt),
    "PH Mahnung": mahnungen(kt, rech),
    "PH Eingangsrechnung": eingangsrechnungen(),
    "PH Bankumsatz": bank(),
    "PH Bankimport": [{ name: "BI-2026-0007", naming_series: "BI-.YYYY.-.####", titel: "Kontoauszug 01.11.–03.11.2026", status: "Importiert", konto: "Raiba Lochau", zeitraum_von: "2026-11-01", zeitraum_bis: "2026-11-03", saldo_start_cent: 3912830, saldo_ende_cent: 4211830, anzahl: 15, anzahl_neu: 15, anzahl_doppelt: 0, anzahl_vorschlag: 10, anzahl_zugeordnet: 0, importiert_am: "2026-11-03", camt_ref: "CAMT-20261103-0007" }],
    "PH Bankkonto": [BANKKONTO],
    "PH Export Lauf": exporte(),
    "PH UVA Auswertung": uva(),
    "PH Zahlungsbedingung": ZAHLUNGSBEDINGUNGEN,
    "PH Buchungsjournal": journal(rech),
  };
  for (const dt of ERSETZT) {
    if (!hilfe.index?.doctypes?.has?.(dt)) continue;
    const t = hilfe.tabelle(dt);
    t.clear();
    (bestand[dt] || []).forEach((doc, i) => t.set(doc.name, stempel(doc, i, dt)));
  }
  // Nummernkreise hinter den Bestand setzen (neue Belege bekommen die nächste freie Nummer)
  const hoch = (prefix, bis) => {
    for (let n = 0; n < bis; n++) hilfe.naechste(prefix);
  };
  hoch("AN-2026-", 88);
  hoch("AB-2026-", 19);
  hoch("RE-2026-", 54);
  hoch("ENTW-2026-", 9);
  hoch("GU-2026-", 4);
  hoch("ENTW-GU-2026-", 1);
  hoch("MA-2026-", 22);
  hoch("ER-2026-", 27);
  hoch("BU-2026-", 1215);
  hoch("BI-2026-", 7);
  hoch("EX-2026-", 11);
  hoch("UVA-2026-", 10);
  // Faktura-Einstellungen: Standards für den Testmandanten
  const fe = hilfe.tabelle("PH Faktura Einstellungen").get("PH Faktura Einstellungen");
  if (fe) Object.assign(fe, { standard_zahlungsbedingung: "40/50/10", standard_bankkonto: "Raiba Lochau", export_format_standard: "BMD CSV" });
  const me = hilfe.tabelle("PH Mahnwesen Einstellungen").get("PH Mahnwesen Einstellungen");
  if (me) Object.assign(me, { aktiv: 1, karenz_tage: 7, mindestbetrag_cent: 1000, stufe1_tage: 7, stufe2_tage: 21, stufe3_tage: 35, abstand_tage: 14, frist_tage: 10, entwurf_statt_senden: 1 });
}
