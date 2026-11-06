# Übergabe B-SER – Bereich Service (Welle 2, Lounge)

**Stand:** 04.11.2026 · Team B-SER · Grundlage: `10-konzept-service.md` (Fassung 3, Bauauftrag §14), MASTER §2–§6, Lounge (`art-direction/lounge.md`), Inhaber-Entscheidungen Nr. 46–53.

## 1. Gebaute Routen

| Route | Inhalt |
|---|---|
| `/service` | Bereichsstart: Heute-Leiste (nur Zähler > 0), „Jetzt dran“ nach Server-Rang mit genau einem Zeilenknopf (Eingangsbestätigung verzögert, Telefonat-Dialog, sonst Akte mit `?aktion=`), Akzentkacheln Reaktion überfällig / Offene Fälle, Einsätze heute, Kennzahlen je Rolle, Gewährleistung endet in 14 Tagen, Charts nur Leitung/GF |
| `/service/faelle` | Liste (Reiter Alle · Meine · Neu von Kunden · Reaktion überfällig · Gewährleistung endet · Eskaliert · Erledigt, Pillen-Suche inkl. Telefon jeder Schreibweise, Bild, Status „Entschieden“, Gewährleistung kompakt, ein rotes Signal, Nächster Schritt mit Fälligkeit, Avatar), Massenaktionen (Mir zuweisen/Priorität mit Rückgängig, Eingangsbestätigung, Schließen mit Regel D-3), Kanban (eigene Service-Kanban-Komponente, Übergänge mit Pflichtangaben öffnen den Assistenten), S1-Schnell als Sheet (`?melden=1`) |
| `/service/faelle/neu` | S1-Vollständig, 4 Schritte, Gewährleistungs-Vorschau (fristen.js) und Wissen am Fehlercode |
| `/service/faelle/[name]` | Akte: Kopf mit Status/Kennzeichen, genau ein Primärknopf (Server-Schritt), „Weitere Aktionen“, Phasenleiste (6 Phasen, Einsatz geplant als Unterzeile), SLA-Zeile, ein Hinweisband + „weitere Hinweise“, Reiter Übersicht · Mangel & Fristen (Fristband mit Meldezustand R-01, Tabelle) · Bearbeitung · Regress & Abschluss (Lieferanten-Leiste) · Verlauf; rechte Spalte Kunde, Bezüge, Verlauf, interne Notiz (Leitung). Dialoge/Sheets: Telefonat, S2 Prüfen & entscheiden (VGG-Pflichthaken, Schwelle, Textbausteine), Kunde informieren (E-Mail/Brief/Telefon/Persönlich), Ablehnen/Wieder öffnen (Leitung), Kulanz (Leitung freigeben/ablehnen, Mitarbeiter erneut anfragen, Vier-Augen-Hinweis), Ersatzteil hinzufügen, S3 Bestellen, S4a Mängelanzeige (Fotos vorab aus), S4b Forderung, S5 Erledigt melden |
| `/service/einsaetze` | Woche als Ressourcen-Raster (Techniker × Tage, Kennzeichen „unbestätigt“/„neu – Kunde informieren“), Kanban (Geplant → Bestätigt direkt), Liste mit Reitern |
| `/service/einsaetze/neu` | A14 Vollseite: freie Fenster je Techniker/Tag (get_technician_slots), Dauer, Art, Mitnehmen, Terminvorschlag, Kostenhinweis (Pflicht bei abgelaufener Gewährleistung), Auslandshinweis (Freigabe Leitung), Ergebniskarte je Teilschritt; ohne `?fall` Auswahl der Fälle |
| `/service/einsaetze/[name]` | Einsatz-Akte: Phasen, Primär je Status, Umplanen (verzögert), Absagen, Nicht angetroffen, Status im Namen des Technikers, Reiter Einsatz/Durchführung/Abschluss |
| `/service/ersatzteile` (+ `?ansicht=bestellungen`, `&kanban=1`) | Teile mit Reitern, Verkaufsware „Bestand in Logistik“ (B-06), Bewegung buchen; Bestellungen Liste/Kanban, überfällig |
| `/service/ersatzteile/[name]`, `/service/ersatzteile/bestellungen/[name]` | Akten mit Bestandskarte/Bewegungen bzw. Positionen Ist/Soll, Senden, AB, Wareneingang (S6), Storno nur bis Bestätigt |
| `/service/regress`, `/service/regress/[name]` | Reiter, Regressfrist nach R-03 („Gemeldet“ nicht gewahrt), Abgleich Soll/Ist, Gutschrift erfassen, Anerkannt/Abgelehnt, Ausbuchen (Leitung), Kanban |
| `/service/vertraege` (`?art=pflege|auftraege`), `/pflege/[name]`, `/auftraege/[name]` | Pflege-/Wartungsverträge (Termin planen über A14, Einwilligung/Widerruf R-05, Aktivieren mit Abschlussweg, Protokoll S7, Kündigung Leitung), Serviceaufträge (Kanban, Übernahme/Rückgabe, Beauftragen, Storno) |
| `/service/fehlerkatalog` | Baum (role=tree, Pfeiltasten, Buchstabensprung), Code-Sheet mit Speichern 1 s nach Eingabe (Leitung) |
| `/service/berichte/[report]` | quote · fehlercodes · regress · kosten · fristen über `BerichtSeite` (CSV nur mit Export-Recht, keine Auswertung je Techniker) |
| `/service/einstellungen` | Karten Fristen/SLA/Eskalation/Einsatz/Teile/Regress/Pflege/Portal, Vorlagen lesend, Speicherleiste, Strg+S (nur Leitung) |
| Alte Routen | `/service/ersatzteilbestellungen/*`, `/service/pflege-abos/*`, `/service/auftraege/*` → Umleitung |
| `/technik`, `/technik/einsatz/[name]` | Kiosk Technik mobil: Heute/Woche/Suche/Ich, Einsatz-Karte mit genau einem Primärknopf (Unterwegs/Starten verzögert), Fotos (FotoAufnahme), Nicht angetroffen, Bedarf ans Büro, „Technik kassiert nicht“, Abschluss in 4 Schirmen (Ergebnis, Teile/Pause, Bericht, Bestätigung mit Unterschrift) |

## 2. Dateien

- `src/lib/backoffice/service/`: `texte.js`, `labels.js`, `regeln.js` (D-1…D-3, Meldezustand, rotes Signal, Banner), `naechsterSchritt.js` (Spiegel schritte.py + Knopf), `fristen.js` (Spiegel fristen.py inkl. sachart), `telefon.js`, `katalog.js` (aus install.py), `anzeige.js`, `zeilen.js`, `faehigkeiten.js` (11 Fähigkeiten, alle `erwartet:false` → ausgeblendet), `mock.js` (Nachbau aller genutzten ph_service-Methoden + get_next_steps/get_service_case_file/get_technician_slots), `dienst.js` (eine Stelle Mock/Frappe), `daten.js` (server-only), `actions.js` (alle Mutationen), `commit-aktionen.js`, `berichte.js`.
- `src/components/Backoffice/Service/`: 20 Komponenten + `service.css` (nur Token, Präfix `bo-svc-`).
- Register-Teildateien: `bereiche/`, `suche/`, `kuerzel/`, `freigaben/`, `aufgaben/`, `akte/slots/service.js`, `mock/seed/service.js`, `tools/qa/routen/service.mjs`.
- Tests: `tests/unit/service-regeln.test.mjs`, `tests/unit/service-mock.test.mjs`, `tests/e2e/service-bereich.spec.js`.

## 3. Tests

- Unit Service: **16/16 grün** (Fristen, nächster Schritt gegen 15 Fälle aus schritte.py, Regeln, Telefon, Labels, Katalog = install.py, Texte; Mock-Durchlauf Melden → Geschlossen, Kulanz, Bestellung/Wareneingang, Regress, Akte/Slots, Register).
- Unit gesamt: 414/420 – die 6 roten sind Register-Schnappschüsse anderer Teams (CRM-Navigation, Faktura-Routen/Kürzel), nicht Service.
- ESLint: 0 Fehler, 0 Warnungen auf allen B-SER-Dateien.
- E2E `service-bereich.spec.js`: **8/8 grün** (desktop, `--trace=off`; mit Traces brechen parallele Läufe anderer Teams `test-results/` weg – ENOENT, keine Testfehler).
- Screenshots: `backoffice/qa-screenshots/b-ser-service/` (shoot.mjs `--nur "^/(service|technik)"`): 28 Routen, 133 Aufnahmen (Desktop/iPad/iPhone × hell/dunkel), **0 Befunde** (Überlauf, Konsole, Fokusring, 4xx/5xx).

## 4. Abweichungen vom Konzept / offene Punkte

1. **Verzögerter Commit:** Die Service-Commit-Aktionen liegen in `lib/backoffice/service/commit-aktionen.js`. `lib/backoffice/commit/aktionen/service.js` liegt außerhalb des B-SER-Schreibbereichs → **Bitte an P0-3/L0:** dort `export { default } from "../../service/commit-aktionen.js";`. Bis dahin führen Eingangsbestätigung, Schließen, Umplanen und Unterwegs/Starten **sofort** aus (normale Bestätigung statt „Rückgängig“). Danach läuft alles automatisch über `planeCommit` (Weiche `planeOderSofort`). `fundament.workflow` taugt nicht („Schließen“ enthält ß, Prüfmuster `\w`).
2. **Registrierungen** (Index-Dateien gehören P0-5/P0-7/L0): `freigaben/index.js` → `service`, `aufgaben/index.js` → `service`, `akte/slots/index.js` → `service` (Slot importiert eine Komponente; im Unit-Test deshalb nicht geladen).
3. **Palette:** `backoffice-register.test.mjs` schreibt die Schnellaktionen als Schnappschuss fest („Neuer Servicefall“ → `/d/ph-servicefall/neu`). Weitere Service-Aktionen (Melden-Sheet `?melden=1`, Einsatz planen) daher nicht eingetragen – Antrag an P0-1, den Schnappschuss auf „erste Aktion je Bereich“ zu lockern.
4. **Laufender Dev-Server:** Die Mock-Datenbank lebt im Prozess. `mock.sichereServiceSeed()` legt beim ersten Zugriff die Service-Tabellen einmal nach dem neuen Seed an (nur Service-DocTypes + 2 Techniker-Benutzer, Marker `SEED_VERSION`). Nach einem Neustart greift der normale Seed-Nachlauf.
5. **Kalender:** Woche als Ressourcen-Raster mit Links; Ziehen zum Umplanen ist nicht gebaut – Umplanen über die Einsatz-Akte (Dialog, verzögert). Puffer-Schraffur und Montage-/Tour-Hintergrund fehlen.
6. **Suspense je Kachel** am Bereichsstart nicht umgesetzt (ein Laden, jede Quelle fängt ihre Fehler, `loading.js` als Kachel-Skelett).
7. **Side-Peek** in der Fall-Liste und Kontext-Menü je Zeile nicht gebaut (Zeile öffnet die Akte).
8. **Entwürfe in IndexedDB** (S1) und **Offline-Warteschlange Technik** (Service Worker) nicht gebaut; Technik nutzt die Fundament-Warteschlange nur für Fotos.
9. **Galerie:** Fotos „an Lieferant“ je Kachel umschaltbar nur in S4a; Upload in der Akte fehlt (Technik: FotoAufnahme).
10. **Hilfe-Artikel** `backoffice/hilfe/service/*.md` (18 Stück) nicht geschrieben (außerhalb des Schreibbereichs).
11. **Kunde informieren per Brief/Telefon/Persönlich** speichert bis A-S3 einen festen Kommentartext; D-3 wertet ihn aus (einziger Kommentar-Mechanismus, laut Konzept).
12. **Gutschrift:** Service ruft `PH Servicefall.gutschrift_erstellen` nie auf (0 % USt, E4); Karte „Geld“ verweist auf Faktura.
13. Kanban-Spaltentitel stammen aus `labels.js` („Entschieden“), deshalb eigene `ServiceKanban` statt Fundament-Kanban (dort zeigt `anzeige()` „Entscheidung“).
14. Mock-Kontakte des Fundament-Seeds heißen alle „Laura Muster“; die Fälle tragen eigene Musternamen (`kunde_name`) – Hinweis an CRM/P0-1.
15. **Backend-Lücke Kontakt-Leserecht:** `PH Kontakt` gibt `PH Service Mitarbeiter/Leitung` und `PH Techniker` kein Leserecht (nur CRM, GF, Admin). Service-Mitarbeiter können deshalb im S1 keinen Kontakt suchen (die Suche zeigt einen ehrlichen Satz statt Treffern) und keinen Fall anlegen, weil `kontakt` Pflicht ist. **Anfrage an ph_crm:** Leserecht `read` für PH Service Mitarbeiter/Leitung auf PH Kontakt (für 52-backend-luecken). E2E „S1-Schnell“ läuft deshalb mit dem Admin.
16. Zusätzliche Demo-Techniker `t.beispiel@demo.local`, `m.vorlage@demo.local` (nur Planung, ohne Anmeldung).

## 5. Fähigkeiten-Stand (Mock, Probe gegen Backend-Import)

Alle elf Service-Fähigkeiten sind **aus und ausgeblendet** (Anfragen A-S1, A-S2, A-S3, A-S4, A-S8, A-S10, A-S11, A-S12, A-S15, A-S17; Faktura-Gutschrift E4): Felder/Methoden existieren in ph_service noch nicht. Die Oberfläche zeigt stattdessen die Übergangswege des Konzepts.

## 6. Neue Fragen

- Inhaber: 87–90 in `90-inhaber-fragen.md` (Demo-Leitung, Mahnsperre, Auswertung je Techniker, Kostenhinweis).
- Steuerberater: 46–48 in `91-steuerberater-fragen.md` (Gutschrift-USt, Regress-Einordnung, Auslandseinsatz).

## 7. Screenshots

`backoffice/qa-screenshots/b-ser-service/` – neben `qa-screenshots/entwurf-lounge/` gelegt: gleiche Fläche, Kacheln ohne Rahmen, Pillen-Reiter, eine Tinte-Hauptaktion, Status als Punkt + Wort, Avatare, Bilder in Zeilen.

## 8. E2E-Ergebnis

8/8 grün (Bereichsstart, Servicefälle/Kanban, Akte mit Prüfen-Sheet, S1-Schnell legt Fall an, Einsätze/A14, Ersatzteile Feldfehler, Technik mobil, alle Routen ohne Seitenfehler inkl. Umleitung alter Routen).
