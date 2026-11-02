#!/usr/bin/env node
// tools/i18n/proposals-coverage.mjs
// Schlussprüfung „eine Textquelle“ (R6-i18n): Fehlt aus den Vorschlagsdateien
// Marktresearch/digital/teamleiter/messages-r[1-9]-*.json noch ein Schlüssel in
// src/messages/<locale>.json? Die Vorschläge werden nur gelesen.
//
// Gezählt werden alle Blätter je Sprache (Schlüssel mit führendem "_" sind
// Hinweise und zählen nicht). Ergebnis je Datei: Blätter, vorhanden, gleich,
// abweichend (später per Patch geändert, z. B. IT „tu“), fehlend, bewusst
// ausgeschlossen. Exit 1, sobald ein Schlüssel fehlt, der nicht bewusst
// ausgeschlossen ist.
//
// Aufruf: node tools/i18n/proposals-coverage.mjs [--json=out.json] [--md=out.md] [--glob=r[1-9]]
//        [--all]  (alle Marktresearch/digital/**/*messages*.json, inkl. redesign/ und
//                  features/; fix2 28.10.2026: vorher nur messages-*.json, dadurch
//                  fehlte features/upload-messages-vorschlag.json)
//
// DE-only-Vorschläge (Namespace auf oberster Ebene, nur "_meta" als Hinweis)
// gelten als DE; EN/FR/IT müssen dieselben Pfade haben (normalizeProposal).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOCALES, ROOT, isPlainObject, normalizeProposal, readMessages } from "./lib.mjs";

export const PROPOSAL_DIR = "Marktresearch/digital/teamleiter";

/** Bewusst nicht übernommene Pfade (Präfix) mit Grund. */
export const EXCLUDED = [
  { path: "Cookies.intro", grund: "Rechtstext, liegt beim Anwalt (seit R4)" },
  { path: "Cookies.thirdCountryNotice", grund: "Rechtstext, liegt beim Anwalt (seit R4)" },
];

/** Alle Blätter eines Objekts als [pfad, wert]; "_"-Schlüssel zählen nicht. */
export function leaves(obj, prefix = "", out = []) {
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => leaves(v, prefix ? `${prefix}.${i}` : String(i), out));
    return out;
  }
  if (isPlainObject(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith("_")) continue;
      leaves(v, prefix ? `${prefix}.${k}` : k, out);
    }
    return out;
  }
  out.push([prefix, obj]);
  return out;
}

export function getLeaf(obj, dotted) {
  let cur = obj;
  for (const part of dotted.split(".")) {
    if (cur == null || typeof cur !== "object" || !Object.hasOwn(cur, part)) return { found: false };
    cur = cur[part];
  }
  return { found: true, value: cur };
}

export const isExcluded = (p) => EXCLUDED.some((e) => p === e.path || p.startsWith(`${e.path}.`));

/**
 * Übernahme rat95 (30.10.2026): Texte, die laut Vorschlag bewusst in einem
 * Modul statt in src/messages stehen (Seiten nur DE/EN, Texte im Modul des
 * fachlichen Besitzers, siehe "_hinweis" in rat95-t3-messages.json). Sie
 * zählen nur dann als übernommen, wenn der Vorschlagswert wörtlich in einer
 * der genannten Dateien steht – sonst bleiben sie "fehlend".
 */
export const MODULE_TEXTS = [
  { path: "hotelObjekt", files: ["src/components/Hotel/t3Text.js", "src/components/Hotel/quickInquiry.js"], grund: "Hotel & Objekt nur DE/EN, Texte im Hotel-Modul (T3)" },
  { path: "architekten", files: ["src/components/Architekten/quickLead.js"], grund: "Architekten nur DE/EN, Texte im Modul (T3)" },
  { path: "ezarri.hub", files: ["src/app/[locale]/ezarri/page.js"], grund: "Ezarri-Hub-H1 nur DE/EN, HERO_TITLE in der Seite (T3)" },
  // QM-Endabnahme 02.11.2026: neuer Vorschlagsschlüssel, bis zur Übernahme in die Messages (shell-home)
  // aus der Fallback-Tabelle geraeteCopy.js gelesen (geraeteText → t.has, sonst Tabelle).
  { path: "kuechengeraete.hinweis.preiseKatalog", files: ["src/components/Kuechengeraete/geraeteCopy.js"], grund: "Küchengeräte-Hinweis, Fallback-Tabelle im Modul" },
  { path: "yacht", files: ["src/components/Yacht/YachtReferences.js", "src/lib/yacht/references.js"], grund: "Yacht nur DE/EN, Texte im Yacht-Modul (T3)" },
];
const moduleSrc = new Map();
export function inModule(p, value, root = ROOT) {
  const e = MODULE_TEXTS.find((m) => p === m.path || p.startsWith(`${m.path}.`));
  if (!e || typeof value !== "string") return false;
  const src = e.files.map((f) => {
    if (!moduleSrc.has(f)) moduleSrc.set(f, fs.existsSync(path.join(root, f)) ? fs.readFileSync(path.join(root, f), "utf8") : "");
    return moduleSrc.get(f);
  }).join("\n");
  return src.includes(value) || src.includes(JSON.stringify(value).slice(1, -1));
}

/** Vergleicht einen Vorschlag mit den Messages. */
export function coverage(proposal, messages) {
  const { byLocale, deOnly } = normalizeProposal(proposal);
  const rows = {};
  for (const l of LOCALES) {
    const r = { leaves: 0, present: 0, same: 0, changed: 0, missing: [], excluded: 0 };
    // DE-only: EN/FR/IT gegen die DE-Pfade prüfen (dort steht eine Übersetzung, „gleich“ zählt nur in DE).
    const src = byLocale[l] || (deOnly ? byLocale.de : {});
    for (const [p, v] of leaves(src)) {
      r.leaves++;
      if (isExcluded(p)) {
        r.excluded++;
        continue;
      }
      const hit = getLeaf(messages[l], p);
      // null = Löschung (Format rat95): übernommen, wenn der Schlüssel fehlt.
      if (v === null) {
        if (hit.found) r.missing.push(`${p} (Löschung offen)`);
        else r.present++;
        continue;
      }
      if (!hit.found && inModule(p, v)) {
        r.present++;
        r.same++;
        continue;
      }
      if (!hit.found) r.missing.push(p);
      else {
        r.present++;
        if (JSON.stringify(hit.value) === JSON.stringify(v) && (l === "de" || !deOnly)) r.same++;
        else r.changed++;
      }
    }
    rows[l] = r;
  }
  return rows;
}

export function proposalFiles(root = ROOT, re = /^messages-r[1-9]-.+\.json$/) {
  return fs
    .readdirSync(path.join(root, PROPOSAL_DIR))
    .filter((f) => re.test(f))
    .sort();
}

/**
 * Alle Vorschlagsdateien unter Marktresearch/digital/** (*messages*.json, z. B.
 * redesign/, teamleiter/ und features/), relativ zu ROOT. Feinschliff 28.10.2026: auch die
 * Redesign-Vorschläge zählen, nicht nur teamleiter/messages-r*.
 */
export function allProposalFiles(root = ROOT, base = "Marktresearch/digital") {
  const out = [];
  const walk = (rel) => {
    for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
      const p = `${rel}/${e.name}`;
      if (e.isDirectory()) walk(p);
      else if (/messages.*\.json$/.test(e.name)) out.push(p);
    }
  };
  walk(base);
  return out.sort();
}

function main() {
  const args = process.argv.slice(2);
  const jsonOut = args.find((a) => a.startsWith("--json="))?.slice(7);
  const mdOut = args.find((a) => a.startsWith("--md="))?.slice(5);
  const g = args.find((a) => a.startsWith("--glob="))?.slice(7) || "r[1-9]";
  const re = new RegExp(`^messages-${g}-.+\\.json$`);
  const messages = Object.fromEntries(LOCALES.map((l) => [l, readMessages(l).data]));
  const result = {};
  let missing = 0;
  const lines = [
    "| Datei | Blätter je Sprache (de/en/fr/it) | vorhanden | davon gleich | abweichend (Patch) | ausgeschlossen | fehlend |",
    "|---|---|---|---|---|---|---|",
  ];
  const all = args.includes("--all");
  const list = all ? allProposalFiles(ROOT) : proposalFiles(ROOT, re).map((f) => `${PROPOSAL_DIR}/${f}`);
  for (const rel of list) {
    const f = all ? rel.replace("Marktresearch/digital/", "") : path.basename(rel);
    const proposal = JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
    const rows = coverage(proposal, messages);
    result[f] = rows;
    const sum = (k) => LOCALES.reduce((s, l) => s + (Array.isArray(rows[l][k]) ? rows[l][k].length : rows[l][k]), 0);
    missing += sum("missing");
    lines.push(
      `| ${f} | ${LOCALES.map((l) => rows[l].leaves).join("/")} | ${sum("present")} | ${sum("same")} | ${sum("changed")} | ${sum("excluded")} | ${sum("missing")} |`,
    );
    for (const l of LOCALES) for (const p of rows[l].missing) console.error(`FEHLT ${f} ${l}: ${p}`);
  }
  const md = lines.join("\n");
  console.log(md);
  console.log(`\n${missing === 0 ? "0 fehlende Schlüssel" : `${missing} fehlende Schlüssel`} (ausgeschlossen: ${EXCLUDED.map((e) => e.path).join(", ")})`);
  if (jsonOut) fs.writeFileSync(path.resolve(ROOT, jsonOut), JSON.stringify(result, null, 2));
  if (mdOut) fs.writeFileSync(path.resolve(ROOT, mdOut), md + "\n");
  process.exit(missing ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
