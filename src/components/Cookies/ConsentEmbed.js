"use client";
import { useEffect, useState } from "react";
import { getCookie, setCookie } from "cookies-next";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";

// Consent gate for third-party embeds (Google Maps / Street View iframes).
// The cookie banner lists Google Maps as an opt-in "functional" service, but
// the iframes used to load unconditionally — i.e. before any consent (GDPR /
// TTDSG issue). The embed now renders only when `cookieConsent.<service>` is
// true; otherwise a placeholder with a one-click "load map" button that stores
// that single service consent (and keeps everything else as it was).
// `ph-consent-change` is dispatched by the cookie banner whenever consent is
// saved, so an open page updates without a reload.
const CONSENT_EVENT = "ph-consent-change";

function readConsent() {
  try {
    const raw = getCookie("cookieConsent");
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export default function ConsentEmbed({ service = "googleMaps", className = "", children }) {
  const t = useTranslations("Cookies");
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => setAllowed(Boolean(readConsent()[service]));
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, [service]);

  const allow = () => {
    const current = readConsent();
    const next = { ...current, essential: true, [service]: true };
    // Category flag mirrors the banner's own rule (functional = Maps AND GTM).
    if (service === "googleMaps" || service === "googleTagManager") {
      next.functional = Boolean(next.googleMaps && next.googleTagManager);
    }
    setCookie("cookieConsent", JSON.stringify(next), {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: window.location.protocol === "https:",
    });
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: next }));
    setAllowed(true);
  };

  if (allowed) return children;

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-4 bg-[#f3f1ec] px-6 py-10 text-center text-[#30373e] ${className}`}
    >
      <MapPin size={32} className="text-[#7a5f17]" aria-hidden="true" />
      <p className="text-base font-semibold">{t("embedTitle")}</p>
      <p className="max-w-md text-sm text-[#30373e]/75">{t("embedText")}</p>
      <button
        type="button"
        onClick={allow}
        className="rounded-[3px] bg-[#30373e] px-6 py-3 text-sm font-medium uppercase tracking-wide text-white transition-colors hover:bg-[#d1b250] hover:text-[#30373e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1b250]"
      >
        {t("embedButton")}
      </button>
    </div>
  );
}
