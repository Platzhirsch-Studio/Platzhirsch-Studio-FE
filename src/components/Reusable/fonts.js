// Font definitions file (next/font docs: "Using a font definitions file").
// One place for the type system of the Neuauftritt (Design-Bibel §5), so the
// locale layout, the global 404 (src/app/not-found.js) and the last-resort
// src/app/global-error.js all use the SAME self-hosted files: next/font hosts
// one instance per loader call, a second call elsewhere would add a second
// copy of each woff2 (R6-shell-perf).
//
// Only the `latin` subset is preloaded (ç/ë/ä/ö/ü/é/à are in latin; latin-ext
// stays available via unicode-range but is not preloaded). F5 (Runde 1): only
// the hero font Bodoni is preloaded → 1 preloaded woff2 (46 KB), was 2 (76 KB).
import { Montserrat, Bodoni_Moda, Instrument_Sans } from "next/font/google";

// Display: Bodoni Moda, variable with optical sizes, only from 32 px up.
// Used via `font-display` / `text-display-*` (globals.css).
const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bodoni",
  axes: ["opsz"],
});

// Bodoni italic – only for the "Nehmen Sie Platz." Leitsatz and quotes, so it
// is not preloaded (§5): the browser fetches it when such a line renders.
// P6 Runde 2 (r2-technik P1-1/P1-5): display "optional" – if the italic is not
// there within the short block period the line stays in the size-adjusted
// fallback (next/font adjustFontFallback) for this visit and never swaps,
// so no late layout shift (Yacht motto, CLS 0,211 at 1440 × 900) and no
// render-blocking wait on 1,6 Mbit/s. Cached, it shows from the next view on.
const bodoniItalic = Bodoni_Moda({
  subsets: ["latin"],
  style: ["italic"],
  display: "optional",
  variable: "--font-bodoni-italic",
  axes: ["opsz"],
  preload: false,
});

// Text and UI: Instrument Sans (everything below 32 px). Default body font
// via --font-sans in globals.css. No wdth axis (budget).
// F5 (Runde 1, Perf mobil): not preloaded any more – only the hero font
// (Bodoni, H1 = LCP text on most pages) keeps its preload. The 30 KB woff2
// no longer competes with the LCP image/H1 on 1.6 Mbit/s; the browser fetches
// it as soon as the CSS asks for it (display: swap, metric-matched fallback
// from next/font, so no layout shift).
const instrument = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument",
  preload: false,
});

// Legacy: Montserrat is no longer the body font, but Labs modules still read
// var(--font-montserrat). Not preloaded, so browsers only download it on pages
// that actually render it. Remove once nothing references --font-montserrat.
const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-montserrat",
  preload: false,
});

export { bodoni, bodoniItalic, instrument, montserrat };

/** The two house families (display + text) as one className for <html>. */
export const HOUSE_FONT_VARIABLES = `${bodoni.variable} ${instrument.variable}`;
