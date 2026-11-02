// Content smoke: Ratgeber hub and every Ratgeber article (src/content/ratgeber/*.md).
// 200 on /de, 404 on other locales, exactly one H1, robots matches the release
// flag (noindex until `freigegeben: true`), and no editorial marker such as
// "[prüfen: …]" or "[… eintragen]" reaches the HTML (visible text or payload).
// Desktop project only (server output, not device dependent).
import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { getText, htmlToText, robotsDirectives } from "./helpers.js";

const RATGEBER_DIR = path.join(process.cwd(), "src", "content", "ratgeber");

/** { slug, released } for every article file; slug from front matter, else file name. */
function articles() {
  if (!fs.existsSync(RATGEBER_DIR)) return [];
  return fs
    .readdirSync(RATGEBER_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((file) => {
      const src = fs.readFileSync(path.join(RATGEBER_DIR, file), "utf8");
      const head = (src.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || "";
      const slug = ((head.match(/^slug:\s*["']?([^"'\r\n]+)/m) || [])[1] || file.replace(/\.md$/, "")).trim();
      const released = /^freigegeben:\s*true\s*$/m.test(head);
      return { slug, released };
    });
}

const ARTICLES = articles();
const ANY_RELEASED = ARTICLES.some((a) => a.released);

// Editorial markers that must never be published (case-insensitive).
const MARKERS = /\[\s*pr(ü|ue)fen\b[^\]]*\]|\[[^\]<]{0,80}\beintragen\]/gi;

function markers(html) {
  return [...new Set((html.match(MARKERS) || []).map((m) => m.slice(0, 80)))];
}

function h1Count(html) {
  return (html.match(/<h1[\s>]/gi) || []).length;
}

test.describe("Ratgeber", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Server-Antwort, nur Desktop");
  });

  test("Artikel-Dateien vorhanden", () => {
    expect(ARTICLES.length, `Markdown-Dateien in ${RATGEBER_DIR}`).toBeGreaterThan(0);
  });

  // Runde 2 (recht P1-5): im Produktions-Build sind Hub und nicht freigegebene
  // Artikel 404 (wie die Previews); in der Entwicklung bleiben sie sichtbar.
  test("/de/ratgeber: 200, robots passend zur Freigabe, keine Redaktions-Marker", async ({ request }) => {
    const res = await getText(request, "/de/ratgeber");
    if (res.status === 404) {
      expect(ANY_RELEASED, "404 nur, solange kein Artikel freigegeben ist (Produktion)").toBe(false);
      return;
    }
    expect(res.status).toBe(200);
    const robots = robotsDirectives(res);
    if (ANY_RELEASED) expect(robots, "mindestens ein Artikel freigegeben → Hub indexierbar").not.toContain("noindex");
    else expect(robots, "kein Artikel freigegeben → Hub noindex").toContain("noindex");
    expect(h1Count(res.text), "genau eine H1").toBe(1);
    expect(markers(res.text), "Redaktions-Marker im HTML").toEqual([]);
    // Every article is linked from the hub.
    for (const a of ARTICLES) expect(res.text, `Hub verlinkt ${a.slug}`).toContain(`/de/ratgeber/${a.slug}`);
  });

  for (const locale of ["en", "fr", "it"]) {
    // E.21 (P6 Runde 2): EN/FR/IT-Adressen reiner DE-Seiten dürfen per 308 auf /de leiten.
    test(`/${locale}/ratgeber: 404 oder 308 auf /de (nur Deutsch)`, async ({ request }) => {
      const res = await request.get(`/${locale}/ratgeber`, { timeout: 120_000, maxRedirects: 0 });
      expect([404, 308]).toContain(res.status());
      if (res.status() === 308) expect(res.headers().location).toMatch(/^(https?:\/\/[^/]+)?\/de\/ratgeber(\?|$)/);
    });
  }

  for (const a of ARTICLES) {
    test(`/de/ratgeber/${a.slug}: 200, ${a.released ? "index" : "noindex"}, keine Marker`, async ({ request }) => {
      const res = await getText(request, `/de/ratgeber/${a.slug}`);
      if (res.status === 404) {
        expect(a.released, "404 nur für nicht freigegebene Artikel (Produktion)").toBe(false);
        return;
      }
      expect(res.status).toBe(200);
      const robots = robotsDirectives(res);
      if (a.released) expect(robots, "freigegeben → indexierbar").not.toContain("noindex");
      else expect(robots, "nicht freigegeben → noindex").toContain("noindex");
      expect(h1Count(res.text), "genau eine H1").toBe(1);
      expect(markers(res.text), "Redaktions-Marker im HTML (Text oder Payload)").toEqual([]);
      expect(htmlToText(res.text).length, "Artikeltext vorhanden").toBeGreaterThan(1500);
    });
  }
});
