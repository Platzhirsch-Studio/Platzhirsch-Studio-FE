// R5-fix P2 – /arbeitsweise in vier Sprachen, Wow ohne Sessel-Linien, Team-Raster,
// Startseiten-Links. Run: PW_WORKERS=1 npx playwright test r9-p2-arbeitsweise-i18n --project=desktop
// Hinweis: die EN/FR/IT-Abnahme braucht einen Dev-Server, der next.config.js
// (redirects() → deOnlyRedirects.cjs) nach dieser Änderung geladen hat.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { blockFormSends, dismissCookieBanner, settle } from "./helpers.js";

const SITE = "https://platzhirsch.studio";
const H1 = {
  de: "Von der Handzeichnung zum Rendering.",
  en: "From hand drawing to rendering.",
  fr: "Du dessin à la main au rendu.",
  it: "Dal disegno a mano al rendering.",
};
const HOME = { de: "Startseite", en: "Home", fr: "Accueil", it: "Home" };
// Endtest 29.10.2026 (bewusst geändert): geprüft wird der Seitenhinweis „nur auf
// Deutsch“ (r6-recht P1-4 betraf Verweise auf /de/arbeitsweise). Die Linkzusätze
// „(in German)/(en allemand)/(in tedesco)“ an Links auf rein deutsche Werkzeugseiten
// (Küchenplaner, Sofaplaner, Stil-Finder, Bodensee-Licht, Yacht, Outdoor) stammen aus
// src/lib/arbeitsweise/copy-intl.js und kennzeichnen die Sprache des Linkziels korrekt.
const NOTE = /only available in German|n’existe qu’en allemand|disponibile solo in tedesco/;

test.describe("Arbeitsweise mehrsprachig", () => {
  for (const l of Object.keys(H1)) {
    test(`/${l}/arbeitsweise: 200, lang, H1, index, eigene Canonical, hreflang + x-default`, async ({ request }) => {
      const res = await request.get(`/${l}/arbeitsweise`, { timeout: 180_000, maxRedirects: 0 });
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).toMatch(new RegExp(`<html[^>]* lang="${l}"`)); // QM-Endabnahme: data-dpl-id (Dev) steht davor
      expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
      expect(html).toContain(H1[l]);
      expect(html).toMatch(/<meta name="robots" content="index, follow"/);
      expect(html).toContain(`<link rel="canonical" href="${SITE}/${l}/arbeitsweise"/>`);
      for (const h of ["de", "en", "fr", "it"]) expect(html).toContain(`hrefLang="${h}" href="${SITE}/${h}/arbeitsweise"`);
      expect(html).toContain(`hrefLang="x-default" href="${SITE}/de/arbeitsweise"`);
      expect(html).toContain(`/${l}/arbeitsweise/teilen.png`);
      const og = await request.get(`/${l}/arbeitsweise/teilen.png`, { timeout: 180_000 });
      expect(og.status()).toBe(200);
      expect(og.headers()["content-type"]).toMatch(/image\/png/);
    });
  }

  for (const l of ["en", "fr", "it"]) {
    test(`/${l}/arbeitsweise: Brotkrume in der Sprache, kein Sprachhinweis, axe 0 Verstöße`, async ({ page }) => {
      await blockFormSends(page);
      await page.goto(`/${l}/arbeitsweise`, { timeout: 180_000 });
      await settle(page);
      await dismissCookieBanner(page);
      const crumbs = page.locator("main nav ol").first();
      await expect(crumbs.locator("li").first()).toHaveText(HOME[l]);
      await expect(page.locator("main")).not.toContainText(NOTE);
      await expect(page.locator("[data-hero-sheet]")).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).exclude("nextjs-portal").analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });
  }

  test("/de/arbeitsweise: axe 0 Verstöße (auch color-contrast der Stationen)", async ({ page }) => {
    await blockFormSends(page);
    await page.goto("/de/arbeitsweise", { timeout: 180_000 });
    await settle(page);
    await dismissCookieBanner(page);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).exclude("nextjs-portal").analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});

test.describe("Startseite", () => {
  test("/de: keine Sessel-Linie im Hero, Links ohne ?thema= außer Beratung, Arbeitsweise-Link je Sprache", async ({ request }) => {
    const html = await (await request.get("/de", { timeout: 300_000 })).text();
    expect(html).not.toMatch(/wow-p-chair/);
    const thema = [...html.matchAll(/href="([^"]*\?thema=[^"]*)"/g)].map((m) => m[1]);
    for (const h of thema) expect(h).toMatch(/^\/de\/beratung\?thema=/);
    const it = await (await request.get("/it", { timeout: 300_000 })).text();
    // visible link texts only (serialized messages of other namespaces may still carry the note)
    expect(it.replace(/<script[\s\S]*?<\/script>/g, "")).not.toContain("Il nostro metodo (in tedesco)");
    expect(it).toContain('href="/it/arbeitsweise"');
    expect(it).toContain("Mostrate la linea");
  });
});

test.describe("Team", () => {
  test("Fotoraster ohne leere Spalte, Harald mit USP-Satz und Link in der Sprache", async ({ page }) => {
    await page.goto("/de/ueber-uns/team", { timeout: 180_000 });
    const cards = page.locator("[data-team-cards]");
    if (await cards.count()) {
      const cols = Number(await cards.getAttribute("data-cols"));
      const n = await cards.locator(":scope > li").count();
      expect(n % cols === 0 || n > cols).toBeTruthy();
    }
    // Rat 9,5 (A5, bewusst geänderte Erwartung): Haralds USP-Satz und der Link
    // auf /arbeitsweise stehen jetzt in seinem eigenen Kapitel ÜBER dem Raster
    // (data-team-harald), nicht mehr in seiner Rasterkarte (keine Wiederholung).
    const chapter = page.locator("[data-team-harald]");
    await expect(chapter).toContainText("von Hand");
    await expect(chapter.locator('a[href="/de/arbeitsweise"]')).toBeVisible();
    const harald = page.locator("li", { has: page.locator("h3", { hasText: "Harald Menghin" }) });
    await expect(harald).toHaveCount(1);
    await expect(harald.locator("img")).toHaveCount(0);
    const [chapterTop, gridTop] = await Promise.all([chapter.boundingBox(), page.locator("#team-members").boundingBox()]);
    expect(chapterTop.y).toBeLessThan(gridTop.y);
    // Ein Kartenformat für alle (Foto- ODER Textkarten), kein Doppelporträt.
    expect((await page.locator("[data-team-cards]").count()) + (await page.locator("[data-team-list]").count())).toBe(1);
    const srcs = await page.locator("main img").evaluateAll((imgs) => imgs.map((i) => i.currentSrc || i.src).filter((s) => s.includes("%2Fcms%2F")));
    const files = srcs.map((s) => decodeURIComponent(s).match(/\/cms\/[^&]+/)?.[0]);
    expect(new Set(files).size).toBe(files.length);
  });
});
