// tests/e2e/kino-zeichnung.spec.js – Kino-Lab 3 „Die Zeichnung wird lebendig“
// (/de/preview/kino-zeichnung). Prüft: lädt (Vorschau an), noindex, eine H1,
// axe 0, Linie zeichnet und blendet ins Foto (data-phase), Vermerk
// „Animation“, Herstellerbild-Credits; ruhige Fassung bei reduced motion
// (statische Zeichnung + Bild, keine Canvas-Animation), 390 px ohne Überlauf.
// Mit PW_WORKERS=1 starten. In Produktion ohne DESIGN_PREVIEW=1 → 404.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { collectConsoleErrors, dismissCookieBanner, measureOverflow } from "./helpers.js";

const PATH = "/de/preview/kino-zeichnung";
const SKIP = process.env.DESIGN_PREVIEW_EXPECT === "off";
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const MOBIL = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

test.describe("Kino-Zeichnung – Vorschau", () => {
  test.skip(SKIP, "Design-Vorschau in dieser Umgebung aus");

  test("lädt, noindex, H1, zeichnet und blendet ins Foto, axe 0", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const errors = collectConsoleErrors(page);
    const res = await page.goto(PATH, { timeout: 120_000 });
    expect(res.status()).toBe(200);
    await dismissCookieBanner(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Erst die Linie.");

    const hero = page.locator("figure[data-mode]").first();
    await expect(hero).toHaveAttribute("data-mode", "live");
    await expect(hero).toHaveAttribute("data-phase", /draw|fill|done/, { timeout: 15_000 });
    await expect(hero).toHaveAttribute("data-phase", /fill|done/, { timeout: 15_000 });
    // Inhaber 31.10.2026: kein Hinweistext an der Animation.
    await expect(hero.getByText("Animation · keine Originalskizze")).toHaveCount(0);

    // Inhaber 31.10.2026: Café-Szene zeigt ein eigenes Foto statt Nachtmann.
    for (const credit of ["Bild: Bora", "Bild: Agape", "Foto: Heidegger Fotografie"]) {
      await expect(page.getByText(credit, { exact: false })).toHaveCount(1);
    }
    // QM-Endabnahme 02.11.2026 (bewusst geändert): ClosingCta sagt mit eigenem Kalender „Termin wählen“
    // (terminLabel, qm-shell-home-r3), sonst „Termin anfragen“.
    await expect(page.getByRole("link", { name: /^Termin (anfragen|wählen)/ }).first()).toBeVisible();

    // Szene startet beim Hineinscrollen
    const kueche = page.locator("#kz-kueche figure");
    await kueche.scrollIntoViewIfNeeded();
    await expect(kueche).toHaveAttribute("data-phase", /draw|fill|done/, { timeout: 10_000 });

    const axe = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("Bewegung anhalten schaltet auf die ruhige Fassung", async ({ page }) => {
    await page.goto(PATH, { timeout: 120_000 });
    await dismissCookieBanner(page);
    const btn = page.getByRole("button", { name: "Bewegung anhalten" });
    await btn.click();
    await expect(btn).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("figure[data-mode]").first()).toHaveAttribute("data-mode", "ruhig");
  });
});

test.describe("Kino-Zeichnung – reduced motion, 390 px", () => {
  test.skip(SKIP, "Design-Vorschau in dieser Umgebung aus");
  test.use({ ...MOBIL, reducedMotion: "reduce" });

  test("statische Zeichnung + Bild, axe 0, kein Überlauf", async ({ page }) => {
    await page.goto(PATH, { timeout: 120_000 });
    await dismissCookieBanner(page);
    const figs = page.locator("figure[data-mode]");
    await expect(figs).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      const f = figs.nth(i);
      await expect(f).toHaveAttribute("data-mode", "ruhig");
      await expect(f).not.toHaveAttribute("data-phase", /.+/);
      await expect(f.locator("svg path").first()).toHaveCSS("opacity", "1");
      await expect(f.locator("canvas").first()).toHaveCSS("display", "none");
      await expect(f.locator("img").locator("xpath=..")).toHaveCSS("opacity", "1");
    }
    await expect(page.getByRole("button", { name: "Noch einmal zeichnen" })).toHaveCount(0);
    const { vw, sw } = await measureOverflow(page);
    expect(sw).toBeLessThanOrEqual(vw);
    const axe = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
