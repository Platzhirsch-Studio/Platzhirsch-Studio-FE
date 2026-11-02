// Share-Karte von /<locale>/hotel-objekt (DE, EN, FR, IT): typografisch, kein Foto
// (Bildrechte-Regel in src/lib/seo/pageMetadata.js). Gleicher Look wie
// src/lib/seo/ogCard.js (Papier, Tinte, Messing).
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { hotelCopy } from "@/lib/hotel/content";
import { OG_CARD_FOOTER, SITE_NAME } from "@/lib/seo/pageMetadata";

export const alt = `Hotel & Objekt – ${SITE_NAME}, Lochau am Bodensee`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#faf8f4";
const INK = "#30373e";
const INK_SOFT = "#5c636a";
const BRASS = "#7a5f17";
const FOOTER = {
  de: OG_CARD_FOOTER,
  en: "Drawn by hand, planned in 3D · Showroom & café in Lochau on Lake Constance",
  fr: "Dessiné à la main, planifié en 3D · Showroom & café à Lochau, lac de Constance",
  it: "Disegnato a mano, progettato in 3D · Showroom & caffè a Lochau sul Lago di Costanza",
};

export default async function Image({ params }) {
  const { locale } = await params;
  const copy = hotelCopy(locale);
  if (!copy) notFound();
  const { ogEyebrow, ogTitle, ogLine } = copy.meta;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: PAPER, color: INK, padding: "72px 96px" }}>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, color: BRASS }}>{ogEyebrow.toUpperCase()}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 84, lineHeight: 1.08 }}>{ogTitle}</div>
          <div style={{ display: "flex", fontSize: 42, marginTop: 24, fontStyle: "italic" }}>{ogLine}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", height: 1, width: "100%", background: "rgba(48,55,62,0.24)" }} />
          <div style={{ display: "flex", flexDirection: "column", marginTop: 28, fontSize: 26, color: INK_SOFT }}>
            <span>{FOOTER[locale] || FOOTER.de}</span>
            <span style={{ marginTop: 6 }}>{SITE_NAME}</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
