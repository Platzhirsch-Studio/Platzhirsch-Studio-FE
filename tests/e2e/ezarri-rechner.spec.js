// tests/e2e/ezarri-rechner.spec.js – Team C: Mosaik-Rechner, Custom Mix, Anfrage (Desktop).
// Doku: Marktresearch/digital/features/ezarri-rechner.md. Es wird NIE echt gesendet:
// /api/ezarri/anfrage wird per page.route abgefangen (Antwort wie im Dry-Run).
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { collectConsoleErrors, dismissCookieBanner, measureOverflow, settle } from "./helpers.js";

// Kein Querscroll der Seite. Scroll-Leisten (LocalNav, breite Tabelle in overflow-x-auto)
// zählen nicht: measureOverflow listet nur zur Diagnose.
// Dev-Server unter Last (mehrere Teams): Seite laden, bis 200 und H1 da sind.
// Cookie-Leiste vorab beantworten (nur notwendige), damit sie und das Dev-Overlay
// keine Klicks abfangen (Muster wie kuechenplaner-varianten-iphone.spec.js).
const consent = (origin) => ({ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: origin });

async function open(page, url) {
  await page.context().addCookies([consent(new URL(test.info().project.use.baseURL || "http://localhost:3000").origin)]);
  await expect(async () => {
    const res = await page.goto(url, { timeout: 120_000 });
    expect(res.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  }).toPass({ timeout: 360_000, intervals: [5_000, 10_000] });
}

async function noPageScroll(page) {
  const o = await measureOverflow(page);
  expect(o.sw, o.wide.join(" | ")).toBeLessThanOrEqual(o.vw);
}

const RECHNER = "/de/ezarri/rechner";
const MIX = "/de/ezarri/custom-mix";
const ANFRAGE = "/de/ezarri/anfrage";

async function interceptAnfrage(page) {
  const sent = [];
  await page.route("**/api/**", (route) => {
    const req = route.request();
    if (req.method() === "GET" || req.method() === "HEAD") return route.continue();
    sent.push({ path: new URL(req.url()).pathname, body: req.postDataJSON?.() ?? null });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, dryRun: true, id: "test" }) });
  });
  return sent;
}

// Insel reagiert erst nach der Hydration (Dev-Server): wiederholen, bis es greift.
async function fill(locator, value, check) {
  await expect(async () => {
    await locator.fill(value);
    await check();
  }).toPass({ timeout: 60_000, intervals: [1_000, 2_000, 4_000] });
}

test.describe("Ezarri Rechner, Custom Mix, Anfrage · Desktop", () => {
  test.describe.configure({ timeout: 480_000 });
  // Integration 28.10.2026 (Inhaber-Entscheidung Nr. 7 + 9): EZARRI_PUBLIC = true → indexierbar, Händler-Aussage sichtbar.
  test("Rechner: Ezarri-Prüfwert, Eingabe ändert Ergebnis und URL, Formel sichtbar, indexierbar", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const bad = [];
    page.on("response", (r) => r.status() >= 500 && bad.push(`${r.status()} ${new URL(r.url()).pathname}`));
    await open(page, RECHNER);
    await settle(page);
    await dismissCookieBanner(page);
    await expect(page.locator("h1")).toHaveCount(1);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).not.toMatch(/noindex/);
    const ergebnis = page.locator("#rr-ergebnis");
    await expect(ergebnis.getByRole("status").first()).toContainText("106");
    await expect(ergebnis).toContainText("53");
    await expect(ergebnis).toContainText("265 kg");
    await expect(ergebnis).toContainText("127 kg");
    await expect(page.getByRole("table")).toContainText("2 × 10 × 1,5 + 5 × (1 + 2)");

    await fill(page.getByLabel(/^Länge/), "12", async () => expect(page).toHaveURL(/[?&]l=12/));
    await expect(ergebnis.getByRole("status").first()).not.toContainText("106 m²");
    // Form wechseln: L-Form zeigt die Aussparung
    await page.getByText("L-Form", { exact: true }).click();
    await expect(page.getByLabel(/^Aussparung Länge/)).toBeVisible();
    // Fehler am Feld
    await page.getByLabel(/^Breite/).fill("abc");
    await expect(page.getByLabel(/^Breite/)).toHaveAttribute("aria-invalid", "true");
    await expect(ergebnis).toContainText("Bitte prüfen Sie die markierten Felder.");
    await page.getByLabel(/^Breite/).fill("5");

    // Neu laden mit URL: Zustand bleibt
    await page.waitForTimeout(400);
    const url = page.url();
    await open(page, url);
    await expect(page.getByLabel(/^Länge/)).toHaveValue("12");
    // Anfrage-Link trägt Fläche und Rechner-Zustand
    const href = await page.getByRole("link", { name: /Angebot und Muster anfragen/ }).getAttribute("href");
    expect(href).toMatch(/\/de\/ezarri\/anfrage\?art=angebot&(f=\w+&)?m2=\d+/); // f = Format (QM P2-5)
    expect(href).toContain("r=");
    await noPageScroll(page);
    expect(bad, "Serverfehler").toEqual([]);
    expect(errors).toEqual([]);
  });

  test("Rechner: Treppe und Rinne erscheinen als Teilflächen mit Formel", async ({ page }) => {
    await open(page, `${RECHNER}?tr=roemisch&ri=ueberlauf`);
    await settle(page);
    const table = page.getByRole("table");
    await expect(table).toContainText("Römische Treppe");
    await expect(table).toContainText("Nische");
    await expect(table).toContainText("Überlaufrinne");
  });

  test("Custom Mix: Vorschau gezeichnet, Anteile immer 100 %, Auswahl im Dialog, Teilen-URL", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const bad = [];
    page.on("response", (r) => r.status() >= 500 && bad.push(`${r.status()} ${new URL(r.url()).pathname}`));
    await open(page, MIX);
    await settle(page);
    await dismissCookieBanner(page);
    const canvas = page.locator("[data-mosaik-canvas]");
    await expect(canvas).toBeVisible();
    await expect
      .poll(async () => canvas.evaluate((c) => {
        const d = c.getContext("2d").getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data;
        return d[3];
      }), { timeout: 60_000 })
      .toBe(255);
    const sum = page.getByText(/^Summe \d+\s%$/);
    await expect(sum).toHaveText("Summe 100 %");

    // ± verändert den Anteil, Summe bleibt 100
    const first = page.locator("[data-anteil-feld]").first();
    const before = Number(await first.inputValue());
    await page.getByRole("button", { name: /1 % mehr$/ }).first().click();
    await expect(first).toHaveValue(String(before + 1));
    await expect(page).toHaveURL(/[?&]m=\d+-\d+/);
    await expect(sum).toHaveText("Summe 100 %");

    // Dialog: Mosaik hinzufügen
    const count = await page.locator("[data-anteil-feld]").count();
    await page.getByRole("button", { name: "Mosaik hinzufügen" }).click();
    const dialog = page.getByRole("dialog", { name: "Mosaik wählen" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("searchbox").fill("2505");
    await dialog.locator("button[aria-pressed=false]").first().click();
    await dialog.getByRole("button", { name: "Schließen" }).last().click();
    await expect(page.locator("[data-anteil-feld]")).toHaveCount(Math.min(4, count + 1));
    await expect(sum).toHaveText("Summe 100 %");

    // Unter Wasser, Fuge, Link zum Rechner und zur Anfrage
    await page.getByText("Unter Wasser", { exact: true }).click();
    await expect(page).toHaveURL(/[?&]w=1/);
    const anfrage = await page.getByRole("link", { name: "Muster dieser Mosaike anfragen" }).getAttribute("href");
    expect(anfrage).toMatch(/art=muster&ref=[a-z0-9-]+/);
    expect(await page.getByRole("link", { name: "Menge berechnen" }).getAttribute("href")).toMatch(/\/ezarri\/rechner\?.*m=\d+-\d+/);
    await noPageScroll(page);
    expect(bad, "Serverfehler").toEqual([]);
    expect(errors).toEqual([]);
  });

  test("Anfrage: Pflichtfelder, Chips aus ?ref=, Absenden nur abgefangen (Dry-Run)", async ({ page }) => {
    const sent = await interceptAnfrage(page);
    await open(page, `${ANFRAGE}?art=angebot&ref=2512-c,dune&m2=106`);
    await settle(page);
    await dismissCookieBanner(page);
    await expect(page.getByRole("radio", { name: /Angebot/ })).toBeChecked();
    await expect(page.locator("[data-ezarri-anfrage]")).toContainText("2512-C");
    await expect(page.getByLabel(/^Fläche/)).toHaveValue("106");
    const submit = page.getByRole("button", { name: "Anfrage senden" });
    await expect(submit).toBeEnabled({ timeout: 60_000 });
    await submit.click();
    await expect(page.getByRole("status").filter({ hasText: "Bitte prüfen Sie diese Angaben" })).toBeVisible();
    await expect(page.getByLabel(/^Name/)).toHaveAttribute("aria-invalid", "true");
    expect(sent).toEqual([]);

    await page.getByLabel(/^Name/).fill("Test Person");
    await page.getByLabel(/^E-Mail/).fill("test@beispiel.at");
    await page.getByRole("checkbox", { name: /kontaktieren/ }).check();
    // Chip entfernen
    await page.getByRole("button", { name: /entfernen$/ }).first().click();
    await page.waitForTimeout(3100); // Zeitfalle des Formular-Vertrags (3 s)
    await submit.click();
    await expect(page.getByText("Danke, Ihre Anfrage ist da.")).toBeVisible();
    await expect(page.getByText(/Testbetrieb/)).toBeVisible();
    expect(sent).toHaveLength(1);
    expect(sent[0].path).toBe("/api/ezarri/anfrage");
    expect(sent[0].body).toMatchObject({ art: "angebot", name: "Test Person", einwilligung: true, website: "" });
    expect(sent[0].body.referenzen).toHaveLength(1);
  });

  for (const path of [RECHNER, MIX, `${ANFRAGE}?art=muster&ref=2512-c`]) {
    test(`axe ohne serious/critical: ${path}`, async ({ page }) => {
      await open(page, path);
      await settle(page);
      await dismissCookieBanner(page);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).exclude("nextjs-portal").analyze();
      const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
      expect(bad).toEqual([]);
    });
  }

  // R7-P4 (bewusst geändert): Seit Runde 2 leitet die Shell EN/FR/IT-Ezarri-URLs per 308 auf die
  // deutsche Seite (?lang=…) statt 404.
  // Team Grün 30.10.2026 (begründet angepasst): Seit Welle 2 (Inhaber-Entscheidung 13) gibt es
  // Ezarri auf Englisch; /en/ezarri/* ist damit absichtlich 200 (r7-p6-release.spec.js). Die
  // Prüfung gilt jetzt für FR/IT; EN wird zusätzlich ausdrücklich als eigene Seite geprüft.
  // Sprach-Integration 01.11.2026 (bewusst geändert): der Rechner ist viersprachig;
  // Custom Mix und Anfrage (nur DE/EN) leiten FR/IT per 308 auf die englische Fassung.
  test("EN/FR eigene Seite; Custom Mix/Anfrage FR/IT → 308 auf Englisch", async ({ request }) => {
    for (const p of ["/en/ezarri/rechner", "/fr/ezarri/rechner"]) {
      const r = await request.get(p, { timeout: 180_000, maxRedirects: 0 });
      expect(r.status(), p).toBe(200);
      expect(await r.text()).toMatch(new RegExp(`<html[^>]*\\blang="${p.split("/")[1]}"`));
    }
    for (const p of ["/fr/ezarri/custom-mix", "/it/ezarri/anfrage"]) {
      const r = await request.get(p, { timeout: 180_000, maxRedirects: 0 });
      expect(r.status(), p).toBe(308);
      expect(r.headers().location || "", p).toContain(p.replace(/^\/(fr|it)\//, "/en/"));
    }
  });
});
