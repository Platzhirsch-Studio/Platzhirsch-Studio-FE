// tests/e2e/sofaplaner-en.spec.js
// /en/sofaplaner and /en/yacht-interior in English (Welle 2, team EN-Yacht-Sofa).
// Until the integration takes both pages out of the EN 308 (deOnlyRedirects.cjs),
// /en/<page> still redirects to /de; the spec then opens the same route via a
// percent-encoded path segment, which Next routes to the page while the
// redirect rule (exact match) does not apply. No form is sent.
import { test, expect } from "@playwright/test";
import { collectConsoleErrors, dismissCookieBanner } from "./helpers.js";

const GERMAN = /[äöüßÄÖÜ]|\b(und|oder|mit|nicht|bitte|wählen|Termin|Rücken|Armlehne|Werft|Bootssattler)\b/;
const ALLOWED = /Landstraße|Pfänder|Württemberg|Bergère|Sofà/g;

async function openEn(page, path, encoded) {
  const res = await page.goto(path, { waitUntil: "domcontentloaded" });
  if (new URL(page.url()).pathname.startsWith("/de/")) await page.goto(encoded, { waitUntil: "domcontentloaded" });
  return res;
}

/** Visible text of the main area without parts marked lang="de" (maker notes kept in German on purpose). */
async function visibleEnglish(page) {
  return page.locator("main").evaluate((m) => {
    const out = [];
    const walker = document.createTreeWalker(m, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || el.closest('[lang="de"], script, style, [hidden], [aria-hidden="true"], noscript')) continue;
      const t = n.textContent.trim();
      if (t) out.push(t);
    }
    return out.join("\n");
  });
}

test.describe("Sofaplaner EN", () => {
  test("Seite englisch, hreflang de/en, Planer Schritt 1–6 ohne deutsche Oberfläche", async ({ page }) => {
    test.setTimeout(240_000);
    const errors = collectConsoleErrors(page);
    await openEn(page, "/en/sofaplaner?m=connery", "/en/sofaplane%72?m=connery");
    await dismissCookieBanner(page).catch(() => {});
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).toHaveText("Your sofa, planned module by module.");
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", "https://platzhirsch.studio/en/sofaplaner");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://platzhirsch.studio/en/sofaplaner");
    await expect(page.locator("[data-hydrated]")).toHaveCount(1, { timeout: 90_000 });
    await expect(page.getByRole("heading", { name: "Choose a shape" })).toBeVisible();
    for (const step of ["Adjust", "Finish", "Check in the room", "Overview"]) {
      await page.getByRole("button", { name: new RegExp(`^Next: ${step}`) }).click();
      await expect(page.getByRole("heading", { name: step, exact: true })).toBeVisible();
      const text = (await visibleEnglish(page)).replace(ALLOWED, "");
      const hit = text.split("\n").find((l) => GERMAN.test(l));
      expect(hit, `${step}: deutscher Text`).toBeUndefined();
    }
    await expect(page.locator('a[href^="/en/consultation"]').first()).toBeAttached();
    expect(errors).toEqual([]);
  });
});

test.describe("Yacht EN", () => {
  test("Seite, Werfthalle und Konzept-Reiter englisch", async ({ page }) => {
    test.setTimeout(240_000);
    await openEn(page, "/en/yacht-interior", "/en/yacht%2Dinterior");
    await dismissCookieBanner(page).catch(() => {});
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).toHaveText("Yacht interiors on Lake Constance");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://platzhirsch.studio/en/yacht-interior");
    await expect(page.locator("[data-ki-hinweis]")).toContainText("AI-generated"); // QM-Endabnahme: Hinweis nennt jetzt auch Blender-Renderings (bewusst geändert)
    const zones = page.getByRole("list", { name: "Zones on board" });
    await expect(async () => {
      await zones.getByRole("button", { name: /Saloon/ }).click();
      await expect(page.locator("[data-yacht-live]")).toContainText("Saloon");
    }).toPass({ timeout: 60_000 });
    // a tab whose panel loads in the browser comes in English, too
    await page.getByRole("tab", { name: /Sailing yacht/ }).click();
    await expect(page.locator("[data-concept-panel]:not([hidden])")).toContainText("Colour world", { timeout: 30_000 });
    const text = (await visibleEnglish(page)).replace(ALLOWED, "");
    const hit = text.split("\n").find((l) => GERMAN.test(l));
    expect(hit, "deutscher Text").toBeUndefined();
  });
});
