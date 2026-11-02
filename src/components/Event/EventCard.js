// src/components/Event/EventCard.js
// Termin-Karte ("card-event", Design-Bibel §9) for event pages: date, time,
// place, contact and – only when a start time is known – "In den Kalender".
// Server component, no client JS. Tokens only (no radius, no shadow, §6).
//
// Props:
//   heading       visible card title (default "Auf einen Blick")
//   dateLabel     "Donnerstag, 26. November 2026"
//   timeLabel     "ab 18:00 Uhr" | "Uhrzeit folgt"
//   place         { name, street, postalCode, city, country }
//   directionsUrl optional Google-Maps route link
//   contact       optional { phoneHref, phoneDisplay, emailHref, email }
//   capacityLabel optional, e.g. "Platz für 40 Gäste" – only from real data
//   calendarHref  optional .ics URL; without it the calendar link is hidden
//   calendarFileName optional download file name
//   id            optional id for aria-labelledby

const linkClass =
  "inline-flex min-h-11 items-center underline underline-offset-4 decoration-line-strong transition-colors duration-(--duration-micro) ease-quiet hover:decoration-text";

export default function EventCard({
  heading = "Auf einen Blick",
  dateLabel,
  timeLabel,
  place,
  directionsUrl,
  contact,
  capacityLabel,
  calendarHref,
  calendarFileName,
  id = "termin",
}) {
  const headingId = `${id}-titel`;
  return (
    <section
      aria-labelledby={headingId}
      className="bg-surface-raised border-t border-line-strong p-6 sm:p-8 text-text"
    >
      <h2 id={headingId} className="text-overline uppercase text-text-accent">
        {heading}
      </h2>

      <dl className="mt-6 divide-y divide-line">
        <div className="pb-4">
          <dt className="text-small text-text-soft">Datum</dt>
          <dd className="mt-1 text-body tabular">{dateLabel}</dd>
        </div>
        <div className="py-4">
          <dt className="text-small text-text-soft">Uhrzeit</dt>
          <dd className="mt-1 text-body tabular">{timeLabel}</dd>
        </div>
        {capacityLabel && (
          <div className="py-4">
            <dt className="text-small text-text-soft">Plätze</dt>
            <dd className="mt-1 text-body">{capacityLabel}</dd>
          </div>
        )}
        {place && (
          <div className="py-4">
            <dt className="text-small text-text-soft">Ort</dt>
            <dd className="mt-1 text-body not-italic">
              <address className="not-italic">
                {place.name}
                <br />
                {place.street}
                <br />
                {place.postalCode} {place.city}
                {place.country ? `, ${place.country}` : ""}
              </address>
              {directionsUrl && (
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className={`${linkClass} mt-1 text-ui`}>
                  Route planen
                  <span className="sr-only"> (öffnet Google Maps in einem neuen Fenster)</span>
                </a>
              )}
            </dd>
          </div>
        )}
        {contact && (
          <div className="pt-4">
            <dt className="text-small text-text-soft">Fragen</dt>
            <dd className="mt-1 flex flex-col text-ui">
              <a href={contact.phoneHref} className={`${linkClass} tabular`}>
                {contact.phoneDisplay}
              </a>
              <a href={contact.emailHref} className={linkClass}>
                {contact.email}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {calendarHref && (
        <a
          href={calendarHref}
          download={calendarFileName || true}
          className="ph-press mt-6 inline-flex h-12 w-full items-center justify-center gap-2 border border-text px-6 text-ui text-text transition-colors duration-(--duration-micro) ease-quiet hover:bg-action hover:text-text-inverse"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3.75" y="5.25" width="16.5" height="15" />
            <path d="M3.75 9.75h16.5M8.25 3v4.5M15.75 3v4.5" />
          </svg>
          In den Kalender
          <span className="sr-only"> (Datei im Format .ics)</span>
        </a>
      )}
    </section>
  );
}
