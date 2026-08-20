import React from "react";
import SinglePageBanner from "@/components/Reusable/singlePageSlider";
import PartnerSecond from "@/components/Partner/partner";
import { ROUTES } from "@/utils/routing";
import {
  fetchPartnersKeywords,
  getLocalizedPartnersMetadata,
  getPartnersOGImage,
  validateOGType
} from "@/lib/api/Keywords/fetchPartnersKeywords";

function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getPartnerPageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/chi-siamo/partner`;
    case "en":
      return `${baseUrl}/about-us/partners`;
    case "fr":
      return `${baseUrl}/a-propos/partenaires`;
    case "de":
      return `${baseUrl}/ueber-uns/partner`;
    default:
      return `${baseUrl}/ueber-uns/partner`;
  }
}


const getLocalizedTitle = (locale) => {
  switch (locale) {
    case "it": return "I Nostri Partner | Collaborazioni di Platzhirsch Studio";
    case "en": return "Our Partners | Trusted Collaborations at Platzhirsch Studio";
    case "fr": return "Nos Partenaires | Collaborations de Platzhirsch Studio";
    default: return "Unsere Partner | Kooperationen von Platzhirsch Studio";
  }
};

const getLocalizedDescription = (locale) => {
  switch (locale) {
    case "it": return "I nostri partner di fiducia nel design esclusivo. Collaborazioni di alta qualità.";
    case "en": return "Our trusted partners in exclusive design. High-quality collaborations.";
    case "fr": return "Nos partenaires de confiance en design exclusif. Collaborations de haute qualité.";
    default: return "Unsere vertrauenswürdigen Partner im exklusiven Design. Hochwertige Kooperationen.";
  }
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const PAGE_URL = getPartnerPageUrl(locale);

  try {
    // Use the new API function
    const partnersKeywords = await fetchPartnersKeywords();

    if (!partnersKeywords) {
      return {
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        robots: { index: true, follow: true },
        alternates: {
          canonical: PAGE_URL,
          languages: {
            'de': getPartnerPageUrl('de'),
            'en': getPartnerPageUrl('en'),
            'fr': getPartnerPageUrl('fr'),
            'it': getPartnerPageUrl('it'),
            'x-default': getPartnerPageUrl('de'),

          }
        },
        openGraph: {
          type: "website",
          url: PAGE_URL,
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          siteName: "Platzhirsch Studio",
          locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE",
          images: [{ url: "/Images/Partner/dinner-area.jpg", width: 1200, height: 630, alt: "Partner – Platzhirsch Studio" }],
        },
        twitter: {
          card: "summary_large_image",
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          images: ["/Images/Partner/dinner-area.jpg"],
        },
      };
    }

    const meta = getLocalizedPartnersMetadata(partnersKeywords, locale);
    const image = getPartnersOGImage(partnersKeywords);
    const safeType = validateOGType(meta?.type);

    return {
      title: meta?.title || getLocalizedTitle(locale),
      description: meta?.description || getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: {
        canonical: meta?.url || PAGE_URL,
        languages: {
          'de': getPartnerPageUrl('de'),
          'en': getPartnerPageUrl('en'),
          'fr': getPartnerPageUrl('fr'),
          'it': getPartnerPageUrl('it'),
          'x-default': getPartnerPageUrl('de'),

        }
      },
      openGraph: {
        title: meta?.title || getLocalizedTitle(locale),
        description: meta?.description || getLocalizedDescription(locale),
        url: meta?.url || PAGE_URL,
        siteName: "Platzhirsch Studio",
        images: [
          {
            url: image ? image : "/Images/Partner/dinner-area.jpg",
            width: 1200,
            height: 630,
            alt: "Partner – Platzhirsch Studio",
          },
        ],
        locale: meta?.locale || (locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE"),
        type: safeType,
      },
      twitter: {
        card: "summary_large_image",
        title: meta?.title || getLocalizedTitle(locale),
        description: meta?.description || getLocalizedDescription(locale),
        images: [image ? image : "/Images/Partner/dinner-area.jpg"],
      },
    };
  } catch (error) {
    console.error("❌ Metadata fetch error:", error);

    return {
      title: getLocalizedTitle(locale),
      description: getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: { canonical: PAGE_URL },
    };
  }
}

export default async function Page({ params }) {
  const { locale } = await params;


  const linkNameOne =
    locale == "it"
      ? "SU DI NOI"
      : locale == "en"
        ? "ABOUT US"
        : locale == "fr"
          ? "À PROPOS"
          : "ÜBER UNS";
  const linkNameTwo =
    locale == "it"
      ? "Partner"
      : locale == "en"
        ? "Partner"
        : locale == "fr"
          ? "Partenaire"
          : "Partner";
  const Home =
    locale == "it"
      ? "Casa "
      : locale == "en"
        ? "Home"
        : locale == "fr"
          ? "Accueil"
          : "Home";

  const BASE_URL = getBaseUrl(locale);
  const PAGE_URL = getPartnerPageUrl(locale);

  const partnerPath = ROUTES.partner[locale] ? `${ROUTES.partner[locale]}` : `/ueber-uns/partner`;

  const BannerInfo = {
    image: "/Images/Partner/dinner-area.jpg",
    links: [
      {
        linkName: Home,
        link: "/",
      },
      {
        linkName: linkNameOne,
      },
      {
        linkName: linkNameTwo,
        link: partnerPath,
      },
    ],
    title: linkNameTwo,
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${PAGE_URL}/#webpage`,
    url: PAGE_URL,
    name: linkNameTwo,
    description: "Unsere Partner im exklusiven Design bei Platzhirsch Studio - Hochwertige Kooperationen.",
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-DE",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    dateModified: new Date().toISOString().split("T")[0],
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: Home, item: `/${locale}` },
        { "@type": "ListItem", position: 2, name: linkNameTwo, item: PAGE_URL },
      ],
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <SinglePageBanner info={BannerInfo} />
      <PartnerSecond />
    </div>
  );
}

export const revalidate = 3600;