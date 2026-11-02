// tests/e2e/r7-p2-startseite.spec.js – Runde 2, Fix-Team P2 (Startseite & Wow).
//   PW_WORKERS=1 npx playwright test r7-p2-startseite.spec.js --project=desktop
// Prüft: Kern-USP (Handzeichnung) im ersten Bildschirm auf 390 × 844 und
// 1440 × 900, höchstens zwei Ebenen unter dem CTA am Handy, EN/FR/IT ohne
// unmarkierte Links auf DE-Seiten in <main>, Werkzeug-Abschnitt EN/FR/IT,
// Regionen-Links nur auf indexierte Seiten, kein Querscroll, axe (WCAG 2.2 AA)
// und reduced motion. Die Cookie-Leiste wird per Einwilligung geschlossen.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { passesDoorwayAudit } from "../../src/lib/seo/sitemap/doorwayAudit.js";

const HERO = "section[aria-labelledby=home-hero-title]";
const USP = { de: /von Hand/, en: /by hand/, fr: /à la main/, it: /a mano/ };

async function open(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 150_000 });
  await page.waitForSelector(HERO, { timeout: 150_000 });
}

test.describe("P2 Startseite", () => {
  for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    for (const l of ["de", "en"]) {
      test(`USP-Satz im ersten Bildschirm ${l} ${vp.width}×${vp.height}`, async ({ browser }) => {
        const ctx = await browser.newContext({ viewport: vp, reducedMotion: "reduce" });
        const page = await ctx.newPage();
        await open(page, `/${l}`);
        const sel = vp.width < 640 ? "[data-hero-usp-phone]" : "[data-hero-usp]";
        const usp = page.locator(sel);
        await expect(usp).toBeVisible();
        await expect(usp).toHaveText(USP[l]);
        const box = await usp.boundingBox();
        expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vp.width);
        await ctx.close();
      });
    }
  }

  test("Handy: unter dem CTA höchstens zwei Ebenen bis zur Infozeile (Coda-Block + Info)", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await open(page, "/de");
    const blocks = await page.evaluate((h) => {
      const sec = document.querySelector(h);
      const grid = sec.firstElementChild;
      const cta = sec.querySelector("[data-wow-cta]").closest(`${h} > div > div`);
      const kids = [...grid.children].filter((c) => getComputedStyle(c).display !== "none" && !c.matches("[data-wow-stage]"));
      return kids.slice(kids.indexOf(cta) + 1).length;
    }, HERO);
    expect(blocks).toBeLessThanOrEqual(2);
    // the image credit sits on the photo
    const credit = await page.locator("[data-wow-stage] figcaption").boundingBox();
    const frame = await page.locator("[data-wow-frame]").boundingBox();
    expect(credit.y).toBeGreaterThanOrEqual(frame.y);
    expect(credit.y + credit.height).toBeLessThanOrEqual(frame.y + frame.height);
    await ctx.close();
  });

  for (const l of ["en", "fr", "it"]) {
    test(`/${l}: keine unmarkierten Links auf DE-Seiten, Werkzeuge mit Sprachhinweis`, async ({ request }) => {
      const html = await (await request.get(`/${l}`)).text();
      const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
      const toDe = [...main.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]).filter((a) => /href="\/de[/"?#]/.test(a));
      for (const a of toDe) expect(a, a).toMatch(/hreflang="de"/i);
      // Rat 9,5 B11 (Auftrag T2 → T4, bewusst geändert): /en zeigt den Showcase mit
      // englischen Werkzeugseiten, FR/IT behalten den deutsch markierten Abschnitt.
      if (l === "en") expect(main).toContain('id="home-labs-title"');
      else expect(main).toContain("data-home-tools-abroad");
      expect(main).not.toMatch(/href="\/de\/(kuechen-vorarlberg|interior-design-vorarlberg|outdoor-gartenplanung|yacht-interior)/);
    });
  }

  test("/de: Regionen-Links nur auf indexierte Seiten, Hotel-Karte mit Thema", async ({ request }) => {
    const html = await (await request.get("/de")).text();
    const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    // R8 (bewusst geänderte Erwartung): die Städte folgen dem Doorway-Audit statt
    // einer festen Liste – seit P3 die Fakten für Bregenz geliefert hat, ist Bregenz
    // indexiert und darf verlinkt werden; nicht bestandene Städte bleiben unverlinkt.
    for (const city of ["bregenz", "dornbirn", "lindau", "friedrichshafen", "st-gallen"]) {
      const href = `href="/de/designermoebel-${city}"`;
      if (passesDoorwayAudit(`/designermoebel-${city}`)) continue; // verlinkt oder nicht – beides zulässig
      expect(main).not.toContain(href);
    }
    for (const r of ["liechtenstein", "rheintal", "arlberg", "konstanz", "feldkirch", "appenzell"]) {
      expect(main).toContain(`href="/de/designermoebel-${r}"`);
    }
    expect(main).toContain('href="/de/hotel-objekt"'); // Welle 2 (Inhaber Nr. 13, bewusst geändert): Hotel-Karte → Seite Hotel & Objekt
  });

  for (const l of ["de", "en", "fr", "it"]) {
    test(`axe WCAG 2.2 AA /${l} (ohne Banner)`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      const page = await ctx.newPage();
      await open(page, `/${l}`);
      const accept = page.getByRole("button", { name: /Alle akzeptieren|Accept all|Tout accepter|Accetta tutti/ });
      if (await accept.count()) await accept.first().click().catch(() => {});
      await page.waitForLoadState("load");
      const r = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
      expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
      await ctx.close();
    });
  }

  test("reduced motion: Coda und USP stehen sofort, keine laufende Animation im Hero", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await open(page, "/de");
    const running = await page.evaluate((h) =>
      document.getAnimations().filter((a) => a.playState === "running" && document.querySelector(h).contains(a.effect?.target)).length,
    HERO);
    expect(running).toBe(0);
    await expect(page.locator("p[data-wow-coda] a")).toBeVisible();
    await ctx.close();
  });
});
