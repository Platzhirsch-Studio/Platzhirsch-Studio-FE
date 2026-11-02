// SEO guard rails: one H1, title, absolute canonical, hreflang on multilingual
// pages, parseable JSON-LD, noindex on internal pages, well-formed sitemaps.
// Desktop project only (see playwright.config.js; the checks do not depend on the device).
import { test, expect } from "@playwright/test";
import { CORE_PAGES, MULTILINGUAL_PAGES, conciergeAvailable, getText, locs, mapLimit, toLocal } from "./helpers.js";

const LOCALES = ["de", "en", "fr", "it"];
// Runde 2 (recht P1-5/P2-6): in the production build these pages are 404 until
// release (Ratgeber) or a confirmed start time (Adventsabend); in development
// they render. A 404 there is the intended production state, not an error.
const PROD_GATED = new Set(["/de/ratgeber", "/de/adventsabend"]);

test.describe("Kopfdaten der Kernseiten", () => {
  for (const path of CORE_PAGES) {
    test(`meta ${path}`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      if (PROD_GATED.has(path) && res.status() === 404) return;
      expect(res.status()).toBe(200);

      await expect(page.locator("h1"), "genau eine H1").toHaveCount(1);

      const title = (await page.title()).trim();
      expect(title.length, "title vorhanden").toBeGreaterThan(0);

      const canonicals = await page.locator('head link[rel="canonical"]').evaluateAll((els) =>
        els.map((e) => e.getAttribute("href"))
      );
      expect(canonicals, "genau ein canonical").toHaveLength(1);
      expect(canonicals[0], "canonical absolut (https)").toMatch(/^https:\/\/[^/]+\//);

      const alternates = await page
        .locator('head link[rel="alternate"][hreflang]')
        .evaluateAll((els) => els.map((e) => ({ lang: e.getAttribute("hreflang"), href: e.getAttribute("href") })));
      if (MULTILINGUAL_PAGES.includes(path)) {
        const langs = alternates.map((a) => a.lang);
        for (const l of [...LOCALES, "x-default"]) expect(langs, `hreflang ${l}`).toContain(l);
        for (const a of alternates) expect(a.href, `hreflang ${a.lang} absolut`).toMatch(/^https:\/\//);
      }

      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
      for (const [i, raw] of blocks.entries()) {
        expect(() => JSON.parse(raw), `JSON-LD Block ${i + 1} parsebar`).not.toThrow();
      }
    });
  }
});

/** robots directives from meta tag and X-Robots-Tag header. */
function robotsOf({ text, headers }) {
  const metas = [...text.matchAll(/<meta[^>]+name="robots"[^>]*>/gi)].map((m) => {
    const c = m[0].match(/content="([^"]*)"/i);
    return c ? c[1] : "";
  });
  return [...metas, headers["x-robots-tag"] || ""].join(",").toLowerCase();
}

// Integration 28.10.2026 (Inhaber-Entscheidung Nr. 9): die Planer haben feste, indexierbare URLs; noindex bleiben Upload, Portal und Vorschauen.
test.describe("index auf den festen Werkzeug-Seiten", () => {
  for (const path of ["/de/3d-ansicht", "/de/concierge", "/de/dreilaender-rechner", "/de/kuechenplaner", "/de/sofaplaner", "/de/stil-finder", "/de/leistungen", "/de/yacht-interior", "/de/ezarri"]) {
    test(`index ${path}`, async ({ request }) => {
      const res = await getText(request, path);
      expect(res.status).toBe(200);
      // P6 Runde 2 (bewusst geänderte Erwartung, F2): ohne KI-Schlüssel ist
      // /de/concierge "noindex, follow" – die Erwartung folgt /api/labs/status.
      if (path === "/de/concierge" && !(await conciergeAvailable(request))) {
        expect(robotsOf(res)).toContain("noindex");
        return;
      }
      expect(robotsOf(res)).not.toContain("noindex");
    });
  }
});

test.describe("noindex auf internen Seiten", () => {
  const NOINDEX = [
    "/de/upload",
    "/de/portal", // leitet auf /de/portal/login weiter
    "/de/preview/buehne",
    "/de/preview/dreilaendereck",
    "/de/preview/galerie",
  ];
  for (const path of NOINDEX) {
    test(`noindex ${path}`, async ({ request }) => {
      const res = await getText(request, path);
      // P6 Runde 2 (bewusst geänderte Erwartung, F5): Gestaltungs-Vorschauen
      // gibt es in Produktion nicht (404 ohne DESIGN_PREVIEW=1). Dann ist 404
      // richtig, mit Schalter 200 + noindex.
      if (path.startsWith("/de/preview/") && res.status === 404) return;
      expect(res.status).toBe(200);
      expect(robotsOf(res)).toContain("noindex");
    });
  }

  // Pages whose code says "noindex" but that are still served as index, follow.
  // While that is so the test ends as fixme with the owner; once the page is
  // noindex it passes (then move it to NOINDEX). If the owner decides to keep it
  // indexed, delete the entry and fix the code comment.
  const PENDING_NOINDEX = {
    "/de/kuechen-vorarlberg":
      "Team 5 / R1-seo: Code-Kommentar 'Kept noindex until the copy is final', ausgeliefert wird 'index, follow' (Seite steht in sitemap-static.xml)",
  };
  for (const [path, owner] of Object.entries(PENDING_NOINDEX)) {
    test(`noindex ${path} (offen)`, async ({ request }, testInfo) => {
      const res = await getText(request, path);
      expect(res.status).toBe(200);
      const robots = robotsOf(res);
      if (!robots.includes("noindex")) {
        testInfo.annotations.push({ type: "offener Befund", description: `${owner}\nrobots: ${robots}` });
        test.fixme(true, `noindex fehlt (${owner})`);
      }
    });
  }

  test("robots und Sitemap widersprechen sich nicht (noindex-Seiten fehlen in der Sitemap)", async ({
    request,
  }) => {
    test.setTimeout(300_000);
    const index = await getText(request, "/sitemap.xml");
    expect(index.status).toBe(200);
    const listed = new Set();
    for (const child of locs(index.text)) {
      if (/produkte/.test(child)) continue; // product URLs are not among the checked pages
      const sm = await getText(request, new URL(child).pathname);
      for (const u of locs(sm.text)) listed.add(new URL(u).pathname);
    }
    const checked = [...NOINDEX, ...Object.keys(PENDING_NOINDEX), "/de/adventsabend"];
    const conflicts = [];
    for (const path of checked) {
      const res = await getText(request, path);
      if (robotsOf(res).includes("noindex") && listed.has(path)) conflicts.push(path);
    }
    expect(conflicts, "noindex-Seiten in der Sitemap").toEqual([]);
  });

  test("noindex /de/adventsabend, solange keine Uhrzeit gesetzt ist", async ({ request }) => {
    const res = await getText(request, "/de/adventsabend");
    if (res.status === 404) return; // production without start time (recht P2-6)
    expect(res.status).toBe(200);
    // With a start time the page publishes an Event schema with a time (…T19:00…).
    const blocks = [...res.text.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(
      (m) => m[1]
    );
    const hasTimedEvent = blocks.some((b) => /"@type"\s*:\s*"Event"/.test(b) && /"startDate"\s*:\s*"[^"]*T\d{2}:\d{2}/.test(b));
    if (hasTimedEvent) {
      expect(robotsOf(res)).not.toContain("noindex");
    } else {
      expect(robotsOf(res)).toContain("noindex");
    }
  });
});

test.describe("Sitemaps", () => {
  /** Well-formedness via the browser's XML parser. */
  async function assertWellFormed(page, xml, label) {
    const error = await page.evaluate((src) => {
      const doc = new DOMParser().parseFromString(src, "application/xml");
      const err = doc.getElementsByTagName("parsererror")[0];
      return err ? err.textContent.slice(0, 300) : null;
    }, xml);
    expect(error, `${label} wohlgeformt`).toBeNull();
  }

  test("sitemap.xml und alle Teil-Sitemaps sind wohlgeformt, 20 Stichproben liefern 200", async ({
    page,
    request,
    baseURL,
  }) => {
    test.setTimeout(600_000);
    await page.goto("about:blank");

    const index = await getText(request, "/sitemap.xml");
    expect(index.status).toBe(200);
    expect(index.headers["content-type"]).toMatch(/xml/);
    await assertWellFormed(page, index.text, "sitemap.xml");
    expect(index.text).toContain("<sitemapindex");

    const children = locs(index.text);
    expect(children.length, "Teil-Sitemaps im Index").toBeGreaterThan(0);

    const all = [];
    for (const child of children) {
      expect(child, "Teil-Sitemap absolut").toMatch(/^https:\/\//);
      const sm = await getText(request, toLocal(child, baseURL));
      expect(sm.status, `${child} Status`).toBe(200);
      await assertWellFormed(page, sm.text, child);
      expect(sm.text).toContain("<urlset");
      const urls = locs(sm.text);
      expect(urls.length, `${child} enthält URLs`).toBeGreaterThan(0);
      for (const u of urls) expect(u, `absolute URL in ${child}`).toMatch(/^https:\/\//);
      for (const m of sm.text.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
        expect(Number.isNaN(Date.parse(m[1])), `lastmod ${m[1]}`).toBe(false);
      }
      all.push(urls);
    }

    // Deterministic sample: 20 URLs spread evenly across all sub-sitemaps.
    const flat = all.flat();
    const step = Math.max(1, Math.floor(flat.length / 20));
    const sample = Array.from({ length: Math.min(20, flat.length) }, (_, i) => flat[i * step]);
    const results = await mapLimit(sample, 3, async (u) => {
      const res = await request.get(toLocal(u, baseURL), { timeout: 120_000, maxRedirects: 0 });
      return { url: u, status: res.status() };
    });
    const bad = results.filter((r) => r.status !== 200);
    expect(bad, "Stichprobe: alle 200, keine Weiterleitung").toEqual([]);
  });
});
