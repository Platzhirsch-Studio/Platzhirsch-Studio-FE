// Freigaben Logistik (G-15, Q-C7). Schreibt: Team B-LOG. Import-Zeile in FREIGABE_BEREICHE trägt P0-7/L0 ein.
// Zwei Vier-Augen-Vorgänge aus 10-konzept-logistik: Tour freigeben (§ 4.6/§ 4.7, Leitung) und Inventur freigeben
// (§ 5.12: nicht die eigene Zählung, Differenzen mit Grund). Die Glocke zeigt sie der Leitung; Freigeben ruft
// dieselbe Dienst-Methode wie die Akte (Mock-Pfad inklusive). Reines Modul.

import { inventurMethode, tourMethode, aufgabe } from "../logistik/dienst.js";
import { freigabePruefen } from "../logistik/inventur.js";
import { istLeitung } from "../logistik/rechte.js";
import { isoDatum } from "../format.js";

const morgen = (client) => isoDatum(new Date((client?.jetzt ? client.jetzt() : new Date()).getTime() + 86_400_000));

const arten = [
  {
    art: "logistik.tour",
    bereich: "logistik",
    titel: "Tour freigeben",
    geldwirksam: false,
    folge: "Die Tour erscheint beim Fahrer; Lieferscheine gehen beim Start an den Fahrer über.",
    laden: async (session, client) => {
      if (!istLeitung(session)) return [];
      const touren = await client.getList("PH Tour", { fields: ["name", "datum", "fahrzeug", "fahrer", "owner", "modified"], filters: [["status", "=", "Geplant"], ["datum", "<=", morgen(client)]], limit: 20 });
      return touren.map((t) => ({ name: t.name, titel: `${t.name} · ${t.datum}`, objekt: { titel: t.fahrzeug || t.name, href: `/logistik/touren/${encodeURIComponent(t.name)}` }, antragsteller: { user: t.owner, name: t.owner }, grund: t.fahrer ? "" : "Kein Fahrer", zeit: t.modified, token: t.modified }));
    },
    freigeben: async (session, client, { name }) => {
      await tourMethode(client, { name, methode: "freigeben" });
    },
    ablehnen: async (session, client, { name, grund }) => {
      await client.kommentar("PH Tour", name, `Freigabe abgelehnt: ${grund}`);
      await aufgabe(client, { titel: `Tour ${name} überarbeiten`, beschreibung: grund, referenz_doctype: "PH Tour", referenz_name: name });
    },
  },
  {
    art: "logistik.inventur",
    bereich: "logistik",
    titel: "Inventur freigeben",
    geldwirksam: true,
    folge: "Differenzen werden als Bewegungen „Inventur“ gebucht; der Bestand ändert sich.",
    laden: async (session, client) => {
      if (!istLeitung(session)) return [];
      const liste = await client.getList("PH Inventur", { fields: ["name"], filters: [["status", "=", "Laufend"]], limit: 20 });
      const out = [];
      for (const k of liste) {
        const inv = await client.getDoc("PH Inventur", k.name);
        const p = freigabePruefen({ inventur: inv, benutzer: session.user, leitung: true });
        if (!(inv.positionen || []).length || (inv.positionen || []).some((x) => !Number(x.gezaehlt))) continue;
        out.push({ name: inv.name, titel: `${inv.titel || inv.name}`, objekt: { titel: inv.lagerort, href: `/logistik/inventur/${encodeURIComponent(inv.name)}` }, antragsteller: { user: inv.gezaehlt_von, name: inv.gezaehlt_von }, grund: p.gruende.map((g) => g.text).join(" "), zeit: inv.modified, token: inv.modified });
      }
      return out;
    },
    freigeben: async (session, client, { name }) => {
      const inv = await client.getDoc("PH Inventur", name);
      const p = freigabePruefen({ inventur: inv, benutzer: session.user, leitung: istLeitung(session) });
      if (!p.darf) throw Object.assign(new Error(p.gruende.map((g) => g.text).join(" ")), { code: "invalid" });
      await inventurMethode(client, { name, methode: "freigeben" });
    },
    ablehnen: async (session, client, { name, grund }) => {
      await client.kommentar("PH Inventur", name, `Nachzählen: ${grund}`);
      await aufgabe(client, { titel: `Inventur ${name} nachzählen`, beschreibung: grund, referenz_doctype: "PH Inventur", referenz_name: name });
    },
  },
];

export default arten;
