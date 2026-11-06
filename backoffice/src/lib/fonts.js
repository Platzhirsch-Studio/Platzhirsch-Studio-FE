// Schriften des Backoffice – dieselben Familien wie die Website (Design-Bibel §5),
// eigene next/font-Instanz, weil das Backoffice ein eigener Dienst ist.
import { Bodoni_Moda, Inter, Instrument_Sans } from "next/font/google";

export const bodoni = Bodoni_Moda({ subsets: ["latin"], display: "swap", variable: "--font-bodoni", axes: ["opsz"], preload: false });
export const instrument = Instrument_Sans({ subsets: ["latin"], display: "swap", variable: "--font-instrument" });

// Lounge (art-direction/lounge.md §5): UI-Schrift SF auf Apple-Geräten, sonst Inter mit optischer Größe.
export const inter = Inter({ subsets: ["latin"], axes: ["opsz"], display: "swap", variable: "--font-inter" });

export const FONT_VARIABLES = `${bodoni.variable} ${inter.variable} ${instrument.variable}`;
