#!/usr/bin/env node
// AR-Viewer Stufe 2b „Raumbedarf in Originalgröße“: Herstellermaße für
// Katalogprodukte übernehmen – nur aus Herstellerquellen mit URL.
//
// Quelle 1 (heute einzige): die Minotti-Datensätze des Sofaplaners
// (src/lib/sofaplaner/minotti/<familie>.json). Sie enthalten je Element B × T × H
// wörtlich aus dem Minotti Technical Sheet bzw. der Elementliste der
// Produktseite, mit Quell-URLs und Abrufdatum (siehe
// Marktresearch/digital/features/sofaplaner-minotti-modelle.md).
//
// Zuordnung Katalog → Familie → Element:
//   1. Familie über die Abgleich-Tabelle (sofaplaner-minotti-modelle.md, Spalte
//      „Katalog-path_field“), sonst über den Produktnamen ohne Zusatz in
//      Klammern/Anführungszeichen („Lawson (Armchairs 2)“ → „Lawson“).
//   2. Element nach Produktart (Name und Kategorie): Sessel → art „sessel…“,
//      Dining → „dining-sessel“/„stuhl“, Hocker/Ottoman → „hocker“, Bank → „bank“,
//      sonst Sofa → freistehendes „sofa“. „(… 2)“ nimmt das zweite passende Element.
//   3. Ohne passendes Element mit allen drei Maßen: kein Eintrag (= „Maße fehlen“).
// Es wird nichts geschätzt. Ausgabe: Einträge in src/lib/arviewer/dims.json mit
// herkunft "minotti-technical-sheet"; bestehende Einträge (Solpuri-Pilot) bleiben.
//
//   node scripts/arviewer/raumbedarf-masse.mjs --cache <ordner mit brands/*.json>
//   node scripts/arviewer/raumbedarf-masse.mjs           # Katalog live (nur GET)
//   --dry   nur Bericht, nichts schreiben
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const DRY = args.includes("--dry");
const BASE = (process.env.BACKOFFICE || "https://backoffice.platzhirsch.studio").replace(/\/$/, "");
const API = `${BASE}/api/method/platzhirsch_studio.platzhirsch_studio.doctype`;

export const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[“”„"«»]/g, '"')
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9"]+/g, " ")
    .trim();

/** „Lawson (Armchairs 2)“ → { base: "lawson", tag: "armchairs", nr: 2 } */
export function splitName(name) {
  const s = norm(name);
  const paren = String(name).match(/\(([^)]*)\)/);
  const quoted = String(name).match(/[“"„]([^”"“]+)[”"“]/);
  const base = norm(String(name).replace(/\([^)]*\)/g, "").replace(/[“"„][^”"“]+[”"“]/g, "")).replace(/"/g, "").trim();
  const tag = norm((paren?.[1] || "") + " " + (quoted?.[1] || "")).replace(/"/g, "");
  const nr = Number((paren?.[1] || "").match(/(\d+)\s*$/)?.[1] || 1);
  return { full: s.replace(/"/g, ""), base, tag, nr };
}

const ARTS = {
  sessel: ["sessel", "sessel-drehbar", "sessel-klein", "armlehnstuhl-lounge", "sessel-ohne-armlehnen"],
  dining: ["dining-sessel", "esszimmer-sessel", "armlehnstuhl-dining", "dining-sessel-drehbar", "stuhl"],
  hocker: ["hocker", "hocker-gebogen", "barhocker"],
  bank: ["bank"],
  tisch: ["tisch", "beistelltisch", "couchtisch"],
  sofa: ["sofa", "sofa-halbrund", "sofa-gebogen", "sofa-rund", "sofa-curved", "loveseat", "ecksofa", "sofa-chaise", "sofa-daybed", "schlafsofa", "dormeuse"],
};

/** Welche Elementart ein Katalogprodukt meint. */
export function wantedKind({ name, category }) {
  const n = norm(name);
  if (/\b(stool|stools|ottoman|footstool|pouf)\b/.test(n)) return "hocker";
  if (/\bbench\b/.test(n)) return "bank";
  if (/\bdining\b/.test(n) || category === "dining-chairs") return "dining";
  if (/\b(tables?|side tables?)\b/.test(n) && !/sofa/.test(n) && /tables$|side-tables|coffee-tables/.test(category)) return "tisch";
  if (/\b(armchairs?|lounge chairs?|lounge|little armchair|bergere)\b/.test(n) || category === "armchairs-stools") {
    if (/\bsofa\b/.test(n)) return "sofa";
    return "sessel";
  }
  return "sofa";
}

const complete = (e) => [e.breite_cm, e.tiefe_cm, e.hoehe_cm].every((v) => Number.isFinite(v) && v > 0);

/** Element einer Familie für ein Produkt wählen (oder null). */
export function pickElement(family, { name, category }) {
  const kind = wantedKind({ name, category });
  const { tag, nr } = splitName(name);
  const pool = family.elemente.filter((e) => complete(e) && ARTS[kind].includes(e.art));
  if (!pool.length) return null;
  // Zusatz im Namen („Lounge“, „Large“, „Small“, „Low“ …) bevorzugt passende Elemente.
  const words = tag.split(" ").filter((w) => w.length > 2 && !/^(armchairs?|sofas?|variant|tables?|chairs?|stools?|indoor|\d+)$/.test(w));
  const scored = pool.filter((e) => words.every((w) => norm(e.name).includes(w)));
  let list = scored.length ? scored : pool;
  if (kind === "sofa") {
    const free = list.filter((e) => e.art === "sofa" && /freistehend|2 armlehnen/i.test(e.anschluesse || ""));
    if (free.length) list = free;
  }
  // gleiche Maße nur einmal (z. B. SX/DX)
  const uniq = [...new Map(list.map((e) => [`${e.breite_cm}x${e.tiefe_cm}x${e.hoehe_cm}`, e])).values()];
  const el = uniq[Math.min(uniq.length - 1, nr - 1)];
  return { el, kind, alternativen: [...new Map(pool.map((e) => [`${e.breite_cm}x${e.tiefe_cm}x${e.hoehe_cm}`, e])).values()] };
}

export const sheetUrl = (family) =>
  family.quellen.find((u) => /TECHNICAL[_ -]?SHEET/i.test(u)) || family.quellen.find((u) => /^https:\/\/www\.minotti\.com\//.test(u)) || null;

function loadFamilies() {
  const dir = path.join(ROOT, "src/lib/sofaplaner/minotti");
  return fs.readdirSync(dir).map((f) => ({ file: `src/lib/sofaplaner/minotti/${f}`, ...JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) }));
}

/** Abgleich-Tabelle: path_field → Familienname (nur Zeilen „ja“/„teilweise“). */
function tableMap() {
  const md = fs.readFileSync(path.join(ROOT, "Marktresearch/digital/features/sofaplaner-minotti-modelle.md"), "utf8");
  const out = new Map();
  for (const l of md.split("\n")) {
    if (!/^\| \d+ \|/.test(l)) continue;
    const c = l.split("|").map((s) => s.trim());
    for (const pf of c[9].match(/[a-z0-9]+(?:-[a-z0-9]+)+/g) || []) out.set(pf, c[2]);
  }
  return out;
}

export const SEATING = ["sofas-couches", "armchairs-stools", "dining-chairs"];
const TABLE_ONLY = ["bedwear", "chaise-longues-daybeds"];

async function catalog() {
  const dir = opt("--cache");
  let rows = [];
  if (dir) {
    for (const f of fs.readdirSync(path.join(dir, "brands"))) rows.push(...(JSON.parse(fs.readFileSync(path.join(dir, "brands", f), "utf8")).message || []));
  } else {
    const r = await fetch(`${API}.produkte_new.api.get_produkte_by_marke_api?marken=Minotti`);
    rows = (await r.json()).message || [];
  }
  return rows.filter((p) => p.marken === "Minotti" && p.status === "Aktiv" && p.path_field);
}

async function main() {
  const fams = loadFamilies();
  const byName = new Map(fams.map((f) => [norm(f.name).replace(/"/g, ""), f]));
  const table = tableMap();
  const dimsPath = path.join(ROOT, "src/lib/arviewer/dims.json");
  const DIMS = JSON.parse(fs.readFileSync(dimsPath, "utf8"));
  const products = await catalog();
  const log = { ok: [], ohne: [] };
  for (const p of products) {
    if (DIMS.produkte[p.path_field] && DIMS.produkte[p.path_field].herkunft !== "minotti-technical-sheet") continue;
    const { base, full } = splitName(p.produkt_name);
    const tName = table.get(p.path_field);
    // Nur Sitzmöbel; Decken, Nachttische, Konsolen usw. derselben Familie haben andere Maße.
    // Fehlzuordnungen im Backoffice (Sofa unter „bedwear“) nur, wenn die Abgleich-Tabelle sie nennt.
    if (!SEATING.includes(p.kategories) && !(tName && TABLE_ONLY.includes(p.kategories))) continue;
    const fam = (tName && byName.get(norm(tName).replace(/"/g, ""))) || byName.get(full) || byName.get(base);
    if (!fam) {
      log.ohne.push([p.path_field, "keine Familie im Sofaplaner-Datensatz"]);
      continue;
    }
    let pick = pickElement(fam, { name: p.produkt_name, category: p.kategories });
    // Abgleich-Tabelle: Datensatz unter „Sessel“, der laut Beschreibung das Sofa meint.
    if (!pick && tName) pick = pickElement(fam, { name: "sofa", category: "sofas-couches" });
    const quelle = sheetUrl(fam);
    if (!pick?.el || !quelle) {
      log.ohne.push([p.path_field, `${fam.name}: kein passendes Element (${wantedKind({ name: p.produkt_name, category: p.kategories })})`]);
      continue;
    }
    const e = pick.el;
    DIMS.produkte[p.path_field] = {
      w: e.breite_cm,
      d: e.tiefe_cm,
      h: e.hoehe_cm,
      quelle,
      produktseite: fam.quellen.find((u) => /minotti\.com\/(en|de)\//.test(u)) || null,
      dokument: fam.file,
      modell: e.name_de || e.name,
      element: e.code || null,
      familie: fam.name,
      alternativen: pick.alternativen
        .filter((a) => a !== e)
        .slice(0, 12)
        .map((a) => ({ modell: a.name_de || a.name, w: a.breite_cm, d: a.tiefe_cm, h: a.hoehe_cm })),
      herkunft: "minotti-technical-sheet",
      geprueft: fam.abrufdatum || "2026-10-27",
    };
    log.ok.push([p.path_field, p.kategories, fam.name, e.name, `${e.breite_cm}×${e.tiefe_cm}×${e.hoehe_cm}`]);
  }
  DIMS.produkte = Object.fromEntries(Object.entries(DIMS.produkte).sort(([a], [b]) => a.localeCompare(b)));
  DIMS.stand = new Date().toISOString().slice(0, 10);
  console.log(`Minotti: ${log.ok.length} mit Maßen, ${log.ohne.length} ohne`);
  for (const r of log.ok) console.log("  +", r.join(" | "));
  if (!DRY) fs.writeFileSync(dimsPath, JSON.stringify(DIMS, null, 2) + "\n");
  fs.mkdirSync(path.join(ROOT, ".data/ar-viewer"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, ".data/ar-viewer/raumbedarf-masse.json"), JSON.stringify(log, null, 1));
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/arviewer/raumbedarf-masse.mjs")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
