// src/lib/service/winterlager/view.js – was die Seite /[locale]/outdoor-winterservice
// aus der Konfiguration zeigt. Regel aller Service-Teams: leerer Wert = Zeile
// wird NICHT gerendert, Preise „auf Anfrage“. Rein (node --test), keine "@/…".
import { WINTERLAGER_CONFIG, configText, hasValue, parseDeadline } from "./config.js";
import { STEP_KEYS, fill, winterlagerCopy } from "./copy.js";

/** Schritte des Ablaufs; Kleinreparatur/Aufbau nur, wenn der Inhaber sie bestätigt hat. */
export function visibleSteps(locale = "de", config = WINTERLAGER_CONFIG) {
  const c = winterlagerCopy(locale).steps.items;
  const deadline = parseDeadline(config.anmeldeschluss);
  return STEP_KEYS.filter((key) => {
    if (key === "reparatur") return config.kleinreparaturAufAnfrage === true;
    if (key === "aufbau") return config.aufbauAufWunsch === true;
    return true;
  }).map((key) => {
    const item = c[key];
    const extra = [];
    if (key === "anmeldung" && deadline) extra.push(fill(item.deadline, { date: formatDeadline(deadline, locale) }));
    if (key === "abholung" && hasValue(config.abholzeitraum, locale)) extra.push(fill(item.period, { period: configText(config.abholzeitraum, locale) }));
    if (key === "rueckgabe" && hasValue(config.rueckgabezeitraum, locale)) extra.push(fill(item.period, { period: configText(config.rueckgabezeitraum, locale) }));
    return { key, title: item.title, text: item.text, extra };
  });
}

/** „Auf einen Blick“: nur belegte Zeilen. */
export function factRows(locale = "de", config = WINTERLAGER_CONFIG) {
  const f = winterlagerCopy(locale).facts;
  const rows = [];
  if (config.abholungDurchUns === true) rows.push({ key: "abholung", label: f.abholung.label, value: f.abholung.value });
  if (hasValue(config.radiusKm)) rows.push({ key: "gebiet", label: f.gebietKm.label, value: fill(f.gebietKm.value, { km: config.radiusKm }) });
  else rows.push({ key: "gebiet", label: f.gebiet.label, value: f.gebiet.value });
  if (config.eigenesLager === true) rows.push({ key: "lager", label: f.lager.label, value: f.lager.value });
  rows.push({ key: "preis", label: f.preis.label, value: f.preis.value, hint: f.preis.hint });
  const deadline = parseDeadline(config.anmeldeschluss);
  if (deadline) rows.push({ key: "schluss", label: f.schluss.label, value: fill(f.schluss.value, { date: formatDeadline(deadline, locale) }) });
  return rows;
}

/** Konditionen je Variante (einmal/abo): Preis immer (Fallback „auf Anfrage“), Rest nur gesetzt. */
export function optionRows(variant, locale = "de", config = WINTERLAGER_CONFIG) {
  const o = winterlagerCopy(locale).options;
  const price = configText(config.preise?.[variant], locale);
  const rows = [{ key: "preis", label: o.price, value: price || o.onRequest }];
  if (variant === "abo") {
    if (hasValue(config.abo?.laufzeit, locale)) rows.push({ key: "laufzeit", label: o.laufzeit, value: configText(config.abo.laufzeit, locale) });
    if (hasValue(config.abo?.kuendigung, locale)) rows.push({ key: "kuendigung", label: o.kuendigung, value: configText(config.abo.kuendigung, locale) });
  }
  if (hasValue(config.versicherung, locale)) rows.push({ key: "versicherung", label: o.versicherung, value: configText(config.versicherung, locale) });
  return rows;
}

/** Link zu freigegebenen Abo-Bedingungen oder null. */
export function termsPath(config = WINTERLAGER_CONFIG) {
  const p = String(config.abo?.bedingungenPfad || "").trim();
  return /^\/[a-z0-9\-/]+$/.test(p) ? p : null;
}

const MONTHS = {
  de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

/** „15. November 2026“ / „15 November 2026“ (ohne Intl, gleich auf Server und Client). */
export function formatDeadline(d, locale = "de") {
  const m = (MONTHS[locale] || MONTHS.de)[d.mo - 1];
  return locale === "de" ? `${d.d}. ${m} ${d.y}` : `${d.d} ${m} ${d.y}`;
}

/**
 * Zustand des Anmeldeschlusses für einen Kalendertag (Ortszeit Lochau als
 * "JJJJ-MM-TT"). null = kein Stichtag gesetzt → kein Countdown.
 * @returns {null | { kind: "days"|"oneDay"|"today"|"over", n: number, text: string }}
 */
export function deadlineState(todayIso, locale = "de", config = WINTERLAGER_CONFIG) {
  const d = parseDeadline(config.anmeldeschluss);
  const t = parseDeadline(todayIso);
  if (!d || !t) return null;
  const n = Math.round((Date.UTC(d.y, d.mo - 1, d.d) - Date.UTC(t.y, t.mo - 1, t.d)) / 86_400_000);
  const c = winterlagerCopy(locale).countdown;
  const date = formatDeadline(d, locale);
  const kind = n > 1 ? "days" : n === 1 ? "oneDay" : n === 0 ? "today" : "over";
  return { kind, n, text: fill(c[kind], { n, date }) };
}

/** Heutiges Datum in Lochau (Europe/Vienna) als "JJJJ-MM-TT". */
export function todayInLochau(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return parts; // en-CA liefert JJJJ-MM-TT
}
