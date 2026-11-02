// /de/ezarri/galerie – Projekte mit Ezarri-Mosaik (Team A, Konzept §3.6).
// Filter + echte Paginierung ?seite= (24 je Seite). Seite 1 ohne Filter ist
// indexierbar (bei EZARRI_PUBLIC), Filter- und Folgeseiten noindex, follow
// mit canonical auf sich selbst (?seite=n). Bilder sind Ezarri-Projekte, nie
// „unsere Projekte“; Ort oder Kunde werden nicht erfunden.
// QM Runde 2 P2-4: Filter wie /ezarri/mosaike (Bottom-Sheet mobil, sofort
// wirksam), kurzer Kopf (erste Bildreihe im ersten Bildschirm), Ezarris
// Produktvideos getrennt von den Projektbildern (eigener Abschnitt, zählen
// nicht als Projekt und nicht bei Einsatz-Filtern).
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container, Heading } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { galleryFacetCounts, getCollections, getGallery, getGalleryCollections, getGalleryVideos, getReference } from "@/lib/ezarri/data";
import { compactImage } from "@/lib/ezarri/images";
import { ezarriCredit, ezarriWeltLocaleEnabled } from "@/lib/ezarri/config";
import { countActiveFilters, facetsFor, parseFilters, serializeFilters } from "@/lib/ezarri/facets";
import { ezCopy, ezT } from "@/lib/ezarri/lang";
import GalleryGrid, { VideoList } from "@/components/Ezarri/Katalog/GalleryGrid";
import GalleryFilters from "@/components/Ezarri/Katalog/GalleryFilters";
import { CreditNote, PageHead, Schluss, ezCrumbsFor } from "@/components/Ezarri/Welt/parts";
import { ezarriMetadata } from "@/components/Ezarri/Welt/meta";
import { brandNode, imageGallery } from "@/components/Ezarri/Welt/schema";

const PATH = "/ezarri/galerie";
const PER_PAGE = 24;
const known = () => ({ kollektionen: getCollections().map((c) => c.id) });
const pageOf = (sp) => Math.max(1, Number.parseInt(sp?.seite, 10) || 1);

export async function generateMetadata({ params, searchParams }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) return {};
  const { GALERIE } = ezCopy(locale);
  const sp = await searchParams;
  const filtered = countActiveFilters(parseFilters(sp, known())) > 0;
  const seite = pageOf(sp);
  return ezarriMetadata({
    locale,
    path: PATH,
    title: seite > 1 ? `${GALERIE.seoTitle} – ${ezT(locale)("Seite", "page", "page", "pagina")} ${seite}` : GALERIE.seoTitle,
    description: GALERIE.description,
    utility: filtered || seite > 1,
    seite,
  });
}

export default async function GaleriePage({ params, searchParams }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { GALERIE } = ezCopy(locale);
  const t = ezT(locale);
  const { FARBFAMILIEN, FORMATE, WASSERWIRKUNG } = facetsFor(locale);
  const sp = await searchParams;
  const filters = parseFilters(sp, known());
  const { items, total, page, pages } = getGallery(filters, { page: pageOf(sp), perPage: PER_PAGE, medien: "foto" });
  const kollektionen = getGalleryCollections();
  const counts = galleryFacetCounts(filters, {
    einsatz: GALERIE.einsatz.map((e) => e.id),
    wasser: WASSERWIRKUNG.map((w) => w.id),
    kollektion: kollektionen.map((k) => k.id),
    farbfamilie: FARBFAMILIEN.map((x) => x.id),
    format: FORMATE.map((x) => x.id),
  });
  const videos = getGalleryVideos(filters).map((g) => (g.referenz ? { ...g, poster: compactImage(getReference(g.referenz)?.bilder?.mosaik?.[0]) } : g));
  const qs = serializeFilters(filters);
  const href = (p) => {
    const q = new URLSearchParams(qs);
    if (p > 1) q.set("seite", String(p));
    const s = q.toString().replace(/%2C/g, ",");
    return `${PATH}${s ? `?${s}` : ""}`;
  };
  const ld = [brandNode(), imageGallery({ locale, path: PATH, name: GALERIE.title, items })];
  const crumbs = ezCrumbsFor(locale, { label: GALERIE.crumb });

  return (
    <>
      <PageHead crumbs={crumbs} title={null} jsonLd={ld} />
      <Container className="pb-section">
        <div className="mb-5 md:mb-8">
          <Heading level={1} size="display-l" className="text-balance">
            {GALERIE.title}
          </Heading>
          <p className="mt-2 text-body text-text-soft">{GALERIE.lead}</p>
        </div>
        <GalleryFilters filters={filters} kollektionen={kollektionen} counts={counts} total={total} videos={page === 1 ? videos.length : 0} action={`/${locale}${PATH}`} />
        {pages > 1 && <p className="mt-1 text-small text-text-soft max-md:sr-only">{t(`Seite ${page} von ${pages}`, `Page ${page} of ${pages}`, `Page ${page} sur ${pages}`, `Pagina ${page} di ${pages}`)}</p>}
        <div className="mt-5">{items.length ? <GalleryGrid items={items} /> : <p className="text-body text-text-soft">{GALERIE.leer}</p>}</div>
        <CreditNote className="mt-8" />
        {pages > 1 && (
          <nav aria-label={t("Seiten der Galerie", "Gallery pages", "Pages de la galerie", "Pagine della galleria")} className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
            {page > 1 ? (
              <Link href={href(page - 1)} rel="prev" className="inline-flex min-h-12 items-center gap-2 border border-ink px-5 text-ui text-text hover:bg-action hover:text-paper">
                <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={1.5} />
                {t("Vorherige Seite", "Previous page", "Page précédente", "Pagina precedente")}
              </Link>
            ) : (
              <span />
            )}
            <p className="text-small tabular-nums text-text-soft">
              {page} / {pages}
            </p>
            {page < pages ? (
              <Link href={href(page + 1)} rel="next" className="inline-flex min-h-12 items-center gap-2 border border-ink px-5 text-ui text-text hover:bg-action hover:text-paper">
                {t("Nächste Seite", "Next page", "Page suivante", "Pagina successiva")}
                <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
        {page === 1 && videos.length > 0 && (
          <section id="ez-videos" aria-labelledby="ez-videos-h" className="mt-section scroll-mt-[calc(var(--header-h)+4rem)] border-t border-line pt-10">
            <Heading id="ez-videos-h" level={2} size="title">
              {GALERIE.videos.title} ({videos.length})
            </Heading>
            <p className="mt-2 max-w-measure text-body text-text-soft">{GALERIE.videos.text}</p>
            <div className="mt-6">
              <VideoList items={videos} />
            </div>
            <p className="mt-6 text-small text-text-soft">{ezarriCredit("video", locale)}</p>
          </section>
        )}
      </Container>
      <Schluss />
    </>
  );
}
