// src/lib/content/landingKern/links.js – Sprachfassungen der Linkziele für die
// Kern-Landingpages (Gruppe „landing-kern“: Outdoor, Küchen, Interior Design,
// Wohnzimmer, Leistungen) in EN/FR/IT.
//
// Quelle der Wahrheit ist die Redirect-Liste der Integration
// (src/lib/seo/deOnlyRedirects.cjs): Steht ein Segment dort, antwortet
// /en|fr|it/<segment> mit 308 auf /de. Ein Link auf so eine Seite führt deshalb
// direkt auf die deutsche (bzw. englische) Fassung und sagt das im Linktext –
// wie bei Hotel & Objekt („(en allemand)“). Sobald die Integration ein
// Segment aus der Liste nimmt, zeigen die Links und das hreflang automatisch
// auf die eigene Sprachfassung (keine zweite Liste, die veralten kann).
// Zusätzlich: Seiten, die der Proxy in EN/FR/IT bzw. FR/IT mit 404 beantwortet
// (src/proxy.js FOREIGN_GATED_404 / FR_IT_ONLY_404) – hier gespiegelt, weil
// der Proxy keine Liste exportiert.
//
// Rein (relative Importe, kein React): node --test lädt es.
import deOnly from "../../seo/deOnlyRedirects.cjs";

const ALL = Object.freeze(["de", "en", "fr", "it"]);

// Spiegel von src/proxy.js (Stand 01.11.2026, nach der Sprach-Integration:
// Pflege-Service und Architekten sind viersprachig). Bei Änderungen dort mitziehen.
const PROXY_LOCALES = Object.freeze({
  ratgeber: ["de"],
  upload: ["de"],
  portal: ["de"],
  // Winterservice gibt es nur in DE/EN (WINTERLAGER_LOCALES in
  // src/lib/service/winterlager/copy.js, FR/IT → notFound): Links von FR/IT-
  // Seiten führen auf /en/… mit Hinweis im Linktext (Outdoor-Küche, 02.11.2026).
  "outdoor-winterservice": ["de", "en"],
});

const firstSegment = (href) => String(href || "").replace(/^\//, "").split(/[/?#]/)[0];

/**
 * Sprachen, in denen die Seite zu `href` (ohne Locale, „/kuechenplaner“) eine
 * eigene Fassung hat.
 * @param {string} href
 * @returns {string[]}
 */
export function pageLocales(href) {
  const seg = firstSegment(href);
  if (!seg) return [...ALL];
  if (PROXY_LOCALES[seg]) return [...PROXY_LOCALES[seg]];
  // Ezarri-Werkzeuge Custom Mix und Anfrage: nur DE/EN (FR/IT → 308 auf /en).
  const ezTool = /^\/?ezarri\/([^/?#]+)/.exec(String(href || ""))?.[1];
  if (ezTool && (deOnly.FR_IT_TO_EN_EZARRI_TOOLS || []).includes(ezTool)) return ["de", "en"];
  if (deOnly.DE_ONLY_EXACT.includes(seg) || deOnly.DE_ONLY_TREE.includes(seg)) return ["de"];
  if (deOnly.FR_IT_ONLY_EXACT.includes(seg) || deOnly.FR_IT_ONLY_TREE.includes(seg)) return ["de", "en"];
  return [...ALL];
}

/** Hinweis im Linktext, wenn das Ziel in einer anderen Sprache ist. */
export const LANG_NOTE = Object.freeze({
  en: { de: "(in German)" },
  fr: { de: "(en allemand)", en: "(en anglais)" },
  it: { de: "(in tedesco)", en: "(in inglese)" },
});

/**
 * Ziel eines Links für die Seite in `locale`: eigene Fassung, sonst Englisch
 * (wenn es sie gibt und die Seite nicht deutsch ist), sonst Deutsch.
 * @returns {string|null} Sprache des Ziels, null = Sprache der Seite
 */
export function targetLocale(href, locale) {
  if (locale === "de" || /^(https?:|mailto:|tel:|#)/.test(String(href))) return null;
  const langs = pageLocales(href);
  if (langs.includes(locale)) return null;
  if (langs.includes("en")) return "en";
  return "de";
}

/**
 * Link {href, label} für eine EN/FR/IT-Seite: Ziel ohne eigene Fassung → mit
 * Sprachpräfix („/de/kuechenplaner“, SmartLink behält die Sprache) und
 * Sprachhinweis im Linktext. Auf Deutsch unverändert.
 * @param {{href: string, label: string}} link
 * @param {string} locale
 */
export function localeLink(link, locale) {
  if (!link?.href) return link;
  const target = targetLocale(link.href, locale);
  if (!target) return link;
  const note = LANG_NOTE[locale]?.[target];
  return { ...link, href: `/${target}${link.href}`, label: note ? `${link.label} ${note}` : link.label, lang: target };
}

/** true, wenn `path` in `locale` eine eigene Fassung hat. */
export const hasLocale = (path, locale) => pageLocales(path).includes(locale);
