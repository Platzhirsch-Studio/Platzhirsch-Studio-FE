// tests/e2e/upload-timing.spec.js — QA fix2 P1-1 measurement (opt-in):
// upload-link mint and a 489 KB photo on iPhone 15 Pro (WebKit), three runs.
// Only with UPLOAD_TIMING=1, meant for a production build OUTSIDE the repo:
//   UPLOAD_TIMING=1 UPLOAD_DEMO_ENABLED=1 node tools/qa/prod-check.mjs --steps=copy,build,start,tests \
//     --specs="upload-timing.spec.js" --port=3110 --copy=../ph-prodcheck-upload
// Target (feedback-2.md): mint < 300 ms, photo < 3 s, 3/3 green.
// Files go to the local dev store of that server only, never to the backoffice.
import { test, expect, devices } from "@playwright/test";
import crypto from "node:crypto";
import path from "node:path";

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
test.skip(!process.env.UPLOAD_TIMING, "opt-in: UPLOAD_TIMING=1");

const SECRET = process.env.UPLOAD_TOKEN_SECRET || "platzhirsch-upload-dev-secret-NICHT-PRODUKTIV";
const PHOTO = path.resolve("qa-screenshots/handy-upload/fixtures/foto-mit-gps.jpg");

function ticket() {
  const payload = Buffer.from(JSON.stringify({ v: 1, k: "K", n: crypto.randomBytes(16).toString("base64url"), e: Math.floor(Date.now() / 1000) + 600 })).toString("base64url");
  return `${payload}.${crypto.createHmac("sha256", SECRET).update(`ticket:${payload}`).digest("base64url").slice(0, 22)}`;
}

for (const run of [1, 2, 3]) {
  test(`Lauf ${run}: Link anlegen und 489-KB-Foto auf WebKit`, async ({ page, request, baseURL }, info) => {
    await skipIfPaused(page);
    test.setTimeout(120_000);
    const m0 = performance.now();
    const res = await request.post("/api/upload/session", { headers: { Origin: new URL(baseURL).origin }, data: { ticket: ticket() } });
    const mintMs = Math.round(performance.now() - m0);
    test.skip(res.status() === 403, "server uses another UPLOAD_TOKEN_SECRET");
    expect(res.status()).toBe(200);
    const { url } = await res.json();
    await page.goto(new URL(new URL(url).pathname, baseURL).href);
    await page.getByRole("checkbox").check();
    const t0 = performance.now();
    await page.locator('input[type="file"][accept="image/*,video/*"]').setInputFiles(PHOTO);
    await expect(page.getByRole("list", { name: "Ihre Dateien" }).getByText(/Hochgeladen/)).toBeVisible({ timeout: 90_000 });
    const uploadMs = Math.round(performance.now() - t0);
    const result = { run, baseURL, mintMs, uploadMs, bytes: 500844 };
    console.log("UPLOAD_TIMING", JSON.stringify(result));
    await info.attach("timing.json", { body: JSON.stringify(result), contentType: "application/json" });
    expect(uploadMs, "489 KB photo under 3 s").toBeLessThan(3000);
  });
}
