// Ratgeber content access (server side, build time). Articles live as
// Markdown in src/content/ratgeber/*.md and are read with fs; all pages are
// statically generated, so the files are only read during the build / in dev.
//
// Not in the sitemap, llms.txt or the navigation: those should only ever use
// getIndexableRatgeber(), which returns released articles (freigegeben: true)
// – today none.
import fs from "node:fs";
import path from "node:path";
import { buildArticle } from "./article.js";

const CONTENT_DIR = path.join(process.cwd(), "src", "content", "ratgeber");

// Order of the Rubriken on the hub; unknown ones are appended.
export const RUBRIK_ORDER = ["Kaufen & Preise", "Küche", "Material & Pflege", "Outdoor am See", "Schweiz & Liechtenstein"];

let cache = null;

function loadAll() {
  if (cache && process.env.NODE_ENV === "production") return cache;
  const files = fs.existsSync(CONTENT_DIR) ? fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md")).sort() : [];
  const articles = files.map((file) =>
    buildArticle(fs.readFileSync(path.join(CONTENT_DIR, file), "utf8"), { fallbackSlug: file.replace(/\.md$/, "") })
  );
  articles.sort((a, b) => (b.datum || "").localeCompare(a.datum || "") || a.title.localeCompare(b.title, "de"));
  cache = articles;
  return articles;
}

// All articles (released or not), newest first.
export function listRatgeber() {
  return loadAll();
}

export function getRatgeber(slug) {
  return loadAll().find((a) => a.slug === slug) || null;
}

// Only released articles – the only list sitemap / llms.txt / navigation may use.
export function getIndexableRatgeber() {
  return loadAll().filter((a) => a.freigegeben === true);
}

// Runde 2 (recht P1-5): in production an article is reachable ONLY once it is
// released (freigegeben: true) – before that /de/ratgeber/<slug> answers 404
// (like the previews), not just noindex. The hub exists in production only
// while at least one article is released. Development shows everything (editing).
export const RATGEBER_DRAFTS_VISIBLE = process.env.NODE_ENV !== "production";

/** Articles a visitor may open in this environment. */
export function listPublicRatgeber({ drafts = RATGEBER_DRAFTS_VISIBLE } = {}) {
  return drafts ? loadAll() : getIndexableRatgeber();
}

/** One article if a visitor may open it here, else null (→ 404). */
export function getPublicRatgeber(slug, { drafts = RATGEBER_DRAFTS_VISIBLE } = {}) {
  return listPublicRatgeber({ drafts }).find((a) => a.slug === slug) || null;
}

// Articles grouped by Rubrik in hub order: [{ rubrik, id, articles }].
export function groupByRubrik(articles = loadAll()) {
  const groups = new Map();
  for (const a of articles) {
    if (!groups.has(a.rubrik)) groups.set(a.rubrik, []);
    groups.get(a.rubrik).push(a);
  }
  const rank = (r) => {
    const i = RUBRIK_ORDER.indexOf(r);
    return i === -1 ? RUBRIK_ORDER.length : i;
  };
  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b, "de"))
    .map(([rubrik, list]) => ({ rubrik, articles: list }));
}
