// tests/e2e/r6-leads-csp.spec.js — R6-leads: CSP probe of the lead forms.
//
// Kontakt, Beratung (4 steps) and Produktanfrage (Merkliste) are filled and
// sent under the site's CSP. Every `securitypolicyviolation` event (enforced
// AND report-only both fire it) and every CSP console message is collected
// from the first byte on (init script); the test expects 0.
//
// Meant for a production build whose next.config.js ENFORCES the policy
// (build copy only, the repo stays Report-Only; see
// Marktresearch/digital/teamleiter/r6-R6-leads.md). The dev server sends no
// CSP header, so the test skips itself there.
//
// SAFETY: blockFormSends() answers every non-GET /api/** request with 503 and
// the three form endpoints are answered by page.route below – NOTHING reaches
// the backoffice, no mail is sent. Google's tag host is aborted.
//
// Run: BASE_URL=http://localhost:3171 npx playwright test tests/e2e/r6-leads-csp.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import { blockFormSends, dismissCookieBanner, settle } from "./helpers.js";
import { UPLOAD_CONFIG } from "../../src/lib/upload/config.js";

// Fix-Runde 1 (F3): the upload card appears only while uploads are accepted.
// UPLOAD_CONFIG.retentionConfirmed=false (Löschfrist not confirmed, r1-recht-
// inhalt P0-4, F4) pauses the upload: the form shows the success message
// without the card. Expectation follows the switch instead of a fixed state.
async function expectUploadCard(page) {
  const card = page.getByRole("heading", { name: "Zeigen Sie uns Ihren Raum" });
  if (UPLOAD_CONFIG.retentionConfirmed) await expect(card).toBeVisible({ timeout: 15_000 });
  else {
    await page.waitForTimeout(1500);
    await expect(card).toHaveCount(0);
  }
}


const CSP_MESSAGE = /Content[- ]Security[- ]Policy|Refused to (load|execute|evaluate|apply|connect|frame)|unsafe-eval/i;

async function open(page, url, cspSeen) {
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener(
      "securitypolicyviolation",
      (e) => window.__csp.push({ directive: e.effectiveDirective || e.violatedDirective, blocked: e.blockedURI, source: e.sourceFile, line: e.lineNumber, disposition: e.disposition, sample: e.sample }),
      true
    );
  });
  page.on("console", (msg) => {
    if (CSP_MESSAGE.test(msg.text())) cspSeen.push(msg.text().slice(0, 400));
  });
  await blockFormSends(page);
  await page.route(/googletagmanager\.com|google-analytics\.com|doubleclick\.net/, (route) => route.abort());
  const res = await page.goto(url);
  await settle(page);
  await dismissCookieBanner(page, 8_000);
  return res;
}

async function answer(page, path) {
  const sent = [];
  await page.route(`**${path}`, (route) => {
    if (route.request().method() !== "POST") return route.continue();
    sent.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, message: "ok", data: {} }) });
  });
  return sent;
}

async function expectNoViolations(page, cspSeen, testInfo, name) {
  // Lazy chunks (upload card) load after the send: give them a moment.
  await page.waitForTimeout(1_500);
  const events = await page.evaluate(() => window.__csp || []);
  await testInfo.attach(`${name}-csp.json`, { body: JSON.stringify({ events, console: cspSeen }, null, 2), contentType: "application/json" });
  expect(events, `${name}: securitypolicyviolation events`).toEqual([]);
  expect(cspSeen, `${name}: CSP console messages`).toEqual([]);
}

function requireCsp(res) {
  const headers = res.headers();
  const enforced = headers["content-security-policy"] || "";
  const reportOnly = headers["content-security-policy-report-only"] || "";
  test.skip(!/script-src/.test(enforced + reportOnly), "no CSP header (dev server) – run against the prod build copy");
  // The probe is only meaningful with the policy enforced (or at least without 'unsafe-eval').
  expect(`${enforced} ${reportOnly}`).not.toContain("'unsafe-eval'");
  return { enforced: /script-src/.test(enforced) };
}

test.describe("R6-leads: lead forms send under the CSP without violations", () => {
  // Control: the listener does see a violation (a script from a foreign host),
  // otherwise the 0 below would prove nothing. The host is never contacted:
  // the policy blocks the request before it starts, and the route aborts it.
  test("control: a foreign script is reported", async ({ page }) => {
    const cspSeen = [];
    const res = await open(page, "/de/kontakt", cspSeen);
    requireCsp(res);
    await page.route("https://csp-probe.invalid/**", (route) => route.abort());
    await page.evaluate(() => {
      const s = document.createElement("script");
      s.src = "https://csp-probe.invalid/x.js";
      document.head.append(s);
    });
    await expect.poll(() => page.evaluate(() => (window.__csp || []).map((e) => e.directive))).toContain("script-src-elem");
  });

  test("Kontakt", async ({ page }, testInfo) => {
    const cspSeen = [];
    const res = await open(page, "/de/kontakt", cspSeen);
    const mode = requireCsp(res);
    testInfo.annotations.push({ type: "csp", description: mode.enforced ? "enforced" : "report-only" });
    const sent = await answer(page, "/api/upload/inquiry/kontakt");
    await page.locator("#kontakt-name").fill("Erika Muster");
    await page.locator("#kontakt-email").fill("erika@example.com");
    await page.locator("#kontakt-nachricht").fill("Ich interessiere mich für ein Sofa.");
    await page.locator("#kontakt-selbstauskunft").selectOption("empfehlung");
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    await expect.poll(() => sent.length).toBe(1);
    await expectUploadCard(page);
    await expectNoViolations(page, cspSeen, testInfo, "kontakt");
  });

  test("Beratung", async ({ page }, testInfo) => {
    const cspSeen = [];
    const res = await open(page, "/de/beratung", cspSeen);
    requireCsp(res);
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
    await page.locator("#beratung-selbstauskunft").selectOption("instagram");
    await page.getByRole("button", { name: "Absenden" }).click();
    await expect.poll(() => sent.length).toBe(1);
    await expectNoViolations(page, cspSeen, testInfo, "beratung");
  });

  test("Produktanfrage (Merkliste)", async ({ page }, testInfo) => {
    const cspSeen = [];
    await page.addInitScript(() => {
      localStorage.setItem("cart", JSON.stringify([{ id: 1, produkte_id: 4711, name: "Testprodukt", category: "Sofas", image: null }]));
    });
    const res = await open(page, "/de/merkliste", cspSeen);
    requireCsp(res);
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
    expect(sent[0].produkte).toEqual([4711]);
    await expectNoViolations(page, cspSeen, testInfo, "produkt");
  });
});
