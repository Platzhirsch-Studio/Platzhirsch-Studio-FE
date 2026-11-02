// Küchenplaner – Fix 2 (QA-Feedback 2): Palette auf Touch wischbar, Klick nach
// Palette-Drop, Drop in volle Zeile ersetzt, Zoom ohne Auswahl, Meldung beim
// Verkleinern einer Wand. Läuft im desktop-Projekt; der Handy-Teil setzt Pixel 7
// (Chromium, Touch über CDP). Sendet nie etwas.
import { test, expect, devices } from "@playwright/test";

const PAGE = "/de/kuechenplaner";
const consent = (origin) => ({ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: origin });
const BASE_MODS = '[data-mod]:not([data-mod*="-u"])';

async function open(page, query = "") {
  const origin = new URL(test.info().project.use.baseURL || "http://localhost:3000").origin;
  await page.context().addCookies([consent(origin)]);
  await page.goto(`${PAGE}${query}`);
  await expect(page.locator("h1")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("button", { name: "3D-Ansicht laden" })).toBeVisible({ timeout: 60_000 });
}

async function touchSwipe(page, from, to, steps = 10, holdMs = 0) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from.x, y: from.y }] });
  if (holdMs) await page.waitForTimeout(holdMs);
  for (let i = 1; i <= steps; i++) {
    const x = from.x + ((to.x - from.x) * i) / steps;
    const y = from.y + ((to.y - from.y) * i) / steps;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
    await page.waitForTimeout(25);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

test.describe("Küchenplaner Fix 2 – Handy (Pixel 7)", () => {
  const { defaultBrowserType: _b, ...pixel } = devices["Pixel 7"];
  void _b;
  test.use(pixel);

  test("P1-1: Wischen auf „Spüle“ scrollt die Palette und fügt nichts ein", async ({ page }) => {
    await open(page);
    const palette = page.locator("[data-kp-palette]");
    await expect(palette).toBeVisible();
    await expect(page.locator("[data-kp-fade-r]")).toHaveAttribute("data-kp-fade-r", "on");
    const n0 = await page.locator(BASE_MODS).count();
    const b = await page.locator('[data-palette="spuele"]').boundingBox();
    const y = b.y + b.height / 2;
    await touchSwipe(page, { x: b.x + b.width / 2 + 120, y }, { x: b.x + b.width / 2 - 140, y });
    await expect.poll(() => palette.evaluate((el) => el.scrollLeft), { timeout: 3000 }).toBeGreaterThan(0);
    await page.waitForTimeout(500);
    expect(await page.locator(BASE_MODS).count()).toBe(n0);
    // Danach sind die hinteren Module erreichbar: Antippen fügt an
    await palette.evaluate((el) => (el.scrollLeft = el.scrollWidth));
    await page.locator('[data-palette="passstueck"]').tap();
    await expect.poll(() => page.locator(BASE_MODS).count()).toBe(n0 + 1);
  });

  test("P1-1: senkrecht nach oben ziehen startet den Modul-Drag (Ersetzen-Vorschau)", async ({ page }) => {
    await open(page);
    const n0 = await page.locator(BASE_MODS).count();
    const src = await page.locator('[data-palette="geschirrspueler"]').boundingBox();
    const target = await page.locator('[data-mod="a-4"]').boundingBox();
    await touchSwipe(page, { x: src.x + src.width / 2, y: src.y + src.height / 2 }, { x: target.x + target.width / 2, y: target.y + target.height / 2 }, 14);
    await expect(page.getByRole("status").filter({ hasText: /ersetzt/ })).toHaveCount(1, { timeout: 5000 });
    expect(await page.locator(BASE_MODS).count()).toBe(n0);
  });

  test("P3-3: schmale Module haben eine Trefferfläche ≥ 24 px, Antippen wählt sie aus", async ({ page }) => {
    await open(page);
    const small = await page.locator("[data-mod][data-drag]").evaluateAll((els) =>
      els.map((e) => [e.dataset.mod, Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height)]).filter((x) => x[1] < 24).map((x) => x[0]));
    for (const id of small) {
      const box = await page.locator(`[data-hit="${id}"]`).boundingBox();
      expect(box, `Trefferfläche für ${id}`).not.toBeNull();
      expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(23.5);
    }
    if (small.length) {
      const n0 = await page.locator(BASE_MODS).count();
      await page.locator(`[data-hit="${small[0]}"]`).tap();
      await expect(page.locator(`[data-mod="${small[0]}"]`)).toHaveAttribute("stroke", "#7a5f17");
      expect(await page.locator(BASE_MODS).count()).toBe(n0);
    }
  });
});

test.describe("Küchenplaner Fix 2 – Desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("P2-7 + P2-1: Drop in volle Zeile ersetzt, der nächste Klick auf die Palette fügt an", async ({ page }) => {
    await open(page);
    const n0 = await page.locator(BASE_MODS).count();
    await page.locator('[data-palette="kuehlschrank"]').scrollIntoViewIfNeeded();
    const src = await page.locator('[data-palette="kuehlschrank"]').boundingBox();
    const tgt = await page.locator('[data-mod="a-4"]').boundingBox();
    await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
    await page.mouse.down();
    await page.mouse.move(src.x + 40, src.y - 40, { steps: 4 });
    await page.mouse.move(tgt.x + tgt.width / 2, tgt.y + tgt.height / 2, { steps: 10 });
    await expect(page.locator("[data-kp-drop-note]")).toHaveAttribute("data-kp-drop-note", "replace");
    await page.mouse.up();
    await expect(page.getByRole("status").filter({ hasText: /durch Kühlschrank ersetzt/ })).toHaveCount(1);
    expect(await page.locator(BASE_MODS).count()).toBe(n0);
    await page.waitForTimeout(500);
    await page.locator('[data-palette="unterschrank"]').click();
    await expect.poll(() => page.locator(BASE_MODS).count()).toBe(n0 + 1);
  });

  test("P2-7: über einem schmaleren Modul zeigt die Vorschau „Kein Platz“ und fügt nichts ein", async ({ page }) => {
    await open(page);
    const n0 = await page.locator(BASE_MODS).count();
    await page.locator('[data-palette="eckschrank"]').scrollIntoViewIfNeeded();
    const src = await page.locator('[data-palette="eckschrank"]').boundingBox();
    const tgt = await page.locator('[data-mod="a-4"]').boundingBox();
    await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
    await page.mouse.down();
    await page.mouse.move(tgt.x + tgt.width / 2, tgt.y + tgt.height / 2, { steps: 12 });
    await expect(page.locator("[data-kp-drop-note]")).toHaveAttribute("data-kp-drop-note", "full");
    await expect(page.locator("[data-kp-ghost=full]")).toHaveCount(1);
    await page.mouse.up();
    await expect(page.getByRole("status").filter({ hasText: /Kein Platz/ })).toHaveCount(1);
    expect(await page.locator(BASE_MODS).count()).toBe(n0);
  });

  test("P2-2: „+“ ohne Auswahl zeigt Module statt leerem Boden", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Plan vergrößern" }).click();
    await page.getByRole("button", { name: "Plan vergrößern" }).click();
    await page.waitForTimeout(300);
    const visible = await page.evaluate(() => {
      const svg = document.querySelector("[data-kp-page] svg[role=img]");
      const r = svg.getBoundingClientRect();
      return [...svg.querySelectorAll("[data-mod]")].filter((p) => {
        const b = p.getBoundingClientRect();
        const cx = b.x + b.width / 2;
        const cy = b.y + b.height / 2;
        return cx > r.left && cx < r.right && cy > r.top && cy < r.bottom;
      }).length;
    });
    expect(visible).toBeGreaterThanOrEqual(3);
  });

  test("P2-6: Wand A auf 150 cm → Meldung, welche Geräte nicht mehr passen", async ({ page }) => {
    await open(page);
    const field = page.locator("#kp-wa-n");
    await field.fill("150");
    await field.press("Enter");
    await expect(page.locator('[data-kp-lost="a"]')).toContainText(/Geschirrspüler nicht mehr an Wand A/);
    await field.fill("420");
    await field.press("Enter");
    await expect(page.locator('[data-kp-lost="a"]')).toHaveCount(0);
  });

  test("P3-6: Legende schließt per Esc, auch wenn der Fokus nicht im Plan liegt", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Legende", exact: true }).click();
    await expect(page.locator("#kp-legend")).toBeVisible();
    await page.locator("h1").click();
    await page.keyboard.press("Escape");
    await expect(page.locator("#kp-legend")).toHaveCount(0);
  });
});
