"use client";

import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, LabsMotion, m, useCalmMotion, useMotionReady } from "../motion";
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from "lucide-react";
import { PROFILES, profileBySlug, resultHref } from "./profiles";
import { QUESTIONS, isValidCode, leadingProfile, scoreAnswers } from "./questions";
import { useLastResult, forgetLastResult } from "./storage";
import { blurBackdrop } from "./blurBackdrop";
import { kernW } from "./kernW";
import { questionLabel, quizOwnsKey } from "./keyScope";
import { StilCopyProvider, useStilCopy } from "./StilCopy";
import { fmt, rich } from "./localize";
import { FIRST_CHECK_MS, RECHECK_MS, navFallbackDecision } from "./navFallback";
// R2 gesamtwerk P2-2: nicht dasselbe Foto wie der Startseiten-Hero (aboutHome.jpg) – eigener Showroom-Blick
import iCollage1 from "../../../../public/Images/Home/secondAboutHome.jpg";
import iCollage2 from "../../../../public/Images/Outdoor/bannerImage5.jpg";
// Abnahme Runde 3: the showroom instead of the gold Tom-Dixon-like pendants
// (Licht4) until the owner has cleared the archive pictures
import iCollage3 from "../../../../public/Images/UberUns/living.jpg";

const EASE = [0.22, 1, 0.36, 1];
const TOTAL = QUESTIONS.length;
const pad = (n) => String(n).padStart(2, "0");
// Sicherheitsnetz bei hängender Client-Navigation: siehe ./navFallback.js

// Programmatic focus targets (headings, status) need no ring; the global
// :focus-visible rule is unlayered, so an inline style is the only override.
const NO_RING = { outline: "none", boxShadow: "none" };

const toCode = (list) => list.map((a) => (a === null || a === "x" ? "x" : String(a))).join("");

// ── Image preloading ────────────────────────────────────────────────────────
// Every image option is 2 columns wide on phones, except an odd last one that
// spans the full row. The same `sizes` is used for rendering and preloading,
// so the browser picks the same srcset candidate and the preload is a cache hit.
const isWide = (i, count) => count % 2 === 1 && i === count - 1;
// Optik-QA planer-tools: Tablet (640–1023 px) mit 5 Bildern als 3 + 2 auf einem
// 6er-Raster statt 3 + 2 + Loch; die zweite Reihe ist je halb so breit wie die Seite.
const isTabletPair = (i, count) => count === 5 && i >= 3;
const optionSizes = (i, count) =>
  `(min-width: 1024px) 20vw, (min-width: 640px) ${isTabletPair(i, count) ? "50vw" : "33vw"}, ${isWide(i, count) ? "100vw" : "50vw"}`;
const optionSpan = (i, count) => {
  const phone = isWide(i, count) ? "col-span-2" : "";
  if (count === 5) return `${phone} ${isTabletPair(i, count) ? "sm:col-span-3" : "sm:col-span-2"} lg:col-span-1`;
  return isWide(i, count) ? "col-span-2 sm:col-span-1" : "";
};
const optionAspect = (i, count) =>
  `${isWide(i, count) ? "aspect-[2/1]" : "aspect-[4/5]"} ${isTabletPair(i, count) ? "sm:aspect-[3/2] lg:aspect-[3/4]" : "sm:aspect-[3/4]"}`;

// QM r4: einspaltig, wenn die Antwortspalte schmaler als 20 em ist (Container-Abfrage in em
// wächst mit der Textgröße: normal 320 px, bei 200 % Text 640 px). Nie bei normaler Schrift auf 375-px-Handys.
const ONE_COL = "@max-[20em]/opts:grid-cols-1!";
const ONE_COL_ITEM = "@max-[20em]/opts:col-span-1!";
// QM r4 (iPad hoch, Frage 03): 5 Paletten als 3 + 2 auf dem 6er-Raster statt 3 + 2 + leere Zelle
const paletteSpan = (i, count) => {
  if (count === 5) return `${isWide(i, count) ? "col-span-2" : ""} ${isTabletPair(i, count) ? "sm:col-span-3" : "sm:col-span-2"} lg:col-span-1`;
  return isWide(i, count) ? "col-span-2 sm:col-span-1" : "";
};

const preloaded = new Set();
const keepAlive = []; // hold references so the requests are not dropped early

function preloadQuestion(index) {
  const q = QUESTIONS[index];
  if (!q || q.kind !== "image" || typeof window === "undefined" || preloaded.has(q.id)) return;
  preloaded.add(q.id);
  q.options.forEach((opt, i) => {
    const { props } = getImageProps({
      src: opt.image,
      alt: "",
      fill: true,
      quality: 75,
      sizes: optionSizes(i, q.options.length),
    });
    const img = new window.Image();
    img.decoding = "async";
    if (props.sizes) img.sizes = props.sizes;
    if (props.srcSet) img.srcset = props.srcSet;
    img.src = props.src;
    keepAlive.push(img);
  });
}

function whenIdle(fn) {
  if (typeof window === "undefined") return () => {};
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(fn, { timeout: 1200 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 300);
  return () => window.clearTimeout(id);
}

// LazyMotion-Hülle (R5): domMax wegen drag (Wischen zurück), Features laden
// nach der Hydration. Vorher kein unsichtbarer Startzustand, siehe ../motion.js.
// Mehrsprachigkeit (01.11.2026): `copy` = Texte genau einer Sprache vom Server
// (stilfinderClientCopy), nicht aus den next-intl-Messages.
export default function StilfinderQuiz({ copy }) {
  return (
    <StilCopyProvider copy={copy}>
      <LabsMotion features="max">
        <StilfinderQuizInner />
      </LabsMotion>
    </StilCopyProvider>
  );
}

function StilfinderQuizInner() {
  const { locale, t, questions } = useStilCopy();
  const router = useRouter();
  const reduce = useCalmMotion(); // System-Einstellung ODER Ruhige Ansicht (data-motion)
  const motionReady = useMotionReady();
  const [step, setStep] = useState(-1); // -1 intro, 0..TOTAL-1 questions, TOTAL finishing
  const [answers, setAnswers] = useState(() => Array(TOTAL).fill(null));
  const [dir, setDir] = useState(1);
  const [target, setTarget] = useState(null); // result URL once finished
  // The question that is actually on screen. AnimatePresence mode="wait" keeps
  // the outgoing question visible while it fades; the counter follows the
  // question on screen, not `step` (R2, Punkt 7).
  const [shown, setShown] = useState(0);
  const lock = useRef(false);
  const timers = useRef([]);
  // router.push inside a transition: isPending stays true while the result
  // route is still being fetched/rendered (slow server ≠ stuck navigation).
  const [navPending, startNav] = useTransition();
  const navPendingRef = useRef(false);
  useEffect(() => {
    navPendingRef.current = navPending;
  }, [navPending]);

  const stored = useLastResult();
  const last = stored && (stored.code === "" || isValidCode(stored.code)) && profileBySlug(stored.slug) ? stored : null;

  // Clear pending navigation timers when the quiz unmounts (= navigation done).
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);

  // From question 6 on, warm up the result route of the profile that is
  // currently ahead (loading skeleton + route code).
  useEffect(() => {
    if (step < TOTAL - 2 || step >= TOTAL) return;
    const lead = leadingProfile(answers);
    if (lead) router.prefetch(resultHref(PROFILES[lead], null, locale));
  }, [step, answers, router, locale]);

  const finish = useCallback(
    (final) => {
      const code = toCode(final);
      const result = scoreAnswers(code);
      if (!result) return;
      const href = resultHref(PROFILES[result.primary], code, locale);
      setTarget(href);
      setStep(TOTAL);
      router.prefetch(href);
      const quizPath = window.location.pathname;
      // A short, deliberate pause: the "composing your board" moment.
      // Visual P0-2: 1.2 s lets the title card (palette columns + name) land
      // before the cut; the route is prefetched meanwhile.
      timers.current.push(window.setTimeout(() => startNav(() => router.push(href)), reduce ? 150 : 1200));
      // Safety net (QM r4): only a navigation that has visibly stopped (no
      // pending transition, URL unchanged) is replaced by a plain page load –
      // never one that is merely slow, never twice, never while the page is
      // already unloading (Next's own fallback). See ./navFallback.js.
      const started = Date.now();
      let leaving = false;
      const onLeave = () => {
        leaving = true;
      };
      // pagehide only – a beforeunload listener would cost the bfcache.
      // Next's own hard fallback keeps the transition pending (unresolved
      // thenable), so it never races this check either.
      window.addEventListener("pagehide", onLeave, { once: true });
      const check = () => {
        const decision = navFallbackDecision({
          elapsed: Date.now() - started,
          pending: navPendingRef.current,
          moved: window.location.pathname !== quizPath,
          leaving,
          done: false,
        });
        if (decision === "wait") timers.current.push(window.setTimeout(check, RECHECK_MS));
        else if (decision === "assign") window.location.assign(href);
      };
      timers.current.push(window.setTimeout(check, FIRST_CHECK_MS));
    },
    [router, reduce, locale, startNav],
  );

  const goTo = useCallback((next, direction) => {
    setDir(direction);
    setStep(next);
    const el = document.getElementById("stilfinder");
    const top = el?.getBoundingClientRect().top;
    if (top !== undefined && top < 0) el.scrollIntoView({ block: "start" });
  }, []);

  const choose = useCallback(
    (qIndex, value) => {
      if (lock.current) return;
      lock.current = true;
      const next = answers.slice();
      next[qIndex] = value;
      setAnswers(next);
      window.setTimeout(
        () => {
          lock.current = false;
          if (qIndex + 1 >= TOTAL) finish(next);
          else goTo(qIndex + 1, 1);
        },
        reduce ? 60 : 380,
      );
    },
    [answers, finish, goTo, reduce],
  );

  const back = useCallback(() => {
    if (lock.current) return;
    if (step > 0) goTo(step - 1, -1);
    else if (step === 0) goTo(-1, -1);
  }, [step, goTo]);

  // Keyboard: 1–5 choose, ← / Backspace back.
  // WCAG 2.2 SC 2.1.4 (Character Key Shortcuts): only while focus is inside
  // the quiz (or on <body>), never while typing in the KI-Concierge, the
  // cookie banner or a contenteditable field (keyScope.js).
  useEffect(() => {
    if (step < 0 || step >= TOTAL) return undefined;
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (!quizOwnsKey(e.target, document.getElementById("stilfinder"))) return;
      const q = QUESTIONS[step];
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= q.options.length) {
        e.preventDefault();
        choose(step, n - 1);
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, choose, back]);

  const variants = {
    // QM r2: Start bei 30 % statt 0 % und kürzerer Ausgang – vorher ~0,35 s komplett leer
    // QM r3: Fragewechsel wirkte wie ein Ladeaussetzer (≈ 1 s blass/leer, iPad) – Einstieg ab 60 %,
    // kürzerer Ausgang ohne Unschärfe-Filter (teuer in WebKit), kleinerer Versatz.
    enter: (d) => (reduce ? { opacity: 0 } : { opacity: 0.6, x: d * 16 }),
    center: {
      opacity: 1,
      x: 0,
      pointerEvents: "auto",
      transition: { duration: reduce ? 0.15 : 0.3, ease: EASE },
    },
    // pointer-events off while fading out: a quick double tap must not answer
    // the outgoing question a second time.
    // Visual P1-2: the outgoing question recedes (slight drift, scale and
    // focus pull) instead of sliding as a flat sheet; the new one enters with
    // the staggered card wipe (cardMotion).
    exit: (d) =>
      reduce
        ? { opacity: 0, pointerEvents: "none" }
        : {
            opacity: 0,
            x: d * -12,
            pointerEvents: "none",
            transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
          },
  };

  return (
    <section
      id="stilfinder"
      aria-label={t.name}
      className="relative overflow-x-clip bg-[#faf8f4] px-gutter pb-28 pt-12 font-normal text-ink [font-kerning:normal] sm:pt-16 md:pb-20 md:pt-24 lg:pt-28 [@media(max-height:500px)]:pt-6!"
    >
      <div className="mx-auto max-w-page">
        {step >= 0 && step < TOTAL && <Progress step={shown} answers={answers} reduce={reduce} />}

        <AnimatePresence mode="wait" custom={dir} initial={false}>
          {step === -1 && (
            <m.div
              key="intro"
              custom={dir}
              variants={variants}
              initial={motionReady ? "enter" : false}
              animate="center"
              exit="exit"
            >
              <Intro
                reduce={reduce}
                last={last}
                focusOnMount={dir === -1}
                onStart={() => {
                  setAnswers(Array(TOTAL).fill(null));
                  setShown(0);
                  goTo(0, 1);
                }}
                onForget={forgetLastResult}
              />
            </m.div>
          )}

          {step >= 0 && step < TOTAL && (
            <m.div
              key={QUESTIONS[step].id}
              custom={dir}
              variants={variants}
              initial={motionReady ? "enter" : false}
              animate="center"
              exit="exit"
              // Swipe right = one question back (touch). Vertical scrolling stays native.
              drag={reduce || step === 0 ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              dragDirectionLock
              onDragEnd={(_, info) => {
                if (info.offset.x > 90 || info.velocity.x > 600) back();
              }}
            >
              <QuestionView
                q={questions[step]}
                index={step}
                value={answers[step]}
                onChoose={(v) => choose(step, v)}
                onBack={back}
                onShown={setShown}
                reduce={reduce}
              />
            </m.div>
          )}

          {step === TOTAL && (
            <m.div
              key="done"
              initial={motionReady ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Composing answers={answers} href={target} reduce={reduce} />
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Progress({ step, answers, reduce }) {
  const { t } = useStilCopy();
  const done = answers.filter((a) => a !== null).length;
  // QM r3: „07 / 07“ zeigt einen vollen Balken (Frage n von 7 = n/7), nicht den Stand der Vorfrage
  const pct = Math.round(((step + 1) / TOTAL) * 100);
  return (
    <div className="mb-5 md:mb-12 [@media(max-height:500px)]:mb-4!">
      <div className="flex items-baseline justify-between text-xs uppercase tracking-[0.14em] text-ink/75">
        <span>{t.name}</span>
        <span className="tabular-nums" aria-hidden="true">
          {pad(step + 1)} / {pad(TOTAL)}
        </span>
      </div>
      <div
        className="mt-3 h-px w-full bg-ink/15"
        role="progressbar"
        aria-label={t.quiz.progress}
        aria-valuemin={0}
        aria-valuemax={TOTAL}
        aria-valuenow={done}
        aria-valuetext={fmt(t.quiz.questionOf, { n: step + 1, total: TOTAL })}
      >
        <m.div
          className="h-px bg-ink"
          initial={false}
          animate={{ width: `${Math.max(pct, 3)}%` }}
          transition={{ duration: reduce ? 0 : 0.6, ease: EASE }}
        />
      </div>
    </div>
  );
}

const COLLAGE = [
  { src: iCollage1, sizes: "(min-width: 768px) 32vw, 33vw", big: true },
  { src: iCollage2, sizes: "(min-width: 768px) 16vw, 33vw" },
  { src: iCollage3, sizes: "(min-width: 768px) 16vw, 33vw" },
];

function Intro({ onStart, last, onForget, reduce, focusOnMount }) {
  const { locale, t, profiles } = useStilCopy();
  const lastProfile = last ? profileBySlug(last.slug) : null;
  const motionReady = useMotionReady();
  const headingRef = useRef(null);

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus({ preventScroll: true });
    // Question 1 is one tap away: fetch its photos now, question 2 when idle.
    preloadQuestion(0);
    return whenIdle(() => preloadQuestion(1));
  }, [focusOnMount]);

  return (
    <div className="grid items-center gap-6 md:grid-cols-12 md:gap-12">
      {/* Collage: a 3-image strip above the text on phones, a flush 2×2 grid beside it from md. */}
      <div
        className="grid aspect-[3/1] grid-cols-3 gap-2 md:order-last md:col-span-6 md:aspect-auto md:h-[min(70vh,560px)] md:grid-rows-2 md:gap-3"
        aria-hidden="true"
      >
        {COLLAGE.map((img, i) => (
          <m.div
            key={img.src.src}
            className={`relative h-full overflow-hidden bg-stone ${img.big ? "md:col-span-2 md:row-span-2" : ""}`}
            initial={reduce || !motionReady ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 + i * 0.12, ease: EASE }}
          >
            <Image
              src={img.src}
              alt=""
              fill
              style={blurBackdrop(img.src)}
              preload={i === 0}
              loading={i === 0 ? undefined : "eager"}
              sizes={img.sizes}
              className="object-cover"
            />
          </m.div>
        ))}
      </div>
      {/* QM r4: Textspalte als Container – bei 200 % Text füllte die H1 in 4 Zeilen den ersten Bildschirm */}
      <div className="@container md:col-span-6">
        <p className="text-xs uppercase tracking-[0.14em] text-gold-text">{t.name}</p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          style={NO_RING}
          className="font-display mt-3 text-[min(2.4rem,13cqi)] leading-[1.02] outline-none sm:mt-4 sm:text-[min(3.75rem,13cqi)] lg:text-[min(4.5rem,13cqi)]"
        >
          {/* R2 P2: Bodoni Moda has no kerning pairs for W + lowercase, so
              "W elcher" showed a visible gap. Local optical kern until the
              global display fix lands; spans stay inside the word, so screen
              readers still read "Welcher Wohnstil". kernW() setzt denselben
              Span (Mehrsprachigkeit: Text aus intl/<locale>.js). */}
          {kernW(t.quiz.h1a)}{" "}
          <em className="italic">{t.quiz.h1b}</em>
        </h1>
        {/* Abnahme Runde 3, P3.6 / Feinschliff P2.1: on phones the floating KI
            button sits bottom right over the text column. The concierge
            publishes --ph-concierge-h (64 px, unset when it is off). That is
            the button HEIGHT; the button itself is about 75 px wide plus the
            16 px edge, so the text keeps 1.25 x the value (80 px) on the right
            and never runs under it. Without the concierge the padding is 0.
            tests/e2e/stilfinder-ki-abstand.spec.js measures the rects.
            Motion/CLS (01.11.2026): the gap only applies while a launcher is
            actually in the page. Since R7-P4 phones show no floating button
            when closed, but the variable still arrives ~5 s after load – the
            late padding re-wrapped the intro (CLS 0.069 at 390 px). */}
        <div data-sf-ki-gap="" className="max-md:[body:has([data-concierge-launcher])_&]:pr-[calc(var(--ph-concierge-h,0px)*1.25)]">
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink/80 sm:mt-6">
            {/* UX-Benchmark fix-04: accurate count – five photo questions, one colour
                question, one optional question about the project. */}
            {t.quiz.lead}
          </p>
          <p className="mt-4 text-sm text-ink/75">{t.quiz.facts}</p>
          <div className="mt-7 flex flex-wrap items-center gap-4 sm:mt-8">
            <button
              type="button"
              onClick={onStart}
              className="ph-press inline-flex min-h-12 items-center gap-3 bg-ink px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-ink-deep focus-visible:outline-offset-4"
            >
              {t.quiz.start} <ArrowRight className="size-4" aria-hidden="true" />
            </button>
            {last && (
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Link
                  href={resultHref(lastProfile, last.code || null, locale)}
                  className="inline-flex min-h-11 items-center underline underline-offset-4"
                >
                  {fmt(t.quiz.remembered, { name: profiles[lastProfile.key]?.name || last.name })}
                </Link>
                <button
                  type="button"
                  onClick={onForget}
                  className="inline-flex min-h-11 items-center text-ink/75 underline underline-offset-4"
                >
                  {t.quiz.forget}
                </button>
              </span>
            )}
          </div>
          <p className="mt-8 max-w-md text-xs leading-relaxed text-ink/75">
            {rich(t.quiz.privacy, {
              link: (
                <Link key="privacy" href={`/${locale}/datenschutz`} className="underline underline-offset-2">
                  {t.quiz.privacyLink}
                </Link>
              ),
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

function QuestionView({ q, index, value, onChoose, onBack, onShown, reduce }) {
  const { t } = useStilCopy();
  const groupId = `sf-q-${q.id}`;
  const headingRef = useRef(null);

  // Runs when this question is actually mounted (AnimatePresence mode="wait"
  // mounts it only after the previous one has left), so focus never falls
  // back to <body>. Also warms the cache: the next question right away, all
  // later ones when the browser is idle (whoever started will need them).
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    preloadQuestion(index + 1);
    return whenIdle(() => {
      for (let i = index + 2; i < TOTAL; i++) preloadQuestion(i);
    });
  }, [index]);

  // Counter follows the question on screen; layout effect = before its first paint.
  useLayoutEffect(() => {
    onShown?.(index);
  }, [index, onShown]);

  return (
    // QM r2 (phone-quer): flache Querformate zeigen Frage und Antworten nebeneinander
    <div className="[@media(max-height:500px)_and_(min-width:640px)]:grid [@media(max-height:500px)_and_(min-width:640px)]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] [@media(max-height:500px)_and_(min-width:640px)]:items-start [@media(max-height:500px)_and_(min-width:640px)]:gap-x-6">
      <div>
      <p className="text-xs uppercase tracking-[0.14em] text-gold-text">{q.overline}</p>
      <h2
        id={groupId}
        ref={headingRef}
        tabIndex={-1}
        style={NO_RING}
        // The visual counter (01 / 07) is aria-hidden; the focused heading
        // carries the position: "Frage 2 von 7: Welche Oberfläche …".
        aria-label={questionLabel(index, TOTAL, q.title, t.quiz.questionLabel)}
        className="font-display mt-2 max-w-3xl text-[1.75rem] leading-tight outline-none sm:mt-3 sm:text-4xl lg:text-5xl [@media(max-height:500px)_and_(min-width:640px)]:text-[1.75rem]"
      >
        {kernW(q.title)}
      </h2>
      {q.hint && <p className="mt-3 max-w-xl text-sm text-ink/75">{q.hint}</p>}
      <p className="sr-only">{fmt(t.quiz.keysHint, { n: q.options.length })}</p>
      {index === 1 && !reduce && (
        <p className="mt-2 hidden text-xs text-ink/75 [@media(pointer:coarse)]:block" aria-hidden="true">
          {t.quiz.swipe}
        </p>
      )}

      </div>
      {/* QM r4: Container in em – bei 200 % Text (Antwortspalte < 20 em) stehen die Karten einspaltig statt „Golde|nes Glühe…“ */}
      <div role="group" aria-labelledby={groupId} className="@container/opts mt-5 sm:mt-8 [@media(max-height:500px)_and_(min-width:640px)]:mt-0">
        {q.kind === "image" && <ImageOptions q={q} value={value} onChoose={onChoose} reduce={reduce} />}
        {q.kind === "palette" && <PaletteOptions q={q} value={value} onChoose={onChoose} reduce={reduce} />}
        {q.kind === "scope" && <ScopeOptions q={q} value={value} onChoose={onChoose} />}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4 text-sm [@media(max-height:500px)_and_(min-width:640px)]:col-span-2 [@media(max-height:500px)_and_(min-width:640px)]:mt-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center gap-2 text-ink/80 underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> {index === 0 ? t.quiz.toIntro : t.quiz.back}
        </button>
        {q.optional && (
          <button
            type="button"
            onClick={() => onChoose("x")}
            className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4"
          >
            {t.quiz.skip} <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

function Selected() {
  return (
    <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white text-ink">
      <Check className="size-4" aria-hidden="true" />
    </span>
  );
}

// Visual P1-2: cards open like a print being uncovered (clip-path wipe from
// the bottom edge plus a short rise), staggered left to right. clipPath is
// dropped at the end (transitionEnd), otherwise it would cut off the
// selection ring that sits outside the card.
const cardMotion = (reduce, i) => ({
  initial: reduce ? false : { opacity: 0.6, y: 12, clipPath: "inset(12% 0% 0% 0%)" },
  animate: { opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)", transitionEnd: { clipPath: "none" } },
  transition: { duration: 0.4, delay: reduce ? 0 : 0.04 * i, ease: EASE },
});

// Visual P1-3: the "commit" beat. Between the tap and the next question
// (380 ms in choose()) the picked card stays, the others step back – the
// visitor sees the decision land before the page moves on. Local state, so
// a revisited question (back) shows all cards at full strength again. The
// class sits on the <button>: framer owns the inline opacity of the <li>.
const stepBack = (picked, i) =>
  picked !== null && picked !== i
    ? "opacity-35 saturate-[0.35] transition-[opacity,filter] duration-300 motion-reduce:transition-none"
    : "transition-[opacity,filter] duration-300 motion-reduce:transition-none";

function ImageOptions({ q, value, onChoose, reduce }) {
  const motionReady = useMotionReady();
  const calm = reduce || !motionReady;
  const count = q.options.length;
  const [picked, setPicked] = useState(null);
  return (
  // QM r5 (Desktop, 200 % Text): ab lg Spaltenzahl aus der Kartenbreite in rem statt fest 5 – bei
  // normaler Schrift 5 nebeneinander (je ≥ 160 px), bei 200 % Text 3 + 2 statt fünf schmaler Karten mit Trennungen.
    <ul className={`grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] lg:gap-4 ${count === 5 ? "sm:grid-cols-6" : "sm:grid-cols-3"} ${ONE_COL}`}>
      {q.options.map((opt, i) => {
        const active = value === i;
        return (
          <m.li
            key={opt.label}
            className={`${optionSpan(i, count)} ${ONE_COL_ITEM}`}
            {...cardMotion(calm, i)}
          >
            <button
              type="button"
              onClick={() => {
                setPicked(i);
                onChoose(i);
              }}
              aria-pressed={active}
              className={`@container group relative block w-full overflow-hidden bg-stone text-left outline-offset-4 ${
                optionAspect(i, count)
              } @max-[20em]/opts:aspect-[3/2]! ${active ? "ring-2 ring-ink ring-offset-2 ring-offset-[#faf8f4]" : ""} ${stepBack(picked, i)}`}
            >
              <Image
                src={opt.image}
                alt={opt.alt}
                fill
                loading="eager"
                fetchPriority={i < 2 ? "high" : undefined}
                style={blurBackdrop(opt.image)}
                sizes={optionSizes(i, count)}
                quality={75}
                className={`object-cover transition-transform duration-(--duration-enter) ease-quiet motion-reduce:transition-none ${
                  active ? "motion-safe:scale-[1.04]" : "motion-safe:group-hover:scale-[1.04]"
                }`}
              />
              {/* QM r3: kräftigerer Verlauf (Titel auf hellen Fensterflächen) und Silbentrennung statt Abschneiden („Olivenbäume|n“) */}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/55 to-transparent px-3 pb-3 pt-12 text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.45)]">
                <span className="block text-[11px] tabular-nums tracking-[0.14em] text-white/85">{pad(i + 1)}</span>
                {/* QM r3: Schriftgröße nach Kartenbreite (Container) statt Fenster – schmale Karten (Handy quer) trennten „Olivenbäum|en“ */}
                <span className="font-display block hyphens-auto text-base leading-tight [overflow-wrap:break-word] @min-[12rem]:text-xl">{kernW(opt.label)}</span>
              </span>
              {active && <Selected />}
            </button>
          </m.li>
        );
      })}
    </ul>
  );
}

function PaletteOptions({ q, value, onChoose, reduce }) {
  const motionReady = useMotionReady();
  const calm = reduce || !motionReady;
  const count = q.options.length;
  const [picked, setPicked] = useState(null);
  return (
    <ul className={`grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-5 lg:gap-4 ${count === 5 ? "sm:grid-cols-6" : "sm:grid-cols-3"} ${ONE_COL}`}>
      {q.options.map((opt, i) => {
        const active = value === i;
        return (
          <m.li key={opt.label} className={`${paletteSpan(i, count)} ${ONE_COL_ITEM}`} {...cardMotion(calm, i)}>
            <button
              type="button"
              onClick={() => {
                setPicked(i);
                onChoose(i);
              }}
              aria-pressed={active}
              className={`group relative block w-full bg-white text-left outline-offset-4 ${
                active ? "ring-2 ring-ink ring-offset-2 ring-offset-[#faf8f4]" : "ring-1 ring-ink/10"
              } ${stepBack(picked, i)}`}
            >
              {/* Motion (01.11.2026): hovered tone widens by transform only
                  (scale-x inside the clipped band, was flexGrow = layout shift).
                  hover: only fires with a real mouse; motion-safe also covers
                  the "Ruhige Ansicht" (data-motion). */}
              <span className="flex h-28 overflow-hidden sm:h-48" aria-hidden="true">
                {opt.swatches.map((hex) => (
                  <span
                    key={hex}
                    className="relative h-full flex-1 motion-safe:transition-transform motion-safe:duration-(--duration-ui) motion-safe:ease-quiet motion-safe:hover:z-10 motion-safe:hover:scale-x-[1.35]"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </span>
              <span className="block px-3 py-3">
                <span className="block text-[11px] tabular-nums tracking-[0.14em] text-ink/75">{pad(i + 1)}</span>
                <span className="font-display block text-lg leading-tight">{kernW(opt.label)}</span>
              </span>
              {active && <Selected />}
            </button>
          </m.li>
        );
      })}
    </ul>
  );
}

function ScopeOptions({ q, value, onChoose }) {
  const { t } = useStilCopy();
  // Owner-set price ranges; options without one (null) show no price line.
  // Identical ranges are shown once below the options.
  const ranges = [...new Set(q.options.map((o) => o.range).filter(Boolean))];
  const shared = ranges.length === 1 ? ranges[0] : null;
  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2">
        {q.options.map((opt, i) => {
          const active = value === i;
          return (
            <li key={opt.label}>
              <button
                type="button"
                onClick={() => onChoose(i)}
                aria-pressed={active}
                className={`relative flex min-h-20 w-full flex-col items-start justify-center gap-1 border px-5 py-4 text-left outline-offset-4 transition-colors ${
                  active ? "border-ink bg-white" : "border-ink/15 bg-white/60 hover:border-ink/40"
                }`}
              >
                <span className="text-[11px] tabular-nums tracking-[0.14em] text-ink/75">{pad(i + 1)}</span>
                <span className="font-display text-xl leading-tight">{kernW(opt.label)}</span>
                <span className="text-sm text-ink/75">{opt.sub}</span>
                {!shared && opt.range && (
                  <span className="mt-1 text-xs text-ink/75">
                    {t.quiz.rangeOne} <span className="font-medium">{opt.range}</span>
                  </span>
                )}
                {active && <Selected />}
              </button>
            </li>
          );
        })}
      </ul>
      {shared && (
        <p className="mt-3 text-xs text-ink/75">
          {t.quiz.rangeShared} <span className="font-medium">{shared}</span>
        </p>
      )}
    </>
  );
}

function Composing({ answers, href, reduce }) {
  const { t, profiles } = useStilCopy();
  const motionReady = useMotionReady();
  const ref = useRef(null);
  const result = scoreAnswers(toCode(answers));
  const profile = result ? profiles[result.primary] : profiles.ruhe;

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="grid min-h-[50vh] place-items-center text-center">
      <div ref={ref} tabIndex={-1} style={NO_RING} className="outline-none" role="status" aria-live="polite">
        {/* Visual P0-2: the composing beat as a title card. The five tones of
            the profile rise as tall columns (the same bands then lift off the
            hero photo on the result page, fix-01), the profile name rises out
            of a mask. Transform only – everything is visible without motion. */}
        <div className="mx-auto flex h-40 w-[min(36rem,100%)] gap-1 sm:h-56 sm:gap-1.5" aria-hidden="true">
          {profile.palette.map((c, i) => (
            <m.span
              key={c.hex}
              className="h-full flex-1 origin-bottom"
              style={{ backgroundColor: c.hex }}
              initial={reduce || !motionReady ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.75, delay: i * 0.07, ease: [0.76, 0, 0.24, 1] }}
            />
          ))}
        </div>
        <p className="mt-8 text-xs uppercase tracking-[0.14em] text-gold-text">{t.quiz.composingEyebrow}</p>
        <p className="font-display mt-3 overflow-hidden pb-[0.08em] text-4xl leading-[1.05] sm:text-6xl">
          <m.span
            className="block"
            initial={reduce || !motionReady ? false : { y: "105%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
          >
            {kernW(profile.name)}
          </m.span>
        </p>
        <p className="mt-4 text-base text-ink/80 sm:text-lg">{t.quiz.composing}</p>
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-ink/75">
          <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" /> {t.quiz.loadingPieces}
        </p>
        {href && (
          <p className="mt-6">
            {/* Plain <a>: a full page load that works even if client navigation stalls. */}
            <a href={href} className="inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4">
              {t.quiz.openResult} <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
