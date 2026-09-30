"use client";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { useTranslations } from "next-intl";
import { generateSlug } from "@/lib/slugify";
import { ROUTES } from "@/utils/routing";
import WishlistHeart from "@/components/ShopCatalog/wishlistHeart";

// `data` = shop-card products (buildShopProducts() in src/lib/shop/shopProducts.js)
// of one brand. Links go to the live /produkte/<category>/<product> pages
// (same path in every locale); "load more" is a real link to the brand page
// so crawlers can follow it too.
export default function TrendingProducts({ data, brand = "Minotti" }) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("TrendingProducts");

  const products = (data || []).slice(0, 8);
  const brandPageHref = `${ROUTES.marken[locale] || ROUTES.marken.de}/${generateSlug(brand)}`;

  if (products.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16">
      <div className="text-center flex flex-col items-center">
        <h2 className="text-lg mb-4 text-[#30373e] text-center uppercase">{t("title")}</h2>
        <p className="text-2xl md:text-3xl lg:text-4xl mb-10 lg:mb-16 max-w-2xl font-bold text-center text-[#30373e]">
          {t("headline")}
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {products.map((product) => {
          const href = `/produkte/${generateSlug(product.categoryKey)}/${product.url_slug}`;
          return (
          <div key={product.id} className="relative">
            <Link href={href} locale={locale} className="group block cursor-pointer">
              <div className="relative aspect-square bg-gray-50 rounded-lg mb-4 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <Image
                  src={product.image || "/Images/fallback-banner.jpg"}
                  alt={`${product.brand} ${product.name}`}
                  fill
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 45vw, 22vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="text-center">
                <h3 className="text-gray-700 font-medium mb-1 group-hover:text-gray-900 transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </div>
            </Link>
            <WishlistHeart product={{ ...product, href }} />
          </div>
          );
        })}
      </div>
      <div className="text-center">
        <Link
          href={brandPageHref}
          locale={locale}
          className="text-gray-600 text-sm font-medium hover:text-[#d1b250] transition-colors duration-200 border-b border-gray-400 hover:border-[#d1b250] pb-1 cursor-pointer"
        >
          {t("loadMore")}
        </Link>
      </div>
    </div>
  );
}
