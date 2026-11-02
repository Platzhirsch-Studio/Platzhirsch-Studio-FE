// Share image of the career page and the job pages (r4-seo P2-7): PNG
// 1200 × 630 (1.91:1) instead of the CMS image arbeiten.avif, which Facebook,
// LinkedIn and WhatsApp do not show. Typographic, without a photo: no
// manufacturer image rights involved (Design-Bibel §7). Colours = role tokens
// of globals.css (paper, ink, ink-soft, brass-700), same layout as
// adventsabend/opengraph-image.js. Served by
// src/app/[locale]/ueber-uns/karriere/share-image/route.js at the translated
// URL (/en/about-us/career/share-image …) – a file-convention
// opengraph-image would be linked under the German path and 308 for EN/FR/IT.
import { ImageResponse } from "next/og";
import { ADDRESS, SITE_NAME } from "@/lib/site";

export const SHARE_IMAGE = Object.freeze({ segment: "share-image", width: 1200, height: 630, type: "image/png" });

export const SHARE_TEXT = {
  de: { overline: "KARRIERE", title: "Arbeiten im Einrichtungsstudio", line: "Einrichtungsberatung, Küchenplanung, Showroom und Café", alt: `Karriere bei ${SITE_NAME}` },
  en: { overline: "CAREERS", title: "Working in an interior design studio", line: "Interior advice, kitchen planning, showroom and café", alt: `Careers at ${SITE_NAME}` },
  fr: { overline: "CARRIÈRE", title: "Travailler dans un studio d’aménagement", line: "Conseil en aménagement, cuisines, showroom et café", alt: `Carrière chez ${SITE_NAME}` },
  it: { overline: "LAVORA CON NOI", title: "Lavorare in uno studio d’arredamento", line: "Consulenza d’arredo, cucine, showroom e caffè", alt: `Lavorare da ${SITE_NAME}` },
};

const PAPER = "#faf8f4";
const INK = "#30373e";
const INK_SOFT = "#5c636a";
const BRASS = "#7a5f17";

/** openGraph.images entry for `pageUrl` (the career hub URL of the locale). */
export function shareImageMeta(pageUrl, locale) {
  const text = SHARE_TEXT[locale] || SHARE_TEXT.de;
  return {
    url: `${String(pageUrl).replace(/\/+$/, "")}/${SHARE_IMAGE.segment}`,
    width: SHARE_IMAGE.width,
    height: SHARE_IMAGE.height,
    type: SHARE_IMAGE.type,
    alt: text.alt,
  };
}

/** The PNG itself. */
export function renderShareImage(locale) {
  const text = SHARE_TEXT[locale] || SHARE_TEXT.de;
  const place = `${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}`;
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
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 4, color: BRASS }}>{`${text.overline} · ${SITE_NAME.toUpperCase()}`}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 76, lineHeight: 1.08 }}>{text.title}</div>
          <div style={{ display: "flex", fontSize: 34, marginTop: 24, color: INK_SOFT }}>{text.line}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", height: 1, width: "100%", background: "rgba(48,55,62,0.24)" }} />
          <div style={{ display: "flex", marginTop: 28, fontSize: 26, color: INK_SOFT }}>{`${SITE_NAME} · ${place}`}</div>
        </div>
      </div>
    ),
    { width: SHARE_IMAGE.width, height: SHARE_IMAGE.height }
  );
}
