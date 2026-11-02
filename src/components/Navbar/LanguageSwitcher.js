"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "@/components/ui/icons";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import cx from "@/components/ui/cx";
import { isGermanOnlyPath, translatePathWith } from "./navMatch";

// Language switch without flags (Design-Bibel §10.1). Every option is a real
// link to the same page in that language (hreflang + lang), so it works
// without JS and crawlers can follow it. German-only pages (regions, Yacht,
// Ratgeber …) lead to the other language's home page instead of a 404.
// The query string (?marke=, ?q=) is kept on click.
// R6-shell-perf: those pages also SAY so – a short visible note above the
// list (labels.germanOnlyNote, from the server), so "English" landing on the
// English home page is expected, not a surprise. The links stay real links
// (no disabled controls, nothing removed from the tab order).
// Texts, the language list and the German-only segments come as props from
// the server (shellLabels.js, R4-shell-perf): no copy tables in the bundle.
const FALLBACK_LANGUAGES = [
  { code: "de", name: "Deutsch" },
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "it", name: "Italiano" },
];

function useLanguageLinks(languages = FALLBACK_LANGUAGES, germanOnly = []) {
  const locale = useLocale();
  const pathname = usePathname();
  return languages.map((lang) => {
    const path = translatePathWith(pathname, locale, lang.code, germanOnly);
    return { ...lang, href: `/${lang.code}${path === "/" ? "" : path}`, current: lang.code === locale };
  });
}

// R5 (recht P1-4, technik P2): the language choice is remembered ONLY when
// the visitor actively switches to another language – never on render, on a
// first visit or on a prefetch (contract for the privacy policy: "NEXT_LOCALE
// und preferredLocale werden nur gesetzt, wenn der Besucher aktiv die Sprache
// wechselt"). Same name, lifetime and flags as the former server cookie.
export function rememberLocale(code, doc = typeof document !== "undefined" ? document : null) {
  try {
    localStorage.setItem("preferredLocale", code);
  } catch {
    /* storage blocked */
  }
  if (!doc) return;
  const secure = doc.location?.protocol === "https:" ? "; Secure" : "";
  doc.cookie = `NEXT_LOCALE=${code}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`;
}

function followWithQuery(e, lang) {
  if (!lang.current) rememberLocale(lang.code);
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
  const query = window.location.search;
  if (query) {
    e.preventDefault();
    window.location.assign(lang.href + query);
  }
}

/** Visible note on German-only pages (null elsewhere). */
function useGermanOnlyNote(labels, germanOnly) {
  const pathname = usePathname();
  return labels?.germanOnlyNote && isGermanOnlyPath(pathname, germanOnly) ? labels.germanOnlyNote : null;
}

function LanguageLink({ lang, className }) {
  return (
    <a
      href={lang.href}
      hrefLang={lang.code}
      lang={lang.code}
      aria-current={lang.current ? "true" : undefined}
      onClick={(e) => followWithQuery(e, lang)}
      className={className}
    >
      {lang.name}
    </a>
  );
}

/**
 * Mobile menu / footer: the four languages side by side.
 * landmark={false} renders a labelled list instead of a <nav> (footer: the
 * page already has a language navigation, QA P3-9).
 */
export function LanguageList({ className, landmark = true, labels, germanOnly }) {
  const links = useLanguageLinks(labels?.languages, germanOnly);
  const note = useGermanOnlyNote(labels, germanOnly);
  const Wrapper = landmark ? "nav" : "div";
  return (
    <Wrapper aria-label={landmark ? labels?.label : undefined} className={className}>
      <ul aria-label={landmark ? undefined : labels?.label} className="flex flex-wrap gap-x-2">
        {links.map((lang) => (
          <li key={lang.code}>
            <LanguageLink
              lang={lang}
              className="inline-flex min-h-11 items-center px-2 text-ui text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current aria-[current=true]:decoration-current"
            />
          </li>
        ))}
      </ul>
      {note && <p className="mt-1 max-w-measure px-2 text-small text-text-soft">{note}</p>}
    </Wrapper>
  );
}

/** Header (desktop): "DE" button with a small list. */
export default function LanguageSwitcher({ labels, germanOnly }) {
  const links = useLanguageLinks(labels?.languages, germanOnly);
  const note = useGermanOnlyNote(labels, germanOnly);
  const current = links.find((l) => l.current) || links[0];
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="ph-language-list"
        // WCAG 2.5.3 (label in name): the name starts with the visible "DE"
        // (Lighthouse label-content-name-mismatch, R5-shell-seo AP8 check).
        aria-label={labels?.current ? `${current.code.toUpperCase()} – ${labels.current}` : undefined}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-ui text-text transition-colors duration-(--duration-micro) hover:text-text-soft 2xl:gap-1"
      >
        <span aria-hidden="true">{current.code.toUpperCase()}</span>
        <ChevronDown aria-hidden="true" className={cx("hidden size-4 transition-transform duration-(--duration-ui) ease-quiet motion-reduce:transition-none 2xl:block", open && "rotate-180")} strokeWidth={1.5} />
      </button>
      <ul
        id="ph-language-list"
        hidden={!open}
        className={cx(
          "absolute top-full right-0 z-10 mt-2 border border-line bg-surface py-2 shadow-overlay",
          // Motion shell-home: the list arrives (opacity + 4 px, 280 ms) when it leaves display:none; instant under reduced motion / Ruhige Ansicht.
          "transition-[opacity,translate] duration-(--duration-ui) ease-quiet starting:opacity-0 starting:-translate-y-1 motion-reduce:transition-none",
          note ? "w-64" : "min-w-40"
        )}
      >
        {note && (
          <li className="border-b border-line px-4 pt-1 pb-3 text-small text-text-soft">
            {note}
          </li>
        )}
        {links.map((lang) => (
          <li key={lang.code}>
            <LanguageLink
              lang={lang}
              className="flex min-h-11 items-center px-4 text-ui text-text transition-colors duration-(--duration-micro) hover:bg-surface-band aria-[current=true]:text-text-accent"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
