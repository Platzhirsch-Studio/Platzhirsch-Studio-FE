"use client";
// 3D-Ansicht des Raum-Zwillings (nur Client, per next/dynamic geladen).
// Canvas ist aria-hidden; alles Wichtige gibt es zusätzlich als Liste,
// Tabelle und Standbilder neben der Ansicht. Beschriftungen und Kommentar-
// Punkte sind echte Buttons über dem Canvas (Tab-Reihenfolge, Fokus sichtbar).
import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { SplatSzene } from "./SplatSzene";
import { ladeSog } from "./sogLaden";

const RM = "(prefers-reduced-motion: reduce)";

function RaumViewer(
  { basis, transform, volumen = [], auswahl, kommentare = [], ebenen = { raum: true, planung: true }, standpunkte = [], markierungen = [], pickAktiv = false, onPick, onBereit, onFehler, onPinKlick, onVolumenKlick, hoehe = "min(68vh, 640px)", label = "3D-Ansicht Ihres Raums" },
  ref
) {
  const box = useRef(null);
  const szene = useRef(null);
  const [status, setStatus] = useState({ art: "laedt", anteil: 0 });
  // Bildschirmpositionen der Beschriftungen/Punkte: nach jedem gezeichneten Bild
  // im Callback der Szene berechnet (nicht während des Renderns).
  const [overlay, setOverlay] = useState({ labels: [], pins: [] });
  const cb = useRef({});
  const daten = useRef({ volumen, kommentare, ebenen });
  useEffect(() => {
    cb.current = { onPick, onBereit, onFehler, pickAktiv };
  });
  useEffect(() => {
    daten.current = { volumen, kommentare, ebenen };
    szene.current?.anfordern(false); // neu zeichnen → Overlay neu berechnen
  }, [volumen, kommentare, ebenen]);

  function berechneOverlay(sz) {
    const { volumen: vs, kommentare: ks, ebenen: eb } = daten.current;
    const labels = eb.planung ? vs.map((v) => ({ v, p: sz.projiziere([v.x, (v.y || 0) + v.h / 100 + 0.08, v.z]) })).filter((x) => x.p.sichtbar) : [];
    const pins = ks
      .filter((k) => k.punkt)
      .map((k, i) => ({ k, n: i + 1, p: sz.projiziere(k.punkt) }))
      .filter((x) => x.p.sichtbar);
    setOverlay({ labels, pins });
  }

  useImperativeHandle(ref, () => ({
    geheZu: (sp) => szene.current?.geheZu(sp.auge, sp.ziel),
    uebersicht: () => szene.current?.uebersicht(),
    projiziere: (p) => szene.current?.projiziere(p),
  }));

  useEffect(() => {
    let aus = false;
    const ctrl = new AbortController();
    const reduziert = window.matchMedia(RM).matches;
    let s;
    try {
      s = new SplatSzene(box.current, { reduzierteBewegung: reduziert, onChange: () => s && s.splats && berechneOverlay(s) });
    } catch (err) {
      queueMicrotask(() => {
        setStatus({ art: "fehler" });
        cb.current.onFehler?.(err);
      });
      return undefined;
    }
    szene.current = s;
    ladeSog(basis, (a) => !aus && setStatus({ art: "laedt", anteil: a }), ctrl.signal)
      .then((daten) => {
        if (aus) return;
        s.setzeSplats(daten);
        setStatus({ art: "bereit" });
        cb.current.onBereit?.(daten.anzahl);
      })
      .catch((err) => {
        if (aus || err.name === "AbortError") return;
        setStatus({ art: "fehler" });
        cb.current.onFehler?.(err);
      });
    return () => {
      aus = true;
      ctrl.abort();
      s.zerstoere();
      szene.current = null;
    };
  }, [basis]);

  // Transform + Startansicht
  const erster = useRef(true);
  useEffect(() => {
    const s = szene.current;
    if (!s || status.art !== "bereit") return;
    s.setzeTransform(transform || null);
    if (erster.current) {
      erster.current = false;
      if (transform && standpunkte[0]) s.geheZu(standpunkte[0].auge, standpunkte[0].ziel);
      else s.uebersicht();
    }
  }, [transform, status.art, standpunkte]);

  useEffect(() => {
    szene.current?.setzeVolumen(volumen, auswahl);
  }, [volumen, auswahl, status.art]);

  useEffect(() => {
    szene.current?.sichtbarkeit(ebenen);
  }, [ebenen, status.art]);

  useEffect(() => {
    szene.current?.setzeMarkierungen(markierungen);
  }, [markierungen, status.art]);

  // Klick = Punkt wählen (nur ohne Ziehen, nur im Pick-Modus)
  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    let start = null;
    const down = (e) => (start = { x: e.clientX, y: e.clientY, t: performance.now() });
    const up = (e) => {
      if (!start || !cb.current.pickAktiv) return;
      const bewegt = Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6 || performance.now() - start.t > 600;
      start = null;
      if (bewegt || e.target.closest?.("button")) return;
      const p = szene.current?.picke(e.clientX, e.clientY);
      cb.current.onPick?.(p);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
    };
  }, []);

  const bereit = status.art === "bereit";
  const beschriftungen = bereit ? overlay.labels : [];
  const pins = bereit ? overlay.pins : [];

  return (
    <div className="relative w-full overflow-hidden border border-ink/15 bg-stone" style={{ height: hoehe }}>
      <div
        ref={box}
        className={`absolute inset-0 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink ${pickAktiv ? "cursor-crosshair" : "cursor-grab"}`}
        tabIndex={0}
        role="application"
        aria-roledescription="3D-Ansicht"
        aria-label={`${label}. Pfeiltasten links und rechts: umsehen. Pfeiltasten hoch und runter: gehen. Alle Inhalte stehen auch in der Liste unter der Ansicht.`}
        onKeyDown={(e) => {
          if (szene.current?.taste(e.key)) e.preventDefault();
        }}
      />
      {status.art === "laedt" && (
        <div className="absolute inset-0 grid place-items-center bg-stone/80" role="status">
          <div className="w-56 text-center text-sm text-ink">
            <p>Raum wird geladen …</p>
            <div className="mt-3 h-1 w-full bg-ink/10" aria-hidden="true">
              <div className="h-1 bg-ink transition-[width] motion-reduce:transition-none" style={{ width: `${Math.round(status.anteil * 100)}%` }} />
            </div>
          </div>
        </div>
      )}
      {beschriftungen.map(({ v, p }) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onVolumenKlick?.(v.id)}
          className={`absolute z-10 min-h-6 -translate-x-1/2 -translate-y-full whitespace-nowrap border px-2 py-0.5 text-[11px] font-semibold leading-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
            v.id === auswahl ? "border-ink bg-ink text-white" : "border-ink/20 bg-paper/95 text-ink"
          }`}
          style={{ left: p.x, top: p.y }}
          aria-label={`${v.marke ? `${v.marke} ` : ""}${v.name}, Breite ${Math.round(v.w)}, Tiefe ${Math.round(v.d)}, Höhe ${Math.round(v.h)} Zentimeter`}
        >
          {v.name} · {Math.round(v.w)} × {Math.round(v.d)} × {Math.round(v.h)}
        </button>
      ))}
      {pins.map(({ k, n, p }) => (
        <button
          key={k.id}
          type="button"
          onClick={() => onPinKlick?.(k.id)}
          className={`absolute z-20 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-paper text-xs font-semibold shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
            k.rolle === "team" ? "bg-walnut text-paper" : "bg-ink text-white"
          }`}
          style={{ left: p.x, top: p.y }}
          aria-label={`Kommentar ${n} von ${k.autor}: ${k.text || "Sprachnachricht"}`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default forwardRef(RaumViewer);
