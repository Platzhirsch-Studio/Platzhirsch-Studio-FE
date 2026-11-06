// E2E Bereich Kundenkarte (B-KKA, Konzept §13 K1–K44 Auswahl) gegen den Mock-Seed (mock/seed/kundenkarte.js).
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/kundenkarte-bereich.spec.js --project=desktop
// Schreibende Abläufe sind so gebaut, dass der gemeinsame Mock-Bestand gleich bleibt (Rückgängig, Abbrechen)
// oder nur Neues anlegen (Neue Karte mit eindeutiger E-Mail).
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";

async function anmelden(page, email) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

test.describe("Kundenkarte – Mitarbeiterin", () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ page }) => anmelden(page, "kundenkarte@demo.local"));

  test("Übersicht: Heute-Leiste, Kennzahlen, Zu tun", async ({ page }) => {
    await page.goto("/kundenkarte");
    await expect(page.getByRole("heading", { level: 1, name: "Kundenkarte" })).toBeVisible();
    await expect(page.getByTestId("kk-heute")).toBeVisible();
    await expect(page.getByTestId("kk-kz-aktive")).toBeVisible();
    await expect(page.getByTestId("kk-zutun")).toBeVisible();
  });

  test("K1: Kartennummer in beliebiger Schreibweise + Enter öffnet die Akte; unbekannt → Satz, kein Seitenwechsel", async ({ page }) => {
    await page.goto("/kundenkarte/karten");
    const feld = page.getByTestId("kk-suche-feld");
    await feld.fill("kk7k3qx9");
    await expect(page.getByText("Karte KK-7K3QX9 öffnen ↵")).toBeVisible();
    await feld.press("Enter");
    await page.waitForURL(/\/kundenkarte\/karten\/KK-7K3QX9$/);
    await expect(page.getByRole("heading", { level: 1, name: "Anna Muster" })).toBeVisible();
    await page.goto("/kundenkarte/karten");
    await page.getByTestId("kk-suche-feld").fill("KK-ZZZZZZ");
    await page.getByTestId("kk-suche-feld").press("Enter");
    await expect(page.getByTestId("kk-suche-meldung")).toContainText("Keine Karte KK-ZZZZZZ");
    await expect(page).toHaveURL(/\/kundenkarte\/karten$/);
  });

  test("K4: kein Kanban – ?ansicht=kanban leitet auf die Liste", async ({ page }) => {
    await page.goto("/kundenkarte/antraege?ansicht=kanban");
    await expect(page).toHaveURL(/\/kundenkarte\/antraege$/);
    await expect(page.getByTestId("kk-antraege-reiter")).toBeVisible();
  });

  test("K9/K17: keine Beträge, kein Abschnitt „Intern“, Letzter Einkauf als Monat", async ({ page }) => {
    await page.goto("/kundenkarte/karten/KK-7K3QX9?tab=details");
    await expect(page.getByTestId("kk-details")).toBeVisible();
    await expect(page.getByTestId("kk-betraege")).toHaveCount(0);
    await expect(page.locator("#intern")).toHaveCount(0);
    const html = await page.content();
    expect(html).not.toContain("jahresumsatz_cent");
    expect(html).not.toContain("Bevorzugt Termine am Vormittag");
    await page.goto("/kundenkarte/karten");
    await expect(page.getByTestId("kk-karte-KK-7K3QX9")).toContainText("/2026");
  });

  test("K38: Lieferung nur mit Beleg, Persönliche Beratung auch ohne", async ({ page }) => {
    await page.goto("/kundenkarte/karten/KK-7K3QX9");
    await page.getByTestId("kk-einloesen-knopf-PH-KKV-2026-00004").click();
    const pop = page.getByTestId("kk-einloesen-PH-KKV-2026-00004");
    await expect(pop.getByText("Bitte Auftrag, Lieferschein, Montageauftrag oder Beleg wählen.")).toBeVisible();
    await expect(pop.getByTestId("kk-ohne-beleg")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await page.getByTestId("kk-einloesen-knopf-PH-KKV-2026-00001").click();
    await expect(page.getByTestId("kk-einloesen-PH-KKV-2026-00001").getByTestId("kk-ohne-beleg")).toBeVisible();
  });

  test("K5: Einlösen = ein Klick mit 8 s Rückgängig; Rückgängig legt nichts an", async ({ page }) => {
    await page.goto("/kundenkarte/karten/KK-7K3QX9?tab=verlauf");
    const vorher = await page.getByText("Persönliche Beratung eingelöst").count();
    await page.goto("/kundenkarte/karten/KK-7K3QX9", { waitUntil: "networkidle" });
    const ohne = page.getByTestId("kk-einloesen-PH-KKV-2026-00001").getByTestId("kk-ohne-beleg");
    await expect(async () => {
      if (!(await ohne.isVisible())) await page.getByTestId("kk-einloesen-knopf-PH-KKV-2026-00001").click();
      await expect(ohne).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 30_000 });
    await ohne.click();
    const toast = page.locator(".bo-toast").filter({ hasText: "Persönliche Beratung eingelöst" });
    await expect(toast).toBeVisible();
    await toast.getByRole("button", { name: /Rückgängig/ }).click();
    await expect(toast).toHaveCount(0, { timeout: 10_000 });
    await page.goto("/kundenkarte/karten/KK-7K3QX9?tab=verlauf");
    await expect(page.getByText("Persönliche Beratung eingelöst")).toHaveCount(vorher);
  });

  test("Sperren mit Grund-Pflicht und Rückgängig – Karte bleibt aktiv", async ({ page }) => {
    await page.goto("/kundenkarte/karten/KK-P8D2NV");
    await page.getByTestId("kk-menue").click();
    await page.getByRole("menuitem", { name: /Sperren/ }).click();
    const dlg = page.getByTestId("kk-sperren");
    await dlg.getByRole("button", { name: "Sperren", exact: true }).click();
    await expect(dlg.getByText("Bitte einen Grund wählen.")).toBeVisible();
    await dlg.getByRole("radio", { name: "Kundenwunsch" }).click();
    await dlg.getByRole("button", { name: "Sperren", exact: true }).click();
    const toast = page.locator(".bo-toast").filter({ hasText: "gesperrt" });
    await expect(toast).toBeVisible();
    await toast.getByRole("button", { name: /Rückgängig/ }).click();
    await page.reload();
    await expect(page.getByTestId("kk-primaer")).toContainText("Vorteil einlösen");
  });

  test("K40: Ablehnen ohne Grund geht nicht", async ({ page }) => {
    await page.goto("/kundenkarte/antraege/PH-KKA-2026-00027");
    await page.getByTestId("kk-antrag-menue").click();
    await page.getByRole("menuitem", { name: /Ablehnen/ }).click();
    const dlg = page.getByTestId("kk-ablehnen");
    await dlg.getByRole("button", { name: "Ablehnen", exact: true }).click();
    await expect(dlg.getByText("Bitte einen Grund wählen.")).toBeVisible();
    await dlg.getByRole("radio", { name: "Sonstiges" }).check();
    await dlg.getByRole("button", { name: "Ablehnen", exact: true }).click();
    await expect(dlg.getByText("Bei „Sonstiges“ bitte kurz beschreiben.")).toBeVisible();
    await dlg.getByRole("button", { name: "Abbrechen" }).click();
  });

  test("K37: gleiche E-Mail, anderer Nachname → Hinweisband, kein Auto-Kontakt", async ({ page }) => {
    await page.goto("/kundenkarte/antraege/PH-KKA-2026-00027");
    await expect(page.getByTestId("kk-antrag-band")).toContainText("andere Person?");
    await page.getByTestId("kk-antrag-primaer").click();
    const dlg = page.getByTestId("kk-ausstellen");
    await expect(dlg.getByRole("radio", { checked: true })).toHaveCount(0);
    await expect(dlg.getByTestId("kk-ausstellen-knopf")).toBeDisabled();
    await dlg.getByRole("button", { name: "Abbrechen" }).click();
  });

  test("K2/K24: Neue Karte im Showroom – Haken Pflicht, Ergebnis mit Nummer", async ({ page }) => {
    await page.goto("/kundenkarte/karten/neu");
    const knopf = page.getByTestId("kk-neu-ausstellen");
    await expect(knopf).toBeDisabled();
    const id = Date.now();
    await page.getByTestId("kk-neu-vorname").fill("Test");
    await page.getByTestId("kk-neu-nachname").fill(`Probe${id}`);
    await page.getByTestId("kk-neu-email").fill(`test.${id}@beispiel.invalid`);
    await expect(knopf).toBeDisabled();
    for (const h of ["teilnahme", "datenschutz", "volljaehrig"]) await page.getByTestId(`kk-neu-${h}`).check();
    await expect(knopf).toBeEnabled();
    await knopf.click();
    await expect(page.getByTestId("kk-neu-ergebnis")).toContainText(/Karte KK-[A-Z0-9]{6} ausgestellt/);
  });

  test("K16: Bericht „Kundenwert“ nicht gelistet, Direktaufruf → nicht gefunden", async ({ page }) => {
    await page.goto("/kundenkarte/berichte");
    await expect(page.getByTestId("kk-bericht-stufenwechsel")).toBeVisible();
    await expect(page.getByTestId("kk-bericht-kundenwert")).toHaveCount(0);
    await page.goto("/kundenkarte/berichte/kundenwert");
    await expect(page.getByRole("heading", { name: "Seite nicht gefunden" })).toBeVisible();
  });
});

test.describe("Kundenkarte – Leitung (Admin)", () => {
  test.beforeEach(async ({ page }) => anmelden(page, "admin@demo.local"));

  test("Beträge hinter „Beträge zeigen“, Intern sichtbar", async ({ page }) => {
    await page.goto("/kundenkarte/karten/KK-7K3QX9");
    await page.getByTestId("kk-betraege").click();
    await expect(page.getByTestId("kk-betraege-text")).toContainText("Umsatz letzte 12 Monate");
    await page.goto("/kundenkarte/karten/KK-4HRW7C?tab=details");
    await expect(page.locator("#intern")).toBeVisible();
  });

  test("K11: Live-Textprüfung im Vorteil-Sheet", async ({ page }) => {
    await page.goto("/kundenkarte/stufen");
    await page.getByTestId("kk-stufenplan").getByRole("button", { name: /Pflegetermin im Jahr/ }).first().click();
    const sheet = page.getByTestId("kk-vorteil-sheet");
    const feld = sheet.getByTestId("kk-vorteil-text");
    await feld.fill("Jetzt 10 % Rabatt");
    await expect(sheet.getByText(/keine Beträge, Prozente oder Rabatte/)).toBeVisible();
    await feld.fill("Ein Gutschein für Sie");
    await expect(sheet.getByText(/keine Gutscheine/)).toBeVisible();
  });

  test("Dubletten-Reiter zeigt die doppelte Karte", async ({ page }) => {
    await page.goto("/kundenkarte/karten?reiter=dubletten");
    await expect(page.getByTestId("kk-karten-liste")).toContainText("Tobias Demo");
  });
});

test.describe("Kundenkarte – Kassa ohne Bereich", () => {
  test("K17: Kassa-Rolle – Akte 404, Bereich kein Zugriff", async ({ page }) => {
    await anmelden(page, "kassa@demo.local");
    await page.goto("/kundenkarte/karten/KK-7K3QX9");
    await expect(page.getByTestId("kk-404")).toBeVisible();
    await expect(page.getByText("Anna Muster")).toHaveCount(0);
    await page.goto("/kundenkarte");
    await expect(page).toHaveURL(/kein-zugriff/);
  });
});
