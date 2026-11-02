// src/components/Landing/typoLanding.js – Umbruch-Helfer für Überschriften und
// Satzenden der Landing-Seiten (Optik-QA Küche/Bad/Outdoor, 01.11.2026).
// Pure, ohne "@/"-Imports (node --test: tests/unit/optik-kueche-bad-outdoor.test.mjs).
// Ändert nur Leerzeichen (→ geschützt), nie Wörter oder Bedeutung.

import { createElement } from "react";
import { hyphenateWord, softHyphenate, SHY } from "./silben.js";

const NBSP = " ";

/**
 * Ergänzungsstrich: „Hotel- und Gastroeinrichtung“ darf nicht als
 * „Hotel-“ / „und“ / „Gastroeinrichtung“ umbrechen – das Bindewort bleibt beim
 * Wortteil davor (geschütztes Leerzeichen nach dem Strich).
 * @param {string} text
 * @returns {string}
 */
export function bindSuspendedHyphen(text) {
  if (typeof text !== "string" || !text) return text;
  return text.replace(/(\p{L})- (und|oder|bis|sowie|bzw\.|and|or|et|ou|e|o)(?= )/gu, `$1-${NBSP}$2`);
}

/**
 * Abkürzung + Name bleiben zusammen (Optik-QA 01.11.2026): „für St. / Gallen“,
 * „über St. / Margrethen“ brachen auf den Ortsseiten zwischen „St.“ und dem
 * Ortsnamen um. Gilt für „St.“/„Hl.“ vor einem Großbuchstaben und für „z. B.“.
 * @param {string} text
 * @returns {string}
 */
export function bindAbbreviations(text) {
  if (typeof text !== "string" || !text) return text;
  return text.replace(/(^|[\s(„"])(St|Hl)\. (?=\p{Lu})/gu, `$1$2.${NBSP}`).replace(/\bz\. B\./gu, `z.${NBSP}B.`);
}

/**
 * Überschriften-Umbruch: Ergänzungsstrich und Abkürzungen gebunden; ein
 * Gedankenstrich bleibt am Wort davor (keine Zeile beginnt mit „– …“).
 */
export function bindHeading(text) {
  const t = bindAbbreviations(bindSuspendedHyphen(text));
  return typeof t === "string" ? t.replace(/ – /gu, `${NBSP}– `) : t;
}

/**
 * Teilt nach dem ersten Satz („Ihre Frage ist nicht dabei?“ | „Rufen Sie uns an:“).
 * Der Rest steht mit der Telefonnummer als eine Gruppe (inline-block) in der
 * zweiten Zeile, statt „an: <Nummer>“ allein umbrechen zu lassen.
 * @param {string} text
 * @returns {[string, string]} [erster Satz, Rest] – ohne Satzgrenze ["", text]
 */
export function splitFirstSentence(text) {
  if (typeof text !== "string") return ["", ""];
  const m = text.match(/^(.+?[.?!])\s+(.+)$/su);
  return m ? [m[1], m[2].trimEnd()] : ["", text.trimEnd()];
}

/** Bindewort hängt am Wort davor (geschütztes Leerzeichen), ohne Trennstellen. */
function bindHeadingWords(text) {
  const t = bindHeading(text);
  if (typeof t !== "string") return t;
  // QM R1: Bindewort hängt am Wort davor („Musterwohnung und“ / „Ausstattungslinien“ statt „und Ausstat-“).
  return t.replace(/(\S) (und|oder|&|and|or|et|ou|e|o)(?= )/gu, `$1${NBSP}$2`);
}

/**
 * Überschrift als reiner Text (Tests, aria-Texte): bindHeading + Bindewort am Wort
 * davor + weiche Trennstellen in allen langen Wörtern (silben.js).
 * @param {string} text
 * @returns {string}
 */
export function fitHeadingText(text) {
  const t = bindHeadingWords(text);
  return typeof t === "string" ? softHyphenate(t) : t;
}

// QM R3 (Küche/Bad/Outdoor, 02.11.2026): Trennen und Binden nur, wenn es nötig ist.
// Vorher trennten die Browser an jeder weichen Trennstelle, sobald ein Wort am
// Zeilenende stand – auch auf Desktop mit viel Platz („am Bo-/densee“, „Vor-/arlberg“,
// „Designer-/küchen“ in Firefox). Jetzt bekommt jedes lange Wort eine Klasse mit
// seiner geschätzten Breite in em: Die Trennstellen greifen nur, wenn die
// Überschriftenspalte (Container „fit“, gleiche Schriftgröße) schmaler ist als das
// Wort selbst – also wenn es sonst über den Rand liefe (Handy, Textzoom ×2).
// Gebundene Wortgruppen („Möbel und“, „St. Gallen“) stehen ebenso nur so lange in
// einer Zeile, wie sie in die Spalte passen; sonst bricht die Gruppe am Leerzeichen
// statt mitten im Wort („Möbel un/d“). Container-Query-em = Schriftgröße der
// Überschrift, wächst also mit Textzoom mit. Reines CSS, kein Layout-Sprung.
// Statische Klassen (Tailwind scannt Literale), Stufen von 0,5 em zwischen 3 und 20 em.
const HY_CLASS = [
  "hyphens-none @max-[3em]/fit:hyphens-manual",
  "hyphens-none @max-[3.5em]/fit:hyphens-manual",
  "hyphens-none @max-[4em]/fit:hyphens-manual",
  "hyphens-none @max-[4.5em]/fit:hyphens-manual",
  "hyphens-none @max-[5em]/fit:hyphens-manual",
  "hyphens-none @max-[5.5em]/fit:hyphens-manual",
  "hyphens-none @max-[6em]/fit:hyphens-manual",
  "hyphens-none @max-[6.5em]/fit:hyphens-manual",
  "hyphens-none @max-[7em]/fit:hyphens-manual",
  "hyphens-none @max-[7.5em]/fit:hyphens-manual",
  "hyphens-none @max-[8em]/fit:hyphens-manual",
  "hyphens-none @max-[8.5em]/fit:hyphens-manual",
  "hyphens-none @max-[9em]/fit:hyphens-manual",
  "hyphens-none @max-[9.5em]/fit:hyphens-manual",
  "hyphens-none @max-[10em]/fit:hyphens-manual",
  "hyphens-none @max-[10.5em]/fit:hyphens-manual",
  "hyphens-none @max-[11em]/fit:hyphens-manual",
  "hyphens-none @max-[11.5em]/fit:hyphens-manual",
  "hyphens-none @max-[12em]/fit:hyphens-manual",
  "hyphens-none @max-[12.5em]/fit:hyphens-manual",
  "hyphens-none @max-[13em]/fit:hyphens-manual",
  "hyphens-none @max-[13.5em]/fit:hyphens-manual",
  "hyphens-none @max-[14em]/fit:hyphens-manual",
  "hyphens-none @max-[14.5em]/fit:hyphens-manual",
  "hyphens-none @max-[15em]/fit:hyphens-manual",
  "hyphens-none @max-[15.5em]/fit:hyphens-manual",
  "hyphens-none @max-[16em]/fit:hyphens-manual",
  "hyphens-none @max-[16.5em]/fit:hyphens-manual",
  "hyphens-none @max-[17em]/fit:hyphens-manual",
  "hyphens-none @max-[17.5em]/fit:hyphens-manual",
  "hyphens-none @max-[18em]/fit:hyphens-manual",
  "hyphens-none @max-[18.5em]/fit:hyphens-manual",
  "hyphens-none @max-[19em]/fit:hyphens-manual",
  "hyphens-none @max-[19.5em]/fit:hyphens-manual",
  "hyphens-none @max-[20em]/fit:hyphens-manual",
];
const BIND_CLASS = [
  "whitespace-nowrap @max-[3em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[3.5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[4em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[4.5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[5.5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[6em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[6.5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[7em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[7.5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[8em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[8.5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[9em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[9.5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[10em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[10.5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[11em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[11.5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[12em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[12.5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[13em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[13.5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[14em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[14.5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[15em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[15.5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[16em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[16.5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[17em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[17.5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[18em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[18.5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[19em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[19.5em]/fit:whitespace-normal",
  "whitespace-nowrap @max-[20em]/fit:whitespace-normal",
];

const NARROW = new Set("iljtfr.,:;'’!|()-–".split(""));
const WIDE = new Set("mwMWÖÄÜOQGD".split(""));

/**
 * Geschätzte Breite eines Texts in em (Bodoni Moda / Instrument Sans, eher großzügig:
 * lieber einmal zu früh trennen als über den Rand laufen).
 * @param {string} s
 * @returns {number}
 */
export function estimateEm(s) {
  let w = 0;
  for (const ch of String(s).replaceAll(SHY, "")) {
    if (ch === " " || ch === NBSP) w += 0.28;
    else if (NARROW.has(ch)) w += 0.32;
    else if (WIDE.has(ch)) w += 0.84;
    else if (ch !== ch.toLowerCase()) w += 0.7;
    else if (/\d/.test(ch)) w += 0.56;
    else w += 0.54;
  }
  return w * 1.06;
}

/** Klassen-Stufe (0,5 em) für eine geschätzte Breite. */
function stufe(table, em) {
  const i = Math.min(table.length - 1, Math.max(0, Math.ceil(em * 2) - 6));
  return table[i];
}

/**
 * Zerlegt eine Überschrift in Textstücke und Wörter/Gruppen mit Umbruch-Klasse.
 * Pure (Tests): [{ text }] | [{ word, cls }] | [{ group: [...], cls }]
 * @param {string} text
 * @returns {Array<object>|string|undefined}
 */
export function fitParts(text) {
  const t = bindHeadingWords(text);
  if (typeof t !== "string") return t;
  const wordParts = (chunk) => {
    const out = [];
    let last = 0;
    for (const m of chunk.matchAll(/\p{L}+/gu)) {
      const hy = hyphenateWord(m[0]);
      if (hy === m[0]) continue;
      if (m.index > last) out.push({ text: chunk.slice(last, m.index) });
      out.push({ word: hy, cls: stufe(HY_CLASS, estimateEm(m[0])) });
      last = m.index + m[0].length;
    }
    if (last < chunk.length) out.push({ text: chunk.slice(last) });
    return out;
  };
  const parts = [];
  for (const piece of t.split(/( )/u)) {
    if (!piece) continue;
    if (piece === " " || !piece.includes(NBSP)) {
      parts.push(...wordParts(piece));
      continue;
    }
    // Gebundene Gruppe: normale Leerzeichen innen, Bindung per nowrap-Klasse.
    parts.push({ group: wordParts(piece.replaceAll(NBSP, " ")), cls: stufe(BIND_CLASS, estimateEm(piece)) });
  }
  // benachbarte Textstücke zusammenfassen
  return parts.reduce((acc, p) => {
    const prev = acc[acc.length - 1];
    if (p.text != null && prev && prev.text != null) prev.text += p.text;
    else acc.push({ ...p });
    return acc;
  }, []);
}

// QM R4: Der Gedankenstrich ist in der Display-Schrift (Bodoni) ein fast unsichtbarer
// Haarstrich – „Bad – das tägliche Ritual“ las sich wie „Bad    das …“. Er steht jetzt in der
// Grundschrift (leicht), sichtbar, aber nicht schwerer als die Buchstaben.
export const DASH_CLASS = "font-sans font-light";
function textMitStrich(text, key) {
  if (!text.includes("–")) return text;
  return text.split(/(–)/u).map((x, j) => (x === "–" ? createElement("span", { key: `${key}d${j}`, className: DASH_CLASS }, x) : x));
}

function render(parts, prefix) {
  return parts.flatMap((p, i) => {
    if (p.text != null) return textMitStrich(p.text, `${prefix}${i}`);
    if (p.word != null) return createElement("span", { key: `${prefix}${i}`, className: p.cls }, p.word);
    return createElement("span", { key: `${prefix}${i}`, className: p.cls }, ...render(p.group, `${prefix}${i}-`));
  });
}

/**
 * Überschrift für schmale Spalten und Textzoom (QM R1–R3, WCAG 1.4.4/1.4.10):
 * gebundene Ergänzungsstriche/Abkürzungen/Bindewörter und weiche Trennstellen –
 * beides wirkt nur, wenn die Spalte zu schmal ist (siehe oben). Ergebnis ist ein
 * Block-Span (Container „fit“) als einziges Kind der Überschrift.
 * @param {string} text
 * @returns {import("react").ReactNode}
 */
export function fitHeading(text) {
  const parts = fitParts(text);
  if (!Array.isArray(parts)) return parts;
  return createElement("span", { className: "block @container/fit" }, ...render(parts, "f"));
}

/**
 * QM R1 (Küche/Bad/Outdoor, 01.11.2026): H1 passt in jede Spalte –
 * - schmale Viewports / echter 200-%-Zoom am Handy (CSS-Viewport ~197 px): die
 *   Schrift wird höchstens 19 vw groß, lange Wörter trennen an weichen
 *   Trennstellen (fitHeading), nichts läuft mehr über den Rand;
 * - Telefon quer (Höhe ≤ 30 rem): Größe an die Höhe gebunden, breitere Zeile,
 *   damit Knopf und Telefonnummer im ersten Bildschirm stehen.
 * Wichtig (!) – text-display-l setzt die Größe ebenfalls.
 */
export const H1_FIT =
  "text-[length:min(var(--text-display-l),19vw)]! [@media(orientation:landscape)_and_(max-height:30rem)]:text-[length:min(var(--text-display-l),9vh)]! [@media(orientation:landscape)_and_(max-height:30rem)]:max-w-[30ch] md:max-w-[24ch]";

/**
 * QM R2: Weiche Trennstellen nur dort, wo sie gebraucht werden. Unter 48 rem (Handy,
 * echter Browser-Zoom) setzen die Überschriften laut globals.css hyphens: manual – die
 * Trennstellen aus fitHeading greifen; ab md ebenso (hyphens: manual ist Standard) –
 * die H1 bekommt dort eine breitere Zeile (H1_FIT md:max-w-[24ch]), damit im iPad-Hero
 * nicht „Vor-arlberg“ getrennt wird.
 * Passt ein Wort trotzdem nicht (reiner Textzoom), bricht overflow-wrap, statt in die
 * Nachbarspalte zu laufen. Klasse auf der Seitenwurzel.
 */
// QM R3: Seitenwurzel ist Container „page“ – mehrspaltige Raster fragen ihre Breite in rem ab
// (@min-[40rem]/page, @3xl/page = 48rem, @5xl/page = 64rem: dieselben Stufen wie sm/md/lg).
// Bei Textzoom ×2 wächst rem mit, die Raster brechen auf weniger Spalten um, statt Wörter
// mitten im Wort zu zerschneiden („Arbeitsdreiec/k“, „Kochendwasserh/ahn“, WCAG 1.4.4).
export const PAGE_HY = "@container/page md:wrap-break-word";

/**
 * QM R1: Pfeil bleibt am Textende, auch wenn der Link zweizeilig umbricht (als
 * inline-flex sprang er an den rechten Spaltenrand). Für LinkArrow-className.
 * QM R3: Abstand als Innenabstand statt über min-h-11 – ein zweizeiliger Link („Minotti
 * Studio by Platzhirsch / Home Living“) füllte die 44 px allein und klebte am nächsten Link.
 * Einzeilig bleibt die Fläche 44 px hoch (24 px Zeile + 2 × 10 px).
 */
export const ARROW_INLINE = "block! min-h-0! py-2.5 [&>span]:inline [&>svg]:ml-2 [&>svg]:inline-block [&>svg]:align-[-0.15em]";

/**
 * QM R3: E-Mail-Adresse mit Umbruchstellen nach „@“ und vor der Endung – bei Textzoom
 * brach sie sonst mitten im Wort („info@platzhirsch.st/udio“). Nur <wbr>, Text unverändert.
 * @param {string} email
 * @returns {import("react").ReactNode}
 */
export function mailText(email) {
  if (typeof email !== "string" || !email.includes("@")) return email;
  const [user, domain] = [email.slice(0, email.indexOf("@") + 1), email.slice(email.indexOf("@") + 1)];
  const dot = domain.lastIndexOf(".");
  const parts = dot > 0 ? [user, domain.slice(0, dot), domain.slice(dot)] : [user, domain];
  return parts.flatMap((p, i) => (i === 0 ? [p] : [createElement("wbr", { key: `w${i}` }), p]));
}
