import { notFound } from "next/navigation";
import { Badge, Container, Eyebrow, Heading, Lead, SmartLink } from "@/components/ui";
import { DOCS, DOC_SLUGS, docCounts, legalPreviewEnabled } from "@/components/LegalDrafts";

// Overview of the legal draft previews (/de/preview/recht). Same switch as
// the documents: development or LEGAL_PREVIEW=1, otherwise 404; noindex.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rechtstexte – Anwalts-Vorschau",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default async function LegalPreviewIndex({ params }) {
  const { locale } = await params;
  if (!legalPreviewEnabled() || locale !== "de") notFound();
  return (
    <div className="bg-surface pt-10 pb-section md:pt-14">
      <Container>
        <Eyebrow>Entwurf · Anwalts-Vorschau · noindex</Eyebrow>
        <Heading level={1} className="mt-stack-s">
          Rechtstexte
        </Heading>
        <Lead className="mt-stack-m">
          Die Entwürfe aus dem Rechtspaket im Layout der Website, zur Prüfung durch die Kanzlei. Jede offene Stelle ist markiert. Nichts davon ist veröffentlicht.
        </Lead>
        <ul className="mt-12 grid gap-grid border-t border-line md:grid-cols-2">
          {DOC_SLUGS.map((slug) => {
            const doc = DOCS[slug];
            const c = docCounts(doc);
            return (
              <li key={slug} className="border-b border-line py-6 md:pr-8">
                <Heading level={2} size="title">
                  <SmartLink href={`/preview/recht/${slug}`} className="underline decoration-line-strong underline-offset-4 hover:decoration-current">
                    {doc.title}
                  </SmartLink>
                </Heading>
                <p className="mt-2 max-w-measure text-small text-text-soft">{doc.lead}</p>
                <p className="mt-3">
                  <Badge tone="band">[anwaltlich prüfen] · {c.total} offene Stellen</Badge>
                </p>
              </li>
            );
          })}
        </ul>
      </Container>
    </div>
  );
}
