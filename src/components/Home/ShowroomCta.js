import { PHONE_DISPLAY, PHONE_HREF, DIRECTIONS_URL } from "@/lib/site";
import Image from "next/image";
import { ArrowRight, Clock, MapPin, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ROUTES, localizeProductsHref } from "@/utils/routing";

// Closing section: the showroom invitation with the facts (address, hours,
// phone, route) — "designermöbel" has visit intent, so the homepage answers
// where and when before the footer. Same limestone surface as the other
// full-width sections so the page closes calmly instead of with a dark block.
// The CMS stores a German link (e.g. "/kontakt"); map it to this locale's path.
// Only site-relative paths are accepted — an absolute or protocol-relative
// value from the CMS must not turn the homepage CTA into an off-site link.
function localizeCmsPath(path, locale) {
  if (!path || typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
    return ROUTES.kontakt[locale] || ROUTES.kontakt.de;
  }
  const clean = path.replace(/^\/(de|en|fr|it)(?=\/|$)/, "") || "/";
  for (const paths of Object.values(ROUTES)) {
    if (paths.de === clean) return paths[locale] || clean;
  }
  return localizeProductsHref(clean, locale);
}

export default async function ShowroomCta({ locale, data }) {
  const t = await getTranslations({ locale, namespace: "Home" });
  const tNav = await getTranslations({ locale, namespace: "Navbar" });
  const tFooter = await getTranslations({ locale, namespace: "Footer" });

  const ctaText = data?.[`link_text_${locale}`] || data?.link_text_de || t("heroCtaPrimary");
  const ctaHref = localizeCmsPath(data?.link_before_footer_de, locale);

  return (
    <section className="w-full bg-stone text-ink" aria-labelledby="home-showroom-title">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-16 lg:py-28">
        {/* Photo with a hairline gold frame set slightly off the image — the
            one framed object in the section, like a picture on a showroom wall. */}
        <div className="reveal relative lg:col-span-6">
          <div className="pointer-events-none absolute -right-3 -top-3 h-full w-full border border-gold/70 lg:-right-5 lg:-top-5" aria-hidden="true" />
          <div className="relative aspect-4/3 overflow-hidden">
            <Image
              src="/Images/Home/bannerImage-3.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="reveal lg:col-span-6 lg:pl-6">
          <h2 id="home-showroom-title" className="font-display text-3xl leading-tight md:text-4xl lg:text-[2.75rem]">
            {t("showroomVisit")}
          </h2>
          <p className="mt-5 max-w-xl text-ink/80">{t("showroomText")}</p>

          <address className="mt-10 grid grid-cols-1 gap-6 border-t border-ink/12 pt-8 not-italic sm:grid-cols-2">
            <div className="flex gap-3">
              <MapPin size={20} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
              <div className="text-sm leading-relaxed">
                <p className="font-semibold">{t("addressTitle")}</p>
                <p className="text-ink/75">
                  Platzhirsch Home Living
                  <br />
                  {tFooter("address.line1")}, {tFooter("address.line2")}
                  <br />
                  {tFooter("address.country")}
                </p>
                <a
                  href={DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 font-semibold text-gold-text underline-offset-4 hover:underline"
                >
                  {t("route")}
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock size={20} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
              <div className="text-sm leading-relaxed">
                <p className="font-semibold">{tFooter("openingHoursTitle")}</p>
                <p className="text-ink/75">{tNav("hours")}</p>
                <p className="mt-1 text-ink/80">{tFooter("appointment")}</p>
              </div>
            </div>
          </address>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href={ctaHref}
              locale={locale}
              className="inline-flex items-center justify-center gap-2 rounded-[3px] bg-ink px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-gold hover:text-ink"
            >
              {ctaText}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a
              href={PHONE_HREF}
              className="inline-flex items-center justify-center gap-2 rounded-[3px] border border-ink/30 px-6 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 hover:border-gold hover:text-gold-text"
            >
              <Phone size={16} aria-hidden="true" />{PHONE_DISPLAY}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
