// E2E Zentrale (Team B-ZEN) gegen den Dev-Server im Mock-Modus.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/zentrale-start.spec.js --project=desktop
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

async function axe(page, wo) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
  const schwer = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(schwer.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`), `axe auf ${wo}`).toEqual([]);
}

test.describe("Zentrale (Lounge)", () => {
  test("GF: Begrüßung, Kopfzahlen, Heute-Leiste, Bento mit Heute/Wartet/Aufgaben/Projekten; a11y", async ({ page }) => {
    await anmelden(page, "gf@demo.local");
    await page.goto("/");
    await expect(page.locator("h1")).toContainText(/Guten (Morgen|Tag|Abend),/);
    await expect(page.getByTestId("kennzahlen").locator(".zb-zahl")).toHaveCount(3);
    await expect(page.getByTestId("heute-leiste")).toBeVisible();
    const raster = page.getByTestId("zentrale-raster");
    await expect(raster).toHaveAttribute("data-variante", "gf");
    for (const id of ["heute", "wartet", "aufgaben", "projekte", "aktivitaet"]) await expect(raster.locator(`[data-kachel="${id}"]`)).toBeVisible();
    await expect(page.getByTestId("zentrale-primaer")).toHaveCount(1);
    // Lounge: Kacheln ohne Rahmen
    const rahmen = await raster.locator(".bo-kachel").first().evaluate((el) => getComputedStyle(el).borderTopWidth);
    expect(rahmen).toBe("0px");
    await axe(page, "/");
  });

  test("Admin: Betriebsbereitschaft und Integration; Kanzlei: drei Kacheln ohne Aufgaben", async ({ page }) => {
    await anmelden(page, "admin@demo.local");
    await page.goto("/");
    await expect(page.getByTestId("zentrale-betrieb")).toBeVisible();
    await expect(page.getByTestId("zentrale-betrieb").locator(".zb-pruef__i")).toHaveCount(6);
    await expect(page.getByTestId("zentrale-integration")).toBeVisible();
    await page.context().clearCookies();
    await anmelden(page, "buchhaltung@demo.local");
    await page.goto("/");
    await expect(page.getByTestId("zentrale-raster")).toHaveAttribute("data-variante", "extern");
    await expect(page.getByTestId("zentrale-aufgaben")).toHaveCount(0);
    await expect(page.getByTestId("zentrale-extern-posten")).toBeVisible();
  });

  test("Aufgabe erledigen: Zeile bleibt durchgestrichen stehen, Rückgängig stellt her (Z-13, Z-44)", async ({ page }) => {
    await anmelden(page, "gf@demo.local");
    await page.goto("/aufgaben");
    const zeile = page.locator('[data-testid="aufgabe-zeile"][data-quelle="aufgabe"]').first();
    await expect(zeile).toBeVisible();
    const titel = (await zeile.locator(".zb-auf__titel").innerText()).trim();
    await zeile.getByTestId("aufgabe-haken").click();
    const erledigt = page.locator('[data-testid="aufgabe-zeile"][data-erledigt]').filter({ hasText: titel });
    await expect(erledigt).toBeVisible();
    await page.getByRole("button", { name: "Rückgängig" }).first().click();
    await expect(page.locator('[data-testid="aufgabe-zeile"]:not([data-erledigt])').filter({ hasText: titel })).toBeVisible({ timeout: 10_000 });
  });

  test("Schnellanlage erkennt +3 als Frist-Chip und legt an", async ({ page }) => {
    await anmelden(page, "gf@demo.local");
    await page.goto("/aufgaben?neu=1");
    const feld = page.getByTestId("aufgabe-schnellanlage-feld");
    await feld.fill("E2E Rückruf prüfen +3");
    await expect(page.getByTestId("aufgabe-schnellanlage").locator(".bo-pille")).toContainText("Fällig");
    await feld.press("Enter");
    await expect(feld).toHaveValue("", { timeout: 10_000 });
    await page.goto("/aufgaben?q=E2E%20R%C3%BCckruf");
    await expect(page.getByTestId("aufgabe-zeile").filter({ hasText: "E2E Rückruf prüfen" }).first()).toBeVisible();
  });

  test("Verwaltung-Hub, Einstellungen: Reiter, Testmodus fragt mit echter Wirkung (Z-53), Speicherleiste erst nach Änderung (Z-18)", async ({ page }) => {
    await anmelden(page, "admin@demo.local");
    await page.goto("/verwaltung");
    await expect(page.getByTestId("verwaltung-hub").locator(".bo-kachel")).toHaveCount(5);
    await page.goto("/einstellungen?tab=allgemein");
    await expect(page.getByTestId("einstellungen-reiter")).toBeVisible();
    await page.getByTestId("schalter-testmodus-knopf").click();
    const frage = page.getByRole("alertdialog");
    await expect(frage).toContainText(/Testmodus (aus|ein)schalten\?/);
    await expect(frage).toContainText(/Kartenzahlung|Kunden/);
    await frage.getByRole("button", { name: "Abbrechen" }).click();
    await expect(page.getByTestId("speicherleiste")).toHaveCount(0);
    await page.getByLabel("Team-Postfach").fill("team@beispiel.invalid");
    await expect(page.getByTestId("speicherleiste")).toBeVisible();
    await page.goto("/einstellungen?tab=kalkulation");
    await expect(page.getByTestId("kalkulation")).toBeVisible();
    await axe(page, "/einstellungen?tab=kalkulation");
  });

  test("Mitarbeiterin ohne Schreibrecht sieht Verwaltung nicht in der Navigation (Z-19)", async ({ page }) => {
    await anmelden(page, "marketing@demo.local");
    await page.goto("/");
    await expect(page.locator('a[href="/verwaltung"]')).toHaveCount(0);
  });
});
