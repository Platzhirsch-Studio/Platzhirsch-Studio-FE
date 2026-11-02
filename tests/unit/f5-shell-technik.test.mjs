// F5-shell-technik-release, Runde 1: contracts of this package.
//   node --test tests/unit/f5-shell-technik.test.mjs
// 1. Design previews and the project template: 404 in production unless
//    DESIGN_PREVIEW=1 (src/components/Preview/gate.js).
// 2. Redirects: /labs without locale → ONE 308 to the target, public/labs
//    files untouched; Ezarri brand URLs → /de/ezarri.
// 3. CSP report-only with report-uri/report-to, no /cms/files rewrite,
//    file-tracing excludes.
// 4. 404 with lang + server rendering: dynamicParams=false where unknown
//    params used to render notFound() on demand.
// 5. Menu: no Ratgeber link; breadcrumbs follow the menu (menuTrail.js).
// 6. Client messages ≤ 35 KB per locale.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { designPreviewEnabled } from "../../src/components/Preview/gate.js";
import { menuTrail, planEntryFor } from "../../src/components/ui/menuTrail.js";
import { pickClientMessages } from "../../src/components/Reusable/clientMessages.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const require = createRequire(import.meta.url);

test("1 Vorschau-Schalter: Entwicklung an, Produktion nur mit DESIGN_PREVIEW=1, Vercel-Produktion nie", () => {
  assert.equal(designPreviewEnabled({ NODE_ENV: "development" }), true);
  assert.equal(designPreviewEnabled({ NODE_ENV: "production" }), false);
  assert.equal(designPreviewEnabled({ NODE_ENV: "production", DESIGN_PREVIEW: "1" }), true);
  assert.equal(designPreviewEnabled({ NODE_ENV: "production", DESIGN_PREVIEW: "true" }), false);
  assert.equal(designPreviewEnabled({ NODE_ENV: "production", DESIGN_PREVIEW: "1", VERCEL_ENV: "production" }), false);
});

test("1 Vorschau-Routen nutzen den Schalter (Layouts, Vorlage, Demo-Dateien)", () => {
  for (const d of ["buehne", "galerie", "dreilaendereck"]) {
    const s = read(`src/app/[locale]/preview/${d}/layout.js`);
    assert.match(s, /await connection\(\);/, `${d}: Schalter zur Anfragezeit`);
    assert.match(s, /if \(locale !== "de" \|\| !designPreviewEnabled\(\)\) notFound\(\);/, d);
  }
  const vorlage = read("src/app/[locale]/projekte/vorlage/page.js");
  assert.match(vorlage, /if \(!designPreviewEnabled\(\)\) notFound\(\);/);
  for (const f of ["demo.mp4", "demo.webm", "demo.de.vtt", "demo-poster.svg"]) {
    assert.match(read(`src/app/[locale]/projekte/vorlage/${f}/route.js`), /^import \{ designPreviewEnabled \} from "@\/components\/Preview\/gate";$/m, `${f}: Import`);
    assert.match(read(`src/app/[locale]/projekte/vorlage/${f}/route.js`), /!designPreviewEnabled\(\)\) return new Response\("Not found", \{ status: 404 \}\)/, f);
  }
});

// next.config.js evaluated as in production (CSP header only there).
function loadConfig() {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const file = path.join(root, "next.config.js");
  delete require.cache[file];
  try {
    return require(file);
  } finally {
    process.env.NODE_ENV = prev;
    delete require.cache[file];
  }
}

/** Minimal matcher for the patterns used in next.config.js redirects. */
function compile(source) {
  let re = "";
  let i = 0;
  while (i < source.length) {
    const m = /^:(\w+)(\(((?:[^()]|\([^()]*\))*)\))?([*+?])?/.exec(source.slice(i));
    if (m) {
      const [all, , , pattern, mod] = m;
      if (pattern) re += `(${pattern})`;
      else if (mod === "*") re += "((?:[^/]+(?:/[^/]+)*)?)";
      else re += "([^/]+)";
      i += all.length;
    } else {
      re += source[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      i += 1;
    }
  }
  return new RegExp(`^${re.replace(/\/\(\(\?:\[\^\/\]\+\(\?:\/\[\^\/\]\+\)\*\)\?\)$/, "(?:/((?:[^/]+(?:/[^/]+)*)?))?")}$`);
}
async function firstRedirect(pathname) {
  const list = await loadConfig().redirects();
  return list.find((r) => compile(r.source).test(pathname)) || null;
}

test("2 /labs ohne Sprache: ein 308 direkt aufs Ziel, Dateien in public/labs bleiben", async () => {
  const cases = {
    "/labs": "/de/leistungen",
    "/labs/kuechenplaner": "/de/kuechenplaner",
    "/labs/sofaplaner/katalog/x": "/de/sofaplaner/:rest",
    "/labs/ar-viewer": "/de/3d-ansicht",
    "/labs/unbekannt/y": "/de/leistungen",
  };
  for (const [from, to] of Object.entries(cases)) {
    const r = await firstRedirect(from);
    assert.ok(r, `${from}: Weiterleitung`);
    assert.equal(r.permanent, true, from);
    assert.equal(r.destination, to, from);
    assert.ok(!r.destination.includes("/labs"), `${from}: Ziel ohne /labs (ein Sprung)`);
  }
  for (const file of ["/labs/hub/kuechenplaner.webp", "/labs/kuechenplaner/x.glb", "/labs/yacht/a/b.jpg"]) {
    const r = await firstRedirect(file);
    assert.equal(r?.source?.startsWith("/labs") ? r.source : null, null, `${file}: Datei wird nicht umgeleitet`);
  }
});

test("2 Ezarri-Marken-URLs → /de/ezarri (308), vor der allgemeinen /marken-Regel", async () => {
  for (const from of ["/marken/ezarri", "/de/ueber-uns/marken/ezarri", "/en/about-us/brands/ezarri", "/hersteller/ezarri"]) {
    const r = await firstRedirect(from);
    assert.equal(r?.destination, "/de/ezarri", from);
    assert.equal(r.permanent, true, from);
  }
  assert.equal((await firstRedirect("/marken/minotti"))?.destination, "/de/ueber-uns/marken/:slug");
});

test("3 CSP: Report-Ziel, Reporting-Endpoints, /cms/files über /cmx, Tracing-Ausschlüsse", async () => {
  const cfg = loadConfig();
  const global = (await cfg.headers()).find((h) => h.source === "/(.*)");
  const csp = global.headers.find((h) => h.key === "Content-Security-Policy-Report-Only")?.value || "";
  assert.match(csp, /report-uri \/api\/csp-report/);
  assert.match(csp, /report-to csp/);
  assert.equal(global.headers.find((h) => h.key === "Reporting-Endpoints")?.value, 'csp="/api/csp-report"');
  const rewrites = await cfg.rewrites();
  const list = Array.isArray(rewrites) ? rewrites : [...(rewrites.beforeFiles || []), ...(rewrites.afterFiles || []), ...(rewrites.fallback || [])];
  const cms = list.filter((r) => r.source.startsWith("/cms/"));
  assert.ok(cms.length > 0 && cms.every((r) => r.destination.startsWith("/cmx/")), "/cms/files nur über die eigene /cmx-Route, nie direkt ans Backoffice");
  const ex = cfg.outputFileTracingExcludes?.["/**"] || [];
  for (const d of ["Marktresearch", "qa-screenshots", "Herstellermaterial", "tests"]) assert.ok(ex.some((g) => g.includes(d)), d);
  assert.match(read("src/app/api/csp-report/route.js"), /status: 204/);
  assert.match(read("src/components/Freigaben/data.server.js"), /turbopackIgnore: true/);
});

// Bewusst geändert (R5-Fix P1, r5-technik P0-1): dynamicParams=false am Layout schloss in
// Next 16.4 jede Kind-Route (fallback: false, alle Marke × Kategorie-Seiten 404). Unbekannte
// Sprachen kommen jetzt per afterFiles-Rewrite auf [slug] (dynamicParams=false) und erhalten
// dieselbe vorgerenderte 404 – Details in r9-p1-prerender-manifest.test.mjs.
test("4 404 mit lang und Server-Rendering: Sprache per Rewrite, [slug] und Catch-all mit dynamicParams=false", async () => {
  assert.doesNotMatch(read("src/app/[locale]/layout.js"), /^export const dynamicParams = false;/m);
  const rewrites = await loadConfig().rewrites();
  const list = Array.isArray(rewrites) ? rewrites : rewrites.afterFiles || [];
  assert.ok(list.some((r) => r.destination === "/de/seite-nicht-gefunden"), "unbekannte Sprache → vorgerenderte 404");
  assert.match(read("src/app/[locale]/[slug]/page.js"), /^export const dynamicParams = false;/m);
  const rest = read("src/app/[locale]/[...rest]/page.js");
  assert.match(rest, /^export const dynamicParams = false;/m);
  assert.match(rest, /export function generateStaticParams\(\) \{\n  return \[\];/);
  assert.match(read("src/app/not-found.js"), /<html lang="de"/);
});

test("5 Menü ohne Ratgeber, Brotkrumen wie das Menü", () => {
  // Welle 2 (bewusst geändert, Inhaber 29.10.2026): drei Ratgeber-Artikel sind
  // freigegeben – der Ratgeber steht jetzt (nur Deutsch) unter „Beraten & planen“.
  assert.match(read("src/components/Navbar/shellNav.js"), /isDe && ratgeber \? \[\{ label: c\("nav\.guide"\), href: "\/ratgeber" \}\]/);
  assert.doesNotMatch(read("src/components/Projects/ProjekteUebersicht.js"), /href="\/ratgeber"/);
  const home = { label: "Startseite", href: "/" };
  const labels = (items) => menuTrail(items, "de").map((x) => x.label);
  assert.deepEqual(labels([home, { label: "Das Haus", href: "/ueber-uns/platzhirsch" }, { label: "Arbeitsweise" }]), ["Startseite", "Planen & Erleben", "Unsere Arbeitsweise"]);
  assert.deepEqual(labels([home, { label: "Bodensee-Licht" }]), ["Startseite", "Planen & Erleben", "Bodensee-Licht"]);
  assert.deepEqual(labels([home, { label: "KI-Assistenten" }]), ["Startseite", "Planen & Erleben", "Für KI-Assistenten"]);
  assert.equal(menuTrail([home, { label: "Bodensee-Licht" }], "de")[1].href, "/leistungen");
  // unchanged: shop, other locales, outdoor and Ezarri (own places in the menu)
  assert.deepEqual(labels([home, { label: "Produkte", href: "/produkte" }, { label: "Leuchten" }]), ["Startseite", "Produkte", "Leuchten"]);
  assert.deepEqual(menuTrail([home, { label: "Bodensee-Licht" }], "en").map((x) => x.label), ["Startseite", "Bodensee-Licht"]);
  assert.equal(planEntryFor("Outdoor & Garten"), null);
  assert.equal(planEntryFor("Ezarri Glasmosaik"), null);
  assert.match(read("src/components/ui/Breadcrumbs.js"), /menuTrail\(/);
});

test("5 Mobile CTA-Leiste weicht der Cookie-Leiste (eine Ebene am unteren Rand)", () => {
  const bar = read("src/components/Reusable/MobileCtaBar.js");
  assert.match(bar, /--ph-consent-h/);
  assert.match(bar, /!consentOpen\(\)/);
  assert.match(read("src/app/[locale]/client-layout.js"), /const WOW_WAIT_MS = 300;/);
});

test("6 Client-Messages je Sprache ≤ 35 KB (vorher ≈ 78 KB)", () => {
  for (const locale of ["de", "en", "fr", "it"]) {
    const m = JSON.parse(read(`src/messages/${locale}.json`));
    const size = Buffer.byteLength(JSON.stringify(pickClientMessages(m)));
    assert.ok(size <= 35 * 1024, `${locale}: ${size} B`);
  }
});

test("Schriften: nur die Hero-Schrift (Bodoni) wird vorgeladen", () => {
  const fonts = read("src/components/Reusable/fonts.js");
  const block = (name) => fonts.slice(fonts.indexOf(`const ${name} =`), fonts.indexOf("});", fonts.indexOf(`const ${name} =`)));
  assert.doesNotMatch(block("bodoni"), /preload: false/);
  for (const n of ["bodoniItalic", "instrument", "montserrat"]) assert.match(block(n), /preload: false/, n);
  assert.match(read("src/app/globals.css"), /^@import "tailwindcss" source\(".."\);/m);
});

test("package.json: test = Unit-Tests, keine Temp-Dateien im Root", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts.test, pkg.scripts["test:unit"]);
  for (const f of [".tmp-opt.mjs", "_tmp_try.mjs", "tools_probe.tmp"]) assert.equal(fs.existsSync(path.join(root, f)), false, f);
});
