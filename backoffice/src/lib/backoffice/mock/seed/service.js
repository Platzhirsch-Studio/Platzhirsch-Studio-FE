// Mock-Seed – Bereich Service (G-01, MASTER § 3.5). Schreibt: Team B-SER.
// anzahl: Datensätze je DocType · kern: Fachwissen je DocType (Verteilung, Bezüge, Titel) nach der
// generischen Erzeugung · default: Nachlauf (db, hilfe) nach dem Grundaufbau, Reihenfolge über `nach`.
// Keine echten Personen, E-Mails @beispiel.invalid, runde Beispielbeträge (Q-A3). Zufall nur über `r`
// (fester Startwert); Reihenfolge der r-Aufrufe nicht ändern, sonst verschieben sich alle Folgedaten.
//
// B-SER (10-konzept-service §14.6): `anzahl` und `kern` bleiben unverändert (Zufallsfolge aller Bereiche).
// Der Nachlauf ersetzt die generischen Service-Daten durch einen festen, fachlich stimmigen Bestand:
// 14 Fälle über alle Status und Sonderfälle (Kulanz angefordert/abgelehnt, Telefonfall ohne E-Mail, Website-Fall,
// Fall mit Projekt, bei Meldung abgelaufen, rechtzeitig gemeldet und heute nach Gewährleistung, Unternehmer),
// 3 Techniker, 9 Einsätze, Fehlerkatalog aus install.py (+ „-99 Sonstiges“), 10 Ersatzteile, 3 Bestellungen,
// 3 Regresse, 3 Pflege-Verträge, 3 Serviceaufträge. Bezugstag 04.11.2026.

import { isoDatumZeit } from "../../format.js";
import { tage } from "./basis.js";
import { FEHLERBEREICHE, FEHLERCODES } from "../../service/katalog.js";
import { fristen, reaktionsfrist } from "../../service/fristen.js";

/** Nachläufe anderer Bereiche, die vor diesem laufen müssen. */
export const nach = [];

/** Anzahl generischer Datensätze je DocType (nicht gelistete mit Status bekommen 6). */
export const anzahl = {
  "PH Servicefall": 12,
  "PH Serviceauftrag": 8,
  "PH Fehlercode": 6,
};

/** Fachliche Nachbearbeitung je DocType: (doc, { i, r, ctx, person }) – ändert doc. */
export const kern = {
  "PH Servicefall": (doc, { r, person }) => {
    doc.status = r.pick(["Gemeldet", "Gemeldet", "Geprueft", "Entscheidung", "In Bearbeitung", "Einsatz geplant", "Erledigt", "Geschlossen"]);
    doc.art = r.pick(["Mangel", "Mangel", "Transportschaden", "Montagefehler", "Garantie", "Kulanz"]);
    doc.gemeldet_am = isoDatumZeit(tage(-r.int(0, 60), r));
    doc.kundentyp = r.pick(["Verbraucher", "Verbraucher", "Unternehmer"]);
    doc.beschreibung = r.pick(["Naht am Sitzkissen löst sich.", "Kratzer an der Tischplatte bei Lieferung.", "Schublade schließt nicht bündig.", "Leuchte flackert."]);
    doc.titel = `${doc.art}: ${person}`;
    doc.workflow_state = `PH ${doc.status}`;
  },
  "PH Serviceauftrag": (doc, { r, person }) => {
    doc.status = r.pick(["Angefragt", "Angeboten", "Beauftragt", "Abgeholt", "Eingelagert", "In Arbeit", "Zurueckgebracht"]);
    doc.art = r.pick(["Winterlager", "Winterlager", "Pflege", "Reinigung", "Reparatur"]);
    doc.titel = `${doc.art} ${person}`;
    doc.workflow_state = `PH ${doc.status}`;
  },
};

// ------------------------------------------------------------- Bestand --

/** Techniker des Mock (Rolle PH Techniker). Der erste ist der Demo-Benutzer zum Anmelden. */
export const TECHNIKER = [
  { email: "techniker@demo.local", name: "Max Probe (Techniker)" },
  { email: "t.beispiel@demo.local", name: "Thomas Beispiel" },
  { email: "m.vorlage@demo.local", name: "Martin Vorlage" },
];
const BEARBEITER = "service@demo.local";

const d = (offset) => isoDatumZeit(tage(offset)).slice(0, 10);
const dz = (offset, zeit = "09:00") => `${d(offset)} ${zeit}:00`;

/** Kundin/Kunde je Fall (Musternamen, keine echten Personen). */
const KUNDEN = [
  { name: "Familie Muster", ort: "6911 Lochau", strasse: "Seestraße 3", email: "familie.muster@beispiel.invalid", telefon: "+43 664 1234567" },
  { name: "Max Beispiel", ort: "6900 Bregenz", strasse: "Kornmarktplatz 2", email: "", telefon: "0664 2345678" },
  { name: "Hotel Seeblick Demo GmbH", ort: "88131 Lindau", strasse: "Uferweg 12", email: "einkauf@hotel-seeblick.beispiel.invalid", telefon: "+49 8382 123456", unternehmer: true },
  { name: "Erika Probe", ort: "6850 Dornbirn", strasse: "Marktstraße 7", email: "erika.probe@beispiel.invalid", telefon: "+43 676 3456789" },
  { name: "Familie Vorlage", ort: "6971 Hard", strasse: "Landstraße 18", email: "vorlage@beispiel.invalid", telefon: "+43 650 4567890" },
  { name: "Paul Schema", ort: "6890 Lustenau", strasse: "Rheinstraße 40", email: "paul.schema@beispiel.invalid", telefon: "+43 699 5678901" },
  { name: "Anna Testner", ort: "9000 St. Gallen", strasse: "Rosenbergstrasse 9", email: "anna.testner@beispiel.invalid", telefon: "+41 71 6789012" },
  { name: "Familie Platzhalter", ort: "6911 Lochau", strasse: "Hoferstraße 5", email: "platzhalter@beispiel.invalid", telefon: "+43 5574 78901" },
  { name: "Lukas Demo", ort: "6800 Feldkirch", strasse: "Schmiedgasse 11", email: "lukas.demo@beispiel.invalid", telefon: "+43 664 8901234" },
  { name: "Clara Mustermann", ort: "6020 Innsbruck", strasse: "Anichstraße 20", email: "clara.mustermann@beispiel.invalid", telefon: "+43 512 901234" },
  { name: "Praxis Beispiel OG", ort: "6900 Bregenz", strasse: "Rathausstraße 4", email: "praxis@beispiel.invalid", telefon: "+43 5574 12345", unternehmer: true },
  { name: "Sophie Vorlage", ort: "8280 Kreuzlingen", strasse: "Hauptstrasse 30", email: "sophie.vorlage@beispiel.invalid", telefon: "+41 71 2345678" },
  { name: "Jonas Probe", ort: "6971 Hard", strasse: "Seestraße 21", email: "jonas.probe@beispiel.invalid", telefon: "+43 660 3456781" },
  { name: "Familie Testner", ort: "6911 Lochau", strasse: "Pfänderweg 8", email: "testner@beispiel.invalid", telefon: "+43 664 4567812" },
];

const BILD = {
  sofa: "/entwurf/lounge/r-wohnen-sofa.jpg",
  kueche: "/entwurf/lounge/r-kueche-eiche.jpg",
  bad: "/entwurf/lounge/r-bad.webp",
  garten: "/entwurf/lounge/r-garten-lounge.jpg",
  leuchte: "/entwurf/lounge/p-bell-leuchte.webp",
  bett: "/entwurf/lounge/r-schlafen.webp",
  essen: "/entwurf/lounge/r-essen-licht.jpg",
  terrasse: "/entwurf/lounge/r-terrasse-see.jpg",
  hotel: "/entwurf/lounge/r-terrasse-hotel.jpg",
};

function foto(bild, hinweis, quelle = "Intern", datum = d(-1)) {
  return { bild, medientyp: "Bild", hinweis, quelle, datum, aufgenommen_von: quelle === "Kunde" ? "Kunde" : "Service", an_lieferant: 0 };
}

function verlauf(zeit, ereignis, status, hinweis, von = BEARBEITER) {
  return { zeit, ereignis, status, hinweis, von };
}

/**
 * Fälle (Reihenfolge = Nummer). Felder exakt aus ph_servicefall.json; Fristen aus fristen.js (wie der Server).
 * `k` = Index in KUNDEN, `fc` = Fehlercode.
 */
function faelle() {
  return [
    // 1 Gemeldet · keine Erstreaktion · Reaktion überfällig · E-Mail vorhanden → „Eingangsbestätigung senden“
    { k: 0, status: "Gemeldet", art: "Mangel", kanal: "E-Mail", quelle: "backoffice", prioritaet: "Hoch", gemeldet: -3, fc: "POL-03", produkt_name: "Sofa Modul 240", marke: "Minotti", lieferant: "Minotti", uebergabe: -260, kundenwunsch: "Verbesserung", beschreibung: "Naht an der linken Armlehne offen, seit etwa zwei Wochen.", ort_am_stueck: "Armlehne links", erstauftreten: -16, bild: BILD.sofa, ohneErstreaktion: true },
    // 2 Website-Meldung · Zuordnung prüfen · Reaktionsfrist morgen
    { k: 3, status: "Gemeldet", art: "Mangel", kanal: "Website", quelle: "website", prioritaet: "Normal", gemeldet: -1, fc: "", produkt_name: "Pendelleuchte Glas", marke: "Flos", lieferant: "Flos", uebergabe: -120, kundenwunsch: "Offen", beschreibung: "Leuchte flackert nach etwa zehn Minuten, Leuchtmittel bereits getauscht.", bild: BILD.leuchte, ohneErstreaktion: true, referenz_website: "WEB-2026-1104-07" },
    // 3 Telefonfall ohne E-Mail · Transportschaden · Kunde gilt als kontaktiert · Fehler zuordnen
    { k: 1, status: "Gemeldet", art: "Transportschaden", kanal: "Telefon", quelle: "backoffice", prioritaet: "Hoch", gemeldet: 0, fc: "", produkt_name: "Esstisch Eiche 220", marke: "Poliform", lieferant: "Poliform", uebergabe: -2, kundenwunsch: "Austausch", beschreibung: "Kante der Tischplatte bei Lieferung beschädigt, Fahrer hat es gesehen.", bild: BILD.essen, erstreaktionTelefon: true },
    // 4 Unternehmer (Hotel) · Gemeldet mit Fehlercode → „Prüfen & entscheiden“
    { k: 2, status: "Gemeldet", art: "Mangel", kanal: "E-Mail", quelle: "backoffice", prioritaet: "Normal", gemeldet: -2, fc: "MEC-01", produkt_name: "Kleiderschrank Zimmer 12", marke: "Walter Knoll", lieferant: "Walter Knoll", uebergabe: -150, kundenwunsch: "Verbesserung", beschreibung: "Scharnier der Schranktür in Zimmer 12 schwergängig, Tür hängt ab.", bild: BILD.hotel, erstreaktion: -2 },
    // 5 Geprüft · Lieferant haftet · Mangel bestätigt → Mängelanzeige offen (D-2) + „Entscheiden“
    { k: 4, status: "Geprueft", art: "Mangel", kanal: "Telefon", quelle: "backoffice", prioritaet: "Normal", gemeldet: -6, fc: "OBF-03", produkt_name: "Sideboard Lack weiß", marke: "Poliform", lieferant: "Poliform", uebergabe: -200, kundenwunsch: "Austausch", beschreibung: "Lack an der Front oben links abgeplatzt, etwa 2 cm.", bild: BILD.kueche, erstreaktion: -6, mangel_bestaetigt: "Ja", ursache: "Material", pruefergebnis: "Abplatzung ohne äußere Einwirkung, Lackhaftung mangelhaft." },
    // 6 Entschieden · Kulanz angefordert (über Schwelle) · bei Meldung abgelaufen
    { k: 5, status: "Entscheidung", art: "Kulanz", kanal: "Showroom", quelle: "backoffice", prioritaet: "Normal", gemeldet: -8, fc: "POL-05", produkt_name: "Ledersessel Lounge", marke: "Cassina", lieferant: "Cassina", uebergabe: -900, kundenwunsch: "Verbesserung", beschreibung: "Leder an der Sitzkante rissig, Kauf vor knapp zweieinhalb Jahren.", bild: BILD.sofa, erstreaktion: -8, mangel_bestaetigt: "Teilweise", ursache: "Verschleiss", entscheidung: "Kulanz", kulanz_cent: 62000, kulanz_freigabe_noetig: 1, kulanz_freigabe_status: "Angefordert", kulanz_angefordert: -1, entscheidung_begruendung: "Langjährige Kundin; Nachfärben und Aufarbeitung der Sitzkante auf Kulanz." },
    // 7 Entschieden · Kulanz abgelehnt
    { k: 6, status: "Entscheidung", art: "Kulanz", kanal: "E-Mail", quelle: "backoffice", prioritaet: "Niedrig", gemeldet: -12, fc: "POL-04", produkt_name: "Sofa Stoff Bouclé", marke: "Flexform", lieferant: "Flexform", uebergabe: -800, kundenwunsch: "Austausch", beschreibung: "Stoff zeigt Knötchen an den Sitzflächen.", bild: BILD.sofa, erstreaktion: -11, mangel_bestaetigt: "Nein", ursache: "Verschleiss", entscheidung: "Kulanz", kulanz_cent: 90000, kulanz_freigabe_noetig: 1, kulanz_freigabe_status: "Abgelehnt", kulanz_abgelehnt_cent: 90000, kulanz_freigabe_kommentar: "Gebrauchsspur, Pflegeangebot statt Austausch.", entscheidung_begruendung: "Austausch des Bezugs auf Kulanz." },
    // 8 In Bearbeitung · Verbesserung · Ersatzteil benötigt → „Ersatzteile bestellen“ · mit Projekt
    { k: 7, status: "In Bearbeitung", art: "Montagefehler", kanal: "Montage", quelle: "montage", prioritaet: "Hoch", gemeldet: -9, fc: "MEC-02", produkt_name: "Küche Eiche Auszug", marke: "Poliform", lieferant: "Poliform", uebergabe: -40, kundenwunsch: "Verbesserung", beschreibung: "Auszug unter dem Kochfeld klemmt, Führungsschiene verbogen.", bild: BILD.kueche, erstreaktion: -9, mangel_bestaetigt: "Ja", ursache: "Montage", entscheidung: "Verbesserung", entscheidung_begruendung: "Schiene tauschen, Auszug neu einstellen.", projekt: true, teile: [{ i: 1, status: "Benoetigt", menge: 1 }] },
    // 9 Einsatz geplant · Einsatz bestätigt am 06.11.
    { k: 8, status: "Einsatz geplant", art: "Mangel", kanal: "Telefon", quelle: "backoffice", prioritaet: "Normal", gemeldet: -14, fc: "ELE-02", produkt_name: "Spiegelschrank Bad LED", marke: "Ezarri", lieferant: "Ezarri", uebergabe: -300, kundenwunsch: "Verbesserung", beschreibung: "LED-Band im Spiegelschrank fällt zeitweise aus.", bild: BILD.bad, erstreaktion: -14, mangel_bestaetigt: "Ja", ursache: "Material", entscheidung: "Verbesserung", entscheidung_begruendung: "Trafo und LED-Band tauschen.", teile: [{ i: 3, status: "Eingetroffen", menge: 1 }] },
    // 10 In Bearbeitung · Austausch · Einsatz erledigt → „Erledigt melden“
    { k: 9, status: "In Bearbeitung", art: "Mangel", kanal: "E-Mail", quelle: "portal", prioritaet: "Normal", gemeldet: -20, fc: "GLS-03", produkt_name: "Couchtisch Glas", marke: "ClassiCon", lieferant: "ClassiCon", uebergabe: -180, kundenwunsch: "Austausch", beschreibung: "Einschluss im Glas sichtbar, Blase etwa 3 mm.", bild: BILD.essen, erstreaktion: -20, mangel_bestaetigt: "Ja", ursache: "Material", entscheidung: "Austausch", entscheidung_begruendung: "Glasplatte tauschen.", portal_sichtbar: 1 },
    // 11 Erledigt · Lieferant haftet · kein Regress → „Forderung stellen“
    { k: 10, status: "Erledigt", art: "Mangel", kanal: "E-Mail", quelle: "backoffice", prioritaet: "Normal", gemeldet: -30, fc: "MEC-03", produkt_name: "Behandlungsliege Relax", marke: "Vitra", lieferant: "Vitra", uebergabe: -400, kundenwunsch: "Verbesserung", beschreibung: "Verstellmechanik rastet nicht mehr ein.", bild: BILD.bett, erstreaktion: -29, mangel_bestaetigt: "Ja", ursache: "Material", entscheidung: "Verbesserung", entscheidung_begruendung: "Beschlag getauscht.", erledigt: -7, abschlussbericht: "Beschlag der Verstellmechanik getauscht, Funktion geprüft.", kosten_extern_cent: 42000, kosten_intern_cent: 18000 },
    // 12 Erledigt · Kunde informiert · Regress vorhanden → „Schließen“
    { k: 11, status: "Erledigt", art: "Transportschaden", kanal: "Telefon", quelle: "backoffice", prioritaet: "Normal", gemeldet: -40, fc: "TRA-02", produkt_name: "Outdoor-Lounge Modul", marke: "Minotti", lieferant: "Minotti", uebergabe: -45, kundenwunsch: "Austausch", beschreibung: "Druckstelle am Rahmen nach Anlieferung.", bild: BILD.garten, erstreaktion: -40, mangel_bestaetigt: "Ja", ursache: "Transport", entscheidung: "Austausch", entscheidung_begruendung: "Rahmenteil vom Hersteller ersetzt.", erledigt: -10, abschlussbericht: "Rahmenteil getauscht.", informiert: -9, regress: true, kosten_extern_cent: 120000 },
    // 13 Geschlossen · rechtzeitig gemeldet, heute nach Gewährleistung
    { k: 12, status: "Geschlossen", art: "Mangel", kanal: "E-Mail", quelle: "backoffice", prioritaet: "Normal", gemeldet: -60, fc: "HOL-04", produkt_name: "Bett Polster 180", marke: "Walter Knoll", lieferant: "Walter Knoll", uebergabe: -760, kundenwunsch: "Verbesserung", beschreibung: "Bettrahmen knarrt bei Bewegung.", bild: BILD.bett, erstreaktion: -60, mangel_bestaetigt: "Ja", ursache: "Verarbeitung", entscheidung: "Verbesserung", entscheidung_begruendung: "Verbindungen nachgezogen, Filzgleiter ergänzt.", erledigt: -45, geschlossen: -40, abschlussbericht: "Nachgezogen, kein Geräusch mehr.", informiert: -45, regress: "verrechnet" },
    // 14 Abgelehnt · Bedienungsfehler
    { k: 13, status: "Abgelehnt", art: "Mangel", kanal: "Showroom", quelle: "backoffice", prioritaet: "Niedrig", gemeldet: -18, fc: "STN-02", produkt_name: "Waschtisch Marmor", marke: "Ezarri", lieferant: "Ezarri", uebergabe: -330, kundenwunsch: "Austausch", beschreibung: "Matte Flecken auf der Marmorplatte.", bild: BILD.bad, erstreaktion: -18, mangel_bestaetigt: "Nein", ursache: "Bedienung", entscheidung: "Abgelehnt", ablehnungsgrund: "Bedienungsfehler", entscheidung_begruendung: "Säurehaltiges Reinigungsmittel verwendet; Pflegehinweis und Aufarbeitung angeboten.", abschlussbericht: "Abgelehnt, Pflegeangebot gesendet." },
  ];
}

const ERSATZTEILE = [
  { bezeichnung: "Scharnier 110° mit Dämpfung", hersteller_nr: "71B3550", kategorie: "Scharnier", marke: "Walter Knoll", bestand: 12, reserviert: 2, mindestbestand: 6, lagerplatz: "R2-F3", ek_cent: 900, vk_cent: 1900 },
  { bezeichnung: "Führungsschiene Auszug 500 mm", hersteller_nr: "TANDEM-550H", kategorie: "Auszug", marke: "Poliform", bestand: 0, reserviert: 0, mindestbestand: 2, lagerplatz: "R2-F1", ek_cent: 2400, vk_cent: 4900 },
  { bezeichnung: "Leuchtmittel LED 2700 K", hersteller_nr: "8812-W", kategorie: "Leuchtmittel", marke: "Flos", bestand: 1, reserviert: 1, mindestbestand: 2, lagerplatz: "R1-F1", ek_cent: 1500, vk_cent: 2900 },
  { bezeichnung: "LED-Trafo 24 V 60 W", hersteller_nr: "TR-24-60", kategorie: "Elektro", marke: "Ezarri", bestand: 3, reserviert: 1, mindestbestand: 2, lagerplatz: "R1-F2", ek_cent: 3200, vk_cent: 5900 },
  { bezeichnung: "Polster-Reparaturset Leder", hersteller_nr: "PS-LED-01", kategorie: "Polster", marke: "Cassina", bestand: 4, reserviert: 0, mindestbestand: 2, lagerplatz: "R3-F2", ek_cent: 4000, vk_cent: 7900 },
  { bezeichnung: "Gleiter Filz 30 mm (8 Stück)", hersteller_nr: "GL-30F", kategorie: "Beschlag", marke: "Vitra", bestand: 25, reserviert: 0, mindestbestand: 10, lagerplatz: "R3-F4", ek_cent: 300, vk_cent: 900 },
  { bezeichnung: "Dichtung Whirlpool-Pumpe", hersteller_nr: "WP-D-200", kategorie: "Dichtung", marke: "Ezarri", bestand: 1, reserviert: 0, mindestbestand: 3, lagerplatz: "R4-F1", ek_cent: 1200, vk_cent: 2500, status: "Auslaufend" },
  { bezeichnung: "Fernbedienung Relaxsessel", hersteller_nr: "RC-RX-4", kategorie: "Steuerung", marke: "Vitra", bestand: 2, reserviert: 0, mindestbestand: 1, lagerplatz: "R1-F3", ek_cent: 5500, vk_cent: 9900 },
  { bezeichnung: "Lederpflege-Set", hersteller_nr: "LP-SET", kategorie: "Pflegemittel", marke: "Cassina", bestand: 0, reserviert: 0, mindestbestand: 0, lagerplatz: "", ek_cent: 1800, vk_cent: 3900, produkt: "lederpflege-set", bestand_fuehren: 0 },
  { bezeichnung: "Rahmenverbinder Outdoor", hersteller_nr: "OUT-RV-12", kategorie: "Beschlag", marke: "Minotti", bestand: 6, reserviert: 0, mindestbestand: 4, lagerplatz: "R5-F2", ek_cent: 2100, vk_cent: 4200 },
];

/**
 * Nachlauf nach dem Grundaufbau (Bezüge zwischen DocTypes, Leer-/Fehlerfälle). Eigener Zufall über hilfe.rng.
 * @param {Map<string, Map<string, object>>} db
 * @param {import("./index.js").SeedHilfe} hilfe
 */
export const SEED_VERSION = "b-ser-1";

export default function nachlauf(db, hilfe) {
  db.__serviceSeed = SEED_VERSION;
  const T = (dt) => {
    const t = hilfe.tabelle(dt);
    t.clear();
    return t;
  };
  const stempel = (doc, offset = -1) => {
    const z = isoDatumZeit(tage(offset, null));
    return Object.assign(doc, { owner: BEARBEITER, creation: doc.creation || z, modified: z, modified_by: BEARBEITER, docstatus: 0, idx: 0 });
  };
  const name = (dt, doc, datum = tage(0)) => hilfe.neuerName(hilfe.index.doctypes.get(dt), doc, hilfe.naechste, datum);
  const kontakte = hilfe.kontakte || [];
  const projekte = [...(hilfe.tabelle("PH Projekt").values())];
  const rechnungen = [...(hilfe.tabelle("PH Rechnung").values())];
  const lieferscheine = [...(hilfe.tabelle("PH Lieferschein").values())];

  // Techniker als Benutzer (ohne Anmeldung, nur Planung/Anzeige).
  const users = hilfe.tabelle("User");
  for (const t of TECHNIKER.slice(1)) {
    if (users.has(t.email)) continue;
    users.set(t.email, stempel({ doctype: "User", name: t.email, email: t.email, full_name: t.name, first_name: t.name.split(" ")[0], last_name: t.name.split(" ").slice(1).join(" "), enabled: 1, user_type: "System User", roles: [{ doctype: "Has Role", role: "PH Techniker", idx: 1, parentfield: "roles", parenttype: "User" }] }, -200));
  }

  // Fehlerkatalog (install.py) + „-99 Sonstiges“ je Bereich.
  const bereiche = T("PH Fehlerbereich");
  const codes = T("PH Fehlercode");
  for (const [code, bezeichnung, beschreibung, sortierung] of FEHLERBEREICHE) {
    bereiche.set(code, stempel({ doctype: "PH Fehlerbereich", name: code, code, bezeichnung, beschreibung, sortierung, aktiv: 1 }, -300));
  }
  let sort = 0;
  for (const [code, bereich, bezeichnung, gruppe, lr, ursache, loesung] of FEHLERCODES) {
    sort += 1;
    codes.set(code, stempel({ doctype: "PH Fehlercode", name: code, code, bereich, bezeichnung, titel: `${code} ${bezeichnung}`, gruppe, lieferantenrelevant: lr, aktiv: 1, typische_ursache: ursache, standardloesung: loesung, pruefhinweis: "", kundentext: "", standard_entscheidung: "", anzahl_faelle: 0, sortierung: sort * 10 }, -300));
  }
  for (const [code, bezeichnung] of FEHLERBEREICHE) {
    const c = `${code}-99`;
    codes.set(c, stempel({ doctype: "PH Fehlercode", name: c, code: c, bereich: code, bezeichnung: `Sonstiges (${bezeichnung})`, titel: `${c} Sonstiges`, gruppe: "Sonstiges", lieferantenrelevant: 0, aktiv: 1, typische_ursache: "", standardloesung: "", pruefhinweis: "", kundentext: "", standard_entscheidung: "", anzahl_faelle: 0, sortierung: 990 }, -300));
  }
  // Wissen am Code (Prüfhinweis, Kundentext) für die häufigen Codes.
  Object.assign(codes.get("POL-03"), { pruefhinweis: "Naht auf Spannung prüfen, Bezug nicht auftrennen. Fotos von Naht und Etikett.", kundentext: "Wir lassen die Naht durch unsere Polsterei nacharbeiten.", standard_entscheidung: "Verbesserung" });
  Object.assign(codes.get("MEC-01"), { pruefhinweis: "Scharnierart und Dämpfung notieren, Tür ausgehängt prüfen.", kundentext: "Wir stellen das Scharnier nach oder tauschen es.", standard_entscheidung: "Verbesserung" });
  Object.assign(codes.get("OBF-03"), { pruefhinweis: "Stelle fotografieren, Lackschicht und Kante prüfen.", kundentext: "Wir melden den Lackfehler dem Hersteller und tauschen die Front.", standard_entscheidung: "Austausch" });

  // Ersatzteile
  const teile = T("PH Ersatzteil");
  const teilNamen = [];
  ERSATZTEILE.forEach((t, i) => {
    const doc = { doctype: "PH Ersatzteil", naming_series: "PH-ET-.#####", titel: t.bezeichnung, status: t.status || "Aktiv", lieferant: t.marke, produkt: t.produkt || "", bestand_fuehren: t.bestand_fuehren ?? 1, einheit: "Stück", lieferzeit_tage: 10, beschreibung: "", passend_fuer: "", lagerort: "", bild: "", bewegungen: [], ...t };
    doc.verfuegbar = Math.max(0, (doc.bestand || 0) - (doc.reserviert || 0));
    doc.name = name("PH Ersatzteil", doc);
    doc.bewegungen = doc.bestand_fuehren ? [{ doctype: "PH Ersatzteil Bewegung", idx: 1, parentfield: "bewegungen", parenttype: "PH Ersatzteil", datum: d(-90 + i), art: "Zugang", menge: doc.bestand + (doc.reserviert || 0), hinweis: "Anfangsbestand" }] : [];
    teile.set(doc.name, stempel(doc, -30 + i));
    teilNamen.push(doc.name);
  });

  // Servicefälle
  const faelleT = T("PH Servicefall");
  const angelegt = [];
  faelle().forEach((f, i) => {
    const kunde = KUNDEN[f.k];
    const kontakt = kontakte[(i * 3) % Math.max(1, kontakte.length)]?.name || "";
    const fcDoc = f.fc ? codes.get(f.fc) : null;
    const typ = kunde.unternehmer ? "Unternehmer" : "Verbraucher";
    const gemeldet = dz(f.gemeldet, ["08:40", "09:12", "10:05", "11:30", "14:20", "15:45"][i % 6]);
    const fr = fristen({ uebergabe: d(f.uebergabe), kundentyp: typ, heute: d(0), erledigt_am: f.erledigt !== undefined ? d(f.erledigt) : null });
    const [plz, ...ortTeile] = kunde.ort.split(" ");
    const doc = {
      doctype: "PH Servicefall",
      naming_series: "PH-SRV-.YYYY.-.#####",
      titel: `${f.art}: ${kunde.name} – ${f.produkt_name}`,
      art: f.art,
      status: f.status,
      workflow_state: `PH ${f.status}`,
      prioritaet: f.prioritaet,
      kundenwunsch: f.kundenwunsch,
      gemeldet_am: gemeldet,
      kanal: f.kanal,
      quelle: f.quelle,
      verantwortlich: i % 4 === 3 ? "admin@demo.local" : BEARBEITER,
      frist_reaktion: reaktionsfrist(gemeldet, typ === "Unternehmer" ? 1 : 2),
      erstreaktion_am: f.ohneErstreaktion ? "" : f.erstreaktionTelefon ? gemeldet : dz(f.erstreaktion ?? f.gemeldet, "11:00"),
      erstreaktion_kanal: f.ohneErstreaktion ? "" : f.erstreaktionTelefon ? "Telefon" : f.kanal === "Showroom" ? "Vor Ort" : f.kanal === "Telefon" ? "Telefon" : "E-Mail",
      erstreaktion_notiz: "",
      frist_loesung: d(f.gemeldet + (f.prioritaet === "Hoch" ? 14 : f.prioritaet === "Niedrig" ? 42 : 28)),
      sla_status: f.status === "Geschlossen" || f.status === "Erledigt" ? "Erfuellt" : i === 5 ? "Gefaehrdet" : "Im Plan",
      sla_reaktion_verletzt: 0,
      sla_loesung_verletzt: 0,
      kontakt,
      kunde_name: kunde.name,
      kundentyp: typ,
      kunde_email: kunde.email,
      kunde_telefon: kunde.telefon,
      sprache: "de",
      einsatz_strasse: kunde.strasse,
      einsatz_plz: plz,
      einsatz_ort: ortTeile.join(" "),
      einsatz_land: /Lindau/.test(kunde.ort) ? "Deutschland" : /St\. Gallen|Kreuzlingen/.test(kunde.ort) ? "Schweiz" : "Österreich",
      projekt: f.projekt && projekte[0] ? projekte[0].name : "",
      rechnung: rechnungen[i % Math.max(1, rechnungen.length)]?.name || "",
      lieferschein: lieferscheine[i % Math.max(1, lieferscheine.length)]?.name || "",
      produkt_name: f.produkt_name,
      marke: f.marke,
      lieferant: f.lieferant,
      seriennummer: i % 3 === 0 ? `SN-${2400 + i * 17}` : "",
      menge: 1,
      fehlerbereich: fcDoc?.bereich || "",
      fehlercode: f.fc || "",
      fehlercode_bezeichnung: fcDoc?.bezeichnung || "",
      lieferantenrelevant: fcDoc ? fcDoc.lieferantenrelevant : f.art === "Transportschaden" ? 1 : 0,
      erstauftreten: f.erstauftreten !== undefined ? d(f.erstauftreten) : "",
      ort_am_stueck: f.ort_am_stueck || "",
      reproduzierbar: 1,
      standardloesung: fcDoc?.standardloesung || "",
      beschreibung: f.beschreibung,
      kaufdatum: d(f.uebergabe - 30),
      uebergabe_datum: d(f.uebergabe),
      uebergabe_quelle: f.projekt ? "Montageabnahme" : "Lieferschein (zugestellt)",
      sachart: "Beweglich",
      lieferung_an_haendler: d(f.uebergabe - 20),
      garantie_monate: i === 8 ? 36 : 0,
      gewaehrleistung_bis: fr.gewaehrleistung_bis,
      beweislast_bis: fr.beweislast_bis,
      verjaehrung_bis: fr.verjaehrung_bis,
      garantie_bis: i === 8 ? fristen({ uebergabe: d(f.uebergabe), garantie_monate: 36, heute: d(0) }).garantie_bis : "",
      regress_frist_bis: fr.regress_frist_bis || "",
      fristen_status: fr.status,
      mangel_bestaetigt: f.mangel_bestaetigt || "Offen",
      ursache: f.ursache || "",
      pruefergebnis: f.pruefergebnis || "",
      entscheidung: f.entscheidung || "",
      entschieden_von: f.entscheidung ? BEARBEITER : "",
      entschieden_am: f.entscheidung ? dz(f.gemeldet + 2, "10:00") : "",
      entscheidung_begruendung: f.entscheidung_begruendung || "",
      kulanz_freigabe_noetig: f.kulanz_freigabe_noetig || 0,
      kulanz_freigabe_status: f.kulanz_freigabe_status || "Nicht noetig",
      kulanz_angefordert_am: f.kulanz_angefordert !== undefined ? dz(f.kulanz_angefordert, "09:12") : "",
      kulanz_cent: f.kulanz_cent || 0,
      kulanz_abgelehnt_cent: f.kulanz_abgelehnt_cent || 0,
      kulanz_freigabe_kommentar: f.kulanz_freigabe_kommentar || "",
      preisminderung_cent: 0,
      ablehnungsgrund: f.ablehnungsgrund || "",
      abschlussbericht: f.abschlussbericht || "",
      erledigt_am: f.erledigt !== undefined ? dz(f.erledigt, "16:00") : "",
      geschlossen_am: f.geschlossen !== undefined ? dz(f.geschlossen, "10:00") : "",
      dauer_tage: f.erledigt !== undefined ? f.erledigt - f.gemeldet : 0,
      kunde_informiert_am: f.informiert !== undefined ? dz(f.informiert, "09:30") : "",
      abnahme_bestaetigt: 0,
      portal_sichtbar: f.portal_sichtbar ?? (f.quelle === "website" ? 0 : 1),
      referenz_website: f.referenz_website || "",
      kosten_intern_cent: f.kosten_intern_cent || 0,
      kosten_extern_cent: f.kosten_extern_cent || 0,
      kosten_kulanz_cent: 0,
      kosten_gesamt_cent: (f.kosten_intern_cent || 0) + (f.kosten_extern_cent || 0),
      regress_status: f.regress ? (f.regress === "verrechnet" ? "Verrechnet" : "Gemeldet") : "Kein Regress",
      regress_gefordert_cent: f.regress ? f.kosten_extern_cent || 0 : 0,
      eskalationsstufe: i === 0 ? 1 : 0,
      sla_eskalationsstufe: 0,
      letzte_bewegung: dz(Math.min(0, f.gemeldet + 1), "12:00"),
      notiz_intern: i === 5 ? "Kundin seit 2019, mehrere Projekte." : "",
      fotos: [foto(f.bild, "Stück beim Kunden (Übergabe)", "Intern", d(f.uebergabe)), ...(i % 2 === 0 ? [foto(f.bild, "Foto der Kundin bzw. des Kunden", "Kunde", d(f.gemeldet))] : [])].map((x, j) => ({ doctype: "PH Servicefall Foto", idx: j + 1, parentfield: "fotos", parenttype: "PH Servicefall", ...x })),
      ersatzteile: [],
      kosten: [],
      verlauf: [],
    };
    doc.name = name("PH Servicefall", doc, tage(f.gemeldet));
    // Verlauf (menschliche Texte, Zeit aufsteigend)
    const v = [verlauf(gemeldet, "Status", "Gemeldet", `Gemeldet über ${f.kanal}`)];
    if (doc.erstreaktion_am) v.push(verlauf(doc.erstreaktion_am, "Kommunikation", "Gemeldet", f.erstreaktionTelefon ? "Telefonat bei Meldung – Kunde gilt als kontaktiert" : "Eingangsbestätigung gesendet (Vorlage eingang)"));
    const reihe = ["Geprueft", "Entscheidung", "In Bearbeitung", "Einsatz geplant", "Erledigt", "Geschlossen"];
    const ziel = reihe.indexOf(f.status === "Abgelehnt" ? "Entscheidung" : f.status);
    reihe.slice(0, ziel + 1).forEach((s, j) => {
      if (s === "Einsatz geplant" && f.status !== "Einsatz geplant") return;
      v.push(verlauf(dz(Math.min(0, f.gemeldet + 1 + j), "10:00"), "Status", s, `Status auf ${s === "Geprueft" ? "Geprüft" : s === "Entscheidung" ? "Entschieden" : s} gesetzt`));
    });
    if (f.kulanz_freigabe_status === "Angefordert") v.push(verlauf(doc.kulanz_angefordert_am, "Kulanz", "Entscheidung", `Kulanz über ${f.kulanz_cent / 100} € angefordert`));
    if (f.kulanz_freigabe_status === "Abgelehnt") v.push(verlauf(dz(-3, "15:10"), "Kulanz", "Entscheidung", "Kulanz von der Leitung abgelehnt", "admin@demo.local"));
    if (f.informiert !== undefined) v.push(verlauf(doc.kunde_informiert_am, "Kommunikation", "Erledigt", "Abschluss mitgeteilt (Vorlage abschluss)"));
    if (f.status === "Abgelehnt") v.push(verlauf(dz(f.gemeldet + 4, "11:00"), "Status", "Abgelehnt", "Abgelehnt: Bedienungsfehler", "admin@demo.local"));
    doc.verlauf = v.map((x, j) => ({ doctype: "PH Servicefall Verlauf", idx: j + 1, parentfield: "verlauf", parenttype: "PH Servicefall", ...x }));
    doc.ersatzteile = (f.teile || []).map((t, j) => {
      const teil = teile.get(teilNamen[t.i]);
      return { doctype: "PH Servicefall Ersatzteil", idx: j + 1, parentfield: "ersatzteile", parenttype: "PH Servicefall", ersatzteil: teil.name, bezeichnung: teil.bezeichnung, hersteller_nr: teil.hersteller_nr, menge: t.menge, status: t.status, bestellung: "", ek_cent: teil.ek_cent, kostentraeger: "Gewaehrleistung" };
    });
    faelleT.set(doc.name, stempel(doc, f.gemeldet));
    angelegt.push(doc);
  });

  // Einsätze (heute, diese Woche, Vergangenheit; inkl. umgeplant, unterwegs, Pflege)
  const einsaetze = T("PH Serviceeinsatz");
  const E = (fallIdx, werte) => {
    const fall = fallIdx === null ? null : angelegt[fallIdx];
    const doc = {
      doctype: "PH Serviceeinsatz",
      naming_series: "PH-SRE-.YYYY.-.#####",
      art: "Reparatur",
      servicefall: fall?.name || "",
      pflege_abo: "",
      kontakt: fall?.kontakt || kontakte[0]?.name || "",
      kunde_name: fall?.kunde_name || "",
      techniker: TECHNIKER[0].email,
      techniker_2: "",
      strasse: fall?.einsatz_strasse || "",
      plz: fall?.einsatz_plz || "",
      ort: fall?.einsatz_ort || "",
      land: fall?.einsatz_land || "Österreich",
      anfahrt_km: 18,
      anfahrt_min: 25,
      hinweis_intern: "",
      mitzubringen: "",
      bestaetigt_kunde_am: "",
      umgeplant_am: "",
      ergebnis: "",
      bericht: "",
      unterschrift_art: "",
      zeit_arbeit_min: 0,
      zeit_pause_min: 0,
      zeit_abrechenbar_min: 0,
      ersatzteile: [],
      fotos: [],
      ...werte,
    };
    doc.titel = doc.titel || `${doc.art}: ${doc.kunde_name}${fall ? ` – ${fall.produkt_name}` : ""}`;
    doc.name = name("PH Serviceeinsatz", doc);
    einsaetze.set(doc.name, stempel(doc, -2));
    return doc;
  };
  const e9 = E(8, { status: "Bestaetigt", datum: d(2), zeit_von: "08:00:00", zeit_bis: "10:00:00", bestaetigt_kunde_am: dz(-2, "16:00"), mitzubringen: "LED-Trafo 24 V, LED-Band 1,2 m", hinweis_intern: "Spiegelschrank vorsichtig aushängen." });
  E(9, { status: "Erledigt", art: "Austausch", datum: d(-3), zeit_von: "13:00:00", zeit_bis: "14:30:00", bestaetigt_kunde_am: dz(-6, "10:00"), ankunft: dz(-3, "13:05"), abfahrt: dz(-3, "14:20"), zeit_arbeit_min: 75, zeit_abrechenbar_min: 75, ergebnis: "Behoben", bericht: "Glasplatte getauscht, Einschluss nicht mehr vorhanden.", unterschrift_art: "Unterschrift", unterschrift_name: KUNDEN[9].name, unterschrift_am: dz(-3, "14:18") });
  E(3, { status: "Geplant", art: "Besichtigung", datum: d(0), zeit_von: "14:00:00", zeit_bis: "15:00:00", techniker: TECHNIKER[1].email, mitzubringen: "Scharnier 110° mit Dämpfung" });
  E(0, { status: "Unterwegs", art: "Besichtigung", datum: d(0), zeit_von: "09:30:00", zeit_bis: "10:30:00", bestaetigt_kunde_am: dz(-1, "17:00"), titel: `Besichtigung: ${KUNDEN[0].name} – Sofa Modul 240` });
  E(4, { status: "Geplant", art: "Reparatur", datum: d(1), zeit_von: "10:00:00", zeit_bis: "12:00:00", techniker: TECHNIKER[1].email, umgeplant_am: dz(-1, "15:30") });
  E(7, { status: "Geplant", art: "Reparatur", datum: d(3), zeit_von: "08:00:00", zeit_bis: "11:00:00", techniker: TECHNIKER[2].email, mitzubringen: "Führungsschiene Auszug 500 mm (bestellt)" });
  E(10, { status: "Erledigt", art: "Reparatur", datum: d(-8), zeit_von: "09:00:00", zeit_bis: "11:00:00", techniker: TECHNIKER[2].email, bestaetigt_kunde_am: dz(-12, "09:00"), ankunft: dz(-8, "09:10"), abfahrt: dz(-8, "10:40"), zeit_arbeit_min: 90, zeit_abrechenbar_min: 90, ergebnis: "Behoben", bericht: "Beschlag getauscht.", unterschrift_art: "Name bestätigt", unterschrift_name: KUNDEN[10].name });
  E(1, { status: "Nicht angetroffen", art: "Besichtigung", datum: d(-1), zeit_von: "16:00:00", zeit_bis: "17:00:00", techniker: TECHNIKER[1].email, bericht: "Niemand da, Nachricht hinterlassen." });

  // Ersatzteilbestellungen
  const bestellungen = T("PH Ersatzteilbestellung");
  const B = (werte) => {
    const doc = { doctype: "PH Ersatzteilbestellung", naming_series: "PH-ETB-.YYYY.-.#####", kostentraeger: "Gewaehrleistung", bestellweg: "E-Mail", gesendet_am: "", gesendet_an: "", lieferant_referenz: "", erwartet_am: "", geliefert_am: "", ueberfaellig: 0, notizen: "", lieferadresse: "Lager", kommission: "", servicefall: "", ...werte };
    doc.summe_ek_cent = doc.positionen.reduce((s, p) => s + p.ek_cent * p.menge, 0);
    doc.titel = doc.titel || `${doc.lieferant}: ${doc.positionen.map((p) => p.bezeichnung).join(", ")}`;
    doc.name = name("PH Ersatzteilbestellung", doc);
    bestellungen.set(doc.name, stempel(doc, -5));
    return doc;
  };
  const pos = (i, menge, extra = {}) => {
    const t = teile.get(teilNamen[i]);
    return { doctype: "PH Ersatzteilbestellung Position", parentfield: "positionen", parenttype: "PH Ersatzteilbestellung", idx: 1, ersatzteil: t.name, bezeichnung: t.bezeichnung, hersteller_nr: t.hersteller_nr, menge, menge_erhalten: 0, ek_cent: t.ek_cent, ...extra };
  };
  B({ status: "Entwurf", lieferant: "Poliform", datum: d(0), positionen: [pos(1, 2)], notizen: "Für Lager nachbestellen." });
  B({ status: "Teilgeliefert", lieferant: "Ezarri", datum: d(-12), servicefall: angelegt[8].name, kommission: angelegt[8].kunde_name, gesendet_am: dz(-12, "11:00"), gesendet_an: "service@ezarri.beispiel.invalid", lieferant_referenz: "AB-77812", erwartet_am: d(-2), positionen: [pos(3, 1, { menge_erhalten: 1, eingetroffen_am: d(-4) }), { ...pos(6, 2), idx: 2 }], kostentraeger: "Gewaehrleistung", lieferadresse: "Showroom" });
  B({ status: "Bestaetigt", lieferant: "Flos", datum: d(-15), gesendet_am: dz(-15, "09:00"), gesendet_an: "ersatzteile@flos.beispiel.invalid", lieferant_referenz: "FL-2026-4410", erwartet_am: d(-3), ueberfaellig: 1, positionen: [pos(2, 4)], kostentraeger: "Lager" });

  // Regresse
  const regresse = T("PH Lieferantenregress");
  const R = (fallIdx, werte) => {
    const fall = angelegt[fallIdx];
    const doc = { doctype: "PH Lieferantenregress", naming_series: "PH-REG-.YYYY.-.#####", servicefall: fall.name, lieferant: fall.lieferant, marke: fall.marke, beschreibung: fall.beschreibung, frist_hinweis: "", kosten: [], betrag_anerkannt_cent: 0, betrag_erhalten_cent: 0, differenz_cent: 0, quote_promille: 0, abgleich_status: "Offen", form: "Gutschrift", mahnstufe: 0, ...werte };
    doc.workflow_state = `PH Regress ${String(doc.status).toLowerCase()}`;
    doc.titel = `Regress ${fall.kunde_name} – ${fall.lieferant}`;
    doc.name = name("PH Lieferantenregress", doc);
    regresse.set(doc.name, stempel(doc, -4));
    return doc;
  };
  R(11, { status: "Gemeldet", gemeldet_am: d(-9), frist_bis: d(51), betrag_gefordert_cent: 120000, lieferant_referenz: "MIN-RK-2210" });
  R(12, { status: "Verrechnet", gemeldet_am: d(-44), frist_bis: d(15), betrag_gefordert_cent: 38000, betrag_anerkannt_cent: 38000, betrag_erhalten_cent: 38000, abgleich_status: "Ausgeglichen", quote_promille: 1000, gutschrift_nummer: "GU-WK-5512", gutschrift_datum: d(-20), verrechnet_am: d(-20) });
  const unterdeckung = R(4, { status: "Anerkannt", gemeldet_am: d(-5), frist_bis: d(9), betrag_gefordert_cent: 120000, betrag_anerkannt_cent: 120000, betrag_erhalten_cent: 90000, differenz_cent: -30000, abgleich_status: "Unterdeckung", quote_promille: 750, gutschrift_nummer: "GU-PF-1180", gutschrift_datum: d(-1), antwort_lieferant: "Anerkannt, Teilgutschrift wegen Montageanteil." });
  void unterdeckung;

  // Pflege- und Wartungsverträge
  const pflege = T("PH Pflege Abo");
  const P = (k, werte) => {
    const kunde = KUNDEN[k];
    const doc = { doctype: "PH Pflege Abo", naming_series: "PFL-.YYYY.-.#####", kontakt: kontakte[k]?.name || kontakte[0]?.name || "", kunde_name: kunde.name, kontakt_email: kunde.email, berater: BEARBEITER, techniker: TECHNIKER[0].email, strasse: kunde.strasse, plz: kunde.ort.split(" ")[0], ort: kunde.ort.split(" ").slice(1).join(" "), land: "Österreich", erinnerung_tage_vorher: 42, automatisch_einplanen: 1, stuecke: [], protokolle: [], abrechnung: "Je Termin", mindestlaufzeit_monate: 12, kuendigungsfrist_monate: 3, quelle: "backoffice", portal_sichtbar: 1, notizen: "", ...werte };
    doc.workflow_state = `PH ${doc.status}`;
    doc.titel = `${doc.art} ${doc.bereich}: ${kunde.name}`;
    doc.name = name("PH Pflege Abo", doc);
    pflege.set(doc.name, stempel(doc, -10));
    return doc;
  };
  P(0, { status: "Aktiv", art: "Pflege Jahres-Abo", bereich: "Leder", intervall_monate: 12, startdatum: d(-400), vertragsbeginn: d(-400), naechster_termin: d(-6), letzte_wartung: d(-370), ueberfaellig: 1, preis_cent: 24000, bedingungen_version: "Pflege 2025-1", leistungen: "Reinigung, Pflege und Imprägnierung aller Lederflächen.", nachkauf_einwilligung: 1, nachkauf_einwilligung_am: dz(-400, "10:00"), nachkauf_textversion: "Nachkauf 2025-1", protokolle: [{ doctype: "PH Pflege Abo Protokoll", idx: 1, parentfield: "protokolle", parenttype: "PH Pflege Abo", datum: d(-370), leistungen: "Reinigung und Pflege Ledersofa, Sessel.", durchgefuehrt_von: TECHNIKER[0].email, im_portal: 1 }] });
  P(13, { status: "Aktiv", art: "Wartungsvertrag", bereich: "Whirlpool", intervall_monate: 6, startdatum: d(-200), vertragsbeginn: d(-200), naechster_termin: d(24), letzte_wartung: d(-160), ueberfaellig: 0, preis_cent: 0, bedingungen_version: "Wartung 2025-2", leistungen: "Filter, Pumpe, Dichtungen, Wasserwerte.", nachkauf_einwilligung: 0, nachkauf_widerrufen_am: dz(-30, "09:00"), techniker: TECHNIKER[1].email });
  P(5, { status: "Angeboten", art: "Pflege einmalig", bereich: "Holz", intervall_monate: 0, naechster_termin: "", preis_cent: 18000, bedingungen_version: "", leistungen: "Ölpflege Esstisch und Bänke.", nachkauf_einwilligung: 0 });

  // Serviceaufträge
  const auftraege = T("PH Serviceauftrag");
  const A = (k, werte) => {
    const kunde = KUNDEN[k];
    const doc = { doctype: "PH Serviceauftrag", naming_series: "PH-SA-.YYYY.-.#####", kontakt: kontakte[k]?.name || kontakte[0]?.name || "", kunde_name: kunde.name, strasse: kunde.strasse, plz: kunde.ort.split(" ")[0], ort: kunde.ort.split(" ").slice(1).join(" "), land: "Österreich", positionen: [], notizen: "", ...werte };
    doc.workflow_state = `PH ${doc.status}`;
    doc.titel = `${doc.art}: ${kunde.name}`;
    doc.name = name("PH Serviceauftrag", doc);
    auftraege.set(doc.name, stempel(doc, -8));
    return doc;
  };
  const stueck = (bez, zustand, i) => ({ doctype: "PH Serviceauftrag Position", idx: i, parentfield: "positionen", parenttype: "PH Serviceauftrag", bezeichnung: bez, menge: 1, zustand });
  A(11, { status: "Eingelagert", art: "Winterlager", abholung_am: d(-20), einlagerung_von: d(-20), einlagerung_bis: d(150), rueckgabe_am: d(150), preis_cent: 38000, leistungen: "Reinigung, Einlagerung bis April, Rücklieferung.", positionen: [stueck("Outdoor-Lounge Modul links", "gut, leichte Kratzer an Fuß", 1), stueck("Outdoor-Lounge Modul rechts", "gut", 2), stueck("Couchtisch Teak", "Vergrauung", 3)] });
  A(6, { status: "Angefragt", art: "Reinigung", preis_cent: 0, leistungen: "Polsterreinigung Sofa vor Ort." });
  A(12, { status: "Beauftragt", art: "Aufarbeitung", abholung_am: d(5), preis_cent: 65000, leistungen: "Esstisch abschleifen und neu ölen." });

  // Einsatz für die Akte des Pflegevertrags (Wartung, nächste Woche)
  E(null, { status: "Geplant", art: "Wartung", datum: d(6), zeit_von: "09:00:00", zeit_bis: "11:00:00", techniker: TECHNIKER[1].email, pflege_abo: [...pflege.values()][1].name, kunde_name: KUNDEN[13].name, strasse: KUNDEN[13].strasse, plz: "6911", ort: "Lochau", titel: `Wartung Whirlpool: ${KUNDEN[13].name}` });
  void e9;
}
