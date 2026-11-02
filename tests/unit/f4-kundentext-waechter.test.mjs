// tests/unit/f4-kundentext-waechter.test.mjs — Wächter über Consent- und
// Kundentexte (Fix-Runde 1, Team F4; r1-recht-inhalt P0-4 und P1-2).
// Run: node --test tests/unit/f4-kundentext-waechter.test.mjs
//
// Verboten in allem, was ein Kunde sehen kann:
//   - eckige Platzhalterklammern mit festzulegen / pruefen / prüfen / Inhaber
//     (Muster aus r1-recht-inhalt P0-4: /\[[^\]]*(festzulegen|prüfen|Inhaber)/,
//     ergänzt um „pruefen“), z. B. „180 Tage [Frist vom Inhaber festzulegen]“,
//   - „Testbetrieb“ und „vom Inhaber“ (interne Abstimmungssprache, P1-2).
// Umfang (P1-2): src/components/**, src/lib/**/copy.js, src/messages/*.json.
// Kommentare zählen nicht; JS-Array-Literale wie ["pruefen", "Prüfen"] (Schlüssel
// eines Werkzeugs) auch nicht: Die Klammer muss Text einleiten, keine Liste.
// Nicht im Umfang: src/components/LegalDrafts/** – die Anwalts-Vorschau
// (/de/preview/recht, in Produktion 404, noindex) zeigt die offenen Punkte der
// Entwürfe absichtlich in eckigen Klammern; sie ist kein Kundentext.
//
// Zwei Teile:
//   1. Pakete von F4 (Recht, Upload, Portal, Raumzwilling, KI-Assistenten,
//      Ratgeber) und die von F4 betreuten Seiten: sofort scharf.
//   2. Alle anderen Dateien im Umfang: erst scharf, wenn alle Teams ihre Funde
//      beseitigt haben. Bis dahin skip mit Fundliste (ARMED = false). Die Funde
//      werden NICHT freigestellt; scharf schalten = ARMED auf true setzen
//      (Integrator, am Ende der Fix-Runde).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

const ARMED = false;

export const PLACEHOLDER = /\[(?![\s"'`\d])[^\]"'`\n]*(festzulegen|pruefen|prüfen|Inhaber)/i;
export const WORDS = /Testbetrieb|vom Inhaber/i;

const F4_PREFIXES = [
  "src/components/Datenschutz/",
  "src/components/Impressum/",
  "src/components/Legal/",
  "src/components/Upload/",
  "src/components/Portal/",
  "src/components/Ratgeber/",
  "src/lib/upload/",
  "src/lib/portal/",
  "src/lib/raumzwilling/",
  "src/lib/legal/",
  "src/lib/agent/",
  "src/lib/ratgeber/",
  "src/app/[locale]/datenschutz/",
  "src/app/[locale]/impressum/",
  "src/app/[locale]/upload/",
  "src/app/[locale]/portal/",
  "src/app/[locale]/ki-assistenten/",
  "src/app/[locale]/ratgeber/",
];
// Customer-visible F4 files outside the P1-2 scope (consent texts, tool answers, pages).
const F4_EXTRA_GLOBS = [
  "src/lib/raumzwilling/einwilligung.js",
  "src/lib/agent/appointment.js",
  "src/lib/agent/tools.js",
  "src/lib/agent/jsonrpc.js",
  "src/lib/upload/config.js",
  "src/lib/upload/messages.js",
  "src/app/[locale]/datenschutz/page.js",
  "src/app/[locale]/impressum/page.js",
  "src/app/[locale]/upload/page.js",
  "src/app/[locale]/upload/[token]/page.js",
  "src/app/[locale]/upload/[token]/not-found.js",
  "src/app/[locale]/ki-assistenten/page.js",
  "src/app/[locale]/ki-assistenten/bestaetigen/page.js",
  "src/app/[locale]/portal/datenschutz/page.js",
];
const EXCLUDED = ["src/components/LegalDrafts/"];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|jsx|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

/**
 * Removes comments, keeps strings and JSX text. A small scanner: block
 * comments, line comments (not "://" inside URLs), strings and template
 * literals are recognised, so a "//" or "/*" inside a string survives.
 */
export function stripComments(src) {
  let out = "";
  let i = 0;
  let quote = null;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (quote) {
      out += c;
      if (c === "\\") {
        out += n ?? "";
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i += 1;
      continue;
    }
    if (c === "/" && n === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end < 0 ? src.length : end + 2;
      continue;
    }
    if (c === "/" && n === "/" && src[i - 1] !== ":") {
      const end = src.indexOf("\n", i);
      i = end < 0 ? src.length : end;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    out += c;
    i += 1;
  }
  return out;
}

/** Line hits of both patterns in one (comment-free) file. */
function scanText(file, text) {
  const hits = [];
  text.split("\n").forEach((line, i) => {
    for (const re of [PLACEHOLDER, WORDS]) {
      const m = line.match(re);
      if (m) hits.push({ file, line: i + 1, match: m[0].slice(0, 80) });
    }
  });
  return hits;
}

function jsonStrings(value, at = "", out = []) {
  if (typeof value === "string") out.push([at, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => jsonStrings(v, `${at}[${i}]`, out));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) jsonStrings(v, at ? `${at}.${k}` : k, out);
  return out;
}

function scanAll() {
  const files = [
    ...walk(path.join(ROOT, "src/components")),
    ...walk(path.join(ROOT, "src/lib")).filter((p) => path.basename(p) === "copy.js"),
    ...F4_EXTRA_GLOBS.map((p) => path.join(ROOT, p)).filter((p) => fs.existsSync(p)),
  ];
  const seen = new Set();
  const hits = [];
  for (const f of files) {
    const r = rel(f);
    if (seen.has(r) || EXCLUDED.some((x) => r.startsWith(x))) continue;
    seen.add(r);
    hits.push(...scanText(r, stripComments(fs.readFileSync(f, "utf8"))));
  }
  for (const f of fs.readdirSync(path.join(ROOT, "src/messages")).filter((n) => n.endsWith(".json"))) {
    const r = `src/messages/${f}`;
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, r), "utf8"));
    for (const [key, s] of jsonStrings(data)) {
      for (const re of [PLACEHOLDER, WORDS]) {
        const m = s.match(re);
        if (m) hits.push({ file: r, line: key, match: m[0].slice(0, 80) });
      }
    }
  }
  return hits;
}

const isF4 = (h) => F4_PREFIXES.some((p) => h.file.startsWith(p)) || F4_EXTRA_GLOBS.includes(h.file);
const fmt = (hits) => hits.map((h) => `${h.file}:${h.line} „${h.match}“`).join("\n");

test("Muster: erkennt Platzhalter und interne Wörter, keine Array-Literale", () => {
  assert.match("Speicherdauer: 180 Tage [Frist vom Inhaber festzulegen] nach Ablauf", PLACEHOLDER);
  assert.match("Preis [Preis vom Inhaber festzulegen]", PLACEHOLDER);
  assert.match("siehe [anwaltlich prüfen]", PLACEHOLDER);
  assert.match("Stand [pruefen]", PLACEHOLDER);
  assert.match("Derzeit im Testbetrieb: …", WORDS);
  assert.match("endgültiger Preis vom Inhaber", WORDS);
  assert.doesNotMatch('["pruefen", "Prüfen"]', PLACEHOLDER);
  assert.doesNotMatch('[5, "Im Raum prüfen"]', PLACEHOLDER);
  assert.doesNotMatch("Wir prüfen die Menge für Ihr Projekt.", PLACEHOLDER);
  assert.equal(stripComments('// [Frist vom Inhaber festzulegen]\nconst a = "https://x.at"; /* Testbetrieb */').includes("Inhaber"), false);
  assert.ok(stripComments('const u = "https://ris.bka.gv.at"; // x').includes("https://ris.bka.gv.at"));
});

test("F4-Pakete: kein Platzhalter, kein „Testbetrieb“, kein „vom Inhaber“ in Kundentexten", () => {
  const own = scanAll().filter(isF4);
  assert.deepEqual(own, [], `Funde in F4-Dateien:\n${fmt(own)}`);
});

test("Alle Kundentexte (src/components, src/lib/**/copy.js, src/messages)", (t) => {
  const hits = scanAll();
  if (!ARMED) {
    const foreign = hits.filter((h) => !isF4(h));
    t.diagnostic(`Funde anderer Pakete (${foreign.length}):\n${fmt(foreign)}`);
    t.skip(`noch nicht scharf: Funde in Paketen anderer Teams (${foreign.length}), Liste im Bericht von F4. Scharf schalten mit ARMED = true, wenn alle Teams fertig sind.`);
    return;
  }
  assert.deepEqual(hits, [], `Funde:\n${fmt(hits)}`);
});
