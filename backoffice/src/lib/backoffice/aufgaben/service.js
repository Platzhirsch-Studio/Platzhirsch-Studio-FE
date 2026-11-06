// Zu tun – Bereich Service (G-11, 10-konzept-service §2.1 Heute-Leiste). Schreibt: Team B-SER.
// Jede Zeile eine Quelle mit echter Zahl (0 → Zeile entfällt), genau ein Knopf.
// Einbindung: Import-Zeile in aufgaben/index.js (ZUTUN_BEREICHE.service) – trägt P0-5/L0 ein.
// Reines Modul (keine "@/"-Importe).

import { isoDatum } from "../format.js";
import { sichereServiceSeed } from "../service/mock.js";

const heute = () => isoDatum();

const quellen = [
  {
    id: "service.reaktion-ueberfaellig",
    bereich: "service",
    icon: "TriangleAlert",
    ton: "ziegel",
    rang: 10,
    satz: (n) => (n === 1 ? "1 Kunde wartet auf die erste Rückmeldung" : `${n} Kunden warten auf die erste Rückmeldung`),
    unter: "Reaktionsfrist überschritten",
    zaehle: async ({ client }) => {
      sichereServiceSeed(client);
      return client.count("PH Servicefall", { filters: [["status", "=", "Gemeldet"], ["erstreaktion_am", "is", "not set"], ["frist_reaktion", "<", heute()]] });
    },
    knopf: { titel: "Anzeigen", href: "/service/faelle?reiter=reaktion" },
  },
  {
    id: "service.kulanz-freigabe",
    bereich: "service",
    icon: "Hourglass",
    ton: "cognac",
    rang: 20,
    recht: { bereich: "service", aktion: "cancel" },
    satz: (n) => (n === 1 ? "1 Kulanz wartet auf Freigabe" : `${n} Kulanzen warten auf Freigabe`),
    zaehle: async ({ client }) => {
      sichereServiceSeed(client);
      return client.count("PH Servicefall", { filters: [["kulanz_freigabe_status", "=", "Angefordert"]] });
    },
    knopf: { titel: "Prüfen", href: "/service/faelle?status=Entscheidung" },
  },
  {
    id: "service.ersatzteile-unter-mindest",
    bereich: "service",
    icon: "Package",
    ton: "eiche",
    rang: 60,
    satz: (n) => (n === 1 ? "1 Ersatzteil unter Mindestbestand" : `${n} Ersatzteile unter Mindestbestand`),
    zaehle: async ({ client }) => {
      sichereServiceSeed(client);
      const teile = await client.getList("PH Ersatzteil", { fields: ["verfuegbar", "mindestbestand", "bestand_fuehren", "produkt", "kategorie"], limit: 1000 });
      return teile.filter((t) => Number(t.bestand_fuehren) && !t.produkt && t.kategorie !== "Pflegemittel" && Number(t.verfuegbar) < Number(t.mindestbestand)).length;
    },
    knopf: { titel: "Anzeigen", href: "/service/ersatzteile?reiter=unter" },
  },
];

export default quellen;
