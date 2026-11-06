"use client";
// BedienerRueckkehr (G-20, M-10 „Langdruck + PIN“): Langdruck 800 ms auf die Wortmarke (Maus, Finger
// oder Leertaste/Enter gedrückt halten) öffnet die PIN-Abfrage; richtige PIN beendet den Kundenmodus.
// Während des Drucks füllt sich ein Ring (nur Bewegung, Information steht im Text). Ohne PIN-Prüfung
// (kein registriertes Gerät im Echtbetrieb) genügt der Langdruck – das meldet die Server Action.

import { useRef, useState, useTransition } from "react";
import Dialog from "../Overlay/Dialog";
import Knopf from "../Knopf";
import { kundenmodusBeendenAction } from "../Shell/aktionen";
import { useKundenmodus } from "./Kontext";
import { TEXTE } from "./texte";

export const LANGDRUCK_MS = 800;

/** @param {{children:React.ReactNode, demo?:boolean}} props `demo`: PIN wird nicht geprüft (Baustein-Demo). */
export default function BedienerRueckkehr({ children, demo = false }) {
  const { beenden, pinNoetig } = useKundenmodus();
  const [drueckt, setDrueckt] = useState(false);
  const [pinOffen, setPinOffen] = useState(false);
  const [pin, setPin] = useState("");
  const [fehler, setFehler] = useState("");
  const [laeuft, starte] = useTransition();
  const timer = useRef(null);

  const ausloesen = () => {
    setDrueckt(false);
    if (pinNoetig && !demo) setPinOffen(true);
    else beenden();
  };
  const start = () => {
    clearTimeout(timer.current);
    setDrueckt(true);
    timer.current = setTimeout(ausloesen, LANGDRUCK_MS);
  };
  const stopp = () => {
    clearTimeout(timer.current);
    setDrueckt(false);
  };

  const pruefen = (e) => {
    e.preventDefault();
    setFehler("");
    starte(async () => {
      const r = await kundenmodusBeendenAction({ pin });
      if (r?.ok) {
        setPinOffen(false);
        setPin("");
        beenden();
      } else setFehler(r?.message || TEXTE.pinFalsch);
    });
  };

  return (
    <>
      <button
        type="button"
        className="bo-schale-rueckkehr"
        data-drueckt={drueckt ? "true" : undefined}
        aria-label={TEXTE.rueckkehrLabel}
        aria-describedby="bo-rueckkehr-hinweis"
        onPointerDown={start}
        onPointerUp={stopp}
        onPointerLeave={stopp}
        onPointerCancel={stopp}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter") && !e.repeat) {
            e.preventDefault();
            start();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") stopp();
        }}
        data-testid="bediener-rueckkehr"
      >
        {children}
        <span className="bo-schale-rueckkehr__ring" aria-hidden="true" />
      </button>
      <span id="bo-rueckkehr-hinweis" className="sr-only">
        {TEXTE.rueckkehrHinweis}
      </span>
      <Dialog
        offen={pinOffen}
        onSchliessen={() => {
          setPinOffen(false);
          setPin("");
          setFehler("");
        }}
        titel={TEXTE.pinTitel}
        text={TEXTE.pinText}
        sperren={laeuft}
        testid="kundenmodus-pin"
      >
        <form onSubmit={pruefen} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-bo-text-soft">{TEXTE.pin}</span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              pattern="\d{4,6}"
              minLength={4}
              maxLength={6}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="bo-input text-center text-2xl tracking-[0.4em]"
              aria-invalid={fehler ? "true" : undefined}
              data-autofokus=""
            />
          </label>
          {fehler && (
            <p role="alert" className="text-[13px] text-bo-danger">
              {fehler}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Knopf variant="ghost" onClick={() => setPinOffen(false)}>
              {TEXTE.abbrechen}
            </Knopf>
            <Knopf variant="primary" type="submit" laedt={laeuft}>
              {TEXTE.beenden}
            </Knopf>
          </div>
        </form>
      </Dialog>
    </>
  );
}
