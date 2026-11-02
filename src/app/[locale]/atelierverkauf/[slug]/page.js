// /de/atelierverkauf/<slug> — ein Ausstellungsstück (R5-commerce, AP9 Nr. 2).
// ATELIER_MODE=off (Standard) → 404. Unbekannte, reservierte oder verkaufte
// Stücke → 404 (verschwinden mit der Revalidierung des Sheets).
// JSON-LD Product/Offer nur mit echten Sheet-Daten (offerSchema.js).
import { notFound } from "next/navigation";
import { connection } from "next/server";
import JsonLd from "@/components/Reusable/JsonLd";
import { Breadcrumbs, Container } from "@/components/ui";
import AtelierDetail from "@/components/Atelier/AtelierDetail";
import { findAtelierItem } from "@/lib/commerce/atelierSource";
import { NOINDEX, atelierEnabled } from "@/lib/commerce/mode";
import { atelierItemUrl, atelierJsonLd } from "@/lib/commerce/offerSchema";
import { formatEuro } from "@/lib/commerce/priceRules";
import { SITE_NAME } from "@/lib/site";

async function itemFor(params) {
  const { locale, slug } = await params;
  await connection();
  if (locale !== "de" || !atelierEnabled()) return null;
  return findAtelierItem(slug);
}

export async function generateMetadata({ params }) {
  const item = await itemFor(params);
  if (!item) return { robots: NOINDEX };
  const description = `Ausstellungsstück aus unserem Showroom in Lochau, ${formatEuro(item.preis)} inkl. USt. ${item.zustand}`.slice(0, 160);
  return {
    title: `${item.titel} – Atelierverkauf | ${SITE_NAME}`,
    description,
    alternates: { canonical: atelierItemUrl(item.slug) },
  };
}

export default async function AtelierStueckPage({ params }) {
  const item = await itemFor(params);
  if (!item) notFound();
  return (
    <div className="bg-surface pt-10 pb-section text-text md:pt-14">
      <JsonLd data={atelierJsonLd(item)} />
      <Container>
        <Breadcrumbs
          className="mb-stack-m"
          items={[{ label: "Startseite", href: "/" }, { label: "Atelierverkauf", href: "/atelierverkauf" }, { label: item.titel }]}
        />
        <AtelierDetail item={item} />
      </Container>
    </div>
  );
}
