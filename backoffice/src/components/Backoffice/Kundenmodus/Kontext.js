"use client";
// Kundenmodus (G-20): schaltet die Shell auf Kundensicht – Leiste, Reiter, Palette, Glocke, Neu, Hilfe,
// Kürzel und fremde Toasts aus; interne Inhalte (<NurIntern>: Margen, EK, Notizen) verschwinden;
// Schrift eine Stufe größer; Kopf nur mit Wortmarke. Beenden über BedienerRueckkehr (Langdruck 800 ms
// auf die Wortmarke + PIN, Inhaber-Standard M-10).
// Zustand: html[data-bo-kundenmodus="an"] (CSS blendet aus, auch außerhalb der Shell) + sessionStorage
// je Tab, damit ein Seitenwechsel in der Kundensicht die Sicht nicht verlässt.

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";

export const KUNDENMODUS_SCHLUESSEL = "ph-bo:kundenmodus";
export const KUNDENMODUS_ATTRIBUT = "data-bo-kundenmodus";
export const KUNDENMODUS_EREIGNIS = "ph-bo:kundenmodus";

const Kontext = createContext({ an: false, starten: () => {}, beenden: () => {}, pinNoetig: true });

function anwenden(an) {
  const html = document.documentElement;
  if (an) html.setAttribute(KUNDENMODUS_ATTRIBUT, "an");
  else html.removeAttribute(KUNDENMODUS_ATTRIBUT);
  try {
    if (an) sessionStorage.setItem(KUNDENMODUS_SCHLUESSEL, "an");
    else sessionStorage.removeItem(KUNDENMODUS_SCHLUESSEL);
  } catch {
    // ohne Speicher gilt die Sicht bis zum nächsten Seitenaufruf
  }
  window.dispatchEvent(new CustomEvent(KUNDENMODUS_EREIGNIS, { detail: { an } }));
}

/** Ist der Kundenmodus gerade an? (für Komponenten außerhalb des Providers, z. B. Toasts) */
export function istKundenmodus() {
  return typeof document !== "undefined" && document.documentElement.getAttribute(KUNDENMODUS_ATTRIBUT) === "an";
}

/**
 * @param {{pinNoetig?:boolean, children:React.ReactNode}} props
 */
export function KundenmodusProvider({ pinNoetig = true, children }) {
  const [an, setAn] = useState(false);
  useLayoutEffect(() => {
    let gespeichert = false;
    try {
      gespeichert = sessionStorage.getItem(KUNDENMODUS_SCHLUESSEL) === "an";
    } catch {
      gespeichert = false;
    }
    if (gespeichert) {
      document.documentElement.setAttribute(KUNDENMODUS_ATTRIBUT, "an");
      setAn(true); // eslint-disable-line react-hooks/set-state-in-effect -- Zustand aus sessionStorage nach der Hydration übernehmen
    }
  }, []);
  const starten = useCallback(() => {
    anwenden(true);
    setAn(true);
    window.scrollTo({ top: 0 });
  }, []);
  const beenden = useCallback(() => {
    anwenden(false);
    setAn(false);
  }, []);
  const wert = useMemo(() => ({ an, starten, beenden, pinNoetig }), [an, starten, beenden, pinNoetig]);
  return <Kontext.Provider value={wert}>{children}</Kontext.Provider>;
}

/** { an, starten, beenden, pinNoetig } */
export function useKundenmodus() {
  return useContext(Kontext);
}
