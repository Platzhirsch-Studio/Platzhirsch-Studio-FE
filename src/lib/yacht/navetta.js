// src/lib/yacht/navetta.js
// Reference "Minotti auf See" on /de/yacht-interior: photos of the Custom Line
// Navetta 42 (2018) from Minotti's reference page
// https://www.minotti.com/de/navetta-42custom-line_2 – owner decision
// 27.10.2026 (Marktresearch/digital/features/yacht-minotti-navetta42-bilder.md).
// Rules:
// - REAL photos, not AI: no KI label, never mixed with the AI concepts.
// - Unchanged (Minotti condition): object-contain in a frame of the image's
//   own ratio, no crop, no filter, no overlay; only proportional scaling and
//   format conversion (next/image).
// - Visible credit at every image (CREDIT).
// - Not a Platzhirsch project: the text says so (DISCLAIMER).
// - Rights: Minotti SpA + Custom Line/Ferretti – written release by mail
//   (28.10.2026, Inhaber-Entscheidung Nr. 11) → NAVETTA_RELEASED = true, the
//   chapter is public and the page indexable.
// - Products are named as Minotti lists them; no links until each one is
//   checked live in the catalogue (src/lib/yacht/catalog.js).
// Pure module (no imports), so node --test can load it.

export const NAVETTA_DIR = "/labs/yacht/minotti-navetta42";

/**
 * Schriftliche Freigabe von Minotti UND Custom Line liegt vor: per Mail vom
 * 28.10.2026 (Inhaber-Entscheidung Nr. 11, 29.10.2026). Die fünf gezeigten
 * Fotos liegen unverändert in public${NAVETTA_DIR} (Kopie aus
 * NAVETTA_SOURCE_DIR); Bedingungen bleiben: keine Veränderung, Bildnachweis
 * (CREDIT) an jedem Bild, Hinweis „nicht von Platzhirsch“ (DISCLAIMER).
 */
export const NAVETTA_RELEASED = true;

/** Ablage der unveränderten Originale (Repo-relativ, nicht ausgeliefert). */
export const NAVETTA_SOURCE_DIR = "Herstellermaterial/Minotti/yacht-navetta42";

export const CREDIT = "Foto: Courtesy of Custom Line · Projekt: Custom Line Navetta 42 · Möbel: Minotti";
export const DISCLAIMER = "Referenzprojekt von Minotti – nicht von Platzhirsch eingerichtet.";

/** Images in display order: [0] is the large one, [1..4] the calm row. */
export const NAVETTA_IMAGES = [
  {
    file: "30395_z_03_Minotti_CustomLine_Navetta42_1.jpg",
    width: 1600,
    height: 1000,
    alt: "Überdachtes Achterdeck der Custom Line Navetta 42: langer Esstisch mit dunklen Geflechtstühlen, dahinter ein helles Rundsofa mit türkisen Kissen, Blick auf Meer und bewaldete Küste.",
    title: "Achterdeck",
  },
  {
    file: "30396_z_04_Minotti_CustomLine_Navetta42_1.jpg",
    width: 1600,
    height: 1000,
    alt: "Salon der Navetta 42 mit türkisem Teppich, hellem Sofa und zwei runden Sesseln; durch die offene Glasfront sieht man den Esstisch auf dem Achterdeck.",
    title: "Salon zum Achterdeck",
  },
  {
    file: "30398_z_05_Minotti_CustomLine_Navetta42_1.jpg",
    width: 1600,
    height: 1000,
    alt: "Lounge im Salon: helle Ecksofas mit türkisen und silbernen Kissen, ein Beistelltisch aus Glas und Metall, Panoramafenster zu beiden Seiten.",
    title: "Lounge",
  },
  {
    file: "30397_z_06_Minotti_CustomLine_Navetta42_1.jpg",
    width: 1600,
    height: 1000,
    alt: "Eignerkabine mit Bett in Grau und Weiß, zwei Sesseln am offenen Balkon und einer Kommode mit Leopardenmotiv.",
    title: "Eignerkabine",
  },
  {
    file: "30393_z_01_Minotti_CustomLine_Navetta42__1.jpg",
    width: 1415,
    height: 1000,
    alt: "Luftbild des Hecks: Rundsofa mit Tischen auf dem Achterdeck und zwei gestreifte Sitzsäcke auf der ausgeklappten Badeplattform über dunkelblauem Wasser.",
    title: "Heck von oben",
  },
];

/** Minotti products on board as Minotti lists them (text only, no links). */
export const NAVETTA_PRODUCTS = {
  outdoor: ["Rivera", "Florida", "Bellagio Outdoor", "Alison Iroko Outdoor", "Cesar Outdoor"],
  indoor: ["Lawrence", "Lawrence Clan", "Jacob", "Russell", "Freeman", "Owens"],
};

export const navettaSrc = (img) => `${NAVETTA_DIR}/${img.file}`;

// English captions for /en/yacht-interior (Welle 2, team EN-Yacht-Sofa,
// 29.10.2026): same facts, same conditions (credit at every image, disclaimer).
export const CREDIT_EN = "Photo: Courtesy of Custom Line · Project: Custom Line Navetta 42 · Furniture: Minotti";
export const DISCLAIMER_EN = "A Minotti reference project – not furnished by Platzhirsch.";

/** [title, alt] per image file, in display order of NAVETTA_IMAGES. */
const NAVETTA_IMAGES_EN = {
  "30395_z_03_Minotti_CustomLine_Navetta42_1.jpg": [
    "Aft deck",
    "Covered aft deck of the Custom Line Navetta 42: a long dining table with dark woven chairs, behind it a pale curved sofa with turquoise cushions, a view of the sea and a wooded coast.",
  ],
  "30396_z_04_Minotti_CustomLine_Navetta42_1.jpg": [
    "Saloon towards the aft deck",
    "Saloon of the Navetta 42 with a turquoise rug, a pale sofa and two round armchairs; through the open glass front the dining table on the aft deck.",
  ],
  "30398_z_05_Minotti_CustomLine_Navetta42_1.jpg": [
    "Lounge",
    "Lounge in the saloon: pale corner sofas with turquoise and silver cushions, a side table in glass and metal, panoramic windows on both sides.",
  ],
  "30397_z_06_Minotti_CustomLine_Navetta42_1.jpg": [
    "Owner's cabin",
    "Owner's cabin with a bed in grey and white, two armchairs by the open balcony and a chest of drawers with a leopard motif.",
  ],
  "30393_z_01_Minotti_CustomLine_Navetta42__1.jpg": [
    "Stern from above",
    "Aerial view of the stern: a curved sofa with tables on the aft deck and two striped bean bags on the lowered bathing platform above deep blue water.",
  ],
};

// FR/IT captions (01.11.2026): same facts, same conditions (credit at every
// image, disclaimer). The French strings carry the non-breaking spaces directly
// (this module stays import-free): U+00A0 before ":", U+202F before ";".
export const CREDIT_FR = "Photo : Courtesy of Custom Line · Projet : Custom Line Navetta 42 · Mobilier : Minotti";
export const DISCLAIMER_FR = "Projet de référence de Minotti – non aménagé par Platzhirsch.";
export const CREDIT_IT = "Foto: Courtesy of Custom Line · Progetto: Custom Line Navetta 42 · Arredi: Minotti";
export const DISCLAIMER_IT = "Progetto di riferimento di Minotti – non arredato da Platzhirsch.";

const NAVETTA_IMAGES_FR = {
  "30395_z_03_Minotti_CustomLine_Navetta42_1.jpg": [
    "Pont arrière",
    "Pont arrière couvert de la Custom Line Navetta 42 : longue table à manger avec chaises tressées foncées, derrière un canapé arrondi clair avec coussins turquoise, vue sur la mer et une côte boisée.",
  ],
  "30396_z_04_Minotti_CustomLine_Navetta42_1.jpg": [
    "Salon vers le pont arrière",
    "Salon de la Navetta 42 avec tapis turquoise, canapé clair et deux fauteuils ronds ; par la baie vitrée ouverte, on voit la table à manger du pont arrière.",
  ],
  "30398_z_05_Minotti_CustomLine_Navetta42_1.jpg": [
    "Lounge",
    "Lounge du salon : canapés d’angle clairs avec coussins turquoise et argentés, une table d’appoint en verre et métal, baies panoramiques des deux côtés.",
  ],
  "30397_z_06_Minotti_CustomLine_Navetta42_1.jpg": [
    "Cabine du propriétaire",
    "Cabine du propriétaire avec lit gris et blanc, deux fauteuils près du balcon ouvert et une commode à motif léopard.",
  ],
  "30393_z_01_Minotti_CustomLine_Navetta42__1.jpg": [
    "La poupe vue du ciel",
    "Vue aérienne de la poupe : canapé arrondi avec tables sur le pont arrière et deux poufs rayés sur la plateforme de bain déployée, au-dessus d’une eau bleu profond.",
  ],
};

const NAVETTA_IMAGES_IT = {
  "30395_z_03_Minotti_CustomLine_Navetta42_1.jpg": [
    "Ponte di poppa",
    "Ponte di poppa coperto della Custom Line Navetta 42: lungo tavolo da pranzo con sedie intrecciate scure, dietro un divano curvo chiaro con cuscini turchesi, vista sul mare e su una costa boscosa.",
  ],
  "30396_z_04_Minotti_CustomLine_Navetta42_1.jpg": [
    "Salone verso il ponte di poppa",
    "Salone della Navetta 42 con tappeto turchese, divano chiaro e due poltrone rotonde; attraverso la vetrata aperta si vede il tavolo da pranzo sul ponte di poppa.",
  ],
  "30398_z_05_Minotti_CustomLine_Navetta42_1.jpg": [
    "Lounge",
    "Lounge nel salone: divani angolari chiari con cuscini turchesi e argento, un tavolino in vetro e metallo, finestre panoramiche su entrambi i lati.",
  ],
  "30397_z_06_Minotti_CustomLine_Navetta42_1.jpg": [
    "Cabina armatoriale",
    "Cabina armatoriale con letto grigio e bianco, due poltrone accanto al balcone aperto e un cassettone con motivo leopardato.",
  ],
  "30393_z_01_Minotti_CustomLine_Navetta42__1.jpg": [
    "La poppa dall’alto",
    "Vista aerea della poppa: divano curvo con tavolini sul ponte di poppa e due pouf a righe sulla plancetta abbassata sopra l’acqua blu intenso.",
  ],
};

const NAVETTA_LOCALES = {
  en: { captions: NAVETTA_IMAGES_EN, credit: CREDIT_EN, disclaimer: DISCLAIMER_EN },
  fr: { captions: NAVETTA_IMAGES_FR, credit: CREDIT_FR, disclaimer: DISCLAIMER_FR },
  it: { captions: NAVETTA_IMAGES_IT, credit: CREDIT_IT, disclaimer: DISCLAIMER_IT },
};

/** Images, credit and disclaimer for a locale (en/fr/it translated, anything else German). */
export function navettaCopy(locale) {
  const l = NAVETTA_LOCALES[locale];
  if (!l) return { images: NAVETTA_IMAGES, credit: CREDIT, disclaimer: DISCLAIMER };
  return {
    images: NAVETTA_IMAGES.map((img) => {
      const t = l.captions[img.file];
      return t ? { ...img, title: t[0], alt: t[1] } : img;
    }),
    credit: l.credit,
    disclaimer: l.disclaimer,
  };
}
