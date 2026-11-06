// tests/e2e/kundenkarte.spec.js – Kundenkarte Stufe 1 (04.11.2026).
// Seite /de|en|fr|it/kundenkarte (index, hreflang, FAQPage), Bedingungen
// (Entwurf, noindex), Bestätigungsseite (noindex), Formular im Mock
// (Double-Opt-in über /api/kundenkarte/apply → /kundenkarte/bestaetigen),
// 375 px ohne horizontalen Überlauf, axe WCAG 2.2 AA, Portalbereich
// /de/portal/kundenkarte (signierte Demo-Sitzung wie pflege-service.spec).
// Läuft im Projekt desktop (die Handy-Projekte filtern auf smoke|a11y);
// 375 px über setViewportSize.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHmac, randomUUID } from "node:crypto";
import { dismissCookieBanner, jsonLdNodes, measureOverflow, robotsDirectives } from "./helpers.js";

const SECRET = process.env.PORTAL_SESSION_SECRET || "dev-only-portal-secret-do-not-use-in-production-0000";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const LOCALES = ["de", "en", "fr", "it"];
const H1 = { de: "Die Platzhirsch Kundenkarte.", en: "The Platzhirsch customer card.", fr: "La carte client Platzhirsch.", it: "La carta cliente Platzhirsch." };

async function login(context, baseURL) {
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ v: 1, sub: "CUST-DEMO-0001", sid: randomUUID(), iat: now, exp: now + 3600 })).toString("base64url");
  const value = `${body}.${createHmac("sha256", SECRET).update(`portal-session:${body}`).digest("base64url")}`;
  await context.addCookies([{ name: "ph_portal_session", value, url: baseURL, httpOnly: true, sameSite: "Lax" }]);
}

async function axeClean(page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
  const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

test.describe("Kundenkarte", () => {
  test("Smoke 4 Sprachen: 200, index, hreflang reziprok, FAQPage + WebPage, keine Euro/Prozent", async ({ request }) => {
    for (const locale of LOCALES) {
      const res = await request.get(`/${locale}/kundenkarte`);
      expect(res.status(), locale).toBe(200);
      const text = await res.text();
      expect(robotsDirectives({ text, headers: res.headers() }), locale).not.toContain("noindex");
      for (const l of LOCALES) expect(text, `${locale} hreflang ${l}`).toMatch(new RegExp(`hrefLang="${l}"[^>]*href="https://platzhirsch.studio/${l}/kundenkarte"`));
      expect(text).toMatch(/hrefLang="x-default"/);
      const nodes = jsonLdNodes(text);
      const types = nodes.map((n) => n["@type"]);
      expect(types, locale).toEqual(expect.arrayContaining(["WebPage", "FAQPage"]));
      const faq = nodes.find((n) => n["@type"] === "FAQPage");
      expect(faq.mainEntity.length).toBe(8);
      expect(text).toMatch(new RegExp(H1[locale].replace(".", "\\.")));
      const body = text.replace(/<script[\s\S]*?<\/script>/g, "");
      expect(body, `${locale} kein €`).not.toMatch(/€/);
      expect(body, `${locale} kein Rabatt`).not.toMatch(/Rabatt|discount|remise|sconto/i);
    }
  });

  test("Bedingungen: Entwurf, noindex; Bestätigen: noindex + no-referrer; Code fehlt → Hinweis", async ({ request, page }) => {
    const res = await request.get("/de/kundenkarte/bedingungen");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(robotsDirectives({ text, headers: res.headers() })).toContain("noindex");
    expect(text).toMatch(/data-terms-status="entwurf"/);
    expect(text).toMatch(/Freigabe Kanzlei offen/);
    const en = await request.get("/en/kundenkarte/bedingungen");
    expect(en.status()).toBe(200);
    expect(await en.text()).toMatch(/only available in German/);

    const conf = await request.get("/fr/kundenkarte/bestaetigen");
    expect(conf.status()).toBe(200);
    const ct = await conf.text();
    expect(robotsDirectives({ text: ct, headers: conf.headers() })).toContain("noindex");
    expect(ct).toMatch(/<meta name="referrer" content="no-referrer"/);

    await page.goto("/de/kundenkarte/bestaetigen");
    await expect(page.locator('[data-confirm-state="missing"]')).toBeVisible();
  });

  test("Seite DE: eine H1, Tabelle 3 Stufen × 7 Vorteile, Beispielkarte, Schritt 3 „in Vorbereitung“, axe", async ({ page }) => {
    await page.goto("/de/kundenkarte");
    await dismissCookieBanner(page);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(H1.de);
    const table = page.locator("[data-kundenkarte-vorteile] table");
    await expect(table.locator("tbody tr")).toHaveCount(7);
    // berater/produktpass/geburtstag × 3 Stufen, events/pflege/lieferung × 2, montage × 1
    await expect(table.locator('td[data-inklusive="1"]')).toHaveCount(3 + 3 + 3 + 2 + 2 + 2 + 1);
    await expect(page.locator('[data-kundenkarte-visual="plus"]')).toBeVisible();
    await expect(page.locator("[data-kundenkarte-visual]")).toContainText("Max Muster");
    await expect(page.locator("[data-kundenkarte-visual] + span, [data-kundenkarte-visual] span").filter({ hasText: "Beispiel" }).first()).toBeVisible();
    await expect(page.locator("[data-kundenkarte-schritte] li").nth(2)).toContainText("in Vorbereitung");
    await expect(page.locator("[data-kundenkarte-faq] dt")).toHaveCount(8);
    // Einwilligungen nie vorangekreuzt
    const form = page.getByTestId("kundenkarte-form");
    await expect(form.locator("#kk-auswertung")).not.toBeChecked();
    await expect(form.locator("#kk-newsletter")).not.toBeChecked();
    await expect(form.locator("#kk-kenntnisnahme")).not.toBeChecked();
    await axeClean(page);
  });

  test("Formular: leeres Absenden markiert nur die Pflichtfelder; Geburtstag halb ausgefüllt wird gemeldet", async ({ page }) => {
    await page.goto("/de/kundenkarte#anmeldung");
    await dismissCookieBanner(page);
    const form = page.getByTestId("kundenkarte-form");
    await expect(form.getByRole("button", { name: "Anmeldung absenden" })).toBeEnabled();
    await form.getByRole("button", { name: "Anmeldung absenden" }).click();
    await expect(form.getByRole("status").first()).toContainText("Bitte prüfen Sie diese Angaben");
    for (const id of ["vorname", "nachname", "email", "kenntnisnahme"]) {
      await expect(form.locator(`#kk-${id}`)).toHaveAttribute("aria-invalid", "true");
    }
    for (const id of ["telefon", "plz", "ort", "tag", "jahr"]) {
      await expect(form.locator(`#kk-${id}`)).not.toHaveAttribute("aria-invalid", "true");
    }
    await form.locator("#kk-monat").selectOption("3");
    await form.getByRole("button", { name: "Anmeldung absenden" }).click();
    await expect(form.locator("#kk-tag")).toHaveAttribute("aria-invalid", "true");
    await expect(form.locator("#kk-geburtstag-error")).toContainText("Tag und Monat");
  });

  test("Mock: Formular absenden (nach 3 s) → Bestätigungshinweis → Link im Testbetrieb → Bestätigen → aktiv", async ({ page, baseURL }) => {
    test.skip(!/localhost|127\.0\.0\.1/.test(baseURL || ""), "nur gegen den lokalen Dev-Server (Mock-Ablage)");
    await page.goto("/de/kundenkarte#anmeldung");
    await dismissCookieBanner(page);
    const form = page.getByTestId("kundenkarte-form");
    const email = `e2e-${Date.now()}@example.com`;
    await form.locator("#kk-vorname").fill("Erika");
    await form.locator("#kk-nachname").fill("Muster");
    await form.locator("#kk-email").fill(email);
    await form.locator("#kk-tag").selectOption("14");
    await form.locator("#kk-monat").selectOption("3");
    await form.locator("#kk-interesse-wohnen").check();
    await form.locator("#kk-newsletter").check();
    await form.locator("#kk-kenntnisnahme").check();
    // Zeitfalle des Formular-Vertrags: unter 3 s gilt als Bot (Schein-Erfolg ohne Link).
    await page.waitForTimeout(3200);
    await form.getByRole("button", { name: "Anmeldung absenden" }).click();
    const success = page.getByRole("status").filter({ hasText: "Bitte bestätigen Sie Ihre E-Mail-Adresse" });
    await expect(success).toBeVisible();
    const link = page.locator("[data-kundenkarte-dev-link] a");
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    expect(href).toMatch(/^\/de\/kundenkarte\/bestaetigen\?token=KK-[0-9A-Z]{6}\./);

    await page.goto(href);
    await expect(page.locator('[data-confirm-state="ready"]')).toBeVisible();
    await page.locator("[data-kundenkarte-confirm]").click();
    await expect(page.locator('[data-confirm-state="done"]')).toBeVisible();
    await expect(page.locator('[data-confirm-state="done"] h2')).toHaveText("Vielen Dank – Ihre Kundenkarte ist aktiv.");
    // Zweiter Klick (neu laden): schon bestätigt.
    await page.goto(href);
    await page.locator("[data-kundenkarte-confirm]").click();
    await expect(page.locator('[data-confirm-state="done"]')).toContainText("bereits bestätigt");
  });

  test("API: ungültiges Token 400, conflict/invalid-Codes, Honeypot = Schein-Erfolg ohne Link", async ({ request, baseURL }) => {
    test.skip(!/localhost|127\.0\.0\.1/.test(baseURL || ""), "nur gegen den lokalen Dev-Server");
    const bad = await request.post("/api/kundenkarte/confirm", { data: { token: "KK-ABCDEF.falsch" } });
    expect(bad.status()).toBe(400);
    expect((await bad.json()).code).toBe("invalid_token");
    const invalid = await request.post("/api/kundenkarte/apply", { data: { vorname: "", nachname: "Muster", email: "x", kenntnisnahme: true } });
    expect(invalid.status()).toBe(400);
    expect((await invalid.json()).code).toBe("invalid");
    const bot = await request.post("/api/kundenkarte/apply", { data: { vorname: "Bot", nachname: "Bot", email: "bot@example.com", kenntnisnahme: true, website: "http://spam" } });
    expect(bot.status()).toBe(200);
    const bj = await bot.json();
    expect(bj.success).toBe(true);
    expect(bj.devConfirmUrl).toBeUndefined();
  });

  test("375 px: kein horizontaler Überlauf, Tabelle als Blöcke, Karte sichtbar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/de/kundenkarte");
    await dismissCookieBanner(page);
    await expect(page.locator("[data-kundenkarte-visual]")).toBeVisible();
    const o = await measureOverflow(page);
    expect(o.sw, JSON.stringify(o.wide)).toBeLessThanOrEqual(o.vw + 1);
    await page.locator("#anmeldung").scrollIntoViewIfNeeded();
    const o2 = await measureOverflow(page);
    expect(o2.sw, JSON.stringify(o2.wide)).toBeLessThanOrEqual(o2.vw + 1);
  });

  test("Portal: /de/portal/kundenkarte zeigt Karte, Stufe, Vorteile und Wallet „in Vorbereitung“; Nav-Eintrag", async ({ page, context, baseURL }) => {
    await login(context, baseURL);
    await page.goto("/de/portal/kundenkarte");
    await expect(page.locator("h1")).toHaveText("Meine Kundenkarte");
    const area = page.locator("[data-portal-kundenkarte]");
    await expect(area.locator('[data-kundenkarte-visual="plus"]')).toBeVisible();
    await expect(area).toContainText("Platzhirsch Plus");
    await expect(area.locator('[data-vorteil-verfuegbar="1"]')).toHaveCount(6);
    await expect(area.locator('[data-vorteil-verfuegbar="0"]')).toHaveCount(1);
    const wallet = area.getByRole("button", { name: /Apple Wallet/ });
    await expect(wallet).toBeDisabled();
    await expect(wallet).toContainText("in Vorbereitung");
    await expect(area).not.toContainText("€");
    await expect(page.getByRole("link", { name: "Kundenkarte" }).first()).toBeVisible();
    await axeClean(page);
  });
});
