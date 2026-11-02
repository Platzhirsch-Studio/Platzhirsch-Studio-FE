// /en/sofaplaner – server-rendered page texts and SEO in English (Welle 2,
// team EN-Yacht-Sofa, 29.10.2026). The German page keeps its texts in
// src/app/[locale]/sofaplaner/page.js and src/lib/sofaplaner/consent.js.
import { SITE_NAME, SITE_URL, hreflangLanguages, localeUrl, ogLocale } from "../../seo/pageMetadata.js";
import { ORGANIZATION_ID, WEBSITE_ID, breadcrumbList, graph } from "../../seo/structuredData.js";
import { sourceCopy } from "./source.js";

export const SOFA_PATH = "/sofaplaner";
// Sprachen-Welle FR/IT (01.11.2026): alle vier Sprachen (FR/IT-Texte in ./page-intl.js).
export const SOFA_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

/** hreflang of the planner: de (+ de-AT/-CH), en, fr (+ -FR/-CH), it (+ -IT/-CH), x-default (= German) – the same set on every version. */
export function sofaLanguages() {
  return hreflangLanguages((l) => localeUrl(l, SOFA_PATH));
}

const OG_IMAGE = `${SITE_URL}/og/sofaplaner.jpg`; // Rat 9,5 B20
const OG_ALT = "Sofa planner: corner sofa in the floor plan of a room, with dimensions";

/** generateMetadata() result of /en/sofaplaner (robots as the German page). */
export function sofaMetadataEn(robots = { index: true, follow: true }) {
  const sc = sourceCopy("en");
  const url = localeUrl("en", SOFA_PATH);
  const image = { url: OG_IMAGE, width: 1200, height: 630, alt: OG_ALT };
  return {
    title: sc.metaTitle,
    description: sc.metaDescription,
    robots,
    alternates: { canonical: url, languages: sofaLanguages() },
    openGraph: { type: "website", url, title: sc.seoName, description: sc.metaDescription, siteName: SITE_NAME, locale: ogLocale("en"), images: [image] },
    twitter: { card: "summary_large_image", title: sc.seoName, description: sc.metaDescription, images: [image.url] },
  };
}

/** JSON-LD of /en/sofaplaner: WebPage + BreadcrumbList + WebApplication (same shape as werkzeugSchema). */
export function sofaSchemaEn() {
  const sc = sourceCopy("en");
  const url = localeUrl("en", SOFA_PATH);
  const app = {
    "@type": "WebApplication",
    "@id": `${url}#app`,
    name: sc.seoName,
    url,
    applicationCategory: "DesignApplication",
    operatingSystem: "Web browser",
    browserRequirements: "Current browser with JavaScript",
    inLanguage: "en-GB",
    isAccessibleForFree: true,
    image: OG_IMAGE,
    description: sc.metaDescription,
    provider: { "@id": ORGANIZATION_ID },
  };
  return graph(
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: sc.seoName,
      description: sc.metaDescription,
      inLanguage: "en-GB",
      isPartOf: { "@id": WEBSITE_ID },
      publisher: { "@id": ORGANIZATION_ID },
      primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE, width: 1200, height: 630 },
      breadcrumb: { "@id": `${url}#breadcrumb` },
      mainEntity: { "@id": app["@id"] },
    },
    breadcrumbList([{ name: "Home", url: "/en" }, { name: sc.seoName }], `${url}#breadcrumb`),
    app
  );
}

/** Server-rendered texts of the page (readable without JavaScript). */
export const PAGE_EN = Object.freeze({
  unknownModel: (m) => `The model “${m}” was not found. Please choose a model from the list.`,
  badShare: "The shared plan was not found or the link is not valid. You are seeing a starting suggestion.",
  sharedLoaded: (name, dropped) => `Shared plan “${name}” loaded. Changes affect only your view.${dropped ? ` ${dropped} element(s) are no longer in the catalogue.` : ""}`,
  heroCaption: (brand, name, depth, height) => `${brand ? name : `Sofa type “${name}”`}, front view · depth ${depth} cm, height ${height} cm`,
  heroTitle: (name) => `Sofa type ${name} in front view`,
  asideLabel: "Example: sofa in front view and floor plan",
  // Rat 9,5 A11 (T2): tool → person, desktop start button.
  handLine: "Start online – Harald Menghin then draws your concept by hand.",
  startCta: "Start planning",
  tipsTitle: "What matters when planning",
  tips: (min, ideal) => [
    ["Walkways:", `leave ${min}–${ideal} cm in front of the sofa and between pieces; main routes to doors rather ${ideal} cm or more.`],
    ["Joining left/right:", "end elements come with the armrest on the left or right, seen from the front of the sofa. The planner chooses the right side itself when joining."],
    ["Windows:", "compare back height and sill – if the sill is lower, the back reaches into the window."],
    ["Delivery route:", "measure the stairwell, door widths and lift in advance – modular elements come into the house one by one."],
  ],
});
