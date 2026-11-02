// Katalog-Konfigurator (Inhaber-Auftrag 31.10.2026): Naggura-Produktseite mit
// Raumbildern zuerst, Ausführungs-Auswahl (Basis, Front-Paneel RAL), Vorschau ohne
// Layout-Sprung, Beratung mit Ausführung, Tastatur, axe (WCAG 2.2 AA), Looks.
// Lauf: PW_WORKERS=1 npx playwright test tests/e2e/katalog-konfigurator.spec.js --project=desktop
// Screenshots 390/1440 → qa-screenshots/wellness/konfigurator/
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { blockFormSends, collectConsoleErrors, dismissCookieBanner } from "./helpers.js";

const SIDEBOARD = "/de/bad-wellness/produkte/naggura-ikon-sideboard-4m";
const LIEGE = "/de/bad-wellness/produkte/naggura-swop-s4-gr";
const MARKE = "/de/bad-wellness/marke/naggura";
const SHOTS = "qa-screenshots/wellness/konfigurator";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

async function open(page, path) {
  await blockFormSends(page);
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await expect(page.locator("h1")).toBeVisible({ timeout: 90_000 });
  await dismissCookieBanner(page).catch(() => {});
}

test.describe("Katalog-Konfigurator Naggura", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium (desktop)");

  test("Sideboard: Basis + Front-Paneel wählbar, Vorschau ohne Sprung, Beratung mit Ausführung", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await open(page, SIDEBOARD);
    const k = page.locator("[data-kat-konfigurator]");
    await expect(k).toBeVisible();
    const basis = k.getByRole("radiogroup", { name: "Basis" });
    const paneel = k.getByRole("radiogroup", { name: "Front-Paneel" });
    await expect(basis.getByRole("radio")).toHaveCount(3);
    await expect(paneel.getByRole("radio")).toHaveCount(5);
    await expect(basis.getByRole("radio", { checked: true })).toHaveCount(1);

    const frame = k.locator("[data-kat-vorschau]");
    const vorher = await frame.boundingBox();
    const src0 = await frame.locator("img").getAttribute("src");
    await basis.getByRole("radio", { name: /Eiche/ }).click();
    await expect(basis.getByRole("radio", { name: /Eiche/ })).toHaveAttribute("aria-checked", "true");
    await expect.poll(() => frame.locator("img").getAttribute("src")).not.toBe(src0);
    const nachher = await frame.boundingBox();
    expect(Math.abs(nachher.height - vorher.height)).toBeLessThanOrEqual(1);

    await paneel.getByRole("radio", { name: /RAL 5024/ }).click();
    await expect(k.locator("[data-kat-auswahl]")).toContainText("Eiche");
    await expect(k.locator("[data-kat-auswahl]")).toContainText("RAL 5024");
    const href = new URL(await k.locator("[data-kat-beratung]").getAttribute("href"), "http://x").searchParams.get("produkt");
    expect(href).toMatch(/Naggura Ikon Sideboard 4M – Basis: Eiche/);
    expect(href).toMatch(/RAL 5024/);
    await expect(frame.locator("img")).toHaveAttribute("data-pin-nopin", "true");
    await expect(k).toContainText("Bild: Naggura");
    expect(await page.locator("main").innerText()).not.toMatch(/€|EUR\s?\d/);
    expect(errors).toEqual([]);
  });

  test("Tastatur: Pfeiltasten wechseln die Option (roving tabindex)", async ({ page }) => {
    await open(page, SIDEBOARD);
    const basis = page.locator("[data-kat-konfigurator]").getByRole("radiogroup", { name: "Basis" });
    const checked = basis.getByRole("radio", { checked: true });
    const vorher = await checked.textContent();
    await checked.focus();
    await page.keyboard.press("ArrowRight");
    const neu = basis.getByRole("radio", { checked: true });
    await expect(neu).not.toHaveText(vorher);
    await expect(neu).toBeFocused();
    await expect(basis.locator('[tabindex="0"]')).toHaveCount(1);
  });

  test("Liege: Raumbild zuerst („So könnte es in Ihrem Zentrum aussehen“), nur erstes Bild vorgeladen, Looks", async ({ page }) => {
    await open(page, LIEGE);
    const raum = page.locator("[data-kat-raum]");
    await expect(raum).toContainText("So könnte es in Ihrem Zentrum aussehen");
    const imgs = page.locator("[data-kat-detail] img");
    const loading = await imgs.evaluateAll((els) => els.map((e) => e.getAttribute("loading")));
    expect(loading[0]).not.toBe("lazy");
    expect(loading.slice(1).every((l) => l === "lazy")).toBe(true);
    // Raumbilder unverändert: object-contain, kein Beschnitt
    await expect(raum.locator("img").first()).toHaveClass(/object-contain/);
    await expect(page.locator("[data-kat-looks]")).toContainText("Ganze Räume ansehen");
    await expect(page.locator("[data-kat-passend]").first()).toBeVisible();
  });

  test("Markenseite zeigt Looks", async ({ page }) => {
    await open(page, MARKE);
    await expect(page.locator("[data-kat-looks] [data-kat-look]")).not.toHaveCount(0);
  });

  for (const path of [SIDEBOARD, LIEGE, MARKE]) {
    test(`axe WCAG 2.2 AA ohne serious/critical: ${path}`, async ({ page }) => {
      await open(page, path);
      const r = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
      const severe = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`);
      expect(severe).toEqual([]);
    });
  }

  for (const width of [390, 1440]) {
    test(`Screenshots ${width} px, ohne seitliches Scrollen`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      for (const [name, path] of [["sideboard", SIDEBOARD], ["liege", LIEGE], ["marke", MARKE]]) {
        await open(page, path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow).toBeLessThanOrEqual(1);
        if (name === "sideboard") {
          const k = page.locator("[data-kat-konfigurator]");
          await k.getByRole("radiogroup", { name: "Basis" }).getByRole("radio", { name: /Grau/ }).click();
          await k.scrollIntoViewIfNeeded();
          await page.waitForTimeout(800);
          await k.screenshot({ path: `${SHOTS}/${name}-konfigurator-${width}.png` });
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${SHOTS}/${name}-${width}.png`, fullPage: true });
      }
    });
  }
});
