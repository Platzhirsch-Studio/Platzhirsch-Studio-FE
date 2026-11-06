import Link from "next/link";
import cx from "../cx";
import { RundKnopf } from "../Knopf";
import { Icon } from "../icons";
import { TEXTE } from "@/lib/backoffice/akte/texte";
import "./akte.css";

// Bezüge (G-14, 05 § 5.3, Team P0-5a): die drei Gruppen aus lib/backoffice/bezuege.js
// (Vorher · Gehört zu · Folgt daraus) als ruhige Zeilen wie im Entwurf „Lounge“ (Symbol im Kreis 44,
// Titel 15/600, Unterzeile 13, Pfeil rechts; Hover = Fläche, keine Linien). Folgedokumente tragen
// einen Zähler und – nur mit Anlegerecht – einen runden „+“-Knopf. „nicht verknüpft“ (Q-A11) und
// „kein Zugriff“ erscheinen als stille Zeile ohne Link. Server- und Client-tauglich.

function Zeile({ e }) {
  const still = !e.href;
  const info = e.nichtVerknuepft
    ? TEXTE.bezuege.nichtVerknuepft
    : e.keinZugriff
      ? TEXTE.bezuege.keinZugriff
      : e.info || [e.gruppe, e.zaehlerFehlt ? TEXTE.bezuege.zaehlerFehlt : null].filter(Boolean).join(" · ") || null;
  const anzahlText = Number.isFinite(e.anzahl) ? TEXTE.bezuege.anzahl(e.anzahl) : null;
  const inhalt = (
    <>
      <span className="bo-bezuege__ico" aria-hidden="true">
        <Icon name={e.icon || "FileText"} className="size-5" />
      </span>
      <span className="bo-bezuege__txt">
        <span className="bo-bezuege__t">{e.titel}</span>
        {info && <span className="bo-bezuege__i">{info}</span>}
      </span>
      <span className="bo-bezuege__r">
        {Number.isFinite(e.anzahl) && (
          <span className="bo-bezuege__zahl" data-null={e.anzahl === 0 ? "" : undefined} aria-hidden="true">
            {e.anzahl}
          </span>
        )}
        {!still && <Icon name="ChevronRight" className="size-4" />}
      </span>
    </>
  );
  const zeile = still ? (
    <div className="bo-bezuege__zeile" data-still="">
      {inhalt}
    </div>
  ) : (
    <Link href={e.href} className="bo-bezuege__zeile" aria-label={[TEXTE.bezuege.oeffnen(e.titel), info, anzahlText].filter(Boolean).join(", ")}>
      {inhalt}
    </Link>
  );
  if (!e.anlegenHref) return <li>{zeile}</li>;
  return (
    <li className="bo-bezuege__zeile-wrap">
      {zeile}
      <RundKnopf icon="Plus" groesse="s" label={TEXTE.bezuege.anlegen(e.titel)} href={e.anlegenHref} />
    </li>
  );
}

/**
 * @param {object} p
 * @param {{vorher?:object[], gleichzeitig?:object[], nachher?:object[]}} p.gruppen  Ergebnis von ladeBezuege()/gruppiereBezuege()
 * @param {Array<"gleichzeitig"|"vorher"|"nachher">} [p.reihenfolge]
 * @param {string} [p.leerText]
 */
export default function Bezuege({ gruppen = {}, reihenfolge = ["gleichzeitig", "vorher", "nachher"], leerText = TEXTE.bezuege.leer, className, testid = "bezuege" }) {
  const sicht = reihenfolge.filter((g) => (gruppen[g] || []).length > 0);
  if (!sicht.length) return <p className="bo-akte-slot__ruhe">{leerText}</p>;
  return (
    <div className={cx("bo-bezuege", className)} data-testid={testid}>
      {sicht.map((g) => (
        <section key={g} aria-label={TEXTE.bezuege.gruppen[g]}>
          <h3 className="bo-bezuege__gruppe-t">{TEXTE.bezuege.gruppen[g]}</h3>
          <ul className="bo-bezuege__liste">
            {gruppen[g].map((e) => (
              <Zeile key={e.id} e={e} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
