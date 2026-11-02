// src/lib/katalog/marken/zalto.js – Zalto (ZALTO Glas GmbH, Gmünd, Niederösterreich)
// Inhaber-Entscheidung Nr. 32 (31.10.2026): ganzes Sortiment des offiziellen
// Hersteller-Shops Österreich https://www.zalto.shop (Betreiber laut Impressum
// ZALTO Glas GmbH, Zweiländerstraße 8, 3950 Gmünd; verlinkt von der Markenseite
// https://www.zaltoglas.at über „Shop“). zalto.at ist ein anderes Unternehmen
// (Kälte- und Klimatechnik) und keine Quelle.
// Welt "accessoires", bereich "accessoires". Kategorien: glas, karaffe, bar-zubehoer.
//
// Quelle der Produktliste: Produktkategorien-Sitemap des Shops
// (robots.txt → https://www.zalto.shop/sitemap.xml → productcat-sitemap.xml,
// 9 Kategorien, 22 Produkte; der Shop hat keine Produkt-Sitemap). Gegenprobe:
// Produktseiten der Markenseite zaltoglas.at (gleiche 22 Produkte).
// Vollständigkeits-Check: qa-screenshots/wellness/produkte/vollstaendigkeit-zalto.md.
//
// Preise: preis.art "verkaufspreis" (Nr. 27/28/32) = Endpreis inkl. MwSt. des
// Shops je Variante (Verpackungseinheit 1er/2er/6er bzw. Farbe), Stand 31.10.2026,
// quelle = Produktseite. Optionale Variantenfelder, alle von der Produktseite:
//   sku             = Artikelnummer der Variante,
//   versandGewichtG = Feld „Gewicht“ der Variante (Zusätzliche Information, in kg → g),
//   inhaltMl        = „Füllmenge“ je Glas/Gefäß, nur bei Einzelstück-Varianten und nur,
//                     wenn Shop und Markenseite denselben Wert nennen,
//   zerbrechlich    = true (Glas).
// Versandmaße: im Shop leer → nicht gesetzt.
//
// Bewusst NICHT übernommen / Besonderheiten:
//   - Herstellertexte und Werbeaussagen (Auszeichnungen, Zitate, „Kultstatus“ …);
//     Kurztexte sind eigene Sätze aus den Fakten der Seiten.
//   - Füllmengen weichen bei fünf Produkten zwischen Shop und Markenseite ab
//     (Weißwein, Champagner, Bier, Wasser, Restweinkaraffe 250) → beide Werte als
//     Merkmal, kein inhaltMl.
//   - Glasbreite stammt von der Markenseite zaltoglas.at (im Shop nicht genannt).
//   - Eigene Zubehör-/Geschenkprodukte (Poliertücher, Geschenkverpackung,
//     Gutscheine) führt der Shop nicht; der Geschenkkarton ist Teil der
//     Verpackungseinheit „1er“.
// Bilder: je Produkt das Packshot-Foto der Produktseite (www.zalto.shop/data/…),
// bei den Restweinkaraffen zusätzlich die Farbvarianten; Motiv unverändert;
// einheitlich ≤ 1600 px lange Kante, WebP q82 (tools/images/optimize-katalog.mjs).
// Nachtrag §10 (31.10.2026): bilder[].typ gesetzt; Ambiente = Szenenfotos aus dem
// Kopfbereich der jeweiligen Produktseite auf zaltoglas.at (Karaffe 67, Gravitas Omega,
// W1-Becher, Axium/Mystique), nur wo das Produkt im Bild sicher erkennbar ist; 1920 px
// wie auf der Seite ausgeliefert, unverändert. Detailbilder: keine angeboten.
// ausfuehrungen = Shop-Varianten (siehe produkt()). zubehoer und MARKE.looks: nicht
// gesetzt – der Hersteller zeigt keine Kombination bzw. ordnet Szenen keinen Produkten zu.
// Anleitung: qa-screenshots/wellness/produkte/ANLEITUNG-MARKEN.md
// Prüfen:    node --test tests/unit/wellness-produkte.test.mjs

const STAND = "2026-10-31";
const T = (de, en, fr, it) => Object.freeze({ de, en, fr, it });
const mass = (key, wert) => Object.freeze({ key, wert });
const bild = (file, width, height, alt, quelleUrl, typ = "freisteller") =>
  Object.freeze({ src: `/Images/Wellness/produkte/zalto/${file}`, width, height, alt, quelleUrl, abgerufen: STAND, typ });

const SHOP = "https://www.zalto.shop/shop/";
const IMG = "https://www.zalto.shop/data/";
const ZG = "https://www.zaltoglas.at/";
const Q = Object.freeze({
  glaeser: `${SHOP}sortiment/denkart/glaeser`,
  dekanter: `${SHOP}sortiment/denkart/dekanter`,
  karaffen: `${SHOP}sortiment/denkart/karaffen`,
  gravitas: `${SHOP}sortiment/denkart/gravitas`,
  sw1: `${SHOP}sortiment/sw1`,
  k67: `${SHOP}sortiment/karaffe-67`,
  restwein: `${SHOP}sortiment/accessoires/restweinkaraffen`,
  zgGlaeser: `${ZG}produkte/denkart/glaeser/`,
  zgDekanter: `${ZG}produkte/denkart/dekanter-und-mehr/`,
  zgGravitas: `${ZG}produkte/denkart/gravitas/`,
  zgW1: `${ZG}produkte/serie-w1/`,
  zgK67: `${ZG}produkte/karaffee-no67/`,
  zgDenk: `${ZG}produkte/denkart/hans-denk/`,
  zgWinkel: `${ZG}produkte/denkart/winkel/`,
  pflege: `${ZG}glaspflege/`,
});

// ---------------------------------------------------------------- Vokabular
const PACK = {
  g1: T("Einzeln im Geschenkkarton", "Single, in a gift box", "À l'unité, en coffret cadeau", "Singolo, in scatola regalo"),
  g2: T("2er-Karton", "Box of 2", "Carton de 2", "Confezione da 2"),
  g6: T("6er-Karton", "Box of 6", "Carton de 6", "Confezione da 6"),
  gk: T("Im Geschenkkarton", "In a gift box", "En coffret cadeau", "In scatola regalo"),
  grau: T("Grau", "Grey", "Gris", "Grigio"),
  rot: T("Rot", "Red", "Rouge", "Rosso"),
  gruen: T("Grün", "Green", "Vert", "Verde"),
};
const L = ["de", "en", "fr", "it"];
const PACK_LABEL = T("Verpackungseinheiten", "Pack sizes", "Conditionnements", "Confezioni");
const FARB_LABEL = T("Farben", "Colours", "Couleurs", "Colori");
const liste = (label, keys) => T(...L.map((l) => `${label[l]}${l === "fr" ? " : " : ": "}${keys.map((k) => PACK[k][l]).join(", ")}`));

const fuell = (ml) => T(`Füllmenge ${ml} ml`, `Capacity ${ml} ml`, `Contenance ${ml} ml`, `Capacità ${ml} ml`);
const fuellAbw = (shop, marke) =>
  T(
    `Füllmenge ${shop} ml laut Shop, ${marke} ml laut Markenseite zaltoglas.at`,
    `Capacity ${shop} ml according to the online shop, ${marke} ml according to the brand website zaltoglas.at`,
    `Contenance ${shop} ml selon la boutique en ligne, ${marke} ml selon le site de la marque zaltoglas.at`,
    `Capacità ${shop} ml secondo il negozio online, ${marke} ml secondo il sito del marchio zaltoglas.at`
  );
const emp = (de, en, fr, it) => T(`Laut Hersteller empfohlen für: ${de}`, `Recommended by the manufacturer for: ${en}`, `Recommandé par le fabricant pour : ${fr}`, `Consigliato dal produttore per: ${it}`);

const M = {
  mundgeblasen: T(
    "Mundgeblasen, Serie Denk’Art (entwickelt mit Hans Denk)",
    "Mouth-blown, Denk’Art series (developed with Hans Denk)",
    "Soufflé à la bouche, série Denk’Art (développée avec Hans Denk)",
    "Soffiato a bocca, serie Denk’Art (sviluppata con Hans Denk)"
  ),
  winkel: T(
    "Form mit den Winkeln 24°, 48° und 72° laut Hersteller",
    "Shape based on angles of 24°, 48° and 72° according to the manufacturer",
    "Forme basée sur des angles de 24°, 48° et 72° selon le fabricant",
    "Forma basata su angoli di 24°, 48° e 72° secondo il produttore"
  ),
  spuel: T(
    "Laut Hersteller spülmaschinentauglich (Gläserspülprogramm, Pflegehinweise beachten)",
    "Dishwasher-safe according to the manufacturer (glass programme, follow the care instructions)",
    "Compatible lave-vaisselle selon le fabricant (programme verres, suivre les conseils d’entretien)",
    "Lavabile in lavastoviglie secondo il produttore (programma bicchieri, seguire le istruzioni di cura)"
  ),
  kristall: T("Bleifreies Kristallglas", "Lead-free crystal glass", "Cristal sans plomb", "Cristallo senza piombo"),
  kuehl: T(
    "Laut Hersteller zur Aufbewahrung im Kühlschrank geeignet",
    "Suitable for storage in the fridge according to the manufacturer",
    "Peut être conservée au réfrigérateur selon le fabricant",
    "Adatta alla conservazione in frigorifero secondo il produttore"
  ),
  sichtschutz: T(
    "Leicht transparent, bewusst deckend als Sichtschutz",
    "Slightly translucent, deliberately opaque to conceal the contents",
    "Légèrement translucide, volontairement opaque pour masquer le contenu",
    "Leggermente traslucida, volutamente coprente per nascondere il contenuto"
  ),
};

/** Alt-Text eines Packshots. */
const altPack = (name, de, en, fr, it) => T(`Zalto ${name} – ${de}`, `Zalto ${name} – ${en}`, `Zalto ${name} – ${fr}`, `Zalto ${name} – ${it}`);
const ALT_STD = ["Produktfoto des Herstellers vor hellem Hintergrund", "manufacturer's product photo on a light background", "photo produit du fabricant sur fond clair", "foto prodotto del produttore su sfondo chiaro"];

/**
 * Produkt aus einer Datenzeile (Werte von Produkt- und Kategorieseite des Shops
 * sowie der Produktseite auf zaltoglas.at).
 * v: [packKey, betrag, sku, gewichtKg, inhaltMl?]
 */
function produkt(r) {
  const varianten = r.v.map(([k, betrag, sku, kg, ml]) =>
    Object.freeze({ name: PACK[k], betrag, sku, ...(ml ? { inhaltMl: ml } : {}), versandGewichtG: Math.round(kg * 1000), zerbrechlich: true })
  );
  const masse = [mass("hoehe", `${r.h} mm`), r.b && mass("breite", `${r.b} mm`)].filter(Boolean);
  const bilder = [
    ...(r.img || []).map(([file, w, h, src, alt]) => bild(file, w, h, alt || altPack(r.n, ...ALT_STD), `${IMG}${src}`)),
    ...(r.amb || []).map(([file, w, h, url, alt]) => bild(file, w, h, alt, url, "ambiente")),
  ];
  // Ausführungen (Konfigurator) = Varianten des Shops, gleiche Namen/SKU/Preise;
  // standard = im Shop vorausgewählte Option (Gläser: 6er, Restweinkaraffen: Grau).
  // Nur bei Produkten mit mehr als einer Variante; Farbwerte (#RRGGBB) nicht belegt → keine.
  const farbig = r.v.some(([k]) => ["grau", "rot", "gruen"].includes(k));
  const ausfuehrungen =
    r.v.length > 1
      ? [
          Object.freeze({
            gruppe: farbig ? T("Farbe", "Colour", "Couleur", "Colore") : T("Verpackung", "Packaging", "Conditionnement", "Confezione"),
            optionen: Object.freeze(
              r.v.map(([k, betrag, sku], i) =>
                Object.freeze({
                  id: { g1: "1er", g2: "2er", g6: "6er" }[k] || k,
                  name: PACK[k],
                  code: sku,
                  betrag,
                  ...(k === (r.standard || "g6") ? { standard: true } : {}),
                  ...(farbig && bilder[i] ? { bilder: Object.freeze([bilder[i].src]) } : {}),
                })
              )
            ),
          }),
        ]
      : null;
  return Object.freeze({
    slug: `zalto-${r.s}`,
    marke: "zalto",
    bereich: "accessoires",
    kategorie: r.k,
    name: r.n,
    ...(r.serie ? { serie: r.serie } : {}),
    kurz: r.kurz,
    merkmale: Object.freeze(r.m),
    masse: Object.freeze(masse),
    ...(r.designer ? { designer: r.designer } : {}),
    bilder: Object.freeze(bilder),
    ...(ausfuehrungen ? { ausfuehrungen: Object.freeze(ausfuehrungen) } : {}),
    herstellerUrl: r.url,
    quellen: Object.freeze([...new Set([r.url, ...r.q])]),
    stand: STAND,
    ...(r.verwandt ? { verwandt: Object.freeze(r.verwandt.map((x) => `zalto-${x}`)) } : {}),
    preis: Object.freeze({ art: "verkaufspreis", varianten: Object.freeze(varianten), stand: STAND, quelle: r.url }),
  });
}

const DENK_Q = [Q.glaeser, Q.zgGlaeser, Q.zgDenk, Q.zgWinkel, Q.pflege];
const DENK_M = (fm, empf) => [M.mundgeblasen, fm, empf, liste(PACK_LABEL, ["g1", "g2", "g6"]), M.winkel, M.spuel];
const P3 = (sku, [b1, b2, b6], [k1, k2, k6], ml) => [
  ["g1", b1, `${sku}1`, k1, ml],
  ["g2", b2, `${sku}7`, k2],
  ["g6", b6, `${sku}6`, k6],
];
const glasAlt = (name) => altPack(name, "Stielglas, Produktfoto des Herstellers vor hellem Hintergrund", "stemmed glass, manufacturer's product photo on a light background", "verre à pied, photo produit du fabricant sur fond clair", "calice, foto prodotto del produttore su sfondo chiaro");

const ZEILEN = [
  // ------------------------------------------------ Gläser (Denk’Art)
  {
    s: "burgunder", n: "Burgunder", k: "glas", serie: "Denk’Art", designer: "Hans Denk", h: 230, b: 125,
    url: `${SHOP}produkt/denkart/glaeser/burgunder`, q: DENK_Q,
    kurz: T(
      "Mundgeblasenes Weinglas der Serie Denk’Art mit 960 ml Füllmenge. Laut Hersteller für kraftvolle, ausdrucksstarke Weine über 13 % Alkohol, etwa Pinot Noir, Blaufränkisch oder Syrah.",
      "Mouth-blown wine glass from the Denk’Art series with a capacity of 960 ml. According to the manufacturer, intended for powerful, expressive wines above 13% alcohol such as Pinot Noir, Blaufränkisch or Syrah.",
      "Verre à vin soufflé à la bouche de la série Denk’Art, d’une contenance de 960 ml. Selon le fabricant, destiné aux vins puissants et expressifs de plus de 13 % d’alcool, comme le Pinot Noir, le Blaufränkisch ou la Syrah.",
      "Calice da vino soffiato a bocca della serie Denk’Art con capacità di 960 ml. Secondo il produttore è pensato per vini potenti ed espressivi oltre il 13% di alcol, come Pinot Noir, Blaufränkisch o Syrah."
    ),
    m: DENK_M(fuell(960), emp(
      "Pinot Noir, Blaufränkisch, Syrah, Barolo/Barbaresco, konzentrierte Chardonnay, Chenin Blanc, Grüner Veltliner oder Sauvignon Blanc",
      "Pinot Noir, Blaufränkisch, Syrah, Barolo/Barbaresco, concentrated Chardonnay, Chenin Blanc, Grüner Veltliner or Sauvignon Blanc",
      "Pinot Noir, Blaufränkisch, Syrah, Barolo/Barbaresco, Chardonnay concentrés, Chenin Blanc, Grüner Veltliner ou Sauvignon Blanc",
      "Pinot Noir, Blaufränkisch, Syrah, Barolo/Barbaresco, Chardonnay concentrati, Chenin Blanc, Grüner Veltliner o Sauvignon Blanc"
    )),
    v: P3("1110", [51.1, 101, 299.4], [0.3, 0.55, 1.245], 960),
    img: [["zalto-burgunder-1.webp", 1067, 1600, "zgl1803_11100_burgundy_bg.jpg", glasAlt("Burgunder")]],
    verwandt: ["gravitas-omega", "bordeaux", "axium"],
  },
  {
    s: "bordeaux", n: "Bordeaux", k: "glas", serie: "Denk’Art", designer: "Hans Denk", h: 240, b: 109,
    url: `${SHOP}produkt/denkart/glaeser/bordeaux`, q: DENK_Q,
    kurz: T(
      "Mundgeblasenes Weinglas der Serie Denk’Art mit 765 ml Füllmenge. Laut Hersteller für körperreiche Rotweine mit kräftigen Tanninen und für strukturierte Weißweine gedacht.",
      "Mouth-blown wine glass from the Denk’Art series with a capacity of 765 ml. According to the manufacturer, intended for full-bodied red wines with firm tannins and for structured white wines.",
      "Verre à vin soufflé à la bouche de la série Denk’Art, d’une contenance de 765 ml. Selon le fabricant, destiné aux vins rouges corsés aux tanins puissants et aux vins blancs structurés.",
      "Calice da vino soffiato a bocca della serie Denk’Art con capacità di 765 ml. Secondo il produttore è pensato per vini rossi corposi dai tannini decisi e per vini bianchi strutturati."
    ),
    m: DENK_M(fuell(765), emp(
      "Bordeaux, Rioja, Brunello, Cabernet Sauvignon, Merlot, Shiraz, Blaufränkisch und Zweigelt aus dem Barrique, Chardonnay, Orangewein",
      "Bordeaux, Rioja, Brunello, Cabernet Sauvignon, Merlot, Shiraz, Blaufränkisch and Zweigelt aged in barrique, Chardonnay, orange wine",
      "Bordeaux, Rioja, Brunello, Cabernet Sauvignon, Merlot, Shiraz, Blaufränkisch et Zweigelt élevés en barrique, Chardonnay, vin orange",
      "Bordeaux, Rioja, Brunello, Cabernet Sauvignon, Merlot, Shiraz, Blaufränkisch e Zweigelt affinati in barrique, Chardonnay, orange wine"
    )),
    v: P3("1120", [48.1, 95, 281.4], [0.285, 0.53, 1.275], 765),
    img: [["zalto-bordeaux-1.webp", 1067, 1600, "zgl1803_11200_bordeaux_bg.jpg", glasAlt("Bordeaux")]],
    verwandt: ["burgunder", "mystique"],
  },
  {
    s: "balance", n: "Balance", k: "glas", serie: "Denk’Art", designer: "Hans Denk", h: 195, b: 113,
    url: `${SHOP}produkt/denkart/glaeser/balance`, q: DENK_Q,
    kurz: T(
      "Mundgeblasenes Weinglas der Serie Denk’Art mit 590 ml Füllmenge. Laut Hersteller für Weine, deren Struktur aus Phenolik, Gerbstoff, langem Hefelager oder Holzeinsatz stammt.",
      "Mouth-blown wine glass from the Denk’Art series with a capacity of 590 ml. According to the manufacturer, intended for wines whose structure comes from phenolics, tannin, long lees ageing or oak.",
      "Verre à vin soufflé à la bouche de la série Denk’Art, d’une contenance de 590 ml. Selon le fabricant, destiné aux vins dont la structure provient des composés phénoliques, des tanins, d’un long élevage sur lies ou du bois.",
      "Calice da vino soffiato a bocca della serie Denk’Art con capacità di 590 ml. Secondo il produttore è pensato per vini la cui struttura deriva da fenoli, tannini, lungo affinamento sui lieviti o legno."
    ),
    m: DENK_M(fuell(590), emp(
      "holzbetonte Chardonnay, maischevergorene Weißweine, ganztraubenvergorene Rotweine, Weine mit Mazerationsanteil und komplexe Schaumweine mit langem Hefelager",
      "oak-driven Chardonnay, skin-fermented white wines, whole-bunch-fermented red wines, wines with a share of maceration and complex sparkling wines with long lees ageing",
      "Chardonnay boisés, vins blancs fermentés sur peaux, vins rouges vinifiés en grappes entières, vins avec part de macération et vins effervescents complexes à long élevage sur lies",
      "Chardonnay con note di legno, vini bianchi fermentati sulle bucce, vini rossi fermentati a grappolo intero, vini con quota di macerazione e spumanti complessi con lungo affinamento sui lieviti"
    )),
    v: P3("1115", [49.1, 97, 287.4], [0.3, 0.5, 1.1], 590),
    img: [["zalto-balance-1.webp", 1063, 1600, "zgl2409_11150_balance_bg-3-scaled.jpg", glasAlt("Balance")]],
    verwandt: ["universal", "burgunder"],
  },
  {
    s: "universal", n: "Universal", k: "glas", serie: "Denk’Art", designer: "Hans Denk", h: 235, b: 91,
    url: `${SHOP}produkt/denkart/glaeser/universal`, q: DENK_Q,
    kurz: T(
      "Mundgeblasenes Weinglas der Serie Denk’Art mit 530 ml Füllmenge. Laut Hersteller für mittelkräftige bis kräftige, mineralische Weine wie Riesling oder Grüner Veltliner.",
      "Mouth-blown wine glass from the Denk’Art series with a capacity of 530 ml. According to the manufacturer, intended for medium- to full-bodied, mineral wines such as Riesling or Grüner Veltliner.",
      "Verre à vin soufflé à la bouche de la série Denk’Art, d’une contenance de 530 ml. Selon le fabricant, destiné aux vins minéraux de moyennement à très corsés, comme le Riesling ou le Grüner Veltliner.",
      "Calice da vino soffiato a bocca della serie Denk’Art con capacità di 530 ml. Secondo il produttore è pensato per vini minerali di corpo medio o pieno come Riesling o Grüner Veltliner."
    ),
    m: DENK_M(fuell(530), emp(
      "Riesling, Grüner Veltliner, mineralische Chardonnay, Chianti und komplexe Schaumweine",
      "Riesling, Grüner Veltliner, mineral Chardonnay, Chianti and complex sparkling wines",
      "Riesling, Grüner Veltliner, Chardonnay minéraux, Chianti et vins effervescents complexes",
      "Riesling, Grüner Veltliner, Chardonnay minerali, Chianti e spumanti complessi"
    )),
    v: P3("1130", [47.1, 93, 275.4], [0.23, 0.45, 1.04], 530),
    img: [["zalto-universal-1.webp", 1067, 1600, "zgl1803_11300_universal_bg.jpg", glasAlt("Universal")]],
    verwandt: ["weisswein", "balance"],
  },
  {
    s: "weisswein", n: "Weißwein", k: "glas", serie: "Denk’Art", designer: "Hans Denk", h: 230, b: 81,
    url: `${SHOP}produkt/denkart/glaeser/weisswein`, q: DENK_Q,
    kurz: T(
      "Mundgeblasenes Weinglas der Serie Denk’Art. Laut Hersteller für fruchtbetonte Weißweine und Rosé sowie mittelgewichtige Rotweine ohne Barriqueausbau.",
      "Mouth-blown wine glass from the Denk’Art series. According to the manufacturer, intended for fruit-driven white wines and rosé as well as medium-bodied red wines without barrique ageing.",
      "Verre à vin soufflé à la bouche de la série Denk’Art. Selon le fabricant, destiné aux vins blancs fruités et rosés ainsi qu’aux vins rouges de corps moyen non élevés en barrique.",
      "Calice da vino soffiato a bocca della serie Denk’Art. Secondo il produttore è pensato per vini bianchi fruttati e rosé, oltre che per vini rossi di medio corpo non affinati in barrique."
    ),
    m: DENK_M(fuellAbw(400, 420), emp(
      "Riesling, Kabinett, Sauvignon Blanc, Muskateller, restsüße Qualitätsweine, Winzerchampagner und Sekte, Sake, Sherry und schlanke Biere",
      "Riesling, Kabinett, Sauvignon Blanc, Muscat, quality wines with residual sugar, grower champagnes and sparkling wines, sake, sherry and light beers",
      "Riesling, Kabinett, Sauvignon Blanc, Muscat, vins de qualité avec sucre résiduel, champagnes de vignerons et vins mousseux, saké, xérès et bières légères",
      "Riesling, Kabinett, Sauvignon Blanc, Moscato, vini di qualità con residuo zuccherino, champagne di vignaioli e spumanti, sake, sherry e birre leggere"
    )),
    v: P3("1140", [46.1, 91, 269.4], [0.21, 0.4, 1]),
    img: [["zalto-weisswein-1.webp", 1067, 1600, "zgl1803_11400_whitewine_bg.jpg", glasAlt("Weißwein")]],
    verwandt: ["wasser", "universal", "no-75"],
  },
  {
    s: "champagner", n: "Champagner", k: "glas", serie: "Denk’Art", designer: "Hans Denk", h: 240, b: 75,
    url: `${SHOP}produkt/denkart/glaeser/champagner`, q: DENK_Q,
    kurz: T(
      "Mundgeblasenes Schaumweinglas der Serie Denk’Art mit schlankem Kelch. Laut Hersteller für Champagner, Sekt, Prosecco, Spumante und Cava.",
      "Mouth-blown sparkling wine glass from the Denk’Art series with a slender bowl. According to the manufacturer, intended for champagne, Sekt, Prosecco, Spumante and Cava.",
      "Verre à vin effervescent soufflé à la bouche de la série Denk’Art, au calice élancé. Selon le fabricant, destiné au champagne, au Sekt, au Prosecco, au Spumante et au Cava.",
      "Calice per spumante soffiato a bocca della serie Denk’Art, dalla coppa slanciata. Secondo il produttore è pensato per champagne, Sekt, Prosecco, Spumante e Cava."
    ),
    m: DENK_M(fuellAbw(220, 250), emp("Champagner, Sekt, Prosecco, Spumante und Cava", "Champagne, Sekt, Prosecco, Spumante and Cava", "Champagne, Sekt, Prosecco, Spumante et Cava", "Champagne, Sekt, Prosecco, Spumante e Cava")),
    v: P3("1155", [47.1, 93, 275.4], [0.19, 0.36, 0.825]),
    img: [["zalto-champagner-1.webp", 1067, 1600, "zgl1803_11550_champagne_bg.jpg", glasAlt("Champagner")]],
    verwandt: ["karaffe-67", "universal"],
  },
  {
    s: "suesswein", n: "Süsswein", k: "glas", serie: "Denk’Art", designer: "Hans Denk", h: 230, b: 85,
    url: `${SHOP}produkt/denkart/glaeser/suesswein`, q: DENK_Q,
    kurz: T(
      "Mundgeblasenes Glas der Serie Denk’Art mit 320 ml Füllmenge. Laut Hersteller für Dessertweine, im Fass gereifte Destillate und gereiften Champagner.",
      "Mouth-blown glass from the Denk’Art series with a capacity of 320 ml. According to the manufacturer, intended for dessert wines, cask-aged spirits and mature champagne.",
      "Verre soufflé à la bouche de la série Denk’Art, d’une contenance de 320 ml. Selon le fabricant, destiné aux vins de dessert, aux eaux-de-vie élevées en fût et aux champagnes mûrs.",
      "Calice soffiato a bocca della serie Denk’Art con capacità di 320 ml. Secondo il produttore è pensato per vini da dessert, distillati affinati in botte e champagne maturi."
    ),
    m: DENK_M(fuell(320), emp(
      "Sauternes, Trockenbeerenauslese, Auslese, Eiswein, Portwein, Sherry, Madeira, Single Malt Whisky und Weinbrände",
      "Sauternes, Trockenbeerenauslese, Auslese, ice wine, port, sherry, Madeira, single malt whisky and brandies",
      "Sauternes, Trockenbeerenauslese, Auslese, vin de glace, porto, xérès, madère, whisky single malt et eaux-de-vie de vin",
      "Sauternes, Trockenbeerenauslese, Auslese, vino del ghiaccio, porto, sherry, madeira, single malt whisky e brandy"
    )),
    v: P3("1160", [46.1, 91, 269.4], [0.215, 0.4, 0.95], 320),
    img: [["zalto-suesswein-1.webp", 1067, 1600, "zgl1803_11600_sweetwine_bg.jpg", glasAlt("Süsswein")]],
    verwandt: ["digestif", "cask"],
  },
  {
    s: "cask", n: "Cask", k: "glas", serie: "Denk’Art", designer: "Hans Denk", h: 183, b: 85,
    url: `${SHOP}produkt/denkart/glaeser/cask`, q: DENK_Q,
    kurz: T(
      "Mundgeblasenes Spirituosenglas der Serie Denk’Art mit 280 ml Füllmenge. Laut Hersteller für Whisky, Cognac und fassgereifte Brände.",
      "Mouth-blown spirits glass from the Denk’Art series with a capacity of 280 ml. According to the manufacturer, intended for whisky, cognac and cask-aged spirits.",
      "Verre à spiritueux soufflé à la bouche de la série Denk’Art, d’une contenance de 280 ml. Selon le fabricant, destiné au whisky, au cognac et aux eaux-de-vie élevées en fût.",
      "Bicchiere per distillati soffiato a bocca della serie Denk’Art con capacità di 280 ml. Secondo il produttore è pensato per whisky, cognac e distillati affinati in botte."
    ),
    m: DENK_M(fuell(280), emp(
      "Whisky, Cognac, Rum, Armagnac und fassgereifte Brände wie Mezcal, Grappa, Calvados, Tequila, Marc und Fine",
      "whisky, cognac, rum, Armagnac and cask-aged spirits such as mezcal, grappa, calvados, tequila, marc and fine",
      "whisky, cognac, rhum, armagnac et eaux-de-vie élevées en fût comme le mezcal, la grappa, le calvados, la tequila, le marc et la fine",
      "whisky, cognac, rum, armagnac e distillati affinati in botte come mezcal, grappa, calvados, tequila, marc e fine"
    )),
    v: P3("1175", [46.1, 91, 269.4], [0.185, 0.36, 0.79], 280),
    img: [["zalto-cask-1.webp", 1063, 1600, "zgl2610_11750_cask_bg.jpg", glasAlt("Cask")]],
    verwandt: ["digestif", "suesswein"],
  },
  {
    s: "digestif", n: "Digestif", k: "glas", serie: "Denk’Art", designer: "Hans Denk", h: 210, b: 70,
    url: `${SHOP}produkt/denkart/glaeser/digestif`, q: DENK_Q,
    kurz: T(
      "Mundgeblasenes Stielglas der Serie Denk’Art mit 140 ml Füllmenge. Laut Hersteller für feine Destillate und Liköre.",
      "Mouth-blown stemmed glass from the Denk’Art series with a capacity of 140 ml. According to the manufacturer, intended for fine spirits and liqueurs.",
      "Verre à pied soufflé à la bouche de la série Denk’Art, d’une contenance de 140 ml. Selon le fabricant, destiné aux eaux-de-vie fines et aux liqueurs.",
      "Calice soffiato a bocca della serie Denk’Art con capacità di 140 ml. Secondo il produttore è pensato per distillati fini e liquori."
    ),
    m: DENK_M(fuell(140), emp("Fruchtdestillate, Grappa, Tequila, Bitter und Sherry", "fruit brandies, grappa, tequila, bitters and sherry", "eaux-de-vie de fruits, grappa, tequila, bitters et xérès", "distillati di frutta, grappa, tequila, amari e sherry")),
    v: P3("1170", [38.1, 75, 221.4], [0.185, 0.36, 0.79], 140),
    img: [["zalto-digestif-1.webp", 1066, 1600, "zgl1803_11700_digestive_bg-1.jpg", glasAlt("Digestif")]],
    verwandt: ["cask", "suesswein"],
  },
  {
    s: "bier", n: "Bier", k: "glas", serie: "Denk’Art", designer: "Hans Denk", h: 223, b: 80,
    url: `${SHOP}produkt/denkart/glaeser/bier`, q: DENK_Q,
    kurz: T(
      "Mundgeblasenes Bierglas mit Stiel aus der Serie Denk’Art. Laut Hersteller für fein gehopfte Pils- und Lagerbiere gedacht.",
      "Mouth-blown stemmed beer glass from the Denk’Art series. According to the manufacturer, intended for delicately hopped pilsner and lager beers.",
      "Verre à bière à pied soufflé à la bouche de la série Denk’Art. Selon le fabricant, destiné aux bières pils et lager finement houblonnées.",
      "Bicchiere da birra a calice soffiato a bocca della serie Denk’Art. Secondo il produttore è pensato per birre pils e lager dal luppolo delicato."
    ),
    m: DENK_M(fuellAbw(350, 370), emp("fein gehopfte Pils- und Märzenbiere", "delicately hopped pilsner and Märzen beers", "bières pils et Märzen finement houblonnées", "birre pils e Märzen dal luppolo delicato")),
    v: P3("1180", [46.1, 91, 269.4], [0.21, 0.385, 0.92]),
    img: [["zalto-bier-1.webp", 1067, 1600, "zgl1803_11800_beer_bg.jpg", glasAlt("Bier")]],
    verwandt: ["wasser"],
  },
  {
    s: "wasser", n: "Wasser", k: "glas", serie: "Denk’Art", designer: "Hans Denk", h: 195, b: 81,
    url: `${SHOP}produkt/denkart/glaeser/wasser`, q: DENK_Q,
    kurz: T(
      "Mundgeblasenes Wasserglas mit Stiel aus der Serie Denk’Art, mit der Kelchform des Weißweinglases. Laut Hersteller auch als Verkostungsglas einsetzbar.",
      "Mouth-blown stemmed water glass from the Denk’Art series with the bowl shape of the white wine glass. According to the manufacturer, it can also be used as a tasting glass.",
      "Verre à eau à pied soufflé à la bouche de la série Denk’Art, avec la forme de calice du verre à vin blanc. Selon le fabricant, il peut aussi servir de verre de dégustation.",
      "Bicchiere da acqua a calice soffiato a bocca della serie Denk’Art, con la forma della coppa del calice da vino bianco. Secondo il produttore può essere usato anche come bicchiere da degustazione."
    ),
    m: DENK_M(fuellAbw(400, 420), emp("Wasser, alkoholfreie Getränke und schlanke, feinherbe Biere", "water, non-alcoholic drinks and light, subtly bitter beers", "eau, boissons sans alcool et bières légères légèrement amères", "acqua, bevande analcoliche e birre leggere leggermente amare")),
    v: P3("1185", [46.1, 91, 269.4], [0.2, 0.38, 0.875]),
    img: [["zalto-wasser-1.webp", 1067, 1600, "zgl1803_11850_water_bg.jpg", glasAlt("Wasser")]],
    verwandt: ["weisswein", "no-150", "w1-becher-kristall-klar"],
  },
  // ------------------------------------------------ Gravitas
  {
    s: "gravitas-omega", n: "Gravitas Omega", k: "glas", serie: "Gravitas", h: 230,
    url: `${SHOP}produkt/denkart/gravitas/gravitas-omega`, q: [Q.gravitas, Q.zgGravitas, Q.pflege],
    kurz: T(
      "Weinglas ohne Bodenplatte, das liegend auf einer Kugel und einer Delle im Kelch ruht. Der Kelch entspricht laut Hersteller dem Denk’Art-Burgunderglas, Füllmenge 960 ml.",
      "Wine glass without a foot that rests on its side on a sphere and a dimple in the bowl. According to the manufacturer, the bowl matches the Denk’Art Burgundy glass, capacity 960 ml.",
      "Verre à vin sans pied qui repose couché sur une sphère et un creux du calice. Selon le fabricant, le calice correspond au verre Bourgogne Denk’Art, contenance 960 ml.",
      "Calice da vino senza base che poggia disteso su una sfera e su un incavo della coppa. Secondo il produttore la coppa corrisponde al calice Borgogna Denk’Art, capacità 960 ml."
    ),
    m: [
      fuell(960),
      T("Ohne Bodenplatte, liegt auf einer Kugel und einer Delle im Kelch", "No foot; rests on a sphere and a dimple in the bowl", "Sans pied ; repose sur une sphère et un creux du calice", "Senza base; poggia su una sfera e su un incavo della coppa"),
      T("Kelch des Denk’Art-Burgunderglases", "Bowl of the Denk’Art Burgundy glass", "Calice du verre Bourgogne Denk’Art", "Coppa del calice Borgogna Denk’Art"),
      T("Nach einer Idee des Winzers Peter Veyder-Malberg", "Based on an idea by winemaker Peter Veyder-Malberg", "D’après une idée du vigneron Peter Veyder-Malberg", "Da un’idea del viticoltore Peter Veyder-Malberg"),
      liste(PACK_LABEL, ["g1", "g2", "g6"]),
      M.spuel,
    ],
    v: P3("9010", [54.1, 107, 317.4], [0.27, 0.475, 1.085], 960),
    img: [["zalto-gravitas-omega-1.webp", 1067, 1600, "zgl1803_90100_gravitas_omega_bg.jpg", altPack("Gravitas Omega", "liegendes Glas ohne Bodenplatte, Produktfoto des Herstellers vor hellem Hintergrund", "glass without a foot lying on its side, manufacturer's product photo on a light background", "verre sans pied couché, photo produit du fabricant sur fond clair", "calice senza base disteso, foto prodotto del produttore su sfondo chiaro")]],
    amb: [
      ["zalto-gravitas-omega-2.webp", 1600, 697, "https://www.zaltoglas.at/wp-content/uploads/2022/03/Zalto-Glas-Intro-11-1920x0-c-default.jpg", altPack("Gravitas Omega", "liegendes Glas mit Rotwein auf einem Holztisch im Sonnenlicht, Szenenfoto des Herstellers", "glass with red wine lying on a sunlit wooden table, manufacturer's scene photo", "verre avec du vin rouge couché sur une table en bois ensoleillée, photo d’ambiance du fabricant", "calice con vino rosso disteso su un tavolo di legno al sole, foto d’ambiente del produttore")],
      ["zalto-gravitas-omega-3.webp", 1600, 697, "https://www.zaltoglas.at/wp-content/uploads/2022/02/Zalto-Glas-Intro-Gravitas-1920x0-c-default.jpg", altPack("Gravitas Omega", "liegendes Glas mit Rotwein neben einem Dekanter auf einem Holztresen, Szenenfoto des Herstellers", "glass with red wine lying next to a decanter on a wooden counter, manufacturer's scene photo", "verre avec du vin rouge couché à côté d’une carafe sur un comptoir en bois, photo d’ambiance du fabricant", "calice con vino rosso disteso accanto a un decanter su un bancone di legno, foto d’ambiente del produttore")],
    ],
    verwandt: ["burgunder"],
  },
  // ------------------------------------------------ Serie W1
  {
    s: "w1-becher-kristall-klar", n: "W1 Becher Kristall Klar", k: "glas", serie: "W1", h: 98, b: 91,
    url: `${SHOP}produkt/sw1/w1-becher-kristall-klar`, q: [Q.sw1, Q.zgW1, Q.pflege],
    kurz: T(
      "Becher ohne Stiel aus bleifreiem Kristallglas, Serie W1, mit 380 ml Füllmenge. Klare Ausführung; zusammen mit der Ausführung Effekt laut Hersteller zur Unterscheidung von stillem und prickelndem Wasser gedacht.",
      "Stemless tumbler made of lead-free crystal glass, W1 series, with a capacity of 380 ml. Clear version; according to the manufacturer, it is paired with the Effekt version to tell still and sparkling water apart.",
      "Gobelet sans pied en cristal sans plomb, série W1, d’une contenance de 380 ml. Version transparente ; selon le fabricant, associée à la version Effekt pour distinguer l’eau plate de l’eau gazeuse.",
      "Bicchiere senza stelo in cristallo senza piombo, serie W1, con capacità di 380 ml. Versione trasparente; secondo il produttore, abbinata alla versione Effekt, serve a distinguere l’acqua naturale da quella frizzante."
    ),
    m: [M.kristall, fuell(380), T("Ausführung: kristallklar", "Finish: crystal clear", "Finition : cristal transparent", "Finitura: cristallo trasparente"), liste(PACK_LABEL, ["g1", "g6"]), M.spuel],
    v: [["g1", 31.1, "70101", 0.14, 380], ["g6", 179.4, "70106", 0.9]],
    img: [["zalto-w1-becher-kristall-klar-1.webp", 1067, 1600, "zgl1803_70101_sw1_kk_bg-1.jpg", altPack("W1 Becher Kristall Klar", "klarer Becher ohne Stiel, Produktfoto des Herstellers vor hellem Hintergrund", "clear stemless tumbler, manufacturer's product photo on a light background", "gobelet transparent sans pied, photo produit du fabricant sur fond clair", "bicchiere trasparente senza stelo, foto prodotto del produttore su sfondo chiaro")]],
    amb: [["zalto-w1-becher-kristall-klar-2.webp", 1600, 697, "https://www.zaltoglas.at/wp-content/uploads/2022/02/Zalto-Glas-Intro-Serie-W1-1920x0-c-default.jpg", altPack("W1 Becher Kristall Klar", "die beiden W1-Becher mit Wasser, Zitrone und Minze auf einem hellen Tisch, Szenenfoto des Herstellers", "the two W1 tumblers with water, lemon and mint on a light table, manufacturer's scene photo", "les deux gobelets W1 avec eau, citron et menthe sur une table claire, photo d’ambiance du fabricant", "i due bicchieri W1 con acqua, limone e menta su un tavolo chiaro, foto d’ambiente del produttore")]],
    verwandt: ["w1-becher-effekt", "no-150"],
  },
  {
    s: "w1-becher-effekt", n: "W1 Becher Effekt", k: "glas", serie: "W1", h: 98, b: 91,
    url: `${SHOP}produkt/sw1/w1-becher-effekt`, q: [Q.sw1, Q.zgW1, Q.pflege],
    kurz: T(
      "Becher ohne Stiel aus bleifreiem Kristallglas, Serie W1, mit 380 ml Füllmenge. Ausführung Effekt; zusammen mit der klaren Ausführung laut Hersteller zur Unterscheidung von stillem und prickelndem Wasser gedacht.",
      "Stemless tumbler made of lead-free crystal glass, W1 series, with a capacity of 380 ml. Effekt version; according to the manufacturer, it is paired with the clear version to tell still and sparkling water apart.",
      "Gobelet sans pied en cristal sans plomb, série W1, d’une contenance de 380 ml. Version Effekt ; selon le fabricant, associée à la version transparente pour distinguer l’eau plate de l’eau gazeuse.",
      "Bicchiere senza stelo in cristallo senza piombo, serie W1, con capacità di 380 ml. Versione Effekt; secondo il produttore, abbinata alla versione trasparente, serve a distinguere l’acqua naturale da quella frizzante."
    ),
    m: [M.kristall, fuell(380), T("Ausführung: Effekt", "Finish: Effekt", "Finition : Effekt", "Finitura: Effekt"), liste(PACK_LABEL, ["g1", "g6"]), M.spuel],
    v: [["g1", 31.1, "70111", 0.14, 380], ["g6", 179.4, "70116", 0.9]],
    img: [["zalto-w1-becher-effekt-1.webp", 1067, 1600, "zgl1803_70101_sw1_ef_bg-1.jpg", altPack("W1 Becher Effekt", "Becher ohne Stiel mit unregelmäßiger Wandstruktur, Produktfoto des Herstellers vor hellem Hintergrund", "stemless tumbler with an irregular wall texture, manufacturer's product photo on a light background", "gobelet sans pied à paroi irrégulière, photo produit du fabricant sur fond clair", "bicchiere senza stelo con parete irregolare, foto prodotto del produttore su sfondo chiaro")]],
    amb: [["zalto-w1-becher-effekt-2.webp", 1600, 697, "https://www.zaltoglas.at/wp-content/uploads/2022/02/Zalto-Glas-Intro-Serie-W1-1920x0-c-default.jpg", altPack("W1 Becher Effekt", "die beiden W1-Becher mit Wasser, Zitrone und Minze auf einem hellen Tisch, Szenenfoto des Herstellers", "the two W1 tumblers with water, lemon and mint on a light table, manufacturer's scene photo", "les deux gobelets W1 avec eau, citron et menthe sur une table claire, photo d’ambiance du fabricant", "i due bicchieri W1 con acqua, limone e menta su un tavolo chiaro, foto d’ambiente del produttore")]],
    verwandt: ["w1-becher-kristall-klar", "no-150"],
  },
  // ------------------------------------------------ Dekanter
  {
    s: "axium", n: "Axium", k: "karaffe", serie: "Denk’Art", h: 204, b: 155,
    url: `${SHOP}produkt/denkart/dekanter/axium`, q: [Q.dekanter, Q.zgDekanter, Q.pflege],
    kurz: T(
      "Dekanter mit 1450 ml Füllmenge aus der Denk’Art-Kollektion. Laut Hersteller für Rotweine und gehaltvolle Weißweine, die vor dem Ausschenken belüftet werden sollen.",
      "Decanter with a capacity of 1450 ml from the Denk’Art collection. According to the manufacturer, intended for red wines and rich white wines that benefit from aeration before serving.",
      "Carafe à décanter d’une contenance de 1450 ml de la collection Denk’Art. Selon le fabricant, destinée aux vins rouges et aux vins blancs riches à aérer avant le service.",
      "Decanter con capacità di 1450 ml della collezione Denk’Art. Secondo il produttore è pensato per vini rossi e vini bianchi corposi da ossigenare prima del servizio."
    ),
    m: [fuell(1450), emp("Rotweine und gehaltvolle Weißweine", "red wines and rich white wines", "vins rouges et vins blancs riches", "vini rossi e vini bianchi corposi"), liste(PACK_LABEL, ["gk"]), M.spuel],
    v: [["gk", 98.9, "11961", 0.685, 1450]],
    img: [["zalto-axium-1.webp", 1066, 1600, "zgl1803_11961_decanter_axium_bg-2.jpg", altPack("Axium", "Dekanter mit breitem, kantigem Bauch, Produktfoto des Herstellers vor hellem Hintergrund", "decanter with a wide, angular body, manufacturer's product photo on a light background", "carafe à décanter au corps large et anguleux, photo produit du fabricant sur fond clair", "decanter dal corpo largo e angolare, foto prodotto del produttore su sfondo chiaro")]],
    amb: [["zalto-axium-2.webp", 1600, 697, "https://www.zaltoglas.at/wp-content/uploads/2022/03/Zalto-Glas-Intro-10-1920x0-c-default.jpg", altPack("Axium", "mit Rotwein gefüllte Dekanter Axium und Mystique, daneben eine Karaffe und ein Weinglas auf einem Holztisch, Szenenfoto des Herstellers", "Axium and Mystique decanters filled with red wine, with a carafe and a wine glass on a wooden table, manufacturer's scene photo", "carafes à décanter Axium et Mystique remplies de vin rouge, avec une carafe et un verre à vin sur une table en bois, photo d’ambiance du fabricant", "decanter Axium e Mystique con vino rosso, accanto a una caraffa e a un calice su un tavolo di legno, foto d’ambiente del produttore")]],
    verwandt: ["mystique", "burgunder"],
  },
  {
    s: "mystique", n: "Mystique", k: "karaffe", serie: "Denk’Art", h: 185, b: 213,
    url: `${SHOP}produkt/denkart/dekanter/mystique`, q: [Q.dekanter, Q.zgDekanter, Q.pflege],
    kurz: T(
      "Breiter Dekanter mit 1900 ml Füllmenge aus der Denk’Art-Kollektion. Laut Hersteller für schwere Rotweine, die über eine große Oberfläche viel Luftkontakt brauchen, auch für den Inhalt von Magnumflaschen.",
      "Wide decanter with a capacity of 1900 ml from the Denk’Art collection. According to the manufacturer, intended for heavy red wines that need plenty of air contact over a large surface, including the contents of magnum bottles.",
      "Carafe à décanter large d’une contenance de 1900 ml de la collection Denk’Art. Selon le fabricant, destinée aux vins rouges puissants qui ont besoin d’un large contact avec l’air, y compris le contenu d’un magnum.",
      "Decanter ampio con capacità di 1900 ml della collezione Denk’Art. Secondo il produttore è pensato per vini rossi strutturati che richiedono un ampio contatto con l’aria, anche per il contenuto di bottiglie magnum."
    ),
    m: [fuell(1900), emp("schwere Rotweine, auch aus Magnumflaschen", "heavy red wines, including from magnum bottles", "vins rouges puissants, y compris en magnum", "vini rossi strutturati, anche da bottiglie magnum"), liste(PACK_LABEL, ["gk"]), M.spuel],
    v: [["gk", 114.9, "11971", 0.82, 1900]],
    img: [["zalto-mystique-1.webp", 1066, 1600, "zgl1803_11971_decanter_mystique_bg.jpg", altPack("Mystique", "flacher, breiter Dekanter, Produktfoto des Herstellers vor hellem Hintergrund", "low, wide decanter, manufacturer's product photo on a light background", "carafe à décanter basse et large, photo produit du fabricant sur fond clair", "decanter basso e largo, foto prodotto del produttore su sfondo chiaro")]],
    amb: [["zalto-mystique-2.webp", 1600, 697, "https://www.zaltoglas.at/wp-content/uploads/2022/03/Zalto-Glas-Intro-10-1920x0-c-default.jpg", altPack("Mystique", "mit Rotwein gefüllte Dekanter Axium und Mystique, daneben eine Karaffe und ein Weinglas auf einem Holztisch, Szenenfoto des Herstellers", "Axium and Mystique decanters filled with red wine, with a carafe and a wine glass on a wooden table, manufacturer's scene photo", "carafes à décanter Axium et Mystique remplies de vin rouge, avec une carafe et un verre à vin sur une table en bois, photo d’ambiance du fabricant", "decanter Axium e Mystique con vino rosso, accanto a una caraffa e a un calice su un tavolo di legno, foto d’ambiente del produttore")]],
    verwandt: ["axium", "bordeaux"],
  },
  // ------------------------------------------------ Karaffen
  ...[
    ["no-25", "NO.25", 175, 67, 350, 45.9, "11911", 0.32, "zgl1803_11911_carafe_no25_bg.jpg", ["no-75", "no-150"]],
    ["no-75", "NO.75", 248, 93, 820, 63.9, "11921", 0.475, "zgl1803_11921_carafe_no75_bg.jpg", ["no-25", "no-150"]],
    ["no-150", "NO.150", 300, 123, 1600, 79.9, "11931", 0.745, "zgl1803_11931_carafe_no150_bg.jpg", ["no-25", "no-75"]],
  ].map(([s, n, h, b, ml, betrag, sku, kg, src, verwandt]) => ({
    s, n, k: "karaffe", serie: "Denk’Art", h, b,
    url: `${SHOP}produkt/denkart/karaffen/${s}`, q: [Q.karaffen, Q.zgDekanter, Q.pflege],
    kurz: T(
      `Schlanke Karaffe mit ${ml} ml Füllmenge aus der Denk’Art-Kollektion. Laut Hersteller für schlanke Weißweine, Wasser und Fruchtsäfte und zur Aufbewahrung im Kühlschrank geeignet.`,
      `Slender carafe with a capacity of ${ml} ml from the Denk’Art collection. According to the manufacturer, intended for light white wines, water and fruit juices and suitable for storage in the fridge.`,
      `Carafe élancée d’une contenance de ${ml} ml de la collection Denk’Art. Selon le fabricant, destinée aux vins blancs légers, à l’eau et aux jus de fruits, et adaptée à la conservation au réfrigérateur.`,
      `Caraffa slanciata con capacità di ${ml} ml della collezione Denk’Art. Secondo il produttore è pensata per vini bianchi leggeri, acqua e succhi di frutta ed è adatta alla conservazione in frigorifero.`
    ),
    m: [fuell(ml), emp("schlanke Weißweine, Wasser und Fruchtsäfte", "light white wines, water and fruit juices", "vins blancs légers, eau et jus de fruits", "vini bianchi leggeri, acqua e succhi di frutta"), M.kuehl, liste(PACK_LABEL, ["gk"]), M.spuel],
    v: [["gk", betrag, sku, kg, ml]],
    img: [[`zalto-${s}-1.webp`, 1067, 1600, src, altPack(n, "schlanke Karaffe, Produktfoto des Herstellers vor hellem Hintergrund", "slender carafe, manufacturer's product photo on a light background", "carafe élancée, photo produit du fabricant sur fond clair", "caraffa slanciata, foto prodotto del produttore su sfondo chiaro")]],
    verwandt,
  })),
  {
    s: "karaffe-67", n: "Karaffe 67", k: "karaffe", h: 305, b: 82,
    url: `${SHOP}produkt/karaffe-67/karaffe-67`, q: [Q.k67, Q.zgK67, Q.pflege],
    kurz: T(
      "Schmale Karaffe mit langem Hals und 920 ml Füllmenge; eine Glaskugel liegt als Verschluss bei. Laut Hersteller für Wein, Wasser und alkoholfreie Getränke, durch das sanfte Dekantieren auch für Schaumwein, und passend für die Kühlschranktür.",
      "Narrow carafe with a long neck and a capacity of 920 ml; a glass sphere is included as a stopper. According to the manufacturer, intended for wine, water and soft drinks, also for sparkling wine thanks to gentle decanting, and it fits in a fridge door.",
      "Carafe étroite à long col d’une contenance de 920 ml ; une sphère en verre est fournie comme bouchon. Selon le fabricant, destinée au vin, à l’eau et aux boissons sans alcool, aussi au vin effervescent grâce à une décantation douce, et adaptée à la porte du réfrigérateur.",
      "Caraffa stretta dal collo lungo con capacità di 920 ml; una sfera di vetro è inclusa come tappo. Secondo il produttore è pensata per vino, acqua e bevande analcoliche, grazie alla decantazione delicata anche per lo spumante, ed entra nella porta del frigorifero."
    ),
    m: [
      fuell(920),
      T("Glaskugel als Verschluss beiliegend", "Glass sphere stopper included", "Sphère en verre fournie comme bouchon", "Sfera di vetro inclusa come tappo"),
      emp("Wein, Wasser, alkoholfreie Getränke und Schaumweine", "wine, water, soft drinks and sparkling wines", "vin, eau, boissons sans alcool et vins effervescents", "vino, acqua, bevande analcoliche e spumanti"),
      T("Laut Hersteller zur Aufbewahrung in der Kühlschranktür geeignet", "Suitable for storage in the fridge door according to the manufacturer", "Peut être rangée dans la porte du réfrigérateur selon le fabricant", "Adatta alla conservazione nella porta del frigorifero secondo il produttore"),
      liste(PACK_LABEL, ["gk"]),
      M.spuel,
    ],
    v: [["gk", 128.9, "94911", 0.785, 920]],
    img: [["zalto-karaffe-67-1.webp", 1067, 1600, "zgl22011_80000_karaffe_67_bg.jpg", altPack("Karaffe 67", "schmale Karaffe mit langem Hals und daneben liegender Verschlusskugel, Produktfoto des Herstellers vor hellem Hintergrund", "narrow long-necked carafe with its stopper sphere beside it, manufacturer's product photo on a light background", "carafe étroite à long col avec sa sphère-bouchon à côté, photo produit du fabricant sur fond clair", "caraffa stretta dal collo lungo con la sfera-tappo accanto, foto prodotto del produttore su sfondo chiaro")]],
    amb: [["zalto-karaffe-67-2.webp", 1600, 697, "https://www.zaltoglas.at/wp-content/uploads/2022/02/Zalto-Glas-Intro-6-1920x0-c-default.jpg", altPack("Karaffe 67", "zwei gefüllte Karaffen mit Verschlusskugel und Weingläser auf einem Holztisch, Szenenfoto des Herstellers", "two filled carafes with stopper sphere and wine glasses on a wooden table, manufacturer's scene photo", "deux carafes remplies avec sphère-bouchon et verres à vin sur une table en bois, photo d’ambiance du fabricant", "due caraffe piene con sfera-tappo e calici su un tavolo di legno, foto d’ambiente del produttore")]],
    verwandt: ["champagner", "no-150"],
  },
];

// ------------------------------------------------ Restweinkaraffen (Accessoires)
/** v: Farben grau/rot/grün mit gleichem Preis; je Farbe ein Bild. */
function restwein(s, n, h, b, ml, betrag, skuBasis, kg, gr, verwandt) {
  const farbAlt = { grau: ["graue", "grey", "grise", "grigia"], rot: ["rote", "red", "rouge", "rossa"], gruen: ["grüne", "green", "verte", "verde"] };
  const groesse = s.endsWith("-50") ? "s" : "l";
  const imgName = { grau: "gray", rot: "red", gruen: "green" };
  const zeile = {
    s, n, k: "bar-zubehoer", h, b, standard: "grau",
    url: `${SHOP}produkt/accessoires/restweinkaraffen/${s}`, q: [Q.restwein, Q.zgDekanter, Q.pflege],
    kurz: gr
      ? T(
          "Gefäß für Verkostungen in Grau, Rot oder Grün, laut Hersteller als großes Tisch- oder Rückschüttgefäß gedacht. Leicht transparent, aber bewusst deckend als Sichtschutz.",
          "Tasting vessel in grey, red or green, intended by the manufacturer as a large table or spittoon vessel. Slightly translucent but deliberately opaque to conceal the contents.",
          "Récipient de dégustation gris, rouge ou vert, prévu par le fabricant comme grand récipient de table ou crachoir. Légèrement translucide mais volontairement opaque pour masquer le contenu.",
          "Recipiente per degustazioni in grigio, rosso o verde, pensato dal produttore come grande contenitore da tavola o sputacchiera. Leggermente traslucido ma volutamente coprente per nascondere il contenuto."
        )
      : T(
          "Kleines Gefäß für Verkostungen in Grau, Rot oder Grün, laut Hersteller als persönliches oder kleines Tischgefäß gedacht. Leicht transparent, aber bewusst deckend als Sichtschutz; 610 ml Füllmenge.",
          "Small tasting vessel in grey, red or green, intended by the manufacturer as a personal or small table vessel. Slightly translucent but deliberately opaque to conceal the contents; capacity 610 ml.",
          "Petit récipient de dégustation gris, rouge ou vert, prévu par le fabricant comme récipient individuel ou petit récipient de table. Légèrement translucide mais volontairement opaque ; contenance 610 ml.",
          "Piccolo recipiente per degustazioni in grigio, rosso o verde, pensato dal produttore come contenitore personale o piccolo contenitore da tavola. Leggermente traslucido ma volutamente coprente; capacità 610 ml."
        ),
    m: [ml ? fuell(ml) : fuellAbw(2600, 2900), M.sichtschutz, liste(FARB_LABEL, ["grau", "rot", "gruen"]), M.spuel],
    v: ["grau", "rot", "gruen"].map((f, i) => [f, betrag, `${skuBasis + i * 10}`, kg, ml]),
    img: ["grau", "rot", "gruen"].map((f, i) => [
      `zalto-${s}-${i + 1}.webp`, 1066, 1600, `zgl1803_spittoon_${groesse}_${imgName[f]}_bg.jpg`,
      altPack(n, `${farbAlt[f][0]} Ausführung, Produktfoto des Herstellers vor hellem Hintergrund`, `${farbAlt[f][1]} version, manufacturer's product photo on a light background`, `version ${farbAlt[f][2]}, photo produit du fabricant sur fond clair`, `versione ${farbAlt[f][3]}, foto prodotto del produttore su sfondo chiaro`),
    ]),
    verwandt,
  };
  return zeile;
}
ZEILEN.push(restwein("restweinkaraffe-50", "Restweinkaraffe 50", 130, 117, 610, 50.9, 51010, 0.6, false, ["restweinkaraffe-250"]));
ZEILEN.push(restwein("restweinkaraffe-250", "Restweinkaraffe 250", 210, 189, null, 81.9, 61010, 1.31, true, ["restweinkaraffe-50"]));

/** @type {import("../schema.js").KatalogMarke} */
export const MARKE = Object.freeze({
  slug: "zalto",
  name: "Zalto",
  welt: "accessoires",
  herstellerUrl: "https://www.zaltoglas.at/",
  // Händlersatz nur über den Claim-Guard (dealerStatement); hier nur der Schalter.
  dealer: true,
  stand: STAND,
});

/** @type {import("../schema.js").KatalogProdukt[]} */
export const PRODUKTE = Object.freeze(ZEILEN.map(produkt));
