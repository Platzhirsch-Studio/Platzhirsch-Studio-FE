# Lokale GPU-Bildpipeline (RTX 4060): Freistellen, Hochskalieren, Web-Video

Stand: 26.10.2026. Alles liegt außerhalb des Repos in
`C:\Users\admin.local\Documents\platzhirsch-gpu-tools`. Im Projekt-Repo wurde nichts verändert, nur diese Doku ist neu.

## 1. Ergebnis kurz

| Aufgabe | Werkzeug | GPU (warm) | CPU (i7-7800X, 6 Threads) | Faktor |
|---|---|---|---|---|
| Freistellen 3 Bilder, ca. 2000 px | BiRefNet (MIT) | 0,86 bis 0,98 s/Bild fp32, 0,30 bis 0,57 s/Bild fp16 | 94 bis 200 s/Bild (Mittel 136 s) | etwa 100 bis 200x |
| Hochskalieren 2x (640 auf 1280 px) | Real-ESRGAN x2plus | 0,28 bis 0,70 s/Bild | 19 bis 27 s/Bild | etwa 50x |
| Hochskalieren 4x (640 auf 2560 px) | Real-ESRGAN x4plus | 1,0 bis 2,3 s/Bild (fp16: 1,0 bis 1,6 s) | 65 s/Bild | etwa 30 bis 50x |
| Video 15 s 4K auf 1080p+720p, AV1+H.264 | ffmpeg NVENC + NVDEC + scale_cuda | 2,6 bis 3,7 s je Variante | SVT-AV1 und x264: 14 bis 19 s je Variante | etwa 5x |

- Das erste Bild jedes Laufs braucht länger (CUDA-Warmlauf, 2,5 s). Das Modell lädt in 15 bis 25 s, bei warmem Datei-Cache in 3 s. Deshalb immer ganze Ordner verarbeiten, nicht Einzelbilder.
- VRAM-Spitze: Freistellen 3,1 GB (fp32) bzw. 1,6 GB (fp16), 4x-Upscaling 2,1 GB bei 512-px-Kacheln. Das passt mit viel Reserve in 8 GB.
- Die CPU-Zeiten wurden gemessen, während andere Agenten den Rechner nutzten. Sie sind daher eher pessimistisch, die Größenordnung stimmt aber.
- Das Video beim Test war ein synthetischer 4K-Ken-Burns-Clip (15 s, 30 fps), erzeugt aus `table-for-yard-area.jpg`.

## 2. Hardware und Treiber (geprüft)

- `nvidia-smi`: GeForce RTX 4060, 8188 MiB, Treiber 610.88, unterstützt CUDA bis 13.3, WDDM-Modus.
- Ein separates CUDA-Toolkit ist **nicht nötig**: Die PyTorch-Wheels bringen die CUDA-Runtime (13.2) und cuDNN (9.24) mit.
- PyTorch-Test: `torch 2.14.1+cu132`, `cuda.is_available() = True`, Matrixmultiplikation auf der GPU funktioniert.

## 3. Installation (ohne Admin, reproduzierbar)

```powershell
$T = "C:\Users\admin.local\Documents\platzhirsch-gpu-tools"
# 1) uv als einzelne Binary (offizielles Release-ZIP von astral-sh/uv auf GitHub)
Invoke-WebRequest https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-pc-windows-msvc.zip -OutFile $T\downloads\uv\uv.zip
Expand-Archive $T\downloads\uv\uv.zip -DestinationPath $T\bin      # uv 0.13.5
# 2) Python 3.12 + venv, Python und Cache bleiben im Arbeitsordner
$env:UV_PYTHON_INSTALL_DIR="$T\python"; $env:UV_CACHE_DIR="$T\uv-cache"
& $T\bin\uv.exe venv $T\.venv --python 3.12                          # CPython 3.12.15
# 3) PyTorch mit passender CUDA-Variante (uv erkennt den Treiber selbst)
& $T\bin\uv.exe pip install --python $T\.venv\Scripts\python.exe torch torchvision --torch-backend=auto   # -> cu132
# 4) Visual-C++-Runtime OHNE Admin (sonst Fehler "c10.dll ... nicht gefunden")
& $T\bin\uv.exe pip install --python $T\.venv\Scripts\python.exe msvc-runtime
Copy-Item $T\.venv\*.dll, $T\.venv\Scripts\vcruntime140*.dll $T\.venv\Lib\site-packages\torch\lib\
# 5) Modelle und Bibliotheken
& $T\bin\uv.exe pip install --python $T\.venv\Scripts\python.exe transformers timm kornia einops spandrel huggingface_hub safetensors
#    Real-ESRGAN-Gewichte (GitHub-Releases xinntao/Real-ESRGAN v0.1.0 / v0.2.1) -> $T\models\
#    BiRefNet: snapshot_download('ZhengPeng7/BiRefNet') mit HF_HOME=$T\hf-home (ca. 444 MB)
# 6) ffmpeg: BtbN-Build "ffmpeg-master-latest-win64-gpl.zip" -> $T\bin\ffmpeg.exe (N-128094, 25.10.2026)
```

**Stolperstein:** Auf dem PC ist kein Visual C++ Redistributable installiert. Ohne Schritt 4 startet torch nicht. Die saubere Dauerlösung wäre die einmalige Installation von `vc_redist.x64.exe` durch einen Admin. Danach kann Schritt 4 entfallen.

Installierte Versionen: torch 2.14.1+cu132, torchvision 0.29.1, transformers 5.20.2, timm 1.0.30, spandrel 0.4.2, Pillow 13.0.0, numpy 2.5.4.
Platzbedarf: insgesamt 7,5 GB, davon etwa die Hälfte der uv-Cache. Mit `uv cache clean` (UV_CACHE_DIR setzen) lässt er sich leeren.

### Ordnerstruktur

```
platzhirsch-gpu-tools\
  bin\        uv.exe, ffmpeg.exe, ffprobe.exe
  python\     von uv verwaltetes CPython 3.12
  .venv\      Python-Umgebung
  models\     RealESRGAN_x2plus.pth, RealESRGAN_x4plus.pth
  hf-home\    BiRefNet-Modell (Hugging Face Cache)
  scripts\    freistellen.py, hochskalieren.py, video-web.ps1
  downloads\  Original-ZIPs (uv, ffmpeg)
  test\       Testbilder (Kopien) und alle Ergebnisse
```

## 4. Befehle

```powershell
$T  = "C:\Users\admin.local\Documents\platzhirsch-gpu-tools"
$PY = "$T\.venv\Scripts\python.exe"

# Freistellen: Ordner rein -> <name>.png (transparent) + <name>.webp (auf #F4F2EE)
& $PY -I $T\scripts\freistellen.py  EINGANG  AUSGANG  [--fp16] [--bg "#FFFFFF"] [--max-kante 2400] [--device cpu]

# Hochskalieren 2x oder 4x (Ordner oder Einzeldatei), Ausgabe WebP/PNG/JPG
& $PY -I $T\scripts\hochskalieren.py EINGANG AUSGANG --faktor 4 [--fp16] [--tile 512] [--format png]

# Video -> AV1 + H.264 (1080p, 720p) + Poster WebP/JPG + fertiges <video>-Snippet
& $T\scripts\video-web.ps1 -Eingang clip.mov -Ausgang web [-Hoehen 1080,720] [-CqAv1 36] [-CqH264 30] [-MitTon] [-Cpu]
```

- `-I` (isolierter Modus) ist Absicht: So lädt Python keinen fremden Code aus dem aktuellen Ordner.
- `freistellen.py` arbeitet offline (`HF_HUB_OFFLINE=1`), weil das Modell lokal liegt.
- `hochskalieren.py` übernimmt einen vorhandenen Alpha-Kanal und skaliert ihn per Lanczos mit. Freistellen und danach Hochskalieren funktioniert also.
- Das Video-Skript nutzt im GPU-Modus die volle Kette NVDEC, `scale_cuda` und NVENC. Die Option `-MaxFps` gilt nur im `-Cpu`-Modus.

## 5. Testergebnisse im Detail

Testbilder (Kopien aus `public/Images`): `Home/slider/flos-stehleuchte-v3.webp` (2000x1500), `Home/slider/classicon-bell-beistelltische.webp` (1920x1439), `Kontakt/table-for-yard-area.jpg` (2048x1048). Für das Upscaling wurden sie auf 640 px verkleinert (`test\input-klein`), um Lieferantenbilder mit geringer Auflösung zu simulieren.

**Freistellen (visuell geprüft):**
- Outdoor-Esstisch mit 6 Stühlen: sehr gute Kanten, auch Flechtwerk und Stuhlbeine. Die Objekte "schweben", weil kein Schatten erhalten bleibt.
- Classicon Bell (viele Glastische): Die Formen sind sauber erfasst. Glas wird aber als **deckend** behandelt, die ursprüngliche Hintergrundfarbe bleibt im Glas sichtbar.
- Flos-Leuchten auf Tischen: Die Leuchten sind gut freigestellt. Das Modell entscheidet aber selbst, was "Objekt" ist: Ein Regalbrett und das Kabel bleiben erhalten, der rote Tisch fällt weg, Reste davon bleiben im Chromfuß sichtbar. Für Szenenbilder ist das Freistellen deshalb nur bedingt geeignet.
- Dateigrößen: WebP auf neutralem Grund 26 bis 94 KB, PNG mit Transparenz 0,8 bis 3,6 MB (PNG nur als Master verwenden, für das Web WebP/AVIF mit Alpha erzeugen).

**Hochskalieren:** Im Vergleich zu Lanczos sind Kanten, Kabel und Spiegelungen deutlich schärfer (`test\vergleich-lanczos-vs-esrgan.jpg`). Texturen wie Wandputz oder Stoff werden aber geglättet und wirken leicht "gemalt". Für Produktdetails und Stoffstrukturen gilt deshalb: nicht über 2x gehen und das Ergebnis immer prüfen.

**Video (15 s 4K-Quelle, 1080p):**

| Variante | Zeit | Größe | SSIM gegen Quelle |
|---|---|---|---|
| AV1 NVENC, CQ 36 (neuer Standard) | 2,9 s | 3,5 MB | n. gem. |
| AV1 NVENC, CQ 38 | 3,3 s | 2,8 MB | 0,974 |
| AV1 SVT-AV1 (CPU), CRF 34, Preset 8 | 15,8 s | 3,3 MB | **0,988** |
| H.264 NVENC, CQ 30 (neuer Standard) | 3,1 s | 5,6 MB | 0,968 |
| H.264 x264 (CPU), CRF 26, slow | 18,6 s | 4,3 MB | **0,976** |

Fazit: **NVENC ist 5x schneller, die CPU-Encoder liefern pro MB aber sichtbar mehr Qualität.** Für Massenarbeit, Vorschauen und Social-Clips eignet sich NVENC. Für die wenigen Hero-Videos der Website lohnt sich `-Cpu`, denn 15 bis 20 s pro Variante sind vertretbar. Der erste Lauf ohne GPU-Dekodierung (CPU dekodiert und skaliert 4K) war mit 6 bis 11 s pro Variante deutlich langsamer. Die volle GPU-Kette ist daher jetzt Standard.

## 6. Lizenzen (kommerzielle Nutzung)

| Komponente | Lizenz | Kommerziell? |
|---|---|---|
| BiRefNet (ZhengPeng7/BiRefNet, Code + Gewichte) | MIT (laut Model Card) | Ja, mit Lizenzhinweis |
| Real-ESRGAN (Code + Release-Gewichte x2plus/x4plus) | BSD-3-Clause (Repo-Lizenz, keine separate Gewichtslizenz angegeben) | Ja, mit Lizenzhinweis |
| spandrel (Modell-Lader) | MIT | Ja |
| PyTorch / torchvision | BSD-3-Clause | Ja |
| transformers, timm, kornia | Apache-2.0 | Ja |
| uv | MIT / Apache-2.0 | Ja |
| ffmpeg BtbN "gpl"-Build (mit x264) | GPL | Ja, als Werkzeug. Die erzeugten Videos unterliegen nicht der GPL. Nur bei Weitergabe der Binary gelten GPL-Pflichten |
| NVENC/NVDEC | Teil des NVIDIA-Treibers | Ja (Consumer-GPUs haben ein Limit gleichzeitiger Encoder-Sitzungen, hier irrelevant) |
| msvc-runtime (Microsoft VC++-DLLs) | Microsoft-Redistributable-Bedingungen | Für die interne Nutzung unproblematisch |
| **Nicht verwendet:** BRIA RMBG-2.0 | **CC BY-NC 4.0** | **Nein**, nur mit kommerzieller Vereinbarung mit BRIA |

Diese Angaben sind keine Rechtsberatung. Die Model Cards können sich ändern, deshalb vor einer größeren Nutzung erneut prüfen.

**Rechte an den Bildern:** Die Werkzeuge ändern nichts an den Urheber- und Nutzungsrechten der Ausgangsbilder. Herstellerfotos (Flos, Classicon, Minotti …) dürfen nur im Rahmen der Händler- bzw. Pressebedingungen der jeweiligen Marke bearbeitet werden. Ob Freistellen oder Hochskalieren dort erlaubt ist, muss je Marke geprüft werden. Eigene Fotos sind unproblematisch.

## 7. Grenzen

- **Glas, Chrom, Spiegel:** Transparenz wird nicht als Halbtransparenz erkannt. In spiegelnden Flächen bleiben Reflexe des alten Hintergrunds sichtbar. Diese Bilder müssen manuell nachgearbeitet werden.
- **Kein Schatten:** Freigestellte Möbel wirken schwebend. Für Produktbilder sollte ein weicher Bodenschatten ergänzt werden (noch nicht im Skript).
- **Objektwahl:** BiRefNet entscheidet selbst, was Vordergrund ist. Bei Szenen mit mehreren Objekten bleiben auch Regale und Kabel erhalten. Am besten funktionieren Einzelprodukte vor ruhigem Hintergrund.
- **Upscaling erfindet Details.** Für Stoffe, Holzmaserung und Marmor ist das keine echte Information. Die Ergebnisse dürfen nicht als "Detailfoto" eines konkreten Produkts gelten. Höchstens 2x verwenden und sichtbar prüfen.
- **Modellgröße:** Freistellen nutzt intern 1024x1024. Sehr feine Strukturen wie Haare oder Fransen bei 4000+ px verlieren Schärfe in der Maske (dafür gäbe es die BiRefNet-HR-Variante, nicht getestet).
- **AV1 im Browser:** Safari spielt AV1 nur auf Geräten mit Hardware-Decoder ab. Deshalb gibt es immer den H.264-Fallback, im Snippet ist er schon enthalten.
- **Kein VC++-Redistributable** auf dem System: Die DLL-Kopie in `torch\lib` ist ein Workaround und muss nach einem torch-Update wiederholt werden.
- **Ladezeit:** 15 bis 25 s beim Kaltstart pro Skriptaufruf. Für einen Batch-Betrieb wäre ein dauerhaft laufender Dienst sinnvoll.
- **8 GB VRAM:** Die drei Werkzeuge reichen. Generative Modelle wie SDXL- oder FLUX-Inpainting für Schatten oder Hintergründe wären nur mit Quantisierung bzw. Offloading möglich (nicht getestet).

## 8. Empfohlene nächste Schritte

1. Einmal `vc_redist.x64.exe` durch einen Admin installieren lassen, danach entfällt der DLL-Workaround.
2. In `freistellen.py` einen Bodenschatten ergänzen und AVIF/WebP mit Alpha ausgeben, statt PNG zu verwenden.
3. Für Hero-Videos `video-web.ps1 -Cpu` verwenden (bessere Qualität pro MB), für alles andere den GPU-Standard.
4. Pro Marke klären, ob Herstellerbilder bearbeitet werden dürfen (Freistellen, Upscaling), bevor bearbeitete Bilder live gehen.
5. Ergebnisse vor der Übernahme ins Repo immer visuell abnehmen. Die Pipeline schreibt bewusst nur in den Arbeitsordner.
