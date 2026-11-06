// Texte für das Kanban (Team P0-5b). Reines Modul.

export const KANBAN = {
  hilfe: "Karte fokussieren: Pfeil links oder rechts verschiebt in die Nachbarspalte, M öffnet das Menü „Verschieben nach“, Enter öffnet die Karte.",
  spalte: (status, n) => `${status}, ${n} ${n === 1 ? "Karte" : "Karten"}`,
  wip: (n) => `Höchstens ${n} gleichzeitig`,
  leer: "Keine Einträge",
  keineKarten: "Keine Karten.",
  neuLaden: "Neu laden",
  verschieben: (name) => `${name} verschieben`,
  verschiebenNach: "Verschieben nach",
  keinZiel: "Kein Übergang möglich.",
  keinUebergang: (von, nach) => `Von „${von}“ nach „${nach}“ gibt es keinen Übergang.`,
  verschoben: (name, nach) => `${name} nach „${nach}“ verschoben.`,
  keinSchritt: (rechts) => `Kein Übergang ${rechts ? "nach rechts" : "nach links"} möglich.`,
  links: "Spalten nach links blättern",
  rechts: "Spalten nach rechts blättern",
};
