"use client";
// Produktseite des Viewers: Bühne je Ansicht, Maßleiste, AR-Hinweise.
//   Ansichten: „3D & AR“ (Stufe 1), „AR-Foto“ (2a), „Raumbedarf“ (2b, ohne Bild), „Fotos“.
//   Die 3D-Bühne (model-viewer + three.js) lädt erst auf Klick, per React.lazy in einer
//   lokalen Error-Boundary (QA R1 P2-3): ein Chunk-Ladefehler bleibt in der Bühne,
//   mit „Erneut versuchen“ (neuer import()).
//   Der schnelle AR-Start (Quick Look / Scene Viewer ohne Bühne) sitzt in ArLaunch
//   unter dem Titel; hier bleibt die Bühne als optionale Vorschau.
//   Fotos: Herstellerbilder unverändert, mobil wischbar (Embla), Vorschaubilder bleiben.
// QA R2:
//   P2-4  Wischen: Embla mit dragFree aus, Bilder nicht ziehbar (draggable=false, kein
//         natives Bild-Ziehen), Zähler/Overlays ohne Pointer-Events; dazu Pfeile ab sm.
//   P2-5  Bis model-viewer „load“ meldet, bleibt das Standbild stehen (auch während der
//         Chunk lädt), darüber ein Fortschrittsbalken.
//   P2-1  Raumbedarf mit Profil und Größenwahl (groesse.js, gleiche Wahl wie ArLaunch).
//   P2-4  Pinch-Zoom: „Bild vergrößern“, Tipp auf das Bild oder zwei Finger öffnen FotoZoom
//         (Ansicht vergrößert, Bild unverändert).
import Image from "next/image";
import Link from "next/link";
import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Box, Boxes, ChevronLeft, ChevronRight, Images, Maximize2, Ruler, ScanLine, RotateCcw } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { footprintFor } from "@/lib/arviewer/geometry";
import { groessenListe, useGroesse } from "./groesse";
import FotoZoom from "./FotoZoom";
import styles from "./ArViewer.module.css";

const makeStage = () => lazy(() => import("./ModelStage"));

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
const noop = () => () => {};

function media(query) {
  return {
    subscribe(cb) {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    get: () => window.matchMedia(query).matches,
  };
}
const reducedStore = media("(prefers-reduced-motion: reduce)");

let webglCache = null;
function detectWebGL() {
  if (webglCache === null) {
    try {
      const c = document.createElement("canvas");
      webglCache = Boolean(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webglCache = false;
    }
  }
  return webglCache;
}

/** Ansichten, die es für das Produkt gibt (Reihenfolge = Vorrang). */
export function viewsFor(p) {
  const v = [];
  if (p.model3d) v.push("3d");
  if (p.arFoto) v.push("ar-foto");
  if (p.raumbedarf) v.push("raum");
  if (p.images?.length) v.push("fotos");
  return v;
}

/** model-viewer-Modell je Ansicht (null für „fotos“). groesse: gewählte weitere Größe (Raumbedarf). */
export function toModel(p, view, groesse = null) {
  if (view === "ar-foto" && p.arFoto) {
    return {
      id: `${p.id}-foto`,
      name: p.name,
      category: "AR-Foto",
      src: p.arFoto.glb,
      iosSrc: p.arFoto.usdz || null,
      poster: p.arFoto.poster,
      posterAlt: `${p.alt}, freigestellt`,
      dimensionsCm: { w: p.arFoto.w, d: p.arFoto.d, h: p.arFoto.h },
      arPlacement: "floor",
      cameraOrbit: "-18deg 78deg auto",
      // Eine Foto-Fläche nie von der Kante zeigen.
      minCameraOrbit: "-60deg 35deg 50%",
      maxCameraOrbit: "60deg 90deg 170%",
      noAutoRotate: true,
      shadowIntensity: 0,
      arNote: null,
      variants: [],
      hotspots: [],
      sample: false,
    };
  }
  if (view === "raum" && p.raumbedarf) {
    const base = p.raumbedarf;
    const g = groesse && groesse.glb ? groesse : null;
    const r = g ? { ...base, ...g } : base;
    const form = base.profil?.art === "stufen" ? "Profil aus Sitz- und Rückenmaßen" : base.profil?.art === "linien" ? "Quader mit Sitzhöhe" : "Quader";
    return {
      id: `${p.id}-raum${g ? `-${r.w}-${r.d}-${r.h}` : ""}`,
      name: p.name,
      category: "Raumbedarf",
      src: r.glb,
      iosSrc: r.usdz || null,
      poster: base.poster,
      posterAlt: `Raumbedarf ${p.brand} ${p.name}: ${form}, ${r.w} × ${r.d} × ${r.h} cm, ohne Foto`,
      dimensionsCm: { w: r.w, d: r.d, h: r.h },
      arPlacement: "floor",
      cameraOrbit: "-28deg 68deg auto",
      noAutoRotate: true,
      shadowIntensity: 0.4,
      arNote: null,
      variants: [],
      hotspots: [],
      sample: false,
    };
  }
  if (view === "3d" && p.model3d) {
    return {
      id: `${p.id}-3d`,
      name: p.name,
      category: "3D",
      src: p.model3d.src,
      iosSrc: p.model3d.iosSrc || null,
      poster: p.model3d.poster,
      posterAlt: p.alt,
      dimensionsCm: p.dims || { w: 1, d: 1, h: 1 },
      arPlacement: p.model3d.arPlacement || "floor",
      cameraOrbit: "30deg 75deg auto",
      shadowIntensity: 1,
      variants: [],
      hotspots: [],
      sample: false,
    };
  }
  return null;
}

// Lokale Fehlergrenze: Ladefehler der 3D-Bühne nie bis zur Seite durchreichen.
class StageBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    trackEvent("view_3d_error", { message: String(error?.name || "error"), labs: true });
  }
  render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}

const VIEW_LABEL = { "3d": ["3D & AR", Box], "ar-foto": ["AR-Foto", ScanLine], raum: ["Raumbedarf", Boxes], fotos: ["Fotos", Images] };

export default function ProductViewer({ product, autoStart = false }) {
  const views = useMemo(() => viewsFor(product), [product]);
  const [view, setView] = useState(views[0] || "fotos");
  const [activated, setActivated] = useState(autoStart && views[0] !== "fotos");
  const [failed, setFailed] = useState(false);
  const [noWebgl, setNoWebgl] = useState(false);
  const [live, setLive] = useState(null);
  const [arMessage, setArMessage] = useState("");
  const [showDims, setShowDims] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [Stage, setStage] = useState(() => makeStage());
  const [attempt, setAttempt] = useState(0);
  const reduced = useSyncExternalStore(reducedStore.subscribe, reducedStore.get, () => false);
  const webgl = useSyncExternalStore(noop, detectWebGL, () => null);
  const [emblaRef, embla] = useEmblaCarousel({ loop: false, dragFree: false, duration: reduced ? 0 : 24, dragThreshold: 6 });
  const sizes = useMemo(() => groessenListe(product.raumbedarf, product.dims?.modell), [product.raumbedarf, product.dims?.modell]);
  const gi = useGroesse(product.id);
  const groesse = gi > 0 ? sizes[gi] || null : null;

  useEffect(() => {
    if (!embla) return undefined;
    const on = () => setImgIndex(embla.selectedScrollSnap());
    embla.on("select", on).on("reInit", on);
    return () => embla.off("select", on).off("reInit", on);
  }, [embla]);
  // „In meinem Raum ansehen“ ohne natives AR (ArLaunch) → Bühne hier laden.
  useEffect(() => {
    const on = () => {
      setView((v) => (v === "fotos" && views[0] !== "fotos" ? views[0] : v));
      if (detectWebGL()) setActivated(true);
      else setNoWebgl(true);
      document.getElementById("arv-buehne")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    };
    window.addEventListener("arv:buehne", on);
    return () => window.removeEventListener("arv:buehne", on);
  }, [views, reduced]);

  const model = toModel(product, view, groesse);
  const images = product.images || [];
  const dimsBox = useMemo(() => {
    if (!model || view === "3d") return null;
    const d = model.dimensionsCm;
    const f = footprintFor(d, view === "ar-foto" ? Boolean(product.arFoto?.laengs) : false);
    return { x: f.x / 100, y: d.h / 100, z: f.z / 100 };
  }, [model, view, product.arFoto?.laengs]);

  const activate = () => {
    if (!detectWebGL()) {
      setNoWebgl(true);
      return;
    }
    setActivated(true);
    trackEvent(view === "3d" ? "view_3d" : view === "raum" ? "view_raumbedarf" : "view_ar_foto", { product_id: product.id, labs: true });
  };
  const retry = () => {
    setFailed(false);
    setStage(makeStage());
    setAttempt((n) => n + 1);
  };
  const modelId = model?.id || null;
  // live gilt nur für das Modell, das ihn gemeldet hat (Größenwechsel → wieder Standbild + Balken)
  const onLoaded = useCallback((info) => setLive({ ...info, modelId }), [modelId]);
  const loadedHere = Boolean(live && live.modelId === modelId);
  const onError = useCallback(() => setFailed(true), []);
  const onArStatus = useCallback(
    (status) => {
      if (status === "session-started") trackEvent("ar_start", { product_id: product.id, stufe: product.stufe, labs: true });
      if (status === "failed") setArMessage("AR konnte auf diesem Gerät nicht gestartet werden. Versuchen Sie es mit einem aktuellen Smartphone.");
    },
    [product.id, product.stufe]
  );

  const hasStage = Boolean(model);
  const fallback = noWebgl || webgl === false;
  const stageOn = hasStage && activated && !fallback && !failed;
  const [label, Icon] = VIEW_LABEL[view] || VIEW_LABEL.fotos;

  const errorBox = (
    <div className="absolute inset-0">
      {model && <Image src={model.poster} alt={model.posterAlt} fill unoptimized sizes="(min-width: 1024px) 58vw, 100vw" className="object-contain p-[9%]" />}
      <div className="absolute inset-x-3 bottom-3 border border-line bg-paper/95 p-4 text-small sm:inset-x-4 sm:bottom-4" role="alert">
        <p className="font-medium text-text">Die Ansicht konnte nicht geladen werden.</p>
        <p className="mt-1 text-text-soft">Das Standbild bleibt stehen, die Maße stehen darunter.</p>
        <button
          type="button"
          onClick={retry}
          className={`mt-3 inline-flex min-h-11 items-center gap-2 border border-ink px-4 text-small font-medium text-text hover:bg-ink hover:text-paper ${FOCUS}`}
        >
          <RotateCcw aria-hidden="true" className="size-4" strokeWidth={1.5} />
          Erneut versuchen
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-w-0" id="arv-buehne">
      {/* Ansicht wählen */}
      {views.length > 1 && (
        <div role="group" aria-label="Ansicht" className="mb-3 flex flex-wrap border border-line-strong sm:inline-flex">
          {views.map((key) => {
            const [l, I] = VIEW_LABEL[key];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={view === key}
                onClick={() => {
                  setView(key);
                  setFailed(false);
                  setShowDims(false);
                  setLive(null);
                }}
                className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 px-4 text-small font-medium transition-colors duration-(--duration-micro) sm:flex-none ${FOCUS} ${
                  view === key ? "bg-ink text-paper" : "bg-paper text-text hover:bg-ink/5"
                }`}
              >
                <I aria-hidden="true" className="size-4" strokeWidth={1.5} />
                {key === "fotos" ? `${l} (${images.length})` : l}
              </button>
            );
          })}
        </div>
      )}

      {/* Bühne */}
      <div
        className="relative aspect-square w-full overflow-hidden border border-line bg-[radial-gradient(ellipse_at_50%_38%,#faf8f4_0%,#f7f5f1_50%,#ece8e1_100%)] sm:aspect-[4/3]"
        data-testid="arv-produkt-buehne"
        data-view={view}
      >
        {hasStage ? (
          failed ? (
            errorBox
          ) : stageOn ? (
            <StageBoundary key={`${model.id}-${attempt}`} fallback={errorBox}>
              {/* QA R2 P2-5: Standbild bleibt bis „load“ stehen – auch solange der 3D-Chunk lädt */}
              {!loadedHere && (
                <div className="pointer-events-none absolute inset-0" data-testid="arv-buehne-standbild">
                  <Image src={model.poster} alt="" fill unoptimized sizes="(min-width: 1024px) 58vw, 100vw" className="object-contain p-[9%]" />
                </div>
              )}
              <Suspense
                fallback={
                  <div className="absolute inset-0" role="status" data-testid="arv-buehne-laedt">
                    <div className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden bg-ink/10">
                      <div className={`h-full w-1/3 bg-ink ${styles.indet}`} />
                    </div>
                    <span className="absolute left-1/2 top-4 -translate-x-1/2 bg-paper/90 px-3 py-1.5 text-small font-medium text-text">Ansicht wird geladen …</span>
                  </div>
                }
              >
                <Stage
                  key={model.id}
                  model={model}
                  variant={null}
                  showDims={showDims}
                  showHotspots={false}
                  activeHotspot={null}
                  onHotspot={() => {}}
                  reducedMotion={reduced}
                  onLoaded={onLoaded}
                  onError={onError}
                  onArStatus={onArStatus}
                  onVariantApplied={() => {}}
                  resetSignal={0}
                  dimsBox={dimsBox}
                />
              </Suspense>
            </StageBoundary>
          ) : (
            <div className="absolute inset-0">
              <Image src={model.poster} alt={model.posterAlt} fill unoptimized preload sizes="(min-width: 1024px) 58vw, 100vw" className="object-contain p-[9%]" />
              {fallback ? (
                <div className="absolute inset-x-3 bottom-3 border border-line bg-paper/95 p-4 text-small sm:inset-x-4 sm:bottom-4" role="status">
                  <p className="font-medium text-text">3D ist auf diesem Gerät nicht verfügbar.</p>
                  <p className="mt-1 text-text-soft">Sie sehen das Standbild. Die Maße stehen darunter.</p>
                </div>
              ) : (
                <div className="absolute inset-x-0 bottom-5 flex justify-center px-4">
                  <button
                    type="button"
                    onClick={activate}
                    disabled={webgl === null}
                    className={`inline-flex min-h-12 items-center gap-2 border border-ink bg-paper px-6 text-ui text-text transition-colors duration-(--duration-micro) hover:bg-ink hover:text-paper disabled:opacity-60 ${FOCUS}`}
                  >
                    <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.5} />
                    {view === "3d" ? "3D-Vorschau laden" : view === "raum" ? "Raumbedarf in 3D drehen" : "AR-Foto in 3D drehen"}
                  </button>
                </div>
              )}
            </div>
          )
        ) : images.length ? (
          <div
            className="absolute inset-0 overflow-hidden"
            ref={emblaRef}
            aria-roledescription="Karussell"
            aria-label="Produktfotos"
            data-testid="arv-fotos"
            // zwei Finger auf dem Foto: direkt in die vergrößerte Ansicht
            onTouchStart={(e) => e.touches.length === 2 && setZoomOpen(true)}
          >
            <div className="flex h-full touch-pan-y select-none">
              {images.map((src, i) => (
                <div
                  key={src}
                  className="relative h-full min-w-0 flex-[0_0_100%] cursor-zoom-in"
                  aria-roledescription="Folie"
                  aria-label={`Bild ${i + 1} von ${images.length}`}
                  // Tipp/Klick ohne Wischen öffnet den Zoom (Tastatur: Knopf „Bild vergrößern“).
                  // Nach einem Wischen schluckt Embla 8 den Klick selbst (Capture-Listener, stopPropagation);
                  // Eine eigene Klick-Prüfung über die Embla-API gibt es in 8.x nicht (warf, Zoom blieb zu).
                  onClick={() => setZoomOpen(true)}
                >
                  <Image
                    src={src}
                    alt={`${product.alt}, Bild ${i + 1} von ${images.length}`}
                    fill
                    preload={i === 0}
                    loading={i === 0 ? undefined : "lazy"}
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    draggable={false}
                    className="pointer-events-none object-contain p-[4%]"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label="Bild vergrößern"
              aria-haspopup="dialog"
              data-testid="arv-zoom-start"
              className={`absolute right-3 top-3 grid h-11 w-11 place-items-center border border-line-strong bg-paper/95 text-text hover:border-ink ${FOCUS}`}
            >
              <Maximize2 aria-hidden="true" className="size-4" strokeWidth={1.75} />
            </button>
            {images.length > 1 && (
              <>
                <p className="pointer-events-none absolute bottom-3 right-3 bg-paper/90 px-2 py-1 text-small tabular-nums text-text" aria-hidden="true" data-testid="arv-fotos-zaehler">
                  {imgIndex + 1} / {images.length}
                </p>
                <div className="absolute bottom-3 left-3 hidden gap-1 sm:flex">
                  <button
                    type="button"
                    onClick={() => embla?.scrollPrev()}
                    disabled={imgIndex === 0}
                    aria-label="Vorheriges Bild"
                    className={`grid h-11 w-11 place-items-center border border-line-strong bg-paper/95 text-text hover:border-ink disabled:opacity-40 ${FOCUS}`}
                  >
                    <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() => embla?.scrollNext()}
                    disabled={imgIndex === images.length - 1}
                    aria-label="Nächstes Bild"
                    className={`grid h-11 w-11 place-items-center border border-line-strong bg-paper/95 text-text hover:border-ink disabled:opacity-40 ${FOCUS}`}
                  >
                    <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.75} />
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-linen p-6 text-center text-ui text-text-soft">Für dieses Produkt liegt noch kein Bild vor.</div>
        )}
      </div>

      {/* Steuerleiste unter der Bühne */}
      {stageOn && (view === "ar-foto" || view === "raum") && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={showDims}
            onClick={() => setShowDims((v) => !v)}
            className={`inline-flex min-h-11 items-center gap-2 border px-4 text-small font-medium transition-colors duration-(--duration-micro) ${FOCUS} ${
              showDims ? "border-ink bg-ink text-paper" : "border-line-strong bg-paper text-text hover:border-ink"
            }`}
          >
            <Ruler aria-hidden="true" className="size-4" strokeWidth={1.5} />
            Maße einblenden
          </button>
          <span className="text-small text-text-soft">{label}: Werte aus dem Herstellerdokument</span>
        </div>
      )}

      {images.length > 0 && (
        <FotoZoom
          open={zoomOpen}
          onClose={() => setZoomOpen(false)}
          images={images}
          index={imgIndex}
          onIndex={(i) => {
            setImgIndex(i);
            embla?.scrollTo(i, true);
          }}
          alt={product.alt}
          reducedMotion={reduced}
        />
      )}

      {/* Vorschaubilder */}
      {view === "fotos" && images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-8" aria-label="Bilder">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => {
                  setImgIndex(i);
                  embla?.scrollTo(i);
                }}
                aria-pressed={i === imgIndex}
                aria-label={`Bild ${i + 1} zeigen`}
                className={`relative block aspect-square w-full border bg-surface-raised ${FOCUS} ${i === imgIndex ? "border-ink" : "border-line hover:border-line-strong"}`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Maßleiste: nur Herstellermaße */}
      <div className="mt-4" data-testid="arv-produkt-masse">
        {product.dims ? (
          <>
            <dl className="grid grid-cols-3 border border-line bg-surface-raised text-center">
              {[
                [product.dimsMeta?.rund ? "Ø" : "Breite", groesse?.w ?? product.dims.w],
                ["Tiefe", groesse?.d ?? product.dims.d],
                ["Höhe", groesse?.h ?? product.dims.h],
              ].map(([l, v], i) => (
                <div key={l} className={`px-2 py-3 ${i ? "border-l border-line" : ""}`}>
                  <dt className="text-overline uppercase text-text-soft">{l}</dt>
                  <dd className="mt-1 text-title tabular-nums text-text">{String(Math.round(v * 10) / 10).replace(".", ",")} cm</dd>
                </div>
              ))}
            </dl>
            {(groesse?.modell || product.dims.modell) && <p className="mt-2 text-small text-text">Gezeigt: {groesse?.modell || product.dims.modell}</p>}
            {/* QA R2 P3: Bedingung der Höhe – nur mit Beleg im Register (dims.json hoeheBeleg) */}
            {product.dims.hoeheHinweis && !groesse && (
              <p className="mt-1 text-small text-text" data-testid="arv-hoehe-hinweis">
                Höhe {String(product.dims.h).replace(".", ",")} cm {product.dims.hoeheHinweis} (laut Datenblatt).
              </p>
            )}
            {product.raumbedarf?.profil && view === "raum" && (
              <p className="mt-1 text-small text-text-soft" data-testid="arv-profil">
                {product.raumbedarf.profil.art === "stufen" ? "Form aus dem Datenblatt: " : "Im Quader markiert: "}
                {[
                  product.raumbedarf.profil.sitzhoehe && `Sitzhöhe ${product.raumbedarf.profil.sitzhoehe} cm`,
                  product.raumbedarf.profil.art === "stufen" && product.raumbedarf.profil.sitztiefe && `Sitztiefe ${product.raumbedarf.profil.sitztiefe} cm`,
                  product.raumbedarf.profil.armlehnenhoehe && `Armlehne ${product.raumbedarf.profil.armlehnenhoehe} cm`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <p className="mt-1 text-small text-text-soft">
              Quelle:{" "}
              <a href={product.dims.quelle} rel="noopener noreferrer" target="_blank" className={`underline underline-offset-2 hover:text-text ${FOCUS}`}>
                {product.dimsMeta?.herkunft === "katalog" ? "Katalog" : "Datenblatt"} {product.brand} (PDF)
              </a>
              {product.dims.geprueft && ` · geprüft am ${new Date(product.dims.geprueft).toLocaleDateString("de-AT")}`}
            </p>
            {product.dimsMeta?.alternativen?.length > 0 && (
              <details className="mt-3 border-t border-line pt-2">
                <summary className={`flex min-h-11 cursor-pointer items-center text-small font-medium text-text ${FOCUS}`}>
                  Weitere Größen laut Hersteller ({product.dimsMeta.alternativen.length})
                </summary>
                <ul className="mt-1 grid gap-1 pb-2 text-small tabular-nums text-text-soft">
                  {product.dimsMeta.alternativen.map((a) => (
                    <li key={`${a.modell}-${a.w}-${a.d}-${a.h}`} className="flex justify-between gap-4 border-b border-line py-1.5">
                      <span className="min-w-0 text-text">{a.modell}</span>
                      <span className="shrink-0">
                        {a.w} × {a.d} × {a.h} cm
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-small text-text-soft">
                  {sizes.length > 1 ? "Die Größe für die Ansicht im Raum wählen Sie oben über dem Knopf." : "Die Ansicht im Raum zeigt die oben genannte Ausführung."}
                </p>
              </details>
            )}
          </>
        ) : (
          <p className="border border-dashed border-line-strong px-4 py-3 text-small text-text-soft">
            <span className="font-medium text-text">Maße fehlen.</span> Sie sind vom Hersteller noch nicht bestätigt. Wir nennen sie Ihnen gern
            persönlich.
          </p>
        )}
      </div>

      {arMessage && (
        <p className="mt-2 text-small text-error" role="alert">
          {arMessage}
        </p>
      )}
      {loadedHere && !live.canActivateAR && stageOn && (
        <p className="mt-2 text-small text-text-soft">AR startet auf dem Smartphone über „In meinem Raum ansehen“ oben.</p>
      )}
      {hasStage && (
        <p className="mt-4 text-small leading-relaxed text-text-soft">
          Datenschutz: Auf Android startet AR in „Scene Viewer“ von Google; dabei wird die Datei von Google-Diensten abgerufen. Auf iPhone und
          iPad läuft AR Quick Look auf dem Gerät.{" "}
          <Link href="/de/datenschutz" className={`underline underline-offset-2 hover:text-text ${FOCUS}`}>
            Datenschutzerklärung
          </Link>
        </p>
      )}
    </div>
  );
}
