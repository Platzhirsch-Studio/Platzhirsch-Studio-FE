// „Zu tun“ des Sortiments (§ 3.1): Gruppen in fester Reihenfolge, je Gruppe höchstens fünf Zeilen + „alle n“,
// je Zeile ein sichtbarer Knopf (nie nur bei Hover). Lounge: Zeilen als gerundete Flächen in einer Kachel,
// Zähler als weiche Pille, Warnungen mit Eichen-Kante (+ Text, nie Farbe allein). Server-Komponente.
import Link from "next/link";
import Kachel from "../Kachel";
import Knopf from "../Knopf";
import Leer from "../Leer";
import "./sortiment.css";
import { START } from "@/lib/backoffice/sortiment/texte";

/** @param {{gruppen:Array<{id:string, titel:string, anzahl:number, zeilen:object[], alleHref?:string}>, className?:string}} p */
export default function ZuTunListe({ gruppen, className }) {
  return (
    <Kachel className={className} titel={START.zuTun} unter={START.zuTunUnter} testid="zutun">
      {gruppen.length === 0 ? (
        <Leer art="erledigt" groesse="karte" titel={START.allesErledigt} />
      ) : (
        <div className="bo-sor-zutun">
          {gruppen.map((g) => (
            <section key={g.id} className="bo-sor-zutun__gruppe" aria-labelledby={`zt-${g.id}`} data-testid={`zutun-${g.id}`}>
              <h3 id={`zt-${g.id}`} className="bo-sor-zutun__gkopf text-[13px] font-semibold text-bo-text-soft">
                {g.titel}
                <span className="bo-sor-zutun__zahl">{g.anzahl}</span>
              </h3>
              <ul className="flex flex-col">
                {g.zeilen.map((z, i) => (
                  <li key={`${g.id}-${i}`} className="bo-sor-zutun__zeile" data-warn={z.warn ? "true" : undefined}>
                    <div className="min-w-0">
                      <Link href={z.href} className="bo-sor-link bo-sor-link--zeile block truncate text-[15px] font-medium leading-5">
                        {z.titel}
                      </Link>
                      <p className="bo-sor-unter truncate">{z.unter}</p>
                    </div>
                    {z.knopf ? (
                      <Knopf size="s" variant="secondary" href={z.knopf.href} className="relative z-[1]">
                        {z.knopf.titel}
                      </Knopf>
                    ) : null}
                  </li>
                ))}
              </ul>
              {g.anzahl > g.zeilen.length && g.alleHref && (
                <Link href={g.alleHref} className="bo-sor-zutun__alle inline-block">
                  {START.alle(g.anzahl)}
                </Link>
              )}
            </section>
          ))}
        </div>
      )}
    </Kachel>
  );
}
