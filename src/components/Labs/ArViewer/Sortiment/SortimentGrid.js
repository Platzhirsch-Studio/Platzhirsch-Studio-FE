// Ergebnisliste (Server Component): 24 Karten pro Seite, Bilder lazy (next/image),
// freigestellte AR-Foto-Poster auf Bone, Herstellerfotos unverändert (object-contain,
// kein Zuschnitt – Design-Bibel §7: Herstellerbilder unverändert).
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import StageBadge from "./StageBadge";
import CardImage from "./CardImage";
import RaumCarousel from "./RaumCarousel";
import { listHref, pageList } from "@/lib/arviewer/query";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export default function SortimentGrid({ result, filters, suggestion = null, carousel = null }) {
  const { items, pages, seite, total } = result;
  if (!total) {
    return (
      <div className="border border-line bg-surface-raised px-5 py-10 text-center">
        <p className="text-ui text-text">Kein Produkt passt zu dieser Auswahl.</p>
        {suggestion ? (
          <p className="mt-2 text-ui text-text" data-testid="arv-meinten-sie">
            Meinten Sie{" "}
            <Link href={listHref({ ...filters, q: suggestion })} className={`-my-2 inline-block py-2 font-medium underline underline-offset-4 ${FOCUS}`}>
              {suggestion}
            </Link>
            ?
          </p>
        ) : (
          <p className="mt-1 text-small text-text-soft">Versuchen Sie einen anderen Suchbegriff oder setzen Sie die Filter zurück.</p>
        )}
        <Link href="/de/3d-ansicht#sortiment" className={`mt-3 inline-flex min-h-11 items-center text-small underline underline-offset-4 ${FOCUS}`}>
          Alle Produkte zeigen
        </Link>
        {carousel?.length > 0 && (
          <div className="mt-8 text-left">
            <RaumCarousel items={carousel} total={null} />
          </div>
        )}
      </div>
    );
  }
  return (
    <>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:gap-x-8" data-testid="arv-sortiment-liste">
        {items.map((p, i) => (
          <li key={p.id} className="group relative flex flex-col">
            <div className="relative aspect-[4/5] overflow-hidden bg-surface-raised">
              {p.image ? (
                <CardImage
                  src={p.image}
                  fallback={p.posterRaum}
                  cutout={p.imageCutout}
                  alt={p.imageCutout ? `${p.alt} (freigestellt)` : p.alt}
                  name={`${p.brand} ${p.name}`}
                  sizes="(min-width: 1280px) 400px, (min-width: 768px) 30vw, 46vw"
                  eager={i < 6}
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-linen px-4 text-center text-small text-text-soft">
                  Noch ohne Bild
                </div>
              )}
              <div className="absolute left-2 top-2 sm:left-3 sm:top-3">
                <StageBadge stufe={p.stufe} />
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-1">
              <p className="text-overline uppercase text-text-soft">{p.brand}</p>
              <h3 className="text-ui text-text">
                <Link
                  href={`/de/3d-ansicht/${p.id}`}
                  prefetch={false}
                  className={`ph-stretched underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current ${FOCUS}`}
                >
                  {p.name}
                </Link>
              </h3>
              <p className="text-small text-text-soft">{p.categoryLabel}</p>
            </div>
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <nav aria-label="Seiten im Sortiment" className="mt-10 flex items-center justify-center gap-1">
          {seite > 1 ? (
            <Link href={listHref(filters, { seite: seite - 1 })} className={`grid h-11 w-11 place-items-center border border-line-strong hover:border-ink ${FOCUS}`} aria-label="Vorherige Seite">
              <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={1.75} />
            </Link>
          ) : (
            <span className="grid h-11 w-11 place-items-center border border-line text-text-soft/50" aria-hidden="true">
              <ChevronLeft className="size-4" strokeWidth={1.75} />
            </span>
          )}
          {pageList(seite, pages).map((n, i) =>
            n === null ? (
              <span key={`gap-${i}`} className="px-1 text-text-soft" aria-hidden="true">
                …
              </span>
            ) : (
              <Link
                key={n}
                href={listHref(filters, { seite: n })}
               
                aria-current={n === seite ? "page" : undefined}
                aria-label={`Seite ${n}`}
                className={`grid h-11 min-w-11 place-items-center px-2 text-small tabular-nums ${
                  n === seite ? "bg-ink text-paper" : "border border-line-strong text-text hover:border-ink"
                } ${FOCUS} ${Math.abs(n - seite) > 1 && n !== 1 && n !== pages ? "hidden sm:grid" : ""}`}
              >
                {n}
              </Link>
            )
          )}
          {seite < pages ? (
            <Link href={listHref(filters, { seite: seite + 1 })} className={`grid h-11 w-11 place-items-center border border-line-strong hover:border-ink ${FOCUS}`} aria-label="Nächste Seite">
              <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.75} />
            </Link>
          ) : (
            <span className="grid h-11 w-11 place-items-center border border-line text-text-soft/50" aria-hidden="true">
              <ChevronRight className="size-4" strokeWidth={1.75} />
            </span>
          )}
        </nav>
      )}
      <p className="mt-3 text-center text-small text-text-soft">
        Seite {seite} von {pages}
      </p>
    </>
  );
}
