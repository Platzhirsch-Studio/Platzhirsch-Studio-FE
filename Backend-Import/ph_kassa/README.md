# Platzhirsch Kassa (`ph_kassa`)

Registrierkasse Showroom nach RKSV 2016 / BAO § 131b: Belegkette, Signatur (A-Trust), DEP7-Export, Kassen-Oberfläche, Tagesabschluss, Stripe Terminal.

- Arbeitspaket, Doctypes, Workflows, Schnittstellen: `../PLAN.md`, Abschnitt „Platzhirsch Kassa“.
- Namensschema, Rollen, Vorlagen, Tests: `../CONVENTIONS.md`.
- Voraussetzungen: `frappe`, `ph_core`, `ph_crm`, `ph_sortiment`, `ph_shop`, `ph_faktura` (Reihenfolge in `../README.md`).

## Installation (Staging, nie direkt produktiv)

```bash
bench get-app /pfad/zu/Backend-Import/ph_kassa
bench --site <site> install-app ph_kassa
bench --site <site> migrate
```

## Rollen

`PH Kassa Mitarbeiter` · `PH Kassa Leitung`

## RKSV-Kern (WP10a) – Belegkette, Signatur, DEP, Ausfall

**Risikohinweise (bitte lesen):** Die RKSV-Konformität verantwortet der Unternehmer, nicht die Software. Es gibt in Österreich keine Kassen-Zertifizierung – jede Abweichung von der BMF-Detailspezifikation macht Belege ungültig. Deshalb: (1) A-Trust-Vertrag (a.sign RK Online) und FinanzOnline-Registrierung von SEE **und** Kasse durch den Inhaber, (2) **Startbeleg mit der BMF Belegcheck-App prüfen**, bevor der erste echte Beleg gebucht wird, (3) Jahresbeleg bis 15.02. prüfen, (4) Steuerberater einbinden (Belegarten, Steuersätze, Gutscheine Mehrzweck/Einzweck, Behandlung von Überweisungen), (5) bestehende Registrierkasse bleibt bis zur erfolgreichen Prüfung in Betrieb, (6) AES-Schlüssel und DEP-Exporte extern sichern (Verlust = DEP nicht prüfbar; Aufbewahrung 7 Jahre). Quellen: `referenz/QUELLEN.md`.

### DocTypes

| DocType | Zweck |
|---|---|
| `PH Kasse` | Kassen-ID (Name), SEE-Link, AES-Schlüssel**name** (`ph_kassa_aes_key_<kassen_id>`) + Prüfwert, Kettenstand (Belegnummer, Umsatzzähler verschlüsselt, letzter Beleg), Startbeleg/Monats-/Jahresbeleg-Stand, FinanzOnline-Checkliste (`PH Kassa Checkliste`) |
| `PH Signatureinheit` | A-Trust a.sign RK Online / Karte / Test; Zertifikat (Seriennummer hex, PEM, Kette), Status, Ausfall seit; Zugang nur als site_config-Namen `ph_atrust_user/-password/-env`, Testschlüssel `ph_kassa_test_see_key_<see>` |
| `PH Kassenbeleg` (+ `Position`, `Zahlung`) | submittable, unveränderlich, Name `<Kassen-ID>-<Belegnummer 6-stellig>`; Belegart Standard/Start/Null/Monat/Jahr/Schluss/Sammel/Storno/Training; Summen je Satz 20/10/13/0/19; Zahlarten Bar/Karte Terminal/Karte extern/Gutschein/Überweisung; Zähler, Verkettung, JWS, QR-Code, OCR; Storno-Bezug; Bezug zu AB/Rechnung/Bestellung/Kontakt/Gutschein |
| `PH DEP Export` | DEP7-JSON (`Belege-Gruppe`: Signaturzertifikat, Zertifizierungsstellen, Belege-kompakt), SHA-256-Prüfsumme, Kopie `private/files/dep/` |
| `PH Kassa Ereignis` | SEE-/Kassenausfall Beginn/Ende, Dauer, Meldepflicht > 48 h, Nachsignatur, Start-/Jahresbeleg-Prüfung |

### Belegablauf (`ph_kassa/rksv/buchung.py`)

`erzeuge_beleg()` läuft in **einer** Transaktion: `SELECT … FOR UPDATE` auf PH Kasse → Belegnummer = Zähler + 1 → Summen je Steuersatz (`ph_kassa.logik.betraege`, WP10b) → Umsatzzähler (letzten Stand entschlüsseln, Gesamtbetrag addieren, AES-256-CTR verschlüsseln) → Code → Signatur über SEE → bei Störung Ausfallsignatur + `PH Kassa Ereignis` → QR/OCR → `PH Kassenbeleg` direkt als submitted einfügen → Kasse fortschreiben. Schlägt ein Schritt fehl: Rollback, keine Lücke. Kassenbelege lassen sich **nicht** manuell anlegen, nicht canceln, nicht löschen; Storno = Gegenbeleg (`storniere_beleg`, nur PH Kassa Leitung).

Signatur-/Zählerverfahren (BMF Detailspezifikation): Code `_R1-AT1_<KassenID>_<Belegnr>_<JJJJ-MM-TTThh:mm:ss>_<Normal>_<Erm1>_<Erm2>_<Null>_<Besonders>_<Zähler Base64>_<Zert-Seriennr hex>_<Sig Vorbeleg>`; Beträge mit Komma; Zähler = 8-Byte-Big-Endian-Cent, AES-256-CTR, IV = SHA-256(KassenID‖Belegnr)[:16]; Training `TRA`, Storno `STO` (Base64, Zähler unverändert); Sig Vorbeleg = Base64(SHA-256(JWS Vorbeleg)[:8]), Startbeleg: Hash der Kassen-ID; JWS Compact ES256 (`eyJhbGciOiJFUzI1NiJ9.<payload>.<R‖S>`); QR = Code + `_` + Base64(Signatur); Ausfall: Signatur = Base64(„Sicherheitseinrichtung ausgefallen“). Start-/Null-/Monats-/Jahres-/Schluss-/Sammelbeleg: Betrag 0 mit Zählerstand; Jahresbeleg = Monatsbeleg Dezember. Nach SEE-Wiederanlauf: Sammelbeleg (Betrag 0) über die Ausfallbelege, Ereignis mit Dauer; > 48 h → Aufgabe „FinanzOnline melden“ (keine FinanzOnline-API im Erstbau).

Hinweis Umsatzzähler: **alle** Belege der Kasse werden signiert und der Gesamtbetrag (auch ein Überweisungsanteil) in den Umsatzzähler aufgenommen (zulässig, einfacher prüfbar). Soll Überweisung nicht in die Kette, vor Produktivbetrieb mit dem Steuerberater klären.

### Einrichtung (Staging)

1. `PH Signatureinheit` anlegen (Art Test oder A-Trust Online, env test). Test: „Testschlüssel erzeugen“ → PEM in `site_config.json` unter dem angezeigten Namen eintragen, `bench restart`, „Zertifikat abrufen“. A-Trust: `ph_atrust_user`, `ph_atrust_password`, `ph_atrust_env` in site_config, „Zertifikat abrufen“ (REST-Endpunkte in `rksv/atrust.py`, gegen aktuelle A-Trust-Doku prüfen).
2. `PH Kasse` anlegen (Kassen-ID ohne `_`), „AES-Schlüssel erzeugen“ → `ph_kassa_aes_key_<kassen_id>` in site_config, `bench restart`, Kasse speichern (Prüfwert erscheint).
3. FinanzOnline: SEE und Kasse registrieren („Registrierungsdaten FinanzOnline“ zeigt Kassen-ID, AES-Prüfwert, Zertifikat-Seriennummer), Checkliste abhaken.
4. „Startbeleg erstellen“ → mit BMF Belegcheck-App prüfen → Checkliste „Startbeleg geprüft“ → Kasse wird **Aktiv**.
5. Betrieb: Buttons/Methoden unten; Monats-/Jahresbeleg automatisch (Scheduler 23:50 am Monatsletzten), Nullbeleg jederzeit, DEP exportieren (Button, Datei + Prüfsumme), Kette prüfen.

### Funktionen für WP10b (Kassa-Page, Druck, Abschluss)

| Aufruf | Zweck |
|---|---|
| `ph_kassa.rksv.beleg.erzeuge_beleg(kasse, positionen, zahlarten, belegart="Standard", kontakt=None, auftrag=None, rechnung=None, bestellung=None, trainings=False, bediener=None, storno_von=None, storno_grund=None, kundenbeleg_email=None, kunde_name=None, zahlungsplan_position=None, idempotency_key=None, quelle="Kassa")` | signierten Beleg buchen (Signatur wie `schnittstellen.py`) |
| `ph_kassa.rksv.beleg.storniere_beleg(beleg, grund, bediener=None)` · `ph_kassa.rksv.beleg.nullbeleg(kasse, bediener=None)` | Gegenbeleg · Nullbeleg (z. B. im Tagesabschluss) |
| `ph_kassa.rksv.buchung.startbeleg / monatsbeleg / jahresbeleg / schlussbeleg / sammelbeleg_nach_ausfall / see_ausfall_melden / see_ausfall_beenden / aufgabe` | Sonderbelege, Ausfall |
| `ph_kassa.rksv.api.beleg_buchen`, `beleg_stornieren`, `nullbeleg`, `beleg_daten(name)` (inkl. `qr_svg`), `kassen_status(kasse)` | whitelisted für die Page |
| `ph_kassa.rksv.qr.inhalt(jws)`, `qr.svg(text)`, `qr.png_base64(text)` | QR für Bon/A4 (Inhalt = `PH Kassenbeleg.maschinenlesbarer_code`) |
| `ph_kassa.rksv.pruefung.pruefe_kette(jws_liste, zertifikat, aes_key, kassen_id)` | Report „PH Belegkette Prüfung“ |
| `ph_kassa.ph_kassa.doctype.ph_dep_export.ph_dep_export.exportiere(kasse, von, bis, art)` | DEP-Export aus Abschluss/Report |

`PH Kassenbeleg.on_submit` bucht je Zahlart `ph_shop.zahlung.buche(kanal=…, betrag_cent=…, art="Eingang", bezug_doctype="PH Kassenbeleg", bezug=<Beleg>, kontakt, zeitpunkt, stripe_payment_intent (Terminal), gutschein, notiz, idempotency_key="kassa:<Beleg>:<Zeile>", quelle="kassa")` (keyword-only, Modul `ph_shop/ph_shop/zahlung.py`), schreibt `PH Kassenbeleg Zahlung.zahlung` und `PH Zahlung.kassenbeleg` (Custom Field `fixtures/custom_field.json`); Gutschein-Einlösung über `ph_shop.gutschein.einloesen(gutschein=…, betrag_cent=…, kanal="Kassa", beleg_doctype="PH Kassenbeleg", beleg=…, idempotency_key=…)` (Prüfung in der Page: `ph_shop.gutschein.pruefen`); Anzahlung/Teil-/Schlusszahlung über `ph_faktura.ph_faktura.kassa.kassenbeleg_gebucht(beleg)` (Zahlungsplan-Zeile, Anzahlungsrechnung-OP, AB-Stand; Rechnungsbezüge verbucht zusätzlich `doc_events PH Zahlung.on_submit` in ph_faktura idempotent). Alle drei sind Nebenbuchungen: Fehler landen im Error Log und als Kommentar am Beleg, nie als Ausnahme. **Steuersätze**: intern Select `steuersatz` (`Normal 20`, `Ermaessigt-1 10`, `Ermaessigt-2 13`, `Null 0`, `Besonders 19`, `Steuerfrei`) → `logik/betraege.STEUERSAETZE` liefert die Rechenskala **Int×100** (2000 = 20 %), identisch zu `ust_satz_promille` in ph_shop/ph_faktura; PH Produkt.ust_klasse (`normal`/`ermaessigt`) wird in der Page auf `Normal 20`/`Ermaessigt-1 10` abgebildet. **Stripe Terminal ↔ Webhook**: PaymentIntents tragen `metadata.art = "kassa"` (+ `kasse`, `terminal`); ph_shop leitet `payment_intent.*`-Ereignisse über den Hook `ph_stripe_art_handler = [{"kassa": "ph_kassa.terminal.stripe_ereignis"}]` hierher – nur Statusspiegel (PH Terminal, Kundendisplay, Kommentar am Beleg), keine zweite PH Zahlung.

### Tests

```bash
cd Backend-Import/ph_kassa && PYTHONPATH=. python -m unittest discover -s ph_kassa/tests -t .   # ohne Site: 24 Tests RKSV-Logik
bench --site <site> run-tests --app ph_kassa --doctype "PH Kassenbeleg"                            # mit Site (Test-Signer im Speicher)
```

## Kassa-Oberfläche (WP10b) – Page, Druck, Tagesabschluss, Kassenbuch, Terminal

Alles unter `ph_kassa/ph_kassa/page/ph_kassa/`, `print_format/`, `druck/`, `logik/`, `terminal.py`, `schnittstellen.py`, `auswertung.py`, DocTypes **PH Kassenabschluss** (+ Zaehlung, Steuersatz), **PH Kassenbuch**, **PH Terminal**, Single **PH Kassa Einstellungen**, Fixtures Workspace/Number Cards/Charts, hooks-Block „WP10b“.

### Desk-Page `/app/ph-kassa`

Drei Spalten auf Leinen-Hintergrund (Platzhirsch-Stil, Serifen-Titel, große Zahlen, Tasten ≥ 48 px):

| Spalte | Inhalt |
|---|---|
| links | **Kunde/Auftrag** suchen (PH Kontakt; offene PH Auftragsbestaetigung mit Anzahlungs-Soll → Button „Anzahlung …“, offene PH Rechnung → „Bezahlen“, abholbereite PH Bestellung), **Belege heute** (Nachdruck, E-Mail, Storno, Desk) |
| Mitte | **Positionen**: Sortiment-Suche mit Bild (PH Produkt, Scanner-Enter nimmt ersten Treffer), Freitext mit Steuersatz, **Anzahlung auf Auftrag** (Betrag aus Zahlungsplan, Steuersatz aus Auftragspositionen), **Gutschein verkaufen** (Mehrzweck → Satz „Null 0“), **Gutschein einlösen** (Code prüfen → Restwert → Zahlart), Mengen ±, Bearbeiten |
| rechts | **Summe** groß, Netto/USt je Satz, **Zahlarten** mit Split: Bar (Rückgeld-Rechner, Schnelltasten, passend), Karte (Stripe Terminal: Reader wählen → Zahlung starten → Status-Polling alle 2 s → Abbrechen / im Testmodus „Simulieren“; ohne Reader „Karte extern“), Gutschein, Überweisung; **Beleg buchen & drucken**, **Belegvorschau** als Bon-Text |

Kopfleiste: Kassenwahl, Heute kassiert, Bargeld laut Kassenbuch, **Trainingsmodus-Schalter** (Banner, spiegelt `PH Kasse.trainings_modus`), Buttons **Letzten Bon nachdrucken**, **Beleg per E-Mail**, **Storno** (Leitung; Mitarbeiter nur eigene Belege von heute), **Nullbeleg**, **Einlage/Entnahme**, **Tagesabschluss**. Tastatur: F2 Kunde · F3 Produkt · F4 Freitext · F6 Anzahlung · F7 Gutschein · F8 Bar · F9 Karte · F10 Überweisung · F12 Buchen · Esc neuer Beleg · Strg+P Nachdruck. **Kundendisplay**: zweites Fenster `/app/ph-kassa?display=1&kasse=<ID>` (frappe.realtime `ph_kassa_display_<kasse>`).

Ablauf Buchen (`page/ph_kassa/ph_kassa.py::beleg_buchen`): Sperre prüfen → `logik.betraege.beleg_pruefen` (Summen je Satz, Zahlarten, Rückgeld) → Terminal-Status muss `succeeded` sein → `schnittstellen.erzeuge_beleg(...)` = **`ph_kassa.rksv.beleg.erzeuge_beleg`** (WP10a; Mock nur mit `ph_kassa_mock_kern` in site_config oder in Tests) → Druckauftrag → Ergebnisdialog (Rückgeld, PDF, E-Mail).

### Druck (`druck/`)

- `escpos.py`: ESC/POS-Builder (Init, Codepage PC858, Ausrichtung, Fett, Größe, **QR per GS ( k**, Schnitt, Schublade) – ohne Frappe.
- `bon.py`: Zeilenmodell des 80-mm-Bons → `bon_bytes()` (ESC/POS) und `bon_text()` (Vorschau/E-Mail). Pflichtangaben § 132a BAO/RKSV: Wortmarke PLATZHIRSCH als Text, Firmenblock + UID, Belegart, Belegnummer, Datum/Uhrzeit, Kassen-ID, Menge × Bezeichnung, Betrag mit Satzkennung A–F, Summen je Satz, Zahlarten mit Gegeben/Rückgeld, **QR = maschinenlesbarer_code**, Kennzeichen TRAINING/STORNO/„Sicherheitseinrichtung ausgefallen“, Fußtext.
- `drucker.py`: Modus aus `PH Kasse.bon_drucker` (WP10a) oder Einstellungen: **ESC-POS Druckserver** (POST Rohbytes an `drucker_adresse`/`druckserver_url`), **QZ Tray** (Base64 an Browser → `qz.print raw`), **PDF 80 mm / PDF A4** (Druckformate). Setzt `gedruckt_am`.
- Druckformate (`print_format/`): **PH Kassenbeleg Bon 80mm** (eigenständig, `@page 80mm`), **PH Kassenbeleg A4** (`ph_basis.html`, E-Mail-Anhang), **PH Kassenabschluss Protokoll**. Jinja: `ph_kassa_einstellungen()`, `ph_kassa_qr_svg(code, mm)` (Paket `qrcode`, sonst Platzhalter).

### Tagesabschluss und Kassenbuch

- **PH Kassenabschluss** (`KA-.YYYY.-.#####`): Soll aus signierten Belegen des Tages (`logik/abschluss.soll_aus_belegen`: Bar-Ein-/Ausgaben, Karte, Gutschein, Überweisung, je Steuersatz, Anzahlungen, Gutscheinverkauf, Stornos, Trainings) + Einlagen/Entnahmen aus dem Kassenbuch → **Zählprotokoll** 500 € … 1 ct → Ist, Differenz, Grund (Pflicht über Toleranz), Unterschrift (Signature) → **Abschließen** (nur Leitung): Differenzbuchung ins Kassenbuch (`Differenz`, idempotent), optional Nullbeleg (WP10a), Belege erhalten `kassenabschluss`, `PH Kasse.aktiver_abschluss` geleert, PDF. Zustände Offen → Gezaehlt → Abgeschlossen → Korrigiert (Öffnen durch Leitung) über Server-Methoden, kein Workflow-Fixture.
- **Sperre**: `sperre_pruefen` als `doc_events` `PH Kassenbeleg.before_submit` (hooks WP10b) + Prüfung in der Page: nach „Abgeschlossen“ keine Belege für Kasse+Tag bis zur Öffnung.
- **PH Kassenbuch** (`KB-.YYYY.-.#####`): Anfangsbestand/Einlage/Entnahme/Bareinnahme/Barausgabe/Differenz, Betrag positiv + Vorzeichen aus Art, fortlaufender `bestand_danach_cent`, Grund Pflicht, unveränderlich, Storno nur per Gegenbuchung (Leitung). Einlage/Entnahme buchen zusätzlich `ph_shop.ph_shop.zahlung.buche(...)` (Verrechnung), wenn vorhanden.

### Stripe Terminal (`terminal.py`, DocType PH Terminal)

Server-gesteuerte Reader: PaymentIntent `card_present` → `Reader.process_payment_intent` → Status-Polling → `succeeded`; Abbruch `Reader.cancel_action` + `PaymentIntent.cancel`; Test: `TestHelpers.present_payment_method`. `dienst()` liefert den echten Dienst nur mit `ph_stripe_secret_key` + Paket `stripe`; im Testmodus/ohne Schlüssel den **`TerminalMock`** (deterministisch, Unit-Tests). Schlüsselnamen: `ph_stripe_secret_key`, `ph_stripe_livemode`, `ph_stripe_terminal_location`. PH Terminal: `reader_id` (tmr_…), Kasse, Standort (tml_…), Status (Button „Status abfragen“), Testmodus.

### Workspace, Number Cards, Charts, Reports

Workspace **PH Kassa** (Sequenz 10): Cards Heute kassiert, Belege heute, Offene Abschlüsse, Kassendifferenz Monat, Terminals offline; Charts Kassenumsatz je Tag, Belege nach Belegart, Kassendifferenzen je Monat, Kassenbuch je Woche. Script Reports: **PH Kassenbuch**, **PH Tagesumsatz je Zahlart**, **PH Kassenumsatz nach Steuersatz** (UVA-Zuarbeit), **PH Anzahlungen Kassa**, **PH Gutscheinbewegungen Kassa**, **PH Kassendifferenzen**, **PH Belege je Mitarbeiter** (Leitung).

### Einstellungen (PH Kassa Einstellungen)

Standardkasse, Standard-Steuersatz, Steuersatz Anzahlung (Rückfall), Gutscheinart (Mehrzweck/Einzweck), Bondrucker-Modus + Druckserver-URL/QZ-Druckername/Bonbreite, automatisch drucken, Kassenlade, Bon-Kopf-/Fußtext, Kundendisplay, Beleg-E-Mail (Betreff, Kopie), Differenz-Toleranz, Unterschrift-Pflicht, Nullbeleg beim Abschluss, Terminal-Testmodus. Keine Geheimnisse.

### Tests WP10b

```bash
cd Backend-Import/ph_kassa && PYTHONPATH=. python -m unittest discover -s ph_kassa/tests -t .   # ohne Site: Beträge/Rückgeld, Summen je Satz, Abschluss-Differenz, Sperre, ESC/POS (QR-Befehl), Terminal-Mock, QR-SVG
bench --site <site> run-tests --app ph_kassa --doctype "PH Kassenabschluss"   # Zählen → Abschließen sperrt → Öffnen
bench --site <site> run-tests --app ph_kassa --doctype "PH Kassenbuch"        # Bestand, Grundpflicht, Unveränderlichkeit, Gegenbuchung
bench --site <site> run-tests --app ph_kassa --doctype "PH Terminal"          # Mock-Reader, ID-Format
```

Offen (WP10b): QZ-Tray-Zertifikat am Kassenrechner (Admin); Druckserver im Showroom-LAN (kleiner HTTP→USB-Dienst); echter Terminal-Lauf erst mit Stripe-Testschlüssel auf Staging; Kundendisplay-Fenster braucht Desk-Login (Mitarbeiterrolle).

## Backend-Lücken geschlossen (04.11.2026, Mandat Nr. 50)

Vollständige Liste mit Entscheidung und Test: `Marktresearch/digital/backoffice/50-backend-luecken-kassa-faktura.md`.

| Bereich | Umsetzung |
|---|---|
| Regeln vor dem Buchen | `logik/regeln.py` (Rechnung ab 400 €, Anzahlung nur mit Auftrag, Überzahlung, Einzweck/Mehrzweck, Retoure, Bar ab 10.000 € Identität, Storno-Freigabe) |
| Leitungsfreigabe | `dienste.freigabe_pruefen` – PIN gegen `User.ph_core_pin_hash` (ph_core), Gerät aktiv; Felder `freigabe_von/freigabe_gruende` am Beleg |
| Storno durch Mitarbeiter | `storniere_beleg(erlaube_mitarbeiter, freigabe_von)`; Grenze `storno_mitarbeiter_bis_cent` |
| Kassenbuch = Lade | Jeder Bar-Beleg bucht `Bareinnahme/Barausgabe` (idempotent `beleg:<name>`), CHF getrennt; Anfangsbestand automatisch aus dem Vortag (`PH Kassenabschluss.anfang_ermitteln`) |
| Retoure | Positionsart `Retoure` (negativ, Satz der Originalzeile, `bezug_zeile`), `retoure_vorbereiten`, Rückzahlung Karte/Bar/Überweisung oder Gutschein |
| Gutscheine | Verkauf erzeugt den PH Gutschein (Code nur im Ergebnis `gutschein_codes`), Einzweck als Position, Storno bucht Einlösung zurück bzw. sperrt den verkauften Gutschein |
| Terminal | `TerminalMock/StripeTerminalDienst.erstatten` (Refund auf die Originalkarte), Zeitüberschreitung 60/180 s, DocType **PH Terminal Vorgang** |
| Rabatt | Positionsfelder `listenpreis_cent, rabatt_promille, rabatt_cent, rabatt_gesamt_cent, rabatt_grund`; Freigabe ab `rabatt_freigabe_ab_promille` |
| CHF | Bar mit `fremdwaehrung, fremd_gegeben_cent, kurs_mikro` (Kurs nur vom Server), Rückgeld EUR, CHF-Lade im Abschluss |
| Notbetrieb | `logik/notbetrieb.py`, `notbelege_einspielen` (je Notbeleg ein Standardbeleg, `notbeleg_nr`), `PH Kasse.kassenausfall_melden/_beenden`; Custom Fields `PH Geraet.ph_kassa_offline_erlaubt/_limit_cent` |
| RKSV | `PH Kasse.startbeleg_geprueft/jahresbeleg_geprueft`; Geschäftstag mit `tageswechsel_uhrzeit` |
| Page-Endpunkte neu | `code_erkennen`, `kunde_anlegen`, `retoure_vorbereiten`, `kassensturz`, `lade_oeffnen`, `schnelltasten`, `kassen_katalog`, `kassen_kunden`, `notbelege_einspielen`, `leitung_freigabe_pruefen`, `zahlungsplan`; `beleg_buchen` und `storno` erweitert (s. Docstring) |
| DocTypes neu | PH Terminal Vorgang, PH Kassa Schnelltaste (autoname hash, keine Nummernkreise) |
| Reports | PH Kassenumsatz nach Steuersatz (UVA-Abgrenzung aus `ph_faktura.rechenwerk.uva`), **PH Kassa Klaerfaelle**, **PH Kassa Tageslosung** |
| DSGVO | `ph_kassa.dienste.kontakt_anonymisieren(kontakt)` (Aufruf aus ph_crm) |
| Bon | Bediener als Kürzel (`ph_core_kurzname`/Vorname); A4 mit Empfängeranschrift, UID, Leistungsdatum, Barverkaufsrechnung |

Tests ohne Site: `ph_kassa/tests/test_luecken.py` (23 Tests).


## Integration Runde 3 (04.11.2026)

| Bedarf | Umsetzung | Test |
|---|---|---|
| Kundenkarte direkt aus Python | `page._kundenkarte_buchen` → `ph_kundenkarte.ph_kundenkarte.kassa.einloesen` (kein commit/rollback im Request), `code_erkennen` → `karte_pruefen`, neu `kundenkarte_uebergeben` → `karte_uebergeben`; `ApiFehler` → Kassa-Fehlerform `{code, meldung, vorteil, http_status}` (`logik/integration.karten_fehler`), `card_*`-Codes in `kundenkarte.codes` bzw. `code` | test_integration.TestKartenFehler, Site |
| Storno mit Einlösungen | `page.storno` → `_kundenkarte_zuruecknehmen` → `einloesung_zuruecknehmen(bezug_doctype="PH Kassenbeleg", bezug=<Original>)` (idempotent neben dem doc_event der Kundenkarte) | Site |
| Gutschein-Verkauf/-Storno | `PH Kassenbeleg._gutscheine_ausstellen` → `ph_shop.gutschein.ausstellen_verkauf` (ausgabe_beleg, Einzweck mit Satz der Position), Storno → `verkauf_stornieren` (teilweise eingelöst → Klärfall), Einlösung zurück → `storniere_einloesung` | Site |
| Rabattgutschein | `pruefen()["mindert_entgelt"]` → Positionsart **Rabatt** (negativ, je Steuersatz der Ware, `logik/integration.rabatt_aufteilen`), keine Gutschein-Zahlung; Einlösung bucht den Restwert ab, Storno bucht zurück | test_integration.TestRabattAufteilung/TestGutscheineUmstellen |
| Einzweck ohne Satz | klare Meldung (`EINZWECK_OHNE_SATZ`) in `gutschein_pruefen` und beim Buchen; Einlösung mit dem Satz der Ausgabe | test_integration |
| Terminal-Erstattung | nach `StripeTerminalDienst.erstatten` → `ph_shop.zahlung.erstattung_erfassen(payment_intent, betrag_cent, grund, stripe_refund, idempotency_key, quelle="kassa")`; ohne Eingangszahlung Rückfall `buche` | Site (Mock) |
| Rechnungsempfänger | `dienste.kunde_anlegen` → `ph_crm.api.create_kontakt` (Dublettenschutz); ohne Anlegerecht `ph_crm.ph_crm.dubletten.kandidaten` + Anlage; Land ISO → Country | Site |
| Ausstellungsstück | `page.ausstellungsstueck(lagerbestand, vk_cent)` → Position „Ausstellungsstück: …“ (Art Artikel, Bezug PH Lagerbestand, `lagerbestand_ref`); beim Buchen Verkauf im Bestand (`ph_logistik.bestand.buche`, Bezug Kassenbeleg, idempotent); doppelt kassieren gesperrt; Storno → Klärfall Warenrücknahme; Lagerbestand-Button öffnet die Kassa | test_integration.TestAusstellungsstueck, Site |
