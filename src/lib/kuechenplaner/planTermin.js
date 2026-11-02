// src/lib/kuechenplaner/planTermin.js
// Rat 9,5 B2 (T2, „Übergaben“): „Termin mit diesem Plan“ aus den Werkzeugen
// (Küchenplaner, Sofaplaner, Stil-Finder, Ezarri-Konfigurator) – ein Vertrag
// für alle, damit /termin und /beratung (T1, Empfang) nur EINE Form lesen:
//
//   /<locale>/termin?thema=<Termin-Thema>&planer=<werkzeug>&produkt=<Kurztext>&plan=<Plan-Link>
//   /<locale>/<beratung>?thema=<Beratungs-Thema>&planer=<werkzeug>&produkt=…&plan=<Plan-Link>
//
// - Ziel /termin nur bei aktivem Online-Kalender (ownCalendarActive() auf dem
//   Server, als `calendar` hereingereicht), sonst die Beratungsseite der
//   Sprache (Rat 9,5 B1: dasselbe Linkwort hat immer genau ein Ziel).
// - `plan` ist immer ein ABSOLUTER Link auf eine Werkzeugseite dieser Website
//   (planLink() prüft Herkunft und Pfad); fremde Ziele fallen weg.
// - `produkt` bleibt zusätzlich (heutiger Lesepfad von /beratung und /termin).
// - `ideenboard` = Teilen-ID des Boards (TOKEN_RE), siehe lib/ideenboard/config.js.
// Rein, ohne "@/..."-Importe (node --test tests/unit/rat95-t2-plan-termin.test.mjs).

export const PLAN_PARAM = "plan";
export const PLAN_MAX = 1800;

// Beratungsseite je Sprache (wie src/utils/routing.js ROUTES.beratung).
export const BERATUNG_PATHS = Object.freeze({ de: "/beratung", en: "/consultation", fr: "/conseil", it: "/consulenza" });

// Werkzeug → Thema auf /termin (src/lib/booking/types.js THEMEN) und auf
// /beratung (src/lib/forms/beratungContext.js TOPICS).
export const PLANER_THEMA = Object.freeze({
  kuechenplaner: { termin: "kueche", beratung: "kueche" },
  sofaplaner: { termin: "wohnen", beratung: "sofa" },
  "stil-finder": { termin: "wohnen", beratung: null },
  ezarri: { termin: "ezarri", beratung: "ezarri" },
  ideenboard: { termin: null, beratung: null },
});

// Erlaubte Plan-Ziele (Pfad ohne Herkunft): nur Werkzeugseiten mit Plan im Link.
const PLAN_PATH_RE = /^\/(?:de|en|fr|it)\/(?:kuechenplaner|sofaplaner|stil-finder(?:\/ergebnis\/[a-z0-9-]{1,60})?|ezarri\/konfigurator|ideenboard\/[A-Za-z0-9_-]{8,64})\/?$/;
const SITE_HOSTS = Object.freeze(["platzhirsch.studio", "www.platzhirsch.studio", "localhost", "127.0.0.1"]);

/**
 * Plan-Link prüfen: absolute http(s)-URL dieser Website auf eine Werkzeugseite,
 * ohne Zugangsdaten, höchstens PLAN_MAX Zeichen. Relative Pfade werden mit
 * `origin` ergänzt. Rückgabe: normalisierte URL oder null.
 */
export function planLink(raw, { origin = "https://platzhirsch.studio", hosts = SITE_HOSTS } = {}) {
  const text = String(raw ?? "").trim();
  if (!text || text.length > PLAN_MAX) return null;
  let u;
  try {
    u = new URL(text, origin);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password) return null;
  let originHost = "";
  try {
    originHost = new URL(origin).hostname;
  } catch {
    /* kein Ursprung */
  }
  if (!hosts.includes(u.hostname) && u.hostname !== originHost) return null;
  if (!PLAN_PATH_RE.test(u.pathname)) return null;
  u.hash = "";
  const out = u.toString();
  return out.length > PLAN_MAX ? null : out;
}

/** Ziel-Pfad „Termin“: /termin bei aktivem Kalender, sonst Beratung der Sprache. */
export function terminBase(locale = "de", calendar = false) {
  const l = BERATUNG_PATHS[locale] ? locale : "de";
  return calendar ? `/${l}/termin` : `/${l}${BERATUNG_PATHS[l]}`;
}

/**
 * planTerminHref({ locale, calendar, planer, plan, produkt, ideenboard, stil, origin })
 * → "/de/termin?thema=kueche&planer=kuechenplaner&produkt=…&plan=https%3A…"
 * Unbekannte oder ungültige Werte fallen weg (kein Freitext außer produkt,
 * den beide Empfänger mit cleanText kürzen).
 */
export function planTerminHref({ locale = "de", calendar = false, planer = "", plan = "", produkt = "", ideenboard = "", stil = "", origin } = {}) {
  // Reihenfolge: produkt zuerst (bisherige Links und Tests), dann Kontext.
  const q = new URLSearchParams();
  const text = String(produkt || "").replace(/\s+/g, " ").trim().slice(0, 190);
  if (text) q.set("produkt", text);
  const themen = PLANER_THEMA[planer];
  if (themen) q.set("planer", planer);
  const thema = themen ? (calendar ? themen.termin : themen.beratung) : null;
  if (thema) q.set("thema", thema);
  if (calendar && thema) q.set("art", "planung");
  if (stil && /^[a-z0-9][a-z0-9-]{0,58}$/.test(stil)) q.set("stil", stil);
  const link = planLink(plan, origin ? { origin } : undefined);
  if (link) q.set(PLAN_PARAM, link);
  if (ideenboard && /^[A-Za-z0-9_-]{32}$/.test(ideenboard)) q.set("ideenboard", ideenboard);
  const qs = q.toString();
  return `${terminBase(locale, calendar)}${qs ? `?${qs}` : ""}`;
}
