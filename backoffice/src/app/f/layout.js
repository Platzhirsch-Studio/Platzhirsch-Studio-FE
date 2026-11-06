import "@/components/Backoffice/Ablage/ablage.css";

// Öffentliche Freigabeseite (ohne Anmeldung, nie indexiert): nur Stile der Ablage, keine Shell.
export const metadata = { robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }, referrer: "no-referrer" };

export default function FreigabeLayout({ children }) {
  return children;
}
