// tests/e2e/rat95-t4.spec.js – Rat 9,5, Team T4 (Startseite, Kern-USP, Team/Harald-Slots).
//   PW_WORKERS=1 npx playwright test rat95-t4.spec.js --project=desktop
// A13 ph-wow-pause erst nach Nutzeraktion · A5 Team · B8 Arbeitsweise iPhone ·
// B14 Profilseite · B18 Fahrzeiten · axe auf den berührten Seiten.
import { test, expect, devices } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissCookieBanner } from "./helpers.js";

const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const { defaultBrowserType: _i, ...IPHONE } = devices["iPhone 15 Pro"];
const SLOW = { timeout: 180_000 };

test.describe("Rat 9,5 · T4", () => {
  test("A13: ohne Nutzeraktion kein sessionStorage-Eintrag ph-wow-pause, nach einer Aktion schon", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto("/de", { waitUntil: "load", ...SLOW });
    await page.waitForSelector("[data-wow-stage][data-wow-ready]", { state: "attached", ...SLOW });
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => sessionStorage.getItem("ph-wow-pause"))).toBeNull();
    // Neuladen ohne Aktion: weiterhin kein Eintrag
    await page.reload({ waitUntil: "load", ...SLOW });
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => sessionStorage.getItem("ph-wow-pause"))).toBeNull();
    await page.keyboard.press("Shift");
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ph-wow-pause"))).toBe("1");
    await context.close();
  });

  test("A5: Team – Harald-Kapitel über dem Raster, ein Kartenformat, axe 0", async ({ page }) => {
    await page.goto("/de/ueber-uns/team", SLOW);
    await dismissCookieBanner(page, 8000);
    const chapter = page.locator("[data-team-harald]");
    await expect(chapter.getByRole("heading", { level: 2, name: "Harald Menghin" })).toBeVisible();
    await expect(chapter.locator("img")).toHaveCount(0); // Porträt-Slot leer → unsichtbar
    await expect(chapter.locator('a[href="/de/ueber-uns/team/harald-menghin"]')).toBeVisible();
    const axe = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });

  // 31.10.2026 (bewusst geänderte Erwartung): Profil in allen vier Sprachen unter den übersetzten Pfaden.
  test("B14: Profilseite Harald – H1, Person ohne jobTitle, vier Sprachen, axe 0", async ({ page, request }) => {
    const res = await page.goto("/de/ueber-uns/team/harald-menghin", SLOW);
    expect(res.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "Harald Menghin" })).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const person = ld.map((s) => JSON.parse(s)).flatMap((d) => d["@graph"] || [d]).find((n) => n["@type"] === "Person");
    expect(person["@id"]).toBe("https://platzhirsch.studio/#person-harald-menghin");
    expect(person.jobTitle).toBeUndefined();
    expect(await page.locator("main img").count()).toBe(0);
    await dismissCookieBanner(page, 8000);
    const axe = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    const wrong = await request.get("/en/ueber-uns/team/harald-menghin", { maxRedirects: 0, ...SLOW });
    expect(wrong.status()).toBe(308);
    expect(wrong.headers().location).toMatch(/\/en\/about-us\/team\/harald-menghin$/);
    for (const [u, canonical] of [
      ["/en/about-us/team/harald-menghin", "https://platzhirsch.studio/en/about-us/team/harald-menghin"],
      ["/fr/a-propos/equipe/harald-menghin", "https://platzhirsch.studio/fr/a-propos/equipe/harald-menghin"],
      ["/it/chi-siamo/team/harald-menghin", "https://platzhirsch.studio/it/chi-siamo/team/harald-menghin"],
    ]) {
      const r = await request.get(u, SLOW);
      expect(r.status(), u).toBe(200);
      expect(await r.text(), u).toContain(`<link rel="canonical" href="${canonical}"/>`);
    }
  });

  // Design-Jury 30.10.2026 P1-4 (bewusst geänderte Erwartung): die H1 steht am Handy zuerst,
  // das Typo-Blatt folgt Lead und Knopf (vorher: über der H1 im ersten Bildschirm).
  test("B8: Arbeitsweise iPhone – H1 zuerst, Typo-Blatt nach dem Knopf, Schritt 05 als Beispiel beschriftet", async ({ browser }) => {
    const context = await browser.newContext(IPHONE);
    const page = await context.newPage();
    await page.goto("/de/arbeitsweise", SLOW);
    const sheet = await page.locator("[data-hero-sheet]").boundingBox();
    const h1 = await page.locator("h1").boundingBox();
    const btn = await page.locator("main").getByRole("link", { name: /Termin anfragen/ }).first().boundingBox();
    expect(h1.y + h1.height).toBeLessThanOrEqual(IPHONE.viewport.height);
    expect(sheet.y).toBeGreaterThan(h1.y + h1.height);
    expect(sheet.y).toBeGreaterThan(btn.y + btn.height - 1);
    expect(sheet.height).toBeLessThanOrEqual(IPHONE.viewport.height * 0.4);
    const beispiel = page.locator("[data-werkzeug-beispiel]");
    await expect(beispiel).toContainText("Beispiel aus unserem Küchenplaner, kein Kundenprojekt.");
    await expect(beispiel.locator("img")).toHaveAttribute("alt", /Grundriss einer Küche/);
    // Breadcrumb mobil einzeilig (C4)
    const crumbs = await page.locator('nav[aria-label] ol').first().boundingBox();
    expect(crumbs.height).toBeLessThan(50);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    await context.close();
  });

  test("B18: Startseite – Fahrzeiten „ca.“ mit Quelle unter der Karte, axe 0 im Kapitel", async ({ page }) => {
    await page.goto("/de", SLOW);
    const drive = page.locator("[data-drive-times]");
    await expect(drive).toContainText("Mit dem Auto ab Lochau, ca.");
    await expect(drive).toContainText(/Bregenz \d+ Min\./);
    await expect(page.locator("section[aria-labelledby=home-region-title] figcaption")).toContainText("OpenStreetMap-Mitwirkende");
    await dismissCookieBanner(page, 8000);
    const axe = await new AxeBuilder({ page }).include("section[aria-labelledby=home-region-title]").withTags(TAGS).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });

  test("axe 0 auf /de/arbeitsweise und /de/ueber-uns/platzhirsch (AboutPage-Schema)", async ({ page }) => {
    for (const url of ["/de/arbeitsweise", "/de/ueber-uns/platzhirsch"]) {
      await page.goto(url, SLOW);
      await dismissCookieBanner(page, 8000);
      const axe = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
      expect(axe.violations.map((v) => `${url} ${v.id}: ${v.nodes.length}`)).toEqual([]);
    }
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((s) => s.includes('"AboutPage"'))).toBe(true);
  });
});
