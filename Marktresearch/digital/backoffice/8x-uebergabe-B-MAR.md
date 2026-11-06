# Übergabe B-MAR – Bereich Marketing (Welle 1, Lounge)

**Stand:** 04.11.2026 · Team B-MAR (Bereichsteam „marketing“) · Grundlage: `10-konzept-marketing.md` (finale Fassung inkl. Bauauftrag § 13), `00-MASTER.md` §§ 2–6, Fundament v2, Gestaltung ausschließlich `art-direction/lounge.md` + Entwurf `entwurf/lounge` (Inhaber: „gefällt mir, was ich sehe“).
**Dev-Server:** :3100 Mock, nicht neu gestartet. Der Marketing-Seed zieht sich in einer laufenden Mock-Datenbank selbst nach (`mockNachzug`, Marke `_seed_marketing` an „PH Marketing Einstellungen“, Seed-Version `b-mar-3`).

## 1. Gebaute Routen

| Route | Typ | Inhalt |
|---|---|---|
| `/marketing` | T1 | Seitenkopf mit 3 leichten Zahlen (aktive Abos, Unbestätigt > 48 Std., Anmeldungen nächstes Event), „Zu tun“ (Freigaben zuerst, je Zeile ein Knopf), Karten Nächste Ausgabe (Bereitschaft), Diese Woche (Social + Events), Nächstes Event (Check-in öffnen), „Mehr Zahlen“ aufklappbar, Erste Schritte, „+ Neu ▾“, Erstbesuch |
| `/marketing/newsletter` | T2 | Chips je Status mit Zähler, Suche/Jahr in der URL, Tabelle (Monat, Betreff, Versand, Empfänger, Zugestellt/Fehler), Karten am Telefon; „Neue Ausgabe“ mit nächster freier Kennung (Struktur · Kopie der letzten · leer) |
| `/marketing/newsletter/[name]` | T5 | Reiter Inhalt (Block-Editor mit Live-Vorschau hell/dunkel, Autosave 1,5 s, Bereitschaft „n von 3“ mit Sprung zum Block, Bildquelle immer „eigen“) · Versand (Zielgruppe, Termin mit Werbefenster/Sperrtagen, Empfängerzahl, Fortschritt mit Abfrage alle 15 s, Abbrechen) · Protokoll · Verlauf; eine Primäraktion je Status (Zur Freigabe · Freigeben (D1) · Jetzt versenden), Testmail nur an interne Adressen, Zurückgeben mit Grund, Bearbeiten in „Wartet auf Freigabe“ setzt sichtbar auf Entwurf zurück |
| `/marketing/empfaenger` | T2 | Ansicht Personen · Einwilligungen (Chips je Status/Zweck), Massenaktionen (Bestätigung erneut senden mit Vorschau der Ausschlussgründe, Abmelden), CSV-Export; Dialoge Anmeldung erfassen (QR-Rückfall), Einwilligung erfassen (D3, Papier nur mit Beleg), Keine Werbung mehr (D4) |
| `/marketing/empfaenger/[email]` | T5 | Personen-Akte: Abo, Einwilligungen als Zweck-Chips, Events, Empfehlungen, Verlauf; Aktionen Keine Werbung mehr · Widerruf je Zweck · Auskunft · Daten löschen (nur ohne aktives Abo) · Kontaktsperre |
| `/marketing/abos`, `/abos/[email]`, `/einwilligungen`, `/einwilligungen/[name]` | 308 | dauerhafte Weiterleitung auf Empfänger (Konzept § 3.0) |
| `/marketing/events`, `/[id]` | T2/T5 | Liste mit Plätzen; Akte mit Eckdaten, Anmeldungen (Warteliste, Nachrücken FIFO, Personen, Status), Erinnerung, Absage mit Grund (Mail an Angemeldete), Teilnehmerliste drucken; Anmeldung erfassen (D5, speichert keine Werbe-Einwilligung) |
| `/checkin/[event]` (Kiosk) | T7 | KioskShell, große Suche (Name/E-Mail/Telefon-Ende), „Da“ mit verzögertem Commit (6 s) und Rückgängig in der Zeile, Zähler „Da: n von m Personen“, Personenzahl ändern, Gast ohne Anmeldung, Code scannen (Fähigkeit), Fertig-Dialog, Dimmen nach 5 min, F2/F7/F9; nur am Eventtag, sonst ehrlicher Leerzustand |
| `/marketing/social` | T3 | Kalender (Fundament-Kalender, Ziehen = Datum ändern, verzögert) · Kanban (einziges Kanban des Bereichs, Spalten mit Sperrgrund beim Ziehen) · Liste; „Neuer Beitrag“ |
| `/marketing/social/[name]` | T5 | Formular mit Autosave, drei Prüffragen (Bildquelle, Kundenprojekt mit Einwilligung, Kennzeichnung), Freigabe D2, Datum, Als veröffentlicht markieren (Link), Kennzahlen, Text kopieren |
| `/marketing/kampagnen`, `/[name]` | T2/T5 | Summen je Währung (EUR/CHF getrennt), Kosten je Anfrage, Signal „Zeitraum beendet“; Akte mit Kennzahlen (Dialog mit Dezimalkomma, Budget-Warnung), CSV-Import (deutsch/englisch), Kampagnen-Link (UTM) zum Kopieren, Auswertung, verknüpfte Anfragen |
| `/marketing/empfehlungen`, `/[code]` | T2/T5 | Schritte Code gesendet · Auftrag · Geliefert und bezahlt · Gutschein; Ampeln Storno/Lieferung/Zahlung/Frist; Gutschein erst bei allen grünen Ampeln (Fähigkeit) |
| `/marketing/zielgruppen`, `/[id]` | T6 | Regel-Editor als Satz, Vorschau mit Ausschlussgründen; `neu` legt an |
| `/marketing/kundenreisen`, `/[id]` | T6 | Regelprüfung wie `pruefe_reise`, Trockenlauf, Aktivieren nur mit Kanzlei-Freigabe bei Werbung, Pausieren (verzögert), Duplizieren mit 6-Schritt-Assistent (M2) |
| `/marketing/vorlagen` | T9 | nur Leitung; Editor mit Platzhalter-Prüfung und Vorschau mit Beispielwerten |
| `/marketing/einblicke` | T8 | Tageswerte 42 Tage (Balken/Sparkline), Abos nach Quelle, Einwilligungen nach Zweck |
| `/marketing/berichte/[report]` | T8 | Berichte aus der Konzeptliste (im Mock berechnet), Druck/CSV |
| `/marketing/einstellungen` | T9 | nur Leitung; Absender, Testadresse, Werbefenster, Sperrtage, Schalter (Automatik), Auftragsquelle |

`loading.js` mit Skeletons für Start, Newsletter, Empfänger, Events, Social, Kampagnen.

## 2. Code

- **Logik (rein, unit-getestet):** `lib/backoffice/marketing/regeln.js` (Bereitschaft wie `regeln.py`, Werbefenster/Sperrtage, erster Donnerstag, Kennung, Adressen/Tippfehler/intern, Bestätigung erneut, Keine-Werbung-Plan, Reise-Prüfung, Segment-Satz, Kampagnen-Summen/CSV/Link, Event-Plätze/Anmeldung/Nachrücken/Check-in, Social-Prüfungen, Empfehlungs-Ampeln/Schritt/Code), `status.js`, `texte.js` (alle Texte, Glossar, `VERBOTEN`-Liste), `rollen.js`, `intern.js`, `band.js`, `vorschau.js` (Newsletter-HTML, Vorlagen-Platzhalter), `faehigkeiten.js`.
- **Daten/Aktionen:** `daten.js` (server-only), `methoden.js` (Frappe-Methoden aus `ph_marketing.api.backoffice` + Mock-Pfad für jede), `actions.js` („use server“, Sitzung + DocType-Recht + Rolle + Validierung, nie werfen), Commit-Aktionen `commit/aktionen/marketing.js` (11 Aktionen).
- **Komponenten:** `components/Backoffice/Marketing/` (23 Dateien, `marketing.css` mit Präfix `bo-mar-`, nur Token).
- **Register (Teildateien):** `bereiche/marketing.js` (Navigation 13 Einträge, 6 sichtbar + Mehr; Kanban nur `PH Social Beitrag`; Routen für 11 DocTypes), `suche/marketing.js` (Nummernmuster; Schnellaktionen/Hilfe vorbereitet, nicht aktiv), `kuerzel/marketing.js` (Liste Umschalt+A/K, Akte Umschalt+T/M/C/W/A/N, Kiosk F2/F7/F9), `aufgaben/marketing.js` (5 Quellen), `freigaben/marketing.js` (Newsletter, Social – nur in der Akte freigebbar), `druck/marketing.js`, `akte/slots/marketing.js` (Kundenakte „Marketing“), `mock/seed/marketing.js` (Nachlauf: jede Liste mit jedem Status, Leer- und Fehlerfälle), `tools/qa/routen/marketing.mjs` (31 feste Seiten).

## 3. Tests

- Unit: `tests/unit/marketing-regeln.test.mjs` (14), `tests/unit/marketing-methoden.test.mjs` (10, MockClient, Register, Fähigkeiten, Abnahme-Grep über sichtbare Strings) – **24/24 grün**.
- Unit gesamt: **551/555** – die 4 roten gehören anderen Teams (Ablage-Navigation, CRM-Navigation „Übersicht + sechs DocTypes“, Hilfe-Kürzel-Schnappschuss, Zentrale-Navigation `/d/ph-aufgabe`); keiner betrifft Marketing.
- ESLint auf allen B-MAR-Dateien: **0 Fehler, 0 Warnungen**.
- E2E `tests/e2e/marketing-bereich.spec.js` (8 Tests, desktop): siehe § 7.
- Screenshots: `backoffice/qa-screenshots/b-mar-marketing/` + eigene Sichtung neben `entwurf-lounge`.

## 4. Fähigkeiten (G-04) und „bis dahin“-Verhalten

| ID | Stand | Verhalten |
|---|---|---|
| `marketing.anmeldung`, `.checkin`, `.nachruecken`, `.absage`, `.trockenlauf`, `.bestaetigung-stapel`, `.abmelden-stapel`, `.empfaengerliste`, `.csv-import`, `.auftragsquelle` | an (Methode in `api/backoffice.py`) | voll benutzbar |
| `marketing.einwilligung-kanaele`, `.einladungen`, `.bestandskunde`, `.adresse`, `.social-felder`, `.kosten-belegt` | aus (Methode/Feld fehlt) | Feld/Aktion gesperrt mit Satz und Ersatzweg |
| `marketing.verschieben`, `.personen-aendern` (Event) | aus | Absage + neues Event; Personen nur im Check-in |
| `marketing.gutschein` | aus | „Gutschein senden“ gesperrt; Ersatz: Gutschein in der Kassa ausstellen, Empfehlung von Hand abschließen |
| `marketing.roi-netto`, `.ohne-email`, `.social-freigabe`, `.stopp-regeln`, `.widerspruch`, `.testmail-intern`, `.abmelde-token` | aus (keine Probe) | Hinweise statt Funktion; Testmail-Sperre auf interne Adressen läuft in der Action |
| `marketing.ideen` | erwartet aus | Ideen-Spalte im Social-Kanban nur lesend |

## 5. Abweichungen vom Konzept (Freigabe L0 erbeten)

1. **Unternavigation als Pillen-Reiter der Shell** (Lounge) statt Tabs mit Unterstrich.
2. **Testmodus-Band des Bereichs nur außerhalb des Mock** – im Mock zeigt die Shell bereits ihr Testband; zwei Bänder übereinander wären gegen „höchstens ein Band“.
3. **Social-Kanban als eigene Komponente** (Sperrgrund je Zielspalte beim Ziehen), Kalender nutzt den Fundament-Kalender; Beiträge ohne Uhrzeit stehen dort bei 09:00.
4. **Zähler an den Navigationsreitern fehlen** – die Shell-Reiter kennen keine Badges (Fundament-Wunsch); Zähler stehen in Seitenkopf und Chips.
5. **Commit-Teildatei `commit/aktionen/marketing.js`** geschrieben (laut Kopfzeile Bereichsdatei, nicht in der Liste des Schreibbereichs).
6. **Doctypes `PH Einwilligung`, `PH Segment`, `PH Mail Vorlage`** im Bereichsregister ergänzt (sonst „Route für fremden DocType“).
7. **Akte-Kürzel „Kennzahl erfassen“ = Umschalt+M** (Umschalt+K/P sind global in „akte“ belegt).

## 6. Für andere Bereiche / L0 (Stub statt Warten)

- **Import-Zeilen in die Index-Register** (nur L0/P0): `aufgaben/index.js` → `marketing`, `freigaben/index.js` → `marketing`, `druck/index.js` → `marketing`, `akte/slots/index.js` → `...marketing`; Schnellaktionen in `suche/marketing.js` aktivieren, sobald der Register-Schnappschuss umgestellt ist.
- **Zentrale/Arbeitsplatz:** Kachel „Event-Check-in“ auf `/checkin/<event>` (heutiges Event, `eventHeute()` in `regeln.js`).
- **CRM:** Kampagnen-Akte verlinkt Anfragen über `/d/ph-anfrage/<name>`; Kundenakte bekommt den Slot „Marketing“.
- **Kassa:** Gutschein für Empfehlungen bis zur Fähigkeit `marketing.gutschein` von Hand.
- **Backend-Anfragen (ph_marketing):** `record_consent` mit Kanälen, Feld `PH Event Anmeldung.einladungen_ok`, `PH Kontakt.werbehinweis_am`, Event verschieben/Personen ändern, Gutschein-Methode, Social-Felder (Kennzeichnung, Link), Testmail-Sperre serverseitig, Abmelde-Token.

## 7. Prüfergebnisse (Abschluss)

| Prüfung | Ergebnis |
|---|---|
| Unit Marketing | **24/24 grün** |
| Unit gesamt | 551/555 – 4 rote anderer Teams |
| ESLint B-MAR | 0 / 0 |
| E2E desktop | E2E_ERGEBNIS |
| Screenshots | SCREENSHOT_ERGEBNIS |

## 8. Offene Punkte

- iPad/iPhone-E2E und Dunkel-Sichtung aller Akten nur stichprobenartig; axe-/Screenreader-Durchlauf (Q4) offen.
- Rollen-E2E nur Leitung + Team (`marketing@demo.local`); Rollenregeln sonst unit-getestet.
- Bild-Upload im Newsletter-Editor nutzt die Ablage-Action; echte Bildbearbeitung (Zuschnitt) nicht gebaut.
- Berichte im Mock berechnet; gegen Frappe fehlen Report-Methoden (Fähigkeit).
- Inhaber-Fragen 108–113, Steuerberater-Fragen 56–57 (siehe `90-…`, `91-…`).
