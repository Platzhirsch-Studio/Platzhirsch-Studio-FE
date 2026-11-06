// Mock-Seed – Bereich Sortiment (G-01, MASTER § 3.5). Schreibt: Team B-SOR.
// anzahl: Datensätze je DocType · kern: Fachwissen je DocType (Verteilung, Bezüge, Titel) nach der
// generischen Erzeugung · default: Nachlauf (db, hilfe) nach dem Grundaufbau, Reihenfolge über `nach`.
// Keine echten Personen, E-Mails @beispiel.invalid, runde Beispielbeträge (Q-A3). Zufall nur über `r`
// (fester Startwert); Reihenfolge der r-Aufrufe nicht ändern, sonst verschieben sich alle Folgedaten.
//
// B-SOR: `anzahl`/`kern` bleiben wie vor dem Bereichsbau (Zufallsfolge aller Bereiche). Die fachlichen Daten
// (10-konzept-sortiment § 20.5 Schritt 1: Marken mit/ohne Händlerstatus und Bildfreigabe, Lieferanten inkl. ohne
// E-Mail und Schweiz, ~60 Produkte in allen Zuständen inkl. Ausstellungsstück und Grundpreis-Kategorie,
// Bestellungen über alle Status inkl. Strecke, Teillieferung, Abweichungen, ohne Lieferant, IWOfurn/EDI-Export,
// Wareneingänge inkl. Reklamation und Mehrmenge, Preislisten) setzt der Nachlauf – vollständig deterministisch,
// ohne Zufall. Bestehende Produkt-/Marken-/Kategorie-Namen bleiben erhalten (andere Bereiche verlinken sie).

import { MARKEN, KATEGORIEN, PRODUKTE } from "./basis.js";

/** Nachläufe anderer Bereiche, die vor diesem laufen müssen. */
export const nach = [];

/** Anzahl generischer Datensätze je DocType (nicht gelistete mit Status bekommen 6). */
export const anzahl = {
  "PH Produkt": 20,
  "PH Marke": 8,
  "PH Kategorie": 8,
  "PH Lieferant": 6,
};

/** Fachliche Nachbearbeitung je DocType: (doc, { i, r, ctx, person }) – ändert doc. */
export const kern = {
  "PH Produkt": (doc, { i, r }) => {
    const p = PRODUKTE[i % PRODUKTE.length];
    doc.name_herstellerbezeichnung = `${p} ${i >= PRODUKTE.length ? "II" : ""}`.trim();
    doc.titel = doc.name_herstellerbezeichnung;
    doc.slug = `${doc.titel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    doc.marke = MARKEN[i % MARKEN.length];
    doc.kategorie = KATEGORIEN[i % KATEGORIEN.length];
    doc.status = r.pick(["Aktiv", "Aktiv", "Aktiv", "Geprueft", "Entwurf", "Pausiert"]);
    doc.aktueller_preis_cent = r.pick([129000, 249000, 389000, 580000, 1290000, 0]);
  },
  "PH Marke": (doc, { i }) => {
    doc.marke = MARKEN[i] || `Marke ${i + 1}`;
    doc.name = doc.marke;
    doc.slug = doc.marke.toLowerCase();
    doc.status = "Aktiv";
    doc.haendlerstatus = doc.marke === "ClassiCon" ? "Haendler" : doc.marke === "Ezarri" ? "Vertragshaendler" : "Keiner";
  },
  "PH Kategorie": (doc, { i }) => {
    const k = KATEGORIEN[i] || `Kategorie ${i + 1}`;
    doc.name = k;
    for (const f of ["kategorie", "titel", "bezeichnung"]) if (f in doc) doc[f] = k;
    if ("slug" in doc) doc.slug = k.toLowerCase();
  },
};

// ------------------------------------------------------------- Stammdaten --

/** Kennzeichen, dass der fachliche Seed angewendet ist (auch für den Nachzug in einer laufenden Mock-DB). */
export const SEED_VERSION = 5;
export const SEED_MARKE = "__sortimentSeed";

const B = (n) => `/entwurf/lounge/${n}`;
const EINSTELLUNGEN = "PH Sortiment Einstellungen";

/** GLN mit gültiger Prüfziffer aus 12 Ziffern. */
export function glnAus(zwoelf) {
  const z = String(zwoelf).split("").map(Number);
  const summe = [...z].reverse().reduce((a, x, i) => a + x * (i % 2 === 0 ? 3 : 1), 0);
  return `${zwoelf}${(10 - (summe % 10)) % 10}`;
}

const LIEFERANTEN = [
  { firmenname: "Ezarri Vertrieb Österreich", marke: "Ezarri", land: "AT", ort: "6020 Innsbruck", bestellweg: "EDI", email: "bestellung@ezarri-vertrieb.beispiel.invalid", gln: glnAus("900123400001"), lz: 4, ab: 3, ziel: 30, skonto: 20 },
  { firmenname: "Bora Vertrieb Alpen", marke: "Bora", land: "DE", ort: "88131 Lindau", bestellweg: "IWOfurn", email: "auftrag@bora-vertrieb.beispiel.invalid", gln: glnAus("900123400002"), lz: 6, ab: 5, ziel: 30, skonto: 30 },
  { firmenname: "Gaggenau Hausgeräte Vertrieb", marke: "Gaggenau", land: "DE", ort: "81669 München", bestellweg: "E-Mail", email: "bestellung@gaggenau-vertrieb.beispiel.invalid", gln: "", lz: 5, ab: 5, ziel: 30, skonto: 20 },
  { firmenname: "Vitra Vertrieb Schweiz", marke: "Vitra", land: "CH", ort: "9000 St. Gallen", bestellweg: "E-Mail", email: "orders@vitra-vertrieb.beispiel.invalid", gln: glnAus("761234500003"), lz: 8, ab: 7, ziel: 30, skonto: 0 },
  { firmenname: "Interni Möbelagentur", marke: "Minotti", land: "IT", ort: "20121 Mailand", bestellweg: "Portal", email: "", gln: glnAus("800123400004"), lz: 12, ab: 7, ziel: 60, skonto: 0 },
  { firmenname: "Baobab Vertrieb", marke: "Baobab", land: "BE", ort: "1000 Brüssel", bestellweg: "E-Mail", email: "orders@baobab-vertrieb.beispiel.invalid", gln: "", lz: 2, ab: 3, ziel: 14, skonto: 20 },
];

const MARKEN_DATEN = {
  Minotti: { welt: "Wohnen", land: "IT", haendler: "Anfrage laeuft", bild: "offen", lieferant: "Interni Möbelagentur", weg: "Portal", bildMarke: B("r-wohnen-sofa.jpg") },
  ClassiCon: { welt: "Wohnen", land: "DE", haendler: "Haendler", bild: "schriftlich erteilt", lieferant: "", weg: "E-Mail", bildMarke: B("r-hero-essraum.jpg"), vertragBis: 40 },
  Poliform: { welt: "Kueche", land: "IT", haendler: "Keiner", bild: "offen", lieferant: "Interni Möbelagentur", weg: "Portal", bildMarke: B("r-kueche-eiche.jpg") },
  Flexform: { welt: "Wohnen", land: "IT", haendler: "Keiner", bild: "offen", lieferant: "Interni Möbelagentur", weg: "Portal", bildMarke: B("r-essen-licht.jpg") },
  Ezarri: { welt: "Bad-Wellness", land: "ES", haendler: "Vertragshaendler", bild: "schriftlich erteilt", lieferant: "Ezarri Vertrieb Österreich", weg: "EDI", bildMarke: B("r-bad.webp"), vertragBis: 400 },
  Vitra: { welt: "Wohnen", land: "CH", haendler: "Haendler", bild: "schriftlich erteilt", lieferant: "Vitra Vertrieb Schweiz", weg: "E-Mail", bildMarke: B("r-schlafen.webp"), vertragBis: 300 },
  Cassina: { welt: "Wohnen", land: "IT", haendler: "Keiner", bild: "offen", lieferant: "", weg: "", bildMarke: B("r-terrasse-hotel.jpg"), status: "Pausiert" },
  "Walter Knoll": { welt: "Wohnen", land: "DE", haendler: "Anfrage laeuft", bild: "offen", lieferant: "", weg: "", bildMarke: B("r-terrasse-see.jpg") },
  Gaggenau: { welt: "Kueche", land: "DE", haendler: "Haendler", bild: "schriftlich erteilt", lieferant: "Gaggenau Hausgeräte Vertrieb", weg: "E-Mail", bildMarke: B("r-kueche-eiche.jpg"), vertragBis: 25, neu: true },
  Bora: { welt: "Kueche", land: "DE", haendler: "Vertragshaendler", bild: "schriftlich erteilt", lieferant: "Bora Vertrieb Alpen", weg: "IWOfurn", bildMarke: B("r-kueche-eiche.jpg"), vertragBis: 500, neu: true },
  Baobab: { welt: "Accessoires", land: "BE", haendler: "Haendler", bild: "schriftlich erteilt", lieferant: "Baobab Vertrieb", weg: "E-Mail", bildMarke: B("p-trudon-kerze.webp"), vertragBis: 200, neu: true },
  "Lumen Atelier": { welt: "Licht", land: "AT", haendler: "Keiner", bild: "offen", lieferant: "", weg: "", bildMarke: B("p-stone-leuchte.webp"), status: "Inaktiv", neu: true },
};

const KATEGORIEN_DATEN = {
  Sofas: { welt: "Wohnen", ust: "normal" },
  Sessel: { welt: "Wohnen", ust: "normal" },
  Tische: { welt: "Wohnen", ust: "normal" },
  Leuchten: { welt: "Licht", ust: "normal" },
  Betten: { welt: "Wohnen", ust: "normal" },
  Regale: { welt: "Wohnen", ust: "normal" },
  Outdoor: { welt: "Outdoor", ust: "normal" },
  Mosaik: { welt: "Bad-Wellness", ust: "normal" },
  Kochfelder: { welt: "Kueche", ust: "normal", neu: true },
  Backöfen: { welt: "Kueche", ust: "normal", neu: true, key: "backoefen" },
  Duftkerzen: { welt: "Accessoires", ust: "normal", grundpreis: true, neu: true },
  Accessoires: { welt: "Accessoires", ust: "normal", neu: true },
  Bücher: { welt: "Accessoires", ust: "ermaessigt", neu: true, key: "buecher" },
};

/**
 * Katalog: [Bezeichnung, Marke, Kategorie, Bild, Status, Preis-Cent, Besonderheit].
 * Besonderheit: "veraltet" · "laeuftAb" · "keinPreis" · "anfrage" · "ohneBild" · "bildOffen" · "shop" · "ausstellung"
 * · "abverkauf" · "ohneText" · "grundpreis" · "ausgeblendet" · "lager" · "uvp".
 */
const KATALOG = [
  ["Sofa Modul 240", "Minotti", "Sofas", "r-wohnen-sofa.jpg", "Aktiv", 1290000, "bildOffen"],
  ["Lounge Sessel", "ClassiCon", "Sessel", "r-hero-essraum.jpg", "Aktiv", 489000, "shop"],
  ["Esstisch Eiche 220", "Poliform", "Tische", "r-essen-licht.jpg", "Geprueft", 580000, ""],
  ["Pendelleuchte Glas", "Flexform", "Leuchten", "p-bell-leuchte.webp", "Aktiv", 129000, "veraltet"],
  ["Bett Polster 180", "Vitra", "Betten", "r-schlafen.webp", "Aktiv", 389000, "uvp"],
  ["Regal System 3", "Vitra", "Regale", "r-hero-essraum.jpg", "Entwurf", 0, "ohneText"],
  ["Loungechair Outdoor", "Ezarri", "Outdoor", "r-garten-lounge.jpg", "Pausiert", 249000, ""],
  ["Mosaik Mix 2,5", "Ezarri", "Mosaik", "r-bad.webp", "Aktiv", 0, "anfrage"],
  ["Kochfeld mit Dunstabzug Pure", "Bora", "Kochfelder", "r-kueche-eiche.jpg", "Aktiv", 289000, "shop"],
  ["Backofen Serie 400", "Gaggenau", "Backöfen", "r-kueche-eiche.jpg", "Entwurf", 0, "ohneBild"],
  ["Duftkerze Feige 270 g", "Baobab", "Duftkerzen", "p-trudon-kerze.webp", "Aktiv", 7900, "grundpreis"],
  ["Tischleuchte Glocke", "Flexform", "Leuchten", "p-bell-leuchte.webp", "Geprueft", 59000, "bildOffen"],
  ["Akku-Leuchte Mini", "Vitra", "Leuchten", "p-flos-bellhop.webp", "Aktiv", 24900, "lager"],
  ["Keramikfigur Löwe", "Baobab", "Accessoires", "p-kaehler-loewe.webp", "Aktiv", 14900, "laeuftAb"],
  ["Wandhalter Eiche", "Vitra", "Accessoires", "p-lyngby-halter.webp", "Aktiv", 8900, "lager"],
  ["Steinleuchte Travertin", "Lumen Atelier", "Leuchten", "p-stone-leuchte.webp", "Geprueft", 98000, ""],
  ["Weinglas Bordeaux", "Baobab", "Accessoires", "p-zalto-bordeaux.webp", "Aktiv", 6900, "lager"],
  ["Sofa Insel 320", "Minotti", "Sofas", "r-wohnen-sofa.jpg", "Entwurf", 0, ""],
  ["Esstisch Nuss 260", "Poliform", "Tische", "r-essen-licht.jpg", "Aktiv", 720000, "veraltet"],
  ["Sessel Leder Cognac", "Walter Knoll", "Sessel", "r-hero-essraum.jpg", "Geprueft", 610000, "bildOffen"],
  ["Gartenbank Teak", "Ezarri", "Outdoor", "r-terrasse-see.jpg", "Aktiv", 189000, ""],
  ["Daybed Terrasse", "Ezarri", "Outdoor", "r-terrasse-hotel.jpg", "Aktiv", 349000, "ausgeblendet"],
  ["Mosaik Perle Weiß", "Ezarri", "Mosaik", "r-bad.webp", "Aktiv", 0, "anfrage"],
  ["Kochfeldabzug Professional", "Bora", "Kochfelder", "r-kueche-eiche.jpg", "Geprueft", 459000, ""],
  ["Induktionskochfeld 80", "Gaggenau", "Kochfelder", "r-kueche-eiche.jpg", "Aktiv", 318000, "laeuftAb"],
  ["Dampfbackofen Serie 200", "Gaggenau", "Backöfen", "r-kueche-eiche.jpg", "Pausiert", 412000, ""],
  ["Duftkerze Zeder 190 g", "Baobab", "Duftkerzen", "p-trudon-kerze.webp", "Geprueft", 6900, "grundpreisFehlt"],
  ["Polsterbett Leinen 200", "Vitra", "Betten", "r-schlafen.webp", "Aktiv", 455000, "shop"],
  ["Beistelltisch Marmor", "Cassina", "Tische", "r-essen-licht.jpg", "Geprueft", 210000, "markeNichtAktiv"],
  ["Regal Wand 2", "Vitra", "Regale", "p-lyngby-halter.webp", "Aktiv", 156000, ""],
  ["Sofa Ausstellung 260", "Minotti", "Sofas", "r-wohnen-sofa.jpg", "Aktiv", 890000, "ausstellung"],
  ["Sessel Abverkauf", "ClassiCon", "Sessel", "r-hero-essraum.jpg", "Aktiv", 299000, "abverkauf"],
  ["Hängeleuchte Messing", "Flexform", "Leuchten", "p-bell-leuchte.webp", "Ausgelaufen", 145000, ""],
  ["Bildband Wohnen", "Baobab", "Bücher", "", "Entwurf", 4900, "ohneBild"],
  ["Outdoor Tisch 200", "Ezarri", "Outdoor", "r-garten-lounge.jpg", "Entwurf", 0, ""],
  ["Wandleuchte Stein", "Lumen Atelier", "Leuchten", "p-stone-leuchte.webp", "Entwurf", 0, "ohneText"],
  ["Akku-Leuchte Groß", "Vitra", "Leuchten", "p-flos-bellhop.webp", "Aktiv", 34900, "shop"],
  ["Karaffe Glas", "Baobab", "Accessoires", "p-zalto-bordeaux.webp", "Aktiv", 11900, "lager"],
  ["Kerzenset Herbst", "Baobab", "Duftkerzen", "p-trudon-kerze.webp", "Aktiv", 9900, "grundpreis"],
  ["Esstisch Glas 180", "Poliform", "Tische", "r-essen-licht.jpg", "Pausiert", 395000, ""],
  ["Lounge Modul Ecke", "Flexform", "Sofas", "r-wohnen-sofa.jpg", "Aktiv", 980000, "veraltet"],
  ["Sessel Stoff Sand", "Walter Knoll", "Sessel", "r-hero-essraum.jpg", "Entwurf", 0, "ohneBild"],
  ["Mosaik Nero", "Ezarri", "Mosaik", "r-bad.webp", "Geprueft", 0, "anfrage"],
  ["Kochfeld Duo 60", "Bora", "Kochfelder", "r-kueche-eiche.jpg", "Aktiv", 245000, ""],
  ["Wärmeschublade 60", "Gaggenau", "Backöfen", "r-kueche-eiche.jpg", "Aktiv", 189000, ""],
  ["Gartenstuhl Seil", "Ezarri", "Outdoor", "r-terrasse-see.jpg", "Aktiv", 69000, "shop"],
  ["Keramikfigur Hirsch", "Baobab", "Accessoires", "p-kaehler-loewe.webp", "Entwurf", 15900, ""],
  ["Tischleuchte Akku Schwarz", "Vitra", "Leuchten", "p-flos-bellhop.webp", "Geprueft", 26900, ""],
  ["Bett Massivholz 160", "Vitra", "Betten", "r-schlafen.webp", "Entwurf", 0, ""],
  ["Regal Eiche 4", "Poliform", "Regale", "r-hero-essraum.jpg", "Aktiv", 268000, "bildOffen"],
  ["Sofa Bouclé 220", "Minotti", "Sofas", "r-wohnen-sofa.jpg", "Geprueft", 1180000, ""],
  ["Weinglas Universal", "Baobab", "Accessoires", "p-zalto-bordeaux.webp", "Aktiv", 5900, "lager"],
  ["Pendelleuchte Opal", "Flexform", "Leuchten", "p-bell-leuchte.webp", "Aktiv", 98000, ""],
  ["Daybed Leder", "Cassina", "Sofas", "r-terrasse-hotel.jpg", "Pausiert", 690000, ""],
  ["Lounge Sessel Outdoor", "Ezarri", "Outdoor", "r-garten-lounge.jpg", "Geprueft", 279000, ""],
  ["Mosaik Gold 2,5", "Ezarri", "Mosaik", "r-bad.webp", "Aktiv", 0, "anfrage"],
  ["Couchtisch Travertin", "Walter Knoll", "Tische", "r-essen-licht.jpg", "Entwurf", 0, ""],
  ["Duftkerze Tabak 500 g", "Baobab", "Duftkerzen", "p-trudon-kerze.webp", "Ausgelaufen", 14900, "grundpreis"],
  ["Kochfeld Wok 40", "Bora", "Kochfelder", "r-kueche-eiche.jpg", "Entwurf", 0, ""],
  ["Steinleuchte Klein", "Lumen Atelier", "Leuchten", "p-stone-leuchte.webp", "Ausgelaufen", 49000, ""],
];

const HEUTE = "2026-11-04";

function iso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tag(offset) {
  const d = new Date(2026, 10, 4);
  d.setDate(d.getDate() + offset);
  return iso(d);
}

function zeit(offset, std = 9, min = 0) {
  return `${tag(offset)} ${String(std).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
}

function slug(text) {
  return String(text)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function meta(doc, { tage = -5, von = "sortiment@demo.local" } = {}) {
  return { owner: von, creation: zeit(tage - 20, 10), modified: zeit(tage, 11, 15), modified_by: von, docstatus: 0, idx: 0, ...doc };
}

function kinder(zeilen, doctype, parentfield, parenttype, parent) {
  return zeilen.map((z, i) => ({ doctype, parentfield, parenttype, parent, idx: i + 1, name: `${parentfield}-${parent}-${i + 1}`, ...z }));
}

// --------------------------------------------------------------- Nachlauf --

/**
 * Nachlauf nach dem Grundaufbau (Bezüge zwischen DocTypes, Leer-/Fehlerfälle). Vollständig deterministisch.
 * @param {Map<string, Map<string, object>>} db
 * @param {import("./index.js").SeedHilfe} hilfe
 */
export default function nachlauf(db, hilfe) {
  const tabelle = (dt) => {
    if (!db.has(dt)) db.set(dt, new Map());
    return db.get(dt);
  };
  const naechste = hilfe?.naechste || (() => 1);

  // Einstellungen (Single)
  const einst = tabelle(EINSTELLUNGEN);
  const e = einst.get(EINSTELLUNGEN) || { doctype: EINSTELLUNGEN, name: EINSTELLUNGEN };
  Object.assign(e, {
    website_revalidate_aktiv: 1,
    revalidate_drossel_sekunden: 60,
    website_basis_url: "https://www.beispiel.invalid",
    claim_guard_aktiv: 1,
    preis_max_monate_verkaufspreis: 12,
    preis_max_monate_uvp: 6,
    preisliste_schwelle_prozent: 15,
    ab_toleranz_preis_prozent: 0,
    ab_toleranz_termin_tage: 0,
    eigene_gln: glnAus("900999900001"),
    standard_lieferadresse: "Platzhirsch Home Living\nSeestraße 1\n6911 Lochau",
    [SEED_MARKE]: SEED_VERSION,
  });
  einst.set(EINSTELLUNGEN, e);

  // Lieferanten (fachlich neu; generische Testdatensätze ersetzt)
  const lieferanten = tabelle("PH Lieferant");
  lieferanten.clear();
  LIEFERANTEN.forEach((l, i) => {
    lieferanten.set(
      l.firmenname,
      meta(
        {
          doctype: "PH Lieferant",
          name: l.firmenname,
          firmenname: l.firmenname,
          marke: l.marke,
          status: "Aktiv",
          uid: l.land === "AT" ? `ATU1234567${i}` : "",
          strasse: "Musterstraße 1",
          plz: l.ort.split(" ")[0],
          ort: l.ort.split(" ").slice(1).join(" "),
          land: l.land,
          bestellweg: l.bestellweg,
          bestell_email: l.email,
          portal_url: l.bestellweg === "Portal" ? "https://portal.beispiel.invalid" : "",
          kundennummer_bei_lieferant: `K-${4711 + i}`,
          gln: l.gln,
          iwofurn_kennung: l.bestellweg === "IWOfurn" ? `IWO-${100 + i}` : "",
          lieferzeit_wochen_standard: l.lz,
          ab_erwartet_tage: l.ab,
          lieferzeiten: [],
          betriebsurlaub: i === 4 ? kinder([{ von: "2026-12-23", bis: "2027-01-07", hinweis: "Werk geschlossen" }], "PH Lieferant Betriebsurlaub", "betriebsurlaub", "PH Lieferant", l.firmenname) : [],
          waehrung: "EUR",
          zahlungsziel_tage: l.ziel,
          skonto_promille: l.skonto,
          skonto_tage: l.skonto ? 10 : 0,
          incoterm: l.land === "AT" ? "DAP" : "DDP",
          mindestbestellwert_cent: i === 5 ? 50000 : 0,
          konditionen: "Konditionen laut Rahmenvereinbarung (Beispiel).",
          ansprechpartner: kinder([{ name: `Ansprechpartner ${i + 1}`, rolle: "Innendienst", email: `innendienst${i + 1}@beispiel.invalid` }], "PH Sortiment Ansprechpartner", "ansprechpartner", "PH Lieferant", l.firmenname),
          preisliste_format: "Auto",
          notizen: "",
        },
        { tage: -40 + i }
      )
    );
  });

  // Marken (bestehende anreichern, fehlende ergänzen)
  const marken = tabelle("PH Marke");
  Object.entries(MARKEN_DATEN).forEach(([marke, d], i) => {
    const alt = marken.get(marke) || { doctype: "PH Marke", name: marke };
    const doc = meta(
      {
        ...alt,
        doctype: "PH Marke",
        name: marke,
        marke,
        slug: slug(marke),
        status: d.status || "Aktiv",
        welt: d.welt,
        sortierung: i + 1,
        logo: "",
        website: `https://${slug(marke)}.beispiel.invalid`,
        land: d.land,
        gruendungsjahr: 0,
        stand: tag(-30 - i),
        kurz_de: `${marke} – Beispieltext für die Markenseite.`,
        story_de: "",
        produkte_text_de: "",
        bild_anhagen: d.bildMarke,
        bildfreigabe_status: d.bild,
        bildfreigabe_beleg: d.bild === "schriftlich erteilt" ? `/private/files/bildfreigabe-${slug(marke)}.pdf` : "",
        bildfreigabe_datum: d.bild === "schriftlich erteilt" ? tag(-120 + i) : "",
        bilder: kinder([{ bild: d.bildMarke, typ: "hero", freigabe: d.bild === "schriftlich erteilt" ? "erteilt" : "offen", quelle_url: `https://${slug(marke)}.beispiel.invalid/presse` }], "PH Marke Bild", "bilder", "PH Marke", marke),
        haendlerstatus: d.haendler,
        haendler_wortlaut: d.haendler === "Vertragshaendler" ? "contract" : d.haendler === "Haendler" ? "dealer" : "",
        haendler_beleg_url: ["Haendler", "Vertragshaendler"].includes(d.haendler) ? `https://${slug(marke)}.beispiel.invalid/haendler` : "",
        haendler_geprueft_am: ["Haendler", "Vertragshaendler"].includes(d.haendler) ? tag(-60) : "",
        vertrag_gueltig_von: d.vertragBis ? tag(-365) : "",
        vertrag_gueltig_bis: d.vertragBis ? tag(d.vertragBis) : "",
        lieferant: d.lieferant,
        bestellweg: d.weg,
        bestell_email: LIEFERANTEN.find((l) => l.firmenname === d.lieferant)?.email || "",
        kundennummer_bei_lieferant: d.lieferant ? `K-${4711 + LIEFERANTEN.findIndex((l) => l.firmenname === d.lieferant)}` : "",
        lieferzeit_wochen_standard: LIEFERANTEN.find((l) => l.firmenname === d.lieferant)?.lz || 8,
        preisart: d.welt === "Bad-Wellness" ? "Auf Anfrage" : "Verkaufspreis",
        kalkulationsfaktor_promille: 2000,
        vk_rundung: "auf 10 Euro",
        ansprechpartner: [],
        website_sichtbar: d.status === "Inaktiv" ? 0 : 1,
        es_gibt_produkte: 1,
        produkte_anzahl: 0,
        notizen: "",
      },
      { tage: -10 - i }
    );
    marken.set(marke, doc);
  });

  // Kategorien
  const kategorien = tabelle("PH Kategorie");
  Object.entries(KATEGORIEN_DATEN).forEach(([k, d], i) => {
    const alt = kategorien.get(k) || { doctype: "PH Kategorie", name: k };
    kategorien.set(
      k,
      meta(
        {
          ...alt,
          doctype: "PH Kategorie",
          name: k,
          key: d.key || slug(k),
          label_de: k,
          label_en: "",
          status: "Aktiv",
          uebergeordnet: "",
          welt: d.welt,
          sortierung: i + 1,
          website_sichtbar: 1,
          ust_klasse: d.ust,
          grundpreis_pflicht: d.grundpreis ? 1 : 0,
          produkte_anzahl: 0,
        },
        { tage: -50 }
      )
    );
  });

  // Merkmale
  const merkmale = tabelle("PH Merkmal");
  merkmale.clear();
  [
    ["Eiche geräuchert", "Holz", "EIG", "", "Poliform"],
    ["Nussbaum", "Holz", "NUS", "", "Poliform"],
    ["Leder Cognac", "Leder", "LCO", "#8f5230", "Minotti"],
    ["Bouclé Sand", "Stoff", "BSA", "#cdbfa8", "Minotti"],
    ["Edelstahl", "Material", "INOX", "", "Bora"],
    ["Schwarz matt", "Farbe", "SW", "#1d1d1b", "Bora"],
    ["Travertin", "Material", "TRA", "#cdbfa8", "Lumen Atelier"],
    ["Feige", "Duftfamilie", "FIG", "", "Baobab"],
    ["Messing gebürstet", "Oberflaeche", "MSG", "#b8975a", "Flexform"],
  ].forEach(([m, g, code, hex, marke], i) => {
    merkmale.set(m, meta({ doctype: "PH Merkmal", name: m, merkmal: m, gruppe: g, key: slug(m), status: i === 8 ? "Inaktiv" : "Aktiv", website_sichtbar: 1, code, farbe_hex: hex, marke, label_de: m }, { tage: -60 + i }));
  });

  // Produkte: bestehende Namen in Reihenfolge, dann neue
  const produkte = tabelle("PH Produkt");
  const vorhandene = [...produkte.keys()];
  const produktNamen = [];
  KATALOG.forEach((eintrag, i) => {
    const [bez, marke, kat, bild, status, cent, extra] = eintrag;
    const name = vorhandene[i] || slug(`${marke} ${bez}`);
    produktNamen.push(name);
    const alt = produkte.get(name) || {};
    produkte.set(name, produktDoc(alt, { name, i, bez, marke, kat, bild, status, cent, extra }));
  });

  // Zähler an Marken und Kategorien
  for (const m of marken.values()) m.produkte_anzahl = [...produkte.values()].filter((p) => p.marke === m.name && p.status !== "Ausgelaufen").length;
  for (const k of kategorien.values()) k.produkte_anzahl = [...produkte.values()].filter((p) => p.kategorie === k.name).length;

  // Ausführungen (eigener DocType) für zwei Produkte
  const ausf = tabelle("PH Produkt Ausfuehrung");
  for (const [key, d] of [...ausf.entries()]) if (d.__sortiment) ausf.delete(key);
  const ausfuehrung = (produkt, gruppe, optionen) =>
    optionen.forEach(([option, code, nameDe, hex, std, pg], j) => {
      const n = `${produkt}::${gruppe}::${option}`;
      ausf.set(n, meta({ doctype: "PH Produkt Ausfuehrung", name: n, __sortiment: 1, produkt, gruppe_key: gruppe, option_id: option, titel: nameDe, status: "Aktiv", code, farbe_hex: hex, standard: std ? 1 : 0, reihenfolge: j + 1, name_de: nameDe, preisgruppe: pg, aufpreis_cent: 0, preis_cent: 0 }, { tage: -20 }));
    });
  const kochfeld = produktNamen[8];
  const sofa = produktNamen[0];
  ausfuehrung(kochfeld, "farbe", [["inox", "INOX", "Edelstahl", "", true, "PG1"], ["sw", "SW", "Schwarz matt", "#1d1d1b", false, "PG2"]]);
  ausfuehrung(sofa, "bezug", [["bsa", "BSA", "Bouclé Sand", "#cdbfa8", true, "A"], ["lco", "LCO", "Leder Cognac", "#8f5230", false, "C"], ["lgr", "LGR", "Leinen Grau", "#8a8a85", false, "B"]]);
  ausfuehrung(sofa, "fuss", [["eig", "EIG", "Eiche geräuchert", "", true, ""], ["msg", "MSG", "Messing gebürstet", "#b8975a", false, ""]]);
  produkte.get(kochfeld).ausfuehrungen = kinder([{ gruppe_key: "farbe", gruppe_de: "Farbe", pflicht: 1, reihenfolge: 1 }], "PH Produkt Ausfuehrung Gruppe", "ausfuehrungen", "PH Produkt", kochfeld);
  produkte.get(kochfeld).ausfuehrungen_anzahl = 2;
  produkte.get(sofa).ausfuehrungen = kinder(
    [
      { gruppe_key: "bezug", gruppe_de: "Bezug", pflicht: 1, reihenfolge: 1 },
      { gruppe_key: "fuss", gruppe_de: "Fuß", pflicht: 1, reihenfolge: 2 },
    ],
    "PH Produkt Ausfuehrung Gruppe",
    "ausfuehrungen",
    "PH Produkt",
    sofa
  );
  produkte.get(sofa).ausfuehrungen_anzahl = 5;

  const P = (i) => produkte.get(produktNamen[i]);
  const bestellungen = tabelle("PH Herstellerbestellung");
  bestellungen.clear();
  const hbName = () => `HB-2026-${String(naechste("HB-2026-")).padStart(5, "0")}`;
  const pos = (i, menge, opts = {}) => {
    const p = P(i);
    const ek = Math.round((p.aktueller_preis_cent || 50000) * 0.5 / 100) * 100;
    return { produkt: p.name, bezeichnung: p.titel, ausfuehrung_text: opts.ausf || "", hersteller_artikelnr: p.hersteller_artikelnr, menge, einheit: "Stk", ek_cent: ek, vk_cent: Math.round((p.aktueller_preis_cent || 100000) / 1.2), wunschtermin: opts.wunsch || "", kommission: opts.kommission || "", status: "Offen", menge_erhalten: 0, ab_merker: "offen", abweichung: "keine", ...opts.ab };
  };
  const auftraege = [...(db.get("PH Auftragsbestaetigung")?.keys() || [])];
  const bestellung = (d) => {
    const name = hbName();
    const positionen = kinder(d.positionen, "PH Herstellerbestellung Position", "positionen", "PH Herstellerbestellung", name);
    const lf = LIEFERANTEN.find((l) => l.firmenname === d.lieferant);
    const doc = meta(
      {
        doctype: "PH Herstellerbestellung",
        name,
        naming_series: "HB-.YYYY.-.#####",
        titel: `${d.marke || lf?.marke || "Bestellung"} · ${d.kommission || "Lager"}`,
        lieferant: d.lieferant || "",
        marke: d.marke || lf?.marke || "",
        status: d.status,
        workflow_state: `PH ${d.status}`,
        kommission: d.kommission || "",
        bezug_doctype: d.bezug ? "PH Auftragsbestaetigung" : "",
        bezug_name: d.bezug ? auftraege[d.bezug - 1] || "" : "",
        datum: tag(d.datum),
        bestellweg: lf?.bestellweg || "",
        gesendet_an: d.gesendet !== undefined ? lf?.email || "Portal" : "",
        gesendet_am: d.gesendet !== undefined ? zeit(d.gesendet, 10, 30) : "",
        gesendet_von: d.gesendet !== undefined ? "sortiment@demo.local" : "",
        uebermittlung_weg: d.uebermittlung?.weg || "",
        uebermittlung_status: d.uebermittlung?.status || "",
        uebermittlung_am: d.uebermittlung ? zeit(d.gesendet ?? d.datum, 10, 25) : "",
        uebermittlung_datei: d.uebermittlung?.datei ? `/private/files/${name}-${d.uebermittlung.datei}` : "",
        uebermittlungen: d.uebermittlung ? kinder(d.uebermittlung.zeilen || [], "PH Herstellerbestellung Uebermittlung", "uebermittlungen", "PH Herstellerbestellung", name) : [],
        wunschtermin: d.wunsch !== undefined ? tag(d.wunsch) : "",
        bestaetigter_termin: d.bestaetigt !== undefined ? tag(d.bestaetigt) : "",
        waehrung: "EUR",
        positionen,
        summe_ek_cent: positionen.reduce((a, p) => a + p.ek_cent * p.menge, 0),
        menge_bestellt: positionen.reduce((a, p) => a + p.menge, 0),
        summe_vk_cent: positionen.reduce((a, p) => a + p.vk_cent * p.menge, 0),
        menge_erhalten: positionen.reduce((a, p) => a + (p.menge_erhalten || 0), 0),
        notizen_lieferant: d.hinweis || "",
        notizen_intern: "",
        ab_nummer: d.ab?.nummer || "",
        ab_datum: d.ab ? tag(d.ab.datum) : "",
        ab_eingang: d.ab ? zeit(d.ab.datum, 14, 10) : "",
        ab_datei: d.ab ? `/private/files/${name}-ab.pdf` : "",
        abweichungen_anzahl: 0,
        abweichungen_offen: 0,
        ab_vollstaendig: 0,
        ab_abgleich: [],
        lieferadresse: d.lieferadresse || "Lager",
        lieferadresse_text: d.lieferadresse === "Kunde direkt" ? "Familie Muster\nBeispielweg 3\n6900 Bregenz" : "Platzhirsch Home Living\nSeestraße 1\n6911 Lochau",
        liefertermin_ist: d.geliefert !== undefined ? tag(d.geliefert) : "",
        geliefert_am: d.geliefert !== undefined ? tag(d.geliefert) : "",
        terminaenderungen: d.terminaenderung ? kinder([d.terminaenderung], "PH Herstellerbestellung Terminaenderung", "terminaenderungen", "PH Herstellerbestellung", name) : [],
        quelle: d.quelle || "backoffice",
      },
      { tage: d.geaendert ?? d.datum }
    );
    abgleichSetzen(doc, d.bewertungen || {});
    bestellungen.set(name, doc);
    return doc;
  };

  // Entwürfe
  bestellung({ status: "Entwurf", lieferant: "", marke: "Poliform", kommission: "Auftrag Haus am See", bezug: 1, datum: -1, wunsch: 42, positionen: [pos(2, 1, { wunsch: tag(42) }), pos(49, 2, { wunsch: tag(42) })], quelle: "faktura" });
  bestellung({ status: "Entwurf", lieferant: "Bora Vertrieb Alpen", kommission: "Auftrag Penthouse", bezug: 2, datum: 0, wunsch: 35, positionen: [pos(8, 1, { ausf: "Edelstahl", wunsch: tag(35) }), pos(43, 1, { ausf: "Schwarz matt", wunsch: tag(35) })], quelle: "faktura" });
  bestellung({ status: "Entwurf", lieferant: "Baobab Vertrieb", datum: -2, wunsch: 14, positionen: [pos(10, 12), pos(37, 6), pos(51, 12)], quelle: "logistik" });
  // Gesendet
  bestellung({ status: "Gesendet", lieferant: "Gaggenau Hausgeräte Vertrieb", kommission: "Auftrag Küche Nägele", datum: -9, gesendet: -9, wunsch: 30, positionen: [pos(24, 1, { wunsch: tag(30) }), pos(44, 1, { wunsch: tag(30) })], uebermittlung: { weg: "E-Mail", status: "Uebermittelt", zeilen: [{ zeitpunkt: zeit(-9, 10, 30), weg: "E-Mail", status: "Uebermittelt", hinweis: "PDF an bestellung@…", von: "sortiment@demo.local" }] } });
  bestellung({ status: "Gesendet", lieferant: "Ezarri Vertrieb Österreich", kommission: "Hotel Seeblick", datum: -2, gesendet: -2, wunsch: 21, positionen: [pos(7, 40, { wunsch: tag(21) }), pos(22, 25, { wunsch: tag(21) })], uebermittlung: { weg: "EDI", status: "Uebermittelt", datei: "orders.edi", zeilen: [{ zeitpunkt: zeit(-2, 10, 20), weg: "EDI", status: "Exportiert", datei: "orders.edi", hinweis: "Format unverifiziert", von: "sortiment@demo.local" }, { zeitpunkt: zeit(-2, 10, 30), weg: "EDI", status: "Uebermittelt", hinweis: "im Portal hochgeladen", von: "sortiment@demo.local" }] } });
  bestellung({ status: "Entwurf", lieferant: "Bora Vertrieb Alpen", kommission: "Musterküche Showroom", datum: -1, wunsch: 28, positionen: [pos(23, 1, { wunsch: tag(28) })], uebermittlung: { weg: "IWOfurn", status: "Exportiert", datei: "iwofurn.xml", zeilen: [{ zeitpunkt: zeit(-1, 16, 5), weg: "IWOfurn", status: "Exportiert", datei: "iwofurn.xml", hinweis: "Format unverifiziert", von: "sortiment@demo.local" }] } });
  // AB erhalten (mit Abweichungen offen, mit geklärt, ohne Abweichung)
  bestellung({
    status: "AB erhalten",
    lieferant: "Interni Möbelagentur",
    marke: "Minotti",
    kommission: "Auftrag Wohnen Köhler",
    bezug: 3,
    datum: -20,
    gesendet: -19,
    wunsch: 40,
    ab: { nummer: "AB-77120", datum: -3 },
    positionen: [
      pos(0, 1, { ausf: "Bouclé Sand, Fuß Eiche", wunsch: tag(40), ab: { ab_menge: 1, ab_ek_cent: 670000, bestaetigter_termin: tag(57), ab_artikelnr: "", ab_ausfuehrung_text: "Bouclé Sand, Fuß Eiche" } }),
      pos(50, 1, { ausf: "Leder Cognac", wunsch: tag(40), ab: { ab_menge: 1, bestaetigter_termin: tag(40), ab_ausfuehrung_text: "Leder Mocca" } }),
    ],
  });
  bestellung({
    status: "AB erhalten",
    lieferant: "Vitra Vertrieb Schweiz",
    kommission: "Showroom Herbst",
    datum: -15,
    gesendet: -15,
    wunsch: 10,
    ab: { nummer: "VS-2231", datum: -4 },
    positionen: [pos(12, 6, { wunsch: tag(10), ab: { ab_menge: 4, bestaetigter_termin: tag(17) } }), pos(14, 4, { wunsch: tag(10), ab: { ab_menge: 4, bestaetigter_termin: tag(10) } })],
    bewertungen: { "1:Menge": ["ok", "Rest folgt mit nächster Lieferung"], "1:Termin": ["pruefen", "beim Lieferanten reklamiert"] },
  });
  bestellung({ status: "AB erhalten", lieferant: "Baobab Vertrieb", datum: -8, gesendet: -8, wunsch: 6, ab: { nummer: "BB-5510", datum: -1 }, positionen: [pos(13, 6, { wunsch: tag(6), ab: { ab_menge: 6, bestaetigter_termin: tag(6) } }), pos(16, 12, { wunsch: tag(6), ab: { ab_menge: 12, bestaetigter_termin: tag(5) } })] });
  // AB bestätigt
  bestellung({ status: "AB geprueft", lieferant: "Ezarri Vertrieb Österreich", kommission: "Bad Familie Muster", datum: -25, gesendet: -25, wunsch: 3, bestaetigt: 3, ab: { nummer: "EZ-90112", datum: -20 }, positionen: [pos(55, 18, { wunsch: tag(3), ab: { ab_menge: 18, bestaetigter_termin: tag(3) } }), pos(20, 2, { wunsch: tag(3), ab: { ab_menge: 2, bestaetigter_termin: tag(3) } })] });
  bestellung({ status: "AB geprueft", lieferant: "Gaggenau Hausgeräte Vertrieb", kommission: "Küche Familie Muster", lieferadresse: "Kunde direkt", datum: -30, gesendet: -30, wunsch: 12, bestaetigt: 12, ab: { nummer: "GG-3021", datum: -26 }, positionen: [pos(25, 1, { wunsch: tag(12), ab: { ab_menge: 1, bestaetigter_termin: tag(12) } })] });
  // Teilgeliefert (überfällig)
  const teil = bestellung({
    status: "Teilgeliefert",
    lieferant: "Vitra Vertrieb Schweiz",
    kommission: "Hotel Seeblick Zimmer",
    datum: -45,
    gesendet: -45,
    wunsch: -10,
    bestaetigt: -6,
    ab: { nummer: "VS-1990", datum: -40 },
    terminaenderung: { datum: zeit(-12, 9), termin_alt: tag(-10), termin_neu: tag(-6), grund: "Lieferverzug Werk", quelle: "Lieferant" },
    positionen: [pos(27, 4, { wunsch: tag(-10), ab: { ab_menge: 4, bestaetigter_termin: tag(-6), menge_erhalten: 2, status: "Teilgeliefert" } }), pos(29, 2, { wunsch: tag(-10), ab: { ab_menge: 2, bestaetigter_termin: tag(-6), menge_erhalten: 2, status: "Geliefert" } })],
  });
  const geliefert = bestellung({ status: "Geliefert", lieferant: "Bora Vertrieb Alpen", kommission: "Auftrag Küche Seeblick", datum: -50, gesendet: -50, wunsch: -14, bestaetigt: -14, geliefert: -3, ab: { nummer: "BO-4410", datum: -46 }, positionen: [pos(8, 2, { wunsch: tag(-14), ab: { ab_menge: 2, bestaetigter_termin: tag(-14), menge_erhalten: 2, status: "Geliefert" } })] });
  const fertig = bestellung({ status: "Abgeschlossen", lieferant: "Baobab Vertrieb", datum: -70, gesendet: -70, wunsch: -55, bestaetigt: -55, geliefert: -54, ab: { nummer: "BB-4400", datum: -66 }, positionen: [pos(10, 24, { wunsch: tag(-55), ab: { ab_menge: 24, bestaetigter_termin: tag(-55), menge_erhalten: 24, status: "Geliefert" } })] });
  bestellung({ status: "Storniert", lieferant: "Interni Möbelagentur", marke: "Flexform", kommission: "Auftrag storniert", datum: -35, positionen: [pos(40, 1)] });
  // Weitere Abgeschlossene für Berichte (Monatsverlauf)
  [-95, -125, -160, -190, -220].forEach((t, k) =>
    bestellung({ status: "Abgeschlossen", lieferant: LIEFERANTEN[k % LIEFERANTEN.length].firmenname, datum: t, gesendet: t, wunsch: t + 30, bestaetigt: t + 30 + (k % 3) * 4, geliefert: t + 32, ab: { nummer: `AB-${9000 + k}`, datum: t + 4 }, positionen: [pos(12 + k, 2 + k, { wunsch: tag(t + 30), ab: { ab_menge: 2 + k, bestaetigter_termin: tag(t + 30 + (k % 3) * 4), menge_erhalten: 2 + k, status: "Geliefert" } })] })
  );

  // Wareneingänge
  const eingaenge = tabelle("PH Wareneingang");
  eingaenge.clear();
  const weName = () => `WE-2026-${String(naechste("WE-2026-")).padStart(5, "0")}`;
  const eingang = (hb, d) => {
    const name = weName();
    const positionen = kinder(d.positionen, "PH Wareneingang Position", "positionen", "PH Wareneingang", name);
    const doc = meta(
      {
        doctype: "PH Wareneingang",
        name,
        naming_series: "WE-.YYYY.-.#####",
        titel: `${hb.lieferant} · ${hb.name}`,
        herstellerbestellung: hb.name,
        lieferant: hb.lieferant,
        kommission: hb.kommission,
        status: d.status,
        datum: tag(d.datum),
        lieferschein_nr_lieferant: d.lieferschein,
        spediteur: d.spediteur || "Spedition Muster",
        packstuecke: d.packstuecke || 1,
        erfasst_von: "logistik@demo.local",
        positionen,
        reklamation: d.status === "Reklamiert" ? 1 : 0,
        reklamation_text: d.reklamation || "",
        servicefall_ref: "",
        unterlieferung: positionen.filter((p) => p.mengen_abweichung === "Unterlieferung").length,
        ueberlieferung: positionen.filter((p) => p.mengen_abweichung === "Ueberlieferung").length,
        lagerort_text: "Lager Lochau",
        fotos: [],
      },
      { tage: d.datum, von: "logistik@demo.local" }
    );
    eingaenge.set(name, doc);
  };
  const wePos = (hb, idx, erwartet, erhalten, zustand = "ok", hinweis = "") => {
    const p = hb.positionen[idx - 1];
    const d = erhalten - erwartet;
    return { position: idx, produkt: p.produkt, bezeichnung: p.bezeichnung, menge_erwartet: erwartet, menge_erhalten: erhalten, differenz: d, mengen_abweichung: d === 0 ? "keine" : d > 0 ? "Ueberlieferung" : "Unterlieferung", zustand, hinweis };
  };
  eingang(teil, { status: "Reklamiert", datum: -5, lieferschein: "LS-88120", packstuecke: 3, reklamation: "Karton gestaucht, Ecke abgeplatzt.", positionen: [wePos(teil, 1, 4, 2), wePos(teil, 2, 2, 2, "Transportschaden", "Ecke beschädigt, Foto im Anhang")] });
  eingang(geliefert, { status: "Vollstaendig", datum: -3, lieferschein: "LS-30091", packstuecke: 2, positionen: [wePos(geliefert, 1, 2, 2)] });
  eingang(fertig, { status: "Vollstaendig", datum: -54, lieferschein: "LS-11002", packstuecke: 4, positionen: [wePos(fertig, 1, 24, 26, "ok", "2 Stück mehr geliefert – angenommen")] });
  for (const hb of [...bestellungen.values()].filter((b) => b.status === "Abgeschlossen" && b !== fertig).slice(0, 3)) {
    eingang(hb, { status: "Vollstaendig", datum: tageVon(hb.geliefert_am), lieferschein: `LS-${hb.name.slice(-4)}`, positionen: [wePos(hb, 1, hb.positionen[0].menge, hb.positionen[0].menge)] });
  }

  // Preislisten
  const listen = tabelle("PH Preisliste Import");
  listen.clear();
  const pliName = () => `PH-PLI-2026-${String(naechste("PH-PLI-2026-")).padStart(4, "0")}`;
  const liste = (d) => {
    const name = pliName();
    const zeilen = kinder(d.zeilen, "PH Preisliste Import Zeile", "zeilen", "PH Preisliste Import", name);
    listen.set(
      name,
      meta(
        {
          doctype: "PH Preisliste Import",
          name,
          naming_series: "PH-PLI-.YYYY.-.####",
          titel: `${d.marke} · ${d.preisart}`,
          marke: d.marke,
          stand: tag(d.standTage),
          preisart: d.preisart,
          waehrung: "EUR",
          status: d.status,
          workflow_state: `PH ${d.status}`,
          datei: `/private/files/${slug(d.marke)}-preisliste.csv`,
          lieferant: MARKEN_DATEN[d.marke]?.lieferant || "",
          format: "CSV",
          vk_vorschlag: d.preisart === "Einkaufspreis" ? 1 : 0,
          quelle: "Herstellerliste",
          schwelle_prozent: 15,
          zeilen_anzahl: zeilen.length,
          zeilen_auffaellig: zeilen.filter((z) => Math.abs(z.abweichung_prozent || 0) > 15).length,
          zeilen_ohne_produkt: zeilen.filter((z) => !z.produkt).length,
          zeilen,
          geprueft_von: d.status !== "Hochgeladen" ? "sortiment@demo.local" : "",
          geprueft_am: d.status !== "Hochgeladen" ? zeit(d.standTage + 2, 15) : "",
          uebernommen_von: d.status === "Uebernommen" ? "sortiment@demo.local" : "",
          uebernommen_am: d.status === "Uebernommen" ? zeit(d.standTage + 3, 9) : "",
        },
        { tage: d.standTage + 2 }
      )
    );
  };
  const zeile = (i, neu, extra = {}) => {
    const p = P(i);
    const alt = p.aktueller_preis_cent || 0;
    return { hersteller_artikelnr: p.hersteller_artikelnr, produkt: p.name, bezeichnung: p.titel, ean: p.ean, zuordnung: "Art.-Nr.", alt_cent: alt, neu_cent: neu, abweichung_prozent: alt ? Math.round(((neu - alt) * 1000) / alt) / 10 : 0, uebernehmen: 1, hinweis: alt ? "" : "Erster Preis", ...extra };
  };
  liste({ marke: "Bora", preisart: "UVP", stand: "", standTage: -6, status: "Geprueft", zeilen: [zeile(8, 299000), zeile(23, 549000, { uebernehmen: 0, hinweis: "über Schwelle" }), zeile(43, 249000), zeile(58, 129000), { hersteller_artikelnr: "BO-ZUB-7", produkt: "", bezeichnung: "Umluftfilter Set", ean: "", zuordnung: "", alt_cent: 0, neu_cent: 39000, abweichung_prozent: 0, uebernehmen: 0, hinweis: "Ohne Produkt" }] });
  liste({ marke: "Baobab", preisart: "Verkaufspreis", standTage: -1, status: "Hochgeladen", zeilen: [] });
  liste({ marke: "Ezarri", preisart: "Herstellerpreis", standTage: -40, status: "Uebernommen", zeilen: [zeile(20, 189000), zeile(21, 349000), zeile(45, 69000)] });
  liste({ marke: "Flexform", preisart: "Verkaufspreis", standTage: -80, status: "Verworfen", zeilen: [zeile(3, 139000)] });

  // Bestellvorschläge (Logistik): offene ohne Produkt mit Lagerartikeln füllen (Stub statt Warten, § 5.3 MASTER)
  const lager = KATALOG.map((k, i) => (k[6] === "lager" ? i : -1)).filter((i) => i >= 0);
  const vorschlaege = db.get("PH Bestellvorschlag");
  if (vorschlaege) {
    let k = 0;
    for (const v of vorschlaege.values()) {
      if (v.produkt) continue;
      const p = P(lager[k % lager.length]);
      const lf = MARKEN_DATEN[p.marke]?.lieferant || "";
      k++;
      const melde = 6 + (k % 3) * 2;
      const verfuegbar = k % 2 ? 2 : 0;
      Object.assign(v, {
        titel: `${p.titel} · Lager Lochau`,
        status: k <= 3 ? "Offen" : v.status === "Offen" ? "Erledigt" : v.status,
        produkt: p.name,
        produkt_name: p.titel,
        marke: p.marke,
        lieferant: lf,
        wiederbeschaffung_tage: (LIEFERANTEN.find((l) => l.firmenname === lf)?.lz || 2) * 7,
        voraussichtlich_am: tag((LIEFERANTEN.find((l) => l.firmenname === lf)?.lz || 2) * 7),
        bestand: verfuegbar + 1,
        reserviert: 1,
        kommission: 0,
        gesperrt: 0,
        offen_bestellt: 0,
        verfuegbar,
        meldebestand: melde,
        zielbestand: melde * 2,
        bestellmenge_min: 6,
        vorschlag_menge: Math.max(6, melde * 2 - verfuegbar),
        menge_manuell: 0,
        ek_cent: Math.round((p.aktueller_preis_cent || 10000) * 0.45 / 100) * 100,
        wert_cent: Math.round((p.aktueller_preis_cent || 10000) * 0.45 / 100) * 100 * Math.max(6, melde * 2 - verfuegbar),
        herstellerbestellung: "",
        erstellt_am: zeit(-k, 6, 0),
        quelle: "scheduler",
      });
    }
  }
}

function tageVon(isoDatum) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoDatum || ""));
  if (!m) return 0;
  return Math.round((new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) - new Date(2026, 10, 4)) / 86_400_000);
}

/** Produkt-Dokument aus dem Katalog-Eintrag. */
function produktDoc(alt, { name, i, bez, marke, kat, bild, status, cent, extra }) {
  const bildUrl = bild ? B(bild) : "";
  const ohneBild = extra === "ohneBild" || !bild;
  const bildOffen = extra === "bildOffen";
  const markeOffen = MARKEN_DATEN[marke]?.bild !== "schriftlich erteilt";
  const bilder = ohneBild
    ? []
    : [
        { bild: bildUrl, typ: bild.startsWith("p-") ? "freisteller" : "ambiente", alt_de: bez, quelle_url: `https://${slug(marke)}.beispiel.invalid/medien`, abgerufen: tag(-40), freigabe: bildOffen || (markeOffen && status !== "Aktiv") ? "offen" : "erteilt", freigabe_datum: bildOffen ? "" : tag(-30), reihenfolge: 1 },
        ...(i % 3 === 0 ? [{ bild: bildUrl, typ: "detail", alt_de: `${bez} Detail`, quelle_url: `https://${slug(marke)}.beispiel.invalid/medien`, abgerufen: tag(-40), freigabe: "offen", reihenfolge: 2 }] : []),
      ];
  const freigegeben = bilder.some((b) => b.freigabe === "erteilt");
  const preisart = extra === "anfrage" ? "Auf Anfrage" : extra === "uvp" ? "UVP" : "Verkaufspreis";
  const standTage = extra === "veraltet" ? -400 : extra === "laeuftAb" ? -350 : -60 - (i % 40);
  const preise = [];
  if (cent > 0) {
    preise.push({ ab: tag(standTage - 200), brutto_cent: Math.round(cent * 0.94 / 100) * 100, waehrung: "EUR", preisart: preisart === "UVP" ? "UVP" : "Verkaufspreis", stand: tag(standTage - 200), quelle: "Herstellerliste", quelle_url: `https://${slug(marke)}.beispiel.invalid/preise`, freigegeben: 1, freigegeben_von: "sortiment@demo.local", freigegeben_am: tag(standTage - 199) });
    preise.push({ ab: tag(standTage), brutto_cent: cent, waehrung: "EUR", preisart: preisart === "UVP" ? "UVP" : "Verkaufspreis", stand: tag(standTage), gueltig_bis: tag(standTage + (preisart === "UVP" ? 182 : 365)), quelle: "Herstellerliste", quelle_url: `https://${slug(marke)}.beispiel.invalid/preise`, freigegeben: 1, freigegeben_von: "sortiment@demo.local", freigegeben_am: tag(standTage + 1) });
    if (i % 7 === 3 || i === 2 || i === 11) preise.push({ ab: tag(-1), brutto_cent: Math.round(cent * 1.04 / 100) * 100, waehrung: "EUR", preisart: "Verkaufspreis", stand: tag(-1), gueltig_bis: tag(364), quelle: "Herstellershop", quelle_url: `https://${slug(marke)}.beispiel.invalid/shop`, freigegeben: 0 });
  }
  const lieferzeitOffen = i % 9 === 4;
  const doc = {
    ...alt,
    doctype: "PH Produkt",
    name,
    slug: name,
    name_herstellerbezeichnung: bez,
    titel: bez,
    marke,
    kategorie: kat,
    kategorien_weitere: [],
    status,
    workflow_state: `PH ${status}`,
    typ: extra === "ausstellung" ? "Ausstellungsstueck" : KATEGORIEN_DATEN[kat]?.welt === "Accessoires" ? "Accessoire" : "Katalog",
    collection: i % 4 === 0 ? `${marke} Collection` : "",
    serie: "",
    designer: i % 5 === 0 ? "Studio Muster" : "",
    hersteller_artikelnr: `${slug(marke).slice(0, 3).toUpperCase()}-${String(1000 + i * 7)}`,
    ean: "",
    hersteller_url: `https://${slug(marke)}.beispiel.invalid/produkte/${slug(bez)}`,
    welt: KATEGORIEN_DATEN[kat]?.welt || "Wohnen",
    bereich: "",
    stand: tag(standTage),
    ausgewaehlt: i % 6 === 0 ? 1 : 0,
    kurz_de: extra === "ohneText" ? "" : `${bez} von ${marke} – Beispieltext für die Produktseite.`,
    kurz_en: status === "Aktiv" && i % 3 ? `${bez} by ${marke} – sample text.` : "",
    kurz_fr: "",
    kurz_it: "",
    beschreibung_de: extra === "ohneText" ? "" : `<p>${bez} in der Ausführung laut Herstellerliste. Maße und Materialien siehe Datenblatt.</p>`,
    beschreibung_en: "",
    beschreibung_fr: "",
    beschreibung_it: "",
    merkmale: [],
    masse: [],
    bild_hauptbild: ohneBild ? "" : bildUrl,
    bild_freigegeben: freigegeben ? 1 : 0,
    bilder_anzahl: bilder.length,
    bilder_offen: bilder.filter((b) => b.freigabe !== "erteilt").length,
    bilder: kinder(bilder, "PH Produkt Bild", "bilder", "PH Produkt", name),
    dokumente: [],
    modell_3d: [],
    ausfuehrungen: [],
    ausfuehrungen_anzahl: 0,
    zubehoer: [],
    verwandt: [],
    preisart,
    waehrung: "EUR",
    aktueller_preis_cent: cent > 0 ? cent : 0,
    aktueller_preis_stand: cent > 0 ? tag(standTage) : "",
    preisstand_alt: extra === "veraltet" ? 1 : 0,
    einkaufspreis_cent: cent > 0 ? Math.round(cent * 0.5 / 100) * 100 : 0,
    abverkauf: extra === "abverkauf" || extra === "ausstellung" ? 1 : 0,
    abverkauf_preis_cent: extra === "abverkauf" || extra === "ausstellung" ? Math.round(cent * 0.7 / 100) * 100 : 0,
    abverkauf_seit: extra === "abverkauf" || extra === "ausstellung" ? tag(-20) : "",
    grundpreis_einheit: extra === "grundpreis" ? "g" : "",
    grundpreis_menge: extra === "grundpreis" ? Number((/(\d+) g/.exec(bez) || [0, 270])[1]) : 0,
    preise: kinder(preise, "PH Produkt Preis", "preise", "PH Produkt", name),
    einkaufspreise: [],
    variantenpreise: [],
    lieferzeit_wochen_von: extra === "lager" ? 0 : 2 + (i % 4) * 2,
    lieferzeit_wochen_bis: extra === "lager" ? 0 : 4 + (i % 4) * 3,
    sofort_lieferbar: extra === "lager" ? 1 : 0,
    lagerartikel: extra === "lager" ? 1 : 0,
    lieferzeit_freigegeben: lieferzeitOffen ? 0 : 1,
    lieferzeit_freigabe_datum: lieferzeitOffen ? "" : tag(-25),
    lieferzeit_freigabe_durch: lieferzeitOffen ? "" : "sortiment@demo.local",
    lieferzeit_text_de: "",
    verkauf_online: extra === "shop" || extra === "lager" || extra === "grundpreis" || extra === "laeuftAb" ? 1 : 0,
    reservierung_online: 0,
    ust_klasse: KATEGORIEN_DATEN[kat]?.ust || "normal",
    zerbrechlich: bild.startsWith("p-") ? 1 : 0,
    gewicht_g: 0,
    website_sichtbar: extra === "ausgeblendet" ? 0 : 1,
    url_slug: slug(bez),
    quellen: "",
    seo_title_de: status === "Aktiv" ? `${bez} | ${marke}` : "",
    seo_description_de: status === "Aktiv" ? `${bez} von ${marke} im Showroom Lochau.` : "",
    import_quelle: i % 5 === 0 ? "katalog" : "manuell",
    import_stand: "",
    geprueft_von: ["Geprueft", "Aktiv", "Pausiert"].includes(status) ? "sortiment@demo.local" : "",
    geprueft_am: ["Geprueft", "Aktiv", "Pausiert"].includes(status) ? zeit(-30 + (i % 20), 10) : "",
    veroeffentlicht_am: status === "Aktiv" ? zeit(-(i % 45), 11) : "",
    notizen: "",
    owner: alt.owner || "sortiment@demo.local",
    creation: alt.creation || zeit(-90 + i, 9),
    modified: zeit(-(i % 25), 9 + (i % 8), (i * 15) % 60),
    modified_by: "sortiment@demo.local",
    docstatus: 0,
    idx: 0,
  };
  if (extra === "grundpreisFehlt") {
    doc.grundpreis_einheit = "";
    doc.grundpreis_menge = 0;
  }
  return doc;
}

/** AB-Abgleich wie ph_sortiment (Toleranz 0) inkl. Merker; Bewertungen „pos:feld“ → [bewertung, klaerung]. */
function abgleichSetzen(doc, bewertungen) {
  if (!doc.ab_nummer) return;
  const protokoll = [];
  doc.positionen.forEach((p, i) => {
    const idx = i + 1;
    const z = [];
    const basis = { position: idx, produkt: p.produkt, bezeichnung: p.bezeichnung, bewertung: "offen" };
    if (p.ab_menge !== undefined && p.ab_menge !== "" && Number(p.ab_menge) !== Number(p.menge)) z.push({ ...basis, feld: "Menge", bestellt: String(p.menge), bestaetigt: String(p.ab_menge), abweichung_text: `${p.ab_menge - p.menge > 0 ? "+" : "−"}${Math.abs(p.ab_menge - p.menge)} Stk` });
    if (p.ab_ek_cent && p.ek_cent && p.ab_ek_cent !== p.ek_cent) {
      const pr = ((p.ab_ek_cent - p.ek_cent) * 100) / p.ek_cent;
      const euro = (v) => `${(v / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`;
      z.push({ ...basis, feld: "Preis", bestellt: euro(p.ek_cent), bestaetigt: euro(p.ab_ek_cent), abweichung_text: `+${((p.ab_ek_cent - p.ek_cent) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} € (+${pr.toLocaleString("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} %)` });
    }
    if (p.bestaetigter_termin && p.wunschtermin) {
      const t = tageVon(p.bestaetigter_termin) - tageVon(p.wunschtermin);
      const d = (v) => v.split("-").reverse().join(".");
      if (t > 0) z.push({ ...basis, feld: "Termin", bestellt: d(p.wunschtermin), bestaetigt: d(p.bestaetigter_termin), abweichung_text: `+${t} Tage` });
    }
    if (p.ab_ausfuehrung_text && p.ausfuehrung_text && p.ab_ausfuehrung_text.toLowerCase() !== p.ausfuehrung_text.toLowerCase()) z.push({ ...basis, feld: "Ausfuehrung", bestellt: p.ausfuehrung_text, bestaetigt: p.ab_ausfuehrung_text, abweichung_text: "Ausführung weicht ab" });
    const spaeter = ["AB geprueft", "Teilgeliefert", "Geliefert", "Abgeschlossen"].includes(doc.status);
    for (const zz of z) {
      if (spaeter) Object.assign(zz, { bewertung: "ok", klaerung: "akzeptiert", geprueft_von: "sortiment@demo.local", geprueft_am: `${doc.ab_datum} 15:00:00` });
      const b = bewertungen[`${idx}:${zz.feld}`];
      if (b) Object.assign(zz, { bewertung: b[0], klaerung: b[1], geprueft_von: "sortiment@demo.local", geprueft_am: zeit(-2, 10) });
    }
    p.abweichung = z.length ? (z.length > 1 ? "Mehrfach" : z[0].feld) : "keine";
    const offen = z.some((x) => ["offen", "pruefen"].includes(x.bewertung));
    p.ab_merker = !z.length ? "bestaetigt" : offen ? "abweichung" : "geklaert";
    p.ab_merker_am = doc.ab_datum;
    if (p.status === "Offen") p.status = "Bestaetigt";
    protokoll.push(...z);
  });
  const termine = doc.positionen.map((p) => p.bestaetigter_termin).filter(Boolean).sort();
  if (!doc.bestaetigter_termin && termine.length) doc.bestaetigter_termin = termine[termine.length - 1];
  doc.ab_abgleich = kinder(protokoll, "PH AB Abgleich", "ab_abgleich", "PH Herstellerbestellung", doc.name);
  doc.abweichungen_anzahl = protokoll.length;
  doc.abweichungen_offen = protokoll.filter((z) => ["offen", "pruefen"].includes(z.bewertung)).length;
  doc.ab_vollstaendig = doc.positionen.every((p) => ["bestaetigt", "geklaert"].includes(p.ab_merker)) ? 1 : 0;
  if (["AB geprueft", "Teilgeliefert", "Geliefert", "Abgeschlossen"].includes(doc.status)) {
    doc.ab_geprueft_von = "sortiment@demo.local";
    doc.ab_geprueft_am = `${doc.ab_datum} 15:00:00`;
  }
}

export { HEUTE };
