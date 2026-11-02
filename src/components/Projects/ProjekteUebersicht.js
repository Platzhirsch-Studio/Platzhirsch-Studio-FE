// src/components/Projects/ProjekteUebersicht.js — /de/projekte (Server
// Component). Lists released projects; without any it shows an honest empty
// state: no sample projects, no placeholder photos, no invented clients.
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Breadcrumb, TerminCta, linkClass, overlineClass } from "@/components/Ratgeber/RatgeberParts";
import { formatYearMonth } from "./ProjektArtikel";

export default function ProjekteUebersicht({ projekte }) {
  return (
    <div className="bg-surface text-text">
      <header className="px-gutter pt-10 pb-12 md:pt-14 lg:pt-16 lg:pb-16">
        <div className="mx-auto max-w-page">
          <Breadcrumb items={[{ name: "Startseite", href: "/" }, { name: "Projekte" }]} />
          <p className={`${overlineClass} mt-10`}>Eingerichtet am Bodensee</p>
          <h1 className="mt-stack-s font-display text-display-l text-text">Projekte</h1>
          <p className="mt-stack-m max-w-measure text-lead text-text">
            Hier zeigen wir eingerichtete Häuser und Wohnungen aus der Region, nur mit der Zustimmung der Bauherren und
            ohne Adresse.
          </p>
        </div>
      </header>

      <div className="px-gutter pb-16 md:pb-24">
        <div className="mx-auto max-w-page">
          {projekte.length === 0 ? (
            <section aria-labelledby="projekte-leer" className="border-t border-line pt-10 lg:grid lg:grid-cols-12 lg:gap-x-grid">
              <div className="lg:col-span-7">
                <h2 id="projekte-leer" className="font-display text-display-m text-text">
                  Noch keine Projekte veröffentlicht
                </h2>
                <p className="mt-stack-s max-w-measure text-body text-text">
                  Ein Projekt erscheint hier erst, wenn die Bauherren der Veröffentlichung schriftlich zugestimmt haben.
                  Bis dahin zeigen wir Ihnen Stücke und Materialien im Showroom in Lochau.
                </p>
                <p className="mt-stack-s text-body">
                  {/* F5 (Runde 1): no link to the Ratgeber (publication not decided). */}
                  <Link href="/arbeitsweise" className={linkClass}>
                    So entsteht ein Entwurf bei uns
                  </Link>
                </p>
              </div>
            </section>
          ) : (
            <ul className="grid gap-x-grid gap-y-12 border-t border-line pt-10 md:grid-cols-2 lg:grid-cols-3">
              {projekte.map((p) => (
                <li key={p.slug}>
                  <Link href={`/projekte/${p.slug}`} className="group block">
                    <Image
                      src={p.bilder[0].src}
                      alt={p.bilder[0].alt}
                      width={p.bilder[0].width}
                      height={p.bilder[0].height}
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="h-auto w-full"
                    />
                    <h2 className="mt-4 text-title text-text underline-offset-4 group-hover:underline">{p.titel}</h2>
                    <p className="mt-1 text-small text-text-soft">
                      {p.ort} · {p.leistungen.join(" · ")} · {formatYearMonth(p.zeitraum.bis)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-16">
            <TerminCta headingId="projekte-termin" heading="Ihr Projekt besprechen">
              Bringen Sie Grundriss, Fotos oder Maße mit, oder erst einmal nur Ihre Fragen. Im Showroom in Lochau nehmen
              wir uns Zeit dafür.
            </TerminCta>
          </div>
        </div>
      </div>
    </div>
  );
}
