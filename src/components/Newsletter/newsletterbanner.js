'use client'
import React from 'react'
import Image from 'next/image'
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { useTranslations } from "next-intl";
import bgImage from "../../../public/Images/Newsletter/minotti-patio.jpg";

const NewsletterBanner = () => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("newsletter-banner");

  return (
    <div>
      <div className="relative w-full h-150 pt-25">
        <Image
          src={bgImage}
          alt={t("bannerTitle")}
          fill
          style={{ objectFit: "cover", objectPosition: "center" }}
          placeholder="blur"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black opacity-30 z-10" />
        <div className="relative z-20 flex flex-col items-center justify-center h-full">
          <h1 className="font-bold text-2xl mb-5 md:text-3xl lg:text-5xl tracking-normal text-white text-center">
            {t("bannerTitle")}
          </h1>
          <div className="flex items-center justify-center text-white gap-2 mb-8">
            <div>
              <Link href="/" locale={locale}>
                <p className="text-sm font-normal">{t("breadcrumbHome")}</p>
              </Link>
            </div>
            <div>
              <p>/</p>
            </div>
            <div>
              <p className="text-sm font-normal">{t("breadcrumbNewsletter")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewsletterBanner
