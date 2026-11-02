import Advice, { BeratungHeader } from "@/components/Beratung/advice";
import JsonLd from "@/components/Reusable/JsonLd";
import { BeratungForm } from "@/components/BeratungClient/BeratungClient";
import { beratungContext, headerTopic } from "@/lib/forms/beratungContext";
// Rat 9,5 B6 (trust next to the form), B2 (Ideenboard count), C6 (FAQ).
import TrustBlock from "@/components/Beratung/TrustBlock";
import BeratungFaq, { faqSchema } from "@/components/Beratung/BeratungFaq";
import { boardCardCount } from "@/lib/forms/boardCount";
// Online appointment behind BOOKING_PROVIDER (default "none" = not rendered).
import BookingEmbed from "@/components/Booking/BookingEmbed";
// WhatsApp-Beratung (Inhaber-Entscheidung Nr. 15): Nebenweg, nur mit WHATSAPP_NUMBER.
import WhatsApp from "@/components/WhatsApp";
import {
  fetchConsultationKeywords,
  getLocalizedConsultationMetadata,
  getConsultationOGImage,
  validateOGType
} from "@/lib/api/Keywords/fetchBeratungKeywords";
import { clampDescription, fitTitle, hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";

// Helper functions for URL generation
function getBaseUrl(locale) {
  // Always include the locale in the URL, even for 'de'
  return `/${locale}`;
}

function getBeratungPageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/consulenza`;
    case "en":
      return `${baseUrl}/consultation`;
    case "fr":
      return `${baseUrl}/conseil`;
    case "de":
      return `${baseUrl}/beratung`;
    default:
      return `${baseUrl}/beratung`;
  }
}

// Fallback metadata (the CMS consultation keywords win when set). Targets the
// "interior design" cluster (SISTRIX AT: 1,250 clicks/month, "innenarchitekt" 300).
// Rat 9,5 A15 (T6 → T1): titles ≤ 60 with the house suffix, descriptions ≤ 150 as whole sentences.
const getLocalizedTitle = (locale) => fitTitle(rawTitle(locale));
const rawTitle = (locale) => {
  switch (locale) {
    case "it": return "Interior Design & Consulenza in Vorarlberg | Platzhirsch";
    case "en": return "Interior Design & Consulting in Vorarlberg | Platzhirsch";
    case "fr": return "Interior Design & Conseil au Vorarlberg | Platzhirsch";
    default: return "Einrichtungsberatung & Interior Design Vorarlberg | Platzhirsch";
  }
};

// Description: our own, factual text wins over the CMS (QA Runde 1, P2-2:
// the CMS text still says "exklusiv"). The CMS keeps title (if it fits in
// 65 characters, else ours), image and type. Fix-Runde 1 (F3, r1-seo P2-4/
// P2-5): titles ≤ 65, descriptions ≤ 155 characters, the core USP (hand
// drawing, Inhaber-Entscheidung Nr. 8) up front, no country-wide promise.
const getLocalizedDescription = (locale) => clampDescription(rawDescription(locale));
const rawDescription = (locale) => {
  switch (locale) {
    case "it": return "Consulenza d'arredo a Lochau sul Lago di Costanza: Harald Menghin disegna il vostro concept a mano, poi progettiamo mobili, cucina e luce in 3D.";
    case "en": return "Interior consulting in Lochau on Lake Constance: Harald Menghin draws your concept by hand, then we plan furniture, kitchen and lighting in 3D.";
    case "fr": return "Conseil en aménagement à Lochau, lac de Constance : Harald Menghin dessine votre concept à la main, puis nous planifions mobilier et cuisine en 3D.";
    default: return "Einrichtungsberatung in Lochau am Bodensee: Harald Menghin zeichnet Ihr Konzept von Hand, danach planen wir Möbel, Küche und Licht in 3D.";
  }
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const PAGE_URL = getBeratungPageUrl(locale);

  try {
    const consultationKeywords = await fetchConsultationKeywords();


    if (!consultationKeywords) {
      return {
        title: fitTitle(getLocalizedTitle(locale)),
        description: clampDescription(getLocalizedDescription(locale)),
        robots: { index: true, follow: true },
        alternates: {
          canonical: PAGE_URL,
          languages: hreflangLanguages((l) => getBeratungPageUrl(l))
        },
        openGraph: {
          type: "website",
          url: PAGE_URL,
          title: fitTitle(getLocalizedTitle(locale)),
          description: clampDescription(getLocalizedDescription(locale)),
          siteName: "Platzhirsch Home Living",
          locale: ogLocale(locale),
          images: [{ url: "/Images/Home/download.jpg", width: 1200, height: 630, alt: "Beratung – Platzhirsch Home Living" }],
        },
        twitter: {
          card: "summary_large_image",
          title: fitTitle(getLocalizedTitle(locale)),
          description: clampDescription(getLocalizedDescription(locale)),
          images: ["/Images/Home/download.jpg"],
        },
      };
    }

    const meta = getLocalizedConsultationMetadata(consultationKeywords, locale);
    const title = meta?.title && meta.title.length <= 60 ? meta.title : fitTitle(getLocalizedTitle(locale));
    const image = getConsultationOGImage(consultationKeywords);
    const safeType = validateOGType(meta?.type);

    return {
      title,
      description: clampDescription(getLocalizedDescription(locale)),
      robots: { index: true, follow: true },
      alternates: {
        canonical: PAGE_URL,
        languages: hreflangLanguages((l) => getBeratungPageUrl(l))
      },
      openGraph: {
        title,
        description: clampDescription(getLocalizedDescription(locale)),
        url: PAGE_URL,
        siteName: "Platzhirsch Home Living",
        images: [
          {
            url: image ? image : "/Images/Home/download.jpg",
            width: 1200,
            height: 630,
            alt: "Beratung – Platzhirsch Home Living",
          },
        ],
        locale: ogLocale(locale),
        type: safeType,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: clampDescription(getLocalizedDescription(locale)),
        images: [image ? image : "/Images/Home/download.jpg"],
      },
    };
  } catch (error) {
    console.error("❌ Metadata fetch error:", error);

    return {
      title: fitTitle(getLocalizedTitle(locale)),
      description: clampDescription(getLocalizedDescription(locale)),
      robots: { index: true, follow: true },
      alternates: { canonical: PAGE_URL, languages: hreflangLanguages((l) => getBeratungPageUrl(l)) },
    };
  }
}

// r8-leads (ux P1-2): the page reads ?thema=/?planer=/?rolle=… on the server,
// so heading, picture and the preselected wizard steps are right in the first
// HTML (no swap after hydration, no layout shift). Reading searchParams makes
// the page dynamic; the CMS keywords stay in the fetch cache (revalidate 3600).
function toSearchParams(sp) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp || {})) {
    const first = Array.isArray(v) ? v[0] : v;
    if (typeof first === "string") q.set(k, first);
  }
  return q;
}

export default async function Home({ params, searchParams }) {
  const { locale } = await params;
  const query = toSearchParams(await searchParams);
  const context = beratungContext(query);
  // Rat 9,5 B2: cards of a shared Ideenboard (read only; "gone" when revoked/expired).
  const boardCount = context.ideenboard ? await boardCardCount(context.ideenboard) : null;
  // B1: the calendar entry on top keeps the page context (thema, produkt, ort, plan …).
  const terminContext = Object.fromEntries(["thema", "planer", "ort", "rolle", "produkt", "plan", "ideenboard"].map((k) => [k, query.get(k)]).filter(([, v]) => v));

  const titleOne = locale == "it" ? "Consulenza" : locale == "en" ? "Consulting" : locale == "fr" ? "Conseil" : "Beratung";
  const Home = locale == "it" ? "Home" : locale == "en" ? "Home" : locale == "fr" ? "Accueil" : "Home";

  // Dynamic URLs
  const PAGE_URL = getBeratungPageUrl(locale);

  // Fetch keywords for image
  const consultationKeywords = await fetchConsultationKeywords();

  const image = getConsultationOGImage(consultationKeywords);


  // ✅ JSON-LD Structured Data
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `https://platzhirsch.studio${PAGE_URL}#webpage`,
    url: `https://platzhirsch.studio${PAGE_URL}`,
    name: titleOne,
    description: getLocalizedDescription(locale),
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-AT",
    isPartOf: { "@id": "https://platzhirsch.studio/#website" },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: Home, item: `https://platzhirsch.studio/${locale}` },
        { "@type": "ListItem", position: 2, name: titleOne, item: `https://platzhirsch.studio${PAGE_URL}` },
      ],
    },
  };

  return (
    <div>
      <JsonLd data={webPageSchema} />
      <JsonLd data={await faqSchema(locale, PAGE_URL)} />
      <BeratungHeader heroImage={image} formId="anfrage" topic={headerTopic(context)} />
      {/* Online calendar first („Termin online wählen“, only while /termin is
          usable: terminMode frappe or mock); the form below stays the alternative. */}
      <BookingEmbed locale={locale} variant="top" context={terminContext} />
      {/* The enquiry form (BeratungClient, owned by the forms team) comes
          right after the opening – the shortest path to an appointment;
          the process explains the rest below. scroll-mt clears the fixed header. */}
      <div id="anfrage" className="scroll-mt-20 lg:scroll-mt-24">
        {/* Context from the URL, resolved on the server (see above). */}
        <BeratungForm context={context} boardCount={boardCount} aside={<TrustBlock locale={locale} />} />
      </div>
      {/* "Lieber schreiben?" – side path below the form, never a primary
          button. Renders nothing without WHATSAPP_NUMBER. */}
      <WhatsApp
        locale={locale}
        variant="block"
        copy="beratung"
        headingLevel={2}
        context={{ kind: "beratung" }}
        className="mx-auto w-full max-w-page px-gutter py-12 md:py-16"
      />
      <BookingEmbed locale={locale} />
      <Advice />
      <BeratungFaq locale={locale} />
    </div>
  );
}

export const revalidate = 3600;