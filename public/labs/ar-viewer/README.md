# Labs 3D/AR-Viewer – Beispielmodelle

Alle Modelle in `models/` und alle Poster in `posters/` sind **Beispielmodelle** für den
Labs-Prototyp `/de/labs/ar-viewer`. Sie sind **keine** Produkte aus dem Sortiment von
Platzhirsch Home Living und **keine** Herstellerdaten (insbesondere nicht Minotti o. ä.).

| Datei | Quelle | Autor | Lizenz |
|---|---|---|---|
| `models/sofa_02.glb`, `posters/sofa_02.webp` | https://polyhaven.com/a/sofa_02 (glTF 1k) | Kirill Sannikov | CC0 1.0 |
| `models/mid_century_lounge_chair.glb`, `posters/mid_century_lounge_chair.webp` | https://polyhaven.com/a/mid_century_lounge_chair (glTF 1k) | Kuutti Siitonen | CC0 1.0 |
| `models/modern_ceiling_lamp_01.glb`, `posters/modern_ceiling_lamp_01.webp` | https://polyhaven.com/a/modern_ceiling_lamp_01 (glTF 2k) | James Ray Cock | CC0 1.0 |

CC0 1.0 Universal (Public Domain Dedication): https://creativecommons.org/publicdomain/zero/1.0/ –
Poly Haven Lizenz: https://polyhaven.com/license. Nennung nicht erforderlich, wird aber freiwillig gemacht.

Bearbeitung: glTF + Texturen zu einer GLB gepackt, Texturen neu komprimiert, Farb-/Oberflächen-
varianten als `KHR_materials_variants` ergänzt (Sofa: digital umgefärbtes Leder; Leuchte:
eingefärbte Metallkappe). Skript: `src/components/Labs/ArViewer/tools/build-models.mjs`.
Poster = Vorschau-Renderings von Poly Haven (ebenfalls CC0), als WebP.

`decoders/` enthält die Draco- und Basis-(KTX2)-Decoder aus `three/examples/jsm/libs`
(Apache-2.0), selbst gehostet, damit `<model-viewer>` nichts von www.gstatic.com lädt.

## AR-Fotos (`fotos/`, Stufe 2, Labs-Pilot 27.10.2026)

16 Solpuri-Produkte: erstes Backoffice-Bild, lokal freigestellt (BiRefNet, MIT-Lizenz, `../platzhirsch-gpu-tools`), als GLB-Fläche mit Grundfläche (`scripts/arviewer/ar-foto.mjs`). Bildrechte: © solpuri, **keine schriftliche Freigabe** – nur Labs (noindex), Kennzeichnung auf der Seite. Maße aus den Solpuri-Datenblättern (URL je Produkt in `src/lib/arviewer/dims.json`). Rechte-Register: `src/lib/arviewer/rights.json`. Marken mit Veränderungsverbot (Minotti u. a.) werden hier nie abgelegt.

## raum/ (Stufe 2b „Raumbedarf“)

`<path_field>.glb`, `.usdz` und `.webp` erzeugt `scripts/arviewer/raumbedarf.mjs` aus den Herstellermaßen in `src/lib/arviewer/dims.json`; jeder Eintrag dort hat eine Quell-URL. Die Dateien enthalten **kein Herstellerbild**, nur Geometrie, Haarlinien und Text (Marke, Produkt, Maße). Sie sind ein eigenes Werk ohne Drittlizenz.

## fotos/*.usdz

Fertige USDZ für AR Quick Look, erzeugt aus den AR-Foto-GLBs mit `scripts/arviewer/ar-foto.mjs --neu-aus-glb`. Für die Rechte gilt dasselbe wie für die zugehörigen GLBs: nur Labs, Freigabe ausstehend.
