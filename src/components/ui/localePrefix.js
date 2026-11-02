// src/components/ui/localePrefix.js – pure helper for ui/SmartLink (node --test:
// tests/unit/designsystem-foundations.test.mjs). No "@/" imports.

const LOCALE_PREFIX = /^\/(de|en|fr|it)(?=\/|$|[?#])/;

/**
 * A path that already names its language ("/en/hotel-objekt"): next-intl's
 * Link would prefix it again ("/fr/en/hotel-objekt"). Split it into
 * { href: "/hotel-objekt", locale: "en" } – Link then builds /en/… itself
 * (Designsystem 01.11.2026, nav links FR/IT → /en/hotel-objekt without 307).
 * Same contract as Navbar/navMatch localizeHref (already prefixed = keep).
 * @returns {{ href: string, locale: string } | null}
 */
export function splitLocalePrefix(href) {
  if (typeof href !== "string") return null;
  const m = href.match(LOCALE_PREFIX);
  if (!m) return null;
  const rest = href.slice(m[0].length);
  return { href: rest.startsWith("/") ? rest : `/${rest}`, locale: m[1] };
}
