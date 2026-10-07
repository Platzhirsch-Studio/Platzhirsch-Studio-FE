'use client';
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { generateSlug } from "@/lib/slugify";
import FadeInView from "@/components/Reusable/FadeInView";

// Localized base paths for each supported locale
const localizedBasePaths = {
  de: "/ueber-uns/marken",
  en: "/about-us/brands",
  fr: "/a-propos/marques",
  it: "/chi-siamo/marche",
};

const Marken = ({ marken }) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("MarkenSection");

  return (
    <section className="mt-10 lg:mt-16 mb-10 lg:mb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <FadeInView
        as="h2"
        direction="bottom"
        duration={500}
        distance={30}
        className="text-lg mb-4 text-[#d1b250] text-left uppercase"
      >
        {t("headline")}
      </FadeInView>

      <FadeInView
        as="h3"
        direction="bottom"
        duration={500}
        distance={30}
        className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
      >
        {t("subheadline")}
      </FadeInView>

      {t.raw("paragraphs").map((paragraph, index) => (
        <FadeInView
          key={index}
          as="p"
          direction="bottom"
          duration={500}
          distance={20}
          delay={200 + (index * 100)}
          className="mb-4 text-base leading-relaxed text-[#30373e]/80"
        >
          {paragraph}
        </FadeInView>
      ))}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-14 lg:mt-20">
        {marken
          .filter((item) => item.status === "Aktiv")
          .map((item, index) => {
            const slug = generateSlug(item.title);
            const basePath = localizedBasePaths[locale] || "/ueber-uns/marken";

            return (
              <FadeInView
                key={slug}
                as="div"
                direction="bottom"
                duration={500}
                distance={30}
                delay={index * 70}
              >
                {/* Logo turns gold on hover/keyboard focus; brands without a logo show their name. */}
                <Link
                  href={`${basePath}/${slug}`}
                  prefetch={true}
                  locale={locale}
                  aria-label={item.title}
                  className="group flex h-[130px] w-auto items-center justify-center border border-gray-800 bg-white p-6 transition-shadow duration-300 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1b250]"
                >
                  {item?.images ? (
                    <Image
                      src={`/cmx${item.images}`}
                      alt={item.title || "Brand logo"}
                      width={100}
                      height={100}
                      className="h-auto max-h-full w-[100px] object-contain group-hover:[filter:brightness(0)_saturate(100%)_invert(83%)_sepia(65%)_saturate(707%)_hue-rotate(355deg)_brightness(85%)_contrast(90%)] group-focus-visible:[filter:brightness(0)_saturate(100%)_invert(83%)_sepia(65%)_saturate(707%)_hue-rotate(355deg)_brightness(85%)_contrast(90%)]"
                    />
                  ) : (
                    <span className="text-center text-sm font-semibold uppercase tracking-wide text-[#30373e] group-hover:text-[#d1b250] group-focus-visible:text-[#d1b250]">
                      {item.title}
                    </span>
                  )}
                </Link>
              </FadeInView>
            );
          })}
      </div>
    </section>
  );
};

export default Marken;