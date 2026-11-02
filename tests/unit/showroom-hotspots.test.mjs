// tests/unit/showroom-hotspots.test.mjs – Rundgang /showroom (Neuland N1):
// Schema der Stationen/Stücke, Händler-Wort-Regel, rechte-/imShowroom-Filter,
// „Haralds Tisch“ nur mit echtem Material, Schalter an das Manifest gekoppelt,
// Budgets der Dateien (Poster ≤ 120 KB, erster Splat ≤ 20 MB), Texte in 4 Sprachen.
// Doku: Marktresearch/digital/features/neuland.md §8.
// Run: node --test tests/unit/showroom-hotspots.test.mjs
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const LIB = path.join(ROOT, "src/lib/showroom");
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(LIB, f), "utf8"));

let C, D, T, P, S, L;
before(async () => {
  C = await import(pathToFileURL(path.join(LIB, "config.js")).href);
  D = await import(pathToFileURL(path.join(LIB, "data.js")).href);
  T = await import(pathToFileURL(path.join(LIB, "copy.js")).href);
  P = await import(pathToFileURL(path.join(LIB, "paths.js")).href);
  S = await import(pathToFileURL(path.join(LIB, "schema.js")).href);
  L = await import(pathToFileURL(path.join(ROOT, "src/lib/legal/claims.js")).href);
});

const station = (id, extra = {}) => ({
  id,
  zone: "wohnen",
  titel: { de: `Station ${id}` },
  text: { de: "Ein Satz." },
  kamera: { pos: [0, 1.6, 2], ziel: [0, 1, 0] },
  ...extra,
});
const spot = (id, extra = {}) => ({
  id,
  station: "s1",
  pos: [0, 1, 0],
  label: `Stück ${id}`,
  marke: null,
  aktionen: ["merken", "termin"],
  stand: "2026-11-15",
  imShowroom: true,
  rechte: "ok",
  ...extra,
});

test("hotspots.json und testszene.json sind gültig", () => {
  for (const f of ["hotspots.json", "testszene.json"]) {
    assert.deepEqual(D.validateData(readJson(f)), [], f);
  }
});

test("Händler-Wort nur für ClassiCon und Ezarri", () => {
  assert.deepEqual([...T.DEALER_BRANDS].sort(), ["ClassiCon", "Ezarri"]);
  // Text kommt aus dem Claim-Register (src/lib/legal/claims.js), nicht aus copy.js
  const reg = (slug) => L.CLAIM_REGISTER.find((c) => c.brandSlug === slug && c.claim === "dealer");
  assert.equal(T.dealerLine("ClassiCon", "de"), reg("classicon").text);
  // Ezarri erst mit Register-Eintrag (Teamleiter, zusammen mit EZARRI_PUBLIC)
  assert.equal(T.dealerLine("Ezarri", "de"), L.isVerifiedDealerBrand("ezarri") ? reg("ezarri").text : null);
  for (const locale of T.SHOWROOM_LOCALES) {
    for (const marke of ["Minotti", "Molteni&C", "Vitra", "Testmarke", null, undefined]) assert.equal(T.dealerLine(marke, locale), null, `${marke} ${locale}`);
    if (locale !== "de") assert.equal(T.dealerLine("ClassiCon", locale), reg("classicon").texts?.[locale] ?? null, `ClassiCon ${locale}: nur übersetzter Registertext`);
  }
  // haendler: true bei anderen Marken → Schemafehler
  const bad = { schema: 1, stand: "2026-11", stationen: [station("s1")], hotspots: [spot("h1", { marke: "Minotti", haendler: true })] };
  assert.ok(D.validateData(bad).some((e) => /Claim-Feld nur bei/.test(e)));
  // Händler-Wort im Freitext (alle Sprachen) → Schemafehler
  for (const label of ["Minotti-Vertragshändler Sofa", "Authorised Minotti dealer", "Revendeur Minotti", "Rivenditore Minotti"]) {
    const d = { schema: 1, stand: "2026-11", stationen: [station("s1")], hotspots: [spot("h1", { label })] };
    assert.ok(D.validateData(d).some((e) => /Claim-Formulierung/.test(e)), label);
  }
  // Stationstexte ebenso
  const st = { schema: 1, stand: "2026-11", stationen: [station("s1", { text: { de: "Wir sind Händler von allem." } })], hotspots: [] };
  assert.ok(D.validateData(st).some((e) => /Claim-Formulierung im Stationstext/.test(e)));
  // Im Rundgang entsteht die Händler-Zeile nur über haendler: true + erlaubte Marke
  const ok = { schema: 1, stand: "2026-11", stationen: [station("s1")], hotspots: [spot("h1", { marke: "ClassiCon", haendler: true }), spot("h2", { marke: "Minotti" })] };
  const tour = D.buildTour({ data: ok, manifest: { zonen: [{ id: "wohnen", stimmungen: { tag: { lod: [{ id: "lo", url: "/x.sog" }] } } }] }, locale: "de" });
  const [h1, h2] = tour.stations[0].hotspots;
  assert.equal(h1.dealer, reg("classicon").text);
  assert.equal(h2.dealer, null);
});

test("Alle Texte der echten Daten und der Testszene ohne fremdes Händler-Wort", () => {
  for (const f of ["hotspots.json", "testszene.json"]) {
    const data = readJson(f);
    for (const h of data.hotspots) {
      if (h.haendler) assert.ok(T.DEALER_BRANDS.includes(h.marke), `${f} ${h.id}`);
      assert.equal(D.textHasDealerWord(`${h.label} ${h.masse || ""}`), false, `${f} ${h.id}`);
    }
  }
});

test("rechte: pruefen und imShowroom: false ergeben keinen Hotspot", () => {
  const data = {
    schema: 1,
    stand: "2026-11",
    stationen: [station("s1")],
    hotspots: [spot("ok"), spot("pruefen", { rechte: "pruefen" }), spot("weg", { imShowroom: false }), spot("fremd", { station: "gibtsnicht" })],
  };
  assert.deepEqual(D.visibleHotspots(data).map((h) => h.id), ["ok"]);
  assert.equal(D.hotspotAllowed({ imShowroom: true, rechte: "ok" }), true);
  assert.equal(D.hotspotAllowed({ imShowroom: true, rechte: "pruefen" }), false);
  assert.equal(D.hotspotAllowed({ imShowroom: true }), false, "ohne rechte-Feld kein Hotspot");
  assert.equal(D.hotspotAllowed({ imShowroom: false, rechte: "ok" }), false);
  // Testszene enthält beide Fälle und sie fehlen im Rundgang
  const tz = readJson("testszene.json");
  const ids = D.visibleHotspots(tz).map((h) => h.id);
  assert.ok(!ids.includes("t-leuchte"), "rechte pruefen");
  assert.ok(!ids.includes("t-sessel"), "imShowroom false");
  assert.ok(ids.includes("t-sofa"));
  // Ungültiger rechte-Wert ist ein Schemafehler
  const bad = { ...data, hotspots: [spot("x", { rechte: "vielleicht" })] };
  assert.ok(D.validateData(bad).some((e) => /rechte/.test(e)));
});

test("Station „Haralds Tisch“ nur mit echtem Material, sonst weg (kein Platzhalter)", () => {
  const leer = station("h", { typ: "haralds-tisch", material: [] });
  const ohneQuelle = station("h", { typ: "haralds-tisch", material: [{ src: "/showroom/harald/skizze-1.webp" }] });
  const echt = station("h", { typ: "haralds-tisch", material: [{ src: "/showroom/harald/skizze-1.webp", quelle: "Harald Menghin, Original 2026", alt: { de: "Handzeichnung" } }] });
  assert.equal(D.visibleStations({ stationen: [station("a"), leer] }).length, 1);
  assert.equal(D.visibleStations({ stationen: [station("a"), ohneQuelle] }).length, 1);
  assert.equal(D.visibleStations({ stationen: [station("a"), echt] }).length, 2);
  // In der Testszene ist die Station angelegt, aber ohne Material → nicht sichtbar
  const tz = readJson("testszene.json");
  assert.ok(tz.stationen.some((s) => s.typ === "haralds-tisch"));
  assert.ok(!D.visibleStations(tz).some((s) => s.typ === "haralds-tisch"));
  // Material in echten Daten muss als Datei existieren
  for (const s of readJson("hotspots.json").stationen.filter((x) => x.typ === "haralds-tisch")) {
    for (const m of s.material || []) assert.ok(fs.existsSync(path.join(ROOT, "public", m.src)), m.src);
  }
});

test("Schalter: SHOWROOM_PUBLIC an das Manifest gekoppelt (ohne Aufnahme aus)", () => {
  const manifest = readJson("manifest.json");
  const hotspots = readJson("hotspots.json");
  assert.equal(C.SHOWROOM_SWITCH, true, "Inhaber-Entscheidung Nr. 9: Feature an");
  // Stand 28.10.2026: keine Aufnahme → nicht öffentlich
  assert.equal(manifest.aufnahme, null);
  assert.equal(C.manifestReady(manifest, hotspots).ok, false);
  assert.equal(C.SHOWROOM_PUBLIC, C.manifestReady(manifest, hotspots).ok);
  // Modus: Produktion ohne Aufnahme → off (404), Entwicklung → preview, Freigabe → public
  assert.equal(C.showroomMode({ isPublic: false, nodeEnv: "production", preview: undefined }), "off");
  assert.equal(C.showroomMode({ isPublic: false, nodeEnv: "production", preview: "1" }), "preview");
  assert.equal(C.showroomMode({ isPublic: false, nodeEnv: "development" }), "preview");
  assert.equal(C.showroomMode({ isPublic: true, nodeEnv: "production" }), "public");
  assert.equal(C.showroomMode({ isPublic: true, nodeEnv: "production", switchOn: false }), "off");
  assert.deepEqual(C.showroomRobots("preview"), { index: false, follow: false, googleBot: { index: false, follow: false } });
  assert.deepEqual(C.showroomRobots("public"), { index: true, follow: true });
  assert.deepEqual(C.showroomSitemapPaths(false), []);
  assert.deepEqual(C.showroomSitemapPaths(true), ["/showroom"]);
});

test("manifestReady: erst mit vollständiger, freigegebener Aufnahme", () => {
  const stationen = Array.from({ length: 6 }, (_, i) => station(`s${i + 1}`));
  const hotspots = { schema: 1, stand: "2026-11-15", stationen, hotspots: [] };
  const zone = { id: "wohnen", stimmungen: { tag: { lod: [{ id: "lo", url: "/showroom/wohnen/tag/lo.sog", bytes: 9e6 }], poster: { avif: "/p.avif", bytes: { avif: 90_000 } } } } };
  const full = { schema: 1, stand: "2026-11", aufnahme: { datum: "2026-11-12", freigabe: { inhaber: true, personen: true }, abnahme: { note: 8.5 } }, zonen: [zone] };
  assert.deepEqual(C.manifestReady(full, hotspots), { ok: true, gruende: [] });
  const minus = (fn) => {
    const m = structuredClone(full);
    fn(m);
    return C.manifestReady(m, hotspots).ok;
  };
  assert.equal(minus((m) => (m.aufnahme.freigabe.inhaber = false)), false, "ohne Inhaber-Freigabe");
  assert.equal(minus((m) => (m.aufnahme.freigabe.personen = false)), false, "ohne Einwilligung");
  assert.equal(minus((m) => (m.aufnahme.abnahme.note = 7)), false, "Abnahme < 8/10");
  assert.equal(minus((m) => (m.zonen[0].stimmungen.tag.poster.bytes.avif = 130_000)), false, "Poster > 120 KB");
  assert.equal(minus((m) => (m.zonen[0].stimmungen.tag.lod[0].bytes = 21 * 1024 * 1024)), false, "lo > 20 MB");
  assert.equal(minus((m) => (m.zonen = [])), false, "ohne Zone");
  assert.equal(C.manifestReady(full, { ...hotspots, stationen: stationen.slice(0, 5) }).ok, false, "< 6 Stationen");
  assert.equal(C.manifestReady(full, { ...hotspots, stationen: [...stationen, ...Array.from({ length: 5 }, (_, i) => station(`x${i}`))] }).ok, false, "> 10 Stationen");
  // Die Testszene macht die Seite nie öffentlich
  const testOnly = { ...full, aufnahme: null, zonen: [], testszene: zone };
  assert.equal(C.manifestReady(testOnly, hotspots).ok, false);
});

// R3 (P4-technik, technik P2-3): Die synthetische Testszene liegt nicht mehr in
// public/, sondern unter .data/showroom/_testszene/ und wird nur im Vorschau-Modus
// über src/app/showroom/%5Ftestszene/[...path]/route.js ausgeliefert (gleiche URL).
const datei = (url) => (url.startsWith("/showroom/_testszene/") ? path.join(ROOT, ".data", url) : path.join(ROOT, "public", url));

test("Dateien des Manifests existieren und halten die Budgets", () => {
  const manifest = readJson("manifest.json");
  const zonen = [...(manifest.zonen || []), ...(manifest.testszene ? [manifest.testszene] : [])];
  for (const z of zonen) {
    for (const [st, m] of Object.entries(z.stimmungen || {})) {
      for (const l of m.lod || []) {
        const f = datei(l.url);
        assert.ok(fs.existsSync(f), l.url);
        assert.equal(fs.statSync(f).size, l.bytes, `${l.url} Bytes im Manifest`);
        if (l.id === "lo") assert.ok(l.bytes <= C.BUDGET.firstSplatBytes, `${z.id}/${st} lo ≤ 20 MB`);
      }
      const p = m.poster;
      if (p) {
        for (const v of [p, p.tall].filter(Boolean)) {
          assert.ok(fs.existsSync(datei(v.avif)), v.avif);
          assert.ok(fs.statSync(datei(v.avif)).size <= C.BUDGET.posterAvifBytes, `${v.avif} ≤ 120 KB`);
        }
      }
      const v = m.video;
      if (v) for (const k of ["av1", "h264"]) assert.ok(fs.existsSync(datei(v[k])), v[k]);
    }
  }
});

test("Keine Minotti-Herstellerbilder und keine Preise in den Daten", () => {
  for (const f of ["hotspots.json", "testszene.json", "manifest.json"]) {
    const raw = fs.readFileSync(path.join(LIB, f), "utf8");
    assert.doesNotMatch(raw, /minotti\.(com|it)|\/Images\/.*minotti/i, f);
    assert.doesNotMatch(raw, /€|\bEUR\b|\bCHF\b/, f);
  }
  const d = { schema: 1, stand: "2026-11", stationen: [station("s1")], hotspots: [spot("h1", { masse: "ab 4.900 €" })] };
  assert.ok(D.validateData(d).some((e) => /Preise/.test(e)));
});

test("Texte in DE/EN/FR/IT vollständig, Vorschlag für src/messages deckungsgleich", () => {
  const keys = (o, p = "") =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
  const de = keys(T.showroomCopy("de")).sort();
  for (const l of ["en", "fr", "it"]) assert.deepEqual(keys(T.showroomCopy(l)).sort(), de, l);
  const vorschlag = JSON.parse(fs.readFileSync(path.join(ROOT, "Marktresearch/digital/features/showroom-messages-vorschlag.json"), "utf8"));
  for (const l of T.SHOWROOM_LOCALES) {
    assert.ok(vorschlag[l]?.Showroom, `Vorschlag ${l}`);
    assert.deepEqual(keys(vorschlag[l].Showroom).sort(), de, `Vorschlag-Schlüssel ${l}`);
  }
  // keine Superlative in den deutschen Texten
  const alles = JSON.stringify(vorschlag.de);
  assert.doesNotMatch(alles, /\b(beste[nrs]?|einzigartig|größte[nrs]?|führende[nrs]?|Nr\. ?1|unvergleichlich)\b/i);
  assert.equal(T.monthYear("2026-11-15", "de"), "November 2026");
  assert.equal(T.monthYear("2026-11", "it"), "novembre 2026");
});

test("Links aus dem Rundgang in der richtigen Sprache", () => {
  assert.deepEqual(P.localizeShowroomHref("/produkte/sofas/x", "en"), { href: "/products/sofas/x" });
  assert.deepEqual(P.localizeShowroomHref("/ueber-uns/marken/classicon", "fr"), { href: "/a-propos/marques/classicon" });
  assert.deepEqual(P.localizeShowroomHref("/beratung", "it"), { href: "/consulenza" });
  assert.deepEqual(P.localizeShowroomHref("/ezarri", "en"), { href: "/ezarri", locale: "de" });
  assert.deepEqual(P.localizeShowroomHref("/ezarri", "de"), { href: "/ezarri" });
  assert.deepEqual(P.localizeShowroomHref("/arbeitsweise", "it"), { href: "/arbeitsweise", locale: "de" });
});

test("JSON-LD: FurnitureStore Landstraße 11, VideoObject nur mit Video", () => {
  const tour = { poster: { webp: "/showroom/w/tag/poster-breit.webp" }, video: null };
  const g = S.showroomSchema({ locale: "de", title: "T", description: "D", tour })["@graph"];
  const store = g.find((n) => n["@type"] === "FurnitureStore");
  assert.equal(store.address.streetAddress, "Landstraße 11");
  assert.equal(store.address.postalCode, "6911");
  assert.equal(store.address.addressLocality, "Lochau");
  assert.ok(!g.some((n) => n["@type"] === "VideoObject"));
  const withVideo = S.showroomSchema({ locale: "en", title: "T", description: "D", tour: { ...tour, video: { h264: "/v.mp4", av1: "/v1.mp4", dauer: 65, datum: "2026-11-12" } } })["@graph"];
  const v = withVideo.find((n) => n["@type"] === "VideoObject");
  assert.equal(v.duration, "PT1M5S");
  assert.equal(v.contentUrl, "https://platzhirsch.studio/v.mp4");
  assert.equal(v.uploadDate, "2026-11-12");
  assert.match(v.thumbnailUrl[0], /^https:\/\/platzhirsch\.studio\//);
});
