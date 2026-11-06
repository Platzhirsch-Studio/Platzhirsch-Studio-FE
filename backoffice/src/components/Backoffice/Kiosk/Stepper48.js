"use client";
// G-24 Stepper48 (Team P0-6): Menge im Kiosk (Kassa-Warenkorb, Packtisch-Menge). Kapsel 48 hoch mit runden
// Minus/Plus-Zielen 48 px, Zahl 17/600 in der Mitte (federt bei Änderung kurz), ganzzahlig (Q-D6).
// Tastatur: ↑/→/+ erhöht, ↓/←/− verringert, Pos1/Ende = Min/Max. Langes Drücken wiederholt (nach 400 ms
// alle 90 ms). `role="spinbutton"` an der Zahl, die Knöpfe sind beschriftet.

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import cx from "../cx";
import { stepperWert } from "./logik";
import { TEXTE } from "./texte";
import "./kiosk.css";

const T = TEXTE.stepper;

/**
 * @param {object} p
 * @param {number} p.wert
 * @param {(wert:number) => void} p.onWert
 * @param {number} [p.min]
 * @param {number} [p.max]
 * @param {string} [p.label]          z. B. „Menge Bordeaux Glas“
 * @param {boolean} [p.disabled]
 */
export default function Stepper48({ wert, onWert, min = 0, max = 999, label = T.menge, disabled = false, className, testid }) {
  const [puls, setPuls] = useState(false);
  const [vorher, setVorher] = useState(wert);
  if (wert !== vorher) {
    setVorher(wert);
    setPuls(true);
  }
  const wiederholen = useRef(null);
  const gelaufen = useRef(false);
  const wertRef = useRef(wert);
  useEffect(() => {
    wertRef.current = wert;
  });
  useEffect(() => () => clearTimeout(wiederholen.current), []);

  const aendern = (d) => {
    const neu = stepperWert(wertRef.current, d, { min, max });
    if (neu !== wertRef.current) {
      wertRef.current = neu;
      onWert?.(neu);
      return true;
    }
    return false;
  };
  const halten = (d) => {
    clearTimeout(wiederholen.current);
    gelaufen.current = false;
    const lauf = (verzoegerung) => {
      wiederholen.current = setTimeout(() => {
        gelaufen.current = true;
        if (aendern(d)) lauf(90);
      }, verzoegerung);
    };
    lauf(400);
  };
  const loslassen = () => clearTimeout(wiederholen.current);

  const knopf = (d, Icon, text, gesperrt) => (
    <button
      type="button"
      aria-label={text}
      disabled={disabled || gesperrt}
      onClick={() => {
        // Nach langem Drücken hat die Wiederholung schon gezählt – der Klick beim Loslassen nicht mehr.
        if (gelaufen.current) gelaufen.current = false;
        else aendern(d);
      }}
      onPointerDown={() => halten(d)}
      onPointerUp={loslassen}
      onPointerLeave={loslassen}
      onPointerCancel={loslassen}
    >
      <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
    </button>
  );

  return (
    <div className={cx("bo-ki-stepper", className)} data-testid={testid}>
      {knopf(-1, Minus, T.weniger(label), wert <= min)}
      <output
        role="spinbutton"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuenow={wert}
        aria-valuemin={min}
        aria-valuemax={max}
        data-puls={puls ? "true" : undefined}
        onAnimationEnd={() => setPuls(false)}
        onKeyDown={(e) => {
          const map = { ArrowUp: 1, ArrowRight: 1, "+": 1, ArrowDown: -1, ArrowLeft: -1, "-": -1 };
          if (e.key in map) {
            e.preventDefault();
            aendern(map[e.key]);
          } else if (e.key === "Home") {
            e.preventDefault();
            if (wert !== min) onWert?.(min);
          } else if (e.key === "End") {
            e.preventDefault();
            if (wert !== max) onWert?.(max);
          }
        }}
      >
        {wert}
      </output>
      {knopf(1, Plus, T.mehr(label), wert >= max)}
    </div>
  );
}
