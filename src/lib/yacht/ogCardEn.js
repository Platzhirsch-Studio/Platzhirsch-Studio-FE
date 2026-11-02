// English share card of /en/yacht-interior (Welle 2, team EN-Yacht-Sofa).
// Same typographic look as src/lib/seo/ogCard.js (paper, ink, brass; no photo –
// rights rule in src/lib/seo/pageMetadata.js), English text. ogCard.js renders
// German cards only and is not this team's file, so the layout is repeated here.
import { ImageResponse } from "next/og";
import { OG_CARD_FR, OG_CARD_IT } from "./ogCardsIntl.js";

export const OG_CARD_EN = Object.freeze({
  eyebrow: "Boats · Yachts · Boathouses",
  title: "Yacht interiors on Lake Constance",
  line: "Take a seat – on board.",
  footer: "Drawn by hand, planned in 3D · Showroom & café in Lochau on Lake Constance",
  alt: "Yacht interiors on Lake Constance – Platzhirsch Home Living, Lochau on Lake Constance",
});

/** Share cards of the translated versions (German: src/lib/seo/ogCard.js). */
export const OG_CARDS = Object.freeze({ en: OG_CARD_EN, fr: OG_CARD_FR, it: OG_CARD_IT });

const PAPER = "#faf8f4";
const INK = "#30373e";
const INK_SOFT = "#5c636a";
const BRASS = "#7a5f17";

export function ogCardEnResponse(card = OG_CARD_EN, size = { width: 1200, height: 630 }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: PAPER, color: INK, padding: "72px 96px" }}>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, color: BRASS }}>{card.eyebrow.toUpperCase()}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: card.title.length > 30 ? 72 : 84, lineHeight: 1.08 }}>{card.title}</div>
          {card.line ? <div style={{ display: "flex", fontSize: 42, marginTop: 24, fontStyle: "italic" }}>{card.line}</div> : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", height: 1, width: "100%", background: "rgba(48,55,62,0.24)" }} />
          <div style={{ display: "flex", flexDirection: "column", marginTop: 28, fontSize: 26, color: INK_SOFT }}>
            <span>{card.footer}</span>
            <span style={{ marginTop: 6 }}>Platzhirsch Home Living</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
