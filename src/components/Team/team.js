"use client";
import React from "react";
import Image from "next/image";
import teamImage from "../../../public/Images/Team/dark-table.jpg";
import { useTranslations } from "next-intl";
import FadeInView from "@/components/Reusable/FadeInView";

const Team = () => {
  const t = useTranslations("TeamSection")
  return (
    <div>
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 w-full px-4 mt-10 lg:mt-16  max-w-7xl mx-auto">
        <div
          className="relative w-full h-[250px] sm:h-[350px] lg:h-[700px] lg:w-[500px] order-2 lg:order-1"
        >
          <Image
            src={teamImage}
            alt="Creative Kitchen"
            fill
            className="object-cover rounded-md"
            sizes="(max-width: 768px) 90vw, 500px"
            priority
          />
        </div>
        <FadeInView
          as="div"
          direction="bottom"
          duration={700}
          distance={30}
          delay={100}
          className="w-full lg:w-1/2 order-1"
        >
          <p className="text-[#d1b250] uppercase tracking-widest font-semibold mb-4">
            {t("pretitle")}
          </p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#303030] leading-tight mb-4">
            {t("title")}
          </h2>
           {t.raw("paragraphs").map((paragraph, idx) => (
            <p key={idx} className="max-w-2xl mx-auto text-[#30373e] text-md mt-4">
              {paragraph}
            </p>
          ))}
        </FadeInView>
      </div>
    </div>
  );
};

export default Team;
