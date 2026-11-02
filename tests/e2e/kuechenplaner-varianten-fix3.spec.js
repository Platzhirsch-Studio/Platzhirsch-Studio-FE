// Küchenplaner – Fix 3 (QA Feinschliff Restliste): Vergleich A/B auf dem Handy lesbar
// (P2-1), Differenz sichtbar beschriftet (P2-2), Öffnen verliert keine Live-Planung
// (P2-3), Miniaturen ohne Kürzel (P3-3), gleiche Kopfhöhe (P3-4), Ersatz ohne
// Browserspeicher (P3-5). Läuft im desktop-Projekt, Handy-Teile mit Pixel-7-Maßen.
// Sendet nie etwas: alle Nicht-GET-Requests an /api werden abgebrochen.
import { test, expect, devices } from "@playwright/test";

const PAGE = "/de/kuechenplaner";
const consent = (origin) => ({ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: origin });

async function open(page, query = "") {
  const origin = new URL(test.info().project.use.baseURL || "http://localhost:3000").origin;
  await page.context().addCookies([consent(origin)]);
  await page.route("**/api/**", (route) => (route.request().method() === "GET" ? route.continue() : route.abort()));
  await page.goto(`${PAGE}${query}`, { waitUntil: "domcontentloaded", timeout: 170_000 });
  await expect(page.locator("h1")).toBeVisible({ timeout: 300_000 });
  await expect(page.locator("[data-kp-root]")).toBeVisible({ timeout: 300_000 });
  // Hydriert erst, wenn der WebGL-Test gelaufen ist („3D-Ansicht lädt …“ → „… laden“)
  await expect(page.getByRole("button", { name: "3D-Ansicht laden" }).first()).toBeVisible({ timeout: 300_000 });
}
async function tab(page, name) {
  const t = page.getByRole("tab", { name }).first();
  await expect(async () => {
    await t.click();
    await expect(t).toHaveAttribute("aria-selected", "true", { timeout: 2000 });
  }).toPass({ timeout: 120_000 });
}
async function pixel(browser, init) {
  const { defaultBrowserType: _b, ...dev } = devices["Pixel 7"];
  void _b;
  const ctx = await browser.newContext({ ...dev, locale: "de-AT" });
  if (init) await ctx.addInitScript(init);
  return ctx;
}
const stickyShare = (page) => page.evaluate(() => {
  const el = document.querySelector("[data-kp-root] > div.sticky");
  return el.getBoundingClientRect().height / window.innerHeight;
});

test.describe("Küchenplaner Varianten – Fix 3", () => {
  test.setTimeout(480_000);

  test("Handy: Ansicht im Reiter Ergebnis minimiert, Fokus nicht verdeckt, Wiederherstellen (P2-1)", async ({ browser }) => {
    const ctx = await pixel(browser);
    const page = await ctx.newPage();
    try {
      await open(page);
      const before = await stickyShare(page);
      expect(before).toBeGreaterThan(0.3);
      await tab(page, "Ergebnis");
      const cmp = page.locator("[data-kp-compare]:not([data-kp-compare-pending])");
      await expect(cmp).toBeVisible({ timeout: 180_000 });
      await expect.poll(() => stickyShare(page)).toBeLessThanOrEqual(0.25);
      await cmp.getByRole("button", { name: "Aktuelle als A merken" }).click();
      // Fokus mitten in den Vergleich: zuerst so scrollen, dass das Feld unter der Ansicht läge
      const box = cmp.getByLabel("Nur Unterschiede");
      await box.scrollIntoViewIfNeeded();
      await page.evaluate(() => {
        const el = document.querySelector("[data-kp-compare] input[type=checkbox]");
        const sticky = document.querySelector("[data-kp-root] > div.sticky").getBoundingClientRect();
        window.scrollBy(0, el.getBoundingClientRect().top - sticky.top - 10);
      });
      await box.focus();
      const hit = await page.evaluate(() => {
        const el = document.activeElement;
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { same: top === el || el.contains(top) || top?.contains(el) || top?.closest("label")?.contains(el), y: r.top };
      });
      expect(hit.same, `Fokus verdeckt bei y=${hit.y}`).toBeTruthy();
      // Zurück in einen anderen Reiter: Ansicht wieder groß
      await tab(page, "Raum");
      await expect.poll(() => stickyShare(page)).toBeGreaterThan(0.3);
      await page.screenshot({ path: test.info().outputPath("p2-1-raum.png") });
    } finally {
      await ctx.close();
    }
  });

  test("Delta sichtbar erklärt, Öffnen merkt Live-Planung als B, Miniaturen ohne Kürzel (P2-2, P2-3, P3-3, P3-4)", async ({ page }) => {
    await open(page);
    await tab(page, "Ergebnis");
    const cmp = page.locator("[data-kp-compare]:not([data-kp-compare-pending])");
    await expect(cmp).toBeVisible({ timeout: 180_000 });
    await cmp.getByRole("button", { name: "Aktuelle als A merken" }).click();
    await tab(page, "Raum");
    await page.getByRole("button", { name: /^U-Form/ }).click();
    await tab(page, "Ergebnis");
    await expect(cmp.locator('[data-kp-row="shape"]')).toHaveAttribute("data-diff", "1");
    // P2-2: sichtbare Erklärung, Delta mit Δ
    await expect(cmp.locator("[data-kp-delta-note]")).toBeVisible();
    await expect(cmp.locator("[data-kp-delta-note]")).toContainText("Differenz von B gegenüber A");
    await expect(cmp.locator('[data-kp-row="worktop"] [data-kp-delta]')).toContainText(/Δ\s*\+/);
    // P3-3: keine Kürzel in den Miniaturen
    await expect(cmp.locator("[data-kp-variant] svg text")).toHaveCount(0);
    // P2-3: A öffnen aus dem Live-Zustand → aktuelle Planung als B gemerkt
    await cmp.getByRole("button", { name: "Variante A im Planer öffnen" }).click();
    await expect(cmp.getByRole("status")).toContainText("Aktuelle Planung als B gemerkt, Variante A geöffnet.");
    const slots = await page.evaluate(() => JSON.parse(localStorage.getItem("kp-variants-v1") || "{}"));
    expect(slots.b && typeof slots.b.k).toBe("string");
    await expect(cmp.locator('[data-kp-variant="b"]')).toContainText("Variante B");
    await expect(cmp.locator('[data-kp-variant="a"] [data-kp-variant-open]')).toBeVisible();
    // P3-4: Grundrisse A und B beginnen auf gleicher Höhe, auch wenn nur A „geöffnet“ trägt
    const ya = (await cmp.locator('[data-kp-variant="a"] svg[role=img]').boundingBox()).y;
    const yb = (await cmp.locator('[data-kp-variant="b"] svg[role=img]').boundingBox()).y;
    expect(Math.abs(ya - yb)).toBeLessThan(1);
    await cmp.screenshot({ path: test.info().outputPath("fix3-desktop.png") });
  });

  test("Ohne Browserspeicher: Vergleich im Speicher bis zum Neuladen (P3-5)", async ({ browser }) => {
    const ctx = await pixel(browser, () => {
      Storage.prototype.setItem = function () {
        throw new DOMException("blocked", "QuotaExceededError");
      };
    });
    const page = await ctx.newPage();
    try {
      await open(page);
      await tab(page, "Ergebnis");
      const cmp = page.locator("[data-kp-compare]:not([data-kp-compare-pending])");
      await expect(cmp).toBeVisible({ timeout: 180_000 });
      await cmp.getByRole("button", { name: "Aktuelle als A merken" }).click();
      await expect(cmp.getByRole("status")).toContainText("nur bis zum Neuladen");
      await expect(cmp.locator('[data-kp-variant="b"]')).toContainText("Aktuelle Planung");
      await tab(page, "Raum");
      await page.getByRole("button", { name: /^U-Form/ }).click();
      await tab(page, "Ergebnis");
      await expect(cmp.locator('[data-kp-row="shape"]')).toHaveAttribute("data-diff", "1");
      await cmp.getByRole("button", { name: "Als B merken" }).click();
      await expect(cmp.getByRole("button", { name: "Tauschen" })).toBeVisible();
      await cmp.getByRole("button", { name: "Tauschen" }).click();
      await expect(cmp.locator('[data-kp-row="shape"] td').first()).toContainText("U-Form");
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(over).toBeLessThanOrEqual(0);
    } finally {
      await ctx.close();
    }
  });
});
