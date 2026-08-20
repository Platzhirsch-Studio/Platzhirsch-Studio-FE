"use client";
import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import FadeInView from "@/components/Reusable/FadeInView";

const NewsItemBanner = ({ info }) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  return (
    <div className="relative w-full h-[450px] lg:h-[700px]">
      {/* Background image */}
      <Image
        src={info.image}
        alt={info.title || "News banner"}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/70 z-0" />
      <div className="absolute inset-0 flex flex-col items-center justify-center lg:pt-23 pt-23 z-10 p-10 lg:p-0">
        <FadeInView
          as="h1"
          direction="bottom"
          duration={600}
          distance={30}
          className="font-bold lg:text-4xl mb-5 md:text-3xl sm:text-2xl text-2xl tracking-normal text-white text-center max-w-5xl"
        >
          {info.title}
        </FadeInView>
        <nav
          aria-label="breadcrumb"
          className="flex flex-wrap md:flex-nowrap justify-center items-center text-white gap-1 text-[13px] sm:text-sm font-medium uppercase mb-4 md:mb-6 px-2 sm:px-4 text-center overflow-x-auto scrollbar-hide max-w-full"
        >
          {Array.isArray(info.links) &&
            info.links.map((link, index) => (
              <React.Fragment key={index}>
                <Link
                  href={link.link}
                  locale={locale}
                  className="hover:underline whitespace-nowrap hover:text-[#d1b250] transition-colors duration-300"
                >
                  {link.linkName}
                </Link>
                {index < info.links.length - 1 && (
                  <span className="mx-1 text-gray-300">/</span>
                )}
              </React.Fragment>
            ))}
        </nav>
      </div>
    </div>
  );
};

export default NewsItemBanner;
