// tests/e2e/r3-portal-voice.spec.js — R3-portal-upload, Runde 4: Sprachaufnahme
// ohne Mikrofon-Erlaubnis (Ablehnungspfad) und Portal-Oberfläche ohne Radien.
// Ersetzt NICHT den Test auf echtem iPhone (Safari) und Android (Chrome): Hier
// wird getUserMedia so abgelehnt, wie Safari/Chrome es beim Tippen auf
// „Nicht erlauben“ tun (DOMException NotAllowedError). Es wird nichts gesendet.
import { test, expect } from "@playwright/test";
import { createHmac, randomUUID } from "node:crypto";

const SECRET = process.env.PORTAL_SESSION_SECRET || "dev-only-portal-secret-do-not-use-in-production-0000";
const PLAN = "/de/portal/projekte/PRJ-2026-021";

async function login(context, baseURL) {
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ v: 1, sub: "CUST-DEMO-0001", sid: randomUUID(), iat: now, exp: now + 3600 })).toString("base64url");
  const value = `${body}.${createHmac("sha256", SECRET).update(`portal-session:${body}`).digest("base64url")}`;
  await context.addCookies([{ name: "ph_portal_session", value, url: baseURL, httpOnly: true, sameSite: "Lax" }]);
}

test.describe("R3 Portal Sprachaufnahme", () => {
  test("Mikrofon abgelehnt: Hinweis, „Stattdessen schreiben“ fokussiert das Textfeld, „Erneut versuchen“", async ({ page, context, baseURL }) => {
    await login(context, baseURL);
    await page.addInitScript(() => {
      let calls = 0;
      window.__micCalls = () => calls;
      navigator.mediaDevices.getUserMedia = async () => {
        calls += 1;
        throw new DOMException("Permission denied", "NotAllowedError");
      };
    });
    const res = await page.goto(PLAN);
    test.skip(page.url().includes("/login"), "server uses another PORTAL_SESSION_SECRET");
    expect(res.status()).toBe(200);
    const group = page.getByRole("group", { name: "Art der Rückmeldung" });
    await group.getByRole("button", { name: "Sprachnachricht" }).click();
    await page.getByRole("button", { name: "Aufnahme starten" }).click();
    const alert = page.getByRole("alert").filter({ hasText: "Kein Zugriff auf das Mikrofon" });
    await expect(alert).toBeVisible();
    await alert.getByRole("button", { name: "Erneut versuchen" }).click();
    await expect(alert).toBeVisible();
    expect(await page.evaluate(() => window.__micCalls())).toBe(2);
    await alert.getByRole("button", { name: "Stattdessen schreiben" }).click();
    await expect(group.getByRole("button", { name: "Kommentar" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("textarea:focus")).toHaveCount(1);
  });

  test("Neuauftritt: Karten und Buttons im Portal ohne Radien", async ({ page, context, baseURL }) => {
    await login(context, baseURL);
    for (const path of ["/de/portal", PLAN, "/de/portal/termine"]) {
      await page.goto(path);
      test.skip(page.url().includes("/login"), "server uses another PORTAL_SESSION_SECRET");
      const rounded = await page.locator("main").evaluate((root) =>
        [...root.querySelectorAll("section, article, a, button, input, textarea, select, li")]
          .filter((n) => n.getBoundingClientRect().width >= 48 && parseFloat(getComputedStyle(n).borderTopLeftRadius) > 0)
          .map((n) => `${n.tagName}.${String(n.className).slice(0, 60)}`),
      );
      expect(rounded, path).toEqual([]);
    }
  });
});
