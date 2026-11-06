// „Zu erledigen“ des CRM (10-konzept-crm § 3.1): eine Arbeitsliste, Reihenfolge nach Dringlichkeit, jede Zeile
// genau ein Knopf. Reines Modul – dieselben Zeilen liefert `zuErledigen(session)` (daten.js) der Zentrale.
//
//   (1) neue Anfragen, älteste zuerst · (2) Termine zu bestätigen (E-Mail bestätigt) · (3) Termine ohne Protokoll
//   (4) Termin entfallen · (5) fällige Aufgaben/Nachfassen · (6) Datenschutz-Fristen ≤ 7 Tage (nur Leitung)

import { CRM_TEXTE as T } from "./texte.js";
import { alterText, alsDatum, faelligText, terminZeit } from "./vorgang.js";

export const MAX_ZEILEN = 8;

const personText = (d) => [d.vorname, d.nachname].filter(Boolean).join(" ") || d.firma || "";
const titelOhneArt = (t) => String(t || "").replace(/^[A-Za-zÄÖÜäöü]+:\s*/, "");

/**
 * @param {object} d
 * @param {object[]} [d.neu]           PH Anfrage status Neu
 * @param {object[]} [d.zuBestaetigen] PH Termin Unbestaetigt + email_verifiziert
 * @param {object[]} [d.ohneProtokoll] PH Termin Bestaetigt, ende < jetzt
 * @param {object[]} [d.entfallen]     PH Anfrage (abgeleitet „Termin entfallen“)
 * @param {object[]} [d.aufgaben]      PH Aufgabe offen, faellig <= heute
 * @param {object[]} [d.datenschutz]   PH Datenschutzanfrage mit Frist ≤ 7 Tage
 * @param {{jetzt?:Date, schwelleH?:number}} [opt]
 * @returns {Array<{id:string, typ:string, art:string, titel:string, unter:string, wort:string, href:string,
 *   knopf:{titel:string, aktion?:string, href?:string}, objekt:{doctype:string, name:string}, rang:number, zeit:string}>}
 */
export function zuErledigenZeilen(d = {}, { jetzt = new Date(), schwelleH = 24 } = {}) {
  const zeilen = [];
  for (const a of d.neu || []) {
    const alt = alterText(a.eingang, { jetzt, status: "Neu", schwelleH });
    zeilen.push({
      id: `anfrage:${a.name}`, art: "neu", typ: T.zeilenTyp.neu,
      titel: [titelOhneArt(a.titel), personText(a)].filter(Boolean).filter((x, i, l) => l.indexOf(x) === i).join(" · ") || a.name,
      unter: alt.text, wort: alt.wort, href: `/crm/anfragen/${encodeURIComponent(a.name)}`,
      knopf: { titel: T.knopf.annehmen, aktion: "annehmen" }, objekt: { doctype: "PH Anfrage", name: a.name }, rang: 1, zeit: String(a.eingang || ""),
    });
  }
  for (const t of d.zuBestaetigen || []) {
    zeilen.push({
      id: `termin:${t.name}`, art: "bestaetigen", typ: T.zeilenTyp.bestaetigen,
      titel: `${terminZeit(t.start)} ${T.modus[t.modus] || ""} · ${personText(t) || t.titel || ""}`.replace(/\s+/g, " ").trim(),
      unter: t.email_verifiziert ? "E-Mail bestätigt" : "", wort: "", href: `/crm/termine/${encodeURIComponent(t.name)}`,
      knopf: { titel: T.knopf.bestaetigen, aktion: "bestaetigen" }, objekt: { doctype: "PH Termin", name: t.name }, rang: 2, zeit: String(t.start || ""),
    });
  }
  for (const t of d.ohneProtokoll || []) {
    zeilen.push({
      id: `protokoll:${t.name}`, art: "protokoll", typ: T.zeilenTyp.protokoll,
      titel: `${terminZeit(t.start)} · ${personText(t) || t.titel || ""}`.trim(),
      unter: T.modus[t.modus] || "", wort: "", href: `/crm/termine/${encodeURIComponent(t.name)}`,
      knopf: { titel: T.knopf.schreiben, aktion: "protokoll" }, objekt: { doctype: "PH Termin", name: t.name }, rang: 3, zeit: String(t.start || ""),
    });
  }
  for (const a of d.entfallen || []) {
    zeilen.push({
      id: `entfallen:${a.name}`, art: "entfallen", typ: T.zeilenTyp.entfallen,
      titel: [personText(a), titelOhneArt(a.titel)].filter(Boolean).join(" · ") || a.name,
      unter: a.entfallenAm ? `abgesagt ${terminZeit(a.entfallenAm, { mitTag: false, mitZeit: false })}` : "", wort: "", href: `/crm/anfragen/${encodeURIComponent(a.name)}`,
      knopf: { titel: T.knopf.neuerTermin, href: `/crm/termine/neu?anfrage=${encodeURIComponent(a.name)}` }, objekt: { doctype: "PH Anfrage", name: a.name }, rang: 4, zeit: String(a.eingang || ""),
    });
  }
  for (const k of d.aufgaben || []) {
    const f = faelligText(k.faellig, jetzt);
    const nachfassen = k.referenz_doctype === "PH Anfrage";
    zeilen.push({
      id: `aufgabe:${k.name}`, art: nachfassen ? "nachfassen" : "aufgabe", typ: nachfassen ? T.zeilenTyp.nachfassen : T.zeilenTyp.aufgabe,
      titel: k.titel || k.name, unter: f.text, wort: f.wort,
      href: k.referenz_doctype && k.referenz_name ? hrefFuer(k.referenz_doctype, k.referenz_name) : `/aufgaben/${encodeURIComponent(k.name)}`,
      knopf: { titel: T.knopf.erledigt, aktion: "aufgabeErledigt" }, objekt: { doctype: "PH Aufgabe", name: k.name }, rang: 5, zeit: String(k.faellig || ""),
    });
  }
  for (const s of d.datenschutz || []) {
    const f = alsDatum(s.frist);
    const rest = f ? Math.ceil((f.getTime() - jetzt.getTime()) / 86400000) : 0;
    zeilen.push({
      id: `dsa:${s.name}`, art: "datenschutz", typ: T.zeilenTyp.datenschutz,
      titel: `${T.dsaArt[s.art] || s.art}${s.kontaktTitel ? ` · ${s.kontaktTitel}` : ""}`,
      unter: T.datenschutz.frist(terminZeit(s.frist, { mitTag: false, mitZeit: false }), rest), wort: rest < 0 ? T.alter.ueberfaellig : "",
      href: `/crm/datenschutz/${encodeURIComponent(s.name)}`, knopf: { titel: T.knopf.oeffnen, href: `/crm/datenschutz/${encodeURIComponent(s.name)}` },
      objekt: { doctype: "PH Datenschutzanfrage", name: s.name }, rang: 6, zeit: String(s.frist || ""),
    });
  }
  return zeilen.sort((a, b) => a.rang - b.rang || a.zeit.localeCompare(b.zeit));
}

/** Kanonische Route eines CRM-Objekts (wie bereiche/crm.js `routen`). */
export function hrefFuer(doctype, name) {
  const n = encodeURIComponent(name || "");
  switch (doctype) {
    case "PH Anfrage":
      return `/crm/anfragen/${n}`;
    case "PH Kontakt":
      return `/kunden/${n}`;
    case "PH Termin":
      return `/crm/termine/${n}`;
    case "PH Beratungsgespraech":
      return `/crm/gespraeche/${n}`;
    case "PH Datenschutzanfrage":
      return `/crm/datenschutz/${n}`;
    case "PH Aufgabe":
      return `/aufgaben/${n}`;
    default:
      return `/d/${String(doctype).toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${n}`;
  }
}

/** Heute-Zeile (§ 3.1): vier Chips, 0 entfällt. */
export function heuteChips({ termine = 0, bestaetigen = 0, neu = 0, ueberfaellig = 0 } = {}) {
  const c = T.uebersicht.chips;
  return [
    termine > 0 && { id: "termine", text: c.termine(termine), href: "/crm/termine?ansicht=liste&sicht=heute", ton: "see" },
    bestaetigen > 0 && { id: "bestaetigen", text: c.bestaetigen(bestaetigen), href: "/crm/termine?ansicht=liste&sicht=bestaetigen", ton: "eiche" },
    neu > 0 && { id: "neu", text: c.neu(neu), href: "/crm/anfragen?sicht=neu", ton: "cognac" },
    ueberfaellig > 0 && { id: "ueberfaellig", text: c.ueberfaellig(ueberfaellig), href: "/aufgaben?bereich=crm", ton: "ziegel" },
  ].filter(Boolean);
}
