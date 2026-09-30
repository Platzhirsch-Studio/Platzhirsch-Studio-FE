"use client";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { ROUTES } from "@/utils/routing";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { PhoneCall } from "lucide-react";
import Image from "next/image";
import footerimg from "../../../public/Images/Navbar/Logo.png";
import CookieBanner from "../Cookies/cookiecomponent";
import { useTranslations } from "next-intl";

// Top brands surfaced site-wide in the footer — distributes internal-link equity to
// the brand-dealer money pages (the site's primary SEO target). Kept to ~10 to stay
// natural rather than a link farm; "Alle Marken" covers the rest.
const TOP_BRANDS = [
  { name: "Minotti", slug: "minotti" },
  { name: "Poliform", slug: "poliform" },
  { name: "Flos", slug: "flos" },
  { name: "Rimadesio", slug: "rimadesio" },
  { name: "Paola Lenti", slug: "paola-lenti" },
  { name: "Tom Dixon", slug: "tom-dixon" },
  { name: "Eichholtz", slug: "eichholtz" },
  { name: "Gloster", slug: "gloster" },
  { name: "Tonon", slug: "tonon" },
  { name: "ClassiCon", slug: "classicon" },
  { name: "Next125", slug: "next125" },
];

// Local landing pages (src/app/[locale]/<slug>/page.js), listed under
// "Über uns" on the German site only.
const LANDING_PAGES = [
  { href: "/kuechen-vorarlberg", label: "Küchen Vorarlberg" },
  { href: "/wohnzimmer-einrichten-vorarlberg", label: "Wohnzimmer einrichten" },
  { href: "/interior-design-vorarlberg", label: "Interior Design" },
  { href: "/designermoebel-bregenz", label: "Designermöbel Bregenz" },
  { href: "/moebel-bodensee", label: "Möbel Bodensee" },
];

export default function Footer() {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [year] = useState(new Date().getFullYear());
  const t = useTranslations("Footer")

  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);

  const handleShowPopup = () => setIsPopupVisible(true);

  return (
    <div className="relative w-full text-white">
      <div className="relative w-full bg-gray-800">
        <footer className="w-full py-8 px-8 md:px-8">
          {/* German site: 5 columns only from xl (desktop) — below that the extra
              "Leistungen & Regionen" cell flows as its own column (3 per row).
              Other languages keep 5 columns from lg, as before. */}
          <div
            className={`max-w-7xl pt-7 mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 ${
              locale === "de" ? "xl:grid-cols-5" : "lg:grid-cols-5"
            }`}
          >
            {/* Column 1 */}
            <div>
              <Image
                src={footerimg}
                alt="Platzhirsch Logo"
                width={160}
                className="mb-5 h-auto"
                sizes="160px"
              />
              <div className="flex items-center gap-3 mb-4 text-[#d1b250]">
                <PhoneCall size={20} />
                <div>
                  <a href="tel:+43557446255" className="font-bold text-white text-lg hover:text-[#d1b250] transition">+43 5574 46255</a>
                  <p className="text-xs text-[#d1b250]">{t("contactUs")}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-4 text-gray-400 text-xl">
                <a href="https://www.facebook.com/platzhirsch.studio/" target="_blank" aria-label="Facebook" rel="noreferrer" className="border border-[#d1b250] w-8 h-8 flex items-center justify-center rounded-full text-[#d1b250] hover:bg-[#d1b250] hover:text-white"><FaFacebookF /></a>
                <a href="https://www.instagram.com/platzhirsch.studio/" target="_blank" aria-label="Instagram" rel="noreferrer" className="border border-[#d1b250] w-8 h-8 flex items-center justify-center rounded-full text-[#d1b250] hover:bg-[#d1b250] hover:text-white"><FaInstagram /></a>
                <a
                  href="https://www.linkedin.com/company/platzhirsch-studio"
                  target="_blank"
                  aria-label="LinkedIn"
                  rel="noopener noreferrer"
                  className="border border-[#d1b250] w-8 h-8 flex items-center justify-center rounded-full text-[#d1b250] hover:bg-[#d1b250] hover:text-white"
                >
                  <FaLinkedinIn />
                </a>
              </div>
            </div>

            {/* Column 2 — "Über uns" + (German only) "Leistungen & Regionen".
                Below xl (desktop) the wrapper is `display: contents`, so both
                blocks become their own grid cells and flow like the other
                columns on phones/tablets; from xl up they share one column. */}
            <div className="contents xl:block">
              <div>
                <h3 className="text-md font-semibold mb-4 text-white">{t("aboutUs")}</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>{t("address.line1")}</li>
                  <li>{t("address.line2")}</li>
                  <li>{t("address.country")}</li>
                  <li>{t("emailLabel")}</li>
                  <li>
                    <a href="mailto:info@platzhirsch.studio" className="hover:text-white transition">
                      info@platzhirsch.studio
                    </a>
                  </li>
                </ul>
              </div>

              {/* Local landing pages — German only (the pages don't exist in
                  en/fr/it), so they're shown on the German site only. */}
              {locale === "de" && (
                <div className="xl:mt-6">
                  <h3 className="text-md font-semibold mb-4 xl:mb-3 text-white">Leistungen &amp; Regionen</h3>
                  <ul className="space-y-2 text-sm text-gray-400">
                    {LANDING_PAGES.map((page) => (
                      <li key={page.href}>
                        <Link href={page.href} locale="de" className="hover:text-white transition">
                          {page.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Column 3 */}
            <div>
              <h3 className="text-md font-semibold mb-4 text-white">{t("openingHoursTitle")}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>{t("openingHours.tuesday")}</li>
                <li>{t("openingHours.wednesday")}</li>
                <li>{t("openingHours.thursday")}</li>
                <li>{t("openingHours.friday")}</li>
                <li>{t("openingHours.saturday")}</li>
                <li>{t("openingHours.sunday")}</li>
                <li>{t("openingHours.monday")}</li>
                <li className="lg:w-50">
                  {t("appointment")}
                </li>
              </ul>
            </div>

            {/* Column: Top Brands (internal links to brand pages) */}
            <div>
              <h3 className="text-md font-semibold mb-4 text-white">{t("brandsTitle")}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                {TOP_BRANDS.map((b) => (
                  <li key={b.slug}>
                    <Link href={`${ROUTES.marken[locale]}/${b.slug}`} locale={locale} className="hover:text-white transition">
                      {b.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href={ROUTES.marken[locale]} locale={locale} className="hover:text-white transition font-medium text-[#d1b250]">
                    {t("allBrands")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <h3 className="text-md font-semibold mb-4 text-white">{t("linksTitle")}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/newsletter" locale={locale} className="hover:text-white transition">
                    {t("newsletter")}
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.kontakt[locale]} locale={locale} className="hover:text-white transition">
                    {t("contact")}
                  </Link>
                </li>
                <li>
                  {/* External, do not add locale */}
                  <a href="https://platzhirsch.cafe/" className="hover:text-white transition">
                    Platzhirsch Café
                  </a>
                </li>
                <li>
                  <button onClick={handleShowPopup} className="hover:text-white cursor-pointer transition text-left">
                    {t("privacySettings")}
                  </button>
                </li>
                <li>
                  <Link href="/datenschutz" locale={locale} className="hover:text-white transition text-left">
                    {t("privacy")}
                  </Link>
                </li>
                <li>
                  <Link href="/impressum" locale={locale} className="hover:text-white transition">
                    {t("imprint")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <hr className="border-t border-gray-600 w-full mt-15 p-0" />
          <div className="mt-8 mb-0 text-center text-xs text-gray-400">
            {/* allRightsReserved already ends with a period in every language. */}
            &copy; {year} Platzhirsch Home Living. {t("allRightsReserved")}
          </div>
        </footer>
      </div>

      {isPopupVisible && (
        <CookieBanner forceShow={isPopupVisible} onClose={() => setIsPopupVisible(false)} />
      )}
    </div>
  );
}
