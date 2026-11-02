// /<locale>/arbeitsweise – Signature-Seite „Von der Handzeichnung zum Rendering.“
// (Kern-USP, Inhaber-Entscheidung Nr. 8).
// R5-fix P2 (gesamtwerk P1-2, neuland P1-6, seo P1-4, bewusst geändert): in
// allen vier Sprachen unter demselben Pfad (/de|en|fr|it/arbeitsweise), Texte
// aus src/lib/arbeitsweise/copy-intl.js (übersetzt aus den bestätigten
// deutschen Texten). Früher nur Deutsch: EN/FR/IT bekamen einen 308 auf
// /de/arbeitsweise?lang=… (deOnlyRedirects.cjs) und dort einen Sprachhinweis
// (LangNotice) – beides entfällt. Jede Sprache hat ihre eigene Canonical und
// hreflang de/en/fr/it + x-default (= de).
// Indexierung (Runde 2, r2-seo P0-1): index, follow – unabhängig von den
// Bildslots in src/lib/arbeitsweise/media.js (robotsForLaunch()); die Seite
// trägt ohne Bilder typografisch. Doku: Marktresearch/digital/features/arbeitsweise.md.
import { notFound } from "next/navigation";
import ArbeitsweisePage from "@/components/Arbeitsweise/ArbeitsweisePage";
import { LOCALES, PATH, arbeitsweiseCopy } from "@/lib/arbeitsweise/copy";
import { MEDIA, robotsForLaunch } from "@/lib/arbeitsweise/media";
import { pageUrl } from "@/lib/arbeitsweise/schema";
import { clampDescription, fitTitle, hreflangLanguages } from "@/lib/seo/pageMetadata";

// Bis ein echtes Rendering oder eine Handzeichnung eingetragen ist: das
// typografische Share-Bild der Seite (./teilen.png/route.js) in der Sprache
// der Seite. Nicht das Layout-Standardfoto aus /Images/Home – dessen Herkunft
// ist nicht belegt (feedback-2 P2-5).
const ogFallback = (locale) => `/${locale}${PATH}/teilen.png`;
const OG_FALLBACK_SIZE = { width: 1200, height: 630 };
const OG_LOCALE = { de: "de_AT", en: "en_GB", fr: "fr_FR", it: "it_IT" };

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!LOCALES.includes(locale)) return {};
  const { META } = arbeitsweiseCopy(locale);
  // Rat 9,5 A15 (Auftrag T6 → T4): Suffix „| Platzhirsch“, Titel ≤ 60, Description ≤ 150 als ganzer Satz.
  const description = clampDescription(META.description);
  const og = MEDIA.rendering || MEDIA.handzeichnung;
  const image = og?.src || ogFallback(locale);
  const url = pageUrl(locale);
  return {
    title: fitTitle(META.title),
    description,
    robots: robotsForLaunch(),
    alternates: { canonical: url, languages: hreflangLanguages(pageUrl) },
    openGraph: {
      type: "website",
      url,
      title: META.ogTitle,
      description,
      siteName: "Platzhirsch Home Living",
      locale: OG_LOCALE[locale],
      images: [og?.src ? { url: image, alt: og.alt, width: og.width, height: og.height } : { url: image, alt: META.ogTitle, ...OG_FALLBACK_SIZE }],
    },
    twitter: { card: "summary_large_image", title: META.ogTitle, description, images: [image] },
  };
}

export default async function Page({ params }) {
  const { locale } = await params;
  if (!LOCALES.includes(locale)) notFound();
  return <ArbeitsweisePage locale={locale} />;
}
