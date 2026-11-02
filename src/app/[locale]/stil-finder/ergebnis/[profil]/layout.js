import { notFound } from "next/navigation";
import { profileBySlug } from "@/components/Labs/Stilfinder/profiles";
import { StilCopyProvider } from "@/components/Labs/Stilfinder/StilCopy";
import { STILFINDER_LOCALES, stilfinderClientCopy } from "@/lib/stilfinder/intl";

// Validates locale and profile *outside* the loading.js Suspense boundary, so
// an unknown profile or locale still answers with a real HTTP 404 (inside the
// boundary the 200 shell would already be streaming).
// Mehrsprachigkeit (01.11.2026): DE, EN, FR, IT. Der Provider gibt loading.js,
// StilResult, Moodboard und PDF-Formular die Texte genau einer Sprache mit.
export default async function StilErgebnisLayout({ children, params }) {
  const { locale, profil } = await params;
  if (!STILFINDER_LOCALES.includes(locale) || !profileBySlug(profil)) notFound();
  return <StilCopyProvider copy={stilfinderClientCopy(locale)}>{children}</StilCopyProvider>;
}
