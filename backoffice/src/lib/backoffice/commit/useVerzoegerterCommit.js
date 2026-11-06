"use client";
// Client-API des verzögerten Commits (G-03, Team P0-3).
//
//   const { starte, flush, ausstehend } = useVerzoegerterCommit();
//   const r = await anfrageAnnehmenAction({ name });               // Bereichs-Action → planeCommit()
//   if (!r.ok) return zeige(r.message, { art: "fehler" });
//   setStatus("Angenommen");                                        // optimistisch
//   starte("Anfrage angenommen", {
//     token: r.token, ms: r.ms, objekt: r.objekt,                  // objekt = Queue je Datensatz + <Ausstehend>
//     gruppe: "crm.annehmen", sammel: (n) => `${n} Anfragen angenommen`,   // gleichartige zusammenfassen
//     fehlerText: `Annehmen von ${name}`,                            // „… hat nicht geklappt – {Grund}“
//     onVerworfen: () => setStatus(alt), onFehler: () => setStatus(alt),
//   });
//   await flush({ doctype: "PH Anfrage", name });                   // vor jeder Folgeaktion am selben Datensatz
//
// Ohne ToastProvider (außerhalb von Shell/KioskShell) wird sofort ausgeführt – nie verworfen.

import { useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { CommitKontext } from "./kontext.js";
import { commitAction } from "./actions.js";
import { objektSchluessel } from "./konstanten.js";

const LEER = { version: 0, vorgaenge: [] };
const keinAbo = () => () => {};
const leer = () => LEER;

const OHNE_PROVIDER = {
  starte(text, o = {}) {
    const tokens = o.tokens || (o.token ? [o.token] : []);
    commitAction({ tokens })
      .then((r) => {
        for (const e of r?.ergebnisse || []) (e.ok ? o.onErfolg : o.onFehler)?.(e);
        if (!r?.ergebnisse?.length && r?.ok === false) o.onFehler?.(r);
      })
      .catch(() => {});
    return 0;
  },
  flush: async () => [],
  ausstehend: () => null,
  rueckgaengig: async () => null,
};

/** { starte(text, {token, ms, objekt, gruppe, sammel, fehlerText, onErfolg, onFehler, onVerworfen}), flush(objekt?), ausstehend(objekt) } */
export function useVerzoegerterCommit() {
  const q = useContext(CommitKontext);
  return useMemo(() => (q ? { starte: q.starte, flush: q.flush, ausstehend: q.ausstehend, rueckgaengig: q.rueckgaengig } : OHNE_PROVIDER), [q]);
}

/** Reaktiv: ausstehender Vorgang zu einem Objekt ({ rest, frist, pausiert, zustand, text } | null). */
export function useAusstehend(objekt) {
  const q = useContext(CommitKontext);
  const schluessel = objektSchluessel(objekt);
  const snap = useSyncExternalStore(q ? q.abonniere : keinAbo, q ? q.schnappschuss : leer, leer);
  return useMemo(() => {
    if (!schluessel) return null;
    return snap.vorgaenge.find((v) => (v.zustand === "wartet" || v.zustand === "laeuft" || v.zustand === "verwirft") && v.objekte.includes(schluessel)) || null;
  }, [snap, schluessel]);
}

/**
 * Auf Ereignisse der Warteschlange hören: { art: "neu"|"aktualisiert"|"fertig"|"fehler"|"netz"|"verworfen"|…, vorgang, ergebnisse? }.
 * @param {(e:object)=>void} fn
 */
export function useCommitEreignis(fn) {
  const q = useContext(CommitKontext);
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => (q ? q.hoere((e) => ref.current?.(e)) : undefined), [q]);
}
