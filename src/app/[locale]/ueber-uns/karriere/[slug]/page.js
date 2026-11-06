// app/[locale]/ueber-uns/karriere/[slug]/page.js — serves all four languages
// (/en/about-us/career/…, /fr/a-propos/carriere/…, /it/chi-siamo/carriera/…
// are mapped here by src/proxy.js).
import { fetchKarriereData } from "@/lib/api/fetchKarrierData";
import JobDetail from "@/components/Karriere/JobDetail";
import { bewerbungOnline } from "@/lib/karriere/bewerbungSend";
import { generateSlug } from "@/lib/slugify";
import { notFound } from "next/navigation";
import { ROUTES } from "@/utils/routing";
import { toMetaDescription } from "@/lib/seo/pageMetadata";
import { localizedJobDescription } from "@/lib/seo/structuredData";
import JobPostingJsonLd from "@/components/Karriere/jobPostingJsonLd";
import { hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";
import { shareImageMeta } from "@/components/Karriere/shareImage";
import { publishableJob, publishableJobs, visibleJob } from "@/components/Karriere/glbg";
import { jobPageTitle, localizedTitle } from "@/lib/karriere/stellen";

const NOINDEX = { index: false, follow: false, googleBot: { index: false, follow: false } };

export async function generateStaticParams() {
  const jobs = await fetchKarriereData();
  // GlBG § 9 Abs 2 (Rat 9,5 A13): ohne Entgeltangabe keine Stellenseite.
  const activeJobs = publishableJobs(jobs);

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

  const job = karriereData?.find((p) => (p.slug || generateSlug(p.title)) === slug);
  // Vorschau: gesperrte Stellen sichtbar, aber noindex (glbg.js).
  if (!job || !visibleJob(job)) {
    notFound();
  }
  const live = publishableJob(job);

  // Get the slug for the URL
  const jobSlug = job.slug || generateSlug(job.title);

  // Get localized title
  const title = localizedTitle(job, locale) || "Job Opening";
  // Per-language CMS field (description_de_lemploi for FR, …), German fallback.
  const description = toMetaDescription(localizedJobDescription(job, locale));
  const careerLabel = CAREER_LABEL[locale] || CAREER_LABEL.de;

  // Initialize metadata with defaults
  const pageTitle = jobPageTitle(title, careerLabel);
  let metadata = {
    title: pageTitle,
    description: description,
    // Indexable: each open job carries JobPosting data (Google Jobs).
    robots: live ? { index: true, follow: true } : NOINDEX,
    openGraph: {
      type: "website",
      url: `https://platzhirsch.studio/${locale}${ROUTES.karriere[locale] || ROUTES.karriere.de}/${jobSlug}`,
      title: pageTitle,
      description: description,
      siteName: "Platzhirsch Home Living",
      locale: ogLocale(locale),
      // Share image of the career pages (r4-seo P2-7): PNG 1200 × 630 at
      // <career URL>/share-image (src/components/Karriere/shareImage.js). The
      // former JPG had 2362 × 1586 px but declared 1200 × 630.
      images: [shareImageMeta(getKarrierePageUrl(locale), locale)],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: description,
      images: [shareImageMeta(getKarrierePageUrl(locale), locale).url],
    },
    alternates: {
      canonical: `${getKarrierePageUrl(locale)}/${jobSlug}`,
      languages: hreflangLanguages((l) => `${getKarrierePageUrl(l)}/${jobSlug}`)
    },
  };
  return metadata;
}

export default async function JobDetailsPage({ params }) {
  const { slug, locale = "de" } = await params;
  // fetchKarriereData() only returns active jobs, each with its `slug`.
  // Unknown slug → real 404 (was a 200 "not found" text, i.e. a soft 404).
  const job = (await fetchKarriereData()).find((item) => item.slug === slug);
  // GlBG § 9 Abs 2 (Rat 9,5 A13): Stelle ohne Entgeltangabe wird nicht
  // veröffentlicht – in Produktion 404, in der Vorschau mit Sperr-Markierung.
  if (!job || !visibleJob(job)) notFound();
  const live = publishableJob(job);

  return (
    <>
      {/* JobPosting erst mit Entgeltangabe (Google Jobs, § 9 Abs 2 GlBG). */}
      {live && <JobPostingJsonLd job={job} locale={locale} />}
      <JobDetail job={job} blocked={!live} bewerbungOnline={bewerbungOnline()} />
    </>
  );
}

// Revalidate the page every hour
export const revalidate = 3600;
