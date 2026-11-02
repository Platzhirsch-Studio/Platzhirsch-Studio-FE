// src/lib/seo/regionen.js
// Rat 9,5 B15 (T6): Regionen-Hub /de/regionen – Elternseite der Brotkrume
// aller Stadt- und Regionsseiten, Querverweise zu den Nachbarorten, zum
// passenden Ratgeber, zu Küche, Hotel & Objekt und Termin.
//
// Regeln:
// - Nur Fakten, die schon auf den Regionsseiten stehen (Fahrzeit, Route,
//   Zoll/MWST) – Quelle je Zeile: REGION_FACTS bzw. EXTRA_PAGES.facts in
//   src/lib/seo/sitemap/doorwayAudit.js / extraPages.js. Keine Liefer-
//   versprechen, keine Preise, keine Referenzen.
// - Verlinkt werden nur Seiten, die den Doorway-Audit bestehen (index,
//   follow); Kempten und Ravensburg bleiben draußen, bis sie eigene Fakten haben.
// - Nur Deutsch, wie die Regionsseiten (EN/FR/IT 308 → /de/regionen?lang=).
//
// Pure module (relative imports only), so node --test can load it.
import { passesDoorwayAudit } from "./sitemap/doorwayAudit.js";

export const REGIONEN_PATH = "/regionen";
export const REGIONEN_LAST_MODIFIED = "2026-10-30";
// Day the region pages got the /regionen crumb and the cross links (sitemap lastmod).
export const REGION_LINKS_DATE = "2026-10-30";
export const REGIONEN_CRUMB = Object.freeze({ label: "Regionen", href: REGIONEN_PATH });

/** Gruppen nach Land; `drive` = Anfahrt wie auf der Seite, `topic` = Ratgeber/Hinweis der Region. */
export const REGION_GROUPS = Object.freeze([
  {
    id: "vorarlberg",
    title: "Vorarlberg",
    country: "Österreich",
    note: "Einkauf innerhalb Österreichs, ohne Zoll, mit österreichischer Rechnung.",
    regions: [
      { path: "/designermoebel-bregenz", name: "Bregenz", drive: "rund 5 Minuten mit dem Auto, mit dem Rad über den Bodensee-Radweg" },
      { path: "/designermoebel-dornbirn", name: "Dornbirn", drive: "rund 20 Minuten über die A14" },
      { path: "/designermoebel-feldkirch", name: "Feldkirch und Oberland", drive: "rund 35 km über die Rheintalautobahn A14" },
      { path: "/designermoebel-arlberg", name: "Arlberg", drive: "von Lech rund 75 Minuten bis eineinhalb Stunden" },
    ],
  },
  {
    id: "deutschland",
    title: "Bodensee Deutschland",
    country: "Deutschland",
    note: "Einkauf im EU-Binnenmarkt, ohne Zollgrenze.",
    regions: [
      { path: "/designermoebel-lindau", name: "Lindau", drive: "rund 5 Minuten am See entlang, ohne Autobahn und Vignette" },
      { path: "/designermoebel-friedrichshafen", name: "Friedrichshafen", drive: "35 bis 45 Minuten über das Nordufer" },
      { path: "/designermoebel-konstanz", name: "Konstanz", drive: "rund eine Stunde um den See oder mit der Fähre Konstanz–Meersburg" },
      { path: "/designermoebel-kempten", name: "Kempten" },
      { path: "/designermoebel-ravensburg", name: "Ravensburg" },
    ],
  },
  {
    id: "schweiz",
    title: "Ostschweiz",
    country: "Schweiz",
    note: "Ausfuhr aus Österreich und Einfuhr in die Schweiz: Ablauf, MWST und Zoll im Ratgeber.",
    guide: { href: "/ratgeber/moebel-aus-oesterreich-in-die-schweiz", label: "Ratgeber: Möbel aus Österreich in die Schweiz" },
    regions: [
      { path: "/designermoebel-st-gallen", name: "St. Gallen", drive: "30 bis 40 Minuten über St. Margrethen und Höchst" },
      { path: "/designermoebel-rheintal", name: "St. Galler Rheintal", drive: "rund 30 Minuten über Au–Lustenau oder St. Margrethen–Höchst" },
      { path: "/designermoebel-appenzell", name: "Appenzell", drive: "rund 30 bis 45 Minuten je nach Ort" },
    ],
  },
  {
    id: "liechtenstein",
    title: "Liechtenstein",
    country: "Liechtenstein",
    note: "Schweizer Zoll- und Mehrwertsteuergebiet (8,1 %); Ausfuhr über die Zollstelle Tisis/Schaanwald.",
    guide: { href: "/ratgeber/moebel-aus-oesterreich-in-die-schweiz", label: "Ratgeber: Möbel aus Österreich in die Schweiz" },
    regions: [{ path: "/designermoebel-liechtenstein", name: "Vaduz, Schaan und Unterland", drive: "rund 40 Minuten über die A14 oder die A13" }],
  },
]);

/** Themenseiten, die zu allen Regionen passen (alle index, follow). */
export const REGION_TOPICS = Object.freeze([
  // AP-11 (SEO-Team A, 31.10.2026): Ankertexte mit Suchbegriff; Minotti Studio und Bad & Wellness dazu.
  { href: "/ueber-uns/marken/minotti", label: "Minotti Studio in Lochau", text: "Sofas, Sessel und Tische von Minotti ansehen und mit uns planen." },
  { href: "/kuechen-vorarlberg", label: "Küchenstudio in Vorarlberg", text: "Küchenplanung im Studio in Lochau." },
  // Outdoor-Küche (02.11.2026): eigene Landingpage, in allen vier Sprachen index, follow.
  { href: "/outdoor-kueche", label: "Outdoor-Küche planen", text: "Außenküchen nach Maß für Garten und Terrasse." },
  { href: "/bad-wellness", label: "Bad & Wellness planen", text: "Bad, Sauna und Spa, geplant wie ein Raum." },
  // Kaufwörter-Seiten Bad & Wellness (02.11.2026): in allen vier Sprachen index, follow.
  { href: "/whirlpool-kaufen", label: "Whirlpool kaufen", text: "Outdoor-Whirlpool und Privat-Spa, geplant am Bodensee." },
  { href: "/sauna-kaufen", label: "Sauna kaufen", text: "Sauna für zuhause und Außensauna, geplant am Bodensee." },
  { href: "/interior-design-vorarlberg", label: "Interior Design", text: "Einrichtungskonzepte für Haus, Wohnung und Objekt." },
  { href: "/wohnzimmer-einrichten-vorarlberg", label: "Wohnzimmer einrichten", text: "Sofas, Sessel und Tische für das Wohnzimmer." },
  { href: "/hotel-objekt", label: "Hotel & Objekt", text: "Hotels, Chalets und Ferienwohnungen, zum Beispiel am Arlberg." },
  { href: "/arbeitsweise", label: "Unsere Arbeitsweise", text: "Von der Handzeichnung über das Modell zum Rendering." },
  { href: "/dreilaender-rechner", label: "Dreiländer-Rechner", text: "Fahrzeiten ab Lochau und Richtwerte für den Kauf aus der Schweiz." },
]);

/** Gruppen nur mit indexierbaren Regionsseiten (leere Gruppen fallen weg). */
export function visibleRegionGroups(groups = REGION_GROUPS, passes = passesDoorwayAudit) {
  return groups
    .map((g) => ({ ...g, regions: g.regions.filter((r) => passes(r.path)) }))
    .filter((g) => g.regions.length > 0);
}

/** Alle sichtbaren Regionsseiten (flach), für ItemList und Tests. */
export function visibleRegions(groups = REGION_GROUPS, passes = passesDoorwayAudit) {
  return visibleRegionGroups(groups, passes).flatMap((g) => g.regions.map((r) => ({ ...r, group: g.id, country: g.country })));
}

/**
 * Nachbarorte einer Regionsseite (für Querverweise): zuerst dieselbe Gruppe,
 * dann die übrigen in Hub-Reihenfolge, ohne die Seite selbst.
 * @param {string} path z. B. "/designermoebel-bregenz"
 * @param {number} [max=3]
 */
export function neighbourRegions(path, max = 3) {
  const all = visibleRegions();
  const own = all.find((r) => r.path === path);
  if (!own) return all.slice(0, max);
  const same = all.filter((r) => r.group === own.group && r.path !== path);
  const rest = all.filter((r) => r.group !== own.group);
  return [...same, ...rest].slice(0, max);
}

export const REGIONEN_META = Object.freeze({
  // AP-2 (SEO-Team A, 31.10.2026): Suchbegriff vorn („designermöbel vorarlberg“,
  // „möbel bodensee“), Rohtitel mit Suffix ≤ 60; H1 nennt die drei Regionen.
  title: "Designermöbel Vorarlberg, Bodensee, Ostschweiz",
  h1: "Möbel und Designermöbel für Vorarlberg, Bodensee und Ostschweiz",
  eyebrow: "Österreich · Deutschland · Schweiz · Liechtenstein",
  lead:
    "Unser Showroom mit Café liegt in Lochau, wenige Minuten hinter Bregenz. Hier finden Sie Anfahrt und Besonderheiten für Ihre Region – vom Rheintal bis an den Arlberg.",
  description:
    "Designermöbel und Interior Design für Vorarlberg, den deutschen Bodensee, die Ostschweiz und Liechtenstein, mit der Anfahrt nach Lochau je Region.",
});
