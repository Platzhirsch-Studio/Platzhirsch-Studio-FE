// Vorlieben je Benutzer (P0-8): Erscheinungsbild (System/Hell/Dunkel), Dichte (Automatisch/Kompakt/Komfortabel),
// Einzeltasten-Kürzel (an/aus, WCAG 2.1.4). Gespeichert im Sitzungs-Store unter v:<user-hash> (mit Redis
// geräteübergreifend und neustartfest), gespiegelt in Cookies, damit der Server <html> ohne Flackern setzen kann
// (Leitfaden preventing-flash-before-hydration), und – über vorliebenSkript() – in die localStorage-Schlüssel, die
// Segment.js (Dichte) und kuerzel/useKuerzel.js (Einzeltasten) heute schon lesen.
//
//   Server (Layout/Shell):  const v = await getVorlieben();  <html {...vorliebenHtmlAttribute(v)}>
//                           <script dangerouslySetInnerHTML={{ __html: vorliebenSkript(v) }} />
//   Client (Benutzermenü):  await vorliebeSpeichernAction({ theme: "dunkel" })   (vorlieben-aktion.js)
//
// Ein Backend-Feld für Vorlieben gibt es in ph_core nicht (Anfrage im Übergabeprotokoll P0-8); bis dahin ist
// der Store die Quelle. Reines Modul.

import { createHash } from "node:crypto";
import { sessionStore } from "./store.js";

export const VORLIEBEN_STANDARD = Object.freeze({ theme: "system", dichte: "auto", einzeltasten: true });
export const VORLIEBEN_WERTE = Object.freeze({
  theme: ["system", "hell", "dunkel"],
  dichte: ["auto", "kompakt", "komfortabel"],
  einzeltasten: [true, false],
});

/** Cookie-Namen (nicht HttpOnly: Segment.js schreibt ph_bo_dichte heute selbst per document.cookie). */
export const VORLIEBEN_COOKIES = Object.freeze({ theme: "ph_bo_theme", dichte: "ph_bo_dichte", einzeltasten: "ph_bo_einzeltasten" });
/** localStorage-Schlüssel der bestehenden Client-Schalter. */
export const VORLIEBEN_LOKAL = Object.freeze({ theme: "ph_bo_theme", dichte: "ph_bo_dichte", einzeltasten: "ph-bo:einzeltasten" });

export const VORLIEBEN_TTL_SEKUNDEN = 400 * 24 * 60 * 60;
export const vorliebenCookieOptionen = Object.freeze({ httpOnly: false, sameSite: "lax", path: "/", maxAge: VORLIEBEN_TTL_SEKUNDEN, secure: process.env.NODE_ENV === "production" });

/** Benutzer → kurzer Hash (Muster ph-bo:<user-hash>:…, MASTER G-27). Nie die E-Mail als Schlüssel. */
export function benutzerHash(user) {
  return createHash("sha256").update(`ph-bo:${String(user || "").trim().toLowerCase()}`).digest("hex").slice(0, 24);
}

function alsBool(w) {
  if (w === true || w === false) return w;
  if (w === "an" || w === "1" || w === "true") return true;
  if (w === "aus" || w === "0" || w === "false") return false;
  return undefined;
}

/** Nur bekannte Schlüssel mit gültigen Werten; Rest wird verworfen. */
export function bereinigeVorlieben(roh) {
  const aus = {};
  if (!roh || typeof roh !== "object") return aus;
  if (VORLIEBEN_WERTE.theme.includes(roh.theme)) aus.theme = roh.theme;
  if (VORLIEBEN_WERTE.dichte.includes(roh.dichte)) aus.dichte = roh.dichte;
  const e = alsBool(roh.einzeltasten);
  if (e !== undefined) aus.einzeltasten = e;
  return aus;
}

/** Vollständige Vorlieben (Standard + gültige Werte). */
export function normalisiereVorlieben(roh) {
  return { ...VORLIEBEN_STANDARD, ...bereinigeVorlieben(roh) };
}

/** true, wenn der Patch mindestens einen ungültigen Schlüssel/Wert enthält (für Fehlermeldungen). */
export function patchUngueltig(patch) {
  if (!patch || typeof patch !== "object") return true;
  const gueltig = bereinigeVorlieben(patch);
  return Object.keys(patch).length === 0 || Object.keys(patch).some((k) => !(k in gueltig));
}

/** Vorlieben aus Cookies (vor dem ersten Speichern, ohne Store-Eintrag). get = (name) => wert|undefined. */
export function vorliebenAusCookies(get) {
  const t = get(VORLIEBEN_COOKIES.theme);
  const d = get(VORLIEBEN_COOKIES.dichte);
  const e = get(VORLIEBEN_COOKIES.einzeltasten);
  return normalisiereVorlieben({ theme: t, dichte: d, einzeltasten: e });
}

/** Store-Eintrag eines Benutzers lesen; null = noch nichts gespeichert. */
export async function vorliebenLesen(user, { store = sessionStore() } = {}) {
  if (!user) return null;
  const roh = await store.wertLesen(`v:${benutzerHash(user)}`);
  return roh ? normalisiereVorlieben(roh) : null;
}

/** Patch übernehmen und speichern. @returns {Promise<typeof VORLIEBEN_STANDARD>} */
export async function vorliebenSpeichern(user, patch, { store = sessionStore(), basis } = {}) {
  if (!user) throw new TypeError("vorliebenSpeichern: Benutzer fehlt");
  const alt = (await vorliebenLesen(user, { store })) || normalisiereVorlieben(basis);
  const neu = { ...alt, ...bereinigeVorlieben(patch), geaendert: Date.now() };
  await store.wertSetzen(`v:${benutzerHash(user)}`, neu, { ttlSekunden: VORLIEBEN_TTL_SEKUNDEN });
  return normalisiereVorlieben(neu);
}

/** Attribute für <html> (globals.css: data-theme light|dark, data-dichte kompakt|komfortabel; „auto/system“ = ohne). */
export function vorliebenHtmlAttribute(v) {
  const n = normalisiereVorlieben(v);
  const a = {};
  if (n.theme === "hell") a["data-theme"] = "light";
  if (n.theme === "dunkel") a["data-theme"] = "dark";
  if (n.dichte !== "auto") a["data-dichte"] = n.dichte;
  return a;
}

/** Cookie-Werte (Strings) zu den Vorlieben. */
export function vorliebenCookieWerte(v) {
  const n = normalisiereVorlieben(v);
  return { [VORLIEBEN_COOKIES.theme]: n.theme, [VORLIEBEN_COOKIES.dichte]: n.dichte, [VORLIEBEN_COOKIES.einzeltasten]: n.einzeltasten ? "an" : "aus" };
}

/**
 * Inline-Skript für <head>: schreibt die Server-Vorlieben in localStorage (Segment.js/useKuerzel.js lesen dort)
 * und setzt die <html>-Attribute vor dem ersten Paint. Enthält nur Werte aus den festen Listen – kein Benutzertext.
 */
export function vorliebenSkript(v) {
  const n = normalisiereVorlieben(v);
  const L = VORLIEBEN_LOKAL;
  const theme = n.theme === "hell" ? "light" : n.theme === "dunkel" ? "dark" : "";
  const dichte = n.dichte === "auto" ? "" : n.dichte;
  return (
    "(function(){try{var h=document.documentElement,s=localStorage;" +
    `${theme ? `h.setAttribute("data-theme","${theme}");s.setItem("${L.theme}","${n.theme}");` : `h.removeAttribute("data-theme");s.removeItem("${L.theme}");`}` +
    `${dichte ? `h.setAttribute("data-dichte","${dichte}");s.setItem("${L.dichte}","${dichte}");` : `h.removeAttribute("data-dichte");s.removeItem("${L.dichte}");`}` +
    `${n.einzeltasten ? `s.removeItem("${L.einzeltasten}");` : `s.setItem("${L.einzeltasten}","aus");`}` +
    "}catch(e){}})()"
  );
}
