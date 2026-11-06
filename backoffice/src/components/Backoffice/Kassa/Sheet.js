"use client";
// Kassa – Sheet im Lounge-Stil (Team B-KAS; lounge.md §6 „Sheet“, Entwurf Kassa „Bezahlt-Sheet“): Material
// blur 40, Griff 40×5, federt von unten, Häkchen zeichnet sich. Modal mit Fokusfalle, Esc schließt (außer
// `sperren`), Fokus kehrt zum Auslöser zurück. Inhalte liefern die Aufrufer (Ergebnis, Freigabe, Dialoge).

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import cx from "../cx";

const FOKUSSIERBAR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * @param {object} p
 * @param {boolean} p.offen
 * @param {() => void} [p.onSchliessen]
 * @param {string} [p.titel]  sichtbarer Titel (h2) – sonst `label` für Screenreader
 * @param {string} [p.label]
 * @param {boolean} [p.breit] 560 statt 440, linksbündig
 * @param {boolean} [p.sperren] Esc/Scrim wirkungslos (laufender Vorgang)
 */
export default function Sheet({ offen, onSchliessen, titel, label, text, breit = false, sperren = false, kopf, testid, children }) {
  const ref = useRef(null);
  const id = useId();
  const zurueck = useRef(null);

  useEffect(() => {
    if (!offen) return;
    zurueck.current = document.activeElement;
    const el = ref.current;
    const erstes = el?.querySelector("[data-autofokus]") || el?.querySelector(FOKUSSIERBAR);
    const t = setTimeout(() => erstes?.focus({ preventScroll: true }), 30);
    const taste = (e) => {
      if (e.key === "Escape" && !sperren) {
        e.preventDefault();
        e.stopPropagation();
        onSchliessen?.();
      }
      if (e.key === "Tab" && el) {
        const ziele = [...el.querySelectorAll(FOKUSSIERBAR)].filter((x) => x.offsetParent !== null);
        if (!ziele.length) return;
        const a = ziele[0];
        const z = ziele.at(-1);
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    window.addEventListener("keydown", taste, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", taste, true);
      if (zurueck.current?.isConnected) zurueck.current.focus?.({ preventScroll: true });
    };
  }, [offen, sperren, onSchliessen]);

  if (!offen || typeof document === "undefined") return null;
  return createPortal(
    <div className="bo-ka bo-ka-sheet-wrap" data-scan="nein" onPointerDown={(e) => e.target === e.currentTarget && !sperren && onSchliessen?.()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titel ? `${id}-t` : undefined} aria-label={titel ? undefined : label} className={cx("bo-ka-sheet", breit && "bo-ka-sheet--breit")} data-testid={testid}>
        <span className="bo-ka-sheet__griff" aria-hidden="true" />
        {kopf}
        {titel && (
          <h2 id={`${id}-t`} className="bo-ka-sheet__titel">
            {titel}
          </h2>
        )}
        {text && <p className="bo-ka-sheet__text">{text}</p>}
        {children}
      </div>
    </div>,
    document.body
  );
}

/** Häkchen, das sich nach 220 ms zeichnet (Lounge-Erfolgsmoment). */
export function Haken({ className }) {
  return (
    <svg className={cx("bo-ka-haken", className)} viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r="33" className="bo-ka-haken__ring" />
      <path d="M22 37.5 L32 47 L51 27" className="bo-ka-haken__strich" />
    </svg>
  );
}
