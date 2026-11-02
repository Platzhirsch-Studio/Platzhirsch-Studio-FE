// /de/ratgeber/[slug] – one article: answer box, table of contents, body,
// sources, brand links, appointment CTA. Calm reading column (≤ 68ch).
import { Link } from "@/i18n/navigation";
import { kernDisplay } from "@/components/ui/Kern";
import { relatedBrandLinks } from "@/lib/ratgeber/brands";
import Blocks, { Inline } from "./Markdown";
import { Breadcrumb, DateLine, TerminCta, linkClass, overlineClass } from "./RatgeberParts";
import TocSpy from "./TocSpy";

function hostOf(url) {
  try {
    const u = new URL(url);
    return { host: u.hostname.replace(/^www\./, ""), rest: decodeURI(u.pathname + u.search).replace(/\/$/, "") };
  } catch {
    return { host: url, rest: "" };
  }
}

// QM r2 (laptop-1366): "Was kostet eine / Designerküche? Von der / Steinküche …" – a
// question or a colon ends the first line from sm on, the rest starts a new line.
export function headingParts(heading) {
  const m = /^(.{12,}?[?:])\s+(\S.{8,})$/u.exec(String(heading || ""));
  return m ? [m[1], m[2]] : [String(heading || "")];
}

function Toc({ items, id }) {
  if (items.length < 2) return null;
  return (
    <nav aria-labelledby={id}>
      <h2 id={id} className={overlineClass}>
        Inhalt
      </h2>
      <ol className="mt-4 space-y-2 border-l border-line pl-4 text-ui text-text">
        {items.map((t) => (
          <li key={t.id}>
            {/* QM r2: the current section (TocSpy) – weight and a rule on the left, not colour alone. */}
            <a
              href={`#${t.id}`}
              className="-ml-4 block border-l-2 border-transparent pl-[14px] font-normal underline-offset-4 hover:underline aria-[current=location]:border-ink aria-[current=location]:font-medium"
            >
              <Inline text={t.text} />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function RatgeberArticle({ article }) {
  const brands = relatedBrandLinks(article.relatedBrands);

  return (
    <article className="bg-surface text-text">
      {/* QM r3 (1920 px): gutter inside max-w-page like ui/Container (logo line). */}
      <header className="pt-10 pb-10 md:pt-14 lg:pt-16 lg:pb-14">
        <div className="mx-auto max-w-page px-gutter">
          <Breadcrumb
            items={[{ name: "Startseite", href: "/" }, { name: "Ratgeber", href: "/ratgeber" }, { name: article.heading }]}
          />
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-grid">
            <div className="@container lg:col-span-9">
              <p className={`${overlineClass} mt-10`}>{article.rubrik}</p>
              {/* QM: long questions (> 60 characters) ran to seven lines on phones and to
                  four display lines in landscape and on the iPad – they take the H2 step
                  (display-m) on every width, so the short answer reaches the first screen.
                  QM r2 (200 % text): the size is capped by the viewport width, long words
                  hyphenate (lang=de) and, without a dictionary, wrap instead of clipping.
                  Landscape phones (height ≤ 500 px): long questions one step smaller again. */}
              <h1
                className={`mt-stack-s font-display ${article.heading.length > 60 ? "text-display-m [font-size:min(var(--text-display-m),9vw)] [@media(max-height:500px)]:[font-size:1.625rem]" : "text-display-l [font-size:min(var(--text-display-l),11vw)]"} text-text @max-[20rem]:hyphens-auto [overflow-wrap:anywhere] sm:[overflow-wrap:break-word]`}
              >
                {headingParts(article.heading).map((part, i) =>
                  i === 0 ? (
                    <span key={i}>{kernDisplay(part)}</span>
                  ) : (
                    <span key={i} className="sm:block">
                      {" "}
                      {kernDisplay(part)}
                    </span>
                  )
                )}
              </h1>
              <DateLine article={article} className="mt-stack-m" />
            </div>
          </div>
        </div>
      </header>

      <div className="pb-section">
        <div className="mx-auto max-w-page px-gutter lg:grid lg:grid-cols-12 lg:gap-x-grid">
          <div className="min-w-0 max-w-measure lg:col-span-7">
            {/* QM r2 (200 % text): side padding in px (rem doubled it to 40 px a side);
                long compounds wrap instead of running out of the box (phones hyphenate globally). */}
            {article.lead && (
              <aside aria-labelledby="ratgeber-antwort" className="border-t-2 border-text bg-surface-band px-[20px] py-6 wrap-break-word sm:px-8 sm:py-8">
                <h2 id="ratgeber-antwort" className={overlineClass}>
                  Die kurze Antwort
                </h2>
                <p className="mt-3 text-lead text-text">
                  <Inline text={article.lead.replace(/\s*\n\s*/g, " ")} />
                </p>
              </aside>
            )}

            <div className="mt-10 lg:hidden">
              <Toc items={article.toc} id="ratgeber-inhalt-mobil" />
            </div>

            <div className="mt-6 wrap-break-word">
              <Blocks blocks={article.blocks} />
            </div>

            {article.quellen.length > 0 && (
              <section aria-labelledby="ratgeber-quellen" className="reveal mt-16 border-t border-line pt-10 [--reveal-y:12px]">
                <h2 id="ratgeber-quellen" className="font-display text-display-m text-text">
                  Quellen
                </h2>
                <ol className="mt-6 list-decimal space-y-3 pl-6 text-body text-text marker:text-text-soft">
                  {article.quellen.map((url) => {
                    const { host, rest } = hostOf(url);
                    return (
                      <li key={url} className="pl-1 [overflow-wrap:anywhere]">
                        <a href={url} rel="noopener noreferrer" className={linkClass}>
                          {host}
                          <span className="sr-only"> (externe Seite)</span>
                        </a>
                        {rest && <span className="block text-small text-text-soft">{rest}</span>}
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {brands.length > 0 && (
              <section aria-labelledby="ratgeber-marken" className="reveal mt-16 border-t border-line pt-10 [--reveal-y:12px]">
                <h2 id="ratgeber-marken" className="font-display text-display-m text-text">
                  Marken zum Thema
                </h2>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {brands.map((b) => (
                    <li key={b.slug}>
                      {b.href ? (
                        <Link
                          href={b.href}
                          className="ph-press inline-flex min-h-11 items-center border border-line-control px-4 text-ui text-text transition-colors duration-(--duration-micro) hover:bg-surface-band"
                        >
                          {b.name}
                        </Link>
                      ) : (
                        <span className="inline-flex min-h-11 items-center border border-line px-4 text-ui text-text-soft">
                          {b.name}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="reveal mt-16 [--reveal-y:16px]">
              <TerminCta headingId="ratgeber-termin">
                Bringen Sie Maße, Fotos oder Grundriss mit. Im Showroom in Lochau besprechen wir Ihre Fragen zu diesem
                Thema in Ruhe und zeigen Ihnen Materialien im Original.
              </TerminCta>
            </div>

            <p className="mt-10 text-small text-text-soft">
              <Link href="/ratgeber" className={linkClass}>
                Alle Ratgeber
              </Link>
            </p>
          </div>

          {/* QM r2: one column closer to the text (col 9–12 instead of 10–12) – the gap
              between the answer box and the TOC was 210–380 px wide. */}
          <aside className="hidden lg:col-span-4 lg:col-start-9 lg:block xl:col-span-3 xl:col-start-9">
            {/* QM: the long TOC ran under the fixed Concierge launcher (bottom right) –
                capped to the viewport minus header and launcher, scrolls on its own. */}
            <div className="sticky top-32 max-h-[calc(100dvh-14rem)] overflow-y-auto overscroll-contain pr-2 [&_a]:scroll-mb-28">
              <TocSpy ids={article.toc.map((t) => t.id)}>
                <Toc items={article.toc} id="ratgeber-inhalt" />
              </TocSpy>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
