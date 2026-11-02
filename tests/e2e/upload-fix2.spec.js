// tests/e2e/upload-fix2.spec.js — Handy-Upload Premium, QA round fix2
// (qa-screenshots/labs-ausbau/handy-upload/feedback-2.md): sticky bar mirrors
// slow/retry/pause, "Erneut versuchen" after 20 s, progress never backwards,
// no "100 %" while a file waits, clipboard fallback on the handoff card.
// SAFETY: every non-GET /api/** except the upload routes of the demo/dev store
// is answered by the test (503), nothing reaches the backoffice.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";
import { settle } from "./helpers.js";

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


const FIXTURES = path.resolve("qa-screenshots/handy-upload/fixtures");
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const FILES_POST = /\/api\/upload\/[^/]+\/files$/;
const CHUNK_PUT = /\/api\/upload\/[^/]+\/files\/[^/?]+\?index=/;

async function guard(page) {
  const blocked = [];
  await page.route("**/api/**", (route) => {
    const req = route.request();
    const p = new URL(req.url()).pathname;
    if (req.method() === "GET" || req.method() === "HEAD" || /^\/api\/upload\/(?!inquiry\/)/.test(p)) return route.fallback();
    blocked.push(`${req.method()} ${p}`);
    return route.fulfill({ status: 503, contentType: "application/json", body: '{"ok":false,"code":"blocked_by_test"}' });
  });
  return blocked;
}

async function openPhone(page) {
  await page.goto("/de/upload");
  await settle(page);
  const phone = page.locator("[data-upload-scroll]");
  test.skip(await phone.getByText(/keine Dateien angenommen/).isVisible(), "demo uploads off on this server");
  await phone.getByRole("checkbox").check();
  return phone;
}

/** Records every text of the sticky bar's detail line (x von y fertig · z %). */
async function recordBar(page) {
  await page.evaluate(() => {
    window.__bar = [];
    const seen = () => {
      const t = document.querySelector("[data-upload-bar-detail]")?.textContent;
      const title = document.querySelector("[data-upload-bar-title]")?.textContent;
      const last = window.__bar.at(-1);
      if (t && (last?.t !== t || last?.title !== title)) window.__bar.push({ t, title, at: performance.now() });
    };
    new MutationObserver(seen).observe(document.body, { subtree: true, childList: true, characterData: true });
  });
}
const percents = (log) => log.map((e) => Number(e.t.match(/(\d+) % der Daten/)?.[1])).filter(Number.isFinite);

test.describe("Handy-Upload fix2 · Desktop", () => {
  test("P2-3: Zwischenablage blockiert → markiertes Feld mit dem Link + Hinweis", async ({ page }) => {
    test.skip(true, DEMO_REMOVED);
    // no grantPermissions; additionally make writeText fail like a locked-down browser
    await page.addInitScript(() => {
      if (navigator.clipboard) navigator.clipboard.writeText = () => Promise.reject(new DOMException("blocked", "NotAllowedError"));
    });
    await page.goto("/de/upload", { waitUntil: "domcontentloaded" });
    const card = page.locator("section[aria-labelledby=upload-handoff-title]");
    await card.locator("[data-upload-copy]:not([disabled])").click({ timeout: 90_000 }); // after hydration (slow dev server)
    const field = card.locator("[data-upload-copy-fallback] input");
    await expect(field).toBeVisible();
    await expect(field).toHaveValue(/\/de\/upload\//);
    await expect(field).toHaveAttribute("readonly", "");
    await expect(field).toBeFocused();
    const sel = await field.evaluate((el) => [el.selectionStart, el.selectionEnd, el.value.length]);
    expect(sel[0]).toBe(0);
    expect(sel[1]).toBe(sel[2]);
    await expect(card.getByText(/Kopieren nicht möglich – Link markiert, mit (⌘|Strg) \+ C kopieren/).first()).toBeVisible();
    const axe = await new AxeBuilder({ page }).include("section[aria-labelledby=upload-handoff-title]").withTags(TAGS).analyze();
    expect(axe.violations.map((v) => v.id)).toEqual([]);
  });

  test("P2-3: ohne navigator.clipboard dasselbe", async ({ page }) => {
    test.skip(true, DEMO_REMOVED);
    await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true }));
    await page.goto("/de/upload", { waitUntil: "domcontentloaded" });
    const card = page.locator("section[aria-labelledby=upload-handoff-title]");
    await card.locator("[data-upload-copy]:not([disabled])").click({ timeout: 90_000 }); // after hydration (slow dev server)
    await expect(card.locator("[data-upload-copy-fallback] input")).toHaveValue(/\/de\/upload\//);
  });

  test("P2-2: offline + kleines PDF → Leiste „Pausiert“, nie „100 %“, danach hochgeladen", async ({ page, context }) => {
    test.skip(true, DEMO_REMOVED);
    test.setTimeout(300_000);
    const blocked = await guard(page);
    const phone = await openPhone(page);
    await recordBar(page);
    await context.setOffline(true);
    await phone.locator('input[type="file"][accept="application/pdf,image/*"]').setInputFiles(path.join(FIXTURES, "grundriss.pdf"));
    const bar = phone.locator("[data-upload-bar]");
    await expect(bar).toHaveAttribute("data-upload-bar-mode", "paused");
    await expect(bar).toContainText("Pausiert – wartet auf Verbindung");
    await expect(bar).not.toContainText("100 %");
    await context.setOffline(false);
    await expect(phone.getByRole("list", { name: "Ihre Dateien" }).getByText(/Hochgeladen/)).toBeVisible({ timeout: 240_000 });
    const log = await page.evaluate(() => window.__bar);
    // "100 %" only after the file is confirmed (the bar then switches to "1 Datei bereit")
    expect(log.filter((e) => /100 % der Daten/.test(e.t)), JSON.stringify(log)).toEqual([]);
    expect(blocked).toEqual([]);
  });

  test("P2-1: nach einem Serverfehler springt der Fortschritt nie zurück", async ({ page }) => {
    test.skip(true, DEMO_REMOVED);
    test.setTimeout(300_000);
    const blocked = await guard(page);
    let puts = 0;
    await page.route(CHUNK_PUT, async (route) => {
      if (route.request().method() === "PUT" && puts++ === 0) {
        return route.fulfill({ status: 500, contentType: "application/json", body: '{"ok":false,"error":"server_error"}' });
      }
      return route.fallback();
    });
    const phone = await openPhone(page);
    await recordBar(page);
    await phone.locator('input[type="file"][accept="image/*,video/*"]').setInputFiles(path.join(FIXTURES, "foto-mit-gps.jpg"));
    await expect(phone.getByRole("list", { name: "Ihre Dateien" }).getByText(/Hochgeladen/)).toBeVisible({ timeout: 240_000 });
    expect(puts).toBeGreaterThanOrEqual(2);
    const log = await page.evaluate(() => window.__bar);
    const p = percents(log);
    for (let i = 1; i < p.length; i++) expect(p[i], JSON.stringify(log)).toBeGreaterThanOrEqual(p[i - 1]);
    expect(Math.max(0, ...p.filter((v) => v < 100))).toBeLessThanOrEqual(97);
    expect(log.some((e) => /Neuer Versuch 2\/5/.test(e.title || "")), "retry shown in the bar").toBe(true);
    expect(blocked).toEqual([]);
  });

  test("P1-1: hängender Server → Leiste zeigt Versuch n/5, nach 20 s „Erneut versuchen“, Neustart sofort", async ({ page }) => {
    test.skip(true, DEMO_REMOVED);
    test.setTimeout(300_000);
    const blocked = await guard(page);
    let held = 0;
    const posts = [];
    await page.route(FILES_POST, async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      posts.push(Date.now());
      if (held++ < 2) return; // hangs like an overloaded server; the client's own timeout/kick ends it
      return route.fallback();
    });
    const phone = await openPhone(page);
    const t0 = Date.now();
    await phone.locator('input[type="file"][accept="image/*,video/*"]').setInputFiles(path.join(FIXTURES, "foto-mit-gps.jpg"));
    const bar = phone.locator("[data-upload-bar]");
    // visible state in the bar (not only on the card further down)
    await expect(bar).toContainText("Verbindung ist langsam – wir bleiben dran…", { timeout: 15_000 });
    await expect(bar.locator("[data-upload-bar-thumb]")).toBeVisible();
    await expect(bar).toContainText(/Neuer Versuch 2\/5…/, { timeout: 20_000 });
    expect(Date.now() - t0, "12 s client timeout, not 60 s").toBeLessThan(20_000);
    const kick = bar.getByRole("button", { name: "Erneut versuchen" });
    await expect(kick).toBeVisible({ timeout: 25_000 });
    expect(Date.now() - t0).toBeGreaterThanOrEqual(19_000);
    const before = posts.length;
    const kickedAt = Date.now();
    await kick.click();
    await expect.poll(() => posts.length, { timeout: 5_000 }).toBeGreaterThan(before);
    expect(posts.at(-1) - kickedAt, "new attempt right away").toBeLessThan(2_000);
    await expect(phone.getByRole("list", { name: "Ihre Dateien" }).getByText(/Hochgeladen/)).toBeVisible({ timeout: 240_000 });
    const axe = await new AxeBuilder({ page }).include("[data-upload-scroll]").withTags(TAGS).analyze();
    expect(axe.violations.map((v) => v.id)).toEqual([]);
    expect(blocked).toEqual([]);
  });
});
