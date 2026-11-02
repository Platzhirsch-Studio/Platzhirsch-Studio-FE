// src/lib/legal/dseFeatures.js – Release-Test „jede aktive Funktion mit
// Personendaten hat ihren Abschnitt in der Datenschutzerklärung“ (Rat 9,5 B3).
//
// Für jede Funktion: der Anker auf /<locale>/datenschutz und die Regel, ob sie
// in dieser Umgebung läuft (dieselben Schalter wie die Seiten selbst).
// tools/qa/prod-check.mjs (Schritt „dse“) holt das Produktions-HTML von
// /de/datenschutz und meldet jede aktive Funktion ohne Anker als Fehler.
// tests/unit/rat95-recht-dse.test.mjs prüft die Logik ohne Server.
//
// Nur relative Importe ohne "server-only": node --test und das Skript laden
// die Datei direkt.

import { terminActive } from "../booking/config.js";
import { whatsappConfig } from "../whatsapp/config.js";
import { einblickeOn } from "../einblicke/config.js";
import { ideenboardShareAvailable } from "../ideenboard/mode.js";
import { wunschlisteAvailable } from "../wunschliste/mode.js";
import { referralPagePublic } from "../kundenbetreuung/empfehlung.js";
import { tagebuchVerfuegbar } from "../portal/tagebuch/config.js";
import { DSE_SECTIONS } from "./dseSections.js";

const always = () => true;

/**
 * feature: Name im Bericht · anchor: id auf /datenschutz · active(env)
 * Bestehende, freigegebene Abschnitte stehen mit ihrem Anker dabei, damit ein
 * versehentlich entfernter Abschnitt ebenfalls auffällt.
 */
export const DSE_FEATURES = Object.freeze([
  // freigegeben (Inhaber-Entscheidung Nr. 11)
  { feature: "Kontakt-, Beratungs-, Produkt- und Ezarri-Anfrage", anchor: "anfragen", active: always },
  { feature: "Newsletter", anchor: "newsletter", active: always },
  { feature: "Cookies und Einwilligung", anchor: "cookies", active: always },
  { feature: "KI-Concierge", anchor: "ki-concierge", active: always },
  { feature: "Handy-Upload", anchor: "upload", active: always },
  { feature: "Kundenportal und 3D-Raum", anchor: "portal", active: always },
  { feature: "Online-Planer und Stil-Finder", anchor: "planer", active: always },
  { feature: "E-Mail-Versand", anchor: "mailversand", active: always },
  { feature: "Bewerbungen", anchor: "bewerbungen", active: always },
  // Ergänzungen (Rat 9,5 B4), Anker aus dem Register
  { feature: "Online-Termin und Videoberatung", section: "termin", active: (env) => terminActive(env) },
  { feature: "WhatsApp-Beratung", section: "whatsapp", active: (env) => whatsappConfig(env) !== null },
  { feature: "Besucher-Einblicke", section: "einblicke", active: (env) => einblickeOn(env.NEXT_PUBLIC_EINBLICKE, env.NODE_ENV) },
  { feature: "Ideenboard teilen", section: "ideenboard", active: (env) => ideenboardShareAvailable(env) },
  { feature: "Teilbare Wunschliste", section: "wunschliste", active: (env) => wunschlisteAvailable(env) },
  { feature: "Empfehlungsprogramm", section: "empfehlung", active: (env) => referralPagePublic(env) },
  { feature: "Projekt-Tagebuch im Portal", section: "tagebuch", active: (env) => tagebuchVerfuegbar({ verbunden: true }, env) },
  // ohne eigenen Schalter: die Formulare und die 3D-Ansicht sind immer erreichbar
  { feature: "Anfragen Hotel & Objekt, Architekten, Winterservice, Pflege", section: "serviceAnfragen", active: always },
  { feature: "3D- und AR-Ansicht (Scene Viewer, Quick Look)", section: "ar", active: always },
].map((f) => Object.freeze({ ...f, anchor: f.anchor || DSE_SECTIONS[f.section].anchor })));

/** Anker (id="…") aus einem HTML-Text. */
export function anchorsInHtml(html) {
  return new Set([...String(html || "").matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
}

/**
 * Aktive Funktionen ohne Abschnitt.
 * @param {object} env Umgebung des Produktions-Servers (NODE_ENV=production)
 * @param {Set<string>|string} anchors Anker der Datenschutzseite oder deren HTML
 * @returns {{ feature: string, anchor: string }[]}
 */
export function missingDseSections(env, anchors, features = DSE_FEATURES) {
  const ids = typeof anchors === "string" ? anchorsInHtml(anchors) : anchors;
  return features
    .filter((f) => {
      try {
        return f.active(env);
      } catch {
        return true; // im Zweifel als aktiv werten
      }
    })
    .filter((f) => !ids.has(f.anchor))
    .map(({ feature, anchor }) => ({ feature, anchor }));
}
