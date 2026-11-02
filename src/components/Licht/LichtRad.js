"use client";
// Bodensee-Licht (N4) – Bedienelement „Lichtrad“: Ort, Fensterrichtung, Datum,
// Uhrzeit. Nur native Elemente (select, input range/date/number, button),
// keine eigene Gestensteuerung. Jeder Regler ist beschriftet und nennt seinen
// Wert als Text (aria-valuetext), z. B. „8:30 Uhr, Sonne 9° über dem Horizont,
// aus Südosten“.
//
// Einbau in andere Planer (5–10 Zeilen):
//   import LichtRad from "@/components/Licht/LichtRad";
//   import { standardZustand } from "@/lib/licht/zustand";
//   const [licht, setLicht] = useState(() => standardZustand());
//   <LichtRad wert={licht} onChange={setLicht} />
//   … und in der Szene <SonnenLicht zustand={licht} /> (useSonnenlicht.js)
//
// „Tag abspielen“ läuft nur auf Knopfdruck, ist jederzeit anhaltbar und fehlt
// bei prefers-reduced-motion (dann nur Sprünge beim Ziehen).
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { himmelsrichtung, sonnenstand, sonnenTag, uhrzeit } from "@/lib/licht/sonne";
import { GRENZEN, heute, LAENDER, ORTE, ortVon, werttext } from "@/lib/licht/zustand";
import { Kompass } from "./SonnenBahn";
import css from "./licht.module.css";

const FENSTER_SCHNELL = [
  { grad: 90, label: "O" },
  { grad: 135, label: "SO" },
  { grad: 180, label: "S" },
  { grad: 225, label: "SW" },
  { grad: 270, label: "W" },
];

const STICHTAGE = (jahr) => [
  { datum: `${jahr}-03-20`, label: "20. März" },
  { datum: `${jahr}-06-21`, label: "21. Juni" },
  { datum: `${jahr}-09-23`, label: "23. Sept." },
  { datum: `${jahr}-12-21`, label: "21. Dez." },
];

const mqReduce = typeof window !== "undefined" ? window.matchMedia?.("(prefers-reduced-motion: reduce)") : null;
const subscribeReduce = (cb) => {
  mqReduce?.addEventListener?.("change", cb);
  return () => mqReduce?.removeEventListener?.("change", cb);
};
/** prefers-reduced-motion als Hook (Server: false). */
export function useReduzierteBewegung() {
  return useSyncExternalStore(
    subscribeReduce,
    () => !!mqReduce?.matches,
    () => false,
  );
}

const gruppen = Object.entries(LAENDER).map(([land, name]) => ({ land, name, orte: ORTE.filter((o) => o.land === land) }));

const knopf =
  "inline-flex min-h-11 min-w-11 items-center justify-center border border-pebble px-3 text-small font-medium text-ink transition-colors duration-(--duration-micro) hover:border-ink hover:bg-stone aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper disabled:opacity-50";
const feld = "min-h-12 w-full border border-pebble bg-paper px-3 text-ui text-ink";
const labelCls = "block text-small font-medium text-ink";

/**
 * Props
 *   wert       Lichtzustand { ort, lat, lon, fenster, datum, minuten, szene }
 *   onChange   (neuerZustand) => void
 *   fensterLabel  Beschriftung der Richtung (Standard „Fensterrichtung“)
 *   kompakt    true = ohne Stichtag-Knöpfe und Kompass (für enge Planer-Seitenleisten)
 *   ansage     true = ruhige Live-Ansage nach Änderungen außerhalb des Uhrzeit-Reglers
 */
export default function LichtRad({ wert, onChange, fensterLabel = "Fensterrichtung", fensterHinweis = "Wohin schaut das Fenster nach draußen?", kompakt = false, ansage = true }) {
  const id = useId();
  const reduziert = useReduzierteBewegung();
  const [laeuft, setLaeuft] = useState(false);
  const [eigene, setEigene] = useState(wert.ort == null);
  const [ansageText, setAnsageText] = useState("");
  const wertRef = useRef(wert);
  useEffect(() => {
    wertRef.current = wert;
  }, [wert]);

  const ort = ortVon(wert);
  const sonne = useMemo(() => sonnenstand(ort, wert.datum, wert.minuten), [ort.lat, ort.lon, wert.datum, wert.minuten]); // eslint-disable-line react-hooks/exhaustive-deps
  const tag = useMemo(() => sonnenTag(ort, wert.datum), [ort.lat, ort.lon, wert.datum]); // eslint-disable-line react-hooks/exhaustive-deps
  const text = werttext(sonne, wert.minuten);
  const jahr = Number(wert.datum.slice(0, 4));

  const setze = (teil, ansagen = true) => {
    const neu = { ...wertRef.current, ...teil };
    onChange(neu);
    if (ansagen && ansage) {
      const s = sonnenstand(ortVon(neu), neu.datum, neu.minuten);
      setAnsageText(werttext(s, neu.minuten));
    }
  };

  // Tag abspielen: 10-Minuten-Schritte von Aufgang −30 bis Untergang +30
  useEffect(() => {
    if (!laeuft || reduziert) return undefined;
    const start = (tag.aufgang ?? 360) - 30;
    const ende = (tag.untergang ?? 1080) + 30;
    let m = wertRef.current.minuten < start || wertRef.current.minuten >= ende ? start : wertRef.current.minuten;
    const t = setInterval(() => {
      m += 10;
      if (m > ende) {
        setLaeuft(false);
        return;
      }
      onChange({ ...wertRef.current, minuten: Math.round(m / 5) * 5 });
    }, 110);
    return () => clearInterval(t);
  }, [laeuft, reduziert, tag.aufgang, tag.untergang, onChange]);

  const stoppe = () => setLaeuft(false);
  const runde5 = (m) => Math.min(1435, Math.max(0, Math.round(m / 5) * 5));
  const jetzt = () => {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("de-AT", { timeZone: "Europe/Vienna", hour: "numeric", minute: "numeric", hourCycle: "h23" })
        .formatToParts(new Date())
        .map((x) => [x.type, x.value]),
    );
    stoppe();
    setze({ datum: heute(), minuten: runde5(+p.hour * 60 + +p.minute) });
  };

  const fensterText = `${himmelsrichtung(wert.fenster).adj}, ${wert.fenster}°`;

  return (
    <div className="space-y-6" data-lichtrad="">
      {/* Ort */}
      <div>
        <label htmlFor={`${id}-ort`} className={labelCls}>
          Ort
        </label>
        <select
          id={`${id}-ort`}
          className={`${feld} mt-2`}
          value={eigene ? "__eigene" : wert.ort || ""}
          onChange={(e) => {
            stoppe();
            if (e.target.value === "__eigene") {
              setEigene(true);
              setze({ ort: null, lat: ort.lat, lon: ort.lon });
            } else {
              setEigene(false);
              setze({ ort: e.target.value, lat: null, lon: null });
            }
          }}
        >
          {gruppen.map((g) => (
            <optgroup key={g.land} label={g.name}>
              {g.orte.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </optgroup>
          ))}
          <option value="__eigene">Eigene Koordinaten …</option>
        </select>
        {eigene ? <Koordinaten wert={wert} onSetze={setze} id={id} /> : null}
        <p className="mt-2 text-small text-ink-soft">Ohne Standortabfrage: Die Liste liegt auf dieser Seite, nichts wird gesendet.</p>
      </div>

      {/* Fensterrichtung */}
      <div>
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <label htmlFor={`${id}-fenster`} className={labelCls}>
              {fensterLabel}
            </label>
            <p id={`${id}-fenster-hinweis`} className="mt-1 text-small text-ink-soft">
              {fensterHinweis}
            </p>
            <p className="mt-2 text-ui tabular-nums" aria-hidden="true">
              {fensterText}
            </p>
          </div>
          {!kompakt ? <Kompass fenster={wert.fenster} sonne={sonne} groesse={96} /> : null}
        </div>
        <input
          id={`${id}-fenster`}
          type="range"
          min={0}
          max={355}
          step={5}
          value={wert.fenster}
          aria-describedby={`${id}-fenster-hinweis`}
          aria-valuetext={`${himmelsrichtung(wert.fenster).name}, ${wert.fenster} Grad`}
          onChange={(e) => setze({ fenster: Number(e.target.value) }, false)}
          className={`${css.range} mt-3 w-full`}
        />
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`${fensterLabel} schnell wählen`}>
          {FENSTER_SCHNELL.map((f) => (
            <button key={f.grad} type="button" className={knopf} aria-pressed={wert.fenster === f.grad} onClick={() => setze({ fenster: f.grad })}>
              <span aria-hidden="true">{f.label}</span>
              <span className="sr-only">{himmelsrichtung(f.grad).name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Datum */}
      <div>
        <label htmlFor={`${id}-datum`} className={labelCls}>
          Datum
        </label>
        <input
          id={`${id}-datum`}
          type="date"
          min="1900-01-01"
          max="2099-12-31"
          className={`${feld} mt-2 tabular-nums`}
          value={wert.datum}
          onChange={(e) => {
            if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) setze({ datum: e.target.value });
          }}
        />
        {!kompakt ? (
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Stichtage">
            {STICHTAGE(jahr).map((s) => (
              <button key={s.datum} type="button" className={knopf} aria-pressed={wert.datum === s.datum} onClick={() => setze({ datum: s.datum })}>
                {s.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Uhrzeit */}
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={`${id}-zeit`} className={labelCls}>
            Uhrzeit
          </label>
          <span className="text-small text-ink-soft tabular-nums">{tag.sommerzeit ? "Sommerzeit (MESZ)" : "Winterzeit (MEZ)"}</span>
        </div>
        <output htmlFor={`${id}-zeit`} className="mt-2 block text-ui text-ink tabular-nums" data-werttext="">
          {text}
        </output>
        <input
          id={`${id}-zeit`}
          type="range"
          min={0}
          max={1435}
          step={5}
          value={wert.minuten}
          aria-valuetext={text}
          onChange={(e) => {
            stoppe();
            setze({ minuten: Number(e.target.value) }, false);
          }}
          className={`${css.range} mt-3 w-full`}
        />
        <div className="mt-1 flex justify-between text-small text-ink-soft tabular-nums" aria-hidden="true">
          <span>0 Uhr</span>
          <span>12 Uhr</span>
          <span>24 Uhr</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Uhrzeit springen">
          {tag.aufgang != null ? (
            <button type="button" className={knopf} onClick={() => (stoppe(), setze({ minuten: runde5(tag.aufgang + 5) }))}>
              Aufgang {uhrzeit(tag.aufgang)}
            </button>
          ) : null}
          <button type="button" className={knopf} onClick={() => (stoppe(), setze({ minuten: runde5(tag.mittag) }))}>
            Mittag {uhrzeit(tag.mittag)}
          </button>
          {tag.untergang != null ? (
            <button type="button" className={knopf} onClick={() => (stoppe(), setze({ minuten: runde5(tag.untergang - 5) }))}>
              Untergang {uhrzeit(tag.untergang)}
            </button>
          ) : null}
          <button type="button" className={knopf} onClick={jetzt}>
            Jetzt
          </button>
        </div>
        <div className="mt-4">
          {reduziert ? (
            <p className="text-small text-ink-soft" data-kein-autolauf="">
              Ihr Gerät wünscht wenig Bewegung. Deshalb läuft der Tag nicht automatisch ab. Ziehen Sie den Regler oder nutzen Sie die Pfeiltasten.
            </p>
          ) : (
            <button
              type="button"
              className="inline-flex min-h-12 items-center gap-2 bg-ink px-5 text-ui text-paper transition-colors duration-(--duration-micro) hover:bg-ink-deep"
              aria-pressed={laeuft}
              onClick={() => setLaeuft((v) => !v)}
              data-abspielen=""
            >
              {laeuft ? "Anhalten" : "Tag abspielen"}
            </button>
          )}
        </div>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {ansageText}
      </p>
    </div>
  );
}

function Koordinaten({ wert, onSetze, id }) {
  const [lat, setLat] = useState(String(wert.lat ?? "").replace(".", ","));
  const [lon, setLon] = useState(String(wert.lon ?? "").replace(".", ","));
  const [fehler, setFehler] = useState("");
  const pruefe = (a, b) => {
    const la = Number(String(a).replace(",", "."));
    const lo = Number(String(b).replace(",", "."));
    if (!Number.isFinite(la) || !Number.isFinite(lo) || la < GRENZEN.lat[0] || la > GRENZEN.lat[1] || lo < GRENZEN.lon[0] || lo > GRENZEN.lon[1]) {
      setFehler(`Bitte Breite zwischen ${GRENZEN.lat[0]} und ${GRENZEN.lat[1]} und Länge zwischen ${GRENZEN.lon[0]} und ${GRENZEN.lon[1]} eingeben (Dezimalgrad).`);
      return;
    }
    setFehler("");
    onSetze({ ort: null, lat: Math.round(la * 1e4) / 1e4, lon: Math.round(lo * 1e4) / 1e4 });
  };
  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      <div>
        <label htmlFor={`${id}-lat`} className={labelCls}>
          Breite (° N)
        </label>
        <input id={`${id}-lat`} inputMode="decimal" className={`${feld} mt-1 tabular-nums`} value={lat} onChange={(e) => setLat(e.target.value)} onBlur={() => pruefe(lat, lon)} aria-describedby={fehler ? `${id}-koord-fehler` : undefined} aria-invalid={!!fehler} />
      </div>
      <div>
        <label htmlFor={`${id}-lon`} className={labelCls}>
          Länge (° O)
        </label>
        <input id={`${id}-lon`} inputMode="decimal" className={`${feld} mt-1 tabular-nums`} value={lon} onChange={(e) => setLon(e.target.value)} onBlur={() => pruefe(lat, lon)} aria-describedby={fehler ? `${id}-koord-fehler` : undefined} aria-invalid={!!fehler} />
      </div>
      {fehler ? (
        <p id={`${id}-koord-fehler`} className="col-span-2 text-small text-error" role="alert">
          <span aria-hidden="true">⚠ </span>
          {fehler}
        </p>
      ) : null}
    </div>
  );
}
