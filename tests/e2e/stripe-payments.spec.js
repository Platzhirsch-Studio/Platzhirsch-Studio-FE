// tests/e2e/stripe-payments.spec.js — Stripe-Vorbereitung im Dev-Server.
// Standard (keine Schlüssel, Bedingungen Entwurf): Kauf-APIs und Webhook 404,
// Erfolgs-/Abbruchseite noindex. Kaufstrecke im Entwicklungs-Mock
// (/de/gutscheine?zahlung=mock, Kopfzeile x-payments-mock: 1): Formular,
// nicht vorangekreuzte Checkbox, „Zahlungspflichtig kaufen“, simulierte
// Bezahlseite, Erfolgsseite.
//
// SAFETY: Nur die eigenen Mock-Endpunkte /api/payments/gutschein/checkout und
// /api/payments/mock dürfen POSTen (sie schreiben nur nach .data/payments/).
// Jeder andere Nicht-GET an /api/** wird mit 503 beantwortet – nichts
// erreicht das Backoffice oder Stripe.
// Der Mock-Teil läuft nur gegen den Dev-Server (NODE_ENV=development); gegen
// einen Produktions-Server ist er übersprungen (dort 404 by design).
//
// Run: PW_WORKERS=1 npx playwright test tests/e2e/stripe-payments.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissCookieBanner, measureOverflow, robotsDirectives, settle } from "./helpers.js";

const ALLOWED_POST = new Set(["/api/payments/gutschein/checkout", "/api/payments/mock"]);
// Dev-Server kompiliert beim ersten Aufruf und wartet auf das Backoffice.
const RT = 120_000;
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

async function guardSends(page) {
  const blocked = [];
  await page.route("**/api/**", (route) => {
    const req = route.request();
    const p = new URL(req.url()).pathname;
    if (req.method() === "GET" || req.method() === "HEAD" || ALLOWED_POST.has(p)) return route.continue();
    blocked.push(`${req.method()} ${p}`);
    return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, code: "blocked_by_test" }) });
  });
  return blocked;
}

test.describe("Stripe: Standard ohne Schlüssel", () => {
  test("Kauf-, Admin- und Webhook-Endpunkte → 404", async ({ request }) => {
    const probes = [
      ["POST", "/api/payments/gutschein/checkout", { website: "x" }],
      ["POST", "/api/stripe/webhook", {}],
      ["POST", "/api/payments/anzahlung", {}],
      ["GET", "/api/payments/anzahlung?id=AZ-AAAA-BBBB"],
      ["POST", "/api/payments/register", { aktion: "pruefen", code: "PH-2222-2222-2222-2222" }],
      ["POST", "/api/payments/link/AZ-AAAA-BBBB.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", {}],
    ];
    for (const [method, url, data] of probes) {
      const res = method === "GET" ? await request.get(url, { timeout: RT }) : await request.post(url, { data, headers: { "stripe-signature": "t=1,v1=x" }, timeout: RT });
      expect(res.status(), `${method} ${url}`).toBe(404);
    }
  });

  test("/de/gutscheine bleibt 404, /de/zahlung/* noindex", async ({ request }) => {
    expect((await request.get("/de/gutscheine", { maxRedirects: 0, timeout: RT })).status()).toBe(404);
    for (const path of ["/de/zahlung/erfolg", "/de/zahlung/abbruch?art=gutschein"]) {
      const res = await request.get(path, { timeout: RT });
      expect(res.status(), path).toBe(200);
      expect(robotsDirectives({ text: await res.text(), headers: res.headers() }), path).toContain("noindex");
    }
    expect((await request.get("/en/zahlung/erfolg", { timeout: RT })).status()).toBe(404);
    expect((await request.get("/de/zahlung/anzahlung/AZ-AAAA-BBBB.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", { timeout: RT })).status()).toBe(404);
    expect((await request.get("/de/zahlung/mock?session=cs_mock_000000000000000000000000", { timeout: RT })).status()).toBe(404);
  });
});

test.describe("Stripe: Kaufstrecke im Entwicklungs-Mock", () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.get("/de/gutscheine?zahlung=mock", { timeout: RT });
    test.skip(res.status() !== 200, "Mock nur im Dev-Server (NODE_ENV=development)");
  });

  test("Button-Lösung, Checkbox nicht vorangekreuzt, Pflichtangaben, Widerrufsbelehrung", async ({ page }) => {
    const blocked = await guardSends(page);
    await page.goto("/de/gutscheine?zahlung=mock");
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    const form = page.locator("#kaufen form").first();
    const buy = form.getByRole("button", { name: "Zahlungspflichtig kaufen" });
    await expect(buy).toBeVisible();
    const box = form.getByRole("checkbox", { name: /Gutscheinbedingungen/ });
    await expect(box).not.toBeChecked();
    await expect(form.getByRole("link", { name: "Widerrufsbelehrung" })).toHaveAttribute("href", "#widerrufsbelehrung");
    await expect(page.locator("#widerrufsbelehrung")).toContainText("Muster-Widerrufsformular");
    await expect(page.getByRole("link", { name: "Vertrag widerrufen" }).first()).toBeVisible();
    // USt-Zusatz hängt an VOUCHER_TAX (offen → neutral "Gesamtpreis", QA P2-3)
    await expect(form).toContainText("Gesamtpreis");
    await expect(form).toContainText("Rechnung");
    // ohne Bestätigung kein Kauf
    await form.getByLabel(/Seelicht/).check();
    await form.getByLabel("Ihr Name").fill("Test Person");
    await form.getByLabel(/E-Mail für den Gutschein/).fill("test@example.com");
    await buy.click();
    await expect(form).toContainText("Bitte bestätigen Sie die Gutscheinbedingungen");
    expect(blocked).toEqual([]);
    await expect(page).toHaveURL(/\/de\/gutscheine\?zahlung=mock/);
  });

  test("Mock-Checkout bis zur Erfolgsseite", async ({ page }) => {
    test.setTimeout(480_000);
    const blocked = await guardSends(page);
    await page.goto("/de/gutscheine?zahlung=mock");
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    const form = page.locator("#kaufen form").first();
    await form.getByLabel("250 €").check();
    await form.getByLabel("Stückzahl").fill("2");
    await expect(form).toContainText("500 €");
    await form.getByLabel(/Geweih/).check();
    await form.getByLabel("Name auf dem Gutschein").fill("Anna");
    await form.getByLabel("Ihr Name").fill("Test Person");
    await form.getByLabel(/E-Mail für den Gutschein/).fill("test@example.com");
    await form.getByRole("checkbox", { name: /Gutscheinbedingungen/ }).check();
    await page.waitForTimeout(3_100); // Zeitfalle des Formular-Vertrags
    await form.getByRole("button", { name: "Zahlungspflichtig kaufen" }).click();

    await page.waitForURL(/\/de\/zahlung\/mock\?session=cs_mock_/, { timeout: 170_000 });
    await expect(page.getByText("Bezahlseite (simuliert)")).toBeVisible();
    await expect(page.locator("body")).toContainText("500 €");
    await page.getByRole("button", { name: "Zahlung erfolgreich" }).click();

    await page.waitForURL(/\/de\/zahlung\/erfolg\?session_id=cs_mock_/, { timeout: 170_000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Danke, die Zahlung ist angekommen");
    await expect(page.locator("body")).toContainText("Testmodus");
    await expect(page.locator("body")).not.toContainText("test@example.com");
    expect(blocked).toEqual([]);
  });

  test("axe ohne serious/critical, kein horizontales Scrollen (375 px)", async ({ page }, testInfo) => {
    test.setTimeout(480_000);
    for (const url of ["/de/gutscheine?zahlung=mock", "/de/zahlung/erfolg", "/de/zahlung/widerruf?zahlung=mock"]) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(url);
      await settle(page);
      await dismissCookieBanner(page, 8_000);
      const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
      await testInfo.attach(`axe-${url.replace(/\W+/g, "_")}.json`, { body: JSON.stringify(results.violations, null, 2), contentType: "application/json" });
      const severe = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id);
      expect(severe, url).toEqual([]);
      await page.setViewportSize({ width: 375, height: 800 });
      const overflow = await measureOverflow(page);
      expect(overflow.sw, `${url} ${JSON.stringify(overflow.wide)}`).toBeLessThanOrEqual(overflow.vw);
    }
  });
});
