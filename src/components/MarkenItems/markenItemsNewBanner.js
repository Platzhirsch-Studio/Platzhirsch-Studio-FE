
"use client";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function BrandPage({ marke }) {

    const t = useTranslations("marken");

    return (
    <div className="text-[#30373e]">
      {/* ---------------------------------------------------------- */}
      {/* HERO                                                        */}
      {/* ---------------------------------------------------------- */}
      <header className="relative h-150 lg:h-200 flex items-end">
        <Image
          src={`/cms${marke.bild_anhagen[0].bild_anhagen}`}
          alt={marke.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 from-0% via-black/30 via-50% to-black/20 to-100%" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-16 lg:pb-20 text-white">
          <div className="max-w-[950px]">
                <h1 className="text-[2.5rem] md:text-[3.5rem] lg:text-[4.5rem] tracking-[2px] uppercase mb-5 font-light leading-[1.05]">
              {marke.name1}
            </h1>

            <p className="max-w-[750px] text-[1.05rem] md:text-[1.25rem] font-light text-[#dcdcdc] mb-[30px]">
              {marke.produkte}
            </p>
          </div>

          <div className="flex flex-wrap gap-5 items-center">
            <Link
              href="#produkte"
              className="bg-white text-[#1c1c1c] px-7 py-[14px] uppercase tracking-[2px] text-[0.8rem] font-semibold rounded-[2px] transition-all duration-[400ms] hover:bg-[#b39258] hover:text-white"
            >
             {t("collection_discover")}
            </Link>
            <a
              href={marke.firmenlink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white text-[0.85rem] uppercase tracking-[2px] border-b border-white/50 pb-[3px] transition-all duration-[400ms] hover:border-[#b39258] hover:text-[#b39258]"
            >
               {t("officialWebsite")} &rarr;
            </a>
          </div>
        </div>
      </header>
    </div>
  );
}
