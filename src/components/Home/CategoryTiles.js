import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { productsPath } from "@/utils/routing";
import { generateSlug } from "@/lib/slugify";
import { getKategorieLabel, getKategorieAlt, indexKategorienByKey } from "@/lib/api/fetchKategorien";
import { localizeCategory } from "@/lib/seo/productCategories";
import { getCategoryImage } from "@/lib/shop/categoryImages";

// Six product worlds on the homepage, linking into /produkte/[category]. Picks
// the first keys of this curated order that actually have products (same
// data as the catalogue hub), so a category never shows up empty.
const PREFERRED = [
  "sofas-couches",
  "beds",
  "dining-tables",
  "kitchen",
  "lamps",
  "lounge-furniture-daybeds",
  "armchairs-stools",
  "side-tables",
  "rugs",
];

export default async function CategoryTiles({ locale, kategorienWithCounts, kategorien }) {
  const t = await getTranslations({ locale, namespace: "Home" });
  const tShop = await getTranslations({ locale, namespace: "shop" });
  const byKey = indexKategorienByKey(kategorien);
  const countByKey = new Map(
    (kategorienWithCounts || [])
      .filter((k) => k.category_key)
      .map((k) => [k.category_key.toLowerCase(), Number(k.produkt_count) || 0])
  );

  const tiles = PREFERRED.filter((key) => (countByKey.get(key) || 0) > 0)
    .slice(0, 6)
    .map((key, index) => {
      const cms = byKey.get(key);
      const slug = generateSlug(key);
      return {
        slug,
        label: cms ? getKategorieLabel(cms, locale) : localizeCategory(key, locale),
        alt: cms ? getKategorieAlt(cms, locale) : localizeCategory(key, locale),
        count: countByKey.get(key),
        image: cms?.image ? `/cmx${cms.image}` : getCategoryImage(slug, index),
      };
    });
  if (tiles.length === 0) return null;

  return (
    <section className="w-full bg-stone" aria-labelledby="home-categories-title">
      <div className="reveal mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
          <h2 id="home-categories-title" className="font-display text-3xl leading-tight text-[#30373e] md:text-4xl lg:col-span-7 lg:text-[2.75rem]">
            {t("categoriesTitle")}
          </h2>
          <div className="lg:col-span-5">
            <p className="text-ink/85">{t("categoriesLead")}</p>
            <Link
              href={productsPath(locale)}
              locale={locale}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold-text underline-offset-4 hover:underline"
            >
              {t("allCategories")}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Editorial grid: the first tile is a 2×2 feature on desktop (two
            columns wide, two rows tall) with the next two stacked beside it,
            then a row of three — six tiles, no gaps, reads like a magazine
            spread rather than a card deck. */}
        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {tiles.map((cat, index) => (
            <li key={cat.slug} className={index === 0 ? "sm:col-span-2 lg:row-span-2" : ""}>
              <Link
                href={productsPath(locale, cat.slug)}
                locale={locale}
                className={`group relative block h-full min-h-[240px] overflow-hidden bg-gray-200 ${
                  index === 0 ? "aspect-4/3 sm:aspect-2/1 lg:aspect-auto" : "aspect-4/3"
                }`}
              >
                <Image
                  src={cat.image || "/Images/fallback-banner.jpg"}
                  alt={cat.alt || cat.label}
                  fill
                  sizes={index === 0 ? "(max-width: 640px) 92vw, (max-width: 1024px) 92vw, 840px" : "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 400px"}
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-deep/80 via-ink-deep/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
                  <div>
                    <h3 className="font-display text-2xl leading-none md:text-3xl">{cat.label}</h3>
                    <p className="mt-1.5 text-sm text-white/80">{tShop("resultsCount", { count: cat.count })}</p>
                  </div>
                  <ArrowRight
                    size={20}
                    className="mb-1 shrink-0 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
