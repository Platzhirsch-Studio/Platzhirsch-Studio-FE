#!/usr/bin/env node
// tools/wellness/sync-katalog-texte.mjs
// Übernimmt den Namespace „katalog“ aus qa-screenshots/wellness/produkte/katalog-texte.json
// VOLLSTÄNDIG nach src/messages/<locale>.json (ersetzt nur diesen Namespace,
// andere Namespaces bleiben unberührt; Schreib-Lock über tools/i18n/lib.mjs).
// merge.mjs behält bestehende Schlüssel – für geänderte Katalogtexte dieses Skript nutzen.
// Aufruf: node qa-screenshots/wellness/produkte/katalog-texte.mjs && node tools/wellness/sync-katalog-texte.mjs
import fs from "node:fs";
import path from "node:path";
import { LOCALES, ROOT, readMessages, writeMessages } from "../i18n/lib.mjs";

const src = JSON.parse(fs.readFileSync(path.join(ROOT, "qa-screenshots/wellness/produkte/katalog-texte.json"), "utf8"));
for (const l of LOCALES) {
  const { data, eol } = readMessages(l);
  data.katalog = src[l].katalog;
  writeMessages(l, data, eol);
  console.log(`${l}: katalog übernommen`);
}
