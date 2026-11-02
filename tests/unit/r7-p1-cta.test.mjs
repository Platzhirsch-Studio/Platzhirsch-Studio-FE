// tests/unit/r7-p1-cta.test.mjs — Fix-Team P1 (Runde 2): Shell, Texte und
// Anfragepfad.
//   1) CTA-Wörter: je Sprache EIN Hauptwort (ux P1-5), keine Buchungsversprechen
//   2) Kontext: beratungContext kennt ezarri/objekt/neubau/rolle/ort, Header
//      und Leiste leiten das Thema aus dem Pfad ab (ux P1-1)
//   3) Menü „Planen & Erleben“: Gruppen ≤ 7, Hotel-Einstieg, Portal-Login
//   8) Sprachumschalter: News-Artikel nie /nouvelles/<slug>, Produktpfade
//      unabhängig von der Form, in der der Pfad ankommt (technik P1-3a, P2-3)
// Run: node --test tests/unit/r7-p1-cta.test.mjs
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "src");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const LOCALES = ["de", "en", "fr", "it"];
const MSG = Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(read(`src/messages/${l}.json`))]));

// "@/x" → src/x(.js), "server-only" → empty module (Next.js aliases).
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier.startsWith("@/")) {
      const base = path.join(SRC, specifier.slice(2));
      const file = [base, `${base}.js`, path.join(base, "index.js")].find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
      if (file) return next(pathToFileURL(file).href, context);
    }
    return next(specifier, context);
  },
});

let ctx, nav;
before(async () => {
  ctx = await import(pathToFileURL(path.join(SRC, "lib/forms/beratungContext.js")).href);
  nav = await import(pathToFileURL(path.join(SRC, "components/Navbar/navMatch.js")).href);
});

function leaves(o, p = "", out = []) {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k;
    if (v && typeof v === "object") leaves(v, key, out);
    else if (typeof v === "string") out.push([key, v]);
  }
  return out;
}

// Forbidden appointment wordings per language (ux P1-5, neuland P1-8): they
// promise a choice/booking the site does not offer, or split the main word.
// `booking.*` is the (switched-off) online calendar and keeps its own words.
const FORBIDDEN = {
  de: [/Termin wählen/, /^Beratungstermin( vereinbaren)?$/],
  en: [/\bBook\b/, /Book an appointment/i, /Book a consultation/i, /^Appointment$/, /Choose a time/i, /^Consultation & appointment$/],
  fr: [/Choisir un rendez-vous/i, /^Prendre rendez-vous$/],
  // Runde 4 (P2 Sprache): IT in voi, die Formen gelten auch für Scegliete/Prenotate.
  it: [/Scegli(?:ete)? un appuntamento/i, /^Prenota(?:te)? un appuntamento$/, /^Prenota(?:te)? una consulenza$/, /^Appuntamento$/],
};
const ALLOWED_EXCEPTIONS = new Set(["booking.title", "Shell.header.termin", "HomePage.cta.eyebrow"]);
// Übernahme Rat 9,5 (B1, 30.10.2026): „Das Wort hängt am Ziel“ – die
// Kalenderwörter (TERMIN_WORDS.choose in src/lib/forms/terminLink.js) stehen
// nur an Knöpfen, die auf den eigenen Kalender /termin führen (nur mit
// ownCalendarActive()), wie booking.*. Sie versprechen dort keine Wahl, die
// es nicht gibt. Alle übrigen Schlüssel bleiben unter dem Verbot.
const CALENDAR_WORD_KEYS = new Set(["Shell.terminWords.choose", "termin.tisch.online"]);

test("1) messages: keine verbotenen Termin-Varianten in allen vier Sprachen", () => {
  const hits = [];
  for (const l of LOCALES) {
    for (const [key, value] of leaves(MSG[l])) {
      if (ALLOWED_EXCEPTIONS.has(key) && l !== "en") continue;
      if (key.startsWith("booking.")) continue;
      if (CALENDAR_WORD_KEYS.has(key)) continue;
      for (const re of FORBIDDEN[l]) if (re.test(value)) hits.push(`${l}:${key} = ${value}`);
    }
  }
  assert.deepEqual(hits, []);
});

test("1) ein Hauptwort je Sprache an allen Termin-Knöpfen der Shell und Startseite", () => {
  const MAIN = { de: "Termin anfragen", en: "Request a visit", fr: "Demander un rendez-vous", it: "Richiedete un appuntamento" }; // Runde 4: IT einheitlich voi (tools/i18n/patches/r4-p2-it-voi.json)
  for (const l of LOCALES) {
    for (const key of ["Shell.menu.termin", "Shell.footer.termin", "Shell.ctaBar.termin", "HomePage.hero.cta", "HomePage.cta.primary", "landing.appointment", "inhalt.common.termin"]) {
      assert.equal(key.split(".").reduce((o, k) => o[k], MSG[l]), MAIN[l], `${l}:${key}`);
    }
  }
  // Header short form: DE "Termin", EN "Visit".
  assert.equal(MSG.de.Shell.header.termin, "Termin");
  assert.equal(MSG.en.Shell.header.termin, "Visit");
});

test("1) P1-Dateien enthalten keine verbotenen Varianten im Quelltext", () => {
  const files = [
    "src/components/Navbar/shellLabels.js",
    "src/components/Navbar/navbar.js",
    "src/components/Navbar/HeaderCta.js",
    "src/components/Navbar/MobileMenu.js",
    "src/components/Reusable/MobileCtaBar.js",
    "src/components/ui/CTABand.js",
    "src/components/Reusable/Footer.js",
  ];
  for (const f of files) {
    const src = read(f);
    for (const re of [/Termin wählen/, /\bBook an appointment\b/, /["'>]Book["'<]/]) assert.doesNotMatch(src, re, f);
  }
});

test("2) beratungContext: ezarri, objekt, neubau, rolle=architekt, ort=<stadt>; Unbekanntes wird ignoriert", () => {
  const p = (q) => ctx.beratungContext(new URLSearchParams(q));
  assert.deepEqual(p("thema=ezarri"), { step1: "ezarri", step2: null, lines: [{ key: "themaEzarri" }], produkt: null });
  // r8-leads (ux P1-2): Objekt / Hotel is a step-1 topic of its own now (before,
  // step 1 stayed empty and the confirmation said "Thema: einen Neubau").
  assert.deepEqual(p("thema=objekt"), { step1: "objekt", step2: "hotel", lines: [{ key: "themaObjekt" }], produkt: null });
  assert.deepEqual(p("thema=hotel").lines, [{ key: "themaObjekt" }]);
  assert.deepEqual(p("thema=neubau"), { step1: "neubau", step2: null, lines: [{ key: "themaNeubau" }], produkt: null });
  assert.deepEqual(p("thema=yacht").lines, [{ key: "themaYacht" }]);
  assert.deepEqual(p("rolle=architekt").lines, [{ key: "rolleArchitekt" }]);
  // r8-leads: ?rolle=architekt also preselects "Architektur / Planungsbüro".
  assert.equal(p("rolle=architekt").step1, "architektur");
  assert.deepEqual(p("rolle=planer").lines, [{ key: "rolleArchitekt" }]);
  assert.deepEqual(p("ort=st-gallen").lines, [{ key: "ort", vars: { ort: "St. Gallen" } }]);
  assert.deepEqual(p("thema=quatsch&rolle=hacker&ort=%3Cscript%3E"), { step1: null, step2: null, lines: [], produkt: null });
  // Every line key has its text in all four languages, {ort} kept.
  for (const l of LOCALES) {
    const c = MSG[l].MultiStepForm.context;
    for (const k of ["themaYacht", "themaEzarri", "themaObjekt", "themaNeubau", "rolleArchitekt", "ort"]) assert.ok(c[k], `${l}: context.${k}`);
    assert.match(c.ort, /\{ort\}/, l);
  }
});

test("2) Header/Leiste: Thema aus dem Pfad", () => {
  const href = (p) => ctx.withContext("/beratung", ctx.contextForPath(p));
  assert.equal(href("/yacht-interior"), "/beratung?thema=yacht");
  assert.equal(href("/kuechen-vorarlberg"), "/beratung?thema=kueche");
  assert.equal(href("/kuechenplaner"), "/beratung?thema=kueche");
  assert.equal(href("/outdoor-gartenplanung"), "/beratung?thema=outdoor");
  assert.equal(href("/ezarri/mosaike"), "/beratung?thema=ezarri");
  // Runde 5 (P3, ux P2-6, bewusst geänderte Erwartung): Interior wählt nicht „Neubau“ vor.
  assert.equal(href("/interior-design-vorarlberg"), "/beratung?thema=interior");
  assert.equal(ctx.beratungContext({ thema: "interior" }).step1, null);
  assert.equal(href("/designermoebel-st-gallen"), "/beratung?ort=st-gallen");
  assert.equal(href("/designermoebel-unbekannt"), "/beratung");
  assert.equal(href("/"), "/beratung");
  assert.equal(href("/produkte/sofas"), "/beratung");
  // r8-leads (ux P1-3): tools and product pages keep their context.
  assert.equal(href("/sofaplaner"), "/beratung?thema=sofa&planer=sofaplaner");
  assert.equal(href("/3d-ansicht"), "/beratung?planer=3d");
  assert.equal(href("/stil-finder"), "/beratung?planer=stil-finder");
  assert.equal(href("/bodensee-licht"), "/beratung?planer=bodensee-licht");
  assert.equal(href("/produkte/lamps/lamps-2097-18"), "/beratung"); // name from the H1 (HeaderCta)
  // Header and bar use it.
  // r8-leads: HeaderCta adds the product name (from the H1) to the path context.
  assert.match(read("src/components/Navbar/HeaderCta.js"), /const ctx = contextForPath\(pathname\)[\s\S]*withContext\(href, /);
  assert.match(read("src/components/Reusable/MobileCtaBar.js"), /withContext\(baseHref, contextForPath\(pathname\)\)/);
  assert.match(read("src/components/Navbar/navbar.js"), /<HeaderCta href=\{terminHref\}/);
});

test("3) Menü „Planen & Erleben“: Gruppen ≤ 7, Hotel-Einstieg, Portal direkt auf den Login, Upload über den Schalter", () => {
  const src = read("src/components/Navbar/shellNav.js");
  // Welle 2 (bewusst geändert): Hotel & Objekt hat eine eigene Seite statt des Ankers #objekt.
  // Inhaber 01.11.2026 (bewusst geändert): eigene Seite in allen vier Sprachen, überall /hotel-objekt.
  assert.match(src, /label: c\("nav\.hotelObjekt"\), href: hotelObjektHref/);
  assert.match(src, /const hotelObjektHref = "\/hotel-objekt";/);
  assert.doesNotMatch(src, /"\/en\/hotel-objekt"/);
  assert.match(src, /featLink\("portal", \{ label: c\("nav\.portal"\), href: "\/portal\/login" \}\)/);
  // R4 ux P1-3 (bewusst geändert, Inhaber-Entscheidung Nr. 9): der Handy-Upload
  // steht wieder im Menü, nur bei eingeschaltetem Feature (featLink); die
  // Sicherheitsliste NAV_NOINDEX hält nur noch den Showroom-Rundgang fern.
  assert.match(src, /featLink\("upload"\)/);
  assert.match(src, /NAV_NOINDEX = new Set\(\["\/showroom"\]\)/);
  for (const l of LOCALES) {
    const n = MSG[l].Shell.nav;
    for (const k of ["adviceGroup", "onlineGroup", "serviceGroup", "hotelObjekt", "uploadInfo", "portal"]) assert.ok(n[k], `${l}: Shell.nav.${k}`);
  }
  // Group sizes: count the entries written in each block.
  const block = (name) => src.split(`const ${name} =`)[1].split(/\n {2}\];|\n {4}: \[\];/)[0];
  for (const name of ["advice", "online", "service"]) {
    const entries = (block(name).match(/featLink\(|\{ label:|consultation,/g) || []).length;
    assert.ok(entries <= 7, `${name}: ${entries}`);
  }
  // Footer column title = menu name.
  assert.match(read("src/components/Reusable/Footer.js"), /title=\{services\.label\}/);
});

test("8) Sprachumschalter: News-Artikel bleiben /news/<slug>, Produktpfade deterministisch", () => {
  const t = (p, from, to) => nav.translatePathWith(p, from, to, []);
  assert.equal(t("/news/quasar-auffallend-innovatives-lichtdesign", "de", "fr"), "/news/quasar-auffallend-innovatives-lichtdesign");
  assert.equal(t("/news/quasar-auffallend-innovatives-lichtdesign", "de", "it"), "/news/quasar-auffallend-innovatives-lichtdesign");
  assert.equal(t("/news/quasar", "fr", "en"), "/news/quasar");
  assert.equal(t("/news", "de", "fr"), "/nouvelles");
  assert.equal(t("/nouvelles", "fr", "it"), "/notizie");
  // Same result whichever form of the product path arrives (P2-3).
  assert.equal(t("/produits/sofas/x", "fr", "en"), "/products/sofas/x");
  assert.equal(t("/produkte/sofas/x", "fr", "en"), "/products/sofas/x");
  assert.equal(t("/ueber-uns/marken/minotti", "en", "fr"), "/a-propos/marques/minotti");
  assert.equal(t("/about-us/brands/minotti", "en", "de"), "/ueber-uns/marken/minotti");
  assert.equal(t("/consultation", "en", "it"), "/consulenza");
});
