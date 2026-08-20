import React from "react";
import Image from "next/image";
import presseImage from "../../../public/Images/Presse/black-chair-and-desk.jpg";
import { useTranslations } from "next-intl";
import FadeInView from "@/components/Reusable/FadeInView";

const Presse = () => {
  const t = useTranslations('Press');

  return (
    <div>
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 w-full px-6 mt-10 lg:mt-16 mb-10 lg:mb-16 max-w-7xl mx-auto">
        {/* Text section with animation */}
        <FadeInView
          as="div"
          direction="bottom"
          duration={500}
          distance={30}
          className="w-full lg:w-1/2 order-2"
        >
          <p className="text-[#d1b250] uppercase tracking-widest font-semibold mb-4">
            {t('header')}
          </p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#303030] leading-tight mb-6">
            {t('title')}
          </h2>
          <p className="text-[#30373e]/80 leading-relaxed space-y-3">
            {t('description')}
          </p>
        </FadeInView>

        {/* Image section with animation and hover effect */}
        <FadeInView
          as="div"
          direction="bottom"
          duration={500}
          distance={30}
          className="relative w-full h-[250px] sm:h-[350px] lg:h-[700px] lg:w-[500px] overflow-hidden group"
        >
          <Image
            src={presseImage}
            alt={t('imageAlt')}
            fill
            sizes="(max-width: 768px) 90vw, 500px"
            className="rounded-md transition-transform duration-500 group-hover:brightness-80 object-cover object-right"
          />
        </FadeInView>
      </div>
    </div>
  );
};

export default Presse;