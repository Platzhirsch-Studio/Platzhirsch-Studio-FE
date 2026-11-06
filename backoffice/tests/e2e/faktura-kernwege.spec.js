// E2E Bereich Faktura (B-FAK): Kernwege aus 10-konzept-faktura § 1.2 und § 13 im Mock (Dev-Server :3100).
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/faktura-kernwege.spec.js --project=desktop
// Die Mock-Datenbank lebt im Dev-Prozess; mutierende Tests suchen sich passende Belege selbst und überspringen,
// wenn der Bestand schon verbraucht ist (z. B. alle Entwürfe gestellt).
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";

/** Nach dem Laden auf die Hydrierung warten (Klicks vorher landen auf Server-HTML ohne Handler). */
async function bereit(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForFunction(() => document.readyState === "complete");
  await page.waitForTimeout(600);
}

async function anmelden(page, email = "faktura@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

test.describe("Faktura – Kernwege", () => {
  test("Bereichsstart: Zu tun mit einer Aktion je Zeile, vier Kennzahlen, Altersband, Cockpit Vertrieb", async ({ page }) => {
    await anmelden(page);
    await page.goto("/faktura");
    await bereit(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Faktura");
    const zutun = page.getByTestId("faktura-zutun");
    await expect(zutun.locator("[data-zutun-zeile]").first()).toBeVisible({ timeout: 30_000 });
    const zeilen = await zutun.locator("[data-zutun-zeile]").count();
    expect(zeilen).toBeLessThanOrEqual(8);
    for (let i = 0; i < zeilen; i++) await expect(zutun.locator("[data-zutun-zeile]").nth(i).locator("a.bo-knopf, button.bo-knopf, a[class*=bo-knopf], button[class*=bo-knopf]")).toHaveCount(1);
    await expect(page.getByTestId("kennzahlen").locator("> *")).toHaveCount(4);
    await expect(page.getByTestId("altersband")).toBeVisible();
    await expect(page.getByTestId("cockpit").getByRole("link", { name: "Vertrieb" })).toHaveAttribute("href", "/faktura?cockpit=vertrieb");
    await page.goto("/faktura?cockpit=vertrieb");
    await expect(page.getByTestId("kennzahlen")).toContainText("Angebotsquote");
  });

  test("Rechnung stellen: Nummer erst nach dem Stellen, Leistungsdatum ohne Quelle muss bestätigt werden (F-01, U-19)", async ({ page }) => {
    await anmelden(page);
    let gefunden = null;
    for (const n of ["ENTW-2026-00007", "ENTW-2026-00008"]) {
      const r = await page.goto(`/faktura/rechnungen/${n}`);
      if (r.status() === 200 && (await page.getByTestId("rechnung-akte").count())) {
        gefunden = n;
        break;
      }
    }
    test.skip(!gefunden, "Alle Beispiel-Entwürfe sind im laufenden Dev-Prozess schon gestellt.");
    await bereit(page);
    await page.getByTestId("akte-primaer").click();
    const dlg = page.getByTestId("stellen-dialog");
    await expect(dlg).toBeVisible();
    await expect(dlg).not.toContainText(/RE-2026-\d{5}/);
    await expect(dlg).not.toContainText("wird geprüft", { timeout: 15_000 });
    const geprueft = dlg.getByTestId("leistung-geprueft");
    if (await geprueft.count()) {
      await expect(dlg.getByTestId("stellen-primaer")).toBeDisabled();
      await geprueft.click();
      await expect(geprueft).toHaveAttribute("aria-checked", "true");
    }
    await expect(dlg.getByTestId("stellen-primaer")).toBeEnabled({ timeout: 10_000 });
    await dlg.getByTestId("danach-senden").click();
    await dlg.getByTestId("stellen-primaer").click();
    await expect(dlg.getByTestId("ergebnis-karte")).toContainText(/Rechnung RE-2026-\d{5} gestellt/, { timeout: 30_000 });
  });

  test("Zahlung erfassen: nur Überweisung, Betrag vorbelegt, Höchstbetrag geprüft (E2, F-07, F-19)", async ({ page }) => {
    await anmelden(page);
    await page.goto("/faktura/rechnungen?r=offen");
    await bereit(page);
    const knopf = page.getByTestId("rechnungen-liste").getByRole("button", { name: "Zahlung erfassen" }).first();
    test.skip(!(await knopf.count()), "Keine offene Rechnung mit Zahlung im Bestand.");
    await knopf.click();
    const dlg = page.getByTestId("zahlung-dialog");
    await expect(dlg).toBeVisible();
    await expect(dlg).toContainText("Überweisung");
    await expect(dlg).not.toContainText(/\bBar\b(?! oder Karte)/);
    await expect(dlg.getByTestId("an-die-kassa")).toBeVisible();
    const feld = dlg.locator("#z-betrag");
    await feld.fill("99999999,00");
    await feld.blur();
    await expect(dlg).toContainText("Höchstens");
    await expect(dlg.getByTestId("zahlung-buchen")).toBeDisabled();
    await dlg.getByRole("button", { name: "Abbrechen" }).click();
  });

  test("Bank: „Zuordnen“ als verzögerter Commit – Rückgängig holt die Zeile zurück, Enter bucht nie (F-33)", async ({ page }) => {
    await anmelden(page);
    await page.goto("/faktura/bank?r=offen");
    await bereit(page);
    const liste = page.getByTestId("bank-liste");
    const zeile = liste.locator("tbody tr").filter({ has: page.getByRole("button", { name: "Zuordnen", exact: true }) }).first();
    test.skip(!(await zeile.count()), "Kein sicherer Vorschlag mehr offen.");
    const knopf = zeile.getByRole("button", { name: "Zuordnen", exact: true });
    const id = await zeile.getAttribute("data-testid");
    await zeile.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("peek")).toBeVisible();
    await page.keyboard.press("Escape");
    await knopf.click();
    await expect(page.getByTestId(id)).toHaveCount(0);
    await page.getByRole("button", { name: /Rückgängig/ }).first().click();
    await expect(page.getByTestId(id)).toBeVisible({ timeout: 10_000 });
  });

  test("Eingangsrechnung: Kostenzuordnung anteilig live geprüft, Budget-Hinweis, Freigabe erst vollständig", async ({ page }) => {
    await anmelden(page);
    await page.goto("/faktura/eingangsrechnungen/ER-2026-00026?tab=kosten");
    await bereit(page);
    const k = page.getByTestId("kostenzuordnung");
    await expect(k).toBeVisible();
    await expect(k.getByTestId("kosten-status")).toContainText("Offen");
    await expect(k.getByTestId("kosten-summe")).toContainText("nicht zugeordnet");
    await expect(k.getByTestId("kosten-speichern")).toBeDisabled();
    const prozent = k.getByLabel("Prozent Zeile 2");
    await prozent.fill("50");
    await expect(k.getByTestId("kosten-summe")).toContainText("Vollständig zugeordnet");
    await expect(k.getByTestId("kosten-status")).toContainText("Vollständig");
    await expect(k.getByTestId("budget-hinweis")).toBeVisible();
    await expect(k.getByTestId("kosten-speichern")).toBeEnabled();
  });

  test("Steuerberatung: Start im Export, Bank nur lesend, keine Zuordnen-Knöpfe (§ 1.1, E12)", async ({ page }) => {
    await anmelden(page, "buchhaltung@demo.local");
    await page.goto("/faktura");
    await expect(page).toHaveURL(/\/faktura\/export/);
    await page.goto("/faktura/bank");
    await expect(page.getByTestId("bank-liste")).toBeVisible();
    await expect(page.getByTestId("bank-liste").getByRole("button", { name: "Zuordnen" })).toHaveCount(0);
    await expect(page.getByTestId("kopf-import")).toHaveCount(0);
  });
});
