// Ein Beispielkonzept der Yacht-Seite (Bild, Farbwelt, Materialien). Ohne
// Hooks und ohne Server-Code: ConceptGallery rendert das erste Konzept auf dem
// Server, ConceptTabs die übrigen erst nach Wahl des Reiters im Browser
// (R5 technik P1-3, Seitengewicht). Labels: „Beispielkonzept – kein
// Kundenprojekt“, „Visualisierung (Rendering)“ auf jedem Bild (03.11.2026: nur
// noch Blender-Renderings; Konzepte ohne Rendering zeigen kein Bild).
import { useLocale } from "next-intl";
import { yachtUi } from "@/lib/yacht/ui";
import { Fragment } from "react";
import ConceptImage from "./ConceptImage";
import Laenge from "./Laenge";

export const KICKER = {
  runabout: "Runabout",
  daycruiser: "Daycruiser",
  segelyacht: "Segelyacht",
  motoryacht: "Motoryacht",
  hausboot: "Hausboot",
  superyacht: "Superyacht",
};

export default function Concept({ c }) {
  const locale = useLocale();
  const t = yachtUi(locale);
  // R7-P4 (R2 gesamtwerk P1-6): Konzeptbilder nur noch kartengroß – ein Bild je Konzept,
  // nie bildschirmbreit; Produkte je Konzept begrenzt (weniger Wiederholung).
  const [lead] = c.images;
  const rest = [];
  return (
    <article aria-labelledby={`k-${c.id}-title`} className="pt-stack-m">
      {/* QM r4: Kopf und Bild nach Containerbreite in rem – auf dem Tablet hoch (≥ 42 rem) nebeneinander
          (7 + 5), statt eines halbbreiten Bildes mit leerer rechter Hälfte; bei großer Schrift untereinander
          mit breiterem Bild, damit die Bildunterschrift darauf ganz lesbar bleibt. */}
      <div className="@container/kp">
      <div className="grid grid-cols-1 gap-y-8 @2xl/kp:grid-cols-12 @2xl/kp:gap-x-8">
        <header className={lead ? "min-w-0 @2xl/kp:col-span-7" : "min-w-0 @2xl/kp:col-span-12"}>
          <p className="text-overline uppercase text-text-accent">
            {/* QM r2: Trenner hängt mit geschütztem Leerzeichen am Wort davor – keine Zeile beginnt mit „· “ */}
            {/* QM r4: die Länge („8–10 m“) bricht nicht zwischen Zahl und Einheit, „m“ bleibt klein (Laenge) */}
            {[c.boatType, c.length, c.area].filter(Boolean).map((part, i) => (
              <Fragment key={i}>
                {i > 0 ? "\u00A0· " : null}
                {part === c.length ? <Laenge value={part} /> : part}
              </Fragment>
            ))}
          </p>
          <h3 id={`k-${c.id}-title`} className="mt-stack-s font-display text-display-l text-text">
            {c.title}
          </h3>
          <p className="mt-4 max-w-measure font-display-italic text-lead text-text">{t.quote(c.motto)}</p>
          <p className="mt-4 max-w-measure text-body text-text-soft max-sm:hidden">{c.mood}</p>
          <p className="mt-stack-m flex flex-wrap gap-2">
            <span className="inline-flex items-center border border-line px-2 py-1 text-small text-text">{c.badge}</span>
            {c.inspiration && <span className="inline-flex items-center bg-stone px-2 py-1 text-small text-text">{t.inspirationBadge}</span>}
          </p>
        </header>
        {lead && (
          <ConceptImage
            image={lead}
            sizes="(min-width: 1440px) 400px, (min-width: 1024px) 28vw, (min-width: 640px) 42vw, 70vw"
            className="w-[clamp(70%,14rem,100%)] max-w-[26rem] @2xl/kp:col-span-5 @2xl/kp:w-full @2xl/kp:max-w-none @5xl/kp:col-span-4 @5xl/kp:col-start-9"
          />
        )}
      </div>
      </div>

      <div className="mt-stack-m grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
        {rest.length > 0 && (
          <div className="grid grid-cols-1 gap-grid sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            {rest.map((img) => (
              <ConceptImage key={img.id} image={img} sizes="(min-width: 1440px) 520px, (min-width: 1024px) 38vw, (min-width: 640px) 50vw, 100vw" />
            ))}
          </div>
        )}
        <div className={rest.length ? "lg:col-span-6 lg:col-start-7" : "grid grid-cols-1 gap-y-stack-m lg:col-span-12 lg:grid-cols-2 lg:gap-x-8"}>
          <div>
          <h4 className="text-overline uppercase text-text-soft">{t.palette}</h4>
          {/* QM r4 (1440 px, 200 % Text): fünf Farbfelder nebeneinander nur, wenn die Spalte ≥ 26 rem ist –
              sonst zwei Spalten, damit Namen und Rollen nicht mitten im Wort brechen („Mahag|oni“).
              Mobil (Namen nur für Screenreader) bleiben es fünf Felder. */}
          <div className="@container/pal">
          <ul className="mt-4 grid grid-cols-5 gap-x-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4 sm:@[26rem]/pal:grid-cols-5 sm:@[26rem]/pal:gap-x-1">
            {c.palette.map((col) => (
              <li key={col.name}>
                <span aria-hidden="true" className="block aspect-square border border-line lg:aspect-[3/2]" style={{ backgroundColor: col.hex }} />
                {/* mobil nur die Farbfläche mit Namen (Seitenlänge, R2 gesamtwerk P1-6) */}
                <span className="mt-2 block text-small text-text [overflow-wrap:break-word] max-sm:sr-only">{col.name}</span>
                <span className="block text-small text-text-soft [overflow-wrap:break-word] max-sm:hidden" lang={locale}>{col.rolle}</span>
              </li>
            ))}
          </ul>
          </div>
          </div>
          <div>
          <h4 className={`${rest.length ? "mt-stack-m " : ""}text-overline uppercase text-text-soft max-sm:hidden`}>{t.materials}</h4>
          <dl className="mt-4 border-t border-line max-sm:hidden">
            {c.materials.map((m) => (
              <div key={m.name} className="border-b border-line py-3">
                <dt className="text-ui text-text">{m.name}</dt>
                <dd className="text-small text-text-soft">
                  {m.einsatz}
                  {m.hinweis ? ` · ${m.hinweis}` : ""}
                </dd>
              </div>
            ))}
          </dl>
          </div>
        </div>
      </div>

      {/* R5 technik P1-3 (Yacht-HTML 625 KB → < 250 KB): Die Produkte je Zone stehen
          einmal – in der Werfthalle oben (alle Geräte) und im Marken-Regal unten. Die
          frühere dritte Wiederholung hier (sechs Konzepte × Produktreihen, auch in den
          verdeckten Reitern im HTML) entfällt; der Verweis führt in die Werfthalle. */}
      <p className="mt-stack-m text-small text-text-soft">
        <a href="#werfthalle" className="inline-flex min-h-11 items-center text-ui text-text underline underline-offset-4">
          {t.productsInWerfthalle}
        </a>
      </p>

      {/* „Wer macht was“ steht nur noch einmal: im Kurs durchs Winterlager (R2 ux P2-4) */}
    </article>
  );
}
