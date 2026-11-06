# Übergabe B-LOG – Bereich Logistik im Lounge-Stil

Stand 04.11.2026 · Team B-LOG · Grundlage `10-konzept-logistik.md` (Fassung 2), `33-referenz-jtl-packtisch.md`, `art-direction/lounge.md`, Inhaber-Entscheidungen 46–53.

## 1. Gebaute Routen

| Route | Inhalt |
|---|---|
| `/packtisch` (Kiosk) | Scan identifiziert den Vorgang (JTL M1: Lieferschein, Bestellung, Abholcode, Kommission, Artikel), Segment Packen · Abholung · Wareneingang, Karten Heute → Etikett fehlt → Alter, bezahlte Bestellung antippen erzeugt still den Lieferschein, Lager-Scan, Ton je Gerät |
| `/packtisch/[name]` (Kiosk) | Pack-Ansicht exakt nach Lounge-Entwurf: Scanfeld (Ring bereit/erkannt/Fehler + Schütteln), Mengenfeld, Fortschrittsring, Auftrag links (Quelle, Nummer, Versand/Tour, Adresse, Packhinweise), Positionen (Bild, EAN/SN, Ist/Soll, Vollständig/Gerade +1/Bestätigen/Offen, erledigte nach unten, −/+), Pakete rechts (Packmittel-Segment, Gewicht manuell mit Plausibilität, Inhalt), Fuß Problem · Zurückstellen · Lieferschein · Etikett/Packliste · **ein** Abschluss-Knopf (gesperrt mit Restangabe). Automatik nach letztem Scan (E1): Versand → Etikett-Bildschirm, sonst „Gepackt“ als verzögerter Commit 8 s. Abholkarte mit Zahlungssperre, Abholcode, Unterschrift oder „Name bestätigt“. F2/F3/F4/F6/F7/F9/F12 |
| `/logistik` | Heute zu tun (8 Quellen), 2 Akzentkacheln + 2 Kennzahlen, Zu packen, Touren der Woche, Auswertung eingeklappt |
| `/logistik/lieferscheine` (+ `?ansicht=heute|ohnetour|abholbereit|zurueck|kanban`) | Liste (Packstand, Tour, Wunsch) und Kanban (Ziehen → Dokumentmethoden, verzögert) |
| `/logistik/lieferscheine/[name]` | Akte: Phasen, ein Band nach Rang (Storno, AB nicht gemeldet E7, Bestand nicht gebucht, Anzahlung, Steuernachweis, Problem, zurückgestellt), Primäraktion je Zustand (Tabelle § 4.3), ⋯, Problem, Storno (nur erlaubt), 5 Reiter, Bezüge |
| `/logistik/packen/[name]` | Pack-Ansicht im Backoffice ohne Gerät (Band „Kein Packtisch-Gerät“) |
| `/logistik/sendungen` + `/[name]` | Ansichten, Tracking alle; Akte mit Klären (4 Wege), Tracking-Zeitstrahl, Kosten (Differenz nur Leitung) |
| `/logistik/touren` (Plantafel, `?ansicht=liste|kanban`, `zeitraum=woche|3tage|tag`) | Raster Tag × Fahrzeug (`role="grid"`, Pfeiltasten), Ablage (Ohne Tour · Zurück im Fahrzeug · Montagen · Speditionen), Zuordnen per Tipp mit Auslastung danach, Neue Tour in der Zelle, Rückgängig |
| `/logistik/touren/[name]` | Freigeben (Leitung, verzögert, Override bei Anzahlung), Starten mit km-Vorschlag, Abschließen, Abbrechen mit Folge, Stopps ↑/↓/Alt+Pfeil mit Rückgängig, nach PLZ, Avis, Duplizieren |
| `/logistik/speditionen` + `/[name]` | Liste/Kanban, Senden (gesperrt ohne E-Mail/Packstücke), Bestätigung, Abgeholt, Zustellung (Empfänger Pflicht), Storno |
| `/logistik/ruecknahmen` + `/[name]` | Annehmen, Prüfung je Position (Pflichtfelder), Abschließen (Leitung), Servicefall, Protokoll |
| `/logistik/bestand` + `/[name]` | gruppiert je Lagerort (25 + „Weitere 25“), Akte mit Umlagern, Reservieren, Freigeben, Sperren, Entsperren/Ausbuchen (Leitung), Journal mit Saldo, andere Orte, Kassa-Hinweis statt „An Kassa verkaufen“ |
| `/logistik/ausstellung`, `/logistik/kommission`, `/logistik/bewegungen` | Ausstellungsstücke mit Alter/VK, Platz ändern per Scan; Kommissionsliste mit Lieferschein aus Kommission; Journal ohne Bearbeiten, Storno als Gegenbuchung (Leitung), „Bewegung buchen“ |
| `/logistik/inventur` + `/[name]` + `/[name]/zaehlen` | Abdeckung je Lagerort (jeder Platz 1× je GJ), Inventur anlegen, Teilinventur (nächste Plätze), Zählliste inline, Differenzen mit Grund, Freigabe mit Vier-Augen/Grund/Bewegungen seit Zählbeginn, Zählmodus am iPhone (Scan, ±, Stückscan, Fund) |
| `/logistik/inventur/bewertung` + `/[name]` | Inventurbewertung (Leitung): berechnen, festschreiben, verwerfen, Summen je Lagerort/Bewertungsart, Platzhalter-Banner |
| `/logistik/nachbestellung` | Bestellvorschläge und Meldebestände, „Herstellerbestellung aus Vorschlägen“ (Fähigkeit) |
| `/logistik/stammdaten?tab=…`, `/logistik/berichte` + `/[report]` | Lagerorte (Platzetiketten), Fahrzeuge (Service), Paketprofile (Schätzung-Banner), Packplätze, Einstellungen (Leitung, keine Schlüssel); 10 Berichte über `BerichtSeite` |

## 2. Bausteine und Logik

- Komponenten `components/Backoffice/Logistik/`: `Packtisch.js` (Start, Pack-Ansicht, Etikett, Problem, Zurückstellen, Abholkarte, Lager-Scan), `Plantafel.js`, `StoppListe.js`, `Inventur.js` (Zählliste, Zählmodus), `Pruefung.js`, `Aktionen.js` (VorgangKnopf, VerzoegertKnopf, MehrMenue, LogistikKanban), `LagerScanKnopf.js`, `LieferungenSlot.js`, `ui.js`, `logistik.css` (Präfix `bo-log-`, nur Token).
- Logik `lib/backoffice/logistik/`: `status`, `texte`, `schalter`, `belegsperre`, `rest`, `zahlung`, `auslastung`, `entnahme`, `scan`, `packen` (JTL-Regeln gespiegelt), `inventur` (Freigabe, Teilinventur, Bewertung), `plantafel`, `rechte`, `faehigkeiten`, `dienst` (jede Mutation Frappe-Pfad mit exakten Methoden + Mock-Pfad), `daten`, `actions` (Server Actions), `client` (Mock-Stand-Sicherung).
- Teildateien: `bereiche`, `suche`, `kuerzel`, `aufgaben`, `freigaben`, `druck`, `akte/slots` (je `logistik.js`), `mock/seed/logistik.js` (Nachlauf: alle Status, Leer-/Fehlerfälle), `tools/qa/routen/logistik.mjs`.

## 3. Tests

- Unit: `tests/unit/logistik-logik.test.mjs` (15) + `logistik-dienst.test.mjs` (10) – **25/25 grün**. Gesamtlauf `tests/unit/**`: 498/502 – die 4 roten Tests liegen bei anderen Teams (CRM-Navigation, Kundenkarte-Routen/Kürzel, Projekte-QA-Routen), unabhängig von B-LOG geprüft (gleiches Ergebnis ohne Logistik-Kürzel).
- E2E `tests/e2e/logistik-bereich.spec.js`: desktop 6/6, ipad 5/5 + 1 übersprungen (Packtisch nur quer), ipad-quer 1/1; axe 0 serious/critical auf Übersicht, Lieferschein-Akte, Pack-Ansicht.
- ESLint 0 auf allen B-LOG-Dateien.
- Screenshots: `backoffice/qa-screenshots/b-log-2026-11-04/` (shoot.mjs, `^/(logistik|packtisch)`, 270 Aufnahmen hell/dunkel, Desktop/iPad/iPhone): HTTP 0, Überlauf 2, Text außerhalb 16, Fokus ohne Ring 30, Konsole 1. Ursachen behoben (Fokusring Scan-/Gewichtsfeld, Summen-Tabellen der Bewertung scrollen in der Kachel, Nummernzeile umbrechend, Aktionen der Bewertung im ⋯); Nachlauf `b-log-2026-11-04-nach/` auf den betroffenen Routen: 0 Befunde. Offen: einmalige React-Warnung beim ersten Kompilieren von `/logistik/ausstellung`.

## 4. Abweichungen und Hinweise (Freigabe L0)

1. **Commit-Teildatei** `lib/backoffice/commit/aktionen/logistik.js` beschrieben (Kopf der Datei weist sie B-LOG zu; im Auftrags-Schreibbereich nicht genannt) – nötig für „Gepackt“, „Übergeben“, „Tour freigeben“ als verzögerter Commit (DoD Logistik).
2. **Palette**: Schnellaktionen/Hilfe als `VORGESEHEN_*` in `suche/logistik.js`, nicht aktiv – der Fundament-Test „Palette: Schnellaktionen in alter Reihenfolge“ verlangt die alte Liste. P0-1/L0: Test lockern, dann eintragen.
3. **Nicht verdrahtet** (Import-Zeile L0/P0-5/P0-7): `aufgaben/logistik.js` (die Übersicht nutzt sie direkt), `freigaben/logistik.js`, `akte/slots/logistik.js`.
4. **Mock-Stand ohne Neustart**: `logistik/client.js` ergänzt einmalig die Logistik-Tabellen, wenn der laufende Dev-Server einen älteren Seed hat (Marke `_b_log_seed` in PH Logistik Einstellungen). Andere Bereiche bleiben unberührt.
5. Sperrgut-Modus druckt die **Packliste** statt Packstück-Etikett (NVE folgt laut Backend später, Frage 103).
6. Ausstellungs-/Lagerbilder im Mock aus den Lounge-Kopien (`/entwurf/lounge/p-…`) über die EAN; im Frappe-Modus `PH Produkt.bild_hauptbild`.
7. `/tour` → `/montage` (307) liegt nicht im Schreibbereich – Projekte/L0. Montage-Bausteine (Abliefern-Sheet mit Unterschrift) sind nur als Stopp-Menü in der Tour-Akte umgesetzt; Einbau in `/montage` bleibt bei B-PRJ.
8. Lieferschein erzeugen aus AB (§ 5.1) ist als Server Action mit Rest-/Dezimalprüfung gebaut; das Sheet in der AB-Akte gehört zu Faktura (Einbau über `lieferscheinErzeugenAction`).

## 5. Fähigkeiten (an/aus)

an (Probe gegen Backend-Import): `packtisch-jtl`, `inventur-mobil`, `teilinventur`, `bewertung`, `nachbestellung`, `liefertermine`, `tour-mobil`.
aus, erwartet (gesperrt mit Ersatzweg): `ab-meldung` (A1), `teilzustellung` (A7), `ruecklieferung` (A5), `steuernachweis` (A9), `mengen-dezimal` (A4), `freigabe-zuruecknehmen` (A8), `ersatzlieferung` (A24). `zwei-drucker` (C1) aus, nicht erwartet.
Schalter `schalter.js`: `anzahlungHart` an, alle anderen aus.

## 6. Offene Punkte

- Offline-Puffer am Packtisch (IndexedDB) nur über `positionen_setzen`-Schnittstelle vorbereitet, nicht verdrahtet.
- Foto-Upload am Problem-Dialog (Hinweis „keine Personen“ steht), Upload selbst über `FotoAufnahme` folgt.
- Inline-Platz in der Bestandsliste und Massenaktionen der Lieferscheinliste (Zur Tour, Übergeben) – Aktionen vorhanden, Listen-UI folgt.
- Hilfe-Artikel `backoffice/hilfe/logistik/*.md` (Q5).
- Budgets (Q-L) nicht gemessen.

## 7. Neue Fragen

Inhaber 100–107 (`90-inhaber-fragen.md`), Steuerberatung 53–55 (`91-steuerberater-fragen.md`).
