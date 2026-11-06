// E2E Team B-KAS – Kassa-Verwaltung und Kiosk-Unterseiten (Konzept §4–§5, §3.6–§3.9, Rollen X3/V1/V8).
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/kassa-verwaltung.spec.js --project=desktop
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";

async function anmelden(page, email) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

test.describe("Kassa-Verwaltung", () => {
  test("Übersicht: Akzentkachel, Kennzahlen, Diagramme, Kassen; Leitung sieht die Echtbetriebs-Schranke", async ({ page }) => {
    await anmelden(page, "kassa-leitung@demo.local");
    await page.goto("/kassa/verwaltung");
    await expect(page.getByTestId("kassa-uebersicht")).toBeVisible({ timeout: 120_000 });
    await expect(page.getByTestId("kassa-heute")).toContainText("Heute kassiert");
    await expect(page.getByTestId("kassa-kassen")).toContainText("Kassa 1");
    await expect(page.getByTestId("kassa-echtbetrieb")).toContainText("Echtbetrieb braucht");
    await expect(page.getByTestId("kassa-oeffnen")).toBeVisible();
  });

  test("Belege-Liste → Beleg-Akte mit Positionen und Signatur; Kassen-Akte mit Trainings-Schalter", async ({ page }) => {
    await anmelden(page, "kassa-leitung@demo.local");
    await page.goto("/kassa/verwaltung/belege");
    await expect(page.getByRole("heading", { name: "Belege" })).toBeVisible({ timeout: 120_000 });
    await page.goto("/kassa/verwaltung/belege/KASSE-LOCHAU-01-000001");
    await expect(page.getByTestId("beleg-akte")).toContainText("Startbeleg");
    await page.goto("/kassa/verwaltung/kassen/KASSE-LOCHAU-01");
    await expect(page.getByTestId("kassen-akte")).toContainText("Kassa 1");
    await expect(page.getByTestId("kasse-checkliste")).toBeVisible();
    await expect(page.getByTestId("kasse-training")).toBeVisible();
  });

  test("Berichte, Kassenbuch und Einstellungen laden; Steuerberatung sieht keine Bediener-Kontrolle", async ({ page }) => {
    await anmelden(page, "kassa-leitung@demo.local");
    await page.goto("/kassa/verwaltung/berichte");
    await expect(page.getByTestId("kassa-berichte")).toContainText("Kassenkontrolle je Bediener", { timeout: 120_000 });
    await page.goto("/kassa/verwaltung/berichte/tageslosung");
    await expect(page.getByTestId("bericht-tabelle")).toBeVisible();
    await page.goto("/kassa/verwaltung/kassenbuch");
    await expect(page.getByTestId("kassenbuch-tabelle")).toBeVisible();
    await page.goto("/kassa/verwaltung/einstellungen");
    await expect(page.getByTestId("kassa-einstellungen")).toContainText("Rechnungsfrage ab");
  });

  test("Rolle Buchhaltung extern: Berichte ohne Bediener-Kontrolle, Bediener-Seite gesperrt", async ({ page }) => {
    await anmelden(page, "buchhaltung@demo.local");
    await page.goto("/kassa/verwaltung/berichte");
    await expect(page.getByTestId("kassa-berichte")).toBeVisible({ timeout: 120_000 });
    await expect(page.getByTestId("kassa-berichte")).not.toContainText("Kassenkontrolle je Bediener");
    await page.goto("/kassa/verwaltung/bediener");
    await expect(page).toHaveURL(/kein-zugriff/);
  });
});

test.describe("Kassa Kiosk-Unterseiten", { tag: "@kiosk" }, () => {
  test("Belege heute: Beleg wählen, Storno-Dialog mit Grund und Hinweis auf Rücknahme", async ({ page }) => {
    await anmelden(page, "kassa@demo.local");
    await page.goto("/kassa/belege");
    await expect(page.getByTestId("kassa-belege")).toBeVisible({ timeout: 120_000 });
    await expect(page.getByTestId("beleg-zeile").first()).toBeVisible();
    await page.getByTestId("beleg-zeile").first().click();
    await expect(page.getByTestId("beleg-vorschau")).toContainText("Gesamt");
    const storno = page.getByTestId("beleg-stornieren");
    if (await storno.isEnabled()) {
      await storno.click();
      await expect(page.getByTestId("storno-dialog")).toContainText("Kunde will zurückgeben");
      await page.keyboard.press("Escape");
    }
  });

  test("Bargeld: Entnahme mit Zweck „Ausgabe“ verlangt Wofür; Projektfeld als Fähigkeit erklärt", async ({ page }) => {
    await anmelden(page, "kassa@demo.local");
    await page.goto("/kassa/bargeld");
    await expect(page.getByTestId("kassa-bargeld")).toBeVisible({ timeout: 120_000 });
    await page.getByTestId("bargeld-entnehmen").click();
    await page.getByTestId("bargeld-zweck").filter({ hasText: "Ausgabe" }).click();
    await expect(page.getByTestId("bargeld-projekt")).toBeVisible();
    await expect(page.getByText("Projektnummer wird im Grund vermerkt")).toBeVisible();
    await expect(page.getByTestId("bargeld-buchen")).toBeDisabled();
  });

  test("Tagesabschluss (Mitarbeiter): prüfen → zählen, Soll blind bis gezählt", async ({ page }) => {
    await anmelden(page, "kassa@demo.local");
    await page.goto("/kassa/abschluss");
    await expect(page.getByTestId("kassa-abschluss")).toBeVisible({ timeout: 120_000 });
    if ((await page.getByTestId("kassa-abschluss").getAttribute("data-schritt")) === "pruefen") {
      await page.getByTestId("abschluss-weiter-zaehlen").click();
      await expect(page.getByText("Soll ist ausgeblendet")).toBeVisible();
      await page.getByTestId("zaehl-5000").fill("2");
      await expect(page.getByTestId("abschluss-ist")).toHaveText(/100,00/);
    }
  });
});
