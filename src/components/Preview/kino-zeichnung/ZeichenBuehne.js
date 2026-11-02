"use client";
// Eine Bühne: Linie zeichnet die Szene (Canvas), dann flutet Licht herein und
// die Zeichnung blendet ins Bild über. Hero: eigenes Foto (aboutHome.jpg) mit
// Tiefenunschärfe und langsamer Kamerafahrt. Szenen: Herstellerbild NUR
// unverändert – ganz gezeigt (contain), ohne Zoom, ohne Filter, ohne Linie
// darüber; nur die Deckkraft blendet.
// Ruhige Fassung (Reduced Motion, Ruhige Ansicht, Pause, ohne JS): fertige
// Zeichnung statisch + Bild. Canvas und Zeichnung sind aria-hidden, die
// Szene beschreibt ein unsichtbarer Text, das Bild hat einen Alt-Text.
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createEngine } from "./engine";
import { setPause, usePause, useRuhig } from "./ruhe";
import s from "./kino.module.css";

export default function ZeichenBuehne({ zeichnung, bild, hero = false, beschreibung }) {
  const ruhig = useRuhig();
  const mode = ruhig === null ? undefined : ruhig ? "ruhig" : "live";
  const [phase, setPhase] = useState("idle");
  const [lauf, setLauf] = useState(0);
  const figRef = useRef(null);
  const svgRef = useRef(null);
  const inkRef = useRef(null);
  const fxRef = useRef(null);
  const panelRef = useRef(null);
  const [vw, vh] = zeichnung.viewBox;

  useEffect(() => {
    if (mode !== "live") return undefined;
    const fig = figRef.current;
    const engine = createEngine({
      svg: svgRef.current,
      ink: inkRef.current,
      fx: fxRef.current,
      panel: panelRef.current,
      viewBox: zeichnung.viewBox,
      licht: zeichnung.licht,
      fit: hero ? "cover" : "contain",
      hero,
      onPhase: setPhase,
    });
    let timer = 0;
    let trigger = null;
    if (hero) {
      // erster Paint zuerst (Titel steht sofort), dann zeichnen
      timer = window.setTimeout(() => engine.start(), 380);
    } else {
      trigger = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            engine.start();
            trigger.disconnect();
          }
        },
        { threshold: 0.45 }
      );
      trigger.observe(fig);
    }
    const sicht = new IntersectionObserver(([e]) => engine.setVisible(e.isIntersecting));
    sicht.observe(fig);
    return () => {
      window.clearTimeout(timer);
      trigger?.disconnect();
      sicht.disconnect();
      engine.destroy();
    };
  }, [mode, lauf, hero, zeichnung]);

  const nochmal = () => {
    setPhase("idle");
    setLauf((n) => n + 1);
  };

  return (
    <figure
      ref={figRef}
      className={`${s.stage} ${hero ? s.stageHero : s.stageSzene}`}
      data-mode={mode}
      data-phase={mode === "live" ? phase : undefined}
      style={{ "--ar": `${bild.width} / ${bild.height}` }}
    >
      <div className={s.frames}>
        <div ref={panelRef} className={s.drawPanel} aria-hidden="true">
          <svg
            ref={svgRef}
            className={s.still}
            viewBox={`0 0 ${vw} ${vh}`}
            preserveAspectRatio={hero ? "xMidYMid slice" : "xMidYMid meet"}
            focusable="false"
          >
            {zeichnung.strokes.map((st, i) => (
              <path
                key={i}
                d={st.d}
                data-w={st.w ?? 1}
                data-g={st.g ? "1" : undefined}
                className={st.g ? s.guide : undefined}
                style={{ "--w": st.w ?? 1 }}
              />
            ))}
          </svg>
          <canvas ref={inkRef} className={s.ink} />
          <div className={s.flood} />
          <canvas ref={fxRef} className={s.fx} />
        </div>
        <div className={s.imgPanel}>
          <Image
            src={bild.src}
            alt={bild.alt}
            fill
            preload={hero}
            sizes={hero ? "100vw" : "(min-width: 64rem) 55vw, 100vw"}
            className={hero ? s.imgCover : s.imgContain}
          />
        </div>
      </div>
      <p className="sr-only">{beschreibung}</p>
      <figcaption className={s.caption}>
        {/* Inhaber 31.10.2026: kein Hinweistext an Animationen. Echte Scans nennen weiter ihre Quelle („Skizze: Harald Menghin“). */}
        {zeichnung.animation ? null : <span className={s.vermerk}>{zeichnung.quelle}</span>}
        {bild.credit ? <span>{bild.credit}</span> : null}
      </figcaption>
      {mode === "live" && phase === "done" ? (
        <button type="button" className={s.replay} onClick={nochmal}>
          Noch einmal zeichnen
        </button>
      ) : null}
      {hero ? <PauseSchalter /> : null}
    </figure>
  );
}

function PauseSchalter() {
  const pause = usePause();
  return (
    <button type="button" className={s.pause} aria-pressed={pause} onClick={() => setPause(!pause)}>
      <span aria-hidden="true" className={s.pauseIcon}>
        {pause ? "▶" : "❚❚"}
      </span>
      Bewegung anhalten
    </button>
  );
}
