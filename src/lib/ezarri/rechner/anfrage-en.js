// src/lib/ezarri/rechner/anfrage-en.js – English labels and messages of the Ezarri request form (Welle 2).
//
// The option lists and validation messages live in the form contract
// src/app/api/ezarri/anfrage/schema.js (German, shared with the API and its
// tests). The English page shows the same values with these labels; what is
// sent stays the same (values, not labels).
//
// Pure: no imports. Server, client and node --test.

export const OPTION_EN = Object.freeze({
  arten: { muster: "Samples", beratung: "Advice", angebot: "Quote" },
  projektarten: { pool: "Pool", wellness: "Wellness, hot tub, sauna", bad: "Bathroom, shower", kueche: "Kitchen", fassade: "Façade, exterior wall", anderes: "Something else" },
  profile: { privat: "Private", architektur: "Architecture, interior design", bau: "Construction company", fachbetrieb: "Pool or tiling firm", hotel: "Hotel, hospitality" },
  laender: { AT: "Austria", DE: "Germany", CH: "Switzerland", LI: "Liechtenstein", IT: "Italy", andere: "other country" },
  zeitraeume: { "3m": "within the next 3 months", "6m": "in 3 to 6 months", "12m": "in 6 to 12 months", offen: "still open" },
  zubehoer: { kleber: "Adhesive (min. C2TE)", fuge: "Epoxy grout (RG)", werkzeug: "Tool kit according to Ezarri", corner: "Corner (edge pieces)", cove: "Cove (inside cove)" },
  einheit: { kg: "kg", Paket: "kit", lfm: "running m" },
});

// German message of schema.js MELDUNGEN → English (exact text match).
const MELDUNG_EN = Object.freeze({
  "Bitte wählen Sie, was Sie anfragen möchten.": "Please choose what you would like to request.",
  "Bitte geben Sie Ihren Namen an.": "Please enter your name.",
  "Bitte geben Sie eine E-Mail-Adresse oder eine Telefonnummer an.": "Please enter an e-mail address or a phone number.",
  "Diese E-Mail-Adresse sieht unvollständig aus, z. B. name@beispiel.at.": "This e-mail address looks incomplete, e.g. name@example.com.",
  "Bitte nur Ziffern, Leerzeichen und + ( ) - / verwenden.": "Please use only digits, spaces and + ( ) - /.",
  "Bitte bestätigen Sie, dass wir Sie zu Ihrer Anfrage kontaktieren dürfen.": "Please confirm that we may contact you about your request.",
  "Bitte eine Fläche zwischen 0,1 und 5000 m² angeben.": "Please enter an area between 0.1 and 5,000 m².",
  "Bitte eine Menge größer als 0 angeben oder das Häkchen entfernen.": "Please enter a quantity greater than 0 or untick the box.",
});

/** English label of an option (list key from OPTION_EN), else the German label. */
export function optionEn(list, value, fallback) {
  return OPTION_EN[list]?.[value] ?? fallback ?? value;
}

/** English validation message; unknown messages stay as they are. */
export function meldungEn(text) {
  if (!text) return text;
  return MELDUNG_EN[text] ?? text;
}

/** Field → message map in English. */
export function fehlerEn(fehler = {}) {
  return Object.fromEntries(Object.entries(fehler).map(([k, v]) => [k, meldungEn(v)]));
}
