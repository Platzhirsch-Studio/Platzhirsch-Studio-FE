// src/lib/katalog/marken/tom-dixon.js – Tom Dixon
// Inhaber-Entscheidung Nr. 32 (31.10.2026): NUR tragbare Akku-Leuchten (das übrige Sortiment kommt aus dem Backoffice-Katalog).
// Welt "accessoires", bereich "accessoires". Kategorien: tragbare-leuchte.
//
// Quelle der Produktliste: offizieller Tom-Dixon-Shop Europa https://www.tomdixon.net/eu/ – Kategorie
// „Portable Lights“ (https://www.tomdixon.net/eu/lighting/portable, 36 Produkt-URLs nach „Load More“,
// je Farbe eine eigene URL) und EU-Sitemap (robots.txt → /eu/sitemap.xml, gleiche 36 URLs).
// Vollständigkeits-Check: qa-screenshots/wellness/produkte/vollstaendigkeit-tom-dixon.md.
//
// Preise: preis.art "verkaufspreis" (Nr. 32) = Endpreis des EU-Shops in EUR mit Lieferland
// „Austria (EUR)“ (im Länderdialog des Shops vorausgewählt und bestätigt), je Farbe, Stand 31.10.2026.
// Hinweis: Ohne Länderwahl zeigt der Shop leicht andere Preise (z. B. 310 statt 315 €); eine
// ausdrückliche Angabe „inkl. MwSt.“ nennen Produktseiten, AGB und Lieferseite nicht.
// preis.quelle = Produkt-URL der Standardfarbe; jede Farbe hat eine eigene URL (in quellen).
// Optionale Variantenfelder: sku = „SKU“ der Farbvariante. Versandgewicht/-maße nennt der Shop
// nicht (Datenblatt-Gewicht = Produktgewicht → Maß „gewicht“).
//
// Bewusst NICHT übernommen: „Bell Portable Light“ (Vorgängermodell, alle vier Farben im Abverkauf
// reduziert; Nachfolger Bell Portable Light V2 erfasst); Ersatz-Ladekabel; Werbeaussagen;
// widersprüchliche Datenblattwerte (Stone: IP44 im Text, IP20 im Datenblatt; Jack: 5 W im Text,
// 4,5 W im Datenblatt; Lichtstrom Bell V2 je Farbe 160 bzw. 220 lm) → nicht als Merkmal.
// Bilder: Galerie-Originale der Produktseiten (cdn.shopify.com/…/files/…), Originale 2018 × 2690 px
// (teils größer); einheitlich ≤ 1600 px lange Kante, WebP q82 (tools/images/optimize-katalog.mjs), Transparenz bleibt.
// Anleitung: qa-screenshots/wellness/produkte/ANLEITUNG-MARKEN.md
// Prüfen:    node --test tests/unit/wellness-produkte.test.mjs

const STAND = "2026-10-31";
const T = (de, en, fr, it) => Object.freeze({ de, en, fr, it });
const mass = (key, wert) => Object.freeze({ key, wert });
const P = "https://www.tomdixon.net/eu/lighting/portable/";
const KAT = "https://www.tomdixon.net/eu/lighting/portable";
const CDN = "https://cdn.shopify.com/s/files/1/0887/6618/5813/files/";

// Bild-Tabelle: Schlüssel → [Datei, Breite, Höhe, Original-Datei auf dem CDN]
const IMG = {
  "bell-1": ["tom-dixon-bell-portable-v2-1-opt.webp", 906, 1132, "Bell-Portable-Light-V2-High-Gloss-Burgundy.png"],
  "bell-2": ["tom-dixon-bell-portable-v2-2.webp", 1200, 1600, "Bell-Portable-Light-V2-High-Gloss-Burgundy-2.jpg"],
  "bell-3": ["tom-dixon-bell-portable-v2-3.webp", 1200, 1600, "Bell-Portable-Light-V2-High-Gloss-Burgundy-4.png"],
  "bell-4": ["tom-dixon-bell-portable-v2-4-opt.webp", 912, 1140, "Bell-Portable-Light-V2-High-Gloss-Taupe.png"],
  "bell-5": ["tom-dixon-bell-portable-v2-5-opt.webp", 904, 1130, "Bell-Portable-Light-V2-High-Gloss-Putty.jpg"],
  "bell-6": ["tom-dixon-bell-portable-v2-6-opt.webp", 902, 1128, "Bell-Portable-Light-V2-High-Gloss-Fluoro.png"],
  "bell-7": ["tom-dixon-bell-portable-v2-7.webp", 1200, 1600, "Bell-Portable-Light-Polished-Silver.png"],
  "bell-8": ["tom-dixon-bell-portable-v2-8-opt.webp", 914, 1142, "Bell-Portable-Light-V2-High-Gloss-Moss.jpg"],
  "bell-9": ["tom-dixon-bell-portable-v2-9-opt.webp", 910, 1138, "Bell-Portable-Light-V2-High-Gloss-Black.png"],
  "meltS-1": ["tom-dixon-melt-small-portable-1-opt.webp", 951, 1189, "Melt-Small-Portable-Light-Silver.png"],
  "meltS-2": ["tom-dixon-melt-small-portable-2.webp", 1200, 1600, "Melt-Small-Portable-Light-Silver-2.jpg"],
  "meltS-3": ["tom-dixon-melt-small-portable-3-opt.webp", 966, 1208, "Melt-Small-Portable-Light-Gold.png"],
  "meltS-4": ["tom-dixon-melt-small-portable-4-opt.webp", 991, 1239, "Melt-Small-Portable-Light-Fluoro.png"],
  "meltS-5": ["tom-dixon-melt-small-portable-5-opt.webp", 965, 1206, "Melt-Small-Portable-Light-Black.png"],
  "meltS-6": ["tom-dixon-melt-small-portable-6-opt.webp", 962, 1202, "Melt-Portable-Light-Copper.png"],
  "stone-1": ["tom-dixon-stone-portable-1-opt.webp", 851, 1064, "Stone-Portable-Light-Gold.png"],
  "stone-2": ["tom-dixon-stone-portable-2.webp", 1200, 1600, "Stone-Portable-Light-Gold-2.jpg"],
  "stone-3": ["tom-dixon-stone-portable-3.webp", 1200, 1600, "Stone-Portable-Light-Silver.png"],
  "pose-1": ["tom-dixon-pose-portable-1-opt.webp", 875, 1094, "Pose-Portable-Light-High-Gloss-Indigo.png"],
  "pose-2": ["tom-dixon-pose-portable-2.webp", 1200, 1600, "Pose-Portable-Light-High-Gloss-Indigo-2.jpg"],
  "pose-3": ["tom-dixon-pose-portable-3.webp", 1200, 1600, "Pose-Portable-Light-High-Gloss-Indigo-3.jpg"],
  "pose-4": ["tom-dixon-pose-portable-4-opt.webp", 892, 1115, "Pose-Portable-Light-Polished-Silver.png"],
  "pose-5": ["tom-dixon-pose-portable-5-opt.webp", 877, 1096, "Pose-Portable-Light-Polished-Gold.png"],
  "pose-6": ["tom-dixon-pose-portable-6-opt.webp", 870, 1088, "Pose-Portable-Light-High-Gloss-Kelp.png"],
  "pose-7": ["tom-dixon-pose-portable-7-opt.webp", 882, 1102, "Pose-Portable-Light-High-Gloss-Putty.png"],
  "jack-1": ["tom-dixon-jack-large-portable-1-opt.webp", 1069, 1336, "Jack-Large-Portable-Light-White_59c0965a.png"],
  "jack-2": ["tom-dixon-jack-large-portable-2.webp", 1200, 1600, "Jack-Large-Portable-Light-White-3.jpg"],
  "meltL-1": ["tom-dixon-melt-large-portable-1-opt.webp", 908, 1134, "Melt-Large-Portable-Light-Nickel-Polished-Polycarbonate.png"],
  "meltL-2": ["tom-dixon-melt-large-portable-2.webp", 1200, 1600, "Melt-Large-Portable-Light-Nickel-Polished-Polycarbonate-2.jpg"],
  "meltL-3": ["tom-dixon-melt-large-portable-3-opt.webp", 901, 1127, "Melt-Large-Portable-Light-Bronze-Polished-Polycarbonate.png"],
  "meltL-4": ["tom-dixon-melt-large-portable-4-opt.webp", 1012, 1266, "Melt-Large-Portable-Light-Smoke-Polished-Polycarbonate.png"],
  "meltL-5": ["tom-dixon-melt-large-portable-5-opt.webp", 1012, 1266, "Melt-Large-Portable-Light-Silver-Polished-Polycarbonate.png"],
  "meltL-6": ["tom-dixon-melt-large-portable-6-opt.webp", 1019, 1273, "Melt-Large-Portable-Light-Gold-Polished-Polycarbonate.png"],
  "meltL-7": ["tom-dixon-melt-large-portable-7-opt.webp", 1038, 1297, "Melt-Large-Portable-Light-Copper-Polished-Polycarbonate.png"],
  "opal-1": ["tom-dixon-melt-opal-large-portable-1-opt.webp", 900, 1125, "Melt-Opal-Large-Portable-Light-Black.png"],
  "dichroic-1": ["tom-dixon-melt-dichroic-large-portable-1-opt.webp", 902, 1128, "Melt-Dichroic-Large-Portable-Light-Silver-Polished-Polycarbonate.png"],
  "dichroic-2": ["tom-dixon-melt-dichroic-large-portable-2.webp", 1200, 1600, "Melt-Dichroic-Large-Portable-Light-Silver-Polished-Polycarbonate-2.jpg"],
  "whirl-1": ["tom-dixon-whirl-large-portable-1-opt.webp", 854, 1067, "Whirl-Large-Portable-Light-Copper-Polished-Polycarbonate.png"],
  "whirl-2": ["tom-dixon-whirl-large-portable-2.webp", 1200, 1600, "Whirl-Large-Portable-Light-Copper-Polished-Polycarbonate-2.png"],
  "whirl-3": ["tom-dixon-whirl-large-portable-3-opt.webp", 856, 1070, "Whirl-Large-Portable-Light-Gold-Polished-Polycarbonate.png"],
  "whirl-4": ["tom-dixon-whirl-large-portable-4-opt.webp", 856, 1070, "Whirl-Large-Portable-Light-Silver-Polished-Polycarbonate.png"],
  "whirlD-1": ["tom-dixon-whirl-dichroic-large-portable-1-opt.webp", 869, 1086, "Whirl-Dichroic-Large-Portable-Light-Silver-Polished-Polycarbonate.png"],
  "whirlD-2": ["tom-dixon-whirl-dichroic-large-portable-2.webp", 1200, 1600, "Whirl-Dichroic-Large-Portable-Light-Silver-Polished-Polycarbonate-2.jpg"],
};

const src = (key) => `/Images/Wellness/produkte/tom-dixon/${IMG[key][0]}`;
/** Bild-Objekt; typ "freisteller" (Standard) | "ambiente" | "detail". */
function bild(key, alt, typ) {
  const [, width, height, file] = IMG[key];
  return Object.freeze({ src: src(key), width, height, alt, quelleUrl: `${CDN}${file}`, abgerufen: STAND, ...(typ && typ !== "freisteller" ? { typ } : {}) });
}
const altF = (name, farbe) =>
  T(
    `Tom Dixon ${name} in ${farbe} – Produktfoto des Herstellers vor hellem Hintergrund`,
    `Tom Dixon ${name} in ${farbe} – manufacturer's product photo on a light background`,
    `Tom Dixon ${name} coloris ${farbe} – photo produit du fabricant sur fond clair`,
    `Tom Dixon ${name} in ${farbe} – foto prodotto del produttore su sfondo chiaro`
  );
const alt = (name, de, en, fr, it) => T(`Tom Dixon ${name} – ${de}`, `Tom Dixon ${name} – ${en}`, `Tom Dixon ${name} – ${fr}`, `Tom Dixon ${name} – ${it}`);
const FARBE = T("Farbe", "Colour", "Couleur", "Colore");

// ---------------------------------------------------------------- Vokabular
const laufzeit = (h) => T(`Betriebsdauer ${h} Stunden je Akkuladung (laut Datenblatt)`, `Operating time ${h} hours per charge (according to the data sheet)`, `Autonomie ${h} heures par charge (selon la fiche technique)`, `Autonomia ${h} ore per ricarica (secondo la scheda tecnica)`);
const ladezeit = T("Ladezeit 5 Stunden", "Charging time 5 hours", "Temps de charge 5 heures", "Tempo di ricarica 5 ore");
const kabelMagnet = T("Magnetisches Ladekabel", "Magnetic charging cable", "Câble de charge magnétique", "Cavo di ricarica magnetico");
const kabelUsbc = T("Laden über USB-C", "Charging via USB-C", "Charge par USB-C", "Ricarica tramite USB-C");
const touch3 = T("Touch-Dimmer, drei Stufen", "Touch dimmer, three steps", "Variateur tactile, trois niveaux", "Dimmer touch, tre livelli");
const taste3 = T("Dimmbar per Taste, drei Stufen", "Button dimming, three steps", "Variation par bouton, trois niveaux", "Dimmerabile tramite pulsante, tre livelli");
const ip44aussen = T("IP44, laut Hersteller für innen und außen geeignet (im Haus aufbewahren)", "IP44, suitable for indoor and outdoor use according to the manufacturer (store indoors)", "IP44, utilisable à l'intérieur et à l'extérieur selon le fabricant (à ranger à l'intérieur)", "IP44, adatta a interni ed esterni secondo il produttore (conservare all'interno)");
const ip44 = T("Schutzart IP44", "Protection class IP44", "Indice de protection IP44", "Grado di protezione IP44");
const cri = "CRI > 90";
const lm = (n) => `${n} lm`;
const k = (s) => s;
const design = (y) => T(`Designjahr ${y}`, `Year of design ${y}`, `Année de création ${y}`, `Anno di design ${y}`);
const deutschland = T("Gefertigt in Deutschland", "Made in Germany", "Fabriqué en Allemagne", "Prodotta in Germania");
const stativ = T("Mit Dreibeinfuß und Trageriemen zum Aufhängen", "With tripod base and strap for hanging", "Avec trépied et sangle de suspension", "Con treppiede e cinghia per appenderla");
const matLarge = T("Material: Polycarbonat, Stahl, Aluminium", "Material: polycarbonate, mild steel, aluminium", "Matériaux : polycarbonate, acier doux, aluminium", "Materiali: policarbonato, acciaio dolce, alluminio");
const spiegel = T("Ausgeschaltet verspiegelt, eingeschaltet durchscheinend", "Mirrored when off, translucent when lit", "Effet miroir éteinte, translucide allumée", "Specchiata da spenta, traslucida da accesa");

/** Produkt aus einer Datenzeile. f: [id, Farbe, SKU, Preis, Bild-Schlüssel, URL-Endung] – erste Farbe = Standard. */
function produkt(r) {
  const urls = r.f.map((x) => `${P}${x[5]}`);
  return Object.freeze({
    slug: `tom-dixon-${r.s}`,
    marke: "tom-dixon",
    bereich: "accessoires",
    kategorie: "tragbare-leuchte",
    name: r.n,
    kurz: r.kurz,
    merkmale: Object.freeze(r.m),
    masse: Object.freeze(r.masse),
    bilder: Object.freeze(r.bilder),
    herstellerUrl: urls[0],
    quellen: Object.freeze([...new Set([...urls, KAT])]),
    stand: STAND,
    ...(r.verwandt ? { verwandt: Object.freeze(r.verwandt) } : {}),
    preis: Object.freeze({
      art: "verkaufspreis",
      varianten: Object.freeze(r.f.map(([, name, sku, betrag]) => Object.freeze({ name, betrag, sku }))),
      stand: STAND,
      quelle: urls[0],
    }),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: FARBE,
        optionen: Object.freeze(
          r.f.map(([id, name, sku, , img], i) =>
            Object.freeze({ id, name, code: sku, bilder: Object.freeze([i === 0 ? src(img) : bild(img, altF(r.n, name))]), ...(i === 0 ? { standard: true } : {}) })
          )
        ),
      }),
    ]),
  });
}

const BELL = "Bell Portable Light V2";
const MELTS = "Melt Small Portable Light";
const STONE = "Stone Portable Light";
const POSE = "Pose Portable Light";
const JACK = "Jack Large Portable Light";
const MELTL = "Melt Large Portable Light";
const OPAL = "Melt Opal Large Portable Light";
const DICH = "Melt Dichroic Large Portable Light";
const WHIRL = "Whirl Large Portable Light";
const WHIRLD = "Whirl Dichroic Large Portable Light";

const ZEILEN = [
  {
    s: "bell-portable-light-v2", n: BELL,
    kurz: T(
      "Tragbare Leuchte mit hochglänzendem, kuppelförmigem Schirm und verdecktem Diffusor. Laut Tom Dixon 6–9 Stunden Betrieb ohne Kabel, umschaltbar zwischen 2700 und 3000 K, stufenlos dimmbar mit Memory-Funktion.",
      "Portable lamp with a high-gloss domed shade and a concealed diffuser. According to Tom Dixon 6–9 hours of cordless use, switchable between 2700 and 3000 K, continuously dimmable with a memory function.",
      "Lampe portable à abat-jour bombé brillant et diffuseur dissimulé. Selon Tom Dixon, 6 à 9 heures d'utilisation sans fil, commutable entre 2700 et 3000 K, variation continue avec fonction mémoire.",
      "Lampada portatile con diffusore a cupola lucido e diffusore nascosto. Secondo Tom Dixon 6–9 ore di funzionamento senza cavo, commutabile tra 2700 e 3000 K, dimmerabile in continuo con funzione memoria."
    ),
    m: [
      laufzeit("6–9"), ladezeit,
      T("Magnetisches Ladekabel auf USB-C (200 cm)", "Magnetic to USB-C charging cable (200 cm)", "Câble de charge magnétique vers USB-C (200 cm)", "Cavo di ricarica magnetico a USB-C (200 cm)"),
      T("Farbtemperatur umschaltbar 2700/3000 K (laut Produktbeschreibung)", "Colour temperature switchable 2700/3000 K (according to the product description)", "Température de couleur commutable 2700/3000 K (selon la description)", "Temperatura di colore commutabile 2700/3000 K (secondo la descrizione)"),
      T("Stufenlos dimmbar per Touch, mit Memory-Funktion", "Continuous touch dimming with memory function", "Variation tactile continue avec fonction mémoire", "Dimmer touch continuo con funzione memoria"),
      ip44aussen, "3 W LED", cri, design(2021),
    ],
    masse: [mass("hoehe", "28 cm"), mass("durchmesser", "19 cm"), mass("gewicht", "1,36 kg")],
    bilder: [
      bild("bell-1", altF(BELL, "High-Gloss Burgundy")),
      bild("bell-2", alt(BELL, "Burgundy auf einem Beistelltisch neben zwei Sesseln vor einem Fenster am Abend", "Burgundy on a side table next to two armchairs by a window in the evening", "Burgundy sur une table d'appoint près de deux fauteuils devant une fenêtre le soir", "Burgundy su un tavolino accanto a due poltrone davanti a una finestra di sera"), "ambiente"),
      bild("bell-3", alt(BELL, "Detail des magnetischen Ladekabels am Sockel", "detail of the magnetic charging cable at the base", "détail du câble de charge magnétique au socle", "dettaglio del cavo di ricarica magnetico alla base"), "detail"),
    ],
    f: [
      ["high-gloss-burgundy", "High-Gloss Burgundy", "BEPO11BUUN", 220, "bell-1", "bell-portable-light-high-gloss-burgundy-bepo11buun"],
      ["high-gloss-taupe", "High-Gloss Taupe", "BEPO11MUUN", 220, "bell-4", "bell-portable-light-high-gloss-taupe-bepo11muun"],
      ["high-gloss-putty", "High-Gloss Putty", "BEPO11GRUN", 220, "bell-5", "bell-portable-light-high-gloss-putty-bepo11grun"],
      ["high-gloss-fluoro", "High-Gloss Fluoro", "BEPO11FLUN", 220, "bell-6", "bell-portable-light-high-gloss-fluoro-bepo11flun"],
      ["polished-silver", "Polished Silver", "BEPO11SSUN", 280, "bell-7", "bell-portable-light-v2-polished-silver"],
      ["high-gloss-moss", "High-Gloss Moss", "BEPO11MOUN", 220, "bell-8", "bell-portable-light-high-gloss-moss-bepo11moun"],
      ["high-gloss-black", "High-Gloss Black", "BEPO11BLUN", 220, "bell-9", "bell-portable-light-high-gloss-black-bepo01blun"],
    ],
    verwandt: ["tom-dixon-pose-portable-light", "tom-dixon-melt-small-portable-light"],
  },
  {
    s: "melt-small-portable-light", n: MELTS,
    kurz: T(
      "Kleine tragbare Leuchte der Melt-Kollektion: ausgeschaltet verspiegelt, eingeschaltet durchscheinend wie heiß geblasenes Glas. Laut Tom Dixon für innen und außen, mit bis zu 10 Stunden Licht und magnetischem Ladekabel.",
      "Small portable lamp from the Melt collection: mirrored when off, translucent like hot-blown glass when lit. According to Tom Dixon for indoor and outdoor use, with up to 10 hours of light and a magnetic charging cable.",
      "Petite lampe portable de la collection Melt : effet miroir éteinte, translucide comme du verre soufflé allumée. Selon Tom Dixon, pour l'intérieur et l'extérieur, jusqu'à 10 heures de lumière, câble de charge magnétique.",
      "Piccola lampada portatile della collezione Melt: specchiata da spenta, traslucida come vetro soffiato da accesa. Secondo Tom Dixon per interni ed esterni, fino a 10 ore di luce e cavo di ricarica magnetico."
    ),
    m: [
      laufzeit("7–10"), ladezeit, kabelMagnet, spiegel, touch3, ip44, "2,5 W LED", lm(100), k("3000 K"), cri,
      T("Material laut Datenblatt: PET und ABS", "Material according to the data sheet: PET and ABS", "Matériaux selon la fiche : PET et ABS", "Materiali secondo la scheda: PET e ABS"),
      deutschland, design(2021),
      T("Die Farbe Copper führt der Shop als „Melt Portable Light“", "The shop lists the Copper colour as “Melt Portable Light”", "La boutique présente le coloris Copper sous le nom « Melt Portable Light »", "Il negozio elenca il colore Copper come “Melt Portable Light”"),
    ],
    masse: [mass("hoehe", "28,5 cm"), mass("durchmesser", "13 cm"), mass("gewicht", "0,45 kg")],
    bilder: [
      bild("meltS-1", altF(MELTS, "Silver")),
      bild("meltS-2", alt(MELTS, "Silver eingeschaltet auf einem Sideboard neben Büchern und einer Schale", "Silver switched on, on a sideboard next to books and a bowl", "Silver allumée sur un buffet à côté de livres et d'un bol", "Silver accesa su una credenza accanto a libri e a una ciotola"), "ambiente"),
    ],
    f: [
      ["silver", "Silver", "MEPO01SSUN", 315, "meltS-1", "melt-small-portable-light-silver-mepo01ssun"],
      ["gold", "Gold", "MEPO01GOUN", 315, "meltS-3", "melt-small-portable-light-gold-mepo01goun"],
      ["fluoro", "Fluoro", "MEPO01FLUN", 255, "meltS-4", "melt-small-portable-light-fluoro-mepo01flun"],
      ["black", "Black", "MEPO01BKUN", 255, "meltS-5", "melt-small-portable-light-black-mepo01bkun"],
      ["copper", "Copper", "MEPO01COUN", 315, "meltS-6", "melt-portable-light-copper-mepo01coun"],
    ],
    verwandt: ["tom-dixon-melt-large-portable-light"],
  },
  {
    s: "stone-portable-light", n: STONE,
    kurz: T(
      "Tragbare Leuchte aus weißem Marmor mit integrierter LED unter einer Metallkappe; als Naturstein hat jedes Stück eine eigene Maserung. Laut Datenblatt 6–9 Stunden Betrieb und dreistufiger Touch-Dimmer.",
      "Portable lamp made of white marble with an integrated LED beneath a metal cap; as a natural stone, each piece has its own veining. According to the data sheet 6–9 hours of use and a three-step touch dimmer.",
      "Lampe portable en marbre blanc avec LED intégrée sous un capuchon métallique ; pierre naturelle, chaque pièce a son propre veinage. Selon la fiche technique, 6 à 9 heures d'utilisation et variateur tactile à trois niveaux.",
      "Lampada portatile in marmo bianco con LED integrato sotto una calotta in metallo; essendo pietra naturale, ogni pezzo ha venature proprie. Secondo la scheda tecnica 6–9 ore di funzionamento e dimmer touch a tre livelli."
    ),
    m: [
      laufzeit("6–9"), ladezeit,
      T("Ladekabel USB-A auf Magnet", "USB-A to magnetic charging cable", "Câble de charge USB-A vers magnétique", "Cavo di ricarica da USB-A a magnetico"),
      touch3, "3 W LED", lm(160), k("3000 K"), cri,
      T("Sockel und Schirm aus Marmor, Maserung je Stück verschieden", "Base and shade made of marble, veining varies from piece to piece", "Socle et abat-jour en marbre, veinage différent pour chaque pièce", "Base e diffusore in marmo, venature diverse per ogni pezzo"),
      design(2021),
    ],
    masse: [mass("hoehe", "19 cm"), mass("durchmesser", "16 cm"), mass("gewicht", "2,3 kg")],
    bilder: [
      bild("stone-1", altF(STONE, "Gold")),
      bild("stone-2", alt(STONE, "Gold eingeschaltet auf einem Wandregal neben Büchern und einer Obstschale", "Gold switched on, on a wall shelf next to books and a fruit bowl", "Gold allumée sur une étagère murale près de livres et d'une coupe de fruits", "Gold accesa su una mensola accanto a libri e a una fruttiera"), "ambiente"),
    ],
    f: [
      ["gold", "Gold", "STPO01UN", 420, "stone-1", "stone-portable-light-gold-stpo01un"],
      ["silver", "Silver", "STPO01SSUN", 420, "stone-3", "stone-portable-light-silver-stpo01ssun"],
    ],
  },
  {
    s: "pose-portable-light", n: POSE,
    kurz: T(
      "Kabellose Leuchte mit Spezialoptik, die das Licht zu einem gebündelten Strahl formt; der Kopf lässt sich neigen und drehen. Laut Tom Dixon 6–9 Stunden Akkubetrieb, dreistufig dimmbar, Farbtemperatur 2700 oder 3000 K.",
      "Cordless lamp with special optics that focus the light into a concentrated beam; the head tilts and rotates. According to Tom Dixon 6–9 hours of battery use, three-step dimming, colour temperature 2700 or 3000 K.",
      "Lampe sans fil à optique spéciale qui concentre la lumière en un faisceau ; la tête s'incline et pivote. Selon Tom Dixon, 6 à 9 heures sur batterie, variation en trois niveaux, température de couleur 2700 ou 3000 K.",
      "Lampada senza fili con ottica speciale che concentra la luce in un fascio; la testa si inclina e ruota. Secondo Tom Dixon 6–9 ore a batteria, dimmerabile in tre livelli, temperatura di colore 2700 o 3000 K."
    ),
    m: [
      laufzeit("6–9"), ladezeit,
      T("Ladekabel USB-A auf Magnet", "USB-A to magnetic charging cable", "Câble de charge USB-A vers magnétique", "Cavo di ricarica da USB-A a magnetico"),
      T("Kopf neig- und drehbar", "Head tilts and rotates", "Tête inclinable et orientable", "Testa inclinabile e girevole"),
      touch3,
      T("Farbtemperatur umschaltbar 2700/3000 K", "Colour temperature switchable 2700/3000 K", "Température de couleur commutable 2700/3000 K", "Temperatura di colore commutabile 2700/3000 K"),
      T("Laut Datenblatt IP20 (Innenbereich)", "IP20 according to the data sheet (indoor)", "IP20 selon la fiche technique (intérieur)", "IP20 secondo la scheda tecnica (interni)"),
      "3 W LED", lm(220), cri, design(2024),
    ],
    masse: [mass("hoehe", "25 cm"), mass("durchmesser", "17,5 cm"), mass("gewicht", "1,04 kg")],
    bilder: [
      bild("pose-1", altF(POSE, "High-Gloss Indigo")),
      bild("pose-2", alt(POSE, "Indigo eingeschaltet auf einem Holztisch über einem aufgeschlagenen Bildband", "Indigo switched on, on a wooden table above an open picture book", "Indigo allumée sur une table en bois au-dessus d'un livre ouvert", "Indigo accesa su un tavolo in legno sopra un libro illustrato aperto"), "ambiente"),
      bild("pose-3", alt(POSE, "Detail des eingeschalteten Leuchtkopfs mit Optik", "detail of the lit head with its optics", "détail de la tête allumée avec son optique", "dettaglio della testa accesa con l'ottica"), "detail"),
    ],
    f: [
      ["high-gloss-indigo", "High-Gloss Indigo", "POPO01INUN", 265, "pose-1", "pose-portable-light-high-gloss-indigo-popo01inun"],
      ["polished-silver", "Polished Silver", "POPO01SSUN", 330, "pose-4", "pose-portable-light-polished-silver-popo01ssun"],
      ["polished-gold", "Polished Gold", "POPO01GOUN", 330, "pose-5", "pose-portable-light-polished-gold-popo01goun"],
      ["high-gloss-kelp", "High-Gloss Kelp", "POPO01KEUN", 265, "pose-6", "pose-portable-light-high-gloss-kelp-popo01keun"],
      ["high-gloss-putty", "High-Gloss Putty", "POPO01PUUN", 265, "pose-7", "pose-portable-light-high-gloss-putty-popo01puun"],
    ],
    verwandt: ["tom-dixon-bell-portable-light-v2"],
  },
  {
    s: "jack-large-portable-light", n: JACK,
    kurz: T(
      "Große, leichte Leuchte aus rotationsgeformtem Polyethylen für drinnen und draußen, stapelbar, mit mattweißem Schirm und warmweißem Licht (2700 K). Laut Tom Dixon bis zu 8 Stunden Licht, Schutzart IP65, Fernbedienung für bis zu drei Leuchten.",
      "Large, lightweight lamp made of rotation-moulded polyethylene for indoor and outdoor use, stackable, with a matt white shade and warm white light (2700 K). According to Tom Dixon up to 8 hours of light, IP65, remote control for up to three lights.",
      "Grande lampe légère en polyéthylène rotomoulé pour l'intérieur et l'extérieur, empilable, à abat-jour blanc mat et lumière blanc chaud (2700 K). Selon Tom Dixon, jusqu'à 8 heures de lumière, IP65, télécommande pour trois lampes maximum.",
      "Grande lampada leggera in polietilene stampato a rotazione per interni ed esterni, impilabile, con diffusore bianco opaco e luce bianca calda (2700 K). Secondo Tom Dixon fino a 8 ore di luce, IP65, telecomando per un massimo di tre lampade."
    ),
    m: [
      laufzeit("6–8"), ladezeit,
      T("Laden über USB-C (Kabel USB-C auf USB-C)", "Charging via USB-C (USB-C to USB-C cable)", "Charge par USB-C (câble USB-C vers USB-C)", "Ricarica tramite USB-C (cavo da USB-C a USB-C)"),
      T("Stufenlos dimmbar per Taste und Fernbedienung; eine Fernbedienung steuert bis zu drei Leuchten", "Continuously dimmable via button and remote; one remote controls up to three lights", "Variation continue par bouton et télécommande ; une télécommande pilote jusqu'à trois lampes", "Dimmerabile in continuo tramite pulsante e telecomando; un telecomando gestisce fino a tre lampade"),
      T("Schutzart IP65, für den Außenbereich", "Protection class IP65, for outdoor use", "Indice IP65, pour l'extérieur", "Grado IP65, per esterni"),
      T("Rotationsgeformtes Polyethylen, stapelbar; LED und elektrische Bauteile austauschbar", "Rotation-moulded polyethylene, stackable; LED and electrical components replaceable", "Polyéthylène rotomoulé, empilable ; LED et composants électriques remplaçables", "Polietilene stampato a rotazione, impilabile; LED e componenti elettrici sostituibili"),
      k("2700 K"), lm(500), cri, design(2024),
    ],
    masse: [mass("hoehe", "52 cm"), mass("breite", "57 cm"), mass("gewicht", "3,4 kg")],
    bilder: [
      bild("jack-1", altF(JACK, "White")),
      bild("jack-2", alt(JACK, "Detail des schwarzen Sockels mit Bedienelement", "detail of the black base with control", "détail du socle noir avec commande", "dettaglio della base nera con comando"), "detail"),
    ],
    f: [["white", "White", "JAPO01WHUN", 480, "jack-1", "jack-large-portable-light-white-japo01whun"]],
  },
  {
    s: "melt-large-portable-light", n: MELTL,
    kurz: T(
      "Große tragbare Melt-Leuchte mit Dreibeinfuß und Trageriemen zum Aufhängen, ausgeschaltet verspiegelt und eingeschaltet durchscheinend. Schutzart IP44 für innen und außen, laut Datenblatt 6–8 Stunden Betrieb, gefertigt in Deutschland.",
      "Large portable Melt lamp with tripod base and a strap for hanging, mirrored when off and translucent when lit. IP44 for indoor and outdoor use, 6–8 hours of operation according to the data sheet, made in Germany.",
      "Grande lampe portable Melt avec trépied et sangle de suspension, effet miroir éteinte et translucide allumée. IP44 pour l'intérieur et l'extérieur, 6 à 8 heures d'autonomie selon la fiche, fabriquée en Allemagne.",
      "Grande lampada portatile Melt con treppiede e cinghia per appenderla, specchiata da spenta e traslucida da accesa. IP44 per interni ed esterni, 6–8 ore di funzionamento secondo la scheda, prodotta in Germania."
    ),
    m: [laufzeit("6–8"), ladezeit, kabelUsbc, stativ, spiegel, taste3, ip44aussen, "4,5 W LED", lm(500), k("3000 K"), cri, matLarge, deutschland, design(2024)],
    masse: [mass("hoehe", "57 cm"), mass("durchmesser", "50 cm"), mass("gewicht", "2,9 kg")],
    bilder: [
      bild("meltL-1", altF(MELTL, "Nickel Polished Polycarbonate")),
      bild("meltL-2", alt(MELTL, "Nickel an einem Baum hängend am Wasser in der Abenddämmerung", "Nickel hanging from a tree by the water at dusk", "Nickel suspendue à un arbre au bord de l'eau au crépuscule", "Nickel appesa a un albero in riva all'acqua al tramonto"), "ambiente"),
    ],
    f: [
      ["nickel", "Nickel Polished Polycarbonate", "MESP01NI-PHUN01M1", 1345, "meltL-1", "melt-large-portable-light-nickel-polished-polycarbonate-mesp01ni-phun01m1"],
      ["bronze", "Bronze Polished Polycarbonate", "MESP01BR-PHUN01M1", 1345, "meltL-3", "melt-large-portable-light-bronze-polished-polycarbonate-mesp01br-phun01m1"],
      ["smoke", "Smoke Polished Polycarbonate", "MESP01SM-PHUN01M1", 1345, "meltL-4", "melt-large-portable-light-smoke-polished-polycarbonate-mesp01sm-phun01m1"],
      ["silver", "Silver Polished Polycarbonate", "MESP01CH-PHUN01M1", 1345, "meltL-5", "melt-large-portable-light-silver-polished-polycarbonate-mesp01ch-phun01m1"],
      ["gold", "Gold Polished Polycarbonate", "MESP01GO-PHUN01M1", 1345, "meltL-6", "melt-large-portable-light-gold-polished-polycarbonate-mesp01go-phun01m1"],
      ["copper", "Copper Polished Polycarbonate", "MESP01CO-PHUN01M1", 1345, "meltL-7", "melt-large-portable-light-copper-polished-polycarbonate-mesp01co-phun01m1"],
    ],
    verwandt: ["tom-dixon-melt-opal-large-portable-light", "tom-dixon-melt-dichroic-large-portable-light", "tom-dixon-melt-small-portable-light"],
  },
  {
    s: "melt-opal-large-portable-light", n: OPAL,
    kurz: T(
      "Große tragbare Melt-Leuchte mit Schirm aus weiß getöntem, opalem Polycarbonat, die eingeschaltet als gleichmäßig leuchtende Kugel wirkt. Mit Dreibeinfuß und Trageriemen, IP44, laut Datenblatt 6–8 Stunden Betrieb.",
      "Large portable Melt lamp with a shade of white-tinted opal polycarbonate that appears as an evenly glowing orb when lit. With tripod base and strap, IP44, 6–8 hours of operation according to the data sheet.",
      "Grande lampe portable Melt à abat-jour en polycarbonate opale teinté blanc, qui forme une sphère lumineuse homogène une fois allumée. Avec trépied et sangle, IP44, 6 à 8 heures d'autonomie selon la fiche.",
      "Grande lampada portatile Melt con diffusore in policarbonato opalino tinto bianco, che da accesa appare come una sfera luminosa uniforme. Con treppiede e cinghia, IP44, 6–8 ore di funzionamento secondo la scheda."
    ),
    m: [
      laufzeit("6–8"), ladezeit, kabelUsbc, stativ,
      T("Schirm aus weiß getöntem, opalem Polycarbonat; Gestell schwarz", "Shade of white-tinted opal polycarbonate; black frame", "Abat-jour en polycarbonate opale teinté blanc ; structure noire", "Diffusore in policarbonato opalino tinto bianco; struttura nera"),
      taste3, ip44, "4,5 W LED", lm(500), k("3000 K"), cri, deutschland, design(2024),
    ],
    masse: [mass("hoehe", "57 cm"), mass("breite", "50 cm"), mass("gewicht", "2,8 kg")],
    bilder: [bild("opal-1", altF(OPAL, "Black"))],
    f: [["black", "Black", "MESP01OP-PHUN01M1", 975, "opal-1", "melt-opal-large-portable-light-black-mesp01op-phun01m1"]],
    verwandt: ["tom-dixon-melt-large-portable-light"],
  },
  {
    s: "melt-dichroic-large-portable-light", n: DICH,
    kurz: T(
      "Große tragbare Melt-Leuchte mit dichroitischem Diffusor: Eine mehrlagige PVD-Beschichtung wirft wechselnde Farbreflexe in den Schirm. Mit Dreibeinfuß und Trageriemen, IP44, laut Datenblatt 6–8 Stunden Betrieb.",
      "Large portable Melt lamp with a dichroic diffuser: a multi-layer PVD coating casts changing colour reflections into the shade. With tripod base and strap, IP44, 6–8 hours of operation according to the data sheet.",
      "Grande lampe portable Melt à diffuseur dichroïque : un revêtement PVD multicouche projette des reflets colorés changeants dans l'abat-jour. Avec trépied et sangle, IP44, 6 à 8 heures d'autonomie selon la fiche.",
      "Grande lampada portatile Melt con diffusore dicroico: un rivestimento PVD multistrato proietta riflessi di colore cangianti nel diffusore. Con treppiede e cinghia, IP44, 6–8 ore di funzionamento secondo la scheda."
    ),
    m: [
      laufzeit("6–8"), ladezeit, kabelUsbc, stativ,
      T("Dichroitischer Diffusor mit mehrlagiger PVD-Beschichtung", "Dichroic diffuser with multi-layer PVD coating", "Diffuseur dichroïque à revêtement PVD multicouche", "Diffusore dicroico con rivestimento PVD multistrato"),
      taste3, ip44, "4,5 W LED", lm(500), k("3000 K"), cri, matLarge, deutschland, design(2024),
    ],
    masse: [mass("hoehe", "57 cm"), mass("breite", "50 cm"), mass("gewicht", "2,8 kg")],
    bilder: [
      bild("dichroic-1", altF(DICH, "Silver Polished Polycarbonate")),
      bild("dichroic-2", alt(DICH, "auf dem Boden eines Wohnraums neben Sofa und Regal", "on the floor of a living room next to a sofa and shelving", "posée au sol d'un salon près d'un canapé et d'une étagère", "sul pavimento di un soggiorno accanto a divano e scaffale"), "ambiente"),
    ],
    f: [["silver", "Silver Polished Polycarbonate", "MESP01CHD-PHUN01M1", 1380, "dichroic-1", "melt-dichroic-large-portable-light-silver-polished-polycarbonate-mesp01chd-phun01m1"]],
    verwandt: ["tom-dixon-melt-large-portable-light", "tom-dixon-whirl-dichroic-large-portable-light"],
  },
  {
    s: "whirl-large-portable-light", n: WHIRL,
    kurz: T(
      "Große tragbare Leuchte mit spiralförmig gedrehtem, verspiegeltem Schirm aus Polycarbonat, angelehnt an die Op-Art. Mit Dreibeinfuß und Trageriemen, IP44 für innen und außen, laut Datenblatt 6–8 Stunden Betrieb, gefertigt in Deutschland.",
      "Large portable lamp with a spiralling, mirrored polycarbonate shade inspired by op art. With tripod base and strap, IP44 for indoor and outdoor use, 6–8 hours of operation according to the data sheet, made in Germany.",
      "Grande lampe portable à abat-jour spiralé en polycarbonate miroir, inspiré de l'op art. Avec trépied et sangle, IP44 pour l'intérieur et l'extérieur, 6 à 8 heures d'autonomie selon la fiche, fabriquée en Allemagne.",
      "Grande lampada portatile con diffusore a spirale in policarbonato specchiato, ispirato all'op art. Con treppiede e cinghia, IP44 per interni ed esterni, 6–8 ore di funzionamento secondo la scheda, prodotta in Germania."
    ),
    m: [laufzeit("6–8"), kabelUsbc, stativ, taste3, ip44aussen, "4,5 W LED", lm(500), k("3000 K"), cri, matLarge, deutschland, design(2024)],
    masse: [mass("hoehe", "54 cm"), mass("durchmesser", "45 cm"), mass("gewicht", "2,6 kg (Copper 2,62 kg)")],
    bilder: [
      bild("whirl-1", altF(WHIRL, "Copper Polished Polycarbonate")),
      bild("whirl-2", alt(WHIRL, "Copper auf dem Boden eines Wohnraums vor einer Holzwand", "Copper on the floor of a living room in front of a wooden wall", "Copper posée au sol d'un salon devant un mur en bois", "Copper sul pavimento di un soggiorno davanti a una parete in legno"), "ambiente"),
    ],
    f: [
      ["copper", "Copper Polished Polycarbonate", "WHSP01CO-PHUN01M1", 980, "whirl-1", "whirl-large-portable-light-copper-polished-polycarbonate-whsp01co-phun01m1"],
      ["gold", "Gold Polished Polycarbonate", "WHSP01GO-PHUN01M1", 980, "whirl-3", "whirl-large-portable-light-gold-polished-polycarbonate-whsp01go-phun01m1"],
      ["silver", "Silver Polished Polycarbonate", "WHSP01CH-PHUN01M1", 980, "whirl-4", "whirl-large-portable-light-silver-polished-polycarbonate-whsp01ch-phun01m1"],
    ],
    verwandt: ["tom-dixon-whirl-dichroic-large-portable-light", "tom-dixon-melt-large-portable-light"],
  },
  {
    s: "whirl-dichroic-large-portable-light", n: WHIRLD,
    kurz: T(
      "Große tragbare Whirl-Leuchte mit spiralförmigem Schirm und dichroitischem Diffusor, dessen PVD-Beschichtung wechselnde Farbreflexe erzeugt. Mit Dreibeinfuß und Trageriemen, IP44, laut Datenblatt 6–8 Stunden Betrieb.",
      "Large portable Whirl lamp with a spiralling shade and a dichroic diffuser whose PVD coating creates changing colour reflections. With tripod base and strap, IP44, 6–8 hours of operation according to the data sheet.",
      "Grande lampe portable Whirl à abat-jour spiralé et diffuseur dichroïque, dont le revêtement PVD crée des reflets colorés changeants. Avec trépied et sangle, IP44, 6 à 8 heures d'autonomie selon la fiche.",
      "Grande lampada portatile Whirl con diffusore a spirale e diffusore dicroico, il cui rivestimento PVD crea riflessi di colore cangianti. Con treppiede e cinghia, IP44, 6–8 ore di funzionamento secondo la scheda."
    ),
    m: [
      laufzeit("6–8"), ladezeit, kabelUsbc, stativ,
      T("Dichroitischer Diffusor mit mehrlagiger PVD-Beschichtung", "Dichroic diffuser with multi-layer PVD coating", "Diffuseur dichroïque à revêtement PVD multicouche", "Diffusore dicroico con rivestimento PVD multistrato"),
      taste3, ip44, "4,5 W LED", lm(500), k("3000 K"), cri, matLarge, deutschland, design(2024),
    ],
    masse: [mass("hoehe", "54 cm"), mass("breite", "45 cm"), mass("gewicht", "2,6 kg")],
    bilder: [
      bild("whirlD-1", altF(WHIRLD, "Silver Polished Polycarbonate")),
      bild("whirlD-2", alt(WHIRLD, "eingeschaltet auf dem Boden vor einem Vorhang", "switched on, on the floor in front of a curtain", "allumée, posée au sol devant un rideau", "accesa, sul pavimento davanti a una tenda"), "ambiente"),
    ],
    f: [["silver", "Silver Polished Polycarbonate", "WHSP01CHD-PHUN01M1", 1015, "whirlD-1", "whirl-dichroic-large-portable-light-silver-polished-polycarbonate-whsp01chd-phun01m1"]],
    verwandt: ["tom-dixon-whirl-large-portable-light", "tom-dixon-melt-dichroic-large-portable-light"],
  },
];

/** @type {import("../schema.js").KatalogMarke} */
export const MARKE = Object.freeze({
  slug: "tom-dixon",
  name: "Tom Dixon",
  welt: "accessoires",
  herstellerUrl: "https://www.tomdixon.net/eu/",
  // Händlersatz nur über den Claim-Guard (dealerStatement); hier nur der Schalter.
  dealer: true,
  stand: STAND,
});

/** @type {import("../schema.js").KatalogProdukt[]} */
export const PRODUKTE = Object.freeze(ZEILEN.map(produkt));
