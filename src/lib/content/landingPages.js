// src/lib/content/landingPages.js
// The German-only local landing pages (src/app/[locale]/<slug>/page.js).
// One list for the footer, the homepage regions block, the sitemap and the
// language switcher (which sends visitors of these pages to the other
// locale's homepage, since no translation exists).
export const LANDING_PAGES = [
  { slug: "designermoebel-bregenz", label: "Designermöbel Bregenz", teaser: "Showroom nur wenige Minuten vom Bregenzer Zentrum." },
  { slug: "designermoebel-dornbirn", label: "Designermöbel Dornbirn", teaser: "Küche, Wohnen und Licht aus einer Hand – für das Rheintal." },
  { slug: "designermoebel-lindau", label: "Designermöbel Lindau", teaser: "Wenige Kilometer von Lindau, direkt hinter der Grenze." },
  { slug: "designermoebel-friedrichshafen", label: "Designermöbel Friedrichshafen", teaser: "Am Bodenseeufer entlang in unseren Showroom in Lochau." },
  { slug: "designermoebel-st-gallen", label: "Designermöbel St. Gallen", teaser: "Für St. Gallen und die Ostschweiz – mit Infos zur Einfuhr." },
  { slug: "kuechen-vorarlberg", label: "Küchen Vorarlberg", teaser: "Küchenplanung mit next125 und Poliform." },
  { slug: "wohnzimmer-einrichten-vorarlberg", label: "Wohnzimmer einrichten", teaser: "Sofas, Sessel und Tische von Minotti bis ClassiCon." },
  { slug: "interior-design-vorarlberg", label: "Interior Design Vorarlberg", teaser: "Einrichtungskonzepte für Haus, Wohnung und Objekt." },
  { slug: "moebel-bodensee", label: "Möbel Bodensee", teaser: "Für das gesamte Bodenseeufer – Österreich, Deutschland, Schweiz." },
];

export const LANDING_PAGE_SLUGS = LANDING_PAGES.map((p) => p.slug);
export const landingPagePath = (slug) => `/${slug}`;
