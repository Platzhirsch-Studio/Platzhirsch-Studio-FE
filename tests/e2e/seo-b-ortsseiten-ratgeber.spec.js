// SEO-Umsetzung B (31.10.2026): AP-3 Ortstexte und AP-6 Ratgeber-Entwürfe.
// Ortsseiten: Ortstext sichtbar, eigene Fragen im FAQPage-Schema, index.
// Ratgeber-Entwürfe: in dev 200 + noindex (in Produktion 404), kein Prüfmarker.
// axe (serious/critical) nach geschlossenem Cookie-Banner.
// Run: PW_WORKERS=1 npx playwright test tests/e2e/seo-b-ortsseiten-ratgeber.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissCookieBanner, jsonLdNodes, settle } from "./helpers.js";

const ORTE = {
  "/de/designermoebel-bregenz": "Gibt es in der Nähe von Bregenz ein Möbelhaus für Designermöbel?",
  "/de/designermoebel-dornbirn": "Ist Platzhirsch ein Möbelhaus für Dornbirn?",
  "/de/designermoebel-lindau": "Gibt es ein Möbelhaus für Designermöbel nahe Lindau?",
  "/de/designermoebel-st-gallen": "Lohnt sich die Fahrt von St. Gallen für Designermöbel?",
  "/de/designermoebel-konstanz": "Wo finde ich von Konstanz aus ein Möbelhaus mit Minotti?",
};
const RATGEBER = [
  "warum-sind-designermoebel-so-teuer",
  "quooker-kosten-strom-einbau",
  "bora-kochfeld-kosten",
  "sauna-zuhause-planen",
  "sofa-probesitzen-worauf-achten",
  "interior-designer-oder-innenarchitekt",
];
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

async function axeSevere(page) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
  return r.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => ({ rule: v.id, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }));
}

const faqQuestions = (html) =>
  jsonLdNodes(html)
    .filter((n) => n["@type"] === "FAQPage")
    .flatMap((n) => n.mainEntity.map((q) => q.name));

test.describe("AP-3 Ortsseiten", () => {
  for (const [path, question] of Object.entries(ORTE)) {
    test(`${path}: Ortstext, FAQ-Schema, index, axe`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "load" });
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).toMatch(/<meta name="robots" content="index, follow"/);
      expect(faqQuestions(html)).toContain(question);
      const section = page.locator("[data-ort-text]");
      await expect(section).toHaveCount(1);
      await expect(section.locator("h2")).toContainText("Möbel");
      expect(await section.locator("h3").count()).toBeGreaterThanOrEqual(3);
      expect(await section.locator("[data-ort-links] a").count()).toBeGreaterThanOrEqual(4);
      await dismissCookieBanner(page);
      await settle(page);
      expect(await axeSevere(page)).toEqual([]);
    });
  }
});

test.describe("AP-6 Ratgeber-Entwürfe", () => {
  for (const slug of RATGEBER) {
    test(`/de/ratgeber/${slug}: Entwurf noindex, kein Prüfmarker, axe`, async ({ page }) => {
      const res = await page.goto(`/de/ratgeber/${slug}`, { waitUntil: "load" });
      // Produktion: Entwürfe antworten 404 (RATGEBER_DRAFTS_VISIBLE).
      if (res.status() === 404) return;
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).toMatch(/<meta name="robots" content="noindex, follow"/);
      const text = await page.locator("main").innerText();
      expect(text).not.toMatch(/\[\s*prüfen|Prüfvermerk|binni/i);
      expect(faqQuestions(html).length).toBeGreaterThanOrEqual(3);
      await dismissCookieBanner(page);
      await settle(page);
      expect(await axeSevere(page)).toEqual([]);
    });
  }

  test("Sitemap und llms.txt enthalten keinen Entwurf", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap-static.xml")).text();
    const llms = await (await request.get("/llms.txt")).text();
    for (const slug of RATGEBER) {
      expect(sitemap).not.toContain(slug);
      expect(llms).not.toContain(slug);
    }
  });
});
