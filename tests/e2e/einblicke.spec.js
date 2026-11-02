// Besucher-Einblicke: Consent-Kopplung und Datensparsamkeit im echten Browser
// (Konzept Marktresearch/digital/features/besucher-einblicke.md §9).
//   PW_WORKERS=1 npx playwright test tests/e2e/einblicke.spec.js --project=desktop
//
// Jeder Beacon an /api/einblicke wird aufgezeichnet und lokal mit 204
// beantwortet (nichts landet in .data/einblicke/), jede Google-Anfrage wird
// gestubbt (kein Treffer in GA4), Formulare werden nie abgeschickt.
// Gegen einen Produktions-Build läuft die Datei nur mit NEXT_PUBLIC_EINBLICKE=1
// (EINBLICKE_EXPECT=on); sonst prüft sie dort nur, dass gar nichts gesendet wird.
import { test, expect } from "@playwright/test";
import { blockFormSends, settle } from "./helpers.js";

const COOKIE_KEYS = ["essential", "functional", "statistics", "marketing", "googleMaps", "googleTagManager", "googleAnalytics", "googleAds", "einblicke"];
const GOOGLE_HOST = /(^|\.)(google\.[a-z.]+|googletagmanager\.com|google-analytics\.com|googleadservices\.com|doubleclick\.net|gstatic\.com|googleapis\.com)$/i;
const OFF = process.env.EINBLICKE_EXPECT === "off";

const consentCookie = (baseURL, values) => ({
  name: "cookieConsent",
  value: encodeURIComponent(JSON.stringify(Object.fromEntries(COOKIE_KEYS.map((k) => [k, k === "essential" ? true : Boolean(values[k])])))),
  url: baseURL,
});
// Eigene Einwilligung "einblicke" (QA Recht P1-1/P2-4) – ohne Google Analytics.
const STATS = { statistics: true, einblicke: true };

test.skip(({ browserName }) => browserName !== "chromium", "Beacon-Abfang über page.route: Chromium (Desktop)");

/** Zeichnet alle Beacons an /api/einblicke auf (nach blockFormSends registrieren: läuft zuerst). */
async function recordBeacons(page) {
  const bodies = [];
  await page.route("**/api/einblicke", (route) => {
    bodies.push(route.request().postData() || "");
    return route.fulfill({ status: 204, body: "" });
  });
  return bodies;
}

async function stubGoogle(context) {
  await context.route(
    (url) => GOOGLE_HOST.test(url.hostname),
    (route) => (/\/gtag\/js/.test(route.request().url()) ? route.fulfill({ status: 200, contentType: "text/javascript", body: "/* stub */" }) : route.fulfill({ status: 204, body: "" }))
  );
}

/** Sammler aktiv? (Warteschlange ist dann das Objekt des Sammlers, kein Array.) */
const collectorRunning = (page) => page.evaluate(() => Boolean(window.__phEb && !Array.isArray(window.__phEb)));

/** Tab „verstecken“ → Sammler sendet die Momentaufnahme (wie beim Tab-Wechsel). */
async function hide(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
  });
}

/** Wartet so lange, wie Lader + Sammler höchstens brauchen (Leerlauf ≤ 1,5 s + 5 s). */
const waitLoaderWindow = (page) => page.waitForTimeout(8000);

/** Bewegen, auf die H1 klicken (kein Link, keine Navigation), scrollen. */
async function interact(page) {
  await page.mouse.move(400, 300);
  await page.mouse.move(700, 500, { steps: 5 });
  const box = await page.locator("main h1").first().boundingBox();
  if (box) await page.mouse.click(box.x + Math.min(20, box.width / 2), box.y + box.height / 2);
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(400);
}

const events = (bodies) => bodies.flatMap((b) => JSON.parse(b).e);

test.describe("Einblicke: ohne Freigabe kein Byte", () => {
  test("ohne Einwilligung: 0 Anfragen an /api/einblicke, kein ph_eb, kein Sammler", async ({ page }) => {
    await blockFormSends(page);
    const bodies = await recordBeacons(page);
    // Sammler-Code geladen? (Turbopack lädt im Dev einen kleinen „async loader“-
    // Stub mit dem Lader; der eigentliche Sammler enthält sendBeacon.)
    const collectorChunks = [];
    page.on("response", async (r) => {
      if (!/\/_next\/static\/chunks\/.*einblicke/i.test(r.url())) return;
      const body = await r.text().catch(() => "");
      if (body.includes("sendBeacon")) collectorChunks.push(r.url());
    });
    await page.goto("/de");
    await settle(page);
    await waitLoaderWindow(page);
    await interact(page);
    await hide(page);
    await page.goto("/de/kontakt");
    await settle(page);
    await interact(page);
    await hide(page);
    await page.waitForTimeout(1500);
    expect(bodies).toEqual([]);
    expect(await page.evaluate(() => sessionStorage.getItem("ph_eb"))).toBeNull();
    expect(await page.evaluate(() => window.__phEb)).toBeUndefined();
    // Der Sammler-Chunk wird ohne Einwilligung nicht einmal angefragt.
    expect(collectorChunks).toEqual([]);
  });

  test("Einwilligung nur für Marketing: 0 Anfragen", async ({ page, context, baseURL }) => {
    await stubGoogle(context);
    await context.addCookies([consentCookie(baseURL, { marketing: true, googleAds: true, functional: true, googleMaps: true })]);
    const bodies = await recordBeacons(page);
    await page.goto("/de");
    await settle(page);
    await waitLoaderWindow(page);
    await interact(page);
    await hide(page);
    await page.waitForTimeout(1000);
    expect(bodies).toEqual([]);
  });

  test("nur Google Analytics (ohne eigenen Schlüssel einblicke): 0 Anfragen (QA Recht P1-1/P2-4)", async ({ page, context, baseURL }) => {
    await stubGoogle(context);
    await context.addCookies([consentCookie(baseURL, { statistics: true, googleAnalytics: true })]);
    const bodies = await recordBeacons(page);
    await page.goto("/de");
    await settle(page);
    await waitLoaderWindow(page);
    await interact(page);
    await hide(page);
    await page.waitForTimeout(1000);
    expect(bodies).toEqual([]);
    expect(await page.evaluate(() => sessionStorage.getItem("ph_eb"))).toBeNull();
  });

  test("Banner: eigener Schalter „Besucher-Einblicke“ unter Statistik, getrennt von Google Analytics", async ({ page, context }) => {
    test.skip(OFF, "Schalter nur, solange die Funktion läuft");
    await stubGoogle(context);
    const bodies = await recordBeacons(page);
    await page.goto("/de");
    await settle(page);
    await page.getByRole("button", { name: "Individuelle Einstellungen" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Statistik (2)")).toBeVisible();
    await expect(dialog.getByText(/Besucher-Einblicke \(eigene Heatmap\)/).first()).toBeVisible();
    // Statistik-Details öffnen, nur die Heatmap wählen
    await dialog.locator('[aria-controls="ph-consent-details-statistics"]').click();
    await dialog.locator("#besucher-einblicke").check();
    await expect(dialog.locator("#google-analytics")).not.toBeChecked();
    await dialog.getByRole("button", { name: "Auswahl speichern" }).click();
    const saved = JSON.parse(decodeURIComponent((await context.cookies()).find((c) => c.name === "cookieConsent").value));
    expect(saved).toMatchObject({ einblicke: true, googleAnalytics: false, statistics: true });
    expect(Object.keys(saved)).toEqual(COOKIE_KEYS);
    // Sammler startet ohne GA-Einwilligung
    await waitLoaderWindow(page);
    await interact(page);
    await hide(page);
    await expect.poll(() => bodies.length, { timeout: 5000 }).toBeGreaterThan(0);
  });

  for (const [label, script] of [
    ["Global Privacy Control", () => Object.defineProperty(Navigator.prototype, "globalPrivacyControl", { get: () => true, configurable: true })],
    ["Do-Not-Track", () => Object.defineProperty(Navigator.prototype, "doNotTrack", { get: () => "1", configurable: true })],
  ]) {
    test(`Statistik-Einwilligung, aber ${label}: 0 Anfragen`, async ({ page, context, baseURL }) => {
      await stubGoogle(context);
      await context.addCookies([consentCookie(baseURL, STATS)]);
      await context.addInitScript(script);
      const bodies = await recordBeacons(page);
      await page.goto("/de");
      await settle(page);
      await waitLoaderWindow(page);
      await interact(page);
      await hide(page);
      await page.waitForTimeout(1000);
      expect(bodies).toEqual([]);
      expect(await page.evaluate(() => sessionStorage.getItem("ph_eb"))).toBeNull();
    });
  }

  for (const path of ["/de/portal", "/de/upload", "/de/preview/einblicke", "/de/ideenboard/abc123XYZ", "/de/wunschliste/abc123XYZ"]) {
    test(`ausgeschlossene Route ${path}: 0 Anfragen trotz Einwilligung`, async ({ page, context, baseURL }) => {
      await stubGoogle(context);
      await context.addCookies([consentCookie(baseURL, STATS)]);
      await blockFormSends(page);
      const bodies = await recordBeacons(page);
      await page.goto(path);
      await settle(page);
      await waitLoaderWindow(page);
      await interact(page);
      await hide(page);
      await page.waitForTimeout(1000);
      expect(bodies).toEqual([]);
    });
  }
});

test.describe("Einblicke: mit Statistik-Einwilligung", () => {
  test.skip(OFF, "Produktions-Build ohne NEXT_PUBLIC_EINBLICKE=1: Funktion aus");

  test("Beacon kommt an: Seitenaufruf, Klick, Scroll, Rage-Klick; danach Widerruf stoppt alles", async ({ page, context, baseURL }) => {
    await stubGoogle(context);
    await context.addCookies([consentCookie(baseURL, STATS)]);
    const bodies = await recordBeacons(page);
    await page.goto("/de");
    await settle(page);
    await expect.poll(() => collectorRunning(page), { timeout: 20_000 }).toBe(true);
    await interact(page);
    // Drei schnelle Klicks auf dieselbe Überschrift → Rage-Klick.
    const h1 = page.locator("h1").first();
    await h1.click({ clickCount: 1, delay: 10 });
    await h1.click({ clickCount: 1, delay: 10 });
    await h1.click({ clickCount: 1, delay: 10 });
    await page.waitForTimeout(1500);
    await hide(page);
    await expect.poll(() => bodies.length, { timeout: 10_000 }).toBeGreaterThan(0);
    const packet = JSON.parse(bodies[0]);
    expect(Object.keys(packet).sort()).toEqual(["e", "pv", "seq", "sid", "v"]);
    expect(packet.v).toBe(1);
    const all = events(bodies);
    const pv = all.find((e) => e[0] === "pv")[1];
    expect(pv).toMatchObject({ p: "/de", dc: "d", vw: 1440 });
    expect(Object.keys(pv).every((k) => ["p", "dc", "vw", "vh", "dh", "ch", "prev"].includes(k))).toBe(true);
    expect(all.some((e) => e[0] === "c" && /^[A-Za-z][\w-]*(>|$)/.test(e[1].s))).toBe(true);
    expect(all.some((e) => e[0] === "sc")).toBe(true);
    expect(all.some((e) => e[0] === "sg" && e[1].k === "rage")).toBe(true);
    const stored = JSON.parse(await page.evaluate(() => sessionStorage.getItem("ph_eb")));
    expect(stored.id).toBe(packet.sid);
    // Kein Zeitstempel des Geräts, keine URL mit Query, kein User-Agent im Paket.
    expect(bodies.join("")).not.toMatch(/Mozilla|HeadlessChrome|\?utm|"ts"|Date/);

    // Widerruf über den Banner-Weg (Cookie + ph-consent-change ohne Statistik).
    await page.evaluate(() => {
      const value = { essential: true, functional: false, statistics: false, marketing: false, googleMaps: false, googleTagManager: false, googleAnalytics: false, googleAds: false, einblicke: false };
      document.cookie = `cookieConsent=${encodeURIComponent(JSON.stringify(value))}; path=/`;
      window.dispatchEvent(new CustomEvent("ph-consent-change", { detail: value }));
    });
    expect(await page.evaluate(() => sessionStorage.getItem("ph_eb"))).toBeNull();
    expect(await collectorRunning(page)).toBe(false);
    const before = bodies.length;
    await interact(page);
    await hide(page);
    await page.waitForTimeout(1500);
    expect(bodies.length).toBe(before);
  });

  test("Formular: Feldnamen ja, getippte Werte nie", async ({ page, context, baseURL }) => {
    await stubGoogle(context);
    await context.addCookies([consentCookie(baseURL, STATS)]);
    await blockFormSends(page);
    const bodies = await recordBeacons(page);
    await page.goto("/de/kontakt");
    await settle(page);
    await expect.poll(() => collectorRunning(page), { timeout: 20_000 }).toBe(true);
    const secrets = ["Zq9Geheimname", "zq9.geheim@example.com", "Zq9 geheime Nachricht 4711"];
    const fields = page.locator("main form input:visible:not([type=checkbox]):not([type=radio]):not([type=hidden]), main form textarea:visible");
    const n = Math.min(await fields.count(), 3);
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) await fields.nth(i).fill(secrets[i]);
    await page.waitForTimeout(300);
    await hide(page);
    await expect.poll(() => bodies.length, { timeout: 10_000 }).toBeGreaterThan(0);
    const text = bodies.join("\n");
    for (const s of [...secrets, "Zq9", "geheim", "4711"]) expect(text).not.toContain(s);
    const fo = events(bodies).filter((e) => e[0] === "fo");
    expect(fo.length).toBeGreaterThan(0);
    expect(fo[0][1].b.length).toBeGreaterThan(0);
    for (const name of fo[0][1].b) expect(name).toMatch(/^[A-Za-z][\w-]{0,39}$/);
  });

  test("SPA-Navigation: zweiter Seitenaufruf mit prev, gleiche Sitzung", async ({ page, context, baseURL }) => {
    await stubGoogle(context);
    await context.addCookies([consentCookie(baseURL, STATS)]);
    const bodies = await recordBeacons(page);
    await page.goto("/de");
    await settle(page);
    await expect.poll(() => collectorRunning(page), { timeout: 20_000 }).toBe(true);
    await page.locator('main a[href="/de/kontakt"], footer a[href="/de/kontakt"]').first().click();
    await page.waitForURL("**/de/kontakt");
    await page.waitForTimeout(800);
    await hide(page);
    await expect.poll(() => events(bodies).filter((e) => e[0] === "pv").length, { timeout: 10_000 }).toBeGreaterThan(1);
    const packets = bodies.map((b) => JSON.parse(b));
    expect(new Set(packets.map((p) => p.sid)).size).toBe(1);
    const second = events(bodies).filter((e) => e[0] === "pv")[1][1];
    expect(second).toMatchObject({ p: "/de/kontakt", prev: "/de" });
    expect(second.ch).toBeUndefined();
  });
});

test.describe("Einblicke: Empfänger", () => {
  test("Müll → 204, fremder Origin → 204, > 16 KB → 413", async ({ request }) => {
    expect((await request.post("/api/einblicke", { data: "kein json", headers: { "content-type": "text/plain" } })).status()).toBe(204);
    expect((await request.post("/api/einblicke", { data: "{}", headers: { "content-type": "text/plain", origin: "https://evil.example", "sec-fetch-site": "cross-site" } })).status()).toBe(204);
    expect((await request.post("/api/einblicke", { data: "x".repeat(17 * 1024), headers: { "content-type": "text/plain" } })).status()).toBe(413);
    expect((await request.post("/api/einblicke/tagesabschluss")).status()).toBeGreaterThanOrEqual(401);
  });
});
