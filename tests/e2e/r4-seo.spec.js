// R4-seo live checks (desktop project, reads server output only):
//   - an imported-catalogue product (Brand van Egmond, Treca, Next125) from
//     /sitemap-produkte.xml answers 200 with index,follow and self-canonical,
//   - hreflang reciprocity of one cluster per sitemap type,
//   - Rich-Results sample (Product, BreadcrumbList, FAQPage, LocalBusiness),
//   - /llms.txt lists no Yacht line (page is noindex since 28.10.2026).
// The broad crawl is src/lib/seo/audit/crawl.mjs (report in
// qa-screenshots/teamleiter/r4-seo/audit.json).
import { test, expect } from "@playwright/test";
import {
  checkHreflangReciprocity,
  isNoindex,
  jsonLdNodes,
  parseHead,
  parseLocs,
  richResultKind,
  validateRichResult,
} from "../../src/lib/seo/audit/seoAudit.js";

const SITE = "https://platzhirsch.studio";
const local = (u) => u.replace(SITE, "");

async function page(request, url) {
  const res = await request.get(local(url), { maxRedirects: 0 });
  const body = res.status() === 200 ? await res.text() : "";
  return { status: res.status(), ...parseHead(body) };
}

test.describe("R4-seo", () => {
  // A test.skip() callback only receives fixtures, not testInfo; check the
  // project in beforeEach instead.
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "nur desktop");
  });

  test("importierte Produkte stehen in sitemap-produkte.xml und sind indexierbar", async ({ request }) => {
    const xml = await (await request.get("/sitemap-produkte.xml")).text();
    const locs = parseLocs(xml);
    for (const slug of ["lamps-arthur-ceiling-lamp-round", "kitchen-nx115", "small-furniture-bank-adonis"]) {
      const url = locs.find((u) => u.startsWith(`${SITE}/de/`) && u.endsWith(`/${slug}`));
      expect(url, `${slug} in sitemap-produkte.xml`).toBeTruthy();
      const p = await page(request, url);
      expect(p.status, url).toBe(200);
      expect(isNoindex(p.robots), `${url} robots ${p.robots}`).toBe(false);
      expect(p.canonical).toBe(url);
    }
    expect(locs.some((u) => /\/(bve|n125|treca)-\d+$/.test(u))).toBe(false);
  });

  for (const path of ["/de/ueber-uns/marken/minotti", "/de/ueber-uns/marken/minotti/sofas-couches", "/de/produkte/sofas-couches"]) {
    test(`hreflang-Cluster ist reziprok: ${path}`, async ({ request }) => {
      const seed = `${SITE}${path}`;
      const pages = new Map([[seed, await page(request, seed)]]);
      for (const t of new Set(Object.values(pages.get(seed).hreflang))) {
        if (!pages.has(t)) pages.set(t, await page(request, t));
      }
      expect(Object.keys(pages.get(seed).hreflang)).toEqual(expect.arrayContaining(["de", "en", "fr", "it", "x-default"]));
      expect(checkHreflangReciprocity(pages).errors).toEqual([]);
    });
  }

  // Runde 2 (seo P1-5): product pages are ItemPage + Thing (no Product without
  // offers – prices stay "auf Anfrage"), so "Product" is no longer a rich result
  // kind here; the remaining kinds must stay valid and no Product node may appear.
  test("Rich Results: BreadcrumbList, FAQPage, LocalBusiness gültig, kein Product ohne offers", async ({ request }) => {
    const kinds = new Map();
    for (const path of ["/de/produkte/small-furniture/small-furniture-bank-adonis", "/de/yacht-interior", "/de"]) {
      const p = await page(request, `${SITE}${path}`);
      expect(p.status, path).toBe(200);
      expect(p.jsonLdErrors, path).toBe(0);
      for (const node of jsonLdNodes(p.jsonLd)) {
        const kind = richResultKind(node);
        if (!kind) continue;
        expect(validateRichResult(node), `${path} ${kind}`).toEqual([]);
        kinds.set(kind, true);
      }
      expect(jsonLdNodes(p.jsonLd).some((n) => [].concat(n["@type"]).includes("Product")), `${path}: Product`).toBe(false);
    }
    expect([...kinds.keys()].sort()).toEqual(["BreadcrumbList", "FAQPage", "LocalBusiness"]);
  });

  // Expectation reversed (F6, 28.10.2026): Inhaber-Entscheidung Nr. 9 integrates
  // Yacht as a fixed part of the site – /de/yacht-interior is index, follow again
  // (the unreleased Minotti/Custom-Line chapter is left out instead of hiding the
  // page) and is listed via src/lib/seo/sitemap/extraPages.js. So llms.txt must
  // now list it, with the factual line that names the trades (no partner claim).
  test("llms.txt: Yacht (integriert, indexierbar) gelistet", async ({ request }) => {
    const res = await request.get("/llms.txt");
    expect(res.status(), "/llms.txt").toBe(200);
    const text = await res.text();
    expect(text).toContain("](https://platzhirsch.studio/de/yacht-interior)");
    expect(text).toContain("übernehmen Bootssattler und Werft");
    expect(text).not.toMatch(/Navetta|Custom Line/);
  });
});
