// Liste der Ausstellungsstücke (/de/atelierverkauf) bzw. Leerzustand.
// Daten nur aus dem Sheet (atelierSource.js); ohne Daten ein ehrlicher
// Leerzustand, nie Beispielstücke. Keine Händler-Formulierung: Stücke sind
// "Ausstellungsstücke aus unserem Showroom in Lochau" (Rechtspaket R-M2).
// Badges nur aus Daten ("Ausstellungsstück"), keine Knappheit (Bibel §9).
// Server-Komponente.
import { Badge, Heading, SmartLink } from "@/components/ui";
import AtelierPhoto from "./AtelierPhoto";
import AtelierPrice from "./AtelierPrice";

export function AtelierEmpty({ state, headingLevel = 2 }) {
  return (
    <div className="border-y border-line py-12">
      <Heading level={headingLevel} size="title">
        Gerade sind keine Ausstellungsstücke online
      </Heading>
      <p className="mt-3 max-w-measure text-body text-text-soft">
        Welche Stücke wir aus dem Showroom abgeben, stellen wir hier vor, sobald die Liste steht. Fragen Sie uns gern direkt, auch nach einem
        bestimmten Stück.
      </p>
      <p className="mt-6">
        <SmartLink href="/kontakt" className="inline-flex min-h-11 items-center text-ui text-text underline underline-offset-4 hover:decoration-2">
          Kontakt aufnehmen
        </SmartLink>
      </p>
      {state === "error" && (
        <p className="mt-4 text-small text-text-soft" role="note">
          Die Liste konnte gerade nicht geladen werden.
        </p>
      )}
    </div>
  );
}

/**
 * @param {object[]} items      sichtbare Stücke (Status "verfuegbar")
 * @param {string} state        loadAtelier().state
 * @param {string} [basePath]   Link-Basis der Detailseiten
 */
export default function AtelierList({ items, state, basePath = "/atelierverkauf", headingLevel = 2 }) {
  if (!items?.length) return <AtelierEmpty state={state} headingLevel={headingLevel} />;
  return (
    <ul className="grid gap-x-grid gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <li key={item.slug} className="flex flex-col">
          <SmartLink href={`${basePath}/${item.slug}`} className="group block focus-visible:outline-offset-4">
            <AtelierPhoto item={item} priority={index < 2} />
            <div className="mt-4">
              <p className="flex flex-wrap items-center gap-2">
                <Badge>Ausstellungsstück</Badge>
                {item.marke && <span className="text-overline uppercase text-text-accent">{item.marke}</span>}
              </p>
              <Heading level={headingLevel} size="title" className="mt-2 group-hover:underline group-hover:underline-offset-4">
                {item.titel}
              </Heading>
              {item.masse && <p className="mt-1 text-small text-text-soft tabular-nums">{item.masse}</p>}
            </div>
          </SmartLink>
          <AtelierPrice item={item} className="mt-3" />
        </li>
      ))}
    </ul>
  );
}
