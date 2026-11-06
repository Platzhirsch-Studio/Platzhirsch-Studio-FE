"use client";
// Side-Peek der Kartenliste (Konzept §3.4): Kopf + Vorteil-Kacheln (kompakt) + letzte 5 Verlaufseinträge.
// Lädt über kartePeekAction; Fehler: „Karte nicht geladen.“ + Erneut + Vollansicht.

import { useEffect, useState } from "react";
import Knopf from "../Knopf";
import StatusBadge from "../StatusBadge";
import { Icon } from "../icons";
import StufenKennzeichen from "./StufenKennzeichen";
import { VorteilIcon } from "./VorteilIcon";
import { kartePeekAction } from "@/lib/backoffice/kundenkarte/actions";
import { KARTE_STATUS, statusLabel, statusTon } from "@/lib/backoffice/kundenkarte/labels";
import { limitText } from "@/lib/backoffice/kundenkarte/regeln";
import { verlaufZeile } from "@/lib/backoffice/kundenkarte/verlauf";
import { datum, datumZeit } from "@/lib/backoffice/format";
import { T } from "@/lib/backoffice/kundenkarte/texte";

export default function KartenPeek({ karte }) {
  const [d, setD] = useState(null);
  const [lauf, setLauf] = useState(0);
  useEffect(() => {
    let aktiv = true;
    kartePeekAction({ karte }).then((r) => aktiv && setD(r));
    return () => {
      aktiv = false;
    };
  }, [karte, lauf]);

  if (!d) {
    return (
      <div aria-busy="true" className="flex flex-col gap-3">
        <span className="bo-skeleton block h-14 w-full rounded-2xl" />
        {[0, 1, 2].map((i) => (
          <span key={i} className="bo-skeleton block h-[88px] w-full rounded-2xl" />
        ))}
      </div>
    );
  }
  if (!d.ok) {
    return (
      <div className="flex flex-col items-start gap-3 py-6">
        <p className="text-[15px] font-semibold">{T.karten.peekFehler}</p>
        <div className="flex gap-2">
          <Knopf
            size="s"
            icon="RefreshCw"
            onClick={() => {
              setD(null);
              setLauf((x) => x + 1);
            }}
          >
            Erneut
          </Knopf>
          <Knopf size="s" variant="ghost" href={`/kundenkarte/karten/${karte}`}>
            {T.karten.vollansicht}
          </Knopf>
        </div>
      </div>
    );
  }
  const k = d.karte;
  return (
    <div className="flex flex-col gap-5" data-testid="kk-peek">
      <div className="flex flex-wrap items-center gap-2">
        <StufenKennzeichen stufe={k.stufe} farbe={k.farbe} />
        {k.stufe_seit && <span className="text-[13px] text-bo-text-soft">{T.akte.seit(datum(k.stufe_seit))}</span>}
        {k.status !== "Aktiv" && <StatusBadge wert={k.status} text={statusLabel(KARTE_STATUS, k.status)} ton={statusTon(KARTE_STATUS, k.status)} groesse="xs" />}
      </div>
      <ul className="flex flex-col gap-2">
        {d.vorteile.map((v) => (
          <li key={v.vorteil} className="flex items-center gap-3 rounded-2xl bg-bo-surface-2 px-3 py-3">
            <span className="bo-kk-vorteil__icon size-9" aria-hidden="true">
              <VorteilIcon art={v.art} className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold">{v.titel}</span>
              <span className="block text-[12px] text-bo-text-soft">{limitText(v.einloesbar_pro_jahr, v.genutzt_im_jahr)}</span>
            </span>
            {!v.verfuegbar && <span className="text-[12px] text-bo-text-faint">nicht verfügbar</span>}
          </li>
        ))}
      </ul>
      <div>
        <h3 className="mb-2 text-[13px] font-medium text-bo-text-soft">{T.akte.tabs.verlauf}</h3>
        <ul className="bo-kk-zeilen">
          {d.verlauf.map((e) => {
            const z = verlaufZeile(e);
            return (
              <li key={e.id} className="bo-kk-zeile">
                <span className="bo-kk-zeile__icon" aria-hidden="true">
                  <Icon name={z.icon} className="size-4" />
                </span>
                <span className="bo-kk-zeile__text">
                  <span className="bo-kk-zeile__titel block">{z.titel}</span>
                  {z.unter && <span className="bo-kk-zeile__unter block">{z.unter}</span>}
                </span>
                <span className="bo-kk-zeile__zeit">{datumZeit(e.zeit)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
