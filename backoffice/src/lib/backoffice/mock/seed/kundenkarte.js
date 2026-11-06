// Mock-Seed – Bereich Kundenkarte (G-01, MASTER § 3.5). Schreibt: Team B-KKA.
// anzahl: Datensätze je DocType · kern: Fachwissen je DocType (Verteilung, Bezüge, Titel) nach der
// generischen Erzeugung · default: Nachlauf (db, hilfe) nach dem Grundaufbau, Reihenfolge über `nach`.
// Keine echten Personen, E-Mails @beispiel.invalid, runde Beispielbeträge (Q-A3). Zufall nur über `r`
// (fester Startwert); Reihenfolge der r-Aufrufe nicht ändern, sonst verschieben sich alle Folgedaten.
//
// B-KKA: `anzahl` und `kern` bleiben unverändert (sie verbrauchen Zufallszahlen der gemeinsamen Folge –
// eine Änderung würde die Daten aller später erzeugten DocTypes verschieben). Der Nachlauf ersetzt die
// generischen Kundenkarten-Datensätze vollständig durch einen festen Fachbestand nach dem Backend-Modell
// (ph_kundenkarte): 3 Stufen, 8 Vorteile, 21 Karten in jedem Status, 10 Anträge in jedem Reiter,
// Einlösungen (eingelöst/storniert, Limit erreicht, über die Kartenkette), Ereignisse und Einstellungen.

import { isoDatum, isoDatumZeit } from "../../format.js";
import { tage } from "./basis.js";

/** Nachläufe anderer Bereiche, die vor diesem laufen müssen. */
export const nach = [];

/** Anzahl generischer Datensätze je DocType (nicht gelistete mit Status bekommen 6). */
export const anzahl = {
  "PH Kundenkarte Antrag": 10,
  "PH Kundenkarte": 8,
};

/** Fachliche Nachbearbeitung je DocType: (doc, { i, r, ctx, person }) – ändert doc. */
export const kern = {
  "PH Kundenkarte Antrag": (doc, { r, person }) => {
    doc.status = r.pick(["Eingegangen", "Eingegangen", "Geprueft", "Genehmigt", "Karte ausgestellt", "Abgelehnt"]);
    doc.eingang = isoDatumZeit(tage(-r.int(0, 30), r));
    doc.titel = `Antrag ${person}`;
    doc.gewuenschte_stufe = r.pick(["Classic", "Classic", "Select", "Privé"]);
  },
  "PH Kundenkarte": (doc, { i, r, person }) => {
    doc.kartennummer = `PHK-${String(100000 + i * 37).padStart(6, "0")}`;
    doc.kunde_name = person;
    doc.titel = `${doc.kartennummer} ${person}`;
    doc.status = i < 6 ? "Aktiv" : r.pick(["Gesperrt", "Abgelaufen"]);
    doc.stufe = r.pick(["Classic", "Classic", "Select", "Privé"]);
    doc.gueltig_bis = isoDatum(tage(r.int(100, 700)));
    doc.kundenwert_cent = r.pick([0, 249000, 580000, 1290000]);
  },
};

// ------------------------------------------------------------- Festbestand --

const DT = {
  karte: "PH Kundenkarte",
  antrag: "PH Kundenkarte Antrag",
  einloesung: "PH Kundenkarte Einloesung",
  stufe: "PH Kundenkarte Stufe",
  vorteil: "PH Kundenkarte Vorteil",
  ereignis: "PH Kundenkarte Ereignis",
  einstellungen: "PH Kundenkarte Einstellungen",
};

export const SEED_STUFEN = [
  { stufenname: "Platzhirsch", reihenfolge: 1, schwelle_jahresumsatz_cent: 0, farbe: "#5b626a", vorteile: ["V1", "V2", "V3"], beschreibung_kunde: "Ihre Kundenkarte: persönliche Beratung, Einladungen zu Abenden im Showroom und ein Gruß zum Geburtstag.", beschreibung_intern: "Startstufe für alle Karten." },
  { stufenname: "Platzhirsch Plus", reihenfolge: 2, schwelle_jahresumsatz_cent: 1000000, farbe: "#b08850", vorteile: ["V4", "V5"], beschreibung_kunde: "Zusätzlich zur Kundenkarte: Lieferung im Liefergebiet und verlängerte Umtauschfrist für Lagerware.", beschreibung_intern: "Schwelle Platzhalter – Inhaber-Entscheidung offen." },
  { stufenname: "Platzhirsch Privé", reihenfolge: 3, schwelle_jahresumsatz_cent: 5000000, farbe: "#8f5230", vorteile: ["V6", "V7"], beschreibung_kunde: "Zusätzlich zu Platzhirsch Plus: Montage durch unser Team und ein Pflegetermin im Jahr.", beschreibung_intern: "Schwelle Platzhalter – Inhaber-Entscheidung offen." },
];

// k = Schlüssel, Nummer PH-KKV-2026-0000n
export const SEED_VORTEILE = [
  { k: "V1", titel: "Persönliche Beratung", art: "Persoenlich", limit: 0, ab: "Platzhirsch", reihe: 10, kunde: "Eine feste Ansprechperson begleitet Sie bei Planung, Auswahl und Service." },
  { k: "V2", titel: "Vorab-Zugang zu Abenden im Showroom", art: "Event", limit: 0, ab: "Platzhirsch", reihe: 20, kunde: "Sie erhalten Einladungen zu Veranstaltungen vor der allgemeinen Ankündigung – sofern Sie Einladungen zugestimmt haben." },
  { k: "V3", titel: "Gruß zum Geburtstag", art: "Persoenlich", limit: 1, ab: "Platzhirsch", reihe: 30, kunde: "Zu Ihrem Geburtstag melden wir uns persönlich – wenn Sie uns das Datum freiwillig nennen." },
  { k: "V4", titel: "Lieferung im Liefergebiet", art: "Lieferung", limit: 0, ab: "Platzhirsch Plus", reihe: 40, kunde: "Wir liefern Ihre Bestellung im Liefergebiet des Studios ohne gesonderte Lieferpauschale." },
  { k: "V5", titel: "Verlängerte Umtauschfrist", art: "Service", limit: 0, ab: "Platzhirsch Plus", reihe: 50, kunde: "Für Lagerware verlängert sich die Frist für einen Umtausch." },
  { k: "V6", titel: "Montage durch unser Team", art: "Montage", limit: 0, ab: "Platzhirsch Privé", reihe: 60, kunde: "Aufbau und Einrichtung durch unser Montageteam sind Teil Ihrer Lieferung." },
  { k: "V7", titel: "Pflegetermin im Jahr", art: "Pflege", limit: 1, ab: "Platzhirsch Privé", reihe: 70, kunde: "Einmal im Jahr pflegen wir Leder, Stoff, Holz oder Stein bei Ihnen zu Hause." },
  { k: "V8", titel: "Abholung von Altmöbeln", art: "Service", limit: 1, ab: "Platzhirsch Plus", reihe: 80, kunde: "Bei einer Lieferung nehmen wir ein Altmöbel mit.", aktiv: 0 },
];

/** Kennung des Festbestands – B-KKA erkennt daran, ob eine laufende Mock-DB schon nachgesät ist. */
export const SEED_VERSION = 1;

/** Ist der Festbestand in dieser Datenbank? */
export function istGesaet(db) {
  return db?.get?.(DT.stufe)?.get("Platzhirsch")?._kk_seed === SEED_VERSION;
}

const vName = (k) => `PH-KKV-2026-${String(Number(k.slice(1))).padStart(5, "0")}`;

// Reihenfolge = Rang der Kontaktzuordnung (Kontakte mit den meisten Belegen zuerst).
// t = Tage relativ zum 04.11.2026.
export const SEED_KARTEN = [
  { nr: "KK-7K3QX9", name: "Anna Muster", status: "Aktiv", stufe: "Platzhirsch Plus", seit: -235, aus: -420, einw: 1, umsatz: 1476000, berater: "kundenkarte@demo.local", kanal: "website", geb: "11-04", rang: 1, berechnet: -1, letzter: -14 },
  { nr: "KK-4HRW7C", name: "Lukas Probe", status: "Aktiv", stufe: "Platzhirsch Privé", seit: -160, aus: -900, einw: 1, umsatz: 6240000, berater: "crm-leitung@demo.local", kanal: "showroom", rang: 2, berechnet: -1, letzter: -40 },
  { nr: "KK-T8VH4M", name: "Laura Musterfrau", status: "Aktiv", stufe: "Platzhirsch Privé", seit: -300, aus: -12, einw: 1, umsatz: 5200000, berater: "kundenkarte@demo.local", kanal: "showroom", rang: 3, berechnet: -1, letzter: -60, vorg: "KK-R2LJ9A" },
  { nr: "KK-C9XN2P", name: "Sarah Beispiel", status: "Aktiv", stufe: "Platzhirsch Plus", seit: -200, aus: -30, einw: 0, berater: "crm@demo.local", kanal: "showroom", rang: 4, vorg: "KK-H5UE3W" },
  { nr: "KK-E6GB4D", name: "Julia Probe", status: "Aktiv", stufe: "Platzhirsch Plus", seit: -120, aus: -600, einw: 1, umsatz: 1180000, berater: "crm@demo.local", kanal: "kassa", rang: 5, berechnet: -1, letzter: -90 },
  { nr: "KK-Q2MZ8T", name: "Simon Testner", status: "Aktiv", stufe: "Platzhirsch Plus", seit: -50, aus: -380, einw: 1, umsatz: 320000, manuell: 1, berater: "kundenkarte@demo.local", kanal: "showroom", rang: 6, berechnet: -1, letzter: -5 },
  { nr: "KK-B6TS8E", name: "Sophie Demo", status: "Gesperrt", stufe: "Platzhirsch Plus", seit: -180, aus: -500, einw: 1, umsatz: 1050000, berater: "crm@demo.local", kanal: "showroom", sperre: { art: "Verlust", t: -2, text: "Karte im Restaurant liegen gelassen" }, rang: 7, berechnet: -3, letzter: -70 },
  { nr: "KK-G3HT6V", name: "Max Schema", status: "Aktiv", stufe: "Platzhirsch", seit: -20, aus: -20, einw: 1, umsatz: 180000, berater: "crm@demo.local", kanal: "website", rang: 8, berechnet: -1, letzter: -20 },
  { nr: "KK-P8D2NV", name: "Maria Testner", status: "Aktiv", stufe: "Platzhirsch", seit: -15, aus: -15, einw: 0, berater: "", kanal: "showroom", rang: 9 },
  { nr: "KK-Z5QG3J", name: "Paul Vorlage", status: "Aktiv", stufe: "Platzhirsch", seit: -3, aus: -3, einw: 1, umsatz: 0, berater: "", kanal: "showroom", rang: 10 },
  { nr: "KK-L8WR3G", name: "Erika Vorlage", status: "Aktiv", stufe: "Platzhirsch Plus", seit: -500, aus: -700, einw: 1, umsatz: 0, berater: "kundenkarte@demo.local", kanal: "showroom", rang: 11, berechnet: -1, letzter: -490 },
  { nr: "KK-W3XK5R", name: "Felix Schema", status: "Gesperrt", stufe: "Platzhirsch Plus", seit: -260, aus: -800, einw: 0, berater: "crm@demo.local", kanal: "showroom", sperre: { art: "Diebstahl", t: -6, text: "Handtasche gestohlen, Anzeige erstattet" }, rang: 12 },
  { nr: "KK-N4CM6H", name: "Clara Platzhalter", status: "Gesperrt", stufe: "Platzhirsch", seit: -400, aus: -400, einw: 0, berater: "kundenkarte@demo.local", kanal: "showroom", sperre: { art: "Kundenwunsch", t: -40, text: "Auslandsaufenthalt" }, rang: 13 },
  { nr: "KK-9M2PT4", name: "Familie Beispiel", status: "Beantragt", stufe: "Platzhirsch", seit: -9, aus: null, einw: 0, berater: "", kanal: "showroom", rang: 14, angelegt: -9 },
  { nr: "KK-Y9KD4S", name: "Lena Musterfrau", status: "Beantragt", stufe: "Platzhirsch", seit: -2, aus: null, einw: 1, umsatz: 0, berater: "crm@demo.local", kanal: "website", rang: 15, angelegt: -2 },
  { nr: "KK-V7PF5K", name: "Tobias Demo", status: "Aktiv", stufe: "Platzhirsch", seit: -700, aus: -700, einw: 0, berater: "crm@demo.local", kanal: "kassa", rang: 16 },
  { nr: "KK-S4JC9B", name: "Tobias Demo", status: "Beantragt", stufe: "Platzhirsch", seit: -60, aus: null, einw: 0, berater: "", kanal: "website", rang: 16, angelegt: -60 },
  // Endzustände (teilen Kontakte mit offenen Karten)
  { nr: "KK-R2LJ9A", name: "Laura Musterfrau", status: "Ersetzt", stufe: "Platzhirsch Privé", seit: -300, aus: -1100, einw: 1, umsatz: 5200000, berater: "kundenkarte@demo.local", kanal: "showroom", rang: 3, nachf: "KK-T8VH4M", ende: -12, sperre: { art: "Verlust", t: -12, text: "" } },
  { nr: "KK-H5UE3W", name: "Markus Beispiel", status: "Uebertragen", stufe: "Platzhirsch Plus", seit: -200, aus: -760, einw: 0, berater: "crm@demo.local", kanal: "showroom", rang: 4, nachf: "KK-C9XN2P", ende: -30, uebertragung: "Partner/Haushalt", eigenerKontakt: true },
  { nr: "KK-K3SA7Y", name: "Julia Probe", status: "Zusammengefuehrt", stufe: "Platzhirsch", seit: -640, aus: -640, einw: 0, berater: "", kanal: "website", rang: 5, zus: "KK-E6GB4D", ende: -100 },
  { nr: "KK-F7YD2L", name: "Jonas Mustermann", status: "Gekuendigt", stufe: "Platzhirsch", seit: -900, aus: -900, einw: 0, berater: "crm@demo.local", kanal: "showroom", rang: 17, gekuendigt: -45 },
];

/** Einlösungen: n = Nummer, karte, v = Vorteil, t = Tage, h = Uhrzeit, ort, beleg = Belegart, durch, storno. */
export const SEED_EINLOESUNGEN = [
  { karte: "KK-7K3QX9", v: "V4", t: 0, h: "10:40", ort: "Packtisch", beleg: "PH Bestellung", durch: "logistik@demo.local" },
  { karte: "KK-7K3QX9", v: "V1", t: -1, h: "16:02", ort: "Showroom", durch: "kundenkarte@demo.local", kommentar: "Planung Wohnraum" },
  { karte: "KK-7K3QX9", v: "V3", t: -176, h: "09:15", ort: "Showroom", durch: "kundenkarte@demo.local" },
  { karte: "KK-7K3QX9", v: "V4", t: -55, h: "11:20", ort: "Kassa", beleg: "PH Kassenbeleg", durch: "kassa@demo.local", storno: { t: -55, grund: "Doppelt erfasst", durch: "kassa-leitung@demo.local" } },
  { karte: "KK-4HRW7C", v: "V7", t: -180, h: "14:00", ort: "Service", beleg: "PH Pflege Abo", durch: "service@demo.local" },
  { karte: "KK-4HRW7C", v: "V6", t: -60, h: "08:30", ort: "Backoffice", beleg: "PH Serviceauftrag", durch: "kundenkarte@demo.local" },
  { karte: "KK-4HRW7C", v: "V4", t: -62, h: "13:10", ort: "Packtisch", beleg: "PH Bestellung", durch: "logistik@demo.local" },
  { karte: "KK-R2LJ9A", v: "V7", t: -200, h: "10:00", ort: "Service", beleg: "PH Serviceauftrag", durch: "service@demo.local" },
  { karte: "KK-C9XN2P", v: "V4", t: -9, h: "15:45", ort: "Kassa", beleg: "PH Kassenbeleg", durch: "kassa@demo.local", storno: { t: -8, grund: "Bestellung storniert", durch: "kassa-leitung@demo.local" } },
  { karte: "KK-E6GB4D", v: "V2", t: -15, h: "19:00", ort: "Event", durch: "kundenkarte@demo.local", kommentar: "Herbstabend im Showroom" },
  { karte: "KK-Q2MZ8T", v: "V4", t: 0, h: "09:05", ort: "Showroom", beleg: "PH Rechnung", durch: "kundenkarte@demo.local" },
  { karte: "KK-L8WR3G", v: "V1", t: -480, h: "11:00", ort: "Showroom", durch: "kundenkarte@demo.local" },
  { karte: "KK-G3HT6V", v: "V2", t: -15, h: "19:10", ort: "Event", durch: "kundenkarte@demo.local" },
  { karte: "KK-E6GB4D", v: "V4", t: -3, h: "12:00", ort: "Kassa", beleg: "PH Kassenbeleg", durch: "kassa@demo.local" },
];

export const SEED_ANTRAEGE = [
  { n: 31, status: "Bestaetigt", quelle: "website", t: 0, h: "09:12", vor: "Sarah", nach: "Neuhaus", email: "sarah.neuhaus@beispiel.invalid", plz: "6900", ort: "Bregenz", einw: 1, news: 0, bestaetigt: "09:20", interessen: "Küche, Outdoor", geb: "05-12", nachricht: "Wir richten gerade das Wohnzimmer neu ein." },
  { n: 30, status: "Bestaetigt", quelle: "showroom", t: -3, h: "16:30", vor: "Peter", nach: "Probe", email: "peter.probe@beispiel.invalid", plz: "6911", ort: "Lochau", einw: 0, news: 1, kontaktVon: "KK-7K3QX9", nachweis: "Unterschrift Formular" },
  { n: 29, status: "Neu", quelle: "website", t: -2, h: "21:04", vor: "Katrin", nach: "Schema", email: "katrin.schema@beispiel.invalid", plz: "88131", ort: "Lindau", einw: 1, news: 0, doi: 1 },
  { n: 28, status: "Neu", quelle: "website", t: -26, h: "07:48", vor: "Bernd", nach: "Vorlage", email: "bernd.vorlage@beispiel.invalid", plz: "6850", ort: "Dornbirn", einw: 0, news: 1, doi: 1 },
  { n: 27, status: "Bestaetigt", quelle: "kassa", t: -1, h: "11:22", vor: "Thomas", nach: "Demo", email: "laura.muster@beispiel.invalid", plz: "6911", ort: "Lochau", einw: 0, news: 0, nachweis: "Unterschrift Tablet" },
  { n: 26, status: "Neu", quelle: "event", t: -1, h: "20:15", vor: "Nina", nach: "Testner", email: "nina.testner@beispiel.invalid", plz: "6971", ort: "Hard", einw: 1, news: 1, doi: 0, nachweis: "Unterschrift Formular" },
  { n: 25, status: "Angenommen", quelle: "website", t: -420, h: "10:00", vor: "Anna", nach: "Muster", email: "anna.muster@beispiel.invalid", plz: "6900", ort: "Bregenz", einw: 1, news: 0, karte: "KK-7K3QX9", entschieden: -420 },
  { n: 24, status: "Abgelehnt", quelle: "website", t: -6, h: "13:40", vor: "Robert", nach: "Platzhalter", email: "robert.platzhalter@beispiel.invalid", plz: "", ort: "", einw: 0, news: 0, grund: "[Angaben unvollständig/nicht prüfbar] Anschrift fehlt, Rückfrage ohne Antwort", entschieden: -1, durch: "crm-leitung@demo.local" },
  { n: 23, status: "Doppelt", quelle: "showroom", t: -10, h: "15:00", vor: "Familie", nach: "Beispiel", email: "familie.beispiel@beispiel.invalid", plz: "6911", ort: "Lochau", einw: 0, news: 0, doppelt: "KK-9M2PT4", entschieden: -10, durch: "kundenkarte@demo.local" },
  { n: 22, status: "Angenommen", quelle: "website", t: -2, h: "08:05", vor: "Lena", nach: "Musterfrau", email: "lena.musterfrau@beispiel.invalid", plz: "6890", ort: "Lustenau", einw: 1, news: 1, karte: "KK-Y9KD4S", entschieden: -2 },
];

function zeit(t, hhmm = "09:00") {
  const d = tage(t);
  const [h, m] = String(hhmm).split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Nachlauf nach dem Grundaufbau (Bezüge zwischen DocTypes, Leer-/Fehlerfälle). Eigener Zufall über hilfe.rng.
 * @param {Map<string, Map<string, object>>} db
 * @param {import("./index.js").SeedHilfe} hilfe
 */
export default function nachlauf(db, hilfe) {
  const { tabelle, naechste } = hilfe;
  const t = (dt) => tabelle(dt);
  for (const dt of Object.values(DT)) if (dt !== DT.einstellungen) t(dt).clear();

  const stempel = (doc, tt, owner = "Administrator") => {
    const z = isoDatumZeit(zeit(tt, "08:00"));
    return { owner, creation: doc.creation || z, modified: doc.modified || z, modified_by: owner, docstatus: 0, idx: 0, ...doc };
  };

  // Vorteile
  for (const v of SEED_VORTEILE) {
    const name = vName(v.k);
    t(DT.vorteil).set(name, stempel({ doctype: DT.vorteil, name, naming_series: "PH-KKV-.YYYY.-.#####", titel: v.titel, art: v.art, aktiv: v.aktiv ?? 1, einloesbar_pro_jahr: v.limit, gilt_ab_stufe: v.ab, reihenfolge: v.reihe, beschreibung_kunde: v.kunde, beschreibung_intern: "", quelle: "install" }, -400));
  }
  // Stufen mit Zuordnung (Kindtabelle)
  for (const s of SEED_STUFEN) {
    const vorteile = s.vorteile.map((k, i) => ({ doctype: "PH Kundenkarte Stufe Vorteil", name: `${s.stufenname}-${i + 1}`, idx: i + 1, parent: s.stufenname, parentfield: "vorteile", parenttype: DT.stufe, vorteil: vName(k), titel: SEED_VORTEILE.find((v) => v.k === k).titel, art: SEED_VORTEILE.find((v) => v.k === k).art, hinweis: "" }));
    t(DT.stufe).set(s.stufenname, stempel({ doctype: DT.stufe, name: s.stufenname, _kk_seed: SEED_VERSION, stufenname: s.stufenname, reihenfolge: s.reihenfolge, aktiv: 1, schwelle_jahresumsatz_cent: s.schwelle_jahresumsatz_cent, farbe: s.farbe, beschreibung_kunde: s.beschreibung_kunde, beschreibung_intern: s.beschreibung_intern, vorteile }, -400));
  }
  for (let i = 0; i < SEED_VORTEILE.length; i++) naechste("PH-KKV-2026-");

  // Einstellungen (Single)
  const einst = t(DT.einstellungen).get(DT.einstellungen) || { doctype: DT.einstellungen, name: DT.einstellungen };
  t(DT.einstellungen).set(DT.einstellungen, {
    ...einst,
    startstufe: "Platzhirsch",
    bewertungszeitraum_monate: 12,
    herabstufung_erlaubt: 0,
    umsatz_nur_mit_einwilligung: 1,
    doi_pflicht: 1,
    doi_gueltig_stunden: 48,
    website_automatisch_annehmen: 1,
    berater_standard: "",
    bedingungen_version: "2026-11",
    wallet_pass_type_id: "",
    wallet_team_id: "",
    wallet_organisation: "Platzhirsch",
    text_begruessung: "<p>Herzlich willkommen,</p><p>mit Ihrer Platzhirsch Kundenkarte erhalten Sie persönliche Beratung, Einladungen zu Abenden im Showroom und – je nach Stufe – Leistungen rund um Lieferung, Montage und Pflege. Die Karte ist personengebunden und hat keinen Geldwert.</p>",
    text_datenschutz_karte: "Die Karte ist personengebunden und hat keinen Geldwert. Informationen zum Datenschutz: platzhirsch.studio/datenschutz",
  });

  // Kontakte: Privat/Architekt, nach Anzahl Belege absteigend (damit die „reichen“ Karten Einkäufe haben)
  const belegTypen = ["PH Kassenbeleg", "PH Bestellung", "PH Rechnung", "PH Auftragsbestaetigung", "PH Serviceauftrag", "PH Pflege Abo"];
  const anzahlBelege = (k) => belegTypen.reduce((n, dt) => n + [...t(dt).values()].filter((b) => b.kontakt === k).length, 0);
  const personen = [...t("PH Kontakt").values()]
    .filter((k) => ["Privat", "Architekt"].includes(k.kontaktart))
    .map((k) => ({ k, n: anzahlBelege(k.name) }))
    .sort((a, b) => b.n - a.n || String(a.k.name).localeCompare(String(b.k.name)))
    .map((x) => x.k.name);
  const geschaeft = [...t("PH Kontakt").values()].filter((k) => !["Privat", "Architekt"].includes(k.kontaktart)).map((k) => k.name);
  const kontaktFuerRang = (rang) => personen[(rang - 1) % Math.max(personen.length, 1)] || geschaeft[0] || "";

  // Karten
  for (const s of SEED_KARTEN) {
    const kontakt = s.eigenerKontakt ? kontaktFuerRang(SEED_KARTEN.length > 17 ? 17 : 1) : kontaktFuerRang(s.rang);
    const erstellt = s.aus ?? s.angelegt ?? -1;
    const doc = {
      doctype: DT.karte,
      name: s.nr,
      kartennummer: s.nr,
      titel: `${s.nr} ${s.name}`,
      status: s.status,
      kanal: s.kanal,
      kontakt,
      kunde_name: s.name,
      persoenlicher_berater: s.berater || "",
      geburtstag_tag_monat: s.geb || "",
      stufe: s.stufe,
      stufe_seit: isoDatum(tage(s.seit)),
      stufe_manuell: s.manuell || 0,
      jahresumsatz_cent: s.einw ? s.umsatz || 0 : 0,
      gesamtumsatz_cent: s.einw ? Math.round((s.umsatz || 0) * 1.6) : 0,
      letzter_einkauf: s.einw && s.letzter !== undefined ? isoDatum(tage(s.letzter)) : null,
      umsatz_berechnet_am: s.einw && s.berechnet !== undefined ? isoDatumZeit(zeit(s.berechnet, "03:30")) : null,
      ausgestellt_am: s.aus !== null && s.aus !== undefined ? isoDatum(tage(s.aus)) : null,
      ausgestellt_durch: s.aus !== null && s.aus !== undefined ? (s.kanal === "website" ? "Administrator" : s.berater || "kundenkarte@demo.local") : null,
      antrag: s.nr === "KK-7K3QX9" ? "PH-KKA-2026-00025" : s.nr === "KK-Y9KD4S" ? "PH-KKA-2026-00022" : null,
      gesperrt_am: s.sperre ? isoDatumZeit(zeit(s.sperre.t, "10:12")) : null,
      sperrgrund_art: s.sperre?.art || (s.status === "Zusammengefuehrt" ? "Dublette" : null),
      sperrgrund: s.sperre?.text || null,
      gekuendigt_am: s.gekuendigt !== undefined ? isoDatum(tage(s.gekuendigt)) : null,
      vorgaenger_karte: s.vorg || null,
      nachfolger_karte: s.nachf || null,
      uebertragung_grund: s.uebertragung || null,
      zusammengefuehrt_in: s.zus || null,
      beendet_am: s.ende !== undefined ? isoDatumZeit(zeit(s.ende, "11:00")) : null,
      uebergeben_am: s.status === "Aktiv" && s.kanal !== "website" && s.aus !== null ? isoDatumZeit(zeit(s.aus, "15:00")) : null,
      einwilligung_auswertung: s.einw,
      einwilligung_am: s.einw ? isoDatumZeit(zeit(Math.min(s.aus ?? s.angelegt ?? -1, -1), "10:05")) : null,
      einwilligung_textversion: s.einw ? "kundenkarte-auswertung-v1" : "",
      wallet_pass_seriennummer: s.status === "Aktiv" && s.kanal === "website" ? `PH-${s.nr}` : "",
      wallet_pass_aktualisiert: s.status === "Aktiv" && s.kanal === "website" ? isoDatumZeit(zeit(-7, "06:00")) : null,
      wallet_apple_erzeugt_am: s.nr === "KK-7K3QX9" ? isoDatumZeit(zeit(-120, "18:00")) : null,
      notizen_intern: s.nr === "KK-4HRW7C" ? "Bevorzugt Termine am Vormittag. Objekt am See, Montage über Projekte." : "",
      quelle: s.kanal === "website" ? "website" : "backoffice",
      creation: isoDatumZeit(zeit(erstellt, "10:00")),
      modified: isoDatumZeit(zeit(Math.max(erstellt, s.sperre?.t ?? -999, s.ende ?? -999, s.gekuendigt ?? -999, s.berechnet ?? -999), "11:00")),
    };
    t(DT.karte).set(s.nr, stempel(doc, erstellt, doc.ausgestellt_durch || "Administrator"));
  }

  // Kontakt-Spiegel (Custom Fields ph_kundenkarte_karte/_stufe), nur offene Karten
  for (const k of t(DT.karte).values()) {
    if (!["Aktiv", "Gesperrt", "Beantragt"].includes(k.status)) continue;
    const kontakt = t("PH Kontakt").get(k.kontakt);
    if (kontakt && !kontakt.ph_kundenkarte_karte) t("PH Kontakt").set(k.kontakt, { ...kontakt, ph_kundenkarte_karte: k.name, ph_kundenkarte_stufe: k.stufe });
  }
  // Ein Kassenbeleg „über Karte“ (Kartennummer am Beleg, Einkäufe-Tab)
  const kb = [...t("PH Kassenbeleg").values()].find((b) => b.kontakt && b.kontakt !== t(DT.karte).get("KK-7K3QX9")?.kontakt);
  if (kb) t("PH Kassenbeleg").set(kb.name, { ...kb, ph_kundenkarte_kartennummer: "KK-7K3QX9" });

  // Einlösungen
  let ne = 0;
  const belegFuer = (karte, dt) => {
    const k = t(DT.karte).get(karte);
    return [...t(dt).values()].find((b) => b.kontakt === k?.kontakt)?.name || [...t(dt).values()][0]?.name || null;
  };
  for (const e of SEED_EINLOESUNGEN) {
    ne++;
    const name = `PH-KKE-2026-${String(ne).padStart(5, "0")}`;
    const k = t(DT.karte).get(e.karte);
    const v = t(DT.vorteil).get(vName(e.v));
    const am = zeit(e.t, e.h);
    const bezug = e.beleg ? belegFuer(e.karte, e.beleg) : null;
    const doc = {
      doctype: DT.einloesung,
      name,
      naming_series: "PH-KKE-.YYYY.-.#####",
      titel: `${v.titel} · ${k.kunde_name} · ${isoDatum(am)}`,
      status: e.storno ? "Storniert" : "Eingeloest",
      kundenkarte: e.karte,
      kontakt: k.kontakt,
      kunde_name: k.kunde_name,
      vorteil: v.name,
      vorteil_titel: v.titel,
      stufe: k.stufe,
      eingeloest_am: isoDatumZeit(am),
      eingeloest_durch: e.durch,
      ort: e.ort,
      bezug_doctype: bezug ? e.beleg : null,
      bezug,
      kommentar: e.kommentar || "",
      storniert_am: e.storno ? isoDatumZeit(zeit(e.storno.t, "17:00")) : null,
      storniert_durch: e.storno?.durch || null,
      storno_grund: e.storno?.grund || null,
      quelle: ["Kassa", "Packtisch"].includes(e.ort) ? "kassa" : "backoffice",
      creation: isoDatumZeit(am),
      modified: isoDatumZeit(e.storno ? zeit(e.storno.t, "17:00") : am),
    };
    t(DT.einloesung).set(name, stempel(doc, e.t, e.durch));
  }
  for (let i = 0; i < ne; i++) naechste("PH-KKE-2026-");

  // Anträge
  let maxA = 0;
  for (const a of SEED_ANTRAEGE) {
    maxA = Math.max(maxA, a.n);
    const name = `PH-KKA-2026-${String(a.n).padStart(5, "0")}`;
    const kontakt = a.kontaktVon ? t(DT.karte).get(a.kontaktVon)?.kontakt : a.karte ? t(DT.karte).get(a.karte)?.kontakt : a.doppelt ? t(DT.karte).get(a.doppelt)?.kontakt : null;
    const eingang = zeit(a.t, a.h);
    const doc = {
      doctype: DT.antrag,
      name,
      naming_series: "PH-KKA-.YYYY.-.#####",
      titel: `${a.vor} ${a.nach}`,
      status: a.status,
      quelle: a.quelle,
      eingang: isoDatumZeit(eingang),
      kontakt: kontakt || null,
      kundenkarte: a.karte || null,
      startstufe: "Platzhirsch",
      anrede: "",
      vorname: a.vor,
      nachname: a.nach,
      email: a.email,
      telefon: "",
      plz: a.plz,
      ort: a.ort,
      sprache: "de",
      interessen: a.interessen || "",
      geburtstag_tag_monat: a.geb || "",
      nachricht: a.nachricht || "",
      vertragsdaten_akzeptiert: 1,
      bedingungen_version: "2026-11",
      einwilligung_auswertung: a.einw,
      einwilligung_textversion: a.einw ? "kundenkarte-auswertung-v1" : "",
      einwilligung_newsletter: a.news,
      newsletter_textversion: a.news ? "newsletter-v3" : "",
      einwilligung_zeitpunkt: isoDatumZeit(eingang),
      nachweis: a.nachweis ? `/private/files/nachweis-${a.n}.jpg` : "",
      nachweis_art: a.nachweis || "",
      doi_noetig: a.quelle === "website" ? (a.doi ?? 1) : 0,
      doi_gesendet_am: a.quelle === "website" ? isoDatumZeit(eingang) : null,
      bestaetigt_am: a.bestaetigt ? isoDatumZeit(zeit(a.t, a.bestaetigt)) : a.status === "Angenommen" && a.quelle === "website" ? isoDatumZeit(zeit(a.t, "10:10")) : null,
      bestaetigt_kanal: a.bestaetigt || a.status === "Angenommen" ? "website" : "",
      entschieden_am: a.entschieden !== undefined ? isoDatumZeit(zeit(a.entschieden, "10:30")) : null,
      entschieden_durch: a.entschieden !== undefined ? a.durch || "Administrator" : null,
      entscheidung_grund: a.grund || (a.doppelt ? `Karte bereits vorhanden: ${a.doppelt}` : ""),
      doppelt_zu: a.doppelt || null,
      utm_source: a.quelle === "website" ? "newsletter" : "",
      notizen_intern: "",
      creation: isoDatumZeit(eingang),
      modified: isoDatumZeit(a.entschieden !== undefined ? zeit(a.entschieden, "10:30") : eingang),
    };
    t(DT.antrag).set(name, stempel(doc, a.t));
  }
  while (naechste("PH-KKA-2026-") < maxA) {
    /* Zähler auf die höchste vergebene Nummer heben */
  }

  // Ereignisse (Protokoll je Karte)
  let nr = 0;
  const ev = (karte, tt, h, art, w = {}) => {
    nr++;
    const name = `kk-ev-${String(nr).padStart(4, "0")}`;
    const k = t(DT.karte).get(karte);
    t(DT.ereignis).set(name, stempel({ doctype: DT.ereignis, name, titel: `${art} · ${k?.kunde_name || karte}`, kundenkarte: karte, art, zeitpunkt: isoDatumZeit(zeit(tt, h)), von: w.automatisch ? "" : w.von || "kundenkarte@demo.local", alt: w.alt || "", neu: w.neu || "", jahresumsatz_cent: w.umsatz ?? null, hinweis: w.hinweis || "", automatisch: w.automatisch ? 1 : 0, creation: isoDatumZeit(zeit(tt, h)), modified: isoDatumZeit(zeit(tt, h)) }, tt));
  };
  for (const s of SEED_KARTEN) {
    const start = s.aus ?? s.angelegt ?? -1;
    ev(s.nr, start, "10:00", "Ausgestellt", { neu: s.aus === null ? "Beantragt" : "Aktiv", hinweis: s.vorg ? `Nachfolger von ${s.vorg}` : "Platzhirsch" });
    if (s.einw) ev(s.nr, start, "10:05", "Einwilligung", { hinweis: "Textversion kundenkarte-auswertung-v1 · Kanal Formular" });
    if (s.stufe !== "Platzhirsch" && !s.manuell && !s.vorg) ev(s.nr, s.seit, "03:30", "Stufenwechsel", { alt: s.stufe === "Platzhirsch Privé" ? "Platzhirsch Plus" : "Platzhirsch", neu: s.stufe, automatisch: 1, umsatz: s.umsatz });
    if (s.manuell) ev(s.nr, s.seit, "14:20", "Stufenwechsel", { alt: "Platzhirsch", neu: s.stufe, hinweis: "Stufe festgelegt – Grund: Objekt/Hotel", von: "admin@demo.local" });
    if (s.berechnet !== undefined) ev(s.nr, s.berechnet, "03:30", "Umsatz berechnet", { hinweis: `${Math.max(1, Math.round((s.umsatz || 0) / 400000))} Einkäufe berücksichtigt`, automatisch: 1, umsatz: s.umsatz });
    if (s.sperre) ev(s.nr, s.sperre.t, "10:12", "Sperrung", { alt: "Aktiv", neu: "Gesperrt", hinweis: `${s.sperre.art}${s.sperre.text ? ` – ${s.sperre.text}` : ""}` });
    if (s.nachf && s.status === "Ersetzt") ev(s.nr, s.ende, "11:00", "Ersatzkarte", { alt: "Gesperrt", neu: "Ersetzt", hinweis: `Verlust – neue Karte ${s.nachf}` });
    if (s.nachf && s.status === "Uebertragen") ev(s.nr, s.ende, "11:00", "Uebertragung", { alt: "Aktiv", neu: "Uebertragen", hinweis: `${s.uebertragung} → ${s.nachf}`, von: "admin@demo.local" });
    if (s.zus) ev(s.nr, s.ende, "11:00", "Zusammenfuehrung", { alt: "Aktiv", neu: "Zusammengefuehrt", hinweis: `in ${s.zus}`, von: "admin@demo.local" });
    if (s.gekuendigt !== undefined) ev(s.nr, s.gekuendigt, "12:00", "Kuendigung", { alt: "Aktiv", neu: "Gekuendigt", hinweis: "Kundenwunsch – Umzug ins Ausland" });
    if (s.status === "Aktiv" && s.aus !== null && s.kanal !== "website") ev(s.nr, s.aus, "15:00", "Uebergabe", { alt: "Beantragt", neu: "Aktiv", hinweis: "Showroom" });
  }
  for (const e of SEED_EINLOESUNGEN.filter((x) => x.storno)) ev(e.karte, e.storno.t, "17:00", "Einloesung storniert", { hinweis: e.storno.grund, von: e.storno.durch });

  // Aufgaben mit Bezug Kundenkarte (Geburtstag heute, Übergabe > 7 Tage) – nur ergänzen, PH Aufgabe gehört CRM
  const auf = t("PH Aufgabe");
  const aufgabe = (titel, karte, faellig, zugewiesen) => {
    if ([...auf.values()].some((a) => a.titel === titel && a.referenz_name === karte)) return;
    const n = naechste("PH-AUF-2026-");
    const name = `PH-AUF-2026-${String(n).padStart(5, "0")}`;
    const k = t(DT.karte).get(karte);
    auf.set(name, stempel({ doctype: "PH Aufgabe", name, naming_series: "PH-AUF-.YYYY.-.#####", titel, status: "Offen", faellig: isoDatum(tage(faellig)), zugewiesen_an: zugewiesen, referenz_doctype: DT.karte, referenz_name: karte, kontakt: k?.kontakt || "", quelle: "scheduler" }, faellig));
  };
  aufgabe("Geburtstag: Anna Muster – persönlich gratulieren (per Brief/Karte)", "KK-7K3QX9", 0, "kundenkarte@demo.local");
  aufgabe("Karte KK-9M2PT4 noch nicht übergeben", "KK-9M2PT4", -2, "kundenkarte@demo.local");
}
