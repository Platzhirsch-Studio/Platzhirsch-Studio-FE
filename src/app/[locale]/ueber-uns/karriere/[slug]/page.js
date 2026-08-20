import { fetchKarriereData } from "@/lib/api/fetchKarrierData";
import JobDetailsClient from "./jobdetailsclient";
import { generateSlug } from "@/lib/slugify";
import { notFound } from "next/navigation";

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

export async function generateMetadata(props) {
  const { slug, locale = "de" } = await props.params; // Default to 'de' if locale not provided

  const karriereData = await fetchKarriereData();

  const produkt = karriereData?.find((p) => `${generateSlug(p.title)}` === slug);
  // if (!produkt) notFound();
  if (!produkt) {
    notFound();
  }
  // Initialize metadata with defaults
  let metadata = {
    title: `${produkt?.name} | Karriere | Platzhirsch Studio`,
    description: produkt.stellenbeschreibung || "", // Fallback description
    // Individual job postings are transient and not an SEO target (the career hub
    // list stays indexed) — noindex here, still crawlable via follow.
    robots: { index: false, follow: true },
    openGraph: {
      title: `${produkt?.name} | Platzhirsch Home Living`,
      description: `Learn more about ${produkt?.stellenbeschreibung}`,
      url: `https://platzhirsch.studio/ueber-uns/karriere/${generateSlug(produkt?.title)}`,
      siteName: "Platzhirsch Studio",
      images: [
        {
          url: "/Images/Arbeiten/bannerImageArbeiten1.jpg",
          width: 1200,
          height: 630,
          alt: produkt.produkt_name,
        },
      ],
      locale: "de_AT",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${produkt.produkt_name} | Platzhirsch Home Living`,
      description: `Learn more about ${produkt.produkt_name}`,
      images: ["/Images/Arbeiten/bannerImageArbeiten1.jpg"],
    },
    alternates: {
      canonical: `${getKarrierePageUrl(locale)}/${generateSlug(produkt?.title)}`,
      languages: {
        'de': `${getKarrierePageUrl('de')}/${generateSlug(produkt?.title)}`,
        'en': `${getKarrierePageUrl('en')}/${generateSlug(produkt?.title)}`,
        'fr': `${getKarrierePageUrl('fr')}/${generateSlug(produkt?.title)}`,
        'it': `${getKarrierePageUrl('it')}/${generateSlug(produkt?.title)}`,
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
  const karriereData = await fetchKarriereData();
  const paramsOne = await params;
  const job = karriereData.find((item) => item.slug === paramsOne.slug);

  if (!job) {
    return <div className="text-center py-20">Stellenangebot nicht gefunden.</div>;
  }

  return <JobDetailsClient job={job} />;
}
