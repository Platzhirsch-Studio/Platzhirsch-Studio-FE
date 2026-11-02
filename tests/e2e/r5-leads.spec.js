// tests/e2e/r5-leads.spec.js — R5-leads-perf:
//   - optional Selbstauskunft in Kontakt / Beratung / Produktanfrage: goes
//     into the Herkunft block of the free-text field, no new payload field,
//     nothing when no choice is made;
//   - trackLead("kontakt") carries transaction_id = lead_ref;
//   - the upload card (UploadHandoff, now lazily loaded) still appears after
//     a send (the static import graph is checked in tests/unit/r5-leads),
//     while uploads are accepted (Fix-Runde 1: not while they are paused);
//   - axe (WCAG 2.2 AA) on the Kontakt form and on Beratung step 4.
//
// SAFETY: blockFormSends() answers every non-GET /api/** request with 503,
// the form endpoints are answered by page.route below – NOTHING reaches the
// backoffice, no mail is sent. Google's tag host is aborted.
//
// Run: npx playwright test tests/e2e/r5-leads.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
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


const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const TITLE = "── Herkunft (automatisch) ──";

async function answer(page, path) {
  const sent = [];
  await page.route(`**${path}`, (route) => {
    if (route.request().method() !== "POST") return route.continue();
    sent.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, message: "ok", data: {} }) });
  });
  return sent;
}

async function open(page, url) {
  await blockFormSends(page);
  await page.route(/googletagmanager\.com|google-analytics\.com/, (route) => route.abort());
  await page.goto(url);
  await settle(page);
  await dismissCookieBanner(page, 8_000);
}

const leadEvents = (page) =>
  page.evaluate(() =>
    (window.dataLayer || [])
      .map((entry) => Array.from(entry))
      .filter((a) => a[0] === "event" && a[1] === "generate_lead")
      .map((a) => a[2])
  );

async function fillKontakt(page) {
  await page.locator("#kontakt-name").fill("Erika Muster");
  await page.locator("#kontakt-email").fill("erika@example.com");
  await page.locator("#kontakt-nachricht").fill("Ich interessiere mich für ein Sofa.");
}

test.describe("R5-leads: Selbstauskunft, transaction_id, lazy upload card", () => {
  test("Kontakt with Selbstauskunft: line in the block, no new field, transaction_id = lead_ref, card appears", async ({ page }) => {
    await open(page, "/de/kontakt");
    const sent = await answer(page, "/api/upload/inquiry/kontakt");
    await fillKontakt(page);
    const select = page.getByLabel("Wie sind Sie auf uns aufmerksam geworden?");
    await expect(select).toBeVisible();
    await expect(select).toHaveValue("");
    await select.selectOption("empfehlung");
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    await expect.poll(() => sent.length).toBe(1);
    const body = sent[0];
    expect(Object.keys(body).sort()).toEqual(["_t", "company", "email_address", "ihre_nachricht", "lead_ref", "name", "telefon", "website"]);
    expect(body.lead_ref).toMatch(UUID);
    expect(body.ihre_nachricht).toContain(TITLE);
    expect(body.ihre_nachricht).toContain("Selbstauskunft: Empfehlung Freund/Kunde · Sprache: de");
    expect(body.ihre_nachricht).not.toMatch(/Quelle:|Kampagne:|Einstieg:|Referrer:/);
    await expect.poll(async () => (await leadEvents(page)).at(-1)?.transaction_id).toBe(body.lead_ref);
    expect((await leadEvents(page)).at(-1).form).toBe("kontakt");
    // The lazily loaded upload card (e-mail way without a ticket).
    await expectUploadCard(page);
  });

  test("Kontakt without a choice: no Selbstauskunft line", async ({ page }) => {
    await open(page, "/de/kontakt");
    const sent = await answer(page, "/api/upload/inquiry/kontakt");
    await fillKontakt(page);
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    await expect.poll(() => sent.length).toBe(1);
    expect(sent[0].ihre_nachricht).toContain(TITLE);
    expect(sent[0].ihre_nachricht).not.toContain("Selbstauskunft");
  });

  test("Beratung step 4: Selbstauskunft kept in the block", async ({ page }) => {
    await open(page, "/de/beratung");
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
    // Back and forth keeps the choice.
    await page.getByRole("button", { name: "Zurück" }).click();
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.locator("#beratung-selbstauskunft")).toHaveValue("instagram");
    await page.getByRole("button", { name: "Absenden" }).click();
    await expect.poll(() => sent.length).toBe(1);
    expect(sent[0]).not.toHaveProperty("selbstauskunft");
    expect(sent[0].bitte_beschreiben_sie_ihr_vorhaben).toContain("Selbstauskunft: Instagram");
    await expect.poll(async () => (await leadEvents(page)).at(-1)?.transaction_id).toBe(sent[0].lead_ref);
  });

  test("axe: Kontakt form and Beratung step 4 without WCAG 2.2 AA violations", async ({ page }) => {
    await open(page, "/de/kontakt");
    const kontakt = await new AxeBuilder({ page })
      .include("#nachricht")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(kontakt.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);

    await open(page, "/de/beratung");
    await page.locator("#beratung-art-0").check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-ort-0").check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-vorhaben").fill("Wohnzimmer neu einrichten, ca. 30 m².");
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.locator("#beratung-selbstauskunft")).toBeVisible();
    const beratung = await new AxeBuilder({ page })
      .include("form")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(beratung.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
  });
});
