# Expertenrat 12: Creative Technologist (WebGL, Shader, 3D)

**Rolle:** Creative Technologist für WebGL, Shader, 3D und Asset-Pipeline · **Stand:** 26.10.2026 · **Grundlage:** `digital/01`, `02`, `03` (F4/F5), `12`, `13` (3.3, F8), `14`, `23-masterkonzept.md` Abschnitt 4, Code unter `src/components/Preview/*` und `src/app/[locale]/preview/*` (nur gelesen)

**Geprüft am 26.10.2026:**
- **Installierte Pakete** (`node_modules/*/package.json`): `three` 0.186.1 (MIT), `@react-three/fiber` 9.8.2 (MIT), `@react-three/drei` 10.7.9 (MIT), `@google/model-viewer` 4.4.0 (Apache-2.0), `lenis` 1.3.27 (MIT), `motion` 12.43.0 (MIT).
- **npm-Register** (`npm view`): `ogl` 1.0.11 (Unlicense), `postprocessing` 6.39.5 (Zlib), `@react-three/postprocessing` 3.2.2 (MIT), `curtainsjs` 8.1.6 (MIT), `gl-transitions` 2.0.0 (MIT), `detect-gpu` 5.0.70 (MIT), `@gltf-transform/cli` 4.5.1 (MIT), `meshoptimizer` und `gltfpack` 1.3.0 (MIT), `web-vitals` 6.2.3 (Apache-2.0).
- **Größen** laut bundlephobia-API (min/gzip): three 719/181 KB, R3F 179/56 KB, postprocessing 319/110 KB, ogl 128/33 KB (voll), curtainsjs 104/23 KB, detect-gpu 7/3 KB. **Selbst gemessen** (esbuild 0.25, minify, gzip -9): Mit `Renderer + Program + Mesh + Triangle + Texture` aus `ogl` bleiben nach Tree-Shaking **14,1 KB gzip** (50 KB min).
- **Hardware:** NVIDIA GeForce RTX 4060, 8 GB VRAM, Treiber 610.88 (`nvidia-smi`). **ffmpeg und Blender sind nicht installiert** (`which` findet beides nicht).
- **Prototypen:**
  - `/de/preview/galerie` liefert 200 (196 KB HTML). Bewegung nur über CSS (Scroll-Driven Animations, Hero-Zoom 2400 ms, Zeilen-Reveal 1100 ms), kein WebGL.
  - `/de/preview/buehne` liefert 200 (211 KB HTML). Dunkle, filmische Gestaltung, CSS-`view()`-Timelines mit `clip-path`. Lenis lädt dynamisch, nur bei `pointer: fine` und ohne Reduced Motion. Ein Video ist vorgesehen (Kommentar in `page.js` Z. 29), aber nicht eingebaut. `buehne/produkt/[slug]` ist noch leer (404).
  - `/de/preview/dreilaendereck` liefert 404. Bisher gibt es nur Komponenten unter `src/components/Preview/dreilaendereck`.
  - **Keiner der drei Prototypen nutzt bisher WebGL.** Das ist richtig so. Abschnitt 5 bewertet, ob und wo WebGL dazukommen darf.

**Ausgangsthese:** In diesem Markt entsteht Wow durch **Licht und Material**, nicht durch Technik. Minotti, Poliform und Rimadesio verkaufen Oberflächen: Leder, Bouclé, Glas, Aluminium, Marmor. Ein Creative Technologist hilft dem Auftritt dann, wenn diese Oberflächen besser zu sehen sind als im Herstellerkatalog. Shader-Effekte, die nur Aufmerksamkeit erzeugen, helfen nicht. **80 % des Wow-Effekts entstehen vorab auf der RTX 4060** (Rendern, Bake, Encoding). Nur **20 % rechnet der Browser live**, und das nur dort, wo das Gerät es sicher schafft.

---

## 1. Die wichtigsten Erkenntnisse

1. **Was vorab gerendert wird, schlägt live Gerendertes auf dem Handy.** Ein 10-Sekunden-Loop in AV1 (≈ 0,8–1,5 MB) zeigt auf jedem Gerät Lichtqualität aus Path-Tracing (Cycles/OptiX). Ein Echtzeit-Shader müsste dafür auf einer Mittelklasse-GPU dauerhaft arbeiten. Die Hardware-Encoder der RTX-40-Serie können AV1. Laut FFmpeg-Maintainer Timo Rothenpieler liefert `av1_nvenc` bei niedriger Bitrate weniger Artefakte als `hevc_nvenc` und kodiert im Preset „slow“ 75–100 % schneller.
   Quellen: [Phoronix, FFmpeg NVENC AV1](https://www.phoronix.com/news/NVIDIA-NVENC-AV1-FFmpeg) · [Guru3D](https://www.guru3d.com/story/ffmpeg-lands-nvidia-nvenc-av1-encoding-75-to-100-faster-encoding) · [FFmpeg `nvenc_av1.c`, Presets p1–p7](https://www.ffmpeg.org/doxygen/trunk/nvenc__av1_8c_source.html)
2. **AV1 spielt nicht überall, deshalb braucht es eine Codec-Leiter.** Apple dekodiert AV1 in Hardware erst ab A17 Pro (iPhone 15 Pro) und M3. Auf älteren iPhones springt H.264/HEVC ein. Der Browser wählt über `<source type="…; codecs=…">` selbst, dafür braucht es kein JavaScript.
   Quelle: [Bitmovin, Apple AV1 Support](https://bitmovin.com/blog/apple-av1-support)
3. **3D verringert das Kaufrisiko bei komplexen Produkten, erhöht aber die Denklast.** In Experimenten senkten immersive Darstellungen das wahrgenommene Risiko und steigerten die Zufriedenheit, vor allem bei komplexen Produkten. Gleichzeitig stieg die kognitive Last (ICIS 2019). In einer Studie mit 39 Teilnehmern schnitt die 2D-Oberfläche bei Effizienz und Zufriedenheit besser ab (EPI). Daraus folgt: 3D gehört dorthin, wo es eine Frage beantwortet („Passt der 3,5-m-Schirm auf meine Terrasse?“, „Wie wirkt die Leuchte über dem Tisch?“). Als Standardansicht taugt es nicht. Die oft zitierten „+94 % Conversion mit 3D/AR“ von Shopify lassen sich nicht bis zu einer Originalstudie zurückverfolgen und stammen von einem Anbieter. Ich nutze sie deshalb **nicht** als Planungsgrundlage.
   Quellen: [ICIS 2019, Immersive Interfaces](https://aisel.aisnet.org/icis2019/human_computer_interact/human_computer_interact/4) · [3D display interfaces in e-commerce, EPI](https://revista.profesionaldelainformacion.com/index.php/EPI/article/view/63964) · [AR Insider zur Quellenlage](https://arinsider.co/2021/01/18/data-dive-how-is-ar-boosting-ecommerce/)
4. **`<model-viewer>` mit Poster lädt das Modell erst nach einer Nutzeraktion. Das ist der einzige Weg, der Lighthouse-tauglich bleibt.** Das zeigen die offiziellen Lighthouse-Beispiele: Das Skript lädt nach der ersten Interaktion, ein Poster im Slot ist sofort sichtbar. iOS lädt für Quick Look zusätzlich eine USDZ-Datei. Deshalb gehört die Dateigröße der USDZ ins Budget.
   Quellen: [modelviewer.dev Lighthouse-Beispiel](https://modelviewer.dev/examples/lighthouse.html) · [Loading-Beispiele](https://modelviewer.dev/examples/loading/)
5. **Browser lassen nur wenige WebGL-Kontexte gleichzeitig zu.** In Chrome sind es etwa 16, auf dem Handy weniger. Darüber hinaus verwirft der Browser den ältesten Kontext. Wer pro Bildkarte einen eigenen Canvas anlegt, verliert auf Katalogseiten Bilder. Daraus folgt: **höchstens ein WebGL-Kontext pro Seite**, der zwischen Elementen wiederverwendet wird.
   Quellen: [WebKit-Test „oldest context lost“](https://webkit.googlesource.com/WebKit/+/master/LayoutTests/webgl/max-active-contexts-oldest-context-lost-expected.txt) · [bugnet.io](https://bugnet.io/blog/how-to-fix-too-many-active-webgl-contexts-oldest-context-will-be-lost)
6. **GPU-Kosten entstehen vor allem durch Pixel und Dauerbetrieb, kaum durch Geometrie.** MDN empfiehlt kleinere Render-Auflösung mit CSS-Hochskalierung, keine CPU-GPU-Synchronisation im Frame (`getError`, `readPixels`) und `powerPreference` bewusst zu wählen. `"high-performance"` geht zulasten des Akkus. Ein Render-Loop, der außerhalb des Sichtbereichs weiterläuft, ist der häufigste Akku-Fresser.
   Quellen: [MDN, WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) · [svilenkovic, webgl best practices](https://www.svilenkovic.com/3d/webgl-best-practices)
7. **Was den Main-Thread belastet, verschlechtert INP.** Das trifft auch das Texturen-Hochladen und Shader-Kompilieren. `createImageBitmap()` dekodiert außerhalb des Main-Threads. `KHR_parallel_shader_compile` verhindert Ruckler beim ersten Frame. OffscreenCanvas im Worker hat in einem Fallbericht UI-Ruckler beseitigt (Einzelfall, kein Benchmark).
   Quelle: [Evil Martians, OffscreenCanvas](https://evilmartians.com/chronicles/faster-webgl-three-js-3d-graphics-with-offscreencanvas-and-web-workers)
8. **Bewegung kann krank machen und unterliegt dem Recht.** Maßgeblich sind WCAG 2.2 SC 2.2.2 (Pause bei Bewegung > 5 s), 2.3.1 (höchstens 3 Blitze pro Sekunde) und 2.3.3 (Animation durch Interaktion abschaltbar, AAA). In AT gilt seit 28.06.2025 das BaFG. Großflächige Verzerrungen und Parallax auf Vollbild-Ebenen sind die typischen vestibulären Auslöser.
   Quellen: [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) · `digital/02` Abschnitt 5 · `digital/14` F10
9. **Die Konkurrenz zeigt es: Mehr Technik heißt nicht mehr Wirkung.** Fretz setzt GSAP, AOS und Lenis parallel ein (`digital/02`, 2.1). Minotti kommt auf LCP 18,9 s und CLS 0,4 (`digital/13`, F8). Höttges, reiter design und Dolce Vita haben weder 3D noch AR (`digital/03`, 2.2). **Der Vorsprung entsteht, wenn ein einzelner, perfekt kalibrierter Lichteffekt bei LCP ≤ 2,0 s läuft.** Dafür braucht es kein Showreel.

---

## 2. Konkrete Vorgaben für den Neuauftritt

### 2.1 Geräteklassen (Tiering): Jedes Erlebnis hat drei Stufen

| Stufe | Wer bekommt sie | Was läuft | JS-Kosten |
|---|---|---|---|
| **T0 „Still“** | `prefers-reduced-motion: reduce`, `Save-Data: on`, `navigator.connection.effectiveType` in `2g/3g`, kein WebGL2, Fehler beim Kontext, Crawler | Statisches Bild (AVIF), Crossfade ≤ 150 ms, alle Inhalte als HTML | 0 KB |
| **T1 „Film“** (Standard, auch Handy) | alle anderen | CSS-Scroll-Driven-Animations, View Transitions, **vorgerenderte Videos** (AV1/H.264), `<model-viewer>` nach Klick | 0 KB initial, Video-Insel ≈ 1 KB |
| **T2 „Licht“** (Bonus) | `pointer: fine` **und** `hardwareConcurrency ≥ 4` **und** `deviceMemory ≥ 4` (falls vorhanden) **und** Frame-Probe bestanden | Ein WebGL-Effekt pro Seite (Bildübergang oder Material-Licht, siehe 2.3) | ≤ 18 KB gzip, lädt per `import()` nach `load` + `requestIdleCallback` |

- **Frame-Probe statt GPU-Datenbank.** `detect-gpu` 5.0.70 (MIT, 3 KB) lädt seine Benchmark-Tabellen standardmäßig von unpkg. Das ist eine Drittland-Übertragung ohne Consent (`digital/14`, F13). Stattdessen rendern wir 20 Frames des echten Shaders unsichtbar und brauchen dafür keine Fremddatei. Liegt der Median über **12 ms** pro Frame, geht es zurück auf T1, und `sessionStorage` (in `try/catch`) merkt sich das für die Sitzung.
- **Handy bekommt standardmäßig T1.** Ausnahme: Material-Licht (2.3 B) darf auf dem Handy als **einmaliger** Licht-Sweep laufen (1 Durchgang, 2400 ms, dann Stopp). Einen Dauer-Loop gibt es auf dem Handy nicht.
- **Live-Umschalten:** Ändert sich `matchMedia('(prefers-reduced-motion: reduce)')` während der Sitzung, wechselt die Seite sofort auf T0 und gibt den Kontext frei (`WEBGL_lose_context`). Die Buehne-`SmoothScroll.js` macht das schon vorbildlich.

### 2.2 Harte Budgets für jeden WebGL-Baustein

| Größe | Grenze | Begründung |
|---|---|---|
| WebGL-Kontexte pro Seite | **1** (plus 1 für `<model-viewer>`, der intern einen Renderer für alle Instanzen teilt) | Kontextlimit, Speicher |
| JS für den Effekt (gzip) | **≤ 18 KB** (OGL-Kern 14,1 KB + Effekt ≤ 4 KB) | `digital/13` 3.3: Feature ≤ 10 KB im Initial-Bundle; hier **0 KB initial**, weil es nachgeladen wird |
| Canvas-Auflösung | `devicePixelRatio` gedeckelt auf **1,5** (Desktop) bzw. **1,25** (Tablet) | Pixelkosten wachsen quadratisch |
| Frame-Zeit GPU | **≤ 4 ms** auf Intel Iris Xe / Apple M1, gemessen mit `EXT_disjoint_timer_query_webgl2`, nur in Dev | Puffer für Scrollen und INP |
| Bildrate | 60 fps während eines Übergangs, **0 fps im Ruhezustand** (Render on demand) | Akku, Lüfter |
| Texturen | max. **2048 px** lange Kante, AVIF/WebP per `createImageBitmap(blob, { imageOrientation: 'flipY', premultiplyAlpha: 'none' })` | Dekodieren außerhalb des Main-Threads |
| Shader | WebGL2/GLSL ES 3.00, `precision mediump float` (für Farbe reicht das), keine Schleifen > 8 Iterationen, kein `discard` im Vollbild | Mobile Tile-GPUs |
| Kontext-Optionen | `{ antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: true, powerPreference: 'low-power', preserveDrawingBuffer: false }` | Bei 2D-Bildeffekten braucht es weder Tiefe noch MSAA |
| Pausieren | `IntersectionObserver` (Schwelle 0) stoppt den Loop außerhalb des Sichtbereichs, `visibilitychange` stoppt ihn im Hintergrund-Tab | Akku |
| Kontextverlust | Auf `webglcontextlost` folgen `preventDefault()` und Fallback auf T1. Bei `webglcontextrestored` wird neu aufgebaut, **ohne** Fehlermeldung an den Nutzer | Stabilität |
| CLS | Canvas liegt `position:absolute` über einem gleich großen `next/image`. **Das Bild bleibt im DOM** und ist das LCP-Element | LCP und SEO |

### 2.3 Die erlaubten Effekte, konkret für Platzhirsch

**A) Bildübergang „Seenebel“ (Markenwelten, Projektgalerie, Showroom-Galerie; nur T2)**
- **Wirkung:** Zwischen zwei Raumbildern zieht kurz ein weicher, heller Dunst durch, wie Morgennebel über dem Bodensee. Danach steht das neue Bild scharf da. Wellen, RGB-Split und Glitch gibt es nicht.
- **Shader:** Mischung über `smoothstep(p - 0.18, p + 0.18, n)`. Dabei ist `n` 2-Oktaven-Value-Noise (feste Textur 256 px, keine prozedurale fbm-Schleife) plus ein leichter vertikaler Gradient (Nebel steigt von unten). Dazu kommt ein Aufhellen um höchstens **+6 % Luminanz** in der Übergangszone, Farbe `#f3efe8` (warmes Papier).
- **Timing:** **820 ms**, Easing `cubic-bezier(0.22, 0.61, 0.36, 1)` (identisch mit `--ease-quiet` der Prototypen, falls dort so definiert, sonst angleichen), Eingabe gesperrt höchstens 150 ms. Bei schnellem Weiterklicken springt der Übergang ans Ende und startet neu, ohne Warteschlange.
- **Fallback T1:** CSS-Crossfade 400 ms, `opacity`. T0: 150 ms.
- **Bibliothek:** `ogl` 1.0.11 (Unlicense, Tree-Shaking gemessen 14,1 KB gzip). **Nicht three.js** für einen 2D-Quad (181 KB). `curtainsjs` 8.1.6 (MIT, 23 KB gzip) ginge auch, wird aber seit Jahren kaum weiterentwickelt.

**B) „Material-Licht“ (Produktseite, Stoff- und Materialwelt, Rimadesio-Glas; T2, auf dem Handy einmaliger Sweep)**
- **Wirkung:** Auf einem Detailfoto (Bouclé von Minotti, Rimadesio-Aluminium, Leder von Poliform) wandert ein Streiflicht mit dem Mauszeiger. Die Struktur des Materials wird sichtbar wie im Showroom, wenn man den Stoff ins Licht dreht. **Das ist der eigentliche Wow-Effekt, und er zeigt das Produkt statt der Technik.**
- **Asset-Produktion:** Photometrisches Stereo mit 4–8 Fotos desselben Ausschnitts, Kamera fest, Licht aus 4–8 Richtungen. Daraus entstehen auf dem PC eine **Normal Map** und eine **Albedo** (Open Source z. B. mit Python/NumPy, ein paar Zeilen Least-Squares, oder in Blender per Bake von einem Fotogrammetrie-Mesh). Größe 1600 × 2000 px (4:5), Normal Map als WebP Lossless ≤ 600 KB.
- **Shader:** Lambert + Blinn-Phong (Glanz `shininess` 16 für Stoff, 64 für Aluminium und Glas), Lichtfarbe **2700 K ≈ `#ffb46b`** abends bzw. **5600 K ≈ `#fff1e0`** am Tag, Intensität so gewählt, dass die mittlere Luminanz um höchstens ±8 % schwankt. Das Licht folgt dem Zeiger mit Dämpfung (Lerp 0,08 pro Frame) und kommt 600 ms nach `pointerleave` zur Ruhe.
- **Ehrlichkeit:** Das Foto ist echt, wir verändern nur die Beleuchtung. Bildunterschrift: „Detail aus unserem Showroom, Lichtführung interaktiv“. Herstellerfotos nehmen wir **nur** mit Freigabe (`digital/14`, F3).
- **Fallback T1:** Zwei echte Fotos (Licht links und rechts), Crossfade über CSS `view()`-Timeline beim Scrollen. 0 KB JS.

**C) „Bodenseelicht“ (Startseite, Showroom/Café; T1, also für alle)**
- **Wirkung:** Das Hero-Bild des Showrooms zeigt das Licht der aktuellen Tageszeit in Lochau: Morgen (kühl, 6500 K, flaches Licht), Mittag (neutral), Abend (warm, 3000 K, Spiegelung vom See an der Decke), Nacht (Innenlicht, Leuchten von Flos an).
- **Technik ohne Laufzeit-Shader:** 4 Varianten entstehen **vorab**. Entweder als echtes Foto zu 4 Tageszeiten (am besten) oder als Blender-Rendering eines nachgebauten Raums, dann aber gekennzeichnet. Die Server-Komponente wählt die Variante nach `Europe/Vienna`-Zeit und Sonnenstand, berechnet mit SunCalc-Formeln (die Formel ist 40 Zeilen lang, keine Abhängigkeit nötig). Die Route hat `revalidate = 900` (15 min ISR). **0 KB Client-JS**, das LCP-Bild bleibt ein einziges `next/image` mit `fetchPriority="high"`.
- **Optionaler Abend-Loop (T1, nur ab Viewport 1024 px, nach `load`):** 8–10 s Wasserspiegelung an der Decke als Video-Loop über dem Poster, `mix-blend-mode: screen`, Deckkraft **0,35**, Pause-Knopf sichtbar (WCAG 2.2.2).

**D) 3D und AR „Passt es?“ (Produktseite; Pilot nach `digital/03` F4)**
- `@google/model-viewer` **4.4.0** (Apache-2.0, ≈ 71 KB gzip plus three ≈ 181 KB gzip, also ≈ 250 KB). Lädt **nur nach Klick** auf die Fassade „In 3D ansehen · In Ihrem Raum“ per `next/dynamic(..., { ssr: false })`.
- Attribute: `ar ar-modes="webxr scene-viewer quick-look" ar-scale="fixed" ar-placement="floor|wall" camera-controls touch-action="pan-y" interaction-prompt="none" shadow-intensity="0.9" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral"`. Dazu ein `environment-image` als **eigene** 1K-HDR des Showrooms (≤ 400 KB, `.hdr` → RGBE oder `.ktx2`), damit Leder und Metall wie in Lochau aussehen statt wie im Studio-Standard.
- **Auto-Rotate aus.** Höchstens `auto-rotate-delay="4000"` mit `rotation-per-second="12deg"` und nur bei T2. Bei Reduced Motion nie.
- **Decoder selbst hosten** (Draco, Meshopt, KTX2), sonst lädt der Browser von `gstatic.com` (`digital/03` F4, DSGVO).
- Budgets: GLB ≤ **3 MB** (Ziel 1,5 MB), USDZ ≤ **8 MB**, ≤ 100 k Dreiecke (Sofa), ≤ 50 k (Leuchte), Texturen 2048 px KTX2 (UASTC für Normal Maps, ETC1S für Albedo), 1 Materialvariante je Stoff über `KHR_materials_variants`.
- **Text-Alternative unter dem Viewer:** Maße B × T × H, Sitzhöhe, Varianten als Liste (`digital/13` 3.3, Regel 6).
- **Erste Kandidaten:** Ein **Sonnenschirm von Tuuci oder Umbrosa in AR** (3–4 m Durchmesser kann sich niemand vorstellen) und **Pendelleuchten von Flos über dem Esstisch**. Beides beantwortet echte Fragen.

**E) React Three Fiber, nur auf eigener Route**
- `three` 0.186.1 + `@react-three/fiber` 9.8.2 (+ `drei` 10.7.9 nur mit Einzelimporten) ≈ 240–300 KB gzip. **Nur** für einen späteren Konfigurator oder Küchenplaner der Binni-Linie mit Steinplatten und **nur** auf einer eigenen Route wie `/de/kueche/planen`. Nie in geteilten Komponenten (`digital/13` F8). `postprocessing` 6.39.5 (110 KB gzip) ist für eine Händler-Website zu schwer. Wer Bloom oder SSAO will, backt das in die Textur.

### 2.4 Asset-Produktion auf der RTX 4060 (8 GB)

**Installation** (einmalig, außerhalb `src/`, Skripte in `tools/media/`):
- Blender 4.5 LTS (GPL-3.0), Renderer Cycles mit **OptiX** und OIDN-Denoiser.
- FFmpeg 7.x als „full build“ mit `av1_nvenc`, `hevc_nvenc` und `h264_nvenc` (LGPL/GPL je nach Build; wir verbreiten es nicht, die Lizenz ist also unkritisch). Prüfen mit `ffmpeg -hide_banner -encoders | findstr nvenc`.
- KTX-Software `toktx` (Apache-2.0), `@gltf-transform/cli` 4.5.1, `gltfpack` 1.3.0, Khronos glTF-Validator.
- Real-ESRGAN (BSD-3) für Upscaling **eigener** Fotos (CUDA).

**Render-Vorgaben (Cycles):**
- Packshot/Poster: 2400 × 3000 px (4:5), 512 Samples + OIDN, Filmic/AgX „Medium High Contrast“, Hintergrund `#faf8f4` (Paper aus `digital/01`), Schatten-Catcher. Richtwert 1–3 min pro Bild auf der 4060.
- Raum-Loop: 1920 × 1080, 24 fps, 240 Frames (10 s), 128 Samples + OIDN, Kamerafahrt höchstens 0,3 m bzw. 4° Schwenk über 10 s (ruhig, kein Drohnenflug).
- VRAM: Szenen ≤ 6 GB halten (4K-Texturen nur auf Hauptmaterialien, sonst 2K). Sonst fällt Cycles auf langsames Out-of-Core zurück.

**Video-Encoding (Hero und Abend-Loop):**
```
# AV1, Desktop 1920 px, ohne Ton, Loop-fähig (GOP = 5 s)
ffmpeg -i loop_master.mov -an -vf "scale=1920:-2,format=yuv420p10le" \
  -c:v av1_nvenc -preset p7 -tune hq -rc vbr -cq 34 -b:v 0 -maxrate 2.5M \
  -multipass fullres -g 120 -bf 3 hero-1920.av1.mp4

# AV1 Handy 960 px
ffmpeg -i loop_master.mov -an -vf "scale=960:-2,format=yuv420p10le" \
  -c:v av1_nvenc -preset p7 -tune hq -rc vbr -cq 36 -b:v 0 -maxrate 1.2M \
  -multipass fullres -g 120 hero-960.av1.mp4

# Fallback H.264 (alle älteren iPhones), CPU-x264 ist bei kleinen Dateien sauberer als NVENC
ffmpeg -i loop_master.mov -an -vf "scale=1280:-2,format=yuv420p" \
  -c:v libx264 -preset slow -crf 25 -profile:v high -movflags +faststart hero-1280.h264.mp4
```
- **Zielgrößen:** AV1 1920 ≤ **1,5 MB**, AV1 960 ≤ **700 KB**, H.264 1280 ≤ **1,8 MB** für 10 s.
- Die `cq`-Werte sind Startwerte. Pro Clip vergleicht man 3 Stufen mit VMAF (`ffmpeg -lavfi libvmaf`, Ziel ≥ 93). Die konkreten Werte fürs NVENC-Tuning sind nicht dokumentiert, nur die Optionsnamen (FFmpeg-Quellcode).
- HTML-Reihenfolge: `<source src="hero-1920.av1.mp4" type='video/mp4; codecs="av01.0.08M.10"' media="(min-width: 1024px)">`, danach die 960er-AV1 und die H.264-Datei (`avc1.640028`). `muted playsinline loop preload="none"`, `src` setzt erst ein `requestIdleCallback` nach `load` (`digital/02` F5).

**3D-Pipeline:** wie `digital/03` F5. Ergänzend: ein Blender-Python-Skript `tools/media/bake_pbr.py` backt BaseColor, Normal und ORM in 2048 px per OptiX. Danach folgt `gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress ktx2`.

**Kennzeichnung:** Jedes Rendering und jedes KI-hochskalierte Bild bekommt in der Bilddatenbank das Feld `entstehung: foto | rendering | ki-bearbeitet`. Renderings, die echt wirken, tragen auf der Seite den Hinweis „Visualisierung“ (`digital/14` F14, AI Act Art. 50 für KI-Anteile).

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen

1. **„Fassen Sie den Stoff an“: Material-Licht (2.3 B) auf 20 Top-Produkten.** Kein Händler im Dreiländereck und keine der Markenseiten (Minotti, Poliform) lässt das Licht über die Oberfläche führen. Das wirkt wie Haptik am Bildschirm und gehört zum Ritual im Showroom („Kommen Sie, und fühlen Sie es selbst“). Der Effekt verweist auf den Termin, statt ihn zu ersetzen.
2. **Die Startseite kennt die Tageszeit am See** (2.3 C). Wer abends um 21 Uhr aus Zürich schaut, sieht den Showroom im Abendlicht mit Flos-Leuchten an. Wer morgens schaut, sieht Morgenlicht. Das kostet 0 KB JS und ist für Instagram-Reels erzählbar („Unser Haus, zu jeder Stunde“).
3. **AR-Schirm auf der eigenen Terrasse in Originalgröße** (`ar-scale="fixed"`), mit dem QR-Code als Karte im Showroom. Gerade im Outdoor-Segment kann sich niemand 3,5 m vorstellen. Danach folgt „Vor-Ort-Termin mit Schirm-Muster“ als echter nächster Schritt.
4. **Katalog → Produkt als Shared-Element-Morph** (View Transitions, `digital/02` F3) **plus** „Seenebel“ beim Wechsel zwischen Projektbildern. Zusammen wirkt der Auftritt wie ein durchgehender Film, ohne Smooth-Scroll-Hijacking.
5. **Küche der Binni-Linie: Steinplatte im echten Licht.** Pro Stein (z. B. Calacatta, Nero Marquina, Quarzit) wird ein Plattenscan als 4096-px-Textur mit Normal Map erstellt. In einer einfachen R3F-Szene auf eigener Route sieht man eine Kücheninsel 2,4 × 1,0 m und kann zwischen 6 Steinen und 3 Lichtstimmungen umschalten. Gerendert wird nur bei Änderungen (`frameloop="demand"`). Das ist leistbar und anschaulich. Es zeigt **Größe der Maserung und Fugenbild**, und genau das fragen Kunden bei Stein.
6. **„Ein Abend im Haus“ als 10-s-Loop**, vorgerendert oder gefilmt und auf der 4060 in AV1 kodiert, unter 1,5 MB. Fretz nutzt für Ähnliches drei Animationsbibliotheken. Wir zeigen schönere Bilder bei weniger Daten.
7. **Lichtplanung mit Flos und Occhio zum Ausprobieren:** ein Grundriss-Ausschnitt mit 3 Leuchten. Per Klick wechselt die Lichtsituation zwischen 4 vorgerenderten Bildern (Cycles, physikalisch korrekte IES-Profile der Hersteller, wenn freigegeben). Es braucht keine Echtzeit, nur 4 Bilder und einen Crossfade. Das ist ein Gesprächsanlass für Architekten.

---

## 4. Was man auf keinen Fall tun darf

1. **Kein WebGL im LCP-Pfad.** Die Seite wartet nie auf einen Shader. Das LCP-Element ist immer ein `<img>` bzw. `next/image`, der Canvas darf es nur überlagern.
2. **Kein Vollbild-Shader im Dauerbetrieb** (flüssiger Hintergrund, Partikelfelder, Noise-Gradient-Hero). Er kostet Akku, lässt den Lüfter anspringen und wirkt nach Agentur-Showreel. **Partikel gibt es auf der Website gar nicht.** Allenfalls Staub im Lichtstrahl in einem vorgerenderten Film, und auch das nur sehr dezent.
3. **Kein Distortion-, Glitch-, RGB-Split- oder Ripple-Effekt auf Produktbildern.** Er verfälscht Farbe und Form, ist potenziell irreführend (UWG) und für Menschen mit vestibulären Beschwerden belastend.
4. **Keine Cursor-Ersatz-Effekte, kein Preloader, kein Intro-Screen, keine „WebGL wird geladen…“-Balken.** Inhalte sind sofort da.
5. **Kein three.js für 2D-Effekte und kein `postprocessing` auf normalen Seiten.** 181 bzw. 110 KB gzip für einen Bildübergang sind nicht vertretbar.
6. **Kein Canvas pro Karte.** Höchstens ein Kontext pro Seite, sonst verliert der Katalog Bilder (Kontextlimit).
7. **Kein Auto-Rotate und kein Autoplay-3D.** 3D startet nur auf Wunsch.
8. **Keine Herstellermodelle oder -texturen ohne schriftliche Freigabe** (`digital/03` F4, `digital/14` F3). Keine Renderings, die als Foto einer echten Referenz durchgehen.
9. **Keine Fremd-CDNs für Decoder, HDRs oder GPU-Benchmarks** (gstatic, unpkg). Alles wird selbst gehostet, sonst gibt es DSGVO-Probleme.
10. **Kein Inhalt nur im Canvas.** Alles, was im WebGL steht (Text, Preise, Maße), steht auch im HTML, für SEO, Screenreader und T0.
11. **Keine Drucktechnik als Effekt**, zum Beispiel pulsierende „Nur noch 2“-Hinweise, Countdown-Animationen oder ein Shader-Glow auf dem CTA (Dark Patterns, DSA Art. 25 / UGP-Richtlinie). Licht inszeniert das Produkt und erzeugt keinen Druck.
12. **Keine Lenis-Pflicht.** Die Buehne setzt Lenis vertretbar ein: nur bei `pointer: fine`, Reduced Motion wird beachtet, dynamischer Import. Für die Seite mit dem Shader-Bildübergang soll Lenis aber **aus** bleiben, weil beide sich Frames auf dem Main-Thread teilen würden. Messen und dann entscheiden (Checkliste K9).

---

## 5. Prüf-Checkliste für die drei Prototypen

**Skala je Kriterium:** 0 = fehlt oder verletzt, 1 = teilweise, 2 = erfüllt, 3 = vorbildlich. **Gewicht** in Klammern, Höchstwert 3 × Summe der Gewichte = **90 Punkte**. „K.-o.“ heißt: Bei 0 Punkten gilt der Prototyp in dieser Disziplin als durchgefallen.

| # | Kriterium (Gewicht) | So wird gemessen | 3 Punkte, wenn … |
|---|---|---|---|
| K1 | **LCP unberührt** (3, K.-o.) | Lighthouse mobil, 3 Läufe, Median; LCP-Element im Performance-Panel | LCP ≤ 2,0 s, LCP-Element ist ein Bild, kein Canvas und kein Video |
| K2 | **0 KB Effekt-JS im Initial-Bundle** (3) | `next experimental-analyze` bzw. Network-Tab: `ogl`, `three`, `model-viewer`, `lenis` erst nach `load` oder Klick | Kein schwerer Chunk vor `load`; Effekt-Chunk ≤ 18 KB gzip |
| K3 | **Tiering vorhanden** (2) | DevTools: Reduced Motion emulieren, „Save-Data“, CPU 6× Throttling | T0/T1/T2 sichtbar unterschiedlich, Inhalt in allen Stufen vollständig |
| K4 | **Reduced Motion live** (2, K.-o.) | Einstellung während der Sitzung umschalten | Bewegung stoppt sofort, Kontext wird freigegeben, Crossfades ≤ 150 ms bleiben |
| K5 | **GPU-Last im Ruhezustand** (2) | Chrome Performance-Monitor „GPU“ bzw. Task-Manager, 10 s ohne Eingabe | 0 Frames gerendert, wenn nichts passiert. Kein rAF-Loop außerhalb des Sichtbereichs |
| K6 | **Ein Kontext pro Seite** (1) | Konsole: `document.querySelectorAll('canvas').length`, Warnungen „Too many active WebGL contexts“ | ≤ 1 (+ model-viewer), keine Warnung beim Scrollen durch Katalog |
| K7 | **Fallback bei Kontextverlust** (1) | `gl.getExtension('WEBGL_lose_context').loseContext()` in der Konsole | Bild bleibt sichtbar, keine Fehlermeldung, Wiederaufbau nach `restoreContext()` |
| K8 | **Licht zeigt Material** (3) | 3 Personen aus Zielgruppe/Team, 5-Sekunden-Test: „Was ist Ihnen aufgefallen?“ | Antworten nennen Produkt, Material oder Ort, nicht „der Effekt“ |
| K9 | **INP unter Effekt** (2) | Web-Vitals-Extension, 10 Klicks auf Galerie-Pfeile während eines Übergangs, CPU 4× | INP ≤ 150 ms, kein Long Task > 50 ms durch Textur-Upload oder Shader-Compile |
| K10 | **Video-Disziplin** (2) | Network-Tab, Datei-Typ und -Größe; Pause-Knopf per Tastatur | AV1 + H.264-Fallback, ≤ 1,5 MB, `preload="none"`, Start nach `load`, Pause erreichbar, kein Laden bei Save-Data |
| K11 | **3D-Fassade** (2, falls 3D vorhanden) | Produktseite laden, Netzwerk prüfen | Nur Poster bis zum Klick, Decoder vom eigenen Server, Maße als Text, `ar-scale="fixed"` |
| K12 | **Barrierefreiheit der Effekte** (2) | Tastatur-Durchlauf, axe DevTools, Blitz-Check (PEAT oder Sichtprüfung) | Alle Bedienungen per Tastatur, Fokus sichtbar ≥ 3:1, keine Blitze, `aria-hidden` auf dem Canvas, Alternativtext am Bild darunter |
| K13 | **Ehrlichkeit der Bilder** (2, K.-o.) | Bildquelle und Kennzeichnung prüfen | Renderings und KI-Bearbeitung gekennzeichnet, keine Herstellerassets ohne Freigabe |
| K14 | **Wiedererkennbarkeit „Bodensee“** (2) | Vergleich mit Fretz, Höttges, reiter design nebeneinander | Licht, Wasser, Tageszeit oder Ort sind als Signatur erkennbar; kein austauschbarer Agentur-Effekt |
| K15 | **Pflegeaufwand** (1) | Code lesen: Wie viel Arbeit macht ein neues Bild oder Produkt? | Neues Material = 2 Dateien (Albedo, Normal) + 1 JSON-Eintrag; keine Shader-Änderung |

**Auswertung:** ≥ 75 Punkte: technisch freigabefähig · 60–74: freigabefähig mit Auflagen · < 60 oder ein K.-o. bei 0: zurück in die Werkstatt.

**Vorläufige Einschätzung am 26.10.2026 (Code und HTML gelesen, ohne Lighthouse-Lauf):**
- **Galerie:** K1/K2/K4 voraussichtlich stark (nur CSS, Hero mit `preload` + `fetchPriority="high"`, Reduced Motion über `@media`-Blöcke). K8/K14 sind noch offen, weil es keinen Licht- oder Materialeffekt gibt. Bester Kandidat für Material-Licht (2.3 B) auf der Produktseite und „Bodenseelicht“ (2.3 C) im Hero.
- **Buehne:** Filmische Grundlage, Lenis sauber begrenzt. Das Video ist erst als Kommentar vorbereitet und muss K10 erfüllen. Bester Kandidat für den Abend-Loop und den Seenebel-Übergang zwischen Markenbildern. Lenis und Shader auf derselben Seite nach K9 messen.
- **Dreiländereck:** noch keine Route (404), nicht bewertbar. Naheliegend wären der AR-Schirm und der Dreiländer-Service mit einer einzigen ruhigen Karte als SVG. Ein 3D-Globus wäre hier falsch.

---

## Quellen

- FFmpeg NVENC AV1: https://www.phoronix.com/news/NVIDIA-NVENC-AV1-FFmpeg · https://www.guru3d.com/story/ffmpeg-lands-nvidia-nvenc-av1-encoding-75-to-100-faster-encoding · https://www.ffmpeg.org/doxygen/trunk/nvenc__av1_8c_source.html
- Apple AV1: https://bitmovin.com/blog/apple-av1-support
- model-viewer: https://modelviewer.dev/examples/lighthouse.html · https://modelviewer.dev/examples/loading/
- WebGL-Praxis: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices · https://evilmartians.com/chronicles/faster-webgl-three-js-3d-graphics-with-offscreencanvas-and-web-workers · https://www.svilenkovic.com/3d/webgl-best-practices
- Kontextlimit: https://webkit.googlesource.com/WebKit/+/master/LayoutTests/webgl/max-active-contexts-oldest-context-lost-expected.txt · https://bugnet.io/blog/how-to-fix-too-many-active-webgl-contexts-oldest-context-will-be-lost
- 3D/AR-Evidenz: https://aisel.aisnet.org/icis2019/human_computer_interact/human_computer_interact/4 · https://revista.profesionaldelainformacion.com/index.php/EPI/article/view/63964 · https://essay.utwente.nl/essays/87808 · https://arinsider.co/2021/01/18/data-dive-how-is-ar-boosting-ecommerce/
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Projektintern: `Marktresearch/digital/02`, `03`, `13`, `14`, `23-masterkonzept.md`
