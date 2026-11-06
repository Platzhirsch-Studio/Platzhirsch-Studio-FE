// Aufgaben-Vorlagen für Einstellen und Austritt (Konzept § 6.3/§ 6.4). Werden als PH Aufgabe angelegt
// (Kennung „personal:onboarding“ / „personal:austritt“ im Titel, bis ph_crm ein Kennungsfeld hat).
// Rechtsgrundlagen nur als Hinweis – keine Rechtsberatung. Reines Modul.

export const ONBOARDING = Object.freeze([
  { id: "oegk", titel: "ÖGK-Anmeldung vor Arbeitsantritt", grundlage: "ASVG § 33", tageVorEintritt: 1 },
  { id: "dienstzettel", titel: "Dienstzettel übergeben", grundlage: "AVRAG § 2", tageNachEintritt: 0 },
  { id: "datenschutz", titel: "Datenschutzinformation für Beschäftigte übergeben", grundlage: "Art. 13 DSGVO", tageNachEintritt: 0 },
  { id: "unterweisung", titel: "Unterweisung Arbeitssicherheit", grundlage: "ASchG § 14", tageNachEintritt: 0 },
  { id: "schluessel", titel: "Schlüssel und Arbeitsmittel ausgeben", tageNachEintritt: 0 },
  { id: "kassa", titel: "Einweisung Kassa", tageNachEintritt: 3 },
  { id: "erstgespraech", titel: "Erstgespräch nach vier Wochen", tageNachEintritt: 28 },
]);

export const AUSTRITT = Object.freeze([
  { id: "zugang", titel: "Benutzer deaktivieren und Kassa-PIN löschen", amAustritt: true, an: "admin" },
  { id: "arbeitsmittel", titel: "Arbeitsmittel zurück (Schlüssel, Fahrzeug, Tablet)", amAustritt: true },
  { id: "oegk", titel: "ÖGK-Abmeldung binnen 7 Tagen", grundlage: "ASVG § 33", tageNachAustritt: 7 },
  { id: "zeugnis", titel: "Dienstzeugnis ausstellen", grundlage: "ABGB § 1163", tageNachAustritt: 14 },
  { id: "endabrechnung", titel: "Endabrechnung an die Lohnverrechnung", tageNachAustritt: 3 },
]);

/** Fälligkeit (ISO) einer Vorlage relativ zu Eintritt bzw. Austritt. */
export function faelligAm(v, stichtag, plusTage) {
  if (v.amAustritt) return stichtag;
  if (v.tageVorEintritt) return plusTage(stichtag, -v.tageVorEintritt);
  return plusTage(stichtag, v.tageNachEintritt ?? v.tageNachAustritt ?? 0);
}
