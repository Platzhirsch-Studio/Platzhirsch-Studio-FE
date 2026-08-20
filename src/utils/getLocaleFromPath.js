export const SUPPORTED_LOCALES = ['de', 'en', 'fr', 'it'];
export const DEFAULT_LOCALE = 'de';


export function getLocaleFromPath(pathname) {
  // usePathname() can be null during the initial server render — without this
  // guard the .split() throws, which drops client components (e.g. the product
  // hero banner + its <h1>) out of the SSR HTML entirely.
  if (!pathname) return DEFAULT_LOCALE;
  const seg = pathname.split('/').filter(Boolean);
  if (SUPPORTED_LOCALES.includes(seg[0])) {
    return seg[0];
  }
  return DEFAULT_LOCALE;
}


