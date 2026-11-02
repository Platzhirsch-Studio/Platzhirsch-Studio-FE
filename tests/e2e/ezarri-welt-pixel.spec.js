// tests/e2e/ezarri-welt-pixel.spec.js – Team A, Pixel 7 (Chromium).
// Gleiche Handy-Abläufe wie auf dem iPhone (ezarri-welt-mobile.js, QM Runde 1).
// Run: PW_WORKERS=1 npx playwright test tests/e2e/ezarri-welt-pixel.spec.js --project=desktop
// (läuft im Projekt „desktop“, das Gerät kommt aus test.use unten)
import { test, devices } from "@playwright/test";
import { mobileFlows, mobileGalleryFlows } from "./ezarri-welt-mobile.js";

const { defaultBrowserType, ...pixel } = devices["Pixel 7"];
test.use({ ...pixel, browserName: defaultBrowserType });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort());
});

mobileFlows(test, "Pixel 7");
mobileGalleryFlows(test, "Pixel 7");
