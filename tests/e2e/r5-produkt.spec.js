// R5-produkt live checks (desktop project; the iPhone SE case opens its own
// context): neutral surface instead of a stock photo, neutral share image,
// no JSON-LD image for a piece without photo, lightbox as a lazy chunk with
// focus return, thumbnails after idle, primary button above the cookie
// banner on a 375 × 568 phone. Read-only: no form is sent.
import { test, expect, devices } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const NO_PHOTO = "/de/produkte/lamps/lamps-arthur-wall-lamp"; // Brand van Egmond, bild_anhangen empty
const NO_PHOTO_IT = "/it/prodotti/lamps/lamps-arthur-wall-lamp";
const WITH_PHOTOS = "/de/produkte/lamps/lamps-2097-18"; // Flos, 4 images
// The lightbox dialog (the page has other <dialog>s, e.g. the search).
const GALLERY_DIALOG = 'dialog[aria-label*="2097-18"]';

test.describe("R5-produkt", () => {
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "desktop", "desktop project only"));

  test("Stück ohne Foto: neutrale Fläche, kein Fremdfoto, OG neutral, JSON-LD ohne image", async ({ page }) => {
    const res = await page.goto(NO_PHOTO);
    expect(res.status()).toBe(200);
    const html = await page.content();
    expect(html).not.toContain("fallback-banner");
    const stage = page.locator("main [data-no-photo]").first();
    await expect(stage).toBeVisible();
    await expect(stage).toContainText("Für dieses Stück liegt noch kein Foto vor");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/de\/produkte\/kein-foto\.png$/);
    const product = (await page.locator('script[type="application/ld+json"]').allTextContents())
      .flatMap((t) => JSON.parse(t)["@graph"] || [JSON.parse(t)])
      // Runde 2 (seo P1-5): ItemPage + Thing instead of Product without offers.
      .find((n) => n["@type"] === "ItemPage");
    expect(product).toBeTruthy();
    expect(product.mainEntity.image).toBeUndefined();
    expect(product.primaryImageOfPage).toBeUndefined();
    expect(JSON.stringify(product)).not.toMatch(/"offers"|"sku"|"Product"/);
  });

  test("IT-Hinweis und OG-Bild je Sprache", async ({ page, request }) => {
    await page.goto(NO_PHOTO_IT);
    await expect(page.locator("main [data-no-photo]").first()).toContainText("Per questo pezzo non abbiamo ancora una foto");
    const og = await request.get("/it/produkte/kein-foto.png");
    expect(og.status()).toBe(200);
    expect(og.headers()["content-type"]).toContain("image/png");
    expect((await request.get("/xx/produkte/kein-foto.png")).status()).toBe(404);
  });

  test("Galerie: Lightbox lädt erst beim Öffnen, Fokus kehrt zurück, Thumbnails nach idle", async ({ page }) => {
    await page.goto(WITH_PHOTOS);
    await expect(page.locator(GALLERY_DIALOG)).toHaveCount(0);
    await expect(page.locator('[data-thumb="0"]')).toBeVisible({ timeout: 20_000 });
    const opener = page.getByRole("button", { name: /Bild 1 vergrößert ansehen/ }).last();
    await opener.click();
    const dialog = page.locator(`${GALLERY_DIALOG}[open]`);
    await expect(dialog).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(dialog).toContainText("2 von 4");
    await page.keyboard.press("Escape");
    await expect(page.locator(GALLERY_DIALOG)).toHaveCount(0);
    await expect(page.locator(":focus")).toHaveAttribute("aria-haspopup", "dialog");
  });

  test("Galerie-Bühne per Tastatur erreichbar, axe ohne scrollable-region-focusable", async ({ page }) => {
    await page.goto(WITH_PHOTOS);
    const stage = page.getByRole("region", { name: /^Bilder von .*2097-18/ });
    await expect(stage).toHaveAttribute("tabindex", "0");
    await stage.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("main")).toContainText("Bild 2 von 4");
    await expect.poll(() => stage.evaluate((el) => Math.round(el.scrollLeft / el.clientWidth))).toBe(1);
    const { violations } = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    const ids = violations.map((v) => v.id);
    expect(ids).not.toContain("scrollable-region-focusable");
    expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  });

  test("iPhone SE 375 × 568: Primärknopf über dem Cookie-Banner", async ({ browser }) => {
    const { defaultBrowserType: _ignored, ...se } = devices["iPhone SE"];
    const context = await browser.newContext({ ...se, viewport: { width: 375, height: 568 } });
    const page = await context.newPage();
    for (const url of [WITH_PHOTOS, NO_PHOTO]) {
      await page.goto(url);
      // r7-p1 (ux P1-5): the CTA word is "Termin anfragen" (no booking is chosen).
      const button = page.getByRole("link", { name: /Termin anfragen/ }).first();
      await expect(button).toBeVisible();
      const box = await button.boundingBox();
      const banner = page.getByRole("button", { name: "Alle akzeptieren" });
      if (await banner.isVisible()) {
        const top = await page.evaluate(() => {
          const el = [...document.querySelectorAll("*")].find((n) => getComputedStyle(n).position === "fixed" && /Cookie/.test(n.textContent || "") && n.getBoundingClientRect().height > 60);
          return el ? el.getBoundingClientRect().top : Infinity;
        });
        expect(box.y + box.height).toBeLessThanOrEqual(top);
      } else {
        expect(box.y + box.height).toBeLessThanOrEqual(568);
      }
    }
    await context.close();
  });
});
