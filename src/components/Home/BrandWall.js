import { featuredRank } from "@/lib/content/brands";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/utils/routing";
import { generateSlug } from "@/lib/slugify";

// Logo wall of the brands carried in the showroom (Marken doctype, status
// "Aktiv"), each tile a link to the brand story page. Static, crawlable, no JS.
// The strongest brands (by search demand) come first; the rest follow in CMS order.
const MAX_LOGOS = 12;

export default async function BrandWall({ locale, brands }) {
  const t = await getTranslations({ locale, namespace: "Home" });
  const markenBase = ROUTES.marken[locale] || ROUTES.marken.de;

  const active = (brands || []).filter((b) => b?.status === "Aktiv" && b?.name1 && b?.logo);
  const rank = (b) => featuredRank(b.name1);
  const shown = [...active].sort((a, b) => rank(a) - rank(b)).slice(0, MAX_LOGOS);
  if (shown.length === 0) return null;
  // Names for the typographic band — every active brand, twice (seamless loop).
  const names = active.map((b) => b.name1);
  const band = [...names, ...names];

  return (
    <section className="pb-20 lg:pb-28" aria-labelledby="home-brands-title">
      {/* Kinetic band of brand names in the display face: the roll-call of the
          house, drifting slowly; pauses on hover/focus, static under
          prefers-reduced-motion. Decorative — the real list is below. */}
      <div className="marquee-group overflow-hidden border-y border-ink/12 py-5" aria-hidden="true">
        <div className="marquee flex w-max items-baseline gap-10 whitespace-nowrap px-5">
          {band.map((name, i) => (
            <span key={`${name}-${i}`} className="font-display flex items-baseline gap-10 text-3xl text-ink md:text-4xl">
              {name}
              <span className="inline-block h-1.5 w-1.5 translate-y-[-0.6em] rounded-full bg-gold" />
            </span>
          ))}
        </div>
      </div>

      <div className="reveal mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
        <h2 id="home-brands-title" className="font-display text-3xl leading-tight text-[#30373e] md:text-4xl lg:col-span-7 lg:text-[2.75rem]">
          {t("brandsTitle", { count: active.length })}
        </h2>
        <div className="lg:col-span-5">
          <p className="text-ink/80">{t("brandsLead")}</p>
          <Link
            href={markenBase}
            locale={locale}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold-text underline-offset-4 hover:underline"
          >
            {t("allBrands", { count: active.length })}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <ul className="mt-12 grid grid-cols-2 border-l border-t border-[#30373e]/12 sm:grid-cols-3 lg:grid-cols-6">
        {shown.map((brand) => (
          <li key={`${brand.name1}-${brand.name || ""}`} className="border-b border-r border-[#30373e]/12">
            <Link
              href={`${markenBase}/${generateSlug(brand.name1)}`}
              locale={locale}
              title={brand.name1}
              className="group flex h-28 items-center justify-center p-7 transition-colors hover:bg-stone"
            >
              <span className="relative block h-full w-full">
                <Image
                  src={`/cmx${brand.logo}`}
                  alt={brand.name1}
                  fill
                  sizes="(max-width: 640px) 40vw, (max-width: 1024px) 28vw, 180px"
                  className="object-contain opacity-75 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}
