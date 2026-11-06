"use client";
// Filterzeile als GET-Formular (URL-Zustand, Q-B7): Pillen-Suche, Auswahl-Pillen (senden sofort), runder
// „Zurücksetzen“-Knopf. Ohne JavaScript bleibt es ein normales Formular mit Enter.
import { useRef } from "react";
import { ChevronDown, Search } from "lucide-react";
import { RundKnopf } from "../Knopf";

/**
 * @param {{basis:string, params:Record<string,string>, suche?:{name:string, platzhalter:string}, auswahl?:Array<{name:string, label:string, alle:string, optionen:Array<{wert:string, titel:string}>}>, behalten?:string[], zuruecksetzen?:string}} p
 */
export default function FilterForm({ basis, params = {}, suche, auswahl = [], behalten = [], zuruecksetzen }) {
  const ref = useRef(null);
  const aktiv = auswahl.some((a) => params[a.name]) || (suche && params[suche.name]);
  return (
    <form ref={ref} action={basis} method="get" role="search" className="bo-mar-werkzeuge__rechts" data-testid="filter">
      {behalten.filter((k) => params[k]).map((k) => (
        <input key={k} type="hidden" name={k} value={params[k]} />
      ))}
      {suche && (
        <label className="bo-suche bo-mar-suche">
          <Search className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only">{suche.platzhalter}</span>
          <input type="search" name={suche.name} defaultValue={params[suche.name] || ""} placeholder={suche.platzhalter} enterKeyHint="search" />
        </label>
      )}
      {auswahl.map((a) => (
        <label key={a.name} className="bo-mar-auswahlpille">
          <span className="sr-only">{a.label}</span>
          <select name={a.name} defaultValue={params[a.name] || ""} onChange={() => ref.current?.requestSubmit()}>
            <option value="">{a.alle}</option>
            {a.optionen.map((o) => (
              <option key={o.wert} value={o.wert}>
                {o.titel}
              </option>
            ))}
          </select>
          <ChevronDown className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </label>
      ))}
      {aktiv && zuruecksetzen && <RundKnopf icon="X" href={zuruecksetzen} label="Filter zurücksetzen" testid="filter-zuruecksetzen" />}
    </form>
  );
}
