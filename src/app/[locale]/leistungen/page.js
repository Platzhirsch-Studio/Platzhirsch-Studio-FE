import { notFound } from "next/navigation";
import { connection } from "next/server";
import LabsHub from "@/components/Labs/Hub/LabsHub";
import { navFeatures } from "@/components/Navbar/shellNav";
import { landingMetadata } from "@/components/Landing/landingPage";
import { ROUTES } from "@/utils/routing";
import { WerkzeugJsonLd, werkzeugOg } from "@/components/Labs/werkzeugSeo";
import { SOURCE_COPY } from "@/lib/sofaplaner/consent";
import { hubFeatures } from "@/lib/features";
import { conciergeLive } from "@/lib/concierge/config";
import JsonLd from "@/components/Reusable/JsonLd";
import { ogImage } from "@/components/Labs/werkzeugSeo";
import { sourceCopyFor } from "@/lib/sofaplaner/consent";
import { IN_LANGUAGE, ORGANIZATION_ID, WEBSITE_ID, breadcrumbList, graph } from "@/lib/seo/structuredData";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { KERN_LOCALES, kernMeta, kernMetadata, kernUrl, leistungenCopy, withKernLanguages } from "@/lib/content/landingKern";

// /de/leistungen „Planen & Erleben“: Hub des Menüpunkts (Usability-Gutachten
// 3.1/3.6, Inhaber-Entscheidung Nr. 9). Ersetzt die frühere Labs-Übersicht
// /de/labs (308 hierher, src/lib/seo/labsMoves.cjs). Zeigt Beratung,
// Arbeitsweise und alle verlinkten Werkzeuge und Welten (src/lib/features.js,
// Schalter standardmäßig an). Nur Deutsch, indexierbar, in der Sitemap
// (src/lib/seo/sitemap/extraPages.js).
// landing-kern (01.11.2026): auch EN, FR und IT – Texte serverseitig aus
// src/lib/content/landingKern/leistungen.js (an LabsHub als `copy`); Werkzeuge
// ohne eigene Sprachfassung sind im Kartentitel als deutsch/englisch markiert.

const PATH = "/leistungen";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) return {};
  if (locale !== "de") {
    const m = kernMeta(PATH, locale);
    return kernMetadata({ path: PATH, locale, image: { url: ogImage("leistungen"), width: 1200, height: 630, alt: m.ogAlt } });
  }
  const meta = withKernLanguages(landingMetadata({
    path: PATH,
    // Fix-Runde 1 (F2): Title wie Overline/H1 („Leistungen“ · „Planen & Erleben“), ≤ 65 Zeichen
    title: "Planen & Erleben – Leistungen und Planer online",
    description:
      `Beratung, Handzeichnung, 3D-Planung: Küchenplaner, ${SOURCE_COPY.seoName}, Stil-Finder, 3D- und AR-Ansicht und Services von Platzhirsch Home Living in Lochau.`,
  }), PATH);
  const og = werkzeugOg("leistungen", { title: "Planen & Erleben – Leistungen und Planer online", description: meta.description });
  return { ...meta, openGraph: { ...meta.openGraph, ...og.openGraph }, twitter: { ...meta.twitter, ...og.twitter } };
}

export default async function LeistungenPage({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) notFound();
  // Runde 4 (ux P0-1, seo P2): keine Karten auf noindex-/307-Seiten, kein
  // Showroom ohne echte Aufnahme, Concierge nur mit nutzbarer KI.
  await connection(); // Concierge-Verfügbarkeit hängt am Laufzeit-Schlüssel
  const all = hubFeatures(navFeatures(), { concierge: conciergeLive() });
  if (locale !== "de") {
    const copy = leistungenCopy(locale, { sofaName: sourceCopyFor(locale).seoName });
    return (
      <>
        <JsonLd data={leistungenSchema(locale, copy)} />
        <LabsHub features={all.map(copy.feature)} terminHref={copy.terminHref} copy={copy} />
      </>
    );
  }
  const features = all;
  return (
    <>
      <WerkzeugJsonLd id="leistungen" description="Beratung, Handzeichnung, 3D-Planung und digitale Werkzeuge von Platzhirsch Home Living in Lochau." />
      <LabsHub features={features} terminHref={ROUTES.beratung.de} />
    </>
  );
}

/** JSON-LD der EN/FR/IT-Fassung: WebPage + BreadcrumbList (Startseite › Planen & Erleben). */
function leistungenSchema(locale, copy) {
  const url = kernUrl(PATH, locale);
  return graph(
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: copy.title,
      description: kernMeta(PATH, locale).schema,
      inLanguage: IN_LANGUAGE[locale] || locale,
      isPartOf: { "@id": WEBSITE_ID },
      publisher: { "@id": ORGANIZATION_ID },
      primaryImageOfPage: { "@type": "ImageObject", url: ogImage("leistungen"), width: 1200, height: 630 },
      breadcrumb: { "@id": `${url}#breadcrumb` },
    },
    breadcrumbList([{ name: homeCrumbLabel(locale), url: `/${locale}` }, { name: copy.title }], `${url}#breadcrumb`)
  );
}
