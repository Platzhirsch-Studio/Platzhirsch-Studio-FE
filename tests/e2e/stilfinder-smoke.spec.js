// Stil-Finder – gebündelter Smoke (mobil-code-seo, fix-06). Läuft durch den
// Dateinamen (*smoke.spec.js) in desktop, iphone und pixel (playwright.config
// MOBILE_SPECS). Nichts wird gesendet oder gespeichert (keine PDF-Anfrage,
// kein „Merken“). NICHT gegen den Live-Dev-Server während einer Vorführung
// starten – eigener Server: `npm run build && npx next start -p 3100`,
// dann BASE_URL=http://localhost:3100 npx playwright test stilfinder-smoke.
//
// Deckt ab: Tastatur-Durchlauf mit Fokus je Frage (WCAG 2.4.3), Fragenposition
// im Namen (fix-01), Zeichentasten nur im Quiz (2.1.4, fix-01), axe 2.2 AA auf
// Einleitung/Frage/Ergebnis, kein waagrechtes Scrollen (Hochformat und
// Querformat Handy, 1.4.10), reduzierte Bewegung, Ergebnis-Metadaten (fix-02),
// FAQ/JSON-LD (fix-03), 404 für fremde Profile/Sprachen.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { collectConsoleErrors, dismissCookieBanner, jsonLdNodes, measureOverflow } from "./helpers.js";

const QUIZ = "/de/stil-finder";
const PROFILE = "/de/stil-finder/ergebnis/italienische-ruhe";
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const hydrated = (page) =>
  page.waitForFunction(() => {
    const b = document.querySelector("#stilfinder button");
    return b && Object.keys(b).some((k) => k.startsWith("__reactProps"));
  }, null, { timeout: 60_000 });

async function axe(page, label) {
  const r = await new AxeBuilder({ page }).withTags(AXE_TAGS).include("main").analyze();
  const severe = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(severe.map((v) => `${v.id}: ${v.nodes.length}`), label).toEqual([]);
}

async function noSideScroll(page, label) {
  const o = await measureOverflow(page);
  expect(o.sw, `${label}: ${o.wide.join(", ")}`).toBeLessThanOrEqual(o.vw + 1);
}

test.describe("Stil-Finder Smoke", () => {
  test("Tastatur: sieben Fragen nur mit Tasten, Fokus auf jeder Frage, Ergebnis lädt", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Tastatur-Lauf einmal auf Desktop");
    const errors = collectConsoleErrors(page);
    await page.goto(QUIZ);
    await dismissCookieBanner(page, 15_000);
    await hydrated(page);
    await axe(page, "Einleitung");

    const start = page.getByRole("button", { name: /Stil-Finder starten/ });
    await start.focus();
    await page.keyboard.press("Enter");

    for (let i = 0; i < 7; i++) {
      const h = page.locator("#stilfinder h2");
      await expect(h).toBeFocused({ timeout: 5_000 });
      await expect(h).toHaveAttribute("aria-label", new RegExp(`^Frage ${i + 1} von 7: `));
      if (i === 0) await axe(page, "Frage 1");
      await page.keyboard.press("1");
    }
    await expect(page.getByRole("status").filter({ hasText: /Moodboard/ })).toBeVisible();
    await page.waitForURL(/\/de\/stil-finder\/ergebnis\/[a-z-]+\?a=[0-4x]{7}$/, { timeout: 15_000 });
    await expect(page.locator("#sf-result-title")).toBeVisible();
    await axe(page, "Ergebnis");
    expect(errors.filter((e) => /hydrat|Stilfinder|StilResult|sf-/i.test(e))).toEqual([]);
  });

  test("2.1.4: Ziffern außerhalb des Quiz beantworten keine Frage", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "einmal auf Desktop");
    await page.goto(QUIZ);
    await dismissCookieBanner(page, 15_000);
    await hydrated(page);
    await page.getByRole("button", { name: /Stil-Finder starten/ }).click();
    await expect(page.locator("#stilfinder h2")).toBeFocused();
    // Fokus in die Kopfzeile (erster Link der Seite außerhalb des Quiz)
    await page.locator("header a").first().focus();
    await page.keyboard.press("2");
    await page.waitForTimeout(600);
    await expect(page.locator("#stilfinder h2")).toHaveAttribute("aria-label", /^Frage 1 von 7: /);
    await expect(page.locator("#stilfinder [aria-pressed=true]")).toHaveCount(0);
  });

  test("Handy: Antippen, Hochformat und Querformat ohne waagrechtes Scrollen", async ({ page }, info) => {
    test.skip(info.project.name === "desktop", "nur Handy-Projekte");
    await page.goto(QUIZ);
    await dismissCookieBanner(page, 15_000);
    await hydrated(page);
    await noSideScroll(page, "Einleitung hoch");
    await page.getByRole("button", { name: /Stil-Finder starten/ }).tap();
    const first = page.locator("#stilfinder [role=group] button").first();
    const box = await first.boundingBox();
    expect(box.height, "Zielgröße ≥ 24 px (2.5.8)").toBeGreaterThanOrEqual(24);
    await noSideScroll(page, "Frage 1 hoch");
    const vp = page.viewportSize();
    await page.setViewportSize({ width: vp.height, height: vp.width });
    await noSideScroll(page, "Frage 1 quer");
    await first.tap();
    await expect(page.locator("#stilfinder h2")).toHaveAttribute("aria-label", /^Frage 2 von 7: /, { timeout: 5_000 });
    await page.goto(`${PROFILE}?a=0000000`);
    await noSideScroll(page, "Ergebnis quer");
  });

  test.describe("reduzierte Bewegung", () => {
    test.use({ reducedMotion: "reduce" });
    test("Fragen wechseln ohne Verschiebung, Mischbalken sofort voll", async ({ page }, info) => {
      test.skip(info.project.name !== "desktop", "einmal auf Desktop");
      await page.goto(QUIZ);
      await dismissCookieBanner(page, 15_000);
      await hydrated(page);
      await page.getByRole("button", { name: /Stil-Finder starten/ }).click();
      await page.keyboard.press("1");
      await expect(page.locator("#stilfinder h2")).toHaveAttribute("aria-label", /^Frage 2 von 7: /, { timeout: 2_000 });
      await page.goto(`${PROFILE}?a=0000000`);
      const anim = await page.getByTestId("sf-mix-bar").evaluate((b) => getComputedStyle(b).animationName);
      expect(anim).toBe("none");
    });
  });

  test("SEO: Quiz indexierbar mit FAQ, Ergebnis noindex mit Canonical ohne ?a=, eigenes og:image", async ({ request }, info) => {
    test.skip(info.project.name !== "desktop", "Server-Ausgabe einmal prüfen");
    const quiz = await request.get(QUIZ);
    expect(quiz.status()).toBe(200);
    const qh = await quiz.text();
    expect(qh).toContain('<link rel="canonical" href="https://platzhirsch.studio/de/stil-finder"');
    // QM-Endabnahme 02.11.2026 (bewusst geändert): „W“ steht für das Kerning in eigenem <span>.
    expect(qh.replace(/<[^>]+>/g, "")).toContain("Die Wohnstile des Stil-Finders");
    const types = jsonLdNodes(qh).map((n) => n["@type"]);
    expect(types).toEqual(expect.arrayContaining(["WebApplication", "FAQPage"]));

    const res = await request.get(`${PROFILE}?a=0000000`);
    expect(res.status()).toBe(200);
    const rh = await res.text();
    expect(rh).toMatch(/<meta name="robots" content="noindex, follow"/);
    expect(rh).toContain(`<link rel="canonical" href="https://platzhirsch.studio${PROFILE}"`);
    expect(rh).toContain(`<meta property="og:url" content="https://platzhirsch.studio${PROFILE}"`);
    expect(rh).not.toMatch(/og:image" content="[^"]*\/Images\//);
    const og = rh.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    expect(og).toMatch(/\/opengraph-image/);
    const img = await request.get(new URL(og).pathname + new URL(og).search);
    expect(img.status()).toBe(200);
    expect(img.headers()["content-type"]).toContain("image/png");
  });

  test("404: fremdes Profil, fremde Sprache, OG-Bild eines fremden Profils", async ({ request }, info) => {
    test.skip(info.project.name !== "desktop", "einmal");
    expect((await request.get("/de/stil-finder/ergebnis/gibt-es-nicht")).status()).toBe(404);
    expect((await request.get("/de/stil-finder/ergebnis/gibt-es-nicht/opengraph-image")).status()).toBe(404);
    // QM-Endabnahme 02.11.2026 (bewusst geändert): Stil-Finder ist seit 01.11.2026 viersprachig – /fr liefert 200.
    const fr = await request.get("/fr/stil-finder", { maxRedirects: 0 });
    expect(fr.status()).toBe(200);
  });
});
