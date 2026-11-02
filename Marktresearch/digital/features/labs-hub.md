# Feature: Labs-Übersicht „Planen & Erleben“ und Feature-Schalter

**Stand:** 28.10.2026 · Team „Labs-Übersicht & Feature-Einbindung“ · Branch `feature/neuauftritt` (nicht committet)
**Seite:** `/de/labs` (nur `de`, `robots: noindex, nofollow`, andere Sprachen 404) · **Schalter:** `src/lib/features.js`

## Was gebaut ist

1. **Übersicht `/de/labs`** mit allen Features, gruppiert in *Planen · Erleben · Service*. Jede Karte hat ein Bild, einen Status, einen Titel-Link (die ganze Karte ist klickbar, ein Tab-Halt), eine Kurzbeschreibung und, wo nötig, einen Hinweis (z. B. „Richtwert, keine Steuerberatung“). Oben stehen Sprungmarken zu den Gruppen, unten „Lieber persönlich?“ mit dem einzigen gefüllten Knopf „Termin vereinbaren“. Das Raster hat höchstens 3 Spalten, mobil eine. Alles sind Server-Komponenten, es gibt **kein zusätzliches Client-JS**.
2. **Ein Schalter je Feature** (`src/lib/features.js`). Er steuert, ob das Feature in der Navigation, auf der Startseite und auf `/de/labs` erscheint. Die Feature-Seiten selbst bleiben unverändert.
3. **Navigation:** ein eigener Menüpunkt **„Planen & Erleben“** direkt nach „Leistungen“, mit Mega-Panel (Desktop) bzw. Akkordeon (mobil). Spalten: Planen / Erleben / Service, Link „Alle Werkzeuge im Überblick“ → `/de/labs`. Er erscheint nur auf Deutsch, weil alle Feature-Seiten deutsch sind. Yacht und Outdoor stehen weiter unter „Leistungen“. Im neuen Menüpunkt sind sie `shared`, damit sie die aktive Markierung nicht umhängen. Mit 8 Menüpunkten bekommen die Auslöser in `DesktopNav.js` weniger Innenabstand (`px-1 min-[1440px]:px-1.5 2xl:px-2` statt `px-2.5 2xl:px-4`; unter 1440 px sichtbar nur „Planen“, siehe Feinschliff fix2), sonst überlappt die Leiste bei 1280 und 1536 px Logo und Suche. Gemessen wurde eine Lücke von mindestens 11 px bei 1280, 1440, 1536 und 1920 px. Mit 7 Menüpunkten (Produktion ohne Schalter) bleiben die Klassen wie bisher.
4. **Startseite:** ein Abschnitt „Planen & Erleben – Vorab ausprobieren“ (Fläche `band`) direkt nach „Leistungen“, mit höchstens 4 Karten (Küchenplaner, Sofaplaner, AR-Viewer, Stil-Finder zuerst) und dem Link zur Übersicht. Ab 640 px zeigt er die Karten (Raster mit 2 bzw. 4 Spalten). **Mobil steht dort nur eine Linkzeile** („Planer und 3D-Ansichten ausprobieren →“, etwa 93 px). Grund: Die Startseite ist auf dem Pixel 7 auf einen Hauptinhalt unter 9 300 px begrenzt (`tests/e2e/r3-startseite.spec.js`). Mit Karten wären es 9 933 px gewesen, mit der Linkzeile sind es 9 186 px. Eingebunden ist er in `src/components/Home/Services.js` (die Datei `src/app/[locale]/page.js` bleibt unberührt).

## Features und Status

| Feature | Link | Status | Schalter |
|---|---|---|---|
| Küchenplaner Pro | `/de/labs/kuechenplaner` | Labs-Prototyp | `NEXT_PUBLIC_FEATURE_KUECHENPLANER` |
| Minotti-Sofaplaner | `/de/labs/sofaplaner` | Labs-Prototyp | `NEXT_PUBLIC_FEATURE_SOFAPLANER` |
| Stil-Finder | `/de/labs/stilfinder` | Labs-Prototyp | `NEXT_PUBLIC_FEATURE_STILFINDER` |
| Dreiländer-Rechner | `/de/labs/dreilaender` | Labs-Prototyp | `NEXT_PUBLIC_FEATURE_DREILAENDER` |
| AR-Viewer | `/de/labs/ar-viewer` | Labs-Prototyp | `NEXT_PUBLIC_FEATURE_ARVIEWER` |
| Yacht Interior | `/de/yacht-interior` | Online, nicht indexiert | `NEXT_PUBLIC_FEATURE_YACHT` |
| Outdoor & Garten | `/de/outdoor-gartenplanung` | Online, nicht indexiert | `NEXT_PUBLIC_FEATURE_OUTDOOR` |
| Ezarri-Welt | `/de/ezarri` (steht, noindex bis `EZARRI_PUBLIC`) | Beta | `NEXT_PUBLIC_FEATURE_EZARRI` |
| KI-Concierge | `/de/labs/concierge` | Beta | `NEXT_PUBLIC_FEATURE_CONCIERGE` |
| Handy-Upload | `/de/labs/upload-demo` | Beta | `NEXT_PUBLIC_FEATURE_UPLOAD` |
| Kundenportal | `/de/portal` | Beta | `NEXT_PUBLIC_FEATURE_PORTAL` |

Der Dreiländer-Rechner war nicht ausdrücklich gefordert. Er ist aufgenommen, weil die Seite existiert und sonst nirgends verlinkt ist. Mit `NEXT_PUBLIC_FEATURE_DREILAENDER=0` lässt er sich ausblenden.
Der Status beschreibt nur den heutigen Stand. „Öffentliche Seite“ (`live`) gilt nur für indexierte Seiten; erreichbare, aber nach Inhaber-Entscheidung noindex-Seiten (Yacht, Outdoor) tragen „Online, nicht indexiert“ (`online`, hohler Punkt), damit niemand sie für freigegeben hält (QA P2-2). Wird eine Seite indexiert, Status auf `live` stellen; ein Unit-Test prüft die noindex-Angabe beider Seiten. Die Texte enthalten keine Preise, keine Superlative und keine Händler-Aussagen; ein Unit-Test prüft das.

## Schalter – so schaltet der Inhaber frei

| Wert beim Build | Wirkung |
|---|---|
| `NEXT_PUBLIC_FEATURE_<NAME>=1` | an, auch im Produktions-Build |
| `NEXT_PUBLIC_FEATURE_<NAME>=0` | aus, auch im Dev-Server |
| nicht gesetzt | Dev-Server (`next dev`): **an** · Produktion (`next build`): **aus** |

- **Produktion ohne Schalter = exakt wie heute:** Es gibt keinen Menüpunkt und keinen Startseiten-Abschnitt (`HomeShowcase` rendert `null`), und `/de/labs` liefert 404. Die Navigation ist dann objektgleich mit vorher (`buildRooms` bekommt `labs: null`). Das prüft `tests/unit/labs-hub.test.mjs`.
- **Livegang einzeln:** Für jedes Feature einzeln `NEXT_PUBLIC_FEATURE_<NAME>=1` in die Build-Umgebung setzen (z. B. `.env.production` oder in der Deploy-Pipeline) und neu bauen. Sobald mindestens ein Feature an ist, erscheinen Menüpunkt, Abschnitt und Übersicht, jeweils nur mit den freigeschalteten Features.
- **Warum inline:** Next.js setzt `NEXT_PUBLIC_*` beim Build nur bei wörtlichem `process.env.NEXT_PUBLIC_…` ein (`node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`, „dynamic lookups will not be inlined“). Deshalb steht jeder Schalter in `features.js` einzeln ausgeschrieben. Der Unit-Test bricht ab, wenn jemand auf `process.env[name]` umstellt. Die Werte werden beim Build eingefroren, ein Umschalten braucht also einen neuen Build.
- Im Dev-Server zeigt jede Karte auf `/de/labs` den Namen ihres Schalters (`… =1`). In der Produktion ist diese Zeile ausgeblendet.
- **Unabhängig davon** gelten die Freigaben der Features selbst weiter, z. B. `NEXT_PUBLIC_LABS_PLANER_SENDEN` (Senden in den Planern), `NEXT_PUBLIC_CONCIERGE_SITEWIDE` (Concierge-Launcher) und `EZARRI_PUBLIC` (Ezarri-Seiten). Ein Feature-Schalter macht eine Seite nur sichtbar und schaltet keine dieser Funktionen frei. Vor `NEXT_PUBLIC_FEATURE_EZARRI=1` muss daher `/de/ezarri` live sein.

**Vor einem Freischalten in Produktion bitte beachten:** Die Labs-Seiten sind `noindex`. Ein Menüpunkt führt öffentliche Besucher dorthin, deshalb vorher die Auflagen der jeweiligen Feature-Doku klären (Datenschutz-Abschnitte, KI-Kennzeichnung, Bildrechte im AR-Viewer).

## Bilder (Rechte)

Die Kartenbilder sind **Bildschirmfotos der eigenen Oberflächen**, **eigene, im Code gezeichnete Grafiken** und **ein freigegebenes Ezarri-Bild** mit Quellenangabe. Es gibt keine KI-Bilder. Die Dateien liegen unter `public/labs/hub/*.webp` (1200 × 800, WebP, 7–55 KB).

| Karte | Bild | Quelle der Inhalte im Bild |
|---|---|---|
| Küchenplaner | `kuechenplaner.webp`: L-Küche im 2D-Grundriss | eigene Oberfläche und Geometrie |
| Sofaplaner | `sofaplaner.webp`: Connery-Ecksofa als Draufsicht im Raum | eigene Zeichnung aus Maßdaten, **kein Minotti-Bild** |
| AR-Viewer | gezeichneter Würfel mit Maßlinien auf Bodenraster (SVG `measure` in `FeatureVisual.js`) | eigene Grafik. Das frühere CC0-Beispielsofa passte nicht zur Marke (QA P2-1), Herstellermodelle haben noch keine Freigabe für diese Nutzung; `public/labs/hub/ar-viewer.webp` ist gelöscht |
| Dreiländer-Rechner | `dreilaender.webp`: eigene SVG-Karte | eigene Grafik |
| KI-Concierge, Handy-Upload, Kundenportal | `concierge.webp`, `upload.webp`, `portal.webp` | eigene Oberflächen (KI-Hinweis, QR-Karte der Demo, Anmeldung) |
| Yacht Interior | `yacht.webp`: gezeichnetes Boot aus dem Hero, ohne Text | eigene SVG-Bühne (kein Foto, kein KI-Bild) |
| Stil-Finder | gezeichnete Farbpaletten (SVG in `FeatureVisual.js`) | eigene Grafik; die Einstiegsfotos des Quiz sind Katalog- bzw. Herstellerbilder ohne Freigabe für diese Nutzung |
| Outdoor & Garten | gezeichnete Höhenlinien (SVG) | eigene Grafik; die Seite hat kein freigegebenes Foto (Bildregister `Landing/imagery.js`) |
| Ezarri-Welt | `/ezarri/gemma/anw-celestite-25-gemma-mosaic-pool-ezarri-1-1600.webp` (Hero-Bild der Ezarri-Welt), Credit „Bild: Ezarri, ezarri.com“ unter dem Bild | Ezarri. Händlervertrag und schriftliche Nutzungserlaubnis liegen laut Inhaber vor (Inhaber-Entscheidung Nr. 7, bestätigt 28.10.2026). Bild unverändert, nur per `object-fit` zugeschnitten. Keine Händler-Aussage auf der Karte (die steuert `EZARRI_PUBLIC` in der Ezarri-Welt) |

Die Bilder erzeugt `src/components/Labs/Hub/tools/shots.mjs` gegen den laufenden Dev-Server neu (`node src/components/Labs/Hub/tools/shots.mjs`). Ändern sich die Oberflächen, bitte neu aufnehmen.

## Feinschliff fix2 (QA-Feedback 28.10.2026)

- **P2-1** AR-Viewer: eigene Grafik statt Beispielsofa (siehe Bilder).
- **P2-2** neuer Status `online` „Online, nicht indexiert“ für Yacht und Outdoor.
- **P3-1** Ezarri: Status `beta`, Notiz „Seite entsteht gerade“ entfernt, freigegebenes Bild mit Credit (`image.credit`, gerendert in `FeatureCard.js`).
- **P3-2** `desktopCols(n)` in `features.js`: Gruppen mit 4 Karten nehmen auf dem Desktop 2 Spalten, sonst 3.
- **P3-3** Mobil-Zeile der Startseite schlanker (`pt-3 pb-1`, Überzeile `leading-4`, Link behält 44 px). Der E2E-Test misst den Hauptinhalt jetzt auf iPhone 15 Pro **und** Pixel 7 (< 9 300 px).
- **P3-4** E2E-Test für WCAG 1.4.12 (Textabstände) bei 1280 und 1440 px. Er fand echte Überlappungen bei 1280 px (Wohnen ↔ Logo, Das Haus ↔ Suche). Behoben: Mit 8 Punkten haben die Auslöser unter 1440 px nur 4 px Innenabstand, und „Planen & Erleben“ zeigt dort nur „Planen“ (`navShort`). Der Rest steht als `sr-only` im Knopf, der zugängliche Name bleibt „Planen & Erleben“ (WCAG 2.5.3). Ab 1440 px gilt der volle Name wie bisher.
- **P3-5** E2E: Statusprüfung mit sprechender Meldung vor jedem HTML-Vergleich, `test.setTimeout` für den Sprachen-Test. Erneut gelaufen: 10 bestanden, 1 übersprungen (Produktionsfall). Der WowStage-Fehler trat nicht mehr auf (`/de` liefert 200).

## Dateien

- `src/lib/features.js`: Schalter, Feature-Liste, `labsRoom()` für die Navigation
- `src/app/[locale]/labs/page.js`: Übersicht (noindex, nur `de`, 404 ohne Feature)
- `src/components/Labs/Hub/`: `LabsHub.js`, `FeatureCard.js`, `FeatureVisual.js`, `StatusBadge.js`, `HomeShowcase.js`
- `src/components/Navbar/shellNav.js` (`buildRooms({ …, labs })`), `navbar.js` (`labs: labsRoom(locale)`), `megaPanelHtml.js` (reicht `navShort` durch) und `DesktopNav.js` (dichter Abstand bei 8 Punkten, Kurzform unter 1440 px). Außerdem steht in `shellNav.js` jetzt `arbeitsweise` in `GERMAN_ONLY_FIRST_SEGMENTS`: Ein paralleles Team hat die deutschsprachige Seite `/de/arbeitsweise` angelegt, und ohne diesen Eintrag schlug `tests/unit/r6-shell-perf.test.mjs` fehl.
- `src/components/Home/Services.js`: bindet `HomeShowcase` ein
- Tests: `tests/unit/labs-hub.test.mjs` (Schalter, Produktion = unverändert, Texte, Einbindung) und `tests/e2e/labs-hub.spec.js` (Dev: Übersicht, Menü, Startseite, 404 in anderen Sprachen)

Neue npm-Pakete: keine. Prüfbilder: `qa-screenshots/feinschliff/labs-hub/selbst/`.

## Offen

- Eigene Fotos (Shooting) können die Bildschirmfotos später ersetzen.
- Für Ezarri ein freigegebenes Bild einsetzen, sobald die Ezarri-Seite steht.
- Der Inhaber entscheidet, welche Features zum Livegang freigeschaltet werden. Bis dahin ist in Produktion keines an.
