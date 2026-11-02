// Rat 9,5 T3 – Bildsprache (A6, A7, B7, C7): nur freigegebene Bilder neu
// eingesetzt, Studio-Grafiken ehrlich beschriftet, keine Bilder in den
// Grafiken, Stadtseiten mit Ortskoordinaten, Fallstudien-Slots leer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { heroImage, imageOverrides } from "../../src/components/Landing/imagery.js";
import { SCHEMA_TEXT, schemaText } from "../../src/components/Landing/schema/text.js";
import { YACHT_REFERENCES, visibleYachtReferences } from "../../src/lib/yacht/references.js";
import { NAVETTA_IMAGES, NAVETTA_RELEASED } from "../../src/lib/yacht/navetta.js";

const read = (f) => readFileSync(new URL(`../../${f}`, import.meta.url), "utf8");
const rows = read("Marktresearch/recht/bildrechte.csv").split(/\r?\n/);
const released = (path) => rows.some((r) => r.includes(`;${path};`) && /;erteilt/.test(r));

test("A6 Bregenz: Intro = freigegebenes aboutHome.jpg (im Register erteilt), Hero bleibt typografisch", () => {
  const o = imageOverrides("/designermoebel-bregenz");
  assert.equal(o.intro.src, "/Images/Home/aboutHome.jpg");
  assert.ok(o.intro.width > 0 && o.intro.height > 0, "eigenes Seitenverhältnis, kein Zuschnitt");
  assert.ok(released(o.intro.src), "bildrechte.csv: erteilt");
  assert.equal(heroImage("/designermoebel-bregenz", "/x.jpg", "x").show, false);
});

test("A6 Yacht: Hero-Foto ist ein freigegebenes Navetta-Bild, unverändert (contain) mit Credit und Hinweis", () => {
  assert.equal(NAVETTA_RELEASED, true);
  const page = read("src/components/Yacht/YachtPage.js");
  const file = page.match(/HERO_NAVETTA_FILE = "([^"]+)"/)[1];
  assert.ok(NAVETTA_IMAGES.some((i) => i.file === file));
  assert.ok(released(`/labs/yacht/minotti-navetta42/${file}`), "bildrechte.csv: erteilt");
  const hero = read("src/components/Yacht/YachtHero.js");
  const photo = hero.slice(hero.indexOf("function PhotoHero"));
  assert.match(photo, /className="object-contain"/);
  assert.match(photo, /aspectRatio: `\$\{photo\.width\} \/ \$\{photo\.height\}`/);
  assert.match(photo, /photo\.credit/);
  assert.match(photo, /photo\.disclaimer/);
  assert.doesNotMatch(photo, /object-cover|KiLabel|data-ki-label/);
});

test("A6 Ezarri-Bilder in Outdoor und Hotel: nur aus public/ezarri, mit Quellenangabe", () => {
  const outdoor = read("src/components/Landing/Outdoor/OutdoorLanding.js");
  assert.match(outdoor, /web: "\/ezarri\/[a-z]+\/anw-/);
  assert.match(read("src/components/Landing/EzarriFigure.js"), /ezarriCredit\("bild", locale\)/);
  const hotel = read("src/components/Hotel/HotelPage.js");
  assert.match(hotel, /function SpaFigure[\s\S]*brands\.ezarriCredit/);
});

test("A7 Ezarri-Hub: kurze H1, höchstens zwei Knöpfe im Einstieg", () => {
  const page = read("src/app/[locale]/ezarri/page.js");
  assert.match(page, /de: "Ezarri-Glasmosaik für Pool und Bad"/);
  const hero = page.slice(page.indexOf('<Container as="header"'), page.indexOf("{/* 2 Weiche */}"));
  const buttons = (hero.match(/<Button\b/g) || []).length + (hero.match(/<TerminZeile\b/g) || []).length;
  assert.ok(buttons <= 2, `Knöpfe im Einstieg: ${buttons}`);
});

test("B7 Studio-Grafiken: Beschriftung „Schema des Studios“ in allen Sprachen, keine Bilder, keine Harald-Zuschreibung", () => {
  assert.equal(SCHEMA_TEXT.de.caption, "Schema des Studios");
  for (const l of ["de", "en", "fr", "it"]) assert.ok(SCHEMA_TEXT[l].caption && Object.keys(SCHEMA_TEXT[l].labels).length === 6, l);
  assert.doesNotMatch(schemaText("de", true).labels.layer, /ß/);
  // Übernahme 30.10.2026: landing.schema.* steht in src/messages; SCHEMA_TEXT bleibt
  // als hook-freie Tabelle (Server und Client), muss aber wörtlich gleich sein.
  for (const l of ["de", "en", "fr", "it"]) {
    const m = JSON.parse(read(`src/messages/${l}.json`)).landing.schema;
    assert.deepEqual({ caption: m.caption, labels: { sample: m.sample, series: m.series, layer: m.layer, triangle: m.triangle, table: m.table, board: m.board } }, SCHEMA_TEXT[l], `${l}: SCHEMA_TEXT = messages`);
  }
  for (const f of ["drawings.js", "StadtMap.js", "StudioSchema.js"]) {
    const src = read(`src/components/Landing/schema/${f}`);
    const code = src.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    assert.doesNotMatch(code, /<img|<image|<Image|next\/image/, f);
    assert.doesNotMatch(code, /Harald|Skizze|Handzeichnung/, f);
  }
  const wrapper = read("src/components/Landing/schema/StudioSchema.js");
  assert.match(wrapper, /aria-hidden="true"/);
  assert.match(wrapper, /data-schema-label/);
  assert.match(wrapper, /aspect-\[3\/1\][^"]*lg:aspect-\[4\/3\]/);
});

test("B7: jede Stadtseite mit typografischem Hero hat Ortskoordinaten für die Karte", async () => {
  const { CITY_COORDS } = await import("../../src/components/Landing/schema/StadtMap.js").catch(() => ({ CITY_COORDS: null }));
  // StadtMap importiert dreilaenderGeo (Alias @/) – ohne Bundler prüfen wir den Quelltext.
  const src = read("src/components/Landing/schema/StadtMap.js");
  for (const p of ["/designermoebel-bregenz", "/designermoebel-dornbirn", "/designermoebel-friedrichshafen", "/designermoebel-st-gallen", "/designermoebel-lindau", "/designermoebel-kempten"]) {
    assert.equal(heroImage(p, "/x.jpg", "x").show, false, p);
    assert.ok(CITY_COORDS ? CITY_COORDS[p] : src.includes(`"${p}": { name:`), p);
  }
  assert.match(read("src/components/Landing/landingPage.js"), /schemaKindFor\(path\)/);
});

test("C7 Fallstudien-Slot Yacht: leer, unvollständige Einträge nie sichtbar", () => {
  assert.equal(YACHT_REFERENCES.length, 0);
  assert.deepEqual(visibleYachtReferences("de"), []);
  assert.deepEqual(visibleYachtReferences("de", [{ id: "x", name: "Boot", ort: "Lindau", jahr: 2027, leistungen: { de: ["Polster"] } }]), []);
});

test("B1: Landing-Termin über den zentralen Helfer (Wort und Ziel zusammen, Nebenweg „Lieber schreiben“)", () => {
  const parts = read("src/components/Landing/parts.js");
  assert.match(parts, /export function landingTermin/);
  assert.match(parts, /terminHref\(locale, \{ calendar, context \}\)/);
  assert.match(parts, /terminLabel\(locale, \{ calendar \}\)/);
  assert.match(parts, /schreibenHref\(locale, \{ context \}\)/);
  for (const f of ["src/components/Landing/landingPage.js", "src/components/Hotel/HotelPage.js", "src/components/Yacht/YachtPage.js"]) {
    assert.match(read(f), /landingTermin\(/, f);
  }
});
