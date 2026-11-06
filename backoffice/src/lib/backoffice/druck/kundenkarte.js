// Druck – Bereich Kundenkarte (G-17, Konzept § 6). Schreibt: Team B-KKA.
// Formate kommen aus Backend-Import (print_format.json) und stehen im Fundament-Register druck/index.js
// (DRUCKFORMATE „PH Kundenkarte“: Karte, Begrüßung; „PH Kundenkarte Stufe“: Vorteilsübersicht).
// Hier nur die Bereichs-Zuordnung: welche Formate wo angeboten werden und was „beides“ heißt. Reines Modul.

export const KARTE = "PH Kundenkarte";
export const STUFE = "PH Kundenkarte Stufe";

/** Druckmenü der Karten-Akte (Strg+P): Karte · Begrüßung · beides (ein PDF, zwei Dokumente). */
export const AKTE_DRUCK = Object.freeze([
  { id: "karte", titel: "Karte", format: "PH Kundenkarte Karte" },
  { id: "begruessung", titel: "Begrüßung", format: "PH Kundenkarte Begruessung" },
  { id: "beides", titel: "Karte + Begrüßung", formate: ["PH Kundenkarte Karte", "PH Kundenkarte Begruessung"] },
]);

/** Vorteilsübersicht je Stufe (Stufenplan „Übersicht drucken“). */
export const STUFE_DRUCK = Object.freeze([{ id: "vorteile", titel: "Vorteilsübersicht", format: "PH Kundenkarte Vorteilsuebersicht" }]);

/** Sammeldruck: höchstens 50 Karten auf einmal (Konzept § 4.4). */
export const SAMMEL_MAX = 50;

const druck = { KARTE, STUFE, AKTE_DRUCK, STUFE_DRUCK, SAMMEL_MAX };

export default druck;
