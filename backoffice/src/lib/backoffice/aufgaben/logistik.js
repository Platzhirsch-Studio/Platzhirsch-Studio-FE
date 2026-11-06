// Zu-tun-Quellen Logistik („Heute zu tun“, 10-konzept-logistik § 4.1, G-11). Schreibt: Team B-LOG.
// Default-Export: Liste von Definitionen nach aufgaben/index.js. Import-Zeile in ZUTUN_BEREICHE trägt P0-5/L0 ein;
// bis dahin bindet die Logistik-Übersicht die Liste direkt ein. Nur echte Zahlen aus den Daten. Reines Modul.

import { ZUTUN } from "../logistik/texte.js";
import { isoDatum } from "../format.js";
import { istLeitung } from "../logistik/rechte.js";

const tag = (client, n = 0) => isoDatum(new Date((client?.jetzt ? client.jetzt() : new Date()).getTime() + n * 86_400_000));

const quellen = [
  {
    id: "logistik.sendung-problem", bereich: "logistik", icon: "TriangleAlert", ton: "ziegel", rang: 10,
    satz: ZUTUN.sendungProblem,
    zaehle: ({ client }) => client.count("PH Sendung", { filters: [["status", "=", "Problem"]] }),
    knopf: { titel: ZUTUN.klaeren, href: "/logistik/sendungen?status=Problem" },
  },
  {
    id: "logistik.tour-morgen", bereich: "logistik", icon: "Truck", ton: "eiche", rang: 20,
    satz: ZUTUN.tourMorgen,
    recht: { bereich: "logistik", aktion: "write" },
    zaehle: async ({ session, client }) => (istLeitung(session) ? client.count("PH Tour", { filters: [["datum", "=", tag(client, 1)], ["status", "=", "Geplant"]] }) : 0),
    knopf: { titel: ZUTUN.oeffnen, href: "/logistik/touren?ansicht=plantafel" },
  },
  {
    id: "logistik.abholung-ohne-mail", bereich: "logistik", icon: "Phone", ton: "cognac", rang: 30,
    satz: ZUTUN.abholungOhneMail,
    zaehle: ({ client }) => client.count("PH Lieferschein", { filters: [["status", "=", "Gepackt"], ["lieferart", "=", "Abholung"], ["kunde_email", "in", ["", null]]] }),
    knopf: { titel: ZUTUN.anrufen, href: "/logistik/lieferscheine?ansicht=abholbereit" },
  },
  {
    id: "logistik.zurueck-im-fahrzeug", bereich: "logistik", icon: "Undo2", ton: "eiche", rang: 40,
    satz: ZUTUN.zurueck,
    zaehle: async ({ client }) => {
      const touren = await client.getList("PH Tour", { fields: ["name"], filters: [["status", "in", ["Abgeschlossen", "Abgebrochen"]]], limit: 50 });
      let n = 0;
      for (const t of touren) {
        const d = await client.getDoc("PH Tour", t.name);
        for (const s of d.stopps || []) {
          if (!s.lieferschein || !["nicht angetroffen", "verschoben", "offen", "unterwegs"].includes(s.status)) continue;
          const ls = await client.getDoc("PH Lieferschein", s.lieferschein).catch(() => null);
          if (ls?.status === "Uebergeben") n++;
        }
      }
      return n;
    },
    knopf: { titel: ZUTUN.zeigen, href: "/logistik/lieferscheine?ansicht=zurueck" },
  },
  {
    id: "logistik.ohne-etikett", bereich: "logistik", icon: "Package", ton: "eiche", rang: 50,
    satz: ZUTUN.ohneEtikettAlt,
    zaehle: ({ client }) => client.count("PH Sendung", { filters: [["status", "=", "Angelegt"], ["creation", "<", `${tag(client, -2)} 23:59:59`]] }),
    knopf: { titel: ZUTUN.oeffnen, href: "/logistik/sendungen?status=Angelegt" },
  },
  {
    id: "logistik.zaehlung-alt", bereich: "logistik", icon: "ScanBarcode", ton: "see", rang: 60,
    satz: ZUTUN.zaehlungAlt,
    zaehle: ({ client }) => client.count("PH Inventur", { filters: [["status", "=", "Laufend"], ["datum", "<", tag(client, -7)]] }),
    knopf: { titel: ZUTUN.oeffnen, href: "/logistik/inventur?status=Laufend" },
  },
  {
    id: "logistik.gesperrt", bereich: "logistik", icon: "Lock", ton: "stein", rang: 70,
    satz: ZUTUN.gesperrt,
    zaehle: ({ client }) => client.count("PH Lagerbestand", { filters: [["status", "=", "Gesperrt"]] }),
    knopf: { titel: ZUTUN.pruefen, href: "/logistik/bestand?ansicht=gesperrt" },
  },
  {
    id: "logistik.meldebestand", bereich: "logistik", icon: "RefreshCw", ton: "messing", rang: 80,
    satz: ZUTUN.meldebestand,
    zaehle: ({ client }) => client.count("PH Bestellvorschlag", { filters: [["status", "=", "Offen"]] }).catch(() => 0),
    knopf: { titel: ZUTUN.zeigen, href: "/logistik/nachbestellung" },
  },
];

export default quellen;
