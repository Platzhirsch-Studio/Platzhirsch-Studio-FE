// tests/e2e/r5-schweiz.spec.js — R5-schweiz: Schweiz-Hub /de/einkaufen-aus-der-schweiz.
// Run: npx playwright test tests/e2e/r5-schweiz.spec.js --project=desktop
// Gegen den laufenden Server (:3000 oder BASE_URL). Kein Versand, keine Daten:
// die Server Function rechnet nur.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { settle } from "./helpers.js";

const PATH = "/de/einkaufen-aus-der-schweiz";

async function dismissCookies(page) {
  const btn = page.getByRole("button", { name: "Weiter ohne Einwilligung" }).first();
  try {
    await btn.waitFor({ state: "visible", timeout: 8_000 });
    await btn.click();
  } catch {
    // kein Banner
  }
}

// Runde 3 P5 (seo P1-4): eigener Canonical statt keinem, weiter noindex.
test("noindex,follow, eigener Canonical, Entwurfs-Banner, andere Locales 404", async ({ page, request }) => {
  const res = await page.goto(PATH);
  expect(res.status()).toBe(200);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://platzhirsch.studio/de/einkaufen-aus-der-schweiz");
  await expect(page.getByText("Entwurf, Freigabe durch Steuerberater/Zollspediteur offen")).toBeVisible();
  // QM-Endabnahme 02.11.2026 (bewusst geändert): Seite ist viersprachig (content-intl.js) – EN/FR/IT liefern
  // 200, bleiben noindex,follow mit eigenem Canonical.
  for (const l of ["en", "fr", "it"]) {
    const r = await request.get(`/${l}${PATH.replace(/^\/de/, "")}`); // vorher /en/de/… (immer 404)
    expect(r.status(), l).toBe(200);
    expect(await r.text(), l).toMatch(/<meta name="robots" content="noindex, follow"/);
  }
  const main = await page.locator("main").innerText();
  // Rat 9,5 A10 (bewusst geändert): de-CH ohne ß – außer im NAP „Landstraße 11“
  // (Firmenbuch, Inhaber-Entscheidung Nr. 2), der überall gleich geschrieben wird.
  expect(main.split(/Landstraße[  ]11/).join("")).not.toMatch(/ß|steuerfrei|Festpreis|\[prüfen/i);
});

test("Rechner: Beispiel, Neuberechnung mit Fracht, Fehler am Feld", async ({ page }) => {
  await page.goto(PATH);
  await settle(page);
  await dismissCookies(page);
  const rechner = page.locator("#rechner");
  await expect(rechner.getByText("Unverbindliche Kostenschätzung").first()).toBeVisible();
  await expect(rechner.getByText(/1 € = \d\.\d{4} CHF/)).toBeVisible();
  await expect(rechner.getByText("nicht eingerechnet", { exact: true })).toBeVisible();

  await page.getByLabel("Lieferkosten in Euro, falls bekannt (Weg B)").fill("450");
  await page.getByRole("button", { name: "Kosten schätzen" }).click();
  await expect(rechner.getByText(/Lieferkosten laut Ihrer Angabe/)).toBeVisible({ timeout: 60_000 }); // Server Function, im Dev-Server unter Last langsam

  await page.getByLabel("Preis in Euro (inkl. 20 % österreichischer USt)").fill("abc");
  await page.getByRole("button", { name: "Kosten schätzen" }).click();
  const field = page.getByLabel("Preis in Euro (inkl. 20 % österreichischer USt)");
  await expect(field).toHaveAttribute("aria-invalid", "true", { timeout: 60_000 });
  await expect(rechner.getByRole("alert")).toBeFocused();
});

test("axe: keine serious/critical-Befunde", async ({ page }) => {
  await page.goto(PATH);
  await settle(page);
  await dismissCookies(page);
  const r = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  expect(bad.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});
