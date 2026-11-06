// Druck – Bereich Personal (G-17, Konzept § 7). Schreibt: Team B-PER.
// Formate kommen aus Backend-Import (ph_personal/fixtures/print_format.json) und stehen im Fundament-Register
// druck/index.js. Hier nur die Zuordnung, wo welches Format angeboten wird. Zusagebrief bleibt ausgeblendet, bis
// die App ein vereinbartes Entgelt in der Vorlage kennt (Konzept § 5.6, A9). Vorschau als Sheet (DruckPanel).
// Reines Modul.

export const STELLE = "PH Stelle";
export const BEWERBUNG = "PH Bewerbung";
export const MITARBEITER = "PH Mitarbeiter";
export const ABWESENHEIT = "PH Abwesenheit";

export const STELLE_DRUCK = Object.freeze([{ id: "aushang", titel: "Stellenaushang", format: "PH Stelle Aushang" }]);
export const BEWERBUNG_DRUCK = Object.freeze([
  { id: "deckblatt", titel: "Bewerbungsblatt", format: "PH Bewerbung Deckblatt" },
  { id: "absage", titel: "Absagebrief", format: "PH Bewerbung Absage" },
]);
export const MITARBEITER_DRUCK = Object.freeze([{ id: "zeitnachweis", titel: "Zeitnachweis Monat", format: "PH Mitarbeiter Zeitnachweis" }]);
export const ABWESENHEIT_DRUCK = Object.freeze([{ id: "bestaetigung", titel: "Bestätigung", format: "PH Abwesenheit Bestaetigung" }]);

/** Ausgeblendet bis A9 (vereinbartes Entgelt in der Zusage). */
export const AUSGEBLENDET = Object.freeze(["PH Bewerbung Zusage"]);

/** Sammeldruck höchstens 50 (Konzept § 7). */
export const SAMMEL_MAX = 50;

const druck = { STELLE, BEWERBUNG, MITARBEITER, ABWESENHEIT, STELLE_DRUCK, BEWERBUNG_DRUCK, MITARBEITER_DRUCK, ABWESENHEIT_DRUCK, AUSGEBLENDET, SAMMEL_MAX };

export default druck;
