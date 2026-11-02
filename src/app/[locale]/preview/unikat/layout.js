// Design-Prototyp „Unikat“ (Startseite als Labs-Studie, Inhaber 31.10.2026):
// nur Deutsch, nie indexiert, nicht in Sitemap/llms/Navigation.
// Gleiche Regel wie die anderen Vorschauen (src/components/Preview/gate.js):
// Entwicklung sichtbar, Produktion nur mit DESIGN_PREVIEW=1, VERCEL_ENV=production nie.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { designPreviewEnabled } from "@/components/Preview/gate";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function UnikatLayout({ children, params }) {
  const { locale } = await params;
  // Produktion: 404 ohne DESIGN_PREVIEW=1 (gate.js), Schalter zur Anfragezeit.
  await connection();
  if (locale !== "de" || !designPreviewEnabled()) notFound();
  return children;
}
