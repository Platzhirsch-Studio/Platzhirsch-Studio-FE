"use client";
// ShowroomStage – Bühne des Rundgangs /[locale]/showroom (N1).
//
// Zustände: idle (Poster = LCP, kein 3D-Code geladen) → loading → ready,
// oder fallback (kein WebGL2, Ladefehler, „Als Video ansehen“).
// Alles Bedienbare ist DOM: Weiter/Zurück, Stationspunkte, Tag/Abend,
// Hotspot-Knöpfe, Stück-Karte. Der Canvas (SplatViewer) ist aria-hidden.
// Tastatur in der Bühne: ← → Station, A/D/W/S Blick, Esc schließt die Karte.
// Messung nur über trackEvent (ohne Einwilligung kein gtag → nichts gesendet).
import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, Maximize2, Minimize2, Play, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/context/CartContext";
import { trackEvent } from "@/lib/analytics";
import cx from "@/components/ui/cx";
import { pageCopy } from "./honestCopy";
import ShowroomFallback from "./ShowroomFallback";
import ShowroomPoster from "./ShowroomPoster";
import s from "./showroom.module.css";

const loadViewer = () => import("./SplatViewer");
const SplatViewer = dynamic(loadViewer, { ssr: false, loading: () => null });

function subscribeMotion(cb) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const useReducedMotion = () =>
  useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

/**
 * WebGL2 mit Hardware-Beschleunigung? Software-Rendering (SwiftShader, llvmpipe,
 * „Microsoft Basic Render“) blockiert bei 0,5–2 Mio. Gaussians den Hauptthread
 * für Sekunden – dann lieber gleich Video und Fotos (failIfMajorPerformanceCaveat).
 */
function hasWebGL2() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    const ok = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

/** Starke Geräte: hi-Stufe nachladen, höhere Pixeldichte. Sparsam bei Datensparen/schwachen Geräten. */
function isStrongDevice() {
  const n = navigator;
  if (n.connection?.saveData) return false;
  if (/^(slow-2g|2g|3g)$/.test(n.connection?.effectiveType || "")) return false;
  const mem = n.deviceMemory ?? 8;
  const cores = n.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return mem >= 6 && cores >= 6 && !coarse;
}

const mbOf = (bytes) => (bytes ? Math.max(0.1, Math.round((bytes / 1024 / 1024) * 10) / 10).toLocaleString("de-AT") : null);

export default function ShowroomStage({ tour, locale = "de", beratungPath = "/beratung" }) {
  // R8: ohne echte Aufnahme (tour.test) keine Rundgang-Versprechen (honestCopy.js)
  const t = pageCopy(locale, tour.test);
  const [phase, setPhase] = useState("idle"); // idle | loading | ready | fallback
  const [reason, setReason] = useState(null); // webgl | fehler | video
  const [progress, setProgress] = useState(0);
  const [index, setIndex] = useState(0);
  const [stimmung, setStimmung] = useState("tag");
  const [active, setActive] = useState(null); // Hotspot-ID
  const [arrived, setArrived] = useState(false);
  const [full, setFull] = useState(false);
  const [strong, setStrong] = useState(false);
  const [capture, setCapture] = useState(false);
  const reducedMotion = useReducedMotion();
  const stageRef = useRef(null);
  const hotspotEls = useRef(new Map());
  const apiRef = useRef(null);
  const drag = useRef(null);
  const cardRef = useRef(null);
  const lastHotspotBtn = useRef(null);
  const visited = useRef(new Set());
  const ids = useId();
  const { addToCart, cartItems } = useCart();

  const stations = tour.stations;
  const station = stations[index];
  const n = stations.length;
  const hotspot = station?.hotspots.find((h) => h.id === active) || null;

  const start = useCallback(
    (opts = {}) => {
      if (!hasWebGL2()) {
        setReason("webgl");
        setPhase("fallback");
        return;
      }
      setStrong(isStrongDevice());
      setPhase("loading");
      requestAnimationFrame(() => stageRef.current?.scrollIntoView({ block: "start", behavior: "instant" }));
      setProgress(0);
      if (!opts.silent) trackEvent("showroom_start", { stationen: n });
    },
    [n, setReason, setPhase, setStrong, setProgress],
  );

  // Aufnahme-Werkzeug (tools/splat/media.mjs): ?aufnahme=1 startet sofort und
  // gibt window.__showroomCapture frei. Ohne den Parameter gibt es keine Schnittstelle.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("aufnahme") !== "1") return undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- einmaliger Start im Aufnahmemodus
    setCapture(true);
    start({ silent: true });
    return undefined;
  }, [start]);

  useEffect(() => {
    if (!capture || phase !== "ready") return undefined;
    window.__showroomCapture = {
      stations: stations.map((x) => ({ id: x.id, kamera: x.kamera })),
      setCamera: (pos, ziel, fov) => apiRef.current?.setCamera(pos, ziel, fov),
      setStimmung: (m) => setStimmung(m),
      goto: (i) => setIndex(i),
    };
    document.documentElement.dataset.showroomCapture = "ready";
    return () => {
      delete window.__showroomCapture;
    };
  }, [capture, phase, stations]);

  const onReady = useCallback(() => setPhase("ready"), [setPhase]);
  const onProgress = useCallback((p) => setProgress(Math.round(p * 100)), [setProgress]);
  const onError = useCallback(() => {
    setReason("fehler");
    setPhase("fallback");
  }, [setReason, setPhase]);
  const onFps = useCallback((fps) => {
    if (stageRef.current) stageRef.current.dataset.fps = String(fps);
  }, []);
  const onArrive = useCallback(() => setArrived(true), [setArrived]);

  const go = useCallback(
    (next) => {
      const i = Math.max(0, Math.min(n - 1, next));
      if (i === index) return;
      setActive(null);
      setArrived(false);
      setIndex(i);
      trackEvent("showroom_station", { station: stations[i].id, nummer: i + 1 });
      visited.current.add(stations[i].id);
      if (visited.current.size >= n - 1 && i === n - 1) trackEvent("showroom_complete", { stationen: n });
    },
    [index, n, stations, setActive, setArrived, setIndex],
  );

  const stop = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    setPhase("idle");
    setActive(null);
    setIndex(0);
    setArrived(false);
  }, [setPhase, setActive, setIndex, setArrived]);

  // Vollbild (nur wo die API existiert; iPhone-Safari hat sie nicht).
  const canFull = typeof document !== "undefined" && Boolean(document.fullscreenEnabled);
  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else stageRef.current?.requestFullscreen?.().catch(() => {});
  };

  // Tastatur innerhalb der Bühne.
  const onKeyDown = (e) => {
    if (phase !== "ready" && phase !== "loading") return;
    if (e.target.closest?.("input, select, textarea")) return;
    const k = e.key;
    if (k === "Escape" && active) {
      e.preventDefault();
      setActive(null);
      lastHotspotBtn.current?.focus();
      return;
    }
    if (k === "ArrowRight" || k === "PageDown") {
      e.preventDefault();
      go(index + 1);
    } else if (k === "ArrowLeft" || k === "PageUp") {
      e.preventDefault();
      go(index - 1);
    } else if (/^[adws]$/i.test(k) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      const step = 0.08;
      const m = { a: [step, 0], d: [-step, 0], w: [0, step], s: [0, -step] }[k.toLowerCase()];
      apiRef.current?.look(m[0], m[1]);
    }
  };

  // Ziehen = Blick leicht drehen (Pointer Events: Maus, Stift, Finger).
  const onPointerDown = (e) => {
    if (e.target !== e.currentTarget) return;
    drag.current = { x: e.clientX, y: e.clientY, moved: 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    d.x = e.clientX;
    d.y = e.clientY;
    d.moved += Math.abs(dx) + Math.abs(dy);
    const w = e.currentTarget.clientWidth || 1;
    apiRef.current?.look((dx / w) * 1.6, (dy / w) * 1.2);
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  // Karte öffnen → Fokus auf die Überschrift.
  useEffect(() => {
    if (active) cardRef.current?.focus();
  }, [active]);

  const openHotspot = (h, btn) => {
    lastHotspotBtn.current = btn;
    setActive(h.id);
    trackEvent("showroom_hotspot", { hotspot: h.id, station: station.id });
  };

  const saved = useMemo(() => new Set((cartItems || []).map((x) => String(x.id))), [cartItems]);
  const merken = (h) => {
    addToCart({
      id: `showroom-${h.id}`,
      name: h.label,
      image: null,
      category: h.marke || "Showroom Lochau",
      kategories: "showroom",
      url_slug: h.id,
      href: h.merkHref,
      produkte_id: `showroom-${h.id}`,
    });
    trackEvent("showroom_action", { action: "merken", hotspot: h.id });
  };
  const terminHref = (h) => `${beratungPath}?produkt=${encodeURIComponent(`${t.terminPrefix}: ${h.label}`)}`;

  const running = phase === "loading" || phase === "ready";
  const firstMb = mbOf(tour.firstBytes);
  const zoneHasAbend = Boolean(station && tour.zonen[station.zone]?.stimmungen.abend);

  return (
    <div className={s.stageWrap}>
      <div
        ref={stageRef}
        className={cx(s.stage, running && s.stageRunning, full && s.stageFull, capture && s.stageCapture)}
        data-state={phase}
        data-station={running ? station?.id : undefined}
        data-reason={reason || undefined}
        onKeyDown={onKeyDown}
        role="region"
        aria-roledescription={running ? "3D-Rundgang" : undefined}
        aria-label={t.videoTitel}
      >
        {phase === "idle" && (
          <div className={s.idle}>
            <ShowroomPoster poster={tour.poster} alt={t.posterAlt || t.videoTitel} priority />
            <div className={s.idleActions}>
              <button
                type="button"
                className={s.startBtn}
                onClick={() => start()}
                onPointerEnter={() => loadViewer()}
                onFocus={() => loadViewer()}
                aria-describedby={`${ids}-hint`}
              >
                <Play aria-hidden="true" className="size-5" strokeWidth={1.5} />
                <span>{t.start}</span>
              </button>
              <button
                type="button"
                className={s.videoBtn}
                onClick={() => {
                  setReason("video");
                  setPhase("fallback");
                }}
              >
                {t.video}
              </button>
              {firstMb && (
                <p id={`${ids}-hint`} className={s.hint}>
                  {t.startHinweis(firstMb)}
                </p>
              )}
            </div>
          </div>
        )}

        {running && (
          <>
            <div
              className={s.canvasBox}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <SplatViewer
                tour={tour}
                stationIndex={index}
                stimmung={stimmung}
                reducedMotion={reducedMotion}
                strong={strong}
                capture={capture}
                hotspotEls={hotspotEls}
                apiRef={apiRef}
                onReady={onReady}
                onProgress={onProgress}
                onError={onError}
                onFps={onFps}
                onArrive={onArrive}
              />
              {station?.nurFoto && station.foto && (
                // eslint-disable-next-line @next/next/no-img-element -- Stationsfoto aus public/showroom, feste Größe
                <img className={s.stationFoto} src={station.foto.src} alt={station.foto.alt} width={station.foto.width} height={station.foto.height} />
              )}
              {phase === "loading" && (
                <div className={s.loading} role="status" aria-live="polite">
                  <ShowroomPoster poster={tour.poster} alt="" dim />
                  <p className={s.loadingText}>{progress > 0 ? t.ladenProzent(progress) : t.laden}</p>
                  <div className={s.bar} aria-hidden="true">
                    <span style={{ transform: `scaleX(${progress / 100})` }} />
                  </div>
                </div>
              )}
              {phase === "ready" && !capture && (
                <ul className={s.hotspots} aria-label={station?.titel}>
                  {station?.hotspots.map((h) => (
                    <li
                      key={h.id}
                      ref={(el) => {
                        if (el) hotspotEls.current.set(h.id, el);
                        else hotspotEls.current.delete(h.id);
                      }}
                      className={s.hotspot}
                      data-sichtbar="0"
                      data-arrived={arrived ? "1" : "0"}
                    >
                      <button
                        type="button"
                        className={s.hotspotBtn}
                        aria-expanded={active === h.id}
                        aria-controls={`${ids}-card`}
                        onClick={(e) => openHotspot(h, e.currentTarget)}
                      >
                        <span className={s.hotspotDot} aria-hidden="true" />
                        <span className={s.hotspotLabel}>{h.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {hotspot && (
              <section
                id={`${ids}-card`}
                className={s.card}
                role="dialog"
                aria-modal="false"
                aria-labelledby={`${ids}-card-title`}
              >
                <div className={s.cardHead}>
                  {hotspot.marke && <p className={s.cardBrand}>{hotspot.marke}</p>}
                  <h3 id={`${ids}-card-title`} ref={cardRef} tabIndex={-1} className={s.cardTitle}>
                    {hotspot.label}
                  </h3>
                  <button type="button" className={s.iconBtn} onClick={() => { setActive(null); lastHotspotBtn.current?.focus(); }} aria-label={t.schliessen}>
                    <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
                  </button>
                </div>
                {hotspot.dealer && <p className={s.cardDealer}>{hotspot.dealer}</p>}
                {hotspot.text && <p className={s.cardText}>{hotspot.text}</p>}
                {hotspot.masse && <p className={s.cardMeta}>{hotspot.masse}</p>}
                <p className={s.cardMeta}>{t.imShowroom}{tour.standLabel ? ` · ${tour.standLabel}` : ""}</p>
                <div className={s.cardActions}>
                  {hotspot.aktionen.includes("termin") && (
                    <Link href={terminHref(hotspot)} className={s.actionPrimary} onClick={() => trackEvent("showroom_action", { action: "termin", hotspot: hotspot.id })}>
                      {t.aktionen.termin}
                    </Link>
                  )}
                  {hotspot.aktionen.includes("produkt") && hotspot.productLink && (
                    <Link href={hotspot.productLink.href} locale={hotspot.productLink.locale} className={s.action} onClick={() => trackEvent("showroom_action", { action: "produkt", hotspot: hotspot.id })}>
                      {t.aktionen.produkt}
                    </Link>
                  )}
                  {hotspot.aktionen.includes("ar") && hotspot.arLink && (
                    <Link href={hotspot.arLink.href} locale={hotspot.arLink.locale} className={s.action} onClick={() => trackEvent("showroom_action", { action: "ar", hotspot: hotspot.id })}>
                      {t.aktionen.ar}
                    </Link>
                  )}
                  {hotspot.aktionen.includes("merken") && (
                    <button type="button" className={s.action} onClick={() => merken(hotspot)} aria-pressed={saved.has(`showroom-${hotspot.id}`)}>
                      {saved.has(`showroom-${hotspot.id}`) ? t.aktionen.gemerkt : t.aktionen.merken}
                    </button>
                  )}
                </div>
              </section>
            )}

            <div className={s.controls}>
              <button type="button" className={s.navBtn} onClick={() => go(index - 1)} disabled={index === 0} aria-label={t.zurueck}>
                <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
                <span className={s.navLabel} aria-hidden="true">{t.zurueck}</span>
              </button>
              <nav className={s.dots} aria-label={t.stationWaehlen}>
                <ol>
                  {stations.map((x, i) => (
                    <li key={x.id}>
                      <button
                        type="button"
                        className={s.dot}
                        aria-current={i === index ? "step" : undefined}
                        aria-label={`${t.station(i + 1, n)}: ${x.titel}`}
                        onClick={() => go(i)}
                      >
                        <span aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
              <button type="button" className={s.navBtn} onClick={() => go(index + 1)} disabled={index === n - 1} aria-label={t.weiter}>
                <span className={s.navLabel} aria-hidden="true">{t.weiter}</span>
                <ArrowRight aria-hidden="true" className="size-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className={s.topBar}>
              {tour.hatAbend && (
                <div className={s.mood} role="group" aria-label={t.stimmung}>
                  {["tag", "abend"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={s.moodBtn}
                      aria-pressed={stimmung === m}
                      disabled={m === "abend" && !zoneHasAbend}
                      onClick={() => setStimmung(m)}
                    >
                      {t[m]}
                    </button>
                  ))}
                </div>
              )}
              <div className={s.topRight}>
                {canFull && (
                  <button type="button" className={s.iconBtnDark} onClick={toggleFull} aria-label={full ? t.vollbildAus : t.vollbild} aria-pressed={full}>
                    {full ? <Minimize2 aria-hidden="true" className="size-5" strokeWidth={1.5} /> : <Maximize2 aria-hidden="true" className="size-5" strokeWidth={1.5} />}
                  </button>
                )}
                <button type="button" className={s.iconBtnDark} onClick={stop} aria-label={t.beenden}>
                  <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </>
        )}

        {phase === "fallback" && (
          <ShowroomFallback
            tour={tour}
            t={t}
            reason={reason}
            onBack={reason === "video" ? () => { setReason(null); setPhase("idle"); } : null}
          />
        )}
      </div>

      {running && station && (
        <div className={s.caption} aria-live="polite">
          <p className={s.captionCount}>
            {t.station(index + 1, n)} · {t.zonen[station.zone] || station.zone}
          </p>
          <h2 className={s.captionTitle}>{station.titel}</h2>
          <p className={s.captionText}>{station.text}</p>
          {station.nurFoto && <p className={s.captionNote}>{t.nurFoto}</p>}
          {station.hotspots.length === 0 && !station.nurFoto && <p className={s.captionNote}>{t.ohneStuecke}</p>}
          {station.material && (
            <ul className={s.material}>
              {station.material.map((m) => (
                <li key={m.src}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- echtes Material des Inhabers, Größe aus den Daten */}
                  <img src={m.src} alt={m.alt || ""} width={m.width} height={m.height} loading="lazy" />
                </li>
              ))}
            </ul>
          )}
          <p className={s.captionHelp}>{t.bedienung}</p>
        </div>
      )}
    </div>
  );
}
