// /de/projekte mit Referenzen aus dem Projekt-Tagebuch. Gleicher Aufbau wie
// components/Projects/ProjekteUebersicht.js; redaktionelle Projekte
// (projekte.js, Bilder in public/) über next/image, Tagebuch-Referenzen über
// ReferenzBild (ohne Optimizer, Widerruf wirkt sofort). Nur gerendert, wenn
// mindestens eine Tagebuch-Referenz veröffentlicht ist; sonst bleibt die
// bisherige Komponente unverändert im Einsatz.
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Breadcrumb, TerminCta } from "@/components/Ratgeber/RatgeberParts";
import { formatYearMonth } from "@/components/Projects/ProjektArtikel";
import ReferenzBild from "./ReferenzBild";

export default function Uebersicht({ projekte }) {
  return (
    <div className="bg-surface text-text">
      <header className="px-gutter pt-10 pb-12 md:pt-14 lg:pt-16 lg:pb-16">
        <div className="mx-auto max-w-page">
          <Breadcrumb items={[{ name: "Startseite", href: "/" }, { name: "Projekte" }]} />
          <p className="mt-10 text-overline uppercase text-text-accent">Eingerichtet am Bodensee</p>
          <h1 className="mt-stack-s font-display text-display-l text-text">Projekte</h1>
          <p className="mt-stack-m max-w-measure text-lead text-text">
            Hier zeigen wir eingerichtete Häuser und Wohnungen aus der Region, nur mit der Zustimmung der Bauherren und
            ohne Adresse.
          </p>
        </div>
      </header>
      <div className="px-gutter pb-16 md:pb-24">
        <div className="mx-auto max-w-page">
          <ul className="grid gap-x-grid gap-y-12 border-t border-line pt-10 md:grid-cols-2 lg:grid-cols-3">
            {projekte.map((p, i) => (
              <li key={p.slug}>
                <Link href={`/projekte/${p.slug}`} className="group block">
                  {p.herkunft === "tagebuch" ? (
                    <ReferenzBild bild={p.bilder[0]} caption={false} priority={i === 0} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
                  ) : (
                    <Image src={p.bilder[0].src} alt={p.bilder[0].alt} width={p.bilder[0].width} height={p.bilder[0].height} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="h-auto w-full" />
                  )}
                  <h2 className="mt-4 text-title text-text underline-offset-4 group-hover:underline">{p.titel}</h2>
                  <p className="mt-1 text-small text-text-soft">
                    {p.ort} · {p.leistungen.join(" · ")} · {formatYearMonth(p.zeitraum.bis)}
                    {p.beispiel ? " · Beispiel (Demo-Daten)" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
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
