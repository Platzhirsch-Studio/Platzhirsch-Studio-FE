"use client";
import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import FadeInView from "@/components/Reusable/FadeInView";

const MarkenItemBanner = ({ info }) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  return (
    <div className="relative w-full h-[450px] lg:h-[800px]">
      {/* Background image */}
      <Image
        src={info.image}
        alt={info.title || "Brand banner"}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />

      {/* Semi-transparent veil */}
      <div className="absolute inset-0 bg-black/70 z-0" />

      {/* Content on top */}
      <div className="absolute inset-0 flex flex-col items-center justify-center lg:pt-23 pt-23 z-10 p-10 lg:p-0">
        {/* Animated Title */}
        <FadeInView
          as="h1"
          direction="bottom"
          duration={600}
          distance={30}
          className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-normal text-white text-center max-w-5xl"
        >
          {info.title}
        </FadeInView>

        {/* Breadcrumb navigation */}
        <div
          aria-label="breadcrumb"
          className="flex flex-wrap md:flex-nowrap justify-center items-center text-white gap-1 text-[13px] sm:text-sm font-medium uppercase mb-4 md:mb-6 px-2 sm:px-4 text-center overflow-x-auto scrollbar-hide max-w-full"
        >
          {Array.isArray(info.links) &&
            info.links.map((link, index) => (
              <React.Fragment key={index}>
                {link.link ?
                  <Link
                    href={link.link}
                    locale={locale}
                    className="hover:underline whitespace-nowrap duration-300"
                  >
                    {link.linkName}
                  </Link> :
                  <p
                    className=""
                  >
                    {link.linkName}
                  </p>
                }
                
                {index < info.links.length - 1 && <span className="mx-1 text-gray-300">/</span>}
              </React.Fragment>
              // <span key={index} className="flex items-center gap-2">
              //   {link.link
              //     ?
              //     <Link href={link.link} locale={locale}>
              //       <p className="hover:underline cursor-pointer">{link.linkName}</p>
              //     </Link>
              //     :
              //     <p className="hover:underline cursor-pointer">{link.linkName}</p>
              //   }

              //   {index < links.length - 1 && <span>/</span>}
              // </span>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MarkenItemBanner;
