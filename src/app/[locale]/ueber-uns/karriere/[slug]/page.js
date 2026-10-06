// app/[locale]/ueber-uns/karriere/[slug]/page.js — serves all four languages
// (/en/about-us/career/…, /fr/a-propos/carriere/…, /it/chi-siamo/carriera/…
// are mapped here by src/proxy.js).
import { fetchKarriereData } from "@/lib/api/fetchKarrierData";
import JobDetailsClient from "./jobdetailsclient";
import { generateSlug } from "@/lib/slugify";
import { notFound } from "next/navigation";
import { ROUTES } from "@/utils/routing";
import { toMetaDescription } from "@/lib/seo/pageMetadata";
import { localizedJobDescription } from "@/lib/seo/structuredData";
import JobPostingJsonLd from "@/components/Karriere/jobPostingJsonLd";
import { hreflangLanguages } from "@/lib/seo/pageMetadata";

export async function generateStaticParams() {
  const jobs = await fetchKarriereData();
  const activeJobs = jobs.filter(job => job.status === "Aktiv");

  const locales = ['de', 'en', 'fr', 'it'];
  const paths = [];

  for (const locale of locales) {
    for (const job of activeJobs) {
      const slug = job.slug || generateSlug(job.title);
      paths.push({
        locale: locale,
        slug: slug,
      });
    }
  }
  return paths;
}

function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getKarrierePageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/chi-siamo/carriera`;
    case "en":
      return `${baseUrl}/about-us/career`;
    case "fr":
      return `${baseUrl}/a-propos/carriere`;
    case "de":
      return `${baseUrl}/ueber-uns/karriere`;
    default:
      return `${baseUrl}/ueber-uns/karriere`;
  }
}

// "Karriere" in the page language, for the <title>.
const CAREER_LABEL = { de: "Karriere", en: "Career", fr: "Carrière", it: "Carriera" };

export async function generateMetadata(props) {
  const { slug, locale = "de" } = await props.params; // Default to 'de' if locale not provided

  const karriereData = await fetchKarriereData();

  const job = karriereData?.find((p) => `${generateSlug(p.title)}` === slug);
  if (!job) {
    notFound();
  }

  // Get the slug for the URL
  const jobSlug = job.slug || generateSlug(job.title);

  // Get localized title
  const title = job.title || "Job Opening";
  // Per-language CMS field (description_de_lemploi for FR, …), German fallback.
  const description = toMetaDescription(localizedJobDescription(job, locale));
  const careerLabel = CAREER_LABEL[locale] || CAREER_LABEL.de;

  // Initialize metadata with defaults
  let metadata = {
    title: `${title} | ${careerLabel} | Platzhirsch Home Living`,
    description: description,
    // Indexable: each open job carries JobPosting data (Google Jobs).
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      url: `https://platzhirsch.studio/${locale}${ROUTES.karriere[locale] || ROUTES.karriere.de}/${jobSlug}`,
      title: `${title} | ${careerLabel} | Platzhirsch Home Living`,
      description: description,
      siteName: "Platzhirsch Home Living",
      locale: locale === "it" ? "it_IT" : locale === "en" ? "en_GB" : locale === "fr" ? "fr_FR" : "de_AT",
      images: [
        {
          url: "/Images/Arbeiten/bannerImageArbeiten1.jpg",
          width: 1200,
          height: 630,
          alt: `${title} – ${careerLabel} – Platzhirsch Home Living`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${careerLabel} | Platzhirsch Home Living`,
      description: description,
      images: ["/Images/Arbeiten/bannerImageArbeiten1.jpg"],
    },
    alternates: {
      canonical: `${getKarrierePageUrl(locale)}/${generateSlug(job?.title)}`,
      languages: hreflangLanguages((l) => `${getKarrierePageUrl(l)}/${generateSlug(job?.title)}`)
    },
  };
  return metadata;
}

export default async function JobDetailsPage({ params }) {
  const { slug, locale = "de" } = await params;
  // fetchKarriereData() only returns active jobs, each with its `slug`.
  // Unknown slug → real 404 (was a 200 "not found" text, i.e. a soft 404).
  const job = (await fetchKarriereData()).find((item) => item.slug === slug);
  if (!job) notFound();

  return (
    <>
      <JobPostingJsonLd job={job} locale={locale} />
      <JobDetailsClient job={job} />
    </>
  );
}

// Revalidate the page every hour
export const revalidate = 3600;
