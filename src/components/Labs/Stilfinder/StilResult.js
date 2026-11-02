"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookmarkCheck, BookmarkPlus, CalendarDays, Heart, Link2, RotateCcw, Share2 } from "lucide-react";
import { PROFILES, brandHref, onColor, resultBase } from "./profiles";
import { QUESTIONS, explainAnswers } from "./questions";
import { useStilCopy } from "./StilCopy";
import { fmt, nbUnits, rich } from "./localize";
import { ROUTES } from "@/utils/routing";
import { forgetLastResult, saveLastResult, useLastResult } from "./storage";
import { blurBackdrop } from "./blurBackdrop";
import { kernW } from "./kernW";
import MoodboardPdfForm from "./MoodboardPdfForm";
import SaveActions from "@/components/Pinterest/SaveActions";
import { planTerminHref } from "@/lib/kuechenplaner/planTermin";

// Section entrance: the site-wide CSS scroll-driven .reveal (globals.css) –
// no JavaScript, content stays visible without JS or without
// animation-timeline support, and it is off under prefers-reduced-motion.
function Reveal({ children, className = "", as: Tag = "div" }) {
  return <Tag className={`reveal ${className}`}>{children}</Tag>;
}

// `moodboard` is a server-rendered slot (<Suspense><MoodboardLoader/></Suspense>)
// so this part streams in after the rest of the page.
// Rat 9,5 B2 (T2): `calendar` vom Server (ownCalendarActive()) – Termin mit Ergebnis-Link (?plan=, ?stil=).
// Mehrsprachigkeit (01.11.2026): Texte aus useStilCopy() (layout.js gibt die
// Sprache als Context mit), Profile mit Text-Overlay der Sprache.
export default function StilResult({ profileKey, result, moodboard, code, calendar = false }) {
  const { locale, t: all, profiles, questions } = useStilCopy();
  const t = all.result;
  const profile = profiles[profileKey];
  const base = resultBase(locale);
  // result.scope ist die deutsche Option aus questions.js (vom Server serialisiert,
  // also eine Kopie) → Index über das deutsche Label, dann das Label der Sprache.
  const scopeQ = QUESTIONS.findIndex((q) => q.kind === "scope");
  const scopeIdx = result?.scope && scopeQ >= 0 ? QUESTIONS[scopeQ].options.findIndex((o) => o.label === result.scope.label) : -1;
  const scopeLabel = scopeIdx >= 0 ? questions[scopeQ].options[scopeIdx].label : result?.scope?.label || null;
  const [status, setStatus] = useState("");
  // QA Runde 2, P3.8: when the hero fails (slow dev server, WebKit) show the
  // blur surface instead of a broken-image icon.
  const [heroBroken, setHeroBroken] = useState(false);
  const secondary = result?.secondary ? profiles[result.secondary] : null;
  // Fix-Runde 1 (F2): Termin mit Stil-Kontext (?stil=…; die Beratungsseite liest ihn, F3).
  // UX-Benchmark fix-05: one href for the early hero link and the "Nächster Schritt" block.
  const terminHref = planTerminHref({
    locale,
    calendar,
    planer: "stil-finder",
    stil: profile.slug,
    produkt: fmt(t.terminProdukt, { name: profile.name }),
    plan: `${base}/ergebnis/${profile.slug}${code ? `?a=${encodeURIComponent(code)}` : ""}`,
  });

  // fix-05: one timer at a time – a second copy within 2.6 s no longer gets
  // its message wiped early by the first timer; cleared on unmount.
  const sayTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(sayTimer.current), []);
  const say = (msg) => {
    window.clearTimeout(sayTimer.current);
    setStatus(msg);
    sayTimer.current = window.setTimeout(() => setStatus(""), 2600);
  };

  const copy = async (text, msg) => {
    try {
      await navigator.clipboard.writeText(text);
      say(msg);
    } catch {
      say(t.copyFailed);
    }
  };

  const share = async () => {
    const url = window.location.href;
    const data = {
      title: fmt(t.shareTitle, { name: profile.name }),
      text: fmt(t.shareText, { name: profile.name, tagline: profile.tagline }),
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (e) {
        if (e?.name === "AbortError") return;
      }
    }
    copy(url, t.linkCopiedShare);
  };

  return (
    <article
      className="bg-[#faf8f4] font-normal text-ink [font-kerning:normal]"
      aria-labelledby="sf-result-title"
    >
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>

      {/* 1 – Profile. Phones: the photo comes first, full-bleed. */}
      {/* QM r3: Raster wie der Seitenkopf (max-w-page + px-gutter); mobil kein Leerstreifen über dem Bild;
          Text und Bild oben bündig (bei 200 % Text stand das Bild sonst weit unten) */}
      <header className="pb-16 pt-0 sm:pt-16 md:pt-24 lg:pb-24 lg:pt-28">
        <div className="mx-auto grid max-w-page grid-cols-1 items-center gap-8 px-gutter md:grid-cols-12 md:items-start md:gap-12">
          {/* Hero settle-in as CSS (R2): with useReducedMotion the server (no
              preference known) and the client rendered different inline transforms
              → hydration mismatch in WebKit under reduced motion. */}
          <style href="sf-result-keyframes" precedence="default">
            {RESULT_KEYFRAMES}
          </style>
          <div
            data-sf-anim=""
            className="relative -mx-gutter aspect-[4/3] overflow-hidden bg-stone motion-safe:animate-[sf-hero-settle_1.6s_cubic-bezier(0.22,1,0.36,1)_both] sm:mx-0 md:order-last md:col-span-6 md:aspect-[5/6]"
          >
            {/* Visual P0-1: the reveal. The five palette tones of the profile
                stand as a shutter over the photo and lift one after another –
                the colours of the composing screen hand over to the room.
                Pure CSS on first paint: the photo underneath is painted at once
                (LCP unaffected), the bands rest at scaleY(0) when animations
                are off (reduced motion, "Ruhige Ansicht", no CSS animation). */}
            <span className="pointer-events-none absolute inset-0 z-10 flex" aria-hidden="true">
              {profile.palette.map((c, i) => (
                <span
                  key={c.hex}
                  data-sf-anim=""
                  className="sf-shutter h-full flex-1" /* QM r5: kürzer – nach max. 0,85 s ist das Foto frei */
                  style={{ backgroundColor: c.hex, animationDelay: `${0.05 + i * 0.05}s` }}
                />
              ))}
            </span>
            {heroBroken ? (
              <div role="img" aria-label={profile.hero.alt} className="absolute inset-0" style={blurBackdrop(profile.hero.img)} />
            ) : (
              <Image
                src={profile.hero.img}
                alt={profile.hero.alt}
                fill
                preload
                style={blurBackdrop(profile.hero.img)}
                // QM planer-tools: die Spalte ist ab 768 px hochformatig, das Querformat-Bild
                // wird per cover beschnitten und braucht ~1,5× die Spaltenbreite (vorher 1,5× hochskaliert).
                sizes="(min-width: 768px) 75vw, 100vw"
                quality={75}
                className="object-cover"
                onError={() => setHeroBroken(true)}
              />
            )}
          </div>
          {/* QM r4: Spalte als Container – die H1 richtet sich nach ihrer Breite (200 % Text: „Modern|e“ lief rechts aus dem Bild) */}
          <div className="@container min-w-0 md:col-span-6">
            <p className="text-xs uppercase tracking-[0.14em] text-gold-text">{t.eyebrow}</p>
            {/* Title rises out of a mask (transform only, never opacity 0: the
                heading stays an LCP candidate from the first frame on phones). */}
            <h1 id="sf-result-title" lang={locale} className="font-display mt-3 overflow-hidden hyphens-auto pb-[0.08em] text-[min(3rem,15cqi)] [overflow-wrap:break-word] leading-[1.02] sm:mt-4 sm:text-[min(3.75rem,15cqi)] lg:text-[min(4.5rem,15cqi)]">
              <span data-sf-anim="" className="sf-rise block" style={{ animationDelay: "0.35s" }}>
                {kernW(profile.name)}
              </span>
            </h1>
            <p className="font-display mt-4 overflow-hidden text-2xl italic text-ink/85">
              <span data-sf-anim="" className="sf-rise block" style={{ animationDelay: "0.5s" }}>
                {profile.tagline}
              </span>
            </p>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/80">{profile.text}</p>
            {result && (
              <div className="mt-8 max-w-md">
                <Composition shares={result.shares} />
                {secondary && (
                  <p className="mt-3 text-sm text-ink/80">
                    {rich(t.hint, { name: <strong key="name" className="font-medium">{secondary.name}</strong> })}
                  </p>
                )}
                <YourAnswers code={code} profile={profile} confidence={result.confidence} />
              </div>
            )}
            {/* Pinterest + Ideenboard (Inhaber-Entscheidung Nr. 14): Pin-Bild ist
                die eigene Palettenkarte /stil-palette/<profil>.png (2:3, ohne
                Fotos – die Titelbilder sind teils Herstellerbilder). */}
            <SaveActions
              className="mt-6"
              locale={locale}
              card={{
                type: "stil",
                title: fmt(t.shareTitle, { name: profile.name }),
                subtitle: profile.tagline,
                href: `${base}/ergebnis/${profile.slug}${code ? `?a=${encodeURIComponent(code)}` : ""}`,
                image: `/stil-palette/${profile.slug}.png`,
                quelle: t.saveSource,
              }}
              pin={{ room: t.pinRoom }}
            />
            {/* UX-Benchmark fix-05: the path to the studio already at the reveal –
                on an iPhone the dark "Nächster Schritt" block is ~10 screens down. */}
            <Link
              href={terminHref}
              className="group mt-6 inline-flex min-h-11 items-center gap-2 border-b border-ink/30 pb-0.5 text-sm font-medium transition-colors hover:border-ink"
              data-stil-termin-hero=""
            >
              {t.heroCta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2 – Palette */}
      <section className="border-t border-ink/10 py-16 lg:py-24" aria-labelledby="sf-palette">
        <div className="mx-auto max-w-page px-gutter">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-gold-text">{t.paletteEyebrow}</p>
              <h2 id="sf-palette" className="font-display mt-3 text-3xl sm:text-4xl">
                {kernW(t.paletteTitle)}
              </h2>
            </div>
            <p className="max-w-xs text-sm text-ink/80">{t.paletteHint}</p>
          </Reveal>
          {/* Phones: one row per colour (name left, code right); from sm: five tall swatches. */}
          <ul className="mt-10 grid grid-cols-1 gap-1 sm:grid-cols-5 sm:gap-2">
            {profile.palette.map((c) => (
              <li key={c.hex} className="reveal">
                <button
                  type="button"
                  onClick={() => copy(c.hex, fmt(t.paletteCopied, { hex: c.hex, name: c.name }))}
                  aria-label={fmt(t.paletteAria, { hex: c.hex, name: c.name })}
                  className="flex h-14 w-full items-center justify-between gap-3 px-4 text-left outline-offset-4 sm:h-64 sm:flex-col sm:items-start sm:justify-end sm:p-4"
                  style={{ backgroundColor: c.hex, color: onColor(c.hex) }}
                >
                  <span className="font-display block text-lg leading-tight">{kernW(c.name)}</span>
                  <span className="text-xs tabular-nums sm:mt-1">{c.hex}</span>
                </button>
              </li>
            ))}
          </ul>
          <Reveal className="mt-10 flex flex-wrap gap-2" as="ul">
            {profile.keywords.map((k) => (
              <li key={k} className="border border-ink/15 px-3 py-1.5 text-sm">
                {k}
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {/* 3 – Moodboard from the live catalogue (streamed) */}
      <section className="bg-bone py-16 lg:py-24" aria-labelledby="sf-moodboard">
        <div className="mx-auto max-w-page px-gutter">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.14em] text-gold-text">{t.moodEyebrow}</p>
            <h2 id="sf-moodboard" className="font-display mt-3 text-3xl sm:text-4xl">
              {kernW(t.moodTitle)}
            </h2>
            <p className="mt-3 max-w-lg text-sm text-ink/80">{t.moodText}</p>
          </Reveal>
          {moodboard}
        </div>
      </section>

      {/* 3b – Moodboard as PDF presentation by e-mail */}
      <MoodboardPdfForm profile={profile} code={code} calendar={calendar} />

      {/* 4 – Brands + tip */}
      <section className="py-16 lg:py-24" aria-labelledby="sf-brands">
        <div className="mx-auto grid max-w-page grid-cols-1 px-gutter gap-12 md:grid-cols-12">
          <Reveal className="min-w-0 md:col-span-7">
            <p className="text-xs uppercase tracking-[0.14em] text-gold-text">{t.brandsEyebrow}</p>
            <h2 id="sf-brands" className="font-display mt-3 text-3xl sm:text-4xl">
              {kernW(t.brandsTitle)}
            </h2>
            <ul className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
              {profile.brands.map((b) => (
                <li key={b}>
                  <Link
                    href={brandHref(b, locale)}
                    className="group flex min-h-14 items-center justify-between py-3 text-xl outline-offset-4"
                  >
                    <span className="font-display">{b}</span>
                    <ArrowRight
                      className="size-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink/75">{t.brandsNote}</p>
          </Reveal>
          <Reveal className="min-w-0 self-end md:col-span-5">
            <figure className="border-l-2 border-gold pl-5">
              <figcaption className="text-xs uppercase tracking-[0.14em] text-gold-text">{t.tipEyebrow}</figcaption>
              <blockquote className="font-display mt-3 text-2xl leading-snug">{nbUnits(profile.tip)}</blockquote>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* 5 – Next steps */}
      <section className="bg-walnut py-16 text-white lg:py-24" aria-labelledby="sf-next">
        <div className="mx-auto max-w-page px-gutter">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.14em] text-gold">{t.nextEyebrow}</p>
            <h2 id="sf-next" className="font-display mt-3 max-w-2xl text-3xl leading-tight sm:text-5xl">
              {kernW(t.nextTitle)}
            </h2>
            <p className="mt-4 max-w-xl text-white/85">
              {fmt(t.nextText, { name: profile.name })}
              {scopeLabel && fmt(t.nextScope, { scope: scopeLabel })}
            </p>
            {/* Rat 9,5 A11: Werkzeug → Mensch */}
            <p className="mt-4 max-w-xl border-l-2 border-gold pl-4 text-white/85" data-hand-line="">
              {t.handLine}
            </p>
          </Reveal>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {/* Fix-Runde 1 (F2): Termin mit Stil-Kontext (?stil=…; die Beratungsseite liest ihn, F3). R3: „Termin anfragen“ wie überall (kein Online-Kalender) */}
            <Link
              href={terminHref}
              className="ph-press inline-flex min-h-12 items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-bone"
              data-stil-termin=""
            >
              <CalendarDays className="size-4" aria-hidden="true" /> {t.termin}
            </Link>
            <Link
              href={`/${locale}${ROUTES.merkliste[locale] || ROUTES.merkliste.de}`}
              className="ph-press inline-flex min-h-12 items-center justify-center gap-2 border border-white/60 px-6 py-3 text-sm font-medium transition-colors hover:bg-white/10"
            >
              <Heart className="size-4" aria-hidden="true" /> {t.wishlist}
            </Link>
            <button
              type="button"
              onClick={share}
              className="ph-press inline-flex min-h-12 items-center justify-center gap-2 border border-white/60 px-6 py-3 text-sm font-medium transition-colors hover:bg-white/10"
            >
              <Share2 className="size-4" aria-hidden="true" /> {t.share}
            </button>
            <button
              type="button"
              onClick={() => copy(window.location.href, t.linkCopied)}
              className="inline-flex min-h-12 items-center justify-center gap-2 px-4 py-3 text-sm underline underline-offset-4"
            >
              <Link2 className="size-4" aria-hidden="true" /> {t.copyLink}
            </button>
          </div>
          <p className="mt-4 min-h-5 text-sm text-gold" aria-hidden="true">
            {status}
          </p>

          <RememberResult profile={profile} code={code} onSay={say} />

          <Link
            href={base}
            className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm text-white/85 underline underline-offset-4"
          >
            <RotateCcw className="size-4" aria-hidden="true" /> {t.restart}
          </Link>
        </div>
      </section>

      <footer className="py-10 pb-28 text-xs leading-relaxed text-ink/75 md:pb-10">
        <div className="mx-auto max-w-page px-gutter space-y-2">
          <p>
            {t.howRules} {code ? t.howLink : ""}
          </p>
          <p>
            {t.imagesNote}{" "}
            <Link href={`/${locale}/datenschutz`} className="underline underline-offset-2">
              {t.privacyLink}
            </Link>
          </p>
        </div>
      </footer>
    </article>
  );
}

// Opt-in only (§ 165 Abs. 3 TKG 2021 / § 25 TDDDG): nothing is written to the
// browser until the visitor presses the button; "vergessen" removes it again.
function RememberResult({ profile, code, onSay }) {
  const { locale, t: all } = useStilCopy();
  const t = all.result;
  const stored = useLastResult();
  const own = code || "";
  const isThis = stored && stored.slug === profile.slug && stored.code === own;

  return (
    <div className="mt-8 max-w-xl border-t border-white/15 pt-6">
      {isThis ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <BookmarkCheck className="size-4 text-gold" aria-hidden="true" />
          <span>{t.remembered}</span>
          <button
            type="button"
            onClick={() => {
              forgetLastResult();
              onSay(t.forgotten);
            }}
            className="inline-flex min-h-11 items-center underline underline-offset-4"
          >
            {t.forget}
          </button>
        </p>
      ) : (
        <button
          type="button"
          onClick={() => {
            saveLastResult({ slug: profile.slug, code: own, name: profile.name, at: Date.now() });
            onSay(t.saved);
          }}
          className="inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4"
        >
          <BookmarkPlus className="size-4" aria-hidden="true" /> {t.remember}
        </button>
      )}
      <p className="mt-1 text-xs leading-relaxed text-white/80">
        {t.rememberNote}{" "}
        <Link href={`/${locale}/datenschutz`} className="underline underline-offset-2">
          {t.privacyLink}
        </Link>
      </p>
    </div>
  );
}

// UX-Benchmark fix-01 + Profil-Kuratierung (explainAnswers): "So ist Ihr Profil
// entstanden" – the answers that carried the profile most (fixed rules, no
// black box), with the picture the visitor actually chose. Nothing is stored,
// the code is in the URL. Owner question (Abnahme Runde 3): no Tom Dixon /
// Licht3–5 pictures outside the quiz grid until cleared – those answers show
// as a plain tile with their label.
const UNCLEARED = /tomdixon|bannerImageLicht[345]/i;
const cleared = (img) => !!img && !UNCLEARED.test(img.src || "");

function YourAnswers({ code, profile, confidence }) {
  const { t: all, questions } = useStilCopy();
  const t = all.result;
  if (!code) return null;
  // explainAnswers() nennt die deutschen Texte aus questions.js → Index suchen,
  // dann die Frage/Option der Sprache zeigen (Mehrsprachigkeit).
  const picks = explainAnswers(code, profile.key)
    .map((w) => {
      const qi = QUESTIONS.findIndex((x) => x.overline === w.question);
      const oi = qi >= 0 ? QUESTIONS[qi].options.findIndex((o) => o.label === w.label) : -1;
      return oi >= 0 ? { q: questions[qi], opt: questions[qi].options[oi] } : null;
    })
    .filter(Boolean);
  if (!picks.length) return null;
  return (
    <details className="group mt-6 border-t border-ink/10 pt-4" data-sf-why="">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="text-xs uppercase tracking-[0.14em] text-ink/75">{t.whyTitle}</span>
        <span className="text-lg leading-none text-ink/75 transition-transform group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true">
          +
        </span>
      </summary>
      <p className="mt-2 text-sm text-ink/80">{fmt(t.whyLead, { name: profile.name })}</p>
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {picks.map(({ q, opt }) => (
          <li key={q.id} className="min-w-0">
            {opt.swatches ? (
              <span className="flex aspect-square overflow-hidden" aria-hidden="true">
                {opt.swatches.map((hex) => (
                  <span key={hex} className="h-full flex-1" style={{ backgroundColor: hex }} />
                ))}
              </span>
            ) : cleared(opt.image) ? (
              <span className="relative block aspect-square overflow-hidden bg-stone">
                <Image src={opt.image} alt="" fill sizes="(min-width: 768px) 240px, 34vw" quality={75} className="object-cover" />
              </span>
            ) : (
              <span className="block aspect-square bg-stone" aria-hidden="true" />
            )}
            <span className="mt-1.5 block text-[10px] uppercase tracking-[0.12em] text-ink/75">{q.overline}</span>
            <span className="block text-xs leading-snug">{opt.label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink/75">
        {confidence === "mischung" ? t.whyMix : ""}
        {t.whyRules}
      </p>
    </details>
  );
}

// Mixing bar (R2, Punkt 8): the segments are server-rendered at their final
// width, so the bar is filled without JavaScript, before hydration and without
// scrolling. The fill-in is a pure CSS animation on first paint (clip-path),
// switched off under prefers-reduced-motion – then the bar is full at once.
const RESULT_KEYFRAMES =
  "@keyframes sf-mix-fill{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}" +
  "@keyframes sf-hero-settle{from{transform:scale(1.08)}to{transform:none}}" +
  // Visual P0-1: palette shutter + title rise. Resting state = final state,
  // so without animation nothing covers the photo or hides the title.
  "@keyframes sf-shutter{from{transform:scaleY(1)}to{transform:scaleY(0)}}" +
  "@keyframes sf-rise{from{transform:translateY(105%)}to{transform:none}}" +
  ".sf-shutter{transform:scaleY(0);transform-origin:top}" +
  "@media (prefers-reduced-motion:no-preference){" +
  ".sf-shutter{animation:sf-shutter .6s cubic-bezier(.76,0,.24,1) both}" +
  ".sf-rise{animation:sf-rise .9s cubic-bezier(.22,1,.36,1) both}}" +
  // site-wide "Ruhige Ansicht" toggle (globals.css: :root[data-motion=reduced])
  // ("calm" is the second accepted name, MOTION-FUNDAMENT)
  ":root:is([data-motion=reduced],[data-motion=calm]) [data-sf-anim]{animation:none!important}";

function Composition({ shares }) {
  const { t: all, profiles } = useStilCopy();
  const t = all.result;
  const visible = shares.filter((s) => s.pct > 0);
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-ink/75">{t.mixTitle}</p>
      <div className="mt-3 h-2 w-full overflow-hidden bg-ink/10" aria-hidden="true">
        <div
          data-testid="sf-mix-bar"
          className="flex h-full w-full motion-safe:animate-[sf-mix-fill_0.9s_cubic-bezier(0.22,1,0.36,1)_0.2s_both]"
        >
          {visible.map((s) => (
            <span
              key={s.key}
              className="h-full"
              style={{ width: `${s.pct}%`, backgroundColor: PROFILES[s.key].palette[2].hex }}
            />
          ))}
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm lg:grid-cols-2">
        {visible.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className="inline-block size-2.5 shrink-0"
              style={{ backgroundColor: PROFILES[s.key].palette[2].hex }}
              aria-hidden="true"
            />
            <span className="min-w-0 text-pretty">{profiles[s.key].name}</span>
            <span className="ml-auto shrink-0 whitespace-nowrap tabular-nums text-ink/80">{fmt(t.pct, { pct: s.pct })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
