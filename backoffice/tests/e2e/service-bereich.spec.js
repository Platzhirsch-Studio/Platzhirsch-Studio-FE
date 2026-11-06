// E2E Bereich Service (Team B-SER, 10-konzept-service §10/§14.7) im Mock gegen den Dev-Server :3100.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/service-bereich.spec.js --project=desktop
// Datensätze aus dem festen Service-Seed (Bezugstag 04.11.2026). Tests, die schreiben, legen eigene Daten an.
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";

async function anmelden(page, email = "admin@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

function fehlerSammler(page) {
  const fehler = [];
  page.on("pageerror", (e) => fehler.push(e.message));
  return fehler;
}

test.describe("Service", () => {
  test.setTimeout(180_000);

  test("Bereichsstart: Heute-Leiste, Jetzt dran, genau eine Hauptaktion", async ({ page }) => {
    const fehler = fehlerSammler(page);
    await anmelden(page);
    await page.goto("/service");
    await expect(page.getByRole("heading", { level: 1, name: "Service" })).toBeVisible();
    await expect(page.getByTestId("heute-leiste")).toBeVisible();
    await expect(page.getByTestId("jetzt-dran").locator("li").first()).toBeVisible();
    await expect(page.getByTestId("seitenkopf").locator(".bo-knopf--primary:visible")).toHaveCount(1);
    await expect(page.getByTestId("akzent-reaktion")).toBeVisible();
    expect(fehler).toEqual([]);
  });

  test("Servicefälle: Tabelle, Suche, Reiter, Kanban mit „Entschieden“", async ({ page }) => {
    await anmelden(page);
    await page.goto("/service/faelle");
    await expect(page.getByTestId("faelle-tabelle")).toBeVisible();
    await page.getByTestId("faelle-suche").fill("Ledersessel");
    await page.getByTestId("faelle-suche").press("Enter");
    await expect(page).toHaveURL(/q=Ledersessel/);
    await expect(page.getByTestId("faelle-tabelle").getByText("Ledersessel Lounge").first()).toBeVisible();
    await page.goto("/service/faelle?reiter=reaktion");
    await expect(page.getByTestId("faelle-tabelle").or(page.getByTestId("faelle-leer"))).toBeVisible();
    await page.goto("/service/faelle?ansicht=kanban");
    await expect(page.getByTestId("service-kanban")).toBeVisible();
    await expect(page.getByTestId("service-kanban").getByText("Entschieden").first()).toBeVisible();
  });

  test("Akte: Phasen, Reiter in der URL, Prüfen-Sheet über ?aktion=", async ({ page }) => {
    await anmelden(page);
    await page.goto("/service/faelle/PH-SRV-2026-00018");
    await expect(page.getByTestId("phasenleiste").locator('[aria-current="step"]')).toHaveCount(1);
    await expect(page.getByTestId("akte-band")).toContainText("Kulanz");
    await page.getByTestId("akte-tab-mangel").click();
    await expect(page).toHaveURL(/tab=mangel/);
    await expect(page.getByTestId("fristband").first()).toBeVisible();
    await page.goto("/service/faelle/PH-SRV-2026-00017?aktion=pruefen");
    await expect(page.getByTestId("sheet-pruefen")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Abgelehnt" })).toBeVisible();
  });

  test("S1-Schnell: Servicefall melden legt einen Fall an", async ({ page }) => {
    // Admin: PH Service Mitarbeiter hat laut ph_crm kein Leserecht auf PH Kontakt (Backend-Lücke, Übergabe B-SER).
    await anmelden(page);
    await page.goto("/service/faelle?melden=1");
    const sheet = page.getByTestId("melden-sheet");
    await expect(sheet).toBeVisible();
    await sheet.getByTestId("melden-anlegen").click();
    await expect(sheet.getByText("Bitte ausfüllen.").first()).toBeVisible();
    await sheet.getByTestId("kontakt-suche").fill("Muster");
    await sheet.locator('[role="option"]').first().click();
    await expect(sheet.getByTestId("kontakt-gewaehlt")).toBeVisible();
    await sheet.getByTestId("fehler-combobox").fill("POL-03");
    await sheet.locator('[role="option"]').first().click();
    await sheet.getByTestId("melden-beschreibung").fill("E2E: Naht am Rücken offen.");
    await sheet.getByTestId("melden-anlegen").click();
    await expect(page.getByText(/PH-SRV-2026-\d+ angelegt/).first()).toBeVisible({ timeout: 30_000 });
  });

  test("Einsätze: Woche je Techniker, A14 erst nach Fensterwahl weiter", async ({ page }) => {
    await anmelden(page);
    await page.goto("/service/einsaetze");
    await expect(page.getByTestId("einsatz-woche")).toBeVisible();
    await page.goto("/service/einsaetze/neu?fall=PH-SRV-2026-00022");
    await expect(page.getByTestId("a14-zeit")).toBeVisible();
    await expect(page.getByTestId("a14-weiter")).toBeDisabled();
    await page.getByTestId("a14-zeit").locator(".bo-svc-fenster button").first().click();
    await expect(page.getByTestId("a14-weiter")).toBeEnabled();
    await page.getByTestId("a14-weiter").click();
    await expect(page.getByTestId("a14-mitnehmen")).toBeVisible();
  });

  test("Ersatzteile: Bestand würde negativ → Feldfehler, nichts gebucht", async ({ page }) => {
    await anmelden(page);
    await page.goto("/service/ersatzteile/PH-ET-00008");
    await page.getByTestId("bewegung-knopf").click();
    const d = page.getByTestId("dialog-bewegung");
    await d.getByRole("radio", { name: "Verbrauch" }).click();
    await d.getByRole("spinbutton").fill("99");
    await d.getByTestId("bewegung-ok").click();
    await expect(d.getByText(/negativ/)).toBeVisible();
  });

  test("Technik mobil: Heute-Karten und Einsatz-Karte mit genau einem Primärknopf", async ({ page }) => {
    await anmelden(page, "techniker@demo.local");
    await page.goto("/technik");
    await expect(page.getByTestId("technik-karte").first()).toBeVisible();
    await page.goto("/technik/einsatz/PH-SRE-2026-00010");
    await expect(page.getByTestId("technik-primaer")).toHaveCount(1);
    await expect(page.getByText("Zahlung vor Ort: nur per Rechnung oder über die Kassa.")).toBeVisible();
  });

  test("Alle Service-Routen laden ohne Seitenfehler", async ({ page }) => {
    const fehler = fehlerSammler(page);
    await anmelden(page);
    for (const pfad of ["/service/einsaetze?ansicht=kanban", "/service/einsaetze?ansicht=liste", "/service/einsaetze/PH-SRE-2026-00007", "/service/ersatzteile?ansicht=bestellungen", "/service/ersatzteile/bestellungen/PH-ETB-2026-00008", "/service/regress", "/service/regress/PH-REG-2026-00009", "/service/vertraege", "/service/vertraege?art=auftraege", "/service/vertraege/pflege/PFL-2026-00007", "/service/vertraege/auftraege/PH-SA-2026-00009", "/service/fehlerkatalog", "/service/berichte/quote", "/service/berichte/fristen", "/service/einstellungen", "/service/faelle/neu"]) {
      const r = await page.goto(pfad);
      expect(r?.status(), pfad).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
    }
    await page.goto("/service/pflege-abos");
    await expect(page).toHaveURL(/\/service\/vertraege\?art=pflege/);
    expect(fehler).toEqual([]);
  });
});
