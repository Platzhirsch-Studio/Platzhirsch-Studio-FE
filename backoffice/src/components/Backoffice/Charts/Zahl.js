"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DAUER, reduziert, zaehle } from "../motion";
import { formatiere, wechselArt } from "./logik";

/** Dauer des Hochzählens beim Erscheinen (Lounge §8: Zahlen zählen beim Erscheinen hoch). */
export const DAUER_ERSCHEINEN = 900;

/**
 * Zahl einer Kennzahl (Client-Kind von `Kennzahl`/`Akzentkachel`).
 * - `hochzaehlen` (Lounge §8): beim Erscheinen im Sichtbereich zählt die Zahl von 0 auf den
 *   Endwert (900 ms, ausklingend). Bis dahin steht der Endwert unsichtbar an seinem Platz
 *   (`data-hochzaehlen="warte"`, CSS) – kein Springen, kein Hydrationsfehler. Ohne Skript, bei
 *   reduzierter Bewegung und im Kiosk steht sofort der Endwert.
 * - Ändert sich `wert` nach dem Laden (router.refresh, Zeitraum, Live-Daten), zählt sie 400 ms
 *   und hebt sich 160 ms in Cognac ab; Sprünge über 4 Stellen wechseln direkt.
 * Screenreader: sichtbarer Text aria-hidden, Endwert im sr-Text.
 * @param {{wert:number, format?:"zahl"|"dezimal"|"cent"|"cent-rund"|"prozent", kiosk?:boolean, hochzaehlen?:boolean, className?:string}} props
 */
export default function Zahl({ wert, format = "zahl", kiosk = false, hochzaehlen = false, className }) {
  const [anzeige, setAnzeige] = useState(wert);
  const [markiert, setMarkiert] = useState(false);
  const [phase, setPhase] = useState(hochzaehlen ? "warte" : "fertig");
  const vorher = useRef(wert);
  const erstesMal = useRef(true);
  const ref = useRef(null);
  // Abbruch des Erscheinens (Hochzählen/Beobachter), damit eine Wertänderung es nie überschreibt.
  const erscheinenAbbrechen = useRef(() => {});

  // Erscheinen: einmal hochzählen, sobald die Zahl sichtbar ist.
  useEffect(() => {
    if (!hochzaehlen) return undefined;
    const ziel = vorher.current;
    let stopp = () => {};
    let io = null;
    const raf = requestAnimationFrame(() => {
      if (kiosk || reduziert() || typeof ziel !== "number" || !Number.isFinite(ziel) || ziel === 0) {
        setPhase("fertig");
        return;
      }
      setAnzeige(0);
      setPhase("bereit");
      const los = () => {
        stopp = zaehle(0, ziel, setAnzeige, { dauer: DAUER_ERSCHEINEN });
      };
      const el = ref.current;
      if (!el || typeof IntersectionObserver === "undefined") return los();
      io = new IntersectionObserver(
        (eintraege) => {
          if (eintraege.some((e) => e.isIntersecting)) {
            io.disconnect();
            los();
          }
        },
        { threshold: 0.2 }
      );
      io.observe(el);
    });
    const abbrechen = () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      stopp();
    };
    erscheinenAbbrechen.current = abbrechen;
    return abbrechen;
    // nur beim Erscheinen; spätere Wechsel übernimmt der Effekt unten
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Änderung nach dem Laden: kurz zählen bzw. direkt wechseln, mit Hervorhebung.
  useEffect(() => {
    if (erstesMal.current) {
      erstesMal.current = false;
      return undefined;
    }
    const von = vorher.current;
    const nach = wert;
    vorher.current = wert;
    // gleicher Wert (z. B. erneuter Effektlauf im Strict Mode): ein laufendes Hochzählen nicht stören
    if (Object.is(von, nach)) return undefined;
    // Ein noch laufendes oder wartendes Hochzählen auf den alten Wert endet hier (sonst bliebe der alte Endwert stehen).
    erscheinenAbbrechen.current();
    erscheinenAbbrechen.current = () => {};
    const art = wechselArt(von, nach, format);
    let raf = 0;
    let aus = 0;
    let stopp = () => {};
    const markieren = () => {
      setMarkiert(true);
      aus = window.setTimeout(() => setMarkiert(false), 560);
    };
    if (art === "nein") {
      raf = requestAnimationFrame(() => {
        setAnzeige(nach);
        setPhase("fertig");
      });
    } else if (art === "direkt" || kiosk || reduziert()) {
      raf = requestAnimationFrame(() => {
        setAnzeige(nach);
        setPhase("fertig");
        markieren();
      });
    } else {
      raf = requestAnimationFrame(() => {
        setPhase("fertig");
        markieren();
      });
      stopp = zaehle(von, nach, setAnzeige, { dauer: DAUER.draw });
    }
    return () => {
      cancelAnimationFrame(raf);
      stopp();
      window.clearTimeout(aus);
    };
  }, [wert, format, kiosk]);

  const endText = formatiere(wert, format);
  return (
    <span className={className} ref={ref}>
      <span className="bo-zahl tabular-nums" aria-hidden="true" data-markiert={markiert ? "true" : undefined} data-hochzaehlen={phase === "warte" ? "warte" : undefined} aria-live="off">
        {formatiere(anzeige, format)}
      </span>
      <span className="sr-only">{endText}</span>
    </span>
  );
}

/** „Erneut“ im Fehlerfuß einer Kennzahl: lädt die Seite neu (router.refresh). */
export function ErneutKnopf({ children = "Erneut" }) {
  const router = useRouter();
  return (
    <button type="button" onClick={() => router.refresh()} className="rounded-bo-xs font-medium text-bo-text underline decoration-bo-line-strong underline-offset-2 hover:decoration-current">
      {children}
    </button>
  );
}
