// Freigabe-Arten des Bereichs Marketing für Glocke „Für mich“ und Zentrale (G-15, 10-konzept-marketing § 8.2).
// Schreibt: Team B-MAR. Eintrag in freigaben/index.js (P0-7/L0): `import marketing from "./marketing.js";` → FREIGABE_BEREICHE.marketing.
// Newsletter- und Social-Freigaben brauchen die Vorschau (D1/D2): die Glocke zeigt die Zeile und führt in die Akte mit
// geöffnetem Dialog – freigegeben wird dort, nie blind aus der Glocke. Deshalb `nurInAkte: true` und `href`.
// Reines Modul (relative Importe).

import { freigabeAufgaben, ausgabeZurueck, socialZurueckgeben } from "../marketing/methoden.js";
import { monatAusSlug } from "../marketing/regeln.js";

const eintraege = [
  {
    art: "marketing.newsletter",
    bereich: "marketing",
    titel: "Newsletter-Ausgabe",
    geldwirksam: false,
    nurInAkte: true,
    folge: "Die Ausgabe wird zum gewählten Termin an alle Empfänger gesendet.",
    recht: { bereich: "marketing", aktion: "delete" },
    laden: async (session, client) => {
      const liste = await client.getList("PH Newsletter Ausgabe", { fields: ["name", "slug", "betreff", "owner", "modified", "empfaenger_anzahl"], filters: [["status", "=", "Freigabe"]], limit: 20 });
      return liste.map((a) => ({
        name: a.name,
        titel: `Ausgabe ${monatAusSlug(a.slug)}: „${a.betreff}“`,
        objekt: { titel: monatAusSlug(a.slug), href: `/marketing/newsletter/${encodeURIComponent(a.name)}?dialog=freigeben` },
        antragsteller: { user: a.owner, name: a.owner },
        grund: "Wartet auf Freigabe",
        zeit: a.modified,
        token: a.modified,
      }));
    },
    freigeben: async () => {
      throw Object.assign(new Error("Bitte in der Ausgabe mit Vorschau freigeben."), { code: "invalid" });
    },
    ablehnen: async (session, client, { name, grund }) => ausgabeZurueck(client, { name, kommentar: grund }),
  },
  {
    art: "marketing.social",
    bereich: "marketing",
    titel: "Social-Beitrag",
    geldwirksam: false,
    nurInAkte: true,
    folge: "Der Beitrag darf zum geplanten Datum veröffentlicht werden.",
    recht: { bereich: "marketing", aktion: "delete" },
    laden: async (session, client) => {
      const todos = await freigabeAufgaben(client, { doctype: "PH Social Beitrag" });
      const offen = todos.filter((t) => !/zurückgegeben/i.test(String(t.description || "")));
      const docs = await Promise.all(offen.map((t) => client.getDoc("PH Social Beitrag", t.reference_name).catch(() => null)));
      return docs.filter(Boolean).map((d, i) => ({
        name: d.name,
        titel: `Beitrag „${d.titel}“`,
        objekt: { titel: d.titel, href: `/marketing/social/${encodeURIComponent(d.name)}?dialog=freigeben` },
        antragsteller: { user: offen[i].owner, name: offen[i].owner },
        grund: `${d.kanal} · ${d.format}`,
        zeit: offen[i].creation,
        token: d.modified,
      }));
    },
    freigeben: async () => {
      throw Object.assign(new Error("Bitte im Beitrag mit Bild und Bildrechten freigeben."), { code: "invalid" });
    },
    ablehnen: async (session, client, { name, grund }) => socialZurueckgeben(client, { name, kommentar: grund }),
  },
];

export default eintraege;
