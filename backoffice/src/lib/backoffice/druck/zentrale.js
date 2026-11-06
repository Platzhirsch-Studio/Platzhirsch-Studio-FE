// Druck – Bereich Zentrale (10-konzept-zentrale § 7). Schreibt: Team B-ZEN.
// Die Zentrale hat keine Frappe-Druckformate; ihre Ausgaben laufen über den Browserdruck (@media print).
// Reines Datenmodul.

export const ZENTRALE_DRUCK = Object.freeze({
  aufgabenliste: { titel: "Aufgabenliste (gefiltert)", weg: "browser", seite: "/aufgaben", papier: "a4" },
  benutzerliste: { titel: "Benutzerliste", weg: "browser", seite: "/benutzer", papier: "a4-quer" },
  geraeteliste: { titel: "Geräteliste", weg: "browser", seite: "/geraete", papier: "a4" },
  nummernkreise: { titel: "Nummernkreise", weg: "browser", seite: "/einstellungen?tab=system", papier: "a4" },
});

export default ZENTRALE_DRUCK;
