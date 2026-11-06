"use client";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { AUTOSAVE_VERZOEGERUNG, autosaveSchritt, deuteErgebnis, uhrzeit } from "./autosave";

/**
 * Automatisches Speichern (MASTER G-09, Q-D1, Q-C4; Team P0-5b): speichert 1 s nach der letzten
 * Eingabe. Folgeänderungen während des Speicherns werden danach nachgeholt (nie zwei Läufe
 * gleichzeitig). Beim Verlassen der Seite (pagehide, visibilitychange: hidden) läuft Offenes sofort
 * – mit `beacon(werte)` über sendBeacon, sonst über `speichern`. Strg/⌘+S speichert sofort.
 *
 * @param {object} p
 * @param {(werte:any) => Promise<any>|any} p.speichern  Server Action o. Ä.; `{ok:false, message}` = Fehler
 * @param {number} [p.verzoegerung]   ms nach der letzten Eingabe (Standard 1000)
 * @param {boolean} [p.aktiv]         aus → nur manuell über `jetzt()`
 * @param {(werte:any) => boolean} [p.beacon]  Versand beim Verlassen (sendBeacon); Rückgabe true = versendet
 * @param {string|null} [p.startZeit] Uhrzeit des letzten Speicherns (z. B. aus `modified`)
 * @param {boolean} [p.tastenkuerzel] Strg/⌘+S abfangen (Standard an)
 * @returns {{status:"gespeichert"|"nicht-gespeichert"|"speichert"|"fehler", zeit:string|null, fehler:string|null,
 *   aendern:(werte:any)=>void, jetzt:()=>Promise<boolean>, verwerfen:()=>void, offen:boolean}}
 */
export function useAutosave({ speichern, verzoegerung = AUTOSAVE_VERZOEGERUNG, aktiv = true, beacon, startZeit = null, tastenkuerzel = true } = {}) {
  const [z, schritt] = useReducer(autosaveSchritt, { status: "gespeichert", zeit: startZeit, fehler: null, offen: false });
  const letzte = useRef(undefined);
  const offen = useRef(false);
  const laeuft = useRef(false);
  const timer = useRef(null);
  const speichernRef = useRef(speichern);
  const beaconRef = useRef(beacon);
  const laufRef = useRef(null);
  useEffect(() => {
    speichernRef.current = speichern;
    beaconRef.current = beacon;
  });

  const lauf = useCallback(async () => {
    clearTimeout(timer.current);
    if (laeuft.current || !offen.current) return !offen.current;
    laeuft.current = true;
    offen.current = false;
    schritt({ typ: "start" });
    let ok = false;
    try {
      const r = deuteErgebnis(await speichernRef.current?.(letzte.current));
      ok = r.ok;
      if (r.ok) schritt({ typ: "ok", zeit: uhrzeit() });
      else {
        offen.current = true;
        schritt({ typ: "fehler", fehler: r.fehler });
      }
    } catch {
      offen.current = true;
      schritt({ typ: "fehler" });
    } finally {
      laeuft.current = false;
    }
    // Änderungen während des Speicherns: gleich nachholen (bei Erfolg).
    if (ok && offen.current) timer.current = setTimeout(() => laufRef.current?.(), verzoegerung);
    return ok;
  }, [verzoegerung]);

  useEffect(() => {
    laufRef.current = lauf;
  }, [lauf]);

  const aendern = useCallback(
    (werte) => {
      letzte.current = werte;
      offen.current = true;
      schritt({ typ: "aendern" });
      clearTimeout(timer.current);
      if (aktiv) timer.current = setTimeout(lauf, verzoegerung);
    },
    [aktiv, lauf, verzoegerung]
  );

  const jetzt = useCallback(() => lauf(), [lauf]);
  const verwerfen = useCallback(() => {
    clearTimeout(timer.current);
    offen.current = false;
    schritt({ typ: "verwerfen" });
  }, []);

  // Verlassen: Offenes nie still verwerfen (Q-C4).
  useEffect(() => {
    const raus = () => {
      if (!offen.current || laeuft.current) return;
      clearTimeout(timer.current);
      if (beaconRef.current?.(letzte.current)) {
        offen.current = false;
        return;
      }
      lauf();
    };
    const sicht = () => document.visibilityState === "hidden" && raus();
    window.addEventListener("pagehide", raus);
    document.addEventListener("visibilitychange", sicht);
    return () => {
      window.removeEventListener("pagehide", raus);
      document.removeEventListener("visibilitychange", sicht);
      clearTimeout(timer.current);
    };
  }, [lauf]);

  useEffect(() => {
    if (!tastenkuerzel) return undefined;
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        lauf();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [lauf, tastenkuerzel]);

  return { status: z.status, zeit: z.zeit, fehler: z.fehler, offen: z.offen || z.status !== "gespeichert", aendern, jetzt, verwerfen };
}

export default useAutosave;
