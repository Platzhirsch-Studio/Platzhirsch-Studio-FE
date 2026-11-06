import { Inter } from "next/font/google";
import "./lounge.css";
import "./lounge-seiten.css";
import "./lounge-akte.css";
import "./lounge-kassa.css";
import "./lounge-pack.css";
import "./lounge-display.css";

// Entwurf „Lounge“ – vierte Richtung nach Vorgabe des Inhabers (fünf Referenzen:
// schwebende Bento-Kacheln, runde Symbolknöpfe, Kundenreise als verbundene Stufen).
// Isolierte Vorschau ohne Anmeldung und ohne Fachdaten, nie indexiert.
// Schrift: auf Apple-Geräten SF Pro (-apple-system), sonst Inter mit optischen
// Größen (opsz) – die nächste freie Verwandte von SF, Display-Schnitt bei 28+ px,
// sauber in Tabellenziffern. Bodoni Moda (aus dem Wurzel-Layout) nur für die Wortmarke.
const ui = Inter({ subsets: ["latin"], axes: ["opsz"], display: "swap", variable: "--lg-font" });

export const metadata = {
  title: { default: "Entwurf Lounge", template: "%s · Entwurf Lounge" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function LoungeLayout({ children }) {
  return <div className={`lg ${ui.variable}`}>{children}</div>;
}
