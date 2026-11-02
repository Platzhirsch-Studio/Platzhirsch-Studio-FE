import { Cormorant_Garamond, Instrument_Sans } from "next/font/google";

// Prototype "Galerie": its own type pair, self-hosted by next/font and only
// loaded on /de/preview/galerie/**.
// Display: Cormorant Garamond, a fine Garamond with long hairlines, used only
// at 28 px and up. Text/UI: Instrument Sans, a calm grotesque with normal
// spacing (the alternative to Montserrat recommended in Marktresearch 01).
export const galerieSerif = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--gal-font-serif",
});

export const galerieSans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--gal-font-sans",
});
