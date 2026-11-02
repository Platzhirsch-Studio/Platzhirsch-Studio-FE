// Küchenplaner (Labs), Runde 2 – Fehlerfälle und Auflagen im Browser.
// Läuft im desktop-Projekt (playwright.config.js). Sendet nie echt: alle
// Nicht-GET-Aufrufe an /api/** werden abgefangen (blockFormSends bzw. eigene route).
import { test, expect } from "@playwright/test";
import { blockFormSends, collectConsoleErrors } from "./helpers.js";

const PAGE = "/de/kuechenplaner";

// Produktions-Build ohne NEXT_PUBLIC_LABS_PLANER_SENDEN=1 (QM R2 P2-2): Der Planer
// versendet nichts. Fix-Runde 1 (F2, P0): Statt des früheren „Testphase“-Hinweises
// (Sackgasse) steht dort kein Formular, sondern die Übergabe an /de/beratung
// ([data-kp-handoff]). Formular-Tests werden in diesem Fall übersprungen.
async function formGated(page) {
  const handoff = page.locator("[data-kp-handoff]");
  await expect(handoff.or(page.locator("#kp-f-vorname")).first()).toBeVisible({ timeout: 30_000 });
  if (await handoff.isVisible()) {
    test.skip(true, "Produktions-Build: Versand gesperrt (NEXT_PUBLIC_LABS_PLANER_SENDEN fehlt), Übergabe an /de/beratung statt Formular");
  }
}

// R6-portal-labs: Die Cookie-Leiste wird nicht mehr weggeklickt. Sie erscheint
// nach der Hydration, genau dann, wenn die 3D-Szene startet; im Headless-Chrome
// (Software-WebGL) blockiert deren Aufbau (Shader, Schatten, Environment) den
// Haupt-Thread für Sekunden, und der Klick auf „Weiter ohne Einwilligung“ lief
// in r5-fix ins actionTimeout (:42 rot, :62/:147 flaky). Darum ist die
// Entscheidung vorab gesetzt: Einwilligungs-Cookie „nur notwendige“, wie in
// r4-shell.spec.js und r5-shell-seo.spec.js – die Leiste erscheint gar nicht.
// Tests, die die 3D-Ansicht nicht brauchen (Formular, Preis, Layout), öffnen den
// Planer mit „Daten sparen“ (navigator.connection.saveData): Der Planer lädt die
// Szene dann erst auf Klick (Viewer.js), die Eingaben laufen ohne WebGL-Last.
const consentDecided = (origin) => ({
  name: "cookieConsent",
  value: encodeURIComponent(JSON.stringify({ essential: true })),
  url: origin,
});

async function open(page, query = "", { with3D = false } = {}) {
  const origin = new URL(test.info().project.use.baseURL || "http://localhost:3000").origin;
  await page.context().addCookies([consentDecided(origin)]);
  if (!with3D) {
    await page.addInitScript(() => {
      const c = navigator.connection;
      if (c) Object.defineProperty(c, "saveData", { get: () => true, configurable: true });
      else Object.defineProperty(Navigator.prototype, "connection", { get: () => ({ saveData: true }), configurable: true });
    });
  }
  await page.goto(`${PAGE}${query}`);
  // Dev: ein fremder Speichervorgang kann einen Fast-Refresh-Reload auslösen, daher großzügig.
  await expect(page.locator("h1")).toBeVisible({ timeout: 60_000 });
  // Erst nach der Hydration eingeben/klicken: Vorher schickt „Planung anfragen“
  // das Formular nativ ab (Navigation statt fetch, r6 Dev-Lauf 2). Der Knopf
  // „3D-Ansicht laden“ entsteht nur im Client (Viewer.js, „Daten sparen“).
  if (!with3D) await expect(page.getByRole("button", { name: "3D-Ansicht laden" })).toBeVisible({ timeout: 60_000 });
}

test.describe("Küchenplaner R2", () => {
  test("ohne WebGL: Grundriss, Hinweis, kein 3D-Knopf, keine Konsolenfehler", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (/webgl/i.test(type)) return null;
        return orig.call(this, type, ...rest);
      };
    });
    await open(page, "", { with3D: true });
    await expect(page.getByRole("note")).toContainText("kein WebGL");
    await expect(page.getByRole("img", { name: /Grundriss/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "3D-Ansicht laden" })).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("Kontextverlust: zurück zum Grundriss, „3D erneut laden“ baut die Szene wieder auf", async ({ page }) => {
    await open(page, "", { with3D: true });
    // Pro-Ausbau: three.js lädt erst auf Klick (Erstladen ohne 3D-Code).
    await page.getByRole("button", { name: "3D-Ansicht laden" }).click();
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    // warten, bis die Szene fertig ist (Grundriss ausgeblendet)
    await expect(page.getByRole("status").filter({ hasText: "3D-Ansicht wird geladen" })).toHaveCount(0, { timeout: 60_000 });
    const lost = await canvas.evaluate((c) => {
      const gl = c.getContext("webgl2") || c.getContext("webgl");
      const ext = gl?.getExtension("WEBGL_lose_context");
      if (!ext) return false;
      ext.loseContext();
      return true;
    });
    test.skip(!lost, "WEBGL_lose_context nicht verfügbar");
    await expect(page.getByText("Die 3D-Ansicht wurde vom Browser beendet.")).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    await page.getByRole("button", { name: "3D erneut laden" }).click();
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 60_000 });
  });

  test("Anfrage: Fehler der Route erscheint deutsch aus dem code, nie der englische error", async ({ page }) => {
    const calls = [];
    await page.route("**/api/**", (route) => {
      const req = route.request();
      if (req.method() === "GET" || req.method() === "HEAD") return route.continue();
      const path = new URL(req.url()).pathname;
      calls.push(path);
      if (path.endsWith("/labs/kuechenplaner/plan")) {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, id: "test", sig: "x", imagePath: null }) });
      }
      return route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({ success: false, code: "rate_limited", error: "Too many requests. Please try again later." }),
      });
    });
    // ?senden=1 schaltet im Dev den Testmodus ab – die Aufrufe landen trotzdem nur in route() oben.
    await open(page, "?t=ergebnis&senden=1");
    await formGated(page);
    await page.locator("#kp-f-vorname").fill("Test");
    await page.locator("#kp-f-nachname").fill("Person");
    await page.locator("#kp-f-email").fill("test@example.com");
    await page.locator("#kp-f-telefon").fill("+43 000 000000");
    await page.locator("form input[type=checkbox]").check();
    await page.getByRole("button", { name: "Planung anfragen" }).click();
    const alert = page.getByRole("alert").filter({ hasText: "Anfragen" });
    await expect(alert).toContainText("Zu viele Anfragen in kurzer Zeit");
    await expect(alert).not.toContainText("Too many");
    expect(calls).toContain("/api/beratung_anfrage");
  });

  test("Anfrage: Netzwerkfehler → deutscher Hinweis mit Telefonnummer", async ({ page }) => {
    const calls = [];
    await page.route("**/api/**", (route) => {
      const req = route.request();
      if (req.method() === "GET" || req.method() === "HEAD") return route.continue();
      calls.push(new URL(req.url()).pathname);
      if (new URL(req.url()).pathname.endsWith("/plan")) {
        return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true,"id":"t","sig":"x","imagePath":null}' });
      }
      return route.abort("internetdisconnected");
    });
    await open(page, "?t=ergebnis&senden=1");
    await formGated(page);
    await page.locator("#kp-f-vorname").fill("Test");
    await page.locator("#kp-f-nachname").fill("Person");
    await page.locator("#kp-f-email").fill("test@example.com");
    await page.locator("#kp-f-telefon").fill("+43 000 000000");
    await page.locator("form input[type=checkbox]").check();
    await page.getByRole("button", { name: "Planung anfragen" }).click();
    const alert = page.getByRole("alert").filter({ hasText: "Verbindung" });
    await expect(alert).toContainText("+43 5574 46255");
  });

  test("Testmodus (ohne ?senden=1) schickt nichts", async ({ page }) => {
    const blocked = await blockFormSends(page);
    await open(page, "?t=ergebnis");
    await formGated(page);
    await page.locator("#kp-f-vorname").fill("Test");
    await page.locator("#kp-f-nachname").fill("Person");
    await page.locator("#kp-f-email").fill("test@example.com");
    await page.locator("#kp-f-telefon").fill("+43 000 000000");
    await page.locator("form input[type=checkbox]").check();
    await page.getByRole("button", { name: "Planung anfragen" }).click();
    // Dev: Vorschau des Testmodus. Produktion ohne Freigabe: Hinweis mit Telefonnummer.
    // In beiden Fällen darf kein Request rausgehen.
    await expect(page.getByTestId("kp-dryrun")).toBeVisible();
    expect(blocked).toEqual([]);
  });

  test("Fix1 P0: Übergabe an die Beratung statt Sackgasse (?uebergabe=1 im Dev, Standard im Produktions-Build)", async ({ page }) => {
    const blocked = await blockFormSends(page);
    await open(page, "?t=ergebnis&uebergabe=1");
    const handoff = page.locator("[data-kp-handoff]");
    await expect(handoff).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/Testphase|versendet keine Anfragen/);
    const link = handoff.getByRole("link", { name: "Mit dieser Planung Beratung anfragen" });
    const href = await link.getAttribute("href");
    const u = new URL(href, "http://x");
    expect(u.pathname).toBe("/de/beratung");
    expect(u.searchParams.get("planer")).toBe("kuechenplaner");
    expect(u.searchParams.get("produkt")).toMatch(/^3D-Küchenplaner/);
    // Kontext für die Beratungsseite (sessionStorage), ohne etwas zu senden
    await link.evaluate((a) => a.addEventListener("click", (e) => e.preventDefault()));
    await link.click();
    const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem("ph-planer-uebergabe") || "null"));
    expect(stored?.planer).toBe("kuechenplaner");
    expect(stored?.text).toContain("Grundform:");
    expect(blocked).toEqual([]);
  });

  test("Desktop 1440×900: Preis und „Anfragen“ über dem Falz, H1 mit Abstand unter dem Header", async ({ page }) => {
    await open(page);
    const header = await page.locator("header").first().boundingBox();
    const h1 = await page.locator("h1").boundingBox();
    expect(h1.y - (header.y + header.height)).toBeGreaterThanOrEqual(40);
    const btn = page.getByRole("button", { name: "Anfragen", exact: true }).first();
    const box = await btn.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(900);
  });

  test("QM R2 P2-1: ohne freigegebene Preistabelle keine Beträge, kein Klammertext", async ({ page }) => {
    await open(page, "?t=ergebnis");
    await expect(page.getByTestId("kp-price-hidden")).toBeVisible();
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/€\s?\d|\d\s?€|EUR\s?\d|\d\s?EUR/);
    expect(text).not.toContain("[Preis vom Inhaber festzulegen]");
    expect(text).not.toContain("Beispielwerte");
  });
});
