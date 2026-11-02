// src/lib/concierge/actionKinds.js
// ONE source for both sides of the action check (concierge-sitewide-
// architektur.md §5.3): the server (actions.js) builds proposals with it, the
// browser (components/Concierge/core/executeAction.js) checks every proposal
// again with the same functions before it runs. The model never names a URL:
// it names route keys, category keys and product ids; the URL is built here
// from ROUTES / productsPath(), so language paths (/fr/conseil) are right and
// there are no external targets, no javascript:, no invented paths.
//
// Plain module, client-safe: relative imports only (also runs in node --test).
import { ROUTES, productsPath } from "../../utils/routing.js";

export const LOCALES = ["de", "en", "fr", "it"];

export const ACTION_KINDS = Object.freeze([
  "navigation",
  "open_product",
  "catalog_filter",
  "save_to_selection",
  "appointment_form",
  "scroll_to_section",
]);

// Route whitelist. `routes` = key in ROUTES (translated per locale), `path` =
// same path in every locale. `deOnly`: the page exists only in German, the
// link then goes to /de/… (the card says so).
export const ROUTE_KEYS = Object.freeze({
  home: { path: "" },
  produkte: { routes: "produkte" },
  marken: { routes: "marken" },
  beratung: { routes: "beratung" },
  kontakt: { routes: "kontakt" },
  merkliste: { routes: "merkliste" },
  news: { routes: "news" },
  "ueber-uns/platzhirsch": { routes: "platzhirsch" },
  "ueber-uns/team": { routes: "team" },
  ratgeber: { path: "/ratgeber", deOnly: true },
  "yacht-interior": { path: "/yacht-interior", deOnly: true },
  "outdoor-gartenplanung": { path: "/outdoor-gartenplanung", deOnly: true },
  "einkaufen-aus-der-schweiz": { path: "/einkaufen-aus-der-schweiz", deOnly: true },
  gutscheine: { path: "/gutscheine", deOnly: true },
});
export const ROUTE_KEY_LIST = Object.freeze(Object.keys(ROUTE_KEYS));

// Catalogue filter → query parameter of ShopCatalog (FILTER_GROUPS there).
// Fixed order: the same filter always gives the same URL.
export const FILTER_PARAMS = Object.freeze({
  brand: "marke",
  sub_category: "typ",
  material: "material",
  color: "farbe",
  area: "bereich",
});
export const FILTER_PARAM_LIST = Object.freeze(Object.values(FILTER_PARAMS));

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
export const ID_RE = /^a_[A-Za-z0-9_-]{8,32}$/;
export const SIG_RE = /^[A-Za-z0-9_-]{16,64}$/;
export const MAX_PER_ANSWER = 3;
export const MAX_PER_SESSION = 30;
export const ACTION_TTL_MS = 30 * 60 * 1000;
export const NOTE_MAX = 300;

const isSlug = (v) => typeof v === "string" && SLUG_RE.test(v);
const isLocale = (l) => LOCALES.includes(l);

// Free text for the appointment form: no control chars, no URLs, no e-mail
// addresses or phone numbers (the model must not carry personal data over).
export function cleanNote(text, max = NOTE_MAX) {
  return String(text ?? "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, "")
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "")
    .replace(/\+?\d[\d\s/().-]{6,}\d/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, max);
}

function routePath(key, locale) {
  const r = ROUTE_KEYS[key];
  if (!r) return null;
  const loc = r.deOnly ? "de" : locale;
  const path = r.routes ? ROUTES[r.routes]?.[loc] : r.path;
  if (path == null) return null;
  return `/${loc}${path}`;
}

function filterQuery(filters) {
  const params = [];
  for (const param of FILTER_PARAM_LIST) {
    const values = filters?.[param];
    if (!values?.length) continue;
    params.push(`${param}=${[...values].sort().join(",")}`);
  }
  return params.length ? `?${params.join("&")}` : "";
}

/**
 * Target path of an action (or null: the action does not navigate). Never
 * takes a URL as input – only keys and slugs, checked here.
 */
export function buildHref(action, locale) {
  if (!action || !isLocale(locale)) return null;
  const p = action.params || {};
  switch (action.kind) {
    case "navigation":
      return routePath(p.route, locale);
    case "open_product":
      if (!isSlug(p.categorySlug) || !isSlug(p.urlSlug)) return null;
      return `/${locale}${productsPath(locale, p.categorySlug, p.urlSlug)}`;
    case "catalog_filter": {
      if (!isSlug(p.categorySlug)) return null;
      for (const [k, v] of Object.entries(p.filters || {})) {
        if (!FILTER_PARAM_LIST.includes(k) || !Array.isArray(v) || v.length > 3 || !v.every(isSlug)) return null;
      }
      return `/${locale}${productsPath(locale, p.categorySlug)}${filterQuery(p.filters)}`;
    }
    case "appointment_form": {
      const q = new URLSearchParams({ quelle: "concierge" });
      const note = cleanNote(p.note);
      if (note) q.set("anliegen", note);
      const product = cleanNote(p.product, 120);
      if (product) q.set("produkt", product);
      // #anfrage: the visitor lands at the form, not at the hero (QA2 P2-4;
      // anchor in app/[locale]/beratung/page.js). Real pre-filling: see feature doc.
      return `/${locale}${ROUTES.beratung[locale]}?${q.toString()}#anfrage`;
    }
    default:
      return null;
  }
}

/**
 * Browser-side check of a proposal from the stream (the second half of the
 * double whitelist). Returns { ok, href, error }. `origin`: location.origin –
 * the built href must stay on it.
 */
export function checkAction(action, { locale, now = Date.now(), origin } = {}) {
  if (!action || typeof action !== "object") return { ok: false, error: "shape" };
  if (!ACTION_KINDS.includes(action.kind)) return { ok: false, error: "kind" };
  if (!ID_RE.test(String(action.id || ""))) return { ok: false, error: "id" };
  if (!SIG_RE.test(String(action.sig || ""))) return { ok: false, error: "sig" };
  if (!Number.isFinite(action.exp) || action.exp < now) return { ok: false, error: "expired" };
  if (!isLocale(locale)) return { ok: false, error: "locale" };
  const p = action.params || {};
  if (action.kind === "save_to_selection") {
    const items = p.items;
    if (!Array.isArray(items) || !items.length || items.length > 6) return { ok: false, error: "params" };
    for (const it of items) {
      if (!it || typeof it.id !== "string" || !it.id || it.id.length > 140) return { ok: false, error: "params" };
      if (!isSlug(it.categorySlug) || typeof it.urlSlug !== "string" || !SLUG_RE.test(it.urlSlug)) return { ok: false, error: "params" };
    }
    return { ok: true, href: null };
  }
  if (action.kind === "scroll_to_section") {
    return isSlug(p.sectionId) ? { ok: true, href: null } : { ok: false, error: "params" };
  }
  const href = buildHref(action, locale);
  if (!href) return { ok: false, error: "params" };
  if (!/^\/(de|en|fr|it)(\/|$|\?)/.test(href) || href.includes("//") || href.includes("..")) return { ok: false, error: "href" };
  if (origin) {
    try {
      if (new URL(href, origin).origin !== origin) return { ok: false, error: "origin" };
    } catch {
      return { ok: false, error: "href" };
    }
  }
  return { ok: true, href };
}
