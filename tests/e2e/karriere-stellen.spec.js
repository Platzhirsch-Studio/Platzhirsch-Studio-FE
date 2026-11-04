// Inhaber-Auftrag 31.10.2026 / Entscheidung Nr. 47 (03.11.2026): 8 Stellen auf
// der Karriereseite (src/lib/karriere/stellen.js) mit KV-Mindestentgelt und
// Überzahlungshinweis (§ 9 Abs 2 GlBG) → veröffentlicht: keine Sperr-Markierung,
// Detailseiten indexierbar mit JobPosting (baseSalary), in der Sitemap. axe 0.
//   PW_WORKERS=1 npx playwright test tests/e2e/karriere-stellen.spec.js --project=desktop
// Screenshots: KARRIERE_SHOTS=<Ordner> (Standard qa-screenshots/karriere).
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissCookieBanner, settle } from "./helpers.js";

const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const SHOTS = process.env.KARRIERE_SHOTS || "qa-screenshots/karriere";
const ENTGELT = /Das kollektivvertragliche Mindestentgelt beträgt €\s?2\.\d{3},00 brutto pro Monat \(KV Handel .*\)\. Bereitschaft zur Überzahlung je nach Qualifikation und Erfahrung\./;
const DETAILS = [
  { slug: "cad-planer-in-m-w-d", h1: "CAD-Planer/in (m/w/d)", salary: 2535 },
  { slug: "installateur-in-sanitaer-heizung-m-w-d", h1: "Installateur/in Sanitär/Heizung (m/w/d)", salary: 2358 },
];
// Pixel 7: 412 × 915 CSS-px, DPR 2,625.
const PIXEL7 = { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true };

async function axe(page, testInfo) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
  await testInfo.attach("axe.json", { body: JSON.stringify(results.violations, null, 2), contentType: "application/json" });
  expect(results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

async function open(page, path) {
  const res = await page.goto(path, { waitUntil: "load" });
  await settle(page);
  await dismissCookieBanner(page).catch(() => {});
  return res;
}

test.describe("Karriere: 8 Stellen", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Desktop-Projekt reicht");

  test("Liste: 8 Kacheln mit Titel, Bereich, Ort, Ausmaß, ohne Sperr-Markierung", async ({ page }, testInfo) => {
    await open(page, "/de/ueber-uns/karriere");
    const tiles = page.locator('[data-testid="job-list"] > li');
    await expect(tiles).toHaveCount(8);
    for (const title of ["CAD-Planer/in (m/w/d)", "Innenarchitekt/in (m/w/d)", "Verkäufer/in Einrichtungsberatung (m/w/d)", "Monteur/in mit Tischlerlehre (m/w/d)", "Monteur/in (m/w/d)", "Fliesenleger/in (m/w/d)", "Installateur/in Sanitär/Heizung (m/w/d)", "Elektroplaner/in (m/w/d)"]) {
      await expect(page.getByRole("link", { name: title, exact: true })).toBeVisible();
    }
    const first = tiles.first();
    await expect(first).toContainText("Bereich:");
    await expect(first).toContainText("Lochau, Österreich");
    await expect(first).toContainText("Ausmaß:");
    await expect(first).toContainText("Vollzeit");
    await expect(page.locator('[data-testid="job-entgelt"]')).toHaveCount(8);
    await expect(first).toContainText(ENTGELT);
    await expect(page.locator('[data-blocked="true"]')).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText("nicht veröffentlichbar");
    await expect(page.locator("main")).not.toContainText("[vom Inhaber ergänzen]");
    // Initiativbewerbung und Datenschutz-Hinweis bleiben.
    await expect(page.getByText("Bewerben Sie sich auf eine ausgeschriebene Stelle oder initiativ.")).toBeVisible();
    await expect(page.getByTestId("career-contact-person")).toHaveText("Ansprechperson: Harald Menghin");
    await expect(page.locator('main a[href="/de/datenschutz#bewerbungen"]')).toHaveCount(1);
    await page.screenshot({ path: `${SHOTS}/karriere-liste-desktop.png`, fullPage: true });
    await axe(page, testInfo);
  });

  test("Liste Pixel 7: kein horizontales Scrollen", async ({ browser }) => {
    const context = await browser.newContext(PIXEL7);
    const page = await context.newPage();
    await open(page, "/de/ueber-uns/karriere");
    await expect(page.locator('[data-testid="job-list"] > li')).toHaveCount(8);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `${SHOTS}/karriere-liste-pixel7.png`, fullPage: true });
    await context.close();
  });

  for (const { slug, h1, salary } of DETAILS) {
    test(`Detail ${slug}: Entgelt-Satz, keine Sperre, index, JobPosting mit baseSalary, axe 0`, async ({ page }, testInfo) => {
      const res = await open(page, `/de/ueber-uns/karriere/${slug}`);
      expect(res.status()).toBe(200);
      await expect(page.locator("h1")).toHaveText(h1);
      const title = await page.title();
      expect(title.length).toBeLessThanOrEqual(60);
      await expect(page.locator('[data-testid="job-blocked"]')).toHaveCount(0);
      const main = page.locator("main");
      await expect(main).toContainText(ENTGELT);
      await expect(main).toContainText("Vollzeit");
      await expect(main).toContainText("ab sofort");
      await expect(main).not.toContainText("[vom Inhaber ergänzen]");
      for (const heading of ["Ihre Aufgaben", "Ihr Profil", "Was wir bieten"]) {
        await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
      }
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index/);
      await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute("content", /noindex/);
      const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
      expect(ld).toContain('"JobPosting"');
      expect(ld).toContain('"FULL_TIME"');
      expect(ld).toContain(`"value":${salary}`);
      expect(ld).toContain('"unitText":"MONTH"');
      expect(ld).toContain('"validThrough":"2027-01-02"');
      await expect(page.locator('a[href^="mailto:info@platzhirsch.studio"]').first()).toBeVisible();
      await expect(page.getByTestId("job-contact-person")).toHaveText("Ansprechperson: Harald Menghin");
      await expect(main).toContainText(/Archicad und\/oder AutoCAD|Montageteam/);
      await expect(page.locator('main a[href="/de/datenschutz#bewerbungen"]')).toHaveCount(1);
      await page.screenshot({ path: `${SHOTS}/detail-${slug}.png`, fullPage: true });
      await axe(page, testInfo);
    });
  }

  test("Detail Pixel 7: Entgelt-Satz sichtbar, kein horizontales Scrollen", async ({ browser }) => {
    const context = await browser.newContext(PIXEL7);
    const page = await context.newPage();
    await open(page, `/de/ueber-uns/karriere/${DETAILS[0].slug}`);
    await expect(page.locator("main")).toContainText(ENTGELT);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `${SHOTS}/detail-${DETAILS[0].slug}-pixel7.png`, fullPage: true });
    await context.close();
  });

  test("Sitemap enthält die veröffentlichten Stellen", async ({ request }) => {
    const xml = await (await request.get("/sitemap-static.xml")).text();
    expect(xml).toMatch(/karriere\/cad-planer-in-m-w-d/);
    expect(xml).toMatch(/karriere\/installateur-in-sanitaer-heizung-m-w-d/);
  });
});
