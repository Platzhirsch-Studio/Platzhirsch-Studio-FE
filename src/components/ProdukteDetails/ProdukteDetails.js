"use client";
import React, { useState, useEffect, useRef } from "react";
import Slider from "react-slick";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/dist/photoswipe.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { useTranslations } from "next-intl";

function getBeschreibung(produkte, locale) {
  switch (locale) {
    case "en":
      return produkte.beschreibung_en || "No description available.";
    case "it":
      return produkte.beschreibung_it || "Nessuna descrizione disponibile.";
    case "fr":
      return produkte.beschreibung_fr || "Aucune description disponible.";
    case "de":
    default:
      return produkte.beschreibung || "Keine Beschreibung verfügbar.";
  }
}
const NextArrow = ({ onClick }) => (
  <div
    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 cursor-pointer bg-black/40 hover:bg-black/60 p-3 rounded-full shadow-lg"
    onClick={onClick}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </div>
);

const PrevArrow = ({ onClick }) => (
  <div
    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 cursor-pointer bg-black/40 hover:bg-black/60 p-3 rounded-full shadow-lg"
    onClick={onClick}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  </div>
);

function useInView() {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.00002 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
}

function ProdukteDetails({ produkte }) {
  const sortedImages = [...(produkte?.bild_anhangen || [])].sort(
    (a, b) => a.idx - b.idx
  );
  const pswpLightbox = useRef(null);
  const { addToCart, alert } = useCart();
  const { ref, isInView } = useInView();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("product");
  const [lastAddedItem, setLastAddedItem] = useState(null);

  useEffect(() => {
    if (sortedImages.length > 0 && !pswpLightbox.current) {
      const pswpItems = sortedImages.map((img) => ({
        src: `/cms${img.bild_anhangen}`,
        width: 1200,
        height: 900,
        alt: img.produkt_name || produkte.produkt_name,
        title: img.imageName,
      }));

      const lightbox = new PhotoSwipeLightbox({
        pswpModule: () => import("photoswipe"),
        dataSource: pswpItems,
        paddingFn: (viewportSize, imageSize) => {
          if (viewportSize.x < 768) {
            return { top: 0, bottom: 0, left: 0, right: 0 };
          } else {
            return { top: 30, bottom: 30, left: 50, right: 50 };
          }
        },
      });

      lightbox.init();
      pswpLightbox.current = lightbox;

      return () => {
        if (pswpLightbox.current) {
          pswpLightbox.current.destroy();
          pswpLightbox.current = null;
        }
      };
    }
  }, [sortedImages, produkte.produkt_name]);

  const openPhotoSwipe = (index) => {
    if (pswpLightbox.current) {
      pswpLightbox.current.loadAndOpen(index);
    }
  };

  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    arrows: true,
    initialSlide: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  };

  const handleAddToCart = () => {
    const cartItem = {
      id: produkte.id,
      name: produkte.produkt_name,
      image:
        produkte.bild_anhangen?.[0]?.bild_anhangen || "/Images/placeholder.jpg",
      kategories: produkte.kategories,
      category: produkte.marken,
      path_field: produkte.path_field,
      produkte_id: produkte.name
    };

    addToCart(cartItem);
    setLastAddedItem(cartItem);
  };

  useEffect(() => {
    if (lastAddedItem) {
      const timer = setTimeout(() => setLastAddedItem(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastAddedItem]);
  return (
    <>
      <div
        ref={ref}
        className={`max-w-7xl mx-auto px-4 my-10 lg:my-16 transition-opacity duration-700 ease-out
        ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10">
          <div className="rounded-2xl overflow-hidden">
            {sortedImages.length === 0 ? (
              <div className="w-full h-[500px] flex items-center justify-center rounded-xl bg-gray-100">
                <span className="text-gray-500 text-lg">{t("noImage")}</span>
              </div>
            ) : (
              <Slider {...sliderSettings}>
                {sortedImages.map((img, i) => (
                  <div
                    key={i}
                    className="w-full h-[500px] relative cursor-pointer"
                    onClick={() => openPhotoSwipe(i)}
                  >
                    <Image
                      src={`/cms${img.bild_anhangen}`}
                      alt={`${img.produkt_name}`}
                      fill
                      sizes="(max-width: 768px) 90vw, (max-width: 1200px) 80vw, 1000px"
                      className="object-center"
                      priority={i === 0}
                    />
                  </div>
                ))}
              </Slider>
            )}
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-[#30373e] mb-2">
                {produkte.produkt_name}
              </h2>
              <div className="h-1 w-20 bg-[#d1b250] rounded-full"></div>
            </div>
            <div className="border-t border-b border-gray-200 py-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("description")}
              </h3>
              <p className="mt-2 text-gray-600 whitespace-pre-line">
                {getBeschreibung(produkte, locale)}
              </p>
            </div>
            <div className="pt-4">
              <div className="flex flex-col items-start justify-center">
                <div className="button-custom4">
                  <button onClick={handleAddToCart}>
                    <span></span>
                    <p data-title={t("addToCart")}>
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
                .button-custom4{
                display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  button {
    width: 100%;
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
      width: 260px;
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
                }`} </style>
              </div>
            </div>
          </div>
        </div>
      </div>
      {lastAddedItem && alert.type === "success" ? (
        <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-md fixed top-28 right-1 sm:right-6 z-50 w-[95%] max-w-sm md:max-w-md mx-auto md:mx-0">
          <div className="flex-shrink-0 relative w-16 h-16">
            <Image
              src={`/cms${lastAddedItem.image}`}
              alt={lastAddedItem.name}
              fill
              sizes="64px"
              className="rounded-lg object-cover w-full h-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">
              {lastAddedItem.name}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {lastAddedItem.category}
            </p>
          </div>
          <button
            className="text-gray-400 hover:text-gray-700 cursor-pointer"
            onClick={() => setLastAddedItem(null)}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : alert.type === "error" ? (
        <div className="fixed top-28 right-6 z-50">
          <div className="p-3 rounded-lg shadow-lg border-l-4 w-80 max-w-md transition-all duration-300 bg-red-100 border-red-500 text-red-700">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {t("addedError")}
                </h3>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default ProdukteDetails;
