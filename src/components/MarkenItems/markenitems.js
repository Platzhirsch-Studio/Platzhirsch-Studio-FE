"use client";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import FadeInView from "@/components/Reusable/FadeInView";
import { Link } from "@/i18n/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { generateSlug } from "@/lib/slugify";
import { productsPath } from "@/utils/routing";
import { formatCollectionName, collectionPath } from "@/lib/marken/collections";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Flag,
  Calendar,
  CircleUser,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Slider arrows                                                      */
/* ------------------------------------------------------------------ */

const NextArrow = ({ onClick }) => (
  <button
    type="button"
    aria-label="Next"
    className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 cursor-pointer bg-black/40 hover:bg-black/60 p-3 rounded-full shadow-lg transition-all"
    onClick={onClick}
  >
    <ChevronRight className="text-white text-2xl" />
  </button>
);

const PrevArrow = ({ onClick }) => (
  <button
    type="button"
    aria-label="Previous"
    className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 cursor-pointer bg-black/40 hover:bg-black/60 p-3 rounded-full shadow-lg transition-all"
    onClick={onClick}
  >
    <ChevronLeft className="text-white text-2xl" />
  </button>
);

/* ------------------------------------------------------------------ */
/* Section header — eyebrow, title and the site's gold accent bar     */
/* ------------------------------------------------------------------ */

const SectionHeader = ({ eyebrow, title }) => (
  <div className="mb-10">
    <span className="block text-xs font-semibold uppercase tracking-wide text-[#d1b250]">
      {eyebrow}
    </span>
    <h2 className="mt-2 text-2xl md:text-3xl font-bold text-[#30373e]">{title}</h2>
    <div className="mt-3 h-1 w-20 rounded-full bg-[#d1b250]" />
  </div>
);

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

// Category tile name for the current locale (Produkte Kategorie: name_de / name_en / ...).
const getKategorieName = (kategorie, locale) =>
  kategorie[`name_${locale}`] || kategorie.name_de || kategorie.category_key;

// Localized CMS field (`<key>_en`, …), falling back to German — which is
// `<key>_de` for most fields but the unsuffixed `<key>` for beschreibung/produkte.
const localized = (obj, key, locale) =>
  obj?.[`${key}_${locale}`] || obj?.[`${key}_de`] || obj?.[key] || "";

const SHOWROOM_EMAIL = "info@platzhirsch.studio";

export default function BrandPage({ marke, kategorien = [], collections = [] }) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("marken");

  const settingsInfoBoxes = {
    dots: false,
    infinite: true,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
  };

  const settingsGallery = {
  dots: true,
  infinite: true,
  speed: 500,
  autoplay: true,
  autoplaySpeed: 3500,
  pauseOnHover: true,
  slidesToShow: 1,
  slidesToScroll: 1,
  arrows: true,
  nextArrow: <NextArrow />,
  prevArrow: <PrevArrow />,
};

  const designApproach = localized(marke, "desing_approach", locale);
  const [quoteOpen, quoteClose] =
    { en: ["“", "”"], fr: ["« ", " »"], it: ["«", "»"] }[locale] || ["„", "“"];
  const intro = localized(marke, "produkte", locale);
  const description = localized(marke, "beschreibung", locale);
  const dealersTitle = localized(marke, "dealers_title", locale);
  const dealersDescription = localized(marke, "dealers_description", locale);

  // Mobile info-box slider — the brand's own facts, skipping any the CMS leaves
  // empty. The founder isn't here: it's shown in the philosophy section.
  const infoBoxes = [
    marke.grundungsjahr && { icon: Calendar, label: t("foundingYear"), value: marke.grundungsjahr },
    marke.herkunftsland && { icon: Flag, label: t("country"), value: marke.herkunftsland },
  ].filter(Boolean);

  return (
    <div className="text-[#30373e]">
      {/* ---------------------------------------------------------- */}
      {/* HERO                                                        */}
      {/* ---------------------------------------------------------- */}
      <header className="relative h-150 lg:h-200 flex items-end">
        <Image
          src={
            marke.bild_anhagen?.[0]?.bild_anhagen
              ? `/cmx${marke.bild_anhagen[0].bild_anhagen}`
              : "/Images/fallback-banner.jpg"
          }
          alt={marke.name1}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 from-0% via-black/30 via-50% to-black/20 to-100%" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-16 lg:pb-20 text-white">
          <div className="max-w-[950px]">
                <h1 className="text-[2rem] sm:text-[2.5rem] md:text-[3.5rem] lg:text-[4.5rem] tracking-[2px] uppercase mb-5 font-light leading-[1.05] break-words">
              {marke.name1}
            </h1>

            {intro && (
            <p className="max-w-[750px] text-[1.05rem] md:text-[1.25rem] font-light text-[#dcdcdc] mb-[30px]">
              {intro}
            </p>
            )}
          </div>

          <div className="flex flex-wrap gap-5 items-center">
            <Link
              href="#produkte"
              className="bg-white text-[#30373e] px-7 py-[14px] uppercase tracking-[2px] text-[0.8rem] font-semibold rounded-[2px] transition-all duration-[400ms] hover:bg-[#d1b250] hover:text-[#30373e]"
            >
               {t("collection_discover")}
            </Link>
            {marke.firmenlink && (
            <a
              href={marke.firmenlink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white text-[0.85rem] uppercase tracking-[2px] border-b border-white/50 pb-[3px] transition-all duration-[400ms] hover:border-[#d1b250] hover:text-[#d1b250]"
            >
              {t("officialWebsite")}
            </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto my-10 max-w-7xl px-6 lg:my-16">
        {/* -------------------------------------------------------- */}
        {/* EDITORIAL / PHILOSOPHY                                    */}
        {/* -------------------------------------------------------- */}
        <section className="mb-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <FadeInView as="div" direction="left" duration={700}>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-[#d1b250]">
                {t("philosophyEyebrow")}
              </span>
              <h2 className="mt-2 text-2xl font-bold text-[#30373e] md:text-3xl">
                {t("philosophyTitle")}
              </h2>
              <div className="mb-6 mt-3 h-1 w-20 rounded-full bg-[#d1b250]" />

              {description && (
              <p className="mb-4 whitespace-pre-line leading-relaxed text-gray-600">
                {description}
              </p>
              )}

              {/* Design approach as a pull quote, signed by the founder */}
              {(designApproach || marke.grunder) && (
              <figure className="mt-8 border-l-2 border-[#d1b250] pl-6">
                {designApproach && (
                <>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-[#d1b250]">
                    {t("designApproach")}
                  </span>
                  <blockquote className="mt-2 text-lg font-light italic leading-relaxed text-[#30373e] md:text-xl">
                    {quoteOpen}{designApproach}{quoteClose}
                  </blockquote>
                </>
                )}
                {marke.grunder && (
                <figcaption className={`flex items-center gap-3 ${designApproach ? "mt-5" : ""}`}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#30373e] text-[#d1b250]">
                    <CircleUser size={18} />
                  </span>
                  <span>
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-[#30373e]/50">
                      {t("founder")}
                    </span>
                    <span className="block text-sm font-semibold text-[#30373e]">{marke.grunder}</span>
                  </span>
                </figcaption>
                )}
              </figure>
              )}
            </div>
          </FadeInView>

          <FadeInView as="div" direction="right" duration={700}>
  {/* min-w-0 is important: without it react-slick overflows a grid column */}
  <div className="min-w-0">
    {marke.bild_anhagen?.length > 1 ? (
      <Slider {...settingsGallery}>
        {marke.bild_anhagen.map((img, i) => (
          <div key={img.bild_anhagen}>
            <div className="relative h-[320px] overflow-hidden rounded-xl shadow-lg md:h-[480px]">
              <Image
                src={`/cmx${img.bild_anhagen}`}
                alt={`${marke.name1} Detail ${i + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        ))}
      </Slider>
    ) : (
      marke.bild_anhagen?.[0] && (
        <div className="relative h-[320px] overflow-hidden rounded-xl shadow-lg md:h-[480px]">
          <Image
            src={`/cmx${marke.bild_anhagen[0].bild_anhagen}`}
            alt={marke.name1}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
          />
        </div>
      )
    )}
  </div>
</FadeInView>
        </section>

        {/* -------------------------------------------------------- */}
        {/* PRODUCT CATEGORIES                                        */}
        {/* -------------------------------------------------------- */}
        {/* Target of the hero "Kollektion entdecken" button — lives above the first product
            section so it works whether or not the brand has collections. */}
        <div id="produkte" className="scroll-mt-24" />
        {kategorien.length > 0 && (
        <section className="mb-16">
          <SectionHeader
            eyebrow={t("portfolioEyebrow")}
            title={t("portfolioTitle")}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {kategorien.map((kat) => {
              const name = getKategorieName(kat, locale);
              return (
                <Link
                  key={kat.category_key}
                  href={`${productsPath(locale, generateSlug(kat.category_key))}?marke=${generateSlug(marke.name1)}`}
                  locale={locale}
                  className="group relative block h-[280px] overflow-hidden rounded-lg border border-[#30373e]/10 bg-gray-100 shadow-[0_1px_3px_rgba(48,55,62,0.06)] transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(48,55,62,0.12)]"
                >
                  <Image
                    src={
                      kat.product_image
                        ? `/cmx${kat.product_image}`
                        : kat.image
                          ? `/cmx${kat.image}`
                          : "/Images/fallback-banner.jpg"
                    }
                    alt={kat[`alt_text_${locale}`] || name}
                    fill
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 400px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#d1b250]">
                      {t("productCount", { count: kat.produkt_count || 0 })}
                    </span>
                    <p className="text-lg font-medium text-white">{name}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
        )}

        {/* -------------------------------------------------------- */}
        {/* CRAFTSMANSHIP / DISCIPLINES                               */}
        {/* -------------------------------------------------------- */}
        {marke.craft_disciplines?.length > 0 && (
        <section className="mb-16">
          <SectionHeader
            eyebrow={t("craftEyebrow")}
            title={t("craftTitle")}
          />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {marke.craft_disciplines.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[#30373e]/10 p-6 shadow-[0_1px_3px_rgba(48,55,62,0.06)] md:p-10"
              >
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#d1b250]">
                  {localized(item, "eyeline", locale)}
                </span>
                <h3 className="mb-3 text-xl font-bold text-[#30373e]">{localized(item, "title", locale)}</h3>
                <p className="leading-relaxed text-gray-600">{localized(item, "text", locale)}</p>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* -------------------------------------------------------- */}
        {/* PRODUCTS                                                */}
        {/* -------------------------------------------------------- */}
        {collections.length > 0 && (
        <section className="mb-16">
          <SectionHeader eyebrow={t("collectionEyebrow")} title={t("collectionTitle")} />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => {
              const title = formatCollectionName(collection.name);
              return (
                <Link
                  key={collection.name}
                  href={collectionPath(locale, marke.name1, collection.name)}
                  locale={locale}
                  className="group block overflow-hidden rounded-lg border border-[#30373e]/10 bg-white shadow-[0_1px_3px_rgba(48,55,62,0.06)] transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(48,55,62,0.12)]"
                >
                  <div className="relative h-80 w-full overflow-hidden bg-gray-100">
                    <Image
                      src={
                        collection.image
                          ? `/cmx${collection.image}`
                          : "/Images/fallback-banner.jpg"
                      }
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 400px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="mb-3 text-xl font-bold text-[#30373e] transition-colors duration-300 group-hover:text-[#d1b250]">{title}</h3>
                    <div className="flex items-center justify-between gap-3">
                      <p className="leading-relaxed text-gray-600">
                        {t("productCount", { count: collection.produkt_count || 0 })}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#30373e]/60 transition-colors duration-300 group-hover:text-[#d1b250]">
                        {t("viewCollection")}
                        <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
        )}

        {/* -------------------------------------------------------- */}
        {/* INFO BOXES (mobile slider)                                */}
        {/* -------------------------------------------------------- */}
        {infoBoxes.length > 0 && (
        <section className="mb-16 lg:hidden">
          <Slider {...settingsInfoBoxes}>
            {infoBoxes.map(({ icon: Icon, label, value }) => (
              <div key={label} className="px-2">
                <div className="flex h-[200px] flex-col items-center justify-center rounded-2xl border border-[#30373e]/10 p-6 text-center shadow-[0_1px_3px_rgba(48,55,62,0.06)]">
                  <Icon className="mb-3 text-[#d1b250]" size={32} />
                  <p className="mb-1 text-lg uppercase text-gray-500">{label}</p>
                  <p className="break-words text-xl font-bold">{value}</p>
                </div>
              </div>
            ))}
          </Slider>
        </section>
        )}

        {/* -------------------------------------------------------- */}
        {/* SHOWROOM / DEALER — dark panel like BrandDesignerShowcase */}
        {/* -------------------------------------------------------- */}
        <section className="grid grid-cols-1 items-center gap-10 rounded-2xl bg-[#30373e] p-8 text-white sm:p-12 md:grid-cols-2 lg:p-14">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#d1b250]">
              {t("showroomEyebrow")}
            </span>
            <div className="mt-3 h-[2px] w-12 bg-[#d1b250]" />
            {dealersTitle && (
            <h2 className="mt-5 text-3xl font-light uppercase tracking-wide text-white sm:text-4xl">
              {dealersTitle}
            </h2>
            )}
            {dealersDescription && (
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/65">
              {dealersDescription}
            </p>
            )}
            <a
              href={`mailto:${SHOWROOM_EMAIL}`}
              className="mt-8 inline-flex items-center gap-2 rounded-[3px] border-2 border-[#d1b250] px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-white transition-colors duration-300 hover:bg-[#d1b250] hover:text-[#30373e]"
            >
              {t("requestConsultation")}
            </a>
          </div>
          <div>
            <strong className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#d1b250]">
              {t("location")}
            </strong>
            <p className="mb-6 whitespace-pre-line text-sm leading-relaxed text-white/65">
              {t("locationText")}
            </p>

            <strong className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#d1b250]">
              {t("service")}
            </strong>
            <p className="text-sm leading-relaxed text-white/65">{t("serviceText")}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
