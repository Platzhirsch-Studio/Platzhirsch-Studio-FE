// tests/e2e/labs-hub.spec.js — „Planen & Erleben“: Übersicht /de/leistungen,
// Menüpunkt, Startseiten-Abschnitt, 308 von den alten /labs-URLs.
// Run: PW_WORKERS=1 npx playwright test tests/e2e/labs-hub.spec.js --project=desktop --reporter=list
//
// Bewusst geänderte Erwartungen (Integration 28.10.2026, Inhaber-Entscheidung
// Nr. 9 „keine separate Labs-Welt“): Schalter standardmäßig AN in jeder
// Umgebung, die Übersicht heißt /de/leistungen und ist indexierbar, alte
// /labs-URLs leiten per 308 um, „Planen & Erleben“ ersetzt „Leistungen“ im
// Menü (sieben Punkte), keine Status-Plaketten mehr. Es wird nichts gesendet
// (nur GET-Seitenaufrufe).
import { test, expect, devices } from "@playwright/test";
import { dismissCookieBanner, measureOverflow, robotsDirectives } from "./helpers.js";
import { readFileSync } from "node:fs";

const SLOW = 180_000;
const { defaultBrowserType: _a, ...IPHONE } = devices["iPhone 15 Pro"];
const { defaultBrowserType: _b, ...PIXEL } = devices["Pixel 7"];
const OK = (what) => `${what} antwortet nicht mit 200 – fremder Build-Fehler im Dev-Server?`;
const FEATURE_LINKS = [
  "/de/kuechenplaner",
  "/de/sofaplaner",
  "/de/3d-ansicht",
  "/de/stil-finder",
  "/de/bodensee-licht",
  "/de/yacht-interior",
  "/de/ezarri",
  "/de/dreilaender-rechner",
  // Runde 5 (P3, ux P1-4): Upload und Portal (direkt zur Anmeldung) haben Karten.
  "/de/upload",
  "/de/portal/login",
];
// Runde 4 (Fix-Team P3, ux P0-1 / seo P2), bewusst geänderte Erwartung: keine
// Karten auf noindex-Seiten (Upload, Outdoor bis zur Rechtsprüfung), 307-Seiten
// (Portal), den Showroom ohne echte Aufnahme und den Concierge ohne echten
// KI-Schlüssel (der Dev-Server läuft im Mock) – hubFeatures() in src/lib/features.js.
// Runde 5 (P3, ux P1-4, bewusst geänderte Erwartung): die Übersicht zeigt, was
// das Menü zeigt (Entscheidung Nr. 9) – Garten & Terrasse (unter „Beraten &
// planen“), Upload und Portal (Anmeldung, kein 307) sind wieder verlinkt; der
// MCP-Eintrag steht unter „Für Fachleute“ statt bei den Kundenservices.
const NOT_LINKED = ["/de/portal", "/de/showroom"];
const MOVES = [
  ["/de/labs", "/de/leistungen"],
  ["/de/labs/kuechenplaner", "/de/kuechenplaner"],
  ["/de/labs/sofaplaner?schritt=2", "/de/sofaplaner?schritt=2"],
  ["/de/labs/stilfinder", "/de/stil-finder"],
  ["/de/labs/ar-viewer", "/de/3d-ansicht"],
  ["/de/labs/dreilaender", "/de/dreilaender-rechner"],
  ["/de/labs/concierge", "/de/concierge"],
  ["/de/labs/upload-demo", "/de/upload"],
  ["/en/labs/kuechenplaner", "/de/kuechenplaner"],
];

// Menü-Label aus src/messages/de.json (nav.plan), nicht hart „Planen & Erleben“.
const DE_SHELL = JSON.parse(readFileSync("src/messages/de.json", "utf8")).Shell;
const NAV_PLAN = DE_SHELL.nav.plan;
const MENU_OPEN = DE_SHELL.header.menuOpen;

test.describe("Planen & Erleben", () => {
  test.describe.configure({ timeout: 600_000 });

  test("alte /labs-URLs: 308 auf die festen URLs (mit Query), Dateien unter /labs bleiben", async ({ request }) => {
    test.setTimeout(SLOW * 3);
    for (const [from, to] of MOVES) {
      const res = await request.get(from, { maxRedirects: 0, timeout: SLOW });
      expect(res.status(), from).toBe(308);
      expect(new URL(res.headers().location, "http://x").pathname + (new URL(res.headers().location, "http://x").search || ""), from).toBe(to);
    }
    // Statische Dateien in public/labs (Texturen, Decoder) werden nicht umgeleitet.
    expect((await request.get("/labs/ar-viewer/decoders/draco/draco_decoder.js", { maxRedirects: 0, timeout: SLOW })).status()).toBe(200);
    // Bewusst geändert (Rat 9,5 B20/T6, labsAssetRedirects): Teilen-Bilder /labs/og/<id>.jpg → EIN 308 auf /og/<id>.jpg.
    const og = await request.get("/labs/og/kuechenplaner.jpg", { maxRedirects: 0, timeout: SLOW });
    expect(og.status()).toBe(308);
    expect(new URL(og.headers().location, "http://x").pathname).toBe("/og/kuechenplaner.jpg");
    // Runde 5 (gesamtwerk P2): Kartenbilder ohne /labs/hub/v/ im Pfad.
    expect((await request.get("/bilder/leistungen/kuechenplaner-640.webp", { maxRedirects: 0, timeout: SLOW })).status()).toBe(200);
  });

  test("/de/leistungen: indexierbar, eine H1, alle Features mit Bild und Link, keine Plaketten", async ({ page, request }) => {
    const res = await request.get("/de/leistungen", { timeout: SLOW });
    expect(res.status(), OK("/de/leistungen")).toBe(200);
    const text = await res.text();
    expect(robotsDirectives({ text, headers: res.headers() })).not.toMatch(/noindex/);
    expect(text).toContain('rel="canonical" href="https://platzhirsch.studio/de/leistungen"');
    expect(text).not.toMatch(/NEXT_PUBLIC_FEATURE|Labs-Prototyp|Platzhirsch Labs/);

    await page.goto("/de/leistungen", { waitUntil: "domcontentloaded", timeout: 300_000 });
    await expect(page.getByRole("heading", { level: 1, name: "Planen & Erleben" })).toBeVisible();
    for (const href of FEATURE_LINKS) {
      if (href === "/de/showroom") continue;
      const card = page.locator(`article[data-feature]:has(a[href="${href}"])`);
      await expect(card, href).toHaveCount(1);
      await expect(card.locator("img, svg[role=img]").first(), href).toBeVisible();
    }
    await expect(page.locator("article[data-feature] [data-status]")).toHaveCount(0);
    for (const href of NOT_LINKED) await expect(page.locator(`main a[href="${href}"]`), href).toHaveCount(0);
    await expect(page.locator('[data-leistungen-usp] a[href="/de/outdoor-gartenplanung"]')).toBeVisible();
    await expect(page.locator('[data-leistungen-fachleute] a[href="/de/ki-assistenten"]')).toBeVisible();
    await expect(page.locator('article[data-feature="agent"]')).toHaveCount(0);
    await expect(page.locator('section#service article[data-feature="upload"] svg[role=img]')).toBeVisible();
    await expect(page.locator('main img[src*="/labs/hub"], main source[srcset*="/labs/hub"]')).toHaveCount(0);
    const { mode } = await (await request.get("/api/labs/concierge", { timeout: SLOW })).json();
    await expect(page.locator(`main a[href="/de/concierge"]`), "Concierge nur mit echter KI").toHaveCount(mode === "live" ? 1 : 0);
    // Kein Mock, kein Demo-Code, kein Versprechen eines begehbaren 3D-Raums (ux P0-1).
    expect(text).not.toMatch(/begehbar|3D-Raum|Mock|PH-DEMO/);
    // Kern-USP vor den Werkzeugen, mit Link zur Arbeitsweise.
    await expect(page.locator('[data-leistungen-usp] a[href="/de/arbeitsweise"]')).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Bereiche" }).getByRole("link")).toHaveCount(3);
    const ez = page.locator('article[data-feature="ezarri"]');
    await expect(ez.locator('img[src*="ezarri"]')).toHaveCount(1);
    await expect(ez.getByText("Bild: Ezarri, ezarri.com")).toBeVisible();
    // Fix-Runde 1 (F2): bewusst geändert – die 3D-Karte zeigt statt des gezeichneten Würfels
    // ein echtes Vorschaubild aus dem Viewer (CC0-Beispielmodell mit Maßen).
    await expect(page.locator('article[data-feature="arviewer"] img[src*="3d-ansicht"]')).toBeVisible();
  });

  test("/de/leistungen Desktop: keine Karte allein in der letzten Zeile", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/de/leistungen", { waitUntil: "domcontentloaded", timeout: 300_000 });
    for (const id of ["planen", "erleben", "service"]) {
      const tops = await page.locator(`section#${id} ul[role=list] > li`).evaluateAll((els) =>
        els.map((el) => Math.round(el.getBoundingClientRect().top))
      );
      const rows = Object.values(tops.reduce((m, t) => ((m[t] = (m[t] || 0) + 1), m), {}));
      if (tops.length > 1) expect(rows.at(-1), `${id}: ${rows.join("/")}`).toBeGreaterThan(1);
    }
  });

  test("/de/leistungen iPhone: „Beratung anfragen“ im ersten Bildschirm (ux P2-10)", async ({ browser }) => {
    const context = await browser.newContext(IPHONE);
    const page = await context.newPage();
    await page.goto("/de/leistungen", { waitUntil: "domcontentloaded", timeout: 300_000 });
    const link = page.locator("[data-leistungen-termin] a");
    await expect(link).toHaveAttribute("href", "/de/beratung");
    await expect(link).toHaveText(/Beratung anfragen/);
    const box = await link.boundingBox();
    expect(box.y + box.height, "im ersten Bildschirm").toBeLessThanOrEqual(page.viewportSize().height);
    await context.close();
  });

  test("/de/leistungen mobil: kein Querscroll", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto("/de/leistungen", { waitUntil: "domcontentloaded", timeout: 300_000 });
    await dismissCookieBanner(page, 8000);
    const { vw, sw, wide } = await measureOverflow(page);
    expect(sw, wide.join(" | ")).toBeLessThanOrEqual(vw + 1);
    await context.close();
  });

  // P6 Runde 2 (bewusst geänderte Erwartung): /en/leistungen war 404 (leere
  // Client-Hülle aus notFound()); jetzt EIN 308 auf die deutsche Seite mit
  // ?lang-Hinweis (src/lib/seo/deOnlyRedirects.cjs, r2-technik P1-8).
  // Sprach-Integration 01.11.2026 (bewusst geändert): /en|fr|it/leistungen ist eine eigene Seite.
  test("andere Sprachen: /en/leistungen eigene Seite, /en/labs → 308", async ({ request }) => {
    test.setTimeout(SLOW * 3 + 30_000);
    for (const l of ["en", "fr", "it"]) {
      const res = await request.get(`/${l}/leistungen`, { maxRedirects: 0, timeout: SLOW });
      expect(res.status(), l).toBe(200);
      expect(await res.text(), l).toMatch(new RegExp(`<html[^>]*\\blang="${l}"`));
      expect((await request.get(`/${l}/labs`, { maxRedirects: 0, timeout: SLOW })).status(), l).toBe(308);
    }
  });

  test("Menüpunkt „Planen & Erleben“ (Desktop) öffnet sein Panel mit Übersicht, Arbeitsweise und Planern", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/de/kontakt", { waitUntil: "load", timeout: 300_000 });
    await dismissCookieBanner(page, 8000);
    const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
    // Bewusst geändert (Menü-Label nav.plan = „Planen“, Stand 31.10.2026): exakter Name.
    const trigger = nav.getByRole("button", { name: NAV_PLAN, exact: true });
    await expect(trigger).toBeVisible({ timeout: 60_000 });
    await expect(nav.getByRole("button", { name: "Leistungen" })).toHaveCount(0);
    const panel = page.locator("#ph-nav-panel-services");
    await expect(async () => {
      if (!(await panel.isVisible())) await trigger.click();
      await expect(panel).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 60_000 });
    for (const href of ["/de/leistungen", "/de/arbeitsweise", "/de/kuechenplaner", "/de/sofaplaner", "/de/3d-ansicht", "/de/bodensee-licht"]) {
      await expect(panel.locator(`a[href="${href}"]`).first(), href).toBeVisible();
    }
  });

  test("Startseite: USP-Kapitel und Abschnitt „Planen & Erleben“ mit höchstens vier Karten", async ({ request }) => {
    const res = await request.get("/de", { timeout: SLOW });
    expect(res.status(), OK("Startseite /de")).toBe(200);
    const html = await res.text();
    expect(html).toContain('id="home-process-title"');
    expect(html).toContain('id="home-labs-title"');
    const list = html.split('id="home-labs-list"')[1]?.split("</ul>")[0] || "";
    const n = (list.match(/data-feature="/g) || []).length;
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThanOrEqual(4);
    const enRes = await request.get("/en", { timeout: SLOW });
    expect(enRes.status(), OK("Startseite /en")).toBe(200);
    const en = await enRes.text();
    // Rat 9,5 B11 (Auftrag T2 → T4, bewusst umgedreht): /en zeigt den Showcase mit englischen Texten.
    expect(en).toContain('id="home-labs-title"');
    expect(en).toContain('id="home-process-title"');
  });

  // Höhenziel (r3-startseite: Hauptinhalt < 9 800 px seit dem USP-Kapitel, Seite < 13 000 px) auf beiden Telefonen.
  for (const [name, device] of [["iPhone 15 Pro", IPHONE], ["Pixel 7", PIXEL]]) {
    // Rat 9,5 B11 (bewusst geändert, neuland Nr. 5): mobil eine kompakte Bildreihe (Bild + Titel) statt der Linkzeile.
    test(`Startseite mobil (${name}): kompakte Bildreihe, Hauptinhalt unter 9 800 px`, async ({ browser }) => {
      const context = await browser.newContext(device);
      const page = await context.newPage();
      const res = await page.goto("/de", { waitUntil: "networkidle", timeout: 300_000 });
      expect(res.status(), OK("Startseite /de")).toBe(200);
      await expect(page.locator("[data-home-labs]")).toBeVisible();
      await expect(page.locator("[data-home-labs-item]").first()).toBeVisible();
      await expect(page.locator("[data-home-labs-item] img, [data-home-labs-item] svg").first()).toBeAttached();
      const main = await page.evaluate(() => Math.round(document.querySelector("main").getBoundingClientRect().height));
      expect(main).toBeLessThan(9800);
      await context.close();
    });
  }

  // WCAG 1.4.12 Textabstände bei 1280/1440 px – nichts überlappt, nichts wird abgeschnitten.
  for (const width of [1280, 1440]) test(`Navigation ${width} px mit vergrößerten Textabständen (WCAG 1.4.12)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    const res = await page.goto("/de/kontakt", { waitUntil: "load", timeout: 300_000 });
    expect(res.status(), OK("/de/kontakt")).toBe(200);
    await dismissCookieBanner(page, 8000);
    await page.addStyleTag({
      content: "*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}",
    });
    const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
    // Bewusst geändert (Inhaber 01.11.2026, navFit.js): kein fester Umschaltpunkt mehr. Die
    // Kopfzeile misst die Liste und verdichtet Schrift/Abstand (DE 1280 px mit diesen
    // Abständen: Stufe 3, 587 px in 593 px). Passt keine Stufe, übernimmt der Menü-Knopf –
    // dann darf die Leiste nicht sichtbar sein. In beiden Fällen: nichts überlappt.
    await expect(page.locator("header[data-nav]")).toHaveCount(1, { timeout: 60_000 });
    await page.waitForTimeout(500); // ResizeObserver → rAF nach dem Stil-Tag
    if ((await page.locator("header").getAttribute("data-nav")) === "menu") {
      await expect(page.getByRole("button", { name: MENU_OPEN, exact: true })).toBeVisible({ timeout: 60_000 });
      await expect(nav).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), "Querscroll").toBe(false);
      return;
    }
    await expect(page.getByRole("button", { name: MENU_OPEN, exact: true })).toBeHidden();
    await expect(nav.getByRole("button", { name: NAV_PLAN, exact: true })).toBeVisible({ timeout: 60_000 });
    const result = await nav.evaluate((navEl) => {
      const header = navEl.closest("header") || document.body;
      const box = (el) => el.getBoundingClientRect();
      const visible = (el) => {
        const r = box(el);
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
      };
      const items = [...navEl.querySelector("ul").children].filter(visible).map((li) => {
        const t = li.querySelector("button, a") || li;
        return { name: t.textContent.trim(), r: box(t), clipped: t.scrollWidth > t.clientWidth + 1 };
      });
      const others = [...header.querySelectorAll("a, button")]
        .filter((el) => !navEl.contains(el) && visible(el))
        .map((el) => ({ name: el.getAttribute("aria-label") || el.textContent.trim(), r: box(el) }));
      const hit = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
      const problems = [];
      items.forEach((a, i) => {
        if (a.clipped) problems.push(`abgeschnitten: ${a.name}`);
        if (a.r.right > innerWidth + 1) problems.push(`außerhalb: ${a.name}`);
        items.slice(i + 1).forEach((b) => hit(a.r, b.r) && problems.push(`${a.name} ↔ ${b.name}`));
        others.forEach((o) => hit(a.r, o.r) && problems.push(`${a.name} ↔ ${o.name}`));
      });
      return { problems, count: items.length, wide: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    // Inhaber 31.10.2026 (bewusst geändert): acht Hauptpunkte – „Bad“ als eigener
    // Punkt nach „Küche“ (vorher sieben, Usability-Gutachten 3.1). Shop-Team 31.10.2026:
    // neunter Punkt „Shop“ (Accessoires-Shop) vor „Marken“.
    expect(result.count).toBe(9);
    expect(result.problems).toEqual([]);
    expect(result.wide, "Querscroll").toBe(false);
  });

  // Inhaber 01.11.2026: Hauptnavigation auf Laptops (ab 1280 px) in allen vier Sprachen in
  // EINER Zeile – ohne Menü-Knopf, ohne Überlappen von Logo und Symbolleiste.
  for (const [locale, path] of [["de", "/de/kontakt"], ["en", "/en/contact"], ["fr", "/fr/contact"], ["it", "/it/contatto"]]) {
    test(`Navigation 1280/1366 px ${locale.toUpperCase()}: eine Zeile, nichts überlappt`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      const res = await page.goto(path, { waitUntil: "load", timeout: 300_000 });
      expect(res.status(), OK(path)).toBe(200);
      for (const width of [1280, 1366]) {
        await page.setViewportSize({ width, height: 800 });
        await expect(page.locator("header[data-nav]")).toHaveCount(1, { timeout: 60_000 });
        await page.waitForTimeout(400);
        expect(await page.locator("header").getAttribute("data-nav"), `${width} px`).not.toBe("menu");
        const r = await page.evaluate(() => {
          const header = document.querySelector("header");
          const ul = header.querySelector("[data-nav-slot] ul");
          const items = [...ul.querySelectorAll(":scope > li > button")].map((b) => b.getBoundingClientRect());
          const logo = header.querySelector("a[href]").getBoundingClientRect();
          const tools = header.querySelector("[data-nav-slot]").nextElementSibling.getBoundingClientRect();
          return {
            count: items.length,
            oneLine: new Set(items.map((b) => Math.round(b.top))).size === 1,
            minWidth: Math.min(...items.map((b) => b.width)),
            gapLogo: Math.round(items[0].left - logo.right),
            gapTools: Math.round(tools.left - items.at(-1).right),
            wide: document.documentElement.scrollWidth > innerWidth + 1,
          };
        });
        expect(r.count).toBe(9);
        expect(r.oneLine, `${width} px eine Zeile`).toBe(true);
        expect(r.minWidth).toBeGreaterThanOrEqual(24); // WCAG 2.5.8
        expect(r.gapLogo, `${width} px Abstand Logo`).toBeGreaterThanOrEqual(16);
        expect(r.gapTools, `${width} px Abstand Symbole`).toBeGreaterThanOrEqual(16);
        expect(r.wide, "Querscroll").toBe(false);
      }
    });
  }
});
