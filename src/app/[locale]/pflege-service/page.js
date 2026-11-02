// /<locale>/pflege-service – Pflege-Service und Pflege-Abo für Leder, Stoff und
// Holz (Inhaber-Entscheidung Nr. 13, Service Nr. 4, 29.10.2026).
// Sprachen: DE, EN, FR und IT (FR/IT seit 01.11.2026, Texte src/lib/service/pflege/copy-intl.js). Layout: src/components/Service/Pflege/PflegePage.js.
// Offene Inhaber-Werte (Preise, Einsatzgebiet, Ausführung, Abo-Bedingungen):
// src/lib/service/pflege/config.js – leer = Zeile entfällt, Preise „auf Anfrage“.
// Indexierung: noindex, solange PFLEGE_CONFIG.indexieren false ist (Preise,
// Recht offen); die Seite ist erreichbar und verlinkbar.
// Doku: qa-screenshots/service/pflege-bau.md
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import PflegePage from "@/components/Service/Pflege/PflegePage";
import { LOCALES } from "@/lib/service/pflege/copy";
import { pflegeCopyAll } from "@/lib/service/pflege/copy-intl";
import { PFLEGE_CONFIG } from "@/lib/service/pflege/config";
import { languages, pageUrl } from "@/lib/service/pflege/schema";
import { DEFAULT_OG_IMAGE, SITE_NAME, ogLocale, clampDescription, seoAlternates, titleWithSuffix } from "@/lib/seo/pageMetadata";
import { terminMode } from "@/lib/booking/config";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!LOCALES.includes(locale)) return {};
  const { META } = pflegeCopyAll(locale);
  const url = pageUrl(locale);
  const robots = PFLEGE_CONFIG.indexieren ? { index: true, follow: true } : { index: false, follow: true };
  return {
    title: titleWithSuffix(META.title),
    description: clampDescription(META.description),
    robots,
    // Rat 9,5 C8: noindex-Seiten ohne hreflang (seoAlternates); A15: Suffix, ≤ 60 / ≤ 150.
    alternates: seoAlternates({ canonical: url, languages: languages(), robots }),
    openGraph: {
      type: "website",
      url,
      title: titleWithSuffix(META.title),
      description: clampDescription(META.description),
      siteName: SITE_NAME,
      locale: ogLocale(locale),
      images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: titleWithSuffix(META.title), description: clampDescription(META.description), images: [DEFAULT_OG_IMAGE] },
  };
}

/** Link zum Online-Termin (Team Termin), nur wenn Pfad gesetzt und Kalender nicht „off“. */
function terminLink() {
  if (!PFLEGE_CONFIG.terminPfad) return null;
  let mode = "off";
  try {
    mode = terminMode();
  } catch {
    mode = "off";
  }
  if (mode === "off") return null;
  return { href: PFLEGE_CONFIG.terminQuery ? `${PFLEGE_CONFIG.terminPfad}?${PFLEGE_CONFIG.terminQuery}` : PFLEGE_CONFIG.terminPfad };
}

export default async function Page({ params }) {
  const { locale } = await params;
  if (!LOCALES.includes(locale)) notFound();
  setRequestLocale(locale);
  return <PflegePage locale={locale} termin={terminLink()} />;
}
