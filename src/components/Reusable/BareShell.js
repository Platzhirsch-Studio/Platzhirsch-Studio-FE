"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Wordmark } from "@/components/Brand";
import { useShellCopy } from "@/components/Navbar/shellCopy";

// Slim shell for single-task pages (today: /de/upload/<token>, R3-shell):
// one <header> with the wordmark and "Zurück zur Website", one <main id="main">.
// No menu, no site footer, no mobile CTA bar, no consent bar – nothing that loads
// without consent runs here, and nothing covers the page's own send button.
// Impressum and Datenschutz must be reachable on every page (§ 5 ECG), also
// on the bare 404 of /<locale>/upload without a token, so the shell renders a
// one-line legal footer. A page that brings its own legal nav inside <main>
// (Upload/UploadFrame) hides it via CSS (globals.css, :has()), so the links
// never appear twice.
//
// "Zurück" goes back in the history when the visitor came from this site,
// otherwise (QR code, link from an e-mail) to the home page; without JS it is
// a plain link to the home page.
const legalLink =
  "inline-flex min-h-11 items-center px-2 text-small text-text-soft underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:text-text hover:decoration-current";

export default function BareShell({ children }) {
  const c = useShellCopy();
  const t = useTranslations("Footer");

  const back = (event) => {
    try {
      const fromHere = document.referrer && new URL(document.referrer).origin === window.location.origin;
      if (fromHere && window.history.length > 1) {
        event.preventDefault();
        window.history.back();
      }
    } catch {
      /* malformed referrer: follow the link */
    }
  };

  return (
    <>
      {/* Skip link as the first focusable element, like the full shell (§14, R4 A11y rest). */}
      <a
        href="#main"
        className="sr-only z-(--z-overlay) bg-action px-4 py-3 text-ui text-paper focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {c("header.skip")}
      </a>
      <header data-shell="bare" className="border-b border-line bg-surface">
        <div className="mx-auto flex h-header max-w-page items-center justify-between gap-4 px-gutter">
          {/* Not a link: "Zurück" is the one way out (no duplicate target). */}
          <Wordmark className="block h-auto w-full max-w-[180px] min-w-0" />
          <Link
            href="/"
            onClick={back}
            className="-mr-2 inline-flex min-h-11 shrink-0 items-center gap-2 px-2 text-ui text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
          >
            <ArrowLeft aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
            {c("bare.back")}
          </Link>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="overflow-x-clip focus:shadow-none focus:outline-none">
        {children}
      </main>
      <footer data-shell-legal="" className="border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        <nav aria-label={c("footer.legal")} className="mx-auto max-w-page px-gutter py-2">
          <ul className="-ml-2 flex flex-wrap">
            <li>
              <Link href="/impressum" className={legalLink}>
                {t("imprint")}
              </Link>
            </li>
            <li>
              <Link href="/datenschutz" className={legalLink}>
                {t("privacy")}
              </Link>
            </li>
          </ul>
        </nav>
      </footer>
    </>
  );
}
