// app/[locale]/layout.js
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/config";

import "../globals.css";

import LoaderWrapper from "./LoaderWrapper";
import { fetchLayoutData } from "@/lib/api/Keywords/fetchLayoutKeywords"

// Site-wide structured data. Organization is modelled as a FurnitureStore
// (a LocalBusiness subtype) — the business is a physical Einrichtungsstudio in
// Lochau, not a web agency. Contact/opening-hours data mirrors the Footer/Kontakt.
const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "FurnitureStore"],
      "@id": "https://platzhirsch.studio/#organization",
      "name": "Platzhirsch Studio",
      "alternateName": "Platzhirsch Home Living",
      "url": "https://platzhirsch.studio",
      "logo": {
        "@type": "ImageObject",
        "url": "https://platzhirsch.studio/Images/Navbar/Logo.png",
      },
      "image": "https://platzhirsch.studio/Images/Footer/PlatzImage.png",
      "description": "Platzhirsch Studio – Einrichtungsstudio in Lochau (Vorarlberg) für exklusive Designmöbel, Interior Design und persönliche Einrichtungsberatung. Möbel führender Marken wie Minotti, Poliform und Rimadesio für ganz Österreich.",
      "telephone": "+43 5574 46255",
      "email": "info@platzhirsch.studio",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Landstraße 11",
        "postalCode": "6911",
        "addressLocality": "Lochau",
        "addressRegion": "Vorarlberg",
        "addressCountry": "AT"
      },
      "priceRange": "€€€",
      "areaServed": {
        "@type": "Country",
        "name": "Österreich"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "10:00",
          "closes": "18:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "Saturday",
          "opens": "10:00",
          "closes": "14:00"
        }
      ],
      "sameAs": [
        "https://www.instagram.com/platzhirsch.studio/",
        "https://www.linkedin.com/company/platzhirsch-studio",
        "https://www.facebook.com/platzhirsch.studio/"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://platzhirsch.studio/#website",
      "url": "https://platzhirsch.studio",
      "name": "Platzhirsch Studio",
      "inLanguage": "de-AT",
      "publisher": {
        "@id": "https://platzhirsch.studio/#organization"
      }
    }
  ]
};

export async function generateMetadata({ params }) {
  const { locale } = await params;

  if (!routing.locales.includes(locale)) {
    return { title: "Page Not Found" };
  }

  try {
    const [layoutData] = await Promise.all([
      fetchLayoutData()
    ]);

    const layoutMetadata = layoutData || {};
    const localeLayoutData = layoutMetadata[`metadata_${locale}_tab`] || {};

    const ogImage = "/Images/Home/aboutHome.jpg";

    const languages = {};
    routing.locales.forEach(loc => {
      languages[loc] = localeLayoutData[`metadata_url_${loc}`] || `https://platzhirsch.studio/${loc}`;
    });
    languages['x-default'] = localeLayoutData[`metadata_url_de`] || `https://platzhirsch.studio/de`;

    return {
      htmlLang: locale,
      metadataBase: new URL("https://platzhirsch.studio"),
      title: localeLayoutData[`metadata_title_${locale}`] || "Platzhirsch Studio",
      description: localeLayoutData[`metadata_description_${locale}`] || "",      openGraph: {
        title: localeLayoutData[`metadata_title_${locale}`] || "Platzhirsch Studio",
        description: localeLayoutData[`metadata_description_${locale}`] || "",
        url: localeLayoutData[`metadata_url_${locale}`] || "https://platzhirsch.studio",
        siteName: localeLayoutData[`metadata_sitename_${locale}`] || "Platzhirsch Studio",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: "Platzhirsch Studio Indoor",
          },
        ],
        locale: localeLayoutData[`metadata_local_${locale}`] ||
          (locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE"),
        type: localeLayoutData[`metadata_type_${locale}`] || "website",
      },
      twitter: {
        card: "summary_large_image",
        title: localeLayoutData[`metadata_title_${locale}`] || "Platzhirsch Studio",
        description: localeLayoutData[`metadata_description_${locale}`] || "",
        images: [ogImage],
      },
      alternates: {
        canonical: localeLayoutData[`metadata_url_${locale}`] || "https://platzhirsch.studio/de",
        languages
      },
    };
  } catch (err) {
    console.error("Metadata fetch error:", err);
    return {
      title: "Platzhirsch Studio",
      description: ""
    };
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!routing.locales.includes(locale)) {
    notFound();
  }

  // Enable next-intl static rendering for this locale (prevents ENVIRONMENT_FALLBACK).
  setRequestLocale(locale);

  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    notFound();
  }

  // The locale is now correctly set from params
  return (
    <html lang={locale} dir="ltr">
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <meta name="ahrefs-site-verification" content="7c9d1c48de554cc2567eb6db64f49352c141ab335b8573e9366103bc7aaa9587" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
        <LoaderWrapper messages={messages} locale={locale}>
          {children}
        </LoaderWrapper>
      </body>
    </html>
  );
}