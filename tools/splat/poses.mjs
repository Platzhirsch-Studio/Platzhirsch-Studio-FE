// tools/splat/poses.mjs – Schritt 2: Kameraposen mit COLMAP (BSD-3, CUDA-Build, RTX 4060).
//
//   node tools/splat/poses.mjs --datum 2026-11-12 --zone wohnen --stimmung tag [--matcher sequential|exhaustive]
//
// Erwartet <rohdaten>/images/ (frames.mjs). Schreibt <rohdaten>/colmap/database.db,
// <rohdaten>/colmap/sparse/0 und – für das Training – den entzerrten Datensatz
// <rohdaten>/dataset/ (images/ + sparse/0, Kameramodell PINHOLE).
//
// COLMAP: Windows-Release „colmap-x64-windows-cuda.zip“ (github.com/colmap/colmap,
// BSD-3-Clause), entpackt nach $GPU_TOOLS/bin/colmap/ oder COLMAP_BIN setzen.
// Videos: sequential (Nachbarbilder + Loop-Erkennung), Fotos < 300: exhaustive.
// Die Optionsnamen der GPU-Schalter haben sich mit COLMAP 3.12 geändert
// (SiftExtraction.use_gpu → FeatureExtraction.use_gpu); das Skript fragt die
// Hilfe ab und nimmt den passenden Namen.
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { BIN, ensureDir, parseArgs, rawDir, run } from "./lib.mjs";

const args = parseArgs();
const { datum, zone } = args;
const stimmung = args.stimmung || "tag";
if (!datum || !zone) {
  console.error("usage: node tools/splat/poses.mjs --datum JJJJ-MM-TT --zone <id> --stimmung tag|abend [--matcher sequential|exhaustive]");
  process.exit(1);
}
const root = rawDir(datum, zone, stimmung);
const images = path.join(root, "images");
const nImages = fs.existsSync(images) ? fs.readdirSync(images).length : 0;
if (!nImages) {
  console.error(`Keine Bilder in ${images} – erst frames.mjs ausführen.`);
  process.exit(1);
}
const work = ensureDir(path.join(root, "colmap"));
const db = path.join(work, "database.db");
const sparse = ensureDir(path.join(work, "sparse"));
const dataset = path.join(root, "dataset");
fs.rmSync(db, { force: true });

const help = (cmd) =>
  new Promise((resolve) => execFile(BIN.colmap, [cmd, "-h"], { shell: /\.(bat|cmd)$/i.test(BIN.colmap), maxBuffer: 1 << 22 }, (e, out, err) => resolve(String(out) + String(err))));
const fx = await help("feature_extractor");
const gpuExtract = fx.includes("FeatureExtraction.use_gpu") ? "--FeatureExtraction.use_gpu" : "--SiftExtraction.use_gpu";
const matcher = args.matcher || (nImages < 300 ? "exhaustive" : "sequential");
const mh = await help(`${matcher}_matcher`);
const gpuMatch = mh.includes("FeatureMatching.use_gpu") ? "--FeatureMatching.use_gpu" : "--SiftMatching.use_gpu";

const t0 = Date.now();
await run(BIN.colmap, ["feature_extractor", "--database_path", db, "--image_path", images, "--ImageReader.single_camera", "1", "--ImageReader.camera_model", "OPENCV", gpuExtract, "1"]);
const matchArgs = [`${matcher}_matcher`, "--database_path", db, gpuMatch, "1"];
if (matcher === "sequential") matchArgs.push("--SequentialMatching.overlap", "15");
await run(BIN.colmap, matchArgs);
await run(BIN.colmap, ["mapper", "--database_path", db, "--image_path", images, "--output_path", sparse]);
const model = path.join(sparse, "0");
if (!fs.existsSync(model)) {
  console.error("COLMAP hat kein Modell erzeugt (zu wenig Überlappung?). Mehr Bilder, langsamer gehen, Belichtung fest.");
  process.exit(1);
}
fs.rmSync(dataset, { recursive: true, force: true });
await run(BIN.colmap, ["image_undistorter", "--image_path", images, "--input_path", model, "--output_path", dataset, "--output_type", "COLMAP"]);
// Brush erwartet sparse/0
const ds = path.join(dataset, "sparse");
if (fs.existsSync(ds) && !fs.existsSync(path.join(ds, "0"))) {
  const tmp = path.join(dataset, "sparse0");
  fs.renameSync(ds, tmp);
  ensureDir(ds);
  fs.renameSync(tmp, path.join(ds, "0"));
}
const registered = fs.existsSync(path.join(dataset, "images")) ? fs.readdirSync(path.join(dataset, "images")).length : 0;
fs.writeFileSync(path.join(root, "poses.json"), JSON.stringify({ bilder: nImages, registriert: registered, matcher, sekunden: Math.round((Date.now() - t0) / 1000) }, null, 2));
console.log(`Posen: ${registered}/${nImages} Bilder registriert → ${dataset}`);
if (registered < nImages * 0.8) console.warn("WARNUNG: < 80 % der Bilder registriert – Aufnahme prüfen (Glas, Spiegel, Bewegungsunschärfe).");
