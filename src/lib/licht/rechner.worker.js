// Bodensee-Licht (N4) – Web Worker für die Sonnenberechnung (R4 technik P1-1).
// Gestartet von src/components/Licht/useLichtDaten.js mit
//   new Worker(new URL("@/lib/licht/rechner.worker.js", import.meta.url), { type: "module" })
// (Turbopack/Webpack bündeln ihn als eigene Datei). Nachricht rein:
// { id, z } (Lichtzustand), raus: { id, daten } oder { id, fehler }.
import { lichtDaten } from "./rechner.js";

self.onmessage = (e) => {
  const { id, z } = e.data || {};
  try {
    self.postMessage({ id, daten: lichtDaten(z) });
  } catch (err) {
    self.postMessage({ id, fehler: String(err?.message || err) });
  }
};
