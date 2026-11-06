// QA-Routen – Bereich Logistik (Q-M3, MASTER § 3.5). Schreibt: Team B-LOG.
// Feste Seiten mit eigenem Layout (kern). Startseite und Navigation des Bereichs kommen automatisch aus
// src/lib/backoffice/bereiche/logistik.js. Felder: pfad (oder null + ersterDatensatz), titel, ohneSitzung?,
// kern? (Standard true), rang? (Reihenfolge im Lauf, Standard 1000).
// Datensätze aus dem Logistik-Seed (fest, deterministisch): je Status ein Beispiel, dazu Leer-/Fehlerfälle.

const eintraege = [
  { pfad: "/packtisch", titel: "Kiosk Packtisch", rang: 80 },
  { pfad: "/packtisch/LS-2026-00001", titel: "Packtisch: Pack-Ansicht Paket (4 von 6)", rang: 1100 },
  { pfad: "/packtisch/LS-2026-00005", titel: "Packtisch: Sperrgut · Tour (gepackt)", rang: 1101 },
  { pfad: "/packtisch/LS-2026-00006", titel: "Packtisch: Abholkarte (Zahlung offen)", rang: 1102 },
  { pfad: "/packtisch/LS-2026-00016", titel: "Packtisch: zurückgestellt", rang: 1103 },
  { pfad: "/logistik/packen/LS-2026-00002", titel: "Pack-Ansicht im Backoffice (ohne Gerät)", rang: 1104 },
  { pfad: "/logistik/lieferscheine?ansicht=kanban", titel: "Lieferscheine Kanban", rang: 1110 },
  { pfad: "/logistik/lieferscheine?ansicht=zurueck", titel: "Lieferscheine zurück im Fahrzeug", rang: 1111 },
  { pfad: "/logistik/lieferscheine/LS-2026-00004", titel: "Lieferschein: Anzahlung offen / Bestand-Band", rang: 1112 },
  { pfad: "/logistik/lieferscheine/LS-2026-00012", titel: "Lieferschein: Liefermenge nicht an AB gemeldet", rang: 1113 },
  { pfad: "/logistik/lieferscheine/LS-2026-00013", titel: "Lieferschein: storniert", rang: 1114 },
  { pfad: "/logistik/lieferscheine/LS-2026-00015", titel: "Lieferschein: Ausfuhr CH (Steuernachweis)", rang: 1115 },
  { pfad: "/logistik/sendungen/PH-SND-2026-00005", titel: "Sendung mit Problem", rang: 1120 },
  { pfad: "/logistik/touren?zeitraum=tag", titel: "Plantafel Tag", rang: 1130 },
  { pfad: "/logistik/touren?ansicht=liste", titel: "Touren Liste", rang: 1131 },
  { pfad: "/logistik/touren/PH-TOUR-2026-0001", titel: "Tour unterwegs (Montage-Stopp)", rang: 1132 },
  { pfad: "/logistik/touren/PH-TOUR-2026-0002", titel: "Tour geplant (Freigabe gesperrt mit Grund)", rang: 1133 },
  { pfad: "/logistik/speditionen/PH-SPA-2026-0001", titel: "Speditionsauftrag gesendet", rang: 1140 },
  { pfad: "/logistik/ruecknahmen/PH-WR-2026-0002", titel: "Rücknahme: Prüfung", rang: 1141 },
  { pfad: "/logistik/bestand?ansicht=gesperrt", titel: "Bestand gesperrt", rang: 1150 },
  { pfad: "/logistik/bestand/PH-LB-00010", titel: "Bestand-Akte (B-Ware gesperrt)", rang: 1151 },
  { pfad: "/logistik/kommission?k=PH-PRJ-2026-0003", titel: "Kommission eines Projekts", rang: 1152 },
  { pfad: "/logistik/inventur/PH-INV-2026-0001", titel: "Teilinventur laufend", rang: 1160 },
  { pfad: "/logistik/inventur/PH-INV-2026-0002?tab=differenzen", titel: "Inventur: Bewegung seit Zählbeginn", rang: 1161 },
  { pfad: "/logistik/inventur/PH-INV-2026-0001/zaehlen", titel: "Zählmodus (iPhone)", rang: 1162 },
  { pfad: "/logistik/inventur/bewertung", titel: "Inventurbewertung", rang: 1163 },
  { pfad: "/logistik/inventur/bewertung/PH-IB-2026-0002", titel: "Inventurbewertung Entwurf", rang: 1164 },
  { pfad: "/logistik/stammdaten?tab=paketprofile", titel: "Paketprofile (Schätzung)", rang: 1170 },
  { pfad: "/logistik/stammdaten?tab=einstellungen", titel: "Einstellungen Logistik", rang: 1171 },
  { pfad: "/logistik/berichte/bestandsliste", titel: "Bericht Bestandsliste", rang: 1172 },
  { pfad: "/logistik/berichte/touren-auslastung", titel: "Bericht Touren-Auslastung", rang: 1173 },
];

export default eintraege;
