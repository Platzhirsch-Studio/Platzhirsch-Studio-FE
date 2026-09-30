"use client";
import React from "react";
import Image from "next/image";
import teamImage from "../../../public/Images/Team/arbeiten.jpg";
import { useTranslations } from "next-intl";
import FadeInView from "@/components/Reusable/FadeInView";

const Team = () => {
  const t = useTranslations("KarriereTeam");

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:mt-16 mt-10 items-center justify-between gap-8 w-full px-4 max-w-7xl mx-auto">
        {/* Text section */}
        <div className="w-full lg:w-1/2">
          <FadeInView
            as="p"
            direction="bottom"
            duration={600}
            distance={20}
            delay={0}
            className="text-[#d1b250] uppercase tracking-widest font-semibold mb-4"
          >
            {t("section")}
          </FadeInView>
          
          <FadeInView
            as="h2"
            direction="bottom"
            duration={600}
            distance={20}
            delay={150}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#303030] leading-tight mb-6"
          >
            {t.raw("headline")}
          </FadeInView>
          
          {t.raw("paragraphs").map((text, i) => (
            <FadeInView
              key={i}
              as="p"
              direction="bottom"
              duration={600}
              distance={20}
              delay={300 + (i * 100)}
              className="text-[#30373e"
            >
              {text}
            </FadeInView>
          ))}
        </div>
        
        {/* Image section */}
        <FadeInView
          as="div"
          direction="bottom"
          duration={500}
          distance={30}
          delay={0}
          className="relative w-full h-[250px] sm:h-[350px] lg:h-[700px] lg:w-[500px]"
        >
          <Image
            src={teamImage}
            alt={t("imageAlt")}
            fill
            className="object-cover rounded-md"
            sizes="(max-width: 1024px) 100vw, 500px"
          />
        </FadeInView>
      </div>
    </div>
  );
};

export default Team;