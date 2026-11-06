// Kleine Bausteine des Bereichs Projekte (Server- und Client-tauglich, ohne Zustand): Projektbild, Phasenpunkte,
// Fortschritt, Projekt-Tabelle in Kachel (Lounge §6 „Tabelle in Kachel“, Zentrale „Laufende Projekte“),
// Empfehlungs-Liste. Gestaltung in projekte.css (Präfix bo-prj-).

import Link from "next/link";
import Kachel from "../Kachel";
import StatusBadge, { Pille } from "../StatusBadge";
import { AvatarReihe } from "../Avatar";
import { Icon } from "../icons";
import { PfeilKnopf } from "../Knopf";
import cx from "../cx";
import { statusBadge } from "@/lib/backoffice/projekte/status";
import { phasenFortschritt, phasenPunkte, terminText } from "@/lib/backoffice/projekte/anzeige";
import { TEXTE, statusText } from "@/lib/backoffice/projekte/texte";
import "./projekte.css";

const enc = encodeURIComponent;
const ART_ICON = { Kueche: "Store", Bad: "Sparkles", Wohnung: "House", Haus: "House", Hotel: "Building2", Objekt: "Building2", Yacht: "Star", Outdoor: "Sun", Sonstiges: "Layers" };

export function ProjektBild({ src, alt = "", art, klein = false, className }) {
  if (!src) {
    return (
      <span className={cx("bo-prj-bild", klein && "bo-prj-bild--s", className)} data-leer="" aria-hidden="true">
        <Icon name={ART_ICON[art] || "FolderKanban"} className="size-5" />
      </span>
    );
  }
  return (
    <span className={cx("bo-prj-bild", klein && "bo-prj-bild--s", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Raum-/Projektbild aus dem Bautagebuch */}
      <img src={src} alt={alt} decoding="async" />
    </span>
  );
}

/** Foto/Vorschau ohne next/image (Größe und Herkunft kommen vom Server bzw. aus der Ablage). */
export function Foto({ src, alt = "", className }) {
  // eslint-disable-next-line @next/next/no-img-element -- Bilder aus Bautagebuch/Ablage, Größe vom Server
  return <img src={src} alt={alt} className={className} decoding="async" />;
}

export function PhasenPunkte({ status, className }) {
  return (
    <span className={cx("bo-prj-punkte", className)} title={`Phase ${statusText("PH Projekt", status)}`} aria-hidden="true">
      {phasenPunkte(status).map((p, i) => (
        <span key={i} data-z={p.z} />
      ))}
    </span>
  );
}

export function Fortschritt({ prozent, label }) {
  const p = Math.max(0, Math.min(100, Math.round(Number(prozent) || 0)));
  return (
    <span className="bo-prj-fort" role="img" aria-label={label || `${p} %`}>
      <span style={{ width: `${p}%` }} />
    </span>
  );
}

export function ProjektStatus({ doctype = "PH Projekt", wert, groesse = "sm" }) {
  const b = statusBadge(doctype, wert);
  return <StatusBadge wert={b.wert} ton={b.ton} text={b.text} storniert={b.storniert} groesse={groesse} />;
}

/**
 * Projekte als Tabelle in einer Kachel (Desktop) bzw. Karten (Telefon).
 * @param {{zeilen:object[], heute:string, titel?:string, unter?:string, werkzeuge?:any, alleHref?:string, mitEmpfohlen?:boolean, leer?:any, testid?:string}} p
 */
export function ProjektTabelle({ zeilen = [], heute, titel, unter, werkzeuge, alleHref, mitEmpfohlen = false, leer, testid = "projekt-tabelle", className }) {
  const S = TEXTE.liste.spalten;
  return (
    <Kachel titel={titel} unter={unter} werkzeuge={werkzeuge} href={alleHref} oeffnenLabel={TEXTE.uebersicht.alleProjekte} className={className} testid={testid}>
      {!zeilen.length ? (
        leer
      ) : (
        <>
          <div className="bo-prj-tab-huelle -mx-3 overflow-x-auto">
            <table className="bo-prj-tab">
              <thead>
                <tr>
                  <th scope="col">{S.projekt}</th>
                  <th scope="col">{S.phase}</th>
                  <th scope="col" className="max-xl:hidden">
                    {S.team}
                  </th>
                  <th scope="col">{mitEmpfohlen ? S.empfohlen : S.termin}</th>
                  {mitEmpfohlen && <th scope="col" className="max-lg:hidden">{S.termin}</th>}
                </tr>
              </thead>
              <tbody>
                {zeilen.map((z) => (
                  <tr key={z.name} data-testid="projekt-zeile">
                    <td>
                      <div className="flex min-w-0 items-center gap-3">
                        <ProjektBild src={z.bild} art={z.projektart} />
                        <div className="min-w-0">
                          <Link href={`/projekte/${enc(z.name)}`} className="bo-prj-zeilenlink bo-prj-titel block truncate focus-visible:outline-none">
                            {z.titel}
                          </Link>
                          <p className="bo-prj-unter truncate">
                            {[z.kunde_name, z.objekt_ort].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
                      <ProjektStatus wert={z.status} />
                    </td>
                    <td className="max-xl:hidden">{z.team?.length ? <AvatarReihe personen={z.team} max={3} groesse={28} /> : null}</td>
                    <td>
                      {mitEmpfohlen ? (
                        <div className="min-w-0">
                          <p className="truncate text-[15px] leading-5">{z.empfohlen?.titel || TEXTE.mappe.keinEmpfohlen}</p>
                          <Fortschritt prozent={phasenFortschritt(z.status)} label={`Fortschritt ${phasenFortschritt(z.status)} %`} />
                        </div>
                      ) : (
                        <TerminZelle termin={z.termin} heute={heute} />
                      )}
                    </td>
                    {mitEmpfohlen && (
                      <td className="max-lg:hidden whitespace-nowrap">
                        <TerminZelle termin={z.termin} heute={heute} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="bo-prj-karten" data-testid="karten-liste">
            {zeilen.map((z) => (
              <li key={z.name} className="bo-prj-karte">
                <ProjektBild src={z.bild} art={z.projektart} klein />
                <div className="min-w-0 flex-1">
                  <Link href={`/projekte/${enc(z.name)}`} className="bo-prj-titel block truncate after:absolute after:inset-0 after:rounded-[20px] focus-visible:outline-none">
                    {z.titel}
                  </Link>
                  <p className="bo-prj-unter truncate">{[z.kunde_name, z.termin ? terminText(z.termin.start, heute) : ""].filter(Boolean).join(" · ")}</p>
                </div>
                <ProjektStatus wert={z.status} groesse="xs" />
              </li>
            ))}
          </ul>
        </>
      )}
    </Kachel>
  );
}

function TerminZelle({ termin, heute }) {
  if (!termin) return <span className="text-[13px] text-bo-text-soft">{TEXTE.mappe.keinTermin}</span>;
  return (
    <span className="block min-w-0">
      <span className="block truncate text-[15px] leading-5 tabular-nums">{terminText(termin.start, heute)}</span>
      <span className="bo-prj-unter block truncate">{termin.titel}</span>
    </span>
  );
}

/** Empfehlungen als Liste (Karte „Empfohlen“). Knöpfe kommen von der Seite (Client-Insel). */
export function EmpfehlungListe({ liste = [], aktion }) {
  return (
    <ul className="bo-prj-empfehlungen" data-testid="empfehlungen">
      {liste.map((e) => (
        <li key={e.id} className="bo-prj-empfehlung" data-hinweis={e.aktion ? undefined : ""}>
          <span className="bo-prj-empfehlung__ico" aria-hidden="true">
            <Icon name={e.aktion ? "ArrowUpRight" : "Info"} className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="bo-prj-titel text-[15px] leading-5">{e.titel}</p>
            <p className="bo-prj-unter">
              {TEXTE.mappe.empfohlenWeil}: {e.weil}
            </p>
          </div>
          {e.aktion?.art === "link" ? <PfeilKnopf href={e.aktion.href} label={e.titel} groesse="s" /> : aktion ? aktion(e) : null}
        </li>
      ))}
    </ul>
  );
}

/** Kleine Material-Pille für Projektart, Lieferstatus, „Kunde sieht“. */
export function Art({ wert }) {
  return <Pille material="travertin" punkt={false} groesse="sm">{statusText("PH Projekt", wert)}</Pille>;
}
