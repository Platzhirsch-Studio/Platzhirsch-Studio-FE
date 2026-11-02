#!/usr/bin/env node
// src/lib/productCopy/approve.mjs
// Sign-off tool for the curated product copy (owner question 7). Writes the
// text-hash approval into src/content/productCopy/de.json; only the person who
// has READ the text runs it. Without a matching hash nothing is published.
//
//   node src/lib/productCopy/approve.mjs --status [--key <cat/slug>]
//   node src/lib/productCopy/approve.mjs --startliste   (first 10 to read, with preview links)
//   node src/lib/productCopy/approve.mjs --key lamps/lamps-arco --by "Name" [--at 2026-10-27]
//        [--fields all | meta,h1,paragraphs,facts] [--faq all | 0,2] [--dry-run]
//
// --fields all (default without --faq) approves the whole entry. A later
// build.mjs run keeps approvals; changed text stops matching and is hidden
// again (shown as "veraltet" in --status).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { START_LIST } from "./startList.js";
import { APPROVABLE_FIELDS, approvedFaqItems, isEntryApproved, isFieldApproved, signApproval, staleApprovals } from "./approvals.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const FILE = path.join(ROOT, "src", "content", "productCopy", "de.json");

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const flag = (name) => args.includes(`--${name}`);

const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
const key = opt("key");

function status(e) {
  const fields = APPROVABLE_FIELDS.filter((f) => isFieldApproved(e, f));
  const faq = approvedFaqItems(e).length;
  const stale = staleApprovals(e);
  const whole = isEntryApproved(e) ? "GANZ" : "";
  return `${e.key.padEnd(70)} ${whole || fields.join(",") || "–"}${faq ? ` faq ${faq}/${e.faq.length}` : ""}${stale.length ? `  veraltet: ${stale.join(" ")}` : ""}`;
}

if (flag("startliste")) {
  const byKey = new Map(data.entries.map((e) => [e.key, e]));
  console.log("Startliste Produkttexte – lesen (Dev-Vorschau), dann freigeben:\n");
  START_LIST.forEach((k, i) => {
    const e = byKey.get(k);
    if (!e) return console.log(`${String(i + 1).padStart(2)}. ${k}  FEHLT in de.json`);
    console.log(
      [
        `${String(i + 1).padStart(2)}. ${e.brand} ${e.productName}`,
        `    ${status(e)}`,
        `    http://localhost:3000/de/produkte/${k}?produkttext=vorschau`,
        `    node src/lib/productCopy/approve.mjs --key ${k} --by "<Name>"`,
      ].join("\n")
    );
  });
  process.exit(0);
}

if (flag("status") || !key) {
  for (const e of data.entries) if (!key || e.key === key) console.log(status(e));
  if (!key && !flag("status")) console.error("\nFreigeben: --key <kategorie/slug> --by <Name> [--fields …] [--faq …]");
  process.exit(0);
}

const by = opt("by");
if (!by) {
  console.error("--by <Name> ist Pflicht (wer hat den Text gelesen?)");
  process.exit(1);
}
const at = opt("at") || new Date().toISOString().slice(0, 10);
const fieldsArg = opt("fields");
const faqArg = opt("faq");
const fields = fieldsArg === "all" || (!fieldsArg && !faqArg) ? "all" : (fieldsArg || "").split(",").filter(Boolean);
const faq = faqArg === "all" ? "all" : (faqArg || "").split(",").filter(Boolean).map(Number);

const index = data.entries.findIndex((e) => e.key === key);
if (index < 0) {
  console.error(`Kein Eintrag ${key}`);
  process.exit(1);
}
const signed = signApproval(data.entries[index], { fields, faq, by, at });
console.log(status(signed));
if (flag("dry-run")) process.exit(0);
data.entries[index] = signed;
fs.writeFileSync(FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`gespeichert: ${path.relative(ROOT, FILE)}`);
