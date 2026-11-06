// Regeln der PersonZelle (G-28, Team P0-5a) – ohne React, unit-getestet.
// Q-A12/Personal: bei fremden Abwesenheiten nur „abwesend“ – nie die Art (Krankheit, Urlaub …).

import { TEXTE } from "./texte.js";

/**
 * Anzeige einer Person.
 * @param {string|{name?:string, kuerzel?:string, material?:string, rolle?:string, email?:string,
 *   abwesend?: boolean|{art?:string, bis?:string}}|null} person
 * @param {{eigen?: boolean, rolle?: string}} [opt]  eigen = die angemeldete Person (darf die Art sehen)
 * @returns {{name:string, kuerzel?:string, material?:string, rolle:string|null, abwesend:boolean, abwesendText:string|null, leer:boolean}}
 */
export function personAnzeige(person, { eigen = false, rolle } = {}) {
  if (!person) return { name: TEXTE.person.niemand, rolle: null, abwesend: false, abwesendText: null, leer: true };
  const p = typeof person === "string" ? { name: person } : person;
  const name = String(p.name || p.email || p.kuerzel || "").trim() || TEXTE.person.unbekannt;
  const ab = p.abwesend;
  const abwesend = !!ab;
  let abwesendText = null;
  if (abwesend) {
    // Fremde Person: nur das Wort. Eigene Person: Art und Ende, wenn geliefert.
    if (eigen && typeof ab === "object") abwesendText = [ab.art, ab.bis ? `bis ${ab.bis}` : null].filter(Boolean).join(" · ") || TEXTE.person.abwesend;
    else abwesendText = TEXTE.person.abwesend;
  }
  return {
    name,
    kuerzel: p.kuerzel,
    material: p.material,
    rolle: (rolle ?? p.rolle) ? String(rolle ?? p.rolle) : null,
    abwesend,
    abwesendText,
    leer: false,
  };
}

/** Avatar-Größe auf 24 oder 32 normieren (G-28). */
export function personGroesse(g) {
  return Number(g) <= 24 ? 24 : 32;
}
