"use client";
// Ezarri-Konfigurator – eigenes Beckenfoto als Hintergrund (Runde 4 P5,
// neuland P2-2; Runde 5 neuland P1-3: Perspektive). Optional: Die Kundin
// wählt ein Foto ihres Beckens (oder Bads), darüber liegt das gewählte Mosaik
// als Fläche mit vier ziehbaren Eckpunkten. Die Fläche folgt den Ecken per
// Homographie (src/lib/ezarri/konfigurator/homographie.js: stückweise affin im
// Canvas gezeichnet, in allen Browsern gleich), so
// lässt sich das Mosaik perspektivisch auf Boden oder Wand legen.
// Eine Orientierung, kein Rendering.
//
// Datenschutz: Das Foto bleibt im Browser. Kein Upload, kein Speichern
// (kein localStorage/IndexedDB); es wird nur als Object-URL angezeigt und beim
// Entfernen bzw. Verlassen der Seite freigegeben. Ein Hinweis sagt das klar.
//
// Bedienung (WCAG 2.2 AA): Ecken mit Zeiger/Finger ziehen; jede Ecke ist ein
// Knopf, der mit den Pfeiltasten wandert (Umschalt = große Schritte). Ohne
// Ziehen (2.5.7) gehen Ecke wählen + zwei Schieberegler. Ziele 44 px (2.5.8),
// keine Animation (reduced motion ohne Sonderfall).
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ImagePlus, RotateCcw, Trash2 } from "lucide-react";
import { useKonfCopy } from "./useKonfCopy";

// Welle 2: Eckennamen (homographie.js, deutsch) für die englische Seite.
const ECKE_EN = { ol: "top left", or: "top right", ur: "bottom right", ul: "bottom left" };
import { drawMosaic } from "@/lib/ezarri/konfigurator/preview2d";
import { ECKEN, START_ECKEN, eckeSetzen, inPixel, perspektivischZeichnen } from "@/lib/ezarri/konfigurator/homographie";

const MAX_BYTES = 25 * 1024 * 1024;
const FL_W = 480;
const FL_H = 320;
const START_DECKKRAFT = 80;

function Regler({ label, value, min = 0, max = 100, step = 1, onChange, unit = "%", name }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex justify-between text-small text-text">
        <span>{label}</span>
        <span className="tabular-nums text-text-soft">
          {Math.round(value)}
          {unit}
        </span>
      </label>
      <input
        id={id}
        name={name}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full accent-see"
      />
    </div>
  );
}

export default function EigenesFoto({ state, index }) {
  const { t, en, X } = useKonfCopy();
  const eckeLabel = (e) => (X ? X.ecken[e.key] ?? e.label : en ? ECKE_EN[e.key] ?? e.label : e.label);
  const inputId = useId();
  const hinweisId = useId();
  const tastenId = useId();
  const [foto, setFoto] = useState(null); // { url, name }
  const [fehler, setFehler] = useState("");
  const [ecken, setEcken] = useState(START_ECKEN);
  const [aktiv, setAktiv] = useState(0);
  const [deckkraft, setDeckkraft] = useState(START_DECKKRAFT);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [meldung, setMeldung] = useState("");
  const quelleRef = useRef(null); // Mosaik flach (FL_W×FL_H), nicht im DOM
  const canvasRef = useRef(null); // sichtbare Montage über dem Foto
  const buehneRef = useRef(null);
  const drag = useRef(null);

  // Object-URL freigeben, wenn das Foto wechselt oder die Komponente geht.
  useEffect(() => () => foto?.url && URL.revokeObjectURL(foto.url), [foto]);

  // Größe der Fotofläche messen (für die Pixel-Homographie).
  useEffect(() => {
    const el = buehneRef.current;
    if (!el || !foto) return undefined;
    const messen = () => {
      const r = el.getBoundingClientRect();
      setBox((o) => (Math.abs(o.w - r.width) < 0.5 && Math.abs(o.h - r.height) < 0.5 ? o : { w: r.width, h: r.height }));
    };
    messen();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(messen);
    ro.observe(el);
    return () => ro.disconnect();
  }, [foto]);

  // Mosaik flach zeichnen (im Becken unter 60 cm Wasser, sonst trocken).
  useEffect(() => {
    if (!foto) return;
    const c = quelleRef.current || (quelleRef.current = document.createElement("canvas"));
    c.width = FL_W;
    c.height = FL_H;
    try {
      drawMosaic(c.getContext("2d"), { state, index, width: FL_W, height: FL_H, stonePx: state.format === "50" ? 26 : 14, wasser: state.szene === "pool" || state.szene === "whirlpool" ? 0.6 : null });
    } catch {
      /* Teilkatalog noch unvollständig – nächster Lauf zeichnet */
    }
  }, [foto, state, index]);

  // Montage: flaches Mosaik perspektivisch auf die vier Ecken legen.
  useEffect(() => {
    const c = canvasRef.current;
    const q = quelleRef.current;
    if (!c || !q || !foto || !(box.w > 0) || !(box.h > 0)) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const bw = Math.round(box.w * dpr);
    const bh = Math.round(box.h * dpr);
    if (c.width !== bw || c.height !== bh) {
      c.width = bw;
      c.height = bh;
    }
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, bw, bh);
    perspektivischZeichnen(ctx, q, FL_W, FL_H, inPixel(ecken, box.w, box.h), { dpr });
    // state/index: Der Effekt oben (gleicher Commit, läuft vorher) hat die Quelle neu gezeichnet.
  }, [foto, ecken, box, state, index]);

  const waehlen = useCallback((e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\//.test(file.type)) return setFehler(t("Bitte ein Foto wählen (JPG, PNG, HEIC oder WebP).", "Please choose a photo (JPG, PNG, HEIC or WebP)."));
    if (file.size > MAX_BYTES) return setFehler(t("Das Foto ist größer als 25 MB. Bitte ein kleineres wählen.", "The photo is larger than 25 MB. Please choose a smaller one."));
    setFehler("");
    setEcken(START_ECKEN);
    setDeckkraft(START_DECKKRAFT);
    setAktiv(0);
    setFoto({ url: URL.createObjectURL(file), name: file.name });
  }, [t]);

  const entfernen = () => {
    setFoto(null);
    setFehler("");
    setMeldung("");
  };

  const eckenRef = useRef(ecken);
  useEffect(() => {
    eckenRef.current = ecken;
  }, [ecken]);
  const setzen = useCallback((i, x, y) => {
    const alt = eckenRef.current;
    const neu = eckeSetzen(alt, i, x, y);
    setMeldung(neu === alt ? t("Diese Lage würde die Fläche überkreuzen – die Ecke bleibt, wo sie war.", "This position would cross the area – the corner stays where it was.") : "");
    if (neu !== alt) {
      eckenRef.current = neu;
      setEcken(neu);
    }
  }, [t]);

  const zuruecksetzen = () => {
    setEcken(START_ECKEN);
    setDeckkraft(START_DECKKRAFT);
    setMeldung(t("Fläche zurückgesetzt.", "Area reset."));
  };

  // Ziehen einer Ecke mit Zeiger oder Finger.
  const prozentAus = (e) => {
    const r = buehneRef.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return null;
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };
  const onPointerDown = (i) => (e) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* synthetischer Zeiger ohne Capture – Ziehen geht trotzdem */
    }
    e.currentTarget.focus({ preventScroll: true });
    drag.current = { i, id: e.pointerId };
    setAktiv(i);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const p = prozentAus(e);
    if (p) setzen(d.i, p.x, p.y);
  };
  const onPointerUp = (e) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  const onKeyDown = (i) => (e) => {
    const schritt = e.shiftKey ? 5 : 1;
    const p = ecken[i];
    const ziel = { ArrowLeft: [-schritt, 0], ArrowRight: [schritt, 0], ArrowUp: [0, -schritt], ArrowDown: [0, schritt] }[e.key];
    if (!ziel) return;
    e.preventDefault();
    setAktiv(i);
    setzen(i, p.x + ziel[0], p.y + ziel[1]);
  };

  const a = ecken[aktiv];

  return (
    <div className="space-y-4" data-ezk-eigenes-foto="">
      <p id={hinweisId} className="text-small text-text-soft">
        {t(
          "Legen Sie das Mosaik probeweise über ein Foto Ihres Beckens oder Bads. Das Foto bleibt in Ihrem Browser: Es wird nicht hochgeladen und nicht gespeichert und ist weg, sobald Sie die Seite schließen.",
          "Lay the mosaic over a photo of your pool or bathroom as a trial. The photo stays in your browser: it is not uploaded, not stored, and gone as soon as you close the page."
        )}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={inputId}
          className="inline-flex min-h-12 cursor-pointer items-center gap-2 border border-line-control px-5 text-ui text-text transition-colors duration-(--duration-micro) hover:border-ink focus-within:outline-2 focus-within:outline-offset-2"
        >
          <ImagePlus aria-hidden="true" className="size-4" strokeWidth={1.5} />
          {foto ? t("Anderes Foto wählen", "Choose another photo") : t("Eigenes Foto wählen", "Choose your own photo")}
          <input id={inputId} type="file" accept="image/*" className="sr-only" aria-describedby={hinweisId} onChange={waehlen} />
        </label>
        {foto && (
          <>
            <button type="button" onClick={zuruecksetzen} className="inline-flex min-h-12 items-center gap-2 px-2 text-ui text-text underline decoration-line-strong underline-offset-4">
              <RotateCcw aria-hidden="true" className="size-4" strokeWidth={1.5} />
              {t("Fläche zurücksetzen", "Reset area")}
            </button>
            <button type="button" onClick={entfernen} className="inline-flex min-h-12 items-center gap-2 px-2 text-ui text-text underline decoration-line-strong underline-offset-4">
              <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.5} />
              {t("Foto entfernen", "Remove photo")}
            </button>
          </>
        )}
      </div>
      <p role="status" aria-live="polite" className={fehler || meldung ? "text-small text-text" : "sr-only"} data-ezk-foto-status="">
        {fehler || meldung || (foto ? t("Foto geladen. Ziehen Sie die vier Ecken der Mosaikfläche auf die Ecken von Boden oder Wand.", "Photo loaded. Drag the four corners of the mosaic area onto the corners of the floor or wall.") : "")}
      </p>

      {foto && (
        <>
          <figure className="m-0">
            <div ref={buehneRef} className="relative overflow-hidden bg-linen" data-ezk-foto-buehne="">
              {/* eslint-disable-next-line @next/next/no-img-element -- lokales Object-URL-Foto, kein next/image */}
              <img src={foto.url} alt={t("Ihr Foto (nur in diesem Browser)", "Your photo (only in this browser)")} className="block h-auto w-full select-none" draggable={false} />
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 block size-full"
                style={{ opacity: deckkraft / 100, mixBlendMode: "multiply" }}
                aria-hidden="true"
                data-ezk-foto-flaeche=""
              />
              <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <polygon points={ecken.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="white" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeDasharray="6 4" />
              </svg>
              {ECKEN.map((ecke, i) => {
                const p = ecken[i];
                return (
                  <button
                    key={ecke.key}
                    type="button"
                    data-ezk-ecke={ecke.key}
                    aria-label={t(`Ecke ${ecke.label}: ${Math.round(p.x)} % von links, ${Math.round(p.y)} % von oben`, `Corner ${eckeLabel(ecke)}: ${Math.round(p.x)} % from the left, ${Math.round(p.y)} % from the top`, "foto.ecke", { ecke: eckeLabel(ecke), x: Math.round(p.x), y: Math.round(p.y) })}
                    aria-describedby={tastenId}
                    aria-pressed={aktiv === i}
                    onClick={() => setAktiv(i)}
                    onPointerDown={onPointerDown(i)}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    onKeyDown={onKeyDown(i)}
                    className="absolute flex size-11 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper active:cursor-grabbing"
                    style={{ left: `${p.x}%`, top: `${p.y}%`, touchAction: "none" }}
                  >
                    <span
                      aria-hidden="true"
                      className={`block size-5 rounded-full border-2 border-paper shadow-[0_0_0_1.5px_rgb(0_0_0/0.6)] ${aktiv === i ? "bg-see" : "bg-ink/70"}`}
                    />
                  </button>
                );
              })}
            </div>
            <figcaption className="mt-2 text-small text-text-soft">
              {t(
                "Fotomontage zur Orientierung, kein Rendering: Licht und Farben weichen ab. Die echten Farben zeigen wir Ihnen am Muster in Lochau.",
                "Photo montage for orientation, not a rendering: light and colours differ. We show you the real colours on the sample in Lochau."
              )}
            </figcaption>
          </figure>
          <p id={tastenId} className="text-small text-text-soft">
            {t(
              "Ecken ziehen oder antippen und mit den Pfeiltasten verschieben (mit Umschalt in großen Schritten). Ohne Ziehen: Ecke unten wählen und mit den Reglern setzen.",
              "Drag or tap the corners and move them with the arrow keys (with Shift in large steps). Without dragging: choose a corner below and set it with the sliders."
            )}
          </p>
          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-2 text-small text-text">{t("Ecke wählen", "Choose a corner")}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ECKEN.map((ecke, i) => (
                <label key={ecke.key} className="inline-flex min-h-11 cursor-pointer items-center gap-2 border border-line-control px-3 text-small text-text has-checked:border-ink">
                  <input type="radio" name="ezk-ecke" value={ecke.key} checked={aktiv === i} onChange={() => setAktiv(i)} className="accent-see" />
                  {eckeLabel(ecke)}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            <Regler label={t(`Ecke ${ECKEN[aktiv].label} – waagrecht`, `Corner ${eckeLabel(ECKEN[aktiv])} – horizontal`, "foto.eckeX", { ecke: eckeLabel(ECKEN[aktiv]) })} name="ezk-ecke-x" value={a.x} onChange={(v) => setzen(aktiv, v, a.y)} />
            <Regler label={t(`Ecke ${ECKEN[aktiv].label} – senkrecht`, `Corner ${eckeLabel(ECKEN[aktiv])} – vertical`, "foto.eckeY", { ecke: eckeLabel(ECKEN[aktiv]) })} name="ezk-ecke-y" value={a.y} onChange={(v) => setzen(aktiv, a.x, v)} />
            <Regler label={t("Deckkraft", "Opacity")} name="ezk-deckkraft" value={deckkraft} min={20} max={100} onChange={setDeckkraft} />
          </div>
        </>
      )}
    </div>
  );
}
