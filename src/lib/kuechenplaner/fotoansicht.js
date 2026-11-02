// src/lib/kuechenplaner/fotoansicht.js – „Fotoansicht“ des Küchenplaners.
//
// 66 Visualisierungen (Path-Tracing, Blender 4.5 LTS Cycles/OptiX, AgX), gerendert am
// 01.11.2026 aus buildKitchen(defaultPlan(layout)) – gleiches Modulraster wie der Planer.
// Keine Fotos und keine KI-Bilder: Pflicht-Bildunterschrift „Visualisierung (Rendering)“
// (copy/fotoansicht.js). Dateien: public/labs/kuechenplaner/fotoansicht/ (Namen wie im
// Render-Manifest; ein Neu-Rendern tauscht nur die Datei, nicht den Code).
// Bildquellen (CC0-Assets der Szene): docs/bildquellen/QUELLEN-kuechenplaner-fotoansicht.md.
//
// Zuordnung (Vorgabe des Inhabers): Grundform (shape) und Blickwinkel (view) müssen exakt
// passen, sonst kein Bild. Danach das Bild mit der höchsten gewichteten Übereinstimmung:
// Front 4, Farbe 3, Arbeitsplatte 2, Griff 1, Griff-Farbe 0,5. Bei Gleichstand gewinnt das
// Bild mit mehr exakten Treffern, dann das erste im Manifest.
//
// Generiert aus manifest.json (Stand 2026-11-01). Rein: keine Imports, kein React –
// läuft in Server, Browser und node --test.

export const FOTO_DIR = "/labs/kuechenplaner/fotoansicht/";
export const FOTO_STAND = "2026-11-01";

/** Blickwinkel in der Reihenfolge des Umschalters; Standard = dreiviertel. */
export const FOTO_VIEWS = Object.freeze(["dreiviertel", "auge"]);
export const FOTO_VIEW_DEFAULT = "dreiviertel";

/** Plan-Feld → Schlüssel im Bild (planState.js ↔ Manifest). */
export const FOTO_KEYS = Object.freeze({ shape: "layout", finish: "front", color: "color", top: "worktop", grip: "grip", gripColor: "gripColor" });

/** Gewichte der Übereinstimmung je Plan-Feld (shape und view sind Pflicht). */
export const FOTO_WEIGHTS = Object.freeze({ finish: 4, color: 3, top: 2, grip: 1, gripColor: 0.5 });
const WEIGHTED = Object.keys(FOTO_WEIGHTS);

/** Alle 66 Bilder: file, w, h (px), options wie im Manifest. Reihenfolge = Manifest. */
export const FOTO_BILDER = Object.freeze([
  { file: "kueche-insel-fenix-grau-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "fenix", color: "grau", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-fenix-lehm-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "fenix", color: "lehm", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-fenix-schwarz-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "fenix", color: "schwarz", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-fenix-weiss-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "fenix", color: "weiss", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-glanz-polar-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "glanz", color: "polar", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-glanz-sand-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "glanz", color: "sand", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-glanz-schwarz-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "glanz", color: "schwarz", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-glanz-tiefblau-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "glanz", color: "tiefblau", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-glas-bronze-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "glas", color: "bronze", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-glas-perle-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "glas", color: "perle", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-glas-rauch-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "glas", color: "rauch", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-holz-eiche-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "holz", color: "eiche", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-holz-nuss-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "holz", color: "nuss", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-holz-raeucher-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "holz", color: "raeucher", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-keramik-basalt-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "keramik", color: "basalt", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-keramik-beton-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "keramik", color: "beton", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-keramik-calacatta-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "keramik", color: "calacatta", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-matt-graphit-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "matt", color: "graphit", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-matt-kaschmir-edelstahl-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "matt", color: "kaschmir", worktop: "edelstahl", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-matt-kaschmir-granit-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "matt", color: "kaschmir", worktop: "granit", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-matt-kaschmir-holz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "matt", color: "kaschmir", worktop: "holz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-matt-kaschmir-keramik-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "matt", color: "kaschmir", worktop: "keramik", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-matt-kaschmir-marmor-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "matt", color: "kaschmir", worktop: "marmor", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-matt-kaschmir-quarz-grifflos-alu-auge.webp", w: 1600, h: 1067, options: { layout: "insel", front: "matt", color: "kaschmir", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "auge" } },
  { file: "kueche-insel-matt-kaschmir-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "matt", color: "kaschmir", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-matt-kreide-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "matt", color: "kreide", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-matt-nacht-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "matt", color: "nacht", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-insel-matt-salbei-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "insel", front: "matt", color: "salbei", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-fenix-grau-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "fenix", color: "grau", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-fenix-lehm-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "fenix", color: "lehm", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-fenix-schwarz-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "fenix", color: "schwarz", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-fenix-weiss-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "fenix", color: "weiss", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-glanz-polar-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "glanz", color: "polar", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-glanz-sand-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "glanz", color: "sand", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-glanz-schwarz-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "glanz", color: "schwarz", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-glanz-tiefblau-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "glanz", color: "tiefblau", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-glas-bronze-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "glas", color: "bronze", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-glas-perle-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "glas", color: "perle", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-glas-rauch-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "glas", color: "rauch", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-holz-eiche-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "holz", color: "eiche", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-holz-nuss-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "holz", color: "nuss", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-holz-raeucher-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "holz", color: "raeucher", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-keramik-basalt-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "keramik", color: "basalt", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-keramik-beton-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "keramik", color: "beton", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-keramik-calacatta-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "keramik", color: "calacatta", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-matt-graphit-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "matt", color: "graphit", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-matt-kaschmir-edelstahl-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "matt", color: "kaschmir", worktop: "edelstahl", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-matt-kaschmir-granit-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "matt", color: "kaschmir", worktop: "granit", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-matt-kaschmir-holz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "matt", color: "kaschmir", worktop: "holz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-matt-kaschmir-keramik-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "matt", color: "kaschmir", worktop: "keramik", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-matt-kaschmir-marmor-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "matt", color: "kaschmir", worktop: "marmor", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-matt-kaschmir-quarz-grifflos-alu-auge.webp", w: 1600, h: 1067, options: { layout: "l", front: "matt", color: "kaschmir", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "auge" } },
  { file: "kueche-l-matt-kaschmir-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "matt", color: "kaschmir", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-matt-kreide-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "matt", color: "kreide", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-matt-nacht-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "matt", color: "nacht", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-l-matt-salbei-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "l", front: "matt", color: "salbei", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-u-matt-kaschmir-quarz-grifflos-alu-auge.webp", w: 1600, h: 1067, options: { layout: "u", front: "matt", color: "kaschmir", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "auge" } },
  { file: "kueche-u-matt-kaschmir-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "u", front: "matt", color: "kaschmir", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-zeile-fenix-schwarz-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "zeile", front: "fenix", color: "schwarz", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-zeile-glanz-polar-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "zeile", front: "glanz", color: "polar", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-zeile-holz-eiche-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "zeile", front: "holz", color: "eiche", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-zeile-keramik-beton-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "zeile", front: "keramik", color: "beton", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-zeile-matt-graphit-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "zeile", front: "matt", color: "graphit", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-zeile-matt-kaschmir-quarz-grifflos-alu-auge.webp", w: 1600, h: 1067, options: { layout: "zeile", front: "matt", color: "kaschmir", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "auge" } },
  { file: "kueche-zeile-matt-kaschmir-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "zeile", front: "matt", color: "kaschmir", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
  { file: "kueche-zeile-matt-kreide-quarz-grifflos-alu-dreiviertel.webp", w: 1600, h: 1067, options: { layout: "zeile", front: "matt", color: "kreide", worktop: "quarz", grip: "grifflos", gripColor: "alu", view: "dreiviertel" } },
]);

/** Pfad unter public/ für next/image. */
export const fotoSrc = (bild) => `${FOTO_DIR}${bild.file}`;

/** Grundformen, für die es Bilder gibt (Reihenfolge des ersten Vorkommens). */
export function fotoShapes() {
  const out = [];
  for (const b of FOTO_BILDER) if (!out.includes(b.options.layout)) out.push(b.options.layout);
  return out;
}

/** Gibt es für diese Grundform mindestens ein Bild? */
export const hatFotoansicht = (shape) => FOTO_BILDER.some((b) => b.options.layout === shape);

/** Blickwinkel, für die es bei dieser Grundform Bilder gibt (in FOTO_VIEWS-Reihenfolge). */
export function fotoViewsFuer(shape) {
  return FOTO_VIEWS.filter((v) => FOTO_BILDER.some((b) => b.options.layout === shape && b.options.view === v));
}

/**
 * Passendstes Bild zum Plan.
 * @param {object} plan  Plan (planState.js): shape, finish, color, top, grip, gripColor
 * @param {string} view  "dreiviertel" | "auge"
 * @returns {null | { bild, score, treffer, exakt, abweichungen: Array<{ key, plan, bild }> }}
 *   abweichungen: Plan-Felder, die das Bild anders zeigt (Reihenfolge der Gewichte).
 */
export function waehleFotoansicht(plan, view = FOTO_VIEW_DEFAULT) {
  if (!plan || !plan.shape) return null;
  let best = null;
  for (let i = 0; i < FOTO_BILDER.length; i++) {
    const b = FOTO_BILDER[i];
    const o = b.options;
    if (o.layout !== plan.shape || o.view !== view) continue;
    let score = 0;
    let treffer = 0;
    for (const k of WEIGHTED) {
      if (o[FOTO_KEYS[k]] === plan[k]) {
        score += FOTO_WEIGHTS[k];
        treffer++;
      }
    }
    if (!best || score > best.score || (score === best.score && treffer > best.treffer)) best = { bild: b, score, treffer };
  }
  if (!best) return null;
  const abweichungen = WEIGHTED.filter((k) => best.bild.options[FOTO_KEYS[k]] !== plan[k]).map((k) => ({ key: k, plan: plan[k], bild: best.bild.options[FOTO_KEYS[k]] }));
  return { ...best, exakt: abweichungen.length === 0, abweichungen };
}

/** Dateien, die eine bestimmte Front (finish) zeigen – z. B. für ein Neu-Rendern. */
export const fotoDateienMitFront = (front) => FOTO_BILDER.filter((b) => b.options.front === front).map((b) => b.file);
