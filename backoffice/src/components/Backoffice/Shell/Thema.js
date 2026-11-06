"use client";
// Hell · Dunkel · System (G-26, Lounge § 3): html[data-theme="light"|"dark"], ohne Attribut = System.
// Speicher wie die Vorlieben von P0-8 (auth/vorlieben.js): localStorage + Cookie `ph_bo_theme` mit den Werten
// „hell“ | „dunkel“ | „system“; das Benutzermenü speichert zusätzlich je Person (vorliebeSpeichernAction).
// Vor dem ersten Paint setzen THEMA_SKRIPT und DICHTE_SKRIPT das Attribut – eingefügt über
// useServerInsertedHTML in den <head> des Server-HTML (Leitfaden „preventing-flash-before-hydration“),
// damit das Wurzel-Layout unverändert bleiben kann. Bei Client-Navigation läuft nichts doppelt.

import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { DICHTE_SKRIPT } from "../Segment";

export const THEMA_SCHLUESSEL = "ph_bo_theme";
export const THEMA_WERTE = ["light", "dark", "system"];
/** Attributwert (light/dark/system) ↔ Vorlieben-Wert (hell/dunkel/system). */
export const ALS_VORLIEBE = { light: "hell", dark: "dunkel", system: "system" };
const AUS_VORLIEBE = { hell: "light", dunkel: "dark", light: "light", dark: "dark" };

export const THEMA_SKRIPT = `(function(){try{var t=localStorage.getItem("${THEMA_SCHLUESSEL}");var a=t==="hell"||t==="light"?"light":t==="dunkel"||t==="dark"?"dark":"";if(a)document.documentElement.setAttribute("data-theme",a)}catch(e){}})()`;

const zuhoerer = new Set();

function lesen() {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" || t === "dark" ? t : "system";
}

/** Thema setzen (auch außerhalb von React). */
export function setzeThema(wert) {
  const w = THEMA_WERTE.includes(wert) ? wert : "system";
  const html = document.documentElement;
  if (w === "system") html.removeAttribute("data-theme");
  else html.setAttribute("data-theme", w);
  try {
    if (w === "system") localStorage.removeItem(THEMA_SCHLUESSEL);
    else localStorage.setItem(THEMA_SCHLUESSEL, ALS_VORLIEBE[w]);
  } catch {
    // privater Modus: gilt bis zum Neuladen
  }
  document.cookie = `${THEMA_SCHLUESSEL}=${ALS_VORLIEBE[w]}; path=/; max-age=31536000; SameSite=Lax`;
  zuhoerer.forEach((f) => f());
}

/** Ist gerade dunkel sichtbar (Schalter oder System)? */
export function istDunkel() {
  const t = lesen();
  return t === "dark" || (t === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
}

/** [thema, setzen] – Server/Hydration: „system“. */
export function useThema() {
  const wert = useSyncExternalStore(
    (f) => {
      zuhoerer.add(f);
      const speicher = (e) => e.key === THEMA_SCHLUESSEL && f();
      window.addEventListener("storage", speicher);
      return () => {
        zuhoerer.delete(f);
        window.removeEventListener("storage", speicher);
      };
    },
    lesen,
    () => "system"
  );
  return [wert, setzeThema];
}

/**
 * Skripte vor dem ersten Paint (nur Server-HTML). Zusätzlich: React setzt <html>-Attribute beim
 * Strict-Mode-Remount in der Entwicklung zurück – einmal erneut anwenden.
 */
export function ThemaSkripte() {
  const eingefuegt = useRef(false);
  useServerInsertedHTML(() => {
    if (eingefuegt.current) return null;
    eingefuegt.current = true;
    return <script id="ph-bo-thema" dangerouslySetInnerHTML={{ __html: `${THEMA_SKRIPT};${DICHTE_SKRIPT}` }} />;
  });
  useLayoutEffect(() => {
    try {
      const t = AUS_VORLIEBE[localStorage.getItem(THEMA_SCHLUESSEL)];
      if (t && document.documentElement.getAttribute("data-theme") !== t) {
        document.documentElement.setAttribute("data-theme", t);
        zuhoerer.forEach((f) => f());
      }
    } catch {
      // ohne Speicher bleibt System
    }
  }, []);
  return null;
}
