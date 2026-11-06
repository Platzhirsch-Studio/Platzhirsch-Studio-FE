// E2E Team P0-5c (G-05 LeitungBitten, G-17 DruckPanel, G-18 Informieren, G-19 AnDieKassa) auf der Demo
// /einstellungen?tab=system&baustein=druck-informieren (Admin, Mock). Ohne Einbindung der Demo in die
// Einstellungsseite werden die Tests übersprungen. PW_DEMO_PFAD überschreibt den Pfad (z. B. Prüfspiegel).
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/backoffice-p05c.spec.js --project=desktop
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";
const DEMO = process.env.PW_DEMO_PFAD || "/einstellungen?tab=system&baustein=druck-informieren";

async function anmelden(page) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill("admin@demo.local");
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

async function demo(page) {
  await page.goto(DEMO);
  const da = await page.getByTestId("demo-druck-informieren").waitFor({ state: "visible", timeout: 30_000 }).then(() => true, () => false);
  test.skip(!da, "Demo noch nicht in /einstellungen eingebunden (Besitzer Zentrale/L0)");
}

test.describe("Drucken, Informieren, Leitung, Kassa", () => {
  test.beforeEach(async ({ page }) => {
    await anmelden(page);
    await demo(page);
  });

  test("Kunden informieren: Vorschau, Rückgängig sendet nichts, Senden setzt den Chip auf informiert", async ({ page }) => {
    await page.getByTestId("demo-info-chip-oeffnen").click();
    const sheet = page.getByTestId("demo-info-sheet");
    await expect(sheet.getByTestId("demo-info-sheet-vorschau")).toContainText("Neuer Liefertermin");
    await sheet.getByTestId("demo-info-sheet-senden").click();
    await page.mouse.move(10, 10);
    const toast = page.getByRole("button", { name: /Rückgängig/ }).first();
    await expect(toast).toBeVisible();
    await toast.click();
    await expect(page.getByTestId("demo-info-chip")).toHaveAttribute("data-zustand", "offen");
    // zweiter Versuch: durchlaufen lassen
    await page.getByTestId("demo-info-chip-oeffnen").click();
    await page.getByTestId("demo-info-sheet-senden").click();
    await page.mouse.move(10, 10);
    await expect(page.getByTestId("demo-info-chip")).toHaveAttribute("data-zustand", "informiert", { timeout: 15_000 });
  });

  test("Kunden informieren ohne E-Mail: E-Mail gesperrt mit Grund, Telefon erfassen", async ({ page }) => {
    await page.getByTestId("demo-ohne-mail").click();
    const sheet = page.getByTestId("demo-ohne-mail-sheet");
    await expect(sheet.getByTestId("demo-ohne-mail-sheet-ohne-email")).toContainText("keine E-Mail-Adresse");
    await expect(sheet.getByTestId("demo-ohne-mail-sheet-kanal-email")).toBeDisabled();
    await sheet.getByTestId("demo-ohne-mail-sheet-senden").click();
    await expect(sheet.getByText("Bitte kurz festhalten")).toBeVisible();
    await sheet.getByTestId("demo-ohne-mail-sheet-notiz").fill("Neuer Liefertermin KW 48 bestätigt");
    await sheet.getByTestId("demo-ohne-mail-sheet-senden").click();
    await expect(page.getByText("Telefon erfasst")).toBeVisible();
  });

  test("Leitung bitten: Aufgabe anlegen, zweiter Versuch am selben Tag meldet „Bereits angefragt“", async ({ page }) => {
    const knopf = page.getByTestId("demo-leitung-knopf");
    const angefragt = page.getByTestId("demo-leitung-knopf-angefragt");
    if (await knopf.isVisible()) {
      await knopf.click();
      const senden = page.getByTestId("demo-leitung-knopf-senden");
      await expect(senden.or(angefragt)).toBeVisible();
      if (await senden.isVisible()) await senden.click();
    }
    await expect(angefragt).toContainText("Angefragt bei Leitung");
    await expect(angefragt.getByRole("link", { name: "Aufgabe öffnen" })).toHaveAttribute("href", /PH-AUF-|ph-aufgabe|aufgabe/i);
    // Menü-Variante derselben Rechnung, andere Aktion → eigener Eintrag
    await page.getByTestId("demo-leitung-menue").click();
    await expect(page.getByRole("menuitem", { name: /Stornieren/ })).toHaveAttribute("aria-disabled", "true");
  });

  test("Druckpanel: Strg+P öffnet, Vorschau lädt, Format wechselt, Sammeldruck zählt", async ({ page }) => {
    const panel = page.getByTestId("druck-panel");
    // Kürzel greift erst nach der Hydrierung – bis dahin erneut drücken (setzt nur „offen“).
    await expect(async () => {
      await page.keyboard.press("Control+p");
      await expect(panel).toHaveAttribute("open", "", { timeout: 1000 });
    }).toPass({ timeout: 30_000 });
    await expect(panel.getByTestId("druck-vorschau")).toHaveAttribute("data-zustand", "bereit", { timeout: 60_000 });
    const rahmen = panel.locator('[data-testid="druck-vorschau"] iframe');
    await expect(rahmen.contentFrame().locator("main")).toContainText("PLATZHIRSCH");
    await panel.getByRole("radio", { name: "Anzahlung" }).click();
    await expect(panel.getByTestId("druck-vorschau")).toHaveAttribute("data-zustand", "bereit", { timeout: 60_000 });
    await panel.getByTestId("druck-mehrere").click();
    await panel.getByTestId("druck-chip-Standard").click();
    await expect(panel.getByTestId("druck-drucken")).toContainText("2 Formate drucken");
    await page.keyboard.press("Escape");
    await expect(panel).not.toHaveAttribute("open", "");
  });

  test("Kiosk-Druckmenü: Einträge ohne Weg sind gesperrt und nennen den Grund", async ({ page }) => {
    await page.getByTestId("demo-druck-menue").click();
    await expect(page.getByTestId("demo-druck-menue-bon")).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByText("Kein Kassenbeleg zu diesem Auftrag.")).toBeVisible();
    await expect(page.getByTestId("demo-druck-menue-lieferschein")).not.toHaveAttribute("aria-disabled", "true");
  });

  test("An der Kassa: Link mit Kunde und Beleg, ohne Recht nur Text", async ({ page }) => {
    await expect(page.getByTestId("demo-kassa-zahlung-link")).toHaveAttribute("href", /^\/kassa\?kunde=KT-2026-00012&beleg=/);
    await expect(page.getByTestId("demo-kassa-gutschein-link")).toHaveAttribute("href", "/kassa?art=gutschein");
    await expect(page.getByTestId("demo-kassa-ohne-recht")).toContainText("Das erledigt die Kassa.");
    await expect(page.getByTestId("demo-kassa-ohne-recht").getByRole("link")).toHaveCount(0);
  });
});
