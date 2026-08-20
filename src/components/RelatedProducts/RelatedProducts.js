"use client";
import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { useTranslations } from "next-intl";
import { generateSlug } from "@/lib/slugify";

const RelatedProducts = ({ products }) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("related");

  // Don't render if there are no related products
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 my-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-light mb-4">{t("headline")}</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">{t("desc")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((product, id) => {
          const mainImage = product.bild_anhangen;
          const imageUrl = mainImage ? `/cms${mainImage}` : null;

          const productUrl = `/produkte/${generateSlug(product.marken)}/${product.path_field}`;

          return (
            <div key={`${product.produkt_name}-${id}`} className="text-center group">
              <Link href={productUrl} className="block" locale={locale}>
                <div className="h-64 relative rounded-xl overflow-hidden mb-4 group-hover:opacity-90 transition-opacity">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={product.produkt_name || "Product image"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22vw"
                      priority={false}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">{t("noImage")}</span>
                    </div>
                  )}
                </div>


                <h3 className="text-lg font-medium mb-1 line-clamp-1">{product.produkt_name}</h3>
              </Link>
              <p className="text-gray-600 text-sm">
                {product?.kategories?.split("-")[0]?.trim() || product?.kategories}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedProducts;