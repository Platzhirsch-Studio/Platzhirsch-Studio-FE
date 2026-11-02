// src/lib/seo/sitemap/doorwayAudit.js
// Doorway audit of the 13 German region pages (/de/designermoebel-<ort>),
// R1-seo 26.10.2026 (Marktresearch/digital/teamleiter/r1-R1-seo.md, Abschnitt 1).
//
// Rule: a region page is only listed in the sitemap (and /llms.txt) when it has
// at least MIN_OWN_FACTS facts that no other region page has (driving time,
// tax/delivery steps, regional terms, brands with an own reason, references).
// Shared blocks (address, opening hours, "EU-Binnenmarkt", "8,1 % + BAZG",
// café …) do not count.
//
// This is the single source for that decision. The sitemap uses it for both
// LANDING_PAGES and EXTRA_PAGES. `regionRobots(path)` is the matching robots
// value for the page metadata (landingMetadata in src/components/Landing/
// landingPage.js); the footer lists only passing region pages (Footer.js,
// src/lib/seo/footerLinks.js), so no link points at a noindex page.
// Owner decision E15 (which max. 8 pages get indexed) can override the list
// below only by adding real facts to a page and raising its count here.
//
// Pure module (no imports), so node --test can load it.

export const MIN_OWN_FACTS = 4;

// Own facts per region page as counted in the audit. Update the number when a
// page's copy gets new own facts (and bump its lastModified).
export const REGION_AUDIT = {
  "/designermoebel-rheintal": 5,
  "/designermoebel-liechtenstein": 5,
  "/designermoebel-arlberg": 5,
  "/designermoebel-konstanz": 4,
  "/designermoebel-feldkirch": 4,
  "/designermoebel-appenzell": 4,
  "/designermoebel-ravensburg": 3,
  "/designermoebel-kempten": 2,
};

// Runde 3 P5 (seo P0-1, 28.10.2026): the five city pages got own facts. Each
// entry names the fact and its source; the page file repeats the list in its
// header comment. Shared blocks (EU-Binnenmarkt, 8,1 % + BAZG, Abholung =
// österreichische USt) are NOT counted. No projects, references or prices.
export const REGION_FACTS = {
  "/designermoebel-bregenz": [
    "Fahrzeit rund 5 Minuten (Marktresearch/02 §3, digital/09)",
    "Anfahrt Richtung Lindau, mit dem Rad über den Bodensee-Radweg",
    "Aufmaß und Licht bei Ihnen, Lieferung und Montage auf Wunsch (Entscheidung Nr. 3, Nr. 8)",
    "Wohnlagen Innenstadt, Vorkloster, Rieden, Fluh, Pfänderhang",
  ],
  "/designermoebel-dornbirn": [
    "Fahrzeit rund 20 Minuten, rund 15 km (Marktresearch/02 §3, digital/09)",
    "Route A14 Richtung Bregenz, Zug über Bregenz",
    "Planung ab dem Rohbau (Anschlüsse, Einbauten, Licht)",
    "Ortsteile Hatlerdorf, Oberdorf, Haselstauden, Rohrbach; Tom Dixon nur hier",
  ],
  "/designermoebel-lindau": [
    "Fahrzeit rund 5 Minuten, 6–8 km (Marktresearch/02 §3, digital/09)",
    "Anfahrt am See ohne Autobahn, keine Vignette nötig",
    "Ortsteile Insel, Aeschach, Hoyren, Reutin, Zech, Bad Schachen; Zugang Insel",
    "Ratgeber Outdoor-Möbel am See (Material, Stoffe, Maße, Winter)",
  ],
  "/designermoebel-friedrichshafen": [
    "Fahrzeit 35–45 Minuten, rund 30 km (Marktresearch/02 §3, digital/09)",
    "Route Nordufer über Langenargen, Kressbronn und Lindau",
    "Zug: Bodenseegürtelbahn bis Lindau, weiter Richtung Bregenz",
    "Orte Fischbach, Manzell, Ailingen, Immenstaad",
  ],
  "/designermoebel-st-gallen": [
    "Fahrzeit 30–40 Minuten, 40–45 km (Marktresearch/02 §3, digital/09)",
    "Route über St. Margrethen und Höchst",
    "Lieferung per Spedition: Aus- und Einfuhranmeldung, MWST und Gebühr beim Empfang (src/lib/ch/content.js Weg B)",
    "Stockwerkeigentum, Rosenberg, Rotmonten, St. Georgen; Lift- und Treppenhausmasse",
  ],
};
for (const [path, facts] of Object.entries(REGION_FACTS)) REGION_AUDIT[path] = facts.length;

// Date the five city pages got their facts: the sitemap <lastmod> of these
// pages is the newer of this and LANDING_PAGES[].lastModified.
export const REGION_FACTS_DATE = "2026-10-28";

export const isRegionPath = (path) => path.startsWith("/designermoebel-");

// true for every non-region page; region pages need an audit entry with
// enough own facts (an unaudited region page is not listed).
export function passesDoorwayAudit(path) {
  if (!isRegionPath(path)) return true;
  return (REGION_AUDIT[path] ?? 0) >= MIN_OWN_FACTS;
}

// Robots value that matches the sitemap decision, for generateMetadata.
export function regionRobots(path) {
  return passesDoorwayAudit(path) ? { index: true, follow: true } : { index: false, follow: true };
}
