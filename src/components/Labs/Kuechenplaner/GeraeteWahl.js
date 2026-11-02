"use client";
// Küchenplaner – Geräteauswahl je Gerätemodul aus dem Herstellerkatalog
// (Logik: lib/kuechenplaner/geraete.js). Die schlanke Geräteliste lädt erst,
// wenn ein Gerätemodul aufgeklappt wird (GET /api/labs/kuechenplaner/geraete,
// eine Anfrage je Seitenaufruf) – nicht im Erstlade-Budget des Planers.
// Native <select> mit Gruppen: „passt laut Katalogmaßen“ / „Einbaumaß prüfen“.
// Preis nur, wenn der Katalog ihn anzeigen darf (g.p, vom Server gesetzt).
import { createContext, useContext, useEffect, useState } from "react";
import { geraetHref, geraeteSlots, indexMap, kandidaten, preisTexteDe, pruefeGeraet, withGeraet } from "../../../lib/kuechenplaner/geraete";
import { useKpT } from "./KpCopy";

/** { plan, marke }: aktueller Plan (Sockel-/Korpushöhe der Unterbaunische) und bevorzugte Marke (?geraet=<marke>). */
export const GeraetePlanContext = createContext(null);

export const GERAETE_URL = "/api/labs/kuechenplaner/geraete";
let cache = null; // Promise<Array> – eine Anfrage je Seitenaufruf

export function loadGeraeteIndex(fetcher = fetch) {
  if (!cache) {
    cache = fetcher(GERAETE_URL, { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => (Array.isArray(j?.list) ? j.list : []))
      .catch((e) => {
        cache = null; // nächster Versuch beim nächsten Öffnen
        throw e;
      });
  }
  return cache;
}

/** { index, map, error } – lädt beim ersten Aufruf (enabled = false: nicht laden). */
export function useGeraeteIndex(enabled = true) {
  const [state, setState] = useState({ index: null, map: null, error: false });
  useEffect(() => {
    if (!enabled) return undefined;
    let live = true;
    loadGeraeteIndex()
      .then((index) => live && setState({ index, map: indexMap(index), error: false }))
      .catch(() => live && setState((s) => ({ ...s, error: true })));
    return () => {
      live = false;
    };
  }, [enabled]);
  return state;
}

const STATUS_TEXT = { passt: "Passt laut Katalogmaßen", pruefen: "Einbaumaß prüfen wir im Gespräch", frei: "", passtNicht: "Passt nicht" };
const selectCls = "min-h-11 w-full border border-ink/25 bg-paper px-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
// Sprachen (01.11.2026): Preistexte wie die Katalogseiten (katalog.preis), über die Wörterbücher.
const preisTexte = (p, tr) => {
  const pt = preisTexteDe(p);
  return pt ? { kurz: tr(pt.kurz), lang: tr(pt.lang) } : null;
};
const optText = (g, tr) => {
  const pt = preisTexte(g.p, tr);
  return [`${g.mn} ${g.n}`, pt?.kurz].filter(Boolean).join(" · ");
};

/** Gerätefelder eines Moduls (nichts, wenn das Modul keine Gerätesteckplätze hat). */
export default function GeraeteFields({ m, onChange, idPrefix }) {
  const tr = useKpT();
  const { plan = null, marke = null } = useContext(GeraetePlanContext) || {};
  const slots = geraeteSlots(m);
  const { index, map, error } = useGeraeteIndex(slots.length > 0);
  if (!slots.length) return null;
  return (
    <fieldset className="min-w-0 space-y-2 border-t border-ink/10 pt-2" data-kp-geraete="">
      <legend className="text-[0.8125rem] font-medium text-ink">{tr("Gerät wählen (optional)")}</legend>
      {error && <p className="text-[0.75rem] text-ink-soft" role="status">{tr("Geräteliste gerade nicht erreichbar – das Modell stimmen wir im Gespräch ab.")}</p>}
      {slots.map((s, i) => {
        const id = `${idPrefix}-geraet-${i}`;
        const slug = m.d?.[i] || "";
        const g = slug && map ? map.get(slug) : null;
        const res = g ? pruefeGeraet(s, g, plan) : null;
        const k = index ? kandidaten(s, index, plan, marke) : null;
        const pt = g ? preisTexte(g.p, tr) : null;
        // Gewähltes Gerät bleibt sichtbar, auch wenn es nicht mehr passt.
        const extra = g && res?.status === "passtNicht" ? [g] : [];
        return (
          <div key={`${s.art}-${i}`} className="text-[0.8125rem] text-ink-soft">
            <label htmlFor={id}>{tr(s.label)}</label>
            <select id={id} className={`${selectCls} mt-0.5`} value={slug} disabled={!index} onChange={(e) => onChange(withGeraet(m, i, e.target.value))}>
              <option value="">{tr(index ? "Modell im Gespräch wählen" : "Geräteliste lädt …")}</option>
              {extra.map((x) => <option key={x.s} value={x.s}>{optText(x, tr)} ({tr("passt nicht")})</option>)}
              {k?.passt.length > 0 && <optgroup label={tr("Passt laut Katalogmaßen")}>{k.passt.map((x) => <option key={x.s} value={x.s}>{optText(x, tr)}</option>)}</optgroup>}
              {k?.frei.length > 0 && <optgroup label={tr("Auswahl")}>{k.frei.map((x) => <option key={x.s} value={x.s}>{optText(x, tr)}</option>)}</optgroup>}
              {k?.pruefen.length > 0 && <optgroup label={tr("Einbaumaß im Katalog nicht angegeben")}>{k.pruefen.map((x) => <option key={x.s} value={x.s}>{optText(x, tr)}</option>)}</optgroup>}
            </select>
            {index && k && !k.passt.length && !k.frei.length && !k.pruefen.length && (
              <p className="mt-0.5 text-[0.75rem]">{tr("Für diese Nische führt unser Katalog derzeit kein passendes Gerät – wir beraten Sie gern persönlich.")}</p>
            )}
            {g && (
              <p className="mt-0.5 text-[0.75rem]" aria-live="polite">
                {res?.status === "passtNicht" ? <strong className="text-notice">{tr("Passt nicht:")} {tr(res.gruende[0])}. </strong> : STATUS_TEXT[res?.status] ? `${tr(STATUS_TEXT[res.status])}. ` : res?.gruende?.[0] ? `${tr(res.gruende[0])}. ` : ""}
                {pt && <span className="block">{pt.lang}</span>}
                <a className="underline underline-offset-2" href={geraetHref(g.s, tr.locale)} target="_blank" rel="noopener">{tr("Produktseite {v}", { v: `${g.mn} ${g.n}` })}</a>
              </p>
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
