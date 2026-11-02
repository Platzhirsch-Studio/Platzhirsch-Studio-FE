// src/lib/ezarri/rechner/en.js – English display of the calculator results (Welle 2).
//
// flaechen.js and core.js build their surface labels, formulas, field errors,
// notes and tool names in German (and are covered by the Team C unit tests).
// For /en/ezarri/rechner the client maps those strings with this table instead
// of changing the arithmetic: fixed phrases first (longest first), then
// decimal commas → points ("1,5" → "1.5"). Unknown text stays as it is.
//
// Pure: no imports. Server, client and node --test.

// Longest first, so "Tiefe flach" wins over "Tiefe".
const PHRASES = [
  ["Treppe über die ganze Breite: Tritt- und Setzstufen ersetzen die verdeckte Boden- und Wandfläche, keine freien Seiten", "Steps across the full width: treads and risers replace the covered floor and wall area, no free sides"],
  ["Ø-Tiefe von Hand gesetzt: Die Längswände rechnen mit Ø, die Stirnwände mit ihrer echten Höhe (flach und tief). Ezarris Rechner nimmt Ø für alle vier Wände und kommt hier auf etwas weniger Fläche.", "Average depth set by hand: the long walls use the average, the end walls their real height (shallow and deep). Ezarri's calculator uses the average for all four walls and arrives at slightly less area here."],
  ["Runde Enden und Eckradien rechnet der Rechner als Rechteck (etwas mehr Fläche, auf der sicheren Seite).", "The calculator treats rounded ends and corner radii as a rectangle (slightly more area, on the safe side)."],
  ["Tiefe flach war größer als Tiefe tief, die Werte wurden getauscht.", "The shallow depth was greater than the deep depth; the values have been swapped."],
  ["Die durchschnittliche Tiefe liegt zwischen Tiefe flach und Tiefe tief.", "The average depth lies between the shallow and the deep depth."],
  ["Die Aussparung muss kürzer sein als die Gesamtlänge.", "The cut-out must be shorter than the total length."],
  ["Die Aussparung muss schmaler sein als die Gesamtbreite.", "The cut-out must be narrower than the total width."],
  ["Die Sitzfläche liegt tiefer als der Beckenboden.", "The seat lies lower than the pool floor."],
  ["Bitte eine Zahl eingeben, z. B. 1,5.", "Please enter a number, e.g. 1.5."],
  ["Sitz und Front ersetzen verdeckte Fläche; 2 Wangen × Sitztiefe × Höhe", "Seat and front replace covered area; 2 sides × seat depth × height"],
  ["Nische π·r²/2 + Setzstufen Σ π·rᵢ·h − Wandöffnung Breite·n·h", "Niche π·r²/2 + risers Σ π·rᵢ·h − wall opening width·n·h"],
  ["2 × Länge × Ø-Tiefe + Breite × (flach + tief)", "2 × length × avg. depth + width × (shallow + deep)"],
  ["Länge × Breite − Aussparung", "Length × width − cut-out"],
  ["π × Länge/2 × Breite/2", "π × length/2 × width/2"],
  ["π × (Durchmesser / 2)²", "π × (diameter / 2)²"],
  ["(Umfang der Ellipse nach Ramanujan)", "(perimeter of the ellipse after Ramanujan)"],
  ["2 Wangen × Auftritt × Steigung", "2 sides × tread × rise"],
  ["1 Wange × Auftritt × Steigung", "1 side × tread × rise"],
  ["Grundfläche laut Plan", "Floor area according to plan"],
  ["Umfang × Ø-Tiefe", "Perimeter × avg. depth"],
  ["Länge × Breite", "Length × width"],
  ["Länge × Abwicklung", "Length × developed width"],
  ["Boden-Wand-Kante", "Floor-wall edge"],
  ["Beckenkopf", "Pool coping"],
  ["Stufenkanten", "Step edges"],
  ["Sitzkante", "Seat edge"],
  ["Gummispachtel für Epoxidfuge", "Rubber float for epoxy grout"],
  ["Gummispachtel für Zementfuge", "Rubber float for cement grout"],
  ["Litonet (Reiniger für Epoxidfuge)", "Litonet (cleaner for epoxy grout)"],
  ["Mosaik-Verlegekübel", "Mosaic installation bucket"],
  ["Zahnspachtel 6 mm", "Notched trowel 6 mm"],
  ["Mosaikzange", "Mosaic nippers"],
  ["Trennscheibe", "Cutting disc"],
  ["Schleifscheibe", "Grinding disc"],
  ["Schwämme", "Sponges"],
  ["Filze", "Felts"],
  ["Überlaufrinne", "Overflow gutter"],
  ["Infinity-Kante", "Infinity edge"],
  ["Gerade Treppe", "Straight steps"],
  ["Römische Treppe", "Roman steps"],
  ["Ecktreppe", "Corner steps"],
  ["Sitzbank", "Bench"],
  ["Wände", "Walls"],
  ["Boden", "Floor"],
  ["Stufen", "steps"],
  ["Stufe", "step"],
  ["Ecken", "corners"],
  ["je 5 m²", "per 5 m²"],
  ["je 8 m²", "per 8 m²"],
  ["lfm", "running m"],
];

const PATTERNS = [
  [/^Bitte einen Wert zwischen (.+) und (.+) eingeben\.$/, "Please enter a value between $1 and $2."],
  [/^Bei (.+) m² Fläche ist der Umfang mindestens (.+) m \(Kreis\)\.$/, "With an area of $1 m², the perimeter is at least $2 m (circle)."],
  [/^(\d+) Stufen à (.+) m sind höher als die flache Tiefe \((.+) m\)\.$/, "$1 steps of $2 m are higher than the shallow depth ($3 m)."],
  [/^Die Treppe ist breiter als das Becken \((.+) m\)\.$/, "The steps are wider than the pool ($1 m)."],
];

/** Decimal comma → point, German thousands dot removed ("1.234,5" → "1234.5"). */
export function enZahlen(text) {
  return String(text)
    .replace(/(\d)\.(\d{3})(?=[,\s]|$)/g, "$1$2")
    .replace(/(\d),(\d)/g, "$1.$2");
}

/** German calculator text → English (null/undefined stay). */
export function rechnerEn(text) {
  if (text == null || text === "") return text;
  let s = String(text);
  for (const [re, out] of PATTERNS) {
    if (re.test(s)) {
      s = s.replace(re, out);
      return enZahlen(s);
    }
  }
  for (const [de, en] of PHRASES) s = s.split(de).join(en);
  return enZahlen(s);
}

/** Result of poolFlaechen() with English labels, formulas, errors and notes (numbers unchanged). */
export function flaechenEn(f) {
  if (!f) return f;
  return {
    ...f,
    teile: f.teile.map((t) => ({ ...t, label: rechnerEn(t.label), formel: rechnerEn(t.formel) })),
    fehler: Object.fromEntries(Object.entries(f.fehler || {}).map(([k, v]) => [k, rechnerEn(v)])),
    hinweise: (f.hinweise || []).map(rechnerEn),
    kantenFormel: { corner: rechnerEn(f.kantenFormel?.corner), cove: rechnerEn(f.kantenFormel?.cove) },
  };
}

/** Tool list of quantities() with English labels. */
export function werkzeugEn(list = []) {
  return list.map((w) => ({ ...w, label: rechnerEn(w.label), regel: w.regel ? rechnerEn(w.regel) : w.regel }));
}
