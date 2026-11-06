// Mock-Seed – Bereich Projekte (G-01, MASTER § 3.5). Schreibt: Team B-PRJ.
// anzahl: Datensätze je DocType · kern: Fachwissen je DocType (Verteilung, Bezüge, Titel) nach der
// generischen Erzeugung · default: Nachlauf (db, hilfe) nach dem Grundaufbau, Reihenfolge über `nach`.
// Keine echten Personen, E-Mails @beispiel.invalid, runde Beispielbeträge (Q-A3). Zufall nur über `r`
// (fester Startwert); Reihenfolge der r-Aufrufe nicht ändern, sonst verschieben sich alle Folgedaten.
//
// Projekte-Nachlauf (B-PRJ, 04.11.2026): `anzahl`/`kern` bleiben wie vor P0-1 (gemeinsamer Zufall!). Der Nachlauf
// schreibt die zwölf generischen Projekte zu fachlich stimmigen Fällen um (gleiche Namen, damit Bezüge anderer
// Bereiche halten), legt zwei weitere an und baut alle Unterobjekte neu auf – je Status und Leer-/Fehlerfall
// mindestens ein Datensatz (10-konzept-projekte.md § 16.5 Schritt 1). Bilder: Kopien aus public/entwurf/lounge.

import { isoDatum, isoDatumZeit } from "../../format.js";
import { ORTE, tage } from "./basis.js";

/** Nachläufe anderer Bereiche, die vor diesem laufen müssen. */
export const nach = [];

/** Anzahl generischer Datensätze je DocType (nicht gelistete mit Status bekommen 6). */
export const anzahl = {
  "PH Projekt": 12,
  "PH Montageauftrag": 10,
};

/** Fachliche Nachbearbeitung je DocType: (doc, { i, r, ctx, person }) – ändert doc. */
export const kern = {
  "PH Projekt": (doc, { r, ctx, person }) => {
    doc.status = r.pick(["Anfrage", "Planung", "Planung", "Angebot", "Auftrag", "Bestellung", "Lieferung", "Montage", "Uebergabe", "Abgeschlossen"]);
    doc.projektart = r.pick(["Wohnung", "Haus", "Kueche", "Bad", "Hotel", "Objekt", "Outdoor"]);
    doc.titel = `${doc.projektart} ${doc.nachname || ctx.nachname} – ${r.pick(ORTE).split(" ").slice(1).join(" ")}`;
    doc.kunde_name = person;
    doc.eingang = isoDatumZeit(tage(-r.int(10, 200), r));
    doc.workflow_state = `PH ${doc.status}`;
  },
  "PH Montageauftrag": (doc, { i, r, person }) => {
    doc.status = i < 3 ? "Geplant" : r.pick(["Geplant", "Unterwegs", "In Arbeit", "Erledigt", "Abgenommen"]);
    doc.start = isoDatumZeit(tage(i < 3 ? i : r.int(-20, 20), r));
    doc.titel = `Montage ${person}`;
    doc.workflow_state = `PH ${doc.status}`;
  },
};

// ------------------------------------------------------------------ Bausteine --

const BILD = (n) => `/entwurf/lounge/${n}`;
const LEITUNG = "projekte@demo.local";
const BERATER2 = "crm-leitung@demo.local";
const PLANER = "crm@demo.local";
const MONTAGELEITER = "montage@demo.local";
const MONTEUR = "techniker@demo.local";

/** Zeitpunkt relativ zum 04.11.2026 mit fester Uhrzeit. */
function zp(tag, hh = 9, mm = 0) {
  const d = tage(tag);
  d.setHours(hh, mm, 0, 0);
  return isoDatumZeit(d);
}
const dt = (tag) => isoDatum(tage(tag));

const PHASEN = ["Anfrage", "Planung", "Angebot", "Auftrag", "Bestellung", "Lieferung", "Montage", "Uebergabe", "Abgeschlossen"];

/** Positionen je Fall: [raum, bezeichnung, marke, menge, lieferstatus, montage_art, vk €, ek €, liefertermin-Tag?] */
const POS = {
  kueche: [
    ["Küche", "Küchenzeile Eiche geräuchert, 3,2 m", "Poliform", 1, "geliefert", "Eigenmontage", 48000, 31000, -6],
    ["Küche", "Kochinsel mit Arbeitsplatte Naturstein", "Poliform", 1, "geliefert", "Eigenmontage", 22000, 14500, -6],
    ["Küche", "Hochschrank mit Einbaugeräten", "Poliform", 2, "geliefert", "Eigenmontage", 9800, 6200, -6],
    ["Essen", "Esstisch Eiche 220", "Poliform", 1, "geliefert", "Eigenmontage", 6400, 3900, -3],
    ["Essen", "Pendelleuchte Glas", "Flos", 2, "geliefert", "Fremdgewerk", 1800, 1050, -3],
  ],
  haus: [
    ["Wohnen", "Sofalandschaft Leder Cognac", "Minotti", 1, "geliefert", "Eigenmontage", 38400, 24600, -8],
    ["Wohnen", "Couchtisch Travertin", "Minotti", 1, "geliefert", "Eigenmontage", 5200, 3300, -8],
    ["Essen", "Esstisch Eiche 300 cm", "Cassina", 1, "geliefert", "Eigenmontage", 14800, 9200, -8],
    ["Schlafen", "Bett Polster 180", "Flexform", 1, "geliefert", "Eigenmontage", 7600, 4700, -5],
    ["Terrasse", "Outdoor-Lounge 7-teilig", "Minotti", 1, "geliefert", "Eigenmontage", 21500, 13800, -5],
    ["Wohnen", "Regal System 3", "Vitra", 2, "montiert", "Eigenmontage", 4200, 2600, -12],
  ],
  bad: [
    ["Bad", "Waschtisch Naturstein 140", "Ezarri", 1, "montiert", "Eigenmontage", 6800, 4100, -14],
    ["Bad", "Mosaik Mix 2,5 (m²)", "Ezarri", 12, "montiert", "Eigenmontage", 3600, 2100, -14],
    ["Bad", "Spiegelschrank beleuchtet", "Vitra", 1, "montiert", "Eigenmontage", 2400, 1500, -14],
    ["Bad", "Armaturen-Set", "Vitra", 1, "montiert", "Fremdgewerk", 1900, 1200, -14],
  ],
  wohnung: [
    ["Wohnen", "Sofa Modul 240", "Minotti", 1, "offen", "Eigenmontage", 18600, 11900, null],
    ["Wohnen", "Sessel Lounge", "ClassiCon", 2, "offen", "Eigenmontage", 7400, 4600, null],
    ["Essen", "Esstisch Eiche 220", "Poliform", 1, "offen", "Eigenmontage", 6400, 3900, null],
  ],
  hotel: [
    ["Suite", "Bett Polster 180", "Flexform", 6, "offen", "Eigenmontage", 7600, 4700, null],
    ["Lobby", "Loungechair Outdoor", "Walter Knoll", 8, "offen", "Eigenmontage", 3200, 2000, null],
  ],
  outdoor: [
    ["Terrasse", "Loungechair Outdoor", "Walter Knoll", 4, "bestaetigt", "Eigenmontage", 3200, 2000, 18],
    ["Terrasse", "Outdoor-Lounge 5-teilig", "Minotti", 1, "bestellt", "Eigenmontage", 16400, 10500, null],
    ["Garten", "Pendelleuchte Outdoor", "Flos", 3, "bestaetigt", "Fremdgewerk", 1500, 900, 18],
  ],
  teil: [
    ["Küche", "Küchenzeile Lack matt, 4,0 m", "Poliform", 1, "geliefert", "Eigenmontage", 39000, 25500, -4],
    ["Küche", "Kochinsel Eiche", "Poliform", 1, "teilgeliefert", "Eigenmontage", 18000, 11600, -4],
    ["Küche", "Hochschrank mit Kühlgerät", "Poliform", 1, "bestellt", "Eigenmontage", 7200, 4600, 35],
    ["Essen", "Bank Eiche massiv", "Poliform", 1, "storniert", "Eigenmontage", 2800, 1700, null],
  ],
};

/** Fälle je Projekt (Reihenfolge = Reihenfolge der generischen Namen, danach zwei neue). */
const FAELLE = [
  { titel: "Küche am See", art: "Kueche", status: "Lieferung", kunde: "Familie Muster", strasse: "Seestraße 12", plz: "6911", ort: "Lochau", bild: "r-kueche-eiche.jpg", pos: "kueche", prio: "Hoch", berater: LEITUNG, liefer: -3, kurz: "Wohnküche mit Kochinsel und Essplatz, Eiche geräuchert, Blick zum See." },
  { titel: "Haus am See", art: "Haus", status: "Montage", kunde: "Familie Beispiel", strasse: "Uferweg 4", plz: "6911", ort: "Lochau", bild: "r-hero-essraum.jpg", pos: "haus", prio: "Hoch", berater: LEITUNG, liefer: -8, kurz: "Wohnen, Essen, Schlafen und Terrasse in einem Durchgang; Montage in zwei Tagen." },
  { titel: "Bad Bregenz", art: "Bad", status: "Montage", kunde: "Herr Probe", strasse: "Kirchstraße 9", plz: "6900", ort: "Bregenz", bild: "r-bad.webp", pos: "bad", prio: "Normal", berater: LEITUNG, liefer: -14, kurz: "Masterbad mit Naturstein-Waschtisch und Mosaik." },
  { titel: "Penthouse Wohnen", art: "Wohnung", status: "Planung", kunde: "Dr. Vorlage", strasse: "Rheinstraße 21", plz: "6900", ort: "Bregenz", bild: "r-wohnen-sofa.jpg", pos: "wohnung", prio: "Normal", berater: LEITUNG, liefer: null, kurz: "Wohnbereich mit Sofalandschaft und Essplatz, zwei Varianten in Abstimmung." },
  { titel: "Suiten & Lobby", art: "Hotel", status: "Planung", kunde: "Hotel Seeblick (Beispiel)", strasse: "Promenade 1", plz: "88131", ort: "Lindau", bild: "r-terrasse-hotel.jpg", pos: "hotel", prio: "Hoch", berater: BERATER2, liefer: null, kurz: "Sechs Suiten und Lobby, Bemusterung im Showroom." },
  { titel: "Terrasse Seeblick", art: "Outdoor", status: "Angebot", kunde: "Familie Testner", strasse: "Bergweg 3", plz: "6971", ort: "Hard", bild: "r-terrasse-see.jpg", pos: "outdoor", prio: "Normal", berater: LEITUNG, liefer: null, kurz: "Outdoor-Lounge und Beleuchtung für die Seeterrasse." },
  { titel: "Wohnen Dornbirn", art: "Wohnung", status: "Anfrage", kunde: "Frau Demo", strasse: "Marktstraße 5", plz: "6850", ort: "Dornbirn", bild: null, pos: null, prio: "Niedrig", berater: LEITUNG, liefer: null, kurz: "Wohnzimmer neu einrichten, Beratung im Showroom gewünscht." },
  { titel: "Masterbad Hard", art: "Bad", status: "Uebergabe", kunde: "Familie Schema", strasse: "Landstraße 40", plz: "6971", ort: "Hard", bild: "r-essen-licht.jpg", pos: "bad", prio: "Normal", berater: LEITUNG, liefer: -30, kurz: "Masterbad, Abnahme mit einem Vorbehalt." },
  { titel: "Garten-Lounge Kreuzlingen", art: "Outdoor", status: "Bestellung", kunde: "Herr Platzhalter", strasse: "Hafenstrasse 8", plz: "8280", ort: "Kreuzlingen", land: "Schweiz", bild: "r-garten-lounge.jpg", pos: "outdoor", prio: "Normal", berater: BERATER2, liefer: 18, kurz: "Garten-Lounge für ein Haus am Untersee; Montage in der Schweiz." },
  { titel: "Essraum Lindau", art: "Haus", status: "Abgeschlossen", kunde: "Familie Mustermann", strasse: "Inselgasse 2", plz: "88131", ort: "Lindau", bild: "r-schlafen.webp", pos: "haus", prio: "Normal", berater: LEITUNG, liefer: -60, kurz: "Essraum und Schlafzimmer, übergeben im September." },
  { titel: "Büro Feldkirch", art: "Objekt", status: "Abgebrochen", kunde: "Vorlage Immobilien (Beispiel)", strasse: "Neustadt 15", plz: "6800", ort: "Feldkirch", bild: null, pos: "wohnung", prio: "Niedrig", berater: BERATER2, liefer: null, kurz: "Besprechungsraum und Empfang.", grund: "Kunde hat das Projekt verschoben (Budget 2027)." },
  { titel: "Küche Hard", art: "Kueche", status: "Lieferung", kunde: "Familie Musterfrau", strasse: "Seestraße 77", plz: "6971", ort: "Hard", bild: "r-kueche-eiche.jpg", pos: "teil", prio: "Normal", berater: LEITUNG, liefer: -4, kurz: "Küche mit Insel; Hochschrank kommt nach (Nachlieferung)." },
  { titel: "Yacht Salon", art: "Yacht", status: "Auftrag", kunde: "Herr Testner", strasse: "Hafen Lochau, Steg 3", plz: "6911", ort: "Lochau", bild: null, pos: "wohnung", prio: "Normal", berater: BERATER2, liefer: 40, kurz: "Salon einer Motoryacht, Polster nach Maß." },
  { titel: "Wohnung Innsbruck", art: "Wohnung", status: "Anfrage", kunde: "Frau Beispiel", strasse: "Museumstraße 2", plz: "6020", ort: "Innsbruck", bild: null, pos: null, prio: "Normal", berater: BERATER2, liefer: null, kurz: "Altbauwohnung, Termin im Showroom hat stattgefunden." },
];

// ------------------------------------------------------------------ Nachlauf --

/**
 * Nachlauf: Projekte und alle Unterobjekte. Eigener Zufall über hilfe.rng (hier kaum genutzt – Daten sind fest).
 * @param {Map<string, Map<string, object>>} db
 * @param {import("./index.js").SeedHilfe} hilfe
 */
export default function nachlauf(db, hilfe) {
  const { index, tabelle, naechste, neuerName } = hilfe;
  const meta = (dt) => index.doctypes.get(dt);
  if (!meta("PH Projekt")) return;
  const wf = (dt, status) => {
    const w = index.workflows.get(dt);
    if (!w) return undefined;
    const s = w.states.find((x) => x.updateValue === status);
    return s?.state;
  };
  const kinder = (doc, feld, kindDt, zeilen) => {
    doc[feld] = zeilen.map((z, i) => ({ name: `${feld}-${doc.name}-${i + 1}`, doctype: kindDt, idx: i + 1, parentfield: feld, parenttype: doc.doctype, parent: doc.name, ...z }));
  };
  const stempel = (doc, tag) => Object.assign(doc, { owner: LEITUNG, creation: zp(tag, 8), modified: zp(Math.min(0, tag + 1), 10), modified_by: LEITUNG, docstatus: doc.docstatus ?? 0, idx: 0 });
  const neu = (dt, werte, tag = -5) => {
    const m = meta(dt);
    if (!m) return null;
    const doc = { doctype: dt, ...werte };
    const datum = tage(tag);
    doc.name = doc.name || neuerName(m, doc, naechste, datum);
    if (!doc.workflow_state) {
      const s = wf(dt, doc.status);
      if (s) doc.workflow_state = s;
    }
    stempel(doc, tag);
    tabelle(dt).set(doc.name, doc);
    return doc;
  };
  const leere = (dt) => tabelle(dt).clear();

  // Kontakte (aus CRM) – nur lesen, nie ändern.
  const kontakte = [...(db.get("PH Kontakt")?.values() || [])];
  const kontaktVon = (i) => kontakte[i % Math.max(kontakte.length, 1)]?.name || "";

  // Einstellungen (Single des Bereichs)
  const einst = tabelle("PH Projekte Einstellungen").get("PH Projekte Einstellungen");
  if (einst) {
    Object.assign(einst, {
      feedback_erinnerung_tage: 3, max_audio_mb: 5, max_fotos_je_projekt: 120, tagebuch_aktiv: 1, referenz_freigabe_aktiv: 1, portal_token_tage: 30,
      montage_tagesstunden: 8, maengel_erinnerung_tage: 3, liefertermin_kunde_automatisch: 0, montage_kostensatz_cent: 5800,
      haftungshinweis_fremdgewerke: "Fremdgewerke führen ihre Leistung in eigener Verantwortung aus (Beispieltext).",
      budget_gelb_prozent: 90, budget_rot_prozent: 100, ampel_gelb_unter: 0, ampel_rot_unter: 5, abweichung_kommentar_prozent: 10, kalkulation_warnung_aktiv: 1, budget_bei_auftrag_vorbelegen: 1, kalkulation_eingerichtet: 0,
    });
    einst.doctype = "PH Projekte Einstellungen";
    einst.name = "PH Projekte Einstellungen";
    kinder(einst, "kostensaetze", "PH Kostensatz", [
      ["Montage", 5800], ["Fahrt", 4500], ["Planung", 7500], ["Beratung", 7500], ["Projektleitung", 8000], ["Aufmass", 6500], ["Koordination", 8000],
    ].map(([taetigkeit, satz_cent]) => ({ taetigkeit, satz_cent, gueltig_ab: "2026-01-01", platzhalter: 1, notiz: "Beispielsatz – Satz vom Inhaber offen" })));
    kinder(einst, "ziel_db", "PH Kalkulation Ziel", [{ projektart: "Alle", ziel_db1: 35, ziel_db2: 25, ziel_db3: 15, gueltig_ab: "2026-01-01", notiz: "Beispielziel" }]);
    kinder(einst, "gemeinkosten_regeln", "PH Gemeinkosten Regel", [{ projektart: "Alle", art: "Aus", prozent: 0, gueltig_ab: "2026-01-01" }]);
  }

  // Kostenarten (Standard aus install.py)
  if (meta("PH Kostenart")) {
    leere("PH Kostenart");
    [["Ware", "Wareneinsatz", "DB1", 10], ["Fracht", "Fracht", "DB1", 20], ["Montage eigen", "Montage eigen", "DB2", 30], ["Montage extern", "Montage extern", "DB2", 40], ["Fremdgewerk", "Fremdgewerk", "DB2", 50], ["Material", "Material", "DB2", 60], ["Entsorgung", "Entsorgung", "DB2", 70], ["Sonstiges", "Sonstiges", "DB2", 80], ["Planung extern", "Planung extern", "DB3", 90], ["Planung intern", "Planung intern", "DB3", 100], ["Nachlauf", "Nachlauf", "DB3", 110]].forEach(([kostenart, bezeichnung, db_stufe, reihenfolge]) =>
      neu("PH Kostenart", { name: kostenart, kostenart, bezeichnung, db_stufe, reihenfolge, aktiv: 1 }, -120)
    );
  }

  // Projekte
  const projekte = [...tabelle("PH Projekt").values()];
  while (projekte.length < FAELLE.length) {
    const p = neu("PH Projekt", { titel: "neu", projektart: "Wohnung", status: "Anfrage", eingang: zp(-3) }, -3);
    projekte.push(p);
  }
  const P = projekte.slice(0, FAELLE.length);
  P.forEach((p, i) => {
    const f = FAELLE[i];
    const pi = PHASEN.indexOf(f.status);
    const bis = f.status === "Abgebrochen" ? 2 : pi;
    const start = -120 + i * 4;
    const phasen = [];
    for (let k = 0; k <= bis; k++) phasen.push({ phase: PHASEN[k], datum: zp(start + Math.round(((-1 - start) * k) / Math.max(bis, 1)), 9 + (k % 6)), von: k >= 5 && k <= 7 ? "Administrator" : f.berater, notiz: k >= 5 && k <= 7 ? "System: Folgeobjekt" : "" });
    if (f.status === "Abgebrochen") phasen.push({ phase: "Abgebrochen", datum: zp(-20, 11), von: LEITUNG, notiz: f.grund });
    const kontakt = kontaktVon(i * 3 + 1);
    Object.assign(p, {
      titel: f.titel, projektart: f.art, status: f.status, prioritaet: f.prio, eingang: zp(start, 10), kontakt, kunde_name: f.kunde, anfrage: "",
      berater: f.berater, planer: PLANER, montageleiter: MONTAGELEITER, kurzbeschreibung: f.kurz, raum: "",
      objekt_strasse: f.strasse, objekt_plz: f.plz, objekt_ort: f.ort, objekt_land: f.land || "Österreich", objekt_hinweis: i === 0 ? "Hintereingang, Lift bis 2. OG" : "", baustelle_kontakt: f.kunde, baustelle_telefon: "+43 5574 00000",
      liefertermin_geplant: f.liefer === null ? "" : dt(f.liefer), montage_von: "", montage_bis: "", uebergabe_am: "", abgeschlossen_am: f.status === "Abgeschlossen" ? dt(-35) : "", abgebrochen_grund: f.grund || "",
      portal_sichtbar: f.status === "Anfrage" ? 0 : 1, portal_positionen_preise: 0, ki_generiert_hinweis: i === 3 ? 1 : 0, portal_hinweis: "", abnahme: "", waehrung: "EUR",
      ware_komplett: i === 0 || i === 1 ? 1 : 0, ware_komplett_am: i === 0 ? dt(-3) : "", ware_fehlend: i === 11 ? "Hochschrank mit Kühlgerät (Nachlieferung)" : "",
      notiz_intern: i === 0 ? "Kunde wünscht Montage vor dem 1. Advent." : "", kalk_budget_eingefroren_am: pi >= 3 ? zp(start + 40) : "", workflow_state: f.status === "Abgeschlossen" ? "PH Abgeschlossen" : f.status === "Abgebrochen" ? "PH Abgebrochen" : wf("PH Projekt", f.status) || `PH Phase ${f.status}`,
    });
    kinder(p, "phasen_verlauf", "PH Projekt Phase", phasen);
    kinder(p, "team", "PH Projekt Team", [{ user: f.berater, rolle: "Berater" }, { user: PLANER, rolle: "Planer" }, { user: MONTAGELEITER, rolle: "Montageleiter" }, ...(pi >= 5 ? [{ user: MONTEUR, rolle: "Monteur" }] : [])]);
    const positionen = (POS[f.pos] || []).map(([raum, bezeichnung, marke, menge, lieferstatus, montage_art, vk, ek, lt], k) => {
      let ls = lieferstatus;
      if (pi <= 3 && f.status !== "Abgebrochen") ls = "offen";
      if (f.status === "Abgeschlossen" || f.status === "Uebergabe") ls = lieferstatus === "storniert" ? "storniert" : "montiert";
      return {
        pos_nr: String(k + 1), raum, bezeichnung, marke, menge, montage_art, lieferstatus: ls,
        status: ls === "montiert" ? "montiert" : ls === "geliefert" ? "geliefert" : ["bestellt", "bestaetigt", "teilgeliefert"].includes(ls) ? "bestellt" : pi >= 2 ? "angeboten" : "geplant",
        preis_cent: vk * 100, ek_cent: ek * 100, menge_bestellt: ["offen"].includes(ls) ? 0 : menge, menge_geliefert: ["geliefert", "montiert"].includes(ls) ? menge : ls === "teilgeliefert" ? Math.max(0, menge - 1) || 0 : 0,
        menge_montiert: ls === "montiert" ? menge : 0, liefertermin: lt === null || lt === undefined ? "" : dt(lt),
        nachlieferung_noetig: i === 11 && k === 2 ? 1 : 0, nachlieferung_menge: i === 11 && k === 2 ? 1 : 0, nachlieferung_grund: i === 11 && k === 2 ? "Kühlgerät vom Hersteller verschoben" : "", nachlieferung_termin: i === 11 && k === 2 ? dt(35) : "",
        produktpass: "",
      };
    });
    kinder(p, "positionen", "PH Projekt Position", positionen);
    kinder(p, "raeume", "PH Projekt Raum", [...new Set(positionen.map((x) => x.raum))].map((raum) => ({ raum, status: pi >= 6 ? "montiert" : pi >= 5 ? "geliefert" : pi >= 3 ? "beauftragt" : "geplant" })));
    const ekWare = positionen.filter((x) => x.lieferstatus !== "storniert").reduce((s, x) => s + x.ek_cent * x.menge, 0);
    kinder(p, "kalk_budget", "PH Projekt Budget", pi >= 3 || f.status === "Abgebrochen" ? [
      { kostenart: "Ware", budget_auftrag_cent: ekWare, budget_aktuell_cent: ekWare + (i === 1 ? 180000 : 0), quelle: "EK der Positionen" },
      { kostenart: "Montage eigen", budget_auftrag_cent: 16 * 5800 * (positionen.length > 3 ? 2 : 1), budget_aktuell_cent: 16 * 5800 * (positionen.length > 3 ? 2 : 1), quelle: "geplante Montagestunden" },
      { kostenart: "Fracht", budget_auftrag_cent: 60000, budget_aktuell_cent: 60000, quelle: "Speditionsanfrage" },
      { kostenart: "Planung intern", budget_auftrag_cent: 12 * 7500, budget_aktuell_cent: 12 * 7500, quelle: "Planungsstunden" },
    ] : []);
  });

  // Montageaufträge: generische Namen behalten, Inhalt neu
  const mon = [...tabelle("PH Montageauftrag").values()];
  const MON = [
    { p: 1, status: "In Arbeit", tag: 0, von: [8, 0], bis: [16, 0], team: [MONTAGELEITER, MONTEUR], std: 8, ist: [8, 12] },
    { p: 1, status: "Geplant", tag: 1, von: [8, 0], bis: [15, 0], team: [MONTAGELEITER, MONTEUR], std: 7 },
    { p: 2, status: "Erledigt", tag: -1, von: [7, 30], bis: [15, 30], team: [MONTAGELEITER], std: 8, ist: [7, 40], ende: [15, 10] },
    { p: 7, status: "Abgenommen", tag: -9, von: [8, 0], bis: [16, 0], team: [MONTAGELEITER, MONTEUR], std: 8, ist: [8, 5], ende: [15, 50] },
    { p: 9, status: "Abgenommen", tag: -40, von: [8, 0], bis: [16, 0], team: [MONTAGELEITER, MONTEUR], std: 8, ist: [8, 0], ende: [16, 20] },
    { p: 10, status: "Abgebrochen", tag: -25, von: [8, 0], bis: [12, 0], team: [MONTAGELEITER], std: 4, grund: "Projekt vom Kunden verschoben" },
    { p: 9, status: "Abgenommen", tag: -42, von: [8, 0], bis: [12, 0], team: [MONTEUR], std: 4, ist: [8, 0], ende: [12, 0] },
    { p: 1, status: "Geplant", tag: 7, von: [9, 0], bis: [12, 0], team: [MONTEUR], std: 3 },
    { p: 11, status: "Unterwegs", tag: 0, von: [7, 30], bis: [12, 0], team: [MONTEUR], std: 4.5 },
    { p: 11, status: "Geplant", tag: 3, von: [8, 0], bis: [16, 0], team: [MONTAGELEITER, MONTEUR], std: 8 },
  ];
  mon.forEach((m, k) => {
    const s = MON[k];
    if (!s) return;
    const p = P[s.p];
    const f = FAELLE[s.p];
    const posGeliefert = (p.positionen || []).filter((x) => ["geliefert", "teilgeliefert", "montiert"].includes(x.lieferstatus) && (!x.montage_art || x.montage_art === "Eigenmontage"));
    const fertig = ["Erledigt", "Abgenommen"].includes(s.status);
    Object.keys(m).forEach((key) => {
      if (!["name", "doctype", "naming_series", "owner", "creation", "modified", "modified_by", "docstatus", "idx"].includes(key)) delete m[key];
    });
    Object.assign(m, {
      titel: `Montage ${f.titel}`, projekt: p.name, kontakt: p.kontakt, status: s.status, workflow_state: wf("PH Montageauftrag", s.status) || `PH ${s.status}`,
      start: zp(s.tag, ...s.von), ende: zp(s.tag, ...s.bis), montageleiter: MONTAGELEITER, fahrzeug: k % 2 ? "Bus 2" : "Bus 1",
      strasse: f.strasse, plz: f.plz, ort: f.ort, hinweis_ort: s.p === 1 ? "Zufahrt über den Uferweg, Parken vor der Garage." : "", kunde_anwesend: f.kunde, telefon_vor_ort: "+43 5574 00000",
      sprache_bericht: "de", bericht: fertig ? "Montage ohne Besonderheiten abgeschlossen. Schutzfolien entfernt, Verpackung mitgenommen." : "",
      stunden_geplant: s.std, stunden_ist: fertig ? s.std - 0.5 : s.status === "In Arbeit" ? 3 : 0,
      tatsaechlich_start: s.ist ? zp(s.tag, ...s.ist) : "", tatsaechlich_ende: s.ende ? zp(s.tag, ...s.ende) : "",
      unterschrift_kunde: s.status === "Abgenommen" ? "data:image/png;base64,iVBORw0KGgo=" : "", unterschrift_name: s.status === "Abgenommen" ? f.kunde : "", unterschrift_am: s.status === "Abgenommen" ? zp(s.tag, 16) : "",
      abgenommen_am: s.status === "Abgenommen" ? zp(s.tag, 16) : "", abbruch_grund: s.grund || "", kollisionen: "", quelle: "backoffice",
    });
    kinder(m, "team", "PH Montage Team", s.team.map((user, j) => ({ user, rolle: j === 0 && user === MONTAGELEITER ? "Montageleiter" : "Monteur", stunden_ist: fertig ? s.std - 0.5 : 0 })));
    kinder(m, "leistungen", "PH Montage Leistung", posGeliefert.slice(0, 6).map((x, j) => ({ beschreibung: `${x.bezeichnung} · ${x.raum}`, dauer_h_geplant: Math.round((s.std / Math.max(posGeliefert.length, 1)) * 4) / 4, dauer_h_ist: fertig ? Math.round((s.std / Math.max(posGeliefert.length, 1)) * 4) / 4 : 0, erledigt: fertig || (s.status === "In Arbeit" && j < 2) ? 1 : 0, position: x.name })));
    kinder(m, "unterlagen", "PH Montage Unterlage", s.p === 11 && k === 8 ? [] : [{ titel: `Plan ${f.titel} v3.pdf`, datei: "/private/files/plan.pdf" }]);
    kinder(m, "fotos", "PH Montage Foto", fertig || s.status === "In Arbeit" ? [{ art: "vorher", bild: BILD("r-essen-licht.jpg"), aufgenommen_am: zp(s.tag, 8, 20), kunde_sichtbar: 0 }, ...(fertig ? [{ art: "nachher", bild: f.bild ? BILD(f.bild) : BILD("r-wohnen-sofa.jpg"), aufgenommen_am: zp(s.tag, 15), kunde_sichtbar: 1 }] : [])] : []);
    kinder(m, "maengel", "PH Montage Mangel", s.p === 1 && k === 0 ? [{ beschreibung: "Fuge an der Arbeitsplatte nacharbeiten", frist: dt(5), verantwortlich: "Studio", status: "offen" }] : s.p === 2 ? [{ beschreibung: "Spiegelschrank – Leuchte flackert", frist: dt(-1), verantwortlich: "Lieferant", verantwortlich_ref: "Vitra", status: "offen" }, { beschreibung: "Silikonfuge Dusche", frist: dt(-3), verantwortlich: "Studio", status: "behoben", behoben_am: dt(-1) }] : []);
  });
  const montagen = mon.slice(0, MON.length);
  const jeProjekt = new Map();
  montagen.forEach((m, k) => {
    if (!MON[k] || m.status === "Abgebrochen") return;
    const l = jeProjekt.get(MON[k].p) || [];
    l.push(m);
    jeProjekt.set(MON[k].p, l);
  });
  for (const [pi, liste] of jeProjekt) {
    P[pi].montage_von = liste.map((m) => m.start.slice(0, 10)).sort()[0];
    P[pi].montage_bis = liste.map((m) => m.ende.slice(0, 10)).sort().at(-1);
  }

  // Abnahmen
  leere("PH Abnahme");
  const abn7 = neu("PH Abnahme", { titel: `Schlussabnahme ${FAELLE[7].titel}`, projekt: P[7].name, kontakt: P[7].kontakt, montageauftrag: montagen[3]?.name || "", status: "Mit Maengeln", datum: dt(-9), ort: FAELLE[7].ort, sprache: "de", anwesend_kunde: FAELLE[7].kunde, anwesend_studio: MONTAGELEITER, maengel_offen: 1, abnahme_erklaert: 1, vorbehalte: "Spiegelschrank: Kratzer an der Seitenwand", unterschrift_kunde: "data:image/png;base64,iVBORw0KGgo=", unterschrift_kunde_name: FAELLE[7].kunde, unterschrift_studio: "data:image/png;base64,iVBORw0KGgo=", unterzeichnet_am: zp(-9, 16, 2), quelle: "backoffice" }, -9);
  kinder(abn7, "positionen", "PH Abnahme Position", [
    { bezeichnung: "Waschtisch Naturstein 140", zustand: "ok" },
    { bezeichnung: "Mosaik Mix 2,5 (m²)", zustand: "ok" },
    { bezeichnung: "Spiegelschrank beleuchtet", zustand: "Mangel", beschreibung: "Kratzer 3 cm an der Seitenwand", frist: dt(-2), verantwortlich: "Lieferant", verantwortlich_ref: "Vitra", erledigt: 0 },
    { bezeichnung: "Armaturen-Set", zustand: "Nacharbeit", beschreibung: "Eckventil nachziehen", frist: dt(-6), verantwortlich: "Fremdgewerk", erledigt: 1, erledigt_am: dt(-5) },
  ]);
  P[7].abnahme = abn7.name;
  P[7].uebergabe_am = dt(-9);
  const abn9 = neu("PH Abnahme", { titel: `Schlussabnahme ${FAELLE[9].titel}`, projekt: P[9].name, kontakt: P[9].kontakt, montageauftrag: montagen[4]?.name || "", status: "Abgeschlossen", datum: dt(-40), ort: FAELLE[9].ort, sprache: "de", anwesend_kunde: FAELLE[9].kunde, anwesend_studio: MONTAGELEITER, maengel_offen: 0, abnahme_erklaert: 1, unterschrift_kunde: "data:image/png;base64,iVBORw0KGgo=", unterschrift_kunde_name: FAELLE[9].kunde, unterschrift_studio: "data:image/png;base64,iVBORw0KGgo=", unterzeichnet_am: zp(-40, 16, 20), abgeschlossen_am: zp(-35, 10), quelle: "backoffice" }, -40);
  kinder(abn9, "positionen", "PH Abnahme Position", (P[9].positionen || []).map((x) => ({ bezeichnung: x.bezeichnung, zustand: "ok" })));
  P[9].abnahme = abn9.name;
  P[9].uebergabe_am = dt(-40);

  // Fremdgewerke
  leere("PH Fremdgewerk");
  const gew = (pi, werte, termine = [], maengel = [], tag = -15) => {
    const g = neu("PH Fremdgewerk", { titel: `${werte.gewerk} · ${FAELLE[pi].titel}`, projekt: P[pi].name, kunde_sichtbar: 1, vertrag_direkt_kunde: 0, telefon: "+43 5574 11111", email: `${werte.gewerk.toLowerCase()}@beispiel.invalid`, haftungshinweis: "Fremdgewerke führen ihre Leistung in eigener Verantwortung aus (Beispieltext).", quelle: "backoffice", ...werte }, tag);
    kinder(g, "termine", "PH Fremdgewerk Termin", termine);
    kinder(g, "maengel", "PH Montage Mangel", maengel);
    return g;
  };
  const g0 = gew(0, { gewerk: "Elektriker", status: "Geplant", partner_text: "Elektro Muster (Beispiel)", ansprechpartner: "Herr Muster", leistung: "Anschluss Kochfeld, Pendelleuchten", termin_von: zp(6, 8), termin_bis: zp(6, 12), kosten_cent: 120000, abnahme_status: "offen" }, [{ art: "Vorinstallation", von: zp(6, 8), bis: zp(6, 12), status: "bestaetigt" }]);
  gew(1, { gewerk: "Installateur", status: "Erledigt", partner_text: "Installation Beispiel", ansprechpartner: "Frau Beispiel", leistung: "Wasseranschluss Küche", termin_von: zp(-6, 8), termin_bis: zp(-6, 14), kosten_cent: 85000, abnahme_status: "abgenommen", abgenommen_am: zp(-6, 15), abgenommen_von: MONTAGELEITER }, [{ art: "Montage", von: zp(-6, 8), bis: zp(-6, 14), status: "erledigt" }]);
  gew(1, { gewerk: "Steinmetz", status: "In Arbeit", partner_text: "Stein Probe (Beispiel)", ansprechpartner: "Herr Probe", leistung: "Arbeitsplatte Naturstein zuschneiden", termin_von: zp(-1, 8), termin_bis: zp(1, 12), kosten_cent: 240000, abnahme_status: "offen" }, [{ art: "Montage", von: zp(-1, 8), bis: zp(1, 12), status: "bestaetigt" }], [{ beschreibung: "Kante an der Spüle nachpolieren", frist: dt(2), verantwortlich: "Fremdgewerk", status: "offen" }]);
  gew(11, { gewerk: "Maler", status: "Angefragt", partner_text: "Malerei Demo", ansprechpartner: "Frau Demo", leistung: "Wand hinter der Küchenzeile streichen", termin_von: zp(2, 8), termin_bis: zp(4, 17), kosten_cent: 60000, abnahme_status: "offen", abhaengigkeit_hinweis: "Muss vor der Montage fertig sein" }, [{ art: "Vorinstallation", von: zp(2, 8), bis: zp(4, 17), status: "geplant" }]);
  gew(3, { gewerk: "Tischler", status: "Offen", partner_text: "Tischlerei Vorlage", ansprechpartner: "Herr Vorlage", leistung: "Einbauschrank Flur nach Maß", kosten_cent: 0, vertrag_direkt_kunde: 1 });
  void g0;

  // Planungen
  leere("PH Planung");
  const pl = (pi, werte, tag) => neu("PH Planung", { titel: `${werte.bezeichnung} v${werte.version}`, projekt: P[pi].name, quelle_planung: "CAD", planer: PLANER, kunde_sichtbar: werte.status === "Entwurf" ? 0 : 1, quelle: "backoffice", ...werte }, tag);
  pl(0, { bezeichnung: "Küche Variante Insel", version: 3, status: "Freigegeben", quelle_planung: "Kuechenplaner", vorschau: BILD("r-kueche-eiche.jpg"), kunde_entscheidung: "freigegeben", freigabe_quelle: "portal", freigabe_durch_kunde_am: zp(-50, 18), vorgelegt_am: zp(-52, 10) }, -55);
  pl(1, { bezeichnung: "Wohnen & Essen", version: 2, status: "Freigegeben", vorschau: BILD("r-hero-essraum.jpg"), kunde_entscheidung: "freigegeben", freigabe_quelle: "backoffice", vorgelegt_am: zp(-70, 10) }, -72);
  pl(2, { bezeichnung: "Masterbad", version: 1, status: "Freigegeben", vorschau: BILD("r-bad.webp"), kunde_entscheidung: "freigegeben", freigabe_quelle: "portal", vorgelegt_am: zp(-60, 10) }, -62);
  const p3v1 = pl(3, { bezeichnung: "Wohnen Variante Sofa", version: 1, status: "Verworfen", vorschau: BILD("r-wohnen-sofa.jpg") }, -30);
  pl(3, { bezeichnung: "Wohnen Variante Sofa", version: 2, status: "Kunde vorgelegt", vorgaenger: p3v1.name, vorschau: BILD("r-wohnen-sofa.jpg"), vorgelegt_am: zp(-6, 11), kunde_entscheidung: "aenderung", kunde_kommentar: "Sofa 20 cm kürzer, damit der Durchgang frei bleibt", freigabe_quelle: "portal" }, -8);
  pl(4, { bezeichnung: "Suite Typ A", version: 1, status: "Kunde vorgelegt", quelle_planung: "Handskizze", echt_bestaetigt: 1, vorschau: BILD("r-terrasse-hotel.jpg"), vorgelegt_am: zp(-4, 9), kunde_entscheidung: "freigegeben", freigabe_quelle: "portal" }, -5);
  pl(4, { bezeichnung: "Lobby", version: 1, status: "Entwurf", vorschau: "" }, -2);
  pl(5, { bezeichnung: "Terrasse", version: 1, status: "Freigegeben", vorschau: BILD("r-terrasse-see.jpg"), kunde_entscheidung: "freigegeben", freigabe_quelle: "backoffice", vorgelegt_am: zp(-20, 9) }, -22);
  pl(11, { bezeichnung: "Küche Lack matt", version: 2, status: "Freigegeben", vorschau: BILD("r-kueche-eiche.jpg"), kunde_entscheidung: "freigegeben", freigabe_quelle: "portal", vorgelegt_am: zp(-45, 9) }, -48);

  // Renderings + Rückmeldungen
  leere("PH Rendering");
  leere("PH Rendering Feedback");
  const ren = (pi, werte, tag) => neu("PH Rendering", { titel: `Rendering ${werte.variante} v${werte.version} „${werte.bezeichnung}“`, projekt: P[pi].name, kunde_sichtbar: werte.status === "Entwurf" ? 0 : 1, feedback_anzahl: 0, feedback_offen: 0, votes_up: 0, votes_down: 0, quelle: "backoffice", ...werte }, tag);
  const fb = (r, werte, tag, hh = 18) => neu("PH Rendering Feedback", { titel: werte.text?.slice(0, 40) || werte.art, projekt: r.projekt, rendering: r.name, kontakt: P.find((p) => p.name === r.projekt)?.kontakt || "", status: "Offen", erstellt_am: zp(tag, hh), quelle: werte.von === "kunde" ? "website" : "backoffice", ...werte }, tag);
  ren(0, { variante: "A", version: 3, bezeichnung: "Insel Eiche", status: "Freigegeben", bild: BILD("r-kueche-eiche.jpg"), vorgelegt_am: zp(-52, 10), freigegeben_am: zp(-50, 18) }, -53);
  ren(1, { variante: "A", version: 2, bezeichnung: "Wohnen Cognac", status: "Freigegeben", bild: BILD("r-wohnen-sofa.jpg"), vorgelegt_am: zp(-70, 10), freigegeben_am: zp(-68, 10) }, -71);
  const r3a = ren(3, { variante: "A", version: 2, bezeichnung: "Sofa Leder Cognac", status: "Vorgelegt", bild: BILD("r-wohnen-sofa.jpg"), vorgelegt_am: zp(-6, 11), votes_up: 3, votes_down: 0 }, -7);
  const r3b = ren(3, { variante: "B", version: 1, bezeichnung: "Sofa Bouclé Sand", status: "Feedback offen", bild: BILD("r-hero-essraum.jpg"), ki_generiert: 1, vorgelegt_am: zp(-6, 11), votes_up: 1, votes_down: 1, feedback_anzahl: 4, feedback_offen: 3, letztes_feedback_am: zp(-2, 19) }, -7);
  ren(3, { variante: "C", version: 1, bezeichnung: "Sofa Stoff Salbei", status: "Entwurf", bild: BILD("r-garten-lounge.jpg") }, -1);
  ren(4, { variante: "A", version: 1, bezeichnung: "Suite Abendlicht", status: "Entwurf", bild: BILD("r-terrasse-hotel.jpg"), ki_generiert: 1 }, -2);
  ren(5, { variante: "A", version: 1, bezeichnung: "Terrasse Abend", status: "Freigegeben", bild: BILD("r-terrasse-see.jpg"), vorgelegt_am: zp(-20, 9), freigegeben_am: zp(-18, 9) }, -21);
  const pin1 = fb(r3b, { art: "annotation", von: "kunde", autor: FAELLE[3].kunde, text: "Griffe lieber schwarz?", punkt_x: 32, punkt_y: 58 }, -5);
  fb(r3b, { art: "annotation", von: "studio", autor: "Anna Probe", text: "Ja, schwarz matt ist möglich – Muster liegt im Showroom.", antwort_auf: pin1.name, status: "Beantwortet" }, -4, 9);
  fb(r3b, { art: "annotation", von: "kunde", autor: FAELLE[3].kunde, text: "Kann die Leuchte tiefer hängen?", punkt_x: 64, punkt_y: 22 }, -2, 19);
  fb(r3b, { art: "sprachnachricht", von: "kunde", autor: FAELLE[3].kunde, text: "Sprachnotiz zur Stoffwahl", audio_dauer_s: 42, audio_mime: "audio/webm" }, -2, 20);
  fb(r3b, { art: "vote", von: "kunde", autor: FAELLE[3].kunde, vote: "up", status: "Erledigt" }, -5);
  fb(r3a, { art: "kommentar", von: "kunde", autor: FAELLE[3].kunde, text: "Gefällt uns gut, Farbe passt zum Boden.", status: "Erledigt", erledigt_am: zp(-4, 10) }, -5);
  const r4 = [...tabelle("PH Rendering").values()].find((x) => x.projekt === P[4].name);
  fb(r4, { art: "kommentar", von: "kunde", autor: FAELLE[4].kunde, text: "Können wir das Abendlicht etwas wärmer sehen?", punkt_x: 0, punkt_y: 0 }, -1, 17);
  r3b.freigabe_feedback = "";

  // Nachrichten
  leere("PH Projekt Nachricht");
  const nachricht = (pi, werte, tag, hh = 9) => neu("PH Projekt Nachricht", { titel: (werte.text || "").slice(0, 40), kontakt: P[pi].kontakt, projekt: P[pi].name, gesendet_am: zp(tag, hh, 12), quelle: werte.richtung === "eingehend" ? "website" : "backoffice", ...werte }, tag);
  nachricht(3, { richtung: "eingehend", status: "Ungelesen", autor: FAELLE[3].kunde, text: "Können wir den Termin am Donnerstag statt Mittwoch machen?" }, 0, 9);
  nachricht(1, { richtung: "eingehend", status: "Gelesen", autor: FAELLE[1].kunde, text: "Die Muster sind angekommen – wir nehmen die geräucherte Eiche.", gelesen_am: zp(-2, 10) }, -2, 19);
  nachricht(1, { richtung: "ausgehend", status: "Gelesen", autor: "Paul Schema", von_user: LEITUNG, text: "Danke – wir bestellen die Eiche heute. Montage wie besprochen." }, -1, 8);
  nachricht(0, { richtung: "ausgehend", status: "Gelesen", autor: "Paul Schema", von_user: LEITUNG, text: "Ihre Küche ist vollständig geliefert. Wir melden uns mit dem Montagetermin." }, -3, 15);
  nachricht(4, { richtung: "eingehend", status: "Ungelesen", autor: FAELLE[4].kunde, text: "Bitte die Bemusterung für die Suiten bestätigen." }, -4, 11);

  // Nachträge
  leere("PH Nachtrag");
  const nt = (pi, werte, pos, tag) => {
    const n = neu("PH Nachtrag", { titel: `Nachtrag ${werte.nummer_im_projekt} ${werte.bezeichnung}`, projekt: P[pi].name, kontakt: P[pi].kontakt, datum: dt(tag), waehrung: "EUR", quelle: "backoffice", ...werte }, tag);
    kinder(n, "positionen", "PH Nachtrag Position", pos);
    return n;
  };
  nt(1, { bezeichnung: "Hochschrank statt Regal", nummer_im_projekt: 1, status: "Freigegeben", grund: "Kundenwunsch", auswirkung_termin: "+1 Woche Lieferung", summe_neu_cent: 680000, summe_entfall_cent: 420000, differenz_cent: 260000, ek_differenz_cent: 180000, vorgelegt_am: zp(-12, 10), entscheidung_am: zp(-10, 18), entscheidung_quelle: "portal", uebernommen: 0 }, [
    { art: "entfall", raum: "Wohnen", bezeichnung: "Regal System 3", menge: 1, einzel_cent: 420000, betrag_cent: -420000, ek_cent: 260000 },
    { art: "neu", raum: "Wohnen", bezeichnung: "Hochschrank Eiche 60 cm", menge: 1, einzel_cent: 680000, betrag_cent: 680000, ek_cent: 440000 },
  ], -12);
  nt(11, { bezeichnung: "Wandpaneel Eiche", nummer_im_projekt: 1, status: "Vorgelegt", grund: "Planungsaenderung", auswirkung_termin: "keine", summe_neu_cent: 190000, differenz_cent: 190000, ek_differenz_cent: 120000, vorgelegt_am: zp(-9, 10), freigabe_frist: dt(-2) }, [{ art: "neu", raum: "Küche", bezeichnung: "Wandpaneel Eiche 120 × 60", menge: 2, einzel_cent: 95000, betrag_cent: 190000, ek_cent: 60000 }], -9);
  nt(2, { bezeichnung: "Handtuchheizkörper", nummer_im_projekt: 1, status: "Entwurf", grund: "Baustelle", summe_neu_cent: 85000, differenz_cent: 85000, ek_differenz_cent: 52000 }, [{ art: "neu", raum: "Bad", bezeichnung: "Handtuchheizkörper Anthrazit", menge: 1, einzel_cent: 85000, betrag_cent: 85000, ek_cent: 52000 }], -1);
  nt(9, { bezeichnung: "Nachttische", nummer_im_projekt: 1, status: "Abgelehnt", grund: "Kundenwunsch", differenz_cent: 120000, ablehnung_grund: "Kunde behält die bestehenden Nachttische.", vorgelegt_am: zp(-70, 10), entscheidung_am: zp(-68, 10), entscheidung_quelle: "backoffice", uebernommen: 1 }, [{ art: "neu", raum: "Schlafen", bezeichnung: "Nachttisch Eiche", menge: 2, einzel_cent: 60000, betrag_cent: 120000 }], -70);

  // Aufmaße
  leere("PH Aufmass");
  const afm = (pi, werte, tag) => {
    const a = neu("PH Aufmass", { titel: `Aufmaß ${FAELLE[pi].titel}`, projekt: P[pi].name, datum: dt(tag), aufgenommen_von: PLANER, objekt_text: `${FAELLE[pi].strasse}, ${FAELLE[pi].ort}`, etage: "EG", aufzug: 0, raumhoehe_standard_mm: 2600, quelle: "backoffice", ...werte }, tag);
    kinder(a, "raeume", "PH Aufmass Raum", [{ raum: "Küche", laenge_mm: 5200, breite_mm: 4100, hoehe_mm: 2600, flaeche_m2: 21.3 }]);
    kinder(a, "masse", "PH Aufmass Mass", [{ raum: "Küche", bezeichnung: "Wand Fensterseite", art: "Wandlaenge", wert_mm: 5200 }, { raum: "Küche", bezeichnung: "Fensterbrüstung", art: "Hoehe", wert_mm: 920 }, { raum: "Küche", bezeichnung: "Nische Kühlschrank", art: "Nische", wert_mm: 610, toleranz_mm: 5 }]);
    kinder(a, "anschluesse", "PH Aufmass Anschluss", [{ raum: "Küche", art: "Wasser kalt", zustand: "bestand", x_mm: 2400, hoehe_mm: 450 }, { raum: "Küche", art: "Starkstrom 400 V", zustand: "neu", x_mm: 3100, hoehe_mm: 300 }]);
    return a;
  };
  afm(0, { status: "Geprueft", geprueft_von: LEITUNG, geprueft_am: zp(-80, 14) }, -82);
  afm(11, { status: "Geprueft", geprueft_von: LEITUNG, geprueft_am: zp(-70, 14) }, -72);
  afm(3, { status: "Erfasst", plausibilitaet: "Raumhöhe 2.600 mm, Fensterbrüstung nicht gemessen – bitte nachtragen." }, -20);

  // Aufgaben
  leere("PH Projekt Aufgabe");
  const auf = (pi, werte, tag = -2) => neu("PH Projekt Aufgabe", { projekt: P[pi].name, status: "Offen", prioritaet: "Normal", zugewiesen_an: LEITUNG, abrechenbar: 0, quelle: "backoffice", ...werte }, tag);
  auf(0, { titel: "Montagetermin mit Familie Muster abstimmen", art: "Koordination", faellig: dt(0), prioritaet: "Hoch" });
  auf(0, { titel: "Elektriker: Anschlussplan senden", art: "Koordination", faellig: dt(2), zugewiesen_an: PLANER });
  auf(1, { titel: "Montage morgen vorbereiten", art: "Montage", faellig: dt(0), zugewiesen_an: MONTAGELEITER, status: "In Arbeit" });
  auf(3, { titel: "Variante B mit schwarzen Griffen rendern", art: "Planung", faellig: dt(-2), zugewiesen_an: PLANER, prioritaet: "Hoch" });
  auf(4, { titel: "Bemusterung Suiten bestätigen", art: "Beratung", faellig: dt(-1) });
  auf(7, { titel: "Spiegelschrank beim Lieferanten reklamieren", art: "Service", faellig: dt(1) });
  auf(8, { titel: "Zollpapiere für die Lieferung in die Schweiz", art: "Bestellung", faellig: dt(5) });
  auf(5, { titel: "Angebot nachfassen", art: "Beratung", faellig: dt(3) });
  auf(9, { titel: "Referenzfotos auswählen", art: "Buero", faellig: dt(-20), status: "Erledigt", erledigt_am: zp(-18, 10) }, -25);
  auf(10, { titel: "Termine absagen", art: "Koordination", faellig: dt(-20), status: "Verworfen" }, -25);

  // Projektzeiten
  leere("PH Projektzeit");
  const zeit = (pi, werte, tag) => neu("PH Projektzeit", { projekt: P[pi].name, user: LEITUNG, status: "Offen", abrechenbar: 1, datum: dt(tag), quelle: "backoffice", titel: `${werte.taetigkeit} ${FAELLE[pi].titel}`, ...werte }, tag);
  [[0, "Planung", 240, -60], [0, "Beratung", 90, -70], [0, "Koordination", 60, -3], [1, "Montage", 480, 0, MONTAGELEITER, montagen[0]?.name], [1, "Montage", 480, 0, MONTEUR, montagen[0]?.name], [1, "Planung", 300, -80], [2, "Montage", 450, -1, MONTAGELEITER, montagen[2]?.name], [3, "Planung", 180, -7, PLANER], [3, "Beratung", 120, -10], [4, "Beratung", 150, -5, BERATER2], [7, "Montage", 465, -9, MONTAGELEITER, montagen[3]?.name], [7, "Montage", 465, -9, MONTEUR, montagen[3]?.name], [9, "Montage", 500, -40, MONTAGELEITER, montagen[4]?.name], [9, "Planung", 360, -90]].forEach(([pi, taetigkeit, dauer_min, tag, user, montageauftrag], k) =>
    zeit(pi, { taetigkeit, dauer_min, user: user || LEITUNG, montageauftrag: montageauftrag || "", status: pi === 9 ? "Abgerechnet" : k === 2 ? "Nicht abrechenbar" : "Offen", abrechenbar: k === 2 ? 0 : 1, beleg_ref: pi === 9 ? "RE-2026-00009" : "", beschreibung: "" }, tag)
  );

  // Dokumente
  leere("PH Projekt Dokument");
  const dok = (pi, werte, tag) => neu("PH Projekt Dokument", { projekt: P[pi].name, kontakt: P[pi].kontakt, status: "Freigegeben", datum: dt(tag), version: 1, mime: "application/pdf", groesse: 380000, quelle: "backoffice", ...werte }, tag);
  for (const pi of [0, 1, 2, 3, 7, 9, 11]) {
    dok(pi, { titel: `Planung ${FAELLE[pi].titel}`, kategorie: "Plan", datei: `/private/files/plan-${pi}.pdf`, dateiname: `Plan ${FAELLE[pi].titel}.pdf`, kunde_sichtbar: 1, version: pi === 0 ? 3 : 1 }, -40);
    if (pi !== 3) dok(pi, { titel: `Aufmaßprotokoll ${FAELLE[pi].titel}`, kategorie: "Protokoll", datei: `/private/files/aufmass-${pi}.pdf`, dateiname: "Aufmaß.pdf", kunde_sichtbar: 0 }, -80);
  }
  dok(7, { titel: "Abnahmeprotokoll Masterbad", kategorie: "Protokoll", datei: "/private/files/abnahme-7.pdf", dateiname: "Abnahmeprotokoll.pdf", kunde_sichtbar: 1, referenz_doctype: "PH Abnahme", referenz_name: abn7.name }, -9);
  dok(0, { titel: "Moodboard Küche", kategorie: "Foto", datei: BILD("r-kueche-eiche.jpg"), dateiname: "Moodboard.jpg", mime: "image/jpeg", kunde_sichtbar: 1, status: "Entwurf" }, -90);

  // Bautagebuch-Fotos
  leere("PH Tagebuch Foto");
  let fotoNr = 0;
  const foto = (pi, bild, phase, von, tag, hh = 14) => {
    fotoNr++;
    return neu("PH Tagebuch Foto", { foto_id: `FOTO-${String(fotoNr).padStart(4, "0")}`, name: `FOTO-${String(fotoNr).padStart(4, "0")}`, titel: `${FAELLE[pi].titel} · ${phase}`, projekt: P[pi].name, kontakt: P[pi].kontakt, phase, von, autor: von === "kunde" ? FAELLE[pi].kunde : "Tobias Beispiel", hochgeladen_am: zp(tag, hh), bild: BILD(bild), breite: 1600, hoehe: 1200, metadaten_entfernt: 1, gps_entfernt: 1, echt_bestaetigt: 1, quelle: von === "kunde" ? "website" : "backoffice" }, tag);
  };
  P.forEach((p, pi) => {
    const f = FAELLE[pi];
    if (!f.bild) return;
    foto(pi, f.bild, PHASEN.indexOf(f.status) >= 6 ? "nachher" : "rendering", "team", -2, 15);
    if (pi <= 3 || pi === 7 || pi === 9) {
      foto(pi, "r-essen-licht.jpg", "vorher", "kunde", -60, 11);
      foto(pi, "r-wohnen-sofa.jpg", "skizze", "team", -50, 10);
      foto(pi, "r-schlafen.webp", "lieferung", "team", -10, 9);
    }
  });

  // Produktpässe
  leere("PH Produktpass");
  for (const [pi, zeilen] of [[9, [0, 2, 3]], [7, [0, 2]]]) {
    zeilen.forEach((k, j) => {
      const pos = P[pi].positionen[k];
      if (!pos) return;
      const pp = neu("PH Produktpass", { titel: pos.bezeichnung, kontakt: P[pi].kontakt, projekt: P[pi].name, position: pos.name, status: pi === 9 && j === 2 ? "Garantie abgelaufen" : "Aktiv", lieferdatum: dt(pi === 9 ? -45 : -12), produkt_name: pos.bezeichnung, marke: pos.marke, kategorie: pos.raum, seriennummer: `SN-${pi}${k}${j}0`, pflegekategorie: /Leder/.test(pos.bezeichnung) ? "Leder" : /Stein|Naturstein|Mosaik/.test(pos.bezeichnung) ? "Stein" : "Holz", outdoor: /Outdoor/.test(pos.bezeichnung) ? 1 : 0, garantie_monate: pi === 9 && j === 2 ? 1 : 24, garantie_bis: pi === 9 && j === 2 ? dt(-10) : dt(700), garantie_hinweis: "Herstellergarantie laut Garantiebedingungen des Herstellers (Beispiel).", kunde_sichtbar: 1, quelle: "backoffice" }, pi === 9 ? -45 : -12);
      kinder(pp, "materialien", "PH Produktpass Material", j === 1 ? [] : [{ material: /Leder/.test(pos.bezeichnung) ? "Rindleder anilin" : "Eiche massiv", anteil: "80 %", herkunft: "EU" }]);
      kinder(pp, "pflege", "PH Produktpass Pflege", [{ hinweis: "Mit leicht feuchtem Tuch reinigen, keine scharfen Mittel.", intervall: "wöchentlich" }]);
      kinder(pp, "dokumente", "PH Produktpass Dokument", []);
      pos.produktpass = pp.name;
    });
  }

  // Referenzen
  leere("PH Referenz");
  const refBilder = [...tabelle("PH Tagebuch Foto").values()].filter((f) => f.projekt === P[9].name);
  const ref = neu("PH Referenz", { name: "REF-2026-0001", freigabe_id: "REF-2026-0001", titel: "Essraum am Bodensee", projekt: P[9].name, kontakt: P[9].kontakt, status: "Eingereicht", beispiel: 0, eingereicht_am: zp(-6, 18), anzeige_art: "vorname_ort", anzeige_vorname: "Familie M.", anzeige_ort: "Lindau", einwilligung_version: "2026-10", einwilligung_textstatus: "freigegeben", einwilligung_zeitpunkt: zp(-6, 18), einwilligung_kanal: "Portal", typologie: "Haus", leistungen: "Planung, Lieferung, Montage", quelle: "website" }, -6);
  kinder(ref, "bilder", "PH Referenz Bild", refBilder.slice(0, 3).map((f) => ({ foto: f.name, phase: f.phase, titel: f.titel, alt: f.titel, von: f.von, datei: f.bild, breite: 1600, hoehe: 1200 })));
  neu("PH Referenz", { name: "REF-2026-0000", freigabe_id: "REF-2026-0000", titel: "Bad mit Naturstein", projekt: P[7].name, kontakt: P[7].kontakt, status: "Widerrufen", beispiel: 0, eingereicht_am: zp(-30, 18), anzeige_art: "anonym", einwilligung_version: "2026-10", einwilligung_textstatus: "freigegeben", widerruf_zeitpunkt: zp(-20, 10), widerruf_kanal: "E-Mail", quelle: "website" }, -30);

}
