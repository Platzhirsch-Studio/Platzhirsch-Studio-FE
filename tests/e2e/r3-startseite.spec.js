// tests/e2e/r3-startseite.spec.js — R3-startseite against the running server:
// mobile page height, hero image (750 w 1x / 1080 w 2x q50 on phones, preload,
// CLS), scroll rows (live region, rows load their images early)
// with visible controls, "Weiterlesen" for the SEO text, nothing lost for SEO.
// Runs in the desktop project; the phone checks emulate a Pixel 7 per test.
import { test, expect, devices } from "@playwright/test";

const LOCALES = ["de", "en", "fr", "it"];
const { defaultBrowserType: _pixelBrowser, ...PIXEL } = devices["Pixel 7"];

test.describe("Startseite mobil (Pixel 7)", () => {
  test.use(PIXEL);

  test("Seitenhöhe /de unter 13 000 px, kein Querscroll", async ({ page }) => {
    await page.goto("/de", { waitUntil: "networkidle" });
    const { height, overflow } = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
    }));
    expect(height).toBeLessThan(13000);
    expect(overflow).toBe(false);
  });

  test("Hero lädt mobil 750 (1x) bzw. 1080 (2x) in q50, vorgeladen, ohne Layoutsprung", async ({ page }) => {
    await page.goto("/de", { waitUntil: "load" });
    const preload = page.locator('link[rel="preload"][as="image"][media="(max-width: 639px)"]');
    await expect(preload).toHaveCount(1);
    const set = await preload.getAttribute("imagesrcset");
    // QM-Endabnahme 02.11.2026 (bewusst geändert): im Dev hängt next.config.js deploymentId als &dpl=… an.
    expect(set).toMatch(/w=750&q=50(&dpl=[^ ,]+)? 1x/);
    expect(set).toMatch(/w=1080&q=50(&dpl=[^ ,]+)? 2x/);
    expect(set).not.toMatch(/w=(1200|1920)/);
    const img = page.locator("section[aria-labelledby=home-hero-title] picture img");
    await expect(img).toHaveAttribute("fetchpriority", "high");
    // Pixel 7 = DPR 2.625 → the 2x candidate.
    await expect.poll(() => img.evaluate((el) => el.complete && el.currentSrc)).toContain("w=1080&q=50");
    const cls = await page.evaluate(
      () =>
        new Promise((resolve) => {
          let sum = 0;
          new PerformanceObserver((l) => l.getEntries().forEach((e) => !e.hadRecentInput && (sum += e.value))).observe({ type: "layout-shift", buffered: true });
          setTimeout(() => resolve(sum), 500);
        })
    );
    expect(cls).toBeLessThanOrEqual(0.01);
  });

  test("Scroll-Reihe Räume: sichtbare Knöpfe blättern weiter", async ({ page }) => {
    await page.goto("/de", { waitUntil: "networkidle" });
    const list = page.locator("#home-rooms-list");
    const next = page.locator('button[aria-controls="home-rooms-list"]').nth(1);
    await list.scrollIntoViewIfNeeded();
    await expect(next).toBeVisible();
    await expect(next).toHaveAttribute("aria-label", "Weiter blättern");
    const before = await list.evaluate((el) => el.scrollLeft);
    await next.click();
    await expect.poll(() => list.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before + 50);
    await expect(page.getByText("2 von 4", { exact: true }).first()).toBeVisible();
    // QA P3-2: the button press is announced politely.
    await expect(page.locator("#home-rooms-list").locator("xpath=..").locator('[role="status"]')).toHaveText("2 von 4");
    // QA P3-3: once the row is near the screen, its images no longer wait for lazy loading.
    await expect.poll(() => list.evaluate((el) => el.querySelectorAll('img[loading="lazy"]').length)).toBe(0);
  });

  test("Hauptinhalt /de mobil unter 9 800 px, ganze Seite unter 13 000 px (Höhenziel)", async ({ page }) => {
    // R3 fix (QA P2-2): main alone, so the cookie bar reservation and the
    // footer (Team 1) do not mask the homepage's own share.
    // Integration 28.10.2026: the USP chapter (Inhaber-Entscheidung Nr. 8, own
    // chapter on the home page) adds about 350 px on phones; the footer shrank
    // from 3 413 to about 2 000 px (R4 ticket), so the page goal of 13 000 px
    // (r3-R3-startseite.md) still has about 1 400 px of headroom.
    // Fix-Runde 1 (F1, Release-Rat gesamtwerk P2-5 "Messgröße benennen"):
    // the 9 800 px goal is the height of <main> – the homepage's own content
    // from the hero to the closing CTA – NOT document.scrollHeight. The page
    // height adds the shared header (~70 px), the cookie-bar reservation and
    // the site footer (~2 000 px on phones), which belong to the shell and are
    // the same on every page; they are capped by the 13 000 px page goal.
    // Measured 28.10.2026 (dev, Pixel 7): main 9 294 px, page 11 319 px.
    // F1 added the line graphic and pictograms of the USP chapter (+380 px)
    // and saved the house photo (phones: no composition) and the category line
    // under "Sechs Stücke" (phones: the menu carries the categories).
    await page.goto("/de", { waitUntil: "networkidle" });
    const { main, total } = await page.evaluate(() => ({
      main: Math.round(document.querySelector("main").getBoundingClientRect().height),
      total: document.documentElement.scrollHeight,
    }));
    // R5-USP (gesamtwerk P1-2, bewusst verschärft): region grid → one line,
    // SEO text + FAQ folded at the end, hours once – main below 9 000 px.
    expect(main).toBeLessThan(9000);
    expect(total).toBeLessThan(13000);
  });

  test("SEO-Text: Weiterlesen öffnet den zweiten Absatz, alles steht im HTML", async ({ page }) => {
    await page.goto("/de", { waitUntil: "networkidle" });
    const more = page.locator('button[aria-controls="home-seo-text"]');
    const second = page.locator("#home-seo-text > p").nth(1);
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await expect(second).toBeHidden();
    await more.click();
    await expect(more).toHaveAttribute("aria-expanded", "true");
    await expect(second).toBeVisible();
  });
});

test.describe("Startseite Desktop", () => {
  test("Hero lädt auf Desktop die responsive Quelle, Bedienknöpfe der Reihen versteckt", async ({ page }) => {
    await page.goto("/de", { waitUntil: "load" });
    const img = page.locator("section[aria-labelledby=home-hero-title] picture img");
    await expect.poll(() => img.evaluate((el) => el.complete && el.currentSrc)).toMatch(/w=(750|828|1080|1200|1920)&q=75/);
    await expect(page.locator('button[aria-controls="home-rooms-list"]').first()).toBeHidden();
    // R5-USP (bewusst geändert, gesamtwerk P1-2): the SEO text is folded on every
    // width now – "Weiterlesen" is visible on desktop too, the rest is in the HTML.
    await expect(page.locator('button[aria-controls="home-seo-text"]')).toBeVisible();
    await expect(page.locator("#home-seo-text > p").nth(1)).toBeHidden();
  });

  for (const locale of LOCALES) {
    test(`/${locale}: eine H1, SEO-Text + FAQ im HTML, keine Rohschlüssel`, async ({ request }) => {
      const res = await request.get(`/${locale}`);
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
      // Runde 2: the H1 carries the Kern-USP (i18n team P1, seo P2-2) – was "Italienisches …"
      if (locale === "de") expect(html).toContain("Von Hand gezeichnet");
      expect(html).toContain('id="home-seo-text"');
      expect(html.match(/<details/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
      expect(html).toContain('"@type":"FAQPage"');
      expect(html).not.toMatch(/HomePage\.[a-z]+\.[a-zA-Z]+/);
    });
  }
});
