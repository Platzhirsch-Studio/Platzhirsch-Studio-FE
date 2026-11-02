// Hero of /de/yacht-interior: typographic, on ink-deep, with an own SVG
// stage (no photo – the image register holds a stand-in hero back until an
// own, released photo exists: src/components/Landing/imagery.js). The stage
// is drawn from the same generator as the 3D boat: a daycruiser in elevation
// on the evening lake, centred and at least ~70 % of the stage width.
// - viewBox encloses the whole boat; preserveAspectRatio "xMidYMid meet"
//   keeps it complete on every screen. Sky, ridge and water extend beyond
//   the viewBox (overflow visible), so wide or tall stages never show
//   empty bands – the section clips them.
// - Signature: the line drawing draws itself once (stroke-dashoffset), the
//   reflection settles in the water, and the cabin windows "switch on"
//   while the page is scrolled (scroll-driven animation; time-based
//   fallback); the boat glides in ≈ 5 % from the right with its reflection
//   and waterline (QA round 2). Everything static with reduced motion /
//   "Ruhige Ansicht". The viewBox starts above the hardtop (no empty sky).
// - Layout: phones show title → stage (≤ 40svh) → lead and CTAs, so the
//   waterline and the boat are in the first screen; tablets (md) show title
//   → lead and CTAs → a 45svh stage; from lg the stage spans under the text.
// The H1 stands in the first frame (Bibel §8.2). Server component, 0 KB JS.
// - Tempo (30.10.2026, Lighthouse: ≈ 1 s Paint/Composite): the scene is one
//   picture in several stacked SVG layers with the same viewBox. Everything
//   that moves as a whole (glide, drift, shore lights, reflection, windows,
//   horizon) moves as an HTML layer with transform/opacity, which the
//   compositor animates without repainting the sky, the masked reflection or
//   the water every frame. Only the line drawing (stroke-dashoffset) still
//   paints, and only the small boat layer. Same picture, same timing: the
//   lengths the SVG gave in user units (glide 84, drift 1.5 % = 24, horizon
//   from x = −FAR) are converted with the "meet" scale min(100cqw/1600,
//   100cqh/450) of the scene container (yacht.module.css .scene).
import Image from "next/image";
import { Breadcrumbs, Button, Container, Eyebrow, Heading, Media } from "@/components/ui";
import { buildModel, sideProfile } from "@/lib/yacht/hull";
import { MATERIAL_TONES, TOKENS } from "@/lib/yacht/palette";
import { ADDRESS } from "@/lib/site";
import { ROUTES } from "@/utils/routing";
import { useLocale } from "next-intl";
import { yachtUi } from "@/lib/yacht/ui";
import { bindSeparators } from "@/lib/yacht/typography";
import styles from "./yacht.module.css";
import cinema from "./heroCinema.module.css";

const W = 1600;
const H = 600;
const VB_Y = 150; // viewBox starts just above the hardtop: no empty sky band above the boat
const WATER = 440;
const SCALE = 100; // px per metre
const FAR = 4000; // how far sky, ridge and water reach beyond the viewBox

// Deterministic ridge (Pfänder side of the lake), extended beyond the viewBox.
function ridge(base, seed = 7) {
  const pts = [];
  let a = seed;
  const rand = () => {
    a = (a * 9301 + 49297) % 233280;
    return a / 233280;
  };
  for (let x = -FAR; x <= W + FAR; x += 40) {
    const k = (x + FAR) / (W + 2 * FAR);
    const y = base - (1 - Math.abs(k - 0.42) * 2.2) * 40 - Math.sin(x / 170) * 9 - rand() * 4;
    pts.push(`${x.toFixed(0)},${Math.min(base, y).toFixed(1)}`);
  }
  return `${-FAR},${base + 30} ${pts.join(" ")} ${W + FAR},${base + 30}`;
}

const SHAPE_MATS = new Set(["gelcoat", "glass", "hardtop", "teak"]);

function boatGeometry() {
  const model = buildModel("daycruiser");
  const { sheer, keel } = sideProfile(model.hull);
  const hullPts = [...sheer, ...keel.slice().reverse()].filter(([, py]) => py >= -0.02).concat([[-model.hull.L / 2, 0]]);
  const parts = model.parts.filter((pt) => !pt.steg && !pt.zone && SHAPE_MATS.has(pt.mat) && pt.p[1] > 0 && pt.s[1] > 0.04);
  const platform = model.parts.find((pt) => pt.zone === "badeplattform");
  if (platform) parts.push(platform);
  const windows = model.parts.filter((pt) => pt.mat === "window" && pt.p[2] > 0);
  const xs = model.parts.filter((pt) => !pt.steg && pt.p[1] > -0.1).flatMap((pt) => [pt.p[0] - pt.s[0] / 2, pt.p[0] + pt.s[0] / 2]);
  const cx = (Math.min(...xs, -model.hull.L / 2) + Math.max(...xs, model.hull.L / 2)) / 2;
  return { hullPts, sheer, parts, windows, cx, len: model.hull.L };
}

const P = (list) => list.map(([px, py]) => `${(px * SCALE).toFixed(1)},${(-py * SCALE).toFixed(1)}`).join(" ");

function Boat({ g, stroke = TOKENS.paper, fill = TOKENS.inkDeep, draw = false }) {
  const cls = draw ? styles.stroke : undefined;
  return (
    <>
      <polygon points={P(g.hullPts)} fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" pathLength="1" className={cls} />
      <polyline points={P(g.sheer.map(([x, y]) => [x, Math.min(0.08, y)]))} fill="none" stroke={TOKENS.brass400} strokeOpacity="0.85" strokeWidth="2" pathLength="1" className={cls} />
      {g.parts.map((pt, i) => (
        <rect
          key={i}
          x={(pt.p[0] - pt.s[0] / 2) * SCALE}
          y={-(pt.p[1] + pt.s[1] / 2) * SCALE}
          width={pt.s[0] * SCALE}
          height={Math.max(1.5, pt.s[1] * SCALE)}
          rx={Math.min(pt.r ?? 0, pt.s[1] / 2) * SCALE}
          fill={pt.mat === "glass" ? "none" : fill}
          stroke={stroke}
          strokeWidth="1.3"
          strokeOpacity={pt.mat === "glass" ? 0.6 : 1}
          pathLength="1"
          className={cls}
        />
      ))}
    </>
  );
}

// Windows with the boat offset baked in (no own transform: the hero test reads
// the LAST g[transform] of the scene as the boat). mirror: the reflection,
// i.e. translate(bx WATER) scale(1 −1) applied to every rect.
function Windows({ g, bx, mirror = false }) {
  return g.windows.map((pt, i) => {
    const x = (pt.p[0] - pt.s[0] / 2) * SCALE;
    const y = -(pt.p[1] + pt.s[1] / 2) * SCALE;
    const h = Math.max(3, pt.s[1] * SCALE);
    return <rect key={i} x={bx + x} y={mirror ? WATER - y - h : WATER + y} width={pt.s[0] * SCALE} height={h} rx="2" fill={MATERIAL_TONES.warm} />;
  });
}

/** One layer of the scene: an HTML box (the part the compositor moves) around an SVG with the shared viewBox. */
function Layer({ className = "", children }) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <svg viewBox={`0 ${VB_Y} ${W} ${H - VB_Y}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full overflow-visible" focusable="false">
        {children}
      </svg>
    </div>
  );
}

function ReflectMask({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}-fade`} gradientUnits="userSpaceOnUse" x1="0" y1={WATER} x2="0" y2={WATER + 240}>
        <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <mask id={id} maskUnits="userSpaceOnUse" x={-FAR} y={WATER} width={W + 2 * FAR} height="400">
        <rect x={-FAR} y={WATER} width={W + 2 * FAR} height="400" fill={`url(#${id}-fade)`} />
      </mask>
    </defs>
  );
}

function Scene() {
  const g = boatGeometry();
  const bx = W / 2 - g.cx * SCALE;
  // lights on the far shore (deterministic)
  const shore = Array.from({ length: 14 }, (_, i) => ({ x: 90 + ((i * 397) % 1420), y: WATER - 34 + ((i * 7) % 9) - (i % 4) * 2, r: 1.4 + (i % 3) * 0.5 }));
  return (
    <div className={`absolute inset-0 ${styles.scene}`} aria-hidden="true" data-yacht-scene="">
      {/* still: sky glow, far shore, water – painted once */}
      <Layer>
        <defs>
          <radialGradient id="yacht-sky" gradientUnits="userSpaceOnUse" cx={W * 0.56} cy={WATER - 40} r="900">
            <stop offset="0" stopColor={TOKENS.brass400} stopOpacity="0.42" />
            <stop offset="0.45" stopColor={TOKENS.brass500} stopOpacity="0.14" />
            <stop offset="1" stopColor={TOKENS.inkDeep} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="yacht-water" gradientUnits="userSpaceOnUse" x1="0" y1={WATER} x2="0" y2={H + 260}>
            <stop offset="0" stopColor={TOKENS.see} stopOpacity="0.75" />
            <stop offset="1" stopColor={TOKENS.inkDeep} stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect x={-FAR} y={-FAR} width={W + 2 * FAR} height={FAR + WATER} fill="url(#yacht-sky)" />
        <polygon points={ridge(WATER - 12)} fill={TOKENS.ink} opacity="0.92" />
      </Layer>
      <Layer className={styles.glow}>
        {shore.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={MATERIAL_TONES.warm} opacity="0.75" />
        ))}
      </Layer>
      {/* water (reaches far below the viewBox on tall stages) */}
      <Layer>
        <rect x={-FAR} y={WATER} width={W + 2 * FAR} height={FAR} fill="url(#yacht-water)" />
      </Layer>
      <Layer className={styles.drift}>
        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={i}
            x1={-200 + ((i * 263) % 1900)}
            x2={-200 + ((i * 263) % 1900) + 90 + (i % 3) * 70}
            y1={WATER + 18 + i * 12}
            y2={WATER + 18 + i * 12}
            stroke={TOKENS.stoneDeep}
            strokeOpacity={0.1 + (i % 3) * 0.05}
            strokeWidth="1"
          />
        ))}
      </Layer>

      {/* the boat glides in once (slow camera move): reflection, waterline and boat together */}
      <div className={`absolute inset-0 ${styles.glide}`}>
        {/* reflection: the boat mirrored in the water, fading downwards; its windows switch on with the boat's */}
        <div className={`absolute inset-0 ${styles.reflect}`}>
          <Layer>
            <ReflectMask id="yacht-reflect-mask" />
            <g mask="url(#yacht-reflect-mask)">
              <g transform={`translate(${bx} ${WATER}) scale(1 -1)`}>
                <g opacity="0.5">
                  <Boat g={g} stroke={TOKENS.stoneDeep} fill="none" />
                </g>
              </g>
            </g>
          </Layer>
          <Layer className={styles.windows}>
            <ReflectMask id="yacht-reflect-mask-w" />
            <g mask="url(#yacht-reflect-mask-w)">
              <Windows g={g} bx={bx} mirror />
            </g>
          </Layer>
        </div>
        {/* the boat: line drawing (the only layer that paints while it moves), waterline highlight */}
        <Layer>
          <g transform={`translate(${bx} ${WATER})`}>
            <Boat g={g} draw />
          </g>
          <line x1={bx - g.len * 0.62 * SCALE} x2={bx + g.len * 0.62 * SCALE} y1={WATER + 1.5} y2={WATER + 1.5} stroke={TOKENS.brass400} strokeOpacity="0.8" strokeWidth="1.5" />
        </Layer>
        {/* then the windows switch on */}
        <Layer className={styles.windows}>
          <Windows g={g} bx={bx} />
        </Layer>
      </div>
      <Layer className={styles.horizon}>
        <line x1={-FAR} x2={W + FAR} y1={WATER} y2={WATER} stroke={TOKENS.brass400} strokeOpacity="0.55" strokeWidth="1" />
      </Layer>
    </div>
  );
}

/**
 * @param {{title, eyebrow, lead, crumb, primaryLabel, motto, secondary}} props
 */
// `image`: only once the image register releases an OWN photo (imagery.js,
// `released` not false) – then it replaces the drawn scene. Until then null.
// R7-P4 (R2 ux P2-4, technik P1-5): mobil stehen USP-Satz und Termin-Knopf (thema=yacht) vor der
// Bühne, also im ersten Bildschirm. Die Bühne zieht sich am Desktop nicht mehr mit -10svh unter
// die Textzeile – der Schriftwechsel im Titel verschob sie (CLS 0,211 bei 1440 × 900); die
// Titelspalte hat dort eine feste Mindesthöhe.
// Rat 9,5 A6 (gesamtwerk M3, Inhaber-Entscheidung Nr. 11): `photo` = ein freigegebenes Foto der
// Custom Line Navetta 42 (src/lib/yacht/navetta.js). Es ersetzt die gezeichnete Bühne – UNVERÄNDERT
// (Minotti-Bedingung): Rahmen im eigenen Seitenverhältnis, object-contain, kein Zuschnitt, kein
// Filter, nichts darüber; Bildnachweis und „nicht von Platzhirsch eingerichtet“ direkt darunter.
// Layout: mobil Titel → USP + Knöpfe → Foto; ab lg Text links (1–6), Foto rechts (7–12).
// Die Szene bleibt als Rückfall, solange NAVETTA_RELEASED false ist.
export default function YachtHero({ title, eyebrow, lead, crumb, primaryLabel, motto, secondary, usp = null, ctaHref = ROUTES.beratung.de, image = null, alt = "", photo = null }) {
  const t = yachtUi(useLocale());
  if (photo) return <PhotoHero {...{ title, eyebrow, lead, crumb, primaryLabel, motto, secondary, usp, ctaHref, photo, t }} />;
  return (
    <section aria-labelledby="landing-title" className="relative isolate overflow-hidden bg-ink-deep text-text-inverse" data-yacht-hero="">
      <Container className="relative pt-8 md:pt-12 lg:pt-14">
        <Breadcrumbs tone="dark" items={[{ label: "Home", href: "/" }, { label: crumb }]} className="[&_a]:min-h-11" />
        <div className="mt-4 flex flex-col lg:mt-stack-s lg:grid lg:grid-cols-12 lg:gap-x-8">
          <div className="relative z-10 order-1 lg:col-span-7 lg:min-h-[16rem]">
            <Eyebrow tone="inverse">{bindSeparators(eyebrow)}</Eyebrow>
            <Heading id="landing-title" level={1} size="display-xl" tone="inverse" className="mt-stack-s max-w-[16ch] lg:text-[length:min(5.25rem,6.2vw)]">
              {title}
            </Heading>
            <p className="mt-stack-s min-h-[1.2em] font-display-italic text-display-m text-accent-on-dark max-md:hidden">{motto}</p>
          </div>
          {/* stage: after the title on phones, full width under the text from md */}
          <div
            className="relative order-3 -mx-gutter mt-2 h-[30svh] max-h-[40svh] min-h-[200px] md:mt-2 md:h-[45svh] md:max-h-none md:min-h-[45svh] lg:col-span-12 lg:mt-0 lg:h-[50svh] lg:max-h-[560px] lg:min-h-[360px]"
            data-yacht-stage=""
          >
            {image ? <Media src={image} alt={alt} ratio="21/9" sizes="100vw" preload className="absolute! inset-0 aspect-auto!" /> : <Scene />}
          </div>
          <div className="relative z-10 order-2 flex flex-col gap-3 pb-4 pt-4 md:max-w-xl md:pb-0 md:pt-6 lg:max-w-none lg:col-span-4 lg:col-start-9 lg:self-end lg:pb-0 lg:pt-0">
            <p className="max-w-measure text-lead text-text-inverse-soft max-md:hidden lg:mb-0 mb-2">{lead}</p>
            {usp && (
              <p className="max-w-measure border-l-2 border-brass-400 pl-3 text-ui text-text-inverse" data-yacht-usp="">
                {usp}
              </p>
            )}
            <Button href={ctaHref} variant="primary" onDark arrow>
              {primaryLabel}
            </Button>
            <Button href={secondary.href} variant="secondary" onDark>
              {secondary.label}
            </Button>
            {/* r8-leads (technik P1, CLS 0,211 → 0): this line wrapped to two lines
                with the fallback font and to one with Instrument Sans at 1440 px, so
                the font swap shrank the row by 21 px and pulled the stage up
                (layout-shift sources: [data-yacht-stage] 634 → 613). Hours and
                address are now two fixed lines in every font; the 21 px are taken
                from the stage margin and the lead margin (lg), so the boat stays in
                the first screen (yacht-werfthalle.spec.js). */}
            <p className="text-small text-text-inverse-soft tabular max-md:hidden">
              <span className="block">{t.hours}</span>
              <span className="block">
                {ADDRESS.street}, {ADDRESS.postalCode} {ADDRESS.city}
              </span>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * Hero mit dem freigegebenen Navetta-Foto (A6) – „Titelsequenz“ (visual-design, 31.10.2026).
 * Gleiche Texte, gleiche Knöpfe, gleiche Hooks; das Foto bleibt UNVERÄNDERT
 * (eigenes Seitenverhältnis, object-contain, kein Zuschnitt, nichts darüber).
 * - Titelkarte: H1 über die ganze Breite (eine Zeile ab lg), darunter eine
 *   Messing-Horizontlinie, die sich einmal zieht (dekorativ, aria-hidden).
 * - Foto ab lg in Spalte 6–12, rechts bis an den Bildschirmrand (.heroBleed),
 *   Breite an 100svh − 26rem gekoppelt → Bild bleibt ganz im ersten Bildschirm (1440×900: Unterkante ≈ 856 px, 1280×720 ≈ 676 px).
 * - Kamera: das Foto „setzt auf“ (scale .965 → 1, opacity bleibt 1 → LCP
 *   unverändert) und bleibt beim Wegscrollen sanft zurück (scroll-driven,
 *   nur transform). Hinter dem Foto atmet ein Abendlicht auf dem Tinte-Grund.
 *   Alles still bei prefers-reduced-motion / „Ruhige Ansicht“.
 * - Mobil: Titel → Foto randlos → Bildnachweis → USP → Termin.
 */
function PhotoHero({ title, eyebrow, lead, crumb, primaryLabel, motto, secondary, usp, ctaHref, photo, t }) {
  return (
    <section
      aria-labelledby="landing-title"
      className={`relative isolate overflow-clip bg-ink-deep text-text-inverse ${cinema.heroStage}`}
      data-yacht-hero=""
      data-yacht-hero-photo=""
    >
      <Container className="relative pb-6 pt-6 md:pb-16 md:pt-12 lg:pb-20 lg:pt-12 [@media(min-width:48rem)_and_(max-height:32rem)]:pb-8 [@media(min-width:48rem)_and_(max-height:32rem)]:pt-4">
        <Breadcrumbs tone="dark" items={[{ label: "Home", href: "/" }, { label: crumb }]} className="[&_a]:min-h-11" />
        <div className="mt-4 grid grid-cols-1 lg:mt-stack-s lg:grid-cols-12 lg:gap-x-8 [@media(min-width:48rem)_and_(max-height:32rem)]:grid-cols-2 [@media(min-width:48rem)_and_(max-height:32rem)]:gap-x-8">
          {/* Titelkarte */}
          <div className="relative order-1 lg:col-span-12 lg:row-start-1 [@media(min-width:48rem)_and_(max-height:32rem)]:col-span-2 [@media(min-width:48rem)_and_(max-height:32rem)]:row-start-1">
            <Eyebrow tone="inverse">{bindSeparators(eyebrow)}</Eyebrow>
            <Heading id="landing-title" level={1} size="display-xl" tone="inverse" className="mt-stack-s max-w-[16ch] [overflow-wrap:break-word] max-sm:text-[length:min(var(--text-display-xl),13vw)] lg:max-w-none lg:text-[length:min(5.25rem,5.6vw)] [@media(min-width:48rem)_and_(max-height:32rem)]:max-w-none [@media(min-width:48rem)_and_(max-height:32rem)]:text-[length:2.75rem]">
              {title}
            </Heading>
          </div>
          <span aria-hidden="true" className={`col-span-full mt-6 lg:row-start-2 hidden h-px bg-brass-400/50 lg:block ${cinema.heroHorizon}`} />
          {/* QM r2 (phone-quer, desktop-zoom): ist die Textspalte länger als das Foto, bleibt das Foto
              beim Scrollen daneben stehen (sticky; Abschnitt clippt per overflow-clip statt -hidden,
              damit sticky greift) – keine leere dunkle Fläche neben CTAs und Öffnungszeiten. */}
          <figure
            className={`order-2 -mx-gutter mt-5 md:mx-auto md:mt-8 md:w-full md:max-w-[72svh] [@media(min-width:48rem)_and_(max-height:32rem)]:col-start-2 [@media(min-width:48rem)_and_(max-height:32rem)]:row-start-2 [@media(min-width:48rem)_and_(max-height:32rem)]:mx-0 [@media(min-width:48rem)_and_(max-height:32rem)]:mt-6 [@media(min-width:48rem)_and_(max-height:32rem)]:max-w-none [@media(min-width:48rem)_and_(max-height:32rem)]:self-start [@media(min-width:48rem)_and_(max-height:32rem)]:sticky [@media(min-width:48rem)_and_(max-height:32rem)]:top-[calc(var(--header-h)+0.75rem)] lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start lg:col-span-7 lg:col-start-6 lg:row-start-3 lg:mt-8 lg:max-w-[max(560px,calc((100svh_-_416px)*1.6))] lg:justify-self-end ${cinema.heroBleed}`}
            data-yacht-hero-figure=""
            data-concierge-avoid=""
          >
            <div className={cinema.heroDrift}>
              <div className={cinema.heroIn}>
                {/* Rahmen im eigenen Seitenverhältnis → contain zeigt das ganze Foto, ohne Balken und ohne Zuschnitt */}
                <div className="relative bg-ink" style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    preload
                    quality={75 /* images.qualities [50,75,90,100]: 80 wurde ohnehin als 75 ausgeliefert (Dev-Warnung) */}
                    sizes="(min-width: 1440px) 880px, (min-width: 1024px) 58vw, (min-width: 768px) and (max-height: 512px) 50vw, (min-width: 768px) 72vh, 100vw"
                    className="object-contain"
                    data-navetta-image=""
                  />
                </div>
                <figcaption className="mt-2 max-w-measure px-gutter text-small text-text-inverse-soft md:px-0 lg:max-w-none">
                  <span className="text-text-inverse" data-yacht-hero-disclaimer="">
                    {photo.disclaimer}
                  </span>{" "}
                  <span data-navetta-credit="">{photo.credit}</span>
                </figcaption>
              </div>
            </div>
          </figure>
          <div className="relative order-3 flex flex-col gap-3 pt-4 md:max-w-xl md:pt-8 [@media(min-width:48rem)_and_(max-height:32rem)]:col-start-1 [@media(min-width:48rem)_and_(max-height:32rem)]:row-start-2 [@media(min-width:48rem)_and_(max-height:32rem)]:pt-6 [@media(min-width:48rem)_and_(max-height:32rem)]:self-start lg:col-span-5 lg:col-start-1 lg:row-start-3 lg:max-w-none lg:self-center lg:pt-8">
            <p className="font-display-italic text-display-m text-accent-on-dark max-md:hidden">{motto}</p>
            <p className="max-w-measure text-lead text-text-inverse-soft max-md:hidden">{lead}</p>
            {usp && (
              <p className="max-w-measure border-l-2 border-brass-400 pl-3 text-ui text-text-inverse" data-yacht-usp="">
                {usp}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button href={ctaHref} variant="primary" onDark arrow>
                {primaryLabel}
              </Button>
              <Button href={secondary.href} variant="secondary" onDark>
                {secondary.label}
              </Button>
            </div>
            <p className="text-small text-text-inverse-soft tabular max-md:hidden">
              <span className="block">{t.hours}</span>
              <span className="block">
                {ADDRESS.street}, {ADDRESS.postalCode} {ADDRESS.city}
              </span>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
