import { ROUTES } from './routing';

export function getPathByLocale(routeKey, locale) {
  return `/${locale}/${ROUTES[routeKey][locale]}`;
}