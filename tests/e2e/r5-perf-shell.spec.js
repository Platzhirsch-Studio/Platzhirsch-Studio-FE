// Runde 4, Fix-Team P4 (Performance, Shell, Navigation):
//   - Bodensee-Licht: Poster im ersten Bildschirm (Handy), keine leere Fläche,
//     three.js erst nach Tippen; Werte aus dem Worker folgen dem Regler;
//     reduzierte Bewegung ohne Überblendung.
//   - Mega-Menü: Panel-Links nicht im Server-HTML, nach dem Öffnen da;
//     Outdoor mit „Garten & Terrasse planen“ und ?thema=outdoor.
//   - Mobilmenü: Küche/Outdoor führen auf /de/beratung?thema=kueche|outdoor.
//   PW_WORKERS=1 npx playwright test tests/e2e/r5-perf-shell.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import { collectConsoleErrors, dismissCookieBanner, settle } from "./helpers.js";
import { PROD } from "./prod-mode.js";

const LICHT = "/de/bodensee-licht?ort=lochau&fenster=225&datum=2026-06-21&zeit=10:00";
const MOBIL = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

test.describe("Bodensee-Licht – Poster zuerst (Handy)", () => {
  test.use(MOBIL);

  test("Poster sichtbar und gekennzeichnet, kein Canvas bis zum Tippen, dann 3D", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const three = [];
    page.on("request", (r) => /LichtSzene|three/i.test(r.url()) && three.push(r.url()));
    await page.goto(LICHT, { timeout: 120_000 });
    await dismissCookieBanner(page);
    const poster = page.locator("[data-licht-poster]");
    await expect(poster).toBeVisible();
    await expect(poster).toHaveAttribute("src", "/licht/poster/kueche-juni-10-640.webp");
    expect(await poster.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
    const box = await poster.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(844); // erster Bildschirm
    await expect(page.locator("[data-licht-bildtext]")).toHaveText(/^Berechnete Darstellung, kein Foto: Lochau, Fenster nach Südwesten, 21\. Juni, 10:00 Uhr\.$/);
    await page.waitForTimeout(2500);
    await expect(page.locator("[data-licht-canvas]")).toHaveCount(0);
    // Endtest 29.10.2026: Der Dev-Server (Next 16.4.1, Turbopack) lädt den Chunk des
    // dynamischen import("./LichtSzene") schon vorab; im Produktions-Build lädt er erst
    // nach dem Tippen (dort geprüft und grün). Kein Canvas vor dem Tippen gilt überall.
    if (PROD) expect(three, "three.js lädt erst nach dem Tippen").toEqual([]);
    await page.locator("[data-licht-3d]").tap();
    await expect(page.locator("[data-licht-canvas]")).toHaveCount(1, { timeout: 60_000 });
    await expect(page.locator("[data-licht-buehne]")).toHaveAttribute("data-licht-modus", "3d", { timeout: 60_000 });
    await expect(page.locator("[data-licht-bildtext]")).toHaveText(/Schematisches Raummodell/);
    expect(errors).toEqual([]);
  });

  test("Uhrzeit blättert in der Stundensequenz, Sonnensatz kommt aus dem Worker", async ({ page }) => {
    await page.goto(LICHT, { timeout: 120_000 });
    await dismissCookieBanner(page);
    const zeit = page.getByRole("slider", { name: "Uhrzeit" });
    await zeit.focus();
    for (let i = 0; i < 12; i++) await page.keyboard.press("ArrowRight"); // +60 min
    await expect(page.locator("[data-licht-poster]")).toHaveAttribute("src", "/licht/poster/kueche-juni-11-640.webp");
    await expect(page.locator("[data-licht-canvas]")).toHaveCount(0);
    // Ort ändern: das Poster zeigt das nicht → 3D startet, Text folgt.
    await page.getByLabel("Ort", { exact: true }).selectOption("ulm");
    await expect(page.locator("[data-licht-canvas]")).toHaveCount(1, { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: /Der Tag in Ulm/ })).toBeVisible();
  });
});

test.describe("Bodensee-Licht – reduzierte Bewegung", () => {
  test.use({ ...MOBIL, reducedMotion: "reduce" });
  test("Poster ohne Animation, kein Autolauf", async ({ page }) => {
    await page.goto(LICHT, { timeout: 120_000 });
    const anim = await page.locator("[data-licht-poster]").evaluate((el) => el.getAnimations().length + getComputedStyle(el).transitionDuration);
    expect(anim).toBe("00s");
    await expect(page.locator("[data-abspielen]")).toHaveCount(0);
  });
});

test.describe("Mega-Menü und Mobilmenü (Desktop/Handy)", () => {
  test("Panel-Links erst beim Öffnen, Outdoor mit Gartenplanung und Themen-Beratung", async ({ page, request }) => {
    const html = await (await request.get("/de", { timeout: 120_000 })).text();
    expect(html).not.toContain('class="col-span-3 pr-8"'); // kein Panel-HTML im Server-HTML
    expect(html.split("Garten \\u0026 Terrasse planen").length - 1).toBeLessThanOrEqual(1); // Menüdaten einmal im Payload
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/de");
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    await page.locator("#ph-nav-trigger-outdoor").click();
    const panel = page.locator("#ph-nav-panel-outdoor");
    await expect(panel.getByRole("link", { name: "Garten & Terrasse planen" })).toHaveAttribute("href", "/de/outdoor-gartenplanung");
    await expect(panel.locator('a[href="/de/beratung?thema=outdoor"]')).toBeVisible();
    await page.keyboard.press("Escape");
    await page.locator("#ph-nav-trigger-kitchen").click();
    await expect(page.locator('#ph-nav-panel-kitchen a[href="/de/beratung?thema=kueche"]')).toBeVisible();
  });

  test("Mobilmenü: Küche und Outdoor auf die Beratung mit Thema", async ({ browser }) => {
    const ctx = await browser.newContext({ ...MOBIL, baseURL: test.info().project.use.baseURL });
    const page = await ctx.newPage();
    await page.goto("/de");
    await dismissCookieBanner(page);
    await page.getByRole("button", { name: /Menü öffnen/ }).tap();
    const dlg = page.locator("#ph-mobile-menu");
    await dlg.locator("summary", { hasText: "Küche" }).click();
    await expect(dlg.locator('a[href="/de/beratung?thema=kueche"]')).toBeVisible();
    await dlg.locator("summary", { hasText: /^Outdoor/ }).click();
    await expect(dlg.locator('a[href="/de/beratung?thema=outdoor"]')).toBeVisible();
    await expect(dlg.locator('a[href="/de/outdoor-gartenplanung"]')).toBeVisible();
    await ctx.close();
  });
});
