import { LANDING_PAGES, landingPagePath } from "@/lib/content/landingPages";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

// German homepage only: the local landing pages (Küchen Vorarlberg, Designermöbel
// Bregenz, Möbel Bodensee, …) linked from the page with the most authority,
// with the service area spelled out for local intent. The pages exist in
// German only, so the other locales render nothing here.
const PLACES = ["Lochau", "Bregenz", "Dornbirn", "Feldkirch", "Lindau", "Friedrichshafen", "St. Gallen", "Vaduz"];

export default async function RegionLinks({ locale }) {
  if (locale !== "de") return null;
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <section className="reveal mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28" aria-labelledby="home-regions-title">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <h2 id="home-regions-title" className="font-display text-3xl leading-tight text-[#30373e] md:text-4xl">
            {t("regionsTitle")}
          </h2>
          <p className="mt-5 text-ink/80">{t("regionsText")}</p>
          <p className="mt-3 text-ink/80">{t("regionsLead")}</p>
          <p className="font-display mt-8 text-xl leading-relaxed text-[#30373e]">
            {PLACES.join(" — ")}
          </p>
        </div>
        {/* A rule-separated list, not a card deck: these are routes into the
            same showroom, read top to bottom. */}
        <ul className="divide-y divide-[#30373e]/12 border-y border-[#30373e]/12 lg:col-span-7">
          {LANDING_PAGES.map((page) => (
            <li key={page.slug}>
              <Link
                href={landingPagePath(page.slug)}
                locale="de"
                className="group flex items-center justify-between gap-6 py-5 transition-colors hover:text-gold-text"
              >
                <span>
                  <span className="font-display block text-2xl text-[#30373e] group-hover:text-gold-text">{page.label}</span>
                  <span className="mt-1 block text-sm text-[#30373e]/70">{page.teaser}</span>
                </span>
                <ArrowRight size={20} className="shrink-0 text-[#30373e]/40 transition-colors group-hover:text-gold-text" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
