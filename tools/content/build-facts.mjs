// tools/content/build-facts.mjs — builds tools/content/facts.json, the source
// list of tools/content/check-facts.mjs (R5-content, Masterplan AP7 Nr. 4).
//
//   node tools/content/build-facts.mjs           write facts.json
//   node tools/content/build-facts.mjs --check   exit 1 if facts.json is stale
//
// Inputs (read only):
//   tools/content/facts.core.json          hand-kept base facts, each with Quelle
//   Marktresearch/content/produkte/*.json  researched product facts ("fakten",
//                                          each with its manufacturer URL)
// Every row in facts.json carries `quelle` (where the figure is documented)
// and `beleg` (the Marktresearch file it was taken from).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CORE = "tools/content/facts.core.json";
const RESEARCH_DIR = "Marktresearch/content/produkte";
export const FACTS_FILE = "tools/content/facts.json";

/** Product key "category/product" from a research row's catalogue URL. */
export function productKeyFromUrl(url) {
  const m = /\/produkte\/([^/?#]+)\/([^/?#]+)/.exec(String(url || ""));
  return m ? `${m[1]}/${m[2]}` : null;
}

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Research rows carry "fakten" as [{ feld, wert, quelle }] or { feld: { wert, quelle } }. */
export function faktenOf(row) {
  const f = row.fakten;
  if (Array.isArray(f)) return f;
  if (f && typeof f === "object") return Object.entries(f).map(([feld, v]) => ({ feld, ...(v && typeof v === "object" ? v : { wert: v }) }));
  return [];
}

/** facts.json content from the core file and the product research rows. */
export function buildFacts({ core, research }) {
  const facts = core.facts.map((f) => ({ ...f, beleg: CORE }));
  const skipped = [];
  for (const { file, rows } of research) {
    for (const row of rows) {
      const key = productKeyFromUrl(row.katalog_url);
      if (!key) {
        skipped.push(`${file}: ${row.produkt_name || "?"} ohne katalog_url`);
        continue;
      }
      for (const fakt of faktenOf(row)) {
        const raw = String(fakt.wert ?? "");
        // Review notes ("[prüfen: Zuordnung …]") are not part of the fact;
        // a value that only says "nicht angegeben" is no fact at all.
        const wert = raw.replace(/\[[^\]]*(?:prüf|pruef)[^\]]*\]/giu, "").trim();
        if (!fakt.quelle || !/\d/.test(wert) || /nicht angegeben/i.test(wert)) continue;
        facts.push({
          id: `produkt:${key}:${slug(fakt.feld)}`,
          art: "Produkt",
          aussage: `${row.marke ? row.marke + " " : ""}${row.produkt_name}: ${fakt.feld}`,
          values: [wert],
          scope: { product: key },
          ...(wert !== raw ? { vorbehalt: "Recherche markiert Teile als [prüfen]; Zahlen stehen in der Quelle, Zuordnung offen" } : {}),
          quelle: fakt.quelle,
          beleg: file,
        });
      }
    }
  }
  return {
    version: 1,
    generiert: "node tools/content/build-facts.mjs (nicht von Hand ändern, Grundfakten in facts.core.json pflegen)",
    stand: core.stand,
    quellen: [CORE, ...research.map((r) => r.file)],
    anzahl: facts.length,
    facts,
    ignore: core.ignore || [],
    skipped,
  };
}

export function readInputs(root = ROOT) {
  const core = JSON.parse(fs.readFileSync(path.join(root, CORE), "utf8"));
  const dir = path.join(root, RESEARCH_DIR);
  const research = fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".json"))
        .sort()
        .map((f) => ({ file: `${RESEARCH_DIR}/${f}`, rows: JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) }))
    : [];
  return { core, research };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = JSON.stringify(buildFacts(readInputs()), null, 2) + "\n";
  const target = path.join(ROOT, FACTS_FILE);
  if (process.argv.includes("--check")) {
    const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
    if (current !== out) {
      console.error(`${FACTS_FILE} ist veraltet: node tools/content/build-facts.mjs`);
      process.exit(1);
    }
    console.log(`${FACTS_FILE} ist aktuell.`);
  } else {
    fs.writeFileSync(target, out);
    console.log(`${FACTS_FILE}: ${JSON.parse(out).anzahl} Fakten geschrieben.`);
  }
}
