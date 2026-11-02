// tests/e2e/r3-portal-upload.spec.js — R3-portal-upload against the running
// server: route-exact headers (curl-equivalent), upload token status codes,
// UploadHandoff without radii/shadows. Portal pages need a session cookie and
// are covered by qa-screenshots/kundenportal/r3/*.mjs (probe3, axe, N2).
import { test, expect } from "@playwright/test";
import crypto from "node:crypto";

const SECRET = process.env.UPLOAD_TOKEN_SECRET || "platzhirsch-upload-dev-secret-NICHT-PRODUKTIV";
const GLOBAL_PP = "camera=(), microphone=(), geolocation=(self), interest-cohort=()";

// Abnahme R-8: on a busy dev server the first hit of a portal route compiles
// it, which took longer than the global actionTimeout (15 s, also the default
// for request.get). Header requests get their own, longer timeout; a warm-up
// in beforeAll compiles the routes once (its result is not asserted).
// QM fix2 P3-2: the checks only read headers, so they send HEAD (checked with
// curl -I: all seven routes answer HEAD with the same status and headers).
// A GET waited for the body even after the 307 and its headers had arrived.
const REQUEST_TIMEOUT = Number(process.env.PW_REQUEST_TIMEOUT) || 90_000;
const HEADER_REQ = { method: "HEAD", maxRedirects: 0, timeout: REQUEST_TIMEOUT };
const PORTAL_ROUTES = [
  "/de/portal/projekte/PRJ-2026-021",
  "/de/portal",
  "/de/portal/projekte",
  "/de",
  "/api/portal/dokumente/ANG-TEST",
  "/api/portal/dokumente/kalender",
  "/api/portal/dokumente/pass/PASS-014-1",
];

function expiredToken() {
  const id = crypto.randomBytes(16).toString("base64url");
  const exp = Math.floor(Date.now() / 1000 - 60).toString(36);
  const payload = Buffer.from(`1|K|PH-K261026-ABC123|${exp}|${id}`).toString("base64url");
  return payload + crypto.createHmac("sha256", SECRET).update(`upload:${payload}`).digest("base64url").slice(0, 22);
}

test.describe("R3 Portal-Header", () => {
  test.describe.configure({ timeout: 300_000 });

  // `request` is test-scoped, so the warm-up uses its own API context.
  // Hooks do not inherit describe.configure's timeout, so it is set here; the
  // routes are requested in parallel, the hook stays within ~1 request timeout.
  test.beforeAll(async ({ playwright }, testInfo) => {
    test.setTimeout(REQUEST_TIMEOUT + 60_000);
    const ctx = await playwright.request.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
      await Promise.all(PORTAL_ROUTES.map((p) => ctx.fetch(p, HEADER_REQ).catch(() => null)));
    } finally {
      await ctx.dispose();
    }
  });

  test("microphone=(self) nur auf der Planungsseite, sonst global", async ({ request }) => {
    const plan = await request.fetch("/de/portal/projekte/PRJ-2026-021", HEADER_REQ);
    expect(plan.headers()["permissions-policy"]).toBe("camera=(), microphone=(self), geolocation=(self), interest-cohort=()");
    expect(plan.headers()["x-frame-options"]).toBe("DENY");
    for (const p of ["/de/portal", "/de/portal/projekte", "/de"]) {
      const r = await request.fetch(p, HEADER_REQ);
      expect(r.headers()["permissions-policy"], p).toBe(GLOBAL_PP);
      expect(r.headers()["x-frame-options"], p).toBe("DENY");
    }
  });

  test("SAMEORIGIN/frame-ancestors nur auf der Dokument-Route", async ({ request }) => {
    const doc = await request.fetch("/api/portal/dokumente/ANG-TEST", HEADER_REQ);
    expect(doc.headers()["x-frame-options"]).toBe("SAMEORIGIN");
    expect(doc.headers()["content-security-policy"]).toBe("frame-ancestors 'self'");
    for (const p of ["/api/portal/dokumente/kalender", "/api/portal/dokumente/pass/PASS-014-1"]) {
      const r = await request.fetch(p, HEADER_REQ);
      expect(r.headers()["x-frame-options"], p).toBe("DENY");
    }
  });
});

test.describe("R3 Upload", () => {
  test("Ungültiger Token: 404, noindex, Hilfetext mit Anrufen/E-Mail", async ({ page }) => {
    const res = await page.goto("/de/upload/" + "x".repeat(60));
    expect(res.status()).toBe(404);
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Link unvollständig");
    await expect(page.getByRole("link", { name: /Anrufen/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /E-Mail an/ })).toBeVisible();
  });

  test("Abgelaufener Token: noindex und „Link abgelaufen“", async ({ page }) => {
    const res = await page.goto(`/de/upload/${expiredToken()}`);
    test.skip(res.status() === 404, "server uses another UPLOAD_TOKEN_SECRET");
    expect(res.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
    // F4 Fix-Runde 1 (r1-recht-inhalt P0-4): while the Löschfrist is unconfirmed the
    // upload takes nothing, and every usable link shows the paused notice instead.
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^(Link abgelaufen|Upload im Moment nicht möglich)$/);
  });

  test("UploadHandoff im Neuauftritt: keine Radien, keine Schatten", async ({ page }) => {
    // The card lived on the /de/upload demo, which is gone (r1-recht-inhalt P0-4: no
    // public demo or test link). Once the upload runs, check it after a form send.
    test.skip(true, "Demo auf /de/upload entfernt (r1-recht-inhalt P0-4); Karte erscheint nur nach einer Anfrage, solange die Annahme läuft.");
    await page.goto("/de/upload");
    const card = page.locator("section[aria-labelledby=upload-handoff-title]");
    await expect(card).toBeVisible();
    const styles = await card.evaluate((el) => {
      const all = [el, ...el.querySelectorAll("*")];
      return all.map((n) => {
        const s = getComputedStyle(n);
        return { r: s.borderTopLeftRadius, sh: s.boxShadow, tag: n.tagName };
      });
    });
    for (const s of styles) {
      expect(s.r, s.tag).toBe("0px");
      // ring-1 (QR frame) is a 1px spread hairline, not an elevation: only offset or blur count as shadow.
      const layers = s.sh === "none" ? [] : s.sh.replace(/(rgba?|oklch|oklab|color)\([^)]*\)/gi, "").split(",");
      const elevated = layers.some((l) => l.trim().split(/\s+/).slice(0, 3).some((v) => parseFloat(v) !== 0 && !Number.isNaN(parseFloat(v))));
      expect(elevated, `${s.tag}: ${s.sh}`).toBe(false);
    }
  });
});
