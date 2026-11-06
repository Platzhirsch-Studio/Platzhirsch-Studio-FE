import { Geist, Newsreader } from "next/font/google";
import ThemeRoot from "@/components/Entwurf/Atelier/ThemeRoot";
import "./atelier.css";

// Entwurf „Atelier“ – Gestaltungsstudie, keine Fachlogik, keine Sitzung nötig
// (die Zugriffsprüfung des Backoffice sitzt pro Seite, nicht im Layout).
// Schriften: Geist für die Oberfläche (präzise, ruhige Tabellenziffern auch bei
// 12–14 px), Newsreader für Überschriften und große Zahlen (optische Größen
// 6–72, Buchschrift-Wärme). Bodoni Moda bleibt der Wortmarke vorbehalten.
const sans = Geist({ subsets: ["latin"], display: "swap", variable: "--at-font-sans" });
const serif = Newsreader({ subsets: ["latin"], display: "swap", variable: "--at-font-serif", axes: ["opsz"], style: ["normal", "italic"] });

export const metadata = {
  title: { default: "Entwurf Atelier", template: "%s · Entwurf Atelier" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AtelierLayout({ children }) {
  return (
    <ThemeRoot className={`${sans.variable} ${serif.variable}`}>{children}</ThemeRoot>
  );
}
