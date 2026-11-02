# Feature: /de/yacht-interior – Signature „Die Werfthalle" (Umsetzung)

**Stand:** 28.10.2026 (Fix 2) · Team „Yacht-Interior Signature" · Branch `feature/neuauftritt` (nicht committet)
**Grundlagen:** [yacht-signature-konzept.md](yacht-signature-konzept.md) · [yacht-renderings.md](yacht-renderings.md) · [yacht-landingpage.md](yacht-landingpage.md) · Bericht 29 §8 · Design-Bibel §7, §8, §13, §14

## Seitenablauf

| # | Kapitel | Umsetzung |
|---|---|---|
| 0 | Hero | dunkel (`ink-deep`), H1 „Yacht Interior am Bodensee", Leitsatz, 1 Primärknopf, Zweitknopf „Boot in 3D ansehen". **Kein Foto**, eigene SVG-**Bühne** aus dem Boot-Generator (Daycruiser auf dem Abendsee): viewBox umschließt das ganze Boot, `xMidYMid meet`, Himmel/Ufer/Wasser reichen per `overflow: visible` über die viewBox hinaus (keine Leerflächen). Boot zentriert, ≈ 73 % der Bühnenbreite (768–1920 px). Bühne ≥ 60svh ab md, auf Handys 34svh (≤ 40svh) **direkt nach H1 und Leitsatz**, dann Lead und Knöpfe → Wasserlinie und Boot im ersten Screen. Signature: Linien zeichnen sich einmal (`stroke-dashoffset`, `pathLength=1`), Spiegelung im Wasser blendet ein, Fenster „gehen an" beim Scrollen (`animation-timeline: scroll()`, sonst zeitgesteuert), Uferlichter. Reduced Motion: alles statisch. 0 KB Client-JS |
| 1 | Prolog | „Ein Boot ist ein Wohnraum mit eigenen Regeln": Gewicht · Feuchte und Sonne · Bewegung. (Das frühere Filmband ist entfallen – sein Bild stand doppelt auf der Seite, QA-Runde 1 P2.1.) |
| 2 | **Sechs Boote, sechs Welten** (Höhepunkt 1) | `WorldsChapter.js`: je Konzept ein KI-Rendering vollflächig mit Nummer, Bootstyp, Konzeptname, Leitsatz, Link zum Konzept, KI-Etikett auf jedem Bild, **keine Produkt-Hotspots**. ≥ 768 px: Sticky-Bühne 100svh, 6 Scroll-Schritte (IntersectionObserver), Überblendung Opacity + langsamer Scale (1,2 s / 2,4 s), Schrittleiste rechts (Sprung zu jeder Welt). < 768 px: Embla-Karussell in voller Breite mit Vor/Zurück und Zähler. Reduced Motion, „Ruhige Ansicht" und ohne JS: einfache Bildfolge. LQIP (24-px-WebP + Mittelfarbe) gegen leere Flächen |
| 3 | **Werfthalle** (Höhepunkt 2) | 6 Bootstypen (Radiogroup), Zonen-Knöpfe mit Produktzahl (Zonen ohne Produkte gestrichelt mit Hinweis-Icon; im Blatt „Sache von Bootssattler und Werft" mit klarem Satz), Tag/Abend-Schalter, Konzeptblatt mit Zonentext, KI-Bild der Zone, Katalogprodukten (Bild, Marke, Link, Eignung, Hinweis), Bootssattler/Werft. 3D lädt erst bei 30 % Sichtbarkeit auf Desktop ≥ 1024 px (nicht bei Save-Data/< 4 GB), sonst per Knopf. Ohne WebGL/bei Kontextverlust: SVG-Längsriss mit denselben Zonen |
| 4 | Sechs Beispielkonzepte | Tabs (WAI-ARIA, Pfeiltasten, `#konzept-<id>`), alle Panels serverseitig im HTML, ohne JS untereinander. Je Konzept: Leitsatz, Stimmung, Badge „Beispielkonzept – kein Kundenprojekt", 2–3 KI-Bilder mit Etikett, Farbwelt, Materialien, Produkte nach Zone, Rollen |
| 5 | Muster und Materialien | die eine Walnuss-Fläche; 6 gezeichnete Muster (CSS, kein Bild) |
| 6 | Kurs durchs Winterlager | Sep–Apr, Gantt-Balken Desktop / Liste mobil, je Schritt Platzhirsch · Bootssattler · Werft (Horizontlinie) |
| 7 | Wer macht was | 3 Spalten |
| 8 | Marken | `BrandShelf.js`: je Marke bis zu 2 **echte Produktbilder** aus den live geprüften Konzeptprodukten (Freisteller zuerst), einheitliche 4:5-Kacheln. An Deck: Paola Lenti, Tuuci · Unter Deck: Minotti, Flos, Treca, Alonpi · Bootshaus: Solpuri, Umbrosa, Heatsail, Poliform, Sifas, Livintwist; Link Outdoorplanung |
| 9 | Revier, FAQ (9 Fragen, FAQPage-JSON-LD), Termin | |

## 3D „Werfthalle"

- **Ein Generator** (`src/lib/yacht/hull.js`, rein, testbar): Rumpf aus 40 Spanten × 31 Punkten (Superellipse, Sprung, Kielsprung, Spiegelheck), Deck als Streifen mit Teak-Textur (Canvas, 256²), Aufbauten/Möbel als abgerundete Boxen. 6 Typen inkl. Kiel und Mast (Segelyacht), Ponton (Hausboot), 3 Decks + Beach Club (Superyacht). Das Boot steht auf Böcken in der Halle, Steg optional (Zone „Steg & Bootshaus").
- **Möbel = einfache Silhouetten** (seit QA-Runde 1): Sofa/Bank mit Sockel, Sitz- und Rückenkissen, Armlehnen und Zierkissen; Bett mit Sockel, Matratze, Kopfteil, zwei Kissen, Decke und Plaid; Tisch mit Platte, Säule und Fußplatte; Stühle; Liegen mit hochgestelltem Rücken; Sonnenpolster mit Kissen; Bad mit Waschtisch und Duschglas; Akku-Leuchten. Low-Poly, Konzeptfarben, generische Archetypen – keine Nachbauten (Bibel §14).
- **Licht:** lokale `RoomEnvironment` (kein HDR vom CDN), `ContactShadows` unter Boot und Böcken, Polster/Leinen `meshPhysicalMaterial` mit Sheen (roughness 0,95), Holz 0,55, Teak 0,75, Lack mit Clearcoat. Abendlicht: warme 2.700-K-Punktlichter **in den Akku-Leuchten** (max. 8), Leuchtschirme emissiv.
- **Kamera je Zone aus der Geometrie:** jede Möbelgruppe trägt ihre Zone (`zone`), daraus entsteht ein Raumkasten (`rooms`); `cameraFor` setzt die Kamera so, dass der Raum ≈ 70–80 % der Bühne füllt – bei Salon/Kabine/Bad im Schrägblick 48°, offene Zonen 32°, nie Draufsicht. Kabinen-/Bad-Schnitt der Motoryacht liegt jetzt 1,25 m über dem Boden (vorher auf Hauptdeckhöhe).
- **Labels ohne Überlappung:** Bildschirmprojektion je Frame, Platzierung nach Priorität (aktive Zone zuerst); überlappende Labels schrumpfen auf ihren Punkt. Mit aktiver Zone zeigt nur sie Text; in der Übersicht auf Handys höchstens drei. Das SVG-Poster versetzt Labels unter Deck abwechselnd in der Höhe.
- **Bühne:** Handy 1:1 (Fix 2, vorher 4:5), ab 640 px 4:3, ab 1024 px 16:9. Handy-Übersicht: Boot mittig, ≈ 85–95 % der Breite (`cameraFor`, Hochformat-Zweig). Touch-Hinweis „Zwei Finger: drehen und zoomen" (ein Finger scrollt die Seite).
- **Schnittmodell (seit Fix 2 ohne Clipping-Planes):** Bei Salon, Kabine und Bad werden Teile über `cutY` ausgeblendet und kreuzende Teile auf `cutY` gekürzt; große Volumen (Aufbau, Haus) werden zu vier Wänden ohne Deckel geöffnet (`sectionParts`). Das Deck ist unter dem Sprung ausgeblendet (`deckVisible`). Der Rumpf ist in zwei Hälften geteilt, die vordere (Kameraseite) ist bei Kabinen unter Deck unsichtbar. Das funktioniert in jedem Renderer. Die Kamera fährt per `CameraControls.setLookAt` (≈ 1 s; mit Reduced Motion ohne Fahrt).
- **Kamera-Presets werden aus der Geometrie berechnet** (`cameraFor`), nicht aus `concepts.json → modelle.*.kamera` (passten nicht zu Flybridge/Superyacht-Höhen; Feld bleibt als Referenz). Hochformat rückt die Kamera weiter weg.
- **Performance:** `frameloop="demand"` (keine Leerlauf-Frames), dpr fest (Touch 1,25, sonst 1,5; der frühere Wechsel per `PerformanceMonitor` auf dpr 1 leerte in WebKit die Bühne), nur Kontaktschatten (keine Shadow-Maps), keine HDRI/CDN (lokale `RoomEnvironment`). < 120 k Dreiecke je Modell (Test). three/R3F/drei nur im Lazy-Chunk; beim Seitenaufruf lädt nur ein ~1 KB Loader-Stub (geprüft).
- **Touch:** ein Finger scrollt die Seite (`touch-action: pan-y`), zwei Finger drehen/zoomen – keine Scroll-Falle.
- **Barrierefreiheit:** Canvas `aria-hidden`; Hotspots am Modell sind Maus/Touch-Komfort (`aria-hidden`, `tabIndex -1`); bedienbar über DOM-Knöpfe, `aria-live`-Satz („Salon – Riviera Abend, Motoryacht: 4 Produkte"), Tastatur auf der Bühne (Pfeile drehen, +/− zoomen, Esc Übersicht). axe: 0 serious/critical.
- drei `<Html>` wurde ersetzt (eigene React-Roots kollidierten beim Unmount mit React 19 → Konsolenfehler); jetzt projiziert `useFrame` DOM-Knöpfe über der Bühne.

## Daten und Regeln

- `src/lib/yacht/model.js` (rein): baut die Konzepte aus `concepts.json` + `renders.json`. **Regel An Deck:** auf Deck/Flybridge/Badeplattform eines Boots nur `aussen-marine-hersteller` (Ausnahme In Vitro Unplugged mit Hinweis „nicht während der Fahrt"); `aussen-katalog` wandert nach „Steg & Bootshaus" (Sifas Kalife, Flos Captain Flint), Wohntextil an Deck entfällt (Alonpi Luberon, Runabout). Hausboot-Terrasse zählt als Terrasse.
- `src/lib/yacht/catalog.js` (server-only): prüft jedes Produkt live im Backoffice (`get_produkte_by_marke_api`, Cache 1 h), übernimmt Bild und Link, lässt inaktive/bildlose Produkte still weg; ist eine Marke nicht erreichbar, bleibt der Schnappschuss.
- `concepts.json` bereinigt: interne Hinweise aus öffentlichen Feldern entfernt („keine Werbeaussage salzwasserfest", „Minotti-Bilder nur unverändert", „Saisonservice", Bericht-Verweis mit „Bauleitung"); „(Token …)" in Farbrollen wird beim Anzeigen entfernt.
- Seitentext: **Gloster entfernt** (0 Produkte), **Tuuci** = „Outdoor-Möbel der Kollektion Bleau … Schirme auf Anfrage", Minotti nur Wohnsortiment/Salon. Kein „Partner", keine Preise/Paketspannen, keine Werft- oder Sattlernamen.
- Herstellerbilder (`ProductTile.js`): einheitlich 4:5. Freisteller (`bildtyp: freisteller` in `concepts.json`, gemessen per Randpixel-Analyse ≥ 90 % weiß) `object-contain` mit 9 % Innenabstand auf Weiß; Stimmungsfotos `object-cover`. **Minotti immer `contain`**, nie beschnitten oder verändert. Liefert das Backoffice ein anderes Bild als den Schnappschuss, gilt neutral `contain`. Ganze Kachel ist der Link (`ph-stretched`).
- Minotti „Lido (Sofas)": Rolle jetzt „Sitzmöbel im Salon – Kollektion Lido, Sofa oder Sessel" (das Katalogbild zeigt Sessel und Hocker).

## Indexierung (Stand 28.10.2026)

**noindex laut Inhaber-Vorgabe 27.10., 23:32, bis Freigabe Minotti und Custom Line** (`yacht-minotti-navetta42-bilder.md`: „Bis zur schriftlichen Freigabe beider bleibt die Seite noindex und Labs-intern").
- `page.js`: `landingMetadata({ …, index: false })` → `<meta name="robots" content="noindex, follow">`.
- `src/lib/seo/sitemap/extraPages.js`: Yacht-Eintrag **entfernt** → nicht in `/sitemap-static.xml` und nicht in `/llms.txt`.
- Tests angepasst: `sitemap.test.mjs` (Yacht nicht in EXTRA_PAGES und nicht in der Live-Sitemap), `llms.test.mjs` (nicht gelistet), `r4-seo.test.mjs` (JSON-LD-Satz bleibt; Baseline-Abgang dokumentiert in `DOCUMENTED_REMOVALS`), `tests/e2e/r4-seo.spec.js` (llms.txt ohne Yacht), `yacht-werfthalle.spec.js` (robots noindex).
- **Rückweg:** beide Dateien gemeinsam zurückstellen – `index: false` in `page.js` entfernen **und** den Eintrag in `extraPages.js` wieder einfügen (llms-Zeile = `schema.description` der Seite), dann die Tests zurückdrehen.
- **Frage an Shell und Teamleiter (keine Team-Datei):** Footer-Link „Yacht-Interior" (`shellNav.js`) und Startseiten-Teaser (`Home/Services.js`) verlinken die Labs-interne Seite weiter. Ob sie bis zur Freigabe ausgeblendet werden, entscheidet die Shell.

## Dateien

- `src/app/[locale]/yacht-interior/page.js` – Texte, Metadaten, live geprüfte Konzepte
- `src/components/Landing/Yacht/YachtLanding.js` – Layout, JSON-LD (WebPage + Service + FAQPage), Welten-Kapitel, Muster, Kurs, Marken
- `src/components/Yacht/` – `YachtHero.js`, `Werfthalle.js` (Insel), `Stage3D.js` (lazy), `PosterSvg.js`, `ConceptGallery.js`, `ConceptTabs.js` (Insel), `ConceptImage.js`, `KiLabel.js`, `yacht.module.css`, neu: `WorldsChapter.js` (Insel, Embla), `BrandShelf.js`, `ProductTile.js`
- `src/lib/yacht/` – `hull.js`, `model.js`, `catalog.js`, `palette.js`, `concepts.json` (bereinigt), `renders.json`
- `src/components/Yacht/NavettaReference.js`, `NavettaFigure.js`, `NavettaCarousel.js` – Referenz Minotti × Custom Line Navetta 42 (Fix 2); Daten und Regeln in `src/lib/yacht/navetta.js`, Rasterregeln in `src/lib/yacht/layout.js`
- Tests: `tests/unit/yacht-concepts.test.mjs` (13), `tests/unit/yacht-fix2.test.mjs` (5), `tests/e2e/yacht-werfthalle.spec.js` (11, Desktop-Projekt, davon 1 im Pixel-7-Viewport)
- Screenshots: `qa-screenshots/erlebnis/yacht/selbst/`, Fix 1: `qa-screenshots/erlebnis/yacht/fix1/`, Fix 2: `qa-screenshots/erlebnis/yacht/fix2/` (shoot.mjs) und `fix2/selbst/` (Abläufe)

## Prüfung

- Unit (Fix 1): yacht 13/13, r3-landing, r3-startseite, r4-seo, concierge-actions, sitemap grün. E2E yacht 8/8 (Desktop). ESLint ohne Befund.
- Unit (Runde 1): yacht 10/10; r3-landing, r4-seo, llms, sitemap, r6-landing, claims, r3-shell, r6-shell-perf, bundle-budget grün. `check-claims` 0 Verstöße. ESLint ohne Befund.
- E2E: smoke `/de/yacht-interior` auf iPhone/Pixel/iPad/Desktop grün, r4-seo Rich Results + llms grün, neue Spec 5/5 (einmal flaky unter Dev-Compile-Last).
- Interaktion (Playwright): Desktop Chromium und iPhone 15 Pro WebKit – alle 6 Typen, Zonen, Schnitt, Abendlicht, Tastatur, Tabs; 0 Konsolenfehler, kein horizontales Überlaufen. 3D bereit nach ~10–18 s **im Dev-Server** (Erst-Kompilierung); Produktionswerte stehen aus (kein `npm run build` erlaubt).

## QA-Runde 1 → Fix 1 (27.10.2026)

Bericht: `qa-screenshots/erlebnis/yacht/feedback-1.md` (6,5/10). Nachprüfung: `qa-screenshots/erlebnis/yacht/fix1/` (shoot.mjs auf iPhone, Android, iPad, Desktop: Status 200, 0 Konsolenfehler, 0 fehlgeschlagene Requests, kein Überlauf; dazu Hero auf 1920, 3D-Zonen, Welten-Kapitel, Marken, Reduced Motion).

| Punkt | Stand |
|---|---|
| P1.1 Hero | behoben – Boot auf allen 5 Geräten vollständig, zentriert (Abweichung < 8 %), 72–73 % Breite; iPad ohne Leerfläche (Wasser/Himmel füllen), Handy: Boot im ersten Screen. E2E-Test „hero stage …" |
| P1.2 3D | behoben – Silhouetten-Möbel, Kontaktschatten, Materialien, Leuchten-Licht, Schrägkamera je Zone, Labels ohne Überlappung, 4:5 auf Handys. Bundle-Grenze/Lazy-Load unverändert (Test) |
| P1.3 Höhepunkt | behoben – Kapitel „Sechs Boote, sechs Welten" (Sticky/Embla/Bildfolge), Marken mit echten Produktbildern |
| P2.1 Bild doppelt | behoben – Filmband entfernt |
| P2.2 Neu-Rendering | behoben – Runabout-Cockpit (Elfenbein mit dunkler Keder) und Riviera-Flybridge (ohne Laternen/Kerzen) neu, als `*-v2-*` mit **C2PA** (Details: yacht-renderings.md §7); `note`-Hinweise in `model.js` entfernt. Nur „Rigg vereinfacht" (Segelyacht) bleibt |
| P2.3 Leere Zonen | behoben – gestrichelt + Icon, Blatt „Sache von Bootssattler und Werft" |
| P2.4 Kacheln | behoben – `ProductTile.js` (siehe Daten und Regeln) |
| P2.5 Performance | **offen** – kein Produktionsbuild erlaubt; Erwartung: LCP Desktop jetzt die H1 (Filmband-Preload entfällt) |
| P2.6 Indexierung | **offen** – Inhaber-Entscheidung, in `inhaber-entscheidungen.md` noch nicht getroffen |
| P3.1 LQIP | erledigt (24-px-WebP + Mittelfarbe in `renders.json`) |
| P3.2 Lido | erledigt (Rolle angepasst) |
| P3.3 Farbwelt | erledigt (unter 480 px 3 + 2 Spalten, Umbruch) |
| P3.4 Kachel-Link | erledigt (ganze Kachel, ≥ 44 px) |
| P3.5 Streifen unter Footer | geprüft: **global** (Startseite hat denselben ~100-px-Streifen) → Shell-Team |
| P3.6 Touch-Hinweis | erledigt („Zwei Finger: drehen und zoomen", auch auf Handys sichtbar; ein Finger scrollt bewusst die Seite) |

### Fix 1 – erneute Prüfung (28.10.2026, „nochmals")

Der Code enthielt bereits angefangene Arbeit aus QA-Runde 2 (Zonen-Vorschau im Konzeptblatt, Raycast-Kamera `viewBlocked`, eigenes Bad, Poster-Standbilder). Dabei waren drei Dinge rot bzw. kaputt; sie sind jetzt behoben:

- **Unit-Test rot:** Die Kamera der Innenzonen startete bei 56° (Test und QA 1 verlangen 35–50°). `cameraFor` probiert jetzt zuerst **45°** und wird nur steiler, wenn der Raycast etwas vor dem Raum findet. yacht 13/13 grün.
- **E2E rot (3 von 8):** Die Zonen-Vorschau wiederholt die Zonenknöpfe, daher waren `getByRole("button", /^Salon/)` mehrdeutig. Die Tests suchen jetzt in der Liste „Zonen an Bord" und klicken wiederholt, bis die Insel hydriert ist (Dev-Last). Neu geprüft wird außerdem die Live-Region „Sache von Bootssattler und Werft". 8/8 grün (Desktop), Smoke iPhone/Pixel grün.
- **Poster vor dem 3D-Start:** Die Handy-Variante `werfthalle-*-tall.webp` fehlte (404 auf Handys), und in den übrigen Standbildern waren Bedienhinweise eingebrannt („Ziehen zum Dre…" unter „3D wird geladen"). Alle 18 Standbilder sind neu erzeugt (Playwright, SwiftShader, Overlays und `position: fixed` ausgeblendet, WebP q76, tall zusammen 92 KB). Das `<img>` im `<picture>` lädt jetzt `lazy`, so lädt der Desktop nicht mehr zusätzlich das Handy-Bild.
- **Handy-Übersicht 3D:** Das Boot war auf der 4:5-Bühne am Heck abgeschnitten. Die Übersicht rückt bei schmalen Bühnen weiter weg (Faktor `1 + (1,2 − aspect) · 1,5`) und zielt etwas Richtung Heck und tiefer; `maxDistance` ist um 4 m erhöht. Alle 6 Boote sind vollständig zu sehen.

Nachprüfung in `qa-screenshots/erlebnis/yacht/fix1/` (überschrieben): shoot.mjs auf iPhone, Android, iPad und Desktop mit Status 200, 0 Konsolenfehlern und ohne Überlauf. Hero-Messung: Boot 73 % breit, zentriert (Abweichung 0) auf iPhone, Android, iPad und 1440; auf 1920 55 %. 3D-Zonen Desktop/Pixel (`3d-*`, Übersicht `zones-*.png`): Salon, Kabine, Bad (eigener Raum mit Waschtisch, Dusche, WC), Flybridge, Segelyacht, Superyacht samt Abendlicht. Jeweils nur das aktive Label, Übersicht ohne Textüberlappung (überlappende Labels werden zu Punkten), Handy 4:5. Welten: Desktop Film-Modus mit KI-Label oben rechts, iPhone Karussell, reduced motion als Bildfolge; 6 Bilder, 6 Etiketten, 0 Produktlinks. Marken: 20 echte Produktbilder, im Dev-Server nach ca. 4 s geladen (`page-desktop-brands-loaded.png`). Alte Renderings (v1 Cockpit/Flybridge) kommen nicht mehr vor. Ein einzelner 400er von `/_next/image` (Alonpi-Bild) war vorübergehend; der direkte Abruf liefert 200.

**Weiter offen:** P2.5 Performance (wartet auf Build), P2.6 Indexierung (wartet auf Inhaber). Dazu neu `yacht-minotti-navetta42-bilder.md`: Laut Inhaber-Vorgabe sollen Minotti-Referenzbilder auf die Seite, und „die Seite bleibt noindex bis zur Freigabe". Die Seite ist heute aber `index, follow`. Die Bilder liegen in `public/labs/yacht/minotti-navetta42/` und sind **noch nicht eingebaut**, weil Freigabe und Indexierung zuerst geklärt werden müssen. Das Runabout-Cockpit steht weiter je einmal im Welten-Kapitel und im Konzept (QA 2, P3.5).

**Ursache des WebKit-Leerbilds gefunden (Fix 2):** Es lag nicht am Clipping, sondern am `PerformanceMonitor`. Bei langsamer GPU senkte er nach dem Zonenwechsel den dpr von 1,5 auf 1. Der Zeichenpuffer wurde neu angelegt und blieb leer, auch nach weiterem Drehen. Das kann auch auf älteren echten iPhones passieren. Behoben durch einen festen dpr. Zusätzlich zeichnet die Bühne bei jeder Größenänderung neu, und der Schnitt kommt ohne Clipping aus.

## Offen

1. **Bibel §7.7 vs. KI-Bilder:** Die Bibel verbietet „generierte Räume … und Seeblicke"; die Seite zeigt sie als gekennzeichnete Konzeptvisualisierungen (nie als Projekt). Inhaber-Entscheidung nötig; bis dahin bleibt der Hero bildfrei.
2. **Indexierung:** noindex ist umgesetzt (siehe oben). Zurück auf index erst nach schriftlicher Freigabe von Minotti und Custom Line.
3. **C2PA**: nur die beiden neuen v2-Bilder tragen ein Manifest (lokale Zertifikatskette, nicht in einer Vertrauensliste). Die übrigen 11 Bilder nachsignieren (Dateien sind Bestand → eigener Auftrag) und ein anerkanntes Zertifikat beschaffen.
4. Auf echtem iPhone prüfen: Schnittansicht in Safari (iOS 17/18), Screenshot nach `qa-screenshots/erlebnis/yacht/`. Ohne Gerät hier nicht möglich. Playwright-WebKit zeigt die Kabine seit Fix 2 (`fix2/selbst/ip-fix2-zone-Kabine.png`).
5. Hersteller schriftlich: Bordeinsatz Tuuci Bleau/Paola Lenti je Modell, Sondermaß Treca, Schutzart In Vitro; Minotti Outdoor im Backoffice als Outdoor kennzeichnen.
6. Produktionsmessung: LCP mobil (dort ist die H1 das LCP-Element), Größe des 3D-Chunks (Ziel ≤ 300 KB gz), `tools/ci/bundle-baseline.json` (Yacht 195 KB) nach dem nächsten Build prüfen.
7. Termin-CTA führt auf `/de/beratung` ohne Thema „Boot" (Datei des Beratungs-Teams).

## QA-Runde 2 → Fix 2 (28.10.2026)

Feedback: `qa-screenshots/erlebnis/yacht/feedback-2.md` (Note 8,0). Prüfung: `qa-screenshots/erlebnis/yacht/fix2/`.

| Punkt | Status | Umsetzung |
|---|---|---|
| P1 noindex | **erledigt** | siehe „Indexierung": robots `noindex, follow`, Sitemap und llms.txt ohne Yacht, Tests angepasst |
| P2.1 Navetta 42 | **erledigt** (Freigabe ausstehend) | Kapitel „Minotti auf See – Custom Line Navetta 42" nach Konzepten und Kurs, vor den Marken. Desktop: 1 großes Bild (max. 55svh hoch) und eine Reihe aus 4; Handy: Embla-Karussell. `next/image` mit `object-contain` im Rahmen des eigenen Seitenverhältnisses, kein Zuschnitt, Filter oder Overlay. Bildnachweis unter jedem Bild, Text „Referenzprojekt von Minotti – nicht von Platzhirsch eingerichtet.", **kein** KI-Etikett. Produkte (Lawrence, Jacob …) nur als Text „laut Hersteller", **nicht verlinkt**, weil nicht live in `catalog.js` geprüft. Rechte-Register: 5 Zeilen in `Marktresearch/recht/bildrechte.csv` (Spalten im Generator-Format „offen", Hinweis „Freigabe ausstehend"). E2E: Credit sichtbar, 0 KI-Labels, kein `object-cover` |
| P2.2 Raster | **erledigt** | `src/lib/yacht/layout.js`: Zonenreihe mit 1 Produkt = breite Zeilenkachel (Bild links, Text rechts), 2–4 Produkte = n Spalten, mehr = 4, 3 oder 5 (kleinste Lücke). Marken: Spalten je Gruppe nach Markenzahl (2 → 2, 4 → 4, 6 → 3), die letzte Karte füllt die Reihe; Marke mit 1 Produkt = eine 2:1-Kachel; Handy: Wisch-Karussell je Gruppe. Unit-Test: keine Reihe mehr als 1/3 leer (n = 1…12) |
| P2.3 Bilder spät | **erledigt (Dev)**, Abnahme im Build offen | Vorschau-Thumbnails mit `sizes="64px"` und `loading="eager"`; beim ersten Wechsel des Bootstyps werden die Thumbnails aller Typen per `getImageProps` und `new Image()` im Idle mit niedriger Priorität vorgeladen (nicht schon beim Laden, damit sie den 3D-Chunk nicht ausbremsen). Produktkacheln: IntersectionObserver mit `rootMargin 1200px` schaltet auf eager. Welten-Karussell: Folie 1–3 eager, 1–2 mit `fetchPriority="high"`. Im Dev-Server ist der Bildoptimierer unter Last weiter langsam (Kacheln zeigen dort sekundenlang den Shimmer). Die 300-ms-Abnahme ist nur im Produktionsbuild messbar |
| P2.4 Länge | **erledigt** | Desktop 22.932 → **17.772 px**, iPhone 26.040 → **20.655 px**, Pixel → **20.301 px** (Playwright, Runabout-Tab). Sektionen nach dem Hero `py-14 md:py-16`, Welten-Scrollspur 35svh je Welt statt 100svh, Materialien in 3 Spalten bzw. auf dem Handy als kompakte Liste mit 24-px-Muster, Revier und Showroom als ein zweispaltiger Block, Konzept-Zonenreihen auf dem Handy als Snap-Karussell, das Bild aus „Sechs Welten" im Konzept nicht wiederholt (P3.3), Hochformat-Leitbild schmaler, Werfthalle 16:9 |
| P2.5 WebKit-Schnitt | **erledigt im Code**, echtes iPhone **offen** | Schnitt ohne Clipping (siehe 3D); Ursache des Leerbilds war der dpr-Wechsel (siehe oben). Playwright-WebKit zeigt die Kabine jetzt (`fix2/selbst/ip-fix2-zone-Kabine.png`). Ein echtes iPhone war hier nicht verfügbar |
| P2.6 Concierge | **teilweise** | Welten- und Navetta-Karussell: Pfeile links, Zähler rechts; Bühnen-Knöpfe auf dem Handy links. E2E im Pixel-Viewport: „Nächste Welt" schneidet den Launcher nicht. Die Mini-Form des Launchers bei sichtbarer Bühne braucht das Shell-Team (`Concierge/Launcher.js`, keine Team-Datei) |
| P2.7 Handy-Übersicht | **erledigt** | Bühne 1:1, Kamera-Ziel seitlich und vertikal zentriert und näher: Boot ≈ 85–95 % der Breite, Mitte bei 46–51 % der Höhe (Unit-Test) |
| P2.8 Performance | **offen** | wartet auf einen erlaubten Produktionsbuild |
| P3.2 Poliform Ketch | erledigt | `bildtyp: stimmung` → füllt die Kachel, kein doppelter Rahmen |
| P3.3 Runabout doppelt | erledigt | Das Welten-Bild erscheint im Konzept nicht noch einmal |
| P3.1, P3.4–P3.7 | offen | Randkeile im 3D, axe-incomplete manuell prüfen, Flybridge-Rahmen (vermutlich Hover), iPad-Hero, globaler Launcher (Shell) |

**Prüfung Fix 2:** shoot.mjs auf 4 Geräten: Status 200, 0 Konsolenfehler, 0 fehlgeschlagene Requests, kein Überlauf. Unit gesamt 946 von 950 grün (4 Live-Tests übersprungen), davon yacht-concepts 13/13 und yacht-fix2 5/5. E2E `yacht-werfthalle.spec.js` 11/11 auf Desktop (2 erst im Retry wegen Dev-Last). ESLint ohne Befund. Keine neuen npm-Pakete.
