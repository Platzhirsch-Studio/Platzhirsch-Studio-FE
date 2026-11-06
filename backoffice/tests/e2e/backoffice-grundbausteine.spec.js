// E2E Grundbausteine v2 (Team P0-2): Token hell/dunkel, Dichte, Knopf, Segment, Kennzahl-Zahl,
// Charts, Leer/Fehler – auf der Demo /einstellungen?tab=system&baustein=grundbausteine (Admin, Mock)
// und auf der Zentrale (bestehende Aufrufer).
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/backoffice-grundbausteine.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";
const DEMO = "/einstellungen?tab=system&baustein=grundbausteine";

async function anmelden(page, email = "admin@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

/** Öffnet die Demo; ohne Einbindung in die Einstellungsseite wird der Test übersprungen. */
async function demo(page) {
  await page.goto(DEMO);
  const da = await page.getByTestId("demo-grundbausteine").waitFor({ state: "visible", timeout: 20_000 }).then(() => true, () => false);
  test.skip(!da, "Demo noch nicht in /einstellungen eingebunden (Besitzer Zentrale/L0)");
}

const cssVar = (page, name) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

test.describe("Grundbausteine v2", () => {
  test("Zentrale: Kennzahlen ohne Konsolenfehler, Zahl mit Tausenderpunkt, Charts mit Tabelle", async ({ page }) => {
    const fehler = [];
    page.on("console", (m) => m.type() === "error" && fehler.push(m.text()));
    page.on("pageerror", (e) => fehler.push(e.message));
    await anmelden(page, "gf@demo.local");
    const kz = page.getByTestId("kennzahlen");
    await expect(kz).toBeVisible();
    await expect(kz.locator(".bo-zahl").first()).toHaveText(/^\d{1,3}(\.\d{3})*$/);
    await expect(page.getByText("Werte als Tabelle").first()).toBeVisible();
    expect(fehler.filter((f) => /hydrat|did not match/i.test(f))).toEqual([]);
  });

  test("Token: Dunkel per System und per data-theme gleich, hell per data-theme erzwingbar", async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: "dark" });
    const page = await ctx.newPage();
    await anmelden(page);
    const systemDunkel = await cssVar(page, "--color-bo-surface");
    expect(systemDunkel.toLowerCase()).toBe("#1b1e21"); // Lounge dunkel: Kachel
    // Chromium liefert den Farbwert normalisiert als Hex mit Alpha
    expect((await cssVar(page, "--color-bo-cognac-soft")).toLowerCase()).toMatch(/^(#c4784a2e|rgb\(196 120 74 \/ 0\.18\))$/);
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
    expect((await cssVar(page, "--color-bo-surface")).toLowerCase()).toBe("#fbfaf8"); // Lounge hell: Kachel
    await ctx.close();
    const hell = await browser.newContext({ colorScheme: "light" });
    const p2 = await hell.newPage();
    await anmelden(p2);
    await p2.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    expect((await cssVar(p2, "--color-bo-surface")).toLowerCase()).toBe(systemDunkel.toLowerCase());
    await hell.close();
  });

  test("Dichte: Schalter setzt data-dichte und Höhe; Kiosk-Teilbaum fix", async ({ page }) => {
    await anmelden(page);
    await demo(page);
    // „Automatisch“: kompakt mit Maus (32 px), komfortabel bei Touch (40 px, z. B. iPad).
    const grob = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
    expect(await cssVar(page, "--bo-control-h")).toBe(grob ? "40px" : "32px");
    await page.getByTestId("dichte-komfortabel").click();
    await expect(page.locator("html")).toHaveAttribute("data-dichte", "komfortabel");
    expect(await cssVar(page, "--bo-control-h")).toBe("40px");
    const knopf = page.getByTestId("demo-knopf-laedt");
    expect((await knopf.boundingBox()).height).toBeGreaterThanOrEqual(40);
    const kiosk = page.locator('[data-dichte="kiosk"] button').first();
    expect((await kiosk.boundingBox()).height).toBeGreaterThanOrEqual(48);
    // Pfeiltaste im Segment (radiogroup) wählt die nächste Option
    await page.getByTestId("dichte-komfortabel").press("ArrowLeft");
    await expect(page.locator("html")).toHaveAttribute("data-dichte", "kompakt");
    await page.getByTestId("dichte-auto").click();
    await expect(page.locator("html")).not.toHaveAttribute("data-dichte", /.+/);
  });

  test("Knopf laedt: Spinner, aria-busy, gesperrt, Breite bleibt", async ({ page }) => {
    await anmelden(page);
    await demo(page);
    const knopf = page.getByTestId("demo-knopf-laedt");
    const vorher = (await knopf.boundingBox()).width;
    await knopf.click();
    await expect(knopf).toHaveAttribute("aria-busy", "true");
    await expect(knopf).toBeDisabled();
    expect(Math.abs((await knopf.boundingBox()).width - vorher)).toBeLessThan(1);
    await expect(page.getByText("Noch nicht verfügbar – Rechnung im Frappe-Desk stellen")).toBeVisible();
  });

  test("Kennzahl zählt nur nach Änderung, Endwert stimmt; Segment-Auswahl mit Tastatur", async ({ page }) => {
    await anmelden(page);
    await demo(page);
    const zahl = page.getByTestId("demo-kennzahl-offen").locator(".bo-zahl");
    await expect(zahl).toHaveText("12");
    await page.getByTestId("demo-zahl-plus").click();
    await expect(zahl).toHaveText("15", { timeout: 2_000 });
    const seg = page.getByTestId("demo-segment-betrag");
    await seg.getByRole("radio", { name: "Netto" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(seg.getByRole("radio", { name: "Brutto" })).toHaveAttribute("aria-checked", "true");
    await expect(seg.getByRole("radio", { name: "Brutto" })).toBeFocused();
  });

  test("Charts, Leer, Fehler: Inhalte, keine Technikbegriffe, axe hell", async ({ page }) => {
    await anmelden(page);
    await demo(page);
    await expect(page.getByTestId("demo-donut")).toContainText("Weitere");
    await expect(page.getByTestId("demo-linie")).toContainText("2025");
    await expect(page.getByTestId("demo-leer")).toContainText("Filter zurücksetzen");
    const fehler = page.getByTestId("demo-fehler");
    await expect(fehler).toContainText("Wieder möglich in");
    await expect(fehler).not.toContainText("unavailable");
    await expect(fehler).not.toContainText("Code:");
    await page.getByTestId("demo-charts-einblenden").click();
    await expect(page.locator(".bo-chart-ein").first()).toBeVisible();
    await page.waitForTimeout(1000); // Einblenden (Werte ab 320 ms) abwarten, sonst misst axe halbe Deckkraft
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).include('[data-testid="demo-grundbausteine"]').analyze();
    const schwer = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(schwer.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
  });
});
