// Kassa – dünne Wrapper je Page-/API-Methode (Team B-KAS, Konzept §16.3). Pfade an EINER Stelle; Aufruf im
// Frappe-Modus über client.method(pfad, args) (JSON-Argumente als Text, die Page erwartet `_json`), im Mock
// über mock.js mit denselben Argumenten. Der Client sendet NIE `trainings` an beleg_buchen (F3, Konzept §0.1):
// das Kennzeichen liest der Server aus PH Kasse.trainings_modus. Reines Modul.

import * as mock from "./mock.js";
import { P } from "./faehigkeiten.js";

export { P };
export const RKSV = "ph_kassa.rksv.api";
export const SHOP = "ph_shop.api.backoffice";
export const KK = "ph_kundenkarte.api";
export const CORE = "ph_core.api";

/** Name → voller Pfad im Frappe-Modus. */
export const PFADE = Object.freeze({
  kontext: `${P}.kontext`,
  suche_produkt: `${P}.suche_produkt`,
  suche_kunde: `${P}.suche_kunde`,
  kassen_katalog: `${P}.kassen_katalog`,
  schnelltasten: `${P}.schnelltasten`,
  code_erkennen: `${P}.code_erkennen`,
  gutschein_pruefen: `${P}.gutschein_pruefen`,
  beleg_vorschau: `${P}.beleg_vorschau`,
  beleg_buchen: `${P}.beleg_buchen`,
  letzter_beleg: `${P}.letzter_beleg`,
  belege_heute: `${P}.belege_heute`,
  beleg_mailen: `${P}.beleg_mailen`,
  beleg_drucken: `${P}.beleg_drucken`,
  storno: `${P}.storno`,
  nullbeleg: `${P}.nullbeleg`,
  trainingsmodus: `${P}.trainingsmodus`,
  retoure_vorbereiten: `${P}.retoure_vorbereiten`,
  kassenbuch_buchen: `${P}.kassenbuch_buchen`,
  lade_oeffnen: `${P}.lade_oeffnen`,
  abschluss_laden: `${P}.abschluss_laden`,
  abschluss_zaehlen: `${P}.abschluss_zaehlen`,
  abschluss_abschliessen: `${P}.abschluss_abschliessen`,
  terminal_start: `${P}.terminal_start`,
  terminal_status: `${P}.terminal_status`,
  terminal_abbruch: `${P}.terminal_abbruch`,
  terminal_simulieren: `${P}.terminal_simulieren`,
  kunde_anlegen: `${P}.kunde_anlegen`,
  leitung_freigabe_pruefen: `${P}.leitung_freigabe_pruefen`,
  beleg_daten: `${RKSV}.beleg_daten`,
  kassen_status: `${RKSV}.kassen_status`,
  karte_pruefen: `${KK}.lookup_card`,
});

/** Lesende Methoden – im Frappe-Modus per GET (mit Retry im Client). */
const LESEND = new Set(["kontext", "suche_produkt", "suche_kunde", "kassen_katalog", "schnelltasten", "code_erkennen", "gutschein_pruefen", "letzter_beleg", "belege_heute", "abschluss_laden", "terminal_status", "beleg_daten", "kassen_status"]);
/** Argumente, die die Page als JSON-Text erwartet. */
const JSON_ARGS = new Set(["positionen", "zahlarten", "zaehlprotokoll", "kundenkarte_vorteile", "freigabe", "empfaenger", "identitaet", "auswahl", "zustand"]);

/** Argumente für Frappe aufbereiten: JSON-Felder als Text, leere Werte weg, nie `trainings` an beleg_buchen. */
export function argumente(name, args = {}) {
  const out = {};
  for (const [k, v] of Object.entries(args)) {
    if (v === undefined || v === null || v === "") continue;
    if (k.startsWith("_")) continue; // Mock-Schalter (_simuliere) gehen nie an Frappe
    if (name === "beleg_buchen" && k === "trainings") continue;
    out[k] = JSON_ARGS.has(k) && typeof v !== "string" ? JSON.stringify(v) : v;
  }
  return out;
}

/**
 * Kassa-Methode aufrufen.
 * @param {any} client MockClient | FrappeClient (backoffice(session))
 * @param {keyof typeof PFADE} name
 * @param {object} [args]
 */
export async function rufe(client, name, args = {}) {
  if (!PFADE[name]) throw new TypeError(`Kassa-Methode unbekannt: ${name}`);
  if (client.modus !== "frappe") {
    mock.sicherstellen(client);
    const fn = mock.MOCK_METHODEN[name];
    if (!fn) throw new TypeError(`Kassa-Mock fehlt: ${name}`);
    const roh = { ...args };
    if (name === "beleg_buchen") delete roh.trainings;
    return JSON.parse(JSON.stringify(fn(client, roh) ?? null));
  }
  const a = argumente(name, args);
  return LESEND.has(name) ? client.methodGet(PFADE[name], a) : client.method(PFADE[name], a);
}
