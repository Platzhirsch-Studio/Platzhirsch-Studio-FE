"use client";
// Prototyp „Die Linie wird Raum“ – Bodensee-Licht als Stimmung der Seite.
//
// Wiederverwendet die Rechnung von /de/bodensee-licht (Neuland N4):
// sonnenstand() (NOAA, src/lib/licht/sonne.js), lichtWerte()/phase()
// (src/lib/licht/himmel.js) und den Studio-Ort aus src/lib/licht/orte.json
// (Lochau, 47,53 N / 9,75 E). Keine API, keine Ortung: Uhrzeit des Besuchs
// in Europe/Vienna, Rechnung im Browser, Neuberechnung jede Minute.
//
// Wirkung (nur Farbe, nie Kontrast): eine Tönung des Papiers (max. 14 %
// Beimischung, Texte bleiben Tinte – Kontrast geprüft, siehe README), die
// Himmelsfarben im Fenster des Modells und ein Sonnenfleck auf dem
// Modellboden, wenn die Sonne durch das (Südwest-)Fenster fiele.
// Für QA: ?licht=HH:MM und ?datum=YYYY-MM-DD.
import { useEffect, useState } from "react";
import { fensterSonne, parseDatum, sonnenstand } from "@/lib/licht/sonne";
import { lichtWerte, kelvinZuRgb } from "@/lib/licht/himmel";
import { heute, ortNachId, parseZeit } from "@/lib/licht/zustand";

const FENSTER = 225; // Modellfenster schaut nach Südwesten (wie die Bodensee-Licht-Standardszene)

// Tönung je Phase: Farbe und Anteil der Beimischung ins Papier (#faf8f4).
// Alle Werte so gewählt, dass --color-text-soft (#5c636a) ≥ 4,5:1 bleibt.
const TOENUNG = {
  tag: { mix: 5 },
  gold: { farbe: "#f2b27a", mix: 14 },
  blau: { farbe: "#8ea3c4", mix: 13 },
  daemmerung: { farbe: "#7f8fae", mix: 13 },
  nacht: { farbe: "#6f7d99", mix: 12 },
};

function wienJetzt(now = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Vienna", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(now)
      .map((x) => [x.type, x.value]),
  );
  return Number(p.hour) * 60 + Number(p.minute);
}

const hhmm = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;

export function berechneStimmung({ datum, minuten }) {
  const ort = ortNachId("lochau");
  const sonne = sonnenstand(ort, datum, minuten);
  const licht = lichtWerte(sonne.hoehe);
  const id = licht.phase.id;
  const t = TOENUNG[id] || TOENUNG.tag;
  const rgb = kelvinZuRgb(licht.sonne.kelvin);
  const farbe = t.farbe || `rgb(${Math.round(rgb.r * 255)} ${Math.round(rgb.g * 255)} ${Math.round(rgb.b * 255)})`;
  const fenster = fensterSonne(sonne, { azimut: FENSTER });
  return {
    id,
    phase: licht.phase.name,
    hoehe: Math.round(sonne.hoehe),
    vars: {
      "--u-wash": farbe,
      "--u-mix": `${t.mix}%`,
      "--u-sky-top": licht.himmel.oben,
      "--u-sky-h": licht.himmel.horizont,
      "--u-sun": fenster.scheint ? (0.25 + 0.6 * licht.sonne.staerke).toFixed(3) : "0",
      "--u-sun-skew": `${Math.max(-50, Math.min(50, -(fenster.relativ || 0) * 0.8)).toFixed(1)}deg`,
      "--u-sun-len": fenster.scheint ? Math.min(1.6, Math.max(0.3, fenster.tiefeMax / 3)).toFixed(3) : "0",
      "--u-sun-color": licht.sonne.farbe,
    },
  };
}

export default function LichtStimmung({ fallback }) {
  const [text, setText] = useState(null);

  useEffect(() => {
    const root = document.querySelector("[data-unikat]");
    if (!root) return undefined;
    const q = new URLSearchParams(window.location.search);
    const fixZeit = parseZeit(q.get("licht"));
    const fixDatum = parseDatum(q.get("datum")) ? q.get("datum") : null;
    const apply = () => {
      const datum = fixDatum || heute();
      const minuten = fixZeit ?? wienJetzt();
      let st;
      try {
        st = berechneStimmung({ datum, minuten });
      } catch {
        return;
      }
      for (const [k, v] of Object.entries(st.vars)) root.style.setProperty(k, v);
      root.dataset.licht = st.id;
      const lage = st.hoehe >= 0 ? `Sonne ${st.hoehe}° über dem Horizont` : `Sonne ${-st.hoehe}° unter dem Horizont`;
      setText(`Lochau, ${hhmm(minuten)} Uhr · ${lage} · ${st.phase}`);
    };
    apply();
    const timer = fixZeit == null ? setInterval(apply, 60_000) : null;
    return () => timer && clearInterval(timer);
  }, []);

  return (
    <span data-licht-text="" aria-live="off">
      {text || fallback}
    </span>
  );
}
