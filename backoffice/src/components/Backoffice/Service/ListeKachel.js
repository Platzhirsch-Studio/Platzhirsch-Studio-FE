// Einfache Liste in einer Kachel (Server): Kopfzeile, Zeilen 72 hoch mit Haarlinie, erste Spalte = Objekt mit Link
// (ganze Zeile klickbar), unter 768 px Karten. Für Einsätze, Ersatzteile, Bestellungen, Regress, Verträge.
import Link from "next/link";
import cx from "../cx";
import { Bild } from "./Teile";
import "../DataTable/datatable.css";
import "./service.css";

/**
 * @param {{spalten:Array<{titel:string, rechts?:boolean, breit?:string, nurAb?:"lg"|"xl"}>,
 *   zeilen:Array<{key:string, href:string, titel:string, unter?:string, bild?:string|null, icon?:string, zellen:import("react").ReactNode[], karte?:import("react").ReactNode}>,
 *   fuss?:import("react").ReactNode, testid?:string}} p
 */
export default function ListeKachel({ spalten, zeilen, fuss, testid = "liste" }) {
  const ab = (s) => (s.nurAb === "lg" ? "hidden lg:table-cell" : s.nurAb === "xl" ? "hidden xl:table-cell" : "");
  return (
    <div className="bo-dt" data-testid={testid}>
      <div className="hidden overflow-x-auto md:block">
        <table className="bo-dt__tabelle">
          <thead>
            <tr>
              {spalten.map((s) => (
                <th key={s.titel} data-rechts={s.rechts ? "" : undefined} className={ab(s)}>
                  {s.titel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z) => (
              <tr key={z.key}>
                <td className={cx("bo-dt__kopfzelle", spalten[0]?.breit || "max-w-[360px]")}>
                  <span className="bo-dt-objekt">
                    {(z.bild !== undefined || z.icon) && <Bild src={z.bild} icon={z.icon} />}
                    <span className="min-w-0">
                      <Link href={z.href} className="bo-dt-objekt__link">
                        <span className="bo-dt-objekt__titel line-clamp-2">{z.titel}</span>
                      </Link>
                      {z.unter && <span className="bo-dt-objekt__unter">{z.unter}</span>}
                    </span>
                  </span>
                </td>
                {z.zellen.map((c, i) => (
                  <td key={i} className={cx(spalten[i + 1]?.rechts && "text-right tabular-nums", ab(spalten[i + 1] || {}), "text-[14px]")}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="bo-dt-karten">
        {zeilen.map((z) => (
          <li key={z.key} className="bo-dt-karte">
            {(z.bild !== undefined || z.icon) && <Bild src={z.bild} icon={z.icon} />}
            <span className="min-w-0 flex-1">
              <Link href={z.href} className="bo-dt-objekt__link">
                <span className="bo-dt-objekt__titel line-clamp-2">{z.titel}</span>
              </Link>
              {z.unter && <span className="bo-dt-objekt__unter">{z.unter}</span>}
              <span className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">{z.karte ?? z.zellen[0]}</span>
            </span>
          </li>
        ))}
      </ul>
      {fuss && <div className="bo-dt__fuss">{fuss}</div>}
    </div>
  );
}
