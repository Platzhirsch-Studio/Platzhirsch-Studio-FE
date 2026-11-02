// src/lib/katalog/schema.js
// Datenmodell des statischen Herstellerkatalogs (Bad & Wellness: Inhaber-
// Entscheidungen Nr. 19–23; Küchengeräte: Nr. 24, alle vom 31.10.2026).
//
// Warum statisch im Repo: Der normale Katalog kommt aus dem Frappe-Backoffice
// („Produkte New“) – dort schreiben wir nicht. Diese Daten werden zusätzlich
// als Importdatei exportiert (tools/wellness/export-frappe.mjs).
//
// Jede Marke hat EINE eigene Datei src/lib/katalog/marken/<marke>.js, die nur
// das Daten-Team dieser Marke anfasst. Anleitung und Regeln:
// qa-screenshots/wellness/produkte/ANLEITUNG-MARKEN.md. Prüfung:
// node --test tests/unit/wellness-produkte.test.mjs
//
// Regeln (geprüft von validateProdukt + Unit-Test):
//   - nur belegte Fakten von der offiziellen Herstellerseite (quellen[]),
//   - keine Preise, keine Superlative, keine Heil-/Wirkversprechen,
//   - kein Händler-/Partnerwort in den Daten (der Händlersatz kommt
//     ausschließlich über den Claim-Guard src/lib/legal/claims.js),
//   - Herstellername unverändert in `name`,
//   - Bilder lokal unter public/Images/Wellness/produkte/<marke>/…, je Bild
//     Quelle (quelleUrl) und Abrufdatum, Motiv unverändert (nur verkleinert);
//     Dateien WebP, höchstens 1600 px lange Kante (tools/images/optimize-katalog.mjs),
//     Quellenliste: docs/bildquellen/QUELLEN.md (nicht ausgeliefert).
//
// Rein, ohne "@/"-Importe (node --test, tools/).

/** Sprachen jedes Textes. */
export const KATALOG_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

/** Bereiche. bad/wellness/objekt → Welt „bad-wellness“, kueche → „kuechengeraete“, accessoires → „accessoires“ (Nr. 27). */
export const BEREICHE = Object.freeze(["bad", "wellness", "objekt", "kueche", "accessoires"]);

/**
 * Kategorien (Slug → Bereiche, in denen sie vorkommen). Neue Kategorie:
 * hier ergänzen UND Text unter katalog.kategorie.<slug> in src/messages/*.json
 * (Messages-Schlüssel ohne Bindestrich: kategorieKey()).
 */
export const KATEGORIEN = Object.freeze({
  // Wellness
  sauna: ["wellness", "objekt"],
  dampfbad: ["wellness", "objekt"],
  "dampfbad-technik": ["wellness", "objekt"],
  "dampfbad-sitz": ["wellness", "objekt", "bad"],
  infrarot: ["wellness", "objekt"],
  waermeliege: ["wellness", "objekt"],
  ruheliege: ["wellness", "objekt"],
  hammam: ["wellness", "objekt"],
  erlebnisdusche: ["wellness", "objekt", "bad"],
  whirlpool: ["wellness", "objekt"],
  swimspa: ["wellness", "objekt"],
  "cold-plunge": ["wellness", "objekt"],
  floating: ["wellness", "objekt"],
  "spa-kabine": ["wellness", "objekt"],
  salzvernebler: ["wellness", "objekt"],
  zubehoer: ["wellness", "objekt", "bad"],
  therapieliege: ["objekt"],
  behandlungsraum: ["objekt"],
  // Bad
  waschtisch: ["bad"],
  // K2 (31.10.2026): Waschtischplatten (Tops ohne Becken) eigene Kategorie statt „Badmöbel“
  waschtischplatte: ["bad"],
  badewanne: ["bad"],
  armatur: ["bad", "kueche"],
  dusche: ["bad", "objekt"],
  spiegel: ["bad"],
  badmoebel: ["bad"],
  leuchte: ["bad", "wellness", "objekt", "kueche"],
  wc: ["bad"],
  accessoire: ["bad"],
  // K2: Handtuchwärmer/Heizkörper (Agape, Dornbracht) eigene Kategorie statt „Bad-Accessoire“
  handtuchwaermer: ["bad"],
  // Küche (Inhaber-Entscheidung Nr. 24)
  backofen: ["kueche"],
  dampfgarer: ["kueche"],
  kompaktgeraet: ["kueche"],
  mikrowelle: ["kueche"],
  kochfeld: ["kueche"],
  "kochfeld-mit-abzug": ["kueche"],
  dunstabzug: ["kueche"],
  kuehlen: ["kueche"],
  gefrieren: ["kueche"],
  weinklima: ["kueche"],
  geschirrspueler: ["kueche"],
  waermeschublade: ["kueche"],
  vakuumierschublade: ["kueche"],
  kaffeevollautomat: ["kueche"],
  "armatur-kochendwasser": ["kueche"],
  spuele: ["kueche"],
  // K2: Küchenzubehör (z. B. Zubehör zu Einbaugeräten), sobald Daten-Teams es führen
  kuechenzubehoer: ["kueche"],
  // Accessoires (Inhaber-Entscheidung Nr. 27, Baobab Collection)
  duftkerze: ["accessoires"],
  raumduft: ["accessoires"],
  diffuser: ["accessoires"],
  wohnaccessoire: ["accessoires"],
  geschenkset: ["accessoires"],
  // Nr. 28: Riedel (Gläser, Karaffen), Cire Trudon (Kerzen, Raumduft → duftkerze/raumduft)
  glas: ["accessoires"],
  karaffe: ["accessoires"],
  "bar-zubehoer": ["accessoires"],
  // Nr. 32: Assouline (Bildbände), Kähler/Lyngby Porcelæn (Vasen, Geschirr), Flos/Tom Dixon (nur tragbare Akku-Leuchten)
  bildband: ["accessoires"],
  vase: ["accessoires"],
  geschirr: ["accessoires"],
  "tragbare-leuchte": ["accessoires"],
  // Nr. 34: Parfum JA (Cire Trudon Eaux de Parfum); Körperpflege (Seifen, Lotionen) bewusst NEIN
  parfum: ["accessoires"],
});

/** Bereiche je Welt (Spiegel von welten.js WELTEN[*].bereiche; Test prüft Gleichheit). */
export const WELT_BEREICHE = Object.freeze({
  "bad-wellness": Object.freeze(["bad", "wellness", "objekt"]),
  kuechengeraete: Object.freeze(["kueche"]),
  accessoires: Object.freeze(["accessoires"]),
});

/** Maß-Schlüssel (Beschriftung: katalog.mass.<key>). Werte sprachneutral, z. B. "204 cm". */
export const MASS_KEYS = Object.freeze(["laenge", "breite", "hoehe", "tiefe", "sitzhoehe", "lehnenhoehe", "sitztiefe", "durchmesser", "gewicht", "abmessung", "nische"]);

/** Messages-Schlüssel ohne Bindestrich (next-intl-Pfade): "cold-plunge" → "coldplunge". */
export const kategorieKey = (slug) => String(slug).replace(/-/g, "");

/** Slug-Form: klein, a–z, 0–9, Bindestriche. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const IMG_RE = /^\/Images\/Wellness\/produkte\/([a-z0-9-]+)\/[A-Za-z0-9._-]+\.(?:jpe?g|png|webp|avif)$/;

/** Wörter, die nie in den Daten stehen dürfen (Händlersatz nur über den Claim-Guard). */
export const DEALER_WORDS = /\b(?:händler\w*|vertragshändler\w*|dealer\w*|revendeur\w*|rivenditor\w*|distribut\w*|partner\w*|autorisiert\w*|authori[sz]ed|offiziell\w* (?:händler|partner))\b/i;
/** Preise/Währung. */
export const PRICE_WORDS = /(?:€|\$|\b(?:eur|euro|chf|uvp|preis\w*|price\w*|prix|prezz[oi]|rabatt(?!able)\w*|sconto|remise)(?![a-zäöüéèàù]))/i;
/** Superlative und Werbe-Absolutes ohne Beleg. */
export const SUPERLATIVE_WORDS = /\b(?:beste[nrs]?|größte[nrs]?|führend\w*|einzigartig\w*|nr\.?\s?1|nummer eins|weltweit erste\w*|best|leading|unique|unrivall?ed|world'?s first|meilleur\w*|leader|migliore|migliori|unico al mondo|luxusklasse|extraklasse|perfekt\w*|perfect\w*|parfait\w*|perfett\w*)(?![a-zäöüéèàù])/i;
/** Heil- und Wirkversprechen (UWG/HWG-Umfeld). */
export const HEALTH_WORDS = /\b(?:heil\w*|therap\w*|gesund\w*|durchblutung\w*|rheuma\w*|immun\w*|entgift\w*|detox\w*|linder\w*|schmerz\w*|krankheit\w*|neurodermitis|psoriasis|heal\w*|cure[sd]?|pain|sant[ée]|gu[ée]ri\w*|douleur\w*|salute|guari\w*|dolor\w*|wohltuend\w*|wohlbefinden)(?![a-zäöüéèàù])/i;
/** „Therapie“ ist nur im Objekt-Kontext Naggura als Raumbezeichnung erlaubt (Kategorie therapieliege/behandlungsraum). */
const HEALTH_ALLOWED_CATEGORIES = new Set(["therapieliege", "behandlungsraum"]);

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** Text in 4 Sprachen ({de,en,fr,it}, alle nicht leer)? */
export function isLocalized(v) {
  return isObj(v) && KATALOG_LOCALES.every((l) => typeof v[l] === "string" && v[l].trim().length > 0);
}

/** Text der Sprache aus {de,en,fr,it} oder sprachneutraler String. */
export function textOf(v, locale = "de") {
  if (typeof v === "string") return v;
  if (isObj(v)) return v[locale] || v.de || "";
  return "";
}

/** Alle Texte eines Produkts (für Wortprüfungen), ohne URLs/Dateinamen. */
export function produktTexte(p) {
  const out = [];
  const push = (v) => {
    if (typeof v === "string") out.push(v);
    else if (isObj(v)) KATALOG_LOCALES.forEach((l) => v[l] && out.push(v[l]));
  };
  push(p.kurz);
  (p.merkmale || []).forEach(push);
  (p.masse || []).forEach((m) => push(m.wert));
  (p.bilder || []).forEach((b) => push(b.alt));
  push(p.serie);
  push(p.designer);
  // Ausführungen, Zubehör-Hinweise (31.10.2026, Konfigurator)
  for (const g of Array.isArray(p.ausfuehrungen) ? p.ausfuehrungen : []) {
    push(g?.gruppe);
    for (const o of Array.isArray(g?.optionen) ? g.optionen : []) {
      push(o?.name);
      for (const b of Array.isArray(o?.bilder) ? o.bilder : []) if (isObj(b)) push(b.alt);
    }
  }
  for (const z of Array.isArray(p.zubehoer) ? p.zubehoer : []) push(z?.hinweis);
  return out;
}

/**
 * @typedef {{de: string, en: string, fr: string, it: string}} Text4
 * @typedef {{src: string, width: number, height: number, alt: Text4, quelleUrl: string, abgerufen: string, typ?: "freisteller"|"ambiente"|"detail"}} KatalogBild
 *   typ: Standard "freisteller" (Produkt vor neutralem Grund); "ambiente" = Raumbild
 *   (Produkt im Raum, „So wirkt es im Raum“), "detail" = Ausschnitt/Material/Maßzeichnung.
 * @typedef {{id: string, name: Text4|string, code?: string, farbe?: string, bilder?: Array<string|KatalogBild>, standard?: boolean, betrag?: number}} KatalogOption
 *   id: Slug-Form, eindeutig je Gruppe · code: Herstellercode/RAL („RAL 1013“) · farbe: "#RRGGBB" nur
 *   wenn belegt (z. B. RAL-Wert) · bilder: src aus `bilder` ODER eigenes Bild-Objekt mit Quelle ·
 *   standard: höchstens einmal je Gruppe · betrag: NUR Marken mit Verkaufspreis (PREIS_ARTEN.verkaufspreis)
 * @typedef {{gruppe: Text4|string, optionen: KatalogOption[]}} KatalogAusfuehrung   z. B. „Basis“, „Front-Paneel“
 * @typedef {{slug: string, hinweis?: Text4}} KatalogZubehoer                       anderes Katalogprodukt
 * @typedef {{id: string, titel: Text4, bild: KatalogBild, produkte: string[]}} KatalogLook  Raumszene/„Shop the look“
 * @typedef {{key: string, wert: string}} KatalogMass          key ∈ MASS_KEYS, wert sprachneutral ("204 cm")
 * @typedef {{
 *   slug: string,                  global eindeutig, Empfehlung: "<marke>-<modell>"
 *   marke: string,                 Marken-Slug (= Dateiname)
 *   bereich: "bad"|"wellness"|"objekt"|"kueche"|"accessoires",
 *   welt?: "bad-wellness"|"kuechengeraete"|"accessoires"  Welt des Produkts (Standard: MARKE.welt);
 *                                  nur setzen, wenn das Produkt in einer anderen Welt als die Marke
 *                                  erscheint (z. B. Dornbracht-Küchenarmaturen → "kuechengeraete").
 *                                  Der Bereich muss zur Welt passen (WELTEN[welt].bereiche).
 *   kategorie: string,             Schlüssel aus KATEGORIEN
 *   name: string,                  Herstellername, unverändert
 *   serie?: string,
 *   kurz: Text4,                   eigener Kurztext, 1–2 Sätze, nur belegte Fakten
 *   merkmale: Array<Text4|string>, belegte Fakten (4 Sprachen oder sprachneutral)
 *   masse?: KatalogMass[],         nur wenn beim Hersteller angegeben
 *   designer?: string,             nur wenn belegt
 *   bilder: KatalogBild[],         darf leer sein (Platzhalter), sonst je Bild Quelle
 *   herstellerUrl: string,         offizielle Produktseite (https)
 *   quellen: string[],             alle Seiten, aus denen Fakten stammen (https)
 *   stand: string,                 Prüfdatum YYYY-MM-DD
 *   (ausgewaehlt: nicht in den Markendateien setzen – zentral in index.js AUSGEWAEHLT, K16)
 *   verwandt?: string[],           Slugs passender Produkte (Nr. 28), auch aus anderen Welten
 *   preis?: KatalogPreis           NUR Küche (uvp-ab) bzw. Baobab/Riedel/Trudon (verkaufspreis)
 *   ausfuehrungen?: KatalogAusfuehrung[]  wählbare Ausführungen (Konfigurator), nur belegte Optionen
 *   zubehoer?: KatalogZubehoer[]   kombinierbares Zubehör („Passend dazu“)
 * }} KatalogProdukt
 * @typedef {{art: "uvp-ab", uvpAb: number, stand: string, quelle: string, bezeichnung?: "uvp"|"herstellerpreis", zusatz?: Text4}}
 *   | {art: "verkaufspreis", betrag?: number, varianten?: Array<{name: Text4|string, betrag: number}>, stand: string, quelle: string}} KatalogPreis
 * @typedef {{
 *   slug: string, name: string,
 *   welt: "bad-wellness"|"kuechengeraete"|"accessoires",
 *   herstellerUrl: string,
 *   dealer: boolean,               true → Händlersatz über dealerStatement() (Claim-Guard entscheidet)
 *   stand?: string|null,
 *   querverweise?: Array<{welt: string, kategorie: string}>  z. B. Riedel → kuechengeraete/weinklima (Nr. 28)
 *   looks?: KatalogLook[]          Raumszenen („Ganze Räume ansehen“) mit den gezeigten Produkten
 * }} KatalogMarke
 */

// ---------------------------------------------------------------------------
// Preise (Inhaber-Entscheidungen Nr. 26 und 27, 31.10.2026). Zwei Arten:
//   art "uvp-ab"        NUR bereich "kueche" (Nr. 26): { art, uvpAb: Zahl EUR
//                       (Endpreis Österreich inkl. 20 % MwSt.), stand, quelle:
//                       URL der offiziellen Hersteller-UVP oder "Inhaber-Preisliste" }
//                       → „UVP ab € 2.490 inkl. 20 % MwSt. …“, höchstens 6 Monate alt.
//                       Optional (Nr. 34): bezeichnung "uvp" (Standard) | "herstellerpreis"
//                       (Hersteller-Shop-Preis → „Herstellerpreis ab € …“), zusatz: Text4.
//   art "verkaufspreis" NUR Marken baobab-collection (Nr. 27), riedel, cire-trudon (Nr. 28),
//                       zalto, assouline, kahler, lyngby-porcelaen, flos, tom-dixon (Nr. 32), spiegelau, nachtmann (Nr. 34, AT-Shop riedel.com): echter Verkaufspreis
//                       { art, betrag: Zahl EUR ODER varianten: [{ name: Text4|string,
//                       betrag }], stand, quelle: https-URL des Produkts im
//                       Hersteller-Shop Österreich (Riedel, Baobab) bzw. EU-Shop in EUR
//                       (Trudon, falls kein AT-Shop) } → „€ 79 inkl. 20 % MwSt.“, höchstens 3 Monate alt.
// Nie schätzen. Angezeigt nur mit gültiger quelle + stand und nicht veraltet
// (preisAktiv); veraltete werden ausgeblendet und vom Prüfskript gemeldet
// (preisVeraltet, tests/unit/wellness-produkte.test.mjs).

export const PREIS_ARTEN = Object.freeze({
  "uvp-ab": Object.freeze({ maxMonate: 6, nurBereich: "kueche", nurMarken: null }),
  verkaufspreis: Object.freeze({ maxMonate: 3, nurBereich: null, nurMarken: Object.freeze(["baobab-collection", "riedel", "cire-trudon", "zalto", "assouline", "kahler", "lyngby-porcelaen", "flos", "tom-dixon", "spiegelau", "nachtmann"]) }),
});
/** @deprecated Alias: Höchstalter der UVP (art "uvp-ab"). */
export const PREIS_MAX_MONATE = PREIS_ARTEN["uvp-ab"].maxMonate;
export const PREIS_QUELLE_INHABER = "Inhaber-Preisliste";
/**
 * Bezeichnung eines „ab“-Preises der Küche (Inhaber-Entscheidung Nr. 34, 31.10.2026):
 *   "uvp" (Standard)     unverbindliche Preisempfehlung → „UVP ab € …“
 *   "herstellerpreis"    Preis im Hersteller-Shop (z. B. quooker.at, liebherr.com, miele.at,
 *                        shop.bora.com zeigen Shop-Preise, keine UVP) → „Herstellerpreis ab € …“
 * Optional zusatz (Text4): sachlicher Bezug des Preises, z. B. „Systempreis mit Reservoir PRO3“.
 */
export const PREIS_BEZEICHNUNGEN = Object.freeze(["uvp", "herstellerpreis"]);
/** Bezeichnung eines Preises ("uvp", wenn nicht gesetzt). */
export const preisBezeichnung = (preis) => (preis?.bezeichnung === "herstellerpreis" ? "herstellerpreis" : "uvp");

const betragOk = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;

/** Fehlerliste des Preisfelds (Art, Struktur, Bereich/Marke, Quelle). */
export function validatePreis(p, where = `Produkt ${p?.slug || "?"}`) {
  const e = [];
  const pr = p.preis;
  if (!isObj(pr)) return [`${where}: preis muss ein Objekt sein`];
  const art = PREIS_ARTEN[pr.art];
  if (!art) return [`${where}: preis.art muss "uvp-ab" oder "verkaufspreis" sein`];
  if (art.nurBereich && p.bereich !== art.nurBereich) e.push(`${where}: preis.art "${pr.art}" nur bei bereich "${art.nurBereich}" (Nr. 26)`);
  if (art.nurMarken && !art.nurMarken.includes(p.marke)) e.push(`${where}: preis.art "${pr.art}" nur für ${art.nurMarken.join(", ")} (Nr. 27/28/32)`);
  if (!DATE_RE.test(pr.stand || "")) e.push(`${where}: preis.stand (JJJJ-MM-TT) fehlt`);
  if (pr.art === "uvp-ab") {
    if (!betragOk(pr.uvpAb)) e.push(`${where}: preis.uvpAb (Zahl > 0, EUR) fehlt`);
    if (!(pr.quelle === PREIS_QUELLE_INHABER || /^https:\/\//.test(pr.quelle || ""))) e.push(`${where}: preis.quelle (https-URL der Hersteller-UVP oder "${PREIS_QUELLE_INHABER}") fehlt`);
    if (pr.bezeichnung != null && !PREIS_BEZEICHNUNGEN.includes(pr.bezeichnung)) e.push(`${where}: preis.bezeichnung muss ${PREIS_BEZEICHNUNGEN.join(" oder ")} sein`);
    if (pr.zusatz != null) {
      if (!isLocalized(pr.zusatz)) e.push(`${where}: preis.zusatz braucht de/en/fr/it`);
      else for (const t of KATALOG_LOCALES.map((l) => pr.zusatz[l])) {
        if (DEALER_WORDS.test(t)) e.push(`${where}: Vertriebswort in preis.zusatz: "${t}"`);
        if (SUPERLATIVE_WORDS.test(t)) e.push(`${where}: Superlativ in preis.zusatz: "${t}"`);
        if (/€|\$|\b(?:eur|euro|chf)\b/i.test(t)) e.push(`${where}: preis.zusatz ohne Beträge/Währung: "${t}"`);
      }
    }
    const extra = Object.keys(pr).filter((k) => !["art", "uvpAb", "stand", "quelle", "bezeichnung", "zusatz"].includes(k));
    if (extra.length) e.push(`${where}: preis hat unbekannte Felder ${extra.join(", ")}`);
  } else {
    const hatBetrag = pr.betrag != null;
    const hatVarianten = Array.isArray(pr.varianten) && pr.varianten.length > 0;
    if (hatBetrag === hatVarianten) e.push(`${where}: verkaufspreis braucht ENTWEDER betrag ODER varianten`);
    if (hatBetrag && !betragOk(pr.betrag)) e.push(`${where}: preis.betrag (Zahl > 0, EUR) ungültig`);
    if (hatVarianten)
      pr.varianten.forEach((v, i) => {
        if (!(typeof v?.name === "string" ? v.name.trim() : isLocalized(v?.name))) e.push(`${where}: preis.varianten[${i}].name fehlt`);
        if (!betragOk(v?.betrag)) e.push(`${where}: preis.varianten[${i}].betrag (Zahl > 0) fehlt`);
        // Optionale Shop-Felder (31.10.2026, Übergabe Shop-Team): Artikelnummer, Inhalt für den
        // Grundpreis, Versandgewicht/-maße, zerbrechlich. Nur Herstellerangaben, nie schätzen.
        if (v?.sku != null && !(typeof v.sku === "string" && v.sku.trim())) e.push(`${where}: preis.varianten[${i}].sku muss Text sein`);
        // K10: optionale Varianten-ID (Slug) = id der passenden Option im Konfigurator → Warenkorb-Variante.
        if (v?.id != null && !SLUG_RE.test(String(v.id))) e.push(`${where}: preis.varianten[${i}].id muss Slug-Form haben`);
        for (const k of ["inhaltMl", "inhaltG", "versandGewichtG"]) if (v?.[k] != null && !(typeof v[k] === "number" && v[k] > 0)) e.push(`${where}: preis.varianten[${i}].${k} muss Zahl > 0 sein`);
        if (v?.versandMasseCm != null && !(Array.isArray(v.versandMasseCm) && v.versandMasseCm.length === 3 && v.versandMasseCm.every((n) => typeof n === "number" && n > 0))) e.push(`${where}: preis.varianten[${i}].versandMasseCm = [L, B, H] in cm`);
        if (v?.zerbrechlich != null && typeof v.zerbrechlich !== "boolean") e.push(`${where}: preis.varianten[${i}].zerbrechlich muss true/false sein`);
      });
    if (!/^https:\/\//.test(pr.quelle || "")) e.push(`${where}: preis.quelle (https-URL der Produktseite im Hersteller-Shop) fehlt`);
    const extra = Object.keys(pr).filter((k) => !["art", "betrag", "varianten", "stand", "quelle"].includes(k));
    if (extra.length) e.push(`${where}: preis hat unbekannte Felder ${extra.join(", ")}`);
  }
  return e;
}

/**
 * Marken, deren Preise vorerst NICHT gezeigt werden (Seite und Shop), obwohl sie
 * in den Daten stehen (K18, 31.10.2026): „inkl. 20 % MwSt.“ ist im Hersteller-Shop
 * nicht belegt. Freigabe: Eintrag löschen, sobald der Inhaber im Checkout
 * (Lieferland AT) die enthaltene MwSt. bestätigt hat.
 */
export const PREISE_PAUSIERT = Object.freeze({
  assouline: "eu.assouline.com: kein MwSt.-Hinweis; Hilfe-Center: Steuern werden ggf. im Checkout addiert; Bücher in AT 10 % statt 20 %",
  "tom-dixon": "tomdixon.net/eu: kein ausdrücklicher MwSt.-Hinweis in AGB, Lieferseite, Produktseiten und Hilfe-Center",
});

/** Datum + n Monate (YYYY-MM-DD, UTC). */
export function plusMonate(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}

/** Datum, bis zu dem ein Preis gezeigt wird (stand + Höchstalter der Art). */
export function preisGueltigBis(preis) {
  const art = PREIS_ARTEN[preis?.art];
  return art && DATE_RE.test(preis?.stand || "") ? plusMonate(preis.stand, art.maxMonate) : null;
}

/** true, wenn der Preis älter als erlaubt ist (uvp-ab 6, verkaufspreis 3 Monate; heute = YYYY-MM-DD). */
export function preisVeraltet(preis, heute) {
  const bis = preisGueltigBis(preis);
  return !bis || bis < heute;
}

/**
 * Preis, der angezeigt werden darf, sonst null: Schalter an, Struktur und
 * Bereich/Marke gültig (quelle + stand), nicht veraltet.
 * @param {object} p
 * @param {{heute: string, an?: boolean}} opts
 */
export function preisAktiv(p, { heute, an = true }) {
  if (!an || !p?.preis) return null;
  if (Object.hasOwn(PREISE_PAUSIERT, p.marke)) return null;
  if (validatePreis(p).length) return null;
  return preisVeraltet(p.preis, heute) ? null : p.preis;
}

/** Kleinster Betrag eines Preises (uvpAb, betrag oder günstigste Variante). */
export function preisAb(preis) {
  if (!preis) return null;
  if (preis.art === "uvp-ab") return preis.uvpAb;
  if (preis.betrag != null) return preis.betrag;
  return Math.min(...(preis.varianten || []).map((v) => v.betrag));
}

// ---------------------------------------------------------------------------
// Bilder, Ausführungen, Zubehör, Looks (Inhaber-Auftrag 31.10.2026: „Produkte
// konfigurierbar, starke Bilder – auch wie es im Raum wirkt“). Alle Felder
// optional (rückwärtskompatibel). Anleitung: ANLEITUNG-MARKEN.md §10.

/** Bildtypen; fehlt `typ`, gilt "freisteller". */
export const BILD_TYPEN = Object.freeze(["freisteller", "ambiente", "detail"]);
/** Typ eines Bildes (Standard "freisteller"). */
export const bildTyp = (b) => (BILD_TYPEN.includes(b?.typ) ? b.typ : "freisteller");
export const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const BILD_KEYS = new Set(["src", "width", "height", "alt", "quelleUrl", "abgerufen", "typ"]);
const OPTION_KEYS = new Set(["id", "name", "code", "farbe", "bilder", "standard", "betrag"]);
const text4OderString = (v) => (typeof v === "string" ? v.trim().length > 0 : isLocalized(v));

/** Fehlerliste eines Bild-Objekts (Ordner der Marke, Maße, Alt in 4 Sprachen, Quelle, Datum, Typ). */
export function validateBild(b, where, marke) {
  const e = [];
  if (!isObj(b)) return [`${where}: kein Bild-Objekt`];
  const m = IMG_RE.exec(b.src || "");
  if (!m) e.push(`${where}.src muss unter /Images/Wellness/produkte/<marke>/ liegen`);
  else if (marke && m[1] !== marke) e.push(`${where} liegt im Ordner "${m[1]}", nicht "${marke}"`);
  if (!(b.width > 0 && b.height > 0)) e.push(`${where} braucht width/height`);
  if (!isLocalized(b.alt)) e.push(`${where}.alt braucht de/en/fr/it`);
  if (!/^https:\/\//.test(b.quelleUrl || "")) e.push(`${where}.quelleUrl fehlt`);
  if (!DATE_RE.test(b.abgerufen || "")) e.push(`${where}.abgerufen (YYYY-MM-DD) fehlt`);
  if (b.typ != null && !BILD_TYPEN.includes(b.typ)) e.push(`${where}.typ muss ${BILD_TYPEN.join("|")} sein`);
  const extra = Object.keys(b).filter((k) => !BILD_KEYS.has(k));
  if (extra.length) e.push(`${where} hat unbekannte Felder ${extra.join(", ")}`);
  return e;
}

/** true, wenn die Marke Verkaufspreise haben darf (dann auch Preise je Option). */
export const markeDarfVerkaufspreis = (marke) => PREIS_ARTEN.verkaufspreis.nurMarken.includes(marke);

/** Fehlerliste der Ausführungen eines Produkts. */
export function validateAusfuehrungen(p, where = `Produkt ${p?.slug || "?"}`) {
  const e = [];
  const list = p.ausfuehrungen;
  if (!Array.isArray(list)) return [`${where}: ausfuehrungen muss eine Liste sein`];
  const srcs = new Set((Array.isArray(p.bilder) ? p.bilder : []).map((b) => b?.src));
  const gruppen = new Set();
  list.forEach((g, gi) => {
    const w = `${where}: ausfuehrungen[${gi}]`;
    if (!isObj(g)) return e.push(`${w} ist kein Objekt`);
    if (!text4OderString(g.gruppe)) e.push(`${w}.gruppe braucht de/en/fr/it oder einen sprachneutralen Text`);
    const gk = textOf(g.gruppe, "de").trim().toLowerCase();
    if (gk && gruppen.has(gk)) e.push(`${w}.gruppe "${gk}" doppelt`);
    gruppen.add(gk);
    const extraG = Object.keys(g).filter((k) => !["gruppe", "optionen"].includes(k));
    if (extraG.length) e.push(`${w} hat unbekannte Felder ${extraG.join(", ")}`);
    if (!Array.isArray(g.optionen) || !g.optionen.length) return e.push(`${w}.optionen fehlen (mind. 1)`);
    const ids = new Set();
    let standard = 0;
    g.optionen.forEach((o, oi) => {
      const wo = `${w}.optionen[${oi}]`;
      if (!isObj(o)) return e.push(`${wo} ist kein Objekt`);
      if (!SLUG_RE.test(o.id || "")) e.push(`${wo}.id ungültig (Slug-Form)`);
      else if (ids.has(o.id)) e.push(`${wo}.id "${o.id}" doppelt in der Gruppe`);
      ids.add(o.id);
      if (!text4OderString(o.name)) e.push(`${wo}.name braucht de/en/fr/it oder einen sprachneutralen Text`);
      if (o.code != null && !(typeof o.code === "string" && o.code.trim())) e.push(`${wo}.code muss Text sein`);
      if (o.farbe != null && !HEX_RE.test(o.farbe)) e.push(`${wo}.farbe muss "#RRGGBB" sein`);
      if (o.standard != null && typeof o.standard !== "boolean") e.push(`${wo}.standard muss true/false sein`);
      if (o.standard === true) standard++;
      if (o.betrag != null) {
        if (!markeDarfVerkaufspreis(p.marke)) e.push(`${wo}.betrag: Preise je Option nur für Marken mit Verkaufspreis (${PREIS_ARTEN.verkaufspreis.nurMarken.join(", ")})`);
        else if (!betragOk(o.betrag)) e.push(`${wo}.betrag (Zahl > 0, EUR) ungültig`);
      }
      if (o.bilder != null) {
        if (!Array.isArray(o.bilder)) e.push(`${wo}.bilder muss eine Liste sein`);
        else
          o.bilder.forEach((b, bi) => {
            if (typeof b === "string") {
              if (!srcs.has(b)) e.push(`${wo}.bilder[${bi}] "${b}" steht nicht in bilder (sonst Bild-Objekt mit Quelle angeben)`);
            } else e.push(...validateBild(b, `${wo}.bilder[${bi}]`, p.marke));
          });
      }
      const extra = Object.keys(o).filter((k) => !OPTION_KEYS.has(k));
      if (extra.length) e.push(`${wo} hat unbekannte Felder ${extra.join(", ")}`);
    });
    if (standard > 1) e.push(`${w}: standard höchstens einmal je Gruppe (${standard}×)`);
  });
  return e;
}

/** Fehlerliste des Zubehörs (Form; ob die Slugs existieren, prüft verweisFehler). */
export function validateZubehoer(p, where = `Produkt ${p?.slug || "?"}`) {
  const e = [];
  if (!Array.isArray(p.zubehoer)) return [`${where}: zubehoer muss eine Liste sein`];
  const seen = new Set();
  p.zubehoer.forEach((z, i) => {
    const w = `${where}: zubehoer[${i}]`;
    if (!isObj(z) || !SLUG_RE.test(z.slug || "")) return e.push(`${w}.slug ungültig`);
    if (z.slug === p.slug) e.push(`${w}: verweist auf sich selbst`);
    if (seen.has(z.slug)) e.push(`${w}: "${z.slug}" doppelt`);
    seen.add(z.slug);
    if (z.hinweis != null && !isLocalized(z.hinweis)) e.push(`${w}.hinweis braucht de/en/fr/it`);
    const extra = Object.keys(z).filter((k) => !["slug", "hinweis"].includes(k));
    if (extra.length) e.push(`${w} hat unbekannte Felder ${extra.join(", ")}`);
  });
  return e;
}

/** Fehlerliste der Looks einer Marke (Form; Produkt-Slugs prüft verweisFehler). */
export function validateLooks(m, slug = m?.slug) {
  const e = [];
  if (!Array.isArray(m.looks)) return [`${slug}: MARKE.looks muss eine Liste sein`];
  const ids = new Set();
  m.looks.forEach((l, i) => {
    const w = `${slug}: looks[${i}]`;
    if (!isObj(l)) return e.push(`${w} ist kein Objekt`);
    if (!SLUG_RE.test(l.id || "")) e.push(`${w}.id ungültig (Slug-Form)`);
    else if (ids.has(l.id)) e.push(`${w}.id "${l.id}" doppelt`);
    ids.add(l.id);
    if (!isLocalized(l.titel)) e.push(`${w}.titel braucht de/en/fr/it`);
    e.push(...validateBild(l.bild, `${w}.bild`, slug));
    if (!Array.isArray(l.produkte) || !l.produkte.length || !l.produkte.every((x) => SLUG_RE.test(x))) e.push(`${w}.produkte: Liste von Produkt-Slugs (mind. 1)`);
    const extra = Object.keys(l).filter((k) => !["id", "titel", "bild", "produkte"].includes(k));
    if (extra.length) e.push(`${w} hat unbekannte Felder ${extra.join(", ")}`);
    for (const t of KATALOG_LOCALES.flatMap((loc) => [l.titel?.[loc], l.bild?.alt?.[loc]]).filter(Boolean)) {
      if (DEALER_WORDS.test(t)) e.push(`${w}: Vertriebswort im Text: "${t}"`);
      if (PRICE_WORDS.test(t)) e.push(`${w}: Preiswort im Text: "${t}"`);
      if (SUPERLATIVE_WORDS.test(t)) e.push(`${w}: Superlativ im Text: "${t}"`);
    }
  });
  return e;
}

/** Alle Bild-Objekte eines Produkts (bilder + eigene Bilder der Optionen), ohne Doppelte. */
export function produktBilderAlle(p) {
  const out = [...(p.bilder || [])];
  for (const g of p.ausfuehrungen || []) for (const o of g.optionen || []) for (const b of o.bilder || []) if (isObj(b)) out.push(b);
  return [...new Map(out.map((b) => [b.src, b])).values()];
}

/**
 * Querverweise über alle Marken (zubehoer, looks → vorhandene Produkte).
 * @param {object[]} produkte  alle Produkte
 * @param {object[]} marken    alle MARKE-Objekte
 */
export function verweisFehler(produkte, marken) {
  const slugs = new Set(produkte.map((p) => p.slug));
  const e = [];
  for (const p of produkte) for (const z of p.zubehoer || []) if (!slugs.has(z.slug)) e.push(`Produkt ${p.slug}: zubehoer "${z.slug}" gibt es nicht`);
  for (const m of marken) for (const l of m.looks || []) for (const s of l.produkte || []) if (!slugs.has(s)) e.push(`${m.slug}: looks "${l.id}" → Produkt "${s}" gibt es nicht`);
  return e;
}

/** Fehlerliste eines Produkts (leer = gültig). */
export function validateProdukt(p, { marke } = {}) {
  const e = [];
  const where = `Produkt ${p?.slug || "?"}`;
  if (!isObj(p)) return [`${where}: kein Objekt`];
  if (!SLUG_RE.test(p.slug || "")) e.push(`${where}: slug ungültig`);
  if (marke && p.marke !== marke) e.push(`${where}: marke "${p.marke}" ≠ Datei "${marke}"`);
  if (!BEREICHE.includes(p.bereich)) e.push(`${where}: bereich "${p.bereich}" unbekannt`);
  if (p.welt != null) {
    if (!Object.hasOwn(WELT_BEREICHE, p.welt)) e.push(`${where}: welt "${p.welt}" unbekannt`);
    else if (!WELT_BEREICHE[p.welt].includes(p.bereich)) e.push(`${where}: bereich "${p.bereich}" passt nicht zu welt "${p.welt}"`);
  }
  if (!Object.hasOwn(KATEGORIEN, p.kategorie)) e.push(`${where}: kategorie "${p.kategorie}" unbekannt`);
  else if (!KATEGORIEN[p.kategorie].includes(p.bereich)) e.push(`${where}: kategorie "${p.kategorie}" passt nicht zu bereich "${p.bereich}"`);
  if (typeof p.name !== "string" || !p.name.trim()) e.push(`${where}: name fehlt`);
  if (!isLocalized(p.kurz)) e.push(`${where}: kurz braucht de/en/fr/it`);
  if (!Array.isArray(p.merkmale)) e.push(`${where}: merkmale muss eine Liste sein`);
  else p.merkmale.forEach((m, i) => typeof m !== "string" && !isLocalized(m) && e.push(`${where}: merkmale[${i}] braucht de/en/fr/it oder einen sprachneutralen Text`));
  if (p.masse != null) {
    if (!Array.isArray(p.masse)) e.push(`${where}: masse muss eine Liste sein`);
    else p.masse.forEach((m, i) => (!MASS_KEYS.includes(m?.key) || typeof m?.wert !== "string" || !m.wert) && e.push(`${where}: masse[${i}] ungültig`));
  }
  if (p.verwandt != null && !(Array.isArray(p.verwandt) && p.verwandt.every((x) => SLUG_RE.test(x)))) e.push(`${where}: verwandt muss eine Liste von Produkt-Slugs sein`);
  if (!Array.isArray(p.bilder)) e.push(`${where}: bilder muss eine Liste sein (leer erlaubt)`);
  else p.bilder.forEach((b, i) => e.push(...validateBild(b, `${where}: bilder[${i}]`, p.marke)));
  if (!/^https:\/\//.test(p.herstellerUrl || "")) e.push(`${where}: herstellerUrl (https) fehlt`);
  if (!Array.isArray(p.quellen) || !p.quellen.length || p.quellen.some((q) => !/^https:\/\//.test(q))) e.push(`${where}: quellen (https) fehlen`);
  if (!DATE_RE.test(p.stand || "")) e.push(`${where}: stand (YYYY-MM-DD) fehlt`);
  if ("price" in p || "offers" in p || "uvp" in p) e.push(`${where}: Preis nur im Feld preis (Nr. 26)`);
  if (p.preis != null) e.push(...validatePreis(p, where));
  if (p.ausfuehrungen != null) e.push(...validateAusfuehrungen(p, where));
  if (p.zubehoer != null) e.push(...validateZubehoer(p, where));

  // Wortregeln
  const texts = produktTexte(p);
  const healthOk = HEALTH_ALLOWED_CATEGORIES.has(p.kategorie);
  for (const t of texts) {
    if (DEALER_WORDS.test(t)) e.push(`${where}: Vertriebswort (DEALER_WORDS) im Text: "${t}"`);
    if (PRICE_WORDS.test(t)) e.push(`${where}: Preiswort im Text: "${t}"`);
    if (SUPERLATIVE_WORDS.test(t)) e.push(`${where}: Superlativ im Text: "${t}"`);
    if (!healthOk && HEALTH_WORDS.test(t)) e.push(`${where}: Heil-/Wirkversprechen im Text: "${t}"`);
  }
  return e;
}

/** Fehlerliste einer Marken-Datei ({ MARKE, PRODUKTE }). */
export function validateMarkenDatei(slug, mod) {
  const e = [];
  const m = mod?.MARKE;
  if (!isObj(m)) return [`${slug}: MARKE fehlt`];
  if (m.slug !== slug) e.push(`${slug}: MARKE.slug "${m.slug}" ≠ Dateiname`);
  if (typeof m.name !== "string" || !m.name) e.push(`${slug}: MARKE.name fehlt`);
  if (!["bad-wellness", "kuechengeraete", "accessoires"].includes(m.welt)) e.push(`${slug}: MARKE.welt ungültig`);
  if (!/^https:\/\//.test(m.herstellerUrl || "")) e.push(`${slug}: MARKE.herstellerUrl fehlt`);
  if (typeof m.dealer !== "boolean") e.push(`${slug}: MARKE.dealer (true/false) fehlt`);
  // Querverweise (Nr. 28, z. B. Riedel → Weinklima): [{ welt, kategorie }]
  if (m.querverweise != null) {
    if (!Array.isArray(m.querverweise)) e.push(`${slug}: MARKE.querverweise muss eine Liste sein`);
    else
      m.querverweise.forEach((q, i) => {
        if (!["bad-wellness", "kuechengeraete", "accessoires"].includes(q?.welt)) e.push(`${slug}: querverweise[${i}].welt ungültig`);
        if (!Object.hasOwn(KATEGORIEN, q?.kategorie)) e.push(`${slug}: querverweise[${i}].kategorie unbekannt`);
      });
  }
  if (m.looks != null) e.push(...validateLooks(m, slug));
  // K20: Link auf die Backoffice-Markenseite (interner Pfad + Textschlüssel katalog.marke.<text>)
  if (m.weitereSeite != null && !(isObj(m.weitereSeite) && /^\/[a-z0-9/-]+$/.test(m.weitereSeite.href || "") && ["weitereLeuchten", "weitereProdukte"].includes(m.weitereSeite.text))) e.push(`${slug}: MARKE.weitereSeite = { href: "/…", text: "weitereLeuchten"|"weitereProdukte" }`);
  if (!Array.isArray(mod.PRODUKTE)) e.push(`${slug}: PRODUKTE muss eine Liste sein`);
  else
    mod.PRODUKTE.forEach((p) => {
      e.push(...validateProdukt(p, { marke: slug }));
      // Ohne eigenes Feld welt gilt die Welt der Marke – dann muss der Bereich dazu passen.
      if (p?.welt == null && WELT_BEREICHE[m.welt] && !WELT_BEREICHE[m.welt].includes(p?.bereich)) e.push(`Produkt ${p?.slug || "?"}: bereich "${p?.bereich}" gehört nicht in die Welt der Marke "${m.welt}" (Feld welt setzen)`);
    });
  return e;
}
