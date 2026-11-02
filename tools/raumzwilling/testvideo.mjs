// tools/raumzwilling/testvideo.mjs – Testvideo eines Raums mit bekannten Maßen.
//
//   node tools/raumzwilling/testvideo.mjs [--frames 240] [--dunkel] [--schnell] [--projekt TST-2026-001]
//
// Rendert den synthetischen Testraum (src/lib/raumzwilling/testraum.js, keine
// KI, keine Aufnahme, keine Kundendaten) als Handy-Rundgang in drei Höhen und
// kodiert ihn auf der RTX 4060 (h264_nvenc) als MP4. Damit lassen sich Job-Runner,
// Qualitätsprüfung (--dunkel, --schnell) und Maßstab (pruefe-massstab.mjs)
// prüfen, ohne echte Wohnräume ins Repo zu holen. Ausgabe außerhalb des Repos:
// $GPU_TOOLS/raumzwilling/test/<name>.mp4 + kamera.json (wahre Kamerapositionen).
// Mit --projekt wird zusätzlich ein Test-Raum (Kunde „TEST“) angelegt, damit
// run.mjs ihn verarbeiten kann; im Kundenportal ist er für niemanden sichtbar.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ARBEIT_ROOT, BIN, RAUM_ROOT, ensureDir, parseArgs, run } from "./lib.mjs";
import { erzeugeTestraum, zuRoh, TESTRAUM } from "../../src/lib/raumzwilling/testraum.js";
import { rendereStandbild } from "../../src/lib/raumzwilling/standbild.js";
import { neuerRaum } from "../../src/lib/raumzwilling/modell.js";

const args = parseArgs();
const N = Number(args.frames || 240);
const W = 1280;
const H = 720;
const name = `testraum${args.dunkel ? "-dunkel" : ""}${args.schnell ? "-schnell" : ""}`;
const out = ensureDir(path.join(ARBEIT_ROOT, "test", name));
const framesDir = ensureDir(path.join(out, "frames"));
for (const f of fs.readdirSync(framesDir)) fs.rmSync(path.join(framesDir, f));

const s = erzeugeTestraum({ abstand: 0.02, struktur: 0.06, licht: args.dunkel ? 0.12 : 1 });
const SH = 0.28209479177387814;
const sig = (x) => 1 / (1 + Math.exp(-x));
const daten = {
  anzahl: s.anzahl,
  positionen: s.positionen,
  skalen: s.skalenLog.map((v) => Math.exp(v)),
  farben: (() => {
    const f = new Uint8Array(s.anzahl * 4);
    for (let i = 0; i < s.anzahl; i++) {
      for (let k = 0; k < 3; k++) f[i * 4 + k] = Math.max(0, Math.min(255, Math.round((0.5 + SH * s.farbeDc[i * 3 + k]) * 255)));
      f[i * 4 + 3] = Math.round(sig(s.deckkraftLogit[i]) * 255);
    }
    return f;
  })(),
};

// Kamerapfad in Welt-Metern: drei Runden (Knie, Brust, über Kopf), Blick quer durch den Raum.
const kamera = [];
const runden = args.schnell ? 6 : 3;
for (let i = 0; i < N; i++) {
  const t = i / N;
  const runde = Math.floor(t * runden);
  const w = t * runden * Math.PI * 2;
  const hoehe = [0.7, 1.35, 1.95][runde % 3];
  const auge = [Math.cos(w) * 1.25, hoehe, Math.sin(w) * 1.0];
  const ziel = [-Math.cos(w + 0.5) * 1.9, 1.1, -Math.sin(w + 0.5) * 1.6];
  kamera.push({ auge, ziel });
}
const t0 = Date.now();
for (const [i, k] of kamera.entries()) {
  // Rendern im „Roh“-System des rekonstruierten Splats (beliebige Lage wie bei COLMAP)
  const rgb = rendereStandbild(daten, { auge: zuRoh(k.auge), ziel: zuRoh(k.ziel), fovGrad: 66, breite: W, hoehe: H, hintergrund: [0.2, 0.2, 0.2] });
  await sharp(Buffer.from(rgb.buffer), { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 1 }).toFile(path.join(framesDir, `f_${String(i).padStart(5, "0")}.png`));
  if (i % 20 === 0) process.stdout.write(`  Bild ${i}/${N}\r`);
}
console.log(`\n${N} Bilder in ${Math.round((Date.now() - t0) / 1000)} s`);
const fps = N / 80; // 80 s Video (wie ein ruhiger Rundgang)
const mp4 = path.join(out, `${name}.mp4`);
await run(BIN.ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps), "-i", path.join(framesDir, "f_%05d.png"), "-c:v", "h264_nvenc", "-cq", "21", "-pix_fmt", "yuv420p", "-r", "30", mp4]);
fs.writeFileSync(path.join(out, "kamera.json"), JSON.stringify({ testraum: TESTRAUM, fps, kamera }, null, 2));
fs.rmSync(framesDir, { recursive: true, force: true });
console.log(`Video: ${mp4} (${(fs.statSync(mp4).size / 1048576).toFixed(1)} MB)`);

if (args.projekt) {
  const dir = ensureDir(path.join(RAUM_ROOT, args.projekt));
  const r = neuerRaum({ projektId: args.projekt, customerId: "TEST", titel: "Testraum (synthetisch)" });
  r.kennzeichnung = "Synthetischer Testraum für den Job-Runner, keine Kundendaten.";
  r.einwilligung = { version: "test", am: new Date().toISOString() };
  fs.writeFileSync(path.join(dir, "raum.json"), JSON.stringify(r, null, 2));
  console.log(`Test-Raum ${args.projekt} angelegt → node tools/raumzwilling/run.mjs ${args.projekt} --video "${mp4}"`);
}
