// Übergabe Sofaplaner → Beratungsanfrage (R5 ux P2-5). Gleicher Mechanismus
// wie der Küchenplaner (src/lib/kuechenplaner/handoff.js): Ziel-URL
// /<locale>/beratung?produkt=…&planer=sofaplaner, die ausführliche
// Zusammenfassung zusätzlich in sessionStorage unter HANDOFF_KEY.
//
// Neu gegenüber vorher: Der Plan geht nicht mehr verloren. Vor dem Wechsel
// erzeugt der Planer automatisch einen Teilen-Link (/de/sofaplaner?p=…), und
// der steht in ?produkt= – BeratungClient übernimmt ?produkt= als erste Zeile
// der Nachricht, das Studio öffnet den Plan also direkt aus der Anfrage.
// Kein Copy-&-Paste auf dem Handy mehr. Rein, ohne Pakete, node --test prüfbar.
import { HANDOFF_KEY } from "../kuechenplaner/handoff.js";
import { planTerminHref } from "../kuechenplaner/planTermin.js";
import { SOURCE_COPY } from "./consent.js";
import { sourceCopy } from "./copy/source.js";
import { dictFor } from "./copy/t.js";
import { CLIENT_KONFIG_MAX, konfigurationOf } from "../forms/planerFields.js";

// Sprachen-Welle FR/IT (01.11.2026): FR/IT-Texte aus dem geladenen Wörterbuch
// (HANDOFF in copy/ui-fr.js / ui-it.js, vorher loadDict(locale)); sonst wie bisher.
const intl = (locale) => (locale === "fr" || locale === "it" ? dictFor(locale)?.HANDOFF || null : null);

export { HANDOFF_KEY };
export const HANDOFF_PLANER = "sofaplaner";
/** BeratungClient kürzt ?produkt= auf 200 Zeichen (cleanText) – wir bleiben darunter. */
export const PRODUKT_MAX = 190;

const kurz = (t, max) => (t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t);

/** Standardname neuer Pläne (wie planFor in src/components/Labs/Sofaplaner/model.js). */
export const DEFAULT_PLAN_NAME = "Mein Sofa";

/**
 * Name für den Kurztext der Übergabe (UX-Benchmark P1-4): das Modell zuerst,
 * ein eigener Planname dahinter („Connery · Wohnzimmer“). Der Standardname
 * „Mein Sofa“ sagt dem Studio nichts und entfällt.
 */
export function handoffName(planName = "", familyName = "") {
  const own = String(planName || "").trim();
  const fam = String(familyName || "").trim();
  const custom = own && own !== DEFAULT_PLAN_NAME && own !== fam ? own : "";
  return [fam, custom].filter(Boolean).join(" · ") || own;
}

/** Kurztext für ?produkt=: „Sofa (Sofaplaner): Lounge, 4 Elemente · Plan: https://…“. */
// Welle 2 (EN): `locale` "en" → English short text ("Minotti sofa: …, 4 elements").
export function handoffProdukt({ name = "", count = 0, shareUrl = "", locale = "de" } = {}) {
  const en = locale === "en";
  const h = intl(locale);
  const produkt = en || h ? sourceCopy(locale).terminProdukt : SOURCE_COPY.terminProdukt;
  const word = h ? (count === 1 ? h.elements.one : h.elements.many) : en ? (count === 1 ? "element" : "elements") : "Elemente";
  const kopf = `${produkt}${name ? `${h?.colon ?? ": "}${String(name).trim()}` : ""}${count ? `, ${count} ${word}` : ""}`;
  if (!shareUrl) return kurz(kopf, PRODUKT_MAX);
  const link = ` · Plan: ${shareUrl}`;
  // Der Link wird nie abgeschnitten (sonst wäre er kaputt); gekürzt wird der Kopf.
  return kurz(kopf, Math.max(20, PRODUKT_MAX - link.length)) + link;
}

/** Ziel-URL der Übergabe. */
// The appointment form lives at /de/beratung and /en/consultation (src/utils/routing.js ROUTES.beratung).
// Rat 9,5 A12/B2 (T2): thema=sofa&planer=sofaplaner überall, Plan-Link zusätzlich
// als ?plan= (Vertrag in ../kuechenplaner/planTermin.js); bei aktivem Kalender
// (`calendar`, vom Server) /<locale>/termin?…&thema=wohnen&art=planung&plan=… .
// lead-mobil-i18n fix-01: /termin kürzt ?produkt= auf 120 Zeichen (termin/page.js,
// cleanText(…, 120)) – der Plan-Link am Ende wurde dort abgeschnitten und stand
// als halbe URL im Anliegen. Mit Kalender geht der Link deshalb nur als ?plan=
// (dort als Anhang „Plan“ ergänzt); ?produkt= bleibt der kurze Kopf.
export const TERMIN_PRODUKT_MAX = 120;
export function handoffHref({ locale = "de", name = "", count = 0, shareUrl = "", calendar = false } = {}) {
  const produkt = calendar ? kurz(handoffProdukt({ name, count, locale }), TERMIN_PRODUKT_MAX) : handoffProdukt({ name, count, shareUrl, locale });
  return planTerminHref({ locale, calendar, planer: HANDOFF_PLANER, produkt, plan: shareUrl });
}

/** Ausführlicher Text für sessionStorage und „Plantext kopieren“. */
export function handoffSummary({ text = "", shareUrl = "", locale = "de" } = {}) {
  const en = locale === "en";
  const h = intl(locale);
  const hatLink = shareUrl && String(text).includes(shareUrl);
  const head = h ? h.summaryHead : en ? "Sofa plan from the sofa planner" : "Sofaplanung aus dem Sofaplaner";
  const open = h ? h.openPlan : en ? "Open plan" : "Plan öffnen";
  return [head, String(text || "").trim(), shareUrl && !hatLink ? `${open}${h?.colon ?? ": "}${shareUrl}` : ""].filter(Boolean).join("\n");
}

/** Legt die Zusammenfassung für die Beratungsseite ab (Speicher kann gesperrt sein). */
// config (optional): der Plan (planSchema) für die Beratungsanfrage – nur an
// ph_crm als planer_konfiguration (src/lib/forms/planerFields.js), höchstens
// CLIENT_KONFIG_MAX groß, sonst bleibt es beim Link.
export function storeHandoff(storage, { text = "", shareUrl = "", locale = "de", config = null } = {}) {
  try {
    const cfg = config && typeof config === "object" ? konfigurationOf(config, CLIENT_KONFIG_MAX) : null;
    storage?.setItem(HANDOFF_KEY, JSON.stringify({ planer: HANDOFF_PLANER, text: handoffSummary({ text, shareUrl, locale }), url: shareUrl, at: Date.now(), ...(cfg ? { config: cfg } : {}) }));
    return true;
  } catch {
    return false;
  }
}

// lead-mobil-i18n fix-04: zwei freiwillige Angaben, die das Studio für das
// Gespräch braucht und die der Plan nicht enthält – Zeitrahmen und Lieferland.
// Keine Kontaktdaten: sie stehen nur im Plantext (Übergabe in sessionStorage,
// 30 min, und im Text der Anfrage, den die Beratungsseite mit ihrer Einwilligung
// sendet). Werte = Schlüssel; Text je Sprache, Rückfall Deutsch.
export const LEAD_ZEIT = Object.freeze([
  ["bald", "in den nächsten 3 Monaten", "within the next 3 months"],
  ["mittel", "in 3–6 Monaten", "in 3–6 months"],
  ["spaeter", "in mehr als 6 Monaten", "in more than 6 months"],
  ["offen", "noch offen", "not decided yet"],
]);
export const LEAD_LAND = Object.freeze([
  ["AT", "Österreich", "Austria"],
  ["DE", "Deutschland", "Germany"],
  ["CH", "Schweiz", "Switzerland"],
  ["FL", "Liechtenstein", "Liechtenstein"],
  ["X", "anderes Land", "another country"],
]);

/** Auswahl einer Liste in der Sprache: [[key, label], …]. */
export function leadOptions(list, locale = "de") {
  const h = intl(locale);
  const map = h ? (list === LEAD_ZEIT ? h.zeit : list === LEAD_LAND ? h.land : null) : null;
  return list.map(([k, de, en]) => [k, map?.[k] ?? (locale === "en" ? en : de)]);
}

/** Zusatzzeilen für den Plantext; unbekannte oder leere Werte fallen weg. */
export function leadLines({ zeit = "", land = "" } = {}, locale = "de") {
  const en = locale === "en";
  const h = intl(locale);
  const label = (list, k, map) => {
    const row = list.find((r) => r[0] === k);
    return row ? (map?.[k] ?? (en ? row[2] : row[1])) : "";
  };
  const z = label(LEAD_ZEIT, zeit, h?.zeit);
  const l = label(LEAD_LAND, land, h?.land);
  const zl = h ? h.timeframe : en ? "Timeframe" : "Zeitrahmen";
  const ll = h ? h.deliveryTo : en ? "Delivery to" : "Lieferung nach";
  const c = h?.colon ?? ": ";
  return [z && `${zl}${c}${z}`, l && `${ll}${c}${l}`].filter(Boolean);
}
