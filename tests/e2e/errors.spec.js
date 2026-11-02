// Error pages: the error-boundary preview /<locale>/preview/fehler (throws on
// purpose, only in dev or with ERROR_PREVIEW=1) and the 404 page.
// - preview: HTTP 500, noindex, the localized H1 receives focus, Navbar and
//   Footer stay, no technical details (stack, message) in the page.
// - unknown URL: HTTP 404, noindex, one H1.
// In a production build without ERROR_PREVIEW=1 the preview is a plain 404;
// the preview tests then skip with a note. Desktop project only.
import { test, expect } from "@playwright/test";
import { getText, robotsDirectives } from "./helpers.js";
import { PROD } from "./prod-mode.js";

// Titles from src/app/[locale]/error.js (TEXT[locale].title).
const ERROR_TITLE = {
  de: "Diese Seite lässt gerade auf sich warten.",
  en: "This page is taking a moment.",
  fr: "Cette page se fait un peu attendre.",
  it: "Questa pagina si fa attendere.",
};

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "nur Desktop");
});

for (const [locale, title] of Object.entries(ERROR_TITLE)) {
  test(`/${locale}/preview/fehler: 500, noindex, H1 fokussiert`, async ({ page, request }) => {
    const res = await getText(request, `/${locale}/preview/fehler`);
    test.skip(res.status === 404, "Fehler-Vorschau aus (Produktions-Build ohne ERROR_PREVIEW=1)");
    expect(res.status, "HTTP-Status").toBe(500);
    expect(robotsDirectives(res), "noindex").toContain("noindex");
    await page.goto(`/${locale}/preview/fehler`, { waitUntil: "load" });
    // Visible text only: the dev server ships the message in its overlay payload by design.
    await expect(page.locator("main"), "keine technische Fehlermeldung sichtbar").not.toContainText("absichtlicher Fehler");
    const h1 = page.locator("main h1");
    await expect(h1, "genau eine H1 im Hauptbereich").toHaveCount(1);
    await expect(h1).toHaveText(title);
    // error.js moves focus to the heading so screen readers announce the state.
    await expect(h1, "Fokus auf der H1").toBeFocused();
    await expect(page.locator("header").first(), "Navbar bleibt").toBeVisible();
    await expect(page.locator("footer").first(), "Footer bleibt").toBeAttached();
    // A way out: home link and a retry button.
    await expect(page.locator(`main a[href="/${locale}"]`).first()).toBeVisible();
  });
}

test("unbekannte URL: 404, noindex, eine H1", async ({ page, request }) => {
  const path = "/de/diese-seite-gibt-es-nicht-r2";
  const res = await getText(request, path);
  expect(res.status).toBe(404);
  expect(robotsDirectives(res)).toContain("noindex");
  // not-found.js is a client component: count the H1 in the rendered page.
  const nav = await page.goto(path, { waitUntil: "load" });
  expect(nav.status()).toBe(404);
  await expect(page.locator("main h1"), "genau eine H1").toHaveCount(1);
});

// R4-release: the global 404 (URLs outside /{locale}/…) renders without
// cookies()/headers() – German, with links to the other languages – so the
// site can be prerendered. Status stays 404.
test("globale 404 (/wp-login.php): 404, Deutsch, eine H1, Links zu EN/FR/IT", async ({ page }) => {
  // Endtest 29.10.2026: Der Dev-Server (Next 16.4.1) liefert für notFound() die Hülle <html id="__next_error__"> ohne lang/h1 und rendert die 404 erst im Client; die vorgerenderte 404 gibt es nur im Produktions-Build (dort grün, PW_PROD=1 BASE_URL=…).
  test.skip(!PROD, "vorgerenderte 404 nur im Produktions-Build");
  const nav = await page.goto("/wp-login.php", { waitUntil: "load" });
  expect(nav.status(), "HTTP-Status").toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.locator("main h1"), "genau eine H1").toHaveCount(1);
  for (const locale of ["en", "fr", "it"]) {
    await expect(page.locator(`header a[href="/${locale}"][hreflang="${locale}"]`), `Link /${locale}`).toBeVisible();
  }
});

// R4-release (next.config.js): X-XSS-Protection is gone everywhere; the CSP
// runs as report-only in production (absent on the dev server on purpose).
test("Sicherheits-Header: kein X-XSS-Protection, CSP nur report-only (Produktion)", async ({ request, baseURL }) => {
  const res = await request.get("/de");
  const h = res.headers();
  expect(h["x-xss-protection"], "X-XSS-Protection entfernt").toBeUndefined();
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["content-security-policy"], "keine erzwungene CSP auf Seiten").toBeUndefined();
  test.skip(!/:3100\b/.test(baseURL || ""), "CSP report-only nur im Produktions-Build");
  const csp = h["content-security-policy-report-only"] || "";
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("https://www.googletagmanager.com");
  expect(csp, "keine Nonces (statische Auslieferung)").not.toMatch(/nonce-/);
});
