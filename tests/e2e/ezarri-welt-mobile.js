// tests/e2e/ezarri-welt-mobile.js – gemeinsame Handy-Abläufe der Ezarri-Welt
// (Team A, QM Runde 1: qa-screenshots/ezarri/welt/feedback-1.md). Kein Spec:
// eingebunden von ezarri-welt-iphone.spec.js (WebKit) und ezarri-welt-pixel.spec.js (Chromium).
import { expect } from "@playwright/test";
import { dismissCookieBanner } from "./helpers.js";

/** Liegt die Mitte des Elements frei (nichts darüber, z. B. die Termin-Leiste)? */
const centerHits = (locator) =>
  locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
  });

export function mobileFlows(test, label) {
  test(`${label}: erste Mosaik-Karte im ersten Bildschirm (QM P2-1)`, async ({ page }) => {
    await page.goto("/de/ezarri/mosaike", { waitUntil: "domcontentloaded" });
    const top = await page.locator("main article").first().evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeLessThan(await page.evaluate(() => window.innerHeight));
  });

  test(`${label}: Filter im Bottom-Sheet, Hexa trifft genau 7 (QM P2-1, P2-3)`, async ({ page }) => {
    await page.goto("/de/ezarri/mosaike", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page); // erscheint nach der Hydration: zugleich Signal, dass die Inseln bereit sind
    await page.getByRole("button", { name: /^Filter/ }).tap();
    const sheet = page.getByRole("dialog", { name: "Mosaike filtern" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("group", { name: "Format" }).getByText("Hexa").tap();
    await expect(page).toHaveURL(/format=hexa/);
    await sheet.getByRole("button", { name: "7 Mosaike anzeigen" }).tap();
    await expect(sheet).toBeHidden();
    await expect(page.locator('p[aria-live="polite"]').first()).toContainText(/^7 Mosaike/);
    await expect(page.getByRole("button", { name: "Filter (1)" })).toBeFocused();
  });

  // QM P1-1: Nach dem Scrollen lag die Termin-Leiste (MobileCtaBar) über der Vergleichsleiste.
  test(`${label}: Vergleich nach dem Scrollen erreichbar, Termin-Leiste weicht aus (QM P1-1)`, async ({ page }) => {
    await page.goto("/de/ezarri/mosaike", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.removeItem("ezarri-vergleich"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    const compare = page.getByRole("button", { name: /^Vergleichen/ });
    // weit über den ersten Bildschirm hinaus: hier erschien früher die Termin-Leiste
    await compare.nth(7).scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await compare.nth(7).tap();
    await compare.nth(8).tap();
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    const bar = page.getByRole("region", { name: "Vergleich (2)" });
    await expect(bar).toBeVisible();
    const link = bar.getByRole("link", { name: "Vergleich ansehen" });
    expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44);
    await expect.poll(() => centerHits(link)).toBe(true);
    await link.tap();
    await expect(page).toHaveURL(/\/de\/ezarri\/mosaike\/vergleich\?ids=[^,]+,[^,]+$/, { timeout: 120_000 });
  });

  test(`${label}: Vergleich mobil als Merkmal-Zeilen mit klebendem Bildkopf (QM P2-6)`, async ({ page }) => {
    await page.goto("/de/ezarri/mosaike/vergleich?ids=basalt,basalt-50", { waitUntil: "domcontentloaded" });
    const head = page.getByRole("list", { name: "Verglichene Mosaike" });
    await expect(head).toBeVisible();
    await expect(page.locator("table")).toBeHidden();
    const format = page.locator("dl dt", { hasText: "Format" }).first().locator("xpath=..");
    await expect(format.locator("dd")).toContainText("25 mm");
    await expect(format.locator("dd")).toContainText("50 mm");
    await expect(format).toContainText("unterschiedlich");
    const widths = await head.locator("li").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));
    expect(Math.min(...widths)).toBeGreaterThan(120); // je Mosaik eine halbe Breite, nicht 1,3 Spalten
  });
}

// QM Runde 2 P2-4: Galerie mit derselben Bedienung wie /ezarri/mosaike.
export function mobileGalleryFlows(test, label) {
  test(`${label}: Galerie – erstes Bild im ersten Bildschirm, Filter im Bottom-Sheet ohne „Filter anwenden“ (QM2 P2-4)`, async ({ page }) => {
    await page.goto("/de/ezarri/galerie", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    const top = await page.getByRole("button", { name: /^Bild groß ansehen/ }).first().evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeLessThan(await page.evaluate(() => window.innerHeight));
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.getByRole("button", { name: /^Filter/ }).tap();
    const sheet = page.getByRole("dialog", { name: "Galerie filtern" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("group", { name: "Einsatz" }).getByText("Küche").tap();
    await expect(page).toHaveURL(/einsatz=kueche/);
    const show = sheet.getByRole("button", { name: /^\d+ Bilder anzeigen$/ });
    await expect(show).toBeVisible();
    await show.tap();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("button", { name: "Filter (1)" })).toBeVisible();
  });
}
