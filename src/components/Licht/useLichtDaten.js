"use client";
// Bodensee-Licht (N4) – Sonnenwerte der Seite aus dem Web Worker
// (R4 technik P1-1). Das erste Ergebnis kommt vom Server (page.js →
// lichtDaten(start)), damit beim Hydrieren nichts gerechnet wird. Jede
// Änderung geht an src/lib/licht/rechner.worker.js; bis die Antwort da ist
// (wenige ms), bleiben die letzten Werte stehen. Startet der Worker nicht
// (alter Browser, CSP), rechnet ein Rückfall im Hauptthread nach dem Frame.
import { useEffect, useRef, useState } from "react";
import { datenSchluessel, lichtDaten } from "@/lib/licht/rechner";

export function useLichtDaten(z, startDaten) {
  const [daten, setDaten] = useState(() => startDaten || lichtDaten(z));
  const workerRef = useRef(undefined); // undefined = noch nicht versucht, null = keiner
  const idRef = useRef(0);
  const schluessel = datenSchluessel(z);

  useEffect(() => {
    if (daten.schluessel === schluessel) return undefined;
    const id = ++idRef.current;
    if (workerRef.current === undefined) {
      try {
        workerRef.current = new Worker(new URL("../../lib/licht/rechner.worker.js", import.meta.url), { type: "module" });
      } catch {
        workerRef.current = null;
      }
    }
    const w = workerRef.current;
    let fertig = false;
    const sync = () => {
      if (fertig || id !== idRef.current) return;
      fertig = true;
      setDaten(lichtDaten(z));
    };
    if (!w) {
      const t = setTimeout(sync, 0);
      return () => clearTimeout(t);
    }
    const onMessage = (e) => {
      if (e.data?.id !== id || fertig) return;
      fertig = true;
      if (e.data.daten) setDaten(e.data.daten);
      else sync();
    };
    const onError = () => {
      workerRef.current = null;
      fertig = false;
      sync();
    };
    w.addEventListener("message", onMessage);
    w.addEventListener("error", onError);
    w.postMessage({ id, z });
    return () => {
      w.removeEventListener("message", onMessage);
      w.removeEventListener("error", onError);
    };
  }, [schluessel]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => workerRef.current?.terminate?.(), []);

  return daten;
}
