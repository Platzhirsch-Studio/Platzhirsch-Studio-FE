"use client";
import Feld from "./Feld";
import Knopf from "../Knopf";
import { Icon } from "../icons";
import { LAYOUT_FELDTYPEN, NICHT_ANZEIGEN } from "@/lib/backoffice/frappe/feldtypen";
import { anzeige } from "@/lib/backoffice/labels";
import { FORMULAR } from "./texte";
import "./formular.css";

/**
 * Kindtabelle inline bearbeitbar (Lounge: eingelassene Karte Radius 20, Zeilen mit Haarlinie, Team P0-5b): Zeilen hinzufügen/entfernen, Spalten = in_list_view-
 * Felder der Kind-DocType (sonst die ersten 5). Werte liegen als JSON im versteckten
 * Feld __tabelle__<fieldname> (formDataZuWerte liest es). Breite Tabellen scrollen
 * waagrecht in ihrem Rahmen (min-w-0 bis zur Seite), die #-Spalte bleibt links stehen.
 */
export default function Kindtabelle({ feld, kindMeta, zeilen = [], onChange, nurLesen = false, fehler }) {
  const spalten = kindMeta
    ? kindMeta.fields.filter((f) => !LAYOUT_FELDTYPEN.has(f.fieldtype) && !NICHT_ANZEIGEN.has(f.fieldtype) && !f.hidden && f.fieldtype !== "Table").filter((f, _, alle) => (alle.some((x) => x.in_list_view) ? f.in_list_view : true)).slice(0, 8)
    : [];
  const neu = () => onChange([...zeilen, Object.fromEntries(spalten.map((s) => [s.fieldname, s.default ?? (s.fieldtype === "Check" ? 0 : "")]))]);
  const setze = (i, k, v) => onChange(zeilen.map((z, j) => (j === i ? { ...z, [k]: v } : z)));
  const entferne = (i) => onChange(zeilen.filter((_, j) => j !== i));
  return (
    <div className="col-span-full min-w-0">
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
        <p className="min-w-0 text-[13px] leading-[18px] font-medium text-bo-text-soft">
          {anzeige(feld.label)}
          {feld.reqd ? <span aria-hidden="true" className="text-bo-danger-text"> *</span> : null}
          <span className="ml-2 font-normal tabular-nums text-bo-text-faint">{FORMULAR.zeilen(zeilen.length)}</span>
        </p>
        {!nurLesen && (
          <Knopf size="s" variant="secondary" icon="Plus" onClick={neu}>
            {FORMULAR.zeileNeu}
          </Knopf>
        )}
      </div>
      <input type="hidden" name={`__tabelle__${feld.fieldname}`} value={JSON.stringify(zeilen)} />
      {!kindMeta && <p className="text-[13px] text-bo-text-soft">{FORMULAR.nichtBearbeitbar}</p>}
      {kindMeta && (
        <div className="bo-fo-kind bo-scroll-x max-w-full overflow-x-auto" data-testid="kindtabelle">
          <table className="w-full text-sm" style={{ minWidth: `${Math.max(480, spalten.length * 150 + 80)}px` }}>
            <thead>
              <tr>
                <th scope="col" className="bo-fo-kind__nr">
                  #
                </th>
                {spalten.map((s) => (
                  <th key={s.fieldname} scope="col">
                    {anzeige(s.label)}
                  </th>
                ))}
                {!nurLesen && <th scope="col" className="w-12" aria-label="Aktionen" />}
              </tr>
            </thead>
            <tbody>
              {zeilen.length === 0 && (
                <tr>
                  <td colSpan={spalten.length + 2} className="py-4! text-center text-[13px] text-bo-text-soft">
                    {FORMULAR.keineZeilen}
                  </td>
                </tr>
              )}
              {zeilen.map((z, i) => (
                <tr key={z.name || i}>
                  <td className="bo-fo-kind__nr pt-3.5!">{i + 1}</td>
                  {spalten.map((s) => (
                    <td key={s.fieldname}>
                      <Feld ohneLabel feld={{ ...s, label: `${anzeige(s.label)} ${FORMULAR.zeile} ${i + 1}`, description: "" }} wert={z[s.fieldname]} onChange={(v) => setze(i, s.fieldname, v)} nurLesen={nurLesen} prefix={`t-${feld.fieldname}-${i}`} />
                    </td>
                  ))}
                  {!nurLesen && (
                    <td>
                      <button type="button" onClick={() => entferne(i)} aria-label={FORMULAR.zeileEntfernen(i + 1)} className="bo-motion bo-ziel inline-flex size-9 items-center justify-center rounded-full text-bo-text-soft transition-colors duration-150 hover:bg-bo-ziegel-soft hover:text-bo-ziegel-text">
                        <Icon name="X" className="size-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {fehler && (
        <p role="alert" className="bo-fo-fehler">
          {fehler}
        </p>
      )}
    </div>
  );
}
