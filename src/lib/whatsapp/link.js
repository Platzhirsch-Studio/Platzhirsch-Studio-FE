// src/lib/whatsapp/link.js – wa.me-Link und vorbelegter Text (Konzept B1).
//
// Rein, ohne Pakete und ohne process.env: Client-Komponenten und node --test
// nutzen es. Der Link sendet beim Anzeigen nichts (kein Skript, kein Pixel);
// erst wenn der Kunde in WhatsApp auf Senden tippt, entsteht eine Nachricht.
//
// Datensparsamkeit: Der vorbelegte Text nennt nur Seite, Produkt/Marke oder
// einen Teilen-Link, den der Kunde selbst erzeugt hat (Ideenboard, Ezarri-
// Mischung). Nie Namen, E-Mail, Telefon, Merklisten-Inhalt, Portal-, Upload-,
// Zahlungs- oder Verwaltungslinks, nie Tracking-Parameter.
import { SITE_URL } from "../site.js";
import { prefillTemplate } from "./copy.js";

/** Längster Text im Link; längere Seiten-URLs fallen auf den Pfad zurück. */
export const MAX_TEXT = 600;
const MAX_URL = 400;

const LOCALE_RE = /^\/(de|en|fr|it)(?=\/|$)/;

// Pfade, deren Query den Inhalt trägt (die Mischung selbst, kein Personenbezug).
const QUERY_PATHS = [/^\/ezarri\/custom-mix\/?$/, /^\/ezarri\/konfigurator\/?$/];
// Nie in eine Nachricht: persönliche Bereiche und geheime Verwaltungslinks.
const BLOCKED = [/^\/portal(\/|$)/, /^\/upload(\/|$)/, /^\/zahlung(\/|$)/, /^\/termin\/.+/, /\/verwalten(\/|$)/, /^\/wunschliste\/[^/]+\/.+/];
// Geteilte Boards/Listen: nur das öffentliche Token (32 Zeichen, ohne Punkt –
// der Verwaltungsschlüssel hat einen Punkt, src/lib/ideenboard/config.js).
const SHARE_TOKEN = "[A-Za-z0-9_-]{32}";
const IDEENBOARD_RE = new RegExp(`^/ideenboard/${SHARE_TOKEN}/?$`);
const WUNSCHLISTE_RE = new RegExp(`^/wunschliste/${SHARE_TOKEN}/?$`);
// Produktseite in allen Sprachen (src/utils/routing.js produkte).
const PRODUCT_RE = /^\/(produkte|products|produits|prodotti)\/[^/]+\/[^/]+\/?$/;
const MERKLISTE_RE = /^\/(merkliste|wishlist|liste-de-souhaits|lista-desideri)\/?$/;
const BERATUNG_RE = /^\/(beratung|consultation|conseil|consulenza|termin)\/?$/;
const GENERAL_RE = /^\/?$|^\/(kontakt|contact|contatto)\/?$/;
const TRACKING_PARAM = /^(utm_|gclid$|gbraid$|wbraid$|fbclid$|msclkid$|mc_|_ga$|ref$|quelle$)/i;

/**
 * https://wa.me/<ziffern>?text=… – nur mit gültigen Ziffern (7–15), ohne „+“.
 * @param {string} digits
 * @param {string} [text]
 * @returns {string|null}
 */
export function buildWhatsAppHref(digits, text = "") {
  if (typeof digits !== "string" || !/^[1-9]\d{6,14}$/.test(digits)) return null;
  const t = typeof text === "string" ? text.trim().slice(0, MAX_TEXT) : "";
  return `https://wa.me/${digits}${t ? `?text=${encodeURIComponent(t)}` : ""}`;
}

/** Pfad ohne Sprachpräfix ("/de/produkte/x/y" → "/produkte/x/y"). */
function bare(pathname) {
  return (pathname || "/").replace(LOCALE_RE, "") || "/";
}

/**
 * Seiten-URL für die Nachricht (Produktionsdomain, nicht localhost) oder null.
 * Query nur auf Mischungs-Seiten, dort ohne Tracking-Parameter.
 * @param {string} pathname  window.location.pathname (mit Sprachpräfix)
 * @param {string} [search]  window.location.search
 */
export function pageUrlForMessage(pathname, search = "") {
  if (typeof pathname !== "string" || !pathname.startsWith("/") || pathname.startsWith("//")) return null;
  const path = pathname.replace(/[?#].*$/, "");
  const b = bare(path);
  if (BLOCKED.some((re) => re.test(b))) return null;
  if (b.startsWith("/ideenboard/") && !IDEENBOARD_RE.test(b)) return null;
  const base = `${SITE_URL}${path}`;
  if (!QUERY_PATHS.some((re) => re.test(b)) || !search) return base;
  const params = new URLSearchParams(search);
  for (const key of [...params.keys()]) if (TRACKING_PARAM.test(key) || key === "whatsapp") params.delete(key);
  const q = params.toString();
  const full = q ? `${base}?${q}` : base;
  return full.length > MAX_URL ? base : full;
}

/**
 * Art der Seite für den vorbelegten Text.
 * @returns {"general"|"page"|"product"|"beratung"|"merkliste"|"ideenboard"|"ezarriMix"}
 */
export function kindForPath(pathname) {
  const b = bare(typeof pathname === "string" ? pathname.replace(/[?#].*$/, "") : "/");
  if (GENERAL_RE.test(b)) return "general";
  if (PRODUCT_RE.test(b)) return "product";
  if (MERKLISTE_RE.test(b)) return "merkliste";
  if (BERATUNG_RE.test(b)) return "beratung";
  if (IDEENBOARD_RE.test(b) || WUNSCHLISTE_RE.test(b)) return "ideenboard";
  if (QUERY_PATHS[0].test(b)) return "ezarriMix";
  return "page";
}

const clip = (s, n) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, n) : "");

/**
 * Vorbelegter Text in der Seitensprache.
 * @param {string} locale
 * @param {{ kind?: string, product?: string, brand?: string, url?: string|null }} ctx
 */
export function prefillText(locale, ctx = {}) {
  const product = clip(ctx.product, 120);
  const brand = clip(ctx.brand, 60);
  let kind = ctx.kind || "general";
  if (kind === "product" && !product) kind = ctx.url ? "page" : "general";
  if ((kind === "page" || kind === "ideenboard" || kind === "ezarriMix") && !ctx.url) kind = "general";
  const tpl = prefillTemplate(locale, kind === "product" && !brand ? "productNoBrand" : kind);
  const text = tpl
    .replace("{product}", product)
    .replace("{brand}", brand)
    .replace("{url}", ctx.url || "")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, MAX_TEXT);
}

/**
 * Text und Link für die aktuelle Seite (im Browser beim Öffnen des Hinweises).
 * Ein vom Server übergebener Kontext (Produkt/Marke) hat Vorrang vor der
 * Erkennung aus dem Pfad.
 */
export function hrefForLocation(digits, locale, { pathname, search = "" }, ctx = {}) {
  const url = pageUrlForMessage(pathname, search);
  const kind = ctx.kind || kindForPath(pathname);
  // Produkt- und Seitentexte nennen die URL; Kontakt/Start/Beratung brauchen keine.
  const withUrl = ["page", "product", "ideenboard", "ezarriMix"].includes(kind) ? url : null;
  const text = prefillText(locale, { ...ctx, kind, url: withUrl });
  return { text, href: buildWhatsAppHref(digits, text) };
}
