// src/lib/seo/sitemap/ratgeber.js
// Ratgeber (/de/ratgeber, /de/ratgeber/<slug>) for /sitemap-static.xml and
// /llms.txt. Input is ALWAYS getIndexableRatgeber() (src/lib/ratgeber) —
// released articles only (freigegeben: true). Today that list is empty, so
// nothing is listed; the pages stay noindex until the editorial release.
// The hub is indexable exactly when at least one article is released
// (src/app/[locale]/ratgeber/page.js), so it is listed under the same rule.
// German only: /en|fr|it/ratgeber 404 → no hreflang.
//
// Pure module (relative imports only), so node --test can load it.
import { findClaims } from "../../legal/claims.js";
import { BASE_URL } from "./xml.js";

export const RATGEBER_HUB_PATH = "/ratgeber";
export const ratgeberPath = (slug) => `${RATGEBER_HUB_PATH}/${slug}`;

const released = (articles) => (articles || []).filter((a) => a && a.freigegeben === true && a.slug);

const newestDate = (...values) => {
  let best = null;
  for (const v of values.flat()) {
    const d = v ? new Date(v) : null;
    if (d && !isNaN(d.getTime()) && (!best || d > best)) best = d;
  }
  return best;
};

/** Sitemap entries (DE only): hub + every released article. [] while none is released. */
export function toRatgeberEntries(articles, baseUrl = BASE_URL) {
  const list = released(articles);
  if (!list.length) return [];
  const dateOf = (a) => newestDate(a.updatedAt, a.geprueftAm, a.datum);
  const entries = list.map((a) => ({
    url: `${baseUrl}/de${ratgeberPath(a.slug)}`,
    lastModified: dateOf(a),
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  entries.unshift({
    url: `${baseUrl}/de${RATGEBER_HUB_PATH}`,
    lastModified: newestDate(list.map(dateOf)),
    changeFrequency: "monthly",
    priority: 0.6,
  });
  return entries;
}

/** /llms.txt section "## Ratgeber" or "" while no article is released. */
export function ratgeberLlmsSection(articles, baseUrl = BASE_URL) {
  const list = released(articles);
  if (!list.length) return "";
  const lines = list.map((a) => {
    const title = a.seoTitle || a.title;
    // Description only when the Claim-Guard finds nothing in it.
    const desc = a.description && !findClaims(a.description, { locale: "de" }).length ? `: ${a.description}` : "";
    return `- [${title}](${baseUrl}/de${ratgeberPath(a.slug)})${desc}`;
  });
  return `## Ratgeber\n\n${lines.join("\n")}`;
}
