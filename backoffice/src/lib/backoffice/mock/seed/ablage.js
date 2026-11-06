// Mock-Seed – Bereich Ablage (G-01, MASTER § 3.5). Schreibt: Team B-ABL.
// Festbestand für jeden Status und jeden Leer-/Fehlerfall (Konzept 10-konzept-ablage §11):
// Bereichsordner (Projekte, Kontakte, Lieferanten, Mitarbeiter = nur Leitung, Allgemein), je Projekt die Vorlage
// 01–08 mit Beispieldateien (echte Raum-/Produktbilder aus public/entwurf/lounge als Vorschau), Belege mit
// Löschsperre, Office ohne Vorschau, CAD mit Metadaten, Vorschau ausstehend/Fehler, Versionen, eigene und
// fremde Sperre, Papierkorb (Frist 28 und 4 Tage), Freigabelinks in allen Zuständen (feste Demo-Tokens),
// Portal-Freigabe, Ereignisse, Einstellungen. Leerfall: „08 Service“ im dritten Projekt.
// Keine echten Personen, E-Mails @demo.local/@beispiel.invalid (Q-A3).
//
// Bewusst ohne `anzahl`/`kern`: beides liefe über den gemeinsamen Zufall und verschöbe die Beispieldaten aller
// Bereiche. Der Nachlauf hat einen eigenen Zufall und ändert nur die Ablage-Tabellen.
// Der laufende Dev-Server (kein Neustart erlaubt) wird über `istGesaet` + lib/backoffice/ablage/daten.js einmalig
// nachgesät; der Nachlauf ist deshalb wiederholbar (leert vorher die Ablage-Tabellen).

import { isoDatum, isoDatumZeit } from "../../format.js";
import { mockPasswortHash, sha256Hex } from "../../ablage/sha256.js";

/** Nachläufe anderer Bereiche, die vor diesem laufen müssen (Projekte/CRM/Sortiment/Personal liefern Bezüge). */
export const nach = ["projekte", "crm", "sortiment", "personal"];

/** Anzahl generischer Datensätze je DocType (nicht gelistete mit Status bekommen 6). */
export const anzahl = {};

/** Fachliche Nachbearbeitung je DocType: (doc, { i, r, ctx, person }) – ändert doc. */
export const kern = {};

export const SEED_VERSION = "b-abl-1";
const EINST = "PH Ablage Einstellungen";
const TABELLEN = ["PH Ordner", "PH Datei", "PH Datei Freigabelink", "PH Ablage Ereignis"];

/** Feste Tokens der Beispiel-Freigaben (nur Mock; E2E und Abnahme-Bilder von /f/<token>). */
export const DEMO_TOKENS = Object.freeze({
  aktiv: "demoKuecheAbend01",
  passwort: "demoAngebotPw0002",
  abgelaufen: "demoAbgelaufen003",
  widerrufen: "demoWiderrufen004",
  aufgebraucht: "demoAufgebraucht5",
  bald: "demoTerrasseBald6",
});
export const DEMO_PASSWORT = "seeblick";

const BILD = (n) => `/entwurf/lounge/${n}`;
const MIME = {
  pdf: "application/pdf", jpg: "image/jpeg", png: "image/png", webp: "image/webp", dwg: "application/acad", skp: "application/vnd.sketchup.skp",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  mp4: "video/mp4", txt: "text/plain",
};
const ART = { pdf: "pdf", jpg: "bild", png: "bild", webp: "bild", dwg: "cad", skp: "cad", docx: "office", xlsx: "office", mp4: "video", txt: "text" };

const PROJEKT_VORLAGE = [
  ["01 Aufmaß", "Projekt"], ["02 Planung & Handzeichnung", "Projekt"], ["03 Renderings", "Projekt"], ["04 Angebote & Verträge", "Beleg"],
  ["05 Herstellerunterlagen", "Projekt"], ["06 Montage & Abnahme", "Projekt"], ["07 Fotos", "Projekt"], ["08 Service", "Projekt"],
];

/**
 * Dateien je Projekt (Index) und Vorlagenordner. Eintrag: [Name, Endung, Größe (Byte), Optionen]
 * Optionen: bild, versionen, status ("ausstehend"|"fehler"), sperre ("fremd"|"eigen"), portal, tags, cad, beschreibung, tage (Alter).
 */
const PROJEKT_DATEIEN = [
  {
    "01 Aufmaß": [["Aufmaß Küche", "pdf", 842_000, { versionen: 2, tags: "Aufmaß, Küche", tage: 40 }], ["Bestand Nordwand", "jpg", 2_310_000, { bild: "r-kueche-eiche.jpg", tage: 40 }]],
    "02 Planung & Handzeichnung": [
      ["Grundriss Küche M 1-50", "dwg", 2_480_000, { cad: { version: "AC1032 (AutoCAD 2018)", einheit: "Millimeter", ausdehnung: "6.240 × 4.180 mm" }, tage: 21 }],
      ["Ansicht Kochinsel", "pdf", 1_160_000, { versionen: 3, sperre: "fremd", tags: "Planung, Kochinsel", beschreibung: "Stand nach dem zweiten Beratungsgespräch.", tage: 2 }],
      ["Handskizze Sideboard", "jpg", 1_240_000, { bild: "r-essen-licht.jpg", tage: 18 }],
    ],
    "03 Renderings": [
      ["Rendering Kochinsel Abend", "jpg", 3_620_000, { bild: "r-kueche-eiche.jpg", portal: true, tags: "Rendering, Kunde", tage: 5 }],
      ["Rendering Essplatz", "jpg", 3_480_000, { bild: "r-hero-essraum.jpg", tage: 5 }],
      ["Rendering Variante Eiche hell", "png", 4_100_000, { bild: "r-essen-licht.jpg", status: "ausstehend", tage: 0 }],
    ],
    "04 Angebote & Verträge": [["Angebot AN-2026-0012 unterschrieben", "pdf", 312_000, { tage: 30 }], ["Auftragsbestätigung AB-2026-0031", "pdf", 288_000, { tage: 26 }]],
    "05 Herstellerunterlagen": [["Montageanleitung Kochfeld", "pdf", 5_240_000, { tage: 12 }], ["Datenblatt Dunstabzug", "pdf", 1_920_000, { status: "fehler", tage: 12 }]],
    "06 Montage & Abnahme": [["Montageplan KW 46", "pdf", 220_000, { tage: 3 }]],
    "07 Fotos": [["Baustelle Tag 1", "jpg", 2_840_000, { bild: "r-hero-essraum.jpg", tage: 1 }], ["Lieferung Fronten", "jpg", 2_910_000, { bild: "r-essen-licht.jpg", tage: 1 }]],
    "08 Service": [["Pflegehinweise Eiche", "docx", 64_000, { tage: 6 }], ["Materialliste", "xlsx", 46_000, { sperre: "eigen", versionen: 2, tage: 4 }]],
  },
  {
    "02 Planung & Handzeichnung": [["Entwurf Wohnen und Essen", "pdf", 2_060_000, { versionen: 2, tags: "Entwurf", tage: 15 }], ["Modell Erdgeschoss", "skp", 18_400_000, { cad: { version: "SketchUp 2024", einheit: "Zentimeter" }, tage: 15 }]],
    "03 Renderings": [
      ["Terrasse Abendlicht", "jpg", 3_920_000, { bild: "r-terrasse-see.jpg", portal: true, tage: 9 }],
      ["Gartenlounge", "jpg", 3_640_000, { bild: "r-garten-lounge.jpg", tage: 9 }],
      ["Schlafzimmer Variante B", "webp", 1_480_000, { bild: "r-schlafen.webp", tage: 8 }],
      ["Wohnen Sofalandschaft", "jpg", 3_310_000, { bild: "r-wohnen-sofa.jpg", tage: 8 }],
    ],
    "04 Angebote & Verträge": [["Angebot AN-2026-0019", "pdf", 296_000, { tage: 20 }]],
    "06 Montage & Abnahme": [["Abnahmeprotokoll Teil 1", "pdf", 240_000, { tage: 0 }]],
    "07 Fotos": [["Rundgang Erdgeschoss", "mp4", 48_200_000, { tage: 1 }], ["Terrasse vorher", "jpg", 2_640_000, { bild: "r-terrasse-hotel.jpg", tage: 30 }]],
    "08 Service": [["Wartung Markise", "pdf", 180_000, { tage: 10 }]],
  },
  {
    "01 Aufmaß": [["Aufmaß Bad", "pdf", 610_000, { tage: 50 }]],
    "03 Renderings": [["Masterbad Naturstein", "webp", 1_620_000, { bild: "r-bad.webp", tage: 22 }]],
    "04 Angebote & Verträge": [["Angebot AN-2026-0008", "pdf", 274_000, { tage: 48 }]],
    "05 Herstellerunterlagen": [["Mosaik Verlegeplan", "pdf", 1_380_000, { tags: "Ezarri, Mosaik", tage: 25 }]],
  },
  {
    "02 Planung & Handzeichnung": [["Variante A Sofalandschaft", "pdf", 1_740_000, { tage: 4 }], ["Variante B Essplatz", "pdf", 1_690_000, { tage: 4 }]],
    "03 Renderings": [["Wohnbereich Abend", "jpg", 3_480_000, { bild: "r-wohnen-sofa.jpg", tage: 3 }]],
  },
];

const ALLGEMEIN = {
  "Vorlagen & Formulare": [["Aufmaßblatt Vorlage", "pdf", 182_000, { tage: 120 }], ["Briefpapier Platzhirsch", "docx", 92_000, { tage: 200 }], ["Kalkulation Vorlage", "xlsx", 58_000, { tage: 90 }]],
  Showroom: [
    ["Leuchte Bell", "webp", 640_000, { bild: "p-bell-leuchte.webp", tags: "Showroom, Leuchten", tage: 33 }],
    ["Leuchte Stone", "webp", 580_000, { bild: "p-stone-leuchte.webp", tags: "Showroom, Leuchten", tage: 33 }],
    ["Bellhop Tischleuchte", "webp", 520_000, { bild: "p-flos-bellhop.webp", tage: 33 }],
    ["Kähler Löwe", "webp", 410_000, { bild: "p-kaehler-loewe.webp", tage: 60 }],
    ["Lyngby Halter", "webp", 380_000, { bild: "p-lyngby-halter.webp", tage: 60 }],
    ["Trudon Kerze", "webp", 360_000, { bild: "p-trudon-kerze.webp", tage: 61 }],
    ["Zalto Bordeaux", "webp", 330_000, { bild: "p-zalto-bordeaux.webp", tage: 61 }],
  ],
  Marketing: [["Herbstkatalog 2026", "pdf", 12_600_000, { tags: "Katalog", tage: 70 }], ["Event Lichtabend Plakat", "pdf", 2_400_000, { tage: 14 }], ["Instagram November", "jpg", 1_900_000, { bild: "r-garten-lounge.jpg", tage: 2 }]],
};

/** Wiederholbarer Nachsaat-Check (laufender Dev-Server). */
export function istGesaet(db) {
  return db?.get(EINST)?.get(EINST)?._abl_seed === SEED_VERSION;
}

function rng(seed = 13_2026) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, int: (a, b) => a + Math.floor(next() * (b - a + 1)), pick: (l) => l[Math.floor(next() * l.length)] };
}

function groesseText(n) {
  for (const [e, f] of [["GB", 1024 ** 3], ["MB", 1024 ** 2], ["KB", 1024]]) if (n >= f) return `${(n / f).toFixed(1).replace(".", ",")} ${e}`;
  return `${n} B`;
}

function hexAus(text) {
  return sha256Hex(`ph-ablage-seed:${text}`);
}

/**
 * @param {Map<string, Map<string, object>>} db
 * @param {import("./index.js").SeedHilfe} hilfe
 */
export default function nachlauf(db, hilfe) {
  const metaOrdner = hilfe.index?.doctypes?.get("PH Ordner");
  const metaDatei = hilfe.index?.doctypes?.get("PH Datei");
  if (!metaOrdner || !metaDatei) return;
  const r = rng();
  for (const t of TABELLEN) hilfe.tabelle(t).clear();
  const ordner = hilfe.tabelle("PH Ordner");
  const dateien = hilfe.tabelle("PH Datei");
  const links = hilfe.tabelle("PH Datei Freigabelink");
  const ereignisse = hilfe.tabelle("PH Ablage Ereignis");
  // Bezug: heutiger Tag (deterministisch innerhalb eines Tages – Seed-Fingerabdruck), Sperren und Links laufen
  // relativ zu heute, damit sie am laufenden Dev-Server gültig bleiben.
  const echtJetzt = new Date();
  echtJetzt.setHours(9, 0, 0, 0);
  const tagEnde = (tage) => {
    const d = new Date(echtJetzt.getTime());
    d.setDate(d.getDate() + tage);
    d.setHours(23, 59, 0, 0);
    return d;
  };
  const basis = { modified_by: "Administrator", docstatus: 0, idx: 0 };
  const zeitVor = (tage, std = 10) => {
    const d = new Date(echtJetzt.getTime());
    d.setDate(d.getDate() - tage);
    d.setHours(tage > 0 ? std : 7 + (std % 2), r.pick([5, 12, 24, 38, 47]), 0, 0);
    return d;
  };
  let evNr = 0;
  const ereignis = (art, d, { tage = 0, user, hinweis = "", link = "", version = 0 } = {}) => {
    const z = isoDatumZeit(zeitVor(tage, 9 + (evNr % 8)));
    const name = `abl-seed-${String(++evNr).padStart(4, "0")}`;
    ereignisse.set(name, { name, doctype: "PH Ablage Ereignis", titel: `${art} · ${d.name}`, art, zeitpunkt: z, benutzer: user || d.owner, datei: d.name, ordner: d.ordner, version, freigabelink: link, bezug_doctype: d.bezug_doctype || "", bezug_name: d.bezug_name || "", hinweis, automatisch: 0, owner: user || d.owner, creation: z, modified: z, ...basis });
  };

  const neuerOrdner = (titel, eltern, extra = {}) => {
    const modus = extra.rechte_modus || "";
    const doc = { doctype: "PH Ordner", naming_series: "PH-ORD-.######", titel, parent_ph_ordner: eltern?.name || "", is_group: 1, rechte_modus: modus, mitglieder: [], farbe: "", icon: "", aufbewahrungsklasse: "", geschuetzt: 0, vorlage: "", beschreibung: "", quelle: "vorlage", bezug_doctype: eltern?.bezug_doctype || "", bezug_name: eltern?.bezug_name || "", bezug_titel: eltern?.bezug_titel || "", ist_bezugswurzel: 0, ...extra };
    const s = { intern: 0, team: 1, leitung: 2 };
    const em = eltern?.effektiver_modus || "intern";
    doc.effektiver_modus = modus && s[modus] > s[em] ? modus : em;
    doc.pfad = eltern ? `${eltern.pfad} / ${titel}` : titel;
    const zeit = isoDatumZeit(zeitVor(r.int(60, 140)));
    doc.name = hilfe.neuerName(metaOrdner, doc, hilfe.naechste, zeitVor(0));
    Object.assign(doc, basis, { owner: "Administrator", creation: zeit, modified: zeit });
    ordner.set(doc.name, doc);
    return doc;
  };

  const neueDatei = (o, [titel, end, groesse, opt = {}], owner = "projekte@demo.local") => {
    const hoch = zeitVor(opt.tage ?? r.int(1, 30));
    const klasse = o.aufbewahrungsklasse || (o.bezug_doctype === "PH Mitarbeiter" ? "Personal" : o.bezug_doctype === "PH Projekt" ? "Projekt" : o.titel === "Marketing" ? "Marketing" : "Allgemein");
    const versionen = Math.max(1, opt.versionen || 1);
    const sha = hexAus(`${o.name}/${titel}`);
    const doc = {
      doctype: "PH Datei", naming_series: "PH-DAT-.YYYY.-.######", dateiname: `${titel}.${end}`, ordner: o.name, status: "Aktiv",
      bezug_doctype: o.bezug_doctype || "", bezug_name: o.bezug_name || "", bezug_titel: o.bezug_titel || "", endung: end, mime: MIME[end] || "application/octet-stream",
      groesse, groesse_text: groesseText(groesse), aktuelle_version: versionen, sha256: sha, vorschau_art: ART[end] || "keine",
      vorschau_status: ART[end] === "office" ? "Nicht moeglich" : ART[end] === "cad" ? "Fertig" : opt.status === "ausstehend" ? "Ausstehend" : opt.status === "fehler" ? "Fehler" : ART[end] === "bild" ? "Fertig" : "Browser",
      tags: opt.tags || "", beschreibung: opt.beschreibung || "", versionen: [], portal_freigabe: opt.portal ? 1 : 0, portal_ablauf: "", portal_dokument: opt.portal ? "PD-SEED" : "", portal_version: opt.portal ? versionen : 0,
      freigabelinks_aktiv: 0, gesperrt_von: "", gesperrt_bis: "", gesperrt_hinweis: "", aufbewahrungsklasse: klasse, belegdatum: "", aufbewahren_bis: "", loeschsperre: 0,
      geloescht: 0, geloescht_am: "", geloescht_von: "", papierkorb_bis: "", metadaten_json: opt.cad ? JSON.stringify(opt.cad) : "", volltext_status: end === "pdf" ? "ok" : "",
      volltext: end === "pdf" ? `${titel} – Beispielinhalt für die Suche. ${opt.tags || ""}` : "", effektiver_modus: o.effektiver_modus, hochgeladen_von: owner, hochgeladen_am: isoDatumZeit(hoch), quelle: "backoffice",
      _mock_bild: opt.bild ? BILD(opt.bild) : "",
    };
    if (klasse === "Beleg") Object.assign(doc, { belegdatum: isoDatum(hoch), aufbewahren_bis: `${hoch.getFullYear() + 7}-12-31`, loeschsperre: 1 });
    if (klasse === "Personal") Object.assign(doc, { belegdatum: isoDatum(hoch), aufbewahren_bis: `${hoch.getFullYear() + 7}-12-31` });
    doc.name = hilfe.neuerName(metaDatei, doc, hilfe.naechste, hoch);
    for (let v = 1; v <= versionen; v++) {
      const vz = zeitVor(Math.max(0, (opt.tage ?? 10) + (versionen - v) * 3));
      doc.versionen.push({ version: v, hochgeladen_am: isoDatumZeit(vz), hochgeladen_von: v === versionen ? owner : "crm-leitung@demo.local", groesse: Math.round(groesse * (0.86 + v * 0.05)), kommentar: v === 1 ? "Erste Fassung" : v === 2 ? "Nach Kundengespräch: Insel 20 cm schmaler" : "Fronten Eiche geräuchert, Griffleiste", dateiname_damals: doc.dateiname, endung: end, mime: doc.mime, sha256: v === versionen ? sha : hexAus(`${o.name}/${titel}/${v}`), geprueft: 1, wiederhergestellt_aus: 0, speicher: "lokal", schluessel: `${vz.getFullYear()}/${doc.name}/${v}-${sha.slice(0, 8)}.${end}` });
    }
    doc.versionen[doc.versionen.length - 1].groesse = groesse;
    const erst = isoDatumZeit(zeitVor((opt.tage ?? 10) + (versionen - 1) * 3));
    Object.assign(doc, basis, { owner, creation: erst, modified: isoDatumZeit(hoch) });
    if (opt.sperre === "fremd") Object.assign(doc, { gesperrt_von: "projekte@demo.local", gesperrt_bis: isoDatumZeit(tagEnde(1)), gesperrt_hinweis: "Planung wird überarbeitet" });
    if (opt.sperre === "eigen") Object.assign(doc, { gesperrt_von: "admin@demo.local", gesperrt_bis: isoDatumZeit(tagEnde(2)), gesperrt_hinweis: "Mengen prüfen" });
    dateien.set(doc.name, doc);
    ereignis("Upload", doc, { tage: (opt.tage ?? 10) + (versionen - 1) * 3, user: owner, version: 1 });
    for (let v = 2; v <= versionen; v++) ereignis("Neue Version", doc, { tage: (opt.tage ?? 10) + (versionen - v) * 3, user: owner, version: v });
    if (opt.portal) ereignis("Portal freigegeben", doc, { tage: Math.max(0, (opt.tage ?? 5) - 1), user: owner });
    if (opt.sperre) ereignis("Gesperrt", doc, { tage: 0, user: doc.gesperrt_von });
    return doc;
  };

  // ---- Bereichsordner
  // Bereichsordner wie dienste.bereichsordner: Bezugsart ohne Bezug, geschützt, Vorlage „bereich:<DocType>“.
  const bereich = (titel, dt, extra = {}) => neuerOrdner(titel, null, { geschuetzt: 1, quelle: "vorlage", bezug_doctype: dt, vorlage: `bereich:${dt}`, ...extra });
  const wProjekte = bereich("Projekte", "PH Projekt", { icon: "project" });
  const wKontakte = bereich("Kontakte", "PH Kontakt", { icon: "users" });
  const wLieferanten = bereich("Lieferanten", "PH Lieferant", { icon: "truck" });
  const wMitarbeiter = bereich("Mitarbeiter", "PH Mitarbeiter", { icon: "users", rechte_modus: "leitung" });
  const wAllgemein = neuerOrdner("Allgemein", null, { geschuetzt: 1, quelle: "system", farbe: "eiche" });

  // ---- Projekte
  const projekte = [...(db.get("PH Projekt")?.values() || [])].slice(0, 4);
  const projektOrdner = [];
  projekte.forEach((p, pi) => {
    const titel = p.titel || p.name;
    const stamm = neuerOrdner(`${p.name} · ${titel}`, wProjekte, { bezug_doctype: "PH Projekt", bezug_name: p.name, bezug_titel: titel, ist_bezugswurzel: 1, vorlage: "Projekt", geschuetzt: 1, rechte_modus: "team" });
    const vor = {};
    for (const [t, klasse] of PROJEKT_VORLAGE) vor[t] = neuerOrdner(t, stamm, { aufbewahrungsklasse: klasse === "Beleg" ? "Beleg" : "", vorlage: "Projekt", geschuetzt: 1 });
    if (pi === 0) neuerOrdner("Baustelle", vor["07 Fotos"], { quelle: "backoffice" });
    for (const [t, liste] of Object.entries(PROJEKT_DATEIEN[pi] || {})) for (const e of liste) neueDatei(vor[t], e, pi === 1 ? "crm-leitung@demo.local" : "projekte@demo.local");
    projektOrdner.push(vor);
  });

  // ---- Kontakte (CRM): Korrespondenz mit Mail-Anhängen
  const kontakte = [...(db.get("PH Kontakt")?.values() || [])].slice(0, 2);
  kontakte.forEach((k, ki) => {
    const titel = [k.vorname, k.nachname].filter(Boolean).join(" ") || k.kontaktname || k.name;
    const stamm = neuerOrdner(`${k.name} · ${titel}`, wKontakte, { bezug_doctype: "PH Kontakt", bezug_name: k.name, bezug_titel: titel, ist_bezugswurzel: 1, vorlage: "Kontakt", geschuetzt: 1 });
    const mail = neuerOrdner("00 Mail-Anhänge", stamm, { quelle: "system", geschuetzt: 1 });
    const korr = neuerOrdner("01 Korrespondenz", stamm, { vorlage: "Kontakt", geschuetzt: 1 });
    const vertr = neuerOrdner("02 Angebote & Verträge", stamm, { vorlage: "Kontakt", geschuetzt: 1, aufbewahrungsklasse: "Beleg" });
    const plaene = neuerOrdner("03 Pläne & Fotos", stamm, { vorlage: "Kontakt", geschuetzt: 1 });
    neueDatei(mail, ["Grundriss Wohnung (aus E-Mail)", "pdf", 1_020_000, { tags: "E-Mail", tage: 6 }], "crm@demo.local");
    if (ki === 0) {
      neueDatei(mail, ["Foto Bestand Wohnzimmer", "jpg", 2_200_000, { bild: "r-wohnen-sofa.jpg", tage: 6 }], "crm@demo.local");
      neueDatei(korr, ["Gesprächsnotiz Erstberatung", "docx", 38_000, { tage: 12 }], "crm@demo.local");
      neueDatei(vertr, ["Angebot Wohnzimmer", "pdf", 260_000, { tage: 9 }], "crm-leitung@demo.local");
      neueDatei(plaene, ["Wunschbild Esszimmer", "jpg", 1_600_000, { bild: "r-essen-licht.jpg", tage: 6 }], "crm@demo.local");
    }
  });

  // ---- Lieferant
  const lieferant = [...(db.get("PH Lieferant")?.values() || [])][0];
  if (lieferant) {
    const titel = lieferant.firmenname || lieferant.name;
    const stamm = neuerOrdner(`${lieferant.name} · ${titel}`, wLieferanten, { bezug_doctype: "PH Lieferant", bezug_name: lieferant.name, bezug_titel: titel, ist_bezugswurzel: 1, vorlage: "Lieferant", geschuetzt: 1 });
    const vertr = neuerOrdner("01 Verträge & Konditionen", stamm, { aufbewahrungsklasse: "Beleg", geschuetzt: 1 });
    const preise = neuerOrdner("02 Preislisten & Kataloge", stamm, { geschuetzt: 1 });
    neuerOrdner("03 Datenblätter & Zertifikate", stamm, { geschuetzt: 1 });
    neuerOrdner("04 Korrespondenz", stamm, { geschuetzt: 1 });
    neueDatei(vertr, ["Händlervertrag 2026", "pdf", 420_000, { tage: 300 }], "sortiment@demo.local");
    neueDatei(preise, ["Preisliste 2027", "xlsx", 880_000, { tags: "Preise 2027", tage: 7 }], "sortiment@demo.local");
    neueDatei(preise, ["Katalog Outdoor 2027", "pdf", 24_800_000, { tage: 7 }], "sortiment@demo.local");
  }

  // ---- Mitarbeiter (nur Personal-Leitung, GF, Admin)
  const ma = [...(db.get("PH Mitarbeiter")?.values() || [])][0];
  if (ma) {
    const titel = ma.titel || [ma.vorname, ma.nachname].filter(Boolean).join(" ") || ma.name;
    const stamm = neuerOrdner(`${ma.name} · ${titel}`, wMitarbeiter, { bezug_doctype: "PH Mitarbeiter", bezug_name: ma.name, bezug_titel: titel, ist_bezugswurzel: 1, vorlage: "Mitarbeiter", geschuetzt: 1, rechte_modus: "leitung" });
    const vertrag = neuerOrdner("01 Vertrag", stamm, { aufbewahrungsklasse: "Personal", geschuetzt: 1, rechte_modus: "leitung" });
    neuerOrdner("02 Lohn & Abrechnung", stamm, { aufbewahrungsklasse: "Personal", geschuetzt: 1, rechte_modus: "leitung" });
    neueDatei(vertrag, ["Dienstvertrag", "pdf", 210_000, { tage: 400 }], "personal@demo.local");
  }

  // ---- Allgemein
  for (const [t, liste] of Object.entries(ALLGEMEIN)) {
    const o = neuerOrdner(t, wAllgemein, { quelle: "backoffice", aufbewahrungsklasse: t === "Marketing" ? "Marketing" : "", farbe: t === "Showroom" ? "salbei" : t === "Marketing" ? "cognac" : "" });
    for (const e of liste) neueDatei(o, e, t === "Marketing" ? "marketing@demo.local" : "admin@demo.local");
  }
  neuerOrdner("Archiv 2025", wAllgemein, { quelle: "backoffice" });

  // ---- Papierkorb
  const korb = (o, e, tageGeloescht, owner) => {
    const d = neueDatei(o, e, owner);
    const am = zeitVor(tageGeloescht, 15);
    const bis = new Date(am.getTime());
    bis.setDate(bis.getDate() + 30);
    Object.assign(d, { status: "Papierkorb", geloescht: 1, geloescht_am: isoDatumZeit(am), geloescht_von: owner, papierkorb_bis: isoDatum(bis), portal_freigabe: 0 });
    ereignis("Geloescht", d, { tage: tageGeloescht, user: owner });
  };
  if (projektOrdner[0]) {
    korb(projektOrdner[0]["02 Planung & Handzeichnung"], ["Ansicht Kochinsel alt", "pdf", 1_020_000, { tage: 20 }], 2, "projekte@demo.local");
    korb(projektOrdner[0]["07 Fotos"], ["Foto unscharf", "jpg", 2_100_000, { bild: "r-hero-essraum.jpg", tage: 30 }], 26, "projekte@demo.local");
  }
  korb([...ordner.values()].find((o) => o.titel === "Vorlagen & Formulare"), ["Kalkulation alt", "xlsx", 51_000, { tage: 200 }], 9, "admin@demo.local");

  // ---- Freigabelinks (alle Zustände; feste Tokens nur im Mock)
  const finde = (name) => [...dateien.values()].find((d) => d.dateiname === name);
  const link = (datei, token, { tage, status = "Aktiv", passwort, max = 0, zaehler = 0, hinweis = "", owner = "projekte@demo.local", alterTage = 2 }) => {
    if (!datei) return;
    const erstellt = zeitVor(alterTage, 11);
    const ablauf = tagEnde(tage);
    const name = `fl-seed-${token.slice(-4).toLowerCase()}`;
    links.set(name, {
      name, doctype: "PH Datei Freigabelink", titel: datei.dateiname, datei: datei.name, version: 0, status, ablauf: isoDatumZeit(ablauf), nur_lesen: 1,
      passwort_gesetzt: passwort ? 1 : 0, passwort_hash: passwort ? mockPasswortHash(passwort) : "", max_downloads: max, download_zaehler: zaehler,
      letzter_download: zaehler ? isoDatumZeit(zeitVor(1, 16)) : "", empfaenger_hinweis: hinweis, erstellt_von: owner, widerrufen_am: status === "Widerrufen" ? isoDatumZeit(zeitVor(1)) : "",
      widerrufen_von: status === "Widerrufen" ? owner : "", token_hash: sha256Hex(token), owner, creation: isoDatumZeit(erstellt), modified: isoDatumZeit(erstellt), ...basis,
    });
    ereignis("Freigabe erstellt", datei, { tage: alterTage, user: owner, link: name });
    if (zaehler) ereignis("Freigabe genutzt", datei, { tage: 1, user: "Guest", link: name });
  };
  link(finde("Rendering Kochinsel Abend.jpg"), DEMO_TOKENS.aktiv, { tage: 7, zaehler: 2, hinweis: "Familie Muster, Abendansicht" });
  link(finde("Angebot AN-2026-0012 unterschrieben.pdf"), DEMO_TOKENS.passwort, { tage: 14, passwort: DEMO_PASSWORT, max: 5, zaehler: 1, hinweis: "Steuerberatung der Kundin", owner: "projekte@demo.local" });
  link(finde("Grundriss Küche M 1-50.dwg"), DEMO_TOKENS.abgelaufen, { tage: -3, status: "Abgelaufen", hinweis: "Tischlerei, Plattenzuschnitt", alterTage: 12 });
  link(finde("Montageanleitung Kochfeld.pdf"), DEMO_TOKENS.widerrufen, { tage: 4, status: "Widerrufen", hinweis: "Elektriker", alterTage: 6 });
  link(finde("Entwurf Wohnen und Essen.pdf"), DEMO_TOKENS.aufgebraucht, { tage: 6, status: "Aufgebraucht", max: 3, zaehler: 3, hinweis: "Architekturbüro", owner: "crm-leitung@demo.local", alterTage: 5 });
  link(finde("Terrasse Abendlicht.jpg"), DEMO_TOKENS.bald, { tage: 2, hinweis: "Gartenplanung", owner: "crm-leitung@demo.local", alterTage: 5 });
  for (const d of dateien.values()) d.freigabelinks_aktiv = [...links.values()].filter((l) => l.datei === d.name && l.status === "Aktiv").length;

  // ---- Einstellungen (Single)
  const einst = hilfe.tabelle(EINST);
  einst.set(EINST, {
    name: EINST, doctype: EINST, speicher_adapter: "lokal", speicher_praefix: "", konfig_status: "lokal: bereit", presign_sekunden: 300, upload_token_stunden: 24,
    chunk_mb: 8, max_groesse_mb: 2048, s3_pruefsumme_nachrechnen: 1, erlaubte_endungen: "", gesperrte_endungen: "", duplikat_verhalten: "melden",
    automatische_ordner: 1, ordnervorlagen: [], papierkorb_tage: 30, sperre_stunden: 8, vorschau_aktiv: 1, vorschau_px: 512, office_vorschau: 0,
    soffice_pfad: "soffice", video_poster: 0, volltext_aktiv: 1, volltext_max_mb: 50, freigabe_basis_url: `${process.env.BACKOFFICE_BASIS_URL || "http://localhost:3100"}/f`,
    freigabe_standard_tage: 7, freigabe_max_tage: 90, freigabe_passwort_pflicht: 0, owner: "Administrator", creation: isoDatumZeit(zeitVor(200)), modified: isoDatumZeit(zeitVor(3)),
    ...basis, _abl_seed: SEED_VERSION,
  });
}
