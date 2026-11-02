// Shared page lists and helpers for the e2e specs. See tests/README.md.

// A real category and a real product (taken from /sitemap-produkte.xml on 26.10.2026).
// If the backoffice drops them, pick new ones from the sitemap.
export const CATEGORY_PATH = "/de/produkte/lamps";
export const PRODUCT_PATH = "/de/produkte/lamps/lamps-2097-18";

// Core pages every round must keep alive.
export const CORE_PAGES = [
  "/de",
  "/en",
  "/fr",
  "/it",
  "/de/produkte",
  CATEGORY_PATH,
  PRODUCT_PATH,
  "/de/ueber-uns/marken",
  "/de/ueber-uns/marken/minotti",
  "/de/ueber-uns/marken/classicon",
  "/de/kontakt",
  "/de/beratung",
  "/de/news",
  "/de/kuechen-vorarlberg",
  "/de/designermoebel-lindau",
  "/de/yacht-interior",
  "/de/outdoor-gartenplanung",
  // R2 pages (noindex for now, but they must load cleanly on every device).
  "/de/ratgeber",
  "/de/adventsabend",
  "/de/bewerten",
];

// Pages that exist in all four languages and therefore must carry hreflang.
export const MULTILINGUAL_PAGES = [
  "/de",
  "/en",
  "/fr",
  "/it",
  "/de/produkte",
  CATEGORY_PATH,
  PRODUCT_PATH,
  "/de/ueber-uns/marken",
  "/de/ueber-uns/marken/minotti",
  "/de/ueber-uns/marken/classicon",
  "/de/kontakt",
  "/de/beratung",
  "/de/news",
];

// Console noise that is not a page defect (dev tooling only).
const IGNORED_CONSOLE = [
  /Download the React DevTools/i,
  /\[HMR\]/i,
  /\[Fast Refresh\]/i,
  /webpack-hmr|turbopack-hmr|_next\/webpack-hmr/i,
  // WebKit notice for the CSP report-only header (next.config.js, R4-release):
  // "… was delivered in report-only mode, but does not specify a 'report-to';
  // the policy will have no effect." Intended until the report endpoint exists
  // (monitoring, E11). Real violations ("Refused to …", "violates the following
  // Content Security Policy directive") still count as errors.
  /delivered in report-only mode, but does not specify a 'report-(?:to|uri)'/i,
];

/** Collects console errors and uncaught page errors for one page. */
export function collectConsoleErrors(page) {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (IGNORED_CONSOLE.some((re) => re.test(text))) return;
    errors.push(text.slice(0, 400));
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${String(err).slice(0, 400)}`));
  return errors;
}

/**
 * Waits until the network is quiet, without failing when a page keeps a
 * connection open (dev HMR, analytics). No fixed sleeps.
 */
export async function settle(page, timeout = 20_000) {
  try {
    await page.waitForLoadState("networkidle", { timeout });
  } catch {
    // A long-polling request is fine; the load event already fired.
  }
}

/** Visible-ish text of server HTML: drops scripts, styles, tags and entities. */
export function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    // QM-Endabnahme 02.11.2026: Attributwerte in Anführungszeichen dürfen „>“ enthalten
    // (Tailwind-Klassen wie „[&>svg]:mt-…“) – sonst landete der Klassenrest im Text.
    .replace(/<(?:[^>"']|"[^"]*"|'[^']*')+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#x27;|&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ");
}

/** All <loc> values of a sitemap or sitemap index. */
export function locs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

/** Rewrites an absolute production URL onto the server under test. */
export function toLocal(url, baseURL) {
  const u = new URL(url);
  return new URL(u.pathname + u.search, baseURL).toString();
}

/** Fetches a URL through Playwright's request context with a dev-friendly timeout. */
/**
 * true, wenn der KI-Concierge auf diesem Server antwortet (/api/labs/status).
 * Ohne Schlüssel (Produktion heute) ist /de/concierge noindex und der
 * Concierge-Knopf aus (F2) – Specs richten ihre Erwartung danach (P6 Runde 2).
 */
/**
 * Seiten, die im Produktions-Build bis zur Freigabe (Ratgeber, recht P1-5) bzw.
 * bis zur bestätigten Uhrzeit (Adventsabend, recht P2-6) bewusst 404 sind; in
 * der Entwicklung rendern sie. Specs prüfen sie nur, wenn sie 200 liefern.
 */
export const PROD_GATED = new Set(["/de/ratgeber", "/de/adventsabend"]);

export async function conciergeAvailable(request) {
  try {
    const res = await request.get("/api/labs/status", { timeout: 60_000 });
    return Boolean((await res.json())?.concierge);
  } catch {
    return false;
  }
}

export async function getText(request, url) {
  const res = await request.get(url, { timeout: 120_000, maxRedirects: 5 });
  return { status: res.status(), headers: res.headers(), text: await res.text() };
}

/** Runs async jobs with a small concurrency limit (keeps the dev server responsive). */
export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

const HEAD_META = /^(description|og:title|og:description|og:image:alt|twitter:title|twitter:description)$/i;

/** Decodes entities in attribute values and JSON-LD strings. */
function decode(s) {
  return htmlToText(s.replace(/</g, " "));
}

// Structural keys; @graph and every other key are walked.
const JSON_LD_SKIP = new Set(["@context", "@type", "@id"]);

/** Collects every string value of a parsed JSON-LD tree (skips URLs and structural keys). */
function jsonStrings(node, out) {
  if (typeof node === "string") {
    if (!/^(https?:|mailto:|tel:|\/)/i.test(node)) out.push(node);
  } else if (Array.isArray(node)) {
    for (const n of node) jsonStrings(n, out);
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) if (!JSON_LD_SKIP.has(k)) jsonStrings(v, out);
  }
  return out;
}

/**
 * Text that search results show but htmlToText drops or hides: <title>, meta
 * description, Open Graph / Twitter tags and all JSON-LD string values. Each part
 * carries a label ([title], [meta description], [json-ld]) so a hit shows its source.
 */
export function headText(html) {
  const parts = [];
  for (const m of html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)) parts.push(`[title] ${decode(m[1])}`);
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const key = (tag.match(/\b(?:name|property)="([^"]+)"/i) || [])[1];
    const content = (tag.match(/\bcontent="([^"]*)"/i) || [])[1];
    if (key && content && HEAD_META.test(key)) parts.push(`[meta ${key}] ${decode(content)}`);
  }
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      parts.push(`[json-ld] ${jsonStrings(JSON.parse(m[1]), []).join(" | ")}`);
    } catch {
      parts.push(`[json-ld nicht parsebar] ${m[1].slice(0, 200)}`);
    }
  }
  return parts.join(" ‖ ").replace(/\s+/g, " ");
}

// ---------------------------------------------------------------------------
// Runde 2 (R2-qualitaetsnetz). Additive only: other packages import this file.
// ---------------------------------------------------------------------------

// The former Labs features at their fixed URLs (Inhaber-Entscheidung Nr. 9).
// German only (other locales 404); indexable except /de/upload.
export const LABS_PAGES = [
  "/de/3d-ansicht",
  "/de/concierge",
  "/de/dreilaender-rechner",
  "/de/kuechenplaner",
  "/de/sofaplaner",
  "/de/stil-finder",
  "/de/upload",
];

// Accessible names of the cookie bar (region) and of its "reject" button in the
// four languages (src/messages/*.json, Cookies.bannerTitle / Cookies.rejectAll).
const COOKIE_REGION = /^(Cookie-Einstellungen|Cookie settings|Paramètres des cookies|Impostazioni dei cookie)$/;
// Endtest 29.10.2026: IT spricht seit R9-P2 (it-voi) in der voi-Form – „Continuate senza consenso“.
const COOKIE_REJECT = /^(Weiter ohne Einwilligung|Continue without consent|Continuer sans consentement|Continuate? senza consenso)$/;

/**
 * Closes the cookie bar with "Weiter ohne Einwilligung" (no tracking consent)
 * and waits until it is gone. The bar mounts client-side after hydration, so
 * it waits up to `timeout` for it to appear. Returns true if a bar was closed,
 * false if none showed up (consent cookie already set).
 */
export async function dismissCookieBanner(page, timeout = 15_000) {
  const region = page.getByRole("region", { name: COOKIE_REGION });
  try {
    await region.waitFor({ state: "visible", timeout });
  } catch {
    return false;
  }
  await region.getByRole("button", { name: COOKIE_REJECT }).click();
  await region.waitFor({ state: "hidden", timeout });
  return true;
}

/**
 * Blocks every non-GET request to /api/** (form sends, uploads, concierge,
 * tracking beacons) so a test can never send a real mail or lead. Answers
 * 503 with a JSON body; returns the list of blocked requests ("METHOD path").
 */
export async function blockFormSends(page) {
  const blocked = [];
  await page.route("**/api/**", (route) => {
    const req = route.request();
    if (req.method() === "GET" || req.method() === "HEAD") return route.continue();
    blocked.push(`${req.method()} ${new URL(req.url()).pathname}`);
    return route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, code: "blocked_by_test" }),
    });
  });
  return blocked;
}

/** robots directives of a server response: all meta robots tags plus X-Robots-Tag. */
export function robotsDirectives({ text, headers }) {
  const metas = [...text.matchAll(/<meta[^>]+name="robots"[^>]*>/gi)].map((m) => {
    const c = m[0].match(/content="([^"]*)"/i);
    return c ? c[1] : "";
  });
  return [...metas, (headers && headers["x-robots-tag"]) || ""].join(",").toLowerCase();
}

/** All parsed JSON-LD nodes of an HTML string, @graph flattened. Unparsable blocks are skipped. */
export function jsonLdNodes(html) {
  const out = [];
  const walk = (n) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== "object") return;
    out.push(n);
    if (n["@graph"]) walk(n["@graph"]);
  };
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(m[1]));
    } catch {
      // seo.spec.js reports unparsable blocks.
    }
  }
  return out;
}

/** Horizontal overflow at the current viewport: { vw, sw, wide[] } (outermost culprits only). */
export async function measureOverflow(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const sticksOut = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.right > vw + 1 && getComputedStyle(el).position !== "fixed";
    };
    const wide = [...document.querySelectorAll("body *")]
      .filter((el) => !el.closest("svg") || el.tagName.toLowerCase() === "svg")
      .filter((el) => sticksOut(el) && !(el.parentElement && el.parentElement !== document.body && sticksOut(el.parentElement)))
      .slice(0, 5)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return `${el.tagName.toLowerCase()}.${String(el.getAttribute("class") || "").slice(0, 60)} (rechts ${Math.round(r.right)} px)`;
      });
    return { vw, sw, wide };
  });
}
