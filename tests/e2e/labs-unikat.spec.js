// tests/e2e/labs-unikat.spec.js – Prototyp „Unikat“ (/de/preview/unikat).
// Prüft: Seite lädt (Vorschau an), noindex, eine H1, axe 0 (Desktop + 390 px),
// ruhige Fassung bei prefers-reduced-motion (alle Stufen untereinander, keine
// Sticky-Bühne), Raum-Starter reagiert und baut den Anfrage-Link, kein
// horizontaler Überlauf. Läuft im Projekt `desktop`; mit PW_WORKERS=1 starten.
// In Produktion ohne DESIGN_PREVIEW=1 ist die Seite 404 (wie die anderen Vorschauen).
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { collectConsoleErrors, dismissCookieBanner, measureOverflow } from "./helpers.js";

const PATH = "/de/preview/unikat";
const SKIP = process.env.DESIGN_PREVIEW_EXPECT === "off";
const MOBIL = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

test.describe("Unikat – Vorschau", () => {
  test.skip(SKIP, "Design-Vorschau in dieser Umgebung aus");

  test("lädt, noindex, eine H1, axe 0, Raum-Starter", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const res = await page.goto(`${PATH}?licht=12:00`, { timeout: 120_000 });
    expect(res.status()).toBe(200);
    await dismissCookieBanner(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Erst die Linie.");

    // Raum-Starter: Küche wählen → Küchengeräte, Link mit thema=kueche
    const starter = page.getByRole("form", { name: "Womit beginnen wir?" });
    await starter.getByRole("radio", { name: "Küche", exact: true }).check();
    await expect(starter.locator("text=Vorschläge aus den Küchengeräten")).toBeVisible();
    await expect(starter.locator("ul li a img")).toHaveCount(3);
    const cta = starter.getByRole("link", { name: "Planung mit diesen Angaben anfragen" });
    await expect(cta).toHaveAttribute("href", /^\/de\/beratung\?thema=kueche&produkt=Raum-Starter/);
    await expect(page.locator("[data-licht-text]")).toHaveText(/^Lochau, 12:00 Uhr · Sonne \d+° über dem Horizont/);

    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("Bühne zeichnet beim Scrollen (Stufe 4 zeigt das Foto)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(PATH, { timeout: 120_000 });
    await dismissCookieBanner(page);
    const track = page.locator("[data-unikat-track]");
    await expect(track).toHaveAttribute("data-live", "");
    const box = await track.boundingBox();
    const top = (await page.evaluate(() => window.scrollY)) + box.y;
    await page.evaluate((y) => window.scrollTo(0, y), top + 0.8 * (box.height - 900) - 71);
    await expect(track).toHaveAttribute("data-step", "4");
    const r = await track.evaluate((el) => Number(el.style.getPropertyValue("--r")));
    expect(r).toBeGreaterThan(0.5);
  });
});

test.describe("Unikat – ruhige Fassung und 390 px", () => {
  test.skip(SKIP, "Design-Vorschau in dieser Umgebung aus");
  test.use({ ...MOBIL, reducedMotion: "reduce" });

  test("alle Stufen untereinander, axe 0, kein Überlauf", async ({ page }) => {
    await page.goto(PATH, { timeout: 120_000 });
    await dismissCookieBanner(page);
    const track = page.locator("[data-unikat-track]");
    await expect(track).not.toHaveAttribute("data-live", "");
    // keine Sticky-Bühne: die Stufen stehen im Fluss, alle Texte sichtbar
    await expect(page.locator("[data-viewport]")).toHaveCSS("display", "contents");
    for (const t of ["Am Anfang steht ein Strich.", "Grundriss, Perspektive, Stimmung.", "Die Zeichnung steht auf.", "Vom Modell zum Raum.", "Das Licht von jetzt, in Lochau."]) {
      await expect(page.getByRole("heading", { name: t })).toBeVisible();
    }
    // Inhaber 31.10.2026: kein Hinweistext.
    await expect(page.getByText("Illustration des Prinzips, keine Originalskizze")).toHaveCount(0);
    // Lauftext steht still (zweite Kopie aus)
    await expect(page.locator("section[aria-label^='Marken'] ul[aria-hidden]")).toBeHidden();
    // Seite scrollt nicht seitlich (die breiten Szenen-SVGs liegen in overflow:hidden-Rahmen)
    const { vw, sw } = await measureOverflow(page);
    expect(sw).toBeLessThanOrEqual(vw);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
