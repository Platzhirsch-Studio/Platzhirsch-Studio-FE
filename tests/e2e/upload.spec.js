// tests/e2e/upload.spec.js — R2-upload: Handy-Upload per QR.
// Formular → Handoff → Link → /de/upload/<token>, A-1 (one main button per
// width), locked state contrast, error pages and error texts.
// Never reaches the backoffice: the inquiry call is answered inside the
// browser (page.route) with a ticket signed by the development secret, exactly
// like /api/upload/inquiry/<kind> would. Uploads go to the dev store only.
// Runs in the desktop project; phone widths are set per test (viewport).
// Against a server with its own UPLOAD_TOKEN_SECRET, pass the same value in env.
import { test, expect } from "@playwright/test";
import crypto from "node:crypto";
import path from "node:path";
import { collectConsoleErrors, settle } from "./helpers.js";

// ---- F4 Fix-Runde 1 (r1-recht-inhalt P0-4) -----------------------------------
// /de/upload is a service page without demo, test link or demo reference, and
// while the Löschfrist is unconfirmed (UPLOAD_CONFIG.retentionConfirmed=false)
// the upload takes nothing (session route 503 "upload_paused", no card after a
// form, /de/upload/<token> shows the "paused" notice). Expectations changed on
// purpose:
//   - flow tests skip while paused and run again on their own once confirmed,
//   - tests built on the removed /de/upload demo skip with DEMO_REMOVED; once
//     the upload runs they move to the form flow (card) or a minted token page.
// The paused state itself: tests/e2e/upload-f4.spec.js, tests/unit/f4-upload-recht.test.mjs.
const PAUSED_REASON =
  "Upload nimmt nichts an, solange die Löschfrist nicht bestätigt ist (r1-recht-inhalt P0-4, UPLOAD_CONFIG.retentionConfirmed=false); läuft wieder, sobald die Frist bestätigt ist.";
const DEMO_REMOVED =
  "Demo auf /de/upload entfernt (r1-recht-inhalt P0-4: kein Demo- oder Test-Link öffentlich). Mit bestätigter Frist auf Formular-Weg (Karte) bzw. Token-Seite umstellen.";
/** Skips the running test while the upload is paused (no Origin needed: the gate comes first). */
async function skipIfPaused(page) {
  const res = await page.request.post("/api/upload/session", { data: { ticket: "x".repeat(40) }, timeout: 90_000 });
  const body = await res.json().catch(() => ({}));
  test.skip(res.status() === 503 && body.error === "upload_paused", PAUSED_REASON);
}


const SECRET = process.env.UPLOAD_TOKEN_SECRET || "platzhirsch-upload-dev-secret-NICHT-PRODUKTIV";
const FIXTURES = path.resolve("qa-screenshots/handy-upload/fixtures");

function ticket(kind = "K", ttlSeconds = 600) {
  const payload = Buffer.from(
    JSON.stringify({ v: 1, k: kind, n: crypto.randomBytes(16).toString("base64url"), e: Math.floor(Date.now() / 1000) + ttlSeconds }),
  ).toString("base64url");
  return `${payload}.${crypto.createHmac("sha256", SECRET).update(`ticket:${payload}`).digest("base64url").slice(0, 22)}`;
}

/** Upload link via the real session route (same origin header as the page). */
async function mint(request, baseURL) {
  const res = await request.post("/api/upload/session", { headers: { Origin: new URL(baseURL).origin }, data: { ticket: ticket() }, timeout: 90_000 });
  test.skip(res.status() === 403, "server uses another UPLOAD_TOKEN_SECRET");
  expect(res.status()).toBe(200);
  return res.json();
}

async function dismissCookies(page) {
  const btn = page.getByRole("button", { name: /Weiter ohne Einwilligung|Nur notwendige|Ablehnen/ }).first();
  if (await btn.isVisible().catch(() => false)) await btn.click();
}

/** Blocks every inquiry/backoffice route; answers the wrapper with a ticket (or `answer`). */
async function interceptInquiry(page, answer) {
  const sent = [];
  await page.route("**/api/upload/inquiry/**", async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(answer ? answer() : { success: true, message: "ok", data: {}, upload: { ticket: ticket() } }) });
  });
  await page.route(/\/api\/(kontakt|beratung_anfrage|anfrage_produkt|newsletter_subscribe)(\?|$)/, (route) => route.abort());
  return sent;
}

async function submitKontakt(page) {
  await page.goto("/de/kontakt");
  await settle(page);
  await dismissCookies(page);
  const form = page.locator("form", { has: page.locator('[name="ihre_nachricht"]') });
  await form.locator('[name="name"]').fill("QA Test");
  await form.locator('[name="email_address"]').fill("qa@example.invalid");
  await form.locator('[name="telefon"]').fill("+43 660 0000000").catch(() => {});
  await form.locator('[name="ihre_nachricht"]').fill("Testnachricht der Qualitätssicherung, bitte ignorieren.");
  for (const cb of await form.locator('input[type="checkbox"]').all()) await cb.check().catch(() => {});
  await page.waitForTimeout(3200); // the real form route has a 3 s time trap
  await form.locator('button[type="submit"]').click();
  const card = page.locator("#upload-handoff-title").locator("xpath=ancestor::section[1]");
  await expect(card).toBeVisible({ timeout: 30_000 });
  return card;
}

test.describe("Handy-Upload", () => {
  test("Formular → Handoff → Link → Upload → Dank (Backoffice abgefangen)", async ({ page }) => {
    await skipIfPaused(page);
    const errors = collectConsoleErrors(page);
    const sessionBodies = [];
    const refs = [];
    page.on("request", (r) => r.url().endsWith("/api/upload/session") && sessionBodies.push(r.postDataJSON()));
    page.on("response", async (r) => {
      if (r.url().endsWith("/api/upload/session") && r.ok()) refs.push((await r.json().catch(() => ({}))).ref);
    });
    const sent = await interceptInquiry(page);
    const card = await submitKontakt(page);
    // The card waits up to 75 s itself (4 attempts, HANDOFF_ATTEMPTS); dev may compile first.
    await expect(card.getByText(/Referenz PH-K/)).toBeVisible({ timeout: 100_000 });
    expect(sent).toHaveLength(1);
    // Retry contract (src/lib/upload/messages.js): at most 4 requests, all with
    // the same ticket, and every answer is the same link (no second folder).
    expect(sessionBodies.length).toBeGreaterThanOrEqual(1);
    expect(sessionBodies.length).toBeLessThanOrEqual(4);
    for (const body of sessionBodies) expect(body).toEqual({ ticket: sessionBodies[0].ticket });
    expect(new Set(refs.filter(Boolean)).size).toBe(1);
    await expect(card.getByText(/Keine Verbindung/)).toHaveCount(0);

    const link = card.locator('a[data-upload-link]:visible');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveText(/Upload-Seite öffnen/);
    const href = await link.getAttribute("href");
    expect(href).toMatch(/\/de\/upload\/[A-Za-z0-9_-]{40,}$/);

    await page.goto(href);
    await settle(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Zeigen Sie uns Ihren Raum");
    await page.getByRole("checkbox").first().check();
    await page.locator('input[type="file"][accept="image/*,video/*"]').setInputFiles(path.join(FIXTURES, "foto-mit-gps.jpg"));
    await expect(page.getByText(/Hochgeladen/).first()).toBeVisible({ timeout: 60_000 });
    await page.getByRole("button", { name: /An Platzhirsch senden/ }).click();
    await expect(page.getByRole("heading", { name: "Vielen Dank!" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Vielen Dank!" })).toBeFocused();
    expect(errors.filter((e) => !/hydrat|Fast Refresh|HMR/i.test(e))).toEqual([]);
  });

  test("Langsamer Server: „dauert länger als üblich“ statt „Keine Verbindung“, dann derselbe Link", async ({ page }) => {
    await skipIfPaused(page);
    test.setTimeout(180_000);
    let calls = 0;
    await interceptInquiry(page);
    await page.route("**/api/upload/session", async (route) => {
      calls += 1;
      if (calls > 1) return route.continue();
      await new Promise((r) => setTimeout(r, 21_000)); // longer than the first attempt's 20 s
      await route.abort().catch(() => {}); // the page has given up on it already
    });
    const card = await submitKontakt(page);
    await expect(card.getByText(/länger als üblich – einen Moment/)).toBeVisible({ timeout: 40_000 });
    await expect(card.getByText(/Keine Verbindung/)).toHaveCount(0);
    await expect(card.getByText(/Referenz PH-K/)).toBeVisible({ timeout: 60_000 });
    expect(calls).toBe(2);
  });

  test("Nach dem Absenden: Fokus auf der Bestätigung, × überdeckt bei 320 px nichts", async ({ page }) => {
    await skipIfPaused(page);
    await page.setViewportSize({ width: 320, height: 640 });
    await interceptInquiry(page);
    const card = await submitKontakt(page);
    await expect
      .poll(() => page.evaluate(() => {
        const a = document.activeElement;
        return (a?.getAttribute("role") === "status" && a.tabIndex === -1) || a?.id === "upload-handoff-title";
      }))
      .toBe(true);
    const gap = await card.evaluate((el) => {
      const close = el.querySelector('button[aria-label="Hinweis schließen"]').getBoundingClientRect();
      const eyebrow = el.querySelector("p");
      const range = document.createRange();
      range.selectNodeContents(eyebrow);
      const rects = [...range.getClientRects()];
      const overlaps = rects.some((t) => t.right > close.left && t.left < close.right && t.bottom > close.top && t.top < close.bottom);
      return { overlaps, text: eyebrow.textContent };
    });
    expect(gap.text).toMatch(/dauert 1 Minute/i);
    expect(gap.overlaps).toBe(false);
  });

  test("Fake-Erfolg ohne Ticket: nur der E-Mail-Weg, kein Link-Aufruf", async ({ page }) => {
    await skipIfPaused(page);
    let minted = 0;
    page.on("request", (r) => r.url().endsWith("/api/upload/session") && minted++);
    await interceptInquiry(page, () => ({ success: true, message: "ok", data: {} }));
    const card = await submitKontakt(page);
    await expect(card.getByText(/per E-Mail an/)).toBeVisible();
    await expect(card.locator("a[data-upload-link]:visible")).toHaveCount(0);
    expect(minted).toBe(0);
  });

  test("Session-Route 429: verständliche Meldung und Erneut versuchen", async ({ page }) => {
    await skipIfPaused(page);
    await interceptInquiry(page);
    await page.route("**/api/upload/session", (route) => route.fulfill({ status: 429, contentType: "application/json", body: '{"ok":false,"error":"rate_limited"}' }));
    const card = await submitKontakt(page);
    await expect(card.getByText(/sehr viele Upload-Links/)).toBeVisible({ timeout: 20_000 });
    await expect(card.getByRole("button", { name: "Erneut versuchen" })).toBeVisible();
  });

  for (const width of [320, 375, 393]) {
    test(`A-1: genau ein Hauptknopf bei ${width} px (Demo-Karte)`, async ({ page }) => {
      test.skip(true, DEMO_REMOVED);
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/de/upload");
      await settle(page);
      const card = page.locator("#upload-handoff-title").locator("xpath=ancestor::section[1]");
      const visible = card.locator("a[data-upload-link]:visible");
      await expect(visible).toHaveCount(1);
      await expect(visible).toHaveText(/Jetzt Fotos & Pläne senden/);
      await expect(visible).not.toHaveAttribute("target", "_blank");
      const box = await visible.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    });
  }

  test("A-1: Desktop zeigt nur „Upload-Seite öffnen“ (neuer Tab)", async ({ page }) => {
    test.skip(true, DEMO_REMOVED);
    await page.goto("/de/upload");
    await settle(page);
    const visible = page.locator("a[data-upload-link]:visible");
    await expect(visible).toHaveCount(1);
    await expect(visible).toHaveAttribute("target", "_blank");
  });

  test("Gesperrter Zustand vor der Einwilligung: Kachel-Text erfüllt AA (≥ 4,5:1)", async ({ page, request, baseURL }) => {
    await skipIfPaused(page);
    const { url } = await mint(request, baseURL);
    await page.goto(url);
    await settle(page);
    const tile = page.getByRole("button", { name: /Foto aufnehmen/ });
    await expect(tile).toBeDisabled();
    const ratios = await tile.evaluate((btn) => {
      const rgb = (s) => s.match(/[\d.]+/g).map(Number);
      const lum = ([r, g, b]) => [r, g, b].map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
      const bg = rgb(getComputedStyle(btn).backgroundColor);
      const opacity = Number(getComputedStyle(btn).opacity);
      return [...btn.querySelectorAll("span")].map((s) => {
        const [r, g, b, a = 1] = rgb(getComputedStyle(s).color);
        const fg = [r, g, b].map((v, i) => v * a + bg[i] * (1 - a));
        const [x, y] = [lum(fg), lum(bg.slice(0, 3))].sort((m, n) => n - m);
        return { text: s.textContent, ratio: (x + 0.05) / (y + 0.05), opacity };
      });
    });
    for (const r of ratios) {
      expect(r.opacity, r.text).toBe(1);
      expect(r.ratio, r.text).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("Ungültiger und abgelaufener Link: deutsche Meldung mit Anrufen/E-Mail", async ({ page }) => {
    await page.goto("/de/upload/" + "x".repeat(60));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Link unvollständig");
    await expect(page.getByRole("link", { name: /Anrufen/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /E-Mail an/ })).toBeVisible();
    // Expired: a real token whose expiry lies in the past (signed like token.js).
    const id = crypto.randomBytes(16).toString("base64url");
    const exp = Math.floor(Date.now() / 1000 - 60).toString(36);
    const payload = Buffer.from(`1|K|PH-K261026-ABC123|${exp}|${id}`).toString("base64url");
    const tag = crypto.createHmac("sha256", SECRET).update(`upload:${payload}`).digest("base64url").slice(0, 22);
    await page.goto(`/de/upload/${payload}${tag}`);
    // F4 Fix-Runde 1: while the upload is paused, an expired link shows the paused notice.
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Link abgelaufen|Link unvollständig|Upload im Moment nicht möglich/);
  });

  test("Fehlerfälle im Upload: falscher Typ, zu groß, Offline, Link läuft ab", async ({ page, context, request, baseURL }) => {
    await skipIfPaused(page);
    const { url } = await mint(request, baseURL);
    await page.goto(url);
    await settle(page);
    await page.getByRole("checkbox").first().check();
    const gallery = page.locator('input[type="file"][accept="image/*,video/*"]');
    // wrong type: renamed .exe → magic bytes → "Abgelehnt"
    await gallery.setInputFiles(path.join(FIXTURES, "programm.jpg"));
    await expect(page.getByText("Abgelehnt: Nur Fotos, Videos und PDF möglich.")).toBeVisible({ timeout: 30_000 });
    // too large (browser check, nothing sent)
    await gallery.setInputFiles({ name: "riesig.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(31 * 1024 * 1024, 1) });
    await expect(page.getByText(/Abgelehnt: Zu groß: max\. 30 MB/)).toBeVisible();
    // offline → notice, upload waits
    await context.setOffline(true);
    await expect(page.getByText(/Keine Verbindung – der Upload geht automatisch weiter/)).toBeVisible();
    await context.setOffline(false);
    // link expires while the page is open → stop with a German notice
    await page.route("**/api/upload/*/files", (route) => route.fulfill({ status: 410, contentType: "application/json", body: '{"ok":false,"error":"expired"}' }));
    await gallery.setInputFiles(path.join(FIXTURES, "foto-mit-gps.jpg"));
    await expect(page.getByRole("alert").filter({ hasText: "Dieser Upload-Link ist abgelaufen." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Foto aufnehmen" })).toBeDisabled();
  });
});
