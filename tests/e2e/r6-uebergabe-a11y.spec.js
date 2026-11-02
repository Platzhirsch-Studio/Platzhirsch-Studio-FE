// tests/e2e/r6-uebergabe-a11y.spec.js — R6-uebergabe: Freigabe-Cockpit auf
// Geräten. Der Dateiname endet auf a11y.spec.js und passt damit auf
// MOBILE_SPECS in playwright.config.js: läuft auf iPhone (WebKit), Pixel und
// Desktop (QM-Feedback R6-uebergabe P2.1). Mit allen <details> geöffnet:
// axe ohne serious/critical, kein horizontales Scrollen, Ratgeber-Zeilen ohne
// „geprüft am“ bei offenen Artikeln. Die Seite sendet nichts.
// Run: npx playwright test tests/e2e/r6-uebergabe-a11y.spec.js --project=iphone --project=pixel
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { blockFormSends, dismissCookieBanner, measureOverflow, settle } from "./helpers.js";

const PATH = "/de/preview/freigaben";
const OFF = process.env.FREIGABE_PREVIEW_EXPECT === "off";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
test.setTimeout(180_000);

test.describe("Freigabe-Cockpit auf Geräten", () => {
  // P6 Runde 2 (r2-technik P1-6, Runde-1-Befund P1-3): ohne FREIGABE_PREVIEW
  // ist das Cockpit 404 (Produktion) – dann mit Grund überspringen statt rot.
  test.beforeEach(async ({ request }) => {
    test.skip(OFF, "Produktion ohne FREIGABE_PREVIEW");
    const probe = await request.get(PATH, { maxRedirects: 0, timeout: 90_000 });
    test.skip(probe.status() === 404, "Freigabe-Cockpit ist auf diesem Server aus (404, ohne FREIGABE_PREVIEW=1)");
  });

  test("axe, Überlauf und Ratgeber-Anzeige mit geöffneten Details", async ({ page }, testInfo) => {
    await blockFormSends(page);
    const res = await page.goto(PATH);
    expect(res?.status()).toBe(200);
    await settle(page);
    await dismissCookieBanner(page);
    await expect(page.getByRole("heading", { level: 1, name: "Freigaben" })).toBeVisible();
    await page.evaluate(() => document.querySelectorAll("main details").forEach((d) => (d.open = true)));

    const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
    const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    await testInfo.attach("axe-violations.json", { body: JSON.stringify(results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), null, 2), contentType: "application/json" });
    expect(bad.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);

    const overflow = await measureOverflow(page);
    expect(overflow.sw, overflow.wide.join(" | ")).toBeLessThanOrEqual(overflow.vw + 1);

    const ratgeber = page.locator("#ratgeber li").filter({ has: page.getByText("nicht freigegeben", { exact: true }) });
    const n = await ratgeber.count();
    for (let i = 0; i < n; i++) {
      await expect(ratgeber.nth(i)).not.toContainText("geprüft am");
    }
  });
});
