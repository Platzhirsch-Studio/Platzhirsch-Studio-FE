#!/usr/bin/env node
// AR-Viewer Stufe 1: Hersteller-3D-Dateien finden und für das Web optimieren.
//
//   node scripts/arviewer/optimize-models.mjs            # nur Bestandsaufnahme
//   node scripts/arviewer/optimize-models.mjs --run      # GLB/glTF optimieren
//
// Sucht in Herstellermaterial/** nach 3D-/CAD-Dateien. GLB/glTF werden mit
// gltf-transform (Draco, WebP-Texturen ≤ 2048 px) nach
// .data/ar-viewer/hersteller/<datei>.glb optimiert – NICHT nach public/:
// Veröffentlichung erst mit schriftlicher Freigabe (Eintrag in
// src/lib/arviewer/models3d.json mit freigabe { datum, dokument }).
// FBX/OBJ/3DS/3DM/SKP/RFA müssen zuerst in Blender (bzw. Revit für RFA) nach GLB
// exportiert werden (1 Einheit = 1 m, Y oben, Boden y = 0, Vorderseite +Z) –
// das Skript listet sie mit dem nötigen Schritt auf.
//
// gltf-transform ist bewusst NICHT im Projekt installiert (kein npm-Paket für
// einen Einmal-Schritt). Aufruf über npx mit fester, abgelagerter Version.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const GLTF_TRANSFORM = "@gltf-transform/cli@4.2.1";
const ROOT = process.cwd();
const SRC = path.join(ROOT, "Herstellermaterial");
const OUT = path.join(ROOT, ".data/ar-viewer/hersteller");
const DIRECT = new Set([".glb", ".gltf"]);
const CONVERT = { ".fbx": "Blender", ".obj": "Blender", ".3ds": "Blender", ".3dm": "Rhino/Blender", ".skp": "SketchUp", ".rfa": "Revit → FBX", ".max": "3ds Max (Hersteller)", ".dwg": "nur 2D/CAD", ".dxf": "nur 2D/CAD", ".usdz": "bereits AR-fähig (iOS)", ".zip": "entpacken und erneut prüfen" };

function walk(d) {
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
}

const files = walk(SRC).filter((f) => DIRECT.has(path.extname(f).toLowerCase()) || CONVERT[path.extname(f).toLowerCase()]);
const direct = files.filter((f) => DIRECT.has(path.extname(f).toLowerCase()));
console.log(`Herstellermaterial: ${files.length} 3D-/CAD-Dateien, davon ${direct.length} direkt als glTF/GLB.`);
for (const f of files.filter((x) => !DIRECT.has(path.extname(x).toLowerCase()))) {
  console.log(`  umwandeln (${CONVERT[path.extname(f).toLowerCase()]}): ${path.relative(ROOT, f)}`);
}
if (process.argv.includes("--run")) {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of direct) {
    const out = path.join(OUT, path.basename(f).replace(/\.gltf$/i, ".glb"));
    const r = spawnSync("npx", ["--yes", GLTF_TRANSFORM, "optimize", f, out, "--compress", "draco", "--texture-compress", "webp", "--texture-size", "2048"], { stdio: "inherit", shell: true });
    console.log(r.status === 0 ? `  ok ${path.relative(ROOT, out)} (${Math.round(fs.statSync(out).size / 1024)} KB)` : `  Fehler bei ${f}`);
  }
}
