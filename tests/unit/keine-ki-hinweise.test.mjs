// tests/unit/keine-ki-hinweise.test.mjs — Kein Besuchertext verrät, dass Claude,
// Anthropic oder „KI-Agenten“ die Website, ihre Texte, Übersetzungen oder
// Entwürfe erstellt haben (Inhaber-Auftrag 02.11.).
//
// Geprüft werden ausgelieferte Texte: src/messages/*.json, Copy-Module unter
// src/lib, Seiten unter src/app/[locale] und Komponenten. Kommentare werden
// vorher entfernt (unsichtbar im Browser).
//
// Whitelist (Dateien, in denen Claude/Anthropic legitim vorkommen):
//   - Concierge-Kennzeichnung als KI-System (Art. 50 KI-VO, DSGVO-Transparenz)
//   - /ki-assistenten: Claude ist dort ein Client wie ChatGPT (MCP-Produkt)
//   - Datenschutz/Rechtstexte: Anthropic als Auftragsverarbeiter des Concierge
// Auch in diesen Dateien gilt: keine Herstellungs-Behauptung („von KI-Agenten
// erstellt“, „Entwurf von KI-Agenten“, „translated by AI“ …).
//
// Nicht geprüft (nicht ausgeliefert): Freigabe-Cockpit (404 in Produktion),
// src/lib/shop/release.js, lieferzeit.js, ust.js, paketprofile.js (interne
// Status-Metadaten ohne Render-Stelle).
// Run: node --test --test-reporter=tap tests/unit/keine-ki-hinweise.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = new URL("../../", import.meta.url);
const abs = (p) => path.join(ROOT.pathname.replace(/^\/([A-Za-z]:)/, "$1"), p);
const rel = (p) => path.relative(abs(""), p).split(path.sep).join("/");

/** Rekursiv alle Dateien mit passender Endung einsammeln. */
function walk(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, out);
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

/** Kommentare entfernen: /* … *\/, {/* … *\/} und Zeilen, die mit // oder * beginnen. */
function ohneKommentare(src) {
  return src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join("\n");
}

// Streng: diese Begriffe dürfen in normalen Besuchertexten gar nicht vorkommen.
const STRENG = [/\bClaude\b/, /Anthropic/, /KI-Agent/i, /\bAI agents?\b/i, /\bagents? IA\b/i, /\bagenti IA\b/i, /\bagente IA\b/i];

// Herstellungs-Behauptungen: nirgends erlaubt, auch nicht in der Whitelist.
const HERSTELLUNG = [
  /Entwurf von KI/i,
  /Entwurf von Agenten/i,
  /von (einer |einem )?(KI|Claude|Anthropic|KI-Agenten|Agenten) (erstellt|verfasst|geschrieben|übersetzt|entworfen|gebaut|generiert)/i,
  /(erstellt|verfasst|geschrieben|übersetzt|entworfen|gebaut) (von|durch|mit) (Claude|Anthropic|KI-Agenten|Agenten)\b/i,
  /automatisch übersetzt/i,
  /Übersetzung wurde automatisch/i,
  /(created|built|written|translated|drafted|generated) (by|with|using) (Claude|Anthropic|AI agents?|an AI|AI)\b/i,
  /(créé|rédigé|traduit|généré)e?s? par (Claude|Anthropic|une IA|des agents)/i,
  /(creat|scritt|tradott|generat)[oaie] da (Claude|Anthropic|un'IA|agenti)/i,
  /Schätzung von KI/i,
];

// Dateien/Ordner anderer Zuständigkeit oder ohne Auslieferung (relative Pfade, Präfix-Match).
const AUSGESCHLOSSEN = [
  "src/components/Freigaben/",
  "src/app/[locale]/preview/freigaben/",
  "src/lib/shop/release.js",
  "src/lib/shop/lieferzeit.js",
  "src/lib/shop/ust.js",
  "src/lib/shop/paketprofile.js",
  "src/lib/shop/legalTexte.js",
  "src/components/LegalDrafts/",
  "src/app/[locale]/shop/recht/",
];

// Whitelist: Claude/Anthropic erlaubt (Begründung siehe Kopf), Herstellungs-Behauptung trotzdem verboten.
const WHITELIST = [
  "src/components/Concierge/",
  "src/components/Labs/Concierge/",
  "src/components/Agent/",
  "src/lib/agent/",
  "src/lib/legal/services.js",
  "src/components/Datenschutz/",
  "src/app/[locale]/datenschutz/",
  "src/app/[locale]/portal/datenschutz/",
  "src/app/[locale]/impressum/",
  "src/app/[locale]/barrierefreiheit/",
  "src/app/[locale]/ki-assistenten/",
  "src/app/[locale]/concierge/",
];

const matchesPrefix = (file, list) => list.some((p) => rel(file).startsWith(p));

const dateien = [
  ...walk(abs("src/messages"), [".json"]),
  ...walk(abs("src/lib"), [".js"]).filter((f) => /\/(copy[^/]*\.js|content\/.*\.js|yacht\/[^/]*\.js|agent\/copy\.js|seo\/.*\.js)$/.test(rel(f))),
  ...walk(abs("src/lib/yacht"), [".json"]),
  ...walk(abs("src/lib/content"), [".js", ".json"]),
  ...walk(abs("src/content"), [".json", ".md"]),
  ...walk(abs("src/app"), [".js"]),
  ...walk(abs("src/components"), [".js"]),
].filter((f, i, arr) => arr.indexOf(f) === i && !matchesPrefix(f, AUSGESCHLOSSEN));

test("Scan-Umfang ist nicht leer", () => {
  assert.ok(dateien.length > 100, `nur ${dateien.length} Dateien gefunden`);
  assert.ok(dateien.some((f) => rel(f) === "src/messages/de.json"));
});

test("Besuchertexte nennen weder Claude noch Anthropic noch KI-Agenten", () => {
  const treffer = [];
  for (const f of dateien) {
    if (matchesPrefix(f, WHITELIST)) continue;
    const text = f.endsWith(".js") ? ohneKommentare(fs.readFileSync(f, "utf8")) : fs.readFileSync(f, "utf8");
    text.split("\n").forEach((zeile, i) => {
      // Bot-Namen in robots.js (Claude-User, ClaudeBot, anthropic-ai) sind Crawler-Kennungen, kein Text.
      if (rel(f) === "src/app/robots.js") return;
      // Technische Bezeichner (Modellname, SDK-Klasse, Hostliste) sind kein Besuchertext.
      if (/^\s*import\b|claude-[a-z0-9-]+"|new Anthropic|Anthropic\.|claude\\\.ai|ANTHROPIC_API_KEY/.test(zeile)) return;
      for (const re of STRENG) if (re.test(zeile)) treffer.push(`${rel(f)}:${i + 1}: ${zeile.trim().slice(0, 120)}`);
    });
  }
  assert.deepEqual(treffer, [], `Verbotene Begriffe in Besuchertexten:\n${treffer.join("\n")}`);
});

test("Nirgends steht, dass KI/Claude/Agenten die Website oder Texte erstellt haben", () => {
  const treffer = [];
  for (const f of dateien) {
    const text = f.endsWith(".js") ? ohneKommentare(fs.readFileSync(f, "utf8")) : fs.readFileSync(f, "utf8");
    text.split("\n").forEach((zeile, i) => {
      for (const re of HERSTELLUNG) if (re.test(zeile)) treffer.push(`${rel(f)}:${i + 1}: ${zeile.trim().slice(0, 120)}`);
    });
  }
  assert.deepEqual(treffer, [], `Herstellungs-Hinweise gefunden:\n${treffer.join("\n")}`);
});

test("Whitelist-Dateien beschreiben den Assistenten, nicht die Herstellung der Website", () => {
  // Concierge-Kennzeichnung muss erhalten bleiben (AI Act / DSGVO) – Test schützt vor Übereifer.
  const texte = fs.readFileSync(abs("src/components/Concierge/core/texts.js"), "utf8");
  assert.match(texte, /KI-System/);
  assert.match(texte, /Anthropic PBC/);
});
