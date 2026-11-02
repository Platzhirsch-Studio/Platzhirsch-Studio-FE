// src/lib/seo/footerLinks.js
// Which internal links the site footer may carry (Runde 3 P5, seo P1-3).
//
// Rule: the footer distributes authority, so it links only pages that are
// index,follow. Region pages follow the doorway audit (passesDoorwayAudit,
// src/lib/seo/sitemap/doorwayAudit.js – the same rule as sitemap and robots);
// pages that are noindex by design (service, login, drafts, empty lists) are
// never linked; /concierge only while it is indexable (conciergeIndexable(),
// passed in by the server component – this module stays pure for node --test).
// Legal links (Impressum, Datenschutz) are required by law and are NOT run
// through this filter.
//
// Pure module (relative imports only).
import { isRegionPath, passesDoorwayAudit } from "./sitemap/doorwayAudit.js";
import { referralTermsReleased } from "../kundenbetreuung/empfehlung.js";

/**
 * German paths (without locale) that answer noindex on purpose. A path
 * matches itself and everything below it (/portal → /portal/login).
 *   /outdoor-gartenplanung  legal review open (extraPages.js)
 *   /showroom               only with a released recording (showroom config)
 *   /upload, /portal        service and login pages (SEO-Gutachten P1)
 *   /projekte               no released project (307 → /arbeitsweise)
 *   /einkaufen-aus-der-schweiz  draft until tax adviser and forwarder sign off
 *   /ratgeber/<artikel>     articles: the footer links only the hub (Welle 2:
 *                           three articles released, hub index,follow)
 *   /empfehlen              noindex until the referral terms are released
 *   /newsletter, /merkliste noindex (sitemapEntries.js STATIC_PAGES_CONFIG)
 */
export const FOOTER_NOINDEX_PATHS = Object.freeze([
  "/outdoor-gartenplanung",
  "/showroom",
  "/upload",
  "/portal",
  "/projekte",
  "/einkaufen-aus-der-schweiz",
  "/newsletter",
  "/merkliste",
]);

const LOCALE_PREFIX = /^\/(de|en|fr|it)(?=\/|$)/;

/** "/de/portal/login?x#y" → "/portal/login" */
export function footerPath(href) {
  const raw = String(href || "").split(/[?#]/)[0];
  const path = raw.replace(LOCALE_PREFIX, "") || "/";
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/**
 * @param {string} href internal link (German path, with or without locale)
 * @param {{conciergeIndexable?: boolean}} [opts]
 * @returns {boolean} true when the footer may link it
 */
export function footerLinkAllowed(href, { conciergeIndexable = false } = {}) {
  if (!href || /^(https?:|mailto:|tel:)/.test(href)) return true; // external: not our index
  const path = footerPath(href);
  if (isRegionPath(path)) return passesDoorwayAudit(path);
  if (path === "/concierge") return conciergeIndexable;
  if (path.startsWith("/ratgeber/")) return false;
  if (path === "/empfehlen" || path.startsWith("/empfehlen/")) return referralTermsReleased();
  return !FOOTER_NOINDEX_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Filters a link list ({ href }) with footerLinkAllowed. */
export function footerLinks(links, opts) {
  return (links || []).filter((link) => footerLinkAllowed(link?.href, opts));
}
