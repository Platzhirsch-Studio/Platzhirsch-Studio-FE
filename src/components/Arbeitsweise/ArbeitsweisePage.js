// Signature-Seite /de/arbeitsweise – „Von der Handzeichnung zum Rendering.“
// Konzept: Marktresearch/digital/features/arbeitsweise-konzept.md · Doku: …/arbeitsweise.md
//
// Dramaturgie (mobil zuerst): K0 Auftakt · K1 Haltung · K2 sieben Schritte ·
// K3/K4 hell (Zeit vor Ort, Von Hand) · K5 das EINE dunkle Kapitel
// „Vom Strich zum Raum“ (Signature-Moment) · K6 Wirklichkeit · K7 Harald ·
// K8 Ein Projekt (Kette) · K9 Online starten · K10 Fragen · K11 Abschluss.
//
// Regeln: genau eine Walnut-Fläche, ein Primärknopf nur in K0 und K11, die
// H1 ist das LCP-Element (Text; rechts daneben bzw. mobil darunter MEDIA.hero,
// bis dahin Platzhalter bzw. das Schema in Phase 1 als Standbild), eine Horizontlinie (K0).
// Bilder NUR aus src/lib/arbeitsweise/media.js; die Linie ist „Schema“, nie
// „Skizze“. Server-Komponente; Insel nur die Kette.
// Runde 2 (gesamtwerk P1-1): keine Sticky-Werkstrecke mehr – jeder Schritt ist ein
// Zweispalter mit seinem Standbild, Kapitelabstände enger, kein Etikett „Schema“.
import JsonLd from "@/components/Reusable/JsonLd";
import { Accordion, Breadcrumbs, Button, Eyebrow, Heading, Horizon, Lead, Leitsatz, LinkArrow, Section, SmartLink, cx } from "@/components/ui";
// R5-fix P2: alle Texte je Sprache aus arbeitsweiseCopy(locale) (copy.js + copy-intl.js).
import { HANDWERK, arbeitsweiseCopy, handwerkLines } from "@/lib/arbeitsweise/copy";
import { KETTE, MEDIA, RATIO, SHOW_PLACEHOLDERS, WERKZEUG_BEISPIEL, chainComplete, chainCount } from "@/lib/arbeitsweise/media";
import Media from "@/components/ui/Media";
import { arbeitsweiseSchema } from "@/lib/arbeitsweise/schema";
import { FEATURES, isFeatureOn } from "@/lib/features";
import { Check } from "lucide-react";
import ImageSlot from "./ImageSlot";
import Kette from "./Kette";
import { LinieFrame } from "./Linie";
import styles from "./arbeitsweise.module.css";

const HALF = "(min-width: 1024px) 45vw, 100vw";
// Kapitelabstand (P1-1 Runde 2): höchstens ca. 190 px zwischen zwei Kapiteln statt 352 px.
const CHAPTER = "py-9 md:py-14";
// Desktop: Kapitelkopf links (4 Spalten), Schritte rechts (8) – kein eigener Kopf-Riegel über den Schritten.
const CH_GRID = "lg:grid lg:grid-cols-12 lg:gap-x-8";
const CH_HEAD = "mb-stack-m lg:col-span-4 lg:mb-0 lg:pt-8";

/** Kapitelkopf: Overline + H2. */
function ChapterHead({ id, overline, title, tone = "light", className }) {
  const dark = tone === "dark";
  return (
    <div className={className}>
      <Eyebrow tone={dark ? "inverse" : "accent"}>{overline}</Eyebrow>
      <Heading id={id} level={2} tone={dark ? "inverse" : "text"} className="mt-stack-s max-w-[20ch] text-balance">
        {title}
      </Heading>
    </div>
  );
}

/**
 * Ein Schritt (P1-1 Runde 2, gesamtwerk): Zweispalter statt Sticky-Grafik.
 * Desktop: links Stationszeile, Name, Text (und `extra`, z. B. ein Knopf);
 * rechts das Standbild seiner Phase (abstrahierte Liniengrafik, nie „Skizze“)
 * und darunter `aside` (z. B. eine Liste). Mobil steht die Grafik klein als
 * Anker rechts neben dem Namen (Pikto-Rolle), damit die Seite nicht doppelt so
 * lang wird. Kein min-height mehr, also keine leeren Flächen neben kurzen
 * Schritten. Schritt 01 ohne Grafik (Phase 1 wäre nur der leere Raumrahmen, F1).
 * data-step bleibt (Anker, Tests), id ist der Anker aus der Übersicht.
 */
function Step({ c, n, text, tone = "light", slot, extra, aside }) {
  const step = c.STEPS[n - 1];
  const dark = tone === "dark";
  // Haralds Angaben zu Werkzeug, Maßstab usw. – nur, wenn er sie geliefert hat (P2-3b).
  const craft = handwerkLines(n, HANDWERK, c.HANDWERK_LABELS);
  const soft = dark ? "text-text-inverse-soft" : "text-text-soft";
  return (
    <article
      id={step.id}
      data-step={n}
      aria-labelledby={`${step.id}-title`}
      className={cx(
        "grid scroll-mt-[88px] grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-t py-5 lg:grid-cols-12 lg:gap-x-8 lg:py-8",
        dark ? "border-line-inverse" : "border-line"
      )}
    >
      <div className="col-start-1 row-start-1 self-center lg:col-span-7 lg:self-end">
        {/* Zählung nur einmal (gesamtwerk P1-1 Runde 2): Nummer vor dem Namen statt eigener Zeile „Schritt 03 von 07“. */}
        <Heading id={`${step.id}-title`} level={3} tone={dark ? "inverse" : "text"}>
          <span className="sr-only">{c.stepSrPrefix(n)}</span>
          <span aria-hidden="true" className={cx("mr-3 text-small tabular", soft)}>
            {String(n).padStart(2, "0")}
          </span>
          {step.name}
        </Heading>
      </div>
      <div className="col-span-2 row-start-2 lg:col-span-7 lg:col-start-1 lg:row-span-2">
        <p className={cx("mt-3 max-w-measure text-body text-pretty lg:mt-4", soft)}>{text}</p>
        {craft.length > 0 && (
          <p className={cx("mt-3 max-w-measure text-small", soft)}>
            {craft.map((c, i) => (
              <span key={c.label}>
                {i > 0 && " · "}
                {c.label}: {c.value}
              </span>
            ))}
          </p>
        )}
        {extra}
      </div>
      {n > 1 && (
        <figure
          aria-hidden="true"
          className="col-start-2 row-start-1 w-[88px] self-center sm:w-[120px] lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:mx-auto lg:w-full lg:max-w-[210px]"
        >
          <LinieFrame phase={n} tone={tone} reveal />
        </figure>
      )}
      {aside && <div className="col-span-2 row-start-3 lg:col-span-5 lg:col-start-8 lg:row-start-3">{aside}</div>}
      {slot && <div className="col-span-2 lg:col-span-12">{slot}</div>}
    </article>
  );
}

/**
 * Rechts neben dem Titel, mobil unter Lead und Knopf (P2-1b). Echtes Foto aus
 * MEDIA.hero; solange es fehlt (R5-fix P2, gesamtwerk P1-1, bewusst
 * geändert): ein Papierblatt mit drei Wörtern („Papier. Modell. Raum.“) und
 * dem Satz der Wow-Coda – reine Typografie. Früher stand hier die digitale
 * Liniengrafik des Showrooms (LineStudy) mit der Bildzeile „Showroom Lochau“:
 * sie zog die Sessel (Fremdmöbel, Minotti-Regel) nach und behauptete ein Foto.
 * Mobil eine ruhige, volle Zeile statt einer schmalen Grafik mit Leere daneben.
 * Die H1 bleibt LCP. Steht im DOM nach dem Knopf (Knopf mobil über der Falz);
 * auf dem Desktop setzt das Raster es rechts neben den Titel.
 */
function HeroVisual({ c }) {
  const { HERO, UI } = c;
  const hero = MEDIA.hero;
  // R8 (gesamtwerk P2-3, iPad-Leerfläche): ab 768 px steht das Blatt rechts neben
  // Knopf und Schritte-Link (zweite Hälfte), nicht allein links mit Leere daneben.
  const place = "md:col-span-6 md:col-start-7 md:row-start-3 md:self-center lg:col-span-5 lg:col-start-8 lg:row-span-3 lg:row-start-1";
  if (hero?.src) return <ImageSlot slot={hero} kind={UI.placeholderKind.hero} ratio={RATIO.hero} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 360px" className={cx(place, "w-full max-w-[360px] lg:max-w-[440px]")} />;
  const w = HERO.sheet;
  return (
    // Design-Jury P1-4: on phones the sheet follows the button (DOM order),
    // the H1 comes first; from 768 px it keeps its place next to the button.
    // Bodoni only from 32 px up (text-display-m).
    <div className={cx(place, styles.sheet, "w-full lg:max-w-[440px] lg:justify-self-end")} data-hero-sheet="">
      <p className="font-display-italic text-display-m leading-[1.05] text-text lg:text-display-l">
        <span className="md:block">{w.a}</span> <span className="md:block">{w.b}</span> <span className="md:block">{w.c}</span>
      </p>
      <span aria-hidden="true" className={styles.sheetRule} />
      <p className="text-ui text-text">{w.line}</p>
    </div>
  );
}

function Hero({ c }) {
  const { APPOINTMENT, CRUMBS, HERO } = c;
  return (
    <Section tone="surface" spacing="none" labelledBy="arbeitsweise-title" className="pt-8 pb-10 md:pt-12 md:pb-16">
      {/* C4 (gesamtwerk M15): phones show the trail from the section on
          ("Planen & Erleben / Unsere Arbeitsweise", one line) – the home step
          and its separator are hidden below 640 px, the JSON-LD keeps all. */}
      <Breadcrumbs items={CRUMBS} className="[&_a]:min-h-11 max-sm:[&_li:first-child]:hidden max-sm:[&_li:nth-child(2)>span:first-child]:hidden" />
      <div className="mt-6 grid grid-cols-1 gap-y-6 md:grid-cols-12 md:gap-x-8 lg:mt-stack-m">
        <div className="md:col-span-12 lg:col-span-6 lg:col-start-1 lg:row-start-1">
          <Eyebrow>{HERO.overline}</Eyebrow>
          <Heading id="arbeitsweise-title" level={1} size="display-l" className="mt-stack-s max-w-[16ch] text-balance">
            {HERO.title}
          </Heading>
        </div>
        <Lead tone="soft" className="max-w-measure text-pretty md:col-span-12 lg:col-span-6 lg:col-start-1 lg:row-start-2">
          {HERO.lead}
        </Lead>
        <div className="flex flex-col items-start gap-1 md:col-span-6 md:row-start-3 md:self-center lg:col-span-6 lg:col-start-1">
          <Button href={APPOINTMENT.href} variant="primary" arrow>
            {APPOINTMENT.label}
          </Button>
          <p className="mt-1 text-small text-text-soft tabular">{APPOINTMENT.note}</p>
          <LinkArrow href="#schritte" className="mt-2">
            {HERO.stepsLink}
          </LinkArrow>
        </div>
        <HeroVisual c={c} />
      </div>
      {/* Die eine Horizontlinie der Seite (P0) – sie kehrt in Schritt 07 als Schema zurück.
          lg:mt-14 statt 16 (8-px-Raster): Seitenhöhe Desktop ≤ 9 000 px (gesamtwerk P1-1). */}
      <Horizon className="mt-10 lg:mt-14" />
    </Section>
  );
}

function Haltung({ c }) {
  const { HALTUNG } = c;
  return (
    <Section tone="surface" spacing="none" labelledBy="haltung-title" className="pb-10 md:pb-16">
      <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-8">
        <ChapterHead id="haltung-title" overline={HALTUNG.overline} title={HALTUNG.title} className="lg:col-span-5" />
        <div className="space-y-5 text-body text-text lg:col-span-6 lg:col-start-7">
          {HALTUNG.paragraphs.map((p) => (
            <p key={p} className="max-w-measure text-pretty">
              {p}
            </p>
          ))}
        </div>
      </div>
      {/* Mobil ausgeblendet (Runde 2, Seitenlänge): die drei Wörter fassen nur die Absätze darüber zusammen. */}
      <ul className="mt-10 hidden grid-cols-1 gap-y-5 sm:grid sm:grid-cols-3 sm:gap-x-8 lg:mt-16">
        {HALTUNG.pillars.map((p) => (
          <li key={p.word} className={cx(styles.reveal, "grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 border-t border-line-strong pt-4 sm:block sm:pt-5")}>
            <p className="font-display text-title text-text sm:text-display-m">{p.word}</p>
            <p className="max-w-[30ch] text-body text-text-soft sm:mt-3">{p.text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Uebersicht({ c }) {
  const { STEPS, UEBERSICHT } = c;
  return (
    <Section tone="band" spacing="none" labelledBy="schritte-title" id="schritte" className={cx(CHAPTER, "scroll-mt-[88px]")}>
      <ChapterHead id="schritte-title" overline={UEBERSICHT.overline} title={UEBERSICHT.title} />
      <ol className={cx(styles.stations, "mt-stack-m grid grid-cols-2 gap-x-4 gap-y-1 sm:gap-y-3 lg:mt-16 lg:grid-cols-7 lg:gap-x-4")}>
        {STEPS.map((s, i) => (
          <li key={s.id} className={styles.station} style={{ "--i": i % 5 }}>
            <a href={`#${s.id}`} className={cx(styles.stationLink, "group flex min-h-11 items-center gap-4 lg:flex-col lg:items-start lg:gap-5")}>
              <span className={styles.dot} aria-hidden="true" />
              <span className="flex items-baseline gap-3 lg:flex-col lg:gap-1">
                <span className="text-small tabular text-text-soft">{String(s.n).padStart(2, "0")}</span>
                <span className="text-ui text-text underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-current">{s.name}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
      {/* grafikNote ersetzt das frühere Etikett „Schema“ an jeder Grafik (gesamtwerk P1-1 Runde 2): einmal, ehrlich. */}
      <p className="mt-stack-m max-w-measure text-small text-text-soft">
        {UEBERSICHT.note} {UEBERSICHT.grafikNote}
      </p>
    </Section>
  );
}

function VorOrtUndHand({ c }) {
  const { APPOINTMENT, UI, VOR_ORT, VON_HAND, germanLinkLocale } = c;
  return (
    <Section tone="surface" as="div" spacing="none" className={CHAPTER}>
      <section aria-labelledby={`${VOR_ORT.id}-title`} id={VOR_ORT.id}>
        <div className={CH_GRID}>
        <ChapterHead id={`${VOR_ORT.id}-title`} overline={VOR_ORT.overline} title={VOR_ORT.title} className={CH_HEAD} />
        <div className="lg:col-span-8">
        <Step c={c} n={1} text={VOR_ORT.steps[1]} slot={<ImageSlot slot={MEDIA.kennenlernen} kind={UI.placeholderKind.kennenlernen} ratio={RATIO.kennenlernen} sizes={HALF} className="mt-8" />} />
        <Step
          c={c}
          n={2}
          text={VOR_ORT.steps[2]}
          extra={
            <div className="mt-6">
              <Button href={APPOINTMENT.href} variant="secondary">
                {VOR_ORT.cta}
              </Button>
              <p className="mt-2 max-w-measure text-small text-text-soft">{VOR_ORT.ctaNote}</p>
              {/* N4 Bodensee-Licht: why we learn the light on site (Integration 28.10.2026). */}
              <p className="mt-3">
                <LinkArrow href={VOR_ORT.lichtHref} locale={germanLinkLocale} hrefLang={germanLinkLocale}>{VOR_ORT.lichtLabel}</LinkArrow>
              </p>
            </div>
          }
          aside={
            <div className="mt-6 lg:mx-auto lg:max-w-[300px]">
              <Heading level={4} className="text-text">
                {VOR_ORT.listTitle}
              </Heading>
              <ul className="mt-3 space-y-2 text-body text-text">
                {VOR_ORT.list.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden="true" className="mt-[0.8em] h-px w-4 shrink-0 bg-ink" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          }
          slot={<ImageSlot slot={MEDIA.vorOrt} kind={UI.placeholderKind.vorOrt} ratio={RATIO.vorOrt} sizes={HALF} className="mt-8" />}
        />
        </div>
      </div>
      </section>
      <section aria-labelledby={`${VON_HAND.id}-title`} id={VON_HAND.id} className="mt-12">
        <div className={CH_GRID}>
        <ChapterHead id={`${VON_HAND.id}-title`} overline={VON_HAND.overline} title={VON_HAND.title} className={CH_HEAD} />
        <div className="lg:col-span-8">
        <Step c={c} n={3} text={VON_HAND.steps[3]} slot={<ImageSlot slot={MEDIA.handzeichnung} kind={UI.placeholderKind.handzeichnung} ratio={RATIO.handzeichnung} sizes={HALF} className="mt-8" />} />
        <Step c={c} n={4} text={VON_HAND.steps[4]} slot={<ImageSlot slot={MEDIA.modell} kind={UI.placeholderKind.modell} ratio={RATIO.modell} sizes={HALF} className="mt-8 max-w-[420px]" />} />
        </div>
      </div>
      </section>
    </Section>
  );
}

/**
 * Schritt 05 ohne eigenen Projekt-Screenshot (Rat 9,5, B8): die echte Ausgabe
 * unseres Küchenplaners, beschriftet als Werkzeug-Beispiel (kein
 * Kundenprojekt, keine Arbeit von Harald). Feste 3:2-Box, kein CLS.
 */
function WerkzeugBeispiel({ c, className }) {
  const b = WERKZEUG_BEISPIEL.planung3d;
  const t = c.STRICH_ZUM_RAUM.beispiel;
  return (
    <figure className={className} data-werkzeug-beispiel="">
      <Media src={b.src} alt={t.alt} ratio="3/2" sizes="(min-width: 1024px) 45vw, 100vw" className="max-w-[640px] bg-surface" fit="contain" />
      <figcaption className="mt-3 text-small text-text-inverse-soft">{t.caption}</figcaption>
      {/* Sprach-Integration 01.11.2026: der Küchenplaner ist viersprachig – Link in der Seitensprache. */}
      <LinkArrow href={b.werkzeug} tone="inverse">
        {t.link}
      </LinkArrow>
    </figure>
  );
}

function StrichZumRaum({ c }) {
  const { STRICH_ZUM_RAUM, UI } = c;
  return (
    <Section tone="inverse" spacing="none" className={CHAPTER} labelledBy={`${STRICH_ZUM_RAUM.id}-title`} id={STRICH_ZUM_RAUM.id}>
      <div className={CH_GRID}>
      <ChapterHead id={`${STRICH_ZUM_RAUM.id}-title`} overline={STRICH_ZUM_RAUM.overline} title={STRICH_ZUM_RAUM.title} tone="dark" className={CH_HEAD} />
      <div className="lg:col-span-8">
      <Step
        c={c}
        n={5}
        tone="dark"
        text={STRICH_ZUM_RAUM.steps[5]}
        slot={
          MEDIA.planung3d?.src || SHOW_PLACEHOLDERS ? (
            <ImageSlot slot={MEDIA.planung3d} kind={UI.placeholderKind.planung3d} ratio={RATIO.planung3d} sizes={HALF} tone="dark" className="mt-8" />
          ) : (
            <WerkzeugBeispiel c={c} className="mt-8" />
          )
        }
      />
      <Step c={c} n={6} tone="dark" text={STRICH_ZUM_RAUM.steps[6]} />
      </div>
      </div>
      {/* Signature-Moment: der Rendering-Platz öffnet sich über die volle Breite
          (entfällt, solange kein echtes Rendering eingetragen ist). */}
      <ImageSlot
        slot={MEDIA.rendering}
        kind={UI.placeholderKind.rendering}
        ratio="21/9"
        sizes="(min-width: 1440px) 1280px, 100vw"
        tone="dark"
        note={STRICH_ZUM_RAUM.renderingLabel}
        className={cx(styles.renderReveal, "mt-section")}
      />
    </Section>
  );
}

function Wirklichkeit({ c }) {
  const { WIRKLICHKEIT, UI } = c;
  return (
    <Section tone="surface" spacing="none" className={CHAPTER} labelledBy={`${WIRKLICHKEIT.id}-title`} id={WIRKLICHKEIT.id}>
      <div className={CH_GRID}>
      <ChapterHead id={`${WIRKLICHKEIT.id}-title`} overline={WIRKLICHKEIT.overline} title={WIRKLICHKEIT.title} className={CH_HEAD} />
      <div className="lg:col-span-8">
      <Step c={c} n={7} text={WIRKLICHKEIT.text} slot={<ImageSlot slot={MEDIA.umsetzung} kind={UI.placeholderKind.umsetzung} ratio={RATIO.umsetzung} sizes={HALF} className="mt-8" />} />
      </div>
      </div>
    </Section>
  );
}

function Harald({ c }) {
  const { HARALD, UI } = c;
  const portrait = MEDIA.portrait;
  const withImage = Boolean(portrait) || SHOW_PLACEHOLDERS;
  // R5-USP (gesamtwerk P0-1, bewusst geändert): ohne echtes Porträt keine Tafel
  // mehr in Porträtgröße (wirkte wie ein Platzhalter), sondern eine gestaltete
  // Textsektion: Name groß in Bodoni, darunter drei Tätigkeiten aus dem Ablauf
  // in einer Haarlinien-Reihe, rechts der Text. Kein Monogramm, kein Fake-Porträt.
  if (!withImage) {
    return (
      <Section tone="band" spacing="none" className={CHAPTER} labelledBy={`${HARALD.id}-title`} id={HARALD.id} data-harald-text="">
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:items-end lg:gap-x-8">
          <div className="lg:col-span-6">
            <Eyebrow>{HARALD.overline}</Eyebrow>
            <Heading id={`${HARALD.id}-title`} level={2} size="display-l" className="mt-stack-s text-balance">
              {HARALD.name}
            </Heading>
            {HARALD.role && <p className="mt-2 text-lead text-text-soft">{HARALD.role}</p>}
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <p className="max-w-measure text-body text-pretty text-text">{HARALD.text}</p>
            {HANDWERK.zitat && (
              <figure className="mt-stack-m max-w-measure border-l border-line-strong pl-5">
                <blockquote className="ph-hang font-display-italic text-display-m text-text text-pretty">„{HANDWERK.zitat}“</blockquote>
                <figcaption className="mt-2 text-small text-text-soft">{HARALD.quoteLabel}</figcaption>
              </figure>
            )}
            <LinkArrow href={HARALD.teamLink.href} className="mt-4">
              {HARALD.teamLink.label}
            </LinkArrow>
          </div>
        </div>
        <ul aria-label={HARALD.doesLabel} className="mt-8 grid grid-cols-1 border-t border-line-strong sm:grid-cols-3 sm:gap-x-8 lg:mt-12">
          {HARALD.does.map((d) => (
            <li key={d.word} className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-baseline gap-x-4 border-b border-line py-3 sm:block sm:border-b-0 sm:py-5">
              {/* Design-Jury P2-14: am Handy Instrument 500 in 22 px statt Bodoni unter 32 px */}
              <p className="font-display-italic text-display-m text-text max-sm:font-sans max-sm:text-[1.375rem] max-sm:font-medium max-sm:not-italic max-sm:leading-snug">{d.word}</p>
              <p className="max-w-[30ch] text-body text-text-soft sm:mt-2">{d.text}</p>
            </li>
          ))}
        </ul>
      </Section>
    );
  }
  return (
    <Section tone="band" spacing="none" className={CHAPTER} labelledBy={`${HARALD.id}-title`} id={HARALD.id}>
      <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:items-center lg:gap-x-8">
        <div className="lg:col-span-5">
          <ImageSlot slot={portrait} kind={UI.placeholderKind.portrait} ratio="4/5" sizes="(min-width: 1024px) 38vw, 100vw" className="max-w-[440px]" />
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <Eyebrow>{HARALD.overline}</Eyebrow>
          <Heading id={`${HARALD.id}-title`} level={2} className="mt-stack-s">
            {HARALD.name}
          </Heading>
          {/* Rolle erst nach Bestätigung (inhaber-offen A4) */}
          {HARALD.role && <p className="mt-2 text-lead text-text-soft">{HARALD.role}</p>}
          <p className="mt-stack-m max-w-measure text-body text-pretty text-text">{HARALD.text}</p>
          {/* Nur Haralds wörtlicher Satz mit Einwilligung (HANDWERK.zitat), sonst nichts (P2-3b). */}
          {HANDWERK.zitat && (
            <figure className="mt-stack-m max-w-measure border-l border-line-strong pl-5">
              <blockquote className="ph-hang font-display-italic text-display-m text-text text-pretty">„{HANDWERK.zitat}“</blockquote>
              <figcaption className="mt-2 text-small text-text-soft">{HARALD.quoteLabel}</figcaption>
            </figure>
          )}
          <LinkArrow href={HARALD.teamLink.href} className="mt-4">
            {HARALD.teamLink.label}
          </LinkArrow>
        </div>
      </div>
    </Section>
  );
}

function EinProjekt({ c }) {
  const { KETTE: KETTE_COPY, STRICH_ZUM_RAUM } = c;
  const complete = chainComplete(KETTE);
  const stations = KETTE_COPY.stations.map((s) => ({
    ...s,
    slot: KETTE[s.key],
    note: s.key === "rendering" ? STRICH_ZUM_RAUM.renderingLabel : undefined,
  }));
  const facts = KETTE.fakten ? Object.entries(KETTE_COPY.factLabels).filter(([k]) => KETTE.fakten[k]) : [];
  return (
    <Section tone="surface" spacing="none" className={CHAPTER} labelledBy={`${KETTE_COPY.id}-title`} id={KETTE_COPY.id}>
      <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-4">
          <ChapterHead id={`${KETTE_COPY.id}-title`} overline={KETTE_COPY.overline} title={KETTE_COPY.title} />
          <p className="mt-stack-m max-w-measure text-body text-text-soft">{KETTE_COPY.text}</p>
          {facts.length > 0 && (
            <dl className="mt-stack-m grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-4">
              {facts.map(([k, label]) => (
                <div key={k}>
                  <dt className="text-small text-text-soft">{label}</dt>
                  <dd className="text-body text-text tabular">{KETTE.fakten[k]}</dd>
                </div>
              ))}
            </dl>
          )}
          {complete && <p className="mt-4 text-small text-text-soft">{KETTE_COPY.consent}</p>}
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          {/* Vorschau mit < 2 echten Bildern: EIN Platzhalter statt fünf, keine Auswahl (P3-4). */}
          {chainCount(KETTE) >= 2 ? (
            <Kette stations={stations} groupLabel={KETTE_COPY.groupLabel} />
          ) : (
            <ImageSlot slot={null} kind={KETTE_COPY.placeholder} ratio="3/2" />
          )}
        </div>
      </div>
    </Section>
  );
}

function OnlineStarten({ c, tone }) {
  const { ONLINE } = c;
  const cards = ONLINE.cards
    .map((card) => ({ ...card, feature: FEATURES.find((f) => f.id === card.feature) }))
    .filter((card) => card.feature && isFeatureOn(card.feature.id));
  if (!cards.length) return null;
  return (
    <Section tone={tone} spacing="none" className={CHAPTER} labelledBy={`${ONLINE.id}-title`} id={ONLINE.id}>
      <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-8">
        <ChapterHead id={`${ONLINE.id}-title`} overline={ONLINE.overline} title={ONLINE.title} className="lg:col-span-6" />
        <Lead tone="soft" className="max-w-measure text-pretty lg:col-span-5 lg:col-start-8 lg:self-end">
          {ONLINE.lead}
        </Lead>
      </div>
      <ul className="mt-stack-m grid grid-cols-1 gap-y-6 md:grid-cols-3 md:gap-x-8 lg:mt-16">
        {cards.map((card) => (
          <li key={card.title} className="flex flex-col border-t border-line-strong pt-4 md:pt-5">
            <Heading level={3}>{card.title}</Heading>
            <dl className="mt-4 space-y-3 text-body">
              {/* Mobil nur die Brücke ins Studio (USP); was das Werkzeug online kann, steht auf seiner Seite (Runde 2, Seitenlänge). */}
              <div className="hidden md:block">
                <dt className="text-overline uppercase text-text-soft">{ONLINE.onlineLabel}</dt>
                <dd className="mt-0.5 text-text">{card.online}</dd>
              </div>
              <div>
                <dt className="text-overline uppercase text-text-accent">{ONLINE.studioLabel}</dt>
                <dd className="mt-0.5 text-text">{card.studio}</dd>
              </div>
            </dl>
            {/* Küchenplaner, Sofaplaner, Stil-Finder: seit 01.11.2026 in allen vier Sprachen. */}
            <LinkArrow href={card.feature.href} className="mt-auto pt-4">
              {card.link}
            </LinkArrow>
          </li>
        ))}
      </ul>
      <p className="mt-stack-m text-small text-text-soft">{ONLINE.note}</p>
    </Section>
  );
}

/** Verlinkt die genannten Wörter im Antworttext (je erstes Vorkommen), Rest bleibt Text. */
function withLinks(text, links = []) {
  const parts = [];
  let rest = text;
  for (const { label, href, locale } of links) {
    const at = rest.indexOf(label);
    if (at < 0) continue;
    parts.push(rest.slice(0, at), (
      <SmartLink key={href} href={href} locale={locale} hrefLang={locale} className="underline underline-offset-4 hover:text-text-accent">
        {label}
      </SmartLink>
    ));
    rest = rest.slice(at + label.length);
  }
  parts.push(rest);
  return parts;
}

function Fragen({ c, tone }) {
  const { FAQ } = c;
  return (
    <Section tone={tone} spacing="none" className={CHAPTER} labelledBy={`${FAQ.id}-title`} id={FAQ.id}>
      <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-8">
        <ChapterHead id={`${FAQ.id}-title`} overline={FAQ.overline} title={FAQ.title} className="lg:col-span-4" />
        <Accordion
          className="lg:col-span-7 lg:col-start-6"
          headingLevel={3}
          items={FAQ.items.map((item, i) => ({ id: `frage-${i + 1}`, title: item.q, content: <p>{withLinks(item.a, item.links)}</p> }))}
        />
      </div>
    </Section>
  );
}

function Abschluss({ c, tone }) {
  const { ABSCHLUSS, APPOINTMENT } = c;
  return (
    <Section tone={tone} labelledBy={`${ABSCHLUSS.id}-title`} contained="text" spacing="none" className={cx(CHAPTER, tone === "surface" && "border-t border-line")}>
      <div className="flex flex-col items-center text-center">
        {/* Der einzige zentrierte Satz der Seite (Bibel §6), Bodoni kursiv. */}
        <Leitsatz size="l" className={styles.closingLine}>
          {ABSCHLUSS.line}
        </Leitsatz>
        <Heading id={`${ABSCHLUSS.id}-title`} level={2} size="title" className="mt-stack-m">
          {ABSCHLUSS.title}
        </Heading>
        <p className="mt-4 max-w-measure text-body text-text-soft">{ABSCHLUSS.text}</p>
        <div className="mt-stack-m flex flex-col items-center gap-2">
          <Button href={APPOINTMENT.href} variant="primary" arrow>
            {APPOINTMENT.label}
          </Button>
          <p className="text-small text-text-soft tabular">{APPOINTMENT.noteClosing}</p>
        </div>
        <ul aria-label={ABSCHLUSS.trustLabel} className="mt-stack-m flex w-full flex-col border-t border-line pt-4 text-small text-text sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-8">
          {ABSCHLUSS.trust.map((item) => (
            <li key={item} className="flex items-center justify-center gap-2 py-1">
              <Check aria-hidden="true" strokeWidth={1.5} className="size-4 shrink-0 text-text-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

export default function ArbeitsweisePage({ locale = "de" }) {
  const c = arbeitsweiseCopy(locale);
  const showChain = SHOW_PLACEHOLDERS || chainComplete(KETTE);
  return (
    <>
      <JsonLd data={arbeitsweiseSchema(MEDIA, c.locale)} />
      <Hero c={c} />
      <Haltung c={c} />
      <Uebersicht c={c} />
      <VorOrtUndHand c={c} />
      <StrichZumRaum c={c} />
      <Wirklichkeit c={c} />
      <Harald c={c} />
      {showChain && <EinProjekt c={c} />}
      <OnlineStarten c={c} tone={showChain ? "band" : "surface"} />
      <Fragen c={c} tone={showChain ? "surface" : "band"} />
      <Abschluss c={c} tone={showChain ? "band" : "surface"} />
    </>
  );
}
