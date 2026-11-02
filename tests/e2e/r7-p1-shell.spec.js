// r7-p1 (Fix-Team P1, Runde 2): Shell, Texte und Anfragepfad.
//   npx playwright test tests/e2e/r7-p1-shell.spec.js --project=desktop   (PW_WORKERS=1)
// Forms are only ever answered by route.fulfill (blockFormSends + mock), no
// real lead reaches the backoffice.
import { test, expect, devices } from "@playwright/test";
import { blockFormSends, dismissCookieBanner, settle } from "./helpers.js";
import { PROD, conciergeOn } from "./prod-mode.js";

const OK = { success: true, message: "ok", data: {} };

async function mockSend(page, path) {
  const sent = [];
  await page.route(`**${path}`, (route) => {
    if (route.request().method() !== "POST") return route.continue();
    sent.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(OK) });
  });
  return sent;
}

async function phone(browser) {
  const { defaultBrowserType: _ignored, ...pixel } = devices["Pixel 7"];
  const context = await browser.newContext({ ...pixel, locale: "de-AT" });
  return { context, page: await context.newPage() };
}

test.describe("Kontext erhalten (ux P1-1)", () => {
  test("Desktop: /de/yacht-interior → Header „Termin“ → Wizard mit Boot/Yacht vorausgewählt, Kontextzeile in Schritt 3", async ({ page }) => {
    await blockFormSends(page);
    await page.goto("/de/yacht-interior");
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    // Online-Kalender (Inhaber Nr. 12, bewusst geändert): Header-„Termin“ führt bei aktivem
    // Kalender auf /de/termin?thema=yacht; der Anfrage-Wizard ist über den Seiteninhalt erreichbar.
    const cta = page.locator("header a[data-header-cta]");
    await expect(cta).toHaveAttribute("href", /^\/de\/(termin|beratung)\?thema=yacht$/);
    await page.locator('main a[href="/de/beratung?thema=yacht"]').first().click();
    await page.waitForURL(/\/de\/beratung\?thema=yacht/);
    await settle(page);
    await page.locator("#beratung-art-0").check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.getByRole("radio", { name: "auf einem Boot oder einer Yacht" })).toBeChecked();
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.locator("#beratung-vorhaben")).toHaveValue(/Es geht um ein Boot oder eine Yacht\./);
    // ux P2-6: Wunschtermin above the textarea.
    const wish = await page.getByLabel("Wunschtag").boundingBox();
    const area = await page.locator("#beratung-vorhaben").boundingBox();
    expect(wish.y).toBeLessThan(area.y);
  });

  test("Pixel 7: mobile CTA-Leiste auf /de/yacht-interior führt mit ?thema=yacht in den Wizard", async ({ browser }) => {
    const { context, page } = await phone(browser);
    await blockFormSends(page);
    await page.goto("/de/yacht-interior");
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    const bar = page.getByRole("navigation", { name: "Schnellkontakt" });
    // Rat 9,5 B1 (bewusst geändert): mit Kalender heißt der Knopf „Termin wählen“
    // (Ziel /termin), ohne Kalender „Termin anfragen“ (Ziel /beratung) – ein Wort, ein Ziel.
    const termin = bar.getByRole("link", { name: /^Termin (wählen|anfragen)$/ });
    // Online-Kalender (Inhaber Nr. 12, bewusst geändert): bei aktivem Kalender führt die Leiste
    // auf /de/termin?thema=yacht (Planungstermin „Yacht-Interieur“ vorgewählt), sonst in den Wizard.
    await expect(termin).toHaveAttribute("href", /^\/de\/(termin|beratung)\?thema=yacht$/);
    const calendar = (await termin.getAttribute("href")).startsWith("/de/termin");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.4));
    await expect(bar).toBeInViewport({ timeout: 15_000 });
    await termin.click();
    await page.waitForURL(/\/de\/(termin|beratung)\?thema=yacht/);
    await settle(page);
    if (calendar) {
      await expect(page.getByRole("radio", { name: "Yacht-Interieur" })).toBeChecked();
    } else {
      await page.locator("#beratung-art-0").check();
      await page.getByRole("button", { name: "Weiter" }).click();
      await expect(page.getByRole("radio", { name: "auf einem Boot oder einer Yacht" })).toBeChecked();
    }
    // KI entry is in the bar (German pages), not as a floating button.
    await context.close();
  });

  // Runde 5 (Fix-Team P3, ux P1-3 und P2-4, bewusst geänderte Erwartung): die
  // Rolle gewinnt gegen ?thema=objekt (Schritt 1 „Architektur- oder
  // Planungsbüro“, Schritt 2 offen), und die Stadt steht nicht mehr im
  // Freitext des Kunden, sondern als Kontextzeile über Schritt 1 und im
  // Herkunft-Block der Anfrage (tests/e2e/r9-p3-conversion.spec.js).
  test("?thema=objekt&rolle=architekt&ort=st-gallen: Architekturbüro vorausgewählt, Ort als eigene Zeile", async ({ page }) => {
    await blockFormSends(page);
    await page.goto("/de/beratung?thema=objekt&rolle=architekt&ort=st-gallen");
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    await expect(page.locator("[data-beratung-city]")).toContainText("St. Gallen");
    await expect(page.getByRole("radio", { name: /Architektur- oder Planungsbüros/ })).toBeChecked();
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.locator('input[name="step2"]:checked')).toHaveCount(0);
    await page.locator("#beratung-ort-0").check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.locator("#beratung-vorhaben")).toHaveValue(
      "Projekt für Hotel, Gastronomie oder Objekt.\nIch plane als Architektin, Architekt oder Planer für meine Kundschaft.\n"
    );
  });
});

test.describe("Bestätigung nach dem Absenden (ux P1-6, gemockt)", () => {
  test("Beratung: „Danke, Erika.“, Zusammenfassung, drei Schritte, Telefon, Arbeitsweise, Anfahrt, keine Frist", async ({ page }) => {
    await blockFormSends(page);
    const sent = await mockSend(page, "/api/upload/inquiry/beratung");
    await page.goto("/de/beratung?thema=kueche");
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-ort-1").check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-vorhaben").fill("Neue Küche für eine Wohnung in Bregenz.");
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-vorname").fill("Erika");
    await page.locator("#beratung-nachname").fill("Muster");
    await page.locator("#beratung-email").fill("erika@example.com");
    await page.locator("#beratung-telefon").fill("+43 664 1234567");
    await page.getByRole("button", { name: "Absenden" }).click();
    await expect.poll(() => sent.length).toBe(1);
    const box = page.locator("[data-confirmation=beratung]");
    await expect(box).toBeFocused();
    await expect(box.getByRole("heading", { name: "Danke, Erika." })).toBeVisible();
    await expect(box).toContainText("eine Küche");
    await expect(box).toContainText("in einer Wohnung");
    await expect(box.locator("ol > li")).toHaveCount(3);
    await expect(box).toContainText("Kaffee");
    await expect(box).toContainText("Bei Bedarf kommen wir zu Ihnen");
    await expect(box.getByRole("link", { name: /\+43 5574 46255/ })).toHaveAttribute("href", "tel:+43557446255");
    await expect(box.getByRole("link", { name: "So arbeiten wir" })).toHaveAttribute("href", "/de/arbeitsweise");
    await expect(box.getByRole("link", { name: /Anfahrt planen/ })).toBeVisible();
    await expect(box).not.toContainText(/innerhalb von|Werktag|24 Stunden|48 Stunden/);
  });

  test("Kontakt: gleiche Bestätigung mit Vorname", async ({ page }) => {
    await blockFormSends(page);
    const sent = await mockSend(page, "/api/upload/inquiry/kontakt");
    await page.goto("/de/kontakt");
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    await page.locator("#kontakt-name").fill("Erika Muster");
    await page.locator("#kontakt-email").fill("erika@example.com");
    await page.locator("#kontakt-nachricht").fill("Ich interessiere mich für ein Sofa.");
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    await expect.poll(() => sent.length).toBe(1);
    const box = page.locator("[data-confirmation=kontakt]");
    await expect(box).toBeFocused();
    await expect(box.getByRole("heading", { name: "Danke, Erika." })).toBeVisible();
    await expect(box).toContainText("Ich interessiere mich für ein Sofa.");
    await expect(box.locator("ol > li")).toHaveCount(3);
  });
});

test.describe("KI-Knopf (ux P1-4)", () => {
  for (const path of ["/de", "/de/beratung", "/de/kontakt"]) {
    test(`Pixel 7 ${path}: kein schwebender KI-Knopf`, async ({ browser }) => {
      const { context, page } = await phone(browser);
      await blockFormSends(page);
      await page.goto(path);
      await settle(page);
      await dismissCookieBanner(page, 8_000);
      await page.evaluate(() => window.scrollTo(0, 900));
      await page.waitForTimeout(2500);
      await expect(page.locator("[data-concierge-launcher]:visible")).toHaveCount(0);
      // Runde 5 (Fix-Team P3, ux P1-2, bewusst geänderte Erwartung): den
      // KI-Eintrag gibt es nur mit echtem Schlüssel (conciergeLive(), auch
      // /api/labs/status) – ohne ihn kein Knopf und kein Link auf /concierge.
      if (path === "/de" && (await conciergeOn(page.request))) {
        const ai = page.locator("[data-cta-ai]");
        await expect(ai).toHaveAttribute("href", "/de/concierge");
      } else {
        await expect(page.locator("[data-cta-ai]")).toHaveCount(0);
      }
      await context.close();
    });
  }

  test("Desktop /de: Launcher 48 px hoch; auf /de/kontakt nicht vorhanden", async ({ page, request }) => {
    // R3 (P4-technik): Ohne KI-Schlüssel ist der Concierge in Produktion absichtlich aus,
    // der Launcher fehlt dann zu Recht. Kriterium wie im Launcher: /api/labs/status.
    const on = !PROD || (await conciergeOn(request));
    await blockFormSends(page);
    if (!on) {
      await page.goto("/de");
      await settle(page);
      await page.waitForTimeout(2500);
      await expect(page.locator("[data-concierge-launcher]")).toHaveCount(0);
      return;
    }
    await page.goto("/de");
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    const btn = page.locator("[data-concierge-launcher]");
    // QM-Endabnahme 02.11.2026 (bewusst geändert): Reiter bleibt über der Hero-Bühne verborgen (QM shell-home r2).
    await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 1.5)));
    await expect(btn).toBeVisible({ timeout: 30_000 });
    // QM-Endabnahme 02.11.2026 (bewusst geändert): Reiter steht senkrecht am Rand (shell-home) – Zielgröße ≥ 44 px.
    const box = await btn.boundingBox();
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
    await page.goto("/de/kontakt");
    await settle(page);
    await page.waitForTimeout(2500);
    await expect(page.locator("[data-concierge-launcher]")).toHaveCount(0);
  });
});

test.describe("Menü und Footer (ux P1-2, P2-3, seo P2-9)", () => {
  test("Planen & Erleben: Hotel-Einstieg, Gruppen ≤ 7, Footer-Spalte „Planen & Erleben“ mit Portal-Login", async ({ page }) => {
    await page.goto("/de");
    await settle(page);
    const html = await page.content();
    // Welle 2 (Inhaber Nr. 13, bewusst geändert): Hotel-Einstieg ist die Seite Hotel & Objekt.
    expect(html).toContain('href="/de/hotel-objekt"');
    const footer = page.locator("#site-footer");
    // QM-Endabnahme 02.11.2026 (bewusst geändert): Footer-Spalte heißt „Planen“ (Footer-Neuordnung shell-home).
    await expect(footer.getByRole("heading", { name: "Planen", exact: true })).toHaveCount(1);
    // Runde 3 P5 (seo P1-3): der Footer verlinkt keine noindex-Seite mehr –
    // das Portal-Login (noindex, nofollow) bleibt im Menü „Planen & Erleben“.
    await expect(footer.locator('a[href="/de/portal/login"]')).toHaveCount(0);
    await expect(footer.locator('a[href="/de/portal"]')).toHaveCount(0);
    // Endtest 29.10.2026 (bewusst geändert): Die Panel-Links des Mega-Menüs stehen
    // seit R4/P4 (r5-perf-shell.spec.js „Panel-Links erst beim Öffnen“) nicht mehr im
    // DOM vor dem Öffnen – das Portal-Login wird im geöffneten Panel geprüft.
    await dismissCookieBanner(page, 8_000);
    await page.locator("#ph-nav-trigger-services").click();
    await expect(page.locator('#ph-nav-panel-services a[href="/de/portal/login"]')).toHaveCount(1);
  });
});

test.describe("Sprachumschalter (technik P1-3a)", () => {
  test("News-Artikel: kein Sprachlink auf /nouvelles/<slug> oder /notizie/<slug>, alle Ziele 200", async ({ page, request }) => {
    test.setTimeout(900_000);
    await page.goto("/de/news");
    await settle(page);
    const articles = [...new Set(await page.locator('main a[href^="/de/news/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href"))))];
    expect(articles.length).toBeGreaterThan(0);
    const bad = [];
    for (const href of articles) {
      const res = await request.get(href);
      const html = await res.text();
      const langLinks = [...html.matchAll(/<a [^>]*>/g)]
        .map((m) => m[0])
        .filter((tag) => /hreflang="[a-z]{2}"/i.test(tag))
        .map((tag) => (tag.match(/href="([^"]+)"/) || [])[1])
        .filter(Boolean);
      if (!langLinks.length) bad.push(`${href}: keine Sprachlinks gefunden`);
      for (const l of new Set(langLinks)) {
        if (/\/(nouvelles|notizie)\/./.test(l)) bad.push(`${href} → ${l}`);
        else if (l.includes("/news/")) {
          const r = await request.get(l, { maxRedirects: 0 });
          if (r.status() !== 200) bad.push(`${href} → ${l} ${r.status()}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
