// Mock-Seed – Bereich Personal (G-01, MASTER § 3.5). Schreibt: Team B-PER.
// anzahl: Datensätze je DocType · kern: Fachwissen je DocType (Verteilung, Bezüge, Titel) nach der
// generischen Erzeugung · default: Nachlauf (db, hilfe) nach dem Grundaufbau, Reihenfolge über `nach`.
// Keine echten Personen, E-Mails @beispiel.invalid, runde Beispielbeträge (Q-A3). Zufall nur über `r`
// (fester Startwert); Reihenfolge der r-Aufrufe nicht ändern, sonst verschieben sich alle Folgedaten.
//
// Der Nachlauf ersetzt die generischen Personal-Datensätze durch einen festen Bestand (Konzept § 13.5 Schritt 1):
// 10 Stellen (8 aus dem Import vom 03.11.2026 mit KV-Mindestentgelt, Entscheidung Nr. 47) in jedem Status,
// 25 Bewerbungen in jedem Status (2 mit gelöschten Personendaten, 1 ohne Unterlagen, Löschuhr, Aufbewahrung),
// 8 Gespräche (heute, vorbei ohne Ergebnis, abgesagt, nicht erschienen), 14 Mitarbeiter (Leitung mit eigenem
// Datensatz, Lehrling, Karenz, Ausgetreten, Eintritt in 10 Tagen), Buchungen ab 01.10. (offen heute, Gehen fehlt
// gestern, korrigiert, Korrektur beantragt, > 10 h, Pause vorgeschlagen), 16 Abwesenheiten und 3 Krankmeldungen.
// Bezugstag 04.11.2026 (basis.tage). Läuft auch nachträglich im laufenden Dev-Server (lib/backoffice/personal/daten.js).

import { isoDatum, isoDatumZeit } from "../../format.js";
import { tage } from "./basis.js";

/** Nachläufe anderer Bereiche, die vor diesem laufen müssen. */
export const nach = [];

/** Anzahl generischer Datensätze je DocType (nicht gelistete mit Status bekommen 6). */
export const anzahl = {
  "PH Bewerbung": 10,
  "PH Stelle": 5,
  "PH Mitarbeiter": 8,
};

/** Fachliche Nachbearbeitung je DocType: (doc, { i, r, ctx, person }) – ändert doc. */
export const kern = {
  "PH Bewerbung": (doc, { r, person }) => {
    doc.status = r.pick(["Eingegangen", "Eingegangen", "Gesichtet", "Gespraech", "Angebot", "Abgesagt"]);
    doc.eingang = isoDatumZeit(tage(-r.int(0, 40), r));
    doc.stelle = r.pick(["einrichtungsberatung", "planung-interior", "montage"]);
    doc.titel = `Bewerbung ${person} – ${doc.stelle}`;
    doc.workflow_state = `PH ${doc.status}`;
  },
  "PH Stelle": (doc, { i, r }) => {
    const s = [
      ["einrichtungsberatung", "Einrichtungsberatung (m/w/d)", "Verkauf"],
      ["planung-interior", "Innenarchitektur / Planung", "Planung"],
      ["montage", "Montage und Auslieferung", "Montage"],
      ["lehre-einrichtungsberatung", "Lehre Einrichtungsberatung", "Lehre"],
      ["verwaltung-teilzeit", "Verwaltung (Teilzeit)", "Verwaltung"],
    ][i] || [`stelle-${i}`, `Stelle ${i}`, "Verwaltung"];
    doc.slug = s[0];
    doc.name = s[0];
    doc.titel = s[1];
    doc.kategorie = s[2];
    doc.status = i < 3 ? "Aktiv" : r.pick(["Entwurf", "Pausiert", "Besetzt"]);
  },
  "PH Mitarbeiter": (doc, { i, r, person }) => {
    doc.status = i < 7 ? "Aktiv" : "Karenz";
    doc.titel = person;
    doc.rolle_intern = r.pick(["Verkauf", "Planung", "Montage", "Verwaltung", "Geschaeftsfuehrung"]);
    doc.eintritt = isoDatum(tage(-r.int(100, 3000)));
  },
};

// ============================================================== Festbestand ==

export const SEED_VERSION = 3;
const EINST = "PH Personal Einstellungen";
const TABELLEN = ["PH Stelle", "PH Bewerbung", "PH Bewerbungsgespraech", "PH Mitarbeiter", "PH Zeiterfassung", "PH Abwesenheit", "PH Krankmeldung", "PH Urlaubsanspruch", "PH Zeitabschluss", "PH Dienstplan"];

/** Ist der Festbestand in dieser Datenbank? */
export function istGesaet(db) {
  return Number(db?.get(EINST)?.get(EINST)?._seed_personal) === SEED_VERSION;
}

const p2 = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const tag = (n) => iso(tage(n));
const zeit = (min) => `${p2(Math.floor(min / 60))}:${p2(min % 60)}:00`;
const wochenende = (s) => {
  const d = new Date(`${s}T12:00:00`).getDay();
  return d === 0 || d === 6;
};

// 8 Stellen aus Backend-Import/ph_personal/ph_personal/daten/stellen_import.json (Stand 03.11.2026) + 2 Altfälle.
const STELLEN = [
  { titel: "CAD-Planer/in (m/w/d)", kat: "Planung", cent: 253500, kv: "KV Handel Angestellte", status: "Aktiv", bew: "Sie setzen Einrichtungs-, Küchen- und Badkonzepte in genaue Pläne um – vom Aufmaß bis zur Werk- und Montageplanung.", a: ["Grundrisse, Ansichten und Detailpläne für Küchen, Bäder und Möbel erstellen", "Entwürfe aus Handskizze und Modell in CAD-Pläne übertragen", "Aufmaß bei Kundinnen und Kunden vor Ort"], r: ["Ausbildung oder Studium in Bautechnik, Innenausbau, Tischlerei oder Innenarchitektur", "Kenntnisse in Archicad und/oder AutoCAD"] },
  { titel: "Innenarchitekt/in (m/w/d)", kat: "Planung", cent: 287900, kv: "KV Handel Angestellte", status: "Aktiv", bew: "Sie entwickeln mit unseren Kundinnen und Kunden Konzepte für Wohnräume, Küchen und Bäder.", a: ["Beratung zu Raum, Material, Licht und Möbeln", "Einrichtungskonzepte mit Skizze, Modell und 3D-Visualisierung entwerfen"], r: ["Studium oder Ausbildung in Innenarchitektur oder Interior Design", "Erfahrung in der Planung von Wohnräumen, Küchen oder Bädern"] },
  { titel: "Verkäufer/in Einrichtungsberatung (m/w/d)", kat: "Verkauf", cent: 236200, kv: "KV Handel Angestellte", status: "Aktiv", bew: "Sie beraten Besucherinnen und Besucher in unserer Ausstellung in Lochau.", a: ["Empfang und Beratung in der Ausstellung", "Angebote und Auftragsbestätigungen erstellen"], r: ["Kaufmännische Ausbildung oder Erfahrung im Verkauf", "Interesse an Design, Materialien und Wohnen"] },
  { titel: "Monteur/in mit Tischlerlehre (m/w/d)", kat: "Montage", cent: 235800, kv: "KV Handel Arbeiter:innen", status: "Aktiv", bew: "Sie montieren Küchen, Einbaumöbel und Designmöbel bei unseren Kundinnen und Kunden.", a: ["Montage von Küchen, Einbau- und Designmöbeln", "Anpassungsarbeiten vor Ort"], r: ["Abgeschlossene Lehre als Tischler/in", "Erfahrung in der Möbel- oder Küchenmontage"] },
  { titel: "Monteur/in (m/w/d)", kat: "Montage", cent: 217800, kv: "KV Handel Arbeiter:innen", status: "Aktiv", bew: "Sie liefern und montieren Möbel, Leuchten und Küchenelemente im Montageteam.", a: ["Lieferung und Aufbau von Möbeln und Leuchten", "Mitarbeit bei der Küchenmontage"], r: ["Handwerkliches Geschick und Montageerfahrung", "Sorgfältiger Umgang mit empfindlichen Oberflächen"] },
  { titel: "Fliesenleger/in (m/w/d)", kat: "Montage", cent: 235800, kv: "KV Handel Arbeiter:innen", status: "Pausiert", gueltig: -2, bew: "Sie verlegen Fliesen und Platten in Bädern, Küchen und Wellnessbereichen.", a: ["Wand- und Bodenfliesen, Platten und Mosaike verlegen", "Untergründe vorbereiten, abdichten und verfugen"], r: ["Lehre als Platten- und Fliesenleger/in", "Erfahrung im Verlegen von Fliesen und Platten"] },
  { titel: "Installateur Sanitär/Heizung", kat: "Montage", cent: 0, kv: "", status: "Entwurf", bew: "Sie installieren Sanitär- und Heizungstechnik in den Bädern, Küchen und Wellnessbereichen, die wir planen.", a: ["Sanitärobjekte, Armaturen und Leitungen installieren"], r: [] },
  { titel: "Elektroplaner/in (m/w/d)", kat: "Planung", cent: 253500, kv: "KV Handel Angestellte", status: "Aktiv", gueltig: 6, bew: "Sie planen die Elektro- und Lichtinstallation für Küchen, Bäder und Wohnräume.", a: ["Elektro- und Beleuchtungspläne erstellen", "Abstimmung mit Interior Design und Montage"], r: ["Ausbildung in Elektrotechnik", "Erfahrung in der Elektroplanung im Wohnbau"] },
  { titel: "Lehrling Einrichtungsberatung (m/w/d)", kat: "Lehre", cent: 85000, kv: "KV Handel Angestellte", status: "Besetzt", art: "Lehre", bew: "Lehre im Einzelhandel mit Schwerpunkt Einrichtungsberatung.", a: ["Mitarbeit in der Ausstellung"], r: ["Pflichtschulabschluss"] },
  { titel: "Aushilfe Inventur (m/w/d)", kat: "Verwaltung", cent: 1350, zeitraum: "Stunde", kv: "KV Handel Angestellte", status: "Archiviert", art: "Geringfuegig", bew: "Unterstützung bei der Jahresinventur.", a: ["Zählen und Erfassen von Lagerbeständen"], r: ["Genaue Arbeitsweise"] },
];

// Mitarbeiter: Demo-Benutzer bekommen ihren Datensatz (Stempeln, Mein Bereich); Namen wie die Demo-Benutzer.
const MITARBEITER = [
  { v: "Felix", n: "Probe", user: "personal@demo.local", rolle: "Verwaltung", teams: [], seit: "2021-03-01" },
  { v: "Anna", n: "Vorlage", user: "selbst@demo.local", rolle: "Verkauf", teams: ["verkauf"], seit: "2024-03-01" },
  { v: "Max", n: "Muster", user: "gf@demo.local", rolle: "Geschaeftsfuehrung", teams: [], seit: "2015-01-01", std: 40 },
  { v: "Anna", n: "Probe", user: "crm@demo.local", rolle: "Verkauf", teams: ["verkauf"], seit: "2023-09-01", art: "Teilzeit", std: 30 },
  { v: "Lukas", n: "Testner", user: "crm-leitung@demo.local", rolle: "Verkauf", teams: ["verkauf"], seit: "2019-05-01" },
  { v: "Lena", n: "Demo", user: "shop@demo.local", rolle: "Verkauf", teams: ["verkauf"], seit: "2022-02-01" },
  { v: "Paul", n: "Schema", user: "projekte@demo.local", rolle: "Planung", teams: ["planung"], seit: "2020-10-01" },
  { v: "Sophie", n: "Beispiel", user: "logistik@demo.local", rolle: "Verwaltung", teams: ["montage"], seit: "2023-04-01" },
  { v: "Tobias", n: "Beispiel", user: "montage@demo.local", rolle: "Montage", teams: ["montage"], seit: "2018-08-01", fahrzeug: 1 },
  { v: "Simon", n: "Demo", user: "service@demo.local", rolle: "Montage", teams: ["montage"], seit: "2022-06-01", fahrzeug: 1 },
  { v: "Clara", n: "Muster", user: "kundenkarte@demo.local", rolle: "Lehrling", teams: ["verkauf"], seit: "2025-09-01", art: "Lehre" },
  { v: "Julia", n: "Schema", user: "kassa-leitung@demo.local", rolle: "Verkauf", teams: ["verkauf"], seit: "2020-01-01", status: "Karenz" },
  { v: "Jonas", n: "Platzhalter", user: "", rolle: "Montage", teams: ["montage"], seit: tag(10), bewerbung: true },
  { v: "Erika", n: "Schema", user: "", rolle: "Verkauf", teams: [], seit: "2022-01-10", status: "Ausgetreten", austritt: "2026-09-30" },
];

const BEWERBER = [
  // [vorname, nachname, stelle(index), status, eingang(Tage), quelle, extra]
  ["Sarah", "Beispiel", 0, "Eingegangen", -2, "Website", {}],
  ["Lea", "Vorlage", 2, "Eingegangen", -1, "E-Mail", {}],
  ["Noah", "Demo", 3, "Eingegangen", 0, "Website", { ohneUnterlagen: true }],
  ["Hanna", "Probe", null, "Eingegangen", -6, "E-Mail", {}],
  ["Elias", "Schema", 1, "Gesichtet", -9, "LinkedIn", {}],
  ["Nina", "Testner", 4, "Gesichtet", -12, "AMS", {}],
  ["Ben", "Musterfrau", 2, "Gesichtet", -4, "Website", {}],
  ["Lisa", "Mustermann", 7, "Gesichtet", -33, "E-Mail", {}],
  ["Mira", "Test", 0, "Gespraech", -5, "Website", {}],
  ["Jonas", "Muster", 2, "Gespraech", -8, "Empfehlung", {}],
  ["Emma", "Platzhalter", 1, "Gespraech", -14, "Website", {}],
  ["Leon", "Beispiel", 3, "Angebot", -20, "E-Mail", { angebot: true }],
  ["Sofia", "Probe", 7, "Angebot", -18, "Website", { angebot: true }],
  ["Jonas", "Platzhalter", 4, "Eingestellt", -40, "AMS", { eingestellt: true }],
  ["Finn", "Vorlage", 8, "Eingestellt", -70, "Empfehlung", {}],
  ["Marie", "Schema", 0, "Abgesagt", -25, "Website", { grund: "Anderer Kandidat", entschieden: -10 }],
  ["Tim", "Demo", 2, "Abgesagt", -200, "E-Mail", { grund: "Qualifikation", entschieden: -205, frist: 9 }],
  ["Laura", "Testner", 1, "Abgesagt", -60, "Website", { grund: "Stelle besetzt", entschieden: -45, evidenz: 300 }],
  ["Moritz", "Muster", 5, "Abgesagt", -16, "Website", { grund: "Keine Rückmeldung", entschieden: -3, ohneEmail: true, versand: "Post" }],
  ["Julia", "Vorlage", 4, "Abgesagt", -30, "E-Mail", { grund: "Gehaltsvorstellung", entschieden: -20, sprache: "en" }],
  ["Anton", "Probe", 3, "Abgesagt", -50, "Website", { grund: "Qualifikation", entschieden: -33 }],
  ["Paula", "Beispiel", 2, "Zurueckgezogen", -22, "Website", { entschieden: -15 }],
  ["Luis", "Schema", 6, "Zurueckgezogen", -35, "E-Mail", { entschieden: -28 }],
  ["–", "–", 0, "Abgesagt", -260, "Website", { geloescht: true, entschieden: -250 }],
  ["–", "–", 3, "Abgesagt", -240, "E-Mail", { geloescht: true, entschieden: -230 }],
];

/**
 * Nachlauf nach dem Grundaufbau (Bezüge zwischen DocTypes, Leer-/Fehlerfälle). Eigener Zufall über hilfe.rng.
 * @param {Map<string, Map<string, object>>} db
 * @param {import("./index.js").SeedHilfe} hilfe
 */
export default function nachlauf(db, hilfe) {
  const r = hilfe.rng || { int: (a) => a, pick: (x) => x[0] };
  const t = (dt) => {
    if (!db.has(dt)) db.set(dt, new Map());
    return db.get(dt);
  };
  for (const dt of TABELLEN) t(dt).clear();
  const nr = (prefix, breite) => `${prefix}${String(hilfe.naechste(prefix)).padStart(breite, "0")}`;
  const heute = tag(0);
  const jetztStempel = isoDatumZeit(tage(0));
  const basis = (owner = "personal@demo.local", creation = jetztStempel) => ({ owner, creation, modified: creation, modified_by: owner, docstatus: 0, idx: 0 });

  // ----------------------------------------------------------- Stellen --
  const slug = (titel) => titel.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[\s–—]+/g, "-").replace(/\//g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  const stellen = STELLEN.map((s, i) => {
    const name = slug(s.titel);
    const voll = s.cent > 0 && s.kv;
    const doc = {
      doctype: "PH Stelle", name, slug: name, titel: s.titel, status: s.status, workflow_state: `PH ${s.status}`, kategorie: s.kat,
      beschaeftigungsart: s.art || "Vollzeit", positionen_anzahl: 1, start: "ab sofort", standort: "Lochau am Bodensee, Landstraße 11",
      stellenbeschreibung: s.bew, aufgaben_de: s.a.map((x, k) => ({ name: `${name}-a${k}`, idx: k + 1, responsibility: x })),
      anforderungen_de: s.r.map((x, k) => ({ name: `${name}-r${k}`, idx: k + 1, anforderungen: x })), leistungen_de: [{ name: `${name}-l0`, idx: 1, benefit: "Arbeitsort im Einrichtungsstudio in Lochau am Bodensee" }],
      arbeitszeit_de: "38,5 Stunden pro Woche", kv_mindest_brutto_cent: s.cent, entgelt_zeitraum: s.zeitraum || "Monat", kollektivvertrag: s.kv, ueberzahlung: voll ? "ja" : "", ueberzahlung_text: "",
      entgelt_vollstaendig: voll ? 1 : 0, veroeffentlicht: s.status === "Entwurf" ? "" : "2026-11-03", gueltig_bis: s.gueltig != null ? tag(s.gueltig) : s.status === "Entwurf" ? "" : "2027-01-02",
      website_url: s.status === "Aktiv" ? `/de/karriere/${name}` : "", ansprechpartner: "personal@demo.local", bewerbung_email: "bewerbung@beispiel.invalid", seo_title: "",
      titel_en: i < 3 ? s.titel.replace("Verkäufer/in Einrichtungsberatung", "Sales consultant interior").replace("Innenarchitekt/in", "Interior designer").replace("CAD-Planer/in", "CAD planner") : "",
      quelle: i < 8 ? "Import" : "Backoffice", sync_quelle: i < 8 ? "stellen_import.json" : "", beispiel: 1,
      besetzt_am: s.status === "Besetzt" ? "2025-08-15" : "", ...basis("personal@demo.local", isoDatumZeit(tage(-30 - i))),
    };
    t("PH Stelle").set(name, doc);
    return doc;
  });

  // ------------------------------------------------------- Mitarbeiter --
  const ma = [];
  MITARBEITER.forEach((m, i) => {
    const name = `PH-MA-${String(i + 1).padStart(4, "0")}`;
    const doc = {
      doctype: "PH Mitarbeiter", name, naming_series: "PH-MA-.####", titel: `${m.v} ${m.n}`, vorname: m.v, nachname: m.n, status: m.status || "Aktiv", user: m.user || "",
      rolle_intern: m.rolle, eintritt: m.seit, austritt: m.austritt || "", team_verkauf: m.teams.includes("verkauf") ? 1 : 0, team_planung: m.teams.includes("planung") ? 1 : 0, team_montage: m.teams.includes("montage") ? 1 : 0,
      fahrzeugberechtigung: m.fahrzeug || 0, fuehrerschein_klassen: m.fahrzeug ? "B, BE" : "", beschaeftigungsart: m.art || "Vollzeit", wochenstunden: m.std || 38.5, urlaubsanspruch_tage: 25,
      ueberstunden_abgeltung: "Zeitausgleich", email_dienst: m.user ? `${m.v.toLowerCase()}.${m.n.toLowerCase()}@beispiel.invalid` : "", telefon_dienst: `+43 5574 0000${p2(i + 10)}`,
      geburtsdatum: m.rolle === "Lehrling" ? "2009-04-12" : `19${80 + (i % 15)}-0${(i % 9) + 1}-1${i % 9}`, privatadresse: "Beispielweg 1, 6911 Lochau", telefon_privat: "+43 664 0000000", email_privat: "",
      notfallkontakt_name: "Kontakt Beispiel", notfallkontakt_telefon: "+43 664 0000001", notfallkontakt_beziehung: "Familie", hinweise_vertraulich: "", lohnverrechnung_personalnummer: `${100 + i}`,
      oegk_anmeldung_am: m.bewerbung ? "" : m.seit, dienstzettel_am: m.bewerbung ? "" : m.seit, datenschutzinfo_am: m.bewerbung ? "" : m.seit, unterweisung_am: m.bewerbung ? "" : m.seit,
      checkliste: [], arbeitsmittel: [], dokumente: [], arbeitszeiten: [], beispiel: 1, ...basis("personal@demo.local", isoDatumZeit(tage(-120 - i))),
    };
    t("PH Mitarbeiter").set(name, doc);
    ma.push(doc);
  });
  while (hilfe.naechste("PH-MA-") < ma.length);
  const MA = Object.fromEntries(ma.map((m) => [`${m.vorname} ${m.nachname}`, m]));

  // --------------------------------------------------- Abwesenheiten --
  const abw = [];
  const ABW = [
    ["Anna Vorlage", "Urlaub", "2026-12-22", "2026-12-31", "Beantragt", { owner: "selbst@demo.local" }],
    ["Anna Vorlage", "Zeitausgleich", "2026-10-30", "2026-10-30", "Genehmigt", { owner: "selbst@demo.local" }],
    ["Anna Vorlage", "Urlaub", "2026-08-10", "2026-08-21", "Genehmigt", { owner: "selbst@demo.local" }],
    ["Lena Demo", "Urlaub", "2026-11-23", "2026-11-27", "Beantragt", { owner: "shop@demo.local", vertretung: "Anna Probe", begruendung: "Familienbesuch" }],
    ["Lukas Testner", "Urlaub", "2026-11-02", "2026-11-06", "Genehmigt", { owner: "crm-leitung@demo.local" }],
    ["Paul Schema", "Fortbildung", "2026-11-05", "2026-11-05", "Beantragt", { owner: "projekte@demo.local", begruendung: "Lichtplanung Seminar" }],
    ["Tobias Beispiel", "Urlaub", "2026-11-16", "2026-11-20", "Genehmigt", { owner: "montage@demo.local" }],
    ["Tobias Beispiel", "Pflegefreistellung", "2026-10-20", "2026-10-20", "Genehmigt", { owner: "montage@demo.local" }],
    ["Simon Demo", "Sonderurlaub", "2026-11-13", "2026-11-13", "Beantragt", { owner: "personal@demo.local", begruendung: "Übersiedlung" }],
    ["Felix Probe", "Urlaub", "2026-12-14", "2026-12-18", "Beantragt", { owner: "personal@demo.local" }],
    ["Sophie Beispiel", "Urlaub", "2026-10-08", "2026-10-09", "Abgelehnt", { owner: "logistik@demo.local", ablehnungsgrund: "Inventurtage – bitte eine Woche später" }],
    ["Sophie Beispiel", "Zeitausgleich", "2026-11-12", "2026-11-12", "Storniert", { owner: "logistik@demo.local" }],
    ["Clara Muster", "Berufsschule", "2026-11-09", "2026-11-13", "Genehmigt", { owner: "personal@demo.local" }],
    ["Anna Probe", "Urlaub", "2026-10-28", "2026-10-30", "Genehmigt", { owner: "crm@demo.local" }],
    ["Max Muster", "Urlaub", "2026-12-21", "2026-12-23", "Genehmigt", { owner: "gf@demo.local" }],
    ["Paul Schema", "Urlaub", "2026-07-20", "2026-07-31", "Genehmigt", { owner: "projekte@demo.local" }],
  ];
  for (const [person, art, von, bis, status, x] of ABW) {
    const m = MA[person];
    const name = nr(`PH-ABW-${von.slice(0, 4)}-`, 5);
    const doc = {
      doctype: "PH Abwesenheit", name, naming_series: "PH-ABW-.YYYY.-.#####", titel: `${m.titel}: ${art} ${von}`, mitarbeiter: m.name, mitarbeiter_name: m.titel, art, status, workflow_state: `PH ${status}`, von, bis,
      halbtags: 0, tage: 0, begruendung: x.begruendung || "", vertretung: x.vertretung ? MA[x.vertretung].name : "", beantragt_von: x.owner, beantragt_am: isoDatumZeit(tage(-r.int(3, 20))),
      genehmigt_von: status === "Genehmigt" || status === "Abgelehnt" ? "personal@demo.local" : "", genehmigt_am: status === "Genehmigt" || status === "Abgelehnt" ? isoDatumZeit(tage(-2)) : "",
      ablehnungsgrund: x.ablehnungsgrund || "", ...basis(x.owner, isoDatumZeit(tage(-r.int(3, 20)))),
    };
    t("PH Abwesenheit").set(name, doc);
    abw.push(doc);
  }

  // --------------------------------------------------- Krankmeldungen --
  const krank = [
    ["Simon Demo", tag(-1), "", 1, "Gemeldet", "Telefon"],
    ["Sophie Beispiel", "2026-10-20", "2026-10-22", 0, "Beendet", "Telefon"],
    ["Anna Vorlage", "2026-10-06", "2026-10-07", 0, "Beendet", "Selbstservice"],
  ].map(([person, von, bis, offen, status, weg]) => {
    const m = MA[person];
    const name = nr(`PH-KRANK-${von.slice(0, 4)}-`, 5);
    const doc = {
      doctype: "PH Krankmeldung", name, naming_series: "PH-KRANK-.YYYY.-.#####", titel: `${m.titel}: Krankmeldung ${von}`, mitarbeiter: m.name, mitarbeiter_name: m.titel, status, von, bis_offen: offen, bis_voraussichtlich: "", bis,
      meldeweg: weg, gemeldet_am: isoDatumZeit(new Date(`${von}T07:40:00`)), gemeldet_von: m.user || "personal@demo.local", arbeitsunfall: 0, notiz: "", ...basis(m.user || "personal@demo.local", isoDatumZeit(new Date(`${von}T07:40:00`))),
    };
    t("PH Krankmeldung").set(name, doc);
    return doc;
  });

  // -------------------------------------------------------- Buchungen --
  const weg = (m, d) => abw.some((a) => a.mitarbeiter === m.name && a.status === "Genehmigt" && a.von <= d && a.bis >= d) || krank.some((k) => k.mitarbeiter === m.name && k.von <= d && (k.bis_offen || k.bis >= d));
  const HEUTE_DA = { "Anna Vorlage": 475, "Anna Probe": 490, "Paul Schema": 460, "Tobias Beispiel": 418, "Lena Demo": 482, "Clara Muster": 470, "Max Muster": 500 };
  for (const m of ma) {
    if (m.status !== "Aktiv" || m.eintritt > heute) continue;
    for (let d = "2026-10-01"; d <= heute; d = iso(new Date(new Date(`${d}T12:00:00`).getTime() + 86400000))) {
      if (wochenende(d) || weg(m, d)) continue;
      const istHeute = d === heute;
      if (istHeute && !(m.titel in HEUTE_DA)) continue;
      const k = istHeute ? HEUTE_DA[m.titel] : 450 + r.int(0, 9) * 5;
      const teil = m.beschaeftigungsart === "Teilzeit";
      let g = istHeute ? null : k + (teil ? 390 : 510) + r.int(0, 8) * 5;
      let pause = istHeute ? 0 : 30;
      const x = {};
      if (m.titel === "Sophie Beispiel" && d === tag(-1)) g = null;
      if (m.titel === "Paul Schema" && d === "2026-10-28") {
        g = 1110;
        x.azg_verstoesse = 1;
        x.azg_befunde = "Mehr als 10 Stunden Arbeitszeit am Tag";
      }
      if (m.titel === "Tobias Beispiel" && d === "2026-10-29") Object.assign(x, { status: "Korrigiert", korrigiert_von: "personal@demo.local", korrigiert_am: "2026-10-30 08:12:00" });
      if (m.titel === "Anna Vorlage" && d === "2026-10-30") continue;
      if (m.titel === "Anna Vorlage" && d === "2026-10-29") Object.assign(x, { korrektur_status: "Beantragt", korrektur_gehen: "17:30:00", korrektur_kommen: zeit(k), korrektur_pause_min: 30, korrektur_grund: "Kundentermin dauerte länger", korrektur_beantragt_von: "selbst@demo.local" });
      const pauseBestaetigt = m.titel === "Anna Vorlage" && d === tag(-1) ? 0 : 1;
      const dauer = g ? g - k - pause : 0;
      const name = nr(`PH-ZEIT-${d.slice(0, 4)}-`, 6);
      t("PH Zeiterfassung").set(name, {
        doctype: "PH Zeiterfassung", name, naming_series: "PH-ZEIT-.YYYY.-.######", titel: `${m.titel} ${d}`, mitarbeiter: m.name, mitarbeiter_name: m.titel, datum: d, art: m.rolle_intern === "Montage" && !istHeute && r.int(0, 2) === 0 ? "Montage" : "Arbeit",
        status: g ? "Erfasst" : "Offen", kommen: zeit(k), gehen: g ? zeit(g) : "", pause_min: pause, dauer_min: dauer, dauer_text: g ? `${Math.floor(dauer / 60)}:${p2(dauer % 60)} h` : "", quelle: "Stempel",
        pause_bestaetigt: g ? pauseBestaetigt : 0, notiz: "", ...x, ...basis(m.user || "personal@demo.local", `${d} ${zeit(g || k)}`),
      });
    }
  }

  // ------------------------------------------------------ Bewerbungen --
  const bewerbungen = BEWERBER.map(([v, n, si, status, eing, quelle, x], i) => {
    const s = si == null ? null : stellen[si];
    const eingang = isoDatumZeit(tage(eing, r));
    const name = nr(`PH-BEW-${eingang.slice(0, 4)}-`, 5);
    const geloescht = Boolean(x.geloescht);
    const entsch = x.entschieden != null ? isoDatumZeit(tage(x.entschieden)) : ["Eingestellt"].includes(status) ? isoDatumZeit(tage(eing + 25)) : "";
    const frist = x.frist != null ? tag(x.frist) : entsch ? iso(new Date(new Date(entsch.replace(" ", "T")).setMonth(new Date(entsch.replace(" ", "T")).getMonth() + 7))) : "";
    const person = geloescht ? "Personendaten gelöscht" : `${v} ${n}`;
    const email = geloescht || x.ohneEmail ? "" : `${v.toLowerCase()}.${n.toLowerCase()}@beispiel.invalid`;
    const doc = {
      doctype: "PH Bewerbung", name, naming_series: "PH-BEW-.YYYY.-.#####", titel: s ? `${person} – ${s.titel}` : `${person} – Initiativbewerbung`, status, workflow_state: `PH ${status}`,
      stelle: s?.name || "", stelle_titel: s?.titel || "", initiativ: s ? 0 : 1, eingang, quelle, zugewiesen_an: i % 3 === 0 ? "personal@demo.local" : i % 3 === 1 ? "crm-leitung@demo.local" : "", sprache: x.sprache || "de",
      anrede: geloescht ? "" : i % 2 ? "Herr" : "Frau", vorname: geloescht ? "" : v, nachname: geloescht ? "Personendaten gelöscht" : n, verfuegbar_ab: geloescht ? "" : tag(30 + i * 3), email, telefon: geloescht ? "" : `+43 660 00000${p2(i)}`,
      plz_ort: geloescht ? "" : r.pick(["6900 Bregenz", "6911 Lochau", "6850 Dornbirn", "88131 Lindau"]),
      anschreiben: geloescht ? "" : `<p>Sehr geehrte Damen und Herren,</p><p>mit großem Interesse habe ich Ihre Ausschreibung gelesen und bewerbe mich hiermit. Meine Erfahrung in ${s?.kategorie || "Verkauf und Planung"} möchte ich gern in Ihr Team einbringen.</p><p>Mit freundlichen Grüßen<br>${v} ${n}</p>`,
      unterlagen: geloescht || x.ohneUnterlagen ? [] : [
        { name: `${name}-u1`, idx: 1, art: "Lebenslauf", bezeichnung: `Lebenslauf ${v} ${n}`, datei: `/private/files/lebenslauf-${name.toLowerCase()}.pdf`, hochgeladen_am: eingang, groesse_kb: 180 + i * 7 },
        { name: `${name}-u2`, idx: 2, art: "Anschreiben", bezeichnung: "Anschreiben", datei: `/private/files/anschreiben-${name.toLowerCase()}.pdf`, hochgeladen_am: eingang, groesse_kb: 64 },
        ...(i % 2 ? [{ name: `${name}-u3`, idx: 3, art: "Zeugnis", bezeichnung: "Zeugnis", datei: `/private/files/zeugnis-${name.toLowerCase()}.pdf`, hochgeladen_am: eingang, groesse_kb: 410 }] : []),
      ],
      bewertung: geloescht ? 0 : ["Gespraech", "Angebot", "Eingestellt"].includes(status) ? 0.6 + (i % 3) * 0.2 : 0, eindruck: geloescht ? "" : status === "Angebot" ? "Gute Kenntnisse in der Planung, ruhige Gesprächsführung." : "",
      gehaltsvorstellung_cent: x.angebot ? 280000 : 0, notiz_intern: "", angebot_brutto_cent: 0, angebot_zeitraum: "",
      gesichtet_am: status === "Eingegangen" ? "" : isoDatumZeit(tage(eing + 1)), gespraech_am: ["Gespraech", "Angebot", "Eingestellt"].includes(status) ? isoDatumZeit(tage(eing + 3)) : "", angebot_am: x.angebot ? isoDatumZeit(tage(-3)) : "",
      entschieden_am: entsch, absage_grund: x.grund || "", absage_gesendet_am: status === "Abgesagt" && !x.versand ? entsch : "", absage_versand: status === "Abgesagt" ? x.versand || "E-Mail" : "", absage_versand_am: status === "Abgesagt" ? entsch : "",
      mitarbeiter: x.eingestellt ? MA["Jonas Platzhalter"].name : "", einwilligung_datenschutz: 1, datenschutzinfo_art: quelle === "Website" ? "Website-Formular" : "E-Mail", datenschutzinfo_am: eingang,
      eingang_bestaetigt_am: geloescht ? "" : eingang, loeschfrist: ["Abgesagt", "Zurueckgezogen", "Eingestellt"].includes(status) ? frist : "", einwilligung_evidenz: x.evidenz ? 1 : 0, einwilligung_evidenz_bis: x.evidenz ? tag(x.evidenz) : "",
      unterlagen_geloescht_am: geloescht ? isoDatumZeit(tage(x.entschieden + 213)) : "", pseudonymisiert: geloescht ? 1 : 0, ...basis(quelle === "Website" ? "website@platzhirsch.studio" : "personal@demo.local", eingang),
    };
    doc.modified = entsch || doc.gesichtet_am || eingang;
    t("PH Bewerbung").set(name, doc);
    return doc;
  });
  const B = (vn) => bewerbungen.find((b) => `${b.vorname} ${b.nachname}` === vn);
  const jp = MA["Jonas Platzhalter"];
  jp.bewerbung = B("Jonas Platzhalter").name;
  const finn = stellen[8];
  finn.besetzt_durch = B("Finn Vorlage").name;

  // ------------------------------------------------------- Gespräche --
  const GSP = [
    ["Mira Test", tag(0) + " 10:00:00", "Geplant", "Vor Ort", "personal@demo.local", {}],
    ["Jonas Muster", tag(-2) + " 14:00:00", "Geplant", "Vor Ort", "personal@demo.local", {}],
    ["Emma Platzhalter", tag(2) + " 09:30:00", "Geplant", "Video", "crm-leitung@demo.local", { kalender: true, bestaetigt: true }],
    ["Emma Platzhalter", tag(-6) + " 11:00:00", "Abgesagt", "Vor Ort", "crm-leitung@demo.local", {}],
    ["Leon Beispiel", tag(-10) + " 15:00:00", "Durchgefuehrt", "Vor Ort", "personal@demo.local", { ergebnis: "Angebot", naechster: "Angebot bis Freitag" }],
    ["Sofia Probe", tag(-9) + " 10:30:00", "Durchgefuehrt", "Telefon", "projekte@demo.local", { ergebnis: "Angebot" }],
    ["Jonas Platzhalter", tag(-30) + " 13:00:00", "Durchgefuehrt", "Vor Ort", "personal@demo.local", { ergebnis: "Angebot" }],
    ["Mira Test", tag(-3) + " 16:00:00", "Nicht erschienen", "Video", "personal@demo.local", {}],
  ];
  for (const [person, start, status, modus, wer, x] of GSP) {
    const b = B(person);
    const name = nr(`PH-GSP-${start.slice(0, 4)}-`, 5);
    const startD = new Date(start.replace(" ", "T"));
    t("PH Bewerbungsgespraech").set(name, {
      doctype: "PH Bewerbungsgespraech", name, naming_series: "PH-GSP-.YYYY.-.#####", titel: `Gespräch ${b.vorname} ${b.nachname}`, bewerbung: b.name, stelle: b.stelle, bewerber: `${b.vorname} ${b.nachname}`, status, start,
      dauer_min: 60, ende: isoDatumZeit(new Date(startD.getTime() + 3600000)), modus, ort: modus === "Vor Ort" ? "Showroom Lochau" : modus === "Video" ? "Videolink folgt per E-Mail" : "", verantwortlich: wer, weitere_teilnehmer: "",
      kalender_event: x.kalender ? `EV-${name}` : "", bestaetigt_am: x.bestaetigt ? isoDatumZeit(tage(-1)) : "", ergebnis: x.ergebnis || "", naechster_schritt: x.naechster || "", bewertung: x.ergebnis ? 0.8 : 0,
      notiz: x.ergebnis ? "<p>Fachlich passend, Rückfragen zur Arbeitszeit geklärt.</p>" : "", ...basis(wer, isoDatumZeit(tage(-12))),
    });
  }

  // ---------------------------------------------------- Einstellungen --
  const einst = t(EINST).get(EINST) || { doctype: EINST, name: EINST, ...basis("Administrator") };
  Object.assign(einst, {
    loeschfrist_monate: 7, bewerbung_email: "bewerbung@beispiel.invalid", standard_ansprechpartner: "personal@demo.local", standort: "Lochau am Bodensee, Landstraße 11", standard_wochenstunden: 38.5, urlaubsanspruch_tage: 25,
    pause_ab_minuten: 360, pause_minuten: 30, urlaubsjahr: "Arbeitsjahr", landesfeiertag_frei: 1, betriebsruhe_behandlung: "Bezahlt frei", krank_bestaetigung_ab_tag: 3, benutzer_bei_austritt_deaktivieren: 1,
    aufbewahrung_zeiten_jahre: 7, notfallkontakt_loeschen_tage: 30, offene_bewerbung_warnung_tage: 90, website_revalidate_aktiv: 1,
    absage_text: einst.absage_text || "<p>vielen Dank für Ihre Bewerbung und das Interesse an unserem Haus. Wir haben uns Ihre Unterlagen aufmerksam angesehen.</p><p>Leider können wir Ihnen für diese Position keine Zusage geben.</p>",
    mindestbesetzung: [], _seed_personal: SEED_VERSION,
  });
  t(EINST).set(EINST, einst);
}
