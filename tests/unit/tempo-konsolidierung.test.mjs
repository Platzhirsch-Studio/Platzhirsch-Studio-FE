// tests/unit/tempo-konsolidierung.test.mjs – Team Tempo & Barrierefreiheit
// (Konsolidierung 29.10.2026, qa-screenshots/konsolidierung/tempo.md).
//
// 1. 404 EN/FR/IT: server HTML with the right lang (Technikprüfung, offen seit R4).
// 2. Client boundaries: no 404 code on every page (root and locale not-found).
// 3. Wordmark once per page (sprite) instead of three times in HTML and RSC.
// 4. Hero: the Wow start script reads geometry while parsing, NOT in
//    requestAnimationFrame (Team Grün 30.10.2026: rAF measured slower, see test 4).
// 5. gripLabel (WCAG 1.4.3): never visible while the rail fades.
// 6. No experimental.inlineCss (measured: worse, see test 6).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

test("1 404 EN/FR/IT: lokalisierte Seite nur per Rewrite mit Status 404 und no-store", () => {
  const proxy = read("src/proxy.js");
  assert.match(proxy, /NextResponse\.rewrite\(url, \{ status: 404, headers: \{ "cache-control": NO_STORE \} \}\)/);
  assert.match(proxy, /const NO_STORE = "private, no-cache, no-store, max-age=0, must-revalidate";/);
  assert.match(proxy, /const LOCALIZED_404 = \/\^\(en\|fr\|it\)\$\/;/);
  // every 404 rewrite goes through the helper, the page itself never answers 200
  assert.doesNotMatch(proxy, /NextResponse\.rewrite\(new URL\(`\/\$\{\w+(?:\[1\])?\}\/\$\{NOT_FOUND_SEGMENT\}`/);
  assert.match(proxy, /LOCALIZED_404_PATH\.exec\(pathname\)/);
  // German-only pages keep the global 404 (usePathname mismatch in the
  // language switch, React #418 – measured in platzhirsch-prodtest)
  assert.match(proxy, /return notFoundRewrite\(request, locale, \{ localized: false \}\);/);
  const slug = read("src/app/[locale]/[slug]/page.js");
  assert.match(slug, /const LOCALIZED_404 = new Set\(\["en", "fr", "it"\]\);/);
  assert.match(slug, /if \(slug === NOT_FOUND_SEGMENT && LOCALIZED_404\.has\(locale\)\) \{\s+return <NotFoundContent locale=\{locale\} \/>;/);
  assert.match(slug, /for \(const lang of LOCALIZED_404\) params\.push\(\{ locale: lang, slug: NOT_FOUND_SEGMENT \}\);/);
  // German keeps the global 404 (errors.spec.js: lang="de", links to EN/FR/IT)
  assert.match(read("src/app/not-found.js"), /<html lang="de"/);
});

test("2 404-Code nicht auf jeder Seite: Server-Bausteine, Insel wählt nur aus", () => {
  assert.doesNotMatch(read("src/app/[locale]/not-found.js"), /"use client"/);
  const content = read("src/components/NotFound/NotFoundContent.js");
  assert.doesNotMatch(content, /"use client"/);
  assert.match(content, /export function NotFoundBody\(\{ locale, m \}\)/);
  const loc = read("src/components/NotFound/NotFoundLocales.js");
  assert.match(loc, /^"use client";/);
  assert.doesNotMatch(loc, /NotFoundContent|NextIntlClientProvider|lucide-react|next\/link/);
  assert.match(loc, /lang=\{locale\} data-nf-block=\{locale\}/);
  assert.match(read("src/app/not-found.js"), /<NotFoundLocales blocks=\{/);
});

test("3 Wortmarke einmal je Seite (Sprite) in Kopf und Fuß", () => {
  const logo = read("src/components/Brand/Logo.js");
  assert.match(logo, /export function WordmarkSprite\(\)/);
  assert.match(logo, /if \(sprite\) return <use href=\{`#\$\{WORDMARK_SPRITE_ID\}`\} transform=\{transform\} \/>;/);
  assert.match(read("src/app/[locale]/layout.js"), /<WordmarkSprite \/>/);
  const nav = read("src/components/Navbar/navbar.js");
  // Tempo-Runde Shell (tempo-shell.test.mjs 2b): the mobile menu's wordmark is
  // a third sprite user (server slot instead of the inline path in the client).
  assert.equal((nav.match(/decorative sprite \/>/g) || []).length, 3);
  assert.match(read("src/components/Reusable/Footer.js"), /title="Platzhirsch Home Living" sprite \/>/);
});

// Team Grün (Konsolidierung 30.10.2026), begründet geändert: Die rAF-Variante war in der
// Produktions-Messung LANGSAMER (rAF-Callback erzwang das erste Layout der ganzen Seite vor dem
// ersten Bild, LoAF 455 ms bei 4× CPU; LCP p75 Moto G4 ≈ 1,98 s statt ≈ 1,45 s, A/B auf demselben
// Build, wow-prod-lcp.spec.js rot). Geprüft wird jetzt das Gegenteil: Messung beim Parsen, kein rAF.
test("4 Hero: Start-Skript misst beim Parsen, nicht in requestAnimationFrame (kein Ganzseiten-Layout vor dem ersten Bild)", async () => {
  const { START_SCRIPT } = await import("../../src/lib/wow/start-script.js");
  assert.equal(START_SCRIPT.indexOf("requestAnimationFrame("), -1, "kein rAF im Start-Skript");
  assert.ok(START_SCRIPT.indexOf("getBoundingClientRect") > 0);
  assert.equal((START_SCRIPT.match(/getBoundingClientRect/g) || []).length, 1);
  assert.ok(Buffer.byteLength(START_SCRIPT) <= 900);
});

test("5 gripLabel: sichtbar nur, solange die Schiene voll deckend ist (WCAG 1.4.3)", () => {
  const css = read("src/components/Wow/Pause.module.css");
  assert.match(css, /\.stage\[data-wow-invite\] \.gripLabel \{\s+animation: wow-invite-label var\(--invite-t\) var\(--ease-quiet-inout\);/);
  const kf = css.match(/@keyframes wow-invite-label \{([\s\S]*?)\n\}/)?.[1] || "";
  assert.match(kf, /0%,\s+21\.9% \{\s+visibility: hidden;/);
  assert.match(kf, /22%,\s+76% \{\s+visibility: visible;/);
  assert.match(kf, /76\.1%,\s+100% \{\s+visibility: hidden;/);
  // the rail is fully opaque exactly from 22 % to 76 %
  const rail = css.match(/@keyframes wow-invite-rail \{([\s\S]*?)\n\}/)?.[1] || "";
  assert.match(rail, /22%,\s+76% \{\s+opacity: 1;/);
});

// Measured and rejected (tempo.md §3): experimental.inlineCss wrote the CSS
// into <style> AND into the RSC payload – /de HTML 75 → 188 KB gzip, Lighthouse
// mobile /en 75 → 68, /de/sofaplaner 69 → 58. Keep it off unless Next stops
// duplicating the styles.
test("6 kein experimental.inlineCss (gemessen schlechter)", () => {
  assert.doesNotMatch(read("next.config.js"), /inlineCss:\s*true/);
});
