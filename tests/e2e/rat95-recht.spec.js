// Rat 9,5 · T5 Recht: Kurzfassung der DSE (A16), DSE-Entwürfe nur im Testbetrieb (B4),
// Barrierefreiheit (B13), Presse/Partner/Karriere ohne Bilder ohne Rechte (B5),
// Cookie-Dialog nennt die Sprach-Speicher (A13).
//   PW_WORKERS=1 npx playwright test tests/e2e/rat95-recht.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { settle } from "./helpers.js";

const PROD = process.env.LEGAL_PREVIEW_EXPECT === "off" || /:3100/.test(process.env.BASE_URL || "");

test.describe("Rat 9,5 Recht", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Desktop-Projekt reicht");

  test("/en/datenschutz: H1 und Kurzfassung englisch, Volltext deutsch", async ({ page }) => {
    await page.goto("/en/datenschutz", { waitUntil: "load" });
    await settle(page);
    await expect(page.locator("h1")).toHaveText("Privacy policy");
    const summary = page.locator("[data-dse-summary=en]");
    await expect(summary.locator("[lang=en]")).toBeVisible();
    await expect(summary).toContainText("Österreichische Datenschutzbehörde");
    await expect(page.locator("[data-legal-body]")).toHaveAttribute("lang", "de");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://platzhirsch.studio/en/datenschutz");
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).exclude("nextjs-portal").analyze();
    expect(axe.violations.map((v) => v.id)).toEqual([]);
  });

  test("/de/datenschutz: Ergänzungen nur als Entwurf im Testbetrieb, in Produktion gar nicht", async ({ page }) => {
    await page.goto("/de/datenschutz", { waitUntil: "load" });
    const drafts = page.locator("[data-dse-draft]");
    if (PROD) {
      await expect(drafts).toHaveCount(0);
      await expect(page.locator("#whatsapp")).toHaveCount(0);
    } else {
      await expect(page.locator("#whatsapp")).toHaveCount(1);
      await expect(page.locator("#termin")).toHaveCount(1);
      expect(await drafts.count()).toBeGreaterThanOrEqual(8);
    }
    await expect(page.locator("[data-dse-summary]")).toHaveCount(0);
  });

  test("/de/barrierefreiheit: 200, Prüfangaben, Kontakt, keine Platzhalter", async ({ page }) => {
    const res = await page.goto("/de/barrierefreiheit", { waitUntil: "load" });
    expect(res.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Barrierefreiheit");
    for (const id of ["pruefung", "einschraenkungen", "barriere-melden", "marktueberwachung"]) await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect(page.locator("#pruefung + p")).toContainText("axe-core");
    await expect(page.locator("main")).not.toContainText("[");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  for (const p of ["/de/ueber-uns/presse", "/de/ueber-uns/partner", "/de/ueber-uns/karriere"]) {
    test(`${p}: keine Bilder ohne geklärte Rechte im Hauptteil`, async ({ page }) => {
      await page.goto(p, { waitUntil: "load" });
      const srcs = await page.locator("main img").evaluateAll((imgs) => imgs.map((i) => i.currentSrc || i.src));
      expect(srcs.filter((s) => /Presse|Partner|livingroom-view|unique-workplace|\/cms\/|\/cmx\//.test(decodeURIComponent(s)))).toEqual([]);
      const og = await page.locator('meta[property="og:image"]').first().getAttribute("content");
      expect(og).toMatch(/og-standard\.png|share-image/);
    });
  }

  test("Cookie-Dialog: Essenziell nennt cookieConsent, NEXT_LOCALE, preferredLocale", async ({ page }) => {
    await page.goto("/de/impressum", { waitUntil: "load" });
    await settle(page);
    await page.getByRole("button", { name: "Individuelle Einstellungen" }).first().click();
    const list = page.locator("[data-essential-storage]");
    await expect(list).toContainText("cookieConsent");
    await expect(list).toContainText("NEXT_LOCALE");
    await expect(list).toContainText("preferredLocale");
  });
});
