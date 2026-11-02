// R5-produkt (P1): neutral share image (1200 × 630 PNG) for products without
// a backoffice photo – /{locale}/produkte/kein-foto.png. Typographic, no
// motif: wordmark, brass hairline, "Für dieses Stück liegt noch kein Foto vor".
// Replaces the generic room photo (DEFAULT_OG_IMAGE) that a share of such a
// product used to show. Manufacturer images are not a stand-in (no release).
// The path has a dot, so the proxy (src/proxy.js matcher) leaves it alone and
// the German folder name is the URL in every locale. Static: one PNG per
// locale at build time, no request data read.
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { WORDMARK } from "@/components/Brand/brandPaths";
import { NO_PHOTO_TEXT } from "@/lib/shop/noPhoto";

const LOCALES = ["de", "en", "fr", "it"];
const SIZE = { width: 1200, height: 630 };
// Role tokens from globals.css (paper, ink, ink-soft, brass-500).
const PAPER = "#faf8f4";
const INK = "#30373e";
const INK_SOFT = "#5c636a";
const BRASS = "#9a7a2a";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function GET(_request, { params }) {
  const { locale } = await params;
  if (!LOCALES.includes(locale)) notFound();
  const w = Math.ceil(WORDMARK.width);
  const markWidth = 520;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: PAPER,
          color: INK,
        }}
      >
        <svg width={markWidth} height={Math.round((markWidth * 26.5) / w)} viewBox={`0 -1 ${w} 26.5`}>
          <path d={WORDMARK.d} fill={INK} stroke={INK} strokeWidth="0.7" strokeLinejoin="round" />
        </svg>
        <div style={{ display: "flex", width: 96, height: 2, background: BRASS, marginTop: 56 }} />
        <div style={{ display: "flex", marginTop: 40, fontSize: 32, color: INK_SOFT }}>{NO_PHOTO_TEXT[locale]}</div>
      </div>
    ),
    SIZE
  );
}
