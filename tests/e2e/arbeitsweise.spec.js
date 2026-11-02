// tests/e2e/arbeitsweise.spec.js – Signature-Seite /de/arbeitsweise (Kern-USP).
// Läuft im Projekt `desktop` (Chromium); der iPhone-Block emuliert das iPhone 15 Pro
// in Chromium (Viewport, Touch, UA), weil ein describe den Browser nicht wechseln kann.
// Formulare gibt es hier nicht; blockFormSends trotzdem, damit nie etwas abgeht.
// Konzept §6.4: Status/Titel/H1, genau 1 Walnut-Fläche, FAQ sichtbar = JSON-LD,
// Platzhalter nur in der Vorschau, Reduced Motion = Endzustand, Phase folgt dem Schritt,
// kein Überlauf bei 375/393 px, axe ohne serious/critical.
import { test, expect, devices } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { blockFormSends, collectConsoleErrors, dismissCookieBanner, jsonLdNodes, measureOverflow, robotsDirectives, settle } from "./helpers.js";

const PATH = "/de/arbeitsweise";
// Runde 2 (r2-seo P0-1, Entscheidung Nr. 9), bewusst geänderte Erwartung: früher
// noindex, solange Pflicht-Bilder fehlten – jetzt index, follow unabhängig davon.
const PROD = process.env.npm_lifecycle_event === "test:e2e:prod" || /:3100\b/.test(process.env.BASE_URL || "");

test.describe("Arbeitsweise – Server-HTML", () => {
  test("200, Titel, H1, index (unabhängig von den Bildern), canonical, nur Deutsch", async ({ request }) => {
    const res = await request.get(PATH, { timeout: 120_000 });
    expect(res.status()).toBe(200);
    const html = await res.text();
    // Rat 9,5 A15 (bewusst geändert): einheitlicher Suffix „| Platzhirsch“ statt „·“ (fitTitle, ≤ 60 Zeichen).
    // SEO-Team A, bewusst geändert (AP-2, 31.10.2026): Suchbegriff „Einrichtungsplanung“ vorn; H1 bleibt.
    expect(html).toMatch(/<title>Einrichtungsplanung: Handzeichnung, Modell, 3D \| Platzhirsch<\/title>/);
    expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
    expect(html).toContain("Von der Handzeichnung zum Rendering.");
    const robots = robotsDirectives({ text: html, headers: res.headers() });
    expect(robots).not.toContain("noindex");
    expect(robots).not.toContain("nofollow");
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/platzhirsch\.studio\/de\/arbeitsweise"/);
    // R5-fix P2 (gesamtwerk P1-2, seo P1-4, bewusst geändert): EN/FR/IT haben
    // eine eigene Seite (200, eigene Canonical, hreflang + x-default) statt 308
    // auf /de. Ausführlich: tests/e2e/r9-p2-arbeitsweise-i18n.spec.js.
    expect(html).toContain('<link rel="alternate" hrefLang="x-default" href="https://platzhirsch.studio/de/arbeitsweise"');
    for (const l of ["en", "fr", "it"]) {
      expect(html).toContain(`hrefLang="${l}" href="https://platzhirsch.studio/${l}/arbeitsweise"`);
      const r = await request.get(`/${l}/arbeitsweise`, { timeout: 120_000, maxRedirects: 0 });
      expect(r.status(), l).toBe(200);
    }
  });

  test("JSON-LD: FAQPage = sichtbare Fragen, Person Harald Menghin, kein HowTo", async ({ request }) => {
    const html = await (await request.get(PATH, { timeout: 120_000 })).text();
    const nodes = jsonLdNodes(html);
    const faq = nodes.find((n) => n["@type"] === "FAQPage");
    expect(faq?.mainEntity?.length).toBe(8);
    const visible = [...html.matchAll(/<details[^>]*id="frage-\d+"[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
    expect(visible).toEqual(faq.mainEntity.map((q) => q.name));
    expect(nodes.find((n) => n["@type"] === "Person")?.name).toBe("Harald Menghin");
    expect(nodes.some((n) => n["@type"] === "HowTo")).toBe(false);
  });

  // Fix-Runde 1 (F1, Release-Rat recht P0-3 / ux P1-6): bewusst geänderte
  // Erwartung – keine Platzhalter mehr, auch nicht im Dev-Server (nur mit
  // NEXT_PUBLIC_ARBEITSWEISE_PLATZHALTER=1 zur Bildplanung); keine
  // unbestätigten Angaben (60 Minuten, kostenlos, Rollenbezeichnung).
  test("Platzhalter: keiner (dev und prod), keine unbestätigten Angaben", async ({ request }) => {
    const html = await (await request.get(PATH, { timeout: 120_000 })).text();
    const count = (html.match(/data-placeholder="arbeitsweise"/g) || []).length;
    if (process.env.NEXT_PUBLIC_ARBEITSWEISE_PLATZHALTER === "1") expect(count).toBeGreaterThan(0);
    else expect(count).toBe(0);
    // sichtbarer Text (ohne Skripte / RSC-Daten)
    const text = html.replace(/<script[\s\S]*?<\/script>/g, "");
    for (const s of ["Bild folgt", "Projekt-Kette folgt", "60 Minuten", "kostenlos", "Designer &amp; Zeichner"]) expect(text).not.toContain(s);
    // Auftakt: R5-fix P2 (gesamtwerk P1-1, bewusst geändert) – keine Liniengrafik und
    // keine Bildzeile mehr („Showroom Lochau · Linie: …“), sondern das Papierblatt.
    expect(text).not.toContain("Linie: Zeichen des Studios");
    expect(text).toContain("data-hero-sheet");
    // Runde 2 (gesamtwerk P1-1), bewusst geändert: kein Etikett „Schema“ mehr,
    // sondern einmal der Hinweis, dass die Liniengrafiken keine Zeichnungen sind.
    expect(text).not.toContain(">Schema<");
    expect(text).toContain("nicht Haralds Zeichnungen"); // R5-USP
  });
});

test.describe("Arbeitsweise – Desktop", () => {
  test("Struktur, Standbild je Schritt neben dem Text, keine Konsolenfehler", async ({ page }) => {
    await blockFormSends(page);
    const errors = collectConsoleErrors(page);
    await page.goto(PATH);
    await settle(page);
    await dismissCookieBanner(page);
    await expect(page.locator('[data-surface="inverse"]')).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    // Primärknopf nur in Auftakt und Abschluss.
    await expect(page.locator("main").getByRole("link", { name: /Termin anfragen/ })).toHaveCount(2);

    // Runde 2 (gesamtwerk P1-1), bewusst geändert: statt der Sticky-Werkstrecke
    // steht das Standbild der Phase rechts neben dem Text jedes Schritts.
    for (const n of [2, 4, 5, 7]) {
      const step = page.locator(`#schritt-0${n}`);
      const fig = step.locator("figure [data-linie]");
      await expect(fig).toHaveAttribute("data-phase", String(n));
      await expect(fig).toBeVisible();
      const title = await step.locator("h3").boundingBox();
      const box = await fig.boundingBox();
      expect(box.x).toBeGreaterThan(title.x + 300);
    }
    await expect(page.locator("main [class*=progressBar]")).toHaveCount(0);
    // Seitenhöhe Desktop ≤ 9 000 px (gesamtwerk P1-1)
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(9_000);
    // Anker aus der Übersicht
    await page.locator('a[href="#schritt-03"]').click();
    await expect(page.locator("#schritt-03")).toBeInViewport();
    expect(errors).toEqual([]);
  });

  test("Reduced Motion: Grafiken im Endzustand, keine laufende Animation, keine Hydration-Fehler", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const errors = collectConsoleErrors(page);
    await page.goto(PATH);
    await settle(page);
    await page.locator("#schritt-05").scrollIntoViewIfNeeded();
    const state = await page.evaluate(() => ({
      running: document.getAnimations().filter((a) => a.playState === "running" && a.effect?.target?.closest?.("main")).length,
      clipped: [...document.querySelectorAll("main [data-linie]")].filter((el) => !/^(none|inset\(0(px)?( 0(px)?)*\))$/.test(getComputedStyle(el).clipPath)).length,
    }));
    expect(state.running).toBe(0);
    expect(state.clipped).toBe(0);
    expect(errors).toEqual([]);
    await ctx.close();
  });

  // F1: kein leerer Schema-Rahmen im Auftakt. R5-fix P2 (gesamtwerk P1-1,
  // bewusst geändert): statt der Liniengrafik des Showrooms (zog die Sessel nach,
  // Bildzeile „Showroom Lochau“) ein typografisches Papierblatt ohne Bild/Bildzeile.
  test("Auftakt: rechts neben dem Titel das Papierblatt (bis MEDIA.hero da ist), keine Sessel-Linien", async ({ page }) => {
    await page.goto(PATH);
    await settle(page);
    const hero = page.locator("section").first();
    const fig = hero.locator("[data-hero-sheet]");
    await expect(fig).toBeVisible();
    await expect(fig).toContainText("Papier.");
    await expect(hero.locator("figure[data-line-study], figcaption, img")).toHaveCount(0);
    await expect(hero.getByText(/Showroom Lochau ·/)).toHaveCount(0);
    await expect(hero.locator("[data-linie]")).toHaveCount(0);
    const h1 = await page.locator("h1").boundingBox();
    const box = await fig.boundingBox();
    expect(box.x).toBeGreaterThan(h1.x + h1.width - 1);
  });

  test("axe: keine serious/critical", async ({ page }) => {
    await page.goto(PATH);
    await settle(page);
    await dismissCookieBanner(page);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).exclude("nextjs-portal").analyze();
    const severe = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(severe.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`)).toEqual([]);
  });
});

test.describe("Arbeitsweise – iPhone (Chromium-Emulation)", () => {
  const { defaultBrowserType: _ignore, ...iphone } = devices["iPhone 15 Pro"];
  test.use(iphone);

  test("kein Überlauf bei 393 und 375 px, Standbild je Schritt", async ({ page }) => {
    await page.goto(PATH);
    await settle(page);
    let o = await measureOverflow(page);
    expect(o.sw, o.wide.join("\n")).toBeLessThanOrEqual(o.vw);
    await page.setViewportSize({ width: 375, height: 812 });
    o = await measureOverflow(page);
    expect(o.sw, o.wide.join("\n")).toBeLessThanOrEqual(o.vw);
    // Mobil: je Schritt ein eigenes Standbild als kleiner Anker neben dem Namen (F1: Schritt 01 ohne – Phase 1 war der leere Rahmen).
    await expect(page.locator("article[data-step] figure [data-linie]")).toHaveCount(6);
    await page.locator("#schritt-04 figure [data-linie]").scrollIntoViewIfNeeded();
    await expect(page.locator("#schritt-04 figure [data-linie]")).toHaveAttribute("data-phase", "4");
  });

  test("Standbild ist fertig eingezeichnet, sobald es ganz im Fenster steht", async ({ page }) => {
    await page.goto(PATH);
    await settle(page);
    for (const n of [4, 6]) {
      const fig = page.locator(`#schritt-0${n} figure [data-linie]`);
      await fig.evaluate((el) => {
        const r = el.getBoundingClientRect();
        window.scrollTo(0, window.scrollY + r.top + r.height / 2 - window.innerHeight / 2);
      });
      await expect
        .poll(() => fig.evaluate((el) => getComputedStyle(el).clipPath), { timeout: 5_000 })
        .toMatch(/^(none|inset\(0(px|%)?( 0(px|%)?)*\))$/);
    }
  });
});

// feedback-2 P2-1b: Auch mobil und auf dem iPad zeigt der erste Bildschirm unter
// dem Lead ein Bild (Platzhalter bzw. Schema), der Knopf steht davor über der Falz.
for (const vp of [
  { name: "393 px", width: 393, height: 852 },
  { name: "834 px (iPad)", width: 834, height: 1194 },
]) {
  test.describe(`Arbeitsweise – Auftakt ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });
    test("unter dem Lead ein Platzhalter oder das Schema, Knopf darüber", async ({ page }) => {
      await page.goto(PATH);
      await settle(page);
      const hero = page.locator("section").first();
      const visual = hero.locator(":is([data-placeholder], [data-linie], [data-line-study], [data-hero-sheet])").filter({ visible: true }).first();
      await expect(visual).toBeVisible();
      const lead = await hero.getByText("Wir lernen Ihre Räume kennen").boundingBox();
      const btn = await hero.getByRole("link", { name: /Termin anfragen/ }).boundingBox();
      const box = await visual.boundingBox();
      // R8 (gesamtwerk P2-3, bewusst geänderte Erwartung): ab 768 px steht die Grafik
      // rechts NEBEN Knopf und Schritte-Link (vorher darunter, rechts 600 px leer).
      // Design-Jury 30.10.2026 P1-4 (bewusst geänderte Erwartung, vorher B8 „über der H1“):
      // unter 768 px steht die H1 zuerst, das Typo-Blatt folgt Lead und Knopf
      // (höchstens 40 % der Höhe); Knopf bleibt über der Falz.
      if (vp.width >= 768) {
        expect(box.y).toBeGreaterThan(lead.y + lead.height - 1);
        expect(box.x).toBeGreaterThan(btn.x + btn.width);
      } else {
        const h1 = await hero.locator("h1").boundingBox();
        expect(box.y).toBeGreaterThanOrEqual(h1.y + h1.height);
        expect(box.y).toBeGreaterThan(lead.y + lead.height - 1);
        expect(box.y).toBeGreaterThan(btn.y + btn.height - 1);
        expect(box.height).toBeLessThanOrEqual(vp.height * 0.4);
      }
      expect(btn.y + btn.height).toBeLessThanOrEqual(vp.height);
      expect(box.width).toBeLessThanOrEqual(400);
    });
  });
}

test.describe("Arbeitsweise – Pixel 7, Reduced Motion (Chromium)", () => {
  const { defaultBrowserType: _ignore, ...pixel } = devices["Pixel 7"];
  test.use({ ...pixel, reducedMotion: "reduce" });

  test("keine Hydration- oder Konsolenfehler", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(PATH, { waitUntil: "load" });
    await settle(page);
    // Erst scrollen, wenn der App-Router steht: auf einem überlasteten Dev-Server
    // lösen Link-Prefetches sonst „Router action dispatched before initialization“
    // aus (Dev-Rauschen, keine Hydration-Abweichung).
    await page.waitForFunction(() => Boolean(window.next?.router), null, { timeout: 120_000 }).catch(() => {});
    await page.locator("#schritt-05").scrollIntoViewIfNeeded();
    await settle(page, 5_000);
    expect(errors).toEqual([]);
  });
});
