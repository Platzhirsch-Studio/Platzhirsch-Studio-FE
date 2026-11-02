// Küchenplaner Varianten A/B – iPhone 15 Pro (WebKit), Fix 3 (QA Feinschliff P3-8).
// Analog labs-kuechenplaner-pro-iphone.spec.js: läuft im desktop-Projekt, WebKit und
// Gerät gelten für die ganze Datei. Sendet nie etwas.
import { test, expect, devices } from "@playwright/test";

const PAGE = "/de/kuechenplaner";
const consent = (origin) => ({ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: origin });
test.use({ ...devices["iPhone 15 Pro"], browserName: "webkit" });

async function open(page, query = "") {
  const origin = new URL(test.info().project.use.baseURL || "http://localhost:3000").origin;
  await page.context().addCookies([consent(origin)]);
  await page.route("**/api/**", (route) => (route.request().method() === "GET" ? route.continue() : route.abort()));
  await page.goto(`${PAGE}${query}`, { waitUntil: "domcontentloaded", timeout: 170_000 });
  await expect(page.locator("h1")).toBeVisible({ timeout: 300_000 });
  if (!query) await expect(page.getByRole("button", { name: "3D-Ansicht laden" }).first()).toBeVisible({ timeout: 300_000 });
}
async function tab(page, name) {
  const t = page.getByRole("tab", { name }).first();
  await expect(async () => {
    await t.tap();
    await expect(t).toHaveAttribute("aria-selected", "true", { timeout: 2000 });
  }).toPass({ timeout: 180_000 });
}

test.describe("Küchenplaner Varianten – iPhone (WebKit)", () => {
  test.setTimeout(480_000);
  test("A merken, U-Form, A öffnen merkt B, Tauschen, Reload behält beide", async ({ page }) => {
    await open(page);
    await tab(page, "Ergebnis");
    const cmp = page.locator("[data-kp-compare]:not([data-kp-compare-pending])");
    await expect(cmp).toBeVisible({ timeout: 180_000 });
    const share = await page.evaluate(() => document.querySelector("[data-kp-root] > div.sticky").getBoundingClientRect().height / window.innerHeight);
    expect(share).toBeLessThanOrEqual(0.25);
    await cmp.getByRole("button", { name: "Aktuelle als A merken" }).tap();
    await expect(cmp.locator('[data-kp-variant="b"]')).toContainText("Aktuelle Planung");
    await tab(page, "Raum");
    await page.getByRole("button", { name: /^U-Form/ }).tap();
    await tab(page, "Ergebnis");
    await expect(cmp.locator('[data-kp-row="shape"]')).toHaveAttribute("data-diff", "1");
    await cmp.getByRole("button", { name: "Variante A im Planer öffnen" }).tap();
    await expect(cmp.getByRole("status")).toContainText("als B gemerkt");
    await expect(cmp.getByRole("button", { name: "Tauschen" })).toBeVisible();
    await cmp.getByRole("button", { name: "Tauschen" }).tap();
    await expect(cmp.locator('[data-kp-row="shape"] td').first()).toContainText("U-Form");
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over).toBeLessThanOrEqual(1);

    // Reload direkt im Reiter Ergebnis: Platzhalter statt „Noch leer“, dann beide Merkplätze mit Datum
    await page.reload({ waitUntil: "domcontentloaded", timeout: 170_000 });
    await expect(cmp.locator('[data-kp-variant="a"]')).toContainText(/Variante A · \d/, { timeout: 300_000 });
    await expect(cmp.locator('[data-kp-variant="b"]')).toContainText(/Variante B · \d/);
    await expect(cmp).not.toContainText("Noch leer");
    await cmp.screenshot({ path: test.info().outputPath("varianten-iphone.png") });
  });
});
