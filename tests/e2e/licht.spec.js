// tests/e2e/licht.spec.js – Neuland N4 „Bodensee-Licht“ (/de/bodensee-licht).
// Akzeptanz (Marktresearch/digital/features/neuland.md §5.4): Regler beschriftet
// mit Werttext, Tastatur, reduced motion ohne Auto-Durchlauf, 375 px ohne Überlauf,
// Lichtzustand in URL / Merkliste / Anfrage-Text, Sonne unter Horizont, Fallback
// ohne WebGL (Text + SVG-Sonnenbahn). Läuft im Projekt `desktop` (Chromium) mit
// 375-px-Kontext. Mit PW_WORKERS=1 starten. Formulare werden nie abgesendet
// (blockFormSends); die Anfrage wird nur als Link geprüft.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { blockFormSends, collectConsoleErrors, dismissCookieBanner, measureOverflow } from "./helpers.js";

const PATH = "/de/bodensee-licht";
const WINTER = `${PATH}?ort=lochau&fenster=180&datum=2026-12-21&zeit=10:30`;
const MOBIL = { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

test.describe("Bodensee-Licht – Server-HTML", () => {
  test("200, eine H1, canonical, Werttext aus der URL, nur Deutsch", async ({ request }) => {
    const res = await request.get(`${PATH}?ort=chur&fenster=135&datum=2026-12-21&zeit=08:30`, { timeout: 120_000 });
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
    expect(html).toContain("Das Licht an Ihrem Ort.");
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/platzhirsch\.studio\/de\/bodensee-licht"/);
    // Werttext steht schon im Server-HTML (ohne JavaScript lesbar)
    expect(html).toMatch(/8:30 Uhr, Sonne \d+° über dem Horizont, aus Südosten/);
    // SVG-Sonnenbahn mit Auf-/Untergang ist immer da (Rückfall ohne WebGL)
    expect(html).toContain("data-sonnenbahn");
    expect(html).toMatch(/Sonnenbahn am 21\. Dezember 2026 in Chur: Aufgang \d+:\d\d Uhr/);
    // R7-P4 (bewusst geändert): EN/FR/IT leiten seit Runde 2 per 308 auf die deutsche Seite (?lang=…) um –
    // eine eigene fremdsprachige Seite gibt es weiterhin nicht.
    for (const l of ["en", "fr", "it"]) {
      const r = await request.get(`/${l}/bodensee-licht`, { timeout: 120_000, maxRedirects: 0 });
      expect(r.status() === 404 || (r.status() === 308 && /\/de\/bodensee-licht(\?|$)/.test(r.headers().location || "")), l).toBe(true);
    }
  });
});

test.describe("Bodensee-Licht – 375 px", () => {
  test.use(MOBIL);

  test("Regler beschriftet, Tastatur ändert Werttext und URL, kein Überlauf, keine Konsolenfehler", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const blocked = await blockFormSends(page);
    await page.goto(WINTER, { timeout: 120_000 });
    await dismissCookieBanner(page);

    const zeit = page.getByRole("slider", { name: "Uhrzeit" });
    await expect(zeit).toHaveAttribute("aria-valuetext", /^10:30 Uhr, Sonne 1\d° über dem Horizont, aus Südosten$/);
    await expect(page.getByRole("slider", { name: "Fensterrichtung" })).toHaveAttribute("aria-valuetext", "Süden, 180 Grad");
    await expect(page.getByLabel("Ort", { exact: true })).toHaveValue("lochau");
    await expect(page.getByLabel("Datum", { exact: true })).toHaveValue("2026-12-21");

    // Tastatur: 6 × Pfeil rechts = +30 min
    await zeit.focus();
    for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowRight");
    await expect(zeit).toHaveAttribute("aria-valuetext", /^11:00 Uhr, Sonne \d+° über dem Horizont, aus Süd/);
    await expect(page.locator("[data-werttext]")).toHaveText(/^11:00 Uhr/);
    await expect(page).toHaveURL(/zeit=11:00/);

    // Fensterrichtung per Schnellwahl (Taste Enter), Ort per Auswahl
    await page.getByRole("button", { name: "Westen", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("slider", { name: "Fensterrichtung" })).toHaveAttribute("aria-valuetext", "Westen, 270 Grad");
    await page.getByLabel("Ort", { exact: true }).selectOption("ulm");
    await expect(page).toHaveURL(/ort=ulm&fenster=270&datum=2026-12-21&zeit=11:00/);
    await expect(page.locator("[data-kurztext]")).toHaveText("Ulm, Fenster West, 21. Dezember 2026, 11:00 Uhr");

    const o = await measureOverflow(page);
    expect(o.sw, `Überlauf: ${o.wide.join(", ")}`).toBeLessThanOrEqual(o.vw);
    expect(blocked).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("Nacht: Sonne unter dem Horizont – Text sagt es, Sonnenpunkt hohl, kein Fenster-Licht", async ({ page }) => {
    await page.goto(`${PATH}?ort=lochau&fenster=180&datum=2026-12-21&zeit=22:00`, { timeout: 120_000 });
    await expect(page.getByRole("slider", { name: "Uhrzeit" })).toHaveAttribute("aria-valuetext", /^22:00 Uhr, Sonne \d+° unter dem Horizont, kein direktes Sonnenlicht$/);
    await expect(page.locator("[data-sonnen-satz]")).toContainText("untergegangen");
    await expect(page.locator("[data-sonnenbahn] [data-sonne-punkt]").first()).toHaveAttribute("fill", "var(--color-paper)");
    // Südfenster im Dezember: es gibt Zeiten mit Direktsonne (Messinglinie)
    await expect(page.locator("[data-fakt='fenster-sonne'] dd").first()).toHaveText(/\d+ h/);
  });

  test("Merken, Anfrage-Text und Szenenwechsel tragen den Lichtzustand", async ({ page }) => {
    const blocked = await blockFormSends(page);
    await page.goto(WINTER, { timeout: 120_000 });
    await dismissCookieBanner(page);
    await page.getByRole("button", { name: "Pool", exact: true }).click();
    await expect(page).toHaveURL(/szene=pool/);
    await expect(page.getByRole("slider", { name: "Blick vom Haus" })).toBeVisible();

    const anfrage = page.locator("[data-anfrage]");
    const href = decodeURIComponent((await anfrage.getAttribute("href")) || "");
    expect(href).toMatch(/^\/de\/beratung\?produkt=Lichtstudie \(Pool\): Lochau \(Studio\), Fenster Süd, 21\. Dezember 2026, 10:30 Uhr\nSonnenstand: 10:30 Uhr, Sonne/);
    expect(href).toContain("https://platzhirsch.studio/de/bodensee-licht?ort=lochau&fenster=180&datum=2026-12-21&zeit=10:30&szene=pool");

    await page.locator("[data-merken]").click();
    const liste = await page.evaluate(() => JSON.parse(localStorage.getItem("cart") || "[]"));
    const eintrag = liste.find((x) => x.category === "Bodensee-Licht");
    expect(eintrag?.name).toBe("Lichtstudie: Lochau (Studio), Fenster Süd, 21. Dezember 2026, 10:30 Uhr");
    expect(eintrag?.href).toBe("/de/bodensee-licht?ort=lochau&fenster=180&datum=2026-12-21&zeit=10:30&szene=pool");
    expect(blocked).toEqual([]);
  });

  test("axe: keine schweren Verstöße", async ({ page }) => {
    await page.goto(WINTER, { timeout: 120_000 });
    await dismissCookieBanner(page);
    const r = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    const schwer = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    expect(schwer.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
  });
});

test.describe("Bodensee-Licht – reduzierte Bewegung", () => {
  test.use({ ...MOBIL, reducedMotion: "reduce" });

  test("kein „Tag abspielen“, stattdessen Hinweis; Werte springen nur beim Ziehen", async ({ page }) => {
    await page.goto(WINTER, { timeout: 120_000 });
    await expect(page.locator("[data-kein-autolauf]")).toBeVisible();
    await expect(page.locator("[data-abspielen]")).toHaveCount(0);
    const vorher = await page.locator("[data-werttext]").textContent();
    await page.waitForTimeout(1500);
    expect(await page.locator("[data-werttext]").textContent()).toBe(vorher);
  });
});

test.describe("Bodensee-Licht – Tag abspielen", () => {
  test.use(MOBIL);

  test("läuft nur auf Knopfdruck und lässt sich anhalten", async ({ page }) => {
    await page.goto(`${PATH}?ort=lochau&fenster=180&datum=2026-06-21&zeit=10:00`, { timeout: 120_000 });
    await dismissCookieBanner(page);
    const knopf = page.locator("[data-abspielen]");
    await expect(knopf).toHaveText("Tag abspielen");
    const start = await page.locator("[data-werttext]").textContent();
    await page.waitForTimeout(800);
    expect(await page.locator("[data-werttext]").textContent()).toBe(start);
    await knopf.click();
    await expect(knopf).toHaveText("Anhalten");
    await expect(page.locator("[data-werttext]")).not.toHaveText(start || "");
    await knopf.click();
    await expect(knopf).toHaveText("Tag abspielen");
    const halt = await page.locator("[data-werttext]").textContent();
    await page.waitForTimeout(800);
    expect(await page.locator("[data-werttext]").textContent()).toBe(halt);
  });
});

test.describe("Bodensee-Licht – ohne WebGL", () => {
  test.use(MOBIL);

  test("Text und SVG-Sonnenbahn statt 3D", async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (/webgl/i.test(String(type))) return null;
        return orig.call(this, type, ...rest);
      };
    });
    await page.goto(WINTER, { timeout: 120_000 });
    await expect(page.locator("[data-kein-webgl]")).toBeVisible();
    await expect(page.locator("[data-licht-canvas]")).toHaveCount(0);
    await expect(page.locator("[data-sonnenbahn]").first()).toBeVisible();
    await expect(page.getByText("Aufgang", { exact: true })).toBeVisible();
  });
});
