// E2E Overlays (Team P0-4, G-06 · G-07 · G-08) auf der Demo /einstellungen?tab=system&baustein=overlay
// (Admin, Mock). Ohne Einbindung der Demo in die Einstellungsseite werden die Tests übersprungen.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/backoffice-overlay.spec.js --project=desktop
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";
const DEMO = "/einstellungen?tab=system&baustein=overlay";

async function anmelden(page) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill("admin@demo.local");
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

async function demo(page) {
  await page.goto(DEMO);
  const da = await page.getByTestId("demo-overlay").waitFor({ state: "visible", timeout: 20_000 }).then(() => true, () => false);
  test.skip(!da, "Demo noch nicht in /einstellungen eingebunden (Besitzer Zentrale/L0)");
}

const aktiv = (page) => page.evaluate(() => document.activeElement?.getAttribute("data-testid") || document.activeElement?.textContent?.trim());

test.describe("Overlays", () => {
  test.beforeEach(async ({ page }) => {
    await anmelden(page);
    await demo(page);
  });

  test("Menü: Tastatur, gesperrter Eintrag mit Grund, Esc gibt Fokus zurück", async ({ page }) => {
    await page.getByTestId("demo-menue-knopf").click();
    const menue = page.getByRole("menu", { name: "Aktionen" });
    await expect(menue).toBeVisible();
    await expect(menue.getByRole("menuitem", { name: /An DATEV/ })).toHaveAttribute("aria-disabled", "true");
    await expect(menue.getByText("Noch nicht verfügbar – Export über die Faktura")).toBeVisible();
    await page.keyboard.press("ArrowDown");
    expect(await aktiv(page)).toContain("Duplizieren");
    await page.keyboard.press("Escape");
    await expect(menue).toHaveCount(0);
    expect(await aktiv(page)).toBe("demo-menue-knopf");
  });

  test("Kontextmenü per Umschalt+F10", async ({ page }) => {
    await page.getByTestId("demo-karte-A-1187").focus();
    await page.keyboard.press("Shift+F10");
    await expect(page.getByRole("menu", { name: /Stadler/ })).toBeVisible();
  });

  test("Bestätigen gefährlich: Fokus auf Abbrechen, Esc gesperrt während Ausführung", async ({ page }) => {
    await page.getByTestId("demo-dialog-gefahr").click();
    const d = page.getByTestId("demo-bestaetigen-gefahr");
    await expect(d).toBeVisible();
    expect(await aktiv(page)).toBe("bestaetigen-abbrechen");
    await d.getByTestId("bestaetigen-ja").click();
    await page.keyboard.press("Escape");
    await expect(d).toHaveAttribute("open", "");
    await expect(d).not.toBeVisible({ timeout: 5_000 });
  });

  test("Peek: Leertaste, J blättert, Zeile markiert, ?panel, Esc", async ({ page }) => {
    await page.getByTestId("demo-zeile-A-1187").focus();
    await page.keyboard.press(" ");
    await expect(page.getByTestId("peek")).toBeVisible();
    await page.keyboard.press("j");
    await expect(page.getByTestId("peek-position")).toHaveText(/^2 von 5/);
    await expect(page.getByTestId("demo-zeile-A-1186")).toHaveAttribute("data-peek-aktiv", "true");
    await expect.poll(() => new URL(page.url()).searchParams.get("panel")).toBe("vorschau");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("peek")).not.toBeVisible();
    await expect.poll(() => new URL(page.url()).searchParams.get("panel")).toBeNull();
  });

  test("Sheet: Rückfrage bei ungespeicherten Änderungen", async ({ page }) => {
    await page.getByTestId("demo-sheet-knopf").click();
    await page.getByTestId("demo-notiz").fill("Kochinsel 2,4 m");
    await page.getByTestId("demo-sheet").getByTestId("sheet-schliessen").click();
    const r = page.getByTestId("sheet-rueckfrage");
    await expect(r).toBeVisible();
    await r.getByTestId("bestaetigen-abbrechen").click();
    await expect(page.getByTestId("demo-sheet")).toBeVisible();
    await expect(page.getByTestId("demo-notiz")).toHaveValue("Kochinsel 2,4 m");
  });

  test("Lightbox: blättern, Zoom, Download nur mit Freigabe", async ({ page }) => {
    await page.getByTestId("demo-bild-1").click();
    const lb = page.getByTestId("lightbox");
    await expect(lb).toBeVisible();
    await expect(lb.getByTestId("lightbox-download")).toHaveCount(0);
    await page.keyboard.press("ArrowRight");
    await expect(lb.getByTestId("lightbox-position")).toHaveText(/^3 von/);
    await expect(lb.getByTestId("lightbox-download")).toHaveCount(1);
    await page.keyboard.press("+");
    await expect(lb.getByTestId("lightbox-bild")).toHaveAttribute("data-zoom", "2");
    await page.keyboard.press("Escape");
    await expect(lb).not.toBeVisible();
  });
});
