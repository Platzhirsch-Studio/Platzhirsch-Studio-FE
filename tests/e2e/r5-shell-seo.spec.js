// R5-shell-seo: site schema, breadcrumbs, search 429 notice, consent/portal
// bars on the iPhone and the AP8 acceptance (axe, skip link, mega menu,
// nothing moves by itself). Runs in the desktop project; phone checks open
// their own browser. Read-only: no form is sent, the search API is answered
// by page.route() in the 429/error tests.
//   npx playwright test tests/e2e/r5-shell-seo.spec.js --project=desktop
import { test, expect, devices, webkit } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import crypto from "node:crypto";
import { settle } from "./helpers.js";

const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const CONSENT_REGION = { name: /^Cookie-Einstellungen$/ };
const PORTAL_SECRET = process.env.PORTAL_SESSION_SECRET || "dev-only-portal-secret-do-not-use-in-production-0000";

function portalCookie(origin) {
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ v: 1, sub: "CUST-DEMO-0001", sid: crypto.randomUUID(), iat: now, exp: now + 3600 })).toString("base64url");
  const value = `${body}.${crypto.createHmac("sha256", PORTAL_SECRET).update(`portal-session:${body}`).digest("base64url")}`;
  return { name: "ph_portal_session", value, url: origin, httpOnly: true, sameSite: "Lax" };
}
const SHOT_DIR = "qa-screenshots/teamleiter/r5-R5-shell-seo/fix";
const decided = (origin) => ({ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: origin });

function jsonLdNodes(html) {
  const out = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    const visit = (n) => {
      if (Array.isArray(n)) return n.forEach(visit);
      if (!n || typeof n !== "object") return;
      if (n["@graph"]) visit(n["@graph"]);
      if (n["@type"]) out.push(n);
      if (n.breadcrumb) visit(n.breadcrumb);
    };
    visit(JSON.parse(m[1]));
  }
  return out;
}
const types = (n) => [].concat(n["@type"]);

async function severeAxe(page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => ({ rule: v.id, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }));
}

// ------------------------------------------------------------------- schema
test.describe("Site-Schema und og:locale", () => {
  test("/de: FurnitureStore aus site.js, brand nur belegte Händler (Claim-Register), kein aggregateRating, og:locale de_AT", async ({ request }) => {
    const html = await (await request.get("/de")).text();
    const org = jsonLdNodes(html).find((n) => types(n).includes("FurnitureStore"));
    expect(org).toBeTruthy();
    expect(org.legalName).toBe("MW Immobilienverwaltungs GmbH");
    expect(org.address.streetAddress).toBe("Landstraße 11");
    // F6 (28.10.2026): Ezarri ist laut Inhaber-Entscheidung Nr. 7 belegter Vertragshändler (CLAIM_REGISTER).
    // Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Minotti (Studio) und die 7 Bad-&-Wellness-Marken
    // (DEALER_ONLY_BRANDS, @id wie die ItemList auf /bad-wellness) kommen hinzu; Poliform/Rimadesio/Agape nie.
    // Inhaber-Entscheidung Nr. 24 (bewusst geändert, 31.10.2026): die 6 Küchengeräte-Marken kommen hinzu
    // (DEALER_ONLY_BRANDS, @id wie die ItemList auf /kuechengeraete).
    expect(org.brand.map((b) => b.name)).toEqual([
      // Inhaber-Entscheidung Nr. 32 (bewusst geändert, SEO-Team A 31.10.2026): Flos und Tom Dixon über den Händler-Filter.
      "Minotti", "Flos", "Tom Dixon", "ClassiCon", "Ezarri",
      "Dornbracht", "antoniolupi", "Starpool", "Soleum", "Fabio Alemanno", "Aquavia Spa", "Naggura",
      "Gaggenau", "Miele", "V-ZUG", "BORA", "Liebherr", "Quooker",
      // Inhaber-Entscheidungen Nr. 27/28 (bewusst geändert, SEO-Team A 31.10.2026): Baobab Collection, Riedel und Cire Trudon kommen hinzu (DEALER_ONLY_BRANDS).
      "Baobab Collection", "Riedel", "Cire Trudon",
      "Zalto", "Assouline", "Kähler", "Lyngby Porcelæn",
    ]);
    expect(org.brand.every((b) => b["@id"].startsWith("https://platzhirsch.studio/#brand/"))).toBe(true);
    expect(org.knowsAbout.length).toBeGreaterThan(10);
    expect(org.openingHoursSpecification.length).toBe(2);
    expect(org.sameAs.every((u) => u.startsWith("https://"))).toBe(true);
    expect(JSON.stringify(org)).not.toMatch(/aggregateRating|"review"|"offers"/);
    expect(html).toContain('property="og:locale" content="de_AT"');
    // Exactly one site schema (no leftover inline copy).
    expect(jsonLdNodes(html).filter((n) => types(n).includes("FurnitureStore"))).toHaveLength(1);
  });

  test("og:locale je Sprache gleich auf Start, Marken und Merkliste", async ({ request }) => {
    for (const [path, og] of [
      ["/en", "en_GB"],
      ["/en/about-us/brands", "en_GB"],
      ["/fr/a-propos/marques/minotti", "fr_FR"],
      ["/de/merkliste", "de_AT"],
    ]) {
      const html = await (await request.get(path)).text();
      expect(html, path).toContain(`property="og:locale" content="${og}"`);
    }
  });
});

// -------------------------------------------------------------- breadcrumbs
test.describe("Brotkrumen", () => {
  for (const path of ["/de/ueber-uns/marken", "/de/ueber-uns/marken/minotti", "/de/ueber-uns/marken/minotti/sofas-couches", "/de/merkliste"]) {
    test(`${path}: sichtbar und im JSON-LD „Startseite“`, async ({ page, request }) => {
      await page.goto(path, { waitUntil: "load" });
      const trail = page.locator("main nav ol").first();
      await expect(trail.getByRole("link").first()).toHaveText("Startseite");
      const crumbs = jsonLdNodes(await (await request.get(path)).text()).filter((n) => types(n).includes("BreadcrumbList"));
      expect(crumbs.length).toBeGreaterThan(0);
      for (const c of crumbs) expect(c.itemListElement[0].name).toBe("Startseite");
    });
  }

  test("PageHeader /ueber-uns/platzhirsch: jede Stufe außer der letzten hat item", async ({ request }) => {
    for (const path of ["/de/ueber-uns/platzhirsch", "/en/about-us/platzhirsch"]) {
      const crumbs = jsonLdNodes(await (await request.get(path)).text()).filter((n) => types(n).includes("BreadcrumbList"));
      expect(crumbs.length, path).toBeGreaterThan(0);
      for (const c of crumbs) {
        c.itemListElement.forEach((it, i) => {
          expect(it.position).toBe(i + 1);
          if (i < c.itemListElement.length - 1) expect(it.item, `${path} Stufe ${i + 1}`).toMatch(/^https:\/\//);
        });
      }
    }
  });
});

// ---------------------------------------------------------------- search 429
test.describe("Suche: Hinweis bei 429 und Fehler (aria-live)", () => {
  for (const [status, text] of [
    [429, "Zu viele Suchanfragen in kurzer Zeit"],
    [500, "Die Suche ist gerade nicht erreichbar"],
  ]) {
    test(`HTTP ${status}`, async ({ page, context }) => {
      await context.addCookies([decided(new URL(test.info().project.use.baseURL || "http://localhost:3000").origin)]);
      await page.route("**/api/shop-search**", (route) =>
        route.fulfill({
          status,
          contentType: "application/json",
          headers: status === 429 ? { "Retry-After": "30" } : {},
          body: JSON.stringify(status === 429 ? { error: "rate_limited", code: "rate_limited", retryAfter: 30 } : { error: "x" }),
        })
      );
      await page.goto("/de", { waitUntil: "load" });
      await settle(page);
      await page.locator("header").getByRole("button", { name: /Suche/ }).first().click();
      const input = page.locator("#ph-search-input");
      await expect(input).toBeVisible();
      await input.fill("minotti");
      const notice = page.locator(`[aria-live="polite"] [data-search-notice]`);
      await expect(notice).toContainText(text);
      await expect(notice).toHaveAttribute("data-search-notice", status === 429 ? "rateLimited" : "error");
    });
  }
});

// ------------------------------------------------- consent + portal (iPhone)
test.describe("iPhone: Cookie-Leiste und Portal-Leiste", () => {
  test("keine Überlappung, Fußzeile scrollt frei, Knöpfe ≥ 44 px", async () => {
    const baseURL = test.info().project.use.baseURL || "http://localhost:3000";
    const browser = await webkit.launch();
    try {
      const context = await browser.newContext({ ...devices["iPhone 15 Pro"], baseURL, locale: "de-AT" });
      await context.addCookies([portalCookie(new URL(baseURL).origin)]);
      const page = await context.newPage();
      await page.goto("/de/portal", { waitUntil: "load" });
      await settle(page);
      test.skip(page.url().includes("/login"), "Portal-Session nicht akzeptiert (anderes Secret)");
      const consent = page.getByRole("region", CONSENT_REGION);
      await consent.waitFor({ state: "visible", timeout: 20_000 });
      const nav = page.getByRole("navigation", { name: "Kundenportal" });
      const [c, n] = [await consent.boundingBox(), await nav.boundingBox()];
      const vh = page.viewportSize().height;
      expect(n.y + n.height, "Portal-Leiste endet über der Cookie-Leiste").toBeLessThanOrEqual(c.y + 1);
      expect(c.y + c.height).toBeLessThanOrEqual(vh + 1);
      for (const name of ["Alle akzeptieren", "Weiter ohne Einwilligung"]) {
        const b = await consent.getByRole("button", { name }).boundingBox();
        expect(b.height, name).toBeGreaterThanOrEqual(44);
      }
      // Scrolled to the end, the last footer control is above both bars.
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(300);
      const last = page.locator("#site-footer").getByRole("button", { name: /Privatsphäre/ });
      const l = await last.boundingBox();
      const n2 = await nav.boundingBox();
      expect(l.y + l.height, "letzte Fußzeilen-Zeile frei").toBeLessThanOrEqual(n2.y + 1);
      // Beleg für die Abnahme (QM R5 P2-4): eingeloggte Sitzung, Ende der Seite.
      await page.screenshot({ path: `${SHOT_DIR}/e2e-portal-iphone-ende-mit-cookie-leiste.png` });
    } finally {
      await browser.close();
    }
  });

  test("nach Cookie-Entscheidung: nur Portal-Leiste, Fußzeile endet darüber", async () => {
    const baseURL = test.info().project.use.baseURL || "http://localhost:3000";
    const browser = await webkit.launch();
    try {
      const context = await browser.newContext({ ...devices["iPhone 15 Pro"], baseURL, locale: "de-AT" });
      const origin = new URL(baseURL).origin;
      await context.addCookies([portalCookie(origin), decided(origin)]);
      const page = await context.newPage();
      await page.goto("/de/portal", { waitUntil: "load" });
      await settle(page);
      test.skip(page.url().includes("/login"), "Portal-Session nicht akzeptiert (anderes Secret)");
      await expect(page.getByRole("region", CONSENT_REGION)).toHaveCount(0);
      const nav = page.getByRole("navigation", { name: "Kundenportal" });
      await expect(nav).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(300);
      const vh = page.viewportSize().height;
      const n = await nav.boundingBox();
      expect(n.y + n.height).toBeLessThanOrEqual(vh + 1);
      const last = page.locator("#site-footer").getByRole("button", { name: /Privatsphäre/ });
      const l = await last.boundingBox();
      expect(l.y + l.height, "letzte Fußzeilen-Zeile über der Portal-Leiste").toBeLessThanOrEqual(n.y + 1);
      await page.screenshot({ path: `${SHOT_DIR}/e2e-portal-iphone-ende-ohne-cookie-leiste.png` });
    } finally {
      await browser.close();
    }
  });
});

// --------------------------------------------------------------- AP8 checks
const AXE_PAGES = ["/de", "/de/ueber-uns/platzhirsch", "/de/ueber-uns/team", "/de/news", "/de/ueber-uns/marken"];

test.describe("AP8: axe ohne serious/critical", () => {
  for (const path of AXE_PAGES) {
    test(`${path} mit offener Cookie-Leiste`, async ({ page }) => {
      await page.goto(path, { waitUntil: "load" });
      await settle(page);
      await page.getByRole("region", CONSENT_REGION).waitFor({ state: "visible", timeout: 20_000 });
      expect(await severeAxe(page)).toEqual([]);
    });
    test(`${path} nach Entscheidung (ohne Leiste)`, async ({ page, context, baseURL }) => {
      await context.addCookies([decided(new URL(baseURL).origin)]);
      await page.goto(path, { waitUntil: "load" });
      await settle(page);
      await expect(page.getByRole("region", CONSENT_REGION)).toHaveCount(0);
      expect(await severeAxe(page)).toEqual([]);
    });
  }
});

test.describe("AP8: Tastatur und Bewegung", () => {
  test("Skip-Link ist der erste Tab-Stopp und springt in <main>", async ({ page, context, baseURL }) => {
    await context.addCookies([decided(new URL(baseURL).origin)]);
    await page.goto("/de", { waitUntil: "load" });
    await settle(page);
    await page.keyboard.press("Tab");
    const skip = page.locator(":focus");
    await expect(skip).toHaveAttribute("href", "#main");
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => document.activeElement?.id || document.activeElement?.closest("main")?.id)).toBe("main");
  });

  test("Mega-Menü: Tastatur öffnet, Escape schließt, Fokus zurück auf den Auslöser", async ({ page, context, baseURL }) => {
    await context.addCookies([decided(new URL(baseURL).origin)]);
    await page.goto("/de", { waitUntil: "load" });
    await settle(page);
    const trigger = page.locator('button[id^="ph-nav-trigger-"]').first();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const panel = page.locator(`#${await trigger.getAttribute("aria-controls")}`);
    await expect(panel).toBeVisible();
    // Into the panel, then Escape.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(await trigger.evaluate((el) => el === document.activeElement)).toBe(true);
  });

  test("WCAG 2.2.2: auf Start läuft keine Endlos-Animation (kein Marquee)", async ({ page, context, baseURL }) => {
    await context.addCookies([decided(new URL(baseURL).origin)]);
    await page.goto("/de", { waitUntil: "load" });
    await settle(page);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
    await page.waitForTimeout(500);
    const infinite = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a.playState === "running" && a.effect?.getTiming?.().iterations === Infinity)
        .map((a) => a.effect?.target?.className?.toString().slice(0, 60) || a.animationName)
    );
    expect(infinite).toEqual([]);
    expect(await page.locator(".marquee").count()).toBe(0);
  });
});
