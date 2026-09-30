// app/[locale]/layout.js
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/config";

import "../globals.css";

import { Montserrat } from "next/font/google";
import LoaderWrapper from "./LoaderWrapper";
import JsonLd from "@/components/Reusable/JsonLd";
import { fetchLayoutData } from "@/lib/api/Keywords/fetchLayoutKeywords"
import { fetchKategorienWithCounts } from "@/lib/api/fetchAllProdukte";

// The brand font. globals.css always asked for "Montserrat" but nothing loaded
// it, so visitors got Helvetica/Arial. next/font downloads it at build time and
// serves it from this domain (no Google request, no layout shift). Montserrat
// is a variable font, so every weight (font-light … font-bold) is included;
// latin-ext covers German/French/Italian accents.
const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-montserrat",
});

// Site-wide structured data. Organization is modelled as a FurnitureStore
// (a LocalBusiness subtype) — the business is a physical Einrichtungsstudio in
// Lochau, not a web agency. Contact/opening-hours data mirrors the Footer/Kontakt.
const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "FurnitureStore"],
      "@id": "https://platzhirsch.studio/#organization",
      "name": "Platzhirsch Home Living",
      "alternateName": "Platzhirsch Studio",
      "url": "https://platzhirsch.studio",
      "logo": {
        "@type": "ImageObject",
        "url": "https://platzhirsch.studio/Images/Navbar/Logo.png",
      },
      "image": "https://platzhirsch.studio/Images/Footer/PlatzImage.png",
      "description": "Platzhirsch Home Living – Einrichtungsstudio in Lochau (Vorarlberg) für exklusive Designmöbel, Interior Design und persönliche Einrichtungsberatung. Möbel führender Marken wie Minotti, Poliform und Rimadesio für ganz Österreich.",
      "telephone": "+43 5574 46255",
      "email": "info@platzhirsch.studio",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Landstraße 9",
        "postalCode": "6911",
        "addressLocality": "Lochau",
        "addressRegion": "Vorarlberg",
        "addressCountry": "AT"
      },
      "priceRange": "€€€",
      "currenciesAccepted": "EUR",
      // Google Business Profile listing (cid = the place id 0x9006009a275bf15e).
      "hasMap": "https://maps.google.com/?cid=10377983053407187294",
      // Pin of the Google Business Profile listing.
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 47.5302782,
        "longitude": 9.7517183
      },
      "areaServed": [
        { "@type": "AdministrativeArea", "name": "Vorarlberg" },
        { "@type": "Country", "name": "Österreich" },
        { "@type": "Country", "name": "Deutschland" },
        { "@type": "Country", "name": "Schweiz" },
        { "@type": "Country", "name": "Liechtenstein" }
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+43 5574 46255",
        "email": "info@platzhirsch.studio",
        "contactType": "customer service",
        "areaServed": "AT",
        "availableLanguage": ["German", "English", "Italian", "French"]
      },
      // Brands carried in the showroom (was a price-less OfferCatalog on the
      // home page, which Google flags as incomplete offers).
      "brand": [
        "Minotti", "Poliform", "Rimadesio", "Flos", "Paola Lenti", "Tom Dixon",
        "Eichholtz", "Gloster", "Tonon", "ClassiCon", "next125", "Tréca",
        "101 Copenhagen", "Tuuci", "Trapa", "Umbrosa", "solpuri"
      ].map((name) => ({ "@type": "Brand", "name": name })),
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
      "name": "Platzhirsch Home Living",
      "inLanguage": ["de-AT", "en", "fr-FR", "it-IT"],
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
      title: localeLayoutData[`metadata_title_${locale}`] || "Platzhirsch Home Living",
      description: localeLayoutData[`metadata_description_${locale}`] || "",      openGraph: {
        title: localeLayoutData[`metadata_title_${locale}`] || "Platzhirsch Home Living",
        description: localeLayoutData[`metadata_description_${locale}`] || "",
        url: localeLayoutData[`metadata_url_${locale}`] || "https://platzhirsch.studio",
        siteName: localeLayoutData[`metadata_sitename_${locale}`] || "Platzhirsch Home Living",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: "Platzhirsch Home Living Indoor",
          },
        ],
        locale: localeLayoutData[`metadata_local_${locale}`] ||
          (locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE"),
        type: localeLayoutData[`metadata_type_${locale}`] || "website",
      },
      twitter: {
        card: "summary_large_image",
        title: localeLayoutData[`metadata_title_${locale}`] || "Platzhirsch Home Living",
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
      title: "Platzhirsch Home Living",
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

  // Category keys that currently have products — the navbar's product menu
  // hides every other category (empty categories are noindex dead ends).
  // null when the backend is unreachable: the navbar then shows its full
  // menu instead of an empty one. Cached 1h, flushed by /revalidate/produkte.
  const kategorienWithCounts = await fetchKategorienWithCounts();
  const activeCategoryKeys = kategorienWithCounts.length
    ? kategorienWithCounts
        .filter((k) => k.produkt_count > 0 && k.category_key)
        .map((k) => k.category_key.toLowerCase())
    : null;

  // The locale is now correctly set from params
  return (
    <html lang={locale} dir="ltr" className={montserrat.variable}>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <meta name="ahrefs-site-verification" content="7c9d1c48de554cc2567eb6db64f49352c141ab335b8573e9366103bc7aaa9587" />
        {/* FadeInView renders with inline opacity:0 until JS reveals it —
            without JS (crawlers, JS-off) show that content immediately. */}
        <noscript>
          <style>{"[data-fade-in]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </head>
      <body>
        <JsonLd data={siteSchema} />
        <LoaderWrapper messages={messages} locale={locale} activeCategoryKeys={activeCategoryKeys}>
          {children}
        </LoaderWrapper>
      </body>
    </html>
  );
}