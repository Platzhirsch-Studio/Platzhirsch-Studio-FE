# Bildquellen – Ezarri-Konfigurator „Fotoansicht“ (Visualisierungen)

> Ablage: `docs/bildquellen/QUELLEN-ezarri-renders.md`. Bilder: `public/Images/Ezarri/renders/` (618 WebP, 1600 × 1066 px, 86,2 MB), Zuordnung: `src/lib/ezarri/konfigurator/renders.js` (Stand 02.11.2026).

**Keine Fotos.** Alle 618 Bilder sind Visualisierungen (Path-Tracing, Blender 4.5 LTS Cycles/OptiX), gerendert am 31.10.–02.11.2026. Beispielbecken 8 × 4 m (Rechteck, Tiefe 1,2–1,8 m, römische Treppe, Skimmer), Raster 25,8 mm (Stein 24,7 + Fuge 1,1 mm), Fuge Bianco Assoluto (#ededed). Steinfarben aus `src/lib/ezarri/konfigurator/measured-colors.json` (gemessen aus Ezarri-Bildern, Steine je Farbe nach gemessenen Anteilen verteilt). Bildunterschrift auf der Seite immer: „Visualisierung (Rendering), Farbwirkung bitte am Muster prüfen“.

**Satz 1 (31.10./01.11.2026, 48 Bilder, WebP q90):** Iridescent Azur, Ocean; Lisa 2530-D, 2531-B, 2533-A; Mix 25001-C, 25002-C, 25003-B, 2514-B; Niebla 2501-B, 2502-A, 2503-D, 2505-A, 2507-A, 2508-A – je Ansicht Übersicht (hero), Wasserlinie, Draufsicht, Licht „morgen“; Niebla 2508-A zusätzlich Licht „abend“. Manifest: `R:\out\final\manifest.json`.

**Satz 2 „Rest“ (02.11.2026, 531 Bilder, 177 Farben, je hero/wasserlinie/draufsicht, Licht „morgen“):** Aquarelle 8, Cocktail 18, Fading-out 4, Fosfo 10, Gea 3, Gemma 14, Gold 11, Iridescent 15, Lisa 25, Metal 10, Mix 6, Niebla 22, Space 6, Terrazzo 6, Zen 19 Farben. Dateinamen `ezarri-<serie>-<referenz-id>-<ansicht>-morgen.webp` (vollständige Liste = `ROWS` in `renders.js`). Rohdaten: PNG + WebP q90 in `R:\out\rest\`, Manifest mit ΔE-Werten je Bild: `R:\out\final-rest\manifest.json`. Für `public/` aus den PNG neu kodiert mit sharp 0.35.5: WebP Qualität 82, effort 6 (q90 wären 114 MB statt 68,5 MB gewesen). Stichprobe q82 gegen q90 an 5 Bildern: Blockmittel-ΔE2000 (4 × 4 px) 0,66–1,07 (Mittel 0,92; q90 gegen PNG selbst 0,78), pixelweise 0,84–1,39 (Mittel 1,24, überwiegend Kodierrauschen in Mosaik und Wasser). Kontaktbögen zur Sichtkontrolle: `R:\out\rest\kontaktbogen\kontaktbogen-rest-01…09.jpg` (25 Farben × 3 Ansichten) und `uebersicht-wasserlinie-1…3.jpg`.

**Dekor-Motive (02.11.2026, nach Freigabe des Inhabers eingebaut, 7 Farben, 21 Bilder, WebP q82 wie Satz 2):** Standard-Pixel Border 1 (2545-A/2543-D), Border 6 (2545-A/2543-D), D-2, D-9; Standard-Printed Dolphin Family, Happy Dolphins, Sea View – je hero/wasserlinie/draufsicht, Licht „morgen“, gleiche Szene und Einstellungen wie Satz 2 (Dateien aus `R:\out\rest\`). Einschränkung: Die Szene rendert nur die aus den Ezarri-Bildern gemessene Grundfarbe des Motivs (Einzelfarbe), die Zeichnung selbst (Bordüre, Pixelbild, Delfine) ist in diesen Renderings **nicht** zu sehen. Darum zeigt die Fotoansicht bei den Serien `standard-pixel` und `standard-printed` unter der Pflicht-Bildunterschrift zusätzlich (im Fließtext, kurz gehalten wegen der Bühnenhöhe auf kleinen Handys): „Nur Grundfarbe des Motivs, Zeichnung nicht abgebildet.“ (`DEKOR_SERIEN`, `FOTO_DEKOR_HINWEIS`, `istDekor()` in `renders.js`; FR/IT über `LISTEN.fotoDekorHinweis`).

Gerendert, aber **nicht eingebaut** (34 Farben, 102 Bilder, Dateien bleiben in `R:\out\rest\`):
- Eck-/Hohlkehlstücke (typ corner/cove, im Konfigurator kein wählbares Mosaik): Gea corner-basalt, -chalk, -dune, -flint, -grit, -limestone, -moss, -slate; Niebla corner_2502_safe; Terrazzo corner_/cove_balinese/clay/greenery/grey/sea/teal_safe.
- Hexa-/50-mm-Varianten (Szene ist 25 mm, 25-mm-Variante derselben Farbe ist drin): 2522-B Hexa, 2545-A Hexa, Azur Hexa, Jade Hexa, Perla Hexa, Moonstone Hexa, Olivine Hexa, Terrazzo Balinese/Clay/Greenery/Grey/Sea/Teal 50.

Nachgerendert am 02.11.2026 (Nachtrag, 18 Bilder, gleiche Szene/Einstellungen): Gea Dune, Grit, Limestone, Slate; Iridescent Moon, Stone (von der ersten Warteschlange wegen Namensüberschneidung mit corner-* übersprungen). Gea Moss wurde mitgerendert, aber nicht aufgenommen: im Katalog nur als 50 mm, die Szene ist 25 mm (Dateien in `R:/out/rest2`). Nicht gerendert (ohne Fotoansicht): Mix 25017-B bis 25022-B; Gold 25; Standard-Pixel D-13 … D-56.

**Farbabweichung (ΔE2000, Satz 2, Wasserlinie: sonnenbeschienener Wandstreifen über der Wasserlinie gegen Mittel aus measured-colors.json, inkl. Belichtung/AgX):** 177 Farben, Mittel 11,1, Median 10,7, Max 34,7; ohne Helligkeitsanteil Mittel 4,5, Max 17,8. Verteilung: ≤ 5: 20 Farben, 5–10: 62, 10–20: 82, > 20: 13. Satz 1 zum Vergleich: Mittel 9,7, Max 14,4. Die höchsten Werte liegen bei Spiegel-/Metallglanz (Gold, Metal): die Wand spiegelt den Himmel, die Abweichung ist vor allem Helligkeit.

| Serie | Farbe | ΔE2000 | ΔE2000 ohne Helligkeit |
|---|---|---|---|
| metal | aurum | 34.7 | 13.5 |
| gold | sponge-gold | 33.3 | 9.4 |
| gold | carrara-gold | 32.9 | 8.3 |
| gold | perla-gold | 32.7 | 8.1 |
| metal | nickel | 32.2 | 6.9 |
| metal | inox | 31.0 | 2.8 |
| gold | washes-gold | 30.8 | 1.9 |
| metal | vanadium | 28.7 | 5.7 |
| metal | oxido | 23.9 | 10.4 |
| metal | rubi | 23.2 | 17.8 |

Bekannte Einschränkung (Satz 1): Bei 45 Renders ist der Himmel (HDRI) leicht gedreht – vorläufig akzeptiert; Satz 2 wurde mit derselben Szene wie Lauf v5 gerendert (Sichtprüfung an 16 Bildern aus 14 Serien: keine schwarzen/leeren Bilder, keine fehlenden Texturen, Himmel wie Referenz).

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
