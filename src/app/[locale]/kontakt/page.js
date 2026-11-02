import { getTranslations } from "next-intl/server";
import JsonLd from "@/components/Reusable/JsonLd";
import OwnImageJsonLd from "@/components/Reusable/OwnImageJsonLd";
import KontaktSecond from "@/components/Kontakt/kontakt";
import PageHeader from "@/components/UberUns/PageHeader";
import { Button, SmartLink } from "@/components/ui";
import { KONTAKT_COPY } from "@/components/Kontakt/copy";
import { ADDRESS, PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import { withoutLangNote } from "@/components/Beratung/t1Copy";
import KontaktLastSection from "@/components/Kontakt/KontaktLastSection";
import { clampDescription, fitTitle, hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";

const DOMAIN = "https://platzhirsch.studio";

// Helper functions for URL generation
function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getKontaktPageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/contatto`;
    case "en":
      return `${baseUrl}/contact`;
    case "fr":
      return `${baseUrl}/contact`;
    case "de":
      return `${baseUrl}/kontakt`;
    default:
      return `${baseUrl}/kontakt`;
  }
}

const getLocalizedTitle = (locale) => {
  switch (locale) {
    case "it": return "Contattateci | Consulenza Design da Platzhirsch Home Living";
    case "en": return "Contact Us | Design Consultation at Platzhirsch Home Living";
    case "fr": return "Contactez-Nous | Conseil Design chez Platzhirsch Home Living";
    default: return "Kontakt | Designberatung bei Platzhirsch Home Living";
  }
};

// Address and phone from src/lib/site.js (one NAP source).
const getLocalizedDescription = (locale) => {
  switch (locale) {
    case "it": return `Contatta Platzhirsch Home Living a Lochau sul Lago di Costanza: ${ADDRESS.street}, tel. ${PHONE_DISPLAY}. Richiedete un appuntamento o visitate showroom e café.`;
    case "en": return `Contact Platzhirsch Home Living in Lochau on Lake Constance: ${ADDRESS.street}, phone ${PHONE_DISPLAY}. Request an appointment or visit showroom and café.`;
    case "fr": return `Contact Platzhirsch Home Living à Lochau, lac de Constance : ${ADDRESS.street}, tél. ${PHONE_DISPLAY}. Demandez un rendez-vous ou visitez showroom et café.`;
    default: return `Kontakt zu Platzhirsch Home Living in Lochau am Bodensee: ${ADDRESS.street}, Telefon ${PHONE_DISPLAY}. Termin anfragen, Showroom und Café besuchen.`;
  }
};

// Runde 3 P5 (seo P1-2, P2): own title and description in the page language
// (the backoffice texts said "Platzhirsch Studio"), 120–155 characters, and a
// typographic share card instead of questionmark-og.jpg (that photo carries a
// Gemini watermark). The card (public/Images/Kontakt/kontakt-og.png, 1200 × 630,
// same look as src/lib/seo/ogCard.js) is language-neutral, so one file serves
// all four locales.
const CONTACT_IMAGE = "/Images/Home/aboutHome.jpg";
const OG_IMAGE = { url: "/Images/Kontakt/kontakt-og.png", width: 1200, height: 630 };
const OG_ALT = {
  de: "Kontakt – Platzhirsch Home Living, Lochau am Bodensee",
  en: "Contact – Platzhirsch Home Living, Lochau on Lake Constance",
  fr: "Contact – Platzhirsch Home Living, Lochau, lac de Constance",
  it: "Contatto – Platzhirsch Home Living, Lochau sul Lago di Costanza",
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const PAGE_URL = getKontaktPageUrl(locale);
  // Rat 9,5 A15 (T6 → T1): ≤ 60 / ≤ 150 characters, whole sentences.
  const title = fitTitle(getLocalizedTitle(locale));
  const description = clampDescription(getLocalizedDescription(locale));
  const alt = OG_ALT[locale] || OG_ALT.de;
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: PAGE_URL,
      languages: hreflangLanguages((l) => getKontaktPageUrl(l)),
    },
    openGraph: {
      type: "website",
      url: PAGE_URL,
      title,
      description,
      siteName: "Platzhirsch Home Living",
      locale: ogLocale(locale),
      images: [{ ...OG_IMAGE, alt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: OG_IMAGE.url, alt }],
    },
  };
}


// Runde 4 (ux P1-4a): phone lead – the core USP (Inhaber-Entscheidung Nr. 8) in one sentence.
const PHONE_LEAD = {
  de: "Wir zeichnen von Hand, dann planen wir in 3D. Sprechen Sie uns an.",
  en: "We draw by hand, then plan in 3D. Get in touch.",
  fr: "Nous dessinons à la main, puis planifions en 3D. Contactez-nous.",
  it: "Disegniamo a mano, poi progettiamo in 3D. Contattateci.",
};

export default async function Page({ params }) {
  const { locale } = await params;

  const titleOne = locale == "it" ? "Contatto" : locale == "en" ? "Contact" : locale == "fr" ? "Contact" : "Kontakt";
  // Same breadcrumb label as the other content pages ("Startseite", QA R3 P3-2).
  const Home = (await getTranslations({ locale, namespace: "inhalt.common" }))("home");

  const PAGE_URL = getKontaktPageUrl(locale);


  // New page texts: contact.<key> once merged (messages-r2-leads.json), else fallback.
  const t = await getTranslations({ locale, namespace: "contact" });
  const fallback = KONTAKT_COPY[locale] || KONTAKT_COPY.de;
  const c = (key) => (t.has(key) ? t(key) : fallback[key]);

  // ✅ JSON-LD Structured Data
  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${PAGE_URL}/#webpage`,
    url: PAGE_URL,
    name: getLocalizedTitle(locale),
    description: getLocalizedDescription(locale),
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-AT",
    isPartOf: { "@id": `${DOMAIN}/#website` },
    about: { "@id": `${DOMAIN}/#organization` },
    mainEntity: { "@id": `${DOMAIN}/#organization` },
    breadcrumb: {
      "@type": "BreadcrumbList",
      "@id": `${PAGE_URL}/#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: Home, item: `${DOMAIN}/${locale}` },
        { "@type": "ListItem", position: 2, name: titleOne, item: PAGE_URL },
      ],
    },
  };

  return (
    <div>
      <JsonLd data={contactPageSchema} />
      {/* Bilder-SEO: Bildnachweis für das eigene Foto im Seitenkopf (src/lib/seo/imageRights.js). */}
      <OwnImageJsonLd images={[{ src: CONTACT_IMAGE, alt: t("imageAlt"), width: 2048, height: 1228 }]} />
      {/* Light page opening (same frame as the content pages): breadcrumb,
          the only H1, lead, one primary action, the photo next to the text. */}
      <PageHeader
        breadcrumbs={[{ label: Home, href: "/" }, { label: titleOne }]}
        eyebrow={titleOne}
        title={c("pageTitle")}
        lead={
          <>
            {/* Runde 4 (ux P1-4a, iPhone 13): on phones one short lead of at
                most three lines, so both buttons stand in the first screen
                above the cookie bar; the full text from lg. */}
            <span className="max-lg:hidden">
              {c("pageLead")}{" "}
              {/* Core USP in one sentence (Inhaber-Entscheidung Nr. 8, r1-ux P1-5);
                  /arbeitsweise exists in all four languages (Rat 9,5 A1). */}
              {c("usp")}{" "}
            </span>
            {/* QM content-legal r3 (phone quer): the last word keeps its neighbour – „an.“ stood alone. */}
            <span className="lg:hidden">{(PHONE_LEAD[locale] || PHONE_LEAD.de).replace(/ (\S+)$/u," $1")} </span>
            {/* Rat 9,5 A1 (UX7): /arbeitsweise in the visitor's language. */}
            <SmartLink href="/arbeitsweise" className="whitespace-nowrap text-text underline decoration-line-strong underline-offset-4 hover:decoration-current">
              {withoutLangNote(c("uspLink"))}
            </SmartLink>
          </>
        }
        // Rat 9,5 B5 (RE4, GW): only a picture with cleared rights – the house
        // photo aboutHome.jpg (rights by mail 28.10.2026, Inhaber-Entscheidung
        // Nr. 11, bildrechte.csv). The backoffice header photo and the former
        // Newsletter room photo
        // have no release (freigabe=offen) and are no longer shown here.
        image={{ src: CONTACT_IMAGE, alt: t("imageAlt") }}
        // Runde 4: phones – less top space, smaller H1, no eyebrow (repeats the breadcrumb).
        className="max-lg:pt-4 max-lg:[&_.grid]:mt-3 max-lg:[&_h1]:text-[length:min(2rem,var(--ph-h1-cap,100vw))] max-lg:[&_h1]:leading-[1.15] max-lg:[&_.grid_p.uppercase]:hidden max-lg:[&_.grid_h1+*]:mt-3"
      >
        <Button href="#nachricht" variant="primary" arrow>
          {c("writeCta")}
        </Button>
        <Button href={PHONE_HREF} variant="secondary">
          {/* QM r3: the number stood three to four times on the page – the button says
              „Anrufen“ (tel: link), the number itself is in „Besuch“, the form aside and the footer. */}
          {c("callCta")}
          <span className="sr-only">: {PHONE_DISPLAY}</span>
        </Button>
      </PageHeader>
      <KontaktSecond />
      <KontaktLastSection />
    </div>
  );
}

export const revalidate = 3600;