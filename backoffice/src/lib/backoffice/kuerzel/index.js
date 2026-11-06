// Kürzel-Register (G-02, K-31, MASTER § 3.5): setzt kuerzel/global.js und die Teildateien
// kuerzel/<bereich>.js zu EINEM Katalog zusammen. Bereiche schreiben nur in ihre eigene Teildatei.
// Browsertauglich (keine Server-Importe). Handler bindet der Hook useKuerzel(kontext, { id: fn }) über die ID –
// die Taste steht nur hier, damit Kürzel-Dialog, Kollisionstest und Bedienung dieselbe Quelle haben.

import { bereich as bereichDaten, zentraleSeite } from "../bereiche/index.js";
import { KONTEXTE, aufloesen as aufloesenKern, grundKontext, normalisiere, pruefeKuerzel } from "./kern.js";
import fundament, { G_ZIELE } from "./global.js";
import zentrale from "./zentrale.js";
import crm from "./crm.js";
import projekte from "./projekte.js";
import faktura from "./faktura.js";
import shop from "./shop.js";
import sortiment from "./sortiment.js";
import logistik from "./logistik.js";
import service from "./service.js";
import kundenkarte from "./kundenkarte.js";
import marketing from "./marketing.js";
import personal from "./personal.js";
import kassa from "./kassa.js";
import ablage from "./ablage.js";
import posteingang from "./posteingang.js";

export * from "./kern.js";
export { G_ZIELE };

/**
 * @typedef {{kontext:string, taste:string, id:string, titel:string, gruppe?:string, bereich?:string,
 *   inEingabe?:boolean, aussenwirkung?:boolean, nurDialog?:boolean}} KuerzelEintrag
 */

/** Teildateien je Bereich (Schlüssel = Bereichs-Slug). */
export const KUERZEL_BEREICHE = { zentrale, crm, projekte, faktura, shop, sortiment, logistik, service, kundenkarte, marketing, personal, kassa, ablage, posteingang };

/** Bereichseintrag → Kontext „<grund>@<bereich>“, Taste kanonisch. */
function bereichsEintrag(slug, k) {
  const kontext = k.kontext.includes("@") ? k.kontext : `${k.kontext}@${slug}`;
  return { ...k, kontext, bereich: slug };
}

/** Statischer Katalog: Fundament + alle Bereiche. */
export const KUERZEL = Object.freeze([...fundament, ...Object.entries(KUERZEL_BEREICHE).flatMap(([slug, liste]) => (liste || []).map((k) => bereichsEintrag(slug, k)))]);

const laufzeit = [];

/**
 * Laufzeit-Eintrag (G-02 `registriere(kontext, taste, {id, titel, wirkung, einzeltaste})`) – für Bausteine, deren
 * Kürzel erst im Client entstehen. Doppelbelegung im Kontext wirft (gleiches Verhalten wie der Unit-Test).
 * `einzeltaste` wird aus der Taste abgeleitet und nur geprüft.
 * @returns {() => void} Abmelden
 */
export function registriere(kontext, taste, def) {
  const eintrag = { kontext, taste: normalisiere(taste), id: def.id, titel: def.titel, ...(def.inEingabe === false ? { inEingabe: false } : {}) };
  const befunde = pruefeKuerzel([...katalog(), eintrag]);
  if (befunde.length) throw new Error(befunde.join("; "));
  laufzeit.push(eintrag);
  return () => {
    const i = laufzeit.indexOf(eintrag);
    if (i >= 0) laufzeit.splice(i, 1);
  };
}

/** Katalog inkl. Laufzeit-Einträge. */
export function katalog() {
  return [...KUERZEL, ...laufzeit];
}

/** Ereignis auflösen gegen den ganzen Katalog (siehe kern.aufloesen). */
export function aufloesen(e, kontexte, opts = {}) {
  return aufloesenKern(e, katalog(), { kontexte, ...opts });
}

/** Einträge eines Kontexts (mit Bereichs-Unterkontexten: kontexte("akte") enthält „akte@faktura“). */
export function eintraegeFuer(kontext) {
  return katalog().filter((k) => k.kontext === kontext || grundKontext(k.kontext) === kontext);
}

/** Titel eines Kontexts für den Kürzel-Dialog („Akte · Faktura“). */
export function kontextTitel(kontext) {
  const [grund, b] = String(kontext).split("@");
  const t = KONTEXTE[grund] || grund;
  return b ? `${t} · ${bereichDaten(b)?.titel || b}` : t;
}

/**
 * Gehe-zu-Ziele für eine Sitzung: nur Bereiche, die sie sieht, und Seiten, die es gibt (nie ein Ziel ins Leere).
 * Serialisierbar für Client-Komponenten.
 * @param {{bereiche?:string[]}} session
 * @returns {Array<{taste:string, id:string, titel:string, href:string}>}
 */
export function gZiele(session) {
  const sichtbar = new Set(session?.bereiche || []);
  const out = [];
  for (const g of G_ZIELE) {
    let href = null;
    if (g.ziel.bereich) href = sichtbar.has(g.ziel.bereich) ? bereichDaten(g.ziel.bereich)?.startseite || null : null;
    else if (g.ziel.seite) href = sichtbar.has("zentrale") ? zentraleSeite(g.ziel.seite) : null;
    if (href) out.push({ taste: `g ${g.buchstabe}`, id: `global.gehe-${g.buchstabe}`, titel: g.titel, href });
  }
  return out;
}

/** Konsistenz des gesamten Katalogs (Unit-Test). */
export function pruefeRegister() {
  const befunde = pruefeKuerzel(katalog());
  for (const [slug, liste] of Object.entries(KUERZEL_BEREICHE)) {
    for (const k of liste || []) if (!String(k.id || "").startsWith(`${slug}.`)) befunde.push(`Kürzel ${k.id}: ID ohne Präfix „${slug}.“`);
  }
  return befunde;
}
