// Übersicht veröffentlichter Bewertungen auf /de/bewerten (Server-Komponente).
// Daten: src/lib/bewertungen/backend.js loadBewertungen (ph_marketing.api.get_bewertungen,
// kurz gecacht). Ohne Bewertungen (alt, ph ohne Zugang, Fehler) nur der Leerzustand –
// keine Zahlen, kein Durchschnitt, nichts Erfundenes. Reihenfolge wie vom Backend
// (neueste zuerst, nie nach Sternen ausgewählt).
import { bewertungCopy, formatAverage } from "@/lib/bewertungen/copy";

const fill = (t, v = {}) => String(t || "").replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? String(v[k]) : m));

function formatDate(date, locale) {
  if (!date) return null;
  const tag = { de: "de-AT", en: "en-GB", fr: "fr-FR", it: "it-IT" }[locale] || "de-AT";
  try {
    return new Intl.DateTimeFormat(tag, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  } catch {
    return null;
  }
}

function Stars({ n, label }) {
  return (
    <p className="text-ui text-text" aria-label={label} role="img">
      <span aria-hidden="true">
        {"★".repeat(n)}
        <span className="text-line-strong">{"★".repeat(5 - n)}</span>
      </span>
    </p>
  );
}

export default function BewertungListe({ data, locale = "de", headingId = "bw-liste" }) {
  const c = bewertungCopy(locale);
  const reviews = Array.isArray(data?.reviews) ? data.reviews : [];
  const count = reviews.length ? data.count : 0;
  const avg = count && typeof data?.average === "number" ? formatAverage(data.average, locale) : "";
  return (
    <div data-bewertung-liste data-count={count}>
      <h2 id={headingId} className="font-display text-display-m">
        {c.listTitle}
      </h2>
      {count === 0 ? (
        <p className="mt-stack-m max-w-measure text-body text-text-soft" data-bewertung-leer>
          {c.listEmpty}
        </p>
      ) : (
        <>
          {avg && (
            <p className="mt-stack-m text-lead" data-bewertung-schnitt>
              {fill(count === 1 ? c.listSummaryOne : c.listSummary, { avg, n: count })}
            </p>
          )}
          <ul className="mt-stack-m grid gap-8">
            {reviews.map((r, i) => {
              const date = formatDate(r.date, locale);
              return (
                <li key={r.id || i} className="border-t border-line pt-6">
                  {r.rating && <Stars n={r.rating} label={fill(c.ratingAria, { n: r.rating })} />}
                  {r.text && <p className="mt-2 max-w-measure text-body text-pretty whitespace-pre-line">{r.text}</p>}
                  <p className="mt-2 text-small text-text-soft">
                    {[r.author, r.occasion ? c.anlaesse[String(r.occasion).toLowerCase()] || r.occasion : null, date, r.source === "google" ? c.sourceGoogle : c.sourceDirekt].filter(Boolean).join(" · ")}
                  </p>
                  {r.reply && (
                    <div className="mt-3 border-l-2 border-line-strong pl-4">
                      <p className="text-small text-text">{c.replyLabel}</p>
                      <p className="mt-1 max-w-measure text-small text-text-soft whitespace-pre-line">{r.reply}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {count > 0 && (
        <p className="mt-stack-m max-w-measure text-small text-text-soft" data-bewertung-hinweis>
          {c.listNotice}
        </p>
      )}
    </div>
  );
}
