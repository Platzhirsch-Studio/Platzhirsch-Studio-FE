// tests/e2e/winterlager.spec.js – Service 3 „Winterlager und Pflege für Outdoor-Möbel“
// (/de|en/outdoor-winterservice). Anmeldung wird NIE abgeschickt (blockFormSends).
// Läuft im Projekt desktop; die mobilen Abläufe stehen in service-a11y.spec.js.
// Immer mit PW_WORKERS=1.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { blockFormSends, dismissCookieBanner, jsonLdNodes, measureOverflow, robotsDirectives } from "./helpers.js";

const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

test.describe("Outdoor-Winterservice", () => {
  test("DE/EN 200, FR/IT 404, noindex, hreflang de/en, JSON-LD ohne Preis", async ({ request }) => {
    for (const [path, status] of [["/de/outdoor-winterservice", 200], ["/en/outdoor-winterservice", 200], ["/fr/outdoor-winterservice", 404], ["/it/outdoor-winterservice", 404]]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(status);
    }
    const res = await request.get("/de/outdoor-winterservice");
    const text = await res.text();
    expect(robotsDirectives({ text, headers: res.headers() })).toContain("noindex");
    // Rat 9,5 C8 (T6, bewusst geändert): noindex-Seiten nennen keine Sprachversionen (kein hreflang).
    expect(text).not.toMatch(/<link rel="alternate" hrefLang=/);
    const types = jsonLdNodes(text).map((n) => n["@type"]);
    expect(types).toEqual(expect.arrayContaining(["WebPage", "Service", "BreadcrumbList"]));
    expect(JSON.stringify(jsonLdNodes(text))).not.toMatch(/"offers"|"price"/);
  });

  test("Seite: eine H1, Fakten nur belegt, Preise auf Anfrage, Quellen, axe ohne serious/critical", async ({ page }) => {
    await page.goto("/de/outdoor-winterservice");
    await dismissCookieBanner(page);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Ihre Outdoor-Möbel überwintern bei uns.");
    const facts = page.getByTestId("wl-facts");
    await expect(facts.locator("dt")).toHaveCount(4);
    await expect(facts).toContainText("Auf Anfrage");
    await expect(facts).not.toContainText("km");
    await expect(page.getByTestId("wl-countdown")).toHaveCount(0); // kein Anmeldeschluss gesetzt
    await expect(page.getByTestId("wl-steps").locator("li")).toHaveCount(7);
    for (const v of ["einmal", "abo"]) await expect(page.getByTestId(`wl-konditionen-${v}`).locator("dt")).toHaveCount(1);
    await expect(page.locator('a[href^="https://www.gloster.com/"]')).toHaveCount(6);
    await expect(page.locator("main img")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("€");
    const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
    const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });

  test("Anmeldung: leeres Absenden markiert Pflichtfelder, Positionen hinzufügen/entfernen, kein Request", async ({ page }) => {
    const blocked = await blockFormSends(page);
    await page.goto("/de/outdoor-winterservice#anmeldung");
    await dismissCookieBanner(page);
    const form = page.getByTestId("wl-form");
    await form.getByRole("button", { name: "Anmeldung senden" }).click();
    await expect(form.getByRole("status").first()).toContainText("Bitte prüfen Sie diese Angaben");
    for (const id of ["wl-row-0-type", "wl-row-0-material", "wl-zip", "wl-city", "wl-vorname", "wl-nachname", "wl-email"]) {
      await expect(form.locator(`#${id}`)).toHaveAttribute("aria-invalid", "true");
    }
    await expect(form.locator("#wl-telefon")).not.toHaveAttribute("aria-invalid", "true");
    await expect(form.locator("#wl-variant")).toBeFocused(); // erstes Pflichtfeld: Variante
    await form.getByRole("button", { name: "Weitere Position" }).click();
    await expect(form.locator("#wl-row-1-type")).toBeFocused();
    await form.getByRole("button", { name: "Position 2 entfernen" }).click();
    await expect(form.locator("#wl-row-1-type")).toHaveCount(0);
    await expect(form.getByLabel("Bitte auf Schäden prüfen, Kleinreparaturen nach Rücksprache")).not.toBeChecked();
    expect(blocked).toEqual([]);
  });

  test("EN-Texte, DE-only-Links mit hreflang, 375 px ohne Überlauf", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of ["/de/outdoor-winterservice", "/en/outdoor-winterservice"]) {
      await page.goto(path);
      const o = await measureOverflow(page);
      expect(o.sw, `${path}: ${o.wide.join("; ")}`).toBeLessThanOrEqual(o.vw);
    }
    await expect(page.locator("h1")).toHaveText("Your outdoor furniture spends the winter with us.");
    await expect(page.locator('a[href="/de/outdoor-gartenplanung"][hreflang="de"]')).toHaveCount(1);
  });
});
