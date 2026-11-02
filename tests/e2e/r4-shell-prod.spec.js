// R4-shell-perf, QM P2-2 / P2-3: timings that only mean something on a
// production build (tools/qa/prod-check.mjs --specs=r4-shell-prod.spec.js).
// Against the dev server (:3000, on-demand compile) the test is skipped.
//
// P2-3  consent bar visible soon after the load event (fresh context, no
//       consent cookie) on 4 pages, mobile and desktop viewport. R6-shell-perf
//       shows the bar after idle (client-layout.js useAfterIdle, requestIdleCallback
//       with timeout 1500 ms) to cut TBT; the limit follows that contract:
//       ≤ CONSENT_MAX_MS (1 500 ms) after load. R4 had ≤ 1 s.
// P2-2  wrong-language brand × collection URL, first (uncached) request:
//       ONE 308 to the final URL, answer ≤ PROBE_TIMEOUT_MS + margin.
// Writes qa-screenshots/teamleiter/r4-shell-perf/prod-timing.json.
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const IS_DEV = /:3000\/?$/.test(BASE);
const OUT = path.join("qa-screenshots", "teamleiter", "r4-shell-perf", "prod-timing.json");
const results = { base: BASE, at: new Date().toISOString(), consent: [], redirects: [] };

test.skip(IS_DEV, "nur gegen einen Produktions-Build aussagekräftig");
test.describe.configure({ mode: "serial" });

test.afterAll(() => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
});

const PAGES = ["/de", "/de/ueber-uns/marken/minotti", "/de/kontakt", "/en/products/lamps"];
const CONSENT_MAX_MS = 1500;
const VIEWPORTS = { mobil: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } };

for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  for (const p of PAGES) {
    test(`Cookie-Leiste ≤ 1,5 s nach load: ${vpName} ${p}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      await page.goto(BASE + p, { waitUntil: "load" });
      const loadAt = await page.evaluate(() => performance.timing.loadEventStart - performance.timing.navigationStart);
      await page.locator("[data-consent-bar]").waitFor({ state: "visible", timeout: 10_000 });
      const shownAt = await page.evaluate(() => performance.now());
      const afterLoad = Math.round(shownAt - loadAt);
      results.consent.push({ viewport: vpName, path: p, loadMs: loadAt, visibleMs: Math.round(shownAt), afterLoadMs: afterLoad });
      // visibleMs is measured right after waitFor resolves, so it is an upper bound.
      expect(afterLoad, `${p}: Leiste ${afterLoad} ms nach load`).toBeLessThanOrEqual(CONSENT_MAX_MS);
      await context.close();
    });
  }
}

// Brand × collection short forms the [collection] page redirects (sofas →
// sofas-couches …). Each URL is requested once, uncached, wrong language.
const REDIRECTS = [
  ["/it/ueber-uns/marken/minotti/sofas", "/it/chi-siamo/marche/minotti/sofas-couches"],
  ["/fr/ueber-uns/marken/minotti/sofas", "/fr/a-propos/marques/minotti/sofas-couches"],
  ["/en/ueber-uns/marken/minotti/sofas", "/en/about-us/brands/minotti/sofas-couches"],
];

for (const [from, to] of REDIRECTS) {
  test(`Ein 308, erster Aufruf: ${from}`, async ({ request }) => {
    const t0 = Date.now();
    const res = await request.get(BASE + from, { maxRedirects: 0 });
    const ms = Date.now() - t0;
    const location = res.headers()["location"] || "";
    const loc = new URL(location, BASE).pathname;
    results.redirects.push({ from, status: res.status(), location: loc, ms, oneHop: loc === to });
    expect(res.status()).toBe(308);
    // 1 s probe timeout + network/render margin; the target is right either way.
    expect(ms, `${from}: ${ms} ms`).toBeLessThanOrEqual(1500);
    expect([to, to.replace(/\/[^/]+$/, "/sofas")]).toContain(loc);
  });
}
