// tests/e2e/r5-usp-startseite.spec.js – Fix-Team P1 Runde 4 (R5-USP):
// gesamtwerk P0-1/P1-2/P1-5, neuland P1-1, seo P1-4, P2 Karte/Sofa.
//  - no "keine Handzeichnung"/"keine Skizze" within 600 px of the H1
//    (iPhone, iPad, desktop) on /de and /de/arbeitsweise;
//  - ONE line caption: identical strings in the three source files, one
//    wording in the HTML;
//  - the armchair line graphic at most once per page;
//  - /de on an iPhone: <main> below 9 000 px, opening hours once in <main>;
//  - the Wow line rests on the photo after the sequence, at once with reduced motion;
//  - home title with Lochau + Bodensee/Lake Constance, ≤ 60 characters;
//  - "Mehr als Möbel": no hole in the grid, the hotel card has one target;
//  - Dreiländer map: no overlapping labels at 375 / 768 / 1440 px.
import fs from "node:fs";
import path from "node:path";
import { test, expect, devices } from "@playwright/test";
import MESSAGES from "../../src/lib/wow/messages.js";

const ROOT = process.cwd(); // Playwright runs from the repo root
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const strip = ({ defaultBrowserType: _b, ...d }) => d;
const DEVICES = [
  ["iPhone", strip(devices["iPhone 15 Pro"])],
  ["iPad", strip(devices["iPad Pro 11"])],
  ["Desktop", { viewport: { width: 1440, height: 900 } }],
];
const NEG = /keine Handzeichnung|keine Skizze/;
const SLOW = { waitUntil: "networkidle", timeout: 300_000 };

test.describe("R5-USP: Bildzeile und Kern-USP", () => {
  test("eine Bildzeile: identische Strings in Wow, Startseite und Arbeitsweise (4 Sprachen)", () => {
    const home = read("src/components/Home/copy.js");
    const aw = read("src/lib/arbeitsweise/copy.js");
    const homeCaps = [...home.matchAll(/lineCaption: "([^"]+)"/g)].map((m) => m[1]);
    expect(homeCaps).toHaveLength(4);
    // R5-fix P2 (gesamtwerk P1-1, bewusst geändert): /arbeitsweise hat keine
    // Liniengrafik mit Bildzeile mehr (Papierblatt) – also auch keine lineCaption.
    expect(aw).not.toMatch(/lineCaption/);
    ["de", "en", "fr", "it"].forEach((l, i) => {
      expect(homeCaps[i]).toBe(MESSAGES[l].caption.phaseA);
      expect(MESSAGES[l].caption.phaseA).not.toMatch(/Skizze|sketch|esquisse|schizzo|Handzeichnung|hand drawing/i);
    });
    // R5-fix P2 (recht P1-1): IT-Knopf im voi-Imperativ
    expect(MESSAGES.it.show.open).toBe("Mostrate la linea");
  });

  for (const url of ["/de", "/de/arbeitsweise"]) {
    test(`${url}: Bildzeile nur in einer Fassung im HTML`, async ({ request }) => {
      const html = await (await request.get(url, { timeout: 300_000 })).text();
      expect(html).not.toMatch(/keine Handzeichnung|keine Skizze|abstrahierte Grafik|Grafik, keine/);
      const caps = new Set(html.match(/Linie: [A-Za-zÄÖÜäöüß ]+/g) || []);
      // R5-fix P2 (bewusst geändert): /de/arbeitsweise trägt keine Bildzeile mehr (Papierblatt).
      expect([...caps]).toEqual(url === "/de" ? ["Linie: Zeichen des Studios"] : []);
    });
  }

  for (const [name, device] of DEVICES) {
    test(`${name}: keine Verneinung des USP im Umkreis von 600 px um die H1 (/de, /de/arbeitsweise)`, async ({ browser }) => {
      const ctx = await browser.newContext(device);
      const page = await ctx.newPage();
      for (const url of ["/de", "/de/arbeitsweise"]) {
        await page.goto(url, SLOW);
        const near = await page.evaluate((src) => {
          const re = new RegExp(src);
          const h1 = document.querySelector("h1").getBoundingClientRect();
          const top = h1.top + scrollY - 600;
          const bottom = h1.bottom + scrollY + 600;
          const hits = [];
          const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          for (let n = walk.nextNode(); n; n = walk.nextNode()) {
            if (!re.test(n.textContent)) continue;
            const r = n.parentElement.getBoundingClientRect();
            if (r.height && r.bottom + scrollY > top && r.top + scrollY < bottom) hits.push(n.textContent.trim());
          }
          return hits;
        }, NEG.source);
        expect(near, url).toEqual([]);
      }
      await ctx.close();
    });
  }

  test("Sessel-Grafik höchstens einmal je Seite; Arbeitsweise ohne Tafel und Monogramm", async ({ page }) => {
    await page.goto("/de", SLOW);
    expect(await page.locator("main [data-wow-stage], main figure[data-line-study]").count()).toBeLessThanOrEqual(1);
    await expect(page.locator("[data-home-process] [data-process-type]")).toBeVisible();
    await page.goto("/de/arbeitsweise", SLOW);
    expect(await page.locator("main [data-wow-stage], main figure[data-line-study]").count()).toBeLessThanOrEqual(1);
    await expect(page.locator("[data-harald-plaque]")).toHaveCount(0);
    await expect(page.locator("[data-harald-text]")).toBeVisible();
    await expect(page.locator("main")).not.toContainText("Leitsatz des Studios");
  });
});

test.describe("R5-USP: Startseite ohne SEO-Format", () => {
  test("iPhone: <main> unter 9 000 px, Öffnungszeiten einmal, Regionen als eine Zeile am Ende", async ({ browser }) => {
    const ctx = await browser.newContext(strip(devices["iPhone 15 Pro"]));
    const page = await ctx.newPage();
    await page.goto("/de", SLOW);
    const r = await page.evaluate(() => {
      const main = document.querySelector("main");
      const text = main.innerText;
      const order = [...main.querySelectorAll("section[aria-labelledby]")].map((s) => s.getAttribute("aria-labelledby"));
      return { h: Math.round(main.getBoundingClientRect().height), hours: (text.match(/10[–-]18/g) || []).length, order };
    });
    expect(r.h).toBeLessThan(9000);
    expect(r.hours).toBe(1);
    expect(r.order.slice(-2)).toEqual(["home-seo-title", "home-cta-title"]);
    await expect(page.locator("section[aria-labelledby=home-region-title] a[href*='designermoebel-']")).toHaveCount(0);
    expect(await page.locator("[data-home-regions] a").count()).toBeGreaterThan(5);
    await expect(page.locator("[data-home-faq]")).not.toHaveAttribute("open", /.*/);
    await ctx.close();
  });

  // Inhaber 30.10.2026 (bewusst geändert): Firmenname + Lochau, höchstens 65 Zeichen.
  test("Titel: Platzhirsch Home Living und Lochau, höchstens 65 Zeichen (4 Sprachen)", async ({ request }) => {
    for (const l of ["de", "en", "fr", "it"]) {
      const html = await (await request.get(`/${l}`, { timeout: 300_000 })).text();
      const title = html.match(/<title>([^<]*)<\/title>/)[1].replace(/&amp;/g, "&");
      expect(title.length, `${l}: ${title}`).toBeLessThanOrEqual(65);
      expect(title).toMatch(/Lochau/);
      expect(title).toMatch(/^Platzhirsch Home Living – /);
    }
  });

  for (const width of [768, 1440]) {
    test(`Mehr als Möbel ${width} px: keine Lücke im Raster, Hotel-Karte mit einem Ziel`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/de", SLOW);
      const rows = await page.$$eval("[data-home-service]", (els) => {
        const list = els[0].parentElement.getBoundingClientRect();
        const byRow = new Map();
        for (const e of els) {
          const r = e.getBoundingClientRect();
          const k = Math.round(r.top);
          byRow.set(k, [...(byRow.get(k) || []), r]);
        }
        return [...byRow.values()].map((rs) => ({ left: Math.min(...rs.map((r) => r.left)) - list.left, right: list.right - Math.max(...rs.map((r) => r.right)) }));
      });
      for (const r of rows) {
        expect(r.left).toBeLessThan(2);
        expect(r.right).toBeLessThan(2);
      }
      const links = await page.$$eval("[data-home-service=objekt] a[href]", (as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
      // Welle 2 (Inhaber Nr. 13, bewusst geändert): die Hotel-Karte führt auf die neue Seite
      // Hotel & Objekt (homeLinks.js SERVICES) – weiterhin genau ein Ziel.
      expect(links).toEqual(["/de/hotel-objekt"]);
    });
  }

  for (const width of [375, 768, 1440]) {
    test(`Dreiländer-Karte ${width} px: Beschriftungen überlappen nicht`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/de", SLOW);
      const overlaps = await page.$$eval("section[aria-labelledby=home-region-title] svg[role=img] text", (els) => {
        const boxes = els.map((e) => ({ t: e.textContent, r: e.getBoundingClientRect() }));
        const out = [];
        for (let i = 0; i < boxes.length; i++)
          for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i].r;
            const b = boxes[j].r;
            if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) out.push(`${boxes[i].t} × ${boxes[j].t}`);
          }
        return out;
      });
      expect(overlaps).toEqual([]);
    });
  }
});

test.describe("R5-USP: Wow-Linie bleibt stehen", () => {
  test("nach der Sequenz ruht die Linie auf dem Foto; „Nur das Foto“ blendet sie aus", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/de", SLOW);
    const stage = page.locator("[data-wow-stage]");
    await expect(stage).not.toHaveAttribute("data-wow", "play", { timeout: 30_000 });
    const rest = page.locator("[data-wow-rest]");
    await expect.poll(() => rest.evaluate((e) => Number(getComputedStyle(e).opacity))).toBeGreaterThan(0.99);
    expect(await rest.locator("use").count()).toBeGreaterThan(0);
    const show = page.locator("[data-wow-show]");
    await expect(show).not.toHaveAttribute("aria-disabled", "true");
    await show.click(); // comparison open: paper on the left, photo alone on the right
    await show.click(); // "Nur das Foto"
    await expect(stage).toHaveAttribute("data-wow-photo", "");
    await expect.poll(() => rest.evaluate((e) => Number(getComputedStyle(e).opacity))).toBeLessThan(0.01);
    await ctx.close();
  });

  test("reduced motion: Endzustand mit Linie sofort, ohne Animation", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/de", { waitUntil: "domcontentloaded", timeout: 300_000 });
    const stage = page.locator("[data-wow-stage]");
    await expect(stage).toHaveAttribute("data-wow", "still");
    const op = await page.locator("[data-wow-rest]").evaluate((e) => ({ o: getComputedStyle(e).opacity, a: e.getAnimations().length }));
    expect(op).toEqual({ o: "1", a: 0 });
    await ctx.close();
  });
});
