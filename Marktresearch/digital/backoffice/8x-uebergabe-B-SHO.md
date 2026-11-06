# Übergabe B-SHO – Bereich Shop (Welle 2, Lounge)

**Stand:** 04.11.2026 · Team B-SHO · Grundlage: `10-konzept-shop.md` (Fassung 3), MASTER § 2/§ 6, Lounge (`art-direction/lounge.md`, Nr. 51/53), Fundament v2 (`42-qa-g0.md`).
**Screenshots:** `backoffice/qa-screenshots/b-sho-shop/` (shoot.mjs, alle `/shop`-Routen × 3 Viewports × hell/dunkel, Bericht `bericht.md`).

## 1. Gebaut

### Routen (alle im `ROUTEN`-Register, `/d/ph-…` → 307)

| Route | Typ | Inhalt |
|---|---|---|
| `/shop` | T1 | „Zu tun“ (max. 5, nach Dringlichkeit, je Zeile ein Knopf), Akzentkacheln Zu packen (Cognac) / Abholung (Salbei), 2–4 Kennzahlen je Rolle, Neueste Bestellungen mit Bild, Widerrufe nach Frist, Stripe-Zeile (Leitung), Testmodus-Band, Prüfliste-Band, Einrichten-Checkliste bei leerem Shop |
| `/shop/bestellungen` | T2/T3 | Arbeitsansichten Alle · Zu packen · Abholung · Prüfen · Meine (+ Kanban), Suche (Nummer, Name, E-Mail, Sendungsnr., Betrag „€ 89“), Status-Menü (Arbeitsfluss/Endzustände, Tasten 1–9), Lieferart-Chips, „Testdaten anzeigen“, Nächster Schritt mit Fälligkeit und Zeilenknopf (Shift+Enter), Vorschau rechts `?panel=` (Lounge-Panel mit Bild, Glas-Chips, Fakten, Primäraktion), Massenaktionen Packen/Abholbereit/Abschließen/Bestätigung (übersprungene mit Grund), CSV, Kanban mit Bahnen Versand/Abholung/Alle (nur erlaubte Züge, Gründe, Menü „Verschieben nach“), Dialog Neue Bestellung `?neu=telefon|showroom` |
| `/shop/bestellungen/neu`, `/shop/retouren` | 307 | → `?neu=telefon` bzw. `/shop/widerrufe?segment=retouren` |
| `/shop/bestellungen/[name]` | T5 | Lounge-Hero (Produktbild, Glas-Kacheln Gesamt/Bezahlt/Nächster Schritt/Versand bzw. Abholung), Kopf mit Primärmatrix § 5.1 (`primaer.js`), ein Band + „+n Hinweise“, Phasenleiste § 2.3 (5 Varianten), 5 feste Reiter (Übersicht · Positionen · Kunde & Lieferung · Zahlung · Verlauf), rechte Spalte Beträge (Zahlungsbalken) + Bezüge, Feldwerte Zuständig/Notiz (Autosave 1 s)/Abholfrist |
| `/shop/zahlungen`, `/[name]` | T2/T5 | Ansichten Alle · Erstattungen · Freigabe nötig · Ohne Auszahlung · Zahlungsstreit; Summen Eingang/Erstattet/Netto; Akte mit Bändern Freigabe (Zwei-Klick für GF, eigener Antrag gesperrt), Streit, Risiko, „Gebucht“; Tabs Übersicht · Stripe · Erstattungen · Verlauf |
| `/shop/gutscheine` (`?tab=kaeufe`, `?neu=1`), `/[name]`, `/shop/gutscheinkaeufe/[name]` | T2/T5 | Code nur `····-XXXX`, Restbalken, Restwert-Verbindlichkeit; S5 „Gutschein ohne Verkauf“ (nur Leitung, Mehrzweck fest, Vorschau, Code einmalig); Akte mit Sperren/Entsperren/Ersetzen/Einlösung zurücknehmen/Gültigkeit verlängern |
| `/shop/widerrufe` (`?segment=retouren`, `?ansicht=kanban`), `/[name]`, `/shop/retouren/[name]` | T2/T3/T5 | Ampel Rückzahlungsfrist mit Quelle; Widerrufsakte mit drei Fristkarten (ab Zustellung lt. Sendungsverfolgung), „Zustelldatum übernehmen“, Belehrung nachweisbar?, Absendenachweis-Upload (PDF/JPG ≤ 10 MB), Erstatten erst ab Ware/Nachweis (E10 positionsgenau mit Hinsendekosten); Retourenakte mit Prüfung (Betrag explizit gespeichert, Wertminderung nur mit Belehrung) |
| `/shop/anzahlungen`, `/[name]` | T2/T5 | Kontroll-/Linkansicht ohne „Neu“ (E14), Doppelt-Band mit „Doppelte erstatten“ |
| `/shop/stripe` (`?tab=auszahlungen`), `/stripe/ereignisse/[name]`, `/stripe/auszahlungen/[name]` | T2/T5 | Ereignisse in Klartext, Erneut verarbeiten (einzeln/Masse), Auszahlungen mit Differenz, Abgleichen, Schlüssel prüfen, Simulations-Band |
| `/shop/berichte/[report]` | T8 | uebersicht (Charts), umsatz, umsatz-ust (Band „Entwurf – nicht für die UVA“), gutschein-bestand, rueckerstattungen, stripe-abgleich, ohne-rechnung, eu-versand (Schwelle 10.000 €, Warnung ab 80 %), freigaben – über `BerichtSeite` |
| `/shop/einstellungen` (`?tab=…`) | T9 | Shop-Modus-Block mit Prüfliste (Live nur vollständig, zurück auf Test = Undo 8 s), StB-Freigabe als Kommentar, Formulare je Reiter (⌘S, Rückgängig, sensible Felder mit Rückfrage, `auto_abschliessen_tage` ≥ 28) |
| `/shop/abholung` | Kiosk | KioskShell + `AbholungArbeitsplatz` (Tastenfeld 32 Zeichen, physische Tastatur, Wackeln bei Fehlscan, ohne Code mit „Ausweis geprüft“, unbezahlt → „Kunde zur Kassa schicken“ mit Nummer 32 px, Erfolgskarte ohne Timer) |

### Bausteine und Logik

- `lib/backoffice/shop/`: `status.js`, `geld.js`, `fristen.js`, `naechsterSchritt.js`, `primaer.js` (Primärmatrix + Bänder), `aktenAktionen.js`, `kanban.js`, `ansichten.js`, `kennzahlen.js` (inkl. Zu tun, EU-Versand, Charts), `zeilen.js` (Ansichtsmodelle), `stripeTypen.js`, `emailTipp.js`, `texte.js`, `faehigkeiten.js` (17 Fähigkeiten nach E20), `rechte.js`, `pruefliste.js`, `mockWirkung.js` (Mock-Pfad aller ph_shop-Methoden und API-Aufrufe), `backend.js` (Mock ↔ Frappe), `daten.js`, `zugang.js`, `actions.js` (Server Actions: vormerken/Massen, Sofort/Geld, Anlegen, S5, Feldwerte, Einstellungen, Shop-Modus, Nachweis, Abholung, CSV).
- `components/Backoffice/Shop/`: `ShopAktionen` (eine Aktions-Zentrale: Undo/Dialog/Link/Kassa), `Dialoge` (S1 Zahlung, S2 Gutschein, S3 Storno, S4 Erstatten, S9 Teilerstattung/-storno, S10 Ersatz, Soll/Ist, Versendet, Grund, Widerruf erfassen, Prüfung, Widerruf erstatten, Datum, Einmal-Code), `NeueBestellung`, `GutscheinOhneVerkauf`, `ShopListe`, `ShopFilter`, `ListenSeite`, `BestellKanban`, `AktionsKnoepfe`, `Akteteile` (Phasenleiste, Verlauf, Beträge, Fakten, Bezüge), `BestellFelder`, `Einstellungen`, `Abholung` (für den Packtisch der Logistik), `KassaHinweis`, `NachweisUpload`, `EinloesungZurueck`, `Teile`, `Rahmen`, `BestellungenSlot`, `shop.css` (Präfix `bo-shop-`, nur Token).
- Register-Teildateien: `bereiche/shop.js` (Navigation 9 Einträge, Stripe/Einstellungen nur `cancel`, Routen 9 DocTypes), `commit/aktionen/shop.js` (`shop.methode`, `shop.direkt-uebergeben`, `shop.workflow`, `shop.modus-test`), `akte/slots/shop.js` (Kundenakte „Bestellungen“), `aufgaben/shop.js` (5 Zu-tun-Quellen), `freigaben/shop.js` (Erstattung über Grenze), `mock/seed/shop.js` (Nachlauf), `tools/qa/routen/shop.mjs` (28 feste Routen).

## 2. Tests

| Prüfung | Ergebnis |
|---|---|
| Unit Shop (`tests/unit/shop-regeln.test.mjs`, `shop-mock.test.mjs`) | **21 / 21 grün** (Status/Töne, Geld/E4/E8/E9, Teilzahlung, Erstattung positionsgenau, Fristen/Ampel/Belehrung, Nächster Schritt, Primärmatrix parametrisiert 19 Fälle, Bänder, Kanban, Ansichten/Massenprüfung, Kennzahlen, Akten-Aktionen, Glossar/Texte, Seed § 12, Mock-Abläufe, Register, RKSV-/Löschen-Grep) |
| Unit gesamt (`node --test "tests/unit/**/*.test.mjs"`) | 372 / 378 – die 6 roten sind fremd (Register-Schnappschüsse nach CRM-Navigation, Faktura-Routen, Kürzel anderer Bereiche) |
| E2E `tests/e2e/shop-ablauf.spec.js` (desktop) | **8 / 8 grün** (Übersicht + Klickweg Zu packen, Liste/Vorschau/Suche, Packen mit Rückgängig, E4/E1, Neue Bestellung mit E-Mail-Tipp/ohne E-Mail, Kanban-Menü, Widerrufsfristen, Rechte Shop-Team) |
| ESLint auf allen B-SHO-Dateien | **0** Fehler, 0 Warnungen |
| Seiten-Lauf (eigenes Skript, 23 Routen, Desktop hell) | 23 × HTTP 200, 0 Konsolenfehler, 0 Überlauf |
| Screenshot-Lauf `qa-screenshots/b-sho-shop/` (37 Routen × Desktop/iPad/iPhone × hell/dunkel) | 220 Aufnahmen, 0 HTTP-/Konsolenfehler; 18 Befunde (iPhone: Kopfknöpfe der Akten außerhalb, `/shop` Betragsspalte; iPad: Überlauf durch Screenreader-Text der Liste) – danach behoben (Nebenaktionen am Telefon im Menü, Status-Pille am Telefon aus, Listen-Hülle `relative`) und nachgemessen: Dokumentbreite 1024 bzw. 390 ohne Überlauf; Nachlauf-Fotos stehen aus |

## 3. Abweichungen vom Konzept (Freigabe L0 erbeten)

1. **Übersicht nach MASTER Q-B4 statt § 4.1:** keine Heute-Chips (nur Zentrale); „Zu tun“ + zwei Akzentkacheln (Zu packen, Abholung) + höchstens vier Kennzahlen; Charts in `/shop/berichte/uebersicht`; Stripe-Zustand als Zeile in der Widerrufe-Kachel (Leitung).
2. **Ein Band je Akte (MASTER Q-B6)** statt zwei; weitere als Zeile „+n Hinweise“.
3. **Akte mit Lounge-Hero** (Produktbild + Glas-Kacheln) statt reiner Lesekarten-Kopfzeile – Gestaltung nach Lounge §7.3.
4. **Commit-Aktionen in `commit/aktionen/shop.js`** (laut 09-entscheidungslog Teil des Bereichsmusters; der Auftrag nannte die Datei nicht ausdrücklich).
5. **Mock-Nachlauf ersetzt die generischen Shop-Datensätze** durch die Fälle aus § 12; `anzahl`/`kern` unverändert (Zufallsfolge anderer Bereiche bleibt). Vier Lieferscheine (LS-2026-9000x) und eine Rechnung (ENTW-2026-90001) werden **angehängt** (Bezüge für Fristen und E9). Im laufenden Dev-Server baut `daten.js` die Shop-Fälle einmalig nach (die Mock-DB entsteht nur beim Start).
6. **Berichte** rechnen im Backoffice aus den Listen (gleiche Regeln wie Kennzahlen) statt `getReport` – die Frappe-Reports lösen das ab, sobald geprüft.
7. **Kunde informieren „Ware liegt bereit“** öffnet das Mailprogramm (mailto) mit Textbaustein, bis `Informieren` mit Exchange läuft.
8. **Kürzel:** Strg/⌘+Enter (Primär in Akte und Dialogen), Shift+Enter (Zeile/Karte), 1–9 (Status-Filter), ⌘S (Einstellungen) sind umgesetzt; Registereinträge (`kuerzel/shop.js`, z. B. Shift+O/Shift+R, `k`) sind **noch leer** – das Kürzel-Register meldet derzeit fremde Kollisionen, Eintrag folgt nach deren Bereinigung.

## 4. Fähigkeiten (Regel E20)

Alle 17 `shop.*` ohne Probe sind im Mock **aus** (Schalter `BACKOFFICE_MOCK_FAEHIGKEITEN` schaltet frei): erwartet + sichtbar deaktiviert mit Ersatzweg: `rechnung` (→ Faktura), `gutschrift` (Erstattung bei Rechnung gesperrt), `ohne-email` (→ Kassa), `gutschein-reaktivieren`, `uva-freigabe` (Band Entwurf), `zahlungsstreit-buchung`, `retourenlabel` (→ Logistik), `abholbereit-unbezahlt` (A1); nicht erwartet (ausgeblendet): `abholfrist-behalten`, `widerruf-positionen`, `kassa-uebergabe`, `direkt-uebergabe`, `fagg18`, `retoure-grund`, `bestand`; Probe: `gebuehrenbeleg` (Feld fehlt), `druck` (an).

## 5. Offene Punkte

- **Einbindung durch Besitzer:** `aufgaben/shop.js` (P0-5/L0), `freigaben/shop.js` (P0-7/L0), `akte/slots/shop.js` (P0-5a/L0) brauchen je eine Importzeile im Index; danach erscheinen Shop-Zeilen in Zentrale/Glocke/Kundenakte.
- **Packtisch (B-LOG):** `components/Backoffice/Shop/Abholung.js` (`AbholungArbeitsplatz`, `AbholungKarte`, `CodeTastenfeld`, `OhneCodeSuche`, `AbholungenHeute`) in die Packtisch-Karte „Abholung“ einbinden; bis dahin `/shop/abholung`.
- **Befund an P0-3:** Der Commit-Dienst ist je Prozess in `globalThis.__phBoCommit` zwischengespeichert und kennt nach einem Hot-Reload neu eingetragene Bereichs-Aktionen nicht („nicht registriert“). B-SHO baut ihn in diesem Fall einmal neu auf (`actions.js → plane()`); sauberer wäre ein Vergleich der Aktions-Registerversion in `commitDienst()`.
- **Palette:** Schnellaktionen „> Telefonbestellung“, „> Reservierung“, „> Zahlung erfassen“ nicht eingetragen – die Liste ist im Fundament-Test eingefroren (wie bei B-CRM).
- **Druck:** Druckpanel mit den ph_shop-Formaten (Bestätigung, Zahlungsbeleg, Gutschein, Widerruf, Begleitschein) angebunden; Massendruck und TEST-Wasserzeichen hängen an den Formaten (A20).
- **Nicht gebaut / vereinfacht:** S8 Sammel-Storno (Massenaktion „Stornieren“ fehlt in der Liste – Einzelstorno über die Akte), Side-Peek per Leertaste nur als URL-Vorschau, iPad-Spezialansicht der Liste (4 Spalten) nur über Ausblenden der Nebenspalten < 1280 px, Glocken-Erinnerungen § 10.2 (über die Zu-tun-Quellen/Freigaben, sobald eingebunden), Hilfe-Artikel (Q5).
- **iPad:** Bestell- und Widerrufsliste scrollen bei 1024 px innerhalb der Kachel waagrecht (Tabelle ~1.150 px); die 4-Spalten-Fassung „Status + Nächster Schritt in einer Zelle“ (§ 4.2) fehlt noch.
- **E2E ipad / axe / Budget** nicht gelaufen (Zeit; Playwright-Artefakte kollidierten zeitweise mit parallelen Läufen anderer Teams).

## 6. Neue Fragen

Inhaber 81–86 (`90-inhaber-fragen.md`), Steuerberater 42–45 (`91-steuerberater-fragen.md`).
