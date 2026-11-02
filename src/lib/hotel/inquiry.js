// src/lib/hotel/inquiry.js – Projektanfrage Hotel & Objekt.
//
// Nutzt den BESTEHENDEN Lead-Weg: /api/beratung_anfrage (beratungSchema,
// src/lib/forms/schemas.js) mit denselben Feldern wie der Beratungs-Wizard.
// Das Backoffice hat keine eigenen Felder für Haus, Zimmer oder Zeitfenster –
// sie stehen deshalb als feste Zeilen am Anfang des Freitextfelds, die erste
// Zeile ist das Thema "[Anfrage Hotel & Objekt]". Die Thema-Felder tragen die
// Wizard-Beschriftungen "objekt" (Schritt 1) und "hotel" (Schritt 2) in der
// Sprache der Seite (MultiStepForm.step1Options/step2Options), also genau,
// was eine Anfrage über /beratung?thema=hotel ergibt. Herkunft und lead_ref
// hängt postForm() an (pageContext "Seite: Hotel & Objekt").
//
// Reines Modul (keine "@/..."-Importe): tests/unit/hotel-objekt.test.mjs.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^[0-9+\-()\s]{6,20}$/;
export const MAX_ROOMS = 2000;
export const MAX_MESSAGE = 4000;

export const EMPTY_INQUIRY = Object.freeze({
  haus: "",
  ort: "",
  art: "",
  zimmer: "",
  bereiche: [],
  zeitfenster: "",
  rolle: "",
  vorname: "",
  nachname: "",
  firma: "",
  email: "",
  telefon: "",
  nachricht: "",
});

// Kontext der Anfrage (Inhaber-Zusatz 29.10.2026): "chalet" für Chalets und
// Ferienwohnungen (Eigentümer, Vermieter), sonst "hotel". Steht als eigene
// Themen-Zeile im Freitext und in der Herkunfts-Zeile "Kontext:".
export const CONTEXTS = Object.freeze(["hotel", "chalet"]);
/** "chalet" | "hotel" aus der gewählten Art des Hauses. */
export const inquiryContext = (data) => (String(data?.art ?? "").trim() === "chalet" ? "chalet" : "hotel");
/** Herkunfts-Kontext für postForm(): "Seite: Hotel & Objekt · Kontext: chalet". */
export const pageContextOf = (data, form) => `${form.pageContext} · Kontext: ${inquiryContext(data)}`;
/** Hash, der das Formular mit "Chalet" vorbelegt (Abschnitt Chalets & Ferienwohnungen). */
export const CHALET_HASH = "#anfrage-chalet";

/** Reihenfolge der geprüften Felder (Fehler-Zusammenfassung, Fokus). */
export const FIELD_ORDER = Object.freeze(["haus", "ort", "art", "zimmer", "zeitfenster", "vorname", "nachname", "email", "telefon"]);

const trim = (v) => String(v ?? "").trim();
const known = (options, value) => (options || []).some((o) => o.value === value);
const labelOf = (options, value) => (options || []).find((o) => o.value === value)?.label || "";

/**
 * Fehlertext eines Felds oder null. `form` = Texte aus content.js (copy.form).
 * @param {string} name
 * @param {object} data Formularwerte
 * @param {object} form copy.form
 */
export function validateField(name, data, form) {
  const e = form.errors;
  const value = trim(data[name]);
  switch (name) {
    case "haus":
      return value.length < 2 ? e.haus : null;
    case "ort":
      return value.length < 2 ? e.ort : null;
    case "art":
      return known(form.art, value) ? null : e.art;
    case "zimmer": {
      if (!value) return null;
      const n = Number(value);
      return Number.isInteger(n) && n >= 1 && n <= MAX_ROOMS ? null : e.zimmer;
    }
    case "zeitfenster":
      return known(form.zeitfenster, value) ? null : e.zeitfenster;
    case "vorname":
      return value ? null : e.vorname;
    case "nachname":
      return value ? null : e.nachname;
    case "email":
      if (!value) return e.emailMissing;
      return EMAIL_RE.test(value) ? null : e.email;
    case "telefon":
      return value && !PHONE_RE.test(value) ? e.telefon : null;
    default:
      return null;
  }
}

/** Alle Fehler als { feld: text }. */
export function validateInquiry(data, form) {
  const errors = {};
  for (const name of FIELD_ORDER) {
    const message = validateField(name, data, form);
    if (message) errors[name] = message;
  }
  return errors;
}

/**
 * Freitext ans Backoffice: Thema-Zeile, dann je Angabe eine Zeile
 * "Label: Wert" (deutsche Labels für das Backoffice, Werte in der Sprache
 * der Seite). Leere Angaben fallen weg.
 */
export function inquiryMessage(data, form) {
  const L = form.messageLabels;
  const bereiche = (Array.isArray(data.bereiche) ? data.bereiche : [])
    .filter((v) => known(form.bereiche, v))
    .map((v) => labelOf(form.bereiche, v));
  const ctx = inquiryContext(data);
  const lines = [
    (form.messageTitles && form.messageTitles[ctx]) || form.messageTitle,
    `${L.haus}: ${trim(data.haus)}`,
    `${L.ort}: ${trim(data.ort)}`,
    `${L.art}: ${labelOf(form.art, trim(data.art))}`,
    trim(data.zimmer) && `${L.zimmer}: ${trim(data.zimmer)}`,
    bereiche.length > 0 && `${L.bereiche}: ${bereiche.join(", ")}`,
    `${L.zeitfenster}: ${labelOf(form.zeitfenster, trim(data.zeitfenster))}`,
    known(form.rolle, trim(data.rolle)) && `${L.rolle}: ${labelOf(form.rolle, trim(data.rolle))}`,
    trim(data.firma) && `${L.firma}: ${trim(data.firma).slice(0, 200)}`,
  ].filter(Boolean);
  const note = trim(data.nachricht).slice(0, MAX_MESSAGE);
  return note ? `${lines.join("\n")}\n\n${L.nachricht}: ${note}` : lines.join("\n");
}

/**
 * Payload für /api/beratung_anfrage (Felder wie beratungSchema).
 * @param {object} data Formularwerte
 * @param {object} form copy.form
 * @param {{ topic: string, place: string }} labels Wizard-Beschriftungen (Schritt 1 "objekt", Schritt 2 "hotel")
 *   Kontext "chalet": Schritt 2 = form.placeChalet (Freitext, Sprache der Seite).
 */
export function buildInquiryPayload(data, form, labels) {
  const place = inquiryContext(data) === "chalet" && form.placeChalet ? form.placeChalet : labels.place;
  return {
    bei_meiner_anfrage_geht_es_um: labels.topic,
    das_projekt_soll_verwirklicht_werden: place,
    bitte_beschreiben_sie_ihr_vorhaben: inquiryMessage(data, form),
    vorname: trim(data.vorname),
    nachname: trim(data.nachname),
    email: trim(data.email),
    telefon: trim(data.telefon),
  };
}

/** Schema-Feld (400 `field` der Route) → Formularfeld. */
export const SERVER_FIELD = Object.freeze({ vorname: "vorname", nachname: "nachname", email: "email", telefon: "telefon" });
