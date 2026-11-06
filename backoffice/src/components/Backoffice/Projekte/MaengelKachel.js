// Kachel „Offene Mängel“ der Übersicht: Zahl leicht (34/400), darunter die drei dringendsten mit Frist.
import Link from "next/link";
import Kachel from "../Kachel";
import Leer from "../Leer";
import { Icon } from "../icons";
import { TEXTE } from "@/lib/backoffice/projekte/texte";
import { datumKurz } from "@/lib/backoffice/projekte/anzeige";
import "./projekte.css";

export default function MaengelKachel({ maengel = [], heute, className }) {
  const T = TEXTE.maengel;
  const ueber = maengel.filter((m) => m.ueberfaellig > 0).length;
  void heute;
  return (
    <Kachel titel={TEXTE.kennzahl.maengel} unter={ueber ? `${ueber} über der Frist` : "keine über der Frist"} href="/projekte/maengel" className={className} testid="kennzahl-maengel"
      werkzeuge={<span className="bo-zahl-gross tabular-nums" aria-label={`${maengel.length} offene Mängel`}>{maengel.length}</span>}>
      {maengel.length ? (
        <ul className="bo-prj-liste">
          {maengel.slice(0, 3).map((m) => (
            <li key={m.id}>
              <span className="bo-prj-liste__ico" data-ton={m.ueberfaellig ? "eiche" : undefined} aria-hidden="true">
                <Icon name="TriangleAlert" className="size-4" />
              </span>
              <Link href={`/projekte/maengel?projekt=${encodeURIComponent(m.projekt)}`} className="min-w-0 flex-1 focus-visible:outline-none">
                <span className="bo-prj-titel block truncate text-[15px] leading-5">{m.beschreibung}</span>
                <span className="bo-prj-unter block truncate">{T.quelle[m.quelle]}{m.verantwortlich ? ` · ${m.verantwortlich}` : ""}</span>
              </Link>
              <span className="bo-prj-liste__zeit">{m.ueberfaellig ? T.ueberfaellig(m.ueberfaellig) : m.frist ? `bis ${datumKurz(m.frist)}` : ""}</span>
            </li>
          ))}
        </ul>
      ) : (
        <Leer art="erledigt" groesse="karte" titel={T.leer} />
      )}
    </Kachel>
  );
}
