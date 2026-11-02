// tests/e2e/rat95-t1-terminweg.spec.js – Rat 9,5 Team T1 (Wege, Termin & Vertrauen).
//   B1  auf keiner Seite führt dasselbe Linkwort zu zwei Zielen (Start, Produkt,
//       Hotel, Marke, Beratung, Termin, Kontakt; nach der Hydration)
//   B1/B2 Kontext (thema, ort, produkt) und Anhänge (plan, ideenboard) kommen
//       in /termin und /beratung an
//   A3  iPhone: Bestätigung nach dem Senden mit top >= 0 (POST abgefangen)
//   B6  Vertrauensblock auf Beratung und Termin ohne Antwortzeit-/Kosten-/Preiszusage
//   C3  Schritt 1 mit sechs Karten, Entwurf übersteht ein Neuladen
// Nichts wird abgeschickt: blockFormSends + eigene Antworten auf die POSTs.
import { test, expect, devices } from "@playwright/test";
import { blockFormSends, dismissCookieBanner, settle } from "./helpers.js";

const { defaultBrowserType: _i, ...IPHONE } = devices["iPhone 15 Pro"];
const TERMIN_WORD = /termin|beratung|consult|visit|rendez|appuntamento|schreiben|write/i;

async function open(page, url) {
  await blockFormSends(page);
  await page.goto(url);
  await settle(page);
  await dismissCookieBanner(page, 8_000);
}

async function answer(page, path, body) {
  const sent = [];
  await page.route(`**${path}`, (route) => {
    if (route.request().method() !== "POST") return route.continue();
    sent.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  return sent;
}

/** Linkwort → Menge der Ziele (Pfad ohne Query/Hash), nur Termin-/Beratungslinks. */
async function linkTargets(page) {
  return page.evaluate((src) => {
    const re = new RegExp(src, "i");
    const map = {};
    for (const a of document.querySelectorAll("a[href]")) {
      const text = (a.getAttribute("aria-label") || a.textContent || "").replace(/\s+/g, " ").trim();
      const href = a.getAttribute("href") || "";
      if (!text || href.startsWith("#") || !(re.test(text) || /\/(termin|beratung|consultation|conseil|consulenza)(\b|\/|\?|$)/.test(href))) continue;
      const target = new URL(href, location.href).pathname;
      (map[text] ||= []).includes(target) || map[text].push(target);
    }
    return map;
  }, TERMIN_WORD.source);
}

test.describe("B1 ein Terminweg", () => {
  for (const url of [
    "/de",
    "/de/produkte/sofas-couches/sofas-twiggy-sofas",
    "/de/hotel-objekt",
    "/de/ueber-uns/marken/minotti",
    "/de/beratung",
    "/de/termin",
    "/de/kontakt",
    "/en",
    "/en/consultation",
  ]) {
    test(`${url}: kein Linkwort mit zwei Zielen`, async ({ page }) => {
      await open(page, url);
      const map = await linkTargets(page);
      const doubles = Object.entries(map).filter(([, targets]) => targets.length > 1);
      expect(doubles, JSON.stringify(map, null, 1)).toEqual([]);
    });
  }

  test("Markenseite: Kopf-Termin trägt die Marke", async ({ page }) => {
    await open(page, "/de/ueber-uns/marken/minotti");
    await expect(page.locator("a[data-header-cta]")).toHaveAttribute("href", /produkt=Minotti/);
  });
});

test.describe("B1/B2 Kontext und Anhänge kommen an", () => {
  test("/termin: Thema, Ort und Produkt aus dem Link, „Lieber schreiben“ mit Kontext", async ({ page }) => {
    await open(page, "/de/termin?thema=sofa&ort=lindau&produkt=Minotti%20Twiggy");
    await expect(page.locator("input[name=art][value=planung]")).toBeChecked();
    await expect(page.locator("input[name=thema][value=wohnen]")).toBeChecked();
    const write = page.locator("[data-termin-write] a");
    await expect(write).toHaveAttribute("href", /\/de\/beratung\?thema=sofa&ort=lindau&produkt=Minotti/);
    await expect(write).toHaveText(/Lieber schreiben/);
  });

  test("/beratung: Plan und Ideenboard werden angezeigt und mitgeschickt", async ({ page, request }) => {
    const res = await request.post("/api/ideenboard", { data: { board: { cards: [{ type: "notiz", note: "Eiche hell" }, { type: "notiz", note: "Leinen" }] } } });
    expect(res.status()).toBe(201);
    const { shareId } = await res.json();
    const plan = encodeURIComponent("https://platzhirsch.studio/de/kuechenplaner?p=abc");
    await open(page, `/de/beratung?thema=kueche&plan=${plan}&ideenboard=${shareId}`);
    const box = page.locator("[data-beratung-attachments]");
    await expect(box).toContainText("Ihr Plan aus dem Werkzeug");
    await expect(box).toContainText("Ihr Ideenboard (2 Karten)");
    const sent = await answer(page, "/api/upload/inquiry/beratung", { success: true, data: {} });
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-ort-0").check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-vorhaben").fill("Neue Küche mit Insel, Eiche hell.");
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-vorname").fill("Erika");
    await page.locator("#beratung-nachname").fill("Muster");
    await page.locator("#beratung-email").fill("erika@example.com");
    await page.getByRole("button", { name: "Absenden" }).click();
    await expect(page.locator("[data-confirmation]")).toBeVisible();
    expect(sent).toHaveLength(1);
    expect(sent[0].bitte_beschreiben_sie_ihr_vorhaben).toContain("Plan: https://platzhirsch.studio/de/kuechenplaner?p=abc");
    expect(sent[0].bitte_beschreiben_sie_ihr_vorhaben).toContain(`Ideenboard: https://platzhirsch.studio/de/ideenboard/${shareId}`);
  });

  test("/termin: unbekanntes Ideenboard wird nicht angehängt, Hinweis statt Fehler", async ({ page }) => {
    await open(page, `/de/termin?ideenboard=${"Z".repeat(32)}`);
    await expect(page.locator("[data-termin-attachments]")).toContainText("nicht mehr gültig");
  });
});

test.describe("B6 Vertrauensblock", () => {
  for (const url of ["/de/beratung", "/de/termin"]) {
    test(`${url}: Team, nächste Schritte, Öffnungszeiten, Datenschutz – ohne Zusagen`, async ({ page }) => {
      await open(page, url);
      const block = page.locator("[data-trust-block]");
      await expect(block).toBeVisible();
      await expect(block).toContainText("So geht es weiter");
      await expect(block).toContainText("Öffnungszeiten");
      await expect(block.getByRole("link", { name: "Datenschutzerklärung" })).toBeVisible();
      await expect(block).not.toContainText(/kostenlos|gratis|innerhalb von|binnen|€/i);
    });
  }
});

test.describe("A3 Bestätigung sichtbar (iPhone)", () => {
  test.use(IPHONE);

  test("Beratung: Bestätigungs-H2 top >= 0", async ({ page }) => {
    await open(page, "/de/beratung");
    await answer(page, "/api/upload/inquiry/beratung", { success: true, data: {} });
    await page.locator("#beratung-art-0").check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-ort-0").check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-vorhaben").fill("Wohnzimmer neu einrichten, ca. 30 m².");
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-vorname").fill("Erika");
    await page.locator("#beratung-nachname").fill("Muster");
    await page.locator("#beratung-email").fill("erika@example.com");
    await page.getByRole("button", { name: "Absenden" }).click();
    const h2 = page.locator("[data-confirmation] h2");
    await expect(h2).toBeVisible();
    await expect(page.locator("[data-confirmation]")).toBeFocused();
    await expect.poll(async () => (await h2.boundingBox())?.y ?? -1, { timeout: 5_000 }).toBeGreaterThanOrEqual(0);
  });

  test("Kontakt: Bestätigungs-H2 top >= 0", async ({ page }) => {
    await open(page, "/de/kontakt");
    await answer(page, "/api/upload/inquiry/kontakt", { success: true, data: {} });
    await page.locator("#kontakt-name").fill("Erika Muster");
    await page.locator("#kontakt-email").fill("erika@example.com");
    await page.locator("#kontakt-nachricht").fill("Ich interessiere mich für ein Sofa.");
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    const h2 = page.locator("[data-confirmation] h2");
    await expect(h2).toBeVisible();
    await expect.poll(async () => (await h2.boundingBox())?.y ?? -1, { timeout: 5_000 }).toBeGreaterThanOrEqual(0);
  });
});

test.describe("C3 Wizard-Komfort", () => {
  test("Schritt 1: sechs Karten, „Andere Anliegen“ zeigt den Rest; Entwurf übersteht Neuladen", async ({ page }) => {
    await open(page, "/de/beratung");
    await expect(page.locator("#beratung-art input[type=radio]")).toHaveCount(6);
    const more = page.locator("[data-beratung-more]");
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await more.click();
    await expect(page.locator("#beratung-art input[type=radio]")).toHaveCount(10);
    await page.locator("#beratung-art-1").check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-ort-0").check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-vorhaben").fill("Altbau, zwei Zimmer neu einrichten.");
    await page.locator("#beratung-vorhaben").blur();
    await page.reload();
    await settle(page);
    await expect(page.locator("[data-beratung-draft]")).toBeVisible();
    await expect(page.getByText("Schritt 3 von 4")).toBeVisible();
    await expect(page.locator("#beratung-vorhaben")).toHaveValue(/Altbau, zwei Zimmer/);
    await page.locator("[data-beratung-draft] button").click();
    await expect(page.getByText("Schritt 1 von 4")).toBeVisible();
  });
});

test.describe("axe auf den T1-Seiten", () => {
  for (const url of [
    "/de/beratung",
    "/de/beratung?thema=kueche&plan=https%3A%2F%2Fplatzhirsch.studio%2Fde%2Fkuechenplaner%3Fp%3Dabc",
    "/de/termin",
    "/de/termin?thema=sofa&ort=lindau&produkt=Minotti",
    "/de/kontakt",
    "/en/consultation",
    "/en/termin",
  ]) {
    test(`${url}: 0 Verstöße (WCAG 2.2 AA)`, async ({ page }) => {
      const { default: AxeBuilder } = await import("@axe-core/playwright");
      await open(page, url);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).exclude("nextjs-portal").analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
