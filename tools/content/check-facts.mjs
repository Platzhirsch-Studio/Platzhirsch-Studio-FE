// tools/content/check-facts.mjs — Faktencheck (R5-content, Masterplan AP7 Nr. 4,
// Bericht 12 C10 Schritt 4): every figure (number, year, date, percentage,
// quantity, amount, time, phone number) in the public texts must be backed by
// a row of tools/content/facts.json. It reads the texts and writes nothing
// except the report you ask for with --out; with --strict it is a gate.
//
//   node tools/content/check-facts.mjs                       Bericht auf stdout
//   node tools/content/check-facts.mjs --out=<ordner>        + check-facts.md/.json
//   node tools/content/check-facts.mjs --only=messages       nur eine Quelle
//                                     (messages | ratgeber | produkte)
//   node tools/content/check-facts.mjs --strict              Release-Gate: Exit 1 bei
//                                     unbelegten Angaben in den Messages
//                                     (src/messages/*.json, alle Seiten)
//   node tools/content/check-facts.mjs --strict=all          Exit 1 bei jedem Fund
//                                     (Messages, Ratgeber, Produkttexte)
//   Release-Lauf (INT/R5-release): "check:facts": "node tools/content/check-facts.mjs --strict"
//
// Checked texts
//   src/messages/{de,en,fr,it}.json   every string value (unit = one string)
//   src/content/ratgeber/*.md         every body line (unit = one line);
//                                     lines with a review marker ("[prüfen]",
//                                     embargo terms) and internal sections at
//                                     the end never render → "ausgeblendet"
//   src/content/productCopy/*.json    meta, h1, paragraphs, faq of each entry
//                                     (unit = one string, facts in scope of
//                                     that product)
// Status per figure
//   belegt        a fact in facts.json backs it
//   inline        Ratgeber only: the same line names a source ("laut …",
//                 "(Nordkurier, 13.09.2026)", Markdown link). Not in facts.json
//                 yet; listed separately, lower priority
//   ausgeblendet  in a passage that does not render (review filter)
//   auswahl       Messages only: a selection value the visitor picks in a form
//                 (SELECTION_KEYS, e.g. the Warenwert ranges of the Dreiländer-
//                 Rechner: "5.000 bis 15.000 €"). It echoes the visitor's own
//                 choice into the enquiry and states nothing about the company
//                 (no price, no offer) – so it needs no row in facts.json. Only
//                 short labels (≤ 40 characters, no sentence) qualify; a longer
//                 text under such a key is checked as usual.
//   unbelegt      nothing backs it → finding (file:line)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkUnit, compileFacts, compileIgnore, scanJsonStrings } from "./lib.mjs";
import { hasMarker } from "../../src/lib/ratgeber/review.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

// Same opening words as src/lib/ratgeber/review.js (INTERNAL_HEADING /
// INTERNAL_PARAGRAPH): from there on the article part is internal.
const INTERNAL_START =
  /^(?:#{1,6}\s*)?(?:\*\*)?(?:redaktion\b|prüfvermerk|pruefvermerk|interne?\s+link|bildvorschl|prüfliste|pruefliste|faktencheck|lektorat|offene punkte|schema\b|todo\b|intern\b)/i;

const PRODUCT_FIELDS = (path) =>
  (path[0] === "meta" && (path[1] === "title" || path[1] === "description")) ||
  path[0] === "h1" ||
  path[0] === "paragraphs" ||
  (path[0] === "faq" && (path[2] === "question" || path[2] === "answer"));

// Runde 4 (P2 Sprache, Auftrag 5): message keys whose values are selection
// options, not statements. MultiStepForm.context.values.* are the Warenwert
// ranges of the Dreiländer-Rechner, put into the enquiry as "Warenwert {wert}
// (Richtwert)" (BeratungClient). Inventing a fact row "5.000 €" would be
// wrong (it is no price), so the gate treats them as status "auswahl".
export const SELECTION_KEYS = [/^MultiStepForm\.context\.values\.[\w-]+$/];
const isSelectionLabel = (key, text) => SELECTION_KEYS.some((re) => re.test(key)) && text.length <= 40 && !/[!?:;\n]|\.\s/.test(text);

/** Text units of one messages file. */
export function messageUnits(file, src) {
  const locale = path.basename(file, ".json");
  return scanJsonStrings(src).map((s) => {
    const key = s.path.join(".");
    const unit = { file, line: s.line, key, text: s.value, locale };
    if (isSelectionLabel(key, s.value)) unit.selection = true;
    return unit;
  });
}

/** Text units of one Ratgeber Markdown file (body only, line by line). */
export function ratgeberUnits(file, src) {
  const lines = src.split(/\r?\n/);
  const units = [];
  let i = 0;
  if (lines[0] === "---") {
    i = 1;
    while (i < lines.length && lines[i] !== "---") i++;
    i++;
  }
  let fence = false;
  let internal = false;
  let comment = false;
  for (; i < lines.length; i++) {
    const raw = lines[i];
    if (/^\s*```/.test(raw)) { fence = !fence; continue; }
    if (fence) continue;
    if (comment) {
      if (raw.includes("-->")) comment = false;
      continue;
    }
    if (raw.includes("<!--")) {
      if (!raw.includes("-->")) comment = true;
      continue;
    }
    const text = raw
      .replace(/^\s*>\s?/, "")
      .replace(/^\s*#{1,6}\s+/, "")
      .replace(/^\s*(?:[-*+]|\d+[.)])\s+/, "")
      .trim();
    if (!text) continue;
    if (INTERNAL_START.test(text)) internal = true;
    units.push({ file, line: i + 1, key: "", text, locale: "de", inlineAllowed: true, hidden: internal || hasMarker(text) });
  }
  return units;
}

/** Text units of one productCopy file (scoped to each entry's product key). */
export function productUnits(file, src) {
  const doc = JSON.parse(src);
  const locale = doc.locale || path.basename(file, ".json");
  return scanJsonStrings(src)
    .filter((s) => s.path[0] === "entries" && PRODUCT_FIELDS(s.path.slice(2)))
    .map((s) => {
      const entry = doc.entries[Number(s.path[1])];
      return {
        file,
        line: s.line,
        key: `${entry.key} ${s.path.slice(2).join(".")}`,
        text: s.value,
        locale,
        product: entry.key,
        approved: entry.approved === true,
      };
    });
}

function listFiles(dir, ext) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith(ext))
    .sort()
    .map((f) => path.join(abs, f));
}

export function collectUnits(only) {
  const units = [];
  const want = (k) => !only || only === k;
  if (want("messages"))
    for (const f of listFiles("src/messages", ".json")) units.push(...messageUnits(rel(f), fs.readFileSync(f, "utf8")));
  if (want("ratgeber"))
    for (const f of listFiles("src/content/ratgeber", ".md")) units.push(...ratgeberUnits(rel(f), fs.readFileSync(f, "utf8")));
  if (want("produkte"))
    for (const f of listFiles("src/content/productCopy", ".json")) units.push(...productUnits(rel(f), fs.readFileSync(f, "utf8")));
  return units;
}

/** Runs the check over `units`; returns { summary, files, findings }. */
export function runCheck(units, factsDoc) {
  const facts = compileFacts(factsDoc.facts);
  const ignore = compileIgnore(factsDoc.ignore);
  const findings = [];
  const files = {};
  for (const unit of units) {
    const stat = (files[unit.file] ||= { belegt: 0, inline: 0, ausgeblendet: 0, auswahl: 0, unbelegt: 0 });
    for (const r of checkUnit(unit, facts, ignore)) {
      if (r.status === "unbelegt" && unit.selection) r.status = "auswahl";
      stat[r.status]++;
      if (r.status === "belegt") continue;
      findings.push({
        file: unit.file,
        line: unit.line,
        key: unit.key,
        figure: r.raw,
        kind: r.kind,
        status: r.status,
        ...(unit.product ? { approved: unit.approved } : {}),
        text: unit.text.length > 180 ? unit.text.slice(0, 177) + "…" : unit.text,
      });
    }
  }
  const summary = Object.values(files).reduce(
    (acc, s) => {
      for (const k of Object.keys(acc)) acc[k] += s[k];
      return acc;
    },
    { belegt: 0, inline: 0, ausgeblendet: 0, auswahl: 0, unbelegt: 0 }
  );
  return { summary, files, findings };
}

const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");

/** Gate scopes of --strict: which unbelegt findings fail the run. */
export const GATE_SCOPES = {
  messages: (file) => file.startsWith("src/messages/"),
  all: () => true,
};

/**
 * Findings that fail the --strict gate. `strict` is the raw flag value:
 * true / "messages" → only src/messages/*, "all" → every source.
 * Unknown values throw, so a typo never turns the gate off.
 */
export function gateFailures(result, strict) {
  const scope = strict === true ? "messages" : String(strict);
  const inScope = GATE_SCOPES[scope];
  if (!inScope) throw new Error(`--strict=${scope}: erlaubt sind --strict, --strict=messages, --strict=all`);
  return result.findings.filter((r) => r.status === "unbelegt" && inScope(r.file));
}

export function toMarkdown(result, { facts, date }) {
  const { summary, files, findings } = result;
  const out = [];
  out.push(`# Faktencheck (tools/content/check-facts.mjs)`, "");
  out.push(`Stand: ${date} · Quellenliste: tools/content/facts.json (${facts} Fakten) · nur Bericht, keine Datei geändert.`, "");
  out.push(
    `**Summe:** ${summary.unbelegt} unbelegt · ${summary.inline} nur Inline-Beleg (Ratgeber) · ${summary.ausgeblendet} ausgeblendet · ${summary.auswahl} Auswahlwerte · ${summary.belegt} belegt`,
    ""
  );
  out.push("| Datei | unbelegt | inline | ausgeblendet | belegt |", "|---|---:|---:|---:|---:|");
  for (const [f, s] of Object.entries(files)) out.push(`| ${f} | ${s.unbelegt} | ${s.inline} | ${s.ausgeblendet} | ${s.belegt} |`);
  for (const status of ["unbelegt", "inline"]) {
    const rows = findings.filter((x) => x.status === status);
    out.push("", `## ${status === "unbelegt" ? "Unbelegt" : "Nur Inline-Beleg (in facts.json übernehmen oder prüfen)"} (${rows.length})`, "");
    if (!rows.length) {
      out.push("Keine.");
      continue;
    }
    out.push("| Datei:Zeile | Schlüssel | Angabe | Textauszug |", "|---|---|---|---|");
    for (const r of rows) out.push(`| ${r.file}:${r.line} | ${esc(r.key)}${r.approved === false ? " (Entwurf)" : ""} | ${esc(r.figure)} | ${esc(r.text)} |`);
  }
  return out.join("\n") + "\n";
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? true];
    })
  );
  const factsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/content/facts.json"), "utf8"));
  const result = runCheck(collectUnits(args.only), factsDoc);
  const md = toMarkdown(result, { facts: factsDoc.facts.length, date: new Date().toISOString().slice(0, 10) });
  if (args.out) {
    const dir = path.resolve(ROOT, String(args.out));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "check-facts.md"), md);
    fs.writeFileSync(path.join(dir, "check-facts.json"), JSON.stringify(result, null, 2) + "\n");
    console.log(`Bericht: ${rel(path.join(dir, "check-facts.md"))}`);
  }
  const s = result.summary;
  console.log(`Faktencheck: ${s.unbelegt} unbelegt · ${s.inline} inline · ${s.ausgeblendet} ausgeblendet · ${s.auswahl} Auswahlwerte · ${s.belegt} belegt`);
  for (const [f, st] of Object.entries(result.files)) console.log(`  ${f}: ${st.unbelegt} unbelegt, ${st.inline} inline, ${st.belegt} belegt`);
  if (!args.out) for (const r of result.findings.filter((x) => x.status === "unbelegt")) console.log(`${r.file}:${r.line}  ${r.figure}  ${r.key}`);
  if (args.strict) {
    const fails = gateFailures(result, args.strict);
    if (fails.length) {
      console.error(`
Faktencheck-Gate FEHLGESCHLAGEN (--strict${args.strict === true ? "" : "=" + args.strict}): ${fails.length} unbelegte Angabe(n). Belegen (facts.core.json → build-facts.mjs) oder aus dem Text entfernen:`);
      for (const r of fails) console.error(`  ${r.file}:${r.line}  ${r.figure}  ${r.key}`);
      process.exit(1);
    }
    console.log(`Faktencheck-Gate bestanden (--strict${args.strict === true ? "" : "=" + args.strict}).`);
  }
}
