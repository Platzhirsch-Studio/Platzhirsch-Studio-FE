// src/lib/pinterest/stilPalette.js – Stil-Finder-Ergebnis als Pin-Karte im
// Hochformat 2:3 (1000 × 1500), ausgeliefert unter /stil-palette/<profil>.png
// (je Profil ein statischer Ordner src/app/stil-palette/<profil>.png/route.js:
// eine dynamische Route unter einem unbekannten ersten Segment fiele der
// afterFiles-Umschreibung UNKNOWN_LOCALE_REWRITE in next.config.js zum Opfer).
// Rein typografisch, eigene Grafik: Name, Leitsatz, die fünf Farbtöne und
// Stichworte – KEINE Fotos (die Titelbilder der Profile sind teils
// Herstellerbilder ohne Pinterest-Recht, src/lib/pinterest/rights.js). Pfad
// außerhalb von /api/ und ohne Query, damit Pinterestbot das Bild laden darf
// (robots.txt sperrt /api/ und /*?*).
import { ImageResponse } from "next/og";
import { PROFILE_ORDER, PROFILES, onColor } from "@/components/Labs/Stilfinder/profiles";

const PAPER = "#faf8f4";
const INK = "#30373e";
const INK_SOFT = "#5c636a";
const BRASS = "#7a5f17";
export const SIZE = { width: 1000, height: 1500 };

const bySlug = Object.fromEntries(PROFILE_ORDER.map((k) => [PROFILES[k].slug, PROFILES[k]]));

export const STIL_PALETTE_SLUGS = PROFILE_ORDER.map((k) => PROFILES[k].slug);

/** PNG-Antwort für ein Profil (slug), 404 bei unbekanntem Profil. */
export function stilPaletteResponse(slug) {
  const p = bySlug[slug];
  if (!p) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  const res = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: PAPER, color: INK, padding: "80px 80px 72px" }}>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 5, color: BRASS }}>WOHNSTIL · STIL-FINDER</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 56 }}>
          <div style={{ display: "flex", fontSize: p.name.length > 18 ? 88 : 104, lineHeight: 1.04 }}>{p.name}</div>
          <div style={{ display: "flex", fontSize: 40, marginTop: 28, fontStyle: "italic", color: INK_SOFT, lineHeight: 1.3 }}>{p.tagline}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, marginTop: 64 }}>
          {p.palette.map((c) => (
            <div key={c.hex} style={{ display: "flex", flexGrow: 1, alignItems: "flex-end", justifyContent: "space-between", padding: "0 28px 18px", background: c.hex, color: onColor(c.hex), fontSize: 30 }}>
              <span>{c.name}</span>
              <span style={{ fontSize: 24 }}>{c.hex}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 36, fontSize: 26, color: INK_SOFT }}>{p.keywords.slice(0, 5).join(" · ")}</div>
        <div style={{ display: "flex", height: 1, width: "100%", background: "rgba(48,55,62,0.24)", marginTop: 36 }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, fontSize: 26, color: INK_SOFT }}>
          <span>Platzhirsch Home Living</span>
          <span>Lochau am Bodensee</span>
        </div>
      </div>
    ),
    { ...SIZE }
  );
  res.headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  return res;
}
