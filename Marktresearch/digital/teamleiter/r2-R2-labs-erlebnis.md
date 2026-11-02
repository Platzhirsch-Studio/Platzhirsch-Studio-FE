# R2-labs-erlebnis: AR-Viewer und Stil-Finder (Runde 2)

Stand 26.10.2026. Branch `feature/neuauftritt`, nichts committet. Details in `features/ar-viewer.md` und `features/stilfinder.md` (je Abschnitt „Runde 2“).

## Ergebnis

| Punkt | Status | Beleg |
|---|---|---|
| AR Auflage 1 (P1): Maße mobil | **erledigt**: 3 Labels auf iPhone und Pixel bei allen Modellen, dazu eine Maßleiste B/T/H; Hotspots sind bei Maßen aus | `qa-screenshots/ar-viewer/r2/interact/` |
| AR Auflage 2: Android | **Emulation ok**: `canActivateAR` true, AR-Button da, 0 Fehler. Blockade gefunden (hängende AVIF-Variante im Dev-Optimizer), Poster jetzt `unoptimized`. Scene Viewer nur auf echtem Gerät prüfbar | `r2/android-load.mjs`, shoot Android 200 |
| AR Punkt 4: React-Warnung | nicht reproduzierbar, Interaktionsläufe mit 0 Fehlern | `r2/warn-origin.mjs`, `interact/log.json` |
| AR Punkt 5: `_rsc`-Abbrüche | Ursache: Dev-HMR-Refresh (`next-hmr-refresh: 1`); `replaceState` ist bereits umgesetzt | `r2/rsc-initiator.mjs` |
| AR Punkt 6: Leerraum über der H1 | erledigt (Desktop 224 → 120 px) | `r2/measure-top.mjs` |
| AR Studio-HDR | offen (bräuchte eine HDR-Datei, Runde 3) | – |
| SF Punkt 4: Bodoni „W“ | **Ursache:** Der Font hat keine Kerning-Paare für W + Kleinbuchstabe (We/Wo/Wi = 0 gegenüber AV −10,6). Das ist global, deshalb nur dokumentiert, mit Lösungsvorschlag | `qa-screenshots/stilfinder/r2/bodoni*` |
| SF Punkt 7: Zähler | erledigt (`useLayoutEffect`, synchron) | `stilfinder/r2/interact/log.json` |
| SF Punkt 8: Mischbalken iPad / reduced motion | erledigt (SSR-Breite plus CSS-Animation) | `ipad-*-ergebnis.png` |
| SF Punkt 5: Warnung | eigener Hydration-Mismatch unter reduced motion behoben; verbleibend `SearchDialog` (Header) | `r2/hydration.mjs` |

## Prüfung
- `shoot.mjs` → `qa-screenshots/teamleiter/r2-R2-labs-erlebnis/selbst`: 12 von 12 mit Status 200, 0 Konsolenfehler, 0 fehlgeschlagene Requests, kein Überlauf (iPhone, Android, iPad, Desktop).
- eslint auf alle eigenen Dateien: sauber.
- `node --test tests/unit/labs-{arviewer,stilfinder}-r2.test.mjs`: 13 von 13 bestanden.
- `npx playwright test tests/e2e/labs-{arviewer,stilfinder}.spec.js --project=desktop`: 4 von 4 bestanden.
  - Nebenwirkung: Der Lauf schreibt in `qa-screenshots/teamleiter/tests-report`, so ist es in der Konfiguration festgelegt.

## Geänderte Dateien
- `src/components/Labs/ArViewer/{ArViewerApp.js,ModelStage.js}`
- `src/app/[locale]/labs/ar-viewer/page.js`
- `src/components/Labs/Stilfinder/{StilfinderQuiz.js,StilResult.js}`
- Neue Tests: `tests/unit/labs-arviewer-r2.test.mjs`, `tests/unit/labs-stilfinder-r2.test.mjs`, `tests/e2e/labs-arviewer.spec.js`, `tests/e2e/labs-stilfinder.spec.js`
- Prüfskripte: `qa-screenshots/{ar-viewer,stilfinder}/r2/*.mjs`
- Feature-Dokus

## Offen / an andere
- **Header-Team:**
  - Hydration-Mismatch `caret-color` in `SearchDialog` (WebKit).
  - Cookie-Banner verdeckt auf dem iPhone die halbe Bühne.
- **Layout/Fundament:** Bodoni-W-Kerning (Font patchen oder Display-Hilfe).
- **Dev-Server:** Neustart löst vermutlich die hängende AVIF-Variante. Danach im Produktions-Build prüfen, ob `/_next/image` mit AVIF stabil läuft.
- **Echte Geräte:** Quick Look, Scene Viewer, Schriftstärke in Safari.
- **Inhaber:** Bildrechte, Preise, Textfreigabe (Stil-Finder).
- **Optional:** Studio-HDR, Stil-Finder P3 Punkt 9/10.

## Nachbesserung nach Teamleiter-Feedback (Note 7/10)

| Punkt | Status | Beleg |
|---|---|---|
| P2-1 Konsolenfehler Android „state update … hasn't mounted yet“ | **behoben (Ursache beseitigt)**: Der Fehler trat nur zusammen mit Dev-HMR-Refresh (`_rsc`-Abbrüche) auf. Ursache war `next/image` mit `placeholder="blur"`, das nach `img.decode()` asynchron `setBlurComplete` aufruft und dabei eine verworfene, nie gemountete Fiber trifft. Jetzt wird die Unschärfe-Vorschau als CSS-Hintergrund ohne State gemalt (`Stilfinder/blurBackdrop.js`, Intro, Antwortbilder, Ergebnis-Hero). | `qa-screenshots/stilfinder/r2/android-warn.mjs` 12/12 Läufe ohne Fehler |
| P2-2 Maß-Labels blass, Linie durch „181 cm“ | **behoben**: Instrument Sans (`--font-sans`) statt Montserrat, 13 px/600, deckend weiß, Text #1f252b, kräftigere Kante. SVG-Maske spart jede sichtbare Label-Fläche (+4 px) aus den Maßlinien aus. | `qa-screenshots/ar-viewer/r2/fix/*-dims-*.png` |
| P2-3 „W elcher W ohnstil“ | **behoben (lokal)**: optisches Kerning `tracking-[-0.085em]` für W vor Kleinbuchstaben (`Stilfinder/kernW.js`), in der H1, den Fragetiteln („W ie groß“), „Wir legen …“ und im Ergebnis-Titel. Die globale Lösung bleibt bei Layout/Fundament. | `qa-screenshots/teamleiter/r2-R2-labs-erlebnis/fix/de-labs-stilfinder--iphone.png`, `stilfinder/r2/fix/*-frage7.png` |
| P2-4 Cookie-Banner verdeckt Bühne/Ergebnistitel (iPhone) | **offen, Header-Team**. Die Screenshots zeigen das Problem weiterhin. | `fix/*-iphone.png` |
| P3 Mischung 101 % | **behoben**: Rundung nach größtem Rest, Summe immer genau 100 %. | Unit-Test (2000 Codes), `stilfinder/r2/fix/q7-result.json` |
| P3 „[Preis vom Inhaber festzulegen]“ sichtbar | **behoben**: `range: null` und keine Preiszeile, solange der Inhaber keine Werte gesetzt hat. Es werden keine Preise erfunden. | `fix/*-frage7.png` |

### Prüfung (Fix)
- `shoot.mjs` → `qa-screenshots/teamleiter/r2-R2-labs-erlebnis/fix`: 12 von 12 mit Status 200, 0 Konsolenfehler, 0 fehlgeschlagene Requests, kein Überlauf.
- AR-Interaktion (`ar-viewer/r2/interact.mjs … r2/fix`): iPhone, Android und Desktop je 0 Fehler, 3 Labels pro Modell, die Maßleiste stimmt.
- Stil-Finder bis zum Ergebnis (`stilfinder/r2/q7-result.mjs`): iPhone und Android 0 Fehler, Mischung 100 %, kein Platzhalter.
- `node --test tests/unit/labs-{arviewer,stilfinder}-r2*.test.mjs`: 19 von 19. Neu sind `labs-arviewer-r2fix` und `labs-stilfinder-r2fix`.
- Playwright `labs-{arviewer,stilfinder}.spec.js --project=desktop`: 4 von 4. eslint sauber.

### Geänderte Dateien (Fix)
`ArViewer/{ArViewer.module.css,ModelStage.js}`, `Stilfinder/{StilfinderQuiz.js,StilResult.js,questions.js}`, neu `Stilfinder/{blurBackdrop.js,kernW.js}`, Tests, QA-Skripte unter `qa-screenshots/{ar-viewer,stilfinder}/r2/`.
