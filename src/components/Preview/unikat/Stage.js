// Prototyp „Die Linie wird Raum“ – die Bühne (Server Component).
//
// Eine Linie → Skizze → Modell → Raum → Bodensee-Licht, gesteuert vom
// Scrollweg (ScrollStage, ~3 kB Client-JS). Das gesamte Markup (SVG-Striche,
// Modell, Texte) kommt vom Server; ohne Animation (reduced motion, „Ruhige
// Ansicht“) setzt das CSS dieselben Elemente als ruhige Folge untereinander.
// Alle Bilder außer dem Showroom-Foto sind aria-hidden; die Texte der Stufen
// stehen vollständig im DOM, in Lesereihenfolge.
import Image from "next/image";
import s from "./unikat.module.css";
import ScrollStage from "./ScrollStage";
import LichtStimmung from "./LichtStimmung";
import { VIEWBOX, mainLineDesktop, mainLineMobile, sketchScene } from "./drawing";

function Strokes({ list, className }) {
  return (
    <g className={className}>
      {list.map((st, i) => (
        <path key={i} d={st.d} pathLength="1" style={{ "--d": st.delay.toFixed(3), "--w": st.weight.toFixed(2) }} />
      ))}
    </g>
  );
}

function Box({ x, y, w, d, h, tone = "board" }) {
  return (
    <div className={`${s.box} ${s[tone] || ""}`} style={{ left: x, top: y, width: w, height: d, "--h": `${h}px` }}>
      <i className={s.bTop} />
      <i className={s.bFront} />
      <i className={s.bBack} />
      <i className={s.bLeft} />
      <i className={s.bRight} />
    </div>
  );
}

function Model() {
  // Modellmaße in px (Modellraum): Boden 560 × 380, Wandhöhe 230.
  return (
    <div className={s.scene}>
      <div className={s.model}>
        <div className={s.floor}>
          <span className={s.sunPatch} />
          <span className={s.planMarks} />
        </div>
        <div className={`${s.wall} ${s.wallBack}`}>
          <span className={s.window}>
            <span className={s.lake} />
          </span>
        </div>
        <div className={`${s.wall} ${s.wallLeft}`} />
        <div className={`${s.wall} ${s.wallRight}`} />
        <div className={s.furniture}>
          <Box x={80} y={36} w={260} d={92} h={46} />
          <Box x={392} y={170} w={96} d={96} h={54} tone="dark" />
          <Box x={176} y={190} w={130} d={70} h={22} tone="light" />
        </div>
      </div>
    </div>
  );
}

export default function Stage({ copy, nextId }) {
  const sk = sketchScene();
  const lineD = mainLineDesktop();
  const lineM = mainLineMobile();
  const { stage } = copy;
  return (
    <section className={s.stage} aria-labelledby="u-title">
      <ScrollStage className={s.track}>
        <div className={s.viewport} data-viewport="">
          <div className={s.paper} aria-hidden="true" />

          <div className={s.visual} aria-hidden="true">
            {/* 1 LINIE */}
            <div className={`${s.layer} ${s.lineLayer}`}>
              <svg className={s.svg} viewBox={VIEWBOX} preserveAspectRatio="xMidYMid meet" focusable="false">
                <path className={`${s.mainLine} ${s.onlyWide}`} d={lineD} pathLength="1" />
                <path className={`${s.mainLine} ${s.onlyNarrow}`} d={lineM} pathLength="1" />
              </svg>
            </div>

            {/* 2 SKIZZE */}
            <div className={`${s.layer} ${s.sketchLayer}`}>
              <svg className={s.svg} viewBox={VIEWBOX} preserveAspectRatio="xMidYMid meet" focusable="false">
                {/* in der ruhigen Fassung trägt die Skizze die Linie selbst */}
                <path className={`${s.mainLine} ${s.lineInSketch}`} d={lineD} pathLength="1" />
                <Strokes list={sk.construction} className={s.gConstruction} />
                <Strokes list={sk.edges} className={s.gEdges} />
                <Strokes list={sk.win} className={s.gWin} />
                <Strokes list={sk.furniture} className={s.gFurniture} />
                <Strokes list={sk.light} className={s.gLight} />
                <Strokes list={sk.plan} className={s.gPlan} />
                <text x="80" y="268" className={s.planLabel}>
                  Grundriss
                </text>
              </svg>
            </div>

            {/* 3 MODELL */}
            <div className={`${s.layer} ${s.modelLayer}`}>
              <Model />
            </div>

            {/* 4 RAUM – eigenes Foto, unverändert (kein Overlay, keine Tönung) */}
            <div className={`${s.layer} ${s.roomLayer}`}>
              <div className={s.photo}>
                <Image src="/Images/Home/aboutHome.jpg" alt="" fill sizes="(min-width: 900px) 66vw, 100vw" quality={78} fetchPriority="low" />
              </div>
            </div>

            <canvas className={s.pencil} data-pencil="" />
          </div>

          <div className={s.panels}>
            <div className={`${s.panel} ${s.intro}`} data-panel="0">
              <p className={s.overline}>{stage.overline}</p>
              <h2 id="u-title" className={s.title}>
                <span>{stage.title[0]}</span> <span className={s.titleItalic}>{stage.title[1]}</span>
              </h2>
              <p className={s.lead}>{stage.lead}</p>
              <p className={s.hint}>
                <span className={s.hintLine} aria-hidden="true" />
                {stage.hint}
              </p>
              <a className={s.skip} href={`#${nextId}`}>
                {stage.skip}
              </a>
            </div>
            {stage.steps.map((st, i) => (
              <div key={st.id} className={s.panel} data-panel={i + 1}>
                <p className={s.overline}>
                  <span className={s.num}>{st.n}</span> · {st.name}
                </p>
                <h2 className={s.stepTitle}>{st.title}</h2>
                <p className={s.stepText}>{st.text}</p>
                {st.caption && <p className={s.caption}>{st.caption}</p>}
                {st.id === "licht" && (
                  <>
                    <p className={s.lichtText}>
                      <LichtStimmung fallback="Lochau · Licht nach dem Sonnenstand" />
                    </p>
                    <a className={s.inlineLink} href={`/de${st.link.href}`}>
                      {st.link.label}
                    </a>
                  </>
                )}
              </div>
            ))}
          </div>

          <ol className={s.progress} aria-hidden="true">
            {stage.steps.map((st, i) => (
              <li key={st.id} data-tick={i + 1}>
                <span>{st.name}</span>
              </li>
            ))}
          </ol>
        </div>
      </ScrollStage>
    </section>
  );
}
