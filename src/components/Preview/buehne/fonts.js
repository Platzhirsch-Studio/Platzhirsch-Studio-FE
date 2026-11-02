// Text font for the "Bühne" prototype: Instrument Sans, the calm grotesk
// proposed in Marktresearch/digital/01 (F1) as the Montserrat replacement.
// The display face (Bodoni Moda) is NOT loaded again here: the locale layout
// already self-hosts it as --font-bodoni, buehne.module.css maps it to
// --bu-font-display (a second next/font call would download it twice).
import { Instrument_Sans } from "next/font/google";

export const text = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--bu-font-text",
});
