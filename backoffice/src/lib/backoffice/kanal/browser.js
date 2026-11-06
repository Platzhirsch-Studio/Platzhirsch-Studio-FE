"use client";
// Browser-Seite des Kundendisplay-Kanals (Team P0-6).
//
// Kassa (Sender):
//   const senden = useKundendisplaySender("K1", { anrede: "aus" });
//   senden({ zustand: "einkauf", positionen, gesamt_cent, kundenkarte: { stufe, vorteile } });
// Kundendisplay (Empfänger, /kassa/display?kasse=K1):
//   const { nachricht, verbunden, quelle } = useKundendisplay("K1");   // verbunden=false → Ruhebild + „Anzeige pausiert“
//
// Gleiches Gerät (zweites Fenster): BroadcastChannel „ph-kassa-K1“ – sofort, ohne Server.
// Zweites Gerät: POST an den Kanal (`/api/kassa/display`), Empfang per SSE, Rückfall Polling 2 s.
// Der Sender schickt alle 5 s einen Puls mit der letzten Nachricht; bleibt 15 s alles still → pausiert.

import { useCallback, useEffect, useRef, useState } from "react";
import { KANAL_PFAD, PAUSE_NACH_MS, PULS_MS, bereinige, istNeuer, kanalName, kasseGueltig, nachrichtGueltig } from "./protokoll.js";

function oeffneKanal(kasse) {
  try {
    return typeof BroadcastChannel === "function" ? new BroadcastChannel(kanalName(kasse)) : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} kasse
 * @param {{anrede?: "aus"|"vorname"|"name", fern?: boolean, pfad?: string}} [opt]  fern=false: nur gleiches Gerät
 * @returns {(roh:object) => object|null} senden
 */
export function useKundendisplaySender(kasse, { anrede = "aus", fern = true, pfad = KANAL_PFAD } = {}) {
  const kanal = useRef(null);
  const letzte = useRef(null);
  const seq = useRef(0);
  useEffect(() => {
    if (!kasseGueltig(kasse)) return;
    kanal.current = oeffneKanal(kasse);
    seq.current = Date.now(); // über Neuladen hinweg aufsteigend
    const t = setInterval(() => {
      if (letzte.current) kanal.current?.postMessage({ art: "puls", nachricht: letzte.current });
    }, PULS_MS);
    return () => {
      clearInterval(t);
      kanal.current?.close();
      kanal.current = null;
    };
  }, [kasse]);

  return useCallback(
    (roh) => {
      if (!kasseGueltig(kasse)) return null;
      seq.current = Math.max(seq.current + 1, Date.now());
      const n = bereinige(roh, { anrede, seq: seq.current });
      if (!n) return null;
      letzte.current = n;
      kanal.current?.postMessage({ art: "zustand", nachricht: n });
      if (fern) {
        fetch(pfad, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kasse, nachricht: roh, anrede }), keepalive: true, cache: "no-store" }).catch(() => {
          // Netz weg: gleiches Gerät läuft weiter über den BroadcastChannel; das Fern-Display zeigt „pausiert“.
        });
      }
      return n;
    },
    [kasse, anrede, fern, pfad]
  );
}

/**
 * @param {string} kasse
 * @param {{pfad?: string, fern?: boolean, pollMs?: number, pauseNachMs?: number}} [opt]
 * @returns {{nachricht: object|null, verbunden: boolean, quelle: "kanal"|"sse"|"polling"|null}}
 */
export function useKundendisplay(kasse, { pfad = KANAL_PFAD, fern = true, pollMs = 2000, pauseNachMs = PAUSE_NACH_MS } = {}) {
  const [stand, setStand] = useState({ nachricht: null, verbunden: false, quelle: null });

  useEffect(() => {
    if (!kasseGueltig(kasse)) return;
    let aus = false;
    let es = null;
    let pollTimer = null;
    let zuletzt = 0;
    // Kanal (gleiches Gerät) und Server zählen getrennt: je Quelle die letzte seq merken.
    const seqJe = { kanal: 0, sse: 0, polling: 0 };
    const nimm = (n, quelle) => {
      if (aus || !nachrichtGueltig(n)) return;
      zuletzt = Date.now();
      if (!istNeuer(n, { seq: seqJe[quelle] })) {
        setStand((s) => (s.verbunden ? s : { ...s, verbunden: true }));
        return;
      }
      seqJe[quelle] = n.seq;
      setStand({ nachricht: n, verbunden: true, quelle });
    };
    const kanal = oeffneKanal(kasse);
    if (kanal) kanal.onmessage = (e) => (e.data?.art === "zustand" || e.data?.art === "puls") && nimm(e.data.nachricht, "kanal");

    const url = `${pfad}?kasse=${encodeURIComponent(kasse)}`;
    const polling = () => {
      if (aus || pollTimer) return;
      const runde = async () => {
        try {
          const r = await fetch(`${url}&einmal=1`, { cache: "no-store" });
          if (r.ok) {
            const d = await r.json();
            zuletzt = Date.now();
            if (d?.nachricht) nimm(d.nachricht, "polling");
            else if (!aus) setStand((s) => (s.verbunden ? s : { ...s, verbunden: true, quelle: "polling" }));
          }
        } catch {
          // still – „pausiert“ entscheidet die Wache unten
        }
        if (!aus) pollTimer = setTimeout(runde, pollMs);
      };
      runde();
    };
    if (fern && typeof EventSource === "function") {
      let offen = false;
      es = new EventSource(url);
      es.addEventListener("open", () => {
        offen = true;
        zuletzt = Date.now();
        setStand((s) => ({ ...s, verbunden: true, quelle: s.quelle || "sse" }));
      });
      es.addEventListener("zustand", (e) => {
        try {
          nimm(JSON.parse(e.data), "sse");
        } catch {
          // fehlerhafte Nachricht verwerfen
        }
      });
      es.addEventListener("error", () => {
        // Nie verbunden oder endgültig zu → Polling; sonst verbindet der Browser selbst neu (retry 2 s).
        if (es.readyState === 2 || !offen) {
          es.close();
          polling();
        }
      });
    } else if (fern) polling();

    const wache = setInterval(() => {
      const verbunden = Date.now() - zuletzt <= pauseNachMs || (es && es.readyState === 1);
      setStand((s) => (s.verbunden === verbunden ? s : { ...s, verbunden }));
    }, 1000);

    return () => {
      aus = true;
      clearInterval(wache);
      clearTimeout(pollTimer);
      es?.close();
      kanal?.close();
    };
  }, [kasse, pfad, fern, pollMs, pauseNachMs]);

  return stand;
}
