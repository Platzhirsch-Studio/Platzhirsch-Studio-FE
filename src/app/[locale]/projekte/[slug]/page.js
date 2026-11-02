// /de/projekte/<slug> – one released Referenzprojekt (R5-content, Bericht 12
// C3). German only; unknown or unreleased slugs and other locales 404.
// noindex like the hub until the owner decides otherwise. JSON-LD
// CreativeWork without address (locationCreated = region only).
// "vorlage" is a static sibling route (template preview), not a project.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/Reusable/JsonLd";
import ProjektArtikel from "@/components/Projects/ProjektArtikel";
import { getProjekt, PROJEKTE_PATH } from "@/lib/content/projekte";
import { veroeffentlichteReferenzen } from "@/lib/portal/tagebuch/service";
import ReferenzArtikel from "../_tagebuch/ReferenzArtikel";
import { SITE_URL, SITE_NAME, ogLocale } from "@/lib/seo/pageMetadata";
import { ORGANIZATION_ID } from "@/lib/seo/structuredData";
import { routing } from "@/i18n/config";
import { notFoundTitle } from "@/i18n/detectLocale";

// Projekt-Tagebuch (29.10.2026): Referenzen aus dem Kundenportal werden ohne
// Deploy veröffentlicht und nach Widerruf sofort entfernt. Die Seite rendert
// deshalb je Anfrage (connection(), kein generateStaticParams). Das ersetzt
// Technik R7 (r6-technik P0-1, dynamicParams = false): Weil nichts
// vorgerendert oder zwischengespeichert wird, entsteht auch kein Cache-Eintrag
// je unbekannter URL; unbekannte Slugs enden in notFound().
async function finde(slug) {
  await connection();
  const statisch = getProjekt(slug);
  if (statisch) return { p: statisch, tagebuch: false };
  const ref = (await veroeffentlichteReferenzen()).find((r) => r.slug === slug);
  return ref ? { p: ref, tagebuch: true } : { p: null };
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const nf = async () => ({
    title: await notFoundTitle(routing.locales.includes(locale) ? locale : routing.defaultLocale),
    robots: { index: false, follow: true },
  });
  if (locale !== "de") return nf();
  const { p } = await finde(slug);
  if (!p) return nf();
  const url = `${SITE_URL}${PROJEKTE_PATH}/${p.slug}`;
  return {
    title: `${p.titel} | ${SITE_NAME}`,
    description: p.ausgangslage.slice(0, 155),
    robots: { index: false, follow: true },
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: p.titel, siteName: SITE_NAME, locale: ogLocale("de"), images: [{ url: `${SITE_URL}${p.bilder[0].src}`, alt: p.bilder[0].alt }] },
  };
}

function projektSchema(p) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: p.titel,
    url: `${SITE_URL}${PROJEKTE_PATH}/${p.slug}`,
    dateModified: p.updatedAt,
    inLanguage: "de",
    image: p.bilder.map((b) => `${SITE_URL}${b.src}`),
    locationCreated: { "@type": "Place", name: p.ort },
    creator: { "@id": ORGANIZATION_ID },
    ...(p.architekt ? { contributor: { "@type": "Person", name: p.architekt.name, ...(p.architekt.url ? { url: p.architekt.url } : {}) } } : {}),
  };
}

export default async function ProjektPage({ params }) {
  const { locale, slug } = await params;
  if (locale !== "de") notFound();
  setRequestLocale(locale);
  const { p, tagebuch } = await finde(slug);
  if (!p) notFound();
  return (
    <>
      <JsonLd data={projektSchema(p)} />
      {tagebuch ? <ReferenzArtikel projekt={p} /> : <ProjektArtikel projekt={p} />}
    </>
  );
}
