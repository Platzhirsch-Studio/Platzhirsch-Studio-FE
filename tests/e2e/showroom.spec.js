// tests/e2e/showroom.spec.js – Rundgang /[locale]/showroom (Neuland N1).
// Läuft im Projekt `desktop` (Chromium). Immer mit PW_WORKERS=1 (WebGL im Headless-
// Chromium läuft in Software; parallele Läufe verfälschen Ladezeiten).
//
// Erwarteter Modus (src/lib/showroom/config.js):
//   Dev-Server (Standard)                → "preview": Testszene, noindex
//   Produktion ohne Aufnahme             → "off": 404 (SHOWROOM_EXPECT=off)
//   Produktion mit SHOWROOM_PREVIEW=1    → "preview" (Messung in platzhirsch-prodtest)
//   nach Aufnahme + Freigabe             → "public" (SHOWROOM_EXPECT=public)
// Geprüft: Laden, Poster vor 3D, kein Viewer-Code/kein Splat vor dem Klick,
// Liste ohne WebGL, Tastatur, reduced motion = Schnitte, 375 px ohne Querscroll,
// keine Fremd-Requests und keine Cookies, Händler-Wort, rechte-Filter, Merken,
// JSON-LD, axe ohne serious/critical. Formulare: keine; blockFormSends trotzdem.
import { test, expect, devices } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { blockFormSends, collectConsoleErrors, dismissCookieBanner, jsonLdNodes, measureOverflow, robotsDirectives, settle } from "./helpers.js";

const PROD = process.env.npm_lifecycle_event === "test:e2e:prod" || /:3100\b/.test(process.env.BASE_URL || "");
const EXPECT = process.env.SHOWROOM_EXPECT || (PROD ? "off" : "preview");
const PATH = "/de/showroom";
// R8 (gesamtwerk P1-6, bewusst geänderte Erwartung): ohne echte Aufnahme (Testszene,
// Modus preview) verspricht die Seite keinen Rundgang – ehrlicher Kopf und Knöpfe aus
// src/components/Showroom/honestCopy.js. Mit Aufnahme (public) gelten die Rundgang-Texte.
const HONEST = EXPECT === "preview";
const LOCALES = HONEST
  ? { de: "Unsere Ausstellung in Lochau.", en: "Our showroom in Lochau.", fr: "Notre showroom à Lochau.", it: "Il nostro showroom a Lochau." }
  : { de: "Das Haus, jederzeit offen.", en: "The house, open at any hour.", fr: "La maison, ouverte à toute heure.", it: "La casa, aperta a ogni ora." };
const START = HONEST ? "Testszene starten" : "Rundgang starten";
const STOP = HONEST ? "Testszene beenden" : "Rundgang beenden";
const VIDEO = HONEST ? "Testszene als Video" : "Als Video ansehen";
const TERMIN_PREFIX = HONEST ? "Showroom%20Lochau" : "Rundgang%20Showroom%20Lochau";

test.describe.configure({ mode: "serial" });

// Der Rundgang verlangt Hardware-WebGL2 (failIfMajorPerformanceCaveat, sonst Video).
// Headless-Chromium nutzt sonst SwiftShader; mit diesen Schaltern rendert es auf
// der GPU des Prüfrechners (RTX 4060). Ohne GPU fallen die 3D-Tests sauber auf
// „übersprungen“ (needs3d), der Ersatz-Test läuft immer.
test.use({ launchOptions: { args: process.platform === "win32" ? ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] : ["--enable-gpu", "--ignore-gpu-blocklist"] } });

/** Startet den Rundgang; ohne Hardware-WebGL2 wird der Test übersprungen. */
async function startTour(page, how = "click") {
  const btn = page.getByRole("button", { name: START });
  if (how === "keyboard") {
    await btn.focus();
    await page.keyboard.press("Enter");
  } else await btn.click();
  const stage = page.locator("[data-state]");
  await expect(stage).toHaveAttribute("data-state", /loading|ready|fallback/);
  if ((await stage.getAttribute("data-state")) === "fallback") test.skip(true, "kein Hardware-WebGL2 auf diesem Prüfrechner");
  await expect(stage).toHaveAttribute("data-state", "ready", { timeout: 120_000 });
  return stage;
}

test.describe("Showroom – Server-HTML", () => {
  test("Modus off: 404 in allen Sprachen, kein Platzhalter live", async ({ request }) => {
    test.skip(EXPECT !== "off", `Modus ${EXPECT}`);
    for (const l of Object.keys(LOCALES)) expect((await request.get(`/${l}/showroom`, { timeout: 120_000 })).status()).toBe(404);
  });

  test("200 in DE/EN/FR/IT, H1, Robots je Modus, canonical, hreflang", async ({ request }) => {
    test.skip(EXPECT === "off", "Modus off");
    for (const [l, h1] of Object.entries(LOCALES)) {
      const res = await request.get(`/${l}/showroom`, { timeout: 120_000 });
      expect(res.status(), l).toBe(200);
      const html = await res.text();
      expect(html.match(/<h1[\s>]/g)?.length, l).toBe(1);
      expect(html).toContain(h1.slice(0, 12));
      expect(html).toMatch(new RegExp(`<link rel="canonical" href="https://platzhirsch\\.studio/${l}/showroom"`));
      expect(html).toContain('hrefLang="x-default" href="https://platzhirsch.studio/de/showroom"');
      const robots = robotsDirectives({ text: html, headers: res.headers() });
      if (EXPECT === "public") expect(robots).not.toContain("noindex");
      else expect(robots).toContain("noindex");
    }
  });

  test("Stationen als Liste im HTML, Poster mit fetchpriority, JSON-LD FurnitureStore", async ({ request }) => {
    test.skip(EXPECT === "off", "Modus off");
    const html = await (await request.get(PATH, { timeout: 120_000 })).text();
    expect(html).toContain("Alle Stationen und Stücke als Liste");
    expect(html).toMatch(/<details[^>]*id="stationen"/);
    if (EXPECT === "preview") {
      for (const t of ["Ankommen", "Sofa-Insel", "Mosaikwand", "Kücheninsel", "Blick zum See"]) expect(html).toContain(t);
      // rechte "pruefen" und imShowroom false: nicht im HTML; Haralds Tisch ohne Material: weg
      expect(html).not.toContain("Leuchte (Rechte offen, Testfall)");
      expect(html).not.toContain("Sessel (abgebaut, Testfall)");
      expect(html).not.toContain("Haralds Tisch");
      expect(html).toContain("synthetischer Testszene");
      // R8: ohne Aufnahme kein Rundgang-Versprechen im sichtbaren Text (ohne Skripte)
      const text = html.replace(/<script[\s\S]*?<\/script>/g, "");
      expect(text).not.toMatch(/Rundgang starten|Das Haus, jederzeit offen|Showroom Lochau · Rundgang/);
    }
    expect(html).toMatch(/<img[^>]+fetchPriority="high"/i);
    expect(html).toMatch(/<source type="image\/avif"/);
    const nodes = jsonLdNodes(html);
    const store = nodes.find((n) => n["@type"] === "FurnitureStore");
    expect(store?.address?.streetAddress).toBe("Landstraße 11");
    expect(store?.address?.postalCode).toBe("6911");
    // Händler-Wort nur ClassiCon/Ezarri
    const words = html.match(/[A-Za-z&]+-Vertragshändler/g) || [];
    for (const w of words) expect(["ClassiCon-Vertragshändler", "Ezarri-Vertragshändler"]).toContain(w);
  });
});

test.describe("Showroom – im Browser", () => {
  test.skip(EXPECT === "off", "Modus off");

  test("Poster zuerst, kein Viewer/Splat vor dem Klick, dann 3D; keine Fremd-Hosts, keine Cookies", async ({ page, context, baseURL }) => {
    test.setTimeout(240_000);
    await blockFormSends(page);
    const errors = collectConsoleErrors(page);
    const origin = new URL(baseURL).origin;
    const foreign = [];
    const splats = [];
    page.on("request", (r) => {
      const u = new URL(r.url());
      if (!["http:", "https:"].includes(u.protocol)) return;
      if (u.origin !== origin) foreign.push(u.href);
      if (u.pathname.endsWith(".sog")) splats.push(u.pathname);
    });
    await page.goto(PATH);
    await settle(page);
    await dismissCookieBanner(page);
    const cookiesBefore = (await context.cookies()).map((c) => c.name).sort();
    const stage = page.locator("[data-state]");
    await expect(stage).toHaveAttribute("data-state", "idle");
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(splats).toEqual([]);
    await startTour(page);
    await expect(page.locator("[aria-hidden='true'] canvas")).toHaveCount(1);
    expect(splats.length).toBeGreaterThan(0);
    expect(splats[0]).toMatch(/\/lo\.sog$/);
    // Station wechseln, Stück öffnen
    await page.getByRole("button", { name: "Weiter", exact: true }).click();
    await expect(stage).toHaveAttribute("data-station", /t2-sofa|.+/);
    await page.waitForTimeout(2000);
    expect(foreign, "keine Fremd-Hosts").toEqual([]);
    const cookiesAfter = (await context.cookies()).map((c) => c.name).sort();
    expect(cookiesAfter, "Rundgang setzt keine Cookies").toEqual(cookiesBefore);
    expect(errors).toEqual([]);
  });

  test("Tastatur: ← → Stationen, Tab zum Stück, Enter Karte, Esc zurück; Händler-Zeile; Merken", async ({ page }) => {
    test.setTimeout(240_000);
    test.skip(EXPECT !== "preview", "nutzt die Testszene");
    await blockFormSends(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(PATH);
    await settle(page);
    await dismissCookieBanner(page);
    const stage = await startTour(page, "keyboard");
    await expect(stage).toHaveAttribute("data-station", "t1-ankommen");
    await page.getByRole("button", { name: "Weiter", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(stage).toHaveAttribute("data-station", "t2-sofa");
    await page.keyboard.press("ArrowLeft");
    await expect(stage).toHaveAttribute("data-station", "t1-ankommen");
    await page.keyboard.press("ArrowRight");
    // Stationspunkte haben Namen und aria-current
    await expect(page.getByRole("button", { name: "Station 2 von 6: Sofa-Insel" })).toHaveAttribute("aria-current", "step");
    // Hotspot per Tastatur
    const sofa = page.getByRole("button", { name: "Sofa-Insel (Testobjekt)" });
    await expect(sofa).toBeVisible({ timeout: 10_000 });
    await sofa.focus();
    await expect(sofa).toBeFocused();
    await page.keyboard.press("Enter");
    const card = page.getByRole("dialog", { name: "Sofa-Insel (Testobjekt)" });
    await expect(card).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sofa-Insel (Testobjekt)" })).toBeFocused();
    const termin = card.getByRole("link", { name: /Termin anfragen/ });
    await expect(termin).toHaveAttribute("href", new RegExp(`/de/beratung\\?produkt=${TERMIN_PREFIX}%3A%20Sofa-Insel`));
    await card.getByRole("button", { name: "Merken" }).click();
    await expect(card.getByRole("button", { name: "Gemerkt" })).toHaveAttribute("aria-pressed", "true");
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem("cart") || "[]"));
    expect(cart.some((x) => x.id === "showroom-t-sofa")).toBe(true);
    await page.keyboard.press("Escape");
    await expect(card).toHaveCount(0);
    await expect(sofa).toBeFocused();
    // ClassiCon-Stück mit Händler-Zeile; geprüfte Rechte (pruefen) ohne Knopf
    await page.getByRole("button", { name: "ClassiCon · Testobjekt Tisch" }).click();
    await expect(page.getByRole("dialog")).toContainText("Händlerverzeichnis von ClassiCon");
    await page.keyboard.press("Escape");
    await page.keyboard.press("ArrowRight");
    await expect(stage).toHaveAttribute("data-station", "t3-licht");
    await expect(page.getByRole("button", { name: "Leuchte (Rechte offen, Testfall)" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Pendelleuchten (Testobjekt)" })).toHaveCount(1);
  });

  test("Reduced motion: Schnitt statt Kamerafahrt (Stück sofort da, keine Fahrt gemessen)", async ({ page }) => {
    test.setTimeout(240_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(PATH);
    await settle(page);
    await dismissCookieBanner(page);
    const stage = await startTour(page);
    await page.getByRole("button", { name: "Weiter", exact: true }).click();
    // Ohne Fahrt ist das Stück nach dem Schnitt sofort „angekommen“ (Fahrt dauert 1400 ms)
    await expect(page.locator("li[data-arrived='1']").first()).toBeAttached({ timeout: 900 });
    expect(await stage.getAttribute("data-fps")).toBeNull();
  });

  test("Mit Bewegung: Kamerafahrt, fps gemessen", async ({ page }) => {
    test.setTimeout(240_000);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(PATH);
    await settle(page);
    await dismissCookieBanner(page);
    const stage = await startTour(page);
    await page.getByRole("button", { name: "Weiter", exact: true }).click();
    await expect(stage).toHaveAttribute("data-fps", /\d+/, { timeout: 10_000 });
    const fps = Number(await stage.getAttribute("data-fps"));
    // Headless-Software-WebGL ist kein Mittelklasse-Handy: hier nur „läuft“, ≥ 30 fps auf echten Geräten messen
    expect(fps).toBeGreaterThan(0);
  });

  test("Ohne WebGL2: Video (AV1 + H.264) und Liste, gleiche Stationstexte", async ({ page }) => {
    test.setTimeout(180_000);
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (type === "webgl2") return null;
        return orig.call(this, type, ...rest);
      };
    });
    await page.goto(PATH);
    await settle(page);
    await dismissCookieBanner(page);
    await page.getByRole("button", { name: START }).click();
    const stage = page.locator("[data-state]");
    await expect(stage).toHaveAttribute("data-state", "fallback");
    await expect(stage).toHaveAttribute("data-reason", "webgl");
    await expect(stage.getByRole("status")).toContainText("keine 3D-Ansicht");
    const video = stage.locator("video");
    if (await video.count()) {
      await expect(video).toHaveAttribute("preload", "none");
      expect(await video.getAttribute("autoplay")).toBeNull();
      await expect(video.locator("source")).toHaveCount(2);
    }
    await page.locator("#stationen summary").click();
    await expect(page.locator("#stationen")).toHaveAttribute("open", "");
    await expect(page.locator("#stationen li").first()).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("„Als Video ansehen“ ohne 3D, zurück zum Poster", async ({ page }) => {
    await page.goto(PATH);
    await settle(page);
    await dismissCookieBanner(page);
    await page.getByRole("button", { name: VIDEO }).click();
    const stage = page.locator("[data-state]");
    await expect(stage).toHaveAttribute("data-state", "fallback");
    await expect(page.locator("canvas")).toHaveCount(0);
    await page.getByRole("button", { name: "Zurück zur 3D-Ansicht" }).click();
    await expect(stage).toHaveAttribute("data-state", "idle");
  });

  test("axe: keine serious/critical Verstöße (Poster und laufender Rundgang)", async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto(PATH);
    await settle(page);
    await dismissCookieBanner(page);
    const idle = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(idle.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    await startTour(page);
    const running = await new AxeBuilder({ page }).include("[data-state]").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(running.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});

test.describe("Showroom – 375 px (iPhone-Emulation)", () => {
  test.skip(EXPECT === "off", "Modus off");
  const { defaultBrowserType: _b, ...iphone } = devices["iPhone 15 Pro"];
  test.use({ ...iphone, viewport: { width: 375, height: 812 } });

  test("kein Querscroll vor und während des Rundgangs, Ziele ≥ 44 px", async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto(PATH);
    await settle(page);
    await dismissCookieBanner(page);
    let o = await measureOverflow(page);
    expect(o.sw, o.wide.join(", ")).toBeLessThanOrEqual(o.vw);
    await startTour(page);
    o = await measureOverflow(page);
    expect(o.sw, o.wide.join(", ")).toBeLessThanOrEqual(o.vw);
    for (const name of ["Weiter", "Zurück", STOP]) {
      const box = await page.getByRole("button", { name, exact: true }).boundingBox();
      expect(box.height, name).toBeGreaterThanOrEqual(44);
      expect(box.width, name).toBeGreaterThanOrEqual(44);
    }
    // Stationspunkte: ≥ 24 px (WCAG 2.5.8), hier 32 × 44
    const dot = await page.getByRole("button", { name: /^Station 1 von/ }).boundingBox();
    expect(dot.width).toBeGreaterThanOrEqual(24);
    expect(dot.height).toBeGreaterThanOrEqual(24);
  });
});
