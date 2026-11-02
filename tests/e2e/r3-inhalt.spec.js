// tests/e2e/r3-inhalt.spec.js — R3-inhalt: news filter, Lead-Restliste P3-3/P3-4,
// career without react-share, 404 without the old fallback.
//
// SAFETY: every POST to /api/** is intercepted (blockFormSends) — nothing is
// sent to the backoffice, no mail goes out.
//
// Run: npx playwright test tests/e2e/r3-inhalt.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import { blockFormSends, dismissCookieBanner, settle } from "./helpers.js";

const VOICE = /\b(exklusiv\w*|luxus\w*|luxuriös\w*|einzigartig\w*|größte\w*)\b/i;

async function open(page, url) {
  await blockFormSends(page);
  await page.goto(url);
  await settle(page);
  await dismissCookieBanner(page, 8_000);
}

test.describe("News", () => {
  test("list: no discount promotions, advertising words defused", async ({ page }) => {
    await open(page, "/de/news");
    const main = page.locator("main");
    // Rat 9,5 A15 (T6, bewusst geändert): H1 mit Thema und Ort (inhalt.news.h1).
    await expect(main.getByRole("heading", { level: 1 })).toHaveText("News aus dem Studio in Lochau");
    await expect(main).not.toContainText(/Lagerabverkauf|Sortimentswechsel|\d\d ?% (reduziert|Rabatt)/);
    await expect(main).not.toContainText(VOICE);
    // The card can sit behind „Weitere Beiträge anzeigen“ – it must be in the HTML.
    await expect(main.locator('a[href*="/news/minotti-exklusives-moebeldesign-fuer-draussen"]').first()).toBeAttached();
  });

  // Runde 3 P5 (seo P1-6): bewusst geändert – eine beendete Aktion ist keine
  // noindex-Seite mehr, sondern ein 308 auf den News-Hub ihrer Sprache.
  test("detail: same URL, defused H1 and description; withheld = 308 to the news hub", async ({ page, request }) => {
    await open(page, "/de/news/minotti-exklusives-moebeldesign-fuer-draussen");
    await expect(page.getByRole("heading", { level: 1 })).not.toContainText(VOICE);
    await expect(page.locator("main")).not.toContainText(VOICE);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^index/);
    await expect(page.locator('meta[name="description"]')).not.toHaveAttribute("content", VOICE);

    for (const [from, to] of [
      ["/de/news/platzhirsch-lagerabverkauf-kuechen-betten-und-sofas", "/de/news"],
      ["/fr/news/sortimentswechsel-stuehle-sessel-und-accessoires", "/fr/nouvelles"],
      ["/it/notizie/sommer-inspiration-fuer-ihren-aussenbereich", "/it/notizie"],
    ]) {
      const res = await request.get(from, { maxRedirects: 0 });
      expect(res.status(), from).toBe(308);
      expect(new URL(res.headers().location, "http://x").pathname, from).toBe(to);
    }
  });

  test("sitemap: withheld news not listed", async ({ request }) => {
    const res = await request.get("/sitemap-news.xml");
    expect(res.status()).toBe(200);
    const xml = await res.text();
    expect(xml).not.toContain("platzhirsch-lagerabverkauf-kuechen-betten-und-sofas");
    expect(xml).not.toContain("sortimentswechsel-stuehle-sessel-und-accessoires");
    expect(xml).toContain("/news/minotti-exklusives-moebeldesign-fuer-draussen");
  });
});

test.describe("Lead-Restliste", () => {
  test("Beratung from a product page: prefix in the page language (EN)", async ({ page }) => {
    await open(page, "/en/consultation?produkt=Minotti%20Hamilton");
    await page.locator("#beratung-art-0").check();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.locator("#beratung-ort-0").check();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.locator("#beratung-vorhaben")).toHaveValue(/^Enquiry about: Minotti Hamilton\n/);
  });

  test("Beratung DE keeps „Anfrage zu:“", async ({ page }) => {
    await open(page, "/de/beratung?produkt=Minotti%20Hamilton");
    await page.locator("#beratung-art-0").check();
    await page.getByRole("button", { name: "Weiter", exact: true }).click();
    await page.locator("#beratung-ort-0").check();
    await page.getByRole("button", { name: "Weiter", exact: true }).click();
    await expect(page.locator("#beratung-vorhaben")).toHaveValue(/^Anfrage zu: Minotti Hamilton\n/);
  });

  test("Produktanfrage: back link says Merkliste, not Wunschliste", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("cart", JSON.stringify([{ id: 1, produkte_id: 4711, name: "Testprodukt", category: "Sofas", image: null }]));
    });
    await open(page, "/de/merkliste");
    await page.getByRole("button", { name: /Anfrage|senden/i }).first().click();
    await expect(page.getByRole("button", { name: "Zurück zur Merkliste" })).toBeVisible();
    // Inhaber Nr. 13 (bewusst geändert): Die Merkliste bietet jetzt „Als Wunschliste teilen“
    // (Einzug/Hochzeit) – das Wort darf dort stehen, nur der Rücklink heißt weiter „Merkliste“.
    await expect(page.getByRole("button", { name: /Zurück zur Wunschliste/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Zurück zur Wunschliste/ })).toHaveCount(0);
  });
});

test.describe("Career and 404", () => {
  test("career page: no react-share markup, application by e-mail", async ({ page }) => {
    await open(page, "/de/ueber-uns/karriere");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".react-share__ShareButton, [class*='react-share']")).toHaveCount(0);
    // Bewusst geändert (Runde 4, r4-recht-inhalt P1-3): Bewerbungen an die
    // allgemeine Adresse aus src/lib/site.js, keine unbestätigte Ansprechperson.
    await expect(page.locator('a[href^="mailto:info@platzhirsch.studio"]').first()).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/Helmut Schuster|faire Bezahlung/);
  });

  test("404 reads its texts from the messages (DE and FR)", async ({ page }) => {
    await page.goto("/de/diese-seite-gibt-es-nicht-r3");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Diese Seite gibt es hier nicht.");
    await expect(page.getByRole("link", { name: "Zur Startseite", exact: true })).toBeVisible();
    // F5 (Fix-Runde 1, bewusst geändert): unknown URLs under any locale now
    // get the prerendered global 404 (src/app/not-found.js, server-rendered,
    // <html lang="de">) instead of an on-demand render that Next 16 sent as an
    // empty client-rendered shell without lang (release-check.md F5.3). The
    // French visitor finds the way home in French at the top of that page.
    const res = await page.goto("/fr/cette-page-nexiste-pas-r3");
    expect(res.status()).toBe(404);
    // Runde 2: the dev server renders the localized [locale]/not-found (French
    // button "Vers l’accueil" → /fr), the production build the global 404 with
    // the French header link – both bring the visitor home in French.
    await expect(page.locator('a[href="/fr"]').filter({ hasText: "Vers l’accueil" }).first()).toBeVisible();
  });
});
