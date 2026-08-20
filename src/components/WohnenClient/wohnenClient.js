"use client";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import Image from "next/image";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { generateSlug } from "@/lib/slugify";
import FadeInView from "@/components/Reusable/FadeInView";

// Helper: Choose description based on locale
function getDescription(item, locale) {
  switch (locale) {
    case "en":
      return item.produkte_en || item.produkte || item.description;
    case "fr":
      return item.produkte_fr || item.produkte || item.description;
    case "it":
      return item.produkte_it || item.produkte || item.description;
    case "de":
    default:
      return item.produkte || item.description;
  }
}

const AlternatingLayoutGrid = ({ data }) => {
  const BATCH_SIZE = 6;
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("grid");
  const handleShowMore = () => setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, data.length));
  const handleShowLess = () => setVisibleCount(BATCH_SIZE);
  const isMoreAvailable = visibleCount < data.length;

  return (
    <div className="mt-10 lg:mt-16 mb-10 lg:mb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {data.slice(0, visibleCount).map((item, index) => (
        <div
          key={index}
          className={`grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center mt-10 lg:mt-16 ${index % 2 === 0 ? "" : "md:grid-flow-dense"}`}
        >
          <FadeInView
            as="div"
            direction="none"
            duration={600}
            className={`relative h-[300px] lg:h-[400] md:h-[370px] ${index % 2 === 0 ? "" : "md:col-start-2"}`}
          >
            <Image
              src={`/cms${item?.image[0].bild_anhagen}`}
              alt={item?.title || "Product image"}
              fill
              className="object-cover rounded-md shadow-lg"
              sizes="(max-width: 768px) 90vw, 50vw"
            />
          </FadeInView>

          <FadeInView
            as="div"
            direction="bottom"
            duration={700}
            distance={40}
            delay={index * 100}
            className={`${index % 2 === 0 ? "" : "md:col-start-1 md:row-start-1"}`}
          >
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-[#30373e]">{item?.title}</h3>
            <p className="text-[#30373e]/80 mb-4 text-md">{getDescription(item, locale)}</p>
            <Link
              href={`/produkte/${generateSlug(item?.title)}`}
              prefetch={true}
              className="inline-block"
              locale={locale}
            >
              <div className="button-custom6">
                <button>
                  <span></span>
                  <p data-title={item?.title}>
                    <svg className="ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </p>
                </button>
              </div>
            </Link>
          </FadeInView>
        </div>
      ))}

      {/* Show More / Less */}
      <div className="button-custom6">
        {isMoreAvailable ? (
          <button className="mt-12" onClick={handleShowMore}>
            <span></span>
            <p data-title={t("showMore")}></p>
          </button>
        ) : (
          data.length > BATCH_SIZE &&
          <button className="mt-12" onClick={handleShowLess}>
            <span></span>
            <p data-title={t("showLess")}></p>
          </button>
        )}
      </div>

      <style jsx>{`
        .button-custom6{
          display: flex;
  justify-content: center;
  button {
    width: auto;
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
    &::before { right: 0; top: 0; }
    &::after { left: 0; bottom: 0; }
    &:hover::before, &:hover::after { width: 100%; }
    span {
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 1;
      &::before, &::after {
        content: "";
        position: absolute;
        width: 2px;
        height: 0;
        background-color: rgb(92, 92, 92);
        transition: all 0.5s cubic-bezier(0.35, 0.1, 0.25, 1);
      }
      &::before { right: 0; top: 0; }
      &::after { left: 0; bottom: 0; }
    }
    &:hover span::before, &:hover span::after { height: 100%; }
    p {
      padding: 0;
      margin: 0;
      position: relative;
      z-index: 2;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: color 0.3s ease;
      &::before { content: attr(data-title); }
      &::after { display: none; }
      svg {
        width: 16px;
        height: 16px;
        transition: transform 0.3s ease;
      }
    }
    &:hover p svg { transform: translateX(4px); }
  }
        }
      `} </style>
    </div>
  );
};

export default AlternatingLayoutGrid;
