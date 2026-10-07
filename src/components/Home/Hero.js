import { FEATURED_BRANDS } from "@/lib/content/brands";
import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/utils/routing";

// Homepage hero — full-bleed photograph, no carousel, no form. Server
// component: the LCP image is in the first paint and the outline has exactly
// one H1 (set in Bodoni Moda, the typography of the Italian design houses the
// showroom sells). The only motion is the single page-load entrance
// (.hero-reveal, off under prefers-reduced-motion). SISTRIX (2026-10) shows
// brand-led demand ("minotti", "poliform") with visit/do intent, so the two
// conversion paths (appointment, brands) and the strongest brand names sit
// above the fold as real links.
const HERO_IMAGE = {
  src: "/Images/Home/slider/minotti-sofa-wohnzimmer.webp",
  alt: {
    de: "Minotti Ecksofa in Weiß in einem Wohnzimmer mit dunkler Holzwand",
    en: "White Minotti sectional sofa in a living room with a dark wood wall",
    fr: "Canapé d'angle Minotti blanc dans un salon avec un mur en bois sombre",
    it: "Divano angolare Minotti bianco in un soggiorno con parete in legno scuro",
  },
};

const HERO_BRANDS = FEATURED_BRANDS.slice(0, 7);

export default async function Hero({ locale }) {
  const t = await getTranslations({ locale, namespace: "Home" });
  const tSlider = await getTranslations({ locale, namespace: "Slider" });
  const markenBase = ROUTES.marken[locale] || ROUTES.marken.de;

  // min-h on phones/tablets: the fixed 600 px used to be shorter than the
  // headline + lead + CTAs + trust row, so the content overflowed upward under
  // the fixed header and the H1 was cut off at 360–768 px.
  return (
    <section className="relative isolate w-full min-h-150 lg:min-h-0 lg:h-200 overflow-hidden text-white">
      <Image
        src={HERO_IMAGE.src}
        alt={HERO_IMAGE.alt[locale] || HERO_IMAGE.alt.de}
        fill
        priority
        sizes="100vw"
        className="hero-zoom object-cover object-center -z-20"
      />
      {/* Left-weighted gradient keeps the photo visible on the right and the
          text legible on the left. */}
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-night/85 via-night/55 to-night/15" />
      <div className="absolute inset-x-0 bottom-0 h-40 -z-10 bg-linear-to-t from-night/80 to-transparent" />

      {/* pt clears the fixed header (~80 px mobile, ~190 px desktop). */}
      <div className="hero-reveal relative mx-auto flex min-h-150 max-w-7xl flex-col justify-end px-4 pb-10 pt-28 sm:px-6 lg:h-full lg:min-h-0 lg:justify-center lg:pb-24 lg:pt-56">
        <p className="text-sm text-white/75">{t("heroEyebrow")}</p>
        <h1 className="font-display mt-3 max-w-4xl text-4xl leading-[1.05] sm:text-5xl md:text-[3.5rem] lg:text-[4.5rem] lg:leading-[1.02]">
          {tSlider("headline")}
        </h1>
        <p className="mt-5 max-w-2xl text-base text-white/85 sm:text-lg">{t("heroLead")}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href={ROUTES.beratung[locale] || ROUTES.beratung.de}
            locale={locale}
            className="inline-flex items-center justify-center gap-2 rounded-[3px] bg-gold px-6 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 hover:bg-white"
          >
            {t("heroCtaPrimary")}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href={markenBase}
            locale={locale}
            className="inline-flex items-center justify-center gap-2 rounded-[3px] border border-white/70 px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-300 hover:border-gold hover:text-gold"
          >
            {t("heroCtaSecondary")}
          </Link>
        </div>

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
          {["trust1", "trust2", "trust3"].map((key) => (
            <li key={key} className="flex items-center gap-2">
              <Check size={14} strokeWidth={2.5} className="shrink-0 text-gold" aria-hidden="true" />
              {t(key)}
            </li>
          ))}
        </ul>

        {/* Top brands as real links — crawlable, and the strongest query
            cluster this site can win. */}
        <p className="mt-8 hidden flex-wrap items-baseline gap-x-5 gap-y-1 border-t border-white/15 pt-5 text-sm text-white/60 sm:flex">
          <span>{t("heroBrandsLabel")}</span>
          {HERO_BRANDS.map((brand) => (
            <Link
              key={brand.slug}
              href={`${markenBase}/${brand.slug}`}
              locale={locale}
              className="font-display text-xl text-white/90 underline-offset-4 transition-colors hover:text-gold hover:underline"
            >
              {brand.name}
            </Link>
          ))}
        </p>
      </div>
    </section>
  );
}
