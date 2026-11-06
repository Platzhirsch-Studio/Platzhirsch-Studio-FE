// Texte der Seitenmuster (Team P0-5b): Zu tun, Bereichsstart, Seitenkopf, Unternav, Zwei-Klick-Knopf.
// Reines Modul (keine Importe) – auch unter node --test lesbar. Du-Form, keine Superlative,
// keine Ausrufezeichen (MASTER Q-K1/Q-K2).

export const ZUTUN = {
  titel: "Zu tun",
  unter: "Was heute auf eine Antwort wartet.",
  alle: "Alle anzeigen",
  leerTitel: "Alles erledigt",
  leerText: "Hier wartet gerade nichts auf dich.",
  fehler: "Konnte nicht geladen werden",
  erneut: "Erneut",
  laedt: "Wird geladen",
  zeitlimit: "Dauert zu lange – später erneut versuchen",
  filterLabel: "Sicht",
  sichten: { alle: "Alle", mir: "Für mich", team: "Team" },
  oeffnen: "Öffnen",
  ansehen: "Ansehen",
  aktionFehler: "Nicht ausgeführt",
  // Generische Quellen (Bereichsstart ohne eigene Seite, lib/backoffice/aufgaben)
  aufgabenFaellig: (n) => (n === 1 ? "1 Aufgabe ist fällig" : `${n} Aufgaben sind fällig`),
  aufgabenFaelligUnter: "Dir zugewiesen, Fälligkeit heute oder früher",
  imStatus: (label, n, status) => `${label}: ${n} ${n === 1 ? "Eintrag" : "Einträge"} im Status „${status}“`,
  imStatusUnter: "Erster Schritt im Ablauf",
};

export const BEREICH_START = {
  ueber: "Bereich",
  untertitel: "Was ansteht und die Listen dieses Bereichs.",
  listen: "Listen",
  listenUnter: "Ganze Kachel öffnet die Liste.",
  offen: "offen",
  gesamt: "gesamt",
  vonGesamt: (n) => `von ${n} gesamt`,
  kanban: "Kanban",
  neu: "Neu",
  leerTitel: "Dieser Bereich wird eingerichtet",
  leerText: "Für deine Rollen sind hier noch keine Listen freigegeben.",
  zurZentrale: "Zur Zentrale",
};

export const SEITE = {
  brotkrumen: "Brotkrumen",
  zurueck: "Zurück",
  zurueckZu: (ziel) => `Zurück zu ${ziel}`,
  info: "Hinweis",
  kennzahlen: "Kennzahlen",
  unternav: "Unterbereiche",
  mehr: "Mehr",
  wirklich: (verb) => `Wirklich ${verb}?`,
  zweiKlickHinweis: (verb) => `Wirklich ${verb}? Zum Bestätigen noch einmal drücken, sonst bricht der Vorgang nach 3 Sekunden ab.`,
  zweiKlickAbgebrochen: "Abgebrochen.",
};
