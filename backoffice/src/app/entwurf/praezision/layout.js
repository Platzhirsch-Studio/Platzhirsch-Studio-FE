import { Geist, Geist_Mono } from "next/font/google";
import "./praezision.css";
import PzRoot from "@/components/Entwurf/Praezision/PzRoot";

// Entwurf „Präzision“ – reine Gestaltungsstudie mit fiktiven Daten, ohne
// Sitzung und ohne Frappe. Nie indexieren.
// Schrift: Geist (UI) + Geist Mono (Kürzel, Tasten). Bodoni Moda nur für die
// Wortmarke – kommt als --font-bodoni aus dem Wurzel-Layout.
const geist = Geist({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-pz-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], display: "swap", variable: "--font-pz-mono", preload: false });

export const metadata = {
  title: { default: "Entwurf Präzision", template: "%s · Entwurf Präzision" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function PraezisionLayout({ children }) {
  return <PzRoot className={`${geist.variable} ${geistMono.variable}`}>{children}</PzRoot>;
}
