"use client";
import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import bgImage from "../../../public/Images/Newsletter/indoor-dinner-space.jpg";

const Datenbanner = () => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  return (
    <div>
      <div className="relative w-full h-150 pt-25">
        <Image
          src={bgImage}
          alt="Newsletter"
          fill
          style={{ objectFit: "cover", objectPosition: "center" }}
          placeholder="blur"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black opacity-30 z-10" />

        <div className="relative z-20 flex flex-col items-center justify-center h-full">
          <h1 className="font-bold text-2xl lg:text-5xl mb-5 md:text-3xl tracking-normal text-white text-center">
            Datenschutz
          </h1>
          <div className="flex items-center justify-center text-white gap-2 mb-8">
            <div>
              <Link href="/" prefetch={true} locale={locale}>
                <p className="text-sm font-normal">HOME</p>
              </Link>
            </div>
            <div>
              <p>/</p>
            </div>
            <div>
              <Link href="/datenschutz" locale={locale}>
                <p className="text-sm font-normal">DATENSCHUTZ</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Datenbanner;
