// Abfrage-Kern der Mock-Datenbank: Filter wie Frappe (`=`, `!=`, `like`, `not like`,
// `in`, `not in`, `>`, `>=`, `<`, `<=`, `between`, `is set/not set`), Sortierung,
// Paging, Nummernkreise (naming_series / format: / field: / hash) und ein
// kleiner Auswerter für Workflow-Bedingungen (Python-Ausdrücke über `doc`).
// Reines Modul, testbar mit node --test.

// ---------------------------------------------------------------- Filter --

/**
 * Normalisiert Frappe-Filter in eine Liste [feld, op, wert].
 * Erlaubt: Array von Tripeln/Quadrupeln ([doctype, feld, op, wert]),
 * Objekt {feld: wert} oder {feld: [op, wert]}.
 */
export function normalisiereFilter(filters) {
  if (!filters) return [];
  if (Array.isArray(filters)) {
    return filters
      .filter(Boolean)
      .map((f) => {
        if (!Array.isArray(f)) return null;
        if (f.length === 4) return [f[1], String(f[2]).toLowerCase(), f[3]];
        if (f.length === 3) return [f[0], String(f[1]).toLowerCase(), f[2]];
        if (f.length === 2) return [f[0], "=", f[1]];
        return null;
      })
      .filter(Boolean);
  }
  if (typeof filters === "object") {
    return Object.entries(filters).map(([feld, wert]) =>
      Array.isArray(wert) && wert.length === 2 && typeof wert[0] === "string" && OPS.has(wert[0].toLowerCase())
        ? [feld, wert[0].toLowerCase(), wert[1]]
        : [feld, "=", wert]
    );
  }
  return [];
}

const OPS = new Set(["=", "!=", "like", "not like", "in", "not in", ">", ">=", "<", "<=", "between", "is", "descendants of", "ancestors of"]);

function likeZuRegex(muster) {
  const esc = String(muster).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".");
  return new RegExp(`^${esc}$`, "i");
}

function vergleichbar(a) {
  if (a === null || a === undefined) return null;
  if (typeof a === "number") return a;
  if (typeof a === "boolean") return a ? 1 : 0;
  const s = String(a);
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

export function passtFilter(doc, [feld, op, wert]) {
  const v = doc[feld];
  switch (op) {
    case "=":
      if (wert === null || wert === undefined || wert === "") return v === null || v === undefined || v === "";
      return String(v ?? "") === String(wert) || vergleichbar(v) === vergleichbar(wert);
    case "!=":
      return !(String(v ?? "") === String(wert) || vergleichbar(v) === vergleichbar(wert));
    case "like":
      return likeZuRegex(wert).test(String(v ?? ""));
    case "not like":
      return !likeZuRegex(wert).test(String(v ?? ""));
    case "in": {
      const liste = Array.isArray(wert) ? wert : String(wert).split(",").map((s) => s.trim());
      return liste.some((w) => String(w) === String(v ?? ""));
    }
    case "not in": {
      const liste = Array.isArray(wert) ? wert : String(wert).split(",").map((s) => s.trim());
      return !liste.some((w) => String(w) === String(v ?? ""));
    }
    case ">":
      return v != null && vergleichbar(v) > vergleichbar(wert);
    case ">=":
      return v != null && vergleichbar(v) >= vergleichbar(wert);
    case "<":
      return v != null && vergleichbar(v) < vergleichbar(wert);
    case "<=":
      return v != null && vergleichbar(v) <= vergleichbar(wert);
    case "between": {
      const [von, bis] = Array.isArray(wert) ? wert : [];
      if (v == null) return false;
      const x = vergleichbar(v);
      const b = bis && /^\d{4}-\d{2}-\d{2}$/.test(String(bis)) && String(v).length > 10 ? `${bis} 23:59:59` : bis;
      return (von == null || von === "" || x >= vergleichbar(von)) && (b == null || b === "" || x <= vergleichbar(b));
    }
    case "is":
      return String(wert).toLowerCase() === "set" ? v !== null && v !== undefined && v !== "" : v === null || v === undefined || v === "";
    default:
      return true;
  }
}

/** Frappe-`or_filters`: mindestens einer passt. */
export function passtAlle(doc, filters, orFilters) {
  const f = normalisiereFilter(filters);
  const o = normalisiereFilter(orFilters);
  return f.every((x) => passtFilter(doc, x)) && (o.length === 0 || o.some((x) => passtFilter(doc, x)));
}

// ------------------------------------------------------------- Sortierung --

/** "feld desc, feld2 asc" | "`tabPH X`.feld desc" → [{feld, richtung}] */
export function parseOrderBy(orderBy, fallback = "modified desc") {
  const s = String(orderBy || fallback)
    .replace(/`tab[^`]*`\./g, "")
    .trim();
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => {
      const [feld, richtung] = t.split(/\s+/);
      return { feld: feld.replace(/`/g, ""), richtung: (richtung || "asc").toLowerCase() === "desc" ? -1 : 1 };
    });
}

export function sortiere(docs, orderBy, fallback) {
  const regeln = parseOrderBy(orderBy, fallback);
  return [...docs].sort((a, b) => {
    for (const { feld, richtung } of regeln) {
      const x = vergleichbar(a[feld]);
      const y = vergleichbar(b[feld]);
      if (x === y) continue;
      if (x === null) return 1;
      if (y === null) return -1;
      return (x < y ? -1 : 1) * richtung;
    }
    return 0;
  });
}

// ------------------------------------------------------------------ Paging --

export function seite(docs, { limit = 20, start = 0 } = {}) {
  const l = Math.max(0, Number(limit) || 0);
  const s = Math.max(0, Number(start) || 0);
  if (l === 0) return docs.slice(s);
  return docs.slice(s, s + l);
}

export function waehleFelder(doc, fields) {
  if (!fields || fields.length === 0 || fields.includes("*")) return { ...doc };
  const out = {};
  for (const f of fields) {
    const clean = String(f).replace(/`tab[^`]*`\./g, "").replace(/`/g, "").split(" as ")[0].trim();
    if (clean === "*") return { ...doc };
    if (clean in doc) out[clean] = doc[clean];
  }
  if (!("name" in out) && doc.name !== undefined) out.name = doc.name;
  return out;
}

// ------------------------------------------------------------ Nummernkreise --

/**
 * Löst eine Frappe-Serie auf: "PH-ANF-.YYYY.-.#####" → "PH-ANF-2026-00001".
 * zaehler(prefix) liefert die nächste Nummer für den ausgewerteten Präfix.
 */
export function namingSeries(serie, zaehler, datum = new Date()) {
  const teile = String(serie).split(".");
  let prefix = "";
  let breite = 0;
  for (const t of teile) {
    if (/^#+$/.test(t)) {
      breite = t.length;
      continue;
    }
    prefix += ersetzeDatumsToken(t, datum);
  }
  const n = zaehler(prefix);
  return `${prefix}${String(n).padStart(breite || 5, "0")}`;
}

function ersetzeDatumsToken(t, d) {
  const p = (n) => String(n).padStart(2, "0");
  switch (t) {
    case "YYYY":
      return String(d.getFullYear());
    case "YY":
      return String(d.getFullYear()).slice(-2);
    case "MM":
      return p(d.getMonth() + 1);
    case "DD":
      return p(d.getDate());
    case "WW": {
      const start = new Date(d.getFullYear(), 0, 1);
      return p(Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7));
    }
    default:
      return t;
  }
}

/** "format:ENTW-{YYYY}-{#####}" / "format:{feld}-{##}" */
export function namingFormat(format, doc, zaehler, datum = new Date()) {
  let prefix = "";
  let breite = 0;
  const str = format.replace(/^format:/, "");
  const teile = str.split(/(\{[^}]+\})/);
  for (const t of teile) {
    if (!t) continue;
    const m = /^\{([^}]+)\}$/.exec(t);
    if (!m) {
      prefix += t;
      continue;
    }
    const token = m[1];
    if (/^#+$/.test(token)) {
      breite = token.length;
      prefix += "\u0000";
      continue;
    }
    if (["YYYY", "YY", "MM", "DD", "WW"].includes(token)) prefix += ersetzeDatumsToken(token, datum);
    else prefix += String(doc[token] ?? "");
  }
  if (!breite) return prefix;
  const n = zaehler(prefix.replace("\u0000", ""));
  return prefix.replace("\u0000", String(n).padStart(breite, "0"));
}

export function zufallsHash(laenge = 10) {
  const zeichen = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < laenge; i++) s += zeichen[Math.floor(Math.random() * zeichen.length)];
  return s;
}

/**
 * Bestimmt den Namen eines neuen Dokuments aus meta.autoname.
 * @param {object} meta  normalisierte Meta
 * @param {object} doc   Werte
 * @param {(prefix:string)=>number} zaehler
 */
export function neuerName(meta, doc, zaehler, datum = new Date()) {
  const auto = meta.autoname || "";
  if (meta.issingle) return meta.name;
  if (auto.startsWith("naming_series:") || auto === "naming_series:") {
    const feld = meta.fields.find((f) => f.fieldname === "naming_series");
    const serie = doc.naming_series || feld?.default || feld?.auswahl?.[0] || `${meta.name.replace(/\s+/g, "-").toUpperCase()}-.#####`;
    return namingSeries(serie, zaehler, datum);
  }
  if (auto.startsWith("format:")) return namingFormat(auto, doc, zaehler, datum);
  if (auto.startsWith("field:")) {
    const feld = auto.slice(6);
    return String(doc[feld] || zufallsHash());
  }
  if (auto === "hash" || auto === "" || auto === "Prompt") return zufallsHash();
  if (auto.includes(".#")) return namingSeries(auto, zaehler, datum);
  return zufallsHash();
}

// ------------------------------------------------- Workflow-Bedingungen --

/**
 * Wertet Python-Ausdrücke aus workflow.json aus, z. B.
 *   "doc.email or doc.telefon", "doc.start and doc.terminart", "doc.brutto_cent > 0",
 *   "not doc.gesperrt", "doc.status == 'Offen'", "doc.art in ('A', 'B')".
 * Unbekannte Konstrukte → wirft; der Aufrufer behandelt das als "nicht erlaubt".
 */
export function werteBedingungAus(ausdruck, doc) {
  if (!ausdruck || !String(ausdruck).trim()) return true;
  const tokens = tokenisiere(String(ausdruck));
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const expect = (v) => {
    const t = next();
    if (!t || t.v !== v) throw new Error(`Bedingung: '${v}' erwartet`);
  };

  function wahr(x) {
    if (Array.isArray(x)) return x.length > 0;
    return !(x === null || x === undefined || x === "" || x === 0 || x === false);
  }
  function orExpr() {
    let l = andExpr();
    while (peek()?.v === "or") {
      next();
      const r = andExpr();
      l = wahr(l) ? l : r;
    }
    return l;
  }
  function andExpr() {
    let l = notExpr();
    while (peek()?.v === "and") {
      next();
      const r = notExpr();
      l = wahr(l) ? r : l;
    }
    return l;
  }
  function notExpr() {
    if (peek()?.v === "not") {
      next();
      return !wahr(notExpr());
    }
    return vergleich();
  }
  function vergleich() {
    const l = primär();
    const t = peek();
    if (!t) return l;
    if (["==", "!=", ">", ">=", "<", "<="].includes(t.v)) {
      next();
      const r = primär();
      const a = vergleichbar(l);
      const b = vergleichbar(r);
      switch (t.v) {
        case "==":
          return a === b || String(l ?? "") === String(r ?? "");
        case "!=":
          return !(a === b || String(l ?? "") === String(r ?? ""));
        case ">":
          return a > b;
        case ">=":
          return a >= b;
        case "<":
          return a < b;
        case "<=":
          return a <= b;
        default:
          return false;
      }
    }
    if (t.v === "in" || (t.v === "not" && tokens[pos + 1]?.v === "in")) {
      const negiert = t.v === "not";
      next();
      if (negiert) next();
      const r = primär();
      const liste = Array.isArray(r) ? r : [r];
      const drin = liste.some((x) => String(x) === String(l ?? ""));
      return negiert ? !drin : drin;
    }
    if (t.v === "is") {
      next();
      let negiert = false;
      if (peek()?.v === "not") {
        next();
        negiert = true;
      }
      const r = primär();
      const gleich = (l ?? null) === (r ?? null);
      return negiert ? !gleich : gleich;
    }
    return l;
  }
  function primär() {
    const t = next();
    if (!t) throw new Error("Bedingung: unerwartetes Ende");
    if (t.t === "num") return Number(t.v);
    if (t.t === "str") return t.v;
    if (t.v === "(" || t.v === "[") {
      const schliesser = t.v === "(" ? ")" : "]";
      const werte = [];
      while (peek() && peek().v !== schliesser) {
        werte.push(orExpr());
        if (peek()?.v === ",") next();
      }
      expect(schliesser);
      return werte.length === 1 && t.v === "(" ? werte[0] : werte;
    }
    if (t.t === "ident") {
      if (t.v === "True") return true;
      if (t.v === "False") return false;
      if (t.v === "None") return null;
      if (t.v.startsWith("doc.")) {
        const pfad = t.v.slice(4).split(".");
        let v = doc;
        for (const p of pfad) v = v == null ? undefined : v[p];
        if (peek()?.v === "(") {
          // Methodenaufrufe wie doc.get("x") → nur get unterstützen
          next();
          const arg = primär();
          expect(")");
          if (pfad[pfad.length - 1] === "get") {
            let base = doc;
            for (const p of pfad.slice(0, -1)) base = base == null ? undefined : base[p];
            return base?.[arg];
          }
          throw new Error("Bedingung: Methodenaufruf nicht unterstützt");
        }
        return v === undefined ? null : v;
      }
      if (t.v === "len") {
        expect("(");
        const arg = orExpr();
        expect(")");
        return Array.isArray(arg) ? arg.length : String(arg ?? "").length;
      }
      if (t.v === "frappe") throw new Error("Bedingung: frappe.* nicht unterstützt");
      throw new Error(`Bedingung: unbekannter Bezeichner ${t.v}`);
    }
    throw new Error(`Bedingung: unerwartetes Zeichen ${t.v}`);
  }

  const ergebnis = orExpr();
  if (pos < tokens.length) throw new Error("Bedingung: Rest nicht ausgewertet");
  return wahr(ergebnis);
}

function tokenisiere(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      let v = "";
      while (j < s.length && s[j] !== c) v += s[j++];
      out.push({ t: "str", v });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      out.push({ t: "num", v: s.slice(i, j) });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-z0-9_.]/.test(s[j])) j++;
      out.push({ t: "ident", v: s.slice(i, j) });
      i = j;
      continue;
    }
    const zwei = s.slice(i, i + 2);
    if (["==", "!=", ">=", "<="].includes(zwei)) {
      out.push({ t: "op", v: zwei });
      i += 2;
      continue;
    }
    if ("()[],<>".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
      continue;
    }
    throw new Error(`Bedingung: Zeichen '${c}' nicht unterstützt`);
  }
  return out;
}
