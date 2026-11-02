// src/lib/content/landingPages.js
// The German-only local landing pages (src/app/[locale]/<slug>/page.js).
// One list for the footer, the homepage regions block, the sitemap and the
// language switcher (which sends visitors of these pages to the other
// locale's homepage, since no translation exists).
// AP-3 (31.10.2026): Bregenz, Dornbirn, Lindau, St. Gallen got their own
// place text (src/lib/content/ortsseiten.js) → lastModified 2026-10-31.
// AP-2/AP-11 (SEO-Team A, 31.10.2026): Titles, H1 und Querverweise der Orts- und
// Themenseiten geändert → lastModified 2026-10-31 (Friedrichshafen, Themenseiten).
// `lastModified` is the sitemap <lastmod>: the date the page's copy last
// changed. Bump it whenever you edit that page's text — never set it to today
// on every deploy, search engines stop trusting lastmod that always changes.
// R3-landing fix (26.10.2026, QM P2-1): the kitchen teaser now names the same
// brands as the page (Poliform, next125 – both in the catalogue, named only as
// brands we plan with). Which kitchens are on show is an open owner question
// (UWG audit H9, 00-integration.md §6); no showroom claim until then.
// Region pages that fail the doorway audit stay listed here for the
// footer/homepage links but are noindex,follow and not in the sitemap.
export const LANDING_PAGES = [
  { slug: "designermoebel-bregenz", label: "Designermöbel Bregenz", teaser: "Showroom nur wenige Minuten vom Bregenzer Zentrum.", lastModified: "2026-10-31" },
  { slug: "designermoebel-dornbirn", label: "Designermöbel Dornbirn", teaser: "Küche, Wohnen und Licht aus einer Hand – für das Rheintal.", lastModified: "2026-10-31" },
  { slug: "designermoebel-lindau", label: "Designermöbel Lindau", teaser: "Wenige Kilometer von Lindau, direkt hinter der Grenze.", lastModified: "2026-10-31" },
  { slug: "designermoebel-friedrichshafen", label: "Designermöbel Friedrichshafen", teaser: "Am Bodenseeufer entlang in unseren Showroom in Lochau.", lastModified: "2026-10-31" },
  { slug: "designermoebel-st-gallen", label: "Designermöbel St. Gallen", teaser: "Für St. Gallen und die Ostschweiz – mit Infos zur Einfuhr.", lastModified: "2026-10-31" },
  { slug: "kuechen-vorarlberg", label: "Küchen Vorarlberg", teaser: "Küchenplanung in Lochau, u. a. mit Poliform und next125.", lastModified: "2026-10-31" },
  { slug: "wohnzimmer-einrichten-vorarlberg", label: "Wohnzimmer einrichten", teaser: "Sofas, Sessel und Tische von Minotti bis ClassiCon.", lastModified: "2026-10-31" },
  { slug: "interior-design-vorarlberg", label: "Interior Design Vorarlberg", teaser: "Einrichtungskonzepte für Haus, Wohnung und Objekt.", lastModified: "2026-10-31" },
  { slug: "moebel-bodensee", label: "Möbel Bodensee", teaser: "Beratung für das gesamte Bodenseeufer – Österreich, Deutschland, Schweiz.", lastModified: "2026-10-31" },
];

export const LANDING_PAGE_SLUGS = LANDING_PAGES.map((p) => p.slug);
export const landingPagePath = (slug) => `/${slug}`;
