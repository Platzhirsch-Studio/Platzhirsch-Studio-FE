"use client";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Clock } from "lucide-react";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { useTranslations } from "next-intl";
import { generateSlug } from "@/lib/slugify";
import FadeInView from "@/components/Reusable/FadeInView";

const BlogSection = ({ data }) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("BlogSection");


  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("de-DE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (!data || data.length === 0) {
    return (
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-lg mb-8 text-[#d1b250] text-center uppercase">
            {t("heading")}
          </h2>
          <p className="text-3xl md:text-4xl mb-8 max-w-2xl font-bold text-center text-[#30373e]">
            {t("empty")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto lg:mb-16  mb-10 mt-10 lg:mt-16 ">
      <FadeInView
        as="div"
        direction="bottom"
        duration={800}
        distance={30}
        className="text-center flex flex-col items-center"
      >
        <h2 className="text-lg mb-4 text-[#d1b250] text-center uppercase">
          {t("heading")}
        </h2>
        <p className="text-2xl md:text-3xl lg:text-4xl mb-10 lg:mb-16 max-w-2xl font-bold text-center text-[#30373e]">
          {t("latest")}
        </p>
      </FadeInView>

      <div className="hidden lg:flex flex-row gap-8">
        {data[0] && (
          <FadeInView
            as="div"
            direction="left"
            duration={800}
            distance={30}
            className="w-1/2"
          >
            <BlogCard post={data[0]} formatDate={formatDate} locale={locale} />
          </FadeInView>
        )}
        <div className="w-1/2 flex flex-col gap-8">
          {data.slice(1).map((post, index) => (
            <FadeInView
              key={index}
              as="div"
              direction="right"
              duration={800}
              distance={30}
              delay={index * 100}
            >
              <BlogCard
                post={post}
                isCompact
                formatDate={formatDate}
                locale={locale}
              />
            </FadeInView>
          ))}
        </div>
      </div>

      <div className="hidden md:grid lg:hidden grid-cols-2 gap-8">
        {data.map((post, index) => (
          <FadeInView
            key={index}
            as="div"
            direction="bottom"
            duration={800}
            distance={30}
            delay={index * 100}
          >
            <BlogCard
              post={post}
              isCompact
              formatDate={formatDate}
              locale={locale}
            />
          </FadeInView>
        ))}
      </div>

      <div className="flex flex-col md:hidden gap-8">
        {data.map((post, index) => (
          <FadeInView
            key={index}
            as="div"
            direction="bottom"
            duration={800}
            distance={30}
            delay={index * 100}
          >
            <BlogCard
              post={post}
              isCompact
              formatDate={formatDate}
              locale={locale}
            />
          </FadeInView>
        ))}
      </div>
    </section>
  );
};

const BlogCard = ({ post, isCompact = false, formatDate, locale }) => {
  const t = useTranslations("BlogSection");
  const slug = generateSlug(post.name1);

  return (
    <article
      className={`h-full overflow-hidden transition-shadow duration-300 ${isCompact ? "flex gap-6 flex-col md:flex-row" : ""
        }`}
    >
      <div
        className={`relative ${isCompact ? "w-full md:w-1/3 h-70 md:h-auto" : "w-full h-64 md:h-80"
          }`}
      >
        <Image
          src={post?.bild_anhagen ? `/cms${post?.bild_anhagen}` : `/cms${post?.artikel_table?.[0].bild_anhagen}`}
          alt={post.name1}
          fill
          className="object-cover"
          sizes={
            isCompact
              ? "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 16vw"
              : "(max-width: 1024px) 100vw, 50vw"
          }
        />
      </div>

      <div className={`md:pt-6 lg:pb-6 flex flex-col ${isCompact ? "w-2/3" : ""}`}>
        {/* <div className="flex gap-2 items-center text-sm text-[#30373e]/70 mb-2">
          <Clock className="text-[#d1b250] text-xl" />
          <span>{formatDate(post.daten)}</span>
        </div> */}
        <Link href={`/news/${slug}`}
          locale={locale}
          prefetch={true}
          className={`${isCompact ? "text-lg" : "text-xl md:text-2xl"
            } font-bold text-[#30373e] mb-3`}
        >
          {/* {post.name1} */}

          {locale === "en"
            ? post?.name_en
            : locale === "it"
              ? post?.name_it
              : locale === "fr"
                ? post?.name_fr
                : post?.name1}
        </Link>
        <p className="text-[#30373e]/80 mb-4 grow line-clamp-2 md:line-clamp-3">
          {locale === "it"
            ? post.beschreibung_it
            : locale === "en"
              ? post.beschreibung_en
              : locale === "fr"
                ? post.beschreibung_fr
                : post.beschreibung}
        </p>

        {/* <Link
          href={`/news/${slug}`}
          locale={locale}
          prefetch={true}
          aria-label={`${t("readMore")} ${locale === "en"
            ? post?.name_en
            : locale === "it"
              ? post?.name_it
              : locale === "fr"
                ? post?.name_fr
                : post?.name1}`}
          className="inline-flex items-center gap-2 text-[#30373e] font-medium relative group hover:text-[#d1b250] transition-colors duration-300"
        >

          {t("readMore")}

          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#d1b250]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
          <span className="absolute left-0 bottom-0 h-[2px] bg-[#30373e] group-hover:bg-[#d1b250] transition-all duration-300 ease-in-out w-32 lg:w-[0px] group-hover:w-[150px]" />
        </Link> */}
      </div>
    </article>
  );
};

export default BlogSection;
