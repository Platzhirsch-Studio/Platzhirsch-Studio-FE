import { Inter, Fraunces } from "next/font/google";
import "./showroom.css";

// Entwurf „Showroom“ – isolierte Vorschau ohne Anmeldung und ohne Fachdaten.
// Nie indexiert. Zwei Stimmen: Inter (optische Größen, Display-Schnitt ab 20 px)
// für die Oberfläche, Fraunces straff (SOFT 0, WONK 0, opsz 72, 300) nur für
// Anzeigegrößen ab 24 px. Die Wortmarke ist eine SVG-Kontur, keine Schrift.
const ui = Inter({ subsets: ["latin"], axes: ["opsz"], display: "swap", variable: "--sr-font-ui" });
const display = Fraunces({ subsets: ["latin"], axes: ["SOFT", "WONK", "opsz"], display: "swap", variable: "--sr-font-display" });

export const metadata = {
  title: { default: "Entwurf Showroom", template: "%s · Entwurf Showroom" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function ShowroomLayout({ children }) {
  return <div className={`sr ${ui.variable} ${display.variable}`}>{children}</div>;
}
