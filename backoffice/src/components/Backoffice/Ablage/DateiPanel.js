"use client";
// Vorschau-Panel (Lounge §6 „Vorschau-Panel“): schwebende Karte rechts, sticky, Bild mit Glas-Chips und
// Glas-Schließknopf, vier Aktionskreise (Laden · Teilen · Versionen · Mehr), Fakten 2-spaltig, Tags, Freigaben,
// Primärknopf „Öffnen“ + Pfeil. Gleitet mit Feder ein (.bo-panel); Esc schließt, Fokus zurück zur Karte.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, Globe, History, Lock, MoreHorizontal, Share2, ShieldCheck, X } from "lucide-react";
import Knopf, { PfeilKnopf } from "../Knopf";
import { Menue } from "../Overlay/Popover";
import { Pille } from "../StatusBadge";
import Avatar from "../Avatar";
import Vorschaubild from "./Vorschaubild";
import { dateiDetailAction } from "@/lib/backoffice/ablage/actions";
import { resttage, sperreArt } from "@/lib/backoffice/ablage/regeln";
import { T } from "@/lib/backoffice/ablage/texte";
import { datumKurz, datumZeit, person, titelZeit, wann } from "./zeit";

export default function DateiPanel({ datei: d, info, user, namen = {}, werkzeug, onSchliessen, pfad }) {
  const ref = useRef(null);
  const [geladen, setGeladen] = useState({ schluessel: null, daten: null });
  const schluessel = `${d.datei}:${d.version}:${d.freigabelinks_aktiv}`;
  const detail = geladen.schluessel === schluessel ? geladen.daten : null;
  const a = werkzeug.rechte(d);
  const sperre = sperreArt(d, user);

  useEffect(() => {
    let aktiv = true;
    dateiDetailAction({ datei: d.datei }).then((r) => aktiv && r.ok && setGeladen({ schluessel, daten: r.daten }));
    return () => {
      aktiv = false;
    };
  }, [d.datei, schluessel]);

  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape" && !e.defaultPrevented && !document.querySelector("dialog[open]")) onSchliessen();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onSchliessen]);

  const versionen = detail?.versionen?.length || d.version || 1;
  const links = detail ? (detail.freigabelinks || []).length : d.freigabelinks_aktiv || 0;
  const akte = `/ablage/datei/${encodeURIComponent(d.datei)}`;

  return (
    <aside ref={ref} className="bo-abl-panel bo-panel" aria-label={T.panel.label} data-testid="abl-panel" key={d.datei}>
      <div className="bo-abl-panel__hero">
        <Vorschaubild datei={d} officeVorschau={info?.office_vorschau} laden="eager" />
        <div className="bo-abl-panel__chips">
          <span className="bo-abl-glaschip bo-glas">{(d.endung || "–").toUpperCase()}</span>
          <span className="bo-abl-glaschip bo-glas tabular-nums">{d.groesse_text}</span>
        </div>
        <div className="bo-abl-panel__werkzeug">
          <button type="button" className="bo-abl-glasknopf bo-glas" aria-label={T.panel.schliessen} onClick={onSchliessen} data-testid="abl-panel-zu">
            <X className="size-[18px]" strokeWidth={1.75} />
          </button>
        </div>
      </div>
      <div className="bo-abl-panel__inhalt">
        <div className="flex flex-col gap-1">
          <h2 className="bo-abl-panel__titel">{d.dateiname}</h2>
          {pfad && <p className="bo-abl-panel__pfad">{pfad}</p>}
        </div>

        <div className="bo-abl-aktionen">
          <a className="bo-abl-akt" href={`/ablage/laden/${encodeURIComponent(d.datei)}`} data-testid="abl-panel-laden" download>
            <span className="bo-abl-akt__ico">
              <Download className="size-5" strokeWidth={1.75} />
            </span>
            {T.panel.herunterladen}
          </a>
          <button type="button" className="bo-abl-akt" onClick={() => werkzeug.h.teilen(d)} disabled={!a.teilen.an} data-testid="abl-panel-teilen">
            <span className="bo-abl-akt__ico">
              <Share2 className="size-5" strokeWidth={1.75} />
            </span>
            {T.panel.teilen}
          </button>
          <Link className="bo-abl-akt" href={`${akte}?tab=versionen`}>
            <span className="bo-abl-akt__ico">
              <History className="size-5" strokeWidth={1.75} />
            </span>
            {T.panel.versionen}
          </Link>
          <Menue
            label={T.aktionen.menue}
            platzierung="unten-ende"
            ausloeser={(p) => (
              <button type="button" className="bo-abl-akt" {...p} data-testid="abl-panel-mehr">
                <span className="bo-abl-akt__ico">
                  <MoreHorizontal className="size-5" strokeWidth={1.75} />
                </span>
                {T.panel.mehr}
              </button>
            )}
          >
            {werkzeug.menue(d, { ohne: ["herunterladen", "teilen"] })}
          </Menue>
        </div>

        {(sperre || d.aufbewahrungsklasse === "Beleg" || d.portal_freigabe || d.status === "Papierkorb") && (
          <div className="flex flex-col gap-2">
            {sperre && (
              <p className="bo-abl-hinweis" data-ton={sperre === "fremd" ? "eiche" : undefined} data-testid="abl-panel-sperre">
                <Lock className="size-4" strokeWidth={1.75} />
                {sperre === "fremd" ? T.status.gesperrtFremd(person(d.gesperrt_von, namen), datumZeit(d.gesperrt_bis)) : T.status.gesperrtEigen(datumZeit(d.gesperrt_bis))}
              </p>
            )}
            {d.aufbewahrungsklasse === "Beleg" && (
              <p className="bo-abl-hinweis">
                <ShieldCheck className="size-4" strokeWidth={1.75} />
                {T.status.beleg(datumKurz(d.aufbewahren_bis))}
              </p>
            )}
            {d.portal_freigabe ? (
              <p className="bo-abl-hinweis">
                <Globe className="size-4" strokeWidth={1.75} />
                {T.status.portal}
              </p>
            ) : null}
            {d.status === "Papierkorb" && <p className="bo-abl-hinweis" data-ton="eiche">{T.status.papierkorb(resttage(d.papierkorb_bis))}</p>}
          </div>
        )}

        <dl className="bo-abl-fakten">
          <div>
            <dt>{T.panel.fakten.version}</dt>
            <dd className="tabular-nums">{versionen}</dd>
          </div>
          <div>
            <dt>{T.panel.fakten.geaendert}</dt>
            <dd title={titelZeit(d.geaendert)} suppressHydrationWarning>
              {wann(d.geaendert)}
            </dd>
          </div>
          <div>
            <dt>{T.panel.fakten.von}</dt>
            <dd>
              <Avatar name={person(d.hochgeladen_von, namen)} groesse={22} dekorativ />
              <span className="min-w-0 truncate">{person(d.hochgeladen_von, namen)}</span>
            </dd>
          </div>
          <div>
            <dt>{T.panel.fakten.aufbewahrung}</dt>
            <dd>{d.aufbewahrungsklasse || "Allgemein"}</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-bo-text-soft">{T.panel.tags}</p>
          {d.tags?.length ? (
            <div className="bo-abl-tags">
              {d.tags.map((t) => (
                <span key={t} className="bo-abl-tag">
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-bo-text-faint">{T.panel.keineTags}</p>
          )}
          {d.beschreibung && <p className="bo-abl-eingelassen text-sm leading-5">{d.beschreibung}</p>}
        </div>

        {links > 0 && (
          <button type="button" className="bo-abl-eingelassen flex items-center gap-3 text-left text-sm" onClick={() => werkzeug.h.teilen(d)}>
            <Share2 className="size-4 text-bo-salbei-text" strokeWidth={1.75} />
            <span className="flex-1">{T.panel.freigaben(links)}</span>
            <Pille material="salbei">{T.freigaben.reiter.aktiv}</Pille>
          </button>
        )}

        <div className="flex items-center gap-2">
          <Knopf variant="primary" href={akte} className="flex-1" data-testid="abl-panel-oeffnen">
            {T.panel.oeffnen}
          </Knopf>
          <PfeilKnopf href={akte} label={`${d.dateiname} öffnen`} />
        </div>
      </div>
    </aside>
  );
}
