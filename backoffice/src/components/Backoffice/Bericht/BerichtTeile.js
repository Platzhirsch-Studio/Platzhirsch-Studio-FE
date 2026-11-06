"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import cx from "../cx";
import Knopf from "../Knopf";
import Datumsfeld from "../Formular/Datumsfeld";
import { useToast } from "../Toast";
import { zelle } from "../DataTable/DataTable";
import { cent } from "@/lib/backoffice/format";
import { anzeige } from "@/lib/backoffice/labels";
import { berichtCsv, berichtDateiname, summen, summierbar } from "./logik";
import { berichtExportAction } from "./aktionen";
import { BERICHT } from "./texte";
import "../DataTable/datatable.css";

/**
 * Filterzeile des Berichts (GET): Zeitraum mit deutschen Datumsfeldern, Auswahlfelder als Pillen-Select,
 * „Anwenden“. Als schwebende Kachel-Zeile ohne Rahmen.
 * @param {{basis:string, params:Record<string,string>, zeitraum?:boolean|{label?:string}, felder?:Array<{name:string,label:string,optionen:Array<{wert:string,titel:string}>}>}} p
 */
export function BerichtFilter({ basis, params = {}, zeitraum = true, felder = [] }) {
  const router = useRouter();
  const label = (typeof zeitraum === "object" && zeitraum.label) || BERICHT.zeitraum;
  const aktiv = ["von", "bis", ...felder.map((f) => f.name)].some((k) => params[k]);
  return (
    <form
      method="get"
      action={basis}
      data-testid="bericht-filter"
      className="mb-6 flex min-w-0 flex-wrap items-end gap-3 rounded-[24px] bg-bo-surface p-4 shadow-(--bo-sh-card)"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const u = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) if (v && !fd.has(k)) u.set(k, v);
        for (const [k, v] of fd.entries()) if (String(v).trim()) u.set(k, String(v).trim());
        const s = u.toString();
        router.push(s ? `${basis}?${s}` : basis);
      }}
    >
      {zeitraum && (
        <>
          <div className="w-full min-w-0 sm:w-44">
            <label htmlFor="bericht-von" className="mb-1.5 block text-[13px] font-medium text-bo-text-soft">
              {label} {BERICHT.von}
            </label>
            <Datumsfeld id="bericht-von" name="von" defaultValue={params.von || ""} kompakt />
          </div>
          <div className="w-full min-w-0 sm:w-44">
            <label htmlFor="bericht-bis" className="mb-1.5 block text-[13px] font-medium text-bo-text-soft">
              {BERICHT.bis}
            </label>
            <Datumsfeld id="bericht-bis" name="bis" defaultValue={params.bis || ""} kompakt />
          </div>
        </>
      )}
      {felder.map((f) => (
        <div key={f.name} className="w-full min-w-0 sm:w-48">
          <label htmlFor={`bericht-${f.name}`} className="mb-1.5 block text-[13px] font-medium text-bo-text-soft">
            {f.label}
          </label>
          <select id={`bericht-${f.name}`} name={f.name} defaultValue={params[f.name] || ""} className="bo-input rounded-pill! border-transparent! bg-bo-surface-2!">
            <option value="">{BERICHT.alle}</option>
            {f.optionen.map((o) => (
              <option key={o.wert} value={o.wert}>
                {o.titel}
              </option>
            ))}
          </select>
        </div>
      ))}
      <span className="flex gap-2">
        <Knopf type="submit" variant="secondary" icon="Filter">
          {BERICHT.anwenden}
        </Knopf>
        {aktiv && (
          <Knopf href={basis} variant="ghost" icon="X">
            {BERICHT.zuruecksetzen}
          </Knopf>
        )}
      </span>
    </form>
  );
}

/**
 * Ergebnistabelle in schwebender Kachel (ohne Paging) mit Summenzeile; CSV-Export (nur mit Recht,
 * protokolliert über berichtExportAction), PDF als Link oder als deaktivierter Knopf mit Ersatzweg.
 * @param {{bericht:string, bereich:string, spalten:object[], zeilen:object[], statusTon?:object, darfExport?:boolean,
 *   pdfHref?:string, params?:Record<string,string>, titel?:string}} p
 */
export function BerichtTabelle({ bericht, bereich, spalten = [], zeilen = [], statusTon = {}, darfExport = false, pdfHref, params = {}, titel = BERICHT.ergebnis }) {
  const { zeige } = useToast();
  const [laedt, start] = useTransition();
  const sum = summen(spalten, zeilen);
  const mitSumme = Object.keys(sum).length > 0 && zeilen.length > 1;

  const exportiere = () =>
    start(async () => {
      const r = await berichtExportAction({ bericht, bereich, zeilen: zeilen.length });
      if (!r.ok) return zeige(r.message, { art: "fehler" });
      const datei = berichtDateiname(bericht, params);
      const blob = new Blob([berichtCsv(spalten.map((s) => ({ ...s, label: anzeige(s.label) })), zeilen, { summeText: BERICHT.summe })], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = datei;
      a.click();
      URL.revokeObjectURL(a.href);
      zeige(BERICHT.exportiert(datei), { art: "ok" });
    });

  return (
    <section className="bo-dt" aria-labelledby="bericht-ergebnis" data-testid="bericht-tabelle">
      <div className="bo-dt__kopf">
        <h2 id="bericht-ergebnis" className="text-[17px] leading-6 font-semibold tracking-[-0.012em]">
          {titel}
        </h2>
        <span className="bo-dt__zahl">{BERICHT.zeilen(zeilen.length)}</span>
        <span className="ml-auto flex flex-wrap items-start gap-2">
          {darfExport && (
            <Knopf size="s" variant="secondary" icon="Download" onClick={exportiere} laedt={laedt} data-testid="bericht-csv">
              {BERICHT.csv}
            </Knopf>
          )}
          {pdfHref ? (
            <Knopf size="s" variant="secondary" icon="Printer" href={pdfHref} target="_blank" rel="noopener" data-testid="bericht-pdf">
              {BERICHT.pdf}
            </Knopf>
          ) : (
            <Knopf size="s" variant="secondary" icon="Printer" disabled grund={BERICHT.pdfFehlt} data-testid="bericht-pdf">
              {BERICHT.pdf}
            </Knopf>
          )}
        </span>
      </div>
      <div className="bo-scroll-x overflow-x-auto">
        <table className="bo-dt__tabelle min-w-[560px]" data-dicht="">
          <thead>
            <tr>
              {spalten.map((s) => (
                <th key={s.fieldname} scope="col" data-rechts={summierbar(s) ? "" : undefined}>
                  {anzeige(s.label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z, i) => (
              <tr key={z.name || i}>
                {spalten.map((s) => (
                  <td key={s.fieldname} className={cx(summierbar(s) && "text-right tabular-nums", "whitespace-nowrap")}>
                    {zelle(z, s, statusTon)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {mitSumme && (
            <tfoot>
              <tr>
                {spalten.map((s, i) => (
                  <td key={s.fieldname} className={cx("border-t-[length:var(--bo-hair)] border-bo-line-strong pt-4 pb-2 text-[15px] font-semibold", summierbar(s) && "text-right tabular-nums")}>
                    {i === 0 && !summierbar(s) ? BERICHT.summe : summierbar(s) ? (s.cent ? cent(sum[s.fieldname]) : sum[s.fieldname].toLocaleString("de-AT")) : ""}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
