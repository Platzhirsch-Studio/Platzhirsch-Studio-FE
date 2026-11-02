// src/lib/seo/breadcrumbs.js
// The first step of every breadcrumb trail (visible and BreadcrumbList JSON-LD)
// has one name per language (R5-shell-seo; QM R4-shell-perf P3-3: the brand
// pages said "Home", Kontakt/PageHeader said "Startseite").
// Pure module (no imports), so node --test and Client Components can load it.

export const HOME_CRUMB = Object.freeze({ de: "Startseite", en: "Home", fr: "Accueil", it: "Home" });

/** Name of the home step in `locale` (falls back to German). */
export function homeCrumbLabel(locale) {
  return HOME_CRUMB[locale] || HOME_CRUMB.de;
}

/**
 * A home step that still carries the generic English word ("Home", "HOME")
 * gets the language's own name; every other label stays as given.
 */
export function normalizeHomeCrumb(label, locale) {
  return typeof label === "string" && /^\s*home\s*$/i.test(label) ? homeCrumbLabel(locale) : label;
}

/**
 * BreadcrumbList items for a visible trail. `items` = [{ label, href? }] with
 * hrefs WITHOUT locale ("/" = home), `base` = "https://platzhirsch.studio/de".
 * Google needs an `item` URL on every step except the last, so a middle step
 * without a page of its own (e.g. "Über uns") stays visible but is left out
 * here; positions are counted after that (R4-seo finding 3).
 */
export function breadcrumbSchemaItems(items, base) {
  return items
    .filter((item, i) => item?.href || i === items.length - 1)
    .map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${base}${item.href === "/" ? "" : item.href}` } : {}),
    }));
}

// ---------------------------------------------------------------------------
// Runde 2 (seo P2-5): ONE BreadcrumbList builder for every page with a
// visible trail (landing pages, Beratung, Kontakt, Marken, Team, Yacht …).
// Pages pass the SAME items they render ({ label, href? }, hrefs without
// locale) – the JSON-LD can then never drift from the visible trail.
// Other packages (P3/P4) import breadcrumbJsonLd() read-only.

const SITE = "https://platzhirsch.studio";

/**
 * BreadcrumbList node (with @context, ready for <JsonLd>) for a visible trail.
 * @param {Array<{label: string, href?: string}>} items visible trail, first = home ("/")
 * @param {string} [locale] "de" | "en" | "fr" | "it"
 * @param {{id?: string, context?: boolean}} [opts] id = "@id" (e.g. `${url}#breadcrumb`)
 */
export function breadcrumbJsonLd(items, locale = "de", { id, context = true } = {}) {
  const trail = (items || []).filter((i) => i && i.label).map((i, n) => (n === 0 ? { ...i, label: normalizeHomeCrumb(i.label, locale) } : i));
  return {
    ...(context ? { "@context": "https://schema.org" } : {}),
    "@type": "BreadcrumbList",
    ...(id ? { "@id": id } : {}),
    itemListElement: breadcrumbSchemaItems(trail, `${SITE}/${locale}`),
  };
}

// Section names as in the main menu (src/components/Navbar/shellNav.js,
// messages Shell.nav.*): the trail of a page follows the menu.
export const MENU_SECTION = Object.freeze({
  house: Object.freeze({ de: "Das Haus", en: "The House", fr: "La Maison", it: "La Casa" }),
});
// Menu labels of single pages (Shell.nav.team …).
export const MENU_PAGE = Object.freeze({
  team: Object.freeze({ de: "Team", en: "Team", fr: "Équipe", it: "Team" }),
});

/**
 * Visible trail of a page in the "Das Haus" menu column (Über uns, Team,
 * Karriere, Presse, Partner, News): Startseite › Das Haus › <page>.
 * "Das Haus" links to the about page (the column's "all" link).
 * @param {string} locale
 * @param {string} label current page label
 * @param {string} houseHref about page path without locale (ROUTES.platzhirsch[locale])
 */
export function houseTrail(locale, label, houseHref) {
  return [
    { label: homeCrumbLabel(locale), href: "/" },
    { label: MENU_SECTION.house[locale] || MENU_SECTION.house.de, href: houseHref },
    { label },
  ];
}
