// E2E Bereich Marketing (Team B-MAR, 10-konzept-marketing § 14) im Mock-Modus.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/marketing-bereich.spec.js --project=desktop
// Schreibende Tests nehmen Rückgängig in Anspruch oder legen eigene Datensätze an (die Mock-Datenbank lebt im Dev-Server weiter).
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";
// Abnahme-Grep (§ 14): keine Fachwörter und Rohwerte in der Oberfläche („Frappe“ fehlt bewusst: das Testband der Shell nennt es im Mock).
const ROHWERTE = /\b(DOI|Bounce|Slot|Workflow|Opt-in|Segment|Veroeffentlicht|Durchgefuehrt|Bestaetigt|PH Newsletter|PH Event|unbestaetigt)\b/;

async function anmelden(page, email = "admin@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

test.describe("Marketing (Leitung)", () => {
  test.beforeEach(async ({ page }) => {
    await anmelden(page);
  });

  test("Übersicht: Titel, Zu tun, Karten – keine Rohwerte", async ({ page }) => {
    await page.goto("/marketing");
    await expect(page.getByRole("heading", { level: 1, name: "Marketing" })).toBeVisible();
    await expect(page.locator("main")).not.toContainText(ROHWERTE);
    await expect(page.getByTestId("mehr-zahlen-aufklapper")).toBeAttached();
  });

  test("Alle Seiten des Bereichs laden ohne Fehler und ohne Rohwerte", async ({ page }) => {
    const fehler = [];
    page.on("pageerror", (e) => fehler.push(e.message));
    for (const pfad of [
      "/marketing/newsletter", "/marketing/newsletter/PH-NL-2026-004", "/marketing/empfaenger", "/marketing/empfaenger?ansicht=einwilligungen",
      "/marketing/events", "/marketing/events/kuechenabend-2026", "/marketing/social", "/marketing/social?ansicht=kanban", "/marketing/social?ansicht=liste",
      "/marketing/kampagnen", "/marketing/kampagnen/PH-KAM-2026-0002", "/marketing/empfehlungen", "/marketing/zielgruppen", "/marketing/kundenreisen",
      "/marketing/kundenreisen/pflege", "/marketing/vorlagen", "/marketing/einblicke", "/marketing/einstellungen",
    ]) {
      const r = await page.goto(pfad);
      expect(r?.status(), pfad).toBe(200);
      await expect(page.getByRole("heading", { level: 1 }), pfad).toBeVisible();
      await expect(page.locator("main"), pfad).not.toContainText(ROHWERTE);
    }
    expect(fehler).toEqual([]);
  });

  test("Alte Pfade leiten dauerhaft weiter (Abos → Empfänger)", async ({ page }) => {
    await page.goto("/marketing/abos");
    await expect(page).toHaveURL(/\/marketing\/empfaenger/);
    await page.goto("/marketing/einwilligungen");
    await expect(page).toHaveURL(/ansicht=einwilligungen/);
  });

  test("Newsletter: Liste → Akte mit Bereitschaft und Block-Editor; Testmail nur an interne Adresse", async ({ page }) => {
    await page.goto("/marketing/newsletter");
    await expect(page.getByTestId("ausgabe-zeile").first()).toBeVisible();
    await page.goto("/marketing/newsletter/PH-NL-2026-006");
    await expect(page.getByTestId("bereitschaft")).toBeVisible();
    await expect(page.getByTestId("block-editor")).toBeVisible();
    await page.getByTestId("testmail-oeffnen").click();
    await page.getByTestId("testmail-adresse").fill("kunde@gmail.com");
    await page.getByTestId("testmail-senden").click();
    await expect(page.getByRole("dialog")).toContainText(/intern/i);
    await page.keyboard.press("Escape");
  });

  test("Social: Kalender, Kanban (nur hier) und Akte mit Prüffragen", async ({ page }) => {
    await page.goto("/marketing/social");
    await expect(page.getByTestId("social-kalender")).toBeVisible();
    await page.goto("/marketing/social?ansicht=kanban");
    await expect(page.getByTestId("social-kanban")).toBeVisible();
    await page.goto("/marketing/social/PH-SOC-2026-0011");
    await expect(page.getByTestId("social-formular")).toBeVisible();
  });

  test("Kampagne: Kennzahl-Dialog prüft Kosten mit Komma", async ({ page }) => {
    await page.goto("/marketing/kampagnen");
    await page.locator("[data-testid=kennzahl-knopf]:not([disabled])").first().click();
    await expect(page.getByTestId("kennzahl-dialog")).toBeVisible();
    await page.getByTestId("kennzahl-kosten").fill("abc");
    await page.getByTestId("kennzahl-speichern").click();
    await expect(page.getByTestId("kennzahl-dialog")).toContainText(/Betrag|Zahl/);
    await page.keyboard.press("Escape");
  });

  test("Check-in am Eingang: Da markieren, Zähler steigt, Rückgängig stellt zurück", async ({ page }) => {
    await page.goto("/checkin/designabend-licht");
    await expect(page.getByTestId("checkin")).toBeVisible();
    const zaehler = page.getByTestId("checkin-zaehler");
    const vorher = await zaehler.textContent();
    const zeile = page.getByTestId("checkin-zeile").filter({ has: page.getByTestId("checkin-da") }).first();
    await zeile.getByTestId("checkin-da").click();
    await expect(zaehler).not.toHaveText(vorher || "", { timeout: 30_000 });
    await page.getByTestId("checkin-rueckgaengig").first().click();
    await expect(zaehler).toHaveText(vorher || "", { timeout: 30_000 });
  });
});

test.describe("Marketing (Team ohne Leitung)", () => {
  test("Team sieht keine Einstellungen und keine Vorlagen in der Navigation", async ({ page }) => {
    await anmelden(page, "marketing@demo.local");
    await page.goto("/marketing");
    await expect(page.getByRole("heading", { level: 1, name: "Marketing" })).toBeVisible();
    await page.goto("/marketing/einstellungen");
    await expect(page.locator("main")).not.toContainText("Absender");
  });
});
