import { getRequestConfig } from 'next-intl/server';

export const routing = {
  locales: ['de', 'en', 'fr', 'it'],
  defaultLocale: 'de',
  localeDetection: false
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