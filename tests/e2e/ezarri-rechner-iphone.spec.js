// tests/e2e/ezarri-rechner-iphone.spec.js – Team C auf iPhone 15 Pro (WebKit, für die
// ganze Datei; läuft im Projekt desktop, siehe playwright.config.js).
// Nie echt senden: /api/** (POST) wird abgefangen.
import { test, expect, devices } from "@playwright/test";
import { dismissCookieBanner, measureOverflow, settle } from "./helpers.js";

// Kein Querscroll der Seite. Scroll-Leisten (LocalNav, breite Tabelle in overflow-x-auto)
// zählen nicht: measureOverflow listet nur zur Diagnose.
// Dev-Server unter Last (mehrere Teams): Seite laden, bis 200 und H1 da sind.
// Cookie-Leiste vorab beantworten (nur notwendige), damit sie und das Dev-Overlay
// keine Klicks abfangen (Muster wie kuechenplaner-varianten-iphone.spec.js).
const consent = (origin) => ({ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: origin });

async function open(page, url) {
  await page.context().addCookies([consent(new URL(test.info().project.use.baseURL || "http://localhost:3000").origin)]);
  await expect(async () => {
    const res = await page.goto(url, { timeout: 120_000 });
    expect(res.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  }).toPass({ timeout: 360_000, intervals: [5_000, 10_000] });
}

async function noPageScroll(page) {
  const o = await measureOverflow(page);
  expect(o.sw, o.wide.join(" | ")).toBeLessThanOrEqual(o.vw);
}

test.use({ ...devices["iPhone 15 Pro"] });

test.describe("Ezarri Rechner, Custom Mix, Anfrage · iPhone (WebKit)", () => {
  test.describe.configure({ timeout: 480_000 });
  test("Rechner: Kurzleiste, Eingabe per Tastatur-Feld, kein Querscroll, Ziele ≥ 44 px", async ({ page }) => {
    await open(page, "/de/ezarri/rechner");
    await settle(page);
    await dismissCookieBanner(page);
    const leiste = page.getByText(/m²\s·\s\d+ Kartons$/);
    await expect(leiste).toBeVisible();
    await expect(leiste).toHaveText("106 m² · 53 Kartons");
    const breite = page.getByLabel(/^Breite/);
    await expect(breite).toHaveAttribute("inputmode", "decimal");
    await expect(async () => {
      await breite.fill("6");
      await expect(leiste).not.toHaveText("106 m² · 53 Kartons");
    }).toPass({ timeout: 240_000, intervals: [2_000, 5_000] });
    for (const label of ["Rechteck", "L-Form", "Rund oder oval", "Freie Form"]) {
      const box = await page.locator("label", { hasText: label }).first().boundingBox();
      expect(box.height, label).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole("link", { name: "Zum Ergebnis" }).click();
    await expect(page.locator("#rr-ergebnis")).toBeInViewport();
    await noPageScroll(page);
  });

  test("Custom Mix: Vorschau, Dialog bedienbar, kein Querscroll", async ({ page }) => {
    await open(page, "/de/ezarri/custom-mix");
    await settle(page);
    await dismissCookieBanner(page);
    await expect(page.locator("[data-mosaik-canvas]")).toBeVisible();
    const add = page.getByRole("button", { name: "Mosaik hinzufügen" });
    await expect(async () => {
      await add.click();
      await expect(page.getByRole("dialog", { name: "Mosaik wählen" })).toBeVisible();
    }).toPass({ timeout: 60_000 });
    const dialog = page.getByRole("dialog", { name: "Mosaik wählen" });
    await dialog.getByRole("combobox", { name: "Serie" }).selectOption("Lisa");
    await expect(dialog.getByRole("status")).toContainText("28 Mosaike");
    await dialog.getByRole("button", { name: "Schließen" }).first().click();
    await expect(dialog).toBeHidden();
    await noPageScroll(page);
  });

  test("Anfrage: Absenden abgefangen, Bestätigung inline", async ({ page }) => {
    const sent = [];
    await page.route("**/api/**", (route) => {
      if (route.request().method() === "GET") return route.continue();
      sent.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, dryRun: true }) });
    });
    await open(page, "/de/ezarri/anfrage?art=muster&ref=2512-c");
    await settle(page);
    await dismissCookieBanner(page);
    await page.getByLabel(/^Name/).fill("Test Person");
    await page.getByLabel(/^Telefon/).fill("+43 5574 00000");
    await page.getByRole("checkbox", { name: /kontaktieren/ }).check();
    await page.waitForTimeout(3100);
    await page.getByRole("button", { name: "Anfrage senden" }).click();
    await expect(page.getByText("Danke, Ihre Anfrage ist da.")).toBeVisible();
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ art: "muster", telefon: "+43 5574 00000", referenzen: ["2512-c"] });
    await noPageScroll(page);
  });
});
