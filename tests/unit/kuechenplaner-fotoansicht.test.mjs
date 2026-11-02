// Küchenplaner „Fotoansicht“ (02.11.2026): 66 Renderings → passendstes Bild zum Plan.
// Prüft Manifest-Modul (Dateien in public/, Namen, Maße), Auswahl-Logik (exakter Treffer,
// Gewichtung Front 4 / Farbe 3 / Platte 2 / Griff 1 / Griff-Farbe 0,5, Gleichstand, fehlende
// Grundform/Blickwinkel), Texte in vier Sprachen, Bildquellen-Dokumentation und Komponente.
// node --test tests/unit/kuechenplaner-fotoansicht.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FOTO_BILDER,
  FOTO_DIR,
  FOTO_KEYS,
  FOTO_VIEWS,
  FOTO_VIEW_DEFAULT,
  FOTO_WEIGHTS,
  fotoDateienMitFront,
  fotoShapes,
  fotoSrc,
  fotoViewsFuer,
  hatFotoansicht,
  waehleFotoansicht,
} from "../../src/lib/kuechenplaner/fotoansicht.js";
import { FOTO_ROWS } from "../../src/lib/kuechenplaner/copy/fotoansicht.js";
import { KP_ROWS, kpClientCopy, kpServerT } from "../../src/lib/kuechenplaner/copy/index.js";
import { createKpT } from "../../src/lib/kuechenplaner/i18n.js";
import { defaultPlan } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { FRONT_COLORS, FRONT_FINISHES, GRIPS, GRIP_COLORS, SHAPES, WORKTOPS } from "../../src/components/Labs/Kuechenplaner/catalog.js";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const plan = (shape, patch = {}) => ({ ...defaultPlan(shape), ...patch });

test("Manifest: 66 Bilder, 4 Grundformen, alle Dateien unter public/, Namen und Maße stimmen", () => {
  assert.equal(FOTO_BILDER.length, 66);
  assert.deepEqual(fotoShapes(), ["insel", "l", "u", "zeile"]);
  assert.equal(new Set(FOTO_BILDER.map((b) => b.file)).size, 66);
  for (const b of FOTO_BILDER) {
    const o = b.options;
    assert.equal(b.file, `kueche-${o.layout}-${o.front}-${o.color}-${o.worktop}-${o.grip}-${o.gripColor}-${o.view}.webp`);
    assert.equal(b.w, 1600);
    assert.equal(b.h, 1067);
    assert.ok(FOTO_VIEWS.includes(o.view), b.file);
    // Optionen sind gültige Katalogwerte (Front/Farbe-Kombination wie im Planer)
    assert.ok(SHAPES[o.layout], b.file);
    assert.ok(FRONT_FINISHES[o.front] && FRONT_COLORS[o.front][o.color], b.file);
    assert.ok(WORKTOPS[o.worktop] && GRIPS[o.grip] && GRIP_COLORS[o.gripColor], b.file);
    const file = path.join(ROOT, "public", fotoSrc(b));
    assert.ok(fs.existsSync(file), `${b.file} fehlt in public${FOTO_DIR}`);
    assert.ok(fs.statSync(file).size <= 400 * 1024, `${b.file} > 400 KB`);
  }
  // Keine fremden Dateien im Ordner (jede Datei ist dokumentiert)
  const dir = fs.readdirSync(path.join(ROOT, "public", FOTO_DIR));
  assert.deepEqual(dir.sort(), FOTO_BILDER.map((b) => b.file).sort());
  for (const s of fotoShapes()) assert.deepEqual(fotoViewsFuer(s), ["dreiviertel", "auge"], s);
});

test("Exakter Treffer: Standardplan je Grundform → Kaschmir matt / Quarz, ohne Abweichung", () => {
  for (const s of ["insel", "l", "u", "zeile"]) {
    for (const v of FOTO_VIEWS) {
      const r = waehleFotoansicht(plan(s), v);
      assert.equal(r.bild.file, `kueche-${s}-matt-kaschmir-quarz-grifflos-alu-${v}.webp`);
      assert.equal(r.exakt, true);
      assert.deepEqual(r.abweichungen, []);
      assert.equal(r.score, 10.5);
      assert.equal(r.treffer, 5);
    }
  }
  assert.equal(FOTO_VIEW_DEFAULT, "dreiviertel");
  assert.equal(waehleFotoansicht(plan("insel")).bild.options.view, "dreiviertel");
  const r = waehleFotoansicht(plan("insel", { finish: "fenix", color: "grau" }));
  assert.equal(r.bild.file, "kueche-insel-fenix-grau-quarz-grifflos-alu-dreiviertel.webp");
  assert.equal(r.exakt, true);
});

test("Gewichtung: Front (4) schlägt Farbe (3), Front + Farbe (7) schlägt Platte (2)", () => {
  assert.deepEqual(FOTO_WEIGHTS, { finish: 4, color: 3, top: 2, grip: 1, gripColor: 0.5 });
  // Zeile: Glanz Schwarz gibt es nicht – Glanz Polar (Front) vor Fenix Schwarz (Farbe)
  const a = waehleFotoansicht(plan("zeile", { finish: "glanz", color: "schwarz" }));
  assert.equal(a.bild.file, "kueche-zeile-glanz-polar-quarz-grifflos-alu-dreiviertel.webp");
  assert.equal(a.score, 7.5);
  assert.deepEqual(a.abweichungen, [{ key: "color", plan: "schwarz", bild: "polar" }]);
  // Insel: Keramik Beton hell mit Keramikplatte → Front+Farbe (Quarzplatte) vor Kaschmir/Keramikplatte
  const b = waehleFotoansicht(plan("insel", { finish: "keramik", color: "beton", top: "keramik", grip: "push", gripColor: "schwarz" }));
  assert.equal(b.bild.file, "kueche-insel-keramik-beton-quarz-grifflos-alu-dreiviertel.webp");
  assert.equal(b.score, 7);
  assert.deepEqual(
    b.abweichungen.map((x) => x.key),
    ["top", "grip", "gripColor"],
  );
  // Platte zählt: Kaschmir matt mit Holzplatte → Holzplatten-Bild (9) statt Quarz (8,5)
  const c = waehleFotoansicht(plan("l", { top: "holz", grip: "leiste" }));
  assert.equal(c.bild.file, "kueche-l-matt-kaschmir-holz-grifflos-alu-dreiviertel.webp");
  assert.equal(c.score, 9.5);
  // Augenhöhe: nur ein Bild je Grundform – jede Kombination landet dort, Abweichungen genannt
  const d = waehleFotoansicht(plan("l", { finish: "holz", color: "nuss" }), "auge");
  assert.equal(d.bild.file, "kueche-l-matt-kaschmir-quarz-grifflos-alu-auge.webp");
  assert.deepEqual(d.abweichungen, [
    { key: "finish", plan: "holz", bild: "matt" },
    { key: "color", plan: "nuss", bild: "kaschmir" },
  ]);
});

test("Gleichstand: gleiche Punkte und Treffer → erstes Bild im Manifest; mehr Treffer gewinnen", () => {
  // Zeile mit Lackglas Perlweiß: kein Zeilen-Bild trifft Front oder Farbe, alle 3,5 Punkte / 3 Treffer
  const r = waehleFotoansicht(plan("zeile", { finish: "glas", color: "perle" }));
  assert.equal(r.score, 3.5);
  assert.equal(r.treffer, 3);
  assert.equal(r.bild.file, FOTO_BILDER.find((b) => b.options.layout === "zeile" && b.options.view === "dreiviertel").file);
  assert.equal(r.bild.file, "kueche-zeile-fenix-schwarz-quarz-grifflos-alu-dreiviertel.webp");
  // Reihenfolge der Abweichungen folgt den Gewichten
  assert.deepEqual(r.abweichungen.map((x) => x.key), ["finish", "color"]);
  // Auswahl ist deterministisch und hängt nicht von der Reihenfolge der Felder im Plan ab
  const p = plan("insel", { finish: "glas", color: "rauch", top: "marmor" });
  const q = Object.fromEntries(Object.entries(p).reverse());
  assert.equal(waehleFotoansicht(p).bild.file, waehleFotoansicht(q).bild.file);
  // Schlüssel-Abbildung Plan → Manifest
  assert.deepEqual(FOTO_KEYS, { shape: "layout", finish: "front", color: "color", top: "worktop", grip: "grip", gripColor: "gripColor" });
});

test("Ausblenden: Grundformen ohne Bild, unbekannter Blickwinkel, leerer Plan → null", () => {
  for (const s of ["zweizeilig", "halbinsel", "frei"]) {
    assert.equal(hatFotoansicht(s), false, s);
    assert.equal(waehleFotoansicht(plan(s)), null, s);
    assert.deepEqual(fotoViewsFuer(s), []);
  }
  for (const s of ["insel", "l", "u", "zeile"]) assert.equal(hatFotoansicht(s), true, s);
  assert.equal(waehleFotoansicht(plan("insel"), "draufsicht"), null);
  assert.equal(waehleFotoansicht(null), null);
  assert.equal(waehleFotoansicht({}), null);
  // Alle Grundformen des Planers sind entweder bebildert oder ausdrücklich ohne Bild
  assert.deepEqual(Object.keys(SHAPES).filter(hatFotoansicht).sort(), ["insel", "l", "u", "zeile"]);
});

test("Sprachen: Texte vierfach, Pflicht-Bildunterschrift je Sprache, nicht als KI gekennzeichnet", () => {
  assert.ok(FOTO_ROWS.length >= 12);
  assert.equal(KP_ROWS.fotoansicht, FOTO_ROWS);
  for (const r of FOTO_ROWS) {
    assert.equal(r.length, 4, r[0]);
    for (const s of r) {
      assert.ok(typeof s === "string" && s.trim(), r[0]);
      assert.doesNotMatch(s, /\bKI\b|\bAI\b|\bIA\b|künstlich|artificial|intelligen/i, `nicht als KI kennzeichnen: ${s}`);
    }
  }
  const caption = { de: "Visualisierung (Rendering)", en: "Visualisation (rendering)", fr: "Visualisation (rendu 3D)", it: "Visualizzazione (rendering)" };
  for (const [l, want] of Object.entries(caption)) {
    const t = l === "de" ? createKpT(null) : createKpT(kpClientCopy(l));
    assert.equal(t("Visualisierung (Rendering)"), want, l);
    assert.equal(kpServerT(l)("Visualisierung (Rendering)"), want, l);
    // Hinweis: annähernd + 66 Varianten, ohne Superlative
    const hint = t("Farben und Materialien sind nur annähernd dargestellt. Gezeigt wird die nächstliegende von 66 vorgerenderten Varianten – nicht zwingend genau Ihre Kombination.");
    assert.match(hint, /66/);
    assert.doesNotMatch(hint, /fotorealistisch|photorealistic|perfekt|perfect|exakt wie|exactly like/i);
    // Umschalter, Abweichung, Ausblende-Zeile und Alt-Text liefern je Sprache eigene Texte
    for (const k of ["Dreiviertel", "Augenhöhe", "Blickwinkel", "Für diese Grundform gibt es noch keine Fotoansicht.", "Fotoansicht"]) {
      assert.ok(t.strict(k), `${l}: ${k}`);
    }
    const abw = t("{vWas} {vBild} statt {vPlan}", { vWas: t("Front"), vBild: "Fenix", vPlan: "Beton hell" });
    assert.match(abw, /Fenix/);
    assert.match(abw, /Beton hell/);
    const alt = t("{vShape}, Front {vFront} {vColor}, Arbeitsplatte {vTop}, Visualisierung (Rendering)", { vShape: t("Zeile + Insel"), vFront: t("Fenix (Nanotech-Matt)"), vColor: t("Grau"), vTop: t("Quarzkomposit") });
    assert.match(alt, /Fenix/);
    assert.ok(alt.toLowerCase().endsWith(want.toLowerCase()), `${l}: ${alt}`);
    assert.doesNotMatch(alt, /\{v/);
  }
  // Französisch: geschützte Leerzeichen vor Doppelpunkt (frenchTypography)
  assert.match(kpServerT("fr")("Bild zeigt: {vList}", { vList: "x" }), /montre[  ]:/);
});

test("Bildquellen dokumentiert: QUELLEN-kuechenplaner-fotoansicht.md nennt jede Datei und jedes CC0-Asset", () => {
  const doc = read("docs/bildquellen/QUELLEN-kuechenplaner-fotoansicht.md");
  for (const b of FOTO_BILDER) assert.ok(doc.includes(`\`${b.file}\``), b.file);
  assert.match(doc, /Blender 4\.5 LTS/);
  assert.match(doc, /Cycles\/OptiX/);
  assert.match(doc, /01\.11\.2026/);
  assert.match(doc, /Keine Fotos, keine KI-Bilder/);
  for (const a of ["alps_field", "white_plaster_02", "ceramic_vase_01", "WoodFloor051", "Wood049", "Wood051", "Marble021", "Marble006", "Granite002A", "potted_plant_04", "bar_chair_round_01", "ceramic_vase_03", "wooden_cutting_board", "wooden_bowl_01", "food_apple_01", "lemon", "potted_plant_01", "Travertine005"]) {
    assert.ok(doc.includes(`\`${a}\``), a);
  }
  assert.ok((doc.match(/CC0 1\.0/g) || []).length >= 18);
  assert.match(doc, /polyhaven\.com\/a\/alps_field/);
  assert.match(doc, /ambientcg\.com\/view\?id=WoodFloor051/);
  // Ordner-README verweist auf die Dokumentation
  assert.match(read("public/labs/kuechenplaner/README.md"), /QUELLEN-kuechenplaner-fotoansicht\.md/);
});

test("Neu-Rendern ohne Codeänderung: betroffene Dateien (Front Beton hell, Platte Keramik) sind benannt", () => {
  // Front „Beton hell“ = finish keramik + color beton; Arbeitsplatte Keramik = worktop keramik (gleiche Textur)
  const beton = FOTO_BILDER.filter((b) => b.options.front === "keramik" && b.options.color === "beton").map((b) => b.file);
  const platte = FOTO_BILDER.filter((b) => b.options.worktop === "keramik").map((b) => b.file);
  assert.deepEqual(beton, [
    "kueche-insel-keramik-beton-quarz-grifflos-alu-dreiviertel.webp",
    "kueche-l-keramik-beton-quarz-grifflos-alu-dreiviertel.webp",
    "kueche-zeile-keramik-beton-quarz-grifflos-alu-dreiviertel.webp",
  ]);
  assert.deepEqual(platte, ["kueche-insel-matt-kaschmir-keramik-grifflos-alu-dreiviertel.webp", "kueche-l-matt-kaschmir-keramik-grifflos-alu-dreiviertel.webp"]);
  assert.equal(fotoDateienMitFront("keramik").length, 7);
  const doc = read("docs/bildquellen/QUELLEN-kuechenplaner-fotoansicht.md");
  for (const f of [...beton, ...platte]) assert.ok(doc.includes(`\`${f}\``), f);
  // Der Code kennt keine Dateiinhalte – nur Namen aus dem Manifest (Tausch = Datei ersetzen)
  const lib = read("src/lib/kuechenplaner/fotoansicht.js");
  assert.doesNotMatch(lib, /data:image|base64/);
});

test("Komponente: next/image mit Manifest-Maßen, 3:2-Platzhalter, aria-pressed, 44 px, Druck ausgeblendet", () => {
  const src = read("src/components/Labs/Kuechenplaner/Fotoansicht.js");
  assert.match(src, /from "next\/image"/);
  assert.doesNotMatch(src, /<img\b/);
  assert.match(src, /width=\{w\}/);
  assert.match(src, /height=\{h\}/);
  assert.match(src, /sizes=\{SIZES\}/);
  assert.doesNotMatch(src, /priority/);
  assert.match(src, /aspect-\[3\/2\]/);
  assert.match(src, /aria-pressed=\{aktiv === v\}/);
  assert.match(src, /min-h-11 min-w-11/);
  assert.match(src, /print:hidden/);
  assert.match(src, /data-kp-foto-none/);
  assert.match(src, /MAX_ABWEICHUNGEN = 3/);
  assert.doesNotMatch(src, /onMouseEnter|onMouseOver|hover:(?!border)/);
  // Eingebunden im Reiter Material, nicht in der Druckansicht
  assert.match(read("src/components/Labs/Kuechenplaner/KuechenplanerApp.js"), /<Fotoansicht plan=\{plan\} \/>/);
  assert.doesNotMatch(read("src/app/[locale]/kuechenplaner/druck/page.js"), /Fotoansicht|fotoansicht/);
});
