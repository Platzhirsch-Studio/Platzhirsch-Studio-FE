// Küchenplaner „Fotoansicht“ (02.11.2026): Rendering zum Plan im Reiter Material.
// Je Gerät (Pixel 7, Desktop 1440 × 900; der pixel-Projektfilter der Config greift nur für
// smoke/a11y, darum Kontexte hier selbst): Bild bei Zeile + Insel, Pflicht-Bildunterschrift,
// Umschalter Dreiviertel/Augenhöhe (aria-pressed), ausgeblendet bei Freier Raumform,
// keine Konsolenfehler, CLS ohne Eingabe ≤ 0,05 (Budget wie kuechenplaner-cls.spec.js).
// Ohne 3D („Daten sparen“): die Szene lädt erst auf Klick, der Test braucht sie nicht.
// Start: PW_WORKERS=1 npx playwright test kuechenplaner-fotoansicht --project=desktop
import { test, expect, devices } from "@playwright/test";

const PAGE = "/de/kuechenplaner";
const DEVICES = [
  ["pixel", { ...devices["Pixel 7"] }],
  ["desktop", { viewport: { width: 1440, height: 900 } }],
];
const IGNORED = [/Download the React DevTools/i, /\[HMR\]|\[Fast Refresh\]|hmr/i, /report-only/i];

test.describe.configure({ mode: "serial" });

async function openPlaner(ctx) {
  const origin = new URL(test.info().project.use.baseURL || "http://localhost:3000").origin;
  await ctx.addCookies([{ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: origin }]);
  await ctx.addInitScript(() => {
    const c = navigator.connection;
    if (c) Object.defineProperty(c, "saveData", { get: () => true, configurable: true });
    else Object.defineProperty(Navigator.prototype, "connection", { get: () => ({ saveData: true }), configurable: true });
    window.__cls = 0;
    window.__shifts = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__cls += e.value;
        window.__shifts.push({ v: +e.value.toFixed(4), src: (e.sources || []).map((s) => s.node?.nodeName + (s.node?.className ? "." + String(s.node.className).slice(0, 40) : "")) });
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !IGNORED.some((re) => re.test(m.text()))) errors.push(m.text().slice(0, 300));
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${String(e).slice(0, 300)}`));
  await page.goto(PAGE, { waitUntil: "load" });
  await expect(page.locator("h1")).toBeVisible({ timeout: 60_000 });
  await page.waitForSelector("[data-kp-hydrated] [data-kp-root]", { state: "visible", timeout: 60_000 });
  return { page, errors };
}

const tab = (page, name) => page.getByRole("tab", { name }).first();
const cls = (page) => page.evaluate(() => ({ cls: window.__cls, shifts: window.__shifts }));

for (const [name, use] of DEVICES) {
  test(`${name}: Fotoansicht bei Zeile + Insel, Umschalter, ausgeblendet bei Freier Raumform`, async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ ...use, baseURL });
    const { page, errors } = await openPlaner(ctx);

    // Grundform Zeile + Insel, dann Reiter Material
    await page.getByRole("button", { name: /Zeile \+ Insel/ }).click();
    await tab(page, "Material").click();
    const foto = page.locator("[data-kp-foto]");
    await expect(foto).toBeVisible();
    await expect(foto).toHaveAttribute("data-kp-foto-view", "dreiviertel");
    await expect(foto).toHaveAttribute("data-kp-foto-file", "kueche-insel-matt-kaschmir-quarz-grifflos-alu-dreiviertel.webp");
    const img = foto.locator("img[data-kp-foto-bild]").last();
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute("alt", /Zeile \+ Insel.*Kaschmir.*Quarzkomposit.*Visualisierung \(Rendering\)/);
    await expect(img).toHaveAttribute("loading", "lazy");
    await expect(img).toHaveJSProperty("complete", true);
    expect(await img.evaluate((el) => el.naturalWidth)).toBeGreaterThan(0);
    // Platzhalter 3:2 – Bildrahmen hat das Seitenverhältnis des Renderings
    const box = await foto.locator("div.relative").first().boundingBox();
    expect(Math.abs(box.width / box.height - 1.5)).toBeLessThan(0.03);
    expect(box.width).toBeLessThanOrEqual(use.viewport.width);

    // Pflicht-Bildunterschrift + ehrlicher Hinweis direkt am Bild
    const caption = foto.locator("figcaption[data-kp-foto-caption]");
    await expect(caption).toContainText("Visualisierung (Rendering)");
    await expect(caption).toContainText("66 vorgerenderten Varianten");
    await expect(caption).not.toContainText(/\bKI\b/);
    await expect(foto.locator("[data-kp-foto-abweichungen]")).toHaveCount(0);

    // Umschalter: echte Knöpfe mit aria-pressed, ≥ 44 px
    const dreiviertel = foto.getByRole("button", { name: "Dreiviertel" });
    const auge = foto.getByRole("button", { name: "Augenhöhe" });
    await expect(dreiviertel).toHaveAttribute("aria-pressed", "true");
    await expect(auge).toHaveAttribute("aria-pressed", "false");
    for (const b of [dreiviertel, auge]) {
      const bb = await b.boundingBox();
      expect(bb.height).toBeGreaterThanOrEqual(44);
      expect(bb.width).toBeGreaterThanOrEqual(44);
    }
    await auge.click();
    await expect(auge).toHaveAttribute("aria-pressed", "true");
    await expect(dreiviertel).toHaveAttribute("aria-pressed", "false");
    await expect(foto).toHaveAttribute("data-kp-foto-file", "kueche-insel-matt-kaschmir-quarz-grifflos-alu-auge.webp");
    await expect(foto.locator("img[data-kp-foto-bild]").last()).toHaveAttribute("src", /auge\.webp/);
    await expect(foto.locator("img[data-kp-foto-bild]").last()).toHaveJSProperty("complete", true);

    // Abweichung: Keramik Beton hell → nächstliegendes Bild + Hinweis, was das Bild zeigt
    await dreiviertel.click();
    await page.getByRole("button", { name: "Keramik", exact: true }).click();
    await page.getByRole("radio", { name: "Beton hell" }).click();
    await page.getByRole("button", { name: "Keramik / Sinterstein" }).click();
    await expect(foto).toHaveAttribute("data-kp-foto-file", "kueche-insel-keramik-beton-quarz-grifflos-alu-dreiviertel.webp");
    await expect(foto.locator("[data-kp-foto-abweichungen]")).toContainText(/Bild zeigt: Arbeitsplatte Quarzkomposit statt Keramik \/ Sinterstein/);

    // Freie Raumform: keine Fotoansicht, nur eine ruhige Zeile
    await tab(page, "Raum").click();
    await page.getByRole("button", { name: /Freie Raumform/ }).click();
    await tab(page, "Material").click();
    await expect(page.locator("[data-kp-foto]")).toHaveCount(0);
    await expect(page.locator("[data-kp-foto-none]")).toHaveText("Für diese Grundform gibt es noch keine Fotoansicht.");
    await expect(page.locator("[data-kp-foto-none]")).toBeVisible();

    // Kein Überlauf der Seite durch das Bild
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    await page.waitForTimeout(800);
    const r = await cls(page);
    await ctx.close();
    test.info().annotations.push({ type: "cls", description: `${name}: CLS ${r.cls.toFixed(4)} ${JSON.stringify(r.shifts)}` });
    console.log(`[kp-foto] ${name}: CLS ${r.cls.toFixed(4)} ${JSON.stringify(r.shifts)}`);
    expect(r.cls, JSON.stringify(r.shifts)).toBeLessThanOrEqual(0.05);
    expect(errors).toEqual([]);
  });
}

test("Englisch: Bildunterschrift „Visualisation (rendering)“", async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, baseURL });
  const origin = new URL(baseURL || "http://localhost:3000").origin;
  await ctx.addCookies([{ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: origin }]);
  const page = await ctx.newPage();
  await page.goto("/en/kuechenplaner?t=material", { waitUntil: "load" });
  await page.waitForSelector("[data-kp-hydrated] [data-kp-root]", { state: "visible", timeout: 60_000 });
  await expect(page.getByRole("tab", { name: "Materials" }).first()).toHaveAttribute("aria-selected", "true");
  const foto = page.locator("[data-kp-foto]");
  await expect(foto).toBeVisible();
  await expect(foto.locator("figcaption")).toContainText("Visualisation (rendering)");
  await expect(foto.getByRole("button", { name: "Eye level" })).toHaveAttribute("aria-pressed", "false");
  await ctx.close();
});
