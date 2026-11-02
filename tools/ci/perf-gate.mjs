#!/usr/bin/env node
// tools/ci/perf-gate.mjs — R4-plattform-ci (Masterplan AP1.6, Budget-Tor)
// tools/qa/perf.mjs misst und schreibt perf.json, bricht aber nie ab. Dieses
// Tor liest die Datei und gibt Exit 1, sobald eine Seite/ein Profil das
// Budget reißt (LCP ≤ 2,5 s, CLS ≤ 0,1, TBT ≤ 200 ms – Budget aus perf.json).
//
//   node tools/ci/perf-gate.mjs <perf.json> [--md=<datei>] [--warn-only]
//
// Exit 0 = alles im Budget (oder --warn-only), 1 = über Budget,
//      2 = Datei fehlt/unlesbar oder ohne Messwerte.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function evaluate(data) {
  const budget = data?.budget || { lcp: 2500, cls: 0.1, tbt: 200 };
  const rows = Array.isArray(data?.results) ? data.results : [];
  const failures = [];
  for (const r of rows) {
    const reasons = [];
    if (r.lcp === null || r.lcp === undefined) reasons.push("keine LCP-Messung");
    else if (r.lcp > budget.lcp) reasons.push(`LCP ${r.lcp} ms > ${budget.lcp}`);
    if (r.cls > budget.cls) reasons.push(`CLS ${r.cls} > ${budget.cls}`);
    if (r.tbt > budget.tbt) reasons.push(`TBT ${r.tbt} ms > ${budget.tbt}`);
    if (r.status && r.status >= 400) reasons.push(`HTTP ${r.status}`);
    if (reasons.length) failures.push({ profile: r.profile, path: r.path, reasons });
  }
  return { budget, rows, failures };
}

export function toMarkdown({ budget, rows, failures }) {
  const lines = [
    `# Perf-Budget (Labor)`,
    ``,
    `Budget: LCP ≤ ${budget.lcp} ms · CLS ≤ ${budget.cls} · TBT ≤ ${budget.tbt} ms · Messungen: ${rows.length} · über Budget: **${failures.length}**`,
    ``,
    `| Profil | Seite | LCP (ms) | CLS | TBT (ms) | Status |`,
    `|---|---|---:|---:|---:|---|`,
  ];
  for (const r of rows) {
    const f = failures.find((x) => x.profile === r.profile && x.path === r.path);
    lines.push(`| ${r.profile} | \`${r.path}\` | ${r.lcp ?? "–"} | ${r.cls ?? "–"} | ${r.tbt ?? "–"} | ${f ? `**${f.reasons.join(", ")}**` : "ok"} |`);
  }
  return lines.join("\n") + "\n";
}

function main() {
  const argv = process.argv.slice(2);
  const file = argv.find((a) => !a.startsWith("--"));
  const md = argv.find((a) => a.startsWith("--md="))?.slice(5);
  const warnOnly = argv.includes("--warn-only");
  let data;
  try {
    data = JSON.parse(fs.readFileSync(path.resolve(String(file)), "utf8"));
  } catch (error) {
    console.error(`perf-gate: ${file || "(keine Datei)"} unlesbar: ${error.message}`);
    process.exit(2);
  }
  const result = evaluate(data);
  if (md) {
    fs.mkdirSync(path.dirname(path.resolve(md)), { recursive: true });
    fs.writeFileSync(md, toMarkdown(result));
  }
  if (!result.rows.length) {
    console.error("perf-gate: keine Messwerte in der Datei");
    process.exit(2);
  }
  for (const f of result.failures) console.error(`✗ ${f.profile} ${f.path}: ${f.reasons.join(", ")}`);
  if (result.failures.length && !warnOnly) process.exit(1);
  console.log(`perf-gate: ${result.rows.length - result.failures.length}/${result.rows.length} Messungen im Budget.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
