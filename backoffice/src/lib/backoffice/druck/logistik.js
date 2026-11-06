// Druck – Bereich Logistik (10-konzept-logistik § 9). Schreibt: Team B-LOG.
// Die Druckformate selbst stehen im Fundament-Register (druck/index.js, exakt aus den App-Fixtures); hier nur,
// wo der Bereich welches Format anbietet (Akte, Masse, Packtisch) und die Papiervorgaben der Etiketten.
// Reines Datenmodul.

export const LOGISTIK_DRUCK = Object.freeze({
  lieferschein: { doctype: "PH Lieferschein", format: "PH Lieferschein Standard", titel: "Lieferschein", wo: ["akte", "masse", "packtisch", "montage"] },
  packliste: { doctype: "PH Lieferschein", format: "PH Lieferschein Packliste", titel: "Packliste", wo: ["akte", "masse", "packtisch"] },
  retourenschein: { doctype: "PH Sendung", format: "PH Sendung Retourenschein", titel: "Retourenschein", wo: ["akte"] },
  tourenblatt: { doctype: "PH Tour", format: "PH Tour Tourenblatt", titel: "Tourenblatt", wo: ["akte", "masse"] },
  spedition: { doctype: "PH Speditionsauftrag", format: "PH Speditionsauftrag Standard", titel: "Speditionsauftrag", wo: ["akte"] },
  ruecknahme: { doctype: "PH Warenruecknahme", format: "PH Warenruecknahme Protokoll", titel: "Rücknahmeprotokoll", wo: ["akte"] },
  zaehlliste: { doctype: "PH Inventur", format: "PH Inventur Zaehlliste", titel: "Zählliste", wo: ["akte"] },
  lageretikett: { doctype: "PH Lagerbestand", format: "PH Lagerbestand Etikett", titel: "Lageretikett 62 × 29 mm", wo: ["akte", "masse"], papier: { breite_mm: 62, hoehe_mm: 29 } },
  platzetikett: { doctype: "PH Lagerort", format: "PH Lagerort Platz-Etikett", titel: "Platzetikett 62 × 29 mm", wo: ["stammdaten"], papier: { breite_mm: 62, hoehe_mm: 29 } },
  bewertung: { doctype: "PH Inventurbewertung", format: "PH Inventurbewertung", titel: "Inventurbewertung", wo: ["akte"] },
});

export default LOGISTIK_DRUCK;
