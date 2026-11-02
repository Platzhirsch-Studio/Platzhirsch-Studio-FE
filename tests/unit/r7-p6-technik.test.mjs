// tests/unit/r7-p6-technik.test.mjs – P6 Runde 2 (Technik, Sicherheit, Release-Gate).
// Statische Prüfungen, kein Server nötig:
//   - Cache-Regeln schließen /cmx/, /cms/ und /api/ aus (404 nie „immutable“)
//   - reine DE-Seiten: EN/FR/IT → ein 308 auf /de/<seite>?lang=<sprache>
//   - security.txt (RFC 9116) mit gültigem Ablauf
//   - Kartenbilder der Leistungs-Übersicht als feste Größen (kein /_next/image)
//   - Tracing: dynamische Pfade in raumzwilling/payments mit turbopackIgnore
//   - Next 16.4.1 (Sicherheitsupdate) – sobald im Repo übernommen
// Run: node --test tests/unit/r7-p6-technik.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const require = createRequire(import.meta.url);

test("Cache-Regeln: alle drei mit (?!cmx/|cms/|api/), keine ohne cms/", () => {
  const cfg = read("next.config.js");
  const rules = [...cfg.matchAll(/source:\s*\n?\s*"(\/\(\(\?![^"]+)"/g)].map((m) => m[1]);
  assert.equal(rules.length, 3, rules.join("\n"));
  for (const r of rules) assert.ok(r.startsWith("/((?!cmx/|cms/|api/).*)"), r);
});

test("DE-only-Umleitungen: Muster, Ziel mit ?lang, Schalter-Seiten ausgenommen", () => {
  const { deOnlyRedirects, DE_ONLY_EXACT, DE_ONLY_TREE, FR_IT_ONLY_EXACT, FR_IT_ONLY_TREE } = require(path.join(ROOT, "src/lib/seo/deOnlyRedirects.cjs"));
  const rules = deOnlyRedirects();
  // Sprach-Integration 01.11.2026 (bewusst geändert): Yacht, Sofaplaner und die
  // Ezarri-Welt gibt es jetzt auch FR/IT – die FR/IT-Listen sind leer, ihre Regeln
  // entfallen. Zwei Regeln für en|fr|it auf /de, eine für die Ezarri-Werkzeuge
  // Custom Mix/Anfrage (nur DE/EN) von fr|it auf /en.
  assert.equal(rules.length, 3);
  rules.forEach((r, i) => {
    assert.equal(r.permanent, true);
    if (i < 2) {
      assert.match(r.source, /^\/:lang\(en\|fr\|it\)\//);
      assert.match(r.destination, /^\/de\/:page.*\?lang=:lang$/);
    } else {
      assert.equal(r.source, "/:lang(fr|it)/ezarri/:tool(custom-mix|anfrage)");
      assert.equal(r.destination, "/en/ezarri/:tool?lang=:lang");
    }
  });
  assert.deepEqual([...FR_IT_ONLY_EXACT, ...FR_IT_ONLY_TREE], []);
  // R5-fix P2 (bewusst geändert): "arbeitsweise" ist mehrsprachig und fehlt hier absichtlich.
  assert.ok(!DE_ONLY_EXACT.includes("arbeitsweise") && !DE_ONLY_TREE.includes("arbeitsweise"));
  for (const p of ["3d-ansicht", "bodensee-licht", "designermoebel-bregenz", "regionen", "concierge"]) {
    assert.ok(DE_ONLY_EXACT.includes(p) || DE_ONLY_TREE.includes(p), p);
  }
  // Viersprachig seit 01.11.2026 – nie umleiten.
  for (const p of ["ezarri", "yacht-interior", "sofaplaner", "kuechenplaner", "stil-finder", "dreilaender-rechner", "leistungen", "kuechen-vorarlberg", "interior-design-vorarlberg", "wohnzimmer-einrichten-vorarlberg", "outdoor-gartenplanung", "einkaufen-aus-der-schweiz"]) {
    assert.ok(!DE_ONLY_EXACT.includes(p) && !DE_ONLY_TREE.includes(p), `${p}: viersprachig, nicht umleiten`);
  }
  // Seiten hinter Schaltern oder mehrsprachige Seiten nie umleiten (sonst 308 → 404 bzw. falsche Sprache).
  for (const p of ["gutscheine", "atelierverkauf", "portal", "zahlung", "upload", "preview", "showroom", "ratgeber", "adventsabend"]) {
    assert.ok(!DE_ONLY_EXACT.includes(p) && !DE_ONLY_TREE.includes(p), p);
  }
  // Jede Seite der Liste ist wirklich nur Deutsch (notFound() bzw. Ezarri-Schalter).
  for (const p of [...DE_ONLY_EXACT, ...DE_ONLY_TREE]) {
    const file = path.join(ROOT, "src/app/[locale]", p, "page.js");
    assert.ok(fs.existsSync(file), file);
    assert.match(fs.readFileSync(file, "utf8"), /locale !== "de"|ezarriLocaleEnabled/, p);
  }
  // In next.config.js eingehängt, vor dem Proxy (redirects()).
  assert.match(read("next.config.js"), /\.\.\.deOnlyRedirects\(\)/);
});

test("Proxy: Locale-Präfix für Pfade ohne Sprache als 308, nicht 307", () => {
  const src = read("src/proxy.js");
  const i = src.indexOf("P6 Runde 2 (r2-technik P2-2)");
  assert.ok(i > 0);
  assert.ok(src.slice(i - 200, i + 400).includes('NextResponse.redirect(response.headers.get("location"), 308)'));
});

test("security.txt: Contact, Expires in der Zukunft (< 1 Jahr + Puffer), Canonical", () => {
  const txt = read("public/.well-known/security.txt");
  assert.match(txt, /^Contact: mailto:info@platzhirsch\.studio$/m);
  assert.match(txt, /^Canonical: https:\/\/platzhirsch\.studio\/\.well-known\/security\.txt$/m);
  const exp = new Date(txt.match(/^Expires: (.+)$/m)[1]);
  assert.ok(exp.getTime() > Date.now(), "Expires abgelaufen – Datei erneuern");
  assert.ok(exp.getTime() - Date.now() < 400 * 86400_000, "Expires zu weit in der Zukunft (RFC 9116: < 1 Jahr)");
});

test("Leistungs-Karten: jede Grafik in allen Breiten als AVIF und WebP, ohne next/image", async () => {
  const { HUB_WIDTHS, hubImageId, hubSrcSet } = await import(pathToFileURL(path.join(ROOT, "src/components/Labs/Hub/hubImage.js")).href);
  // Runde 5 (P3, gesamtwerk P2, bewusst geänderte Erwartung): Pfad
  // /bilder/leistungen/ statt /labs/hub/v/ – Quelle und Größen im selben Ordner.
  const DIR = path.join(ROOT, "public/bilder/leistungen");
  const ids = fs.readdirSync(DIR).filter((f) => f.endsWith(".webp") && !/-\d+\.webp$/.test(f)).map((f) => f.replace(/\.webp$/, ""));
  assert.ok(ids.length >= 8);
  for (const id of ids) {
    for (const w of HUB_WIDTHS) {
      for (const ext of ["avif", "webp"]) {
        const f = path.join(DIR, `${id}-${w}.${ext}`);
        assert.ok(fs.existsSync(f), `fehlt: ${f} (node src/components/Labs/Hub/tools/variants.mjs)`);
        assert.ok(fs.statSync(f).mtimeMs >= fs.statSync(path.join(DIR, `${id}.webp`)).mtimeMs - 1000, `veraltet: ${f}`);
      }
    }
  }
  assert.equal(hubImageId("/bilder/leistungen/sofaplaner.webp"), "sofaplaner");
  assert.equal(hubImageId("/bilder/leistungen/sofaplaner-640.webp"), null);
  assert.equal(hubImageId("/cms/files/x.webp"), null);
  assert.match(hubSrcSet("yacht", "avif"), /^\/bilder\/leistungen\/yacht-384\.avif 384w, /);
  assert.match(read("src/components/Labs/Hub/FeatureVisual.js"), /hubImageId\(feature\.image\?\.src\)/);
  assert.doesNotMatch(read("src/components/Labs/Hub/LabsHub.js"), /<Media /);
});

test("Tracing: dynamische Datenpfade mit turbopackIgnore (keine Projekt-Vollverfolgung)", () => {
  for (const f of ["src/lib/raumzwilling/store.js", "src/lib/raumzwilling/assets-node.mjs", "src/lib/payments/mailer.js"]) {
    const src = read(f);
    const plain = src.split("\n").filter((l) => /\bpath\.join\(/.test(l) && !/turbopackIgnore/.test(l));
    assert.deepEqual(plain, [], f);
  }
  assert.match(read("src/lib/raumzwilling/store.js"), /existsSync\(\/\*turbopackIgnore: true\*\/ p\)/);
});

test("Bodoni Italic: nicht vorgeladen, display optional (kein später Zeilensprung)", () => {
  const fonts = read("src/components/Reusable/fonts.js");
  const block = fonts.slice(fonts.indexOf("const bodoniItalic"), fonts.indexOf("});", fonts.indexOf("const bodoniItalic")));
  assert.match(block, /display: "optional"/);
  assert.match(block, /preload: false/);
});

test("Next-Version: exakt gepinnt, eslint-config-next gleich", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.match(pkg.dependencies.next, /^\d+\.\d+\.\d+$/);
  assert.equal(pkg.devDependencies["eslint-config-next"], pkg.dependencies.next);
});
