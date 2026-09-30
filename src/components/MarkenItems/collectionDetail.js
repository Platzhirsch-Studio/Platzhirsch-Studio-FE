"use client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import FadeInView from "@/components/Reusable/FadeInView";
import { Link } from "@/i18n/navigation";
import { generateSlug } from "@/lib/slugify";
import { localizeCategory } from "@/lib/seo/productCategories";
import { collectionPath } from "@/lib/marken/collections";
import { ROUTES } from "@/utils/routing";
import WishlistHeart from "@/components/ShopCatalog/wishlistHeart";

// One collection of a brand (/ueber-uns/marken/[title]/[collection]): hero with
// the collection image, the products it contains, then the brand's other
// collections. Same visual language as the brand story page (markenitems.js).

const SectionHeader = ({ eyebrow, title, aside }) => (
  <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
    <div>
      <span className="block text-xs font-semibold uppercase tracking-wide text-[#d1b250]">{eyebrow}</span>
      <h2 className="mt-2 text-2xl font-bold text-[#30373e] md:text-3xl">{title}</h2>
      <div className="mt-3 h-1 w-20 rounded-full bg-[#d1b250]" />
    </div>
    {aside && <p className="text-sm text-[#30373e]/55">{aside}</p>}
  </div>
);

const ProductCard = ({ product, locale }) => {
  const category = product.categoryKey ? localizeCategory(product.categoryKey, locale) : null;
  const body = (
    <>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={product.image || "/Images/fallback-banner.jpg"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 400px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>
      <div className="flex items-start justify-between gap-3 pt-4">
        <div className="min-w-0">
          {category && (
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#d1b250]">{category}</p>
          )}
          <p className="mt-1 text-base font-medium text-[#30373e]">{product.name}</p>
          {product.designer && <p className="mt-0.5 text-sm text-[#30373e]/55">{product.designer}</p>}
        </div>
        <ArrowUpRight
          size={18}
          className="mt-1 shrink-0 text-[#30373e]/30 transition-colors duration-300 group-hover:text-[#d1b250]"
        />
      </div>
    </>
  );

  return (
    <div className="relative">
      {product.href ? (
        <Link href={product.href} locale={locale} className="group block">
          {body}
        </Link>
      ) : (
        <div className="group block">{body}</div>
      )}
      {product.url_slug && <WishlistHeart product={product} />}
    </div>
  );
};

export default function CollectionDetail({ marke, collection, products = [], otherCollections = [], locale }) {
  const t = useTranslations("marken");
  const brandHref = `${ROUTES.marken[locale] || ROUTES.marken.de}/${generateSlug(marke.name1)}`;

  const breadcrumb = [
    { name: t("breadcrumbHome"), href: "/" },
    { name: t("breadcrumbBrands"), href: ROUTES.marken[locale] || ROUTES.marken.de },
    { name: marke.name1, href: brandHref },
    { name: collection.name, href: null },
  ];

  return (
    <div className="text-[#30373e]">
      {/* ---------------------------------------------------------- */}
      {/* HERO                                                        */}
      {/* ---------------------------------------------------------- */}
      <header className="relative flex h-[560px] items-end lg:h-[720px]">
        <Image
          src={collection.image || "/Images/fallback-banner.jpg"}
          alt={collection.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 from-0% via-black/30 via-50% to-black/30 to-100%" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-14 text-white lg:pb-20">
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1 text-[11px] font-medium uppercase tracking-[0.08em] sm:text-xs">
              {breadcrumb.map((crumb, i) => (
                <li key={i} className="flex items-center gap-1">
                  {crumb.href ? (
                    <Link href={crumb.href} locale={locale} className="text-white/65 transition-colors hover:text-[#d1b250]">
                      {crumb.name}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-white">{crumb.name}</span>
                  )}
                  {i < breadcrumb.length - 1 && <span className="mx-1 text-white/35">/</span>}
                </li>
              ))}
            </ol>
          </nav>

          <p className="text-xs font-semibold uppercase tracking-[2px] text-[#d1b250]">
            {marke.name1} · {t("collectionEyebrow")}
          </p>
          <h1 className="mt-3 break-words text-[2.25rem] font-light uppercase leading-[1.05] tracking-[2px] sm:text-[3rem] md:text-[4rem] lg:text-[4.5rem]">
            {collection.name}
          </h1>
          <p className="mt-4 text-[1.05rem] font-light text-[#dcdcdc] md:text-[1.2rem]">
            {t("productCount", { count: collection.productCount })}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              href="#kollektion-produkte"
              className="rounded-[2px] bg-white px-7 py-[14px] text-[0.8rem] font-semibold uppercase tracking-[2px] text-[#30373e] transition-all duration-[400ms] hover:bg-[#d1b250]"
            >
              {t("collection_discover")}
            </Link>
            <Link
              href={brandHref}
              locale={locale}
              className="border-b border-white/50 pb-[3px] text-[0.85rem] uppercase tracking-[2px] text-white transition-all duration-[400ms] hover:border-[#d1b250] hover:text-[#d1b250]"
            >
              {t("aboutBrandLink", { brand: marke.name1 })}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto my-12 max-w-7xl px-6 lg:my-20">
        {/* -------------------------------------------------------- */}
        {/* ABOUT THE COLLECTION (CMS description)                    */}
        {/* -------------------------------------------------------- */}
        {collection.descriptionParagraphs?.length > 0 && (
          <FadeInView as="section" direction="up" duration={700}>
            <section className="mb-20 grid grid-cols-1 gap-8 border-b border-[#30373e]/10 pb-16 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-4">
                <span className="block text-xs font-semibold uppercase tracking-wide text-[#d1b250]">
                  {t("aboutCollection")}
                </span>
                <h2 className="mt-2 text-2xl font-bold text-[#30373e] md:text-3xl">{collection.name}</h2>
                <div className="mt-3 h-1 w-20 rounded-full bg-[#d1b250]" />
              </div>
              <div className="space-y-4 text-base leading-relaxed text-gray-600 lg:col-span-8 lg:text-lg [&_a]:text-[#d1b250] [&_a]:underline [&_strong]:font-semibold [&_strong]:text-[#30373e] [&_ul]:list-disc [&_ul]:pl-5">
                {collection.descriptionParagraphs.map((p, i) => (
                  <div key={i} dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </div>
            </section>
          </FadeInView>
        )}

        {/* -------------------------------------------------------- */}
        {/* PRODUCTS IN THIS COLLECTION                               */}
        {/* -------------------------------------------------------- */}
        <section id="kollektion-produkte" className="mb-20 scroll-mt-28">
          <SectionHeader
            eyebrow={collection.name}
            title={t("collectionProductsTitle")}
            aside={t("productCount", { count: products.length })}
          />

          {products.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, i) => (
                <FadeInView key={product.id} as="div" direction="up" duration={600} delay={(i % 3) * 100}>
                  <ProductCard product={product} locale={locale} />
                </FadeInView>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#30373e]/55">{t("collectionEmpty")}</p>
          )}
        </section>

        {/* -------------------------------------------------------- */}
        {/* CONSULTATION                                              */}
        {/* -------------------------------------------------------- */}
        <section className="mb-20 flex flex-col items-start justify-between gap-8 rounded-2xl bg-[#30373e] p-8 text-white sm:p-12 md:flex-row md:items-center lg:p-14">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#d1b250]">{t("showroomEyebrow")}</span>
            <div className="mt-3 h-[2px] w-12 bg-[#d1b250]" />
            <h2 className="mt-5 text-2xl font-light uppercase tracking-wide sm:text-3xl">
              {t("collectionConsultTitle", { collection: collection.name })}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/65">{t("serviceText")}</p>
          </div>
          <Link
            href={ROUTES.beratung[locale] || "/beratung"}
            locale={locale}
            className="inline-flex shrink-0 items-center gap-2 rounded-[3px] bg-[#d1b250] px-6 py-3 text-sm font-medium uppercase tracking-wide text-[#30373e] transition-colors duration-300 hover:bg-[#bfa047]"
          >
            {t("requestConsultation")}
            <ArrowUpRight size={16} />
          </Link>
        </section>

        {/* -------------------------------------------------------- */}
        {/* OTHER COLLECTIONS OF THE BRAND                            */}
        {/* -------------------------------------------------------- */}
        {otherCollections.length > 0 && (
          <section className="mb-16">
            <SectionHeader eyebrow={marke.name1} title={t("moreCollections", { brand: marke.name1 })} />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherCollections.map((other) => (
                <Link
                  key={other.id}
                  href={collectionPath(locale, marke.name1, other.id)}
                  locale={locale}
                  className="group relative block h-[320px] overflow-hidden rounded-lg border border-[#30373e]/10 bg-gray-100 shadow-[0_1px_3px_rgba(48,55,62,0.06)] transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(48,55,62,0.12)]"
                >
                  <Image
                    src={other.image || "/Images/fallback-banner.jpg"}
                    alt={other.name}
                    fill
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 400px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                    <div>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#d1b250]">
                        {t("productCount", { count: other.productCount })}
                      </span>
                      <p className="text-lg font-medium text-white">{other.name}</p>
                    </div>
                    <ArrowUpRight size={18} className="shrink-0 text-white/60 transition-colors group-hover:text-[#d1b250]" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <Link
          href={brandHref}
          locale={locale}
          className="inline-flex items-center gap-2 text-sm text-[#30373e]/60 transition-colors hover:text-[#d1b250]"
        >
          <ArrowLeft size={16} />
          {t("backToBrand", { brand: marke.name1 })}
        </Link>
      </main>
    </div>
  );
}
