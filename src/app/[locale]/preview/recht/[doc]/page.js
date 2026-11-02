import { notFound } from "next/navigation";
import { getDoc, legalPreviewEnabled } from "@/components/LegalDrafts";
import LegalDraftPage from "@/components/LegalDrafts/LegalDraftPage";

// Anwalts-Vorschau der Rechtstexte (R3-recht-vorschau):
//   /de/preview/recht/datenschutz  /impressum  /agb  /barrierefreiheit
// Only in development, or in a production build when LEGAL_PREVIEW=1 is set
// (same pattern as /de/preview/fehler); otherwise a normal 404. Always
// noindex, never in a sitemap. German only – the drafts are German.
// Rendered per request, so the env switch is read at runtime, not at build.
export const dynamic = "force-dynamic";

const ROBOTS = { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } };

export async function generateMetadata({ params }) {
  const { doc } = await params;
  const d = legalPreviewEnabled() ? getDoc(doc) : null;
  return {
    title: d ? `${d.title} – Anwalts-Vorschau` : "Vorschau",
    robots: ROBOTS,
  };
}

export default async function LegalDraftPreview({ params }) {
  const { locale, doc } = await params;
  const d = getDoc(doc);
  if (!legalPreviewEnabled() || locale !== "de" || !d) notFound();
  return <LegalDraftPage doc={d} />;
}
