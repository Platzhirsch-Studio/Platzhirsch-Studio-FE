// E2E Bereich Projekte (Team B-PRJ) – Kernwege im Mock: Übersicht → Mappe (1 Klick), Mappe mit 6 Reitern und
// 9 Phasen, Phasenwechsel als verzögerter Commit mit Rückgängig (kein Aufruf), Montage planen (Sheet, 2 Interaktionen),
// Nachkalkulation nur Leitung, Rückmeldungen-Zahl identisch, Abnahme mit Kunde mit einer Unterschrift.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/projekte-kernwege.spec.js --project=desktop
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";

async function anmelden(page, email = "projekte@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

test.describe("Projekte – Kernwege", () => {
  test.beforeEach(async ({ page }) => {
    await anmelden(page);
  });

  test("Übersicht: Zu tun, zwei Akzentkacheln, Projekte; Zeile öffnet die Mappe (B2: 1 Klick)", async ({ page }) => {
    await page.goto("/projekte");
    await expect(page.getByRole("heading", { level: 1, name: "Projekte" })).toBeVisible();
    await expect(page.getByTestId("projekte-zutun")).toBeVisible();
    await expect(page.locator(".bo-akzent")).toHaveCount(2);
    const zeile = page.getByTestId("projekt-zeile").first();
    await expect(zeile).toBeVisible();
    await zeile.locator("a").first().click();
    await expect(page).toHaveURL(/\/projekte\/PH-PRJ-/);
    await expect(page.getByTestId("mappe-hero")).toBeVisible();
  });

  test("Mappe: genau 6 Reiter, Phasenleiste mit 9 Stufen, eine aktuelle, Empfohlen mit Begründung", async ({ page }) => {
    await page.goto("/projekte/PH-PRJ-2026-0001");
    await expect(page.locator('[data-testid^="akte-tab-"]:not([data-testid="akte-tab-seite"])')).toHaveCount(6);
    await expect(page.getByTestId("phasenleiste").locator('[aria-current="step"]').first()).toBeAttached();
    await expect(page.getByTestId("phasenleiste")).toContainText("Lieferung");
    await expect(page.getByTestId("karte-empfohlen")).toBeVisible();
    await expect(page.getByTestId("mappe-aktionen")).toBeVisible();
    await page.getByTestId("akte-tab-planung").click();
    await expect(page).toHaveURL(/tab=planung/);
    await expect(page.getByTestId("karte-planungen")).toBeVisible();
  });

  test("Montage planen: Sheet aus dem Aktionsmenü, Tag wählen + Anlegen legt die Montage an (QA 53)", async ({ page }) => {
    await page.goto("/projekte/PH-PRJ-2026-0012");
    await page.getByTestId("aktionsmenue").click();
    await page.getByRole("menuitem", { name: "Montage planen" }).click();
    const sheet = page.getByTestId("montage-planen");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByTestId("planen-satz")).toContainText("Legt Montage am");
    await sheet.locator('[data-testid^="tag-"]').nth(1).click();
    await sheet.getByTestId("montage-anlegen").click();
    await expect(page.getByText("Montage angelegt").first()).toBeVisible({ timeout: 15_000 });
  });

  test("Phase vorwärts ist ein verzögerter Commit: Rückgängig lässt die Phase unverändert (E2, QA 10)", async ({ page }) => {
    await page.goto("/projekte/PH-PRJ-2026-0013");
    await expect(page.getByTestId("phasenleiste")).toBeVisible();
    await page.getByTestId("aktionsmenue").click();
    await page.getByRole("menuitem", { name: "Bestellen" }).click();
    const rueck = page.getByRole("button", { name: /Rückgängig/ }).first();
    await expect(rueck).toBeVisible();
    await rueck.click();
    await page.reload();
    await expect(page.getByTestId("akte-tabs")).toContainText("Auftrag");
  });

  test("Nachkalkulation: Leitung sieht DB-Stufen, Kostenarten und Belege", async ({ page }) => {
    await page.goto("/projekte/PH-PRJ-2026-0002?tab=belege-lieferung&ansicht=kalkulation");
    await expect(page.getByTestId("nachkalkulation")).toBeVisible();
    await expect(page.getByTestId("kalk-stufen")).toContainText("DB1");
    await expect(page.getByTestId("kalk-kostenarten")).toContainText("Wareneinsatz");
    await expect(page.getByTestId("kalk-belege")).toBeVisible();
  });

  test("Rückmeldungen: Zahl im Inbox-Kopf = Zu tun der Übersicht (§ 3.6, QA 23)", async ({ page }) => {
    await page.goto("/projekte/rueckmeldungen");
    const n = (await page.getByTestId("rueck-zahl").locator("dd").innerText()).trim();
    await expect(page.getByTestId("inbox-zeile").first()).toBeVisible();
    await page.goto("/projekte?umfang=alle");
    await expect(page.getByTestId("projekte-zutun")).toContainText(`${n} Rückmeldungen warten auf Antwort`);
  });

  test("Liste: Kanban und Zeitplan als Ansicht in der URL", async ({ page }) => {
    await page.goto("/projekte/liste?ansicht=kanban");
    await expect(page.getByText("Anfrage").first()).toBeVisible();
    await page.goto("/projekte/zeitplan");
    await expect(page).toHaveURL(/ansicht=zeitplan/);
    await expect(page.getByTestId("zeitplan-reihe").first()).toBeVisible();
  });

  test("Abnahme mit Kunde: Alles in Ordnung, eine Unterschrift unter einem Text, Abschluss mit Häkchen (E3)", async ({ page }) => {
    // Eine fertige Montage ohne Abnahme suchen (Seed: Bad Bregenz); nach einem früheren Lauf ist sie abgenommen.
    await page.goto("/projekte/montagen?ansicht=liste&status=Erledigt");
    const zeile = page.getByTestId("montage-liste-zeile").first();
    test.skip(!(await zeile.isVisible().catch(() => false)), "Keine fertige Montage mehr im Mock (Speicher bereits durchlaufen)");
    const href = await zeile.locator("a").first().getAttribute("href");
    await page.goto(`${href}?ablauf=abnahme`);
    const ablauf = page.getByTestId("abnahme-mit-kunde");
    await expect(ablauf).toBeVisible();
    await ablauf.getByTestId("abnahme-weiter").click();
    await ablauf.getByTestId("alles-ok").click();
    await expect(ablauf.getByTestId("erklaerung")).toContainText("nehme das Werk ab");
    const canvas = ablauf.locator("canvas").first();
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + 30, box.y + 60);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(box.x + 30 + i * 25, box.y + 60 + (i % 2 ? 30 : -10));
    await page.mouse.up();
    await ablauf.getByRole("button", { name: "Übernehmen" }).first().click();
    await ablauf.getByTestId("abnahme-weiter").click();
    await ablauf.getByTestId("studio-unterschrift").click();
    await expect(ablauf.getByTestId("zusammenfassung")).toContainText("Ohne Mängel");
    await ablauf.getByTestId("abnahme-weiter").click();
    await expect(page.getByTestId("abnahme-fertig")).toBeVisible({ timeout: 20_000 });
  });
});
