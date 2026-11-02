// tests/e2e/pflege-service.spec.js – Pflege-Service Leder, Stoff, Holz (Service Nr. 4).
// Seite /de|en/pflege-service, Anfrageformular (nie abgeschickt: blockFormSends),
// Portalbereich /de/portal/pflege (signierte Demo-Sitzung wie r3-portal-voice).
// Läuft im Projekt desktop; 375 px über setViewportSize.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHmac, randomUUID } from "node:crypto";
import { blockFormSends, dismissCookieBanner, jsonLdNodes, measureOverflow, robotsDirectives } from "./helpers.js";

const SECRET = process.env.PORTAL_SESSION_SECRET || "dev-only-portal-secret-do-not-use-in-production-0000";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

async function login(context, baseURL) {
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ v: 1, sub: "CUST-DEMO-0001", sid: randomUUID(), iat: now, exp: now + 3600 })).toString("base64url");
  const value = `${body}.${createHmac("sha256", SECRET).update(`portal-session:${body}`).digest("base64url")}`;
  await context.addCookies([{ name: "ph_portal_session", value, url: baseURL, httpOnly: true, sameSite: "Lax" }]);
}

test.describe("Pflege-Service", () => {
  // Sprach-Integration 01.11.2026 (bewusst geändert): FR/IT sind eigene Seiten (vorher 404).
  test("DE/EN/FR/IT 200, noindex, JSON-LD ohne Preis", async ({ request }) => {
    for (const [path, status] of [["/de/pflege-service", 200], ["/en/pflege-service", 200], ["/fr/pflege-service", 200], ["/it/pflege-service", 200]]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(status);
    }
    const res = await request.get("/de/pflege-service");
    const text = await res.text();
    expect(robotsDirectives({ text, headers: res.headers() })).toContain("noindex");
    // Rat 9,5 C8 (T6, bewusst geändert): noindex-Seiten nennen keine Sprachversionen
    // (Runde 5 P6, isIndexable) – kein hreflang mehr, auch nicht de/en.
    expect(text).not.toMatch(/<link rel="alternate" hrefLang=/);
    const types = jsonLdNodes(text).map((n) => n["@type"]);
    expect(types).toEqual(expect.arrayContaining(["WebPage", "Service", "FAQPage", "BreadcrumbList"]));
    expect(JSON.stringify(jsonLdNodes(text))).not.toMatch(/"offers"|"price"/);
  });

  test("Seite: eine H1, Leistungen je Material, Preise auf Anfrage, Ratgeber verlinkt, axe ohne serious/critical", async ({ page }) => {
    await page.goto("/de/pflege-service");
    await dismissCookieBanner(page);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Pflege für Leder, Stoff und Holz.");
    for (const name of ["Leder", "Stoff", "Holz und Furnier", "Marmor und Naturstein"]) {
      await expect(page.getByRole("heading", { level: 3, name, exact: true })).toBeVisible();
    }
    const kond = page.getByTestId("pflege-konditionen");
    await expect(kond).toContainText("auf Anfrage");
    await expect(kond.locator("dt")).toHaveCount(2); // leere Inhaber-Werte = keine Zeile
    await expect(page.locator('a[href="/de/ratgeber/designmoebel-pflegen-leder-stoff-holz"]').first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText("€");
    const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
    const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });

  test("Formular: leeres Absenden markiert Pflichtfelder, kein Request; Vorbelegung aus ?stueck=", async ({ page }) => {
    const blocked = await blockFormSends(page);
    await page.goto("/de/pflege-service?stueck=Minotti%20Sofa%20Connery&material=stoff#anfrage");
    await dismissCookieBanner(page);
    const form = page.getByTestId("pflege-form");
    await expect(form.getByLabel("Welche Möbelstücke?")).toHaveValue("Minotti Sofa Connery");
    await expect(form.getByLabel("Stoff")).toBeChecked();
    await form.getByLabel("Welche Möbelstücke?").fill("");
    await form.getByRole("button", { name: "Anfrage senden" }).click();
    await expect(form.getByRole("status").first()).toContainText("Bitte prüfen Sie diese Angaben");
    for (const id of ["stuecke", "zeitraum", "ort", "vorname", "nachname", "email"]) {
      await expect(form.locator(`#pflege-${id}`)).toHaveAttribute("aria-invalid", "true");
    }
    await expect(form.locator("#pflege-telefon")).not.toHaveAttribute("aria-invalid", "true");
    await expect(form.getByLabel("Bitte erinnern Sie mich nach dem Pflegetermin per E-Mail an passende Pflegemittel.")).not.toBeChecked();
    expect(blocked).toEqual([]);
  });

  test("375 px ohne horizontalen Überlauf (DE und EN)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of ["/de/pflege-service", "/en/pflege-service"]) {
      await page.goto(path);
      const o = await measureOverflow(page);
      expect(o.sw, `${path}: ${o.wide.join("; ")}`).toBeLessThanOrEqual(o.vw);
    }
  });

  test("EN: englische Texte, Ratgeber-Link mit hreflang de", async ({ page }) => {
    await page.goto("/en/pflege-service");
    await expect(page.locator("h1")).toHaveText("Care for leather, fabric and wood.");
    await expect(page.locator('a[hreflang="de"][href="/de/ratgeber/designmoebel-pflegen-leder-stoff-holz"]').first()).toBeVisible();
  });
});

test.describe("Portal: Meine Stücke & Pflege", () => {
  test("Stücke mit Material und Pflegeanleitung, Anfrage-Link mit Vorbelegung", async ({ page, context, baseURL }) => {
    await login(context, baseURL);
    const res = await page.goto("/de/portal/pflege");
    test.skip(page.url().includes("/login"), "server uses another PORTAL_SESSION_SECRET");
    expect(res.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Meine Stücke & Pflege");
    const list = page.getByTestId("pflege-stuecke");
    await expect(list.getByRole("heading", { level: 2, name: "Sofa Connery" })).toBeVisible();
    await expect(list).toContainText("Stoff");
    await expect(list).toContainText("Marmor und Naturstein");
    const link = list.getByRole("link", { name: /Pflege-Abo anfragen/ }).first();
    await expect(link).toHaveAttribute("href", /\/de\/pflege-service\?stueck=.+#anfrage/);
    const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
    const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
