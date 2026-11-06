# 8x – Übergabe Team B-KAS (Bereich Kassa, Lounge)

**Stand:** 2026-11-04 · Auftrag: 10-konzept-kassa.md Fassung 3 (Bauauftrag §16) auf Fundament v2, Gestaltung ausschließlich nach art-direction/lounge.md, `src/app/entwurf/lounge/kassa` + `kundendisplay` und `qa-screenshots/entwurf-lounge/` (Inhaber-Entscheidungen Nr. 46–53).
**Kurz:** Kiosk-Kassa (Verkauf, Zahlmaske Bar/Karte/Gutschein mit Split, Ergebnis-Sheet, Freigabe am Ende, Belege + Storno, Rücknahme, Bargeld, Tagesabschluss, geparkte Bons), Kundendisplay live über den Kanal von P0-6, Kassa-Verwaltung (Übersicht, Listen, drei Akten, Kassenbuch, 9 Berichte, Einstellungen, Bediener), Mock aller Page-Methoden, Seed für jeden Status. Alles im Mock lauffähig; auf einem echten Frappe-Server noch nicht gelaufen.

## Gebaut

### Routen

| Route | Inhalt |
|---|---|
| `/kassa` | Verkauf exakt nach entwurf-lounge/kassa: Material-Statuszeile (KioskShell; Kopf-Slot Belege · Bargeld · Abschluss), Suchfeld als combobox mit gruppierten Treffern (Artikel/Kunden) und Mengenvorwahl `3 *`, runde Kategorien-Kacheln, Produktkacheln (Freisteller auf Leinen, Lager-Chip, Zähler mit Feder-Pop, ein Knopf je Kachel), schwebender Warenkorb (Kundin + Stufe, Leistungsvorteile vormerken – ohne Geldwert –, offene Anzahlungen/Rechnungen als Chips, Positionen als `role="grid"` mit Roving-Fokus und Stepper, USt je Satz, Vorteil als Bon-Hinweis „inklusive“, Zahlart-Segment, EIN Primärknopf „Kassieren · Betrag“). Zahlmaske ersetzt den Korb: Bar (Gegeben vorbelegt + markiert, Schnellbeträge buchen sofort, Zahlentasten, Rückgeld), Karte (Terminal startet sofort, Bon gesperrt, Abbrechen in voller Breite, Test-Terminal-Knopf im Testmodus, Polling 2 s), Gutschein (Scan/Code, Restwert, Rest per Karte/Bar = Split). Rechnungsfrage über 400 € ohne Kunde (E1), Empfänger-Erfassung. Ergebnis-Sheet mit gezeichnetem Häkchen, Rückgeld zuerst, Gutschein-Code, E-Mail-Schalter, Nachdruck, „Nächster Kunde“. „Zahlung erhalten – Beleg offen“ mit 3 automatischen Versuchen (2/4/8 s) und gleichem Idempotenz-Schlüssel, Band in Ziegel. Tagesstart-Karte, Bänder (Training, gesperrt, Abschluss gezählt, Vortag offen, Entwurf nicht gesichert), Entwurf-Spiegel in IndexedDB, Parken/Verwerfen (Undo), Zeilenblatt mit Rabatt (Grund-Chips, Freigabe ab Grenze), Freitext, Gutschein verkaufen, Anzahlung/Zahlung auf Rechnung. `?kunde=&beleg=` (AnDieKassa), `?mock_fehler=netz` nur Mock/Entwicklung. |
| `/kassa/belege` | Belege heute, Suche/Bon-QR, Bon-Vorschau, Nachdruck, Per E-Mail, Storno mit Grund-Chips + Hinweis „Kunde will zurückgeben → Zurücknehmen“, Sperren mit Text (Karte ohne Erstattung, Anzahlung → Buchhaltung, bereits storniert), Freigabe am Ende |
| `/kassa/retoure?beleg=` | Rücknahme-Assistent (Fähigkeit `retoure`): rücknehmbare Mengen, „Alle“, Grund → Weg (Umtausch/Kulanz = Gutschein, Mangel/Rücktritt = ursprünglicher Weg), Bar mit Freigabe |
| `/kassa/bargeld` | „Bargeld in der Lade“ (64/300), Einlegen/Entnehmen (zuletzt genutzt), Zweck-Chips, bei Ausgabe Wofür + Projekt (Fähigkeit `kassenbuch_projekt` aus → Vermerk im Grund), Zahlentasten, Knopf mit Betrag, Rückgängig 6 s, danach Buchung + Lade öffnen, Liste heute |
| `/kassa/abschluss[?datum=]` | Assistent mit Schrittpillen: Tag prüfen → Zählen (Scheine | Münzen, Enter springt weiter, blind für Mitarbeitende) → Übergeben bzw. (Leitung) Differenz mit Grund ab Toleranz → Abschöpfen in den Tresor → Abschließen mit Namen; Häkchen-Abschluss |
| `/kassa/geparkt` | Geparkte Bons des Geräts als Kacheln, Weiterführen/Verwerfen |
| `/kassa/display?kasse=` | Kundendisplay (eigenes Layout): ruhe · einkauf · bezahlen · danke wie entwurf-lounge/kundendisplay, Kopplung `useKundendisplay` (BroadcastChannel, SSE, Polling), „Anzeige pausiert“, QR des Belegs über `qrSvgAction` (Frappe `PH Kassenbeleg.qr_svg`, Mock-Muster), `?vorschau=…` nur außerhalb der Produktion |
| `/kassa/verwaltung` | V0 Bento: Akzentkachel „Heute kassiert“, Bargeld in der Lade, offene Abschlüsse, Umsatz 14 Tage (laufender Tag schraffiert), Zahlarten heute, letzte Belege, Kassen mit Echtbetriebs-Schranke, offene Ereignisse; Primär „Kassa öffnen“ |
| `/kassa/verwaltung/belege`, `/abschluesse`, `/kassen`, `/terminals`, `/ereignisse`, `/dep` | Listen (DataTable/Filterleiste des Fundaments, Labels ohne „(Cent)“) |
| `/kassa/verwaltung/belege/[name]` | Beleg-Akte: Positionen mit Satz, Zahlungen, Angaben, Signatur/QR-Text, Signatur prüfen, Drucken (DruckKnopf), „An der Kassa öffnen“ |
| `/kassa/verwaltung/abschluesse/[name]` | Abschluss-Akte: Soll/Ist/Differenz, Bargeld, Umsatz, Zählprotokoll, je Steuersatz, neu berechnen, wieder öffnen (Fähigkeit), „An der Kassa abschließen“ |
| `/kassa/verwaltung/kassen/[id]` | Kassen-Akte: Trainings-Schalter mit Echtbetriebs-Schranke (§0.4), Einrichtung (Checkliste), Signatureinheit, Zähler, Terminals, Nullbeleg, Belegkette prüfen, DEP exportieren, SEE-Ausfall melden |
| `/kassa/verwaltung/kassenbuch` | Buchungen | Tage je Kasse und Monat, Bestand nur mit Fähigkeit `kassenbuch_barbelege` |
| `/kassa/verwaltung/berichte[/slug]` | 9 Berichte (Tageslosung, Zahlart, Steuersatz, Kassenbuch, Differenzen, Bediener – nur Leitung, Gutscheine, Anzahlungen, Klärfälle – nur Leitung); Frappe: Query Report, sonst lokal gerechnet; Monat als Segment |
| `/kassa/verwaltung/einstellungen` | Whitelist-Felder als Schalter/Betrag/Prozent/Text, sofort gespeichert, nur Leitung |
| `/kassa/verwaltung/bediener` | Personen mit Kassa-Rolle (Leitung), Verweis auf Benutzerverwaltung für PIN |

### Dateien

- Logik (rein, getestet): `src/lib/backoffice/kassa/{betraege,codes,regeln,abschluss,bargeld,bon,katalog,display,einstellungen,zugang}.js` – Port von `logik/betraege.py`, `codes.py`, `regeln.py`, `abschluss.py` mit den Testfällen aus `ph_kassa/tests`.
- Daten/Server: `kassa/frappe.js` (Pfade an einer Stelle, JSON-Argumente als Text, **nie `trainings`** an `beleg_buchen`), `kassa/mock.js` (alle Page-Methoden + `lookup_card`, `beleg_daten`, Terminal-Testmodus, Netzfehler-Schalter; `sicherstellen()` baut veraltete Kassa-Daten im laufenden Mock nach), `kassa/daten.js` (Kiosk-Kontext, Übersicht, Berichte), `kassa/actions.js` (alle Mutationen, `{ok, code, message, daten}`, Freigabe `{email, pin}` an den Server), `kassa/faehigkeiten.js` (29 Fähigkeiten, Echtbetriebs-Schranke), `kassa/texte.js`.
- Komponenten: `src/components/Backoffice/Kassa/` – `KassaVerkauf`, `Sortiment`, `Korb`, `Zahlmaske`, `Sheet`, `Freigabe`, `BelegeKiosk`, `BargeldKiosk`, `AbschlussKiosk`, `NebenKiosk` (Geparkt, Retoure), `Kundendisplay`, `KioskSeite`, `Verwaltung`, `VerwaltungAktionen`, `BerichtTabelle`, `speicher.js` (IndexedDB), `kassa.css` (Lounge-Maße auf Rollen-Token, hell/dunkel).
- Register-Teildateien: `bereiche/kassa.js` (Navigation 11 Einträge, kanonische Routen → 307 von `/d/…`), `kuerzel/kassa.js` (F12 = `kiosk.primaer` des Fundaments, keine Dublette), `aufgaben/kassa.js` (4 Quellen), `freigaben/kassa.js` (bewusst leer – Freigabe am Ende), `druck/kassa.js`, `akte/slots/kassa.js` (Kundenakte › Kassenbelege), `mock/seed/kassa.js`, `tools/qa/routen/kassa.mjs`.
- Seiten: `src/app/(kiosk)/kassa/{page,loading,belege,bargeld,abschluss,geparkt,retoure,display}`, `src/app/kassa/verwaltung/**`.

## Tests

- Unit: `node --test "tests/unit/**/*.test.mjs"` → **499/506**, davon **35/35 Kassa** (`kassa-logik`, `kassa-bon`, `kassa-mock`, `kassa-register`). Die 7 Fehlschläge gehören nicht zur Kassa (Register/Shell: Routen fremder DocTypes faktura/marketing, CRM-Navigation, Kürzel-Dublette `shift+k` marketing/akte, QA-Reihenfolge durch crm-Routen).
- ESLint: **0** auf allen Kassa-Dateien.
- E2E `--project=desktop`: `kassa-verkauf.spec.js` (7), `kassa-display.spec.js` (2), `kassa-verwaltung.spec.js` (7) – alle grün (einzeln bzw. nach Timeout-Anhebung wegen des stark ausgelasteten Dev-Servers; Ausgabe in eigenem `--output`, weil parallele Läufe anderer Teams `test-results/` aufräumen).
- Screenshots: `qa-screenshots/kassa-b-kas/` (shoot.mjs `--nur "^/kassa"`, Kassa-Leitung, 138 Aufnahmen: 0 Überlauf, 0 HTTP-Fehler im Endstand) und Nachlauf `qa-screenshots/kassa-b-kas-nachlauf/` (30 Aufnahmen nach Korrekturen: Leer-Aktion auf Geparkt/Retoure, Akte-Aktionen am Telefon umbrechend, 500er auf /abschluesse war ein Zwischenstand während einer Bearbeitung). Rest-Befund „Fokus ohne Ring (input)“ am Suchfeld /kassa und /kassa/belege ist behoben (Ring liegt an der Pille, `data-fokus-rahmen="pille"`), die Nachlauf-Aufnahmen davor stammen vom alten Stand. Ablauf hell/dunkel neben `entwurf-lounge/4-kassa` und `6-kundendisplay` gesichtet: Statuszeile, Kategorien, Kacheln, Warenkorb, Summe, Segment, Bezahlt-Sheet und Display entsprechen dem Entwurf.
- Hinweis QA-Werkzeuge: Der keepalive-POST des Kundendisplay-Kanals (P0-6, `browser.js`) gilt in Playwright als nie beendet und hält `networkidle` offen. Die Kassa sendet das Ruhebild deshalb erst mit der ersten Bedienung; P0-6 sollte `keepalive` nur beim Verlassen der Seite setzen.

## Fähigkeiten (Mock-Probe gegen Backend-Import, 04.11.2026)

| an | aus (Grund · Ersatz) |
|---|---|
| idempotenz, regeln_server, kunde_anlegen, gutschein_verkauf, retoure, rabattfelder, storno_ursprung, terminal_erstatten, storno_mitarbeiter, abschoepfung, kassenbuch_barbelege, abschluss_oeffnen, vorteil_zuruecknehmen, code_erkennen, tageswechsel, vortag_page, dep_export, kundendisplay | **bediener_sitzung** (ph_core `sitzung_mit_pin` fehlt · Freigabe mit PIN an `beleg_buchen`/`storno`, die der Server prüft), **training_server** (Server nimmt `trainings` noch an · Client sendet es nie), **rechnung_snapshot** (keine `empfaenger_*`-Felder · Empfänger wird Kontakt), **anfang_server** (`bargeld_ende_cent` fehlt), **kassenbuch_zweck** (`zweck` fehlt · im Grund), **kassenbuch_projekt** (`projekt` an PH Kassenbuch fehlt · im Grund, Inhaber-Frage 95), ueberweisung, bestellung_kassieren, standard_terminal, notbetrieb, chf, bedienerkarte (nicht erwartet) |

Echtbetriebs-Schranke: „Training aus“ ist nur mit bediener_sitzung, idempotenz, training_server, rechnung_snapshot **und** vollständiger Checkliste frei. Im Mock steht Kassa 1 als Demo im Echtbetrieb; die Kassen-Akte zeigt das rot an (Inhaber-Frage 99).

## Abweichungen vom Konzept (Lounge hat Vorrang, Nr. 51/53)

1. Raster wie Lounge: links Produktkacheln (= Schnelltasten) mit Kategorien, rechts Warenkorb mit Positionen; Konzept §3.1 hat die Positionen links. Fokusmodell, Grid, Tasten gelten unverändert.
2. Ergebnis als Sheet über dem Verkauf (Lounge „Bezahlt-Sheet“) statt Karte in der rechten Spalte.
3. Zahlart wird im Korb vorgewählt (Karte, wenn Terminal), „Kassieren“ öffnet die Zahlmaske mit dieser Zahlart (Inhaber-Frage 96); F12 bleibt Kassieren.
4. „Rechnung“ steht im Zahlart-Segment (wie Lounge); gewählt, sperrt sie „Kassieren“ mit Grundtext (Fähigkeit `ueberweisung`).
5. Freigabe am Ende ohne Kurzsitzung: Leitung wählt Kachel + PIN, der Server prüft die PIN (`freigabe = {email, pin, geraet_token}` ist in `beleg_buchen`/`storno` vorhanden). Ohne `geraet_token` (Frappe ohne Gerät) scheitert die Prüfung ehrlich.
6. Gutschein-Codes kommen vom Server (`gutschein_codes` aus `on_submit`); der Nachlauf `sell_voucher` (E11) ist nicht nötig.
7. Bargeld-Undo 6 s läuft im Browser (Zeitgeber + Ausführen beim Verlassen), nicht über das Commit-Register (`commit/aktionen/kassa.js` liegt nicht im Schreibbereich).
8. Kundendisplay-QR: eigene Server Action statt Klartext im Kanal (Kanal erlaubt 512 Zeichen); Mock zeigt ein Muster.

## Offene Punkte (an L0 / andere Teams)

1. **Importzeilen eintragen** (L0/P0-5/P0-7): `aufgaben/index.js` → `kassa`, `akte/slots/index.js` → `kassa`; Freigaben/Druck-Teildateien nur bei Bedarf.
2. **Fremder Test** `tests/e2e/backoffice-eingabe-kiosk.spec.js` (P0-6) prüft auf `/kassa` noch den Platzhalter (Scan → `?q=`). Mit der echten Kassa erkennt ein EAN-Scan einen Artikel; der Test braucht einen anderen Arbeitsplatz-Platzhalter (z. B. `/technik`).
3. **Druckrouten** `/druck/kassenbeleg|kassenabschluss|kassenbuch|zaehlliste|gutschein` (§2.1) liegen außerhalb des Schreibbereichs; die Kassa druckt über den Server (`beleg_drucken`) bzw. das Druckpanel.
4. **Hilfe-Artikel** `backoffice/hilfe/kassa/*.md` (DoD §6.1) nicht angelegt (außerhalb des Schreibbereichs).
5. **KioskShell**: Mond-Symbol bleibt bei System-Dunkel „Mond“ (Thema-Status), nur Kosmetik (P0-6).
6. Backend: `sitzung_mit_pin` (ph_core P9), Felder `projekt`/`zweck` an PH Kassenbuch, `empfaenger_*` am Kassenbeleg, `trainings`-Parameter entfernen – danach schalten die Fähigkeiten von selbst um.
7. Frappe-Abnahme: Wrapper `frappe.js` gegen Staging (GET/POST-Wahl, `lookup_card` liefert dort die API-Form von ph_kundenkarte).

## Neue Fragen

- Inhaber: 90-inhaber-fragen.md Nr. 95–99 (Projektfeld Barausgaben, vorgewählte Zahlart, Gutschein-Werte, Rücknahme ohne Beleg, Echtbetrieb im Testmodus).
- Steuerberater: 91-steuerberater-fragen.md Nr. 50–51 (Barausgabe ohne USt-Erfassung, Gutschein aus Rücknahme).

## Screenshot-Ordner

`backoffice/qa-screenshots/kassa-b-kas/` (Desktop 1440, iPad 1024, iPhone 390 · hell/dunkel).
