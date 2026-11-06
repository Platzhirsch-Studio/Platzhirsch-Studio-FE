"use client";
// G-06 Dialog (Team P0-4): nativer <dialog> (Top-Layer, Fokusfalle und Esc vom Browser) im
// Lounge-Material – Radius 32, blur 40, Lichtkante, Schatten „float“, Scrim mit Unschärfe.
// Größen sm 400 / md 560 / lg 800 (Q-G8). Unter 640 px Bottom-Sheet mit Griff (zum Schließen
// nach unten ziehen), Knöpfe untereinander, Hauptaktion oben. Öffnen: Blende 160 ms, Form
// federt (bo-motion.css); Schließen 120 ms. `sperren` (laufender Vorgang): kein Esc, kein Scrim,
// kein Ziehen.

import { useCallback, useId, useRef } from "react";
import cx from "../cx";
import { useDialogOffen, useSchmal, useZiehen } from "./hilfen";
import { breiteFuer } from "./logik";
import "./overlay.css";

/**
 * @param {object} p
 * @param {boolean} p.offen
 * @param {(grund: "esc"|"scrim"|"griff"|"knopf") => void} p.onSchliessen
 * @param {import("react").ReactNode} p.titel
 * @param {import("react").ReactNode} [p.text]         Satz unter dem Titel (aria-describedby)
 * @param {"sm"|"md"|"lg"} [p.groesse]
 * @param {import("react").ReactNode} [p.fuss]         Knöpfe; Reihenfolge [Abbrechen] [Primär]
 * @param {boolean} [p.sperren]                        laufender Vorgang: Esc/Scrim/Ziehen wirkungslos
 * @param {boolean} [p.scrimSchliesst]                 Klick auf den Scrim schließt (Standard true)
 * @param {"dialog"|"bestaetigen"} [p.art]             "bestaetigen" = zentriert, zwei gleich breite Knöpfe
 * @param {import("react").ReactNode} [p.kopf]         Inhalt über dem Titel (z. B. Symbol)
 * @param {string} [p.rolle]                           "dialog" (Standard) oder "alertdialog"
 */
export default function Dialog({ offen, onSchliessen, titel, text, groesse = "sm", fuss, sperren = false, scrimSchliesst = true, art = "dialog", kopf, rolle = "dialog", className, testid, children }) {
  const ref = useRef(null);
  const id = useId();
  const titelId = `${id}-titel`;
  const textId = `${id}-text`;
  const schmal = useSchmal();
  useDialogOffen(ref, offen);

  const schliesse = useCallback(
    (grund) => {
      if (sperren) return;
      onSchliessen?.(grund);
    },
    [sperren, onSchliessen]
  );
  const ziehen = useZiehen({ aktiv: schmal && !sperren, onSchliessen: () => schliesse("griff") });

  return (
    <dialog
      ref={ref}
      role={rolle === "alertdialog" ? "alertdialog" : undefined}
      aria-labelledby={titelId}
      aria-describedby={text ? textId : undefined}
      aria-busy={sperren || undefined}
      data-art={art}
      data-seite={schmal ? "unten" : undefined}
      data-testid={testid}
      className={cx("bo-dialog bo-ov-dialog", className)}
      style={{ "--bo-ov-breite": `${breiteFuer(groesse, "dialog")}px` }}
      onCancel={(e) => {
        e.preventDefault();
        schliesse("esc");
      }}
      onClick={(e) => {
        if (e.target === ref.current && scrimSchliesst) schliesse("scrim");
      }}
    >
      <div className="bo-ov-dialog__innen">
        {schmal && <div className="bo-ov-griff" aria-hidden="true" {...ziehen} />}
        <div className="bo-ov-dialog__kopf" {...(schmal ? ziehen : {})}>
          {kopf}
          <h2 id={titelId} className="bo-ov-titel">
            {titel}
          </h2>
          {text && (
            <p id={textId} className="bo-ov-text">
              {text}
            </p>
          )}
        </div>
        {children ? <div className={cx("bo-ov-dialog__koerper", art === "bestaetigen" && "text-center")}>{children}</div> : null}
        {fuss && <div className="bo-ov-dialog__fuss">{fuss}</div>}
      </div>
    </dialog>
  );
}

/**
 * Fakten-Karte für Dialoge („Titel als Frage mit Fakten“): eingelassene Kachel, Zeilen Bezeichnung · Wert.
 * @param {{eintraege: Array<{label: import("react").ReactNode, wert: import("react").ReactNode}>}} p
 */
export function Fakten({ eintraege = [] }) {
  if (!eintraege.length) return null;
  return (
    <dl className="bo-ov-fakten">
      {eintraege.map((f, i) => (
        <div key={i}>
          <dt>{f.label}</dt>
          <dd>{f.wert}</dd>
        </div>
      ))}
    </dl>
  );
}
