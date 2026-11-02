// Ezarri-Konfigurator (Team B) – iPhone 15 Pro (WebKit). Läuft im desktop-Projekt;
// Gerät und WebKit gelten für die ganze Datei. Tippen statt Ziehen, kein
// seitliches Scrollen, 3D erst auf Tippen (mobil), Touch-Sperre gegen Scroll-Falle.
import { test, expect, devices } from "@playwright/test";
import { blockFormSends } from "./helpers.js";

const PAGE = "/de/ezarri/konfigurator";
const consent = (origin) => ({ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: origin });

test.use({ ...devices["iPhone 15 Pro"], browserName: "webkit" });

async function open(page) {
  const origin = new URL(test.info().project.use.baseURL || "http://localhost:3000").origin;
  await page.context().addCookies([consent(origin)]);
  await blockFormSends(page);
  await page.goto(PAGE, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await expect(page.locator("h1")).toHaveText("Becken gestalten", { timeout: 90_000 });
  await expect(page.locator("[data-ezk-ready]")).toBeAttached({ timeout: 150_000 });
}

test.describe("Ezarri-Konfigurator – iPhone (WebKit)", () => {
  test("kein seitliches Scrollen, Mosaik per Tippen wählen, Mengen ansehen", async ({ page }) => {
    await open(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await page.locator("[data-ezk-waehlen]").tap();
    const dlg = page.locator("[data-ezk-picker]");
    await expect(dlg).toBeVisible();
    await expect(dlg.locator("[data-ezk-results] button").first()).toBeVisible({ timeout: 90_000 });
    await dlg.locator('[data-ref="2502-a"]').scrollIntoViewIfNeeded().catch(() => {});
    await dlg.locator('input[type="search"]').fill("2502-A");
    await dlg.locator('[data-ref="2502-a"]').tap();
    await expect(dlg).toBeHidden();
    await expect(page.getByText("2502-A").first()).toBeVisible();
    await page.getByRole("tab", { name: "Mengen" }).tap();
    await expect(page.locator("[data-ezk-mengen]")).toContainText("Kartons");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  });

  test("3D lädt auf Tippen, Bühne sperrt Touch bis „Ansicht bewegen“", async ({ page }) => {
    await open(page);
    const gl = await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2")));
    test.skip(!gl, "WebKit ohne WebGL 2 in dieser Umgebung");
    await page.locator("[data-ezk-3d]").tap();
    await expect(page.locator("[data-ezk-stage]")).toHaveAttribute("data-mode", "3d", { timeout: 150_000 });
    const move = page.getByRole("button", { name: "Ansicht bewegen" });
    await expect(move).toBeVisible();
    await expect(move).toHaveAttribute("aria-pressed", "false");
    await move.tap();
    await expect(page.getByRole("button", { name: "Fertig" })).toHaveAttribute("aria-pressed", "true");
  });

  test("nach der Auswahl: Fokus auf dem Auslöser, Name unter der Bühne sichtbar, 3D oder Szenen-Vorschau statt Draufsicht (QM R2 P2-1/2/5)", async ({ page }) => {
    await open(page);
    const waehlen = page.locator("[data-ezk-waehlen]");
    await waehlen.scrollIntoViewIfNeeded();
    await waehlen.tap();
    const dlg = page.locator("[data-ezk-picker]");
    await expect(dlg).toBeVisible();
    await dlg.locator('input[type="search"]').fill("ambar");
    const kachel = dlg.locator("[data-ezk-results] button").first();
    await expect(kachel).toBeVisible({ timeout: 90_000 });
    await kachel.tap();
    await expect(dlg).toBeHidden();
    // WebKit fokussiert Buttons beim Tippen nicht: Auslöser kommt aus dem Klick, nicht aus activeElement
    await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute("data-ezk-fokus")), { timeout: 5_000 }).toBe("waehlen");
    // Überschrift „Ihr Mosaik“ liegt unter der angehefteten Bühne, nicht dahinter
    await expect
      .poll(() => page.evaluate(() => {
        const b = document.querySelector("[data-ezk-buehne]").getBoundingClientRect();
        const h = document.getElementById("ezk-h-mosaik").getBoundingClientRect();
        return h.top >= b.bottom - 1 && h.bottom <= window.innerHeight;
      }), { timeout: 5_000 })
      .toBe(true);
    // Bühne: 3D startet nach der ersten Aktion von selbst, sonst eingefärbte Vorschau
    await expect
      .poll(async () => {
        const mode = await page.locator("[data-ezk-stage]").getAttribute("data-mode");
        const vorschau = await page.locator('[data-ezk-vorschau="1"]').count();
        return mode !== "2d" || vorschau > 0;
      }, { timeout: 60_000 })
      .toBe(true);
  });
});
