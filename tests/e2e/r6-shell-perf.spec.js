// R6-shell-perf: language switch on German-only pages (no 404, visible note,
// hreflang untouched), mega menu with server-built panels, global 404 in the
// house fonts, consent bar after idle with unchanged names. Read-only.
//   npx playwright test tests/e2e/r6-shell-perf.spec.js --project=desktop
import { test, expect, devices } from "@playwright/test";

// Endtest 29.10.2026 (bewusst geändert): /de/projekte fehlt hier – ohne freigegebenes
// Projekt leitet es auf /de/arbeitsweise (R5, inhaber-offen E.20), und diese Seite
// gibt es seit R5-fix P2 in allen vier Sprachen (Sprachlinks auf dieselbe Seite).
// QM-Endabnahme 02.11.2026 (bewusst geändert): /einkaufen-aus-der-schweiz ist viersprachig (content-intl.js).
const GERMAN_ONLY = ["/de/ratgeber", "/de/bewerten"];
const NOTE = /Diese Seite gibt es nur auf Deutsch/;

for (const path of GERMAN_ONLY) {
  test(`Sprachumschalter ${path}: EN/FR/IT führen zur Startseite, kein 404`, async ({ page, request }) => {
    const res = await page.goto(path, { waitUntil: "load" });
    test.skip(res.status() === 404, `${path} ist in diesem Build nicht freigeschaltet`);
    const hreflangBefore = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((ls) => ls.map((l) => `${l.hreflang}=${l.href}`));
    await page.getByRole("button", { name: /Sprache/ }).click();
    const list = page.locator("#ph-language-list");
    await expect(list).toBeVisible();
    await expect(list).toContainText(NOTE);
    const hrefs = await list.locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    expect(hrefs).toEqual([path, "/en", "/fr", "/it"]);
    for (const href of hrefs) expect((await request.get(href)).status(), href).toBe(200);
    // hreflang is the page's business, the switch does not change it.
    expect(await page.locator('link[rel="alternate"][hreflang]').evaluateAll((ls) => ls.map((l) => `${l.hreflang}=${l.href}`))).toEqual(hreflangBefore);
  });
}

test("Übersetzte Seite: kein Hinweis, Sprachlinks auf dieselbe Seite", async ({ page }) => {
  await page.goto("/de/kontakt", { waitUntil: "load" });
  await page.getByRole("button", { name: /Sprache/ }).click();
  const list = page.locator("#ph-language-list");
  await expect(list).not.toContainText(NOTE);
  expect(await list.locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual(["/de/kontakt", "/en/contact", "/fr/contact", "/it/contatto"]);
});

test("Mobilmenü auf DE-only-Seite zeigt den Hinweis", async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ ...devices["Pixel 7"], baseURL });
  const page = await ctx.newPage();
  await page.goto("/de/ratgeber", { waitUntil: "load" });
  await page.getByRole("button", { name: /Menü/ }).first().click();
  await expect(page.locator("dialog[open]")).toContainText(NOTE);
  await ctx.close();
});

test("Mega-Menü: Server-HTML-Panel öffnet, aria-current, Esc schließt mit Fokus zurück", async ({ page }) => {
  await page.goto("/de/produkte/sofas-couches", { waitUntil: "load" });
  const trigger = page.locator("#ph-nav-trigger-living");
  await trigger.click();
  const panel = page.locator("#ph-nav-panel-living");
  await expect(panel).toBeVisible();
  await expect(panel.locator('a[aria-current="page"]')).toHaveText(/Sofas/);
  expect(await panel.locator("a").count()).toBeGreaterThan(5);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("Globale 404 (/wp-login.php): 404 in Bodoni/Instrument Sans", async ({ page }) => {
  const res = await page.goto("/wp-login.php", { waitUntil: "load" });
  expect(res.status()).toBe(404);
  const h1 = page.locator("h1");
  await expect(h1).toHaveCount(1);
  await page.evaluate(() => document.fonts.ready);
  expect(await h1.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/Bodoni Moda/);
  expect(await page.locator("body").evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/Instrument Sans/);
  expect(await page.evaluate(() => [...document.fonts].some((f) => f.family.includes("Bodoni") && f.status === "loaded"))).toBe(true);
});

test("Consent-Leiste erscheint nach dem Leerlauf, Namen unverändert", async ({ page }) => {
  await page.goto("/de", { waitUntil: "load" });
  const region = page.getByRole("region", { name: /^Cookie-Einstellungen$/ });
  await expect(region).toBeVisible({ timeout: 10_000 });
  for (const name of ["Alle akzeptieren", "Weiter ohne Einwilligung", "Individuelle Einstellungen"]) {
    await expect(region.getByRole("button", { name })).toBeVisible();
  }
});
