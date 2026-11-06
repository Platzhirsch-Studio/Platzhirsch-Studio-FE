// Mock-Seed – Bereich Logistik (G-01, MASTER § 3.5). Schreibt: Team B-LOG.
// anzahl: Datensätze je DocType · kern: Fachwissen je DocType (Verteilung, Bezüge, Titel) nach der
// generischen Erzeugung · default: Nachlauf (db, hilfe) nach dem Grundaufbau, Reihenfolge über `nach`.
// Keine echten Personen, E-Mails @beispiel.invalid, runde Beispielbeträge (Q-A3). Zufall nur über `r`
// (fester Startwert); Reihenfolge der r-Aufrufe nicht ändern, sonst verschieben sich alle Folgedaten.
//
// Der Nachlauf ersetzt die generischen Logistik-Daten durch einen zusammenhängenden Bestand
// (10-konzept-logistik § 14.5 Schritt 1): Lieferscheine in allen Status inkl. Teillieferung, Abholung ohne
// E-Mail, Anzahlung offen, Ausfuhr; Sendungen inkl. Problem/Test; Touren inkl. Montage-Stopp und Fehlversuch;
// Speditionen, Rücknahmen, Bestand mit Ausstellung/Kommission/Sperre, laufende Inventuren (eine freigebbar,
// eine mit Bewegung seit Zählbeginn), Teilinventur, Inventurbewertung, Meldebestand und Bestellvorschläge.
// Bestehende Namen werden der Reihe nach wiederverwendet, neue über die Nummernkreise (Zähler bleiben stimmig).

import { isoDatum, isoDatumZeit } from "../../format.js";
import { tage } from "./basis.js";

/** Stand des Logistik-Seeds (Marke in PH Logistik Einstellungen, für logistik/client.js). */
export const SEED_STAND = "b-log-2";

/** Nachläufe anderer Bereiche, die vor diesem laufen müssen. */
export const nach = [];

/** Anzahl generischer Datensätze je DocType (nicht gelistete mit Status bekommen 6). */
export const anzahl = {
  "PH Lieferschein": 12,
  "PH Lagerort": 4,
  "PH Fahrzeug": 2,
};

/** Fachliche Nachbearbeitung je DocType: (doc, { i, r, ctx, person }) – ändert doc. */
export const kern = {
  "PH Lieferschein": (doc, { r, person }) => {
    doc.status = r.pick(["Entwurf", "Gepackt", "Gepackt", "Uebergeben", "Zugestellt", "Zugestellt"]);
    doc.lieferart = r.pick(["Versand", "Versand", "Abholung", "Eigenlieferung", "Spedition"]);
    doc.datum = isoDatum(tage(-r.int(0, 30)));
    doc.kunde_name = person;
    doc.titel = `Lieferschein ${person}`;
    doc.workflow_state = `PH ${doc.status}`;
  },
};

/** Beispielbilder (Kopien aus dem Lounge-Entwurf) je EAN – nur Anzeige im Mock. */
export const BEISPIEL_BILDER = Object.freeze({
  "9008564001019": "/entwurf/lounge/p-zalto-bordeaux.webp",
  "5056394707181": "/entwurf/lounge/p-bell-leuchte.webp",
  "3700773700159": "/entwurf/lounge/p-trudon-kerze.webp",
  "5711507216039": "/entwurf/lounge/p-lyngby-halter.webp",
  "5703779186552": "/entwurf/lounge/p-kaehler-loewe.webp",
  "5056394707334": "/entwurf/lounge/p-flos-bellhop.webp",
  "8032737150017": "/entwurf/lounge/p-stone-leuchte.webp",
});

// Artikel (Accessoires mit EAN; Möbel als PH Produkt aus dem Sortiment-Seed, ohne EAN)
const A = {
  glas: { beschreibung: "Bordeaux Glas", marke: "Zalto", ean: "9008564001019", gewicht: 190, ek: 2400, zerbrechlich: 1, profil: "glas-2er" },
  bell: { beschreibung: "Bell Portable", marke: "Tom Dixon", ean: "5056394707181", gewicht: 1100, ek: 9900, profil: "leuchte-m" },
  kerze: { beschreibung: "Altaïr Duftkerze 270 g", marke: "Trudon", ean: "3700773700159", gewicht: 900, ek: 5200, profil: "karton-s" },
  halter: { beschreibung: "Curve Kerzenhalter", marke: "Lyngby", ean: "5711507216039", gewicht: 450, ek: 2900, zerbrechlich: 1, profil: "karton-s" },
  loewe: { beschreibung: "Astro Löwe", marke: "Kähler", ean: "5703779186552", gewicht: 700, ek: 3800, zerbrechlich: 1, profil: "karton-s" },
  plaid: { beschreibung: "Plaid Alpaka, Sand", marke: "Weberei Muster", ean: "", gewicht: 800, ek: 8900, profil: "versandtuete" },
  bellhop: { beschreibung: "Bellhop Unplugged", marke: "Flos", ean: "5056394707334", gewicht: 1300, ek: 11900, profil: "leuchte-m" },
  stone: { beschreibung: "Stone Leuchte", marke: "Muster Licht", ean: "8032737150017", gewicht: 2100, ek: 24900, profil: "leuchte-m" },
};
const M = {
  sofa: { produkt: "sofa-modul-240", beschreibung: "Sofa Modul 240", marke: "Minotti", gewicht: 98000, ek: 580000 },
  sofa2: { produkt: "sofa-modul-240-ii", beschreibung: "Sofa Modul 240 II", marke: "Minotti", gewicht: 98000, ek: 580000 },
  sessel: { produkt: "sessel-lounge", beschreibung: "Sessel Lounge", marke: "ClassiCon", gewicht: 32000, ek: 149000 },
  sessel2: { produkt: "sessel-lounge-ii", beschreibung: "Sessel Lounge II", marke: "ClassiCon", gewicht: 32000, ek: 149000 },
  tisch: { produkt: "esstisch-eiche-220", beschreibung: "Esstisch Eiche 220", marke: "Poliform", gewicht: 86000, ek: 329000 },
  tisch2: { produkt: "esstisch-eiche-220-ii", beschreibung: "Esstisch Eiche 220 II", marke: "Poliform", gewicht: 86000, ek: 329000 },
  leuchte: { produkt: "pendelleuchte-glas", beschreibung: "Pendelleuchte Glas", marke: "Flexform", gewicht: 6000, ek: 89000, zerbrechlich: 1 },
  bett: { produkt: "bett-polster-180", beschreibung: "Bett Polster 180", marke: "Ezarri", gewicht: 120000, ek: 580000 },
  bett2: { produkt: "bett-polster-180-ii", beschreibung: "Bett Polster 180 II", marke: "Ezarri", gewicht: 120000, ek: 580000 },
  regal: { produkt: "regal-system-3", beschreibung: "Regal System 3", marke: "Vitra", gewicht: 64000, ek: 149000 },
  regal2: { produkt: "regal-system-3-ii", beschreibung: "Regal System 3 II", marke: "Vitra", gewicht: 64000, ek: 149000 },
  lounge: { produkt: "loungechair-outdoor", beschreibung: "Loungechair Outdoor", marke: "Cassina", gewicht: 28000, ek: 149000 },
  stuhl: { produkt: "", beschreibung: "Stuhl Eiche gepolstert", marke: "Muster Manufaktur", gewicht: 7000, ek: 24900 },
};

const LAGER = "Lager Lochau";
const SHOWROOM = "Showroom Lochau";
const HARD = "Außenlager Hard";
const FZ1 = "BZ-123PH";
const FZ2 = "BZ-456PH";

const d = (n) => isoDatum(tage(n));
const dz = (n, h = 9, m = 0) => {
  const t = tage(n);
  t.setHours(h, m, 0, 0);
  return isoDatumZeit(t);
};
const mail = (name) => `${name.toLowerCase().replace(/[^a-zäöü]+/g, ".").replace(/^\.|\.$/g, "")}@beispiel.invalid`;

function kinder(parent, parentfield, parenttype, zeilen) {
  return zeilen.map((z, i) => ({ doctype: `${parenttype} ${parentfield === "positionen" ? "Position" : ""}`.trim(), ...z, name: `${parent}-${parentfield}-${i + 1}`, idx: i + 1, parentfield, parenttype }));
}

/**
 * Ersetzt eine Tabelle: bestehende Namen der Reihe nach wiederverwenden, neue über den Nummernkreis.
 * @returns {object[]} die neuen Dokumente
 */
function ersetze(db, hilfe, doctype, liste, { nameFeld } = {}) {
  const meta = hilfe.index.doctypes.get(doctype);
  const t = hilfe.tabelle(doctype);
  const alt = [...t.keys()].filter((n) => !/-9\d{4}$/.test(n)).sort();
  const autoFeld = String(meta?.autoname || "").startsWith("field:") ? meta.autoname.slice(6) : nameFeld;
  t.clear();
  const out = [];
  liste.forEach((roh, i) => {
    const doc = { doctype, ...roh };
    let name = autoFeld ? String(doc[autoFeld]) : alt[i];
    if (!name) name = hilfe.neuerName(meta, doc, hilfe.naechste, tage(0));
    const stempel = doc.modified || dz(-(i % 9), 8 + (i % 8), (i * 15) % 60);
    Object.assign(doc, { name, owner: doc.owner || "logistik@demo.local", creation: doc.creation || stempel, modified: stempel, modified_by: doc.modified_by || "logistik@demo.local", docstatus: 0, idx: 0 });
    if (meta?.fields.some((f) => f.fieldname === "workflow_state") && doc.status) doc.workflow_state = `PH ${doc.status}`;
    for (const f of meta?.fields || []) if (f.fieldtype === "Table" && Array.isArray(doc[f.fieldname])) doc[f.fieldname] = doc[f.fieldname].map((z, k) => ({ ...z, doctype: f.options, name: z.name || `${name}-${f.fieldname}-${k + 1}`, idx: k + 1, parentfield: f.fieldname, parenttype: doctype }));
    t.set(name, doc);
    out.push(doc);
  });
  return out;
}

function adresse(strasse, plz, ort, land = "AT") {
  const [s, nr] = strasse.split(/ (?=\d)/);
  return { liefer_strasse: s, liefer_hausnr: nr || "", liefer_plz: plz, liefer_ort: ort, liefer_land: land };
}

function pos(art, menge, gepackt = 0, extra = {}) {
  return {
    produkt: art.produkt || "", beschreibung: art.beschreibung, marke: art.marke, ean: art.ean || "", menge, menge_gepackt: gepackt, gepackt: gepackt >= menge ? 1 : 0,
    ohne_barcode: art.ean ? 0 : 1, zerbrechlich: art.zerbrechlich || 0, paketprofil: art.profil || "", einzel_cent: art.ek ? art.ek * 2 : 0, erfuellung: "", ...extra,
  };
}

function gewicht(positionen, tara = 0) {
  return positionen.reduce((s, p) => s + Number(p.menge || 0) * (Object.values({ ...A, ...M }).find((a) => a.beschreibung === p.beschreibung)?.gewicht || 0), 0) + tara;
}

/**
 * Nachlauf nach dem Grundaufbau (Bezüge zwischen DocTypes, Leer-/Fehlerfälle). Eigener Zufall über hilfe.rng.
 * @param {Map<string, Map<string, object>>} db
 * @param {import("./index.js").SeedHilfe} hilfe
 */
export default function nachlauf(db, hilfe) {
  // ------------------------------------------------------------- Stammdaten
  const plaetze = (prefix, n, gezaehlt = {}) => Array.from({ length: n }, (_, i) => ({ platz: `${prefix}-${String(i + 1).padStart(2, "0")}`, aktiv: 1, hinweis: "", zuletzt_gezaehlt: gezaehlt[i + 1] || "" }));
  ersetze(db, hilfe, "PH Lagerort", [
    { bezeichnung: LAGER, art: "Lager", aktiv: 1, standard: 1, strasse: "Landstraße 1", plz: "6911", ort: "Lochau", land: "AT", plaetze: [...plaetze("R", 16, { 1: d(-40), 2: d(-40), 3: d(-200), 9: d(-12) }), ...plaetze("K", 4)], beschreibung: "Hauptlager hinter dem Showroom", zuletzt_gezaehlt: d(-40) },
    { bezeichnung: SHOWROOM, art: "Showroom", aktiv: 1, standard: 0, strasse: "Landstraße 1", plz: "6911", ort: "Lochau", land: "AT", plaetze: plaetze("A", 12, { 1: d(-60), 2: d(-60), 3: d(-60), 4: d(-60) }), beschreibung: "Ausstellungsfläche", zuletzt_gezaehlt: d(-60) },
    { bezeichnung: HARD, art: "Lager", aktiv: 1, standard: 0, strasse: "Industriestraße 8", plz: "6971", ort: "Hard", land: "AT", plaetze: plaetze("H", 6), beschreibung: "Großmöbel und Sperrgut" },
    { bezeichnung: `Fahrzeug ${FZ1}`, art: "Fahrzeug", aktiv: 1, standard: 0, ort: "Lochau", land: "AT", plaetze: [], fahrzeug: FZ1 },
    { bezeichnung: `Fahrzeug ${FZ2}`, art: "Fahrzeug", aktiv: 1, standard: 0, ort: "Lochau", land: "AT", plaetze: [], fahrzeug: FZ2 },
  ]);
  ersetze(db, hilfe, "PH Fahrzeug", [
    { kennzeichen: FZ1, bezeichnung: "Sprinter", art: "Transporter", aktiv: 1, ladevolumen_m3: 14, zuladung_kg: 1100, laderaum_laenge_cm: 430, laderaum_breite_cm: 178, laderaum_hoehe_cm: 194, lagerort: `Fahrzeug ${FZ1}`, standard_fahrer: "montage@demo.local", naechster_service: d(40), notiz: "" },
    { kennzeichen: FZ2, bezeichnung: "LKW 7,5 t", art: "LKW", aktiv: 1, ladevolumen_m3: 38, zuladung_kg: 2600, laderaum_laenge_cm: 620, laderaum_breite_cm: 244, laderaum_hoehe_cm: 240, lagerort: `Fahrzeug ${FZ2}`, standard_fahrer: "techniker@demo.local", naechster_service: d(2), notiz: "Service in der Werkstatt Hard" },
  ]);
  if (hilfe.index.doctypes.has("PH Paketprofil")) {
    ersetze(db, hilfe, "PH Paketprofil", [
      { key: "karton-s", bezeichnung: "Karton S", familie: "wohnaccessoire", aktiv: 1, standard: 0, laenge_cm: 30, breite_cm: 25, hoehe_cm: 20, gewicht_g: 2000, tara_g: 300, geprueft: 0, quelle: "Schätzung" },
      { key: "karton-m", bezeichnung: "Karton M", familie: "wohnaccessoire", aktiv: 1, standard: 1, laenge_cm: 40, breite_cm: 30, hoehe_cm: 30, gewicht_g: 4000, tara_g: 450, geprueft: 1, quelle: "gemessen" },
      { key: "karton-l", bezeichnung: "Karton L", familie: "wohnaccessoire", aktiv: 1, standard: 0, laenge_cm: 60, breite_cm: 40, hoehe_cm: 40, gewicht_g: 7000, tara_g: 700, gewicht_max_g: 20000, geprueft: 1, quelle: "gemessen" },
      { key: "versandtuete", bezeichnung: "Versandtüte", familie: "sonstige", aktiv: 1, standard: 0, laenge_cm: 45, breite_cm: 35, hoehe_cm: 8, gewicht_g: 900, tara_g: 60, geprueft: 0, quelle: "Schätzung" },
      { key: "glas-2er", bezeichnung: "Glas 2er", familie: "glas", aktiv: 1, standard: 0, laenge_cm: 32, breite_cm: 22, hoehe_cm: 18, gewicht_g: 1900, tara_g: 500, zerbrechlich: 1, glas: 1, polster_cm: 3, geprueft: 0, quelle: "Schätzung" },
      { key: "leuchte-m", bezeichnung: "Leuchte M", familie: "leuchte", aktiv: 1, standard: 0, laenge_cm: 45, breite_cm: 45, hoehe_cm: 60, gewicht_g: 4100, tara_g: 900, zerbrechlich: 1, geprueft: 1, quelle: "gemessen" },
      { key: "palette", bezeichnung: "Palette", familie: "moebel", aktiv: 1, standard: 0, laenge_cm: 120, breite_cm: 80, hoehe_cm: 140, gewicht_g: 120000, tara_g: 25000, geprueft: 1, quelle: "gemessen" },
      { key: "duft-gefahrgut", bezeichnung: "Raumduft (Gefahrgut)", familie: "duft", aktiv: 1, standard: 0, laenge_cm: 25, breite_cm: 20, hoehe_cm: 20, gewicht_g: 1500, tara_g: 300, geprueft: 0, versand_gesperrt: 1, gefahrgut_un: "UN 1266", gefahrgut_pruefen: 1, hinweis: "Versand gesperrt – Gefahrgut. Abholung statt Versand." },
    ]);
  }
  if (hilfe.index.doctypes.has("PH Packplatz")) {
    ersetze(db, hilfe, "PH Packplatz", [
      { geraet: "Packtisch 1", bezeichnung: "Packtisch 1", aktiv: 1, standard: 1, lagerort: LAGER, hinweis: "", drucker_lieferschein: "A4 Büro", drucker_etikett: "Etikett Packtisch", ton_erfolg: 1, ton_fehler: 1, mengen_bestaetigen: 1, hand_bestaetigung_erlaubt: 1, gewicht_pflicht: 1, gewicht_toleranz_promille: 250, gewicht_toleranz_min_g: 300, schnellversand: 0, etikett_empfehlung: 1 },
    ]);
  }
  if (hilfe.index.doctypes.has("PH Packhinweis Regel")) {
    ersetze(db, hilfe, "PH Packhinweis Regel", [
      { bezeichnung: "Glas und Keramik", aktiv: 1, nur_zerbrechlich: 1, prioritaet: 10, bestaetigen: 0, hinweis: "Glas und Keramik: einzeln in Seidenpapier, Polster rundum, Aufkleber „Zerbrechlich“." },
    ]);
  }
  const einst = hilfe.tabelle("PH Logistik Einstellungen").get("PH Logistik Einstellungen");
  if (einst) Object.assign(einst, { _b_log_seed: SEED_STAND, letmeship_testmodus: 1, letmeship_env: "test", letmeship_konfiguriert: 0, standard_lagerort: LAGER, showroom_lagerort: SHOWROOM, packtisch_lagerort: LAGER, abholcode_pflicht: 1, inventur_vier_augen: 1, teilinventur_aktiv: 1, absender_firma: "Platzhirsch Home Living (Beispiel)", absender_ort: "Lochau", absender_plz: "6911", absender_land: "AT", absender_telefon: "+43 5574 00000" });

  // ------------------------------------------------------------ Lieferscheine
  const P1 = "PH-PRJ-2026-0003";
  const P2 = "PH-PRJ-2026-0006";
  const ls = [
    // 0 – Shop-Versand im Packen (Lounge-Entwurf): 4 von 6, aktiv Glas, Plaid ohne Barcode
    { lieferart: "Versand", status: "Entwurf", kunde_name: "Johanna Reiter", ...adresse("Kirchstraße 12", "6900", "Bregenz"), liefer_name: "Johanna Reiter", bestellung: "PH-S-261029-00001", wunschtermin: d(0), datum: d(-1), zerbrechlich: 1, geschenk: 1, versichern: 1, versicherungswert_cent: 28900,
      positionen: [pos(A.bell, 1, 1), pos(A.kerze, 2, 2), pos(A.halter, 2, 2), pos(A.loewe, 1, 1), pos(A.glas, 6, 4), pos(A.plaid, 1, 0)],
      pakete: [{ paket_nr: 1, paketprofil: "karton-l", art: "Paket", laenge_cm: 60, breite_cm: 40, hoehe_cm: 40, gewicht_g: 6800, gewicht_vorschlag_g: 6700, gewicht_manuell: 1, gewicht_plausibel: 1, inhalt: "11 Artikel" }] },
    // 1 – Versand Entwurf 0/2 mit Ausstellungsstück (Entnahme aus Showroom)
    { lieferart: "Versand", status: "Entwurf", kunde_name: "Familie Huber", ...adresse("Seestraße 21", "6911", "Lochau"), wunschtermin: d(1), datum: d(0), zerbrechlich: 1,
      positionen: [pos(A.glas, 2, 0), pos(A.stone, 1, 0, { seriennummer: "SN-0441" })] },
    // 2 – Versand gepackt ohne Etikett (Etikett fehlt), DE
    { lieferart: "Versand", status: "Gepackt", kunde_name: "Martina Weiss", ...adresse("Bahnhofplatz 3", "88131", "Lindau", "DE"), wunschtermin: d(-1), datum: d(-3), gepackt_am: dz(-2, 15, 20), gepackt_von: "logistik@demo.local",
      positionen: [pos(A.bellhop, 1, 1), pos(A.kerze, 2, 2)], pakete: [{ paket_nr: 1, paketprofil: "karton-m", art: "Paket", laenge_cm: 40, breite_cm: 30, hoehe_cm: 30, gewicht_g: 3600 }] },
    // 3 – Eigenlieferung gepackt ohne Tour, Anzahlung offen (AB-2026-00005), Objekt
    { lieferart: "Eigenlieferung", status: "Gepackt", kunde_name: "Hotel Alpenrose", liefer_firma: "Hotel Alpenrose GmbH", ...adresse("Seestraße 4", "6900", "Bregenz"), auftrag: "AB-2026-00005", projekt: P2, kommission: P2, teillieferung: 1, wunschtermin: d(6), datum: d(-1), gepackt_am: dz(0, 15, 20), gepackt_von: "logistik@demo.local", lieferhinweis: "Hintereingang, Lift bis 2. OG", zerbrechlich: 1,
      positionen: [pos(M.stuhl, 8, 8, { bereich: "Restaurant" }), pos(M.tisch2, 1, 1, { bereich: "Restaurant" }), pos(M.leuchte, 2, 2, { bereich: "Lobby" })] },
    // 4 – Eigenlieferung gepackt in Tour morgen (Kommission Projekt)
    { lieferart: "Eigenlieferung", status: "Gepackt", kunde_name: "Familie Brändle", ...adresse("Seestraße 4", "6911", "Lochau"), projekt: P1, kommission: P1, wunschtermin: d(1), datum: d(-2), gepackt_am: dz(-1, 11, 0), gepackt_von: "logistik@demo.local", lieferhinweis: "Zufahrt über die Seestraße, Lift vorhanden",
      positionen: [pos(M.sofa2, 1, 1, { bereich: "Wohnen" }), pos(M.sessel2, 2, 2, { bereich: "Wohnen" })] },
    // 5 – Abholung gepackt, Shop-Bestellung nicht bezahlt → Zur Kassa
    { lieferart: "Abholung", status: "Gepackt", kunde_name: "Familie Moser", kunde_email: mail("Familie Moser"), auftrag: "AB-2026-00003", abholcode: "K7M2QX", datum: d(-2), gepackt_am: dz(-2, 10, 5), gepackt_von: "logistik@demo.local",
      positionen: [pos(A.glas, 2, 2), pos(A.halter, 1, 1)] },
    // 6 – Abholung gepackt ohne E-Mail, bezahlt (ohne Quelle)
    { lieferart: "Abholung", status: "Gepackt", kunde_name: "Peter Kurz", kunde_email: "", kunde_telefon: "+43 5574 00011", abholcode: "P4T9HW", datum: d(-1), gepackt_am: dz(-1, 9, 40), gepackt_von: "logistik@demo.local",
      positionen: [pos(A.loewe, 1, 1)] },
    // 7 – Versand übergeben, Sendung unterwegs
    { lieferart: "Versand", status: "Uebergeben", kunde_name: "Anna Gruber", ...adresse("Marktstraße 7", "6850", "Dornbirn"), datum: d(-4), gepackt_am: dz(-4, 10), uebergeben_am: dz(-3, 16), uebergeben_an: "Dienstleister",
      positionen: [pos(A.bell, 1, 1)], pakete: [{ paket_nr: 1, paketprofil: "leuchte-m", art: "Paket", laenge_cm: 45, breite_cm: 45, hoehe_cm: 60, gewicht_g: 2100 }] },
    // 8 – Versand zugestellt, Lieferbestätigung offen
    { lieferart: "Versand", status: "Zugestellt", kunde_name: "Lukas Berger", kunde_email: mail("Lukas Berger"), ...adresse("Hauptstraße 30", "6890", "Lustenau"), datum: d(-9), gepackt_am: dz(-9, 14), uebergeben_am: dz(-8, 16), uebergeben_an: "Dienstleister", zugestellt_am: dz(-6, 11, 20), empfaenger_name: "L. Berger",
      positionen: [pos(A.kerze, 1, 1), pos(A.halter, 2, 2)], pakete: [{ paket_nr: 1, paketprofil: "karton-s", art: "Paket", laenge_cm: 30, breite_cm: 25, hoehe_cm: 20, gewicht_g: 2000 }] },
    // 9 – Spedition gepackt, Speditionsauftrag gesendet
    { lieferart: "Spedition", status: "Gepackt", kunde_name: "Weingut am Pfänder", ...adresse("Pfänderweg 2", "6911", "Lochau"), datum: d(-2), wunschtermin: d(2), gepackt_am: dz(-1, 15), gepackt_von: "logistik@demo.local",
      positionen: [pos(M.lounge, 4, 4, { bereich: "Terrasse" })], pakete: [{ paket_nr: 1, paketprofil: "palette", art: "Palette", laenge_cm: 120, breite_cm: 80, hoehe_cm: 140, gewicht_g: 137000, stapelbar: 0 }] },
    // 10 – Eigenlieferung übergeben, Stopp nicht angetroffen in abgeschlossener Tour → zurück im Fahrzeug
    { lieferart: "Eigenlieferung", status: "Uebergeben", kunde_name: "Familie Nägele", ...adresse("Rheinstraße 9", "6971", "Hard"), datum: d(-8), wunschtermin: d(-6), gepackt_am: dz(-7, 15), uebergeben_am: dz(-6, 7, 30), uebergeben_an: "Fahrer",
      positionen: [pos(M.bett, 1, 1, { bereich: "Schlafen" })] },
    // 11 – Eigenlieferung zugestellt über Tour, AB ohne Mengenmeldung (E7)
    { lieferart: "Eigenlieferung", status: "Zugestellt", kunde_name: "Sarah Bösch", kunde_email: mail("Sarah Bösch"), ...adresse("Kirchweg 5", "6911", "Lochau"), auftrag: "AB-2026-00004", datum: d(-2), wunschtermin: d(0), gepackt_am: dz(-1, 14), uebergeben_am: dz(0, 7, 30), uebergeben_an: "Fahrer", zugestellt_am: dz(0, 8, 40), empfaenger_name: "S. Bösch", unterschrift_empfaenger: "/private/files/unterschrift-muster.png",
      positionen: [pos(M.regal, 1, 1, { lagerbestand: "" })] },
    // 12 – Versand storniert
    { lieferart: "Versand", status: "Storniert", kunde_name: "Andreas Wohlgenannt", ...adresse("Mühlgasse 4", "6850", "Dornbirn"), datum: d(-12), storno_grund: "Kunde hat die Bestellung storniert",
      positionen: [pos(A.bellhop, 1, 0)] },
    // 13 – Eigenlieferung im Entwurf, bereits in Tour morgen („wird vor Abfahrt gepackt“)
    { lieferart: "Eigenlieferung", status: "Entwurf", kunde_name: "Katharina Stadler", ...adresse("Uferweg 11", "6900", "Bregenz"), datum: d(0), wunschtermin: d(1),
      positionen: [pos(M.tisch, 1, 0, { bereich: "Essen" }), pos(M.stuhl, 4, 0, { bereich: "Essen" })] },
    // 14 – Spedition Entwurf in die Schweiz, AB Ausfuhr → Steuernachweis
    { lieferart: "Spedition", status: "Entwurf", kunde_name: "Yacht Aurelia", liefer_firma: "Yachtservice Muster AG", ...adresse("Hafenstrasse 1", "8280", "Kreuzlingen", "CH"), auftrag: "AB-2026-00002", datum: d(0), wunschtermin: d(9), sprache: "en",
      positionen: [pos(M.lounge, 2, 0, { bereich: "Deck" }), pos(M.sessel, 2, 0, { bereich: "Salon" })] },
    // 15 – Versand zurückgestellt (Fehlt) mit Problem
    { lieferart: "Versand", status: "Entwurf", kunde_name: "Miriam Köhler", ...adresse("Lindenweg 3", "6900", "Bregenz"), datum: d(-2), wunschtermin: d(-1), zurueckgestellt: 1, zurueckgestellt_grund: "Fehlt", zurueckgestellt_text: "Zweites Glas fehlt im Lager", zurueckgestellt_am: dz(-1, 13, 10), zurueckgestellt_von: "logistik@demo.local", problem_grund: "Fehlt", problem_text: "Zweites Glas fehlt im Lager", problem_am: dz(-1, 13, 10), zerbrechlich: 1,
      positionen: [pos(A.glas, 2, 1)] },
    // 16 – Abholung abgeholt
    { lieferart: "Abholung", status: "Zugestellt", kunde_name: "Paul Stadler", kunde_email: mail("Paul Stadler"), abholcode: "Q8R3ZN", datum: d(-5), gepackt_am: dz(-5, 10), zugestellt_am: dz(-3, 17, 5), empfaenger_name: "Paul Stadler", lieferbestaetigung_gesendet_am: dz(-3, 17, 6),
      positionen: [pos(A.bell, 1, 1)] },
    // 17 – Versand gepackt, Etikett bereit
    { lieferart: "Versand", status: "Gepackt", kunde_name: "Johanna Fink", ...adresse("Seeufer 2", "88142", "Wasserburg", "DE"), datum: d(-1), gepackt_am: dz(0, 9, 30), gepackt_von: "logistik@demo.local",
      positionen: [pos(A.plaid, 1, 1)], pakete: [{ paket_nr: 1, paketprofil: "versandtuete", art: "Paket", laenge_cm: 45, breite_cm: 35, hoehe_cm: 8, gewicht_g: 900 }] },
    // 18 – Versand übergeben, Sendung mit Problem
    { lieferart: "Versand", status: "Uebergeben", kunde_name: "Thomas Moosbrugger", kunde_email: mail("Thomas Moosbrugger"), ...adresse("Dorfstraße 14", "6863", "Egg"), datum: d(-10), gepackt_am: dz(-10, 15), uebergeben_am: dz(-9, 16), uebergeben_an: "Dienstleister",
      positionen: [pos(A.loewe, 1, 1), pos(A.glas, 2, 2)], pakete: [{ paket_nr: 1, paketprofil: "glas-2er", art: "Paket", laenge_cm: 32, breite_cm: 22, hoehe_cm: 18, gewicht_g: 1900 }] },
  ].map((l, i) => ({
    naming_series: "LS-.YYYY.-.#####", titel: `Lieferschein ${l.kunde_name}`, sprache: "de", kontakt: hilfe.kontakte[i % Math.max(hilfe.kontakte.length, 1)]?.name || "",
    kunde_email: mail(l.kunde_name), kunde_telefon: `+43 5574 ${String(10000 + i * 731).slice(0, 5)}`, liefer_name: l.kunde_name, liefer_land: "AT", quelle: "backoffice",
    gesamtgewicht_g: (l.pakete || []).reduce((s, p) => s + p.gewicht_g, 0) || gewicht(l.positionen), warenwert_cent: l.positionen.reduce((s, p) => s + p.menge * p.einzel_cent, 0),
    versichern: 0, zerbrechlich: 0, geschenk: 0, teillieferung: 0, pakete: [], fotos: [], tour: "", ...l,
  }));
  const L = ersetze(db, hilfe, "PH Lieferschein", ls);
  const N = (i) => L[i].name;

  // -------------------------------------------------------------- Bestand
  const best = [];
  const b = (art, lagerort, platz, menge, extra = {}) => best.push({
    naming_series: "PH-LB-.#####", produkt: art.produkt || "", produkt_name: art.beschreibung, marke: art.marke, ean: art.ean || "", lagerort, platz, menge, reserviert: 0, verfuegbar: menge, status: "Verfuegbar",
    zustand: "Neu", ausstellungsstueck: 0, gesperrt: 0, ek_cent: art.ek, waehrung: "EUR", eingang_am: d(-90), inventur_am: "", quelle: "backoffice", titel: `${art.beschreibung} · ${lagerort}`, ...extra,
  });
  // Lager: Accessoires mit EAN
  b(A.glas, LAGER, "R-12", 24, { eingang_am: d(-30) });
  b(A.kerze, LAGER, "R-03", 18, { eingang_am: d(-20) });
  b(A.halter, LAGER, "R-04", 10, { eingang_am: d(-45) });
  b(A.loewe, LAGER, "R-05", 3, { eingang_am: d(-120) });
  b(A.bell, LAGER, "R-06", 6, { eingang_am: d(-60) });
  b(A.bellhop, LAGER, "R-07", 4, { eingang_am: d(-75) });
  b(A.plaid, LAGER, "R-08", 5, { eingang_am: d(-15) });
  b(A.stone, LAGER, "R-09", 2, { eingang_am: d(-200) });
  b(A.kerze, LAGER, "R-02", 6, { reserviert: 2, verfuegbar: 4, status: "Reserviert", reserviert_fuer_doctype: "PH Bestellung", reserviert_fuer: "PH-S-261011-00001", reserviert_bis: d(10), reserviert_kunde_name: "Johanna Reiter", eingang_am: d(-20) });
  b(M.sessel2, LAGER, "R-14", 1, { zustand: "B-Ware", gesperrt: 1, status: "Gesperrt", sperrgrund: "Transportschaden", verfuegbar: 0, seriennummer: "SN-2207", eingang_am: d(-8) });
  b(M.stuhl, LAGER, "R-15", 12, { eingang_am: d(-25) });
  b(M.regal, LAGER, "R-16", 0, { status: "Verkauft", verfuegbar: 0, eingang_am: d(-300) });
  // Kommission
  b(M.sofa2, LAGER, "K-01", 1, { kommission: P1, status: "Kommission", verfuegbar: 0, seriennummer: "SN-3301", eingang_am: d(-10) });
  b(M.sessel2, LAGER, "K-02", 2, { kommission: P1, status: "Kommission", verfuegbar: 0, eingang_am: d(-10) });
  b(M.tisch2, LAGER, "K-03", 1, { kommission: P2, status: "Kommission", verfuegbar: 0, eingang_am: d(-12) });
  b(M.stuhl, LAGER, "K-04", 8, { kommission: P2, status: "Kommission", verfuegbar: 0, eingang_am: d(-12) });
  // Showroom: Ausstellungsstücke
  const aus = (art, platz, sn, eingang, vk, extra = {}) => b(art, SHOWROOM, platz, 1, { ausstellungsstueck: 1, zustand: "Ausstellung", seriennummer: sn, eingang_am: eingang, vk_cent_ausstellung: vk, ...extra });
  aus(M.sofa, "A-01", "SN-1182", d(-540), 690000);
  aus(M.sessel, "A-03", "SN-1190", d(-220), 0);
  aus(M.tisch, "A-04", "SN-0917", d(-400), 390000, { reserviert: 1, verfuegbar: 0, status: "Reserviert", reserviert_fuer_doctype: "PH Auftragsbestaetigung", reserviert_fuer: "AB-2026-00003", reserviert_bis: d(14), reserviert_kunde_name: "Familie Nägele" });
  aus(M.leuchte, "A-05", "SN-0502", d(-90), 0);
  aus(A.stone, "A-07", "SN-0441", d(-150), 39000);
  aus(M.bett, "A-08", "SN-0733", d(-800), 590000);
  aus(M.regal, "A-09", "SN-0808", d(-30), 0);
  aus(M.lounge, "A-11", "SN-1411", d(-1200), 129000, { status: "Ausgeschieden", menge: 0, verfuegbar: 0, ausgeschieden_am: d(-20) });
  // Außenlager
  b(M.bett2, HARD, "H-01", 2, { eingang_am: d(-50) });
  b(M.regal2, HARD, "H-02", 3, { eingang_am: d(-70) });
  b(M.lounge, HARD, "H-03", 6, { eingang_am: d(-35) });
  b(M.tisch, HARD, "H-04", 1, { zustand: "B-Ware", eingang_am: d(-400) });
  const B = ersetze(db, hilfe, "PH Lagerbestand", best);
  const bName = (sn) => B.find((x) => x.seriennummer === sn)?.name || "";
  const bOrt = (ort, platz) => B.find((x) => x.lagerort === ort && x.platz === platz)?.name || "";
  // Entnahme an Lieferscheinen (Gepackt mit Bestand, eine ohne Verkaufsbewegung → Band „Bestand nicht gebucht“)
  L[3].positionen[0].lagerbestand = bOrt(LAGER, "K-04");
  L[3].positionen[1].lagerbestand = bOrt(LAGER, "K-03");
  L[4].positionen[0].lagerbestand = bOrt(LAGER, "K-01");
  L[1].positionen[1].lagerbestand = "";
  L[8].positionen[0].lagerbestand = bOrt(LAGER, "R-03");

  // ------------------------------------------------------------ Bewegungen
  const bw = [];
  const bew = (art, bestand, menge, n, extra = {}) => {
    const x = B.find((y) => y.name === bestand) || {};
    bw.push({ naming_series: "PH-LBW-.YYYY.-.#####", art, status: "Gebucht", datum: dz(n, 10 + (bw.length % 7), (bw.length * 15) % 60), produkt: x.produkt || "", lagerbestand: bestand, menge, titel: `${art}: ${x.produkt_name || ""}`, von_user: "logistik@demo.local", quelle: "backoffice", grund: "", ...extra });
  };
  for (const x of B.filter((y) => y.lagerort === LAGER && y.status !== "Verkauft")) bew("Wareneingang", x.name, x.menge || 1, -Math.min(300, 30 + (bw.length % 5) * 3), { lagerort_nach: LAGER, platz_nach: x.platz, bezug_doctype: "PH Wareneingang", bezug: "WE-2026-00003" });
  bew("Verkauf", bOrt(LAGER, "R-03"), -1, -9, { lagerort_von: LAGER, platz_von: "R-03", bezug_doctype: "PH Lieferschein", bezug: N(8) });
  bew("Umlagerung", bOrt(LAGER, "R-12"), 6, -14, { lagerort_von: HARD, platz_von: "H-05", lagerort_nach: LAGER, platz_nach: "R-12" });
  bew("Reservierung", bOrt(LAGER, "R-02"), 2, -6, { bezug_doctype: "PH Bestellung", bezug: "PH-S-261011-00001" });
  bew("Ausbuchung", bOrt(LAGER, "R-05"), -1, -20, { lagerort_von: LAGER, platz_von: "R-05", grund: "Beschädigt" });
  bew("Wareneingang", bOrt(LAGER, "R-14"), 1, -8, { lagerort_nach: LAGER, platz_nach: "R-14", grund: "Transportschaden – B-Ware gesperrt", bezug_doctype: "PH Wareneingang", bezug: "WE-2026-00004" });
  bew("Retoure", bOrt(LAGER, "R-06"), 1, -11, { lagerort_nach: LAGER, platz_nach: "R-06", bezug_doctype: "PH Warenruecknahme", bezug: "" });
  bew("Umlagerung", bName("SN-0441"), 1, -150, { lagerort_von: LAGER, platz_von: "R-09", lagerort_nach: SHOWROOM, platz_nach: "A-07" });
  // Bewegung im Showroom nach Zählbeginn der Showroom-Inventur → Freigabe gesperrt
  bew("Umlagerung", bName("SN-0502"), 1, -1, { lagerort_von: SHOWROOM, platz_von: "A-06", lagerort_nach: SHOWROOM, platz_nach: "A-05", von_user: "admin@demo.local" });
  bew("Freigabe", bName("SN-1411"), 1, -30, { grund: "Reservierung abgelaufen", quelle: "scheduler", von_user: "Administrator" });
  bew("Ausbuchung", bName("SN-1411"), -1, -20, { lagerort_von: SHOWROOM, platz_von: "A-11", grund: "Entsorgt" });
  bew("Umlagerung", bOrt(LAGER, "R-07"), 2, -25, { lagerort_von: LAGER, platz_von: "R-01", lagerort_nach: LAGER, platz_nach: "R-07", status: "Storniert" });
  const BW = ersetze(db, hilfe, "PH Lagerbewegung", bw);
  const storniert = BW.find((x) => x.status === "Storniert");
  if (storniert) {
    const gegen = { ...storniert, art: "Umlagerung", status: "Gebucht", menge: 2, lagerort_von: LAGER, platz_von: "R-07", lagerort_nach: LAGER, platz_nach: "R-01", storno_von: storniert.name, datum: dz(-25, 16), titel: `Storno ${storniert.name}` };
    delete gegen.name;
    const meta = hilfe.index.doctypes.get("PH Lagerbewegung");
    const n = hilfe.neuerName(meta, gegen, hilfe.naechste, tage(0));
    hilfe.tabelle("PH Lagerbewegung").set(n, { ...gegen, name: n });
  }

  // ------------------------------------------------------------- Sendungen
  const tr = (zeilen) => zeilen.map(([n, h, status, ort, text]) => ({ zeit: dz(n, h), status, code: status.toUpperCase().slice(0, 3), ort, text }));
  const snd = (l, extra) => ({
    naming_series: "PH-SND-.YYYY.-.#####", titel: `Sendung ${l.kunde_name}`, richtung: "Ausgang", dienstleister: "LetMeShip", env: "test", lieferschein: l.name, kontakt: l.kontakt, carrier: "DPD", service_name: "DPD Classic",
    laufzeit_tage: 2, waehrung: "EUR", anzahl_pakete: (l.pakete || []).length || 1, gewicht_g: l.gesamtgewicht_g, inhalt: "Wohnaccessoires", empf_name: l.kunde_name, empf_strasse: l.liefer_strasse, empf_hausnr: l.liefer_hausnr,
    empf_plz: l.liefer_plz, empf_ort: l.liefer_ort, empf_land: l.liefer_land, empf_email: l.kunde_email, preis_netto_cent: 917, preis_brutto_cent: 1100, berechnet_cent: 990, fehler: "", tracking_verlauf: [], ...extra,
  });
  const S = ersetze(db, hilfe, "PH Sendung", [
    snd(L[2], { status: "Angelegt", carrier: "", service_name: "", preis_netto_cent: 0, preis_brutto_cent: 0, creation: dz(-3, 9), modified: dz(-3, 9), fehler: "Gewicht fehlte beim ersten Versuch" }),
    snd(L[7], { status: "Unterwegs", tracking_nr: "0123456789012", tracking_url: "https://tracking.beispiel.invalid/0123456789012", gebucht_am: dz(-3, 15), unterwegs_seit: dz(-3, 17), letzter_abgleich: dz(0, 8), etikett: "/private/files/etikett-muster.pdf",
      tracking_verlauf: tr([[-3, 17, "Übernommen", "6911 Lochau", "Paket vom Absender übernommen"], [-2, 6, "Unterwegs", "4600 Wels", "Im Paketzentrum bearbeitet"], [0, 7, "Zustellung", "6850 Dornbirn", "In Zustellung"]]) }),
    snd(L[8], { status: "Zugestellt", tracking_nr: "0123456789099", tracking_url: "https://tracking.beispiel.invalid/0123456789099", gebucht_am: dz(-8, 15), unterwegs_seit: dz(-8, 17), zugestellt_am: dz(-6, 11, 20), letzter_abgleich: dz(-6, 12),
      tracking_verlauf: tr([[-8, 17, "Übernommen", "6911 Lochau", "Paket übernommen"], [-6, 11, "Zugestellt", "6890 Lustenau", "Zugestellt an L. Berger"]]) }),
    snd(L[17], { status: "Etikett", tracking_nr: "0123456789123", gebucht_am: dz(0, 9, 40), etikett: "/private/files/etikett-muster.pdf", carrier: "GLS", service_name: "GLS Business", preis_netto_cent: 1033, preis_brutto_cent: 1240, berechnet_cent: 990 }),
    snd(L[18], { status: "Problem", tracking_nr: "0123456789555", tracking_url: "https://tracking.beispiel.invalid/0123456789555", gebucht_am: dz(-9, 15), unterwegs_seit: dz(-9, 17), letzter_abgleich: dz(0, 8), fehler: "Empfänger nicht angetroffen – Paket im Depot",
      tracking_verlauf: tr([[-9, 17, "Übernommen", "6911 Lochau", "Paket übernommen"], [-8, 9, "Zustellversuch", "6863 Egg", "Empfänger nicht angetroffen"], [-7, 9, "Depot", "6850 Dornbirn", "Paket liegt im Depot"]]) }),
    snd(L[16], { status: "Storniert", env: "mock", richtung: "Retoure", carrier: "DPD", tracking_nr: "", storniert_am: dz(-2, 10), fehler: "" }),
    snd(L[8], { status: "Unterwegs", richtung: "Retoure", tracking_nr: "0123456789777", gebucht_am: dz(-1, 10), unterwegs_seit: dz(-1, 14), letzter_abgleich: dz(0, 8), inhalt: "Rücksendung Kerzenhalter", tracking_verlauf: tr([[-1, 14, "Übernommen", "6890 Lustenau", "Retoure übernommen"]]) }),
  ]);
  void S;

  // ---------------------------------------------------------------- Touren
  const stopp = (l, i, status = "offen", extra = {}) => ({
    reihenfolge: i, art: "Lieferung", lieferschein: l?.name || "", kontakt: l?.kontakt || "", kunde_name: l?.kunde_name || "", adresse: l ? `${l.liefer_strasse} ${l.liefer_hausnr}` : "", plz: l?.liefer_plz || "", ort: l?.liefer_ort || "", land: l?.liefer_land || "AT",
    telefon: l?.kunde_telefon || "", zeitfenster_von: "", zeitfenster_bis: "", fahrt_min: 20, eta: "", zeitfenster_konflikt: 0, dauer_min: 30, montage_min: 0, status, notiz: "", ...extra,
  });
  const T = ersetze(db, hilfe, "PH Tour", [
    { naming_series: "PH-TOUR-.YYYY.-.####", titel: "Tour Lochau – Bregenz", status: "Unterwegs", datum: d(0), region: "Lochau, Bregenz", fahrzeug: FZ1, fahrer: "montage@demo.local", start_zeit: "07:30:00", start_lagerort: LAGER, km_start: 48210,
      team: [{ user: "techniker@demo.local", rolle: "Monteur" }],
      stopps: [stopp(L[11], 1, "erledigt", { zeitfenster_von: "08:00:00", zeitfenster_bis: "09:00:00", eta: "08:05:00" }), stopp(null, 2, "unterwegs", { art: "Montage", montage_referenz: "PH-MON-2026-0004", kunde_name: "Küche Muster", adresse: "Am Bach 3", plz: "6900", ort: "Bregenz", dauer_min: 150, montage_min: 120, zeitfenster_von: "09:30:00", zeitfenster_bis: "12:00:00", eta: "09:20:00" }),
        stopp(null, 3, "offen", { art: "Abholung", kunde_name: "Polsterei Muster", adresse: "Werkstraße 5", plz: "6900", ort: "Bregenz", zeitfenster_von: "13:00:00", zeitfenster_bis: "13:30:00", eta: "13:10:00", notiz: "Bezug Sessel abholen" })] },
    { naming_series: "PH-TOUR-.YYYY.-.####", titel: "Tour Lochau", status: "Geplant", datum: d(1), region: "Lochau", fahrzeug: FZ1, fahrer: "montage@demo.local", start_zeit: "07:30:00", start_lagerort: LAGER,
      team: [{ user: "techniker@demo.local", rolle: "Monteur" }],
      stopps: [stopp(L[4], 1, "offen", { zeitfenster_von: "08:00:00", zeitfenster_bis: "10:00:00", eta: "08:00:00", dauer_min: 60, montage_min: 45 }), stopp(L[13], 2, "offen", { zeitfenster_von: "10:30:00", zeitfenster_bis: "11:00:00", eta: "11:05:00", zeitfenster_konflikt: 1 })] },
    { naming_series: "PH-TOUR-.YYYY.-.####", titel: "Tour Hard – Lustenau", status: "Freigegeben", datum: d(2), region: "Hard, Lustenau", fahrzeug: FZ2, fahrer: "techniker@demo.local", start_zeit: "07:00:00", start_lagerort: HARD, freigegeben_von: "admin@demo.local",
      team: [], stopps: [stopp(null, 1, "offen", { art: "Abholung", kunde_name: "Tischlerei Muster", adresse: "Gewerbepark 2", plz: "6890", ort: "Lustenau", eta: "07:40:00", notiz: "Platte für Projekt abholen" })] },
    { naming_series: "PH-TOUR-.YYYY.-.####", titel: "Tour Hard", status: "Abgeschlossen", datum: d(-6), region: "Hard", fahrzeug: FZ1, fahrer: "montage@demo.local", start_zeit: "07:30:00", start_lagerort: LAGER, km_start: 48020, km_ende: 48210,
      team: [], stopps: [stopp(L[10], 1, "nicht angetroffen", { notiz: "Niemand da – Nachbar nicht bereit" })] },
    { naming_series: "PH-TOUR-.YYYY.-.####", titel: "Tour Bregenzerwald", status: "Geplant", datum: d(5), region: "Bregenzerwald", fahrzeug: FZ2, fahrer: "", start_zeit: "07:00:00", start_lagerort: HARD, team: [], stopps: [] },
    { naming_series: "PH-TOUR-.YYYY.-.####", titel: "Tour Dornbirn", status: "Abgebrochen", datum: d(-13), region: "Dornbirn", fahrzeug: FZ2, fahrer: "techniker@demo.local", start_zeit: "08:00:00", start_lagerort: LAGER, team: [], stopps: [], notiz_intern: "Fahrzeug ausgefallen" },
  ]);
  L[4].tour = T[1].name;
  L[13].tour = T[1].name;
  L[11].tour = T[0].name;
  L[10].tour = T[3].name;

  // ------------------------------------------------------- Speditionsaufträge
  const pk = (art, anzahl, l, b_, h, g, extra = {}) => ({ art, anzahl, bezeichnung: "", laenge_cm: l, breite_cm: b_, hoehe_cm: h, gewicht_g: g, stapelbar: 0, zerbrechlich: 0, ...extra });
  ersetze(db, hilfe, "PH Speditionsauftrag", [
    { naming_series: "PH-SPA-.YYYY.-.####", titel: "Spedition Weingut am Pfänder", status: "Gesendet", richtung: "Lager an Kunde", spediteur: "Spedition Muster", spediteur_email: "dispo@spedition-muster.beispiel.invalid", lieferschein: N(9), kunde_name: "Weingut am Pfänder",
      abhol_name: "Platzhirsch Lager Lochau", abhol_strasse: "Landstraße 1", abhol_plz: "6911", abhol_ort: "Lochau", abhol_land: "AT", abhol_datum: d(1), abhol_von: "08:00:00", abhol_bis: "12:00:00",
      ziel_name: "Weingut am Pfänder", ziel_strasse: "Pfänderweg 2", ziel_plz: "6911", ziel_ort: "Lochau", ziel_land: "AT", zustell_datum: d(2), zustell_von: "09:00:00", zustell_bis: "12:00:00", zustellart: "Bis Verwendungsstelle", avis_noetig: 1, etage: 0, aufzug: 0, hebebuehne: 1, trageservice: 1,
      packstuecke: [pk("Palette", 1, 120, 80, 140, 137000)] },
    { naming_series: "PH-SPA-.YYYY.-.####", titel: "Spedition Minotti an Lager", status: "Bestaetigt", richtung: "Hersteller an Lager", spediteur: "Spedition Muster", spediteur_email: "dispo@spedition-muster.beispiel.invalid", kommission: P1, kunde_name: "",
      abhol_name: "Hersteller (Beispiel)", abhol_ort: "Meda", abhol_land: "IT", abhol_datum: d(-1), ziel_name: "Platzhirsch Lager Lochau", ziel_strasse: "Landstraße 1", ziel_plz: "6911", ziel_ort: "Lochau", ziel_land: "AT", zustell_datum: d(3), zustellart: "Bordsteinkante",
      packstuecke: [pk("Möbel lose", 2, 240, 110, 90, 98000), pk("Kolli", 3, 80, 60, 60, 18000)] },
    { naming_series: "PH-SPA-.YYYY.-.####", titel: "Spedition Yacht Aurelia", status: "Entwurf", richtung: "Lager an Kunde", spediteur: "", spediteur_email: "", lieferschein: N(14), kunde_name: "Yacht Aurelia",
      ziel_name: "Yachtservice Muster AG", ziel_strasse: "Hafenstrasse 1", ziel_plz: "8280", ziel_ort: "Kreuzlingen", ziel_land: "CH", zustell_datum: d(9), zustellart: "Mit Montage", packstuecke: [] },
    { naming_series: "PH-SPA-.YYYY.-.####", titel: "Spedition Hotel Seeblick", status: "Zugestellt", richtung: "Hersteller an Kunde", spediteur: "Spedition Muster", spediteur_email: "dispo@spedition-muster.beispiel.invalid", kunde_name: "Hotel Seeblick",
      ziel_name: "Hotel Seeblick", ziel_ort: "Lindau", ziel_land: "DE", abhol_datum: d(-12), zustell_datum: d(-10), zustellart: "Mit Montage", packstuecke: [pk("Palette", 4, 120, 80, 120, 260000)] },
  ]);

  // ---------------------------------------------------------- Rücknahmen
  ersetze(db, hilfe, "PH Warenruecknahme", [
    { naming_series: "PH-WR-.YYYY.-.####", titel: "Rücknahme Lukas Berger", status: "Angemeldet", anlass: "Kundenrueckgabe", grund: "Farbe passt nicht", kunde_name: "Lukas Berger", lieferschein: N(8), abhol_datum: d(3), lagerort: LAGER,
      positionen: [{ produkt: "", produkt_name: A.halter.beschreibung, menge: 1, zustand: "", entscheidung: "", platz: "", bemerkung: "" }] },
    { naming_series: "PH-WR-.YYYY.-.####", titel: "Rücknahme Paul Stadler", status: "Angenommen", anlass: "Kundenrueckgabe", grund: "Doppelt gekauft", kunde_name: "Paul Stadler", lieferschein: N(16), eingegangen_am: dz(-1, 15), lagerort: LAGER, unterschrift_name: "Paul Stadler",
      positionen: [{ produkt: "", produkt_name: A.bell.beschreibung, menge: 1, zustand: "Neuwertig", entscheidung: "Wiedereinlagern", platz: "R-06", bemerkung: "" }] },
    { naming_series: "PH-WR-.YYYY.-.####", titel: "Rücknahme Anna Gruber", status: "Abgeschlossen", anlass: "Kundenrueckgabe", grund: "Defekt bei Lieferung", kunde_name: "Anna Gruber", lieferschein: N(7), eingegangen_am: dz(-12, 10), geprueft_am: dz(-11, 9), abgeschlossen_am: dz(-10, 10), alle_gebucht: 1, gutschrift_hinweis: "Gutschrift über Faktura",
      positionen: [{ produkt: "", produkt_name: A.bell.beschreibung, menge: 1, zustand: "Defekt", entscheidung: "An Lieferant", platz: "", bemerkung: "Schalter defekt" }] },
  ]);

  // -------------------------------------------------------------- Inventur
  const invPos = (bestaende, zaehl = {}) => bestaende.map((x) => {
    const z = zaehl[x.platz];
    const soll = Number(x.menge || 0);
    const ist = z?.ist ?? null;
    return { lagerbestand: x.name, produkt: x.produkt, produkt_name: x.produkt_name, platz: x.platz, seriennummer: x.seriennummer || "", ean: x.ean || "", fund: 0, soll, ist: ist ?? 0, gezaehlt: ist === null ? 0 : 1, differenz: ist === null ? 0 : ist - soll, grund: z?.grund || "", bemerkung: "" };
  });
  const teilPlaetze = ["R-01", "R-02", "R-03", "R-04", "R-05", "R-06", "R-07", "R-08"];
  const lagerTeil = B.filter((x) => x.lagerort === LAGER && teilPlaetze.includes(x.platz));
  const showroomAlle = B.filter((x) => x.lagerort === SHOWROOM && x.status !== "Ausgeschieden");
  const lagerAlt = B.filter((x) => x.lagerort === LAGER && ["R-09", "R-12"].includes(x.platz));
  const zus = (pos_) => ({ anzahl_positionen: pos_.length, anzahl_gezaehlt: pos_.filter((p) => p.gezaehlt).length, differenz_positionen: pos_.filter((p) => p.gezaehlt && p.differenz).length, differenz_summe: pos_.reduce((s, p) => s + (p.gezaehlt ? p.differenz : 0), 0) });
  const p1 = invPos(lagerTeil, { "R-02": { ist: 6 }, "R-03": { ist: 17 }, "R-04": { ist: 10 }, "R-05": { ist: 2, grund: "Beschaedigt" } });
  const p2 = invPos(showroomAlle, { "A-01": { ist: 1 }, "A-03": { ist: 1 }, "A-04": { ist: 1 }, "A-05": { ist: 1 } });
  const p3 = invPos(lagerAlt, { "R-09": { ist: 2 }, "R-12": { ist: 23, grund: "Schwund" } });
  ersetze(db, hilfe, "PH Inventur", [
    { naming_series: "PH-INV-.YYYY.-.####", titel: "Teilinventur Lager R-01 bis R-08", status: "Laufend", lagerort: LAGER, datum: d(0), inventur_art: "Teilinventur", plaetze: teilPlaetze.join("\n"), geschaeftsjahr: "2026", gezaehlt_von: "logistik@demo.local", positionen: p1, ...zus(p1), bemerkung: "", gezaehlte_plaetze: "" },
    { naming_series: "PH-INV-.YYYY.-.####", titel: "Showroom-Umbau", status: "Laufend", lagerort: SHOWROOM, datum: d(-2), inventur_art: "Anlass", anlass: "Showroom-Umbau", nur_ausstellungsstuecke: 1, gezaehlt_von: "logistik@demo.local", positionen: p2, ...zus(p2) },
    { naming_series: "PH-INV-.YYYY.-.####", titel: "Teilinventur Lager R-09 bis R-12", status: "Abgeschlossen", lagerort: LAGER, datum: d(-12), inventur_art: "Teilinventur", plaetze: "R-09\nR-12", gezaehlt_von: "logistik@demo.local", freigegeben_von: "admin@demo.local", freigegeben_am: dz(-12, 17), positionen: p3, ...zus(p3) },
    { naming_series: "PH-INV-.YYYY.-.####", titel: "Außenlager Hard", status: "Geplant", lagerort: HARD, datum: d(3), inventur_art: "Stichtag", positionen: [], anzahl_positionen: 0, anzahl_gezaehlt: 0, differenz_positionen: 0, differenz_summe: 0 },
    { naming_series: "PH-INV-.YYYY.-.####", titel: "Probezählung", status: "Verworfen", lagerort: LAGER, datum: d(-30), inventur_art: "Anlass", anlass: "Probelauf", positionen: [], anzahl_positionen: 0, anzahl_gezaehlt: 0, differenz_positionen: 0, differenz_summe: 0 },
  ]);

  // --------------------------------------------------- Inventurbewertung
  if (hilfe.index.doctypes.has("PH Inventurbewertung")) {
    const zeilen = (stichtag) => B.filter((x) => Number(x.menge) > 0 && !["Verkauft", "Ausgeschieden"].includes(x.status)).map((x) => {
      const art = Number(x.ausstellungsstueck) ? "Ausstellungsstueck" : x.zustand === "B-Ware" ? "B-Ware" : "Lagerware";
      const monate = Math.max(0, Math.floor((tage(0) - new Date(`${x.eingang_am}T00:00:00`)) / (30.44 * 86_400_000)));
      const promille = art === "Ausstellungsstueck" ? (monate >= 36 ? 800 : monate >= 24 ? 600 : monate >= 12 ? 400 : 200) : art === "B-Ware" ? 300 : monate >= 24 ? 500 : 0;
      const einzel = Math.round((x.ek_cent * (1000 - promille)) / 1000);
      return { lagerbestand: x.name, produkt: x.produkt, produkt_name: x.produkt_name, marke: x.marke, lagerort: x.lagerort, platz: x.platz, seriennummer: x.seriennummer || "", bewertungsart: art, menge: x.menge, einstandspreis_cent: x.ek_cent, ek_quelle: "Rückfall EK", alter_monate: monate, abwertung_promille: promille, nettoerloes_cent: 0, einzelwert_cent: einzel, wert_ak_cent: x.menge * x.ek_cent, abwertung_cent: x.menge * (x.ek_cent - einzel), wert_cent: x.menge * einzel, hinweis: "", stichtag };
    });
    const ib = (status, stichtag, extra = {}) => {
      const z = zeilen(stichtag);
      return { naming_series: "PH-IB-.YYYY.-.####", titel: `Inventurbewertung ${stichtag}`, status, stichtag, lagerort: "", methode: "Gleitender Durchschnitt", berechnet_am: dz(0, 8), erstellt_von: "admin@demo.local", abwertung_platzhalter: 1,
        methode_beschreibung: "Einstandspreis als gleitender Durchschnitt aus Wareneingängen; Rückfall EK der Bestandszeile. Niederstwert aus Abwertungsstaffel und Nettoerlös.", anzahl_positionen: z.length, menge_gesamt: z.reduce((s, x) => s + x.menge, 0),
        ohne_ek: 0, wert_ak_cent: z.reduce((s, x) => s + x.wert_ak_cent, 0), abwertung_cent: z.reduce((s, x) => s + x.abwertung_cent, 0), wert_cent: z.reduce((s, x) => s + x.wert_cent, 0), positionen: z.map(({ stichtag: _s, ...r }) => r), export_status: "offen", ...extra };
    };
    ersetze(db, hilfe, "PH Inventurbewertung", [
      ib("Festgeschrieben", d(-35), { festgeschrieben_von: "admin@demo.local", festgeschrieben_am: dz(-34, 10), export_status: "exportiert" }),
      ib("Entwurf", d(0)),
    ]);
  }

  // ------------------------------------------- Meldebestand und Vorschläge
  if (hilfe.index.doctypes.has("PH Meldebestand")) {
    const mb = (art, ort, melde, ziel, bestand, reserviert, offen, extra = {}) => {
      const verfuegbar = bestand - reserviert + offen;
      return { naming_series: "PH-MB-.#####", titel: `Meldebestand ${art.beschreibung}`, status: "Aktiv", produkt: art.produkt || "", produkt_name: art.beschreibung, marke: art.marke, lagerort: ort, meldebestand: melde, zielbestand: ziel, bestellmenge_min: 1, verpackungseinheit: 1, sicherheit_tage: 7, wiederbeschaffung_tage: 21,
        bestand, reserviert, kommission: 0, gesperrt: 0, offen_bestellt: offen, verfuegbar, unter_meldebestand: verfuegbar <= melde ? 1 : 0, empfehlung_meldebestand: melde, wbz_quelle: "Lieferant", berechnet_am: dz(0, 5, 45), ...extra };
    };
    ersetze(db, hilfe, "PH Meldebestand", [
      mb(A.glas, LAGER, 12, 36, 24, 0, 0),
      mb(A.kerze, LAGER, 24, 48, 24, 2, 0),
      mb(A.bell, LAGER, 4, 10, 6, 0, 0),
      mb(A.plaid, LAGER, 6, 12, 5, 0, 0),
      mb(A.halter, LAGER, 6, 16, 10, 0, 6),
    ]);
  }
  if (hilfe.index.doctypes.has("PH Bestellvorschlag")) {
    const bv = (art, status, verfuegbar, melde, ziel, menge, extra = {}) => ({ naming_series: "PH-BV-.YYYY.-.#####", titel: `Bestellvorschlag ${art.beschreibung}`, status, produkt: art.produkt || "", produkt_name: art.beschreibung, marke: art.marke, lagerort: LAGER, lieferant: "", erstellt_am: dz(0, 5, 45), wiederbeschaffung_tage: 21, voraussichtlich_am: d(21),
      bestand: verfuegbar, reserviert: 0, kommission: 0, gesperrt: 0, offen_bestellt: 0, verfuegbar, meldebestand: melde, zielbestand: ziel, bestellmenge_min: 1, vorschlag_menge: menge, menge_manuell: 0, ek_cent: art.ek, wert_cent: art.ek * menge, ...extra });
    ersetze(db, hilfe, "PH Bestellvorschlag", [
      bv(A.kerze, "Offen", 22, 24, 48, 26),
      bv(A.plaid, "Offen", 5, 6, 12, 7),
      bv(A.loewe, "Bestellt", 2, 2, 6, 4, { bestellt_am: dz(-5, 10), bestellt_von: "admin@demo.local", herstellerbestellung: "" }),
    ]);
  }
}
