"use client";
// Ein Ereignisstrom je Tab (G-15): /api/ereignisse als Server-Sent Events, gemeinsam für alle
// Abonnenten (Glocke, Sitzungs-Hinweis). Start 4 s nach dem Laden (die Seite ist dann zur Ruhe
// gekommen, QA-Werkzeuge warten auf „networkidle“), Pause bei verborgenem Tab. Scheitert der Strom
// zweimal, fragt der Tab alle 60 s per ?einmal=1 (Rückfall-Polling).

import { useEffect, useRef } from "react";

const START_MS = 4000;
const POLL_MS = 60_000;

const zustand = { abos: new Set(), quelle: null, poll: null, start: null, fehler: 0 };

function verteile(art, daten) {
  for (const a of zustand.abos) a.current?.[art]?.(daten);
}

function stoppen() {
  zustand.quelle?.close();
  zustand.quelle = null;
  clearInterval(zustand.poll);
  zustand.poll = null;
  clearTimeout(zustand.start);
  zustand.start = null;
}

async function einmal() {
  try {
    const r = await fetch("/api/ereignisse?einmal=1", { headers: { Accept: "application/json" }, cache: "no-store" });
    if (r.status === 401) return verteile("onSitzung", { abgelaufen: true });
    const d = await r.json();
    if (d?.ok) verteile("onGlocke", d);
  } catch {
    // offline – nächster Takt
  }
}

function verbinden() {
  if (typeof window === "undefined" || document.visibilityState === "hidden" || zustand.quelle || zustand.poll) return;
  if (typeof EventSource === "undefined" || zustand.fehler >= 2) {
    zustand.poll = setInterval(einmal, POLL_MS);
    return;
  }
  const q = new EventSource("/api/ereignisse");
  zustand.quelle = q;
  q.addEventListener("glocke", (e) => {
    zustand.fehler = 0;
    try {
      verteile("onGlocke", JSON.parse(e.data));
    } catch {
      // ungültige Zeile ignorieren
    }
  });
  q.addEventListener("sitzung", () => verteile("onSitzung", { abgelaufen: true }));
  q.onerror = () => {
    // Der Browser verbindet sich selbst neu (retry); bei geschlossener Quelle zählt es als Fehler.
    if (q.readyState === EventSource.CLOSED) {
      zustand.quelle = null;
      zustand.fehler += 1;
      setTimeout(verbinden, 5000);
    }
  };
}

function sichtbarkeit() {
  if (document.visibilityState === "hidden") {
    zustand.quelle?.close();
    zustand.quelle = null;
    clearInterval(zustand.poll);
    zustand.poll = null;
  } else if (zustand.abos.size) verbinden();
}

/**
 * Ereignisse abonnieren: { onGlocke({anzahl, stand}), onSitzung({abgelaufen}) }.
 * @param {{onGlocke?:Function, onSitzung?:Function}} handler
 */
export function useEreignisse(handler) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    zustand.abos.add(ref);
    if (zustand.abos.size === 1) {
      document.addEventListener("visibilitychange", sichtbarkeit);
      zustand.start = setTimeout(verbinden, START_MS);
    }
    return () => {
      zustand.abos.delete(ref);
      if (!zustand.abos.size) {
        document.removeEventListener("visibilitychange", sichtbarkeit);
        stoppen();
      }
    };
  }, []);
}
