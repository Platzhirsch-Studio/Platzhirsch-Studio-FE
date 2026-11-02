// src/lib/seo/ogCard.js
// Typographic Open-Graph card (1200 × 630) for the German-only pages in
// OG_CARDS (src/lib/seo/pageMetadata.js). No photo on purpose: the /Images
// files have no documented release yet (Marktresearch/recht/bildrechte.csv)
// and Yacht must not show Minotti/Custom-Line photos before the written
// release (Inhaber-Entscheidung Nr. 9). Same look as the Adventsabend card
// (paper, ink, brass – role tokens of globals.css).
//
// Use in a page folder (opengraph-image.js):
//   import { ogCardImage, ogCardAlt, OG_CARD_SIZE } from "@/lib/seo/ogCard";
//   export const alt = ogCardAlt("/kuechen-vorarlberg");
//   export const size = OG_CARD_SIZE;
//   export const contentType = "image/png";
//   export default ogCardImage("/kuechen-vorarlberg");
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { OG_CARDS, OG_CARD_FOOTER, OG_CARD_SIZE, OG_DEFAULT_CARD, SITE_NAME } from "./pageMetadata";

export { OG_CARD_SIZE };

const PAPER = "#faf8f4";
const INK = "#30373e";
const INK_SOFT = "#5c636a";
const BRASS = "#7a5f17";

/** alt text of a page's card. */
export function ogCardAlt(path) {
  const card = OG_CARDS[path];
  return card ? `${card.title} – ${SITE_NAME}, Lochau am Bodensee` : SITE_NAME;
}

/** Renders one card ({eyebrow, title, line?}) as a 1200 × 630 PNG response. */
function renderCard(card) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: PAPER,
            color: INK,
            padding: "72px 96px",
          }}
        >
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, color: BRASS }}>{card.eyebrow.toUpperCase()}</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: card.title.length > 30 ? 72 : 84, lineHeight: 1.08 }}>{card.title}</div>
            {card.line ? (
              <div style={{ display: "flex", fontSize: 42, marginTop: 24, fontStyle: "italic" }}>{card.line}</div>
            ) : null}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", height: 1, width: "100%", background: "rgba(48,55,62,0.24)" }} />
            <div style={{ display: "flex", flexDirection: "column", marginTop: 28, fontSize: 26, color: INK_SOFT }}>
              <span>{OG_CARD_FOOTER}</span>
              <span style={{ marginTop: 6 }}>{SITE_NAME}</span>
            </div>
          </div>
        </div>
      ),
      { ...OG_CARD_SIZE }
    );
}

/** Default export for opengraph-image.js: renders the card (German only). */
export function ogCardImage(path) {
  return async function Image({ params }) {
    const { locale } = await params;
    const card = OG_CARDS[path];
    if (locale !== "de" || !card) notFound();
    return renderCard(card);
  };
}

/**
 * Default share card (Runde 2, seo P1-8): typographic instead of photos of
 * unclear origin. Served at /og-standard.png (src/app/og-standard.png/route.js),
 * referenced by DEFAULT_OG_IMAGE / defaultOgImage() in pageMetadata.js.
 */
export function ogDefaultImageResponse() {
  return renderCard(OG_DEFAULT_CARD);
}
