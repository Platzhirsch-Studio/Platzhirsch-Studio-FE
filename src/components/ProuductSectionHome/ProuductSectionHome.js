"use client";
import { useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { useTranslations } from "next-intl";
import { generateSlug } from "@/lib/slugify";

export default function TrendingProducts({ data }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("TrendingProducts");

  const handleLoadMore = () => {
    router.push(`/${locale}/produkte/minotti`);
  };

  const productsGrid = useMemo(
    () => (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {(data || []).slice(0, 8)?.map((product, i) => (
          <Link
            key={product.name || i}
            href={`/produkte/${generateSlug(product.marken)}/${product.path_field}`}
            className="group cursor-pointer"
          >
            <div className="relative aspect-square bg-gray-50 rounded-lg mb-4 overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {product.bild_anhangen?.[0]?.bild_anhangen ? (
                <Image
                  src={`/cms${product.bild_anhangen[0].bild_anhangen}`}
                  alt={product.produkt_name || "Product image"}
                  fill
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 45vw, 22vw "
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                    <span className="text-xs">{t("noImage")}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="text-center">
              <h3 className="text-gray-700 font-medium mb-1 group-hover:text-gray-900 transition-colors line-clamp-2">
                {product.produkt_name}
              </h3>
              {/* <p className="text-gray-500 text-sm">{product.marken}</p> */}
            </div>
          </Link>
        ))}
      </div>
    ),
    [data, t]
  );

  // if (loading) {
  //   return (
  //     <div className="max-w-7xl mx-auto px-4 py-16 text-center">
  //       <div className="text-center mb-12">
  //         <h2 className="text-lg mb-4 text-[#d1b250] text-center uppercase">{t("title")}</h2>
  //         <p className="text-2xl md:text-3xl lg:text-4xl mb-10 lg:mb-16 font-bold text-center text-[#30373e]">
  //           {t("headline")}
  //         </p>
  //       </div>
  //       <div className="flex justify-center items-center min-h-[300px]">
  //         <div className="loader">
  //           <div className="spinner"></div>
  //           {/* <p className="text-gray-500 text-sm mt-4">Loading products...</p> */}
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }
  // if (error) {
  //   return (
  //     <div className="max-w-7xl mx-auto px-4 py-16 text-center">
  //       <h2 className="text-3xl font-light text-gray-800 mb-4">{t("title")}</h2>
  //       <p className="text-red-500">
  //         {t("error")}: {error}
  //       </p>
  //       <button
  //         onClick={fetchProducts}
  //         className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
  //       >
  //         {t("tryAgain")}
  //       </button>
  //     </div>
  //   );
  // }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16">
      <div className="text-center flex flex-col items-center">
        <h2 className="text-lg mb-4 text-[#30373e] text-center uppercase">{t("title")}</h2>
        <p className="text-2xl md:text-3xl lg:text-4xl mb-10 lg:mb-16 max-w-2xl font-bold text-center text-[#30373e]">
          {t("headline")}
        </p>
      </div>
      {productsGrid}
      <div className="text-center">
        <button
          onClick={handleLoadMore}
          className="text-gray-600 text-sm font-medium hover:text-[#d1b250] transition-colors duration-200 border-b border-gray-400 hover:border-[#d1b250] pb-1 cursor-pointer"
        >
          {t("loadMore")}
        </button>
      </div>
    </div>
  );
}
