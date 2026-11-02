// src/app/[locale]/page.js
// Homepage of the Neuauftritt (Paket "Startseite"; Design-Bibel §10.2, Jury-
// Urteil §3). This file only composes the sections; metadata, canonical,
// hreflang and the JSON-LD (WebPage + FAQPage) are unchanged.
// R5-fix P2 (HTML size, technik): `curl http://localhost:3000/de` (dev,
// 29.10.2026) 500 555 → 492 094 bytes (gzip 95 KB → 91 KB) after the
// armchair strokes left the Wow hero and the map and pictogram paths moved
// into static sprites (Home/dreilaenderGeo.js, Home/pictoPaths.js). Breakdown
// of the rest: RSC payload 267 KB (dev; of it ~32 KB the client messages of
// the layout's NextIntlClientProvider and ~16 KB the wordmark path written
// three times by header/footer), HTML 179 KB (shell 59 KB, <main> 121 KB).
// The < 250 KB goal needs the layout/shell (messages per namespace, wordmark
// as sprite) – production value: measured by P1 in platzhirsch-prodtest.
import Hero from "@/components/Home/Hero";
import HostPromises from "@/components/WhyChooseUsSectionHome/WhyChooseUsSectionHome";
import Rooms from "@/components/Home/Rooms";
import CuratedSelection from "@/components/ProuductSectionHome/ProuductSectionHome";
import HouseCafe from "@/components/Home/HouseCafe";
import Process from "@/components/Home/Process";
import DreilaenderService from "@/components/Home/DreilaenderService";
import Journal from "@/components/Home/Journal";
import ClosingCta from "@/components/Home/ClosingCta";
import { homeSeo } from "@/lib/content/homeSeo";
import { fetchSlicedNewsData } from "@/lib/api/fetchNewsData";
import { fetchHomepage } from "@/lib/api/fetchHomepage";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import { IN_LANGUAGE, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/structuredData";
import JsonLd from "@/components/Reusable/JsonLd";
import OwnImageJsonLd from "@/components/Reusable/OwnImageJsonLd";
import { hreflangLanguages } from "@/lib/seo/pageMetadata";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/config";

const BASE_URL = "https://platzhirsch.studio";


// Fix-Runde 1 (F1, Release-Rat seo P1-5, USP-Durchdringungsplan 1.6): the
// core USP "von Hand gezeichnet" (Inhaber-Entscheidung Nr. 8) in title and
// description, the place (Lochau, Bodensee, Vorarlberg) instead of the old
// blanket "ganz Österreich". Title ≤ 65, description ≤ 165 characters
// (tests/unit/f1-startseite.test.mjs). These texts win over the CMS fields,
// which still carry the old wording.
// Runde 2, Fix-Team P2 (recht P2-5, seo P2-2): "von Hand gezeichnet" belongs
// to the interior design, not to the designer furniture (Minotti & Co. are
// not drawn by Platzhirsch) – the title names the planning first.
// R5-USP (seo P1-4): the most important title of the domain names the place –
// Lochau and Bodensee/Lake Constance – in every locale, at most 60
// characters, the USP stays (tests/e2e/r5-usp-startseite.spec.js).
// Inhaber-Entscheidung 30.10.2026 (bewusst geändert): der Firmenname steht vorn
// im Titel. „platzhirsch lochau“ lief auf Platz 2 hinter platzhirsch.cafe; der
// USP „von Hand gezeichnet“ bleibt in der Description. ≤ 65 Zeichen.
const FALLBACK_META_BY_LOCALE = {
  de: {
    title: "Platzhirsch Home Living – Interior Design & Designermöbel Lochau",
    description: "Interior Design am Bodensee: von Hand gezeichnet, als Modell gebaut, in 3D geplant. Designermöbel im Showroom mit Café in Lochau, Vorarlberg.",
  },
  en: {
    title: "Platzhirsch Home Living – Interior Design & Furniture in Lochau",
    description: "Interior design on Lake Constance: drawn by hand, built as a model, planned in 3D. Designer furniture in our showroom with café in Lochau, Vorarlberg.",
  },
  fr: {
    title: "Platzhirsch Home Living – design d’intérieur et mobilier, Lochau",
    description: "Intérieurs au lac de Constance dessinés à la main, en maquette, puis en 3D. Mobilier design dans notre showroom avec café à Lochau, Vorarlberg.",
  },
  it: {
    title: "Platzhirsch Home Living – interior design e arredi a Lochau",
    description: "Interni sul Lago di Costanza disegnati a mano, in plastico, poi in 3D. Mobili di design nel nostro showroom con caffè a Lochau, Vorarlberg.",
  },
};

function getFallbackMeta(locale) {
  return FALLBACK_META_BY_LOCALE[locale] || FALLBACK_META_BY_LOCALE.de;
}

// Complete metadata when the CMS is unavailable: canonical, hreflang and robots
// must not disappear just because the backend hiccuped (the layout deliberately
// sets none of them, so a title-only fallback left the page without a canonical).
function fallbackMetadata(locale) {
  const meta = getFallbackMeta(locale);
  const canonical = `${BASE_URL}/${locale}`;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical, languages: hreflangLanguages((l) => `${BASE_URL}/${l}`) },
    robots: { index: true, follow: true },
    openGraph: { type: "website", url: canonical, title: meta.title, description: meta.description },
  };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  // Not a locale (e.g. /wp-login.php): no home title/canonical/hreflang;
  // the layout titles it as 404 (R4-release).
  if (!routing.locales.includes(locale)) return { robots: { index: false, follow: true } };

  try {
    const [apiData] = await Promise.all([
      fetchHomepage(),
    ]);

    const home = apiData?.[0];


    if (!home) return fallbackMetadata(locale);

    // Safely extract localized metadata fields
    const metaTabs = {
      de: {
        locale: home.metadata?.metadata_local_de || "de_AT",
        sitename: home.metadata?.metadata_sitename_de || "Platzhirsch Home Living",
        type: home.metadata?.metadata_type_de || "website",
        title: getFallbackMeta("de").title, // F1: USP title wins over the CMS field
        description: getFallbackMeta("de").description, // R6-i18n: CMS-Feld mit „exklusiv“ (Wortliste), neutrale Fassung hat Vorrang
        url: home.metadata?.metadata_url_de || BASE_URL,
      },
      en: {
        locale: home.metadata?.metadata_local_en || "en_GB",
        sitename: home.metadata?.metadata_sitename_en || "Platzhirsch Home Living",
        type: home.metadata?.metadata_type_en || "website",
        title: getFallbackMeta("en").title, // F1: USP title wins over the CMS field
        description: getFallbackMeta("en").description, // R6-i18n: CMS-Feld mit „exklusiv“ (Wortliste), neutrale Fassung hat Vorrang
        url: home.metadata?.metadata_url_en || BASE_URL,
      },
      it: {
        locale: home.metadata?.metadata_local_it || "it_IT",
        sitename: home.metadata?.metadata_sitename_it || "Platzhirsch Home Living",
        type: home.metadata?.metadata_type_it || "website",
        title: getFallbackMeta("it").title, // F1: USP title wins over the CMS field
        description: getFallbackMeta("it").description, // R6-i18n: CMS-Feld mit „exklusiv“ (Wortliste), neutrale Fassung hat Vorrang
        url: home.metadata?.metadata_url_it || BASE_URL,
      },
      fr: {
        locale: home.metadata?.metadata_local_fr || "fr_FR",
        sitename: home.metadata?.metadata_sitename_fr || "Platzhirsch Home Living",
        type: home.metadata?.metadata_type_fr || "website",
        title: getFallbackMeta("fr").title, // F1: USP title wins over the CMS field
        description: getFallbackMeta("fr").description, // R6-i18n: CMS-Feld mit „exklusiv“ (Wortliste), neutrale Fassung hat Vorrang
        url: home.metadata?.metadata_url_fr || BASE_URL,
      },
    };

    const meta = metaTabs[locale] || metaTabs.de;

    // Validate OpenGraph type
    const validOGTypes = [
      "website", "article", "book", "profile", "video.movie",
      "video.episode", "video.tv_show", "video.other",
      "music.song", "music.album", "music.playlist", "music.radio_station",
    ];
    const safeType = validOGTypes.includes(meta.type) ? meta.type : "website";

    // Social preview image (og:image / twitter:image): the CMS image for this
    // locale, falling back to the German one, then to a static image. CMS
    // files live on the backoffice and are served through the /cms rewrite —
    // without the /cms prefix the URL 404s.
    const cmsImagePath =
      home.metadata?.[`metadata_images_${locale}`]?.[0]?.bild_anhagen ||
      home.metadata?.metadata_images_de?.[0]?.bild_anhagen;
    const image = cmsImagePath
      ? `https://platzhirsch.studio/cms${cmsImagePath.replace(/ /g, "%20")}`
      : "https://platzhirsch.studio/Images/Home/aboutHome.jpg";
    const canonical = `${BASE_URL}/${locale}`;

    const languages = hreflangLanguages((l) => `${BASE_URL}/${l}`);

    return {
      title: meta.title,
      description: meta.description, alternates: { canonical: canonical, languages: languages, },
      robots: { index: true, follow: true },
      openGraph: {
        type: safeType,
        url: canonical,
        siteName: meta.sitename,
        title: meta.title,
        description: meta.description,
        images: [{ url: image, alt: "Designermarken – Platzhirsch Home Living" }],
        locale: meta.locale,
      },
      twitter: {
        card: "summary_large_image",
        title: meta.title,
        description: meta.description,
        images: [image],
      },
    };
  } catch (error) {
    console.error("❌ Metadata fetch error:", error);
    return fallbackMetadata(locale);
  }
}

export default async function Home({ params }) {
  const { locale } = await params;
  // Not a locale (e.g. /wp-login.php): 404 before any next-intl call without
  // explicit locale reads headers() - in the static build that was a 500
  // ("static to dynamic at runtime, reason: headers", R4-release).
  if (!routing.locales.includes(locale)) notFound();

  // Fetch in parallel. Every fetcher has its own fallback, so a backend
  // hiccup hides a section instead of failing the page. The curated products
  // are loaded inside CuratedSelection (shared cache with the product pages).
  const [newsData, brands] = await Promise.all([
    fetchSlicedNewsData(),
    fetchRawMarkenData().catch(() => []),
  ]);

  // Same title/description as generateMetadata (F1: the USP wording wins over the CMS fields).
  const { title, description } = getFallbackMeta(locale);

  // Schema.org structured data for SEO
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/${locale}/#webpage`,
    url: `${BASE_URL}/${locale}`,
    name: title,
    description: description,
    inLanguage: IN_LANGUAGE[locale] || IN_LANGUAGE.de,
    isPartOf: { "@id": WEBSITE_ID },
    // The business itself (Organization + FurnitureStore) is defined once,
    // site-wide, in [locale]/layout.js — referenced here, not repeated.
    about: { "@id": ORGANIZATION_ID },
    datePublished: "2026-06-01",
  };
  // The homepage FAQ (SeoIntro) as FAQPage, same questions and answers.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${BASE_URL}/${locale}/#faq`,
    inLanguage: IN_LANGUAGE[locale] || IN_LANGUAGE.de,
    mainEntity: homeSeo(locale).faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  // Bodoni on 1× / 1.25× screens (QA runde 1, P1-2): with
  // font-optical-sizing:auto the 44–96 px display sizes get the high-contrast
  // optical size and hairlines thinner than a device pixel ("für" → "fiir").
  // A fixed opsz keeps the hairlines ≥ 1 px. Scoped to this page until the
  // Fundament package moves the value into the typo tokens (globals.css).
  return (
    <div className="[&_.font-display]:[font-variation-settings:'opsz'_28] [&_.font-display-italic]:[font-variation-settings:'opsz'_28]">
      {/* Structured Data Scripts */}
      <JsonLd data={webPageSchema} />
      <JsonLd data={faqSchema} />
      {/* Bilder-SEO: Bildnachweis für das eigene Hero-Foto (Urheber-Register src/lib/seo/imageRights.js). */}
      <OwnImageJsonLd images={[{ src: "/Images/Home/aboutHome.jpg", width: 2048, height: 1228 }]} />
      {/* B12 (31.10.2026, Rat 9,5, Tempo-Team freigegeben): 13 → 9 chapters,
          <main> on phones below 9 000 px. Nothing dropped – former chapters
          are blocks of a neighbouring chapter:
            1 Hero (unchanged: H1, LCP image, Wow stage, hours/address/phone)
            2 Räume
            3 Sechs Stücke + Marken (BrandList as foot of CuratedSelection)
            4 Kern-USP "Von Hand gezeichnet" (Inhaber-Entscheidung Nr. 8)
            5 Haus & Café (the page's ONE walnut surface)
            6 Gastgeber = promises + "Mehr als Möbel" + "Vorab ausprobieren"
              (Services and ToolsShowcase inside HostPromises)
            7 Dreiländer-Service
            8 Aus dem Haus = news/Ratgeber + SEO text, FAQ, region line
              (SeoIntro as foot of Journal, still a labelled section)
            9 Closing CTA with the Leitsatz "Nehmen Sie Platz."
          Surfaces alternate surface/band (walnut once). All server
          components, no carousel and no client island. */}
      <Hero locale={locale} />
      <Rooms locale={locale} />
      <CuratedSelection locale={locale} brands={brands} />
      {/* Kern-USP (Inhaber-Entscheidung Nr. 8): hand drawing → model → 3D → rendering. */}
      <Process locale={locale} />
      <HouseCafe locale={locale} />
      <HostPromises locale={locale} />
      <DreilaenderService locale={locale} />
      <Journal locale={locale} news={newsData} />
      <ClosingCta locale={locale} />
    </div>
  );
}

// Revalidate the page every hour
export const revalidate = 3600;