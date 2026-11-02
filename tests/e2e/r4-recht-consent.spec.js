// R4-recht-consent: network proof of the Google tag loading rules, axe with
// the consent bar open, ReviewNotice on /bewerten, services appendix of the
// privacy-policy preview.
//   npx playwright test tests/e2e/r4-recht-consent.spec.js --project=desktop
//
// Nothing reaches Google: every request to a Google host is recorded and
// answered locally (gtag.js = empty stub, everything else = 204), so no hit
// lands in the real GA4 property. The recorded list is the proof.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { settle } from "./helpers.js";

const GA4 = "G-1YCM6K57YG";
// Accessible name of the bar: "Cookie-Einstellungen" (de), "Cookie settings" (en).
const REGION = { name: /^Cookie[- ](Einstellungen|settings)$/i };
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const GOOGLE_HOST =
  /(^|\.)(google\.[a-z.]+|googletagmanager\.com|google-analytics\.com|googleadservices\.com|googlesyndication\.com|doubleclick\.net|gstatic\.com|googleapis\.com|youtube\.com|ytimg\.com)$/i;
const COOKIE_KEYS = ["essential", "functional", "statistics", "marketing", "googleMaps", "googleTagManager", "googleAnalytics", "googleAds", "einblicke"];

/** Records and stubs every Google request of this context. */
async function interceptGoogle(context) {
  const hits = [];
  await context.route(
    (url) => GOOGLE_HOST.test(url.hostname),
    (route) => {
      const url = route.request().url();
      hits.push(url);
      if (/\/gtag\/js/.test(url)) return route.fulfill({ status: 200, contentType: "text/javascript", body: "/* stub gtag.js (test) */" });
      return route.fulfill({ status: 204, body: "" });
    }
  );
  return hits;
}

const consentCookie = (baseURL, values) => ({
  name: "cookieConsent",
  value: encodeURIComponent(
    JSON.stringify(Object.fromEntries(COOKIE_KEYS.map((k) => [k, k === "essential" ? true : Boolean(values[k])])))
  ),
  url: baseURL,
});

/** gtag() calls queued in the dataLayer, as plain arrays. */
const gtagCalls = (page) =>
  page.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a).map((x) => (x instanceof Date ? "Date" : x))));

async function scrollThrough(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 800) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
  });
}

async function severeAxe(page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => ({ rule: v.id, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }));
}

test.describe("Google-Tag: Laden nur mit Einwilligung (Netzwerk)", () => {
  test("vor der Einwilligung und nach „Weiter ohne Einwilligung“: 0 Requests zu Google", async ({ page, context }) => {
    test.setTimeout(400_000); // the dev server compiles each page on first hit
    const hits = await interceptGoogle(context);
    // Start page, contact page (Maps placeholder), showroom page (Street View placeholder).
    for (const path of ["/de", "/de/kontakt", "/de/ueber-uns/platzhirsch"]) {
      await page.goto(path, { waitUntil: "load" });
      await settle(page);
      await expect(page.getByRole("region", REGION)).toBeVisible();
      await scrollThrough(page);
      await page.waitForTimeout(1500);
    }
    expect(hits, "Requests zu Google vor jeder Wahl").toEqual([]);
    expect(await page.evaluate(() => typeof window.gtag)).toBe("undefined");

    await page.getByRole("region", REGION).getByRole("button", { name: "Weiter ohne Einwilligung" }).click();
    await expect(page.getByRole("region", REGION)).toHaveCount(0);
    await page.goto("/de", { waitUntil: "load" });
    await settle(page);
    await page.waitForTimeout(1500);
    expect(hits, "Requests zu Google nach Ablehnung").toEqual([]);
    const cookie = (await context.cookies()).find((c) => c.name === "cookieConsent");
    expect(Object.keys(JSON.parse(decodeURIComponent(cookie.value))), "Cookie-Format unverändert").toEqual(COOKIE_KEYS);
  });

  // r7-p1 (recht P1-4): the dialog lists only services in use. Without an Ads
  // ID there is no "Marketing" category (the privacy policy: Google Ads is not
  // used) and no own "Google Tag Manager" switch. Before, this test checked
  // "#marketing-cookies"; the expectation changed on purpose: no consent can
  // be given for a processing that does not exist (Art. 4 Z 11, Art. 7 DSGVO).
  test("Dialog nur mit eingesetzten Diensten: ohne Ads-Kennung kein Marketing, kein GTM-Schalter; „Alle akzeptieren“ gibt kein Ads-Okay", async ({ page, context }) => {
    const hits = await interceptGoogle(context);
    await page.goto("/de", { waitUntil: "load" });
    await settle(page);
    await page.getByRole("region", REGION).getByRole("button", { name: "Individuelle Einstellungen" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("#marketing-cookies")).toHaveCount(0);
    await expect(dialog.locator("#functional-cookies")).toHaveCount(1);
    await expect(dialog.locator("#statistics-cookies")).toHaveCount(1);
    await expect(dialog.getByText("Funktional (1)")).toBeVisible();
    const text = await dialog.innerText();
    for (const bad of [/unsicheren Drittländern/, /Art\. 49/, /hübschere Schriftarten/, /Web-2\.0/, /Teilnehmenden Partnern/, /über mehrere Websites/]) {
      expect(text, String(bad)).not.toMatch(bad);
    }
    expect(text).toMatch(/Data Privacy Framework/);
    expect(hits, "vor dem Speichern nichts").toEqual([]);
    await dialog.getByRole("button", { name: "Alle akzeptieren" }).click();
    await page.waitForTimeout(1500);
    const cookie = (await context.cookies()).find((c) => c.name === "cookieConsent");
    const saved = JSON.parse(decodeURIComponent(cookie.value));
    expect(Object.keys(saved), "Cookie-Format unverändert").toEqual(COOKIE_KEYS);
    expect(saved).toMatchObject({ marketing: false, googleAds: false, statistics: true, googleAnalytics: true, functional: true, googleMaps: true });
  });

  test("Consent-Leiste: Zwecke und Dienste im Hausstil, keine Plugin-Floskel", async ({ page }) => {
    await page.goto("/de", { waitUntil: "load" });
    await settle(page);
    const bar = page.getByRole("region", REGION);
    await expect(bar).toBeVisible();
    const text = await bar.innerText();
    expect(text).not.toMatch(/gutes Nutzererlebnis/);
    expect(text).toMatch(/Google Maps/);
    expect(text).toMatch(/Google Analytics/);
  });

  test("gespeicherte Wahl beim nächsten Besuch: nur Ads ohne Kennung lädt nichts, nur Statistik mit GA4", async ({ page, context, baseURL }) => {
    const hits = await interceptGoogle(context);
    await context.addCookies([consentCookie(baseURL, { marketing: true, googleAds: true })]);
    await page.goto("/de", { waitUntil: "load" });
    await settle(page);
    await page.waitForTimeout(2500);
    let configs = (await gtagCalls(page)).filter((c) => c[0] === "config").map((c) => c[1]);
    expect(configs, "nur Ads ohne Kennung: keine config").toEqual([]);
    expect(hits, "nur Ads ohne Kennung: kein Request an Google").toEqual([]);
    await expect(page.getByRole("region", REGION)).toHaveCount(0);

    await context.clearCookies();
    await context.addCookies([consentCookie(baseURL, { statistics: true, googleAnalytics: true })]);
    hits.length = 0;
    await page.goto("/de", { waitUntil: "load" });
    await expect.poll(() => hits.filter((u) => /gtag\/js/.test(u)).length, { timeout: 60_000 }).toBe(1);
    await page.waitForTimeout(800);
    configs = (await gtagCalls(page)).filter((c) => c[0] === "config").map((c) => c[1]);
    expect(configs, "Statistik → GA4-config").toContain(GA4);
    expect(configs.filter((id) => /^AW-/.test(id)), "keine Ads-config ohne Ads").toEqual([]);
    expect(hits.length).toBeGreaterThan(0);
  });

  test("nur Funktional (Karte): Karte lädt, kein gtag.js", async ({ page, context, baseURL }) => {
    const hits = await interceptGoogle(context);
    await context.addCookies([consentCookie(baseURL, { functional: true, googleMaps: true, googleTagManager: true })]);
    await page.goto("/de/kontakt", { waitUntil: "load" });
    await settle(page);
    await page.locator("iframe").first().scrollIntoViewIfNeeded();
    await expect.poll(() => hits.filter((u) => /google\.[a-z.]+\/maps/.test(u)).length, { timeout: 30_000 }).toBeGreaterThan(0);
    await page.waitForTimeout(1500);
    expect(hits.filter((u) => /googletagmanager|google-analytics/.test(u))).toEqual([]);
  });
});

test.describe("A11y und Inhalte", () => {
  for (const path of ["/de", "/de/bewerten", "/en"]) {
    test(`axe mit offener Consent-Leiste: ${path}`, async ({ page, context }) => {
      await interceptGoogle(context);
      await page.goto(path, { waitUntil: "load" });
      await settle(page);
      await expect(page.getByRole("region", REGION)).toBeVisible();
      expect(await severeAxe(page)).toEqual([]);
    });
  }

  test("/de/bewerten zeigt den Bewertungshinweis, am Knopf beschrieben", async ({ page }) => {
    await page.goto("/de/bewerten", { waitUntil: "load" });
    const notice = page.locator("[data-review-notice]");
    await expect(notice).toHaveText(/Google prüft nicht, ob ein Kauf stattfand\./);
    const describedBy = await page.getByRole("link", { name: /Auf Google bewerten/ }).getAttribute("aria-describedby");
    expect(describedBy.split(" ")).toContain(await notice.getAttribute("id"));
  });

  test("DSE-Vorschau: Anhang „Eingesetzte Dienste“ mit allen Banner-Diensten", async ({ page }) => {
    const res = await page.goto("/de/preview/recht/datenschutz#dienste", { waitUntil: "load" });
    test.skip(res.status() === 404, "Vorschau ist aus (Produktion ohne LEGAL_PREVIEW)");
    const section = page.locator("section#dienste");
    await expect(section.getByRole("heading", { name: /Eingesetzte Dienste/ })).toBeVisible();
    for (const name of ["Google Analytics 4", "Google Maps", "Google Ads", "Google-Tag-Bibliothek", "KI-Concierge", "Backoffice (Frappe)"]) {
      await expect(section.getByRole("heading", { name: new RegExp(name.replace(/[()]/g, "\\$&")) }).first()).toBeVisible();
    }
    expect(await severeAxe(page)).toEqual([]);
  });
});
