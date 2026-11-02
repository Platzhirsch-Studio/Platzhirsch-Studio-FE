// tests/e2e/labs-kino-3d.spec.js – Kino-Lab 2 „3D-Bühne“ (/de/preview/kino-3d).
// Prüft: Seite lädt (Vorschau an), noindex, eine H1, axe 0 (Desktop),
// ruhige Fassung bei prefers-reduced-motion auf 390 px (Standbild + alle
// Karten untereinander, keine Sticky-Bühne, kein WebGL geladen, axe 0, kein
// Überlauf). Läuft im Projekt `desktop`; mit PW_WORKERS=1 starten.
// In Produktion ohne DESIGN_PREVIEW=1 ist die Seite 404 (wie die anderen Vorschauen).
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { collectConsoleErrors, dismissCookieBanner, measureOverflow } from "./helpers.js";

const PATH = "/de/preview/kino-3d";
const SKIP = process.env.DESIGN_PREVIEW_EXPECT === "off";
const MOBIL = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.describe("Kino 3D-Bühne – Vorschau", () => {
  test.skip(SKIP, "Design-Vorschau in dieser Umgebung aus");

  test("lädt, noindex, eine H1, Schild mit Beispiel-Hinweis, axe 0", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const res = await page.goto(PATH, { timeout: 120_000 });
    expect(res.status()).toBe(200);
    await dismissCookieBanner(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Erst die Linie.");
    const track = page.locator("[data-kino-track]");
    await expect(track).toHaveAttribute("data-mode", /^(live|static)$/);
    // Produkt-Schild: Beispielmodell klar gekennzeichnet, Link in den Katalog
    const plate = page.locator('[data-plate="sofa_02"]');
    await expect(plate).toContainText("kein Produkt aus unserem Sortiment");
    await expect(plate.getByRole("link", { name: /Sofas & Couches im Sortiment/ })).toHaveAttribute("href", "/de/produkte/sofas-couches");
    // Termin-CTA steht im DOM
    await expect(page.locator('[data-c="6"] a[href="/de/beratung"]')).toContainText("Termin anfragen");
    if ((await track.getAttribute("data-mode")) === "live") {
      // Tastatur-Alternative zum Ziehen
      await expect(page.getByRole("button", { name: "Möbel nach rechts drehen" })).toBeVisible();
    }
    const axe = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    expect(errors).toEqual([]);
  });
});

test.describe("Kino 3D-Bühne – ruhige Fassung 390 px", () => {
  test.skip(SKIP, "Design-Vorschau in dieser Umgebung aus");
  test.use({ ...MOBIL, reducedMotion: "reduce" });

  test("Standbild statt WebGL, alle Karten untereinander, axe 0, kein Überlauf", async ({ page }) => {
    await page.goto(PATH, { timeout: 120_000 });
    await dismissCookieBanner(page);
    const track = page.locator("[data-kino-track]");
    await expect(track).toHaveAttribute("data-mode", "static");
    await expect(page.locator("[data-viewport]")).toHaveCSS("position", "static");
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("img", { name: /Gerendertes Standbild der 3D-Bühne/ })).toBeVisible();
    for (const t of ["Dann Ihr Raum.", "Rücken in Capitonné.", "Ein zweites Stück, dieselbe Bühne.", "Abends am See.", "Wir nehmen uns Zeit."]) {
      await expect(page.getByRole("heading", { name: t })).toBeVisible();
    }
    await expect(page.getByRole("group", { name: "3D-Bühne steuern" })).toBeHidden();
    const { vw, sw } = await measureOverflow(page);
    expect(sw).toBeLessThanOrEqual(vw);
    const axe = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
