// Einfache Tabelle in einer Kachel (Lounge §6 „Tabelle in Kachel“): Zeilen 72, Haarlinie oben, Hover als
// gerundete Fläche, ganze Zeile verlinkt (erste Zelle trägt den Link), am Telefon Karten. Server-tauglich.

import Link from "next/link";
import Kachel from "../Kachel";
import "./projekte.css";

/**
 * @param {{titel?:any, unter?:any, werkzeuge?:any, spalten:Array<{titel:string, rechts?:boolean, breit?:string, versteckt?:string}>,
 *   zeilen:Array<{key:string, href?:string, titel:any, unter?:any, vorne?:any, zellen:any[]}>, leer?:any, fuss?:any, testid?:string, className?:string}} p
 */
export default function Tabelle({ titel, unter, werkzeuge, spalten = [], zeilen = [], leer, fuss, testid = "tabelle", className }) {
  return (
    <Kachel titel={titel} unter={unter} werkzeuge={werkzeuge} className={className} testid={testid} fuss={fuss}>
      {!zeilen.length ? (
        leer
      ) : (
        <>
          <div className="bo-prj-tab-huelle -mx-3 overflow-x-auto">
            <table className="bo-prj-tab">
              <thead>
                <tr>
                  {spalten.map((s, i) => (
                    <th key={i} scope="col" data-rechts={s.rechts ? "" : undefined} className={s.versteckt}>
                      {s.titel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zeilen.map((z) => (
                  <tr key={z.key} data-testid={`${testid}-zeile`}>
                    <td>
                      <div className="flex min-w-0 items-center gap-3">
                        {z.vorne}
                        <div className="min-w-0">
                          {z.href ? (
                            <Link href={z.href} className="bo-prj-zeilenlink bo-prj-titel block max-w-[44ch] truncate">
                              {z.titel}
                            </Link>
                          ) : (
                            <span className="bo-prj-titel block max-w-[44ch] truncate">{z.titel}</span>
                          )}
                          {z.unter && <p className="bo-prj-unter max-w-[52ch] truncate">{z.unter}</p>}
                        </div>
                      </div>
                    </td>
                    {z.zellen.map((c, i) => (
                      <td key={i} data-rechts={spalten[i + 1]?.rechts ? "" : undefined} className={`${spalten[i + 1]?.versteckt || ""} ${spalten[i + 1]?.rechts ? "whitespace-nowrap tabular-nums" : ""}`}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="bo-prj-karten" data-testid="karten-liste">
            {zeilen.map((z) => (
              <li key={z.key} className="bo-prj-karte">
                {z.vorne}
                <div className="min-w-0 flex-1">
                  {z.href ? (
                    <Link href={z.href} className="bo-prj-titel block truncate after:absolute after:inset-0 after:rounded-[20px]">
                      {z.titel}
                    </Link>
                  ) : (
                    <span className="bo-prj-titel block truncate">{z.titel}</span>
                  )}
                  {z.unter && <p className="bo-prj-unter truncate">{z.unter}</p>}
                </div>
                {z.zellen[z.zellen.length - 1]}
              </li>
            ))}
          </ul>
        </>
      )}
    </Kachel>
  );
}
