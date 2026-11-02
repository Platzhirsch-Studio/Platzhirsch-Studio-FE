// Feste Bildgrößen der Leistungs-Karten (P6 Runde 2, r2-technik P1-2).
//
//   node src/components/Labs/Hub/tools/variants.mjs
//   → public/bilder/leistungen/<id>-<breite>.avif und .webp (Breiten aus HUB_WIDTHS,
//     Runde 5: im selben Ordner wie die Quelle, kein /labs/hub/v/ mehr)
//
// Warum: Die Karten liefen über /_next/image. Nach ~90 min Last blieb dort ein
// In-Flight-Eintrag (w=384, Accept: image/avif) hängen, die Seite feuerte nie
// „load“. Die Karten sind kleine, feste Grafiken aus eigenen Werkzeug-Ansichten
// (1200 × 800) – sie brauchen keinen Laufzeit-Optimierer. Die Varianten werden
// hier einmal lokal mit sharp erzeugt und von HubPicture.js direkt
// ausgeliefert (statisch, immutable gecacht, kein Optimizer im Pfad).
// Nach jeder Änderung eines Kartenbilds (shots.mjs) erneut ausführen.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { HUB_WIDTHS } from "../hubImage.js";

const SRC = path.resolve("public/bilder/leistungen");
const OUT = SRC;
fs.mkdirSync(OUT, { recursive: true });

let total = 0;
// Nur Quellen (<id>.webp), nicht die erzeugten Größen (<id>-<breite>.webp).
for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith(".webp") && !/-\d+\.webp$/.test(f))) {
  const id = file.replace(/\.webp$/, "");
  for (const w of HUB_WIDTHS) {
    const base = sharp(path.join(SRC, file)).resize({ width: w, withoutEnlargement: true });
    const avif = await base.clone().avif({ quality: 55, effort: 6 }).toBuffer();
    const webp = await base.clone().webp({ quality: 78, effort: 6 }).toBuffer();
    fs.writeFileSync(path.join(OUT, `${id}-${w}.avif`), avif);
    fs.writeFileSync(path.join(OUT, `${id}-${w}.webp`), webp);
    total += avif.length + webp.length;
    console.log(`${id}-${w}: avif ${avif.length} B, webp ${webp.length} B`);
  }
}
console.log(`fertig, ${(total / 1024).toFixed(0)} KB gesamt in ${path.relative(process.cwd(), OUT)}`);
