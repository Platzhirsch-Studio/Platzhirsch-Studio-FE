# Übergabe B-ZEN – Bereich Zentrale (Welle 1, Lounge)

**Stand:** 04.11.2026 · Team B-ZEN · Maßstab `art-direction/lounge.md`, Entwurf `/entwurf/lounge`, Konzept `10-konzept-zentrale.md`, MASTER § 5.6 / § 6
**Dev-Server:** :3100 (Mock) nicht neu gestartet. Neue Seed-Nachläufe (`mock/seed/zentrale.js`) wirken erst nach dem nächsten Neustart des Dev-Servers.

## 1. Gebaut

### Routen
| Route | Inhalt |
|---|---|
| `/` | Zentrale je Rolle im Lounge-Bento: Begrüßung 56/300 zweizeilig (Vorname), Datum · Standort, drei leichte Kopfzahlen mit Haarlinien (hochzählend), eine Primäraktion in Tinte je Rolle (`PRIMAER_JE_PROFIL`, Rückfall bei fehlendem create-Recht), Heute-Leiste (Chips nur > 0, rot → Sand, max. 6 + „+n“, Fristen mit Rechtsgrundlage als Tooltip **und** sr-Text). Kacheln: Heute-Spalte (aktiver Termin mit „Beratung starten“, Folgetermine; Montagen als Rückfall; „Termine vorbei“-Zustand), Braucht deine Antwort (Freigabe über `FreigabeEintrag` › ältestes unbeantwortetes Angebot › älteste überfällige Aufgabe › ruhiger Leerzustand), zwei Akzentkacheln (Cognac/Salbei, Quelle nach Recht, Null nur als letzter Rückfall), Meine Aufgaben (PH Aufgabe + ToDo, Häkchen mit 8-s-Halten und Rückgängig, Inline-Schnellanlage mit Parser), Pipeline (Anzahl/Wert je Stufe, Abschlussquote 90 T und Ø Tage bis Auftrag – nur aus Daten), Umsatz netto je Monat (Bezugsmonat Tinte, laufender schraffiert, Tooltip je Balken, Trend nur mit Vergleich), Laufende Projekte (Bild, Stufen-Pille, Avatar-Reihe, nächster Schritt, Fortschritt, Wert; Telefon: Karten), Aktivität (Avatar, Satz, Objekt), Admin: Betriebsbereitschaft (6 Prüfpunkte) + Integration (API 24 h, Geräte > 24 h), Kanzlei: Export-Läufe · Offene Posten · Kassenbuch, Selbstservice/Kiosk-Rollen: Verweis-Kacheln. Jede Kachel zeichnet ok/leer/fehler/recht selbst; Reihen gehen immer auf 12 auf (`layout.plan`, Unit-Test über 10 Rollen × 5 Rechte × 3 Akzent × 2 Kennzahl-Fälle). Tasten Umschalt+R/A/L. |
| `/aufgaben` | Liste aus PH Aufgabe + ToDo („System“), Sicht Meine/Team/Alle (Team/Alle nur Leitung/GF/Admin), Liste/Karten (Kanban des Fundaments), Status- und Frist-Chips in der URL, Suche (GET), drei Leerzustände, Schnellanlage `?neu=1` |
| `/aufgaben/[name]` | Aufgabenakte: Erledigen (Strg+Enter, kein Dialog), Status-Segment, Fällig +1/+7, Priorität, Beschreibung/Ergebnis speichern beim Verlassen – alles mit Rückgängig; Bänder Erledigt/Verworfen/automatisch; Bezug, Zuständig, Verlauf (`Zeitleiste`) |
| `/verwaltung` | Hub (Benutzer & Rollen, Geräte, Einstellungen, Protokoll, Druck) – Karten nach Recht, Zähler aus je einer Abfrage, Telefon-Hinweis |
| `/einstellungen` | Reiter Firma · Allgemein · Website & API · Kalender · Kalkulation · Microsoft · Ablage · System. Firma: Pflichtangaben-Band, „Als Standard setzen“ mit Rechtsträger-Rückfrage, UID/IBAN-Prüfung, Steuernummer nur GF/Admin/Faktura-Leitung. Allgemein/Website: Testmodus und Website-API als „Schalter mit Wirkung“ (Rückfrage mit echter Wirkung, sofort gespeichert, Band bei API aus). Kalender: Bundesland + Schließtage (Datumsfeld, Duplikat am Feld). **Kalkulation** (`ph_projekte.api.kalkulation_einstellungen` / `_speichern`, Mock: Single „PH Projekte Einstellungen“): Kostensätze, Ziel-DB, Gemeinkosten, Schwellen, Begründung fürs Protokoll, Prüfregeln wie der Server. **Microsoft** (`ph_microsoft.api.status()` + Single „PH Microsoft Einstellungen“, Felder exakt). **Ablage** (Single „PH Ablage Einstellungen“). System: Baustein-Demos (unverändert eingebunden), Nummernkreise, Zugangsschlüssel-Hinweis. Speicherleiste als Material-Kapsel erst nach Änderung, Strg+S, Verlassen fragt. |
| `/benachrichtigungen` | Reiter Für mich/Team/System, nach Tag gruppiert, Freigaben mit `FreigabeEintrag` |
| `/suche?q=` | GET-Formular, Gruppen aus `suche()` (Palette), Start-/Leer-/Fehlerzustand |
| `/druck` | Warteschlange (Leerzustand), Druckformate (aus `DRUCKFORMATE`), Drucker (Geräte mit Drucker) – Formate/Drucker nur Leitung/Admin |
| `/geraete` | Geräteliste (bestehende `GeraeteTabelle`, Sperren/Entsperren), Registrieren über `/geraet` |
| `/protokoll` | Reiter Aktivität (100 Einträge, Bereichs-Chips, **kein Person-Filter**, Q-A12), API (Kopfzahlen 24 h + bisherige Tabelle), Fehler/Anmeldungen als ehrlicher Hinweis |

### Bausteine und Logik
- `src/components/Backoffice/Zentrale/`: `zentrale.css` (nur Token, Präfix `zb-`), `Kopf.js`, `Kacheln.js`, `AufgabenListe.js` (+ `Schnellanlage`), `AufgabeAkte.js`, `Einstellungen.js` (Formular, Schalter mit Wirkung, Schließtage, Standardfirma, Kalkulation), `AufgabenSlot.js`, `ZentraleTasten.js`.
- `src/lib/backoffice/zentrale/`: `texte.js`, `layout.js` (Varianten, Plan, Primäraktion, Gruß), `fristen.js` (UVA, OSS, Jahresbeleg, SEE, DEP, Erstattung), `umsatz.js` (Umsatz netto, Zahlungseingang, OP, Kassa heute), `aufgaben.js` (zwei Quellen, Filter, Titel-Parser), `projekte.js`, `daten.js` (alle Quellen mit Rechte-Vorprüfung), `dienste.js` (Kalkulation/Microsoft mit Mock-Pfad), `mock.js` (ToDo-Mock), `actions.js` (Status, Verschieben, Zuweisen, Feld, Anlegen, Massen-Erledigen, Einstellungen, Testmodus, API, Firma, Standardfirma, Kalkulation, Singles – alle `{ok, code, message, undo?}`, nie werfen).
- Register-Teildateien: `bereiche/zentrale.js` (Navigation Dashboard · Aufgaben · Verwaltung, `routen` PH Aufgabe → `/aufgaben/…`, PH API Protokoll → `/protokoll?tab=api`), `kuerzel/zentrale.js` (Umschalt+R/A/L), `aufgaben/zentrale.js` (2 Zu-tun-Quellen), `freigaben/zentrale.js` (bewusst leer), `druck/zentrale.js`, `akte/slots/zentrale.js` (Offene Aufgaben in Kunden- und Projektakte), `mock/seed/zentrale.js` (Nachlauf: Bezüge, überfällig, heute, automatisch, ohne Zuständigkeit, Admin-Aufgaben), `tools/qa/routen/zentrale.mjs` (+15 Routen).

## 2. Tests
- Unit: `tests/unit/zentrale-logik.test.mjs` **20/20 grün** (Plan, Fristen Z-67, Umsatz Z-54, Zahlungseingang Z-55, OP Z-56, Kassa Z-57, Quellen Z-69, Parser Z-38, Kalkulation, Mock-ToDo, Texte Z-35). Gesamtlauf `tests/unit/**`: **272/278** – die 6 roten sind Register-/Shell-Schnappschüsse (s. 3.), davon 5 durch andere Bereiche (Kundenkarte/CRM/Kassa: Listenroute doppelt, Kürzel shift+k und f12, CRM-Navigation 8 Einträge, Hilfe-Liste).
- E2E `tests/e2e/zentrale-start.spec.js` desktop **6/6 grün** (GF-Zentrale + axe, Admin/Kanzlei, Erledigen + Rückgängig, Schnellanlage +3, Verwaltung/Einstellungen/Testmodus-Rückfrage/Speicherleiste/Kalkulation + axe, Navigation ohne Verwaltung).
- ESLint auf allen B-ZEN-Dateien: **0**.
- Screenshots: `backoffice/qa-screenshots/b-zen/` (31 Routen × 3 Viewports × hell/dunkel = 186 Aufnahmen, 1363 s, `bericht.md`). 6 Hinweise: „Zeile hinzufügen“ ragte am iPhone aus der Kalkulations-Kachel (danach behoben: Kopf bricht um), `/geraete` und `/druck` je einmal Fremdfehler aus dem gerade umgebauten Bereich Projekte (`projekte/daten` fehlte, 500 einmal, Wiederholung 200), `/` iPad dunkel eine React-Warnung beim Hydrieren (nicht reproduziert), `/protokoll` iPad Navigation während der Messung. Akzentkacheln stehen am iPhone jetzt paarweise (Lounge § 12); Arbeitsblicke gegen `entwurf-lounge/1-zentrale` gelegt: Leiste, Begrüßung, Kopfzahlen, Bento-Rhythmus, Heute-Spalte, Wartet-Zitat, Akzentkacheln, Pipeline, Umsatz-Balken, Projekte mit Bild – aus einem Guss.

## 3. Offen / an L0
1. **Register-Schnappschuss-Tests** (`backoffice-register.test.mjs`, `backoffice-shell.test.mjs`) frieren den P0-Stand ein. Für die Zentrale zu aktualisieren: Navigation `/d/ph-aufgabe` + `/einstellungen` → Dashboard · Aufgaben · Verwaltung (Shell-Test „aktiver Bereich“ rot); danach kann B-ZEN `seiten.verwaltung/benachrichtigungen/druck` (G W / G B / G D) und die Palette (`/aufgaben?neu=1`, Recht `create`, Hilfe-Einträge) eintragen – heute bewusst auf dem alten Stand gelassen, damit die Tests nicht noch mehr rot werden.
2. Index-Zeilen eintragen (L0/P0-5): `aufgaben/index.js` ← `aufgaben/zentrale.js`, `akte/slots/index.js` ← `akte/slots/zentrale.js`.
3. Glocke verlinkt Aufgaben weiterhin auf `/d/ph-aufgabe/…` (P0-7); dank `routen` leitet das per 307 auf `/aufgaben/…`.
4. Nicht gebaut aus dem Konzept (Folgewelle): Benutzerakte `/benutzer/[name]` mit Zugriff/PIN/Austragen (Z2/Z5), `/geraete/[name]` + Token-Dialog/QR + Live-Verbindung (Z1), Arbeitsplatz-Tasten 1–5 und Vorauswahl, Druckvorschau 800 und echte Warteschlange (Fundament hat noch keinen Speicher), Hilfe-Artikel `hilfe/zentrale/*.md`, Konfliktdialog mit Panel, Datenschutz (A8), Massenaktionen der Aufgabenliste (Action `aufgabenErledigenAction` ist da, Leiste fehlt), Charts-Umschalter 6/12 M.
5. Raumbilder der Projektzeilen liegen unter `public/entwurf/lounge/` (Entwurfsordner) – bei Gelegenheit nach `public/backoffice/raeume/` verschieben (L0, kein B-ZEN-Schreibbereich).

## 4. Abweichungen vom Konzept (Lounge hat Vorrang, Nr. 51/53)
- Kennzahl-Streifen § 3.2.4 → drei leichte Kopfzahlen + Akzentkacheln + Kennzahlen-Kachel (Lounge § 7.1); Versalien-Etiketten entfallen.
- Zentrale-Kürzel `R`, `1–6` → Umschalt+R/A/L (Q-F5: nur Umschalt+Buchstabe).
- „Zuletzt · Angeheftet“ (localStorage) gibt es im Fundament nicht → Kachel „Zuletzt bearbeitet“ aus eigenen Änderungen (nur Admin-Plan bzw. als Ersatzkachel).
- Verwaltung in der Navigation nur mit Schreibrecht in der Zentrale (Admin, GF); Leitungen erreichen Geräte/Druck über `/geraete`, `/druck` (Frage 67 an den Inhaber).

## 5. Fähigkeiten-Stand
| Funktion | Stand | Grund |
|---|---|---|
| ToDo der Fach-Apps | Frappe an, Mock aus `zentrale/mock.js` | Mock kennt den DocType nicht |
| Kalkulation | an (Frappe-Methode bzw. Mock-Single) | – |
| Microsoft-Status | an für GF/Admin | `status()` prüft dieselben Rollen |
| Testseite drucken | aus, Hinweis sichtbar | Anfrage A17 |
| Fehler-/Anmeldeprotokoll | aus, Hinweis sichtbar | Error Log/Activity Log nicht angebunden |
| Feiertagsliste | aus, Hinweis sichtbar | Anfrage A14 |
| Zugangsschlüssel-Status | „Nicht prüfbar“ | Anfrage A16 |

## 6. Fragen
Inhaber 64–67 (`90-inhaber-fragen.md`), Steuerberater 34–35 (`91-steuerberater-fragen.md`).
