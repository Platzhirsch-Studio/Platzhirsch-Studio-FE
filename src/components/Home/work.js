"use client";
import Image from "next/image";
import image1 from "../../../public/Images/Home/download.jpg";
import image2 from "../../../public/Images/Home/grey-and-brown-combo-style-room-1.jpg";
import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

const Work = () => {
  const [activeBg, setActiveBg] = useState(0);
  const [hoveredItem, setHoveredItem] = useState < number | null > (null);
  const t = useTranslations("work");

  const items = [
    {
      title: t("work.steps.0.title"),
      description: t("work.steps.0.description"),
      bgImage: image1,
    },
    {
      title: t("work.steps.1.title"),
      description: t("work.steps.1.description"),
      bgImage: image2,
    },
    {
      title: t("work.steps.2.title"),
      description: t("work.steps.2.description"),
      bgImage: image1,
    },
  ];

  return (
    <div className="py-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full p-4 rounded-lg flex flex-col justify-center items-center">
          <h2 className="text-lg mb-3 text-amber-400 text-center uppercase">{t("headerTag")}</h2>
          <h4 className="text-3xl md:text-5xl font-bold text-black text-center mt-10 mb-10">
           {t("headerTitle")}
          </h4>
          <p className="text-center text-md lg:max-w-[200px] md:max-w-none mb-10">
           {t("headerSubtitle")}
          </p>
        </div>
      </div>
      <div className="relative h-[90vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          {items.map((item, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-500 ${activeBg === index ? "opacity-100" : "opacity-0"
                }`}
            >
              <Image
                src={item.bgImage}
                alt={item.title}
                fill
                className="object-cover"
                priority={index === 0}
                placeholder="blur"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/30"></div>
            </div>
          ))}
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 h-full w-full flex items-end justify-center pb-10">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <div className="flex flex-col md:flex-col lg:flex-row gap-4 md:gap-8 items-start w-full">
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-start p-6 md:p-8 text-white transition-all duration-300 cursor-pointer relative
                    ${index !== items.length - 1 ? "border-b border-white/50 lg:border-r lg:border-b-0" : ""}
                    ${hoveredItem === index ? "z-20" : "z-10"}
                  `}
                  onMouseEnter={() => {
                    setActiveBg(index);
                    setHoveredItem(index);
                  }}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => setActiveBg(index)}
                >
                  {/* Title & Description */}
                  <div className="w-full">
                    <h3 className="text-xl md:text-3xl font-bold mb-2 transition-transform duration-300">
                      {item.title}
                    </h3>
                    <div className={`overflow-hidden transition-all duration-300 ${hoveredItem === index ? "h-[3.5rem]" : "h-0"}`}>
                      <p
                        className={`text-base md:text-md transition-all duration-500 ${hoveredItem === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                          }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <button className="mt-4 transition-colors rounded flex items-center gap-2 hover:text-amber-400">
                    {t("learnMore")} <ArrowRight />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Work;
