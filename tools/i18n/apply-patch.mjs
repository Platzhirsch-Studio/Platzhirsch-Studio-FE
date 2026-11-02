#!/usr/bin/env node
// tools/i18n/apply-patch.mjs
// Wendet Text-Patches auf src/messages an. Patch-Format:
//   { "_zweck": "…", "_add": false, "<locale>": { "<pfad.zum.schlüssel>": "neuer Text" | null } }
// null löscht den Schlüssel. Der Pfad muss existieren (außer mit "_add": true).
// Platzhalter ({name}, ICU-Argumente) müssen erhalten bleiben. Geschrieben wird
// erst, wenn alle Patches fehlerfrei sind.
//
// Aufruf: node tools/i18n/apply-patch.mjs <patch.json> [weitere …] [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOCALES, ROOT, deletePath, getPath, readMessages, setPath, writeMessages } from "./lib.mjs";

/** Namen der Platzhalter {x} / {x, plural …}, sortiert. */
export function placeholders(s) {
  const out = new Set();
  for (const m of String(s).matchAll(/\{\s*([A-Za-z_]\w*)\s*[,}]/g)) out.add(m[1]);
  return [...out].sort().join(",");
}

function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const files = args.filter((a) => !a.startsWith("--"));
  const msgs = Object.fromEntries(LOCALES.map((l) => [l, readMessages(l)]));
  let errors = 0;
  for (const f of files) {
    const patch = JSON.parse(fs.readFileSync(path.resolve(ROOT, f), "utf8"));
    const allowAdd = patch._add === true;
    for (const l of LOCALES) {
      if (!patch[l]) continue;
      const m = msgs[l];
      let changed = 0;
      for (const [key, val] of Object.entries(patch[l])) {
        const old = getPath(m.data, key);
        if (val === null) {
          if (deletePath(m.data, key)) changed++;
          continue;
        }
        if (old === undefined && !allowAdd) {
          console.error(`FEHLT ${l}:${key}`);
          errors++;
          continue;
        }
        if (typeof old === "string" && placeholders(old) !== placeholders(val)) {
          console.error(`PLATZHALTER ${l}:${key} alt {${placeholders(old)}} neu {${placeholders(val)}}`);
          errors++;
          continue;
        }
        if (old !== val) {
          setPath(m.data, key, val);
          changed++;
        }
      }
      console.log(`${path.basename(f)} ${l}: ${changed} geändert`);
    }
  }
  if (errors) {
    console.error(`${errors} Fehler – nichts geschrieben.`);
    process.exit(1);
  }
  if (!dry) for (const l of LOCALES) writeMessages(l, msgs[l].data, msgs[l].eol);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
