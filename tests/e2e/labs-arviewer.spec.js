// 3D/AR-Viewer (Labs), Runde 2 – Auflage 1 (Maße mobil), Hotspots, Lazy-3D, Konsole.
// Läuft im desktop-Projekt; der Maß-Test emuliert zusätzlich ein Handy-Hochformat.
// Bild-Requests gehen ohne AVIF raus: im Dev-Server hing ein AVIF-Eintrag des
// Optimizers (siehe Marktresearch/digital/features/ar-viewer.md, Runde 2).
import { test, expect, devices } from "@playwright/test";
import { collectConsoleErrors, dismissCookieBanner } from "./helpers.js";

const PAGE = "/de/3d-ansicht";
const noAvif = (page) =>
  page.route("**/_next/image**", (r) => r.continue({ headers: { ...r.request().headers(), accept: "image/webp,*/*" } }));
const waitLoaded = (page) =>
  page.waitForFunction(() => document.querySelector("model-viewer")?.loaded, null, { timeout: 90_000 });

test.describe("AR-Viewer R2", () => {
  test("ohne Klick kein 3D (kein model-viewer, kein .glb)", async ({ page }) => {
    const glb = [];
    page.on("request", (r) => r.url().endsWith(".glb") && glb.push(r.url()));
    await noAvif(page);
    await page.goto(PAGE);
    await expect(page.getByRole("button", { name: /3D ansehen/ })).toBeVisible();
    await page.waitForTimeout(1500);
    expect(await page.locator("model-viewer").count()).toBe(0);
    expect(glb).toEqual([]);
  });

  test.describe("Handy hochkant", () => {
    // Pixel-7-Maße (Chromium-Projekt): Viewport, Touch, DPR – ohne Browserwechsel.
    const { viewport, deviceScaleFactor, isMobile, hasTouch, userAgent } = devices["Pixel 7"];
    test.use({ viewport, deviceScaleFactor, isMobile, hasTouch, userAgent });
    test("Auflage 1: alle drei Maße lesbar, Hotspots aus, Modellwechsel ohne Fehler", async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await noAvif(page);
      await page.goto(PAGE);
      await dismissCookieBanner(page, 8_000);
      await page.getByRole("button", { name: /3D ansehen/ }).click();
      await waitLoaded(page);
      await page.getByRole("button", { name: "Maße anzeigen" }).click();
      const bar = page.getByTestId("arv-dims-bar");
      await expect(bar).toContainText(/Breite\s*181 cm/i);
      await expect(bar).toContainText(/Tiefe\s*82 cm/i);
      await expect(bar).toContainText(/Höhe\s*71 cm/i);
      const hotspots = page.locator('model-viewer button[slot^="hotspot-"]:not([slot="ar-button"])');
      for (const h of await hotspots.all()) await expect(h).toBeHidden();
      await page.getByRole("button", { name: /sessel/i }).first().click();
      await waitLoaded(page);
      await expect(bar).toContainText(/Breite\s*101 cm/i);
      await expect(page).toHaveURL(/modell=mid_century_lounge_chair/);
      expect(errors).toEqual([]);
    });
  });
});
