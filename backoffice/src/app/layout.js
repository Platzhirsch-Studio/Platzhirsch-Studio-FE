import "./globals.css";
import "./bo-motion.css";
import { FONT_VARIABLES } from "@/lib/fonts";

// Wurzel-Layout des Backoffice: eigene Hülle (keine Website-Navigation),
// deutsch, nie indexiert. Die Zugriffsprüfung liegt NICHT hier (Layouts laufen
// bei Client-Navigation nicht erneut), sondern in jeder Seite über
// requireSession() aus @/lib/backoffice/auth/dal.
export const metadata = {
  title: { default: "Backoffice · Platzhirsch", template: "%s · Backoffice" },
  description: "Internes Backoffice von Platzhirsch Home Living.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport = { width: "device-width", initialScale: 1, colorScheme: "light dark" };

export default function RootLayout({ children }) {
  return (
    <html lang="de" className={FONT_VARIABLES}>
      <body className="min-h-dvh bg-bo-bg text-bo-text">{children}</body>
    </html>
  );
}
