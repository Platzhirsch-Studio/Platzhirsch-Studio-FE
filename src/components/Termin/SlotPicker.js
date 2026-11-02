"use client";
// Kalender des Online-Termins: zwei Wochen je Ansicht, Tage und Uhrzeiten als
// native Radiogruppen. Damit gelten die Tastaturregeln des Browsers (Tab in
// die Gruppe, Pfeiltasten wechseln, Leertaste wählt) und Screenreader hören
// „Dienstag, 3. November, 5 Zeiten frei, Optionsfeld 2 von 9“. Belegte,
// geschlossene und Feiertage sind deaktiviert und nennen den Grund als Text
// (Farbe ist nie das einzige Merkmal, WCAG 1.4.1). Zeiten in Europe/Vienna.
// Daten: GET /api/termin/slots (src/app/api/termin/slots/route.js).
import { useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import cx from "@/components/ui/cx";
import { fill, langTag } from "@/lib/booking/format";
import { addDays, diffDays, firstBookableMonday, localYmd, mondayOf } from "@/lib/booking/time";
import { HORIZON_DAYS } from "@/lib/booking/constants";

const WINDOW = 14;
const noop = () => () => {};
// Zonen mit gleicher Uhrzeit wie Lochau: kein Hinweis nötig.
const SAME_TIME = /^Europe\/(Vienna|Berlin|Zurich|Vaduz|Rome|Paris|Busingen)$/;
function deviceZone() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone && !SAME_TIME.test(zone) ? zone : null;
  } catch {
    return null;
  }
}

function dayLabel(ymd, locale, opts) {
  return new Intl.DateTimeFormat(langTag(locale), { timeZone: "UTC", ...opts }).format(new Date(`${ymd}T12:00:00Z`));
}

export default function SlotPicker({ art, modus, locale, copy, value, onChange, error, phone }) {
  const z = copy.zeit;
  const id = useId();
  const today = useMemo(() => localYmd(new Date()), []);
  // QM content-legal r2: am Wochenende wäre die ganze laufende Woche „vorbei“ –
  // dann beginnt der Kalender mit der kommenden Woche.
  const firstMonday = useMemo(() => firstBookableMonday(today), [today]);
  const [from, setFrom] = useState(() => (value?.date && diffDays(firstMonday, mondayOf(value.date)) > 0 ? mondayOf(value.date) : firstMonday));
  const [state, setState] = useState({ key: "", status: "loading", days: [] });
  const [day, setDay] = useState(value?.date || null);
  const [reload, setReload] = useState(0);
  const otherZone = useSyncExternalStore(noop, deviceZone, () => null);
  const to = addDays(from, WINDOW - 1);
  const canPrev = diffDays(firstMonday, from) > 0;
  const canNext = diffDays(today, addDays(from, WINDOW)) <= HORIZON_DAYS;

  const query = new URLSearchParams({ art, von: from, bis: to, ...(modus && art === "planung" ? { modus } : {}) }).toString();
  const key = `${query}|${reload}`;

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/termin/slots?${query}`, { signal: ctrl.signal, headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body) => setState({ key, status: "ready", days: body.days || [] }))
      .catch((err) => {
        if (err?.name !== "AbortError") setState({ key, status: "error", days: [] });
      });
    return () => ctrl.abort();
  }, [query, key]);

  // Bis die Antwort zur aktuellen Ansicht da ist: "loading" (Raster gedimmt, Platzhalter).
  const status = state.key === key ? state.status : "loading";
  const days = state.key === key ? state.days : [];
  const selectedDay = days.find((d) => d.date === day) || null;
  const anyOpen = days.some((d) => d.status === "open");
  const reason = { closed: z.closed, holiday: z.holiday, full: z.full, past: z.past, later: z.later, soon: z.soon };

  function pickDay(d) {
    setDay(d.date);
    if (value?.date !== d.date) onChange(null);
    // Handy: Die Uhrzeiten erscheinen unter dem Kalender. Sanft in Sicht holen,
    // der Fokus bleibt auf dem Tag (kein Fokusraub).
    requestAnimationFrame(() => {
      const el = document.getElementById(`${id}-times`);
      if (!el || el.getBoundingClientRect().top < window.innerHeight - 96) return;
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || ["reduced", "calm"].includes(document.documentElement.dataset.motion);
      el.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
    });
  }

  // QM r2: ein Datum bricht nie in sich um („8. / November“) – geschützte Leerzeichen.
  const nb = (t) => t.replace(/ /g, "\u00a0");
  const rangeText = fill(z.range, {
    from: nb(dayLabel(from, locale, { day: "numeric", month: "long" })),
    to: nb(dayLabel(to, locale, { day: "numeric", month: "long", year: "numeric" })),
  });

  return (
    <div className="@container mt-stack-s" data-slot-picker data-status={status}>
      <p className="text-small text-text-soft">{z.tz}</p>
      {otherZone && <p className="mt-1 text-small text-text-soft">{fill(z.tzOther, { zone: otherZone })}</p>}
      {/* QM r3 (WCAG 1.4.12 spacing): the number never breaks („+43 / 5574 46255“). */}
      <p className="mt-1 text-small text-text-soft">{fill(z.lead, { phone: String(phone || "").replace(/ /g, " ") })}</p>

      {/* QM r2/r3: below 30rem (phones, 200 % text) the period takes its own line above the two buttons.
          QM r3 (text spacing 1.4.12): the row may always wrap – "Weitere Tage ›" ran past the edge. */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-line py-2">
        <button
          type="button"
          onClick={() => setFrom(addDays(from, -WINDOW))}
          disabled={!canPrev}
          aria-controls={`${id}-days`}
          className="inline-flex min-h-11 items-center gap-1 px-2 text-ui text-text hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={1.5} />
          <span>{z.prev}</span>
        </button>
        <p className="text-center text-small text-text tabular @max-[30rem]:order-first @max-[30rem]:w-full" aria-live="polite">
          {rangeText}
        </p>
        <button
          type="button"
          onClick={() => setFrom(addDays(from, WINDOW))}
          disabled={!canNext}
          aria-controls={`${id}-days`}
          className="ml-auto inline-flex min-h-11 items-center gap-1 px-2 text-ui text-text hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>{z.next}</span>
          <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
        </button>
      </div>

      <fieldset id={`${id}-days`} className="mt-4 min-w-0" aria-busy={status === "loading" || undefined}>
        <legend className="text-ui text-text">{z.daysLegend}</legend>
        <div aria-hidden="true" className="mt-3 grid grid-cols-7 gap-1 text-center text-small text-text-soft">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i}>{dayLabel(addDays(firstMonday, i), locale, { weekday: "short" })}</span>
          ))}
        </div>
        {/* QM r2 (200 % Schrift): das Raster ist ein Container (rem-Abfrage = Schriftgröße);
            wird eine Zelle zu schmal für „26.10.“, steht nur der Tag (der Monat steht im
            Zeitraum darüber und im Screenreader-Text). */}
        {/* QM content-legal r4 (200 % text): the status words („geschlossen“, „ausgebucht“)
            only where the grid is at least 36 rem wide (named container `days`, rem =
            text size) – with large text they split into three hyphenated lines and the
            cells grew unevenly; then the short form (number / „–“ + legend) is shown. */}
        <div className="@container/days">
        <div className={cx("@container mt-1 grid grid-cols-7 gap-1 transition-opacity duration-(--duration-micro)", status === "loading" && "opacity-60")}>
          {(days.length ? days : Array.from({ length: WINDOW }, (_, i) => ({ date: addDays(from, i), status: "loading", slots: [] }))).map((d) => {
            const open = d.status === "open";
            const long = dayLabel(d.date, locale, { weekday: "long", day: "numeric", month: "long" });
            const srStatus = open ? fill(d.slots.length === 1 ? z.freeLongOne : z.freeLong, { n: d.slots.length }) : d.status === "holiday" && d.holiday && locale === "de" ? `${z.holiday} (${d.holiday})` : reason[d.status] || "";
            return (
              <label
                key={d.date}
                className={cx(
                  "relative flex min-h-14 min-w-0 flex-col items-center justify-center px-[3px] py-1.5 text-center transition-colors duration-(--duration-micro) ease-quiet",
                  open
                    ? "cursor-pointer border border-line-control bg-surface text-text hover:border-ink has-checked:border-2 has-checked:border-ink has-checked:bg-surface-raised has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
                    : d.status === "loading"
                      ? // Motion: loading cells shimmer (ph-skeleton, static when calm).
                        "ph-skeleton border border-transparent text-text-soft"
                      : "border border-transparent bg-surface-band text-text-soft"
                )}
              >
                <input
                  type="radio"
                  name={`${id}-day`}
                  value={d.date}
                  checked={day === d.date}
                  disabled={!open}
                  onChange={() => pickDay(d)}
                  className="sr-only"
                />
                <span className="sr-only">
                  {long}
                  {srStatus ? `, ${srStatus}` : ""}
                </span>
                <span aria-hidden="true" className="text-ui tabular">
                  {dayLabel(d.date, locale, { day: "numeric" })}
                  <span className="hidden text-small font-normal @min-[25rem]:inline">.{dayLabel(d.date, locale, { month: "numeric" })}.</span>
                </span>
                {/* Unter 640 px ist eine Zelle nur ~47 px breit (QA UX P1): dort nur
                    die Zahl freier Zeiten bzw. „–“ (Legende unter dem Raster); der
                    Grund steht im Screenreader-Text. */}
                <span aria-hidden="true" className="mt-0.5 hidden w-full text-[0.75rem] leading-tight [overflow-wrap:anywhere] hyphens-auto @min-[36rem]/days:block">
                  {open ? fill(z.free, { n: d.slots.length }) : d.status === "loading" ? " " : reason[d.status]}
                </span>
                <span aria-hidden="true" className="mt-0.5 text-small leading-tight tabular @min-[36rem]/days:hidden">
                  {open ? d.slots.length : d.status === "loading" ? " " : "–"}
                </span>
              </label>
            );
          })}
        </div>
        <p aria-hidden="true" className="mt-2 text-small text-text-soft @min-[36rem]/days:hidden">
          {z.legendShort}
        </p>
        </div>
      </fieldset>

      <div role="status" className="mt-4 text-small text-text-soft">
        {status === "loading" ? z.loading : status === "ready" && !anyOpen ? z.none : ""}
      </div>
      {status === "error" && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p role="alert" className="text-small text-error">
            {z.error}
          </p>
          <button type="button" onClick={() => setReload((n) => n + 1)} className="min-h-11 px-3 text-ui underline underline-offset-4">
            {z.retry}
          </button>
        </div>
      )}

      {selectedDay && selectedDay.status === "open" && (
        // Motion: the times of a newly picked day settle in (ph-arrive, opacity from 0.6, no layout shift).
        <fieldset key={selectedDay.date} id={`${id}-times`} tabIndex={-1} className="ph-arrive mt-6 min-w-0 focus:outline-none" aria-describedby={error ? `${id}-times-error` : undefined}>
          <legend className="text-ui text-text">{fill(z.timesLegend, { date: dayLabel(selectedDay.date, locale, { weekday: "long", day: "numeric", month: "long" }) })}</legend>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {selectedDay.slots.map((s) => (
              <label
                key={s.start}
                className={cx(
                  "flex min-h-12 cursor-pointer items-center justify-center border bg-surface text-ui text-text tabular transition-colors duration-(--duration-micro) ease-quiet hover:border-ink",
                  "has-checked:border-2 has-checked:border-ink has-checked:bg-surface-raised has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
                  error ? "border-2 border-error" : "border-line-control"
                )}
              >
                <input
                  type="radio"
                  name={`${id}-time`}
                  value={s.start}
                  checked={value?.start === s.start}
                  onChange={() => onChange({ start: s.start, time: s.time, date: selectedDay.date })}
                  className="sr-only"
                />
                {s.time}
              </label>
            ))}
          </div>
          {error && (
            <p id={`${id}-times-error`} className="mt-2 text-small text-error">
              {error}
            </p>
          )}
        </fieldset>
      )}
      {!selectedDay && error && <p className="mt-4 text-small text-error">{error}</p>}
    </div>
  );
}
