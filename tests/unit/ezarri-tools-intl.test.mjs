// Ezarri-Werkzeuge (Konfigurator, Druckblatt, Mosaik-Rechner) auf Französisch und
// Italienisch (01.11.2026): Struktur wie Deutsch, jeder t()-Text übersetzt,
// Typografie, keine Händler-/Preis-/Superlativ-Aussagen, SEO-Längen, hreflang.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const imp = (p) => import(pathToFileURL(path.join(ROOT, p)).href);
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

const KONF_DE = await imp("src/lib/ezarri/konfigurator/copy.js");
const KONF_FR = await imp("src/lib/ezarri/konfigurator/copy.fr.js");
const KONF_IT = await imp("src/lib/ezarri/konfigurator/copy.it.js");
const RECHNER_DE = (await imp("src/lib/ezarri/rechner/copy.js")).RECHNER;
const R_FR = await imp("src/lib/ezarri/rechner/rechner.fr.js");
const R_IT = await imp("src/lib/ezarri/rechner/rechner.it.js");
const INTL = await imp("src/lib/ezarri/konfigurator/intl.js");
const CI = await imp("src/lib/ezarri/konfigurator/copy-intl.js");

const LANGS = [
  ["fr", KONF_FR, R_FR],
  ["it", KONF_IT, R_IT],
];

/** Schlüsselpfade eines Objekts (Arrays: Länge + Elemente). */
function shape(v, p = "") {
  if (typeof v === "function") return [`${p}:fn`];
  if (Array.isArray(v)) return [`${p}[${v.length}]`, ...v.flatMap((x, i) => shape(x, `${p}[${i}]`))];
  if (v && typeof v === "object") return Object.keys(v).sort().flatMap((k) => shape(v[k], `${p}.${k}`));
  return [p];
}

// ---------------------------------------------------------------------------
// Struktur

test("Konfigurator FR/IT: jede deutsche Export-Struktur vorhanden, FR und IT gleich", () => {
  for (const [name, de] of Object.entries(KONF_DE)) {
    if (typeof de === "function") continue; // zusammenfassung → ZUSAMMENFASSUNG
    const want = shape(de);
    for (const [l, K] of LANGS) {
      assert.ok(K[name], `${l}: ${name} fehlt`);
      const got = new Set(shape(K[name]));
      for (const k of want) assert.ok(got.has(k), `${l}: ${name}${k} fehlt`);
    }
  }
  for (const name of ["SEITE", "ZUSAMMENFASSUNG", "UI", "UI_TPL", "LISTEN"]) {
    assert.deepEqual(shape(KONF_FR[name]), shape(KONF_IT[name]), `${name}: FR ≠ IT`);
  }
  // Ids und Werte bleiben gleich (nur Texte übersetzt)
  for (const [, K] of LANGS) {
    assert.deepEqual(K.TABS.map((x) => x.id), KONF_DE.TABS.map((x) => x.id));
    assert.deepEqual(K.FORMAT_LABEL, KONF_DE.FORMAT_LABEL);
  }
});

test("Rechner FR/IT: Struktur wie RECHNER (copy.js), Werte der Optionen unverändert", () => {
  const want = shape(RECHNER_DE).map((k) => k.replace(/\.(flaecheText):fn$/, ".$1").replace(/\.mischRundung:fn$/, ".mischRundung1"));
  for (const [l, , R] of LANGS) {
    const got = new Set(shape(R.RECHNER));
    for (const k of want) assert.ok(got.has(k), `${l}: RECHNER${k} fehlt`);
    assert.ok(R.RECHNER.ergebnis.mischRundungN, `${l}: mischRundungN`);
    for (const key of ["formen", "treppen", "rinnen", "formate"]) assert.deepEqual(R.RECHNER[key].map((o) => o.value), RECHNER_DE[key].map((o) => o.value), `${l}: ${key}`);
    assert.equal(R.RECHNER.vergleich.punkte.length, RECHNER_DE.vergleich.punkte.length);
  }
  assert.deepEqual(R_FR.TABELLE.phrases.map(([de]) => de), R_IT.TABELLE.phrases.map(([de]) => de));
  assert.deepEqual(R_FR.TABELLE.patterns.map(([de]) => de), R_IT.TABELLE.patterns.map(([de]) => de));
});

// ---------------------------------------------------------------------------
// Vollständigkeit der t()-Texte

const FILES = [
  ...fs.readdirSync(path.join(ROOT, "src/components/Ezarri/Konfigurator")).map((f) => `src/components/Ezarri/Konfigurator/${f}`),
  ...fs.readdirSync(path.join(ROOT, "src/components/Ezarri/Rechner")).map((f) => `src/components/Ezarri/Rechner/${f}`),
  "src/app/[locale]/ezarri/konfigurator/blatt/page.js",
  "src/app/[locale]/ezarri/konfigurator/page.js",
  "src/app/[locale]/ezarri/rechner/page.js",
].filter((f) => f.endsWith(".js"));
const STR = String.raw`"(?:[^"\\]|\\.)*"|` + "`(?:[^`\\\\]|\\\\.)*`";
const CALL = new RegExp(String.raw`\bt\(\s*(${STR})\s*,\s*(${STR})\s*(?:,\s*("[^"]*"|[^,)]+))?`, "g");

function calls() {
  const keys = new Set();
  const tpls = new Set();
  const ohneSchluessel = [];
  for (const f of FILES) {
    for (const m of read(f).matchAll(CALL)) {
      if (m[3]) {
        for (const k of m[3].matchAll(/"([^"]+)"/g)) tpls.add(k[1]);
        continue;
      }
      if (m[1].startsWith("`")) ohneSchluessel.push(`${f}: ${m[1].slice(0, 50)}`);
      else keys.add(JSON.parse(m[1]));
    }
  }
  return { keys, tpls, ohneSchluessel };
}

test("Jeder t(\"de\", \"en\")-Text hat FR und IT; Texte mit Variablen haben einen Vorlagen-Schlüssel", () => {
  const { keys, tpls, ohneSchluessel } = calls();
  assert.ok(keys.size > 200, `nur ${keys.size} Texte gefunden`);
  assert.deepEqual(ohneSchluessel, [], "t(`…${x}…`) ohne Schlüssel für FR/IT");
  for (const [l, K] of LANGS) {
    for (const k of keys) assert.ok(k in K.UI, `${l}: UI ${JSON.stringify(k)} fehlt`);
    for (const k of tpls) assert.ok(k in K.UI_TPL, `${l}: UI_TPL ${k} fehlt`);
  }
});

test("Vorlagen: FR und IT haben dieselben Platzhalter", () => {
  const ph = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const k of Object.keys(KONF_FR.UI_TPL)) assert.deepEqual(ph(KONF_FR.UI_TPL[k]), ph(KONF_IT.UI_TPL[k]), k);
  for (const k of Object.keys(KONF_FR.ZUSAMMENFASSUNG)) assert.deepEqual(ph(KONF_FR.ZUSAMMENFASSUNG[k]), ph(KONF_IT.ZUSAMMENFASSUNG[k]), k);
  assert.deepEqual(ph(R_FR.RECHNER.ergebnis.flaecheText), ["marge", "netto"]);
  assert.deepEqual(ph(R_IT.RECHNER.ergebnis.flaecheText), ["marge", "netto"]);
});

// ---------------------------------------------------------------------------
// Typografie, Recht, Ton

const strings = (v) => (typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === "object" ? Object.values(v).flatMap(strings) : []);

test("Typografie: FR mit geschützten Leerzeichen vor : ; ? ! und in « », IT mit «»", () => {
  const fr = CI.toolCopy("fr");
  const it = CI.toolCopy("it");
  const frTexte = [...strings(fr.KONF), ...strings(fr.RECHNER), ...fr.TABELLE.phrases.map(([, o]) => o)];
  for (const s of frTexte) {
    assert.doesNotMatch(s, / [:;?!](\s|$)/, `FR normales Leerzeichen vor Satzzeichen: ${s}`);
    assert.doesNotMatch(s, /« | »/, `FR « » ohne geschütztes Leerzeichen: ${s}`);
    assert.doesNotMatch(s, /[„“"]/, `FR Anführungszeichen: ${s}`);
  }
  assert.ok(frTexte.some((s) => s.includes(" :")), "FR: kein geschütztes Leerzeichen vor :");
  const itTexte = [...strings(it.KONF), ...strings(it.RECHNER)];
  for (const s of itTexte) assert.doesNotMatch(s, /[„“"]/, `IT: «» statt „“: ${s}`);
  assert.ok(itTexte.some((s) => s.includes("«")), "IT: «» fehlen");
});

test("Recht: keine Händler-Aussage, keine Preise, keine Superlative; Schätzungs- und Verlegehinweis übersetzt", () => {
  const all = [...strings(KONF_FR), ...strings(KONF_IT), ...strings(R_FR.RECHNER), ...strings(R_IT.RECHNER)].join("\n");
  assert.doesNotMatch(all, /revendeur|concessionnaire|distributeur|rivenditore|concessionario|distributore|Vertragshändler|\bdealer\b|officiel|ufficiale|autoris|autorizzat/i);
  assert.doesNotMatch(all, /€|\bEUR\b|\bCHF\b|\d\s?(euro|francs?)\b/);
  assert.match(all, /Prix sur demande/);
  assert.match(all, /Prezzi su richiesta/);
  assert.doesNotMatch(all, /\b(meilleur\w*|unique(?!ment)\w*|exclusi\w*|luxe\w*|luxueu\w*|parfait\w*|incomparable|gratuit\w*|migliore|miglior|unico|unica|esclusiv\w*|lusso\w*|lussuos\w*|perfett\w*|gratuit\w*|incredibil\w*)\b/i);
  for (const [l, K] of LANGS) {
    assert.match(K.SEITE.hinweisDaten, /10 %/, `${l}: Schätzung mit 10 % Reserve`);
    assert.ok(K.SEITE.hinweisDaten.length > 60 && K.SEITE.hinweisVerlegung.length > 30, `${l}: Hinweise`);
    assert.match(K.SEITE.hinweisFarbe, /(échantillons|campioni)/, `${l}: Muster-Hinweis`);
  }
  assert.match(R_FR.RECHNER.ergebnis.hinweis, /indicative/);
  assert.match(R_IT.RECHNER.ergebnis.hinweis, /indicativo/);
  // Herstellerangaben als „selon/secondo Ezarri“
  assert.match(KONF_FR.HINWEIS_MIX.allein, /Selon Ezarri/);
  assert.match(KONF_IT.HINWEIS_MIX.allein, /Secondo Ezarri/);
});

// ---------------------------------------------------------------------------
// SEO

test("SEO: Titel ≤ 60 (mit „| Platzhirsch“), Description 120–150 Zeichen je Sprache", () => {
  const cases = [
    ["fr Konfigurator", KONF_FR.SEITE.metaTitle, KONF_FR.SEITE.metaDescription],
    ["it Konfigurator", KONF_IT.SEITE.metaTitle, KONF_IT.SEITE.metaDescription],
    ["fr Rechner", R_FR.RECHNER.metaTitle, R_FR.RECHNER.metaDescription],
    ["it Rechner", R_IT.RECHNER.metaTitle, R_IT.RECHNER.metaDescription],
  ];
  for (const [n, title, desc] of cases) {
    assert.ok(`${title} | Platzhirsch`.length <= 60, `${n}: Titel ${`${title} | Platzhirsch`.length}`);
    assert.ok(desc.length >= 120 && desc.length <= 150, `${n}: Description ${desc.length}`);
  }
});

test("SEO: hreflang reziprok (gleicher Satz je Sprache), x-default = Deutsch, eigene URL je Sprache", () => {
  const url = (l) => `https://platzhirsch.studio/${l}/ezarri/konfigurator`;
  const set = INTL.toolLanguagesFrom(url);
  assert.deepEqual(Object.keys(set), ["de", "en", "fr", "it", "x-default"]);
  for (const l of INTL.TOOL_LOCALES) assert.equal(set[l], url(l));
  assert.equal(set["x-default"], url("de"));
  assert.deepEqual(INTL.toolLanguagesFrom(url, ["de", "en"]), { de: url("de"), en: url("en"), "x-default": url("de") });
  const seo = read("src/lib/ezarri/konfigurator/seo.js");
  assert.match(seo, /canonical: url/);
  assert.match(seo, /withEzarriRobots\(/);
  for (const p of ["src/app/[locale]/ezarri/konfigurator/page.js", "src/app/[locale]/ezarri/rechner/page.js", "src/app/[locale]/ezarri/konfigurator/blatt/page.js"]) {
    assert.match(read(p), /toolMetadata\(/, p);
    assert.match(read(p), /toolLocaleEnabled\(locale\)\)\s*notFound\(\)/, p);
  }
});

// ---------------------------------------------------------------------------
// Laufzeit-Helfer

test("Helfer: makeT, Zusammenfassung, Rechner-Tabelle, Funktionen aus Vorlagen", () => {
  const K = CI.konfCopy("fr");
  assert.equal(K.lang, "fr");
  assert.equal(K.t("Mosaik wählen", "Choose a mosaic"), "Choisir une mosaïque");
  assert.equal(K.t("unbekannt", "unknown"), "unknown");
  assert.equal(K.t("x", "y", "mix.mehr", { name: "Dune" }), "Dune : 5 pour cent de plus");
  assert.equal(CI.konfCopy("de").t("a", "b"), "a");
  assert.equal(CI.konfCopy("en").t("a", "b"), "b");
  const z = CI.konfCopy("it").zusammenfassung({ szene: "pool", becken: { l: 8, b: 4, tFlach: 1.2, tTief: 1.8 }, mixText: "Mosaico Dune", fugeName: "Bianco", formatLabel: "25 mm" });
  assert.equal(z, "Piscina 8 × 4 m, profondità da 1,2 a 1,8 m. Mosaico Dune. Formato 25 mm, fuga Bianco.");
  const r = CI.rechnerCopy("fr");
  assert.equal(r.uebersetze("Gerade Treppe, 3 Stufen"), "Escalier droit, 3 marches");
  assert.equal(r.uebersetze("Bitte einen Wert zwischen 0,5 und 50 eingeben."), "Veuillez saisir une valeur entre 0,5 et 50.");
  assert.equal(CI.rechnerCopy("it").uebersetze("Länge × Breite = 8,5 × 4"), "Lunghezza × larghezza = 8,5 × 4");
  const R = INTL.rechnerMitFunktionen(CI.rechnerCopy("it").RECHNER);
  assert.equal(R.ergebnis.mischRundung(1), "Ogni mosaico arrotondato a scatole intere: +1 scatola rispetto al non miscelato.");
  assert.match(R.ergebnis.flaecheText("80", "10"), /^Netto 80 m² più 10 %/);
  assert.equal(CI.toolCopy("de"), null);
  assert.equal(CI.toolCopy("en"), null);
  assert.equal(INTL.toolLocaleEnabled("fr"), true);
  assert.equal(INTL.toolLocaleEnabled("es"), false);
});

test("Bundle: FR/IT-Texte nur über den Server (keine Client-Importe, nicht in messages)", () => {
  for (const f of FILES.filter((f) => f.startsWith("src/components/"))) {
    const src = read(f);
    assert.doesNotMatch(src, /^import[^\n]*(copy\.(fr|it)|rechner\.(fr|it)|copy-intl)/m, `${f} importiert FR/IT-Texte direkt`);
  }
  for (const l of ["fr", "it"]) {
    const msg = read(`src/messages/${l}.json`);
    assert.doesNotMatch(msg, /Trame \{name\}|Trama \{name\}|Calculateur de mosaïque pour piscine/, `${l}.json`);
  }
  assert.match(read("src/components/Ezarri/Konfigurator/ToolCopy.js"), /^"use client";/);
});

// ---------------------------------------------------------------------------
// Lektorat 01.11.2026: Korrekturen festhalten

test("Lektorat: Auslassungspunkte ohne Leerzeichen, Fachbegriffe und Register FR/IT", () => {
  for (const [l, K, R] of LANGS) {
    const all = JSON.stringify([K, R]);
    // FR/IT setzen „…“ direkt ans Wort (nicht „Chargement …“).
    for (const v of Object.values(K.UI)) assert.doesNotMatch(v, / …/, `${l}: ${v}`);
    // Keine deutschen Sie-Reste / falsche Register.
    assert.doesNotMatch(all, /\bLei\b|\bSuo\b|\bSua\b/, `${l}: Lei-Form statt voi`);
  }
  // „Teilung“ ist der Vorher/Nachher-Schieber, nicht „Teilen“ (Partage).
  assert.equal(KONF_FR.UI.Teilung, "Séparation");
  assert.equal(KONF_FR.UI.Kamera, "Point de vue");
  assert.doesNotMatch(JSON.stringify(KONF_FR), /télévers/, "fr: „téléverser“ ist québécois");
  // IT: AR (nicht RA), Tiefe minima/massima statt „lato alto“, Pallet maskulin.
  assert.doesNotMatch(JSON.stringify(KONF_IT), /\bRA\b|lato alto|Telecamera/);
  assert.doesNotMatch(JSON.stringify(R_IT), /lato alto/);
  assert.equal(KONF_IT.UI_TPL["rr.paletten"], "{p} pieni + {k} scatole");
  assert.equal(R_IT.RECHNER.felder.tTief.label, KONF_IT.MASSE_LABEL.pool.tTief);
  assert.equal(R_FR.RECHNER.felder.tTief.label, KONF_FR.MASSE_LABEL.pool.tTief);
  const it = CI.konfCopy("it");
  assert.equal(INTL.fill(it.UI_TPL["stage.fotoAlt"], { name: "Dune", view: "Panoramica", licht: it.LISTEN.fotoLichtAlt.abend }), "Visualizzazione: vasca di esempio di 8 × 4 m con Dune, Panoramica, luce della sera");
});
