// Küchenplaner – Feinschliff (QA-Feedback 2, P3-9): Varianten A/B nebeneinander.
// A merken, Planung ändern (B rechnet live), B merken, A wieder öffnen.
// Läuft im desktop-Projekt, ein Teil mit Pixel-7-Maßen. Sendet nie etwas.
import { test, expect, devices } from "@playwright/test";

const PAGE = "/de/kuechenplaner";
const consent = (origin) => ({ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: origin });

async function open(page) {
  const origin = new URL(test.info().project.use.baseURL || "http://localhost:3000").origin;
  await page.context().addCookies([consent(origin)]);
  // Nie etwas absenden: alle Nicht-GET-Requests an die API sperren
  await page.route("**/api/**", (route) => (route.request().method() === "GET" ? route.continue() : route.abort()));
  // Dev-Server ist mit parallelen Teams oft langsam: nicht auf "load" aller Chunks warten
  await page.goto(PAGE, { waitUntil: "domcontentloaded", timeout: 170_000 });
  await expect(page.locator("h1")).toBeVisible({ timeout: 300_000 });
  await expect(page.getByRole("button", { name: "3D-Ansicht laden" })).toBeVisible({ timeout: 300_000 });
}
const tab = (page, name) => page.getByRole("tab", { name }).first().click();

test.describe("Küchenplaner Varianten A/B", () => {
  // Hydration im geteilten Dev-Server kann mehrere Minuten dauern
  test.setTimeout(480_000);
  test("A merken, ändern, B merken, A öffnen", async ({ page }) => {
    await open(page);
    await tab(page, "Ergebnis");
    const cmp = page.locator("[data-kp-compare]");
    await expect(cmp).toBeVisible({ timeout: 180_000 }); // Chunk kompiliert beim ersten Aufruf
    await cmp.getByRole("button", { name: "Aktuelle als A merken" }).click();
    await expect(cmp.locator('[data-kp-variant="b"]')).toContainText("Aktuelle Planung");
    await expect(cmp.locator("[data-kp-diffcount]")).toHaveAttribute("data-kp-diffcount", "0");
    await expect(cmp.locator('[data-kp-variant="a"] svg[role=img]')).toBeVisible();
    await expect(cmp.locator('[data-kp-variant="b"] svg[role=img]')).toBeVisible();

    // Planung ändern: U-Form
    await tab(page, "Raum");
    await page.getByRole("button", { name: /^U-Form/ }).click();
    await tab(page, "Ergebnis");
    await expect(cmp.locator('[data-kp-row="shape"]')).toHaveAttribute("data-diff", "1");
    await expect(cmp.locator('[data-kp-row="shape"]')).toContainText("L-Form");
    await expect(cmp.locator('[data-kp-row="shape"]')).toContainText("U-Form");
    expect(Number(await cmp.locator("[data-kp-diffcount]").getAttribute("data-kp-diffcount"))).toBeGreaterThan(1);

    // Nur Unterschiede
    await cmp.getByLabel("Nur Unterschiede").check();
    await expect(cmp.locator('[data-kp-row][data-diff="0"]')).toHaveCount(0);

    await cmp.getByRole("button", { name: "Als B merken" }).click();
    await expect(cmp.getByRole("button", { name: "Tauschen" })).toBeVisible();
    await expect(cmp.locator('[data-kp-variant="b"] [data-kp-variant-open]')).toBeVisible();

    // A öffnen → L-Form im Planer, A ist als geöffnet markiert
    await cmp.getByRole("button", { name: "Variante A im Planer öffnen" }).click();
    await expect(cmp.locator('[data-kp-variant="a"] [data-kp-variant-open]')).toBeVisible();
    await tab(page, "Raum");
    await expect(page.getByRole("button", { name: /^L-Form/ })).toHaveAttribute("aria-pressed", "true");
  });

  test("Handy: Vergleich ohne seitliches Scrollen, beide Grundrisse nebeneinander", async ({ browser }) => {
    const { defaultBrowserType: _b, ...pixel } = devices["Pixel 7"];
    void _b;
    const ctx = await browser.newContext({ ...pixel, locale: "de-AT" });
    const page = await ctx.newPage();
    try {
      await open(page);
      await tab(page, "Ergebnis");
      const cmp = page.locator("[data-kp-compare]");
      await expect(cmp).toBeVisible({ timeout: 180_000 }); // Chunk kompiliert beim ersten Aufruf
      await cmp.getByRole("button", { name: "Aktuelle als A merken" }).click();
      await cmp.scrollIntoViewIfNeeded();
      const a = await cmp.locator('[data-kp-variant="a"]').boundingBox();
      const b = await cmp.locator('[data-kp-variant="b"]').boundingBox();
      expect(Math.abs(a.y - b.y)).toBeLessThan(2);
      expect(b.x).toBeGreaterThan(a.x + a.width - 1);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(over).toBeLessThanOrEqual(0);
      await cmp.screenshot({ path: test.info().outputPath("varianten-pixel.png") });
    } finally {
      await ctx.close();
    }
  });
});
