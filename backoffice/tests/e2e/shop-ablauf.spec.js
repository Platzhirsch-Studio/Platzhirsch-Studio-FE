// E2E Bereich Shop (B-SHO; 10-konzept-shop § 12): Übersicht, Liste mit Nächstem Schritt, Akte mit Primäraktion und
// Rückgängig (8 s, nichts ausgeführt), Kanban-Regeln, Neue Bestellung mit E-Mail-Tipp, Geldprüfung (E4), RKSV (E1),
// Rechte (Stripe/Einstellungen nur Leitung). Mock-Modus :3100; Zustand bleibt unverändert (alles zurückgenommen).
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/shop-ablauf.spec.js --project=desktop
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";

async function anmelden(page, email = "admin@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

test.describe("Shop", () => {
  test("Übersicht: Zu tun, zwei Akzentkacheln, Kennzahlen, Lounge-Kacheln ohne Rahmen", async ({ page }) => {
    await anmelden(page);
    await page.goto("/shop");
    await expect(page.getByRole("heading", { level: 1, name: "Shop" })).toBeVisible();
    await expect(page.getByTestId("kachel-zutun")).toBeVisible();
    await expect(page.getByTestId("akzent-packen")).toBeVisible();
    await expect(page.getByTestId("akzent-abholung")).toBeVisible();
    const k = await page.getByTestId("kachel-zutun").evaluate((n) => ({ rand: getComputedStyle(n).borderTopWidth, schatten: getComputedStyle(n).boxShadow !== "none" }));
    expect(k.rand).toBe("0px");
    expect(k.schatten).toBe(true);
    // Klickzahl § 1.1: Zu packen (1) → Liste gefiltert
    await page.getByTestId("akzent-packen").click();
    await expect(page).toHaveURL(/ansicht=zu-packen/);
    await expect(page.getByTestId("shop-zeile").first()).toBeVisible();
  });

  test("Liste: Nächster Schritt je Zeile, Vorschau per URL, Filter in der URL", async ({ page }) => {
    await anmelden(page);
    await page.goto("/shop/bestellungen?ansicht=zu-packen");
    const zeile = page.locator('[data-testid="shop-zeile"][data-name="PH-S-261104-00012"]');
    await expect(zeile).toContainText("Risiko ansehen");
    await page.goto("/shop/bestellungen?panel=PH-S-261104-00012");
    await expect(page.getByTestId("vorschau")).toContainText("Anna Beispiel");
    await page.getByTestId("shop-suche").fill("PH-S-261103-00009");
    await page.getByTestId("shop-suche").press("Enter");
    await expect(page).toHaveURL(/q=PH-S-261103-00009/);
    await expect(page.getByTestId("shop-zeile")).toHaveCount(1);
  });

  test("Akte: Packen als verzögerter Commit, Rückgängig nimmt zurück (Q-C2/Q-C3)", async ({ page }) => {
    await anmelden(page);
    await page.goto("/shop/bestellungen/PH-S-261104-00012");
    await expect(page.getByTestId("bestellakte")).toBeVisible();
    await expect(page.getByTestId("akte-band")).toContainText("Stripe-Prüfung");
    await expect(page.getByTestId("phasen")).toContainText("Versandbereit");
    await page.getByTestId("primaeraktion").click();
    const toast = page.getByText(/wird gepackt/).first();
    await expect(toast).toBeVisible();
    await page.getByRole("button", { name: /Rückgängig/ }).first().click();
    await page.reload();
    await expect(page.getByTestId("primaeraktion")).toContainText("Packen");
  });

  test("Geldprüfung E4 und RKSV E1: unbezahlte Abholung ohne Übergeben, Zahlung nur Überweisung", async ({ page }) => {
    await anmelden(page);
    await page.goto("/shop/bestellungen/PH-S-261029-00002");
    await expect(page.getByTestId("primaeraktion")).toContainText("An der Kassa kassieren");
    await expect(page.getByTestId("aktion-uebergeben")).toHaveCount(0);
    await page.goto("/shop/bestellungen/PH-S-261103-00009");
    await page.getByTestId("aktion-zahlung-erfassen").click();
    const d = page.getByTestId("dialog-zahlung");
    await expect(d).toBeVisible();
    await expect(d).toContainText("Überweisung eingegangen");
    await expect(d).not.toContainText(/\bBar\b(?! oder Karte)/);
    await expect(d.getByTestId("an-die-kassa")).toBeVisible();
    await expect(d.getByTestId("zahlung-buchen")).toBeDisabled();
    await page.keyboard.press("Escape");
  });

  test("Neue Telefonbestellung: E-Mail-Tipp und ohne E-Mail kein Absenden", async ({ page }) => {
    await anmelden(page);
    await page.goto("/shop/bestellungen?neu=telefon");
    const d = page.getByTestId("dialog-neu");
    await expect(d).toBeVisible();
    await d.getByRole("button", { name: "Neu" }).click();
    await d.getByLabel("Name").fill("Test Beispiel");
    await d.getByTestId("neu-email").fill("test@gmial.com");
    await expect(d.getByTestId("email-tipp")).toContainText("gmail.com");
    await d.getByTestId("neu-email").fill("");
    await expect(d.getByTestId("ohne-email")).toBeVisible();
    await expect(d.getByTestId("neu-senden")).toBeDisabled();
  });

  test("Kanban: Spalten mit Karten, Menü nur mit erlaubten Zielen", async ({ page }) => {
    await anmelden(page);
    await page.goto("/shop/bestellungen?ansicht=kanban&bahn=abholung");
    await expect(page.getByTestId("kanban")).toBeVisible();
    const karte = page.locator('[data-testid="kanban-karte"][data-name="PH-S-261102-00004"]');
    // Erst nach der Hydrierung öffnet der Knopf das Menü – bei Bedarf erneut drücken
    await expect(async () => {
      await karte.getByTestId("kanban-menue").click();
      await expect(page.getByRole("menuitem", { name: "Keine Verschiebung" })).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 30_000 });
    await page.keyboard.press("Escape");
  });

  test("Widerruf: Fristen ab Zustellung lt. Sendungsverfolgung, Erstatten erst ab Ware", async ({ page }) => {
    await anmelden(page);
    await page.goto("/shop/widerrufe/PH-WID-2026-00007");
    await expect(page.getByTestId("fristen")).toContainText("Sendungsverfolgung");
    await expect(page.getByTestId("fristen")).toContainText("fristgerecht");
    await expect(page.getByTestId("sperrgruende")).toContainText("Absendenachweis");
  });

  test("Rechte: Shop-Team ohne Stripe und Einstellungen, Gutschein ohne Verkauf gesperrt", async ({ page }) => {
    await anmelden(page, "shop@demo.local");
    await page.goto("/shop/stripe");
    await expect(page).toHaveURL(/kein-zugriff/);
    await page.goto("/shop/einstellungen");
    await expect(page).toHaveURL(/kein-zugriff/);
    await page.goto("/shop/gutscheine");
    await expect(page.getByTestId("s5-oeffnen")).toBeDisabled();
    await page.goto("/shop/bestellungen/neu");
    await expect(page).toHaveURL(/neu=telefon/);
  });
});
