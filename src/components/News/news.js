"use client";
import { useState, useRef } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { useTranslations } from "next-intl";
import { generateSlug } from "@/lib/slugify";
import { CalendarDays } from 'lucide-react';

const GridComponent = ({ items }) => {
  const gridRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("news");


  const activeItems = items.filter((item) => item.status === "Aktiv");
  const totalPages = Math.ceil(activeItems.length / itemsPerPage);
  const currentItems = activeItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (activeItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 my-10 lg:my-16 text-center text-gray-500">
        {t("noNews")}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4  my-10 lg:my-16" ref={gridRef}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {currentItems.map((item, index) => (
          <div
            key={item.id || index}
            className="bg-white overflow-hidden"
            style={{
              animation: "fade-in-up-smooth 0.5s ease-out forwards",
            }}
          >
            <div className="h-80 overflow-hidden w-full relative">
              <Image
                src={
                  item?.bild_anhagen
                    ? `/cms${item.bild_anhagen}`
                    : item?.artikel_table?.[0]?.bild_anhagen
                      ? `/cms${item.artikel_table[0]?.bild_anhagen}`
                      : `/cms${item.artikel_table[1]?.bild_anhagen}`
                }
                alt={item.name1 || "News article"}
                fill
                sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 400px"
                className="object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>

            <div className="pt-6">
              <h3
                className="text-2xl font-bold mb-3 line-clamp-2 text-[#30373e]"
                title={item?.name1}
              >
                {locale === "en"
                  ? item?.name_en
                  : locale === "it"
                    ? item?.name_it
                    : locale === "fr"
                      ? item?.name_fr
                      : item?.name1}
              </h3>
              {/* <div className="flex items-center text-[#30373e]/80 mb-3 text-md">
                <CalendarDays className="mr-3 text-[#d1b250]/70" />
                <span className="text-lg">
                  {item?.daten
                    ? new Date(item.daten).toLocaleDateString(locale || "de-DE")
                    : ""}
                </span>
              </div> */}
              <p className="text-gray-600 mb-3 line-clamp-3 text-md leading-relaxed">
                {locale === "en"
                  ? item?.beschreibung_en
                  : locale === "it"
                    ? item?.beschreibung_it
                    : locale === "fr"
                      ? item?.beschreibung_fr
                      : item?.beschreibung}
              </p>
              <Link
                href={`/news/${generateSlug(item?.name1)}`}
                prefetch={true}
                locale={locale}
                className="inline-flex items-center gap-2 text-[#30373e] font-medium relative group"
              >
                <span className="z-10 text-[#30373e]/80 group-hover:text-[#d1b250] transition-colors duration-300">
                  {t("learnMore")}
                </span>
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 text-[#30373e]/80 group-hover:stroke-[#d1b250]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
                <span className="absolute left-0 bottom-0 h-[2px] bg-[#30373e] group-hover:bg-[#d1b250] transition-all duration-300 ease-in-out w-32 lg:w-[0px] group-hover:w-[150px]" />
              </Link>
            </div>
          </div>
        ))}
      </div>
      <style jsx>
        {`@keyframes fade-in-up-smooth {
  0% {
    opacity: 0;
    transform: translateY(50px) scale(0.95);
    filter: blur(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}`}
      </style>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-12">
          <nav className="flex items-center gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 lg:px-4 py-1 lg:py-2 cursor-pointer rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              {t("previous")}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`px-2 lg:px-4 py-1 lg:py-2 cursor-pointer rounded-md ${currentPage === number
                    ? "bg-[#d1b250] text-white"
                    : "border border-gray-300 hover:bg-gray-50"
                    } transition-colors`}
                >
                  {number}
                </button>
              )
            )}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2 lg:px-4 py-1 lg:py-2 cursor-pointer rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              {t("next")}
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default GridComponent;
