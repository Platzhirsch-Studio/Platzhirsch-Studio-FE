// tests/e2e/r5-commerce.spec.js — R5-commerce (AP9 hinter Schalter).
// Standard VOUCHER_MODE=off / ATELIER_MODE=off: Seiten und APIs 404,
// Vorschau /de/preview/commerce noindex mit Entwurfs-Banner, Formulare in der
// Vorschau senden nichts, axe ohne serious/critical, kein horizontales Scrollen.
//
// SAFETY: blockFormSends() beantwortet jede Nicht-GET-Anfrage an /api/** mit
// 503 – NICHTS erreicht das Backoffice. Die Vorschau-Formulare senden ohnehin
// nicht (demo); der Test prüft das zusätzlich.
//
// Run: npx playwright test tests/e2e/r5-commerce.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { blockFormSends, dismissCookieBanner, measureOverflow, robotsDirectives, settle } from "./helpers.js";

const OFF_PAGES = ["/de/gutscheine", "/de/gutscheinbedingungen", "/de/atelierverkauf", "/de/atelierverkauf/irgendein-stueck", "/en/gutscheine"];
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

test.describe("Schalter off (Standard)", () => {
  for (const path of OFF_PAGES) {
    test(`${path} → 404`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(404);
    });
  }

  test("APIs → 404 für POST und GET, ohne Weiterleitung", async ({ request }) => {
    for (const api of ["/api/gutschein_anfrage", "/api/atelier_reservierung"]) {
      // Ungültiger Body mit Honeypot: selbst wenn der Schalter an wäre, ginge nichts weiter.
      const post = await request.post(api, { data: { website: "test", betrag: 1 } });
      expect(post.status(), api).toBe(404);
      const get = await request.get(api);
      expect(get.status(), api).toBe(404);
    }
  });

  test("Sitemap und llms.txt nennen keine Commerce-Seite", async ({ request }) => {
    for (const path of ["/sitemap.xml", "/llms.txt"]) {
      const res = await request.get(path);
      if (!res.ok()) continue;
      expect(await res.text(), path).not.toMatch(/gutschein|atelierverkauf/i);
    }
  });
});

test.describe("Vorschau /de/preview/commerce", () => {
  test("noindex, Banner, beide Strecken, Leerzustand ohne Beispielstücke", async ({ request }) => {
    const res = await request.get("/de/preview/commerce");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(robotsDirectives({ text, headers: res.headers() })).toContain("noindex");
    expect(text).toContain("Entwurf, Freigabe Insolvenzrechtler/Steuerberater offen");
    expect(text).toContain("Gutschein anfragen");
    expect(text).toContain("Gutscheinbedingungen");
    expect(text).toContain("[anwaltlich prüfen");
    expect(text).toContain("Ausstellungsstücke aus unserem Showroom");
    expect(text).not.toMatch(/abgesichert|statt\s+\d|bis zu \d+\s*%/i);
    expect(text).not.toMatch(/Testsofa|Testmarke/);
  });

  test("Gutschein-Formular: Fehler am Feld, Demo-Bestätigung ohne Zahlungsversprechen, nichts gesendet", async ({ page }) => {
    const blocked = await blockFormSends(page);
    await page.goto("/de/preview/commerce");
    await settle(page);
    await dismissCookieBanner(page, 8_000);

    const form = page.locator("#gutscheine form");
    await form.getByRole("button", { name: "Gutschein anfragen" }).click();
    await expect(form.getByRole("status").first()).toContainText("Bitte prüfen Sie Ihre Angaben");

    await form.getByLabel("Eigener Betrag", { exact: true }).check();
    await form.getByLabel(/Eigener Betrag in Euro/).fill("20");
    await form.getByRole("button", { name: "Gutschein anfragen" }).click();
    await expect(form).toContainText("Der Betrag beginnt bei 25 €.");
    await form.getByLabel(/Eigener Betrag in Euro/).fill("150");
    await form.getByLabel(/Seelicht/).check();
    await form.getByLabel(/Ihr Name/).fill("Test Person");
    await form.getByLabel(/E-Mail/).fill("test@example.com");
    // Zeitfalle des Formular-Vertrags (3 s) wie bei echten Besuchern.
    await page.waitForTimeout(3_100);
    await form.getByRole("button", { name: "Gutschein anfragen" }).click();

    const success = page.locator("#gutscheine").getByText("Vorschau: so sieht die Bestätigung aus");
    await expect(success).toBeVisible();
    const box = page.locator("#gutscheine [role=status][tabindex='-1']");
    await expect(box).toContainText("nichts bestellt und nichts zu bezahlen");
    await expect(box).not.toContainText(/Rechnung|abgesichert|innerhalb von/);
    expect(blocked).toEqual([]);
  });

  test("Reservierungsanfrage in der Vorschau sendet nichts", async ({ page }) => {
    const blocked = await blockFormSends(page);
    await page.goto("/de/preview/commerce#atelier");
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    const form = page.locator("#atelier form");
    await form.getByLabel(/Abholung im Showroom Lochau/).check();
    await form.getByLabel(/Ihr Name/).fill("Test Person");
    await form.getByLabel(/E-Mail/).fill("test@example.com");
    await page.waitForTimeout(3_100);
    await form.getByRole("button", { name: "Reservierung anfragen" }).click();
    await expect(page.locator("#atelier")).toContainText("noch nicht reserviert, und es ist nichts zu bezahlen");
    expect(blocked).toEqual([]);
  });

  test("axe ohne serious/critical und kein horizontales Scrollen", async ({ page }, testInfo) => {
    await page.goto("/de/preview/commerce");
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
    await testInfo.attach("axe-violations.json", { body: JSON.stringify(results.violations, null, 2), contentType: "application/json" });
    const severe = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id);
    expect(severe).toEqual([]);
    await page.setViewportSize({ width: 375, height: 800 });
    const overflow = await measureOverflow(page);
    expect(overflow.sw, JSON.stringify(overflow.wide)).toBeLessThanOrEqual(overflow.vw);
  });
});
