// og:image des Stil-Finder-Ergebnisses (1200 × 630): eigene Palettenkarte je
// Profil statt des Titelbilds (teils Herstellerbilder ohne Freigabe).
// Datei-Metadaten haben Vorrang vor generateMetadata (Next 16,
// 01-metadata/opengraph-image.md); params ist ein Promise.
import { notFound } from "next/navigation";
import { STIL_OG_ALT, stilOgImage } from "@/lib/stilfinder/ogCard";

export const alt = STIL_OG_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }) {
  const { locale, profil } = await params;
  // Mehrsprachigkeit (01.11.2026): DE, EN, FR, IT; unbekannte Sprache → null → 404.
  const res = stilOgImage(profil, locale);
  if (!res) notFound();
  return res;
}
