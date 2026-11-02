// node src/lib/stilfinder/materials/make-materials.mjs <ambientCG-Color-Ordner> [key …]
//
// Erzeugt die Materialbilder der Moodboard-Präsentation (QA Runde 1, P1.3)
// aus CC0-Texturen von ambientCG (https://ambientcg.com, Lizenz CC0 1.0,
// keine Namensnennung nötig – wir nennen die Quelle trotzdem im PDF).
// Eingabe: entpackte 1K-JPG-Pakete, je Material die Datei "<Asset>_1K-JPG_Color.jpg".
// Ausgabe: src/lib/stilfinder/materials/<key>.jpg, 4:5, 720 × 900 px.
// Bearbeitung: Zuschnitt 4:5, weiches Streiflicht (Lichtverlauf), bei Metall
// und Samt eine Einfärbung der Graustufen-Struktur (Ton steht in MATERIALS).
// Abnahme Runde 3, P3.3: Samt bekommt zusätzlich einen Faltenwurf mit Glanz
// auf den Graten (Option `folds`), sonst wirkt er wie eine Farbfläche ohne
// Flor. Der Faltenwurf ist ein SVG-Lichtfilter (feTurbulence + Diffus- und
// Glanzlicht), deterministisch über `seed`. Mit [key …] nur diese Motive.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { MATERIAL_TEXTURES } from "../materials.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const [srcDir, ...only] = process.argv.slice(2);
if (!srcDir) {
  console.error("Pfad zum Ordner mit den *_Color.jpg fehlt");
  process.exit(1);
}
const W = 720;
const H = 900;

const light = (strength = 0.28, sheen = false) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="l" cx="0.18" cy="0.12" r="1.05">
      <stop offset="0" stop-color="#fff" stop-opacity="${strength}"/>
      <stop offset="0.55" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="${strength * 1.15}"/>
    </radialGradient>
    <linearGradient id="s" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0.30" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.46" stop-color="#fff" stop-opacity="0.32"/>
      <stop offset="0.60" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#l)"/>
  ${sheen ? `<rect width="${W}" height="${H}" fill="url(#s)"/>` : ""}
</svg>`);

// Faltenwurf (P3.3): Relief aus niederfrequentem Rauschen, senkrecht gestreckt.
// Rand von P px, damit das Licht an den Bildkanten keine Fase zeichnet.
const P = 120;
const foldLayer = async (o, specular) => {
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W + 2 * P}" height="${H + 2 * P}">
<filter id="f" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
 <feTurbulence type="fractalNoise" baseFrequency="${o.freq[0]} ${o.freq[1]}" numOctaves="2" seed="${o.seed}" result="n"/>
 <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="a"/>
 <feGaussianBlur in="a" stdDeviation="10" result="b"/>
 ${
   specular
     ? `<feSpecularLighting in="b" surfaceScale="${o.scale}" specularConstant="${o.spec}" specularExponent="7" lighting-color="#f2b8bf"><feDistantLight azimuth="235" elevation="40"/></feSpecularLighting>`
     : `<feDiffuseLighting in="b" surfaceScale="${o.scale}" diffuseConstant="1.2" lighting-color="#ffffff"><feDistantLight azimuth="235" elevation="44"/></feDiffuseLighting>`
 }
</filter><rect width="${W + 2 * P}" height="${H + 2 * P}" filter="url(#f)"/></svg>`);
  return sharp(await sharp(svg).png().toBuffer())
    .extract({ left: P, top: P, width: W, height: H })
    .blur(2.5)
    .png()
    .toBuffer();
};

for (const [key, t] of Object.entries(MATERIAL_TEXTURES)) {
  if (only.length && !only.includes(key)) continue;
  const file = path.join(srcDir, `${t.asset}_1K-JPG_Color.jpg`);
  if (!fs.existsSync(file)) {
    console.warn("fehlt:", file);
    continue;
  }
  let img = sharp(file).resize(W, H, { fit: "cover", position: "centre" });
  if (t.tint) {
    const [lo, hi] = t.levels || [0.75, 30];
    img = sharp(await img.grayscale().linear(lo, hi).toBuffer()).tint(t.tint);
  } else if (t.levels) {
    img = sharp(await img.linear(t.levels[0], t.levels[1]).toBuffer());
  }
  if (t.saturation) img = sharp(await img.toBuffer()).modulate({ saturation: t.saturation });
  if (t.folds) {
    const o = t.folds;
    const flat = await sharp(await img.toBuffer())
      .toColourspace("srgb")
      .toBuffer();
    const out = await sharp(flat)
      .composite([
        { input: await foldLayer(o, false), blend: "multiply" },
        { input: await foldLayer(o, true), blend: "screen" },
      ])
      .modulate({
        brightness: o.brightness ?? 1,
        saturation: o.saturation ?? 1,
      })
      .linear(o.contrast?.[0] ?? 1, o.contrast?.[1] ?? 0)
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(here, `${key}.jpg`));
    console.log("ok", key, t.asset, "Faltenwurf", out.size);
    continue;
  }
  const base = await img.toBuffer();
  await sharp(base)
    .composite([{ input: light(t.light ?? 0.26, Boolean(t.sheen)), blend: "soft-light" }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(here, `${key}.jpg`));
  console.log("ok", key, t.asset);
}
