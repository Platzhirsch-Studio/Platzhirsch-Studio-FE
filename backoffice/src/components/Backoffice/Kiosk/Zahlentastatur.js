"use client";
// G-24 Zahlentastatur (Team P0-6): Kassa (Gegeben, Betrag, Rabatt), Packtisch (Menge, Gewicht),
// Tagesabschluss (Zählen). Komma-Modell wie ein Taschenrechner („12“ „,“ „5“ = 12,50), Anzeigefeld mit „×“
// zum Leeren, Tasten 64 (Kiosk-Dichte), 4. Spalte je Kontext (z. B. Schnellbeträge 10/20/50 € oder
// „Passend“), physische Tastatur (Ziffern, Komma/Punkt, Rücktaste, Entf, Enter) wirkt, solange die
// Tastatur den Fokus hat oder `global` gesetzt ist. Wert in Cent bzw. ganzer Menge (`dezimalen: 0`).

import { useEffect, useRef, useState } from "react";
import { Delete, X } from "lucide-react";
import cx from "../cx";
import { TASTEN_LOESCHEN, TASTE_KOMMA, TASTE_LEEREN, TASTE_VORZEICHEN, anzeigeText, tasteAnwenden, textZuWert, wertZuText } from "../Eingabe/betrag";
import { TEXTE } from "./texte";
import "./kiosk.css";

const T = TEXTE.zahlentastatur;

/**
 * @param {object} p
 * @param {number|null} [p.wert]            Vorbelegung (Cent bzw. Menge) – gesteuert über `text` nicht nötig
 * @param {(wert:number|null, text:string) => void} [p.onWert]   bei jeder Taste
 * @param {(wert:number|null) => void} [p.onUebernehmen]          Enter / Übernehmen-Taste
 * @param {string} [p.label]                 Name der Eingabe (aria), z. B. „Gegeben“
 * @param {string} [p.einheit]               „€“, „Stk.“, „kg“
 * @param {number} [p.dezimalen]             2 (Betrag), 0 (Menge), 3 (Gewicht)
 * @param {boolean} [p.negativ]
 * @param {Array<{titel:string, wert?:number, onClick?:()=>void, primaer?:boolean, label?:string}>} [p.spalte4]  4. Spalte (max. 4 Tasten)
 * @param {string|false} [p.uebernehmen]     Text der Übernehmen-Taste (unten rechts statt Komma, wenn dezimalen 0); false = keine
 * @param {boolean} [p.global]               Ziffern der physischen Tastatur auch ohne Fokus
 * @param {number} [p.maxStellen]
 */
export default function Zahlentastatur({ wert = null, onWert, onUebernehmen, label = T.anzeige, einheit = "€", dezimalen = 2, negativ = false, spalte4 = [], uebernehmen = T.uebernehmen, global = false, maxStellen = 9, className, testid = "zahlentastatur" }) {
  const [text, setText] = useState(() => wertZuText(wert, { dezimalen }));
  const [gedrueckt, setGedrueckt] = useState(null);
  const huelle = useRef(null);

  const anwenden = (taste) => {
    const neu = tasteAnwenden(text, taste, { dezimalen, maxStellen, negativ });
    setText(neu);
    onWert?.(textZuWert(neu, { dezimalen }), neu);
  };
  const setzeWert = (w) => {
    const neu = wertZuText(w, { dezimalen });
    setText(neu);
    onWert?.(w, neu);
  };
  const fertig = () => onUebernehmen?.(textZuWert(text, { dezimalen }));

  const cbRef = useRef({ anwenden, fertig });
  useEffect(() => {
    cbRef.current = { anwenden, fertig };
  });

  useEffect(() => {
    const el = huelle.current;
    const ziel = global ? window : el;
    if (!ziel) return;
    const h = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (global && e.target instanceof Element && e.target.closest("input, textarea, select, [contenteditable]")) return;
      let taste = null;
      if (/^\d$/.test(e.key)) taste = e.key;
      else if (e.key === "," || e.key === "." || e.key === "Decimal") taste = TASTE_KOMMA;
      else if (e.key === "Backspace") taste = TASTEN_LOESCHEN;
      else if (e.key === "Delete") taste = TASTE_LEEREN;
      else if (e.key === "-" && negativ) taste = TASTE_VORZEICHEN;
      else if (e.key === "Enter" && onUebernehmen) {
        e.preventDefault();
        cbRef.current.fertig();
        return;
      }
      if (!taste) return;
      e.preventDefault();
      setGedrueckt(taste);
      setTimeout(() => setGedrueckt((g) => (g === taste ? null : g)), 120);
      cbRef.current.anwenden(taste);
    };
    ziel.addEventListener("keydown", h);
    return () => ziel.removeEventListener("keydown", h);
  }, [global, negativ, onUebernehmen]);

  const unten = dezimalen > 0 ? [{ t: TASTE_KOMMA, label: T.komma, text: "," }, { t: "0", text: "0" }, { t: TASTEN_LOESCHEN, label: T.loeschen, icon: true }] : [{ t: "00", text: "00" }, { t: "0", text: "0" }, { t: TASTEN_LOESCHEN, label: T.loeschen, icon: true }];
  const reihen = [["7", "8", "9"], ["4", "5", "6"], ["1", "2", "3"]];
  const vierte = spalte4.slice(0, uebernehmen && onUebernehmen ? 3 : 4);
  const spalten = vierte.length || (uebernehmen && onUebernehmen) ? 4 : 3;
  const leer = text === "" || text === "-";

  const taste = (t, inhalt, extra = {}) => (
    <button
      key={t + (extra.k || "")}
      type="button"
      className={cx("bo-ki-zt__taste", extra.klasse)}
      data-gedrueckt={gedrueckt === t ? "true" : undefined}
      aria-label={extra.label}
      onClick={extra.onClick || (() => anwenden(t))}
      style={extra.stil}
    >
      {inhalt}
    </button>
  );

  return (
    <div ref={huelle} className={cx("bo-ki-zt", className)} data-testid={testid} role="group" aria-label={label} tabIndex={-1} style={{ "--bo-ki-zt-spalten": spalten }}>
      <div className="bo-ki-zt__anzeige">
        <output className="bo-ki-zt__wert tabular-nums" data-leer={leer ? "true" : "false"} aria-live="polite" aria-label={label}>
          {leer ? (dezimalen ? "0,00" : "0") : anzeigeText(text)}
        </output>
        {einheit && (
          <span className="bo-ki-zt__einheit" aria-hidden="true">
            {einheit}
          </span>
        )}
        <button type="button" className="bo-rund bo-rund--flach bo-ziel" aria-label={T.leeren} onClick={() => anwenden(TASTE_LEEREN)} disabled={leer}>
          <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>
      </div>
      <div className="bo-ki-zt__tasten">
        {reihen.map((r, zi) => (
          <div key={zi} className="contents">
            {r.map((z) => taste(z, z))}
            {spalten === 4 && (vierte[zi] ? taste(`s4-${zi}`, vierte[zi].titel, { klasse: cx("bo-ki-zt__taste--neben", vierte[zi].primaer && "bo-ki-zt__taste--primaer"), label: vierte[zi].label, onClick: () => (vierte[zi].onClick ? vierte[zi].onClick() : setzeWert(vierte[zi].wert ?? null)) }) : <span key={`l${zi}`} aria-hidden="true" />)}
          </div>
        ))}
        {unten.map((u) => taste(u.t, u.icon ? <Delete aria-hidden="true" className="size-6" strokeWidth={1.75} /> : u.text, { label: u.label, klasse: u.icon || u.t === TASTE_KOMMA ? "bo-ki-zt__taste--neben" : undefined }))}
        {spalten === 4 &&
          (uebernehmen && onUebernehmen
            ? taste("ok", uebernehmen, { klasse: "bo-ki-zt__taste--primaer", onClick: fertig })
            : vierte[3]
              ? taste("s4-3", vierte[3].titel, { klasse: cx("bo-ki-zt__taste--neben", vierte[3].primaer && "bo-ki-zt__taste--primaer"), label: vierte[3].label, onClick: () => (vierte[3].onClick ? vierte[3].onClick() : setzeWert(vierte[3].wert ?? null)) })
              : <span aria-hidden="true" />)}
      </div>
    </div>
  );
}
