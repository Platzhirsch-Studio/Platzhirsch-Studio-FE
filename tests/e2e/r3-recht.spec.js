// R3-recht-vorschau: legal draft previews /de/preview/recht/*.
// Against the dev server: 200, noindex, one H1, visible open points, table of
// contents anchors, axe (WCAG 2.2 AA) without serious/critical findings.
// Against a production server without LEGAL_PREVIEW=1 (BASE_URL=…:3100):
// every preview URL answers 404 with noindex. Never in any sitemap.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const DOCS = ["datenschutz", "impressum", "agb", "barrierefreiheit"];
const PROD = process.env.LEGAL_PREVIEW_EXPECT === "off";

test.describe("Rechtstexte-Vorschau", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "desktop project is enough");

  for (const slug of DOCS) {
    test(`${slug}: ${PROD ? "404 in production" : "renders noindex with open points"}`, async ({ page }) => {
      const res = await page.goto(`/de/preview/recht/${slug}`);
      const robots = await page.locator('meta[name="robots"]').first().getAttribute("content");
      expect(robots).toContain("noindex");
      if (PROD) {
        expect(res.status()).toBe(404);
        return;
      }
      expect(res.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(await page.locator("main [data-open-point]").count()).toBeGreaterThan(0);
      await expect(page.getByText("[anwaltlich prüfen]").first()).toBeVisible();
      // one counting rule everywhere (QM P2): box total = sum of section badges
      // = marks in the text (outermost brackets only) = entries of the final list
      const counts = await page.evaluate(() => {
        const text = [...document.querySelectorAll("article [data-open-point]")].filter((m) => !m.closest("#offene-stellen"));
        const badges = [...document.querySelectorAll('[data-status="offen"]')].reduce((n, b) => n + Number(b.textContent.match(/· (\d+)/)[1]), 0);
        const box = Number(document.querySelector("#pruefhinweis-titel").parentElement.querySelector("dd").textContent);
        const list = document.querySelectorAll("#offene-stellen > ol > li > ul > li").length;
        const nestedMarks = text.filter((m) => m.parentElement.closest("[data-open-point]")).length;
        return { box, badges, text: text.length, list, nestedMarks, inList: document.querySelectorAll("#offene-stellen [data-open-point]").length };
      });
      expect(counts.badges, JSON.stringify(counts)).toBe(counts.box);
      expect(counts.text, JSON.stringify(counts)).toBe(counts.box);
      expect(counts.list, JSON.stringify(counts)).toBe(counts.box);
      expect(counts.nestedMarks).toBe(0);
      expect(counts.inList).toBe(0);
      // every TOC anchor has a target
      const hrefs = await page.locator('nav[aria-label="Inhalt"] a').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
      for (const h of hrefs) expect(await page.locator(h).count(), h).toBe(1);
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).exclude("nextjs-portal").analyze();
      const severe = axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(severe.map((v) => v.id)).toEqual([]);
    });
  }

  test("other locales and unknown documents are 404", async ({ request }) => {
    expect((await request.get("/en/preview/recht/agb")).status()).toBe(404);
    expect((await request.get("/de/preview/recht/unbekannt")).status()).toBe(404);
  });

  test("not in any sitemap", async ({ request }) => {
    for (const map of ["/sitemap.xml", "/sitemap-static.xml"]) {
      const body = await (await request.get(map)).text();
      expect(body).not.toContain("/preview/");
    }
  });

  test("Datenschutz names the five known errors and the new sections", async ({ page }) => {
    test.skip(PROD, "dev only");
    await page.goto("/de/preview/recht/datenschutz");
    await expect(page.locator("#pruefhinweis-titel").locator("..").locator("..").getByText(/Privacy Shield/).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /5 bekannten Fehler/ })).toBeVisible();
    for (const id of ["kundenportal", "upload", "online-planer", "ki-concierge"]) await expect(page.locator(`#${id}`)).toHaveCount(1);
  });
});
