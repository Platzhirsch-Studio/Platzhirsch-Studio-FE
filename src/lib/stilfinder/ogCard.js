// src/lib/stilfinder/ogCard.js – Teilen-Bild (Open Graph / X, 1200 × 630) je
// Stil-Finder-Profil, ausgeliefert von
// src/app/[locale]/stil-finder/ergebnis/[profil]/opengraph-image.js und
// twitter-image.js.
//
// Warum eigene Grafik statt profile.hero: Die Titelbilder der Profile sind
// teils Herstellerbilder ohne schriftliche Freigabe (src/lib/pinterest/rights.js,
// Expertenrat P0-8). Ein geteilter Ergebnis-Link (WhatsApp, Facebook,
// Pinterest liest og:image) darf sie nicht weitertragen. Rein typografisch wie
// die Pin-Karte /stil-palette/<profil>.png: Name, Leitsatz, die fünf Töne.
import { ImageResponse } from "next/og";
import { PROFILE_ORDER, PROFILES, onColor } from "@/components/Labs/Stilfinder/profiles";
import { localizeProfile } from "@/components/Labs/Stilfinder/localize";
import { stilfinderCopy } from "@/lib/stilfinder/intl";

const PAPER = "#faf8f4";
const INK = "#30373e";
const INK_SOFT = "#5c636a";
const BRASS = "#7a5f17";

export const STIL_OG_SIZE = Object.freeze({ width: 1200, height: 630 });

const bySlug = Object.fromEntries(PROFILE_ORDER.map((k) => [PROFILES[k].slug, PROFILES[k]]));

// Statischer Alt-Text (opengraph-image.js exportiert `alt` als Konstante).
export const STIL_OG_ALT = "Wohnstil-Profil mit Name, Leitsatz und fünf Farbtönen – Platzhirsch Stil-Finder";

/**
 * PNG für ein Profil; null bei unbekanntem Profil oder unbekannter Sprache
 * (Aufrufer antwortet 404). Mehrsprachigkeit (01.11.2026): Kopfzeile, Ort,
 * Name, Leitsatz und Tonnamen in der Sprache der Seite (Standard Deutsch).
 */
export function stilOgImage(slug, locale = "de") {
  const copy = stilfinderCopy(locale);
  const base = bySlug[slug];
  if (!base || !copy) return null;
  const p = localizeProfile(base, copy.profiles?.[base.key]);
  const og = copy.page.og;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PAPER, color: INK }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 720, padding: "64px 56px 56px 80px" }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 4, color: BRASS }}>{og.kicker}</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: p.name.length > 20 ? 64 : p.name.length > 16 ? 76 : 88, lineHeight: 1.04 }}>{p.name}</div>
            <div style={{ display: "flex", fontSize: 34, marginTop: 22, fontStyle: "italic", color: INK_SOFT, lineHeight: 1.3 }}>{p.tagline}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", height: 1, width: "100%", background: "rgba(48,55,62,0.24)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, fontSize: 24, color: INK_SOFT }}>
              <span>Platzhirsch Home Living</span>
              <span>{og.place}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          {p.palette.map((c) => (
            <div
              key={c.hex}
              style={{ display: "flex", flexGrow: 1, alignItems: "flex-end", justifyContent: "space-between", padding: "0 28px 14px", background: c.hex, color: onColor(c.hex), fontSize: 24 }}
            >
              <span>{c.name}</span>
              <span style={{ fontSize: 20 }}>{c.hex}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...STIL_OG_SIZE }
  );
}
