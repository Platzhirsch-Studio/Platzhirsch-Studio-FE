// Ezarri-Konfigurator (Team B) – Desktop (Chromium, Projekt "desktop").
// Laden, robots, Konsolenfehler, Tastatur, Mischung, Link-Zustand ?k=, ohne WebGL,
// Musteranfrage-Link (nichts wird gesendet), Druckblatt, Katalog-Route, 3D lazy.
// Doku: Marktresearch/digital/features/ezarri-konfigurator.md
import { test, expect } from "@playwright/test";
import { blockFormSends, collectConsoleErrors } from "./helpers.js";

const PAGE = "/de/ezarri/konfigurator";
const consent = (origin) => ({ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: origin });

async function open(page, query = "", { noWebGL = false } = {}) {
  const origin = new URL(test.info().project.use.baseURL || "http://localhost:3000").origin;
  await page.context().addCookies([consent(origin)]);
  if (noWebGL) {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (/webgl/i.test(String(type))) return null;
        return orig.call(this, type, ...rest);
      };
    });
  }
  await blockFormSends(page);
  // nicht auf "load" warten (Dev-Server/HMR); Bereitschaftssignal ist [data-ezk-ready] (QM P2-6)
  await page.goto(`${PAGE}${query}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await expect(page.locator("h1")).toHaveText("Becken gestalten", { timeout: 90_000 });
  await expect(page.locator("[data-ezk-ready]")).toBeAttached({ timeout: 120_000 });
}

const kOf = (page) => new URL(page.url()).searchParams.get("k");

test.describe("Ezarri-Konfigurator – Desktop", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Desktop-Spec läuft in Chromium");

  // Integration 28.10.2026 (Inhaber-Entscheidung Nr. 7 + 9): EZARRI_PUBLIC = true → indexierbar, Händler-Aussage sichtbar.
  test("lädt mit H1, indexierbar (Schalter EZARRI_PUBLIC an), ohne Konsolenfehler", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await open(page);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).not.toContain("noindex");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("[data-ezk-kurz]")).toContainText("m²");
    await expect(page.locator("[data-ezk-kurz]")).toContainText("Kartons");
    // keine Preise
    expect(await page.locator("main").innerText()).not.toMatch(/€|EUR\s?\d/);
    expect(errors).toEqual([]);
  });

  test("375 px ohne seitliches Scrollen", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await open(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("Tastatur: Tabs mit Pfeiltasten, Szene per Radio, Strg+Z macht rückgängig", async ({ page }) => {
    await open(page);
    const tab = page.getByRole("tab", { name: "Mosaik" });
    await tab.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Becken" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tab", { name: "Becken" })).toBeFocused();
    const pool = page.getByRole("radio", { name: "Pool", exact: true });
    await pool.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("radio", { name: "Whirlpool" })).toBeChecked();
    await expect.poll(() => kOf(page) || "", { timeout: 5000 }).not.toBe("");
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("Control+z");
    await expect(page.getByRole("radio", { name: "Pool", exact: true })).toBeChecked();
    await page.keyboard.press("Control+Shift+z");
    await expect(page.getByRole("radio", { name: "Whirlpool" })).toBeChecked();
  });

  test("Mischung: Mosaik hinzufügen, Anteil per Zahlenfeld, Summe 100, Link stellt den Entwurf wieder her", async ({ page }) => {
    // unter 1024 px startet die 3D-Bühne nicht von selbst: Ein Erst-Kompilat des 3D-Chunks im Dev-Server
    // löste sonst mitten im Test ein Neuladen aus (Verlauf leer, Wert zurück auf den Link-Stand)
    await page.setViewportSize({ width: 1000, height: 800 });
    await open(page);
    await page.getByRole("radio", { name: /Eigene Mischung/ }).check();
    await page.locator("[data-ezk-add]").click();
    const dlg = page.locator("[data-ezk-picker]");
    await expect(dlg).toBeVisible();
    await expect(dlg.locator("[data-ezk-results] button").first()).toBeVisible({ timeout: 60_000 });
    await dlg.locator('input[type="search"]').fill("2502-A");
    await dlg.locator('[data-ref="2502-a"]').click();
    await expect(dlg).toBeHidden();
    const field = page.getByLabel("Anteil 2508-A in Prozent");
    await field.fill("70");
    await field.press("Enter");
    await expect(page.getByLabel("Anteil 2502-A in Prozent")).toHaveValue("30");
    await expect(page.getByRole("slider", { name: /Grenze zwischen 2508-A und 2502-A/ })).toHaveAttribute("aria-valuenow", "70");
    // Grenze per Tastatur
    const grenze = page.getByRole("slider", { name: /Grenze zwischen/ });
    await grenze.focus();
    await expect(grenze).toBeFocused();
    await expect(grenze).toHaveAttribute("aria-valuenow", "70");
    await grenze.press("ArrowLeft");
    await expect(page.getByLabel("Anteil 2508-A in Prozent")).toHaveValue("69");
    // warten, bis der Link (250 ms entprellt) den aktuellen Stand trägt, nicht nur irgendeinen
    await expect.poll(() => Buffer.from(kOf(page) || "", "base64url").toString("utf8"), { timeout: 10_000 }).toContain('"anteil":69');
    const url = page.url();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await expect(page.locator("[data-ezk-ready]")).toBeAttached({ timeout: 120_000 });
    await expect(page.getByLabel("Anteil 2508-A in Prozent")).toHaveValue("69");
    await expect(page.getByLabel("Anteil 2502-A in Prozent")).toHaveValue("31");
  });

  test("Ohne WebGL: 2D-Draufsicht mit Hinweis, Mengen und Link funktionieren", async ({ page }) => {
    await open(page, "", { noWebGL: true });
    await expect(page.getByText("Ihr Browser zeigt kein WebGL")).toBeVisible();
    await expect(page.locator("[data-ezk-stage]")).toHaveAttribute("data-mode", "2d");
    const painted = await page.locator("[data-ezk-stage] canvas").first().evaluate((c) => {
      const d = c.getContext("2d").getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data;
      return d[3] > 0 && d[0] + d[1] + d[2] > 0;
    });
    expect(painted).toBe(true);
    await page.getByRole("tab", { name: "Mengen" }).click();
    await expect(page.locator("[data-ezk-mengen]")).toContainText("Bestellmenge");
  });

  test("Muster anfragen: Link mit Referenz und Entwurf, nichts wird gesendet", async ({ page }) => {
    const sent = await blockFormSends(page);
    await open(page);
    const href = await page.locator("[data-ezk-muster]").getAttribute("href");
    expect(href).toMatch(/^\/de\/ezarri\/anfrage\?art=muster&ref=2508-a/);
    expect(href).toMatch(/[?&]k=[A-Za-z0-9_-]+/);
    expect(href).toContain("quelle=konfigurator");
    expect(Array.isArray(sent) ? sent.length : 0).toBe(0);
  });

  test("Druckblatt: Becken, Mosaik, Mengen und QR-Code, ohne Preise", async ({ page }) => {
    await open(page);
    await page.getByRole("tab", { name: "Mengen" }).click();
    const href = await page.locator("[data-ezk-blatt]").getAttribute("href");
    await page.goto(href, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ihr Becken-Entwurf", { timeout: 90_000 });
    // Bild der Ansicht: 3D-Standbild (auch ohne vorherige 3D-Bühne) oder 2D-Rückfall (QM P2-5)
    await expect(page.locator("[data-ezk-blatt-bild]")).toBeAttached({ timeout: 120_000 });
    await expect(page.locator("[data-ezk-blatt] svg").first()).toBeAttached();
    const text = await page.locator("[data-ezk-blatt]").innerText();
    expect(text).toContain("Kartons");
    expect(text).toContain("2508-A");
    expect(text).not.toContain("(2508-a)");
    expect(text).toContain("Daten: Ezarri");
    expect(text).not.toMatch(/€|EUR\s?\d/);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    // Druckblatt bleibt Hilfsseite: auch mit EZARRI_PUBLIC = true noindex, follow (Integration 28.10.2026).
    expect(robots).toBe("noindex, follow");
  });

  test("Katalog-Route: 402 Referenzen + 55 Safe-Varianten, noindex, keine Preise", async ({ request }) => {
    const res = await request.get(`${PAGE}/katalog`);
    expect(res.status()).toBe(200);
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
    const body = await res.json();
    expect(body.refs).toHaveLength(457);
    expect(body.refs.find((r) => r.id === "dune-safe")?.q).toBe("https://www.ezarri.com/de/dune?as-25");
    expect(JSON.stringify(body)).not.toMatch(/preis|€/i);
    // Dev-Server kann unter Last die Verbindung zurücksetzen: Status per poll, nicht einmalig
    // R7-P4 (bewusst geändert): Seit Runde 2 leitet die Shell EN/FR/IT-Ezarri-URLs per 308 auf die
    // deutsche Seite (?lang=…) statt 404 – es gibt weiterhin keine eigene fremdsprachige Ezarri-Seite.
    // Welle 2 (Inhaber Nr. 13, bewusst geändert): Die Ezarri-Welt gibt es jetzt auf Englisch
    // (ezarriLocaleEnabled("en")), der Katalog antwortet dort mit 200; geprüft wird FR.
    await expect
      .poll(async () => {
        const r = await request.get("/fr/ezarri/konfigurator/katalog", { maxRedirects: 0 }).catch(() => null);
        return r ? (r.status() === 404 || (r.status() === 308 && /\/de\/ezarri\/konfigurator\/katalog/.test(r.headers().location || "")) ? "ok" : r.status()) : 0;
      }, { timeout: 60_000 })
      .toBe("ok");
  });

  test("3D: kein three.js im ersten HTML, Bühne lädt bei Sichtbarkeit", async ({ page }) => {
    const res = await page.request.get(PAGE);
    const html = await res.text();
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    expect(scripts.some((s) => /three|react-three/i.test(s))).toBe(false);
    await open(page);
    const gl = await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2")));
    test.skip(!gl, "Chromium ohne WebGL in dieser Umgebung");
    await page.locator("[data-ezk-stage]").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-ezk-stage]")).toHaveAttribute("data-mode", "3d", { timeout: 150_000 });
    // Kamerapunkt per Radio, Tastatur auf der Bühne
    await page.getByRole("radio", { name: "Treppe", exact: true }).check();
    await page.locator("[data-ezk-stage]").focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("+");
    await expect(page.locator("[data-ezk-stage] canvas").last()).toBeVisible();
  });

  test("Auswahl: Esc schließt, Fokus zurück auf dem Auslöser; mobil 3 Spalten; Safe-Variante wählbar (QM P2-1, P2-3, P1-2)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    const btn = page.locator("[data-ezk-waehlen]");
    await btn.click();
    const dlg = page.locator("[data-ezk-picker]");
    await expect(dlg).toBeVisible();
    await expect(dlg.locator("[data-ezk-results] button").first()).toBeVisible({ timeout: 60_000 });
    const cols = await dlg.locator("[data-ezk-results]").evaluate((ul) => getComputedStyle(ul).gridTemplateColumns.split(" ").length);
    expect(cols).toBeGreaterThanOrEqual(3);
    await page.keyboard.press("Escape");
    await expect(dlg).toBeHidden();
    await expect(btn).toBeFocused();
    // Safe-Variante, die Ezarri nur als ?as-25 führt
    await btn.click();
    await expect(dlg.locator("[data-ezk-results] button").first()).toBeVisible({ timeout: 60_000 });
    await dlg.getByRole("radio", { name: /Rutschhemmend/ }).check();
    await dlg.locator('input[type="search"]').fill("Dune");
    await dlg.locator('[data-ref="dune-safe"]').click();
    await expect(dlg).toBeHidden();
    await expect(btn).toBeFocused();
    await expect(page.locator("[data-ezk-muster]")).toHaveAttribute("href", /ref=dune(&|$)/);
  });

  test("Ezarri-Mischung: unvollständiges Rezept (Mojito) nur als Referenz mit Hinweis, Neu beginnen fragt im eigenen Dialog", async ({ page }) => {
    await open(page);
    await page.getByRole("radio", { name: /Ezarri-Mischung/ }).check();
    const sel = page.getByLabel("Fertige Mischung laut Ezarri");
    await expect(sel.locator("option", { hasText: "Mojito" })).toBeAttached({ timeout: 60_000 });
    await sel.selectOption({ label: "Mojito · Cocktail" });
    await expect(page.locator("[data-ezk-rezept-hinweis]")).toContainText("Rezept unvollständig, Darstellung nach Produktfoto");
    await expect(page.getByLabel(/^Anteil .* in Prozent$/)).toHaveCount(0);
    await expect(page.locator("[data-ezk-rezept-hinweis]")).toContainText("Mojito");
    await page.getByRole("tab", { name: "Mengen" }).click();
    await page.getByRole("button", { name: "Neu beginnen" }).click();
    const d = page.locator("[data-ezk-bestaetigen]");
    await expect(d).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(d).toBeHidden();
    await expect(page.getByRole("button", { name: "Neu beginnen" })).toBeFocused();
  });
});
