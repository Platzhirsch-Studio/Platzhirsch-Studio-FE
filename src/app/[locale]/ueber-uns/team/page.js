import React from "react";
import JsonLd from "@/components/Reusable/JsonLd";
import Teamsecond, { teamTrail } from "@/components/Team/team";
import { getTranslations } from "next-intl/server";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { graph, teamPersonSchema } from "@/lib/seo/structuredData";
import TeamMember from "@/components/Team/teammember";
import { HARALD } from "@/components/Team/teamCopy";
import { PROFILE_URL } from "@/components/Team/haraldProfil";
import { fetchTeamData } from "@/lib/api/fetchTeam";
import { DEFAULT_OG_IMAGE, hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";
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
    // Runde 2: factual, no advertising phrase ("Kreativexperten", "Design Experts").
    case "it": return "Il nostro team a Lochau | Platzhirsch Home Living";
    case "en": return "Our team in Lochau | Platzhirsch Home Living";
    case "fr": return "Notre équipe à Lochau | Platzhirsch Home Living";
    default: return "Unser Team in Lochau | Platzhirsch Home Living";
  }
};

// Description: our own, factual text wins over the CMS (QA Runde 1, P2-2:
// the CMS text still says "exklusiv"). The CMS keeps title, image and type.
const getLocalizedDescription = (locale) => {
  switch (locale) {
    case "it": return "Il team di Platzhirsch Home Living a Lochau: consulenza, progettazione e montaggio di mobili di design, cucine e outdoor.";
    case "en": return "The team of Platzhirsch Home Living in Lochau: advice, planning and installation of designer furniture, kitchens and outdoor living.";
    case "fr": return "L’équipe de Platzhirsch Home Living à Lochau : conseil, planification et montage de mobilier design, cuisines et outdoor.";
    default: return "Das Team von Platzhirsch Home Living in Lochau: Beratung, Planung und Montage von Designermöbeln, Küchen und Outdoor.";
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
          languages: hreflangLanguages((l) => getTeamPageUrl(l))
        },
        openGraph: {
          type: "website",
          url: PAGE_URL,
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          siteName: "Platzhirsch Home Living",
          locale: ogLocale(locale),
          images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Team – Platzhirsch Home Living" }],
        },
        twitter: {
          card: "summary_large_image",
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          images: [DEFAULT_OG_IMAGE],
        },
      };
    }


    const meta = getLocalizedTeamMetadata(teamKeywords, locale);
    const image = getTeamOGImage(teamKeywords);
    const safeType = validateOGType(meta?.type);

    return {
      title: getLocalizedTitle(locale),
      description: getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: {
        canonical: PAGE_URL,
        languages: hreflangLanguages((l) => getTeamPageUrl(l))
      },
      openGraph: {
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        url: PAGE_URL,
        siteName: "Platzhirsch Home Living",
        images: [
          {
            url: image ? image : DEFAULT_OG_IMAGE,
            width: 1200,
            height: 630,
            alt: "Team – Platzhirsch Home Living",
          },
        ],
        locale: ogLocale(locale),
        type: safeType,
      },
      twitter: {
        card: "summary_large_image",
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        images: [image ? image : DEFAULT_OG_IMAGE],
      },
    };
  } catch (error) {
    console.error("❌ Metadata fetch error:", error);

    return {
      title: getLocalizedTitle(locale),
      description: getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: { canonical: PAGE_URL, languages: hreflangLanguages((l) => getTeamPageUrl(l)) },
    };
  }
}


export default async function page({ params }) {
  const { locale } = await params;

  const team = await fetchTeamData();

  const linkNameTwo =
    locale == "it"
      ? "Squadra"
      : locale == "en"
        ? "Team"
        : locale == "fr"
          ? "L'équipe"
          : "Team";
  const PAGE_URL = getTeamPageUrl(locale);

  // Runde 2 (seo P2-5/P2-6): BreadcrumbList = visible trail (menu: Das Haus ›
  // Team, src/lib/seo/breadcrumbs.js) and a Person node per team member with an
  // entry in TEAM_PEOPLE (Harald Menghin) – only facts the page shows.
  const tTeam = await getTranslations({ locale, namespace: "inhalt.team" });
  const roles = tTeam.has("roles") ? tTeam.raw("roles") || {} : {};
  const notes = tTeam.has("notes") ? tTeam.raw("notes") || {} : {};
  const names = new Set((Array.isArray(team) ? team : []).map((m) => m?.title).filter(Boolean));
  const people = [...names]
    .map((name) =>
      teamPersonSchema({
        name,
        locale,
        // Rat 9,5 (B14): Harald's Person node points to his profile page (same @id there).
        pageUrl: name === HARALD ? PROFILE_URL : PAGE_URL,
        jobTitle: (team.find((m) => m?.title === name)?.role || roles[name] || "").trim(),
        description: notes[name] || "",
      })
    )
    .filter(Boolean);

  const webPageSchema = graph(
    {
      "@type": "WebPage",
      "@id": `${PAGE_URL}/#webpage`,
      url: PAGE_URL,
      name: linkNameTwo,
      description: getLocalizedDescription(locale),
      inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-AT",
      isPartOf: { "@id": "https://platzhirsch.studio/#website" },
      breadcrumb: { "@id": `${PAGE_URL}/#breadcrumb` },
      ...(people.length ? { mentions: people.map((p) => ({ "@id": p["@id"] })) } : {}),
    },
    breadcrumbJsonLd(teamTrail(locale), locale, { id: `${PAGE_URL}/#breadcrumb`, context: false }),
    ...people
  );

  return (
    <div>
      <JsonLd data={webPageSchema} />
      <Teamsecond team={team} />
      <TeamMember team={team} />
    </div>
  );
}

export const revalidate = 3600;