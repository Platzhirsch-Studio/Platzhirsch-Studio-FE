// Sichtbarkeit „Art der Abwesenheit“ (Konzept § 1.2, E2, Art. 9 DSGVO) – verbindlich und serverseitig.
// Jede Server-Funktion, die Abwesenheiten oder Krankmeldungen ausliefert, ruft maskiereAbwesenheit() bzw.
// krankAlsAbwesenheit() VOR der Serialisierung. Nie per CSS. Reines Modul, unit-getestet.
//
// Zwei Klassen: Leitung/GF sehen die Art; alle anderen sehen bei fremden Personen nur „abwesend“ + Zeitraum +
// Status – ohne Anmerkung, Ablehnungsgrund, Vertretung. Eigene Datensätze: alles. Selbstservice sieht fremde
// Personen nur, wenn die Fähigkeit „Teamkalender im Selbstservice“ an ist (sonst gar nicht).
// Strenger als ph_personal.api.teamkalender (dort sehen Nicht-Leitungen Urlaub/Fortbildung namentlich):
// Lockerung nur auf Entscheidung des Inhabers (Konzept E2, Inhaber-Frage).

import { darfArtSehen } from "./rollen.js";

export const ART_KUERZEL = Object.freeze({
  Urlaub: "UR",
  Zeitausgleich: "ZA",
  Fortbildung: "FB",
  Pflegefreistellung: "PF",
  Sonderurlaub: "SU",
  Unbezahlt: "UB",
  Berufsschule: "BS",
  Karenz: "KA",
  Mutterschutz: "MS",
  "Zivil-/Praesenzdienst": "ZD",
  Krankenstand: "KR",
  abwesend: "AB",
  Betriebsruhe: "BR",
});

/** Material je Art im Kalender (nie Rot; Krankenstand neutral mit Symbol). */
export const ART_MATERIAL = Object.freeze({
  Urlaub: "salbei",
  Zeitausgleich: "see",
  Fortbildung: "messing",
  Berufsschule: "messing",
  Pflegefreistellung: "eiche",
  Sonderurlaub: "nuss",
  Unbezahlt: "stein",
  Karenz: "stein",
  Mutterschutz: "stein",
  "Zivil-/Praesenzdienst": "stein",
  Krankenstand: "stein",
  abwesend: "stein",
});

export const kuerzelFuer = (art) => ART_KUERZEL[art] || "AB";

/** Felder, die fremde Betrachter ohne Art-Recht sehen dürfen (feste Liste). */
const OFFEN = ["name", "mitarbeiter", "mitarbeiter_name", "von", "bis", "halbtags", "status"];

/**
 * @param {object} zeile  PH Abwesenheit (oder bereits umgewandelte Krankmeldung)
 * @param {{rolle:string|null, eigenerMitarbeiter?:string|null, teamSelbstservice?:boolean}} opt
 * @returns {object|null}  null = darf gar nicht gesehen werden
 */
export function maskiereAbwesenheit(zeile, { rolle, eigenerMitarbeiter = null, teamSelbstservice = false } = {}) {
  if (!zeile) return null;
  const eigen = Boolean(eigenerMitarbeiter) && zeile.mitarbeiter === eigenerMitarbeiter;
  if (eigen || darfArtSehen(rolle)) return { ...zeile, maskiert: false, eigen };
  if (rolle === "selbst" && !teamSelbstservice) return null;
  if (!rolle) return null;
  const out = { maskiert: true, eigen: false, art: "abwesend" };
  for (const f of OFFEN) if (f in zeile) out[f] = zeile[f];
  // Status einer Krankmeldung verrät die Art („Gemeldet“) – fremde sehen nur den Abwesenheits-Status.
  if (zeile.quelle === "krank") out.status = "Genehmigt";
  return out;
}

/** Liste maskieren (fällt bei `null` heraus). */
export function maskiereListe(zeilen = [], opt = {}) {
  return zeilen.map((z) => maskiereAbwesenheit(z, opt)).filter(Boolean);
}

/**
 * PH Krankmeldung → Abwesenheits-Zeile (für Kalender und Listen), bevor maskiert wird.
 * Offenes Ende (bis_offen) läuft bis `horizont` (Ende des betrachteten Zeitraums).
 */
export function krankAlsAbwesenheit(k, horizont) {
  const bis = k.bis || (Number(k.bis_offen) ? horizont : k.bis_voraussichtlich) || horizont || k.von;
  return {
    name: k.name,
    quelle: "krank",
    mitarbeiter: k.mitarbeiter,
    mitarbeiter_name: k.mitarbeiter_name,
    art: "Krankenstand",
    von: k.von,
    bis,
    bis_offen: Number(k.bis_offen) ? 1 : 0,
    status: k.status,
    arbeitsunfall: k.arbeitsunfall ? 1 : 0,
    notiz: k.notiz || "",
  };
}

/** Darf eine Zeile (DOM/Antwort) Gesundheitsbegriffe enthalten? Für Tests: Text eines maskierten Datensatzes. */
export const VERBOTEN_FUER_FREMDE = Object.freeze(["Krank", "Pflege", "Sonderurlaub", "KR"]);
