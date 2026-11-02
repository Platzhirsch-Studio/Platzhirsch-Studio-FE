#!/usr/bin/env node
// Sofaplaner 3D – erzeugt die Download-Liste für den Inhaber:
// welche 3D-Modelle je Modellfamilie aus dem Minotti-Händlerbereich zu holen sind.
//
//   node tools/sofaplaner-3d/download-liste.mjs   → docs/sofaplaner-3d-downloadliste.md
//
// Quelle je Familie: cad.modelle_3d der Recherche-JSON (Minottis eigene
// Modellnamen), sonst abgeleitet aus den Elementen der JSON (englische
// Herstellerbezeichnung ohne SX/DX) – dort können die Namen im Händlerbereich
// leicht abweichen.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { baseCode, loadFamilies, matchElement } from "./lib.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const SIDE = /\s*\b(SX|DX)\b\s*/g;

export function downloadList(families) {
  const out = [];
  for (const [slug, { fam, raw, file }] of [...families].sort((a, b) => a[1].fam.name.localeCompare(b[1].fam.name, "de"))) {
    const cad = Array.isArray(raw?.cad?.modelle_3d) ? raw.cad.modelle_3d : null;
    let items;
    if (cad?.length) {
      items = cad.map((name) => {
        const m = matchElement(name, fam);
        return { name, codes: m && !m.ambiguous ? [m.group.key] : [] };
      });
    } else {
      const seen = new Map();
      for (const el of fam.elements) {
        if (el.role === "acc") continue;
        const name = String(el.labelEn || el.label)
          .replace(SIDE, " ")
          .replace(/\s{2,}/g, " ")
          .trim();
        const key = name.toUpperCase();
        if (!seen.has(key)) seen.set(key, { name, codes: new Set() });
        seen.get(key).codes.add(baseCode(el.srcCode ?? el.code));
      }
      items = [...seen.values()].map((x) => ({
        name: x.name,
        codes: [...x.codes],
      }));
    }
    const sided = fam.elements.some((e) => e.side);
    out.push({
      slug,
      name: fam.name,
      file,
      source: cad?.length ? "cad.modelle_3d" : "abgeleitet",
      sided,
      items,
    });
  }
  return out;
}

function markdown(list) {
  const total = list.reduce((n, f) => n + f.items.length, 0);
  const cad = list.filter((f) => f.source === "cad.modelle_3d").length;
  const lines = [
    "# Sofaplaner – Download-Liste Minotti-3D-Modelle",
    "",
    "> Automatisch erzeugt mit `node tools/sofaplaner-3d/download-liste.mjs` aus den 90 Recherche-Dateien in `src/lib/sofaplaner/minotti/`. Nicht von Hand bearbeiten – Datei neu erzeugen.",
    "",
    `Stand: ${new Date().toISOString().slice(0, 10)} · ${list.length} Modellfamilien · ${total} Modelle · bei ${cad} Familien stammen die Namen aus Minottis CAD-Liste (\`cad.modelle_3d\`), bei den übrigen ${list.length - cad} sind sie aus den Elementen abgeleitet (Namen im Händlerbereich können leicht abweichen, z. B. „SOFA CM 227“).`,
    "",
    "**Ablage:** jede Datei in `Herstellermaterial/Minotti/3d/<Ordner>/` – den Ordnernamen aus der Tabelle verwenden. Bevorzugtes Format: **FBX** (sonst OBJ, 3DS, DAE oder GLB; ZIP ist ok). DWG/SKP/MAX werden übersprungen. Bei Elementen mit SX/DX genügt **eine** Hand – die andere wird gespiegelt (im Planer markiert); beide Hände sind besser, wenn das Modell asymmetrische Details hat.",
    "",
    "Anleitung, Freigabe und Konvertierung: [sofaplaner-3d-modelle.md](sofaplaner-3d-modelle.md).",
    "",
  ];
  for (const f of list) {
    lines.push(
      `## ${f.name}`,
      "",
      `Ordner: \`${f.slug}/\` · Quelle der Namen: ${f.source === "cad.modelle_3d" ? "Minotti-CAD-Liste" : "abgeleitet aus den Elementen"}${f.sided ? " · enthält Elemente mit SX/DX" : ""}`,
      ""
    );
    for (const it of f.items) lines.push(`- [ ] ${it.name}${it.codes.length ? ` — \`${it.codes.join("`, `")}\`` : ""}`);
    lines.push("");
  }
  return lines.join("\n");
}

if (process.argv[1] && import.meta.filename === process.argv[1]) {
  const list = downloadList(loadFamilies(path.join(ROOT, "src/lib/sofaplaner/minotti")));
  const out = path.join(ROOT, "docs/sofaplaner-3d-downloadliste.md");
  writeFileSync(out, markdown(list));
  console.log(`${out}: ${list.length} Familien, ${list.reduce((n, f) => n + f.items.length, 0)} Modelle`);
}
