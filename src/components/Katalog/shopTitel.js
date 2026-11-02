// src/components/Katalog/shopTitel.js
// Anzeige der Produktnamen im Shop (Kachel, Produktseite). Wie produktTitel.js
// (Maßangaben zusammenhalten) plus: ein freistehender Bindestrich als Trenner
// („Die klassische Kerze - Cabinet des miroirs“) darf nie am Zeilenanfang
// stehen – Optik-QA 01.11.2026: „… Kerze / - Cabinet des miroirs“ auf Telefon.
// Nur Leerzeichen werden geschützt; Name, Schreibweise und Zeichen bleiben.
// Rein, ohne "@/"-Importe (node --test).
import { produktTitel } from "./produktTitel.js";

const NBSP = " ";

/**
 * @param {string} name
 * @returns {string}
 */
export function shopTitel(name) {
  if (typeof name !== "string" || !name) return name;
  // Zusätzlich zu produktTitel: Gramm/Milliliter/Zentiliter bleiben an der Zahl („500 g“, „6,5 kg“, „960 ml“).
  // Optik-QA r3 (Zalto): „NO.25“ aus den Herstellerdaten als „No. 25“ (Nummer, Schreibweise wie im Fließtext).
  return klammerSchutz(packSchutz(trennerSchutz(halbgeviert(ohneVersalien(produktTitel(name.replace(/\bNO\.\s?(\d)/g, `No.${NBSP}$1`)))).replace(/(\d) (g|ml|cl|kg|cm|mm|l)(?=$|[\s,.;)·])/gu, `$1${NBSP}$2`))));
}

/**
 * Kurze Klammerzusätze bleiben beisammen (Optik-QA r3, Riedel: „Vorteilspack 8 Stück (8“ / „kaufen, 6 bezahlen)“):
 * Leerzeichen in Klammern bis 26 Zeichen werden geschützt – umbrochen wird dann VOR der Klammer.
 * @param {string} text
 */
export const klammerSchutz = (text) => (typeof text === "string" ? text.replace(/\(([^()]{1,26})\)/gu, (m, x) => `(${x.replace(/ /g, NBSP)})`) : text);

/**
 * Versal-Wörter aus den Herstellerdaten (Baobab: „Duftkerze SAND SILOLI“, „GESCHENKBOX-ZUBEHÖR
 * KERZENLÖSCHER …“, Ausführungen „CLASSIQUE“) in gemischter Schreibung anzeigen – Optik-QA r1:
 * neben Cire Trudon/Kähler wirkten sie laut. Nur Wörter aus ≥ 4 Großbuchstaben (auch Teile mit
 * Bindestrich); kurze Kürzel (LED, USB, MFB, XL) bleiben. Buchstaben und Reihenfolge unverändert.
 * @param {string} text
 * @returns {string}
 */
export function ohneVersalien(text) {
  if (typeof text !== "string" || !text) return text;
  return text
    .replace(/(?<!\p{L})(\p{Lu})(\p{Lu}{3,})(?![\p{L}@])/gu, (w, a, b) => (VERSAL_BLEIBT.has(w) ? w : a + b.toLocaleLowerCase("de")))
    .replace(/(?<![\p{L}\d])(\p{Lu})(\p{Lu}{2})(?![\p{L}\d@])/gu, (w, a, b) => (VERSAL_DREI.has(w) ? a + b.toLocaleLowerCase("de") : w))
    .replace(/(\p{Ll})(['’])(\p{Lu})(?!\p{L})/gu, (w, a, q, b) => a + q + b.toLocaleLowerCase("de"));
}
// Optik-QA r2 (Baobab): auch dreibuchstabige Versal-WÖRTER („Duftkerze SKI“, „FAR West“, „Calamity Jane THE
// Plains“) – nur diese bekannten Wörter, damit Kürzel (LED, USB, MFB, XXL) unangetastet bleiben. Dazu das
// Genitiv-S nach Apostroph („Eagle'S Pride“ → „Eagle's Pride“, Folge der Umwandlung von „EAGLE'S“).
const VERSAL_DREI = new Set(["SKI", "FAR", "THE", "AND", "NEW", "OLD", "BIG", "RED", "SUN", "SEA", "ICE", "AIR", "OUD"]);
// Eigene Schreibweise der Marke bzw. Kürzel: bleibt in Versalien (Riedel „FATTO A MANO BY RIEDEL“,
// „GRAPE@RIEDEL“, Cognac „VSOP“, Assouline „KITH“, „ALIPH“).
const VERSAL_BLEIBT = new Set(["RIEDEL", "GRAPE", "FATTO", "MANO", "VSOP", "KITH", "ALIPH"]);

const WJ = "\u2060"; // Wortverbinder (unsichtbar, ohne Glyphe): verhindert den Umbruch direkt danach

/** „2er-Karton“, „6er-Set“ nie als „2er-“ / „Karton“ trennen (Optik-QA r2). */
export const packSchutz = (text) => (typeof text === "string" ? text.replace(/(\d+er)-(?=\p{L})/gu, `$1-${WJ}`) : text);

/**
 * Kurze Hinweiszeilen (Preisquelle „Hersteller-Shop“): kein Umbruch am Bindestrich zwischen zwei Buchstaben –
 * Optik-QA r2: „Preis laut Hersteller-“ / „Shop Österreich“. Zeichen bleiben, nur ein Wortverbinder kommt dazu.
 * @param {string} text
 */
export const keinBindestrichUmbruch = (text) => (typeof text === "string" ? text.replace(/(\p{L})-(?=\p{L})/gu, `$1-${WJ}`) : text);

/**
 * Produktname in Haupttitel und Zusatz teilen („Die klassische Kerze - Cabinet des miroirs“ →
 * „Die klassische Kerze“ | „Cabinet des miroirs“). Optik-QA r2: der Halbgeviertstrich hing in H1 und Kacheln
 * am Zeilenende („Kerze –“); jetzt steht der Zusatz in einer eigenen Zeile, der Strich nur für Vorleser.
 * Ohne Trenner bleibt der Name ganz (zusatz = null). Beide Teile laufen durch shopTitel.
 * @param {string} name
 * @returns {{ haupt: string, zusatz: string|null }}
 */
export function titelTeile(name) {
  if (typeof name !== "string" || !name) return { haupt: name, zusatz: null };
  const m = /\s[-–—]\s/u.exec(name);
  if (!m || m.index < 2) return { haupt: shopTitel(name), zusatz: null };
  return { haupt: shopTitel(name.slice(0, m.index)), zusatz: shopTitel(name.slice(m.index + m[0].length)) };
}

/** Freistehender Bindestrich als Trenner („Kerze - Cabinet des miroirs“) → Halbgeviertstrich. */
export const halbgeviert = (text) => (typeof text === "string" ? text.replace(/ - /g, " – ") : text);

/**
 * Leerzeichen VOR einem freistehenden Trenner (-, –, —, ·) schützen: der Trenner bleibt am
 * Zeilenende statt eine Zeile zu eröffnen („Höhe 10 cm · 4 Dochte / · Gewicht 500 g“).
 * @param {string} text
 * @returns {string}
 */
export function trennerSchutz(text) {
  if (typeof text !== "string" || !text) return text;
  return text.replace(/ ([-–—·]) /gu, `${NBSP}$1 `);
}
