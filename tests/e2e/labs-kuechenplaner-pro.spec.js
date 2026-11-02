// Küchenplaner Pro (27.10.2026) – Interaktion im Browser: 3D erst auf Klick,
// Drag & Drop im Grundriss, Rückgängig, freie Raumform, Öffnungen, Ergonomie,
// Druckansicht; iPhone (WebKit): Bedienung per Tippen ohne Ziehen.
// Läuft im desktop-Projekt; iPhone (WebKit): labs-kuechenplaner-pro-iphone.spec.js.
// Sendet nie etwas: es wird kein Formular abgeschickt.
import { test, expect, devices } from "@playwright/test";

const PAGE = "/de/kuechenplaner";
const consent = (origin) => ({ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: origin });

async function open(page, query = "") {
  const origin = new URL(test.info().project.use.baseURL || "http://localhost:3000").origin;
  await page.context().addCookies([consent(origin)]);
  await page.goto(`${PAGE}${query}`);
  await expect(page.locator("h1")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("button", { name: "3D-Ansicht laden" })).toBeVisible({ timeout: 60_000 });
}
// Nur Module am Boden (Hängeschränke tragen "-u" in der ID und entstehen teils automatisch)
const BASE_MODS = '[data-mod]:not([data-mod*="-u"])';
const code = (page) => new URL(page.url()).searchParams.get("k");

test.describe("Küchenplaner Pro – Desktop", () => {
  test("Erstladen ohne three.js, 3D erst auf Klick", async ({ page }) => {
    const scripts = [];
    page.on("request", (r) => r.resourceType() === "script" && scripts.push(r.url()));
    await open(page);
    await page.waitForTimeout(1500);
    expect(scripts.filter((u) => /three|react-three/.test(u))).toEqual([]);
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("img", { name: /Grundriss/ }).first()).toBeVisible();
  });

  test("Drag & Drop im Grundriss verschiebt ein Modul, Rückgängig stellt es wieder her", async ({ page }) => {
    await open(page);
    await page.waitForTimeout(600);
    const before = code(page);
    const mod = page.locator('[data-mod="a-1"]');
    const box = await mod.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) await page.mouse.move(box.x + box.width / 2 + i * 12, box.y + box.height / 2, { steps: 2 });
    await page.mouse.up();
    await expect(page.getByRole("group", { name: "Ausgewähltes Modul" })).toBeVisible();
    await expect.poll(() => code(page), { timeout: 5000 }).not.toBe(before);
    const undo = page.getByRole("button", { name: /Rückgängig/ }).last();
    await expect(undo).toBeEnabled();
    await undo.click();
    await expect.poll(() => code(page), { timeout: 5000 }).toBe(before);
  });

  test("Palette: Antippen fügt ein Modul an, Pfeiltasten-Alternative verschiebt es", async ({ page }) => {
    await open(page);
    const n = await page.locator(BASE_MODS).count();
    await page.getByRole("button", { name: "Passstück / Blende hinzufügen" }).click();
    await expect(page.locator(BASE_MODS)).toHaveCount(n + 1);
    await page.locator('[data-mod="a-0"]').click();
    await page.getByRole("button", { name: "5 cm nach rechts" }).click();
    await expect(page.getByRole("group", { name: "Ausgewähltes Modul" })).toContainText(/ab 5 cm|ab 0 cm/);
  });

  test("Freie Raumform: Vorlage L-Raum, Schlusswand, Fenster eintragen, Prüfung und Maße", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: /Freie Raumform/ }).click();
    await page.getByRole("button", { name: "L-Raum" }).click();
    await expect(page.getByText(/Wand F schließt den Raum/)).toBeVisible();
    await page.locator("#kp-op-add").selectOption("fenster");
    await page.getByRole("button", { name: "Eintragen" }).click();
    await expect(page.locator("#kp-op-0-k")).toHaveValue("fenster");
    await page.getByRole("tab", { name: "Prüfen" }).first().click();
    await expect(page.getByRole("heading", { name: "Prüfung Ihrer Planung" })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("img", { name: "Draufsicht mit Maßketten" })).toBeVisible();
    await expect(page.getByRole("img", { name: /^Ansicht Wand A/ })).toBeVisible();
  });

  test("Ergonomie: große Körpergröße → Hinweis, „Anpassen“ setzt die Arbeitshöhe", async ({ page }) => {
    await open(page);
    const body = page.locator("#kp-body-n");
    await body.fill("180");
    await body.press("Enter");
    const fit = page.getByRole("button", { name: "Anpassen" });
    await expect(fit).toBeVisible();
    await fit.click();
    await expect(fit).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: "Arbeitshöhe" }).first()).toContainText(/empfohlen 99–104/);
  });

  test("Druckansicht: noindex, Grundriss, Ansichten, Stückliste, keine Beträge", async ({ page, request }) => {
    await open(page);
    await page.waitForTimeout(600);
    const k = code(page);
    const res = await request.get(`${PAGE}/druck?k=${k}`, { timeout: 120_000 });
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/<meta name="robots" content="noindex/);
    expect(html).toContain("Stückliste");
    expect(html).toContain("Grundriss mit Maßketten");
    // R5 (bewusst geändert): nur der sichtbare Teil – die eingebetteten Messages der Shell (RSC-Skripte)
    // enthalten die Wertbänder des Dreiländer-Rechners („bis 5.000 €“), das sind keine Beträge der Planung.
    expect(html.replace(/<script[\s\S]*?<\/script>/g, "")).not.toMatch(/€\s?\d|\d\s?€/);
    // Sprach-Integration 01.11.2026 (bewusst geändert): die Druckansicht gibt es in
    // allen vier Sprachen (vorher 404 über FOREIGN_GATED_404 in src/proxy.js); noindex.
    expect((await request.get("/en/kuechenplaner/druck")).status()).toBe(200);
  });
});
