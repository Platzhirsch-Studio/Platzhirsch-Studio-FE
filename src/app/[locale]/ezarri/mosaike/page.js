// /de/ezarri/mosaike – Mosaik-Übersicht mit allen Filtern (Konzept §3.4).
// Server rendert das gefilterte Ergebnis aus searchParams (funktioniert ohne
// JS), die FilterIsland übernimmt im Browser. Filter-URLs sind Hilfsseiten:
// robots über withEzarriRobots(…, {utility}) bei aktiven Filtern.
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCollections, getReferenceIndex } from "@/lib/ezarri/data";
import { ezarriWeltLocaleEnabled } from "@/lib/ezarri/config";
import { countActiveFilters, parseFilters } from "@/lib/ezarri/facets";
import { ezCopy, ezT } from "@/lib/ezarri/lang";
import { Container } from "@/components/ui";
import FilterIsland from "@/components/Ezarri/Katalog/FilterIsland";
import { PER_STEP } from "@/components/Ezarri/Katalog/constants";
import { DEFAULT_SORT, countExtras, parseExtras } from "@/components/Ezarri/Katalog/katalogState";
import { PageHead, Schluss, ezCrumbsFor } from "@/components/Ezarri/Welt/parts";
import { ezarriMetadata } from "@/components/Ezarri/Welt/meta";
import { collectionPage } from "@/components/Ezarri/Welt/schema";

const PATH = "/ezarri/mosaike";
const known = () => ({ kollektionen: getCollections().map((c) => c.id) });

export async function generateMetadata({ params, searchParams }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) return {};
  const { MOSAIKE } = ezCopy(locale);
  const sp = await searchParams;
  const x = parseExtras(sp);
  const filtered = countActiveFilters(parseFilters(sp, known())) + countExtras(x) > 0 || x.sort !== DEFAULT_SORT;
  return ezarriMetadata({ locale, path: PATH, title: MOSAIKE.seoTitle, description: MOSAIKE.description, utility: filtered });
}

// Abnahme Ezarri-Welt Restpunkt 5 (Seitengewicht): die Insel bekommt nur die
// Felder, die Filter, Karten, Vergleich und Merkliste im Browser lesen. quelle
// (Ezarri-URL, steht auf der Detailseite), mischbar und imKonfigurator bleiben
// auf dem Server (Integration 28.10.2026).
function slimIndex(index) {
  return index.map(({ quelle, mischbar, imKonfigurator, ...card }) => card);
}

export default async function MosaikePage({ params, searchParams }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { MOSAIKE } = ezCopy(locale);
  const t = ezT(locale);
  const sp = await searchParams;
  const filters = parseFilters(sp, known());
  const extras = parseExtras(sp);
  const seite = Math.min(Math.max(1, Number.parseInt(sp?.seite, 10) || 1), 20);
  const index = getReferenceIndex();
  const kollektionen = getCollections()
    .filter((c) => c.anzahl_referenzen > 0)
    .map((c) => ({ id: c.id, name: c.name }));
  const crumbs = ezCrumbsFor(locale, { label: MOSAIKE.crumb });
  const ld = collectionPage({
    locale,
    path: PATH,
    name: MOSAIKE.seoTitle,
    description: MOSAIKE.description,
    // Nur die ersten 24 (QM P3-5: Seitengewicht); vollständige Liste in der Sitemap.
    items: index.filter((c) => c.typ === "mosaik").slice(0, 24).map((c) => ({ name: `Ezarri ${c.name}`, href: `${PATH}/${c.id}` })),
  });

  return (
    <>
      <PageHead crumbs={crumbs} eyebrow={MOSAIKE.eyebrow} title={MOSAIKE.title} lead={MOSAIKE.lead} leadClassName="max-md:hidden" compact jsonLd={[ld]} />
      <Container className="pb-section">
        <FilterIsland index={slimIndex(index)} initialFilters={filters} initialExtras={extras} initialShown={seite * PER_STEP} kollektionen={kollektionen} action={`/${locale}${PATH}`} />
      </Container>
      <Schluss />
    </>
  );
}
