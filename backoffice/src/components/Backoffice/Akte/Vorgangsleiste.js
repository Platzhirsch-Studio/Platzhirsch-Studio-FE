"use client";

import Link from "next/link";
import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import cx from "../cx";
import Avatar, { AvatarReihe } from "../Avatar";
import Knopf from "../Knopf";
import { Icon } from "../icons";
import Popover from "../Overlay/Popover";
import { TEXTE } from "@/lib/backoffice/akte/texte";
import { fortschritt, kartenDerStufe, kompaktePunkte, normalisiereSchritte, personenDerReise, verbindungen } from "@/lib/backoffice/akte/vorgang";
import "./akte.css";

// Vorgangsleiste (G-12, Team P0-5a) im Lounge-Stil: die Kundenreise aus dem Entwurf
// (art-direction/lounge.md §6 „Kundenreise“, Referenz Sugar CRM). Stufen-Spalten auf eingelassener
// Fläche, je Stufe eine Karte mit Schritten (Person-Avatar oder „+“-Kreis, Status-Symbol, Text 13/600,
// Datum 12); der aktuelle Schritt ist eine Tinte-Karte, die aktuelle Stufe trägt eine 1,5-px-Kontur.
// Verbindungen als SVG-Bezier mit Knoten (gemessen per ResizeObserver), offen = gestrichelt.
// Stufenname unter der Spalte, erledigt mit Häkchen; mit Objekten (Belege) ist er ein Knopf mit
// Popover (G-12: „Punkte sind <button> mit Popover der Objekte“), aktuelle Stufe `aria-current="step"`.
//
// Ein Baustein für alle Ketten (C-03): Kundenreise (Projekte, mit `aufgaben`), CRM-Vorgang
// (Anfrage → Termin → Gespräch → Angebot → Auftrag), Faktura-Belegkette, Service-Phasen – Stufen ohne
// `aufgaben` bekommen eine Karte aus Objekt/Datum. Telefon: senkrechte Stufenliste mit Knotenlinie.
// `kompakt`: Punkte 6 px ohne Text für Listen und Karten.

const ZUSTAND_ICON = { erledigt: "CheckCheck", aktuell: "Clock", teilweise: "Clock", offen: "CalendarDays", uebersprungen: "Minus" };
const zText = (z) => TEXTE.vorgang.zustand[z] || z;

function datumText(k) {
  return k.datum || null;
}

function Karte({ karte }) {
  const z = karte.zustand;
  const Tag = karte.href ? Link : "div";
  const person = typeof karte.person === "string" ? { name: karte.person } : karte.person;
  return (
    <Tag
      {...(karte.href ? { href: karte.href } : {})}
      className="bo-reise__karte"
      data-karte=""
      data-z={z}
      data-offen={z === "offen" || z === "uebersprungen" ? "" : undefined}
      data-leer={karte.leer ? "" : undefined}
      aria-current={z === "aktuell" ? "step" : undefined}
    >
      <span className="bo-reise__karte-kopf">
        {person ? (
          <Avatar name={person.name} kuerzel={person.kuerzel} material={person.material} groesse={32} ring={false} />
        ) : (
          <span className="bo-reise__plus" aria-hidden="true">
            <Icon name={karte.abgeleitet && !karte.leer ? "FileText" : "Plus"} className="size-4" />
          </span>
        )}
        <span className="bo-reise__st" role="img" aria-label={zText(z)}>
          <Icon name={ZUSTAND_ICON[z] || "CalendarDays"} className="size-4" />
        </span>
      </span>
      <span className="bo-reise__karte-t">{karte.titel}</span>
      {datumText(karte) && <span className="bo-reise__karte-d">{datumText(karte)}</span>}
    </Tag>
  );
}

function StufenName({ stufe }) {
  const fertig = stufe.zustand === "erledigt";
  const inhalt = (
    <>
      {fertig && <Icon name="Check" className="size-4" />}
      <span>{stufe.titel}</span>
    </>
  );
  if (!stufe.objekte.length) return <p className="bo-reise__name">{inhalt}</p>;
  return (
    <Popover
      label={TEXTE.vorgang.objekte(stufe.titel)}
      platzierung="unten-mitte"
      ausloeser={(p) => (
        <button type="button" {...p} className="bo-reise__name bo-druck" aria-label={TEXTE.vorgang.objekte(stufe.titel)}>
          {inhalt}
          <span className="bo-reise__name-zahl" aria-hidden="true">{stufe.objekte.length}</span>
        </button>
      )}
    >
      <div className="bo-reise-objekte">
        <p className="bo-reise-objekte__kopf">
          <b>{stufe.titel}</b>
          {[zText(stufe.zustand), stufe.datum, stufe.plan ? TEXTE.vorgang.geplant(stufe.plan) : null].filter(Boolean).join(" · ")}
        </p>
        {stufe.objekte.map((o, i) =>
          o.href ? (
            <Link key={`${o.titel}-${i}`} href={o.href}>
              <span>{o.titel}</span>
              {o.info && <span className="bo-reise-objekte__info">{o.info}</span>}
            </Link>
          ) : (
            <span key={`${o.titel}-${i}`} className="bo-reise-objekte__zeile">
              <span>{o.titel}</span>
              {o.info && <span className="bo-reise-objekte__info">{o.info}</span>}
            </span>
          )
        )}
      </div>
    </Popover>
  );
}

/** Linien zwischen den Spalten messen (ResizeObserver; ohne Layout → keine Linien). */
function useLinien(wrap, schluessel) {
  const [linien, setLinien] = useState({ w: 0, h: 0, p: [] });
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const messen = () => {
      const box = el.getBoundingClientRect();
      if (!box.width) return;
      const spalten = [...el.querySelectorAll("[data-spalte]")].map((s) => {
        const r = s.getBoundingClientRect();
        return {
          links: r.left - box.left,
          rechts: r.right - box.left,
          karten: [...s.querySelectorAll("[data-karte]")].map((k) => {
            const kr = k.getBoundingClientRect();
            return { mitte: kr.top + kr.height / 2 - box.top, offen: k.hasAttribute("data-offen") };
          }),
        };
      });
      setLinien({ w: box.width, h: box.height, p: verbindungen(spalten) });
    };
    messen();
    const ro = new ResizeObserver(messen);
    ro.observe(el);
    return () => ro.disconnect();
  }, [wrap, schluessel]);
  return linien;
}

/**
 * @param {object} p
 * @param {Array<object>} p.schritte   Stufen (Datenform in lib/backoffice/akte/vorgang.js)
 * @param {string} [p.titel]           Kopf („Kundenreise“, „Vorgang“, „Belegkette“)
 * @param {Array<string|object>} [p.personen]  Avatar-Reihe im Kopf (Standard: Personen der Schritte)
 * @param {{titel:string, aktion?:import("react").ReactNode|{titel:string, href?:string, onClick?:Function},
 *   blocker?:{text:string, href?:string, linkText?:string}}} [p.naechster]  genau eine Aktion ODER ein Blocker-Satz
 * @param {import("react").ReactNode} [p.werkzeuge]  Rundknöpfe rechts im Kopf
 * @param {boolean} [p.kompakt]        Punkte 6 px ohne Text (Liste/Karte)
 * @param {boolean} [p.mitText]        kompakt: „Stufe 3 von 5“ daneben
 * @param {boolean} [p.ohneKachel]     ohne eigene Kachel (in Peek/Sheet eingebettet)
 * @param {boolean} [p.ohneKopf]
 */
export default function Vorgangsleiste({ schritte, titel = TEXTE.vorgang.titel, personen, naechster, werkzeuge, kompakt = false, mitText = false, ohneKachel = false, ohneKopf = false, className, testid }) {
  const stufen = useMemo(() => normalisiereSchritte(schritte), [schritte]);
  const f = useMemo(() => fortschritt(stufen), [stufen]);
  const leute = useMemo(() => personen || personenDerReise(stufen), [personen, stufen]);
  const wrap = useRef(null);
  const titelId = useId();
  const schluessel = stufen.map((s) => `${s.id}:${s.zustand}:${s.aufgaben.length}`).join("|");
  const linien = useLinien(wrap, kompakt ? null : schluessel);

  if (kompakt) {
    const aktuell = stufen[f.aktuell];
    const label = aktuell ? TEXTE.vorgang.stufe(f.nr, f.stufen, aktuell.titel) : TEXTE.vorgang.fortschrittKurz(f.erledigt, f.gesamt);
    return (
      <span className={cx("bo-reise-kompakt", className)} role="img" aria-label={label} title={label} data-testid={testid}>
        {kompaktePunkte(stufen, zText).map((p) => (
          <span key={p.id} className="bo-reise-kompakt__p" data-z={p.zustand} title={p.title} />
        ))}
        {mitText && (
          <span className="bo-reise-kompakt__t" aria-hidden="true">
            {aktuell ? aktuell.titel : TEXTE.vorgang.fortschrittKurz(f.erledigt, f.gesamt)}
          </span>
        )}
      </span>
    );
  }

  const Huelle = ohneKachel ? "div" : "section";
  return (
    <Huelle
      className={cx(!ohneKachel && "bo-kachel", "bo-reise", className)}
      data-ohne-kachel={ohneKachel ? "" : undefined}
      aria-labelledby={ohneKopf ? undefined : titelId}
      aria-label={ohneKopf ? titel : undefined}
      data-testid={testid}
    >
      {!ohneKopf && (
        <div className="bo-reise__kopf">
          <div className="bo-reise__kopf-l">
            <h2 id={titelId} className="bo-reise__titel">
              {titel}
            </h2>
            {leute.length > 0 && <AvatarReihe personen={leute} max={5} groesse={36} label={`${TEXTE.vorgang.personen}: ${leute.map((p) => p.name || p.kuerzel).join(", ")}`} />}
            {f.gesamt > 0 && (
              <span className="bo-reise__stand">
                <b>{f.erledigt}</b> {TEXTE.vorgang.fortschritt(f.erledigt, f.gesamt).replace(/^\d+ /, "")}
              </span>
            )}
          </div>
          {werkzeuge && <div className="bo-reise__werkzeuge">{werkzeuge}</div>}
        </div>
      )}

      {stufen.length === 0 ? (
        <p className="bo-akte-slot__ruhe">{TEXTE.vorgang.leer}</p>
      ) : (
        <>
          <div className="bo-reise__flaeche" role="region" aria-label={typeof titel === "string" ? titel : TEXTE.vorgang.titel} tabIndex={0} data-testid={testid ? `${testid}-flaeche` : undefined}>
            <div className="bo-reise__innen" ref={wrap} style={{ "--bo-reise-n": stufen.length }}>
              <svg className="bo-reise__svg" width={linien.w} height={linien.h} aria-hidden="true">
                {linien.p.map((l, i) => (
                  <g key={i} className={l.offen ? "is-offen" : undefined}>
                    <path d={l.d} className="bo-reise__linie" pathLength={l.offen ? undefined : 1} data-zeichnen="" />
                    <circle cx={l.x1} cy={l.y1} r="4" className="bo-reise__knoten" />
                    <circle cx={l.x2} cy={l.y2} r="4" className="bo-reise__knoten" />
                  </g>
                ))}
              </svg>
              <ol className="bo-reise__spalten bo-staffel" aria-label={TEXTE.vorgang.listeLabel(titel)}>
                {stufen.map((s, i) => (
                  <li key={s.id} className="bo-reise__spalte" data-z={s.zustand} aria-current={i === f.aktuell ? "step" : undefined}>
                    <span className="sr-only">{TEXTE.vorgang.stufeLabel(s.titel, zText(s.zustand))}</span>
                    <div className="bo-reise__stufe" data-spalte="">
                      {kartenDerStufe(s, { nochKeins: TEXTE.vorgang.nochKeins }).map((k) => (
                        <Karte key={k.id} karte={k} />
                      ))}
                    </div>
                    <StufenName stufe={s} />
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <ol className="bo-reise__liste" aria-label={TEXTE.vorgang.listeLabel(titel)}>
            {stufen.map((s, i) => (
              <li key={s.id} className="bo-reise__l-stufe" data-z={s.zustand} aria-current={i === f.aktuell ? "step" : undefined}>
                <span className="bo-reise__l-punkt" aria-hidden="true">
                  {s.zustand === "erledigt" ? <Icon name="Check" className="size-3.5" /> : <span className="text-[11px] font-semibold tabular-nums">{i + 1}</span>}
                </span>
                <div className="min-w-0">
                  <p className="bo-reise__l-titel">{s.titel}</p>
                  <p className="bo-reise__l-unter">{[zText(s.zustand), s.datum, s.plan ? TEXTE.vorgang.geplant(s.plan) : null].filter(Boolean).join(" · ")}</p>
                  {(i === f.aktuell || s.aufgaben.length > 0) && (
                    <div className="bo-reise__l-karten">
                      {kartenDerStufe(s, { nochKeins: TEXTE.vorgang.nochKeins })
                        .filter((k) => i === f.aktuell || k.zustand !== "erledigt" || s.aufgaben.length <= 2)
                        .map((k) => (
                          <Karte key={k.id} karte={k} />
                        ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}

      {naechster && <NaechsterSchritt naechster={naechster} />}
    </Huelle>
  );
}

function NaechsterSchritt({ naechster }) {
  const { titel, aktion, blocker } = naechster;
  let knopf = null;
  if (!blocker && aktion) {
    if (typeof aktion === "object" && !Array.isArray(aktion) && aktion.titel && !aktion.$$typeof) {
      knopf = (
        <Knopf variant="secondary" href={aktion.href} onClick={aktion.onClick} iconRechts="ArrowRight">
          {aktion.titel}
        </Knopf>
      );
    } else knopf = aktion;
  }
  return (
    <div className="bo-reise__naechster" data-testid="vorgang-naechster">
      <p className="bo-reise__naechster-t">
        <span>{TEXTE.vorgang.naechster}</span>
        <b>{titel}</b>
        {blocker && (
          <>
            {" · "}
            <span className="bo-reise__blocker inline">
              {TEXTE.vorgang.blockiert} {blocker.text}
              {blocker.href && (
                <>
                  {" · "}
                  <Link href={blocker.href} className="underline underline-offset-[3px]">
                    {blocker.linkText || blocker.href}
                  </Link>
                </>
              )}
            </span>
          </>
        )}
      </p>
      {knopf}
    </div>
  );
}
