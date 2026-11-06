import Link from "next/link";
import { Fragment } from "react";
import cx from "./cx";
import { Icon } from "./icons";
import { RundKnopf } from "./Knopf";
import { hilfetext } from "@/lib/backoffice/labels";
import { SEITE } from "./ZuTun/texte";

// Seitenkopf im Lounge-Stil (art-direction/lounge.md §5 „Large Title“, §7 Anfragen/Kundenakte; MASTER
// Q-B9/Q-B10/Q-C1; Team P0-5b). Kein Kasten, keine Linie: Pfad (13/500, gedämpft) als leichte Zeile über
// dem großen Titel (34/600, −0,022 em), darunter optional die Unterzeile. Rechts stehen leichte
// Kennzahlen (22/500 mit Haarlinien-Trennern) und die Aktionen – höchstens eine `variant="primary"`.
// Tiefe Seiten (ab vier Krumen) bekommen den runden Zurück-Knopf wie die Lounge-Kundenakte.
// Variante `gruss`: zweizeilige Begrüßung 56/300 (Zentrale, Lounge §7.1). Server-tauglich.

const MAX_KRUMEN = 3;

/**
 * @param {object} p
 * @param {import("react").ReactNode} p.titel            Seitentitel (genau eine h1, Q-B10)
 * @param {import("react").ReactNode} [p.untertitel]
 * @param {string} [p.hilfe]                              Metadaten-Beschreibung → Info-Symbol mit Tooltip (technische Texte entfallen)
 * @param {Array<{titel:string, href?:string}>} [p.krumen] Pfad inkl. aktueller Seite (letzter Eintrag)
 * @param {string} [p.ueber]                              leichte Zeile über dem Titel, wenn es keine Krumen gibt („Verkauf“)
 * @param {string|false} [p.zurueck]                      Zurück-Ziel; Standard: ab vier Krumen der vorletzte Eintrag
 * @param {Array<{wert:import("react").ReactNode, text:string, testid?:string}>} [p.kennzahlen]  höchstens drei leichte Zahlen rechts
 * @param {import("react").ReactNode} [p.titelZusatz]     neben dem Titel (Status-Pille, Stufe)
 * @param {import("react").ReactNode} [p.unternav]        Zeile unter dem Kopf (Unternav, Segment, Suche)
 * @param {import("react").ReactNode} [p.aktionen]        rechts; Reihenfolge: Ansicht, Nebenaktionen, zuletzt die Primäraktion
 * @param {"gross"|"gruss"} [p.variante]
 */
export default function Seitenkopf({ titel, untertitel, hilfe, krumen = [], ueber, zurueck, kennzahlen = [], titelZusatz, unternav, aktionen, aktion, children, variante = "gross", className, testid = "seitenkopf" }) {
  const rechts = aktionen || aktion || children;
  const tipp = hilfetext(hilfe);
  const pfad = krumen.slice(0, -1).slice(-MAX_KRUMEN);
  const aktuell = krumen.length ? krumen[krumen.length - 1] : null;
  const zurueckZiel = zurueck === false ? null : zurueck || (krumen.length >= 4 ? krumen[krumen.length - 2] : null);
  const zurueckHref = typeof zurueckZiel === "string" ? zurueckZiel : zurueckZiel?.href;
  const zurueckName = typeof zurueckZiel === "string" ? SEITE.zurueck : SEITE.zurueckZu(zurueckZiel?.titel || "");
  const gruss = variante === "gruss";
  const zahlen = kennzahlen.filter(Boolean).slice(0, 3);
  const titelText = typeof titel === "string" ? titel : undefined;

  return (
    <header className={cx("mb-6 min-w-0 pt-1 md:mb-7", className)} data-testid={testid} data-variante={variante}>
      <div className="grid min-w-0 grid-cols-1 gap-x-10 gap-y-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          {(pfad.length > 0 || ueber || zurueckHref) && (
            <div className="mb-1.5 flex min-w-0 items-center gap-3">
              {zurueckHref && <RundKnopf icon="ChevronLeft" href={zurueckHref} label={zurueckName} groesse="s" testid="seitenkopf-zurueck" />}
              {pfad.length > 0 ? (
                <nav aria-label={SEITE.brotkrumen} className="min-w-0 text-[13px] leading-[18px] font-medium text-bo-text-soft">
                  <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    {pfad.map((k, i) => (
                      <Fragment key={`${k.titel}-${i}`}>
                        {i > 0 && (
                          <li aria-hidden="true" className="text-bo-text-faint">
                            <Icon name="ChevronRight" className="size-3.5" />
                          </li>
                        )}
                        <li className="min-w-0 truncate">
                          {k.href ? (
                            <Link href={k.href} className="rounded-sm transition-colors duration-150 hover:text-bo-text">
                              {k.titel}
                            </Link>
                          ) : (
                            <span>{k.titel}</span>
                          )}
                        </li>
                      </Fragment>
                    ))}
                    {aktuell && (
                      <li className="sr-only" aria-current="page">
                        {aktuell.titel}
                      </li>
                    )}
                  </ol>
                </nav>
              ) : (
                ueber && <p className="min-w-0 truncate text-[13px] leading-[18px] font-medium text-bo-text-soft">{ueber}</p>
              )}
            </div>
          )}
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className={cx("min-w-0 text-bo-text", gruss ? "bo-gruss text-[38px] leading-[42px] md:text-[56px] md:leading-[60px]" : "truncate text-[28px] leading-[34px] font-semibold tracking-[-0.022em] md:text-[34px] md:leading-10")} title={!gruss ? titelText : undefined}>
              {gruss ? <Gruss titel={titel} /> : titel}
            </h1>
            {tipp && (
              <span tabIndex={0} role="note" aria-label={tipp} data-tip={tipp} className="bo-tip inline-flex size-7 shrink-0 cursor-help items-center justify-center rounded-full text-bo-text-faint transition-colors duration-150 hover:bg-bo-fill-2 hover:text-bo-text">
                <Icon name="Info" className="size-4" />
              </span>
            )}
            {titelZusatz && <span className="flex min-w-0 items-center gap-2">{titelZusatz}</span>}
          </div>
          {untertitel && <p className="mt-1.5 max-w-[70ch] text-[15px] leading-[22px] text-bo-text-soft">{untertitel}</p>}
        </div>
        {(zahlen.length > 0 || rechts) && (
          <div className="flex min-w-0 flex-wrap items-end gap-x-8 gap-y-4 lg:justify-end">
            {zahlen.length > 0 && (
              <dl className="flex min-w-0 flex-wrap items-end gap-y-3 pb-0.5" aria-label={SEITE.kennzahlen}>
                {zahlen.map((z, i) => (
                  <div key={`${z.text}-${i}`} className={cx("flex min-w-0 flex-col-reverse", i > 0 && "ml-6 border-l-[length:var(--bo-hair)] border-bo-line-strong pl-6")} data-testid={z.testid}>
                    <dt className="text-[13px] leading-[18px] text-bo-text-soft">{z.text}</dt>
                    <dd className="text-[22px] leading-7 font-medium tracking-[-0.02em] tabular-nums text-bo-text">{z.wert}</dd>
                  </div>
                ))}
              </dl>
            )}
            {rechts && <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">{rechts}</div>}
          </div>
        )}
      </div>
      {unternav && <div className="mt-6 flex min-w-0 flex-wrap items-center justify-between gap-3">{unternav}</div>}
    </header>
  );
}

/** „Guten Morgen, Lena“ → zweizeilig, Name in 400 (Lounge §5: 56/60 · 300, Name 400). */
function Gruss({ titel }) {
  if (typeof titel !== "string" || !titel.includes(", ")) return titel;
  const i = titel.indexOf(", ");
  return (
    <>
      <span className="block">{titel.slice(0, i + 1)}</span>
      <span className="block font-normal text-bo-text">{titel.slice(i + 2)}</span>
    </>
  );
}
