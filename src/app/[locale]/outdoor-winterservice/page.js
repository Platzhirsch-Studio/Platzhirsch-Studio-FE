// /<locale>/outdoor-winterservice – Winterlager und Pflege für Outdoor-Möbel
// (Inhaber-Auftrag 29.10.2026, Service Nr. 3). Sprachen: DE und EN (FR/IT → 404).
// Layout: src/components/Service/Winterlager/WinterlagerPage.js.
// Offene Inhaber-Werte (Preise, Radius in km, Zeiträume, Anmeldeschluss,
// Abo-Bedingungen, Versicherung): src/lib/service/winterlager/config.js –
// leer = Zeile entfällt, Preise „auf Anfrage“.
// Indexierung: noindex, solange WINTERLAGER_CONFIG.indexieren false ist
// (Service-AGB/Abo-Bedingungen offen, service-recht-vorschlag.md Winterlager).
// Doku: qa-screenshots/service/winterlager-bau.md
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import WinterlagerPage from "@/components/Service/Winterlager/WinterlagerPage";
import { WINTERLAGER_LOCALES, winterlagerCopy } from "@/lib/service/winterlager/copy";
import { WINTERLAGER_CONFIG } from "@/lib/service/winterlager/config";
import { languages, pageUrl } from "@/lib/service/winterlager/schema";
import { DEFAULT_OG_IMAGE, SITE_NAME, ogLocale, clampDescription, seoAlternates, titleWithSuffix } from "@/lib/seo/pageMetadata";

export function generateStaticParams() {
  return WINTERLAGER_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!WINTERLAGER_LOCALES.includes(locale)) return {};
  const { meta } = winterlagerCopy(locale);
  const url = pageUrl(locale);
  const robots = WINTERLAGER_CONFIG.indexieren ? { index: true, follow: true } : { index: false, follow: true };
  return {
    title: titleWithSuffix(meta.title),
    description: clampDescription(meta.description),
    robots,
    // Rat 9,5 C8: noindex-Seiten ohne hreflang (seoAlternates); A15: Suffix, ≤ 60 / ≤ 150.
    alternates: seoAlternates({ canonical: url, languages: languages(), robots }),
    openGraph: {
      type: "website",
      url,
      title: titleWithSuffix(meta.title),
      description: clampDescription(meta.description),
      siteName: SITE_NAME,
      locale: ogLocale(locale),
      images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: titleWithSuffix(meta.title), description: clampDescription(meta.description), images: [DEFAULT_OG_IMAGE] },
  };
}

export default async function Page({ params }) {
  const { locale } = await params;
  if (!WINTERLAGER_LOCALES.includes(locale)) notFound();
  setRequestLocale(locale);
  return <WinterlagerPage locale={locale} />;
}
