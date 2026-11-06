// E2E Montage-Kiosk (Team B-PRJ, 10-konzept-projekte.md § 8.1) – läuft zusätzlich in ipad-quer (Name enthält „kiosk“).
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/projekte-kiosk.spec.js --project=desktop
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";

async function anmelden(page, email) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

test.describe("Montage-Kiosk", { tag: "@kiosk" }, () => {
  test("Monteur: Heute mit nächstem Stopp, Stopp-Seite mit Leistungen, kein Bargeld-Feld", async ({ page }) => {
    await anmelden(page, "montage@demo.local");
    await page.goto("/montage");
    await expect(page.getByTestId("montage-kiosk")).toBeVisible();
    const stopp = page.getByTestId("stopp").first();
    await expect(stopp).toBeVisible();
    await stopp.locator("a.bo-prj-zeilenlink").click();
    await expect(page.getByTestId("montage-stopp")).toBeVisible({ timeout: 45_000 });
    await page.getByTestId("kiosk-leistungen").click();
    await expect(page.getByRole("checkbox").first()).toBeVisible();
    await expect(page.locator('input[name*="bar" i], input[name*="betrag" i]')).toHaveCount(0);
  });

  test("Woche zeigt die Stopps der nächsten sieben Tage", async ({ page }) => {
    await anmelden(page, "montage@demo.local");
    await page.goto("/montage?ansicht=woche");
    await expect(page.getByTestId("stopp").first()).toBeVisible();
  });
});
