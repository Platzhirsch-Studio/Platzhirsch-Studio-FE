'use client'
import ConsentEmbed from "@/components/Cookies/ConsentEmbed";
import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import bgImage from "../../../public/Images/UberUns/Rimadesio-Modulor.jpg";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/utils/routing";

const Ausstellung = () => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("about");

  const imageSlides = [
    "/Images/UberUns/living.jpg",
    "/Images/UberUns/livingroom-view.jpg",
    "/Images/UberUns/gold-vase.jpg",
    "/Images/UberUns/grey-vase.jpg",

  ];

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    fade: true,

  };


  return (

    <>
      <div className="max-w-7xl mx-auto overflow-hidden mt-20 mb-20 px-4">
        <Slider
          dots={true}
          infinite={true}
          speed={500}
          slidesToShow={3}
          slidesToScroll={1}
          autoplay={true}
          autoplaySpeed={3000}
          responsive={[
            {
              breakpoint: 1024,
              settings: { slidesToShow: 2 },
            },
            {
              breakpoint: 768,
              settings: { slidesToShow: 1 },
            },
          ]}
        >
          {[
            "/Images/Home/tuuci.png",
            "/Images/Home/umbrosa.png",
            "/Images/Home/coppenhagen.png",
            "/Images/Home/treca.png",
            "/Images/Home/trapa.png",
          ].map((src, index) => (
            <div key={index} className="px-2">
              <div className="relative h-[40px] w-full">
                <Image
                  src={src.trim()}
                  alt={`Slide ${index + 1}`}
                  fill
                  className="object-contain rounded-lg"
                  sizes="120px"
                />
              </div>
            </div>
          ))}
        </Slider>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left Content */}
        <div className="w-full lg:w-1/2">
          <p className="text-[#d1b250] uppercase tracking-widest font-semibold mb-4">
            {t("ausstellung.showroom")}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-[#303030] leading-tight mb-6">
            {t("ausstellung.headline")}
          </h2>
          <p className="text-gray-600">
            {t("ausstellung.desc")}
          </p>
        </div>

        <div className="w-full lg:w-1/2">
          <Slider {...sliderSettings}>
            {imageSlides.map((src, index) => (
              <div key={index} className="relative h-[500px] w-full">
                <Image
                  src={src.trim()}
                  alt={`Slide ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 90vw, (max-width: 1024px) 80vw, 1000px"
                />
              </div>
            ))}
          </Slider>
        </div>
      </div>
      <div className="relative w-full  ">
        <Image
          src={bgImage}
          alt="Über Uns"
          fill
          style={{ objectFit: "cover", objectPosition: "center" }}
          placeholder="blur"
          priority
          sizes="100vw"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black opacity-30 z-10" />

        <div className="relative z-20 flex flex-col items-center justify-center h-full max-w-7xl mx-auto px-4 py-32 space-y-6">

          <h2 className="text-base mb-8 text-[#d1b250] tracking-[0.7] font-semibold">{t("ausstellung.career")}</h2>

          <p className="font-bold text-4xl md:text-5xl tracking-normal text-white text-center mb-8">
            {t("ausstellung.careerTitle")}
          </p>
          <Link href={`${ROUTES.team[locale]}`} locale={locale}>
            <button className="mx-auto inline-flex items-center gap-2 justify-center text-sm bg-[#d1b250] text-white font-bold cursor-pointer px-8 py-3 rounded-full hover:bg-[#c88f3f] transition delay-150 hover:text-white">
              {t("ausstellung.more")} <ArrowRight />
            </button>
          </Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-6">
        <p className="text-[#d1b250] text-center uppercase tracking-widest font-semibold mb-4">
          {t("ausstellung.studio")}
        </p>
        <h2 className="text-3xl font-bold text-[#303030] text-center">{t("ausstellung.tourTitle")}</h2>
        <p className="text-gray-700 text-center">
          {t("ausstellung.tourDesc1")}
        </p>
        <p className="text-gray-700 text-center">
          {t("ausstellung.tourDesc2")}
        </p>
        <div className="aspect-video w-full h-150">
          {/* Street View loads only after the Google Maps opt-in. */}
          <ConsentEmbed service="googleMaps">
            <iframe
              title="Google Street View – Showroom Platzhirsch Home Living, Lochau"
              src="https://www.google.com/maps/embed?pb=!4v1735203151096!6m8!1m7!1sCAoSLEFGMVFpcE9INDQ0M1hMX3BwU2dfbm5RTzlnb2hVR0hDTzBuU1k1cEdBV2JO!2m2!1d47.53018791759509!2d9.751478651722408!3f280!4f0!5f0.7820865974627469"
              allowFullScreen
              loading="lazy"
              className="w-full h-150 border-none"
            ></iframe>
          </ConsentEmbed>
        </div>
      </div>
    </>
  );
};

export default Ausstellung;
