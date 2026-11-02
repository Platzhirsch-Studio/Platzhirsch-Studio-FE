// Küchenplaner – Fix 1 (QA-Feedback 1): Plangröße und Scrollen auf dem Handy,
// Maßfeld-Meldungen, Sticky-Ansicht auf dem Desktop. Läuft im desktop-Projekt;
// der Handy-Teil setzt Pixel 7 (Chromium, Touch über CDP). Sendet nie etwas.
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

test.describe("Küchenplaner Fix 1 – Handy (Pixel 7)", () => {
  const { defaultBrowserType: _b, ...pixel } = devices["Pixel 7"];
  void _b;
  test.use(pixel);

  test("Plan groß genug: 60-cm-Modul ≥ 32 px, Schrift ≥ 11 px, Reiter ohne Überlauf", async ({ page }) => {
    await open(page);
    const box = await page.locator('[data-mod="a-1"]').boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(32);
    expect(box.height).toBeGreaterThanOrEqual(32);
    const minText = await page.evaluate(() => {
      const svg = document.querySelector("[data-kp-page] svg[role=img]");
      return Math.min(...[...svg.querySelectorAll("text")].map((t) => t.getBoundingClientRect().height).filter((h) => h > 0));
    });
    expect(minText).toBeGreaterThanOrEqual(11);
    const tabs = await page.locator('[role=tablist][aria-label="Planungsschritte"]').first().evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(tabs).toBeLessThanOrEqual(0);
  });

  test("vertikales Wischen auf der freien Planfläche scrollt die Seite", async ({ page }) => {
    await open(page);
    const svg = await page.locator("[data-kp-page] svg[role=img]").first().boundingBox();
    const cdp = await page.context().newCDPSession(page);
    // Mitte der Raumfläche (frei von Modulen)
    const x = svg.x + svg.width * 0.6;
    const y = svg.y + svg.height * 0.75;
    const before = await page.evaluate(() => scrollY);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let i = 1; i <= 8; i++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - i * 25 }] });
      await page.waitForTimeout(30);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 3000 }).toBeGreaterThan(before);
  });

  test("Zoom-Knöpfe vergrößern den Plan, Einpassen stellt ihn wieder her", async ({ page }) => {
    await open(page);
    const w0 = (await page.locator('[data-mod="a-1"]').boundingBox()).width;
    await page.getByRole("button", { name: "Plan vergrößern" }).click();
    await expect.poll(async () => (await page.locator('[data-mod="a-1"]').boundingBox())?.width || 0).toBeGreaterThan(w0 * 1.3);
    await page.getByRole("button", { name: "Plan einpassen" }).click();
    await expect.poll(async () => Math.round((await page.locator('[data-mod="a-1"]').boundingBox()).width)).toBe(Math.round(w0));
  });
});

test.describe("Küchenplaner Fix 1 – Desktop", () => {
  test("leeres Maßfeld behält den letzten Wert und meldet die Grenzen am Feld", async ({ page }) => {
    await open(page);
    const wa = page.locator("#kp-wa-n");
    await wa.fill("");
    await wa.press("Tab");
    await expect(wa).toHaveValue("420");
    await expect(page.locator("#kp-wa-msg")).toContainText("Erlaubt sind 150 bis 800 cm");
    await expect(wa).toHaveAttribute("aria-describedby", "kp-wa-msg");
    await wa.fill("50");
    await wa.press("Enter");
    await expect(wa).toHaveValue("150");
    await expect(page.locator("#kp-wa-msg")).toContainText("Mindestens 150 cm");
  });

  test("Module länger als die Wand: Aktion „Letztes Modul entfernen“ am Feld", async ({ page }) => {
    await open(page);
    // Über einen Teilen-Link gelten alle Zeilen als bearbeitet (kein automatisches Auffüllen)
    await expect.poll(() => new URL(page.url()).searchParams.get("k") || "", { timeout: 5000 }).not.toBe("");
    await open(page, `?k=${new URL(page.url()).searchParams.get("k")}`);
    const wa = page.locator("#kp-wa-n");
    await wa.fill("300");
    await wa.press("Enter");
    const btn = page.getByRole("button", { name: "Letztes Modul entfernen" });
    await expect(btn).toBeVisible();
    await btn.click();
    await btn.click();
    await expect(btn).toHaveCount(0);
  });

  test("Ansicht bleibt beim Scrollen der rechten Spalte stehen (sticky)", async ({ page }) => {
    await open(page, "?t=module");
    const view = page.locator("[data-kp-root] > div").first();
    await page.evaluate(() => scrollTo(0, 600));
    await page.waitForTimeout(300);
    const top = (await view.boundingBox()).y;
    await page.evaluate(() => scrollTo(0, 900));
    await page.waitForTimeout(300);
    expect(Math.abs((await view.boundingBox()).y - top)).toBeLessThanOrEqual(2);
  });

  test("Beispielplanung startet ohne Hinweise und Kollisionen", async ({ page }) => {
    await open(page);
    await expect(page.getByText(/Hinweis:|Kollision:/)).toHaveCount(0);
  });

  test("ungültiger Teilen-Link zeigt einen Hinweis", async ({ page }) => {
    await open(page, "?k=%25%25kaputt");
    await expect(page.getByRole("status").filter({ hasText: "keine gültige Planung" })).toBeVisible();
  });
});
