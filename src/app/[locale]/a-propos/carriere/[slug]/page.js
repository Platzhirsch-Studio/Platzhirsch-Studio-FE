// app/components/ueber-uns/karriere/[slug]/page.js
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
  const { slug, locale = "fr" } = await props.params; // Default to 'de' if locale not provided

  const karriereData = await fetchKarriereData();

  const produkt = karriereData?.find((p) => `${generateSlug(p.title)}` === slug);
  if (!produkt) {
    notFound();
  }
  // The rest of this function refers to `job`; alias it to the fetched record so
  // these references resolve (previously `job` was undefined → 500 on every FR job).
  const job = produkt;

  // Get the slug for the URL
  const jobSlug = job.slug || generateSlug(job.title);

  // Define base path
  const basePath = '/about-us/career';

  // Helper function to get localized content
  const getLocalizedText = (field) => {
    const localizedText = job?.[`${field}_${locale}`];
    if (localizedText && localizedText.trim() !== "") {
      return localizedText;
    }
    // Fallback to German
    const germanText = job?.[`${field}_de`];
    if (germanText && germanText.trim() !== "") {
      return germanText;
    }
    return "";
  };

  // Get localized title
  const title = job.title || "Job Opening";
  const description = getLocalizedText("jobs_description") || getLocalizedText("stellenbeschreibung") || "";


  // Initialize metadata with defaults
  let metadata = {
    title: `${title} | Career | Platzhirsch Studio FR`,
    description: description,
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      url: `https://platzhirsch.studio/${locale}${basePath}/${jobSlug}`,
      title: `${title} | Career | Platzhirsch Studio`,
      description: description,
      siteName: "Platzhirsch Studio",
      locale: locale === "it" ? "it_IT" : locale === "en" ? "en_GB" : locale === "fr" ? "fr_FR" : "de_AT",
      images: [
        {
          url: "/Images/Arbeiten/bannerImageArbeiten1.jpg",
          width: 1200,
          height: 630,
          alt: `${title} - Career at Platzhirsch Studio`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Career | Platzhirsch Studio`,
      description: description,
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
  return metadata;
}

export default async function JobDetailsPage({ params }) {
  const { slug, locale = "de" } = await params;
  const karriereData = await fetchKarriereData();
  const paramsOne = await params;
  // Find the job by slug
  const job = karriereData.find((item) => {
    const jobSlug = item.slug || generateSlug(item.title);
    return jobSlug === slug;
  });

  if (!job) {
    notFound();
  }

  // Check if job is active
  if (job.status !== "Aktiv") {
    notFound();
  }

  const basePath = '/about-us/career';
  const jobSlug = job.slug || generateSlug(job.title);


  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "de" ? "Startseite" : locale === "en" ? "Home" : locale === "fr" ? "Accueil" : "Home",
        item: `https://platzhirsch.studio/${locale}`
      },
      
      {
        "@type": "ListItem",
        position:2,
        name: locale === "de" ? "Karriere" : locale === "en" ? "Career" : locale === "fr" ? "Carrière" : "Carriera",
        item: `https://platzhirsch.studio/${locale}/a-propos/carriere`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: job.title,
        item: `https://platzhirsch.studio/${locale}/about-us/career/${jobSlug}`
      },
    ],
  };

  return (
    <>
      {/* Add breadcrumb structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <JobDetailsClient job={job} />
    </>
  );
}

// Revalidate the page every hour
export const revalidate = 3600;