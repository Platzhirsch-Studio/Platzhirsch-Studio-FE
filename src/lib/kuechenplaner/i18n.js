// src/lib/kuechenplaner/i18n.js – Übersetzung des Küchenplaners (DE, EN, FR, IT).
//
// Deutsch ist der Mastertext und steht weiter im Code (Logik, Tests und
// Backoffice-Texte bleiben unverändert). Die Oberfläche übersetzt erst bei der
// Anzeige: t("Deutscher Text") bzw. t("Wand {w}", { w: "A" }).
//
// Wörterbücher: src/lib/kuechenplaner/copy/{en,fr,it}.js – Schlüssel = deutscher
// Text, Wert = Übersetzung. Platzhalter in geschweiften Klammern; ihr Name
// bestimmt, was sie in einem FERTIGEN deutschen Text (z. B. einer Meldung aus
// checks.js) treffen dürfen:
//   {n…}  Zahl/Maß (Ziffern, Komma, Punkt, ×, –, +, °, %, €)
//   {w…}  Wandbuchstabe (A–H)
//   {v…}  beliebiger Text, wird NICHT übersetzt (Marken-, Gerätenamen)
//   sonst beliebiger Text, wird selbst wieder übersetzt (Modulnamen …)
// So übersetzt t() auch Texte, die die Rechenmodule fertig zusammensetzen
// (Prüfung, Stückliste, Vergleich), ohne dass dort etwas geändert wird.
//
// Der Server reicht dem Client nur die Sprache des Aufrufs als kompaktes Objekt
// (compileCopy): Schlüssel ohne Platzhalter als Hash, Vorlagen im Klartext.
// Deutsch braucht kein Wörterbuch (t = Platzhalter füllen).
//
// Rein, ohne "@/"-Importe und ohne React (node --test).

export const KP_LOCALES = Object.freeze(["de", "en", "fr", "it"]);
export const NBSP = " ";

/** FNV-1a (32 bit), Base 36 – kurzer Schlüssel für Texte ohne Platzhalter. */
export function kpHash(s) {
  let h = 0x811c9dc5;
  const str = String(s);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

const norm = (s) => String(s).replace(/ | /g, " ");
const HAS_PH = /\{[A-Za-z]\w*\}/;

/**
 * Wörterbuch → kompaktes Objekt für den Client: { l, x: { hash: Text }, p: { Vorlage: Text } }.
 * Kollidierende Hashes (sehr unwahrscheinlich) bleiben im Klartext unter p.
 */
export function compileCopy(dict, locale) {
  const x = {};
  const p = {};
  const seen = new Map();
  for (const [k0, v] of Object.entries(dict || {})) {
    const k = norm(k0);
    if (HAS_PH.test(k)) {
      p[k] = v;
      continue;
    }
    const h = kpHash(k);
    if (seen.has(h) && seen.get(h) !== k) p[k] = v;
    else {
      seen.set(h, k);
      x[h] = v;
    }
  }
  return { l: locale, x, p };
}

// ---- Zahlen: Englisch mit Dezimalpunkt und Tausenderkomma ----------------------
const NUMERIC = /^[\d\s.,×x–−\-+°%/€±≈~]*\d[\d\s.,×x–−\-+°%/€±≈~]*$/u;
const NARROW_NBSP = " ";
/**
 * Zahlen eines deutschen Texts in das Format der Sprache: „1.299,50“ → EN „1,299.50“,
 * FR „1 299,50“, IT „1.299,50“. Ein Punkt vor genau drei Ziffern gilt als
 * Tausenderpunkt, sonst (z. B. „91.5“ aus einer JS-Zahl) als Dezimalpunkt.
 */
export function localNumbers(s, locale) {
  if (locale === "de") return String(s);
  return String(s).replace(/\d+(?:[.,]\d+)+/g, (tok) => {
    const hasComma = tok.includes(",");
    const parts = tok.split(/([.,])/);
    let out = "";
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p !== "." && p !== ",") {
        out += p;
        continue;
      }
      const next = parts[i + 1] || "";
      const thousands = p === "." && (hasComma || (next.length === 3 && !/^\d{4}/.test(next)));
      if (thousands) out += locale === "en" ? "," : locale === "fr" ? NARROW_NBSP : ".";
      else out += locale === "en" ? "." : ",";
    }
    return out;
  });
}

const fill = (tpl, vars, fmt) => String(tpl).replace(/\{([A-Za-z]\w*)\}/g, (m, k) => (vars && vars[k] !== undefined && vars[k] !== null ? fmt(k, vars[k]) : m));

function phType(name) {
  if (/^n\d*$|^n[A-Z_]/.test(name)) return "n";
  if (/^w\d*$/.test(name)) return "w";
  if (/^v(\d*|[A-Z_]\w*)$/.test(name)) return "v";
  return "t";
}
const PH_RE = { n: "([\\d\\s.,×x–−\\-+°%/€±≈~]*\\d[\\d\\s.,×x–−\\-+°%/€±≈~]*?)", w: "([A-Z])", v: "(.+?)", t: "(.+?)" };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function compileTemplates(p) {
  const list = [];
  for (const [k, v] of Object.entries(p || {})) {
    if (!HAS_PH.test(k)) continue;
    const names = [];
    let re = "";
    let last = 0;
    let literal = 0;
    for (const m of k.matchAll(/\{([A-Za-z]\w*)\}/g)) {
      const lit = k.slice(last, m.index);
      literal += lit.length;
      re += esc(lit);
      const type = phType(m[1]);
      names.push([m[1], type]);
      re += PH_RE[type];
      last = m.index + m[0].length;
    }
    const tail = k.slice(last);
    literal += tail.length;
    re += esc(tail);
    // Vorlagen ohne festen Text („{a} {b}“) würden alles treffen – nur mit Variablen nutzbar.
    if (literal < 2 && !names.some(([, ty]) => ty === "n" || ty === "w")) continue;
    list.push({ key: k, re: new RegExp(`^${re}$`, "su"), names, out: v, literal });
  }
  list.sort((a, b) => b.literal - a.literal);
  return list;
}

const SEPARATORS = [" · ", "; ", " / ", ", ", " + "];

/** Teilt nur außerhalb von Klammern: „A [x, y], B“ → [„A [x, y]“, „B“]. */
function splitTop(s, sep) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(" || c === "[") depth++;
    else if ((c === ")" || c === "]") && depth > 0) depth--;
    else if (depth === 0 && s.startsWith(sep, i)) {
      out.push(s.slice(start, i));
      start = i + sep.length;
      i += sep.length - 1;
    }
  }
  out.push(s.slice(start));
  return out;
}

/**
 * Übersetzer für eine Sprache. copy = compileCopy(...) (oder null für Deutsch).
 * t(text, vars?) → übersetzter Text; unbekannte Texte bleiben deutsch.
 * t.strict(text) → Übersetzung oder null (Tests: Abdeckung prüfen).
 * t.locale, t.num(n) (Zahl im Format der Sprache).
 */
export function createKpT(copy) {
  const locale = copy?.l || "de";
  const de = locale === "de" || !copy;
  const x = copy?.x || {};
  const templates = de ? [] : compileTemplates(copy.p);
  const tplByKey = de ? {} : copy.p || {};
  const cache = new Map();
  const numOut = (s) => localNumbers(s, locale);
  // {v…} bleibt wörtlich (Namen, Daten, Links); Zahlen im Format der Sprache.
  const fmtVar = (k, v) => (phType(k) === "v" ? String(v) : typeof v === "number" ? num(v) : NUMERIC.test(String(v)) ? numOut(v) : String(v));
  const numFmt = new Intl.NumberFormat(locale === "de" ? "de-AT" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-GB", { maximumFractionDigits: 2 });
  function num(n) {
    if (typeof n !== "number") return numOut(n);
    // Schweizer Tausenderzeichen (’) nicht in Maßen: FR/IT schreiben 1200 cm, Komma als Dezimalzeichen.
    if (locale === "fr" || locale === "it") return String(Math.round(n * 100) / 100).replace(".", ",");
    return numFmt.format(n);
  }

  function lookup(s) {
    if (Object.prototype.hasOwnProperty.call(tplByKey, s)) return tplByKey[s];
    const v = x[kpHash(s)];
    return v === undefined ? null : v;
  }

  function translate(s, depth) {
    if (cache.has(s)) return cache.get(s);
    let out = lookup(s);
    if (out === null && NUMERIC.test(s)) out = numOut(s);
    if (out === null && /^[A-Z]$|^[–-]$|^$/.test(s)) out = s;
    if (out === null && depth < 6) {
      for (const tpl of templates) {
        const m = tpl.re.exec(s);
        if (!m) continue;
        const vals = {};
        let ok = true;
        tpl.names.forEach(([name, type], i) => {
          if (!ok) return;
          const raw = m[i + 1];
          if (type === "n") vals[name] = numOut(raw);
          else if (type === "w" || type === "v") vals[name] = raw;
          else {
            const tr = translate(raw, depth + 1);
            if (tr === null) ok = false;
            else vals[name] = tr;
          }
        });
        if (ok) {
          out = fill(tpl.out, vals, (_k, v) => v);
          break;
        }
      }
    }
    if (out === null && depth < 6) {
      for (const sep of SEPARATORS) {
        if (!s.includes(sep)) continue;
        const parts = splitTop(s, sep).map((p) => translate(p, depth + 1));
        if (parts.length < 2) continue;
        if (parts.every((p) => p !== null)) {
          out = parts.join(sep);
          break;
        }
      }
    }
    if (cache.size < 4000) cache.set(s, out);
    return out;
  }

  function withNbsp(src, out) {
    if (!/ /.test(src)) return out;
    return out.replace(/(\d) (?=(?:cm|mm|m²|lfm|lm|ml|×|x |%))/g, `$1${NBSP}`).replace(/× (?=\d)/g, `×${NBSP}`);
  }

  function t(text, vars) {
    if (text === null || text === undefined) return "";
    const src = String(text);
    if (de) return vars ? fill(src, vars, (_k, v) => (typeof v === "number" ? num(v) : String(v))) : src;
    const s = norm(src);
    if (vars) {
      const tpl = lookup(s);
      return fill(tpl === null ? s : tpl, vars, fmtVar);
    }
    const out = translate(s, 0);
    return out === null ? src : withNbsp(src, out);
  }
  t.strict = (text) => (de ? String(text) : translate(norm(String(text)), 0));
  t.locale = locale;
  t.num = num;
  /** Kürzel im Plan (US, EK …) bleiben in allen Sprachen gleich (Legende übersetzt sie). */
  t.short = (s) => s;
  return t;
}

/** Übersetzer ohne Wörterbuch (Deutsch). */
export const kpIdentity = createKpT(null);

/** Bekannte Sprache des Planers, sonst "de". */
export const kpLocale = (l) => (KP_LOCALES.includes(l) ? l : "de");
