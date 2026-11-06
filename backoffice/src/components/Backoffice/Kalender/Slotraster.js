"use client";
// G-21 Slotraster (Team P0-6): freie Zeiten im 30-min-Raster – Beratung vereinbaren (CRM), Montage-/
// Servicetermin vorschlagen, Personal-Einteilung. Tage als Spalten, freie Beginnzeiten als Pillen; gewählt =
// Tinte. Belegt sind alle übergebenen Einträge (ganztägige Abwesenheit sperrt den Tag), Vergangenes nicht
// wählbar. Tastatur: eine Radiogruppe – ←/→ Tag (gleiche Uhrzeit oder nächstliegende), ↑/↓ Zeit, Pos1/Ende.

import { useMemo, useRef, useState } from "react";
import { tagKurz, wochentag, zerlegeDatumZeit, zeitZuMinuten, WOCHENTAGE_KURZ } from "@/lib/backoffice/datum";
import cx from "../cx";
import { freieSlots, normalisiere } from "./logik";
import { TEXTE } from "./texte";
import "./kalender.css";

/**
 * @param {object} p
 * @param {string[]} p.tage                      ISO-Tage (z. B. die nächsten 5 Werktage)
 * @param {Array<object>} [p.belegt]             Einträge (wie Kalender), die Zeit blockieren
 * @param {string} [p.von]                       „09:00“
 * @param {string} [p.bis]                       „18:00“
 * @param {number} [p.dauer]                     Minuten (Standard 60)
 * @param {number} [p.schritt]                   Raster (Standard 30)
 * @param {string} [p.wert]                      gewählter Beginn „JJJJ-MM-TT HH:MM“
 * @param {(w:{start:string, ende:string}) => void} p.onWahl
 * @param {string} [p.jetzt]                     „JJJJ-MM-TT HH:MM“ – frühere Slots sind nicht frei
 * @param {number} [p.max]                     sichtbare Zeiten je Tag, Rest über „Weitere Zeiten“ (Standard 8)
 * @param {string} [p.label]
 */
export default function Slotraster({ tage = [], belegt = [], von = "09:00", bis = "18:00", dauer = 60, schritt = 30, wert, onWahl, jetzt = null, max = 8, label = TEXTE.slot.label, className, testid = "slotraster" }) {
  const knoepfe = useRef(new Map());
  const [fokusStart, setFokusStart] = useState(null);
  const [offen, setOffen] = useState(() => new Set());
  const liste = useMemo(() => normalisiere(belegt), [belegt]);
  const spalten = useMemo(
    () => tage.map((tag) => ({ tag, slots: freieSlots({ tag, von: zeitZuMinuten(von) ?? 540, bis: zeitZuMinuten(bis) ?? 1080, schritt, dauer, belegt: liste, jetzt }) })),
    [tage, von, bis, schritt, dauer, liste, jetzt]
  );
  const sichtbareSpalten = spalten.map((sp) => ({ ...sp, slots: offen.has(sp.tag) ? sp.slots : sp.slots.slice(0, max) }));
  const alle = sichtbareSpalten.flatMap((s) => s.slots);
  const ziel = alle.find((s) => s.start === (fokusStart || wert)) || alle[0];

  const fokussiere = (s) => {
    if (!s) return;
    setFokusStart(s.start);
    knoepfe.current.get(s.start)?.focus();
  };

  const taste = (e) => {
    const pos = (() => {
      for (let i = 0; i < sichtbareSpalten.length; i++) {
        const j = sichtbareSpalten[i].slots.findIndex((s) => s.start === ziel?.start);
        if (j >= 0) return { i, j };
      }
      return null;
    })();
    if (!pos) return;
    let neu = null;
    if (e.key === "ArrowDown") neu = sichtbareSpalten[pos.i].slots[pos.j + 1];
    else if (e.key === "ArrowUp") neu = sichtbareSpalten[pos.i].slots[pos.j - 1];
    else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const d = e.key === "ArrowRight" ? 1 : -1;
      for (let i = pos.i + d; i >= 0 && i < sichtbareSpalten.length; i += d) {
        if (!sichtbareSpalten[i].slots.length) continue;
        const m = sichtbareSpalten[pos.i].slots[pos.j].min;
        neu = sichtbareSpalten[i].slots.reduce((best, s) => (Math.abs(s.min - m) < Math.abs(best.min - m) ? s : best));
        break;
      }
    } else if (e.key === "Home") neu = alle[0];
    else if (e.key === "End") neu = alle[alle.length - 1];
    else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onWahl?.({ start: ziel.start, ende: ziel.ende });
      return;
    }
    if (neu) {
      e.preventDefault();
      fokussiere(neu);
      onWahl?.({ start: neu.start, ende: neu.ende });
    }
  };

  return (
    <div role="radiogroup" aria-label={`${label} · ${TEXTE.slot.dauer(dauer)}`} className={cx("bo-kal-slots", className)} style={{ "--bo-kal-tage": Math.max(1, tage.length) }} onKeyDown={taste} data-testid={testid}>
      {spalten.map(({ tag, slots }) => (
        <div key={tag} className="bo-kal-slots__tag" role="group" aria-label={tagKurz(tag)}>
          <div className="bo-kal-slots__kopf bo-kal-tagkopf" aria-hidden="true" data-wochenende={wochentag(tag) >= 5 ? "true" : undefined}>
            <span className="bo-kal-tagkopf__wt">{WOCHENTAGE_KURZ[wochentag(tag)]}</span>
            <span className="bo-kal-tagkopf__nr">{Number(tag.slice(8))}</span>
          </div>
          {slots.length === 0 && <p className="bo-kal-slots__leer">{TEXTE.slot.keine}</p>}
          {(offen.has(tag) ? slots : slots.slice(0, max)).map((s) => {
            const an = s.start === wert;
            return (
              <button
                key={s.start}
                ref={(el) => {
                  if (el) knoepfe.current.set(s.start, el);
                  else knoepfe.current.delete(s.start);
                }}
                type="button"
                role="radio"
                aria-checked={an}
                aria-label={`${tagKurz(tag)} ${zerlegeDatumZeit(s.start).zeit} bis ${zerlegeDatumZeit(s.ende).zeit}`}
                tabIndex={s.start === ziel?.start ? 0 : -1}
                className="bo-kal-slot"
                onFocus={() => setFokusStart(s.start)}
                onClick={() => onWahl?.({ start: s.start, ende: s.ende })}
              >
                {zerlegeDatumZeit(s.start).zeit}
              </button>
            );
          })}
          {slots.length > max && !offen.has(tag) && (
            <button type="button" className="bo-kal-slots__mehr" onClick={() => setOffen((o) => new Set(o).add(tag))}>
              {TEXTE.slot.weitere(slots.length - max)}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
