"use client";
// G-06 Tooltip (Team P0-4): Tinte-Pille im Top-Layer, max. 240 px, gleitet mit weicher Feder ein.
// Auslösung Hover (Maus/Stift) und Tastaturfokus nach 400 ms, innerhalb einer Gruppe sofort
// (zuletzt vor < 300 ms geschlossen). Nie interaktiv, nie einzige Informationsquelle (Q-I5):
// Gründe deaktivierter Knöpfe stehen zusätzlich als Text. Im Kiosk und bei Berührung aus.
// Esc schließt. Für Knopf/RundKnopf genügt deren `label` (CSS-Tooltip .bo-tip); diese Komponente
// ist für Fälle mit Lage, Gruppenverhalten oder längerem Text (Kürzel, Kennzahl-Erklärungen).

import { Children, cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState } from "react";
import { imKiosk, useIsoLayoutEffect } from "./hilfen";
import { platziere, tooltipVerzoegerung } from "./logik";
import "./overlay.css";

let zuletztGeschlossen = null;

/**
 * @param {object} p
 * @param {import("react").ReactNode} p.text
 * @param {"oben"|"unten"|"rechts"|"links"|string} [p.platzierung]  Standard "oben-mitte"
 * @param {boolean} [p.aus]        abschalten (z. B. wenn der Text schon sichtbar ist)
 * @param {import("react").ReactElement} p.children  ein fokussierbares Element
 */
export default function Tooltip({ text, platzierung = "oben-mitte", aus = false, children }) {
  const [offen, setOffen] = useState(false);
  const huelle = useRef(null);
  const tip = useRef(null);
  const timer = useRef(null);
  const id = useId();
  const tipId = `bo-tip-${id.replace(/:/g, "")}`;
  const voll = platzierung.includes("-") ? platzierung : `${platzierung}-mitte`;

  const ziel = () => huelle.current?.firstElementChild || null;

  const zeige = useCallback(() => {
    if (aus || !text || imKiosk(huelle.current?.firstElementChild)) return;
    clearTimeout(timer.current);
    const warte = tooltipVerzoegerung(zuletztGeschlossen, Date.now());
    if (warte === 0) setOffen(true);
    else timer.current = setTimeout(() => setOffen(true), warte);
  }, [aus, text]);

  const verstecke = useCallback(() => {
    clearTimeout(timer.current);
    setOffen((o) => {
      if (o) zuletztGeschlossen = Date.now();
      return false;
    });
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  useIsoLayoutEffect(() => {
    const t = tip.current;
    if (!t || typeof t.showPopover !== "function") return;
    if (offen) {
      if (!t.matches(":popover-open")) t.showPopover();
      const r = ziel()?.getBoundingClientRect();
      if (!r) return;
      const lage = platziere({ anker: { x: r.left, y: r.top, w: r.width, h: r.height }, panel: { w: t.offsetWidth, h: t.offsetHeight }, viewport: { w: window.innerWidth, h: window.innerHeight }, platzierung: voll });
      t.style.left = `${lage.x}px`;
      t.style.top = `${lage.y}px`;
      t.style.setProperty("--bo-ov-tip-von", lage.seite === "oben" ? "4px" : lage.seite === "unten" ? "-4px" : "0px");
    } else if (t.matches(":popover-open")) t.hidePopover();
  }, [offen, voll]);

  // Esc schließt, ohne den Fokus zu bewegen; Scrollen schließt.
  useEffect(() => {
    if (!offen) return;
    const taste = (e) => e.key === "Escape" && verstecke();
    const roll = () => verstecke();
    document.addEventListener("keydown", taste, true);
    window.addEventListener("scroll", roll, true);
    return () => {
      document.removeEventListener("keydown", taste, true);
      window.removeEventListener("scroll", roll, true);
    };
  }, [offen, verstecke]);

  const kind = isValidElement(children) ? Children.only(children) : <span tabIndex={0}>{children}</span>;
  const beschrieben = [kind.props["aria-describedby"], text && !aus ? tipId : null].filter(Boolean).join(" ") || undefined;

  return (
    <span
      ref={huelle}
      style={{ display: "contents" }}
      onPointerEnter={(e) => e.pointerType !== "touch" && zeige()}
      onPointerLeave={verstecke}
      onPointerDown={verstecke}
      onFocus={(e) => {
        // nur bei Tastaturfokus (nicht beim Klick)
        if (e.target.matches?.(":focus-visible")) zeige();
      }}
      onBlur={verstecke}
    >
      {cloneElement(kind, { "aria-describedby": beschrieben })}
      {text && !aus && (
        <span ref={tip} id={tipId} role="tooltip" popover="manual" className="bo-ov-tip">
          {text}
        </span>
      )}
    </span>
  );
}
