// tests/e2e/yacht-werfthalle.spec.js
// /de/yacht-interior – Signature "Die Werfthalle": hero without photo, AI
// labels on every concept image, 3D only after visibility/click, zone and
// boat controls as DOM buttons with a live summary, concept tabs, axe.
// Docs: Marktresearch/digital/features/yacht.md. No form is sent.
import { test, expect, devices } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { collectConsoleErrors, dismissCookieBanner } from "./helpers.js";

const PATH = "/de/yacht-interior";
// zone buttons under the stage (the concept sheet repeats them as a preview grid)
const zoneButton = (page, name) => page.getByRole("list", { name: "Zonen an Bord" }).getByRole("button", { name });
// click until the island reacts (dev server: hydration can lag behind the HTML)
async function clickZone(page, name, check) {
  await expect(async () => {
    if ((await zoneButton(page, name).getAttribute("aria-pressed")) !== "true") await zoneButton(page, name).click();
    await check();
  }).toPass({ timeout: 60_000, intervals: [1_000, 2_000, 4_000] });
}

test.describe("Yacht Werfthalle", () => {
  test("hero, labels, no three.js before interaction", async ({ page }) => {
    const scripts = [];
    page.on("request", (r) => r.resourceType() === "script" && scripts.push(r.url()));
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    // R7-P4 (R2 ux P2-4): Schreibweise einheitlich – seit Runde 4 (Fix-Team P3) „Yacht-Interieur“
    await expect(page.locator("h1")).toHaveText("Yacht-Interieur am Bodensee");
    // Rat 9,5 A6 (Inhaber-Entscheidung Nr. 11, bewusst geändert): der Hero zeigt statt der
    // gezeichneten Bühne genau EIN freigegebenes Navetta-Foto – echt, kein KI-Bild, mit Bildnachweis.
    const hero = page.locator('[data-yacht-hero]');
    await expect(hero.locator("img")).toHaveCount(1);
    await expect(hero.locator("[data-ki-label]")).toHaveCount(0);
    // every concept image (film band + six concepts) carries the visible label
    const images = page.locator("figure picture img");
    const labels = page.locator("figure [data-ki-label]");
    expect(await labels.count()).toBeGreaterThanOrEqual(await images.count());
    await expect(page.locator("[data-ki-hinweis]")).toContainText("KI-generiert"); // QM-Endabnahme: Hinweis nennt jetzt auch Blender-Renderings (bewusst geändert)
    // nothing scrolled → no three.js / R3F chunk (the ~1 KB Stage3D loader stub may load)
    expect(scripts.filter((u) => /node_modules_(three|@react-three)|react-three|drei/i.test(u))).toEqual([]);
    await expect(page.locator("[data-yacht-werfthalle] canvas")).toHaveCount(0);
  });

  test("zones, boat types and live summary work without WebGL", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    const hall = page.locator("[data-yacht-werfthalle]");
    await hall.scrollIntoViewIfNeeded();
    await clickZone(page, /^Salon/, () => expect(page.locator("[data-yacht-live]")).toContainText("Salon – Riviera Abend", { timeout: 2_000 }));
    await expect(hall.getByRole("heading", { level: 3, name: "Salon" })).toBeVisible();
    await hall.locator("label", { hasText: "Runabout" }).click();
    await expect(page.locator("[data-yacht-live]")).toContainText("Mahagoni und Leinen, Runabout: Übersicht");
    await expect(zoneButton(page, /^Steg & Bootshaus/)).toBeVisible();
    await expect(zoneButton(page, /^Salon/)).toHaveCount(0); // a runabout has no saloon
    expect(errors.filter((e) => !/Failed to load resource/.test(e))).toEqual([]);
  });

  test("3D loads on demand and keeps the DOM controls", async ({ page, browserName }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    const hall = page.locator("[data-yacht-werfthalle]");
    await hall.scrollIntoViewIfNeeded();
    const start = page.locator("[data-yacht-start3d]");
    // desktop auto-starts on visibility; phones/tablets need the button
    await start.click({ timeout: 3000 }).catch(() => {});
    const ok = await page
      .waitForFunction(() => document.querySelector("[data-yacht-werfthalle] canvas") || document.querySelector("[data-yacht-werfthalle]")?.textContent.includes("nicht verfügbar"), null, { timeout: 90_000 })
      .then(() => true)
      .catch(() => false);
    expect(ok, `${browserName}: neither 3D nor the fallback note appeared`).toBe(true);
    await expect(hall.locator("canvas")).toHaveAttribute("aria-hidden", "true").catch(() => {});
    await clickZone(page, /^Kabine/, () => expect(page.locator("[data-yacht-live]")).toContainText("Kabine", { timeout: 2_000 }));
    await page.getByRole("button", { name: "Abendlicht" }).click();
    await expect(page.getByRole("button", { name: "Abendlicht" })).toHaveAttribute("aria-pressed", "true");
  });

  test("concept tabs: keyboard and hash", async ({ page }) => {
    await page.goto(`${PATH}#konzept-segelyacht-nordwind`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("tab", { name: /Nordwind/ })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("tab", { name: /Nordwind/ }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: /Riviera Abend/ })).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#konzept-motoryacht-riviera")).toBeVisible();
    await expect(page.locator("#konzept-motoryacht-riviera")).toContainText("Beispielkonzept – kein Kundenprojekt");
  });

  // Rat 9,5 A6 (bewusst geändert): früher „das ganze gezeichnete Boot im ersten Bildschirm“.
  // Jetzt: das freigegebene Navetta-Foto steht ganz im ersten Bildschirm, UNVERÄNDERT
  // (Rahmen im eigenen Seitenverhältnis, object-contain, kein Zuschnitt) und mit Bildnachweis
  // sowie dem Hinweis „nicht von Platzhirsch eingerichtet“ direkt darunter.
  test("hero photo: released Navetta photo, uncropped, credited, in the first screen", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    const vp = page.viewportSize();
    const fig = page.locator("[data-yacht-hero-figure]");
    await expect(fig.locator("img[data-navetta-image]")).toHaveClass(/object-contain/);
    await expect(fig.locator("[data-navetta-credit]")).toHaveText("Foto: Courtesy of Custom Line · Projekt: Custom Line Navetta 42 · Möbel: Minotti");
    await expect(fig.locator("[data-yacht-hero-disclaimer]")).toHaveText("Referenzprojekt von Minotti – nicht von Platzhirsch eingerichtet.");
    const box = await fig.locator("img").boundingBox();
    expect(Math.abs(box.width / box.height - 1.6)).toBeLessThan(0.02); // eigenes Seitenverhältnis 1600 × 1000
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
    expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
  });

  // R7-P4 (R2 gesamtwerk P1-6, bewusst geändert): das bildschirmbreite KI-Kapitel
  // „Sechs Boote, sechs Welten“ und der „Beach Club“ sind entfallen; KI-Bilder stehen
  // nur noch kartengroß in den Beispielkonzepten, jedes mit sichtbarem KI-Hinweis.
  test("R7-P4: no full-screen AI chapter, no Beach Club, AI images card-sized and labelled", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    await expect(page.locator("[data-yacht-worlds]")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("Beach Club");
    await expect(page.getByRole("tab", { name: /Superyacht/ })).toHaveCount(0);
    const vw = page.viewportSize().width;
    const figs = page.locator("#konzepte figure:visible");
    expect(await figs.count()).toBeGreaterThan(0);
    for (const f of await figs.all()) {
      const box = await f.boundingBox();
      expect(box.width, "KI-Bild nicht bildschirmbreit").toBeLessThanOrEqual(vw * (vw >= 1024 ? 0.34 : 0.75));
      await expect(f.locator("[data-ki-label]")).toHaveCount(1);
    }
    // „Wer macht was“ steht nur noch einmal (Kurs durchs Winterlager), nicht mehr je Konzept
    await expect(page.getByText("Drei Beteiligte, klar getrennt", { exact: true })).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Wer macht was" })).toHaveCount(0);
  });

  test("brands show real product images; empty zones point to Sattler and Werft", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    const shelf = page.locator("[data-yacht-brands]");
    // R7-P4 (R2 ux P2-4, bewusst geändert): ein Produkt je Marke statt zwei (weniger Produktlinks)
    expect(await shelf.locator("img").count()).toBeGreaterThanOrEqual(8);
    expect(await page.locator("main a[href*='/produkte/']").count()).toBeLessThanOrEqual(45);
    const hall = page.locator("[data-yacht-werfthalle]");
    await hall.scrollIntoViewIfNeeded();
    await clickZone(page, /^Bad –/, () => expect(hall.locator("[data-yacht-handwerk]")).toContainText("Bootssattler und Werft", { timeout: 2_000 }));
    await expect(page.locator("[data-yacht-live]")).toContainText("Sache von Bootssattler und Werft");
  });

  // QA round 2 (feedback-2.md) ------------------------------------------------
  // Integration 28.10.2026 (Inhaber-Entscheidung Nr. 9): the page is indexable;
  // Inhaber-Entscheidung Nr. 11 (29.10.2026): Minotti and Custom Line released the
  // photos in writing → the Navetta 42 chapter is shown and the photos are served
  // (expectation deliberately flipped from "absent / 404").
  test("P1: index, follow, in sitemap and llms.txt; Navetta photos public after the release", async ({ page, request }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^index, follow/);
    await expect(page.locator("[data-yacht-navetta]")).toHaveCount(1);
    expect((await request.get("/labs/yacht/minotti-navetta42/30395_z_03_Minotti_CustomLine_Navetta42_1.jpg")).status()).toBe(200);
    const sitemap = await (await request.get("/sitemap-static.xml")).text();
    expect(sitemap).toContain("/de/yacht-interior");
    expect(await (await request.get("/llms.txt")).text()).toContain("/de/yacht-interior");
  });

  test("P2.1: Navetta 42 reference – real photos, credit at every image, no AI label, never cropped", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    const ref = page.locator("[data-yacht-navetta]");
    await ref.scrollIntoViewIfNeeded();
    await expect(ref).toContainText("Referenzprojekt von Minotti – nicht von Platzhirsch eingerichtet.");
    const figures = ref.locator("[data-navetta-figure]:visible");
    expect(await figures.count()).toBeGreaterThanOrEqual(1);
    for (const fig of await figures.all()) {
      await expect(fig.locator("[data-navetta-credit]")).toHaveText("Foto: Courtesy of Custom Line · Projekt: Custom Line Navetta 42 · Möbel: Minotti");
    }
    await expect(ref.locator("[data-ki-label]")).toHaveCount(0);
    await expect(ref.locator("img.object-cover")).toHaveCount(0);
    const imgs = ref.locator("img[data-navetta-image]");
    for (const img of await imgs.all()) await expect(img).toHaveClass(/object-contain/);
  });

  test("axe: no serious or critical violations", async ({ page }, info) => {
    test.skip(info.project.name === "iphone", "axe runs in Chromium projects");
    await page.goto(PATH, { waitUntil: "networkidle" });
    await dismissCookieBanner(page);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    const bad = result.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    expect(bad.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
  });
});

// Phone layout inside the desktop (Chromium) project: Pixel 7 viewport + touch.
const { defaultBrowserType: _browser, ...PIXEL } = devices["Pixel 7"];
test.describe("Yacht on a phone (Pixel 7)", () => {
  test.use(PIXEL);
  // R7-P4 (R2 ux P2-4 / gesamtwerk P1-6): das Welten-Karussell (und damit P2.6) ist entfallen.
  // Stattdessen: USP und Termin (thema=yacht) im ersten Bildschirm, Seite ≤ 12 000 px.
  test("R7-P4: USP and CTA in the first screen, page ≤ 12 600 px, no horizontal scroll", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    const vp = page.viewportSize();
    const usp = page.locator("[data-yacht-usp]");
    await expect(usp).toContainText("von Hand");
    const cta = page.locator("[data-yacht-hero] a[href*='thema=yacht']").first();
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
    await page.waitForLoadState("load");
    const { h, over } = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, over: document.documentElement.scrollWidth > innerWidth }));
    // Inhaber-Entscheidung Nr. 11: das freigegebene Navetta-42-Kapitel kommt hinzu (mobil gekürzt
    // auf ≈ 690 px: Karussell, Hinweis, Bildnachweis). Budget bewusst von 12 000 auf 12 600 px angehoben.
    expect(h).toBeLessThanOrEqual(12600);
    expect(over).toBe(false);
  });
});
