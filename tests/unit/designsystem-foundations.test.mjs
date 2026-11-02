// tests/unit/designsystem-foundations.test.mjs – Designsystem-Fundament (Qualität 01.11.2026).
// Run: node --test --test-reporter=tap tests/unit/designsystem-foundations.test.mjs
//
// Prüft: (1) ui/typo.js typoDe (geschützte Leerzeichen, Gedankenstrich, Zitate);
// (2) ui/localePrefix.js splitLocalePrefix (Links mit fester Sprache);
// (3) shellNav: FR/IT verlinken Hotel & Objekt direkt auf /en (keine 307);
// (4) globals.css: Motion-Tokens, Ruhe-Regeln (reduced + calm), Skelett, Platzhalter;
// (5) Marken-Descriptions: Accessoires ohne „eingebaut“, Mehrfach-Marken je Welt.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
// "@/"-Alias wie Next auflösen (wie labs-hub.test.mjs; navMatch/shellNav importieren über "@/").
registerHooks({
  resolve(specifier, context, nextResolve) {
    let file;
    if (specifier.startsWith("@/")) file = path.join(ROOT, "src", specifier.slice(2));
    else if (specifier.startsWith(".") && context.parentURL?.includes("/src/") && !path.extname(specifier)) {
      file = path.join(path.dirname(fileURLToPath(context.parentURL)), specifier);
    } else return nextResolve(specifier, context);
    const cand = [file, `${file}.js`, path.join(file, "index.js")].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    return nextResolve(pathToFileURL(cand || `${file}.js`).href, context);
  },
});
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const { typoDe, NBSP, NNBSP } = await import("../../src/components/ui/typo.js");
const { splitLocalePrefix } = await import("../../src/components/ui/localePrefix.js");
const { localizeHref } = await import("../../src/components/Navbar/navMatch.js");

test("typoDe: Einheiten, Währung, Abkürzungen, Gedankenstrich", () => {
  assert.equal(typoDe("Breite 240 cm, Tiefe 95 cm."), `Breite 240${NBSP}cm, Tiefe 95${NBSP}cm.`);
  assert.equal(typoDe("ab € 4.900"), `ab €${NBSP}4.900`);
  assert.equal(typoDe("4.900 €"), `4.900${NBSP}€`);
  assert.equal(typoDe("20 % Rabatt"), `20${NNBSP}% Rabatt`);
  assert.equal(typoDe("12 mm Glas"), `12${NBSP}mm Glas`);
  assert.equal(typoDe("z. B. Eiche"), `z.${NNBSP}B. Eiche`);
  assert.equal(typoDe("Eiche - geölt"), `Eiche${NBSP}– geölt`);
  assert.equal(typoDe("§ 5 ECG"), `§${NBSP}5 ECG`);
  // nichts anfassen, was keine Einheit ist
  assert.equal(typoDe("3 Monate, 2 Wochen, 5 mal"), "3 Monate, 2 Wochen, 5 mal");
  assert.equal(typoDe("agape-004 und 05574-43"), "agape-004 und 05574-43");
  assert.equal(typoDe(""), "");
  assert.equal(typoDe(undefined), undefined);
  assert.equal(typoDe('Der "Kern"', { quotes: true }), "Der „Kern“");
  assert.equal(typoDe('Der "Kern"'), 'Der "Kern"');
});

test("splitLocalePrefix: feste Sprache bleibt, ohne Präfix null", () => {
  assert.deepEqual(splitLocalePrefix("/en/hotel-objekt"), { href: "/hotel-objekt", locale: "en" });
  assert.deepEqual(splitLocalePrefix("/de"), { href: "/", locale: "de" });
  assert.deepEqual(splitLocalePrefix("/de?lang=en"), { href: "/?lang=en", locale: "de" });
  assert.equal(splitLocalePrefix("/hotel-objekt"), null);
  assert.equal(splitLocalePrefix("/design/x"), null); // "de" nur als ganzes Segment
  assert.equal(splitLocalePrefix("/english"), null);
  assert.equal(splitLocalePrefix(undefined), null);
  // gleicher Vertrag wie localizeHref (Mega-Menü, Footer)
  assert.equal(localizeHref("/en/hotel-objekt", "fr"), "/en/hotel-objekt");
});

// Inhaber 01.11.2026 (bewusst geändert): Hotel & Objekt gibt es in allen vier Sprachen –
// jede Sprache verlinkt die eigene Seite ohne Präfix (vorher FR/IT → /en/hotel-objekt).
test("shellNav: Hotel & Objekt in jeder Sprache ohne Präfix (eigene Seite)", async () => {
  const { buildRooms, navFeatures } = await import("../../src/components/Navbar/shellNav.js");
  for (const [locale, want] of [["de", "/hotel-objekt"], ["en", "/hotel-objekt"], ["fr", "/hotel-objekt"], ["it", "/hotel-objekt"]]) {
    const rooms = buildRooms({ locale, c: (k) => k, features: navFeatures({ raw: {}, nodeEnv: "production" }), concierge: false, empfehlen: false });
    const hrefs = rooms.flatMap((r) => r.columns.flatMap((c) => c.links)).filter((l) => l.label === "nav.hotelObjekt").map((l) => l.href);
    assert.ok(hrefs.length >= 1, `${locale}: Link vorhanden`);
    for (const h of hrefs) assert.equal(h, want, locale);
  }
});

test("globals.css: Motion-Tokens, Ruhe (reduced + calm), Skelett, Platzhalter", () => {
  const css = read("src/app/globals.css");
  for (const token of ["--duration-micro", "--duration-swap", "--duration-section", "--duration-shimmer", "--ease-quiet", "--ease-drift", "--color-skeleton"]) {
    assert.match(css, new RegExp(`${token}:`), token);
  }
  assert.match(css, /MOTION-FUNDAMENT/);
  // jede Bewegungsregel mit :root:not(...) kennt beide Namen der Ruhigen Ansicht
  assert.doesNotMatch(css, /:root:not\(\[data-motion="reduced"\]\)/);
  assert.match(css, /:root:not\(\[data-motion="reduced"\], \[data-motion="calm"\]\) \.ph-skeleton/);
  // Skelett-Schimmer nur ohne reduzierte Bewegung
  const shimmer = css.slice(css.lastIndexOf("@media (prefers-reduced-motion: no-preference)", css.indexOf("animation: ph-shimmer")), css.indexOf("animation: ph-shimmer"));
  assert.ok(shimmer.length > 0 && shimmer.length < 200, "ph-shimmer steht in einem no-preference-Block");
  assert.match(css, /input::placeholder,\s*textarea::placeholder \{\s*color: var\(--color-text-soft\)/);
  assert.match(css, /\.reveal-group > \*/);
  assert.match(css, /\.ph-lift/);
});

test("Marken-Descriptions: Accessoires ohne Einbau, Mehrfach-Marken je Welt", () => {
  const src = read("src/components/Katalog/katalogRoutes.js");
  assert.match(src, /welt === "accessoires" \|\| markeMehrfach\(welt, r\.m\.slug\)/);
  for (const l of ["de", "en", "fr", "it"]) {
    const k = JSON.parse(read(`src/messages/${l}.json`)).katalog;
    const m = k.marke;
    assert.ok(m.metaDescriptionWelt.includes("{marke}") && m.metaDescriptionWelt.includes("{welt}"), l);
    assert.doesNotMatch(m.metaDescriptionWelt, /eingebaut|installation|montaggio/i, l);
    // längster Weltname der Sprache + langer Markenname: höchstens knapp über 150
    // (clampDescription kürzt den Rest wortweise), echte Fälle liegen darunter.
    const welt = Object.values(k.welt).map((w) => w.crumb).sort((a, b) => b.length - a.length)[0];
    const longest = m.metaDescriptionWelt.replace("{marke}", "Baobab Collection").replace("{welt}", welt);
    assert.ok(longest.length <= 155, `${l}: ${longest.length}`);
    assert.ok(m.metaDescriptionWelt.replace("{marke}", "Dornbracht").replace("{welt}", k.welt.kuechengeraete.crumb).length <= 150, `${l}: Dornbracht`);
  }
});
