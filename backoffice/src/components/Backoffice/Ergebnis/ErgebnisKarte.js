import Link from "next/link";
import cx from "../cx";
import Knopf from "../Knopf";
import { Icon } from "../icons";
import { Haken } from "../motion";
import { cent } from "@/lib/backoffice/format";
import { TEXTE } from "@/lib/backoffice/akte/texte";
import { ergebnisKnoepfe } from "@/lib/backoffice/akte/ergebnis";
import "../Akte/akte.css";

// ErgebnisKarte (G-16, Team P0-5a, MASTER C-08): der eine Erfolgsmoment nach einem abgeschlossenen
// Vorgang (Q-H5) – Häkchen zeichnet sich (Lounge §8: nach 220 ms, Feder; reduziert sofort), Hauptzeile
// (Nummer bzw. Rückgeld/Betrag zuerst), Links auf alle erzeugten Dokumente, „Weiter mit …“ als nächste
// Primäraktion, höchstens 3 Knöpfe. Nutzer: Kassa (gebuchter Bon), Faktura (Rechnung gestellt),
// Kundenkarte (Karte ausgestellt), Logistik (Paket abgeschlossen).
// Server- und Client-tauglich; `onClick` nur aus Client-Komponenten übergeben.

/**
 * @param {object} p
 * @param {import("react").ReactNode} p.titel          Hauptzeile in Vergangenheit + Objekt („Rechnung RE-2026-0114 gestellt“)
 * @param {import("react").ReactNode} [p.unter]        ein Satz darunter (Kunde, Zahlart)
 * @param {{titel:string, cent?:number, text?:string}} [p.zahl]  große Zahl zuerst (Rückgeld, Betrag)
 * @param {Array<{titel:string, info?:string, href?:string, icon?:string}>} [p.dokumente]
 * @param {{titel:string, href?:string, onClick?:Function, kuerzel?:string}} [p.weiter]  nächste Primäraktion
 * @param {Array<{titel:string, href?:string, onClick?:Function, icon?:string}>} [p.aktionen]  Nebenaktionen
 * @param {boolean} [p.kompakt]     kleinere Zahl/Häkchen (Kassa-Spalte, Sheet)
 * @param {boolean} [p.ohneKachel]  in Dialog/Sheet ohne eigene Kachel
 * @param {boolean} [p.primaer]     „Weiter“ in Tinte (Standard ja – die eine Hauptaktion des Bildschirms)
 */
export default function ErgebnisKarte({ titel, unter, zahl, dokumente = [], weiter, aktionen = [], kompakt = false, ohneKachel = false, primaer = true, className, testid = "ergebnis-karte" }) {
  const knoepfe = ergebnisKnoepfe({ weiter, aktionen });
  const zahlText = zahl ? (Number.isFinite(zahl.cent) ? cent(zahl.cent) : zahl.text) : null;
  return (
    <section
      className={cx(!ohneKachel && "bo-kachel", "bo-ergebnis", className)}
      data-kompakt={kompakt ? "" : undefined}
      role="status"
      aria-live="polite"
      data-testid={testid}
    >
      <div className="bo-ergebnis__kopf">
        <span className="bo-ergebnis__haken">
          <Haken groesse={kompakt ? 24 : 30} strich={2.25} titel={TEXTE.ergebnis.erledigt} />
        </span>
        <div className="min-w-0">
          <h2 className="bo-ergebnis__titel">{titel}</h2>
          {unter && <p className="bo-ergebnis__unter">{unter}</p>}
        </div>
      </div>

      {zahlText && (
        <div className="bo-ergebnis__zahl">
          <span className="bo-ergebnis__zahl-cap">{zahl.titel}</span>
          <span className="bo-ergebnis__zahl-wert">{zahlText}</span>
        </div>
      )}

      {dokumente.length > 0 && (
        <div>
          <h3 className="bo-ergebnis__doks-t">{TEXTE.ergebnis.dokumente}</h3>
          <ul className="bo-ergebnis__doks">
            {dokumente.map((d, i) => {
              const inhalt = (
                <>
                  <span className="bo-ergebnis__dok-ico" aria-hidden="true">
                    <Icon name={d.icon || "FileText"} className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="bo-ergebnis__dok-t">{d.titel}</span>
                    {d.info && <span className="bo-ergebnis__dok-i">{d.info}</span>}
                  </span>
                  {d.href ? <Icon name="ChevronRight" className="size-4" /> : <span />}
                </>
              );
              return (
                <li key={`${d.titel}-${i}`}>
                  {d.href ? (
                    <Link href={d.href} className="bo-ergebnis__dok">
                      {inhalt}
                    </Link>
                  ) : (
                    <div className="bo-ergebnis__dok">{inhalt}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {knoepfe.length > 0 && (
        <div className="bo-ergebnis__fuss">
          {knoepfe.map((k) => (
            <Knopf
              key={k.titel}
              variant={k.art === "weiter" && primaer ? "primary" : "secondary"}
              size={kompakt ? "m" : "l"}
              href={k.href}
              onClick={k.onClick}
              icon={k.icon}
              iconRechts={k.art === "weiter" ? "ArrowRight" : undefined}
              kuerzel={k.kuerzel}
            >
              {k.titel}
            </Knopf>
          ))}
        </div>
      )}
    </section>
  );
}
