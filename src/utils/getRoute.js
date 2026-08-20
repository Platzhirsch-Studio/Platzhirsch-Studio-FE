// src/utils/getRouteKey.js
import { ROUTE_MAP } from "./routeMap";

// Returns the key for the current route, or null if not found
export function getRouteKeyByPath(pathname, locale) {
  // Remove leading / and locale
  let segs = pathname.replace(/^\//, '').split('/');
  if (locale && segs[0] === locale) segs = segs.slice(1);

  const path = "/" + segs.join('/');
  return Object.keys(ROUTE_MAP).find(key =>
    ROUTE_MAP[key][locale] === `/${segs.join('/')}` ||
    ROUTE_MAP[key][locale] === path
  );
}
