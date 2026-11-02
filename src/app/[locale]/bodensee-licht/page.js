// /de/bodensee-licht – Neuland N4 „Bodensee-Licht“: echter Sonnenstand nach Ort,
// Fensterrichtung, Datum und Uhrzeit, in einer schematischen Küche und am Pool.
// Doku: Marktresearch/digital/features/neuland.md §5 und §5.6 (Umsetzung).
// Nur Deutsch (andere Sprachen 404, bis das i18n-Team übersetzt). Noch nicht im
// Menü – das verlinkt die Integration (Inhaber-Entscheidung Nr. 9).
// Server-Komponente: liest den Lichtzustand aus der URL, damit geteilte Links,
// Merkliste und Anfrage genau diese Lichtstimmung öffnen.
// R4 technik P1-1: Erstbild ist das vorgerenderte Poster der Stundensequenz
// (src/lib/licht/poster.js, hier vorab geladen); die Sonnenwerte für das erste
// Bild rechnet der Server (lichtDaten), danach ein Web Worker im Browser. Die
// 3D-Szene lädt erst bei Interaktion bzw. am Desktop sichtbar + im Leerlauf.
import { preload } from "react-dom";
import { notFound } from "next/navigation";
import { Breadcrumbs, Eyebrow, Heading, Lead, LinkArrow } from "@/components/ui";
import LichtSeite from "@/components/Licht/LichtSeite";
import { parseLicht } from "@/lib/licht/zustand";
import { lichtDaten } from "@/lib/licht/rechner";
import { posterFuer } from "@/lib/licht/poster";
import { WerkzeugJsonLd, werkzeugMetadata } from "@/components/Labs/werkzeugSeo";

const TITLE = "Bodensee-Licht: der Sonnenstand an Ihrem Ort | Platzhirsch";
// R2 seo P2-3: Description ≤ 165 (vorher 188)
const DESCRIPTION = "Wie fällt die Sonne an Ihrem Ort in Küche oder Becken? Ort zwischen Chur und Ulm, Fensterrichtung, Datum und Uhrzeit wählen – berechnet nach NOAA im Browser.";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  // R2 seo P2-4: deOnlyMetadata (canonical, hreflang de + x-default)
  return werkzeugMetadata("bodensee-licht", { title: TITLE, description: DESCRIPTION, ogTitle: "Bodensee-Licht" });
}

export default async function Page({ params, searchParams }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  const start = parseLicht(await searchParams);
  const startDaten = lichtDaten(start);
  const poster = posterFuer(start);
  preload(poster.src, { as: "image", fetchPriority: "high", imageSrcSet: poster.srcSet, imageSizes: "(min-width: 1024px) 56vw, 100vw" });

  return (
    <div className="bg-paper text-ink" data-seite="bodensee-licht">
      <WerkzeugJsonLd id="bodensee-licht" description={DESCRIPTION} />
      <header className="mx-auto max-w-page px-gutter pt-8 pb-8 sm:pt-10 lg:pb-12">
        <Breadcrumbs items={[{ label: "Startseite", href: "/" }, { label: "Bodensee-Licht" }]} />
        <Eyebrow className="mt-6">Bodensee-Licht</Eyebrow>
        <Heading level={1} className="mt-stack-s max-w-[18ch] text-balance">
          Das Licht an Ihrem Ort.
        </Heading>
        <Lead className="mt-stack-m text-pretty">
          Wählen Sie Ort, Fensterrichtung, Tag und Uhrzeit. Sie sehen, wo die Sonne steht und wie sie in Ihre Küche oder auf Ihr Becken fällt.
        </Lead>
      </header>

      <LichtSeite start={start} startDaten={startDaten} />

      <section aria-labelledby="vor-ort" className="bg-stone">
        <div className="mx-auto grid max-w-page gap-8 px-gutter py-section lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Eyebrow>Vor Ort</Eyebrow>
            <Heading id="vor-ort" level={2} className="mt-stack-s max-w-[20ch] text-balance">
              Das Licht vor Ort lernen wir bei Ihnen kennen. Hier sehen Sie, warum.
            </Heading>
          </div>
          <div className="space-y-5 text-body lg:col-span-5 lg:col-start-8">
            <p className="max-w-measure text-pretty">
              Die Rechnung kennt den Stand der Sonne. Sie kennt nicht den Pfänder hinter Ihrem Haus, den Nussbaum vor dem Fenster, das Dach des Nachbarn oder das Glitzern vom See an die Decke.
            </p>
            <p className="max-w-measure text-pretty">
              Deshalb kommt Harald Menghin zu Ihnen. Wenn Ihr Projekt es braucht, bleiben wir ein, zwei Tage, sehen das Licht am Morgen und am Abend und zeichnen danach von Hand. Stein, Front und Mosaikfarbe wählen wir für dieses Licht.
            </p>
            <div className="flex flex-col gap-1 pt-2">
              {/* R2 technik P1-4b: LinkArrow setzt die Sprache selbst davor (vorher /de/de/…) */}
              <LinkArrow href="/arbeitsweise">So arbeiten wir</LinkArrow>
              <LinkArrow href="/beratung">Termin vor Ort anfragen</LinkArrow>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="methode" className="mx-auto max-w-page px-gutter py-section">
        <Heading id="methode" level={2} size="title">
          So wird gerechnet
        </Heading>
        <ul className="mt-6 grid max-w-5xl gap-x-10 gap-y-4 text-small text-ink-soft sm:grid-cols-2">
          <li className="max-w-measure">
            <strong className="font-medium text-ink">Sonnenstand:</strong> Verfahren des NOAA Solar Calculator (US-Wetterbehörde, nach Meeus), mit Lichtbrechung der Luft. Gegen die NOAA-Werte für Lochau geprüft, Abweichung unter 0,1°.
          </li>
          <li className="max-w-measure">
            <strong className="font-medium text-ink">Zeit:</strong> Mitteleuropäische Zeit mit Sommerzeit nach EU-Regel, gilt für Österreich, Deutschland, die Schweiz und Liechtenstein.
          </li>
          <li className="max-w-measure">
            <strong className="font-medium text-ink">Orte:</strong> 87 Orte von Chur bis Ulm oder eigene Koordinaten. Ohne Standortabfrage und ohne Kartendienst; alles rechnet in Ihrem Browser, nichts wird gesendet.
          </li>
          <li className="max-w-measure">
            <strong className="font-medium text-ink">Bild:</strong> schematisches Raummodell, keine Planung und kein Foto. Himmel nach dem physikalischen Himmelsmodell von Preetham, Materialbilder CC0 (ambientCG), Mosaik im Browser erzeugt. Das Erstbild ist dieselbe Szene, vorab berechnet für Lochau und ausgewählte Tage und Stunden. Keine KI-Bilder.
          </li>
          <li className="max-w-measure">
            <strong className="font-medium text-ink">Nicht enthalten:</strong> Berge, Bäume, Gebäude, Wolken und Spiegelungen. Licht- und Farbwerte sind Richtwerte für die Darstellung, keine Lichtplanung.
          </li>
        </ul>
      </section>
    </div>
  );
}
