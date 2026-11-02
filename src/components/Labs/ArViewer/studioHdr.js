// Studio-HDR für den AR-Viewer (R4-portal-labs, Abnahme P3-8 "Glanzlichter am
// Sessel leicht speckig"). Kein Download aus fremden Quellen: Die Umgebung wird
// hier rechnerisch erzeugt (eigene Arbeit, keine Lizenzfrage) und von
// /api/labs/ar-viewer/studio-v1.hdr als Radiance-RGBE ausgeliefert.
//
// Aufbau wie ein Fotostudio: warmgraue Hohlkehle (Boden dunkler, Decke heller),
// eine große weiche Lichtwanne vorne links (Hauptlicht), ein hoher
// Streifen rechts (Aufheller), eine Deckenfläche und ein schwaches Gegenlicht.
// Alle Lichter sind groß und haben weiche Kanten: Große Flächen ergeben breite,
// ruhige Glanzlichter statt kleiner, harter Punkte auf Leder und Lack.
//
// Format: "#?RADIANCE", FORMAT=32-bit_rle_rgbe, flache (nicht lauflängen-
// kodierte) Zeilen. Three.js' RGBELoader liest flache Zeilen, wenn die erste
// Zeile nicht mit 0x02 0x02 beginnt; das gilt hier immer (Decke ≈ 0,6).
// model-viewer erkennt HDR nur an der Endung ".hdr" (keine Query anhängen!),
// deshalb steckt die Version im Pfad.

export const STUDIO_HDR_PATH = "/api/labs/ar-viewer/studio-v1.hdr";
export const STUDIO_HDR_SIZE = { w: 256, h: 128 };

const WARM = [1.0, 0.955, 0.9];
const DEG = Math.PI / 180;

const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
// Kleinster Winkelabstand zweier Azimute in Grad (−180 … 180).
const dAz = (a, b) => ((((a - b) % 360) + 540) % 360) - 180;

// Weiche rechteckige Lichtfläche: Mitte (az, el), halbe Ausdehnung (w, h) in
// Grad, Kantenweichheit soft in Grad.
function panel(az, el, { at, el: e0, w, h, soft, power }) {
  const x = Math.abs(dAz(az, at));
  const y = Math.abs(el - e0);
  return power * (1 - smooth(w - soft, w + soft, x)) * (1 - smooth(h - soft, h + soft, y));
}

const LIGHTS = [
  { at: -40, el: 32, w: 26, h: 16, soft: 9, power: 2.6 }, // Hauptlicht vorne links
  { at: 72, el: 14, w: 10, h: 28, soft: 7, power: 1.1 }, // Aufheller rechts
  { at: 175, el: 22, w: 22, h: 10, soft: 8, power: 0.55 }, // Gegenlicht
];

/** Strahldichte (linear, RGB) für eine Richtung: Azimut und Höhe in Grad. */
export function radiance(az, el) {
  // Hohlkehle: Boden 0,16, Horizont 0,36, Decke 0,6
  let base = el < 0 ? 0.16 + 0.2 * smooth(-35, 0, el) : 0.36 + 0.24 * smooth(0, 70, el);
  // Deckenfläche (großer Diffusor) ab 62° Höhe
  base += 1.1 * smooth(58, 70, el);
  for (const l of LIGHTS) base += panel(az, el, l);
  return WARM.map((c) => c * base);
}

function rgbe([r, g, b]) {
  const v = Math.max(r, g, b);
  if (v < 1e-32) return [0, 0, 0, 0];
  const e = Math.floor(Math.log2(v)) + 1; // v = m · 2^e, m ∈ [0.5, 1)
  const scale = 256 / 2 ** e;
  return [Math.floor(r * scale), Math.floor(g * scale), Math.floor(b * scale), e + 128];
}

/** Erzeugt die komplette .hdr-Datei als Uint8Array (deterministisch). */
export function buildStudioHdr({ w, h } = STUDIO_HDR_SIZE) {
  const header = new TextEncoder().encode(`#?RADIANCE\n# Platzhirsch Studio-Umgebung (rechnerisch erzeugt)\nFORMAT=32-bit_rle_rgbe\n\n-Y ${h} +X ${w}\n`);
  const out = new Uint8Array(header.length + w * h * 4);
  out.set(header, 0);
  let o = header.length;
  for (let y = 0; y < h; y++) {
    const el = 90 - ((y + 0.5) / h) * 180;
    for (let x = 0; x < w; x++) {
      const az = ((x + 0.5) / w) * 360 - 180;
      out.set(rgbe(radiance(az, el)), o);
      o += 4;
    }
  }
  return out;
}

/** Liest eine flache RGBE-Datei zurück (für Tests). */
export function parseFlatHdr(bytes) {
  const text = new TextDecoder("latin1").decode(bytes.subarray(0, 256));
  const m = text.match(/\n-Y (\d+) \+X (\d+)\n/);
  if (!text.startsWith("#?RADIANCE") || !m) throw new Error("kein Radiance-Kopf");
  const start = text.indexOf(m[0]) + m[0].length;
  const h = Number(m[1]);
  const w = Number(m[2]);
  const px = (x, y) => {
    const i = start + (y * w + x) * 4;
    const [r, g, b, e] = bytes.subarray(i, i + 4);
    const f = e ? 2 ** (e - 136) : 0;
    return [(r + 0.5) * f, (g + 0.5) * f, (b + 0.5) * f];
  };
  return { w, h, start, length: bytes.length, px };
}
