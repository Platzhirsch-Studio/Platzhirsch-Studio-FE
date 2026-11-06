"use client";
// Tab „Vorteile“ der Karten-Akte (Konzept §3.5.3): Kacheln je Vorteil (Icon je Art, Limit als Text, 4-px-Balken,
// Kundentext 2 Zeilen, „Einlösen“). Nicht verfügbar → Grund als Text statt Knopf. Vorteile höherer Stufen
// darunter als Liste mit Schloss. Nach dem Einlösen: Fokus auf die Kachel-Überschrift + Live-Region.

import { useRef, useState } from "react";
import Knopf from "../Knopf";
import { Icon } from "../icons";
import Leer from "../Leer";
import { VorteilIcon } from "./VorteilIcon";
import { EinloesePopover } from "./Einloesen";
import { limitText, verbleibend, wiederAb } from "@/lib/backoffice/kundenkarte/regeln";
import { T } from "@/lib/backoffice/kundenkarte/texte";

function grundNichtVerfuegbar(v, status, jahr) {
  if (!v.aktiv && v.aktiv !== undefined) return T.vorteile.vorteilInaktiv;
  if (status === "Gesperrt") return T.vorteile.gesperrt;
  if (status !== "Aktiv") return T.vorteile.nichtAktiv;
  if (v.verbleibend === 0) return wiederAb(jahr);
  return "";
}

function Kachel({ v, karte, kunde, status, darf, jahr, onLive }) {
  const [stand, setStand] = useState(v);
  const [frisch, setFrisch] = useState(false);
  const titel = useRef(null);
  const knopf = useRef(null);
  const limit = Number(stand.einloesbar_pro_jahr) || 0;
  const anteil = limit > 0 ? Math.min(1, (Number(stand.genutzt_im_jahr) || 0) / limit) : 0;
  const grund = stand.verfuegbar ? "" : grundNichtVerfuegbar(stand, status, jahr);
  const moebel = (stand.art === "Lieferung" || stand.art === "Montage") && status === "Aktiv";
  return (
    <li className="bo-kk-vorteil" data-frisch={frisch ? "" : undefined} data-aus={stand.verfuegbar ? undefined : ""} data-testid={`kk-vorteil-${stand.vorteil}`}>
      <div className="bo-kk-vorteil__kopf">
        <span className="bo-kk-vorteil__icon">
          <VorteilIcon art={stand.art} className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 ref={titel} tabIndex={-1} className="bo-kk-vorteil__titel">
            {stand.titel}
          </h3>
          <p className="bo-kk-vorteil__limit" data-testid="kk-limit">
            {limitText(limit, stand.genutzt_im_jahr)}
          </p>
        </div>
      </div>
      {limit > 0 && (
        <div className="bo-kk-vorteil__balken" aria-hidden="true">
          <span style={{ width: `${anteil * 100}%` }} />
        </div>
      )}
      {stand.beschreibung && <p className="bo-kk-vorteil__text">{stand.beschreibung}</p>}
      {moebel && <p className="bo-kk-satz">{T.vorteile.moebel}</p>}
      <div className="bo-kk-vorteil__fuss">
        {stand.verfuegbar && darf ? (
          <EinloesePopover
            karte={karte}
            kunde={kunde}
            vorteil={stand}
            knopfRef={knopf}
            onEingeloest={() => {
              const genutzt = (Number(stand.genutzt_im_jahr) || 0) + 1;
              const rest = verbleibend(limit, genutzt);
              setStand((s) => ({ ...s, genutzt_im_jahr: genutzt, verbleibend: rest, verfuegbar: rest === null || rest > 0 }));
              setFrisch(true);
              requestAnimationFrame(() => requestAnimationFrame(() => setFrisch(false)));
              titel.current?.focus();
              onLive(T.vorteile.live(stand.titel, limit > 0 ? `${rest} von ${limit} verbleibend${rest === 0 ? `, ${wiederAb(jahr)}` : ""}.` : ""));
            }}
            onZurueck={() => {
              setStand(v);
              onLive(`${v.titel}: Einlösung zurückgenommen.`);
              requestAnimationFrame(() => knopf.current?.focus());
            }}
          />
        ) : (
          <span className="bo-kk-vorteil__grund">{grund}</span>
        )}
      </div>
    </li>
  );
}

export default function VorteileTab({ karte, kunde, status, vorteile = [], hoehere = [], darf = false, leitung = false, jahr }) {
  const [live, setLive] = useState("");
  if (!vorteile.length) {
    return <Leer art="leer" groesse="karte" titel={T.vorteile.leer} text="" icon="Sparkles" aktion={leitung ? <Knopf href="/kundenkarte/stufen">{T.vorteile.stufenplan}</Knopf> : null} />;
  }
  return (
    <div data-testid="kk-vorteile">
      <p className="bo-kk-sr" role="status" aria-live="polite">
        {live}
      </p>
      <ul className="bo-kk-vorteile">
        {vorteile.map((v) => (
          <Kachel key={v.vorteil} v={v} karte={karte} kunde={kunde} status={status} darf={darf} jahr={jahr} onLive={setLive} />
        ))}
      </ul>
      {hoehere.map((h) => (
        <div key={h.stufe} className="mt-7">
          <h3 className="mb-2 text-[13px] font-medium text-bo-text-soft">{T.vorteile.hoehere(h.stufe)}</h3>
          <ul className="bo-kk-gesperrt-liste">
            {h.vorteile.map((v) => (
              <li key={v.titel}>
                <Icon name="Lock" className="size-3.5" />
                <VorteilIcon art={v.art} className="size-4" />
                {v.titel}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
