// R8-recht (Fix-Team P2-recht-texte-consent, Runde 3): browser checks for
//   1 EN/FR/IT legal pages: German body with lang="de", notice in the page
//     language (r3-recht-inhalt P1-2, WCAG 3.1.2), axe valid-lang clean
//   3 privacy policy = consent dialog (no Google-Ads section without switch)
//   4 no "Rundgang" in the consent texts while the showroom tour is not live
//   6 phone bar compact, no Google request before consent
//   PW_WORKERS=1 npx playwright test tests/e2e/r4-recht-consent-r8.spec.js --project=desktop
import { test, expect, devices } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { settle } from "./helpers.js";

const REGION = { name: /^Cookie[- ](Einstellungen|settings|paramètres|impostazioni)/i };
const GOOGLE_HOST =
  /(^|\.)(google\.[a-z.]+|googletagmanager\.com|google-analytics\.com|googleadservices\.com|googlesyndication\.com|doubleclick\.net|gstatic\.com|googleapis\.com)$/i;

async function interceptGoogle(context) {
  const hits = [];
  await context.route(
    (url) => GOOGLE_HOST.test(url.hostname),
    (route) => {
      hits.push(route.request().url());
      return route.fulfill({ status: 204, body: "" });
    }
  );
  return hits;
}

const NOTICE = {
  en: "This page is only available in German. The German version is authoritative.",
  fr: "Cette page n’est disponible qu’en allemand. La version allemande fait foi.",
};

test.describe("Rechtsseiten EN/FR: lang-Wechsel und Hinweis", () => {
  // Erwartung bewusst geändert (Rat 9,5 A16, QA Recht −0,1): /en|fr|it/datenschutz
  // hat jetzt H1 und Kurzfassung in der Seitensprache über dem deutschen
  // Volltext (geprüft in tests/e2e/rat95-recht.spec.js). Der deutsche Textkörper
  // mit lang="de" bleibt; hier läuft deshalb das Impressum in EN und FR.
  for (const [locale, route, word] of [
    ["en", "impressum", "Impressum"],
    ["fr", "impressum", "Impressum"],
  ]) {
    test(`/${locale}/${route}: Textkörper lang="de", Hinweis in der Seitensprache, Canonical unverändert`, async ({ page }) => {
      await page.goto(`/${locale}/${route}`, { waitUntil: "load" });
      await settle(page);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      // notice in the page language, outside the German container
      const notice = page.locator("[data-german-only-notice]");
      await expect(notice).toHaveText(NOTICE[locale]);
      expect(await notice.evaluate((el) => el.closest("[lang]").getAttribute("lang"))).toBe(locale);
      // German body + German H1
      const body = page.locator("[data-legal-body]");
      await expect(body).toHaveAttribute("lang", "de");
      await expect(body.locator("h2").first()).toBeVisible();
      await expect(page.locator("h1 [lang=de]")).toHaveText(word);
      // canonical and hreflang unchanged
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://platzhirsch.studio/${locale}/${route}`);
      await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveCount(1);
      // axe: the language change is valid
      const axe = await new AxeBuilder({ page }).withRules(["valid-lang", "html-has-lang", "html-lang-valid"]).analyze();
      expect(axe.violations.map((v) => v.id)).toEqual([]);
      expect(axe.passes.map((p) => p.id)).toContain("valid-lang");
    });
  }

  test("/de/datenschutz: kein Hinweis auf Deutsch, Textkörper lang=de", async ({ page }) => {
    await page.goto("/de/datenschutz", { waitUntil: "load" });
    await expect(page.locator("[data-german-only-notice]")).toHaveCount(0);
    await expect(page.locator("[data-legal-body]")).toHaveAttribute("lang", "de");
  });
});

test.describe("Erklärung = Dialog, kein „Rundgang“", () => {
  test("/de/datenschutz: Google-Abschnitte nur mit Schalter, E-Mail-Versand vorhanden, kein „Rundgang“", async ({ page }) => {
    await page.goto("/de/datenschutz", { waitUntil: "load" });
    await settle(page);
    const body = page.locator("[data-legal-body]");
    await expect(body.locator("#google-maps")).toHaveCount(1);
    await expect(body.locator("#google-analytics")).toHaveCount(1);
    await expect(body.locator("#google-ads")).toHaveCount(0); // no Ads ID in this environment
    await expect(body.locator("#mailversand")).toHaveCount(1);
    // Bewusst ergänzt (Rat 9,5 B4): Im Testbetrieb stehen die Entwürfe der
    // DSE-Ergänzungen mit offenen [Punkten] sichtbar markiert auf der Seite; im
    // Produktions-Build erscheinen sie nie (prod-check Schritt „dse“). Geprüft
    // wird der Text ohne diese Entwürfe.
    const text = await body.evaluate((el) => {
      const copy = el.cloneNode(true);
      copy.querySelectorAll('[data-dse-status="entwurf"]').forEach((n) => n.remove());
      document.body.appendChild(copy);
      const t = copy.innerText;
      copy.remove();
      return t;
    });
    expect(text).toMatch(/Resend/);
    // Bewusst geändert (Runde 4, r4-recht-inhalt P1-2): nur noch ein Dienst
    // (Resend), Postmark ist gestrichen; Grundlage USA (DPF/SCC) genannt.
    expect(text).not.toMatch(/Postmark/);
    expect(text).toMatch(/Data Privacy Framework/);
    expect(text).not.toMatch(/Rundgang|Google Ads|\[/);
    // the dialog: exactly the categories the policy explains
    await page.getByRole("region", REGION).getByRole("button", { name: "Individuelle Einstellungen" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator("#marketing-cookies")).toHaveCount(0);
    await expect(dialog.locator("#functional-cookies")).toHaveCount(1);
    await expect(dialog.locator("#statistics-cookies")).toHaveCount(1);
    expect(await dialog.innerText()).not.toMatch(/Rundgang/);
  });

  test("Consent-Leiste (Desktop, 4 Sprachen) nennt keinen Rundgang", async ({ browser }) => {
    for (const [locale, bad] of [
      ["de", /Rundgang/],
      ["en", /\btour\b/i],
      ["fr", /carte et visite/],
      ["it", /mappa e tour/],
    ]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto(`/${locale}`, { waitUntil: "load" });
      const bar = page.locator("[data-consent-bar]");
      await expect(bar).toBeVisible();
      const text = await bar.innerText();
      expect(text, locale).toMatch(/Street View/);
      expect(text, locale).not.toMatch(bad);
      await context.close();
    }
  });
});

test.describe("iPhone, erster Besuch: Leiste kompakt, nichts an Google", () => {
  test("Leiste ≤ 130 px auf dem iPhone 15 Pro, gleich große Knöpfe, 0 Google-Requests", async ({ browser }) => {
    const { defaultBrowserType: _ignored, ...iphone } = devices["iPhone 15 Pro"];
    const context = await browser.newContext(iphone);
    const hits = await interceptGoogle(context);
    const page = await context.newPage();
    for (const path of ["/de/designermoebel-bregenz", "/de/beratung"]) {
      await page.goto(path, { waitUntil: "load" });
      const bar = page.locator("[data-consent-bar]");
      await expect(bar).toBeVisible();
      const box = await bar.boundingBox();
      expect(box.height, path).toBeLessThanOrEqual(130);
      const accept = await bar.getByRole("button", { name: "Alle akzeptieren" }).boundingBox();
      const reject = await bar.getByRole("button", { name: "Weiter ohne Einwilligung" }).boundingBox();
      expect(accept.height).toBeGreaterThanOrEqual(44);
      expect(Math.round(reject.height)).toBe(Math.round(accept.height));
      expect(Math.round(reject.width)).toBe(Math.round(accept.width));
    }
    await page.waitForTimeout(1000);
    expect(hits).toEqual([]);
    await context.close();
  });
});
