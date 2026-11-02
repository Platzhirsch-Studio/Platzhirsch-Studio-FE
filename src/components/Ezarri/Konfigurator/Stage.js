"use client";
// Ezarri-Konfigurator – Bühne: 2D-Vorschau sofort, 3D lazy (Desktop ≥ 1024 px ohne
// „Daten sparen“ automatisch bei Sichtbarkeit, sonst per Knopf), Rückfall ohne WebGL
// bzw. bei Kontextverlust, Tastatur (Pfeile drehen, +/− zoomen), Touch-Sperre gegen
// Scroll-Falle, Vorher/Nachher mit ziehbarer Teilung, Kamerapunkte.
// Mobil (QM R2 P2-1): nach der ersten Nutzeraktion startet 3D von selbst (WebGL 2, ohne
// „Daten sparen“, ohne reduzierte Bewegung); bis dahin bzw. ohne 3D zeigt die Bühne statt der
// Draufsicht die eingefärbte Szenen-Vorschau (PosterVorschau), solange die Szene passt.
import { Component, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
// QM-Endabnahme 02.11.2026: Icon „X“ → CloseIcon; „X“ aus useKonfCopy (FR/IT-Texte, DE/EN null) überdeckte es.
import { Hand, Minus, Plus, Redo2, Undo2, SplitSquareHorizontal, X as CloseIcon, Box, Map as MapIcon, Camera } from "lucide-react";
import Preview2D from "./Preview2D";
import PosterVorschau, { posterPasst } from "./PosterVorschau";
import { Choice } from "./controls";
import { useKonfCopy } from "./useKonfCopy";
import { buehnenPresets } from "./kamera";
import FotoAnsicht from "./FotoAnsicht";
import { fotoansicht, renderFuer, FOTO_HINWEIS } from "@/lib/ezarri/konfigurator/renders";

const Stage3D = dynamic(() => import("./Stage3D"), { ssr: false, loading: () => null });

class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2"));
  } catch {
    return false;
  }
}

const FOTO_VIEW_LABEL = {
  de: { hero: "Übersicht", wasserlinie: "Wasserlinie", draufsicht: "Draufsicht" },
  en: { hero: "Overview", wasserlinie: "Waterline", draufsicht: "Top view" },
};
const FOTO_LICHT_LABEL = {
  de: { morgen: "Morgen", abend: "Abend" },
  en: { morgen: "Morning", abend: "Evening" },
};

const btn =
  "ph-press inline-flex min-h-11 min-w-11 items-center justify-center gap-2 bg-paper/95 px-3 text-ui text-text transition-colors duration-(--duration-micro) hover:bg-stone aria-pressed:bg-ink aria-pressed:text-paper aria-pressed:hover:bg-ink disabled:opacity-45 disabled:cursor-not-allowed";

export default function Stage({ state, index, vorher, split, onSplit, onKamera, onUndo, onRedo, canUndo, canRedo, onVorher, reducedMotion, apiRef, onMode, poster = null, posterDaten = null, aktion = "" }) {
  const { AKTIONEN, KAMERA_LABEL, t, en, X } = useKonfCopy();
  // FR/IT: Fotoansicht-Texte aus X (vom Server)
  const fotoHinweisText = X?.fotoHinweis ?? (en ? FOTO_HINWEIS.en : FOTO_HINWEIS.de);
  const fotoViewLabel = X?.fotoView ?? FOTO_VIEW_LABEL[en ? "en" : "de"];
  const fotoLichtLabel = X?.fotoLicht ?? FOTO_LICHT_LABEL[en ? "en" : "de"];
  const wrap = useRef(null);
  const [gl, setGl] = useState(null); // null = unbekannt, true/false
  const [want3d, setWant3d] = useState(false);
  const [ready3d, setReady3d] = useState(false);
  // Poster bleibt liegen, bis die 3D-Bühne darüber vollständig eingeblendet ist (kein Blitz)
  const [ueberblendet, setUeberblendet] = useState(false);
  const [lost, setLost] = useState(false);
  const [view, setView] = useState("3d");
  const [touch, setTouch] = useState(false);
  const [locked, setLocked] = useState(true);
  // Fotoansicht (vorgerenderte Visualisierung, nur Einzelfarbe 25 mm, Standardfuge)
  const [foto, setFoto] = useState(false);
  const [fotoView, setFotoView] = useState("hero");
  const [fotoLicht, setFotoLicht] = useState("morgen");
  const [fotoHinweis, setFotoHinweis] = useState(false);
  const fotoRef = state.mix?.length === 1 && index ? index.resolveRef(state.mix[0].id, state.format, { ref: state.mix[0].ref }) : null;
  const fotoInfo = fotoansicht(state, fotoRef);
  const fotoAktiv = foto && fotoInfo.ok && !vorher;
  const fotoRender = fotoAktiv ? renderFuer(fotoInfo.refId, fotoView, fotoLicht, fotoRef?.kol) : null;
  useEffect(() => {
    if (!fotoHinweis) return undefined;
    const id = setTimeout(() => setFotoHinweis(false), 5000);
    return () => clearTimeout(id);
  }, [fotoHinweis]);

  useEffect(() => {
    const ok = webglAvailable();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- WebGL/Zeiger erst im Browser prüfbar (einmal nach dem Mount)
    setGl(ok);
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    setTouch(Boolean(coarse));
    setLocked(Boolean(coarse));
    if (!ok) return undefined;
    const wide = window.matchMedia?.("(min-width: 1024px)").matches;
    const save = navigator.connection?.saveData;
    if (!wide || save) return undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= 0.3) {
          setWant3d(true);
          io.disconnect();
        }
      },
      { threshold: [0, 0.3] },
    );
    if (wrap.current) io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  // Erste Nutzeraktion (Auswahl, Rezept, Reiter …) startet 3D von selbst
  const ersteAktion = useRef(aktion);
  useEffect(() => {
    if (want3d || gl !== true || aktion === ersteAktion.current) return;
    if (navigator.connection?.saveData || reducedMotion) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Start auf Nutzeraktion, nicht beim Rendern
    setWant3d(true);
  }, [aktion, want3d, gl, reducedMotion]);

  useEffect(() => {
    onMode?.(want3d && !lost && view === "3d" ? (ready3d ? "3d" : "laden") : "2d");
  }, [want3d, lost, view, ready3d, onMode]);

  const show3d = gl && want3d && !lost && view === "3d";
  useEffect(() => {
    if (!ready3d) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- folgt dem Bereitschafts-Signal der Bühne
      setUeberblendet(false);
      return undefined;
    }
    const id = setTimeout(() => setUeberblendet(true), reducedMotion ? 0 : 750);
    return () => clearTimeout(id);
  }, [ready3d, reducedMotion]);
  const verdeckt = (show3d && ready3d && ueberblendet) || vorher || (want3d && view === "2d" && !lost);
  const tint = !poster && posterPasst(state, posterDaten) && !verdeckt;
  const onLost = useCallback(() => {
    setLost(true);
    setReady3d(false);
  }, []);

  const presets = Object.keys(buehnenPresets(state.becken, state.szene));

  const onKey = (e) => {
    if (fotoAktiv || !show3d || !ready3d || !apiRef.current) return;
    const step = e.shiftKey ? 0.3 : 0.12;
    const k = e.key;
    if (k === "ArrowLeft") apiRef.current.orbit(step, 0);
    else if (k === "ArrowRight") apiRef.current.orbit(-step, 0);
    else if (k === "ArrowUp") apiRef.current.orbit(0, -step);
    else if (k === "ArrowDown") apiRef.current.orbit(0, step);
    else if (k === "+" || k === "=") apiRef.current.zoom(0.85);
    else if (k === "-" || k === "_") apiRef.current.zoom(1.18);
    else if (/^[1-9]$/.test(k) && presets[Number(k) - 1]) onKamera(presets[Number(k) - 1]);
    else if (k === "0" || k === "Home") apiRef.current.zuruecksetzen?.();
    else return;
    e.preventDefault();
  };

  // Teilung ziehen (Zeiger) – Tastatur über das Range-Feld
  const dragging = useRef(false);
  const onPointer = (e) => {
    if (!dragging.current || !wrap.current) return;
    const r = wrap.current.getBoundingClientRect();
    onSplit(Math.min(0.95, Math.max(0.05, (e.clientX - r.left) / r.width)));
  };


  return (
    <div className="@container/stage flex h-full flex-col">
      <div
        ref={wrap}
        className="relative min-h-0 flex-1 overflow-hidden bg-linen"
        role="group"
        aria-roledescription={t("Vorschau", "Preview")}
        aria-label={fotoAktiv ? t("Fotoansicht: Visualisierung eines Beispielbeckens 8 × 4 m", "Photo view: visualisation of an 8 × 4 m example pool") : show3d ? t(`3D-Ansicht des Beckens. Pfeiltasten drehen, Plus und Minus zoomen, Ziffern 1 bis ${presets.length} wählen den Kamerapunkt, 0 setzt die Ansicht zurück.`, `3D view of the pool. Arrow keys rotate, plus and minus zoom, digits 1 to ${presets.length} choose the camera point, 0 resets the view.`, "stage.aria3d", { n: presets.length }) : tint || (poster && !verdeckt) ? t("Vorschau des Beckens", "Preview of the pool") : t("Draufsicht des Beckens", "Top view of the pool")}
        aria-describedby="ezk-summary"
        tabIndex={show3d && ready3d && !fotoAktiv ? 0 : -1}
        onKeyDown={onKey}
        onPointerMove={onPointer}
        onPointerUp={() => (dragging.current = false)}
        onPointerLeave={() => (dragging.current = false)}
        data-ezk-stage=""
        data-mode={show3d ? (ready3d ? "3d" : "laden") : "2d"}
      >
        {/* 2D ist immer da: Platzhalter, Rückfall, Vorschau ohne WebGL */}
        <div className={`absolute inset-0 transition-opacity duration-(--duration-swap) ease-quiet motion-reduce:transition-none ${show3d && ready3d ? "opacity-0" : "opacity-100"}`}>
          <Preview2D state={state} index={index} vorher={vorher} split={split} />
        </div>
        {/* Vorschaubild der 3D-Szene (nur Startentwurf): mobil bis „In 3D ansehen“, am Desktop bis die Bühne steht */}
        {poster && !vorher && !lost && !(show3d && ready3d && ueberblendet) && !(want3d && view === "2d") && (
          // eslint-disable-next-line @next/next/no-img-element -- vorgerendertes Poster, feste Größe, LCP-Kandidat
          <img
            src={poster.bild}
            alt=""
            width={poster.breite}
            height={poster.hoehe}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
            data-ezk-poster=""
          />
        )}
        {tint && <PosterVorschau state={state} index={index} poster={posterDaten} />}
        {gl && want3d && !lost && (
          <div className={`absolute inset-0 transition-opacity duration-(--duration-section) ease-quiet motion-reduce:transition-none ${view === "3d" ? "" : "hidden"} ${ready3d ? "opacity-100" : "opacity-0"}`} data-ezk-3d-ebene="">
            <Boundary onError={onLost}>
              <Stage3D
                state={state}
                index={index}
                vorher={vorher}
                split={split}
                reducedMotion={reducedMotion}
                touchLocked={touch && locked}
                onReady={() => setReady3d(true)}
                intro={poster && !vorher ? "ankommen" : "flug"}
                onLost={onLost}
                apiRef={apiRef}
              />
            </Boundary>
          </div>
        )}

        {fotoAktiv && fotoRender && (
          <FotoAnsicht
            render={fotoRender}
            reducedMotion={reducedMotion}
            alt={t(
              `Visualisierung: Beispielbecken 8 × 4 m mit ${fotoRef?.name || ""}, ${FOTO_VIEW_LABEL.de[fotoRender.view]}, Licht ${FOTO_LICHT_LABEL.de[fotoRender.licht]}`,
              `Visualisation: 8 × 4 m example pool with ${fotoRef?.name || ""}, ${FOTO_VIEW_LABEL.en[fotoRender.view]}, ${FOTO_LICHT_LABEL.en[fotoRender.licht]} light`,
              "stage.fotoAlt",
              { name: fotoRef?.name || "", view: fotoViewLabel[fotoRender.view], licht: X?.fotoLichtAlt?.[fotoRender.licht] ?? "" },
            )}
          />
        )}

        {/* Vorher/Nachher: Teilung */}
        {vorher && (
          <>
            <div className="pointer-events-none absolute inset-y-0 w-px bg-paper" style={{ left: `${split * 100}%` }} aria-hidden="true" />
            <button
              type="button"
              className="absolute top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center bg-paper text-text shadow-overlay"
              style={{ left: `${split * 100}%`, touchAction: "none" }}
              onPointerDown={(e) => {
                dragging.current = true;
                e.currentTarget.setPointerCapture?.(e.pointerId);
              }}
              onPointerMove={onPointer}
              onPointerUp={() => (dragging.current = false)}
              aria-hidden="true"
              tabIndex={-1}
            >
              <SplitSquareHorizontal className="size-5" aria-hidden="true" strokeWidth={1.5} />
            </button>
            <span className="absolute left-3 top-16 bg-paper/95 px-2 py-1 text-small text-text">{t("Vorher", "Before")}</span>
            <span className="absolute right-3 top-16 bg-paper/95 px-2 py-1 text-small text-text">{t("Nachher", "After")}</span>
          </>
        )}

        {/* Werkzeugleiste oben */}
        {/* QM r1: bei 200 % Text bricht die Leiste um, statt rechts aus dem Bild zu laufen */}
        {/* QM r4: oben nur noch die Ansichtswahl (3D · 2D · Foto); Rückgängig, Wiederholen und Vergleich
            stehen in jedem Zustand und auf jedem Gerät unten rechts (Leiste unten). */}
        <div className="pointer-events-none absolute inset-x-2 top-2 flex flex-wrap items-start gap-2">
          <div className="pointer-events-auto flex gap-px">
            {gl && want3d && !lost ? (
              <>
                <button type="button" className={btn} aria-pressed={!fotoAktiv && view === "3d"} onClick={() => { setFoto(false); setView("3d"); }}>
                  <Box className="size-4" aria-hidden="true" strokeWidth={1.5} />
                  <span>3D</span>
                </button>
                <button type="button" className={btn} aria-pressed={!fotoAktiv && view === "2d"} onClick={() => { setFoto(false); setView("2d"); }}>
                  <MapIcon className="size-4" aria-hidden="true" strokeWidth={1.5} />
                  <span>2D</span>
                </button>
              </>
            ) : null}
            {gl !== null && (
              <button
                type="button"
                className={fotoInfo.ok && !vorher ? btn : btn.replace(" text-text ", " text-text-soft ")}
                aria-pressed={fotoAktiv}
                aria-disabled={!fotoInfo.ok || Boolean(vorher)}
                aria-describedby={fotoInfo.ok ? undefined : "ezk-foto-hinweis"}
                title={fotoInfo.ok ? t("Fotoansicht (Beispielbecken 8 × 4 m)", "Photo view (8 × 4 m example pool)") : fotoHinweisText}
                onClick={() => {
                  if (!fotoInfo.ok || vorher) {
                    setFotoHinweis(true);
                    return;
                  }
                  setFotoHinweis(false);
                  setFoto((v) => !v);
                }}
                data-ezk-foto-knopf=""
              >
                <Camera className="size-4" aria-hidden="true" strokeWidth={1.5} />
                <span>{t("Foto", "Photo")}</span>
              </button>
            )}
          </div>
        </div>

        <span id="ezk-foto-hinweis" className="sr-only">{fotoHinweisText}</span>
        {fotoHinweis && !fotoAktiv && (
          <p className="absolute left-2 top-16 max-w-[calc(100%-1rem)] bg-paper/95 px-3 py-2 text-small text-text shadow-overlay" role="status" data-ezk-foto-hinweis="">
            {vorher && fotoInfo.ok ? t("Fotoansicht nach dem Vergleich verfügbar", "Photo view available after the comparison") : fotoHinweisText}
          </p>
        )}

        {tint && !(gl && want3d && !lost) && (
          <p className="absolute left-3 top-16 bg-paper/95 px-2 py-1 text-small text-text" data-ezk-vorschau-hinweis="">
            {gl ? t("Vorschau, für 3D tippen", "Preview, tap for 3D") : t("Vorschau, Farben angenähert", "Preview, colours approximated")}
          </p>
        )}
        {/* 3D starten / Status – QM r4: eine Leiste unten (links Zoom bzw. „Ansicht bewegen“, Mitte
            „In 3D ansehen“ bzw. Ladehinweis, rechts der Verlauf). Sie bricht bei großer Schrift nach oben
            um, statt dass Knöpfe übereinanderliegen („In 3D ansehen“ verdeckte den Verlauf). */}
        <div className="pointer-events-none absolute inset-x-2 bottom-2 flex flex-wrap items-end gap-2" data-ezk-leiste-unten="">
        {gl === false && (
          <p className="pointer-events-auto basis-full bg-paper/95 px-3 py-2 text-small text-text sm:basis-auto sm:max-w-[calc(100%-10rem)]">
            {t(
              `Ihr Browser zeigt kein WebGL. Sie sehen ${tint || poster ? "eine Vorschau mit angenäherten Farben" : "die 2D-Draufsicht"}; Mengen, Link, Druckblatt und Anfrage funktionieren wie gewohnt.`,
              `Your browser does not show WebGL. You see ${tint || poster ? "a preview with approximated colours" : "the 2D top view"}; quantities, link, print sheet and request work as usual.`,
              tint || poster ? "stage.keinWebglVorschau" : "stage.keinWebgl2d"
            )}
          </p>
        )}
        {gl && !want3d && !fotoAktiv && (
          <div className="flex max-w-full flex-[1_0_auto] justify-center">
            <button type="button" className={`${btn} pointer-events-auto max-w-full border border-ink px-5 text-left`} onClick={() => setWant3d(true)} data-ezk-3d="">
              <Box className="size-4" aria-hidden="true" strokeWidth={1.5} />
              <span>{AKTIONEN.drei}</span>
            </button>
          </div>
        )}
        {gl && want3d && !lost && !ready3d && view === "3d" && !fotoAktiv && (
          <div className="flex max-w-full flex-[1_0_auto] justify-center">
            <p className="bg-paper/95 px-3 py-2 text-small text-text" role="status">
              {t("3D wird geladen …", "Loading 3D …")}
            </p>
          </div>
        )}
        {lost && (
          <div className="pointer-events-auto flex basis-full flex-wrap items-center gap-2 bg-paper/95 px-3 py-2 text-small text-text" role="status">
            <span>{t("Die 3D-Ansicht wurde beendet (Grafikspeicher). Sie sehen die 2D-Draufsicht.", "The 3D view was closed (graphics memory). You see the 2D top view.")}</span>
            <button
              type="button"
              className="min-h-11 underline underline-offset-4"
              onClick={() => {
                setLost(false);
                setView("3d");
              }}
            >
              3D erneut laden
            </button>
          </div>
        )}
        {show3d && ready3d && touch && !fotoAktiv && (
          <button type="button" className={`${btn} pointer-events-auto`} aria-pressed={!locked} onClick={() => setLocked((v) => !v)}>
            <Hand className="size-4" aria-hidden="true" strokeWidth={1.5} />
            <span>{locked ? t("Ansicht bewegen", "Move view") : t("Fertig", "Done")}</span>
          </button>
        )}
        {show3d && ready3d && !touch && !fotoAktiv && (
          <div className="pointer-events-auto flex gap-px">
            <button type="button" className={btn} onClick={() => apiRef.current?.zoom(0.8)} aria-label={t("Näher", "Closer")}>
              <Plus className="size-4" aria-hidden="true" strokeWidth={1.5} />
            </button>
            <button type="button" className={btn} onClick={() => apiRef.current?.zoom(1.25)} aria-label={t("Weiter weg", "Further away")}>
              <Minus className="size-4" aria-hidden="true" strokeWidth={1.5} />
            </button>
          </div>
        )}
        <div className="pointer-events-auto ml-auto flex gap-px" data-ezk-verlauf="">
          <button type="button" className={btn} onClick={onUndo} disabled={!canUndo} aria-label={`${AKTIONEN.rueck} (${t("Strg+Z", "Ctrl+Z")})`} title={canUndo ? AKTIONEN.rueck : t("Nichts rückgängig zu machen", "Nothing to undo")}>
            <Undo2 className="size-4" aria-hidden="true" strokeWidth={1.5} />
          </button>
          <button type="button" className={btn} onClick={onRedo} disabled={!canRedo} aria-label={`${AKTIONEN.vor} (${t("Strg+Umschalt+Z", "Ctrl+Shift+Z")})`} title={canRedo ? AKTIONEN.vor : t("Nichts zu wiederholen", "Nothing to redo")}>
            <Redo2 className="size-4" aria-hidden="true" strokeWidth={1.5} />
          </button>
          <button type="button" className={btn} onClick={onVorher} aria-pressed={Boolean(vorher)} title={vorher ? AKTIONEN.vergleichEnde : AKTIONEN.vorher}>
            {vorher ? <CloseIcon className="size-4" aria-hidden="true" strokeWidth={1.5} /> : <SplitSquareHorizontal className="size-4" aria-hidden="true" strokeWidth={1.5} />}
            {/* Beschriftung nur, wenn die Bühne breit genug ist (Container-Query, zoomfest) */}
            <span className="sr-only @xl/stage:not-sr-only">{vorher ? AKTIONEN.vergleichEnde : AKTIONEN.vorher}</span>
          </button>
        </div>
        </div>
      </div>

      {/* Vorher/Nachher per Tastatur */}
      {vorher && (
        <label className="flex items-center gap-3 bg-paper px-3 py-1 text-small text-text-soft">
          <span className="shrink-0">{t("Teilung", "Split")}</span>
          <input type="range" min={5} max={95} value={Math.round(split * 100)} onChange={(e) => onSplit(Number(e.target.value) / 100)} className="h-11 w-full accent-ink" aria-label={t("Teilung Vorher/Nachher in Prozent", "Before/after split in percent")} />
        </label>
      )}

      {/* Fotoansicht: Ansicht und Licht */}
      {fotoAktiv && (
        <div className="flex gap-4 overflow-x-auto bg-paper py-2 pl-2 pr-8 [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] [scrollbar-width:none]" data-ezk-foto-wahl="">
          <Choice legend={t("Ansicht", "View")} legendHidden name="foto-view" value={fotoRender?.view} onChange={setFotoView} options={fotoInfo.views.map((id) => ({ id, label: fotoViewLabel[id] }))} className="shrink-0 [&>div]:flex-nowrap [&_label]:shrink-0 [&_.text-ui]:whitespace-nowrap" />
          {fotoInfo.lichter.length > 1 && (
            <Choice legend={t("Licht", "Light")} legendHidden name="foto-licht" value={fotoRender?.licht} onChange={setFotoLicht} options={fotoInfo.lichter.map((id) => ({ id, label: fotoLichtLabel[id] }))} className="shrink-0 border-l border-line pl-4 [&>div]:flex-nowrap [&_label]:shrink-0 [&_.text-ui]:whitespace-nowrap" />
          )}
        </div>
      )}

      {/* Kamerapunkte (nur 3D) – QM r4: Chips einzeilig („Unter Wasser“, „Von oben“ brachen trotz Platz
          auf zwei Zeilen um und machten die Reihe ungleich hoch); reicht die Breite nicht, scrollt die Reihe. */}
      {show3d && !fotoAktiv && (
        <div className="overflow-x-auto bg-paper py-2 pl-2 pr-8 [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] [scrollbar-width:none]">
          <Choice legend={t("Kamera", "Camera")} legendHidden name="kamera" value={state.kamera} onChange={onKamera} options={presets.map((id) => ({ id, label: KAMERA_LABEL[id] || id }))} className="[&>div]:flex-nowrap [&_label]:shrink-0 [&_.text-ui]:whitespace-nowrap" />
        </div>
      )}
    </div>
  );
}
