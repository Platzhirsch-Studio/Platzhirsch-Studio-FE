"use client";
// G-21 Raster (Team P0-6): Basis für die Plantafel (Logistik: Monteure/Touren × Tage) und den Mini-Gantt
// (Projekte: Gewerke × Wochen). Zeilen links (sticky), Tage als Spalten, Balken als weiche Materialflächen;
// überlappende Balken einer Zeile liegen auf eigenen Bahnen. `role="grid"` mit Roving-Fokus:
// ←→ Tag, ↑↓ Zeile, Pos1/Ende, Enter öffnet den Balken der Zelle bzw. legt in einer leeren Zelle neu an,
// Umschalt+←/→ verschiebt den Balken der Zelle um einen Tag (Tastatur-Alternative zum Ziehen).
// Ziehen mit Maus/Stift verschiebt tageweise; Touch scrollt, Verschieben dort über Umschalt-Tasten oder
// das Kontextmenü (langes Drücken: „Einen Tag früher/später“).

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

const ohneAbo = () => () => {};
import { heuteIso, tagKurz, wochentag, WOCHENTAGE_KURZ } from "@/lib/backoffice/datum";
import { Kontextmenue, MenuePunkt } from "../Overlay/Popover";
import { Icon } from "../icons";
import cx from "../cx";
import { QUELLEN, bahnen, tageVonBis, verschiebeBalken } from "./logik";
import { TEXTE } from "./texte";
import "./kalender.css";

/**
 * @param {object} p
 * @param {string} p.von                          erster Tag (ISO)
 * @param {string} p.bis                          letzter Tag (ISO)
 * @param {Array<{id:string, titel:string, unter?:string, icon?:string, balken:Array<{id:string, titel:string, start:string, ende?:string, material?:string, quelle?:string, verschiebbar?:boolean}>}>} p.zeilen
 * @param {(balken:object, zeile:object) => void} [p.onOeffnen]
 * @param {(z:{zeile:object, tag:string}) => void} [p.onNeu]
 * @param {(balken:object, neu:{start:string, ende:string}, zeile:object) => void} [p.onVerschieben]
 * @param {string} [p.heute]
 * @param {number} [p.spalte]                     Spaltenbreite in px (Standard 64)
 * @param {string} [p.label]
 */
export default function Raster({ von, bis, zeilen = [], onOeffnen, onNeu, onVerschieben, heute: heuteProp, spalte = 64, label = TEXTE.raster.label, className, testid = "raster" }) {
  const tage = useMemo(() => tageVonBis(von, bis), [von, bis]);
  // Heute erst im Browser (Server/Hydration: null – keine Abweichung im HTML).
  const heuteClient = useSyncExternalStore(ohneAbo, heuteIso, () => null);
  const heute = heuteProp || heuteClient;
  const [fokus, setFokus] = useState({ zeile: 0, tag: 0 });
  const [zug, setZug] = useState(null);
  const zellen = useRef(new Map());
  const willFokus = useRef(false);
  const klickSperre = useRef(false);
  const zugRef = useRef(null);
  useEffect(() => {
    zugRef.current = zug;
  });

  const verteilt = useMemo(() => zeilen.map((z) => ({ zeile: z, ...bahnen(z.balken || [], von, bis) })), [zeilen, von, bis]);

  useEffect(() => {
    if (!willFokus.current) return;
    willFokus.current = false;
    zellen.current.get(`${fokus.zeile}:${fokus.tag}`)?.focus();
  });

  const balkenInZelle = (zi, ti) => verteilt[zi]?.balken.filter((b) => b.lage.start <= ti && ti < b.lage.start + b.lage.laenge) || [];

  const schiebe = (b, z, tage) => {
    if (!onVerschieben || b.verschiebbar === false) return;
    onVerschieben(b, verschiebeBalken(b, tage), z);
  };

  const taste = (e) => {
    const { zeile, tag } = fokus;
    if (e.key === "Enter") {
      e.preventDefault();
      const b = balkenInZelle(zeile, tag)[0];
      if (b) onOeffnen?.(b, zeilen[zeile]);
      else onNeu?.({ zeile: zeilen[zeile], tag: tage[tag] });
      return;
    }
    if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      const b = balkenInZelle(zeile, tag)[0];
      if (b) {
        e.preventDefault();
        const d = e.key === "ArrowRight" ? 1 : -1;
        schiebe(b, zeilen[zeile], d);
        setFokus({ zeile, tag: Math.min(tage.length - 1, Math.max(0, tag + d)) });
        willFokus.current = true;
      }
      return;
    }
    const map = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
    let neu = null;
    if (map[e.key]) neu = { zeile: zeile + map[e.key][0], tag: tag + map[e.key][1] };
    else if (e.key === "Home") neu = { zeile: e.ctrlKey ? 0 : zeile, tag: 0 };
    else if (e.key === "End") neu = { zeile: e.ctrlKey ? zeilen.length - 1 : zeile, tag: tage.length - 1 };
    if (!neu) return;
    e.preventDefault();
    setFokus({ zeile: Math.min(zeilen.length - 1, Math.max(0, neu.zeile)), tag: Math.min(tage.length - 1, Math.max(0, neu.tag)) });
    willFokus.current = true;
  };

  // Ziehen (Maus/Stift): Tage = Weg / Spaltenbreite.
  const laeuft = !!zug;
  useEffect(() => {
    if (!laeuft) return;
    const bewegen = (ev) => {
      const z = zugRef.current;
      if (!z) return;
      const dx = ev.clientX - z.x;
      if (!z.aktiv && Math.abs(dx) < 6) return;
      setZug({ ...z, aktiv: true, tage: Math.round(dx / spalte) });
    };
    const los = () => {
      const z = zugRef.current;
      setZug(null);
      if (!z?.aktiv) return;
      klickSperre.current = true;
      setTimeout(() => (klickSperre.current = false), 0);
      if (z.tage) schiebe(z.balken, z.zeile, z.tage);
    };
    const abbruch = () => setZug(null);
    window.addEventListener("pointermove", bewegen);
    window.addEventListener("pointerup", los);
    window.addEventListener("pointercancel", abbruch);
    return () => {
      window.removeEventListener("pointermove", bewegen);
      window.removeEventListener("pointerup", los);
      window.removeEventListener("pointercancel", abbruch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Lauscher nur beim Start/Ende des Zugs
  }, [laeuft]);

  return (
    <div className={cx("bo-kal-raster", className)} style={{ "--bo-kal-tage": tage.length, "--bo-kal-spalte": `${spalte}px` }} data-testid={testid}>
      <div role="grid" aria-label={label} aria-rowcount={zeilen.length + 1} aria-colcount={tage.length + 1} className="bo-kal-raster__inner" onKeyDown={taste}>
        <div role="row" aria-rowindex={1} className="bo-kal-raster__row">
          <span role="columnheader" className="bo-kal-raster__kopf sr-only">
            {TEXTE.raster.zeile}
          </span>
          {tage.map((t) => (
            <span key={t} role="columnheader" aria-label={tagKurz(t)} className="bo-kal-raster__tk" data-heute={t === heute ? "true" : undefined} data-wochenende={wochentag(t) >= 5 ? "true" : undefined}>
              <span aria-hidden="true">{WOCHENTAGE_KURZ[wochentag(t)]}</span>
              <b aria-hidden="true">{Number(t.slice(8))}</b>
            </span>
          ))}
        </div>
        {verteilt.map(({ zeile: z, balken, bahnen: nBahnen }, zi) => (
          <div key={z.id} role="row" aria-rowindex={zi + 2} className="bo-kal-raster__row">
            <div role="rowheader" className="bo-kal-raster__kopf">
              {z.icon && (
                <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-bo-surface-2">
                  <Icon name={z.icon} className="size-4" />
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate">{z.titel}</span>
                {z.unter && <small className="truncate">{z.unter}</small>}
              </span>
            </div>
            {tage.map((t, ti) => {
              const istZiel = fokus.zeile === zi && fokus.tag === ti;
              const hier = balken.filter((b) => b.lage.start === ti);
              const inZelle = balken.filter((b) => b.lage.start <= ti && ti < b.lage.start + b.lage.laenge);
              return (
                <div
                  key={t}
                  ref={(el) => {
                    const k = `${zi}:${ti}`;
                    if (el) zellen.current.set(k, el);
                    else zellen.current.delete(k);
                  }}
                  role="gridcell"
                  tabIndex={istZiel ? 0 : -1}
                  aria-label={`${z.titel}, ${tagKurz(t)}${inZelle.length ? `: ${inZelle.map((b) => b.titel).join(", ")}` : ""}`}
                  className="bo-kal-raster__zelle"
                  style={{ "--bo-kal-bahnen": nBahnen }}
                  data-heute={t === heute ? "true" : undefined}
                  data-wochenende={wochentag(t) >= 5 ? "true" : undefined}
                  onFocus={() => !istZiel && setFokus({ zeile: zi, tag: ti })}
                  onClick={() => setFokus({ zeile: zi, tag: ti })}
                  onDoubleClick={() => !inZelle.length && onNeu?.({ zeile: z, tag: t })}
                >
                  {hier.map((b) => {
                    const material = b.material || QUELLEN[b.quelle]?.material || "cognac";
                    const verschiebbar = !!onVerschieben && b.verschiebbar !== false;
                    const zieht = zug?.aktiv && zug.balken.id === b.id;
                    return (
                      <Kontextmenue
                        key={b.id}
                        label={b.titel}
                        deaktiviert={!verschiebbar && !onOeffnen}
                        inhalt={
                          <>
                            {onOeffnen && (
                              <MenuePunkt icon="ArrowUpRight" onWaehlen={() => onOeffnen(b, z)}>
                                {TEXTE.oeffnen}
                              </MenuePunkt>
                            )}
                            {verschiebbar && (
                              <>
                                <MenuePunkt icon="ArrowLeft" onWaehlen={() => schiebe(b, z, -1)}>
                                  {TEXTE.raster.verschiebenFrueher}
                                </MenuePunkt>
                                <MenuePunkt icon="ArrowRight" onWaehlen={() => schiebe(b, z, 1)}>
                                  {TEXTE.raster.verschiebenSpaeter}
                                </MenuePunkt>
                              </>
                            )}
                          </>
                        }
                      >
                        <div
                          role="button"
                          tabIndex={-1}
                          aria-label={`${b.titel}${b.lage.abgeschnittenLinks ? `, ${TEXTE.raster.abgeschnittenLinks}` : ""}${b.lage.abgeschnittenRechts ? `, ${TEXTE.raster.abgeschnittenRechts}` : ""}`}
                          className="bo-kal-balken"
                          title={b.titel}
                          data-m={material}
                          data-links={b.lage.abgeschnittenLinks ? "true" : undefined}
                          data-rechts={b.lage.abgeschnittenRechts ? "true" : undefined}
                          data-verschiebbar={verschiebbar ? "true" : undefined}
                          data-zieht={zieht ? "true" : undefined}
                          style={{ "--bahn": b.bahn, "--laenge": b.lage.laenge, transform: zieht ? `translateX(${zug.tage * spalte}px)` : undefined }}
                          onPointerDown={(ev) => {
                            if (!verschiebbar || ev.pointerType === "touch" || ev.button !== 0) return;
                            setZug({ balken: b, zeile: z, x: ev.clientX, aktiv: false, tage: 0 });
                          }}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            if (klickSperre.current) return;
                            onOeffnen?.(b, z);
                          }}
                        >
                          {b.icon && <Icon name={b.icon} className="size-3.5 shrink-0" />}
                          <span>{b.titel}</span>
                        </div>
                      </Kontextmenue>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
