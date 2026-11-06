# 50 – Backend-Lücken Kassa und Faktura: Entscheidung, Umsetzung, Test

**Stand:** 2026-11-04 · Mandat Inhaber-Entscheidung Nr. 50 („Funktionen fertig denken, fehlende Backend-Teile selbst bauen“)
**Quellen:** `21-kritik-fach-kassa.md`, `10-konzept-kassa.md` §9/§12, `20-kritik-ux-kassa.md`, `10-konzept-faktura.md` §8.3/§9/§12, `32-marktfunktionen-nachtrag.md` (A1–A11, Nr. 36–49) und eigene Prüfung (österreichisches Recht, Praxis Möbelhaus).
**Schreibbereich:** nur `Backend-Import/ph_kassa/`, `Backend-Import/ph_faktura/`. Keine neuen Nummernkreise (neue DocTypes mit `autoname: hash`).

Pfadkürzel: `K/` = `Backend-Import/ph_kassa/ph_kassa/`, `F/` = `Backend-Import/ph_faktura/ph_faktura/`, `KP` = Kassa-Page `K/ph_kassa/page/ph_kassa/ph_kassa.py`.
Tests: `TK` = `K/tests/test_luecken.py`, `TF` = `F/tests/test_luecken.py` (ohne Site). „Site“ = nur mit Frappe-Site prüfbar (FrappeTestCase noch zu schreiben, s. Offen).

## Zählung

| | Kassa | Faktura | Summe |
|---|---|---|---|
| Lücken geprüft | 57 | 37 | **94** |
| gebaut | 47 | 23 | **70** |
| schon vorhanden | 7 | 8 | **15** |
| bewusst nicht | 3 | 6 | **9** |

## Kassa

| # | Lücke (Quelle) | Entscheidung | Umgesetzt in | Test |
|---|---|---|---|---|
| K1 | Mitarbeiter-Storno eigener Belege, Server verweigert (21 P1/F1) | gebaut | `K/rksv/buchung.py storniere_beleg(erlaube_mitarbeiter, freigabe_von)`, `K/logik/regeln.py storno_freigabe`, `KP storno(beleg, grund, freigabe)`, Einstellung `storno_mitarbeiter_bis_cent` | TK test_storno_freigabe |
| K2 | Kassenbuch ohne Bar-Belege, Bestand falsch (21 P2/F2/P-E) | gebaut | `PH Kassenbeleg._kassenbuch_buchen` (Bareinnahme/Barausgabe idempotent), `ph_kassenbuch.buchen(waehrung, ignore_permissions)`, `letzter_bestand(kasse, waehrung)`, `bestand_vor` | Site |
| K3 | Anfangsbestand immer 0 (21 P3/F3/P-F) | gebaut | `PH Kassenabschluss.anfang_ermitteln`, Felder `anfang_quelle/anfang_grund/anfang_hinweis`, Änderung nur Leitung mit Grund (`zaehlen`) | TK test_anfangsbestand |
| K4 | Rechnung über 400 € aus der Kassa (21 P4/P-A/R1, § 11 Abs 6 UStG) | gebaut | `logik/regeln.py`, `KP kunde_anlegen`, `KP beleg_buchen(empfaenger, rechnung_erstellen)` → `F/api create_invoice_from_receipt`, Feld `barverkauf_rechnung`, A4 mit Anschrift/UID/Leistungsdatum, Grenze max. 40000 validiert | TK test_rechnung_ab_400 |
| K5 | UID Empfänger über 10.000 € | gebaut | `regeln.pruefe` (`uid_empfaenger_ab_cent`) | TK (Regelpfad) |
| K6 | Einzweck/Mehrzweck-Gutschein (21 P5/F4/R10, A9) | gebaut | Satz serverseitig in `KP beleg_buchen`; Einzweck = Position „Gutschein Einloesung“, Mehrzweck = Zahlart; `regeln` verbietet falschen Weg | TK test_gutschein_regeln |
| K7 | Gutschein-Verkauf erzeugte keinen PH Gutschein (eigene Prüfung) | gebaut | `PH Kassenbeleg._gutscheine_ausstellen` → `ph_shop ausstellen(kanal="Kassa")`, Code nur im Ergebnis `gutschein_codes` | Site |
| K8 | Verkauf + Einlösung im selben Bon (21 §5) | gebaut | `regeln.pruefe` | TK test_gutschein_regeln |
| K9 | Storno mit Gutschein-Einlösung bucht nicht zurück (21 P8) | gebaut | `_gutscheine_buchen` → `storniere_einloesung`; Storno eines Verkaufs sperrt den Gutschein, Storno verboten wenn eingelöst | Site |
| K10 | UVA-Report zählt Zahlungen auf Rechnung doppelt (21 F5/P6) | gebaut | `K/ph_kassa/report/ph_kassenumsatz_nach_steuersatz` mit `F/rechenwerk/uva.py` | TF test_abgrenzung |
| K11 | Retoure/Teilretoure (21 P-B/P7) | gebaut | Positionsart `Retoure`, `K/logik/retoure.py`, `KP retoure_vorbereiten`, Prüfung in `beleg_buchen(retoure_original)`, Felder `bezug_zeile`, `rueckzahlung_pruefen` | TK TestRetoure, test_retoure_* , test_rueckzahlung_gemischt |
| K12 | Retoure gegen Gutschein (Beleg 0,00 €) | gebaut | `zahlarten_pruefen` erlaubt 0 € ohne Zahlart | TK test_retoure_gegen_gutschein_nullbeleg |
| K13 | Terminal-Rückerstattung fehlt (21 F8/P9) | gebaut | `K/terminal.py erstatten` (Mock + Stripe Refund), `PH Kassenbeleg._erstattung_buchen` → `ph_shop.zahlung.erstatte`, Feld `terminal_refund`, `erstattung_von_zahlung` | TK test_erstatten |
| K14 | Bon zeigt Klarnamen (21 R2/P10) | gebaut | `K/druck/drucker.py bediener_kurz` | Site |
| K15 | Faktura-Rückmeldung (Anzahlungsrechnung) fehlt im Ergebnis (21 P11/P-D) | gebaut | `flags.ph_faktura` → `beleg_buchen` Ergebnis `faktura` | Site |
| K16 | Jahresbeleg-/Startbeleg-Prüfung bestätigen (21 P12/P-H, RKSV § 6/§ 8) | gebaut | `PH Kasse.startbeleg_geprueft / jahresbeleg_geprueft` + Buttons | Site |
| K17 | PIN/Geräte als „fehlt“ im Konzept (21 P13/F10) | vorhanden | `ph_core.api.bediener.verify_pin`, `PH Geraet`; Kassa nutzt `pin_passt` in `K/dienste.py freigabe_pruefen` | – |
| K18 | Kontakt-Anonymisierung (21 P14/R9) | gebaut | `K/dienste.py kontakt_anonymisieren` (Aufruf aus ph_crm nötig) | Site |
| K19 | `idempotency_key`, `kunde_name`, `zahlungsplan_position`, Kundenkarte nicht durchgereicht (10 §9.1) | gebaut | `KP beleg_buchen` | Site |
| K20 | Zahlungsplan-Zeilen fehlen in `_auftraege` | gebaut | `KP _zahlungsplan`, `KP zahlungsplan(auftrag)` | Site |
| K21 | `code_erkennen` | gebaut | `K/logik/codes.py`, `KP code_erkennen` | TK TestCodes |
| K22 | Rabattfelder + Leitungsfreigabe | gebaut | Position `listenpreis_cent, rabatt_promille, rabatt_cent, rabatt_gesamt_cent, rabatt_grund`; `rabatt_berechnen`, `rabatt_freigabe_noetig`; Freigabe per PIN | TK test_rabatt_* |
| K23 | Leitungs-PIN-Freigabe am Gerät | gebaut | `K/dienste.py freigabe_pruefen`, `KP leitung_freigabe_pruefen`, Felder `freigabe_von/freigabe_gruende` | Site |
| K24 | Trinkgeld | bewusst nicht | Trinkgeld an Mitarbeiter ist kein Umsatz (§ 3 Abs 1 Z 16a EStG); Einstellung read_only mit Begründung | – |
| K25 | Schnelltasten | gebaut | DocType **PH Kassa Schnelltaste**, `KP schnelltasten`, im `kontext` | Site |
| K26 | Offline-Katalog/Kunden-Cache | gebaut | `KP kassen_katalog(stand)`, `kassen_kunden(stand)` (ohne Telefon/E-Mail) | Site |
| K27 | Notbetrieb/Nacherfassung (21 R4, RKSV § 17) | gebaut | `K/logik/notbetrieb.py`, `K/dienste.py notbelege_einspielen`, `KP notbelege_einspielen`, Felder `notbeleg_nr/notbeleg_zeitpunkt`, Quelle `Kassa-Notbetrieb` | TK TestNotbetrieb |
| K28 | Offline-Freigabe je Gerät | gebaut | Custom Fields `PH Geraet.ph_kassa_offline_erlaubt/_limit_cent` (`K/fixtures/custom_field.json`) | – |
| K29 | Kassenausfall (nicht SEE) Beginn/Ende, > 48 h | gebaut | `PH Kasse.kassenausfall_melden / kassenausfall_beenden` | Site |
| K30 | `karte_automatisch_buchen` | gebaut | Einstellung (UI-Verhalten Next) | – |
| K31 | Abschluss für Vortag über Page | gebaut | `KP abschluss_*(datum)` (Vortag nur Leitung) | Site |
| K32 | Nebenbuchungs-Status / Belege mit Hinweis | gebaut | Felder `nebenbuchung_status/_hinweis`, Report **PH Kassa Klaerfaelle**, ToDo Leitung | Site |
| K33 | Terminalzahlungen ohne Beleg | gebaut | DocType **PH Terminal Vorgang**, `kontext.offene_kartenzahlungen`, Report Klärfälle | Site |
| K34 | Terminal Abbruch/Timeout (20 Z2/E3) | gebaut | `terminal.zeitueberschreitung`, `KP terminal_status` bricht nach `terminal_timeout_s` ab | TK test_zeitueberschreitung |
| K35 | PDF-Stapel/ZIP | bewusst nicht | Frappe-Listendruck „PDF“ deckt es; Next-Hintergrundjob später | – |
| K36 | Kundendisplay mit Vornamen (21 F9) | gebaut | Einstellung `kundendisplay_anrede` | – |
| K37 | Tageswechsel nach Mitternacht (21 §6) | gebaut | `tageswechsel_uhrzeit`, `logik.abschluss.geschaeftstag/zeitraum`, Feld `geschaeftstag`, Sperre/Abschluss/Belege heute | TK test_geschaeftstag_und_zeitraum |
| K38 | Schublade bei Bar-Storno, „Lade öffnen“ (20 Z7) | gebaut | `KP storno` (schublade), `KP lade_oeffnen` + Ereignis „Lade geoeffnet“, `drucker.schublade_auftrag` | Site |
| K39 | Fremdwährung CHF (21 §5) | gebaut | Zahlung `fremdwaehrung/fremd_gegeben_cent/kurs_mikro`, Kurs nur vom Server, 5-Rappen-Regel, CHF-Lade im Abschluss + Kassenbuch CHF | TK test_chf_bar_rueckgeld_eur, test_chf_und_retoure_im_soll |
| K40 | Bar ab 10.000 € Identität (§ 365m ff. GewO) | gebaut | `regeln.pruefe`, Felder `id_pruefung_*` (permlevel 1) | TK test_bar_ab_10000_identitaet |
| K41 | Anzahlung ohne AB / Überzahlung (21 §5) | gebaut | `regeln.pruefe` (Fehler bzw. Freigabe „ueberzahlung“) | TK test_anzahlung_nur_mit_auftrag_und_ueberzahlung |
| K42 | FAGG-Außergeschäftsraum-Hinweis (21 P-I) | gebaut | `regeln.pruefe` aus `PH Auftragsbestaetigung.vertragsort/fagg_frist_ende` (Felder vorhanden) | TK (gleicher Test) |
| K43 | Teil-/Schlusszahlung im Satz der Rechnung (21 P-C) | gebaut | `KP _rechnung_steuersatz`, Satz serverseitig gesetzt | Site |
| K44 | Belegerteilungspflicht bei Druckausfall (§ 132a BAO) | gebaut | `beleg_buchen` → `beleg_aushaendigen`, Display-Zustand „beleg“ mit QR | Site |
| K45 | Startbeleg, Monats-/Jahres-/Schlussbeleg, SEE-Ausfall mit Sammelbeleg/Nachsignatur, DEP-Export | vorhanden | `K/rksv/buchung.py`, `K/rksv/tasks.py`, `K/rksv/dep.py`, `PH DEP Export` | `K/tests/test_rksv.py` |
| K46 | Trainingsbuchung | vorhanden | Belegart Trainingsbeleg, TRA-Kennwort | test_rksv |
| K47 | FinanzOnline-Meldung (SEE/Kasse, Ausfall > 48 h) | vorhanden (Aufgabe/Ereignis); API bewusst nicht | FinanzOnline-Webservice braucht Teilnehmerzugang des Inhabers – Meldung manuell, Registrierungsdaten über `PH Kasse.registrierungsdaten` | – |
| K48 | Teilzahlung mehrere Zahlarten, Rückgeld | vorhanden | `logik/betraege.zahlarten_pruefen` | test_betraege |
| K49 | Kassensturz jederzeit | gebaut | `KP kassensturz` + Ereignis „Kassensturz“ | Site |
| K50 | Einlage/Entnahme; Tresor-Entnahme beim Abschluss (21 P-G) | vorhanden / gebaut | `KP kassenbuch_buchen`; `KP abschluss_abschliessen(tresor_entnahme_cent)` | Site |
| K51 | Kunde ohne Daten (Barverkauf) | vorhanden | `kontakt` optional; ab 400 € erzwingt K4 | – |
| K52 | Storno vs. Retoure | gebaut | Storno = Gegenbeleg STO (Fehlbuchung), Retoure = neuer Geschäftsvorfall (K11) | TK |
| K53 | Kundenkarte-Scan + Vorteil am Beleg | gebaut | `KP beleg_buchen(kundenkarte, kundenkarte_vorteile)` → Feld `ph_kundenkarte_kartennummer`, `ph_kundenkarte.api.redeem_benefit` | Site |
| K54 | Storno am Folgetag im Abschluss sichtbar (21 §5) | gebaut | `ph_kassenabschluss.stornos_spaeter` in `zusammenfassung` | Site |
| K55 | Tageslosung an Steuerberater | gebaut | Report **PH Kassa Tageslosung** (Erlös je Satz, Verrechnungen, Zahlarten) | Site |
| K56 | Belegfelder nach Submit änderbar (21 §6) | gebaut | `kunde_name`, `zahlungsplan_position` read_only | check.py |
| K57 | Band SEE-Ausfall ab 24 h orange | bewusst nicht im Backend | Daten in `rksv.api.kassen_status` vorhanden; Darstellung Next | – |

## Faktura

| # | Lücke (Quelle) | Entscheidung | Umgesetzt in | Test |
|---|---|---|---|---|
| F1 | Anzahlungs-/Teil-/Schlussrechnung mit Abzug | vorhanden | `PH Auftragsbestaetigung.rechnung_erstellen`, `rechenwerk/anzahlung.py` | test_anzahlung |
| F2 | Trockenlauf Teil-/Schlussrechnung (10 §12 Nr. 1) | gebaut | `PH Auftragsbestaetigung.rechnung_vorschau` (Savepoint + Rollback) | Site |
| F3 | UVA ohne Kassenumsätze (eigene Prüfung – schwer) | gebaut | `PH UVA Auswertung.berechne` + `F/rechenwerk/uva.py kassa_umsaetze`, `ar_kassenbelege`, Schalter `kassa_in_uva` | TF test_abgrenzung |
| F4 | Barverkaufsrechnung zum Kassenbeleg doppelt in UVA | gebaut | Rechnung `kassenbeleg`, UVA überspringt | Site |
| F5 | Kassa-Anzahlung ohne Anzahlungsrechnung → Schlussrechnung zieht nicht ab, USt doppelt | gebaut | `F/ph_faktura/kassa.py _anzahlungsrechnung_stellen`, `PH Auftragsbestaetigung.anzahlungsrechnungen_anlegen(ignore_permissions)` | Site |
| F6 | Storno einer Kassa-Anzahlung | gebaut | `F/ph_faktura/kassa.py _storno` (negative Zahlung „KB-Storno:“, Zahlungsplan zurück) | Site |
| F7 | Rechnung aus Kassenbeleg (21 P4) | gebaut | `F/api create_invoice_from_receipt(kassenbeleg, kontakt)` | Site |
| F8 | Skonto (Rechnung, Bank) | gebaut | `F/rechenwerk/skonto.py`, Rechnung `skonto_*`, `zahlung_erfassen(skonto)`, `PH Bankumsatz.zuordnen(skonto)`, UVA-Minderung im Zahlungsmonat (`uva.skonto_aufteilen`) | TF TestSkonto, test_skonto_aufteilen |
| F9 | Mahnwesen AT: Basiszins B2B, 40 € Pauschale | gebaut | `F/rechenwerk/mahnen.py mahnbetrag(pauschale_bereits)`, `zinssatz_unternehmer_bp`, Felder `basiszinssatz_bp`, `pauschale_unternehmer_cent`, Mahnung `zinssatz_bp/pauschale_cent` | TF TestMahnenAT |
| F10 | Mahnvorschau ohne Anlage | gebaut | `PH Rechnung.mahnvorschau` | Site |
| F11 | Mahnlauf mit Auswahl/Stichtag | gebaut | `mahnlauf_starten(nur_vorschlag, rechnungen, stichtag)`, `tasks.mahnlauf(rechnungen)` | Site |
| F12 | Gutschrift/Storno | vorhanden | `PH Gutschrift` | test_ph_rechnung |
| F13 | Rechnungskorrektur | gebaut | `PH Rechnung.korrigieren(grund)` (Storno-Gutschrift + Entwurf, Zahlungen als Verrechnung), Felder `korrektur_von/korrigiert_durch` | Site |
| F14 | Reverse Charge / igL / Ausfuhr | vorhanden | `ust_fall`, `rechenwerk/steuer.py` | test_steuer |
| F15 | Ausfuhr-/Gelangensnachweis | gebaut | Felder `ausfuhr_mrn`, `ausfuhr_nachweis`, `gelangensbestaetigung`, `nachweis_status` | Site |
| F16 | ebInterface 6.1 inkl. Bund (Lieferantennummer, Auftragsreferenz, Positionsnummer) | gebaut | `F/rechenwerk/erechnung.py ebinterface`, `PH Rechnung.erechnung_erzeugen`, Felder `erechnung_*`, `lieferantennummer`, `bestellreferenz` | TF test_ebinterface |
| F17 | ZUGFeRD/XRechnung | gebaut (XML) | `erechnung.cii` (EN16931/XRechnung 3.0, Leitweg-ID) | TF test_cii_profile, test_steuerfrei_braucht_grund_und_uid |
| F18 | ZUGFeRD Hybrid-PDF (PDF/A-3) | bewusst nicht | braucht PDF/A-3-Bibliothek (factur-x) auf dem Server; XML-Anhang genügt für XRechnung/Objektkunden | – |
| F19 | PEPPOL | bewusst nicht | Zugangspunkt-Vertrag nötig; Einreichung Bund über e-rechnung.gv.at (Hinweis im Ergebnis) | – |
| F20 | Rundung | vorhanden | `rechenwerk/steuer.rund/summen` | test_steuer |
| F21 | Bank camt.053 mit Vorschlägen | vorhanden | `rechenwerk/camt.py`, PH Bankumsatz | test_camt |
| F22 | Bank: Ausgang → Gutschrift-Erstattung, Mehrfachzuordnung | gebaut | `PH Bankumsatz.offene_belege` (Gutschrift Rückzahlung), `zuordnen_mehrere` | Site |
| F23 | MT940/CSV-Import | bewusst nicht | österreichische Banken liefern camt.053; kein Bedarf belegt | – |
| F24 | Offene-Posten-Liste | vorhanden | Report PH Offene Posten | – |
| F25 | Kontenrahmen BMD/DATEV | vorhanden | `rechenwerk/export.py`, Konten in PH Faktura Einstellungen | test_export |
| F26 | RZL-Export | gebaut | `export.rzl_csv`, Format „RZL CSV“ im Export-Lauf | TF test_rzl |
| F27 | DATEV-Formatversion 12/13 (32 Nachtrag) | gebaut | `datev_buchungsstapel(formatversion)`, Einstellung `datev_formatversion` | test_export (bestehend) |
| F28 | UVA-Kennzahlen | vorhanden | PH UVA Auswertung | test_ph_export_lauf |
| F29 | Pflichtangaben-/Nummernvorschau (10 §12 Nr. 1) | gebaut | `PH Rechnung.pflichtangaben_vorschau`, `nummer_vorschau`, `naechste_nummer` | Site |
| F30 | Als gesendet markieren (10 §12 Nr. 5) | gebaut | `als_gesendet_markieren(kanal)` an Rechnung, Gutschrift, Angebot; Feld `versandkanal` (AB: bewusst nicht, AB hat kein Versandfeld) | Site |
| F31 | Journal-Kette prüfen whitelisted (10 §12 Nr. 6) | gebaut | `F/api journal_kette_pruefen` | Site |
| F32 | Schalter „Methode/Steuercodes bestätigt“ | gebaut | Felder `methode_bestaetigt/_am/_durch` | – |
| F33 | SEPA pain.001 aus Zahllauf | gebaut | `F/rechenwerk/sepa.py`, `F/api sepa_zahllauf` | TF TestSepa |
| F34 | Zahlungsplan mit Erinnerung (32 Nachtrag) | gebaut | `F/ph_faktura/tasks.py zahlungsplan_erinnern` (06:00), Einstellung `zahlungsplan_erinnerung_tage` | Site |
| F35 | UVA-Druckformat, Belegliste je KZ, Liquiditätsvorschau | bewusst nicht (dieser Lauf) | Report-Druck „PH UVA Zuarbeit“ genügt vorerst; Kandidaten nächster Lauf | – |
| F36 | Stripe-Auszahlung abgleichen, Bankspesen | bewusst nicht | kein Hauptbuch (Export an StB); Stripe-Daten liegen in ph_shop | – |
| F37 | E-Rechnung-Eingang / Belegerkennung ER | bewusst nicht | eigenes Paket (Parser/OCR), außerhalb dieses Auftrags | – |

## Bedarf an andere Apps (nicht selbst gebaut)

| App | Bedarf |
|---|---|
| ph_shop | `PH Gutschein`: Steuersatz bei Einzweck-Ausgabe speichern (`ust_satz_promille`), damit die Einlösung den Satz der Ausgabe nimmt (heute Kassa-Standardsatz); `ausstellen` idempotent über `idempotency_key` (Kassa prüft heute selbst); `zahlung.erstatte` für Terminal-Refunds (`stripe_refund`) bestätigen; Stripe-Auszahlung ↔ Bank. |
| ph_crm | Anonymisierung ruft `ph_kassa.dienste.kontakt_anonymisieren(kontakt)` auf; Ausweisdaten bleiben am Beleg (permlevel 1). |
| ph_core | keine neuen Nummernkreise; PIN/Gerät genutzt wie vorhanden. |
| ph_kundenkarte | Bestätigen, dass `redeem_benefit` serverseitig (ohne HTTP-Kontext) aus der Kassa aufrufbar ist. |

## Offene Rechtsfragen (Steuerberater, über Inhaber)

1. Retoure als **negativer Standardbeleg** (Umsatzzähler sinkt) statt Stornobeleg – so umgesetzt; bestätigen.
2. Überweisungsanteile im Umsatzzähler (README WP10a) – weiterhin offen.
3. Gutscheinart Einzweck vs. Mehrzweck als Standard; Satz bei Einzweck.
4. Kassa-Anzahlung: automatische Anzahlungsrechnung + Mindest-Ist (§ 19 Abs 2 Z 1 lit a UStG); Rückzahlung bei Storno als negative Zahlung im Storno-Monat.
5. Skonto: Aufteilung nach Sätzen der Rechnung, Korrektur im Monat der Zahlung (§ 16 UStG); Skonto-Konto `erloesminderung_skonto_konto` (Exportzeile Skonto noch nicht gebaut).
6. Notbelege: Nacherfassung einzeln mit Erfassungszeitpunkt als Belegdatum und Notbeleg-Zeitpunkt als Zusatz.
7. CHF: Kursquelle (täglicher Kurs, manuell), Kurs am Beleg ausgewiesen.
8. Barverkaufsrechnung zusätzlich zum Kassenbeleg (Doppelbeleg zulässig?), Rundungsdifferenz netto/brutto (Kassenbeleg maßgeblich).
9. Verzugszinsen B2B (Basiszins + 9,2 Pp) und 40 € Pauschale **statt** Stufen-Gebühr der ersten Mahnung.
10. Kontenrahmen/Steuercodes BMD, RZL-Spaltenformat, DATEV-Formatversion 12 oder 13.
11. Identitätsfeststellung ab 10.000 € bar: Aufbewahrungsdauer und Umfang (Ausweiskopie?) – DSGVO.
12. Form des Ausfuhrnachweises (Ausgangsvermerk e-zoll) und des Gelangensnachweises.

## Offen / Hinweise

- FrappeTestCase-Tests für die Site-Pfade (Kassenbuch, Retoure mit Refund, Gutschein ausstellen, Anzahlungsrechnung automatisch, UVA mit Kassa, Rechnungskorrektur) sind noch zu schreiben; Staging-Lauf nötig.
- Felder sind per Migration neu; `bench migrate` vor Nutzung.
