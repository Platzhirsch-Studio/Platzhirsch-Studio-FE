// tests/unit/ezarri-welt.test.mjs – Team A „Ezarri-Welt & Sortiment“.
// Prüft: Schalter-Kopplung aller Seiten (robots, hreflang, Sitemap-Hook,
// Händler-Aussage), Vollständigkeit (402 Detailseiten, 21 Kollektionen, PDFs),
// Texte ohne Händler-Aussage/Superlative, Konfigurator-Link nach Vertrag §7.4.
// Doku: Marktresearch/digital/features/ezarri-welt.md
// Run: node --test tests/unit/ezarri-welt.test.mjs
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "src");
const APP = path.join(SRC, "app/[locale]/ezarri");
const OTHER_TEAMS = new Set(["konfigurator", "rechner", "custom-mix", "anfrage"]);

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

let C, D, COPY, META, LINK, STATE, CLAIMS, STATE_K;
before(async () => {
  C = await import(pathToFileURL(path.join(SRC, "lib/ezarri/config.js")).href);
  D = await import(pathToFileURL(path.join(SRC, "lib/ezarri/data.js")).href);
  COPY = await import(pathToFileURL(path.join(SRC, "lib/ezarri/copy.js")).href);
  META = await import(pathToFileURL(path.join(SRC, "components/Ezarri/Welt/meta.js")).href);
  LINK = await import(pathToFileURL(path.join(SRC, "components/Ezarri/Katalog/konfigLink.js")).href);
  STATE = await import(pathToFileURL(path.join(SRC, "lib/ezarri/konfigurator/state.js")).href);
  CLAIMS = await import(pathToFileURL(path.join(SRC, "lib/legal/claims.js")).href);
  STATE_K = await import(pathToFileURL(path.join(SRC, "components/Ezarri/Katalog/katalogState.js")).href);
});

function pagesOfTeamA(dir = APP, rel = "") {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) {
      if (e.name === "page.js") out.push(path.join(dir, e.name));
      continue;
    }
    if (!rel && OTHER_TEAMS.has(e.name)) continue;
    out.push(...pagesOfTeamA(path.join(dir, e.name), `${rel}/${e.name}`));
  }
  return out;
}

test("Jede Team-A-Seite hängt am Schalter (ezarriMetadata/withEzarriRobots) und an der Sprachprüfung", () => {
  const pages = pagesOfTeamA();
  assert.ok(pages.length >= 20, `nur ${pages.length} Seiten gefunden`);
  const welt = fs.readFileSync(path.join(SRC, "components/Ezarri/Welt/EinsatzWelt.js"), "utf8");
  for (const file of pages) {
    const src = fs.readFileSync(file, "utf8");
    const delegated = src.includes("EinsatzWelt") ? welt : src;
    assert.match(delegated, /ezarriMetadata\(|withEzarriRobots\(/, `${path.relative(ROOT, file)}: robots nicht am Schalter`);
    // 01.11.2026: Welt-Seiten prüfen ezarriWeltLocaleEnabled (de, en, fr, it), Werkzeuge ezarriLocaleEnabled.
    assert.match(delegated, /ezarri(Welt)?LocaleEnabled\(|permanentRedirect\(/, `${path.relative(ROOT, file)}: keine Sprachprüfung`);
    assert.doesNotMatch(src, /locale !== ["']de["'][^\n]*\)\s*notFound\(\)/, "Sprache über ezarriLocaleEnabled prüfen (EZARRI_LOCALES)");
  }
  assert.match(fs.readFileSync(path.join(APP, "layout.js"), "utf8"), /ezarriWeltLocaleEnabled\(locale\)\) notFound\(\)/);
});

// Integration 28.10.2026 (Inhaber-Entscheidung Nr. 7 + 9): Standard jetzt indexierbar (EZARRI_PUBLIC = true).
test("Metadaten: Standard index/follow, hreflang de/en/fr/it, canonical ohne Query", () => {
  const m = META.ezarriMetadata({ path: "/ezarri/mosaike", title: "T", description: "D" });
  assert.deepEqual(m.robots, { index: true, follow: true });
  assert.equal(m.alternates.canonical, "https://platzhirsch.studio/de/ezarri/mosaike");
  // 01.11.2026: Ezarri-Welt auf Deutsch, Englisch, Französisch, Italienisch – hreflang de, en, fr, it, x-default (= de).
  assert.deepEqual(Object.keys(m.alternates.languages).sort(), ["de", "en", "fr", "it", "x-default"]);
  assert.equal(m.alternates.languages.en, "https://platzhirsch.studio/en/ezarri/mosaike");
  assert.equal(m.alternates.languages.fr, "https://platzhirsch.studio/fr/ezarri/mosaike");
  // Werkzeuge (Konfigurator, Rechner, Custom Mix, Anfrage) bleiben de/en – kein hreflang auf 404-Locales.
  const tool = META.ezarriMetadata({ path: "/ezarri/rechner", title: "T", description: "D" });
  assert.deepEqual(Object.keys(tool.alternates.languages).sort(), ["de", "en", "x-default"]);
  const en = META.ezarriMetadata({ locale: "en", path: "/ezarri/mosaike", title: "T", description: "D" });
  assert.equal(en.alternates.canonical, "https://platzhirsch.studio/en/ezarri/mosaike");
  assert.equal(en.openGraph.locale, "en_GB");
  const p2 = META.ezarriMetadata({ path: "/ezarri/galerie", title: "T", description: "D", seite: 2, utility: true });
  assert.equal(p2.alternates.canonical, "https://platzhirsch.studio/de/ezarri/galerie?seite=2");
  const variant = META.ezarriMetadata({ path: "/ezarri/mosaike/2502-a-safe", canonicalPath: "/ezarri/mosaike/2502-a", title: "T", description: "D", utility: true });
  assert.equal(variant.alternates.canonical, "https://platzhirsch.studio/de/ezarri/mosaike/2502-a");
});

test("Sitemap-Hook: leer bei EZARRI_PUBLIC=false, sonst Hub, Welten, Werkzeuge, 21 Kollektionen, indexierbare Basis-Mosaike", () => {
  // Integration 28.10.2026 (Inhaber-Entscheidung Nr. 7 + 9): Standard an → Einträge; aus bleibt leer.
  assert.equal(C.EZARRI_PUBLIC, true);
  assert.deepEqual(D.getEzarriEntries(false), []);
  assert.deepEqual(D.getEzarriEntries(), D.getEzarriEntries(true));
  const on = D.getEzarriEntries(true);
  const paths = on.map((e) => e.path);
  for (const p of ["/ezarri", "/ezarri/pool", "/ezarri/fassade", "/ezarri/wasser", "/ezarri/mosaike", "/ezarri/galerie", "/ezarri/technik/downloads"]) assert.ok(paths.includes(p), p);
  // F6 (28.10.2026): Konfigurator, Rechner, Custom-Mix und die 7 Custom-Kollektionen sind
  // index, follow mit Self-Canonical → gehören in die Sitemap (vorher 14 Kollektionen, ohne Werkzeuge).
  for (const p of ["/ezarri/konfigurator", "/ezarri/rechner", "/ezarri/custom-mix", "/ezarri/kollektionen/custom-mix", "/ezarri/kollektionen/standard-pixel"]) assert.ok(paths.includes(p), p);
  assert.equal(paths.filter((p) => p.startsWith("/ezarri/kollektionen/")).length, 21);
  // Runde 4 P5 (seo P1-2): nicht mehr alle 281 Basis-Mosaike – nur die mit eigenem Text bzw.
  // < 50 % Ähnlichkeit innerhalb der Kollektion (src/lib/ezarri/indexierung.js); die übrigen
  // sind noindex,follow und gehören nicht in die Sitemap.
  const mosaikPaths = paths.filter((p) => p.startsWith("/ezarri/mosaike/"));
  assert.ok(mosaikPaths.length > 0 && mosaikPaths.length < 281, String(mosaikPaths.length));
  assert.ok(mosaikPaths.every((p) => D.isIndexableMosaik(p.replace("/ezarri/mosaike/", ""))));
  assert.ok(!paths.some((p) => /safe|corner|cove|vergleich|\?/.test(p.replace("/ezarri/mosaike/", ""))), "keine Hilfsseiten in der Sitemap");
  assert.ok(on.every((e) => e.lastmod === D.DATA_STAND && e.locale === "de"));
});

test("Händler-Aussage: nur mit Schalter UND Claim-Register-Eintrag; Texte frei von Händler-Wörtern und Superlativen", () => {
  // Integration 28.10.2026 (Inhaber-Entscheidung Nr. 7 + 9): Ezarri steht im Claim-Register und der Schalter ist an.
  assert.equal(COPY.dealerClaim(false), null);
  assert.equal(COPY.dealerLine(false), COPY.NEUTRAL_CLAIM);
  assert.ok(CLAIMS.isVerifiedDealerBrand("ezarri"));
  assert.equal(COPY.dealerClaim(), "Platzhirsch Home Living ist Vertragshändler von Ezarri.");
  assert.equal(COPY.dealerLine(), COPY.dealerClaim());
  const strings = [];
  const walk = (v) => {
    if (typeof v === "string") strings.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  Object.values(COPY).forEach(walk);
  assert.ok(strings.length > 200);
  const text = strings.join("\n");
  assert.doesNotMatch(text, /h(ä|ae)ndler|vertragspartner|offiziell|autorisiert/i, "Händler-Aussage gehört ins Claim-Register");
  assert.doesNotMatch(text, /einzigartig|größte|führend|beste[nrs]?\b|Luxus|€|EUR\b/i);
  const hits = CLAIMS.findClaims ? CLAIMS.findClaims(text, { locale: "de" }) : [];
  assert.deepEqual(Array.isArray(hits) ? hits : [], []);
});

test("Vollständigkeit: 402 Detailseiten, 21 Kollektionen, alle verlinkten PDFs liegen in public/ezarri/pdf", () => {
  assert.equal(D.getReferenceIds().length, 402);
  assert.equal(new Set(D.getReferenceIds()).size, 402);
  assert.equal(D.getCollectionIds().length, 21);
  const detail = fs.readFileSync(path.join(APP, "mosaike/[referenz]/page.js"), "utf8");
  // Alle Sprachen der Ezarri-Welt vorrendern (01.11.2026: de, en, fr, it).
  assert.match(detail, /generateStaticParams\(\)\s*\{\s*return EZARRI_WELT_LOCALES\.flatMap\(\(locale\) => getReferenceIds\(\)\.map/);
  const { sheets, alt } = D.getDownloads();
  assert.ok(sheets.length >= 16, `nur ${sheets.length} Datenblätter`);
  const copy = COPY.DOWNLOADS.zertifikatListe.map((z) => `/ezarri/pdf/${z.datei}`);
  for (const href of [...sheets.map((s) => s.href), ...alt.map((a) => a.href), ...copy]) {
    assert.ok(fs.existsSync(path.join(ROOT, "public", href)), `fehlt: public${href}`);
  }
});

test("Varianten: Safe/Corner zeigen aufs Basis-Mosaik, Detail-Daten ohne Preis", () => {
  assert.equal(D.getBaseReference("2502-a-safe")?.id, "2502-a");
  assert.equal(D.getBaseReference("corner-03-d-safe")?.id, "2503-d");
  assert.equal(D.getBaseReference("dune"), null);
  const groups = D.getVariantGroups("dune");
  assert.ok(groups.find((g) => g.gruppe === "Format").items.some((v) => v.current));
  assert.ok(groups.find((g) => g.gruppe === "Anti-Rutsch").items.some((v) => v.sameAsPage), "25mm Safe steht bei Ezarri auf derselben Seite");
  const card = D.toReferenceCard(D.getReference("dune"));
  assert.ok(!Object.keys(card).some((k) => /preis|price/i.test(k)));
});

test("Auswahl je Einsatz und Wasserfarbe: Basis-Mosaike mit Bild, deterministisch", () => {
  for (const w of COPY.WELTEN) {
    const a = D.pickReferences(w.filter, 9);
    assert.ok(a.length >= 6, `${w.id}: ${a.length}`);
    assert.ok(a.every((c) => c.typ === "mosaik" && c.bild));
    assert.deepEqual(a.map((c) => c.id), D.pickReferences(w.filter, 9).map((c) => c.id));
  }
  assert.ok(D.pickReferences({ wasser: ["natur"] }, 3).length === 3);
});

test("Konfigurator-Link nach Vertrag §7.4 Nr. 1 (?k= decodierbar, Anteile = 100)", () => {
  const href = LINK.konfiguratorHref([{ konfId: "38" }, { konfId: "66" }], "25mm");
  const k = new URL(href, "https://x.test").searchParams.get("k");
  const s = STATE.decodeState(k);
  assert.ok(s, "decodeState liefert null");
  assert.deepEqual(s.mix.map((m) => m.id), ["38", "66"]);
  assert.equal(s.mix.reduce((n, m) => n + m.anteil, 0), 100);
  const one = LINK.konfiguratorHref([{ konfId: "38" }]);
  assert.equal(new URL(one, "https://x.test").searchParams.get("m"), "38");
});

test("Client-Inseln: keine Wert-Exporte aus 'use client'-Modulen in Server-Seiten", () => {
  for (const file of pagesOfTeamA()) {
    const src = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(src, /import\s*\{[^}]*PER_STEP[^}]*\}\s*from\s*"@\/components\/Ezarri\/Katalog\/FilterIsland"/, "PER_STEP aus constants.js importieren");
  }
});

// ---------------------------------------------------------------------------
// QM Runde 1 (qa-screenshots/ezarri/welt/feedback-1.md)

test("QM P1-3: Eignung laut Datenblatt getrennt von „mit Projektbild“, Einsatzliste ohne Dopplung", () => {
  const idx = D.getReferenceIndex();
  const mosaik = idx.filter((c) => c.typ === "mosaik");
  const cladding = mosaik.filter((c) => c.einsatz.includes("wand-innen-aussen")).length;
  const bad = D.countReferences({ einsatz: ["bad"] });
  const kueche = D.countReferences({ einsatz: ["kueche"] });
  assert.ok(bad >= cladding, `bad ${bad} < Cladding ${cladding}`);
  assert.ok(kueche >= cladding, `kueche ${kueche} < Cladding ${cladding}`);
  assert.ok(D.countWithProjectImage(["bad"]) < bad, "Projektbild ist eine Teilmenge");
  assert.ok(D.countWithProjectImage(["bad"]) > 0);
  for (const c of idx) {
    assert.ok(!(c.einsatz.includes("wand-innen-aussen") && c.einsatz.includes("innenraum-deko")), `${c.id}: Wand doppelt`);
    assert.ok(!c.einsatz.some((e) => e.startsWith("pool-")), `${c.id}: Galerie-Einsatz in der Eignung`);
  }
  assert.deepEqual(D.getEignung("dune").filter((e) => e === "innenraum-deko"), []);
  const k = STATE_K;
  assert.equal(idx.filter((c) => k.matchesExtras(c, { bild: ["bad"] }, {})).length, D.countWithProjectImage(["bad"]));
});

test("QM P2-3/P2-4: Format der Referenz selbst (Hexa = 7, Basalt 50 = 50 mm mit 50-mm-Verpackung)", () => {
  const hexa = D.getReferences({ format: ["hexa"] });
  assert.equal(hexa.length, 7, hexa.map((r) => r.id).join(","));
  assert.ok(hexa.every((r) => r.format === "Hexa"));
  assert.deepEqual(D.toReferenceCard(D.getReference("basalt-50")).formate, ["50mm"]);
  assert.deepEqual(D.toReferenceCard(D.getReference("basalt")).formate, ["25mm"]);
  assert.equal(D.getOwnPackaging("basalt-50").label, "50 mm");
  assert.equal(D.getOwnPackaging("dune").label, "25mm");
  // Safe-Steps zählen beim Format mit (25-mm-Safe-Step trifft 25 mm)
  assert.ok(D.getReferences({ format: ["25mm"], typ: ["safe-step"] }).length > 0);
});

test("QM P2-5: Zahlen ohne Safe-Steps und Formstücke, Text der Übersicht passt zu den Daten", () => {
  const st = D.getSortimentStats();
  assert.equal(st.mosaike, 281);
  assert.equal(st.mosaike + st.weitere, 402);
  assert.equal(D.countReferences({}), 281);
  assert.match(COPY.HUB.lead(st), new RegExp(`^${st.mosaike} Mosaike in ${st.kollektionen} Kollektionen`));
  assert.match(COPY.HUB.description(st), new RegExp(`${st.mosaike} Mosaike in ${st.kollektionen} Kollektionen`));
  assert.doesNotMatch(`${COPY.HUB.lead(st)} ${COPY.HUB.description(st)}`, /400/);
});

test("QM P1-2: Kachelbilder fest kuratiert, je Welt ein anderes Bild, kein Hero, keine Produktaufnahme", () => {
  const ids = COPY.WELTEN.map((w) => w.bild?.galerie);
  assert.equal(new Set(ids).size, COPY.WELTEN.length, "Dopplung");
  for (const w of COPY.WELTEN) {
    const g = D.getGalleryImageById(w.bild.galerie);
    assert.ok(g?.bild?.web, `${w.id}: Bild fehlt`);
    assert.doesNotMatch(w.bild.galerie, /celestite|^anw-(dsc|cam\d|mos-)|detalle/, `${w.id}: Hero oder Produktaufnahme`);
    assert.ok(w.bild.alt.length > 30 && !/^Projekt mit/.test(w.bild.alt), `${w.id}: Alt-Text nach Bildinhalt`);
    assert.ok(fs.existsSync(path.join(ROOT, "public", `${g.bild.web}-600.avif`)), `${w.id}: Datei`);
  }
  const used = new Set(ids);
  const a = D.getGalleryImages({ einsatz: ["wellness"], limit: 3, exclude: used });
  assert.ok(a.every((g) => !ids.includes(g.id) && !/^anw-(dsc|cam\d|mos-)|detalle/.test(g.id)));
  const b = D.getGalleryImages({ einsatz: ["wellness"], limit: 3, exclude: used });
  assert.ok(b.every((g) => !a.some((x) => x.id === g.id)), "Dedup über mehrere Aufrufe");
});

test("QM P2-2: Sortierung „Empfohlen“ beginnt mit benannten Mosaiken mit Bild, je Kollektion abwechselnd; ?sort/?bild im URL-Zustand", () => {
  const k = STATE_K;
  const idx = D.getReferenceIndex().filter((c) => c.typ === "mosaik");
  const sorted = k.sortCards(idx, "empfohlen");
  assert.equal(sorted.length, idx.length);
  const first = sorted.slice(0, 12);
  assert.ok(first.every((c) => c.bild && !k.isCodeName(c.name)), first.map((c) => c.name).join(", "));
  assert.ok(new Set(first.slice(0, 6).map((c) => c.kollektion)).size >= 5, "abwechselnd je Kollektion");
  assert.ok(!k.isCodeName(sorted[0].name));
  const byName = k.sortCards(idx, "name");
  assert.ok(byName[0].name.localeCompare(byName[1].name, "de", { numeric: true }) <= 0);
  const hell = k.sortCards(idx, "hell").filter((c) => c.hex);
  assert.ok(hell.length > 100);
  assert.deepEqual(k.parseExtras(new URLSearchParams("bild=bad,xyz&sort=hell")), { bild: ["bad"], sort: "hell" });
  assert.deepEqual(k.parseExtras({ sort: "foo" }), { bild: [], sort: "empfohlen" });
  assert.deepEqual(k.extraEntries({ bild: ["bad", "kueche"], sort: "empfohlen" }), [["bild", "bad,kueche"]]);
  assert.equal(k.matchesExtras({ typ: "corner", projekte: [] }, {}, {}), false, "ohne Art-Filter nur Basis-Mosaike");
  assert.equal(k.matchesExtras({ typ: "corner", projekte: [] }, {}, { q: "corner" }), true, "Suche findet auch Formstücke");
});

// ---------------------------------------------------------------------------
// QM Runde 2 (qa-screenshots/ezarri/welt/feedback-2.md)

test("QM2 P2-2: Rezept Daikiri = Kilauea 50, Perla 40, Oxido 10 (Summe 100, mit Quelle)", () => {
  const k = D.getKombination("daikiri");
  assert.ok(k, "Rezept fehlt");
  assert.deepEqual(k.teile.map((t) => [t.name.toLowerCase(), t.anteil]), [["kilauea", 50], ["perla", 40], ["oxido", 10]]);
  assert.equal(k.teile.reduce((a, t) => a + t.anteil, 0), 100);
  assert.equal(k.teile[0].ref, null, "Kilauea hat keine eigene Ezarri-Seite");
  assert.equal(k.teile[1].ref, "perla", "Perla im Format der Mischung (25 mm)");
  assert.equal(k.quelle, "https://www.ezarri.com/de/daikiri");
  assert.equal(k.konfigurierbar, false);
  const m = D.getKombination("mojito");
  assert.deepEqual(m.teile.map((t) => [t.name.toLowerCase(), t.anteil]), [["teide", 85], ["capricorn", 10], ["lava", 5]]);
});

test("QM2 P2-2: alle Rezepte summieren 100 %, alle Cocktail- und Mix-Mosaike mit Rezept haben eins", () => {
  const ids = D.getKombinationIds();
  assert.ok(ids.length >= 57, String(ids.length));
  for (const id of ids) {
    const k = D.getKombination(id);
    assert.equal(k.teile.reduce((a, t) => a + t.anteil, 0), 100, id);
    for (const t of k.teile) if (t.ref) assert.ok(D.getReference(t.ref), `${id}: ${t.ref}`);
  }
  const cocktail = D.getReferencesByCollection("cocktail").filter((r) => r.typ === "mosaik");
  assert.ok(cocktail.every((r) => ids.includes(r.id)), "Cocktail ohne Rezept");
  // Konfigurator-Übergabe mit Rezept-Anteilen (Vertrag §7.4 Nr. 1)
  const blue = D.getKombination("blue-lagoon");
  assert.equal(blue.konfigurierbar, true);
  const href = LINK.konfiguratorHref(blue.teile.map((t) => ({ konfId: t.konfId, ref: t.ref, anteil: t.anteil })), "25mm");
  const st = STATE.decodeState(new URL(href, "https://x").searchParams.get("k"));
  assert.deepEqual(st.mix.map((x) => x.anteil), [33, 33, 34]);
});

test("QM2 P2-3: eine Zählweise – 17 Kollektionen + 4 Sonderanfertigungen = 21 Einträge", () => {
  const st = D.getSortimentStats();
  assert.equal(st.kollektionen, 17);
  assert.equal(st.sonderanfertigungen, 4);
  assert.equal(st.kollektionen + st.sonderanfertigungen, D.getCollections().length);
  // QM r1 ezarri-yacht: geschützte Leerzeichen zwischen Zahl und Wort
  assert.equal(COPY.HUB.kollektionen.title(st), "17\u00a0Kollektionen und 4\u00a0Sonderanfertigungen");
  assert.match(COPY.KOLLEKTIONEN.description(st), /^Alle 17 Ezarri-Kollektionen und 4 Sonderanfertigungen/);
});

test("QM2 P2-4: Galerie ohne Videos, Videos getrennt und nie bei Einsatz-Filter", () => {
  const all = D.getGallery({}, { perPage: 2000, medien: "foto" });
  assert.ok(all.items.every((g) => g.typ !== "video"));
  assert.equal(all.total + D.getGalleryVideos({}).length, 1010);
  const k = D.getGallery({ einsatz: ["kueche"] }, { perPage: 24, medien: "foto" });
  assert.ok(k.items.every((g) => g.typ !== "video"), "Küche ohne Videos");
  assert.deepEqual(D.getGalleryVideos({ einsatz: ["kueche"] }), []);
  assert.ok(!/^anw-(dsc|cam\d|mos-)|detalle/.test(all.items[0].id), "erste Kachel ist ein Projektbild");
  const counts = D.galleryFacetCounts({}, { einsatz: ["kueche", "bad"] });
  assert.equal(counts.einsatz.kueche, k.total);
});

test("QM2 P2-5: Hero mobil als eigene 4:5-Datei (≤ 90 KB AVIF, nicht hochskaliert)", () => {
  const base = path.join(ROOT, "public/ezarri/gemma/anw-celestite-25-gemma-mosaic-pool-ezarri-1");
  for (const w of [480, 853]) for (const ext of ["avif", "webp"]) assert.ok(fs.existsSync(`${base}-m${w}.${ext}`), `m${w}.${ext}`);
  assert.ok(fs.statSync(`${base}-m853.avif`).size <= 90 * 1024);
});
