// Akte-Slots – Bereich Kundenkarte (G-14, Slot-API v1). Schreibt: Team B-KKA.
// Kundenakte › Übersicht: Abschnitt „Kundenkarte“ (Stufe, Nummer, Leistungen; ohne Karte „Kundenkarte ausstellen“).
// Die Registerzeile in akte/slots/index.js trägt L0/P0-5 ein (`import kundenkarte from "./kundenkarte.js"`).
// Quelle der Stufe für Rollen ohne Kundenkarten-Recht: Spiegel am Kontakt (ph_kundenkarte_karte/_stufe).

import KundenakteSlot from "../../../../components/Backoffice/Kundenkarte/KundenakteSlot.js";
import { darf } from "../../auth/rechte.js";
import { methode } from "../../kundenkarte/methoden.js";

const slots = [
  {
    id: "kundenkarte.karte",
    bereich: "kundenkarte",
    akte: "kunde",
    tab: "uebersicht",
    reihenfolge: 40,
    titel: "Kundenkarte",
    breite: "halb",
    zeitlimitMs: 3000,
    lade: async (session, kontakt, { client }) => {
      const k = await client.getDoc("PH Kontakt", kontakt);
      const darfKk = darf(session, "kundenkarte", "read");
      const daten = { kontakt, karte: k.ph_kundenkarte_karte || null, stufe: k.ph_kundenkarte_stufe || null, geschaeft: k.kontaktart === "Geschaeft", darfOeffnen: darfKk, darfAusstellen: darf(session, "kundenkarte", "create") };
      if (daten.karte && darfKk) {
        const [karte, stufe] = await Promise.all([client.getDoc("PH Kundenkarte", daten.karte).catch(() => null), daten.stufe ? client.getDoc("PH Kundenkarte Stufe", daten.stufe).catch(() => null) : null]);
        daten.status = karte?.status || null;
        daten.farbe = stufe?.farbe || null;
        const u = await methode(client, "PH Kundenkarte", daten.karte, "portal_daten", {}).catch(() => null);
        daten.vorteile = (u?.vorteile || []).map((v) => ({ titel: v.titel, art: v.art }));
      }
      return daten;
    },
    Komponente: KundenakteSlot,
  },
];

export default slots;
