"use client";
// Küchenplaner – Sprache der Oberfläche (DE, EN, FR, IT). Die Seite (Server)
// reicht das Wörterbuch NUR der aktuellen Sprache als kompaktes Objekt herein
// (src/lib/kuechenplaner/copy/index.js → kpClientCopy); Deutsch braucht keins.
// useKpT() liefert t(text, vars) aus src/lib/kuechenplaner/i18n.js – ohne
// Provider (Tests, alte Einbindung) bleibt alles deutsch.
import { createContext, useContext, useMemo } from "react";
import { createKpT, kpIdentity } from "../../../lib/kuechenplaner/i18n";

const KpCopyContext = createContext(kpIdentity);

export function KpCopyProvider({ copy = null, children }) {
  const t = useMemo(() => (copy ? createKpT(copy) : kpIdentity), [copy]);
  return <KpCopyContext.Provider value={t}>{children}</KpCopyContext.Provider>;
}

/** Übersetzer der aktuellen Sprache (t.locale = "de" | "en" | "fr" | "it"). */
export function useKpT() {
  return useContext(KpCopyContext);
}
