"use client";
// Upload-Schlange als Material-Karte unten rechts (Konzept §3.2): je Datei Fortschrittsbalken, Status in Worten,
// Abbrechen / Erneut / Öffnen; Duplikat-Hinweis mit Link. Einklappbar; Ansage über aria-live.

import { useState } from "react";
import Link from "next/link";
import { CircleCheck, TriangleAlert } from "lucide-react";
import Knopf from "../Knopf";
import { T } from "@/lib/backoffice/ablage/texte";

const AKTIV = ["wartet", "pruefe", "sendet", "schliesst"];

function statusText(e) {
  if (e.zustand === "pruefe") return `${T.upload.pruefe} ${Math.round(e.anteil * 100)} %`;
  if (e.zustand === "sendet") return `${T.upload.sendet} ${Math.round(e.anteil * 100)} %`;
  if (e.zustand === "schliesst") return T.upload.schliesst;
  if (e.zustand === "fertig") return e.duplikate?.length ? T.upload.duplikat(e.duplikate[0].ordner_titel) : T.upload.fertig;
  if (e.zustand === "fehler") return e.meldung || T.upload.fehler;
  if (e.zustand === "abgebrochen") return T.upload.abgebrochen;
  return "…";
}

export default function UploadSchlange({ eintraege, onAbbrechen, onErneut, onLeeren }) {
  const [zu, setZu] = useState(false);
  if (!eintraege.length) return null;
  const fertig = eintraege.filter((e) => e.zustand === "fertig").length;
  const laeuft = eintraege.some((e) => AKTIV.includes(e.zustand));
  return (
    <section className="bo-abl-schlange bo-material-stark bo-rise" aria-label={T.upload.titel} data-testid="abl-schlange">
      <div className="bo-abl-schlange__kopf">
        <p className="bo-abl-schlange__titel" aria-live="polite">
          {T.upload.zusammenfassung(fertig, eintraege.length)}
        </p>
        <Knopf variant="ghost" size="s" icon={zu ? "ChevronUp" : "ChevronDown"} label={zu ? T.upload.ausklappen : T.upload.einklappen} onClick={() => setZu(!zu)} />
        {!laeuft && (
          <Knopf variant="ghost" size="s" icon="X" label={T.upload.schliessen} onClick={onLeeren} data-testid="abl-schlange-zu" />
        )}
      </div>
      {!zu && (
        <ul className="bo-abl-schlange__liste">
          {eintraege.map((e) => (
            <li key={e.id} className="bo-abl-up" data-zustand={e.zustand} data-testid="abl-upload">
              <span className="grid size-8 shrink-0 place-items-center">
                {e.zustand === "fertig" ? (
                  <CircleCheck className="size-5 text-bo-salbei-text" strokeWidth={1.75} aria-hidden="true" />
                ) : e.zustand === "fehler" ? (
                  <TriangleAlert className="size-5 text-bo-ziegel-text" strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <span className="bo-spinner" aria-hidden="true" />
                )}
              </span>
              <span className="bo-abl-up__text">
                <span className="bo-abl-up__name" title={e.name}>
                  {e.name}
                </span>
                <span className="bo-abl-up__balken" aria-hidden="true">
                  <span style={{ transform: `scaleX(${e.zustand === "fehler" ? 1 : Math.max(0.02, e.anteil || 0)})` }} />
                </span>
                <span className="bo-abl-up__status" data-ton={e.zustand === "fehler" ? "fehler" : e.zustand === "fertig" ? "ok" : undefined} role={e.zustand === "fehler" ? "alert" : undefined}>
                  {statusText(e)}
                </span>
              </span>
              {AKTIV.includes(e.zustand) && (
                <Knopf variant="ghost" size="s" onClick={() => onAbbrechen(e.id)}>
                  {T.upload.abbrechen}
                </Knopf>
              )}
              {["fehler", "abgebrochen"].includes(e.zustand) && e.datei && !/nicht erlaubt|größer als/.test(e.meldung || "") && (
                <Knopf variant="secondary" size="s" onClick={() => onErneut(e.id)}>
                  {T.upload.erneut}
                </Knopf>
              )}
              {e.zustand === "fertig" && e.ergebnis?.datei && (
                <Knopf variant="ghost" size="s" href={`/ablage/datei/${encodeURIComponent(e.duplikate?.length && e.verworfen ? e.duplikate[0].datei : e.ergebnis.datei)}`}>
                  {T.upload.oeffnen}
                </Knopf>
              )}
              {e.zustand === "fertig" && e.duplikate?.length > 0 && !e.verworfen && (
                <Link className="sr-only" href={`/ablage/datei/${encodeURIComponent(e.duplikate[0].datei)}`}>
                  {T.upload.duplikat(e.duplikate[0].ordner_titel)}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
