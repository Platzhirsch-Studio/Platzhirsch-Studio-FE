// /de/regionen – Regionen-Hub (Rat 9,5 B15, T6): Elternseite der Brotkrume
// aller Stadt- und Regionsseiten, gruppiert nach Land, mit Anfahrt und
// Querverweisen (Ratgeber, Küche, Hotel & Objekt, Termin). Nur Deutsch wie
// die Regionsseiten; EN/FR/IT antworten mit einem 308 auf /de/regionen?lang=
// (src/lib/seo/deOnlyRedirects.cjs). Daten und Regeln: src/lib/seo/regionen.js.
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/Reusable/JsonLd";
import { deOnlyMetadata, localeUrl, titleWithSuffix } from "@/lib/seo/pageMetadata";
import { breadcrumbJsonLd, homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/structuredData";
import { REGIONEN_META, REGIONEN_PATH, visibleRegionGroups, visibleRegions } from "@/lib/seo/regionen";
import RegionenHub from "./RegionenHub";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return deOnlyMetadata({
    path: REGIONEN_PATH,
    title: titleWithSuffix(REGIONEN_META.title),
    description: REGIONEN_META.description,
    ogTitle: REGIONEN_META.h1,
  });
}

function schema(groups) {
  const url = localeUrl("de", REGIONEN_PATH);
  const regions = groups.flatMap((g) => g.regions);
  const crumbs = [{ label: homeCrumbLabel("de"), href: "/" }, { label: "Regionen" }];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#webpage`,
        url,
        name: REGIONEN_META.h1,
        description: REGIONEN_META.description,
        inLanguage: "de-AT",
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": ORGANIZATION_ID },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: regions.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: `Designermöbel ${r.name}`, url: localeUrl("de", r.path) })),
        },
      },
      { ...breadcrumbJsonLd(crumbs, "de", { id: `${url}#breadcrumb`, context: false }) },
      {
        "@type": "Service",
        "@id": `${url}#service`,
        serviceType: "Einrichtungsberatung und Interior Design",
        provider: { "@id": ORGANIZATION_ID },
        areaServed: regions.map((r) => ({ "@type": "Place", name: r.name })),
        url,
      },
    ],
  };
}

export default async function RegionenPage({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  setRequestLocale(locale);
  const groups = visibleRegionGroups();
  return (
    <>
      <JsonLd data={schema(groups)} />
      <RegionenHub groups={groups} count={visibleRegions().length} />
    </>
  );
}
