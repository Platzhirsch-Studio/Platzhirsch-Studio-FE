import { LinkArrow } from "@/components/ui";
import { PAUSE_PATHS, VIEWBOX, CHAIR_PATH_ID } from "@/lib/wow/pause-paths";
import { inkStrokes, dash } from "@/lib/wow/ink";
import { stageStrokes } from "@/lib/wow/strokes";
import { stageVars, strokeTimings, TIMELINE } from "@/lib/wow/timeline";
import {
  WOW_INVITE,
  WOW_INVITE_MS,
  WOW_MOBILE_SEQUENCE,
  WOW_OPEN,
  WOW_OVERLAY_INTERACTIONS,
  WOW_PHASE,
  WOW_SEEN_KEY,
} from "@/lib/wow/config";
import { codaLabel, codaTarget, wowMessages } from "@/lib/wow/messages";
import { START_SCRIPT } from "@/lib/wow/start-script";
import WowControls from "./WowControls";
import s from "./Pause.module.css";

// "Pause" – the hero image stage (wow-spezifikation, Vision A "Von Hand zum
// Raum", push round 3). Server component: the whole sequence is CSS on server
// HTML; the only client JS is WowControls.
//   first paint: paper, grain and the construction lines stand still (server
//   HTML) → the pen starts when the photo is decoded and the page is hydrated
//   and idle: the room in ONE stroke, then wall edge, fireplace and the two
//   armchairs, each one stroke → evening light comes in on the window side →
//   the light carries the paper away (soft ink mask, compositor only) → the
//   line lies on the full photo with a warm core (1400 ms, push r4 Wächter #4)
//   → rest: the photo alone, full frame (push r4, luxus-cd #3 / Wächter #2:
//   no paper strip at the edge). Once, the drawing glides in to 35 % with the
//   labelled handle "Linie ↔ Raum" and springs back (invitation, awwwards #2);
//   "Die Linie zeigen" opens the comparison slider at 50 %. The closing line
//   "Erst die Linie. Dann Ihr Raum." appears under the stage (luxus-cd #5).
// Push r4 (Wächter #1, Safari blocker): the comparison edge is no longer a
// clip-path animation but two counter-moving transforms (.cut / .cutIn), the
// same compositor technique as the release.
// First paint (luxus-cd #2 "kein leeres Papier"): the construction lines AND a
// faint pencil underdrawing of the whole room stand from frame 0; the pen
// inks over it.
// Three acts (Linie · Licht · Raum): the r2 card model is gone (awwwards #2:
// "Keilblock statt L-Form"); Phase B brings a photo of a real cardboard model.
// The PHOTO never moves: it is the preloaded LCP <img>, painted from frame 0
// and fully opaque underneath; everything happens on layers ABOVE it.
// Photo and drawing share viewBox 0 0 2048 1228 with object-fit: cover /
// object-position 50 % 100 % and preserveAspectRatio="xMidYMax slice", so they
// crop identically at every width (push r3: phones use a 2:1 frame and lose
// the ceiling, not the armchair feet – registration test in e2e).

const ms = (n) => `${n}ms`; // CSS times
const STROKES = inkStrokes(PAUSE_PATHS);
// R5-fix P2 (technik P1-2): no line over the armchairs (probably Minotti) until
// the written image sign-off – not in the underdrawing, the pen or the rest.
// Selection and reason: src/lib/wow/strokes.js.
const { guides: GUIDES, pens: PENS, under: UNDER, rest: REST } = stageStrokes(STROKES);
const CHAIR = PAUSE_PATHS.find((p) => p.id === CHAIR_PATH_ID);
const FIT = "xMidYMax slice";
// R8 (technik P1-1, RSC payload on /de): every pen path was written out four
// to five times (underdrawing, core, swell, belly, light core) – in the HTML
// AND again in the RSC payload. Now each pen path is defined ONCE (<defs>,
// with pathLength 1 and non-scaling stroke on the path itself, since
// vector-effect is not inherited into a <use> clone) and the layers are
// <use> clones; stroke, dash and animation are inherited from the <use>.
const pid = (p) => `wow-p-${p.id}`;
const ref = (p) => `#${pid(p)}`;

export default function WowStage({ img, alt, locale, className }) {
  const t = wowMessages(locale);
  const time = strokeTimings();
  const overlay = WOW_OVERLAY_INTERACTIONS;
  const descId = "wow-stage-desc";
  const coda = codaTarget(locale); // /de/arbeitsweise, marked German outside DE (Runde 2 P2)

  return (
    <figure
      data-wow-stage=""
      data-wow="play"
      data-wow-state="room"
      data-wow-mobile={WOW_MOBILE_SEQUENCE ? undefined : "still"}
      aria-label={t.stage.label}
      aria-describedby={descId}
      className={`${s.stage} ${className || ""}`}
      style={{
        ...stageVars(),
        "--cut": "0%",
        "--invite": `${WOW_INVITE}%`,
        "--invite-t": `${WOW_INVITE_MS}ms`,
      }}
      suppressHydrationWarning
    >
      <div className={s.frame} data-wow-frame="">
        <picture>
          <source
            media="(min-width: 640px)"
            srcSet={img.desktop.srcSet}
            sizes={img.desktop.sizes}
          />
          <img
            {...img.mobileImg}
            alt={alt}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="object-cover object-bottom"
          />
        </picture>

        {/* R5-USP (gesamtwerk P1-5, bewusst geändert): the line no longer
            vanishes ~2 s after it is drawn. The resting end state is the
            registration of the climax – ink pen plus warm core on the photo –
            as its own static layer UNDER the paper (so an opened comparison
            still shows paper on the left). It stands from the outro on (step,
            no fade: the sequence layers fade out above it, so nothing
            blinks), at once without motion (data-wow="still"), and leaves
            only while the comparison is open or "Nur das Foto" was chosen
            (data-wow-line / data-wow-photo). <use> clones of the <defs>
            below, no second copy of the path data. */}
        <svg
          className={`${s.layer} ${s.rest}`}
          data-wow-rest=""
          viewBox={VIEWBOX}
          preserveAspectRatio={FIT}
          aria-hidden="true"
          focusable="false"
        >
          <g className={s.restInk}>
            {REST.map((p) => (
              <use key={p.id} href={ref(p)} data-detail={p.detail} />
            ))}
          </g>
          <g className={s.restLit}>
            {REST.map((p) => (
              <use key={p.id} href={ref(p)} data-detail={p.detail} />
            ))}
          </g>
        </svg>

        {/* Paper. .sweep carries a soft ink mask and travels from the window
            side to the fireplace wall; .sheet moves the other way by the same
            amount, so the paper stands still while its edge moves – two
            transforms, both on the compositor (Wächter #2). The warm light
            wedge rides at the edge, on the paper only (the photo is never
            tinted). At rest it lies behind the comparison edge (.cut). */}
        {/* Comparison edge: .cut moves right by --cut − 100 %, .cutIn moves
            back by the same amount, so the drawing stands still while the edge
            travels (transforms only – Safari fix, Wächter #1). During the
            sequence both are untransformed (= the full drawing). */}
        <div className={s.cut} data-wow-cut="" aria-hidden="true">
          <div className={s.cutIn}>
            <div className={s.paper} data-wow-paper="">
              <div className={s.sweep}>
                <div className={s.sheet}>
                  <svg
                    className={s.layer}
                    viewBox={VIEWBOX}
                    preserveAspectRatio={FIT}
                    focusable="false"
                  >
                    <defs>
                      <pattern
                        id="wow-grid"
                        width="64"
                        height="64"
                        patternUnits="userSpaceOnUse"
                      >
                        <rect width="64" height="64" className={s.paperFill} />
                        <path d="M64 0H0V64" className={s.gridLine} />
                      </pattern>
                    </defs>
                    <rect width="2048" height="1228" fill="url(#wow-grid)" />
                  </svg>
                  {/* Paper grain: CSS gradients, not an image (an image here became
                  the LCP element on phones, push r2 measurement). */}
                  <div className={s.grain} />
                </div>
                <div className={s.wedge} data-wow-light="" />
              </div>
            </div>

            {/* The line – construction lines stand from the first paint, then the
            pen. "ink" pen: a thin core drawn with stroke-dashoffset, the ink
            (swell / belly) soaks in behind it. "wipe" pen (page not hydrated
            in time, timeline.js): .inkSweep / .inkSheet reveal the finished
            drawing with a soft mask from the window side – compositor only. */}
            {/* construction lines + pencil underdrawing: outside the pen wrapper,
            they stand from the first paint (luxus-cd #2) */}
            <svg
              className={`${s.layer} ${s.lines}`}
              viewBox={VIEWBOX}
              preserveAspectRatio={FIT}
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                {PENS.map((p) => (
                  <path key={p.id} id={pid(p)} d={p.rd} pathLength="1" vectorEffect="non-scaling-stroke" />
                ))}
              </defs>
              <g className={s.guides} data-wow-guides="">
                {GUIDES.map((p) => (
                  <path key={p.id} d={p.rd} />
                ))}
                <g className={s.under} data-wow-under="">
                  {UNDER.map((p) => (
                    <use key={p.id} href={ref(p)} data-detail={p.detail} />
                  ))}
                </g>
              </g>
            </svg>
            <div className={s.ink}>
              <div className={s.inkSweep}>
                <div className={s.inkSheet}>
                  <svg
                    className={`${s.layer} ${s.lines}`}
                    data-wow-clock=""
                    viewBox={VIEWBOX}
                    preserveAspectRatio={FIT}
                    aria-hidden="true"
                    focusable="false"
                  >
                    <g id="wow-strokes">
                      {PENS.map((p) => (
                        <g
                          key={p.id}
                          data-detail={p.detail}
                          data-gesture={p.gesture ? "" : undefined}
                          style={{
                            "--d": ms(time[p.id].delay),
                            "--t": ms(time[p.id].dur),
                          }}
                        >
                          <use href={ref(p)} className={s.stroke} />
                          {p.swell && <use href={ref(p)} className={s.swell} style={dash(p.swell)} />}
                          {p.belly && <use href={ref(p)} className={s.belly} style={dash(p.belly)} />}
                        </g>
                      ))}
                    </g>
                    {/* Warm light core for the registration on the dark photo. */}
                    <g className={s.lit} data-wow-lit="">
                      {PENS.map((p) => (
                        <use key={p.id} href={ref(p)} data-detail={p.detail} />
                      ))}
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Armchair contour ON the photo while "Termin wählen" is hovered or
            focused – only with the overlay sign-off (Minotti rule, image
            register); never at rest (luxus-cd #2). */}
        {overlay && (
          <svg
            className={s.layer}
            viewBox={VIEWBOX}
            preserveAspectRatio={FIT}
            aria-hidden="true"
            focusable="false"
          >
            <path
              d={CHAIR.d}
              pathLength="1"
              className={s.chairPath}
              data-wow-chair=""
            />
          </svg>
        )}

        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: START_SCRIPT }}
        />
      </div>

      {/* From lg: the horizon of the photo runs on to the left over the paper
          of the page and stops 16 px before the H1 where it would touch a
          line of it (WowControls measures the type – awwwards #4, Wächter #5). */}
      <div className={s.reach} data-wow-reach="" aria-hidden="true">
        <span className={s.horizon} />
      </div>

      <span className={s.rule} aria-hidden="true" />

      <WowControls
        labels={{ show: t.show, slider: t.slider }}
        end={TIMELINE.end}
        open={WOW_OPEN}
        inviteMs={WOW_INVITE_MS}
        mobileSequence={WOW_MOBILE_SEQUENCE}
        seenKey={WOW_SEEN_KEY}
        cls={{
          show: s.show,
          glyph: s.glyph,
          track: s.track,
          rail: s.rail,
          handle: s.handle,
          grip: s.grip,
          gripLabel: s.gripLabel,
        }}
      />

      <p id={descId} className="sr-only">
        {t.stage.description}
      </p>
      <figcaption className={s.caption}>
        {/* QM shell-home r4: the credit wrapped as "Linie: Zeichen / des
            Studios" (iPad) and FR put the colon at a line start ("Ligne" /
            ": signe"). From 640 px each part between " · " stays on one line,
            the "·" ends the part before it, and the French space before ":"
            is a narrow no-break space (U+202F). */}
        <span className={s.credit}>
          {String(WOW_PHASE === "B" ? t.caption.phaseB : t.caption.phaseA)
            .split(" · ")
            .map((part, i, all) => (
              <span key={i}>
                {i > 0 ? " " : null}
                <span className="sm:whitespace-nowrap">
                  {part.replace(/ ([:;!?])/g, "\u202f$1")}
                  {i < all.length - 1 ? "\u00a0·" : null}
                </span>
              </span>
            ))}
        </span>
        {/* Peak-End (luxus-cd #5) and the bridge to the process page.
            Phones get the same line under "Termin wählen" (WowCoda); there
            the credit above stands small on the photo (Runde 2 P2, ux P2-5). */}
        <span className={s.coda} data-wow-coda="">
          <span className={s.codaText}>{t.coda.text}</span>
          <LinkArrow href={coda.href} locale={coda.locale} hrefLang={coda.germanOnly ? "de" : undefined}>
            {codaLabel(locale)}
          </LinkArrow>
        </span>
      </figcaption>
    </figure>
  );
}
