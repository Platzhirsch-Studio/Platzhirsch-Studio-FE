// E2E der Shell v2 (Team P0-7, G-15 · G-20 · G-26 · G-27) gegen den Dev-Server im Mock-Modus.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/backoffice-shell.spec.js --project=desktop
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

function ueberlappen(a, b) {
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
}

test.describe("Shell v2 (Lounge)", () => {
  test("Leiste, Pillen-Reiter, Kopfzeile als Material, Testband ohne Überdeckung; a11y", async ({ page }) => {
    await anmelden(page);
    await page.goto("/d/ph-anfrage");
    const leiste = page.getByTestId("leiste");
    await expect(leiste.locator('a[aria-current="page"]')).toHaveAttribute("data-bereich", "crm");
    const reiter = page.getByTestId("reiter");
    await expect(reiter.locator('a[aria-current="page"]')).toHaveText("Anfrage");
    // Leiste schwebt: fester Abstand vom Rand, rund
    // Während des Seitenübergangs (View Transition aus loading.js) liefert boundingBox() null – bis zum Ende warten.
    await expect.poll(() => leiste.boundingBox(), { timeout: 10_000 }).not.toBeNull();
    const lb = await leiste.boundingBox();
    expect(lb.x).toBeGreaterThanOrEqual(12);
    // Testband im Fluss: berührt weder Leiste noch Kopfzeile
    const band = await page.getByTestId("testband").boundingBox();
    const kopf = await page.getByTestId("kopfzeile").boundingBox();
    expect(ueberlappen(band, lb)).toBe(false);
    expect(ueberlappen(band, kopf)).toBe(false);
    // Beim Scrollen wird die Kopfzeile zu Material
    await expect(page.getByTestId("kopfzeile")).not.toHaveClass(/is-gescrollt/);
    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(page.getByTestId("kopfzeile")).toHaveClass(/is-gescrollt/);
    const filter = await page.getByTestId("kopfzeile").evaluate((el) => getComputedStyle(el).backdropFilter || getComputedStyle(el).webkitBackdropFilter);
    expect(filter).toContain("blur");
    await page.evaluate(() => window.scrollTo(0, 0));
    await axe(page, "/d/ph-anfrage");
  });

  test("Befehlspalette v2: Präfix als Chip, Aktion per Enter", async ({ page }) => {
    await anmelden(page, "crm@demo.local");
    await page.getByTestId("palette-oeffnen").click();
    const eingabe = page.getByTestId("palette-eingabe");
    await expect(eingabe).toBeFocused();
    await eingabe.fill(">neue anf");
    await expect(page.getByTestId("palette").getByRole("button", { name: /Filter „Aktionen“ entfernen/ })).toBeVisible();
    await expect(page.getByRole("option", { name: /Neue Anfrage/ })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("option", { name: /Dashboard/ })).toHaveCount(0);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/d\/ph-anfrage\/neu/);
  });

  test("Glocke v2: Reiter per Pfeiltaste, Zähler, Ereignis-Endpunkt", async ({ page, request }) => {
    expect((await request.get("/api/ereignisse?einmal=1")).status()).toBe(401);
    await anmelden(page, "crm@demo.local");
    await page.getByTestId("glocke").click();
    const panel = page.getByTestId("glocke-panel");
    await expect(panel.getByRole("heading", { name: "Mitteilungen" })).toBeVisible();
    await expect(panel.getByTestId("glocke-tab-fuer-mich")).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("ArrowRight");
    await expect(panel.getByTestId("glocke-tab-team")).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("Escape");
    const r = await page.request.get("/api/ereignisse?einmal=1");
    expect(r.status()).toBe(200);
    const d = await r.json();
    expect(d.ok).toBe(true);
    expect(typeof d.anzahl).toBe("number");
    expect(typeof d.stand).toBe("string");
  });

  test("Hilfe-Panel mit „?“: Möglichkeiten und Kürzel der Seite", async ({ page }) => {
    await anmelden(page, "crm@demo.local");
    await page.goto("/crm");
    await page.locator("body").click({ position: { x: 600, y: 600 } });
    await page.keyboard.press("?");
    const panel = page.getByTestId("hilfe-panel");
    await expect(panel.getByText("Was kann ich hier tun?")).toBeVisible({ timeout: 20_000 });
    await expect(panel.getByRole("link", { name: "Neue Anfrage" })).toBeVisible();
    await expect(panel.getByText("Kürzel auf dieser Seite")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  });

  test("Benutzermenü: Dunkel bleibt nach Neuladen, System hebt es auf; Arbeitsplatz-Liste nur bei mehreren", async ({ page }) => {
    await anmelden(page);
    await page.getByTestId("benutzer-menu").click();
    await page.getByTestId("thema-dunkel").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByTestId("benutzer-menu").click();
    await page.getByTestId("thema-system").click();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /./);
    await expect(page.getByTestId("benutzer-panel").getByRole("heading", { name: "Arbeitsplatz" })).toHaveCount(0);
  });

  test("Kundenmodus: Leiste und Werkzeuge aus, Rückkehr per Langdruck und PIN", async ({ page }) => {
    await anmelden(page);
    await page.evaluate(() => sessionStorage.setItem("ph-bo:kundenmodus", "an"));
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-bo-kundenmodus", "an");
    await expect(page.getByTestId("leiste")).toBeHidden();
    await expect(page.getByTestId("palette-oeffnen")).toHaveCount(0);
    const marke = page.getByTestId("bediener-rueckkehr");
    const box = await marke.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(950);
    await page.mouse.up();
    const pin = page.getByTestId("kundenmodus-pin");
    await expect(pin).toBeVisible();
    await pin.locator("input").fill("1111");
    await pin.getByRole("button", { name: "Beenden" }).click();
    await expect(page.locator("html")).not.toHaveAttribute("data-bo-kundenmodus", /./);
    await expect(page.getByTestId("leiste")).toBeVisible();
  });
});
