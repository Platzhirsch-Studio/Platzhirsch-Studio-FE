"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import bgImage from "../../../public/Images/NotFound/minotti-sofas.webp";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("error404");

  return (
    <div className="relative w-full h-screen flex items-center justify-center">
      <Image
        src={bgImage}
        alt="404 Background"
        fill
        style={{ objectFit: "cover", objectPosition: "center" }}
        placeholder="blur"
        priority
        sizes="100vw"

      />
      <div className="absolute inset-0 bg-black opacity-30 z-10" />
      <div className="relative z-10 py-16 px-6 text-center max-w-3xl mx-auto">
        <h1 className="text-8xl font-bold mb-8 text-[#d1b250]">{t("title")}</h1>
        <p className="mb-12 font-bold text-4xl md:text-5xl leading-tight tracking-normal text-white">
          {t("headline")}
        </p>
        <p className="mb-12 text-white">
          {t("description")}
        </p>
        <Link href={`/`} prefetch={true}>
          <button className="mx-auto font-bold inline-flex items-center gap-2 justify-center text-sm bg-white text-[#30373e] cursor-pointer px-8 py-3 rounded-full hover:bg-[#d1b250] transition delay-150 hover:text-white">
            {t("backHome")} <ArrowRight />
          </button>
        </Link>
      </div>
    </div>
  );
}
