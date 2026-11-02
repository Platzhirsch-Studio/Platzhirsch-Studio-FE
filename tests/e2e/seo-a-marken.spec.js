// SEO-Team A (AP-1/AP-7, 31.10.2026): Markenseiten mit eigenem Leitfaden
// (src/lib/content/brandGuides.js). Je Seite: H1 nach Plan, Abschnitt „Gut zu
// wissen“ im Server-HTML, genau ein FAQPage-Knoten mit sichtbaren Fragen,
// interne Links ohne Weiterleitung, axe (serious/critical) 0. Nur Desktop.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissCookieBanner, settle } from "./helpers.js";

const PAGES = [
  ["/de/ueber-uns/marken/minotti", /^Minotti Studio by Platzhirsch Home Living in Lochau/],
  ["/en/about-us/brands/minotti", /^Minotti Studio by Platzhirsch Home Living in Lochau/],
  ["/fr/a-propos/marques/minotti", /^Minotti Studio by Platzhirsch Home Living à Lochau/],
  ["/it/chi-siamo/marche/minotti", /^Minotti Studio by Platzhirsch Home Living a Lochau/],
  ["/de/ueber-uns/marken/rimadesio", /^Rimadesio bei Platzhirsch in Lochau/],
  ["/de/ueber-uns/marken/classicon", /^ClassiCon bei Platzhirsch in Lochau/],
];
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

for (const [path, h1] of PAGES) {
  test(`Markenleitfaden ${path}`, async ({ page, request }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "nur Desktop");
    test.setTimeout(240_000);
    const res = await page.goto(path, { waitUntil: "load", timeout: 180_000 });
    expect(res.status()).toBe(200);
    await settle(page);
    await expect(page.locator("h1#brand-title")).toHaveText(h1);
    await expect(page.locator("[data-brand-guide]")).toHaveCount(1);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faqs = ld.flatMap((s) => {
      const j = JSON.parse(s);
      return (j["@graph"] || [j]).filter((n) => n["@type"] === "FAQPage");
    });
    expect(faqs).toHaveLength(1);
    for (const q of faqs[0].mainEntity) await expect(page.getByText(q.name, { exact: true }).first()).toBeVisible();
    // Interne Links des Leitfadens antworten direkt (kein 308/404).
    const hrefs = await page.locator("[data-brand-guide] nav a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    expect(hrefs.length).toBeGreaterThan(2);
    for (const href of hrefs) {
      const r = await request.get(href, { maxRedirects: 0, timeout: 180_000 });
      expect(r.status(), href).toBe(200);
    }
    await dismissCookieBanner(page);
    const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
    const severe = results.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => ({ rule: v.id, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }));
    expect(severe).toEqual([]);
  });
}
