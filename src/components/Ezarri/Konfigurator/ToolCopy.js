"use client";
// Französische/italienische Texte der Ezarri-Werkzeuge (Konfigurator, Druckblatt,
// Rechner) vom Server – 01.11.2026. Die Seite gibt toolCopy(locale) aus
// src/lib/ezarri/konfigurator/copy-intl.js als `value`; auf Deutsch/Englisch
// ist value null und die Komponenten nutzen wie bisher copy.js/copy.en.js.
// So bleiben FR/IT aus dem Client-Bundle und aus src/messages/*.json.
import { createContext, useContext } from "react";

const ToolCopyContext = createContext(null);

export function ToolCopyProvider({ value, children }) {
  return <ToolCopyContext.Provider value={value || null}>{children}</ToolCopyContext.Provider>;
}

/** { lang, KONF?, RECHNER?, TABELLE? } für fr/it, sonst null. */
export function useToolCopy() {
  return useContext(ToolCopyContext);
}
