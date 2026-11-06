"use client";
// G-21 BetragFeld (Team P0-6): Beträge nur über dieses Feld (Q-D5). Komma-Modell, `inputmode="decimal"`,
// Wert in Cent (ganze Zahl oder null). Anzeige beim Verlassen „1.234,50“, Fehler unter dem Feld als Text
// „Betrag im Format 1.234,50“ (Q-D4). Negativ nur mit `negativ`. Mit `name` zusätzlich ein verstecktes Feld
// mit dem Cent-Wert für FormData/GET.

import { useId, useState } from "react";
import { TriangleAlert } from "lucide-react";
import cx from "../cx";
import { formatBetrag, parseBetrag } from "./betrag";
import { TEXTE } from "./texte";
import "./eingabe.css";

/**
 * @param {object} p
 * @param {number|null} [p.value]            Cent (gesteuert)
 * @param {number|null} [p.defaultValue]     Cent (ungesteuert)
 * @param {(cent:number|null, info:{ok:boolean, text:string}) => void} [p.onChange]  bei jeder gültigen Änderung und beim Verlassen
 * @param {string} [p.name]                  verstecktes Feld mit Cent-Wert
 * @param {string} [p.id]
 * @param {boolean} [p.negativ]              Minus erlaubt (Gutschrift, Korrektur)
 * @param {number} [p.maxCent]
 * @param {boolean} [p.waehrung]             „€“ rechts im Feld (Standard an)
 * @param {boolean} [p.required]
 * @param {boolean} [p.disabled]
 * @param {string} [p.fehler]                Fehler von außen (Server); sonst eigener Formatfehler
 * @param {string} [p.describedBy]
 * @param {string} [p["aria-label"]]
 * @param {string} [p.placeholder]
 */
export default function BetragFeld({ value, defaultValue = null, onChange, name, id, negativ = false, maxCent, waehrung = true, required, disabled, fehler: fehlerAussen, describedBy, placeholder = "0,00", className, testid, ...rest }) {
  const eigeneId = useId();
  const feldId = id || `betrag-${eigeneId}`;
  const fehlerId = `${feldId}-fehler`;
  const gesteuert = value !== undefined;
  const [eigen, setEigen] = useState(defaultValue);
  const cent = gesteuert ? value : eigen;
  const [text, setText] = useState(() => formatBetrag(cent));
  const [fokus, setFokus] = useState(false);
  const [fehler, setFehler] = useState("");
  const [zuletzt, setZuletzt] = useState(cent);

  // Wert von außen geändert (gesteuert) und Feld nicht in Bearbeitung → Anzeige nachziehen.
  if (!fokus && cent !== zuletzt) {
    setZuletzt(cent);
    setText(formatBetrag(cent));
    setFehler("");
  }

  const uebernehmen = (roh, beimVerlassen) => {
    const r = parseBetrag(roh, { negativ, maxCent });
    if (!r.ok) {
      if (beimVerlassen) setFehler(r.fehler);
      return;
    }
    setFehler("");
    if (!gesteuert) setEigen(r.cent);
    setZuletzt(r.cent);
    if (r.cent !== cent || beimVerlassen) onChange?.(r.cent, { ok: true, text: roh });
    if (beimVerlassen) setText(formatBetrag(r.cent));
  };

  const sichtbarerFehler = fehlerAussen || fehler;
  const beschrieben = [describedBy, sichtbarerFehler ? fehlerId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cx("min-w-0", className)}>
      <span className="bo-ein-betrag">
        <input
          {...rest}
          id={feldId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          className="bo-input"
          value={text}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={sichtbarerFehler ? "true" : undefined}
          aria-describedby={beschrieben}
          data-testid={testid}
          onFocus={(e) => {
            setFokus(true);
            // Text bleibt stehen („2.400,00“ wird beim Verlassen wieder gelesen); markiert zum schnellen Überschreiben.
            e.target.select?.();
            rest.onFocus?.(e);
          }}
          onChange={(e) => {
            setText(e.target.value);
            if (fehler) setFehler("");
            uebernehmen(e.target.value, false);
          }}
          onBlur={(e) => {
            setFokus(false);
            uebernehmen(e.target.value, true);
            rest.onBlur?.(e);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") uebernehmen(e.currentTarget.value, true);
            rest.onKeyDown?.(e);
          }}
        />
        {waehrung && (
          <span className="bo-ein-betrag__w" aria-hidden="true">
            {TEXTE.betrag.waehrung}
          </span>
        )}
      </span>
      {name && <input type="hidden" name={name} value={cent ?? ""} />}
      {sichtbarerFehler && (
        <p id={fehlerId} className="bo-ein-fehler" role="alert">
          <TriangleAlert aria-hidden="true" className="mt-px size-4 shrink-0" strokeWidth={1.75} />
          {sichtbarerFehler}
        </p>
      )}
    </div>
  );
}
