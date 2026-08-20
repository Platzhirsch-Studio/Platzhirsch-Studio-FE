"use client";
import React from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { generateSlug } from "@/lib/slugify";
import FadeInView from "@/components/Reusable/FadeInView";
import { Clock } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const ArticleDetail = ({ data }) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("article");
  const news = useTranslations("news");

  // Ideally, translate these statically in messages, but for demo, set up like this:
  const moreNews = [
    {
      title: news("news1Title") || "Inspiration für einen unvergesslichen Sommer",
      description:
        news("news1Desc") ||
        "Erweitern Sie Ihren Innenbereich mit den exklusiven Outdoor-Kollektionen von Minotti, Solpuri und EMU.",
      image: "/Images/NewsItem/inspirationfur.jpg",
      link: "/news/inspiration-fuer-einen-unvergesslichen-sommer",
    },
    {
      title: news("news2Title") || "Salone del Mobile 2024 und Möbel für den Außenbereich",
      description:
        news("news2Desc") ||
        "Wir berichten von der Salone del Mobile 2024 und stellen Ihnen exklusive Möbel für den Außenbereich vor.",
      image: "/Images/NewsItem/salonedelMobile.jpg",
      link: "/news/salone-del-mobile-2024-und-moebel-fuer-den-aussenbereich",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 my-10 lg:my-16 ">
      {/* Title & Date */}


      <FadeInView
        as="h2"
        direction="bottom"
        duration={600}
        distance={30}
        className="text-3xl font-bold text-center text-gray-900 mb-4 leading-tight tracking-tight"
      >
        {locale === "en"
          ? data?.name_en
          : locale === "it"
            ? data?.name_it
            : locale === "fr"
              ? data?.name_fr
              : data?.name1}
        {/* {data.name1} */}
      </FadeInView>


      {/* {data.daten && (
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

      {locale === "it" && data.beschreibung_it && (
        <FadeInView
          as="div"
          direction="bottom"
          duration={600}
          distance={30}
          delay={300}
          className="prose prose-lg max-w-none mb-8 text-gray-800"
        >
          {data.beschreibung_it.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </FadeInView>
      )}

      {/* Description */}
      {locale === "fr" && data.beschreibung_fr && (
        <FadeInView
          as="div"
          direction="bottom"
          duration={600}
          distance={30}
          delay={300}
          className="prose prose-lg max-w-none mb-8 text-gray-800"
        >
          {data.beschreibung_fr.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </FadeInView>
      )}
      {locale === "en" && data.beschreibung_en && (
        <FadeInView
          as="div"
          direction="bottom"
          duration={600}
          distance={30}
          delay={300}
          className="prose prose-lg max-w-none mb-8 text-gray-800"
        >
          {data.beschreibung_en.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </FadeInView>
      )}
      {locale === "de" && data.beschreibung && (
        <FadeInView
          as="div"
          direction="bottom"
          duration={600}
          distance={30}
          delay={300}
          className="prose prose-lg max-w-none mb-8 text-gray-800"
        >
          {data.beschreibung.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </FadeInView>
      )}

      {/* Image */}
      {data.bild_anhagen && (
        <FadeInView
          as="div"
          direction="bottom"
          duration={400}
          distance={30}
          className="rounded-2xl overflow-hidden mb-10 relative min-h-[400px] transition-transform duration-300 hover:scale-105"
        >
          <Image
            src={`/cms${data.bild_anhagen}`}
            alt={data.name1 || "Article image"}
            fill
            sizes="(max-width: 768px) 90vw, (max-width: 1200px) 80vw, 1000px"
            className="object-cover rounded-2xl"
          />
        </FadeInView>
      )}

      {locale === "de" && data.beschreibung && data.artikel_table?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
          {data.artikel_table.map((artikel, index) => (
            <FadeInView
              key={artikel?.name}
              as="div"
              direction="bottom"
              duration={600}
              distance={40}
              delay={index * 150}
              className="group relative transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image */}
              {artikel?.bild_anhagen && (
                <div className="rounded-xl overflow-hidden shadow-md relative min-h-[300px]">
                  <Image
                    src={`/cms${artikel?.bild_anhagen}`}
                    alt={artikel?.artikel_name || "Article image"}
                    fill
                    sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 500px"
                    className="w-[500px] h-[260px] object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}

              {/* Text */}
              <div className="pt-6 px-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#d1b250] transition-colors">
                  {artikel?.artikel_name}
                </h3>
                <p className={`text-sm text-gray-600 ${artikel?.beschreibung ? "mb-15" : ""}`}>
                  {artikel?.beschreibung?.split("\n")[0]}
                </p>

                {artikel?.unternehmen && (
                  <Link
                    href={`/ueber-uns/marken/${generateSlug(artikel?.unternehmen)}`}
                    locale={locale}
                    className="inline-flex items-center gap-2 text-[#30373e] font-medium relative group"
                  >
                    <span className="z-10 group-hover:text-[#d1b250] transition-colors duration-300">
                      {artikel?.unternehmen}
                    </span>

                    <svg
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:stroke-[#d1b250]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>

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
      {locale === "en" && data.artikel_table_en?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
          {data.artikel_table.map((artikel, index) => (
            <FadeInView
              key={artikel?.name}
              as="div"
              direction="bottom"
              duration={600}
              distance={40}
              delay={index * 150}
              className="group relative transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image */}
              {artikel?.bild_anhagen && (
                <div className="rounded-xl overflow-hidden shadow-md relative min-h-[300px]">
                  <Image
                    src={`/cms${artikel?.bild_anhagen}`}
                    alt={artikel?.artikel_name || "Article image"}
                    fill
                    sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 500px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}

              {/* Text */}
              <div className="pt-6 px-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#d1b250] transition-colors">
                  {artikel?.artikel_name}
                </h3>
                <p className={`text-sm text-gray-600 ${artikel?.beschreibung ? "mb-15" : ""}`}>
                  {artikel?.beschreibung?.split("\n")[0]}
                </p>

                {artikel?.unternehmen && (
                  <Link
                    href={`/ueber-uns/marken/${generateSlug(artikel?.unternehmen)}`}
                    locale={locale}
                    className="inline-flex items-center gap-2 text-[#30373e] font-medium relative group"
                  >
                    <span className="z-10 group-hover:text-[#d1b250] transition-colors duration-300">
                      {artikel?.unternehmen}
                    </span>

                    <svg
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:stroke-[#d1b250]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>

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
      {locale === "it" && data.beschreibung && data.artikel_table_it?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
          {data.artikel_table.map((artikel, index) => (
            <FadeInView
              key={artikel?.name}
              as="div"
              direction="bottom"
              duration={600}
              distance={40}
              delay={index * 150}
              className="group relative transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image */}
              {artikel?.bild_anhagen && (
                <div className="rounded-xl overflow-hidden shadow-md relative min-h-[300px]">
                  <Image
                    src={`/cms${artikel?.bild_anhagen}`}
                    alt={artikel?.artikel_name || "Article image"}
                    fill
                    sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 500px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}

              {/* Text */}
              <div className="pt-6 px-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#d1b250] transition-colors">
                  {artikel?.artikel_name}
                </h3>
                <p className={`text-sm text-gray-600 ${artikel?.beschreibung ? "mb-15" : ""}`}>
                  {artikel?.beschreibung?.split("\n")[0]}
                </p>

                {artikel?.unternehmen && (
                  <Link
                    href={`/ueber-uns/marken/${generateSlug(artikel?.unternehmen)}`}
                    locale={locale}
                    className="inline-flex items-center gap-2 text-[#30373e] font-medium relative group"
                  >
                    <span className="z-10 group-hover:text-[#d1b250] transition-colors duration-300">
                      {artikel?.unternehmen}
                    </span>

                    <svg
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:stroke-[#d1b250]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>

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
      {locale === "fr" && data.artikel_table_fr?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
          {data.artikel_table.map((artikel, index) => (
            <FadeInView
              key={artikel?.name}
              as="div"
              direction="bottom"
              duration={600}
              distance={40}
              delay={index * 150}
              className="group relative transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image */}
              {artikel?.bild_anhagen && (
                <div className="rounded-xl overflow-hidden shadow-md relative min-h-[300px]">
                  <Image
                    src={`/cms${artikel?.bild_anhagen}`}
                    alt={artikel?.artikel_name || "Article image"}
                    fill
                    sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 500px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}

              {/* Text */}
              <div className="pt-6 px-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#d1b250] transition-colors">
                  {artikel?.artikel_name}
                </h3>
                <p className={`text-sm text-gray-600 ${artikel?.beschreibung ? "mb-15" : ""}`}>
                  {artikel?.beschreibung?.split("\n")[0]}
                </p>

                {artikel?.unternehmen && (
                  <Link
                    href={`/ueber-uns/marken/${generateSlug(artikel?.unternehmen)}`}
                    locale={locale}
                    className="inline-flex items-center gap-2 text-[#30373e] font-medium relative group"
                  >
                    <span className="z-10 group-hover:text-[#d1b250] transition-colors duration-300">
                      {artikel?.unternehmen}
                    </span>

                    <svg
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:stroke-[#d1b250]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>

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

      {/* Weitere Neuigkeiten */}
      <div className="">
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
              key={index}
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
                  alt={item.title || "Related article"}
                  fill
                  sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 500px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="pt-6 px-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#d1b250] transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{item.description}</p>

                <Link
                  href={item.link}
                  prefetch={true}
                  locale={locale}
                  className="inline-flex items-center gap-2 text-[#30373e] font-medium relative group/button"
                >
                  <span className="z-10  hover:text-[#d1b250]">{t("learnMore")}</span>
                  <svg
                    className="w-4 h-4 transition-transform duration-300 group-hover/button:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="absolute left-0 bottom-0 h-[2px] bg-[#30373e] group-hover:bg-[#d1b250] transition-all duration-300 ease-in-out w-32 lg:w-[0px] group-hover:w-[150px]" />
                </Link>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
