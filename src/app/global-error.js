"use client"; // Error boundaries must be Client Components (Next convention, design bible §13 exception).

import { useEffect, useRef } from "react";
import { useParams, usePathname } from "next/navigation";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import "./globals.css";

// Fonts (R6-shell-perf): next/font cannot be used in this client module
// (Turbopack 16.3: "Font loader calls must be assigned to a const"; importing
// the font objects from Reusable/fonts.js compiled in the production build but
// broke the dev server, so it is not done here). The variables are set to the
// family names that next/font itself writes into its @font-face rules
// ("Bodoni Moda", "Instrument Sans", checked in the built CSS): whenever those
// rules are in the document – every error after the first page load – the
// house fonts apply; otherwise the fallbacks of globals.css (Didot, Georgia /
// system sans). Undefined vars would make the whole font-family invalid.
const FONT_VARS = { "--font-bodoni": "\"Bodoni Moda\"", "--font-instrument": "\"Instrument Sans\"" };

// Last-resort fallback when the root or locale layout itself fails. It
// replaces the whole document, so it brings its own <html>/<body> and styles,
// and uses plain <a> links (a full page load is the safest way back when the
// layout could not render). No technical details for visitors; only the digest
// is logged so it can be matched with the server log (src/instrumentation.js).
const TEXT = {
  de: {
    docTitle: "Kurze Unterbrechung · Platzhirsch Home Living",
    overline: "Kurze Unterbrechung",
    title: "Die Website lässt gerade auf sich warten.",
    body: "Bei uns hat sich etwas verhakt. Versuchen Sie es bitte gleich noch einmal oder kommen Sie über die Startseite wieder herein.",
    phoneLead: "Lieber direkt sprechen? Wir sind telefonisch für Sie da:",
    retry: "Erneut versuchen",
    home: "Zur Startseite",
    contact: "Kontakt",
    contactPath: "/kontakt",
    nav: "Weiter zu",
  },
  en: {
    docTitle: "A brief interruption · Platzhirsch Home Living",
    overline: "A brief interruption",
    title: "The website is taking a moment.",
    body: "Something got caught on our side. Please try again in a moment, or come back in through the home page.",
    phoneLead: "Would you rather talk to us? We are happy to take your call:",
    retry: "Try again",
    home: "Home page",
    contact: "Contact",
    contactPath: "/contact",
    nav: "Continue to",
  },
  fr: {
    docTitle: "Une courte interruption · Platzhirsch Home Living",
    overline: "Une courte interruption",
    title: "Le site se fait un peu attendre.",
    body: "Un petit contretemps de notre côté. Réessayez dans un instant ou revenez par la page d’accueil.",
    phoneLead: "Vous préférez nous parler ? Nous sommes à votre écoute par téléphone :",
    retry: "Réessayer",
    home: "Page d’accueil",
    contact: "Contact",
    contactPath: "/contact",
    nav: "Continuer vers",
  },
  it: {
    docTitle: "Una breve interruzione · Platzhirsch Home Living",
    overline: "Una breve interruzione",
    title: "Il sito si fa attendere.",
    body: "Qualcosa si è inceppato da parte nostra. Riprovi tra un momento oppure torni dalla pagina iniziale.",
    phoneLead: "Preferisce parlarci direttamente? Siamo a sua disposizione al telefono:",
    retry: "Riprova",
    home: "Pagina iniziale",
    contact: "Contatti",
    contactPath: "/contatto",
    nav: "Prosegui verso",
  },
};

function pickLocale(params, pathname) {
  if (TEXT[params?.locale]) return params.locale;
  const first = String(pathname || "").split("/")[1];
  return TEXT[first] ? first : "de";
}

export default function GlobalError({ error, retry, reset }) {
  const locale = pickLocale(useParams(), usePathname());
  const t = TEXT[locale];
  const tryAgain = typeof retry === "function" ? retry : reset;
  const headingRef = useRef(null);

  useEffect(() => {
    // Same as [locale]/error.js: screen readers announce the message first.
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    console.error(JSON.stringify({ src: "error-boundary", scope: "global", digest: error?.digest || null }));
  }, [error]);

  return (
    <html lang={locale} dir="ltr" style={FONT_VARS}>
      <body className="bg-surface text-text">
        <title>{t.docTitle}</title>
        <meta name="robots" content="noindex" />
        <main id="main" className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center px-4 py-16 sm:px-6">
          <p className="font-display text-title">Platzhirsch Home Living</p>
          <p className="text-overline mt-12 uppercase text-text-accent">{t.overline}</p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            style={{ outline: "none", boxShadow: "none" }}
            className="font-display text-display-m mt-4 text-balance"
          >
            {t.title}
          </h1>
          <p className="text-lead mt-6 text-text-soft">{t.body}</p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            {typeof tryAgain === "function" && (
              <button
                type="button"
                onClick={() => tryAgain()}
                className="text-ui inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-7 text-paper transition-colors hover:bg-ink-deep motion-reduce:transition-none"
              >
                {t.retry}
              </button>
            )}
            <nav aria-label={t.nav} className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <a
                href={`/${locale}`}
                className="text-ui inline-flex min-h-11 items-center underline decoration-line-strong underline-offset-4 hover:decoration-current"
              >
                {t.home}
              </a>
              <a
                href={`/${locale}${t.contactPath}`}
                className="text-ui inline-flex min-h-11 items-center underline decoration-line-strong underline-offset-4 hover:decoration-current"
              >
                {t.contact}
              </a>
            </nav>
          </div>

          <p className="mt-10 border-t border-line pt-6 text-text-soft">
            {t.phoneLead}{" "}
            <a href={PHONE_HREF} className="whitespace-nowrap text-text underline underline-offset-4">
              {PHONE_DISPLAY}
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
