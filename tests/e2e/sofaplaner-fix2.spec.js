// Sofaplaner – QM-Runde 2 (qa-screenshots/labs-ausbau/sofaplaner/feedback-2.md):
// P1-A 3D nach dem Scrollen auf iPhone und Pixel 7 sichtbar (Bühne bleibt
// sticky), P2-A Auswahlleiste verdeckt kein Element, P2-B Schrittüberschrift
// nicht unter dem Plan, wenn der Seitenkopf zurückkommt, P2-C Bezüge mit
// Quelle, P2-D Schritt „Ausführung“ mobil kurz (Akkordeon). Nichts wird gesendet.
import { test, expect, chromium, webkit, devices } from "@playwright/test";
import { blockFormSends, dismissCookieBanner } from "./helpers.js";
import { MINOTTI_DATA_CONSENT, NO_MINOTTI_REASON, SOFA_FAMILY, collectSofaplanerErrors } from "./sofaplaner-errors.js";

const PAGE = `/de/sofaplaner?m=${SOFA_FAMILY}`; // R7-P4: neutraler Typ ohne Minotti-Zustimmung

async function open(page, url) {
  await blockFormSends(page);
  await page.route("**/sofaplaner/teilen", (route) =>
    route.request().method() === "GET" ? route.continue() : route.fulfill({ status: 503, contentType: "application/json", body: "{}" })
  );
  await page.goto(url);
  await dismissCookieBanner(page, 8_000);
  await page.locator("[data-hydrated=true]").waitFor({ timeout: 90_000 });
}
async function settle(page) {
  await expect
    .poll(async () => {
      const a = await page.evaluate(() => window.scrollY);
      await page.waitForTimeout(250);
      return Math.abs((await page.evaluate(() => window.scrollY)) - a);
    })
    .toBeLessThan(1);
}
const intersects = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
/** No [data-id] element box overlaps the selection bar. */
async function barCovers(page) {
  const bar = await page.locator("[data-selbar]").boundingBox();
  const items = await page.locator("[data-id]").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
  return items.filter((b) => intersects(bar, b)).length;
}
/** Heading top vs. bottom edge of everything sticky above it. */
async function headClear(page) {
  return page.evaluate(() => {
    const h = document.querySelector("[data-step-head]").getBoundingClientRect();
    let bottom = 0;
    for (const el of document.querySelectorAll("[data-sticky]")) {
      if (getComputedStyle(el).position !== "sticky") continue;
      const r = el.getBoundingClientRect();
      if (r.right <= h.left || r.left >= h.right) continue;
      bottom = Math.max(bottom, r.bottom);
    }
    return Math.round(h.top - bottom);
  });
}

for (const [name, engine, device] of [
  ["iPhone 15 Pro (WebKit)", webkit, "iPhone 15 Pro"],
  ["Pixel 7 (Chromium)", chromium, "Pixel 7"],
]) {
  test(`P1-A ${name}: in Schritt 3 scrollen, „3D“ antippen – die Szene steht oben im Bild`, async ({ baseURL }) => {
    test.setTimeout(300_000);
    const browser = await engine.launch();
    const context = await browser.newContext({ ...devices[device], locale: "de-AT" });
    const page = await context.newPage();
    const errors = collectSofaplanerErrors(page); // QM Restliste P2-3: nur Dev-HMR-Router-Race ausgenommen
    try {
      await open(page, `${baseURL}${PAGE}`);
      await page.locator('[data-form="gerade"]').tap();
      await page.getByRole("button", { name: /Weiter: Anpassen/ }).tap();
      await settle(page);
      const all = page.getByRole("button", { name: /^Alle \d+ zeigen$/ });
      if (await all.count()) await all.first().tap();
      await page.evaluate(() => window.scrollBy(0, 1500));
      await page.waitForTimeout(500);
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
      await page.getByRole("button", { name: "3D-Vorschau" }).tap();
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 120_000 });
      const vh = await page.evaluate(() => window.innerHeight);
      await expect.poll(async () => page.evaluate(() => Math.round(document.querySelector("canvas").getBoundingClientRect().top)), { timeout: 10_000 }).toBeGreaterThanOrEqual(0);
      const top = await page.evaluate(() => document.querySelector("canvas").getBoundingClientRect().top);
      expect(top).toBeLessThan(vh / 2);
      // the touch overlay keeps the sticky canvas from catching the page scroll
      await expect(page.getByRole("button", { name: /Zum Drehen antippen/ })).toBeVisible();
      // back to 2D: the plan is still there, same place
      await page.getByRole("button", { name: "2D Draufsicht" }).tap();
      const svg = await page.locator("svg[data-editable]").boundingBox();
      expect(svg.y).toBeGreaterThanOrEqual(0);
      expect(svg.y).toBeLessThan(vh / 2);
      // the dev server forwards its own backoffice timeouts (layout data, shared
      // server under load) into the browser console – not an error of this page
      expect(errors.filter((e) => !/"src":"backoffice"/.test(e))).toEqual([]);
    } finally {
      await browser.close();
    }
  });
}

test("P2-A/P2-B/P2-D iPhone: Leiste unter dem Plan, Überschrift frei, „Ausführung“ kurz", async ({ baseURL }) => {
  test.setTimeout(300_000);
  const browser = await webkit.launch();
  const context = await browser.newContext({ ...devices["iPhone 15 Pro"], locale: "de-AT" });
  const page = await context.newPage();
  try {
    await open(page, `${baseURL}${PAGE}`);
    await page.locator('[data-form="ecke-rechts"]').tap();
    await page.getByRole("button", { name: /Weiter: Anpassen/ }).tap();
    await settle(page);
    await page.locator("[data-id]").first().tap();
    await expect(page.locator("[data-selbar]")).toBeVisible();
    expect(await barCovers(page)).toBe(0);
    // P2-D: step 4 accordion, only „Bezug“ open
    await page.getByRole("button", { name: /Weiter: Ausführung/ }).tap();
    await settle(page);
    expect(await headClear(page)).toBeGreaterThanOrEqual(0);
    await expect(page.locator("details[data-group]").first()).toHaveAttribute("open", "");
    expect(await page.locator("details[data-group][open]").count()).toBe(1);
    // the planner itself (top of the page to the end of the step column) – tips and site footer follow below
    expect(await page.evaluate(() => Math.round(document.querySelector('aside[aria-label="Planungsschritt"]').getBoundingClientRect().bottom + window.scrollY))).toBeLessThan(2500);
    // P2-B: scroll down (header slides away), then „Weiter“ – heading below the plan
    await page.evaluate(() => window.scrollBy(0, 900));
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: /Weiter: Im Raum prüfen/ }).tap();
    await settle(page);
    await page.waitForTimeout(800);
    expect(await headClear(page)).toBeGreaterThanOrEqual(0);
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: /Zurück/ }).last().tap();
    await settle(page);
    await page.waitForTimeout(800);
    expect(await headClear(page)).toBeGreaterThanOrEqual(0);
  } finally {
    await browser.close();
  }
});

test.describe("Sofaplaner QM R2 (Desktop)", () => {
  test("P2-A: Auswahlleiste über dem Plan, schneidet kein Element", async ({ page }) => {
    await open(page, PAGE);
    await page.locator('[data-form="u"]').click();
    // QM R3 P3-A: U-Form passt nicht in den Standardraum → Auswahl, hier „Trotzdem übernehmen“.
    // R7-P4: die neutralen Sofa-Typen passen in den Standardraum – dann gibt es keine Auswahl.
    if (MINOTTI_DATA_CONSENT) await page.locator("[data-nofit-choice]").getByRole("button", { name: "Trotzdem übernehmen" }).click();
    else await expect(page.locator("[data-id]")).toHaveCount(5);
    await page.getByRole("button", { name: /Weiter: Anpassen/ }).click();
    const items = page.locator("[data-id]");
    for (const i of [0, 1, 2]) {
      await items.nth(i).click();
      await expect(page.locator("[data-selbar]")).toBeVisible();
      expect(await barCovers(page)).toBe(0);
    }
    const bar = await page.locator("[data-selbar]").boundingBox();
    const svg = await page.locator("svg[data-editable]").boundingBox();
    expect(bar.y + bar.height).toBeLessThanOrEqual(svg.y + 1);
  });

  test("P2-C: Connery zeigt Bezüge laut Produktseite und markenweite Materialien mit Quelle", async ({ page }) => {
    test.skip(!MINOTTI_DATA_CONSENT, NO_MINOTTI_REASON + " (Bezugskollektionen von minotti.com)");
    await open(page, PAGE);
    await page.getByRole("navigation", { name: "Schritte" }).getByRole("button", { name: /Ausführung/ }).click();
    const model = page.locator('[data-covers="model"] li');
    expect(await model.count()).toBeGreaterThanOrEqual(3);
    await expect(model.filter({ hasText: "Aspen" })).toHaveCount(1);
    await page.locator("summary", { hasText: /Weitere Materialien der Minotti-Kollektion/ }).click();
    await expect(page.getByText(/Markenweit laut Hersteller – Verfügbarkeit je Modell im Showroom bestätigen/)).toBeVisible();
    const hrefs = await page.locator('[data-covers] a').evaluateAll((as) => as.map((a) => a.href));
    expect(hrefs.length).toBeGreaterThanOrEqual(4);
    for (const h of hrefs) expect(h).toMatch(/^https:\/\/www\.minotti\.com\//);
  });
});
