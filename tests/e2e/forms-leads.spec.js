// tests/e2e/forms-leads.spec.js — R2-leads: lead forms in the Neuauftritt.
// Contract in the browser (website + _t), translated error codes, errors at
// the field, focus on the first bad field, polite live region, privacy note,
// 375 px without overflow, keyboard path through the Beratung steps.
//
// SAFETY: every POST to /api/** is intercepted (blockFormSends) and the form
// endpoints are answered by page.route — nothing reaches the backoffice.
// The only live requests are schema-INVALID ones (400 before any forwarding).
//
// Run: npx playwright test tests/e2e/forms-leads.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import { blockFormSends, dismissCookieBanner, measureOverflow, settle } from "./helpers.js";
import { ADVENTSABEND_ON } from "./prod-mode.js";

const OK = { success: true, message: "Contact form submitted successfully", data: {} };
const ENGLISH = /Invalid form data|Too many requests|Failed to submit|Payload too large/;

/** Answers `path` with `status`/`body` and records the JSON bodies sent. */
async function answer(page, path, status, body) {
  const sent = [];
  await page.route(`**${path}`, (route) => {
    if (route.request().method() !== "POST") return route.continue();
    sent.push(route.request().postDataJSON());
    return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  return sent;
}

async function open(page, url) {
  await blockFormSends(page);
  await page.goto(url);
  await settle(page);
  await dismissCookieBanner(page, 8_000);
}

test.describe("Kontakt", () => {
  test("empty submit: errors at the fields, focus on the first, polite summary", async ({ page }) => {
    await open(page, "/de/kontakt");
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    const name = page.locator("#kontakt-name");
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toHaveAttribute("aria-describedby", /kontakt-name-error/);
    await expect(page.locator("#kontakt-name-error")).toBeVisible();
    await expect(page.locator("#kontakt-email")).toHaveAttribute("aria-invalid", "true");
    const region = page.locator('form [role="status"][aria-live="polite"]').first();
    await expect(region).toContainText("Bitte prüfen Sie 3 Felder");
    // Summary link jumps to the field.
    await region.getByRole("link").nth(1).click();
    await expect(page.locator("#kontakt-email")).toBeFocused();
  });

  test("sends website + _t, shows the translated code instead of `error`", async ({ page }) => {
    await open(page, "/de/kontakt");
    const sent = await answer(page, "/api/upload/inquiry/kontakt", 429, { success: false, code: "rate_limited", error: "Too many requests. Please try again later." });
    await page.locator("#kontakt-name").fill("Erika Muster");
    await page.locator("#kontakt-email").fill("erika@example.com");
    await page.locator("#kontakt-nachricht").fill("Ich interessiere mich für ein Sofa.");
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    await expect(page.getByText("Sie haben in kurzer Zeit mehrere Anfragen gesendet", { exact: false })).toBeVisible();
    await expect(page.locator("main")).not.toContainText(ENGLISH);
    expect(sent).toHaveLength(1);
    const body = sent[0];
    expect(body).toMatchObject({ name: "Erika Muster", company: "", email_address: "erika@example.com", telefon: "", website: "" });
    expect(typeof body._t).toBe("number");
    expect(body._t).toBeGreaterThan(0);
    expect(body._t).toBeLessThan(1e11); // duration, not a clock timestamp
  });

  test("server 400 with field → error at that field", async ({ page }) => {
    await open(page, "/de/kontakt");
    const sent = await answer(page, "/api/upload/inquiry/kontakt", 400, { success: false, code: "invalid", error: "Invalid email format", field: "email_address" });
    await page.locator("#kontakt-name").fill("Erika Muster");
    await page.locator("#kontakt-email").fill("erika@example.com");
    await page.locator("#kontakt-nachricht").fill("Ich interessiere mich für ein Sofa.");
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    await expect(page.locator("#kontakt-email")).toBeFocused();
    await expect(page.locator("#kontakt-email")).toHaveAttribute("aria-invalid", "true");
    // P3-1: field-specific text (not "Bitte füllen …" at a filled field), kept on blur
    // while the value is unchanged, so the next click on "Senden" is not lost.
    const error = page.locator("#kontakt-email-error");
    await expect(error).not.toContainText("füllen Sie dieses Feld aus");
    await page.locator("#kontakt-nachricht").focus();
    await expect(error).toBeVisible();
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    await expect.poll(() => sent.length).toBe(2);
  });

  test("no data in the URL before hydration: method=post, submit disabled in server HTML", async ({ request }) => {
    // P2-1: a native submit before React hydrates must never become a GET with
    // name/e-mail/message in the query string.
    // R3 (P4-technik): /de/adventsabend ist im Produktions-Build ohne Uhrzeit absichtlich
    // 404 (eventPublic(), tests/e2e/prod-mode.js). Dann gibt es dort kein Formular zu prüfen.
    for (const url of ["/de/kontakt", "/de/beratung", ...(ADVENTSABEND_ON ? ["/de/adventsabend"] : [])]) {
      const html = await (await request.get(url)).text();
      const forms = html.match(/<form\s[^>]*>/g) || [];
      const lead = forms.filter((f) => !/role="search"/.test(f));
      expect(lead.length, url).toBeGreaterThan(0);
      for (const f of lead) expect(f, url).toMatch(/method="post"/i);
      expect(html, url).toMatch(/<button[^>]*type="submit"[^>]*disabled=""|<button[^>]*disabled=""[^>]*type="submit"/);
    }
    // P2-2: no own deletion promise on the Adventsabend page (only the privacy note).
    if (!ADVENTSABEND_ON) return;
    const aa = await (await request.get("/de/adventsabend")).text();
    expect(aa).not.toContain("löschen sie spätestens");
  });

  test("success: confirmation gets focus; English page shows English codes", async ({ page }) => {
    await open(page, "/de/kontakt");
    await answer(page, "/api/upload/inquiry/kontakt", 200, OK);
    await page.locator("#kontakt-name").fill("Erika Muster");
    await page.locator("#kontakt-email").fill("erika@example.com");
    await page.locator("#kontakt-nachricht").fill("Ich interessiere mich für ein Sofa.");
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    await expect(page.locator('[role="status"][tabindex="-1"]').first()).toBeFocused();

    const en = await page.context().newPage();
    await open(en, "/en/contact");
    await answer(en, "/api/upload/inquiry/kontakt", 502, { success: false, code: "upstream", error: "Failed to submit contact form" });
    await en.locator("#kontakt-name").fill("Erika Muster");
    await en.locator("#kontakt-email").fill("erika@example.com");
    await en.locator("#kontakt-nachricht").fill("I am interested in a sofa.");
    await en.locator("form:has(#kontakt-name) button[type=\"submit\"]").click();
    await expect(en.getByText("could not be sent just now", { exact: false })).toBeVisible();
    await expect(en.locator("form:has(#kontakt-name)").getByRole("link", { name: "privacy policy" })).toHaveAttribute("href", "/en/datenschutz");
  });

  test("server HTML: address, hours, labels, honeypot; 375 px without overflow", async ({ page, request }) => {
    const res = await request.get("/de/kontakt");
    const html = await res.text();
    for (const s of ['id="kontakt-name"', 'name="website"', "Datenschutzerklärung", "Dienstag", "6911 Lochau"]) expect(html).toContain(s);
    expect((html.match(/<h1[\s>]/g) || []).length).toBe(1);
    await page.setViewportSize({ width: 375, height: 812 });
    await open(page, "/de/kontakt");
    const { vw, sw, wide } = await measureOverflow(page);
    expect(sw, wide.join("; ")).toBeLessThanOrEqual(vw);
    // Honeypot is not reachable with Tab.
    await expect(page.locator("#kontakt-website")).toHaveAttribute("tabindex", "-1");
  });
});

test.describe("Beratung", () => {
  test("keyboard: radio cards, no auto-advance, back/next, payload unchanged", async ({ page }) => {
    await open(page, "/de/beratung");
    const sent = await answer(page, "/api/upload/inquiry/beratung", 200, { success: true, message: "Form submitted successfully", data: {} });
    await expect(page.getByText("Schritt 1 von 4")).toBeVisible();
    // Choosing does not jump on.
    await page.locator("#beratung-art-0").check();
    await page.waitForTimeout(800);
    await expect(page.getByText("Schritt 1 von 4")).toBeVisible();
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.getByText("Schritt 2 von 4")).toBeVisible();
    await expect(page.locator("#beratung-ort")).toBeFocused();
    // Without a choice: error at the group, focus on the first radio.
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.locator("#beratung-ort-0")).toBeFocused();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.getByText("Schritt 3 von 4")).toBeVisible();
    await page.locator("#beratung-vorhaben").fill("Wohnzimmer neu einrichten, ca. 30 m².");
    await page.locator("#beratung-vorhaben").press("Tab");
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-vorname").fill("Erika");
    await page.locator("#beratung-nachname").fill("Muster");
    await page.locator("#beratung-email").fill("erika@example.com");
    await page.locator("#beratung-telefon").fill("+43 664 1234567");
    await expect(page.locator("form").filter({ has: page.locator("[name=website]") }).getByRole("link", { name: "Datenschutzerklärung" })).toBeVisible();
    await page.getByRole("button", { name: "Absenden" }).click();
    await expect(page.locator('[role="status"][tabindex="-1"]').first()).toBeFocused();
    expect(sent).toHaveLength(1);
    expect(Object.keys(sent[0]).sort()).toEqual(
      // R4-leads: + lead_ref (Herkunft block inside bitte_beschreiben_sie_ihr_vorhaben).
      ["_t", "bei_meiner_anfrage_geht_es_um", "das_projekt_soll_verwirklicht_werden", "bitte_beschreiben_sie_ihr_vorhaben", "email", "lead_ref", "nachname", "telefon", "vorname", "website"].sort()
    );
    expect(sent[0].bei_meiner_anfrage_geht_es_um).toBe("einen Neubau");
    expect(sent[0].das_projekt_soll_verwirklicht_werden).toBe("in einer Wohnung");
  });

  test("timeout code is translated, not the English text", async ({ page }) => {
    await open(page, "/de/beratung");
    await answer(page, "/api/upload/inquiry/beratung", 504, { success: false, code: "timeout", error: "Failed to submit form" });
    await page.locator("#beratung-art-1").check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-ort-1").check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-vorhaben").fill("Küche planen für einen Altbau.");
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-vorname").fill("Erika");
    await page.locator("#beratung-nachname").fill("Muster");
    await page.locator("#beratung-email").fill("erika@example.com");
    await page.locator("#beratung-telefon").fill("+43 664 1234567");
    await page.getByRole("button", { name: "Absenden" }).click();
    await expect(page.getByText("Die Antwort hat zu lange gedauert", { exact: false })).toBeVisible();
    await expect(page.locator("main")).not.toContainText(ENGLISH);
  });
});

test.describe("Produktanfrage (Merkliste)", () => {
  test("fields, business extras, contract fields, translated error", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("cart", JSON.stringify([{ id: 1, produkte_id: 4711, name: "Testprodukt", category: "Sofas", image: null }]));
    });
    await open(page, "/de/merkliste");
    const sent = await answer(page, "/api/upload/inquiry/produkt", 502, { success: false, code: "upstream", error: "Failed to submit inquiry" });
    await page.getByRole("button", { name: /Anfrage|senden/i }).first().click();
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    await expect(page.locator("#anfrage-userType-0")).toBeFocused();
    await page.locator("#anfrage-userType-1").check();
    await expect(page.locator("#anfrage-companyName")).toBeVisible();
    await page.locator("#anfrage-companyName").fill("Muster GmbH");
    await page.locator("#anfrage-nrFiscal").fill("ATU12345678");
    await page.locator("#anfrage-firstName").fill("Erika");
    await page.locator("#anfrage-lastName").fill("Muster");
    await page.locator("#anfrage-email").fill("erika@example.com");
    await page.locator("#anfrage-phone").fill("066412345");
    await page.locator("#anfrage-address").fill("Hauptstraße 1");
    await page.locator("#anfrage-city").fill("Lochau");
    await page.locator("#anfrage-country").fill("Österreich");
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    await expect(page.getByText("konnte gerade nicht gesendet werden", { exact: false })).toBeVisible();
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ anfrage_type: "Geschäft", anfrage_company: "Muster GmbH", anfrage_fiscal_number: "ATU12345678", produkte: [4711], website: "" });
    expect(sent[0]._t).toBeGreaterThan(0);
  });
});

test.describe("Adventsabend", () => {
  // R3 (P4-technik): im Produktions-Build ohne EVENT.startTime absichtlich 404
  // (eventPublic()); der 404 selbst ist in legal.spec.js belegt.
  test.skip(!ADVENTSABEND_ON, "Produktion: /de/adventsabend ist ohne Uhrzeit absichtlich aus (eventPublic)");
  test("duration _t, honeypot, translated code, privacy note", async ({ page }) => {
    await open(page, "/de/adventsabend");
    const sent = await answer(page, "/api/kontakt", 429, { success: false, code: "rate_limited", error: "Too many requests" });
    await page.getByRole("button", { name: "Platz reservieren" }).click();
    await expect(page.locator("#aa-name")).toBeFocused();
    await page.locator("#aa-name").fill("Erika Muster");
    await page.locator("#aa-email").fill("erika@example.com");
    await page.getByRole("button", { name: "Platz reservieren" }).click();
    await expect(page.getByText("Sie haben in kurzer Zeit mehrere Anfragen gesendet", { exact: false })).toBeVisible();
    expect(sent[0].website).toBe("");
    expect(sent[0]._t).toBeLessThan(1e11);
    await expect(page.locator("form").filter({ has: page.locator("[name=website]") }).getByRole("link", { name: "Datenschutzerklärung" })).toBeVisible();
  });
});

test.describe("Routes (live, invalid only)", () => {
  test("schema-invalid bodies are rejected before forwarding, format unchanged", async ({ request }) => {
    const cases = [
      ["/api/kontakt", { name: "X", email_address: "nope", ihre_nachricht: "kurz", website: "", _t: 5000 }],
      ["/api/beratung_anfrage", { vorname: "", email: "nope", website: "", _t: 5000 }],
      ["/api/anfrage_produkt", { anfrage_email: "nope", website: "", _t: 5000 }],
    ];
    for (const [path, body] of cases) {
      const res = await request.post(path, { data: body, headers: { "X-Forwarded-For": "203.0.113.201" } });
      expect(res.status(), path).toBe(400);
      const json = await res.json();
      expect(json).toMatchObject({ success: false, code: "invalid" });
      expect(typeof json.error).toBe("string");
    }
  });
});

// ── Fix-Runde 1, Team F3 ────────────────────────────────────────────────────
// Wizard-Themen und URL-Kontext (?thema=, ?planer=, ?stil=, ?produkt=),
// optionaler Wunschtermin, Herkunftsprüfung der Routen. Alle Sendungen gemockt
// (answer/blockFormSends); die Route-Prüfung schickt nur fremde Herkunft, die
// vor jeder Weiterleitung mit 403 endet.
function futureTuesday() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 7);
  while (d.getUTCDay() !== 2) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

test.describe("F3: Beratung mit Kontext und Wunschtermin", () => {
  test("?thema/?planer/?stil/?produkt belegen Thema, Ort und Nachricht vor; Wunschtermin als eine Zeile", async ({ page }) => {
    await open(page, "/de/beratung?thema=sofa,yacht&planer=3d&stil=italienische-ruhe&produkt=Minotti%20Belt");
    const sent = await answer(page, "/api/upload/inquiry/beratung", 200, { success: true, message: "Form submitted successfully", data: {} });
    await expect(page.getByRole("radio", { name: "ein Sofa" })).toBeChecked();
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.getByRole("radio", { name: "auf einem Boot oder einer Yacht" })).toBeChecked();
    await page.getByRole("button", { name: "Weiter" }).click();
    const text = page.locator("#beratung-vorhaben");
    // r7-p1 (ux P2-6): ?thema=yacht also writes its context line.
    await expect(text).toHaveValue("Anfrage zu: Minotti Belt\nEs geht um ein Boot oder eine Yacht.\nAnfrage aus der 3D-Ansicht\nStil-Finder-Ergebnis: Italienische Ruhe\n");
    await text.press("ControlOrMeta+End");
    await text.pressSequentially("Salon an Bord, drei Sitzplätze.");
    // Wunschtermin: optional, Hinweis ohne Zusage, kein Datum in der Vergangenheit.
    await expect(page.getByText("Das ist noch keine Terminzusage", { exact: false })).toBeVisible();
    const date = page.getByLabel("Wunschtag");
    await date.fill("2020-01-07");
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.getByText("Bitte wählen Sie einen Tag ab heute.").first()).toBeVisible();
    const day = futureTuesday();
    await date.fill(day);
    await page.getByRole("radio", { name: "vormittags" }).check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-vorname").fill("Erika");
    await page.locator("#beratung-nachname").fill("Muster");
    await page.locator("#beratung-email").fill("erika@example.com");
    await page.locator("#beratung-telefon").fill("+43 664 1234567");
    await page.getByRole("button", { name: "Absenden" }).click();
    await expect.poll(() => sent.length).toBe(1);
    const body = sent[0];
    expect(body.bei_meiner_anfrage_geht_es_um).toBe("ein Sofa");
    expect(body.das_projekt_soll_verwirklicht_werden).toBe("auf einem Boot oder einer Yacht");
    expect(body.bitte_beschreiben_sie_ihr_vorhaben).toContain("Anfrage zu: Minotti Belt\nEs geht um ein Boot oder eine Yacht.\nAnfrage aus der 3D-Ansicht\nStil-Finder-Ergebnis: Italienische Ruhe\nSalon an Bord");
    expect(body.bitte_beschreiben_sie_ihr_vorhaben).toMatch(/Wunschtermin \(unverbindlich\): Dienstag, \d{1,2}\. \S+ \d{4}, vormittags/);
    // Kein neues API-Feld.
    expect(Object.keys(body)).not.toContain("wishDate");
    expect(Object.keys(body)).not.toContain("wishSlot");
  });

  test("EN: ?planer=kuechenplaner selects the kitchen, the line is English; ohne Kontext nichts vorbelegt", async ({ page }) => {
    await open(page, "/en/consultation?planer=kuechenplaner");
    await expect(page.getByRole("radio", { name: "a kitchen" })).toBeChecked();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("radio", { name: "in an apartment" }).check();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.locator("#beratung-vorhaben")).toHaveValue("Enquiry from the kitchen planner\n");
    await open(page, "/de/beratung");
    await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  });

  test("Kern-USP mit Link zur Arbeitsweise auf Beratung und Kontakt", async ({ page }) => {
    for (const url of ["/de/beratung", "/de/kontakt"]) {
      await open(page, url);
      // Runde 5: die Seite trägt jetzt einen (für DE verborgenen) Sprachhinweis
      // für EN/FR/IT mit demselben Namen – geprüft wird der sichtbare deutsche Satz.
      const lead = page.locator("main").getByText("Harald Menghin", { exact: false }).filter({ visible: true }).first();
      await expect(lead).toBeVisible();
      await expect(page.locator("main").getByRole("link", { name: "So arbeiten wir" }).first()).toHaveAttribute("href", "/de/arbeitsweise");
      await expect(page.locator("main")).not.toContainText(/60 Minuten|kostenlos/);
    }
  });

  test("Handy: Schritt 1 der Beratung beginnt im ersten Bildschirm", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, "/de/beratung");
    // The first answer card (not just the question) ends inside the first screen.
    const box = await page.locator("label[for=beratung-art-0]").boundingBox();
    expect(box.y + box.height, `erste Antwort endet bei y=${box.y + box.height}`).toBeLessThanOrEqual(844);
  });
});

test.describe("F3: Herkunftsprüfung der Formular-Routen (nur fremde Herkunft, nichts weitergeleitet)", () => {
  test("fremder Origin/Referer → 403 forbidden vor jeder Weiterleitung", async ({ request }) => {
    // Bodies are schema-INVALID on purpose (e-mail): even if the origin check
    // were missing, nothing could be forwarded (400 instead of 403 → test red).
    const valid = {
      "/api/kontakt": { name: "Erika Muster", email_address: "kein-e-mail", ihre_nachricht: "Bitte um Rückruf wegen Sofa.", _t: 9000 },
      "/api/beratung_anfrage": { bei_meiner_anfrage_geht_es_um: "ein Sofa", das_projekt_soll_verwirklicht_werden: "in einer Wohnung", bitte_beschreiben_sie_ihr_vorhaben: "Wohnzimmer neu einrichten.", vorname: "E", nachname: "M", email: "kein-e-mail", telefon: "+43 664 1234567", _t: 9000 },
      "/api/anfrage_produkt": { anfrage_type: "Privat", anfrage_vorname: "E", anfrage_nachname: "M", anfrage_email: "kein-e-mail", anfrage_phone: "+43 664 1234567", anfrage_country: "AT", anfrage_city: "Lochau", anfrage_address: "Landstraße 11", _t: 9000 },
      "/api/newsletter_subscribe": { email: "kein-e-mail", _t: 9000 },
      "/api/upload/inquiry/kontakt": { name: "Erika Muster", email_address: "kein-e-mail", ihre_nachricht: "Bitte um Rückruf wegen Sofa.", _t: 9000 },
    };
    for (const [path, data] of Object.entries(valid)) {
      for (const headers of [{ Origin: "https://evil.example" }, { Referer: "https://evil.example/form.html" }]) {
        const res = await request.post(path, { data, headers });
        expect(res.status(), `${path} ${JSON.stringify(headers)}`).toBe(403);
        expect(await res.json()).toMatchObject({ success: false, code: "forbidden" });
      }
    }
  });
});
