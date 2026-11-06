// Kassa – Berichtstabelle in einer Kachel (Team B-KAS, Lounge „Tabelle in Kachel“): Zeilen 52–64, Haarlinie,
// Zahlen rechtsbündig und tabellarisch, Summenzeile; unter 640 px als Karten. Server-Komponente.

import { euro } from "@/lib/backoffice/kassa/betraege";
import { zeit } from "./Verwaltung";

function zelle(art, w) {
  if (w === null || w === undefined || w === "") return "–";
  if (art === "cent") return euro(Number(w) || 0);
  if (art === "zahl") return String(w);
  if (art === "datum") return zeit(w, false);
  if (art === "zeit") return zeit(w);
  return String(w);
}

export default function BerichtTabelle({ spalten, zeilen, summe = true, testid = "bericht-tabelle" }) {
  const zahlen = spalten.filter((s) => s.art === "cent" || s.art === "zahl");
  const summen = Object.fromEntries(zahlen.map((s) => [s.feld, zeilen.reduce((a, z) => a + (Number(z[s.feld]) || 0), 0)]));
  const rechts = (s) => s.art === "cent" || s.art === "zahl";
  return (
    <div className="-mx-2 overflow-x-auto" data-testid={testid}>
      <table className="w-full min-w-[560px] border-separate border-spacing-0 text-[14px]">
        <thead>
          <tr>
            {spalten.map((s) => (
              <th key={s.feld} scope="col" className={`px-2 pb-2 text-[13px] font-medium text-bo-text-soft ${rechts(s) ? "text-right" : "text-left"}`}>
                {s.titel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {zeilen.map((z, i) => (
            <tr key={i} className="[&>td]:border-t [&>td]:border-bo-line">
              {spalten.map((s) => (
                <td key={s.feld} className={`h-13 px-2 ${rechts(s) ? "text-right tabular-nums whitespace-nowrap" : ""} ${s.art === "cent" && Number(z[s.feld]) < 0 ? "text-bo-ziegel-text" : ""}`}>
                  {zelle(s.art, z[s.feld])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {summe && zahlen.length > 0 && zeilen.length > 1 && (
          <tfoot>
            <tr className="[&>td]:border-t [&>td]:border-bo-line-strong">
              {spalten.map((s, i) => (
                <td key={s.feld} className={`h-12 px-2 font-semibold ${rechts(s) ? "text-right tabular-nums whitespace-nowrap" : ""}`}>
                  {i === 0 ? "Summe" : rechts(s) && !/bestand/.test(s.feld) ? zelle(s.art, summen[s.feld]) : ""}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
