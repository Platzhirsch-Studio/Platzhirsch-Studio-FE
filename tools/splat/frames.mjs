// tools/splat/frames.mjs – Schritt 1: Video(s) → scharfe Einzelbilder (N1, ohne Python).
//
//   node tools/splat/frames.mjs --datum 2026-11-12 --zone wohnen --stimmung tag \
//        --video D:/aufnahme/wohnen-1.mov [--video …] [--fps 3] [--kante 1600] [--behalten 0.8]
//   node tools/splat/frames.mjs … --fotos D:/aufnahme/wohnen-fotos   (Kamera-Fotos statt Video)
//
// 1. ffmpeg (NVDEC, -hwaccel cuda) zieht --fps Bilder je Sekunde, lange Kante
//    --kante px, JPEG q2, in <rohdaten>/kandidaten/.
// 2. Schärfe je Bild = Varianz des Laplace-Filters (sharp, Apache-2.0) auf
//    einer 512-px-Graustufenfassung. Aus jedem Fenster von 3 Nachbarbildern
//    bleibt das schärfste; danach fallen die unscharfen (1 − --behalten) weg
//    (3d-vr-render.md §3.1.3: „unscharfe 20 % verwerfen“).
// 3. Ergebnis in <rohdaten>/images/ (für COLMAP), Bericht frames.json.
//
// Rohdaten: $GPU_TOOLS/showroom/<datum>/<zone>/<stimmung>/ (nie im Repo).
// Personen im Bild? Vor dem nächsten Schritt prüfen und Bilder entfernen
// (Aufnahmeregel 5, Einwilligung).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { BIN, ensureDir, parseArgs, rawDir, run } from "./lib.mjs";

const argv = process.argv.slice(2);
const args = parseArgs(argv);
const videos = argv.flatMap((a, i) => (a === "--video" ? [argv[i + 1]] : []));
const { datum, zone } = args;
const stimmung = args.stimmung || "tag";
if (!datum || !zone || (!videos.length && !args.fotos)) {
  console.error("usage: node tools/splat/frames.mjs --datum JJJJ-MM-TT --zone <id> --stimmung tag|abend (--video <datei> … | --fotos <ordner>)");
  process.exit(1);
}
const FPS = Number(args.fps || 3);
const KANTE = Number(args.kante || 1600);
const BEHALTEN = Number(args.behalten || 0.8);

const root = rawDir(datum, zone, stimmung);
const kandidaten = ensureDir(path.join(root, "kandidaten"));
const images = ensureDir(path.join(root, "images"));
for (const d of [kandidaten, images]) for (const f of fs.readdirSync(d)) fs.rmSync(path.join(d, f));

// 1. Kandidaten
if (videos.length) {
  for (const [i, v] of videos.entries()) {
    const scale = `scale='if(gt(iw,ih),${KANTE},-2)':'if(gt(iw,ih),-2,${KANTE})'`;
    await run(BIN.ffmpeg, ["-hide_banner", "-loglevel", "error", "-hwaccel", "cuda", "-i", path.resolve(v), "-vf", `fps=${FPS},${scale}`, "-q:v", "2", path.join(kandidaten, `v${i}_%05d.jpg`)]);
  }
} else {
  const src = path.resolve(args.fotos);
  for (const f of fs.readdirSync(src).filter((x) => /\.(jpe?g|png|tiff?)$/i.test(x)).sort()) {
    await sharp(path.join(src, f)).rotate().resize({ width: KANTE, height: KANTE, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 95 }).toFile(path.join(kandidaten, f.replace(/\.\w+$/, ".jpg")));
  }
}

// 2. Schärfe (Laplace-Varianz)
const LAPLACE = { width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0], scale: 1, offset: 128 };
async function schaerfe(file) {
  const { data } = await sharp(file).greyscale().resize({ width: 512, height: 512, fit: "inside" }).convolve(LAPLACE).raw().toBuffer({ resolveWithObject: true });
  let sum = 0, sq = 0;
  for (let i = 0; i < data.length; i++) {
    const v = data[i] - 128;
    sum += v;
    sq += v * v;
  }
  const n = data.length;
  return sq / n - (sum / n) ** 2;
}

const files = fs.readdirSync(kandidaten).filter((f) => f.endsWith(".jpg")).sort();
const scored = [];
for (const [i, f] of files.entries()) {
  scored.push({ f, s: await schaerfe(path.join(kandidaten, f)) });
  if (i % 50 === 0) process.stdout.write(`  Schärfe ${i}/${files.length}\r`);
}
// Fenster von 3: nur das schärfste Bild
const fenster = [];
for (let i = 0; i < scored.length; i += 3) fenster.push(scored.slice(i, i + 3).sort((a, b) => b.s - a.s)[0]);
const sorted = [...fenster].sort((a, b) => b.s - a.s);
const grenze = sorted[Math.max(0, Math.floor(sorted.length * BEHALTEN) - 1)]?.s ?? 0;
const keep = fenster.filter((x) => x.s >= grenze);
for (const x of keep) fs.copyFileSync(path.join(kandidaten, x.f), path.join(images, x.f));

fs.writeFileSync(
  path.join(root, "frames.json"),
  JSON.stringify({ datum, zone, stimmung, fps: FPS, kante: KANTE, kandidaten: files.length, fenster: fenster.length, behalten: keep.length, schaerfeGrenze: grenze, erstellt: new Date().toISOString() }, null, 2),
);
console.log(`\n${files.length} Kandidaten → ${keep.length} scharfe Bilder in ${images}`);
