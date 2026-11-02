// Rat 9,5 B10 (ux 6): Projektanfrage Hotel & Objekt in zwei Stufen.
// Stufe 1 – vier Pflichtfelder: Name des Hauses, Vor- und Nachname, E-Mail,
// Vorhaben in einem Satz. Stufe 2 „Details ergänzen“ (freiwillig): Ort, Art
// des Hauses, Zimmer, Bereiche, Zeitfenster, Rolle, Firma, Telefon.
//
// Baut auf src/lib/hotel/inquiry.js auf (unverändert, nur gelesen): gleiche
// Feldprüfungen, gleicher Lead-Weg /api/beratung_anfrage (beratungSchema
// braucht vorname + nachname → der Name wird am letzten Leerzeichen geteilt
// und muss darum aus mindestens zwei Teilen bestehen). Leere freiwillige
// Angaben erscheinen nicht als leere Zeilen im Anfragetext.
// Texte der neuen Felder: QUICK_TEXT (DE/EN), Vorschlag für die Übernahme in
// Marktresearch/digital/features/rat95-t3-messages.json.
// Reines Modul (keine "@/..."-Importe): tests/unit/rat95-t3-formulare.test.mjs.
import { EMPTY_INQUIRY, buildInquiryPayload, validateField } from "../../lib/hotel/inquiry.js";

export const QUICK_TEXT = Object.freeze({
  de: {
    name: "Vor- und Nachname",
    vorhaben: "Ihr Vorhaben in einem Satz",
    vorhabenHint: "Zum Beispiel: Zimmer und Lobby neu einrichten, Umbau im Frühjahr.",
    details: "Details ergänzen",
    detailsHint: "Freiwillig: Ort, Art des Hauses, Zimmer, Bereiche und Zeitfenster helfen uns bei der Vorbereitung.",
    errors: {
      nameMissing: "Bitte geben Sie Ihren Vor- und Nachnamen an.",
      nameBoth: "Bitte geben Sie Vor- und Nachnamen an, zum Beispiel Anna Muster.",
      vorhaben: "Bitte beschreiben Sie Ihr Vorhaben in einem Satz (mindestens 10 Zeichen).",
    },
  },
  en: {
    name: "First and last name",
    vorhaben: "Your project in one sentence",
    vorhabenHint: "For example: refurnish rooms and lobby, renovation in spring.",
    details: "Add details",
    detailsHint: "Optional: location, type of property, rooms, areas and timing help us prepare.",
    errors: {
      nameMissing: "Please enter your first and last name.",
      nameBoth: "Please enter both first and last name, for example Anna Smith.",
      vorhaben: "Please describe your project in one sentence (at least 10 characters).",
    },
  },
  // Inhaber 01.11.2026: FR/IT-Fassung. FR-Typografie:   vor dem Doppelpunkt.
  fr: {
    name: "Prénom et nom",
    vorhaben: "Votre projet en une phrase",
    vorhabenHint: "Par exemple : réaménager chambres et lobby, travaux au printemps.",
    details: "Ajouter des précisions",
    detailsHint: "Facultatif : lieu, type d’établissement, chambres, espaces et calendrier nous aident à préparer l’échange.",
    errors: {
      nameMissing: "Veuillez indiquer vos prénom et nom.",
      nameBoth: "Veuillez indiquer le prénom et le nom, par exemple Anne Martin.",
      vorhaben: "Veuillez décrire votre projet en une phrase (au moins 10 caractères).",
    },
  },
  it: {
    name: "Nome e cognome",
    vorhaben: "Il vostro progetto in una frase",
    vorhabenHint: "Ad esempio: riarredare camere e lobby, ristrutturazione in primavera.",
    details: "Aggiungete dettagli",
    detailsHint: "Facoltativo: località, tipo di struttura, camere, ambienti e tempistica ci aiutano a prepararci.",
    errors: {
      nameMissing: "Indicate nome e cognome.",
      nameBoth: "Indicate sia il nome sia il cognome, ad esempio Anna Rossi.",
      vorhaben: "Descrivete il vostro progetto in una frase (almeno 10 caratteri).",
    },
  },
});

export const quickText = (locale) => QUICK_TEXT[locale] || QUICK_TEXT.de;

/** Pflichtfelder der ersten Stufe, in Fokus-Reihenfolge. */
export const QUICK_REQUIRED = Object.freeze(["haus", "name", "email", "nachricht"]);
/** Freiwillige Felder der zweiten Stufe, die geprüft werden (Format). */
export const QUICK_DETAILS = Object.freeze(["ort", "art", "zimmer", "zeitfenster", "telefon"]);
/** Reihenfolge für Zusammenfassung und Fokus. */
export const QUICK_ORDER = Object.freeze([...QUICK_REQUIRED, ...QUICK_DETAILS]);

export const EMPTY_QUICK = Object.freeze({ ...EMPTY_INQUIRY, name: "", bereiche: [] });

const trim = (v) => String(v ?? "").trim();
const known = (options, value) => (options || []).some((o) => o.value === value);

/** "Anna Maria Muster" → { vorname: "Anna Maria", nachname: "Muster" }; ein Teil → null. */
export function splitName(value) {
  const parts = trim(value).split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  return { vorname: parts.slice(0, -1).join(" "), nachname: parts[parts.length - 1] };
}

/**
 * Fehlertext eines Felds oder null.
 * @param {string} name
 * @param {object} data Formularwerte (EMPTY_QUICK)
 * @param {object} form copy.form aus src/lib/hotel/content.js
 * @param {object} text quickText(locale)
 */
export function validateQuickField(name, data, form, text) {
  const value = trim(data[name]);
  switch (name) {
    case "haus":
    case "email":
    case "zimmer":
    case "telefon":
      return validateField(name, data, form);
    case "name":
      if (!value) return text.errors.nameMissing;
      return splitName(value) ? null : text.errors.nameBoth;
    case "nachricht":
      return value.length < 10 ? text.errors.vorhaben : null;
    case "ort":
      return value && value.length < 2 ? form.errors.ort : null;
    case "art":
      return value && !known(form.art, value) ? form.errors.art : null;
    case "zeitfenster":
      return value && !known(form.zeitfenster, value) ? form.errors.zeitfenster : null;
    default:
      return null;
  }
}

/** Alle Fehler als { feld: text } (leer = gültig). */
export function validateQuick(data, form, text) {
  const errors = {};
  for (const name of QUICK_ORDER) {
    const message = validateQuickField(name, data, form, text);
    if (message) errors[name] = message;
  }
  return errors;
}

/** Hat die zweite Stufe einen Fehler? Dann klappt sie auf. */
export const detailsHaveError = (errors) => QUICK_DETAILS.some((k) => errors[k]);

/**
 * Payload für /api/beratung_anfrage: wie buildInquiryPayload, Name geteilt,
 * Zeilen ohne Wert („Ort: “, „Art: “, „Zeitfenster: “) entfernt.
 */
export function buildQuickPayload(data, form, labels) {
  const n = splitName(data.name) || { vorname: trim(data.name), nachname: "" };
  const payload = buildInquiryPayload({ ...data, ...n }, form, labels);
  const L = form.messageLabels;
  const empty = new Set([L.ort, L.art, L.zeitfenster].map((l) => `${l}:`));
  const [head, ...rest] = payload.bitte_beschreiben_sie_ihr_vorhaben.split("\n\n");
  const lines = head.split("\n").filter((line) => !empty.has(line.trim()));
  return { ...payload, bitte_beschreiben_sie_ihr_vorhaben: [lines.join("\n"), ...rest].join("\n\n") };
}

/** Schema-Feld (400 `field` der Route) → Formularfeld. */
export const QUICK_SERVER_FIELD = Object.freeze({ vorname: "name", nachname: "name", email: "email", telefon: "telefon" });
