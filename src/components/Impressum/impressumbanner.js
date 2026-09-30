"use client";
import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import bgImage from "../../../public/Images/Newsletter/room.jpg";

const ImpressumBanner = () => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  return (
    <div>
      <div className="relative w-full h-150 pt-25">
        {/* Background image */}
        <Image
          src={bgImage}
          alt="Impressum Banner"
          fill
          className="object-cover"
          sizes="100vw"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black opacity-30 z-10" />

        {/* Content */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full">
          <h1 className="font-bold mb-5 text-4xl md:text-5xl tracking-normal text-white text-center">Impressum</h1>
          <div className="flex items-center justify-center text-white gap-2 mb-8">
            <div>
              <Link href="/" locale={locale}>
                <p className="text-sm font-normal">HOME</p>
              </Link>
            </div>
            <div>
              <p>/</p>
            </div>
            <div>
              <p className="text-sm font-normal">IMPRESSUM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpressumBanner;
