// Sofaplaner 3D – bereitet die CC0-Bezugstexturen (Poly Haven, 1k JPG) für das
// Web auf: Normal- und Rauheitskarte je Materialfamilie als WebP in 1024 und
// 512 px, plus das Innenraum-HDRI. Quellen + Lizenz: docs/bildquellen/QUELLEN.md.
//
//   node tools/sofaplaner-3d/prepare-textures.mjs <ordner-mit-polyhaven-downloads>
//
// Erwartet <asset>_nor_gl_1k.jpg / <asset>_rough_1k.jpg und brown_photostudio_02_1k.hdr.
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const TEXTURE_ASSETS = {
  stoff: "rough_linen",
  struktur: "terry_cloth",
  samt: "velour_velvet",
  leder: "leather_white",
  nubuk: "scuba_suede",
  outdoor: "hessian_380",
};
export const HDRI = "brown_photostudio_02_1k.hdr";

async function main() {
  const src = process.argv[2];
  if (!src) throw new Error("Ordner mit den Poly-Haven-Downloads angeben");
  const root = path.resolve(import.meta.dirname, "../../public/labs/sofaplaner");
  await mkdir(path.join(root, "tex"), { recursive: true });
  await mkdir(path.join(root, "hdri"), { recursive: true });
  for (const [key, asset] of Object.entries(TEXTURE_ASSETS)) {
    for (const [map, file] of [
      ["nor", `${asset}_nor_gl_1k.jpg`],
      ["rough", `${asset}_rough_1k.jpg`],
    ]) {
      for (const size of [1024, 512]) {
        let img = sharp(path.join(src, file)).resize(size, size);
        if (map === "rough") img = img.grayscale();
        const out = path.join(root, "tex", `${key}-${map}-${size}.webp`);
        await img.webp({ quality: map === "nor" ? 90 : 82 }).toFile(out);
        console.log(out);
      }
    }
  }
  await copyFile(path.join(src, HDRI), path.join(root, "hdri", "interior.hdr"));
}

if (process.argv[1] && import.meta.filename === process.argv[1]) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
