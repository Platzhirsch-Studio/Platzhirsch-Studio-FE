"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import bgImage from "../../../public/Images/NotFound/minotti-sofas.webp";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/utils/routing";

// The 404 page body, shared by src/app/[locale]/not-found.js (unknown paths
// under a locale) and src/app/not-found.js (everything else, e.g. /wp-login.php),
// so both look identical and speak the visitor's language.
export default function NotFoundContent({ locale }) {
  const t = useTranslations("error404");

  return (
    <div className="relative w-full h-screen flex items-center justify-center">
      <Image
        src={bgImage}
        alt="404 Background"
        fill
        style={{ objectFit: "cover", objectPosition: "center" }}
        placeholder="blur"
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black opacity-30 z-10" />
      <div className="relative z-10 py-16 px-6 text-center max-w-3xl mx-auto">
        <p className="text-7xl md:text-8xl font-bold mb-6 text-[#d1b250]" aria-hidden="true">{t("title")}</p>
        {/* The headline is the H1 ("404" alone says nothing to search engines or
            screen readers). */}
        <h1 className="mb-8 font-bold text-3xl md:text-5xl leading-tight tracking-normal text-white">
          {t("headline")}
        </h1>
        <p className="mb-12 text-white">{t("description")}</p>
        {/* Straight to this locale's homepage; a bare "/" would always land on German. */}
        <Link
          href={`/${locale}`}
          className="mx-auto font-bold inline-flex items-center gap-2 justify-center text-sm bg-white text-[#30373e] cursor-pointer px-8 py-3 rounded-full hover:bg-[#d1b250] transition delay-150 hover:text-white"
        >
          {t("backHome")} <ArrowRight aria-hidden="true" />
        </Link>
        {/* Dead ends lose visitors (and crawl equity): offer the main sections. */}
        <nav aria-label={t("headline")} className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium uppercase tracking-wide">
          <Link href={`/${locale}${ROUTES.produkte[locale] || ROUTES.produkte.de}`} className="text-white/90 underline decoration-[#d1b250] underline-offset-4 hover:text-[#d1b250]">
            {t("browseProducts")}
          </Link>
          <Link href={`/${locale}${ROUTES.marken[locale] || ROUTES.marken.de}`} className="text-white/90 underline decoration-[#d1b250] underline-offset-4 hover:text-[#d1b250]">
            {t("browseBrands")}
          </Link>
          <Link href={`/${locale}${ROUTES.kontakt[locale] || ROUTES.kontakt.de}`} className="text-white/90 underline decoration-[#d1b250] underline-offset-4 hover:text-[#d1b250]">
            {t("contact")}
          </Link>
        </nav>
      </div>
    </div>
  );
}
