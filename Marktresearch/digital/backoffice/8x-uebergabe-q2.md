# 8x – Übergabe Team Q2 (Motion, G-31) – Fundament v2 „Lounge“

**Stand:** 2026-11-04 · Auftrag MASTER § 4 G-31 · Maßstab `art-direction/lounge.md` § 8/9 (Inhaber-Entscheidungen Nr. 51/53), funktionale Regeln aus 04-motion.md und Q-H1…Q-H8, wo Lounge schweigt · Next 16.4.1 (`view-transitions.md` gelesen).
Ausgangslage: Ein früherer Lauf hatte die Grundlage nach 04-motion.md gebaut (ease-out, kein Federn außer Kanban). Dieser Lauf hat sie auf Lounge umgestellt und mit den Lounge-Bausteinen von P0-2 in `globals.css` abgeglichen.

## Gebaut

| Datei | Inhalt |
|---|---|
| `backoffice/src/app/bo-motion.css` | **Lounge-Federn** `--bo-feder` (ζ 0,72) / `--bo-feder-sanft` (ζ 0,9) als `linear()`, als Alias auf `--ease-feder`/`--ease-feder-weich` aus globals.css (eine Quelle, Werte identisch mit dem Entwurf), Ersatzkurven ohne `linear()`-Unterstützung; Dauern `--bo-dur-feder 620`, `-feder-kurz 420`, `-druck 80`, `-erscheinen 700`, `-wachsen 900`, `-haken 520` nach 220, `-zaehlen 900`, `--bo-staffel 30` (Kiosk 25). **Allgemeine Klassen** (für alles ohne eigenen Baustein): `.bo-druck` (+ `-rund/-klein/-flaeche/-traeger`), `.bo-staffel`, `.bo-erscheinen`, `.bo-panel`, `.bo-neu`, `.bo-anim-pop`, `.bo-gleiter`, `.bo-wachsen-y/-x`, `.bo-plus-dreh`, `.bo-ring-bogen`, `.bo-welle`. **Overlays mit Feder:** `dialog.bo-dialog` (Opazität 160 ms, Form federt), `dialog.bo-sheet` rechts / `[data-seite="unten"]`, `.bo-menue`, `.bo-toast`. Erfolgsmoment mit Häkchen (nach 220 ms in 520 ms), Scan als Ring statt Rahmen + Schütteln mit Feder, `data-markiert="ok"` (Packtisch „Gerade +1“). Seitenwechsel per View Transition: neue Seite steigt 12 px mit sanfter Feder auf. Bestehendes beibehalten (Listen, Kanban-Geist, Druck-Blatt, Subnav, VT-Kopfzeile, Browser-Zurück ohne Übergang). Reduzierte Bewegung: alle Feder-, Druck-, Haken-, Zähl- und Staffel-Dauern 0, Blenden ≤ 120 ms. |
| `backoffice/src/components/Backoffice/motion.js` | neu: `FEDER`, `FEDER_SANFT`, `DAUER.feder/federKurz/druck/erscheinen/wachsen/haken/hakenVerzoegerung/zaehlen/staffel`, Kurvennamen `"feder"`/`"feder-sanft"` in `animiere`, `staffel(i, ab)`, `useReduziert()`, `useHochzaehlen()` (beim Erscheinen von 0, danach vom alten Wert; nach hartem Laden nie, weil die Hydration erkannt wird; Kassa nie), `<ZahlHoch>`, `useGleiter()` (gleitender Indikator), `<Haken>`. Geändert: `SPRING` = Lounge-Feder, Kanban-Landung/FLIP 420 ms Feder, `eintritt` = Lounge-Aufstieg, `zwischenwert` quartisch mit `dez`. API unverändert kompatibel (Charts/Zahl.js nutzt `DAUER`, `reduziert`, `zaehle` weiter). |
| `backoffice/src/components/Backoffice/Demo/motion.js` | Demo neu im Lounge-Stil aus den P0-2-Bausteinen (`Kachel`, `Bento`, `Knopf`, `RundKnopf`, `PfeilKnopf`, `Segment`, `Schalter`): 20 Proben (Federkurven mit Abspielkugel, Druck-Feder + Feder-Pop, Kachel-Hover, Staffel, Segment, Pillen-Reiter mit `useGleiter`, Schalter, Zahl, Balken, Panel, Bezahlt-Sheet mit Häkchen, Liste, Dialog, Toast, Scan, Ablage, Seitenwechsel, Erfolgsmoment, Bon-Druck). Texte im `TEXTE`-Objekt. |
| `backoffice/tests/e2e/backoffice-motion.spec.js` | Token, Lounge-Federn (Wertgleichheit mit dem Entwurf), Dialog, Kanban/Toast, zwei Lounge-Tests an eingesetzten Proben (laufen ohne Demo-Route), zwei Tests zu reduzierter Bewegung, zwei Demo-Tests |
| `backoffice/src/app/layout.js` | unverändert: eine Zeile `import "./bo-motion.css";` |
| `backoffice/src/lib/backoffice/demo-register.js` | Eintrag `motion` besteht |
| `backoffice/src/components/Backoffice/README.md` | Abschnitt „Bewegung (Team Q2, G-31)“ neu, mit Arbeitsteilung zu P0-2 |

**Kollisionen mit P0-2 behoben:** Der erste Entwurf dieses Laufs hatte `.bo-kachel`-Hub, `.bo-pfeil`, `.bo-tip` und `.bo-schalter-*` in bo-motion.css, parallel zu den Bausteinen, die P0-2 gleichzeitig in globals.css angelegt hat. `.bo-tip { opacity: 0 }` hätte die Tooltip-Auslöser von P0-2 unsichtbar gemacht. Alles entfernt. Die Bausteine behalten ihre Bewegung in globals.css, bo-motion.css doppelt nichts.

## Tests

- E2E `backoffice-motion.spec.js`, Projekte desktop + ipad + reducedMotion: **16 bestanden, 4 übersprungen** (Demo-Tests: Route nicht eingebunden), 0 Fehler (Lauf mit eigenem `--output`, weil parallele Läufe anderer Teams `test-results/` leeren). In einem früheren Durchlauf war der Kanban-/Toast-Test auf ipad einmal „flaky“ (Toast „→“ nicht innerhalb von 10 s), beim Wiederholen grün. Betrifft Toast/Kanban eines anderen Teams.
- Die Wanduhr-Messung „Dialog sichtbar“ erlaubt jetzt drei gemessene Bilder Toleranz. Grund: Der headless-Browser liefert in der Geräte-Emulation nur alle 50–100 ms ein Bild, gemessen wurden auf ipad 390 ms. Isoliert gemessen ist der Dialog nach 170–210 ms sichtbar, mit und ohne Feder. Die feste Grenze von 200 ms prüft weiterhin die Opazitäts-Laufzeit laut Web Animations.
- `backoffice.spec.js` desktop: 9/9.
- Unit `node --test "tests/unit/**/*.test.mjs"`: 106/106 (keine eigenen Unit-Tests: `tests/unit/` liegt nicht im Schreibbereich).
- ESLint auf allen eigenen Dateien: 0.
- Sichtprüfung: Filmstreifen einer Lounge-Szene mit den echten Klassen (Animationen bei 0/60/160/300/700/1400 ms angehalten), hell und dunkel, neben die Lounge-Screenshots gelegt. Staffel, Balken, Panel, Sheet und Häkchen laufen wie im Entwurf, ohne Springen.

**Screenshot-Ordner:** `backoffice/qa-screenshots/q2-motion/` (Filmstreifen). Ein Lauf über `shoot.mjs` an der Demo ist erst möglich, wenn die Demo eingebunden ist.

## Offen

1. **Demo in `/einstellungen` einbinden** (Besitzer Team Zentrale/L0): `demoFuer(sp.baustein, { admin, modus })` → `(await demo.laden()).default` rendern, Snippet im Kopf von `demo-register.js`. Danach laufen die 4 übersprungenen Tests, und der Screenshot-Lauf (`--nur "einstellungen"`) kann folgen. **Die Demo ist dadurch visuell noch nicht gesichtet.**
2. **Seitenwechsel aktivieren** (Shell, P0-7): Inhalt von `<main>` in `<SeitenUebergang>` legen; `viewTransitionName` an der Leiste nicht setzen.
3. **globals.css (P0-2):** `dialog.bo-dialog[open]` und `::backdrop` mit `bo-pop-in`-Keyframes sind in bo-motion.css neutralisiert und können dort entfallen. Doppelte Staffel: `.bo-bento[data-einblenden]` (P0-2) und `.bo-staffel` (Q2) haben dieselben Werte. Bento bleibt bei P0-2, `.bo-staffel` dient Listen, Reise-Spalten und Produktkacheln. Bei „reduce“ setzt P0-2 Baustein-Übergänge auf 1 ms (wie Lounge § 8), Q2 lässt Blenden bis 120 ms stehen (Q-H6). Beides ist verträglich, eine gemeinsame Linie bestätigt L0.
4. **Anwender:** Toast.js → `.bo-toast` + Balken; Overlay/Sheet → `dialog.bo-sheet` (unten: `data-seite="unten"`) und `<Haken>`; Menüs → `.bo-menue`; Kanban → `lande()`; Kassa/Packtisch → `.bo-druck-klein`, `.bo-neu`, `.bo-anim-pop`, `.bo-ring-bogen`, `.bo-scan[data-ergebnis]`, `markiere(el, {ton: "ok"})`; Kundendisplay → `.bo-welle`, `.bo-neu`; KioskShell → `data-bo-kiosk` am Wurzelelement; Zentrale-Kennzahlen → `useHochzaehlen`/`ZahlHoch` oder Charts/Zahl (P0-2).
5. Unit-Tests für `stufe`, `staffel`, `nurOpazitaet`, `versatz`, `zwischenwert`, `kurve` brauchen eine Schreibfreigabe für `tests/unit/backoffice-motion.test.mjs`. `motion.js` enthält JSX, deshalb kommen die reinen Funktionen ggf. in eine eigene Datei.

## Abweichungen vom Konzept (Freigabe L0 erbeten)

- **Federn überall statt „Spring nur Kanban“ (Q-H5):** Lounge § 8 verlangt sie für Knöpfe, Indikatoren, Panels, Sheets und das Einblenden (Inhaber Nr. 51/53, Lounge gilt).
- **Staffel 30 ms (8 Stufen) beim Erscheinen statt 24 ms (3 Stufen) und nur nach Mount (Q-H4/Q-H5):** laut Lounge. Für nachträglich erscheinende Listeneinträge bleibt `stufe()` bei 3 Stufen.
- **Zahlen zählen beim Erscheinen (Lounge) statt nur bei Änderung (Q-H4):** gilt für In-App-Navigationen. Nach hartem Laden steht der Endwert sofort da (kein Springen nach der Hydration), die Kassa-Summe zählt nie. Inhaber-Frage Nr. 42.
- **Kiosk-Staffel 25 ms (Lounge-Kassa) statt ohne Staffel (Q-H7):** Bedienung wird nie blockiert, Hover gibt es im Kiosk ohnehin nicht.
- **Token-Werte:** `--bo-dur-spring` 420 statt 320 und `--bo-dur-draw` 520 statt 400, damit sie zu den Lounge-Federn und zum Häkchen passen; Schimmer 1,2 s (Lounge § 9.8).
- **Dialog:** Die Opazität bleibt bei 160 ms (sichtbar ≤ 200 ms, DoD), die Form federt 620 ms aus.
- **Reduzierte Bewegung:** Q-H6 (Blenden ≤ 120 ms) beibehalten statt Lounge „alle 1 ms“. Q-H6 ist strenger für Ortswechsel und bewahrt kurze Blenden zur Orientierung.

## Fähigkeiten

Keine Backend-Abhängigkeit, keine Fähigkeit nötig.

## Neue Fragen

- Inhaber: Nr. 41 (Seitenübergang sanft oder sofort), Nr. 42 (Zahlen bei jedem Seitenwechsel hochzählen) in 90-inhaber-fragen.md. Die im früheren Lauf genannte Nr. 25 steht dort nicht mehr (die Nummer ist anders belegt), Nr. 41 ersetzt sie.
- Steuerberater: keine.
