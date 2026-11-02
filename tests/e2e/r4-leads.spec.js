// tests/e2e/r4-leads.spec.js — R4-leads (Masterplan AP3 Nr. 2, 4, 8):
// Herkunft block + lead_ref in the body of all four lead forms, consent
// boundary of localStorage "ph_attr", trackLead transaction_id = lead_ref,
// Merkliste → "Diese Auswahl im Showroom ansehen", booking switch off.
//
// SAFETY: blockFormSends() answers every non-GET /api/** request with 503,
// the form endpoints are answered by page.route below – NOTHING reaches the
// backoffice, no mail is sent. Google's tag host is aborted as well, so
// "Alle akzeptieren" loads no third-party script.
//
// Run: npx playwright test tests/e2e/r4-leads.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import { blockFormSends, dismissCookieBanner, settle } from "./helpers.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const TITLE = "── Herkunft (automatisch) ──";
const UTM = "?utm_source=test&utm_medium=cpc&utm_campaign=r4-check&gclid=TESTGCLID";

/** Answers `path` with success and records the JSON bodies sent. */
async function answer(page, path, body = { success: true, message: "ok", data: {} }) {
  const sent = [];
  await page.route(`**${path}`, (route) => {
    if (route.request().method() !== "POST") return route.continue();
    sent.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  return sent;
}

/** Third-party hosts the page contacted (anything not localhost). */
function watchThirdParty(page) {
  const hosts = new Set();
  page.on("request", (req) => {
    const { hostname } = new URL(req.url());
    if (hostname !== "localhost" && hostname !== "127.0.0.1") hosts.add(hostname);
  });
  return hosts;
}

async function open(page, url, { consent = "reject" } = {}) {
  await blockFormSends(page);
  await page.route(/googletagmanager\.com|google-analytics\.com/, (route) => route.abort());
  await page.goto(url);
  await settle(page);
  if (consent === "reject") await dismissCookieBanner(page, 8_000);
  if (consent === "accept") {
    const region = page.getByRole("region", { name: "Cookie-Einstellungen" });
    await region.waitFor({ state: "visible", timeout: 8_000 });
    await region.getByRole("button", { name: "Alle akzeptieren" }).click();
    await region.waitFor({ state: "hidden" });
  }
}

const phAttr = (page) => page.evaluate(() => localStorage.getItem("ph_attr"));
const leadEvents = (page) =>
  page.evaluate(() =>
    (window.dataLayer || [])
      .map((entry) => Array.from(entry))
      .filter((a) => a[0] === "event" && a[1] === "generate_lead")
      .map((a) => a[2])
  );

// Without Ads consent only the channel goes along (Rechtspaket 02 Z. 130 / C13):
// no utm values, campaign, referrer host or landing page.
function expectHerkunft(text, { channel = "Paid", consent = false } = {}) {
  expect(text).toContain(TITLE);
  expect(text).toContain(`Kanal: ${channel}`);
  if (!consent) expect(text).not.toMatch(/Quelle:|Kampagne:|Einstieg:|Referrer:|r4-check/);
  expect(text).toMatch(/Sprache: de/);
  expect(text).toMatch(/Referenz: [0-9a-f-]{36}/);
}

test.describe("Herkunft and lead_ref in all four forms (no consent)", () => {
  test("Kontakt: block + lead_ref, no click id, no ph_attr, transaction_id = lead_ref", async ({ page }) => {
    await open(page, `/de/kontakt${UTM}`);
    const sent = await answer(page, "/api/upload/inquiry/kontakt");
    await page.locator("#kontakt-name").fill("Erika Muster");
    await page.locator("#kontakt-email").fill("erika@example.com");
    await page.locator("#kontakt-nachricht").fill("Ich interessiere mich für ein Sofa.");
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    await expect.poll(() => sent.length).toBe(1);
    const body = sent[0];
    expect(body.lead_ref).toMatch(UUID);
    expect(body.ihre_nachricht.startsWith("Ich interessiere mich für ein Sofa.\n\n")).toBe(true);
    expectHerkunft(body.ihre_nachricht);
    expect(body.ihre_nachricht).not.toContain("utm_");
    expect(body.ihre_nachricht).toContain(`Referenz: ${body.lead_ref}`);
    expect(body.ihre_nachricht).not.toContain("TESTGCLID");
    expect(body.ihre_nachricht).not.toContain("Klick-ID");
    expect(await phAttr(page)).toBeNull();
    // generate_lead is queued (Consent Mode denied: nothing leaves the page) with the reference.
    await expect.poll(async () => (await leadEvents(page)).at(-1)?.transaction_id).toBe(body.lead_ref);
    expect((await leadEvents(page)).at(-1).form).toBe("kontakt");
  });

  test("Beratung: block in bitte_beschreiben_sie_ihr_vorhaben + lead_ref", async ({ page }) => {
    await open(page, `/de/beratung${UTM}`);
    const sent = await answer(page, "/api/upload/inquiry/beratung");
    await page.locator("#beratung-art-0").check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-ort-0").check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-vorhaben").fill("Wohnzimmer neu einrichten, ca. 30 m².");
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-vorname").fill("Erika");
    await page.locator("#beratung-nachname").fill("Muster");
    await page.locator("#beratung-email").fill("erika@example.com");
    await page.locator("#beratung-telefon").fill("+43 664 1234567");
    await page.getByRole("button", { name: "Absenden" }).click();
    await expect.poll(() => sent.length).toBe(1);
    expect(sent[0].lead_ref).toMatch(UUID);
    expectHerkunft(sent[0].bitte_beschreiben_sie_ihr_vorhaben);
    expect(await phAttr(page)).toBeNull();
  });

  test("Produktanfrage: block in anfrage_beschreibung + lead_ref; Merkliste offers the showroom", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("cart", JSON.stringify([{ id: 1, produkte_id: 4711, name: "Testprodukt", category: "Sofas", image: null }]));
    });
    await open(page, `/de/merkliste${UTM}`);
    const showroom = page.getByRole("link", { name: "Diese Auswahl im Showroom ansehen" });
    await expect(showroom).toBeVisible();
    await expect(showroom).toHaveAttribute("href", /\/de\/beratung\?produkt=Sofas(%20|\+)Testprodukt$/);
    const sent = await answer(page, "/api/upload/inquiry/produkt");
    await page.getByRole("button", { name: /Anfrage|senden/i }).first().click();
    await page.locator("#anfrage-userType-0").check();
    await page.locator("#anfrage-firstName").fill("Erika");
    await page.locator("#anfrage-lastName").fill("Muster");
    await page.locator("#anfrage-email").fill("erika@example.com");
    await page.locator("#anfrage-phone").fill("066412345");
    await page.locator("#anfrage-address").fill("Hauptstraße 1");
    await page.locator("#anfrage-city").fill("Lochau");
    await page.locator("#anfrage-country").fill("Österreich");
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    await expect.poll(() => sent.length).toBe(1);
    expect(sent[0].lead_ref).toMatch(UUID);
    expect(sent[0].produkte).toEqual([4711]);
    expectHerkunft(sent[0].anfrage_beschreibung);
    expect(await phAttr(page)).toBeNull();
  });

  test("Showroom link pre-fills the consultation form", async ({ page }) => {
    await open(page, "/de/beratung?produkt=Sofas%20Testprodukt");
    await page.locator("#beratung-art-0").check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-ort-0").check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.locator("#beratung-vorhaben")).toHaveValue(/Anfrage zu: Sofas Testprodukt/);
  });

  test("Adventsabend: block in ihre_nachricht (via /api/kontakt) + lead_ref", async ({ page }) => {
    await open(page, `/de/adventsabend?utm_source=newsletter&utm_medium=email`);
    const sent = await answer(page, "/api/kontakt");
    await page.locator("#aa-name").fill("Erika Muster");
    await page.locator("#aa-email").fill("erika@example.com");
    await page.getByRole("button", { name: "Platz reservieren" }).click();
    await expect.poll(() => sent.length).toBe(1);
    expect(sent[0].lead_ref).toMatch(UUID);
    expect(sent[0].ihre_nachricht).toMatch(/^\[Anmeldung Adventsabend/);
    expectHerkunft(sent[0].ihre_nachricht, { channel: "Newsletter" });
  });
});

test.describe("consent boundary", () => {
  // r7-p1 (recht P1-4): without an Ads ID "Alle akzeptieren" no longer grants
  // Ads (no consent for a service that is not used). The Ads path is tested
  // with a stored Ads consent, as it exists once an Ads ID is configured.
  test("with Ads consent: ph_attr (first/last touch, click id), block carries the click id", async ({ page, context, baseURL }) => {
    const keys = ["essential", "functional", "statistics", "marketing", "googleMaps", "googleTagManager", "googleAnalytics", "googleAds", "einblicke"];
    const value = Object.fromEntries(keys.map((k) => [k, ["essential", "marketing", "googleAds"].includes(k)]));
    await context.addCookies([{ name: "cookieConsent", value: encodeURIComponent(JSON.stringify(value)), url: baseURL }]);
    await open(page, `/de/kontakt${UTM}`, { consent: "stored" });
    const stored = JSON.parse(await phAttr(page));
    expect(stored.v).toBe(1);
    expect(stored.first.click).toEqual({ gclid: "TESTGCLID" });
    expect(stored.last.utm_medium).toBe("cpc");
    expect(stored.exp).toBeGreaterThan(Date.now() + 89 * 24 * 3600 * 1000);
    const sent = await answer(page, "/api/upload/inquiry/kontakt");
    await page.locator("#kontakt-name").fill("Erika Muster");
    await page.locator("#kontakt-email").fill("erika@example.com");
    await page.locator("#kontakt-nachricht").fill("Ich interessiere mich für ein Sofa.");
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    await expect.poll(() => sent.length).toBe(1);
    expectHerkunft(sent[0].ihre_nachricht, { channel: "Google Ads", consent: true });
    expect(sent[0].ihre_nachricht).toContain("Quelle: test / cpc · Kampagne: r4-check");
    expect(sent[0].ihre_nachricht).toContain("Einstieg: /de/kontakt");
    expect(sent[0].ihre_nachricht).toContain("Klick-ID: gclid=TESTGCLID");
  });

  test("without consent there is no ph_attr on any page of the visit", async ({ page }) => {
    await open(page, `/de/produkte/lamps/lamps-2097-18${UTM}`);
    expect(await phAttr(page)).toBeNull();
    await page.goto("/de/kontakt");
    await settle(page);
    expect(await phAttr(page)).toBeNull();
    expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => /attr|utm|gclid/i.test(k)))).toEqual([]);
  });
});

test.describe("booking switch", () => {
  test("default BOOKING_PROVIDER=none: no booking section, no calendar request", async ({ page }) => {
    const hosts = watchThirdParty(page);
    await open(page, "/de/beratung");
    await expect(page.locator("#termin-online")).toHaveCount(0);
    // Online-Kalender (Inhaber Nr. 12, bewusst geändert): Ist der eigene Kalender nutzbar
    // (terminMode "mock" im Dev, "frappe" live), verlinkt /beratung oben auf /termin –
    // data-booking-provider="own", kein Drittanbieter. Ein externer Anbieter (link) bleibt aus.
    await expect(page.locator('[data-booking-provider]:not([data-booking-provider="own"])')).toHaveCount(0);
    expect([...hosts].filter((h) => /cal\.com|calendar|bookings|outlook|zcal|calendly/i.test(h))).toEqual([]);
    expect(await page.locator('a[href*="wa.me"], a[href*="whatsapp.com"]').count()).toBe(0);
  });
});
