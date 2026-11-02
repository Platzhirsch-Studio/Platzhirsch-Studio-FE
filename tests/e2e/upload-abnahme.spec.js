// tests/e2e/upload-abnahme.spec.js — Handy-Upload Premium, remainders of the
// acceptance check (qa-screenshots/labs-ausbau/handy-upload/abnahme.md):
// R-1 nothing is lost before hydration (consent box locked until then, files
// that landed in a capture input early are adopted), R-5 the iPhone bar keeps
// its status text readable in the "Erneut versuchen" state.
// iPhone 15 Pro (WebKit) for the whole file; runs inside the desktop project.
// SAFETY: every non-GET /api/** except the upload routes of the demo/dev store
// is answered by the test (503), nothing reaches the backoffice.
import { test, expect, devices } from "@playwright/test";
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


test.use({ ...devices["iPhone 15 Pro"] });

const FIXTURES = path.resolve("qa-screenshots/handy-upload/fixtures");
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const FILES_POST = /\/api\/upload\/[^/]+\/files$/;

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

test.describe("Handy-Upload Abnahme-Rest · iPhone (WebKit)", () => {
  test("R-1: vor der Hydration Zustimmung gesperrt, früh gewählte Datei geht nicht verloren", async ({ page }) => {
    test.skip(true, DEMO_REMOVED);
    test.setTimeout(300_000);
    const blocked = await guard(page);
    // Hold the page's JS back so the server HTML is on screen without React.
    let release;
    const gate = new Promise((r) => (release = r));
    // Scripts only: holding the CSS (same folder in Turbopack builds) would block
    // rendering of the server HTML itself.
    await page.route(/\/_next\/static\/chunks\/.*\.js(\?|$)/, async (route) => {
      await gate;
      return route.fallback();
    });
    // "commit": the HTML streams in while the held scripts block the load events.
    await page.goto("/de/upload", { waitUntil: "commit" });
    const phone = page.locator("[data-upload-scroll]");
    await expect(phone.getByRole("checkbox")).toBeDisabled({ timeout: 120_000 });
    // A file that lands in the input before hydration (slow phone, busy server)…
    await phone.locator('input[type="file"][accept="image/*,video/*"]').setInputFiles(path.join(FIXTURES, "foto-mit-gps.jpg"));
    release();
    await settle(page);
    test.skip(await phone.getByText(/keine Dateien angenommen/).isVisible(), "demo uploads off on this server");
    // …is adopted after hydration and waits for consent.
    const list = phone.getByRole("list", { name: "Ihre Dateien" });
    await expect(list).toBeVisible({ timeout: 30_000 });
    await expect(phone.getByRole("checkbox")).toBeEnabled();
    await phone.getByRole("checkbox").check();
    await expect(list.getByText(/Hochgeladen/)).toBeVisible({ timeout: 240_000 });
    expect(blocked).toEqual([]);
  });

  test("R-5: Leiste im Zustand „Erneut versuchen“ – Status lesbar, Knopf 44 px mit Namen", async ({ page }) => {
    test.skip(true, DEMO_REMOVED);
    test.setTimeout(300_000);
    const blocked = await guard(page);
    await page.route(FILES_POST, async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      // hangs like an overloaded server until the test ends
    });
    await page.goto("/de/upload");
    await settle(page);
    const phone = page.locator("[data-upload-scroll]");
    test.skip(await phone.getByText(/keine Dateien angenommen/).isVisible(), "demo uploads off on this server");
    await phone.getByRole("checkbox").check();
    await phone.locator('input[type="file"][accept="image/*,video/*"]').setInputFiles(path.join(FIXTURES, "foto-mit-gps.jpg"));
    const bar = phone.locator("[data-upload-bar]");
    const kick = bar.getByRole("button", { name: "Erneut versuchen" });
    await expect(kick).toBeVisible({ timeout: 40_000 });
    const box = await kick.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    // neither the title nor the detail line is cut off on a 393 px phone
    const cut = await bar.evaluate((el) =>
      ["[data-upload-bar-title] > span.truncate", "[data-upload-bar-detail]"]
        .map((s) => el.querySelector(s))
        .filter((n) => n && n.scrollWidth > n.clientWidth + 1)
        .map((n) => n.textContent),
    );
    expect(cut).toEqual([]);
    // the sweep runs on the track below the bar row, not frozen at 0 %
    await expect(phone.locator("[data-upload-bar-sweep]")).toBeVisible();
    // evidence: the bar itself (the cookie banner may cover the page bottom)
    const banner = page.getByRole("button", { name: "Weiter ohne Einwilligung" });
    if (await banner.isVisible()) await banner.click();
    await phone.locator("[data-upload-bar]").locator("..").screenshot({ path: "qa-screenshots/labs-ausbau/handy-upload/fix2/r5-iphone-bar-stalled.png", animations: "allow" });
    const axe = await new AxeBuilder({ page }).include("[data-upload-scroll]").withTags(TAGS).analyze();
    expect(axe.violations.map((v) => v.id)).toEqual([]);
    expect(blocked).toEqual([]);
  });
});
