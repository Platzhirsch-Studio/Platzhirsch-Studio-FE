// twitter:image des Stil-Finder-Ergebnisses – dieselbe Palettenkarte wie
// opengraph-image.js (ohne sie fiele X auf das Startseiten-Foto des Layouts
// zurück: /Images/Home/aboutHome.jpg).
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
