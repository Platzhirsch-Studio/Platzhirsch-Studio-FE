// E2E Bereich Logistik (Team B-LOG) gegen den Dev-Server im Mock-Modus. Nicht zerstörend: Abläufe mit
// Mutationen werden über „Rückgängig“ zurückgenommen oder enden vor der Buchung, damit Läufe wiederholbar sind.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/logistik-bereich.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

async function anmelden(page, email = "admin@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

async function axe(page, wo) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
  const schwer = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(schwer.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`), `axe auf ${wo}`).toEqual([]);
}

test.describe("Logistik", () => {
  test.beforeEach(async ({ page }) => {
    await anmelden(page);
  });

  test("Übersicht: Heute zu tun, Kennzahlen, Hauptaktion Zum Packtisch; Auswertung eingeklappt", async ({ page }) => {
    await page.goto("/logistik");
    await expect(page.getByTestId("heute-zu-tun")).toBeVisible();
    await expect(page.getByTestId("kz-zu-packen")).toBeVisible();
    await expect(page.getByRole("link", { name: "Zum Packtisch" })).toBeVisible();
    await expect(page.getByTestId("auswertung")).not.toHaveAttribute("open", "");
    const text = await page.locator("main").innerText();
    for (const wort of ["Uebergeben", "Verfuegbar", "Workflow", "Kindtabelle"]) expect(text).not.toContain(wort);
    await axe(page, "/logistik");
  });

  test("Lieferschein-Akte: genau eine Primäraktion, kein Löschen, Band", async ({ page }) => {
    await page.goto("/logistik/lieferscheine/LS-2026-00012");
    await expect(page.getByTestId("akte")).toBeVisible();
    await expect(page.getByTestId("akte-band")).toContainText("Liefermenge nicht an AB");
    await expect(page.getByTestId("primaer")).toHaveCount(1);
    await expect(page.getByRole("button", { name: /Löschen/ })).toHaveCount(0);
    await expect(page.getByTestId("storno")).toHaveCount(0);
    await axe(page, "Lieferschein-Akte");
  });

  test("Plantafel: Raster, Zuordnen-Sheet zeigt Auslastung danach", async ({ page }) => {
    await page.goto("/logistik/touren");
    await expect(page.getByRole("grid", { name: "Plantafel" })).toBeVisible();
    await page.getByTestId("ablage-karte").first().click();
    const sheet = page.getByTestId("zuordnen-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByTestId("zuordnen-tour").first()).toContainText("→");
  });

  test("Inventur: Freigabe gesperrt mit sichtbarem Grund; Zählmodus erreichbar", async ({ page }) => {
    await page.goto("/logistik/inventur/PH-INV-2026-0002");
    await expect(page.getByTestId("freigabe-gruende")).toContainText("seit Zählbeginn");
    await page.goto("/logistik/inventur/PH-INV-2026-0001/zaehlen");
    await expect(page.getByTestId("zaehlmodus")).toBeVisible();
    await expect(page.getByTestId("zaehl-karte")).toBeVisible();
  });

  test("Bestand gruppiert, Akte ohne „An Kassa verkaufen“", async ({ page }) => {
    await page.goto("/logistik/bestand");
    await expect(page.getByTestId("bestand-gruppen")).toBeVisible();
    await page.goto("/logistik/ausstellung");
    await expect(page.getByText("An Kassa verkaufen")).toHaveCount(0);
  });

  test("Packtisch: Start mit Karten, Pack-Ansicht, Fehlscan als Alarm, Mengen-Rückfrage", { tag: "@kiosk" }, async ({ page }, info) => {
    test.skip(info.project.name === "ipad", "Packtisch ist für iPad quer gebaut (Lounge §12) – läuft in ipad-quer");
    await page.goto("/packtisch");
    await expect(page.getByTestId("packtisch-start")).toBeVisible();
    await expect(page.getByTestId("karte-lieferschein").first()).toBeVisible();
    await page.goto("/packtisch/LS-2026-00002");
    await expect(page.getByTestId("pack-ansicht")).toBeVisible();
    await expect(page.locator("[data-primaer]")).toHaveCount(1);
    const feld = page.getByTestId("pack-scan");
    await expect(async () => {
      await feld.fill("4000000000000");
      await feld.press("Enter");
      await expect(page.getByRole("alert").filter({ hasText: "Falscher Artikel" })).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 30_000 });
    await page.getByRole("button", { name: "Menge erhöhen" }).click();
    await expect(page.getByTestId("pack-menge")).toHaveText("2");
    await feld.fill("9008564001019");
    await feld.press("Enter");
    await expect(page.getByText("2 Stück Bordeaux Glas packen?")).toBeVisible();
    await page.getByRole("button", { name: "Abbrechen" }).click();
    await axe(page, "Pack-Ansicht");
  });
});
