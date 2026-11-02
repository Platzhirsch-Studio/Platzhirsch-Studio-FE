// tests/e2e/ezarri-welt-iphone.spec.js – Team A, iPhone 15 Pro (WebKit).
// Mobil zuerst: kein Querscroll, Filter im Bottom-Sheet, Lightbox, Vergleichsleiste.
// Die Abläufe aus ezarri-welt-mobile.js laufen zusätzlich auf Pixel 7 (ezarri-welt-pixel.spec.js).
// Run: PW_WORKERS=1 npx playwright test tests/e2e/ezarri-welt-iphone.spec.js --project=desktop
// (läuft im Projekt „desktop“, Gerät und Browser kommen aus test.use unten)
import { test, expect, devices } from "@playwright/test";
import { dismissCookieBanner } from "./helpers.js";
import { mobileFlows, mobileGalleryFlows } from "./ezarri-welt-mobile.js";

const { defaultBrowserType, ...iphone } = devices["iPhone 15 Pro"];
test.use({ ...iphone, browserName: defaultBrowserType });

const noHorizontalScroll = async (page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort());
});

for (const url of ["/de/ezarri", "/de/ezarri/mosaike", "/de/ezarri/galerie", "/de/ezarri/pool", "/de/ezarri/mosaike/dune", "/de/ezarri/kollektionen/gea", "/de/ezarri/mosaike/vergleich?ids=dune,basalt"]) {
  test(`${url}: 393 px ohne Querscroll, eine H1`, async ({ page }) => {
    const res = await page.goto(url, { waitUntil: "domcontentloaded" });
    expect(res.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await noHorizontalScroll(page);
  });
}

mobileFlows(test, "iPhone");
mobileGalleryFlows(test, "iPhone");

test("Galerie-Lightbox auf dem iPhone", async ({ page }) => {
  await page.goto("/de/ezarri/galerie", { waitUntil: "domcontentloaded" });
  await dismissCookieBanner(page);
  await page.getByRole("button", { name: /^Bild groß ansehen/ }).first().tap();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Nächstes Bild" }).tap();
  await expect(dialog.getByText(/^2 \/ \d+$/)).toBeVisible();
  await dialog.getByRole("button", { name: "Schließen" }).tap();
  await expect(dialog).toBeHidden();
});
