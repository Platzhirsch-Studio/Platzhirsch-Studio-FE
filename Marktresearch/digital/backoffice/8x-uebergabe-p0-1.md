# 8x – Übergabe Team P0-1 (Register & Struktur, Fundament v2)

**Stand:** 2026-11-04, zweiter Lauf (Bauphase „Lounge“, Inhaber-Entscheidungen Nr. 48–53). Der erste Lauf (Aufteilung § 3.5, G-01/G-02/G-04/G-22) steht unverändert weiter unten. Dieser Lauf hat ihn geprüft und weiterverwendet, zwei Bereiche ergänzt, die Rechte ans Register gehängt und die sichtbaren P0-1-Bausteine auf Lounge umgestellt.

## A. Lauf 2 – gebaut

### Neue Bereiche im Register (alle fünf Register + Rechte)

| Bereich | Slug / Start | App, Modul | DocTypes (= alle Nicht-Kind-DocTypes des Moduls) | Navigation |
|---|---|---|---|---|
| **Ablage** (Dateien) | `ablage` · `/ablage` | `ph_ablage`, PH Ablage, Rollen `PH Ablage Mitarbeiter/Leitung` | PH Datei, PH Ordner, PH Datei Freigabelink, PH Ablage Ereignis, PH Ablage Einstellungen | Übersicht · Dateien · Ordner · Freigabelinks · Verlauf (nur Leitung/GF/Admin) |
| **E-Mails** (nicht zugeordnete Mails, Microsoft) | `posteingang` · `/posteingang` | `ph_microsoft`, PH Microsoft, keine eigenen Rollen | PH Mail Adresse, PH Postfach, PH Kalender Zuordnung, PH Sync Protokoll, PH Graph Abo, PH Graph Verknuepfung, PH Microsoft Einstellungen | Nicht zugeordnet · Adressen und Sperren · Postfächer, Kalender, Abgleich (nur GF/Admin) |

- Teildateien je Bereich: `bereiche/`, `suche/` (Nummernmuster `PH-DAT-.YYYY.-.######`, `PH-ORD-.######`; E-Mails hat keine Serien), `kuerzel/` (leer), `mock/seed/`, `tools/qa/routen/` (leer, Start + Navigation kommen automatisch).
- Sichtbarer Titel „E-Mails“, nie „Posteingang“ (10-konzept-crm § 15 streicht das Wort; Unit-Test prüft das).
- Reihenfolge: Q-B2 unverändert, Ablage und E-Mails danach (Frage 90 Nr. 39).
- Startseiten laufen bis zur eigenen Bereichsseite über `src/app/[bereich]/page.js` (`BereichStart`), Listen über `/d/*`.

### Rechte aus dem Register statt fest verdrahteter Rollenliste
- `bereiche/<b>.js` hat neu `rollen?{"PH CRM Mitarbeiter": "mitarbeiter"}` für Fachrollen mit Zugriff laut DocType-`permissions`; `bereiche/index.js` liefert `ROLLEN_NAMEN` (aus `rollenName`) und `ZUSATZ_ROLLEN`.
- `auth/rechte.js`: `zerlegeRolle()` liest `ROLLEN_NAMEN` (vorher fest verdrahtete Liste der elf Fachrollen), `rechteDerRolle()` ergänzt `ZUSATZ_ROLLEN`. Für die zwölf Fachbereiche ist das Verhalten gleich (bestehende Rechte-Tests grün). Neu: `PH Ablage Mitarbeiter/Leitung` → Ablage; CRM, Projekte, Sortiment, Service (Mitarbeiter/Leitung) und Personal-Leitung → Ablage als Mitarbeiter; CRM → E-Mails als Mitarbeiter. Was jemand im Detail darf, prüft weiter `darfDoc` gegen die DocType-JSON; im Frappe-Modus prüft der Server selbst (Ordnerrechte, Postfach-Berechtigte).
- `pruefeBereiche()` meldet zusätzlich: Rollenname doppelt, Stufe ungültig, eigene Rolle in `rollen`, DocType in zwei Fachbereichen.

### Seed
- Ablage und E-Mails haben **nur Nachläufe** mit eigenem Zufall, weder `anzahl` noch `kern`, denn beides liefe über den gemeinsamen Zufall und würde alle Beispieldaten verschieben. Ergebnis: Mock-Datenbank der zwölf Fachbereiche **SHA-256-identisch** mit dem Stand davor (`da1bb93b…`), die bisherigen 93 QA-Routen identisch (Hash `c6923750…`).
- Ablage: Bereichsordner „Projekte“, je Projekt (drei) ein Stammordner mit Vorlage 01–08 aus ph_ablage (28 Ordner), 29 Beispieldateien (PDF, DWG, JPG, PNG, XLSX), dabei ein Datei-Check-out, eine Datei im Papierkorb und ein leerer Ordner. Belege mit Löschsperre.
- E-Mails: drei Postfächer `…@beispiel.invalid` mit Berechtigten (`user/lesen/senden` wie `PH Postfach Benutzer`), drei weitere Adressen an Kontakten (`kontakt_doctype/kontakt_name`) und zwei Sperren. Nicht zugeordnete Mails speichert ph_microsoft nie (Nr. 52), deshalb nicht im Seed.

### Fremde Nummernkreise nachgezogen
Parallel-Teams haben in Backend-Import neue Serien angelegt; der Register-Test verlangt für jede ein Muster: `PH-BV-` Bestellvorschlag, `PH-IB-` Inventurbewertung, `PH-MB-` Meldebestand (alle `suche/logistik.js`), `PH-NK-` Projekt Nachkalkulation (`suche/projekte.js`).

### Lounge (Nr. 51/53)
- **Kürzel-Dialog**: `bo-material-stark`, Radius 28, ohne Rahmen und Trennlinien; Titel 17/600 mit Unterzeile; runder Schließknopf (`bo-rund`); Pillen-Suche (`bo-suche`, 2-px-Fokusring, kein zweiter innerer Rahmen); „Einzeltasten-Kürzel“ als **iOS-Schalter** (`role=switch`, `bo-schalter`) in einer eingelassenen Karte (Radius 20); Abschnittstitel in Satzschreibung statt Versalien; Zeilen 40 hoch mit Hover-Fläche; Tastenkappen als gefüllte Flächen ohne Kontur.
- **Gehe-zu-Zeile**: Tinte-Karte Radius 20, `shadow-bo-ink`, gefüllte Kappen.
- **Demo `register`**: Kacheln (`bo-kachel`), eingelassene Karten statt umrandeter Kästen, Tabellen mit Haarlinie und Zeilen-Hover, Listen ohne Trennlinien, kein Versalien-Etikett.
- Befund an P0-2: `.bo-schalter` hat keine Grundregel. Ohne `inline-flex` am Knopf bekommt die Spur keine Breite und der Daumen rutscht aus der Karte. Bei mir gelöst, eine Grundregel in `globals.css` wäre besser.

## B. Lauf 2 – Tests

| Prüfung | Ergebnis |
|---|---|
| Unit gesamt `node --test "tests/unit/**/*.test.mjs"` | **106 / 106 grün**. Vorher 103/104: der Test „Nummernmuster“ schlug fehl, weil PH Datei und vier neue Serien fehlten. |
| davon Register (`backoffice-register*.test.mjs`) | 28 / 28; neu: Ablage/E-Mails (DocTypes = Modul, Rollen, Navigation nach Recht, Wort „Posteingang“), Seed der neuen Nachläufe, Prüfbefunde Rollen/DocType doppelt |
| ESLint auf allen geänderten Dateien (`--max-warnings 0`) | **0** |
| E2E `tests/e2e/backoffice.spec.js --project=desktop` | **9 / 9 grün** (erster Lauf: Kanban rot, einzeln grün; zweiter Gesamtlauf 9/9. Ursache ist der geteilte Mock-Speicher, den parallele Agenten mitbenutzen) |
| Mock-Datenbank 12 Fachbereiche alt/neu | SHA-256 identisch |
| shoot.mjs `/ablage`, `/posteingang`, `/d/ph-datei`, `/d/ph-mail-adresse` × 3 Viewports × hell/dunkel | 24 Aufnahmen, **0 technische Befunde** |
| Kürzel-Dialog/Gehe-zu (eigenes Skript, Desktop + iPhone, hell/dunkel): Fokus im Suchfeld, Schalter per Leertaste, kein Überlauf, Konsole | **0 Befunde**. Gesichtet neben `entwurf-lounge/1-zentrale`: Material, Radien, Typo und Schalter passen. |

## C. Lauf 2 – offene Punkte

1. **Dev-Server mit altem Mock-Speicher:** :3100 hat seine Datenbank vor diesem Lauf gebaut, deshalb zeigen Ablage/E-Mails dort 0 Datensätze. Nach dem nächsten Neustart erscheinen Ordner, Dateien, Postfächer und Adressen; der Unit-Test belegt den Seed. Neustart durfte ich nicht.
2. **Demo-Einbindung `/einstellungen?tab=system&baustein=…`** fehlt weiter (Besitz Zentrale/L0, Muster im Kopf von `demo-register.js`). Die Demo `register` ist auf Lounge umgestellt, aber im Browser noch nicht sichtbar.
3. **Mock-Pfad `ph_microsoft.api.mails_unzugeordnet`** (Live-Liste) fehlt in `mock/client.js` → Team B-MAI. Die Seite „Nicht zugeordnet“ braucht ihn. Fähigkeiten `posteingang.*`/`ablage.*` (Upload, Zuordnen, Sperren) definieren die Bereiche in `lib/backoffice/<b>/faehigkeiten.js`.
4. **Icons:** Ablage nutzt vorerst `FileText`, weil `icons.js` (P0-2) kein Ordner-Symbol hat (`FolderOpen` ergänzen, dann hier tauschen).
5. **Shell:** Die Seitenleiste ist noch die alte dunkle Leiste (G-26 Shell v2, P0-7). Die neuen Bereiche erscheinen dort korrekt, aber noch nicht im Lounge-Stil.
6. Palette-Suche des Mocks (`mock/core.js BEREICHE`, Spiegel von ph_core `suche.py`) kennt Ablage/E-Mails noch nicht. Das gehört zu ph_core bzw. dem Besitzer von `mock/core.js`.
7. Aus Lauf 1 weiter offen: Punkte 2–6 (unten).

## D. Lauf 2 – Abweichungen und Eingriffe außerhalb des Schreibbereichs (bitte L0 bestätigen)

- `src/lib/backoffice/auth/rechte.js`: Rollen-Zuordnung liest jetzt das Register. Nötig, sonst sähe `PH Ablage …` die Ablage nicht. Für die zwölf Fachbereiche gleiches Verhalten.
- `tests/unit/backoffice-session-rechte.test.mjs`: „GF sieht alle Bereiche“ prüft jetzt `BEREICH_SLUGS.length` statt fest 12.
- `components/Backoffice/Kuerzel/*`, `Demo/register.js`, `README.md` (Abschnitt P0-1): eigene P0-1-Bausteine aus Lauf 1, auf Lounge umgestellt.
- Slug `posteingang` laut Auftrag, Anzeigename „E-Mails“ (CRM-Konzept § 15).

## E. Lauf 2 – Fähigkeiten-Stand

Unverändert: Kern `kern.suche`, `kern.aktivitaet`, `kern.geraete` an (Mock, Probe gegen Backend-Import). Für Ablage/E-Mails sind keine Knöpfe gebaut, also keine Schein-Knöpfe; Fähigkeiten folgen mit den Bereichsseiten.

## F. Lauf 2 – Fragen

- Inhaber: 90-inhaber-fragen.md **Nr. 39** (Platz von Ablage/E-Mails in der Seitenleiste), **Nr. 40** (Name „E-Mails“, wer den Bereich sieht, Gehe-zu-Buchstabe).
- Steuerberater: keine.

## G. Lauf 2 – Screenshots

`backoffice/qa-screenshots/p01-register-v2/`: Kürzel-Dialog (Start, Suche, Einzeltasten aus) und Gehe-zu-Zeile, Desktop + iPhone, hell + dunkel; `lauf/` = shoot.mjs-Bericht der neuen Bereichsrouten.

---

# Lauf 1 (unverändert)


**Stand:** 2026-11-04 · Auftrag: MASTER § 4 G-01, G-02, G-04 (+ G-22 `codes.js`), Aufteilung der Sammeldateien § 3.5 ohne Verhaltensänderung, Unit-Test gegen doppelte Slugs/Routen/Kürzel.

## 1. Gebaut

### Aufteilung der Sammeldateien (§ 3.5) – ohne Verhaltensänderung

| Vorher | Jetzt | Nachweis „unverändert“ |
|---|---|---|
| `lib/backoffice/bereiche.js` | `bereiche/index.js` + 12 × `bereiche/<b>.js` | Modul-Zuordnung, `bereichFuerDoctype`, Navigation identisch (Unit) |
| `lib/backoffice/suche.js` | `suche/index.js` (Server-Suche) + `suche/register.js` (browsertauglich) + `suche/muster.js` + 12 × `suche/<b>.js` | `SCHNELLAKTIONEN` gleiche Reihenfolge und Form über `rang` (Unit) |
| `lib/backoffice/mock/seed.js` | `mock/seed/index.js` + `mock/seed/basis.js` + 12 × `mock/seed/<b>.js` | SHA-256 der kompletten Mock-Datenbank alt = neu (gleiche Metas, Zufallsnamen normalisiert); Erzeugungsreihenfolge als `REIHENFOLGE_V1` eingefroren |
| `tools/qa/routen.mjs` | `tools/qa/routen/index.mjs` + 12 × `routen/<b>.mjs` + `routen/fundament.mjs` | Routenmenge alt = neu (90), feste Seiten in gleicher Reihenfolge; neu nur die Baustein-Demos aus `demo-register.js` |
| Arbeitsplätze in `auth/rechte.js` | `lib/backoffice/arbeitsplaetze.js` (+ `ziffer` 1–5, `route`, `nurWenn?`) | `rechte.js` re-exportiert dasselbe Objekt; `erlaubteArbeitsplaetze` unverändert |

Die alten Pfade bleiben als einzeilige Kompatibilitäts-Exporte (`export * from …`), damit parallel arbeitende Teams nicht brechen. Alle Fundament-Aufrufer zeigen auf die neuen Pfade (`Shell`, `BereichStart`, `[bereich]`, `/d/*`, `page.js`, `api/suche`, `mock/client.js`, `frappe/meta.js`, `auth/rechte.js`, `shoot.mjs`, `bewerten.mjs`).

### G-01 Register
- Reihenfolge der Seitenleiste nach Q-B2/M-03 (Zentrale, CRM, Projekte, Faktura, Shop, Sortiment, Logistik, Service, Kundenkarte, Marketing, Personal, Kassa) – **sichtbare Änderung**, von G-01 verlangt.
- `routen{doctype:(name?)=>href}` je Bereich → `ROUTEN`, `kanonischeRoute()`, `umleitungFuerD()`; `/d/<slug>` und `/d/<slug>/<name>` leiten mit 307 um, sobald ein Bereich registriert (Admin behält mit `?generisch=1` die generische Seite, `neu` nie). Heute ist nichts registriert → keine Umleitung.
- `navigation[].recht` wird in Seitenleiste und Palette nach Rechten gefiltert; Bereich ohne Navigation erscheint nicht.
- `bereiche/zentrale.js → seiten{}` liefert die Ziele der Gehe-zu-Kürzel (null = Seite gibt es noch nicht → kein Kürzel).
- Palette: 75 Nummernmuster direkt aus den `naming_series` aller DocType-JSONs (+ Entwurfsnummern Rechnung/Gutschrift, Kartennummer `KK-…`), `nummerErkennen()`; Unit-Test gleicht jede Serie in Backend-Import ab und prüft Überschneidungen.
- Seed: `anzahl`, `kern`, Nachlauf `default(db, hilfe)` mit eigenem Zufall je Bereich, `nach[]` topologisch, Prüfung auf Doppelbesitz/Kreise.
- `config.js`: `BETRIEB` / `betrieb()` mit den Inhaber-Standards (M-06…M-17, Blindzählung) – Q-A8; `ENV.MOCK_FAEHIGKEITEN`, `ENV.FAEHIGKEITEN`.

### G-02 Kürzel-Register
- `kuerzel/kern.js` (Normalisierung `mod+alt+shift+…`, Mac ⌘, Alt über `e.code`, Einzeltasten-Erkennung WCAG 2.1.4, Eingabefeld-Schutz inkl. `[data-scan]`, Folgen mit 1,5 s, Anzeige Windows/Mac, Kollisionsprüfung je gleichzeitig aktiver Kontextgruppe, Bereichsregeln Q-F5, Kiosk ohne Buchstaben Q-F7).
- `kuerzel/global.js`: Q-F2/Q-F3/Q-F4, Kanban, Palette, Glocke, Arbeitsplatz 1–5, Kiosk gemeinsam, 17 Gehe-zu-Ziele K-10. `kuerzel/kassa.js` (10-Kassa § 2.5) und `kuerzel/logistik.js` (10-Logistik § 6.6) vorbelegt; übrige Bereiche leer.
- `kuerzel/useKuerzel.js`: ein Verteiler, Bindung über IDs, `useEinzeltasten()`, `useFolge()`, `useMac()`, `oeffneKuerzelDialog()`, Scanner-Schutz (< 20 ms), Strg+Z bleibt im Feld Text-Rückgängig.
- Komponenten `Kuerzel/KuerzelWurzel` (in `Shell` eingebunden: `Strg+/`, `G`+Buchstabe mit Zielzeile), `Kuerzel/KuerzelDialog`, `Kuerzel/KuerzelKnopf`. Bestehende Handler (Strg+K Palette, Strg+B Seitenleiste, Kiosk-Hook) bleiben unverändert und stehen im Register.

### G-04 Fähigkeiten
- `faehigkeiten.js`: `definiereFaehigkeiten(bereich, {…})`, `faehigkeit()/faehigkeiten()`, `darstellung()`, `hinweisText()`, Kern-Fähigkeiten `kern.suche|aktivitaet|geraete`. Mock: Schalter `BACKOFFICE_MOCK_FAEHIGKEITEN` oder echte Probe gegen Backend-Import (DocType, Feld, `@frappe.whitelist`-Funktion, Dokumentmethode). Frappe: `getMeta`-Probe mit Cache 5 min; Methoden nur mit `get: true` per Probeaufruf, sonst Freigabe in `BACKOFFICE_FAEHIGKEITEN` (dort wirkt „alle“ nicht). Recht fehlt / unbekannte ID → ausgeblendet.
- Komponenten `Faehigkeit` (Server, Funktions-Kind für `Knopf disabled grund`) und `FaehigkeitHinweis` (Server/Client). QA-Schalter ohne Neustart: Cookie `ph_bo_faehigkeiten` (nur Mock, nicht Produktion).

### G-22 (Teil) Code-Erkennung
- `codes.js`: Event-QR, RKSV-QR, Gutschein (Normalform wie `gutschein_code.py`), Kundenkarte `KK-`, alle Belegnummern, Kassenbeleg `<Kasse>-000123`, EAN/GTIN mit Prüfziffer, Lageretikett `<Lagerort>/<Platz>`, Website-Link, Abholcode (nur mit Option). Browsertauglich für `ScanTor` (P0-6).

### Demo
- `components/Backoffice/Demo/register.js` + eine Zeile `register` in `lib/backoffice/demo-register.js` (Fähigkeit in drei Zuständen, Kern-Fähigkeiten live, Kürzel, Register-Zahlen, Arbeitsplätze, Betrieb, Code-Beispiele, Prüfstatus).

## 2. Tests

| Prüfung | Ergebnis |
|---|---|
| Unit gesamt `node --test "tests/unit/**/*.test.mjs"` | **85 / 85 grün** (davon neu 26: `backoffice-register.test.mjs` 19, `backoffice-register-faehigkeiten.test.mjs` 7) |
| ESLint auf allen geänderten/neuen Dateien | **0 Fehler, 0 Warnungen** |
| E2E `tests/e2e/backoffice.spec.js --project=desktop` (bestehend, Regression Shell/Navigation//d/Palette/Arbeitsplätze) | **9 / 9 grün** |
| Mock-Datenbank alt vs. neu (SHA-256) | identisch |
| Screenshot-Lauf `shoot.mjs --nur "^/crm$\|baustein=register"` | 12 Aufnahmen, 0 technische Befunde |
| Sichtprüfung Kürzel-Dialog, Suche, Gehe-zu-Zeile (Desktop hell/dunkel, iPhone) | gesichtet; Befunde behoben (Zeile brach nicht um → Flex-Umbruch mit Tastenkappen; Fokus lag auf „Schließen“ → Suchfeld; doppelte „Rückgängig“-Zeile → „Strg Z oder Z“; Dialog oben verankert) |

## 3. Offene Punkte

1. **Demo-Einbindung `/einstellungen?tab=system&baustein=…` fehlt noch** (Besitzer Zentrale/L0, Muster im Kopf von `demo-register.js`). Bis dahin rendert die Route die normale Einstellungsseite; die Demo `register` ist gebaut, aber nicht sichtbar gesichtet.
2. Kein Bereich hat bisher `routen` registriert → 307-Umleitungen greifen erst mit den Bereichsseiten (Welle 1).
3. Einzeltasten-Schalter liegt im Kürzel-Dialog und in `localStorage`; Vorliebe je Benutzer und Platz im Benutzermenü → P0-8 / P0-7.
4. `?` (Hilfe), `/` (Kontext-Suche), `N` (Neu-Menü), `Z`/`Strg+Z`, `F8`, `[`/`]` sind registriert, aber noch ohne Handler (Hilfe-Panel P0-7, Toast v2 P0-3, Filterleiste P0-5). Ohne Handler passiert nichts – kein Schein-Kürzel.
5. Befehlspalette und Seitenleiste nutzen noch eigene `keydown`-Listener; Umstellung auf `useKuerzel` bei Palette v2 / Shell v2 (P0-7).
6. Nummernmuster-Erkennung in der Palette („Nummer erkannt → direkt öffnen“) ist im Register vorbereitet (`nummerErkennen`), die Anzeige gehört zu Palette v2 (P0-7).
7. Neue DocType-JSON eines Parallel-Teams in Backend-Import während des Laufs (Meta-Index 127 → 128 DocTypes); Seed bleibt deterministisch, Fingerabdruck danach gleich.

## 4. Abweichungen vom Konzept

- Fähigkeiten im Frappe-Modus: MASTER nennt „Probeaufruf“ für Methoden. Ein Probeaufruf einer schreibenden Methode hätte Wirkung; deshalb nur lesende Methoden mit `get: true`, sonst Freigabe über `BACKOFFICE_FAEHIGKEITEN`. (Bitte L0 bestätigen.)
- Alte Sammeldateien bleiben als Kompatibilitäts-Exporte bestehen, statt gelöscht zu werden (parallele Teams).

## 5. Fähigkeiten-Stand

Kern (Mock, Probe gegen Backend-Import): `kern.suche` an, `kern.aktivitaet` an, `kern.geraete` an. Bereichs-Fähigkeiten definieren die Bereiche selbst in `lib/backoffice/<b>/faehigkeiten.js`.

## 6. Neue Fragen

- Inhaber: 90-inhaber-fragen.md Nr. 27 (Gehe-zu/Einzeltasten Standard), Nr. 28 (wer gibt Backend-Methoden im Echtbetrieb frei).
- Steuerberater: keine.

## 7. Screenshots

`backoffice/qa-screenshots/p01-register/` (Kürzel-Dialog, Suche, Gehe-zu-Zeile, Zentrale – Desktop hell/dunkel, iPhone) und `backoffice/qa-screenshots/p01-register/lauf/` (shoot.mjs-Bericht).
