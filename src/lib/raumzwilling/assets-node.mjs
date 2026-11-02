// src/lib/raumzwilling/assets-node.mjs — Dateien eines Raums erzeugen (Node + sharp).
// Ohne "server-only", damit auch tools/raumzwilling/*.mjs es nutzen können.
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { packeSog, entpackeSog } from "./sog.js";
import { rendereStandbild, inWelt } from "./standbild.js";
import { anwenden, bodenAusDreiPunkten, wandAlsHinten, zweiPunktMassstab } from "./massstab.js";
import { testraumMarken, zuRoh } from "./testraum.js";

/** Packt Splats als SOG und schreibt meta.json + 5 verlustfreie WebP. */
export async function schreibeSogBuendel(dir, splats) {
  await mkdir(dir, { recursive: true });
  const { meta, bilder } = packeSog(splats);
  let bytes = 0;
  for (const [name, b] of Object.entries(bilder)) {
    const buf = await sharp(Buffer.from(b.rgba.buffer, b.rgba.byteOffset, b.rgba.byteLength), { raw: { width: b.breite, height: b.hoehe, channels: 4 } })
      .webp({ lossless: true, exact: true, effort: 4 })
      .toBuffer();
    await writeFile(path.join(/*turbopackIgnore: true*/ dir, name), buf);
    bytes += buf.length;
  }
  const metaText = JSON.stringify(meta);
  await writeFile(path.join(/*turbopackIgnore: true*/ dir, "meta.json"), metaText);
  bytes += Buffer.byteLength(metaText);
  return { format: "sog", version: 2, count: meta.count, bytes, dateien: ["meta.json", ...Object.keys(bilder)] };
}

/** Liest ein SOG-Bündel (Server/Tools) zurück in Viewer-Form. */
export async function leseSogBuendel(dir) {
  const { readFile } = await import("node:fs/promises");
  const meta = JSON.parse(await readFile(path.join(/*turbopackIgnore: true*/ dir, "meta.json"), "utf8"));
  const rgba = {};
  for (const f of ["means_l.webp", "means_u.webp", "quats.webp", "scales.webp", "sh0.webp"]) {
    rgba[f] = new Uint8Array(await sharp(path.join(/*turbopackIgnore: true*/ dir, f)).ensureAlpha().raw().toBuffer());
  }
  return entpackeSog(meta, (n) => rgba[n]);
}

/** Rendert Standbilder (CPU) aus Welt-Splats und schreibt 1.webp … n.webp. */
export async function schreibeStandbilder(dir, weltSplats, standpunkte, { breite = 960, hoehe = 640 } = {}) {
  await mkdir(dir, { recursive: true });
  const out = [];
  for (let i = 0; i < standpunkte.length; i++) {
    const sp = standpunkte[i];
    const rgb = rendereStandbild(weltSplats, { auge: sp.auge, ziel: sp.ziel, fovGrad: 72, breite, hoehe });
    const file = path.join(/*turbopackIgnore: true*/ dir, `${i + 1}.webp`);
    await sharp(Buffer.from(rgb.buffer), { raw: { width: breite, height: hoehe, channels: 3 } }).webp({ quality: 82 }).toFile(file);
    out.push({ id: String(i + 1), breite, hoehe, alt: `Standbild ${i + 1}: Blick ${sp.label}`, bytes: (await stat(file)).size });
  }
  return out;
}

/**
 * Lage des synthetischen Testraums wie im Team-Werkzeug gesetzt: Maßstab an
 * der Türbreite (0,90 m), Boden aus drei Ecken, Fensterwand nach hinten.
 * `klickfehler` (m) simuliert ungenaue Klicks (Unit-Test der 2-%-Grenze).
 */
export function berechneDemoLage(klickfehler = 0, zufall = Math.random) {
  const m = testraumMarken();
  const wackel = (p) => p.map((v) => v + (zufall() - 0.5) * 2 * klickfehler);
  const roh = (k) => zuRoh(wackel(m[k]));
  const tuerA = roh("tuerLinks");
  const tuerB = roh("tuerRechts");
  const ms = zweiPunktMassstab(tuerA, tuerB, 0.9);
  let t = bodenAusDreiPunkten(roh("eckeHintenLinks"), roh("eckeHintenRechts"), roh("eckeVorneRechts"), zuRoh(m.oben), ms.faktor);
  t = wandAlsHinten(t, roh("fensterLinksUnten"), roh("fensterRechtsUnten"));
  return { transform: t, massstab: { quelle: "zwei-punkt", meter: 0.9, punkte: [tuerA, tuerB], bezeichnung: "Türlaibung" } };
}

/** Kamera-Standpunkte (Welt-Meter) aus dem Grundriss, für Viewer und Standbilder. */
export function standpunkteFuer(g) {
  const cx = (g.x0 + g.x1) / 2;
  const cz = (g.z0 + g.z1) / 2;
  const auge = 1.55;
  const r = (v) => Math.round(v * 100) / 100;
  return [
    { key: "vorne", label: "von vorne in den Raum", auge: [r(cx), auge, r(g.z1 - 0.35)], ziel: [r(cx), 1.05, r(g.z0)] },
    { key: "links", label: "von der linken Seite", auge: [r(g.x0 + 0.4), auge, r(cz + 0.2)], ziel: [r(g.x1), 1.0, r(cz - 0.3)] },
    { key: "fenster", label: "vom Fenster zurück", auge: [r(cx + 0.3), auge, r(g.z0 + 0.45)], ziel: [r(cx - 0.4), 1.0, r(g.z1)] },
  ];
}

/** Hilfsfunktion: Splats in Welt-Koordinaten (für Grundriss und Standbilder). */
export function weltSplats(entpackt, transform) {
  return inWelt(entpackt, (p) => anwenden(transform, p), transform.faktor);
}
