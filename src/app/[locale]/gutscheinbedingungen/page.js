// /de/gutscheinbedingungen — Gutscheinbedingungen (R5-commerce). Wortlaut von der
// Kanzlei freigegeben (Inhaber-Entscheidung Nr. 11), 7 Unternehmensangaben seit
// 03.11.2026 eingetragen (Nr. 46) → TERMS_STATUS "freigegeben", Seite öffentlich
// und indexierbar, sobald VOUCHER_MODE (anfrage|stripe) gesetzt ist.
// Gleicher Schalter wie die Gutscheine (VOUCHER_MODE, Standard off → 404).
// Text: src/lib/commerce/voucherTerms.js (Rechtspaket 06 1.2, W3/W4/W5/W14/W15).
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Breadcrumbs, Container, Eyebrow, Heading } from "@/components/ui";
import VoucherTerms from "@/components/Gutschein/VoucherTerms";
import { NOINDEX, voucherEnabled } from "@/lib/commerce/mode";
import { TERMS_STATUS, TERMS_TITLE } from "@/lib/commerce/voucherTerms";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  await connection();
  if (locale !== "de" || !voucherEnabled()) {
    return { title: `${TERMS_TITLE} | ${SITE_NAME}`, robots: NOINDEX };
  }
  return { title: `${TERMS_TITLE} | ${SITE_NAME}`, alternates: { canonical: `${SITE_URL}/de/gutscheinbedingungen` } };
}

export default async function GutscheinbedingungenPage({ params }) {
  const { locale } = await params;
  await connection();
  if (locale !== "de" || !voucherEnabled()) notFound();
  return (
    <div className="bg-surface pt-10 pb-section text-text md:pt-14">
      <Container size="text">
        <Breadcrumbs
          className="mb-stack-m"
          items={[{ label: "Startseite", href: "/" }, { label: "Gutscheine", href: "/gutscheine" }, { label: TERMS_TITLE }]}
        />
        {TERMS_STATUS === "entwurf" && <Eyebrow>Entwurf · Angaben des Unternehmens offen</Eyebrow>}
        <Heading level={1} className="mt-stack-s">
          {TERMS_TITLE}
        </Heading>
        <div className="mt-12">
          <VoucherTerms />
        </div>
      </Container>
    </div>
  );
}
