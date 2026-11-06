// E2E Team B-KAS – Kassa-Verkauf im Mock (Konzept §1.1 A1/A2/A5/A6, §3, §12 K1–K15).
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/kassa-verkauf.spec.js --project=desktop
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";

async function anmelden(page, email = "kassa@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

/** Scanner-Eingabe: Zeichen schneller als 30 ms + Enter (ScanTor). */
async function scanne(page, code) {
  await page.evaluate(() => document.activeElement?.blur());
  await page.evaluate((c) => [...c, "Enter"].forEach((k, i) => setTimeout(() => document.body.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true })), i * 5)), code);
}

async function leererBon(page) {
  await page.goto("/kassa");
  await expect(page.getByTestId("kassa-verkauf")).toBeVisible({ timeout: 120_000 });
  // Ein gespiegelter Entwurf aus einem früheren Lauf wird verworfen.
  if (await page.getByTestId("kassa-korb-leer").isHidden()) {
    await page.getByTestId("kassa-bon-menue").click();
    await page.getByRole("menuitem", { name: "Bon verwerfen" }).click();
  }
  await expect(page.getByTestId("kassa-korb-leer")).toBeVisible();
}

test.describe("Kassa Verkauf", { tag: "@kiosk" }, () => {
  test("Lounge-Raster: Statuszeile, Suchfeld, Kategorien, Produktkacheln, Warenkorb mit einem Primärknopf", async ({ page }) => {
    await anmelden(page);
    await leererBon(page);
    await expect(page.getByTestId("kiosk-kopf")).toContainText("Kassa 1");
    await expect(page.getByTestId("kassa-suche")).toBeVisible();
    await expect(page.getByTestId("kassa-kat-alle")).toHaveAttribute("aria-pressed", "true");
    expect(await page.getByTestId("kassa-produkt").count()).toBeGreaterThanOrEqual(6);
    await expect(page.getByTestId("kassa-kassieren")).toBeDisabled();
    await page.getByTestId("kassa-kat-licht").click();
    await expect(page.locator('[data-produkt="acc-stone-portable"]')).toBeVisible();
    await expect(page.locator('[data-produkt="acc-altair"]')).toHaveCount(0);
    const ueberlauf = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(ueberlauf).toBe(false);
  });

  test("A1 Barverkauf: Kachel → Bar → Passend, Ergebnis-Sheet, nächster Kunde (K1, K12)", async ({ page }) => {
    await anmelden(page);
    await leererBon(page);
    await expect(async () => {
      await page.locator('[data-produkt="acc-curve"]').click();
      await expect(page.getByTestId("kassa-zeile")).toHaveCount(1, { timeout: 1500 });
    }).toPass({ timeout: 30_000 });
    await expect(page.getByTestId("kassa-gesamt")).toHaveText(/49,00/);
    await page.getByTestId("kassa-zahlart-bar").click();
    await page.getByTestId("kassa-kassieren").click();
    await expect(page.getByTestId("kassa-zahlmaske")).toBeVisible();
    await expect(page.getByTestId("kassa-gegeben")).toHaveText(/49,00/);
    await page.waitForTimeout(350); // 300-ms-Eingabesperre nach dem Zustandswechsel
    await page.getByTestId("kassa-passend").click();
    await expect(page.getByTestId("kassa-ergebnis")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("kassa-ergebnis-betrag")).toHaveText(/49,00/);
    await page.getByTestId("kassa-naechster").click();
    await expect(page.getByTestId("kassa-korb-leer")).toBeVisible();
  });

  test("Bar mit Rückgeld über die Zahlentasten (Komma-Modell, erste Ziffer überschreibt)", async ({ page }) => {
    await anmelden(page);
    await leererBon(page);
    await expect(async () => {
      await page.locator('[data-produkt="acc-astro-loewe"]').click();
      await expect(page.getByTestId("kassa-zeile")).toHaveCount(1, { timeout: 1500 });
    }).toPass({ timeout: 30_000 });
    await page.getByTestId("kassa-zahlart-bar").click();
    await page.getByTestId("kassa-kassieren").click();
    await expect(page.getByTestId("kassa-zahlmaske")).toBeVisible();
    // Tippen in Menschengeschwindigkeit (Zeichenfolgen < 30 ms wertet der Scanner aus).
    for (const k of ["1", "0", "0"]) {
      await page.keyboard.press(k);
      await page.waitForTimeout(120);
    }
    await expect(page.getByTestId("kassa-gegeben")).toHaveText(/100/);
    await expect(page.getByTestId("kassa-rueckgeld")).toHaveText(/41,00/);
    await page.waitForTimeout(350);
    await page.getByTestId("kassa-zahl-kassieren").click();
    await expect(page.getByTestId("kassa-ergebnis-rueckgeld")).toContainText("41,00", { timeout: 60_000 });
  });

  test("A2/A5 Kundenkarte scannen, Vorteil vormerken, Karte am Test-Terminal, Bon gesperrt bis bezahlt (K9)", async ({ page }) => {
    await anmelden(page);
    await leererBon(page);
    await expect(async () => {
      await page.locator('[data-produkt="acc-altair"]').click();
      await expect(page.getByTestId("kassa-zeile")).toHaveCount(1, { timeout: 1500 });
    }).toPass({ timeout: 30_000 });
    await expect(async () => {
      await scanne(page, "KK-7K3QX9");
      await expect(page.getByTestId("kassa-kunde")).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 30_000 });
    await page.getByTestId("kassa-vorteil").first().click();
    await expect(page.getByTestId("kassa-vorteil").first()).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("kassa-summen")).toContainText("steht am Bon");
    await page.getByTestId("kassa-zahlart-karte").click();
    await page.getByTestId("kassa-kassieren").click();
    await expect(page.getByTestId("kassa-terminal")).toContainText("Terminal");
    await expect(page.getByTestId("kassa-karte-abbrechen")).toBeVisible();
    await expect(page.getByTestId("kassa-zahl-zurueck")).toBeDisabled();
    await page.getByTestId("kassa-terminal-simulieren").click();
    await expect(page.getByTestId("kassa-terminal")).toHaveAttribute("data-zustand", "bezahlt", { timeout: 60_000 });
    await page.waitForTimeout(350);
    await page.getByTestId("kassa-zahl-kassieren").click();
    await expect(page.getByTestId("kassa-ergebnis")).toContainText("eingelöst", { timeout: 60_000 });
    await page.getByTestId("kassa-naechster").click();
  });

  test("A6 Gutschein verkaufen: Wert übernimmt sofort, Ergebnis zeigt den Code", async ({ page }) => {
    await anmelden(page);
    await leererBon(page);
    await expect(async () => {
      await page.getByTestId("kassa-bon-menue").click();
      await page.getByRole("menuitem", { name: "Gutschein verkaufen" }).click({ timeout: 2000 });
      await expect(page.getByTestId("kassa-gutschein-verkauf")).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 30_000 });
    await page.getByTestId("kassa-gutschein-wert").nth(1).click();
    await expect(page.getByTestId("kassa-gesamt")).toHaveText(/50,00/);
    await page.getByTestId("kassa-zahlart-bar").click();
    await page.getByTestId("kassa-kassieren").click();
    await page.waitForTimeout(350);
    await page.getByTestId("kassa-passend").click();
    await expect(page.getByTestId("kassa-gutschein-code")).toContainText(/PH-[0-9A-Z]{4}-/, { timeout: 60_000 });
    await page.getByTestId("kassa-naechster").click();
  });

  test("Rechnungsfrage über 400 € ohne Kunde: „Nein, Privatkauf“ führt in die Zahlmaske (E1)", async ({ page }) => {
    await anmelden(page);
    await leererBon(page);
    await expect(async () => {
      await page.locator('[data-produkt="acc-stone-portable"]').click();
      await expect(page.getByTestId("kassa-zeile")).toHaveCount(1, { timeout: 1500 });
    }).toPass({ timeout: 30_000 });
    await page.locator('[data-produkt="acc-stone-portable"]').click();
    await expect(page.getByTestId("kassa-gesamt")).toHaveText(/790,00/);
    await page.getByTestId("kassa-zahlart-bar").click();
    await page.getByTestId("kassa-kassieren").click();
    await expect(page.getByTestId("kassa-rechnungsfrage")).toBeVisible();
    await page.getByTestId("kassa-privatkauf").click();
    await expect(page.getByTestId("kassa-zahlmaske")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("kassa-korb")).toBeVisible();
  });

  test("„Zahlung erhalten – Beleg offen“: Karte bezahlt, Buchung scheitert, gleicher Schlüssel bucht später (K33)", async ({ page }) => {
    await anmelden(page);
    await page.goto("/kassa?mock_fehler=netz");
    await expect(page.getByTestId("kassa-verkauf")).toBeVisible({ timeout: 120_000 });
    if (await page.getByTestId("kassa-korb-leer").isHidden()) {
      await page.getByTestId("kassa-bon-menue").click();
      await page.getByRole("menuitem", { name: "Bon verwerfen" }).click();
    }
    await expect(async () => {
      await page.locator('[data-produkt="acc-bellhop"]').click();
      await expect(page.getByTestId("kassa-zeile")).toHaveCount(1, { timeout: 1500 });
    }).toPass({ timeout: 30_000 });
    await page.getByTestId("kassa-zahlart-karte").click();
    await page.getByTestId("kassa-kassieren").click();
    await page.getByTestId("kassa-terminal-simulieren").click();
    await expect(page.getByTestId("kassa-terminal")).toHaveAttribute("data-zustand", "bezahlt", { timeout: 60_000 });
    await page.waitForTimeout(350);
    await page.getByTestId("kassa-zahl-kassieren").click();
    await expect(page.getByTestId("kassa-ohne-beleg")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("kiosk-baender")).toContainText("Zahlung erhalten – Beleg offen");
    // Drei automatische Versuche (2/4/8 s) – der Mock lässt genau drei scheitern; danach bucht „Erneut buchen“.
    await expect(async () => {
      const erneut = page.getByTestId("kassa-erneut-buchen");
      if ((await erneut.count()) && (await erneut.isEnabled({ timeout: 500 }).catch(() => false))) await erneut.click({ timeout: 2000 }).catch(() => {});
      await expect(page.getByTestId("kassa-ergebnis")).toBeVisible({ timeout: 4000 });
    }).toPass({ timeout: 120_000 });
    await page.getByTestId("kassa-naechster").click();
  });
});
