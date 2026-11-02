// tools/splat/train.mjs – Schritt 3: Gaussian Splat trainieren mit Brush (Apache-2.0, Rust/WebGPU, kein Python).
//
//   node tools/splat/train.mjs --datum 2026-11-12 --zone wohnen --stimmung tag \
//        [--schritte 30000] [--max 2500000] [--aufloesung 1600] [--sh 3]
//
// Erwartet <rohdaten>/dataset/ (poses.mjs: images/ + sparse/0). Schreibt
// <rohdaten>/train/zone.ply (Endstand) und Zwischenstände alle 5000 Schritte.
//
// Brush v0.3.0 (github.com/ArthurBrussee/brush, Windows-Release
// brush-app-x86_64-pc-windows-msvc.zip, SHA-256 b68e3e9c…bcfcd6 geprüft),
// entpackt nach $GPU_TOOLS/bin/brush/ oder BRUSH_BIN setzen. Läuft über
// WebGPU (Vulkan/D3D12) auf der RTX 4060; Ziel 1–3 Mio. Gaussians je Zone in
// 8 GB VRAM (--max). Bei Speichermangel --aufloesung 1280 oder --max 1500000.
// --viewer öffnet die Brush-Oberfläche zum Zusehen.
//
// Danach: Bereinigung in SuperSplat (MIT, superspl.at/editor oder lokal):
// Schwebeartefakte löschen, Zone zuschneiden, Boden ausrichten, auf die
// Messmarken skalieren, Personen/Kundendaten/Kunstwerke Dritter entfernen,
// als PLY speichern → tools/splat/pack.mjs.
import fs from "node:fs";
import path from "node:path";
import { BIN, ensureDir, parseArgs, rawDir, run } from "./lib.mjs";

const args = parseArgs();
const { datum, zone } = args;
const stimmung = args.stimmung || "tag";
if (!datum || !zone) {
  console.error("usage: node tools/splat/train.mjs --datum JJJJ-MM-TT --zone <id> --stimmung tag|abend [--schritte 30000] [--max 2500000]");
  process.exit(1);
}
const root = rawDir(datum, zone, stimmung);
const dataset = path.join(root, "dataset");
if (!fs.existsSync(path.join(dataset, "sparse", "0"))) {
  console.error(`Kein COLMAP-Datensatz in ${dataset} – erst poses.mjs ausführen.`);
  process.exit(1);
}
const out = ensureDir(path.join(root, "train"));
const steps = String(args.schritte || 30000);
const t0 = Date.now();
await run(BIN.brush, [
  dataset,
  "--total-steps", steps,
  "--max-splats", String(args.max || 2_500_000),
  "--max-resolution", String(args.aufloesung || 1600),
  "--sh-degree", String(args.sh || 3),
  "--export-every", "5000",
  "--export-path", out,
  "--export-name", "zone_{iter}.ply",
  "--eval-split-every", "16",
  ...(args.viewer ? ["--with-viewer"] : []),
]);
const last = path.join(out, `zone_${steps}.ply`);
if (fs.existsSync(last)) fs.copyFileSync(last, path.join(out, "zone.ply"));
fs.writeFileSync(path.join(root, "train.json"), JSON.stringify({ schritte: Number(steps), max: Number(args.max || 2_500_000), minuten: Math.round((Date.now() - t0) / 60000), ply: path.join(out, "zone.ply") }, null, 2));
console.log(`Training fertig → ${path.join(out, "zone.ply")} (weiter: SuperSplat-Bereinigung, dann pack.mjs)`);
