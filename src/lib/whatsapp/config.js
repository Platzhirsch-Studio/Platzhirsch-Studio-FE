// src/lib/whatsapp/config.js – Konfiguration der WhatsApp-Beratung
// (Inhaber-Entscheidung Nr. 15, 29.10.2026; Konzept
// Marktresearch/digital/features/whatsapp-beratung.md, Teil B1).
//
// Nur Server-Variablen, kein NEXT_PUBLIC_ (node_modules/next/dist/docs/01-app/
// 02-guides/environment-variables.md: „By default, environment variables are
// only available on the server“). Gelesen wird die Variable beim Rendern der
// Seite: im Dev-Server bei jeder Anfrage, im Produktions-Build beim
// Vorrendern bzw. bei der Revalidierung der Seite (statische Seiten frieren
// den Wert also mit dem Build ein – Nummer setzen heißt: neu bauen/deployen).
//
//   WHATSAPP_NUMBER          E.164, z. B. +43557446255. Leer oder ungültig =
//                            KEIN WhatsApp-Einstieg auf der ganzen Seite.
//   WHATSAPP_REPLY_NOTE      optional, deutscher Satz zur Antwortzeit, nur wenn
//                            der Inhaber eine Zusage machen will. Leer = keine
//                            Aussage zur Antwortzeit (nichts erfinden).
//   WHATSAPP_REPLY_NOTE_EN / _FR / _IT   dieselbe Zusage in den anderen
//                            Sprachen; fehlt sie, steht dort keine Aussage.
//   WHATSAPP_PRIVACY_SECTION =1 bestätigt: Der von der Kanzlei freigegebene
//                            Abschnitt id="whatsapp" steht in der Daten-
//                            schutzerklärung (alle Sprachen). Ohne den Schalter
//                            zeigt der Produktions-Build KEINEN Einstieg, auch
//                            mit Nummer – der Hinweis verlinkt /datenschutz#whatsapp
//                            (Vorschlag Marktresearch/digital/features/
//                            whatsapp-dse-vorschlag.md). Deploy-Checkliste:
//                            platzhirsch-frappe-whatsapp/README.md 10.1.
//
// Rein, ohne "server-only" und ohne Pakete: node --test prüft es direkt.
// Client-Komponenten importieren nur DEV_TEST_NUMBER/parseNumber, nie
// whatsappConfig() (dort wäre process.env leer).

import { DSE_SECTIONS, dseApproved } from "../legal/dseSections.js";

/** E.164: „+“, Ländercode ohne führende 0, insgesamt 7–15 Ziffern. */
export const E164_RE = /^\+[1-9]\d{6,14}$/;

/** Höchstlänge der Antwortzeit-Notiz (eine Zeile im Hinweis). */
export const REPLY_NOTE_MAX = 160;

/**
 * Fiktive Testnummer der Dev-Vorschau (US-Bereich 555-01xx ist für Beispiele
 * reserviert). Nur im Dev-Server und nur mit ?whatsapp=test sichtbar; über
 * diesen Link wird nie eine echte Person erreicht.
 */
export const DEV_TEST_NUMBER = "+15555550100";

/**
 * Prüft eine Nummer. Leerzeichen, Bindestriche, Punkte, Schrägstriche und
 * Klammern werden toleriert (Eingabe im Deploy), das „+“ ist Pflicht.
 * @param {unknown} raw
 * @returns {{ e164: string, digits: string } | null}
 */
export function parseNumber(raw) {
  if (typeof raw !== "string") return null;
  const compact = raw.trim().replace(/[\s\-./()]/g, "");
  if (!E164_RE.test(compact)) return null;
  return { e164: compact, digits: compact.slice(1) };
}

function cleanNote(raw) {
  if (typeof raw !== "string") return null;
  const note = raw.replace(/\s+/g, " ").trim();
  if (!note || note.length > REPLY_NOTE_MAX) return null;
  return note;
}

/**
 * Antwortzeit-Notiz für eine Sprache, nur aus der Konfiguration.
 * DE: WHATSAPP_REPLY_NOTE (oder _DE); andere Sprachen nur mit eigener Variable.
 */
export function replyNoteFor(locale, env = process.env) {
  const key = String(locale || "de").toUpperCase();
  const own = cleanNote(env[`WHATSAPP_REPLY_NOTE_${key}`]);
  if (own) return own;
  return key === "DE" ? cleanNote(env.WHATSAPP_REPLY_NOTE) : null;
}

/**
 * Datenschutz-Abschnitt bestätigt: WHATSAPP_PRIVACY_SECTION=1 (Deploy-Schalter
 * des Inhabers) UND der Abschnitt #whatsapp ist im DSE-Register freigegeben,
 * steht also wirklich auf /datenschutz (Rat 9,5 B3: der Schalter allein
 * erzeugt keinen Abschnitt; src/lib/legal/dseSections.js).
 */
export function privacySectionReady(env = process.env, sections = DSE_SECTIONS) {
  return String(env.WHATSAPP_PRIVACY_SECTION || "").trim() === "1" && dseApproved("whatsapp", sections);
}

/**
 * Konfiguration aus der Umgebung: gültige Nummer UND bestätigter
 * Datenschutz-Abschnitt, sonst null.
 * @returns {{ digits: string, e164: string } | null} null = kein Einstieg
 */
export function whatsappConfig(env = process.env, sections = DSE_SECTIONS) {
  if (!privacySectionReady(env, sections)) return null;
  return parseNumber(env.WHATSAPP_NUMBER);
}

/** Dev-Vorschau (Testnummer per ?whatsapp=test) nur im Dev-Server. */
export function devPreviewAllowed(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv === "development";
}

/**
 * Props für einen Einstieg (Server-Seite): echte Nummer, Dev-Vorschau oder null.
 * Ohne Nummer im Produktions-Build → null: kein Element, kein wa.me im HTML.
 * @returns {{ digits: string|null, devPreview: boolean, replyNote: string|null } | null}
 */
export function entryProps(locale, env = process.env, nodeEnv = process.env.NODE_ENV) {
  const cfg = whatsappConfig(env);
  if (cfg) return { digits: cfg.digits, devPreview: false, replyNote: replyNoteFor(locale, env) };
  if (devPreviewAllowed(nodeEnv)) return { digits: null, devPreview: true, replyNote: replyNoteFor(locale, env) };
  return null;
}
