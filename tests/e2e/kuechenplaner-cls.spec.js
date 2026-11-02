// R3 technik P0-1 / neuland P1-1: Küchenplaner ohne Layout-Sprung.
// Der Planer streamt als eigene Suspense-Grenze nach. Der fallback ist eine statische
// Vorschau in Endgröße (src/components/Labs/Kuechenplaner/KuechenplanerPoster.js).
// Geprüft wird je Gerät (Pixel 7, iPhone-Maß, Desktop 1440 × 900):
//   1. Server-HTML ohne JS: Vorschau steht vor dem Footer, Fläche ≥ 600 px, aria-busy.
//   2. Vorschau (ohne JS) und fertiger Planer (mit JS) sind gleich hoch (± 60 px),
//      damit HandBridge und Footer nicht springen.
//   3. CLS (layout-shift ohne vorherige Eingabe) bis zur Hydration ≤ 0,05.
//   4. Mobil: Grundriss/Ansicht beginnt im ersten Bildschirm.
// Läuft gegen Dev (:3000) und Prod-Build (BASE_URL=http://localhost:3100).
import { test, expect, devices } from "@playwright/test";

const URL = "/de/kuechenplaner";
const DEVICES = [
  ["pixel", { ...devices["Pixel 7"] }],
  ["iphone-mass", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices["iPhone 15 Pro"].userAgent }],
  ["desktop", { viewport: { width: 1440, height: 900 } }],
];

test.describe.configure({ mode: "serial" });

test("Server-HTML: Vorschau steht vor dem Footer, nicht mehr fallback={null}", async ({ request }) => {
  const res = await request.get(URL);
  expect(res.status()).toBe(200);
  const html = await res.text();
  const gate = html.indexOf("data-kp-gate");
  const poster = html.indexOf("data-kp-poster", gate);
  const footer = html.indexOf("<footer", gate);
  expect(gate).toBeGreaterThan(-1);
  expect(poster).toBeGreaterThan(gate);
  expect(poster).toBeLessThan(footer);
  expect(html.slice(poster - 200, poster + 200)).toContain('aria-busy="true"');
  expect(html).not.toMatch(/data-kp-gate=""><!--\$\?--><template id="B:\d+"><\/template><!--\/\$--><\/div>/);
});

for (const [name, use] of DEVICES) {
  test(`${name}: Vorschau in Endgröße und CLS ≤ 0,05`, async ({ browser, baseURL }) => {
    // 1. ohne JS: nur das Server-HTML (Vorschau bleibt stehen)
    const noJs = await browser.newContext({ ...use, javaScriptEnabled: false, baseURL });
    const p0 = await noJs.newPage();
    await p0.goto(URL, { waitUntil: "load" });
    const poster = p0.locator("[data-kp-poster]");
    await expect(poster).toBeVisible();
    const posterBox = await p0.evaluate(() => {
      const g = document.querySelector("[data-kp-gate]").getBoundingClientRect();
      const f = document.querySelector("footer").getBoundingClientRect();
      return { h: g.height, top: g.top, footer: f.top + scrollY };
    });
    expect(posterBox.h).toBeGreaterThanOrEqual(600);
    if (use.isMobile) expect(posterBox.top).toBeLessThan(use.viewport.height - 120);
    await noJs.close();

    // 2./3. mit JS: CLS bis zur Hydration messen (Hydration erzwingt der Gate spätestens 12 s nach load, R5)
    const ctx = await browser.newContext({ ...use, baseURL });
    await ctx.addInitScript(() => {
      window.__cls = 0;
      window.__shifts = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.hadRecentInput) continue;
          window.__cls += e.value;
          window.__shifts.push({ v: +e.value.toFixed(4), src: (e.sources || []).map((s) => s.node?.nodeName + (s.node?.className ? "." + String(s.node.className).slice(0, 40) : "")) });
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "load" });
    await page.waitForSelector("[data-kp-hydrated] [data-kp-root]", { state: "visible", timeout: 30_000 });
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => {
      const g = document.querySelector("[data-kp-gate]").getBoundingClientRect();
      const f = document.querySelector("footer").getBoundingClientRect();
      return { cls: window.__cls, shifts: window.__shifts, h: g.height, footer: f.top + scrollY, poster: !!document.querySelector("[data-kp-poster]") };
    });
    await ctx.close();
    test.info().annotations.push({ type: "cls", description: `${name}: CLS ${r.cls.toFixed(4)}, Vorschau ${Math.round(posterBox.h)} px, Planer ${Math.round(r.h)} px, ${JSON.stringify(r.shifts)}` });
    console.log(`[kp-cls] ${name}: CLS ${r.cls.toFixed(4)}, Vorschau ${Math.round(posterBox.h)} px, Planer ${Math.round(r.h)} px, Footer ${Math.round(posterBox.footer)}→${Math.round(r.footer)}`);
    expect(r.poster).toBe(false);
    expect(Math.abs(r.h - posterBox.h), `Vorschau ${posterBox.h} px vs. Planer ${r.h} px`).toBeLessThanOrEqual(60);
    expect(Math.abs(r.footer - posterBox.footer), "Footer springt").toBeLessThanOrEqual(60);
    expect(r.cls, JSON.stringify(r.shifts)).toBeLessThanOrEqual(0.05);
  });
}
