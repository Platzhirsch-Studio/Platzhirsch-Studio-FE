"use client";
// Unterleiste der Ezarri-Welt (Konzept §2): Übersicht · Mosaike · … · Technik,
// ab xl rechts „Muster anfragen“ (secondary), darunter als letzter Punkt der
// Leiste (QM P2-7: auf dem iPad lag der Knopf über „Technik“). Unter xl eine
// horizontale Scroll-Leiste mit Scroll-Snap und weichem Rand rechts als
// Scroll-Hinweis (kein Hamburger im Hamburger); ab lg sticky unter dem Header.
// Insel nur wegen aria-current (usePathname), < 1 KB.
// Tempo (30.10.2026): Die Texte (NAV) kommen als Prop aus dem Server-Layout
// (src/app/[locale]/ezarri/layout.js). Vorher zog der Import von
// @/lib/ezarri/copy(.en) beide kompletten Text-Module (≈ 20 KB gzip) in das
// Client-Bundle jeder Ezarri-Seite.
import { useEffect, useRef, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";

const safeDecode = (p) => {
  try {
    return decodeURI(p);
  } catch {
    return p;
  }
};

const isActive = (pathname, item) =>
  item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

/** @param {{ nav: { label: string, items: Array<{ href: string, label: string, exact?: boolean }>, muster: { href: string, label: string } } }} props */
export default function LocalNav({ nav: NAV }) {
  // decodeURI: getestete Umgehungs-URLs (/en/%65zarri) und Umlaute im Pfad.
  const pathname = safeDecode(usePathname() || "");
  // QM r4 (1440 px, 200 % Text): ist die Leiste nach links weggescrollt (aktiver Punkt rechts), blendet
  // auch der linke Rand weich aus – vorher fehlten „Übersicht“, „Mosaike“ ohne jeden Hinweis.
  // Angeheftet (ab lg) nur, solange sie höchstens 8 % der Fensterhöhe belegt – bei großer Schrift
  // nahmen Kopf und Unterleiste zusammen 240 von 900 px weg.
  const navRef = useRef(null);
  const listRef = useRef(null);
  const [links, setLinks] = useState(false);
  const [klebt, setKlebt] = useState(true);
  useEffect(() => {
    const ul = listRef.current;
    const nav = navRef.current;
    if (!ul || !nav) return;
    const pruefen = () => {
      setLinks(ul.scrollLeft > 4);
      setKlebt(nav.offsetHeight <= window.innerHeight * 0.08);
    };
    pruefen();
    ul.addEventListener("scroll", pruefen, { passive: true });
    window.addEventListener("resize", pruefen);
    return () => {
      ul.removeEventListener("scroll", pruefen);
      window.removeEventListener("resize", pruefen);
    };
  }, []);
  return (
    <nav
      ref={navRef}
      aria-label={NAV.label}
      className={`border-b border-line bg-surface ${klebt ? "lg:sticky lg:top-(--header-h) lg:z-(--z-sticky) lg:[html:has(&)]:scroll-pt-[calc(var(--header-h)+4rem)]!" : ""}`}
    >
      <div className="mx-auto flex w-full max-w-page items-center gap-4 px-gutter">
        <ul
          ref={listRef}
          className={`-ml-3 flex min-w-0 flex-1 snap-x snap-mandatory gap-1 overflow-x-auto [scrollbar-width:none] pr-8 [&::-webkit-scrollbar]:hidden ${links ? "[mask-image:linear-gradient(to_right,transparent,black_2rem,black_calc(100%-2rem),transparent)]" : "[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]"}`}
        >
          {NAV.items.map((item) => {
            const active = isActive(pathname, item);
            return (
              <li key={item.href} className="shrink-0 snap-start">
                <Link
                  href={item.href}
                  {...item.linkProps}
                  aria-current={active ? "page" : undefined}
                  className={`relative inline-flex min-h-12 items-center px-3 text-ui transition-colors duration-(--duration-micro) ${
                    active ? "text-text after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-see" : "text-text-soft hover:text-text"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="shrink-0 snap-start xl:hidden">
            <Link href={NAV.muster.href} {...NAV.muster.linkProps} className="inline-flex min-h-12 items-center px-3 text-ui text-text underline underline-offset-4">
              {NAV.muster.label}
            </Link>
          </li>
        </ul>
        <Link
          href={NAV.muster.href}
          {...NAV.muster.linkProps}
          className="hidden min-h-11 shrink-0 items-center border border-ink px-4 text-ui text-text transition-colors duration-(--duration-micro) hover:bg-action hover:text-paper xl:inline-flex"
        >
          {NAV.muster.label}
        </Link>
      </div>
    </nav>
  );
}
