// tools/qa/shoot-lib.mjs – pure helpers of tools/qa/shoot.mjs (unit-tested in
// tests/unit/r9-p1-shoot.test.mjs, no browser needed).
import { createHash } from "node:crypto";

const clean = (s) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");

/**
 * File name stem of a URL. R5-Fix P1 (Auftrag 9): the query is part of the
 * name, so /de/beratung?thema=yacht and ?thema=kueche no longer overwrite each
 * other. Long names are cut and get a short hash of the full URL path+query.
 *   /de                          → "de"
 *   /                            → "home"
 *   /de/beratung?thema=yacht     → "de-beratung--q-thema-yacht"
 */
export function slugOf(url) {
  const u = new URL(url);
  const base = clean(u.pathname) || "home";
  const query = u.search.length > 1 ? clean(decodeURIComponent(u.search.slice(1))) : "";
  const slug = query ? `${base}--q-${query}` : base;
  if (slug.length <= 120) return slug;
  const hash = createHash("sha1").update(`${u.pathname}${u.search}`).digest("hex").slice(0, 8);
  return `${slug.slice(0, 110)}-${hash}`;
}

/** One unique stem per URL of the run (same stem twice → "-2", "-3" …). */
export function uniqueSlugs(urls) {
  const seen = new Map();
  return urls.map((url) => {
    const s = slugOf(url);
    const n = (seen.get(s) || 0) + 1;
    seen.set(s, n);
    return n === 1 ? s : `${s}-${n}`;
  });
}

/**
 * Runs `fn` with a time limit. On timeout the promise resolves with
 * { timedOut: true } (and `onTimeout` runs, e.g. to close the context), so ONE
 * hanging URL never aborts the whole run.
 */
export async function withTimeout(fn, ms, onTimeout) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ timedOut: true }), ms);
  });
  try {
    const result = await Promise.race([Promise.resolve().then(fn).then((value) => ({ value })), timeout]);
    if (result.timedOut && onTimeout) await Promise.resolve(onTimeout()).catch(() => {});
    return result;
  } finally {
    clearTimeout(timer);
  }
}
