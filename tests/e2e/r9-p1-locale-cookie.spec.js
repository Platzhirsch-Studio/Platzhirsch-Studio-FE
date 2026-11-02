// R5-Fix P1 (recht P1-4, technik P2): NEXT_LOCALE / preferredLocale are only set
// when the visitor actively switches the language – never on the first visit,
// never on a router prefetch, never on a cached page.
import { test, expect } from "@playwright/test";

const noLocaleCookie = (res, label) => expect(res.headers()["set-cookie"] || "", label).not.toMatch(/NEXT_LOCALE/);

test("erster Besuch, Wiederholung, andere Sprache und Prefetch: kein Set-Cookie", async ({ playwright, baseURL }, info) => {
  test.skip(info.project.name !== "desktop", "Serverantwort, einmal");
  const fresh = await playwright.request.newContext({ baseURL });
  for (const p of ["/de", "/de/kontakt", "/en/contact", "/fr", "/it/chi-siamo/team"]) {
    noLocaleCookie(await fresh.get(p, { maxRedirects: 0, timeout: 240_000 }), p);
  }
  // Router prefetch (RSC) of another language.
  noLocaleCookie(
    await fresh.get("/en", { maxRedirects: 0, headers: { RSC: "1", "Next-Router-Prefetch": "1" }, timeout: 240_000 }),
    "prefetch /en"
  );
  noLocaleCookie(await fresh.get("/en", { maxRedirects: 0, headers: { Purpose: "prefetch" }, timeout: 240_000 }), "purpose=prefetch /en");
  // Unprefixed path → 308 to /de, no cookie either.
  noLocaleCookie(await fresh.get("/kontakt", { maxRedirects: 0, timeout: 240_000 }), "/kontakt");
  await fresh.dispose();
});

test("Browser: nichts gespeichert, bis der Besucher die Sprache wechselt", async ({ page, context }, info) => {
  test.skip(info.project.name !== "desktop", "einmal, Desktop-Sprachumschalter");
  await page.goto("/de/kontakt", { waitUntil: "load" });
  await page.waitForLoadState("networkidle").catch(() => {});
  expect((await context.cookies()).find((c) => c.name === "NEXT_LOCALE"), "kein Cookie nach dem ersten Besuch").toBeUndefined();
  expect(await page.evaluate(() => localStorage.getItem("preferredLocale")), "kein preferredLocale nach dem Rendern").toBeNull();
  // Active switch: header button → English.
  await page.locator('button[aria-controls="ph-language-list"]').click();
  await Promise.all([page.waitForURL(/\/en(\/|$)/), page.locator('#ph-language-list a[hreflang="en"]').click()]);
  const cookie = (await context.cookies()).find((c) => c.name === "NEXT_LOCALE");
  expect(cookie?.value).toBe("en");
  expect(cookie?.sameSite).toBe("Lax");
  expect(await page.evaluate(() => localStorage.getItem("preferredLocale"))).toBe("en");
});
