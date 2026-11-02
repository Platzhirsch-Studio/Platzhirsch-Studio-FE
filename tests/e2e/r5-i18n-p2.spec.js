// Runde 4, Fix-Team „P2 Sprache, Cookie-Leiste, Umleitungen“ (gesamtwerk P1-1,
// recht P1-5, technik P1-3a, ux P1-4b). Gegen den laufenden Server, nur im
// Desktop-Projekt (Chromium); die Handy-Fälle setzen Viewport und Touch des
// iPhone 13 selbst. Sendet nie ein Formular ab und speichert keine Einwilligung
// außer im eigenen, frischen Browser-Kontext.
import { test, expect, devices } from "@playwright/test";

const { defaultBrowserType: _ignored, ...IPHONE_13 } = devices["iPhone 13"];

const GLOBAL_PAGES = ["sofaplaner", "kuechenplaner", "stil-finder", "yacht-interior", "outdoor-gartenplanung", "concierge", "bodensee-licht"];
// Erwartung bewusst geändert (R9; R5-fix P2, gesamtwerk P1-2): /arbeitsweise
// steht jetzt in allen vier Sprachen unter eigenem Pfad – keine Umleitung,
// kein Sprachhinweis. Eigener Hinweis bleibt nur bei Ezarri.
const OWN_PAGES = ["ezarri"];
const MULTILINGUAL = ["sofaplaner", "kuechenplaner", "stil-finder", "yacht-interior", "outdoor-gartenplanung", "ezarri"];
const NOTE = { en: "only available in German", fr: "qu’en allemand", it: "solo in tedesco" };

async function visibleNotices(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("[data-lang-notice]")]
      .filter((e) => !e.hidden && e.getClientRects().length > 0)
      .map((e) => ({
        lang: e.getAttribute("lang"),
        role: e.getAttribute("role"),
        live: e.getAttribute("aria-live"),
        global: e.hasAttribute("data-lang-notice-global"),
        text: e.innerText,
      })),
  );
}

test.describe("R4 P2: Hinweis „nur auf Deutsch“ nach der Umleitung", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "desktop project is enough");

  const cases = [
    // Welle 2 (Inhaber Nr. 13, bewusst geändert): Sofaplaner, Yacht und Ezarri gibt es auf
    // Englisch – /en/… liefert dort die englische Seite, keine Umleitung mit Hinweis.
    // QM-Endabnahme 02.11.2026 (bewusst geändert): Küchenplaner, Stil-Finder, Outdoor, Sofaplaner, Yacht und
    // Ezarri sind seit 01.11.2026 viersprachig (eigene Seite je Sprache, kein Hinweis). Umgeleitet werden nur noch
    // Concierge und Bodensee-Licht.
    ...[...GLOBAL_PAGES, ...OWN_PAGES].filter((p) => !MULTILINGUAL.includes(p)).map((p) => ["en", p]),
    ["it", "concierge"],
  ];
  for (const [lang, slug] of cases) {
    test(`/${lang}/${slug}: genau ein Hinweis in ${lang}`, async ({ page }) => {
      await page.addInitScript(() => {
        window.__reveal = null;
        new MutationObserver((list) => {
          for (const m of list) {
            if (window.__reveal === null && m.target.matches?.("[data-lang-notice]") && !m.target.hidden) window.__reveal = performance.now();
          }
        }).observe(document, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
        window.__cls = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto(`/${lang}/${slug}`);
      expect(new URL(page.url()).pathname).toBe(`/de/${slug}`);
      await page.waitForLoadState("load");
      const notices = await visibleNotices(page);
      expect(notices, JSON.stringify(notices)).toHaveLength(1);
      expect(notices[0].lang).toBe(lang);
      expect(notices[0].text).toContain(NOTE[lang]);
      // Der globale Hinweis ist eine Statusmeldung; die eigenen Hinweise von
      // Arbeitsweise/Ezarri (Arbeitsweise/LangNotice.js) sind <aside>.
      if (GLOBAL_PAGES.includes(slug)) {
        expect(notices[0].global).toBe(true);
        expect(notices[0].role).toBe("status");
        expect(notices[0].live).toBe("polite");
      } else expect(notices[0].global).toBe(false);
      // Der Hinweis steht schon im ersten Bild (eingeblendet vor First
      // Contentful Paint), also kein eigener Layout-Sprung. Manche Seiten haben
      // unabhängig davon kleine Sprünge (Outdoor ≈ 0,02); die Seite bleibt „gut“.
      const t = await page.evaluate(() => ({
        reveal: window.__reveal,
        fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null,
        cls: window.__cls,
      }));
      expect(t.reveal, JSON.stringify(t)).not.toBeNull();
      if (t.fcp !== null) expect(t.reveal, JSON.stringify(t)).toBeLessThan(t.fcp);
      expect(t.cls, JSON.stringify(t)).toBeLessThan(0.1);
    });
  }

  test("DE ohne ?lang: kein Hinweis; ?lang auf einer Seite mit eigenem Hinweis: keiner doppelt", async ({ page }) => {
    await page.goto("/de/sofaplaner");
    expect(await visibleNotices(page)).toHaveLength(0);
    await page.goto("/de/ezarri?lang=fr");
    const n = await visibleNotices(page);
    expect(n).toHaveLength(1);
    expect(n[0].global).toBe(false);
  });

  test("Bodensee-Licht: die Umleitung behält ?lang und vorhandene Parameter", async ({ request }) => {
    const plain = await request.get("/en/bodensee-licht", { maxRedirects: 0 });
    expect(plain.status()).toBe(308);
    expect(plain.headers().location).toBe("/de/bodensee-licht?lang=en");
    const withQuery = await request.get("/it/bodensee-licht?ort=lindau&fenster=180", { maxRedirects: 0 });
    expect(withQuery.status()).toBe(308);
    const loc = new URL(withQuery.headers().location, "http://x");
    expect(loc.pathname).toBe("/de/bodensee-licht");
    expect(loc.searchParams.get("lang")).toBe("it");
    expect(loc.searchParams.get("ort")).toBe("lindau");
    expect(loc.searchParams.get("fenster")).toBe("180");
  });

  // Erwartung bewusst geändert (R5-Fix P1, recht P1-4): kein Set-Cookie vom Server,
  // auch nicht beim ersten Besuch oder Sprachwechsel per URL (r9-p1-locale-cookie.spec.js).
  test("NEXT_LOCALE: nie vom Server gesetzt", async ({ request, playwright }) => {
    const fresh = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
    for (const url of ["/de/kontakt", "/de/kontakt", "/en/contact"]) {
      const res = await fresh.get(url, { maxRedirects: 0 });
      expect(res.headers()["set-cookie"] || "", url).not.toContain("NEXT_LOCALE");
    }
    await fresh.dispose();
    void request;
  });
});

test.describe("R4 P2: Cookie-Leiste auf dem iPhone 13", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "desktop project is enough");
  test.use(IPHONE_13);

  const bar = (page) => page.locator("[data-consent-bar]");

  // Team Grün 30.10.2026 (begründet angepasst): /en/sofaplaner ist seit Welle 2 eine eigene
  // englische Seite (200, <html lang="en">, r7-p6-release.spec.js) und leitet nicht mehr auf
  // /de/sofaplaner?lang=en um. Die ?lang-Prüfung läuft für EN daher auf einer weiter nur deutschen
  // Seite (/en/stil-finder → 308); /en/sofaplaner wird unten als englische Seite geprüft.
  test("/en/sofaplaner (eigene EN-Seite): Leiste englisch über die Seitensprache, ≤ 30 % der Höhe", async ({ page }) => {
    await page.goto("/en/sofaplaner");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(bar(page)).toBeVisible({ timeout: 20_000 });
    await expect(bar(page)).not.toHaveAttribute("lang", /./);
    await expect(bar(page)).toContainText("USA");
    await expect(bar(page).getByRole("button", { name: "Accept all" })).toBeVisible();
    const { h, vh } = await bar(page).evaluate((el) => ({ h: el.getBoundingClientRect().height, vh: window.innerHeight }));
    expect(h / vh).toBeLessThanOrEqual(0.3);
  });

  for (const [lang, slug, usa, accept] of [
    ["en", "stil-finder", "USA", "Accept all"],
    ["fr", "stil-finder", "États-Unis", null],
    ["it", "kuechenplaner", "Stati Uniti", null],
  ]) {
    test(`/${lang}/${slug}: Leiste in ${lang}, nennt die USA, ≤ 30 % der Höhe`, async ({ page }) => {
      await page.goto(`/${lang}/${slug}`);
      await expect(bar(page)).toBeVisible({ timeout: 20_000 });
      // QM-Endabnahme 02.11.2026 (bewusst geändert): Seite selbst in  → Leiste ohne eigenes lang.
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(bar(page)).not.toHaveAttribute("lang", /./);
      await expect(bar(page)).toContainText(usa);
      if (accept) await expect(bar(page).getByRole("button", { name: accept })).toBeVisible();
      const { h, vh } = await bar(page).evaluate((el) => ({ h: el.getBoundingClientRect().height, vh: window.innerHeight }));
      expect(h / vh).toBeLessThanOrEqual(0.3);
    });
  }

  test("DE: Leiste deutsch, schließt sich nicht von selbst, Reihenfolge Einstellungen → Akzeptieren → Ablehnen", async ({ page }) => {
    await page.goto("/de/kontakt");
    await expect(bar(page)).toBeVisible({ timeout: 20_000 });
    await expect(bar(page)).not.toHaveAttribute("lang", /./);
    await expect(bar(page)).toContainText("USA");
    await page.waitForTimeout(6_000);
    await expect(bar(page)).toBeVisible();
    const order = await bar(page).evaluate((el) => [...el.querySelectorAll("button")].map((b) => b.textContent.trim()));
    expect(order).toEqual(["Individuelle Einstellungen", "Alle akzeptieren", "Weiter ohne Einwilligung"]);
  });

  // WCAG 2.4.11 Focus Not Obscured (Minimum): die ersten Bedienelemente liegen
  // nicht unter der Leiste, auch nicht, wenn sie den Fokus bekommen.
  test("/de/beratung: erste Wizard-Option nicht unter der Leiste", async ({ page }) => {
    await page.goto("/de/beratung");
    await expect(bar(page)).toBeVisible({ timeout: 20_000 });
    const first = page.locator("main input[type=radio]").first();
    await first.focus();
    const [top, optionBottom] = await Promise.all([
      bar(page).evaluate((el) => el.getBoundingClientRect().top),
      first.evaluate((el) => (el.closest("label") || el).getBoundingClientRect().bottom),
    ]);
    expect(optionBottom).toBeLessThanOrEqual(top);
  });

  test("/de/kontakt: Kontakt-Knöpfe nicht unter der Leiste", async ({ page }) => {
    await page.goto("/de/kontakt");
    await expect(bar(page)).toBeVisible({ timeout: 20_000 });
    const top = await bar(page).evaluate((el) => el.getBoundingClientRect().top);
    // „Nachricht schreiben“ (#nachricht) und „Anrufen“ (erster tel:-Link) im Kopf der Seite
    const buttons = page.locator('main a[href="#nachricht"], main a[href^="tel:"]');
    const n = Math.min(await buttons.count(), 2);
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      await buttons.nth(i).focus();
      const bottom = await buttons.nth(i).evaluate((el) => el.getBoundingClientRect().bottom);
      expect(bottom, `Knopf ${i}`).toBeLessThanOrEqual(top);
    }
  });
});
