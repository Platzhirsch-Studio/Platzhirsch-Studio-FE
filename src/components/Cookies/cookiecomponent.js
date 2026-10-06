"use client";
import { useState, useEffect } from "react";
import { setCookie, getCookie, deleteCookie } from "cookies-next";
import { useTranslations } from "next-intl";
import CookieDetails from "./cookieItem";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { Dot } from "lucide-react";

// cookieData.js
// Only names, contacts and codes live here; every visible text (descriptions,
// purposes, cookie types, durations, countries, mechanisms) is translated via
// the "Cookies" namespace in src/messages/*.json, keyed by `id` / `code` / `key`.
const GA_ID = "G-1YCM6K57YG";

const GOOGLE_PROVIDER = "Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland";
const GOOGLE_PRIVACY = "https://policies.google.com/privacy";

// Third countries Google processes data in. Sub "A": covered by an EU adequacy
// decision; the rest get `otherSub` ("B" = standard contractual clauses).
const ADEQUACY_COUNTRIES = ["US", "CA", "IL", "JP", "KR", "CH", "GB"];
const THIRD_COUNTRIES = ["US", "AU", "BR", "CA", "CL", "HK", "IN", "ID", "IL", "JP", "KR", "QA", "SG", "CH", "TW", "GB"];
const thirdCountries = (otherSub) =>
  THIRD_COUNTRIES.map((code) => ({ code, sub: ADEQUACY_COUNTRIES.includes(code) ? "A" : otherSub }));
const GOOGLE_DATA_PROCESSING = {
  countries: thirdCountries("B"),
  mechanisms: [
    { key: "adequacy", sub: "A" },
    { key: "scc", sub: "B" },
  ],
};

const months = (count) => ({ count, unit: "month" });
const NO_EXPIRY = { unit: "none" };

export const cookieServices = {
  functional: {
    googleMaps: {
      id: "googleMaps",
      title: "Google Maps",
      provider: GOOGLE_PROVIDER,
      contact: { phone: "+1 650 253 0000", email: "dpo-google@google.com", privacy: GOOGLE_PRIVACY },
      cookies: [
        { name: "NID", type: "http", duration: months(6) },
        { name: "__Secure-3PSIDCC", type: "http", duration: { count: 1, unit: "year" } },
        { name: "__Secure-1PSIDCC", type: "http", duration: { count: 1, unit: "year" } },
        { name: "SIDCC", type: "http", duration: { count: 1, unit: "year" } },
        { name: "__Secure-3PAPISID", type: "http", duration: months(13) },
        { name: "SSID", type: "http", duration: months(13) },
        { name: "__Secure-1PAPISID", type: "http", duration: months(13) },
        { name: "__Secure-3PSID", type: "http", duration: months(13) },
        { name: "__Secure-1PSID", type: "http", duration: months(13) },
        { name: "SID", type: "http", duration: months(13) },
        { name: "SAPISID", type: "http", duration: months(13) },
        { name: "APISID", type: "http", duration: months(13) },
        { name: "CONSENT", type: "http", duration: months(13) },
        { name: "__Secure-ENID", type: "http", duration: months(13) },
        { name: "_c;;i", type: "localStorage", duration: NO_EXPIRY },
        { name: "LH;;s-*", type: "localStorage", duration: NO_EXPIRY },
        { name: "sb_wiz.zpc.gws-wiz.", type: "localStorage", duration: NO_EXPIRY },
        { name: "sb_wiz.ueh", type: "localStorage", duration: NO_EXPIRY },
      ],
      dataProcessing: {
        countries: thirdCountries(undefined),
        mechanisms: [{ key: "adequacy", sub: "A" }],
      },
    },
    googleTagManager: {
      id: "googleTagManager",
      title: "Google Tag Manager",
      provider: GOOGLE_PROVIDER,
      contact: { phone: "+1 650 253 0000", email: "dpo-google@google.com", privacy: GOOGLE_PRIVACY },
      dataProcessing: GOOGLE_DATA_PROCESSING,
    },
  },
  statistics: {
    googleAnalytics: {
      id: "googleAnalytics",
      title: "Google Analytics",
      provider: GOOGLE_PROVIDER,
      contact: { phone: "+353 1 543 1000", email: "dpo-google@google.com", privacy: GOOGLE_PRIVACY },
      cookies: [
        { name: "_ga", type: "http", duration: months(24) },
        { name: "_ga_*", type: "http", duration: months(24) },
      ],
      dataProcessing: GOOGLE_DATA_PROCESSING,
    },
  },
  marketing: {
    googleAds: {
      id: "googleAds",
      title: "Google Ads",
      provider: GOOGLE_PROVIDER,
      contact: { phone: "+1 650 253 0000", email: "dpo-google@google.com", privacy: GOOGLE_PRIVACY },
      cookies: [
        { name: "test_cookie", type: "http", duration: { count: 1, unit: "day" } },
        { name: "IDE", type: "http", duration: { count: 1, unit: "year" } },
        { name: "CONSENT", type: "http", duration: { count: 18, unit: "year" } },
        { name: "1P_JAR", type: "http", duration: months(1) },
        { name: "_gcl_au", type: "http", duration: months(3) },
      ],
      dataProcessing: GOOGLE_DATA_PROCESSING,
    },
  },
};

const DEFAULT_CONSENT = {
  essential: true,
  functional: false,
  statistics: false,
  marketing: false,
  // Individual services
  googleMaps: false,
  googleTagManager: false,
  googleAnalytics: false,
  googleAds: false,
};

// Google Consent Mode v2 update. The "default: denied" call runs first, in the
// <head> of src/app/[locale]/layout.js, which also defines window.gtag.
function sendConsentUpdate(consentState) {
  if (typeof window.gtag !== "function") return;
  const ads = consentState.googleAds ? "granted" : "denied";
  window.gtag("consent", "update", {
    analytics_storage: consentState.googleAnalytics ? "granted" : "denied",
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  });
}

// Loads GA once, only for a consent the visitor has already saved.
function loadGoogleAnalytics(consentState) {
  if (window.gtagInitialized) return;

  if (!document.querySelector(`script[src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"]`)) {
    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
  window.gtagInitialized = true;

  window.gtag("js", new Date());
  // Consent first, so GA's config already runs with the granted state.
  sendConsentUpdate(consentState);
  window.gtag("config", GA_ID, {
    anonymize_ip: true,
  });
}

export default function CookieBanner({ forceShow = false, onClose }) {
  const t = useTranslations("Cookies");
  const [isShown, setIsShown] = useState(false);
  const [isCompact, setIsCompact] = useState(true);
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);

  const [showBanner, setShowBanner] = useState(forceShow);
  const [expandedSections, setExpandedSections] = useState({
    functional: false,
    statistics: false,
    marketing: false,
  });
  const [expandedServices, setExpandedServices] = useState({});
  const [consent, setConsent] = useState(DEFAULT_CONSENT);

  useEffect(() => {
    const savedConsent = getCookie("cookieConsent");
    if (!savedConsent) {
      setShowBanner(true);
      return;
    }
    try {
      const consentState = JSON.parse(savedConsent);
      if (!consentState || typeof consentState !== "object" || Array.isArray(consentState)) {
        throw new Error("Invalid cookieConsent value");
      }
      const restored = { ...DEFAULT_CONSENT, ...consentState, essential: true };
      setConsent(restored);
      if (restored.googleAnalytics) loadGoogleAnalytics(restored);
      else sendConsentUpdate(restored);
    } catch {
      // Broken value (old format, extension, truncated) → drop it and ask again.
      deleteCookie("cookieConsent");
      setShowBanner(true);
    }
  }, []);

  useEffect(() => {
    // Update category consent based on individual services
    setConsent((prev) => ({
      ...prev,
      functional: prev.googleMaps && prev.googleTagManager,
      statistics: prev.googleAnalytics,
      marketing: prev.googleAds,
    }));
  }, [consent.googleMaps, consent.googleTagManager, consent.googleAnalytics, consent.googleAds]);

  const handleAcceptAll = () => {
    const newConsent = {
      essential: true,
      functional: true,
      statistics: true,
      marketing: true,
      googleMaps: true,

      googleTagManager: true,
      googleAnalytics: true,
      googleAds: true,
    };
    setConsent(newConsent);
    saveConsent(newConsent);
    window.location.reload();
  };

  const handleAcceptSelected = () => {
    saveConsent(consent);
    window.location.reload();
  };

  const handleRejectAll = () => {
    setConsent(DEFAULT_CONSENT);
    saveConsent(DEFAULT_CONSENT);
    window.location.reload();
  };

  const handleClose = () => {
    setShowBanner(false);
    if (onClose) onClose(); // Notify parent to reset forceShow
  };
  const saveConsent = (consentState) => {
    setCookie("cookieConsent", JSON.stringify(consentState), {
      maxAge: 60 * 60 * 24 * 365,
    });

    sendConsentUpdate(consentState);
  };

  const toggleConsent = (category) => {
    setConsent((prev) => {
      const newConsent = { ...prev };

      if (category === "functional") {
        const newValue = !prev.functional;
        newConsent.functional = newValue;
        newConsent.googleMaps = newValue;
        newConsent.googleTagManager = newValue;
      } else if (category === "statistics") {
        const newValue = !prev.statistics;
        newConsent.statistics = newValue;
        newConsent.googleAnalytics = newValue;
      } else if (category === "marketing") {
        const newValue = !prev.marketing;
        newConsent.marketing = newValue;
        newConsent.googleAds = newValue;
      } else {
        // Individual service toggle
        newConsent[category] = !prev[category];
      }

      return newConsent;
    });
  };

  const toggleCategoryDetails = (category) => {
    setExpandedSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const toggleServiceDetails = (service) => {
    setExpandedServices((prev) => ({
      ...prev,
      [service]: !prev[service],
    }));
  };
  const toggleCompact = () => {
    setIsCompact(!isCompact);
    setIsShown(true); // Ensure content is shown when expanding
  };

  // "Funktional (2)" etc. — the count is the number of services in the category.
  const categoryLabel = (category) =>
    `${t(`categories.${category}.name`)} (${Object.keys(cookieServices[category]).length})`;
  const detailsLabel = (expanded) => (expanded ? t("hideDetails") : t("showDetails"));

  if (!forceShow && !showBanner) return null;
  if (isCompact) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white text-[#30373e] shadow-lg z-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex- mb-4 md:mb-0 ">
            <h3 className="font-medium text-gray-900">{t("bannerTitle")}</h3>
            <p className="text-sm text-gray-600">{t("bannerText")}</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 text-white bg-gray-800 rounded-lg hover:bg-gray-800 transition-colors text-sm "
            >
              {t("acceptAll")}
            </button>
            <button
              onClick={handleRejectAll}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              {t("rejectAll")}
            </button>
            <button
              onClick={toggleCompact}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              {t("customize")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-60 backdrop-blur-sm" />
      <div className={`fixed inset-0 flex items-center justify-center z-60 pointer-events-none `}>
        <div className="max-h-[100dvh] h-full lg:max-w-[800px] lg:max-h-[90vh] bg-white text-[#30373e] lg:rounded-xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto overflow-y-auto relative lg:h-auto ">
          <h2 className="text-2xl font-bold text-gray-800 p-6 sticky bg-white z-10 pb-4 top-0 md:relative">
            {t("modalTitle")}
          </h2>
          {/* Header - Updated layout */}
          <div className="p-6 border-b border-gray-200 flex justify-between flex-col-reverse items-start md:flex-row relative">
            <div className="w-[100%] flex-1 md:w-[60%]">
              <p className="text-gray-600 text-sm">{t("intro")}</p>
            </div>
            <div className={`flex flex-col space-y-3 w-full md:w-[40%] md:ml-4 transition-all duration-200 mb-4`}>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-white bg-gray-800 rounded-lg hover:bg-gray-800 transition-colors text-sm whitespace-nowrap"
              >
                {t("acceptAll")}
              </button>
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
              >
                {t("rejectAll")}
              </button>
              <button
                onClick={handleAcceptSelected}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
              >
                {t("savePreferences")}
              </button>
            </div>
          </div>
          <p className="text-gray-600 mt-1 p-6 pb-2 text-xs">
            {t("thirdCountryNotice")}
            <br />
            <br />
            {t("consentModeNotice")}
          </p>
          <div className="mt-3">
            <p
              className={`text-center text-sm text-[var(--secondry)]/80  ${isShown && `hidden`} md:hidden pb-4 `}
              onClick={() => setIsShown(!isShown)}
            >
              {t("showPreferences")}
            </p>
          </div>

          {/* Scrollable Content - Keep this part exactly the same */}
          <div className={`flex-1 p-6 space-y-6 ${isShown ? "block" : "hidden"} md:block`}>
            {/* Essential Cookies */}
            <div className="space-y-2 border border-[#30373e]/20 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <label htmlFor="essential-cookies" className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="essential-cookies"
                      checked={consent.essential}
                      disabled
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-900">{t("categories.essential.name")}</span>
                  </label>
                </div>
              </div>
              <p className="text-sm text-gray-500 ml-8">{t("categories.essential.description")}</p>
            </div>

            {/* Functional Cookies */}
            <div className="space-y-4 border border-[#30373e]/20 p-6">
              <div className="flex items-center justify-start gap-2 ">
                <div className="flex items-center space-x-3">
                  <label htmlFor="functional-cookies" className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="functional-cookies"
                      checked={consent.functional}
                      onChange={() => toggleConsent("functional")}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-900">{categoryLabel("functional")}</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-start gap-2">
                <p className="text-sm text-gray-500 ml-8">
                  {t("categories.functional.description")}&nbsp;&nbsp;
                  <span
                    onClick={() => toggleCategoryDetails("functional")}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {detailsLabel(expandedSections.functional)}
                  </span>
                </p>
              </div>
              {expandedSections.functional && (
                <>
                  {/* Google Maps */}
                  <div className="ml-8 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <label htmlFor="google-maps" className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="google-maps"
                            checked={consent.googleMaps}
                            onChange={() => toggleConsent("googleMaps")}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium text-black">{cookieServices.functional.googleMaps.title}</span>
                        </label>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 ml-8">
                      {t("services.googleMaps.description")}&nbsp;&nbsp;
                      <span
                        onClick={() => toggleServiceDetails("googleMaps")}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {detailsLabel(expandedServices.googleMaps)}
                      </span>
                    </p>
                    {expandedServices.googleMaps && <CookieDetails service={cookieServices.functional.googleMaps} />}
                  </div>

                  {/* Google Tag Manager */}
                  <div className="ml-8 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <label htmlFor="google-tag-manager" className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="google-tag-manager"
                            checked={consent.googleTagManager}
                            onChange={() => toggleConsent("googleTagManager")}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium text-black">
                            {cookieServices.functional.googleTagManager.title}
                          </span>
                        </label>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 ml-8">
                      {t("services.googleTagManager.description")}&nbsp;&nbsp;
                      <span
                        onClick={() => toggleServiceDetails("googleTagManager")}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {detailsLabel(expandedServices.googleTagManager)}
                      </span>
                    </p>
                    {expandedServices.googleTagManager && (
                      <CookieDetails service={cookieServices.functional.googleTagManager} />
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Statistics Cookies */}
            <div className="space-y-4 border border-[#30373e]/20 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <label htmlFor="statistics-cookies" className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="statistics-cookies"
                      checked={consent.statistics}
                      onChange={() => toggleConsent("statistics")}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-900">{categoryLabel("statistics")}</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-start gap-2">
                <p className="text-sm text-gray-500 ml-8">
                  {t("categories.statistics.description")}&nbsp;&nbsp;
                  <span
                    onClick={() => toggleCategoryDetails("statistics")}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {detailsLabel(expandedSections.statistics)}
                  </span>
                </p>
              </div>
              {expandedSections.statistics && (
                <div className="ml-8 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <label htmlFor="google-analytics" className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="google-analytics"
                          checked={consent.googleAnalytics}
                          onChange={() => toggleConsent("googleAnalytics")}
                          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-black">
                          {cookieServices.statistics.googleAnalytics.title}
                        </span>
                      </label>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 ml-8">
                    {t("services.googleAnalytics.description")}&nbsp;&nbsp;{" "}
                    <span
                      onClick={() => toggleServiceDetails("googleAnalytics")}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {detailsLabel(expandedServices.googleAnalytics)}
                    </span>
                  </p>
                  {expandedServices.googleAnalytics && (
                    <CookieDetails service={cookieServices.statistics.googleAnalytics} />
                  )}
                </div>
              )}
            </div>

            {/* Marketing Cookies */}
            <div className="space-y-4 border border-[#30373e]/20 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <label htmlFor="marketing-cookies" className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="marketing-cookies"
                      checked={consent.marketing}
                      onChange={() => toggleConsent("marketing")}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-900">{categoryLabel("marketing")}</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-start gap-2">
                <p className="text-sm text-gray-500 ml-8">
                  {t("categories.marketing.description")}&nbsp;&nbsp;
                  <span
                    onClick={() => toggleCategoryDetails("marketing")}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {detailsLabel(expandedSections.marketing)}
                  </span>
                </p>
              </div>
              {expandedSections.marketing && (
                <div className="ml-8 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <label htmlFor="google-ads" className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="google-ads"
                          checked={consent.googleAds}
                          onChange={() => toggleConsent("googleAds")}
                          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-black">{cookieServices.marketing.googleAds.title}</span>
                      </label>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 ml-8">
                    {t("services.googleAds.description")}&nbsp;&nbsp;
                    <span
                      onClick={() => toggleServiceDetails("googleAds")}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {detailsLabel(expandedServices.googleAds)}
                    </span>
                  </p>
                  {expandedServices.googleAds && <CookieDetails service={cookieServices.marketing.googleAds} />}
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-gray-200 bg-gray-50 p-2 sticky bottom-0">
            <p className="text-center text-sm text-gray-600 gap-1 flex justify-center items-center">
              <Link href={"/datenschutz"} locale={locale}>
                {t("privacyPolicy")}
              </Link>
              <Dot />
              <Link href={"/impressum"} locale={locale}>
                {t("imprint")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
