import './globals.css';
import { cookies } from 'next/headers';
import ClientLayout from './ClientLayout';
import { routing } from '@/i18n/config';


// NOTE: This schema is currently not rendered here (RootLayout returns children
// only); the active site-wide graph lives in app/[locale]/layout.js. Kept in
// sync to avoid a wrong copy being reintroduced.
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
      "description":
        "Platzhirsch Studio – Einrichtungsstudio in Lochau (Vorarlberg) für exklusive Designmöbel, Interior Design und persönliche Einrichtungsberatung. Möbel führender Marken wie Minotti, Poliform und Rimadesio für ganz Österreich.",
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

export const metadata = {
  title: 'Platzhirsch Studio',
  description: 'Platzhirsch Studio - Interior Design',

  // Google Search Console (HTML-tag method) — token only, no "google-site-verification=" prefix.
  verification: { google: "fBnnqJ7z8gqPWuspRdlAFKvrsHTH5kUmnoW-gtMrxA4" },
};



// export default async function RootLayout({ children }) {

//   const cookieStore = await cookies();
//   let locale = cookieStore.get('NEXT_LOCALE')?.value;

//   // If no cookie, try to get from the URL via headers
//   if (!locale) {
//     const headersList = await headers();
//     // Next.js doesn't expose the full URL in headers by default
//     // So we'll use the cookie as the primary source
//     locale = 'de';
//   }

//   const validLocale = routing.locales.includes(locale) ? locale : 'de';


//   return (
//     <html lang={validLocale} dir="ltr">
//       <head>
//         <link rel="preconnect" href="https://www.googletagmanager.com" />
//         <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
//         {/* Also preconnect to Google Analytics if needed */}
//         <link rel="preconnect" href="https://www.google-analytics.com" />
//         <link rel="dns-prefetch" href="https://www.google-analytics.com" />
//         <meta name="ahrefs-site-verification" content="a602eab1336e266b5c80c2bd77ba3e014e2f6295ebe104727feea9d562fa19d0" />

//       </head>
//       <body>
//         <script
//           type="application/ld+json"
//           dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
//         />
//         <ClientLayout>
//           {children}
//         </ClientLayout>
//       </body>
//     </html>
//   );
// }


export default function RootLayout({ children }) {
  return children;
}