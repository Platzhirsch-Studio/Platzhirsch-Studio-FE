"use client";
import { PHONE_DISPLAY, PHONE_HREF, EMAIL, EMAIL_HREF, DIRECTIONS_URL, SOCIAL } from "@/lib/site";
import { LANDING_PAGES, landingPagePath } from "@/lib/content/landingPages";
import { FEATURED_BRANDS } from "@/lib/content/brands";
import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { ArrowUpRight, Clock, MapPin, Phone } from "lucide-react";
import { ROUTES, productsPath } from "@/utils/routing";
import footerimg from "../../../public/Images/Navbar/Logo.png";
import CookieBanner from "../Cookies/cookiecomponent";

// Site footer. Four columns on the ink surface — showroom facts, brands,
// product worlds, service & regions — then the legal row. Every link here is
// a real internal link to a page that targets a search cluster (brand pages,
// category pages, local landing pages), so the footer distributes authority
// to the pages that have to rank, without becoming a link farm.
// Category keys (ProductsMenu item keys) shown as "product worlds".
const CATEGORY_KEYS = ["sofas-couches", "armchairs-stools", "dining-tables", "beds", "kitchen", "lamps", "lounge-furniture-daybeds", "rugs"];

const linkClass = "text-sm text-white/70 transition-colors hover:text-gold";
const headingClass = "font-display text-xl text-white";

export default function Footer() {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const t = useTranslations("Footer");
  const tNav = useTranslations("Navbar");
  const tMenu = useTranslations("ProductsMenu");
  const locale = useLocale();
  const year = new Date().getFullYear();

  // Localized category labels from the products mega-menu definition.
  const menuItems = (tMenu.raw("groups") || []).flatMap((g) => g.items || []);
  const categories = CATEGORY_KEYS.map((key) => ({ key, label: menuItems.find((i) => i.key === key)?.label })).filter((c) => c.label);

  return (
    <footer className="w-full bg-ink-deep text-white">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:pb-10 lg:pt-20">
        {/* Tagline row: what this house is, in the words people search for. */}
        <div className="grid grid-cols-1 gap-8 border-b border-white/10 pb-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Image src={footerimg} alt="Platzhirsch Home Living" width={150} className="h-auto" sizes="150px" />
            <p className="font-display mt-6 max-w-2xl text-2xl leading-snug text-white md:text-3xl">{t("tagline")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
            <Link
              href={ROUTES.beratung[locale] || ROUTES.beratung.de}
              locale={locale}
              className="inline-flex items-center justify-center gap-2 rounded-[3px] bg-gold px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-white"
            >
              {t("consultation")}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <a
              href={PHONE_HREF}
              className="inline-flex items-center justify-center gap-2 rounded-[3px] border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-gold hover:text-gold"
            >
              <Phone size={16} aria-hidden="true" />{PHONE_DISPLAY}</a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Showroom */}
          <address className="not-italic lg:col-span-4">
            <h2 className={headingClass}>{t("showroomTitle")}</h2>
            <div className="mt-5 space-y-4 text-sm text-white/70">
              <p className="flex gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                <span>
                  Platzhirsch Home Living
                  <br />
                  {t("address.line1")}, {t("address.line2")}
                  <br />
                  {t("address.country")}
                </span>
              </p>
              <p className="flex gap-3">
                <Clock size={18} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                <span>
                  {tNav("hours")}
                  <br />
                  <span className="text-white/55">{t("appointment")}</span>
                </span>
              </p>
              <p className="flex flex-col gap-1 pl-[30px]">
                <a href={EMAIL_HREF} className={linkClass}>{EMAIL}</a>
                <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-gold hover:text-white">
                  {t("route")}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </p>
            </div>
            <div className="mt-6 flex gap-3 pl-[30px]">
              {SOCIAL.map(({ href, name: label }) => { const Icon = { Instagram: FaInstagram, Facebook: FaFacebookF, LinkedIn: FaLinkedinIn }[label]; return (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white/80 transition-colors hover:border-gold hover:text-gold"
                >
                  <Icon aria-hidden="true" />
                </a>
              ); })}
            </div>
          </address>

          {/* Brands */}
          <nav aria-label={t("brandsHeading")} className="lg:col-span-3">
            <h2 className={headingClass}>{t("brandsHeading")}</h2>
            <ul className="mt-5 space-y-2.5">
              {FEATURED_BRANDS.slice(0, 10).map((b) => (
                <li key={b.slug}>
                  <Link href={`${ROUTES.marken[locale] || ROUTES.marken.de}/${b.slug}`} locale={locale} className={linkClass}>
                    {b.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={ROUTES.marken[locale] || ROUTES.marken.de} locale={locale} className="text-sm font-semibold text-gold hover:text-white">
                  {t("allBrands")}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Product worlds */}
          <nav aria-label={t("productsTitle")} className="lg:col-span-2">
            <h2 className={headingClass}>{t("productsTitle")}</h2>
            <ul className="mt-5 space-y-2.5">
              {categories.map((c) => (
                <li key={c.key}>
                  <Link href={productsPath(locale, c.key)} locale={locale} className={linkClass}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Service & regions */}
          <nav aria-label={t("serviceTitle")} className="lg:col-span-3">
            <h2 className={headingClass}>{t("serviceTitle")}</h2>
            <ul className="mt-5 space-y-2.5">
              <li>
                <Link href={ROUTES.beratung[locale] || ROUTES.beratung.de} locale={locale} className={linkClass}>{t("consultation")}</Link>
              </li>
              <li>
                <Link href={ROUTES.kontakt[locale] || ROUTES.kontakt.de} locale={locale} className={linkClass}>{t("contact")}</Link>
              </li>
              <li>
                <Link href={ROUTES.platzhirsch[locale] || ROUTES.platzhirsch.de} locale={locale} className={linkClass}>{t("aboutLink")}</Link>
              </li>
              <li>
                <Link href="/newsletter" locale={locale} className={linkClass}>{t("newsletter")}</Link>
              </li>
              {locale === "de" &&
                LANDING_PAGES.map((page) => (
                  <li key={page.slug}>
                    <Link href={landingPagePath(page.slug)} locale="de" className={linkClass}>{page.label}</Link>
                  </li>
                ))}
              <li>
                <a href="https://platzhirsch.cafe/" className={linkClass}>Platzhirsch Café</a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} Platzhirsch Home Living. {t("allRightsReserved")}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li>
              <Link href="/impressum" locale={locale} className="hover:text-white">{t("imprint")}</Link>
            </li>
            <li>
              <Link href="/datenschutz" locale={locale} className="hover:text-white">{t("privacy")}</Link>
            </li>
            <li>
              <button type="button" onClick={() => setIsPopupVisible(true)} className="hover:text-white">
                {t("privacySettings")}
              </button>
            </li>
          </ul>
        </div>
      </div>

      {isPopupVisible && <CookieBanner forceShow={isPopupVisible} onClose={() => setIsPopupVisible(false)} />}
    </footer>
  );
}
