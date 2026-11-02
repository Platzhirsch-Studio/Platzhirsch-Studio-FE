// Smoke: every core page answers 200 and logs no console errors; all Labs pages
// answer 200 on /de, 404 on /en, are noindex and do not overflow at 375 px.
// Runs on iPhone (WebKit), Pixel (Chromium), iPad (WebKit) and Desktop Chromium 1440.
// No form is ever sent: Labs tests block every non-GET /api/** request.
import { test, expect } from "@playwright/test";
import {
  CORE_PAGES,
  LABS_PAGES,
  blockFormSends,
  collectConsoleErrors,
  conciergeAvailable,
  getText,
  measureOverflow,
  robotsDirectives,
  settle,
  PROD_GATED,
} from "./helpers.js";

// P6 Runde 2 (wie seo.spec.js, recht P1-5/P2-6): PROD_GATED-Seiten sind im
// Produktions-Build bis zur Freigabe bzw. bestätigten Uhrzeit bewusst 404.
for (const path of CORE_PAGES) {
  test(`smoke ${path}`, async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(path, { waitUntil: "load" });
    expect(response, `keine Antwort für ${path}`).not.toBeNull();
    if (PROD_GATED.has(path) && response.status() === 404) return;
    expect(response.status(), `HTTP-Status ${path}`).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    await settle(page);
    expect(errors, `Konsolenfehler auf ${path}`).toEqual([]);
  });
}

test.describe("Labs", () => {
  for (const path of LABS_PAGES) {
    // Server answers do not depend on the device: once, in the desktop project.
    // Integration 28.10.2026 (Inhaber-Entscheidung Nr. 9): feste, indexierbare URLs; /de/upload bleibt noindex.
    // P6 Runde 2 (bewusst geänderte Erwartungen): /de/concierge ist ohne
    // KI-Schlüssel noindex (F2, Erwartung folgt /api/labs/status); /en/<Planer>
    // ist kein 404 mehr, sondern EIN 308 auf /de/<Planer>?lang=en
    // (src/lib/seo/deOnlyRedirects.cjs). /en/upload bleibt 404 (Schalter-Seite).
    test(`labs ${path}: 200, robots, /en → 308 bzw. 404`, async ({ request }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "Server-Antwort, nur Desktop");
      const de = await getText(request, path);
      expect(de.status, `HTTP-Status ${path}`).toBe(200);
      const noindex = path === "/de/upload" || (path === "/de/concierge" && !(await conciergeAvailable(request)));
      if (noindex) expect(robotsDirectives(de), `noindex ${path}`).toContain("noindex");
      else expect(robotsDirectives(de), `index ${path}`).not.toContain("noindex");
      const en = path.replace(/^\/de\//, "/en/");
      const enRes = await request.get(en, { maxRedirects: 0, timeout: 120_000 });
      if (path === "/de/upload") {
        expect(enRes.status(), `${en} bleibt 404`).toBe(404);
      } else if (["/de/sofaplaner", "/de/kuechenplaner", "/de/stil-finder", "/de/dreilaender-rechner"].includes(path)) {
        // Sprach-Integration 01.11.2026 (bewusst geändert): diese Planer gibt es in
        // DE/EN/FR/IT – /en und /fr sind eigene Seiten (200, lang), kein 308 mehr.
        expect(enRes.status(), `${en} eigene EN-Seite`).toBe(200);
        expect(await enRes.text(), `${en} lang`).toMatch(/<html[^>]*\blang="en"/);
        const fr = path.replace(/^\/de\//, "/fr/");
        const frRes = await request.get(fr, { maxRedirects: 0, timeout: 120_000 });
        expect(frRes.status(), `${fr} eigene FR-Seite`).toBe(200);
      } else {
        expect(enRes.status(), `${en} → 308`).toBe(308);
        expect(enRes.headers().location, `${en} Ziel`).toContain(`${path}?lang=en`);
      }
    });

    test(`labs ${path}: 375 px ohne horizontalen Überlauf`, async ({ page }, testInfo) => {
      test.skip(!["iphone", "pixel"].includes(testInfo.project.name), "läuft in den Telefon-Projekten");
      const blocked = await blockFormSends(page);
      await page.setViewportSize({ width: 375, height: 812 });
      const res = await page.goto(path, { waitUntil: "load" });
      expect(res.status()).toBe(200);
      await settle(page);
      const overflow = await measureOverflow(page);
      expect(overflow.sw, `scrollWidth > Viewport, z. B. ${overflow.wide.join(" | ")}`).toBeLessThanOrEqual(
        overflow.vw + 1
      );
      if (blocked.length) testInfo.annotations.push({ type: "abgefangen", description: blocked.join("\n") });
    });
  }
});
