// Schritt 2 von 3: hochskalierte Quellen (Schritt 1, GPU) → Basis 1000 × 1500 (2:3).
//   Schritt 1: <gpu-tools>\.venv\Scripts\python.exe -I <gpu-tools>\scripts\hochskalieren.py QUELLEN HOCH --faktor 2 --fp16 --format png
//              (QUELLEN = Kopien der Originale aus data.js „quelle“, benannt nach „basis“)
//   Schritt 2: node basis-zuschnitt.mjs HOCH   → public/preview/pinterest/basis/<basis>.webp
//   Schritt 3: node render-pins.mjs            → public/preview/pinterest/<id>.webp (+ -600)
// Nur Zuschnitt und Skalierung, keine generativen Inhalte. EXIF nennt Quelle und Bearbeitung.
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const require = createRequire(path.join(ROOT, "package.json"));
const sharp = require("sharp");
const { PINS } = await import(pathToFileURL(path.join(ROOT, "src/components/Preview/pinterest/data.js")).href);

const [hoch] = process.argv.slice(2);
if (!hoch) { console.error("usage: node basis-zuschnitt.mjs <ordner-hochskaliert>"); process.exit(1); }
const OUT = path.join(ROOT, "public/preview/pinterest/basis");
fs.mkdirSync(OUT, { recursive: true });
const W = 1000, H = 1500;
for (const pin of PINS.filter((p) => p.basis)) {
  const file = fs.readdirSync(hoch).find((f) => (f.startsWith(pin.basis + ".") || f.startsWith(pin.basis + "_x")));
  if (!file) { console.warn("fehlt:", pin.basis); continue; }
  const img = sharp(path.join(hoch, file));
  const { width, height } = await img.metadata();
  const s = Math.max(W / width, H / height);
  const sw = Math.round(width * s), sh = Math.round(height * s);
  const [fx, fy] = (pin.fokus || "50% 50%").split(" ").map((v) => parseFloat(v) / 100);
  const left = Math.round((sw - W) * fx), top = Math.round((sh - H) * fy);
  await sharp(path.join(hoch, file))
    .resize(sw, sh, { kernel: "lanczos3" })
    .extract({ left, top, width: W, height: H })
    .withExif({ IFD0: { ImageDescription: `Pinterest-Vorschau ${pin.id}. Quelle: ${pin.credit}. Bearbeitung: ${pin.bearbeitung}`, Copyright: pin.credit, Software: "Real-ESRGAN x2plus + sharp" } })
    .webp({ quality: 88 })
    .toFile(path.join(OUT, `${pin.basis}.webp`));
  console.log(pin.id, `${width}x${height} → ${W}x${H} (Skala ${s.toFixed(2)})`);
}
