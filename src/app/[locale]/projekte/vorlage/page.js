// /de/projekte/vorlage – template preview of a Referenzprojekt (R5-content,
// Bericht 12 C3) plus the only demo of InlineVideo. German only, other
// locales 404. noindex,nofollow, not linked, not in sitemap or llms.txt.
// Everything in square brackets is a placeholder that names what belongs
// there – no invented project, client, quote, architect or photo. The video
// is a neutral test clip (text on linen), clearly labelled as such.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { setRequestLocale } from "next-intl/server";
import ProjektArtikel from "@/components/Projects/ProjektArtikel";
import InlineVideo from "@/components/Video/InlineVideo";
import { PROJEKTE_PATH } from "@/lib/content/projekte";
import { SITE_URL, SITE_NAME } from "@/lib/seo/pageMetadata";
import { routing } from "@/i18n/config";
import { notFoundTitle } from "@/i18n/detectLocale";
import { designPreviewEnabled } from "@/components/Preview/gate";

const BASE = `${PROJEKTE_PATH}/vorlage`;

// Placeholders in the order of the format (Bericht 12 C3). Not a project.
const VORLAGE = {
  titel: "[Ort] – [Typologie und Haltung]",
  ort: "[Region, keine Adresse]",
  typologie: "[Haus, Wohnung, Chalet, Objekt]",
  leistungen: ["[Küche]", "[Wohnen]", "[Outdoor]", "[Licht]"],
  zeitraumText: "[Monat Jahr] bis [Monat Jahr]",
  ausgangslage: "[Zwei bis drei Sätze in der Stimme der Bauherren: Was war da, was sollte anders werden?]",
  loesung: [
    { raum: "[Raum 1]", text: "[Eine Entscheidung mit Begründung, z. B. Maß, Material oder Licht.]" },
    { raum: "[Raum 2]", text: "[Eine Entscheidung mit Begründung.]" },
    { raum: "[Raum 3]", text: "[Eine Entscheidung mit Begründung.]" },
  ],
  produkte: [{ name: "[Verlinkte Produktseiten aus dem Katalog]", href: "/produkte/vorlage" }],
  zitat: { text: "[Zitat der Bauherren oder des Architekten, nur mit Freigabe]", von: "[Name oder „Die Bauherren“]" },
  ctaTitel: "[Abschluss: Dauer von der ersten Skizze bis zur Montage]",
  ctaText: "[Ein Satz zur Dauer des Projekts und eine Einladung zum Termin.]",
};

const PFLICHT = [
  "Schriftliche Einwilligung der Bauherren (Fotos, Ort, gegebenenfalls Zitat und Name), abgelegt",
  "Ort nur als Region, keine Straße, Hausnummer oder Postleitzahl",
  "Eigene Fotos mit vollem Nutzungsrecht, Fotograf genannt, EXIF- und GPS-Daten entfernt",
  "Keine KI-generierten Räume, Retusche nur mit Kennzeichnung",
  "Architekt und Zitat nur mit eigener Freigabe",
  "Höchstens 600 Wörter, Faktencheck ohne offene Zahl",
  "Freigabe durch die Inhaberin (freigegeben: true, reviewedBy, updatedAt)",
];

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") {
    return {
      title: await notFoundTitle(routing.locales.includes(locale) ? locale : routing.defaultLocale),
      robots: { index: false, follow: true },
    };
  }
  // F5: no template title on the production 404.
  if (!designPreviewEnabled()) return { robots: { index: false, follow: false } };
  return {
    title: `Projekt-Vorlage | ${SITE_NAME}`,
    description: "Vorlage für Referenzprojekte, nicht veröffentlicht.",
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE_URL}${BASE}` },
  };
}

export default async function ProjektVorlagePage({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  // Produktion: 404 ohne DESIGN_PREVIEW=1 (Preview/gate.js), Schalter zur Anfragezeit.
  await connection();
  if (!designPreviewEnabled()) notFound();
  setRequestLocale(locale);

  return (
    <>
      <div role="note" aria-label="Hinweis zur Vorlage" className="border-b border-line bg-surface-band px-gutter py-4">
        <p className="mx-auto max-w-page text-small text-text">
          <strong className="font-medium">Vorlage, nicht veröffentlicht.</strong> Alle Angaben in eckigen Klammern sind
          Platzhalter. Hier steht kein echtes Projekt.
        </p>
      </div>
      <ProjektArtikel projekt={VORLAGE} vorlage>
        <section aria-labelledby="video-vorlage">
          <h2 id="video-vorlage" className="font-display text-display-m text-text">
            Video im Projekt
          </h2>
          <p className="mt-stack-s max-w-measure text-body text-text">
            So erscheint ein eigenes Video: mit Vorschaubild, Untertiteln und Text zum Video. Es lädt erst, wenn Sie es
            starten, und spielt nie von selbst.
          </p>
          <div className="mt-stack-m max-w-[48rem]">
            <InlineVideo
              id="projekt-vorlage-video"
              title="Testclip der Video-Vorlage"
              sources={[
                { src: `${BASE}/demo.mp4`, type: "video/mp4" },
                { src: `${BASE}/demo.webm`, type: "video/webm" },
              ]}
              poster={`${BASE}/demo-poster.svg`}
              tracks={[{ src: `${BASE}/demo.de.vtt`, srcLang: "de", label: "Deutsch", kind: "captions" }]}
              width={640}
              height={360}
              caption="Testclip, kein Projektmaterial. Später: eigenes Video aus dem Projekt."
              transcript="Testclip der Video-Vorlage. Kein Projektmaterial. Hier steht später der Text zum Video."
            />
          </div>
        </section>

        <section aria-labelledby="pflicht" className="mt-16 border-t border-line pt-10">
          <h2 id="pflicht" className="font-display text-display-m text-text">
            Bevor ein Projekt hier erscheint
          </h2>
          <ul className="mt-stack-s flex max-w-measure list-disc flex-col gap-2 pl-5 text-body text-text">
            {PFLICHT.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
      </ProjektArtikel>
    </>
  );
}
