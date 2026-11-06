// Zu-tun-Quellen des Bereichs Marketing für Zentrale und Bereichsstart (G-11, 10-konzept-marketing § 2.1, § 8.2).
// Schreibt: Team B-MAR. Eintrag in aufgaben/index.js (P0-5/L0): `import marketing from "./marketing.js";` → ZUTUN_BEREICHE.marketing.
// Reines Modul (relative Importe). Zahlen nur aus echten Abfragen (count), keine Schätzungen.

import { isoTag, plusTage } from "../marketing/regeln.js";
import { istLeitung } from "../marketing/rollen.js";

const heute = (client) => isoTag(client?.jetzt ? client.jetzt() : new Date());

const eintraege = [
  {
    id: "marketing.ausgabe-freigabe",
    bereich: "marketing",
    icon: "Mail",
    ton: "eiche",
    rang: 40,
    recht: (session) => istLeitung(session),
    satz: (n) => (n === 1 ? "1 Newsletter-Ausgabe wartet auf Freigabe" : `${n} Newsletter-Ausgaben warten auf Freigabe`),
    zaehle: ({ client }) => client.count("PH Newsletter Ausgabe", { filters: [["status", "=", "Freigabe"]] }),
    knopf: { titel: "Freigeben", href: "/marketing/newsletter?status=Freigabe" },
  },
  {
    id: "marketing.gutschein-faellig",
    bereich: "marketing",
    icon: "Gift",
    ton: "eiche",
    rang: 41,
    recht: (session) => istLeitung(session),
    satz: (n) => (n === 1 ? "1 Empfehlungsgutschein ist fällig" : `${n} Empfehlungsgutscheine sind fällig`),
    zaehle: ({ client }) => client.count("PH Empfehlung", { filters: [["status", "=", "Gutschein faellig"]] }),
    knopf: { titel: "Ansehen", href: "/marketing/empfehlungen?status=Gutschein+faellig" },
  },
  {
    id: "marketing.uhrzeit-fehlt",
    bereich: "marketing",
    icon: "Clock",
    ton: "eiche",
    rang: 42,
    satz: (n) => (n === 1 ? "1 Event ohne Uhrzeit in den nächsten 21 Tagen" : `${n} Events ohne Uhrzeit in den nächsten 21 Tagen`),
    zaehle: ({ client }) => client.count("PH Event", { filters: [["status", "=", "Geplant"], ["uhrzeit_von", "is", "not set"], ["datum", "between", [heute(client), isoTag(plusTage(heute(client), 21))]]] }),
    knopf: { titel: "Eintragen", href: "/marketing/events?status=Geplant" },
  },
  {
    id: "marketing.social-heute",
    bereich: "marketing",
    icon: "Share2",
    ton: "see",
    rang: 43,
    satz: (n) => (n === 1 ? "1 Beitrag ist heute geplant" : `${n} Beiträge sind heute geplant`),
    zaehle: ({ client }) => client.count("PH Social Beitrag", { filters: [["status", "=", "Geplant"], ["datum_geplant", "=", heute(client)]] }),
    knopf: { titel: "Öffnen", href: "/marketing/social" },
  },
  {
    id: "marketing.unbestaetigt",
    bereich: "marketing",
    icon: "Mail",
    ton: "eiche",
    rang: 44,
    satz: (n) => (n === 1 ? "1 Anmeldung ist unbestätigt" : `${n} Anmeldungen sind unbestätigt`),
    zaehle: ({ client }) => client.count("PH Newsletter Abo", { filters: [["status", "=", "Angemeldet unbestaetigt"]] }),
    knopf: { titel: "Ansehen", href: "/marketing/empfaenger?status=Angemeldet+unbestaetigt" },
  },
];

export default eintraege;
