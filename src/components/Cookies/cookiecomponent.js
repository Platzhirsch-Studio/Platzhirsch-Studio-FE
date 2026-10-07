"use client";
import { useEffect, useRef, useState } from "react";
import { setCookie, getCookie, deleteCookie } from "cookies-next";
import { useTranslations } from "next-intl";
import CookieDetails from "./cookieItem";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { Dot, X } from "lucide-react";

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
  ensureGtag();
  const ads = consentState.googleAds ? "granted" : "denied";
  window.gtag("consent", "update", {
    analytics_storage: consentState.googleAnalytics ? "granted" : "denied",
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  });
}

// Google Consent Mode v2 default: everything denied until the visitor's
// choice is applied. Runs on the dataLayer *before* gtag.js is requested (see
// loadGoogleAnalytics), which is the only place a Google tag is loaded at all.
// This used to be an inline <script> in the <head> of [locale]/layout.js; a
// plain <script> element inside the React tree is re-created on every
// client-side locale switch and React logs "Encountered a script tag while
// rendering React component" — the error that showed up when changing the
// language. No Google tag runs without consent, so nothing is lost by
// setting the default here instead.
function ensureGtag() {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
  if (!window.phConsentDefaultSet) {
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      wait_for_update: 500,
    });
    window.phConsentDefaultSet = true;
  }
}

// Removes Google Analytics' own cookies when analytics consent is withdrawn
// (a "denied" consent update alone leaves the already-set _ga/_ga_* in place).
function removeAnalyticsCookies() {
  const names = document.cookie.split(";").map((c) => c.trim().split("=")[0]).filter((n) => n === "_ga" || n.startsWith("_ga_"));
  const host = window.location.hostname;
  const domains = [undefined, host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

// Loads GA once, only for a consent the visitor has already saved. The consent
// update is sent on EVERY call (accept → reject → accept in one session must
// re-grant), only the script injection and config happen once.
function loadGoogleAnalytics(consentState) {
  // Default + granted update are queued before the library loads, so GA's
  // config already runs with the right consent state.
  ensureGtag();
  sendConsentUpdate(consentState);
  if (window.gtagInitialized) return;

  if (!document.querySelector(`script[src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"]`)) {
    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
  window.gtagInitialized = true;

  window.gtag("js", new Date());
  window.gtag("config", GA_ID, {
    anonymize_ip: true,
  });
}

export default function CookieBanner({ forceShow = false, onClose }) {
  const t = useTranslations("Cookies");
  const [isShown, setIsShown] = useState(false);
  // Opened from the footer's "privacy settings" (forceShow): straight to the
  // settings dialog, not the compact bar.
  const [isCompact, setIsCompact] = useState(!forceShow);
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

  // Consent granted elsewhere (ConsentEmbed's "load map" button) → keep this
  // banner's state in sync, so "save selection" can't overwrite it with stale values.
  useEffect(() => {
    const onChange = (event) => {
      const next = event?.detail;
      if (next && typeof next === "object" && !Array.isArray(next)) {
        setConsent((prev) => ({ ...prev, ...next, essential: true }));
      }
    };
    window.addEventListener("ph-consent-change", onChange);
    return () => window.removeEventListener("ph-consent-change", onChange);
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
  };

  const handleAcceptSelected = () => {
    saveConsent(consent);
  };

  const handleRejectAll = () => {
    setConsent(DEFAULT_CONSENT);
    saveConsent(DEFAULT_CONSENT);
  };

  const handleClose = () => {
    setIsCompact(true);
    // Dismissing the settings dialog (Escape, backdrop) without a decision must
    // not hide the consent bar for the rest of the SPA session: without a saved
    // choice the compact bar stays (nothing loads until the visitor decides).
    if (forceShow || getCookie("cookieConsent")) setShowBanner(false);
    if (onClose) onClose(); // Notify parent to reset forceShow
  };

  // Persist + apply the choice in place. Previously every button did a full
  // window.location.reload() — a jarring flash on the very first interaction
  // and a hit on LCP/INP field data. Now: cookie, Consent Mode update, GA load
  // (if granted), notify consent-gated embeds (ConsentEmbed), close.
  const saveConsent = (consentState) => {
    setCookie("cookieConsent", JSON.stringify(consentState), {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: window.location.protocol === "https:",
    });

    if (consentState.googleAnalytics) {
      loadGoogleAnalytics(consentState);
    } else {
      sendConsentUpdate(consentState);
      removeAnalyticsCookies();
    }
    window.dispatchEvent(new CustomEvent("ph-consent-change", { detail: consentState }));
    handleClose();
  };

  // Escape closes the settings dialog without saving; focus moves into it on open.
  const dialogRef = useRef(null);
  useEffect(() => {
    if (isCompact || !(forceShow || showBanner)) return;
    dialogRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompact, forceShow, showBanner]);

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
      <section
        role="region"
        aria-label={t("bannerTitle")}
        className="fixed bottom-0 left-0 right-0 bg-white text-[#30373e] shadow-lg z-50 border-t border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            {/* Not a heading: the bar is on every page and must not join the outline. */}
            <p className="font-medium text-gray-900">{t("bannerTitle")}</p>
            <p className="text-sm text-gray-600">{t("bannerText")}</p>
          </div>
          {/* Accept and Reject get the same weight (no dark-pattern nudge); compact
              two-column layout on phones so the bar covers less of the page. */}
          <div className="grid grid-cols-2 md:flex gap-2 md:gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-4 py-2.5 text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              {t("acceptAll")}
            </button>
            <button
              type="button"
              onClick={handleRejectAll}
              className="px-4 py-2.5 text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              {t("rejectAll")}
            </button>
            <button
              type="button"
              onClick={toggleCompact}
              className="col-span-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              {t("customize")}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-60 backdrop-blur-sm" onClick={handleClose} />
      <div className={`fixed inset-0 flex items-center justify-center z-60 pointer-events-none `}>
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-settings-title"
          tabIndex={-1}
          className="max-h-[100dvh] h-full lg:max-w-[800px] lg:max-h-[90vh] bg-white text-[#30373e] lg:rounded-xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto overflow-y-auto relative lg:h-auto outline-none"
        >
          <div className="flex items-start justify-between gap-4 p-6 pb-4 sticky bg-white z-10 top-0 md:relative">
            <h2 id="cookie-settings-title" className="text-2xl font-bold text-gray-800">
              {t("modalTitle")}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              aria-label={t("close")}
              className="-mr-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
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
            <button
              type="button"
              className={`block w-full text-center text-sm text-[#30373e]/80 underline ${isShown ? "hidden" : ""} md:hidden pb-4`}
              onClick={() => setIsShown(!isShown)}
              aria-expanded={isShown}
            >
              {t("showPreferences")}
            </button>
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
