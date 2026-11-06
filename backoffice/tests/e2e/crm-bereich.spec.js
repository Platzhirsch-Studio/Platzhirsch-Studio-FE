// E2E Bereich CRM (Team B-CRM) im Mock-Modus (:3100). Prüft die Hauptwege aus 10-konzept-crm § 1.2 ab /crm,
// die Lounge-Bausteine (Kachel, Akte, Kundenreise) und dass Glossar-Verbote nicht im DOM stehen.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/crm-bereich.spec.js --project=desktop
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";
const VERBOTEN = /Qualifizieren|Qualifiziert|Posteingang|Trichter|Studio|Beratungsgespraech|Bestaetigt|Unbestaetigt|Wiedervorlage/;

async function anmelden(page, email = "crm-leitung@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

async function ohneVerboteneWoerter(page) {
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(VERBOTEN);
}

test.describe("CRM", () => {
  test.beforeEach(async ({ page }) => {
    await anmelden(page);
  });

  test("Übersicht: Zu erledigen mit je einem Knopf, Mein Tag, Heute-Zeile", async ({ page }) => {
    await page.goto("/crm");
    await expect(page.getByRole("heading", { level: 1, name: "CRM" })).toBeVisible();
    const liste = page.getByTestId("crm-zu-erledigen");
    await expect(liste).toBeVisible({ timeout: 30_000 });
    const zeile = liste.getByTestId("crm-zeile").first();
    await expect(zeile.getByRole("button").or(zeile.getByRole("link")).first()).toBeVisible();
    await expect(page.getByTestId("crm-heute")).toBeVisible();
    await ohneVerboteneWoerter(page);
  });

  test("Anfragen: Liste in Kachel, Annehmen mit Rückgängig, Akte mit Vorgang", async ({ page }) => {
    await page.goto("/crm/anfragen?sicht=neu");
    const liste = page.getByTestId("crm-anfragen-liste");
    await expect(liste).toBeVisible({ timeout: 30_000 });
    const radius = await liste.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
    expect(radius).toBeGreaterThanOrEqual(24);
    const erste = liste.getByTestId("crm-anfrage-zeile").first();
    const name = await erste.getAttribute("data-name");
    await page.waitForLoadState("networkidle");
    await erste.getByTestId("crm-zeile-annehmen").click();
    await expect(page.getByText("Anfrage angenommen")).toBeVisible({ timeout: 60_000 });
    await ohneVerboteneWoerter(page);
    await page.goto(`/crm/anfragen/${name}`);
    await expect(page.getByTestId("crm-anfrage-akte")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[aria-current="step"]').first()).toBeVisible();
    await ohneVerboteneWoerter(page);
  });

  test("Neue Anfrage: Pflichtfelder, Anlegen, Akte öffnet", async ({ page }) => {
    await page.goto("/crm/anfragen");
    await page.getByTestId("crm-neue-anfrage-knopf").click();
    const dialog = page.getByTestId("crm-neue-anfrage");
    await expect(dialog).toBeVisible();
    await dialog.getByTestId("crm-neue-anfrage-senden").click();
    await expect(dialog.getByText("Bitte einen Nachnamen angeben.")).toBeVisible();
    await dialog.getByTestId("crm-na-nachname").fill("Testanlage");
    await dialog.getByTestId("crm-na-email").fill("test.anlage@beispiel.invalid");
    await dialog.getByTestId("crm-na-anliegen").fill("E2E: Beratung Wohnzimmer");
    await dialog.getByRole("button", { name: "Anlegen und öffnen" }).click();
    await page.waitForURL(/\/crm\/anfragen\/PH-ANF-/, { timeout: 90_000 });
    await expect(page.getByTestId("crm-anliegen")).toContainText("Beratung Wohnzimmer");
  });

  test("Kundenakte: Hero mit Glas-Kacheln, Kundenreise mit einer aktuellen Stufe, Details, Verlauf", async ({ page }) => {
    await page.goto("/crm/kontakte");
    const zeile = page.getByTestId("crm-kontakt-zeile").first();
    await expect(zeile).toBeVisible({ timeout: 30_000 });
    await page.goto(await zeile.getByRole("link").first().getAttribute("href"), { timeout: 120_000 });
    await expect(page.getByTestId("crm-kundenakte")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(".bo-glas-kachel")).toHaveCount(4);
    await expect(page.getByTestId("crm-kontakt-details")).toBeVisible();
    await page.getByTestId("akte-tab-aktivitaet").click();
    await expect(page).toHaveURL(/tab=aktivitaet/, { timeout: 60_000 });
    await expect(page.getByTestId("crm-composer")).toBeVisible({ timeout: 60_000 });
    await ohneVerboteneWoerter(page);
  });

  test("Termin anlegen (A1): Slot wählen, anlegen, Termin-Akte", async ({ page }) => {
    await page.goto("/crm/kontakte");
    await page.goto(await page.getByTestId("crm-kontakt-zeile").first().getByRole("link").first().getAttribute("href"), { timeout: 120_000 });
    await page.getByTestId("crm-akte-termin").click();
    const a1 = page.getByTestId("crm-a1");
    await expect(a1).toBeVisible();
    const slot = a1.getByTestId("crm-slots").locator("button[data-slot]").first();
    await expect(slot).toBeVisible({ timeout: 20_000 });
    await slot.click();
    await a1.getByTestId("crm-a1-anlegen").click();
    await page.waitForURL(/\/crm\/termine\/PH-TER-/, { timeout: 90_000 });
    await expect(page.getByTestId("crm-termin-akte")).toBeVisible();
  });

  test("Gesprächsprotokoll: Raum hinzufügen speichert automatisch, Kundenansicht blendet Internes aus", async ({ page }) => {
    await page.goto("/crm/gespraeche?sicht=alle");
    await page.goto(await page.getByTestId("crm-gespraech-zeile").first().getByRole("link").first().getAttribute("href"), { timeout: 120_000 });
    await expect(page.getByTestId("crm-protokoll")).toBeVisible({ timeout: 60_000 });
    const vorher = await page.getByTestId("crm-raumkarte").count();
    const chip = page.getByTestId("crm-raum-Bad");
    if (await chip.isVisible()) {
      await chip.click();
      await expect(page.getByTestId("crm-raumkarte")).toHaveCount(vorher + 1);
      await expect(page.getByTestId("crm-speicheranzeige")).toContainText(/Gespeichert/, { timeout: 15_000 });
    }
    await page.getByTestId("crm-kundenansicht").click();
    await expect(page.locator("[data-intern]").first()).toBeHidden();
  });

  test("E-Mails: Live-Liste ohne das Wort Posteingang, Zuordnen entfernt die Mail", async ({ page }) => {
    await page.goto("/posteingang");
    await expect(page.getByRole("heading", { level: 1, name: "E-Mails" })).toBeVisible({ timeout: 30_000 });
    await ohneVerboteneWoerter(page);
    await page.getByRole("radio", { name: /Mehrere Kontakte/ }).click();
    const zeilen = page.getByTestId("crm-mail-zeile");
    const anzahl = await zeilen.count();
    test.skip(anzahl === 0, "keine offenen Beispiel-Mails mit Vorschlag mehr (Mock-Zustand bis Neustart)");
    await zeilen.first().click();
    await page.getByTestId("crm-mail-vorschlag").first().click();
    await expect(zeilen).toHaveCount(anzahl - 1, { timeout: 30_000 });
  });

  test("Termine, Berichte, Datenschutz, Einstellungen laden ohne Fehler", async ({ page }) => {
    for (const [pfad, id] of [["/crm/termine", "crm-termine-kalender"], ["/crm/termine?ansicht=liste", "crm-termine-liste"], ["/crm/berichte", "crm-berichte"], ["/crm/datenschutz", "crm-datenschutz-liste"], ["/crm/einstellungen", "crm-verfuegbarkeit"]]) {
      await page.goto(pfad);
      await expect(page.getByTestId(id)).toBeVisible({ timeout: 30_000 });
      await ohneVerboteneWoerter(page);
    }
  });
});
