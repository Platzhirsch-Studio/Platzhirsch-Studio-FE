// src/lib/ezarri/werte.js – Sprach-Helfer ohne Texte (Welle 2, Englisch).
// Ohne Copy-Importe, damit Client-Komponenten (Karten, Filter) nur diese paar
// Zeilen laden; lang.js re-exportiert alles. Rein: Server, Client, node --test.

/** Sprache der Ezarri-Seite: "en", "fr", "it", sonst "de" (01.11.2026: fr/it für die Ezarri-Welt). */
export const ezLang = (locale) => (locale === "en" || locale === "fr" || locale === "it" ? locale : "de");

/**
 * Kurzer Sprach-Helfer für einzelne Wörter im Markup (Reihenfolge de, en, fr, it):
 * const t = ezT(locale); t("Termin anfragen", "Request an appointment", "Demander un rendez-vous", "Richiedere un appuntamento").
 * Fehlt fr/it, gilt der englische Text (nie Deutsch auf einer fremdsprachigen Seite).
 */
export const ezT = (locale) => {
  const l = ezLang(locale);
  if (l === "de") return (de) => de;
  if (l === "en") return (_de, en) => en;
  if (l === "fr") return (_de, en, fr) => fr ?? en;
  return (_de, en, _fr, it) => it ?? en;
};

// Datenwerte (deutsch erfasst) → Englisch. Unbekannte Werte bleiben stehen.
const WERTE_EN = Object.freeze({
  farbe: { Blau: "Blue", Grau: "Grey", Schwarz: "Black", "Weiß": "White", "Grün": "Green", Braun: "Brown", Rot: "Red", Gelb: "Yellow", Rosa: "Pink" },
  oberflaeche: { "glänzend": "gloss", matt: "matt", satiniert: "satin", phosphoreszierend: "glow-in-the-dark", "glänzend, matt": "gloss, matt" },
  gruppe: { Format: "Format", "Anti-Rutsch": "Slip-resistant", "Special Pieces": "Special pieces" },
  sprache: { englisch: "English", deutsch: "German" },
});
const WERTE_FR = Object.freeze({
  farbe: { Blau: "Bleu", Grau: "Gris", Schwarz: "Noir", "Weiß": "Blanc", "Grün": "Vert", Braun: "Brun", Rot: "Rouge", Gelb: "Jaune", Rosa: "Rose" },
  oberflaeche: { "glänzend": "brillant", matt: "mat", satiniert: "satiné", phosphoreszierend: "phosphorescent", "glänzend, matt": "brillant, mat" },
  gruppe: { Format: "Format", "Anti-Rutsch": "Antidérapant", "Special Pieces": "Pièces spéciales" },
  sprache: { englisch: "anglais", deutsch: "allemand" },
});
const WERTE_IT = Object.freeze({
  farbe: { Blau: "Blu", Grau: "Grigio", Schwarz: "Nero", "Weiß": "Bianco", "Grün": "Verde", Braun: "Marrone", Rot: "Rosso", Gelb: "Giallo", Rosa: "Rosa" },
  oberflaeche: { "glänzend": "lucido", matt: "opaco", satiniert: "satinato", phosphoreszierend: "fosforescente", "glänzend, matt": "lucido, opaco" },
  gruppe: { Format: "Formato", "Anti-Rutsch": "Antiscivolo", "Special Pieces": "Pezzi speciali" },
  sprache: { englisch: "inglese", deutsch: "tedesco" },
});
const WERTE = { en: WERTE_EN, fr: WERTE_FR, it: WERTE_IT };

/**
 * Datenwert in der Sprache der Seite.
 * @param {"farbe"|"oberflaeche"|"gruppe"|"sprache"} art
 * @param {string|null|undefined} value
 * @param {string} [locale]
 */
export function wert(art, value, locale = "de") {
  const l = ezLang(locale);
  if (value == null || l === "de") return value;
  return WERTE[l][art]?.[value] ?? value;
}

/** Zahl mit Dezimalzeichen der Sprache ("1,45" ↔ "1.45"). */
export function dezimal(value, locale = "de") {
  if (value == null) return value;
  const s = String(value);
  return ezLang(locale) === "en" ? s.replace(/(\d),(\d)/g, "$1.$2") : s;
}

// Werbe- und Superlativwörter (Design-Bibel: keine Superlative, auch nicht im Zitat).
const WERBUNG = /\b(most|best|finest|greatest|unique\w*|unrivalled|exclusive|luxur\w*|exquisite|perfect\w*|ultimate|leading|unbeatable|incomparable|stunning|amazing|spectacular|extremely|feast|treat|surprise|radiates|elegance|beauty|striking|superb|innovative|unbelievable|evocative|harmon\w*|sophisticated|infinite|commitment|relaxation|enjoyment)\b|[!?]/i;
// Spanische Reste (ezarri.com liefert einzelne Texte nur auf Spanisch).
const SPANISCH = /[áéíóúñ¿¡]|\b(y|las|los|una|crean|gran|texturas)\b/i;
// Ezarri-Texte wurden von ezarri.com/de erfasst; einzelne Sätze sind deutsch → auf Englisch weglassen.
const DEUTSCH = /[äöüßÄÖÜ]|\b(und|der|die|das|mit|für|einen|eine|von|ist|sind|Einfach|Kollektion)\b/;
// Nur Sätze mit Sachangaben bleiben (Kollektion, Einsatz, Format, Material, Verlegung).
const SACHE = /\b(collection|designed for|cladding|swimming pools?|format|anti-slip|recycled|glass|JointPoint|Joint Point|grout|epoxy|walls?|floors?|coverings?|phosphorescent|iridescent|metallic|marbled|satin)\b/i;

/**
 * Herstellertext für die englische Seite (text_ezarri / beschreibung_en, von
 * ezarri.com übernommen, Nutzung laut Inhaber-Entscheidung Nr. 7 erlaubt).
 * Bereinigt Erfassungsfehler (Leerzeichen, „M ix“, zusammengeklebte Sätze) und
 * behält nur englische Sachsätze ohne Werbewörter. Auf Deutsch: null (dort
 * eigene Texte, keine Herstellertexte).
 */
export function herstellerText(text, locale = "de") {
  if (ezLang(locale) !== "en" || !text) return null;
  const clean = String(text)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/\bM ix\b/g, "Mix")
    .replace(/\bZ en\b/g, "Zen")
    // Werbe-Nachsatz einiger Iridescent-Texte, der Rest des Satzes ist Sachangabe.
    .replace(/,? and promotes relaxation and enjoyment/g, "")
    .replace(/([.!?])(?=[A-Z0-9])/g, "$1 ")
    .trim();
  const saetze = clean
    .split(/(?<=[.!?])\s+/)
    .filter((x) => SACHE.test(x) && !WERBUNG.test(x) && !DEUTSCH.test(x) && !SPANISCH.test(x))
    .filter((v, i, a) => a.indexOf(v) === i);
  return saetze.join(" ").trim() || null;
}
