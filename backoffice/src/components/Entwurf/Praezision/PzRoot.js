"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Themen-Wurzel des Entwurfs: System (prefers-color-scheme) als Standard,
// Umschalter setzt data-theme nur auf diese Hülle (nicht auf <html>).
const ThemaKontext = createContext({ thema: "system", setThema: () => {} });
export const useThema = () => useContext(ThemaKontext);

const SCHLUESSEL = "pz-thema";

export default function PzRoot({ className, children }) {
  const [thema, setThemaState] = useState("system");

  useEffect(() => {
    try {
      const url = new URL(window.location.href).searchParams.get("thema");
      const gespeichert = window.localStorage.getItem(SCHLUESSEL);
      const wert = url || gespeichert;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- einmaliges Lesen der Vorliebe nach dem Mount
      if (wert === "light" || wert === "dark") setThemaState(wert);
    } catch {}
  }, []);

  const setThema = useCallback((wert) => {
    setThemaState(wert);
    try {
      if (wert === "system") window.localStorage.removeItem(SCHLUESSEL);
      else window.localStorage.setItem(SCHLUESSEL, wert);
    } catch {}
  }, []);

  return (
    <ThemaKontext.Provider value={{ thema, setThema }}>
      <div className={`pz ${className || ""}`} data-theme={thema === "system" ? undefined : thema}>
        {children}
      </div>
    </ThemaKontext.Provider>
  );
}
