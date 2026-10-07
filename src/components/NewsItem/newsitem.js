"use client";
import React from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { ROUTES } from "@/utils/routing";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { generateSlug } from "@/lib/slugify";
import FadeInView from "@/components/Reusable/FadeInView";

const hasText = (value) => typeof value === "string" && value.trim() !== "";

// Localized CMS text: `${base}_${locale}` for en/fr/it, German as fallback
// (German lives in `germanField`, e.g. name1 / beschreibung).
function localizedText(data, base, germanField, locale) {
  if (locale !== "de" && hasText(data?.[`${base}_${locale}`])) return data[`${base}_${locale}`];
  return data?.[germanField] || "";
}

// Product sections of the article in the page's language. The CMS keeps one
// table per language (artikel_table, artikel_table_en/_fr/_it); a translated
// row may leave image/name/brand empty, so those fall back to the German row
// at the same position. No translated table → the German one.
function localizedSections(data, locale) {
  const german = Array.isArray(data?.artikel_table) ? data.artikel_table : [];
  const translated = locale !== "de" ? data?.[`artikel_table_${locale}`] : null;
  if (!Array.isArray(translated) || translated.length === 0) return german;
  return translated.map((row, index) => {
    const base = german[index] || {};
    const merged = { ...base };
    for (const [key, value] of Object.entries(row || {})) {
      if (value !== null && value !== undefined && value !== "") merged[key] = value;
    }
    return merged;
  });
}

const ArrowIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

// `moreNews`: the latest other articles, built on the server from the CMS
// (src/app/[locale]/news/[title]/page.js) — [{ title, description, image, link }].
const ArticleDetail = ({ data, moreNews = [] }) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("article");

  const title = localizedText(data, "name", "name1", locale);
  const description = localizedText(data, "beschreibung", "beschreibung", locale);
  const sections = localizedSections(data, locale);

  return (
    <div className="max-w-7xl mx-auto px-4 my-10 lg:my-16 ">
      {/* Title */}
      <FadeInView
        as="h2"
        direction="bottom"
        duration={600}
        distance={30}
        className="text-3xl font-bold text-center text-gray-900 mb-4 leading-tight tracking-tight"
      >
        {title}
      </FadeInView>

      {/* Article date — currently disabled (needs `import { Clock } from "lucide-react"`):
      {data.daten && (
        <FadeInView
          as="p"
          direction="bottom"
          duration={600}
          distance={30}
          delay={200}
          className="text-center mb-8 text-md flex items-center justify-center gap-2 text-gray-600"
        >
          <Clock className="text-[#d1b250] text-xl" />
          {new Date(data.daten).toLocaleDateString(locale || "de-DE", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </FadeInView>
      )} */}

      {/* Description — page language, German fallback */}
      {hasText(description) && (
        <FadeInView
          as="div"
          direction="bottom"
          duration={600}
          distance={30}
          delay={300}
          className="prose prose-lg max-w-none mb-8 text-gray-800"
        >
          {description.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </FadeInView>
      )}

      {/* Image */}
      {data?.bild_anhagen && (
        <FadeInView
          as="div"
          direction="bottom"
          duration={400}
          distance={30}
          className="rounded-2xl overflow-hidden mb-10 relative min-h-[400px] transition-transform duration-300 hover:scale-105"
        >
          <Image
            src={`/cms${data.bild_anhagen}`}
            alt={title}
            fill
            sizes="(max-width: 768px) 90vw, (max-width: 1200px) 80vw, 1000px"
            className="object-cover rounded-2xl"
          />
        </FadeInView>
      )}

      {/* Product sections — page language, German fallback */}
      {sections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
          {sections.map((artikel, index) => (
            <FadeInView
              key={artikel?.name || index}
              as="div"
              direction="bottom"
              duration={600}
              distance={40}
              delay={index * 150}
              className="group relative transition-all duration-300 hover:-translate-y-1"
            >
              {artikel?.bild_anhagen && (
                <div className="rounded-xl overflow-hidden shadow-md relative min-h-[300px]">
                  <Image
                    src={`/cms${artikel.bild_anhagen}`}
                    alt={artikel?.artikel_name || title}
                    fill
                    sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 500px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}

              <div className="pt-6 px-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#d1b250] transition-colors">
                  {artikel?.artikel_name}
                </h3>
                <p className={`text-sm text-gray-600 ${artikel?.beschreibung ? "mb-15" : ""}`}>
                  {artikel?.beschreibung?.split("\n")[0]}
                </p>

                {artikel?.unternehmen && (
                  <Link
                    href={`${ROUTES.marken[locale]}/${generateSlug(artikel.unternehmen)}`}
                    locale={locale}
                    className="inline-flex items-center gap-2 text-[#30373e] font-medium relative group"
                  >
                    <span className="z-10 group-hover:text-[#d1b250] transition-colors duration-300">
                      {artikel.unternehmen}
                    </span>
                    <ArrowIcon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:stroke-[#d1b250]" />
                    <span
                      className="absolute left-0 bottom-0 w-full h-[2px] bg-[#30373e] transition-all duration-300 ease-in-out
             md:scale-x-0 md:group-hover:scale-x-100 scale-x-100 origin-left"
                    />
                  </Link>
                )}
              </div>
            </FadeInView>
          ))}
        </div>
      )}

      {/* Weitere Neuigkeiten — the latest other articles from the CMS */}
      {moreNews.length > 0 && (
        <div className="mt-16">
          <FadeInView
            as="h2"
            direction="bottom"
            duration={500}
            distance={30}
            className="text-3xl font-bold text-center text-gray-900 leading-tight tracking-tight py-4 mb-6"
          >
            {t("moreNews")}
          </FadeInView>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
            {moreNews.map((item, index) => (
              <FadeInView
                key={item.link}
                as="div"
                direction="bottom"
                duration={600}
                distance={40}
                delay={index * 150}
                className="group relative transition-all duration-300 hover:-translate-y-1"
              >
                <div className="rounded-xl overflow-hidden shadow-md relative min-h-[300px]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 500px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="pt-6 px-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#d1b250] transition-colors">
                    {item.title}
                  </h3>
                  {item.description && <p className="text-sm text-gray-600 mb-4">{item.description}</p>}

                  <Link
                    href={item.link}
                    prefetch={true}
                    locale={locale}
                    className="inline-flex items-center gap-2 text-[#30373e] font-medium relative group/button"
                  >
                    <span className="z-10  hover:text-[#d1b250]">{t("learnMore")}</span>
                    <ArrowIcon className="w-4 h-4 transition-transform duration-300 group-hover/button:translate-x-1" />
                    <span className="absolute left-0 bottom-0 h-[2px] bg-[#30373e] group-hover:bg-[#d1b250] transition-all duration-300 ease-in-out w-32 lg:w-[0px] group-hover:w-[150px]" />
                  </Link>
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleDetail;
