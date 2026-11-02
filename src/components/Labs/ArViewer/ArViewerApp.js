"use client";
// Gallery + controls around the 3D stage. The heavy part (ModelStage with
// model-viewer/three.js) is loaded on demand only: first click on "3D ansehen"
// (or on a colour swatch).
//
// Layout: below `lg` the two columns use `display: contents`, so their blocks
// become flex items of the outer column and can be re-ordered with `order-*`:
//   stage → colours / Maße / Material / AR (directly under the stage, so a tap
//   shows its effect) → gallery → name, notes, material list.
// From `lg` the columns are normal blocks (order has no effect inside them) and
// the right panel is sticky.
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { trackEvent } from "@/lib/analytics";
import { withContext } from "@/lib/forms/beratungContext";

const ModelStage = dynamic(() => import("./ModelStage"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center" role="status">
      <span className="bg-white/90 px-3 py-1.5 text-[13px] font-semibold tracking-wide text-[#30373e]">
        3D-Viewer wird geladen …
      </span>
    </div>
  ),
});

// ---- environment checks -----------------------------------------------------
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

const noopSubscribe = () => () => {};

function mediaStore(query) {
  return {
    subscribe(cb) {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    get: () => window.matchMedia(query).matches,
  };
}
const reducedMotionStore = mediaStore("(prefers-reduced-motion: reduce)");
// Desktop = fine pointer with hover. Only there the "open on your phone" QR code makes sense.
const desktopStore = mediaStore("(pointer: fine) and (hover: hover)");

const fmt = (n) => Math.round(n);
const formatDims = ({ w, d, h }) => `B ${fmt(w)} × T ${fmt(d)} × H ${fmt(h)} cm`;

const HINT = "text-[13px] leading-relaxed text-[#30373e]/75 sm:text-xs";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7a5f17]";

// ---- QR dialog (desktop → phone) --------------------------------------------
function PhoneDialog({ open, onClose, url, modelName }) {
  const ref = useRef(null);
  const [qr, setQr] = useState(null);
  const titleId = useId();

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  useEffect(() => {
    if (!open || !url) return;
    let cancelled = false;
    import("qrcode")
      .then((QR) => QR.toDataURL(url, { margin: 1, width: 240, color: { dark: "#30373e", light: "#ffffff" } }))
      .then((data) => !cancelled && setQr(data))
      .catch(() => !cancelled && setQr(null));
    return () => {
      cancelled = true;
    };
  }, [open, url]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(92vw,380px)] border border-[#30373e]/15 bg-[#f7f5f1] p-0 text-[#30373e] backdrop:bg-[#1f252b]/60"
    >
      <div className="p-6">
        <h2 id={titleId} className="font-display text-2xl">Auf dem Smartphone ansehen</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#30373e]/80">
          Scannen Sie den Code mit der Kamera Ihres Smartphones. Dort öffnet sich „{modelName}“ – tippen Sie auf
          „In meinem Raum ansehen“, um es in Originalgröße in Ihren Raum zu stellen.
        </p>
        <div className="mt-5 grid place-items-center bg-white p-4">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element -- data: URL, generated locally
            <img src={qr} width={200} height={200} alt={`QR-Code zum Link ${url}`} />
          ) : (
            <span className="grid h-[200px] w-[200px] place-items-center text-xs text-[#30373e]/75">QR-Code …</span>
          )}
        </div>
        <p className="mt-3 break-all text-xs text-[#30373e]/75">{url}</p>
        <p className="mt-3 text-xs text-[#30373e]/75">
          Voraussetzung: iPhone/iPad mit iOS 12+ (AR Quick Look) oder Android mit ARCore (Google Play-Dienste für AR).
        </p>
        <button
          type="button"
          onClick={onClose}
          className={`mt-5 w-full border border-[#30373e] px-4 py-3 text-sm font-semibold tracking-wide hover:bg-[#30373e] hover:text-[#f7f5f1] ${FOCUS}`}
        >
          Schließen
        </button>
      </div>
    </dialog>
  );
}

// ---- main ------------------------------------------------------------------
export default function ArViewerApp({ models, initialId, sampleNotice }) {
  const [selectedId, setSelectedId] = useState(
    models.some((m) => m.id === initialId) ? initialId : models[0]?.id
  );
  const model = models.find((m) => m.id === selectedId) || models[0];

  // Deep link from the QR code (?modell=<id>) opens the viewer directly.
  const [activated, setActivated] = useState(Boolean(initialId) && models.some((m) => m.id === initialId));
  const [webglBlocked, setWebglBlocked] = useState(false);
  const webglDetected = useSyncExternalStore(noopSubscribe, detectWebGL, () => null); // null = unknown (SSR)
  const webgl = webglBlocked ? false : webglDetected;
  const [failed, setFailed] = useState(false);
  const [variantByModel, setVariantByModel] = useState({});
  const [variantPending, setVariantPending] = useState(false);
  const [showDims, setShowDims] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [live, setLive] = useState(null); // { dimensions, canActivateAR }
  const [arMessage, setArMessage] = useState("");
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneUrl, setPhoneUrl] = useState("");
  const [resetSignal, setResetSignal] = useState(0);

  const reducedMotion = useSyncExternalStore(reducedMotionStore.subscribe, reducedMotionStore.get, () => false);
  const isDesktop = useSyncExternalStore(desktopStore.subscribe, desktopStore.get, () => null); // null = unknown (SSR)

  const variant = variantByModel[model.id] ?? model.variants[0]?.variant ?? null;
  const hotspot = model.hotspots.find((h) => h.id === activeHotspot) || null;
  const showFallback = webgl === false || failed;
  const stageReady = activated && !showFallback;

  const activate = useCallback(() => {
    if (!detectWebGL()) {
      setWebglBlocked(true);
      return false;
    }
    setActivated(true);
    trackEvent("view_3d", { model_id: model.id, labs: true });
    return true;
  }, [model.id]);

  const selectModel = (id) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setActiveHotspot(null);
    setLive(null);
    setFailed(false);
    setArMessage("");
    setVariantPending(false);
    const u = new URL(window.location.href);
    u.searchParams.set("modell", id);
    window.history.replaceState(window.history.state, "", u);
  };

  const selectVariant = (v) => {
    if (v === variant) return;
    setVariantByModel((s) => ({ ...s, [model.id]: v }));
    // Only wait for "variant-applied" when the model is already on stage.
    if (live) setVariantPending(true);
    if (!activated) activate();
    trackEvent("select_variant_3d", { model_id: model.id, variant: v, labs: true });
  };

  const toggleDims = () => {
    if (activated) setShowDims((s) => !s);
    else if (activate()) setShowDims(true);
  };

  const onLoaded = useCallback((info) => setLive(info), []);
  const onError = useCallback(() => setFailed(true), []);
  const onVariantApplied = useCallback(() => setVariantPending(false), []);
  const onArStatus = useCallback(
    (status) => {
      if (status === "session-started") trackEvent("ar_start", { model_id: model.id, labs: true });
      if (status === "failed")
        setArMessage("AR konnte auf diesem Gerät nicht gestartet werden. Bitte versuchen Sie es mit einem aktuellen Smartphone.");
    },
    [model.id]
  );

  const openPhone = () => {
    const u = new URL(window.location.href);
    u.search = "";
    u.hash = "";
    u.searchParams.set("modell", model.id);
    setPhoneUrl(u.toString());
    setPhoneOpen(true);
  };

  const dims = live?.dimensions
    ? { w: live.dimensions.w * 100, d: live.dimensions.d * 100, h: live.dimensions.h * 100 }
    : model.dimensionsCm;
  const currentVariant = model.variants.find((v) => v.variant === variant);

  const toggleBtn = (on) =>
    `min-h-11 border px-3 py-2.5 text-sm font-semibold transition-colors ${FOCUS} ${
      on ? "border-[#30373e] bg-[#30373e] text-[#f7f5f1]" : "border-[#30373e]/30 text-[#30373e] hover:border-[#30373e]"
    }`;

  // ---------------------------------------------------------------- AR text
  let arText = null;
  if (live?.canActivateAR) {
    arText = "Tippen Sie im Bild auf „In meinem Raum ansehen“. Das Modell erscheint in Originalgröße – verschieben und drehen ja, skalieren bewusst nicht.";
  } else if (isDesktop) {
    arText = "AR funktioniert auf iPhone/iPad (AR Quick Look) und Android-Smartphones mit ARCore. Scannen Sie den Code mit dem Handy und machen Sie dort weiter.";
  } else if (isDesktop === false && !stageReady) {
    arText = "Nach „3D ansehen“ erscheint im Bild der Button „In meinem Raum ansehen“ – damit stellen Sie das Möbel per AR in Originalgröße in Ihren Raum.";
  } else if (isDesktop === false && live && !live.canActivateAR) {
    arText = "AR ist in diesem Browser nicht verfügbar – öffnen Sie die Seite in Safari (iPhone/iPad) bzw. Chrome (Android).";
  } else if (isDesktop === false) {
    arText = "Der AR-Button erscheint im Bild, sobald das Modell geladen ist.";
  }

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-12 lg:gap-y-0">
      {/* ================= left column ================= */}
      <div className="contents lg:block lg:min-w-0">
        {/* ---------------- stage ---------------- */}
        <div className="order-1 min-w-0">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a5f17]">Beispielmodell · CC0</span>
            <span className="truncate text-[13px] text-[#30373e]/75 lg:hidden">{model.name}</span>
          </div>
          <div className="relative aspect-square max-h-[72svh] w-full overflow-hidden border border-[#30373e]/10 bg-[radial-gradient(ellipse_at_50%_40%,#ffffff_0%,#f7f5f1_55%,#ece8e1_100%)] sm:aspect-[4/3]">
            {stageReady ? (
              <ModelStage
                key={model.id}
                model={model}
                variant={variant}
                showDims={showDims}
                showHotspots={showHotspots}
                activeHotspot={activeHotspot}
                onHotspot={setActiveHotspot}
                reducedMotion={reducedMotion}
                onLoaded={onLoaded}
                onError={onError}
                onArStatus={onArStatus}
                onVariantApplied={onVariantApplied}
                resetSignal={resetSignal}
              />
            ) : (
              <div className="absolute inset-0">
                <Image
                  key={model.poster}
                  src={model.poster}
                  alt={model.posterAlt}
                  fill
                  // Posters are pre-sized WebP (17–77 KB) and the very same files
                  // model-viewer shows as its poster, so one cached request each
                  // instead of extra optimizer variants (R2; also sidesteps a
                  // hanging AVIF variant in the dev optimizer, see ar-viewer.md).
                  unoptimized
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-contain p-8 sm:p-12"
                  preload={model.id === models[0]?.id}
                />
                {showFallback ? (
                  <div className="absolute inset-x-3 bottom-3 border border-[#30373e]/15 bg-white/95 p-4 text-sm text-[#30373e] sm:inset-x-4 sm:bottom-4" role="status">
                    <p className="font-semibold">{failed ? "3D konnte gerade nicht geladen werden." : "3D ist auf diesem Gerät nicht verfügbar."}</p>
                    <p className="mt-1 text-[#30373e]/80">
                      {failed
                        ? "Das Modell konnte nicht geladen werden."
                        : "Ihr Browser unterstützt kein WebGL (oder es ist deaktiviert)."}{" "}
                      Sie sehen ein Standbild. Materialien und Maße zeigen wir Ihnen gern persönlich in Lochau.
                    </p>
                    {/* Runde 4 (CTA-Wörter): „Termin anfragen“ mit Kontext. Die Beispielmodelle sind
                        CC0 (kein Produkt) → nur ?thema; ein echtes Sortimentsmodell (`product`) gibt
                        seinen Namen als ?produkt mit. */}
                    <Link
                      href={withContext("/de/beratung", { thema: "3d-ansicht", produkt: model.product || null })}
                      className={`-my-2 inline-block py-3 font-semibold underline underline-offset-4 hover:text-[#7a5f17] ${FOCUS}`}
                    >
                      Termin anfragen
                    </Link>
                  </div>
                ) : (
                  <div className="absolute inset-x-0 bottom-6 flex justify-center">
                    <button
                      type="button"
                      onClick={activate}
                      disabled={webgl === null}
                      className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap bg-[#30373e] px-6 py-3 text-sm font-semibold tracking-wide text-[#f7f5f1] transition-colors hover:bg-[#1f252b] disabled:opacity-60 ${FOCUS}`}
                    >
                      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" />
                        <path d="m3 7 9 5 9-5M12 12v10" />
                      </svg>
                      3D ansehen &amp; drehen
                    </button>
                  </div>
                )}
              </div>
            )}

            {variantPending && (
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] overflow-hidden bg-[#30373e]/10" role="status">
                <div className="h-full w-1/3 animate-pulse bg-[#7a5f17] motion-reduce:animate-none" />
                <span className="sr-only">Farbe wird geladen</span>
              </div>
            )}
          </div>

          {/* Maßleiste (R2, Auflage 1): all three values always readable, also on
              portrait phones where the 3D labels for depth/height may not fit. It is
              also the accessible version of the (aria-hidden) labels in the canvas. */}
          <div aria-live="polite">
            {showDims && stageReady && (
              <dl
                data-testid="arv-dims-bar"
                className="grid grid-cols-3 border-x border-b border-[#30373e]/10 bg-[#f7f5f1] text-center text-[#30373e]"
              >
                {[
                  ["Breite", dims.w],
                  ["Tiefe", dims.d],
                  ["Höhe", dims.h],
                ].map(([label, value], i) => (
                  <div key={label} className={`px-2 py-2.5 ${i ? "border-l border-[#30373e]/10" : ""}`}>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#30373e]/75">{label}</dt>
                    <dd className="mt-0.5 text-base font-semibold tabular-nums">{fmt(value)} cm</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* hotspot info (outside the canvas so it never covers the model on phones) */}
          <div id="arv-hotspot-info" aria-live="polite" className="min-h-[1px]">
            {hotspot && (
              <div className="mt-3 flex items-start gap-3 border-l-2 border-[#d1b250] bg-[#f7f5f1] p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#30373e]">{hotspot.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#30373e]/80">{hotspot.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveHotspot(null)}
                  className="-m-3 grid h-11 w-11 flex-none place-items-center text-[#30373e]/75 hover:text-[#30373e] focus-visible:outline-2 focus-visible:outline-[#7a5f17]"
                  aria-label="Material-Info schließen"
                >
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ---------------- gallery ---------------- */}
        <div className="order-3 min-w-0">
          <p className={`lg:mt-3 ${HINT}`}>
            Ziehen zum Drehen · zwei Finger oder Mausrad zum Zoomen · bei Fokus auf dem Modell: Pfeiltasten. Mit einem
            Finger scrollt die Seite normal weiter.
          </p>
          <h2 className="sr-only">Modell wählen</h2>
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 lg:mt-6">
            {models.map((m) => {
              const active = m.id === model.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => selectModel(m.id)}
                    aria-pressed={active}
                    className={`group block w-full border bg-[#f7f5f1] text-left transition-colors ${FOCUS} ${
                      active ? "border-[#30373e] ring-1 ring-[#30373e]" : "border-[#30373e]/10 hover:border-[#30373e]/40"
                    }`}
                  >
                    <span className="relative block aspect-square">
                      <Image
                        src={m.poster}
                        alt=""
                        fill
                        unoptimized
                        loading="eager"
                        sizes="(min-width: 1024px) 200px, 33vw"
                        className="object-contain p-3"
                      />
                    </span>
                    <span className="block border-t border-[#30373e]/10 px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#30373e] sm:text-xs">
                      <span
                        className={`border-b-2 pb-0.5 ${active ? "border-[#d1b250]" : "border-transparent"}`}
                      >
                        {m.category}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ================= right column / panel ================= */}
      <div className="contents lg:sticky lg:top-28 lg:block lg:min-w-0 lg:self-start">
        {/* header (mobile: after the gallery) */}
        <div className="order-4 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a5f17]">{model.category}</p>
          <h2 className="mt-1 font-display text-3xl leading-tight text-[#30373e]">{model.name}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#30373e]/75">{sampleNotice}</p>
          <dl className="mt-5 border-t border-[#30373e]/15 pt-4 text-sm">
            <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
              <dt className="text-[#30373e]/75">Maße (Beispielmodell)</dt>
              <dd className="text-right font-semibold tabular-nums text-[#30373e]">{formatDims(dims)}</dd>
            </div>
          </dl>
        </div>

        {/* controls (mobile: directly under the stage) */}
        <div className="order-2 min-w-0 lg:mt-6 lg:border-t lg:border-[#30373e]/15 lg:pt-4">
          {model.variants.length > 0 && (
            <fieldset>
              <legend className="float-left w-full text-sm font-semibold text-[#30373e]">
                {model.category === "Leuchte" ? "Oberfläche" : "Bezug / Farbe"}
                <span className="ml-2 font-normal text-[#30373e]/75">{currentVariant?.label}</span>
              </legend>
              <div className="clear-both flex flex-wrap gap-3 pt-3">
                {model.variants.map((v) => {
                  const pending = variantPending && v.variant === variant;
                  return (
                    <label key={v.variant} className="cursor-pointer" title={v.note}>
                      <input
                        type="radio"
                        name={`variant-${model.id}`}
                        value={v.variant}
                        checked={variant === v.variant}
                        onChange={() => selectVariant(v.variant)}
                        className="peer sr-only"
                      />
                      <span
                        className={`block h-11 w-11 rounded-full border border-[#30373e]/20 ring-offset-2 ring-offset-white peer-checked:ring-2 peer-checked:ring-[#30373e] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[#7a5f17] ${
                          pending ? "animate-pulse motion-reduce:animate-none" : ""
                        }`}
                        style={{ backgroundColor: v.swatch }}
                        aria-hidden="true"
                      />
                      <span className="sr-only">
                        {v.label} – {v.note}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className={`mt-2 ${HINT}`}>
                {currentVariant?.note}
                {!activated && " · Tippen lädt das 3D-Modell in dieser Farbe."}
              </p>
            </fieldset>
          )}

          <div className={`grid grid-cols-2 gap-2 ${model.variants.length ? "mt-4" : ""}`}>
            <button type="button" aria-pressed={showDims} onClick={toggleDims} className={toggleBtn(showDims)}>
              Maße anzeigen
            </button>
            <button
              type="button"
              aria-pressed={showHotspots}
              onClick={() => {
                setShowHotspots((s) => !s);
                setActiveHotspot(null);
              }}
              className={toggleBtn(showHotspots)}
            >
              Material-Infos
            </button>
            {stageReady && (
              <button
                type="button"
                onClick={() => {
                  setShowDims(false);
                  setResetSignal((n) => n + 1);
                }}
                className={`col-span-2 ${toggleBtn(false)}`}
              >
                Ansicht zurücksetzen
              </button>
            )}
          </div>

          {/* AR – the privacy note sits right here, before anyone taps the AR button */}
          <div className="mt-5 border-t border-[#30373e]/15 pt-4">
            <h3 className="text-sm font-semibold text-[#30373e]">In meinem Raum ansehen (AR)</h3>
            {arText && <p className="mt-2 text-sm leading-relaxed text-[#30373e]/80">{arText}</p>}
            {model.arNote && (
              <p className="mt-2 border-l-2 border-[#d1b250] pl-3 text-sm leading-relaxed text-[#30373e]/80">{model.arNote}</p>
            )}
            {isDesktop && !live?.canActivateAR && (
              <button
                type="button"
                onClick={openPhone}
                className={`mt-3 min-h-11 w-full border border-[#30373e] px-4 py-3 text-sm font-semibold tracking-wide text-[#30373e] hover:bg-[#30373e] hover:text-[#f7f5f1] ${FOCUS}`}
              >
                Auf dem Smartphone öffnen
              </button>
            )}
            {arMessage && (
              <p className="mt-2 text-sm text-[#8a2b1d]" role="alert">
                {arMessage}
              </p>
            )}
            <p className={`mt-3 ${HINT}`}>
              Datenschutz: Auf Android startet AR in „Scene Viewer“ von Google; dabei wird die Modelldatei von
              Google-Diensten abgerufen. Auf iPhone/iPad läuft AR Quick Look lokal. Wir erhalten keine Kamerabilder.{" "}
              <Link href="/de/datenschutz" className={`-my-3 inline-block py-3 underline underline-offset-2 hover:text-[#30373e] ${FOCUS}`}>
                Datenschutzerklärung
              </Link>
            </p>
          </div>
        </div>

        {/* rest of the panel */}
        <div className="order-5 min-w-0 lg:mt-2">
          {/* Material list = accessible alternative to the 3D hotspots */}
          <details className="group border-t border-[#30373e]/15">
            <summary
              className={`flex min-h-11 cursor-pointer list-none items-center justify-between py-3 text-sm font-semibold text-[#30373e] ${FOCUS}`}
            >
              Materialien im Detail
              <span aria-hidden="true" className="text-lg leading-none transition-transform group-open:rotate-45 motion-reduce:transition-none">
                +
              </span>
            </summary>
            <ol className="mb-4 space-y-3 text-sm">
              {model.hotspots.map((h, i) => (
                <li key={h.id} className="flex gap-3">
                  <span aria-hidden="true" className="grid h-6 w-6 flex-none place-items-center rounded-full border border-[#30373e]/30 text-[11px] font-semibold">
                    {i + 1}
                  </span>
                  <span>
                    <span className="font-semibold">{h.title}.</span>{" "}
                    <span className="text-[#30373e]/80">{h.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </details>

          {model.credit && (
            <p className={`border-t border-[#30373e]/15 pt-3 ${HINT}`}>
              Modell: „{model.name}“ von {model.credit.author},{" "}
              <a
                href={model.credit.url}
                className={`-my-3 inline-block py-3 underline underline-offset-2 hover:text-[#30373e] ${FOCUS}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                Poly Haven
              </a>{" "}
              (CC0).
            </p>
          )}
        </div>
      </div>

      <PhoneDialog open={phoneOpen} onClose={() => setPhoneOpen(false)} url={phoneUrl} modelName={model.name} />
    </div>
  );
}
