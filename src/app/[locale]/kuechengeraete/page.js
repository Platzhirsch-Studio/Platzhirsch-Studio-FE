// /<locale>/kuechengeraete – „Geräte, die wir einplanen“ (Inhaber-Entscheidung
// Nr. 18, 30.10.2026): Gaggenau, Miele, V-ZUG, BORA, Liebherr und Quooker,
// kuratiert in der Küchenplanung, ohne Preise, ohne Shop. Seit Inhaber-Entscheidung
// Nr. 24 (31.10.2026) mit Händlersatz aus dem Claim-Register und Herstellerbildern.
// In allen vier Sprachen unter demselben Pfad /kuechengeraete (keine
// Pfad-Übersetzung, kein Eintrag in proxy.js nötig); eigene Canonical je
// Sprache, hreflang de/en/fr/it + x-default (buildPageMetadata).
// Komponente: src/components/Kuechengeraete/KuechengeraetePage.js.
// Einhänge-Schritte (Sitemap, Links, Footer): qa-screenshots/kuechengeraete/uebergabe.md.
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import KuechengeraetePage from "@/components/Kuechengeraete/KuechengeraetePage";
import { geraeteText } from "@/components/Kuechengeraete/geraeteCopy";
import { GERAETE_LOCALES, GERAETE_PATH } from "@/lib/kueche/geraete";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!GERAETE_LOCALES.includes(locale)) return {};
  const t = await getTranslations({ locale });
  return buildPageMetadata({
    locale,
    pathByLocale: GERAETE_PATH,
    title: geraeteText(locale, "meta.title", t),
    description: geraeteText(locale, "meta.description", t),
  });
}

export default async function Page({ params }) {
  const { locale } = await params;
  if (!GERAETE_LOCALES.includes(locale)) notFound();
  return <KuechengeraetePage locale={locale} />;
}
