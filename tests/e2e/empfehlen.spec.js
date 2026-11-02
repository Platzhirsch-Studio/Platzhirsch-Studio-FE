// tests/e2e/empfehlen.spec.js — Welle 2, Empfehlungsprogramm /[locale]/empfehlen.
// Formular-Sends werden IMMER abgefangen (page.route) – nie an das Backoffice.
//   PW_WORKERS=1 npx playwright test empfehlen.spec.js
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissCookies } from "./concierge-helpers.js";

async function mockKontakt(page) {
  const sent = [];
  await page.route("**/api/**", (route) => {
    const req = route.request();
    if (req.method() === "GET" || req.method() === "HEAD") return route.continue();
    const url = new URL(req.url());
    sent.push({ path: url.pathname, body: req.postDataJSON() });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
  });
  return sent;
}

test.describe("Empfehlen", () => {
  test("DE: Seite, noindex vor Freigabe, ein H1, Schritte, kein Feld für Dritte", async ({ page }) => {
    const res = await page.goto("/de/empfehlen");
    expect(res.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Empfehlen Sie uns weiter");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("heading", { name: "So funktioniert es" })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toHaveCount(2); // nur eigene Adressen (2 Formulare)
    await expect(page.locator('input[name*="freund" i], input[name*="friend" i]')).toHaveCount(0);
  });

  test("Empfohlene Person mit Code: Häkchen nicht vorangekreuzt, Code nur mit Einwilligung", async ({ page }) => {
    const sent = await mockKontakt(page);
    await page.goto("/de/empfehlen?code=emp-7k3m9q");
    await dismissCookies(page).catch(() => {});
    const form = page.locator('form[data-rolle="empfohlen"]');
    await expect(form.getByLabel(/Empfehlungscode/)).toHaveValue("EMP-7K3M9Q");
    const consent = form.getByRole("checkbox");
    await expect(consent).not.toBeChecked();
    await form.getByLabel(/^Name/).fill("Anna Muster");
    await form.getByLabel(/^E-Mail/).fill("anna@example.com");
    await form.getByLabel(/Worum geht es/).fill("Wohnzimmer neu einrichten mit Blick auf den See");
    await consent.check();
    await form.getByRole("button", { name: "Anfrage senden" }).click();
    await expect(page.getByText("Ihre Anfrage ist bei uns")).toBeVisible();
    expect(sent).toHaveLength(1);
    expect(sent[0].path).toBe("/api/kontakt");
    expect(sent[0].body.ihre_nachricht).toContain("Empfehlungscode: EMP-7K3M9Q");
    expect(sent[0].body.ihre_nachricht).toContain("Kontext: Empfehlungsprogramm · Empfohlen · Code EMP-7K3M9Q");
  });

  test("ohne Häkchen geht der Code nicht mit; Pflichtfelder mit Fehlerliste", async ({ page }) => {
    const sent = await mockKontakt(page);
    await page.goto("/de/empfehlen?code=EMP-7K3M9Q");
    await dismissCookies(page).catch(() => {});
    const form = page.locator('form[data-rolle="empfohlen"]');
    await form.getByRole("button", { name: "Anfrage senden" }).click();
    await expect(form.getByText("Bitte prüfen Sie Ihre Angaben")).toBeVisible();
    await expect(form.getByLabel(/^Name/)).toBeFocused();
    expect(sent).toHaveLength(0);
    await form.getByLabel(/^Name/).fill("Anna Muster");
    await form.getByLabel(/^E-Mail/).fill("anna@example.com");
    await form.getByLabel(/Worum geht es/).fill("Küche planen, Termin im Showroom");
    await form.getByRole("button", { name: "Anfrage senden" }).click();
    await expect(page.getByText("Ihre Anfrage ist bei uns")).toBeVisible();
    expect(sent[0].body.ihre_nachricht).not.toContain("EMP-7K3M9Q");
  });

  test("Teilen-Link wird im Browser gebaut, ohne Anfrage an den Server", async ({ page }) => {
    const sent = await mockKontakt(page);
    await page.goto("/de/empfehlen");
    await dismissCookies(page).catch(() => {});
    await page.getByLabel("Ihr Empfehlungscode").fill("7k3m9q");
    await page.getByRole("button", { name: "Link erzeugen" }).click();
    await expect(page.getByLabel("Ihr Link")).toHaveValue(/\/de\/empfehlen\?code=EMP-7K3M9Q$/);
    await expect(page.getByRole("link", { name: "Aus Ihrem Postfach senden" })).toHaveAttribute("href", /^mailto:\?subject=/);
    expect(sent).toHaveLength(0);
  });

  test("EN/FR/IT erreichbar, eigene Sprache", async ({ page }) => {
    for (const [l, h1] of [["en", "Recommend us"], ["fr", "Recommandez-nous"], ["it", "Consigliateci"]]) {
      const res = await page.goto(`/${l}/empfehlen`);
      expect(res.status(), l).toBe(200);
      await expect(page.locator("h1")).toHaveText(h1);
      await expect(page.locator("html")).toHaveAttribute("lang", new RegExp(`^${l}`));
    }
  });

  test("a11y: keine axe-Verstöße (WCAG 2.2 AA)", async ({ page }) => {
    await page.goto("/de/empfehlen?code=EMP-7K3M9Q");
    await dismissCookies(page).catch(() => {});
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).exclude("nextjs-portal").analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
