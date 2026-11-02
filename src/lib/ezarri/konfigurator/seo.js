// src/lib/ezarri/konfigurator/seo.js – Metadaten, Brotkrumen und BreadcrumbList der
// Werkzeugseiten (Konfigurator, Druckblatt, Mosaik-Rechner) in DE/EN/FR/IT.
//
// Wie ezarriMetadata() (src/components/Ezarri/Welt/meta.js: robots über
// withEzarriRobots, canonical ohne Query, Titel ≤ 60, Description ≤ 150), aber
// mit eigener Canonical je Sprache auch für fr/it und hreflang über alle aktiven
// Sprachen (toolLanguagesFrom, TOOL_LOCALES = de/en/fr/it, wie EZARRI_WELT_LOCALES).
// Voraussetzung: /fr|it/ezarri/{konfigurator,rechner} ohne 308 (deOnlyRedirects,
// Integration) – bis dahin zeigen fr/it-Verweise auf die Weiterleitung.
// Server-only im Gebrauch.
import { withEzarriRobots } from "@/lib/ezarri/config";
import { SITE_NAME, SITE_URL, clampDescription, fitTitle, localeUrl, ogLocale } from "@/lib/seo/pageMetadata";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { ezBreadcrumbList, ezCrumbsFor, EZ_HUB_CRUMB } from "@/lib/ezarri/crumbs";
import { TOOL_LOCALES, toolLang, toolLanguagesFrom } from "./intl";

/** Freigegebenes Ezarri-Material (wie EZARRI_OG_FALLBACK in Welt/meta.js). */
const OG_FALLBACK = "/ezarri/gemma/anw-celestite-25-gemma-mosaic-pool-ezarri-1";

/** Hub-Brotkrume je Sprache (= Shell.nav.ezarri in fr.json/it.json). */
const HUB_LABEL = { fr: "Mosaïque de verre Ezarri", it: "Mosaico in vetro Ezarri" };

export const toolActiveLocales = () => TOOL_LOCALES;

/** hreflang-Satz der Seite (alle aktiven Sprachen + x-default). */
export function toolLanguages(path) {
  return toolLanguagesFrom((l) => localeUrl(l, path), toolActiveLocales());
}

/**
 * @param {{locale:string, path:string, title:string, description:string, image?:string, imageAlt?:string, utility?:boolean}} o
 */
export function toolMetadata({ locale, path, title, description, image, imageAlt, utility = false }) {
  const lang = toolLang(locale);
  const url = localeUrl(lang, path);
  const ogImage = `${image || OG_FALLBACK}-1600.webp`;
  const fullTitle = fitTitle(`${title} | Platzhirsch`);
  const desc = clampDescription(description);
  return withEzarriRobots(
    {
      title: fullTitle,
      description: desc,
      alternates: { canonical: url, languages: toolLanguages(path) },
      openGraph: { type: "website", url, title: fullTitle, description: desc, siteName: SITE_NAME, locale: ogLocale(lang), images: [{ url: ogImage, alt: imageAlt || title }] },
      twitter: { card: "summary_large_image", title: fullTitle, description: desc, images: [ogImage] },
    },
    { utility },
  );
}

/** Brotkrumen in der Sprache der Seite: Startseite › Ezarri › {label}. */
export function toolCrumbs(locale, label) {
  const lang = toolLang(locale);
  if (lang === "de" || lang === "en") return ezCrumbsFor(lang, { label });
  return [{ label: homeCrumbLabel(lang), href: "/" }, { ...EZ_HUB_CRUMB, label: HUB_LABEL[lang] }, { label }];
}

/** BreadcrumbList mit URLs der eigenen Sprache. */
export function toolCrumbsSchema(crumbs, locale, pageHref) {
  return ezBreadcrumbList(crumbs, { siteUrl: SITE_URL, locale: toolLang(locale), pageHref });
}
