// src/lib/showroom/paths.js – Links aus dem Rundgang in der richtigen Sprache.
//
// hotspots.json speichert Pfade in der deutschen Form ("/produkte/…",
// "/ueber-uns/marken/…", "/beratung"). Die Website übersetzt diese Abschnitte
// je Sprache (src/utils/routing.js, src/proxy.js). Seiten, die es nur auf
// Deutsch gibt (Ezarri-Welt, Arbeitsweise, Regionalseiten), verlinken aus
// EN/FR/IT auf die deutsche Fassung statt auf eine 404.
import { ROUTES } from "../../utils/routing.js";

/** Deutsche Präfixe, die je Sprache übersetzt werden (längste zuerst). */
const TRANSLATED = ["marken", "karriere", "partner", "presse", "team", "platzhirsch", "produkte", "beratung", "kontakt", "merkliste", "news"]
  .map((key) => ({ de: ROUTES[key].de, key }))
  .sort((a, b) => b.de.length - a.de.length);

/** Seiten nur auf Deutsch (Stand 28.10.2026). */
export const DE_ONLY_PREFIXES = Object.freeze(["/ezarri", "/arbeitsweise", "/kuechen-vorarlberg", "/wohnzimmer-einrichten-vorarlberg", "/interior-design-vorarlberg", "/moebel-bodensee"]);

const startsWithSegment = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`);

/**
 * @param {string} path deutscher Pfad ohne Locale
 * @param {string} locale
 * @returns {{ href: string, locale?: string }} locale gesetzt = Link in diese Sprache erzwingen
 */
export function localizeShowroomHref(path, locale) {
  if (typeof path !== "string" || !path.startsWith("/")) return { href: path };
  if (DE_ONLY_PREFIXES.some((p) => startsWithSegment(path, p))) return locale === "de" ? { href: path } : { href: path, locale: "de" };
  for (const { de, key } of TRANSLATED) {
    if (startsWithSegment(path, de)) return { href: (ROUTES[key][locale] || de) + path.slice(de.length) };
  }
  return { href: path };
}
