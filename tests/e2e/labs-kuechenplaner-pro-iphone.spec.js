// Küchenplaner Pro – iPhone 15 Pro (WebKit): Bedienung per Tippen ohne Ziehen.
// Läuft im desktop-Projekt; WebKit und Gerät werden für die ganze Datei gesetzt.
// Sendet nie etwas.
import { test, expect, devices } from "@playwright/test";

const PAGE = "/de/kuechenplaner";
const consent = (origin) => ({ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: origin });

async function open(page, query = "") {
  const origin = new URL(test.info().project.use.baseURL || "http://localhost:3000").origin;
  await page.context().addCookies([consent(origin)]);
  await page.goto(`${PAGE}${query}`);
  await expect(page.locator("h1")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("button", { name: "3D-Ansicht laden" })).toBeVisible({ timeout: 60_000 });
}
test.use({ ...devices["iPhone 15 Pro"], browserName: "webkit" });

// Nur Module am Boden (Hängeschränke tragen "-u" in der ID und entstehen teils automatisch)
const BASE_MODS = '[data-mod]:not([data-mod*="-u"])';
const code = (page) => new URL(page.url()).searchParams.get("k");

test.describe("Küchenplaner Pro – iPhone (WebKit)", () => {
  test("kein seitliches Scrollen, Modul per Tippen und Bottom-Sheet bearbeiten", async ({ page }) => {
    await open(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.getByRole("tab", { name: "Möbel" }).first().click();
    await page.getByRole("button", { name: /^Modul 1: Eckschrank/ }).first().click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await sheet.locator("#kp-sheet-m").selectOption("k");
    await sheet.getByRole("button", { name: "Fertig" }).click();
    await expect(sheet).toHaveCount(0);
    await expect.poll(() => code(page) || "", { timeout: 5000 }).not.toBe("");
  });

  test("Palette antippen fügt an, 3D lädt auf Klick (wenn WebGL)", async ({ page }) => {
    await open(page);
    const n = await page.locator(BASE_MODS).count();
    await page.getByRole("button", { name: "Unterschrank (Auszüge) hinzufügen" }).tap();
    await expect(page.locator(BASE_MODS)).toHaveCount(n + 1);
    const gl = await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl")));
    test.skip(!gl, "WebKit ohne WebGL in dieser Umgebung");
    await page.getByRole("button", { name: "3D-Ansicht laden" }).tap();
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 90_000 });
  });
});
