// tests/e2e/kino-film.spec.js – Kino-Lab 1 „Showroom-Film“ (/de/preview/kino-film).
// Prüft: Seite lädt (Vorschau an), noindex, eine H1, sechs Szenen, axe 0,
// Szenen-Navigation folgt dem Scrollen; ruhige Fassung (reduced motion):
// keine Bühne/kein HUD, alle drei Herstellerbilder ganz sichtbar, axe 0, kein
// Überlauf bei 390 px. Läuft im Projekt `desktop`; mit PW_WORKERS=1 starten.
// In Produktion ohne DESIGN_PREVIEW=1 ist die Seite 404 (wie die anderen Vorschauen).
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { collectConsoleErrors, dismissCookieBanner, measureOverflow } from "./helpers.js";

const PATH = "/de/preview/kino-film";
const SKIP = process.env.DESIGN_PREVIEW_EXPECT === "off";
const MOBIL = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.describe("Kino-Film – Vorschau", () => {
  test.skip(SKIP, "Design-Vorschau in dieser Umgebung aus");

  test("lädt, noindex, eine H1, sechs Szenen, axe 0, Szenen-Navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const errors = collectConsoleErrors(page);
    const res = await page.goto(PATH, { timeout: 120_000 });
    expect(res.status()).toBe(200);
    await dismissCookieBanner(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Erst die Linie.");
    await expect(page.locator("section[data-scene-index]")).toHaveCount(6);
    await expect(page.getByRole("heading", { name: /Minotti Studio/ })).toBeVisible();
    await expect(page.locator("[data-kino-termin]")).toHaveAttribute("href", /\/de\/(beratung|termin)\?thema=Showroom-Film/);
    await expect(page.getByText("Landstraße 11, 6911 Lochau")).toBeAttached();

    const root = page.locator("[data-kino-film]");
    await expect(root).toHaveAttribute("data-motion-ok", "");
    await page.getByRole("navigation", { name: "Szenen des Films" }).getByRole("link", { name: /Wasser/ }).click();
    await expect(root).toHaveAttribute("data-scene", "3");
    await expect(page.getByRole("button", { name: "Film anhalten" })).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 0));
    const axe = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    expect(errors).toEqual([]);
  });
});

test.describe("Kino-Film – ruhige Fassung und 390 px", () => {
  test.skip(SKIP, "Design-Vorschau in dieser Umgebung aus");
  test.use({ ...MOBIL, reducedMotion: "reduce" });

  test("Standbilder statt Film, alle Herstellerbilder ganz, axe 0, kein Überlauf", async ({ page }) => {
    await page.goto(PATH, { timeout: 120_000 });
    await dismissCookieBanner(page);
    const root = page.locator("[data-kino-film]");
    await expect(root).not.toHaveAttribute("data-motion-ok", "");
    await expect(root).not.toHaveAttribute("data-live", "");
    await expect(page.getByRole("button", { name: /Film anhalten/ })).toHaveCount(0);
    for (const t of ["Ein Raum zum Hineingehen.", "Wasser & Wärme.", "Und danach: das Café im Haus.", "Die nächste Szene spielt bei Ihnen."]) {
      await expect(page.getByRole("heading", { name: t })).toBeVisible();
    }
    // Herstellerbilder: alle drei sichtbar, ungeschnitten (object-fit: contain) mit Bildnachweis
    const imgs = page.locator("section#kf-4 img");
    await expect(imgs).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await imgs.nth(i).scrollIntoViewIfNeeded();
      await expect(imgs.nth(i)).toBeVisible();
      await expect(imgs.nth(i)).toHaveCSS("object-fit", "contain");
    }
    for (const b of ["Dornbracht", "Starpool", "antoniolupi"]) await expect(page.getByText(`Bild: ${b}`, { exact: true })).toBeVisible();
    const { vw, sw } = await measureOverflow(page);
    expect(sw).toBeLessThanOrEqual(vw);
    await page.evaluate(() => window.scrollTo(0, 0));
    const axe = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
