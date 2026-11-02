# Wachstumsrat: 3D, VR und Fotorendering

**Gremium:** Visualisierer (Architektur/Interior), WebGL/WebXR-Entwickler, CGI-Fotograf · **Kürzel:** `3d-vr-render` · **Stand:** 28.10.2026
**Grundlage (nur gelesen):** `Marktresearch/daten/gpu-pipeline.md`, `digital/features/{ar-viewer,kuechenplaner,sofaplaner,yacht-renderings}.md`, `digital/expertenrat/12-creative-technologist-webgl.md`, `13-innovation-geschaeftsmodelle.md` (Idee 9), `.data/workflows/ezarri-wf.js`, Code unter `src/components/{Labs,Yacht,Portal}/**`, `next.config.js` (CSP), vorhandene QA-Screenshots in `qa-screenshots/labs-ausbau/**`, `qa-screenshots/sofaplaner/**`, `qa-screenshots/ezarri/analyse/`.

**Einschränkung der Prüfung:** Der Dev-Server lieferte am 28.10.2026 auf `:3000` für alle Seiten HTTP 500 (vermutlich durch parallel laufende Bauteams), `:4545` lieferte 404 für alle Labs-Routen. Neue Screenshots waren deshalb nicht möglich. Die Bewertung stützt sich auf Code, Feature-Dokus und die QA-Screenshots vom 26.–27.10.2026. Der Ezarri-Konfigurator existiert noch nicht im Code (`src/components/Ezarri` fehlt); er wird gerade gebaut und wird hier als Anforderung behandelt, nicht benotet.

---

## 1. Urteil zum Ist-Stand

| Baustein | Note | Kurzurteil |
|---|---|---|
| **3D-Küchenplaner** (`Labs/Kuechenplaner/Scene3D.js`, 1.003 Zeilen) | **7/10** | Technisch der stärkste Baustein: PBR-Texturen mit Normal-/Roughness-Maps, `MeshPhysicalMaterial` mit Clearcoat, lokales CC0-HDR, GTAO ab Desktop, RectAreaLights unter den Hängeschränken, ACES-Tonemapping, `frameloop="demand"`. Bildwirkung aber noch „Planungssoftware“, nicht „Studio“: schwarzer Leerraum um den Raum (`desktop-06-3d-abend.png`), keine Decke/Fenster/Tageslicht, Geräte sind Platzhalter, kein Fotomodus mit Path-Tracing. |
| **Sofaplaner 3D** (`Labs/Sofaplaner/Preview3D.js`) | **5/10** | Bewusst schematisch (rechtlich richtig: keine Nachbildung geschützter Designs). Ergebnis wirkt aber wie ein einfarbiges Spielzeugmodell (`r2/interaktion/desktop-05-3d.png`): beige Volumen ohne Stoffstruktur, flaches Licht, kein Ambient Occlusion, Raum ohne Material. Schematisch ist in Ordnung – dann aber konsequent als **edles Architekturmodell**, nicht als halbrealistisches Sofa. |
| **AR-Viewer** (model-viewer 4.4, Stufen 1/2a/2b/3) | **6/10** | Sehr sauber gebaut (Lazy-Load, eigenes USDZ, Quick Look ohne three.js, `ar-scale="fixed"`, Decoder selbst gehostet, a11y). Der Inhalt trägt aber nicht: 3 CC0-Beispielmodelle, 16 AR-Fotos (Solpuri-Pilot) und 98 „Raumbedarf“-Quader. Der Quader beantwortet „passt es?“ ehrlich, verkauft aber nichts (Note Emotion: 3/10). Echte Herstellermodelle fehlen, weil die Freigaben fehlen. |
| **Yacht-Werfthalle** (`Yacht/Stage3D.js`) | **6/10** (aus Code und Doku, live nicht gesehen) | Ein prozeduraler Rumpfgenerator für 6 Bootstypen, Schnitt ohne Clipping-Planes (iOS-sicher), Tag/Abend, Clearcoat-Reflexe, `RoomEnvironment` statt CDN-HDR. Möbel sind abstrakte Blöcke (rechtlich richtig). Die 13 SDXL-Konzeptbilder sind gekennzeichnet. Hauptproblem laut Abnahme: **keine echten Bootsbilder** – das kann 3D nicht ersetzen. |
| **Ezarri-Konfigurator** | n. b. | Noch nicht gebaut. Anforderungen aus Sicht Rendering siehe 3.4. |
| **Kundenportal-Planung** (`Portal/Planung/Scene3D.js`, 138 Zeilen) | 4/10 | Nur Grundgerüst mit Schatten, ohne Umgebung und Tonemapping. |
| **GPU-Pipeline** (`daten/gpu-pipeline.md`) | **8/10** für den Zweck | Reproduzierbar, lizenzsauber (BiRefNet MIT, Real-ESRGAN BSD-3, BRIA RMBG wegen CC BY-NC bewusst ausgelassen), messbar dokumentiert. Lücken für den nächsten Schritt: **kein Blender/Cycles** (laut Expertenrat 12 nicht installiert), kein Bodenschatten beim Freistellen, keine Photogrammetrie/Splat-Werkzeuge, kein eigenes HDRI. 8 GB VRAM reichen für alles in diesem Dokument, mit den in Abschnitt 4 genannten Grenzen. |

**Gesamturteil 3D/Render: 6/10.** Die Technik ist auf einem Niveau, das viele Händler im Dreiländereck nicht haben. Es fehlt fast überall dasselbe: **echtes Bildmaterial** (eigene Räume, eigene Produkte, echte Projekte) und **eine gemeinsame Lichtsprache**. Jeder Baustein hat ein eigenes Licht, eigene Hintergründe und einen eigenen Grad an Abstraktion. Der größte Umsatzhebel liegt nicht in mehr Echtzeit-3D, sondern in drei Dingen: **(a) der echte Showroom als Gaussian Splat, (b) ein verkaufbarer Visualisierungs-Service, (c) automatisch gerenderte Ezarri-Poolbilder für jede Referenz.**

---

## 2. Befunde und Chancen

### 2.1 Befunde je Werkzeug

**Küchenplaner**
- B1 Der Hintergrund um den Raum ist fast schwarz. Auf der hellen Papier-Gestaltung der Seite wirkt das wie ein CAD-Fenster. Besser: Papierton bzw. weicher Verlauf in `paper`, Boden läuft in den Hintergrund aus („Studio-Hohlkehle“).
- B2 Es fehlen Fenster, Decke und gerichtetes Tageslicht. Gerade Steinplatten (Binni) leben von Streiflicht. Ein Fenster mit Sonnenstand und weichem Schattenwurf auf der Arbeitsplatte macht den größten sichtbaren Unterschied.
- B3 Kein „Fotomodus“: Der Kunde kann seine Planung nicht als schönes Bild mitnehmen (es gibt `toDataURL`/`preserveDrawingBuffer`, aber nur als Rasterbild der Echtzeitszene). Chance: progressives Path-Tracing im Browser mit `three-gpu-pathtracer` (MIT, baut auf three.js auf) auf Desktop, 20–60 s bis zu einem ruhigen Bild [Schätzung, auf RTX-Hardware zu messen]. Das Bild landet in Merkliste, PDF und Anfrage.
- B4 Geräte sind Platzhalter. Mit Gaggenau/Miele-Formen ohne Marke (generische Backofenfront, Kochfeld mit Glas-Clearcoat) wirkt es sofort hochwertiger.

**Sofaplaner**
- B5 Halbrealismus schadet. Die Volumen sehen aus wie ein billiges Sofa, nicht wie ein Minotti. Empfehlung: **„Atelier-Modell“-Look** – mattes Weiß/Ton (Clay-Render), starke Ambient Occlusion, weiche Kontaktschatten, ein warmes Fensterlicht, Holzboden im Hausstil. So zeigt das Modell Proportion und Raumwirkung, ohne so zu tun, als sei es das Produkt. Stoff und Farbe werden dann über **echte Musterfotos** neben dem Modell gezeigt, nicht über die Geometrie.
- B6 Elemente ohne Höhe erscheinen halbtransparent. Im Clay-Look als Schraffur-Material klarer lesbar.

**AR-Viewer**
- B7 Der Raumbedarf-Quader ist der ehrlichste Weg ohne Bildrechte, aber im Raum auf dem Handy wirkt ein Drahtgitter-Kasten technisch. Verbesserung ohne Rechteproblem: Quader als **mattes, warmes Volumen mit abgerundeten Kanten und 30 % Deckkraft**, Bodenfläche mit Stoffstruktur, Label „Minotti · Connery · 214 × 102 × 88 cm“ auf dem Boden. Kein Herstellerbild, kein nachgebautes Design.
- B8 Der eigentliche Hebel sind **Herstellermodelle**: Laut Doku liegt für Minotti ein Revit-RFA vor, die Konvertierung RFA → FBX → Blender → GLB ist beschrieben. Ohne Freigabe bleibt es intern. Die Freigabe-Anfrage ist eine Inhaber-Aufgabe mit hohem Hebel (Textbaustein 3.6).
- B9 Für **ClassiCon** (Vertragshändler) ist die Freigabe am wahrscheinlichsten und zuerst anzufragen.

**Yacht**
- B10 Prozedural ist richtig. Was fehlt, ist der Übergang vom Modell zum echten Ergebnis: ein Vorher/Nachher an einem echten Boot (Polster, Teak, Leuchten). Das ist eine Fotoaufgabe, keine 3D-Aufgabe (siehe 3.5, Shotlist).

**Ezarri (in Arbeit)**
- B11 Die Original-Ezarri-Oberfläche (Screenshots `qa-screenshots/ezarri/analyse/`) ist textlastig und schwach. Hier kann Platzhirsch tatsächlich besser sein, wenn das Wasser physikalisch plausibel ist (Abschnitt 3.4).

**GPU-Pipeline**
- B12 Kein Blender auf dem Rechner. Blender (GPL, kostenlos) mit Cycles/OptiX auf der RTX 4060 ist die Grundlage für Packshots, Ezarri-Poolbilder und den Visualisierungs-Service. Installation ohne Admin als portable ZIP möglich.
- B13 Kein eigenes HDRI. Ein HDRI vom Showroom und von der Seeterrasse in Lochau (Belichtungsreihe mit vorhandener Kamera, Zusammenführen kostenlos) gäbe allen Werkzeugen **dasselbe, eigene Licht** – eine Bildsignatur, die kein Wettbewerber kopieren kann.

### 2.2 Chancen, bewertet

| Idee | Bewertung | Begründung |
|---|---|---|
| **Gaussian Splatting des Showrooms** | **Ja, P1** | Fotorealistisch, läuft auf Handys, Aufnahme mit vorhandener Hardware möglich, Viewer frei (Spark 2.x, MIT, ab three.js r180; Projekt hat 0.183). Ersetzt den heutigen Street-View-Rundgang, der nur nach Einwilligung lädt und Daten an Google schickt (`src/lib/legal/services.js`). Kein veröffentlichter Beleg für Umsatzeffekt im Möbelhandel gefunden – Wirkung über A/B-Test messen. |
| **Visualisierungs-Service „Ihr Raum in 72 h“** | **Ja, P1** | Wird bereits im Outdoor-Konzept (30) als Leistung mit 1.500–6.500 € genannt. Als eigenes, anrechenbares Produkt verkauft es Planungszeit und bindet den Kunden. „24 h“ ist mit Inhaber plus einem Freelancer nicht zuverlässig lieferbar; 72 h Werktage ist ehrlich. |
| **Ezarri-Poolbilder für jede Referenz** | **Ja, P1** | Ezarri erlaubt die Nutzung seiner Inhalte (Inhaber-Entscheidung 7). Eine Blender-Poolszene, Textur je Referenz, Batch über Nacht. Liefert einzigartige Bilder für über 300 Referenzseiten (SEO: eigene Bilder statt Herstellerfotos). |
| **Produkt-Packshots aus 3D** | **Bedingt, P2** | Nur wo 3D-Daten mit Rechten vorliegen (Ezarri-Texturen, Binni nach Klärung, ClassiCon nach Freigabe). Für Minotti und andere ohne Freigabe nicht. |
| **Einheitliche Lichtstimmung** | **Ja, P2** | Drei Presets „Morgen / Tag / Abend“ als gemeinsames Modul für Küche, Sofa, Yacht, Ezarri, Portal. Eigenes HDRI aus Lochau. Kleiner Aufwand, große Wirkung auf Wiedererkennung. |
| **WebXR/VR-Showroom** | **Nur als Zusatz, P3** | Safari auf iPhone/iPad unterstützt WebXR nicht; auf Vision Pro ist `immersive-vr` verfügbar, auf Meta Quest im Browser. Die Zielgruppe nutzt zu über 90 % Handy und Desktop [Schätzung]. VR lohnt sich als **Messe-/Termin-Werkzeug** (eine Quest im Studio, Kunde „geht“ durch seine Hotelsuite) – nicht als Website-Funktion. Der Splat-Viewer kann WebXR als Option später mitbringen. |
| **Matterport** | **Nein** | Professional ab 90 $/Monat für 10 Spaces plus Pro3-Kamera (≈ 4.000 $ bzw. Aktionsbundle), Vertrag mit automatischer Verlängerung. Teurer, weniger fotorealistisch als Splats und fremd gehostet (Datenschutz, Ladezeit). |

---

## 3. Fertige Bausteine

### 3.1 Technische Spezifikation „Virtueller Showroom Lochau“

#### 3.1.1 Ziel und Erfolgskriterien

**Ziel:** Ein fotorealistischer, frei begehbarer Rundgang durch das Studio in Lochau (Wohnen, Küche, Outdoor/Ezarri, Café), im Browser auf Handy und Desktop, mit klickbaren Produkten, die zu Produktseite, AR-Viewer, Merkliste und Terminbuchung führen. Er ersetzt den Street-View-Rundgang.

**Akzeptanzkriterien (messbar):**
1. Erste ruhige Ansicht auf Pixel 7 / iPhone 15 Pro in **≤ 4 s** nach Klick auf „Rundgang starten“ über 4G-Profil (Playwright-Throttling „Fast 4G“).
2. **≥ 30 fps** auf iPhone 13 und Pixel 6a im geführten Modus [Zielwert, auf Geräten zu messen].
3. Erster Download ≤ **20 MB** (niedrigste LOD-Stufe), Rest gestreamt.
4. Keine Anfrage an Fremd-Hosts, keine Cookies, kein Tracking ohne Einwilligung.
5. Alle Hotspots auch als Textliste erreichbar (WCAG 2.2 AA), Tastatur-Bedienung, `prefers-reduced-motion` ersetzt Kamerafahrten durch Schnitte.
6. Fallback ohne WebGL2: Video-Rundgang (AV1 + H.264) und Fotogalerie.
7. Initiales Seiten-Bundle wächst nicht: Viewer nur per `next/dynamic(..., { ssr: false })` nach Klick bzw. Sichtbarkeit (Desktop).

#### 3.1.2 Aufnahme

**Zonen** (je Zone ein eigener Splat, so bleiben Dateien klein und Fehler lokal):

| Zone | Inhalt (Beispiele) | Fläche [Schätzung, vor Ort messen] | Fotos |
|---|---|---|---|
| Z1 Eingang & Café | Empfang, Café-Theke, Sitzplätze | 60–100 m² | 400–600 |
| Z2 Wohnen | Sofa-Inseln, ClassiCon-Bereich, Leuchten | 150–250 m² | 800–1.200 |
| Z3 Küche | Ausstellungsküchen, Binni-Stein | 60–100 m² | 500–700 |
| Z4 Outdoor & Ezarri | Terrasse, Mosaik-Muster, Schirme | 80–150 m² | 500–800 |

**Ausrüstung, drei Varianten:**

| Variante | Gerät | Kosten | Qualität | Empfehlung |
|---|---|---|---|---|
| A „Handy“ | iPhone 15 Pro o. ä., 4K-Video 30 fps, Belichtung und Weißabgleich fest (App mit manueller Kontrolle) | 0 € (vorhanden) | gut für Übersicht, weich in Details | **Pilot mit Z3** in einer Woche |
| B „Kamera“ | Spiegellose Kamera APS-C/Vollformat, 14–20 mm, Stativ/Einbein, RAW → JPEG, feste Blende f/8, ISO ≤ 800 | Miete ca. 60–120 €/Tag [Schätzung, Verleihpreise einholen] | sehr gut, scharfe Texturen | **Produktivaufnahme** |
| C „Scanner“ | LiDAR-/Splat-Scanner (z. B. XGRIDS PortalCam) | Miete bzw. Dienstleister, Preis anfragen | sehr gut, schneller | nur wenn B zu langsam ist |

**Aufnahmeregeln (Protokoll für den Aufnahmetag):**
1. Aufnahme **nach Ladenschluss**, alle Leuchten an, Außenlicht möglichst gleich (Abend oder bedeckter Tag). Splats speichern das Licht fest ein; ein Wechsel im Lauf erzeugt Flecken. Für die Lichtstimmung zwei Durchgänge: **„Tag“** (Jalousien offen, bedeckter Himmel) und **„Abend“** (Kunstlicht) als getrennte Splats.
2. Belichtung, Fokus und Weißabgleich **fest**. Kein HDR-Modus, keine automatische Szenenoptimierung des Handys.
3. Bewegung: Zone in **drei Höhen** umrunden (Hüfte, Augenhöhe, über Kopf mit Einbein), 60–80 % Überlappung, langsam. Um jedes Hauptprodukt zusätzlich einen engen Kreis.
4. **Glas, Spiegel, Chrom**: Spiegel abdecken oder in der Bereinigung entfernen; Glastische aus mehreren Winkeln, Ergebnis kritisch prüfen (bekannte Schwäche von Splats und auch der Freistellung, siehe GPU-Pipeline §7).
5. Keine Personen, keine Kundendaten (Pläne, Bildschirme, Bestellzettel) im Bild. Mitarbeiter, die im Bild bleiben, nur mit schriftlicher Einwilligung.
6. **Maßstab**: In jeder Zone zwei gedruckte Messmarken (AprilTag o. ä.) mit bekanntem Abstand auslegen, später zum Skalieren und danach wegretuschieren.
7. Kunstwerke Dritter an den Wänden: abhängen oder Freigabe einholen.

#### 3.1.3 Verarbeitung (auf der RTX 4060)

```
Aufnahme ──► 1 Bildauswahl ──► 2 Kameraposen ──► 3 Training ──► 4 Bereinigung ──► 5 Komprimierung ──► 6 Abnahme
```

| Schritt | Werkzeug | Lizenz | Hinweise |
|---|---|---|---|
| 1 Bildauswahl | `ffmpeg` (vorhanden) für Video → Frames (2–3 fps), Schärfefilter (Laplace-Varianz, kleines Python-Skript im Ordner `platzhirsch-gpu-tools\scripts\`) | GPL-Werkzeug / eigenes Skript | Unscharfe 20 % verwerfen |
| 2 Kameraposen | COLMAP (BSD) oder in Postshot integriert | BSD / kommerziell | Bei > 1.000 Bildern „sequential matching“ |
| 3 Training | **Postshot** (Indie 17 €/Monat oder 204 €/Jahr, PLY-Export erst ab Indie) **oder** Brush (Apache-2.0, WebGPU, auch AMD) | kommerziell / Apache-2.0 | 8 GB VRAM: pro Zone 1–3 Mio. Gaussians anpeilen, große Zonen teilen [Schätzung, im Pilot messen] |
| 4 Bereinigung | **SuperSplat** (PlayCanvas, im Browser oder lokal) | Open Source, Lizenz vor Nutzung im Repo prüfen | Schwebeartefakte („Floaters“) löschen, Zone zuschneiden, Boden ausrichten, auf Messmarken skalieren |
| 5 Komprimierung | `splat-transform` (PlayCanvas) → **SOG**, ab 1 Mio. Gaussians als gestreamtes LOD-Bündel | Open Source | SOG ist laut PlayCanvas 15–20× kleiner als PLY (Beispiel: 4 Mio. Gaussians, 1 GB PLY → 42 MB SOG) |
| 6 Abnahme | Sichtprüfung an 20 festen Kamerapunkten je Zone, Vergleich mit Foto | – | Note ≥ 8/10 durch zweite Person |

Zusätzlich je Zone: **Flythrough-Video** (geführte Kamerafahrt aus dem Viewer aufgezeichnet, 30–45 s) über `video-web.ps1 -Cpu` als Fallback und für Social Media, sowie **Posterbild** (WebP/AVIF).

**Ablage:** Rohdaten außerhalb des Repos (`platzhirsch-gpu-tools\showroom\<datum>\`), ins Repo bzw. auf den Static-Host nur `public/showroom/<zone>/<stimmung>/` (SOG-Bündel, Poster, Video). Bei > 50 MB gesamt nicht ins Git, sondern auf den Datei-Host des Deployments (Entscheidung Code-Team).

#### 3.1.4 Web-Einbindung

**Route:** `/[locale]/showroom/rundgang` (DE zuerst, EN/FR/IT/später), Einstieg zusätzlich von `ueber-uns/platzhirsch`, Kontakt, Startseite („Studio ansehen“) und jeder Produktseite, deren Produkt im Showroom steht („Im Studio ansehen“ → springt zum Hotspot).

**Technik:**
- Renderer **Spark 2.x** (`@sparkjsdev/spark`, MIT, three.js ≥ r180, WebGL2, LOD-Streaming per WASM). Die CSP erlaubt `wasm-unsafe-eval` bereits (`next.config.js` Z. 27). Vor Einbau: exakte Version ≥ 14 Tage alt, Größe messen, in der Doku begründen.
- Einbindung über die vorhandene R3F-Basis (`@react-three/fiber` 9). Ein `SplatScene`-Client-Component pro Zone, Wechsel zwischen Zonen mit Überblendung.
- `frameloop="demand"` wie in den anderen Szenen; Rendern nur bei Bewegung.
- `detect-gpu` oder eigene Heuristik: schwache Geräte bekommen die niedrigste LOD-Stufe und `dpr` 1.

**Bedienung:**
- **Geführt** (Standard, mobil): 6–10 Stationen je Zone als Kamerapfad, „Weiter / Zurück“ unten, Wischen = nächste Station. Jede Station hat einen Satz Text.
- **Frei** (Desktop, optional mobil): Orbit um die Station, Klick auf Boden = hinlaufen (Teleport mit kurzer Fahrt), WASD/Pfeile.
- **VR** (Option, P3): Button „In VR ansehen“ nur, wenn `navigator.xr.isSessionSupported('immersive-vr')` true ist (Quest, Vision Pro).
- Umschalter **Tag / Abend**, wenn beide Splats vorliegen.

**Hotspot-Datenformat** (`src/lib/showroom/hotspots.json`):

```json
{
  "zone": "wohnen",
  "stations": [
    { "id": "w1", "title": "Die Sofa-Insel am Fenster", "text": "Hier sehen Sie, wie ein tiefes Sofa mit Licht vom See wirkt.",
      "camera": { "pos": [2.1, 1.55, 4.0], "target": [0.4, 0.8, 1.2] } }
  ],
  "hotspots": [
    { "id": "h-connery", "station": "w1", "pos": [0.35, 0.9, 1.1],
      "label": "Minotti · Connery", "productPath": "/produkte/sofas/connery",
      "actions": ["produkt", "ar", "merken", "termin"],
      "stand": "2026-11-15", "imShowroom": true }
  ]
}
```

- Feld `stand` und `imShowroom`: Ausstellungsstücke wechseln. Ein abgebauter Artikel wird ausgeblendet statt falsch verlinkt; der Hinweis „Stand: November 2026“ steht sichtbar im Viewer.
- Bezeichnungen nur sachlich („Minotti · Connery“). **Keine Händleraussage** außer bei ClassiCon und Ezarri („ClassiCon-Vertragshändler“, „Ezarri-Vertragshändler“ dürfen genannt werden).
- Hotspots sind DOM-Knöpfe über dem Canvas (wie im AR-Viewer), Canvas `aria-hidden`, daneben `<details>` „Alle Stationen und Produkte als Liste“.

**Messung** (nur mit Einwilligung, über `trackEvent`): `showroom_start`, `showroom_station`, `showroom_hotspot`, `showroom_action` (produkt/ar/merken/termin), `showroom_complete`. A/B-Test: Kontaktseite mit vs. ohne Rundgang-Teaser, Zielgröße Terminanfragen.

**SEO:** Seite indexierbar, `VideoObject` für den Flythrough, `Place`/`FurnitureStore` mit Adresse Landstraße 11, 6911 Lochau. Der Splat selbst ist für Google unsichtbar; der Text der Stationen ist es nicht.

#### 3.1.5 Budgets

| Größe | Ziel |
|---|---|
| JS für Viewer (gzip, nach Klick) | ≤ 350 KB inkl. three.js [Schätzung: three ca. 180 KB gzip laut Expertenrat 12 plus Spark, messen] |
| Erster Splat-Download je Zone | ≤ 20 MB, LOD danach |
| GPU-Speicher mobil | ≤ 1 Mio. sichtbare Gaussians |
| Flythrough-Video 1080p | ≤ 6 MB je 30 s (AV1 CPU-Encode) |

#### 3.1.6 Kosten und Zeit

| Posten | Variante A (Pilot) | Variante B (produktiv) |
|---|---|---|
| Hardware | 0 € | Kameramiete 2 Tage ca. 120–240 € [Schätzung] |
| Software | Postshot Indie 17 € (1 Monat) oder Brush 0 € | Postshot Indie 204 €/Jahr |
| Aufnahme (intern) | 0,5 Tag | 2 Abende |
| Verarbeitung + Bereinigung | 1–2 Tage | 4–6 Tage |
| Web-Einbindung (Code-Team) | – | 5–8 Personentage [Schätzung] |
| Hosting | vernachlässigbar bei eigenem Static-Host | 60–150 MB Gesamtdaten |
| **Summe Fremdkosten** | **≈ 0–20 €** | **≈ 350–500 €** plus interne Zeit |
| Zum Vergleich extern | Agentur 3–10 T€ [Schätzung]; Matterport Professional 1.080 $/Jahr plus Kamera | |

**Zeitplan:** Woche 1 Pilot Z3 (Handy) und Sichtprüfung → Woche 2 Entscheidung Variante B → Woche 3 Aufnahme aller Zonen → Woche 4 Bereinigung und Einbau → Woche 5 Abnahme auf echten Geräten und Livegang.

#### 3.1.7 Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Glas/Spiegel erzeugen Fehler | Abdecken, Zonen zuschneiden, kritische Stellen durch Foto-Hotspot ersetzen |
| Ausstellung ändert sich | Feld `stand`, halbjährliche Neuaufnahme der geänderten Zone (1 Abend) |
| Markenrechtliche Bedenken bei Herstellern (z. B. Bildrichtlinien) | Rundgang zeigt die eigene Ausstellung; trotzdem vor Livegang Markenrichtlinien von Minotti und Co. prüfen [rechtlich prüfen], Logos/Kataloge im Raum vermeiden |
| Ältere Handys ruckeln | Niedrigste LOD, Video-Fallback per Knopf „Als Video ansehen“ |
| 8 GB VRAM reichen nicht | Zonen teilen, Gaussians begrenzen, notfalls Training in der Cloud (Stundenmiete) |

### 3.2 Visualisierungs-Service „Ihr Raum, fotorealistisch“

**Angebotstext (Vorschlag, Preise vom Inhaber festzulegen):**

> **Ihr Raum, bevor er eingerichtet ist.**
> Sie schicken uns Grundriss, Maße und ein paar Fotos – bequem vom Handy. Wir planen Möbel, Licht und Material und zeigen Ihnen das Ergebnis als fotorealistisches Bild aus zwei Blickwinkeln, bei Tag und am Abend. Innerhalb von drei Werktagen nach Eingang aller Unterlagen.
> Die Visualisierung wird vollständig angerechnet, wenn Sie die Einrichtung bei uns bestellen.

**Pakete:**

| Paket | Inhalt | Preis | Anrechnung |
|---|---|---|---|
| Raum | 1 Raum, 2 Perspektiven, Tag + Abend, 1 Korrekturrunde | Vorschlag: 390 € | ab Auftrag 10 T€ |
| Wohnung/Chalet | bis 4 Räume, 6 Perspektiven, Grundriss mit Möblierung | Vorschlag: 1.490 € | ab 40 T€ |
| Hotel/Contract | Musterzimmer + Lobby, 8 Perspektiven, Materialtafel, Kurzvideo | Vorschlag: 3.900 € | ab 150 T€ |

**Ablauf:** Upload über den vorhandenen Handy-Upload (`/upload`) → Aufmaß-Check (Rückfrage innerhalb 24 h) → Modell in Blender aus Grundriss → Möbel: generische Volumen bzw. freigegebene Herstellermodelle (Stufe 1 AR-Viewer), Material-Texturen aus eigener Bibliothek → Render Cycles/OptiX 1600–2400 px → Abgabe im Kundenportal mit Kommentarfunktion.

**Kapazität (Schätzung):** Ein geübter Visualisierer braucht für „Raum“ 4–8 h. Bei 390 € deckt das die Arbeitszeit kaum; der Wert liegt in der Anrechnung und der Abschlussquote. Empfehlung: Freelancer auf Stundenbasis, Annahme nur mit Budgetangabe des Kunden ≥ 10 T€.

**Kennzeichnung:** Im Bild unten rechts klein „Visualisierung – Abweichungen in Farbe und Material möglich“. Wenn KI-Bildwerkzeuge (z. B. SDXL img2img) mitwirken, gilt zusätzlich die KI-Kennzeichnung wie bei den Yacht-Bildern.

### 3.3 Einheitliche Lichtstimmung (Spezifikation für das Code-Team)

Neues Modul `src/lib/three/lightPresets.js` (Name Vorschlag), genutzt von Küchenplaner, Sofaplaner, Yacht, Ezarri und Portal:

| Preset | HDRI | Exposure (ACES) | Sonne/Key | Füllung | Farbtemperatur Kunstlicht |
|---|---|---|---|---|---|
| `morgen` | eigenes HDRI „Lochau Terrasse Morgen“ | 0,95 | Directional, Elevation 15°, Azimut aus Osten, weiche Schatten (PCF, Radius 4) | HDRI 0,6 | aus |
| `tag` | eigenes HDRI „Lochau Showroom Tag“ | 1,0 | Directional, Elevation 45° | HDRI 1,0 | aus |
| `abend` | HDRI „Lochau Showroom Abend“, Intensität 0,15 | 1,1 | aus | RectAreaLights/Spots 2700 K | 2700 K |

- **Eigene HDRIs:** Belichtungsreihe (7 Stufen, ±2 EV) mit Fischauge oder Panoramakopf, zusammengeführt mit freier Software (z. B. Hugin, GPL) zu 4K-EXR; fürs Web 512 × 256 HDR (≈ 200 KB, wie heute im Küchenplaner 256 × 128 mit 105 KB). Ersetzt das CC0-Studio-HDR und `RoomEnvironment`. Folge: Alle Werkzeuge spiegeln dasselbe echte Fenster zum Bodensee.
- **Hintergrund einheitlich:** Studio-Hohlkehle in `paper`-Ton statt Schwarz/Grau.
- **Schatten einheitlich:** ContactShadows (opacity 0,35, blur 2,5) plus GTAO ab Desktop.
- **Umschalter** überall gleich: drei Icons Sonne aufgehend / Sonne / Mond, Beschriftung „Morgen · Tag · Abend“.

### 3.4 Anforderungen an den Ezarri-Pool (Rendering-Sicht)

Für das Team „3D-Konfigurator“, ergänzend zur Paritätsliste:

1. **Mosaik prozedural, nicht als Foto-Kachel:** Shader erzeugt Raster aus Steinformat (25 mm / 50 mm / Hexa) und Fugenbreite; jede Fliese bekommt eine Zufallsfarbe aus der Farbverteilung der Referenz (aus den Produktbildern gemessen), leichte Normal-Wölbung der Kante, Fuge mit eigener Farbe/Rauheit. Für Mix-Referenzen Anteile aus `references.json`.
2. **Glas wirkt durch Tiefe:** `MeshPhysicalMaterial` mit `clearcoat` 1, `roughness` 0,15, bei Iridescent-Kollektionen `iridescence`. Gold/Metal: `metalness` 1 als Fleckenmaske pro Fliese.
3. **Wasserfarbe physikalisch:** Die Farbe des Pools entsteht aus Fliesenfarbe × Absorption des Wassers über die Tiefe (Beer-Lambert, Absorption Rot > Grün > Blau). Tiefenregler 1,2–2,0 m. So sieht man ehrlich, warum ein grauer Stein türkis wirkt. Für die Wasserfarben-Angaben von Ezarri ein Vergleichsbild daneben.
4. **Kaustik:** Animierte Kaustik-Textur auf Boden/Wänden (vorberechnete Kachel-Sequenz, 256 px, 32 Frames) statt Echtzeit-Simulation – günstig auf Handys. Bei `prefers-reduced-motion` stehend.
5. **Lichtpresets** aus 3.3 plus „Nacht mit Unterwasserleuchten“.
6. **Fotomodus:** Desktop-Path-Tracing wie beim Küchenplaner (B3); Ergebnis in PDF-Zusammenfassung.
7. **Fallback 2D:** gerendertes Standbild aus der Batch-Pipeline 3.5 statt eines leeren Feldes.

### 3.5 Batch-Pipeline „Ezarri-Pool in jeder Farbe“ und Packshots

**Ziel:** Für jede Ezarri-Referenz zwei eigene Bilder: (a) Pool 8 × 4 m bei Tag aus Terrassenhöhe, (b) Detail Treppe/Beckenrand. Dazu für Ezarri-Kollektionen ein Packshot „Blatt 30 × 30 cm“ auf Papierton.

**Ablauf:**
1. Blender (portable, ohne Admin) in `platzhirsch-gpu-tools\blender\`.
2. Eine Szene `pool-lochau.blend`: Pool, Steinrand, Liegen als neutrale Volumen, eigenes HDRI (3.3), Wasser mit Volumen-Absorption.
3. Python-Skript `render_ezarri.py`: liest `src/lib/ezarri/references.json`, erzeugt die Mosaik-Textur je Referenz (wie 3.4, gleiche Logik), rendert Cycles/OptiX 1600 px, Denoiser an.
4. Ausgabe über `sharp` als AVIF/WebP 1600/600 px nach `public/ezarri/visual/<code>-{pool,detail}.{avif,webp}`.
5. Zeitbedarf: 1–3 min pro Bild auf RTX 4060 [Schätzung], 300 Referenzen × 2 = 600 Bilder → 10–30 h, zwei bis drei Nächte.
6. Sichtprüfung als Kontaktbogen (wie bei der Freistellung), Ausreißer neu.
7. Kennzeichnung im Bild-Alt und Bildunterschrift: „Visualisierung: Ezarri [Code] im Pool, 1,4 m Wassertiefe, Tageslicht. Farbe am Muster prüfen.“

**Packshots aus 3D für Möbel:** nur für Modelle mit Freigabe (Stufe 1 AR-Viewer). Dann dieselbe Szene „Studio-Hohlkehle Papierton“ mit drei Kameras (Front, 3/4, Detail), 2400 px, Bodenschatten echt – das ersetzt den fehlenden Schatten der BiRefNet-Freistellung.

### 3.6 Textbaustein: Anfrage 3D-Daten bei Herstellern (Inhaber versendet)

> Betreff: 3D-Daten und Freigabe für AR-Ansicht und Visualisierung – Platzhirsch Home Living, Lochau
>
> Sehr geehrte Damen und Herren,
>
> wir bauen für unsere Kundinnen und Kunden im Dreiländereck Österreich, Deutschland, Schweiz eine Ansicht, mit der sie Möbel in Originalgröße per Augmented Reality im eigenen Raum sehen können. Dafür möchten wir Ihre 3D-Daten (z. B. Revit, FBX, GLB) für die Produkte nutzen, die wir in unserem Studio in Lochau führen.
>
> Konkret bitten wir um Ihre schriftliche Zustimmung, die Modelle (1) ins Format GLB/USDZ umzuwandeln und für die Anzeige im Web zu verkleinern, (2) auf unserer Website in einer 3D- und AR-Ansicht zu zeigen und (3) für Visualisierungen in Kundenprojekten zu verwenden. Die Modelle werden nicht zum Download angeboten. Marke und Designer nennen wir bei jedem Modell.
>
> Gern senden wir Ihnen vorab einen Testlink. Über eine kurze Rückmeldung, auch zu Ihren Gestaltungsvorgaben, freuen wir uns.
>
> Mit freundlichen Grüßen …

Reihenfolge: ClassiCon (Vertragshändler) → Solpuri (Pilot läuft) → Minotti → Flos → Poliform → Sifas.

### 3.7 Shotlist echte Fotos (ergänzt 3D, kein 3D-Ersatz)

| Motiv | Zweck | Wer |
|---|---|---|
| Ein Boot vor/nach Polster- und Teakarbeiten (6 Perspektiven) | Yacht-Seite braucht echte Bilder | Inhaber + Fotograf, Kundenfreigabe |
| Binni-Arbeitsplatte im Streiflicht, Kantendetail | Küchenplaner-Texturen und Landingpage | intern, Makro |
| Ezarri-Muster im Wasserbecken (Wanne 40 cm, Tageslicht) | Vergleich Rendering ↔ Realität | intern |
| HDRI Showroom Tag/Abend, Terrasse Morgen | Lichtpresets 3.3 | intern |

---

## 4. Grenzen und Ehrlichkeit

- **Kein veröffentlichter Beleg** für einen Umsatzeffekt von Gaussian-Splat-Rundgängen im Möbelhandel gefunden; vorhandene Beispiele sind Prototypen (siehe Quellen). Wirkung per A/B-Test messen.
- Splats können **nicht umgefärbt oder umgeleuchtet** werden. Für Material-Varianten bleiben AR-Viewer und Konfiguratoren zuständig.
- Path-Tracing im Browser läuft nur auf Desktops mit guter GPU; mobil bleibt es beim Echtzeitbild.
- Alle Preise für Hardware-Miete, Agenturen und Renderzeiten sind **Schätzungen** und vor Entscheidung zu prüfen.
- Lizenz von SuperSplat/splat-transform vor Nutzung im Repository prüfen (Recherche fand die Formatspezifikation als Open Source, die Lizenzdatei selbst wurde nicht gelesen).

---

## 5. Maßnahmen-Tabelle

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| P0 | Freigabe-Anfrage 3D-Daten an ClassiCon, Solpuri, Minotti, Flos (Text 3.6) | S | 0 € | Hoch, indirekt: ohne Freigaben bleiben AR-Viewer und Packshots in den Labs; mit Freigabe werden 3D/AR-Produktseiten öffentlich (Basis aller weiteren 3D-Maßnahmen) | Inhaber |
| P1 | Pilot Gaussian Splat Zone Küche mit Handy (3.1, Variante A) | S | 0–20 € | Entscheidungsgrundlage; selbst noch kein Umsatz | Inhaber + Code-Team |
| P1 | Virtueller Showroom alle Zonen + Einbau `/showroom/rundgang` | M–L | 350–500 € + 5–8 PT | Mittel: senkt die Hürde zur Anfahrt aus CH/DE (bis 45–90 min); schon ein zusätzlicher Termin pro Monat mit Abschluss im Premium-Segment trägt die Kosten [Schätzung, A/B messen] | Inhaber (Aufnahme), Code-Team |
| P1 | Ezarri-Batch-Renderings je Referenz (3.5) | M | 0 € (Blender, eigene GPU) | Mittel–hoch: einzigartige Bilder für 300+ Seiten (SEO, Vertrauen), Pool-Projekte haben hohe Materialvolumen; Effekt über Musteranfragen messen | Code-Team / Visualisierer |
| P1 | Visualisierungs-Service als Produkt (3.2), Seite + Ablauf im Portal | M | Freelancer pro Auftrag | Mittel–hoch: verkauft Planungsleistung, bindet Kunden vor Angebotsvergleich, direkt anrechenbar; besonders für Hotels/Chalets | Inhaber + Partner + Code-Team |
| P1 | Ezarri-Konfigurator mit Wasserphysik, Kaustik, Lichtpresets (3.4) | L | intern | Mittel: Differenzierung gegenüber ezarri.com und anderen Händlern; Ziel Musteranfrage | Code-Team |
| P2 | Lichtpresets + eigene HDRIs aus Lochau für alle Werkzeuge (3.3) | S–M | 0 € (Kamera vorhanden) | Niedrig direkt, hoch für Markenwirkung; macht alle Werkzeuge erkennbar „Platzhirsch“ | Inhaber (HDRI), Code-Team |
| P2 | Küchenplaner: Papier-Hintergrund, Fenster mit Sonnenlicht, generische Geräte, Fotomodus Path-Tracing | M | 0 € | Mittel: geteilte/gespeicherte Planungsbilder führen zurück zur Anfrage; Küchen sind hohe Tickets | Code-Team |
| P2 | Sofaplaner im Clay-/Atelier-Modell-Look + echte Stoffmuster-Fotos | S | 0 € | Niedrig–mittel: weniger „billig“ wirkende Darstellung bei Minotti-Planungen | Code-Team |
| P2 | Raumbedarf-Quader als weiches Volumen statt Drahtgitter (B7) | S | 0 € | Niedrig: bessere AR-Erfahrung ohne Rechteproblem | Code-Team |
| P2 | Blender portable + Bodenschatten im Freistell-Skript | S | 0 € | Niedrig direkt; Voraussetzung für 3.2 und 3.5 | Code-Team |
| P2 | Echte Fotos nach Shotlist 3.7 (Boot, Binni, Ezarri-Muster) | M | Fotograf 500–1.500 € [Schätzung] | Mittel: Yacht-Seite hat laut Abnahme hier ihren größten Hebel | Inhaber + Partner |
| P3 | VR-Modus im Rundgang + eine Quest im Studio für Hotel-/Chalet-Präsentationen | M | Headset ca. 300–500 € [Schätzung] | Niedrig online; Eindruck bei Contract-Kunden im Termin | Code-Team + Inhaber |
| P3 | Packshots aus Herstellermodellen nach Freigabe | M | 0 € | Niedrig–mittel: einheitliche Produktbilder mit echtem Schatten | Code-Team |
| P3 | Portal-Planung an Lichtpresets und Hintergrund angleichen | S | 0 € | Niedrig | Code-Team |

---

## 6. Quellen

- Spark (World Labs), three.js-Splat-Renderer, MIT, v2.0 mit LOD-Streaming: [radiancefields.com/platforms/spark](https://radiancefields.com/platforms/spark), [github.com/sparkjsdev/spark](https://github.com/sparkjsdev/spark), [README @sparkjsdev/spark@2.1.0](https://unpkg.com/@sparkjsdev/spark@2.1.0/README.md)
- Weitere three.js-Splat-Viewer: [Gaussian Splat Lite (three.js-Forum)](https://discourse.threejs.org/t/gaussian-splat-lite-1-0-webgpu-streaming-lod-and-depth-rendering-for-three-js/94234), [Optimierung großer Splat-Szenen](https://discourse.threejs.org/t/how-can-i-optimize-large-3d-gaussian-splat-ply-scenes-for-better-web-performance/93758)
- SOG-Format und SuperSplat-Streaming: [PlayCanvas SOG Open Source](https://blog.playcanvas.com/playcanvas-open-sources-sog-format-for-gaussian-splatting/), [SOG-Spezifikation](https://developer.playcanvas.com/user-manual/gaussian-splatting/formats/sog/), [SuperSplat Streaming](https://developer.playcanvas.com/user-manual/supersplat/streaming/), [splat-transform v3.9.0](https://radiancefields.com/playcanvas-splat-transform-v3.9.0-speeds-up-sog-compression)
- Postshot Preise und Tiers: [radiancefields.com – Postshot v1.0](https://radiancefields.com/postshot-launches-v1-0-out-of-beta), [HKU Bookstack (PLY-Export ab März 2026 nicht mehr im Free-Tier)](https://bookstack.hku.nl/books/3d-scan/page/gaussian-splatting-online-and-local)
- Brush (Apache-2.0): [github.com/ArthurBrussee/brush](https://github.com/ArthurBrussee/brush), [radiancefields.com/platforms/brush](https://radiancefields.com/platforms/brush), [PlayCanvas – empfohlene Werkzeuge](https://developer.playcanvas.com/user-manual/gaussian-splatting/creating/recommended-tools)
- Matterport Preise 2026: [pricingsaas.com (Änderung KW 42/2026)](https://pricingsaas.com/companies/matterport/diffs/2026W42), [thefuture3d.com Pricing Guide 2026](https://thefuture3d.com/blog/matterport-pricing-guide-2026/)
- WebXR-Unterstützung: [roadtovr.com – Vision Pro WebXR](https://roadtovr.com/apple-vision-pro-webxr-support-safari-model/), [vr.org – visionOS 27](https://vr.org/articles/visionos-27-developer-features-safari-requestimmersive-spatial-web), [testmuai.com – WebXR-Browser](https://www.testmuai.com/learning-hub/webxr-compatible-browsers/)
- Splat-Beispiele im Handel (Prototypen, keine Umsatzzahlen): [WGAN – XGRIDS Retail-Prototyp](https://www.wegetaroundnetwork.com/topic/21364/rd-interactive-3d-retail-experience--no-code-workflow-with-xgrids), [Gauzilla Pro + XGRIDS](https://radiancefields.com/gauzilla-pro-shows-retail-demo-with-xgrids), [Monks Labs Report 34](https://media.monks.com/reports/labs-report-34-gaussian-splatting), [Utsubo – Splats in Gewerbeimmobilien (Anbieterquelle)](https://www.utsubo.com/blog/gaussian-splatting-commercial-real-estate)
- Interne Quellen: `Marktresearch/daten/gpu-pipeline.md`, `digital/features/ar-viewer.md`, `kuechenplaner.md`, `sofaplaner.md`, `yacht-renderings.md`, `digital/expertenrat/12-creative-technologist-webgl.md`, `30-geschaeftsfeld-outdoor-gartenplanung.md` (Gestaltungskonzept-Preise), `digital/teamleiter/inhaber-entscheidungen.md` (Ezarri-Freigabe).
