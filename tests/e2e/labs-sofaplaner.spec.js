// Sofaplaner (Labs) – Restpunkte und Fehlerfälle im Browser (Runde 2), seit dem
// Umbau auf die Minotti-Modelle mit Startseite ?m=connery (Schritt 2, Planungsfläche
// sichtbar). Läuft im desktop-Projekt. Nicht-GET-Aufrufe an /api/** und /teilen
// werden abgefangen, es wird nichts gespeichert oder gesendet.
import { test, expect } from "@playwright/test";
import { blockFormSends, collectConsoleErrors, dismissCookieBanner } from "./helpers.js";
import { MINOTTI_DATA_CONSENT, NO_MINOTTI_REASON, SOFA_FAMILY } from "./sofaplaner-errors.js";

const PAGE = `/de/sofaplaner?m=${SOFA_FAMILY}`; // R7-P4: neutraler Typ ohne Minotti-Zustimmung

async function open(page, url = PAGE) {
  await blockFormSends(page);
  await page.route("**/sofaplaner/teilen", (route) =>
    route.request().method() === "GET" ? route.continue() : route.fulfill({ status: 503, contentType: "application/json", body: "{}" })
  );
  await page.goto(url);
  await dismissCookieBanner(page, 8_000);
  await page.locator("[data-hydrated=true]").waitFor({ timeout: 90_000 });
}

async function setRoom(page, label, value) {
  const panel = page.locator("details", { has: page.getByText("Raum, Fenster & Türen") });
  if (!(await panel.evaluate((d) => d.open))) await panel.locator("summary").click();
  const input = panel.getByLabel(label);
  await input.fill(String(value));
  await input.press("Enter");
}

test.describe("Sofaplaner R2", () => {
  test("Restpunkt 1: Raum verkleinern und wieder vergrößern → keine Überlappung", async ({ page }) => {
    await open(page);
    await page.getByRole("navigation", { name: "Schritte" }).getByRole("button", { name: /Im Raum prüfen/ }).click();
    const summary = page.locator("aside").getByText(/^(Passt|\d+ Konflikte?|\d+ Hinweise?)$/).first();
    await expect(summary).toHaveText("Passt");
    await setRoom(page, "Raumbreite", 300);
    await setRoom(page, "Raumtiefe", 220);
    await expect(summary).toContainText("Konflikt");
    await setRoom(page, "Raumbreite", 560);
    await setRoom(page, "Raumtiefe", 440);
    await expect(summary).toHaveText("Passt");
    const draft = await page.evaluate(() => JSON.parse(localStorage.getItem("ph.sofaplaner.draft") || "null"));
    expect(draft?.room).toEqual({ w: 560, d: 440 });
    expect(draft?.family).toBe(SOFA_FAMILY);
  });

  test("ohne WebGL: 3D-Knopf meldet den Grund, 2D bleibt", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        return /webgl/i.test(type) ? null : orig.call(this, type, ...rest);
      };
    });
    await open(page);
    await page.getByRole("button", { name: "3D-Vorschau" }).click();
    await expect(page.getByText("Ihr Browser unterstützt kein WebGL")).toBeVisible();
    await expect(page.getByRole("button", { name: "2D Draufsicht" })).toHaveAttribute("aria-pressed", "true");
    expect(errors).toEqual([]);
  });

  test("Kontextverlust in der 3D-Vorschau: zurück zu 2D mit Hinweis und „3D erneut öffnen“", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "3D-Vorschau" }).click();
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    const lost = await canvas.evaluate((c) => {
      const gl = c.getContext("webgl2") || c.getContext("webgl");
      const ext = gl?.getExtension("WEBGL_lose_context");
      if (!ext) return false;
      ext.loseContext();
      return true;
    });
    test.skip(!lost, "WEBGL_lose_context nicht verfügbar");
    await expect(page.getByText("Die 3D-Vorschau wurde vom Browser beendet.")).toBeVisible();
    await page.getByRole("button", { name: "3D erneut öffnen" }).click();
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 60_000 });
  });

  // Grün 30.10.2026: der Test oben verliert den Kontext je nach Tempo vor oder nach
  // dem Anlegen des Renderers (in Prod meist davor → three.js wirft im Konstruktor,
  // vorher hieß der Hinweis dann „konnte nicht geladen werden“). Hier wird der
  // frühe Fall erzwungen: der erste WebGL-Kontext eines Canvas im Dokument (nicht die
  // WebGL-Probe des Planers) ist schon verloren, wenn three.js ihn holt.
  test("Kontextverlust vor dem Anlegen des Renderers: Hinweis nennt den Kontextverlust", async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      let done = false;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        const ctx = orig.call(this, type, ...rest);
        if (!done && ctx && this.isConnected && /^webgl/.test(type)) {
          done = true;
          ctx.getExtension("WEBGL_lose_context")?.loseContext();
        }
        return ctx;
      };
    });
    await open(page);
    await page.getByRole("button", { name: "3D-Vorschau" }).click();
    await expect(page.getByText("Die 3D-Vorschau wurde vom Browser beendet.")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("Die 3D-Vorschau konnte nicht geladen werden.")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "2D Draufsicht" })).toHaveAttribute("aria-pressed", "true");
  });

  test("3D schließen ist kein Kontextverlust (keine Fehlermeldung)", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "3D-Vorschau" }).click();
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: "2D Draufsicht" }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText("Die 3D-Vorschau wurde vom Browser beendet.")).toHaveCount(0);
  });

  test("H1 mit Abstand unter dem neuen Header, nicht mehr 200 px tiefer", async ({ page }) => {
    await open(page, "/de/sofaplaner");
    const header = await page.locator("header").first().boundingBox();
    const h1 = await page.locator("h1").boundingBox();
    const gap = h1.y - (header.y + header.height);
    expect(gap).toBeGreaterThanOrEqual(40);
    expect(gap).toBeLessThanOrEqual(110);
  });

  test("QM R2 P2-1: ohne freigegebene Preistabelle keine Beträge, kein Klammertext", async ({ page }) => {
    await open(page);
    await expect(page.getByTestId("sp-price-hidden")).toBeVisible();
    // Integration 28.10.2026 (Expertenrat P0-15): kein interner Text mehr vor Kunden.
    await expect(page.getByTestId("sp-price-hidden")).toContainText("Richtpreis auf Anfrage");
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/\d\s?EUR|€\s?\d|\d\s?€/);
    expect(text).not.toContain("[Preis vom Inhaber festzulegen]");
    expect(text).not.toContain("Beispielwerte");
  });
});
