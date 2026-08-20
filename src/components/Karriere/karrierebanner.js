import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import bgImage from "../../../public/Images/Team/dinner-table.jpg";
import { useTranslations } from "next-intl";

const KarriereBanner = () => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("KarriereBanner");

  return (
    <div className="relative w-full h-150 pt-25">
      {/* Background image */}
      <Image
        src={bgImage}
        alt={t("bgAlt")}
        fill
        style={{ objectFit: "cover", objectPosition: "center" }}
        placeholder="blur"
        priority
        sizes="100vw"
      />

      <div className="absolute inset-0 bg-black opacity-30 z-10" />

      <div className="relative z-20 flex flex-col items-center justify-center h-full">
        <div className="flex items-center justify-center text-white gap-2 mb-8">
          <Link href="/" locale={locale}>
            <p className="text-sm font-normal">{t("breadcrumb.home")}</p>
          </Link>
          <p>/</p>
          <Link href="#" locale={locale}>
            <p className="text-sm font-normal">{t("breadcrumb.karriere")}</p>
          </Link>
        </div>
        <p className="font-bold text-4xl md:text-5xl tracking-normal text-white text-center">
          {t("headline")}
        </p>
      </div>
    </div>
  );
};

export default KarriereBanner;
