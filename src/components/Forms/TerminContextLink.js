"use client";

// Termin-Link mit Seitenkontext für den Footer (Runde 4, ux P1: Footer.js).
// Header (Navbar/HeaderCta.js) und Schluss-CTA hängen den Kontext der
// aktuellen Seite an (/yacht-interior → /beratung?thema=yacht, Produktseiten →
// ?produkt=…); der Footer ist eine Server-Komponente ohne Pfad und brauchte
// dafür diese kleine Insel. usePathname() steht schon im Server-HTML, der Link
// stimmt also ohne JS und verschiebt nichts (kein CLS).
//
// Kein Prefetch (technik P2): Next-Link mit prefetch={false}, und
// data-prefetched="1" hält auch den Hover-Prefetch von Reusable/LinkDelegate.js
// fern (er überspringt Links mit diesem Attribut).
//
// Runde 5 (ux P2-3): auf der Beratungsseite selbst zeigen Footer-Knopf und
// -Link nicht auf die eigene Seite (das verwarf ?ort=, ?thema= …), sondern
// springen zum Formular (#anfrage, beratung/page.js) – die URL samt Kontext bleibt.
import { usePathname } from "@/i18n/navigation";
import { useTerminHref } from "@/components/Navbar/HeaderCta";
import Button from "@/components/ui/Button";

export const FORM_ANCHOR = "#anfrage";

/** "/de/beratung" | "/beratung" → "/beratung" (path without locale and query). */
export const routePath = (href) => String(href || "").split(/[?#]/)[0].replace(/^\/(de|en|fr|it)(?=\/|$)/, "") || "/";

function useFooterTerminHref(href) {
  const pathname = usePathname() || "";
  const contextual = useTerminHref(href);
  return routePath(pathname) === routePath(href) ? FORM_ANCHOR : contextual;
}

/** Knopf (components/ui Button) mit Kontext. */
export function TerminContextButton({ href, children, ...buttonProps }) {
  const contextual = useFooterTerminHref(href);
  // "#anfrage" renders a plain <a> (SmartLink): no `prefetch` prop there.
  const prefetch = contextual === FORM_ANCHOR ? {} : { prefetch: false };
  return (
    <Button href={contextual} {...prefetch} data-prefetched="1" data-termin-link="" {...buttonProps}>
      {children}
    </Button>
  );
}

/**
 * Schlichter Listen-Link mit Kontext. `href` ist bereits mit Locale-Präfix
 * ("/de/beratung"), wie die übrigen Footer-Links (Navbar/navMatch localizeHref).
 */
export function TerminContextAnchor({ href, className, children }) {
  const contextual = useFooterTerminHref(href);
  return (
    <a href={contextual} className={className} data-prefetched="1" data-termin-link="">
      {children}
    </a>
  );
}
