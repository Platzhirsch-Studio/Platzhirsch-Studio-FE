"use client";
import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import FadeInView from "@/components/Reusable/FadeInView";

const SinglePageBanner = ({ info }) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  return (
    <div className="relative w-full h-150 lg:h-200">
      {/* Background image */}
      <Image
        src={info.image}
        // Pages can pass their own `info.alt`; otherwise describe it by the page title.
        alt={info.alt || `${info.title} – Platzhirsch Home Living`}
        fill
        style={{ objectFit: "cover", objectPosition: "center" }}
        priority
        sizes="100vw"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black opacity-30" />

      {/* Content */}
      <div className="relative  z-20 flex flex-col pt-23 items-center justify-center h-full">
        {/* Title */}
        <FadeInView
          as="h1"
          direction="bottom"
          duration={600}
          distance={20}
          className="font-bold mb-5 text-2xl md:text-4xl lg:text-5xl tracking-normal text-white text-center"
        >
          {info.title}
        </FadeInView>

        {/* Breadcrumbs */}
        <FadeInView
          as="div"
          direction="bottom"
          duration={600}
          distance={10}
          delay={300}
          className="flex items-center justify-center text-white gap-2 mb-4 md:mb-6"
        >
          {info.links.map((link, index) => (
            <React.Fragment key={index}>
              {link?.link ? (
                <Link href={link.link} locale={locale}>
                  <p className="text-sm font-normal uppercase hover:underline transition">
                    {link.linkName}
                  </p>
                </Link>
              ) : (
                <p className="text-sm font-normal uppercase ">
                  {link.linkName}
                </p>
              )}
              {index < info.links.length - 1 && <span className="mx-1">/</span>}
            </React.Fragment>
          ))}
        </FadeInView>
      </div>
    </div>
  );
};

export default SinglePageBanner;
