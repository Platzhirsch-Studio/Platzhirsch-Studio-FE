"use client";
// Gemeinsamer Zustand der Shell für Bausteine unterhalb (Erstbesuch, Bereichsseiten):
// Benutzer-Hash (für Speicherschlüssel je Person, ohne Klarnamen im Browser-Speicher), Modus.
import { createContext, useContext } from "react";

const Kontext = createContext({ benutzerHash: "", modus: "mock" });

export function ShellProvider({ wert, children }) {
  return <Kontext.Provider value={wert}>{children}</Kontext.Provider>;
}

/** { benutzerHash, modus } – außerhalb der Shell leere Standardwerte. */
export function useShell() {
  return useContext(Kontext);
}
