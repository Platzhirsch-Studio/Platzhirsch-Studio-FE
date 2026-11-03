// Stil-Finder in DE, EN, FR, IT (Mehrsprachigkeit 01.11.2026):
// Struktur-Parität, Claim-Wächter, Typografie, Title/Description-Längen, FAQ.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync } from "node:fs";

register(
  "data:text/javascript," +
    encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  try { return await next(spec, ctx); }
  catch (e) { if (spec.startsWith(".") && !spec.split("/").pop().includes(".")) return next(spec + ".js", ctx); throw e; }
}
export async function load(url, ctx, next) {
  if ([".jpg", ".jpeg", ".png", ".webp", ".avif"].some((x) => url.toLowerCase().endsWith(x)))
    return { format: "module", shortCircuit: true, source: "export default { src: '/x.jpg', width: 10, height: 10, blurDataURL: '' };" };
  return next(url, ctx);
}`)
);

const { STILFINDER_LOCALES, stilfinderCopy, stilfinderClientCopy } = await import("../../src/lib/stilfinder/intl/index.js");
const { profileOverview, stilfinderFaq } = await import("../../src/lib/stilfinder/seoCopy.js");
const { QUESTIONS } = await import("../../src/components/Labs/Stilfinder/questions.js");
const { PROFILE_ORDER, PROFILES, brandHref, resultHref } = await import("../../src/components/Labs/Stilfinder/profiles.js");
const { PROJECT_TYPES, REGIONS } = await import("../../src/lib/stilfinder/options.js");
const { PREVIEW_MATERIAL_LABELS } = await import("../../src/components/Labs/Stilfinder/materialImages.js");
const { fmt, rich, localizeProfiles, localizeQuestions } = await import("../../src/components/Labs/Stilfinder/localize.js");
const { titleWithSuffix, clampDescription, META_TITLE_MAX } = await import("../../src/lib/seo/pageMetadata.js");
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

const FOREIGN = ["en", "fr", "it"];
const strings = (v, out = []) => {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
};
/** Schlüssel-Gerüst (Arrays: Länge + Gerüst je Element). */
const shape = (v) => {
  if (Array.isArray(v)) return v.map(shape);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, shape(v[k])]));
  return typeof v;
};
const placeholders = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

test("vier Sprachen, unbekannte Sprache → null", () => {
  assert.deepEqual([...STILFINDER_LOCALES], ["de", "en", "fr", "it"]);
  assert.equal(stilfinderCopy("es"), null);
  assert.equal(stilfinderClientCopy("xx"), null);
  for (const l of STILFINDER_LOCALES) assert.equal(stilfinderCopy(l).locale, l);
});

test("UI und Seitentexte: gleiche Schlüssel und Platzhalter wie der deutsche Master", () => {
  const de = stilfinderCopy("de");
  for (const l of FOREIGN) {
    const c = stilfinderCopy(l);
    for (const part of ["ui", "page"]) {
      const a = shape(de[part]);
      const b = shape(c[part]);
      // overview (Breadcrumb „Planen & Erleben“) gibt es nur auf Deutsch
      if (part === "page") {
        delete a.schema.overview;
        delete b.schema.overview;
      }
      assert.deepEqual(b, a, `${l}.${part}`);
    }
    const walk = (x, y, path) => {
      if (typeof x === "string") {
        // langNote (DE leer) und Brücken-Link Sofa (nur DE/EN) dürfen fehlen
        if (x === "" || y === "") return;
        assert.equal(placeholders(y), placeholders(x), `${l}: ${path}`);
      } else if (x && typeof x === "object") for (const k of Object.keys(x)) walk(x[k], y?.[k], `${path}.${k}`);
    };
    walk(de.ui, c.ui, "ui");
    walk(de.page, c.page, "page");
    assert.ok(c.ui.pdf.langNote.length > 20, `${l}: Hinweis „PDF auf Deutsch“`);
  }
});

test("Fragen-, Profil-, Material- und Options-Overlays decken die Quelle vollständig ab", () => {
  for (const l of FOREIGN) {
    const c = stilfinderCopy(l);
    assert.deepEqual(Object.keys(c.questions).sort(), QUESTIONS.map((q) => q.id).sort(), l);
    for (const q of QUESTIONS) {
      const o = c.questions[q.id];
      assert.ok(o.overline && o.title && o.topic, `${l} ${q.id}`);
      assert.equal(Boolean(o.hint), Boolean(q.hint), `${l} ${q.id} hint`);
      assert.equal(o.options.length, q.options.length, `${l} ${q.id} options`);
      q.options.forEach((opt, i) => {
        assert.ok(o.options[i].label, `${l} ${q.id}[${i}] label`);
        if (opt.alt !== undefined) assert.ok(o.options[i].alt?.length > 15, `${l} ${q.id}[${i}] alt`);
        if (opt.sub !== undefined) assert.ok(o.options[i].sub, `${l} ${q.id}[${i}] sub`);
      });
      assert.equal(new Set(o.options.map((x) => x.label)).size, o.options.length, `${l} ${q.id}: Labels eindeutig`);
    }
    assert.deepEqual(Object.keys(c.profiles).sort(), [...PROFILE_ORDER].sort(), l);
    for (const k of PROFILE_ORDER) {
      const p = c.profiles[k];
      for (const f of ["name", "tagline", "text", "alt", "tip"]) assert.ok(p[f], `${l} ${k}.${f}`);
      assert.equal(p.palette.length, PROFILES[k].palette.length, `${l} ${k} palette`);
      assert.equal(p.keywords.length, PROFILES[k].keywords.length, `${l} ${k} keywords`);
      assert.equal(c.materials[k].length, PREVIEW_MATERIAL_LABELS[k].length, `${l} ${k} materials`);
    }
    assert.equal(new Set(PROFILE_ORDER.map((k) => c.profiles[k].name)).size, PROFILE_ORDER.length, `${l}: Profilnamen eindeutig`);
    assert.deepEqual(Object.keys(c.options.projectTypes).sort(), PROJECT_TYPES.map((o) => o.value).sort(), l);
    assert.deepEqual(Object.keys(c.options.regions).sort(), REGIONS.map((o) => o.value).sort(), l);
  }
});

test("Overlays ändern nur Text: Gewichte, Bilder, Farben, Slugs, Marken bleiben", () => {
  for (const l of FOREIGN) {
    const c = stilfinderCopy(l);
    const qs = localizeQuestions(QUESTIONS, c.questions);
    qs.forEach((q, i) => {
      assert.equal(q.id, QUESTIONS[i].id);
      q.options.forEach((o, j) => {
        assert.deepEqual(o.w, QUESTIONS[i].options[j].w);
        assert.equal(o.image, QUESTIONS[i].options[j].image);
        assert.deepEqual(o.swatches, QUESTIONS[i].options[j].swatches);
      });
    });
    const ps = localizeProfiles(PROFILES, c.profiles);
    for (const k of PROFILE_ORDER) {
      assert.equal(ps[k].slug, PROFILES[k].slug);
      assert.deepEqual(ps[k].brands, PROFILES[k].brands, "Marken (inkl. Minotti) unverändert");
      assert.deepEqual(ps[k].moodboard, PROFILES[k].moodboard);
      assert.deepEqual(ps[k].palette.map((x) => x.hex), PROFILES[k].palette.map((x) => x.hex));
      assert.equal(ps[k].hero.img, PROFILES[k].hero.img);
    }
  }
  // Deutsch: ohne Overlay unverändert
  const de = stilfinderCopy("de");
  assert.equal(de.questions, null);
  assert.equal(localizeProfiles(PROFILES, de.profiles), PROFILES);
});

test("Claim-Wächter: keine Händler-/Partner-Aussagen, Preise, Superlative oder Fristen", () => {
  const banned = [
    /\b(?:authori[sz]ed|official|exclusive)\s+(?:dealer|partner|retailer)/i,
    /\bdealer\b|\bpartner (?:of|for)\b/i,
    /revendeur|distributeur|concessionnaire|partenaire officiel/i,
    /rivenditore|concessionario|partner ufficiale/i,
    /Händler|Vertragshändler|offizielle[rn]? Partner/i,
    /[€$]|\bCHF\b|\bEUR\b|\bprix\b|\bprezzo\b|\bprice\b/i,
    // \p{L}-Grenzen statt \b („Bestätigung“: ä ist für \b kein Wortzeichen)
    /(?<!\p{L})(?:best|number one|leading|meilleure?s?|il migliore|leader|führend\p{L}*|beste[nrs]?)(?!\p{L})/iu,
    /\bguarantee|\bgaranti|\bgaranzia/i,
  ];
  for (const l of STILFINDER_LOCALES) {
    const c = stilfinderCopy(l);
    for (const s of strings([c.ui, c.page, c.questions, c.profiles, c.materials, c.options])) {
      for (const re of banned) assert.doesNotMatch(s, re, `${l}: ${s}`);
    }
  }
  // Marken nur als „aus unserem Online-Katalog“ (wie Deutsch)
  assert.match(stilfinderCopy("en").ui.result.brandsNote, /online catalogue/);
  assert.match(stilfinderCopy("fr").ui.result.brandsNote, /catalogue en ligne/);
  assert.match(stilfinderCopy("it").ui.result.brandsNote, /catalogo online/);
});

test("Pflichthinweise in jeder Sprache: keine KI-Vermerke (Inhaber 02.11.), kein „keine KI“-Rechtfertigungssatz (Inhaber 03.11.), Double-Opt-in, Speicherung", () => {
  const ai = { de: /KI-gestützt/, en: /help of AI/, fr: /l’aide de l’IA/, it: /supporto dell’IA/ };
  const noAi = { de: /keine KI/, en: /no AI/, fr: /sans IA/, it: /senza IA/ };
  const rules = { de: /festen Regeln/, en: /fixed rules/, fr: /règles fixes/, it: /regole fisse/ };
  const stored = { de: /nicht auf unseren Servern gespeichert/, en: /nothing is stored on our servers/, fr: /rien n’est enregistré sur nos serveurs/, it: /nulla viene salvato sui nostri server/ };
  const doi = /Double-Opt-in|double opt-in/i;
  for (const l of STILFINDER_LOCALES) {
    const t = stilfinderCopy(l).ui;
    assert.doesNotMatch(t.pdf.consent, ai[l], l);
    assert.match(t.result.howRules, rules[l], l);
    assert.match(t.result.howRules, stored[l], l);
    assert.doesNotMatch(t.result.howRules, noAi[l], l);
    assert.match(t.pdf.newsletterHint, doi, l);
    assert.match(stilfinderFaq(l)[1].a, rules[l], l);
    assert.doesNotMatch(stilfinderFaq(l)[1].a, noAi[l], l);
  }
});

test("Typografie: FR mit geschützten Leerzeichen und « », IT «» ohne Leerzeichen, keine geraden Anführungszeichen", () => {
  const fr = strings(stilfinderCopy("fr"));
  for (const s of fr) {
    assert.doesNotMatch(s, / [?!;:](?=\s|$)/, `FR normales Leerzeichen vor Satzzeichen: ${s}`);
    assert.doesNotMatch(s, /« | »/, `FR « » ohne geschütztes Leerzeichen: ${s}`);
    assert.doesNotMatch(s, /"/, s);
  }
  assert.ok(fr.some((s) => s.includes(" :")), "FR: geschütztes Leerzeichen vor :");
  assert.ok(fr.some((s) => s.includes(" ?")), "FR: schmales geschütztes Leerzeichen vor ?");
  for (const s of strings(stilfinderCopy("it"))) {
    assert.doesNotMatch(s, /["„“”]/, `IT: ${s}`);
    assert.doesNotMatch(s, /« | »/, `IT «» ohne Leerzeichen: ${s}`);
  }
  for (const s of strings(stilfinderCopy("en"))) assert.doesNotMatch(s, /["„«»]/, `EN: ${s}`);
});

test("Lektorat: Auslassungspunkte ohne Leerzeichen davor (EN/FR/IT), Farbtöne je Sprache eindeutig wie im Deutschen", () => {
  for (const l of FOREIGN) {
    for (const s of strings(stilfinderCopy(l))) assert.doesNotMatch(s, /\S[\s  ]…/, `${l}: ${s}`);
    // DE unterscheidet Kalk (Seeterrasse) und Kreide (Klare Linie) – die Übersetzung auch.
    const names = (key) => stilfinderCopy(l).profiles[key].palette;
    assert.notEqual(names("see")[0], names("klar")[0], `${l}: Kalk ≠ Kreide`);
  }
});

test("SEO: Title ≤ 60 mit Marke, Description 120–150 ungekürzt, in jeder Sprache verschieden", () => {
  const titles = new Set();
  for (const l of STILFINDER_LOCALES) {
    const m = stilfinderCopy(l).page.meta;
    const title = titleWithSuffix(m.title);
    assert.ok(title.length <= META_TITLE_MAX, `${l}: ${title}`);
    assert.match(title, /\| Platzhirsch/, l);
    titles.add(title);
    const plain = m.description.replace(/[  ]/g, " ");
    assert.ok(m.description.length >= 120 && m.description.length <= 150, `${l}: ${m.description.length}`);
    assert.equal(clampDescription(plain), plain, `${l}: Description wird nicht gekürzt`);
  }
  assert.equal(titles.size, 4);
  const seo = read("src/lib/stilfinder/seo.js");
  assert.match(seo, /hreflangLanguages\(stilfinderUrl\)/, "hreflang reziprok aus einer Quelle");
  assert.match(seo, /seoAlternates\(\{ canonical: url, robots \}\)/, "Ergebnis: kein hreflang (noindex)");
});

test("FAQ und Profilübersicht: keine Platzhalter, Profilnamen und Links der Sprache", () => {
  for (const l of STILFINDER_LOCALES) {
    const faq = stilfinderFaq(l);
    assert.equal(faq.length, 4, l);
    for (const it of faq) {
      assert.doesNotMatch(it.a, /\{|\}|undefined|null/, `${l}: ${it.q}`);
      assert.match(it.q, /\?$/, `${l}: ${it.q}`);
    }
    const c = stilfinderCopy(l);
    const names = localizeProfiles(PROFILES, c.profiles);
    for (const k of PROFILE_ORDER) assert.ok(faq[0].a.includes(names[k].name), `${l}: ${k}`);
    for (const p of profileOverview(l)) assert.equal(p.href, `/${l}/stil-finder/ergebnis/${PROFILES[p.key].slug}`);
  }
  assert.match(stilfinderFaq("fr")[0].a, /« Calme italien »/);
  assert.match(stilfinderFaq("it")[0].a, /«Quiete italiana»/);
});

test("Links: Ergebnis, Marken und Datenschutz unter der Sprache der Seite", () => {
  assert.equal(resultHref(PROFILES.warm, "1213001", "fr"), "/fr/stil-finder/ergebnis/warme-moderne?a=1213001");
  assert.equal(resultHref(PROFILES.warm), "/de/stil-finder/ergebnis/warme-moderne");
  assert.equal(brandHref("101 Copenhagen", "en"), "/en/about-us/brands/101-copenhagen");
  assert.equal(brandHref("Flos", "it"), "/it/chi-siamo/marche/flos");
  assert.equal(brandHref("Flos"), "/de/ueber-uns/marken/flos");
  for (const f of ["StilfinderQuiz.js", "StilResult.js", "MoodboardPdfForm.js"]) {
    const s = read(`src/components/Labs/Stilfinder/${f}`);
    assert.doesNotMatch(s, /href="\/de\//, `${f}: kein fester /de/-Link`);
    assert.doesNotMatch(s, /locale: "de"/, `${f}: Termin-Link in der Sprache der Seite`);
  }
});

test("Client-Budget: Texte serverseitig, nicht in src/messages", () => {
  for (const l of STILFINDER_LOCALES) {
    const msg = read(`src/messages/${l}.json`);
    assert.doesNotMatch(msg, /Italienische Ruhe|Italian Calm|Calme italien|Quiete italiana/, l);
  }
  for (const f of ["StilfinderQuiz.js", "StilResult.js", "MoodboardPdfForm.js", "Moodboard.js", "StilCopy.js"]) {
    const s = read(`src/components/Labs/Stilfinder/${f}`);
    assert.doesNotMatch(s, /useTranslations|intl\/(?:en|fr|it)/, `${f}: keine Messages, keine Fremdsprachen im Bundle`);
  }
  const client = stilfinderClientCopy("fr");
  assert.deepEqual(Object.keys(client).sort(), ["locale", "options", "profiles", "questions", "ui"]);
  assert.ok(JSON.stringify(client).length < 30_000, "eine Sprache, klein");
});

test("fmt/rich: Platzhalter und Elemente", () => {
  assert.equal(fmt("Frage {n} von {total}", { n: 2, total: 7 }), "Frage 2 von 7");
  assert.equal(fmt("{x}", {}), "{x}");
  const el = { type: "a" };
  assert.deepEqual(rich("Mehr in der {link}.", { link: el }), ["Mehr in der ", el, "."]);
});

test("Seiten: Sprachsperre nur noch über STILFINDER_LOCALES", () => {
  const files = [
    "src/app/[locale]/stil-finder/page.js",
    "src/app/[locale]/stil-finder/ergebnis/[profil]/layout.js",
    "src/app/[locale]/stil-finder/ergebnis/[profil]/page.js",
    "src/app/[locale]/stil-finder/ergebnis/[profil]/opengraph-image.js",
    "src/app/[locale]/stil-finder/ergebnis/[profil]/twitter-image.js",
  ];
  for (const f of files) assert.doesNotMatch(read(f), /locale !== "de"|locale === "de" \? stilOgImage|z\.literal\("de"\)/, f);
});
