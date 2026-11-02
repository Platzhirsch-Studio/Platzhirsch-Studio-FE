// src/lib/katalog/marken/flos.js – Flos
// Inhaber-Entscheidung Nr. 32 (31.10.2026): NUR tragbare Akku-Leuchten (das übrige Flos-Sortiment kommt aus dem Backoffice-Katalog).
// Welt "accessoires", bereich "accessoires". Kategorien: tragbare-leuchte.
//
// Quelle der Produktliste: offizieller Flos-Onlineshop Österreich https://flos.com/de/at/ –
// Kategorie „Tragbarer Leuchten“ (https://flos.com/de/at/shop-nach-produkten/tragbarer-leuchten/,
// nennt die Serien In Vitro Unplugged, Bon Jour Unplugged, Bellhop Unplugged, Last Order, Gustave) und
// Produkt-Sitemap des Shops (robots.txt → sitemap_index.xml → sitemap-0-product.xml, Einträge /de/at/).
// Vollständigkeits-Check: qa-screenshots/wellness/produkte/vollstaendigkeit-flos.md.
//
// Preise: preis.art "verkaufspreis" (Nr. 32) = Endpreis des Flos-Shops Österreich je Variante (EUR),
// Stand 31.10.2026, quelle = Produktseite. Die Produktseite selbst nennt kein „inkl. MwSt.“; laut AGB
// des Shops (https://flos.com/de/at/terms.html, Abschnitt 6) verstehen sich die Preise einschließlich
// der geltenden Mehrwertsteuer. Variantenpreise aus den Varianten-URLs der Produktseite
// (…html?dwvar_<pid>_color=…, so setzt sie die Seite beim Klick auf ein Farbfeld).
// Optionale Variantenfelder: sku = „Artikelcode“ der Variante (bei Bon Jour Unplugged der Code des
// Angebots, z. B. B-bonjour-unplugged-white-yellow), zerbrechlich = true nur bei Last Order Fluted
// (Sockel aus Glas/Kristall laut Produktseite). Versandgewicht/-maße nennt der Shop nicht
// (das Feld „Gewicht“ ist das Produktgewicht → als Maß „gewicht“).
//
// Bewusst NICHT übernommen: Herstellertexte/Werbeaussagen; Ersatzteile (Bellhop TW Battery pack,
// Last-Order-Abdeckungen, Bon-Jour-Kronen einzeln); Last Order Clear (Shop: „Eingestellt“, nicht
// lieferbar); Lieferzeiten.
// Bilder: Originaldateien der Produktgalerien (flos.com/on/demandware.static/…), Motiv unverändert;
// einheitlich ≤ 1600 px lange Kante, WebP q82 (tools/images/optimize-katalog.mjs).
// Anleitung: qa-screenshots/wellness/produkte/ANLEITUNG-MARKEN.md
// Prüfen:    node --test tests/unit/wellness-produkte.test.mjs

const STAND = "2026-10-31";
const T = (de, en, fr, it) => Object.freeze({ de, en, fr, it });
const mass = (key, wert) => Object.freeze({ key, wert });
const SHOP = "https://flos.com/de/at/";
const AGB = `${SHOP}terms.html`;
const PORTABLE = `${SHOP}shop-nach-produkten/tragbarer-leuchten/`;

// Bild-Tabelle: Schlüssel → [Datei, Breite, Höhe, Original-URL]
const IMG = {
  "bellhop-1": ["flos-bellhop-unplugged-1-opt.webp", 640, 800, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw7d7d84e0/images/packshot/DECORATIVE/DECORATIVE_PORTABLE_BELLHOP/F1130039/Flos-Pim-Image-Luminaire-Portable-Bellhop-Glossy_Green.jpg"],
  "bellhop-2": ["flos-bellhop-unplugged-2.webp", 1600, 1200, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw501cbc07/images/lifeshot/Bellhop%20UNplugged%202026/life_bellhop_unplugged_all.jpg"],
  "bellhop-3": ["flos-bellhop-unplugged-3.webp", 1600, 1600, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw6a8ae6cb/images/square_lifestyle/bellhop/g_bellhop_unplugged_green.jpg"],
  "bellhop-4": ["flos-bellhop-unplugged-4-opt.webp", 640, 800, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw5a6135a1/images/packshot/DECORATIVE/DECORATIVE_PORTABLE_BELLHOP/F1130009/Flos-Pim-Image-Luminaire-Portable-Bellhop-White.jpg"],
  "bellhop-5": ["flos-bellhop-unplugged-5-opt.webp", 640, 800, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw7fc0f5fb/images/packshot/DECORATIVE/DECORATIVE_PORTABLE_BELLHOP/F1130014/Flos-Pim-Image-Luminaire-Portable-Bellhop-Grey_Blue.jpg"],
  "bellhop-6": ["flos-bellhop-unplugged-6-opt.webp", 640, 800, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw8e9f1c45/images/packshot/DECORATIVE/DECORATIVE_PORTABLE_BELLHOP/F1130075/Flos-Pim-Image-Luminaire-Portable-Bellhop-Brick_Red.jpg"],
  "bellhop-7": ["flos-bellhop-unplugged-7-opt.webp", 640, 800, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw312e61a2/images/packshot/DECORATIVE/DECORATIVE_PORTABLE_BELLHOP/F1130030/Flos-Pim-Image-Luminaire-Portable-Bellhop-Glossy_Black.jpg"],
  "bellhop-8": ["flos-bellhop-unplugged-8-opt.webp", 640, 800, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw83af6ee1/images/packshot/DECORATIVE/DECORATIVE_PORTABLE_BELLHOP/F1130019/Flos-Pim-Image-Luminaire-Portable-Bellhop-Yellow.jpg"],
  "bellhop2018-1": ["flos-bellhop-unplugged-ed-2018-1-opt.webp", 640, 800, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw8d79c8e4/images/packshot/DECORATIVE/DECORATIVE_PORTABLE_BELLHOP/F1060020/Flos-Pim-Image-Luminaire-Portable-Bellhop_2018-Grey.jpg"],
  "bellhop2018-2": ["flos-bellhop-unplugged-ed-2018-2.webp", 1024, 768, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw1278caf7/images/lifeshot/F10600/lifestyle_bellhoptable_grey_03.jpg"],
  "bonjour-1": ["flos-bon-jour-unplugged-1-opt.webp", 640, 800, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw5ae38491/images/packshot/DECORATIVE/DECORATIVE_TABLE_BON-JOUR-UNPLUGGED/F1037009/bon-jour-unplugged-table-starck-flos-F1037009-product-still-life-big.jpg"],
  "bonjour-2": ["flos-bon-jour-unplugged-2.webp", 1024, 768, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw83025daf/images/lifeshot/F10370/Desktop/life_bonjour_white_no_crown.jpg"],
  "bonjour-3": ["flos-bon-jour-unplugged-3-opt.webp", 640, 800, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw3b45d987/images/packshot/DECORATIVE/DECORATIVE_TABLE_BON-JOUR-UNPLUGGED/F1037057/bon-jour-unplugged-table-starck-flos-F1037057-product-still-life-big.jpg"],
  "bonjour-4": ["flos-bon-jour-unplugged-4-opt.webp", 1090, 1362, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw8e146cad/images/lifeshot/F10370/Desktop/still_bonjour_unplug_white_yellow.png"],
  "bonjour-5": ["flos-bon-jour-unplugged-5-opt.webp", 1082, 1352, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw031af355/images/lifeshot/F10370/Desktop/still_bonjour_unplug_chrome_yellow.jpg"],
  "invitro-1": ["flos-in-vitro-unplugged-1-opt.webp", 1194, 1492, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw6692cacc/images/packshot/OUTDOOR/OUTDOOR_TABLE_IN-VITRO/F018E31KU25/FLOS-IN-VITRO-UNPLUGGED-TERRACOTTA-1950X1950.JPG"],
  "invitro-2": ["flos-in-vitro-unplugged-2.webp", 1600, 1600, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dwed1057af/images/square_lifestyle/in%20vitro%20unplugged/g_invitro_unpl_terracotta.jpg"],
  "invitro-3": ["flos-in-vitro-unplugged-3-opt.webp", 1193, 1491, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw6ba214e8/images/packshot/OUTDOOR/OUTDOOR_TABLE_IN-VITRO/F018E31KU30/FLOS-IN-VITRO-UNPLUGGED-BLACK-1950X1950.JPG"],
  "invitro-4": ["flos-in-vitro-unplugged-4-opt.webp", 1193, 1491, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw6e743de5/images/packshot/OUTDOOR/OUTDOOR_TABLE_IN-VITRO/F018E31KU01/FLOS-IN-VITRO-UNPLUGGED-WHITE-1950X1950.JPG"],
  "invitro-5": ["flos-in-vitro-unplugged-5-opt.webp", 1193, 1491, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dwc12be9f2/images/packshot/OUTDOOR/OUTDOOR_TABLE_IN-VITRO/F018E31KU33/FLOS-IN-VITRO-UNPLUGGED-ANTHRACITE-1950X1950.JPG"],
  "invitro-6": ["flos-in-vitro-unplugged-6-opt.webp", 1193, 1491, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw2d8cc0e5/images/packshot/OUTDOOR/OUTDOOR_TABLE_IN-VITRO/F018E31KU12/FLOS-IN-VITRO-UNPLUGGED-FOREST-GREEN-1950X1950.JPG"],
  "invitro-7": ["flos-in-vitro-unplugged-7-opt.webp", 1193, 1491, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw251ce5f1/images/packshot/OUTDOOR/OUTDOOR_TABLE_IN-VITRO/F018E31KU13/FLOS-IN-VITRO-UNPLUGGED-PALE-GREEN-1950X1950.JPG"],
  "invitro-8": ["flos-in-vitro-unplugged-8-opt.webp", 1193, 1491, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw27546ca2/images/packshot/OUTDOOR/OUTDOOR_TABLE_IN-VITRO/F018E31KU18/FLOS-IN-VITRO-UNPLUGGED-DEEP-BROWN-1950X1950.JPG"],
  "lastorder-1": ["flos-last-order-fluted-1-opt.webp", 932, 1166, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw1966e1c8/images/packshot/DECORATIVE/DECORATIVE_TABLE_LAST-ORDER/F3694015/Last-order-fluted-table-anastassiades-flos-F3694015-product-still-life-big.jpg"],
  "lastorder-2": ["flos-last-order-fluted-2.webp", 1600, 1200, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw42ad108d/images/lifeshot/F36940/Desktop/last-order-fluted-satin-copper-table-anastassiades-flos-01.jpg"],
  "lastorder-3": ["flos-last-order-fluted-3.webp", 1600, 1600, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dwac9bb5db/images/packshot/DECORATIVE/DECORATIVE_PORTABLE_LAST-ORDER/F3694059/Flos-Pim-Image-Luminaire-Table-Last_Order-Fluted-Polished_Brass.jpg"],
  "gustave-1": ["flos-gustave-residential-1-opt.webp", 1237, 1546, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw7c569b3f/images/packshot/ARCHITECTURAL/ARCHITECTURAL_PORTABLE_GUSTAVE/09.8406.GX/Flos-Gustave-Lacquered_Green-1950x1950.jpg"],
  "gustave-2": ["flos-gustave-residential-2.webp", 1280, 1024, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw4afdedae/images/lifeshot/098406FM/gustave_6.png"],
  "gustave-3": ["flos-gustave-residential-3-opt.webp", 1231, 1539, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw7033bafc/images/packshot/ARCHITECTURAL/ARCHITECTURAL_PORTABLE_GUSTAVE/09.8405.DR/Flos-Gustave-Matte_Anthracite-1950x1950.jpg"],
  "gustave-4": ["flos-gustave-residential-4-opt.webp", 1229, 1536, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw73cb64fd/images/packshot/ARCHITECTURAL/ARCHITECTURAL_PORTABLE_GUSTAVE/09.8405.DY/Flos-Gustave-Matte_White-1950x1950.jpg"],
  "gustave-5": ["flos-gustave-residential-5-opt.webp", 1233, 1541, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw2d622cbd/images/packshot/ARCHITECTURAL/ARCHITECTURAL_PORTABLE_GUSTAVE/09.8405.05/Flos-Gustave-Polished_Silver-1950x1950.jpg"],
  "gustave-6": ["flos-gustave-residential-6-opt.webp", 1233, 1541, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw901d9823/images/packshot/ARCHITECTURAL/ARCHITECTURAL_PORTABLE_GUSTAVE/09.8405.MR/Flos-Gustave-Lacquered_Brown-1950x1950.jpg"],
  "gustave-7": ["flos-gustave-residential-7-opt.webp", 1232, 1540, "https://flos.com/on/demandware.static/-/Sites-FLOS-master/default/dw36142bd8/images/packshot/ARCHITECTURAL/ARCHITECTURAL_PORTABLE_GUSTAVE/09.8405.VL/Flos-Gustave-Raw_Aluminium-1950x1950.jpg"],
};

const src = (key) => `/Images/Wellness/produkte/flos/${IMG[key][0]}`;
/** Bild-Objekt; typ "freisteller" (Standard) | "ambiente" | "detail". */
function bild(key, alt, typ) {
  const [, width, height, quelleUrl] = IMG[key];
  return Object.freeze({ src: src(key), width, height, alt, quelleUrl, abgerufen: STAND, ...(typ && typ !== "freisteller" ? { typ } : {}) });
}
/** Alt-Text eines Freistellers in einer Farbe. */
const altF = (name, farbe) =>
  T(
    `Flos ${name} in ${farbe} – Produktfoto des Herstellers vor hellem Hintergrund`,
    `Flos ${name} in ${farbe} – manufacturer's product photo on a light background`,
    `Flos ${name} coloris ${farbe} – photo produit du fabricant sur fond clair`,
    `Flos ${name} in ${farbe} – foto prodotto del produttore su sfondo chiaro`
  );
const alt = (name, de, en, fr, it) => T(`Flos ${name} – ${de}`, `Flos ${name} – ${en}`, `Flos ${name} – ${fr}`, `Flos ${name} – ${it}`);

const FARBE = T("Farbe", "Colour", "Couleur", "Colore");
const KRONE = T("Krone", "Crown", "Couronne", "Corona");
const CCT = T("Farbtemperatur", "Colour temperature", "Température de couleur", "Temperatura di colore");

// ---------------------------------------------------------------- Vokabular (Merkmale)
const M = {
  usbc: T("Akku, aufladbar über USB-C", "Rechargeable battery, charged via USB-C", "Batterie rechargeable par USB-C", "Batteria ricaricabile tramite USB-C"),
  kabelInkl: T("Ladekabel im Lieferumfang", "Charging cable included", "Câble de charge fourni", "Cavo di ricarica incluso"),
  kabelOhne: T("Ladekabel nicht im Lieferumfang", "Charging cable not included", "Câble de charge non fourni", "Cavo di ricarica non incluso"),
  liIon: T("Akkutyp Li-Ion", "Battery type Li-ion", "Type de batterie Li-ion", "Tipo di batteria Li-ion"),
  liPo: T("Akkutyp Li-Po", "Battery type Li-Po", "Type de batterie Li-Po", "Tipo di batteria Li-Po"),
  dimm4: T("Vierstufig dimmbar", "Four-step dimming", "Variation d'intensité en quatre niveaux", "Dimmerabile in quattro livelli"),
  anzeige: T("Akkustandsanzeige im Sockel", "Battery level indicator in the base", "Indicateur de charge dans le socle", "Indicatore di carica nella base"),
  led: T("LED-Modul, Lichtquelle nicht vom Endnutzer austauschbar", "LED module, light source not replaceable by the end user", "Module LED, source lumineuse non remplaçable par l'utilisateur", "Modulo LED, sorgente luminosa non sostituibile dall'utente"),
};
const ip = (n) => `IP${n}`;
const watt = (w) => `${w} W`;
const kelvin = (k) => `${k} K`;
const laufzeit = (de, en, fr, it) => T(`Betriebsdauer ${de}`, `Operating time ${en}`, `Autonomie ${fr}`, `Autonomia ${it}`);

/** Produkt aus einer Datenzeile. */
function produkt(r) {
  return Object.freeze({
    slug: `flos-${r.s}`,
    marke: "flos",
    bereich: "accessoires",
    kategorie: "tragbare-leuchte",
    name: r.n,
    kurz: r.kurz,
    merkmale: Object.freeze(r.m),
    masse: Object.freeze(r.masse),
    designer: r.designer,
    bilder: Object.freeze(r.bilder),
    herstellerUrl: r.url,
    quellen: Object.freeze([...new Set([r.url, ...(r.q || []), PORTABLE, AGB])]),
    stand: STAND,
    ...(r.verwandt ? { verwandt: Object.freeze(r.verwandt) } : {}),
    preis: Object.freeze({
      art: "verkaufspreis",
      varianten: Object.freeze(r.v.map(([name, betrag, sku, extra]) => Object.freeze({ name, betrag, sku, ...(extra || {}) }))),
      stand: STAND,
      quelle: r.url,
    }),
    ausfuehrungen: Object.freeze(r.aus.map((g) => Object.freeze({ gruppe: g.gruppe, optionen: Object.freeze(g.optionen.map((o) => Object.freeze(o))) }))),
  });
}

// ---------------------------------------------------------------- Produkte
const BELLHOP = "Bellhop Unplugged";
const BELLHOP_URL = `${SHOP}bellhop-unplugged/M-bellhop-unplugged.html`;
const BELLHOP_FARBEN = [
  // [id, Farbe laut Produktseite, Artikelcode, Bild]
  ["glossy-green", "Glossy Green", "F1130039", "bellhop-1"],
  ["white", "White", "F1130009", "bellhop-4"],
  ["grey-blue", "Grey Blue", "F1130014", "bellhop-5"],
  ["brick-red", "Brick Red", "F1130075", "bellhop-6"],
  ["glossy-black", "Glossy Black", "F1130030", "bellhop-7"],
  ["yellow", "Yellow", "F1130019", "bellhop-8"],
];

const IV = "In Vitro Unplugged";
const IV_URL = `${SHOP}in-vitro-unplugged/M-in-vitro-unplugged.html`;
const IV_FARBEN = [
  // [id, Farbe, Code 2700 K, Code 3000 K, Bild]
  ["terracotta", "Terracotta", "F018E21K025", "F018E31K025", "invitro-1"],
  ["black", "Black", "F018E21K030", "F018E31K030", "invitro-3"],
  ["white", "White", "F018E21K001", "F018E31K001", "invitro-4"],
  ["anthracite", "Anthracite", "F018E21K033", "F018E31K033", "invitro-5"],
  ["forest-green", "Forest Green", "F018E21K012", "F018E31K012", "invitro-6"],
  ["pale-green", "Pale Green", "F018E21K013", "F018E31K013", "invitro-7"],
  ["deep-brown", "Deep Brown", "F018E21K018", "F018E31K018", "invitro-8"],
];

const GUSTAVE = "Gustave Residential";
const GUSTAVE_URL = `${SHOP}gustave-residential/M-gustave.html`;
const GUSTAVE_FARBEN = [
  // [id, Farbe, Artikelcode, Preis, Bild]
  ["lacquered-green", "Lacquered Green", "09.8405.GX", 423, "gustave-1"],
  ["matte-anthracite", "Matte Anthracite", "09.8405.DR", 357, "gustave-3"],
  ["matte-white", "Matte White", "09.8405.DY", 357, "gustave-4"],
  ["polished-silver", "Polished Silver", "09.8405.05", 423, "gustave-5"],
  ["lacquered-brown", "Lacquered Brown", "09.8405.MR", 423, "gustave-6"],
  ["raw-aluminium", "Raw Aluminium", "09.8405.VL", 423, "gustave-7"],
];

const BJ = "Bon Jour Unplugged";
const BJ_URL = `${SHOP}bon-jour-unplugged/M-bonjour-unplugged.html`;
const BJ_WY = `${SHOP}bon-jour-unplugged/B-bonjour-unplugged-white-yellow.html`;
const BJ_CY = `${SHOP}bon-jour-unplugged/B-bonjour-unplugged-chrome-yellow.html`;
const BJ_WT = `${SHOP}colour_white/B-bonjour-unplugged-white-transparent.html`;
const ohneKrone = (f) => T(`${f}, ohne Krone`, `${f}, without crown`, `${f}, sans couronne`, `${f}, senza corona`);
const mitKrone = (f, k) => T(`${f}, mit Krone ${k}`, `${f}, with ${k} crown`, `${f}, avec couronne ${k}`, `${f}, con corona ${k}`);

const LO = "Last Order Fluted";
const LO_URL = `${SHOP}last-order-fluted/M-last-order-fluted.html`;

const B18 = "Bellhop Unplugged Ed. 2018";
const B18_URL = `${SHOP}bellhop-unplugged-ed.-2018/M-bellhop.html`;

const ZEILEN = [
  {
    s: "bellhop-unplugged", n: BELLHOP, designer: "Edward Barber & Jay Osgerby", url: BELLHOP_URL,
    kurz: T(
      "Tragbare Tischleuchte mit glockenförmigem Schirm aus Polycarbonat, entworfen von Edward Barber und Jay Osgerby. Der Akku reicht laut Flos bis zu 24 Stunden, drei Farbtemperaturen sind wählbar, Schutzart IP54.",
      "Portable table lamp with a bell-shaped polycarbonate shade, designed by Edward Barber and Jay Osgerby. According to Flos the battery lasts up to 24 hours; three colour temperatures can be selected, protection class IP54.",
      "Lampe de table portable à abat-jour en forme de cloche en polycarbonate, dessinée par Edward Barber et Jay Osgerby. Selon Flos, la batterie tient jusqu'à 24 heures ; trois températures de couleur au choix, indice de protection IP54.",
      "Lampada da tavolo portatile con diffusore a campana in policarbonato, disegnata da Edward Barber e Jay Osgerby. Secondo Flos la batteria dura fino a 24 ore; tre temperature di colore selezionabili, grado di protezione IP54."
    ),
    m: [
      laufzeit("bis zu 24 Stunden", "up to 24 hours", "jusqu'à 24 heures", "fino a 24 ore"),
      M.usbc, M.kabelInkl, M.liIon, M.dimm4,
      T("Drei Farbtemperaturen wählbar: 2200, 2700 und 3000 K", "Three selectable colour temperatures: 2200, 2700 and 3000 K", "Trois températures de couleur au choix : 2200, 2700 et 3000 K", "Tre temperature di colore selezionabili: 2200, 2700 e 3000 K"),
      M.anzeige,
      T("Schutzart IP54, laut Flos für den Einsatz im Außenbereich", "Protection class IP54, suitable for outdoor use according to Flos", "Indice de protection IP54, utilisable en extérieur selon Flos", "Grado di protezione IP54, adatta all'esterno secondo Flos"),
      T("Sockel und Schirm aus Polycarbonat", "Base and shade made of polycarbonate", "Socle et abat-jour en polycarbonate", "Base e diffusore in policarbonato"),
      watt(2), M.led,
    ],
    masse: [mass("hoehe", "210 mm"), mass("breite", "125 mm"), mass("laenge", "125 mm"), mass("gewicht", "0,75 kg")],
    bilder: [
      bild("bellhop-1", altF(BELLHOP, "Glossy Green")),
      bild("bellhop-2", alt(BELLHOP, "alle sechs Farben nebeneinander vor hellem Hintergrund", "all six colours side by side on a light background", "les six coloris côte à côte sur fond clair", "tutti e sei i colori affiancati su sfondo chiaro")),
      bild("bellhop-3", alt(BELLHOP, "Glossy Green auf einem gedeckten Tisch im Freien in der Abenddämmerung", "Glossy Green on a laid table outdoors at dusk", "Glossy Green sur une table dressée en extérieur au crépuscule", "Glossy Green su una tavola apparecchiata all'aperto al tramonto"), "ambiente"),
    ],
    v: BELLHOP_FARBEN.map(([, f, code]) => [f, 210, code]),
    aus: [{ gruppe: FARBE, optionen: BELLHOP_FARBEN.map(([id, f, code, img], i) => ({ id, name: f, code, bilder: [img === "bellhop-1" ? src(img) : bild(img, altF(BELLHOP, f))], ...(i === 0 ? { standard: true } : {}) })) }],
    verwandt: ["flos-bellhop-unplugged-ed-2018", "flos-gustave-residential"],
  },
  {
    s: "bellhop-unplugged-ed-2018", n: B18, designer: "Edward Barber & Jay Osgerby", url: B18_URL,
    kurz: T(
      "Erste Ausführung der akkubetriebenen Bellhop von 2018 in Grau, mit Schirm und Sockel aus Polycarbonat. Laut Flos bis zu 24 Stunden Betriebsdauer, vierstufig dimmbar, warmweißes Licht mit 2700 K.",
      "The first edition of the battery-powered Bellhop from 2018 in grey, with polycarbonate shade and base. According to Flos up to 24 hours of operating time, four-step dimming, warm white light at 2700 K.",
      "Première édition de la Bellhop sur batterie de 2018, en gris, avec abat-jour et socle en polycarbonate. Selon Flos, jusqu'à 24 heures d'autonomie, variation en quatre niveaux, lumière blanc chaud de 2700 K.",
      "Prima edizione della Bellhop a batteria del 2018 in grigio, con diffusore e base in policarbonato. Secondo Flos fino a 24 ore di autonomia, dimmerabile in quattro livelli, luce bianca calda a 2700 K."
    ),
    m: [
      laufzeit("bis zu 24 Stunden", "up to 24 hours", "jusqu'à 24 heures", "fino a 24 ore"),
      M.usbc, M.kabelInkl, M.liPo,
      T("Ladezeit 3 Stunden (0–100 %)", "Charging time 3 hours (0–100%)", "Temps de charge 3 heures (0–100 %)", "Tempo di ricarica 3 ore (0–100%)"),
      M.dimm4, M.anzeige, kelvin(2700), ip(20), watt(3),
      T("Material: Polycarbonat", "Material: polycarbonate", "Matériau : polycarbonate", "Materiale: policarbonato"),
    ],
    masse: [mass("hoehe", "210 mm"), mass("laenge", "125 mm"), mass("gewicht", "0,75 kg")],
    bilder: [
      bild("bellhop2018-1", altF(B18, "Grey")),
      bild("bellhop2018-2", alt(B18, "zwei Leuchten auf einer Holzterrasse am Abend", "two lamps on a wooden deck in the evening", "deux lampes sur une terrasse en bois le soir", "due lampade su una terrazza in legno la sera"), "ambiente"),
    ],
    v: [["Grey", 255, "F1060020"]],
    aus: [{ gruppe: FARBE, optionen: [{ id: "grey", name: "Grey", code: "F1060020", bilder: [src("bellhop2018-1")], standard: true }] }],
    verwandt: ["flos-bellhop-unplugged"],
  },
  {
    s: "bon-jour-unplugged", n: BJ, designer: "Philippe Starck", url: BJ_URL, q: [BJ_WY, BJ_CY, BJ_WT],
    kurz: T(
      "Akkubetriebene Tischleuchte von Philippe Starck mit transparentem Diffusor aus PMMA und Edge-Lighting-Technik. Basis in Weiß oder Chrom, wahlweise mit aufgesetzter Krone; laut Flos 6 bis 24 Stunden Betriebsdauer.",
      "Battery-powered table lamp by Philippe Starck with a transparent PMMA diffuser and edge-lighting technology. Base in white or chrome, optionally with a crown on top; according to Flos 6 to 24 hours of operating time.",
      "Lampe de table sur batterie de Philippe Starck, avec diffuseur transparent en PMMA et technologie edge lighting. Base blanche ou chromée, avec ou sans couronne ; selon Flos, 6 à 24 heures d'autonomie.",
      "Lampada da tavolo a batteria di Philippe Starck con diffusore trasparente in PMMA e tecnologia edge lighting. Base bianca o cromata, a scelta con corona; secondo Flos da 6 a 24 ore di autonomia."
    ),
    m: [
      laufzeit("6 bis 24 Stunden", "6 to 24 hours", "6 à 24 heures", "da 6 a 24 ore"),
      M.usbc,
      T("USB-C-Ladekabel (Nutzlänge 120 cm) und USB-Ladegerät mit austauschbaren Steckern im Lieferumfang", "USB-C charging cable (usable length 120 cm) and USB charger with interchangeable plugs included", "Câble de charge USB-C (longueur utile 120 cm) et chargeur USB à fiches interchangeables fournis", "Cavo di ricarica USB-C (lunghezza utile 120 cm) e caricatore USB con spine intercambiabili inclusi"),
      M.liPo,
      T("Ladezeit 3 Stunden (0–100 %)", "Charging time 3 hours (0–100%)", "Temps de charge 3 heures (0–100 %)", "Tempo di ricarica 3 ore (0–100%)"),
      T("Schiebeschalter an der Basis, vierstufig dimmbar", "Slide switch on the base, four-step dimming", "Interrupteur à glissière sur la base, variation en quatre niveaux", "Interruttore a scorrimento sulla base, dimmerabile in quattro livelli"),
      T("Basis und obere Abdeckung aus ABS, Diffusor aus transparentem PMMA, Edge-Lighting-Technik", "Base and top cover made of ABS, diffuser of transparent PMMA, edge-lighting technology", "Base et couvercle en ABS, diffuseur en PMMA transparent, technologie edge lighting", "Base e copertura superiore in ABS, diffusore in PMMA trasparente, tecnologia edge lighting"),
      T("Krone Transparent laut Shop nur mit weißer Basis erhältlich", "Transparent crown only available with the white base according to the shop", "Couronne transparente disponible uniquement avec la base blanche selon la boutique", "Corona trasparente disponibile solo con base bianca secondo il negozio"),
      kelvin(2700), ip(20), watt(3),
    ],
    masse: [mass("hoehe", "270 mm"), mass("laenge", "110 mm"), mass("gewicht", "0,55 kg")],
    bilder: [
      bild("bonjour-1", alt(BJ, "weiße Basis ohne Krone, Produktfoto des Herstellers vor hellem Hintergrund", "white base without crown, manufacturer's product photo on a light background", "base blanche sans couronne, photo produit du fabricant sur fond clair", "base bianca senza corona, foto prodotto del produttore su sfondo chiaro")),
      bild("bonjour-2", alt(BJ, "eingeschaltet auf Moos im Garten bei Nacht", "switched on, standing on moss in a garden at night", "allumée, posée sur de la mousse dans un jardin la nuit", "accesa, appoggiata sul muschio in giardino di notte"), "ambiente"),
    ],
    v: [
      [ohneKrone("White"), 305, "B-bonjour-unplugged-white-baseonly"],
      [ohneKrone("Chrome"), 325, "B-bonjour-unplugged-chrome-baseonly"],
      [mitKrone("White", "Yellow"), 335, "B-bonjour-unplugged-white-yellow"],
      [mitKrone("Chrome", "Yellow"), 355, "B-bonjour-unplugged-chrome-yellow"],
      [mitKrone("White", "Transparent"), 330, "B-bonjour-unplugged-white-transparent"],
    ],
    aus: [
      {
        gruppe: FARBE,
        optionen: [
          { id: "white", name: "White", code: "F1037009", bilder: [src("bonjour-1")], standard: true },
          { id: "chrome", name: "Chrome", code: "F1037057", bilder: [bild("bonjour-3", alt(BJ, "verchromte Basis ohne Krone, Produktfoto des Herstellers vor hellem Hintergrund", "chrome base without crown, manufacturer's product photo on a light background", "base chromée sans couronne, photo produit du fabricant sur fond clair", "base cromata senza corona, foto prodotto del produttore su sfondo chiaro"))] },
        ],
      },
      {
        gruppe: KRONE,
        optionen: [
          { id: "ohne", name: T("Ohne Krone", "Without crown", "Sans couronne", "Senza corona"), standard: true },
          {
            id: "yellow", name: "Yellow", code: "F1036019",
            bilder: [
              bild("bonjour-4", alt(BJ, "weiße Basis mit gelber Krone, Produktfoto des Herstellers", "white base with yellow crown, manufacturer's product photo", "base blanche avec couronne jaune, photo produit du fabricant", "base bianca con corona gialla, foto prodotto del produttore")),
              bild("bonjour-5", alt(BJ, "verchromte Basis mit gelber Krone, Produktfoto des Herstellers", "chrome base with yellow crown, manufacturer's product photo", "base chromée avec couronne jaune, photo produit du fabricant", "base cromata con corona gialla, foto prodotto del produttore")),
            ],
          },
          { id: "transparent", name: "Transparent", code: "F1036000" },
        ],
      },
    ],
  },
  {
    s: "in-vitro-unplugged", n: IV, designer: "Philippe Starck", url: IV_URL,
    kurz: T(
      "Tragbare Außenleuchte in Laternenform von Philippe Starck, aus Aluminium mit Tragegriff und Edge-Lighting-Technik. Schutzart IP65, laut Flos bis zu 6 Stunden Betriebsdauer, in sieben Farben und mit 2700 oder 3000 K.",
      "Portable lantern-shaped outdoor lamp by Philippe Starck, made of aluminium with a carrying handle and edge-lighting technology. Protection class IP65, up to 6 hours of operating time according to Flos, in seven colours and with 2700 or 3000 K.",
      "Lampe d'extérieur portable en forme de lanterne de Philippe Starck, en aluminium avec poignée et technologie edge lighting. Indice IP65, jusqu'à 6 heures d'autonomie selon Flos, en sept coloris et en 2700 ou 3000 K.",
      "Lampada portatile da esterno a forma di lanterna di Philippe Starck, in alluminio con maniglia e tecnologia edge lighting. Grado di protezione IP65, fino a 6 ore di autonomia secondo Flos, in sette colori e con 2700 o 3000 K."
    ),
    m: [
      laufzeit("bis zu 6 Stunden", "up to 6 hours", "jusqu'à 6 heures", "fino a 6 ore"),
      M.usbc, M.liIon,
      T("Optischer Sensor am Kopf, Dimmstufen 100 %, 50 %, 3 % und aus", "Optical sensor on the head, dimming steps 100%, 50%, 3% and off", "Capteur optique sur la tête, niveaux 100 %, 50 %, 3 % et arrêt", "Sensore ottico sulla testa, livelli 100%, 50%, 3% e spento"),
      T("Aluminiumkonstruktion mit Tragegriff, Edge-Lighting-Technik", "Aluminium construction with carrying handle, edge-lighting technology", "Structure en aluminium avec poignée, technologie edge lighting", "Struttura in alluminio con maniglia, tecnologia edge lighting"),
      T("Schutzart IP65, für den Außenbereich", "Protection class IP65, for outdoor use", "Indice de protection IP65, pour l'extérieur", "Grado di protezione IP65, per esterni"),
      T("Farbtemperatur 2700 K oder 3000 K (Ausführung wählbar)", "Colour temperature 2700 K or 3000 K (selectable version)", "Température de couleur 2700 K ou 3000 K (version au choix)", "Temperatura di colore 2700 K o 3000 K (versione a scelta)"),
    ],
    masse: [mass("gewicht", "2,5 kg")],
    bilder: [
      bild("invitro-1", altF(IV, "Terracotta")),
      bild("invitro-2", alt(IV, "Terracotta an einem Ast hängend im Garten", "Terracotta hanging from a branch in a garden", "Terracotta suspendue à une branche dans un jardin", "Terracotta appesa a un ramo in giardino"), "ambiente"),
    ],
    v: IV_FARBEN.flatMap(([, f, c27, c30]) => [[`${f} · 2700 K`, 1010, c27], [`${f} · 3000 K`, 1010, c30]]),
    aus: [
      { gruppe: FARBE, optionen: IV_FARBEN.map(([id, f, , , img], i) => ({ id, name: f, bilder: [img === "invitro-1" ? src(img) : bild(img, altF(IV, f))], ...(i === 0 ? { standard: true } : {}) })) },
      { gruppe: CCT, optionen: [{ id: "2700k", name: "2700 K", standard: true }, { id: "3000k", name: "3000 K" }] },
    ],
  },
  {
    s: "last-order-fluted", n: LO, designer: "Michael Anastassiades", url: LO_URL,
    kurz: T(
      "Kleine tragbare Tischleuchte von Michael Anastassiades mit geriffeltem, transparentem Glassockel und Metallabdeckung. Touch-Sensor zum Schalten und Dimmen, Schutzklasse IP55, laut Flos 6 bis 24 Stunden Betriebsdauer.",
      "Small portable table lamp by Michael Anastassiades with a fluted, transparent glass base and a metal top cover. Touch sensor for switching and dimming, protection class IP55, 6 to 24 hours of operating time according to Flos.",
      "Petite lampe de table portable de Michael Anastassiades, avec socle en verre transparent cannelé et couvercle métallique. Capteur tactile pour allumer et varier, indice IP55, 6 à 24 heures d'autonomie selon Flos.",
      "Piccola lampada da tavolo portatile di Michael Anastassiades con base in vetro trasparente scanalato e copertura in metallo. Sensore touch per accensione e regolazione, grado IP55, da 6 a 24 ore di autonomia secondo Flos."
    ),
    m: [
      laufzeit("6 bis 24 Stunden", "6 to 24 hours", "6 à 24 heures", "da 6 a 24 ore"),
      M.usbc, M.kabelOhne, M.liPo,
      T("Touch-Sensor zum Ein-/Ausschalten und Dimmen", "Touch sensor for on/off and dimming", "Capteur tactile pour allumer/éteindre et varier", "Sensore touch per accensione/spegnimento e regolazione"),
      T("Geriffelter, transparenter Glassockel (Material laut Datenblatt: Kristall, Messing, Polycarbonat)", "Fluted, transparent glass base (material according to the data sheet: crystal, brass, polycarbonate)", "Socle en verre transparent cannelé (matériaux selon la fiche : cristal, laiton, polycarbonate)", "Base in vetro trasparente scanalato (materiali secondo la scheda: cristallo, ottone, policarbonato)"),
      T("Schutzklasse IP55; laut Flos werden die Ausführungen in Kupfer und Messing nur für den Innenbereich empfohlen", "Protection class IP55; according to Flos the copper and brass versions are recommended for indoor use only", "Indice IP55 ; selon Flos, les versions cuivre et laiton sont recommandées uniquement pour l'intérieur", "Grado IP55; secondo Flos le versioni in rame e ottone sono consigliate solo per interni"),
      kelvin(2700), watt(3),
    ],
    masse: [mass("hoehe", "142 mm"), mass("laenge", "112 mm"), mass("gewicht", "2 kg")],
    bilder: [
      bild("lastorder-1", altF(LO, "Satin Copper")),
      bild("lastorder-2", alt(LO, "Satin Copper eingeschaltet auf einem Wandregal mit Büchern und Objekten", "Satin Copper switched on, on a wall shelf with books and objects", "Satin Copper allumée sur une étagère murale avec livres et objets", "Satin Copper accesa su una mensola a parete con libri e oggetti"), "ambiente"),
    ],
    v: [["Satin Copper", 530, "F3694015", { zerbrechlich: true }], ["Polished Brass", 530, "F3694059", { zerbrechlich: true }]],
    aus: [{
      gruppe: FARBE,
      optionen: [
        { id: "satin-copper", name: "Satin Copper", code: "F3694015", bilder: [src("lastorder-1")], standard: true },
        { id: "polished-brass", name: "Polished Brass", code: "F3694059", bilder: [bild("lastorder-3", altF(LO, "Polished Brass"))] },
      ],
    }],
  },
  {
    s: "gustave-residential", n: GUSTAVE, designer: "Vincent Van Duysen", url: GUSTAVE_URL,
    kurz: T(
      "Tragbare Tischleuchte aus Aluminium von Vincent Van Duysen, die laut Flos eine Fläche von bis zu einem Quadratmeter ausleuchtet. Kapazitiver Taster zum Schalten und stufenlosen Dimmen, Schutzart IP54 für den vorübergehenden Einsatz im Freien.",
      "Portable aluminium table lamp by Vincent Van Duysen which, according to Flos, lights an area of up to one square metre. Capacitive button for switching and dimming from 0 to 100%, protection class IP54 for temporary outdoor use.",
      "Lampe de table portable en aluminium de Vincent Van Duysen qui, selon Flos, éclaire une surface jusqu'à un mètre carré. Bouton capacitif pour allumer et varier de 0 à 100 %, indice IP54 pour un usage temporaire en extérieur.",
      "Lampada da tavolo portatile in alluminio di Vincent Van Duysen che, secondo Flos, illumina una superficie fino a un metro quadrato. Pulsante capacitivo per accensione e regolazione da 0 a 100%, grado IP54 per uso temporaneo all'esterno."
    ),
    m: [
      M.usbc,
      T("Akku und Ladekabel (120 cm, schwarz) im Lieferumfang", "Battery and charging cable (120 cm, black) included", "Batterie et câble de charge (120 cm, noir) fournis", "Batteria e cavo di ricarica (120 cm, nero) inclusi"),
      M.liIon,
      T("Kapazitiver Taster: Ein/Aus und Dimmen von 0 bis 100 %", "Capacitive button: on/off and dimming from 0 to 100%", "Bouton capacitif : marche/arrêt et variation de 0 à 100 %", "Pulsante capacitivo: accensione/spegnimento e regolazione da 0 a 100%"),
      T("Schutzart IP54, laut Flos für den vorübergehenden Einsatz im Außenbereich", "Protection class IP54, for temporary outdoor use according to Flos", "Indice IP54, pour un usage temporaire en extérieur selon Flos", "Grado IP54, per uso temporaneo all'esterno secondo Flos"),
      T("Material: Aluminium", "Material: aluminium", "Matériau : aluminium", "Materiale: alluminio"),
      kelvin(2700), "2,5 W",
    ],
    masse: [mass("hoehe", "230 mm"), mass("breite", "155 mm"), mass("laenge", "155 mm"), mass("gewicht", "0,78 kg")],
    bilder: [
      bild("gustave-1", altF(GUSTAVE, "Lacquered Green")),
      bild("gustave-2", alt(GUSTAVE, "Lacquered Green auf einem runden Holztisch zwischen Pflanzen", "Lacquered Green on a round wooden table among plants", "Lacquered Green sur une table ronde en bois parmi les plantes", "Lacquered Green su un tavolo rotondo in legno tra le piante"), "ambiente"),
    ],
    v: GUSTAVE_FARBEN.map(([, f, code, betrag]) => [f, betrag, code]),
    aus: [{ gruppe: FARBE, optionen: GUSTAVE_FARBEN.map(([id, f, code, , img], i) => ({ id, name: f, code, bilder: [img === "gustave-1" ? src(img) : bild(img, altF(GUSTAVE, f))], ...(i === 0 ? { standard: true } : {}) })) }],
    verwandt: ["flos-bellhop-unplugged"],
  },
];

/** @type {import("../schema.js").KatalogMarke} */
export const MARKE = Object.freeze({
  slug: "flos",
  name: "Flos",
  welt: "accessoires",
  herstellerUrl: "https://flos.com/de/at/",
  // Händlersatz nur über den Claim-Guard (dealerStatement); hier nur der Schalter.
  dealer: true,
  stand: STAND,
  // K20 (31.10.2026): Katalog zeigt nur die Akku-Leuchten (Preis/Shop); das übrige Flos-Sortiment
  // steht auf der Backoffice-Markenseite → Link „Weitere Flos-Leuchten“ (canonical bleibt selbstbezogen).
  weitereSeite: Object.freeze({ href: "/ueber-uns/marken/flos", text: "weitereLeuchten" }),
});

/** @type {import("../schema.js").KatalogProdukt[]} */
export const PRODUKTE = Object.freeze(ZEILEN.map(produkt));
