"use client";
/* eslint-disable react-hooks/immutability -- der Regie-Speicher (store) ist ein bewusst veränderliches
   Objekt, das Scroll/Ziehen an die three.js-Szene weitergibt, ohne React-Renders pro Frame. */
// Kino-Lab „3D-Bühne“ – Regie im Browser.
//
// Das gesamte Markup (Titelkarten, Produkt-Schild, Standbild, Bleistift-SVG)
// kommt per SSR; die WebGL-Szene (Scene.js, three.js) wird erst nach dem
// ersten Paint und nur bei Bedarf geladen:
//   - live:    WebGL vorhanden, keine reduzierte Bewegung, keine „Ruhige
//              Ansicht“ → Vollbild-Bühne mit Scroll-Drehbuch.
//   - static:  sonst → gerendertes Standbild + alle Karten untereinander.
// Scroll: ein rAF pro Frame schreibt nur store.p (für die Szene) und bei
// Kapitelwechsel data-chapter (für das CSS der Karten).
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import SmartLink from "@/components/ui/SmartLink";
import Button from "@/components/ui/Button";
import s from "./kino3d.module.css";
import { CHAPTERS, chapterAt, clamp } from "./timeline";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

const STEP = 0.45; // Drehung je Tastendruck (rad)

function calmNow() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced";
}

function webglOk() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function makeStore() {
  return {
    p: 0,
    sp: 0,
    chapter: 0,
    yaw: 0,
    yawTarget: 0,
    drift: 0,
    driftT: 0,
    paused: false,
    mood: 0,
    vis: { sofa: 0, chair: 0, lamp: 0 },
    matStart: 0,
    skipIntro: false,
    sofaReady: false,
    cameraSettled: false,
    onOutline: null,
  };
}

function Plate({ m, className, hidden }) {
  return (
    <div className={`${s.plate} ${className || ""}`} data-plate={m.id} aria-hidden={hidden || undefined}>
      <p className={s.plateKat}>{m.kategorie} · Beispielmodell</p>
      <p className={s.plateName}>{m.name}</p>
      <p className={s.plateNote}>
        {m.notice}{" "}
        <a href={m.credit.url} target="_blank" rel="noopener noreferrer" tabIndex={hidden ? -1 : undefined}>
          Modell: {m.credit.author}, Poly Haven (CC0)
        </a>
      </p>
      <p className={s.plateLinks}>
        <SmartLink href={m.link.href} className={s.plateLink} tabIndex={hidden ? -1 : undefined}>
          {m.link.label} <span aria-hidden="true">→</span>
        </SmartLink>
        <SmartLink href="/3d-ansicht" className={s.plateLink} tabIndex={hidden ? -1 : undefined}>
          Im 3D-Viewer ansehen <span aria-hidden="true">→</span>
        </SmartLink>
      </p>
    </div>
  );
}

// Kapitel → gezeigtes Modell (0 Sofa, 1 Sessel, 2 Leuchte)
const plateFor = (c) => (c < 3 ? 0 : c === 4 ? 2 : 1);

export default function Kino3D({ copy, models, still }) {
  const track = useRef(null);
  // Regie-Speicher: ein veränderliches Objekt, geteilt mit der Szene (kein State pro Frame)
  const [store] = useState(makeStore);
  const [mode, setMode] = useState("pending"); // pending | live | static
  const [load, setLoad] = useState(false);
  const [active, setActive] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [intro, setIntro] = useState("wait"); // wait | draw | mat | done
  const [outline, setOutline] = useState(null);
  const [paused, setPaused] = useState(false);
  const [cut, setCut] = useState(0);
  const timers = useRef([]);

  // Modus wählen, 3D erst nach dem ersten Paint laden
  useEffect(() => {
    const decide = () => {
      setMobile(window.matchMedia("(max-width: 47.99rem), (pointer: coarse)").matches);
      if (calmNow() || !webglOk()) {
        setMode("static");
        setLoad(false);
        return;
      }
      setMode("live");
    };
    decide();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", decide);
    const mo = new MutationObserver(decide);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    return () => {
      mq.removeEventListener("change", decide);
      mo.disconnect();
    };
  }, []);

  useEffect(() => {
    if (mode !== "live" || load) return undefined;
    let id = 0;
    const go = () => setLoad(true);
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 250));
    const start = () => {
      id = idle(go, { timeout: 1500 });
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      (window.cancelIdleCallback || clearTimeout)(id);
    };
  }, [mode, load]);

  // Scroll → Fortschritt; Sichtbarkeit → Renderschleife an/aus
  useEffect(() => {
    if (mode !== "live") return undefined;
    const el = track.current;
    const viewport = el.querySelector("[data-viewport]");
    let raf = 0;
    let lastChapter = -1;
    const frame = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const top = parseFloat(getComputedStyle(viewport).top) || 0;
      const total = Math.max(1, r.height - viewport.offsetHeight);
      const p = clamp((top - r.top) / total);
      store.p = p;
      if (p > 0.06 && !store.skipIntro && !store.matStart) store.skipIntro = true;
      const { index } = chapterAt(p);
      if (index !== lastChapter) {
        if (lastChapter !== -1 && (CHAPTERS[index].cut || CHAPTERS[lastChapter]?.cut)) setCut((n) => n + 1);
        lastChapter = index;
        setChapter(index);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mode, store]);

  // Intro: Umriss zeichnen → materialisieren
  useEffect(() => {
    const st = store;
    st.onOutline = (out) => {
      if (st.skipIntro || st.matStart) return;
      setOutline(out);
      setIntro("draw");
      timers.current.push(
        setTimeout(() => {
          st.matStart = performance.now();
          setIntro("mat");
        }, 1900),
        setTimeout(() => setIntro("done"), 4200)
      );
    };
    const t = timers.current;
    return () => {
      st.onOutline = null;
      t.forEach(clearTimeout);
    };
  }, [store]);

  // Falls die Silhouette nicht kommt (Modell lädt langsam): nicht ewig warten
  useEffect(() => {
    if (!load) return undefined;
    const id = setTimeout(() => {
      const st = store;
      if (!st.matStart && !st.skipIntro) {
        st.matStart = performance.now();
        setIntro("mat");
        timers.current.push(setTimeout(() => setIntro("done"), 2200));
      }
    }, 9000);
    return () => clearTimeout(id);
  }, [load, store]);

  // Ziehen zum Drehen (Maus/Touch; vertikal bleibt Scrollen: touch-action pan-y)
  const drag = useRef(null);
  const onPointerDown = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0) return;
    drag.current = { x: e.clientX, id: e.pointerId };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.currentTarget.dataset.dragging = "";
  }, []);
  const onPointerMove = useCallback((e) => {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    const dx = e.clientX - drag.current.x;
    drag.current.x = e.clientX;
    store.yawTarget += dx * 0.009;
  }, [store]);
  const onPointerUp = useCallback((e) => {
    drag.current = null;
    delete e.currentTarget.dataset.dragging;
  }, []);
  const rotate = (dir) => {
    store.yawTarget += dir * STEP;
  };
  const onKey = (e) => {
    if (e.key === "ArrowLeft") {
      rotate(-1);
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      rotate(1);
      e.preventDefault();
    }
  };
  const togglePause = () => {
    store.paused = !store.paused;
    setPaused(store.paused);
  };

  const live = mode === "live";
  const plate = plateFor(chapter);

  return (
    <section
      ref={track}
      className={s.track}
      data-kino-track=""
      data-mode={mode}
      data-chapter={chapter}
      data-intro={intro}
      aria-label="3D-Bühne: Erst die Linie. Dann Ihr Raum."
    >
      <div className={s.viewport} data-viewport="">
        {/* Bild-Ebene */}
        <div className={s.stage}>
          <figure className={s.still}>
            {/* eslint-disable-next-line @next/next/no-img-element -- statisches Standbild, eigene Größe, kein Optimierer nötig */}
            <img src={still.src} width={still.w} height={still.h} alt={still.alt} fetchPriority="low" decoding="async" />
            <figcaption>{still.caption}</figcaption>
          </figure>
          <div
            className={s.canvas}
            aria-hidden="true"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {live && load && <Scene store={store} models={models} mobile={mobile} active={active} />}
          </div>
          <svg className={s.floorLine} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M-2 72 C 30 71.6, 62 72.4, 102 71.8" pathLength="1" vectorEffect="non-scaling-stroke" />
          </svg>
          {outline && (
            <svg className={s.pencil} aria-hidden="true">
              <defs>
                <filter id="kino-graphit" x="-5%" y="-5%" width="110%" height="110%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
                  <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" />
                </filter>
              </defs>
              <g filter="url(#kino-graphit)">
                <path className={s.stroke} d={outline.d} pathLength="1" />
                <path className={s.stroke2} d={outline.d} pathLength="1" transform="translate(1.2 0.8)" />
                <path
                  className={s.construct}
                  pathLength="1"
                  d={`M${(outline.box.x - outline.box.w * 0.18).toFixed(1)} ${(outline.box.y + outline.box.h).toFixed(1)}H${(outline.box.x + outline.box.w * 1.18).toFixed(1)}M${(outline.box.x + outline.box.w / 2).toFixed(1)} ${(outline.box.y - 14).toFixed(1)}V${(outline.box.y + outline.box.h + 14).toFixed(1)}`}
                />
              </g>
            </svg>
          )}
          <div className={s.cutFlash} key={cut} data-on={cut > 0 ? "" : undefined} aria-hidden="true" />
          <div className={s.vignette} aria-hidden="true" />
          <div className={s.grain} aria-hidden="true" />
        </div>

        {/* Klappe: Szene + Kapitel */}
        <p className={s.slate} aria-hidden="true">
          <span>Szene {String(chapter + 1).padStart(2, "0")}</span>
          <span>{copy.slates[chapter]}</span>
          <span className={s.slateMood}>{chapter < 3 ? "Morgen am See" : chapter === 3 ? "Nachmittag" : "Abend"}</span>
        </p>

        {/* Titelkarten */}
        <div className={s.cards}>
          {copy.cards.map((c, i) => {
            const H = i === 0 ? "h1" : "h2";
            return (
              <article key={c.id} className={`${s.card} ${s[`card_${c.id}`] || ""}`} data-c={i} aria-current={live && chapter === i ? "step" : undefined}>
                {c.overline && <p className={s.overline}>{c.overline}</p>}
                <H className={i < 2 ? s.titleXL : s.titleL}>{c.title}</H>
                {c.text && <p className={s.text}>{c.text}</p>}
                {c.note && <p className={s.note}>{c.note}</p>}
                {c.worlds && (
                  <ul className={s.worlds}>
                    {c.worlds.map((w) => (
                      <li key={w.id}>
                        <SmartLink href={w.href} className={s.worldLink}>
                          <span className={s.worldTitle}>{w.title}</span>
                          <span className={s.worldText}>{w.text}</span>
                        </SmartLink>
                      </li>
                    ))}
                  </ul>
                )}
                {c.cta && (
                  <div className={s.ctaRow}>
                    <Button href={c.cta.href} variant="primary" onDark arrow className={s.ctaPrimary}>
                      {c.cta.label}
                    </Button>
                    <a href={c.cta.phoneHref} className={s.phone}>
                      {c.cta.phone}
                    </a>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* Produkt-Schild: live nur das aktuelle, ruhig alle */}
        <div className={s.plates}>
          {models.map((m, i) => (
            <Plate key={m.id} m={m} className={plate === i ? s.plateOn : ""} hidden={live && plate !== i} />
          ))}
        </div>

        {/* Steuerung */}
        <div className={s.controls} role="group" aria-label="3D-Bühne steuern" onKeyDown={onKey} hidden={!live}>
          <p className={s.hint} id="kino-hint">
            Ziehen zum Drehen · Pfeiltasten
          </p>
          <button type="button" className={s.ctl} onClick={() => rotate(-1)} aria-label="Möbel nach links drehen" aria-describedby="kino-hint">
            <span aria-hidden="true">↺</span>
          </button>
          <button type="button" className={s.ctl} onClick={() => rotate(1)} aria-label="Möbel nach rechts drehen" aria-describedby="kino-hint">
            <span aria-hidden="true">↻</span>
          </button>
          <button type="button" className={`${s.ctlText} ${s.ctlReset}`} onClick={() => (store.yawTarget = 0)}>
            Ansicht zurücksetzen
          </button>
          <button type="button" className={s.ctlText} onClick={togglePause} aria-pressed={paused}>
            {paused ? "Kamerafahrt fortsetzen" : "Kamerafahrt anhalten"}
          </button>
        </div>

        <ol className={s.progress} aria-hidden="true">
          {CHAPTERS.map((c, i) => (
            <li key={c.id} data-on={i <= chapter ? "" : undefined} />
          ))}
        </ol>
        <p className={s.scrollHint} aria-hidden="true">
          Scrollen
        </p>
      </div>
    </section>
  );
}
