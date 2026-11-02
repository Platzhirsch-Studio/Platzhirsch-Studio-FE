// R7-P4 (Release-Rat R2, neuland P0-1/P1-5): Sofaplaner ohne Minotti-Zustimmung.
// Prüft: kein Minotti-Datensatz im HTML, in der Katalog-Route oder in geladenen
// Skripten; Hinweis „Konkrete Modelle zeigen wir Ihnen im Showroom“; ein Sofa
// (Silhouette) im ersten Bildschirm am Handy; neutraler Ablauf Typ → Ecke → Übersicht.
// Nichts wird gesendet (Teilen-Route abgefangen).
import { test, expect, devices } from "@playwright/test";
import { blockFormSends, dismissCookieBanner } from "./helpers.js";
import { MINOTTI_DATA_CONSENT, SOFA_FAMILY, collectSofaplanerErrors } from "./sofaplaner-errors.js";

const PAGE = "/de/sofaplaner";
const MINOTTI_RECORD = /minotti\.com\/(media|downloads)|internen Labs-Planer|CON83-|"slug":"connery"/i;

test.skip(MINOTTI_DATA_CONSENT, "Nur ohne Minotti-Zustimmung relevant");

test("kein Minotti-Datensatz in HTML, Katalog-Route und geladenen Skripten", async ({ page, request }) => {
  const scripts = [];
  page.on("response", async (r) => {
    if (r.request().resourceType() === "script" && r.ok()) scripts.push(await r.text().catch(() => ""));
  });
  const html = await (await request.get(PAGE)).text();
  expect(html).not.toMatch(MINOTTI_RECORD);
  expect(html).toContain("Konkrete Modelle zeigen wir Ihnen im Showroom");
  expect((await request.get("/de/sofaplaner/katalog/connery")).status()).toBe(404);
  const fam = await request.get(`/de/sofaplaner/katalog/${SOFA_FAMILY}`);
  expect(fam.status()).toBe(200);
  expect(await fam.text()).not.toMatch(/minotti/i);
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle").catch(() => {});
  for (const s of scripts) expect(s).not.toMatch(MINOTTI_RECORD);
});

test("neutraler Ablauf: Typ wählen → Ecke links → Übersicht ohne Konflikt", async ({ page }) => {
  const errors = collectSofaplanerErrors(page);
  await blockFormSends(page);
  await page.route("**/sofaplaner/teilen", (route) => (route.request().method() === "GET" ? route.continue() : route.fulfill({ status: 503, contentType: "application/json", body: "{}" })));
  await page.goto(PAGE);
  await dismissCookieBanner(page, 8_000);
  await page.locator("[data-hydrated=true]").waitFor({ timeout: 90_000 });
  await expect(page.locator("[data-model]")).toHaveCount(3);
  await expect(page.locator("[data-model] svg").first()).toBeVisible();
  await page.locator(`[data-model="${SOFA_FAMILY}"]`).click();
  await expect(page.getByRole("heading", { name: "Form wählen" })).toBeVisible({ timeout: 60_000 });
  await page.locator('[data-form="ecke-links"]').click();
  await expect(page.locator("aside").getByText(/^(Passt|\d+ Hinweise?)$/).first()).toBeVisible();
  await page.getByRole("navigation", { name: "Schritte" }).getByRole("button", { name: /Übersicht/ }).click();
  await expect(page.getByTestId("sp-klartext")).toContainText("Abschluss");
  await expect(page.locator("main")).not.toContainText("Minotti-Modell");
  expect(errors).toEqual([]);
});

const { defaultBrowserType: _b, ...PIXEL } = devices["Pixel 7"];
test.describe("Handy", () => {
  test.use(PIXEL);
  test("ein Sofa im ersten Bildschirm, kein Querscroll", async ({ page }) => {
    await page.goto(PAGE);
    const hero = page.locator("[data-sofa-hero] svg");
    await expect(hero).toBeVisible();
    const box = await hero.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize().height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
});
