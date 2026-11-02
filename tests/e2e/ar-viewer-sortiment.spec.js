// AR-Viewer für das ganze Sortiment: Liste (Suche, Filter, Verlauf, Bottom-Sheet),
// Produktseite (AR-Foto, Raumbedarf 2b, Maße aus Herstellerquelle, QR-Übergabe mit
// SITE_URL, Fehlerfall Chunk-Abbruch) auf Desktop (Chromium) und iPhone (WebKit).
// Nichts wird gesendet.
//   npx playwright test tests/e2e/ar-viewer-sortiment.spec.js --project=desktop
import { test, expect as baseExpect, webkit, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
import { collectConsoleErrors, dismissCookieBanner } from "./helpers.js";

// Filter-Navigation rendert im Dev-Server teils > 15 s (QA-Messvorbehalt) – großzügig warten.
const expect = baseExpect.configure({ timeout: 90_000 });
const LIST = "/de/3d-ansicht";
const PILOT = "/de/3d-ansicht/garden-chairs-jazz-spring-chair";
const RAUM = "/de/3d-ansicht/tables-connery"; // Minotti Connery: Stufe 2b, ohne Bildnutzung
const OHNE = "/de/3d-ansicht/produkt-aeron"; // Minotti ohne Herstellermaße
const waitLoaded = (page) => page.waitForFunction(() => document.querySelector("model-viewer")?.loaded, null, { timeout: 90_000 });
const ready = (page) => page.waitForSelector("form[data-ready]", { timeout: 90_000 });
// Fix-Runde 1 (F2): Rechte-Status „unklar“ gilt öffentlich wie „nein“ – die
// Solpuri-AR-Fotos (Freistellung ohne schriftliche Freigabe) erscheinen nicht mehr,
// dieselben Produkte zeigen den Raumbedarf (2b). Filter ohne Treffer sind ausgeblendet.
const AR_FOTOS = Object.keys(JSON.parse(readFileSync("src/lib/arviewer/arfotos.json", "utf8")).produkte);
const RAUM_IDS = new Set(Object.keys(JSON.parse(readFileSync("src/lib/arviewer/raumbedarf.json", "utf8")).produkte));
// Chunk mit model-viewer/three.js (Dev: Turbopack-Namen, Prod: Hash) – wie QA R1 P2-3
const STAGE_CHUNK = /\/_next\/static\/.*(three|model-viewer|ModelStage)/i;

test.describe("AR-Viewer Sortiment (Desktop)", () => {
  test.setTimeout(300_000);

  test("Liste: Suche oben, Reihe „Jetzt im Raum“, Filter mit Verlauf, keine GLB ohne Klick", async ({ page }) => {
    const glb = [];
    page.on("request", (r) => r.url().endsWith(".glb") && glb.push(r.url()));
    const errors = collectConsoleErrors(page);
    await page.goto(LIST);
    await dismissCookieBanner(page, 8_000);
    await ready(page);
    const list = page.getByTestId("arv-sortiment-liste");
    await expect(list.locator("li")).toHaveCount(24);
    await expect(page.getByTestId("arv-raum-reihe").locator("li").first()).toBeVisible();
    // Standardliste ohne „Noch ohne Bild“
    await expect(list.locator('[data-stufe="ohne-bild"]')).toHaveCount(0);
    // Keine leeren oder internen Filter: kein „AR-Foto“ (0 öffentlich), kein „Noch ohne Bild“
    await expect(page.locator("label").filter({ hasText: "AR-Foto in Originalgröße" })).toHaveCount(0);
    await expect(page.locator("label").filter({ hasText: "Noch ohne Bild" })).toHaveCount(0);
    await expect(list.locator('[data-stufe="ar-foto"]')).toHaveCount(0);
    expect(AR_FOTOS.every((id) => RAUM_IDS.has(id))).toBe(true); // jedes frühere AR-Foto hat Raumbedarf
    await page.locator("label").filter({ hasText: "Raumbedarf in Originalgröße" }).click();
    await expect(page).toHaveURL(/stufe=raumbedarf/);
    // Marken ohne Treffer sind ausgeblendet (keine Option mit „(0)“)
    const zero = await page.locator("#arv-marke option").evaluateAll((os) => os.filter((o) => /\(0\)$/.test(o.textContent.trim())).length);
    expect(zero).toBe(0);
    await page.locator("#arv-marke").selectOption("solpuri");
    await expect(page).toHaveURL(/marke=solpuri/);
    await expect(list.locator('[data-stufe="raumbedarf"]').first()).toBeVisible();
    // Zurück-Taste stellt den Filter zurück und bleibt auf der Seite
    await page.goBack();
    await expect(page).toHaveURL(/stufe=raumbedarf/);
    await expect(page).not.toHaveURL(/marke=/);
    await expect(page.locator("#arv-marke")).toHaveValue("");
    // Chip „Im Raum ansehen“ fasst 2a + 2b zusammen. R2 neuland P1-1 (bewusst geändert):
    // Gibt es öffentlich nur EINE Raum-Ansicht (heute nur Raumbedarf), wäre der Chip dieselbe
    // Menge unter zweitem Namen – er ist dann ausgeblendet, die URL ?stufe=raum gilt weiter.
    await expect(page.locator("label").filter({ hasText: "Im Raum ansehen" })).toHaveCount(0);
    await page.goto(`${LIST}${LIST.includes("?") ? "&" : "?"}stufe=raum`);
    await ready(page);
    await expect(page).toHaveURL(/stufe=raum/);
    await expect(page.locator("label").filter({ hasText: "Im Raum ansehen" })).toHaveCount(1);
    await expect(list.locator('[data-stufe="raumbedarf"]').first()).toBeVisible();
    // Suche mit Tippfehler-Toleranz
    await page.locator("#arv-q").fill("conery");
    await expect(page).toHaveURL(/q=conery/);
    await expect(list.getByRole("link", { name: "Connery" })).toBeVisible();
    expect(glb).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("Raumbedarf (Minotti): Herstellermaße mit Quelle, Quader in 3D, Maße einblenden, QR mit SITE_URL", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(RAUM);
    await dismissCookieBanner(page, 8_000);
    await expect(page.locator('[data-stufe="raumbedarf"]').first()).toBeVisible();
    const masse = page.getByTestId("arv-produkt-masse");
    await expect(masse).toContainText(/Breite\s*214 cm/);
    await expect(masse.getByRole("link", { name: /Datenblatt Minotti/ })).toHaveAttribute("href", /minotti\.com\/downloads\/.+CONNERY_TECHNICAL_SHEET\.pdf$/);
    await page.getByRole("button", { name: "Raumbedarf in 3D drehen" }).click();
    await waitLoaded(page);
    await expect(page.locator("model-viewer")).toHaveAttribute("ios-src", /\/labs\/ar-viewer\/raum\/tables-connery\.usdz$/);
    await page.getByRole("button", { name: "Maße einblenden" }).click();
    await expect(page.locator('[slot="hotspot-dim+Y-Z"]')).toHaveText("214 cm");
    await page.getByRole("button", { name: "Auf dem Smartphone im Raum ansehen" }).click();
    const dlg = page.getByRole("dialog");
    await expect(dlg.getByRole("img", { name: /QR-Code/ })).toBeVisible();
    await expect(dlg).toContainText("platzhirsch.studio/de/3d-ansicht/tables-connery?von=qr");
    await expect(dlg).not.toContainText("localhost");
    await page.keyboard.press("Escape");
    expect(errors).toEqual([]);
  });

  test("Raumbedarf (früher AR-Foto): Maße nur aus dem Datenblatt, kein Rechte-Hinweis", async ({ page }) => {
    await page.goto("/de/3d-ansicht/sun-loungers-jazz-lounger");
    await dismissCookieBanner(page, 8_000);
    await expect(page.locator("main")).not.toContainText(/Labs-Test|Stufe \d|Was als Nächstes|untersagt/);
    await page.getByRole("button", { name: "Raumbedarf in 3D drehen" }).click();
    await waitLoaded(page);
    await page.getByRole("button", { name: "Maße einblenden" }).click();
    const h = await page.locator('[slot="hotspot-dim+X-Z"]').textContent();
    const datenblatt = await page.getByTestId("arv-produkt-masse").locator("dd").nth(2).textContent();
    expect(h.trim()).toBe(datenblatt.trim());
  });

  test("Ohne Herstellermaße: „Passt es in Ihren Raum?“ mit Anfrage, Termin, Merkliste", async ({ page }) => {
    await page.goto(OHNE);
    await expect(page.locator('[data-stufe="bild"]').first()).toBeVisible();
    await expect(page.getByTestId("arv-ar-launch")).toHaveCount(0);
    const passt = page.getByTestId("arv-passt");
    await expect(passt.getByRole("heading", { name: "Passt es in Ihren Raum?" })).toBeVisible();
    await expect(passt.getByRole("link", { name: "Termin mit diesem Produkt" })).toHaveAttribute("href", /\/de\/beratung\?produkt=/);
    await expect(page.getByTestId("arv-produkt-masse")).toContainText("Maße fehlen");
  });

  test("Fehlerfall: Chunk-Abbruch bleibt in der Bühne, „Erneut versuchen“ lädt neu", async ({ page }) => {
    let block = true;
    await page.route(STAGE_CHUNK, (r) => (block ? r.abort() : r.continue()));
    await page.goto(PILOT);
    await dismissCookieBanner(page, 8_000);
    await page.getByRole("button", { name: "Raumbedarf in 3D drehen" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "konnte nicht geladen werden" })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); // Seite steht noch
    block = false;
    await page.getByRole("button", { name: "Erneut versuchen" }).click();
    await waitLoaded(page);
  });
});

test("iPhone (WebKit): Suche im ersten Viewport, Filter im Bottom-Sheet, AR-Knopf über dem Falz", async () => {
  test.setTimeout(480_000);
  const browser = await webkit.launch();
  const context = await browser.newContext({ ...devices["iPhone 15 Pro"], baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  const errors = collectConsoleErrors(page);
  try {
    await page.goto(LIST);
    await dismissCookieBanner(page, 8_000);
    const vh = page.viewportSize().height;
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect((await page.locator("#arv-q").boundingBox()).y).toBeLessThan(vh);
    await expect(page.locator("#arv-marke")).toBeHidden(); // im geschlossenen Sheet
    await ready(page);
    await page.getByRole("button", { name: /^Filter/ }).tap();
    await expect(page.getByRole("dialog", { name: "Filter" })).toBeVisible();
    await page.locator("#arv-marke").selectOption("minotti");
    await expect(page).toHaveURL(/marke=minotti/, { timeout: 90_000 });
    await page.getByRole("button", { name: /Produkte zeigen/ }).tap();
    await expect(page.getByRole("dialog", { name: "Filter" })).toBeHidden();
    await page.goto(RAUM);
    const btn = page.getByTestId("arv-ar-start");
    await expect(btn).toBeVisible();
    expect((await btn.boundingBox()).y + 48).toBeLessThan(vh);
    await expect(page.getByRole("button", { name: "Auf dem Smartphone im Raum ansehen" })).toHaveCount(0);
    await expect(page.getByTestId("arv-produkt-masse")).toContainText(/Tiefe\s*102 cm/);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await browser.close();
  }
});
