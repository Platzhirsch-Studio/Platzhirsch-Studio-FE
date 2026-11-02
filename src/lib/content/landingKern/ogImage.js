// src/lib/content/landingKern/ogImage.js – Bild-Route (opengraph-image.js) der
// Kern-Landingpages in DE, EN, FR und IT. Deutsch = die bisherige Karte
// (ogCardImage aus src/lib/seo/ogCard.js, unverändert); EN/FR/IT = gleicher
// Look (Papier, Tinte, Messing – wie ogCard.js und hotel-objekt), Texte aus ./og.js.
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { ogCardImage } from "@/lib/seo/ogCard";
import { SITE_NAME } from "@/lib/seo/pageMetadata";
import { kernOgCard } from "./og";

const PAPER = "#faf8f4";
const INK = "#30373e";
const INK_SOFT = "#5c636a";
const BRASS = "#7a5f17";
const SIZE = { width: 1200, height: 630 };

function render(card) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: PAPER, color: INK, padding: "72px 96px" }}>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, color: BRASS }}>{card.eyebrow.toUpperCase()}</div>
        <div style={{ display: "flex", fontSize: card.title.length > 30 ? 72 : 84, lineHeight: 1.08 }}>{card.title}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", height: 1, width: "100%", background: "rgba(48,55,62,0.24)" }} />
          <div style={{ display: "flex", flexDirection: "column", marginTop: 28, fontSize: 26, color: INK_SOFT }}>
            <span>{card.footer}</span>
            <span style={{ marginTop: 6 }}>{SITE_NAME}</span>
          </div>
        </div>
      </div>
    ),
    { ...SIZE }
  );
}

/** Default-Export für opengraph-image.js einer Kern-Seite. */
export function kernOgImage(path) {
  const german = ogCardImage(path);
  return async function Image(props) {
    const { locale } = await props.params;
    if (locale === "de") return german(props);
    const card = kernOgCard(path, locale);
    if (!card) notFound();
    return render(card);
  };
}
