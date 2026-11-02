// Inhaber-Auftrag 31.10.2026: 8 Stellen auf der Karriereseite (src/lib/karriere/stellen.js).
// Dev-Server = Vorschau: alle 8 sichtbar, mit Sperr-Markierung (Entgelt fehlt,
// § 9 Abs 2 GlBG), Detailseiten noindex und ohne JobPosting. axe 0 (alle Stufen).
//   PW_WORKERS=1 npx playwright test tests/e2e/karriere-stellen.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissCookieBanner, settle } from "./helpers.js";

const PROD = /:3100/.test(process.env.BASE_URL || "") || process.env.npm_lifecycle_event === "test:e2e:prod";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const SHOTS = "qa-screenshots/karriere";
const DETAILS = [
  { slug: "cad-planer-in-m-w-d", h1: "CAD-Planer/in (m/w/d)" },
  { slug: "installateur-in-sanitaer-heizung-m-w-d", h1: "Installateur/in Sanitär/Heizung (m/w/d)" },
];

async function axe(page, testInfo) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
  await testInfo.attach("axe.json", { body: JSON.stringify(results.violations, null, 2), contentType: "application/json" });
  expect(results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

test.describe("Karriere: 8 Stellen", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Desktop-Projekt reicht");

  test("Liste: 8 Kacheln mit Titel, Bereich, Ort, Ausmaß und Sperr-Markierung", async ({ page }, testInfo) => {
    test.skip(PROD, "Produktion: gesperrte Stellen sind nicht sichtbar");
    await page.goto("/de/ueber-uns/karriere", { waitUntil: "load" });
    await settle(page);
    await dismissCookieBanner(page).catch(() => {});
    const tiles = page.locator('[data-testid="job-list"] > li');
    await expect(tiles).toHaveCount(8);
    for (const title of ["CAD-Planer/in (m/w/d)", "Innenarchitekt/in (m/w/d)", "Verkäufer/in Einrichtungsberatung (m/w/d)", "Monteur/in mit Tischlerlehre (m/w/d)", "Monteur/in (m/w/d)", "Fliesenleger/in (m/w/d)", "Installateur/in Sanitär/Heizung (m/w/d)", "Elektroplaner/in (m/w/d)"]) {
      await expect(page.getByRole("link", { name: title, exact: true })).toBeVisible();
    }
    const first = tiles.first();
    await expect(first).toContainText("Bereich:");
    await expect(first).toContainText("Lochau, Österreich");
    await expect(first).toContainText("Ausmaß:");
    await expect(page.locator('[data-blocked="true"]')).toHaveCount(8);
    await expect(first).toContainText("Gehaltsangabe fehlt – nicht veröffentlichbar");
    // Initiativbewerbung und Datenschutz-Hinweis bleiben.
    await expect(page.getByText("Bewerben Sie sich auf eine ausgeschriebene Stelle oder initiativ.")).toBeVisible();
    await expect(page.getByTestId("career-contact-person")).toHaveText("Ansprechperson: Harald Menghin");
    await expect(page.locator('main a[href="/de/datenschutz#bewerbungen"]')).toHaveCount(1);
    await page.screenshot({ path: `${SHOTS}/karriere-liste-desktop.png`, fullPage: true });
    await axe(page, testInfo);
  });

  test("Liste mobil (375 px): kein horizontales Scrollen", async ({ page }) => {
    test.skip(PROD, "Produktion: gesperrte Stellen sind nicht sichtbar");
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/de/ueber-uns/karriere", { waitUntil: "load" });
    await settle(page);
    await dismissCookieBanner(page).catch(() => {});
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `${SHOTS}/karriere-liste-mobil.png`, fullPage: true });
  });

  for (const { slug, h1 } of DETAILS) {
    test(`Detail ${slug}: Inhalt, Sperre, noindex, kein JobPosting, axe 0`, async ({ page }, testInfo) => {
      const res = await page.goto(`/de/ueber-uns/karriere/${slug}`, { waitUntil: "load" });
      if (PROD) {
        expect(res.status()).toBe(404);
        return;
      }
      expect(res.status()).toBe(200);
      await settle(page);
      await dismissCookieBanner(page).catch(() => {});
      await expect(page.locator("h1")).toHaveText(h1);
      const title = await page.title();
      expect(title.length).toBeLessThanOrEqual(60);
      await expect(page.locator('[data-testid="job-blocked"]')).toContainText("Gehaltsangabe fehlt – nicht veröffentlichbar");
      await expect(page.locator('[data-testid="job-blocked"]')).toContainText("[vom Inhaber ergänzen]");
      for (const heading of ["Ihre Aufgaben", "Ihr Profil", "Was wir bieten"]) {
        await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
      }
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(ld.join("\n")).not.toContain("JobPosting");
      await expect(page.locator('a[href^="mailto:info@platzhirsch.studio"]').first()).toBeVisible();
      await expect(page.getByTestId("job-contact-person")).toHaveText("Ansprechperson: Harald Menghin");
      await expect(page.locator("main")).toContainText(/Archicad und\/oder AutoCAD|Montageteam/);
      await expect(page.locator('main a[href="/de/datenschutz#bewerbungen"]')).toHaveCount(1);
      await page.screenshot({ path: `${SHOTS}/detail-${slug}.png`, fullPage: true });
      await axe(page, testInfo);
    });
  }

  test("Sitemap enthält keine gesperrte Stelle", async ({ request }) => {
    const xml = await (await request.get("/sitemap-static.xml")).text();
    expect(xml).not.toMatch(/karriere\/[a-z0-9-]*-m-w-d/);
  });
});
