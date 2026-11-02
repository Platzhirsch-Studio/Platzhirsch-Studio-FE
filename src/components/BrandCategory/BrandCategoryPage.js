// "Marke × Kategorie" page (/ueber-uns/marken/<brand>/<category>, all four
// locales) – masterplan AP5 Nr. 1, R2-seo. Server Component, no client JS.
// Same language as the new brand pages (MarkenItems/markenitems.js,
// collectionDetail.js): text beside the image, tokens only, no radius, no
// shadow, no dark surface, ui building blocks imported unchanged.
//
// Data: getBrandCategoryPageData() (@/lib/marken/brandCategoryLoader).
// Texts: messages namespace "brandCategory" once merged, else the locale
// module @/lib/marken/brandCategoryCopy (DE/EN/FR/IT).
// JSON-LD (BreadcrumbList + ItemList) is rendered here once; the visible
// breadcrumb therefore runs without `schema`.
//
// `basePath` replaces the brand base path ("/ueber-uns/marken") for the
// links between categories — the preview route passes
// "/preview/marke-kategorie" so it never links to a URL that 404s today.
import Image from "next/image";
import JsonLd from "@/components/Reusable/JsonLd";
import LinkDelegate from "@/components/Reusable/LinkDelegate";
import BrandTile from "@/components/MarkenItems/brandTile";
import { Breadcrumbs, Button, CTABand, Container, Eyebrow, Heading, Lead, LinkArrow, Section } from "@/components/ui";
import { ROUTES, productsPath } from "@/utils/routing";
import { makeBrandCategoryTr } from "@/lib/marken/brandCategoryCopy";
import { buildBrandCategoryIntro, buildBrandCategoryJsonLd, brandCategoryModelCount, brandCategoryTitles, introInput } from "@/lib/marken/brandCategoryPage";
import { getBrandCategoryTranslator } from "@/lib/marken/brandCategoryLoader";
import { withContext } from "@/lib/forms/beratungContext";

const SECTION_Y = "py-12 md:py-section";
// First tiles visible, the rest behind "Alle n Modelle zeigen" (native
// <details>, stays in the HTML for crawlers; Bibel: "Weitere 24 laden").
const VISIBLE_TILES = 24;

// R6-produkt-perf: server tiles with plain <a>/<img> (MarkenItems/brandTile.js);
// the page wrapper <LinkDelegate> keeps client navigation and prefetch.
function Tiles({ items, brand, locale }) {
  return (
    <ul role="list" className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-grid">
      {items.map((p) => (
        <li key={p.slug}>
          <BrandTile
            locale={locale}
            href={p.href}
            image={{ src: p.image, alt: p.alt }}
            hoverImage={p.hoverImage ? { src: p.hoverImage } : undefined}
            brand={brand}
            name={p.name}
            sizes="(min-width: 1440px) 440px, (min-width: 768px) 31vw, 46vw"
          />
        </li>
      ))}
    </ul>
  );
}

function Facts({ items, label }) {
  return (
    <dl aria-label={label} className="grid grid-cols-2 gap-x-grid border-t border-line sm:grid-cols-4">
      {items.map((f) => (
        <div key={f.label} className="border-b border-line py-3">
          <dt className="text-overline uppercase text-text-soft">{f.label}</dt>
          <dd className="mt-1 text-ui text-text tabular">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function BrandCategoryPage({ data, locale = "de", basePath }) {
  const t = await getBrandCategoryTranslator(locale);
  const tr = makeBrandCategoryTr(t, locale);

  const brand = data.brand.display;
  const category = data.category.label;
  const markenPath = ROUTES.marken[locale] || ROUTES.marken.de;
  const brandHref = `${markenPath}/${data.brand.slug}`;
  const linkBase = basePath || markenPath;
  // R5 (ux P2): Termin link with brand context (?produkt=Minotti Sofas).
  const beratungPath = withContext(ROUTES.beratung[locale] || ROUTES.beratung.de, { produkt: `${brand} ${category}`.trim() });
  const { h1 } = brandCategoryTitles(data, locale, t);
  const intro = buildBrandCategoryIntro(introInput(data), locale, t);
  const hero = data.hero || data.products.find((p) => p.image);
  // Box in the image's own ratio (clamped 4:5 … 16:9), image uncropped on
  // linen like the brand page – no grey bars (QA R2 P3-1).
  const heroRatio = Number(Math.min(Math.max(hero?.ratio || 1.5, 0.8), 16 / 9).toFixed(4));
  const linked = data.otherCategories.filter((c) => c.indexable);
  // One visible number everywhere (QA R2 P2-2): the model count of the gallery.
  const models = brandCategoryModelCount(data);

  const facts = [
    { label: tr("factPieces"), value: tr("factPiecesValue", { count: models }) },
    data.brand.country && { label: tr("factOrigin"), value: data.brand.country },
    data.brand.founded && { label: tr("factFounded"), value: data.brand.founded },
    { label: tr("factAdvice"), value: tr("factAdviceValue") },
  ].filter(Boolean);

  return (
    <LinkDelegate className="bg-surface text-text">
      {/* R6-produkt-perf (Fix): no Suspense boundary here – React 19 outlines large boundaries into a hidden <div id="S:0"> after </main>, so without JS the content was missing. */}
      <>
        <JsonLd data={buildBrandCategoryJsonLd(data, locale, t)} />

        {/* ------------------------------------------------------------ */}
        {/* KOPF: Text neben dem Bild                                      */}
        {/* ------------------------------------------------------------ */}
        <Section spacing="none" labelledBy="bc-title" className="pt-8 pb-12 md:pt-12 md:pb-16 lg:pb-20">
          <Breadcrumbs
            items={[
              { label: tr("breadcrumbHome"), href: "/" },
              { label: tr("breadcrumbBrands"), href: markenPath },
              { label: brand, href: brandHref },
              { label: category },
            ]}
          />
          <div className="mt-8 grid grid-cols-1 gap-8 lg:mt-12 lg:grid-cols-12 lg:items-center lg:gap-grid">
            <div className="lg:col-span-7">
              <Eyebrow className="mb-stack-s">{tr("eyebrow", { brand })}</Eyebrow>
              <Heading id="bc-title" level={1} className="break-words">
                {h1}
              </Heading>
              {intro.length > 0 && (
                <Lead tone="soft" className="mt-stack-m max-w-measure">
                  {intro.join(" ")}
                </Lead>
              )}
              <div className="mt-stack-m flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Button href={beratungPath} variant="primary" arrow>
                  {tr("ctaAppointment")}
                </Button>
                {data.products.length > 0 && (
                  <Button href="#stuecke" variant="secondary">
                    {tr("ctaPieces")}
                  </Button>
                )}
              </div>
              <div className="mt-stack-m">
                <Facts items={facts} label={tr("factsLabel")} />
              </div>
            </div>
            {hero && (
              <figure className="lg:col-span-5">
                <div
                  className="relative w-full overflow-hidden bg-linen"
                  style={{ aspectRatio: String(heroRatio), maxWidth: `calc(80svh * ${heroRatio})` }}
                >
                  <Image
                    src={hero.src || hero.image}
                    alt={hero.alt || `${brand} ${category}`}
                    fill
                    preload
                    sizes="(min-width: 1440px) 560px, (min-width: 1024px) 40vw, 100vw"
                    className="object-contain"
                  />
                </div>
                <figcaption className="mt-2 text-small text-text-soft">{tr("imageCredit", { brand })}</figcaption>
              </figure>
            )}
          </div>
        </Section>

        {/* ------------------------------------------------------------ */}
        {/* STÜCKE (Galerie)                                               */}
        {/* ------------------------------------------------------------ */}
        <Section tone="raised" spacing="none" labelledBy="bc-products" id="stuecke" className={`scroll-mt-24 ${SECTION_Y}`}>
          <div className="mb-stack-m flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <Heading id="bc-products" level={2}>
              {tr("piecesTitle")}
            </Heading>
            <p className="tabular text-small text-text-soft">{tr("productsCount", { count: models })}</p>
          </div>
          {data.products.length > 0 ? (
            <>
              <Tiles items={data.products.slice(0, VISIBLE_TILES)} brand={brand} locale={locale} />
              {data.products.length > VISIBLE_TILES && (
                <details className="ph-accordion mt-8">
                  <summary className="flex min-h-12 cursor-pointer items-center gap-2 border-y border-line py-2 text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current">
                    {tr("productsMore", { count: models })}
                  </summary>
                  <div className="pt-8">
                    <Tiles items={data.products.slice(VISIBLE_TILES)} brand={brand} locale={locale} />
                  </div>
                </details>
              )}
            </>
          ) : (
            <p className="text-body text-text-soft">{tr("productsEmpty")}</p>
          )}
          <LinkArrow href={productsPath(locale, data.category.slug)} className="mt-stack-m">
            {tr("catalogAll", { category })}
          </LinkArrow>
        </Section>

        {/* ------------------------------------------------------------ */}
        {/* WEITERE KATEGORIEN (nur indexierbare, interne Verlinkung)      */}
        {/* ------------------------------------------------------------ */}
        {linked.length > 0 && (
          <Section spacing="none" labelledBy="bc-more" className={SECTION_Y}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-grid">
              <div className="lg:col-span-4">
                <Heading id="bc-more" level={2}>
                  {tr("otherTitle", { brand })}
                </Heading>
                <LinkArrow href={brandHref} className="mt-stack-m">
                  {tr("brandLink", { brand })}
                </LinkArrow>
              </div>
              <nav aria-label={tr("otherNav", { brand })} className="lg:col-span-8">
                <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-grid xl:grid-cols-3">
                  {linked.map((c) => (
                    <li key={c.slug} className="border-b border-line first:border-t sm:nth-2:border-t xl:nth-3:border-t">
                      <a
                        href={`/${locale}${linkBase}/${data.brand.slug}/${c.slug}`}
                        className="flex min-h-12 items-center py-2 pr-2 text-ui text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
                      >
                        <span>
                          {c.label} <span className="tabular text-small text-text-soft">({c.modelCount ?? c.count})</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </Section>
        )}

        <CTABand
          id="bc-cta"
          tone="band"
          leitsatz
          eyebrow={tr("showroomTitle", { brand })}
          title={tr("ctaTitle", { brand })}
          text={tr("ctaText")}
          primary={{ href: beratungPath, label: tr("ctaAppointment") }}
          secondary={{ href: brandHref, label: tr("ctaBrand") }}
        />

        <Container className="pb-12">
          <p className="max-w-measure border-t border-line pt-6 text-small text-text-soft">{tr("legalNote", { brand })}</p>
        </Container>
      </>
    </LinkDelegate>
  );
}
