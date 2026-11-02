// Share-Bild (1200 × 630 PNG) für /<locale>/arbeitsweise – /<locale>/arbeitsweise/teilen.png.
// Typografisch und ohne Foto (feedback-2 P2-5): Die Herkunft der Showroom-Fotos
// (u. a. /Images/Home/aboutHome.jpg) ist nicht belegt, und eine Grafik darf
// nicht als Haralds Zeichnung erscheinen. Darum nur Wortmarke, Titel, Leitsatz
// und eine Messing-Haarlinie. Sobald MEDIA.rendering oder MEDIA.handzeichnung
// echt eingetragen ist, nutzt page.js dieses Bild statt der Grafik hier.
// Der Pfad enthält einen Punkt, deshalb lässt der Proxy (src/proxy.js) ihn in
// Ruhe. Statisch: ein PNG je Sprache (R5-fix P2: die Seite gibt es in
// DE/EN/FR/IT, Texte aus arbeitsweiseCopy(); unbekannte Sprache → 404).
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { WORDMARK } from "@/components/Brand/brandPaths";
import { LOCALES, arbeitsweiseCopy } from "@/lib/arbeitsweise/copy";

const SIZE = { width: 1200, height: 630 };
// Rollen-Tokens aus globals.css (paper, ink, ink-soft, brass-700).
const PAPER = "#faf8f4";
const INK = "#30373e";
const INK_SOFT = "#5c636a";
const BRASS = "#7a5f17";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function GET(_request, { params }) {
  const { locale } = await params;
  if (!LOCALES.includes(locale)) notFound();
  const { ABSCHLUSS, HERO } = arbeitsweiseCopy(locale);
  const w = Math.ceil(WORDMARK.width);
  const markWidth = 300;

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
        <svg width={markWidth} height={Math.round((markWidth * 26.5) / w)} viewBox={`0 -1 ${w} 26.5`}>
          <path d={WORDMARK.d} fill={INK} stroke={INK} strokeWidth="0.7" strokeLinejoin="round" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 4, color: BRASS }}>{HERO.overline.toUpperCase()}</div>
          <div style={{ display: "flex", fontSize: 76, lineHeight: 1.08, marginTop: 24, maxWidth: 900 }}>{HERO.title}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", width: 96, height: 2, background: BRASS }} />
          <div style={{ display: "flex", marginTop: 28, fontSize: 36, fontStyle: "italic", color: INK_SOFT }}>{ABSCHLUSS.line}</div>
        </div>
      </div>
    ),
    SIZE
  );
}
