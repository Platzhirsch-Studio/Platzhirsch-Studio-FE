# Küchenplaner – Texturen

Alle Texturen stammen von ambientCG (https://ambientcg.com) und stehen unter
**CC0 1.0 Universal (Public Domain)** – https://docs.ambientcg.com/license/
Keine Namensnennung nötig; wir nennen die Quelle trotzdem.

Verarbeitung: 1K-JPG-Paket geladen, Farbe auf 1024 px (mozjpeg q80),
Normal (OpenGL) und Rauheit auf 512 px verkleinert. Jede Datei < 300 KB.

| Ordner      | Verwendung              | ambientCG-Asset |
|-------------|-------------------------|-----------------|
| marmor/     | Arbeitsplatte Marmor    | Marble021       |
| keramik/    | Arbeitsplatte Keramik, Front Beton hell | Concrete034, 2× gestapelt auf 1:1 (ersetzt am 01.11.2026 das zu dunkle Marble006; die Fotoansicht-Renderings Beton hell/Keramik wurden am 02.11.2026 mit denselben Dateien neu gerendert) |
| quarz/      | Arbeitsplatte Quarz     | Granite002A     |
| holz/       | Arbeitsplatte Holz, Front Eiche | Wood049 |
| front-nuss/ | Front Nussbaum          | Wood051         |
| boden/      | Fußboden                | WoodFloor051    |

Dateien je Ordner: color.jpg (sRGB), normal.jpg (NormalGL), roughness.jpg.
Abgerufen am 2026-10-26.

## Umgebungslicht (HDR) – Fix 2, 27.10.2026

| Datei | Verwendung | Quelle | Lizenz |
|---|---|---|---|
| hdr/studio_small_09_256.hdr | Umgebungslicht und Spiegelungen der 3D-Ansicht | Poly Haven „Studio Small 09“ (Sergej Majboroda), https://polyhaven.com/a/studio_small_09 – 1k-HDR von https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr | CC0 1.0 (https://polyhaven.com/license) |

Verarbeitung: 1024 × 512 per Box-Filter auf 256 × 128 verkleinert (Radiance RGBE, RLE),
105 KB statt 1,6 MB. Die Lightformer der Szene liegen darüber (Glanzlichter).

## Fotoansicht (Renderings) – 02.11.2026

`fotoansicht/`: 66 eigene Visualisierungen (Blender 4.5 LTS, Cycles/OptiX, 01.11.2026), 1600 × 1067 px WebP,
keine Fotos, keine KI-Bilder. Zuordnung: `src/lib/kuechenplaner/fotoansicht.js`. Quellen der Szenen-Assets
(Poly Haven / ambientCG, CC0) und Liste aller Dateien: `docs/bildquellen/QUELLEN-kuechenplaner-fotoansicht.md`.
