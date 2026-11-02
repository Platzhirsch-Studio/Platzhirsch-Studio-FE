// R6-produkt-perf live checks (desktop project, phone cases open their own
// context): the catalogue hydrates its server HTML instead of rendering it
// again, keeps its URL state (?marke=, ?seite=), opens the lazy filter sheet,
// the plain tile links navigate client-side; all product links stay in the
// HTML; axe (WCAG 2.2 AA) without serious/critical on catalogue, product
// with and without photo, brand and brand × category. Read-only: no form is
// sent, nothing is saved outside the browser.
import { test, expect, devices } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissCookieBanner } from "./helpers.js";

const HUB = "/de/produkte";
const CATEGORY = "/de/produkte/lamps";
const WITH_PHOTOS = "/de/produkte/lamps/lamps-2097-18";
const NO_PHOTO = "/de/produkte/lamps/lamps-arthur-wall-lamp";
const BRAND = "/de/ueber-uns/marken/minotti";
const BRAND_CATEGORY = "/de/ueber-uns/marken/minotti/sofas-couches";
const IT_HUB = "/it/prodotti";

const tileLinks = (page) => page.locator('main ul a.ph-stretched[href^="/de/produkte/lamps/"]');

async function seriousAxe(page) {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).include("main").analyze();
  return violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
}

test.describe("R6-produkt-perf", () => {
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "desktop", "desktop project only"));

  test("Katalog: Server-HTML mit 24 Produkt-Links, kein Client-Neuaufbau, ?seite=2-Link", async ({ page, request }) => {
    const html = await (await request.get(CATEGORY)).text();
    // No client-render bailout around the catalogue (the one of the shell's
    // next/dynamic ssr:false sits outside <main>).
    const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    expect(main).not.toContain("BAILOUT_TO_CLIENT_SIDE_RENDERING");
    // Endtest 29.10.2026 (bewusst geändert): R9-P5 (seo P2-13) hängt unter das
    // Raster eine eingeklappte A–Z-Liste aller Modelle (<details>) – gezählt
    // wird weiter nur das Raster davor.
    const grid = main.includes("<details") ? main.slice(0, main.lastIndexOf("<details")) : main;
    const hrefs = [...new Set([...grid.matchAll(/href="(\/de\/produkte\/lamps\/[^"?#]+)"/g)].map((m) => m[1]))];
    expect(hrefs.length).toBe(24);
    expect(main).toMatch(/href="\/de\/produkte\/lamps\?seite=2"/);
    expect(main).not.toContain('type="checkbox"');

    // The server <img> nodes are hydrated, not replaced.
    await page.goto(CATEGORY);
    const first = tileLinks(page).first();
    await expect(first).toBeVisible();
    await page.evaluate(() => {
      window.__firstTile = document.querySelector('main ul a.ph-stretched[href^="/de/produkte/lamps/"]');
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => window.__firstTile === document.querySelector('main ul a.ph-stretched[href^="/de/produkte/lamps/"]') && window.__firstTile.isConnected)).toBe(true);
  });

  test("Filter: Blatt lädt erst beim Öffnen, Auswahl schreibt die URL, Zurücksetzen", async ({ page }) => {
    await page.goto(CATEGORY);
    await dismissCookieBanner(page);
    await expect(page.locator("dialog[aria-labelledby='catalog-filter-title']")).toHaveCount(0);
    await page.getByRole("button", { name: /^Alle Filter/ }).click();
    const sheet = page.locator("dialog[aria-labelledby='catalog-filter-title'][open]");
    await expect(sheet).toBeVisible();
    const brandGroup = sheet.locator("#filter-group-brand");
    await brandGroup.locator('input[type="checkbox"]').first().check();
    await expect(page).toHaveURL(/[?&]marke=[a-z0-9-]+/);
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    // Focus back on the opener.
    await expect(page.locator(":focus")).toHaveAttribute("aria-haspopup", "dialog");
    await page.getByRole("button", { name: "Alle löschen" }).first().click();
    await expect(page).not.toHaveURL(/marke=/);
  });

  test("URL-Zustand: ?marke= aus der Markenseite filtert nach der Hydration, ?seite=2 zeigt 48", async ({ page }) => {
    await page.goto(`${CATEGORY}?marke=flos`);
    await expect(page.getByRole("button", { name: "Filter „Flos“ entfernen" })).toBeVisible();
    const brands = await page.locator("main ul article p.text-overline").allTextContents();
    expect(brands.length).toBeGreaterThan(0);
    expect(brands.every((b) => /flos/i.test(b))).toBe(true);
    await page.goto(`${CATEGORY}?seite=2`);
    await expect(tileLinks(page)).toHaveCount(48);
  });

  test("Kachel-Link navigiert clientseitig (kein Neuladen) und Mehr laden ergänzt 24", async ({ page }) => {
    await page.goto(CATEGORY);
    await dismissCookieBanner(page);
    await page.evaluate(() => {
      window.__stay = 1;
    });
    await page.getByRole("link", { name: "Mehr Produkte anzeigen" }).click();
    await expect(tileLinks(page)).toHaveCount(48);
    await expect(page).toHaveURL(/seite=2/);
    const href = await tileLinks(page).first().getAttribute("href");
    await tileLinks(page).first().click();
    await page.waitForURL(`**${href}`);
    expect(await page.evaluate(() => window.__stay)).toBe(1);
  });

  test("Hub: IT-Titel „Catalogo prodotti“, Kategorie-Links im HTML", async ({ page, request }) => {
    await page.goto(IT_HUB);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Catalogo prodotti");
    const html = await (await request.get(HUB)).text();
    expect([...html.matchAll(/href="\/de\/produkte\/[a-z0-9-]+"/g)].length).toBeGreaterThan(10);
  });

  test("Produktseite: Preis auf Anfrage, ohne Foto neutrale Fläche + JSON-LD ohne image", async ({ page }) => {
    await page.goto(WITH_PHOTOS);
    await expect(page.locator("main dl").first()).toContainText("Auf Anfrage");
    await page.goto(NO_PHOTO);
    await expect(page.locator("main [data-no-photo]").first()).toBeVisible();
    const product = (await page.locator('script[type="application/ld+json"]').allTextContents())
      .flatMap((t) => JSON.parse(t)["@graph"] || [JSON.parse(t)])
      // Runde 2 (seo P1-5): ItemPage + Thing instead of Product without offers.
      .find((n) => n["@type"] === "ItemPage");
    expect(product).toBeTruthy();
    expect(product.mainEntity.image).toBeUndefined();
    expect(product.primaryImageOfPage).toBeUndefined();
    expect(JSON.stringify(product)).not.toMatch(/"offers"|"sku"|"Product"/);
  });

  for (const path of [HUB, CATEGORY, WITH_PHOTOS, NO_PHOTO, BRAND, BRAND_CATEGORY]) {
    test(`axe ohne serious/critical: ${path}`, async ({ page }) => {
      await page.goto(path);
      await dismissCookieBanner(page);
      await page.waitForLoadState("networkidle").catch(() => {});
      expect(await seriousAxe(page)).toEqual([]);
    });
  }

  test("Telefon (Pixel 7): Katalog ohne horizontales Scrollen, Filterblatt per Tap", async ({ browser }) => {
    const ctx = await browser.newContext({ ...devices["Pixel 7"] });
    const page = await ctx.newPage();
    await page.goto(CATEGORY);
    await dismissCookieBanner(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.getByRole("button", { name: /^Alle Filter/ }).tap();
    await expect(page.locator("dialog[aria-labelledby='catalog-filter-title'][open]")).toBeVisible();
    await ctx.close();
  });
});
