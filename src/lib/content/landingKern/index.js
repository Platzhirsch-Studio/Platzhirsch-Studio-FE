// src/lib/content/landingKern/index.js – Gruppe „landing-kern“ in EN/FR/IT:
// /outdoor-gartenplanung, /kuechen-vorarlberg, /interior-design-vorarlberg,
// /wohnzimmer-einrichten-vorarlberg, /outdoor-kueche (02.11.2026), /leistungen.
// Slugs in allen Sprachen gleich.
//
// Muster wie Hotel & Objekt (src/lib/hotel/content-intl.js, seo.js): Deutsch
// ist der Mastertext (bleibt in den page.js-Dateien bzw. LabsHub), die
// Übersetzungen liegen serverseitig hier (NICHT in src/messages – Client-
// Budget) und werden als Props durchgereicht. FR bekommt beim Laden die
// französischen Leerzeichen (frenchTypography aus src/lib/hotel/content-intl.js).
//
// Linkziele ohne eigene Sprachfassung führen auf /de/… bzw. /en/… mit Hinweis
// im Linktext (./links.js, Quelle: src/lib/seo/deOnlyRedirects.cjs). Auch das
// hreflang folgt dieser Quelle: Solange ein Segment dort als „nur Deutsch“
// steht, nennt die Seite nur ihre vorhandenen Fassungen (kein hreflang auf
// eine 308-Adresse). Nimmt die Integration es heraus, stimmt alles ohne
// weitere Änderung.
//
// Rein (relative Importe, kein React): node --test lädt es.
import { frenchTypography } from "../../hotel/content-intl.js";
import { ROUTES } from "../../../utils/routing.js";
import { SITE_NAME, SITE_URL, clampDescription, fitTitle, hreflangLanguages, localeUrl, ogLocale, seoAlternates, titleWithSuffix } from "../../seo/pageMetadata.js";
import { hasLocale, localeLink, pageLocales } from "./links.js";
import { sharedCopy } from "./shared.js";
import * as kueche from "./kueche.js";
import * as interior from "./interior.js";
import * as wohnzimmer from "./wohnzimmer.js";
import * as outdoor from "./outdoor.js";
import * as outdoorKueche from "./outdoorKueche.js";
// Kaufwörter-Seiten Bad & Wellness (02.11.2026): Whirlpool, Swim Spa, Sauna.
import * as whirlpool from "./whirlpool.js";
import * as swimspa from "./swimspa.js";
import * as sauna from "./sauna.js";
import * as leistungen from "./leistungen.js";

export { localeLink, pageLocales, hasLocale, sharedCopy };

export const KERN_LOCALES = Object.freeze(["de", "en", "fr", "it"]);
export const INTL_LOCALES = Object.freeze(["en", "fr", "it"]);

/** Die sechs Seiten der Gruppe: Pfad → Textmodul. */
export const KERN_PAGES = Object.freeze({
  "/kuechen-vorarlberg": kueche,
  "/interior-design-vorarlberg": interior,
  "/wohnzimmer-einrichten-vorarlberg": wohnzimmer,
  "/outdoor-gartenplanung": outdoor,
  // SEO-Landingpage Outdoor-Küche (02.11.2026), Muster wie kueche.js.
  "/outdoor-kueche": outdoorKueche,
  // Kaufwörter-Seiten Bad & Wellness (02.11.2026), Muster wie kueche.js.
  "/whirlpool-kaufen": whirlpool,
  "/swim-spa": swimspa,
  "/sauna-kaufen": sauna,
  "/leistungen": leistungen,
});
export const KERN_PATHS = Object.freeze(Object.keys(KERN_PAGES));

const typo = (locale, value) => (locale === "fr" ? frenchTypography(value) : value);

/** EN/FR/IT-Text einer Seite (roh, ohne Mischen), null für DE/unbekannt. */
export function kernIntl(path, locale) {
  const mod = KERN_PAGES[path];
  if (!mod?.INTL || !INTL_LOCALES.includes(locale)) return null;
  return typo(locale, mod.INTL[locale]);
}

/** META (title, description, og) einer Seite in `locale`. */
export function kernMeta(path, locale) {
  const meta = KERN_PAGES[path]?.META?.[locale];
  return meta ? typo(locale, meta) : null;
}

/**
 * Legt die Übersetzung über die deutsche Fassung: Strings aus `intl`
 * ersetzen, alles andere (Bilder, Slugs, Icons, Linkziele, Thema) bleibt aus
 * `de`. Listen werden nach Position gemischt; fehlt in `intl` ein Eintrag,
 * bleibt der deutsche (der Test prüft gleiche Längen).
 */
export function mergeText(de, intl) {
  if (intl === undefined || intl === null) return de;
  if (Array.isArray(de)) {
    if (!Array.isArray(intl)) return de;
    return de.map((item, i) => mergeText(item, intl[i]));
  }
  if (de && typeof de === "object" && !isComponent(de)) {
    if (typeof intl !== "object" || Array.isArray(intl)) return de;
    const out = { ...de };
    for (const [k, v] of Object.entries(intl)) out[k] = k in de ? mergeText(de[k], v) : v;
    return out;
  }
  return typeof intl === typeof de || de === undefined ? intl : de;
}

// React-Komponenten (lucide-Icons sind forwardRef-Objekte) nie aufbrechen.
const isComponent = (v) => typeof v === "function" || (v && typeof v === "object" && "$$typeof" in v);

/** Interne Pfade in die Sprache der Seite (Produkte, Marken, Beratung, Kontakt). */
export function localizePath(href, locale) {
  if (typeof href !== "string" || locale === "de") return href;
  const bases = [
    [ROUTES.produkte.de, ROUTES.produkte[locale]],
    [ROUTES.marken.de, ROUTES.marken[locale]],
    [ROUTES.beratung.de, ROUTES.beratung[locale]],
    [ROUTES.kontakt.de, ROUTES.kontakt[locale]],
  ];
  for (const [de, target] of bases) {
    if (target && (href === de || href.startsWith(`${de}/`) || href.startsWith(`${de}?`) || href.startsWith(`${de}#`))) return target + href.slice(de.length);
  }
  return href;
}

/** Link für eine EN/FR/IT-Seite: Pfad lokalisiert, fremdsprachiges Ziel gekennzeichnet. */
export function kernLink(link, locale) {
  if (!link?.href || locale === "de") return link;
  const localized = localizePath(link.href, locale);
  return localized !== link.href ? { ...link, href: localized } : localeLink(link, locale);
}

/**
 * Inhalt einer Landingpage in `locale`: Deutsch = `de` unverändert; sonst die
 * Übersetzung über `de` gelegt, Querverweise und Marken-CTA mit Linkziel in
 * der passenden Sprache, Alt-Texte der Bildregister-Ersatzbilder (imageAlts).
 */
export function kernContent(path, locale, de) {
  const intl = kernIntl(path, locale);
  if (!intl) return locale === "de" ? de : null;
  const merged = mergeText(de, intl);
  if (merged.steps?.links) merged.steps = { ...merged.steps, links: merged.steps.links.map((l) => kernLink(l, locale)) };
  if (merged.brands?.cta) merged.brands = { ...merged.brands, cta: kernLink(merged.brands.cta, locale) };
  if (merged.objekt) merged.objekt = { ...merged.objekt, hotelLabel: merged.objekt.hotelLabel || sharedCopy(locale).objektHotelLink };
  return { ...merged, locale };
}

/** Alt-Text eines Bildes aus dem Bildregister (src/components/Landing/imagery.js) in der Seitensprache. */
export function localizeAlt(content, src, fallback) {
  return content?.imageAlts?.[src] || fallback;
}

// ---------------------------------------------------------------------------
// SEO

/**
 * hreflang der Seite: nur Sprachen, die es wirklich gibt (./links.js),
 * x-default = Deutsch. Mit allen vier Sprachen = der Satz der ganzen Seite
 * (hreflangLanguages: de, de-AT, de-CH, en, fr, fr-FR, fr-CH, it, it-IT, it-CH).
 */
export function kernLanguages(path) {
  const langs = pageLocales(path);
  const all = hreflangLanguages((l) => localeUrl(l, path));
  if (langs.length === KERN_LOCALES.length) return all;
  // Nur Deutsch (Redirect-Liste noch nicht geändert): wie deOnlyLanguages() – de + x-default.
  if (langs.length === 1) return { de: all.de, "x-default": all["x-default"] };
  return Object.fromEntries(Object.entries(all).filter(([code]) => code === "x-default" || langs.includes(code.slice(0, 2))));
}

/**
 * generateMetadata() einer Kern-Seite in EN/FR/IT. Title ≤ 60 mit Suffix,
 * Description ≤ 150 als ganzer Satz, eigene Canonical, hreflang reziprok,
 * og:image = die typografische Karte der Seite (opengraph-image.js) bzw.
 * `image` (Leistungen: /og/leistungen.jpg).
 * @param {{path: string, locale: string, index?: boolean, image?: {url:string,width?:number,height?:number,alt?:string}}} o
 */
export function kernMetadata({ path, locale, index = true, image }) {
  const meta = kernMeta(path, locale);
  if (!meta) return {};
  const url = localeUrl(locale, path);
  const title = titleWithSuffix(meta.title);
  const description = clampDescription(meta.description);
  const robots = { index, follow: true };
  const img = image || { url: `${url}/opengraph-image`, width: 1200, height: 630, alt: `${meta.og?.title || meta.title} – ${SITE_NAME}` };
  return {
    title,
    description,
    robots,
    alternates: seoAlternates({ canonical: url, languages: kernLanguages(path), robots }),
    openGraph: {
      type: "website",
      url,
      title: fitTitle(meta.title),
      description,
      siteName: SITE_NAME,
      locale: ogLocale(locale),
      images: [img],
    },
    twitter: { card: "summary_large_image", title, description, images: [img.url] },
  };
}

/**
 * Deutsche Metadaten (landingMetadata) mit dem hreflang der Gruppe: sobald
 * EN/FR/IT freigeschaltet sind, nennt auch /de alle Fassungen (reziprok).
 */
export function withKernLanguages(meta, path) {
  if (!meta?.alternates?.canonical) return meta;
  return { ...meta, alternates: seoAlternates({ canonical: meta.alternates.canonical, languages: kernLanguages(path), robots: meta.robots }) };
}

/** Typografische Share-Karte (eyebrow, title, footer) einer Kern-Seite in EN/FR/IT. */
export function kernOgCard(path, locale) {
  const meta = kernMeta(path, locale);
  const shared = sharedCopy(locale);
  if (!meta?.og || !shared) return null;
  return { eyebrow: meta.og.eyebrow, title: meta.og.title, footer: shared.ogFooter };
}

/** Absolute URL der Seite (für JSON-LD). */
export const kernUrl = (path, locale) => `${SITE_URL}/${locale}${path}`;

// ---------------------------------------------------------------------------
// Leistungen (/leistungen, LabsHub)

const LEISTUNGEN_ADVICE_HREFS = ["/beratung", "/arbeitsweise", "/interior-design-vorarlberg", "/kuechen-vorarlberg", "/hotel-objekt", "/architekten", "/ratgeber"];

/**
 * Texte des Hubs /leistungen in `locale` (DE = die bisherigen Texte).
 * `advice` mit Linkziel in der passenden Sprache; `outdoorLink(href)` für den
 * Outdoor-Eintrag, `feature(f)` übersetzt eine Feature-Karte und setzt das
 * Ziel (eigene Fassung, sonst /en/… bzw. /de/… mit Hinweis im Titel).
 * @param {string} locale
 * @param {{sofaName?: string}} [opts] Sofaplaner-Name je Sprache (consent.js)
 */
export function leistungenCopy(locale, { sofaName } = {}) {
  const hub = leistungen.HUB[locale] ? typo(locale, leistungen.HUB[locale]) : null;
  if (!hub) return null;
  const advice = hub.advice.map((a, i) => kernLink({ ...a, href: LEISTUNGEN_ADVICE_HREFS[i] }, locale));
  const groups = locale === "de" ? null : typo(locale, leistungen.GROUPS[locale]);
  const texts = locale === "de" ? null : typo(locale, leistungen.FEATURES[locale]);
  const feature = (f) => {
    if (!texts) return f;
    const t = texts[f.id] || {};
    const title = f.id === "sofaplaner" && sofaName ? sofaName : t.title || f.title;
    const link = kernLink({ href: f.href, label: title }, locale);
    const image = f.image ? { ...f.image, alt: t.alt || f.image.alt, ...(f.image.credit ? { credit: t.credit || f.image.credit } : {}) } : f.image;
    return { ...f, title: link.label, href: link.href, summary: t.summary || f.summary, note: f.note ? t.note || f.note : f.note, image, visualLabel: t.visual, ownImageAlt: t.ownAlt };
  };
  const group = (g) => (groups?.[g.id] ? { ...g, ...groups[g.id] } : g);
  return {
    ...hub,
    advice,
    outdoorLink: (href) => kernLink({ ...hub.outdoor, href }, locale),
    feature,
    group,
    terminHref: ROUTES.beratung[locale] || ROUTES.beratung.de,
  };
}
