// tests/e2e/r8-wow-webkit.spec.js – Runde 3 Fix-Team P6 (R8), WebKit (iPhone, iPad):
//  1. Wow-Regler (gesamtwerk P1-1): während der Einladung und in Ruhe steht der
//     Griff nie angeschnitten – sobald er sichtbar ist, liegt seine BoundingBox
//     ganz im Viewport und im Bildrahmen; in Ruhe ist er verborgen. Reduced
//     Motion: keine Einladung, „Die Linie zeigen“ öffnet den Regler, und auch
//     bei 0 % und 100 % liegt der Griff ganz im Rahmen.
//  2. Sprachhinweis (?lang=en) mit lang-Attribut, Canonical bleibt DE.
//  3. Ezarri auf dem iPhone: H1 im ersten Bildschirm (≤ 500 px).
//  4. Arbeitsweise auf dem iPad: Auftakt-Grafik neben dem Knopf, keine halbe Leerfläche.
// Läuft im Projekt „desktop“; Browser und Gerät kommen aus test.use bzw. eigenen Kontexten.
//   PW_WORKERS=1 npx playwright test r8-wow-webkit.spec.js --project=desktop
import { test, expect, devices } from "@playwright/test";

const strip = ({ defaultBrowserType: _b, ...d }) => d;
const IPHONE = strip(devices["iPhone 15 Pro"]);
const IPAD = strip(devices["iPad Pro 11"]);
const STAGE = "[data-wow-stage]";

test.use({ browserName: "webkit" });

/** Visible = opacity of the rail > 0.05 and the track visible. */
async function gripState(page) {
  return page.evaluate((sel) => {
    const f = document.querySelector(sel);
    const rail = f.querySelector("[data-wow-rail]");
    const grip = f.querySelector("[data-wow-handle] > span");
    const frame = f.querySelector("[data-wow-frame]").getBoundingClientRect();
    const r = grip.getBoundingClientRect();
    const visible = getComputedStyle(rail.parentElement).visibility === "visible" && Number(getComputedStyle(rail).opacity) > 0.05;
    return { visible, left: r.left, right: r.right, top: r.top, bottom: r.bottom, fl: frame.left, fr: frame.right, vw: innerWidth, state: f.dataset.wow };
  }, STAGE);
}

for (const [name, dev] of [
  ["iPhone 15 Pro", IPHONE],
  ["iPad Pro 11", IPAD],
]) {
  test(`${name}: Wow-Griff nie angeschnitten (Einladung und Ruhe)`, async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ ...dev, baseURL, reducedMotion: "no-preference" });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      try {
        sessionStorage.clear();
      } catch {}
    });
    await page.goto("/de", { waitUntil: "domcontentloaded", timeout: 150_000 });
    await page.waitForSelector(STAGE, { state: "attached", timeout: 150_000 });
    // sample until the stage is at rest and the invitation is over (dev server under
    // load: hydration can take long), then one more second of rest
    const samples = [];
    const limit = Date.now() + 90_000;
    let restSince = 0;
    while (Date.now() < limit) {
      const s = await gripState(page);
      samples.push(s);
      const atRest = s.state !== "play" && !(await page.$eval(STAGE, (f) => f.hasAttribute("data-wow-invite")));
      if (atRest && !restSince) restSince = Date.now();
      if (!atRest) restSince = 0;
      if (restSince && Date.now() - restSince > 1000) break;
      await page.waitForTimeout(80);
    }
    const seen = samples.filter((s) => s.visible);
    for (const s of seen) {
      expect(s.left, "Griff links im Viewport").toBeGreaterThanOrEqual(-0.5);
      expect(s.right, "Griff rechts im Viewport").toBeLessThanOrEqual(s.vw + 0.5);
      expect(s.left, "Griff im Rahmen").toBeGreaterThanOrEqual(s.fl - 0.5);
      expect(s.right, "Griff im Rahmen").toBeLessThanOrEqual(s.fr + 0.5);
    }
    // at rest: no grip over the photo
    const last = samples.at(-1);
    expect(last.state).not.toBe("play");
    expect(last.visible).toBe(false);
    // the sequence ran to its end → the invitation was seen (the test is not vacuous)
    if (last.state === "done") expect(seen.length).toBeGreaterThan(0);
    await ctx.close();
  });

  test(`${name}: Reduced Motion – keine Einladung, Regler bei 0 % und 100 % ganz im Rahmen`, async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ ...dev, baseURL, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/de", { waitUntil: "domcontentloaded", timeout: 150_000 });
    await expect(page.locator(STAGE)).toHaveAttribute("data-wow", "still");
    await page.waitForFunction((s) => document.querySelector(`${s} [data-wow-show]:not([aria-disabled])`), STAGE, { timeout: 150_000 });
    await expect(page.locator(STAGE)).not.toHaveAttribute("data-wow-invite", /.*/);
    await page.locator(`${STAGE} [data-wow-show]`).click();
    const handle = page.locator(`${STAGE} [data-wow-handle]`);
    await expect(handle).toBeVisible();
    for (const key of ["Home", "End"]) {
      await handle.focus();
      await page.keyboard.press(key);
      await page.waitForTimeout(400); // 150 ms transition with reduced motion
      const s = await gripState(page);
      expect(s.visible).toBe(true);
      expect(s.left, key).toBeGreaterThanOrEqual(Math.max(0, s.fl) - 0.5);
      expect(s.right, key).toBeLessThanOrEqual(Math.min(s.vw, s.fr) + 0.5);
    }
    await ctx.close();
  });
}

// Endtest 29.10.2026 (bewusst geändert): Seit R5-fix P2 gibt es /en|fr|it/arbeitsweise
// als eigene Seiten (src/app/[locale]/arbeitsweise/page.js: „308 + LangNotice –
// beides entfällt“). /de/arbeitsweise?lang=en zeigt daher keinen Hinweis mehr; die
// englische Fassung prüft r9-p2-arbeitsweise-i18n.spec.js.
test("Sprachhinweis entfällt: /de/arbeitsweise?lang=en ohne Hinweis, Canonical DE", async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ ...IPHONE, baseURL });
  const page = await ctx.newPage();
  await page.goto("/de/arbeitsweise?lang=en", { waitUntil: "domcontentloaded", timeout: 150_000 });
  await expect(page.locator("h1")).toHaveText(/Von der Handzeichnung zum Rendering/);
  await expect(page.locator("[data-lang-notice]:visible")).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/de\/arbeitsweise$/);
  await ctx.close();
});

test("Ezarri auf dem iPhone: H1 im ersten Bildschirm (≤ 500 px), Bild direkt darunter", async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ ...IPHONE, baseURL });
  const page = await ctx.newPage();
  await page.goto("/de/ezarri", { waitUntil: "domcontentloaded", timeout: 150_000 });
  const h1 = await page.locator("h1").boundingBox();
  expect(h1.y + h1.height).toBeLessThanOrEqual(500);
  const img = await page.locator("header figure").first().boundingBox();
  expect(img.y).toBeGreaterThan(h1.y);
  await ctx.close();
});

test("Arbeitsweise auf dem iPad: Auftakt-Grafik rechts neben dem Knopf (keine halbe Leerfläche)", async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ ...IPAD, baseURL });
  const page = await ctx.newPage();
  await page.goto("/de/arbeitsweise", { waitUntil: "domcontentloaded", timeout: 150_000 });
  // Endtest 29.10.2026 (bewusst geändert): die Liniengrafik (LineStudy) ist seit
  // R5-fix P2 durch das Papierblatt [data-hero-sheet] ersetzt (ArbeitsweisePage.js, HeroVisual).
  const fig = await page.locator("[data-hero-sheet]").boundingBox();
  const btn = await page.getByRole("link", { name: "Termin anfragen" }).first().boundingBox();
  const vw = page.viewportSize().width;
  expect(fig.x).toBeGreaterThan(btn.x + btn.width);
  expect(fig.x + fig.width).toBeGreaterThan(vw * 0.85);
  await ctx.close();
});
