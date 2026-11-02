# Bildquellen – Küchenplaner „Fotoansicht“ (Visualisierungen)

> Ablage: `docs/bildquellen/QUELLEN-kuechenplaner-fotoansicht.md`. Bilder: `public/labs/kuechenplaner/fotoansicht/` (66 WebP, 1600 × 1067 px), Zuordnung und Auswahl: `src/lib/kuechenplaner/fotoansicht.js`, Anzeige: `src/components/Labs/Kuechenplaner/Fotoansicht.js` (Reiter Material).

**Keine Fotos, keine KI-Bilder.** Alle 66 Bilder sind eigene Renderings (Path-Tracing, Blender 4.5 LTS, Cycles/OptiX, Farbmanagement AgX), gerendert am **01.11.2026**. Geometrie: `buildKitchen(defaultPlan(layout))` aus `src/components/Labs/Kuechenplaner/geometry.js` – gleiches Modulraster wie der Planer (Sockel 15 cm, Korpus 78 cm, Platte 20 mm, Hängeschränke ab 150 cm; U-Form mit Fenster über der Spüle). Raumhülle, Fenster und Requisiten sind Ergänzungen der Fotoansicht. Bildunterschrift auf der Seite immer: „Visualisierung (Rendering)“ (DE) / „Visualisation (rendering)“ (EN) / „Visualisation (rendu 3D)“ (FR) / „Visualizzazione (rendering)“ (IT), dazu der Hinweis, dass Farben und Materialien nur annähernd dargestellt sind und die nächstliegende von 66 Varianten gezeigt wird.

Grundformen mit Bildern: Zeile + Insel (28), L-Form (28), U-Form (2), Zeile (8). Blickwinkel: Dreiviertel (62) und Augenhöhe (4, je Grundform einmal mit Kaschmir matt / Quarz). Für Zweizeilig, Zeile + Halbinsel und Freie Raumform gibt es keine Bilder – die Fotoansicht bleibt dort ausgeblendet.

Belichtung und Weißabgleich wurden je Aufnahme (Grundform + Blickwinkel) einmal an der Standardfront Kaschmir matt eingemessen; mittlere Farbabweichung der übrigen Bilder zum Planer-Farbwert ΔE2000 ≈ 11 (ohne Helligkeit ≈ 4).

**Bekannte Einschränkung (Stand 02.11.2026):** Front „Beton hell“ (Keramik) und Arbeitsplatte „Keramik“ wurden mit der zu dunklen Textur Marble006 gerendert (im Planer am 01.11.2026 durch Concrete034 ersetzt, siehe `public/labs/kuechenplaner/README.md`). Diese Bilder werden neu gerendert; die Dateinamen bleiben gleich, ein Tausch braucht keine Codeänderung. Betroffen: `kueche-insel-keramik-beton-quarz-grifflos-alu-dreiviertel.webp`, `kueche-l-keramik-beton-quarz-grifflos-alu-dreiviertel.webp`, `kueche-zeile-keramik-beton-quarz-grifflos-alu-dreiviertel.webp`, `kueche-insel-matt-kaschmir-keramik-grifflos-alu-dreiviertel.webp`, `kueche-l-matt-kaschmir-keramik-grifflos-alu-dreiviertel.webp`.

## Verwendete Assets der Szene

Alle Szenen-Assets CC0 1.0 (gemeinfrei, keine Namensnennung nötig – hier trotzdem dokumentiert). Heruntergeladen von den offiziellen Seiten (Poly Haven, ambientCG) am angegebenen Datum.

| Asset | Name | Typ | Quelle | Autor | Lizenz | Verwendung | URL | Datum |
|---|---|---|---|---|---|---|---|---|
| `alps_field` | Alps Field | hdri | Poly Haven | Andreas Mischok | CC0 1.0 | Küche: Tageslicht/Aussicht durchs Fenster (Sonne als Sun-Lampe) | https://polyhaven.com/a/alps_field | 2026-11-01 |
| `white_plaster_02` | White Plaster 02 | tex | Poly Haven | Rob Tuytel | CC0 1.0 | Küche: Putzstruktur (nur Normal-Map) | https://polyhaven.com/a/white_plaster_02 | 2026-11-01 |
| `ceramic_vase_01` | Ceramic Vase 01 | model | Poly Haven | James Ray Cock | CC0 1.0 | Deko-Vase | https://polyhaven.com/a/ceramic_vase_01 | 2026-11-01 |
| `WoodFloor051` | WoodFloor051 | tex | ambientCG | Lennart Demes (ambientCG) | CC0 1.0 | Küche: Eichenboden (gleiches Asset wie public/labs/kuechenplaner/boden, hier 2K) | https://ambientcg.com/view?id=WoodFloor051 | 2026-11-01 |
| `Wood049` | Wood049 | tex | ambientCG | Lennart Demes (ambientCG) | CC0 1.0 | Küche: Front Eiche / Arbeitsplatte Holz (wie public/labs/kuechenplaner/holz) | https://ambientcg.com/view?id=Wood049 | 2026-11-01 |
| `Wood051` | Wood051 | tex | ambientCG | Lennart Demes (ambientCG) | CC0 1.0 | Küche: Front Nussbaum (wie public/labs/kuechenplaner/front-nuss) | https://ambientcg.com/view?id=Wood051 | 2026-11-01 |
| `Marble021` | Marble021 | tex | ambientCG | Lennart Demes (ambientCG) | CC0 1.0 | Küche: Arbeitsplatte Marmor, Front Weiß marmoriert (wie …/marmor) | https://ambientcg.com/view?id=Marble021 | 2026-11-01 |
| `Marble006` | Marble006 | tex | ambientCG | Lennart Demes (ambientCG) | CC0 1.0 | Küche: Arbeitsplatte Keramik, Front Beton hell (wie …/keramik) | https://ambientcg.com/view?id=Marble006 | 2026-11-01 |
| `Granite002A` | Granite002A | tex | ambientCG | Lennart Demes (ambientCG) | CC0 1.0 | Küche: Arbeitsplatte Quarz, Front Basalt (wie …/quarz) | https://ambientcg.com/view?id=Granite002A | 2026-11-01 |
| `potted_plant_04` | Potted Plant 04 | model | Poly Haven | James Ray Cock | CC0 1.0 | Küche: Sukkulente | https://polyhaven.com/a/potted_plant_04 | 2026-11-01 |
| `bar_chair_round_01` | Bar Chair Round 01 | model | Poly Haven | Dairon Sanchez | CC0 1.0 | Küche: Barhocker an der Insel | https://polyhaven.com/a/bar_chair_round_01 | 2026-11-01 |
| `ceramic_vase_03` | Ceramic Vase 03 | model | Poly Haven | James Ray Cock | CC0 1.0 | Deko-Vase | https://polyhaven.com/a/ceramic_vase_03 | 2026-11-01 |
| `wooden_cutting_board` | Wooden Cutting Board | model | Poly Haven | Kuutti Siitonen | CC0 1.0 | Küche: Schneidebrett | https://polyhaven.com/a/wooden_cutting_board | 2026-11-01 |
| `wooden_bowl_01` | Wooden Bowl 01 | model | Poly Haven | Oliver Harries | CC0 1.0 | Holzschale | https://polyhaven.com/a/wooden_bowl_01 | 2026-11-01 |
| `food_apple_01` | Food Apple 01 | model | Poly Haven | Oliver Harries | CC0 1.0 | Äpfel | https://polyhaven.com/a/food_apple_01 | 2026-11-01 |
| `lemon` | Lemon | model | Poly Haven | Kuutti Siitonen | CC0 1.0 | Zitronen | https://polyhaven.com/a/lemon | 2026-11-01 |
| `potted_plant_01` | Potted Plant 01 | model | Poly Haven | Rico Cilliers | CC0 1.0 | Küche: Bodenpflanze (aus dem Ezarri-Assetordner wiederverwendet) | https://polyhaven.com/a/potted_plant_01 | 2026-10-31 |
| `Travertine005` | Travertine005 | tex | ambientCG | Lennart Demes (ambientCG) | CC0 1.0 | Küche: Terrassenbelag vor den Fenstern (aus dem Ezarri-Assetordner) | https://ambientcg.com/view?id=Travertine005 | 2026-10-31 |

## Die 66 Dateien

Dateiname = `kueche-<Grundform>-<Front>-<Farbe>-<Arbeitsplatte>-<Griff>-<Griff-Farbe>-<Blickwinkel>.webp`; Schlüssel wie in `planState.js` (shape, finish, color, top, grip, gripColor). Alle 1600 × 1067 px, WebP, eigene Renderings vom 01.11.2026 (Urheber: Platzhirsch Home Living).

| Datei | Grundform | Front | Farbe | Arbeitsplatte | Griff | Griff-Farbe | Blickwinkel |
|---|---|---|---|---|---|---|---|
| `kueche-insel-fenix-grau-quarz-grifflos-alu-dreiviertel.webp` | insel | fenix | grau | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-fenix-lehm-quarz-grifflos-alu-dreiviertel.webp` | insel | fenix | lehm | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-fenix-schwarz-quarz-grifflos-alu-dreiviertel.webp` | insel | fenix | schwarz | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-fenix-weiss-quarz-grifflos-alu-dreiviertel.webp` | insel | fenix | weiss | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-glanz-polar-quarz-grifflos-alu-dreiviertel.webp` | insel | glanz | polar | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-glanz-sand-quarz-grifflos-alu-dreiviertel.webp` | insel | glanz | sand | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-glanz-schwarz-quarz-grifflos-alu-dreiviertel.webp` | insel | glanz | schwarz | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-glanz-tiefblau-quarz-grifflos-alu-dreiviertel.webp` | insel | glanz | tiefblau | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-glas-bronze-quarz-grifflos-alu-dreiviertel.webp` | insel | glas | bronze | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-glas-perle-quarz-grifflos-alu-dreiviertel.webp` | insel | glas | perle | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-glas-rauch-quarz-grifflos-alu-dreiviertel.webp` | insel | glas | rauch | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-holz-eiche-quarz-grifflos-alu-dreiviertel.webp` | insel | holz | eiche | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-holz-nuss-quarz-grifflos-alu-dreiviertel.webp` | insel | holz | nuss | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-holz-raeucher-quarz-grifflos-alu-dreiviertel.webp` | insel | holz | raeucher | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-keramik-basalt-quarz-grifflos-alu-dreiviertel.webp` | insel | keramik | basalt | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-keramik-beton-quarz-grifflos-alu-dreiviertel.webp` | insel | keramik | beton | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-keramik-calacatta-quarz-grifflos-alu-dreiviertel.webp` | insel | keramik | calacatta | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-matt-graphit-quarz-grifflos-alu-dreiviertel.webp` | insel | matt | graphit | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-matt-kaschmir-edelstahl-grifflos-alu-dreiviertel.webp` | insel | matt | kaschmir | edelstahl | grifflos | alu | dreiviertel |
| `kueche-insel-matt-kaschmir-granit-grifflos-alu-dreiviertel.webp` | insel | matt | kaschmir | granit | grifflos | alu | dreiviertel |
| `kueche-insel-matt-kaschmir-holz-grifflos-alu-dreiviertel.webp` | insel | matt | kaschmir | holz | grifflos | alu | dreiviertel |
| `kueche-insel-matt-kaschmir-keramik-grifflos-alu-dreiviertel.webp` | insel | matt | kaschmir | keramik | grifflos | alu | dreiviertel |
| `kueche-insel-matt-kaschmir-marmor-grifflos-alu-dreiviertel.webp` | insel | matt | kaschmir | marmor | grifflos | alu | dreiviertel |
| `kueche-insel-matt-kaschmir-quarz-grifflos-alu-auge.webp` | insel | matt | kaschmir | quarz | grifflos | alu | auge |
| `kueche-insel-matt-kaschmir-quarz-grifflos-alu-dreiviertel.webp` | insel | matt | kaschmir | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-matt-kreide-quarz-grifflos-alu-dreiviertel.webp` | insel | matt | kreide | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-matt-nacht-quarz-grifflos-alu-dreiviertel.webp` | insel | matt | nacht | quarz | grifflos | alu | dreiviertel |
| `kueche-insel-matt-salbei-quarz-grifflos-alu-dreiviertel.webp` | insel | matt | salbei | quarz | grifflos | alu | dreiviertel |
| `kueche-l-fenix-grau-quarz-grifflos-alu-dreiviertel.webp` | l | fenix | grau | quarz | grifflos | alu | dreiviertel |
| `kueche-l-fenix-lehm-quarz-grifflos-alu-dreiviertel.webp` | l | fenix | lehm | quarz | grifflos | alu | dreiviertel |
| `kueche-l-fenix-schwarz-quarz-grifflos-alu-dreiviertel.webp` | l | fenix | schwarz | quarz | grifflos | alu | dreiviertel |
| `kueche-l-fenix-weiss-quarz-grifflos-alu-dreiviertel.webp` | l | fenix | weiss | quarz | grifflos | alu | dreiviertel |
| `kueche-l-glanz-polar-quarz-grifflos-alu-dreiviertel.webp` | l | glanz | polar | quarz | grifflos | alu | dreiviertel |
| `kueche-l-glanz-sand-quarz-grifflos-alu-dreiviertel.webp` | l | glanz | sand | quarz | grifflos | alu | dreiviertel |
| `kueche-l-glanz-schwarz-quarz-grifflos-alu-dreiviertel.webp` | l | glanz | schwarz | quarz | grifflos | alu | dreiviertel |
| `kueche-l-glanz-tiefblau-quarz-grifflos-alu-dreiviertel.webp` | l | glanz | tiefblau | quarz | grifflos | alu | dreiviertel |
| `kueche-l-glas-bronze-quarz-grifflos-alu-dreiviertel.webp` | l | glas | bronze | quarz | grifflos | alu | dreiviertel |
| `kueche-l-glas-perle-quarz-grifflos-alu-dreiviertel.webp` | l | glas | perle | quarz | grifflos | alu | dreiviertel |
| `kueche-l-glas-rauch-quarz-grifflos-alu-dreiviertel.webp` | l | glas | rauch | quarz | grifflos | alu | dreiviertel |
| `kueche-l-holz-eiche-quarz-grifflos-alu-dreiviertel.webp` | l | holz | eiche | quarz | grifflos | alu | dreiviertel |
| `kueche-l-holz-nuss-quarz-grifflos-alu-dreiviertel.webp` | l | holz | nuss | quarz | grifflos | alu | dreiviertel |
| `kueche-l-holz-raeucher-quarz-grifflos-alu-dreiviertel.webp` | l | holz | raeucher | quarz | grifflos | alu | dreiviertel |
| `kueche-l-keramik-basalt-quarz-grifflos-alu-dreiviertel.webp` | l | keramik | basalt | quarz | grifflos | alu | dreiviertel |
| `kueche-l-keramik-beton-quarz-grifflos-alu-dreiviertel.webp` | l | keramik | beton | quarz | grifflos | alu | dreiviertel |
| `kueche-l-keramik-calacatta-quarz-grifflos-alu-dreiviertel.webp` | l | keramik | calacatta | quarz | grifflos | alu | dreiviertel |
| `kueche-l-matt-graphit-quarz-grifflos-alu-dreiviertel.webp` | l | matt | graphit | quarz | grifflos | alu | dreiviertel |
| `kueche-l-matt-kaschmir-edelstahl-grifflos-alu-dreiviertel.webp` | l | matt | kaschmir | edelstahl | grifflos | alu | dreiviertel |
| `kueche-l-matt-kaschmir-granit-grifflos-alu-dreiviertel.webp` | l | matt | kaschmir | granit | grifflos | alu | dreiviertel |
| `kueche-l-matt-kaschmir-holz-grifflos-alu-dreiviertel.webp` | l | matt | kaschmir | holz | grifflos | alu | dreiviertel |
| `kueche-l-matt-kaschmir-keramik-grifflos-alu-dreiviertel.webp` | l | matt | kaschmir | keramik | grifflos | alu | dreiviertel |
| `kueche-l-matt-kaschmir-marmor-grifflos-alu-dreiviertel.webp` | l | matt | kaschmir | marmor | grifflos | alu | dreiviertel |
| `kueche-l-matt-kaschmir-quarz-grifflos-alu-auge.webp` | l | matt | kaschmir | quarz | grifflos | alu | auge |
| `kueche-l-matt-kaschmir-quarz-grifflos-alu-dreiviertel.webp` | l | matt | kaschmir | quarz | grifflos | alu | dreiviertel |
| `kueche-l-matt-kreide-quarz-grifflos-alu-dreiviertel.webp` | l | matt | kreide | quarz | grifflos | alu | dreiviertel |
| `kueche-l-matt-nacht-quarz-grifflos-alu-dreiviertel.webp` | l | matt | nacht | quarz | grifflos | alu | dreiviertel |
| `kueche-l-matt-salbei-quarz-grifflos-alu-dreiviertel.webp` | l | matt | salbei | quarz | grifflos | alu | dreiviertel |
| `kueche-u-matt-kaschmir-quarz-grifflos-alu-auge.webp` | u | matt | kaschmir | quarz | grifflos | alu | auge |
| `kueche-u-matt-kaschmir-quarz-grifflos-alu-dreiviertel.webp` | u | matt | kaschmir | quarz | grifflos | alu | dreiviertel |
| `kueche-zeile-fenix-schwarz-quarz-grifflos-alu-dreiviertel.webp` | zeile | fenix | schwarz | quarz | grifflos | alu | dreiviertel |
| `kueche-zeile-glanz-polar-quarz-grifflos-alu-dreiviertel.webp` | zeile | glanz | polar | quarz | grifflos | alu | dreiviertel |
| `kueche-zeile-holz-eiche-quarz-grifflos-alu-dreiviertel.webp` | zeile | holz | eiche | quarz | grifflos | alu | dreiviertel |
| `kueche-zeile-keramik-beton-quarz-grifflos-alu-dreiviertel.webp` | zeile | keramik | beton | quarz | grifflos | alu | dreiviertel |
| `kueche-zeile-matt-graphit-quarz-grifflos-alu-dreiviertel.webp` | zeile | matt | graphit | quarz | grifflos | alu | dreiviertel |
| `kueche-zeile-matt-kaschmir-quarz-grifflos-alu-auge.webp` | zeile | matt | kaschmir | quarz | grifflos | alu | auge |
| `kueche-zeile-matt-kaschmir-quarz-grifflos-alu-dreiviertel.webp` | zeile | matt | kaschmir | quarz | grifflos | alu | dreiviertel |
| `kueche-zeile-matt-kreide-quarz-grifflos-alu-dreiviertel.webp` | zeile | matt | kreide | quarz | grifflos | alu | dreiviertel |
