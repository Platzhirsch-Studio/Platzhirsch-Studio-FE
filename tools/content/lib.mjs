// tools/content/lib.mjs — pure helpers for tools/content/check-facts.mjs
// (R5-content, Masterplan AP7 Nr. 4 "jede Zahl im Text muss in einer Quelle
// stehen"). No file access, no dependencies: unit-tested with node --test
// (tests/unit/r5-content-facts.test.mjs).
//
// Model
//   token  = one figure found in a text: number, percentage, length, weight,
//            money amount, time, date, phone number or alphanumeric code.
//            Each token carries canonical `keys` (e.g. "p:20" for 20 %,
//            "len:2400" for 2,40 m = 2400 mm, "t:10:00", "d:2026-09-04").
//   fact   = one row of tools/content/facts.json: `values` (written like in a
//            text, parsed with the same tokenizer), `quelle` (where it is
//            documented), optional `kontext` (regexes, one must occur in the
//            same text unit) and optional `scope` (product key or file prefix).
//   match  = a token is "belegt" when a fact in scope shares one key with it.
//            A bare number ("1962") also matches a fact figure with a unit
//            ("1962" ← "Jahr 1962"), a figure with a unit only matches the
//            same unit (20 % needs a percentage fact, not "20 cm").

// --- units ---------------------------------------------------------------
// Canonical unit ids. Lengths are compared in mm, weights in g.
const UNIT_TABLE = [
  ["pct", /^(?:%|prozent|percent|per\s?cent|pour\s?cent|per\s?cento)$/i],
  ["len:1", /^(?:mm|millimeter[ns]?|millimetre[s]?|millimètres?|millimetri)$/i],
  ["len:10", /^(?:cm|zentimeter[ns]?|centimet(?:er|re)s?|centimètres?|centimetri)$/i],
  ["len:1000", /^(?:m|meter[ns]?|metres?|meters|mètres?|metri|metro)$/i],
  ["len:1000000", /^(?:km|kilometer[ns]?|kilometres?|kilomètres?|chilometri)$/i],
  ["wt:1000", /^(?:kg|kilogramm|kilograms?|kilogrammes?|chilogrammi)$/i],
  ["wt:1", /^(?:g|gramm|grams?|grammes?|grammi)$/i],
  ["eur", /^(?:€|eur|euro)$/i],
  ["chf", /^(?:chf|franken|fr\.)$/i],
  ["time", /^(?:uhr|h)$/i],
  ["u:week", /^(?:wochen?|weeks?|semaines?|settimane?)$/i],
  ["u:day", /^(?:tagen?|tage|days?|jours?|giorni|giorno)$/i],
  ["u:month", /^(?:monaten?|monate|months?|mois|mesi|mese)$/i],
  ["u:year", /^(?:jahren?|jahre|years?|ans|années?|anni|anno)$/i],
  ["u:hour", /^(?:stunden?|hours?|heures?|ore|ora)$/i],
  ["u:minute", /^(?:minuten?|min|minutes?|minuti)$/i],
  ["u:K", /^(?:k|kelvin)$/i],
  ["u:W", /^(?:w|watt)$/i],
  ["u:V", /^(?:v|volt)$/i],
  ["u:grad", /^(?:grad|°|degrees?|degrés?|gradi)$/i],
  ["u:piece", /^(?:stück|stücke|pieces?|pièces?|pezzi)$/i],
  ["u:sqm", /^(?:m²|m2|qm|quadratmeter[ns]?)$/i],
];

export function unitOf(word) {
  if (!word) return null;
  for (const [id, re] of UNIT_TABLE) if (re.test(word)) return id;
  return null;
}

const MONTHS = {
  januar: 1, jänner: 1, january: 1, janvier: 1, gennaio: 1,
  februar: 2, feber: 2, february: 2, février: 2, febbraio: 2,
  märz: 3, march: 3, mars: 3, marzo: 3,
  april: 4, avril: 4, aprile: 4,
  mai: 5, may: 5, maggio: 5,
  juni: 6, june: 6, juin: 6, giugno: 6,
  juli: 7, july: 7, juillet: 7, luglio: 7,
  august: 8, août: 8, agosto: 8,
  september: 9, septembre: 9, settembre: 9,
  oktober: 10, october: 10, octobre: 10, ottobre: 10,
  november: 11, novembre: 11,
  dezember: 12, december: 12, décembre: 12, dicembre: 12,
};
const MONTH_ALT = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join("|");

const L = "\\p{L}";
const pad = (n) => String(n).padStart(2, "0");
const fmt = (n) => String(Math.round(n * 1e6) / 1e6);

// --- cleaning ------------------------------------------------------------
/**
 * Removes parts of a text that are not statements of fact: ICU syntax
 * (plural selectors "=0", "#", placeholders "{count}"), URLs, e-mail
 * addresses, site paths and Markdown link targets. Replaced by spaces of the
 * same length so offsets stay valid.
 */
export function stripNonFacts(text) {
  const blank = (m) => " ".repeat(m.length);
  let t = String(text);
  t = t.replace(/\]\([^)\s]*\)/g, (m) => "]" + blank(m.slice(1)));
  t = t.replace(/\bhttps?:\/\/[^\s)"'<>\]]+/gi, blank);
  t = t.replace(/\bwww\.[^\s)"'<>\]]+/gi, blank);
  t = t.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, blank);
  t = t.replace(/(?<![\p{L}\p{N}])\/[a-z0-9_-]+(?:\/[\w.-]+)+/giu, blank);
  if (/\{\s*\w+\s*,\s*(?:plural|selectordinal|select)\s*,/.test(t)) {
    t = t.replace(/=\d+/g, blank).replace(/#/g, " ");
  }
  t = t.replace(/\{\s*\w+\s*\}/g, blank);
  t = t.replace(/<!--[\s\S]*?-->/g, blank);
  return t;
}

/** Blanks the spans matched by the ignore rules of facts.json. */
export function applyIgnore(text, ignoreRules = []) {
  let t = text;
  for (const rule of ignoreRules) {
    const re = rule.re || new RegExp(rule.pattern, "giu");
    t = t.replace(re, (m) => " ".repeat(m.length));
  }
  return t;
}

// --- tokenizer -----------------------------------------------------------
function numberPattern(locale) {
  // en: 1,200.50 · de/it: 1.200,50 · fr: 1 200,50 (space, nbsp, narrow nbsp)
  if (locale === "en") return String.raw`\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?`;
  if (locale === "fr") return String.raw`\d{1,3}(?:[   .]\d{3})+(?:,\d+)?|\d+(?:,\d+)?`;
  return String.raw`\d{1,3}(?:[.  '’]\d{3})+(?:,\d+)?|\d+(?:,\d+)?`;
}

export function parseNumber(raw, locale = "de") {
  let s = raw.replace(/[   '’]/g, "");
  if (locale === "en") s = s.replace(/,/g, "");
  else if (/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(",", ".");
  return Number(s);
}

// Ranges and dimension chains share the unit of the last figure:
// "10–18 Uhr", "40 bis 60 Prozent", "40×20 mm", "2 x 3 m".
const RANGE = String.raw`\s*(?:–|—|-|bis|to|à|a|al|au|×|x|und|and|et|e|oder|or|ou|o|\/)\s*`;

/**
 * All figures in `text`, in order. Each token: { raw, index, kind, value,
 * unit, keys }. `text` should already be cleaned (stripNonFacts/applyIgnore).
 */
export function extractTokens(text, locale = "de") {
  const tokens = [];
  const taken = new Array(text.length).fill(false);
  const claim = (start, end) => {
    for (let i = start; i < end; i++) if (taken[i]) return false;
    for (let i = start; i < end; i++) taken[i] = true;
    return true;
  };
  const push = (tok) => tokens.push(tok);

  // 1. Phone numbers (+43 5574 46255).
  for (const m of text.matchAll(/\+\d{2,3}(?:[\s/()-]*\d){6,}/g)) {
    if (!claim(m.index, m.index + m[0].length)) continue;
    push({ raw: m[0], index: m.index, kind: "phone", keys: [`ph:${m[0].replace(/\D/g, "")}`] });
  }
  // 2. Dates: 04.09.2026, 2026-10-26, 4. September 2026, September 4, 2026.
  const dateRes = [
    [/(?<!\d)(\d{1,2})\.(\d{1,2})\.(\d{4})(?!\d)/g, (m) => [m[3], m[2], m[1]]],
    [/(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/g, (m) => [m[1], m[2], m[3]]],
    [new RegExp(String.raw`(?<!\d)(\d{1,2})(?:\.|er)?\s+(${MONTH_ALT})\s+(\d{4})(?!\d)`, "giu"), (m) => [m[3], MONTHS[m[2].toLowerCase()], m[1]]],
    [new RegExp(String.raw`(?<![${L}])(${MONTH_ALT})\s+(\d{1,2}),?\s+(\d{4})(?!\d)`, "giu"), (m) => [m[3], MONTHS[m[1].toLowerCase()], m[2]]],
  ];
  for (const [re, parts] of dateRes) {
    for (const m of text.matchAll(re)) {
      if (!claim(m.index, m.index + m[0].length)) continue;
      const [y, mo, d] = parts(m);
      push({ raw: m[0], index: m.index, kind: "date", keys: [`d:${y}-${pad(mo)}-${pad(d)}`, `n:${Number(y)}`] });
    }
  }
  // 3. Clock times: 10 am, 6pm, 5:00 pm (en); 17h00, 10 h (fr); 10:00, 7.30 Uhr.
  for (const m of text.matchAll(/(?<![\d.,:])(\d{1,2})(?::(\d{2}))?\s?([ap])\.?m\.?(?![\p{L}])/giu)) {
    let h = Number(m[1]) % 12;
    if (m[3].toLowerCase() === "p") h += 12;
    if (!claim(m.index, m.index + m[0].length)) continue;
    push({ raw: m[0], index: m.index, kind: "time", keys: [`t:${pad(h)}:${pad(Number(m[2] || 0))}`] });
  }
  for (const m of text.matchAll(/(?<![\d.,:])(\d{1,2})\s?h\s?(\d{2})?(?![\p{L}\p{N}])/giu)) {
    if (Number(m[1]) > 24) continue;
    if (!claim(m.index, m.index + m[0].length)) continue;
    push({ raw: m[0], index: m.index, kind: "time", keys: [`t:${pad(Number(m[1]))}:${pad(Number(m[2] || 0))}`] });
  }
  for (const m of text.matchAll(/(?<![\d.,:])(\d{1,2})[:.](\d{2})(?=\s*(?:uhr|h\b|–|-|bis|$|[\s,;.)]))/giu)) {
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h > 24 || min > 59) continue;
    // "2.40 m" / "1.200" are numbers, not times: require ":" or a following "Uhr".
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 6);
    if (m[0].includes(".") && !/^\s*uhr/i.test(after)) continue;
    if (!claim(m.index, m.index + m[0].length)) continue;
    push({ raw: m[0], index: m.index, kind: "time", keys: [`t:${pad(h)}:${pad(min)}`] });
  }
  // 4. Codes: digits glued to letters (next125, 3D, E27, IP20, B2C, H.264).
  for (const m of text.matchAll(new RegExp(String.raw`(?<![\p{L}\p{N}])(?=[\p{L}\p{N}.]*\p{L})(?=[\p{L}\p{N}.]*\d)[\p{L}\p{N}]+(?:\.[\p{L}\p{N}]+)*`, "gu"))) {
    if (/^\p{L}+$/u.test(m[0])) continue;
    // "40er" or "2x" stay numbers; units glued to numbers ("70W", "2700K", "20cm") too.
    const glued = m[0].match(/^(\d+(?:[.,]\d+)?)(\p{L}+|%)$/u);
    if (glued && (unitOf(glued[2]) || /^(?:er|x|te|ten|th|st|nd|rd|e|ème|°)$/iu.test(glued[2]))) continue;
    if (!claim(m.index, m.index + m[0].length)) continue;
    push({ raw: m[0], index: m.index, kind: "code", keys: [`c:${m[0].toLowerCase()}`] });
  }
  // 5. Numbers with optional currency before and unit after.
  const num = numberPattern(locale);
  const re = new RegExp(
    String.raw`(?:(€|EUR|CHF|Fr\.)\s?)?(?<![\p{L}\p{N}.,])(${num})(?![\p{N}])(?:[\s  ]?(%|°|€|m²|[\p{L}]+\.?))?`,
    "gdu"
  );
  for (const m of text.matchAll(re)) {
    const [numStart, numEnd] = m.indices[2];
    if (taken[numStart]) continue;
    const value = parseNumber(m[2], locale);
    if (!Number.isFinite(value)) continue;
    const before = m[1] ? unitOf(m[1]) : null;
    let unitWord = m[3];
    if (unitWord && unitWord.endsWith(".") && !/^fr\.$/i.test(unitWord)) unitWord = unitWord.slice(0, -1);
    const after = unitOf(unitWord);
    const unit = before || after;
    const start = before ? m.indices[1][0] : numStart;
    const end = after ? m.indices[3][1] - (unitWord !== m[3] ? 1 : 0) : numEnd;
    claim(numStart, numEnd);
    push({ raw: text.slice(start, end), index: numStart, end: numEnd, kind: "number", value, unit });
  }

  tokens.sort((a, b) => a.index - b.index);

  // Ranges: "10–18 Uhr", "40 bis 60 Prozent", "8 to 10 weeks" → unit of the
  // second figure also applies to the first.
  for (let i = tokens.length - 2; i >= 0; i--) {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (a.kind !== "number" || b.kind !== "number" || a.unit || !b.unit) continue;
    const between = text.slice(a.end, b.index);
    if (new RegExp(`^${RANGE}$`, "iu").test(between)) a.unit = b.unit;
  }
  // A figure with a unit also offers "any:<value>": a unitless figure in the
  // source ("H 66" in a dimension list) backs "66 cm" in the text.
  for (const t of tokens) {
    if (t.kind !== "number") continue;
    t.keys = numberKeys(t.value, t.unit);
    if (t.unit) t.keys.push(`any:${fmt(t.value)}`);
  }
  return tokens;
}

function numberKeys(value, unit) {
  if (!unit) return [`n:${fmt(value)}`];
  if (unit === "pct") return [`p:${fmt(value)}`];
  if (unit === "time") return [`t:${pad(Math.trunc(value))}:${pad(Math.round((value % 1) * 100))}`];
  if (unit.startsWith("len:")) return [`len:${fmt(value * Number(unit.slice(4)))}`];
  if (unit.startsWith("wt:")) return [`wt:${fmt(value * Number(unit.slice(3)))}`];
  if (unit === "eur" || unit === "chf") return [`${unit}:${fmt(value)}`];
  return [`${unit}:${fmt(value)}`];
}

/** Keys a fact figure offers: its own key plus the bare number. */
export function factKeys(tokens, { strictUnit = false } = {}) {
  const keys = new Set();
  for (const t of tokens) {
    for (const k of t.keys) if (!k.startsWith("any:")) keys.add(k);
    if (t.kind === "number" && !t.unit) keys.add(`any:${fmt(t.value)}`);
    // strictUnit: the fact backs only figures with the same unit (a time
    // "10:00" must not back every bare "10" on the site).
    if (strictUnit) continue;
    if (t.kind === "number") keys.add(`n:${fmt(t.value)}`);
    if (t.kind === "time") {
      const [h, min] = t.keys[0].slice(2).split(":");
      if (min === "00") keys.add(`n:${Number(h)}`);
    }
  }
  return keys;
}

// --- facts ---------------------------------------------------------------
/** Compiles facts.json rows: parsed keys and kontext regexes. */
export function compileFacts(rows) {
  return rows.map((row) => {
    const locale = row.locale || "de";
    const keys = new Set();
    for (const v of row.values || []) {
      for (const k of factKeys(extractTokens(stripNonFacts(v), locale), row)) keys.add(k);
      // "E 1027" in the source backs "E1027" in the text.
      const glued = v.replace(/(?<![\p{L}])(\p{Lu}{1,3}) (\d)/gu, "$1$2");
      if (glued !== v) for (const k of factKeys(extractTokens(stripNonFacts(glued), locale), row)) keys.add(k);
    }
    for (const v of row.valuesEn || []) for (const k of factKeys(extractTokens(stripNonFacts(v), "en"), row)) keys.add(k);
    return {
      ...row,
      keys,
      kontextRe: (row.kontext || []).map((k) => new RegExp(k, "iu")),
    };
  });
}

export function compileIgnore(rows = []) {
  return rows.map((r) => ({ ...r, re: new RegExp(r.pattern, "giu") }));
}

const slugOfKey = (key) => String(key ?? "").split("/").pop();

/** Is a fact applicable to this unit of text? */
export function inScope(fact, unit) {
  const s = fact.scope;
  if (s) {
    // Products are matched by their slug: the catalogue category of a research
    // row may differ from the productCopy key (dining- vs coffee-tables).
    if (s.product && slugOfKey(s.product) !== slugOfKey(unit.product)) return false;
    if (s.files && !s.files.some((p) => unit.file.startsWith(p))) return false;
  }
  // Kontext may occur in the text or in its message key ("HomePage.house.times.sat").
  const hay = unit.key ? `${unit.key} ${unit.text}` : unit.text;
  if (fact.kontextRe.length && !fact.kontextRe.some((re) => re.test(hay))) return false;
  return true;
}

/** Facts that back `token` within `unit` ({ text, file, product? }). */
export function matchToken(token, facts, unit) {
  const hits = [];
  for (const f of facts) {
    if (!inScope(f, unit)) continue;
    if (token.keys.some((k) => f.keys.has(k))) hits.push(f.id);
  }
  return hits;
}

// --- inline citations (Ratgeber) -----------------------------------------
// A figure in a sentence that names its source in the text itself: "laut DGM",
// "(Nordkurier, 13.09.2026)", "nach Angaben von", a Markdown link, "Quelle:".
const INLINE_CITE = /\blaut\b|\bgemäß\b|\bnach angaben\b|\bzufolge\b|\bquelle\b|\bnennt\b|\bnennen\b|\bgibt\b[^.]{0,40}\ban\b|\]\(|\([^()]*(?:\d{1,2}\.\d{1,2}\.\d{4}|\b(?:19|20)\d{2}\b)[^()]*\)|\baccording to\b|\bselon\b|\bsecondo\b/iu;
export function hasInlineCitation(text) {
  return INLINE_CITE.test(text);
}

// --- JSON scanner with line numbers ---------------------------------------
/**
 * Walks a JSON document and returns every string value with its key path and
 * 1-based line: [{ path: ["Footer","address","line1"], value, line }].
 * Throws on invalid JSON (same grammar as JSON.parse, no extensions).
 */
export function scanJsonStrings(src) {
  let i = 0;
  let line = 1;
  const out = [];
  const ws = () => {
    while (i < src.length) {
      const c = src[i];
      if (c === "\n") line++;
      else if (c !== " " && c !== "\t" && c !== "\r" && c !== "﻿") break;
      i++;
    }
  };
  const str = () => {
    const start = i;
    const startLine = line;
    i++;
    while (i < src.length && src[i] !== '"') {
      if (src[i] === "\\") i++;
      i++;
    }
    i++;
    return { value: JSON.parse(src.slice(start, i)), line: startLine };
  };
  const value = (path) => {
    ws();
    const c = src[i];
    if (c === "{") {
      i++;
      ws();
      if (src[i] === "}") return i++;
      for (;;) {
        ws();
        const key = str().value;
        ws();
        if (src[i++] !== ":") throw new SyntaxError(`JSON: ":" erwartet in Zeile ${line}`);
        value([...path, key]);
        ws();
        if (src[i] === ",") { i++; continue; }
        if (src[i] === "}") { i++; return; }
        throw new SyntaxError(`JSON: "," oder "}" erwartet in Zeile ${line}`);
      }
    }
    if (c === "[") {
      i++;
      ws();
      if (src[i] === "]") return i++;
      for (let n = 0; ; n++) {
        value([...path, String(n)]);
        ws();
        if (src[i] === ",") { i++; continue; }
        if (src[i] === "]") { i++; return; }
        throw new SyntaxError(`JSON: "," oder "]" erwartet in Zeile ${line}`);
      }
    }
    if (c === '"') {
      const s = str();
      out.push({ path, value: s.value, line: s.line });
      return;
    }
    const m = /^(?:-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/.exec(src.slice(i, i + 40));
    if (!m) throw new SyntaxError(`JSON: unerwartetes Zeichen in Zeile ${line}`);
    i += m[0].length;
  };
  value([]);
  return out;
}

// --- checking one unit -----------------------------------------------------
/**
 * Checks one text unit. Returns a finding per figure:
 * { raw, kind, keys, status: "belegt"|"inline"|"unbelegt", facts: [ids] }.
 * `unit`: { text, file, line, locale, product?, inlineAllowed?, hidden? }.
 */
export function checkUnit(unit, facts, ignore) {
  const cleaned = applyIgnore(stripNonFacts(unit.text), ignore);
  const tokens = extractTokens(cleaned, unit.locale);
  return tokens.map((t) => {
    const ids = matchToken(t, facts, unit);
    let status = ids.length ? "belegt" : "unbelegt";
    if (status === "unbelegt" && unit.hidden) status = "ausgeblendet";
    else if (status === "unbelegt" && unit.inlineAllowed && hasInlineCitation(unit.text)) status = "inline";
    return { raw: t.raw, kind: t.kind, keys: t.keys, status, facts: ids };
  });
}
