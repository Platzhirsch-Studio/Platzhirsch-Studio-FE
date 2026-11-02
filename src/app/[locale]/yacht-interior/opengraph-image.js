// Share card of /<locale>/yacht-interior: typographic, no photo (rights rule in
// src/lib/seo/pageMetadata.js, OG_CARDS). German card from src/lib/seo/ogCard.js,
// EN/FR/IT cards from src/lib/yacht/ogCardEn.js (EN Welle 2, FR/IT 01.11.2026).
import { ogCardAlt, ogCardImage } from "@/lib/seo/ogCard";
import { OG_CARDS, ogCardEnResponse } from "@/lib/yacht/ogCardEn";

// One static alt for all files (Next takes `alt` per route, not per locale);
// the EN/FR/IT pages pass their own alt in generateMetadata (openGraph.images).
export const alt = ogCardAlt("/yacht-interior");
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const german = ogCardImage("/yacht-interior");

export default async function Image(props) {
  const { locale } = await props.params;
  if (OG_CARDS[locale]) return ogCardEnResponse(OG_CARDS[locale]);
  return german(props);
}
