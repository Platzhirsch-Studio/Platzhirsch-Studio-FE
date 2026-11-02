// src/lib/news/withheldNews.js
// UWG-Sofortmaßnahme (Stand 26.10.2026): alte Rabatt-News werden nicht mehr
// beworben. Grundlage: Marktresearch/recht/03-uwg-werbe-audit.md, Fundstellen
// P1/P2 („bis zu 60 % reduziert“, „statt € 47.520,- um € 27.000,-“, ohne
// 30-Tage-Tiefstpreis nach § 9a PrAG / § 11 PAngV, seit 01/2025 online →
// Lockangebot-Risiko).
//
// Eine zurückgehaltene News
//   - erscheint in keiner Liste (News-Übersicht, „Weitere Beiträge“, Startseite),
//   - steht nicht in der Sitemap und zählt nicht für den lastmod des News-Hubs,
//   - bleibt unter ihrer URL erreichbar (keine 404 für alte Links), aber mit
//     robots noindex,follow und OHNE Preise/Rabatte: die Seite zeigt nur
//     „Diese Aktion ist beendet.“ (src/app/[locale]/news/[title]/page.js).
//
// Erkennung (eine Regel reicht):
//   1. Slug aus der Liste unten (generateSlug(name1), wie die Route matcht),
//   2. Titel-Muster + Veröffentlichungsmonat (falls der Titel im Backoffice
//      leicht geändert wird und damit der Slug wechselt),
//   3. Schutznetz: jeder Beitrag, der einen bezifferten Rabatt („60 %
//      reduziert“, „-30 % Rabatt“) oder einen Statt-Preis („statt € …“) in
//      irgendeinem Feld/irgendeiner Sprache enthält. So kann eine neue
//      Rabatt-News nicht unbemerkt indexiert werden. Freigabe erst, wenn der
//      Text den 30-Tage-Tiefstpreis nennt – dann den Slug in ALLOWED_SLUGS.
//
// Reine Logik: kein "server-only", läuft in Server- und Client-Komponenten,
// in der Sitemap und in node --test.

import { generateSlug } from "../slugify.js";

/** Ausdrücklich zurückgehaltene Beiträge (Audit P1, P2). */
export const WITHHELD_NEWS = Object.freeze([
  Object.freeze({
    slug: "platzhirsch-lagerabverkauf-kuechen-betten-und-sofas",
    title: /lagerabverkauf/i,
    month: "2025-01",
    reason: "UWG-Audit P1: „bis zu 60 % reduziert“, „statt € 47.520,- um € 27.000,-“, „statt € 43.911,-“ ohne 30-Tage-Tiefstpreis",
  }),
  Object.freeze({
    slug: "sortimentswechsel-stuehle-sessel-und-accessoires",
    title: /sortimentswechsel/i,
    month: "2025-01",
    reason: "UWG-Audit P2: „bis zu 60 % Rabatt“ ohne 30-Tage-Tiefstpreis",
  }),
  Object.freeze({
    slug: "sommer-inspiration-fuer-ihren-aussenbereich",
    title: /sommer-inspiration f(ü|ue)r ihren au(ß|ss)enbereich/i,
    month: null,
    reason: "QA Inhaltsseiten Runde 1: „Lagerverkauf … zu stark reduzierten Preisen“ ohne Bezugspreis (PAngV) und „Exklusivität“ – bis zur rechtlichen Prüfung zurückgehalten",
  }),
]);

/** Beiträge, die trotz Rabatt-Muster gezeigt werden dürfen (geprüft, mit Tiefstpreis). */
export const ALLOWED_SLUGS = Object.freeze([]);

const DISCOUNT_WORDS =
  "rabatt|reduziert|preisnachlass|sparen|discount|reduced|\\boff\\b|sconto|scontat|ridott|remise|réduit|reduit|réduction|reduction";
// "60 % reduziert", "-30% Rabatt", "Rabatt von 20 %", "up to 60% off", "fino al 60 % di sconto" …
const PERCENT_DISCOUNT = new RegExp(
  `(\\d{1,2}\\s?%[^.!?\\n]{0,40}?(?:${DISCOUNT_WORDS}))|((?:${DISCOUNT_WORDS})[^.!?\\n]{0,40}?\\d{1,2}\\s?%)`,
  "i"
);
// "statt € 47.520,-", "instead of € …", "au lieu de …€", "invece di € …"
const STRIKE_PRICE =
  /(statt|anstatt|instead of|au lieu de|invece di)\s*(?:(€|eur|chf)\s*\d|\d[\d.,']*\s*(€|eur|chf|,-))/i;

function textOf(item) {
  try {
    return JSON.stringify(item ?? "");
  } catch {
    return "";
  }
}

/** true, wenn der Beitrag einen bezifferten Rabatt oder Statt-Preis enthält. */
export function hasPriceAdvertising(item) {
  const text = textOf(item);
  return PERCENT_DISCOUNT.test(text) || STRIKE_PRICE.test(text);
}

/** Slug, unter dem die Route den Beitrag ausliefert. */
export function newsSlug(item) {
  return generateSlug(item?.name1);
}

/**
 * Soll der Beitrag aus Listen und Sitemap verschwinden und noindex bekommen?
 * @param {object} item  News-Datensatz aus fetchNewsData()
 */
export function isWithheldNews(item) {
  if (!item) return false;
  const slug = newsSlug(item);
  if (ALLOWED_SLUGS.includes(slug)) return false;
  const month = String(item.daten || item.date || "").slice(0, 7);
  const title = String(item.name1 || "");
  if (WITHHELD_NEWS.some((w) => w.slug === slug || (w.title.test(title) && (w.month == null || w.month === month)))) return true;
  return hasPriceAdvertising(item);
}

/** Aktive und nicht zurückgehaltene Beiträge – für jede öffentliche Liste. */
export function publicNews(items) {
  return (Array.isArray(items) ? items : []).filter((item) => item?.status === "Aktiv" && !isWithheldNews(item));
}
