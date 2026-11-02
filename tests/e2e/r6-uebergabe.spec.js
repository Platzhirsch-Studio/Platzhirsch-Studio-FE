// tests/e2e/r6-uebergabe.spec.js — R6-uebergabe: Freigabe-Cockpit.
// Dev (und Prod mit FREIGABE_PREVIEW=1): /de/preview/freigaben 200, noindex,
// nofollow, kein Formular, axe ohne serious/critical, kein horizontales Scrollen.
// Prod-Lauf ohne Schalter (prod-check setzt FREIGABE_PREVIEW_EXPECT=off): 404.
// EN/FR/IT immer 404. Die Seite sendet nichts; blockFormSends() sichert ab.
// Run: npx playwright test tests/e2e/r6-uebergabe.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { blockFormSends, dismissCookieBanner, measureOverflow, robotsDirectives, settle } from "./helpers.js";

const PATH = "/de/preview/freigaben";
const OFF = process.env.FREIGABE_PREVIEW_EXPECT === "off";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
// Dev-Server kompiliert 404-Seiten beim ersten Aufruf: großzügige Zeiten.
const REQ = { maxRedirects: 0, timeout: 60_000 };
test.setTimeout(180_000);

test("EN/FR/IT → 404", async ({ request }) => {
  for (const l of ["en", "fr", "it"]) {
    const res = await request.get(`/${l}/preview/freigaben`, REQ);
    expect(res.status(), l).toBe(404);
  }
});

test("Sitemap und llms.txt nennen das Cockpit nicht", async ({ request }) => {
  for (const p of ["/sitemap.xml", "/llms.txt"]) {
    const res = await request.get(p, { timeout: 60_000 });
    if (!res.ok()) continue;
    expect(await res.text(), p).not.toContain("preview/freigaben");
  }
});

test.describe("Schalter aus (Produktion)", () => {
  test.skip(!OFF, "nur ohne FREIGABE_PREVIEW");
  test(`${PATH} → 404`, async ({ request }) => {
    const res = await request.get(PATH, REQ);
    expect(res.status()).toBe(404);
  });
});

test.describe("Cockpit sichtbar (Dev oder FREIGABE_PREVIEW=1)", () => {
  test.skip(OFF, "Produktion ohne Schalter");

  test("200, noindex/nofollow, kein Formular", async ({ request }) => {
    const res = await request.get(PATH, REQ);
    expect(res.status()).toBe(200);
    const text = await res.text();
    const robots = robotsDirectives({ text, headers: res.headers() });
    expect(robots).toContain("noindex");
    expect(robots).toContain("nofollow");
    expect(text).not.toMatch(/<form[\s>]/i);
    expect(text).not.toMatch(/binni/i);
  });

  test("Abschnitte, axe ohne serious/critical, kein Überlauf", async ({ page }) => {
    await blockFormSends(page);
    await page.goto(PATH);
    await settle(page);
    await dismissCookieBanner(page);
    await expect(page.getByRole("heading", { level: 1, name: "Freigaben" })).toBeVisible();
    for (const name of ["Schalter", "Ratgeber", "Produkttexte", "Hero-Fotos der Landingseiten", "Rechtstexte" /* Nr. 11: Kanzlei-Freigabe, vorher „Rechtsentwürfe“ */, "Gutschein und Atelierverkauf", "Schweiz-Hub"]) {
      await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
    }
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    expect(bad.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    const overflow = await measureOverflow(page);
    expect(overflow.sw, overflow.wide.join(" | ")).toBeLessThanOrEqual(overflow.vw + 1);
  });
});
