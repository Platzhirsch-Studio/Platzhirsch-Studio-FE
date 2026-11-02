"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import { cleanText, contextForPath, withContext } from "@/lib/forms/pathContext";

// Product pages (r8-leads, ux P1-3): the URL slug is an id, so the product
// name comes from the page's H1 – read as an external store (null on the
// server, the H1 text after hydration; a MutationObserver follows client-side
// route changes). Only the href changes, nothing moves (no CLS).
const noop = () => () => {};
function subscribeH1(callback) {
  const root = document.querySelector("main") || document.body;
  const observer = new MutationObserver(callback);
  observer.observe(root, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}
// Rat 9,5 A12: a page can name its product/brand exactly (data-termin-produkt).
const readH1 = () =>
  cleanText(document.querySelector("main [data-termin-produkt]")?.getAttribute("data-termin-produkt") || document.querySelector("main h1")?.textContent || "", 120) || null;
const serverNull = () => null;

/**
 * "Termin" in the header (r7-p1, ux P1-1): the link keeps the context of the
 * current page – /yacht-interior → /beratung?thema=yacht, city pages →
 * ?ort=<stadt>, tools → ?planer=…, product pages → ?produkt=<name> – so the
 * wizard starts with the matching topic. Tiny island: the label comes from
 * the server (shellLabels), the Button is server-safe.
 */
export function useTerminContext() {
  const pathname = usePathname();
  const ctx = contextForPath(pathname);
  const produkt = useSyncExternalStore(ctx.produktSeite ? subscribeH1 : noop, ctx.produktSeite ? readH1 : serverNull, serverNull);
  return produkt ? { ...ctx, produkt } : ctx;
}

export function useTerminHref(href) {
  return withContext(href, useTerminContext());
}

// prefetch={false} (R4 technik P2-5): /beratung is dynamic (private,
// no-store, ?thema=…), so the viewport prefetch of this header link started an
// uncached server render with a changing query on EVERY page view. The click
// still navigates client-side; the wizard loads on demand.
export default function HeaderCta({ href, label }) {
  const contextual = useTerminHref(href);
  return (
    <Button href={contextual} prefetch={false} variant="secondary" className="min-h-11! px-5! xl:max-[1440px]:in-data-[nav-start=long]:px-4!" data-header-cta="">
      {label}
    </Button>
  );
}

/**
 * Same context for any other "Termin anfragen" button outside the page
 * content, e.g. the band before the footer (r8-leads, ux P1-3). Interface for
 * the footer (Reusable/Footer.js, owned by the footer team):
 *   <TerminLink href={terminHref} variant="secondary" arrow>{label}</TerminLink>
 * Props are those of components/ui Button; `href` is the plain /beratung URL
 * of the locale; the context of the current page is added from usePathname()
 * (already in the server HTML).
 */
export function TerminLink({ href, children, ...buttonProps }) {
  const contextual = useTerminHref(href);
  return (
    <Button href={contextual} prefetch={false} {...buttonProps}>
      {children}
    </Button>
  );
}
