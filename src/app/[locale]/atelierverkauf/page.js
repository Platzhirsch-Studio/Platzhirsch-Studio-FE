// /de/atelierverkauf — Ausstellungsstücke aus dem Showroom (R5-commerce, AP9 Nr. 2).
// Hinter dem Schalter ATELIER_MODE: "off" (Standard) → 404, "anfrage" → Liste
// aus dem Sheet (ATELIER_CSV_URL, atelierSource.js) bzw. Leerzustand.
// Nur Deutsch. Reservierung nur als Anfrage, kein Online-Vertrag, keine
// Anzahlung. Nicht in Navigation, Sitemap oder llms.txt (Integrator).
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Breadcrumbs, Container } from "@/components/ui";
import AtelierIntro from "@/components/Atelier/AtelierIntro";
import AtelierList from "@/components/Atelier/AtelierList";
import { loadAtelier } from "@/lib/commerce/atelierSource";
import { NOINDEX, atelierEnabled } from "@/lib/commerce/mode";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_URL = `${SITE_URL}/de/atelierverkauf`;
const TITLE = "Atelierverkauf: Ausstellungsstücke aus dem Showroom";
const DESCRIPTION = "Ausstellungsstücke aus unserem Showroom in Lochau, mit Zustandsbeschreibung und Preis inklusive Umsatzsteuer.";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  await connection();
  if (locale !== "de" || !atelierEnabled()) return { robots: NOINDEX };
  return {
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    alternates: { canonical: PAGE_URL },
    openGraph: { type: "website", url: PAGE_URL, title: TITLE, description: DESCRIPTION, siteName: SITE_NAME, locale: "de_AT" },
  };
}

export default async function AtelierverkaufPage({ params }) {
  const { locale } = await params;
  await connection();
  if (locale !== "de" || !atelierEnabled()) notFound();
  const { items, state } = await loadAtelier();
  return (
    <div className="bg-surface pt-10 pb-section text-text md:pt-14">
      <Container>
        <Breadcrumbs className="mb-stack-m" items={[{ label: "Startseite", href: "/" }, { label: "Atelierverkauf" }]} />
        <AtelierIntro />
        <div className="mt-16">
          <AtelierList items={items} state={state} />
        </div>
      </Container>
    </div>
  );
}
