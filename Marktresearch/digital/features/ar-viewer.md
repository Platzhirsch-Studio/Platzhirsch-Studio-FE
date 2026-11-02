# Feature: 3D- & AR-Viewer für das ganze Sortiment (Labs)

**Stand:** 28.10.2026, Feinschliff nach QA R2 (siehe „Feinschliff: Restliste P2/P3 und Sortiments-Abdeckung“ am Ende) · **Seiten:** `/de/labs/ar-viewer` (Sortiment + Beispielmodelle) und `/de/labs/ar-viewer/<path_field>` (Produktseite), nur `de`, `noindex, nofollow`, andere Sprachen 404 · **Bauplan:** `03-produktpraesentation-3d-ar.md` (F4/F5) · **Quellen:** `ar-viewer-quellen.md`

## Was gebaut ist

- **3D-Viewer** auf Basis von `@google/model-viewer` 4.4: drehen (Ziehen), zoomen (zwei Finger/Mausrad), Pfeiltasten bei Fokus, „Ansicht zurücksetzen“. `touch-action="pan-y"`, damit man mit einem Finger normal weiterscrollen kann.
- **Laden erst bei Bedarf:** Im ersten Paint stehen nur ein Poster (WebP, `next/image`) und der Knopf „3D ansehen & drehen“. model-viewer und three.js (~250 KB gzip) kommen über `next/dynamic(..., { ssr: false })` erst nach dem Klick. Ein QR-Deep-Link (`?modell=<id>`) öffnet den Viewer direkt.
- **Galerie** mit 3 CC0-Beispielmodellen von Poly Haven: Sofa, Lounge-Sessel, Pendelleuchte. Überall als **„Beispielmodell“** gekennzeichnet, mit Hinweis „kein Produkt aus unserem Sortiment“ und Quellenangabe.
- **Farb-/Stoffvarianten** über `KHR_materials_variants` (`variantName`): Sofa in Anthrazit/Cognac/Taupe (Leder digital umgefärbt, Holz bleibt; nach QA gedämpft und auf drei Töne reduziert), Leuchte in Nickel/Messing/Schwarz. Der Sessel hat keine Varianten, weil Leder und Holz dort in einer gemeinsamen Textur liegen.
- **Maßanzeige:** Bemaßungslinien und Labels (cm) aus der Bounding Box des Modells (Muster aus dem model-viewer-Beispiel „dimensions“), dazu im Panel „B × T × H“ als Text. Beim Einschalten fährt die Kamera in eine feste 3/4-Ansicht von vorne rechts (`35deg 68deg`, Radius 138 % bzw. 155 % auf quadratischen/hochformatigen Bühnen), Auto-Rotate und Interaktions-Hinweis pausieren. Jede Linie gehört zu genau einem Label; beide werden gemeinsam ausgeblendet, wenn das Label nicht zur Kamera zeigt oder nicht vollständig in die Bühne passt.
- **Material-Hotspots** (nummeriert, mit Tastatur bedienbar, `aria-expanded`). Der Infotext steht unter dem Bild, damit er auf dem Handy das Modell nicht verdeckt. Als Alternative zur 3D-Ansicht gibt es eine Textliste („Materialien im Detail“).
- **AR „In meinem Raum ansehen“:** `ar-modes="webxr scene-viewer quick-look"`, `ar-scale="fixed"` (keine Verkleinerung, damit die Frage „passt es?“ ehrlich beantwortet wird) und `ar-placement` je Modell. Auf iOS erzeugt model-viewer das **USDZ automatisch** aus der GLB (`ios-src` bleibt leer, kann pro Modell gesetzt werden). Der AR-Knopf erscheint nur, wo AR verfügbar ist.
- **Desktop → Handy:** Dialog mit QR-Code (`qrcode`, lokal erzeugt) zum gleichen Modell – nur bei `(pointer: fine) and (hover: hover)`. Auf Touch-Geräten steht stattdessen, wo der AR-Button erscheint bzw. in welchem Browser AR geht.
- **Mobil-Layout:** Unter `lg` werden die beiden Spalten per `display: contents` aufgelöst und neu sortiert: Bühne (quadratisch) → Farben, „Maße“, „Material-Infos“, AR-Hinweis inkl. Datenschutz → Galerie → Name, Hinweise, Materialliste. So sieht man die Wirkung eines Tipps sofort. Ab `lg` sticky Panel rechts.
- **Fallbacks:** ohne WebGL oder bei einem Ladefehler bleibt das Poster stehen, mit einem Hinweis und einer Einladung in den Showroom. Fortschrittsbalken (`progress`-Event) mit `role="status"`.
- **Barrierefreiheit:** `prefers-reduced-motion` schaltet Auto-Rotate und die Hand-Animation ab. Varianten sind echte Radio-Buttons, Toggle-Knöpfe nutzen `aria-pressed`, Fokusrahmen in `gold-text`. Bei 375 px gibt es kein horizontales Scrollen (geprüft).
- **Analytics:** `view_3d`, `select_variant_3d` und `ar_start` über `trackEvent` aus `src/lib/analytics.js` (nur mit Consent, sonst ohne Wirkung).
- **DSGVO:** Draco- und KTX2-Decoder liegen selbst gehostet unter `public/labs/ar-viewer/decoders/`. Geprüft: Beim Laden gibt es keine Anfragen an Fremd-Hosts (kein gstatic).

## Dateien

| Pfad | Zweck |
|---|---|
| `src/app/[locale]/labs/ar-viewer/page.js` | Server Component: Metadata (noindex), Locale-Guard, Texte, lädt Modelle über den Adapter |
| `src/components/Labs/ArViewer/ArViewerApp.js` | Client: Galerie, Poster/Aktivierung, Panel (Varianten, Maße, Hotspot-Liste, AR-Hinweise), QR-Dialog, WebGL-Erkennung |
| `src/components/Labs/ArViewer/ModelStage.js` | Client, dynamisch: `<model-viewer>`, Hotspots, Bemaßung, Varianten, AR-Events, Decoder-Pfade |
| `src/components/Labs/ArViewer/ArViewer.module.css` | Hotspot- und Bemaßungs-Styles (`data-visible`) |
| `src/components/Labs/ArViewer/data/catalog.js` | Beispielkatalog (Modelle, Varianten, Hotspots) |
| `src/components/Labs/ArViewer/data/source.js` | Adapter: zod-Schema, Frappe-Stub, lokaler Dev-Speicher |
| `src/components/Labs/ArViewer/tools/build-models.mjs` | Packt glTF → GLB, komprimiert Texturen, fügt Varianten ein, berechnet Hotspot-Punkte, erzeugt Poster |
| `public/labs/ar-viewer/models/*.glb` | Sofa 0,61 MB · Sessel 0,57 MB · Leuchte 1,07 MB |
| `public/labs/ar-viewer/posters/*.webp` | Poster (Poly-Haven-Renderings, CC0) |
| `public/labs/ar-viewer/decoders/{draco,basis}/` | Decoder aus `three/examples/jsm/libs` (Apache-2.0) |
| `public/labs/ar-viewer/README.md` | Lizenzen und Quellen |

## Architektur

```
page.js (Server) ── getArModels() ──► source.js ──► [Frappe: später] → .data/ar-viewer/models.json (Dev) → catalog.js
   │                                               (alle Einträge durch ArModelSchema/zod)
   └─► ArViewerApp (Client, leicht) ── Klick ──► next/dynamic(ModelStage, ssr:false) ──► @google/model-viewer + three
```

## Datenmodell (`ArModelSchema`)

`id`, `name`, `category`, `src` (.glb/.gltf), `iosSrc` (.usdz | null), `poster`, `posterAlt`, `dimensionsCm {w,d,h}`, `arPlacement` (floor|wall), `cameraOrbit`, `credit {author,url} | null`, `shadowIntensity` (0–2, Standard 1; 0 für hängende Objekte), `arNote` (sichtbarer Hinweis am AR-Block | null), `variants[] {variant, label, swatch, note}`, `hotspots[] {id, title, text, position "x y z", normal "x y z"}`, `sample` (bool, Standard true).
Erlaubte Asset-URLs sind nur eigene Pfade (`/labs/ar-viewer/…`, `/cmx/…`) oder `https://backoffice.platzhirsch.studio/files/…`.

**Lokaler Dev-Speicher:** `.data/ar-viewer/models.json` (gitignored, wird nur außerhalb von production gelesen; beim ersten Lauf als leeres Array `[]` angelegt) enthält ein JSON-Array mit Einträgen im selben Schema. Eine vorhandene `id` überschreibt den Katalogeintrag, neue `id`s werden angehängt, ungültige Einträge werden mit Warnung übersprungen. So lassen sich Herstellermodelle lokal testen, ohne dass Code geändert werden muss.

## Anbindung Frappe (später, nur lesend)

Heute gibt es kein 3D-Feld und keinen Schreibzugang. Vorschlag für das Backoffice-Team:
1. **Neuer Doctype „Produkt 3D Modell“** (oder eine Child Table am Produkt) mit diesen Feldern: `produkt` (Link), `glb` (Attach), `usdz` (Attach, optional), `poster` (Attach Image), `ar_placement` (Select floor/wall), `freigabe_hersteller` (Check) + `freigabe_datum` + `freigabe_dokument` (**Pflicht vor Veröffentlichung**), Tabelle `varianten` (variant, label, swatch, note), Tabelle `hotspots` (title, text, position, normal).
2. **Lesen:** `GET /api/resource/Produkt 3D Modell?filters=[["produkt","=",…]]&fields=[…]`. Alternativ wird `get_produkt_by_path_field_api` um einen Block `model_3d` erweitert (`pdf_produkte` liefert bereits Anhänge).
3. **Dateien:** über den `/cmx`-Proxy (dort `.glb` → `model/gltf-binary`, `.usdz` → `model/vnd.usdz+zip` freischalten) oder über ein CDN mit `Cache-Control: immutable`.
4. In `source.js` wird nur `fetchFromFrappe()` implementiert. Das Schema bleibt gleich.

## Herstellerdaten einbinden (Pipeline)

Quelle: `Herstellermaterial/` (lokal, gitignored). Vor jeder Veröffentlichung muss eine **schriftliche Freigabe** der Marke vorliegen.

1. **Konvertieren:** FBX/OBJ/3DS in Blender importieren, Maßstab prüfen (1 Einheit = 1 m), Y-up, Boden bei y = 0, Vorderseite +Z. Danach als glTF-Binary (`.glb`) exportieren. Reine `.max`/V-Ray-Dateien muss der Hersteller exportieren.
2. **Optimieren mit gltf-transform** (`npx @gltf-transform/cli`, nicht im Projekt installiert, nur auf dem Arbeitsplatz):
   ```
   gltf-transform optimize in.glb out.glb --compress draco --texture-compress webp --texture-size 2048
   # oder Meshopt statt Draco:  --compress meshopt
   # KTX2 (GPU-Texturen, kleiner im VRAM): gltf-transform uastc / etc1s (benötigt KTX-Software „toktx“)
   gltf-transform inspect out.glb      # Budget prüfen: Ziel ≤ 3 MB, max. 6 MB
   ```
   Draco und KTX2 dekodiert der Viewer mit den selbst gehosteten Decodern. Für Meshopt müsste zusätzlich `ModelViewerElement.meshoptDecoderLocation` auf eine selbst gehostete Datei gesetzt werden. Daher vorerst **Draco** verwenden.
3. **Varianten:** Stoffe/Leder als eigene Materialien mit `KHR_materials_variants` anlegen (Blender-Add-on „glTF Material Variants“ oder Skript). Die Namen müssen den `variant`-Werten im Datensatz entsprechen.
4. **Prüfen:** Khronos glTF-Validator, model-viewer Editor (modelviewer.dev/editor; dort lassen sich auch Hotspot-Positionen abgreifen), Test auf einem echten iPhone und einem Android-Gerät.
5. **USDZ:** Optional ein eigenes USDZ (Blender USD-Export), wenn die automatische Konvertierung auf iOS nicht gut aussieht. Dann `iosSrc` setzen.
6. **Ablage:** zum Testen in `public/labs/ar-viewer/models/` und als Eintrag in `.data/ar-viewer/models.json`, später im Backoffice.

## QA-Runde 1 – umgesetzt

| Punkt | Umsetzung |
|---|---|
| P1-1 H1 unter dem Header | `pt-28 md:pt-40 lg:pt-56` (wie `labs/dreilaender`). Gemessen (alter Header): iPhone H1 y=136 bei Header 81, Desktop y=248 bei Header 165. Mit dem neuen, schmaleren Header (57/73 px) ist der Abstand groß; falls der Header so bleibt, alle Labs-Seiten gemeinsam auf z. B. `lg:pt-40` angleichen. |
| P1-2 Maße abgeschnitten | Feste 3/4-Kamera mit Rand, Label-Clamping (ausblenden, wenn nicht ganz in der Bühne), Linie + Label gemeinsam, fehlende Zuordnung der oberen Breitenlinie (`dim+Y-Z`) ergänzt, Turntable aus. Robust auch beim Modellwechsel mit aktiven Maßen und wenn die Bühne außer Sicht ist (model-viewer verschluckt dort Orbit-Änderungen → erneutes Setzen per IntersectionObserver, Abbruch bei Nutzer-Interaktion). |
| P2-1 Touch-Ziele | Hotspots 32 px sichtbar, 46 px Trefferfläche (`::before`); `summary` `min-h-11`; Links `-my-3 py-3`; Toggle-Buttons `min-h-11`. QA-Skript meldet keine Ziele < 44 px mehr (außer Fließtext-Links mit 44 px Höhe). |
| P2-2 Farbwechsel unsichtbar | Steuerleiste direkt unter der Bühne (siehe Mobil-Layout); ein Farbtipp vor „3D ansehen“ lädt das Modell gleich in der Farbe. |
| P2-3 QR auf dem Handy | QR-Button nur Desktop; Touch: „Nach ‚3D ansehen‘ erscheint …“ bzw. „AR ist in diesem Browser nicht verfügbar – Safari (iPhone/iPad) bzw. Chrome (Android)“. |
| P2-4 Leuchte | Badge „Beispielmodell · CC0“ als Zeile über der Bühne (verdeckt nichts mehr); `shadowIntensity: 0`; sichtbarer Hinweis `arNote` unter dem AR-Text. |
| P2-5 AR-Button bricht um | `whitespace-nowrap`, `px-4 sm:px-5`, `bottom-5`, `min-h-11`. |
| P2-6 Hotspot-Verdeckung | Normale Sitzkissen `0 0.5 0.866` (vorne-oben); verdeckte Hotspots `opacity: .15`, `pointer-events: none`. |
| P2-7 leere Bühne | Mobil `aspect-square` statt 4:5. |
| P2-8 Farbvarianten | Neu gebaut (`build-models.mjs`): Cognac `[96,60,38]`, Kontrast der Leder-Struktur 0,35 statt 0,7; Salbei/Sand ersetzt durch Taupe. GLB Sofa jetzt 0,61 MB. |
| P2-9 dünne Schrift | Hinweise auf `/75`, `text-[13px]` mobil. Globale Schrift-Darstellung in WebKit → Layout-Team. |
| P3 | Ladezustand beim Farbwechsel (`variant-applied`, pulsierendes Farbfeld + Linie oben); Galerie: einheitlicher Hintergrund, aktive Kachel mit Rahmen + Gold-Unterstrich, `loading="eager"`; Fallback ohne WebGL mit Link „Beratung im Showroom vereinbaren“; `exposure 0.9`; Seed `.data/ar-viewer/models.json` (`[]`) wird beim ersten Lauf angelegt; Datenschutzhinweis steht direkt am AR-Block. |

## Offene Punkte

- **Echtes iPhone/Android:** Quick-Look-Button nach dem Laden, Scene Viewer, Schriftstärke in Safari – nur auf echten Geräten prüfbar (Playwright-WebKit hat kein `canActivateAR`).
- **React-Warnung** „Can't perform a React state update on a component that hasn't mounted yet“: in einem frischen WebKit-Lauf ohne laufende HMR-Updates nicht reproduzierbar (0 Fehler auf `/de`, `/de/labs/dreilaender`, `/de/labs/ar-viewer`); tritt offenbar bei Hot-Reloads des Dev-Servers auf. In Produktion prüfen.
- **RSC-Request beim Modellwechsel** (`?_rsc=…` abgebrochen): `history.replaceState` übergibt jetzt `history.state` weiter; ein Server-Rerender wird nicht ausgelöst. Bei Übernahme auf Produktseiten erneut prüfen.
- Globale Sticky-Leiste „Anrufen / Termin anfragen“ kann den AR-Button verdecken, wenn die Bühne ganz unten im Viewport steht (Layout-Team).
- **Android-Test (Pixel 7, Chromium):** Im Dev-Server erreicht die Seite den Zustand `load` nicht (bleibt `interactive`). Das gilt genauso für `/de/labs/dreilaender`, betrifft also die ganze Website und nicht dieses Feature. Darum fehlen für Runde 2 die Android-Screenshots; iPhone, iPad und Desktop sind geprüft (`qa-screenshots/ar-viewer/fix/`).
- Glanzlichter Sessel: `exposure` gesenkt; ein eigenes, lokal gehostetes Studio-HDR (`environment-image`) wäre der nächste Schritt.

- **Echte Modelle:** Es fehlen Freigaben und Dateien der Marken. Die Platzhalter sind bewusst keine Markenprodukte.
- Test auf **echten Geräten** (iOS Quick Look mit Auto-USDZ, Android Scene Viewer, WebXR) steht noch aus. Headless-Chromium hat 3D, Varianten, Maße, Galerie, Fallback ohne WebGL und 375 px geprüft.
- Pendelleuchte: model-viewer kennt kein `ceiling`. In AR steht die Leuchte deshalb am Boden (als Größenvergleich) – steht jetzt sichtbar auf der Seite (`arNote`).
- `Permissions-Policy` in `next.config.js` (anderes Team): WebXR braucht `xr-spatial-tracking` (Standard ist `self`, also ok). Falls sie später explizit gesetzt wird: `xr-spatial-tracking=(self)`.
- Cache-Header für `.glb/.usdz` (`immutable`) fehlen in `next.config.js` und sollten bei der Übernahme auf Produktseiten ergänzt werden.
- JSON-LD `Product.subjectOf` (`3DModel`) erst auf echten Produktseiten einsetzen, nicht in Labs.
- Übernahme auf Produktseiten: Mit dem Medien-Slot `model3d` in `productGallery.js` lassen sich `ArViewerApp`/`ModelStage` wiederverwenden.

## Rechtliches

- **Lizenzen:** Die Modelle und Poster sind CC0 1.0 (Poly Haven). Autor und Link werden trotzdem genannt (`public/labs/ar-viewer/README.md`, Panel). Die Decoder stehen unter Apache-2.0.
- **Keine Händler- oder Produktbehauptungen:** Die Kennzeichnung „Beispielmodell“ steht im Bild, im Panel und im Intro. Preise werden nicht gezeigt.
- **Datenschutz:** Ohne Klick wird nichts geladen. Alle Dateien kommen vom eigenen Server, und Decoder werden nicht von Google geladen. Es gibt keine Uploads und keine personenbezogenen Daten. Auf Android öffnet AR den Google Scene Viewer, der die Modelldatei von Google-Diensten abrufen lässt. Darauf weist der AR-Block direkt unter der Bühne hin (vor dem Tippen auf den AR-Button), mit Link zur Datenschutzerklärung. **To-do Datenschutzerklärung:** einen Absatz zu „3D/AR-Ansicht (Google Scene Viewer / Apple AR Quick Look)“ ergänzen.
- **KI-Kennzeichnung:** nicht nötig, weil keine KI-generierten Inhalte vorkommen. Die Farbvarianten sind algorithmisch umgefärbt und als „digital umgefärbt“ gekennzeichnet.
- Für Herstellerdaten gilt: Online-Darstellung nur mit schriftlicher Freigabe (siehe Datenmodell im Backoffice, Feld `freigabe_hersteller`).


## Runde 2 (Paket R2-labs-erlebnis, 26.10.2026)

**Umgesetzt**
- **Auflage 1 (P1) Maße im Hochformat:** Die eigentliche Ursache war, dass die Labels veraltet berechnet wurden. Nach einem Modellwechsel unterhalb der Bühne zeichnet model-viewer im Off-Screen nicht, und Linien und Labels behielten ihren Zustand („aus“). Jetzt wird bei Sichtbarkeit neu gezeichnet (IntersectionObserver mit Schwellen 0/0,5/0,9). Die Kamera wird auch nach Ablauf der Wiederholungen nachgezogen, solange der Besucher nicht selbst dreht. Schmale Bühnen (< 500 px) nutzen Radius 175 % (`max-camera-orbit` bei aktiven Maßen 200 %).
  - Ergebnis: iPhone und Pixel 7 zeigen bei Sofa, Sessel und Leuchte alle 3 Labels (`qa-screenshots/ar-viewer/r2/interact/*-02-dims-*.png`).
  - Zusätzlich gibt es eine **Maßleiste** „Breite / Tiefe / Höhe“ unter der Bühne (`data-testid="arv-dims-bar"`, `aria-live`). Sie ist immer lesbar und gleichzeitig die zugängliche Variante der Canvas-Labels, die `aria-hidden` sind.
  - Bei aktiven Maßen sind die Material-Hotspots ausgeblendet (vorher überlappte „181 cm“ den Hotspot 2).
- **Punkt 6 Leerraum:** `pt-16 md:pt-24 lg:pt-28` statt `pt-28/40/56`. Desktop: Eyebrow 120 px unter dem Header statt 224 px. Sticky-Panel `lg:top-28`.
- **Poster `unoptimized`:** Die Poster sind vorab skalierte WebP-Dateien (17–77 KB) und dieselben Dateien, die model-viewer als `poster` lädt. Damit gibt es pro Poster einen gecachten Request statt zusätzlicher Optimizer-Varianten.

**Untersucht, ohne Codeänderung**
- **Punkt 5 `_rsc`-Abbrüche:** Die Requests tragen den Header `next-hmr-refresh: 1`. Es sind HMR-Refreshes des Dev-Servers, ausgelöst durch Dateiänderungen paralleler Teams. Ein späterer Refresh oder Router-Sync bricht sie ab. Der Modellwechsel nutzt bereits `history.replaceState` ohne Navigation. In Produktion entstehen diese Requests nicht. Beleg: `r2/rsc-initiator.mjs`.
- **Punkt 4 React-Warnung:** In 3 WebKit-Varianten nicht reproduzierbar (laden / Cookie / 3D starten, `r2/warn-origin.mjs`). Interaktionsläufe auf iPhone, Android und Desktop: 0 Konsolenfehler.
  - Die einzige verbleibende WebKit-Meldung ist ein Hydration-Mismatch `caret-color` in `SearchDialog` im Navbar. Das betrifft das Header-Team.
- **Android (Auflage 2, Teil Emulation):** Ursache für „Pixel 7 lädt nicht“ gefunden. Der Dev-Image-Optimizer hängt bei genau einer AVIF-Variante (`mid_century_lounge_chair.webp`, `w=384`).
  - curl mit `Accept: image/avif` bricht nach 60 s ab. sharp kodiert dieselbe Datei direkt in 83 ms, alle anderen Varianten in 2–3 s.
  - Vermutlich ein festhängender In-Flight-Eintrag im Dev-Server. Ein Neustart des Dev-Servers sollte ihn lösen; das ist im Produktions-Build zu prüfen.
  - Mit `unoptimized` ist die Seite davon unabhängig: `shoot.mjs` Android 200.
  - In der Emulation geprüft:
    - `canActivateAR` true, AR-Button sichtbar
    - Maße und Modellwechsel
    - 0 Fehler
  - **Grenzen:** Der Scene-Viewer-Intent, ARCore, die echte Kamera und WebXR lassen sich nicht emulieren. Dafür bleibt ein echtes Gerät nötig.
- **Studio-HDR:** Nicht umgesetzt. Der Standard von model-viewer 4.4 ist bereits `neutral`. Ein Studio-HDR bräuchte eine lokal gehostete HDR-Datei (CC0, etwa 1–2 MB) als `environment-image`; das bleibt für Runde 3. Die Glanzlichter am Sessel bleiben leicht speckig.

**Tests:** `tests/unit/labs-arviewer-r2.test.mjs` (Katalog, Budgets: GLB < 1,5 MB, Poster < 100 KB; Maßleiste, Hotspots, Lazy-3D), `tests/e2e/labs-arviewer.spec.js` (kein 3D ohne Klick; Pixel-Viewport: B/T/H, Hotspots aus, Modellwechsel).

**Offen:** Echte Geräte (Quick Look, Scene Viewer). Der Cookie-Banner verdeckt auf dem iPhone die halbe Bühne (global). Der 3D/AR-Absatz in der Datenschutzerklärung fehlt (Recht/Layout).

### Runde 2, Nachbesserung (Teamleiter-Feedback P2-2)
- Die Maß-Labels nutzen jetzt die Seitenschrift Instrument Sans (`--font-sans`) statt der Legacy-Schrift Montserrat: 13 px, Gewicht 600, deckend weiß, Text #1f252b. Die Hotspots haben ebenfalls die neue Schrift.
- Die Maßlinien laufen nicht mehr durch die Labels. Eine SVG-Maske spart bei jedem sichtbaren Label eine Fläche mit 4 px Rand aus und wird bei jedem Zeichnen mitgeführt.
- Tests in `tests/unit/labs-arviewer-r2fix.test.mjs`, Belege in `qa-screenshots/ar-viewer/r2/fix/`.

## Runde 4 (Paket R4-portal-labs, 26.10.2026): Studio-HDR, Bundle

- **Studio-HDR (Abnahme P3-8):** Eigene, rechnerisch erzeugte Studio-Umgebung (`ArViewer/studioHdr.js`): warmgraue Hohlkehle, große weiche Lichtwanne vorne links, Aufheller rechts, Deckendiffusor, schwaches Gegenlicht. Keine Drittquelle, keine Lizenzfrage. Ausgeliefert als Radiance-RGBE (256 × 128, 131 KB, flache Zeilen) unter `/api/labs/ar-viewer/studio-v1.hdr` (statisch beim Build, `immutable`, `noindex`). Die Version steht im Pfad, weil model-viewer HDR nur an der Endung `.hdr` erkennt.
- `ModelStage` lädt das HDR vor (Zeitlimit 6 s) und setzt erst dann `environment-image`. Bis dahin, offline oder bei Fehler bleibt `neutral` mit `exposure 0.9`, ein fehlendes HDR löst nie den Modell-Fehler aus. Mit HDR `exposure 1`.
- Ergebnis: Die Glanzlichter am Leder-Sessel sind breit und ruhig statt speckig. Vergleich: `qa-screenshots/teamleiter/r4-portal-labs/hdr/*-studio.png` und `*-blocked.png`.
- **Bundle:** 3D (model-viewer, three.js) war bereits per `next/dynamic` erst nach „3D ansehen“ geladen. Seite selbst: 7 KB gzip über dem Layout.
- **Fehlerfall WebKit (R4):** Ein abgebrochener `.glb`-Abruf löst in WebKit kein `error`-Ereignis von model-viewer aus; die Bühne blieb ohne Hinweis. `ModelStage` hat jetzt einen Wächter: `offline`-Ereignis vor dem Laden oder 30 s ohne `progress` → „Das Modell konnte nicht geladen werden.“ (iPhone und Desktop geprüft, `qa-screenshots/teamleiter/r4-portal-labs/errors*/`).


## Ausbau 27.10.2026: ganzes Sortiment, drei Stufen

### Ergebnis
- **Sortiment:** `/de/labs/ar-viewer` zeigt alle aktiven Katalogprodukte live aus dem Backoffice (1.760 Produkte aus 22 Marken). Die Daten kommen nur per GET über die bestehenden Fetcher, mit 1 h Data Cache.
  - Suche über Name, Marke und Kategorie, tolerant bei Akzenten und ß.
  - Filter Marke, Kategorie und Darstellung (Stufe), jeweils mit Zählern.
  - 24 Karten pro Seite, serverseitig gefiltert. An den Browser gehen nur diese 24 Karten, die Bilder laden lazy über `/cmx` und `next/image`.
  - Ohne JavaScript ist es ein normales GET-Formular. Mit JavaScript greifen die Filter sofort (`router.replace`, Suche 350 ms entprellt).
  - Produkte mit Ansicht im Raum stehen oben. Die CC0-Beispielmodelle bleiben darunter als „Stufe 1 in Aktion“.
- **Produktseite des Viewers** `/de/labs/ar-viewer/<path_field>`, eine je Produkt:
  - Stufen-Kennzeichnung mit Icon und Text, „Stufe n von 3“ und Erklärung.
  - Bühne je Stufe, Umschalter „AR-Foto / Fotos (n)“.
  - Maßleiste nur mit Herstellermaßen und Link zum Datenblatt, sonst „Maße fehlen“. Der Katalog-Freitext steht getrennt als „Angabe im Katalog“ (nicht abgeglichen, nicht für AR verwendet).
  - „In meinem Raum ansehen“ über model-viewer: WebXR, Scene Viewer, Quick Look mit automatisch erzeugtem USDZ, `ar-scale="fixed"`.
  - Hinweise zur Raum-Kalibrierung (`RoomTips`) und „Was als Nächstes kommt“ (Ausblick aus der Inventur).
  - Links zur Shop-Produktseite und zur Beratung.
- **QR-Übergabe neu** (`PhoneHandoff.js`), nur bei feinem Zeiger (Desktop):
  - Zweispaltiger Dialog. Der QR-Code wird lokal als SVG erzeugt (`qrcode`, Fehlerkorrektur Q), mit Produkt-Miniatur in der Mitte und Sucher-Eckmarken.
  - Drei Schritte und „Link kopieren“ mit Rückmeldung.
  - Auftritt in 280 ms (`ease-quiet`), bei reduced motion nur ein Fade.
- **Stufen** (`src/lib/arviewer/stage.js`, rein, getestet):
  1. **Echtes 3D & AR:** nur aus `models3d.json` und nur mit schriftlicher Freigabe.
     - Heute gilt das für **0 Katalogprodukte**. In `Herstellermaterial/` liegt keine 3D-Datei (`scripts/arviewer/optimize-models.mjs` meldet 0), und keine Marke hat freigegeben.
     - 914 Produkte zeigen stattdessen den Ausblick „Herstellermodell gefunden (Format) …“ bzw. „Marke bietet 3D an, Zuordnung offen“.
  2. **AR-Foto in Originalgröße:** ein GLB aus zwei Teilen.
     - Senkrechte Foto-Fläche: freigestelltes PNG mit Alpha, unbeleuchtet (`KHR_materials_unlit`), Kern-glTF.
     - Grundfläche B × T am Boden, mit Haarlinie und weichem Kontaktschatten. Exakt ist nur die Grundfläche.
     - Das Foto ist auf die Herstellerhöhe skaliert, aber mindestens 90 % der längsten Grundseite breit. Grund ist die Perspektive: Bei Aufsicht wirkt das Bild höher, Liegen sind mit aufgestellter Lehne fotografiert.
     - Lange Möbel (T > 1,5 × B) werden längs gelegt.
     - Kamera auf ±60° begrenzt (nie Kantenansicht), kein Auto-Rotate, kein Schatten der Fläche.
  3. **Bildansicht:** Herstellerfotos unverändert (`object-contain`, kein Zuschnitt), Galerie mit Vorschaubildern.
- **Rechte-Register** `src/lib/arviewer/rights.json`: je Marke `veraenderung` (ja/nein/unklar) mit Beleg und Quelle.
  - `nein` (Minotti, Poliform, Sifas, Umbrosa, Treca, Brand van Egmond, Bullfrog, Qeeboo, Gloster, Frost, Next125, Schüller, Pomax, Baobab): öffentlich nur Stufe 3, Stufe 2 nur mit `ARVIEWER_INTERN=1`. Freistellungen landen dann ausschließlich in `.data/ar-viewer/intern/` und nicht im Register.
  - `unklar`: Stufe 2 nur in den Labs, mit dem Hinweis „Freigabe ausstehend“.
  - `ja`: öffentlich. Das gilt heute für keine Marke.
- **Maße** `src/lib/arviewer/dims.json`: nur wörtlich aus Herstellerdokumenten, mit URL, lokaler Kopie und Prüfdatum. Stand: 16 Solpuri-Produkte (Datenblätter „Aufsteller24_A4_*.pdf“).

### Pilot AR-Foto (GPU-Lauf 27.10.2026)
- `node scripts/arviewer/ar-foto.mjs` erzeugt 16 Solpuri-Produkte: Breeze ×2, Basket, Club-Hocker, Jazz ×6, Foxx-Liege, Dance, Loop Lounge ×2, Bari-Bartisch ×2.
  - Freistellen der 16 Bilder: 27–59 s inklusive Laden des Modells (RTX 4060, fp16, 0,3–3,5 s pro Bild, VRAM 1,6 GB).
  - Dateigrößen: GLB 57–165 KB, Poster 19–86 KB (WebP mit Alpha).
  - Kontaktbogen visuell geprüft: saubere Kanten, auch bei Gestellen und Gurten.
- **Warum 16 statt ca. 30:** Maße zählen nur mit Herstellerquelle. Bei den anderen Kandidaten fehlte sie:
  - Eichholtz und 101 Copenhagen: Die Websites blockieren bzw. haben keine Maße im HTML oder JSON. Alonpi hat keine abrufbare Produkt-JSON.
  - Desalto: Die Kataloge enthalten keine Maßtabellen.
  - Tuuci: Für Bleau und Brickell gibt es keine Datenblätter.
  - Heatsail: Das Datenblatt ist mehrdeutig, und die Bilder haben weniger als 1.000 px.
  - Solpuri-Produkte ohne eindeutige Zeile im Datenblatt blieben ebenfalls draußen: Arrangements, Charlie 170/230, Milano, Club-Kaffeetisch mit zwei Höhen, Caro-Module, Butler/Lagoon/Yix (Datenblatt nur als Bild-PDF).
- **Lauf für alle** (`node scripts/arviewer/ar-foto.mjs --plan`, Ausgabe `.data/ar-viewer/arfoto-plan.json`): Von 1.760 Produkten sind 16 ok. 938 scheitern am Verbot der Marke, 786 an fehlenden Herstellermaßen, 20 am fehlenden Bild. **Korrektur Runde 2:** Der Plan zählt je Produkt nur den ersten Grund, und „Verbot“ steht vor „kein Bild“. Tatsächlich haben **152** Produkte kein Bild (Brand van Egmond 111, Next125 13, Quasar 13, Flos 4, Minotti 4, Poliform 3, Rimadesio 2, ClassiCon 1, Umbrosa 1). Diese Zahl zeigt auch der Filter. Ein anderes Bildfeld gibt es im Backoffice nicht: Die Detail-API liefert `bild_anhangen` leer und `bannerbild` als null.
  - Größter Hebel sind Herstellermaße für Eichholtz (150), 101 Copenhagen (62), Desalto (50), den Solpuri-Rest (43) und Alonpi (23).
  - Dafür im Backoffice das Feld `masse_cm` mit `masse_quelle` anlegen (siehe `ar-viewer-quellen.md`), `dims.json` füllen und denselben Befehl erneut laufen lassen.
- Das Protokoll je Produkt steht in `.data/ar-viewer/arfoto-lauf.json`, die Arbeitsdateien in `.data/ar-viewer/work/` (gitignored).

### Skripte (`scripts/arviewer/`)
| Skript | Zweck |
|---|---|
| `build-index.mjs [--cache <dir>]` | Erzeugt `src/lib/arviewer/catalog-index.json`: Produkte mit Maßen im Backoffice-Freitext (1.064 von 1.765). Dient nur dem Ausblick „AR-Foto möglich, sobald die Maße bestätigt sind“. |
| `ar-foto.mjs [--only <pf>] [--plan] [--intern] [--cpu]` | Erzeugt bzw. plant Stufe 2 (siehe oben). Mit `--intern` landet die Ausgabe nur in `.data/ar-viewer/intern/`. |
| `optimize-models.mjs [--run]` | Stufe 1: findet 3D- und CAD-Dateien in `Herstellermaterial/`. GLB/glTF optimiert es per `npx @gltf-transform/cli@4.2.1` (Draco, WebP ≤ 2048 px) nach `.data/ar-viewer/hersteller/`, für FBX/OBJ/3DS/RFA listet es den nötigen Umwandlungsschritt. Keine neue Projekt-Abhängigkeit (einmaliger Werkzeugaufruf). |

### Neue und geänderte Dateien
- Seiten: `src/app/[locale]/labs/ar-viewer/page.js` (neu aufgebaut) und `…/[produkt]/page.js` (neu).
- Komponenten: `src/components/Labs/ArViewer/{ProductViewer,PhoneHandoff}.js` und `…/Sortiment/{SortimentFilters,SortimentGrid,StageBadge,RoomTips}.js`.
- Geändert: `ModelStage.js` (optional `minCameraOrbit`/`maxCameraOrbit`/`noAutoRotate` je Modell) und `ArViewer.module.css` (Dialog-Animation).
- Logik und Daten: `src/lib/arviewer/{catalog,query,stage}.js` und `{rights,dims,arfotos,models3d,catalog-index}.json`.
- Assets und Skripte: `public/labs/ar-viewer/fotos/*` (16 GLB + 16 WebP) und `scripts/arviewer/*`.
- Tests: `tests/unit/ar-viewer-sortiment.test.mjs` (10) und `tests/e2e/ar-viewer-sortiment.spec.js` (4, Desktop Chromium + iPhone WebKit).

### Prüfung
- **Unit:** 10/10 neue Tests grün, die bestehenden AR-Viewer-Tests (r2, r2fix, r4) ebenfalls.
- **E2E:** neue Spec 4/4 grün, dazu `labs-arviewer.spec.js`, der CSP-Test (r5) und noindex/HDR (r4).
- **Barrierefreiheit:** axe (WCAG 2.2 AA) auf Liste, Pilot- und Minotti-Produktseite bei 390 und 1440 px: 0 Verstöße.
- **Verhalten:** Auf dem iPhone kein Querscrollen. Ohne Klick keine `.glb`-Anfrage.
- **Screenshots:**
  - `qa-screenshots/labs-ausbau/ar-viewer/selbst/` (shoot.mjs): 0 Konsolenfehler und 0 fehlgeschlagene Requests auf allen 4 Geräten.
  - `…/selbst/interaktion/`: gefilterte Liste, geladenes AR-Foto, QR-Dialog, Maße mobil.

### Offen
- **Freigaben** fehlen: von Solpuri für den Pilot, von Minotti, ClassiCon, Flos, Poliform und Sifas für Stufe 1. Ohne sie bleibt alles in den Labs bzw. intern.
- **Herstellermaße** müssen strukturiert ins Backoffice. Erst dann wächst Stufe 2 über den Pilot hinaus.
- **Echte Geräte:** Quick Look (Auto-USDZ einer Alpha-Fläche) und Scene Viewer mit `KHR_materials_unlit` lassen sich nur auf iPhone bzw. Android prüfen. Falls nötig, ein eigenes USDZ erzeugen.
- **Stufe 1** braucht nach der Freigabe eine manuelle Konvertierung (RFA → Revit/FBX → Blender → GLB).
- Der Cookie-Banner verdeckt mobil den unteren Teil der Bühne (global, Layout-Team).


## Runde 2 nach QA R1 (27.10.2026)

**Grundlage:** Bericht `qa-screenshots/labs-ausbau/ar-viewer/feedback-1.md` (Note 5/10).

**Belege** in `qa-screenshots/labs-ausbau/ar-viewer/fix1/`:
- Screenshots mit shoot.mjs auf 4 Geräten: 0 Konsolenfehler, 0 fehlgeschlagene Requests, kein Querscrollen.
- `interaktion/`: Raumbedarf in 3D mit Maßen, QR-Dialog, AR-Foto mit Maßen, iPhone-Liste, Bottom-Sheet, Produktseite mit `?von=qr`.

### P1-1 Abdeckung: Stufe 2b „Raumbedarf in Originalgröße“

**Die neue Stufe `raumbedarf`** (in `stage.js`; die Stufen heißen jetzt 1, 2a, 2b und 3):
- Am Boden liegt die Grundfläche B × T, darüber steht ein halbtransparenter Quader bis zur Höhe H. Kanten als Haarlinie, Bone-Ton, `KHR_materials_unlit`.
- Auf der Vorderseite stehen Marke, Produkt und „B × T × H cm“ als Text-Label. Am Boden stehen Breite und Tiefe.
- Alles liegt innerhalb des Quaders. Die Bounding Box entspricht damit exakt den Herstellermaßen; ein Unit-Test prüft das je Produkt.

**Kein Herstellerbild:**
- Weil kein Bild verwendet wird, ist die Stufe auch für Minotti, Poliform, Sifas usw. zulässig.
- Im Rechte-Register `rights.json` vermerkt: Block `raumbedarf` mit `bildnutzung: "keine"` und je Marke `raumbedarf: "ohne Bildnutzung – zulässig"`.
- Öffentlich bleibt alles bis zur Freigabe durch den Inhaber in den Labs (noindex).

**Ergebnis: 114 Produkte mit Ansicht im Raum.**
- 16 davon als AR-Foto, 98 als Raumbedarf. Die 16 AR-Foto-Produkte haben zusätzlich den Raumbedarf.
- **89 davon sind von Minotti** (Sofas, Sessel, Dining-Sessel, Hocker). Das Ziel von mindestens 30 ist erreicht.
- **Das Ziel von 150 Produkten ist nicht erreicht**, siehe „Offen“.

**Maße nur aus Herstellerquellen mit URL.** In `dims.json` steht die Herkunft im Feld `herkunft`:
- `minotti-technical-sheet` (89 Produkte):
  - Quelle sind die Sofaplaner-Datensätze `src/lib/sofaplaner/minotti/*.json`. Ihre Element-Maße stammen aus dem Minotti Technical Sheet bzw. der Elementliste der Produktseite.
  - Quell-URL ist das Technical-Sheet-PDF, der Datensatz gilt als lokale Kopie, Prüfdatum ist das Abrufdatum.
  - Die Zuordnung Katalog → Familie läuft über die Abgleich-Tabelle in `sofaplaner-minotti-modelle.md`, sonst über den Namen.
  - Das Element richtet sich nach der Produktart (Sessel, Dining, Hocker, Bank, Sofa). „(… 2)“ im Namen nimmt das zweite passende Element.
  - `modell` nennt die gezeigte Ausführung, z. B. „Gezeigt: Sofa 214 cm“. `alternativen` listet bis zu 12 weitere Größen laut Hersteller, sichtbar im Aufklapper „Weitere Größen“.
  - Erfasst werden nur Sitzmöbel-Kategorien. Decken, Nachttische und Konsolen derselben Familie bekommen keine Sofa-Maße.
- `datenblatt`: Solpuri, also der Pilot (16) plus ATON-Schirme (3), Club-Kaffeetisch und Charlie (2).
- `katalog`: Poliform-Monografie Joan 2026 mit Leopold, Orbis und Owen. Die Maße stehen dort in der Bildunterschrift als l/p/h in mm.

**Skripte:**

| Skript | Zweck |
|---|---|
| `scripts/arviewer/raumbedarf-masse.mjs [--cache <dir>] [--dry]` | Ordnet die Minotti-Produkte ihren Maßen zu. |
| `scripts/arviewer/raumbedarf.mjs [--only <pf>] [--names <dir>]` | Erzeugt je Produkt GLB, USDZ und Poster in `public/labs/ar-viewer/raum/` und das Register `src/lib/arviewer/raumbedarf.json`. |
| `scripts/arviewer/lib/glb-usdz.mjs` | Gemeinsame Bausteine: GLB schreiben und lesen, USDZ als USDA mit PNG in einem unkomprimierten ZIP mit 64-Byte-Ausrichtung. Keine neue Abhängigkeit. |

Dateigrößen: GLB 14–16 KB, USDZ 23–26 KB, Poster rund 22 KB. Das Poster ist eine Axonometrie, kein Foto.

**Legende und Filter:**
- Einzeilige Legende „1 3D & AR · 2a AR-Foto · 2b Raumbedarf · 3 Bild“ mit Zählern und einem `<details>`-Aufklapper „Was bedeuten die Stufen?“.
- Neuer Chip **„Im Raum ansehen“** (`stufe=raum`), der die Stufen 1 bis 2b zusammenfasst.

### P1-2 AR mit einem Tap

**Fertiges USDZ je Produkt:**
- Für alle 98 Raumbedarf- und 16 AR-Foto-Produkte. Die AR-Fotos baut `ar-foto.mjs --neu-aus-glb` aus den vorhandenen GLBs neu, ohne erneutes Freistellen.
- Eingetragen als `usdz` in `arfotos.json` bzw. `raumbedarf.json`. `toModel()` übergibt es als `iosSrc`, also als `ios-src` an model-viewer.

**Knopf „In meinem Raum ansehen“ direkt unter dem Titel** (`ArLaunch.js`, primär, mindestens 48 px):

| Gerät | Verhalten |
|---|---|
| iPhone/iPad | `<a rel="ar" href="….usdz#allowsContentScaling=0">` mit `<img>`-Kind startet Quick Look, ohne three.js. |
| Android | Scene-Viewer-Intent mit `mode=ar_preferred` und `resizable=false`. Klappt das nicht, führt `browser_fallback_url` mit `?ar=fallback` zurück und lädt die Bühne. |
| Desktop | QR-Übergabe. |
| Sonstige | Die Bühne wird geladen. |

In der iPhone-15-Pro-Emulation liegt der Knopf über dem Falz. Die 3D-Bühne bleibt als optionale Vorschau („… in 3D drehen“).

**Noch nicht erledigt:**
- Test auf echten Geräten: Transparenz, Maßstab mit Zollstock, Skalierungssperre, Start unter 3 s.
  - Playwright-WebKit kennt `relList.supports("ar")` nicht, Scene Viewer und ARCore lassen sich nicht emulieren.
  - Für die Belege ist der Ordner `qa-screenshots/labs-ausbau/ar-viewer/geraete/` vorgesehen.
- Die USDZ sind nur strukturell geprüft (Ausrichtung, CRC, Texturverweise, `metersPerUnit = 1`, `upAxis = "Y"`), nicht mit `usdchecker`.

### P2

**Übersicht mobil:**
- Die Suche steht direkt unter der H1. Die H1 nutzt mobil `display-m`.
- Darunter folgt die Reihe „Jetzt im Raum ansehen“: Embla-Karussell mit 18 Produkten, Marken gemischt. Danach die einzeilige Legende.
- Marke, Kategorie und Darstellung liegen mobil in einem Bottom-Sheet (natives `<dialog>`, Knopf „Filter (n)“, unten „n Produkte zeigen“). Ab md stehen sie inline.

**Filter:**
- Während des Ladens: Liste mit `aria-busy` und `opacity-60`, Zähler-Skeleton „Liste wird aktualisiert …“ (`SortimentShell`/`ResultsRegion`).
- Optionen und Chips mit 0 Treffern sind `disabled`, die Zahl bleibt sichtbar.
- Marke, Kategorie und Darstellung wechseln per `router.push`, die Zurück-Taste stellt den Filter zurück (per E2E geprüft). Die Tippsuche nutzt `replace`.
- Die Felder sind kontrolliert und werden beim Rendern an die URL angeglichen. Es gibt keinen Remount mehr, das Sheet bleibt beim Filtern offen.
- Bis zur Hydration greift der native GET-Submit (Flag per `useSyncExternalStore`, Attribut `data-ready`).
- Das doppelte „X“ im Suchfeld ist entfernt.
- Der Router-Fehler „dispatched before initialization“ trat im Dev-Lauf nicht wieder auf. Im Produktions-Build verifizieren.

**Fehlerfall:**
- Die Bühne lädt per `React.lazy` in einer lokalen Error-Boundary (`StageBoundary`).
- Bei einem Fehler stehen dort das Standbild, „Die Ansicht konnte nicht geladen werden“ und **„Erneut versuchen“**. Der Knopf erzeugt ein neues `lazy()` und damit einen neuen `import()`.
- Der E2E-Test bricht den Chunk mit three/model-viewer ab und prüft, dass die Seite stehen bleibt und das Neuladen klappt.
- Der Wächter in WebKit greift nach 15 s ohne `progress` statt nach 30 s.

**AR-Foto:**
- Die Unterkante des Fotos sitzt an der Vorderkante der Grundfläche.
- Die Umrandung ist eine Haarlinie (`#30373e`, 40 %, rund 0,4 cm).
- Neuer Schalter **„Maße einblenden“** mit Datenblatt-Werten über `dimsBox` in `ModelStage`, nicht mit der Bounding Box des Fotos. Der JAZZ lounger zeigt jetzt 50 cm statt 107 cm.
- **Offen:** die Frontalansicht als Fläche. Dafür müssen die Datenblatt-Ansichten mit der GPU-Pipeline neu freigestellt werden.

**QR-Dialog:**
- Der Link kommt aus `SITE_URL`, für Tunnel und Vorschau überschreibbar per `NEXT_PUBLIC_ARVIEWER_ORIGIN`, und trägt `?von=qr`.
- Mit `?von=qr` hat der Knopf auf dem Handy einen Goldrahmen und den Hinweis „Vom Computer übergeben“.
- Die Ruhezone im SVG beträgt 4 Module.
- Nicht umgesetzt: der optionale Live-Status „Auf dem Handy geöffnet“.

**Bericht und Daten:**
- Die Zahl der Produkte ohne Bild ist korrigiert (152, siehe oben).
- Diese Produkte stehen nicht mehr in der Standardliste. Erreichbar sind sie über den Chip „Noch ohne Bild“ oder die Suche.

### P3
- **Stufe-3-Seite:** neuer Abschnitt „Passt es in Ihren Raum?“ mit drei Angeboten:
  - „Maße anfragen“ und „Termin mit diesem Produkt“ führen auf `/de/beratung?produkt=…` mit vorbelegtem Produkt. Es wird nichts gesendet.
  - „Auf die Merkliste“ nutzt den CartContext wie im Shop.
- **Fotos:** mobil wischbar (Embla) mit Zähler „n / m“, die Vorschaubilder bleiben. **Pinch-Zoom ist offen.**
- **Suche:**
  - Synonyme: Lampe → Leuchte, Couch → Sofa, Stuhl → Chair, Tisch → Table, dazu Sessel, Hocker, Bett, Teppich, Schirm und Liege.
  - Tippfehler-Toleranz: Levenshtein ≤ 1 ab 5 Zeichen, „conery“ findet Connery.
- **Kleinigkeiten:** Die Maß-Quelle hat kein `inline-block` mehr, keine Zeile beginnt mit einem Komma. `<model-viewer>` hat `tabindex="0"`; `alt` war schon gesetzt.
- **Daten:** `tables-connery` unter „Sofas & Couches“ ist eine Benennung im Backoffice. Nur lesend geprüft, nicht geändert; Hinweis an das Backoffice-Team.

### Tests

**Neu:**
- `tests/unit/ar-viewer-raumbedarf.test.mjs` mit 8 Tests:
  - Zielzahlen und exakte GLB-Maße je Produkt
  - USDZ-Struktur und Foto an der Vorderkante
  - Stufe 2b trotz Bildverbot
  - Minotti-Zuordnung, Suche und UI-Verträge
- `tests/e2e/ar-viewer-sortiment.spec.js`, neu gefasst mit 6 Tests:
  - Liste: Verlauf, Optionen ohne Treffer, Chip, Tippfehler
  - Raumbedarf mit Maßen und QR-Origin
  - AR-Foto mit Maßen aus dem Datenblatt
  - Stufe 3 „Passt es?“
  - Chunk-Abbruch mit „Erneut versuchen“
  - iPhone mit Bottom-Sheet und AR-Knopf über dem Falz

**An die neue Vorgabe angepasst** (eigene Tests): `ar-viewer-sortiment.test.mjs` erwartet jetzt 5 statt 4 Stufen und `lazy()` statt `next/dynamic`.

**Ergebnisse:**
- `npm run test:unit`: 875 von 875 grün.
- E2E AR-Viewer: 8 von 8 grün, seriell gegen den Dev-Server. Die Filter-Navigation braucht dort 14–20 s, daher wartet der Test bis zu 90 s.
- axe (WCAG 2.2 AA): 0 Verstöße auf Liste, Raumbedarf-Seite, Stufe-3-Seite und offenem Bottom-Sheet, jeweils Desktop und Pixel 7.

### Offen
- **150 Produkte:** Erreicht sind 114.
  - Weitere Maße gibt es nur als unbeschriftete Zeichnungen: ClassiCon-Product-Sheets und Minotti-Technical-Sheets für Sessel, Tische und Betten. Paola Lenti nennt in den Datenblättern keine Maße.
  - Die Minotti-Produktliste per API war in dieser Umgebung gesperrt.
  - Größter Hebel: das Backoffice-Feld `masse_cm` mit `masse_quelle` (siehe `ar-viewer-quellen.md`) oder ein Mensch, der die Technical Sheets abliest. Danach `raumbedarf.mjs` erneut laufen lassen.
- **Weitere offene Punkte:**
  - Test auf echten Geräten (P1-2, Punkt 3)
  - Frontalansicht beim AR-Foto
  - Pinch-Zoom in der Bildansicht
  - Live-Status im QR-Dialog
  - Ladezeiten im Produktions-Build (LHCI)

## Runde 3 nach QA R2 (27./28.10.2026)

**Grundlage:** `qa-screenshots/labs-ausbau/ar-viewer/feedback-2.md` (Note 6/10). **Belege:** `qa-screenshots/labs-ausbau/ar-viewer/fix2/` (shoot.mjs auf 4 Geräten, `report.json`, `interaktion/` aus `fix2-interaktion.mjs`) und `…/geraete/usdchecker.txt`. Keine neuen npm-Pakete.

### P1-1 Teilkatalog nie still
- `src/lib/arviewer/sortiment-load.js` (rein, testbar): je Marke live laden, bei Fehler **einmal nach 800 ms** wiederholen, dann die Zeilen dieser Marke aus dem **letzten vollständigen Stand** (`.data/ar-viewer/sortiment-snapshot.json`, gitignored, zusätzlich im Prozessspeicher). Ohne Stand fehlt die Marke → `failed`, `complete: false`.
- Der Abruf je Marke ist strikt (`fetchMarkeStrict` in `catalog.js`, gleiche URL und Data Cache 1 h/Tag `products`, wirft bei Fehlern). Grund: `fetchProdukteNewByMarke()` liefert bei Fehlern still `[]`.
- Snapshot nur aus einem vollständigen **Live**-Lauf, höchstens alle 10 min neu geschrieben, schlank (nur Kartenfelder). `"use cache"`/`cacheLife` wurde nicht genommen: der Stand muss Prozess-Neustarts überleben und darf nie aus einem Teil-Lauf entstehen; die Backoffice-Antworten selbst liegen weiter im Data Cache.
- Seite: fehlt eine Marke, steht über der Liste „Minotti wird gerade nicht geladen – die Ergebnisse sind unvollständig. [Neu laden]“ (`role="status"`), Intro, Zähler, Chips, Legende und Reihe mit „mind.“. Kommt eine Marke aus dem Stand, sind die Zahlen vollständig und die Seite nennt „Minotti: Stand vom … Uhr“. Die Intro-Zeile kommt nur noch aus der Liste selbst und entfällt bei `error` („1 760 … 0 davon“ ist nicht mehr möglich).
- Test-Schalter: Header `x-arviewer-sim: fehler=Minotti[;ohne-stand]`, **nur außerhalb von Produktion**.

### P1-2 Geräte
- `glb-usdz.mjs`: `prepend apiSchemas = ["MaterialBindingAPI"]` und `float3[] extent` je Mesh. Alle USDZ neu gebaut und mit dem ARKit-ComplianceChecker aus usd-core geprüft (`scripts/arviewer/usdchecker.py`, nur Arbeitsplatz): **361 Dateien, 0 Fehler, 0 Warnungen** (`geraete/usdchecker.txt`).
- QR-Origin: `NEXT_PUBLIC_ARVIEWER_ORIGIN` (Tunnel, z. B. `cloudflared tunnel --url http://localhost:3000`); außerhalb von Produktion sonst die aktuelle Adresse, wenn sie nicht localhost ist; sonst `SITE_URL`. Im Dialog außerhalb von Produktion: „Vorschau: Link führt auf …“ und, bei `SITE_URL`, der Hinweis, dass der Viewer dort erst nach dem Livegang erreichbar ist.
- In-App-Browser (Instagram, Facebook, TikTok, Snapchat, LinkedIn, Pinterest u. a.): statt des AR-Knopfs „Für die Ansicht im Raum bitte in Safari/Chrome öffnen“ mit „Link kopieren“.
- **Offen:** Gerätematrix auf echten Geräten (iPhone Safari/Chrome, iPad, Pixel/Samsung, Samsung Internet; Start < 3 s, Zollstock-Foto, Skalierungssperre, Transparenz, Lesbarkeit, Rückkehr; Gmail/WhatsApp-In-App). Braucht einen Menschen mit Geräten und laufendem Tunnel; Ablage `…/geraete/`.

### P2
- **P2-1 Raumbedarf mit Profil:** Werte aus den Minotti-Technical-Sheets (Sofaplaner-Datensätze, Quelle je Produkt in `profil.quelle`). 14 Produkte als **Stufenprofil** (Sitz, Rücken, Armlehnen als Blöcke), 70 als Quader mit **Sitz-/Armlehnenhöhen-Linien**, sonst Quader. Fehlende Werte werden nicht geschätzt. **Größen-Umschalter** („228 / 248 / 268 / 310 cm“, `aria-pressed`) direkt über „In meinem Raum ansehen“, je Größe eigenes GLB/USDZ (225 Zusatzgrößen); die Wahl gilt für Bühne, Maßleiste und „Gezeigt: …“. Beschriftung zusätzlich vorne senkrecht.
- **P2-2 Such-Navigation:** Debounce-Timer wird bei Unmount, Marke/Chip, jedem Link-Klick und `popstate` abgebrochen; vor `replace` Abgleich mit der URL beim Tippen. Suchfeld bleibt während `pending` bedienbar.
- **P2-3 Kartenbilder:** `CardImage` mit `onError` → eigene Axonometrie → neutrale Fläche mit Produktname. Reihe „Jetzt im Raum“ zeigt bei 2b immer die eigene Axonometrie statt der Wohnszene.
- **P2-4 Wischen:** Embla ohne `dragFree`, Bilder `draggable={false}`, Overlays `pointer-events-none`, Pfeile ab sm. Pinch-Zoom weiter offen.
- **P2-5 Standbild:** bleibt bis zum `load` von model-viewer stehen (auch während der Chunk lädt), darüber Fortschrittsbalken aus `progress`.
- **P2-6 QR:** `qrcode` wird bei Hover/Fokus vorgeladen; bis dahin Skeleton (Suchermuster, `motion-safe:animate-pulse`), Mittelbild erst mit dem Code. **Live-Status** „Auf dem Handy geöffnet“: Route `/de/labs/ar-viewer/uebergabe` speichert nur ein Zufalls-Token (15 min, Prozessspeicher, rate-limitiert, noindex); das Handy meldet das Token aus `&t=`.

### P3
- „Meinten Sie …?“ und die Reihe „Jetzt im Raum“ im Leerzustand der Suche.
- `alt` an `<model-viewer>`: React 19 setzt bei Custom Elements nur die Property, model-viewer spiegelt sie nicht. `ModelStage` setzt das Attribut jetzt per Effekt (geprüft: iPhone-Emulation liefert den Text).
- Offen: Höhen-Bedingung „Liegefläche“ beim Jazz lounger (Datenblatt nennt sie nicht → kein Zusatz), Cookie-Banner (Layout-Team), Backoffice-Benennung „tables-“.
- Offen (neu gesehen): Im Daniels-Poster überlappen die Höhenwerte 49/40 am rechten Rand.

### Erneute Prüfung (fix2)
- shoot.mjs, 4 Seiten × 4 Geräte: 0 Konsolenfehler außer einmal „Router action dispatched before initialization“ (Pixel, Stufe-3-Seite, Dev-Last, bekannt) und einem abgebrochenen `_rsc`-Refresh; iPhone-Stufe-3 lief beim ersten Mal in einen Netz-Timeout (Dev-Last), im zweiten Lauf ok.
- `interaktion/` (`fix2-interaktion.mjs`): keine kaputten Kartenbilder (Pixel, iPhone); Wischen Stufe 3 auf Pixel „1 / 7“ → „2 / 7“ (QA R2: blieb bei 1 / 7); in der iPhone-Emulation lässt sich Touch-Wischen nicht auslösen (Maus-Ziehen auf Touch-Kontext) → auf echtem iPhone gegenprüfen; Standbild 400 ms nach dem Tap sichtbar (Pixel, iPhone); Größen 228/248/268/310 cm; Teilkatalog-Hinweis mobil mit „mind.“.
- Unter Dev-Last zeigt das iPhone bis zur Hydration statt des AR-Knopfs einen 48-px-Platzhalter (gewollt, kein Layoutsprung beim Knopf; der Größen-Umschalter kommt danach hinzu).

### Tests
- Neu: `tests/unit/ar-viewer-fix2.test.mjs` (12 Tests: Wiederholung/Stand/fehlt, Snapshot nur aus Live-Lauf, USDZ-Schemas, Größen-Assets, Profil mit Quelle, Such-Abbruch, QR-Vorladen, Übergabe-Token) und `tests/e2e/ar-viewer-fix2.spec.js` (4 Tests: Teilkatalog-Hinweis mit „mind.“, Rückfall auf Stand mit gleichen Zahlen und „minoti“-Treffern, Tippen + Karten-Klick bleibt auf der Produktseite, Größen-Umschalter + QR-Skeleton + Live-Status).
- Angepasst: `ar-viewer-sortiment.spec.js` zählt die Solpuri-AR-Fotos jetzt aus `arfotos.json` (22 statt fest 16).
- Ergebnis: Unit AR-Viewer 38/38 grün (gesamt 925/934; die 3 roten gehören zum Stilfinder, nicht zu diesem Feature); E2E AR-Viewer (Desktop) 12/12 grün gegen den Dev-Server.

## Feinschliff: Restliste P2/P3 und Sortiments-Abdeckung (28.10.2026)

**Grundlage:** `qa-screenshots/labs-ausbau/ar-viewer/feedback-2.md`, offene P2/P3. **Belege:** `qa-screenshots/feinschliff/ar-viewer/selbst/` (shoot.mjs, 5 Seiten × 4 Geräte, `report.json`). Keine neuen npm-Pakete.

### Umgesetzt
- **Pinch-Zoom (P2-4/P3):** `FotoZoom.js`, natives `<dialog>` im Vollbild. Öffnet über „Bild vergrößern“ (oben rechts auf dem Foto), einen Tipp aufs Foto ohne Wischen (`embla.clickAllowed()`) oder zwei Finger auf dem Foto. Darin: zwei Finger zoomen um den Mittelpunkt der Finger (1–4×), ein Finger verschiebt (nur vergrößert), Doppeltipp/Doppelklick 1× ↔ 2,5×, Mausrad. Bei 1× wechselt Wischen das Bild. Alles geht auch ohne Geste (WCAG 2.5.7): Knöpfe Vergrößern/Verkleinern/Zurücksetzen/Vorheriges/Nächstes, Tasten + − 0 und Pfeile; Esc schließt, der Fokus kehrt zurück. Die Zoomstufe wird angesagt (`<output aria-live>`). Bei reduced motion gibt es keine Übergänge. **Das Herstellerbild bleibt unverändert** (`object-contain`, kein Beschnitt, kein Filter), vergrößert wird nur die Ansicht; das ist mit der Minotti-Regel vereinbar. Die Rechnung (`clampPan`, `zoomAt`) liegt rein und getestet in `src/lib/arviewer/zoom.js`.
- **Höhe mit Datenblatt-Bedingung (P3):** neues Registerfeld `hoeheHinweis` in `dims.json`, das nur zusammen mit `hoeheBeleg` ausgegeben wird (`verifiedDims`). Unter der Maßleiste steht dann z. B. „Höhe 50 cm mit flacher Rückenlehne und Nackenrolle; Liegefläche 32 cm (laut Datenblatt).“
  - Jazz-Liege, Beleg: Datenblatt JAZZ S. 2, Liege mit flacher Rückenlehne gezeichnet, Bemaßung 32 an der Liegefläche.
  - Foxx-Liege, Beleg: Datenblatt FOXX S. 2. Die 45 cm sind an der Liegefläche bemaßt, die Rückenlehne ist aufgestellt gezeichnet, ihre Höhe nennt das Datenblatt nicht. So steht es auch auf der Seite.
  - Die Runde 3 hatte „kein Zusatz“ notiert, weil der Text des Datenblatts die Bedingung nicht nennt. Die Zeichnung belegt sie.
- **iPad-/iOS-Hinweistext (P3):** `hinweisText()` in `ArLaunch.js`. iPhone/iPad mit Quick Look: „Startet direkt die Kamera …“ (wie bisher). iPhone/iPad in einem Browser ohne `rel="ar"` (auch die Emulation): „In Safari startet hier direkt die Kamera. In diesem Browser lädt die Ansicht auf der Seite.“ Den Beleg auf einem echten iPad liefert weiter die Gerätematrix (P1-2.3).
- **Geprüft und unverändert, weil schon in Runde 3 umgesetzt:**
  - P2-5: Das Standbild bleibt bis `load` stehen, darüber der Fortschrittsbalken aus `progress`.
  - P2-6: QR wird vorgeladen, mit Skeleton und Live-Status „Auf dem Handy geöffnet“.
  - `alt` am `<model-viewer>` (als Attribut).
  - „Meinten Sie …?“ samt Reihe „Jetzt im Raum“ im Leerzustand.
  - Alles abgesichert durch `tests/unit/ar-viewer-feinschliff.test.mjs`.

### Erfasst der Viewer das ganze Sortiment?
Abgleich am 28.10.2026, nur GET:
- `get_produkte_paths` (alle aktiven Shop-Produkte mit Kategorie) gegen den Sortiment-Stand des Viewers ergibt **1 760 / 1 760, es fehlt keins und es gibt keins zu viel**. **Gelistet, such- und filterbar ist also das ganze Sortiment.**
- **Im Raum ansehen** lassen sich davon **119** (vorher 114):
  - 22 Solpuri (AR-Foto)
  - 89 Minotti (Raumbedarf)
  - 3 Poliform (Raumbedarf)
  - **neu 5 ClassiCon** (Raumbedarf)

Lücken:

| Lücke | Umfang | Stand |
|---|---|---|
| Kein AR, weil Herstellermaße mit Quelle fehlen | 1 641 Produkte; 18 Marken ganz ohne (u. a. Eichholtz 150, Flos 144, Brand van Egmond 111, Paola Lenti 100, Treca 96), dazu Minotti 398, ClassiCon 121, Poliform 100, Solpuri 37 | **teilweise geschlossen:** ClassiCon-Pilot (Vertrag liegt vor; Rechte-Register: Raumbedarf „ohne Bildnutzung – zulässig“). 5 Produkte aus den lokalen Product Sheets: Lota Sofa 240 × 95 × 85, Bibendum 90 × 79 × 72, Day Bed 190 × 86 × 60, Day Bed Grand 200 × 90 × 60 (beide mit Größen-Umschalter), Odin 160 × 70 × 74. Die Werte stammen aus der Maßzeichnung und wurden visuell gegen die lokale PDF-Kopie geprüft (`herkunft: classicon-product-sheet`). Erzeugt mit `scripts/arviewer/raumbedarf.mjs --only … --snapshot …`. |
| Restliche ClassiCon-Product-Sheets | ca. 95 PDFs in `Herstellermaterial/ClassiCon/datenblaetter/` | offen. Die Maße stehen nur als Bemaßung in der Zeichnung, ohne „B × T × H“. Eine Zuordnung per Text ist nicht eindeutig, also muss jede Zeichnung angesehen werden. Gleiches Vorgehen wie im Pilot. Teppiche und Spiegel sind ausgenommen (Teppiche „auf Anfrage“, ±5 cm). |
| Andere Marken | Eichholtz, Flos, Brand van Egmond, Treca, Paola Lenti … | offen. Herstellerdatenblätter liegen teils in `Herstellermaterial/`, Rechte je Marke im Register. Der Backoffice-Freitext (`mitMassen`, 1 064 Produkte) ist **keine** geprüfte Quelle und wird bewusst nicht verwendet. |
| Aktive Marken ohne Produkte im Backoffice | 14: Bullfrog, Bombyxx, EMU, Trapa, Pomax, Frost, Lambert, Tom Dixon, Papadatos, Qeeboo, Tonon, Gloster, Antoniolupi, agape | Datenlücke im Backoffice, nicht im Viewer. Der Shop zeigt für diese Marken ebenfalls keine Produkte. Hinweis ans Backoffice-Team. |
| Ezarri | nicht im Backoffice (keine Marke, keine Produkte) | Vertrag liegt vor. Ezarri-Seiten baut ein anderes Team. Sobald es Produkte im Backoffice gibt, listet der Viewer sie ohne Codeänderung. Mosaik und Pools sind keine Möbel für AR in Originalgröße. |
| Echtes 3D (Stufe 1) | 0 Sortimentsprodukte | offen. Braucht Hersteller-3D mit Freigabe (siehe `ar-viewer-quellen.md`). |

### Dateien
- Neu:
  - `src/components/Labs/ArViewer/FotoZoom.js`
  - `src/lib/arviewer/zoom.js`
  - `tests/unit/ar-viewer-feinschliff.test.mjs` (8 Tests)
  - `tests/e2e/ar-viewer-feinschliff.spec.js` (3 Tests: Zoom, Höhen-Hinweis, ClassiCon Lota)
  - `public/labs/ar-viewer/raum/{sofas-couches-lota-sofa,armchairs-stools-bibendum-armchair,chaise-longues-daybeds-day-bed(-grand),sofas-couches-odin-sofa}.{glb,usdz,webp}` samt Größen-Dateien
- Geändert:
  - `ProductViewer.js` (Zoom, Höhen-Hinweis)
  - `ArLaunch.js` (`hinweisText`)
  - `src/lib/arviewer/stage.js` (`verifiedDims` reicht `hoeheHinweis` nur mit Beleg durch)
  - `dims.json` (Höhen-Belege Jazz/Foxx, 5 ClassiCon-Einträge, `$note`)
  - `raumbedarf.json` (vom Skript)

### Offen
- Gerätematrix auf echten Geräten (P1-2.3), dabei iPad-Text und Pinch-Zoom auf Touch gegenprüfen.
- Die übrigen ClassiCon-Sheets und weitere Marken (siehe Tabelle).
- Die USDZ des Pilots mit `usdchecker` prüfen. Sie kommen aus derselben Bibliothek wie die 361 bereits geprüften; Python ist in diesem Lauf nicht erlaubt.
- Cookie-Banner (Layout-Team) und die Backoffice-Benennung „tables-“ bleiben offen wie in Runde 3.

### Prüfung (Feinschliff)
- Unit: AR-Viewer 46/46 grün (davon neu 8). E2E `ar-viewer-feinschliff.spec.js` auf Desktop 3/3 grün; Lota erst beim zweiten Versuch, weil ein anderes Team gleichzeitig das gemeinsame Ergebnisverzeichnis geleert hat (ENOENT in der Trace-Datei).
- shoot.mjs lief zweimal gegen den Dev-Server. Wegen sechs parallel laufender shoot-Läufe anderer Teams war er überlastet: TTFB bis 99 s, `networkidle`-Timeouts. Entstanden sind nur Bilder von Jazz (iPhone, iPad) und Lota (iPad, unter Last mit „Produkt gerade nicht erreichbar“, also Backoffice-Timeout). Die vollständigen Screenshots der drei Pflichtseiten müssen in einem ruhigen Moment nachgeholt werden.
