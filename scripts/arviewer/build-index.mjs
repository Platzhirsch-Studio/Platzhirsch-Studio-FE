#!/usr/bin/env node
// AR-Viewer: Katalog-Index für das ganze Sortiment.
//
// Schreibt src/lib/arviewer/catalog-index.json mit den path_fields aller
// aktiven Produkte, deren Backoffice-Daten verwertbare Maße enthalten (Freitext
// in additional_information[].dimensions oder „a × b (× c) cm“ im Text). Der
// Viewer nutzt das NUR als Ausblick („AR-Foto möglich, Maße vom Hersteller
// noch zu bestätigen“) – angezeigt werden ausschließlich Maße aus
// src/lib/arviewer/dims.json (Herstellerquelle mit URL).
//
// Nur lesende GET-Abrufe (Guest-Methoden des Backoffice), nichts wird gesendet.
//
//   node scripts/arviewer/build-index.mjs                 # live, ca. 1.800 Abrufe, 12 parallel
//   node scripts/arviewer/build-index.mjs --cache <dir>   # vorhandene Inventur nutzen
//                                                         # (<dir>/brands/*.json, <dir>/dims.json)
//   BACKOFFICE=https://… überschreibt die Basis-URL.
import fs from "node:fs";
import path from "node:path";

const BASE = (process.env.BACKOFFICE || "https://backoffice.platzhirsch.studio").replace(/\/$/, "");
const API = `${BASE}/api/method/platzhirsch_studio.platzhirsch_studio.doctype`;
const OUT = path.resolve("src/lib/arviewer/catalog-index.json");
const args = process.argv.slice(2);
const cacheDir = args.includes("--cache") ? args[args.indexOf("--cache") + 1] : null;

const nums = (s) => (String(s).match(/\d+(?:[.,]\d+)?/g) || []).length;
const TRI = /\d{1,4}(?:[.,]\d+)?\s*(?:cm|mm)?\s*[x×]\s*\d{1,4}(?:[.,]\d+)?\s*(?:cm|mm)?(?:\s*[x×]\s*\d{1,4}(?:[.,]\d+)?)?\s*(?:cm|mm)?/gi;
const LAB = /\b(?:B|L|H|T|W|D|Ø|Breite|Tiefe|Höhe|Länge|Durchmesser|width|depth|height|length|diameter)\s*[.:=]?\s*\d{1,4}(?:[.,]\d+)?\s*(?:cm|mm)/gi;

/** true, wenn der Datensatz verwertbare Maße enthält (gleiche Regel wie die Inventur). */
export function hasUsableDims({ add = [], tri = [], lab = [] }) {
  return add.some((s) => nums(s) >= 2) || tri.length > 0 || lab.length >= 2;
}

async function getJson(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return (await r.json()).message;
}

async function liveProducts() {
  const marken = await getJson(`${API}.marken.api.marken_data`);
  const out = [];
  for (const m of marken.filter((x) => x.status === "Aktiv")) {
    const rows = await getJson(`${API}.produkte_new.api.get_produkte_by_marke_api?marken=${encodeURIComponent(m.name)}`).catch(() => []);
    for (const p of rows || []) if (p?.status === "Aktiv" && p.path_field) out.push(p);
  }
  return out;
}

async function liveDims(paths) {
  const res = {};
  let i = 0;
  async function worker() {
    while (i < paths.length) {
      const k = paths[i++];
      try {
        const m = (await getJson(`${API}.produkte_new.api.get_produkt_by_path_field_api?path_field=${encodeURIComponent(k)}`)) || {};
        const add = (m.additional_information || []).map((a) => a.dimensions).filter((x) => x && String(x).trim());
        const text = [m.beschreibung, m.mehr_beschreibung, m.beschreibung_en, m.mehr_beschreibung_en].join(" ").replace(/<[^>]+>/g, " ");
        res[k] = { add, tri: text.match(TRI) || [], lab: text.match(LAB) || [] };
      } catch {
        res[k] = { err: true };
      }
    }
  }
  await Promise.all(Array.from({ length: 12 }, worker));
  return res;
}

async function main() {
  let products;
  let dims;
  if (cacheDir) {
    products = fs
      .readdirSync(path.join(cacheDir, "brands"))
      .flatMap((f) => JSON.parse(fs.readFileSync(path.join(cacheDir, "brands", f), "utf8")).message || [])
      .filter((p) => p?.status === "Aktiv" && p.path_field);
    dims = JSON.parse(fs.readFileSync(path.join(cacheDir, "dims.json"), "utf8"));
  } else {
    products = await liveProducts();
    dims = await liveDims(products.map((p) => p.path_field));
  }
  const withDims = products.filter((p) => dims[p.path_field] && hasUsableDims(dims[p.path_field])).map((p) => p.path_field);
  const out = {
    $note: "Erzeugt von scripts/arviewer/build-index.mjs (nur GET). mitMassen = Produkte mit verwertbaren Maßen im Backoffice-Freitext; nur Ausblick, keine geprüfte Maßquelle.",
    stand: new Date().toISOString().slice(0, 10),
    produkte: products.length,
    mitMassen: [...new Set(withDims)].sort(),
  };
  fs.writeFileSync(OUT, JSON.stringify(out) + "\n");
  console.log(`${products.length} aktive Produkte, ${out.mitMassen.length} mit Maßen → ${path.relative(process.cwd(), OUT)}`);
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/").replace(/^([A-Za-z]:)/, "/$1")}` || process.argv[1]?.endsWith("build-index.mjs")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
