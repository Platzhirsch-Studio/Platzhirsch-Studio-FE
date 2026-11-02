"use client";
// Kino-Lab 1 „Showroom-Film“ – die Startseite als Film in sechs Szenen.
//
// Aufbau: eine Bühne (sticky, 100svh, aria-hidden) mit dem bewegten Bild,
// darüber ein HUD (Szenen-Navigation, Timecode, Pause) und darüber die sechs
// echten <section>s im Fluss (je 100svh, scroll-snap). Die Szene ergibt sich
// aus der Scroll-Position; an jeder Grenze schneidet der Shader mit kurzer
// Abblende (shader.js, SCENES).
//
// Bewegtbild:
//   - public/video/hero.mp4 vorhanden (page.js prüft am Server) → <video>
//     (stumm, Schleife, nur mit Bewegung erlaubt; AmbientPlay-Regeln)
//   - sonst WebGL-Kamerafahrt über das eigene Showroom-Foto (shader.js)
// Erstes Bild: Standbild (next/image, preload) – der Film blendet erst nach
// dem ersten Paint und geladenem Foto darüber.
// Ruhige Fassung (prefers-reduced-motion oder „Ruhige Ansicht“
// html[data-motion="reduced"]): keine Bühne, jede Szene mit eigenem Standbild,
// alle Texte sofort sichtbar, kein Snap, keine Überblendungen.
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import SmartLink from "@/components/ui/SmartLink";
import { motionAllowed } from "@/components/Video/AmbientPlay";
import { createFilmRenderer, sceneState } from "./shader";
import s from "./film.module.css";

const PHOTO = "/Images/Home/aboutHome.jpg";
const VIDEO = "/video/hero.mp4";
const SCENE_NAMES = ["Die Linie", "Der Raum", "Minotti Studio", "Wasser & Wärme", "Abend im Café", "Abspann"];
const PHOTO_CREDIT = "Foto: Heidegger Fotografie";

function useMotionOk() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const sync = () => setOk(motionAllowed());
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    media?.addEventListener?.("change", sync);
    sync();
    return () => {
      mo.disconnect();
      media?.removeEventListener?.("change", sync);
    };
  }, []);
  return ok;
}

/** Zerlegt den belegten Studio-Titel in Name / „by …“ / Zusatz. */
function splitStudioTitle(title) {
  const [name = "", rest = ""] = String(title || "").split(/\s[–-]\s/);
  const [studio, by] = name.split(/\sby\s/);
  return { studio: studio || name, by: by ? `by ${by}` : "", rest };
}

function Still({ position = "50% 50%", tone, preload = false }) {
  return (
    <div className={s.still} data-tone={tone || undefined} aria-hidden="true">
      <Image src={PHOTO} alt="" fill sizes="100vw" quality={70} preload={preload} loading={preload ? undefined : "lazy"} style={{ objectPosition: position }} />
    </div>
  );
}

export default function Film({ data }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const pausedRef = useRef(false);
  const sceneRef = useRef(0);
  const motionOk = useMotionOk();
  const [live, setLive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [scene, setScene] = useState(0);
  const [well, setWell] = useState(0);
  const { hasVideo } = data;

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Szene aus der Scroll-Position (auch ohne WebGL: HUD, Wellness-Wechsel)
  const readProgress = useCallback(() => {
    const root = rootRef.current;
    if (!root) return 0;
    const h = window.innerHeight || 1;
    return -root.getBoundingClientRect().top / h;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const p = readProgress();
      const next = Math.min(SCENE_NAMES.length - 1, Math.max(0, Math.round(p)));
      if (next !== sceneRef.current) {
        sceneRef.current = next;
        setScene(next);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [readProgress]);

  // Texte der Szenen 2–6 blenden ein, sobald die Szene im Bild ist
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const sections = root.querySelectorAll("section[data-scene-index]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.setAttribute("data-in", "");
      },
      { threshold: 0.35 },
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Scroll-Snap nur mit Bewegung (Szenenschnitte)
  useEffect(() => {
    if (!motionOk) return undefined;
    const html = document.documentElement;
    const prev = html.style.scrollSnapType;
    html.style.scrollSnapType = "y proximity";
    return () => {
      html.style.scrollSnapType = prev;
    };
  }, [motionOk]);

  // Bewegtbild: Video-Slot oder WebGL-Film
  useEffect(() => {
    if (!motionOk) return undefined;
    if (hasVideo) {
      const video = videoRef.current;
      if (!video) return undefined;
      const sync = () => {
        if (!pausedRef.current && !document.hidden) {
          video.muted = true;
          video.play().catch(() => {});
        } else video.pause();
      };
      const onPlaying = () => setLive(true);
      video.addEventListener("playing", onPlaying);
      document.addEventListener("visibilitychange", sync);
      sync();
      return () => {
        video.removeEventListener("playing", onPlaying);
        document.removeEventListener("visibilitychange", sync);
        video.pause();
      };
    }

    let cancelled = false;
    let renderer = null;
    let raf = 0;
    let t = 0;
    let last = 0;
    let slow = 0;
    let scale = 1;
    const pointer = [0, 0];
    const target = [0, 0];
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return undefined;

    const resize = () => {
      const small = window.innerWidth < 760;
      const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5) * scale;
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    const onPointer = (e) => {
      target[0] = (e.clientX / window.innerWidth) * 2 - 1;
      target[1] = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0.016;
      last = now;
      const rect = root.getBoundingClientRect();
      if (document.hidden || rect.bottom < 0 || rect.top > window.innerHeight) return;
      // Tempo-Wächter: dauerhaft unter ~45 fps → Auflösung senken
      if (dt > 0.022) slow += 1;
      else slow = Math.max(0, slow - 1);
      if (slow > 50 && scale > 0.6) {
        scale = Math.max(0.6, scale - 0.2);
        slow = 0;
        resize();
      }
      if (!pausedRef.current) {
        t += dt;
        pointer[0] += (target[0] - pointer[0]) * Math.min(1, dt * 2.2);
        pointer[1] += (target[1] - pointer[1]) * Math.min(1, dt * 2.2);
      }
      const p = -rect.top / (window.innerHeight || 1);
      const img = renderer.image;
      const state = sceneState(p, t, canvas.width / canvas.height, img.naturalWidth / img.naturalHeight);
      renderer.render(state, t, pointer);
    };

    const start = () => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = PHOTO;
      image
        .decode()
        .then(() => {
          if (cancelled) return;
          resize();
          renderer = createFilmRenderer(canvas, image);
          renderer.image = image;
          raf = requestAnimationFrame((n) => {
            frame(n);
            if (!cancelled) setLive(true);
          });
          window.addEventListener("resize", resize);
          window.addEventListener("pointermove", onPointer, { passive: true });
        })
        .catch(() => {
          // kein WebGL / Bild nicht geladen → ruhige Standbilder bleiben
          if (!cancelled) setLive(false);
        });
    };
    // Effekte erst nach dem ersten Paint
    const idle = window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 900 }) : window.setTimeout(start, 200);

    return () => {
      cancelled = true;
      if (window.cancelIdleCallback && window.requestIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      renderer?.destroy();
      setLive(false);
    };
  }, [motionOk, hasVideo]);

  // Pause wirkt auch aufs Video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !motionOk) return;
    if (paused) video.pause();
    else video.play().catch(() => {});
  }, [paused, motionOk]);

  // Wasser & Wärme: ruhige Überblendung der Herstellerbilder (nur Szene 4)
  useEffect(() => {
    if (!motionOk || paused || scene !== 3) return undefined;
    const id = window.setInterval(() => setWell((w) => (w + 1) % data.wellness.length), 5200);
    return () => window.clearInterval(id);
  }, [motionOk, paused, scene, data.wellness.length]);

  const studio = data.minotti ? splitStudioTitle(data.minotti.title) : null;
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div
      ref={rootRef}
      className={s.root}
      data-kino-film=""
      data-motion-ok={motionOk ? "" : undefined}
      data-live={live && motionOk ? "" : undefined}
      data-scene={scene}
      data-video={hasVideo ? "" : undefined}
    >
      {/* Bühne: bewegtes Bild (dekorativ) */}
      <div className={s.stage} aria-hidden="true">
        {hasVideo ? (
          <video ref={videoRef} className={s.video} muted loop playsInline preload="metadata" poster={PHOTO} tabIndex={-1}>
            <source src={VIDEO} type="video/mp4" />
          </video>
        ) : (
          <canvas ref={canvasRef} className={s.canvas} />
        )}
        <div className={s.stageDim} />
        <div className={s.grain} />
        <div className={s.barTop} />
        <div className={s.barBottom} />
      </div>

      {/* HUD: Szenen, Timecode, Pause */}
      <div className={s.hud}>
        <nav className={s.chapters} aria-label="Szenen des Films">
          <ol>
            {SCENE_NAMES.map((name, i) => (
              <li key={name}>
                <a href={`#kf-${i + 1}`} aria-current={scene === i ? "step" : undefined}>
                  <span className={s.chapterNo} aria-hidden="true">{pad(i + 1)}</span>
                  <span className={s.chapterName}>{name}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <p className={s.timecode} aria-hidden="true">
          <span className={s.tcNo}>Szene {pad(scene + 1)}</span>
          <span className={`${s.tcSep} ${s.tcNo}`} />
          <span>{SCENE_NAMES[scene]}</span>
        </p>
        {motionOk && (
          <button type="button" className={s.pause} onClick={() => setPaused((v) => !v)} data-kino-pause="">
            <span className={s.pauseIcon} data-state={paused ? "play" : "pause"} aria-hidden="true" />
            {paused ? "Film fortsetzen" : "Film anhalten"}
          </button>
        )}
      </div>

      {/* Szene 1 – Die Linie */}
      <section id="kf-1" className={`${s.scene} ${s.s1}`} data-scene-index="0" aria-labelledby="kf-1-h">
        <Still preload />
        <svg className={s.line} viewBox="0 0 1440 810" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
          <path
            pathLength="1"
            d="M -20 640 C 150 636 250 628 318 598 C 350 584 366 556 398 550 L 636 546 C 662 546 670 528 694 526 L 972 522 C 1004 522 1016 538 1036 546 L 1186 550 C 1226 552 1240 520 1240 470 L 1240 310 C 1240 296 1254 288 1266 294 C 1286 306 1296 334 1296 364 L 1296 560 C 1318 604 1398 622 1460 624"
          />
          <path className={s.lineThin} pathLength="1" d="M 806 300 L 1440 160 M 806 300 L 1440 420 M 806 300 L 0 140 M 806 300 L 0 470" />
        </svg>
        <div className={s.card}>
          <p className={s.over}>Platzhirsch Home Living · Lochau am Bodensee</p>
          <h1 id="kf-1-h" className={s.h1}>
            <span className={s.h1Line}>Erst die Linie.</span>
            <span className={`${s.h1Line} ${s.italic}`}>Dann Ihr Raum.</span>
          </h1>
          <p className={s.lede}>Harald Menghin zeichnet Konzepte von Hand – zuerst die Linie, dann den Raum.</p>
          <a className={s.cue} href="#kf-2">
            Film ansehen <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      {/* Szene 2 – Der Raum */}
      <section id="kf-2" className={`${s.scene} ${s.s2}`} data-scene-index="1" aria-labelledby="kf-2-h">
        <Still position="58% 50%" />
        <div className={`${s.card} ${s.reveal}`}>
          <p className={s.over}>Szene 2 · Der Raum</p>
          <h2 id="kf-2-h" className={s.h2}>Ein Raum zum Hineingehen.</h2>
          <p className={s.lede}>Sofas, Sessel, Teppiche und Licht – im Showroom in Lochau so zusammengestellt, wie man darin wohnt.</p>
          <p className={s.credit}>Showroom Platzhirsch Home Living, Lochau · {PHOTO_CREDIT}</p>
        </div>
      </section>

      {/* Szene 3 – Titelkarte Minotti Studio */}
      <section id="kf-3" className={`${s.scene} ${s.s3}`} data-scene-index="2" aria-labelledby="kf-3-h">
        <Still position="82% 50%" tone="dark" />
        <div className={`${s.titleCard} ${s.reveal}`}>
          <p className={s.over}>Szene 3</p>
          {studio ? (
            <>
              <h2 id="kf-3-h" className={s.studio}>
                <span className={s.studioName}>{studio.studio}</span>
                {studio.by && <span className={s.studioBy}>{studio.by}</span>}
              </h2>
              {studio.rest && <p className={s.studioSince}>{studio.rest}</p>}
              <p className={s.small}>
                {data.minotti.statement}
                {data.minotti.evidenceUrl && (
                  <>
                    {" "}
                    <a href={data.minotti.evidenceUrl} target="_blank" rel="noopener noreferrer" className={s.inlineLink}>
                      Pressemeldung von Minotti<span className="sr-only"> (öffnet in neuem Tab)</span>
                    </a>
                  </>
                )}
              </p>
            </>
          ) : (
            <h2 id="kf-3-h" className={s.studio}>
              <span className={s.studioName}>Minotti in Lochau</span>
            </h2>
          )}
        </div>
      </section>

      {/* Szene 4 – Wasser & Wärme (Herstellerbilder ganz, unverändert, ohne Zoom) */}
      <section id="kf-4" className={`${s.scene} ${s.s4}`} data-scene-index="3" aria-labelledby="kf-4-h">
        <div className={`${s.wellText} ${s.reveal}`}>
          <p className={s.over}>Szene 4 · Bad &amp; Wellness</p>
          <h2 id="kf-4-h" className={s.h2}>Wasser &amp; Wärme.</h2>
          <p className={s.lede}>Bad, Sauna und Wellness – geplant mit derselben Linie wie der Wohnraum.</p>
          {data.wellnessDealer && <p className={s.small}>{data.wellnessDealer}</p>}
        </div>
        <ul className={s.wellList} data-well-active={well}>
          {data.wellness.map((w, i) => (
            <li key={w.src} className={s.wellItem} data-active={i === well ? "" : undefined}>
              <figure className={s.wellFigure}>
                <div className={s.wellFrame}>
                  <Image src={w.src} alt={w.alt} width={w.width} height={w.height} unoptimized loading="lazy" className={s.wellImg} />
                </div>
                <figcaption className={s.credit}>Bild: {w.brand}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      {/* Szene 5 – Abend im Café */}
      <section id="kf-5" className={`${s.scene} ${s.s5}`} data-scene-index="4" aria-labelledby="kf-5-h">
        <Still position="50% 34%" tone="evening" />
        <div className={`${s.card} ${s.cardRight} ${s.reveal}`}>
          <p className={s.over}>Szene 5 · Abend im Café</p>
          <h2 id="kf-5-h" className={s.h2}>Und danach: das Café im Haus.</h2>
          <p className={s.lede}>Nach dem Rundgang bleiben, reden, die Skizze noch einmal ansehen. Café: {data.cafeHours}.</p>
          <p className={s.credit}>{PHOTO_CREDIT}</p>
        </div>
      </section>

      {/* Szene 6 – Abspann */}
      <section id="kf-6" className={`${s.scene} ${s.s6}`} data-scene-index="5" aria-labelledby="kf-6-h">
        <div className={`${s.credits} ${s.reveal}`}>
          <p className={s.over}>Abspann</p>
          <h2 id="kf-6-h" className={s.h2}>Die nächste Szene spielt bei Ihnen.</h2>
          <dl className={s.roll}>
            <div>
              <dt>Linie</dt>
              <dd>Harald Menghin</dd>
            </div>
            <div>
              <dt>Ort</dt>
              <dd>
                <address className={s.address}>
                  Platzhirsch Home Living
                  <br />
                  {data.address.street}, {data.address.postalCode} {data.address.city}, {data.address.country}
                </address>
              </dd>
            </div>
            <div>
              <dt>Showroom</dt>
              <dd>{data.showroomHours}</dd>
            </div>
            <div>
              <dt>Café</dt>
              <dd>{data.cafeHours}</dd>
            </div>
            <div>
              <dt>Telefon</dt>
              <dd>
                <a href={data.phone.href} className={s.inlineLink}>
                  {data.phone.display}
                </a>
              </dd>
            </div>
          </dl>
          <div className={s.ctaRow}>
            <SmartLink href={data.termin.href} className={s.cta} data-kino-termin="">
              {data.termin.label}
            </SmartLink>
            {data.termin.write && (
              <SmartLink href={data.termin.write.href} className={s.ctaGhost} data-termin-write="">
                {data.termin.write.label}
              </SmartLink>
            )}
            <a href={data.directions} target="_blank" rel="noopener noreferrer" className={s.ctaGhost}>
              Route planen<span className="sr-only"> (Google Maps, öffnet in neuem Tab)</span>
            </a>
          </div>
          <p className={s.end} aria-hidden="true">
            Ende
          </p>
        </div>
      </section>
    </div>
  );
}
