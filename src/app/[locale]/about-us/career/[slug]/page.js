// app/components/ueber-uns/karriere/[slug]/page.js
import JobDetailsClient from "./jobdetailsclient";
import { generateSlug } from "@/lib/slugify";
import { fetchKarriereData } from "@/lib/api/fetchKarrierData";
import { notFound } from "next/navigation";
import JobPostingJsonLd from "@/components/Karriere/jobPostingJsonLd";

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
  const { slug, locale = "en" } = await props.params; // Default to 'de' if locale not provided

  const karriereData = await fetchKarriereData();

  const produkt = karriereData?.find((p) => `${generateSlug(p.title)}` === slug);
  if (!produkt) {
    notFound();
  }

  // Initialize metadata with defaults
  let metadata = {
    title: `${produkt.title} | ${CAREER_LABEL[locale] || CAREER_LABEL.de} | Platzhirsch Home Living`,
    description: produkt.stellenbeschreibung || "", // Fallback description
    // Indexable: each open job carries JobPosting data (Google Jobs).
    robots: { index: true, follow: true },
    openGraph: {
      title: `${produkt.title} | Platzhirsch Home Living`,
      description: `Learn more about ${produkt?.stellenbeschreibung}`,
      url: `${getKarrierePageUrl(locale)}/${generateSlug(produkt.title)}`,
      siteName: "Platzhirsch Home Living",
      images: [
        {
          url: "/Images/Arbeiten/bannerImageArbeiten1.jpg",
          width: 1200,
          height: 630,
          alt: produkt.title,
        },
      ],
      locale: "de_AT",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${produkt.title} | Platzhirsch Home Living`,
      description: produkt.title,
      images: ["/Images/Arbeiten/bannerImageArbeiten1.jpg"],
    },
    alternates: {
      canonical: `${getKarrierePageUrl(locale)}/${generateSlug(produkt?.title)}`,
      languages: {
        'de-AT': `${getKarrierePageUrl('de')}/${generateSlug(produkt?.title)}`,
        'de': `${getKarrierePageUrl('de')}/${generateSlug(produkt?.title)}`,
        'en': `${getKarrierePageUrl('en')}/${generateSlug(produkt?.title)}`,
        'fr-FR': `${getKarrierePageUrl('fr')}/${generateSlug(produkt?.title)}`,
        'it-IT': `${getKarrierePageUrl('it')}/${generateSlug(produkt?.title)}`,
        'x-default': `${getKarrierePageUrl('de')}/${generateSlug(produkt?.title)}`,

      }
    },
  };

  // Handle language-specific metadata
  switch (locale) {
    case "en":
      if (produkt.job_description_en) {
        metadata.description = produkt.job_description_en;
      }
      break;

    case "it":
      if (produkt.jobs_description_it) {
        metadata.description = produkt.jobs_description_it;
      }
      break;
    case "fr":
      if (produkt.description_de_lemploi) {
        metadata.description = produkt.description_de_lemploi;
      }
      break;
    default:
      if (produkt.stellenbeschreibung) {
        metadata.description = produkt.stellenbeschreibung;
      }
      break;
  }

  // Update OpenGraph and Twitter descriptions with the localized description
  metadata.description = metadata.description;
  metadata.openGraph.description = metadata.description;
  metadata.twitter.description = metadata.description;

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
