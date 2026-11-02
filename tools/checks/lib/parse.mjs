// tools/checks/lib/parse.mjs
// Kleine, abhängigkeitsfreie Parser für die Prüfskripte (check-claims, check-nap).
import fs from "node:fs";
import path from "node:path";

/** Zeilennummer (1-basiert) zu einem Zeichenindex. */
export function lineAt(source, index) {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i++) if (source.charCodeAt(i) === 10) line++;
  return line;
}

function unescapeJson(raw) {
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    return raw;
  }
}

/**
 * Alle String-WERTE einer JSON-Datei mit Zeile und Schlüsselpfad.
 * Schlüssel werden übersprungen (z. B. "officialWebsite").
 * @returns {{line:number, key:string, value:string}[]}
 */
export function extractJsonStrings(source) {
  const out = [];
  const stack = []; // {type:'obj'|'arr', key, index}
  let pendingKey = null;
  let i = 0;
  const n = source.length;
  const currentPath = () =>
    stack
      .map((f) => (f.type === "arr" ? `[${f.index}]` : f.key))
      .filter((p) => p !== null && p !== undefined)
      .join(".")
      .replace(/\.\[/g, "[");
  while (i < n) {
    const ch = source[i];
    if (ch === '"') {
      let j = i + 1;
      while (j < n && source[j] !== '"') j += source[j] === "\\" ? 2 : 1;
      const raw = source.slice(i + 1, j);
      const start = i;
      i = j + 1;
      let k = i;
      while (k < n && /\s/.test(source[k])) k++;
      const top = stack[stack.length - 1];
      if (source[k] === ":" && top && top.type === "obj") {
        pendingKey = unescapeJson(raw);
        top.key = pendingKey;
      } else {
        out.push({ line: lineAt(source, start), key: currentPath(), value: unescapeJson(raw) });
      }
      continue;
    }
    if (ch === "{") stack.push({ type: "obj", key: null });
    else if (ch === "[") stack.push({ type: "arr", index: 0 });
    else if (ch === "}" || ch === "]") stack.pop();
    else if (ch === ",") {
      const top = stack[stack.length - 1];
      if (top && top.type === "arr") top.index++;
    }
    i++;
  }
  return out;
}

const REGEX_PREV = new Set(["(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "+", "-", "*", "%", "<", ">", "~", "^"]);

/**
 * String-Literale ('…', "…", `…` ohne ${}-Ausdrücke) und JSX-Text aus JS/JSX.
 * Kommentare und Regex-Literale werden übersprungen.
 * @returns {{line:number, value:string, kind:'string'|'template'|'jsx'}[]}
 */
export function extractJsStrings(source) {
  const out = [];
  const n = source.length;
  let i = 0;
  let prevSig = ""; // letztes signifikantes Zeichen bzw. Wort
  // Code ohne Strings/Kommentare, gleich lang wie source (für JSX-Text-Suche).
  const code = source.split("");
  const blank = (a, b) => {
    for (let x = a; x < b && x < n; x++) if (code[x] !== "\n") code[x] = " ";
  };
  while (i < n) {
    const ch = source[i];
    const next = source[i + 1];
    if (ch === "/" && next === "/") {
      const end = source.indexOf("\n", i);
      const stop = end === -1 ? n : end;
      blank(i, stop);
      i = stop;
      continue;
    }
    if (ch === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end + 2;
      blank(i, stop);
      i = stop;
      continue;
    }
    if (ch === "'" || ch === '"') {
      let j = i + 1;
      while (j < n && source[j] !== ch && source[j] !== "\n") j += source[j] === "\\" ? 2 : 1;
      const raw = source.slice(i + 1, j);
      out.push({ line: lineAt(source, i), value: raw.replace(/\\(.)/g, "$1"), kind: "string" });
      blank(i, j + 1);
      i = j + 1;
      prevSig = "s";
      continue;
    }
    if (ch === "`") {
      // Template: Textteile sammeln, ${…} (mit Verschachtelung) überspringen.
      let j = i + 1;
      let buf = "";
      let bufStart = j;
      while (j < n && source[j] !== "`") {
        if (source[j] === "\\") {
          buf += source[j + 1] ?? "";
          j += 2;
          continue;
        }
        if (source[j] === "$" && source[j + 1] === "{") {
          if (buf.trim()) out.push({ line: lineAt(source, bufStart), value: buf, kind: "template" });
          buf = "";
          let depth = 1;
          j += 2;
          while (j < n && depth > 0) {
            if (source[j] === "{") depth++;
            else if (source[j] === "}") depth--;
            j++;
          }
          bufStart = j;
          continue;
        }
        buf += source[j];
        j++;
      }
      if (buf.trim()) out.push({ line: lineAt(source, bufStart), value: buf, kind: "template" });
      blank(i, j + 1);
      i = j + 1;
      prevSig = "s";
      continue;
    }
    if (ch === "/" && (prevSig === "" || REGEX_PREV.has(prevSig) || prevSig === "return")) {
      // Regex-Literal
      let j = i + 1;
      let inClass = false;
      while (j < n && source[j] !== "\n") {
        if (source[j] === "\\") {
          j += 2;
          continue;
        }
        if (source[j] === "[") inClass = true;
        else if (source[j] === "]") inClass = false;
        else if (source[j] === "/" && !inClass) break;
        j++;
      }
      j++;
      while (j < n && /[a-z]/i.test(source[j])) j++;
      blank(i, j);
      i = j;
      prevSig = "s";
      continue;
    }
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < n && /[\w$]/.test(source[j])) j++;
      prevSig = source.slice(i, j) === "return" ? "return" : "w";
      i = j;
      continue;
    }
    prevSig = ch;
    i++;
  }
  // JSX-Text: Inhalt zwischen > und < im bereinigten Code, der Buchstaben enthält.
  const stripped = code.join("");
  for (const m of stripped.matchAll(/>([^<>{}]*)</g)) {
    const text = m[1].replace(/\s+/g, " ").trim();
    if (/\p{L}{3,}/u.test(text) && !/[;=]|=>|\)\s*$/.test(text)) {
      out.push({ line: lineAt(source, m.index + 1 + m[1].search(/\S/)), value: text, kind: "jsx" });
    }
  }
  return out;
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", shy: "", ndash: "–", mdash: "—", hellip: "…", laquo: "«", raquo: "»", bdquo: "„", ldquo: "“", rdquo: "”" };

export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** Sichtbarer Text aus HTML: Blöcke als Zeilen; script/style/noscript/svg/template entfernt. */
export function htmlToText(html) {
  return decodeEntities(
    String(html)
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<(?:br|\/p|\/h[1-6]|\/li|\/div|\/section|\/article|\/header|\/footer|\/button|\/a|\/span|\/td|\/th|\/dt|\/dd|\/figcaption|\/label|\/option)\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .split("\n")
    .map((l) => l.replace(/[ \t ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/** <title>, meta description, og:title/og:description, img alt aus HTML (oft claim-relevant). */
export function htmlMetaTexts(html) {
  const out = [];
  const t = String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (t) out.push({ where: "title", value: decodeEntities(t[1].trim()) });
  for (const m of String(html).matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const name = (tag.match(/\b(?:name|property)=["']([^"']+)["']/i) || [])[1];
    const content = (tag.match(/\bcontent=["']([^"']*)["']/i) || [])[1];
    if (name && content && /^(description|og:title|og:description|twitter:title|twitter:description)$/i.test(name)) {
      out.push({ where: `meta:${name}`, value: decodeEntities(content) });
    }
  }
  for (const m of String(html).matchAll(/<img\b[^>]*\balt=["']([^"']+)["']/gi)) out.push({ where: "img-alt", value: decodeEntities(m[1]) });
  return out;
}

/** <loc>-Einträge einer Sitemap, Host auf base umgeschrieben. */
export function parseSitemapLocs(xml, base = "http://localhost:3000") {
  const b = base.replace(/\/$/, "");
  return [...String(xml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => {
    try {
      const u = new URL(decodeEntities(m[1]));
      return b + u.pathname + u.search;
    } catch {
      return m[1];
    }
  });
}

/** Markenslug aus einer Markenseiten-URL (/de/ueber-uns/marken/<slug>, /en/about-us/brands/<slug> …). */
export function brandSlugFromUrl(url) {
  const m = String(url).match(/\/(?:ueber-uns\/marken|about-us\/brands|a-propos\/marques|chi-siamo\/marche)\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Allowlist laden. Format: { "entries": [ { "file": "Pfad- oder URL-Präfix" | ["…", "…"],
 *   "contains": "Textstück der Fundstelle", "id"?: "Regel-ID", "reason": "…" } ] }
 * `file` ist Pflicht (R3-release): Ein Eintrag ohne Datei-/URL-Bezug würde
 * jeden späteren echten Claim mit gleichem Wortlaut überall freigeben. Solche
 * Einträge werden nicht geladen, sondern in `invalidAllowlistEntries` gemeldet.
 */
export function loadAllowlist(file) {
  if (!file || !fs.existsSync(file)) return [];
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const entries = Array.isArray(data) ? data : data.entries ?? [];
  return entries.filter((e) => allowFiles(e).length > 0 && e.contains);
}

/** Einträge, die loadAllowlist verwirft (kein `file` oder kein `contains`). */
export function invalidAllowlistEntries(file) {
  if (!file || !fs.existsSync(file)) return [];
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const entries = Array.isArray(data) ? data : data.entries ?? [];
  return entries.filter((e) => !(allowFiles(e).length > 0 && e.contains));
}

function allowFiles(e) {
  const list = Array.isArray(e?.file) ? e.file : e?.file ? [e.file] : [];
  return list.map((p) => String(p).replace(/\\/g, "/")).filter(Boolean);
}

/** true, wenn ein Fund durch die Allowlist gedeckt ist (Datei/URL-Präfix ist Pflicht). */
export function isAllowed(finding, allowlist) {
  const where = String(finding.file ?? finding.url ?? "").replace(/\\/g, "/");
  const hay = `${finding.sentence ?? ""} ${finding.value ?? ""} ${finding.match ?? ""}`.toLowerCase();
  return allowlist.some((e) => {
    const files = allowFiles(e);
    if (!files.length || !files.some((p) => where.startsWith(p))) return false;
    if (e.id && e.id !== finding.id && e.id !== finding.type) return false;
    if (e.contains && !hay.includes(String(e.contains).toLowerCase())) return false;
    return true;
  });
}

/** Rekursive Dateiliste. */
export function walk(dir, { exts = null, skip = [] } = {}) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      const rel = p.replace(/\\/g, "/");
      if (skip.some((s) => rel.includes(s))) continue;
      if (ent.isDirectory()) stack.push(p);
      else if (!exts || exts.includes(path.extname(ent.name).toLowerCase())) out.push(p);
    }
  }
  return out.sort();
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) args[m[1]] = m[2] ?? true;
    else args._.push(a);
  }
  return args;
}
