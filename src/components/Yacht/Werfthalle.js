"use client";
// Werfthalle – the one signature moment of /de/yacht-interior (Bibel §8.3).
// Boat type (6), zone (deck … Steg), light (day/evening) are DOM controls;
// the 3D stage (Stage3D.js, three.js) loads only when the stage is visible on
// a capable desktop, or after "Boot in 3D ansehen" on phones/tablets. Without
// WebGL the SVG elevation (PosterSvg.js) shows the same zones.
// a11y: radiogroup for the boat type, toggle buttons for zones and light,
// aria-live summary ("Salon der Motoryacht, 5 Produkte"), keyboard on the
// stage (arrows rotate, +/− zoom, Esc overview). Canvas is aria-hidden.
import { Component, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image, { getImageProps } from "next/image";
import { Box, Info, Moon, RotateCcw, Sun, Wrench } from "lucide-react";
import { useLocale } from "next-intl";
import { isTouch } from "@/lib/yacht/device";
import { yachtUi } from "@/lib/yacht/ui";
import KiLabel from "./KiLabel";
import Laenge from "./Laenge";
import styles from "./yacht.module.css";
import { istRuhig } from "@/lib/yacht/motion";

const Stage3D = dynamic(() => import("./Stage3D"), { ssr: false, loading: () => null });
// Tempo (30.10.2026): the SVG elevation (PosterSvg + the boat generator
// src/lib/yacht/hull.js, ≈ 40 KB raw) is only visible for a zone, the evening
// light or without WebGL – the photo poster covers the overview. It loads as
// its own chunk after the first paint (idle) or on the first interaction,
// not before the LCP. Until then the stage shows the photo poster as before.
const PosterSvg = dynamic(() => import("./PosterSvg"), { ssr: false, loading: () => null });

class StageBoundary extends Component {
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

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function prefersReduced() {
  if (typeof window === "undefined") return false;
  return istRuhig(); // System ODER html[data-motion="reduced" | "calm"]
}

/** Auto-start 3D only on large screens with enough device budget. */
function autoEligible() {
  const nav = navigator;
  if (!window.matchMedia?.("(min-width: 1024px)").matches) return false;
  if (nav.connection?.saveData) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return false;
  return true;
}

// Boat type names: yachtUi(locale).kicker (Welle 2, EN).

// Thumbnails of the zone preview and the product list: 64 px, loaded eagerly
// (QA round 2, P2.3 – no empty white thumbnails after a boat switch).
const THUMB = "64px";

/** Warm the cache with the thumbnails of ALL boat types (max. ~36 small images), in idle time. */
function preloadThumbs(concepts) {
  const seen = new Set();
  for (const c of concepts) {
    for (const z of c.zones) {
      for (const p of z.products) {
        if (!p.image || seen.has(p.image)) continue;
        seen.add(p.image);
        const { props } = getImageProps({ src: p.image, alt: "", fill: true, sizes: THUMB });
        const img = new window.Image();
        img.decoding = "async";
        img.fetchPriority = "low";
        img.sizes = props.sizes;
        if (props.srcSet) img.srcset = props.srcSet;
        img.src = props.src;
      }
    }
  }
}

function ZoneSheet({ concept, zone, conceptHref, onZone, t }) {
  if (!zone) {
    const count = concept.zones.reduce((n, z) => n + z.products.length, 0);
    return (
      <div>
        <p className="text-overline uppercase text-text-accent">
          {concept.boatType}&nbsp;· <Laenge value={concept.length} />
        </p>
        <h3 className="mt-stack-s font-display text-display-m text-text">{concept.title}</h3>
        <p className="mt-3 font-display-italic text-lead text-text">{t.quote(concept.motto)}</p>
        <ul className="mt-stack-m flex h-3" aria-label={t.palette}>
          {concept.palette.map((c) => (
            <li key={c.name} className="flex-1" style={{ backgroundColor: c.hex }} title={c.name}>
              <span className="sr-only">{c.name}</span>
            </li>
          ))}
        </ul>
        <p className="mt-stack-m text-body text-text-soft">
          {t.chooseZone(count)}
        </p>
        {/* Mobil ausgeblendet (Seitenlänge, Inhaber-Entscheidung Nr. 11): dieselben Bereiche stehen als Knöpfe direkt unter der Bühne. */}
        {/* QM r1: Spalten nach Breite der Seitenleiste (Container-Query, zoomfest) – schmal einspaltig,
            damit „Badeplattform“ nicht getrennt wird und bei 200 % Text nichts senkrecht zerfällt. */}
        <div className="@container/ws max-md:hidden">
        <ul className="mt-stack-m grid grid-cols-1 gap-2 @md/ws:grid-cols-2 @2xl/ws:grid-cols-3" aria-label={t.zonesPreview} data-yacht-zone-preview="">
          {concept.zones.map((z) => {
            const first = z.products.find((p) => p.image);
            return (
              <li key={z.id}>
                <button
                  type="button"
                  onClick={() => onZone(z.id)}
                  className="group flex w-full items-center gap-3 border border-line bg-surface p-2 text-left transition-colors duration-(--duration-micro) hover:border-ink"
                >
                  <span className="relative size-12 shrink-0 bg-white">
                    {first ? (
                      <Image src={first.image} alt="" fill sizes={THUMB} loading="eager" className="object-contain p-1" />
                    ) : (
                      <Wrench aria-hidden="true" className="absolute inset-0 m-auto size-5 text-text-soft" strokeWidth={1.5} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-ui text-text [overflow-wrap:break-word]">{z.short}</span>
                    <span className="block text-small text-text-soft">{z.products.length ? t.products(z.products.length) : t.trades}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        </div>
        {concept.inspiration && (
          <p className="mt-3 text-small text-text-soft">{t.superyachtNote}</p>
        )}
        <a href={conceptHref} className="mt-stack-m inline-flex min-h-11 items-center text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current">
          {t.wholeConcept}
        </a>
      </div>
    );
  }
  return (
    <div>
      <p className="text-overline uppercase text-text-accent">
        {concept.title}&nbsp;· {t.kicker[concept.model]}
      </p>
      <h3 className="mt-stack-s font-display text-display-m text-text">{zone.label}</h3>
      <p className="mt-3 text-body text-text">{zone.text}</p>
      {zone.onLand && <p className="mt-2 text-small text-text-soft">{t.onLand}</p>}
      {zone.image && (
        <figure className="mt-stack-m">
          <div className="relative overflow-hidden bg-linen bg-cover bg-center" style={{ aspectRatio: zone.image.ratio, backgroundImage: zone.image.lqip ? "url(" + zone.image.lqip + ")" : undefined }}>
            <picture>
              <source type="image/avif" srcSet={zone.image.avif} />
              <img src={zone.image.webp} alt={zone.image.alt} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
            </picture>
            <KiLabel ki={zone.image.kiGenerated !== false} className="absolute bottom-2 left-2" />
          </div>
        </figure>
      )}
      {zone.products.length > 0 ? (
        <ul className="mt-stack-m border-t border-line" aria-label={t.productsFor(zone.label)}>
          {zone.products.map((p) => (
            <li key={p.id} className="group relative flex gap-4 border-b border-line py-3">
              <div className="relative size-16 shrink-0 bg-surface-raised">
                {p.image && <Image src={p.image} alt="" fill sizes={THUMB} loading="eager" className="object-contain" />}
              </div>
              <div className="min-w-0">
                <p className="text-overline uppercase text-text-soft">{p.brand}</p>
                <a href={p.href} className="ph-stretched text-ui text-text underline decoration-transparent underline-offset-4 group-hover:decoration-current">
                  {p.name}
                </a>
                <p className="text-small text-text-soft">
                  {p.role} · {p.eignungLabel}
                </p>
                {p.note && <p className="text-small text-text-soft">{t.note(p.note)}</p>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-stack-m flex gap-3 border border-dashed border-line-strong p-4" data-yacht-handwerk="">
          <Wrench aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-text-soft" strokeWidth={1.5} />
          <div>
            <p className="text-ui text-text">{t.tradesTitle}</p>
            <p className="mt-1 text-small text-text-soft">
              {zone.id === "bad" ? t.tradesBath : t.tradesOther}
            </p>
          </div>
        </div>
      )}
      <dl className="mt-stack-m grid grid-cols-1 gap-4 text-small sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div>
          <dt className="text-overline uppercase text-text-soft">{t.partySattler}</dt>
          {/* QM r1: je Leistung eine Zeile – kein Zeilenanfang mit „· “ */}
          {concept.sattler.map((s) => (
            <dd key={s} className="mt-1 text-text">{s}</dd>
          ))}
        </div>
        <div>
          <dt className="text-overline uppercase text-text-soft">{t.partyWerft}</dt>
          {concept.werft.map((s) => (
            <dd key={s} className="mt-1 text-text">{s}</dd>
          ))}
        </div>
      </dl>
      <a href={conceptHref} className="mt-stack-m inline-flex min-h-11 items-center text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current">
        {t.wholeConcept}
      </a>
    </div>
  );
}

/**
 * @param {Array} concepts islandConcepts(...) from src/lib/yacht/model.js
 * @param {string} [initial] concept id selected first
 */
export default function Werfthalle({ concepts, initial }) {
  const t = yachtUi(useLocale());
  const [conceptId, setConceptId] = useState(initial || concepts[0].id);
  const [zoneId, setZoneId] = useState(null);
  const [evening, setEvening] = useState(false);
  const [mode, setMode] = useState("poster"); // poster | loading | 3d | failed
  const [reduced, setReduced] = useState(false);
  const [touch, setTouch] = useState(false);
  const [posterSvg, setPosterSvg] = useState(false);
  const stageRef = useRef(null);
  const apiRef = useRef(null);
  const sheetRef = useRef(null);
  const groupName = useId();
  const concept = concepts.find((c) => c.id === conceptId) || concepts[0];
  const zone = concept.zones.find((z) => z.id === zoneId) || null;

  const start3d = useCallback(() => {
    setReduced(prefersReduced());
    setTouch(isTouch());
    if (!hasWebGL()) {
      setMode("failed");
      return;
    }
    setMode((m) => (m === "3d" ? m : "loading"));
  }, []);

  // mount the SVG elevation (own chunk) in idle time after hydration – ready
  // before the visitor reaches the hall; any interaction mounts it at once
  useEffect(() => {
    if (posterSvg) return;
    const run = () => setPosterSvg(true);
    if (window.requestIdleCallback) {
      const id = window.requestIdleCallback(run, { timeout: 3000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(run, 1500);
    return () => window.clearTimeout(id);
  }, [posterSvg]);
  const needPoster = posterSvg || zoneId !== null || evening || mode === "failed";

  // auto-start on capable desktops once 30 % of the stage is visible
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          if (autoEligible()) start3d();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [start3d]);

  // Yacht team (31.10.2026, WCAG 2.4.4/3.2.4): the hero link "Boot in 3D ansehen"
  // (#werfthalle) only scrolled here, and the same words then sat on the stage
  // button – one name, two actions. Following that link now also starts the 3D
  // stage (an explicit request, so phones load three.js too, as with the button).
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === "#werfthalle") start3d();
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [start3d]);

  // first boat-type switch: preload the thumbnails of ALL types in idle time
  // (low priority, so they never queue in front of the 3D chunk)
  const preloaded = useRef(false);
  const selectConcept = (id) => {
    setConceptId(id);
    setZoneId(null);
    if (preloaded.current) return;
    preloaded.current = true;
    const run = () => preloadThumbs(concepts);
    if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 1500 });
    else window.setTimeout(run, 200);
  };
  const selectZone = useCallback((id) => setZoneId(id), []);

  // reduced motion follows the system setting AND the site's "Ruhige
  // Ansicht" switch live (before: read once at 3D start)
  useEffect(() => {
    const sync = () => setReduced(prefersReduced());
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    mq?.addEventListener?.("change", sync);
    const mo = typeof MutationObserver === "undefined" ? null : new MutationObserver(sync);
    mo?.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    return () => {
      mq?.removeEventListener?.("change", sync);
      mo?.disconnect();
    };
  }, []);

  const onKey = (e) => {
    const api = apiRef.current;
    if (e.key === "Escape" || e.key === "Home") {
      if (e.key === "Home") e.preventDefault();
      setZoneId(null);
      return;
    }
    // walk through the zones in their order on board (also in the drawing)
    if (e.key === "PageDown" || e.key === "PageUp") {
      e.preventDefault();
      const ids = concept.zones.map((z) => z.id);
      const i = ids.indexOf(zoneId);
      const next = e.key === "PageDown" ? (i + 1) % ids.length : i <= 0 ? ids.length - 1 : i - 1;
      setZoneId(ids[next]);
      return;
    }
    if (!api) return;
    const map = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12] };
    if (map[e.key]) {
      e.preventDefault();
      api.rotate(...map[e.key]);
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      api.zoom(1);
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      api.zoom(-1);
    }
  };

  const palette = useMemo(() => concept.palette.map((p) => p.hex), [concept]);
  const boat = t.kicker[concept.model];
  const live = zone
    ? zone.products.length
      ? t.liveZone(zone.label, concept.title, boat, zone.products.length)
      : t.liveTrades(zone.label, concept.title, boat)
    : t.liveOverview(concept.title, boat);
  const showSteg = concept.zones.some((z) => z.id === "bootshaus");
  const conceptHref = `#konzept-${concept.id}`;
  const show3d = mode === "loading" || mode === "3d";

  return (
    // QM r1 (200 % Text): Spalten über Container-Query statt Viewport – bei vergrößertem Text
    // stehen Bühne und Konzeptblatt untereinander, statt die Seitenleiste auf ~170 px zu quetschen.
    <div className="@container/wh">
    <div className="grid grid-cols-1 gap-y-8 @5xl/wh:grid-cols-12 @5xl/wh:gap-x-8" data-yacht-werfthalle="">
      {/* QM r2 (laptop): ist das Konzeptblatt rechts länger, bleibt die Bühne beim Scrollen stehen (sticky)
          statt einer leeren Fläche links unter der Zonenliste. */}
      <div className="min-w-0 @5xl/wh:sticky @5xl/wh:top-[calc(var(--header-h)+1rem)] @5xl/wh:col-span-8 @5xl/wh:self-start">
        <fieldset>
          <legend className="text-overline uppercase text-text-soft">{t.boatType}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {concepts.map((c) => (
              <label
                key={c.id}
                className="relative inline-flex min-h-11 cursor-pointer items-center border border-line-control px-3 sm:px-4 text-ui text-text transition-colors duration-(--duration-micro) has-checked:border-ink has-checked:bg-ink has-checked:text-paper has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
              >
                <input type="radio" name={groupName} value={c.id} checked={c.id === conceptId} onChange={() => selectConcept(c.id)} className="sr-only" />
                {t.kicker[c.model]}
                {c.inspiration && <span className="ml-1 text-small opacity-80">{t.inspiration}</span>}
              </label>
            ))}
          </div>
        </fieldset>

        <div
          ref={stageRef}
          // QM r4 (200 % Text): Mindesthöhe nur bei vergrößerter Schrift ((1rem − 16 px) × 32: normal 0, bei
          // 200 % 512 px) – die Bühne wächst mit, statt auf
          // ~240 px zu bleiben, in denen Hinweis, Lichtschalter und 3D-Knopf übereinanderlagen. w-full: feste
          // Breite, sonst leitete aspect-ratio aus der Mindesthöhe eine größere Breite ab.
          className="relative mt-4 aspect-[4/3] w-full min-h-[calc((1rem-16px)*32)] overflow-hidden lg:aspect-[16/9]"
          data-yacht-stage=""
          data-evening={evening ? "" : undefined}
          style={{ backgroundColor: evening ? "var(--color-ink-deep)" : "var(--color-stone)" }}
        >
          <div
            role="group"
            tabIndex={mode === "3d" || needPoster ? 0 : -1}
            aria-label={t.stageLabel}
            aria-roledescription={t.stageRole}
            onKeyDown={onKey}
            className="absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-focus"
          >
            {/* poster: a still of the 3D overview (same camera), until 3D is ready */}
            {/* QM r4: das Poster bleibt eingehängt und wird bei Zone/Abendlicht nur ausgeblendet – beim
                Neuaufbau setzte React zuerst img.src (…-tall.webp), der Browser lud an und brach dann zugunsten
                der passenden <source> ab (net::ERR_ABORTED, doppelte Anfrage). */}
            {mode !== "failed" && (
              <picture className={`absolute inset-0 transition-opacity duration-(--duration-swap) ease-quiet motion-reduce:transition-none ${zoneId || evening ? "hidden" : mode === "3d" ? "opacity-0" : "opacity-100"}`} data-yacht-poster="">
                <source media="(min-width: 1024px)" srcSet={`/labs/yacht/werfthalle-${concept.model}-wide.webp`} />
                <source media="(min-width: 640px)" srcSet={`/labs/yacht/werfthalle-${concept.model}-mid.webp`} />
                <img src={`/labs/yacht/werfthalle-${concept.model}-tall.webp`} alt="" width="1600" height="1000" loading="lazy" decoding="async" className="size-full object-cover" />
              </picture>
            )}
            {mode === "loading" && <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${styles.shimmer}`} />}
            {needPoster && <PosterSvg
              modelKey={concept.model}
              zones={concept.zones}
              zone={zoneId}
              onSelect={selectZone}
              evening={evening}
              showSteg={showSteg}
              className={`absolute inset-0 size-full p-4 transition-opacity duration-(--duration-swap) ease-quiet motion-reduce:transition-none md:p-8 ${mode === "3d" || (!zoneId && !evening && mode !== "failed") ? "pointer-events-none opacity-0" : "opacity-100"}`}
            />}
            {show3d && (
              <StageBoundary onError={() => setMode("failed")}>
                <div className={`absolute inset-0 transition-opacity duration-(--duration-swap) ease-quiet motion-reduce:transition-none ${mode === "3d" ? "opacity-100" : "opacity-0"}`}>
                  <Stage3D
                    modelKey={concept.model}
                    zones={concept.zones}
                    zone={zoneId}
                    onSelect={selectZone}
                    palette={palette}
                    evening={evening}
                    reduced={reduced}
                    apiRef={apiRef}
                    onReady={() => setMode("3d")}
                    onError={() => setMode("failed")}
                  />
                </div>
              </StageBoundary>
            )}
          </div>

          {/* stage overlay: schema note, light switch, overview, 3D start */}
          {/* Hinweis und Lichtschalter in einer Zeile: der Hinweis bricht um statt unter den Knopf zu laufen (EN, 375 px) */}
          {/* QM r4 (200 % Text): Hinweis schrumpft höchstens auf 6 rem – reicht der Platz neben dem Lichtschalter
              nicht, rückt der Schalter in die nächste Zeile (flex-wrap), statt den Hinweis zu überdecken. */}
          <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
          <p className={`min-w-[min(6rem,100%)] max-w-full px-2 py-1 text-small ${evening ? "bg-ink-deep/70 text-text-inverse" : "bg-paper/80 text-text"}`}>
            {t.schemaNote}
          </p>
          <div className="pointer-events-auto flex min-w-0 max-w-full gap-2">
            <button
              type="button"
              aria-pressed={evening}
              onClick={() => setEvening((v) => !v)}
              // QM r1: Aktion, kein gewählter Zustand – ungedrückt hell mit Rahmen (nicht tintengefüllt wie der aktive Bootstyp)
              className={`inline-flex min-h-11 max-w-full items-center gap-2 border px-3 text-left text-ui transition-colors duration-(--duration-micro) ${evening ? "border-paper bg-paper text-ink" : "border-ink bg-paper/90 text-ink hover:bg-paper"}`}
            >
              {evening ? <Sun aria-hidden="true" className="size-4" strokeWidth={1.5} /> : <Moon aria-hidden="true" className="size-4" strokeWidth={1.5} />}
              {t.eveningLight}
            </button>
          </div>
          </div>
          {/* phones: controls flow LEFT – the concierge launcher sits bottom right
              and must not cover them (WCAG 2.4.11, QA round 2 P2.6) */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-start gap-2 md:justify-between">
            {zoneId ? (
              <button type="button" onClick={() => setZoneId(null)} className="inline-flex min-h-11 items-center gap-2 bg-paper/90 px-3 text-ui text-ink hover:bg-paper">
                <RotateCcw aria-hidden="true" className="size-4" strokeWidth={1.5} />
                {t.overview}
              </button>
            ) : (
              <span className="hidden md:block" />
            )}
            {mode === "poster" && (
              <button type="button" onClick={start3d} className="inline-flex min-h-11 max-w-full items-center gap-2 bg-ink px-4 text-left text-ui text-paper hover:bg-ink-deep" data-yacht-start3d="">
                <Box aria-hidden="true" className="size-4" strokeWidth={1.5} />
                {t.start3d}
              </button>
            )}
            {mode === "loading" && <span className={`px-3 py-2 text-small ${evening ? "bg-ink-deep/70 text-text-inverse" : "bg-paper/85 text-text"}`}>{t.loading3d}</span>}
            {mode === "3d" && (
              <span className={`px-2 py-1 text-small ${evening ? "bg-ink-deep/70 text-text-inverse" : "bg-paper/80 text-text-soft"}`}>
                {touch ? t.touchHint : t.mouseHint}
              </span>
            )}
            {mode === "failed" && (
              <span className={`max-w-xs px-3 py-2 text-small ${evening ? "bg-ink-deep/80 text-text-inverse" : "bg-paper/90 text-text"}`}>
                {t.failed3d}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p id={`${groupName}-zones`} className="text-overline uppercase text-text-soft">
            {t.zonesOnBoard}
          </p>
          {/* QM r1: gleich breite Zellen statt Fließtext-Chips – keine einzelne „Badeplattform“ allein in Zeile 2 */}
          <ul aria-labelledby={`${groupName}-zones`} className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(min(100%,11rem),1fr))] gap-2">
            {concept.zones.map((z) => (
              <li key={z.id}>
                <button
                  type="button"
                  aria-pressed={zoneId === z.id}
                  onClick={() => setZoneId(zoneId === z.id ? null : z.id)}
                  className={`flex min-h-11 w-full items-center justify-between gap-2 border px-4 text-left text-ui text-text transition-colors duration-(--duration-micro) hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper ${z.products.length ? "border-line-control" : "border-dashed border-line-strong"}`}
                >
                  {z.label}
                  {z.products.length ? (
                    <span className="tabular text-small opacity-80">
                      {z.products.length}
                      <span className="sr-only"> {t.productWord(z.products.length)}</span>
                    </span>
                  ) : (
                    <>
                      <Info aria-hidden="true" className="size-4 opacity-80" strokeWidth={1.5} />
                      <span className="sr-only">{t.tradesSr}</span>
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside ref={sheetRef} aria-label={t.conceptSheet} className="min-w-0 @5xl/wh:col-span-4 @5xl/wh:border-l @5xl/wh:border-line @5xl/wh:pl-8">
        <p className="sr-only" aria-live="polite" data-yacht-live="">
          {live}
        </p>
        <ZoneSheet concept={concept} zone={zone} conceptHref={conceptHref} onZone={selectZone} t={t} />
      </aside>
    </div>
    </div>
  );
}
