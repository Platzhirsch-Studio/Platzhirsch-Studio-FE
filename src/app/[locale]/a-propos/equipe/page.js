import React from "react";
import SinglePageBanner from "@/components/Reusable/singlePageSlider";
import Teamsecond from "@/components/Team/team";
import TeamMember from "@/components/Team/teammember";
import { fetchTeamData } from "@/lib/api/fetchTeam";
import { ROUTES } from "@/utils/routing";
import {
  fetchTeamKeywords,
  getLocalizedTeamMetadata,
  getTeamOGImage,
  validateOGType
} from "@/lib/api/Keywords/fetchTeamKeywords";

function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getTeamPageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/chi-siamo/team`;
    case "en":
      return `${baseUrl}/about-us/team`;
    case "fr":
      return `${baseUrl}/a-propos/equipe`;
    case "de":
    default:
      return `${baseUrl}/ueber-uns/team`;
  }
}

const getLocalizedTitle = (locale) => {
  switch (locale) {
    case "it": return "Il Nostro Team | Esperti di Design da Platzhirsch Home Living";
    case "en": return "Meet Our Team | Design Experts at Platzhirsch Home Living";
    case "fr": return "Notre Équipe | Experts en Design chez Platzhirsch Home Living";
    default: return "Unser Team | Kreativexperten bei Platzhirsch Home Living";
  }
};

const getLocalizedDescription = (locale) => {
  switch (locale) {
    case "it": return "Conosci il nostro team creativo di Platzhirsch Home Living. Esperti nel design esclusivo.";
    case "en": return "Meet our creative team at Platzhirsch Home Living. Experts in exclusive design.";
    case "fr": return "Rencontrez notre équipe créative chez Platzhirsch Home Living. Experts en design exclusif.";
    default: return "Lernen Sie unser kreatives Team bei Platzhirsch Home Living kennen. Experten für exklusives Design.";
  }
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const PAGE_URL = getTeamPageUrl(locale);
  try {
    const teamKeywords = await fetchTeamKeywords();

    if (!teamKeywords) {
      return {
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        robots: { index: true, follow: true },
        alternates: {
          canonical: PAGE_URL,
          languages: {
            'de-AT': getTeamPageUrl('de'),
            'de': getTeamPageUrl('de'),
            'en': getTeamPageUrl('en'),
            'fr-FR': getTeamPageUrl('fr'),
            'it-IT': getTeamPageUrl('it'),
            'x-default': getTeamPageUrl('de'),
          }
        },
        openGraph: {
          type: "website",
          url: PAGE_URL,
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          siteName: "Platzhirsch Home Living",
          locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE",
          images: [{ url: "/Images/Team/reading-area.jpg", width: 1200, height: 630, alt: "Team – Platzhirsch Home Living" }],
        },
        twitter: {
          card: "summary_large_image",
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          images: ["/Images/Team/reading-area.jpg"],
        },
      };
    }


    const meta = getLocalizedTeamMetadata(teamKeywords, locale);
    const image = getTeamOGImage(teamKeywords);
    const safeType = validateOGType(meta?.type);

    return {
      title: meta?.title || getLocalizedTitle(locale),
      description: meta?.description || getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: {
        canonical: meta?.url || PAGE_URL,
        languages: {
          'de-AT': getTeamPageUrl('de'),
          'de': getTeamPageUrl('de'),
          'en': getTeamPageUrl('en'),
          'fr-FR': getTeamPageUrl('fr'),
          'it-IT': getTeamPageUrl('it'),
          'x-default': getTeamPageUrl('de'),
        }
      },
      openGraph: {
        title: meta?.title || getLocalizedTitle(locale),
        description: meta?.description || getLocalizedDescription(locale),
        url: meta?.url || PAGE_URL,
        siteName: "Platzhirsch Home Living",
        images: [
          {
            url: image ? image : "/Images/Team/reading-area.jpg",
            width: 1200,
            height: 630,
            alt: "Team – Platzhirsch Home Living",
          },
        ],
        locale: meta?.locale || (locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE"),
        type: safeType,
      },
      twitter: {
        card: "summary_large_image",
        title: meta?.title || getLocalizedTitle(locale),
        description: meta?.description || getLocalizedDescription(locale),
        images: [image ? image : "/Images/Team/reading-area.jpg"],
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

export default async function page({ params }) {
  const { locale } = await params;

  const team = await fetchTeamData();

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
      ? "Squadra"
      : locale == "en"
        ? "Team"
        : locale == "fr"
          ? "L'équipe"
          : "Team";
  const Home =
    locale == "it"
      ? "Casa "
      : locale == "en"
        ? "Home"
        : locale == "fr"
          ? "Accueil"
          : "Home";

  const BASE_URL = getBaseUrl(locale);
  const PAGE_URL = getTeamPageUrl(locale);
  const teamPath = ROUTES.team[locale] ? `${ROUTES.team[locale]}` : `/ueber-uns/team`;

  const BannerInfo = {
    image: "/Images/Team/reading-area.jpg",
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
        link: teamPath,
      },
    ],
    title: linkNameTwo, // Added title property
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${PAGE_URL}/#webpage`,
    url: PAGE_URL,
    name: linkNameTwo,
    description: "Unser kreatives Team bei Platzhirsch Home Living - Experten für exklusives Design.",
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-AT",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    dateModified: new Date().toISOString().split("T")[0],
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: Home, item: `${BASE_URL}/${locale}` },
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
      <Teamsecond />
      <TeamMember team={team} />
    </div>
  );
}

export const revalidate = 3600;