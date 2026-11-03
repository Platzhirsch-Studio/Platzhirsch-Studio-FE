// Shared pieces of the Ratgeber pages (Server Components): breadcrumb,
// dates, appointment CTA. Tokens from globals.css only (Design-Bibel §4–6):
// no radii, no shadows, no gold on light ground.
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/ratgeber/article";
import { REVIEWER_PROFILES } from "@/lib/ratgeber/schema";
import { ownCalendarActive } from "@/components/Booking/config";
import { terminHref, terminLabel } from "@/lib/forms/terminLink";

export const overlineClass = "text-overline uppercase text-text-accent";
export const primaryButtonClass =
  "ph-press inline-flex min-h-12 items-center justify-center bg-action px-8 py-3 text-ui text-text-inverse transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover";
export const linkClass =
  "text-text underline decoration-1 underline-offset-4 decoration-line-strong transition-colors duration-(--duration-micro) hover:decoration-text";

export function Breadcrumb({ items }) {
  return (
    <nav aria-label="Brotkrumen" className="text-small text-text-soft">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => {
          const current = i === items.length - 1;
          return (
            <li key={item.name} className="flex min-w-0 items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {item.href && !current ? (
                <Link href={item.href} className="underline-offset-4 hover:underline">
                  {item.name}
                </Link>
              ) : (
                // QM r2: the current page (a 104-character question) takes one short line –
                // the full title is the H1 directly below.
                <span aria-current={current ? "page" : undefined} className="block max-w-[32ch] truncate">
                  {item.name}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// "Stand 26.10.2026 · Geprüft am 26.10.2026" – only real dates are shown.
// One separator only (r1-recht-inhalt P1-7: the former sr-only ", " next to
// the aria-hidden "·" read as "Stand … · , Geprüft am" in the text).
export function DateLine({ article, className = "" }) {
  const stand = formatDate(article.updatedAt || article.datum);
  // Runde 2 (recht P1-5): "Geprüft am" only with a named reviewer – a date
  // without a review would be a false statement.
  const geprueft = article.reviewedBy ? formatDate(article.geprueftAm) : "";
  if (!stand && !geprueft) return null;
  return (
    <p className={`text-small text-text-soft tabular ${className}`}>
      {stand && (
        <>
          Stand <time dateTime={article.updatedAt || article.datum}>{stand}</time>
        </>
      )}
      {stand && geprueft && <span aria-hidden="true"> · </span>}
      {geprueft && (
        <>
          {/* Rat 9,5 B14: Byline mit Profil, nur bei echtem reviewedBy. */}
          Geprüft von{" "}
          {REVIEWER_PROFILES[article.reviewedBy] ? (
            <Link href={REVIEWER_PROFILES[article.reviewedBy].path.slice("/de".length)} className="underline underline-offset-4">
              {article.reviewedBy}
            </Link>
          ) : (
            article.reviewedBy
          )}{" "}
          am <time dateTime={article.geprueftAm}>{geprueft}</time>
        </>
      )}
    </p>
  );
}

export function TerminCta({ headingId = "ratgeber-termin", heading = "Lieber persönlich besprechen?", children }) {
  return (
    // Druck 02.11.: Terminband mit Knopf – nicht im Ausdruck.
    <section aria-labelledby={headingId} className="bg-surface-band px-[20px] py-10 sm:px-10 sm:py-12 print:hidden">
      <h2 id={headingId} className="font-display text-display-m text-text">
        {heading}
      </h2>
      <p className="mt-5 max-w-measure text-body text-text">
        {children ||
          "Im Showroom in Lochau sehen Sie Materialien, Stoffe und Möbel im Original. Vereinbaren Sie einen Termin, dann nehmen wir uns Zeit für Ihre Fragen."}
      </p>
      <p className="mt-stack-m">
        {/* Rat 9,5 B1: ein Terminweg (src/lib/forms/terminLink.js) – mit
            eigenem Kalender „Termin wählen“ → /termin, sonst „Termin anfragen“. */}
        <Link href={terminHref("de", { calendar: ownCalendarActive(), context: { thema: "Ratgeber" } })} className={primaryButtonClass}>
          {terminLabel("de", { calendar: ownCalendarActive() })}
        </Link>
      </p>
    </section>
  );
}
