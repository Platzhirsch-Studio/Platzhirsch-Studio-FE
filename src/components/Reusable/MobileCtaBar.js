"use client";
import { PHONE_HREF } from "@/lib/site";
import { useEffect, useState } from "react";
import { Phone, CalendarDays } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/utils/routing";

// Phone-only sticky bar with the two conversion paths (call, appointment).
// Appears once the visitor has scrolled past the first screen, so it never
// covers the hero or the consent bar on arrival. Hidden from lg up — the
// desktop header already shows the phone number.
export default function MobileCtaBar() {
  const locale = useLocale();
  const t = useTranslations("Home");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-px border-t border-[#30373e]/10 bg-[#30373e]/10 shadow-[0_-8px_24px_rgba(31,37,43,0.12)] transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <a
        href={PHONE_HREF}
        tabIndex={visible ? 0 : -1}
        className="flex items-center justify-center gap-2 bg-white py-3.5 text-sm font-semibold text-[#30373e]"
      >
        <Phone size={18} aria-hidden="true" />
        {t("mobileCall")}
      </a>
      <Link
        href={ROUTES.beratung[locale] || ROUTES.beratung.de}
        locale={locale}
        tabIndex={visible ? 0 : -1}
        className="flex items-center justify-center gap-2 bg-[#30373e] py-3.5 text-sm font-semibold text-white"
      >
        <CalendarDays size={18} aria-hidden="true" />
        {t("mobileAppointment")}
      </Link>
    </div>
  );
}
