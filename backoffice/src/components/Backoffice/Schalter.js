"use client";
import { useId, useState } from "react";
import cx from "./cx";

// iOS-Schalter (lounge.md §6): Spur 51×31, Daumen 27 mit Doppelschatten, gleitet mit Feder;
// gedrückt verbreitert sich der Daumen. An = Salbei. Für sofort wirkende Ein/Aus-Einstellungen
// (E-Mail-Beleg, Benachrichtigung, Kundendisplay-Anrede) – nicht für Auswahl zwischen Optionen
// (dafür `Segment`) und nicht als Bestätigung einer Aktion.
// Zugänglich: role="switch" + aria-checked, Leertaste/Enter wie ein Knopf, Beschriftung ist Teil
// der Schaltfläche (ganze Zeile klickbar, Ziel ≥ 44 px), Beschreibung über aria-describedby.
// Gesteuert (`an` + `onWechsel`) oder ungesteuert (`standard`); `name` schreibt ein verstecktes
// Feld („1“/„0“) für Formulare und Server Actions.

/**
 * @param {object} p
 * @param {string} p.label                 sichtbare Beschriftung (Pflicht)
 * @param {boolean} [p.an]                 gesteuerter Zustand
 * @param {boolean} [p.standard]           Anfangszustand, wenn ungesteuert
 * @param {(an:boolean)=>void} [p.onWechsel]
 * @param {string} [p.beschreibung]        Satz unter der Beschriftung
 * @param {string} [p.name]                Formularfeld (verstecktes input, „1“/„0“)
 * @param {boolean} [p.deaktiviert]
 * @param {"m"|"s"} [p.groesse]            51×31 (Standard) · 38×23 für dichte Listen
 * @param {boolean} [p.zeile]              als ganze Zeile mit Beschriftung links (Standard ja); false = nur Schalter (label → aria-label)
 * @param {string} [p.testid]
 */
export default function Schalter({ label, an, standard = false, onWechsel, beschreibung, name, deaktiviert = false, groesse = "m", zeile = true, className, testid }) {
  const [eigen, setEigen] = useState(standard);
  const wert = an ?? eigen;
  const beschrId = useId();

  const wechseln = () => {
    if (deaktiviert) return;
    const neu = !wert;
    if (an === undefined) setEigen(neu);
    onWechsel?.(neu);
  };

  const spur = (
    <span className="bo-schalter__spur" aria-hidden="true">
      <span className="bo-schalter__daumen" />
    </span>
  );

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={wert}
        aria-label={zeile ? undefined : label}
        aria-describedby={beschreibung ? beschrId : undefined}
        disabled={deaktiviert}
        onClick={wechseln}
        data-testid={testid}
        className={cx(
          "bo-schalter bo-motion text-left [-webkit-tap-highlight-color:transparent]",
          groesse === "s" && "bo-schalter--s",
          zeile ? "flex min-h-11 w-full items-center justify-between gap-4" : "bo-ziel inline-flex items-center",
          className
        )}
      >
        {zeile && (
          <span className="min-w-0">
            <span className="block text-[15px] leading-[22px]">{label}</span>
            {beschreibung && (
              <span id={beschrId} className="mt-0.5 block text-[13px] leading-[18px] text-bo-text-soft">
                {beschreibung}
              </span>
            )}
          </span>
        )}
        {spur}
      </button>
      {!zeile && beschreibung && (
        <span id={beschrId} className="sr-only">
          {beschreibung}
        </span>
      )}
      {name && <input type="hidden" name={name} value={wert ? "1" : "0"} />}
    </>
  );
}
