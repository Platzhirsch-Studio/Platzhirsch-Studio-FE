"use client";
// G-24 Wischaktion (Team P0-6): Zeile, die sich zur Seite wischen lässt (Montage-Liste, Kassa-Position,
// Packtisch-Problem). Wischen ist nur eine Abkürzung – jede Aktion steht zusätzlich als sichtbarer runder
// Knopf in der Zeile (Ziele ≥ 44 px, keine versteckte Geste). Hinter der Zeile das Ziel mit Symbol und Wort
// in Materialfläche; ausgelöst ab 35 % der Breite oder per Wurf, sonst federt die Zeile zurück.
// Senkrechtes Scrollen bleibt frei (touch-action: pan-y), Richtung wird nach 8 px entschieden.

import { useRef, useState } from "react";
import { Icon } from "../icons";
import cx from "../cx";
import { gummiband, wischEntscheidung } from "./logik";
import { TEXTE } from "./texte";
import "./kiosk.css";

/**
 * @param {object} p
 * @param {{titel:string, icon:string, ton?:"salbei"|"ziegel"|"eiche"|"tinte", onAusloesen:()=>void}} [p.links]   Aktion beim Wischen nach links (erscheint rechts)
 * @param {{titel:string, icon:string, ton?:string, onAusloesen:()=>void}} [p.rechts]  Aktion beim Wischen nach rechts (erscheint links)
 * @param {boolean} [p.knoepfe]   sichtbare Knöpfe (Standard an)
 * @param {import("react").ReactNode} p.children
 */
export default function Wischaktion({ links, rechts, knoepfe = true, label, className, children, testid }) {
  const [dx, setDx] = useState(0);
  const [zieht, setZieht] = useState(false);
  const start = useRef(null);
  const vorne = useRef(null);

  const runter = (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (e.target instanceof Element && e.target.closest("button, a, input, select, textarea")) return;
    start.current = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, richtung: null, letzte: { x: e.clientX, t: performance.now() }, v: 0 };
  };
  const ziehen = (e) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (!s.richtung) {
      if (Math.hypot(mx, my) < 8) return;
      s.richtung = Math.abs(mx) > Math.abs(my) ? "x" : "y";
      if (s.richtung === "x") {
        vorne.current?.setPointerCapture?.(e.pointerId);
        setZieht(true);
      }
    }
    if (s.richtung !== "x") return;
    const jetzt = performance.now();
    s.v = (e.clientX - s.letzte.x) / Math.max(1, jetzt - s.letzte.t);
    s.letzte = { x: e.clientX, t: jetzt };
    const breite = vorne.current?.offsetWidth || 1;
    setDx(gummiband(mx, breite * 0.45, { links: !!links, rechts: !!rechts }));
  };
  const hoch = (e) => {
    const s = start.current;
    start.current = null;
    if (!s || s.richtung !== "x") return;
    setZieht(false);
    const breite = vorne.current?.offsetWidth || 1;
    const r = wischEntscheidung({ dx: e.clientX - s.x, breite, geschwindigkeit: s.v, links: !!links, rechts: !!rechts });
    setDx(0);
    if (r === "links") links.onAusloesen?.();
    if (r === "rechts") rechts.onAusloesen?.();
  };

  const zeigeLinks = dx < 0;
  return (
    <div className={cx("bo-ki-wisch", className)} data-testid={testid} role="group" aria-label={label}>
      <div className="bo-ki-wisch__hinten" aria-hidden="true">
        {rechts && (
          <span className="bo-ki-wisch__ziel" data-ton={rechts.ton || "salbei"} style={{ opacity: dx > 0 ? 1 : 0 }}>
            <Icon name={rechts.icon} className="size-5" />
            {rechts.titel}
          </span>
        )}
        {links && (
          <span className="bo-ki-wisch__ziel bo-ki-wisch__ziel--rechts" data-ton={links.ton || "ziegel"} style={{ opacity: zeigeLinks ? 1 : 0 }}>
            {links.titel}
            <Icon name={links.icon} className="size-5" />
          </span>
        )}
      </div>
      <div
        ref={vorne}
        className="bo-ki-wisch__vorne"
        data-zieht={zieht ? "true" : "false"}
        style={{ transform: dx ? `translate3d(${dx}px,0,0)` : undefined }}
        onPointerDown={runter}
        onPointerMove={ziehen}
        onPointerUp={hoch}
        onPointerCancel={hoch}
      >
        <div className="bo-ki-wisch__inhalt">{children}</div>
        {knoepfe && (links || rechts) && (
          <div className="bo-ki-wisch__knoepfe" role="group" aria-label={TEXTE.wisch.aktionen}>
            {[rechts, links].filter(Boolean).map((a) => (
              <button key={a.titel} type="button" className="bo-rund bo-tip bo-ziel" aria-label={a.titel} data-tip={a.titel} onClick={a.onAusloesen}>
                <Icon name={a.icon} className="size-5" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
