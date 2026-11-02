import "./globals.css";
import Link from "next/link";
import NotFoundLocales from "@/components/NotFound/NotFoundLocales";
import { NotFoundBody } from "@/components/NotFound/NotFoundContent";
import { NF_BOOT_SCRIPT } from "@/components/NotFound/boot";
import { HOUSE_FONT_VARIABLES } from "@/components/Reusable/fonts";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import it from "@/messages/it.json";

// Global 404 for URLs outside /{locale}/… (e.g. /wp-login.php, /foo.html) and – in
// the production build – for every unknown path under a locale as well
// ([locale]/[...rest] has dynamicParams=false, so Next answers with this
// prerendered page). The root layout only passes children through, so this page
// brings its own <html>/<body>. Status stays 404.
//
// No cookies()/headers() here (R4-release): the root not-found is part of the
// render tree of EVERY page, so reading request data made the whole site
// dynamic (0 prerendered pages, release-check.md §3.1/§3.1a).
//
// R3 technik P2-4 (one 404 for all languages, content in the server HTML, lang
// per locale): the body carries the text in all four languages, each block with
// its own lang (NotFoundLocales). NF_BOOT_SCRIPT runs before the content is
// parsed and sets <html lang> and data-nf from the first path segment, CSS in
// globals.css then shows only that block (no JS: German, the default below).
// After hydration only the matching block stays in the DOM.
//
// Fonts (R6-shell-perf): Bodoni Moda + Instrument Sans from the shared font
// definitions file (Reusable/fonts.js) – the same self-hosted files as every
// page, set as CSS variables on <html>. Static: next/font needs no request data.
const LANGS = [
  { locale: "de", m: de.error404 },
  { locale: "en", m: en.error404 },
  { locale: "fr", m: fr.error404 },
  { locale: "it", m: it.error404 },
];
const MESSAGES = Object.fromEntries(LANGS.map(({ locale, m }) => [locale, m]));

export default function GlobalNotFound() {
  return (
    // lang/data-nf are set by NF_BOOT_SCRIPT before hydration
    <html lang="de" dir="ltr" className={HOUSE_FONT_VARIABLES} suppressHydrationWarning>
      <body className="bg-surface text-text">
        <script dangerouslySetInnerHTML={{ __html: NF_BOOT_SCRIPT }} />
        {/* Every language (where the language switch sits on every page): each
            link names its target in its own language. */}
        <header className="bg-surface text-text">
          <nav aria-label="Sprache – Language – Langue – Lingua" className="mx-auto w-full max-w-page px-gutter pt-4">
            <ul className="flex flex-wrap justify-end gap-x-6">
              {LANGS.map(({ locale, m }) => (
                <li key={locale} lang={locale} data-nf-lang={locale}>
                  <Link
                    href={`/${locale}`}
                    hrefLang={locale}
                    className="inline-flex min-h-11 items-center gap-2 text-ui text-text-soft underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:text-text hover:decoration-current"
                  >
                    <span className="sr-only">{m.headline} </span>
                    <span aria-hidden="true" className="text-overline uppercase">
                      {locale}
                    </span>
                    <span>{m.backHome}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main id="main">
          {/* Tempo & A11y (Konsolidierung): the four bodies are Server Components;
              the client island only picks one (NotFoundLocales). */}
          <NotFoundLocales blocks={Object.fromEntries(LANGS.map(({ locale }) => [locale, <NotFoundBody key={locale} locale={locale} m={MESSAGES[locale]} />]))} />
        </main>
      </body>
    </html>
  );
}
