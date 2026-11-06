"use client";
// Servicefälle als Tabelle in einer Kachel (lounge.md „Tabelle in Kachel“, 10-konzept-service §2.2):
// Zeilen 72, Bild, Status-Pille, Gewährleistung (Punkt + Text), nächster Schritt mit Fälligkeit, Avatar.
// Auswahl + Massenaktionen als schwebende Material-Kapsel; unter 768 px Karten.
import Link from "next/link";
import { useMemo, useState } from "react";
import Knopf from "../Knopf";
import Avatar from "../Avatar";
import { Icon } from "../icons";
import { FallStatus, Bild, Gewaehrleistung, Schritt, Signal } from "./Teile";
import { useAktion } from "./useAktion";
import { eingangAction, fallFelderAction, fallFelderZurueckAction, schliessenAction } from "@/lib/backoffice/service/actions";
import { T } from "@/lib/backoffice/service/texte";
import { useToast } from "../Toast";
import "../DataTable/datatable.css";
import "./service.css";

/**
 * @param {{zeilen:object[], gesamt:number, von:number, bis:number, weiter?:string, zurueck?:string, ich:string, darfSchreiben:boolean}} p
 */
export default function FaelleTabelle({ zeilen, gesamt, von, bis, weiter, zurueck, ich, darfSchreiben }) {
  const [auswahl, setAuswahl] = useState(() => new Set());
  const { ausfuehren, laeuft } = useAktion();
  const { zeige } = useToast();
  const gewaehlt = useMemo(() => zeilen.filter((z) => auswahl.has(z.name)), [zeilen, auswahl]);
  const alle = zeilen.length > 0 && auswahl.size === zeilen.length;
  const umschalten = (name) => setAuswahl((a) => {
    const n = new Set(a);
    if (n.has(name)) n.delete(name);
    else n.add(name);
    return n;
  });
  const namen = gewaehlt.map((z) => z.name);
  const mitEmail = gewaehlt.filter((z) => z.email && z.status === "Gemeldet").length;
  const schliessbar = gewaehlt.filter((z) => z.status === "Erledigt").length;

  const zuweisen = () =>
    ausfuehren(fallFelderAction, { names: namen, werte: { verantwortlich: ich } }, {
      onOk: (r) => {
        setAuswahl(new Set());
        zeige(`${namen.length} Fälle dir zugewiesen`, { art: "ok", aktion: { titel: "Rückgängig", onClick: () => ausfuehren(fallFelderZurueckAction, { alt: r.alt }, { ok: "Zuweisung zurückgenommen" }) } });
      },
    });
  const prioritaet = () =>
    ausfuehren(fallFelderAction, { names: namen, werte: { prioritaet: "Hoch" } }, {
      onOk: (r) => {
        setAuswahl(new Set());
        zeige(`Priorität hoch für ${namen.length} Fälle`, { art: "ok", aktion: { titel: "Rückgängig", onClick: () => ausfuehren(fallFelderZurueckAction, { alt: r.alt }, { ok: "Priorität zurückgesetzt" }) } });
      },
    });
  const eingang = () => ausfuehren(eingangAction, { names: gewaehlt.filter((z) => z.email && z.status === "Gemeldet").map((z) => z.name) }, { ok: (r) => `${r.ergebnisse.filter((e) => e.ok).length} Eingangsbestätigungen werden gesendet`, onOk: () => setAuswahl(new Set()) });
  const schliessen = () => ausfuehren(schliessenAction, { names: gewaehlt.filter((z) => z.status === "Erledigt").map((z) => z.name) }, { ok: (r) => `${r.ergebnisse.filter((e) => e.ok).length} Fälle werden geschlossen`, onOk: () => setAuswahl(new Set()) });

  return (
    <div className="bo-dt" data-testid="faelle-tabelle">
      <div className="hidden overflow-x-auto md:block">
        <table className="bo-dt__tabelle">
          <thead>
            <tr>
              {darfSchreiben && (
                <th className="w-10">
                  <input type="checkbox" aria-label="Alle auswählen" checked={alle} onChange={() => setAuswahl(alle ? new Set() : new Set(zeilen.map((z) => z.name)))} />
                </th>
              )}
              <th>{T.faelle.spalten.fall}</th>
              <th>{T.faelle.spalten.status}</th>
              <th className="hidden xl:table-cell">{T.faelle.spalten.gewaehrleistung}</th>
              <th>{T.faelle.spalten.schritt}</th>
              <th className="hidden lg:table-cell">{T.faelle.spalten.verantwortlich}</th>
              <th className="hidden xl:table-cell">{T.faelle.spalten.gemeldet}</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z) => (
              <tr key={z.name} data-gewaehlt={auswahl.has(z.name) ? "true" : undefined}>
                {darfSchreiben && (
                  <td>
                    <input type="checkbox" aria-label={`${z.name} auswählen`} checked={auswahl.has(z.name)} onChange={() => umschalten(z.name)} />
                  </td>
                )}
                <td className="bo-dt__kopfzelle max-w-[340px]">
                  <span className="bo-dt-objekt">
                    <Bild src={z.bild} />
                    <span className="min-w-0">
                      <Link href={`/service/faelle/${encodeURIComponent(z.name)}`} className="bo-dt-objekt__link">
                        <span className="bo-dt-objekt__titel line-clamp-2">{z.titel}</span>
                      </Link>
                      <span className="bo-dt-objekt__unter">{z.unter}</span>
                    </span>
                  </span>
                </td>
                <td className="whitespace-nowrap">
                  <FallStatus fall={{ status: z.status, kulanz_freigabe_status: z.kulanz }} />
                  {z.prioritaet === "Dringend" && (
                    <span className="mt-1 flex items-center gap-1 text-[12px] font-medium text-bo-eiche-text">
                      <Icon name="ArrowUp" className="size-3" />
                      Dringend
                    </span>
                  )}
                </td>
                <td className="hidden xl:table-cell">{z.signal ? <Signal signal={z.signal} /> : <Gewaehrleistung g={z.gwl} />}</td>
                <td className="min-w-[180px] max-w-[260px]">
                  <Schritt titel={z.knopf.art === "keiner" ? "–" : z.knopf.titel} faellig={z.knopf.faellig} ton={z.ton} />
                </td>
                <td className="hidden lg:table-cell">
                  {z.verantwortlich ? (
                    <span className="flex items-center gap-2 whitespace-nowrap text-[14px]">
                      <Avatar name={z.verantwortlichName} groesse={28} />
                      <span className="hidden 2xl:inline">{z.verantwortlichName}</span>
                    </span>
                  ) : (
                    <span className="text-[13px] text-bo-text-faint">Niemand</span>
                  )}
                </td>
                <td className="hidden whitespace-nowrap text-[14px] text-bo-text-soft xl:table-cell" title={z.gemeldetAm}>
                  {z.gemeldet}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="bo-dt-karten" data-testid="karten-liste">
        {zeilen.map((z) => (
          <li key={z.name} className="bo-dt-karte">
            <Bild src={z.bild} />
            <span className="min-w-0 flex-1">
              <Link href={`/service/faelle/${encodeURIComponent(z.name)}`} className="bo-dt-objekt__link">
                <span className="bo-dt-objekt__titel line-clamp-2">{z.titel}</span>
              </Link>
              <span className="bo-dt-objekt__unter">{z.name}</span>
              <span className="mt-2 flex flex-wrap items-center gap-2">
                <FallStatus fall={{ status: z.status, kulanz_freigabe_status: z.kulanz }} groesse="sm" />
              </span>
              <span className="mt-2 block">
                <Schritt titel={z.knopf.titel} faellig={z.knopf.faellig} ton={z.ton} />
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className="bo-dt__fuss">
        <span data-testid="tabelle-gesamt">{T.faelle.anzahl(von, bis, gesamt)}</span>
        <span className="flex gap-2">
          {zurueck && (
            <Knopf size="s" variant="ghost" href={zurueck} icon="ChevronLeft">
              {T.faelle.zurueck}
            </Knopf>
          )}
          {weiter && (
            <Knopf size="s" variant="secondary" href={weiter} iconRechts="ChevronRight">
              {T.faelle.weiter}
            </Knopf>
          )}
        </span>
      </div>
      {gewaehlt.length > 0 && (
        <div className="bo-dt-massen" role="toolbar" aria-label="Massenaktionen" data-testid="massenaktionen">
          <span className="text-[14px] font-medium">{T.faelle.massen.auswahl(gewaehlt.length)}</span>
          <Knopf size="s" variant="secondary" onClick={zuweisen} disabled={laeuft}>
            {T.faelle.massen.zuweisen}
          </Knopf>
          <Knopf size="s" variant="secondary" onClick={prioritaet} disabled={laeuft}>
            {T.faelle.massen.prioritaet}
          </Knopf>
          <Knopf size="s" variant="secondary" onClick={eingang} disabled={laeuft || !mitEmail} grund={!mitEmail ? "Keine gemeldeten Fälle mit E-Mail" : undefined}>
            {T.faelle.massen.eingang} {mitEmail ? `(${mitEmail})` : ""}
          </Knopf>
          <Knopf size="s" variant="secondary" onClick={schliessen} disabled={laeuft || !schliessbar}>
            {T.faelle.massen.schliessen} {schliessbar ? `(${schliessbar})` : ""}
          </Knopf>
          <Knopf size="s" variant="ghost" icon="X" label={T.faelle.massen.aufheben} onClick={() => setAuswahl(new Set())} />
        </div>
      )}
    </div>
  );
}
