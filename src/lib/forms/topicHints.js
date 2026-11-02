// src/lib/forms/topicHints.js – what the studio needs to qualify a request,
// per topic, as the hint under the free-text field of both inquiry paths:
//   /[locale]/termin   (BookingWizard, field "Ihr Anliegen")
//   /[locale]/beratung (BeratungClient, step 3 "Beschreiben Sie Ihr Projekt")
// Yacht team (anfrage-mobil-code, 31.10.2026): a boat owner coming from
// /yacht-interior got the generic hint "Raum, Zeitrahmen oder Stil". The
// studio needs boat type and length, berth or winter storage, existing boat
// or new build and the time frame (the page plans around the winter storage).
// Hints only – nothing is required, nothing is validated.
//
// `boardNote`: the calendar has no "on board" appointment type. A visit on
// board is booked as "Bei Ihnen vor Ort" with the harbour as the place
// ({vorOrt} = the card title of that type in the page language, copy.js).
//
// Pure, no "@/..." imports (node --test imports this file).

const YACHT = {
  de: {
    hint: "Zum Beispiel Bootstyp und Länge, Liegeplatz oder Winterlager, bestehendes Boot oder Neubau, gewünschter Zeitrahmen.",
    boardNote: "Besichtigung an Bord: Wählen Sie „{vorOrt}“ und tragen Sie Hafen oder Winterlager als Ort ein.",
  },
  en: {
    hint: "For example boat type and length, berth or winter storage, existing boat or new build, preferred time frame.",
    boardNote: "Visit on board: choose “{vorOrt}” and enter the harbour or winter storage as the place.",
  },
  fr: {
    hint: "Par exemple type et longueur du bateau, port ou hivernage, bateau existant ou construction neuve, délai souhaité.",
    boardNote: "Visite à bord : choisissez « {vorOrt} » et indiquez le port ou le lieu d’hivernage.",
  },
  it: {
    hint: "Ad esempio tipo e lunghezza della barca, ormeggio o rimessaggio invernale, barca esistente o nuova costruzione, tempi desiderati.",
    boardNote: "Visita a bordo: scegliete «{vorOrt}» e indicate il porto o il rimessaggio invernale.",
  },
};

export const TOPIC_HINTS = Object.freeze({ yacht: YACHT });

/** Topic text in `locale` (fallback de), or null for topics without own hints. */
export function topicHints(topic, locale = "de") {
  const t = TOPIC_HINTS[topic];
  if (!t) return null;
  return t[locale] || t.de;
}

/** Hint for the free-text field; `max` appends the length note of the field. */
export function anliegenHint(topic, locale = "de", max = null) {
  const t = topicHints(topic, locale);
  if (!t) return null;
  if (!max) return t.hint;
  const note = { de: `Höchstens ${max} Zeichen.`, en: `Up to ${max} characters.`, fr: `${max} caractères au maximum.`, it: `Al massimo ${max} caratteri.` };
  return `${t.hint} ${note[locale] || note.de}`;
}

/** "Besichtigung an Bord: …" with the vor-Ort card title filled in, or null. */
export function boardNote(topic, locale = "de", vorOrtTitle = "") {
  const t = topicHints(topic, locale);
  if (!t?.boardNote || !vorOrtTitle) return null;
  return t.boardNote.replace("{vorOrt}", vorOrtTitle);
}
