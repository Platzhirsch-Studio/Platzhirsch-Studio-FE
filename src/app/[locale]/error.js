"use client"; // Error boundaries must be Client Components (Next convention, design bible §13 exception).

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import { ROUTES } from "@/utils/routing";

// Fallback for unexpected runtime errors inside /[locale]/… (page, nested
// layouts, loading, not-found). Navbar and Footer of the locale layout stay
// visible around it. Visitors never see technical details; the digest is only
// logged so it can be matched with the server log (src/instrumentation.js).
// Texts live here on purpose (no dependency on next-intl or src/messages, so
// the page still renders when translations are what failed).
const TEXT = {
  de: {
    overline: "Kurze Unterbrechung",
    title: "Diese Seite lässt gerade auf sich warten.",
    body: "Bei uns hat sich etwas verhakt. Versuchen Sie es bitte gleich noch einmal oder kommen Sie über die Startseite wieder herein.",
    phoneLead: "Lieber direkt sprechen? Wir sind telefonisch für Sie da:",
    retry: "Erneut versuchen",
    home: "Zur Startseite",
    contact: "Kontakt",
    nav: "Weiter zu",
  },
  en: {
    overline: "A brief interruption",
    title: "This page is taking a moment.",
    body: "Something got caught on our side. Please try again in a moment, or come back in through the home page.",
    phoneLead: "Would you rather talk to us? We are happy to take your call:",
    retry: "Try again",
    home: "Home page",
    contact: "Contact",
    nav: "Continue to",
  },
  fr: {
    overline: "Une courte interruption",
    title: "Cette page se fait un peu attendre.",
    body: "Un petit contretemps de notre côté. Réessayez dans un instant ou revenez par la page d’accueil.",
    phoneLead: "Vous préférez nous parler ? Nous sommes à votre écoute par téléphone :",
    retry: "Réessayer",
    home: "Page d’accueil",
    contact: "Contact",
    nav: "Continuer vers",
  },
  it: {
    overline: "Una breve interruzione",
    title: "Questa pagina si fa attendere.",
    body: "Qualcosa si è inceppato da parte nostra. Riprovi tra un momento oppure torni dalla pagina iniziale.",
    phoneLead: "Preferisce parlarci direttamente? Siamo a sua disposizione al telefono:",
    retry: "Riprova",
    home: "Pagina iniziale",
    contact: "Contatti",
    nav: "Prosegui verso",
  },
};

export default function Error({ error, retry, reset }) {
  const params = useParams();
  const locale = TEXT[params?.locale] ? params.locale : "de";
  const t = TEXT[locale];
  const headingRef = useRef(null);

  useEffect(() => {
    // Digest only: it matches the server log line, the message stays private.
    console.error(JSON.stringify({ src: "error-boundary", scope: "locale", digest: error?.digest || null }));
  }, [error]);

  useEffect(() => {
    // Move focus to the message so screen readers announce what happened.
    headingRef.current?.focus();
  }, []);

  const tryAgain = typeof retry === "function" ? retry : reset;
  const contactPath = ROUTES.kontakt[locale] || ROUTES.kontakt.de;

  return (
    <div className="bg-surface text-text">
      {/* React 19 hoists this into <head>: an error state must never be indexed. */}
      <meta name="robots" content="noindex" />
      <section className="mx-auto flex min-h-[70svh] max-w-2xl flex-col justify-center px-4 py-20 sm:px-6 md:py-28">
        <p className="text-overline uppercase text-text-accent">{t.overline}</p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          // Focus target for screen readers only (tabIndex -1, not a tab stop):
          // no ring. Inline, because the global :focus-visible rule is unlayered.
          style={{ outline: "none", boxShadow: "none" }}
          className="font-display text-display-m mt-4 text-balance outline-none"
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
            <Link
              href={`/${locale}`}
              className="text-ui inline-flex min-h-11 items-center underline decoration-line-strong underline-offset-4 hover:decoration-current"
            >
              {t.home}
            </Link>
            <Link
              href={`/${locale}${contactPath}`}
              className="text-ui inline-flex min-h-11 items-center underline decoration-line-strong underline-offset-4 hover:decoration-current"
            >
              {t.contact}
            </Link>
          </nav>
        </div>

        <p className="mt-10 border-t border-line pt-6 text-text-soft">
          {t.phoneLead}{" "}
          <a href={PHONE_HREF} className="whitespace-nowrap text-text underline underline-offset-4">
            {PHONE_DISPLAY}
          </a>
        </p>
      </section>
    </div>
  );
}
