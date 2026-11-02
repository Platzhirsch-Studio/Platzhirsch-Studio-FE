"use client";
// Preisrechner: "Was kostet mich ein Möbel mit X € österreichischem Bruttopreis
// in der Schweiz/Liechtenstein bzw. in Deutschland?" – rein clientseitig,
// Eingaben verlassen den Browser nicht.
import { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, m, useMotionReady, useReducedMotion } from "../motion";
import { AlertTriangle, ArrowDown, Check, ChevronDown, Info, MessageCircle } from "lucide-react";
import AnimatedNumber from "./AnimatedNumber";
import { MAX_AMOUNT, calculate, parseEuro } from "./calc";
import { money, moneyRange, pct, rate as fmtRate, isoDate } from "./format";
import { COUNTRY_ORDER } from "./rules";
import { CALC_UI_DE, fill, localCountries } from "./i18n";
import { hasRate, rateNotice } from "./rate";
import s from "./dreilaender.module.css";
import Button from "@/components/ui/Button";
import { valueBand, withContext } from "@/lib/forms/beratungContext";

const PRESETS = [2500, 8000, 25000, 60000];
const EASE = [0.22, 1, 0.36, 1];
const CHF_COUNTRIES = new Set(["CH", "FL"]);
// Zweite Live-Region: erst ansagen, wenn das Tippen ca. 800 ms ruht.
const ANNOUNCE_DELAY = 800;
const RATE_FMT = { date: isoDate, rate: fmtRate };

function useDebounced(value, delay) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return settled;
}

function RateNote({ notice }) {
  const warn = notice.level === "stale" || notice.level === "none";
  return (
    <div
      className={`rounded-md p-4 text-xs leading-relaxed ${
        warn ? "border border-error/40 bg-white text-ink" : "bg-stone/70 text-ink/80"
      }`}
    >
      <p className="flex gap-2">
        {warn ? (
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-error" />
        ) : (
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        )}
        <span className={warn ? "font-medium" : undefined}>{notice.text}</span>
      </p>
    </div>
  );
}

function EstimateBadge({ label }) {
  return (
    <span className="ml-2 inline-block whitespace-nowrap rounded-full border border-gold/60 bg-gold/10 px-2 py-0.5 align-middle text-[11px] font-semibold uppercase tracking-wide text-gold-text">
      {label}
    </span>
  );
}

function OptionCard({ opt, currency, compare, rateValue, index, T = CALC_UI_DE }) {
  const prefersReduced = useReducedMotion();
  // Vor dem Nachladen der Motion-Features kein unsichtbarer Startzustand (../motion.js).
  const motionReady = useMotionReady();
  const reduce = prefersReduced || !motionReady;
  const [open, setOpen] = useState(false);
  const detailsId = useId();

  if (!opt.available) {
    return (
      <m.li
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.08, ease: EASE }}
        className="rounded-md border border-dashed border-ink/25 bg-white/60 p-5"
      >
        <h4 className="text-base font-semibold text-ink">{opt.title}</h4>
        {opt.subtitle && <p className="mt-1 text-sm text-ink/75">{opt.subtitle}</p>}
        <p className="mt-3 flex gap-2 text-sm text-ink">
          <MessageCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold-text" />
          <span>{opt.note}</span>
        </p>
      </m.li>
    );
  }

  const ratio = compare ? Math.min(1, opt.total.max / compare) : 1;
  const mid = (opt.total.min + opt.total.max) / 2;
  const isRange = opt.total.max - opt.total.min > 0.005;

  return (
    <m.li
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: EASE }}
      className="rounded-md border border-ink/10 bg-white p-5 shadow-[0_1px_0_rgba(48,55,62,0.04),0_12px_32px_-20px_rgba(48,55,62,0.35)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <h4 className="text-base font-semibold text-ink">{opt.title}</h4>
        {opt.badge && (
          <span className="rounded-full bg-stone px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink/80">
            {opt.badge}
          </span>
        )}
      </div>
      {opt.subtitle && <p className="mt-1 text-sm text-ink/75">{opt.subtitle}</p>}

      <p className="mt-4 font-display text-[1.7rem] leading-tight text-ink tabular-nums sm:text-3xl">
        {isRange ? (
          <>
            <span className="mr-1 text-ink/70">≈</span>
            <AnimatedNumber className="whitespace-nowrap" value={opt.total.min} format={(v) => money(v, currency, 0)} />
            <span className="mx-1.5 text-ink/70">–</span>
            <AnimatedNumber
              className="whitespace-nowrap"
              value={opt.total.max}
              format={(v) => money(v, currency, 0).replace(/^[^\d-]+/, "")}
            />
          </>
        ) : (
          <AnimatedNumber value={opt.total.min} format={(v) => money(v, currency)} />
        )}
      </p>
      {opt.savings && (
        <p className="mt-1 text-sm font-medium text-gold-text">
          {opt.savings.max > 0
            ? fill(T.savings, { min: pct(Math.max(0, opt.savings.min)), max: pct(opt.savings.max) })
            : T.notCheaper}
        </p>
      )}
      {opt.condition && (
        <p className="mt-3 flex gap-2 rounded-md bg-stone/70 p-3 text-sm leading-relaxed text-ink">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold-text" />
          <span>
            <strong className="font-semibold">{opt.conditionLabel || T.condition}: </strong>
            {opt.condition}
          </span>
        </p>
      )}

      {compare ? (
        <div className="mt-4" aria-hidden="true">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone">
            <div className={`${s.bar} h-full rounded-full bg-gold`} style={{ transform: `scaleX(${ratio})` }} />
          </div>
          <div className="mt-1 flex justify-between gap-3 text-xs text-ink/75">
            <span>{T.yourPrice}</span>
            <span>{T.atGross} {money(compare, currency, 0)}</span>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((v) => !v)}
        className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink underline decoration-gold decoration-2 underline-offset-4 hover:text-gold-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {open ? T.hideCalc : T.showCalc}
        <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={detailsId}
            key="details"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <dl className="mt-3 divide-y divide-ink/10 border-y border-ink/10 text-sm">
              {opt.lines.map((l) => (
                <div key={l.label} className={`flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 ${l.add === false ? "text-ink/75 italic" : "text-ink"}`}>
                  <dt className="min-w-0">
                    {l.label}
                    {l.estimate && <EstimateBadge label={T.estimateBadge} />}
                    {l.estimate && l.source && <span className="block text-xs not-italic text-ink/75">{l.source}</span>}
                  </dt>
                  <dd className="shrink-0 tabular-nums sm:text-right">
                    {l.add === false && "("}
                    {moneyRange(l.min, l.max, currency)}
                    {l.add === false && ")"}
                    {currency === "CHF" && l.eur != null && (
                      <span className="block text-xs text-ink/75">= {money(l.eur, "EUR")}</span>
                    )}
                  </dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 py-2.5 font-semibold text-ink">
                <dt>{T.sum}</dt>
                <dd className="tabular-nums">{moneyRange(opt.total.min, opt.total.max, currency)}</dd>
              </div>
            </dl>
            {currency === "CHF" && (
              <p className="mt-2 text-xs text-ink/75">
                {fill(T.conversion, { rate: fmtRate(rateValue), mid: money(mid, currency, 0) })}
              </p>
            )}
            {opt.requirements?.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm text-ink/80">
                {opt.requirements.map((r) => (
                  <li key={r} className="flex gap-2">
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold-text" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            )}
          </m.div>
        )}
      </AnimatePresence>
      {opt.hint && <p className="mt-3 text-xs text-ink/75">{opt.hint}</p>}
    </m.li>
  );
}

export default function PriceCalculator({ country, onCountry, config, rateInfo, copy = null }) {
  // Sprache der Seite: EN/FR/IT als `copy` vom Server (src/lib/dreilaender/copy-intl.js).
  const T = useMemo(() => (copy?.calcUi ? { ...CALC_UI_DE, ...copy.calcUi } : CALC_UI_DE), [copy]);
  const COUNTRIES = useMemo(() => localCountries(copy), [copy]);
  const SHORT_TITLE = { abholung: T.shortAbholung, lieferung: T.shortLieferung };
  const motionReady = useMotionReady();
  const ids = { amount: useId(), err: useId(), delivery: useId(), help: useId() };
  const [raw, setRaw] = useState("25.000");
  const [includeDelivery, setIncludeDelivery] = useState(true);
  const amount = parseEuro(raw);

  const isChf = CHF_COUNTRIES.has(country);
  const { result, error, noRate } = useMemo(() => {
    if (!raw.trim()) return { result: null, error: T.errEmpty };
    if (!Number.isFinite(amount)) return { result: null, error: T.errNan };
    if (amount <= 0) return { result: null, error: T.errZero };
    if (amount > MAX_AMOUNT) return { result: null, error: T.errMax };
    // Ohne gültigen Kurs keine Franken-Beträge – nie stillschweigend falsch rechnen.
    if (isChf && !hasRate(rateInfo)) return { result: null, error: null, noRate: true };
    try {
      // EUR-Länder rechnen ohne Kurs; 1 ist dort nur ein Platzhalter für das Eingabeschema.
      const rate = hasRate(rateInfo) ? rateInfo.rate : 1;
      return { result: calculate({ grossAt: amount, country, rate, includeDelivery }, config, copy?.calc), error: null };
    } catch {
      return { result: null, error: T.errCalc };
    }
  }, [raw, amount, country, isChf, includeDelivery, config, rateInfo, copy, T]);

  const c = COUNTRIES[country];
  const notice = rateNotice(rateInfo, RATE_FMT, copy?.rate);
  const rateWarn = isChf && (notice.level === "stale" || notice.level === "none");
  const liveSummary = result
    ? `${c.name}: ` +
      result.options
        .filter((o) => o.available)
        .map((o) => `${o.title} ${moneyRange(o.total.min, o.total.max, result.currency)}`)
        .join("; ")
    : noRate
      ? notice.text
      : "";
  // Fehler sagt role="alert" sofort an; die lange Zusammenfassung erst, wenn das Tippen ruht.
  const summary = useDebounced(liveSummary, ANNOUNCE_DELAY);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12">
      {/* Eingabe */}
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()} noValidate>
        <fieldset id="dl-laender" className="scroll-mt-28">
          <legend className="text-sm font-semibold text-ink">{T.legend}</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            {COUNTRY_ORDER.map((code) => (
              <label
                key={code}
                className={`relative flex min-h-12 cursor-pointer items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink ${
                  country === code ? "border-ink bg-ink text-white" : "border-ink/20 bg-white text-ink hover:border-ink/50"
                }`}
              >
                <input
                  type="radio"
                  name="dl-country"
                  value={code}
                  checked={country === code}
                  onChange={() => onCountry(code)}
                  className="sr-only"
                />
                {COUNTRIES[code].name}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor={ids.amount} className="text-sm font-semibold text-ink">
            {T.amountLabel}
          </label>
          <div className="relative mt-2">
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-lg text-ink/70">
              €
            </span>
            <input
              id={ids.amount}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={raw}
              onChange={(e) => setRaw(e.target.value.slice(0, 16))}
              aria-invalid={Boolean(error)}
              aria-describedby={`${ids.help}${error ? ` ${ids.err}` : ""}`}
              className="h-14 w-full rounded-md border border-ink/25 bg-white pl-10 pr-4 font-display text-2xl text-ink tabular-nums outline-none transition-shadow focus:border-ink focus:ring-4 focus:ring-gold/40"
            />
          </div>
          <p id={ids.help} className="mt-1.5 text-xs text-ink/75">
            {T.amountHelp}
          </p>
          {error && (
            <p id={ids.err} role="alert" className="mt-1.5 text-sm font-medium text-error">
              {error}
            </p>
          )}
          {/* Mobil: Ergebnis direkt unter dem Eingabefeld, damit Tippen sofort Wirkung zeigt. */}
          {result && (
            <div className="mt-3 rounded-md bg-white p-3 ring-1 ring-ink/10 lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/75">{fill(T.priceIn, { inName: c.inName })}</p>
              <ul className="mt-1.5 space-y-1">
                {result.options
                  .filter((o) => o.available)
                  .map((o) => (
                    <li key={o.id} className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm text-ink">
                      <span>{SHORT_TITLE[o.id] || o.title}</span>
                      <span className="font-semibold tabular-nums">
                        {o.total.max - o.total.min > 0.005 ? "≈ " : ""}
                        {moneyRange(o.total.min, o.total.max, result.currency, 0)}
                      </span>
                    </li>
                  ))}
              </ul>
              <a
                href="#dl-ergebnis"
                className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink underline decoration-gold decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {T.detailsLink}
                <ArrowDown aria-hidden="true" className="size-4" />
              </a>
            </div>
          )}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setRaw(new Intl.NumberFormat("de-AT").format(p))}
                className="min-h-11 rounded-full border border-ink/15 bg-white px-1 text-sm text-ink tabular-nums transition-colors hover:border-gold hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {money(p, "EUR", 0)}
              </button>
            ))}
          </div>
        </div>

        <label htmlFor={ids.delivery} className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-ink">
          <input
            id={ids.delivery}
            type="checkbox"
            checked={includeDelivery}
            onChange={(e) => setIncludeDelivery(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-ink"
          />
          <span>
            {T.includeDelivery} <span className="text-ink/75">{T.includeDeliveryNote}</span>
          </span>
        </label>

        <RateNote notice={notice} />
      </form>

      {/* Ergebnis */}
      <div id="dl-ergebnis" className="scroll-mt-28">
        <p className="sr-only" aria-live="polite">{summary}</p>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-2xl text-ink md:text-3xl">{fill(T.priceIn, { inName: c.inName })}</h3>
          {result && (
            <p className="text-sm text-ink/75 tabular-nums">
              {T.net} <AnimatedNumber value={result.net} format={(v) => money(v, "EUR")} />
            </p>
          )}
        </div>
        <p className="mt-1 text-sm text-ink/75">{c.headline}</p>
        {rateWarn && (
          <p className="mt-4 flex gap-2 rounded-md border border-error/40 bg-white p-3 text-sm leading-relaxed text-ink">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-error" />
            <span>{notice.text}</span>
          </p>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {result ? (
            <m.ul
              key={country}
              initial={motionReady ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-5 grid grid-cols-1 items-start gap-4 xl:grid-cols-2"
            >
              {result.options.map((opt, i) => (
                <OptionCard
                  key={opt.id}
                  opt={opt}
                  index={i}
                  currency={result.currency}
                  compare={result.currency === "CHF" ? result.compare : null}
                  rateValue={result.rate}
                  T={T}
                />
              ))}
            </m.ul>
          ) : (
            <m.p key="empty" initial={motionReady ? { opacity: 0 } : false} animate={{ opacity: 1 }} className="mt-5 text-sm text-ink/75">
              {noRate ? T.noRate : T.empty}
            </m.p>
          )}
        </AnimatePresence>

        <div className="mt-6 rounded-md border-l-4 border-gold bg-white p-4 text-sm text-ink">
          <p className="font-semibold">{T.disclaimerTitle}</p>
          <p className="mt-1 text-ink/75">{T.disclaimerText}</p>
          {/* r8-leads (ux P1-3/P1-6): the standard buttons of the site (components/ui
              Button, normal case, tokens); "Termin anfragen" carries the result as
              context – country and a value BAND, no exact amount, nothing personal. */}
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              href={withContext("/beratung", { planer: "dreilaender", land: country, wert: result ? valueBand(amount) : null })}
              variant="primary"
              arrow
              data-dl-termin=""
            >
              {T.termin}
            </Button>
            <Button href="/kontakt" variant="secondary">
              {T.kontakt}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
