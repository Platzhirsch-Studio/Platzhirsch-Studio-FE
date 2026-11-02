// src/lib/analytics.js
// Conversion events for GA4 (and, through GA4 import, Google Ads). Events go
// through window.gtag, which Cookies/cookiecomponent.js only defines with
// Consent Mode v2 — without analytics consent nothing is stored, and before the
// consent bar has run there is no gtag at all, so calls are a safe no-op.
//
// R4-leads (Masterplan AP3 Nr. 8): trackLead carries the enquiry's lead_ref
// as `transaction_id` (GA4 de-duplicates by it and the backoffice text
// block names the same reference), trackWishlist sends add_to_wishlist,
// reportWebVitals sends "web_vitals" – the latter only with statistics
// consent, checked here, not only through gtag.
import { lastLeadRef, readConsent, rememberLeadRef, statisticsConsentOf } from "./attribution.js";
import { einblickeAusGa } from "./einblicke/event.js";

export function trackEvent(name, params = {}) {
  // Besucher-Einblicke: dieselben Ziele (Termin, Anfrage, Merkliste, Kontakt,
  // Planer-Übergabe). No-op ohne offenes Einblicke-Tor (src/lib/einblicke/event.js).
  einblickeAusGa(name, params);
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

// One event name for every lead form, told apart by `form`, so GA4 needs a
// single key event ("generate_lead") to count all inquiries.
// `transaction_id` = lead_ref of the enquiry (postForm returns it as
// result.leadRef); without one the reference of the last sent form is
// used once (so a later lead without postForm never reuses it).
export function trackLead(form, params = {}) {
  const transaction_id = params.transaction_id || lastLeadRef() || undefined;
  rememberLeadRef(null);
  trackEvent("generate_lead", { form, ...params, ...(transaction_id ? { transaction_id } : {}) });
}

// Merkliste: one or more pieces saved (GA4 recommended event; no price,
// no value – SHOW_PRICES is off).
export function trackWishlist(itemOrItems) {
  const list = (Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems]).filter(Boolean);
  if (!list.length) return;
  trackEvent("add_to_wishlist", {
    items: list.slice(0, 50).map((item) => ({
      item_id: String(item.produkte_id ?? item.id ?? ""),
      item_name: String(item.name || ""),
      ...(item.category ? { item_brand: String(item.category) } : {}),
    })),
  });
}

/** true once the visitor allowed statistics (Google Analytics). */
export function hasStatisticsConsent() {
  if (typeof document === "undefined") return false;
  return statisticsConsentOf(readConsent(document.cookie));
}

// Web Vitals (next/web-vitals → useReportWebVitals, src/context/WebVitals.js).
// Without statistics consent nothing is sent at all. CLS is sent ×1000 as an
// integer (GA4 sums event values), the raw value goes along as metric_value.
export function reportWebVitals(metric) {
  if (!metric || !hasStatisticsConsent()) return;
  const value = metric.name === "CLS" ? metric.value * 1000 : metric.value;
  trackEvent("web_vitals", {
    metric_name: metric.name,
    metric_id: metric.id,
    metric_value: Math.round(metric.value * 1000) / 1000,
    metric_delta: Math.round(metric.delta * 1000) / 1000,
    metric_rating: metric.rating,
    value: Math.round(value),
    page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
    non_interaction: true,
  });
}

// Phone, e-mail and WhatsApp links anywhere on the site: one delegated
// listener instead of an onClick on every link. Returns the cleanup function.
export function listenForContactClicks() {
  const onClick = (event) => {
    const link = event.target.closest?.("a[href]");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    let method = null;
    if (href.startsWith("tel:")) method = "phone";
    else if (href.startsWith("mailto:")) method = "email";
    else if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) method = "whatsapp";
    if (method) trackEvent("contact_click", { method, page_path: window.location.pathname });
    // Booking band (BookingEmbed, only with BOOKING_PROVIDER=link): the click
    // that opens the provider; no booking data, only the fact of the click.
    else if (link.hasAttribute("data-booking-provider")) trackEvent("book_appointment", { method: link.getAttribute("data-booking-provider"), page_path: window.location.pathname });
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
