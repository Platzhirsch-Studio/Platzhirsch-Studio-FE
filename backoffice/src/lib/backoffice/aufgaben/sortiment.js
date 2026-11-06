// Zu-tun-Quellen des Bereichs Sortiment für Zentrale und Bereichsstart (G-11, § 11.4). Schreibt: Team B-SOR.
// Eintrag in aufgaben/index.js (P0-5/L0): `import sortiment from "./sortiment.js";` → ZUTUN_BEREICHE.sortiment.
// Reines Modul (relative Importe). Zahlen nur aus echten Abfragen (count), keine Schätzungen.

import { isoTag, plusTage } from "../sortiment/regeln.js";
import { istLeitung } from "../sortiment/rollen.js";

const heute = (client) => isoTag(client?.jetzt ? client.jetzt() : new Date());

const eintraege = [
  {
    id: "sortiment.ab-ausstaendig",
    bereich: "sortiment",
    icon: "ScrollText",
    ton: "cognac",
    rang: 20,
    satz: (n) => (n === 1 ? "1 Bestellung wartet auf die AB" : `${n} Bestellungen warten auf die AB`),
    zaehle: ({ client }) => client.count("PH Herstellerbestellung", { filters: [["status", "=", "Gesendet"]] }),
    knopf: { titel: "AB einlesen", href: "/sortiment/bestellungen?segment=unterwegs" },
  },
  {
    id: "sortiment.abweichungen",
    bereich: "sortiment",
    icon: "ListFilter",
    ton: "eiche",
    rang: 21,
    satz: (n) => (n === 1 ? "1 AB mit offenen Abweichungen" : `${n} AB mit offenen Abweichungen`),
    zaehle: ({ client }) => client.count("PH Herstellerbestellung", { filters: [["abweichungen_offen", ">", 0], ["status", "not in", ["Abgeschlossen", "Storniert"]]] }),
    knopf: { titel: "Klären", href: "/sortiment/bestellungen?segment=ab" },
  },
  {
    id: "sortiment.wareneingang",
    bereich: "sortiment",
    icon: "PackageCheck",
    ton: "see",
    rang: 22,
    satz: (n) => (n === 1 ? "1 Lieferung in den nächsten 7 Tagen" : `${n} Lieferungen in den nächsten 7 Tagen`),
    zaehle: ({ client }) => client.count("PH Herstellerbestellung", { filters: [["status", "in", ["AB geprueft", "Teilgeliefert"]], ["bestaetigter_termin", "between", [heute(client), plusTage(heute(client), 7)]]] }),
    knopf: { titel: "Eingang buchen", href: "/sortiment/wareneingang/neu" },
  },
  {
    id: "sortiment.preis-veraltet",
    bereich: "sortiment",
    icon: "Tag",
    ton: "eiche",
    rang: 30,
    satz: (n) => (n === 1 ? "1 Preis ist veraltet" : `${n} Preise sind veraltet`),
    zaehle: ({ client }) => client.count("PH Produkt", { filters: [["preisstand_alt", "=", 1], ["status", "=", "Aktiv"]] }),
    knopf: { titel: "Preise bestätigen", href: "/sortiment/produkte?sicht=veraltet" },
  },
  {
    id: "sortiment.veroeffentlichen",
    bereich: "sortiment",
    icon: "BadgeCheck",
    ton: "salbei",
    rang: 31,
    recht: { bereich: "sortiment", aktion: "delete" },
    satz: (n) => (n === 1 ? "1 Produkt wartet auf Veröffentlichung" : `${n} Produkte warten auf Veröffentlichung`),
    zaehle: ({ session, client }) => (istLeitung(session) ? client.count("PH Produkt", { filters: [["status", "=", "Geprueft"]] }) : 0),
    knopf: { titel: "Veröffentlichen …", href: "/sortiment/produkte?sicht=wartet" },
  },
];

export default eintraege;
