# Übergabe B-PRJ – Bereich Projekte (Welle 2, Lounge)

**Stand:** 04.11.2026 · Team B-PRJ · Grundlage: `10-konzept-projekte.md` (Fassung 2, § 16 Bauauftrag), `art-direction/lounge.md`, MASTER § 2/§ 6, Inhaber-Entscheidungen 46–53 (Projektnachkalkulation, Montage-Kiosk, Lounge).

## 1. Gebaute Routen (alle mit `requireRecht`, Mock-Modus vollständig)

| Route | Typ | Inhalt |
|---|---|---|
| `/projekte` | T1 | Übersicht: Seitenkopf (Datum, „Nur meine ⟷ Alle“, Primär „Neues Projekt“), Zu tun (7 Quellen aus `aufgaben/projekte.js`), 2 Akzentkacheln (Rückmeldungen, Montagen diese Woche), Braucht Leitung (Leitung) bzw. Fällige Aufgaben, Mängel-Kachel, „Laufende/Meine Projekte“ als Tabelle in Kachel (Bild, Phase, Team, Empfohlen + Fortschritt, nächster Termin). Keine Charts (E16). |
| `/projekte/liste` | T2 | `?ansicht=liste|kanban|zeitplan`, Phasen-Segment mit Zählern, Suche (GET). Kanban mit Workflow-Übergängen als verzögerter Commit; Abgeschlossen/Abgebrochen nur über die Mappe. Zeitplan = Mini-Gantt je Projekt (12 Wochen) + Konflikttext Fremdgewerk/Montage. |
| `/projekte/zeitplan` | 307 | → `/projekte/liste?ansicht=zeitplan` (E15) |
| `/projekte/neu` | T6 | PA1 ein Bildschirm: Kunde, Anfrage (optional), Projektart-Pillen, Titel, Priorität, Objekt eingeklappt, Raumvorschläge je Art, Satz „Legt … an“, Idempotenz-Schlüssel. |
| `/projekte/[projekt]` | T5 | **Auftragsmappe**: Kopf (Zurück, Pfad, Empfohlen-Primär `Strg+Enter`, Aktionsmenü ⋯ mit Kunde/Anlegen/Drucken/Phase/Leitung), Hero mit Glas-Kacheln (nächster Termin, Lieferung KW, Montagezeitraum, Fortschritt nach `fertigstellungsgrad`), Band (E4 „Phase anpassen“ bzw. Abgebrochen), Phasenleiste (Vorgangsleiste, 9 Stufen, Karten je Stufe, Objekte im Popover, „teilweise“), genau 6 Reiter, rechte Spalte Aktivität (Filter, Composer Intern/An Kunde) + Details. Akte-Slots anderer Bereiche (`akte="projekt"`) am Ende jedes Reiters. |
| `?tab=belege-lieferung&ansicht=kalkulation` | – | **Nachkalkulation** (nur Leitung, Fähigkeit `projekte.kalkulation`): Kopf Erlös/Ist+Obligo/Prognose/DB laufend/End-DB mit Ampeln (Wort + Form), Ist-Obligo-Rest-Balken, DB1–3(+4) Ist/Prognose/Budget, Wochenreihe (Ist kumuliert), Kostenarten-Tabelle mit Summenzeile und Ampel, Belege (Quellen), Hinweise. Frappe: `ph_projekte.api.projekt_kalkulation_v2`; Mock: Port von `utils/kalkulation.kalkulation_v2` (`lib/backoffice/projekte/kalkulation.js`) auf Seed-Daten. `?tab=kalkulation` und `?tab=belege` sind Aliasse. |
| `/projekte/[projekt]/planung/[name]` | T5 | Primär je Status (Vorlegen · Freigeben/Freigabe übernehmen · Neue Version · Positionen ins Projekt), Verwerfen mit Rückfrage, Änderungswunsch-Band, Versionen. |
| `/projekte/[projekt]/renderings/[name]` | T5 | Bildfläche mit Pins (Pin-Modus Klick oder Pfeile+Enter), Zoom, Varianten-Leiste, Faden (Kunde/Studio), Antworten, Erledigt (verzögerter Commit), Freigabe übernehmen, Vorlegen/Verwerfen. |
| `/projekte/[projekt]/aufmass/[name]` | T5 | Objekt, Räume, Maße (mm), Anschlüsse, Plausibilität als Hinweis. |
| `/projekte/[projekt]/nachtraege/[name]` | T5 | Positionen entfällt/neu, Differenz nur Leitung, Vorlegen (Commit), Freigabe vor Ort nur mit Unterschrift, Band „AB noch nicht angepasst“. |
| `/projekte/[projekt]/tagebuch|dokumente|nachrichten` | 307 | → Mappe (§ 3.1) |
| `/projekte/objekt/[art]/[name]` | 307 | Resolver für kanonische Routen ohne Projektnamen (Planung, Rendering, Aufmaß, Nachtrag, Aufgabe). |
| `/projekte/rueckmeldungen` | T2 | Inbox Liste + Vorschau, Art-Segment mit Zählern, J/K, Umschalt+E, Antworten, Erledigt als verzögerter Commit, Nachtrag/Planung öffnen. Zahl = gleiche Formel wie Übersicht (§ 3.6). |
| `/projekte/montagen` | T4 | Kalender (Fundament-Kalender, Woche), Kapazität je Tag (2 Monteure × Tagesstunden, Text bei Überlast), Doppelbuchungen als Text, Nicht eingeplant; Kanban (Abgenommen → nur Ablauf); Liste mit Statusfilter. Umplanen per Ziehen (sofort, Rückgängig im Toast, Hinweis „Kunde nicht informiert“). |
| `/projekte/montagen/[name]` | T5 | Status-Stufen, Reiter Übersicht/Leistungen/Fotos/Mängel/Bericht, Primär je Status, **Abnahme mit Kunde** (`?ablauf=abnahme`, 5 Schritte, eine Unterschrift unter Text E3, Studio-Bestätigung, Kopie Portal+E-Mail/Papier, Häkchen; Variante „Nur Leistungsnachweis“). |
| `/projekte/abnahmen/[name]` | T5 | Ab Unterzeichnet schreibgeschützt (E11), je Mangel Erledigt/→ Servicefall, Abschließen erst ohne offene Mängel (Grund am Knopf). |
| `/projekte/maengel` | T2 | Drei Quellen, Filter Quelle/Überfällig, Zeilenaktion Erledigt. |
| `/projekte/nachtraege` | T2 | alle Nachträge, Statusfilter, Differenz nur Leitung, AB-Spalte. |
| `/projekte/aufgaben` | T3 | Schnellanlage mit Token (`#Projekt @Person !hoch morgen 12.11.`) + Kanban (Status sofort, Rückgängig). |
| `/projekte/zeiten` | T2 | Buchungen (Mitarbeiter: eigene), „Abrechenbar offen“, Zeit buchen (Dialog, Umschalt+H, Dauer-Deutung live). |
| `/projekte/fremdgewerke` | T2/T3 | Liste, Detail `?gewerk=` (Termine, Abnahme, Mängel, Status nach erlaubten Übergängen § 7.5), Konfliktband. |
| `/projekte/dokumente` | T2 | Kacheln, Kategorie-/Sichtbar-Filter, „Kunde sieht/Intern“ umschalten; `?kategorie=Rendering|Aufmass`. |
| `/projekte/produktpaesse`, `/[name]` | T2/T5 | Herstellergarantie getrennt, Hinweis KSchG § 9b bei Ablauf, Materialien/Pflege. |
| `/projekte/referenzen`, `/[name]` | T2/T5 | Prüfseite mit Prüfliste (Server-Regeln), Veröffentlichen nur Leitung und nur bei erfüllter Liste, Widerruf mit roter Rückfrage. |
| `/projekte/berichte/[report]` | T8 | uebersicht (4 Diagramme), projektstatus, offene-maengel, montagekapazitaet, zeiten (je Person nur Leitung), liefertermine, nachkalkulation (Leitung, Ampel je Projekt). |
| `/projekte/einstellungen` | T9 | nur Leitung: Rückmeldungen, Portal, Bautagebuch, Montage, Referenzen, Liefertermine, Texte, Automationen AU1–AU12 (alle aus, gesperrt), Kalkulationsparameter lesend. Speicherleiste, Strg+S. |
| `/montage` (Kiosk) | Kiosk | Heute · Woche, nächster Stopp als Tinte-Karte, Navi/Anruf 48 px. |
| `/montage/[auftrag]` | Kiosk | Ort/Hinweis, Unterlagen, Leistungen (Checkzeilen 56 px), Fotos (FotoAufnahme, Warteschlange), Mangel (Text + Frist-Chips), Zahlung (nur Hinweis, kein Bargeld – E14), Zustandsknopf Losfahren/Beginnen/Fertig als 6-s-Commit (nur mit Workflow-Recht, sonst „Status meldet dein Montageleiter“). |
| `/montage/[auftrag]/abnahme` | Kiosk | gleicher Ablauf „Abnahme mit Kunde“. |

## 2. Code

- `src/lib/backoffice/projekte/`: `texte.js` (Glossar, alle UI-Texte), `status.js`, `anzeige.js`, `zeit.js`, `mengen.js`, `maengel.js`, `montage.js`, `zaehler.js`, `empfohlen.js` (§ 4.3), `phase.js` (E4), `bezug.js` (E8), `kalkulation.js` (Port `kalkulation_v2`), `mappe.js` (Phasenleiste, Termine, Mini-Gantt, Aktivität, Mock-Kalkulation), `regeln.js` (Fremdgewerk-Übergänge, Konflikte, PA8, Referenz-Prüfliste), `schnell.js`, `faehigkeiten.js` (12 Fähigkeiten + AU1–AU12) – rein, unit-getestet; `lesen.js` (server-only Lesen, `projekteClient`), `planen.js`, `akte.js`, `kiosk.js`; `actions.js` (30 Server Actions, jede mit Mock-Pfad).
- `src/components/Backoffice/Projekte/`: `projekte.css` (Präfix `bo-prj-`, nur Token), `Teile`, `Tabelle`, `MappeTabs`, `MappeAktionen`, `MontagePlanenSheet`, `ZeitBuchenDialog/-Knopf`, `Aktivitaet`, `Nachkalkulation`, `PhaseAnpassen`, `BrauchtLeitung`, `MaengelKachel`, `ProjektKanban`, `ProjektNeu`, `RenderingAnsicht`, `NachtragFreigabe`, `Rueckmeldungen`, `MontageKalender`, `AbnahmeMitKunde`, `AufgabenBoard`, `EinstellungenForm`, `AktionKnopf`, `MontageKiosk`, `KundenProjekteSlot`.
- Register: `bereiche/projekte.js` (14 Navigationseinträge, 18 DocTypes, 15 kanonische Routen), `kuerzel/projekte.js` (8), `aufgaben/projekte.js` (7 Zu-tun-Quellen), `akte/slots/projekte.js` (Kundenakte „Projekte“), `mock/seed/projekte.js` (Nachlauf: 14 Projekte je Status inkl. Abgebrochen/CH, Positionen aller Lieferstatus, 10 Montagen inkl. mehrtägig/Doppelbuchung, Abnahmen, Fremdgewerke mit Konflikt, Planungen/Renderings/Pins/Sprachnotiz/Votes, Nachträge, Aufmaße, Aufgaben, Zeiten, Dokumente, Fotos, Produktpässe, Referenzen, Kostenarten, Kalkulations-Platzhalter), `tools/qa/routen/projekte.mjs` (22).
- **Dev-Hinweis:** `projekteClient()` ergänzt im Mock (nie Produktion) einen vor dem Projekte-Seed gestarteten Speicher einmalig um die Projekte-Daten – kein Neustart des Dev-Servers nötig.
- **Turbopack:** `lib/backoffice/projekte/daten.js` blieb im laufenden Dev-Server auf einem alten Stand hängen (neue Exporte unsichtbar, auch nach Neuanlage). Das Modul heißt deshalb `lesen.js`.

## 3. Tests

- Unit: `tests/unit/projekte-logik.test.mjs` 18/18, `tests/unit/projekte-register.test.mjs` 8/8. Gesamtlauf `node --test "tests/unit/**/*.test.mjs"`: siehe Abschnitt 8 (fremde Fehlschläge: Fundament-Schnappschüsse wegen CRM-Navigation, nicht B-PRJ).
- E2E: `tests/e2e/projekte-kernwege.spec.js` (8), `tests/e2e/projekte-kiosk.spec.js` (2, Tag `@kiosk`) – Ergebnis Abschnitt 8.
- ESLint: 0 Fehler, 0 Warnungen auf allen B-PRJ-Dateien.

## 4. Abweichungen vom Konzept (Freigabe L0 erbeten)

1. **Nachkalkulation als Ansicht im Reiter „Belege & Lieferung“** (Segment Belege · Nachkalkulation) statt eigenem Reiter – E1/Q-B6 (max. 6 Reiter) bleibt gewahrt; Auftrag nannte „Nachkalkulation-Tab“.
2. Reiter-ID `belege-lieferung` (SLOT-API v1) statt `belege`; `?tab=belege` bleibt Alias.
3. **Heute-Leiste** entfällt auf `/projekte` zugunsten „Zu tun“ (MASTER Q-B4: Heute-Leiste nur Zentrale).
4. Kalkulation „Mengen-Dezimal“, „Teilabnahme“, „Kundenvorschau“, „Nachtrag im Portal“, „Inkasso“: Fähigkeit aus (keine Backend-Felder) → nicht angeboten (E18).
5. Präsentationsmodus `KundenAnsicht` (§ 8.2), Pin-Audio-Player, Bildvergleich-Regler, Ablage-Overlay „Datei auf Mappe ziehen“, Sammel-PDF/ZIP-Routen und Offline-Puffer im Kiosk sind **nicht gebaut** (siehe offene Punkte).
6. Composer „An Kunde“ nutzt `portal_status_senden` (verzögerter Commit) – im Mock legt die Methode keine Nachricht an (MockClient protokolliert nur).
7. Rückmeldung „Erledigt“ läuft über `fundament.methode` (`erledigt`/`als_gelesen`) – im Mock ohne Wirkung nach Neuladen (Zeile bleibt in der Sitzung ausgeblendet). Eigene Commit-Aktionen `projekte.*` sind nicht angelegt, weil `commit/aktionen/projekte.js` nicht im Schreibbereich lag.

## 5. Fähigkeiten-Stand (Mock, Probe gegen Backend-Import)

| ID | Stand | Grund |
|---|---|---|
| projekte.kalkulation | an (Leitung) | `api/kalkulation.projekt_kalkulation_v2` whitelisted |
| projekte.montage_kiosk_status | an | PH Montage im Workflow (A18 geliefert) |
| projekte.kollisionen, mappe_pdf, herstellerbestellungen, servicefall | an | Methoden vorhanden |
| projekte.summen | aus (nicht erwartet) | E9 – keine berechneten Projektsummen |
| projekte.mengen_dezimal, teilabnahme, nachtrag_portal, kundenvorschau | aus (nicht erwartet) | Felder/Methoden fehlen |
| projekte.inkasso | aus | Inhaber + StB |

## 6. Offene Punkte / Anfragen an andere

- **L0/P0-5:** Importzeilen eintragen: `aufgaben/index.js` (`projekte`), `akte/slots/index.js` (`projekte`).
- **P0-1:** Test „Palette: Schnellaktionen in alter Reihenfolge“ fixiert `Neues Projekt → /d/ph-projekt/neu`; B-PRJ hat deshalb keine Palette-Einträge (Rückmeldungen, Montagen, Zeitplan, Zeit buchen, Neues Projekt → `/projekte/neu`) ergänzt. Bitte Test lockern, dann trägt B-PRJ nach.
- **P0-3:** `fundament.workflow` lässt Aktionsnamen mit Umlaut/ß nicht zu (`TEXT_GRENZE` mit `\w`): „Übergeben“, „Abschließen“, „Zurück“ gehen daher nicht als verzögerter Commit (B-PRJ führt sie direkt bzw. nur für Leitung aus). Bitte `\p{L}` erlauben.
- **Backend ph_crm:** Projekte-Rollen haben kein Leserecht auf PH Kontakt/PH Anfrage – PA1 (Kunde wählen) und E-Mail-Prüfung (§ 3.5) funktionieren im Frappe-Modus nur über `auftragsmappe`; für PA1 fehlt die Kundenliste (Hinweis im Formular). Vorschlag: Leserecht Projekte Mitarbeiter auf PH Kontakt (permlevel 0).
- **CRM-Seed:** kein Kontakt ohne E-Mail im Mock → Fall „Kein Portal – Kunde ohne E-Mail“ ist nur unit-/codeseitig abgedeckt.
- **Faktura/Sortiment/Logistik-Seed:** keine Belege mit `projekt`/`bezug_name` → Reiter „Belege & Lieferung“ zeigt „Noch kein …“. Bitte je ein Projekt (PH-PRJ-2026-0002) verknüpfen.
- **Demo-Benutzer:** es gibt keinen reinen „PH Projekte Mitarbeiter“; Mitarbeiter-Sicht (ohne Beträge, ohne Leitungsaktionen) ist nur unit-getestet.
- Nicht gebaut (Folgeauftrag, ca. 1–2 Agententage): Präsentationsmodus, Ablage per Drag & Drop mit Typwahl, Renderings vorlegen (Sammel-Sheet), Nachtrag anlegen (Sheet), Produktpässe-Sheet, PA9 mit Faktura-Folgen, Position zurücknehmen, Offline-Puffer + Konfliktkarten im Kiosk, Kamera-Ansicht mit Serienaufnahme, Sprachnotiz-Player, Hilfe-Artikel (Q5), Screenreader-Durchlauf, axe-Lauf.

## 7. Neue Fragen

- Inhaber: 90-inhaber-fragen.md Nr. 91–94. Steuerberater: 91-steuerberater-fragen.md Nr. 49.

## 8. Prüfergebnis

- Unit Projekte: 27/27 (`projekte-logik` 18, `projekte-register` 9, darunter QA 23 „Zu tun = Inbox-Formel“ und QA 41 „kein fremder Kontakt“). Gesamtlauf: 502/506 – die 4 Fehlschläge gehören anderen Teams (Marketing: Routen für fremde DocTypes und Kürzel `shift+k` doppelt in „akte“; CRM: Fundament-Schnappschuss Navigation).
- E2E desktop: `projekte-kernwege` 8 Tests – 7 grün (Montage planen „flaky“ nur durch Trace-Datei-Kollision paralleler Playwright-Läufe, Wiederholung grün), „Abnahme mit Kunde“ beim ersten Lauf grün, danach übersprungen, weil der Mock-Speicher keine fertige Montage ohne Abnahme mehr hat (Test sucht sie selbst). `projekte-kiosk` 2/2 desktop und ipad-quer (je 1 × flaky durch Kompilierzeit).
- Gefundener und behobener Fehler: Zu-tun-Zahl „Rückmeldungen“ zählte Nachtragsentscheidungen nicht (8 statt 9).
- ESLint 0 Fehler / 0 Warnungen auf allen B-PRJ-Dateien.
- Screenshots `tools/qa/shoot.mjs`: 17 Routen × 3 Viewports × hell/dunkel = 102 Aufnahmen, **0 Befunde** (HTTP, Überlauf, Konsole, Fokusring) → `backoffice/qa-screenshots/projekte-b-prj/`. Selbst gesichtet neben `entwurf-lounge` (Übersicht, Mappe hell/dunkel, Nachkalkulation, Liste, Kanban, Montagen-Kalender, Abnahme-Ablauf iPad, Berichte, Aufgaben, Kiosk iPhone dunkel).
