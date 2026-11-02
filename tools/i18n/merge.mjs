#!/usr/bin/env node
// tools/i18n/merge.mjs
// Deep-Merge von Vorschlagsdateien ({de,en,fr,it} → Struktur wie src/messages)
// in src/messages/<locale>.json. Bestehende Schlüssel bleiben; Konflikte werden
// ausgegeben. Die Vorschlagsdateien werden nur gelesen.
//
// Aufruf: node tools/i18n/merge.mjs <vorschlag.json> [weitere …] [--dry] [--json=out.json]
//        [--exclude=Pfad1,Pfad2]  (Pfade, die nicht übernommen werden, z. B. Rechtstexte)
import fs from "node:fs";
import path from "node:path";
import { LOCALES, ROOT, deepMerge, deletePath, normalizeProposal, readMessages, writeMessages } from "./lib.mjs";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const jsonOut = args.find((a) => a.startsWith("--json="))?.slice(7);
const exclude = (args.find((a) => a.startsWith("--exclude="))?.slice(10) || "").split(",").filter(Boolean);
const files = args.filter((a) => !a.startsWith("--"));
if (!files.length) {
  console.error("Aufruf: node tools/i18n/merge.mjs <vorschlag.json> … [--dry]");
  process.exit(2);
}

const result = {};
const msgs = Object.fromEntries(LOCALES.map((l) => [l, readMessages(l)]));
for (const f of files) {
  // DE-only-Vorschläge (Namespace auf oberster Ebene, z. B. features/upload-…) gelten als { de }.
  const proposal = normalizeProposal(JSON.parse(fs.readFileSync(path.resolve(ROOT, f), "utf8"))).byLocale;
  // Ausgeschlossene Pfade vor dem Merge aus dem Vorschlag entfernen (nur im Speicher).
  for (const l of LOCALES) for (const p of exclude) if (proposal[l] && deletePath(proposal[l], p)) console.log(`${path.basename(f)} ${l}: ausgeschlossen ${p}`);
  const name = path.basename(f);
  result[name] = {};
  for (const l of LOCALES) {
    if (!proposal[l]) continue;
    const r = deepMerge(msgs[l].data, proposal[l]);
    result[name][l] = r;
    console.log(`${name} ${l}: +${r.added.length} neu, ${r.same.length} gleich, ${r.conflicts.length} Konflikte`);
    for (const c of r.conflicts) console.log(`  KONFLIKT ${c.path} (${c.reason}) behalten: ${JSON.stringify(c.kept)} | Vorschlag: ${JSON.stringify(c.proposed)}`);
  }
}
if (!dry) for (const l of LOCALES) writeMessages(l, msgs[l].data, msgs[l].eol);
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(result, null, 2));
console.log(dry ? "(Trockenlauf, nichts geschrieben)" : "geschrieben: src/messages/{de,en,fr,it}.json");
