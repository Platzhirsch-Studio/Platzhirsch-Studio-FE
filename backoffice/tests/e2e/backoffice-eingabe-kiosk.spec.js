// E2E Team P0-6 (G-21…G-24, G-30): Kiosk-Kern v2 auf /kassa und Demo „eingabe“
// (/einstellungen?tab=system&baustein=eingabe – übersprungen, solange die Demo nicht eingebunden ist).
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/backoffice-eingabe-kiosk.spec.js --project=desktop
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";

async function anmelden(page, email = "admin@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

test.describe("Kiosk-Kern v2", () => {
  test("Statuszeile, F1-Hilfe, Sperren, globaler Scan mit Ansage", async ({ page }) => {
    await anmelden(page);
    await page.goto("/kassa");
    await expect(page.getByTestId("kiosk-inhalt")).toBeVisible();
    await expect(page.getByTestId("kiosk-kopf")).toBeVisible();
    await expect(page.getByText("Verbunden")).toBeVisible();
    // Tasten greifen erst nach der Hydrierung (WebKit ist langsamer) – bis dahin erneut drücken.
    await expect(async () => {
      await page.keyboard.press("F1");
      await expect(page.getByTestId("kiosk-hilfe-dialog")).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 30_000 });
    await expect(page.locator("html")).toHaveAttribute("data-tastatur", "ja");
    await page.keyboard.press("Escape");
    await page.getByTestId("kiosk-sperren").click();
    await expect(page.getByTestId("kiosk-sperrbild")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("kiosk-inhalt")).toBeVisible();
    // Der Platzhalter sucht den Code in der ersten Liste (Navigation) – vorher wird er angesagt.
    // Der Scanner-Hörer hängt erst nach der Hydrierung (WebKit langsamer) – bis dahin erneut scannen.
    await expect(async () => {
      await page.evaluate(() => document.activeElement?.blur());
      await page.evaluate(() => [..."5056394707181", "Enter"].forEach((k, i) => setTimeout(() => document.body.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true })), i * 6)));
      await expect(page).toHaveURL(/q=5056394707181/, { timeout: 3000 });
    }).toPass({ timeout: 30_000 });
  });
});

test.describe("Demo Eingabe und Kiosk", () => {
  test("Kalender-Tastatur, BetragFeld, Zahlentastatur", async ({ page }) => {
    await anmelden(page);
    await page.goto("/einstellungen?tab=system&baustein=eingabe");
    const da = await page.getByTestId("demo-eingabe").waitFor({ state: "visible", timeout: 20_000 }).then(() => true, () => false);
    test.skip(!da, "Demo noch nicht in /einstellungen eingebunden (Besitzer Zentrale/L0)");
    const zelle = page.locator('[data-testid="kalender-raster"] [role="gridcell"][tabindex="0"]');
    await zelle.focus();
    await page.keyboard.press("m");
    await expect(page.getByTestId("kalender")).toHaveAttribute("data-ansicht", "monat");
    const betrag = page.getByTestId("demo-betrag-anzahlung");
    await betrag.fill("1234,5");
    await betrag.blur();
    await expect(betrag).toHaveValue("1.234,50");
    const zt = page.getByTestId("demo-zahlentastatur");
    for (const k of ["2", "5", "Komma", "5"]) await zt.getByRole("button", { name: k, exact: true }).first().click();
    await expect(zt.locator("output")).toHaveText("25,5");
  });
});
