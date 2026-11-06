"use client";
// G-21 Kalender (Team P0-6) im Lounge-Stil: Woche · Monat · Tag, Quellen parallel (Termine, Montagen,
// Serviceeinsätze, Touren, Abwesenheiten ohne Art, Social, Events) als Material-Pillen zum Ein-/Ausblenden.
// Bedienung (MASTER G-21): `role="grid"` mit Roving-Fokus – ←→↑↓ bewegen (Woche/Tag: ↑↓ = 30 min,
// Monat: Woche), Pos1/Ende erster/letzter Tag, Bild↑/↓ erster/letzter Slot, `T` heute, `W`/`M`/`D` Ansicht,
// `Enter` öffnet den Eintrag der Zelle bzw. legt in einer leeren Zelle neu an, `Umschalt+Enter` plant um.
// Umplanen: Ziehen mit Maus/Stift (Raster 15 min, Dauer bleibt) – Alternative für Touch und Tastatur ist der
// Dialog „Umplanen …“ (Kontextmenü: Rechtsklick/langes Drücken, oder Umschalt+Enter). Kollisionen stehen
// als Symbol + Text am Eintrag („Überschneidet sich mit …“), nie nur als Farbe.
// Datenform siehe Kalender/logik.js `normalisiere` – Bereiche liefern Einträge, der Kalender rechnet nichts
// fachlich (keine Server Actions hier; onNeu/onOeffnen/onVerschieben gehören dem Bereich).

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";
import { heuteIso, minutenZuZeit, plusMinuten, tagKurz, wochentag, zeitZuMinuten, zerlegeDatumZeit, WOCHENTAGE_KURZ } from "@/lib/backoffice/datum";
import Knopf from "../Knopf";
import Segment from "../Segment";
import Datumsfeld from "../Formular/Datumsfeld";
import Dialog from "../Overlay/Dialog";
import { Kontextmenue, MenuePunkt } from "../Overlay/Popover";
import { Icon } from "../icons";
import cx from "../cx";
import { QUELLEN, QUELLEN_REIHE, bewegeFokus, blaettern, filtereQuellen, kollisionen, kollisionsText, layoutTag, minutenAusLage, normalisiere, proTag, slots as slotListe, verschiebeEintrag, zeitText, zeitraum } from "./logik";
import { TEXTE } from "./texte";
import "./kalender.css";

const SLOT_PX = 28;
const SCHRITT = 30;

/** Aktuelle Zeit „JJJJ-MM-TT HH:MM“, minütlich; Server/Hydration: null (keine Abweichung). */
function useJetzt(fest) {
  const [jetzt, setJetzt] = useState(null);
  useEffect(() => {
    if (fest) return;
    const f = () => {
      const d = new Date();
      setJetzt(`${heuteIso(d)} ${minutenZuZeit(d.getHours() * 60 + d.getMinutes())}`);
    };
    f();
    const t = setInterval(f, 30_000);
    return () => clearInterval(t);
  }, [fest]);
  return fest || jetzt;
}

/**
 * @param {object} p
 * @param {Array<object>} p.eintraege                Einträge aller Quellen (siehe logik.normalisiere)
 * @param {string[]} [p.quellen]                     angebotene Quellen (Standard: die in den Einträgen vorkommenden)
 * @param {"tag"|"woche"|"monat"} [p.ansicht]        gesteuert; sonst `startAnsicht`
 * @param {(a:string) => void} [p.onAnsicht]
 * @param {string} [p.datum]                         gesteuert (ISO-Tag); sonst `startDatum` (Standard heute)
 * @param {(iso:string) => void} [p.onDatum]
 * @param {string} [p.von]                           Tagesbeginn im Raster („07:00“)
 * @param {string} [p.bis]                           Tagesende („20:00“)
 * @param {(z:{start:string, ende:string, tag:string}) => void} [p.onNeu]
 * @param {(e:object) => void} [p.onOeffnen]
 * @param {(e:object, neu:{start:string, ende:string}) => void|Promise<unknown>} [p.onVerschieben]  ohne → kein Umplanen
 * @param {string} [p.jetzt]                         feste Zeit „JJJJ-MM-TT HH:MM“ (Vorschau/Tests)
 * @param {number} [p.hoehe]                         Höhe des Zeitrasters in px (Standard 640)
 * @param {string} [p.label]
 */
export default function Kalender({ eintraege = [], quellen, ansicht: ansichtProp, startAnsicht = "woche", onAnsicht, datum: datumProp, startDatum, onDatum, von = "07:00", bis = "20:00", onNeu, onOeffnen, onVerschieben, jetzt: jetztProp, hoehe = 640, label = TEXTE.kalender, className, testid = "kalender" }) {
  const id = useId();
  const jetzt = useJetzt(jetztProp);
  const heute = jetzt ? zerlegeDatumZeit(jetzt).datum : startDatum || datumProp || "";
  const [ansichtEigen, setAnsichtEigen] = useState(startAnsicht);
  const ansicht = ansichtProp || ansichtEigen;
  const [datumEigen, setDatumEigen] = useState(startDatum || "");
  const datum = datumProp || datumEigen || heute || heuteIso();
  const [aus, setAus] = useState(() => new Set());
  const [fokus, setFokus] = useState(null);
  const [umplanen, setUmplanen] = useState(null);
  const [umplanenWert, setUmplanenWert] = useState("");
  const [ansage, setAnsage] = useState("");
  const [zug, setZug] = useState(null); // { eintrag, tag, min, aktiv }
  const zellen = useRef(new Map());
  const willFokus = useRef(false);
  const raster = useRef(null);
  const scroll = useRef(null);
  const klickSperre = useRef(false);

  const vonMin = zeitZuMinuten(von) ?? 420;
  const bisMin = zeitZuMinuten(bis) ?? 1200;
  const alle = useMemo(() => normalisiere(eintraege), [eintraege]);
  const angeboten = useMemo(() => (quellen?.length ? quellen : QUELLEN_REIHE.filter((q) => alle.some((e) => e.quelle === q))), [quellen, alle]);
  const sichtbar = useMemo(() => filtereQuellen(alle, angeboten.filter((q) => !aus.has(q))), [alle, angeboten, aus]);
  const kollisionMap = useMemo(() => kollisionen(sichtbar), [sichtbar]);
  const zr = useMemo(() => zeitraum(ansicht, datum), [ansicht, datum]);
  const slotsListe = useMemo(() => slotListe(vonMin, bisMin, SCHRITT), [vonMin, bisMin]);
  const aktFokus = fokus && zr.tage.includes(fokus.tag) ? fokus : { tag: zr.tage.includes(datum) ? datum : zr.tage.includes(heute) ? heute : ansicht === "monat" ? zr.raster.find((r) => r.imMonat)?.iso : zr.tage[0], min: Math.max(vonMin, Math.min(bisMin - SCHRITT, 540)) };

  const setzeAnsicht = useCallback(
    (a) => {
      if (!ansichtProp) setAnsichtEigen(a);
      onAnsicht?.(a);
    },
    [ansichtProp, onAnsicht]
  );
  const setzeDatum = useCallback(
    (d) => {
      if (!datumProp) setDatumEigen(d);
      onDatum?.(d);
    },
    [datumProp, onDatum]
  );

  // Fokus nach Tastaturbewegung setzen (nicht beim ersten Rendern).
  useEffect(() => {
    if (!willFokus.current) return;
    willFokus.current = false;
    const k = ansicht === "monat" ? aktFokus.tag : `${aktFokus.tag}|${aktFokus.min}`;
    zellen.current.get(k)?.focus({ preventScroll: false });
  });

  // Zeitraster beim Öffnen auf 1 h vor jetzt bzw. 08:00 scrollen.
  const nowMin = jetzt ? zeitZuMinuten(zerlegeDatumZeit(jetzt).zeit) : null;
  useEffect(() => {
    if (ansicht === "monat" || !scroll.current) return;
    const ziel = Math.max(vonMin, Math.min(bisMin, (zr.tage.includes(heute) && nowMin !== null ? nowMin - 60 : 480)));
    scroll.current.scrollTop = ((ziel - vonMin) / SCHRITT) * SLOT_PX;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur beim Wechsel von Ansicht/Zeitraum
  }, [ansicht, zr.von]);

  const eintraegeDerZelle = (tag, min) =>
    sichtbar.filter((e) => {
      if (e.ganztag) return false;
      const s = zerlegeDatumZeit(e.start);
      const st = s.datum === tag ? zeitZuMinuten(s.zeit) : s.datum < tag ? vonMin : null;
      if (st === null) return false;
      const slot = Math.max(vonMin, Math.floor(st / SCHRITT) * SCHRITT);
      return slot === min && (s.datum === tag || (s.datum < tag && zerlegeDatumZeit(e.ende).datum >= tag));
    });

  const oeffneUmplanen = (e) => {
    if (!onVerschieben || !e.verschiebbar) {
      setAnsage(TEXTE.nichtVerschiebbar);
      return;
    }
    setUmplanen(e);
    setUmplanenWert(e.start);
  };

  const verschieben = async (e, neu) => {
    const wann = `${tagKurz(zerlegeDatumZeit(neu.start).datum)} ${zerlegeDatumZeit(neu.start).zeit}`;
    setAnsage(TEXTE.verschoben(e.titel, wann));
    await onVerschieben?.(e, neu);
  };

  const taste = (ev) => {
    if (ev.target instanceof Element && ev.target.closest("input, textarea, select, [contenteditable]")) return;
    const ohneMod = !ev.ctrlKey && !ev.metaKey && !ev.altKey;
    const k = ev.key.toLowerCase();
    if (ohneMod && !ev.shiftKey && (k === "t" || k === "w" || k === "m" || k === "d")) {
      ev.preventDefault();
      if (k === "t") {
        setzeDatum(heute);
        setFokus({ tag: heute, min: aktFokus.min });
      } else setzeAnsicht({ w: "woche", m: "monat", d: "tag" }[k]);
      willFokus.current = true;
      return;
    }
    if (ev.key === "Enter") {
      ev.preventDefault();
      const liste = ansicht === "monat" ? proTag(sichtbar, [aktFokus.tag]).get(aktFokus.tag) : eintraegeDerZelle(aktFokus.tag, aktFokus.min);
      if (liste?.length) {
        if (ev.shiftKey) oeffneUmplanen(liste[0]);
        else onOeffnen?.(liste[0]);
      } else if (onNeu) {
        const start = ansicht === "monat" ? `${aktFokus.tag} 09:00` : plusMinuten(aktFokus.tag, aktFokus.min);
        onNeu({ start, ende: plusMinuten(start, 60), tag: aktFokus.tag });
      }
      return;
    }
    const neu = bewegeFokus(aktFokus, ev.key, { ansicht, tage: ansicht === "monat" ? zr.tage : zr.tage, von: vonMin, bis: bisMin, schritt: SCHRITT });
    if (!neu) return;
    ev.preventDefault();
    if (neu.aussen) setzeDatum(neu.tag);
    setFokus({ tag: neu.tag, min: neu.min });
    willFokus.current = true;
  };

  // ---- Ziehen (Maus/Stift) ----------------------------------------------------------------
  const zielAusZeiger = (x, y, versatz) => {
    const r = raster.current?.getBoundingClientRect();
    if (!r) return null;
    const rinne = parseFloat(getComputedStyle(raster.current).getPropertyValue("--bo-kal-rinne")) || 56;
    const breite = (r.width - rinne) / zr.tage.length;
    const i = Math.min(zr.tage.length - 1, Math.max(0, Math.floor((x - r.left - rinne) / breite)));
    const min = minutenAusLage(y - r.top - versatz, r.height, { von: vonMin, bis: bisMin, raster: 15 });
    return { tag: zr.tage[i], min };
  };

  const zugStart = (ev, e) => {
    if (!onVerschieben || !e.verschiebbar || ev.pointerType === "touch" || ev.button !== 0) return;
    const el = ev.currentTarget.getBoundingClientRect();
    setZug({ eintrag: e, x: ev.clientX, y: ev.clientY, versatz: ev.clientY - el.top, aktiv: false, tag: null, min: null });
  };
  const zugRef = useRef(null);
  useEffect(() => {
    zugRef.current = zug;
  });
  const laeuft = !!zug;
  useEffect(() => {
    if (!laeuft) return;
    const bewegen = (ev) => {
      const z = zugRef.current;
      if (!z) return;
      if (!z.aktiv && Math.hypot(ev.clientX - z.x, ev.clientY - z.y) < 5) return;
      const ziel = zielAusZeiger(ev.clientX, ev.clientY, z.versatz);
      if (ziel) setZug({ ...z, aktiv: true, ...ziel });
    };
    const los = () => {
      const z = zugRef.current;
      setZug(null);
      if (!z?.aktiv || !z.tag) return;
      klickSperre.current = true;
      setTimeout(() => (klickSperre.current = false), 0);
      const neuStart = plusMinuten(z.tag, z.min);
      if (neuStart !== z.eintrag.start) verschieben(z.eintrag, verschiebeEintrag(z.eintrag, neuStart));
    };
    const abbruch = () => setZug(null);
    const esc = (ev) => ev.key === "Escape" && abbruch();
    window.addEventListener("pointermove", bewegen);
    window.addEventListener("pointerup", los);
    window.addEventListener("pointercancel", abbruch);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointermove", bewegen);
      window.removeEventListener("pointerup", los);
      window.removeEventListener("pointercancel", abbruch);
      window.removeEventListener("keydown", esc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Lauscher nur beim Start/Ende des Zugs
  }, [laeuft]);

  // ---- Bausteine --------------------------------------------------------------------------
  const zellRef = (k) => (el) => {
    if (el) zellen.current.set(k, el);
    else zellen.current.delete(k);
  };

  const eintragKnopf = (e, stil, tag, kompakt = false, schmal = false) => {
    const q = QUELLEN[e.quelle];
    const kol = kollisionMap.get(e.id);
    const kolText = kollisionsText(kol);
    const text = `${q.einzeln}: ${e.titel}, ${zeitText(e, tag)}${e.ort ? `, ${e.ort}` : ""}${kolText ? `. ${kolText}` : ""}`;
    return (
      <Kontextmenue
        key={e.id}
        label={e.titel}
        inhalt={
          <>
            {onOeffnen && (
              <MenuePunkt icon="ArrowUpRight" onWaehlen={() => onOeffnen(e)}>
                {TEXTE.oeffnen}
              </MenuePunkt>
            )}
            <MenuePunkt icon="CalendarDays" deaktiviert={!onVerschieben || !e.verschiebbar} grund={!e.verschiebbar ? TEXTE.nichtVerschiebbar : undefined} onWaehlen={() => oeffneUmplanen(e)}>
              {TEXTE.umplanen}
            </MenuePunkt>
          </>
        }
      >
        <div
          role="button"
          tabIndex={-1}
          aria-label={text}
          className="bo-kal-eintrag"
          data-m={q.material}
          data-kollision={kol ? "true" : undefined}
          data-kompakt={kompakt ? "true" : undefined}
          data-schmal={schmal ? "true" : undefined}
          title={text}
          data-verschiebbar={onVerschieben && e.verschiebbar ? "true" : undefined}
          data-zieht={zug?.aktiv && zug.eintrag.id === e.id ? "true" : undefined}
          style={stil}
          onPointerDown={(ev) => zugStart(ev, e)}
          onClick={(ev) => {
            ev.stopPropagation();
            if (klickSperre.current) return;
            onOeffnen?.(e);
          }}
        >
          {kompakt ? (
            <span className="bo-kal-eintrag__zeile">
              <span className="bo-kal-eintrag__zeit">{zerlegeDatumZeit(e.start).zeit}</span> <span className="bo-kal-eintrag__titel">{e.titel}</span>
            </span>
          ) : (
            <>
              <span className="bo-kal-eintrag__zeit">{zeitText(e, tag)}</span>
              <span className="bo-kal-eintrag__titel">{e.titel}</span>
              {e.ort && <span className="bo-kal-eintrag__ort">{e.ort}</span>}
            </>
          )}
          {kol && (
            <span className="bo-kal-eintrag__kollision" title={kolText}>
              <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2} />
              <span className="bo-kal-eintrag__kollision-text">{kol.length === 1 ? "Überschneidung" : `${kol.length} Überschneidungen`}</span>
            </span>
          )}
        </div>
      </Kontextmenue>
    );
  };

  const chip = (e, tag) => {
    const q = QUELLEN[e.quelle];
    return (
      <button
        key={e.id}
        type="button"
        tabIndex={-1}
        className="bo-kal-chip"
        data-m={q.material}
        aria-label={`${q.einzeln}: ${e.titel}, ${zeitText(e, tag)}`}
        onClick={(ev) => {
          ev.stopPropagation();
          onOeffnen?.(e);
        }}
      >
        <Icon name={q.icon} className="size-3.5 shrink-0" />
        <span>{e.ganztag ? e.titel : `${zerlegeDatumZeit(e.start).datum === tag ? zerlegeDatumZeit(e.start).zeit : ""} ${e.titel}`.trim()}</span>
      </button>
    );
  };

  const zaehler = useMemo(() => {
    const m = new Map();
    const tage = new Set(zr.tage);
    for (const e of alle) {
      const s = zerlegeDatumZeit(e.start).datum;
      if (tage.has(s)) m.set(e.quelle, (m.get(e.quelle) || 0) + 1);
    }
    return m;
  }, [alle, zr.tage]);

  // ---- Ansichten --------------------------------------------------------------------------
  const zeitAnsicht = () => {
    const n = zr.tage.length;
    const layouts = new Map(zr.tage.map((t) => [t, layoutTag(sichtbar, t)]));
    const ganztags = proTag(
      sichtbar.filter((e) => e.ganztag),
      zr.tage
    );
    const hatGanztag = [...ganztags.values()].some((l) => l.length);
    const heuteIdx = zr.tage.indexOf(heute);
    return (
      <div className="bo-kal-zeit" style={{ "--bo-kal-tage": n, "--bo-kal-slot": `${SLOT_PX}px`, "--bo-kal-hoehe": `${hoehe}px` }}>
        <div className="bo-kal-zeit__kopf" aria-hidden="true">
          <span />
          {zr.tage.map((t) => (
            <div key={t} className="bo-kal-tagkopf" data-heute={t === heute ? "true" : undefined} data-wochenende={wochentag(t) >= 5 ? "true" : undefined}>
              <span className="bo-kal-tagkopf__wt">{WOCHENTAGE_KURZ[wochentag(t)]}</span>
              <span className="bo-kal-tagkopf__nr">{Number(t.slice(8))}</span>
            </div>
          ))}
        </div>
        {hatGanztag && (
          <div className="bo-kal-zeit__ganztag">
            <span className="bo-kal-zeit__ganztag-label">{TEXTE.ganztag}</span>
            {zr.tage.map((t) => (
              <div key={t} className="bo-kal-zeit__ganztag-tag">
                {ganztags.get(t).map((e) => chip(e, t))}
              </div>
            ))}
          </div>
        )}
        <div ref={scroll} className="bo-kal-zeit__scroll">
          <div ref={raster} role="grid" aria-label={`${label}, ${zr.titel}`} aria-describedby={`${id}-hilfe`} aria-rowcount={slotsListe.length} aria-colcount={n} className="bo-kal-zeit__raster" onKeyDown={taste} data-testid={`${testid}-raster`}>
            {slotsListe.map((min, ri) => (
              <div key={min} role="row" aria-rowindex={ri + 1} className="bo-kal-zeit__row">
                <span className="bo-kal-zeit__uhr" aria-hidden="true">
                  {min % 60 === 0 && ri > 0 ? minutenZuZeit(min) : ""}
                </span>
                {zr.tage.map((t, ci) => {
                  const k = `${t}|${min}`;
                  const istZiel = aktFokus.tag === t && aktFokus.min === min;
                  const hier = layouts.get(t).filter((l) => Math.max(vonMin, Math.floor(l.von / SCHRITT) * SCHRITT) === min && l.bis > vonMin && l.von < bisMin);
                  return (
                    <div
                      key={k}
                      ref={zellRef(k)}
                      role="gridcell"
                      aria-colindex={ci + 1}
                      aria-label={`${TEXTE.zelle(tagKurz(t), minutenZuZeit(min))}${hier.length ? `, ${TEXTE.eintraegeIn(hier.length)}` : ""}`}
                      tabIndex={istZiel ? 0 : -1}
                      className="bo-kal-zelle"
                      data-stunde={min % 60 === 0 ? "true" : undefined}
                      data-heute={t === heute ? "true" : undefined}
                      data-ziel={zug?.aktiv && zug.tag === t && Math.floor(zug.min / SCHRITT) * SCHRITT === min ? "true" : undefined}
                      onFocus={() => !istZiel && setFokus({ tag: t, min })}
                      onClick={() => {
                        setFokus({ tag: t, min });
                        if (!hier.length && onNeu) {
                          const start = plusMinuten(t, min);
                          onNeu({ start, ende: plusMinuten(start, 60), tag: t });
                        }
                      }}
                    >
                      {hier.map((l) => {
                        const a = Math.max(l.von, vonMin);
                        const b = Math.min(l.bis, bisMin);
                        const oben = ((a - min) / SCHRITT) * SLOT_PX + 1;
                        const hoeheE = Math.max(22, ((b - a) / SCHRITT) * SLOT_PX - 2);
                        return eintragKnopf(l.eintrag, { top: oben, height: hoeheE, left: `calc(${(l.spalte / l.spalten) * 100}% + 2px)`, width: `calc(${100 / l.spalten}% - 4px)` }, t, hoeheE < 40, l.spalten > 1 && zr.tage.length > 1);
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
            {heuteIdx >= 0 && nowMin !== null && nowMin >= vonMin && nowMin <= bisMin && (
              <span
                className="bo-kal-jetzt"
                aria-hidden="true"
                style={{ top: ((nowMin - vonMin) / SCHRITT) * SLOT_PX, left: `calc(var(--bo-kal-rinne) + (100% - var(--bo-kal-rinne)) * ${heuteIdx} / ${n})`, width: `calc((100% - var(--bo-kal-rinne)) / ${n})`, right: "auto" }}
              />
            )}
            {zug?.aktiv && zug.tag && (
              <span
                className="bo-kal-geist"
                data-m={QUELLEN[zug.eintrag.quelle].material}
                aria-hidden="true"
                style={{
                  top: ((zug.min - vonMin) / SCHRITT) * SLOT_PX,
                  height: Math.max(22, (((zerlegeDatumZeit(zug.eintrag.ende).datum === zerlegeDatumZeit(zug.eintrag.start).datum ? zeitZuMinuten(zerlegeDatumZeit(zug.eintrag.ende).zeit) - zeitZuMinuten(zerlegeDatumZeit(zug.eintrag.start).zeit) : 60)) / SCHRITT) * SLOT_PX - 2),
                  left: `calc(var(--bo-kal-rinne) + (100% - var(--bo-kal-rinne)) * ${zr.tage.indexOf(zug.tag)} / ${n} + 2px)`,
                  width: `calc((100% - var(--bo-kal-rinne)) / ${n} - 4px)`,
                }}
              >
                {tagKurz(zug.tag)} · {minutenZuZeit(zug.min)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const monatAnsicht = () => {
    const map = proTag(sichtbar, zr.tage);
    const wochen = Array.from({ length: 6 }, (_, i) => zr.raster.slice(i * 7, i * 7 + 7));
    return (
      <div>
        <div className="bo-kal-monat" aria-hidden="true">
          {WOCHENTAGE_KURZ.map((w) => (
            <span key={w} className="bo-kal-monat__wt">
              {w}
            </span>
          ))}
        </div>
        <div role="grid" aria-label={`${label}, ${zr.titel}`} aria-describedby={`${id}-hilfe`} className="bo-kal-monat" onKeyDown={taste} data-testid={`${testid}-raster`}>
          {wochen.map((woche, wi) => (
            <div key={wi} role="row" className="bo-kal-monat__row">
              {woche.map((r) => {
                const liste = map.get(r.iso) || [];
                const istZiel = aktFokus.tag === r.iso;
                return (
                  <div
                    key={r.iso}
                    ref={zellRef(r.iso)}
                    role="gridcell"
                    tabIndex={istZiel ? 0 : -1}
                    aria-label={`${TEXTE.zelle(tagKurz(r.iso))}${liste.length ? `, ${TEXTE.eintraegeIn(liste.length)}` : ""}`}
                    className="bo-kal-mtag"
                    data-heute={r.iso === heute ? "true" : undefined}
                    data-im-monat={r.imMonat ? "true" : "false"}
                    onFocus={() => !istZiel && setFokus({ tag: r.iso, min: aktFokus.min })}
                    onClick={() => setFokus({ tag: r.iso, min: aktFokus.min })}
                    onDoubleClick={() => {
                      setzeDatum(r.iso);
                      setzeAnsicht("tag");
                    }}
                  >
                    <span className="bo-kal-mtag__nr" aria-hidden="true">
                      {r.tag}
                    </span>
                    {liste.slice(0, 3).map((e) => chip(e, r.iso))}
                    {liste.length > 3 && <span className="bo-kal-mtag__mehr">{TEXTE.weitere(liste.length - 3)}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className={cx("bo-kal", className)} aria-label={label} data-testid={testid} data-ansicht={ansicht}>
      <div className="bo-kal__kopf">
        <div className="bo-kal__titel">
          <h2 aria-live="polite">{zr.titel}</h2>
          {ansicht === "woche" && <span className="bo-kal__kw">{zr.kurztitel}</span>}
        </div>
        <div className="bo-kal__werkzeuge">
          <Segment label={TEXTE.ansichtLabel} wert={ansicht} onWechsel={setzeAnsicht} optionen={["tag", "woche", "monat"].map((a) => ({ wert: a, titel: TEXTE.ansichten[a] }))} groesse="s" testid={`${testid}-ansicht`} />
          <button type="button" className="bo-rund bo-tip bo-ziel" aria-label={TEXTE.zurueck[ansicht]} data-tip={TEXTE.zurueck[ansicht]} onClick={() => setzeDatum(blaettern(ansicht, datum, -1))}>
            <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </button>
          <button type="button" className="bo-rund bo-tip bo-ziel" aria-label={TEXTE.weiter[ansicht]} data-tip={TEXTE.weiter[ansicht]} onClick={() => setzeDatum(blaettern(ansicht, datum, 1))}>
            <ChevronRight aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </button>
          <Knopf size="m" onClick={() => setzeDatum(heute || heuteIso())} kuerzel="T">
            {TEXTE.heute}
          </Knopf>
        </div>
      </div>
      {angeboten.length > 1 && (
        <div className="bo-kal__quellen" role="group" aria-label={TEXTE.quellen}>
          {angeboten.map((q) => {
            const an = !aus.has(q);
            return (
              <button
                key={q}
                type="button"
                className="bo-kal-quelle"
                data-m={QUELLEN[q].material}
                aria-pressed={an}
                onClick={() =>
                  setAus((s) => {
                    const n = new Set(s);
                    if (n.has(q)) n.delete(q);
                    else n.add(q);
                    return n;
                  })
                }
              >
                <i aria-hidden="true" />
                {QUELLEN[q].titel}
                {zaehler.get(q) ? <span>{zaehler.get(q)}</span> : null}
              </button>
            );
          })}
        </div>
      )}
      <p id={`${id}-hilfe`} className="sr-only">
        {TEXTE.tastenhilfe}
      </p>
      {ansicht === "monat" ? monatAnsicht() : zeitAnsicht()}
      <p className="sr-only" aria-live="polite">
        {ansage}
      </p>
      <Dialog
        offen={!!umplanen}
        onSchliessen={() => setUmplanen(null)}
        titel={umplanen ? TEXTE.umplanenTitel(umplanen.titel) : ""}
        text={TEXTE.umplanenText}
        groesse="sm"
        fuss={
          <>
            <Knopf onClick={() => setUmplanen(null)}>{TEXTE.abbrechen}</Knopf>
            <Knopf
              variant="primary"
              disabled={!umplanenWert || umplanenWert === umplanen?.start}
              onClick={() => {
                const e = umplanen;
                setUmplanen(null);
                verschieben(e, verschiebeEintrag(e, umplanenWert));
              }}
            >
              {TEXTE.verschieben}
            </Knopf>
          </>
        }
      >
        {umplanen && (
          <div className="grid gap-1.5">
            <span id={`${id}-beginn`} className="text-[13px] font-medium text-bo-text-soft">
              {TEXTE.beginn}
            </span>
            <Datumsfeld mitZeit value={umplanenWert} onChange={setUmplanenWert} gruppeLabelId={`${id}-beginn`} aria-label={TEXTE.beginn} />
          </div>
        )}
      </Dialog>
    </section>
  );
}
