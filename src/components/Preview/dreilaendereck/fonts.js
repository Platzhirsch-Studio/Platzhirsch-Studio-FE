// Schriften des Prototyps "Dreiländereck" – nur hier geladen, nicht global.
// Fraunces (OFL 1.1): warme Antiqua mit SOFT-Achse, wirkt gastgebend statt
// modisch-kühl wie Bodoni. Instrument Sans (OFL 1.1): ruhige Grotesk für Text
// und UI (Empfehlung aus Bauplan 01). Beide variabel, über next/font selbst
// gehostet, kein Request an Google im Browser.
import { Fraunces, Instrument_Sans } from "next/font/google";

export const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--dl-font-display",
  axes: ["SOFT", "opsz"],
});

export const instrumentSans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--dl-font-text",
});
