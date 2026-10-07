import './globals.css';

// Root layout: the real <html>/<body> live in app/[locale]/layout.js (locale,
// fonts, site-wide JSON-LD). This file only carries the site-wide metadata
// defaults that must exist outside the [locale] segment (global 404 etc.).
export const metadata = {
  title: 'Platzhirsch Home Living',
  description: 'Platzhirsch Home Living – Einrichtungsstudio für Designermöbel und Interior Design in Lochau, Vorarlberg.',

  // Google Search Console (HTML-tag method) — token only, no "google-site-verification=" prefix.
  verification: { google: "fBnnqJ7z8gqPWuspRdlAFKvrsHTH5kUmnoW-gtMrxA4" },
};

export default function RootLayout({ children }) {
  return children;
}
