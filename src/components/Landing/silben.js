// src/components/Landing/silben.js – weiche Trennstellen (U+00AD) für lange
// deutsche Wörter in Überschriften (QM-Abnahme Küche/Bad/Outdoor R1, 01.11.2026).
//
// Warum: Überschriften stehen global auf `hyphens: manual` (globals.css), die
// Browser-Silbentrennung ist auf Windows/WebKit ohnehin unzuverlässig. Bei echtem
// 200-%-Zoom am Handy (CSS-Viewport ~197 px) oder Textzoom ×2 passten Wörter wie
// „Einbaugeräte“, „Ausstattungslinien“, „Gastroeinrichtung“ nicht in die Zeile:
// sie liefen über den Rand oder brachen über overflow-wrap mitten im Wort ohne
// Trennstrich („Küchens/tudio“). Ein weicher Trennstrich ist unsichtbar, solange
// das Wort passt, und erzeugt sonst einen echten Trennstrich an einer Silbengrenze.
//
// Regelwerk (bewusst klein, deterministisch, ohne Wörterbuch-Paket):
//   1. Bekannte Wortbausteine (Komposita-Fugen) und Vorsilben trennen zuerst.
//   2. Innerhalb eines Bausteins ab 9 Buchstaben: zwischen zwei Vokalkernen wandert bei einem
//      Konsonanten dieser, bei mehreren der letzte in die nächste Silbe
//      (ch/ck/sch/ph/th/qu zählen als ein Laut, Muta cum Liquida „tr/br/…“ bleibt
//      zusammen). Diphthonge (ei, au, eu, äu, ie, ai) und Doppelvokale sind ein Kern.
//   3. Mindestens 2 Buchstaben vor und 4 nach jeder Trennstelle (QM R3); Wörter unter
//      8 Buchstaben, Wörter mit Ziffern und reine Großbuchstaben (Modellcodes)
//      bleiben unberührt.
// Pure, ohne "@/"-Imports (node --test: tests/unit/optik4-kueche-bad-outdoor.test.mjs).

export const SHY = "­";

const MIN_WORD = 8;
const MIN_FRAG = 2;
const SYLLABLE_MIN = 9;
const MIN_TAIL = 4;

// Wortbausteine, vor denen eine Fuge liegt (nur innerhalb eines Worts, nie am Anfang).
// Länger zuerst, damit „einrichtung“ vor „richtung“ greift.
const PARTS = [
  "einrichtung", "ausstattung", "zuständigkeit", "wohnungen", "wohnung", "beratung", "planung",
  "geräte", "gerät", "linien", "linie", "küchen", "küche", "studio", "möbel", "zimmer", "garten",
  "staging", "wellness", "planer", "pool", "partner", "objekt", "hotel", "räume", "raum", "einbau",
  "badewanne", "wanne", "armaturen", "armatur", "bodensee", "service", "sauna", "dusche", "fragen",
  "projekt", "ausführung", "arbeitsweise", "weise", "zeichnung", "abzug", "kochfeld", "feld",
  "ferienwohnung", "chalet", "musterzimmer", "muster", "terrasse", "lounge", "sessel", "sofa",
  "steller", "stellung", "stein", "öfen", "bezeichnung",
  // QM R3: Wortfugen, die das Silbenregelwerk falsch zerlegte („Sommera-bend“, „Hands-kizze“, „Fachbe-triebe“).
  "abend", "skizze", "betriebe", "betrieb", "stücke", "stück", "grund",
  // QM R3 (Produktseiten bei Textzoom): Merkmale/Maße der Herstellerangaben.
  "aufnahme", "automatik", "anzeige", "stands", "lauf", "vermögen", "wasser", "hahn", "beleuchtung",
  "leistung", "oberfläche", "fläche", "temperatur", "steuerung", "funktion", "material",
];
// Einzelfälle, die das Regelwerk falsch zerlegen würde (Trennstellen als „-“).
const EXCEPTIONS = new Map(["Kon-stanz", "Mon-ta-ge-art", "Boden-see", "Vor-arl-berg", "Show-room", "Sommer-abend", "Hand-skizze"].map((w) => [w.replace(/-/g, "").toLowerCase(), w]));
// Vorsilben am Wortanfang (nur wenn danach ein Konsonant folgt bzw. ein Baustein).
const PREFIXES = ["aus", "ein", "vor", "zu", "ab", "an", "auf", "um", "ver", "zer", "ent", "unter", "über"];

const VOWEL_UNITS = ["äu", "eu", "ei", "ai", "au", "ie", "aa", "ee", "oo"];
const CONS_UNITS = ["sch", "ch", "ck", "ph", "th", "qu"];
const VOWELS = "aeiouyäöü";
const LIQUID_PAIRS = new Set(["tr", "br", "dr", "gr", "kr", "pr", "fr", "bl", "pl", "kl", "gl", "fl"]);

/** Zerlegt einen kleingeschriebenen Baustein in Laut-Einheiten {t, v}. */
function units(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const v = VOWEL_UNITS.find((u) => s.startsWith(u, i));
    if (v) { out.push({ t: v, v: true }); i += v.length; continue; }
    const c = CONS_UNITS.find((u) => s.startsWith(u, i));
    if (c) { out.push({ t: c, v: false }); i += c.length; continue; }
    out.push({ t: s[i], v: VOWELS.includes(s[i]) });
    i += 1;
  }
  return out;
}

/** Silbengrenzen (Indizes im Baustein) nach Regel 2. */
function syllableBreaks(seg) {
  const u = units(seg);
  const breaks = [];
  let pos = 0;
  const starts = u.map((x) => { const p = pos; pos += x.t.length; return p; });
  let lastV = -1;
  for (let k = 0; k < u.length; k++) {
    if (!u[k].v) continue;
    if (lastV >= 0) {
      const cons = k - lastV - 1; // Konsonanten-Einheiten dazwischen
      if (cons === 1) breaks.push(starts[lastV + 1]);
      else if (cons >= 2) {
        const a = u[k - 2].t;
        const b = u[k - 1].t;
        // Muta cum Liquida (Gas-tro) bleibt zusammen; „ck“ geht ganz in die nächste Silbe.
        if (a.length === 1 && b.length === 1 && LIQUID_PAIRS.has(a + b) && cons >= 2) breaks.push(starts[k - 2]);
        else breaks.push(starts[k - 1]);
      }
    }
    lastV = k;
  }
  return breaks;
}

/** Fugen (Indizes im Wort) aus Bausteinen und Vorsilben. */
function morphBreaks(low) {
  const cuts = new Set();
  for (const p of PREFIXES) {
    if (low.startsWith(p) && low.length - p.length >= 4) {
      const next = low[p.length];
      const rest = low.slice(p.length);
      // „aus|stattung“, „ein|bau“, „vor|arlberg“ – aber nicht „Ausweis“-artige
      // Fehlgriffe vor Vokalen außer bei bekannten Bausteinen.
      if (!VOWELS.includes(next) || PARTS.some((q) => rest.startsWith(q)) || p === "vor" || p === "ver") cuts.add(p.length);
      break;
    }
  }
  // QM R3: Fugen-s nach typischen Endungen („Leistungs|aufnahme“, „Sicherheits|glas“) –
  // vorher zerlegte die Silbenregel „Leis-tung-sauf-nahme“.
  for (const m of low.matchAll(/(?:ungs|heits|keits|schafts|tions|täts|lings)(?=\p{L}{4})/gu)) {
    const i = m.index + m[0].length;
    if (i >= 4) cuts.add(i);
  }
  for (const p of PARTS) {
    let from = 1;
    for (;;) {
      const i = low.indexOf(p, from);
      if (i < 0) break;
      if (i >= 3) cuts.add(i);
      from = i + 1;
    }
  }
  return [...cuts].sort((a, b) => a - b);
}

/**
 * Setzt weiche Trennstellen in ein einzelnes Wort.
 * @param {string} word
 * @returns {string}
 */
export function hyphenateWord(word) {
  if (typeof word !== "string" || word.length < MIN_WORD) return word;
  if (/\d/.test(word) || word === word.toUpperCase() || word.includes(SHY)) return word;
  const low = word.toLowerCase();
  const ex = EXCEPTIONS.get(low);
  if (ex) {
    let k = 0;
    return ex
      .split("-")
      .map((part) => {
        const o = word.slice(k, k + part.length);
        k += part.length;
        return o;
      })
      .join(SHY);
  }
  const fugen = morphBreaks(low);
  const bounds = [0, ...fugen, low.length];
  const all = new Set(fugen);
  for (let s = 0; s < bounds.length - 1; s++) {
    const a = bounds[s];
    const seg = low.slice(a, bounds[s + 1]);
    // Silbentrennung nur in langen Bausteinen (≥ 9 Buchstaben): sonst trennte der Browser
    // auch dort, wo das Wort in die nächste Zeile gepasst hätte („Desig-nerküchen“) –
    // Fugen („Designer-küchen“) haben Vorrang.
    // Ein Wort ohne Fuge (Gaggenau) trennt ab MIN_WORD nach Silben.
    if (seg.length >= (fugen.length ? SYLLABLE_MIN : MIN_WORD)) for (const b of syllableBreaks(seg)) all.add(a + b);
  }
  const cuts = [...all]
    // QM R3: hinten mindestens 4 Buchstaben („Musterwohnun-gen“ ließ „gen“ allein stehen).
    .filter((i) => i >= MIN_FRAG && word.length - i >= MIN_TAIL)
    .sort((x, y) => x - y)
    // nie zwei Trennstellen direkt nebeneinander (Einzelbuchstaben-Silbe)
    .filter((i, k, arr) => k === 0 || i - arr[k - 1] >= 2);
  if (!cuts.length) return word;
  let out = "";
  let last = 0;
  for (const i of cuts) { out += word.slice(last, i) + SHY; last = i; }
  return out + word.slice(last);
}

/**
 * Weiche Trennstellen in allen langen Wörtern eines Texts. Bindestriche,
 * Leerzeichen und Satzzeichen bleiben unverändert.
 * @param {string} text
 * @returns {string}
 */
export function softHyphenate(text) {
  if (typeof text !== "string" || !text) return text;
  return text.replace(/\p{L}+/gu, (w) => hyphenateWord(w));
}
