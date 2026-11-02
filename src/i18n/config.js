import { getRequestConfig } from 'next-intl/server';

export const routing = {
  locales: ['de', 'en', 'fr', 'it'],
  defaultLocale: 'de',
  localeDetection: false,
  // R5 (recht P1-4, technik P2): next-intl writes NO NEXT_LOCALE cookie –
  // not in the middleware (first visit, prefetch, cached pages) and not in
  // its Link/useRouter. Contract for the privacy policy: NEXT_LOCALE and
  // preferredLocale are only set when the visitor actively switches the
  // language (src/components/Navbar/LanguageSwitcher.js, rememberLocale).
  localeCookie: false
};


export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl v4: the locale comes from the [locale] segment via `requestLocale`
  // (a promise). The old `({ locale })` signature resolves to undefined in v4 and
  // triggers the ENVIRONMENT_FALLBACK warning during static rendering.
  const requested = await requestLocale;
  const locale = requested && routing.locales.includes(requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    // A global timeZone is required — without it next-intl logs
    // IntlError ENVIRONMENT_FALLBACK on every server render.
    timeZone: 'Europe/Vienna',
    messages: (await import(`../messages/${locale}.json`)).default
  };
});