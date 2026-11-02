// tests/e2e/concierge-sitewide.spec.js — KI-Concierge seitenweit (Website-Agent).
// Run: npx playwright test tests/e2e/concierge-sitewide.spec.js --project=desktop
// Only against the dev server in mock mode (CONCIERGE_MOCK=1 or dev mock): no
// real Claude, no API key. Forms are NEVER sent – the appointment test counts
// requests to /api/beratung_anfrage and expects 0. Own test IP (198.51.100.x)
// so the consent limit (10 per 10 min and IP) does not block other runs.
// Phone flows (WebKit, iPhone 15 Pro): concierge-sitewide-iphone.spec.js.
import { test, expect } from "@playwright/test";
import { conciergeAvailable, settle } from "./helpers.js";
import { PROD } from "./prod-mode.js";
import { API, LAUNCH, LAUNCHER, SERVER, ask, dismissCookies, enterMock, freshIp, mockAvailable, openAndConsent, revealLauncher, testIp, visibleInLog } from "./concierge-helpers.js";

const PRODUCT = "/de/produkte/lamps/lamps-2097-18";

test.use({ extraHTTPHeaders: { "x-forwarded-for": testIp() } });
// Shared dev server under load (parallel workflows): 300 s per test (QA2 P1-1).
test.describe.configure({ timeout: 300_000 });

test.describe("API", () => {
  test("Vorschlag: signiert, gegen den Katalog geprüft, nur seitenweit", async ({ request, baseURL }) => {
    test.skip(!(await mockAvailable(request)), "Mock nicht freigegeben");
    const origin = new URL(baseURL).origin;
    // Generous timeouts: the first call compiles the route and loads the catalogue.
    const c = await request.post(`${API}/consent`, { headers: { Origin: origin }, data: { accepted: true, mock: true }, timeout: 120_000 });
    const { token } = await c.json();
    const chat = async (body) =>
      (await (await request.post(API, { headers: { Origin: origin }, data: { token, mock: true, ...body }, timeout: 120_000 })).text())
        .trim()
        .split("\n")
        .map((l) => JSON.parse(l));
    const ctx = { locale: "fr", route: "home", selectionCount: 2, evil: "<script>" };
    const site = await chat({ surface: "site", messages: [{ role: "user", content: "Minotti Sofas", ctx }] });
    const action = site.find((e) => e.type === "action");
    expect(action).toMatchObject({ kind: "catalog_filter", params: { categorySlug: "sofas-couches", filters: { marke: ["minotti"] } } });
    expect(action.href).toBe("/fr/produits/sofas-couches?marke=minotti");
    expect(action.id).toMatch(/^a_/);
    expect(action.sig).toMatch(/^[A-Za-z0-9_-]{16,64}$/);
    expect(action.count).toBeGreaterThan(0);
    const labs = await chat({ messages: [{ role: "user", content: "Minotti Sofas" }] });
    expect(labs.some((e) => e.type === "action")).toBe(false);
  });
});

test.describe("Desktop", () => {
  test.skip(({ isMobile }) => isMobile, "Desktop-Ablauf");

  test("Cookie-Banner blendet aus, kein Request vor dem Klick, Filter-Vorschlag ausführen", async ({ page, request }) => {
    test.skip(!(await mockAvailable(request)), "Mock nicht freigegeben");
    const early = [];
    page.on("request", (r) => r.url().includes("/api/labs/concierge") && early.push(r.url()));
    const errors = [];
    // Ignored: Next's dev-only router race while another workflow triggers an
    // HMR full reload ("Router action dispatched before initialization").
    page.on("pageerror", (e) => !/Router action dispatched before initialization/.test(e.message) && errors.push(e.message));
    await page.goto("/de");
    await settle(page);
    // Banner open → launcher hidden (not just covered)
    await expect(page.locator("[data-consent-bar]")).toBeVisible(SERVER);
    await expect(page.locator(LAUNCHER)).toBeHidden();
    await dismissCookies(page);
    await revealLauncher(page); // Hero-Bühne verdeckt die Reiter-Spalte (QM shell-home r2)
    await expect(page.locator(LAUNCHER)).toBeVisible(LAUNCH);
    const box = await page.locator(LAUNCHER).boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(await page.locator(LAUNCHER).getAttribute("aria-label")).toMatch(/KI/);
    await page.waitForTimeout(500);
    expect(early, "kein Request vor dem Öffnen").toEqual([]);

    const panel = await openAndConsent(page);
    // Non-modal on desktop: the page stays usable.
    expect(await page.evaluate(() => document.querySelector("#concierge-panel").matches(":modal"))).toBe(false);
    await ask(panel, "Minotti Sofas");
    const card = panel.locator("section").filter({ hasText: "KI-Vorschlag" }).last();
    await expect(card).toContainText("Katalog gefiltert öffnen", SERVER);
    await expect(card).toContainText("/de/produkte/sofas-couches");
    await card.getByRole("button", { name: "Ausführen" }).click({ timeout: 60_000 });
    // Dev server compiles the target on first visit: generous limit (P1-2).
    await expect(page).toHaveURL(/\/de\/produkte\/sofas-couches\?marke=minotti/, { timeout: 120_000 });
    await expect(panel).toBeVisible({ timeout: 60_000 }); // lazy chunk compiles on first use (dev)
    await expect(page.getByRole("status").filter({ hasText: /Seite gewechselt/ })).toHaveCount(1, SERVER);
    await expect(card).toContainText("Erledigt", SERVER);
    expect(errors).toEqual([]);
  });

  test("Termin: Formular öffnen, Entwurf kopiert, „Erledigt“ erst nach Ankunft, nie abgeschickt", async ({ page, request, context, baseURL }) => {
    test.skip(!(await mockAvailable(request)), "Mock nicht freigegeben");
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(baseURL).origin }).catch(() => {});
    let sent = 0;
    await page.route("**/api/beratung_anfrage**", (route) => {
      sent++;
      return route.abort();
    });
    // r7-p1 (ux P1-4): /de/kontakt and /de/beratung have no idle launcher
    // any more (request pages); the conversation starts on the home page.
    await page.goto("/de");
    await settle(page);
    await dismissCookies(page);
    const panel = await openAndConsent(page);
    await ask(panel, "Ich möchte einen Termin");
    const card = panel.locator("section").filter({ hasText: "Terminanfrage vorbereiten" }).last();
    await expect(card).toContainText("KI-Entwurf", SERVER);
    // Honest wording (P1-1 b): the form is not pre-filled.
    await expect(card).toContainText("Beim Ausführen kopieren wir Ihren Entwurf. Im Formular fügen Sie ihn ein und senden selbst.");
    await expect(card).not.toContainText("vorausgefüllt");
    const draft = ((await card.locator("p").nth(3).textContent()) || "").trim();
    await card.getByRole("button", { name: "Ausführen" }).click({ timeout: 60_000 });
    // Before the target page is there the card never says "Erledigt" (P1-2).
    if (!/\/beratung/.test(page.url())) {
      await expect(card).toContainText(/Wird geöffnet|Einen Moment/);
      await expect(card).not.toContainText("Erledigt");
    }
    await expect(page).toHaveURL(/\/de\/beratung\?quelle=concierge&anliegen=.*#anfrage$/, { timeout: 120_000 });
    await expect(card).toContainText("Erledigt", SERVER);
    // QA2 P2-1: the new status line is in view above the composer.
    await expect.poll(() => visibleInLog(panel, card.getByText(/Entwurf kopiert|Kopieren war nicht möglich/)), SERVER).toBe(true);
    await expect(card).toContainText(/Entwurf kopiert|Kopieren war nicht möglich/);
    const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => null));
    if (clip !== null && draft) expect(clip).toBe(draft);
    await settle(page);
    await page.waitForTimeout(1500);
    expect(sent).toBe(0);
  });

  test("Merken und Rückgängig, Verlauf überlebt Neuladen", async ({ page, request }) => {
    test.skip(!(await mockAvailable(request)), "Mock nicht freigegeben");
    await page.goto("/de/ueber-uns/marken/minotti");
    await settle(page);
    await dismissCookies(page);
    const panel = await openAndConsent(page);
    const count = () => page.evaluate(() => JSON.parse(localStorage.getItem("cart") || "[]").length);
    const before = await count();
    await ask(panel, "Ein Minotti-Sofa merken");
    const card = panel.locator("section").filter({ hasText: "Auf Ihre Auswahl legen" }).last();
    await card.getByRole("button", { name: "Ausführen" }).click({ timeout: 60_000 });
    await expect(card).toContainText("Erledigt", SERVER);
    await expect.poll(() => visibleInLog(panel, card.getByRole("link", { name: "Ihre Auswahl ansehen" })), SERVER).toBe(true);
    expect(await count()).toBe(before + 1);
    await card.getByRole("button", { name: "Wieder entfernen" }).click();
    expect(await count()).toBe(before);
    await page.reload();
    await settle(page);
    await expect(page.locator("main")).toBeVisible(SERVER);
    await page.locator(LAUNCHER).click(LAUNCH);
    await expect(page.locator("#concierge-panel")).toContainText("Ein Minotti-Sofa merken", SERVER);
  });

  test("Fehler: übersetzt, nicht „offline“ bei Serverfehler, „Erneut senden“ wiederholt die Frage", async ({ page, request }) => {
    test.skip(!(await mockAvailable(request)), "Mock nicht freigegeben");
    await freshIp(page);
    await page.goto("/en");
    await settle(page);
    const cookie = page.getByRole("button", { name: /Continue without consent|Weiter ohne Einwilligung/ });
    await cookie.first().waitFor({ timeout: 15_000 }).catch(() => {});
    if (await cookie.count()) await cookie.first().click();
    await revealLauncher(page); // Hero-Bühne verdeckt die Reiter-Spalte (QM shell-home r2)
    await page.locator(LAUNCHER).click(LAUNCH);
    const panel = page.locator("#concierge-panel");
    const start = await enterMock(panel, { mock: /Try mock mode/, start: /start concierge/ });
    // Consent: 30 days, short text, details on demand.
    await expect(panel).toContainText("deleted after 30 days");
    await expect(panel.locator("details")).toContainText("What is transmitted");
    await start.click();
    // First chat request fails with a server error, the second goes through.
    let fail = 1;
    await page.route(`**${API}`, (route) => {
      if (route.request().method() === "POST" && fail-- > 0) return route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
      return route.continue();
    });
    await ask(panel, "Minotti sofas", { input: /Your message/, send: "Send message" });
    await expect(panel).toContainText("The concierge is not reachable right now.", SERVER);
    await expect(panel).not.toContainText(/Keine Internetverbindung|No internet connection/);
    // QA2 P2-1: "Send again" is fully visible, not hidden under the composer.
    const again = panel.getByRole("button", { name: "Send again" });
    await expect.poll(() => visibleInLog(panel, again), SERVER).toBe(true);
    await again.click();
    await expect(panel.locator("section").filter({ hasText: "AI suggestion" }).last()).toBeVisible({ timeout: 60_000 });
    // The failed question is replaced, not repeated.
    await expect(panel.locator("[data-mid]").filter({ hasText: "Minotti sofas" })).toHaveCount(1);
    await expect(panel.getByRole("button", { name: "Go ahead" }).first()).toBeVisible(SERVER);
  });

  test("Neuladen: Verlauf sofort sichtbar, bevor der Server den Modus meldet", async ({ page, request }) => {
    test.skip(!(await mockAvailable(request)), "Mock nicht freigegeben");
    await page.goto("/de/news");
    await settle(page);
    await dismissCookies(page);
    const panel = await openAndConsent(page);
    await ask(panel, "Öffnungszeiten");
    await expect(panel.locator("article")).toHaveCount(1, { timeout: 60_000 });
    await expect(page.getByRole("button", { name: "Antwort stoppen" })).toHaveCount(0, { timeout: 60_000 });
    let release;
    const gate = new Promise((r) => (release = r));
    await page.route(`**${API}`, async (route) => {
      if (route.request().method() === "GET") await gate;
      return route.continue();
    });
    await page.reload();
    await settle(page);
    const launcher = page.locator(LAUNCHER);
    await expect(launcher).toContainText("Gespräch fortsetzen", SERVER);
    await launcher.click();
    await expect(panel).toContainText("Öffnungszeiten", { timeout: 60_000 });
    await expect(panel.getByRole("textbox", { name: /Ihre Nachricht/ })).toBeDisabled();
    release();
    await expect(panel.getByRole("textbox", { name: /Ihre Nachricht/ })).toBeEnabled(SERVER);
  });

  test("Netzabbruch beim Senden: einmal still wiederholt, keine Fehlermeldung, Frage 1× im Verlauf", async ({ page, request }) => {
    test.skip(!(await mockAvailable(request)), "Mock nicht freigegeben");
    await page.goto("/de/news");
    await settle(page);
    await dismissCookies(page);
    const panel = await openAndConsent(page);
    // QA2 P2-2: the first POST breaks off like WebKit "Load failed", the second goes through.
    const posts = [];
    await page.route(`**${API}`, (route) => {
      if (route.request().method() !== "POST") return route.continue();
      posts.push(JSON.parse(route.request().postData() || "{}").rid);
      return posts.length === 1 ? route.abort("failed") : route.continue();
    });
    await ask(panel, "Öffnungszeiten");
    await expect(panel.locator("article")).toHaveCount(1, SERVER);
    await expect(page.getByRole("button", { name: "Antwort stoppen" })).toHaveCount(0, SERVER);
    expect(posts.length).toBe(2);
    expect(posts[0]).toMatch(/^[A-Za-z0-9_-]{8,40}$/);
    expect(posts[1], "gleiche Anfrage-ID → Rate-Limit zählt einmal").toBe(posts[0]);
    await expect(panel).not.toContainText(/Verbindung unterbrochen|nicht erreichbar/);
    await expect(panel.getByRole("button", { name: "Erneut senden" })).toHaveCount(0);
    await expect(panel.locator("[data-mid]").filter({ hasText: "Öffnungszeiten" })).toHaveCount(1);
  });

  test("Modus-Abfrage hängt: nach 4 s Hinweis, nach 10 s Kontaktkarte mit Verlauf", async ({ page, request }) => {
    test.skip(!(await mockAvailable(request)), "Mock nicht freigegeben");
    await page.goto("/de/news");
    await settle(page);
    await dismissCookies(page);
    const panel = await openAndConsent(page);
    await ask(panel, "Öffnungszeiten");
    await expect(panel.locator("article")).toHaveCount(1, SERVER);
    await expect(page.getByRole("button", { name: "Antwort stoppen" })).toHaveCount(0, SERVER);
    // QA2 P2-3: the GET never answers.
    await page.route(`**${API}`, (route) => (route.request().method() === "GET" ? new Promise(() => {}) : route.continue()));
    await page.reload();
    await settle(page);
    await page.locator(LAUNCHER).click(LAUNCH);
    await expect(panel).toContainText("Öffnungszeiten", SERVER);
    await expect(panel).toContainText("Das dauert länger als üblich.", { timeout: 9_000 });
    await expect(panel).toContainText("Persönlich beraten wir am liebsten.", { timeout: 15_000 });
    await expect(panel.getByRole("link", { name: "Beratung anfragen" })).toBeVisible();
    await expect(panel.getByRole("region", { name: "Bisheriger Verlauf" })).toContainText("Öffnungszeiten");
    await expect(panel.getByRole("textbox")).toHaveCount(0);
  });

  test("Zu Abschnitt springen auf der Produktseite (Fokus auf die Überschrift)", async ({ page, request }) => {
    test.skip(!(await mockAvailable(request)), "Mock nicht freigegeben");
    await page.goto(PRODUCT);
    await settle(page);
    await dismissCookies(page);
    test.skip(!(await page.locator("main h2[id^=masse]").count()), "Produkt ohne Maße-Abschnitt");
    const panel = await openAndConsent(page);
    await ask(panel, "Wo stehen die Maße?");
    const card = panel.locator("section").filter({ hasText: "Zum Abschnitt springen" }).last();
    await card.getByRole("button", { name: "Ausführen" }).click({ timeout: 60_000 });
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toMatch(/^masse/);
  });

  test("Nicht stören 30 Tage überlebt Neuladen, Lasche stellt wieder her", async ({ page, request }) => {
    test.skip(!(await mockAvailable(request)), "Mock nicht freigegeben");
    await page.goto("/de/produkte");
    await settle(page);
    await dismissCookies(page);
    await page.locator(LAUNCHER).click(LAUNCH);
    const panel = page.locator("#concierge-panel");
    await panel.getByRole("button", { name: "Weitere Optionen" }).click();
    await panel.getByRole("button", { name: "Für 30 Tage ausblenden" }).click();
    await expect(page.locator(LAUNCHER)).toHaveCount(0);
    await page.reload();
    await settle(page);
    await expect(page.locator("main")).toBeVisible(SERVER);
    await page.waitForTimeout(1500);
    await expect(page.locator(LAUNCHER)).toHaveCount(0);
    await page.getByRole("button", { name: "KI-Concierge wieder einblenden" }).click();
    await expect(page.locator(LAUNCHER)).toBeVisible(LAUNCH);
  });

  test("Ausgeblendet auf Labs-Planern, Portal und Upload", async ({ page, request }) => {
    // P6 Runde 2 (r2-technik P1-6): ohne KI-Schlüssel gibt es den Knopf nirgends
    // (F2, /api/labs/status concierge:false) – die Positivkontrolle ist dann
    // nicht möglich, der Test wird mit Grund übersprungen.
    // Runde 5 (P3): /api/labs/status meldet nur noch echte KI (conciergeLive());
    // der Dev-Server zeigt den Knopf als Testwerkzeug trotzdem (Launcher.js, CHECK
    // nur im Produktions-Build) – dort gilt die Positivkontrolle weiter.
    test.skip(PROD && !(await conciergeAvailable(request)), "Concierge auf diesem Server aus");
    // Positive control first: same context, normal page → launcher visible.
    await page.goto("/de/news");
    await settle(page);
    await dismissCookies(page);
    await expect(page.locator(LAUNCHER)).toBeVisible(LAUNCH);
    for (const path of ["/de/concierge", "/de/kuechenplaner", "/de/portal", "/de/upload"]) {
      await page.goto(path);
      await settle(page);
      await expect(page.locator("body")).not.toBeEmpty();
      await page.waitForTimeout(1500);
      await expect(page.locator(LAUNCHER), path).toHaveCount(0);
    }
  });
});
