// Texte der Anmeldung, Kurzsitzung (G-25) und Vorlieben. Du-Form, keine Ausrufezeichen, keine Floskeln (Q-K1/Q-K2).
// Reines Modul.

export const AUTH_TEXTE = Object.freeze({
  storeNichtErreichbar: "Der Sitzungsspeicher ist gerade nicht erreichbar. Bitte in einer Minute erneut versuchen.",

  // Kurzsitzung / Freigabe
  zweckUnbekannt: "Diese Freigabe ist nicht vorgesehen.",
  personFehlt: "Bitte die Person wählen, die freigibt.",
  pinFehlt: "Bitte die PIN eingeben.",
  passwortFehlt: "Bitte das Passwort eingeben.",
  pinFormat: "Die PIN hat 4 bis 6 Ziffern.",
  keinRecht: (titel) => `Diese Person darf „${titel}“ nicht freigeben.`,
  selbstFreigabe: "Die Freigabe gibt eine andere Person.",
  zuVieleVersuche: (minuten) => `Zu viele Fehlversuche. Bitte in ${minuten} ${minuten === 1 ? "Minute" : "Minuten"} erneut versuchen.`,
  abgelaufen: "Die Freigabe ist abgelaufen. Bitte erneut freigeben.",
  falscherZweck: "Diese Freigabe gilt für eine andere Aktion.",
  fremdeSitzung: "Diese Freigabe gehört zu einem anderen Arbeitsplatz.",
  passwortNoetig: "An diesem System gibt die Leitung mit ihrem Passwort frei. Die Freigabe per PIN folgt mit einem Backend-Update.",
  passwortAus: "Die Freigabe mit Passwort ist abgeschaltet. Bitte die Leitung im Büro anmelden lassen.",
  freigegebenVon: (name) => `Freigegeben von ${name}`,

  // Vorlieben
  vorliebeUngueltig: "Diese Einstellung gibt es nicht.",
  vorliebeGespeichert: "Einstellung gespeichert",
  theme: { system: "System", hell: "Hell", dunkel: "Dunkel" },
  dichte: { auto: "Automatisch", kompakt: "Kompakt", komfortabel: "Komfortabel" },
  einzeltasten: "Einzeltasten-Kürzel",
});

/** Titel der Freigabe-Zwecke (Anzeige im Freigabe-Schritt und im Protokoll). */
export const ZWECK_TITEL = Object.freeze({
  "kassa.freigabe": "Freigabe Kassa",
  "personal.stempeln-fuer": "Stempeln für diese Person",
  "logistik.leitungsfreigabe": "Freigabe Logistik",
  "projekte.leitungsfreigabe": "Freigabe Projekte",
});
