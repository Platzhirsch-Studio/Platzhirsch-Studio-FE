// node --test tests/unit/kuechenplaner-geraete.test.mjs
// Küchenplaner × Herstellerkatalog: Geräte je Steckplatz, Nischenprüfung nur mit
// Katalogmaßen, Preis nur über preisAktiv (PREISE_PAUSIERT, Alter, Schalter),
// Teilen-Link, Einstieg ?geraet= von /kuechengeraete.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KATALOG_MARKEN, produkteByWelt } from "../../src/lib/katalog/index.js";
import {
  PREIS_TEXT_DE, buildGeraeteIndex, cmWert, geraetMasse, geraetParam, geraetVorwahl, geraeteSlots,
  kandidaten, parseNische, preisTexteDe, pruefeGeraet, withGeraet,
} from "../../src/lib/kuechenplaner/geraete.js";
import { decodePlan, defaultPlan, encodePlan } from "../../src/components/Labs/Kuechenplaner/planState.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const HEUTE = "2026-10-31";
const marken = Object.fromEntries(KATALOG_MARKEN.map((m) => [m.slug, m.name]));
const INDEX = buildGeraeteIndex(produkteByWelt("kuechengeraete"), { heute: HEUTE, an: true, marken });
const bySlug = (s) => INDEX.find((g) => g.s === s);
const slot = (m, i = 0) => geraeteSlots(m)[i];
const PLAN = defaultPlan("l"); // Sockel 15 + Korpus 78 = 93 cm Unterbaunische

test("Maße: mm/cm, Gaggenau-Abmessung (Kälte H × B, sonst B × H), Nischen in beiden Schreibweisen", () => {
  assert.equal(cmWert("595 mm"), 59.5);
  assert.equal(cmWert("60 cm"), 60);
  assert.equal(cmWert("ca. 35 kg"), null);
  assert.deepEqual(parseNische("B 560–568 mm · H 594–600 mm · T ≥ 560 mm"), { b: [[56, 56.8]], h: [[59.4, 60]] });
  assert.deepEqual(parseNische("87,4–89 / 121,6–123,6 × 56–57 × 55 cm").h, [[87.4, 89], [121.6, 123.6]]);
  assert.equal(parseNische("Gesamthöhe ≥ 550 mm"), null);
  const kuehl = geraetMasse({ kategorie: "kuehlen", masse: [{ key: "abmessung", wert: "177.5 x 56 cm" }] });
  assert.equal(kuehl.h, 177.5);
  assert.equal(kuehl.b, 56);
  const ofen = geraetMasse({ kategorie: "backofen", masse: [{ key: "abmessung", wert: "90 x 48 cm" }] });
  assert.equal(ofen.b, 90);
  assert.equal(ofen.h, 48);
});

test("Steckplätze folgen den Moduloptionen", () => {
  assert.deepEqual(geraeteSlots({ t: "backofen", w: 60 }).map((s) => s.art), ["ofen60"]);
  assert.deepEqual(geraeteSlots({ t: "backofen", w: 60, o: "gd" }).map((s) => s.art), ["ofen60", "dampf45"]);
  assert.deepEqual(geraeteSlots({ t: "kochfeld", w: 80 }).map((s) => s.art), ["kochfeld", "abzug"]);
  assert.deepEqual(geraeteSlots({ t: "kochfeld", w: 80, o: "am" }).map((s) => s.art), ["kochfeldAbzug"]);
  assert.deepEqual(geraeteSlots({ t: "kochfeld", w: 80, o: "an" }).map((s) => s.art), ["kochfeld"]);
  assert.deepEqual(geraeteSlots({ t: "kuehlschrank", w: 60, o: "k1" }).map((s) => s.art), ["kuehl122"]);
  assert.deepEqual(geraeteSlots({ t: "sidebyside", w: 120 }).map((s) => s.w), [60, 60]);
  assert.deepEqual(geraeteSlots({ t: "unterschrank", w: 60 }), []);
});

test("Nischenprüfung: passt nur mit Katalogmaß, sonst „pruefen“; Widerspruch = passtNicht", () => {
  // Backofen 60 in 60er Nische, 90er Backofen nicht
  assert.equal(pruefeGeraet(slot({ t: "backofen", w: 60 }), { k: "backofen", b: 59.5, h: 59.6 }, PLAN).status, "passt");
  assert.equal(pruefeGeraet(slot({ t: "backofen", w: 60 }), { k: "backofen", b: 90, h: 48 }, PLAN).status, "passtNicht");
  // 55-cm-Raster (SMS): ein 60er Gerät passt nicht
  assert.equal(pruefeGeraet(slot({ t: "backofen", w: 55 }), { k: "backofen", b: 59.5, h: 59.6 }, PLAN).status, "passtNicht");
  // Kategorie falsch
  assert.equal(pruefeGeraet(slot({ t: "backofen", w: 60 }), { k: "kochfeld", b: 60 }, PLAN).status, "passtNicht");
  // Maß fehlt → nie „passt“
  assert.equal(pruefeGeraet(slot({ t: "backofen", w: 60 }), { k: "backofen", b: null, h: null }, PLAN).status, "pruefen");
  // Geschirrspüler: Nischenhöhe aus Sockel + Korpus
  const gs = slot({ t: "geschirrspueler", w: 60 });
  const niedrig = { ...PLAN, ergo: { ...PLAN.ergo, plinth: 10, carcass: 72 } }; // 82 cm
  assert.equal(pruefeGeraet(gs, { k: "geschirrspueler", b: 59.8, h: 84.5 }, niedrig).status, "passtNicht");
  assert.equal(pruefeGeraet(gs, { k: "geschirrspueler", b: 59.8, h: 80.5 }, niedrig).status, "passt");
  assert.equal(pruefeGeraet(gs, { k: "geschirrspueler", b: 59.6, nh: [[78.6, 90.2]] }, PLAN).status, "passtNicht"); // 93 außerhalb
  // Kühlnische 178 vs. 122 (Liebherr-Nischenliste)
  const lp = { k: "kuehlen", b: null, h: null, nb: [[56, 57]], nh: [[87.4, 89], [121.6, 123.6]] };
  assert.equal(pruefeGeraet(slot({ t: "kuehlschrank", w: 60, o: "k1" }), lp, PLAN).status, "passt");
  assert.equal(pruefeGeraet(slot({ t: "kuehlschrank", w: 60 }), lp, PLAN).status, "passtNicht");
  // Abzug/Armatur: kein „passt“-Versprechen
  assert.equal(pruefeGeraet(slot({ t: "kochfeld", w: 80 }, 1), { k: "dunstabzug", b: 89.8 }, PLAN).status, "frei");
});

test("Echter Katalog: jede Standardnische hat Kandidaten, das CH-Raster ehrlich keine", () => {
  for (const m of [{ t: "backofen", w: 60 }, { t: "kochfeld", w: 80 }, { t: "geschirrspueler", w: 60 }, { t: "geschirrspueler", w: 45 }, { t: "kuehlschrank", w: 60 }, { t: "spuele", w: 60 }]) {
    const k = kandidaten(slot(m), INDEX, PLAN);
    assert.ok(k.passt.length + k.frei.length > 0, `${m.t} ${m.w}`);
    for (const g of k.passt) assert.equal(pruefeGeraet(slot(m), g, PLAN).status, "passt");
  }
  const ch = kandidaten(slot({ t: "backofen", w: 55 }), INDEX, PLAN);
  assert.equal(ch.passt.length, 0);
  // Bevorzugte Marke steht vorne, sonst alphabetisch (keine Reihung nach Preis)
  const k = kandidaten(slot({ t: "geschirrspueler", w: 60 }), INDEX, PLAN, "miele");
  assert.equal(k.passt[0].m, "miele");
});

test("Preis: nur über preisAktiv, Wortlaut wie die Katalogseiten, pausierte Marken und Schalter aus → kein Preis", () => {
  const de = JSON.parse(fs.readFileSync(path.join(ROOT, "src/messages/de.json"), "utf8")).katalog.preis;
  for (const k of Object.keys(PREIS_TEXT_DE)) assert.equal(PREIS_TEXT_DE[k], de[k], k);
  const mitPreis = INDEX.filter((g) => g.p);
  assert.ok(mitPreis.length > 0);
  for (const g of INDEX) {
    const p = produkteByWelt("kuechengeraete").find((x) => x.slug === g.s);
    if (!p.preis) assert.equal(g.p, undefined, g.s); // nie erfunden
    else assert.equal(g.p?.v, p.preis.uvpAb, g.s);
  }
  const aus = buildGeraeteIndex(produkteByWelt("kuechengeraete"), { heute: HEUTE, an: false, marken });
  assert.ok(aus.every((g) => !g.p));
  const spaet = buildGeraeteIndex(produkteByWelt("kuechengeraete"), { heute: "2028-01-01", an: true, marken });
  assert.ok(spaet.every((g) => !g.p), "veraltete Preise verschwinden");
  const t = preisTexteDe({ v: 2490, st: "2026-10-31" });
  assert.match(t.kurz, /^UVP ab €\s2\.490$/u);
  assert.match(preisTexteDe({ v: 769, st: "2026-10-31", h: 1 }).lang, /^Herstellerpreis ab €\s769 inkl\. 20 % MwSt\. · Stand 31\.10\.2026/u);
  // Keine Händler-/Superlativwörter in den Planer-Texten des Moduls
  const src = fs.readFileSync(path.join(ROOT, "src/lib/kuechenplaner/geraete.js"), "utf8").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(src.replace(/\/\*[\s\S]*?\*\//g, ""), /händler|vertragshändler|beste|perfekt/i);
});

test("Teilen-Link trägt die Geräte, alte Links bleiben gültig, Unsinn wird verworfen", () => {
  const plan = defaultPlan("zeile");
  const i = plan.runs.a.findIndex((m) => m.t === "backofen");
  const slug = kandidaten(slot(plan.runs.a[i]), INDEX, plan).passt[0].s;
  const next = { ...plan, runs: { ...plan.runs, a: plan.runs.a.map((m, k) => (k === i ? withGeraet(m, 0, slug) : m)) } };
  const back = decodePlan(encodePlan(next));
  assert.deepEqual(back.runs.a[i].d, [slug]);
  assert.equal(decodePlan(encodePlan(plan)).runs.a[i].d, undefined);
  // leerer erster Steckplatz bleibt Position
  const two = withGeraet({ t: "backofen", w: 60, o: "gd" }, 1, "miele-dgc-7865");
  assert.deepEqual(two.d, ["", "miele-dgc-7865"]);
  assert.deepEqual(withGeraet(two, 1, ""), { t: "backofen", w: 60, o: "gd" });
  assert.equal(withGeraet(two, 5, "x").d, two.d, "Steckplatz außerhalb → unverändert");
  assert.equal(withGeraet({ t: "backofen", w: 60 }, 0, "<script>").d, undefined);
});

test("?geraet= von /kuechengeraete: Marke oder Produkt aus dem Katalog, sonst nichts", () => {
  assert.equal(geraetParam("miele", INDEX).typ, "marke");
  assert.equal(geraetParam("gaggenau-go-250", INDEX).typ, "produkt");
  assert.equal(geraetParam("unbekannt", INDEX), null);
  assert.equal(geraetParam("../../etc", INDEX), null);
  assert.equal(geraetParam("x".repeat(200), INDEX), null);
  // Kacheln auf /kuechengeraete verlinken Marken-IDs – alle müssen erkannt werden
  for (const id of ["gaggenau", "miele", "v-zug", "bora", "liebherr", "quooker"]) assert.equal(geraetParam(id, INDEX)?.typ, "marke", id);
  // Produkt landet in der ersten passenden Nische
  const v = geraetVorwahl(defaultPlan("l"), geraetParam("gaggenau-go-250", INDEX).g);
  assert.equal(v.ort.slot.art, "ofen60");
  assert.match(v.text, /eingeplant/);
  // Kein passendes Modul → Plan unverändert, ehrlicher Hinweis
  const leer = { ...defaultPlan("l"), runs: { a: [], b: [], c: [], i: [] } };
  const n = geraetVorwahl(leer, geraetParam("gaggenau-go-250", INDEX).g);
  assert.equal(n.ort, null);
  assert.equal(n.plan, leer);
});
