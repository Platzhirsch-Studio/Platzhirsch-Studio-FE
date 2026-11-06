"use client";
// Sitzungs-Overlay (Q-E5, G-26): 2 min vor Ablauf eine ruhige Material-Pille unten mit „Neu anmelden“;
// abgelaufen (Uhr oder Ereignisstrom meldet es) → Dialog. Die Seite bleibt stehen, Eingaben bleiben
// erhalten: Anmelden in einem neuen Fenster, danach „Ich bin wieder angemeldet“ prüft die Sitzung.

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Dialog from "../Overlay/Dialog";
import Knopf from "../Knopf";
import { useEreignisse } from "./ereignisstrom";
import { TEXTE } from "./texte";

const VORWARNUNG_MS = 120_000;

/** @param {{laeuftAb?:number|null}} props Ablaufzeitpunkt der Sitzung (ms seit 1970; Sitzung: expiresAt × 1000) */
export default function SitzungsHinweis({ laeuftAb = null }) {
  const [phase, setPhase] = useState("ok"); // ok | bald | abgelaufen
  const [pruefung, setPruefung] = useState("");

  useEffect(() => {
    if (!laeuftAb) return undefined;
    const bald = laeuftAb - VORWARNUNG_MS - Date.now();
    const ende = laeuftAb - Date.now();
    const t1 = setTimeout(() => setPhase((p) => (p === "ok" ? "bald" : p)), Math.max(0, bald));
    const t2 = setTimeout(() => setPhase("abgelaufen"), Math.max(0, ende));
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [laeuftAb]);

  useEreignisse({ onSitzung: () => setPhase("abgelaufen") });

  const pruefen = async () => {
    setPruefung("");
    try {
      const r = await fetch("/api/ereignisse?einmal=1", { cache: "no-store" });
      if (r.status === 401) return setPruefung(TEXTE.sitzungNochNicht);
      setPhase("ok");
    } catch {
      setPruefung(TEXTE.sitzungNochNicht);
    }
  };

  const pfad = usePathname();
  const login = `/login?next=${encodeURIComponent(pfad || "/")}`;
  return (
    <>
      {phase === "bald" && (
        <div className="bo-schale-sitzung bo-material-stark bo-erscheinen" role="status">
          <span>{TEXTE.sitzungBald}</span>
          <Knopf href={login} target="_blank" rel="noopener" variant="secondary" size="s">
            {TEXTE.sitzungNeuAnmelden}
          </Knopf>
          <button type="button" className="bo-rund bo-rund--s bo-rund--flach" aria-label={TEXTE.schliessen} onClick={() => setPhase("gesehen")}>
            ×
          </button>
        </div>
      )}
      <Dialog
        offen={phase === "abgelaufen"}
        onSchliessen={() => {}}
        scrimSchliesst={false}
        titel={TEXTE.sitzungAbgelaufen}
        text={TEXTE.sitzungText}
        rolle="alertdialog"
        testid="sitzung-abgelaufen"
        fuss={
          <>
            <Knopf variant="secondary" onClick={pruefen}>
              {TEXTE.sitzungWeiter}
            </Knopf>
            <Knopf variant="primary" href={login} target="_blank" rel="noopener">
              {TEXTE.sitzungFenster}
            </Knopf>
          </>
        }
      >
        {pruefung && (
          <p role="alert" className="bo-schale-fehler">
            {pruefung}
          </p>
        )}
      </Dialog>
    </>
  );
}
