"use client";

import React, { useState } from "react";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart, wishlistImageSrc } from "@/context/CartContext";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import AnfrageFormProduct from "@/components/AnfrageFormProduct/AnfrageFormProduct";
import { useTranslations } from "next-intl";
import { generateSlug } from "@/lib/slugify";
import { productsPath, localizeProductsHref } from "@/utils/routing";


export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [showForm, setShowForm] = useState(false);
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("cart");

  const handleClearAll = () => {
    clearCart();
  };

  const handleSubmitRequest = () => {
    setShowForm(true);
  };

  if (showForm) {
    return <AnfrageFormProduct onBack={() => setShowForm(false)} cartItems={cartItems} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-12 pb-4 border-b border-gray-100">
        <h2 className="text-2xl font-normal text-gray-900">{t("wishlist")}</h2>
        {cartItems.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 text-gray-600 hover:text-red-700 transition-colors duration-200 uppercase text-sm font-medium cursor-pointer"
          >
            <Trash2 size={18} />
            {t("clearList")}
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center text-center justify-center py-10 text-gray-500">
            <div className="w-32 h-32 mb-8 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingBag size={60} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-normal mb-3 text-gray-800">{t("noItemsHeadline")}</h3>
            <Link href={productsPath(locale)} locale={locale}>
              <p className="text-[#d1b250] font-medium hover:underline">{t("findProducts")}</p>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {cartItems.map((item) => (
            <div
              key={`${item.id}-${item.name}-${item.category || "default"}`}
              className="bg-white border border-gray-100 rounded hover:shadow-sm transition-shadow duration-300 overflow-hidden"
            >
              <div className="relative w-full h-64 bg-gray-50">
                {item.image ? (
                  <Image
                    src={wishlistImageSrc(item?.image)}
                    alt={item?.name || "Produktbild"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ShoppingBag size={48} />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="mb-3">
                  <h3 className="font-normal uppercase text-gray-900 text-normal leading-tight mb-2 overflow-hidden text-ellipsis whitespace-nowrap max-w-50">
                    {item.name}
                  </h3>
                  {item.category && <p className="text-sm text-[#d1b250] font-normal">{item.category}</p>}
                </div>
                <div className="flex justify-between align-center">
                  <Link
                    href={localizeProductsHref(item.href || productsPath("de", generateSlug(item?.kategories), item.url_slug), locale)}
                    locale={locale}
                    className="bg-gray-200 hover:bg-[#d1b250] py-2 px-10 rounded-full shadow-sm hover:shadow-md transition-all duration-200 text-gray-600 group cursor-pointer"
                  >
                    <p className="group-hover:text-white text-sm">{t("productDetail")}</p>
                  </Link>

                  <button
                    onClick={() => removeFromCart(`${item.id}-${item.name}-${item.category || "default"}`)}
                    className="bg-gray-200 hover:bg-red-600 py-2 px-4 rounded-full shadow-sm hover:shadow-md transition-all duration-200 text-gray-600 group cursor-pointer"
                  >
                    <Trash2 size={20} className="group-hover:text-white" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {cartItems.length > 0 && (
        <div className="mt-16 flex justify-center">
          <div className="w-full max-w-md">
            <div className="flex justify-center">
              <button onClick={handleSubmitRequest} className="
      group
      relative
      flex
      h-11.25
      w-full
      items-center
      justify-center
      overflow-hidden
      rounded-[3px]
      border-2
      border-[#d1b250]
      bg-transparent
      p-1.25
      text-[13px]
      font-medium
      uppercase
      tracking-[1px]
      text-[#30373e]
      transition-all
      duration-500

      max-sm:h-10
      max-sm:w-65
      max-sm:text-[12px]

      before:absolute
      before:right-0
      before:top-0
      before:h-0.5
      before:w-0
      before:bg-[rgb(92,92,92)]
      before:transition-all
      before:duration-500
      before:ease-[cubic-bezier(0.35,0.1,0.25,1)]

      after:absolute
      after:bottom-0
      after:left-0
      after:h-0.5
      after:w-0
      after:bg-[rgb(92,92,92)]
      after:transition-all
      after:duration-500
      after:ease-[cubic-bezier(0.35,0.1,0.25,1)]

      hover:before:w-full
      hover:after:w-full
    ">
                <span className="
        absolute
        left-0
        top-0
        z-1
        h-full
        w-full

        before:absolute
        before:right-0
        before:top-0
        before:h-0
        before:w-0.5
        before:bg-[rgb(92,92,92)]
        before:transition-all
        before:duration-500
        before:ease-[cubic-bezier(0.35,0.1,0.25,1)]

        after:absolute
        after:bottom-0
        after:left-0
        after:h-0
        after:w-0.5
        after:bg-[rgb(92,92,92)]
        after:transition-all
        after:duration-500
        after:ease-[cubic-bezier(0.35,0.1,0.25,1)]

        group-hover:before:h-full
        group-hover:after:h-full
      "></span>
                <p className="relative z-2 inline-flex items-center gap-2 p-0 text-black" data-title={t("sendRequest")}>
                  {t("sendRequest")} <ArrowRight className="ml-2 h-4w-4
          transition-transform
          duration-300
          ease-in-out
          group-hover:translate-x-1" />


                </p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
