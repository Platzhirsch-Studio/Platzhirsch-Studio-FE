// Language-correct link targets for the German-only landing pages (F6,
// 28.10.2026, SEO-Gutachten: the EN/FR/IT home page linked to /de/… pages).
// The landing pages (Küchen, Interior Design, Outdoor, Yacht, Regionen) exist
// in German only; the other locales 404. Instead of sending an English visitor
// to a German page, a link from a non-German page goes to the closest page in
// the visitor's language (catalogue category or consultation), which exists in
// all four locales with hreflang. German pages keep the landing page.
//
// Use (e.g. src/components/Home/Services.js, owned by the home team):
//   const target = landingTarget("/kuechen-vorarlberg", locale);
//   <LinkArrow href={target.href} locale={target.locale}>…</LinkArrow>
// `href` is without locale prefix (next-intl Link adds it); `germanOnly` is
// true only when no translated page exists and the German page is kept.
//
// Pure module (relative imports only), so node --test can load it.
import { ROUTES } from "../../utils/routing.js";

const LOCALES = ["de", "en", "fr", "it"];
const products = (locale, slug) => `${ROUTES.produkte[locale] || ROUTES.produkte.de}${slug ? `/${slug}` : ""}`;

// Sprach-Integration 01.11.2026: these landing pages exist in DE/EN/FR/IT
// (landingKern, Yacht) – a link from EN/FR/IT goes to the page itself.
export const MULTILINGUAL_LANDINGS = Object.freeze([
  "/kuechen-vorarlberg",
  "/interior-design-vorarlberg",
  "/wohnzimmer-einrichten-vorarlberg",
  "/outdoor-gartenplanung",
  "/outdoor-kueche", // 02.11.2026, landingKern/outdoorKueche.js
  "/whirlpool-kaufen", // 02.11.2026, landingKern/whirlpool.js
  "/swim-spa", // 02.11.2026, landingKern/swimspa.js
  "/sauna-kaufen", // 02.11.2026, landingKern/sauna.js
  "/yacht-interior",
]);

/** Fallback per German-only landing path: (locale) → path in that locale. */
export const LANDING_FALLBACKS = Object.freeze({
  "/moebel-bodensee": (l) => products(l),
});

/**
 * @param {string} path German landing path ("/kuechen-vorarlberg", "/designermoebel-konstanz")
 * @param {string} locale page locale
 * @returns {{ href: string, locale: string, germanOnly: boolean }}
 */
export function landingTarget(path, locale) {
  if (locale === "de" || !LOCALES.includes(locale)) return { href: path, locale: "de", germanOnly: false };
  if (MULTILINGUAL_LANDINGS.includes(path)) return { href: path, locale, germanOnly: false, own: true };
  const fallback = LANDING_FALLBACKS[path] || (path.startsWith("/designermoebel-") ? (l) => products(l) : null);
  if (fallback) return { href: fallback(locale), locale, germanOnly: false };
  return { href: path, locale: "de", germanOnly: true };
}
