"use client";
// G-24 Positionsgrid (Team P0-6): Positionen am Packtisch (Ist/Soll, Status), im Kassa-Warenkorb, beim
// Wareneingang. `role="grid"` mit Roving-Tabindex: ein Tab-Halt für das ganze Raster, ↑/↓ Zeile, ←/→ Zelle,
// Pos1/Ende (mit Strg: erste/letzte Zeile), Bild↑/↓ fünf Zeilen, Enter öffnet/handelt die Zeile.
// Zeilen tragen ihren Zustand als Fläche UND Text/Symbol in einer Zelle (nie Farbe allein):
// `ton` = aktiv (Salbei-Kontur, wie „Gerade +1“) · erledigt (Salbei) · warnung (Messing, z. B. ohne
// Barcode) · fehler (Ziegel) · offen (eingelassen). Kopfzeile standardmäßig nur für Screenreader.

import { useEffect, useRef, useState } from "react";
import cx from "../cx";
import { gridBewegung } from "./logik";
import "./kiosk.css";

/**
 * @param {object} p
 * @param {string} p.label
 * @param {Array<{key:string, titel:string, breite?:string, ausrichtung?:"links"|"rechts"|"mitte"}>} p.spalten  breite = CSS-Spur (Standard minmax(0,1fr))
 * @param {Array<{id:string, ton?:string, label?:string, zellen:Record<string, import("react").ReactNode>}>} p.zeilen
 * @param {string} [p.aktiv]                      id der aktiven Zeile (Fokusziel beim Eintreten)
 * @param {(id:string) => void} [p.onOeffnen]      Enter / Doppeltipp
 * @param {(id:string) => void} [p.onFokus]
 * @param {boolean} [p.kopfSichtbar]
 */
export default function Positionsgrid({ label, spalten = [], zeilen = [], aktiv, onOeffnen, onFokus, kopfSichtbar = false, className, testid = "positionsgrid" }) {
  const [fokus, setFokus] = useState({ zeile: 0, spalte: 0 });
  const zellen = useRef(new Map());
  const willFokus = useRef(false);
  const aktivIndex = zeilen.findIndex((z) => z.id === aktiv);
  const sicher = { zeile: Math.min(Math.max(0, fokus.zeile), Math.max(0, zeilen.length - 1)), spalte: Math.min(fokus.spalte, Math.max(0, spalten.length - 1)) };

  // Aktive Zeile von außen gewechselt (z. B. nach einem Scan) → Roving-Ziel folgt, ohne Fokus zu stehlen.
  const [vorherAktiv, setVorherAktiv] = useState(aktiv);
  if (aktiv !== vorherAktiv) {
    setVorherAktiv(aktiv);
    if (aktivIndex >= 0) setFokus((f) => ({ ...f, zeile: aktivIndex }));
  }

  useEffect(() => {
    if (!willFokus.current) return;
    willFokus.current = false;
    zellen.current.get(`${sicher.zeile}:${sicher.spalte}`)?.focus();
  });

  const spur = spalten.map((s) => s.breite || "minmax(0,1fr)").join(" ");

  const taste = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      if (e.target instanceof Element && e.target.closest("button, a, input") && e.target !== e.currentTarget) return;
      const z = zeilen[sicher.zeile];
      if (z && onOeffnen) {
        e.preventDefault();
        onOeffnen(z.id);
      }
      return;
    }
    const neu = gridBewegung(sicher, e.key, { zeilen: zeilen.length, spalten: spalten.length, strg: e.ctrlKey || e.metaKey });
    if (!neu) return;
    e.preventDefault();
    willFokus.current = true;
    setFokus(neu);
    if (neu.zeile !== sicher.zeile) onFokus?.(zeilen[neu.zeile]?.id);
  };

  return (
    <div role="grid" aria-label={label} aria-rowcount={zeilen.length + 1} className={cx("bo-ki-grid", className)} style={{ "--bo-ki-grid-spalten": spur }} data-testid={testid} onKeyDown={taste}>
      <div role="row" aria-rowindex={1} className={kopfSichtbar ? "bo-ki-grid__kopf" : "sr-only"}>
        {spalten.map((s) => (
          <span key={s.key} role="columnheader" className={s.ausrichtung === "rechts" ? "text-right" : undefined}>
            {s.titel}
          </span>
        ))}
      </div>
      <div role="rowgroup" className="contents">
        {zeilen.map((z, zi) => (
          <div key={z.id} role="row" aria-rowindex={zi + 2} aria-selected={z.id === aktiv ? "true" : undefined} aria-label={z.label} className="bo-ki-grid__zeile" data-ton={z.ton || "offen"} onDoubleClick={() => onOeffnen?.(z.id)}>
            {spalten.map((s, si) => {
              const istZiel = zi === sicher.zeile && si === sicher.spalte;
              return (
                <div
                  key={s.key}
                  role="gridcell"
                  ref={(el) => {
                    const k = `${zi}:${si}`;
                    if (el) zellen.current.set(k, el);
                    else zellen.current.delete(k);
                  }}
                  tabIndex={istZiel ? 0 : -1}
                  className="bo-ki-grid__zelle"
                  data-ausrichtung={s.ausrichtung}
                  onFocus={() => {
                    if (!istZiel) setFokus({ zeile: zi, spalte: si });
                  }}
                >
                  {z.zellen?.[s.key] ?? null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
