// E2E Seitenmuster v2 (Team P0-5b): Bereichsstart mit „Zu tun“, Liste in schwebender Kachel, Filterleiste,
// Formular mit Speicherleiste (haftend, Verwerfen), Kanban im Lounge-Stil, Demo „seitenmuster“ (sobald eingebunden).
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/backoffice-seitenmuster.spec.js --project=desktop
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";

async function anmelden(page, email = "crm-leitung@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

const ohneRahmen = (el) =>
  el.evaluate((n) => {
    const s = getComputedStyle(n);
    return { rand: s.borderTopWidth, radius: parseFloat(s.borderTopLeftRadius), schatten: s.boxShadow !== "none" };
  });

test.describe("Seitenmuster v2 (P0-5b)", () => {
  test("Bereichsstart: Seitenkopf groß, „Zu tun“ mit Zeilen aus echten Daten, Listen als Kacheln", async ({ page }) => {
    await anmelden(page);
    await page.goto("/crm");
    const kopf = page.getByTestId("seitenkopf");
    await expect(kopf.getByRole("heading", { level: 1 })).toHaveText("CRM");
    expect(await kopf.getByRole("heading", { level: 1 }).evaluate((h) => parseFloat(getComputedStyle(h).fontSize))).toBeGreaterThanOrEqual(28);
    const zutun = page.getByTestId("zutun");
    await expect(zutun).toBeVisible();
    await expect(zutun.locator("[data-zutun-zeile]").first()).toBeVisible({ timeout: 20_000 });
    const zeile = zutun.locator("[data-zutun-zeile]").first();
    await expect(zeile.getByRole("link").last()).toHaveAttribute("href", /status=/);
    const kachel = page.getByTestId("bereich-kacheln").locator("li").first();
    const k = await ohneRahmen(kachel);
    expect(k.rand).toBe("0px");
    expect(k.radius).toBeGreaterThanOrEqual(24);
    expect(k.schatten).toBe(true);
  });

  test("Liste: Tabelle in schwebender Kachel, Kopfzelle mit Avatar und Nummer, Zeitraum-Karte", async ({ page }) => {
    await anmelden(page);
    await page.goto("/d/ph-anfrage");
    const liste = page.getByTestId("liste");
    const l = await ohneRahmen(liste);
    expect(l.rand).toBe("0px");
    expect(l.radius).toBeGreaterThanOrEqual(24);
    const ersteZeile = liste.locator("tbody tr").first();
    await expect(ersteZeile.locator(".bo-av")).toHaveCount(1);
    await expect(ersteZeile.locator(".bo-dt-objekt__unter")).toContainText(/PH-ANF-/);
    await expect.poll(() => ersteZeile.evaluate((tr) => tr.getBoundingClientRect().height), { timeout: 5000 }).toBeGreaterThanOrEqual(56); // Zeilen erscheinen gestaffelt
    await expect(page.getByTestId("karten-liste")).toBeHidden();
    await page.getByTestId("filter-zeitraum").click();
    await expect(page.getByRole("dialog", { name: /Eingang|Zeitraum/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: /Eingang|Zeitraum/ })).toBeHidden();
  });

  test("Formular: Speicherleiste haftet nach Änderung, Verwerfen setzt zurück", async ({ page }) => {
    await anmelden(page);
    await page.goto("/d/ph-anfrage");
    const link = page.locator('tbody a[href^="/d/ph-anfrage/PH-ANF-"]').first();
    await page.goto(await link.getAttribute("href"));
    const leiste = page.getByTestId("speicherleiste");
    await expect(leiste).toHaveAttribute("data-haftend", "false");
    await expect(leiste).toContainText("Keine Änderungen");
    const feld = page.getByLabel(/^Vorname/);
    const vorher = await feld.inputValue();
    // Eine Eingabe vor der Hydration (Dev-Modus, WebKit) verpufft – wiederholen, bis die Leiste haftet.
    await expect(async () => {
      await feld.fill(vorher);
      await feld.fill(`${vorher}x`);
      await expect(leiste).toHaveAttribute("data-haftend", "true", { timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    await expect(leiste).toContainText("Ungespeichert");
    expect(await leiste.evaluate((n) => getComputedStyle(n).position)).toBe("sticky");
    await leiste.getByTestId("verwerfen").click();
    await expect(feld).toHaveValue(vorher);
    await expect(leiste).toHaveAttribute("data-haftend", "false");
  });

  test("Kanban: Spalten als eingelassene Flächen, Karten schweben ohne Rahmen", async ({ page }) => {
    await anmelden(page);
    await page.goto("/d/ph-aufgabe?ansicht=kanban");
    const spalte = page.getByTestId("kanban").locator("section[data-spalte]").first();
    await expect(spalte).toBeVisible();
    const s = await ohneRahmen(spalte);
    expect(s.rand).toBe("0px");
    expect(s.radius).toBeGreaterThanOrEqual(20);
    const karte = page.getByTestId("kanban-karte").first();
    const k = await ohneRahmen(karte);
    expect(k.rand).toBe("0px");
    expect(k.schatten).toBe(true);
  });

  test("Demo „seitenmuster“: Unternav, Zu tun, Zwei-Klick, Autosave (sobald eingebunden)", async ({ page }) => {
    await anmelden(page, "admin@demo.local");
    await page.goto(process.env.P05B_DEMO_PFAD || "/einstellungen?tab=system&baustein=seitenmuster");
    test.skip(!(await page.getByTestId("demo-seitenmuster").waitFor({ state: "attached", timeout: 30_000 }).then(() => true, () => false)), "Demo-Einbindung in /einstellungen steht noch aus (Zentrale/L0)");
    const nav = page.getByTestId("demo-unternav");
    await expect(nav.locator('[aria-current="page"]')).toHaveText("Reise");
    await expect(nav.getByRole("button", { name: /Mehr/ })).toBeVisible();
    await expect(nav.getByText("Kundenkarte")).toHaveCount(0);
    const zutun = page.getByTestId("demo-zutun-liste");
    await expect(zutun.locator("[data-zutun-zeile]")).toHaveCount(4, { timeout: 20_000 });
    await expect(zutun.locator('[data-zutun-zeile="fehler"]')).toContainText("Konnte nicht geladen werden");
    await expect(page.getByTestId("demo-zutun-leer-leer")).toBeVisible();
    const knopf = page.getByTestId("zwei-klick");
    await expect(async () => {
      if ((await knopf.getAttribute("data-scharf")) !== "true") await knopf.click();
      await expect(knopf).toHaveText(/Wirklich entfernen\?/, { timeout: 1_500 });
    }).toPass({ timeout: 20_000 });
    await knopf.click();
    await expect(page.locator('[role="status"]').filter({ hasText: "Position entfernt" })).toBeVisible();
    await page.locator("#demo-notiz").fill("Neue Notiz");
    await expect(page.getByTestId("demo-autosave").getByTestId("speicher-anzeige")).toHaveAttribute("data-status", "gespeichert", { timeout: 5_000 });
  });
});
