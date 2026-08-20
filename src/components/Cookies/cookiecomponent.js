"use client";
import { useState, useEffect } from "react";
import { setCookie, getCookie } from "cookies-next";
import CookieDetails from "./cookieItem";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { Dot } from "lucide-react";
// cookieData.js
export const cookieServices = {

  functional: {
    googleMaps: {
      title: "Google Maps",
      description: "Enables embedding of interactive maps on our website.",
      purpose:
        "Google Maps enables the embedding of maps directly into websites to enhance the website. This requires processing the user’s IP-address and metadata. Cookies or cookie-like technologies can be stored and read. These can contain personal data and technical data like user ID, consent, settings of the map viewer and security tokens. This data can be used to collect visited websites, detailed statistics about user behavior, and it can be used to improve the services of Google. This data may be linked by Google to the data of users logged in on the websites of Google (e.g. google.com and youtube.com). Google provides personal information to their affiliates and other trusted businesses or persons to process it for them, based on Google's instructions and in compliance with Google's privacy policy.",
      provider: "Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland",
      contact: {
        phone: "+1 650 253 0000",
        email: "dpo-google@google.com",
        privacy: "https://policies.google.com/privacy",
      },
      cookies: [
        { name: "NID", type: "HTTP Cookie", duration: "6 months" },
        { name: "__Secure-3PSIDCC", type: "HTTP Cookie", duration: "1 year" },
        { name: "__Secure-1PSIDCC", type: "HTTP Cookie", duration: "1 year" },
        { name: "SIDCC", type: "HTTP Cookie", duration: "1 year" },
        { name: "__Secure-3PAPISID", type: "HTTP Cookie", duration: "13 months" },
        { name: "SSID", type: "HTTP Cookie", duration: "13 months" },
        { name: "__Secure-1PAPISID", type: "HTTP Cookie", duration: "13 months" },
        { name: "__Secure-3PSID", type: "HTTP Cookie", duration: "13 months" },
        { name: "__Secure-1PSID", type: "HTTP Cookie", duration: "13 months" },
        { name: "SID", type: "HTTP Cookie", duration: "13 months" },
        { name: "SAPISID", type: "HTTP Cookie", duration: "13 months" },
        { name: "APISID", type: "HTTP Cookie", duration: "13 months" },
        { name: "CONSENT", type: "HTTP Cookie", duration: "13 months" },
        { name: "__Secure-ENID", type: "HTTP Cookie", duration: "13 months" },
        { name: "_c;;i", type: "Local Storage", duration: "No expiry" },
        { name: "LH;;s-*", type: "Local Storage", duration: "No expiry" },
        { name: "sb_wiz.zpc.gws-wiz.", type: "Local Storage", duration: "No expiry" },
        { name: "sb_wiz.ueh", type: "Local Storage", duration: "No expiry" },
      ],
      dataProcessing: {
        countries: [
          { name: "Vereinigte Staaten", sub: "A" },
          { name: "Australien" },
          { name: "Brasilien" },
          { name: "KanadaA", sub: "A" },
          { name: "Chile" },
          { name: "Hong Kong" },
          { name: "Indien" },
          { name: "Indonesien" },
          { name: "Israel", sub: "A" },
          { name: "Japan", sub: "A" },
          { name: "Korea", sub: "A" },
          { name: "Katar" },
          { name: "Singapur" },
          { name: "Schweiz", sub: "A" },
          { name: "Taiwan" },
          { name: "Vereinigtes Königreich", sub: "A" },
        ],
        mechanisms: [{ name: "Angemessenheitsbeschluss", sub: "A" }],
      },
    },
    googleTagManager: {
      title: "Google Tag Manager",
      description: "Manages tags and scripts on our website.",
      purpose: "Service for managing tags triggered by specific events.",
      provider: "Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland",
      contact: {
        phone: "+1 650 253 0000",
        email: "dpo-google@google.com",
        privacy: "https://policies.google.com/privacy",
      },
      dataProcessing: {
        countries: [
          { name: "Vereinigte Staaten", sub: "A" },
          { name: "Australien", sub: "B" },
          { name: "Brasilien", sub: "B" },
          { name: "KanadaA", sub: "A" },
          { name: "Chile", sub: "B" },
          { name: "Hong Kong", sub: "B" },
          { name: "Indien", sub: "B" },
          { name: "Indonesien", sub: "B" },
          { name: "Israel", sub: "A" },
          { name: "Japan", sub: "A" },
          { name: "Korea", sub: "A" },
          { name: "Katar", sub: "B" },
          { name: "Singapur", sub: "B" },
          { name: "Schweiz", sub: "A" },
          { name: "Taiwan", sub: "B" },
          { name: "Vereinigtes Königreich", sub: "A" },
        ],
        mechanisms: [
          { name: "Angemessenheitsbeschluss", sub: "A" },
          { name: "StandardvertragsklauselnB", sub: "B" },
        ],
      },
    },
  },
  statistics: {
    googleAnalytics: {
      title: "Google Analytics",
      description: "Provides detailed statistics about user behavior on the website.",
      purpose:
        "Google Analytics creates detailed statistics about user behavior on the website, including the processing of IP address and metadata, which can help determine a user's country, city, and language. It tracks page views, time spent on pages, device usage, and more.",
      provider: "Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland",
      contact: {
        phone: "+353 1 543 1000",
        email: "dpo-google@google.com",
        privacy: "https://policies.google.com/privacy",
      },
      cookies: [
        { name: "_ga", type: "HTTP Cookie", duration: "24 months" },
        { name: "_ga_*", type: "HTTP Cookie", duration: "24 months" },
      ],
      dataProcessing: {
        countries: [
          { name: "Vereinigte Staaten", sub: "A" },
          { name: "Australien", sub: "B" },
          { name: "Brasilien", sub: "B" },
          { name: "KanadaA", sub: "A" },
          { name: "Chile", sub: "B" },
          { name: "Hong Kong", sub: "B" },
          { name: "Indien", sub: "B" },
          { name: "Indonesien", sub: "B" },
          { name: "Israel", sub: "A" },
          { name: "Japan", sub: "A" },
          { name: "Korea", sub: "A" },
          { name: "Katar", sub: "B" },
          { name: "Singapur", sub: "B" },
          { name: "Schweiz", sub: "A" },
          { name: "Taiwan", sub: "B" },
          { name: "Vereinigtes Königreich", sub: "A" },
        ],
        mechanisms: [
          { name: "Angemessenheitsbeschluss", sub: "A" },
          { name: "StandardvertragsklauselnB", sub: "B" },
        ],
      },
    },
  },
  marketing: {
    googleAds: {
      title: "Google Ads",
      description: "Tracks conversions and enables remarketing for Google Ads campaigns.",
      purpose:
        "Google Ads Conversion Tracking tracks the conversion rate and success of Google Ads campaigns, using cookies to differentiate users and track their behavior. It also enables remarketing, displaying targeted ads to users who have already interacted with a Google Ads ad.",
      provider: "Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland",
      contact: {
        phone: "+1 650 253 0000",
        email: "dpo-google@google.com",
        privacy: "https://policies.google.com/privacy",
      },
      cookies: [
        { name: "test_cookie", type: "HTTP Cookie", duration: "1 day" },
        { name: "IDE", type: "HTTP Cookie", duration: "1 year" },
        { name: "CONSENT", type: "HTTP Cookie", duration: "18 years" },
        { name: "1P_JAR", type: "HTTP Cookie", duration: "1 month" },
        { name: "_gcl_au", type: "HTTP Cookie", duration: "3 months" },
      ],
      dataProcessing: {
        countries: [
          { name: "Vereinigte Staaten", sub: "A" },
          { name: "Australien", sub: "B" },
          { name: "Brasilien", sub: "B" },
          { name: "KanadaA", sub: "A" },
          { name: "Chile", sub: "B" },
          { name: "Hong Kong", sub: "B" },
          { name: "Indien", sub: "B" },
          { name: "Indonesien", sub: "B" },
          { name: "Israel", sub: "A" },
          { name: "Japan", sub: "A" },
          { name: "Korea", sub: "A" },
          { name: "Katar", sub: "B" },
          { name: "Singapur", sub: "B" },
          { name: "Schweiz", sub: "A" },
          { name: "Taiwan", sub: "B" },
          { name: "Vereinigtes Königreich", sub: "A" },
        ],
        mechanisms: [
          { name: "Angemessenheitsbeschluss", sub: "A" },
          { name: "StandardvertragsklauselnB", sub: "B" },
        ],
      },
    },
  },
};

export default function CookieBanner({ forceShow = false, onClose }) {
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
  const [consent, setConsent] = useState({
    essential: true,
    functional: false,
    statistics: false,
    marketing: false,
    // Individual services
    googleMaps: false,
    googleTagManager: false,
    googleAnalytics: false,
    googleAds: false,
  });

  useEffect(() => {
    if (!getCookie("cookieConsent")) {
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
    const newConsent = {
      essential: true,
      functional: false,
      statistics: false,
      marketing: false,
      googleMaps: false,
      googleTagManager: false,
      googleAnalytics: false,
      googleAds: false,
    };

    setConsent(newConsent);
    saveConsent(newConsent);
    window.location.reload();
  };

  useEffect(() => {
    if (consent.googleAnalytics && !window.gtagInitialized) {
      const existingScript = document.querySelector(
        'script[src="https://www.googletagmanager.com/gtag/js?id=G-1YCM6K57YG"]'
      );

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://www.googletagmanager.com/gtag/js?id=G-1YCM6K57YG";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }

      window.gtag = gtag;
      window.gtagInitialized = true;

      gtag("js", new Date());
      gtag("config", "G-1YCM6K57YG", {
        anonymize_ip: true,
      });

      gtag("consent", "update", {
        analytics_storage: "granted",
      });
    }
  }, [consent.googleAnalytics]);

  const handleClose = () => {
    setShowBanner(false);
    if (onClose) onClose(); // Notify parent to reset forceShow
  };
  const saveConsent = (consentState) => {
    setCookie("cookieConsent", JSON.stringify(consentState), {
      maxAge: 60 * 60 * 24 * 365,
    });

    // Handle GA consent
    if (window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: consentState.googleAnalytics ? "granted" : "denied",
        ad_storage: consentState.googleAds ? "granted" : "denied",
      });
    }
  };
  useEffect(() => {
    const savedConsent = getCookie("cookieConsent");
    if (savedConsent) {
      const consentState = JSON.parse(savedConsent);
      setConsent(consentState);
    }
  }, []);

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

  if (!forceShow && !showBanner) return null;
  if (isCompact) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex- mb-4 md:mb-0 ">
            <h3 className="font-medium text-gray-900">Cookie-Einstellungen</h3>
            <p className="text-sm text-gray-600">
              Wir verwenden Cookies, um Ihnen das beste Nutzererlebnis bieten zu können.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 text-white bg-gray-800 rounded-lg hover:bg-gray-800 transition-colors text-sm "
            >
              Alle akzeptieren
            </button>
            <button
              onClick={handleRejectAll}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Weiter ohne Einwilligung
            </button>
            <button
              onClick={toggleCompact}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Individuelle Einstellungen
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
        <div className="max-h-[100dvh] h-full lg:max-w-[800px] lg:max-h-[90vh] bg-white lg:rounded-xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto overflow-y-auto relative lg:h-auto ">
          <h2 className="text-2xl font-bold text-gray-800 p-6 sticky bg-white z-10 pb-4 top-0 md:relative">
            Individuelle Privatsphäre-Präferenzen
          </h2>
          {/* Header - Updated layout */}
          <div className="p-6 border-b border-gray-200 flex justify-between flex-col-reverse items-start md:flex-row relative">
            <div className="w-[100%] flex-1 md:w-[60%]">
              <p className="text-gray-600 text-sm">
                Wir verwenden Cookies und ähnliche Technologien auf unserer Website und verarbeiten personenbezogene
                Daten über Sie, wie Ihre IP-Adresse. Wir teilen diese Daten auch mit Dritten. Die Datenverarbeitung kann
                mit Ihrer Einwilligung oder auf der Grundlage eines berechtigten Interesses erfolgen, dem Sie
                widersprechen können. Sie haben das Recht, nur in essenzielle Services einzuwilligen und Ihre
                Einwilligung zu einem späteren Zeitpunkt in der Datenschutzerklärung zu ändern oder zu widerrufen.
                Nachfolgend finden Sie eine Übersicht über alle Services, die von dieser Website genutzt werden. Sie
                können detaillierte Informationen zu jedem Service einsehen und diesen einzeln zustimmen oder von Ihrem
                Widerspruchsrecht Gebrauch machen.
              </p>
            </div>
            <div className={`flex flex-col space-y-3 w-full md:w-[40%] md:ml-4 transition-all duration-200 mb-4`}>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-white bg-gray-800 rounded-lg hover:bg-gray-800 transition-colors text-sm whitespace-nowrap"
              >
                Alle akzeptieren
              </button>
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
              >
                Weiter ohne Einwilligung
              </button>
              <button
                onClick={handleAcceptSelected}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
              >
                Individuelle Privatsphäre-Präferenzen
              </button>
            </div>
          </div>
          <p className="text-gray-600 mt-1 p-6 pb-2 text-xs">
            Einige Dienste verarbeiten personenbezogene Daten in unsicheren Drittländern. Indem Sie in die Nutzung
            dieser Services einwilligen, erklären Sie sich auch mit der Verarbeitung Ihrer Daten in diesen unsicheren
            Drittländern gemäß Art. 49 Abs. 1 lit. a DSGVO einverstanden. Dies birgt das Risiko, dass Ihre Daten von
            Behörden zu Kontroll- und Überwachungszwecken verarbeitet werden, möglicherweise ohne die Möglichkeit eines
            Rechtsbehelfs.
            <br />
            <br />
            Außerdem erlauben Sie die Datenverarbeitung gemäß dem Google Consent Mode von Teilnehmenden Partnern auf der
            Grundlage Ihrer Einwilligung für die folgenden Zwecke:
          </p>
          <div className="mt-3">
            <p
              className={`text-center text-sm text-[var(--secondry)]/80  ${isShown && `hidden`} md:hidden pb-4 `}
              onClick={() => setIsShown(!isShown)}
            >
              Individuelle Privatsphäre-Präferenzen
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
                    <span className="font-medium text-gray-900">Essential</span>
                  </label>
                </div>
              </div>
              <p className="text-sm text-gray-500 ml-8">
                Essential services are required for the basic functionality of the website. They only contain
                technically necessary services. These services cannot be objected to.
              </p>
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
                    <span className="font-medium text-gray-900">Functional (2)</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-start gap-2">
                <p className="text-sm text-gray-500 ml-8">
                  Functional services are necessary to provide features beyond the essential functionality such as
                  prettier fonts, video playback or interactive web 2.0 features. Content from e.g. video platforms and
                  social media platforms are blocked by default, and can be consented to. If the service is agreed to,
                  this content is loaded automatically without further manual consent.&nbsp;&nbsp;
                  <span
                    onClick={() => toggleCategoryDetails("functional")}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {expandedSections.functional ? "Hide details" : "Show details"}
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
                      {cookieServices.functional.googleMaps.description}&nbsp;&nbsp;
                      <span
                        onClick={() => toggleServiceDetails("googleMaps")}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {expandedServices.googleMaps ? "Hide details" : "Show details"}
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
                      {cookieServices.functional.googleTagManager.description}&nbsp;&nbsp;
                      <span
                        onClick={() => toggleServiceDetails("googleTagManager")}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {expandedServices.googleTagManager ? "Hide details" : "Show details"}
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
                    <span className="font-medium text-gray-900">Statistics (1)</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-start gap-2">
                <p className="text-sm text-gray-500 ml-8">
                  Statistics services are needed to collect pseudonymous data about the visitors of the website. The
                  data enables us to understand visitors better and to optimize the website.&nbsp;&nbsp;
                  <span
                    onClick={() => toggleCategoryDetails("statistics")}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {expandedSections.statistics ? "Hide details" : "Show details"}
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
                    {cookieServices.statistics.googleAnalytics.description}&nbsp;&nbsp;{" "}
                    <span
                      onClick={() => toggleServiceDetails("googleAnalytics")}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {expandedServices.googleAnalytics ? "Hide details" : "Show details"}
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
                    <span className="font-medium text-gray-900">Marketing (1)</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-start gap-2">
                <p className="text-sm text-gray-500 ml-8">
                  Marketing services are used by us and third parties to track the behaviour of individual visitors
                  (across multiple pages), analyse the data collected and, for example, display personalized
                  advertisements. These services enable us to track visitors across multiple websites.&nbsp;&nbsp;
                  <span
                    onClick={() => toggleCategoryDetails("marketing")}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {expandedSections.marketing ? "Hide details" : "Show details"}
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
                    {cookieServices.marketing.googleAds.description}&nbsp;&nbsp;
                    <span
                      onClick={() => toggleServiceDetails("googleAds")}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {expandedServices.googleAds ? "Hide details" : "Show details"}
                    </span>
                  </p>
                  {expandedServices.googleAds && <CookieDetails service={cookieServices.marketing.googleAds} />}
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-gray-200 bg-gray-50 p-2 sticky bottom-0">
            <p className="text-center text-sm text-gray-600 gap-1 flex justify-center items-center">
              <Link href={"/datenschutz"} locale={locale}>Datenschutzerklärung</Link>
              <Dot />
              <Link href={"/impressum"} locale={locale}>Impressum</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
