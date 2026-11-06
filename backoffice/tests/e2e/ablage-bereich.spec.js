// E2E Bereich Ablage (B-ABL, Konzept 10-konzept-ablage §13 A1–A10) gegen den Mock-Seed (mock/seed/ablage.js).
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/ablage-bereich.spec.js --project=desktop
// Schreibende Abläufe legen nur Neues an (eindeutige Dateinamen) oder machen ihre Änderung rückgängig.
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";

async function anmelden(page, email = "admin@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

/** Über Ordnerkacheln in „03 Renderings“ des ersten Projekts (Klickzahl T1: 3 Kacheln). */
async function zuRenderings(page) {
  await page.goto("/ablage");
  await page.getByTestId("abl-ordner").filter({ hasText: "Projekte" }).click();
  await page.getByTestId("abl-ordner").filter({ hasText: "Küche am See" }).click();
  await page.getByTestId("abl-ordner").filter({ hasText: "03 Renderings" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "03 Renderings" })).toBeVisible();
}

test.describe("Ablage – Admin", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => anmelden(page));

  test("A1/A2: Ordner per Kachel und Baum, Pfad zurück, Raster ↔ Liste in der URL", async ({ page }) => {
    await zuRenderings(page);
    await expect(page.getByTestId("abl-karte")).toHaveCount(3);
    await expect(page.getByTestId("abl-baum").getByRole("link", { name: /03 Renderings/ })).toHaveAttribute("aria-current", "page");
    await page.getByTestId("abl-ansicht-liste").click();
    await expect(page).toHaveURL(/ansicht=liste/);
    await expect(page.getByTestId("abl-zeile")).toHaveCount(3);
    await page.getByRole("navigation", { name: "Pfad" }).getByRole("link", { name: "Küche am See" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Küche am See" })).toBeVisible();
    await expect(page.getByTestId("abl-ordner")).toHaveCount(8);
  });

  test("A3: Datei ins Vorschau-Panel, Fakten, Esc schließt", async ({ page }) => {
    await zuRenderings(page);
    await page.getByRole("button", { name: /^Rendering Kochinsel Abend\.jpg/ }).click();
    const panel = page.getByTestId("abl-panel");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("heading", { name: "Rendering Kochinsel Abend.jpg" })).toBeVisible();
    await expect(panel.getByText("Im Kundenportal")).toBeVisible();
    await expect(page).toHaveURL(/datei=PH-DAT-/);
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  });

  test("A4/A5: Hochladen per Dateiwahl, Datei erscheint; Papierkorb mit Rückgängig", async ({ page }) => {
    await zuRenderings(page);
    const name = `E2E Notiz ${Date.now()}.txt`;
    await page.getByTestId("abl-datei-input").setInputFiles({ name, mimeType: "text/plain", buffer: Buffer.from(`Prüfinhalt ${name}`) });
    await expect(page.getByTestId("abl-schlange")).toContainText("Hochgeladen", { timeout: 60_000 });
    const karte = page.getByTestId("abl-karte").filter({ hasText: name });
    await expect(karte).toBeVisible();
    await karte.getByRole("button", { name: new RegExp(`^${name.replace(/\./g, "\\.")}`) }).click();
    await page.getByTestId("abl-panel-mehr").click();
    await page.getByTestId("abl-menue-papierkorb").click();
    await expect(page.getByTestId("abl-karte").filter({ hasText: name })).toHaveCount(0);
    await page.getByRole("button", { name: "Rückgängig" }).first().click();
    await expect(page.getByTestId("abl-karte").filter({ hasText: name })).toBeVisible({ timeout: 30_000 });
  });

  test("A6: Beleg – „In den Papierkorb“ gesperrt mit Grund (Aufbewahrungspflicht)", async ({ page }) => {
    await page.goto("/ablage");
    await page.getByTestId("abl-ordner").filter({ hasText: "Projekte" }).click();
    await page.getByTestId("abl-ordner").filter({ hasText: "Küche am See" }).click();
    await page.getByTestId("abl-ordner").filter({ hasText: "04 Angebote" }).click();
    await page.getByRole("button", { name: /^Angebot AN-2026-0012 unterschrieben\.pdf/ }).click();
    await page.getByTestId("abl-panel-mehr").click();
    const punkt = page.getByTestId("abl-menue-papierkorb");
    await expect(punkt).toHaveAttribute("aria-disabled", "true");
    await expect(punkt).toContainText(/Aufbewahrungspflicht bis 31\.12\.\d{4}/);
  });

  test("A7: Teilen – Link erstellen, öffentlich ohne Anmeldung laden, in Freigaben widerrufen", async ({ page, browser }) => {
    await zuRenderings(page);
    await page.getByRole("button", { name: /^Rendering Essplatz\.jpg/ }).click();
    await page.getByTestId("abl-panel-teilen").click();
    const dialog = page.getByTestId("abl-teilen");
    await dialog.getByRole("textbox", { name: "Für wen" }).fill("E2E Tischlerei");
    await dialog.getByTestId("abl-link-erstellen").click();
    const url = await dialog.getByTestId("abl-link-url").inputValue();
    expect(url).toMatch(/\/f\/[A-Za-z0-9_-]{20,}$/);
    await dialog.getByRole("button", { name: "Fertig" }).click();
    const fremd = await browser.newContext();
    const p2 = await fremd.newPage();
    await p2.goto(new URL(url).pathname);
    await expect(p2.getByTestId("abl-f-name")).toHaveText("Rendering Essplatz.jpg");
    const dl = p2.waitForEvent("download");
    await p2.getByTestId("abl-f-laden").click();
    expect((await dl).suggestedFilename()).toBe("Rendering Essplatz.jpg");
    await fremd.close();
    await page.goto("/ablage/freigaben");
    const zeile = page.getByTestId("abl-freigabe-zeile").filter({ hasText: "E2E Tischlerei" }).first();
    await zeile.getByTestId("abl-widerrufen").click();
    await page.getByTestId("abl-widerrufen-frage").getByRole("button", { name: "Widerrufen" }).click();
    await expect(page.getByTestId("abl-freigabe-zeile").filter({ hasText: "E2E Tischlerei" })).toHaveCount(0);
  });

  test("A10: Datei-Akte – Versionen, Freigaben, Details", async ({ page }) => {
    await page.goto("/ablage");
    await page.getByTestId("abl-ordner").filter({ hasText: "Projekte" }).click();
    await page.getByTestId("abl-ordner").filter({ hasText: "Küche am See" }).click();
    await page.getByTestId("abl-ordner").filter({ hasText: "02 Planung" }).click();
    await page.getByRole("button", { name: /^Ansicht Kochinsel\.pdf/ }).dblclick();
    await expect(page.getByRole("heading", { level: 1, name: "Ansicht Kochinsel.pdf" })).toBeVisible();
    await expect(page.getByTestId("abl-band")).toContainText("ausgecheckt");
    await page.getByTestId("abl-reiter-versionen").click();
    await expect(page.getByTestId("abl-versionen").locator(".bo-abl-version")).toHaveCount(3);
    await page.getByTestId("abl-reiter-details").click();
    await expect(page.getByTestId("abl-details")).toContainText("Planung, Kochinsel");
  });
});

test.describe("Ablage – öffentliche Freigabe ohne Anmeldung", () => {
  test.describe.configure({ timeout: 120_000 });

  test("A8: Passwort falsch → Satz, richtig → Download; abgelaufen und ungültig", async ({ page }) => {
    await page.goto("/f/demoAngebotPw0002");
    await page.getByTestId("abl-f-passwort").fill("falsch123");
    await page.getByTestId("abl-f-laden").click();
    await expect(page.getByTestId("abl-f-falsch")).toBeVisible();
    await page.getByTestId("abl-f-passwort").fill("seeblick");
    const dl = page.waitForEvent("download");
    await page.getByTestId("abl-f-laden").click();
    expect((await dl).suggestedFilename()).toMatch(/^Angebot AN-2026-0012/);
    await page.goto("/f/demoAbgelaufen003");
    await expect(page.getByTestId("abl-f-abgelaufen")).toBeVisible();
    await page.goto("/f/gibtEsNicht0000");
    await expect(page.getByTestId("abl-f-ungueltig")).toBeVisible();
    const kopf = await page.request.get("/f/demoKuecheAbend01");
    expect(kopf.headers()["x-robots-tag"]).toContain("noindex");
  });
});

test.describe("Ablage – CRM-Mitarbeiterin", () => {
  test.describe.configure({ timeout: 120_000 });

  test("A9: Personalordner unsichtbar, Bericht ohne Recht gesperrt", async ({ page }) => {
    await anmelden(page, "crm@demo.local");
    await page.goto("/ablage");
    await expect(page.getByTestId("abl-ordner").filter({ hasText: "Projekte" })).toBeVisible();
    await expect(page.getByTestId("abl-ordner").filter({ hasText: "Mitarbeiter" })).toHaveCount(0);
    await page.goto("/ablage/bericht");
    await expect(page).toHaveURL(/kein-zugriff/);
  });
});
