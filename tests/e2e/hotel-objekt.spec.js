// tests/e2e/hotel-objekt.spec.js – Seite Hotel & Objekt (Welle 2, Team Hotel).
// SICHERHEIT: jeder POST an /api/** wird abgefangen (blockFormSends), die
// Anfrage-Route per page.route beantwortet – nichts erreicht das Backoffice.
// Run: PW_WORKERS=1 npx playwright test tests/e2e/hotel-objekt.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { blockFormSends, dismissCookieBanner, jsonLdNodes, measureOverflow, settle } from "./helpers.js";

const OK = { success: true, message: "Form submitted successfully", data: {} };

async function open(page, url) {
  await blockFormSends(page);
  await page.goto(url);
  await settle(page);
  await dismissCookieBanner(page, 8_000);
}

test.describe("Hotel & Objekt", () => {
  test("DE: Metadaten, hreflang de/en, JSON-LD, kein Referenz-Abschnitt ohne Freigabe", async ({ request }) => {
    const res = await request.get("/de/hotel-objekt");
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/<meta name="robots" content="index, follow"/);
    expect(html).toContain('<link rel="canonical" href="https://platzhirsch.studio/de/hotel-objekt"/>');
    expect(html).toContain('hrefLang="en" href="https://platzhirsch.studio/en/hotel-objekt"');
    // Inhaber 01.11.2026 (bewusst geändert): FR/IT sind eigene Seiten und stehen im hreflang-Satz.
    // Nur die <link rel="alternate">-Tags: der Sprachumschalter im Kopf trägt eigene <a hrefLang>.
    const alternates = (html.match(/<link rel="alternate"[^>]*>/g) || []).join(" ");
    expect(alternates).toContain('hrefLang="fr" href="https://platzhirsch.studio/fr/hotel-objekt"');
    expect(alternates).toContain('hrefLang="it" href="https://platzhirsch.studio/it/hotel-objekt"');
    const types = jsonLdNodes(html).map((n) => n["@type"]);
    for (const t of ["WebPage", "BreadcrumbList", "Service", "FAQPage"]) expect(types).toContain(t);
    expect(html).not.toContain("data-hotel-references");
    expect(html).toContain("Bild: Ezarri, ezarri.com");
  });

  // Inhaber 01.11.2026 (bewusst geändert): vorher 308 → /en/hotel-objekt.
  for (const [locale, h1, ogLocale] of [["fr", /Aménager des hôtels/, "fr_FR"], ["it", /Arredare hotel/, "it_IT"]]) {
    test(`${locale}: eigene Seite (200, keine Weiterleitung), Canonical, hreflang reziprok, OG-Karte`, async ({ request }) => {
      const res = await request.get(`/${locale}/hotel-objekt`, { maxRedirects: 0 });
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).toMatch(new RegExp(`<html[^>]*lang="${locale}`));
      expect(html).toContain(`<link rel="canonical" href="https://platzhirsch.studio/${locale}/hotel-objekt"/>`);
      const alternates = (html.match(/<link rel="alternate"[^>]*>/g) || []).join(" ");
      for (const l of ["de", "en", "fr", "it", "x-default"]) expect(alternates).toContain(`hrefLang="${l}"`);
      expect(html).toMatch(new RegExp(`<meta property="og:locale" content="${ogLocale}"`));
      expect(html).toContain(`https://platzhirsch.studio/${locale}/hotel-objekt/opengraph-image`);
      const types = jsonLdNodes(html).map((n) => n["@type"]);
      for (const t of ["WebPage", "BreadcrumbList", "Service", "FAQPage"]) expect(types).toContain(t);
      expect(html).toMatch(h1);
      // ImageResponse compiles on first request in dev – more time than the 15 s default.
      const og = await request.get(`/${locale}/hotel-objekt/opengraph-image`, { timeout: 90_000 });
      expect(og.status()).toBe(200);
      expect(og.headers()["content-type"]).toContain("image/png");
    });
  }

  test("FR: Anfrage über den bestehenden Lead-Weg (abgefangen), Fehler und Bestätigung auf Französisch", async ({ page }) => {
    await open(page, "/fr/hotel-objekt");
    const sent = [];
    await page.route("**/api/beratung_anfrage", (route) => {
      if (route.request().method() !== "POST") return route.continue();
      sent.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(OK) });
    });
    await page.getByRole("button", { name: "Envoyer la demande" }).click();
    await expect(page.locator("#ho-haus")).toBeFocused();
    await expect(page.locator("#ho-haus-fehler")).toContainText("Veuillez indiquer le nom de l’établissement.");
    await page.locator("#ho-haus").fill("Hôtel Test");
    await page.locator("#ho-name").fill("Anne Martin");
    await page.locator("#ho-email").fill("anne@example.com");
    await page.locator("#ho-nachricht").fill("Réaménager chambres et lobby");
    await page.getByRole("button", { name: "Envoyer la demande" }).click();
    await expect(page.locator("[data-hotel-success]")).toContainText("Merci, Anne.");
    expect(sent).toHaveLength(1);
    expect(sent[0].bitte_beschreiben_sie_ihr_vorhaben).toMatch(/^\[Anfrage Hotel & Objekt\]\nHaus: Hôtel Test/);
    expect(sent[0].bitte_beschreiben_sie_ihr_vorhaben).toContain("Seite: Hotel & Objekt (FR)");
    expect(sent[0].vorname).toBe("Anne");
    expect(sent[0].nachname).toBe("Martin");
  });

  test("Leeres Absenden: Fehler am Feld, Fokus auf dem ersten, Zusammenfassung", async ({ page }) => {
    await open(page, "/de/hotel-objekt#anfrage");
    await page.getByRole("button", { name: "Anfrage senden" }).click();
    const haus = page.locator("#ho-haus");
    await expect(haus).toBeFocused();
    await expect(haus).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#ho-haus-fehler")).toBeVisible();
    await expect(page.locator('[data-hotel-form] [role="status"][aria-live="polite"]')).toContainText("Bitte prüfen Sie Ihre Angaben");
  });

  // Rat 9,5 B10 (bewusst geändert): zwei Stufen – Haus, Name (ein Feld), E-Mail und Vorhaben sind
  // Pflicht; Ort, Art, Zimmer, Bereiche und Zeitfenster stehen unter „Details ergänzen“.
  test("Anfrage geht über den bestehenden Lead-Weg (abgefangen) mit Haus, Zimmerzahl und Zeitfenster", async ({ page }) => {
    await open(page, "/de/hotel-objekt");
    const sent = [];
    await page.route("**/api/beratung_anfrage", (route) => {
      if (route.request().method() !== "POST") return route.continue();
      sent.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(OK) });
    });
    await page.locator("#ho-haus").fill("Hotel Testhaus");
    await page.locator("#ho-name").fill("Erika Test");
    await page.locator("#ho-email").fill("erika@example.com");
    await page.locator("#ho-nachricht").fill("Zimmer und Lobby neu einrichten");
    await page.locator("[data-hotel-details-toggle]").click();
    await page.locator("#ho-ort").fill("Lindau");
    await page.locator("#ho-art").selectOption("hotel");
    await page.locator("#ho-zimmer").fill("40");
    await page.getByLabel("Spa und Pool").check();
    await page.locator("#ho-zeitfenster").selectOption("12");
    await page.getByRole("button", { name: "Anfrage senden" }).click();
    await expect(page.locator("[data-hotel-success]")).toBeFocused();
    expect(sent).toHaveLength(1);
    const body = sent[0];
    expect(body.bei_meiner_anfrage_geht_es_um).toBe("ein Objekt oder Hotel");
    expect(body.das_projekt_soll_verwirklicht_werden).toBe("in einem Hotel oder einer Gastronomie");
    expect(body.bitte_beschreiben_sie_ihr_vorhaben).toMatch(/^\[Anfrage Hotel & Objekt\]\nHaus: Hotel Testhaus\nOrt: Lindau\nArt: Hotel\nZimmer\/Einheiten: 40\nBereiche: Spa und Pool\nZeitfenster: In 6 bis 12 Monaten/);
    expect(body.bitte_beschreiben_sie_ihr_vorhaben).toContain("Kontext: Seite: Hotel & Objekt");
    expect(body.vorname).toBe("Erika");
    expect(body.nachname).toBe("Test");
    expect(body.website).toBe("");
    expect(typeof body._t).toBe("number");
    expect(body.lead_ref).toMatch(/^[0-9a-f-]{36}$/);
  });

  // Rat 9,5 B1 (bewusst geändert): Wort und Ziel kommen aus dem zentralen Terminhelfer
  // (src/lib/forms/terminLink.js) – mit Kalender „Book a visit“ → /termin, sonst
  // „Request a visit“ → Beratungsseite; das Thema hotel läuft immer mit.
  test("Termin-CTA trägt das Thema Hotel", async ({ page }) => {
    await open(page, "/en/hotel-objekt");
    const cta = page.getByRole("link", { name: /^(Book|Request) a visit/ }).last();
    await expect(cta).toHaveAttribute("href", /^\/en\/(termin|consultation)\?thema=hotel$/);
  });

  for (const locale of ["de", "en", "fr", "it"]) {
    test(`${locale}: axe WCAG 2.2 AA ohne serious/critical, 375 px ohne Überlauf`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await open(page, `/${locale}/hotel-objekt`);
      const overflow = await measureOverflow(page);
      expect(overflow.sw).toBeLessThanOrEqual(overflow.vw + 1);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .include("[data-hotel-page]")
        .analyze();
      const severe = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(severe.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }

  test("Chalets & Ferienwohnungen: Knopf belegt das Formular mit Chalet vor, Anfrage mit Kontext chalet (abgefangen)", async ({ page }) => {
    await open(page, "/de/hotel-objekt");
    const sent = [];
    await page.route("**/api/beratung_anfrage", (route) => {
      if (route.request().method() !== "POST") return route.continue();
      sent.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(OK) });
    });
    const section = page.locator("[data-hotel-chalets]");
    // QM-Endabnahme 02.11.2026 (bewusst geändert): H2 trägt weiche Trennstellen (U+00AD) für 200-%-Zoom.
    await expect(section.getByRole("heading", { level: 2 })).toHaveText(/Schl­?üs­?sel­?fertig/);
    await section.getByRole("link", { name: "Chalet oder Ferienwohnung anfragen" }).click();
    await expect(page).toHaveURL(/#anfrage-chalet$/);
    // B10: der Chalet-Link klappt die Details auf und belegt die Art vor
    await expect(page.locator("#ho-art")).toBeVisible();
    await expect(page.locator("#ho-art")).toHaveValue("chalet");
    await page.locator("#ho-haus").fill("Chalet Test");
    await page.locator("#ho-ort").fill("Lech");
    await page.locator("#ho-zeitfenster").selectOption("12");
    await page.locator("#ho-name").fill("Erika Muster");
    await page.locator("#ho-email").fill("erika@example.com");
    await page.locator("#ho-nachricht").fill("Chalet mit vier Wohnungen einrichten");
    await page.getByRole("button", { name: "Anfrage senden" }).click();
    await expect.poll(() => sent.length).toBe(1);
    expect(sent[0].bitte_beschreiben_sie_ihr_vorhaben).toMatch(/^\[Anfrage Chalet & Ferienwohnung\]/);
    expect(sent[0].bitte_beschreiben_sie_ihr_vorhaben).toContain("Kontext: Seite: Hotel & Objekt · Kontext: chalet");
    expect(sent[0].das_projekt_soll_verwirklicht_werden).toBe("in einem Chalet oder einer Ferienwohnung");
  });
});
