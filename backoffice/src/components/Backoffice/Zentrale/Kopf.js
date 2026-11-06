import Link from "next/link";
import Knopf, { RundKnopf } from "../Knopf";
import Zahl from "../Charts/Zahl";
import { ordneChips } from "@/lib/backoffice/zentrale/fristen";
import { FRISTEN, ZENTRALE } from "@/lib/backoffice/zentrale/texte";

// Kopf der Zentrale (Lounge § 7.1 / Referenz Praxis-Dashboard): leichte zweizeilige Begrüßung 56/300 (Name 400),
// darüber Datum · Standort/Profil, rechts drei leichte Zahlen mit Haarlinien und die eine Hauptaktion in Tinte.
// Darunter die Heute-Leiste (Konzept § 3.2.4): Chips nur mit Wert > 0, rot → Sand → neutral, max. 6 + „+n“.

export function ZentraleKopf({ gruss, vorname, ueber, zahlen = [], primaer, neben }) {
  return (
    <header className="zb-gruss" data-testid="seitenkopf" data-variante="gruss">
      <div className="min-w-0">
        <p className="zb-gruss__ueber">{ueber}</p>
        <h1 className="zb-gruss__titel">
          {gruss},<span>{vorname}</span>
        </h1>
      </div>
      {zahlen.length > 0 ? (
        <dl className="zb-zahlen" aria-label={ZENTRALE.seitentitel} data-testid="kennzahlen">
          {zahlen.map((z) => (
            <div key={z.id} className="zb-zahl">
              <dt>{z.text}</dt>
              <dd>
                <Link href={z.href} aria-label={`${z.text}: ${z.wert === null ? "–" : z.wert}${z.einheit ? ` ${z.einheit}` : ""}`}>
                  {z.wert === null || z.wert === undefined ? "–" : <Zahl wert={z.wert} format={z.dez ? "dezimal" : "zahl"} hochzaehlen />}
                  {z.einheit && z.wert !== null && <small>{z.einheit}</small>}
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <span />
      )}
      <div className="zb-gruss__akt">
        {neben}
        {primaer && (
          <Knopf variant="primary" size="l" icon="Plus" href={primaer.href} data-testid="zentrale-primaer">
            {primaer.titel}
          </Knopf>
        )}
      </div>
    </header>
  );
}

export function HeuteLeiste({ chips = [] }) {
  const { sichtbar, mehr } = ordneChips(chips, 6);
  return (
    <nav className="zb-chips" aria-label={ZENTRALE.heuteLeiste} data-testid="heute-leiste">
      {sichtbar.length === 0 ? (
        <span className="zb-chips__leer">{ZENTRALE.heuteNichts}</span>
      ) : (
        <>
          {sichtbar.map((c) => (
            <Link key={c.id} href={c.href || "/"} className="zb-chip bo-tip" data-ton={c.ton} data-tip={c.rechtsgrundlage || undefined} aria-describedby={c.rechtsgrundlage ? `zb-chip-${c.id}` : undefined} data-testid="heute-chip">
              <span className="zb-chip__punkt" aria-hidden="true" />
              {c.text}
              {c.rechtsgrundlage && (
                <span id={`zb-chip-${c.id}`} className="sr-only">
                  {c.rechtsgrundlage}
                </span>
              )}
            </Link>
          ))}
          {mehr > 0 && (
            <Link href="/aufgaben" className="zb-chip">
              {FRISTEN.mehr(mehr)}
            </Link>
          )}
        </>
      )}
    </nav>
  );
}

export function ZentraleNeben({ links = [] }) {
  return links.map((l) => <RundKnopf key={l.href} icon={l.icon} label={l.titel} href={l.href} />);
}
