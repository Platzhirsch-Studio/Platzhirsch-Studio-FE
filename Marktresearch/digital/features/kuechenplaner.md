# Feature: 3D-Küchenplaner (Labs)

Seite: `/de/labs/kuechenplaner` (nur `de`, `robots: noindex, nofollow`, andere Locales → 404).
Stand: 2026-10-28 („Feinschliff“ mit Varianten A/B, „Fix 2“ nach QA-Feedback 2, „Fix 1“ nach QA-Feedback 1 und Pro-Ausbau, siehe die Abschnitte direkt unten; die älteren Abschnitte beschreiben den Stand davor).

## Fix 3 (28.10.2026): Restliste aus dem Feinschliff-Feedback

Grundlage: `qa-screenshots/feinschliff/kuechenplaner/feedback.md` (Note 8,5, kein P1). Nachweise liegen in `qa-screenshots/feinschliff/kuechenplaner/fix2/`. Es gibt keine neuen npm-Pakete, und nichts wurde abgesendet.

- **P2-1, Vergleich auf dem Handy:** Unter `lg` wird die Ansicht im Reiter „Ergebnis“ automatisch minimiert (der Zustand des vorhandenen Knopfs). Beim Wechsel in einen anderen Reiter kommt der vorige Zustand zurück. Ein Direktaufruf mit `?t=ergebnis` startet mobil schon minimiert. Mobil folgt `scroll-padding-top` der Seite der Höhe von Header und angehefteter Ansicht (ResizeObserver, WCAG 2.4.11). Beim Verlassen der Seite wird der Wert zurückgesetzt.
- **P2-2, Delta sichtbar:** Über der Tabelle steht „Δ Kleine Zahl unter B: Differenz von B gegenüber A.“. Jedes Delta trägt ein „Δ“, das für Screenreader ausgeblendet ist. Die Caption bleibt.
- **P2-3, Öffnen verliert nichts:** Zeigt die Gegenseite die ungemerkte Live-Planung, wird sie vor dem Öffnen dort gemerkt. Die Meldung lautet „Aktuelle Planung als B gemerkt, Variante A geöffnet.“. Die Regel steht als reine Funktion in `src/lib/kuechenplaner/variants.js` (`openVariant`).
- **P3-1:** Der Haubenschrank zählt als Modul, aber nicht mehr als Hängeschrank-Stauraum. Die Zeile heißt jetzt „Hängeschränke (Stauraum)“, und die Fußnote nennt den Haubenschrank.
- **P3-2:** Zwischen Zahl und Einheit steht ein geschütztes Leerzeichen (Werte, Delta, Raum, Plattenstärke).
- **P3-3:** Die Miniaturen zeigen keine Kürzel mehr (`PlanSvg labels={false}`, das betrifft auch die Anschluss-Kürzel).
- **P3-4:** Die Zeile „Im Planer geöffnet“ ist in beiden Köpfen immer reserviert. A und B beginnen deshalb auf gleicher Höhe.
- **P3-5:** Ohne Browserspeicher werden die Merkplätze im Speicher der Seite gehalten. Das überlebt Reiterwechsel, gilt aber nur bis zum Neuladen, und die Meldung sagt das. Merken, Entfernen, Tauschen und Öffnen laufen über denselben Weg.
- **P3-6:** Der axe-Treffer `target-size` entsteht durch die Überlappung mit der festen Preisleiste. Siehe Prüfung.
- **P3-7:** Auf dem Server und im ersten Client-Render liefert `useSyncExternalStore` `null`. Bis der Speicher gelesen ist, steht dort ein Platzhalter gleicher Höhe (`data-kp-compare-pending`, `aria-busy`) statt „Noch leer“.
- **P3-8, E2E WebKit:** neu ist `tests/e2e/kuechenplaner-varianten-iphone.spec.js`.
- **P3-9, Rechtspaket:** Das liegt beim Rechtsteam, nicht beim Planer. Die Datenschutzerklärung ist keine Datei des Planers. Zu übernehmen sind diese lokalen Speicher, die alle vom Nutzer ausgelöst werden, unbedingt erforderlich sind und keine Daten an den Server senden:
  - `kp-saves-v1`: „Im Browser speichern“, höchstens 12 Planungen
  - `kp-variants-v1`: Merkplätze A/B
- **Weiter offen:**
  - P3-8: Messung im Produktions-Build
  - P3-9 Rest: Module in 3D ziehen, Bemaßung in 3D

Dateien:
- neu: `src/lib/kuechenplaner/variants.js`, `tests/e2e/kuechenplaner-varianten-fix3.spec.js`, `tests/e2e/kuechenplaner-varianten-iphone.spec.js`
- geändert: `compare.js`, `VariantCompare.js`, `Drawings.js` (Prop `labels`), `PlanEditor.js` (minimierte Ansicht ohne Kürzel, die sich sonst überlappen), `KuechenplanerApp.js` (Auto-Minimieren, scroll-padding), `tests/unit/kuechenplaner-varianten.test.mjs` (+4 Tests)

Prüfung (Nachweise in `fix2/`):
- **Unit:** 92/92 grün.
- **E2E** (`PW_WORKERS=1`, `fix2/e2e.log`): 6/6 grün, darunter 3 neue Fix-3-Tests und der neue iPhone-WebKit-Test. Ein bestehender Test war „flaky“: Im ersten Versuch hydrierte die Seite wegen Serverlast nicht, die Wiederholung war grün. Der erste Lauf (`e2e-lauf1-serverlast.log`) brach aus demselben Grund ab, dazu kam ein Neukompilieren mitten im Lauf.
- **axe auf Pixel 7, Reiter Ergebnis** (oben, Speichern-Block, Vergleich): 0 Verstöße. Der `target-size`-Treffer (P3-6) tritt nicht mehr auf. Weitere Messwerte:
  - Die Sticky-Fläche belegt 19 % der Höhe.
  - `scroll-padding-top` liegt bei 170 px.
  - Kein Nicht-GET-Request.
- **shoot** `?t=ergebnis`: Desktop und iPad zeigen 200. Android lief in einen Timeout bei `goto`. Auf dem iPhone kam die Fehlerseite, nachdem 13 Chunks wegen Serverlast nicht luden. Der E2E-Lauf auf demselben Gerät war grün.

## Feinschliff (28.10.2026): Restliste aus QA-Feedback 2

Grundlage: die offenen Punkte aus `qa-screenshots/labs-ausbau/kuechenplaner/feedback-2.md`. Nachprüfung liegt in `qa-screenshots/feinschliff/kuechenplaner/selbst/`. Es gibt keine neuen npm-Pakete, und nichts wurde abgesendet (im E2E sind Nicht-GET-Requests an `/api` gesperrt).

- **P2-5 und P3-1 bis P3-7:** Das war schon mit Fix 2 umgesetzt (Tabelle unten). Im Code habe ich nachgesehen, dass alles da ist:
  - HDR `hdr/studio_small_09_256.hdr` mit 105 KB, CC0, im Rechte-Register `public/labs/kuechenplaner/README.md`
  - GTAO ab Desktop mit Fallback
  - `polygonOffset` an Fuge, Schattenfuge und Griffmulde
  - SpotLight und RectAreaLight im Abendlicht
  - Das Budget steht unten.
- **P3-9 Varianten A/B nebeneinander:** neu.
  - **Wo:** Reiter „Ergebnis“, direkt nach „Speichern & drucken“. Der Teil lädt erst mit dem Reiter (`next/dynamic`), das Erstladen wird nicht größer.
  - **Merken:** Es gibt zwei Merkplätze A und B (`localStorage` `kp-variants-v1`, nur Komfort, jeder Zugriff in try/catch). Ist nur A gemerkt, zeigt B live die aktuelle Planung. Man merkt A, ändert die Planung und sieht den Unterschied sofort.
  - **Je Variante:** Grundriss, „Öffnen“ (im Planer, mit Rückgängig), „Aktualisieren“ (mit der aktuellen Planung überschreiben) und „Entfernen“. Die Variante, die gerade im Planer offen ist, trägt die Markierung „Im Planer geöffnet“. A und B lassen sich tauschen.
  - **Vergleichstabelle:** echte `<table>` mit `th scope` und Gruppen.
    - Raum: Form, Maße
    - Fläche & Stauraum: Arbeitsplatte, Arbeitsfläche ohne Spüle und Kochfeld, Stauraum unten, hoch und Hängeschränke in cm Frontbreite, Anzahl Module
    - Geräte & Ergonomie: Geräte, Summe des Arbeitsdreiecks, Arbeitshöhe
    - Material: Fronten, Platte, Griff
    - Prüfung: Kollisionen, Hinweise
    - Preisrahmen: nur wenn er freigegeben ist
  - **Unterschiede:** Abweichende Zeilen sind ocker markiert (für Screenreader „unterschiedlich“). Bei Zahlen steht das Delta „B gegenüber A“. Ein Schalter zeigt nur die Unterschiede, darunter steht „Nur in A / Nur in B“ (Module). Die Texte sind neutral, es gibt kein „besser“.
  - **Mobil:** Beide Spalten stehen auch auf 393 px nebeneinander, ohne seitliches Scrollen (E2E).
  - **Logik:** `src/lib/kuechenplaner/compare.js` (`planMetrics`, `compareRows`, `moduleDiff`). Die Geräte stehen in fester Katalog-Reihenfolge, deshalb gelten verschobene Geräte nicht als Unterschied.
- **Weiter offen:**
  - P3-8: Messung im Produktions-Build und auf einem echten Android
  - P3-9 Rest: Module in 3D ziehen, Bemaßung in 3D

Dateien:
- neu: `src/lib/kuechenplaner/compare.js`, `src/components/Labs/Kuechenplaner/VariantCompare.js`
- geändert: `KuechenplanerApp.js` (lädt VariantCompare), `ResultPanel.js` (Prop `compare`)

Tests:
- `tests/unit/kuechenplaner-varianten.test.mjs`: 5 Tests
- `tests/e2e/kuechenplaner-varianten.spec.js`: 2 Tests (Ablauf A/B auf dem Desktop, Pixel 7 nebeneinander)

Ergebnis: **2/2 grün** (`PW_WORKERS=1`, Log `selbst/e2e-varianten.log`, Bild `selbst/varianten-pixel.png`). Die Timeouts sind großzügig, weil der geteilte Dev-Server stark ausgelastet war. Die Unit-Tests der Küchenplaner sind 77/77 grün.

shoot-Lauf (`selbst/`): iPhone, Android und Desktop sind aufgenommen. iPad lief wegen Überlastung des Dev-Servers (parallele Teams) in einen Timeout bei `goto`. Die Konsolenfehler im Bericht sind „Failed to load resource: Timeout“ für Turbopack-Chunks, also Serverlast und kein Fehler des Planers. Die Bilder zeigen den Stand von Fix 2 unverändert.

## Fix 2 nach QA-Feedback 2 (27.10.2026)

Grundlage: `qa-screenshots/labs-ausbau/kuechenplaner/feedback-2.md` (Note 8/10, Freigabe nach P1-1). Nachprüfung: `qa-screenshots/labs-ausbau/kuechenplaner/fix2/`. Darin liegen die shoot-Bilder mit `report.json`, die Interaktionsläufe `probe.mjs` und `probe-p3.mjs` mit Logs und Bildern in `fix2/int/` sowie die E2E-Logs `e2e.log` und `e2e-2.log`. Es gibt keine neuen npm-Pakete. AO kommt aus `three/examples` (GTAOPass), das HDR liegt als lokale Datei vor. Nichts wurde abgesendet: In allen Skripten waren Nicht-GET-Requests gesperrt.

| Punkt | Umsetzung | Messung danach |
|---|---|---|
| **P1-1** Palette auf Touch nicht wischbar | Die Palette-Knöpfe haben `touch-action: pan-x`. Ein Modul-Drag beginnt auf Touch erst bei klar senkrechter Bewegung (\|dy\| > \|dx\| und > 8 px) oder nach einem Long-Press von 300 ms. Waagrechtes Wischen scrollt die Leiste, Antippen fügt das Modul am Ende an. Ist der Drag aktiv, scrollt die Leiste nicht mehr mit. Rechts zeigt ein Verlauf in `paper` mit Pfeil, dass es weitergeht (`data-kp-fade-r`), links erscheint ein Verlauf, sobald gescrollt ist. Die Palette-Schrift ist 12 px groß (P3-4). | Pixel 7: Wischen auf „Spüle“ ergibt scrollLeft 265, Module 11 → 11 (`int/android-02-palette-swipe.png`). Senkrechter Drag von „Geschirrspüler“ auf ein US: „Unterschrank durch Geschirrspüler ersetzt“. E2E-Tests vorhanden. |
| P2-1 Klick nach Palette-Drop verschluckt | Die Klick-Sperre nach einem Drop gilt nur noch 400 ms für dasselbe Gesten-Ende und bleibt nicht als Merker stehen. | Desktop: Drag, danach Klick auf die Palette ergibt 11 → 12 Module (E2E). |
| P2-2 Zoom ohne Auswahl auf leeren Boden | Ohne Auswahl zielt der Zoom auf den Modulbereich mit der größten Dichte (`zoomFocus` in `src/lib/kuechenplaner/planview.js`, bei der L-Form die Ecke). Dazu gibt es einen eigenen Zwei-Finger-Pinch im Plan, der einen laufenden Modul-Drag abbricht. | `int/android-03-zoom.png`, `iphone-03-zoom.png`: Module im Bild. Unit- und E2E-Test vorhanden. |
| P2-3 Halbtransparente 3D-Leisten beim Laden | Die 3D-Bedienleisten erscheinen erst, wenn das Canvas zwei Frames gezeichnet hat. Bis dahin bleiben die 2D-Ansicht und ihre Leisten unverändert, es wird nur der Fortschritt gezeigt. Es überblenden keine zwei Werkzeugleisten mehr. | Android/Desktop/iPhone bei 0,8–8 s: Kamera-Leiste unsichtbar, solange kein Canvas da ist. Danach ist sie sichtbar (`int/*-3d-*.png`, `probe-*.log`). |
| P2-4 U-Vorlage / Geschirrspüler | U-Vorlage: Kühlschrank und Kochfeld stehen an Wand B, Wand C ist reine Arbeitsfläche. Die Vorlage startet ohne Hinweis. Neue Prüfregel in `checks.js`: Steht der Geschirrspüler direkt neben der Spüle, gibt es ein ok. Bei einem Modul Abstand (≤ 60 cm) gibt es einen Tipp, bei mehr Abstand oder an einer anderen Wand einen Hinweis („Geschirrspüler nicht neben der Spüle …“). | Alle Vorlagen starten ohne Hinweis und Kollision (Unit-Test). U-Form: 0 Hinweise (`int/desktop-03-u-form.png`). |
| P2-5 3D-Anmutung | Umgebung aus CC0-HDR Poly Haven „Studio Small 09“, auf 256 × 128 verkleinert (105 KB, lokal unter `public/labs/kuechenplaner/hdr/`). Quelle und Lizenz stehen im Rechte-Register der Texturen, `public/labs/kuechenplaner/README.md`. Die Lightformer liegen darüber. Ab Desktop GTAO (GTAOPass + OutputPass aus `three/examples`). Ohne WebGL2 oder bei einem Fehler wird normal gerendert. Gegen Z-Fighting: Fugen- und Schattenfugen-Materialien mit `polygonOffset`, Schattenfuge 6 mm unter der Oberkante, Kamera-near 5 cm. Abendlicht: breitere LED-Flächenlichter und ein weicher SpotLight-Lichtkegel je Zeile unter den Hängeschränken. | `int/desktop-05-3d-tag.png`, `int/desktop-06-3d-abend.png`. |
| P2-6 Wand verkleinern entfernt still Geräte | Nach dem Verkleinern einer Wand ermittelt die Auto-Belegung, welche Geräte weggefallen sind. Das Feld meldet sie per `role=status`. Die Wichtigkeit regelt eine Rangliste in `planState.js`: Die Spüle bleibt mit Blindecke statt Eckschrank so lange wie möglich erhalten. Neue Prüfregeln: „Keine Spüle geplant“ und „Kein Kochfeld geplant“ (Hinweis). | Wand A 150 cm: „Bei 150 cm nutzbarer Länge passen Eckschrank und Geschirrspüler nicht mehr an Wand A …“ (`int/desktop-04-wall-150.png`). |
| P2-7 Drop in volle Zeile | Die Drag-Vorschau zeigt schon vor dem Loslassen, ob Platz ist (`dropTarget` in `layout.js`). Ohne Platz ist der Ghost rot schraffiert und beschriftet: „Kein Platz an … – Modul ersetzen?“. Über einem Modul gleicher Breite steht ein Ersetzen-Rahmen. Beim Loslassen wird dieses Modul ersetzt (Rückgängig möglich), sonst wird nichts eingefügt. | Desktop: Ersetzen ergibt 11 → 11 Module, Rückgängig stellt den Stand wieder her. Über einem schmaleren Modul: „Kein Platz“, nichts eingefügt (E2E). |
| P3-1 Maßketten springen | Die Seite erkennt das Handy schon im Server-Render (Client Hint `Sec-CH-UA-Mobile`, sonst User-Agent) und gibt das als Server-Snapshot an `useSyncExternalStore`. | iPhone: keine Maßketten im ersten Bild. |
| P3-2 Label von Strichlinie gekreuzt | Hinter jedem Modul-Kürzel liegt ein Rechteck in der Modulfarbe (normal, hoch, Spüle, ausgewählt, Kollision). Es unterbricht die gestrichelte Hängeschrank-Kontur. | `int/android-p3-plan-labels.png` |
| P3-3 30-cm-Module < 24 px | Ist ein ziehbares Modul auf dem Bildschirm kleiner als 24 px, bekommt es eine unsichtbare Trefferfläche von mindestens 24 × 24 px (`data-hit`, WCAG 2.5.8). Sie liegt über den Nachbarn. | Pixel 7: US 30 (b-2) misst 20 px, die Trefferfläche 40 × 24 px. Antippen wählt das Modul aus (`int/probe-p3.log`, E2E). |
| P3-4 Palette-Schrift | 12 px | Log `palette fs 12px` |
| P3-5 Begriffe | Die Stufe `warn` heißt überall „Hinweis“ (CheckPanel wie Kasten). | |
| P3-6 Legende per Esc | Der Esc-Listener hängt am `document`, solange die Legende offen ist. | E2E |
| P3-7 3D-Knopf ohne Label | „3D“ wird schon im Server-Render gezeigt. | `de-labs-kuechenplaner--android.png` |
| P3-8 Performance im Produktions-Build | **Offen.** Laut Auftrag gibt es kein `npm run build` im Repo. INP, fps und Long Tasks bitte auf `next start` und einem echten Mittelklasse-Android messen. | |
| P3-9 Module in 3D ziehen, Bemaßung in 3D, Varianten A/B | Varianten A/B: erledigt im Feinschliff (28.10.). Ziehen und Bemaßung in 3D: **offen**. | |

**Budget 3D (Schätzung, nicht im Produktions-Build gemessen):**
- Das HDR wiegt 105 KB und wird nur beim Laden der 3D-Ansicht geholt.
- Der GTAO-Code aus `three/examples` umfasst etwa 86 KB unminifizierten Quelltext (EffectComposer, RenderPass, GTAOPass, OutputPass, Shader, SimplexNoise). Minifiziert sind das grob 30 KB, gzip etwa 10 KB. Er liegt im selben lazy geladenen 3D-Chunk, das Erstladen enthält weiter kein three.js (E2E „Erstladen ohne three.js“).
- AO läuft nur ab Desktop (nicht `low`). Mobil bleibt es bei Lightformern, kleinerer Schattenkarte und ohne Flächenlicht.
- Ziel auf einem Mittelklasse-Android: ≥ 30 fps beim Drehen, INP < 200 ms beim Ziehen im Plan. Headless mit Software-GL gemessen: 50–61 fps. Das ist nicht aussagekräftig, eine Messung auf echten Geräten steht noch aus.

**Hinweis zur shoot-Aufnahme:** Im iPhone-Lauf von `report.json` stand einmal eine Hydration-Warnung (Attribute). In zwei weiteren WebKit-Läufen (iPhone 15 Pro, je 6 s nach `load`) trat sie nicht wieder auf. Wahrscheinlich kam sie aus dem gleichzeitigen Neukompilieren des Dev-Servers. Im erneuten shoot-Lauf nach dem Nachtrag (P3-2/P3-3) gab es auf allen vier Geräten keine Konsolenfehler und kein seitliches Scrollen (`fix2/report.json`).

Tests: Unit 83/83 grün (`tests/unit/labs-kuechenplaner-fix2.test.mjs` neu). E2E: `tests/e2e/labs-kuechenplaner-fix2.spec.js` mit 8 Tests (P1-1 Wischen, P1-1 senkrechter Drag, P2-7 + P2-1, P2-7 kein Platz, P2-2, P2-6, P3-6, P3-3). Die Küchenplaner-E2E laufen seriell (`PW_WORKERS=1 npx playwright test labs-kuechenplaner --project=desktop`), Ergebnis: **31/31 grün** in 16,3 min (`fix2/e2e-2.log`).

## Fix 1 nach QA-Feedback 1 (27.10.2026)

Grundlage: `qa-screenshots/labs-ausbau/kuechenplaner/feedback-1.md` (Note 7/10). Nachprüfung: `qa-screenshots/labs-ausbau/kuechenplaner/fix1/` (shoot-Bilder, `report.json`, Interaktionslauf `fix1/qa.mjs` mit Logs in `fix1/int/*.log`, Zusatzbilder `fix1/probe-3d.mjs`). Es gibt keine neuen npm-Pakete. Das Formular wurde nie abgesendet.

| Punkt | Umsetzung | Messung danach |
|---|---|---|
| P1-1 Plan zu klein | Die viewBox ist auf den Inhalt zugeschnitten (`src/lib/kuechenplaner/planview.js`, 6 % Rand). Die Werkzeuge liegen in schmalen Leisten links und rechts neben dem Plan (3D, Maße, Dreieck, Legende, Rückgängig bzw. Verkleinern, Zoom +/−, Einpassen, Wiederholen) und nicht mehr darüber. Der Plan läuft mobil randlos, die Planfläche ist `clamp(220px, 38svh, 340px)` hoch. Die SVG-Schrift ist mindestens 11 px groß (Skalierungsfaktor aus ResizeObserver). Zoom 1–4× mit Verschieben per Finger bzw. Maus. | iPhone: 60-cm-Modul 39 × 39 px (vorher 18), kleinste Schrift 13,3 px (vorher 5,3). Pixel 7: 42 px / 14 px. Desktop: 70 px. 30-cm-Passblenden und 35 cm tiefe Hängeschränke haben 19–23 px (Zoom hilft, die Bearbeitung geht auch im Reiter Möbel). |
| P1-2 Scroll-Falle | Die SVG hat `touch-action: pan-y pinch-zoom`, nur ziehbare Module und der Inselgriff haben `none` (zusätzlich ein nicht-passiver `touchstart`, weil iOS `touch-action` an SVG-Kindern nicht überall auswertet). In 3D liegt auf Touch-Geräten eine Schicht „Zum Drehen antippen“ über der Szene (wie bei Google Maps). Erst danach dreht ein Finger, „Fertig“ gibt das Scrollen zurück (`locked` → OrbitControls `enabled=false`). | Pixel 7: Wischen auf freier Planfläche ergibt scrollY +225, auf 3D (gesperrt) +185. E2E-Test `labs-kuechenplaner-fix1.spec.js`. |
| P1-3 3D-Startkamera | `fitPose()` in `Scene3D.js` nimmt die Hülle aller Bauteile, blickt mit 35° Elevation leicht von rechts vorn und wählt den Abstand so, dass alle Ecken mit ≥ 12 % Rand horizontal und vertikal ins Bild passen (Seitenverhältnis). Die Seitenwand-Drehgrenze bleibt eingehalten. Neuer Knopf „Einpassen“ (Desktop in der Leiste, mobil unten rechts). Das Anfragebild nutzt dieselbe Pose. Wände zwischen Kamera und Küche blendet das bestehende Puppenhaus-Prinzip aus. | `fix1/int/iphone-05-3d.png`, `desktop-05-3d.png`: ganze Küche im Bild. |
| P2-1 Beispielplanung / rote Hinweise | Hinweise (warn) erscheinen ocker (`notice`-Token, Kontur links) mit „Hinweis:“, rot nur bei Kollisionen (auch im Ergebnis). Liegen Spüle, Kochfeld und Kühlschrank an einer Wand, ist das Dreieck nur noch ein Hinweis: Laut Quelle (Wikipedia „Kitchen work triangle“) ist ein echtes Dreieck dort geometrisch nicht möglich. Die Vorlagen Zweizeilig und Insel sind so umgestellt, dass sie ohne Warnung starten. | L, Zeile, Zweizeilig, Insel, Halbinsel und frei starten ohne Warnung (Unit-Test). **Offen:** In der L-Form 420 × 330 liegt jede Kühlschrank-Position nahe am Grenzwert. Ein Verschieben der Spüle um 60 cm nach rechts ergibt weiter einen Hinweis (geprüft per Suche über alle Anordnungen, `fix1/tools/search.mjs`). Die U-Form (420 cm) meldet einen Schenkel von 309 cm. |
| P2-2 Leeres Maßfeld | Leer oder ungültig: Das Feld behält den letzten gültigen Wert und meldet das am Feld. Begrenzt: Meldung „Mindestens/Höchstens … Erlaubt sind 150 bis 800 cm.“ per `aria-describedby`. Sind Module länger als die Wand, gibt es die Aktionen „Letztes Modul entfernen“ und „Neu auffüllen“. | E2E-Test |
| P2-3 Reiter abgeschnitten | Rückgängig/Wiederholen stehen mobil in den Planleisten, die Reiter nutzen die volle Breite. | iPhone: Tabliste 361/361 px, jeder Reiter 70 px. |
| P2-4 Kürzel | Die Palette zeigt Piktogramm (`ModuleIcons.js`) und Klartext. Die Legende ist aufklappbar (Info-Knopf, `role=region`, Escape schließt). Beschriftungen haben eine Kontur in Papierfarbe (`paint-order: stroke`), Linien dahinter wirken nicht mehr durchgestrichen. | `fix1/int/android-08-legende.png` |
| P2-5 Sticky Desktop | Gemessen: Die Ansicht war schon sticky (top 89 px). Der Befund kam aus der Ganzseiten-Aufnahme, in der `sticky` nicht wirkt. Zusätzlich gilt `max-height: calc(100dvh - Header - 16px)`. | E2E-Test (Scrollen 600 → 900 px, Ansicht bleibt stehen) |
| P2-6 3D-Anmutung | Kollisionen zeigen das echte Material mit halbtransparenter roter Hülle und Kontur (`Edges`), es gibt keinen Materialtausch mehr. Kontaktschatten sind kräftiger (Deckkraft 0,78, Blur 2,4). Es gibt kein HDR und kein SSAO (kein Zusatzpaket und keine Zusatzdatei), Licht über Lightformer wie bisher. Budget: Headless-fps sind mit Software-GL nicht aussagekräftig (QA-Hinweis). | `fix1/int/desktop-09-3d-kollision.png` |
| P3-1/2 Links | Bei ungültigem `?k` zeigt der Planer einen schließbaren Hinweis (`role=status`). In der Druckansicht ohne `k` steht „Beispielplanung“ statt der Fehlermeldung. | E2E-Test |
| P3-3 Wandansicht | Die Höhenlabels sind 14 Einheiten groß, links ist mehr Rand (150). | |
| P3-4 Preisleiste | Die Preisleiste ist ausgeblendet, solange ein Feld im Panel fokussiert ist (`:has`, Modul-CSS). | |
| P3-5 Kollision/Hinweis | Nicht-Fehler der Kategorie Kollision (z. B. Griffe in der Ecke) stehen unter „Hinweise zur Planung“. | |
| P3-6 ohne JS | Der 3D-Knopf wird serverseitig deaktiviert gerendert („3D-Ansicht lädt …“), das Layout springt nicht. | |

Weitere Änderungen: Neue Dateien sind `src/lib/kuechenplaner/planview.js` und `src/components/Labs/Kuechenplaner/ModuleIcons.js`. Die Auswahlleiste ist einzeilig, die Auswahl hebt man durch Tippen auf eine freie Fläche auf. Neue Tests: `tests/e2e/labs-kuechenplaner-fix1.spec.js` (8 Tests) und `tests/unit/labs-kuechenplaner-fix1.test.mjs` (3 Tests). Alle bestehenden Küchenplaner-Tests sind grün (Unit 77/77, E2E 21/23). Die beiden iPhone-WebKit-Tests sind im Dev-Server wechselhaft: Der Trace zeigt „Failed to load resource: Timeout“ für Turbopack-Chunks beim parallelen Kompilieren. Einzeln laufen beide Tests grün, eine Probe mit 3 Läufen hydriert jeweils in 6–9 s.

## Pro-Ausbau (27.10.2026): markenneutraler 3D-Küchenplaner

Auftrag: Raum frei definierbar, freie Planung per Drag & Drop mit Kollisionsprüfung und Ergonomie, vollständiger Modulkatalog, Material-Details, Bemaßung, Stückliste, Undo/Redo, Speichern/Teilen, Druckansicht, 3D erst auf Klick. Alte Links (v1/v2) öffnen weiter, alle bestehenden Tests bleiben grün.

### Was neu ist

- **Raum:** sieben Grundformen (Zeile, L, U, **Zweizeilig**, Insel, **Halbinsel**, **Freie Raumform**). Freie Form = Wände mit Länge und Innenwinkel (45–270°, also auch schräge Wände und Vorsprünge); die letzte Wand schließt automatisch. Geprüft werden Selbstüberschneidung und Mindestlänge. Vorlagen: Rechteck, L-Raum, Schräge Ecke. **Dachschräge** an jeder Wand (Kniestock, Neigung): Die Wände werden in 3D per Clipping-Ebene abgeschnitten, Schränke darunter melden eine Kollision. **Öffnungen & Anschlüsse:** Fenster, Tür (mit Anschlag und Aufschlag), Heizkörper, Steckdose, Wasser, Abluft-Mauerkasten, Herdanschluss – je Wand mit Position, Breite, Brüstung/Höhe. Fenster und Türen sind echte Wandausschnitte mit Rahmen, Glas und Fensterbank.
- **Freie Planung:** Der Grundriss ist sofort ein Editor. Module per Drag & Drop an jede Wand oder auf die Insel ziehen. Sie rasten an Nachbarkanten und Zeilenenden ein (Magnet 5 cm), sonst gilt ein 1-cm-Raster; in einer vollen Zeile tauscht das Modul mit den Nachbarn. Neue Module aus der Palette ins Bild ziehen oder antippen. Die Insel lässt sich am Griff verschieben (seitlich und Gang). Ohne Ziehen (WCAG 2.5.7): antippen, dann Pfeil-Knöpfe oder Pfeiltasten (5 cm, mit Umschalt 1 cm), Wand wählen, Entfernen. Modell: Lücke `g` vor jedem Modul (cm). Verschobene Module bleiben deshalb stehen, wenn ein Nachbar breiter wird.
- **Kollisionsprüfung** (`src/lib/kuechenplaner/checks.js`, Trennachsen-Test auf Grundriss-Vierecken): Überhang, Überschneidung über Ecken oder mit der Insel, Öffnungsraum vor Auszügen und Türen (z. B. blinde Ecke), gleichzeitiges Öffnen in Ecken, Möbel vor der Tür, Türaufschlag gegen Möbel, Hoch- oder Hängeschrank vor dem Fenster, Fensterbank unter Plattenhöhe, Heizkörper hinter einem Schrank, Dachschräge, Insel außerhalb des Raums. Fehler erscheinen im Plan rot, in 3D als roter Korpus und im Reiter „Prüfen“ (Zähler am Reiter). „Im Plan zeigen“ wählt das Modul aus.
- **Ergonomie mit Quellen** (`norms.js`):
  - Arbeitshöhe nach Körpergröße: 10–15 cm unter dem Ellenbogen, Ellenbogen ≈ 0,633 × Körpergröße (Neff, AMK). Der Knopf „Anpassen“ stellt Sockel und Korpus ein.
  - Arbeitsdreieck Spüle–Kochfeld–Kühlschrank: je Seite 120–270 cm, Summe ≤ 790 cm (NKBA-Richtwert), als Linie im Plan.
  - Gänge 100/120 cm (U, zweizeilig, Insel) und Durchgang hinter der Insel.
  - Arbeitsfläche zwischen Spüle und Kochfeld (≥ 60, gut 90 cm), Abstellfläche neben dem Kochfeld (≥ 30 cm), Kochfeld neben dem Kühlschrank, Geschirrspüler neben der Spüle.
  - Türanschlag von Hochschränken zur Wand (Passblende ≥ 4 cm), Haubenabstand (Neff, je Haubentyp), Entfernung zu Wasser- und Herdanschluss, Umluft ohne Mauerkasten.
  - Werte ohne Quelle heißen im Code „Planungsannahme“.
- **Modulkatalog** (`catalog.js`):
  - Unterschränke: Unterschrank (3/2/4 Auszüge, Innenauszug, Tür, Schublade + Tür), Eckschrank (LeMans; Karussell L 90/90 verschiebt die Nachbarzeile um 30 cm und baut den zweiten Schenkel; Blindecke), Flaschenauszug 15–30, Abfallsammler, offenes Regal, Passstück 3–15.
  - Geräte unten: Spülenschrank (Einzel, 1½, Doppel), Geschirrspüler 45/60, Kochfeldschrank (Induktion, Flächeninduktion, Gas; Abzug automatisch, Flachschirm, Wandhaube/Esse, Muldenlüfter, Inselhaube, Deckenlüfter, ohne), Backofen unter der Platte, Weinkühler.
  - Hochschränke: Vorrat (Fronten, Anschlag), Apothekerschrank, Geräte-Hochschrank (Backofen, + Dampfgarer, + Mikrowelle, + Wärmeschublade, 2 Backöfen), Kühl-Hochschrank (Kombi 178, Vollraum, Gefrier, 122 + Schrank; Anschlag), Side-by-Side (integriert, freistehend), Weinklimaschrank.
  - Hängeschränke je Wand automatisch, eigene oder keine: Tür, Klappe, Glastür, offen, Wandbord, Haubenschrank, Lücke.
  - Breiten: EU 15–120 cm (10- und 15-cm-Raster laut Neff), CH im 55er-SMS-Raster.
- **Material:**
  - Linien „Steinküche (Partner Binni)“ und „Italienische Premiumküche“, ohne Logo und ohne Herstellernamen.
  - Fronten: Lack matt, Lack glänzend (Clearcoat), Holzfurnier (Nuss, Eiche, Eiche geräuchert), Keramik (texturiert), Lackglas, Fenix (sehr matt).
  - Griffe: grifflos (Gola), Push-to-open, Griffleiste, Stangengriff; Griff-Farbe Alu, Schwarz oder Messing.
  - Arbeitsplatte: Marmor, Granit, Quarz, Keramik/Sinterstein, Edelstahl, Holz in 12–60 mm (je Material die üblichen Stärken). Kante gerade, Fase, gerundet oder Gehrung (40-mm-Ansicht). Spüle aufliegend, flächenbündig oder Unterbau; Unterbau und flächenbündig schneiden die Platte wirklich aus. Granit und gebürsteter Edelstahl sind im Browser erzeugte Texturen (kein Download, keine Rechtefrage).
  - Nischenrückwand wie Platte, Glas, Edelstahl oder keine (spart Fenster aus); Wangen in Front oder Platte; Insel-Rückseite verkleidet; Barplatte (ca. 108 cm, Richtmaß).
- **Licht:** Unterbau-LED und 0–4 Pendelleuchten. Die Lichtstimmung „Abend“ in 3D nutzt auf dem Desktop ein Flächenlicht unter den Hängeschränken und ein Punktlicht je Pendel, mobil nur leuchtende Flächen.
- **Bemaßung:** Draufsicht mit Maßketten (Module, Fenster/Türen, Wandlänge, Insel und Gang), im Plan per Schalter „Maße“ und im Reiter „Prüfen“. Dazu eine **Ansicht je Wand** mit Fronten, Geräten, Öffnungen, Dachschräge sowie Breiten- und Höhenkette (Sockel, Arbeitshöhe, Hängeschrank, Oberkante, Raum).
- **Ergebnis:**
  - Stückliste mit Positionen: Möbel mit Maßen und Ort, Hängeschränke, Platten mit Ausschnitten, Rückwand in m², Sockel in lfm, Passblenden, Wangen, LED in lfm, Pendel, Geräte. Gerätenischen nur mit Herstellerquelle, sonst „Maß fehlt“.
  - **Druckansicht/PDF** `/de/labs/kuechenplaner/druck?k=…`: Server-Seite, noindex; das Druck-CSS blendet Seitenkopf und -fuß aus.
  - Speichern im Browser (bis 12 Planungen, `localStorage` in try/catch, `useSyncExternalStore`). Teilen-Link wie bisher.
  - Foto der aktuellen 3D-Ansicht (bis 2400 px) zusätzlich zum festen Anfrage-Bild.
- **Rückgängig/Wiederholen** über Knöpfe neben den Reitern oder Strg+Z / Strg+Y / Strg+Umschalt+Z. Schritte am Regler und beim Ziehen werden zu einem Schritt zusammengefasst (`history.js`).
- **Preis:** unverändert nur aus der Konfigurationstabelle (`PRICE_TABLE`, jetzt mit Zeilen für alle Modultypen, Platten und Fronten). Ohne Freigabe erscheinen keine Beträge (QM R2 P2-1). Die Stückliste nennt keine Preise.

### Performance

- **3D erst auf Klick** („3D-Ansicht laden“). Vorher lädt kein three.js/R3F; der e2e-Test prüft die Skript-Requests. Der Grundriss-Editor ist ohne 3D voll nutzbar.
- Die Reiter „Prüfen“ (Zeichnungen) und „Ergebnis“ (Formular, Speichern) sowie die Stückliste sind eigene Chunks.
- Eigener Planer-Code im Erstladen (SWC + Terser, gemessen am 27.10.2026): **135 KB minifiziert, 52 KB gzip**. Nachgeladen ohne three.js: 33 KB bzw. 13 KB gzip. Dazu kommen das gemeinsame React/Next-Framework, zod (schmaler Re-Export) und die lucide-Icons. Den Produktionswert (Ziel Erstladen < 200 KB JS gzip) misst der Integrator nach dem Build.
- 3D: `frameloop="demand"`, Schatten nur für tragende Teile (keine Griffe und Fugen). Mobil (`pointer: coarse` oder < 768 px): Schattenkarte 1024 statt 2048, einfache Schatten, ContactShadows 256, Pixeldichte ≤ 1,5, kein Flächenlicht.

### Neue und geänderte Dateien

| Pfad | Zweck |
|---|---|
| `src/lib/kuechenplaner/room.js` | Wände (Grundform/Polygon), Ecken, Eckabstand je Winkel, Karussell-Versatz, nutzbare Zeilenlänge, Deckenhöhe mit Dachschräge |
| `src/lib/kuechenplaner/layout.js` | Lage mit Lücken, Drag & Drop (`moveModule`, `findSlot`, `insertModule`, `removeModule`, `nudgeModule`) |
| `src/lib/kuechenplaner/checks.js` | Kollisionen und Ergonomie |
| `src/lib/kuechenplaner/norms.js` | Richtwerte und Gerätenischen mit Quellen-URL |
| `src/lib/kuechenplaner/bom.js`, `history.js`, `options.js` | Stückliste, Verlauf, Modul-Optionen („f3hl“) |
| `src/components/Labs/Kuechenplaner/PlanEditor.js` | Grundriss-Editor (Drag & Drop, Palette, Tastatur) |
| `.../Drawings.js` | Grundriss mit Maßketten, Wandansichten (ohne Hooks, auch für den Server) |
| `.../CheckPanel.js`, `BomTable.js`, `PrintButton.js` | Reiter Prüfen, Stückliste, Druck-Knopf |
| `src/app/[locale]/labs/kuechenplaner/druck/page.js` | Druckansicht / PDF |
| geändert: `catalog.js`, `planState.js`, `geometry.js`, `pricing.js`, `Scene3D.js`, `Viewer.js`, `KuechenplanerApp.js`, `ResultPanel.js`, `PlanView2D.js`, `Kuechenplaner.module.css`, `page.js` | siehe oben. `release.js`, `SceneBoundary.js` und `server/*` (auch vom Sofaplaner genutzt) sind unverändert |

**Datenmodell (Erweiterung, alle Felder mit Standardwerten):** `runs.{a…h,i}` (i = eigene Inselmodule), Modul `{ t, w, g?, o? }`, `up.{wand}: { m: auto|frei|aus, r }`, `island.{bar, x}`, `gripColor, topT (mm), edge, sink, splash, panels, led, pend`, `ergo { body, plinth, carcass, upGap }`, `room { poly[{l,a}], slope{w,k,d}, op[{k,w,x,b,y,h,s}] }`. Der Teilen-Link bleibt Format 2; ein Token lautet jetzt `kürzel (1–2 Buchstaben) + breite [+lücke] [~optionen]`. Links dürfen bis zu 8000 Zeichen lang sein.

### Prüfung (27.10.2026)

- Unit: `node --test "tests/unit/**/*.test.mjs" src/components/Labs/Kuechenplaner/planState.test.mjs` → **864/864** (neu: `tests/unit/labs-kuechenplaner-pro.test.mjs` mit 29 Tests).
- e2e (`--project=desktop`):
  - `labs-kuechenplaner.spec.js` 7/7. Der Test „Kontextverlust“ klickt jetzt zuerst „3D-Ansicht laden“.
  - Neu `labs-kuechenplaner-pro.spec.js` 6/6: kein three.js vor dem Klick, Drag & Drop mit Rückgängig, Palette, freie Form mit Fenster und Prüfen/Maße, Ergonomie „Anpassen“, Druckansicht noindex ohne Beträge.
  - Neu `labs-kuechenplaner-pro-iphone.spec.js` 2/2 (WebKit, iPhone 15 Pro): kein Überlauf, Bottom-Sheet mit Optionen, Palette, 3D auf Tippen.
  - Dazu r4/r5-Labs (noindex, CSP ohne eval) grün.
- `node tools/qa/shoot.mjs qa-screenshots/labs-ausbau/kuechenplaner/selbst …` → iPhone, Android, iPad und Desktop je 200, 0 Konsolenfehler, kein Überlauf.
- Interaktion und Varianten: `qa-screenshots/labs-ausbau/kuechenplaner/{check,varianten,druck,ergebnis,axe}.mjs`, Ergebnisse in `interaktion/` und `varianten/`.
- axe (WCAG 2.2 AA) je Reiter auf Desktop und Pixel 7: 0 Verstöße. ESLint ohne Befund. Es wurde kein Formular abgeschickt.

### Offene Punkte (Pro)

- Preise und Faktoren für die neuen Module legt der Inhaber fest; die Tabelle enthält nur Platzhalter.
- Richtwerte ohne Herstellerquelle (Abstellfläche, Barhöhe 108 cm, Passblende 4 cm, Hängeschrankabstand) mit dem Küchenplaner im Haus bestätigen. Die SMS-Breiten 27,5/41,25 sind weiter offen.
- Weinkühler und freistehende Side-by-Side: Das Gerätemaß fehlt bis zur Modellwahl.
- Eckschränke gibt es nur an Ecken mit zwei Zeilen. Hängeschrank-Ecken und schräge Ecken (≠ 90°) haben keine Eckbeschlag-Geometrie.
- Die Dachschräge erscheint im Grundriss nicht. Die schräge Decke ist nur in „Ich stehe drin“ sichtbar.
- Echte Gerätemodelle (GLB), AR-Export und Texte auf EN/FR/IT sind weiterhin offen.

## Was gebaut ist

- **Grundformen:** Zeile, L-Form, U-Form, Zeile + Insel.
- **Maße:** Wand A/B/C bzw. Raumtiefe (150–800 cm) und Raumhöhe (230–320 cm), jeweils mit Schieberegler und Zahlenfeld (rastet auf 5 cm). Bei der Insel kommen Länge, Gesamttiefe, Überstand auf der Sitzseite (0–40 cm), Gangbreite und das Gerät in der Insel (ohne/Kochfeld/Spüle) dazu.
- **Raster:** 60 cm (EU) oder 55 cm (Schweizer SMS). Erlaubte Breiten sind Vielfache des Rasters, ein Rest wird als Passblende ausgewiesen.
- **Module je Wand:** Unterschrank (Auszüge), Spüle, Geschirrspüler, Kochfeld, Hochschrank, Backofen-Nische, Kühlschrank. Man kann Module hinzufügen, entfernen, umsortieren und in der Breite ändern. „Vorschlag“ teilt die Wand automatisch auf, „Rest füllen“ ergänzt Unterschränke. Hängeschränke (mit LED-Leiste) entstehen automatisch über den Unterschränken, über dem Kochfeld sitzt eine bündig integrierte Flachschirmhaube; ohne Hängeschränke und auf der Insel zeigt das Kochfeld einen Muldenlüfter. Ist eine Wand zu lang belegt, wird sie rot markiert und es erscheint eine Warnung. Auch zu enge Gänge oder Durchgänge an der Insel werden gemeldet.
- **Material:**
  - Linien: „Binni Stein-Küche“ (leistbar) und „Stilrichtung Mailand“ (Tagline „Italienische Premium-Anmutung – Mailänder Design-Stil“, **keine Herstellernamen**, kein Logo, kein Herstellerpreis). In 3D sichtbar: Inseln mit Wangen im Wasserfall-Stil, höhere Hochschränke (2,40 m), tief zurückgesetzter Sockel und dunkle Schattenfuge statt Alu-Griffmulde.
  - Fronten: Lack matt in 5 Farben, Holzfurnier (Nussbaum, Eiche) oder Lackglas in 3 Farben. Hänge- und Unterschränke nutzen dasselbe Frontmaterial (farbgleich), zwischen den Fronten liegen dunkle 3-mm-Fugen.
  - Griff: grifflos (Griffmulde aus Alu) oder Griffleiste.
  - Arbeitsplatte: Marmor, Keramik, Quarz oder Holz, jeweils mit PBR-Textur (Farbe, Normal, Rauheit). Bei Stein ist die Nischenrückwand im selben Material.
- **3D:** three.js r183 mit React Three Fiber und drei. Licht aus Lightformer-Umgebung (ohne HDR-Download), Schattenkarte und ContactShadows. Es wird nur bei Bedarf gerendert (`frameloop="demand"`). Kameras: „Rundum“ (Orbit, Drehwinkel ±60° um die offene Raumseite), „Draufsicht“ und „Ich stehe in der Küche“ (Augenhöhe 1,60 m, Blick auf die Rückwand, FOV 62°, nur Umsehen). Wände zwischen Kamera und Küche werden ausgeblendet (Puppenhaus-Prinzip), die Decke erscheint nur, wenn man im Raum steht. Raum: warme Off-White-Wände mit Verlauf, Sockelleiste, Deckenkante, gebackene Eck-Verschattung (AO-Streifen) und ContactShadows (Deckkraft 0,6). Geräte: Backofen mit Edelstahlrahmen, Glasscheibe, Bedienleiste und Griff; Armatur als Bogen (TubeGeometry). Drehen und Zoomen gehen auch über Buttons, also per Tastatur. Auf dem Handy wird die Kamera bei Hochformat weiter zurückgesetzt.
- **2D-Grundriss (SVG):** dient als Fallback ohne WebGL, als Platzhalter vor dem Laden und als umschaltbare Ansicht. Er nutzt dieselben Bauteile wie die 3D-Szene (`geometry.js`).
- **Preisrahmen:** live aus `PRICE_TABLE`. Alle Werte sind **Platzhalter** und sichtbar als „Richtwert – Beispielwerte [Preis vom Inhaber festzulegen]“ gekennzeichnet, mit Aufschlüsselung.
- **Ergebnis:**
  - Textzusammenfassung.
  - Bild der 3D-Ansicht: immer aus der festen Gesamtansicht von vorne (unabhängig von der aktuellen Nutzerkamera), max. 1200 px breit, zum Herunterladen.
  - Teilen-Link: Die Konfiguration steckt als base64url-JSON in `?k=` und ist mit zod validiert. Format v2: Modulbreiten als Ganzzahl in 1/100 cm (`k8250`), damit 55er-Breiten den Trenner nicht mehr zerreißen; alte v1-Links werden weiter gelesen. Der aktive Reiter steht als `&t=` in der URL. Die Adresszeile wird laufend aktualisiert. Teilen geht per Web-Share oder Kopieren.
  - „Planung anfragen“.
- **Planung anfragen:**
  1. Speichert Konfiguration und Screenshot (ohne Kontaktdaten) über `POST /api/labs/kuechenplaner/plan` und erhält eine Plan-ID und einen HMAC-signierten Bildlink.
  2. Sendet an die **bestehende** Route `/api/beratung_anfrage` im Format von `BeratungClient` (`bei_meiner_anfrage_geht_es_um`, `das_projekt_soll_verwirklicht_werden`, `bitte_beschreiben_sie_ihr_vorhaben` = Zusammenfassung + Richtwert + Teilen-Link + Plan-ID/Bildlink, `vorname`, `nachname`, `email`, `telefon`). Die Route wurde nicht geändert.
- **Testmodus:** In der Entwicklung (`NODE_ENV !== production`) wird **nie echt gesendet**, sondern das Payload angezeigt (nur mit `?senden=1` geht die Anfrage wirklich raus). In Produktion gibt es den Testmodus mit `?dryrun=1`. Im Testmodus wird auch **nichts gespeichert** (kein POST an die Speicher-Route).

## Dateien

| Pfad | Zweck |
|---|---|
| `src/app/[locale]/labs/kuechenplaner/page.js` | Server Component, Locale-Prüfung, Metadata noindex, dekodiert `?k=`, lädt den Katalog über den Adapter |
| `src/app/api/labs/kuechenplaner/plan/route.js` | POST speichern (Herkunftsprüfung, zod, Größen-, JPEG- und Pixelmaß-Prüfung, Einwilligung Pflicht, Drosselung 10/10 min je Client, globale Obergrenze), GET mit Signatur (JSON oder `&bild=1`) |
| `src/components/Labs/Kuechenplaner/catalog.js` | Grundformen, Raster, Module, Linien, Fronten, Arbeitsplatten, **Preistabelle (Platzhalter)** |
| `.../planState.js` | zod-Schema, Standardplan, Auto-Aufteilung, Rasterwechsel, Kodierung des Teilen-Links (v2, liest v1) |
| `.../planState.test.mjs` | Rundlauftest Teilen-Link: 4 Grundformen × 2 Raster, 55er-Nachkommabreiten, alte v1-Links, Müll → null (`node --test src/components/Labs/Kuechenplaner/planState.test.mjs`) |
| `.../Kuechenplaner.module.css` | Blendet auf dieser Seite die seitenweite Leiste „Anrufen / Termin“ aus; `scroll-margin` für Felder unter der angehefteten Ansicht |
| `.../geometry.js` | Plan → Bauteile (Boxen in m) und Warnungen; gemeinsame Grundlage für 3D und 2D |
| `.../pricing.js` | Preisrahmen und Klartext-Zusammenfassung |
| `.../KuechenplanerApp.js` | Client-UI: Reiter Raum/Module/Material/Ergebnis; mobil angeheftete Ansicht (28svh, minimierbar) und Preisleiste unten; Module mobil als Kacheln mit Bottom-Sheet (`<dialog>`) |
| `.../Viewer.js` | WebGL-Erkennung, lädt 3D per IntersectionObserver (mit `next/dynamic`, `ssr:false`), Werkzeugleiste in der Ansicht, Grundriss als Platzhalter mit Ladefortschritt, weiches Einblenden |
| `.../Scene3D.js` | R3F-Szene, PBR-Materialien, UVs im Weltmaß (Texturen verzerren nicht), Kameramodi, Screenshot-API |
| `.../PlanView2D.js` | SVG-Grundriss |
| `.../ResultPanel.js` | Zusammenfassung, Preis, Bild, Teilen, Anfrageformular (zod) |
| `.../server/store.js` | **Adapter**: `getCatalog`, `savePlan`, `loadPlan(Image)`, `usage`/`quotaOk` (globale Obergrenze), HMAC `sign`/`verify`, Aufbewahrung 180 Tage |
| `public/labs/kuechenplaner/*/{color,normal,roughness}.jpg` + `README.md` | CC0-Texturen von ambientCG (Marble021, Marble006, Granite002A, Wood049, Wood051, WoodFloor051), zusammen ca. 1,1 MB, jede Datei < 300 KB |

## Architektur

```
page.js (Server) ── getCatalog() ─► server/store.js ─► .data/kuechenplaner/catalog.json (optional) | catalog.js
   │ initialPlan = decodePlan(?k)
   ▼
KuechenplanerApp (Client) ── plan (State) ─► buildKitchen() ─► Viewer ─► Scene3D (lazy) | PlanView2D
                          └► priceRange(plan, priceTable)
ResultPanel ─► POST /api/labs/kuechenplaner/plan (Konfig + JPEG) ─► store.savePlan → .data/kuechenplaner/plans/<id>.json/.jpg
            └► POST /api/beratung_anfrage (bestehend) ─► Frappe create_anfrage
```

Three/R3F/drei landen nur im Chunk von `Scene3D` und werden erst geladen, wenn die Ansicht sichtbar ist. Bei „Daten sparen“ passiert das nur auf Klick. `prefers-reduced-motion` schaltet das Dämpfen der Kamera aus; Auto-Animationen gibt es keine.

## Datenmodell (Plan, v1; Teilen-Link-Kodierung v2)

```js
{ v: 1, shape: "zeile"|"l"|"u"|"insel", raster: 60|55, h: cm,
  walls: { a, b, c },                       // cm; b = Raumtiefe bei Zeile/Insel
  runs: { a: [{ t: Modultyp, w: cm }], b: [...], c: [...] },
  island: { len, depth, over, aisle, fn: "keine"|"kochfeld"|"spuele" },
  wallCabinets: bool, line: "binni"|"milano", finish: "matt"|"holz"|"glas",
  color: key, grip: "grifflos"|"leiste", top: "marmor"|"keramik"|"quarz"|"holz" }
```

Gespeicherter Datensatz: `{ id, createdAt, plan, hasImage }` und `<id>.jpg`. **Keine personenbezogenen Daten.**

## Anbindung Frappe (später)

Heute gibt es keinen Schreibzugang und kein Preisfeld. Vorschlag für Doctypes im Backoffice (App `platzhirsch_studio`):

1. **`Kuechen Katalog`** (Single oder je Linie): Child-Tables `Kuechen Modul` (key, label_de…, kind, units, Preis von/bis je Linie), `Kuechen Arbeitsplatte` (key, label, Stärke, Preis je lfm von/bis, Texturdatei), `Kuechen Front` (finish, color, hex, textur, Faktor). Lesen über `GET /api/resource/Kuechen Katalog/<name>` oder eine Whitelist-Methode `platzhirsch_studio.api.kuechen.get_katalog`. → Nur `getCatalog()` in `server/store.js` austauschen. Das Schema bleibt gleich, deshalb kann es zod danach prüfen.
2. **`Kuechen Planung`**: Felder `plan_json` (JSON), `screenshot` (Attach), `share_code`, `anfrage` (Link → Anfrage). Schreiben über `POST /api/resource/Kuechen Planung` mit API-Key (Server-seitig, `FRAPPE_API_KEY/SECRET`) oder eine Methode `…kuechen.save_planung`. → `savePlan`/`loadPlan` austauschen.
3. **Anfrage:** heute `create_anfrage` über `/api/beratung_anfrage` (Freitext). Später ein Feld `kuechen_planung` (Link) in `Anfrage`, damit der Verkauf Bild und Konfiguration direkt im Backoffice sieht.

Bis dahin gilt: Eine Preisüberschreibung ohne Deploy ist möglich über `.data/kuechenplaner/catalog.json` mit `{ "priceTable": { … } }` (gitignored).

## Rechtliches / Datenschutz

- Preise sind Beispielwerte und auf Seite, Preisleiste, Ergebnis und Anfrage als „Richtwert – Beispielwerte [Preis vom Inhaber festzulegen]“ gekennzeichnet, mit dem Hinweis „unverbindlich, inkl. MwSt., kein Angebot“. Vor dem Livegang legt der Inhaber die Werte fest (PAngV/UWG, siehe Bericht 14).
- „Stilrichtung Mailand“ nennt **keine Herstellernamen** mehr (QA P1-3). Eine Nennung von Herstellern nur nach schriftlicher Freigabe durch Inhaber und Hersteller. Der Linienname „Binni Stein-Küche“ wurde aus der Aufgabe übernommen und muss vom Inhaber bestätigt werden.
- Zum Absenden ist eine Einwilligung per Checkbox mit Link zur Datenschutzerklärung nötig. Die Einwilligung deckt auch die Speicherung von Konfiguration und Screenshot ab. Die Speicherung ist datensparsam (keine Kontaktdaten in `.data/`), alte Pläne werden nach 180 Tagen automatisch gelöscht, nichts landet in `public/`.
- Der Bildlink ist HMAC-signiert (`KUECHENPLANER_SECRET` bzw. `LABS_SECRET`). In der Entwicklung greift ein Fallback-Schlüssel mit Konsolenwarnung, in Produktion ohne Secret antwortet die Route mit 503.
- Es gibt keine KI-generierten Inhalte (AI Act Art. 50 nicht berührt). Die Texturen sind CC0 und die Quelle ist im README genannt.
- Datenschutzerklärung ergänzen: Küchenplaner, Speicherung von Konfiguration und Bild, Aufbewahrungsfrist.

## Test

- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/de/labs/kuechenplaner` → 200 (`/en/...` → 404).
- Playwright (Chromium/SwiftShader, 375 px und 1440 px):
  - Kein horizontales Scrollen.
  - Getestet: Formen L/U/Insel, Material- und Kamerawechsel, 55-cm-Raster, 2D, Screenshot.
  - Das Formular ohne Einwilligung zeigt einen Fehler. Mit Einwilligung kommt die Testmodus-Vorschau, `/api/beratung_anfrage` wurde **nicht** aufgerufen.
  - Der Teilen-Link stellt die Planung wieder her.
  - Ein signierter GET liefert 200, eine falsche Signatur 403.

- **Nach QA Runde 1 (26.10.2026):** `node tools/qa/shoot.mjs qa-screenshots/kuechenplaner/fix …` → iPhone, Android, iPad und Desktop jeweils 200, keine Konsolenfehler, kein horizontales Scrollen. Interaktionsprüfung `qa-screenshots/kuechenplaner/fix-check.mjs` (Ergebnis `fix/interaktion/fix-check.json`): 55er-U-Form übersteht Neuladen; mobil bleiben 61 % (iPhone) bzw. 64 % (Android 375) der Höhe für die Bedienung; Fokus nach Fehler auf „Vorname“ unterhalb der angehefteten Ansicht; Einwilligungsfehler verknüpft; Testmodus ohne POST an Speicher- und Beratungs-Route; Anfrage-Bild 600–840 px breit; ohne WebGL kein 3D-Knopf, Hinweis unter dem Grundriss. API: fremde Origin bzw. Sec-Fetch-Site cross-site → 403, ungültiger Plan → 400, falsche Signatur → 403. Unit: `planState.test.mjs` 11/11.

## Offene Punkte

- Preise und Faktoren vom Inhaber festlegen. Danach den Doctype `Kuechen Katalog` anlegen und die Preise dort pflegen.
- Eckschränke sind vereinfacht (der erste Schrank an Wand A gilt als Blindecke); Eckkarussell oder LeMans gibt es noch nicht. Fenster und Türen fehlen im Raum.
- Insel-Module werden automatisch aufgeteilt und sind noch nicht einzeln editierbar.
- Ein PDF-Merkblatt und die Übernahme in die Merkliste fehlen noch, ebenso Texte auf EN/FR/IT (Labs ist nur auf `de`).
- Echte Gerätemodelle (GLB) und Fronten aus Herstellerdaten sind möglich, sobald Lizenzen geklärt sind.
- Eine AR-Ansicht (model-viewer + GLB-Export via `GLTFExporter`) wäre ein nächster Schritt.
- Die Drosselung ist nur im Speicher der jeweiligen Instanz; bei mehreren Instanzen braucht es Redis oder Ähnliches. In Produktion `KUECHENPLANER_IP_HEADER` auf den Header des eigenen Proxys setzen (z. B. `x-real-ip`), sonst zählt der letzte Eintrag von X-Forwarded-For. Obergrenzen: `KUECHENPLANER_MAX_PER_DAY` (Standard 200), `KUECHENPLANER_MAX_MB` (Standard 500).
- 55er-Raster: Breiten 27,5 und 41,25 cm mit dem Inhaber klären (welche SMS-Breiten real angeboten werden) und ggf. aus `MODULES.*.units` streichen (QA P3-1).
- Datenschutzerklärung: Abschnitt Küchenplaner fehlt noch (Inhaber, QA P3-10).
- Die seitenweite Leiste „Anrufen / Termin“ wird per CSS (`:has()`) ausgeblendet. Sauberer wäre ein Schalter in `client-layout.js` (gehört dem Website-Team).

## QA Runde 1 – Umsetzung (26.10.2026)

Grundlage: `qa-screenshots/kuechenplaner/feedback-runde1.md` (Note 6/10). Eigene Prüfung danach: `qa-screenshots/kuechenplaner/fix/`.

| Punkt | Umsetzung |
|---|---|
| P1-1 Teilen-Link 55er-Raster | Kodierung v2 (Breite als Ganzzahl in 1/100 cm), v1 wird repariert gelesen; Rundlauftest `planState.test.mjs` (11 Tests grün) |
| P1-2 Kamera „Ich stehe“ | Augenhöhe 1,60 m, Standort 78 % der Raumtiefe (Insel: hinter der Sitzseite), Blick auf `[cx; 1,30; 0,30]`, FOV 62°; Umsehen bleibt (Orbit-Ziel 5 cm vor dem Auge in Blickrichtung) |
| P1-3 Herstellernamen | „Poliform/Varenna“ aus Tagline und Doku entfernt |
| P1-4 Mobil Platz | Ansicht 28svh (min. 190 px), Werkzeugleiste in der 3D-Fläche, Preis und „Anfragen“ als eigene Leiste unten, seitenweite Anruf-Leiste ausgeblendet, Schalter „Ansicht minimieren“ (96 px), `scroll-margin` für alle Felder |
| P2-1 Kamera hinter Wänden | Azimut ±60°, Puppenhaus-Wände, Anfrage-Bild aus fester Kamera |
| P2-2 Optik | siehe „3D“ oben (Licht, AO, Wände, Sockelleiste, Deckenkante, Backofen, Haube, Armatur, Lackglas farbgleich, 3-mm-Fugen) |
| P2-3 Desktop über dem Falz | Einleitung gestrafft, Preis und „Anfragen“ über der Ansicht, Werkzeugleiste in der Ansicht |
| P2-4 Desktop abgeschnitten | `goTab` scrollt zurück an den Planer-Anfang, Panelspalte mit `min-height: 100svh − Header` |
| P2-5 Ladezustand | Grundriss als Platzhalter, Kapsel „3D-Ansicht wird geladen · n %“ (`useProgress`), Überblendung (ohne bei reduzierter Bewegung) |
| P2-6 Modulliste | Mobil Kacheln (Kürzel + Breite, Breite proportional) mit Bottom-Sheet; Desktop eine Zeile je Modul mit Kurzlabels, Spalte 448 px |
| P2-7 Formular | Fokus springt zum ersten fehlerhaften Feld; Einwilligungsfehler per `aria-describedby` verknüpft |
| P2-8 Speicher-Route | Herkunftsprüfung (403), Client-Schlüssel nicht mehr aus dem ersten XFF-Eintrag, globale Obergrenze 200 Pläne/24 h bzw. 500 MB (503), Bild max. 1200 × 1600 px (Server liest SOF), Client skaliert auf 1200 px |
| P2-9 Ohne WebGL | Hinweis unter dem Grundriss, 3D-Knopf ausgeblendet, Grundriss vollständig |
| P3 erledigt | Zahlen mit Komma (`fmtCm`), Testmodus speichert nicht, Linie „Mailand“ in 3D sichtbar, keine 11-px-Texte mehr, zweifarbiger Fokusring (`outline-ink` + weißer Abstand), Reiter in der URL, Einleitung mobil kürzer, Checkbox 24 px. Hover: Tailwind 4 wendet `hover:` nur bei `(hover: hover)` an |
| P3 offen | 55er-Breiten mit Inhaber klären (P3-1), Datenschutzerklärung (P3-10) |


## Runde 2 – Auflagen, Fehlerfälle, Performance (26.10.2026)

| Punkt | Umsetzung | Beleg |
|---|---|---|
| R4 Drehgrenze je Grundform | `geometry.js → azimuthLimits(plan, view)`: An Seiten mit Wand (L links, U beide) bleibt die Kamera 25 cm innerhalb der Wandebene. `Scene3D` setzt die Grenze je Bild neu aus Abstand und Orbit-Ziel. So schaut man nie auf die Rückseiten von Hoch- oder Hängeschränken. Offene Seiten mit Hochschrank am Zeilenende: höchstens ≈ ±41°, sonst ±60°. Die Drehen-Knöpfe nutzen dieselbe Grenze. | `qa-screenshots/kuechenplaner/r2/interaktion/desktop-02-*` |
| R5 „Ich stehe drin“ | `standPose()`: 35 cm weiter zurück, bis höchstens 10 cm vor die offene Raumkante. Sichtfeld 66° statt 62°, Blick etwas tiefer (1,15 m). | `desktop-03`, `iphone-03` |
| R6 Fehlerfokus | `scroll-margin-top` um 24 px auf 36 px erhöht, die Scrollrechnung lässt 40 px Luft. Das gilt auch auf dem Desktop, weil dort das Label ebenfalls unter dem Header lag (gemessen 65 < 73 px). | `result.json → focus/labelVisible` (iPhone, Android, Desktop) |
| R7 3D-Fronten | Hochschrank mit 4 Fronten (2 Auszüge, 2 Türen), Backofen-Nische mit 2 Auszügen. Grifflos: senkrechte Griffleiste über die ganze Höhe. Mit Griffleiste: senkrechte Stange auf Greifhöhe. Backofenscheibe `ovenGlass` heller und spiegelnd, mit Anzeige. | `desktop-04/05` |
| Fehlertexte der Anfrage | `requestErrors.js` bildet den deutschen Text aus dem `code` der Formular-Route (`rate_limited`, `too_large`, `invalid`, `timeout`, `upstream`, `internal`). Fehlt der `code`, entscheidet der HTTP-Status, bei Netzwerkfehlern ein eigener Text. Der englische `error` wird nie angezeigt. Bei `invalid` mit `field` wird das Feld markiert und fokussiert. | e2e, `desktop-07` |
| Kopfabstand | 32 px mobil, 40 px ab 640 px (vorher 16/24 px). Bewusst knapper als PageHeader (40–64 px), damit Preis und „Anfragen“ auf 1440×900 über dem Falz bleiben (Unterkante 314 px). | `selbst/` |

**Fehlerfälle**
- **Kein WebGL:** Hinweis, Grundriss, kein 3D-Knopf. Jetzt als e2e-Test abgesichert.
- **Kontextverlust** (`webglcontextlost`): Die Szene wird abgebaut, der Grundriss erscheint mit „3D erneut laden“, der Knopf baut die Szene neu auf. e2e mit `WEBGL_lose_context`.
- **Ladefehler** (Chunk-Abbruch) und Laufzeitfehler in three.js: `SceneBoundary.js` fängt sie ab, danach gleiches Verhalten wie beim Kontextverlust. Geprüft mit `netz.mjs` (fail).
- **Langsames Netz:** Ist die Szene nach 12 s nicht geladen, erscheint „Langsame Verbindung – der Grundriss ist schon nutzbar“. Geprüft mit `netz.mjs` (slow, Chunks 16 s verzögert).
- **Reduced motion:** keine Dämpfung, keine Überblendung. Pixel 7 mit `reducedMotion: reduce` ohne Fehler.

**Lazy Loading und Chunk-Größen**

Gemessen im Dev-Server (Turbopack, unminifiziert). Die Produktionswerte trägt der Integrator nach dem Build nach.

- Im Server-HTML steht kein three- oder R3F-Skript.
- `next/dynamic` lädt sie, sobald die Ansicht sichtbar ist (IntersectionObserver). Bei „Daten sparen“ erst auf Klick.

| Chunk | Größe | gzip |
|---|---|---|
| `three_core` | 1,98 MB | 311 KB |
| `@react-three/fiber` | 0,97 MB | 176 KB |
| `three_module` | 0,85 MB | 134 KB |
| drei und Rest | ca. 0,2 MB | 28 KB |
| **Summe** | **ca. 4,1 MB** | **ca. 660 KB** |

**Tests**
- `tests/unit/labs-kuechenplaner.test.mjs` (24 Tests): Teilen-Link, R4, R5, R7, Fehlertexte.
- `tests/e2e/labs-kuechenplaner.spec.js` (6 Tests, desktop): ohne WebGL, Kontextverlust, 429 und Netzwerkfehler auf Deutsch, Testmodus sendet nichts, Falz und Kopfabstand.
- Prüfskripte: `qa-screenshots/kuechenplaner/r2/{interact,netz,console,console-stack}.mjs`.

**React-Warnung „state update on a component that hasn't mounted yet“**

Sie liegt nicht im Planer.
- Reproduziert in 1 von 18 Ladevorgängen, auch auf `/de/ueber-uns/team`.
- Stack (`console-stack.mjs`): Next-Dev-Client `hmrRefresh → dispatchAppRouterAction → dispatchOptimisticSetState`.
- Ursache: Dateiänderungen anderer Teams lösen einen HMR-Refresh aus, der auf einen noch nicht gemounteten Router trifft.
- Betrifft nur den Dev-Server. Im Production-Build gegenprüfen.

**Unverändert:**
- Maße 27,5 / 41,25 im 55er-Raster (Inhaber-Frage R1).
- Kennzeichnung „Richtwert – Beispielwerte“ (A2).

## Runde 2 – Fix nach QM-Feedback (26.10.2026)

Grundlage: `qa-screenshots/teamleiter/r2-R2-labs-planer/feedback.md` (P2-1 bis P2-3). Beide Planer teilen sich dafür zwei Module im Küchenplaner-Ordner: `release.js` (Freigaben) und `server/rateLimit.js` (Drosselung).

### P2-1 Preise: keine Zahlen ohne Freigabe

- `pricesPublic(table)` ist nur bei `placeholder: false` wahr. Die Beispieltabellen (`catalog.js` → `PRICE_TABLE`, Sofa `PRICE_CONFIG`) tragen `placeholder: true`. Deshalb zeigen beide Planer heute **keinen Betrag** und **keinen Klammertext** mehr. Das gilt auch für die Preisleiste, die Positionstabelle und den Anfragetext.
- Statt der Zahlen steht dort „Richtpreis im Gespräch – persönlich nach Beratung und Aufmaß“ (Sofa: „Richtpreis · Im Gespräch“).
- Freigabe durch den Inhaber (A2): Küche über `.data/kuechenplaner/catalog.json` mit `{"priceTable": { …echte Werte…, "placeholder": false }}`, Sofa in `PRICE_CONFIG` mit `placeholder: false`. Erst dann erscheint „Richtwert“ mit Betrag und dem Hinweis „unverbindlich, kein Angebot“.

### P2-2 Senden erst nach dem Datenschutz-Abschnitt

- Im Produktions-Build sendet der Küchenplaner nur, wenn beim Build `NEXT_PUBLIC_LABS_PLANER_SENDEN=1` gesetzt ist. Ohne die Variable erscheint der Hinweis „Der Planer ist noch in der Testphase und versendet keine Anfragen …“ mit Telefonnummer. Es gibt keine JSON-Vorschau.
- Serverseitig antworten `POST /api/labs/kuechenplaner/plan` und `POST /de/labs/sofaplaner/teilen` im Produktions-Build mit 503, solange die Freigabe oder Redis fehlt (`liveBlocker()`).
- Die Seitentexte verweisen ohne Freigabe nicht mehr auf einen fehlenden Abschnitt. Sie sagen stattdessen: „In der Testphase sendet und speichert der Planer nichts“. Die Einwilligungstexte nennen die Aufbewahrung von höchstens 180 Tagen direkt.
- Im Dev-Server bleibt alles wie bisher: Testmodus, `?senden=1` nur für die e2e-Tests.

**Entwurf für die Datenschutzerklärung.** Dieser Abschnitt gehört nach `Marktresearch/recht/02-datenschutzerklaerung-entwurf.md` als 5.x [MODUL] und von dort auf `/datenschutz`. Er muss anwaltlich geprüft werden, bevor `NEXT_PUBLIC_LABS_PLANER_SENDEN=1` gesetzt wird:

> ##### 5.x [MODUL] Online-Planer (Küchenplaner, Sofa-Modulplaner)
> - **Daten:** Ihre Planung (Raummaße, Module, Materialien), bei der Küche auf Wunsch ein Bild der 3D-Ansicht, beim Sofa ein frei wählbarer Planname. Bei einer Anfrage zusätzlich Name, E-Mail, Telefon und Ihre Nachricht. Zur Missbrauchsabwehr verarbeiten wir Ihre IP-Adresse kurzzeitig, und zwar nur als verkürzten Hashwert für höchstens 10 Minuten.
> - **Zweck:** die Planung berechnen und anzeigen, einen Teilen-Link erzeugen und Ihre Anfrage bearbeiten.
> - **Rechtsgrundlage:** Art. 6 Abs 1 lit b DSGVO (Anfrage, vorvertragliche Maßnahme). Für die Missbrauchsabwehr Art. 6 Abs 1 lit f (berechtigtes Interesse an einem stabilen Betrieb).
> - **Speicherort und Empfänger:** Die Planung wird im Browser berechnet. Gespeicherte Planungen und Teilen-Links liegen auf unserem Server [Hoster – vom Unternehmen auszufüllen]. Kontaktdaten gehen wie in 5.1 an das Backoffice (Frappe/ERPNext). Die Drosselzähler liegen bei [Redis-Anbieter, Region – vom Unternehmen auszufüllen, Auftragsverarbeitung].
> - **Speicherdauer:** Gespeicherte Planungen, Bilder und Teilen-Links löschen wir nach 180 Tagen automatisch. Für die Anfrage selbst gilt die Frist aus 5.1.
> - **Teilen-Links:** Wer den Link kennt, kann die Planung sehen. Bitte tragen Sie keine persönlichen Daten als Plannamen ein.

### P2-3 Rate-Limiter über Redis

- `server/rateLimit.js` arbeitet ohne npm-Paket über die REST-Schnittstelle (Upstash-kompatibel, `POST {url}/pipeline` mit `SET k 0 PX <Fenster> NX` und `INCR k`). IPs gehen nur als SHA-256-Hash (22 Zeichen) nach Redis.
- Ist Redis nicht erreichbar (Fehler oder mehr als 800 ms), zählt der Arbeitsspeicher weiter. Das wird einmal geloggt, die Route bleibt erreichbar. Läuft der Produktions-Build ohne Redis, warnt das Log und Speichern/Teilen bleibt gesperrt (siehe P2-2).
- Grenzen unverändert: je 10 Speicherungen bzw. Links pro 10 Minuten und Client.

**Env-Variablen für den Livegang** (setzt der Betrieb, nicht im Repo):

| Variable | Zweck |
|---|---|
| `LABS_REDIS_REST_URL`, `LABS_REDIS_REST_TOKEN` (alternativ `UPSTASH_REDIS_REST_URL`/`_TOKEN`) | Geteilter Rate-Limit-Speicher, https Pflicht |
| `LABS_IP_HEADER` (z. B. `x-real-ip`; Küche liest ersatzweise `KUECHENPLANER_IP_HEADER`) | Client-IP vom eigenen Proxy |
| `SOFAPLANER_TTL_DAYS` (Standard 180) | Gültigkeit der Sofa-Teilen-Links |
| `KUECHENPLANER_SECRET`, `SOFAPLANER_SECRET` | Signatur der Links (bisher schon Pflicht) |
| `NEXT_PUBLIC_LABS_PLANER_SENDEN=1` | **Zuletzt** setzen, wenn der Datenschutz-Abschnitt online ist. Wirkt beim Build |

### Prüfung

- Unit-Tests: `node --test tests/unit/labs-kuechenplaner*.test.mjs tests/unit/labs-sofaplaner*.test.mjs src/components/Labs/Kuechenplaner/planState.test.mjs` ergibt 52/52. Neu ist `labs-kuechenplaner-release.test.mjs` mit 10 Tests.
- e2e (`--project=desktop`): 13/13. Neu: Auf beiden Planern erscheint ohne freigegebene Tabelle kein Betrag und kein Klammertext.
- `shoot.mjs` → `qa-screenshots/kuechenplaner/r2/fix/`: 12× 200, 0 Konsolenfehler, kein Überlauf.

## Runde 4 (Paket R4-portal-labs, 26.10.2026)

- **Fehlerfälle:** Plan speichern mit 15 s Zeitlimit (optional, die Anfrage geht trotzdem), Beratungsanfrage mit 25 s Zeitlimit → bei Zeitüberschreitung der deutsche Text „Unser System hat nicht rechtzeitig geantwortet …“, offline „Keine Verbindung zum Server …“ (`Labs/net.js`, `requestErrors.js`). Vorher blieb „Wird gesendet …“ ohne Antwort stehen. Ungültiger Freigabe-Code (`?k=%%%`, `?k=eyJ2IjoxfQ`) → 200 mit Standardplan, `POST /api/labs/kuechenplaner/plan` mit ungültigem Plan → 400.
- **Bundle:** zod über `../zod.js` statt ganzem Namensraum (siehe dreilaender-rechner.md, Runde 4). 3D (three.js/R3F) war bereits per `next/dynamic` nachgeladen.

## Runde 6 (Paket R6-portal-labs, 26.10.2026): stabile e2e-Tests

- **Ursache der roten bzw. flaky Tests** in `tests/e2e/labs-kuechenplaner.spec.js` (r5-fix: :42 rot, :62 und :147 flaky, dazu :96): Die Cookie-Leiste erscheint nach der Hydration, also genau dann, wenn die 3D-Szene startet. Im Headless-Chrome läuft WebGL in Software. Dort blockiert der Aufbau der Szene (Shader, 2048er-Schattenkarte, Environment, ContactShadows) den Haupt-Thread für Sekunden. Der Klick auf „Weiter ohne Einwilligung“ hing deshalb in „performing click action“ fest, bis das actionTimeout von 15 s ablief. Am Planer selbst lag kein Fehler. Auf echter GPU dauert das Kompilieren nur Bruchteile davon.
- **Behebung im Spec:** `open()` setzt vorab das Einwilligungs-Cookie „nur notwendige“, wie es `r4-shell` und `r5-shell-seo` tun. Die Leiste erscheint dadurch gar nicht, ein Klick entfällt. Tests ohne Bezug zur 3D-Ansicht (Formular, Fehlertexte, Preis, Layout) öffnen den Planer mit „Daten sparen“ (`navigator.connection.saveData`). Die Szene lädt dann erst auf Klick, wie es `Viewer.js` für echte Nutzer mit „Daten sparen“ vorsieht. Die Tests „ohne WebGL“ und „Kontextverlust“ laufen weiter mit 3D. `helpers.js` bleibt unverändert.
