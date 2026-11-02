// /de/ratgeber – overview by Rubrik with teaser, date and "geprüft am".
import { Link } from "@/i18n/navigation";
import { slugify } from "@/lib/ratgeber/markdown";
import { Breadcrumb, DateLine, TerminCta, overlineClass } from "./RatgeberParts";

export default function RatgeberHub({ groups }) {
  return (
    <div className="bg-surface text-text">
      {/* QM r3 (1920 px): gutter INSIDE max-w-page like ui/Container – the text ran 80 px
          left of the logo and under the Concierge tab. */}
      <header className="pt-10 pb-12 md:pt-14 lg:pt-16 lg:pb-16">
        <div className="mx-auto max-w-page px-gutter">
          <Breadcrumb items={[{ name: "Startseite", href: "/" }, { name: "Ratgeber" }]} />
          <p className={`${overlineClass} mt-10`}>Wissen aus dem Showroom in Lochau</p>
          {/* QM r2 (200 % text): size capped by the viewport width, long words wrap instead of clipping. */}
          <h1 className="mt-stack-s font-display text-display-l text-text [font-size:min(var(--text-display-l),11vw)] wrap-break-word">
            Ratgeber für Designmöbel und Küche
          </h1>
          <p className="mt-stack-m max-w-measure text-lead text-text">
            Maße, Materialien, Pflege, Lieferzeiten und Preise: sachlich erklärt, mit Quellen belegt und mit dem Datum
            der letzten Prüfung.
          </p>

          {groups.length > 1 && (
            <nav aria-labelledby="ratgeber-rubriken" className="mt-10">
              <h2 id="ratgeber-rubriken" className="text-small text-text-soft">
                Rubriken
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {groups.map((g) => (
                  <li key={g.rubrik}>
                    <a
                      href={`#${slugify(g.rubrik)}`}
                      className="ph-press inline-flex min-h-11 items-center border border-line-control px-4 text-ui text-text transition-colors duration-(--duration-micro) hover:bg-surface-band"
                    >
                      {g.rubrik}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </header>

      {groups.map((g) => {
        const id = slugify(g.rubrik);
        return (
          <section key={g.rubrik} aria-labelledby={id} className="border-t border-line py-12 lg:py-16">
            {/* QM r2 (200 % text): explicit minmax column – the implicit auto column grew to the longest word. */}
            <div className="mx-auto grid max-w-page px-gutter grid-cols-1 gap-x-grid gap-y-8 wrap-break-word lg:grid-cols-12">
              {/* Optik QA: the Rubrik stays beside its list while it scrolls (no empty left column). */}
              <h2 id={id} className="font-display text-display-m text-text lg:sticky lg:top-32 lg:col-span-4 lg:self-start">
                {g.rubrik}
              </h2>
              {/* Motion: entries arrive one after another while scrolling (12 px, max 4 steps, transform only). */}
              <ul className="reveal-group divide-y divide-line [--reveal-y:12px] lg:col-span-7 lg:col-start-6">
                {g.articles.map((a) => (
                  <li key={a.slug} className="py-6 first:pt-0 last:pb-0">
                    <article className="group relative">
                      <h3 className="text-title text-text">
                        <Link
                          href={`/ratgeber/${a.slug}`}
                          className="underline decoration-transparent decoration-1 underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-text after:absolute after:inset-0"
                        >
                          {a.heading}
                        </Link>
                      </h3>
                      {a.description && <p className="mt-3 max-w-measure text-body text-text-soft">{a.description}</p>}
                      <DateLine article={a} className="mt-3" />
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      <div className="pb-section pt-12">
        <div className="reveal mx-auto max-w-page px-gutter [--reveal-y:16px]">
          <TerminCta />
        </div>
      </div>
    </div>
  );
}
