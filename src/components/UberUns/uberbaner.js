"use client"
import React from 'react'
import Image from "next/image"
import bgImage from "../../../public/Images/UberUns/white-sofas.jpg";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { useTranslations } from "next-intl";

const UberBanner = () => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("uberuns");

  return (
    <div>
      <div className="relative w-full h-150 pt-25">
        {/* Background image */}
        <Image
          src={bgImage}
          alt={t("headline")}
          fill
          style={{ objectFit: "cover", objectPosition: "center" }}
          placeholder="blur"
          priority
          sizes="100vw"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black opacity-30 z-10" />

        <div className="relative z-20 flex flex-col items-center justify-center h-full">
          <div className="flex items-center justify-center text-white gap-2 mb-8">
            <div>
              <Link href="/" locale={locale}>
                <p className="text-sm font-normal">{t("breadcrumbHome")}</p>
              </Link>
            </div>
            <div><p>/</p></div>
            <div>
              <p className="text-sm font-normal">{t("breadcrumbUberUns")}</p>
            </div>
          </div>
          <p className="font-bold text-4xl md:text-5xl tracking-normal text-white text-center">
            {t("headline")}
          </p>
        </div>
      </div>
    </div>
  )
}

export default UberBanner
