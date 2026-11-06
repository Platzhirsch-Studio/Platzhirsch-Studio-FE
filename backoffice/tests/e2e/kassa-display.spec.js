// E2E Team B-KAS – Kundendisplay (Lounge §10, Konzept §9) und Kopplung über den Kanal des Fundaments.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/kassa-display.spec.js --project=desktop
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";

async function anmelden(page, email = "kassa@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

test.describe("Kassa Kundendisplay", { tag: "@kundendisplay" }, () => {
  test("Vorschau-Zustände ruhe · einkauf · bezahlen · danke ohne Namen und Kontaktdaten", async ({ page }) => {
    await anmelden(page);
    await page.goto("/kassa/display?vorschau=einkauf");
    await expect(page.getByTestId("kd-einkauf")).toBeVisible({ timeout: 120_000 });
    await expect(page.getByTestId("kd-gesamt")).toHaveText(/1\.166,00/);
    await expect(page.getByText("Kundenkarte erkannt")).toBeVisible();
    await expect(page.getByTestId("kundendisplay")).not.toContainText("@");
    await page.goto("/kassa/display?vorschau=bezahlen&zahlart=bar");
    await expect(page.getByTestId("kd-bezahlen")).toContainText("Rückgeld");
    await page.goto("/kassa/display?vorschau=danke");
    await expect(page.getByTestId("kd-danke")).toContainText("Vielen Dank");
    await page.goto("/kassa/display?vorschau=ruhe");
    await expect(page.getByTestId("kd-ruhe")).toBeVisible();
    const ueberlauf = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(ueberlauf).toBe(false);
  });

  test("Live: Kassa und Display im selben Browser gekoppelt (BroadcastChannel)", async ({ context }) => {
    const kassa = await context.newPage();
    await anmelden(kassa);
    const display = await context.newPage();
    await display.goto("/kassa/display");
    await expect(display.getByTestId("kundendisplay")).toBeVisible({ timeout: 120_000 });
    await kassa.goto("/kassa");
    await expect(kassa.getByTestId("kassa-verkauf")).toBeVisible({ timeout: 120_000 });
    if (await kassa.getByTestId("kassa-korb-leer").isHidden()) {
      await kassa.getByTestId("kassa-bon-menue").click();
      await kassa.getByRole("menuitem", { name: "Bon verwerfen" }).click();
    }
    await expect(async () => {
      await kassa.locator('[data-produkt="acc-curve"]').click();
      await expect(display.getByTestId("kd-einkauf")).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 40_000 });
    await expect(display.getByTestId("kd-einkauf")).toContainText("Curve Kerzenhalter");
    await expect(display.getByTestId("kundendisplay")).toHaveAttribute("data-verbunden", "ja");
  });
});
