// R5-Fix P1 (r5-technik P0-1, P2-2; r5-seo P2-2): brand × category and
// collection pages in the PRODUCTION build. Meant for the production copy
// (BASE_URL=http://localhost:3101, PW_WORKERS=1); against dev it passes too.
//  - a sample of ≥ 40 URLs from sitemap-marken.xml (DE/EN/FR/IT, depth 5)
//    answers 200 and is indexable,
//  - unknown brand / collection / first segment → 404,
//  - the RSC prefetch of a brand × category link has no redirect loop,
//  - /de/showroom while switched off: a real 404 that is not cached.
// No form is sent.
import { test, expect } from "@playwright/test";
import { PROD } from "./prod-mode.js";

const SAMPLE = Number(process.env.R9_MARKEN_SAMPLE) || 44;
const ROBOTS = /<meta name="robots" content="([^"]*)"/;

test.describe.configure({ mode: "serial" });

function toLocal(loc, baseURL) {
  const u = new URL(loc);
  return new URL(`${u.pathname}${u.search}`, baseURL).toString();
}

test("Stichprobe sitemap-marken.xml (Tiefe 5, 4 Sprachen): 200 und index", async ({ request, baseURL }, info) => {
  test.skip(info.project.name !== "desktop", "Serverantwort, einmal");
  test.setTimeout(900_000);
  const xml = await (await request.get("/sitemap-marken.xml")).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const deep = locs.filter((l) => new URL(l).pathname.split("/").filter(Boolean).length === 5);
  expect(deep.length, "Marke × Kategorie / Kollektion in der Sitemap").toBeGreaterThan(40);
  const byLocale = { de: [], en: [], fr: [], it: [] };
  for (const l of deep) byLocale[new URL(l).pathname.split("/")[1]]?.push(l);
  const per = Math.ceil(SAMPLE / 4);
  const pick = (list) => {
    // evenly spread over the list (different brands), deterministic
    const step = Math.max(1, Math.floor(list.length / per));
    return list.filter((_, i) => i % step === 0).slice(0, per);
  };
  const sample = Object.values(byLocale).flatMap(pick);
  expect(sample.length).toBeGreaterThanOrEqual(40);
  const bad = [];
  for (const loc of sample) {
    const res = await request.get(toLocal(loc, baseURL), { maxRedirects: 0, timeout: 240_000 });
    const robots = res.status() === 200 ? (await res.text()).match(ROBOTS)?.[1] || "" : "";
    if (res.status() !== 200 || /noindex/.test(robots)) bad.push(`${res.status()} ${robots} ${loc}`);
  }
  expect(bad, `nicht 200/index (${sample.length} geprüft)`).toEqual([]);
});

test("unbekannte Marke, Kollektion und Sprache: 404", async ({ request }, info) => {
  test.skip(info.project.name !== "desktop", "Serverantwort, einmal");
  // Endtest 29.10.2026: Der Dev-Server (Next 16.4.1) liefert für notFound() die Hülle <html id="__next_error__"> ohne lang/h1 und rendert die 404 erst im Client; die vorgerenderte 404 gibt es nur im Produktions-Build (dort grün, PW_PROD=1 BASE_URL=…).
  test.skip(!PROD, "vorgerenderte 404 nur im Produktions-Build");
  for (const p of [
    "/de/ueber-uns/marken/gibt-es-nicht-r9",
    "/de/ueber-uns/marken/minotti/gibt-es-nicht-r9",
    "/en/about-us/brands/minotti/does-not-exist-r9",
    "/wp-login.php",
    "/xx/kontakt.html",
  ]) {
    const res = await request.get(p, { maxRedirects: 0, timeout: 240_000 });
    expect(res.status(), p).toBe(404);
    const html = await res.text();
    // Technik R7 (r6-technik P0-1): unknown brands/collections no longer render
    // on demand – src/proxy.js answers them with the prerendered 404 (lang, h1,
    // noindex, no-store), like an unknown first segment. Before, Next 16.4 sent
    // its empty shell without h1 here and kept it in the ISR cache.
    expect(html, `${p}: 404-Seite mit Überschrift`).toMatch(/<h1/);
    expect(res.headers()["cache-control"] || "", `${p}: nicht zwischengespeichert`).toMatch(/no-store/);
    expect(html.match(ROBOTS)?.[1] || "", p).toMatch(/noindex/);
    // Tempo & A11y (Konsolidierung, verschärft): Proxy-404 unter /en, /fr, /it
    // tragen die Sprache der URL schon im Server-HTML (lokalisierte 404 im
    // Locale-Layout, qa-screenshots/konsolidierung/tempo.md).
    const loc = p.split("/")[1];
    if (["en", "fr", "it"].includes(loc)) expect(html, `${p}: lang im Server-HTML`).toMatch(new RegExp(`<html[^>]+lang="${loc}"`));
  }
});

test("Großschreibung einer Marke: 308 auf Kleinschreibung, echte Seite bleibt 200", async ({ request }, info) => {
  test.skip(info.project.name !== "desktop", "Serverantwort, einmal");
  // Technik R7 (r6-technik P0-1, Beleg 2): /marken/Minotti schrieb auf einem
  // Dateisystem ohne Groß-/Kleinunterscheidung eine 404 über /marken/minotti.
  const res = await request.get("/de/ueber-uns/marken/Minotti", { maxRedirects: 0, timeout: 240_000 });
  expect(res.status()).toBe(308);
  expect(new URL(res.headers().location, "http://x").pathname).toBe("/de/ueber-uns/marken/minotti");
  expect((await request.get("/de/ueber-uns/marken/minotti", { maxRedirects: 0, timeout: 240_000 })).status()).toBe(200);
});

test("Prefetch eines Marke × Kategorie-Links: keine Umleitungsschleife", async ({ request }, info) => {
  test.skip(info.project.name !== "desktop", "Serverantwort, einmal");
  const path = "/de/ueber-uns/marken/flos/lamps";
  let url = path;
  const seen = [];
  for (let i = 0; i < 5; i++) {
    const res = await request.get(url, {
      maxRedirects: 0,
      headers: { RSC: "1", "Next-Router-Prefetch": "1", "Next-Url": "/de/produkte/lamps/lamps-2097-18" },
      timeout: 240_000,
    });
    seen.push(`${res.status()} ${url}`);
    if (res.status() < 300 || res.status() >= 400) {
      expect(res.status(), seen.join(" → ")).toBe(200);
      return;
    }
    url = res.headers().location;
  }
  throw new Error(`Umleitungsschleife: ${seen.join(" → ")}`);
});

test("leere Marke × Kategorie: 308 (permanent) auf die Markenseite", async ({ request }, info) => {
  test.skip(info.project.name !== "desktop", "Serverantwort, einmal");
  const res = await request.get("/de/ueber-uns/marken/brand-van-egmond/lamps", { maxRedirects: 0, timeout: 240_000 });
  test.skip(res.status() === 200, "Kategorie hat inzwischen Bilder (Seite wieder da)");
  expect(res.status()).toBe(308);
  expect(res.headers().location).toMatch(/\/de\/ueber-uns\/marken\/brand-van-egmond$/);
});

test("/de/showroom abgeschaltet: echte 404 ohne Langzeit-Cache", async ({ request }, info) => {
  test.skip(info.project.name !== "desktop", "Serverantwort, einmal");
  const res = await request.get("/de/showroom", { maxRedirects: 0, timeout: 240_000 });
  test.skip(res.status() === 200, "Showroom-Rundgang ist an (Vorschau oder öffentlich)");
  expect(res.status()).toBe(404);
  expect(res.headers()["cache-control"] || "").not.toMatch(/s-maxage=\d{3,}/);
  const html = await res.text();
  expect(html).not.toMatch(/id="__next_error__"/);
  expect(html).toMatch(/<h1/);
});
