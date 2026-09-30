"use client"
import React from "react";
import Image from "next/image";
import uberimg from "../../../public/Images/UberUns/tomdixon.webp";
import { useTranslations } from "next-intl";


const UberUns = () => {
  const t = useTranslations("about");

  return (
    <>
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 w-full px-4 py-16 max-w-7xl mx-auto">
        {/* Image section */}
        <div className="relative w-full h-[250px] sm:h-[350px] lg:h-[700px] lg:w-[500px]">
          <Image
            src={uberimg}
            alt={t("first_section.subtitle")}
            fill
            className="object-cover "
            placeholder="blur"
            priority
            sizes="(max-width: 768px) 90vw, 500px"
          />
        </div>

        {/* Text section */}
        <div className="w-full lg:w-1/2">
          <p className="text-[#30373e] uppercase tracking-widest font-semibold mb-4">
            {t("first_section.title")}
          </p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#303030] leading-tight mb-6">
            {t("first_section.subtitle")}
          </h2>

          <p className="text-gray-600">
            {t("first_section.text")}
          </p>
        </div>
      </div>
    </>
  );
};

export default UberUns;
