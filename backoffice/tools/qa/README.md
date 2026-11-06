# Screenshot-Prüfung Backoffice (`backoffice/tools/qa/`)

Zwei Werkzeuge für die Sichtprüfung des eigenen Backoffice (Next.js, Port 3100, Mock-Modus):
`shoot.mjs` fotografiert alle Routen und misst technische Befunde, `bewerten.mjs` lässt ein
lokales Bildmodell (Ollama, `qwen2.5vl:7b`) jeden Screenshot kommentieren. Ausgaben liegen in
`backoffice/qa-screenshots/<lauf>/` (per `.gitignore` ausgeschlossen).

## Voraussetzungen

- Dev-Server des Backoffice läuft im Mock-Modus: `cd backoffice && npm run dev` (http://localhost:3100).
  Die Werkzeuge starten keinen Server.
- Playwright-Chromium und `sharp` aus dem `node_modules` der Website (Repo-Wurzel); kein eigenes `npm install`.
- Für `bewerten.mjs`: Ollama unter http://localhost:11434 mit `qwen2.5vl:7b` (RTX 4060 8 GB reicht; das
  Werkzeug entlädt vorher andere Modelle, damit nur eines im Speicher ist).

## 1. Screenshots und technische Befunde

```
node backoffice/tools/qa/shoot.mjs backoffice/qa-screenshots/<lauf> [--nur <muster>] [--basis http://localhost:3100]
```

- Meldet sich auf `/login` als Demo-Admin an (`QA_EMAIL`/`QA_PASSWORT`, Standard `admin@demo.local` / `demo`).
- Routen aus `routen.mjs`: feste Kernseiten (Login, Zentrale, Arbeitsplatz, Anfrage-Liste/Kanban/Formular,
  vier Kiosk-Arbeitsplätze, Einstellungen, Benutzer, Protokoll, Gerät, Wechsel) plus Startseite und
  Navigationseinträge aller zwölf Bereiche aus `src/lib/backoffice/bereiche.js`. Das Formular nimmt den
  ersten Datensatz von „PH Anfrage“ (über `/api/suche`, sonst erster Listenlink).
- Je Route drei Viewports (Desktop 1440×900, iPad quer 1024×768, iPhone 390×844) × hell/dunkel
  (`colorScheme`), Vollseite: `<slug>--<viewport>--<schema>.png`.
- Befunde je Aufnahme: HTTP-Status, Umleitung zum Login, Konsolen-/Seitenfehler, 4xx/5xx-Antworten,
  horizontaler Überlauf (`scrollWidth > innerWidth`), Elemente mit Text außerhalb des sichtbaren Bereichs
  (Off-Canvas-Seitenleiste am Telefon wird ausgenommen), fehlende Fokus-Ringe (15 Tab-Schritte: Element mit
  `:focus-visible`, aber ohne Outline/Box-Shadow). Die Tab-Reihenfolge steht als `fokusBesucht` in `bericht.json`.
- `--nur <muster>`: Teilstring oder regulärer Ausdruck auf Pfad, dekodierten Pfad oder Titel
  (z. B. `--nur "^/kassa"`, `--nur Formular`; Viewports werden immer alle aufgenommen).
  **Git Bash** wandelt Muster wie `/d/...` in Windows-Pfade um – vorher `export MSYS_NO_PATHCONV=1` setzen
  (PowerShell ist nicht betroffen).
- Kein Befund sind: die am Telefon ausgeblendete Seitenleiste (Off-Canvas) und Inhalte horizontal
  scrollbarer Tabellen (`scrollBehaelter` in `bericht.json` zählt sie).
- Seriell, ein Browser, großzügige Timeouts (`QA_ROUTE_TIMEOUT_MS`, Standard 240 s); vorab ein Warm-up-Abruf je
  Route, damit Turbopack kompiliert hat (`QA_NO_WARMUP=1` schaltet ab). `bericht.json` wird nach jeder Aufnahme
  geschrieben, ein Abbruch verliert nichts.
- Ausgabe: `bericht.json` (alle Messwerte) und `bericht.md` (Zusammenfassung, Tabelle Route × Viewport × Schema, Details).

Dauer: 90 Routen × 6 Aufnahmen = 540 Bilder; gemessen am 04.11.2026: **1130 s (≈ 19 min)** bei laufendem
Dev-Server (rund 2 s je Aufnahme, der erste Aufruf jeder Route kompiliert zusätzlich).

## 2. Bildbewertung durch das lokale Modell

```
node backoffice/tools/qa/bewerten.mjs backoffice/qa-screenshots/<lauf> [--nur <muster>] [--alle] [--neu] [--modell qwen2.5vl:7b]
```

- Liest `bericht.json` des Ordners (ohne Bericht: alle PNGs nach Dateinamen), verkleinert jedes Bild auf max.
  1280 px Breite (sehr hohe Vollseiten: nur die oberen 2400 px), und schickt es als base64 an `POST /api/chat`
  mit fester deutscher Prüfanweisung und JSON-Schema als `format`
  (`{note_1_bis_10, befunde:[{schwere, ort, problem, vorschlag}], staerken:[]}`).
- Geprüft wird: Layoutbrüche, abgeschnittene/überlappende Texte, zu kleine Schrift, schwache Kontraste,
  inkonsistente Abstände, leere/platzhalterhafte Flächen, unklare Hierarchie, fehlende Primäraktion, unmoderne
  Optik im Vergleich zu Linear/Stripe/Notion.
- Standard: nur Aufnahmen der **Kernseiten** (`kern: true` in `routen.mjs`: 16 Routen mit eigenem Layout);
  die generischen DocType-Listen und die Bereichs-Startseiten (`BereichStart`) teilen sich je eine Vorlage. `--alle` bewertet jedes Bild, `--nur` filtert nach Dateiname/Route/Titel.
- Robust: drei Versuche je Bild (Timeout 10 min je Anfrage, `QA_OLLAMA_TIMEOUT_MS`), `bewertung.json` nach jedem
  Bild; ein neuer Aufruf setzt fort und überspringt bereits bewertete Bilder (`--neu` verwirft das).
- Ausgabe: `bewertung.json` und `bewertung.md` (Übersicht Route × Viewport × Schema mit Note und Top-Befunden,
  gebündelte häufigste Hinweise, alle Befunde je Bild).

Dauer: gemessen am 04.11.2026 im Mittel **≈ 45 s je Bild** (23–150 s) auf der RTX 4060; deutlich langsamer, wenn
ein anderer Prozess parallel ein Ollama-Modell lädt (das Werkzeug entlädt nur beim Start). Kernseiten
(16 Routen × 6 = 96 Bilder) ≈ 70–90 Minuten; `--alle` entsprechend ein Vielfaches. Über Nacht laufen lassen
oder mit `--nur` eingrenzen.

## Grenzen – bitte lesen, bevor Befunde weitergegeben werden

- **Das Modell liefert Hinweise, keine Urteile.** `qwen2.5vl:7b` (4-Bit) übersieht Befunde, erfindet gelegentlich
  welche (typisch: „Text abgeschnitten“ am unteren Bildrand einer Vollseiten-Aufnahme, „fehlende Primäraktion“ auf
  reinen Listenseiten), bewertet Mock-Platzhalter wie fertige Seiten und streut bei der Note stark (dasselbe Bild
  kann 5 oder 8 bekommen). Jeder Befund ist am Screenshot nachzusehen; die Zusammenfassung in `bewertung.md` dient
  als Suchhilfe für die menschliche Sichtung, nicht als Abnahmeergebnis.
- Erfahrung aus dem Basislauf 04.11.2026: Noten nur 7 oder 8 (keine Trennschärfe), überwiegend allgemeine
  „zu klein / könnte größer sein“-Hinweise; echte Fehler (unlesbare Diagramm-Achsen, Next-Fehlerplakette
  „1 Issue“, mitten im Formular schwebende Speicherleiste, abgeschnittenes Kanban) wurden nicht oder nur
  zufällig genannt. Wertvoller als die Note sind daher `bericht.md` und die eigene Sichtung.
- Einzelne Antworten werden an der Token-Grenze abgeschnitten (JSON-Fehler „Unterminated string“); ein
  erneuter Aufruf holt nur diese Bilder nach.
- Die technischen Prüfungen in `shoot.mjs` sind heuristisch: „Text außerhalb“ erkennt nur Elemente mit eigenem
  Textknoten; Fokus-Ringe werden über Outline/Box-Shadow erkannt (ein Ring nur über Rahmenfarbe fiele durch);
  es werden 15 Tab-Schritte geprüft, nicht die ganze Seite.
- Screenshots entstehen nach dem Laden ohne Interaktion: Menüs, Dialoge, Befehlspalette, Drag & Drop,
  Hover-Zustände und Toasts sind nicht abgebildet. Der Fokus-Durchlauf findet nach dem Screenshot statt.
- Mock-Modus: Daten sind generiert, Bereichs-Startseiten teils Platzhalter (`BereichStart`). Befunde wie „leere
  Fläche“ sind dort erwartbar und keine Fehler der Shell.
- Nur Chromium; Safari/WebKit (echtes iPad) ist nicht abgedeckt.
- Das Werkzeug ändert nichts am Backoffice-Code und erstellt keine Datensätze (nur Lesen, Anmeldung, Tab-Durchlauf).
