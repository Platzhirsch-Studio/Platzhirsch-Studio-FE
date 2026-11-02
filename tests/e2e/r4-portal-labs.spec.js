// tests/e2e/r4-portal-labs.spec.js — R4-portal-labs against the running server.
// Run: npx playwright test tests/e2e/r4-portal-labs.spec.js --project=desktop --reporter=list --output=<eigener Ordner>
// Runs in the desktop project; device cases launch their own browser
// (iPhone/iPad = WebKit, Android/Desktop = Chromium).
// Nothing reaches the backoffice: upload links come from the local dev store
// (signed with the dev secret), no files are uploaded, no mail is sent.
import { test, expect, devices, chromium, webkit } from "@playwright/test";
import crypto from "node:crypto";
import { conciergeAvailable, settle } from "./helpers.js";

const UPLOAD_SECRET = process.env.UPLOAD_TOKEN_SECRET || "platzhirsch-upload-dev-secret-NICHT-PRODUKTIV";
const PORTAL_SECRET = process.env.PORTAL_SESSION_SECRET || "dev-only-portal-secret-do-not-use-in-production-0000";

const DEVICES = [
  ["iphone", webkit, devices["iPhone 15 Pro"]],
  ["android", chromium, devices["Pixel 7"]],
  ["ipad", webkit, devices["iPad Pro 11"]],
  ["desktop", chromium, { viewport: { width: 1440, height: 900 } }],
];

function ticket() {
  const payload = Buffer.from(
    JSON.stringify({ v: 1, k: "K", n: crypto.randomBytes(16).toString("base64url"), e: Math.floor(Date.now() / 1000) + 600 }),
  ).toString("base64url");
  return `${payload}.${crypto.createHmac("sha256", UPLOAD_SECRET).update(`ticket:${payload}`).digest("base64url").slice(0, 22)}`;
}

function portalCookie(baseURL) {
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ v: 1, sub: "CUST-DEMO-0001", sid: crypto.randomUUID(), iat: now, exp: now + 3600 })).toString("base64url");
  const value = `${body}.${crypto.createHmac("sha256", PORTAL_SECRET).update(`portal-session:${body}`).digest("base64url")}`;
  return { name: "ph_portal_session", value, url: new URL(baseURL).origin, httpOnly: true, sameSite: "Lax" };
}

async function onDevice(engine, options, fn) {
  const baseURL = test.info().project.use.baseURL || "http://localhost:3000";
  const browser = await engine.launch();
  try {
    const context = await browser.newContext({ ...options, baseURL, locale: "de-AT" });
    await fn(await context.newPage(), context, baseURL);
  } finally {
    await browser.close();
  }
}

test.describe("Upload ohne FocusShell (P2-2)", () => {
  test.describe.configure({ timeout: 300_000 });
  let uploadPath;
  test.beforeAll(async ({ request, baseURL }) => {
    const res = await request.post("/api/upload/session", { headers: { Origin: new URL(baseURL).origin }, data: { ticket: ticket() }, timeout: 180_000 });
    test.skip(res.status() === 403, "Server nutzt ein anderes UPLOAD_TOKEN_SECRET");
    // F4 Fix-Runde 1 (r1-recht-inhalt P0-4): ohne bestätigte Löschfrist gibt es keinen Upload-Link.
    test.skip(res.status() === 503, "Upload pausiert, bis die Löschfrist bestätigt ist (UPLOAD_CONFIG.retentionConfirmed)");
    expect(res.status()).toBe(200);
    uploadPath = new URL((await res.json()).url, baseURL).pathname;
  });

  for (const [name, engine, options] of DEVICES) {
    test(`${name}: keine Abdeckung, kein inert, Fokus erreicht Zurück und Rechtliches, Escape harmlos`, async () => {
      await onDevice(engine, options, async (page) => {
        await page.goto(uploadPath, { waitUntil: "load" });
        await settle(page);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText("Zeigen Sie uns Ihren Raum");
        const state = await page.evaluate(() => ({
          inert: document.querySelectorAll("[inert]").length,
          cover: document.querySelectorAll("[data-upload-scroll]").length,
          htmlOverflow: document.documentElement.style.overflow,
          logos: document.querySelectorAll("img[src*='Logo.png']").length,
          bareHeaders: document.querySelectorAll("header[data-shell='bare']").length,
        }));
        expect(state).toEqual({ inert: 0, cover: 0, htmlOverflow: "", logos: 0, bareHeaders: 1 });
        await expect(page.locator("[data-shell-legal]")).toBeHidden();

        const focused = () => page.evaluate(() => document.activeElement?.textContent?.trim());
        const back = page.locator("header[data-shell='bare']").getByRole("link", { name: "Zurück zur Website" });
        const webkitEngine = engine === webkit;
        if (webkitEngine) {
          // WebKit nimmt Links nur mit "Tab zu Links" in die Tab-Folge (Safari-
          // Einstellung). Fokussierbar muss "Zurück" trotzdem sein – unter dem
          // alten inert-Cover war es das nicht.
          await back.focus();
        } else {
          // Chromium: nach dem Skip-Link ("Zum Inhalt springen") folgt
          // "Zurück zur Website" in der Shell – höchstens zwei Tab-Halte.
          await page.evaluate(() => document.activeElement?.blur());
          for (let i = 0; i < 3 && (await focused()) !== "Zurück zur Website"; i++) await page.keyboard.press("Tab");
        }
        await expect.poll(focused).toBe("Zurück zur Website");

        // Escape lässt den Fokus, wo er ist, und öffnet/schließt nichts.
        await page.keyboard.press("Escape");
        expect(await focused()).toBe("Zurück zur Website");
        expect(page.url()).toContain(uploadPath);

        // Weiter tabben: keine Falle. Chromium erreicht das Rechtliche unten,
        // WebKit (nur Formularelemente) landet im Upload-Formular in <main>.
        let reached = false;
        for (let i = 0; i < 40 && !reached; i++) {
          await page.keyboard.press("Tab");
          reached = await page.evaluate((wk) => {
            const a = document.activeElement;
            return wk ? !!a?.closest("main") && a.tagName !== "MAIN" : !!a?.closest("nav[aria-label='Rechtliches']");
          }, webkitEngine);
        }
        expect(reached, webkitEngine ? "Formular per Tab erreichbar" : "Rechtliches per Tastatur erreichbar").toBe(true);
        expect(await page.evaluate(() => document.scrollingElement.scrollTop)).toBeGreaterThanOrEqual(0);
        const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
        expect(noHScroll).toBe(true);
      });
    });
  }

  test("ungültiger Token: 404, gleiche Hülle, Rechtliches einmal", async () => {
    await onDevice(webkit, devices["iPhone 15 Pro"], async (page) => {
      const res = await page.goto("/de/upload/" + "x".repeat(60), { waitUntil: "load" });
      expect(res.status()).toBe(404);
      await settle(page);
      await expect(page.locator("header[data-shell='bare']")).toHaveCount(1);
      await expect(page.locator("[inert]")).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: "Rechtliches" })).toHaveCount(1);
    });
  });
});

test.describe("Portal", () => {
  test.setTimeout(180_000);

  test("N6: Dokumente – eine Chip-Reihe, Zahlung und Projekt als Auswahl, URL-Filter", async ({ context, baseURL, page }) => {
    await context.addCookies([portalCookie(baseURL)]);
    await page.goto("/de/portal/dokumente", { waitUntil: "load" });
    await settle(page);
    test.skip(page.url().includes("/login"), "Portal-Session nicht akzeptiert (anderes Secret)");
    // Nur noch eine Chip-Reihe (Dokumentart); Zahlung/Projekt sind keine Chip-Gruppen mehr.
    await expect(page.getByRole("group", { name: "Dokumentart" })).toHaveCount(1);
    await expect(page.getByRole("group", { name: "Zahlungsstatus" })).toHaveCount(0);
    await expect(page.getByRole("group", { name: "Projekt" })).toHaveCount(0);
    const zahlung = page.getByLabel("Zahlung");
    await expect(zahlung).toBeVisible();
    await zahlung.selectOption("offen");
    await expect(page).toHaveURL(/typ=rechnung/);
    await expect(page).toHaveURL(/zahlung=offen/);
    await expect(page.getByLabel("Zahlung")).toHaveValue("offen");
    const radius = await page.getByLabel("Zahlung").evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
    expect(radius).toBe("0px");
    // Ungültige Werte werden ignoriert.
    await page.goto("/de/portal/dokumente?zahlung=<x>&projekt=../../etc", { waitUntil: "load" });
    await expect(page.getByLabel("Zahlung")).toHaveValue("");
  });

  test("A5: mobile Portal-Leiste liegt über der Cookie-Leiste", async () => {
    await onDevice(webkit, devices["iPhone 15 Pro"], async (page, context, baseURL) => {
      await context.addCookies([portalCookie(baseURL)]);
      await page.goto("/de/portal", { waitUntil: "load" });
      await settle(page);
      test.skip(page.url().includes("/login"), "Portal-Session nicht akzeptiert");
      const consent = page.getByRole("region", { name: "Cookie-Einstellungen" });
      await consent.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
      const nav = page.getByRole("navigation", { name: "Kundenportal" });
      const n = await nav.boundingBox();
      const vh = page.viewportSize().height;
      if (await consent.isVisible()) {
        const c = await consent.boundingBox();
        expect(n.y + n.height, "Leiste endet über dem Banner").toBeLessThanOrEqual(c.y + 1);
      }
      expect(n.y + n.height).toBeLessThanOrEqual(vh + 1);
      expect(n.y).toBeGreaterThan(0);
    });
  });
});

test.describe("Labs", () => {
  test.setTimeout(180_000);

  test("Studio-HDR: gültige RGBE-Datei, noindex, dauerhaft cachebar", async ({ request }) => {
    const res = await request.get("/api/labs/ar-viewer/studio-v1.hdr");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/vnd.radiance");
    expect(res.headers()["x-robots-tag"]).toBe("noindex");
    expect(res.headers()["cache-control"]).toContain("immutable");
    const body = await res.body();
    expect(body.subarray(0, 10).toString()).toBe("#?RADIANCE");
    expect(body.length).toBeGreaterThan(100_000);
  });

  test("Dreiländer mobil: Lindau und Dornbirn je ≥ 44 px in beiden Achsen (Hit-Test)", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    await page.goto("/de/dreilaender-rechner", { waitUntil: "load" });
    await settle(page);
    const svg = page.locator("svg[aria-labelledby='dl-map-title dl-map-desc']");
    await svg.scrollIntoViewIfNeeded();
    await expect(page.locator("[data-place-button='dornbirn'] rect")).toHaveCount(1);
    // Effektive Trefferfläche: von der Mitte aus in alle vier Richtungen per
    // elementFromPoint abtasten, bis ein anderes Element getroffen wird.
    const extents = await page.evaluate(() =>
      ["lindau", "dornbirn"].map((id) => {
        const g = document.querySelector(`[data-place-button='${id}']`);
        const a = g.querySelector("rect") || g.querySelectorAll("circle")[1];
        const r = a.getBoundingClientRect();
        const cx = r.x + r.width / 2;
        const cy = r.y + r.height / 2;
        const own = (x, y) => document.elementFromPoint(x, y)?.closest?.("[data-place-button]") === g;
        const reach = (dx, dy) => {
          let d = 0;
          while (d < 120 && own(cx + dx * (d + 1), cy + dy * (d + 1))) d++;
          return d;
        };
        return { id, w: reach(-1, 0) + reach(1, 0) + 1, h: reach(0, -1) + reach(0, 1) + 1 };
      }),
    );
    for (const e of extents) {
      expect(e.w, `${e.id} Breite`).toBeGreaterThanOrEqual(44);
      expect(e.h, `${e.id} Höhe`).toBeGreaterThanOrEqual(44);
    }
    await page.locator("[data-place-button='dornbirn'] rect").tap();
    await expect(page.locator("[data-place-button='dornbirn']")).toHaveAttribute("aria-pressed", "true");
    await context.close();
  });

  test("Dreiländer: Wechselkurs offline → Hinweis statt Absturz", async ({ page }) => {
    await page.route("**/api/labs/wechselkurs", (route) => route.abort("internetdisconnected"));
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    const res = await page.goto("/de/dreilaender-rechner", { waitUntil: "load" });
    expect(res.status()).toBe(200);
    await settle(page);
    await expect(page.locator("h1")).toBeVisible();
    expect(errors).toEqual([]);
  });

  // Integration 28.10.2026 (Inhaber-Entscheidung Nr. 9): die Planer haben feste, indexierbare URLs; noindex bleiben Upload, Portal und Vorschauen.
  test("Werkzeug-Seiten indexierbar, Upload bleibt noindex", async ({ request }) => {
    for (const p of ["/de/3d-ansicht", "/de/concierge", "/de/dreilaender-rechner", "/de/kuechenplaner", "/de/sofaplaner", "/de/stil-finder"]) {
      const res = await request.get(p, { timeout: 120_000 });
      expect(res.status(), p).toBe(200);
      // Endtest 29.10.2026 (bewusst geänderte Erwartung, wie smoke.spec.js „labs …“):
      // /de/concierge ist ohne KI-Schlüssel noindex (P6 Runde 2, F2; inhaber-offen D.14),
      // die Erwartung folgt /api/labs/status.
      const noindex = p === "/de/concierge" && !(await conciergeAvailable(request));
      expect(await res.text(), p).toMatch(noindex ? /<meta name="robots" content="noindex/ : /<meta name="robots" content="index, follow/);
    }
    const up = await request.get("/de/upload", { timeout: 120_000 });
    expect(up.status()).toBe(200);
    expect(await up.text()).toMatch(/<meta name="robots" content="noindex/);
  });
});
