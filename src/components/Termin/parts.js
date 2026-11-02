"use client";
// Gemeinsame Teile von Buchung (BookingWizard), Bestätigung (ConfirmClient)
// und Verwaltung (ManageClient): Termindaten als <dl>, der Download der
// Kalenderdatei (.ics als data:-URL mit download-Attribut, nichts geht an
// Dritte), der Videoraum-Hinweis und die Ansicht eines festen Termins.
import { CalendarPlus } from "lucide-react";
import Button from "@/components/ui/Button";
import cx from "@/components/ui/cx";
import { DIRECTIONS_URL } from "@/lib/site";
import { fill, formatDate, formatTime } from "@/lib/booking/format";

export function IcsLink({ ics, reference, label, variant = "secondary" }) {
  if (!ics) return null;
  const href = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  const cls =
    variant === "primary"
      ? "bg-action text-paper hover:bg-action-hover"
      : "border border-ink text-text hover:bg-action hover:text-paper focus-visible:bg-action focus-visible:text-paper";
  return (
    <a
      href={href}
      download={`platzhirsch-termin-${String(reference).toLowerCase()}.ics`}
      data-termin-ics
      className={cx("ph-press inline-flex min-h-12 items-center justify-center gap-2 px-6 text-ui transition-colors duration-(--duration-micro) lg:min-h-13 lg:px-7", cls)}
    >
      <CalendarPlus aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
      <span>{label}</span>
    </a>
  );
}

export function Facts({ copy: c, booking: b, locale, extra = [] }) {
  const end = formatTime(b.end, locale);
  const rows = [
    [c.done.what, b.label],
    [c.done.when, `${formatDate(b.start, locale)}, ${formatTime(b.start, locale)}–${end}`],
    [
      c.done.where,
      b.modus === "studio" ? (
        <>
          {b.place}{" "}
          <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap underline underline-offset-2">
            {c.done.route}
          </a>
        </>
      ) : (
        b.place
      ),
    ],
    ...extra,
    [c.done.reference, <span key="r" className="tabular" data-termin-reference>{b.ref}</span>],
  ];
  return (
    <dl className="mt-8 divide-y divide-line border-y border-line">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-6">
          <dt className="text-small text-text-soft">{k}</dt>
          <dd className="text-body text-text wrap-break-word">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Videoraum: Knopf erst ab 15 Minuten vor Beginn (der Server liefert meetUrl
 * nur dann), vorher der Zeitpunkt als Hinweis. Im Testbetrieb zusätzlich der
 * deutlich markierte Test-Raum.
 */
export function MeetInfo({ copy: c, booking: b, locale }) {
  if (b.modus !== "video" || b.status === "storniert") return null;
  return (
    <div className="mt-6" data-termin-meetinfo>
      {b.meetUrl ? (
        <Button href={b.meetUrl} arrow data-termin-meet>
          {c.done.meet}
        </Button>
      ) : (
        b.meetFrom && b.status === "bestaetigt" && <p className="max-w-measure text-body text-text">{fill(c.done.meetLater, { date: formatDate(b.meetFrom, locale), time: formatTime(b.meetFrom, locale) })}</p>
      )}
      <p className="mt-3 max-w-measure text-small text-text-soft">{c.done.meetNote}</p>
      {b.testRoom && (
        <p className="mt-3">
          <a href={b.testRoom} className="inline-flex min-h-11 items-center text-ui underline underline-offset-4" data-termin-testroom>
            {c.done.meetTest}
          </a>
        </p>
      )}
    </div>
  );
}

/** Fester Termin (nach der Bestätigung der Adresse): Daten, .ics, Videoraum, Verwaltungslink, USP. */
export function ConfirmedView({ copy: c, locale, booking: b, manageUrl, children }) {
  const requested = b.status === "angefragt";
  return (
    <div className="ph-arrive-card mt-6" data-termin-ref={b.ref} data-termin-confirmed>
      <p role="status" className="max-w-measure text-lead text-text">
        {requested ? c.done.requestedText : fill(c.done.bookedText, { email: b.email })}
      </p>
      {!requested && <PlaceCard copy={c} locale={locale} booking={b} />}
      <Facts copy={c} booking={b} locale={locale} />
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <IcsLink ics={b.ics} reference={b.ref} label={c.done.ics} variant="primary" />
      </div>
      <MeetInfo copy={c} booking={b} locale={locale} />
      {manageUrl && (
        <div className="mt-10 border-t border-line pt-6">
          <a href={manageUrl} className="inline-flex min-h-11 items-center text-ui text-text underline underline-offset-4" data-termin-manage>
            {c.done.manage}
          </a>
          <p className="mt-1 max-w-measure text-small text-text-soft">{c.done.manageNote}</p>
        </div>
      )}
      {b.modus !== "video" && <p className="mt-8 max-w-measure border-l-2 border-line-strong pl-4 text-body text-text">{c.done.usp}</p>}
      {children}
      <p className="mt-10">
        <a href={`/${locale}/termin`} className="inline-flex min-h-11 items-center text-ui underline underline-offset-4">
          {c.done.again}
        </a>
      </p>
    </div>
  );
}

/**
 * Rat 9,5 B6 (GW9): the confirmed appointment as a "Tischkarte" – a place card
 * on paper: who, when, where, in the house typography (Bodoni date, hairline
 * frame, no shadow, no radius; Design-Bibel P3). Facts below stay the source
 * of record (screen readers get the same data there; the card is aria-hidden).
 */
export function PlaceCard({ copy: c, locale, booking: b }) {
  const where = b.modus === "video" ? c.tisch.cardVideo : b.modus === "vor_ort" ? c.tisch.cardVorOrt : c.tisch.cardPlace;
  return (
    <div aria-hidden="true" data-termin-placecard="" className="mt-8 max-w-md border border-line-strong bg-surface-raised px-6 py-7 text-center">
      <p className="text-overline uppercase text-text-accent">{c.tisch.card}</p>
      {b.vorname && <p className="mt-3 font-display text-display-m text-text">{b.vorname}</p>}
      <p className="mt-3 border-t border-line pt-3 text-ui text-text tabular">
        {formatDate(b.start, locale)} · {formatTime(b.start, locale)}
      </p>
      <p className="mt-1 text-small text-text-soft">{where}</p>
    </div>
  );
}
