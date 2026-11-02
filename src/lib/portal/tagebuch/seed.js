// src/lib/portal/tagebuch/seed.js — Beispiel-Tagebuch fürs Mock-Portal (nur Dev/Preview).
// PRJ-2026-014 „Wohnzimmer am See“ bekommt synthetische Bilder für Lieferung,
// Montage, Vorher und Nachher: flächige Grafiken (kein Foto, keine KI, kein
// Kunde), groß beschriftet mit „BEISPIEL“. Handzeichnung, Modell und Rendering
// bleiben LEER: Kern-USP Nr. 8 verbietet nachgemachte Skizzen und Modellfotos.
// In Produktion (ohne TAGEBUCH_PREVIEW=1) oder mit dem Frappe-Adapter passiert nichts.
import "server-only";
import sharp from "sharp";
import { adapterName } from "@/lib/portal/config";
import { tagebuchAdapter } from "./adapter.js";
import { verarbeiteBild } from "./bildPipeline.js";

export const DEMO_TAGEBUCH = "PRJ-2026-014";
export const BEISPIEL_KENNZEICHNUNG = "Beispielbild: synthetische Grafik, kein Foto, kein echtes Projekt.";

export const tagebuchDemoAktiv = () =>
  adapterName() === "mock" && tagebuchAdapter().verbunden && (process.env.NODE_ENV !== "production" || process.env.TAGEBUCH_PREVIEW === "1");

const laufend = globalThis.__phTagebuchSeed || (globalThis.__phTagebuchSeed = new Map());

function svg({ nachher, titel, farbe }) {
  const moebel = nachher
    ? `<rect x="250" y="560" width="620" height="170" fill="#4f6b68"/><rect x="250" y="500" width="620" height="80" fill="#5c7a76"/>
       <rect x="960" y="610" width="260" height="120" fill="#8a8174"/><rect x="1300" y="300" width="14" height="430" fill="#30373e"/>
       <circle cx="1307" cy="290" r="52" fill="#d1b250"/><rect x="180" y="760" width="1240" height="40" fill="#d8d2c8"/>`
    : `<rect x="600" y="640" width="180" height="90" fill="#b9b2a6"/><rect x="820" y="660" width="120" height="70" fill="#c9c2b6"/>`;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1067" viewBox="0 0 1600 1067">
  <rect width="1600" height="1067" fill="${farbe}"/>
  <rect x="0" y="730" width="1600" height="337" fill="#d8d2c8"/>
  <rect x="980" y="140" width="420" height="380" fill="#faf8f4" stroke="#8a8174" stroke-width="6"/>
  <line x1="1190" y1="140" x2="1190" y2="520" stroke="#8a8174" stroke-width="6"/>
  ${moebel}
  <rect x="60" y="60" width="760" height="190" fill="#1f252b"/>
  <text x="100" y="160" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="700" fill="#faf8f4" letter-spacing="8">BEISPIEL</text>
  <text x="100" y="222" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#ece8e1">${titel}</text>
  <text x="60" y="1020" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#30373e">Synthetische Grafik, kein Foto, kein echtes Projekt</text>
</svg>`);
}

const MOTIVE = [
  { phase: "lieferung", titel: "Lieferung (Beispiel)", nachher: false, farbe: "#ece8e1", tage: -6 },
  { phase: "montage", titel: "Montage (Beispiel)", nachher: true, farbe: "#e6e1d8", tage: -5 },
  { phase: "vorher", titel: "Vorher (Beispiel)", nachher: false, farbe: "#e6e1d8", tage: -60 },
  { phase: "nachher", titel: "Nachher (Beispiel)", nachher: true, farbe: "#f7f5f1", tage: -4 },
];

async function baue(projektId) {
  const a = tagebuchAdapter();
  const fotos = [];
  for (const [i, m] of MOTIVE.entries()) {
    const png = await sharp(svg(m)).png().toBuffer();
    const bild = await verarbeiteBild(png);
    if (!bild.ok) continue;
    const id = `f-beispiel${String(i).padStart(2, "0")}`;
    for (const d of bild.dateien) await a.schreibeBild(projektId, `${id}-${d.w}.${d.fmt}`, d.daten);
    const am = new Date(Date.now() + m.tage * 86400000).toISOString();
    fotos.push({
      id,
      phase: m.phase,
      titel: m.titel,
      von: "team",
      autor: "Beispieldaten",
      hochgeladenAm: am,
      breite: bild.breite,
      hoehe: bild.hoehe,
      varianten: [...new Map(bild.dateien.map((d) => [d.w, { w: d.w, h: d.h }])).values()],
      metadatenEntfernt: true,
      gpsEntfernt: false,
      beispiel: true,
    });
  }
  return a.aendereTagebuch(projektId, async (tb) => {
    if (!tb || tb.demoAngelegt) return { tagebuch: null, ergebnis: tb };
    tb.fotos = [...fotos, ...(tb.fotos || [])];
    tb.demoAngelegt = true;
    tb.beispiel = true;
    return { tagebuch: tb, ergebnis: tb };
  });
}

/** Legt das Beispiel einmal an (parallele Aufrufe warten auf denselben Lauf). */
export async function stelleTagebuchDemoBereit(projektId, kundeId) {
  if (projektId !== DEMO_TAGEBUCH || !kundeId || !tagebuchDemoAktiv()) return null;
  const tb = await tagebuchAdapter().leseTagebuch(projektId);
  if (!tb || tb.demoAngelegt) return tb;
  if (!laufend.has(projektId)) laufend.set(projektId, baue(projektId).finally(() => laufend.delete(projektId)));
  return laufend.get(projektId);
}
