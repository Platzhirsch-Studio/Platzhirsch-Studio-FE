// E2E Akte und Vorgang (Team P0-5a, G-12 · G-14 · G-16 · G-28) auf den Demos
// /einstellungen?tab=system&baustein=akte|vorgangsleiste|ergebnis|person (Admin, Mock).
// Ohne Einbindung der Demos in die Einstellungsseite werden die Tests übersprungen.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/backoffice-akte.spec.js --project=desktop
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";

async function anmelden(page) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill("admin@demo.local");
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

async function demo(page, name, query = "") {
  await page.goto(`/einstellungen?tab=system&baustein=${name}${query}`);
  const da = await page.getByTestId(`demo-${name}`).waitFor({ state: "visible", timeout: 20_000 }).then(() => true, () => false);
  test.skip(!da, "Demo noch nicht in /einstellungen eingebunden (Besitzer Zentrale/L0)");
}

test.describe("Akte und Vorgang", () => {
  test.beforeEach(async ({ page }) => {
    await anmelden(page);
  });

  test("Akte: Hero, eine aktuelle Stufe, Linien, Reiter in der URL, rechte Spalte", async ({ page }) => {
    await demo(page, "akte");
    await expect(page.getByTestId("demo-akte-hero").getByRole("heading", { name: "Haus am See" })).toBeVisible();
    await expect(page.getByTestId("demo-akte-hero").locator(".bo-glas-kachel")).toHaveCount(4);
    await expect(page.locator('.bo-reise__spalte[aria-current="step"]')).toHaveCount(1);
    await expect(page.locator(".bo-reise__flaeche .bo-reise__linie")).toHaveCount(6);
    await expect(page.locator(".bo-akte-band")).toHaveCount(1);
    await page.getByTestId("akte-tab-planung").click();
    await expect(page).toHaveURL(/reiter=planung/);
    await expect(page).toHaveURL(/baustein=akte/);
    const breite = page.viewportSize()?.width || 0;
    if (breite >= 1280) await expect(page.locator(".bo-akte__rechts")).toBeVisible();
    else await expect(page.getByTestId("akte-tab-seite")).toBeVisible();
    await expect(page.locator('[data-slot="logistik.montage"]').getByText("Dieser Abschnitt konnte nicht geladen werden.")).toBeVisible();
  });

  test("Vorgangsleiste: Belege einer Stufe im Popover, Kurzform mit Stand", async ({ page }) => {
    await demo(page, "vorgangsleiste");
    await page.getByRole("button", { name: /Belege und Vorgänge zu Schlussrechnung/ }).click();
    await expect(page.getByRole("dialog").getByText("GU-2026-0007")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("img", { name: /Stufe 5 von 7 · Bestellung & Lieferung/ }).first()).toBeVisible();
  });

  test("ErgebnisKarte: höchstens 3 Knöpfe, Häkchen als Status", async ({ page }) => {
    await demo(page, "ergebnis");
    const f = page.getByTestId("demo-ergebnis-faktura");
    await expect(f.locator(".bo-ergebnis__fuss > *")).toHaveCount(3);
    await expect(f.getByText("Wird nicht gezeigt")).toHaveCount(0);
    await expect(page.getByTestId("demo-ergebnis-kassa")).toHaveAttribute("role", "status");
  });

  test("PersonZelle: fremde Abwesenheit ohne Grund", async ({ page }) => {
    await demo(page, "person");
    const fremd = page.getByTestId("demo-person-fremd");
    await expect(fremd).toContainText("abwesend");
    await expect(fremd).not.toContainText("Krankenstand");
    await expect(page.getByTestId("demo-person-eigen")).toContainText("Urlaub");
  });
});
