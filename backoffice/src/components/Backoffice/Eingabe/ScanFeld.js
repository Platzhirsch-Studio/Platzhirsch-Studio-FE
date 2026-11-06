"use client";
// Großes Scan-/Suchfeld im Lounge-Stil (Packtisch, Kassa, Wareneingang; lounge.md §7.5): Pille 64 hoch,
// Ring zeigt den Zustand (bereit · erkannt · unbekannt · doppelt) – immer zusätzlich als Text rechts
// („Zuletzt: Bordeaux Glas“), Fehlscan wackelt kurz (nicht bei reduzierter Bewegung). Scanner-Folgen kommen
// über das ScanTor (`data-scan="ja"`), getippte Eingaben mit Enter. Optional Kamera-Knopf (KameraScan).

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Camera, ScanLine } from "lucide-react";
import { erkenneCode } from "@/lib/backoffice/codes";
import cx from "../cx";
import KameraScan from "./KameraScan";
import { useScanFeld } from "./ScanTor";
import { TEXTE } from "./texte";
import "./eingabe.css";

const T = TEXTE.scan;

/**
 * @param {object} p
 * @param {(code:string, erkannt:object, quelle:"scanner"|"tippen"|"kamera") => void} p.onScan
 * @param {string} [p.label]             sichtbare Beschriftung fehlt bewusst – aria-label (Standard „Scannen oder eintippen“)
 * @param {string} [p.platzhalter]
 * @param {{text:string, ergebnis?:"erkannt"|"unbekannt"|"doppelt"}|null} [p.zuletzt]   Rückmeldung rechts im Feld
 * @param {"bereit"|"erkannt"|"unbekannt"|"doppelt"|null} [p.ergebnis]   Ring (Standard „bereit“, wenn fokussiert)
 * @param {boolean} [p.kamera]           Kamera-Knopf anzeigen
 * @param {"m"|"l"} [p.groesse]
 * @param {boolean} [p.abholcode]
 * @param {boolean} [p.autoFokus]
 */
const ScanFeld = forwardRef(function ScanFeld({ onScan, label = T.feld, platzhalter = T.platzhalter, zuletzt = null, ergebnis = null, kamera = false, groesse = "l", abholcode = false, autoFokus = false, id, className, testid }, aussen) {
  const ref = useRef(null);
  const [text, setText] = useState("");
  const [kameraOffen, setKameraOffen] = useState(false);
  const [wackelt, setWackelt] = useState(false);
  const [vorher, setVorher] = useState(zuletzt);
  useImperativeHandle(aussen, () => ({ fokus: () => ref.current?.focus(), wackeln: () => setWackelt(true) }), []);
  // Neue Rückmeldung „unbekannt“ → einmal wackeln (Muster „Wert aus dem vorigen Rendern“).
  if (zuletzt !== vorher) {
    setVorher(zuletzt);
    if (zuletzt?.ergebnis === "unbekannt") setWackelt(true);
  }

  const melde = (code, erkannt, quelle) => {
    setText("");
    onScan?.(code, erkannt, quelle);
  };
  useScanFeld(ref, (code, erkannt) => melde(code, erkannt, "scanner"));

  const zustand = ergebnis || zuletzt?.ergebnis || "bereit";
  return (
    <div
      className={cx("bo-ein-scan bo-scan", groesse === "m" && "bo-ein-scan--m", className)}
      data-ergebnis={zustand}
      data-wackeln={wackelt ? "true" : undefined}
      onAnimationEnd={() => setWackelt(false)}
      data-testid={testid}
    >
      <ScanLine aria-hidden="true" className="size-6" strokeWidth={1.75} />
      <input
        ref={ref}
        id={id}
        type="text"
        inputMode="text"
        enterKeyHint="go"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-scan="ja"
        data-fokus-rahmen="huelle"
        aria-label={label}
        placeholder={platzhalter}
        value={text}
        autoFocus={autoFokus}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          const code = text.trim();
          if (!code) return;
          e.preventDefault();
          melde(code, erkenneCode(code, { abholcode }), "tippen");
        }}
      />
      {zuletzt?.text && (
        <span className="bo-ein-scan__zuletzt" aria-live="polite">
          {T.zuletzt} <b>{zuletzt.text}</b>
        </span>
      )}
      {kamera && (
        <>
          <button type="button" className="bo-rund bo-tip bo-ziel" aria-label={T.kamera} data-tip={T.kamera} onClick={() => setKameraOffen(true)}>
            <Camera aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </button>
          <KameraScan offen={kameraOffen} onSchliessen={() => setKameraOffen(false)} abholcode={abholcode} onScan={(code, erkannt) => melde(code, erkannt, "kamera")} />
        </>
      )}
    </div>
  );
});

export default ScanFeld;
