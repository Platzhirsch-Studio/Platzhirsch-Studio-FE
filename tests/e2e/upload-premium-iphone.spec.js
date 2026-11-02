// tests/e2e/upload-premium-iphone.spec.js — Labs-Ausbau "Handy-Upload
// Premium" on iPhone 15 Pro (WebKit, set for this whole file; it runs inside
// the desktop project, see playwright.config.js). Real upload page
// /de/upload/<token> (link minted with a dev-secret ticket like upload.spec.js;
// files go to the dev store only, never to the backoffice).
import { test, expect, devices } from "@playwright/test";
import crypto from "node:crypto";
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

const SECRET = process.env.UPLOAD_TOKEN_SECRET || "platzhirsch-upload-dev-secret-NICHT-PRODUKTIV";
const FIXTURES = path.resolve("qa-screenshots/handy-upload/fixtures");

function ticket(kind = "K", ttlSeconds = 600) {
  const payload = Buffer.from(
    JSON.stringify({ v: 1, k: kind, n: crypto.randomBytes(16).toString("base64url"), e: Math.floor(Date.now() / 1000) + ttlSeconds }),
  ).toString("base64url");
  return `${payload}.${crypto.createHmac("sha256", SECRET).update(`ticket:${payload}`).digest("base64url").slice(0, 22)}`;
}

async function mint(request, baseURL) {
  const res = await request.post("/api/upload/session", { headers: { Origin: new URL(baseURL).origin }, data: { ticket: ticket() }, timeout: 90_000 });
  test.skip(res.status() === 403, "server uses another UPLOAD_TOKEN_SECRET");
  expect(res.status()).toBe(200);
  return res.json();
}

test.describe("Handy-Upload Premium · iPhone (WebKit)", () => {
  test("Übergabekarte am Handy: ein Hauptknopf, kein QR, kein Versand-Angebot, kein Überlauf", async ({ page }) => {
    test.skip(true, DEMO_REMOVED);
    await page.goto("/de/upload");
    await settle(page);
    const card = page.locator("section[aria-labelledby=upload-handoff-title]");
    const main = card.locator("a[data-upload-link]:visible");
    await expect(main).toHaveCount(1);
    await expect(main).toHaveText(/Jetzt Fotos & Pläne senden/);
    expect((await main.boundingBox()).height).toBeGreaterThanOrEqual(48);
    await expect(card.getByRole("img", { name: /QR-Code/ })).toBeHidden();
    // fix1 P2-2: no "Link an mich senden" on the phone (the visitor is already on the right device)
    await expect(card.getByRole("button", { name: /Link an mich senden/ })).toBeHidden();
    await expect(card.getByRole("button", { name: "Link kopieren" })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });

  test("Upload-Seite: Vollbild, Touch-Ziele ≥ 44 px, Upload mit Fortschritt, Erfolgsseite", async ({ page, request, baseURL }) => {
    await skipIfPaused(page);
    const { url } = await mint(request, baseURL);
    await page.goto(url);
    await settle(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Zeigen Sie uns Ihren Raum");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);

    // every visible control of the upload UI is at least 44 × 44 (WCAG 2.5.8 + Bibel §6)
    await page.getByRole("checkbox").check();
    const small = await page.locator("[data-upload-client]").evaluate((root) =>
      [...root.querySelectorAll("button, summary, a, label:has(input[type=checkbox])")]
        .filter((el) => el.offsetParent !== null && !el.closest("p"))
        .map((el) => ({ el: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40), ...el.getBoundingClientRect().toJSON() }))
        .filter((r) => r.height < 44 || (r.width < 44 && r.el !== "")),
    );
    expect(small).toEqual([]);

    // tiles are big (≥ 9 rem tall), two per row
    const tile = page.getByRole("button", { name: /Foto aufnehmen/ });
    const tb = await tile.boundingBox();
    expect(tb.height).toBeGreaterThanOrEqual(140);
    expect(tb.width).toBeGreaterThanOrEqual(150);

    await page.locator('input[type="file"][accept="image/*,video/*"]').setInputFiles(path.join(FIXTURES, "foto-mit-gps.jpg"));
    await expect(page.getByRole("list", { name: "Ihre Dateien" }).getByText(/Hochgeladen/)).toBeVisible({ timeout: 60_000 });
    // sticky overall bar sits above the home indicator (safe area) and offers "Senden"
    await expect(page.getByRole("button", { name: "Senden", exact: true })).toBeVisible();

    await page.getByRole("button", { name: /An Platzhirsch senden/ }).click();
    const heading = page.getByRole("heading", { name: "Vielen Dank!" });
    await expect(heading).toBeVisible({ timeout: 20_000 });
    await expect(heading).toBeFocused();
    await expect(page.locator("[data-upload-done]").getByText("1 Foto")).toBeVisible();
    await expect(page.getByRole("link", { name: "Zur Website von Platzhirsch" })).toBeVisible();
  });

  test("fix1 P2-3: umbenannte .exe wird auf dem iPhone sofort abgelehnt (kein „0 %“)", async ({ page, request, baseURL }) => {
    await skipIfPaused(page);
    const { url } = await mint(request, baseURL);
    await page.goto(url);
    await settle(page);
    await page.getByRole("checkbox").check();
    const sent = [];
    page.on("request", (r) => /\/api\/upload\/[^/]+\/files/.test(r.url()) && sent.push(r.method()));
    const t0 = Date.now();
    await page.locator('input[type="file"][accept="image/*,video/*"]').setInputFiles(path.join(FIXTURES, "programm.jpg"));
    const files = page.getByRole("list", { name: "Ihre Dateien" });
    await expect(files.getByText(/Abgelehnt:/)).toBeVisible({ timeout: 3000 });
    expect(Date.now() - t0).toBeLessThan(3000);
    await expect(files.getByText(/Lädt hoch/)).toHaveCount(0);
    expect(sent).toEqual([]);
  });

  test("Reduced Motion: Häkchen und Karten ohne Animation", async ({ page, request, baseURL }) => {
    await skipIfPaused(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { url } = await mint(request, baseURL);
    await page.goto(url);
    await settle(page);
    await page.getByRole("checkbox").check();
    await page.getByLabel(/Notiz & Maße/).fill("Nur Notiz (QA-Test, bitte ignorieren)");
    await page.getByRole("button", { name: /An Platzhirsch senden/ }).click();
    await expect(page.getByRole("heading", { name: "Vielen Dank!" })).toBeVisible({ timeout: 20_000 });
    const anim = await page.evaluate(() => ({
      tick: getComputedStyle(document.querySelector("[data-upload-tick]")).animationName,
      card: getComputedStyle(document.querySelector("[data-upload-done] > div")).animationName,
    }));
    expect(anim).toEqual({ tick: "none", card: "none" });
  });
});
