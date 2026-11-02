// SEO-Team A (GEO W2/W5, 31.10.2026): FAQ-Blöcke und „Auf einen Blick“.
// Je Seite: genau ein FAQPage-Knoten, Fragen sichtbar, axe (serious/critical) 0
// nach Schließen des Cookie-Banners. Läuft nur im Desktop-Projekt.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissCookieBanner, settle } from "./helpers.js";

const PAGES = ["/de/bad-wellness", "/de/kuechengeraete", "/de/beratung", "/de/ueber-uns/platzhirsch", "/fr/a-propos/platzhirsch", "/it/bad-wellness"];
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

for (const path of PAGES) {
  test(`FAQ + axe ${path}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "nur Desktop");
    const res = await page.goto(path, { waitUntil: "load" });
    expect(res.status()).toBe(200);
    await settle(page);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faqs = ld.flatMap((s) => {
      const j = JSON.parse(s);
      return (j["@graph"] || [j]).filter((n) => n["@type"] === "FAQPage");
    });
    expect(faqs).toHaveLength(1);
    for (const q of faqs[0].mainEntity) await expect(page.getByText(q.name, { exact: true }).first()).toBeVisible();
    if (path.includes("platzhirsch")) await expect(page.locator("[data-about-facts] dl > div")).toHaveCount(9);
    await dismissCookieBanner(page);
    const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
    const severe = results.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => ({ rule: v.id, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }));
    expect(severe).toEqual([]);
  });
}
