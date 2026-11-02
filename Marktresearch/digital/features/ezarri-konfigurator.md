# Ezarri-Konfigurator „Becken“ (Team B)

Stand: 28.10.2026 (nach QM Runde 1, siehe §10) · Seite: `/de/ezarri/konfigurator` (noindex, solange `EZARRI_PUBLIC = false`) · Druckblatt: `/de/ezarri/konfigurator/blatt?k=…`
Grundlage: `ezarri-konzept.md` §4 und §7.2/§7.4, Paritätsliste `ezarri-analyse.md` §14, Design-Bibel, Rechtspaket.

## 1. Ergebnis in Kürze

- **Echtes 3D im Browser** (three.js 0.183 über React Three Fiber 9, ohne drei): eigenes Becken mit Maß, Form, Treppe, Bank und Rand, dazu Whirlpool, Duschnische und Küchenrückwand.
- **Jede der 402 Referenzen** aus `references.json` ist wählbar (Mosaik, Safe, Corner, Cove), dazu **55 Safe-Varianten**, die Ezarri nur als `?as-25`/`?as-50` auf derselben Produktseite führt (457 Einträge). Die Steinfarben sind aus den Ezarri-Produktbildern gemessen, Glanz und Reflexion stammen aus Ezarris Konfigurator-Daten.
- **Prozeduraler Mosaik-Shader:** Er arbeitet pro Stein mit Format (25/50/Hexa), Fuge 1,1 mm in einer der 7 Ezarri-Fugenfarben, Fase, Mischung aus bis zu 4 Mosaiken, 3 Kanälen und 20 Patterns.
- **Wasser:** Kaustik, Absorption nach Tiefe (Beer-Lambert), Fresnel-Spiegelung der echten Umgebung (Würfel-Aufnahme), Wasserart, Tageszeit und LED.
- **Umgebung:** begrenzte Terrasse mit Kante, Beckenkopf mit gerundeter Kante, Kontaktschatten, Rasen, Hecke, Säulenbäume, See und Bergkette, Himmel mit Wolken. Alles prozedural, 0 Byte Download.
- **Poster:** Vorschaubild der 3D-Szene für den Startentwurf (WebP 42 KB). Mobil steht es hinter „In 3D ansehen“, am Desktop überbrückt es die Ladezeit.
- **Ohne WebGL** gibt es eine 2D-Draufsicht mit denselben Daten. Mengen, Link, Druckblatt und Anfrage funktionieren dort genauso.
- Erstansicht ohne three.js. Die 3D-Bühne lädt lazy (Desktop bei Sichtbarkeit, mobil auf Tippen). Der Teilkatalog für den ersten Render ist 2,6 KB gzip groß, der volle Katalog lädt im Leerlauf nach (28 KB gzip).

## 2. Parität mit Ezarri und Verbesserungen

| Ezarri-Funktion | Bei uns | Status |
|---|---|---|
| 3 Einstiege (Mix, Referenz, Pattern) | 4 Karten als native Radiogruppe: Ein Mosaik, Eigene Mischung, Ezarri-Mischung (57 Einträge), Motiv-Raster (20 Patterns; „Muster“ bleibt den Musterplatten vorbehalten) | fertig |
| Panoplia mit Filter Sammlung, Farbe, Format | `<dialog>`, Vollbild mobil (3 Spalten) und Seitenblatt am Desktop. Suche, 9 Farbfamilien als scrollende Chips mit Verlauf als Hinweis, Kollektion, Format, Art (Mosaik/Safe/Corner/Cove), Wasserwirkung, „nur mischbar“, 48 je Schritt, Alt-Texte. Esc gibt den Fokus an den Auslöser zurück | fertig |
| Mischung bis 4, Prozent, „mezclable“ | Anteilsband mit ziehbaren Grenzen (`role=slider`, Pfeiltasten), Zahlenfeld, ±5-Knöpfe. Summe immer 100, Mindestanteil 1 %. Nicht mischbare Mosaike stehen allein, mit Hinweis statt stummer Sperre | fertig |
| Rezepte (cf_mosaico/percent) | 43 Ezarri-Mischungen mit Ezarris Anteilen 1:1 (kein Hochrechnen), danach veränderbar. 14 weitere (z. B. Mojito, Manhattan, Long Island, Blue Moon) sind bei Ezarri unvollständig: 7 Bestandteile fehlen im Konfigurator-Abzug (IDs 0, 66, 67, 133–136), oder die Anteile passen nicht zu den IDs. Sie stehen in einer eigenen Gruppe „Nach Produktfoto (Rezept unvollständig)“ und zeigen die fertige Ezarri-Referenz mit gemessenen Farben und Hinweis | fertig, Nachladen offen (§8) |
| Kanäle bis 3 | Bahnmarkierung (je 2,5 m Bahnbreite), Band an der Wasserlinie, Stufenkanten. Je Kanal Mosaik und Breite 5–40 cm | fertig |
| 7 Fugenfarben | Swatches mit Namen, live im Shader | fertig |
| Format 25/50/Hexa | Umschalter. Nicht erhältliche Formate sind gesperrt, mit Begründung für Screenreader. Das Steinraster wechselt, Safe-Ausführungen bleiben Safe | fertig |
| Spezialteile Corner/Cove | Schalter mit passendem Teil aus den Ezarri-Varianten, eigenes Teil wählbar. Länge in lfm unter „Mengen“ und auf dem Blatt | fertig |
| ≥ 2 Kameras | 5 Kamerapunkte je Szene: Übersicht, Treppe, Wasserlinie, Unter Wasser, Von oben (Bad/Küche: Übersicht, Nah). Fahrt 400 ms, bei reduzierter Bewegung ein Schnitt | fertig |
| 3D, Orbit, Zoom | Maus, Touch (Touch-Sperre gegen die Scroll-Falle, „Ansicht bewegen“), Tastatur: Pfeile drehen, +/− zoomen | fertig |
| Wasser bewegt/ruhig/leer | alle 3 bedienbar, dazu Wasserart klar/Naturpool/Meerwasser | fertig |
| AR | `<model-viewer>` nach Klick. Das GLB wird live aus der Szene exportiert (Mosaik als Textur), die Maße sind die eigenen Maße. iOS bekommt das USDZ von model-viewer | gebaut, **nicht auf echtem Gerät geprüft** |
| Neu starten | „Neu beginnen“ mit Rückfrage im eigenen Dialog (kein `window.confirm`). Dazu Rückgängig/Wiederholen mit 50 Schritten (Strg+Z, Strg+Umschalt+Z) | fertig |
| PDF-Datenblatt | Druckblatt ohne Formular: Standbild der 3D-Ansicht. Kommt man aus der 3D-Bühne, nimmt das Blatt deren Kamera (localStorage, auch im neuen Tab), sonst rendert das Blatt die Szene selbst unsichtbar. Nur ohne WebGL gibt es die 2D-Draufsicht. Bildunterschrift „Visualisierung, Farben angenähert“, keine internen IDs, Nahansicht, Becken, Mosaike mit Codes und Wasserwirkung, Fuge, Kanäle, Spezialteile, Mengen, QR-Code, Quellenangabe, keine Preise. „Als PDF speichern“ über den Druckdialog | fertig |
| Angebot anfordern | Übergabe an Team C: `anfrageHref()` mit `art`, bis 6 `ref`, `k`, `m2`, `projekt`, `quelle=konfigurator`. Gesendet wird dort (Dry-Run im Dev) | fertig |

**Verbesserungen gegenüber Ezarri** (Konzept §4.2):
- Eigenes Becken: 2–25 × 1,5–12 m, Tiefe 0,8–2,5 m mit stufenloser Schräge. Formen Rechteck, runde Ecken, runde Enden und L. Treppe römisch, Eck oder volle Breite, dazu Sitzbank. Rand Skimmer, Überlaufrinne oder Infinity-Kante.
- Weitere Szenen: Whirlpool (rund oder quadratisch, umlaufende Bank), Duschnische, Küchenrückwand.
- Material pro Steinchen statt nach dem dominanten Mosaik: Glanz, Spiegel, Perlmutt (Iridescence) und Nachleuchten (Fosfo, nachts) je Stein. Zeichnung im Stein bei Aquarelle, Gea, Zen, Terrazzo und Space.
- Echte Kaustik statt 10 gebackener Lightmaps, Wassertiefe sichtbar, Tageszeit Morgen/Mittag/Abend/Nacht, LED weiß, warmweiß, blau oder türkis.
- Mengen live (m², Kartons, Blätter, Gewicht, Kleber, Fuge, Corner/Cove) über Team Cs Rechner-Kern. „Genau berechnen“ springt mit demselben Entwurf in den Rechner.
- Vorher/Nachher: „Vorher festhalten“, dann eine geteilte Ansicht mit Teilung per Zeiger oder Schieber, in 3D (zwei Scissor-Durchgänge) und in 2D.
- Teilen-Link (`?k=`), Merkliste („Becken-Entwurf“), Fotoansicht der Ezarri-Bilder des Mosaiks mit Credit.
- Live-Zusammenfassung für Screenreader (`aria-live`). Jede Einstellung ist ein natives Steuerelement, die Canvas ist `aria-hidden`.

## 3. Realistische Mosaik-Textur – wie die Farben entstehen

- **Messung:** `src/lib/ezarri/konfigurator/tools/messen.mjs` (Node und sharp, einmalig) liest je Referenz das Mosaik-Nahbild (`public/ezarri/<kollektion>/mos-…-600.webp`).
  - Ablauf: 200 px, Median 5 px (entfernt die Fugen), k-means k = 6 in CIELAB mit deterministischem Start, Cluster mit ΔE < 9 zusammengelegt.
  - Ergebnis: ≤ 5 Steinfarben mit Flächenanteil. Seltene Akzentsteine (z. B. Gold in Space) bleiben ab 1,5 %, wenn ΔE > 25.
  - Corner/Cove-Fotos sind freigestellt. Sie bekommen die Farben ihres Grundmosaiks bzw. werden ohne weißen Hintergrund gemessen.
  - Ausgabe: `measured-colors.json` (27 KB, 402 Referenzen). Geprüft mit Kontaktbögen Foto gegen Palette.
- **Patterns:** Dasselbe Werkzeug liest aus den 20 Pattern-Vorschaubildern (296 px) das Steinraster. Fugenprofil per 2. Ableitung, Rasterweite subpixelgenau, je Stein Median der Mitte, auf die kleinste Wiederholung gekürzt.
  - Die Kanalzahl stimmt bei allen 20 Patterns mit Ezarris `kanaele` überein (Test).
  - Ausgabe: `patterns.json`.
- **Im Shader:** Je Stein werden über einen Hash Mischungs-Eintrag und Steinfarbe nach Flächenanteil gewählt, dazu ±3 % Helligkeit. Die Fase entsteht als Normalenstörung, die Fuge liegt vertieft.
  - Kantenglättung nach Bildschirmgröße des Steins: Unter ca. 3 px je Stein wird die Fuge anteilig beigemischt, so gibt es kein Flimmern.
- **Bewusst nicht gemacht:** keine Kacheltextur aus den Produktfotos als Ganzes, weil Perspektive, Lichtverlauf und Fugenfarbe im Foto stecken und Mischungen nicht möglich wären. In `public/ezarri/texturen/` liegt nur das eigene Poster (§3a).

## 3a. Szene und Umgebung (QM Runde 1, P1-3)

- **Umgebung statt Endlosboden** (`umgebung.js`, nur im Lazy-Chunk):
  - Terrasse aus 60er-Platten, begrenzt (2,2 m um den Beckenkopf, Whirlpool 1,5 m), mit 10 cm Kante und Fase zum Rasen.
  - Dahinter Rasen bis zum Ufer, eine Hecke (RoundedBox) an der Rückseite, vier Säulenbäume, See und zwei Bergketten am Horizont, Himmel mit ruhenden Haufenwolken.
  - Die Texturen (Rasen, Laub, Platten) entstehen im Browser aus `<canvas>`. Berge und See sind Shader und folgen dem Himmel, auch abends und nachts.
  - Kein HDRI und kein Download, daher auch keine Lizenzfrage. Es wird kein realer Ort dargestellt.
  - Beim Infinity-Rand liegt das Gelände hinter der Überlaufkante 1,1 m tiefer.
- **Beckenkopf:** 5 cm starke Platte mit gerundeter Kante (Extrude, Fase 1,5 cm), 1,5 cm Überstand ins Becken.
- **Kontaktschatten (AO):** weiche Bänder unter dem Beckenkopf, an der Terrassenkante und unter der Hecke. Keine Shadow-Maps (Budget).
- **Spiegelung:**
  - Eine Würfel-Aufnahme (256 px, HalfFloat) von der Beckenmitte knapp über dem Wasser. Neu erstellt wird sie nur, wenn sich Szene, Maß, Tageszeit, LED oder Wasser ändern.
  - Das Wasser spiegelt Himmel, Hecke, Terrasse und Berge mit Fresnel. Die Normalen haben 4 Lagen.
  - Dieselbe Aufnahme dient als Umgebungslicht (PMREM) für Glanz, Spiegel und Perlmutt der Steine.
- **Kamera:** Die Übersicht steht erhöht am flachen Ende (8 × 4 m: 2,3 m Augenhöhe, ca. 15° Neigung), mit Blick über die Wasserlinie und dem Horizont im oberen Drittel. Der Bildwinkel passt sich an (waagrecht mindestens ca. 52°, senkrecht 42–60°), damit schmale mobile Bühnen das Becken nicht anschneiden.
- **Poster:**
  - `tools/poster.mjs` rendert den Startentwurf (960 × 840, Wasser ruhig) nach `public/ezarri/texturen/poster-start-960.webp` (42 KB) und schreibt den Schlüssel des Entwurfs nach `poster.json`.
  - Die Bühne zeigt das Poster nur, wenn der Zustand genau dem Startentwurf entspricht.
  - Ein Unit-Test prüft den Schlüssel. Nach Änderungen an Szene oder Startentwurf das Werkzeug erneut laufen lassen.
- **Budget:** Die Umgebung bringt keinen zusätzlichen Transfer. Erst-3D mobil besteht aus dem 3D-Chunk (three, R3F, OrbitControls, RoundedBox) und dem Teilkatalog. Gemessene Produktionswerte stehen aus (§8).
- **Vorher/Nachher:** `qa-screenshots/ezarri/konfigurator/qa1/flow-desktop-04b-3d-stage.png` (vorher), `qa-screenshots/ezarri/konfigurator/fix1/` (nachher).

## 4. Dateien

| Datei | Inhalt |
|---|---|
| `src/app/[locale]/ezarri/konfigurator/page.js` | Seite. Liest `?k=`, `?m=` (Konfigurator- oder Referenz-ID), `?ref=`, `?szene=`. Metadaten über `ezarriMetadata` (Team A) bzw. `withEzarriRobots`, nur `de` |
| `…/konfigurator/blatt/page.js` | Druckblatt mit QR (qrcode, Fehlerkorrektur L), immer noindex |
| `…/konfigurator/katalog/route.js` | GET: voller Katalog als JSON, `X-Robots-Tag: noindex`, Cache 1 h / 1 Tag |
| `src/components/Ezarri/Konfigurator/Konfigurator.js` | Insel: Zustand (useReducer und Verlauf), Tabs, alle Steuerelemente, Link-Sync, Tastenkürzel |
| `Stage.js` | Bühne: 2D sofort, 3D lazy (`next/dynamic`, `ssr:false`), Fehlergrenze, Kontextverlust, Tastatur, Touch-Sperre, Vorher/Nachher, Kamerapunkte |
| `Stage3D.js`, `buildScene.js` | nur Lazy-Chunk: R3F-Canvas (`frameloop="demand"`, dpr fest 1,25/1,5), Szene aus `geometry.js`, Licht und Umgebung (PMREM aus dem Himmel), Wasser 30 fps nur sichtbar, Snapshot, GLB-Export |
| `Preview2D.js`, `Picker.js`, `MixBand.js`, `Mengen.js`, `controls.js`, `ArAnsicht.js`, `BlattBild.js` | 2D-Vorschau, Auswahl, Anteilsband, Mengen, Bedienelemente, AR, Bild im Druckblatt |
| `PosterVorschau.js` | Schräge Vorschau ohne 3D: Poster mit der aktuellen Palette eingefärbt (QM R2 P2-1) |
| `umgebung.js` | Terrasse, Rasen, Hecke, Bäume, See, Berge (prozedural, Lazy-Chunk) |
| `src/lib/ezarri/konfigurator/safe-varianten.js` | Rein: leitet die 55 Safe-Varianten (`?as-25`/`?as-50`) aus `references.json` ab. Team A/C können sie übernehmen, damit Welt, Rechner und Konfigurator dieselbe Liste zeigen |
| `src/lib/ezarri/konfigurator/standbild.js` | Standbild der 3D-Ansicht für das Blatt (localStorage, ein Platz) |
| `poster.json`, `tools/poster.mjs`, `public/ezarri/texturen/poster-start-960.webp`, `poster-basis-720.webp`, `poster-gain-720.webp` | Poster des Startentwurfs und Masken für die eingefärbte Vorschau |
| `src/lib/ezarri/konfigurator/state.js` | Vertrag §7.4 Nr. 1: Schema v1, `encodeState`/`decodeState`/`DEFAULT_STATE`, Grenzen, Verlauf |
| `mix.js` | Vertrag §7.4 Nr. 4: `normalizeMix`, `canMix`, `addToMix`, `setShare`, `setBoundary`, `cellAssignment` |
| `geometry.js` | Vertrag §7.4 Nr. 2: `outline`, `depthAt`, `steps`, `bench`, `areas`, `cameraPresets` |
| `preview2d.js` | Vertrag §7.4 Nr. 4: `drawMosaic`, `drawPlan`, `throughWater`, `materialSet` |
| `katalog.js` (server-only), `katalog-index.js` | Projektion der 402 Referenzen plus 55 Safe-Varianten und Nachschlagen (`resolveRef`, `isMixable`, `formatsOf`, `spezialFuer`) |
| `shader/mosaic.js` | Mosaik-Material, Wasser, Himmel, Tageszeiten, LED |
| `copy.js` | deutsche Texte (en/fr/it als Vorschlag `ezarri.b.*` in `ezarri-messages-vorschlag.json`) |
| `measured-colors.json`, `patterns.json`, `tools/messen.mjs` | gemessene Daten und Werkzeug |
| `tests/unit/ezarri-konfigurator.test.mjs`, `tests/e2e/ezarri-konfigurator.spec.js`, `tests/e2e/ezarri-konfigurator-iphone.spec.js` | Tests |

Genutzt, nicht geändert: `data.js`, `config.js`, `facets.js` (Team A), `copy.js` `NEUTRAL_CLAIM` (A), `Welt/meta.js` `ezarriMetadata`, `Welt/parts.js` `ezCrumbs` (A), `rechner/core.js` `quantities`/`formatZahl` (C), `Anfrage/AnfrageLink.js` `anfrageHref` (C). Rahmen und LocalNav kommen aus `ezarri/layout.js` (A).

## 5. Verträge – Hinweise für Team A und C

- **Mosaik-ID im Zustand** (`mix[].id`, `kanaele[].id`, `pattern.ids`) ist die Konfigurator-ID (z. B. `"38"`). Das Format steht einmal in `format`.
  - Referenzen ohne Konfigurator-Daten (31 Stück, z. B. `hematite`, Standard Pixel, Fading out) tragen ihre Referenz-ID.
  - **Team C:** `fromKonfigurator()` filtert heute auf `/^\d{1,4}$/` und lässt diese weg. Bitte auch Referenz-IDs annehmen.
  - Neu und optional: `mix[].ref` = genau gewählte Referenz (z. B. Safe-Ausführung).
- **Additive Felder v1:** `modus`, `pattern {id, ids}`, `wasserton`, `kamera`, `seed`, `spezial.cornerId/coveId`, `mix[].ref`, `kanaele[].ref`. Kein Feld wurde umbenannt.
- **Link-Länge:** Ein üblicher Entwurf (Mischung aus 4, Spezialteile) bleibt ≤ 600 Zeichen. Ein Maximalentwurf (4 Mosaike, 3 Kanäle, Pattern, Teile-IDs) kommt auf bis zu 923 Zeichen (Test ≤ 1000).
  - Abweichung vom Konzept, weil das lesbare JSON für Team C wichtiger ist.
  - Der QR-Code auf dem Blatt nutzt deshalb Fehlerkorrektur L.
- **Einstiege von A:** `/ezarri/konfigurator?m=<konf-id|ref-id>` oder `?ref=<ref-id>`, außerdem `konfiguratorHref()` von A (nutzt `encodeState`) und `?szene=whirlpool|bad|kueche`.
- **`geometry.areas(becken, szene)`:** Der zweite Parameter ist dazugekommen (Standard `"pool"`). Das Flächenmodell entspricht Ezarri und Team C. Prüfwert 10 × 5 × 1/2 m ergibt 95 m² netto, 106 m² bestellt, 265 kg Kleber und 127 kg Fuge (Test).

## 6. Technik, Budget, Barrierefreiheit

- **Initial:** keine three-, R3F- oder model-viewer-Importe in den Insel-Modulen (Test). Die Quellen der Insel-Module sind ca. 48 KB gzip (unminifiziert), Budget 230 KB.
  - 3D-Chunk: three, R3F und OrbitControls aus `three/examples`, ohne drei.
  - Gemessene Produktionswerte stehen aus, weil `npm run build` im Repo nicht erlaubt ist (→ `check:prod`).
- **LCP:** H1 und Text. Es gibt kein Poster-Bild, die 2D-Vorschau zeichnet nach der Hydrierung. Bilder nur in der Auswahl (600er AVIF, lazy, die ersten 9 eager).
- **Render:** `frameloop="demand"`, keine Shadow-Maps, < 20 k Dreiecke, feste dpr.
  - Bei Kontextverlust und bei Fehlern im 3D-Chunk erscheint die 2D-Ansicht mit „3D erneut laden“.
  - Reduzierte Bewegung (System oder „Ruhige Ansicht“): Wasser und Kaustik stehen still, die Kamera springt.
- **Barrierefreiheit:**
  - Native Radios und Checkboxen, Tabs nach WAI-ARIA (Pfeile, Pos1, Ende), Anteilsgrenzen als `slider`.
  - Alle Ziehgesten haben Alternativen: Zahlenfeld, ±-Knöpfe, Schieber, Tastatur.
  - Trefferflächen ≥ 44 px, Fokus global (globals.css), Textgrößen ≥ 12 px.
  - Farben nur über Tokens. Die Hex-Werte der Swatches kommen aus Daten (`--swatch`).
- **Recht:**
  - Keine Händler-Aussage (Test, Lint), Seiten-Fußzeile mit `NEUTRAL_CLAIM`.
  - Keine Preise, Quellenangaben an Bildern, Daten und Blatt, Herstellerangaben als „laut Ezarri“. Die Verlegung macht ein Fachbetrieb.
  - Es werden keine Daten an den Server gesendet. Ausnahme ist das Nachladen des Katalogs, das keine Personendaten enthält.

## 7. Tests und Prüfung

- **Unit** `tests/unit/ezarri-konfigurator.test.mjs`: 15 Tests, grün.
  - Codec und Version, Grenzen, Verlauf.
  - Lesbarkeit für Team C (`fromKonfigurator`).
  - Mischregeln, Zuteilung und Ezarri-Prüfwert.
  - Alle Formen, Treppen und Szenen.
  - Alle 402 Referenzen mit Farbe und Bilddatei, alle 201 Konfigurator-Mosaike auflösbar, Rezepte, Patterns.
  - Größe des Teil- und Vollkatalogs.
  - 2D-Renderer, Robots, Händler- und Preisfreiheit, Lazy-Grenze, Ordnernamen.
- **E2E Desktop** `tests/e2e/ezarri-konfigurator.spec.js` (9 Tests): Laden, noindex, Konsole, 375 px, Tastatur, Mischung mit Link-Wiederherstellung, ohne WebGL, Musterlink ohne Senden, Druckblatt, Katalog-Route, 3D lazy.
- **E2E iPhone** `tests/e2e/ezarri-konfigurator-iphone.spec.js` (2 Tests, WebKit): Tippen, Auswahl, Mengen, Überlauf, 3D auf Tippen, Touch-Sperre.
- Ergebnisse dieser Runde: siehe §9.
- Screenshots: `qa-screenshots/ezarri/konfigurator/selbst/` (shoot.mjs).

## 8. Offene Punkte

1. **Fehlende Ezarri-Mosaike nachladen (P1-1, Schritt 1):**
   - Im Konfigurator-Abzug fehlen die IDs 0, 66, 67, 133, 134, 135 und 136.
   - Ezarri liefert sie nur über die sitzungsgebundene Konfigurator-Schnittstelle (`shared/funciones_Ezarri.php`, `modo=carga_modelos`). Ein Aufruf ohne Filter liefert eine leere Antwort. Die Parameter stehen nur im verschleierten Ezarri-Skript, und das Entschlüsseln haben wir bewusst unterlassen.
   - Bitte über den Ezarri-Kontakt die Rezeptur-Bestandteile oder einen Datenexport anfragen und danach in `configurator.json` (Team A) und `measured-colors.json` ergänzen. Die 14 Einträge wechseln dann automatisch in die Gruppe „Rezept laut Ezarri“ (Test).
2. **Dune Cove:**
   - Ezarris Meta-Text nennt „Corner und Cove“. Eine Cove-Seite für Dune gibt es aber nicht: `/de|en|es/cove-dune` liefert 404 und steht in keiner Sitemap. Die Produktseite nennt nur „Corner“.
   - Wir führen deshalb kein Dune-Cove. Wählbar ist ein anderes Cove-Teil über „Cove wählen“.
   - Bitte bei Ezarri klären.
3. **Kaputte Ezarri-Links:**
   - `2508-a-50`, `2560-a-50`, `2596-b-50` und `azur-50` stehen in der Ezarri-Sitemap, liefern aber eine leere Seite.
   - Die Slugs `de?as-25` und `de?as-50` auf grit und limestone sind fehlerhaft.
   - Davon übernehmen wir nichts.
4. **AR auf echtem iPhone und Android prüfen.** Der GLB-Export läuft, Quick Look und Scene Viewer sind nicht geprüft, weil kein Gerät verfügbar war.
5. **Team C:** In `fromKonfigurator()` auch Nicht-Zahl-IDs (Referenz-IDs) annehmen (§5).
6. **Produktionsmessung (P2-7):**
   - Gemessen werden sollen JS-Initial ohne three.js, 3D-Chunk und LCP mobil (Ziel ≤ 2,0 s).
   - Mit `check:prod` durch den Teamleiter, auf den Pfaden `/de/ezarri/konfigurator` und `/de/ezarri/konfigurator/blatt`. In Dev sind die Werte nicht aussagekräftig.
   - LCP-Kandidat mobil ist jetzt das Poster (42 KB, `fetchpriority=high`, im SSR-HTML).
7. **Team A/C:**
   - Die Safe-Varianten stehen nur im Konfigurator-Katalog. Welt und Rechner können `safeVarianten()` übernehmen (rein, ohne Imports).
   - Anfragen laufen über die Produktseite (`basis`, z. B. `dune`). Der Entwurf mit „Safe“ steckt in `k`.
8. **Echte Poolfotos vom Inhaber** für einen Abgleich der Farbwirkung (Wasser, Bildschirm). Der Hinweis „Farben sind Annäherung, Muster ansehen“ steht auf Seite und Blatt.
9. **Phase 2 laut Konzept:** Fotomontage auf ein eigenes Poolfoto (Ordner `foto-montage/`) und `public/ezarri/texturen/` für Detail-Normalmaps.
10. Wird `EZARRI_PUBLIC` auf `true` gesetzt: Konfigurator indexierbar, mit `?k=`/`?m=` `noindex, follow`. JSON-LD WebApplication ist bewusst weggelassen (Konzept §6.2 „lieber weglassen“).

## 9. Prüfprotokoll dieser Runde

- **Unit:** `ezarri-konfigurator.test.mjs` 15/15 grün.
  - Gesamte Suite 1135/1146 grün, 2 rot, beide fremd: Übernahme der messages-Vorschläge (redesign/teamleiter) und `upload-messages-vorschlag`.
- **E2E** mit `PW_WORKERS=1`, Desktop-Projekt: 11/11 grün (Desktop 9, iPhone/WebKit 2).
  - Das Druckblatt war 1× flaky: `page.goto`-Timeout im ausgelasteten Dev-Server, beim Retry grün.
  - Ein früherer Lauf brach mit ENOENT in `qa-screenshots/teamleiter/tests-results` ab, weil ein paralleler Lauf eines anderen Teams den Ordner geleert hatte. Deshalb nutzen die Läufe einen eigenen Ordner: `PW_OUTPUT_DIR=qa-screenshots/ezarri/konfigurator/pw-results`.
- **shoot.mjs:** `qa-screenshots/ezarri/konfigurator/selbst/`. iPhone, Pixel, iPad und Desktop mit Status 200, 0 Konsolenfehler, 0 fehlgeschlagene Requests, kein Querscroll.
  - Bei hoher Last des Dev-Servers liefen Chunks in WebKit zeitweise in Timeouts (betraf alle Seiten). Später lief es sauber.
- **Visuell geprüft (Playwright-Bilder):**
  - Pool: Übersicht, römische Treppe, unter Wasser, Nacht mit LED türkis, Abend.
  - Mischung 50/50, Pattern, Whirlpool, Duschnische, Küche, runde Enden mit Infinity-Kante.
  - Mengen, Auswahl, Druckblatt mit Druckansicht.
  - Mobil: Bühne angeheftet, 3D auf Tippen mit „Ansicht bewegen“, Auswahl als Vollbild.
- **Lint** (eslint) für alle eigenen Dateien: 0 Fehler. Begründete Ausnahmen wie in Yacht/Concierge: three-Objekte sind veränderlich, setState beim Mount für Browser-Prüfungen.
- `check:claims`: 0 Händler-Verstöße. Ein fremder Superlativ steht im Sofaplaner.

## 10. QM Runde 1 – Umsetzung (28.10.2026)

Bericht: `qa-screenshots/ezarri/konfigurator/feedback-1.md`, Nachweise in `qa-screenshots/ezarri/konfigurator/fix1/`.

| Punkt | Stand |
|---|---|
| P1-1 Rezepte verfälscht | Behoben. Kein Hochrechnen mehr: 43 Rezepte mit Ezarris Anteilen 1:1. 14 unvollständige zeigen die Ezarri-Referenz nach Produktfoto mit Hinweis, z. B. Mojito als Referenz `mojito`. Unit-Test sichert das ab. **Offen:** die 7 fehlenden Mosaike nachladen (§8 Nr. 1) |
| P1-2 Safe-Varianten | Behoben. Alle Produktseiten-Varianten `?as-25`/`?as-50` ausgewertet, ergibt 55 neue Einträge `typ: "safe-step"` mit `quelle`, darunter Dune 25/50 Safe und Ash 25 Safe. Zählung 402 + 55 = 457 in Doku und Tests. Ein Dune-Cove gibt es bei Ezarri nicht (§8 Nr. 2) |
| P1-3 CAD-Optik | Behoben (§3a): Umgebung mit Himmel und Wolken, See, Bergen und Hecke, begrenzte Terrasse, Beckenkopf mit Fase, Kontaktschatten, Spiegelung der Umgebung im Wasser, neue Startkamera. Poster mobil (42 KB). Aufnahmen: `fix1/de-ezarri-konfigurator--iphone.png`, `fix1/flow-android-04b-3d-stage.png`, `fix1/flow-blatt-direkt-bild.png` |
| P2-1 Fokus nach Esc | Behoben. Auslöser wird gemerkt und nach Esc oder Auswahl wieder fokussiert (E2E) |
| P2-2 „Muster“ doppelt | Behoben. Der Einstieg heißt jetzt „Motiv-Raster“, `ezarri.b.modus.pattern` ist im Vorschlag nachgezogen |
| P2-3 Auswahl mobil | Behoben. 3 Spalten, Text 2-zeilig, Farb-Chips scrollen mit Verlauf als Hinweis (E2E prüft die Spaltenzahl) |
| P2-4 Bühne verdeckt Unterleiste | Behoben. Am Desktop `z-0`, die Unterleiste bleibt darüber. `scroll-padding` oben (Bühne) und unten (schwebender KI-Knopf) nur auf dieser Seite, dazu `scroll-margin` an den Abschnitten |
| P2-5 Blatt ohne 3D | Behoben. Das Standbild liegt in localStorage, sonst rendert das Blatt die Szene selbst (`fix1/flow-desktop-blatt.png`). Interne ID entfernt, Corner/Cove-lfm und Streifen stehen auf dem Blatt |
| P2-6 Tests | Behoben. `domcontentloaded` mit `[data-ezk-ready]`. Der Link-Test wartet auf den aktuellen `k`, nicht auf irgendeinen. Mischungstest unter 1024 px, damit kein 3D-Erstkompilat neu lädt |
| P2-7 Ladezeit | **Offen**, `check:prod` über den Teamleiter (§8 Nr. 6) |
| P3 | `key={img}` am Vorschaubild (WebKit), eigener Bestätigungsdialog statt `window.confirm`, `fetchpriority=high` und `sizes` für die ersten 9 Kacheln. Legende „Treppe“ im 2D-Plan und Undo-Hinweis noch offen |

Prüfung dieser Runde:
- Unit `ezarri-konfigurator.test.mjs`: 19/19 grün (4 Tests neu).
- Gesamtsuite: 1174/1182. Die 4 roten Tests sind fremd: Messages-Übernahme redesign/teamleiter, `upload-messages-vorschlag` und zwei Live-Tests Marke × Kategorie.
- E2E (`PW_WORKERS=1`, `--retries=0`): 13/13 grün (Desktop 11 mit 2 neuen Tests, iPhone 2).
- shoot.mjs: alle 4 Geräte mit Status 200, 0 Konsolenfehler, kein Querscroll.
- eslint: 0 Fehler.

An den Teamleiter (nicht Team B):
- `src/lib/features.js`: der Ezarri-Menüeintrag trotz `EZARRI_PUBLIC=false`.
- Concierge-Knopf: Der Konfigurator reserviert jetzt `scroll-padding-bottom`. Das Einklappen auf `/ezarri/konfigurator` bleibt Sache des Concierge-Teams.

## 11. QM Runde 2 – Umsetzung (28.10.2026)

Bericht: `qa-screenshots/ezarri/konfigurator/feedback-2.md`. Nachweise liegen in `qa-screenshots/ezarri/konfigurator/fix2/`, Vorher/Nachher der Szene in `fix2/selbst/`.

| Punkt | Stand |
|---|---|
| P2-1 Mobil zurück auf 2D | Behoben. Nach der ersten Nutzeraktion (Auswahl, Rezept, Reiter; Stage-Prop `aktion`) startet 3D von selbst, wenn WebGL 2 vorhanden ist, „Daten sparen“ aus ist und keine reduzierte Bewegung gewünscht ist. Die Touch-Sperre bleibt. Ohne 3D und während des Ladens zeigt die Bühne statt der Draufsicht die **schräge Vorschau** (`PosterVorschau.js`): das Poster, eingefärbt mit der aktuellen Palette, mit dem Hinweis „Vorschau, für 3D tippen“. Das Verfahren: `tools/poster.mjs` rendert die Startszene zusätzlich mit schwarzem und weißem Mosaik (Hook `window.__ezkPosterMaske`, nur für das Werkzeug). Gespeichert werden Basis (16 KB) und Gain (14 KB), die Formel lautet Basis + Gain × Farbe. Die Vorschau gilt nur, solange Szene, Becken, Licht, Wasser und Kamera dem Start entsprechen, sonst bleibt es bei 2D. Die Masken werden erst geladen, wenn sie gebraucht werden. Aufnahmen: `fix2/android-rm1-01-nach-pick.png` (Vorschau), `fix2/iphone-rm0-02-3d.png` (3D startet selbst) |
| P2-2 Fokus iPhone | Behoben. `openPicker(trigger, target)` bekommt `event.currentTarget` statt `document.activeElement`, MixBand reicht den Austausch-Knopf weiter. Fokus mit `preventScroll`. Der neue iPhone-Test prüft das |
| P2-3 Ölfilm auf dem Wasser | Behoben. Normalen-Stärke wird bei flachem Blick gedämpft, die Spiegelrichtung nicht unter den Horizont gekippt, die Spiegelfarbe nach unten auf die Horizontfarbe geklammert, der Sonnenglanz begrenzt und neutraler. Vorher/Nachher: `selbst/vorher-wasserlinie-mittag.png` und `selbst/nachher-wasserlinie-mittag.png` |
| P2-4 Szene | Behoben. Rasen mit Farbrauschen, warmen Stellen und Luftperspektive (`belebe()` in `umgebung.js`, reiner Shader). Berge mit Graten und Struktur in drei gestaffelten, nach hinten blasseren Schichten, dazu zwei Staffeln Richtung −x. See mit windstillen Glanzstreifen und Sonnenglitzern. Hecke mit Kern- und Halbschatten und Abdunklung nach unten, Säulenbäume mit Laubbüscheln statt Zylinder. Wasserlinie: feuchter, dunklerer Streifen über dem Wasser und ein 1–2 Steine breiter Rand (Mosaik-Shader v2). Startkamera tiefer und näher, von der tiefen Ecke zur römischen Treppe; Infinity blickt weiterhin über die Kante zum See. Poster neu gerendert (64 KB). 0 Byte zusätzlicher Download, mobil kommen nur die beiden Masken dazu (30 KB, bei Bedarf). fps auf einem echten Pixel 7 ist nicht gemessen |
| P2-5 Bühne verdeckt die Auswahl | Behoben. Nach `closePicker` wird die Überschrift des Blocks unter die angeheftete Bühne geholt. Gerechnet wird mit `top` + Höhe des Bühnen-Containers `[data-ezk-buehne]`, nicht mit `scrollIntoView`: Das `scroll-padding` der Seite und das `scroll-margin` des Blocks hätten sich sonst addiert, und die Überschrift wäre unterhalb des Bildschirms gelandet |
| P3 Rezept-Hinweis | Behoben. Bei `fehlend: ["Anteile"]` erscheint jetzt ein eigener Text („widersprüchlich … nach Produktfoto“). Alexander Gold (99 %) wird normalisiert: Der größte Anteil bekommt +1, das Rezept ist mit `normalisiert: true` markiert (kommentiert und im Unit-Test geprüft) |
| P3 Druckblatt | Behoben. Bei einem Foto-Rezept steht in der Mosaik-Zeile „Darstellung nach Produktfoto (Grund)“ |
| P3 MixBand | Behoben. Unter 12 % entfällt die Beschriftung, stattdessen gibt es einen `title`. Kein Umbruch mehr (`whitespace-nowrap`) |
| P3 Picker Desktop | Behoben. Die ersten 9 Kacheln werden per `<picture>` vorgeladen, sobald man über „Anderes Mosaik wählen“ fährt oder es fokussiert. Der Browser wählt dabei dieselbe AVIF wie im Picker |
| P3 erster 3D-Frame | `onReady` kommt jetzt erst nach 3 gezeichneten Frames und 2 rAF. In eigenen Aufnahmen ist die Bühne vollständig. Im shoot.mjs-Desktopbild (Bühne nur teilweise im Bild) bleibt die obere Hälfte weiterhin beige. Ich halte das für einen Effekt der Headless-Aufnahme einer teilweise sichtbaren WebGL-Canvas. Bestätigt ist das nicht, der Punkt bleibt **offen** zur Gegenprüfung |
| P3 Breadcrumbs target-size | Nicht in Team B. Liegt in `src/components/ui/Breadcrumbs.js`, zum Teamleiter |
| P3 aus Runde 1 | Behoben. Legende zur Treppe im 2D-Plan (ab `sm`), Tooltips „Nichts rückgängig zu machen“ und „Nichts zu wiederholen“ |

Prüfung:
- Unit: 20/20 grün (1 neuer Test: Masken ≤ 40 KB, Kamerarichtung).
- E2E (`PW_WORKERS=1`, `--retries=0`): 14/14 grün, davon 1 neuer iPhone-Test. Ein Lauf brach mit ENOENT im Trace-Ordner `qa-screenshots/teamleiter` ab (fremd); der Nachlauf war grün (`fix2/pw-run.log`).
- Eigene Abläufe auf Android und iPhone: 0 POST, 0 Seitenfehler.
- shoot.mjs: 4 Geräte mit Status 200, 0 Konsolenfehler, 0 fehlgeschlagene Requests, kein Querscroll.
- eslint: 0 Fehler.

Neue Texte stehen als Vorschlag in `ezarri-messages-vorschlag.json` (`ezarri.b.stage.*`, `ezarri.b.legende.*`, `ezarri.b.rezept.*`, `ezarri.b.blatt.*`).
