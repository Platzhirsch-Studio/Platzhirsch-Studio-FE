// Zu-tun-Quellen – Bereich Shop (G-11, Q-B4). Schreibt: Team B-SHO. Einbindung: Importzeile in aufgaben/index.js
// (Besitzer P0-5/L0). Gleiche Filter wie Listen und Kennzahlen (shop/kennzahlen.js) – keine zweite Zählregel.
import { darf } from "../auth/rechte.js";

const zaehle = (filters) => async ({ client }) => client.count("PH Bestellung", { filters: [...filters, ["modus", "!=", "test"]] });
const mehr = (n, eins, viele) => `${n} ${n === 1 ? eins : viele}`;

const eintraege = [
  { id: "shop.pruefen", bereich: "shop", icon: "TriangleAlert", ton: "ziegel", rang: 10, satz: (n) => `${mehr(n, "Bestellung", "Bestellungen")} prüfen`, recht: { bereich: "shop", aktion: "read" }, zaehle: zaehle([["status", "=", "pruefen"]]), knopf: { titel: "Prüfen", href: "/shop/bestellungen?ansicht=pruefen" } },
  { id: "shop.zu-packen", bereich: "shop", icon: "Package", ton: "cognac", rang: 20, satz: (n) => `${mehr(n, "Bestellung", "Bestellungen")} zu packen`, zaehle: zaehle([["status", "=", "bezahlt"], ["lieferart", "=", "versand"]]), knopf: { titel: "Packen", href: "/shop/bestellungen?ansicht=zu-packen" } },
  { id: "shop.abholung", bereich: "shop", icon: "ShoppingBag", ton: "see", rang: 30, satz: (n) => `${mehr(n, "Abholung", "Abholungen")} offen`, zaehle: zaehle([["lieferart", "=", "abholung"], ["status", "in", ["reserviert", "bezahlt", "abholbereit"]]]), knopf: { titel: "Öffnen", href: "/shop/bestellungen?ansicht=abholung" } },
  { id: "shop.widerrufe", bereich: "shop", icon: "Undo2", ton: "eiche", rang: 40, satz: (n) => `${mehr(n, "Widerruf", "Widerrufe")} offen`, zaehle: async ({ client }) => client.count("PH Widerruf", { filters: [["status", "in", ["Eingegangen", "Bestaetigt", "Ware erwartet", "Ware erhalten"]]] }), knopf: { titel: "Öffnen", href: "/shop/widerrufe" } },
  { id: "shop.freigabe", bereich: "shop", icon: "BadgeCheck", ton: "messing", rang: 50, satz: (n) => `${mehr(n, "Erstattung wartet", "Erstattungen warten")} auf Freigabe`, recht: { bereich: "zentrale", aktion: "read" }, sichten: ["mir"], zaehle: async ({ session, client }) => (darf(session, "shop", "cancel") || (session.roles || []).includes("PH Geschäftsführung") ? client.count("PH Zahlung", { filters: [["status", "=", "Erstattung angefordert"]] }) : 0), knopf: { titel: "Ansehen", href: "/shop/zahlungen?ansicht=freigabe" } },
];

export default eintraege;
