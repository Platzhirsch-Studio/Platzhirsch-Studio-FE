// E2E Bereich Personal (B-PER, Konzept § 13.8 Auswahl) gegen den Mock-Seed (mock/seed/personal.js).
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/personal-bereich.spec.js --project=desktop
// Schreibende Abläufe nehmen ihre Wirkung per Rückgängig zurück oder legen nur Neues an, damit der gemeinsame
// Mock-Bestand für andere Läufe gleich bleibt.
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";

async function anmelden(page, email) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

test.describe("Personal – Leitung", () => {
  test.describe.configure({ timeout: 150_000 });
  test.beforeEach(async ({ page }) => anmelden(page, "personal@demo.local"));

  test("Übersicht: Zu erledigen, höchstens vier Kennzahlen, Heute im Haus ohne Uhrzeiten (QA 5, 36)", async ({ page }) => {
    await page.goto("/personal");
    await expect(page.getByRole("heading", { level: 1, name: "Personal" })).toBeVisible();
    await expect(page.getByTestId("per-zuerledigen")).toBeVisible();
    await expect(page.locator('[data-testid^="per-kz-"]')).toHaveCount(4);
    const haus = page.getByTestId("per-heute-im-haus");
    await expect(haus).toBeVisible();
    await expect(haus).not.toContainText(/\b\d{1,2}:\d{2}\b/);
  });

  test("Stempelpille: zwei Klicks bis Kommen, Rückgängig bucht nichts (QA 9, 10)", async ({ page }) => {
    await page.goto("/personal/stellen");
    const pille = page.getByTestId("per-stempelpille");
    await expect(pille).toBeVisible();
    const vorher = (await pille.getAttribute("data-dienst")) === "ja";
    await pille.click();
    await page.getByTestId("per-stempel-knopf").click();
    await expect(pille).toHaveAttribute("data-dienst", vorher ? "nein" : "ja");
    await page.getByRole("button", { name: /Rückgängig/ }).first().click();
    await expect(pille).toHaveAttribute("data-dienst", vorher ? "ja" : "nein");
  });

  test("Bewerbungen: Kanban ohne Sterne, Rohwerte nie sichtbar (QA 28, 34)", async ({ page }) => {
    await page.goto("/personal/bewerbungen");
    await expect(page.getByTestId("per-board")).toBeVisible();
    await expect(page.getByTestId("per-spalte-Gespraech")).toContainText("Gespräch");
    const text = await page.locator("main").innerText();
    for (const roh of ["Gespraech", "Zurueckgezogen", "Durchgefuehrt", "Slug", "Evidenz", "pseudonymisiert"]) expect(text).not.toContain(roh);
    await expect(page.getByTestId("per-board").locator(".lucide-star")).toHaveCount(0);
  });

  test("Bewerberakte: Lebenslauf ohne Klick, Primär „Gespräch planen“, Sichtungsleiste", async ({ page }) => {
    await page.goto("/personal/bewerbungen/PH-BEW-2026-00011?modus=sichten");
    await expect(page.getByTestId("per-dokument")).toBeVisible();
    await expect(page.getByTestId("per-primaer")).toHaveText(/Gespräch planen/);
    await expect(page.getByTestId("per-sichtungsleiste")).toBeVisible();
    await page.getByTestId("per-primaer").click();
    await expect(page.getByTestId("per-gespraech-sheet")).toBeVisible();
    await expect(page.getByTestId("per-slots")).toBeVisible();
  });

  test("Datenschutz: sofort löschen bei offener Bewerbung gesperrt mit Grund (QA 6)", async ({ page }) => {
    await page.goto("/personal/bewerbungen/PH-BEW-2026-00011?tab=datenschutz");
    await expect(page.getByTestId("per-sofort-loeschen")).toBeDisabled();
    await expect(page.getByText("Offene Bewerbungen zuerst abschließen")).toBeVisible();
  });

  test("Stellen: Entwurf ohne Entgelt – Checkliste, Veröffentlichen gesperrt (QA 23)", async ({ page }) => {
    await page.goto("/personal/stellen/installateur-sanitaer-heizung");
    await expect(page.getByTestId("per-glbg-checkliste")).toContainText("Entgelt fehlt");
    await expect(page.getByTestId("per-glbg-checkliste")).toContainText("geschlechtsneutral");
  });

  test("Team: Kalender als Raster, Krankenstand für Leitung sichtbar, Anträge mit Kontext", async ({ page }) => {
    await page.goto("/personal/team");
    const grid = page.getByRole("grid");
    await expect(grid).toBeVisible();
    await expect(grid.getByRole("button", { name: /Simon Demo, .*Krankenstand/ }).first()).toBeVisible();
    await page.goto("/personal/team?ansicht=antraege");
    await expect(page.getByTestId("per-antraege")).toContainText("Vertretung Anna Probe");
    await expect(page.getByTestId("per-antraege")).toContainText("Eine andere Person mit Leitungsrecht entscheidet");
  });
});

test.describe("Personal – Selbstservice", () => {
  test.describe.configure({ timeout: 150_000 });
  test.beforeEach(async ({ page }) => anmelden(page, "selbst@demo.local"));

  test("Übersicht leitet auf Mein Bereich; Bewerbungen → kein Zugriff (QA 1)", async ({ page }) => {
    await page.goto("/personal");
    await expect(page).toHaveURL(/\/personal\/meins$/);
    await expect(page.getByTestId("per-stempelkarte")).toBeVisible();
    await page.goto("/personal/bewerbungen");
    await expect(page).toHaveURL(/kein-zugriff/);
  });

  test("Team-Daten maskiert: keine Gesundheitsbegriffe fremder Personen (QA 4)", async ({ page }) => {
    await page.goto("/personal/meins");
    const team = page.getByTestId("per-meins-team");
    if (await team.count()) {
      const t = await team.innerText();
      for (const w of ["Krank", "Pflege", "Sonderurlaub", "KR"]) expect(t).not.toContain(w);
    }
  });

  test("Urlaub: ein Sheet, Halbtag nur bei einem Tag (QA 17)", async ({ page }) => {
    await page.goto("/personal/meins?sheet=urlaub");
    const sheet = page.getByTestId("per-urlaub-sheet");
    await expect(sheet).toBeVisible();
    await expect(page.getByTestId("per-urlaub-halbtags")).toHaveCount(0);
  });

  test("Meine Zeiten: vergangene Buchung nur „Korrektur beantragen“ (QA 12)", async ({ page }) => {
    await page.goto("/personal/meins/zeiten");
    await expect(page.getByTestId("per-monatstabelle")).toBeVisible();
    await expect(page.locator('[data-testid^="per-korrektur-PH-ZEIT"]').first()).toBeVisible();
  });
});
