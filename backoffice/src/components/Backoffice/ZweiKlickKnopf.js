"use client";
import { useEffect, useRef, useState } from "react";
import cx from "./cx";
import Knopf from "./Knopf";
import { zweiKlick, ZWEI_KLICK_MS } from "./ZuTun/logik";
import { SEITE } from "./ZuTun/texte";

// Zwei-Klick-Knopf (MASTER G-29, Shop § 3.4; Team P0-5b): für mittlere Risiken ohne Dialog. Der erste
// Klick verwandelt den Knopf für 3 s in „Wirklich {Verb}?“ (weiche Ziegel-Fläche, Fortschritt als
// schmaler Balken, der in 3 s ausläuft); der zweite Klick führt aus. Tastatur: zweimal Enter/Leertaste,
// Esc oder Fokusverlust bricht ab. Ansage über eine Live-Region. Nur, wo ein Bereichskonzept es verlangt.

/**
 * @param {object} p
 * @param {string} p.verb                    Verb im Infinitiv klein („entfernen“, „zurückziehen“)
 * @param {import("react").ReactNode} p.children   Beschriftung im Ruhezustand („Entfernen“)
 * @param {() => void|Promise<void>} p.onBestaetigt  läuft beim zweiten Klick
 * @param {string} [p.icon]
 * @param {"s"|"m"|"l"} [p.size]
 * @param {"secondary"|"ghost"|"danger"} [p.variant]  Ruhezustand (Standard secondary)
 * @param {boolean} [p.laedt]
 * @param {boolean} [p.disabled]
 * @param {import("react").ReactNode} [p.grund]
 * @param {number} [p.fenster]               ms bis zum Zurückfallen (Standard 3000)
 */
export default function ZweiKlickKnopf({ verb, children, onBestaetigt, icon, size = "m", variant = "secondary", laedt = false, disabled = false, grund, fenster = ZWEI_KLICK_MS, className, testid = "zwei-klick", ...rest }) {
  const [zustand, setZustand] = useState({ scharf: false, seit: null });
  const [ansage, setAnsage] = useState("");
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const setze = (ereignis) => {
    const r = zweiKlick(zustand, ereignis, Date.now(), fenster);
    clearTimeout(timer.current);
    setZustand(r.zustand);
    if (r.zustand.scharf) {
      setAnsage(SEITE.zweiKlickHinweis(verb));
      timer.current = setTimeout(() => {
        setZustand({ scharf: false, seit: null });
        setAnsage(SEITE.zweiKlickAbgebrochen);
      }, fenster);
    } else if (ereignis !== "klick" && zustand.scharf) {
      setAnsage(SEITE.zweiKlickAbgebrochen);
    } else {
      setAnsage("");
    }
    if (r.ausfuehren) onBestaetigt?.();
  };

  const scharf = zustand.scharf;
  return (
    <span className={cx("relative inline-flex", className)}>
      <Knopf
        {...rest}
        size={size}
        variant={scharf ? "danger" : variant}
        icon={scharf ? "TriangleAlert" : icon}
        laedt={laedt}
        disabled={disabled}
        grund={grund}
        data-scharf={scharf ? "true" : "false"}
        data-testid={testid}
        className={cx("overflow-hidden", scharf && "bg-bo-ziegel-soft! text-bo-ziegel-text! shadow-none!")}
        onClick={() => setze("klick")}
        onKeyDown={(e) => {
          if (e.key === "Escape" && scharf) {
            e.stopPropagation();
            setze("abbruch");
          }
        }}
        onBlur={() => scharf && setze("abbruch")}
      >
        {scharf ? SEITE.wirklich(verb) : children}
        {scharf && (
          <span aria-hidden="true" className="absolute inset-x-3 bottom-1 h-0.5 overflow-hidden rounded-pill bg-bo-ziegel/20">
            <span className="bo-zweiklick-lauf block h-full origin-left rounded-pill bg-bo-ziegel" style={{ animation: `bo-zweiklick ${fenster}ms linear forwards` }} />
          </span>
        )}
      </Knopf>
      <span className="sr-only" aria-live="assertive">
        {ansage}
      </span>
      <style>{"@keyframes bo-zweiklick{from{transform:scaleX(1)}to{transform:scaleX(0)}}@media (prefers-reduced-motion:reduce){.bo-zweiklick-lauf{animation:none!important}}"}</style>
    </span>
  );
}
