// Mock-Seed – Bereich E-Mails, Slug „posteingang“ (G-01, MASTER § 3.5). Schreibt: Team B-MAI.
// anzahl: Datensätze je DocType · kern: Fachwissen je DocType (Verteilung, Bezüge, Titel) nach der
// generischen Erzeugung · default: Nachlauf (db, hilfe) nach dem Grundaufbau, Reihenfolge über `nach`.
// Keine echten Personen, E-Mails @beispiel.invalid, runde Beispielwerte (Q-A3). Zufall nur über `r`
// (fester Startwert); Reihenfolge der r-Aufrufe nicht ändern, sonst verschieben sich alle Folgedaten.
//
// Bewusst ohne `anzahl`/`kern` (gemeinsamer Zufall, siehe ablage.js). Nicht zugeordnete Mails speichert
// ph_microsoft nie (Entscheidung Nr. 52) – sie gehören nicht in den Seed, sondern in den Mock-Pfad von
// ph_microsoft.api.mails_unzugeordnet (Team B-MAI, mock/client.js).

import { isoDatumZeit } from "../../format.js";

/** Nachläufe anderer Bereiche, die vor diesem laufen müssen (CRM liefert die Kontakte). */
export const nach = ["crm"];

/** Anzahl generischer Datensätze je DocType (nicht gelistete mit Status bekommen 6). */
export const anzahl = {};

/** Fachliche Nachbearbeitung je DocType: (doc, { i, r, ctx, person }) – ändert doc. */
export const kern = {};

/** Beispiel-Postfächer: [Adresse, Art, Besitzer, Richtung, Status]. */
const POSTFAECHER = [
  ["office@beispiel.invalid", "Shared", "admin@demo.local", "Beide", "Aktiv"],
  ["beratung@beispiel.invalid", "Shared", "crm-leitung@demo.local", "Beide", "Aktiv"],
  ["crm@beispiel.invalid", "Benutzer", "crm@demo.local", "Beide", "Pausiert"],
];

/**
 * Nachlauf: Postfächer mit Berechtigten statt der generischen, dazu weitere Adressen (Art „Zuordnung“) an
 * Kontakten und zwei Sperren. Ändert nur PH Postfach und PH Mail Adresse.
 * @param {Map<string, Map<string, object>>} db
 * @param {import("./index.js").SeedHilfe} hilfe
 */
export default function nachlauf(db, hilfe) {
  const metaPf = hilfe.index.doctypes.get("PH Postfach");
  const metaAdr = hilfe.index.doctypes.get("PH Mail Adresse");
  const r = hilfe.rng;
  const basis = { owner: "Administrator", modified_by: "Administrator", docstatus: 0, idx: 0 };
  const optionen = (meta, feld) => meta?.fields.find((f) => f.fieldname === feld)?.auswahl || [];

  if (metaPf) {
    const pf = hilfe.tabelle("PH Postfach");
    const arten = optionen(metaPf, "art");
    pf.clear();
    POSTFAECHER.forEach(([adresse, art, besitzer, richtung, status], i) => {
      const zeit = isoDatumZeit(hilfe.tage(-r.int(0, 2), r));
      pf.set(adresse, {
        doctype: "PH Postfach",
        name: adresse,
        adresse,
        art: arten.includes(art) ? art : arten[0] || art,
        besitzer,
        aktiv: status === "Aktiv" ? 1 : 0,
        status,
        richtung,
        ordner: "",
        abo_aktiv: status === "Aktiv" ? 1 : 0,
        benutzer: [{ doctype: "PH Postfach Benutzer", user: besitzer, lesen: 1, senden: 1, idx: 1, parentfield: "benutzer", parenttype: "PH Postfach" }],
        letzte_abholung: zeit,
        mails_zugeordnet: [120, 64, 0][i],
        letzter_fehler: "",
        delta_json: "",
        ...basis,
        creation: isoDatumZeit(hilfe.tage(-40)),
        modified: zeit,
      });
    });
  }

  if (metaAdr) {
    const adr = hilfe.tabelle("PH Mail Adresse");
    const felder = new Set(metaAdr.fields.map((f) => f.fieldname));
    const kontakte = hilfe.kontakte.slice(0, 3);
    const eintraege = [
      ...kontakte.map((k, i) => ({ art: "Zuordnung", adresse: `${String(k.vorname || "kontakt").toLowerCase().normalize("NFD").replace(/[^a-z]/g, "") || "kontakt"}.privat${i + 1}@beispiel.invalid`, kontakt_doctype: "PH Kontakt", kontakt_name: k.name, notiz: "Weitere Adresse aus manueller Zuordnung" })),
      { art: "Sperre", adresse: "newsletter@beispiel.invalid", notiz: "Werbung, nie zuordnen" },
      { art: "Sperre", adresse: "privat@beispiel.invalid", notiz: "Privat, nie zuordnen" },
    ];
    for (const e of eintraege) {
      const doc = { doctype: "PH Mail Adresse" };
      for (const [k, v] of Object.entries(e)) if (felder.has(k)) doc[k] = v;
      doc.name = `mailadr${String(adr.size + 1).padStart(4, "0")}`;
      const zeit = isoDatumZeit(hilfe.tage(-r.int(1, 30), r));
      Object.assign(doc, basis, { owner: "crm@demo.local", creation: zeit, modified: zeit });
      adr.set(doc.name, doc);
    }
  }
}
