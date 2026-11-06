// QA-Routen – Bereich Ablage. Schreibt: Team B-ABL (Q-M3, MASTER § 3.5).
// Feste Seiten mit eigenem Layout (kern). Startseite und Navigation des Bereichs kommen automatisch aus
// src/lib/backoffice/bereiche/ablage.js. Felder: pfad (oder null + ersterDatensatz), titel, ohneSitzung?,
// kern? (Standard true), rang? (Reihenfolge im Lauf, Standard 1000).
// Ordner-/Datei-Nummern hängen am laufenden Mock (Nachsaat) – deshalb `ersterDatensatz` statt fester Nummern.

const eintraege = [
  { pfad: "/ablage?ansicht=liste", titel: "Ablage · Liste", rang: 300 },
  { pfad: "/ablage?q=Rendering", titel: "Ablage · Suche", rang: 301 },
  { pfad: "/ablage?sim=leer", titel: "Ablage · leer", kern: false, rang: 302 },
  { pfad: "/ablage?sim=fehler", titel: "Ablage · Fehler", kern: false, rang: 303 },
  { pfad: "/ablage/zuletzt?ansicht=liste", titel: "Ablage · Zuletzt (Liste)", kern: false, rang: 304 },
  { pfad: "/ablage/freigaben?reiter=beendet", titel: "Ablage · Freigaben beendet", rang: 305 },
  { pfad: "/ablage/papierkorb?sim=leer", titel: "Ablage · Papierkorb leer", kern: false, rang: 306 },
  { pfad: "/f/demoKuecheAbend01", titel: "Freigabe · öffentlich", ohneSitzung: true, rang: 310 },
  { pfad: "/f/demoAngebotPw0002", titel: "Freigabe · Passwort", ohneSitzung: true, rang: 311 },
  { pfad: "/f/demoAngebotPw0002?fehler=passwort", titel: "Freigabe · Passwort falsch", ohneSitzung: true, kern: false, rang: 312 },
  { pfad: "/f/demoAbgelaufen003", titel: "Freigabe · abgelaufen", ohneSitzung: true, rang: 313 },
  { pfad: "/f/gibtEsNicht0000", titel: "Freigabe · ungültig", ohneSitzung: true, kern: false, rang: 314 },
];

export default eintraege;
