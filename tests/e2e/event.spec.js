// Event and service pages: /de/adventsabend and /de/bewerten.
// - 200 on /de, 404 on /en, /fr, /it; noindex.
// - Adventsabend: registration form present; no schema.org Event without a start
//   time (Google would show a wrong time); an empty submit is caught client-side.
// - Bewerten: the Google review link and the direct feedback path (mail, Kontakt)
//   are present; the page has no rating gate (no form before the link).
// No form is ever sent: every non-GET /api/** request is blocked (blockFormSends).
// Desktop project only.
import { test, expect } from "@playwright/test";
import { blockFormSends, getText, jsonLdNodes, robotsDirectives, settle } from "./helpers.js";

const types = (n) => [].concat(n["@type"] || []);

// Runde 2 (recht P2-6): without a confirmed start time the production build
// answers 404 for /de/adventsabend (eventPublic() in event.js). A 404 is only
// correct while EVENT.startTime is still null.
import fs from "node:fs";
import path from "node:path";
const eventWithoutTime = () =>
  /startTime: null/.test(fs.readFileSync(path.join(process.cwd(), "src/app/[locale]/adventsabend/event.js"), "utf8"));

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "nur Desktop");
});

for (const path of ["/de/adventsabend", "/de/bewerten"]) {
  test(`${path}: 200, noindex, andere Sprachen 404`, async ({ request }) => {
    const res = await getText(request, path);
    if (path === "/de/adventsabend" && res.status === 404) {
      expect(eventWithoutTime(), "404 nur ohne Uhrzeit (Produktion)").toBe(true);
      return;
    }
    expect(res.status).toBe(200);
    expect(robotsDirectives(res), "noindex").toContain("noindex");
    expect((res.text.match(/<h1[\s>]/gi) || []).length, "genau eine H1").toBe(1);
    // E.21 (P6 Runde 2, deOnlyRedirects): EN/FR/IT may 308 to the German page.
    for (const l of ["en", "fr", "it"]) {
      const other = path.replace(/^\/de\//, `/${l}/`);
      const r = await request.get(other, { timeout: 120_000, maxRedirects: 0 });
      expect([404, 308], `${other} → 404/308`).toContain(r.status());
      if (r.status() === 308) expect(r.headers().location, other).toContain(path);
    }
  });
}

test.describe("Adventsabend", () => {
  test("kein Event-Schema ohne Uhrzeit", async ({ request }) => {
    const res = await getText(request, "/de/adventsabend");
    if (res.status === 404) return expect(eventWithoutTime()).toBe(true);
    expect(res.status).toBe(200);
    const events = jsonLdNodes(res.text).filter((n) => types(n).some((t) => /Event$/.test(t)));
    const robots = robotsDirectives(res);
    for (const ev of events) {
      expect(String(ev.startDate || ""), "Event.startDate mit Uhrzeit (…THH:MM)").toMatch(/T\d{2}:\d{2}/);
    }
    // Without an Event schema the page must stay out of the index (and vice versa:
    // seo.spec.js checks that a noindex page is not in a sitemap).
    if (!events.length) expect(robots).toContain("noindex");
  });

  test("Anmeldeformular vorhanden, leeres Absenden sendet nichts", async ({ page }, testInfo) => {
    const blocked = await blockFormSends(page);
    const res = await page.goto("/de/adventsabend", { waitUntil: "load" });
    if (res.status() === 404) return expect(eventWithoutTime()).toBe(true);
    expect(res.status()).toBe(200);
    await settle(page);

    const form = page.locator("form").filter({ has: page.locator('input[name="email"]') });
    await expect(form, "Formular mit E-Mail-Feld").toHaveCount(1);
    for (const name of ["name", "email", "personen"]) {
      await expect(form.locator(`[name="${name}"]`), `Feld ${name}`).toHaveCount(1);
    }
    // Every visible field has an accessible name.
    const unnamed = await form.locator("input:visible, select:visible, textarea:visible").evaluateAll((els) =>
      els
        .filter((el) => !(el.labels && el.labels.length) && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby"))
        .map((el) => el.getAttribute("name") || el.tagName)
    );
    expect(unnamed, "Felder ohne Label").toEqual([]);

    const submit = form.locator('[type="submit"]');
    await expect(submit).toHaveCount(1);
    await submit.click();
    // Client-side validation: an error is announced and nothing leaves the browser.
    await expect(form.locator('[aria-invalid="true"]').first(), "Pflichtfelder als ungültig markiert").toBeVisible();
    if (blocked.length) testInfo.annotations.push({ type: "abgefangen", description: blocked.join("\n") });
    expect(blocked, "leeres Formular darf keinen Request auslösen").toEqual([]);
  });
});

test.describe("Bewerten", () => {
  test("Google-Link und direkter Rückmeldeweg vorhanden, kein Bewertungs-Filter", async ({ page }) => {
    const blocked = await blockFormSends(page);
    const res = await page.goto("/de/bewerten", { waitUntil: "load" });
    expect(res.status()).toBe(200);
    await settle(page);

    const google = page.locator('main a[href*="google."]').filter({ hasText: "Auf Google bewerten" });
    await expect(google.first(), "Link zu Google-Bewertungen").toBeVisible();
    await expect(page.locator('main a[href^="mailto:"]').first(), "E-Mail-Weg").toBeVisible();
    await expect(page.locator('main a[href$="/kontakt"]').first(), "Kontaktseite").toBeVisible();
    // No review gating: no form or star rating in front of the Google link.
    await expect(page.locator("main form"), "kein Formular vor dem Google-Link").toHaveCount(0);
    expect(blocked).toEqual([]);
  });
});
