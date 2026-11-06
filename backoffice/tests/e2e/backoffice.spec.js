// E2E des Backoffice-Fundaments gegen den laufenden Dev-Server (:3100, Mock-Modus).
//   PW_WORKERS=1 npx playwright test -c playwright.config.js --project=desktop --project=ipad
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

async function anmelden(page, email = "gf@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

async function axe(page, testInfo, pfad) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
  const schwer = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  await testInfo.attach(`axe-${pfad.replace(/\W+/g, "_")}.json`, { body: JSON.stringify(r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })), null, 2), contentType: "application/json" });
  expect(schwer.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`), `axe serious/critical auf ${pfad}`).toEqual([]);
}

test.describe("Backoffice-Fundament", () => {
  test("ohne Sitzung → Login; API ohne Sitzung 401; Zentrale, Login-Fehler", async ({ page, request }) => {
    await page.goto("/");
    await page.waitForURL(/\/login/, { timeout: 60_000 });
    const api = await request.get("/api/suche?q=x");
    expect(api.status()).toBe(401);
    await page.getByLabel("E-Mail").fill("gf@demo.local");
    await page.getByLabel("Passwort").fill("falsch");
    await page.getByTestId("login-senden").click();
    await expect(page.getByTestId("login-fehler")).toContainText("stimmen nicht");
  });

  test("Login als Demo-GF: Dashboard rendert Kennzahlen, Charts, Aufgaben, Aktivität; a11y", async ({ page }, testInfo) => {
    await anmelden(page);
    // GF darf alle Arbeitsplätze? Nein (nur Backoffice) → landet direkt auf /
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("testband")).toBeVisible();
    await expect(page.getByTestId("kennzahlen").locator("a, div").filter({ hasText: "Offene Anfragen" }).first()).toBeVisible();
    await expect(page.locator("figure").filter({ hasText: "Anfragen je Woche" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Meine Aufgaben" })).toBeVisible();
    await expect(page.getByTestId("aktivitaet").locator("li").first()).toBeVisible();
    await axe(page, testInfo, "/");
  });

  test("generische Liste: Filter, Sortierung, Paging, Spaltenwahl; Formular öffnen", async ({ page }, testInfo) => {
    await anmelden(page, "crm-leitung@demo.local");
    await page.goto("/d/ph-anfrage");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Anfrage");
    const gesamt = Number((await page.getByTestId("tabelle-gesamt").innerText()).match(/\d+/)[0]);
    expect(gesamt).toBeGreaterThan(10);
    await page.getByRole("button", { name: "Neu", exact: true }).first().click();
    await expect(page).toHaveURL(/status=Neu/);
    const neu = Number((await page.getByTestId("tabelle-gesamt").innerText()).match(/\d+/)[0]);
    expect(neu).toBeLessThan(gesamt);
    await page.getByRole("link", { name: /^Eingang/ }).click();
    await expect(page).toHaveURL(/sort=eingang/);
    await page.getByRole("button", { name: "Spalten" }).click();
    await page.getByLabel("Art", { exact: true }).uncheck();
    await expect(page.getByRole("columnheader", { name: "Art" })).toHaveCount(0);
    await page.getByTestId("csv-export").isVisible();
    await axe(page, testInfo, "/d/ph-anfrage");
    await page.locator("tbody tr").first().getByRole("link").first().click();
    await expect(page).toHaveURL(/\/d\/ph-anfrage\/PH-ANF-/);
    await expect(page.getByTestId("workflow-leiste")).toBeVisible();
    await expect(page.getByTestId("formular")).toBeVisible();
    await expect(page.getByText("Verlauf")).toBeVisible();
    await axe(page, testInfo, "/d/ph-anfrage/<name>");
  });

  test("Formular: neue Anfrage anlegen (Pflichtfelder, Speichern), Workflow-Aktion, Druckansicht", async ({ page }) => {
    await anmelden(page, "crm@demo.local");
    await page.goto("/d/ph-anfrage/neu");
    await page.getByTestId("speichern").click();
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
    await page.getByLabel(/^Nachname/).fill("Testner");
    await page.getByLabel(/^E-Mail/).fill("e2e@beispiel.invalid");
    await page.getByLabel(/^Eingang/).fill("2026-11-04T10:00");
    await page.getByLabel(/Anliegen/).fill("E2E-Anfrage aus dem Test.");
    await page.getByTestId("speichern").click();
    await expect(page).toHaveURL(/\/d\/ph-anfrage\/PH-ANF-2026-\d+$/, { timeout: 30_000 });
    await expect(page.getByTestId("workflow-leiste")).toContainText("Neu");
    await page.getByRole("button", { name: "Qualifizieren" }).click();
    await expect(page.getByTestId("workflow-leiste")).toContainText("Qualifiziert", { timeout: 20_000 });
    const [druck] = await Promise.all([page.waitForEvent("popup"), page.getByRole("link", { name: "Drucken" }).click()]);
    await druck.waitForLoadState();
    await expect(druck.getByText(/Vorschau aus Beispieldaten/)).toBeVisible();
  });

  test("Kanban: Karte per Tastatur-Alternative verschieben", async ({ page }) => {
    await anmelden(page, "crm-leitung@demo.local");
    await page.goto("/d/ph-aufgabe?ansicht=kanban");
    const board = page.getByTestId("kanban");
    await expect(board).toBeVisible();
    const offen = board.locator('section[data-spalte="Offen"]');
    const inArbeit = board.locator('section[data-spalte="In Arbeit"]');
    // Vorbedingung im langlebigen Mock-Speicher: mindestens eine Karte in „Offen“ –
    // sonst eine aus „In Arbeit“ per Tastatur (Pfeil links) zurückholen.
    if ((await offen.getByTestId("kanban-karte").count()) === 0) {
      const zurueck = inArbeit.getByTestId("kanban-karte").first();
      const zName = (await zurueck.locator("span").nth(1).innerText()).trim();
      await zurueck.focus();
      await page.keyboard.press("ArrowLeft");
      await expect(offen).toContainText(zName, { timeout: 20_000 });
    }
    const vorher = await offen.getByTestId("kanban-karte").count();
    expect(vorher).toBeGreaterThan(0);
    const karte = offen.getByTestId("kanban-karte").first();
    const name = (await karte.locator("span").nth(1).innerText()).trim();
    await karte.getByRole("button", { name: /verschieben/ }).click();
    await page.getByRole("menuitem", { name: "In Arbeit" }).click();
    await expect(inArbeit).toContainText(name, { timeout: 20_000 });
    await expect(offen.getByTestId("kanban-karte")).toHaveCount(vorher - 1);
    // Tastatur: dieselbe Karte mit Pfeil links zurück nach „Offen“ (stellt den Ausgangszustand wieder her).
    const verschoben = inArbeit.locator(`[data-karte="${name}"]`);
    await verschoben.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(offen).toContainText(name, { timeout: 20_000 });
    await expect(offen.getByTestId("kanban-karte")).toHaveCount(vorher);
  });

  test("Befehlspalette: öffnen per Tastatur, Bereich und Datensatz finden", async ({ page }) => {
    await anmelden(page);
    await expect(page.getByTestId("palette-oeffnen")).toBeVisible();
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("Control+k");
    const eingabe = page.getByTestId("palette-eingabe");
    await expect(eingabe).toBeFocused();
    await expect(page.getByRole("option", { name: /Dashboard/ })).toBeVisible();
    await eingabe.fill("PH-ANF-2026-00001");
    await expect(page.getByRole("option", { name: /PH-ANF-2026-00001/ })).toBeVisible({ timeout: 20_000 });
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/d\/ph-anfrage\/PH-ANF-2026-00001/);
  });

  test("Rechte: Shop-Mitarbeiter sieht kein CRM; Bereichs-Startseite; Einstellungen nur lesend", async ({ page }) => {
    await anmelden(page, "shop@demo.local");
    await page.goto("/d/ph-anfrage");
    await expect(page).toHaveURL(/kein-zugriff/);
    await page.goto("/shop");
    await expect(page.getByTestId("bereich-kacheln")).toBeVisible();
    await page.goto("/einstellungen");
    await expect(page.getByTestId("speichern")).toHaveCount(0);
  });

  test("Arbeitsplätze (Nr. 49): Kassa-Mitarbeiter wählt, Kiosk-Shell rendert, Bedienerwechsel per PIN", async ({ page }, testInfo) => {
    await anmelden(page, "kassa@demo.local");
    await expect(page).toHaveURL(/\/arbeitsplatz$/);
    await expect(page.getByTestId("arbeitsplaetze").getByRole("button")).toHaveCount(2);
    await page.getByRole("button", { name: /Kassa/ }).click();
    await expect(page).toHaveURL(/\/kassa$/);
    await expect(page.getByTestId("kiosk-inhalt")).toBeVisible();
    await expect(page.getByText("verbunden")).toBeVisible();
    await axe(page, testInfo, "/kassa");
    await page.getByTestId("bedienerwechsel").click();
    await expect(page).toHaveURL(/\/wechsel$/);
    await page.getByLabel(/Julia Schema/).check();
    await page.getByLabel(/^PIN/).fill("4102");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await expect(page).toHaveURL(/\/kassa$/, { timeout: 30_000 });
    await expect(page.getByText("Julia Schema")).toBeVisible();
  });

  test("Abmelden beendet die Sitzung", async ({ page }) => {
    await anmelden(page);
    await page.getByTestId("benutzer-menu").click();
    await page.getByTestId("abmelden").click();
    await expect(page).toHaveURL(/\/login\?abgemeldet=1/);
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
