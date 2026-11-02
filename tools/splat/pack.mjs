// tools/splat/pack.mjs – Schritt 5: bereinigtes PLY → SOG mit LOD-Stufen + Manifest.
//
//   node tools/splat/pack.mjs --ply <bereinigt.ply> --zone <id> --stimmung tag|abend
//        [--box x,y,z,X,Y,Z] [--drehung w,x,y,z] [--lo 35%] [--test]
//
// Ablauf (splat-transform, MIT, PlayCanvas; GPU: RTX 4060 über WebGPU/Dawn):
//   1. NaN/Inf entfernen, optional auf die Zone zuschneiden (--box, Meter)
//      und Schwebeartefakte filtern (--filter-floaters).
//   2. Höhere Kugelflächen-Bänder auf 1 kürzen (Größe), Morton-Reihenfolge.
//   3. Zwei Stufen schreiben:
//        lo.sog  erste Ansicht, schwache Geräte  (Standard 35 % der Gaussians)
//        hi.sog  volle Stufe, lädt nur auf starken Geräten nach
//   4. Manifest src/lib/showroom/manifest.json aktualisieren (Bytes, Anzahl).
//      --test schreibt in den Eintrag "testszene" (nur Entwicklung).
//
// Budgets (neuland.md §2.4): lo.sog ≤ 20 MB (erster Download), Zone gesamt
// so klein wie möglich; das Skript warnt bei Überschreitung.
//
// Voraussetzung Windows ohne VC++-Redistributable: dawn.node braucht
// vcruntime140*.dll/msvcp140*.dll neben sich (Workaround wie gpu-pipeline.md
// Schritt 4): DLLs aus $GPU_TOOLS/.venv nach node_modules/webgpu/dist/win32-x64/
// kopieren. Ohne GPU: --gpu cpu (langsamer).
import fs from "node:fs";
import path from "node:path";
import { BIN, ensureDir, mb, parseArgs, publicUrl, readManifest, run, webDir, writeManifest } from "./lib.mjs";

const LO_BUDGET = 20 * 1024 * 1024;
const args = parseArgs();
const ply = args.ply && path.resolve(args.ply);
const zone = args.zone;
const stimmung = args.stimmung || "tag";
if (!ply || !fs.existsSync(ply) || !zone || !["tag", "abend"].includes(stimmung)) {
  console.error("usage: node tools/splat/pack.mjs --ply <datei.ply> --zone <id> --stimmung tag|abend [--box …] [--drehung w,x,y,z] [--lo 35%] [--test]");
  process.exit(1);
}

const outDir = ensureDir(webDir(zone, stimmung));
const lo = path.join(outDir, "lo.sog");
const hi = path.join(outDir, "hi.sog");
const gpu = args.gpu ? ["-g", String(args.gpu)] : [];

const clean = ["-N"];
if (args.box) clean.push("-B", String(args.box));
if (!args["ohne-floater-filter"] && !args.test) clean.push("-F");

const st = (input, actions, output, more = []) =>
  run(process.execPath, [BIN.splatTransform, "-w", "--no-tty", ...gpu, input, ...actions, output, ...more]);

// Zwischenstufe: gereinigt, SH ≤ 1, Morton-Reihenfolge (eine Datei, aus der beide Stufen entstehen).
const tmp = path.join(path.dirname(ply), `${path.basename(ply, ".ply")}.web.ply`);
await st(ply, [...clean, "-H", "1", "-m"], tmp);
await st(tmp, [], hi);
// --decimate muss die letzte Aktion mit PLY-Ausgabe sein (splat-transform 3.10).
const tmpLo = tmp.replace(/\.web\.ply$/, ".lo.ply");
await st(tmp, ["--decimate-adaptive", String(args.lo || "35%")], tmpLo);
await st(tmpLo, ["-m"], lo);
fs.rmSync(tmp, { force: true });
fs.rmSync(tmpLo, { force: true });

/** Anzahl Gaussians aus dem --info-Bericht (json). */
async function count(file) {
  const { execFile } = await import("node:child_process");
  return new Promise((resolve) => {
    execFile(process.execPath, [BIN.splatTransform, "-q", file, "--info", "json", "null"], { maxBuffer: 1 << 24 }, (err, stdout) => {
      if (err) return resolve(null);
      const m = String(stdout).match(/"(?:numSplats|count|gaussians|numGaussians)"\s*:\s*(\d+)/);
      resolve(m ? Number(m[1]) : null);
    });
  });
}

const lod = [];
for (const [id, file] of [["lo", lo], ["hi", hi]]) {
  const bytes = fs.statSync(file).size;
  lod.push({ id, url: publicUrl(file), bytes, gaussians: await count(file) });
  console.log(`${id}: ${mb(bytes)} (${publicUrl(file)})`);
}
// „Erste Ansicht ≤ 4 s auf Fast 4G“ (≈ 9 Mbit/s, 150 ms RTT) heißt praktisch lo.sog ≤ ~3,5 MB
// (Messung Testszene: 0,95 MB → 2,4 s mit 4× CPU-Drossel). 20 MB ist die harte Obergrenze.
if (lod[0].bytes > 3.5 * 1024 * 1024) console.warn(`HINWEIS: lo.sog ${mb(lod[0].bytes)} – erste Ansicht auf Fast 4G über 4 s; --lo kleiner (z. B. 15%) oder Zone teilen.`);
if (lod[0].bytes > LO_BUDGET) console.warn(`WARNUNG: lo.sog ${mb(lod[0].bytes)} > 20 MB Erstdownload-Budget – --lo kleiner wählen oder Zone zuschneiden.`);

const manifest = readManifest();
const drehung = args.drehung ? String(args.drehung).split(",").map(Number) : undefined;
const write = (zoneObj) => {
  zoneObj.stimmungen = zoneObj.stimmungen || {};
  zoneObj.stimmungen[stimmung] = { ...(zoneObj.stimmungen[stimmung] || {}), lod, gepackt: new Date().toISOString().slice(0, 10) };
  if (drehung) zoneObj.drehung = drehung;
};
if (args.test) {
  manifest.testszene = manifest.testszene || { id: zone, drehung: [1, 0, 0, 0], stimmungen: {} };
  write(manifest.testszene);
} else {
  manifest.zonen = manifest.zonen || [];
  let z = manifest.zonen.find((x) => x.id === zone);
  if (!z) manifest.zonen.push((z = { id: zone, drehung: drehung || [1, 0, 0, 0], stimmungen: {} }));
  write(z);
}
writeManifest(manifest);
console.log(`Manifest aktualisiert: ${args.test ? "testszene" : `zonen/${zone}`} · ${stimmung}`);
