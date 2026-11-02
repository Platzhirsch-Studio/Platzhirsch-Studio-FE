// /de/ezarri/wasser – Wasserwirkung: 6 Wasserfarben nebeneinander (Team A, Konzept §2/§3.1).
// Je Wasserfarbe ein Projektbild, Erklärung, passende Mosaike und Projektzahl.
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Container, Section } from "@/components/ui";
import { countGallery, countReferences, getGalleryImages, pickReferences } from "@/lib/ezarri/data";
import { ezarriWeltLocaleEnabled } from "@/lib/ezarri/config";
import { facetsFor } from "@/lib/ezarri/facets";
import { ezCopy, ezT } from "@/lib/ezarri/lang";
import { WasserStreifen } from "@/components/Ezarri/Welt/Sections";
import { CreditNote, PageHead, Schluss, ezCrumbsFor } from "@/components/Ezarri/Welt/parts";
import { ezarriMetadata } from "@/components/Ezarri/Welt/meta";
import { brandNode } from "@/components/Ezarri/Welt/schema";
import { Link } from "@/i18n/navigation";

const PATH = "/ezarri/wasser";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) return {};
  const { WASSER } = ezCopy(locale);
  return ezarriMetadata({ locale, path: PATH, title: WASSER.seoTitle, description: WASSER.description, image: getGalleryImages({ wasser: "tuerkisblau", limit: 1 })[0]?.bild?.web });
}

export default async function WasserPage({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { WASSER } = ezCopy(locale);
  const t = ezT(locale);
  const { WASSERWIRKUNG } = facetsFor(locale);
  const items = WASSERWIRKUNG.map((w) => ({
    w,
    image: getGalleryImages({ wasser: w.id, limit: 1 })[0]?.bild ?? pickReferences({ wasser: [w.id] }, 1)[0]?.bild,
    mosaics: pickReferences({ wasser: [w.id] }, 4),
    anzahl: countReferences({ wasser: [w.id] }),
    projekte: countGallery({ wasser: [w.id] }),
  }));
  return (
    <>
      <PageHead crumbs={ezCrumbsFor(locale, { label: WASSER.crumb })} eyebrow={WASSER.eyebrow} title={WASSER.title} lead={WASSER.lead} jsonLd={[brandNode()]} />
      <Container className="pb-section">
        <WasserStreifen items={items} headingLevel={2} />
        <CreditNote className="mt-10" />
        <p className="mt-2 text-small text-text-soft">{WASSER.quelle}</p>
      </Container>
      <Section tone="band" labelledBy="ez-wasser-zahlen" spacing="compact">
        {/* QM r4: ab lg Überschrift links (4 Spalten), Tabelle rechts über volle 8 Spalten – vorher nutzte
            sie nur gut die halbe Breite (max-w-2xl). Bei 200 % Text scrollt die Tabelle in ihrem eigenen
            Bereich waagrecht, statt dass die Zahlen rechts aus dem Bildschirm laufen (WCAG 1.4.10, Datentabelle). */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-12 lg:gap-x-grid">
        <h2 id="ez-wasser-zahlen" className="text-title text-text lg:col-span-4">{t("Mosaike und Projekte je Wasserfarbe", WASSER.zahlen?.title)}</h2>
        <div className="min-w-0 overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:col-span-8" role="region" aria-labelledby="ez-wasser-zahlen" tabIndex={0}>
        <table className="w-full border-t border-line text-left text-small tabular-nums">
          <caption className="sr-only">{t("Anzahl Mosaike und Projektbilder je Wasserwirkung laut Ezarri", WASSER.zahlen?.caption)}</caption>
          <thead className="text-text-soft">
            <tr>
              <th scope="col" className="border-b border-line py-2 pr-4 font-medium">{t("Wasserwirkung", WASSER.zahlen?.wirkung)}</th>
              <th scope="col" className="border-b border-line py-2 pr-4 font-medium">{t("Mosaike", WASSER.zahlen?.mosaike)}</th>
              <th scope="col" className="border-b border-line py-2 font-medium">{t("Projektbilder", WASSER.zahlen?.projekte)}</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ w, anzahl, projekte }) => (
              <tr key={w.id}>
                <th scope="row" className="border-b border-line py-2 pr-4 font-normal">
                  <Link href={`/ezarri/mosaike?wasser=${w.id}`} className="inline-flex min-h-11 items-center underline underline-offset-4">{w.label}</Link>
                </th>
                <td className="border-b border-line py-2 pr-4">{anzahl}</td>
                <td className="border-b border-line py-2">
                  <Link href={`/ezarri/galerie?wasser=${w.id}`} className="inline-flex min-h-11 items-center underline underline-offset-4">{projekte}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        </div>
      </Section>
      <Schluss tone="surface" />
    </>
  );
}
