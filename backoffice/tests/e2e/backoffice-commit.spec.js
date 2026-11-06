// E2E verzögerter Commit + Toast v2 (Team P0-3, MASTER G-03) gegen den laufenden Dev-Server (:3100, Mock).
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/backoffice-commit.spec.js --project=desktop
// Plant Demo-Vorgänge über POST /api/undo-commit {art:"demo-plane"} (nur Mock + Admin) und startet sie in der echten
// Shell über den Entwicklungs-Haken window.__phBoToast (ToastProvider, nie im Produktions-Build).
// Prüft: Route (Sitzung, Origin, Eingaben, fremde Tokens), Undo innerhalb 8 s → kein Ausführen, Ablauf → ausgeführt,
// Tab schließen → per Beacon ausgeführt, Kürzel Z, Toast-Darstellung (Material, 360 px, Balken, kein Versal).
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";

async function anmelden(page, email = "admin@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

/** POST /api/undo-commit aus der Seite (gleicher Origin, Sitzungs-Cookie). */
const api = (page, body) =>
  page.evaluate(async (b) => {
    const r = await fetch("/api/undo-commit", { method: "POST", body: JSON.stringify(b), headers: { "Content-Type": "text/plain;charset=UTF-8" } });
    return { status: r.status, json: await r.json().catch(() => null) };
  }, body);

async function bereit(page) {
  await page.goto("/");
  await page.waitForFunction(() => !!window.__phBoToast, null, { timeout: 60_000 });
  // Entwicklungs-Anzeige von Next (rundes „N“ unten rechts) liegt nur im Dev-Server über dem Toast-Schließknopf.
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
}

/** Demo-Vorgang planen und in der Shell starten. */
async function planeUndStarte(page, name, text = "Anfrage angenommen") {
  const r = await api(page, { art: "demo-plane", daten: { name } });
  expect(r.status).toBe(200);
  expect(r.json.ok).toBe(true);
  await page.evaluate(({ token, objekt, text: t }) => window.__phBoToast.starte(t, { token, objekt }), { token: r.json.token, objekt: r.json.objekt, text });
  return r.json.token;
}

const status = async (page, token) => (await api(page, { art: "status", tokens: [token] })).json.ergebnisse[0];

test.describe("Verzögerter Commit (G-03)", () => {
  test("Route: ohne Sitzung 401, fremde Herkunft 403, ungültige Eingabe 400", async ({ page, request }) => {
    const ohne = await request.post("/api/undo-commit", { data: "{}", headers: { "Content-Type": "text/plain" } });
    expect(ohne.status()).toBe(401);
    await anmelden(page);
    const fremd = await page.context().request.post("/api/undo-commit", { data: JSON.stringify({ tokens: ["c_" + "A".repeat(32)] }), headers: { Origin: "https://example.org", "Content-Type": "text/plain" } });
    expect(fremd.status()).toBe(403);
    await page.goto("/");
    expect((await api(page, { tokens: ["kaputt"] })).status).toBe(400);
    const unbekannt = await api(page, { tokens: ["c_" + "A".repeat(32)] });
    expect(unbekannt.status).toBe(200);
    expect(unbekannt.json.ergebnisse[0].code).toBe("not_found");
  });

  test("Undo innerhalb 8 s → kein Ausführen; ohne Undo → nach Ablauf gespeichert", async ({ page }) => {
    await anmelden(page);
    await bereit(page);
    const t1 = await planeUndStarte(page, "E2E-UNDO");
    const toast = page.getByTestId("toast-undo");
    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute("role", "status");
    await expect(toast.locator(".bo-toast-balken")).toHaveCount(1);
    await page.waitForTimeout(1500);
    await toast.getByTestId("toast-rueckgaengig").click();
    await expect(page.getByTestId("toast").filter({ hasText: "Rückgängig gemacht" })).toBeVisible();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(9000);
    expect((await status(page, t1)).zustand).toBe("verworfen");

    const t2 = await planeUndStarte(page, "E2E-ABLAUF");
    expect((await status(page, t2)).zustand).toBe("geplant");
    await expect(page.getByTestId("toast-undo")).toHaveCount(0, { timeout: 12_000 });
    await expect.poll(async () => (await status(page, t2)).zustand, { timeout: 5000 }).toBe("ausgefuehrt");
    expect((await status(page, t2)).quelle).toBe("client");
  });

  test("Taste Z nimmt den jüngsten Vorgang zurück; „Jetzt ausführen“ speichert sofort", async ({ page }) => {
    await anmelden(page);
    await bereit(page);
    const t1 = await planeUndStarte(page, "E2E-TASTE");
    await expect(page.getByTestId("toast-undo")).toBeVisible();
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("z");
    await expect.poll(async () => (await status(page, t1)).zustand, { timeout: 5000 }).toBe("verworfen");

    const t2 = await planeUndStarte(page, "E2E-JETZT");
    await page.locator('[data-testid="toast-undo"]:not([data-geht])').getByTestId("toast-jetzt").click();
    await expect.poll(async () => (await status(page, t2)).zustand, { timeout: 5000 }).toBe("ausgefuehrt");
  });

  test("Tab schließen → ausstehende Änderung wird per Beacon ausgeführt", async ({ page, context, browserName }) => {
    await anmelden(page);
    await bereit(page);
    const token = await planeUndStarte(page, "E2E-BEACON");
    await page.close({ runBeforeUnload: true });
    const p2 = await context.newPage();
    await p2.goto("/");
    await expect.poll(async () => (await status(p2, token)).zustand, { timeout: 10_000 }).toBe("ausgefuehrt");
    // Chromium: sendBeacon beim pagehide. WebKit (Playwright) meldet das Schließen teils erst nach einem
    // visibilitychange mit laufender Seite – dann speichert die Queue noch selbst. Beides: nie verloren.
    const quelle = (await status(p2, token)).quelle;
    if (browserName === "chromium") expect(quelle).toBe("beacon");
    else expect(["beacon", "client"]).toContain(quelle);
  });

  test("Toast v2: Lounge-Material, 360 px, unten rechts, Meldungen zusammengefasst, Fehler bleibt", async ({ page }) => {
    await anmelden(page);
    await bereit(page);
    await page.evaluate(() => {
      for (let i = 0; i < 3; i++) window.__phBoToast.zeige("Gespeichert.", { art: "ok" });
      window.__phBoToast.zeige("Speichern hat nicht geklappt.", { art: "fehler" });
    });
    const ok = page.getByTestId("toast").filter({ hasText: "Gespeichert." });
    await expect(ok).toHaveCount(1);
    await expect(ok).toContainText("3-mal");
    await page.waitForTimeout(900); // Feder des Erscheinens (scale .98 → 1) abwarten
    const mass = await ok.evaluate((el) => ({ breite: el.offsetWidth, rechts: el.getBoundingClientRect().right, fenster: innerWidth }));
    expect(mass.breite).toBe(Math.min(360, mass.fenster - 32));
    expect(mass.rechts).toBeGreaterThan(mass.fenster - 40);
    const stil = await ok.evaluate((el) => ({ filter: getComputedStyle(el).backdropFilter, radius: getComputedStyle(el).borderTopLeftRadius, border: getComputedStyle(el).borderTopWidth, transform: getComputedStyle(el).textTransform }));
    expect(stil.filter).toContain("blur");
    expect(stil.radius).toBe("20px");
    expect(stil.border).toBe("0px");
    expect(stil.transform).toBe("none");
    const fehler = page.getByTestId("toast").filter({ hasText: "nicht geklappt" });
    await expect(fehler).toHaveAttribute("role", "alert");
    await page.mouse.move(5, 5);
    await expect(ok).toHaveCount(0, { timeout: 6000 });
    await expect(fehler).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(fehler).toBeVisible();
    await fehler.getByRole("button", { name: "Hinweis schließen" }).click();
    await expect(fehler).toHaveCount(0);
  });
});
