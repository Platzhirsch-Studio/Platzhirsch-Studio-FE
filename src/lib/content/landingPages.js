// src/lib/content/landingPages.js
// The German-only local landing pages (src/app/[locale]/<slug>/page.js).
// One list for the footer, the homepage regions block, the sitemap and the
// language switcher (which sends visitors of these pages to the other
// locale's homepage, since no translation exists).
// `lastModified` is the sitemap <lastmod>: the date the page's copy last
// changed. Bump it whenever you edit that page's text — never set it to today
// on every deploy, search engines stop trusting lastmod that always changes.
export const LANDING_PAGES = [
  { slug: "designermoebel-bregenz", label: "Designermöbel Bregenz", teaser: "Showroom nur wenige Minuten vom Bregenzer Zentrum.", lastModified: "2026-10-07" },
  { slug: "designermoebel-dornbirn", label: "Designermöbel Dornbirn", teaser: "Küche, Wohnen und Licht aus einer Hand – für das Rheintal.", lastModified: "2026-10-08" },
  { slug: "designermoebel-lindau", label: "Designermöbel Lindau", teaser: "Wenige Kilometer von Lindau, direkt hinter der Grenze.", lastModified: "2026-10-08" },
  { slug: "designermoebel-friedrichshafen", label: "Designermöbel Friedrichshafen", teaser: "Am Bodenseeufer entlang in unseren Showroom in Lochau.", lastModified: "2026-10-08" },
  { slug: "designermoebel-st-gallen", label: "Designermöbel St. Gallen", teaser: "Für St. Gallen und die Ostschweiz – mit Infos zur Einfuhr.", lastModified: "2026-10-08" },
  { slug: "kuechen-vorarlberg", label: "Küchen Vorarlberg", teaser: "Küchenplanung mit next125 und Poliform.", lastModified: "2026-10-07" },
  { slug: "wohnzimmer-einrichten-vorarlberg", label: "Wohnzimmer einrichten", teaser: "Sofas, Sessel und Tische von Minotti bis ClassiCon.", lastModified: "2026-10-07" },
  { slug: "interior-design-vorarlberg", label: "Interior Design Vorarlberg", teaser: "Einrichtungskonzepte für Haus, Wohnung und Objekt.", lastModified: "2026-10-07" },
  { slug: "moebel-bodensee", label: "Möbel Bodensee", teaser: "Für das gesamte Bodenseeufer – Österreich, Deutschland, Schweiz.", lastModified: "2026-10-07" },
];

export const LANDING_PAGE_SLUGS = LANDING_PAGES.map((p) => p.slug);
export const landingPagePath = (slug) => `/${slug}`;
