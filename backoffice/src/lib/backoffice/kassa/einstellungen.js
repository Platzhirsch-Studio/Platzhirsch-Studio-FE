// Kassa – Standardwerte der Kassa-Einstellungen im Mock (Team B-KAS). Werte wie die Vorschläge in
// 10-konzept-kassa.md (Rechnung über 400 €, Toleranz 1 €, Storno durch Mitarbeiter bis 50 €, Rabatt-Freigabe ab 10 %).
// Eigenes Modul, damit Seed und Mock es ohne Kreis-Import nutzen. Reines Modul.

export const STANDARD_EINSTELLUNGEN = Object.freeze({
  standard_kasse: "KASSE-LOCHAU-01",
  standard_steuersatz: "Normal 20",
  steuersatz_anzahlung: "Normal 20",
  gutschein_art: "Mehrzweck",
  barverkauf_rechnung_ab_cent: 40000,
  automatisch_drucken: 1,
  kundendisplay_aktiv: 1,
  kundendisplay_text: "Schön, dass Sie da sind.",
  kundendisplay_anrede: 0,
  differenz_toleranz_cent: 100,
  differenz_warnung_cent: 2000,
  abschluss_unterschrift_pflicht: 1,
  terminal_testmodus: 1,
  storno_mitarbeiter_bis_cent: 5000,
  rabatt_freigabe_ab_promille: 100,
  retoure_bar_nur_leitung: 1,
  retoure_standard: "Gutschein",
  bar_identitaet_ab_cent: 1000000,
  uid_empfaenger_ab_cent: 1000000,
  karte_automatisch_buchen: 0,
  terminal_warnung_s: 60,
  terminal_timeout_s: 180,
  bon_kopfzeile: "Platzhirsch Home Living · Lochau",
  bon_fusstext: "Danke für Ihren Einkauf.",
  beleg_email_betreff: "Ihr Beleg von Platzhirsch",
  chf_annahme_aktiv: 0,
});
