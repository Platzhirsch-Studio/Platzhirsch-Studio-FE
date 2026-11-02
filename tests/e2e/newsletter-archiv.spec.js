// tests/e2e/newsletter-archiv.spec.js — Welle 2, Newsletter-Archiv (nur DE).
//   PW_WORKERS=1 npx playwright test newsletter-archiv.spec.js
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissCookies } from "./concierge-helpers.js";

test.describe("Newsletter-Archiv", () => {
  test("ohne versendete Ausgabe: ehrlicher Hinweis, noindex", async ({ page }) => {
    const res = await page.goto("/de/newsletter/archiv");
    expect(res.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Newsletter-Archiv");
    await expect(page.getByText("Die erste Ausgabe ist in Vorbereitung")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("nicht versendete Ausgabe: 404; EN: 404", async ({ page }) => {
    expect((await page.goto("/de/newsletter/archiv/2026-11")).status()).toBe(404);
    expect((await page.goto("/en/newsletter/archiv")).status()).toBe(404);
  });

  test("Vorschau (nur Dev): Slots als Platzhalter markiert, Termin echt", async ({ page }) => {
    const res = await page.goto("/de/newsletter/archiv/2026-11?vorschau=1");
    test.skip(res.status() === 404, "Produktionsserver: Vorschau aus");
    await expect(page.getByText("Platzhalter (nur Vorschau): Haralds Skizze des Monats")).toBeVisible();
    await expect(page.getByText("Platzhalter (nur Vorschau): Neu in der Ausstellung")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Adventsabend im Showroom" })).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);
    await dismissCookies(page).catch(() => {});
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).exclude("nextjs-portal").analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
