// Pure route helpers for the header islands (R4-shell-perf). Split out of
// shellNav.js so the client islands no longer pull the menu tables (brands,
// landing pages, sitemap extras, shell copy) into the browser bundle. Only
// ROUTES is imported. shellNav.js re-exports these for existing callers.
import { ROUTES } from "@/utils/routing";

const stripHash = (href) => href.split("#")[0].split("?")[0];

/**
 * The room ("living", "brands" …) whose links match `pathname` best
 * (longest prefix). `pathname` has no locale prefix.
 */
export function findActiveRoom(rooms, pathname) {
  const path = (pathname || "/").replace(/\/+$/, "") || "/";
  let best = { id: null, length: 0 };
  for (const room of rooms) {
    const links = [room.all, ...(room.extra || []), ...room.columns.flatMap((col) => col.links)];
    for (const link of links) {
      if (!link || link.external || link.shared || link.href.includes("#")) continue;
      const href = stripHash(link.href).replace(/\/+$/, "");
      if (!href || href === "/") continue;
      if ((path === href || path.startsWith(`${href}/`)) && href.length > best.length) {
        best = { id: room.id, length: href.length };
      }
    }
  }
  return best.id;
}

/** aria-current for a link: exact match only, hash links never. */
export function isCurrent(link, pathname) {
  if (!link || link.external || link.href.includes("#")) return false;
  const path = (pathname || "/").replace(/\/+$/, "") || "/";
  return stripHash(link.href).replace(/\/+$/, "") === path;
}

/**
 * German-only page? `germanOnly` = first path segments (from
 * shellNav.germanOnlySegments(), handed down by the server header).
 */
// Welle 2: an entry "segment@en" names a page in German AND English (Yacht,
// Sofaplaner, Ezarri, Architekten, Pflege-Service). Without `to` such a page
// is not German-only (no note); with `to` it is "missing" only in FR/IT.
// QA Welle 2 P2: an entry with a slash ("newsletter/archiv") names a sub-path
// of an otherwise multilingual section; it matches that path and below.
export function isGermanOnlyPath(pathname = "/", germanOnly = [], to = null) {
  const clean = pathname.replace(/^\//, "").replace(/\/+$/, "");
  const first = clean.split("/")[0];
  if (first.startsWith("designermoebel-")) return true;
  for (const entry of germanOnly) {
    const [segment, also] = String(entry).split("@");
    const hit = segment.includes("/") ? clean === segment || clean.startsWith(`${segment}/`) : segment === first;
    if (!hit) continue;
    if (!also) return true;
    return Boolean(to) && to !== "de" && !also.split(",").includes(to);
  }
  return false;
}

/**
 * The same page in another language. `pathname` has no locale prefix
 * ("/products/beds"); the result has none either. German-only pages lead to
 * the other language's home page ("/").
 */
// ROUTES keys whose translated form exists only for the page itself, not
// below it (src/proxy.js TRANSLATED_SECTIONS with suffix "" only): news
// articles stay /{locale}/news/<slug> in every language (hreflang does the
// same), so "/news/<slug>" must never become "/nouvelles/<slug>" (404, r2-
// technik P1-3a).
const EXACT_ONLY = new Set(["news", "beratung", "kontakt", "merkliste", "platzhirsch", "team", "presse", "partner"]);

export function translatePathWith(pathname, from, to, germanOnly = []) {
  const clean = (pathname || "/").replace(/^\/+/, "").replace(/\/+$/, "");
  if (!clean) return "/";
  if (to !== "de" && isGermanOnlyPath(`/${clean}`, germanOnly, to)) return "/";
  // r2-technik P2-3: match the path against the section's form in EVERY
  // locale, not only `from`. On the first render of a rewritten page (e.g.
  // /fr/produits/… served from the German folder) the pathname can arrive in
  // the German form; the result must not depend on which form arrived.
  let best = null;
  for (const [key, translations] of Object.entries(ROUTES)) {
    const forms = [translations[from], ...Object.values(translations)];
    for (const form of forms) {
      const source = (form || "").replace(/^\//, "");
      if (!source) continue;
      const exact = clean === source;
      if (!exact && (EXACT_ONLY.has(key) || !clean.startsWith(`${source}/`))) continue;
      if (!best || source.length > best.source.length) best = { source, target: translations[to] };
    }
  }
  if (best?.target) return `${best.target}${clean.slice(best.source.length)}`;
  return `/${clean}`;
}

// Placeholder count for the "other" plural form of Shell.header.selectionCount:
// the server formats the message once with it (shellLabels.js), the island
// swaps it for the real number (no digit grouping below 1 000).
export const COUNT_TOKEN = "999";

/** Accessible name of the selection link for `count` (labels from shellLabels().selection). */
export function selectionCountLabel(labels, count) {
  if (!labels) return "";
  if (count === 0) return labels.count0;
  if (count === 1) return labels.count1;
  return String(labels.countOther).replace(COUNT_TOKEN, String(count));
}

/**
 * "/produkte" → "/de/produkte" (what next-intl's Link would render); absolute
 * URLs, tel:, mailto:, #… and already prefixed paths stay unchanged. Used for
 * the plain links handled by Reusable/LinkDelegate.js.
 */
export function localizeHref(href, locale) {
  if (typeof href !== "string" || !href.startsWith("/") || href.startsWith("//")) return href;
  if (/^\/(de|en|fr|it)(\/|$)/.test(href)) return href;
  return `/${locale}${href === "/" ? "" : href}`;
}
