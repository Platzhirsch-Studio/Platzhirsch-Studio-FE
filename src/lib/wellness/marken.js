// src/lib/wellness/marken.js
// Bad & Wellness (Inhaber-Entscheidungen Nr. 19, 20, 21 und 23 vom 31.10.2026,
// Marktresearch/digital/teamleiter/inhaber-entscheidungen.md).
//
//   Wellness: Starpool, Soleum, Fabio Alemanno, Aquavia Spa, Naggura
//             (Naggura NUR Objektgeschäft „Therapie- und Behandlungsräume“).
//   Bad:      Agape (bestehende Marke, eigene Markenseite), Dornbracht, antoniolupi.
//
// Händleraussage (Liefervereinbarung laut Inhaber): Starpool, Soleum, Fabio
// Alemanno, Aquavia Spa, Naggura (Nr. 19) sowie Dornbracht und antoniolupi
// (Nr. 21) → `dealer: true`. Agape: KEINE Händleraussage (`dealer: false`).
// Kein Gebietsschutz (wird nicht erwähnt). Kein Showroom-Bereich vor Sommer
// 2027 → keine Aussage, dass Produkte im Showroom stehen.
//
// Fakten nur aus den offiziellen Herstellerseiten (geprüft 31.10.2026):
//   Starpool     https://www.starpool.com (Impressum/Fußzeile: Ziano di Fiemme, Trento, Italien;
//                Produktmenü: Finnische Sauna, Dampfbad, Infrarot, Erlebnisduschen, Kneipp, Health Innovation;
//                https://www.starpool.com/products/zerobody-dry-float – ca. 400 l warmes Wasser, ohne nass zu werden;
//                https://www.starpool.com/products/zerobody-cryo, /products/wellness-coach, Ice Bath)
//   Soleum       https://www.soleum.at (SOLEUM GmbH, Gutauerstraße 42, 4230 Pregarten, Österreich;
//                https://www.soleum.at/infrarotliegen_und_wellnessliegen_produzent/ – Flying Carpet
//                „geflieste Infrarotliege … findet Ihren Platz auch in Wohnräumen“, Glasmosaik (SICIS bei
//                LAGOON), Mikrozement, Handarbeit in der Manufaktur; Dampfbadbau)
//                NICHT auf der Herstellerseite gefunden: „30–45 °C“, „Plug & Play“ → nicht verwendet.
//   Fabio A.     https://www.fa-design.co.uk („Italian Craftsmanship“, beheizte Marmorliegen CLEOPATRA,
//                DIVA, Daybed, Hammam-Tisch; Kundenstimme/Bildtext zu Kreuzfahrtschiffen). Firmensitz der
//                Vertriebsgesellschaft: Bedford, UK → Seite sagt „italienisches Design“, kein Land als Sitz.
//                Bänke: auf der Herstellerseite nicht gefunden → nicht genannt.
//   Aquavia Spa  https://aquaviaspa.com/en/ (Cervera, Lleida, Spanien; Whirlpools innen/außen, Einbau,
//                Überlauf, Swimspas, Cold Plunge/Eisbad, „Tiled“-Modelle mit Mosaik)
//   Naggura      https://www.naggura.com/es-en/ („Naggura is a registered trademark of Weelko Barcelona S.L.“;
//                elektrische und hydraulische Behandlungsliegen, Möbel für Behandlungsraum und Empfang)
//   Agape        https://www.agapedesign.it/en/ (Mantua, Italien; seit 1973; Waschtische, Wannen,
//                Armaturen, Duschen, Badmöbel, Spiegel, Leuchten)
//   Dornbracht   https://www.dornbracht.com/de-de/ und /de-de/impressum (Dornbracht GmbH & Co. KG,
//                Iserlohn; „Design-Armaturen für Bad, Küche und Spa“, Duschen, Wasch- und Spülbecken)
//   antoniolupi  https://www.antoniolupi.it/en/ (Schreibweise klein; Produktbereiche Waschtische,
//                Wannen, Möbel, Spiegel und Leuchten laut Produktmenü /en/products/…; Land: Italien)
//
// Bilder: Herstellerbilder (Händler-Freigabe Nr. 19/21) UNVERÄNDERT (kein
// Beschnitt, kein Filter; nur verkleinert/neu kodiert), Quelle je Bild in
// docs/bildquellen/QUELLEN.md. Agape: Bild freigegeben (Nr. 23), aber
// weiterhin OHNE Händleraussage. Dornbracht: zweites Motiv in moreImages.
// antoniolupi: Bild freigegeben (Nr. 23), Slot aber leer (die Herstellerseite
// liefert Bilder nur per Skript, nicht als Datei) – Bildpaket vom Hersteller nötig.
//
// Rein und ohne "@/..."-Importe (node --test, tests/unit/bad-wellness.test.mjs).

/** Pfad der Seite ohne Locale; in allen vier Sprachen gleich (keine Pfad-Übersetzung). */
export const BAD_WELLNESS_PATH = "/bad-wellness";
export const BAD_WELLNESS_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

/** Thema für den Beratungsweg (?thema=wellness; Übergabe: TOPICS in beratungContext.js). */
export const WELLNESS_THEMA = "wellness";
export const BAD_THEMA = "bad";

const img = (src, width, height, source) => Object.freeze({ src, width, height, source });

/** Bad – das tägliche Ritual. */
export const BAD_MARKEN = Object.freeze([
  Object.freeze({
    id: "agape",
    name: "Agape",
    area: "bad",
    origin: "IT",
    dealer: false,
    groups: Object.freeze(["waschtische", "wannen", "armaturen", "badmoebel", "spiegel"]),
    brandPage: "/ueber-uns/marken/agape",
    image: img("/Images/Wellness/agape-vieques.webp", 1105, 1600, "https://www.agapedesign.it/en/"),
  }),
  Object.freeze({
    id: "dornbracht",
    name: "Dornbracht",
    area: "bad",
    origin: "DE",
    dealer: true,
    groups: Object.freeze(["armaturenBad", "duschsysteme", "armaturenKueche"]),
    image: img("/Images/Wellness/dornbracht-tara.webp", 1235, 1600, "https://www.dornbracht.com/de-de/"),
    // Zweites Motiv (Spa-Serie Aquahalo); Alt-Text-Schlüssel alt.dornbracht2.
    moreImages: Object.freeze([img("/Images/Wellness/dornbracht-aquahalo.webp", 1600, 1199, "https://www.dornbracht.com/de-de/")]),
  }),
  Object.freeze({
    id: "antoniolupi",
    name: "antoniolupi",
    area: "bad",
    origin: "IT",
    dealer: true,
    groups: Object.freeze(["waschtische", "wannen", "badmoebel", "spiegel", "leuchten"]),
    image: img("/Images/Wellness/antoniolupi-ilbagno.webp", 1600, 788, "https://www.antoniolupi.it/en/collections"),
  }),
]);

/** Wellness & Spa. */
export const WELLNESS_MARKEN = Object.freeze([
  Object.freeze({
    id: "starpool",
    name: "Starpool",
    area: "wellness",
    origin: "IT",
    dealer: true,
    groups: Object.freeze(["saunen", "dampfbaeder", "erlebnisduschen", "healthInnovation"]),
    image: img("/Images/Wellness/starpool-zerobody-dry-float.webp", 1600, 768, "https://www.starpool.com/products/zerobody-dry-float"),
  }),
  Object.freeze({
    id: "soleum",
    name: "Soleum",
    area: "wellness",
    origin: "AT",
    dealer: true,
    groups: Object.freeze(["waermeliegen", "dampfbaeder"]),
    image: img("/Images/Wellness/soleum-flying-carpet.webp", 1600, 715, "https://www.soleum.at/infrarotliegen_und_wellnessliegen_produzent/"),
  }),
  Object.freeze({
    id: "fabio-alemanno",
    name: "Fabio Alemanno",
    area: "wellness",
    origin: "IT",
    originIsDesign: true,
    dealer: true,
    groups: Object.freeze(["beheizteLiegen", "hammam"]),
    // QM R1: Das DIVA-Bild trug eingebrannte Slider-Bedienelemente der Herstellerseite (Pfeil,
    // Pager-Punkte) und weiße Randstreifen. Stattdessen das Raumbild CLEOPATRA Classico aus dem
    // Katalog (unverändert, 4:3, Quelle docs/bildquellen/QUELLEN.md); eigener Alt-Text je Sprache,
    // weil der Messages-Text das DIVA-Motiv beschreibt.
    image: Object.freeze({
      ...img("/Images/Wellness/produkte/fabio-alemanno/fabio-alemanno-cleopatra-classico-3.webp", 1600, 1200, "https://www.fa-design.co.uk/cleopatra-classico-heated-lounger"),
      alt: Object.freeze({
        de: "Fabio Alemanno CLEOPATRA Classico: zwei Liegen in Ivoire mit Armlehnen in einem Wohnzimmer, dazwischen ein Beistelltisch",
        en: "Fabio Alemanno CLEOPATRA Classico: two Ivoire loungers with armrests in a living room, a side table between them",
        fr: "Fabio Alemanno CLEOPATRA Classico: deux méridiennes Ivoire avec accoudoirs dans un salon, une table d’appoint entre elles",
        it: "Fabio Alemanno CLEOPATRA Classico: due lettini Ivoire con braccioli in un soggiorno, tra loro un tavolino",
      }),
    }),
  }),
  Object.freeze({
    id: "aquavia-spa",
    name: "Aquavia Spa",
    area: "wellness",
    origin: "ES",
    dealer: true,
    groups: Object.freeze(["whirlpools", "swimspas", "coldPlunge", "mosaikModelle"]),
    image: img("/Images/Wellness/aquavia-capri.webp", 700, 700, "https://aquaviaspa.com/en/"),
  }),
  Object.freeze({
    id: "naggura",
    name: "Naggura",
    area: "wellness",
    origin: "ES",
    dealer: true,
    objektOnly: true,
    groups: Object.freeze(["behandlungsliegen", "behandlungsraumMoebel"]),
    image: img("/Images/Wellness/naggura-nuuna-behandlungsraum.webp", 1600, 893, "https://www.naggura.com/es-en/"),
  }),
]);

export const ALLE_MARKEN = Object.freeze([...BAD_MARKEN, ...WELLNESS_MARKEN]);

/** Marken mit Händleraussage auf dieser Seite (Inhaber Nr. 19 + 21). */
export const DEALER_MARKEN = Object.freeze(ALLE_MARKEN.filter((m) => m.dealer).map((m) => m.name));

/** Bild im Auftakt (LCP): Starpool, Finnische Sauna. */
export const HERO_IMAGE = img("/Images/Wellness/starpool-finnische-sauna.webp", 1275, 810, "https://www.starpool.com/en/");

/** Einstieg nach Wunsch: Szenario → Marken (IDs) und Beratungs-Thema. */
export const SZENARIEN = Object.freeze([
  Object.freeze({ id: "bad", marken: Object.freeze(["agape", "dornbracht", "antoniolupi"]), thema: BAD_THEMA }),
  Object.freeze({ id: "privateSpa", marken: Object.freeze(["starpool", "soleum", "aquavia-spa"]), thema: WELLNESS_THEMA }),
  Object.freeze({ id: "wohnraum", marken: Object.freeze(["soleum", "fabio-alemanno"]), thema: WELLNESS_THEMA }),
  Object.freeze({ id: "garten", marken: Object.freeze(["aquavia-spa"]), thema: `${WELLNESS_THEMA},outdoor` }),
  Object.freeze({ id: "objekt", marken: Object.freeze(["starpool", "fabio-alemanno", "aquavia-spa", "soleum"]), thema: `${WELLNESS_THEMA},hotel` }),
  Object.freeze({ id: "therapie", marken: Object.freeze(["naggura"]), thema: `${WELLNESS_THEMA},objekt` }),
]);

export function markeById(id) {
  return ALLE_MARKEN.find((m) => m.id === id) || null;
}

/** Anker-ID einer Marke auf der Seite (#marke-aquavia-spa). */
export function markeAnchor(id) {
  return `marke-${id}`;
}

/** Schlüssel der Messages ohne Bindestrich (next-intl-Pfade): "aquavia-spa" → "aquaviaspa". */
export function markeKey(id) {
  return String(id).replace(/-/g, "");
}

/** Kontext für den Beratungsweg (withContext, src/lib/forms/pathContext.js). */
export function beratungContext(marke, thema) {
  const t = thema || (marke ? (marke.area === "bad" ? BAD_THEMA : marke.objektOnly ? `${WELLNESS_THEMA},objekt` : WELLNESS_THEMA) : `${BAD_THEMA},${WELLNESS_THEMA}`);
  return marke ? { thema: t, produkt: marke.name } : { thema: t };
}
