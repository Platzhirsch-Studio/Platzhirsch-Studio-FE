// /<locale>/bad-wellness – „Bad & Wellness – geplant wie ein Raum“
// (Inhaber-Entscheidungen Nr. 19, 20, 21 vom 31.10.2026): Bad mit Agape,
// Dornbracht und antoniolupi; Wellness & Spa mit Starpool, Soleum, Fabio
// Alemanno, Aquavia Spa und Naggura (nur Wellness- und Spa-Behandlungsräume
// in Hotels).
// In allen vier Sprachen unter demselben Pfad /bad-wellness (keine
// Pfad-Übersetzung, kein Eintrag in proxy.js nötig); eigene Canonical je
// Sprache, hreflang de/en/fr/it + x-default (buildPageMetadata).
// Komponente: src/components/BadWellness/BadWellnessPage.js.
// Einhänge-Schritte (Sitemap, Navigation, Footer …): qa-screenshots/wellness/uebergabe.md.
import { notFound } from "next/navigation";
import BadWellnessPage from "@/components/BadWellness/BadWellnessPage";
// Title/Description: Lokal-SEO „Whirlpool, Sauna & Bad in Vorarlberg“ (badWellnessHub.js).
import { hubText } from "@/components/BadWellness/badWellnessHub";
import { BAD_WELLNESS_LOCALES, BAD_WELLNESS_PATH } from "@/lib/wellness/marken";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!BAD_WELLNESS_LOCALES.includes(locale)) return {};
  return buildPageMetadata({
    locale,
    pathByLocale: BAD_WELLNESS_PATH,
    title: hubText(locale, "meta.title"),
    description: hubText(locale, "meta.description"),
  });
}

export default async function Page({ params }) {
  const { locale } = await params;
  if (!BAD_WELLNESS_LOCALES.includes(locale)) notFound();
  return <BadWellnessPage locale={locale} />;
}
