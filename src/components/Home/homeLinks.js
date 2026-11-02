// Link targets of the homepage sections (Runde 2, Fix-Team P2).
// Pure module (relative imports only), so tests/unit/r7-p2-links.test.mjs can
// load it with node --test.
//  - SERVICES / serviceHref: "Mehr als Möbel" (Services.js), five cards incl.
//    "Hotel, Gastronomie & Objekt" (ux P1-2). Language-correct through
//    landingTarget() (seo P1-6): DE keeps the landing page, EN/FR/IT go to the
//    catalogue category or the consultation page in their own language.
//    R5-fix P2 (seo P2, ux P2, bewusst geändert): ?thema= ONLY on the
//    consultation page (lib/forms/beratungContext.js preselects the wizard).
//    Content pages (/kuechen-vorarlberg, /yacht-interior …) and catalogue
//    targets are linked by their canonical URL – they do not read the
//    parameter, it only multiplied crawlable URLs.
//  - TOOLS_ABROAD: the planners shown on EN/FR/IT (German pages, marked).
//  - regionLinks: "Beratung für Ihre Region" (DreilaenderService.js, seo P1-1)
//    – only pages that pass the doorway audit, i.e. indexed pages.
import { landingTarget } from "../Landing/targets.js";
import { ROUTES } from "../../utils/routing.js";
import { LANDING_PAGES, landingPagePath } from "../../lib/content/landingPages.js";
import { EXTRA_PAGES } from "../../lib/seo/sitemap/extraPages.js";
import { isRegionPath, passesDoorwayAudit } from "../../lib/seo/sitemap/doorwayAudit.js";

export const SERVICES = Object.freeze([
  { key: "kitchen", path: "/kuechen-vorarlberg", thema: "kueche" },
  // Rat 9,5 (A12, ux 9): Interior Design is no Neubau – same topic as the
  // landing page (thema "interior", known to beratungContext, no preselection).
  { key: "interior", path: "/interior-design-vorarlberg", thema: "interior" },
  { key: "outdoor", path: "/outdoor-gartenplanung", thema: "outdoor" },
  // Welle 2 (Inhaber Nr. 13): /en/yacht-interior exists – EN links it directly.
  { key: "yacht", path: "/yacht-interior", thema: "yacht", locales: ["en"] },
  // R5-USP (gesamtwerk P1, bewusst geändert): the hotel card has ONE target –
  // the consultation page with the hotel topic preselected, in every locale.
  // It used to lead to the interior design page (#objekt) like the interior
  // card, so two cards shared one page.
  // Welle 2 (bewusst geändert): the card leads to the new page Hotel & Objekt
  // (DE/EN, with its own project enquiry); FR/IT keep the consultation page
  // with the hotel topic (the page has no FR/IT version).
  // Inhaber 01.11.2026: the page exists in FR/IT too – every locale links it.
  { key: "objekt", path: "/hotel-objekt", thema: "objekt", consult: true, locales: ["de", "en", "fr", "it"] },
]);

const CONSULTATION = new Set(Object.values(ROUTES.beratung));

/** @returns {{href: string, locale: string, germanOnly: boolean}} link of a service card */
export function serviceHref(service, locale) {
  if (service.locales?.includes(locale)) return { href: service.path, locale, germanOnly: false, own: true };
  if (service.consult) {
    const href = ROUTES.beratung[locale] ? ROUTES.beratung[locale] : ROUTES.beratung.de;
    return { href: `${href}?thema=${service.thema}`, locale: ROUTES.beratung[locale] ? locale : "de", germanOnly: false };
  }
  const target = landingTarget(service.path, locale);
  // Sprach-Integration 01.11.2026: the landing page exists in this locale.
  if (target.own) return { href: service.path, locale, germanOnly: false, own: true };
  const consultation = CONSULTATION.has(target.href);
  const landing = target.locale === "de" && target.href === service.path;
  const query = consultation ? `?thema=${service.thema}` : "";
  const hash = landing && service.hash ? `#${service.hash}` : "";
  return { href: `${target.href}${query}${hash}`, locale: target.locale, germanOnly: target.germanOnly };
}

/** Feature ids of the tools chapter on EN/FR/IT (German pages, marked). */
export const TOOLS_ABROAD = Object.freeze(["kuechenplaner", "sofaplaner", "arviewer", "stilfinder"]);

/**
 * Region links of the DE homepage: the region pages that pass the doorway
 * audit (= index, follow; same rule as sitemap and llms.txt), then the
 * indexed topic pages. A city page with too few own facts (Bregenz, Dornbirn,
 * Lindau, Friedrichshafen, St. Gallen today) is noindex and not linked; once
 * its facts are raised in doorwayAudit.js it appears here by itself.
 * @param {Record<string,string>} [teasers] teaser per path (pages without one in LANDING_PAGES)
 */
export function regionLinks(teasers = {}) {
  const landing = LANDING_PAGES.map((p) => ({ path: landingPagePath(p.slug), label: p.label, teaser: p.teaser }));
  const extra = EXTRA_PAGES.filter((p) => p.kind === "region").map((p) => ({ path: p.path, label: p.label, teaser: teasers[p.path] }));
  const seen = new Set();
  const regions = [...landing, ...extra].filter((p) => {
    if (!isRegionPath(p.path) || !passesDoorwayAudit(p.path) || seen.has(p.path)) return false;
    seen.add(p.path);
    return true;
  });
  const topics = landing.filter((p) => !isRegionPath(p.path) && passesDoorwayAudit(p.path));
  return [...regions, ...topics];
}
