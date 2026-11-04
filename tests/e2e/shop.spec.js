// tests/e2e/shop.spec.js — Onlineshop Accessoire-Welt im TESTMODUS (Nr. 29).
// Läuft gegen den Entwicklungsserver (SHOP_MODE Standard "test", ohne
// Stripe-/LetMeShip-Schlüssel → beide Mocks). NIE echte Zahlung, nie Mails.
//   PW_WORKERS=1 npx playwright test shop.spec.js --project=desktop
// Screenshots: qa-screenshots/shop/*.png
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissCookieBanner, measureOverflow, settle } from "./helpers.js";

const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const SHOT = (n) => `qa-screenshots/shop/${n}.png`;

test.describe.configure({ mode: "serial" });

async function addTestItem(page, slug) {
  await page.goto("/de/shop/testartikel");
  await settle(page);
  await dismissCookieBanner(page, 8_000);
  const card = page.locator(`[data-shop-testartikel="${slug}"]`);
  await expect(card).toBeVisible();
  return card;
}

test("Warenkorb → Versand (LetMeShip-Mock, versichert) → Stripe-Mock → Bestätigung mit Tracking", async ({ page }) => {
  test.setTimeout(480_000);
  const card = await addTestItem(page, "testartikel-glas");
  await page.screenshot({ path: SHOT("01-testartikel"), fullPage: true });
  await card.locator("[data-shop-in-warenkorb]").click();
  // Mini-Warenkorb (modales <dialog>): Artikel + Zwischensumme, dann „Zur Kasse“.
  const drawer = page.locator("dialog[data-shop-minicart][open]");
  await expect(drawer.locator('[data-shop-minicart-zeile="testartikel-glas"]')).toContainText(/€\s?12(,00)?/, { timeout: 30_000 }); // QM-Endabnahme: ganze Euro ohne „,00“ (bewusst geändert)
  await expect(drawer.locator("[data-shop-minicart-summe]")).toHaveAttribute("data-shop-minicart-summe", "1200");
  await drawer.locator("[data-shop-zum-warenkorb]").click();
  await page.waitForURL(/\/de\/shop\/warenkorb/);
  await expect(page.locator("[data-shop-testmodus]")).toBeVisible();
  await expect(page.locator('[data-shop-zeile="testartikel-glas"]')).toBeVisible({ timeout: 30_000 });
  await page.locator("[data-shop-menge]").fill("2");
  await expect(page.locator('[data-shop-zeile="testartikel-glas"]')).toContainText(/€\s?24(,00)?/); // QM-Endabnahme: ganze Euro ohne „,00“

  await page.getByRole("textbox", { name: "Straße", exact: true }).fill("Testgasse");
  await page.getByRole("textbox", { name: "Hausnummer", exact: true }).fill("1");
  await page.getByRole("textbox", { name: "PLZ", exact: true }).fill("6900");
  await page.getByRole("textbox", { name: "Ort", exact: true }).fill("Bregenz");
  // QM-Endabnahme 02.11.2026 (bewusst geändert, Optik-QA r3): Versand rechnet automatisch, sobald die Adresse
  // vollständig ist; der Knopf erscheint nur noch als Rückfall nach einem Fehler.
  await page.getByRole("textbox", { name: "Ort", exact: true }).blur();
  const fallback = page.locator("[data-shop-versand-berechnen]");
  if (await fallback.isVisible().catch(() => false)) await fallback.click();
  const versand = page.locator("[data-shop-versand]");
  await expect(versand).toBeVisible({ timeout: 30_000 });
  await expect(versand).toContainText("versichert");
  await expect(versand).toContainText("MOCK");
  const versandCent = Number(await versand.getAttribute("data-shop-versand"));
  await expect(page.locator("[data-shop-summe-gesamt]")).toHaveAttribute("data-shop-summe-gesamt", String(2400 + versandCent));

  await page.getByRole("textbox", { name: "Vor- und Nachname", exact: true }).fill("Test Kundin");
  await page.getByRole("textbox", { name: "E-Mail", exact: true }).fill("kundin@example.invalid");
  // 03.11.2026 (Nr. 46): Rechtstexte freigegeben → AGB als Link ohne Marker; Gewährleistungs-Mitteilung vor dem Bestellknopf.
  await expect(page.locator('[data-shop-recht-slot="agb"] a')).toBeVisible();
  await expect(page.locator('[data-shop-recht-slot="agb"]')).not.toContainText(/Entwurf|Angabe wird ergänzt/);
  await expect(page.locator("[data-shop-gewaehrleistung]")).toContainText("Gesetzliche Gewährleistung");
  await page.screenshot({ path: SHOT("02-warenkorb-versand"), fullPage: true });
  await page.waitForTimeout(3_200); // Zeitfalle des Formular-Schutzes (≥ 3 s)
  const buy = page.getByRole("button", { name: "Zahlungspflichtig bestellen" });
  await buy.click();
  await page.waitForURL(/\/de\/zahlung\/mock\?session=cs_mock_/, { timeout: 120_000 });
  await expect(page.locator("body")).toContainText("es fließt kein Geld");
  await expect(page.locator("body")).toContainText("Versand AT (versichert)");
  await page.screenshot({ path: SHOT("03-stripe-mock"), fullPage: true });
  await page.getByRole("button", { name: "Zahlung erfolgreich" }).click();
  await page.waitForURL(/\/de\/shop\/bestellung\?b=PH-S-/, { timeout: 120_000 });
  await expect(page.locator("[data-shop-status]")).toHaveAttribute("data-shop-status", "versandbereit");
  await expect(page.locator("[data-shop-gesamt]")).toHaveAttribute("data-shop-gesamt", String(2400 + versandCent));
  await expect(page.locator("[data-shop-tracking]")).toContainText("MOCK");
  await page.screenshot({ path: SHOT("04-bestaetigung"), fullPage: true });
});

test("Reservieren & im Showroom abholen: ohne Zahlung, ohne Versand", async ({ page }) => {
  test.setTimeout(300_000);
  const card = await addTestItem(page, "testartikel-kerze");
  await card.locator("[data-shop-variante]").selectOption("gross");
  await card.locator("[data-shop-reservieren]").click();
  await page.waitForURL(/\/de\/shop\/warenkorb\?lieferart=abholung&zahlung=vorort/);
  await expect(page.locator('[data-shop-zeile="testartikel-kerze"]')).toContainText("25,50", { timeout: 30_000 });
  await expect(page.locator('[data-shop-lieferart="abholung"]')).toBeChecked();
  await page.getByRole("textbox", { name: "Vor- und Nachname", exact: true }).fill("Test Kunde");
  await page.getByRole("textbox", { name: "E-Mail", exact: true }).fill("kunde@example.invalid");
  await page.screenshot({ path: SHOT("05-reservierung"), fullPage: true });
  await page.waitForTimeout(3_200);
  await page.getByRole("button", { name: "Zahlungspflichtig bestellen" }).click();
  await page.waitForURL(/\/de\/shop\/bestellung\?b=PH-S-/, { timeout: 60_000 });
  await expect(page.locator("[data-shop-status]")).toHaveAttribute("data-shop-status", "reserviert");
  await expect(page.locator("[data-shop-tracking]")).toHaveCount(0);
  await page.screenshot({ path: SHOT("06-reservierung-bestaetigt"), fullPage: true });
});

test("Manipulationsschutz: Client-Preise werden ignoriert, falsche Summe → 409, CH → 422", async ({ request }) => {
  const cart = [{ slug: "testartikel-glas", variante: "standard", menge: 1, einzelCent: 1 }];
  const v = await (await request.post("/api/shop/versand", { data: { cart, ziel: { land: "AT", plz: "6900", ort: "Bregenz" } } })).json();
  expect(v.zeilen[0].einzelCent).toBe(1200);
  const r = await request.post("/api/shop/checkout", {
    data: { cart, lieferart: "versand", zahlung: "online", kunde: { name: "X Y", email: "x@example.invalid" }, adresse: { land: "AT", plz: "6900", ort: "Bregenz", strasse: "Testgasse", hausnr: "1" }, tarifId: v.versand.tarifId, angezeigt: { versandCent: 0, gesamtCent: 1 }, _t: 5000 },
  });
  expect(r.status()).toBe(409);
  const ch = await request.post("/api/shop/versand", { data: { cart, ziel: { land: "CH", plz: "9000" } } });
  expect(ch.status()).toBe(422);
  const kueche = await (await request.post("/api/shop/versand", { data: { cart: [{ slug: "gaggenau-serie-400-backofen", menge: 1 }] } })).json();
  expect(kueche.zeilen).toEqual([]);
});

test("axe ohne serious/critical, kein horizontales Scrollen (375 px)", async ({ page }, testInfo) => {
  test.setTimeout(480_000);
  const card = await addTestItem(page, "testartikel-raumduft");
  await card.locator("[data-shop-in-warenkorb]").click();
  for (const url of ["/de/shop/testartikel", "/de/shop/warenkorb", "/en/shop/warenkorb", "/de/merkliste"]) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(url);
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
    await testInfo.attach(`axe-${url.replace(/\W+/g, "_")}.json`, { body: JSON.stringify(results.violations, null, 2), contentType: "application/json" });
    const severe = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    expect(severe, url).toEqual([]);
    await page.setViewportSize({ width: 375, height: 800 });
    const overflow = await measureOverflow(page);
    expect(overflow.sw, `${url} ${JSON.stringify(overflow.wide)}`).toBeLessThanOrEqual(overflow.vw);
    if (url === "/de/shop/warenkorb") await page.screenshot({ path: SHOT("07-warenkorb-375"), fullPage: true });
  }
});
