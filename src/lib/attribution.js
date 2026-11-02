// src/lib/attribution.js
// Herkunft einer Anfrage (Masterplan AP3 Nr. 2, Bericht 11 F1, Recht 14 F1/F8).
//
// captureAttribution() runs once per page load from src/instrumentation-client.js
// (before hydration, no useSearchParams). It reads utm_*, the referrer host,
// the landing path and the ad click ids from the first URL of the visit.
//
// Consent boundary (cookie "cookieConsent", event "ph-consent-change", both
// written by components/Cookies/** – read here, never written):
//   - WITHOUT Google-Ads consent the touch lives only in memory (this page
//     view / SPA session). Nothing is written to the device, click ids are
//     never sent.
//   - WITH Google-Ads consent the touch goes to localStorage "ph_attr"
//     ({ v, first, last, exp }, 90 days rolling, first and last touch) and
//     the click ids (gclid, gbraid, wbraid, fbclid, msclkid) are included.
//   - Withdrawing the consent removes "ph_attr" at once.
//
// channelOf() is the channel rule of 11 F1 (incl. "KI-Suche").
// No "@/..." imports and no dependencies: tested with `node --test`
// (tests/unit/r4-leads.test.mjs), < 1 KB gzip in the client.

export const ATTR_KEY = "ph_attr";
export const ATTR_TTL_MS = 90 * 24 * 60 * 60 * 1000;
export const CONSENT_COOKIE = "cookieConsent";
export const CONSENT_EVENT = "ph-consent-change";
export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
export const CLICK_ID_KEYS = ["gclid", "gbraid", "wbraid", "fbclid", "msclkid"];

const MAX_LEN = 150;
// Shared between the instrumentation bundle and the app chunks (one holder
// per window, in memory only).
const HOLDER = "__phAttribution";

/** Trimmed, control characters removed, at most 150 characters; "" if empty. */
export function clean(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, MAX_LEN);
}

/** Host of `referrer` unless it is our own host (internal navigation) or invalid. */
export function referrerHost(referrer, ownHost) {
  if (!referrer) return "";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (!host) return "";
    const own = String(ownHost || "").toLowerCase().replace(/^www\./, "");
    if (own && host.replace(/^www\./, "") === own) return "";
    return host;
  } catch {
    return "";
  }
}

/**
 * One touch from a URL and a referrer.
 * @returns {{ ts: number, landing: string, referrer_host: string, utm_source?: string, …, click?: object }}
 */
export function readTouch({ href, referrer = "", now = Date.now() } = {}) {
  let url;
  try {
    url = new URL(href);
  } catch {
    return { ts: now, landing: "", referrer_host: "" };
  }
  const touch = { ts: now, landing: clean(url.pathname), referrer_host: referrerHost(referrer, url.hostname) };
  for (const key of UTM_KEYS) {
    const value = clean(url.searchParams.get(key) || "");
    if (value) touch[key] = value;
  }
  const click = {};
  for (const key of CLICK_ID_KEYS) {
    const value = clean(url.searchParams.get(key) || "");
    if (value) click[key] = value;
  }
  if (Object.keys(click).length) touch.click = click;
  return touch;
}

/** true if the touch says where the visitor came from (not a direct visit). */
export function hasSignal(touch) {
  if (!touch) return false;
  return Boolean(touch.referrer_host || touch.click || UTM_KEYS.some((k) => touch[k]));
}

const AI_HOSTS = /(^|\.)(chatgpt\.com|chat\.openai\.com|openai\.com|perplexity\.ai|copilot\.microsoft\.com|gemini\.google\.com|bard\.google\.com|claude\.ai|you\.com|phind\.com|meta\.ai|chat\.mistral\.ai|deepseek\.com)$/;
const SEARCH_HOSTS = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|ecosia\.org|search\.yahoo\.com|yahoo\.com|startpage\.com|qwant\.com|search\.brave\.com|yandex\.[a-z.]+|baidu\.com)$/;
const SOCIAL_HOSTS = /(^|\.)(instagram\.com|facebook\.com|fb\.com|fb\.me|pinterest\.[a-z.]+|pin\.it|linkedin\.com|lnkd\.in|t\.co|x\.com|twitter\.com|youtube\.com|tiktok\.com|threads\.net|reddit\.com)$/;
const AI_SOURCES = /^(chatgpt(\.com)?|openai|perplexity(\.ai)?|copilot|gemini|claude(\.ai)?|bard)$/;
const SOCIAL_SOURCES = /^(ig|instagram|fb|facebook|meta|pinterest|linkedin|tiktok|youtube)$/;

/** Labels the backoffice reads (German, stable). */
export const CHANNELS = {
  googleAds: "Google Ads",
  microsoftAds: "Microsoft Ads",
  paid: "Paid",
  newsletter: "Newsletter",
  qr: "Offline/QR",
  ai: "KI-Suche",
  social: "Social",
  organic: "Organisch",
  referral: "Verweis",
  direct: "Direkt",
};

/**
 * Channel rule (11 F1), first match wins:
 * gclid/gbraid/wbraid ⇒ Google Ads · msclkid ⇒ Microsoft Ads ·
 * utm_medium cpc|ppc|paid* ⇒ Paid · utm_source newsletter / utm_medium email ⇒ Newsletter ·
 * utm_source qr-* ⇒ Offline/QR · AI assistant (referrer or utm_source) ⇒ KI-Suche ·
 * social (fbclid, utm or referrer) ⇒ Social · search engine referrer without utm ⇒ Organisch ·
 * any other referrer or utm_source ⇒ Verweis · else Direkt.
 * The AI check runs before the search check (gemini.google.com is a Google host).
 */
export function channelOf(touch) {
  if (!touch) return CHANNELS.direct;
  const click = touch.click || {};
  const source = String(touch.utm_source || "").toLowerCase();
  const medium = String(touch.utm_medium || "").toLowerCase();
  const host = String(touch.referrer_host || "").toLowerCase();
  if (click.gclid || click.gbraid || click.wbraid) return CHANNELS.googleAds;
  if (click.msclkid) return CHANNELS.microsoftAds;
  if (/^(cpc|ppc|cpm|paid|paid[-_ ]?\w*|display|banner)$/.test(medium)) return CHANNELS.paid;
  if (source === "newsletter" || medium === "email" || medium === "newsletter") return CHANNELS.newsletter;
  if (source.startsWith("qr-") || source === "qr" || medium === "qr" || medium === "print") return CHANNELS.qr;
  if (AI_SOURCES.test(source) || AI_HOSTS.test(host)) return CHANNELS.ai;
  if (click.fbclid || SOCIAL_SOURCES.test(source) || medium === "social" || SOCIAL_HOSTS.test(host)) return CHANNELS.social;
  if (!source && SEARCH_HOSTS.test(host)) return CHANNELS.organic;
  if (host || source) return CHANNELS.referral;
  return CHANNELS.direct;
}

/** Saved consent object from a document.cookie string, or null. */
export function readConsent(cookieString) {
  if (typeof cookieString !== "string" || !cookieString) return null;
  for (const part of cookieString.split(";")) {
    const index = part.indexOf("=");
    if (index < 0 || part.slice(0, index).trim() !== CONSENT_COOKIE) continue;
    try {
      const value = JSON.parse(decodeURIComponent(part.slice(index + 1).trim()));
      return value && typeof value === "object" && !Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Google-Ads consent (service flag of the banner; "marketing" mirrors it). */
export const adsConsentOf = (consent) => Boolean(consent && (consent.googleAds === true || consent.marketing === true));
/**
 * Statistics consent for Google Analytics. The category flag "statistics" is
 * only a fallback for a cookie without the service key: since the own heatmap
 * (key "einblicke") sits in the same category, "statistics" alone no longer
 * means Google Analytics (QA Recht Einblicke P2-4).
 */
export const statisticsConsentOf = (consent) =>
  Boolean(consent && (consent.googleAnalytics === true || (consent.googleAnalytics === undefined && consent.statistics === true)));
/**
 * Consent for the own visitor insights / heatmap (service "einblicke" of the
 * banner, src/lib/legal/services.js). Its own key, never derived from Google
 * Analytics or the category: a consent given before the service was listed
 * does not count (QA Recht Einblicke P1-1, P2-4).
 */
export const einblickeConsentOf = (consent) => Boolean(consent && consent.einblicke === true);

/** Touch without the click ids (for everything sent without Ads consent). */
export function withoutClickIds(touch) {
  if (!touch || !touch.click) return touch || null;
  const rest = { ...touch };
  delete rest.click;
  return rest;
}

/**
 * Stored record + new touch → record to save. A new record if none is
 * stored or it has expired; otherwise first stays and a touch WITH a
 * signal becomes the new last touch (a direct visit does not overwrite it).
 * Every write extends the record by 90 days.
 */
export function mergeStored(stored, touch, now = Date.now()) {
  const valid = stored && stored.v === 1 && stored.first && Number(stored.exp) > now;
  if (!valid) return { v: 1, first: touch, last: touch, exp: now + ATTR_TTL_MS };
  return { v: 1, first: stored.first, last: hasSignal(touch) ? touch : stored.last, exp: now + ATTR_TTL_MS };
}

function storage(win) {
  try {
    return win && win.localStorage ? win.localStorage : null;
  } catch {
    return null;
  }
}

function loadStored(win, now = Date.now()) {
  const ls = storage(win);
  if (!ls) return null;
  try {
    const value = JSON.parse(ls.getItem(ATTR_KEY) || "null");
    if (!value || value.v !== 1 || !(Number(value.exp) > now)) {
      if (value) ls.removeItem(ATTR_KEY);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

function holder(win) {
  if (!win) return { touch: null };
  if (!win[HOLDER]) win[HOLDER] = { touch: null, leadRef: null, listening: false };
  return win[HOLDER];
}

/** Writes the current touch to ph_attr (only called with Ads consent). */
function persist(win, now = Date.now()) {
  const ls = storage(win);
  const touch = holder(win).touch;
  if (!ls || !touch) return;
  try {
    ls.setItem(ATTR_KEY, JSON.stringify(mergeStored(loadStored(win, now), touch, now)));
  } catch {
    /* storage full or blocked: memory still works */
  }
}

/** Removes ph_attr (consent withdrawn or never given). */
export function forgetStored(win = typeof window !== "undefined" ? window : undefined) {
  const ls = storage(win);
  try {
    ls?.removeItem(ATTR_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Captures the touch of this page load (once) and keeps the stored record in
 * line with the consent. Safe to call more than once; never throws.
 */
export function captureAttribution(win = typeof window !== "undefined" ? window : undefined) {
  if (!win || !win.location) return null;
  try {
    const state = holder(win);
    if (!state.touch) {
      state.touch = readTouch({ href: win.location.href, referrer: win.document?.referrer || "" });
    }
    if (adsConsentOf(readConsent(win.document?.cookie))) persist(win);
    if (!state.listening && typeof win.addEventListener === "function") {
      state.listening = true;
      win.addEventListener(CONSENT_EVENT, (event) => {
        const consent = event?.detail && typeof event.detail === "object" ? event.detail : readConsent(win.document?.cookie);
        if (adsConsentOf(consent)) persist(win);
        else forgetStored(win);
      });
    }
    return state.touch;
  } catch {
    return null;
  }
}

/**
 * What a lead may carry right now:
 * { current, first, last, consentAds }. Without Ads consent: only the
 * in-memory touch of this visit, without click ids. With Ads consent: the
 * stored first/last touch (click ids included).
 */
export function getAttribution(win = typeof window !== "undefined" ? window : undefined) {
  if (!win) return { current: null, first: null, last: null, consentAds: false };
  const state = holder(win);
  if (!state.touch && win.location) captureAttribution(win);
  const consentAds = adsConsentOf(readConsent(win.document?.cookie));
  if (!consentAds) {
    const current = withoutClickIds(state.touch);
    return { current, first: null, last: null, consentAds: false };
  }
  const stored = loadStored(win);
  return { current: state.touch, first: stored?.first || state.touch, last: stored?.last || state.touch, consentAds: true };
}

/** lead_ref of the last sent form (trackLead's transaction_id fallback). */
export function rememberLeadRef(leadRef, win = typeof window !== "undefined" ? window : undefined) {
  if (win) holder(win).leadRef = leadRef || null;
}
export function lastLeadRef(win = typeof window !== "undefined" ? window : undefined) {
  return win ? holder(win).leadRef || null : null;
}
