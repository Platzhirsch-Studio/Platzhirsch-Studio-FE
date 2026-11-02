# Bildquellen – Ezarri-Konfigurator „Fotoansicht“ (Visualisierungen)

> Ablage: `docs/bildquellen/QUELLEN-ezarri-renders.md`. Bilder: `public/Images/Ezarri/renders/` (48 WebP, 1600 × 1066 px), Zuordnung: `src/lib/ezarri/konfigurator/renders.js`.

**Keine Fotos.** Alle 48 Bilder sind Visualisierungen (Path-Tracing, Blender 4.5 LTS Cycles/OptiX), gerendert am 31.10.2026. Beispielbecken 8 × 4 m (Rechteck, Tiefe 1,2–1,8 m, römische Treppe, Skimmer), Raster 25,8 mm (Stein 24,7 + Fuge 1,1 mm), Fuge Bianco Assoluto (#ededed). Steinfarben aus `src/lib/ezarri/konfigurator/measured-colors.json` (gemessen aus Ezarri-Bildern, Steine je Farbe nach gemessenen Anteilen verteilt). Bildunterschrift auf der Seite immer: „Visualisierung (Rendering), Farbwirkung bitte am Muster prüfen“.

Farben/Serien: Iridescent Azur, Ocean; Lisa 2530-D, 2531-B, 2533-A; Mix 25001-C, 25002-C, 25003-B, 2514-B; Niebla 2501-B, 2502-A, 2503-D, 2505-A, 2507-A, 2508-A – je Ansicht Übersicht (hero), Wasserlinie, Draufsicht, Licht „morgen“; Niebla 2508-A zusätzlich Licht „abend“.

Bekannte Einschränkung: Bei 45 Renders ist der Himmel (HDRI) leicht gedreht – vorläufig akzeptiert.

## Verwendete und geprüfte Assets der Szene

Alle Szenen-Assets CC0 1.0 (gemeinfrei, keine Namensnennung nötig – hier trotzdem dokumentiert). Heruntergeladen am 31.10.2026 von den offiziellen Seiten.

| Asset | Name | Typ | Quelle | Autor | Lizenz | Verwendung | URL | Datum |
|---|---|---|---|---|---|---|---|---|
| `kloofendal_48d_partly_cloudy_puresky` | Kloofendal 48d Partly Cloudy (Pure Sky) | hdri | Poly Haven | Greg Zaal, Jarod Guest | CC0 1.0 | Himmel/Licht „morgen“ | https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky | 2026-10-31 |
| `qwantani_morning_puresky` | Qwantani Morning (Pure Sky) | hdri | Poly Haven | Jarod Guest | CC0 1.0 | nur geprüft, nicht verwendet | https://polyhaven.com/a/qwantani_morning_puresky | 2026-10-31 |
| `qwantani_sunset_puresky` | Qwantani Sunset (Pure Sky) | hdri | Poly Haven | Greg Zaal, Jarod Guest | CC0 1.0 | Himmel/Licht „abend“ | https://polyhaven.com/a/qwantani_sunset_puresky | 2026-10-31 |
| `rosendal_park_sunset_puresky` | Rosendal Park Sunset (Pure Sky) | hdri | Poly Haven | Dimitrios Savva, Jarod Guest | CC0 1.0 | nur geprüft, nicht verwendet (Sonne unter Horizont) | https://polyhaven.com/a/rosendal_park_sunset_puresky | 2026-10-31 |
| `wood_floor_deck` | Wood Floor Deck | tex | Poly Haven | Dimitrios Savva | CC0 1.0 | Liegen (Holz) | https://polyhaven.com/a/wood_floor_deck | 2026-10-31 |
| `leafy_grass` | Leafy Grass | tex | Poly Haven | Charlotte Baglioni | CC0 1.0 | Pflanzbeet/Mulch um die Terrasse | https://polyhaven.com/a/leafy_grass | 2026-10-31 |
| `potted_plant_01` | Potted Plant 01 | model | Poly Haven | Rico Cilliers | CC0 1.0 | Pflanzkübel | https://polyhaven.com/a/potted_plant_01 | 2026-10-31 |
| `potted_plant_02` | Potted Plant 02 | model | Poly Haven | Rico Cilliers | CC0 1.0 | Pflanzkübel | https://polyhaven.com/a/potted_plant_02 | 2026-10-31 |
| `shrub_02` | Shrub 02 | model | Poly Haven | Rico Cilliers | CC0 1.0 | geprüft, nicht verwendet | https://polyhaven.com/a/shrub_02 | 2026-10-31 |
| `shrub_04` | Shrub 04 | model | Poly Haven | Rico Cilliers | CC0 1.0 | geprüft, nicht verwendet | https://polyhaven.com/a/shrub_04 | 2026-10-31 |
| `tree_small_02` | Tree Small 02 | model | Poly Haven | Rico Cilliers | CC0 1.0 | Bäume hinter der Mauer | https://polyhaven.com/a/tree_small_02 | 2026-10-31 |
| `island_tree_02` | Island Tree 02 | model | Poly Haven | Rob Tuytel, Rico Cilliers | CC0 1.0 | Baum hinter der Mauer | https://polyhaven.com/a/island_tree_02 | 2026-10-31 |
| `Travertine009` | Travertine 009 | tex | ambientCG | Lennart Demes (ambientCG) | CC0 1.0 | Beckenrand + Terrassenplatten | https://ambientcg.com/view?id=Travertine009 | 2026-10-31 |
| `Travertine001` | Travertine001 | tex | ambientCG | Lennart Demes (ambientCG) | CC0 1.0 | nur geprüft, nicht verwendet | https://ambientcg.com/view?id=Travertine001 | 2026-10-31 |
| `Travertine005` | Travertine005 | tex | ambientCG | Lennart Demes (ambientCG) | CC0 1.0 | nur geprüft, nicht verwendet | https://ambientcg.com/view?id=Travertine005 | 2026-10-31 |
| `Travertine013` | Travertine013 | tex | ambientCG | Lennart Demes (ambientCG) | CC0 1.0 | nur geprüft, nicht verwendet | https://ambientcg.com/view?id=Travertine013 | 2026-10-31 |
| `Blender 4.5.10 LTS` | Blender (Cycles, OptiX) | software | Blender Foundation | – | GPL-3.0-or-later (Ausgabebilder frei) | Rendering | https://download.blender.org/release/Blender4.5/ | 2026-10-31 |
