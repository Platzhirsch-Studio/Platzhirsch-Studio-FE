// E2E Bereich Sortiment (Team B-SOR, 10-konzept-sortiment § 17/§ 20.8) im Mock-Modus als Leitung Sortiment.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/sortiment-bereich.spec.js --project=desktop
// Tests, die schreiben, legen ihre eigenen Datensätze an (die Mock-Datenbank lebt im Dev-Server weiter).
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";
const ROHWERTE = /\b(Geprueft|Teilgeliefert|Vollstaendig|Uebermittelt|Haendler|PH Produkt|PH Herstellerbestellung)\b/;

async function anmelden(page, email = "sortiment@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

test.describe("Sortiment", () => {
  test.beforeEach(async ({ page }) => {
    await anmelden(page);
  });

  test("Bereichsstart: Zu tun mit Knöpfen, Akzentkacheln, Kette – keine Rohwerte", async ({ page }) => {
    await page.goto("/sortiment");
    await expect(page.getByRole("heading", { level: 1, name: "Sortiment" })).toBeVisible();
    await expect(page.getByTestId("zutun")).toBeVisible();
    await expect(page.getByTestId("zutun-abEinlesen").getByRole("link", { name: "AB einlesen" }).first()).toBeVisible();
    await expect(page.getByTestId("akzent-ab")).toBeVisible();
    await expect(page.locator("main")).not.toContainText(ROHWERTE);
  });

  test("Produkte: Liste mit Bild und Preis, Suche in der URL, Kanban, Seitenblick", async ({ page }) => {
    await page.goto("/sortiment/produkte");
    const breit = (page.viewportSize()?.width || 0) >= 768;
    if (breit) {
      await expect(page.getByTestId("produkt-zeile").first()).toBeVisible();
      await page.getByRole("button", { name: /Seitenblick: / }).first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
    }
    await page.getByRole("searchbox").fill("Mosaik");
    await page.getByRole("searchbox").press("Enter");
    await expect(page).toHaveURL(/q=Mosaik/);
    await expect(page.locator("main")).toContainText("Mosaik");
    await page.goto("/sortiment/produkte?ansicht=kanban");
    await expect(page.getByTestId("produkt-kanban")).toBeVisible();
    await expect(page.getByTestId("produkt-kanban")).toContainText("Wartet auf Veröffentlichung");
  });

  test("Schnellanlage: Pflichtfelder, Anlegen und öffnen führt in die Akte (3 Felder)", async ({ page }) => {
    const name = `E2E Leuchte ${Date.now() % 100000}`;
    await page.goto("/sortiment/produkte?neu=produkt");
    const d = page.getByTestId("schnellanlage");
    await expect(d).toBeVisible();
    await d.getByTestId("schnellanlage-oeffnen").click();
    await expect(d).toContainText("Pflichtfeld");
    await d.getByLabel("Marke").selectOption("Vitra");
    await d.getByLabel("Kategorie").selectOption("Leuchten");
    await d.getByLabel("Bezeichnung").fill(name);
    await expect(d).toContainText("/produkte/leuchten/vitra-e2e-leuchte");
    await d.getByTestId("schnellanlage-oeffnen").click();
    await page.waitForURL(/\/sortiment\/produkte\/vitra-e2e-leuchte/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(page.getByTestId("checkliste")).toContainText("Freigegebenes Bild");
  });

  test("Bestellung: erfassen, als gesendet markieren, AB einlesen ohne Abweichung, Export CSV", async ({ page }) => {
    await page.goto("/sortiment/bestellungen/neu");
    const f = page.getByTestId("bestell-formular");
    await f.getByLabel("Lieferant").selectOption("Baobab Vertrieb");
    await f.getByLabel("Kommission").fill("E2E Lager");
    await f.getByLabel("Bezeichnung Position 1").fill("E2E Kerze");
    await f.getByLabel("Menge").first().fill("3");
    await page.getByTestId("bestellung-anlegen").click();
    await page.waitForURL(/\/sortiment\/bestellungen\/HB-\d{4}-\d{5}$/, { timeout: 30_000 });
    const url = page.url();
    await expect(page.locator("main")).toContainText("Entwurf");
    await page.getByRole("button", { name: "Weitere Aktionen" }).click();
    await page.getByRole("menuitem", { name: /Als gesendet markieren/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Als gesendet markieren" }).click();
    await expect(page.getByTestId("ab-einlesen")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("ab-einlesen").click();
    await page.getByLabel("AB-Nummer *").fill("E2E-AB-1");
    await page.getByTestId("ab-weiter").click();
    await page.getByTestId("ab-wie-bestellt").click();
    await page.getByTestId("ab-erzeugen").click();
    await expect(page.getByTestId("ergebnis-karte")).toContainText("Ohne Abweichung", { timeout: 30_000 });
    await page.goto(`${url}?tab=uebermittlung`);
    await page.getByRole("radio", { name: "CSV" }).click();
    await expect(page.getByTestId("export-vorschau")).toContainText("pos;hersteller_artikelnr;bezeichnung", { timeout: 30_000 });
    await page.getByTestId("export-erzeugen").click();
    await expect(page.locator("main")).toContainText("erzeugt und angehängt", { timeout: 15_000 });
  });

  test("AB-Abgleich: Raster mit OK · Rückfrage · Ablehnen, Rückfrage fragt nach dem Ziel", async ({ page }) => {
    await page.goto("/sortiment/bestellungen/HB-2026-00013?tab=ab");
    const raster = page.getByTestId("abgleich");
    await expect(raster).toBeVisible();
    await expect(raster.getByRole("radio", { name: /Rückfrage/ }).first()).toBeVisible();
    await raster.getByTestId("abgleich-zeile").first().focus();
    await page.keyboard.press("2");
    await expect(page.getByRole("dialog")).toContainText("Rückfrage – an wen?");
    await page.getByRole("dialog").getByRole("button", { name: "Abbrechen" }).click();
  });

  test("Übermittlung: EDI-Vorschau mit GLN, unverifiziert gekennzeichnet", async ({ page }) => {
    await page.goto("/sortiment/bestellungen/HB-2026-00011?tab=uebermittlung");
    await expect(page.getByTestId("export-vorschau")).toContainText("UNH+1+ORDERS:D:96A:UN:EAN008");
    await expect(page.getByTestId("uebermittlung")).toContainText("unverifiziert");
    await page.getByRole("radio", { name: "IWOfurn" }).click();
    await expect(page.getByTestId("export-vorschau")).toContainText("<Bestellung Nummer=");
  });

  test("Wareneingang: erwartete Lieferungen, Positionen mit Stepper, Hinweis-Pflicht bei Schaden", async ({ page }) => {
    await page.goto("/sortiment/wareneingang/neu");
    await expect(page.getByTestId("we-suchen")).toBeVisible();
    await page.goto("/sortiment/wareneingang/neu?bestellung=HB-2026-00016");
    await expect(page.getByTestId("we-position").first()).toBeVisible();
    await page.getByTestId("we-position").first().getByRole("button", { name: /Transportschaden/ }).click();
    await expect(page.getByTestId("we-buchen-knopf")).toBeDisabled();
    await expect(page.locator("main")).toContainText("Foto oder Hinweis");
  });

  test("Freigaben: Bilder als Raster (Grid), Preise als Liste mit bisher → neu", async ({ page }) => {
    await page.goto("/sortiment/freigaben");
    await expect(page.getByTestId("freigabe-raster")).toBeVisible();
    await expect(page.getByTestId("freigabe-alle")).toBeVisible();
    await page.goto("/sortiment/freigaben?art=preise");
    await expect(page.getByTestId("freigabe-liste")).toBeVisible();
    await expect(page.getByTestId("freigabe-liste")).toContainText("→");
  });
});
