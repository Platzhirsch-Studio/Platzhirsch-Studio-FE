// R4-shell-perf: server-rendered header/footer with small islands.
//   npx playwright test tests/e2e/r4-shell.spec.js --project=desktop
// Checks what the lighter shell must keep: skip link first, labels from the
// server, lazy search sheet, lazy mobile-menu body, delegated client
// navigation for the plain footer/mega-menu links, footer accordions on phones.
import { test, expect, devices, webkit } from "@playwright/test";

const consent = (baseURL) => [{ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: baseURL }];

test.describe("R4 Hülle Desktop", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "nur Desktop");
  });

  test("Skip-Link zuerst, Texte aus dem Server, Suche lädt erst beim Öffnen", async ({ page, context, baseURL }) => {
    await context.addCookies(consent(baseURL));
    await page.goto("/de/kontakt", { waitUntil: "load" });
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("href"))).toBe("#main");
    await expect(page.locator("header a[href='/de/merkliste']").first()).toHaveAttribute("aria-label", /Ihre Auswahl/);
    await expect(page.locator("header button[aria-controls='ph-language-list']")).toHaveAttribute("aria-label", /Sprache/);
    await expect(page.locator("#ph-language-list a[hreflang='en']")).toHaveAttribute("href", "/en/contact");
    await expect(page.locator("#ph-search-input")).toHaveCount(0);
    await page.getByRole("button", { name: "Suche öffnen" }).click();
    await expect(page.locator("#ph-search-input")).toBeFocused({ timeout: 30_000 });
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  });

  test("Footer- und Mega-Menü-Links navigieren ohne Neuladen", async ({ page, context, baseURL }) => {
    await context.addCookies(consent(baseURL));
    await page.goto("/de/kontakt", { waitUntil: "load" });
    // QM-Endabnahme 02.11.2026: erst nach der Hydration klicken – ein Klick davor ist eine normale
    // Browser-Navigation (Dev-Server unter Last hydratisiert später als „load“).
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
    await page.evaluate(() => {
      window.__r4NoReload = 1;
    });
    await page.locator("#site-footer a[href='/de/produkte/lamps']").first().click();
    await page.waitForURL("**/de/produkte/lamps");
    expect(await page.evaluate(() => window.__r4NoReload)).toBe(1);
    await page.getByRole("button", { name: "Marken", exact: true }).click();
    await page.locator("#ph-nav-panel-brands a[href='/de/ueber-uns/marken/minotti']").click();
    await page.waitForURL("**/de/ueber-uns/marken/minotti");
    expect(await page.evaluate(() => window.__r4NoReload)).toBe(1);
    await expect(page.locator("#ph-nav-panel-brands")).toBeHidden();
  });

  test("Footer-Gruppen ab 768 px offen", async ({ page }) => {
    await page.goto("/de", { waitUntil: "load" });
    await expect(page.locator("#site-footer a[href='/de/ueber-uns/marken/minotti']").first()).toBeVisible();
  });
});

test.describe("R4 Hülle iPhone", () => {
  test("Mobilmenü: Inhalt erst beim Öffnen, Footer-Gruppen zugeklappt, Links im HTML", async ({ baseURL }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Gerät wird im Test gewählt");
    const browser = await webkit.launch();
    try {
      const context = await browser.newContext({ ...devices["iPhone 15 Pro"], baseURL });
      await context.addCookies(consent(baseURL));
      const page = await context.newPage();
      await page.goto("/de", { waitUntil: "load" });
      await expect(page.locator("#ph-mobile-menu nav")).toHaveCount(0);
      // R6-release: Ein Klick vor der Hydration verpufft (WebKit, Prod-Build
      // unter Last, flaky in r6-ende). Erneut klicken, bis das Menü offen ist;
      // geprüft wird nur, ob es zu ist, damit kein zweiter Klick es schließt.
      const summary = page.locator("#ph-mobile-menu nav summary").first();
      await expect(async () => {
        if (!(await summary.isVisible())) await page.getByRole("button", { name: "Menü öffnen" }).click();
        await expect(summary).toBeVisible({ timeout: 3_000 });
      }).toPass({ timeout: 20_000 });
      expect(await page.locator("#ph-mobile-menu nav a").count()).toBeGreaterThan(10);
      await page.keyboard.press("Escape");
      const groups = page.locator("#site-footer details[data-footer-group]");
      expect(await groups.count()).toBeGreaterThanOrEqual(4);
      expect(await groups.evaluateAll((ds) => ds.every((d) => !d.open))).toBe(true);
      // Links stay in the HTML even while folded (crawlers, no SEO loss).
      expect(await page.locator("#site-footer a[href]").count()).toBeGreaterThan(40);
      const footer = await page.locator("#site-footer").boundingBox();
      expect(footer.height).toBeLessThanOrEqual(2200);
    } finally {
      await browser.close();
    }
  });
});
