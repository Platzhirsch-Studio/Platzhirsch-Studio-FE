// Local texts of the team page (R5-fix P2, gesamtwerk P1-3). src/messages
// belongs to the i18n team; these lines override inhalt.team.notes/notesLink
// for the one person whose work is the Kern-USP (Inhaber-Entscheidung Nr. 8).
//  - HARALD_NOTE: the USP sentence, word for word from the confirmed owner
//    decision (hand drawing and model before 3D planning and rendering, time
//    on site). No role – his title is not confirmed (inhaber-offen A4).
//  - PROCESS_LINK: link to /<locale>/arbeitsweise, which now exists in all four
//    languages – no "(in German)" note any more.
// Pure module (node --test).

export const HARALD = "Harald Menghin";

export const HARALD_NOTE = {
  de: "Zeichnet Einrichtungen und Konzepte von Hand und baut Modelle, bevor wir in 3D planen und rendern. Dafür nimmt er sich Zeit bei Ihnen vor Ort.",
  en: "Draws interiors and concepts by hand and builds models before we plan and render in 3D. He takes his time for this, on site with you.",
  fr: "Dessine aménagements et concepts à la main et construit des maquettes avant que nous planifiions et réalisions le rendu en 3D. Il prend le temps pour cela, sur place chez vous.",
  it: "Disegna a mano arredi e concept e costruisce modelli prima che progettiamo e realizziamo il rendering in 3D. Per questo si prende tempo da voi, sul posto.",
};

export const PROCESS_LINK = { de: "Unsere Arbeitsweise", en: "How we work", fr: "Notre méthode", it: "Il nostro metodo" };

export const haraldNote = (locale) => HARALD_NOTE[locale] || HARALD_NOTE.de;
export const processLink = (locale) => PROCESS_LINK[locale] || PROCESS_LINK.de;

/**
 * Columns of the portrait grid for `n` portraits – never an empty column
 * (gesamtwerk P1-3: two portraits in a three-column grid left one empty).
 * @returns {2|3|4}
 */
export function portraitCols(n) {
  if (n <= 2) return 2;
  if (n === 4) return 4;
  return 3;
}

// Rat 9,5 (A5): the short lines of the Harald chapter are inhalt.team.harald.*
// in src/messages (übernommen 30.10.2026; the table HARALD_CHAPTER is gone).

/**
 * Rat 9,5 (A5): ONE card format for the whole grid. Photo cards only when
 * every active member has an own portrait; otherwise all as text cards (no
 * mix of photo and text cards, no initials tile).
 * @param {Array<{portrait: string|null}>} active withPortraits(team)
 * @returns {"photo"|"text"}
 */
export function cardFormat(active) {
  return Array.isArray(active) && active.length > 0 && active.every((m) => m?.portrait) ? "photo" : "text";
}
