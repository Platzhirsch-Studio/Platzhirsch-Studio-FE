// Google tag (gtag.js) loading by consent – R4-recht-consent (AP2 Nr. 3, Fix
// aus 10 F1). Before: gtag.js loaded only with Statistik, so an Ads-only
// consent did nothing and Ads could not run without GA4.
//
//   Statistik                 → gtag.js + GA4 config (GOOGLE_TAG_IDS.ga4)
//   Marketing + Ads ID        → gtag.js + Ads config (GOOGLE_TAG_IDS.ads, "AW-…")
//   Marketing without Ads ID  → nothing: no config means no purpose
//                               (data minimisation, QA r4 P2-1)
//   neither                   → no request to Google at all
// gtag.js is requested once per page load, only when at least one config runs.
//
// The Consent Mode v2 default ("denied") is queued before the library, and
// every call sends the current update, so accept → reject → accept in one
// session re-grants. Configs are sent once each; a later consent for the
// other service adds its config without reloading the library.
// IDs and the service list: src/lib/legal/services.js.
import { GOOGLE_TAG_IDS } from "@/lib/legal/services";

export const GTAG_ORIGIN = "https://www.googletagmanager.com";

/**
 * Pure decision for one consent state (unit-tested).
 * @returns {{ load: boolean, src: string|null, configs: string[] }}
 */
export function googleTagPlan(consent, ids = GOOGLE_TAG_IDS) {
  const stats = Boolean(consent?.googleAnalytics);
  const ads = Boolean(consent?.googleAds);
  const configs = [];
  if (stats && ids.ga4) configs.push(ids.ga4);
  if (ads && ids.ads) configs.push(ids.ads);
  // Load only for a destination that is allowed AND configured: a consent
  // without a matching ID (Ads before the AW-… ID exists) sends nothing.
  const load = configs.length > 0;
  // The library is the same for every ID; the query names the first destination.
  return { load, src: load ? `${GTAG_ORIGIN}/gtag/js?id=${encodeURIComponent(configs[0])}` : null, configs };
}

// Secret links (QA Service Technik P1-1, 29.10.2026): the share link of a
// gift list (/…/wunschliste/<id>), the phone upload (/…/upload/<token>), a
// shared idea board and a deposit link carry an access key in the PATH. GA4
// would receive it with page_location/page_referrer. maskLocation() replaces
// the key with ":id" and drops query and hash on those paths; every other URL
// only loses its #fragment. Applied to the config AND, via a history hook,
// to every client-side navigation (gtag "set" before GA sees the change).
const SECRET_PATHS = [
  /^(\/(?:de|en|fr|it))?\/wunschliste\/(?!verwalten(?:\/|$))[^/?#]+/,
  /^(\/(?:de|en|fr|it))?\/upload\/[^/?#]+/,
  /^(\/(?:de|en|fr|it))?\/ideenboard\/[^/?#]+/,
  /^(\/(?:de|en|fr|it))?\/zahlung\/anzahlung\/[^/?#]+/,
];

/** URL ohne Zugangsschlüssel (pure, unit-tested). Leer bleibt leer. */
export function maskLocation(href) {
  if (!href) return "";
  let url;
  try {
    url = new URL(href);
  } catch {
    return "";
  }
  url.hash = "";
  for (const re of SECRET_PATHS) {
    const m = url.pathname.match(re);
    if (m) {
      const base = m[0].slice(0, m[0].lastIndexOf("/"));
      return `${url.origin}${base}/:id`;
    }
  }
  return url.toString();
}

function setMaskedLocation() {
  window.gtag("set", { page_location: maskLocation(window.location.href), page_referrer: maskLocation(document.referrer) });
}

/** Wraps pushState/replaceState once, so each navigation sets the masked URL first. */
function hookHistory() {
  if (window.phGtagHistoryHooked) return;
  window.phGtagHistoryHooked = true;
  for (const fn of ["pushState", "replaceState"]) {
    const original = window.history[fn];
    window.history[fn] = function patched(...args) {
      const result = original.apply(this, args);
      try {
        setMaskedLocation();
      } catch {
        /* analytics must never break navigation */
      }
      return result;
    };
  }
  window.addEventListener("popstate", () => setMaskedLocation());
}

/** Defines window.gtag/dataLayer and queues the "denied" default once. No network. */
export function ensureGtag() {
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

/** Google Consent Mode v2 update for the saved choice. No network by itself. */
export function sendConsentUpdate(consent) {
  ensureGtag();
  const ads = consent.googleAds ? "granted" : "denied";
  window.gtag("consent", "update", {
    analytics_storage: consent.googleAnalytics ? "granted" : "denied",
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  });
}

function expireCookies(match) {
  const names = document.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(match);
  const host = window.location.hostname;
  const domains = [undefined, host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

/**
 * Removes Google's first-party cookies of a withdrawn consent (a "denied"
 * update alone leaves _ga/_ga_* and _gcl_* in place).
 */
export function removeWithdrawnCookies(consent) {
  if (!consent.googleAnalytics) expireCookies((n) => n === "_ga" || n.startsWith("_ga_"));
  if (!consent.googleAds) expireCookies((n) => n.startsWith("_gcl_"));
}

/**
 * Applies a saved consent: Consent Mode update always; gtag.js and the
 * allowed configs only with Statistik or Marketing.
 */
export function loadGoogleTag(consent) {
  sendConsentUpdate(consent);
  const plan = googleTagPlan(consent);
  if (!plan.load || !plan.src) return;

  setMaskedLocation();
  hookHistory();
  if (!window.phGtagLoaded) {
    if (!document.querySelector(`script[src^="${GTAG_ORIGIN}/gtag/js"]`)) {
      const script = document.createElement("script");
      script.src = plan.src;
      script.async = true;
      document.head.appendChild(script);
    }
    window.phGtagLoaded = true;
    window.gtag("js", new Date());
  }

  window.phGtagConfigured = window.phGtagConfigured || {};
  for (const id of plan.configs) {
    if (window.phGtagConfigured[id]) continue;
    window.phGtagConfigured[id] = true;
    const page = { page_location: maskLocation(window.location.href), page_referrer: maskLocation(document.referrer) };
    window.gtag("config", id, id === GOOGLE_TAG_IDS.ga4 ? { anonymize_ip: true, ...page } : page);
  }
}
