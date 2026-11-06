"use client";
// Client-Hilfen des Bereichs Faktura: Idempotenz-Schlüssel, Ladeanzeige (erst nach 300 ms, mindestens 600 ms),
// Enter-Sperre in den ersten 300 ms nach dem Öffnen (U-07), deutsche Datumsanzeige.

import { useCallback, useEffect, useRef, useState } from "react";

export function neuerSchluessel(praefix = "fk") {
  const z = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${praefix}:backoffice:${z}`;
}

/**
 * Laufender Vorgang mit Mindestanzeige: `laeuft` sperrt sofort (Doppelklick), `zeigen` erst nach 300 ms und dann
 * mindestens 600 ms (MASTER Q-E3, § 5 „Bucht …“).
 */
export function useVorgang() {
  const [laeuft, setLaeuft] = useState(false);
  const [zeigen, setZeigen] = useState(false);
  const sperre = useRef(false);
  const start = useCallback(async (fn) => {
    if (sperre.current) return undefined;
    sperre.current = true;
    setLaeuft(true);
    let sichtbarAb = 0;
    const t = setTimeout(() => {
      sichtbarAb = Date.now();
      setZeigen(true);
    }, 300);
    try {
      return await fn();
    } finally {
      clearTimeout(t);
      if (sichtbarAb) {
        const rest = 600 - (Date.now() - sichtbarAb);
        if (rest > 0) await new Promise((r) => setTimeout(r, rest));
      }
      sperre.current = false;
      setLaeuft(false);
      setZeigen(false);
    }
  }, []);
  return { laeuft, zeigen, start };
}

/** Enter erst 300 ms nach dem Öffnen und ohne Tastenwiederholung (§ 2.2 Dialog). */
export function useEnterSperre(offen) {
  const ab = useRef(0);
  useEffect(() => {
    if (offen) ab.current = Date.now() + 300;
  }, [offen]);
  return useCallback((e) => {
    if (e.key !== "Enter") return false;
    if (e.repeat || Date.now() < ab.current) {
      e.preventDefault();
      return true;
    }
    return false;
  }, []);
}

export function deutsch(iso) {
  const s = String(iso || "").slice(0, 10);
  const [j, m, t] = s.split("-");
  return j && m && t ? `${t}.${m}.${j}` : "–";
}

export function heuteIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function plusTage(iso, n) {
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  d.setDate(d.getDate() + Number(n || 0));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
