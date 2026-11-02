// One collection of a brand (/ueber-uns/marken/[title]/[collection]) –
// Neuauftritt. Server Component; only the wishlist heart is a client island.
// Same language as the brand page (markenitems.js): text beside the image,
// tokens only, no radius, no shadow, no dark surface.
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { localizeCategory } from "@/lib/seo/productCategories";
import { collectionPath } from "@/lib/marken/collections";
import { ROUTES, localizeProductsHref } from "@/utils/routing";
import { generateSlug } from "@/lib/slugify";
import { displayBrandName } from "@/lib/content/brands";
import WishlistHeart from "@/components/ShopCatalog/wishlistHeart";
import { Breadcrumbs, Button, CTABand, Card, Container, Eyebrow, Grid, Heading, Lead, Leitsatz, LinkArrow, Media, Section, SmartLink } from "@/components/ui";
import { makeTr } from "./copy";
import { withContext } from "@/lib/forms/beratungContext";
import { cleanProductName } from "@/lib/content/brands";
import { SOFAPLANER_MODEL_LABEL, sofaplanerModelPath } from "@/lib/marken/minottiBodensee";

// CMS names like "Region - bedwear" → "Region – Bedwear" (QA Runde 1, P3-7).
const productName = (raw) =>
  cleanProductName(raw).replace(/\s+-\s+(\p{L})/u, (m, c) => " – " + c.toUpperCase());

function CollectionProduct({ product, locale, brand }) {
  const name = productName(product.name);
  const category = product.categoryKey ? localizeCategory(product.categoryKey, locale) : null;
  const href = product.href ? localizeProductsHref(product.href, locale) : null;
  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-raised">
        <Image
          src={product.image || "/Images/fallback-banner.jpg"}
          alt={product.alt || `${brand} ${name}`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="mt-3 flex flex-col gap-1">
        {category && <p className="text-overline uppercase text-text-soft">{category}</p>}
        <h3 className="text-ui text-text">
          {href ? (
            <SmartLink
              href={href}
              className="ph-stretched underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current"
            >
              {name}
            </SmartLink>
          ) : (
            name
          )}
        </h3>
        {product.designer && <p className="text-small text-text-soft">{product.designer}</p>}
      </div>
      {/* The heart sits above the stretched link (z-index), outside the <a>. */}
      {product.url_slug && <WishlistHeart product={product} />}
    </article>
  );
}

export default async function CollectionDetail({ marke, collection, products = [], otherCollections = [], locale = "de", sofaFamily = null }) {
  const t = await getTranslations({ locale, namespace: "marken" });
  const tr = makeTr(t, locale, "marken");
  const has = (key, fallback, values) => (t.has(key) ? t(key, values) : fallback);

  const brand = displayBrandName(marke.name1);
  const markenPath = ROUTES.marken[locale] || ROUTES.marken.de;
  const brandHref = `${markenPath}/${generateSlug(marke.name1)}`;
  // R5 (ux P2): the Termin link carries the brand context (?produkt= → first
  // message line "Anfrage zu: Minotti Torii", src/lib/forms/beratungContext.js).
  const beratungPath = withContext(ROUTES.beratung[locale] || ROUTES.beratung.de, { produkt: `${brand} ${collection.name}`.trim() });

  return (
    <div className="bg-surface text-text">
      <Section spacing="none" labelledBy="collection-title" className="pt-8 pb-12 md:pt-12 md:pb-16 lg:pb-20">
        {/* This page has no other JSON-LD → the breadcrumb emits BreadcrumbList. */}
        <Breadcrumbs
          schema
          items={[
            { label: has("breadcrumbHome", "Home"), href: "/" },
            { label: has("breadcrumbBrands", "Marken"), href: markenPath },
            { label: brand, href: brandHref },
            { label: collection.name },
          ]}
        />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:mt-12 lg:grid-cols-12 lg:items-center lg:gap-grid">
          <div className="lg:col-span-5">
            <Eyebrow className="mb-stack-s">
              {brand} · {has("collectionEyebrow", "Kollektion")}
            </Eyebrow>
            <Heading id="collection-title" level={1} className="break-words">
              {collection.name}
            </Heading>
            <Lead tone="soft" className="mt-stack-s tabular">
              {has("productCount", `${collection.productCount}`, { count: collection.productCount })}
            </Lead>
            <div className="mt-stack-m flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button href={beratungPath} variant="primary" arrow>
                {tr("ctaAppointment")}
              </Button>
              <Button href="#kollektion-produkte" variant="secondary">
                {tr("ctaPieces")}
              </Button>
            </div>
            {/* Minotti-Sofa-Kollektion: Modell im Sofaplaner vorwählen (nur DE, nur
                Familien aus dem Sofaplaner-Katalog, src/lib/marken/minottiBodensee.js). */}
            {sofaFamily && locale === "de" && (
              <LinkArrow href={sofaplanerModelPath(sofaFamily)} locale="de" className="mt-4" data-sofaplaner-model={sofaFamily}>
                {SOFAPLANER_MODEL_LABEL}
              </LinkArrow>
            )}
          </div>
          {collection.image && (
            <figure className="order-first lg:order-none lg:col-span-7">
              <Media
                src={collection.image}
                alt={`${brand} ${collection.name}`}
                ratio="3/2"
                fit="contain"
                preload
                sizes="(min-width: 1280px) 760px, (min-width: 1024px) 56vw, 100vw"
              />
              <figcaption className="mt-2 text-small text-text-soft">{tr("imageCredit", { brand })}</figcaption>
            </figure>
          )}
        </div>
      </Section>

      {collection.descriptionParagraphs?.length > 0 && (
        <Section labelledBy="collection-about" spacing="compact">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-grid">
            <div className="lg:col-span-4">
              <Eyebrow className="mb-stack-s">{has("aboutCollection", "")}</Eyebrow>
              <Heading id="collection-about" level={2}>
                {collection.name}
              </Heading>
            </div>
            <div className="flex flex-col gap-4 text-body text-text-soft lg:col-span-7 lg:col-start-6 [&_a]:text-text [&_a]:underline [&_strong]:font-medium [&_strong]:text-text [&_ul]:list-disc [&_ul]:pl-5">
              {collection.descriptionParagraphs.map((p, i) => (
                <div key={i} className="max-w-measure" dangerouslySetInnerHTML={{ __html: p }} />
              ))}
            </div>
          </div>
        </Section>
      )}

      <Section tone="raised" labelledBy="collection-products" id="kollektion-produkte" className="scroll-mt-24">
        <div className="mb-stack-m flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <Heading id="collection-products" level={2}>
            {has("collectionProductsTitle", collection.name)}
          </Heading>
          <p className="tabular text-small text-text-soft">{has("productCount", "", { count: products.length })}</p>
        </div>
        {products.length > 0 ? (
          <Grid as="ul" cols={3} role="list">
            {products.map((product) => (
              <li key={product.id}>
                <CollectionProduct product={product} locale={locale} brand={brand} />
              </li>
            ))}
          </Grid>
        ) : (
          <p className="text-body text-text-soft">{has("collectionEmpty", "")}</p>
        )}
      </Section>

      {otherCollections.length > 0 && (
        <Section labelledBy="collection-more" spacing="compact">
          <Heading id="collection-more" level={2} className="mb-stack-m">
            {has("moreCollections", tr("collectionsTitle", { brand }), { brand })}
          </Heading>
          <Grid as="ul" cols={3} role="list">
            {otherCollections.map((other) => (
              <li key={other.id}>
                <Card
                  href={collectionPath(locale, marke.name1, other.id)}
                  title={other.name}
                  image={other.image ? { src: other.image, alt: `${brand} ${other.name}` } : undefined}
                  footer={has("productCount", "", { count: other.productCount })}
                />
              </li>
            ))}
          </Grid>
          <LinkArrow href={brandHref} className="mt-stack-m">
            {has("aboutBrandLink", brand, { brand })}
          </LinkArrow>
        </Section>
      )}

      {/* Optik-Runde (01.11.2026): wie die Produktseite – der Leitsatz IST die
          H2, die zweite Zeile ein Instrument-Lead (keine zwei Display-Zeilen
          übereinander, QA P3-5). */}
      <CTABand
        id="collection-cta"
        tone="raised"
        title={<Leitsatz as="span" size="m" className="block pb-2" />}
        text={
          <>
            <p className="text-lead text-text">{has("collectionConsultTitle", tr("ctaTitle", { brand }), { collection: collection.name })}</p>
            <p className="mt-2">{tr("ctaText")}</p>
          </>
        }
        primary={{ href: beratungPath, label: tr("ctaAppointment") }}
        secondary={{ href: brandHref, label: has("backToBrand", brand, { brand }) }}
      />

      <Container className="pb-12">
        <p className="max-w-measure border-t border-line pt-6 text-small text-text-soft">{tr("legalNote", { brand })}</p>
      </Container>
    </div>
  );
}
