// tests/e2e/architekten.spec.js – Seite Architekten & Bauträger (Welle 2, QA-Nachbesserung).
// SICHERHEIT: jeder POST an /api/** wird abgefangen (blockFormSends), die
// Anfrage-Route per page.route beantwortet – nichts erreicht das Backoffice.
// Run: PW_WORKERS=1 npx playwright test tests/e2e/architekten.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { blockFormSends, dismissCookieBanner, jsonLdNodes, measureOverflow, settle } from "./helpers.js";

const OK = { success: true, message: "Form submitted successfully", data: {} };

async function open(page, url) {
  await blockFormSends(page);
  await page.goto(url);
  await settle(page);
  await dismissCookieBanner(page, 8_000);
}

test.describe("Architekten & Bauträger", () => {
  test("DE: Metadaten, hreflang de/en, JSON-LD WebPage + BreadcrumbList + FAQPage", async ({ request }) => {
    const res = await request.get("/de/architekten");
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/<meta name="robots" content="index, follow"/);
    expect(html).toContain('<link rel="canonical" href="https://platzhirsch.studio/de/architekten"/>');
    const alternates = (html.match(/<link rel="alternate"[^>]*>/g) || []).join(" ");
    expect(alternates).toContain('hrefLang="en" href="https://platzhirsch.studio/en/architekten"');
    // FR/IT seit 01.11.2026 eigene Seiten (src/lib/architekten/seo.js) – hreflang reziprok
    expect(alternates).toContain('hrefLang="fr" href="https://platzhirsch.studio/fr/architekten"');
    expect(alternates).toContain('hrefLang="it" href="https://platzhirsch.studio/it/architekten"');
    const nodes = jsonLdNodes(html);
    const types = nodes.map((n) => n["@type"]);
    for (const t of ["WebPage", "BreadcrumbList", "FAQPage"]) expect(types).toContain(t);
    const crumbs = nodes.find((n) => n["@type"] === "BreadcrumbList");
    expect(crumbs.itemListElement.map((i) => i.name)).toEqual(["Startseite", "Architekten und Bauträger"]);
  });

  test("Händler-Satz nur aus dem Claim-Register, keine Antwortfrist", async ({ request }) => {
    const de = await (await request.get("/de/architekten")).text();
    expect(de).toContain("Platzhirsch Home Living ist Vertragshändler von Ezarri.");
    expect(de).not.toMatch(/Ezarri-Vertragshändler|offizielle[rn]? .*Händler|Antwort an Werktagen/);
    const en = await (await request.get("/en/architekten")).text();
    expect(en).toContain("Platzhirsch Home Living is an Ezarri dealer.");
    expect(en).not.toMatch(/authorised Ezarri dealer|on working days/);
  });

  // Sprach-Integration 01.11.2026 (bewusst geändert): FR/IT sind eigene Seiten.
  test("FR/IT: eigene Seite (200, lang)", async ({ request }) => {
    for (const loc of ["fr", "it"]) {
      const res = await request.get(`/${loc}/architekten`, { maxRedirects: 0 });
      expect(res.status(), `/${loc}/architekten`).toBe(200);
      expect(await res.text()).toMatch(new RegExp(`<html[^>]*\\blang="${loc}"`));
    }
  });

  // Rat 9,5 B10 (bewusst geändert): das Anliegen ist freiwillig (Details), erstes Pflichtfeld ist das Büro.
  test("Leeres Absenden: Fokus auf dem ersten Fehler", async ({ page }) => {
    await open(page, "/de/architekten#anfrage");
    await page.getByRole("button", { name: "Anfrage senden" }).click();
    await expect(page.locator("#arch-buero")).toBeFocused();
  });

  test("?anliegen=staging wählt Home-Staging vor; Anfrage geht über den Lead-Weg (abgefangen)", async ({ page }) => {
    await open(page, "/de/architekten?anliegen=staging");
    await expect(page.getByLabel("Home-Staging auf Zeit")).toBeChecked();
    const sent = [];
    await page.route("**/api/beratung_anfrage", (route) => {
      if (route.request().method() !== "POST") return route.continue();
      sent.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(OK) });
    });
    await page.getByLabel("Stoffmuster für Polster").check();
    await page.locator("#arch-projektart").selectOption({ index: 2 });
    await page.locator("#arch-phase").selectOption({ index: 6 });
    await page.locator("#arch-bedarf").fill("Musterwohnung für den Verkauf einrichten");
    // B10: Büro, Name (ein Feld), E-Mail und Vorhaben sind die vier Pflichtfelder
    await page.locator("#arch-buero").fill("Bauträger Test GmbH");
    await page.locator("#arch-name").fill("Erika Test");
    await page.locator("#arch-email").fill("erika@example.com");
    await page.getByRole("button", { name: "Anfrage senden" }).click();
    await expect.poll(() => sent.length).toBe(1);
    expect(sent[0].bei_meiner_anfrage_geht_es_um).toBe("Home-Staging auf Zeit");
    expect(sent[0].bitte_beschreiben_sie_ihr_vorhaben).toContain("Musterwunsch: Stoffmuster für Polster");
    expect(sent[0].vorname).toBe("Erika");
    expect(sent[0].nachname).toBe("Test");
  });

  for (const locale of ["de", "en"]) {
    test(`${locale}: axe WCAG 2.2 AA ohne serious/critical, 375 px ohne Überlauf`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await open(page, `/${locale}/architekten`);
      const overflow = await measureOverflow(page);
      expect(overflow.sw).toBeLessThanOrEqual(overflow.vw + 1);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).include("main").analyze();
      const severe = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(severe.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
