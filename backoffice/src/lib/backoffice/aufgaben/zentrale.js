// Zu-tun-Quellen Zentrale (G-11, 10-konzept-zentrale § 6.3). Schreibt: Team B-ZEN.
// Default-Export: Liste nach aufgaben/index.js. Import-Zeile in ZUTUN_BEREICHE trägt P0-5/L0 ein; die Zentrale selbst
// zeigt Aufgaben über die Heute-Leiste und die Aufgaben-Kachel (lib/backoffice/zentrale/daten.js). Nur echte Zahlen.
// Reines Modul.

import { heuteIso } from "./index.js";

const quellen = [
  {
    id: "zentrale.aufgaben-ueberfaellig", bereich: "zentrale", icon: "CheckSquare", ton: "ziegel", rang: 5, sichten: ["mir"],
    satz: (n) => (n === 1 ? "1 Aufgabe ist überfällig" : `${n} Aufgaben sind überfällig`),
    unter: "Zugewiesen an dich, Frist vor heute",
    zaehle: ({ session, client }) => (client && session ? client.count("PH Aufgabe", { filters: [["zugewiesen_an", "=", session.user], ["status", "in", ["Offen", "In Arbeit"]], ["faellig", "<", heuteIso()]] }) : 0),
    knopf: { titel: "Ansehen", href: "/aufgaben?frist=ueberfaellig" },
  },
  {
    id: "zentrale.aufgaben-ohne-zustaendig", bereich: "zentrale", icon: "Inbox", ton: "stein", rang: 60, sichten: ["team"],
    recht: { bereich: "zentrale", aktion: "write" },
    satz: (n) => (n === 1 ? "1 Aufgabe ohne Zuständigkeit" : `${n} Aufgaben ohne Zuständigkeit`),
    zaehle: ({ client }) => (client ? client.count("PH Aufgabe", { filters: [["zugewiesen_an", "is", "not set"], ["status", "=", "Offen"]] }) : 0),
    knopf: { titel: "Verteilen", href: "/aufgaben?sicht=alle" },
  },
];

export default quellen;
