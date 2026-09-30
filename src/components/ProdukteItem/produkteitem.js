"use client";
import { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";;
import { useTranslations } from "next-intl";
import FadeInView from "@/components/Reusable/FadeInView";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Calendar,
  CircleUser,
} from "lucide-react";

const NextArrow = ({ onClick }) => (
  <div
    className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 cursor-pointer bg-black/40 hover:bg-black/60 p-3 rounded-full shadow-lg transition-all"
    onClick={onClick}
  >
    <ChevronRight className="text-white text-2xl" />
  </div>
);

const PrevArrow = ({ onClick }) => (
  <div
    className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 cursor-pointer bg-black/40 hover:bg-black/60 p-3 rounded-full shadow-lg transition-all"
    onClick={onClick}
  >
    <ChevronLeft className="text-white text-2xl" />
  </div>
);

export default function BrandPage({ marke }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const t = useTranslations("brand");

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    beforeChange: (_, next) => setCurrentSlide(next),
  };
  const settingsInfoBoxes = {
    dots: false,
    infinite: true,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  };

  return (
    <div className="text-gray-800 my-10 lg:my-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* HEADER */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-bold text-[#30373e]">
            {marke.name}
          </h1>
          <FadeInView
            as="div"
            direction="none"
            duration={700}
            className="h-[3px] bg-[var(--accent)] mt-3 mx-auto origin-left w-[220px]"
          />
        </div>

        <div>
          {marke.beschreibung && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#30373e] mb-4">
                {t("about", { brand: marke.name })}
              </h2>
              <p className="text-gray-600 pl-2 leading-relaxed">
                {marke.beschreibung}
              </p>
            </div>
          )}
        </div>

        {/* TEXT + IMAGE SPLIT */}
        <div className="grid md:grid-cols-2 grid-cols-1 gap-12 ">
          <div>
            {/* PRODUKTE */}
            {marke.produkte && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-[#30373e] mb-4">
                  {t("products")}
                </h2>
                <p className="text-gray-600 pl-2 leading-relaxed">
                  {marke.produkte}
                </p>
              </div>
            )}

            {/* ÜBER SOLPURI */}
            {(marke.grundungsjahr || marke.herkunftsland || marke.grunder) && (
              <div className="mt-8">
                <Slider {...settingsInfoBoxes}>
                  {marke.grundungsjahr && (
                    <div className="px-2">
                      <div className=" p-6 rounded-2xl border border-gray-400 text-center h-[200px] flex flex-col justify-center items-center">
                        <Calendar className="text-[#d1b250] text-4xl mb-3" />
                        <p className="text-gray-500 text-lg uppercase mb-1">
                          {t("foundingYear")}
                        </p>
                        <p className="text-xl font-bold break-words">
                          {marke.grundungsjahr}
                        </p>
                      </div>
                    </div>
                  )}
                  {marke.herkunftsland && (
                    <div className="px-2">
                      <div className=" p-6 rounded-2xl  border border-gray-400 text-center h-[200px] flex flex-col justify-center items-center">
                        <Flag className="text-[#d1b250] text-4xl mb-3" />
                        <p className="text-gray-500 text-lg uppercase mb-1">
                          {t("originCountry")}
                        </p>
                        <p className="text-xl font-bold break-words">
                          {marke.herkunftsland}
                        </p>
                      </div>
                    </div>
                  )}
                  {marke.grunder && (
                    <div className="px-2">
                      <div className="p-6 rounded-2xl  border border-gray-400 text-center h-[200px] flex flex-col justify-center items-center">
                        <CircleUser className="text-[#d1b250] text-4xl mb-3" />
                        <p className="text-gray-500 text-lg uppercase mb-1">
                          {t("founder")}
                        </p>
                        <p className="text-xl font-bold break-words">
                          {marke.grunder}
                        </p>
                      </div>
                    </div>
                  )}
                </Slider>
              </div>
            )}
            {marke.firmenlink && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold text-[#30373e] mb-4">
                  {t("officialWebsite")}
                </h2>
                <a
                  href={marke.firmenlink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="button-custom5">
                    <button>
                      <span></span>
                      <p data-title={t("visitWebsite")}>
                        <svg
                          className="ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </p>
                    </button>
                  </div>
                  <style jsx>{`
                    .button-custom5{
                     display: flex;

  button {
    width: 60%;
    padding: 10px;
    height: 45px;
    background-color: transparent;
    color: #30373e;
    position: relative;
    overflow: hidden;
    font-size: 13px;
    letter-spacing: 1px;
    font-weight: 500;
    text-transform: uppercase;
    transition: all 0.5s ease;
    cursor: pointer;
    border: 2px solid #d1b250;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;

    @media (max-width: 640px) {
      width: auto;
      height: 40px;
      font-size: 12px;
    }

    &::before,
    &::after {
      content: "";
      position: absolute;
      width: 0;
      height: 2px;
      background-color: rgb(92, 92, 92);
      transition: all 0.5s cubic-bezier(0.35, 0.1, 0.25, 1);
    }

    &::before {
      right: 0;
      top: 0;
    }

    &::after {
      left: 0;
      bottom: 0;
    }

    &:hover::before,
    &:hover::after {
      width: 100%;
    }

    span {
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 1;

      &::before,
      &::after {
        content: "";
        position: absolute;
        width: 2px;
        height: 0;
        background-color: rgb(92, 92, 92);
        transition: all 0.5s cubic-bezier(0.35, 0.1, 0.25, 1);
      }

      &::before {
        right: 0;
        top: 0;
      }

      &::after {
        left: 0;
        bottom: 0;
      }
    }

    &:hover span::before,
    &:hover span::after {
      height: 100%;
    }

    p {
      padding: 0;
      margin: 0;
      position: relative;
      z-index: 2;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: color 0.3s ease;

      &::before {
        content: attr(data-title);
      }

      &::after {
        display: none;
      }

      svg {
        width: 16px;
        height: 16px;
        transition: transform 0.3s ease;
      }
    }

    &:hover p svg {
      transform: translateX(4px);
    }
  }
    }
                  `} </style>
                </a>
              </div>
            )}
          </div>

          {/* SLIDER OR IMAGE */}
          <div>
            {marke.bild_anhagen &&
              marke.bild_anhagen.length > 0 &&
              (marke.bild_anhagen.length === 1 ? (
                <div className="relative w-full h-[550px] rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src={`/cms${marke.bild_anhagen[0].bild_anhagen}`}
                    alt="Markenbild"
                    fill
                    priority
                    className="object-cover object-center  rounded-xl"
                    sizes="(max-width: 768px) 90vw, 50vw"
                  />
                </div>
              ) : (
                <Slider {...settings}>
                  {marke.bild_anhagen.map((image, index) => (
                    <div key={index} className="w-full h-[550px] relative">
                      <div
                        className="w-full h-full bg-cover bg-center rounded-xl"
                        style={{
                          backgroundImage: `url('/cms/${image.bild_anhagen}')`,
                        }}
                      ></div>
                    </div>
                  ))}
                </Slider>
              ))}
          </div>
        </div>
      </div>


    </div>
  );
}
