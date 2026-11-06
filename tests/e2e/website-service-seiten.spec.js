// tests/e2e/website-service-seiten.spec.js – Website-Seiten aus Bericht 60
// („Website-Seiten“, 04.11.2026): /newsletter/bestaetigen, /newsletter/abmelden
// (DE/EN/FR/IT, noindex), /adventsabend/absagen (nur DE, noindex),
// /service/reklamation (DE/EN/FR/IT, index). Formular-Validierung im Browser,
// 375 px ohne horizontalen Überlauf, axe WCAG 2.2 AA.
// Es wird NICHTS an ein Backend gesendet: jeder POST an /<locale>/service/senden/*
// wird im Browser abgefangen (page.route) und mit einer Attrappe beantwortet.
// Läuft im Projekt desktop; 375 px über setViewportSize.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissCookieBanner, measureOverflow, robotsDirectives } from "./helpers.js";

const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const LOCALES = ["de", "en", "fr", "it"];
const TOKEN = "abcdefghijklmnop1234567890_-XYZ";
const H1 = {
  bestaetigen: { de: "Anmeldung bestätigen", en: "Confirm your sign-up", fr: "Confirmer votre inscription", it: "Confermi l’iscrizione" },
  abmelden: { de: "Newsletter abbestellen", en: "Unsubscribe from the newsletter", fr: "Se désabonner de la newsletter", it: "Annullare l’iscrizione alla newsletter" },
  reklamation: { de: "Reklamation melden", en: "Report a complaint", fr: "Signaler une réclamation", it: "Segnalare un reclamo" },
};

async function axeClean(page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
  const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

/** Fängt jeden POST an /<locale>/service/senden/* ab; gibt die gesendeten Bodies zurück. */
async function mockSend(page, answer = () => ({ status: 200, body: { success: true, status: "bestaetigt" } })) {
  const sent = [];
  await page.route(/\/service\/senden\//, async (route) => {
    const req = route.request();
    sent.push({ url: req.url(), body: req.postData() });
    const a = answer(req.url());
    await route.fulfill({ status: a.status, contentType: "application/json", body: JSON.stringify(a.body) });
  });
  return sent;
}

test.describe("Website-Service-Seiten", () => {
  test("Smoke 4 Sprachen: 200, H1, Token-Seiten noindex + no-referrer, Reklamation index mit hreflang", async ({ request }) => {
    for (const locale of LOCALES) {
      for (const [slug, pfad] of [
        ["bestaetigen", "/newsletter/bestaetigen"],
        ["abmelden", "/newsletter/abmelden"],
      ]) {
        const res = await request.get(`/${locale}${pfad}?token=${TOKEN}`);
        expect(res.status(), `${locale}${pfad}`).toBe(200);
        const text = await res.text();
        expect(robotsDirectives({ text, headers: res.headers() }), `${locale}${pfad}`).toContain("noindex");
        expect(text).toMatch(/<meta name="referrer" content="no-referrer"/);
        expect(text).toContain(H1[slug][locale]);
      }
      const rek = await request.get(`/${locale}/service/reklamation`);
      expect(rek.status(), locale).toBe(200);
      const rt = await rek.text();
      expect(robotsDirectives({ text: rt, headers: rek.headers() }), locale).not.toContain("noindex");
      expect(rt).toContain(H1.reklamation[locale]);
      for (const l of LOCALES) expect(rt, `${locale} hreflang ${l}`).toMatch(new RegExp(`hrefLang="${l}"[^>]*href="https://platzhirsch.studio/${l}/service/reklamation"`));
    }
    const adv = await request.get(`/de/adventsabend/absagen?token=${TOKEN}`);
    expect(adv.status()).toBe(200);
    expect(robotsDirectives({ text: await adv.text(), headers: adv.headers() })).toContain("noindex");
    expect((await request.get("/en/adventsabend/absagen")).status()).toBe(404);
  });

  test("Absende-Route: GET 405, unbekannte Art 404, fremde Herkunft 403, ungültiges Token 4xx", async ({ request }) => {
    expect((await request.get("/de/service/senden/newsletter-bestaetigen")).status()).toBe(405);
    expect((await request.post("/de/service/senden/unbekannt", { data: {} })).status()).toBe(404);
    const foreign = await request.post("/de/service/senden/newsletter-bestaetigen", { data: { token: TOKEN }, headers: { Origin: "https://example.com" } });
    expect(foreign.status()).toBe(403);
    const bad = await request.post("/de/service/senden/newsletter-bestaetigen", { data: { token: "x" } });
    expect([404, 400]).toContain(bad.status());
    expect((await bad.json()).code).toBe("invalid_token");
  });

  test("Newsletter bestätigen: ohne Token Hinweis, mit Token erst nach Klick POST, dann bestätigt; axe", async ({ page }) => {
    const sent = await mockSend(page);
    await page.goto("/de/newsletter/bestaetigen");
    await dismissCookieBanner(page);
    await expect(page.locator('[data-link-state="missing"]')).toBeVisible();
    await page.goto(`/de/newsletter/bestaetigen?token=${TOKEN}`);
    await expect(page.locator('[data-link-state="ready"]')).toBeVisible();
    await page.waitForTimeout(300);
    expect(sent.length, "kein POST beim Laden").toBe(0);
    await axeClean(page);
    await page.locator("[data-link-action]").click();
    await expect(page.locator('[data-link-state="done"]')).toBeVisible();
    expect(sent.length).toBe(1);
    expect(sent[0].url).toMatch(/\/de\/service\/senden\/newsletter-bestaetigen$/);
    expect(JSON.parse(sent[0].body)).toEqual({ token: TOKEN });
  });

  test("Newsletter bestätigen: abgelaufen zeigt erneute Anmeldung", async ({ page }) => {
    await mockSend(page, () => ({ status: 410, body: { success: false, code: "expired" } }));
    await page.goto(`/fr/newsletter/bestaetigen?token=${TOKEN}`);
    await page.locator("[data-link-action]").click();
    await expect(page.locator('[data-link-state="expired"]')).toBeVisible();
    await expect(page.getByRole("link", { name: "S’inscrire à nouveau" })).toHaveAttribute("href", /\/fr\/newsletter$/);
  });

  test("Newsletter abmelden: ohne Token E-Mail-Feld mit Prüfung; ungültiges Token → E-Mail-Weg; axe", async ({ page }) => {
    const sent = await mockSend(page, () => ({ status: 404, body: { success: false, code: "invalid_token" } }));
    await page.goto("/en/newsletter/abmelden");
    await dismissCookieBanner(page);
    await expect(page.locator('[data-link-state="email"]')).toBeVisible();
    await page.locator("[data-link-email-submit]").click();
    await expect(page.getByText("Please enter a valid e-mail address.")).toBeVisible();
    expect(sent.length, "ungültige Adresse wird nicht gesendet").toBe(0);
    await axeClean(page);
    await page.goto(`/it/newsletter/abmelden?token=${TOKEN}`);
    await page.locator("[data-link-action]").click();
    await expect(page.locator('[data-link-state="email"]')).toBeVisible();
    await expect(page.locator('[data-link-state="email"] [role="alert"]')).toContainText("non è valido");
  });

  test("Adventsabend absagen (DE): Klick → abgesagt", async ({ page }) => {
    const sent = await mockSend(page, () => ({ status: 200, body: { success: true, status: "abgesagt" } }));
    await page.goto(`/de/adventsabend/absagen?token=${TOKEN}`);
    await dismissCookieBanner(page);
    await page.locator("[data-link-action]").click();
    await expect(page.locator('[data-link-state="done"]')).toContainText("Ihre Anmeldung ist abgesagt.");
    expect(sent[0].url).toMatch(/\/de\/service\/senden\/adventsabend-absagen$/);
  });

  test("Reklamation: leeres Formular → Fehler an den Feldern, nichts gesendet; ungültige E-Mail; axe", async ({ page }) => {
    const sent = await mockSend(page);
    await page.goto("/de/service/reklamation");
    await dismissCookieBanner(page);
    await expect(page.locator("h1")).toHaveCount(1);
    await page.locator("[data-reklamation-submit]").click();
    await expect(page.locator("[data-reklamation-summary]")).toHaveText("Bitte prüfen Sie 6 Felder.");
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(6);
    await expect(page.locator('input[name="produkt"]')).toBeFocused();
    await page.locator('input[name="produkt"]').fill("Sofa, Stoff grau");
    await page.locator('textarea[name="beschreibung"]').fill("Kurz");
    await page.locator('input[name="vorname"]').fill("Erika");
    await page.locator('input[name="nachname"]').fill("Muster");
    await page.locator('input[name="email"]').fill("erika@");
    await page.locator("[data-reklamation-submit]").click();
    await expect(page.getByText("Bitte geben Sie eine gültige E-Mail-Adresse ein.")).toBeVisible();
    await expect(page.getByText("mindestens 20 Zeichen).")).toBeVisible();
    expect(sent.length).toBe(0);
    await axeClean(page);
  });

  test("Reklamation EN: gültiges Formular → ein POST (Attrappe), Referenz und Hinweis auf Fotos", async ({ page }) => {
    const sent = await mockSend(page, () => ({ status: 200, body: { success: true, referenz: "SF-TEST-1" } }));
    await page.goto("/en/service/reklamation");
    await dismissCookieBanner(page);
    await page.locator('input[name="produkt"]').fill("Sofa, grey fabric");
    await page.locator('select[name="art"]').selectOption("transportschaden");
    await page.locator('textarea[name="beschreibung"]').fill("The backrest was torn during delivery last week.");
    await page.locator('input[name="vorname"]').fill("Jane");
    await page.locator('input[name="nachname"]').fill("Doe");
    await page.locator('input[name="email"]').fill("jane@example.com");
    await page.locator('input[name="einwilligung"]').check();
    await page.waitForTimeout(3100); // Zeitfalle der Route (3 s)
    await page.locator("[data-reklamation-submit]").click();
    await expect(page.locator('[data-reklamation-state="done"]')).toBeVisible();
    await expect(page.locator("[data-reklamation-ref]")).toHaveText("Your reference: SF-TEST-1");
    expect(sent.length).toBe(1);
    const body = JSON.parse(sent[0].body);
    expect(body).toMatchObject({ produkt: "Sofa, grey fabric", art: "transportschaden", sprache: "en", einwilligung: true, website: "" });
    expect(body.idem).toBeTruthy();
  });

  test("Links: Footer (Service) und /pflege-service führen zur Reklamation", async ({ page }) => {
    await page.goto("/fr/pflege-service");
    await expect(page.locator("[data-pflege-reklamation] a")).toHaveAttribute("href", "/fr/service/reklamation");
    await expect(page.locator('#ph-footer-services a[href="/fr/service/reklamation"], footer a[href="/fr/service/reklamation"]').first()).toBeVisible();
  });

  test("375 px: kein horizontaler Überlauf auf allen neuen Seiten", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await mockSend(page);
    for (const url of [`/de/newsletter/bestaetigen?token=${TOKEN}`, "/it/newsletter/abmelden", `/de/adventsabend/absagen?token=${TOKEN}`, "/de/service/reklamation", "/fr/service/reklamation"]) {
      await page.goto(url);
      await dismissCookieBanner(page, 3000);
      const o = await measureOverflow(page);
      expect(o.sw, `${url} ${JSON.stringify(o.wide)}`).toBeLessThanOrEqual(o.vw + 1);
    }
    await page.goto("/de/service/reklamation");
    await page.locator("[data-reklamation-submit]").click();
    const o = await measureOverflow(page);
    expect(o.sw, `Fehlerzustand ${JSON.stringify(o.wide)}`).toBeLessThanOrEqual(o.vw + 1);
  });
});
