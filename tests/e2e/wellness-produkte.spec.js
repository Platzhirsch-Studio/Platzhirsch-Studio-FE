// tests/e2e/wellness-produkte.spec.js
// Herstellerkatalog Bad & Wellness (31.10.2026): Übersicht mit Filter,
// Markenseite, Produktdetail, Einbindung auf /bad-wellness, axe (WCAG 2.2 AA),
// Screenshots 390/1440 DE+EN nach qa-screenshots/wellness/produkte/.
// Aufruf: PW_WORKERS=1 npx playwright test tests/e2e/wellness-produkte.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { collectConsoleErrors, dismissCookieBanner, jsonLdNodes, measureOverflow, settle } from "./helpers.js";

const SHOTS = "qa-screenshots/wellness/produkte";
const UEBERSICHT = "/bad-wellness/produkte";
const MARKE = "/bad-wellness/marke/soleum";
const PRODUKT = "/bad-wellness/produkte/soleum-flying-carpet";

async function axe(page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).exclude("nextjs-portal").analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`);
}

test.describe("Katalog Bad & Wellness – Server-HTML", () => {
  for (const locale of ["de", "en", "fr", "it"]) {
    for (const path of [UEBERSICHT, MARKE, PRODUKT, "/bad-wellness/kategorie/waermeliege"]) {
      test(`${locale}${path}: 200, Canonical, hreflang, index`, async ({ request }) => {
        const res = await request.get(`/${locale}${path}`);
        expect(res.status()).toBe(200);
        const html = await res.text();
        expect(html).toContain(`<link rel="canonical" href="https://platzhirsch.studio/${locale}${path}"/>`);
        for (const l of ["de", "en", "fr", "it", "x-default"]) expect(html).toMatch(new RegExp(`hrefLang="${l}" href="https://platzhirsch.studio/${l === "x-default" ? "de" : l}${path}"`));
        expect(html).toMatch(/<meta name="robots" content="index, follow"/);
      });
    }
  }

  test("Produkt-JSON-LD ohne offers/price/aggregateRating/review", async ({ request }) => {
    const html = await (await request.get(`/de${PRODUKT}`)).text();
    const product = jsonLdNodes(html).find((n) => n["@type"] === "Product");
    expect(product?.name).toBe("Flying Carpet");
    expect(product?.brand?.name).toBe("Soleum");
    expect(product?.image?.length).toBeGreaterThan(0);
    expect(JSON.stringify(jsonLdNodes(html))).not.toMatch(/aggregateRating|"review"|"offers"|"price"/);
  });

  // Bewusst geändert 31.10.2026 (Katalog-Integration): Agape, Küchengeräte und Accessoires haben inzwischen Produkte;
  // 404 jetzt für Marken ohne Produkte in DIESER Welt und Kategorien ohne Produkte (K2: Welt je Produkt).
  test("unbekannter Slug, Marke ohne Produkte in der Welt, leere Kategorie/Seite: 404", async ({ request }) => {
    for (const p of ["/de/bad-wellness/produkte/gibt-es-nicht", "/de/bad-wellness/marke/gaggenau", "/de/kuechengeraete/marke/agape", "/de/bad-wellness/marke/soleum/seite/2", "/de/bad-wellness/kategorie/backofen", "/de/kuechengeraete/kategorie/kuechenzubehoer"]) {
      expect((await request.get(p)).status(), p).toBe(404);
    }
  });
});

test.describe("Katalog Bad & Wellness – Browser", () => {
  test("Übersicht gruppiert nach Kategorie (je Gruppe ≤ 8 + Link), Markenseite filtert per URL, axe", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(`/de${UEBERSICHT}`);
    await dismissCookieBanner(page, 5_000);
    const gruppen = page.locator("[data-kat-gruppe]");
    expect(await gruppen.count()).toBeGreaterThanOrEqual(5);
    for (const g of await gruppen.all()) expect(await g.locator("[data-kat-item]").count()).toBeLessThanOrEqual(8);
    await expect(page.locator('[data-kat-kategorie-link="waermeliege"]')).toHaveAttribute("href", "/de/bad-wellness/kategorie/waermeliege");
    expect(await axe(page)).toEqual([]);
    // Markenseite: alle Produkte (eine Seite), Filter nach Kategorie
    await page.goto(`/de${MARKE}`);
    const total = await page.locator("[data-kat-item]").count();
    expect(total).toBeGreaterThanOrEqual(10); // Nr. 33: Soleum nur fertige Produkte
    // Insel hydriert, sobald der Zähler steht
    await expect(page.locator("[data-kat-count]")).toHaveText(`${total} Produkte`);
    await page.locator('[data-kat-select="kategorie"]').selectOption("waermeliege");
    await expect(page).toHaveURL(/kategorie=waermeliege/);
    await expect(page.locator("[data-kat-item]:visible")).toHaveCount(7);
    await expect(page.locator("[data-kat-count]")).toHaveText("7 Produkte");
    await page.locator("[data-kat-reset]").click();
    await expect(page.locator("[data-kat-item]:visible")).toHaveCount(total);
    await page.goto(`/de${MARKE}?kategorie=spa-kabine`); // Soleum ohne Dusche seit Nr. 33
    await expect(page.locator("[data-kat-count]")).not.toHaveText("");
    await expect(page.locator('[data-kat-select="kategorie"]')).toHaveValue("spa-kabine");
    await expect(page.locator("[data-kat-item]:visible")).toHaveCount(await page.locator('[data-kat-item][data-kategorie="spa-kabine"]').count());
    expect(await axe(page)).toEqual([]);
    // Kategorieseite
    await page.goto("/de/bad-wellness/kategorie/waermeliege");
    expect(await page.locator("[data-kat-item]").count()).toBeGreaterThanOrEqual(7); // alle Marken (Soleum 7 + Fabio Alemanno, Starpool)
    expect(await axe(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("Produktdetail: Bild unbeschnitten mit Bildnachweis, Hersteller-Link, Beratung, Merkliste, axe", async ({ page }) => {
    await page.goto(`/de${PRODUKT}`);
    await dismissCookieBanner(page, 5_000);
    const img = page.locator("[data-kat-detail] figure img").first();
    await expect(img).toHaveAttribute("data-pin-nopin", "true");
    expect(await img.evaluate((el) => getComputedStyle(el).objectFit)).toBe("contain");
    // Rahmen folgt dem Bildformat (kein Zuschnitt): Seitenverhältnis wie die Datei
    const ratio = await img.evaluate((el) => [el.naturalWidth / el.naturalHeight, el.clientWidth / el.clientHeight]);
    expect(Math.abs(ratio[0] - ratio[1])).toBeLessThan(0.03);
    await expect(page.locator("[data-kat-detail] figcaption").first()).toHaveText("Bild: Soleum");
    const hersteller = page.locator("[data-kat-hersteller]");
    await expect(hersteller).toHaveAttribute("href", /^https:\/\/www\.soleum\.(at|de)\//);
    await expect(hersteller).toHaveAttribute("target", "_blank");
    await expect(page.locator("[data-kat-beratung]")).toHaveAttribute("href", /thema=wellness/);
    await expect(page.locator("[data-kat-beratung]")).toHaveAttribute("href", /produkt=Soleum/);
    await page.locator("[data-kat-merken]").click();
    await expect.poll(() => page.evaluate(() => JSON.stringify(Object.values(localStorage)))).toContain("katalog-soleum-flying-carpet");
    expect(await axe(page)).toEqual([]);
  });

  test("Markenseite EN und /bad-wellness: Links „Produkte ansehen“, „Ausgewählte Produkte“, axe", async ({ page }) => {
    await page.goto(`/en${MARKE}`);
    await dismissCookieBanner(page, 5_000);
    await expect(page.locator("h1")).toHaveText("Soleum – products");
    expect(await axe(page)).toEqual([]);
    await page.goto("/de/bad-wellness");
    await expect(page.locator('[data-kat-marke-link="soleum"]')).toHaveAttribute("href", "/de/bad-wellness/marke/soleum");
    await expect(page.locator('[data-kat-marke-link="agape"]')).toHaveAttribute("href", "/de/bad-wellness/marke/agape"); // Agape hat seit 31.10. Produkte
    await expect(page.locator('[data-kat-ausgewaehlt="bad-wellness"] [data-kat-item]')).toHaveCount(4);
  });
});

test.describe("Katalog Bad & Wellness – Screenshots", () => {
  for (const width of [390, 1440]) {
    for (const locale of ["de", "en"]) {
      test(`${locale} ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
        for (const [name, path] of [
          ["uebersicht", UEBERSICHT],
          ["marke", MARKE],
          ["produkt", PRODUKT],
          ["kategorie", "/bad-wellness/kategorie/waermeliege"],
        ]) {
          await page.goto(`/${locale}${path}`);
          await dismissCookieBanner(page, 5_000);
          await settle(page, 10_000);
          const o = await measureOverflow(page);
          expect(o.sw, `${path}: ${o.wide.join(", ")}`).toBeLessThanOrEqual(o.vw + 1);
          await page.screenshot({ path: `${SHOTS}/${locale}-${width}-${name}.png`, fullPage: true });
        }
        await page.goto(`/${locale}/bad-wellness`);
        await dismissCookieBanner(page, 5_000);
        const sec = page.locator('[data-kat-ausgewaehlt="bad-wellness"]');
        await sec.scrollIntoViewIfNeeded();
        await settle(page, 10_000);
        await sec.screenshot({ path: `${SHOTS}/${locale}-${width}-bad-wellness-ausgewaehlt.png` });
      });
    }
  }
});
