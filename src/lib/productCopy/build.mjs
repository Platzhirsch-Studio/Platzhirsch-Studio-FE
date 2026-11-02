// src/lib/productCopy/build.mjs
// Generator: Marktresearch/content/produkte/*.json -> src/content/productCopy/de.json
//
//   node src/lib/productCopy/build.mjs                 (write de.json + report)
//   node src/lib/productCopy/build.mjs --check         (also re-check every
//        catalog URL against http://localhost:3000, abort on non-200)
//   node src/lib/productCopy/build.mjs --report <file> (write the drop report)
//
// Approval: node src/lib/productCopy/approve.mjs (text-hash sign-off, whole
// entry or per field / FAQ answer) by the person who read the copy (owner
// question 7). A bare "approved": true without matching hash publishes nothing.
// A rerun keeps every approval (./approvals.js): whole-entry approvals of
// changed text are revoked loudly, per-field hashes simply stop matching and
// are reported as stale.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  META_DESCRIPTION_MAX,
  META_TITLE_MAX,
  factKey,
  rejectReason,
  sanitizeFact,
  sanitizeFaq,
  sanitizeParagraph,
  truncateAtWord,
} from "./sanitize.js";
import { carryApprovals } from "./approvals.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SRC_DIR = path.join(ROOT, "Marktresearch/content/produkte");
const OUT_FILE = path.join(ROOT, "src/content/productCopy/de.json");
const CHECKED_AT = "2026-10-26";
const BASE = "http://localhost:3000/de";

// Research URL -> real catalog path. Checked with curl against the dev server
// on 2026-10-26: the research URL 308-redirects to the path on the right.
const PATH_OVERRIDES = {
  "/produkte/dining-tables/tables-superquadra-tables": "/produkte/coffee-tables/tables-superquadra-tables",
};

// Entries that could not be matched to a catalog product (none on 2026-10-26).
const UNMAPPED = new Set([]);

const BRAND_PREFIXES = ["Minotti", "Poliform", "Rimadesio"];
const BRAND_NAMES = { "Tréca Paris": "Tréca" };

const FACT_LABELS = {
  designer: "Designer",
  jahr: "Jahr",
  materialien: "Materialien",
  masse: "Maße",
  varianten: "Varianten",
};

const args = process.argv.slice(2);
const doCheck = args.includes("--check");
const reportIdx = args.indexOf("--report");
const reportFile = reportIdx >= 0 ? args[reportIdx + 1] : null;

function brandAndName(entry) {
  if (entry.marke) return { brand: BRAND_NAMES[entry.marke] || entry.marke, name: entry.produkt_name };
  const prefix = BRAND_PREFIXES.find((b) => entry.produkt_name.startsWith(`${b} `));
  if (!prefix) return { brand: null, name: entry.produkt_name };
  return { brand: prefix, name: entry.produkt_name.slice(prefix.length + 1) };
}

function factsOf(entry) {
  const raw = Array.isArray(entry.fakten)
    ? entry.fakten.map((f) => ({ label: f.feld, ...f }))
    : Object.entries(entry.fakten || {}).map(([k, v]) => ({ label: FACT_LABELS[k] || k, ...v }));
  return raw.map((f) => ({ ...f, key: factKey(f.label) }));
}

async function checkStatus(catalogPath) {
  const res = await fetch(`${BASE}${catalogPath}`, { redirect: "manual" });
  return res.status;
}

const report = { generatedAt: new Date().toISOString(), entries: [], unmapped: [] };
const entries = [];

for (const file of fs.readdirSync(SRC_DIR).filter((f) => f.endsWith(".json")).sort()) {
  const list = JSON.parse(fs.readFileSync(path.join(SRC_DIR, file), "utf8"));
  for (const e of list) {
    const researchPath = new URL(e.katalog_url).pathname.replace(/^\/de(?=\/)/, "");
    if (UNMAPPED.has(researchPath)) {
      report.unmapped.push({ file, name: e.produkt_name, researchPath });
      continue;
    }
    const catalogPath = PATH_OVERRIDES[researchPath] || researchPath;
    const [, , categorySlug, productSlug] = catalogPath.split("/");
    const key = `${categorySlug}/${productSlug}`;
    const log = { key, name: e.produkt_name, file, researchPath, catalogPath, dropped: [], notes: [] };
    if (catalogPath !== researchPath) log.notes.push(`Katalog-URL korrigiert: ${researchPath} -> ${catalogPath}`);

    if (doCheck) {
      const status = await checkStatus(catalogPath);
      if (status !== 200) throw new Error(`${catalogPath} -> HTTP ${status}`);
    }

    const { brand, name } = brandAndName(e);

    // Meta: rejected -> left out (the page keeps the backoffice metadata).
    const meta = {};
    for (const [field, max] of [["title", META_TITLE_MAX], ["description", META_DESCRIPTION_MAX]]) {
      const original = String(e[`meta_${field}`] || "").trim();
      const reason = rejectReason(original);
      if (!original) continue;
      if (reason) { log.dropped.push({ part: `meta_${field}`, reason, text: original }); continue; }
      const cut = truncateAtWord(original, max);
      if (cut !== original) log.notes.push(`meta_${field} gekürzt: ${original.length} -> ${cut.length} Zeichen`);
      meta[field] = cut;
    }

    let h1 = String(e.h1 || "").trim();
    const h1Reason = rejectReason(h1);
    if (h1Reason) { log.dropped.push({ part: "h1", reason: h1Reason, text: h1 }); h1 = ""; }

    const paragraphs = [];
    String(e.text_de || "").split(/\n\s*\n/u).forEach((p, i) => {
      const { text, dropped } = sanitizeParagraph(p);
      for (const d of dropped) log.dropped.push({ part: `absatz ${i + 1}`, ...d });
      if (text) paragraphs.push(text);
    });

    const facts = [];
    for (const f of factsOf(e)) {
      const r = sanitizeFact(f);
      if (r.dropped) { log.dropped.push({ part: `fakt ${f.label}`, reason: r.dropped, text: f.wert ?? f.hinweis ?? "" }); continue; }
      if (r.trimmed) log.notes.push(`fakt ${f.label}: Preis-Teil entfernt`);
      facts.push({ key: f.key, label: f.label, value: r.value, source: r.source });
    }

    const faq = [];
    for (const item of e.faq || []) {
      const r = sanitizeFaq(item);
      if (r.dropped) { log.dropped.push({ part: "faq", reason: r.dropped, text: item.frage }); continue; }
      faq.push(r);
    }

    const keywords = [];
    for (const k of e.keywords || []) {
      const reason = rejectReason(k);
      if (reason) log.dropped.push({ part: "keyword", reason, text: k });
      else keywords.push(k);
    }

    entries.push({
      key,
      categorySlug,
      productSlug,
      approved: false,
      brand,
      productName: name,
      manufacturerUrl: e.hersteller_url,
      source: { file: `Marktresearch/content/produkte/${file}`, researchedAt: CHECKED_AT },
      catalog: { path: catalogPath, checkedAt: CHECKED_AT },
      meta,
      h1,
      paragraphs,
      facts,
      faq,
      keywords,
    });
    report.entries.push(log);
  }
}

const keys = entries.map((x) => x.key);
const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
if (dup.length) throw new Error(`Doppelte Schlüssel: ${dup.join(", ")}`);

let previousEntries = [];
if (fs.existsSync(OUT_FILE)) {
  // Unreadable previous file -> abort instead of silently dropping approvals.
  previousEntries = JSON.parse(fs.readFileSync(OUT_FILE, "utf8")).entries || [];
}
const approvals = carryApprovals(previousEntries, entries);
report.approvals = { kept: approvals.kept, revoked: approvals.revoked, orphaned: approvals.orphaned, stale: approvals.stale };

const out = {
  version: 1,
  locale: "de",
  generatedFrom: "Marktresearch/content/produkte/*.json",
  generatedAt: CHECKED_AT,
  note: "Generiert mit node src/lib/productCopy/build.mjs. Freigabe nur mit node src/lib/productCopy/approve.mjs (Text-Hash); ein neuer Lauf behält Freigaben, geänderter Text ist bis zur neuen Freigabe unsichtbar.",
  entries: approvals.entries,
};

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, `${JSON.stringify(out, null, 2)}\n`, "utf8");
if (reportFile) fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), "utf8");
console.log(`Freigaben: ${approvals.kept.length} übernommen, ${approvals.revoked.length} widerrufen (Text geändert), ${approvals.orphaned.length} ohne Eintrag`);
for (const k of approvals.revoked) console.warn(`FREIGABE WIDERRUFEN (Text geändert, neu freigeben): ${k}`);
for (const k of approvals.orphaned) console.warn(`FREIGABE OHNE EINTRAG (nicht mehr generiert): ${k}`);
for (const k of approvals.stale) console.warn(`FELD-FREIGABE VERALTET (Text geändert, unsichtbar bis neu freigegeben): ${k}`);
console.log(`${entries.length} Einträge -> ${path.relative(ROOT, OUT_FILE)}; nicht zugeordnet: ${report.unmapped.length}`);
