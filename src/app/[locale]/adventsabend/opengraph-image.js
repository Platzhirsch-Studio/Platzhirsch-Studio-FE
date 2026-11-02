// OG/Share-Bild für /de/adventsabend (1200 × 630, 1,91:1).
// Typografisch und ohne Foto: Es gibt noch kein eigenes Bild von Showroom oder
// Café im Bildregister, und Herstellerbilder brauchen eine schriftliche
// Freigabe (Design-Bibel §7). Farben = Rollen-Tokens aus globals.css
// (paper, ink, ink-soft, brass-700). Sobald EVENT.image gesetzt ist, nutzt
// page.js dieses Foto als openGraph.images zusätzlich.
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { SITE_NAME } from "@/lib/site";
import { ADDRESS_LINE, EVENT, TITLE, eventPublic } from "./event";

export const alt = `${TITLE} bei ${SITE_NAME} in Lochau, ${EVENT.dateLabel}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#faf8f4";
const INK = "#30373e";
const INK_SOFT = "#5c636a";
const BRASS = "#7a5f17";

export default async function Image({ params }) {
  const { locale } = await params;
  if (locale !== "de" || !eventPublic()) notFound();

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
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 4, color: BRASS }}>
          {`EINLADUNG · ${EVENT.shortDateLabel} IN LOCHAU`}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 84, lineHeight: 1.05 }}>{TITLE}</div>
          <div style={{ display: "flex", fontSize: 44, marginTop: 24, fontStyle: "italic", color: INK }}>
            Nehmen Sie Platz.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", height: 1, width: "100%", background: "rgba(48,55,62,0.24)" }} />
          <div style={{ display: "flex", flexDirection: "column", marginTop: 28, fontSize: 26, color: INK_SOFT }}>
            <span>{EVENT.dateLabel}</span>
            <span style={{ marginTop: 6 }}>{`${SITE_NAME} · ${ADDRESS_LINE}`}</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
