# Wow-Einstieg „Pause“ – Umsetzung (Phase A, Push-Runde 4)

**Stand:** 28.10.2026 · **Team:** Wow · **Grundlage:** `wow-spezifikation.md` (Vision A „Von Hand zum Raum“, verschlankt), Antreiber-Berichte Runde 1–4 (`qa-screenshots/wow/antreiber-*-r1.md` … `-r4.md`) · **Branch:** `feature/neuauftritt` (nicht committet)
**Status:** gebaut, im Dev-Server **und im Produktions-Build außerhalb des Repos** geprüft. Produktion bleibt aus, bis der Inhaber freigibt (`NEXT_PUBLIC_WOW_HERO=1`).

## 0. Push-Runde 4 (Antreiber Runde 4: awwwards 7,5 · luxus-cd 6 · Wächter 7, kein Veto)

Reihenfolge: zuerst der Freigabe-Blocker des Wächters (Safari), dann was den Score am stärksten hebt. Belege liegen in `qa-screenshots/wow/push-r4/`:
- Screenshots: `shoot/de--*.png`
- Standbilder: `stills/` (t = 0 / 400 / 950 / 1250 / 2200 ms, Einladung, offene Linie, Desktop und Pixel)
- Dev-Videos: `dev/*.webm` mit `*-metrics.json` und `sheet-*.png`
- **Produktions-Videos:** `prod/{iphone,pixel,desktop}.webm`, dazu `prod/iphone-run2`, `prod/iphone-run3` und die Kontaktbögen `prod/sheet-iphone.png`, `prod/sheet-pixel.png`
- Produktionsmessung Moto: `prod-moto/moto-prod.json`; LCP-Wache: `pw-prod-lcp.json`
- e2e-Logs: `e2e-dev.log`, `e2e-dev-rerun.log`, `e2e-prod.log`, `e2e-startseite.log`

Skripte:
- `push-r4-prod.mjs`: Build in `../ph-prod-wow-r4`, Port 3171
- `push-r4-video.mjs`: Attribut-Protokoll per MutationObserver. Damit ist `penStart` wieder gemessen, auch beim Wischstift (r3 meldete `null`). Dazu die Papieranalyse jedes Videobilds.
- `push-r4-stills.mjs`
- `push-r4-reshare.mjs`

### Messwerte Produktion

Gemessen am Build außerhalb des Repos (`next start` :3171) im Moto-G4-Profil (4× CPU, 150 ms RTT, 1,6 Mbit/s), mit kaltem Kontext und offenem Cookie-Banner.

| Posten | Grenze / Ziel | gemessen |
|---|---|---|
| LCP p75, LCP-Wache `tests/e2e/wow-prod-lcp.spec.js` | ≤ 2,0 s / Ziel ≤ 1,8 s | **1,76 s** (1,66–1,76 s, 5 Läufe, keiner wiederholt); Element: Hero-`<img>` |
| LCP p75, `push-r3-prodmeasure.mjs` | ≤ 2,0 s | **1,80 s** (1,58–1,81 s, 7 Läufe). LCP = FCP in jedem Lauf: Das Foto ist zum ersten Bild schon da, die Grenze setzt die Seite insgesamt (91 KB gzip HTML, davon Bühne 6 KB) |
| Handy-Foto | AVIF ≤ 60 KB | **16 KB** AVIF (1080 w, q 50), `fetchpriority=high` |
| CLS | < 0,05 | **0** |
| „Raum sichtbar“ nach FCP | ≤ 2,4 s | p75 2,12 s (Moto), Pixel-Video 2,35 s, iPhone 2,25 s, Desktop 1,61 s |
| **Safari: Papieranteil nach der Freigabe** | Blocker r4 | **iPhone/WebKit 3 von 3 Videos: höchstens 34,9 %** (genau die Einladung), am Ende 0 %. Pixel 35 %, Desktop 35 %. Der 75-%-Rückfall ist weg |
| iPhone 393 × 659, Banner offen | „Termin wählen“ ≤ 500 px | Unterkante **492 px**, Banner ab 514 px; Bühne 16:10 statt 2:1 (+25 % Bildfläche) |
| e2e `wow-hero.spec.js` | – | **19/19 grün** im Dev und in der Produktion; `r3-startseite` 10/10; Unit-Tests wow 12/12, Startseite 15/15 |

### Umgesetzt

| Forderung | Umsetzung |
|---|---|
| **Wächter #1 Safari-Rückfall (Blocker)** | Die Vergleichskante läuft nicht mehr über `clip-path` mit `calc(var())`, sondern über zwei gegenläufige Transforms (`.cut` um `--cut − 100 %`, `.cutIn` zurück). Das ist dieselbe Compositor-Technik wie bei der Freigabe. `wow-park` ist gestrichen, und beim Wechsel Sequenz → Ruhe gibt es keinen Übergang. Neuer Test im WebKit-Video (`wow-hero.spec.js` mit `tests/e2e/wow-paper.js`): Jedes Videobild wird ausgewertet. Nach der Freigabe dürfen höchstens 38 % Papier zu sehen sein (nur die Einladung), am Ende höchstens 2 %. Ein Unit-Test verbietet `clip-path` in allen Keyframes |
| **luxus-cd #3, Wächter #2 Ruhezustand** | In Ruhe steht nur das Foto, randlos, ohne Streifen, Rasterreste und Griff am Rand. Der Pixeltest prüft: ganzer Rahmen = Foto. Die Werkzeugleiste „Linie · Licht · Raum“ und „Noch einmal“ sind gestrichen. An ihrer Stelle steht **eine** stille Schaltfläche „Die Linie zeigen“ / „Nur das Foto“ (am Handy als Papierchip auf dem Foto) |
| **awwwards #2, Wächter #2 Regler als Einladung** | Wenn die Sequenz von selbst endet, gleitet die Zeichnung einmal auf 35 % und federt zurück, mit sichtbarem Griff (1,4 s, nur Compositor). Das entfällt bei reduced motion, nach einem Sprung per Eingabe und beim zweiten Aufruf. Der Griff misst 56 px und trägt die Beschriftung **„Linie ↔ Raum“**. Die Beschriftung läuft ins Foto und wird am Rand nicht abgeschnitten |
| **awwwards #3 größere Bühne am Handy** | 16:10 statt 2:1 (246 statt 197 px). Die Leiste unter dem Foto entfällt, die Bildzeile steht klein unter „Zur Planung“ (Screenreader lesen die figcaption). Die H1 hat am Handy keinen Abstand oben. 4:3 geht erst, wenn das Banner auf `ph:wow-done` wartet (siehe unten) |
| **awwwards #4, luxus-cd #4 Split aufbrechen** | Ab xl steht der Text in Spalten 1–4, die Bühne in 5–12 bis an die rechte Kante: 923 von 1440 px (64 %, vorher 56 %). Die Horizontlinie endet weiter an der Satzkante der H1. Nachtrag W40 |
| **awwwards #1 Bildschärfe** | Befund geprüft: Die Quelle hat **2048 × 1228 px**, ausgeliefert werden bis zu 1920 w als AVIF. Die gemeldeten „720 × 431“ sind `naturalWidth` nach der Dichtekorrektur des srcset (1920 w bei `sizes` 50vw = 720), nicht die Datei. Echt war: `sizes="50vw"` unterschätzte die Bühne, sodass ein 1×-Bildschirm die 750-w-Datei für 813 px nahm. Neu: `(min-width:1280px) 66vw, (min-width:1024px) 56vw, 100vw` (nur bei eingeschaltetem Wow). Ergebnis: 1× Desktop 1080 w, 2× Desktop 1920 w; e2e prüft „Datei ≥ Rahmenbreite“ |
| **luxus-cd #2 kein leeres Papier** | Ab dem ersten Bild steht eine **Bleistift-Vorzeichnung** des ganzen Raums: alle Federpfade, 0,6 px, 30 %, im Server-HTML. Die Hilfslinien sind kräftiger (0,7 px, 55 %), die Tusche zieht darüber. Damit ist eine erkennbare Kontur ab FCP da (iPhone-Produktionsvideo ab 0,4 s) |
| **Wächter #4 Höhepunkt** | Der Hold dauert 1400 ms (vorher 1000, nur die Ruhephase ist länger), Ende 3240 ms. Warmer Kern 2,25 px (Handy 1,9), Deckkraft 1,0, ab 640 px mit weichem Schein |
| **Wächter #3 LCP-Wache** | `tests/e2e/wow-prod-lcp.spec.js` (nur mit `WOW_PROD_LCP=1` und `BASE_URL`), Moto-Profil, 5 Läufe. Läufe unter Fremdlast (FCP > 2 s) werden wiederholt, nicht verworfen. Ziel p75 ≤ 1,8 s, Handy-AVIF ≤ 60 KB, LCP-Element im Hero. Zwei Fallen sind behoben: Im Desktop-Projekt erbte der Kontext `screen` 1920 und lud zusätzlich das 93-KB-Desktopbild; der Trace kostet Hauptthread-Zeit (darum aus) |
| **Cookie-Banner (alle drei)** | `ph:wow-done` kommt jetzt **genau einmal** in jedem Fall, also auch bei reduced motion, beim zweiten Aufruf und nach einem Sprung. Zusätzlich gibt es `window.phWowDone = true` für späte Zuhörer. Das Banner selbst gehört dem Teamleiter |
| **luxus-cd #7 iOS in Produktion** | Im WebKit-Produktionsvideo sind Vorzeichnung, Tuschelinie, Licht, Freigabe, warme Deckungslinien, Einladung und Ruhe zu sehen (`prod/sheet-iphone.png`) |
| **luxus-cd #4 H1-Variante B** | steht im A/B-Paket (`wow-messages-vorschlag.json`, `_vorschlagInhaber`) |
| **Messskript** | `push-r4-video.mjs` ersetzt `push-r3-video.mjs`: Der Stiftstart kommt aus dem Attribut-Protokoll statt aus dem Selektor `[data-gesture] path` |

### Entscheidungen bei Widersprüchen

1. **Regler im Ruhezustand: sichtbar (awwwards) oder weg (luxus-cd, Wächter)?** Entschieden ist ein ruhiges Foto ohne Griff, dafür einmal die Einladung mit Griff und Beschriftung und danach die Schaltfläche „Die Linie zeigen“. So ist das Werkzeug auffindbar, ohne als halb geladenes Bild zu wirken. Der Wächter verlangte „Zucken **oder** Label“; die Einladung erfüllt beides.
2. **Wächter-Test „Papier nach `done` nie über 10 %“ gegen die Einladung mit 35 % (awwwards):** Die Einladung ist gewollt. Der Test erlaubt deshalb höchstens 38 % nach der Freigabe und höchstens 2 % am Ende. Der Safari-Fehler (75 %) würde weiter auffallen.
3. **Handy 4:3 (awwwards) gegen „Termin wählen“ über dem Banner (Wächter, hart):** 16:10 ist das Größte, was mit offenem Banner passt (492 von 514 px). Wartet das Banner auf `ph:wow-done`, ist der Schalter für 4:3 eine Zeile CSS.
4. **Bild ≥ 2400 px (awwwards):** Kein größeres Original im Projekt, kein KI-Upscale. Die Unschärfe war der `sizes`-Fehler und ist behoben. Eine Datei ≥ 2400 px muss der Inhaber liefern (Shooting, Bibel §7).
5. **Architektenstrich mit Überschüssen (luxus-cd #1):** Das wird erst mit Haralds echtem Strich (Phase B) gebaut. Überschüsse in der Phase-A-Linie wurden in r3 als „Klammern“ kritisiert, deshalb kein Hin und Her.
6. **Unterschrift oder Porträt (luxus-cd #5):** nur mit echtem Material und Freigabe. Das ist offen, Kunst-Ersatz wird nicht gebaut.

### Offen

- **Inhaber:**
  - Phase B (Harald zeichnet einen Sessel über einen Ausdruck, Scan, Foto des Kartonmodells, Einwilligung)
  - Originalfoto ≥ 2400 px
  - Unterschrift oder Porträt
  - H1-A/B
  - Bildregister für die Sessel-Kontur
  - `NEXT_PUBLIC_WOW_HERO=1`
- **Teamleiter:**
  - Cookie-Banner erst nach `ph:wow-done` bzw. `window.phWowDone`. Danach am Handy 4:3 möglich.
  - Der Sofaplaner-Build-Fehler blockiert weiter den Repo-Build. Der Build lief deshalb in `../ph-prod-wow-r4`, die Labs wurden nur in der Kopie entfernt; Junction mit `node qa-screenshots/wow/push-r4-prod.mjs clean` lösen.

### Nachträge für die Design-Bibel (Vorschlag, auch in `wow-spezifikation.md` §11)

| # | Stelle | Vorschlag | Begründung |
|---|---|---|---|
| W40 (neu) | §6 Hero / §10.2 | Im Einstieg sind Raum und Typo **eine** Komposition: Die Bühne nimmt ab xl mindestens 60 % der Breite und läuft randlos bis an die rechte Kante. Eine Linie aus dem Bild darf bis an die Satzkante der H1 laufen. Die H1 steht immer auf Papier, nie auf dem Foto | awwwards #4, luxus-cd #4: Der Split-Hero ist das Vorlagen-Muster. Die Linie aus dem Foto, die an der Schrift endet, sagt ohne Worte „erst die Linie, dann der Raum“ |
| W41 (ersetzt W37) | §12 Signature | Der Ruhezustand ist das Foto allein. Das Werkzeug (Vergleichsregler) zeigt sich einmal als Einladung (≤ 1,4 s, nur Compositor, nie bei reduced motion) und danach über eine stille Textschaltfläche; Griff 56 px mit Beschriftung | luxus-cd #3, Wächter #2, awwwards #2 |
| W42 (neu) | §8.2 Motion | Kanten und Masken in Signature-Animationen nur mit `transform`/`opacity`, kein animiertes `clip-path` mit `calc(var())`; WebKit-Videotest als Pflicht | Wächter #1, 3/3 Safari-Videos |
| W43 (ändert W39) | §6 Formate | Hero-Bühne am Handy 16:10 ohne Leiste darunter; 4:3, sobald das Cookie-Banner auf `ph:wow-done` wartet | awwwards #3, Wächter #3 |
| W44 (neu) | §8.3 | Erstes Bild einer Zeichen-Sequenz ist nie leeres Papier: Hilfslinien und Vorzeichnung stehen im Server-HTML | luxus-cd #2 |

---

*Ab hier der Stand nach Push-Runde 3 (Geschichte). Wo Runde 4 abweicht, gilt §0 oben.*

## 0a. Push-Runde 3 (Antreiber Runde 3: awwwards 7 · luxus-cd 7 · Wächter 7, kein Veto)

Reihenfolge: zuerst die Freigabebedingung des Wächters (Produktion messen), dann was den Score am stärksten hebt. Belege: `qa-screenshots/wow/push-r3/` (Screenshots `de--*.png`, Einzelbilder `frames/` + Kontaktbögen `desktop-contact.png`, `m390-contact.png`, `*-wipe-contact.png`, Echtzeit Dev `desktop.webm`, `pixel.webm`, `iphone.webm` mit `seq-*/metrics.json`, **Produktion** `prod/`: `moto-prod.json`, `desktop-prod.json`, `moto-prod.webm`, `moto-video-fine.png`, `iphone-first-view.png`; e2e-Logs `e2e.log` (Dev) und `e2e-prod.log`). Skripte: `push-r3-prod.mjs` (Build in `../ph-prod-wow-r3`, Junction, Sofaplaner-Labs nur in der Kopie entfernt, `NEXT_PUBLIC_WOW_HERO=1`), `push-r3-prodmeasure.mjs`, `push-r3-video.mjs`, `push-r3-frames.mjs` (`PEN=wipe`), `push-r3-contact.mjs`, `push-r3/dehook.mjs`, `push-r3/ridge-per-path.mjs`.

### Messwerte Produktion (Build außerhalb des Repos, `next start` :3170, Moto G4 · 4× CPU · 150 ms RTT · 1,6 Mbit/s, kalter Kontext, Cookie-Banner offen)

| Posten | Grenze | gemessen (7 Läufe) |
|---|---|---|
| LCP p75 | ≤ 2,0 s | **1,83 s** (1,63–1,84 s); Element immer das Hero-`<img>` (`moto-prod.json`). Ein früherer Satz unter fremder Maschinenlast: 2,23 s (`moto-prod-lauf2.json`), der Satz davor 1,74 s |
| CLS | < 0,05 | max. **0,0005** |
| Sequenz gespielt | – | 7/7, Stift „wipe“ (Hydration erst bei 3,4–3,7 s) |
| „Raum sichtbar“ nach FCP | ≤ 2,4 s | p75 **2,13 s** (1,95–2,15 s) |
| Long Tasks Stiftstart → Raum | – | 2–6 je Lauf, größte 268–441 ms (Hydration). Sie fallen in die Sequenz, treffen aber nur Compositor-Animationen (Transform/Opacity); Video `moto-video-fine.png`: Maske und Freigabe laufen ohne Stillstand |
| Desktop 1440 (10 Mbit/s) | – | LCP p75 0,69 s, CLS ≤ 0,002, Stift „ink“ (Hydration 0,5–0,9 s), Raum 1,73 s nach FCP, **0 Long Tasks** in der Sequenz |
| iPhone 393 × 659 (WebKit), Banner offen | „Termin wählen“ ≤ 500 px | Unterkante **495 px**, Banner ab 514 px |

### Umgesetzt

| Forderung | Umsetzung |
|---|---|
| **Wächter #1 Produktion messen (Freigabebedingung)** | Siehe Tabelle. Build in `../ph-prod-wow-r3` (robocopy, Junction, `turbopack.root` nur in der Kopie, Labs/Sofaplaner nur dort gelöscht). Die Messung deckte auf: Mit „Stift erst nach Hydration“ allein spielte die Sequenz auf dem Moto G **nie** (Hydration 3,5 s → Rückfall). Daher zwei Stifte (nächste Zeile) |
| **Wächter #2 Stift bei freiem Hauptthread** | Startskript hält das Papier (`data-wow-wait`, `data-wow-state="line"`). **„ink“**: hydriert + `requestIdleCallback` (≤ 600 ms) innerhalb 850 ms → Striche per `stroke-dashoffset` (Desktop: 0 Long Tasks). **„wipe“**: sonst startet das Startskript selbst; die fertige Zeichnung wird durch eine weiche Tuschemaske von der Fensterseite freigelegt (zwei gegenläufige Transforms, nur Compositor), ebenso Licht und Freigabe. Ist das Foto dann nicht dekodiert: Überblendung zum Raum |
| **Wächter #6 ≤ 2,4 s, Eingabe springt** | Eine Zeitleiste für alle Breiten, Raum 1540 ms nach Stiftstart; schlechtester Fall 850 + 1540 = 2390 ms nach dem Startskript. Jede Eingabe (Zeiger, Taste, Rad, Touch) springt sofort zum Raum, auch vor der Hydration, mit 300-ms-Überblendung |
| **Wächter #3 iPhone 659** | Bühne am Handy 2:1 (Foto unten bündig: `object-position` 50 % 100 % = `xMidYMax slice`; beschnitten wird die Decke, nicht die Sesselfüße), eine 44-px-Leiste mit Schaltern links und Bildzeile rechts, Overline am Handy aus (die H1 sagt „am Bodensee“), SEO-Zeile in `text-small`. „Termin wählen“ endet bei 495 px. e2e-Test mit offenem Banner |
| **Wächter #4 „Zur Planung“ am Handy** | `WowCoda` direkt unter „Termin wählen“: „Erst die Linie. Dann Ihr Raum.“ (Serif) + „Zur Planung“, 44 px. Ab 640 px dieselbe Zeile in der Bildzeile der Bühne (je Breite ist nur eine sichtbar) |
| **Wächter #5, awwwards #4, luxus-cd #5 Horizont** | WowControls misst die Zeilen der H1 (Textknoten, nicht Blockboxen): Liegt eine Zeile näher als 12 px am Horizont, endet die Linie 16 px nach deren letztem Glyph („Satzkante“). Ohne JS keine Linie. e2e bei 1280/1440/1920 |
| **awwwards #1 Ruhezustand als Werkzeug** | Vergleichsregler: Die Zeichnung wartet nach der Sequenz als Streifen (7 %) an der Fensterseite, mit 1-px-Kante und Griff. Ziehen (Zeiger/Finger, `touch-action: pan-y`, kein Scroll-Hijacking), Tippen ins Foto setzt die Kante (WCAG 2.5.7), Tastatur `role="slider"` (Pfeile 5 %, Bild 25 %, Pos1/Ende). Ersetzt die Lupe |
| **awwwards #2 drei Akte** | Linie → Licht → Raum. Das Kartonmodell ist gestrichen, bis Phase B ein Foto des echten Modells liefert |
| **awwwards #3, luxus-cd #4 Freigabe aus dem Licht** | Kein Schleier mehr: ein warmer Lichtkeil (≤ 15 %) kommt auf der Fensterseite ins Papier und wandert mit der weichen Tuschekante, die das Foto freilegt; das Foto selbst wird nie getönt |
| **awwwards #5 robuster Ablauf** | Rückfall und Eingabe blenden über (300 ms). `data-wow-state` folgt dem Sichtbaren (`line` beim Warten, `room` nach Sprung); e2e |
| **awwwards #2, Wächter #7, luxus-cd #3 Linie als Hand** | Sofa, Marmortisch, Beistelltisch gestrichen (Kamm-Anteil nur 67–86 %, das Sofa schwebte). 21 → 15 Pfade. Jeder Pfad ist ein durchgehender Strich (keine Lineal-Teilung, keine „Klammern“). Sessel-Konturen ohne Haken und Rückläufer (neu gesetzt, Deckung 97–100 %). Druck sichtbarer: Kern 0,7 → Schwellung 1,5 → Bauch 2,6 px |
| **luxus-cd #1 Sessel-Icon** | gestrichen (der Regler ist der Nachhall) |
| **luxus-cd #2 Endbild sauber** | Sessel-Kontur nie mehr in Ruhe, nur bei Hover/Fokus auf „Termin wählen“ (Overlay-Schalter). Grauer 70-%-Strich: Ursache war die Oberkante zweier Zellen bei verborgenem „Noch einmal“ → eine durchgehende Linie. Pixeltest: rechts vom Streifen ist der Rahmen pixelgleich zum Foto |
| **luxus-cd #5 Peak-End** | „Erst die Linie. Dann Ihr Raum.“ erscheint, wenn die Bühne zur Ruhe kommt (Opacity, Platz reserviert, CLS 0) |
| **awwwards #6 Cookie-Banner** | gehört dem Teamleiter. Die Bühne sendet das `window`-Ereignis `ph:wow-done` und setzt `data-wow="done"`. Vorschlag: Banner erst danach oder nach 4 s (es setzt vorher keine Cookies). Auf Desktop 1440 × 900 verdeckt es sonst die Schlusszeile |

### Entscheidungen bei Widersprüchen

1. **„Stift erst nach Hydration“ (Wächter #2) gegen „≤ 2,4 s“ (Wächter #6):** Gemessen schließen sie sich auf dem Moto G aus. Lösung ist die vom Wächter selbst genannte Alternative (Compositor) als zweiter Stift. Der echte Federstrich bleibt, wo der Hauptthread frei ist (Desktop, schnelle Handys).
2. **Modellphase (luxus-cd lobte sie, awwwards will sie streichen):** gestrichen, weil sie 600 ms kostet (Wächter #6) und als Keilblock nicht glaubwürdig war. Rückkehr nur als Foto des echten Kartonmodells (Phase B).
3. **Schlusszeile mit „Termin wählen“ (luxus-cd) oder „Zur Planung“ (Wächter):** „Zur Planung“. „Termin wählen“ steht als Hauptaktion direkt darüber; zwei gleiche Aktionen nebeneinander verwässern.
4. **Am Handy kein „Noch einmal“:** Die 44-px-Leiste trägt Schalter und Bildzeile; „Linie“ zeigt die Zeichnung erneut. Sonst läge „Termin wählen“ unter dem Banner.
5. **Startskript 600 → 900 B Budget (gemessen siehe Unit-Test):** Eingabe-Sprung, Rückfall mit Stiftwahl, „Ruhige Ansicht“ vor dem ersten Bild. CSS-Budget 3,5 → 4,5 KB gzip (≈ 3,2 KB). CSP-Hash ändert sich.
6. **Dev-Server:** hydriert in 3–7 s, dort läuft praktisch immer der „wipe“-Stift. Long Tasks im Dev sagen nichts; maßgeblich ist die Tabelle oben.

### Offen

- **Inhaber:** H1-A/B („Erst die Linie. Dann Ihr Raum.“, `wow-messages-vorschlag.json`; bei B entfällt die Schlusszeile), Bildregister für die Sessel-Kontur, `NEXT_PUBLIC_WOW_HERO=1`. Die Wächter-Bedingung „Produktion messen“ ist erfüllt.
- **Phase B** (größter Hebel beim Kriterium Inhalt): ein Sessel von Haralds Hand und ein Foto des echten Kartonmodells; danach die Bildzeile „Linie: Harald Menghin“. Termin mit Harald festmachen, Einwilligung vorher.
- **Teamleiter:** Cookie-Banner nach `ph:wow-done`; der Sofaplaner-Build-Fehler (`PlanSvg.js`) blockiert weiter einen Build des ganzen Repos.

### Nachträge für die Design-Bibel (Vorschlag, auch in `wow-spezifikation.md` §11)

| # | Stelle | Vorschlag | Begründung |
|---|---|---|---|
| W34 (neu) | §8.2 Motion | Läuft eine Signature-Animation, während Hydrations-Tasks laufen können, dann nur auf dem Compositor (Transform/Opacity/Maske). `stroke-dashoffset` erst nach Hydration und Idle | Messung Moto G: Hydration 3,5 s, Tasks bis 441 ms |
| W35 (neu) | §8.2 | Jede Eingabe beendet eine Einstiegssequenz sofort (300 ms Überblendung) | Wächter #6 |
| W36 (ersetzt W30) | §4 Farbe / §5 | Wow in drei Akten Linie → Licht → Raum; Licht als warmer Keil ≤ 15 % nur auf dem Papier, nie auf dem Foto | awwwards #2/#3, luxus-cd #4 |
| W37 (neu) | §12 Signature | Der Ruhezustand des Wow ist ein Werkzeug (Vergleichsregler Zeichnung/Foto), bedienbar mit Zeiger, Tippen und Tastatur | awwwards #1 |
| W38 (neu) | §6 Hero | Eine Linie aus dem Bild darf über das Seitenpapier laufen, hält aber 12 px Abstand zu jeder Zeile der H1 oder endet an der Satzkante | awwwards #4, Wächter #5 |
| W39 (ändert W26) | §6 Formate | Hero-Bühne am Handy 2:1, unten bündig, solange „Termin wählen“ sonst unter das Cookie-Banner fiele | Wächter #3 |

---

*Ab hier der Stand nach Push-Runde 2 (Geschichte). Wo Runde 3 abweicht, gilt §0 oben.*

## 0b. Push-Runde 2 (Antreiber Runde 2: awwwards 6,5 · luxus-cd 6 · Wächter 6, kein Veto)

Reihenfolge: zuerst die Freigabe-Blocker des Wächters, dann was den Score am stärksten hebt. Belege: `qa-screenshots/wow/push-r2/` (Screenshots `de--*.png`, angehaltene Bilder `frames/` + Kontaktbögen `desktop-contact.png` und `iphone-contact.png`, Echtzeit `pixel.webm`, `iphone.webm`, `desktop.webm` mit `seq-*/metrics.json`, Deckungsbild `deckung.png`, e2e-Log `e2e.log`). Skripte: `qa-screenshots/wow/push-r2-frames.mjs`, `push-r2-video.mjs`.

### Umgesetzt

| Forderung | Umsetzung |
|---|---|
| **Wächter #1 Fokusreihenfolge (Blocker)** | DOM-Reihenfolge jetzt H1 → „Termin wählen“ → Lead → Infozeile → Bühne. Am Handy steht die Bühne nur optisch oben (`order-first`), ab lg setzt das Grid sie rechts. Neuer e2e-Test „Fokusreihenfolge“ (1440 und 390): Tab erreicht „Termin wählen“, bevor ein Bühnen-Schalter Fokus bekommt; Bühne am Handy weiter über der H1 |
| **Wächter #2, awwwards #6, luxus-cd #4 Schalter vor der Hydration (Blocker)** | Die vier Beschriftungen stehen im Server-HTML sichtbar als ruhige Textzeile (`aria-disabled="true"`, Unterstrich läuft per CSS mit), kein Leerstreifen mehr, auch ohne JS. Nach der Hydration reagieren sie. „Noch einmal“ bleibt bis zur Ruhe verborgen. e2e „Ohne JavaScript“ prüft das |
| awwwards #1 Einstieg mit einer Geste | Erstes Bild: Papier, Raster und die Konstruktionslinien (Horizont, Fluchtpunkt, zwei Strahlen) stehen statisch im Server-HTML. Dann zieht **ein** durchgehender Strich den Raum (Vorhangkante → Rückwand → Wandkante → Bodenkante, 560 ms, Handy 420 ms, Rhythmus schnell–langsam–schnell). Erst danach folgen die Möbel nacheinander. Unit-Test: kein anderer Strich startet vor 85 % der Geste |
| luxus-cd #4 Start absichern | Das Startskript hält die Sequenz an (`data-wow-wait`, alle Animationen pausiert), bis das Foto dekodiert ist; dauert das länger als 2,5 s, kommt sofort der Endzustand. Unter 50 % Sichtbarkeit wie bisher Endzustand. `data-wow-state` steht während der Sequenz auf `line` (awwwards-Nebenbefund) |
| awwwards #2, luxus-cd #3 Deckung auf 2 px | Alle Pfade neu: Handskizze als Grobform, dann auf die echten Kanten des Fotos gezogen (Geraden: Ausgleichsgerade durch die Sobel-Kanten, Ecken als Schnittpunkte; Sessel: Rand der Bouclé-Textur, geglättet). Sessel jetzt mit runder Rückenschale, Sitzlinie und Drehfuß (zwei Beine). Couchtische: Marmortisch korrigiert, Holz-Sechseck und Stange gestrichen; Sofa-Unterlinie endet vor der Pflanze. Neuer Test `tests/unit/wow-registration.test.mjs`: (a) jeder Federstrich ≥ 90 % innerhalb 4 Einheiten (≈ 2,1 px bei 1440) an einer Kante, (b) Kamm-Test: bei 69 % der Proben liegt die stärkste Kante quer zum Strich ≤ 4 Einheiten neben der Linie, um 5 Einheiten verschoben nur noch 29 % (der Test erkennt also eine Verschiebung). Differenzbild `push-r2/deckung.png` |
| luxus-cd #2 Endpunkte weg, −40 % Pfade | Ursache der „Illustrator-Griffe“ gefunden: Die Schwellung begann mit einem Strich der Länge 0, und mit runden Enden malt der einen Punkt, an jedem Segmentanfang. Jetzt ein Strich `b, 1 − b` mit Versatz `−a` (Unit-Test: kein Strich der Länge 0). Überstand 16 → 12 Einheiten. 36 → 21 Pfade (−42 %), Handy 15 |
| awwwards #3, luxus-cd #1, Wächter #5 Material | Modell: zwei große Bögen Karton in warmem Greige (Boden, Wände), nur fünf Möbelteile aus derselben Kontur wie ihre Linie, heller 1-px-Schnittrand, warmer Schatten als Materialstärke. Keine graue Deckenfläche, keine weißen Lichtbänder mehr. Modellphase 600 ms (Handy 450 ms). Licht: ein warmer Verlauf von der Seeseite (hell, warm) zur Kaminwand (warmer Schatten) statt grauer Abdunklung; Schatten in Walnuss statt Ink. Papierkorn als CSS-Verlauf mit `multiply` |
| Wächter #4 Höhepunkt | Kern warm (`#fff0d8`) und 1,75 px (Handy 1,5 px), Halten 1000 ms (Handy 900 ms). Konstruktionslinien sind vor dem Höhepunkt weg (awwwards #2) |
| awwwards #4 Wort und Bild | Ab lg läuft der Horizont des Fotos als Haarlinie über das Papier der Seite nach links, unter der H1 durch (Höhe per Container-Einheiten exakt auf dem Foto-Horizont). Text liegt darüber (`relative z-1`). Die H1 „Erst die Linie. Dann Ihr Raum.“ liegt als A/B-Vorschlag in `wow-messages-vorschlag.json` |
| awwwards #5 Nachhall | Der linke Sessel (Schale, Sitzlinie, Fuß) bleibt als kleine Zeichnung **neben** dem Foto in der Bildzeile stehen und wird am Ende der Sequenz gezogen; eine eigene Ebene, nichts liegt auf dem Bild, daher auch in der Produktion zulässig. Der Horizont unter der H1 bleibt ebenfalls stehen |
| luxus-cd #5 Prozess benennen | „So arbeiten wir: …“ ab lg in der Display-Serif, 19 px, direkt unter der Bildleiste |

### Entscheidungen bei Widersprüchen

1. **Kein `feTurbulence`/`feDisplacementMap` auf dem Strich (awwwards #3).** Ein Filter auf einem Pfad, dessen `stroke-dashoffset` animiert wird, wird in jedem Frame neu gerechnet, genau das, was der Wächter (#3) als Ruckelrisiko benennt. Das „Material“ kommt aus Papierkorn, Karton und warmem Licht; den echten Ausfrans liefert Phase B.
2. **Papierkorn als CSS-Verlauf, nicht als Bild.** Eine 12-KB-Textur (`<image>` im SVG) wurde auf dem Pixel 7 zum **LCP-Element** (gemessen, `papier.webp`). Das verletzt die harte Grenze „LCP = Server-Text oder vorgeladenes Bild“. Die Datei ist wieder entfernt, ein Unit-Test verbietet Bilder in der Bühne.
3. **Desktop bleibt zweispaltig (awwwards #4 teilweise).** Eine H1 auf dem Foto widerspricht der Bibel (Kontrast, „Foto nie getönt“). Die Einheit entsteht über die durchlaufende Horizontlinie und das gemeinsame Papier.
4. **Fortlauf der Linie in die folgenden Abschnitte (awwwards #5, zweiter Teil) nicht gebaut:** Diese Abschnitte gehören anderen Teams. Vorschlag an den Teamleiter: eine 1-px-Trennlinie, die per IntersectionObserver ihren `transform: scaleX` zieht (Compositor, kein Scroll-Hijacking).
5. **Inline-Skript 400 → 600 B (599 B).** Nötig für den Dekodier-Start (luxus-cd #4). CSS-Budget 3 → 3,5 KB gzip.

### Offen

- **Messung im Produktions-Build** außerhalb des Repos (Moto G, 4× CPU, langsames 4G): LCP, Long Tasks in der Linienphase (Wächter #3). Im Dev gemessen siehe Tabelle unten. Ein Produktions-Build scheitert derzeit vermutlich am Build-Fehler eines anderen Teams (`src/components/Labs/Sofaplaner/PlanSvg.js:250`, `fill` doppelt), Teamleiter informieren.
- **Phase B** (größter Hebel laut allen drei Antreibern): 30 Minuten Harald am Tablet, ein Sessel reicht; dazu ein Foto eines echten Kartonmodells. Einwilligung und Titel vorher.
- **Inhaber:** H1 A/B, Bildregister für die Signatur auf dem Foto, `NEXT_PUBLIC_WOW_HERO=1`.

### Messwerte Runde 2 (Dev-Server, belastet; nur untereinander vergleichbar)

| Posten | Grenze | gemessen |
|---|---|---|
| LCP-Element | Server-Text oder vorgeladenes Bild | Hero-`<img>` auf Pixel 7 (4× CPU), iPhone (WebKit) und Desktop. Zwischenstand mit Papier-Textur: `image` (`papier.webp`) auf Pixel → entfernt |
| LCP − FCP | – | Pixel 0 ms, Desktop 0 ms, iPhone 206 ms (`push-r2/seq-*/metrics.json`) |
| LCP absolut im Produktions-Maßstab | ≤ 2,0 s mobil | **nicht gemessen** (kein Build außerhalb des Repos in dieser Runde) |
| „Raum sichtbar“ nach FCP (Wächter #6) | ehrlich angeben | Pixel 7 4× CPU **2,54 s**, iPhone **1,90 s**, Desktop **3,51 s** (Strichstart + letzter Freigabe-Streifen) |
| Long Tasks in der Linienphase | keine > 50 ms | Pixel 4× CPU: keine zwischen Strichstart und Ende der Linie (5417–6517 ms); 127 ms vor dem Start (5393 ms), 97 ms im Halten (8008 ms). Hydrations-Tasks im Dev erst ab 12 s |
| CLS | < 0,05 | e2e 390/768/1440: bestanden; Quellen-Messung (`push-r2-cls.mjs`) Pixel und Desktop je 2 Läufe: 0 aus dem Hero (einmal 0,0036 vom Launcher-Knopf eines anderen Teams). Zwei Ursachen behoben: Bildzeilen-Zeile reserviert (halb gestreamte Figur), Bühne im DOM nach Lead und Infozeile |
| Beschriftungen vor der Hydration | sichtbar | alle drei Echtzeit-Läufe `labelsVisibleBeforeHydration: true`; ohne JS: e2e |
| Deckung | ≤ 2 px | Kanten-Test 90–100 % je Pfad; Kamm-Test 69,1 % (verschoben 28,6 %) |
| `<figure>` im HTML | ≤ 14 KB gzip | **9,5 KB** gzip (66,6 KB roh) |
| Inline-Skript | ≤ 600 B (neu) | **578 B**. CSP-Hash ändert sich, bei strenger Richtlinie neu berechnen |
| Tests | – | Unit 13/13 (`wow-paths`, `wow-registration`), e2e 14/14 im Desktop-Projekt (`PW_WORKERS=1`, ohne Wiederholung), ESLint sauber |

Echtzeit angesehen: `push-r2/pixel-video-all.png`, `iphone-video.png`, `desktop-video.png` (Bilder aus den Videos, Skript `push-r2-vidframes.mjs`). WebKit zeigt jetzt die ganze Sequenz in Echtzeit (Runde 2: dort war sie vor dem ersten Bild schon vorbei).

### Nachträge für die Design-Bibel (Vorschlag)

| # | Stelle | Vorschlag | Begründung |
|---|---|---|---|
| W22 (geändert) | W12, §8.2 | Die Linie liegt 1000 ms (Handy 900 ms) auf dem vollen Foto, warmer Kern 1,5–2 px | Wächter #4 |
| W29 (geändert) | §5 Linie | Konstruktionslinien stehen ab dem ersten Bild im Server-HTML; der Raum kommt in einem Strich, danach die Teile der Reihe nach | awwwards #1, luxus-cd #4 |
| W30 (ersetzt) | §4 Farbe | Wow-Modell in warmem Greige (Karton) mit hellem Schnittrand und Walnuss-Schatten, Licht als warmer Verlauf; keine Ink-Grauflächen | awwwards #3, luxus-cd #1 |
| W31 (neu) | §6 Hero | DOM-Reihenfolge H1 → Hauptaktion → Bühne; die Bühne steht am Handy nur optisch zuerst | Wächter #1, WCAG 2.4.3 |
| W32 (neu) | §8.2 | In der Wow-Bühne kein zweites Bild (auch keine Textur): es kann das LCP-Element werden | Messung Runde 2 |
| W33 (neu) | §6 Hero | Ab lg darf eine Linie aus dem Bild über das Seitenpapier hinter die H1 laufen (1 px, ≤ 40 % Ink) | awwwards #4 |


---

*Ab hier der Stand nach Push-Runde 1 (Geschichte). Wo Runde 2 abweicht, gilt §0: Zeiten, Pfadzahl, Modell, Licht, Schalter vor der Hydration, DOM-Reihenfolge, Budgets.*

## 1. Was der Besucher sieht

**Die Bühne kommt zuerst.** Am Handy steht sie direkt unter dem Header in voller Breite (16:10). Bei 390 × 844 liegt sie ganz im ersten Bild (y 57–301), das Cookie-Banner unten deckt sie nicht ab, „Termin wählen“ bleibt sichtbar (Unterkante 616 px). Ab 1280 px nimmt die Bühne die Spalten 6–12 bis zum rechten Bildschirmrand ein: 813 von 1440 px (56 %), bei 1920 px 1053 px. Zwischen 1024 und 1279 px bleibt es bei 6 + 6 Spalten, sonst brechen die Knöpfe um. Text und Knöpfe stehen ab dem ersten Bild still.

| Desktop/Tablet | Handy | Bühne |
|---|---|---|
| 0–0,15 s | 0–0,15 s | Papier mit feinem Raster. Das Foto ist darunter schon gemalt |
| 0,15–0,6 s | 0,15–0,4 s | **Konstruktion:** Horizont, Fluchtpunkt-Kreuz und Strahlen aus dem Fluchtpunkt (1120/455), dünn und stehend |
| 0,3–1,5 s | 0,26–1,05 s | **Tuschelinie:** Ein dünner Federstrich zieht jeden Pfad, die Tusche „zieht nach“: Schwellung in der Mitte, dünne Enden. Architektur und Tische mit Lineal: jede Kante einzeln mit Überstand an den Ecken. Möbel aus wenigen gespannten Kurven |
| 1,4–2,3 s | 1,0–1,55 s | **Kartonmodell:** Boden und Wände in Stone/Linen, Möbel als weiße Kartonteile mit dunkler Kante (Materialstärke) |
| 2,3–3,1 s | 1,55–2,1 s | **Licht:** Das Papier dunkelt leicht ab, Bänder von Fensterlicht fallen von der Vorhangseite über den Boden und auf die Kaminwand. Schlagschatten der Möbel nach rechts, dunkle Decke, Schattenseiten mit 45 % Ink (≈ 2,6:1). Das Licht ist weg, bevor das Foto erscheint |
| 3,1–4,0 s | 2,1–2,8 s | **Raum:** Das Foto wird in drei Streifen von der Fensterseite her frei (a → b → c, je 400/340 ms, höchstens 2 gleichzeitig). Ein Möbel geht mit dem ersten Streifen, den es berührt. So steht nie eine weiße Fläche auf dem Foto |
| 4,0–4,7 s | 2,8–3,5 s | **Höhepunkt Deckung:** Die Linie liegt 700 ms auf dem vollen Foto, mit hellem Kern, damit sie auf dem dunklen Foto lesbar bleibt |
| 4,7–5,0 s | 3,5–3,8 s | Die Linien gehen. Nur mit Overlay-Freigabe bleibt die Kontur des linken Sessels als Signatur (60 %) |
| ab 5,0 s | ab 3,8 s | Ruhe. Ohne Overlay ist das Foto pixelgleich zum Original |

- **Bildleiste:** „Linie · Modell · Licht · Raum“ bleibt stehen, ab 640 px mit kleinem Piktogramm je Zustand. Hover zeigt den Zustand pixelgenau über dem Foto, Verlassen stellt den gewählten Zustand wieder her. Klick oder Pfeiltasten wählen ihn. Vor der Hydration sind die Schalter unsichtbar, der Platz ist reserviert.
- **Bildzeile:** „Foto: Showroom Lochau · Linie: Studie nach dem Foto“. Ab 640 px zusätzlich „So arbeiten wir: erst von Hand, dann im Modell, dann in Ihrem Raum. → Zur Planung“ (Link auf `/interior-design-vorarlberg`, in EN/FR/IT mit Hinweis „auf Deutsch“).
- **Lupe** (feiner Zeiger) und **Sessel-Signatur** hängen an `WOW_OVERLAY_INTERACTIONS`: im Dev an, in der Produktion aus, bis der Bildregister-Eintrag abgezeichnet ist (Spez. §10 Nr. 1). Hover oder Fokus auf „Termin wählen“ zieht die Kontur auf 100 %.

Belege in `qa-screenshots/wow/push-r1/`:
- `frames/`: angehaltene Einzelbilder bei festen Zeiten (Desktop 1440, 390 × 844, 768, 1024, 1920). Skript: `qa-screenshots/wow/push-r1-frames.mjs`
- `mobile.webm`, `desktop.webm` und `seq-*/`: Echtzeit-Aufnahme ab Navigation, Dateiname mit Zeit seit Navigation und Sequenz-Uhr. Skript: `push-r1-video.mjs`. Ältere Dateien im selben Ordner mit `clock470` stammen aus einem Fehlversuch und können gelöscht werden.
- `de--*.png` und `report.json`: `shoot.mjs`

## 2. Dateien

| Datei | Inhalt |
|---|---|
| `src/components/Home/Hero.js` | Schalter `WOW_HERO` (unverändert). Neu: Layoutklassen `L` je nach Schalter (Bühne zuerst im DOM, H1 mobil `display-m`, ab xl Text 5 und Bühne 7 Spalten). Bei Schalter aus ist jede Klasse die alte, der alte Bildblock steht an seiner Stelle (Unit-Test prüft das). Preload-Logik unverändert |
| `src/components/Wow/WowStage.js` | Server-Komponente: `<figure>` mit `<picture>` (LCP), Papier-/Modell-/Licht-SVG (drei Streifen mit Clip), Linien-SVG (Kern, Schwellung, heller Kern), Lupe, Sessel, Startskript, Leiste, Bildzeile |
| `src/components/Wow/Pause.module.css` | Keyframes, Zustände, Reduced Motion, Layout, Rand-Anschnitt. Umbenannt aus `WowStage.module.css`: Der Dev-Server hielt nach einem CSS-Fehler die alte Modulfassung fest |
| `src/components/Wow/WowControls.js` | Client-Insel: Schalter mit Piktogramm und Hover-Vorschau, `aria-pressed`, Pfeiltasten, „Noch einmal“, Lupe, Sitzungsregel, „Ruhige Ansicht“, `wow_pause`-Ereignis (nur mit Consent) |
| `src/lib/wow/pause-paths.js` | 36 Pfade (19 base): Gruppe 0 = 6 Konstruktionslinien, dann Architektur, Kamin, Sofa, Tische, Sessel. Fluchtpunkt `VANISHING_POINT` |
| `src/lib/wow/ink.js` (neu) | Lineal-Überstand für reine Geradenpfade, Schwellungsbereiche je Pfad (deterministisch aus der ID) |
| `src/lib/wow/regions.js` | Freigabe-Streifen a/b/c, Boden/Wände, Möbelteile mit Streifen-Zuordnung, Kante, Schlagschatten, Schattenseiten, Lichtbänder |
| `src/lib/wow/timeline.js` | alle Zeiten (neu: `hold`, Streifen a/b/c, Handy-Ende 3,8 s) |
| `src/lib/wow/config.js`, `start-script.js` | unverändert |
| `src/lib/wow/messages.js` + `features/wow-messages-vorschlag.json` | Texte; neu `how`, Bildzeile „Studie nach dem Foto“, H1-Vorschlag für den Inhaber unter `_vorschlagInhaber` |
| `tests/unit/wow-paths.test.mjs` | 11 Tests, u. a. Streifen decken das Bild, Möbel gehen mit dem ersten Streifen, Lineal-Überstand, Deckungsphase 600–800 ms, Höhepunkt Handy ≤ 3 s, Hero bei Schalter aus unverändert |
| `tests/e2e/wow-hero.spec.js` | 13 Tests, neu: „Bühne zuerst 390 × 844“, „Desktop randlos, kein horizontales Scrollen“, Choreografie mit Fensterseite zuerst und Deckungsphase, Hover-Vorschau, Schalter ohne JS unsichtbar |

## 3. Messwerte (Dev-Server, stark belastet)

| Posten | Budget | gemessen |
|---|---|---|
| CLS 9 s | < 0,05 | **0,0000** bei 390 × 844 und 1440 × 900, je 2 Läufe (`push-r1-cls.mjs`). Der Sprung aus Runde 1 (Info-Zeile, 0,008) tritt nicht mehr auf |
| Bühne im ersten Bild, 390 × 844 | ≥ 70 % | **100 %** (y 57–301), „Termin wählen“ bis 616 px |
| Bühne Desktop | ≥ 60 % (awwwards) | **56 %** bei 1440, 55 % bei 1920, randlos rechts, `scrollWidth` = Viewport |
| Deckung Linie ↔ Foto | ≤ 2 px | e2e bestanden bei 390, 768 und 1440 |
| Endzustand ohne Signatur | pixelgleich | e2e bestanden |
| `<figure>` im HTML | ≤ 14 KB gzip | **5,9 KB gzip** (35,8 KB roh, vorher 4,3 KB) |
| CSS-Modul | ≤ 3 KB gzip | **2,6 KB** |
| Inline-Skript | ≤ 400 B | 344 B, Hash unverändert `'sha256-BzQWazeCMxYGH8F0CWYwFrbCy5aZZsGm7qcZ76Ou3oc='` |
| `WowControls` Quelle | ≤ 4 KB gzip | 3,1 KB |
| Tests | – | Unit 11/11, lint sauber. e2e 13 Tests im Desktop-Projekt: 11 grün im ersten Lauf, CLS 390 px erst in der Wiederholung (Dev-Last, Nachmessung 0,0), Choreografie nach Fließkomma-Toleranz grün nachgeprüft (zusammen mit den 3 neuen Bühnen- und Tastatur-Tests) |
| Echtzeit | Höhepunkt Handy 2–3 s | Zeitachse 2,8–3,5 s. Im Dev nicht belastbar: erster Paint nach 6–20 s, Hydration blieb aus |

**LCP ist nicht gemessen.** Das geht nur im Produktions-Build außerhalb des Repos (Auflage des Wächters).

## 4. Entscheidungen bei Widersprüchen und Abweichungen

1. **H1 nicht geändert.** Luxus-CD schlägt „Erst die Linie. Dann Ihr Raum.“ vor. Die H1 gehört zum Startseiten-Text (nicht Wow-Datei) und ist eine Inhaber-Entscheidung. Der Vorschlag steht in `wow-messages-vorschlag.json`.
2. **Desktop 56 % statt 60 %.** Mehr Breite hätte die H1 hinter oder über das Foto gelegt. Text auf dem Foto widerspricht der Bibel (Kontrast, „Foto nie getönt“). Randlos rechts und volle Höhe erfüllen das Ziel des Wächters (#5).
3. **Start bei halber Sichtbarkeit (Luxus-CD #3):** Die Bühne liegt jetzt immer oben, das Startskript (Endzustand bei weniger als 50 % Sichtbarkeit) reicht. Ein pausierter Wartezustand hätte JS gebraucht.
4. **Cookie-Banner (Wächter #2):** Die Bühne liegt über dem Banner. Eine Änderung am Banner war nicht nötig, das Shell-Team muss nichts tun.
5. **Signatur nur mit Overlay-Freigabe.** Awwwards wünscht die Sessel-Kontur als bleibende Signatur. Sie liegt über einem Möbel im eigenen Foto (vermutlich Minotti) und braucht deshalb die Freigabe im Bildregister. In der Produktion ist sie aus, das Foto bleibt unverändert.
6. **Licht ohne Bewegung des Fotos:** Das Licht liegt nur auf Papier und Modell und ist vor der Freigabe weg (Regel W12 bleibt).
7. **Phasenlängen:** Handy-Ende 3,8 s statt 4,0 s, damit der Höhepunkt bei 2,8 s liegt.
8. **Abstrakte Grafik bleibt abstrakt.** Die Linie ist eine Studie nach dem Foto (von Hand gesetzte Koordinaten, keine KI, keine Kantenerkennung). Sie wird nicht als Haralds Werk ausgegeben. Phase B ersetzt die Pfade 1:1, sobald seine Aufnahme mit Einwilligung vorliegt.

## 5. Offen

- **Inhaber:** Bildregister `aboutHome.jpg` sowie Lupe und Signatur freigeben, `NEXT_PUBLIC_WOW_HERO=1`, H1-Vorschlag, Phase B (30 Minuten Tablet-Aufnahme mit Harald, laut Luxus-CD der größte einzelne Hebel), Shooting für ein Handy-Foto.
- **Messung im Produktions-Maßstab** (Build außerhalb des Repos, Moto-G-Profil, langsames 4G): LCP mobil ≤ 2,0 s, Speed Index, TBT, TTI, Bundle-Diff. **Neues Risiko:** `stroke-dashoffset` läuft auf dem Hauptthread. Fällt die Linienphase (0,15–1,5 s) in lange Hydrations-Tasks, ruckelt der Strich. Opacity und Transform laufen auf dem Compositor weiter. Liegt der LCP über 2,0 s, gilt `WOW_MOBILE_SEQUENCE = false`.
- **Lineal-Feinschliff:** Die Schwellung entsteht aus drei Strichbreiten (0,8 / 1,6 / 2,4 px). An den Übergängen sieht man kleine Stufen. Phase B (echter Druckverlauf) löst das.
- **WebKit-Hydration** gegen einen ruhigen Server nachprüfen (unter Dev-Last „Timeout was reached“).
- Texte in `src/messages/*.json` übernehmen. EN, FR und IT sind Entwürfe.

## 6. Nachträge für Design-Bibel §16 (Vorschlag, Entscheidung Kreativdirektor bzw. Inhaber)

Die Bibel selbst ist nicht geändert. Übernommen werden sollen W22–W27 (Runde 0, siehe `wow-spezifikation.md` §11 und die Vorfassung dieser Datei), dazu:

| # | Stelle | Vorschlag | Begründung |
|---|---|---|---|
| W22 (geändert) | W12, §8.2 | wie bisher, dazu: Die Linie darf 600–800 ms auf dem vollen Foto liegen, mit hellem Kern. Mit Bildregister-Freigabe darf eine Möbelkontur danach als Signatur bleiben | Deckung als Höhepunkt (awwwards #3, Wächter #4). Ohne Freigabe bleibt das Foto pixelgleich |
| W27 (geändert) | §8.1 Stagger | Freigabe in drei Streifen von der Fensterseite, höchstens 2 gleichzeitig (Desktop 400, Handy 340 ms) | ersetzt Boden/Wände/Möbel: keine weißen Möbelinseln auf dem Foto |
| W28 (neu) | §6 Hero | Mit Wow-Schalter steht die Bildbühne mobil zuerst, unter dem Header (16:10), H1 in `display-m`. Ab 1280 px Text 5 Spalten, Bühne 7 Spalten bis zum Bildrand | Bühne im ersten Viewport, Cookie-Banner deckt sie nicht ab (Wächter #1/#2, awwwards #1) |
| W29 (neu) | §5 Linie | Wow-Linie darf variable Strichstärke haben (Kern 0,8 px, Schwellung bis 2,4 px), dazu dünne stehende Konstruktionslinien (0,6 px, 50 %) | Hand- statt Vektoranmutung (awwwards #2, Luxus-CD #1) |
| W30 (neu) | §4 Farbe | Im Wow-Modell sind Schattenflächen in Ink 45 % und eine Abdunklung des Papiers um 16 % erlaubt, nur bis vor der Freigabe | Modell und Licht als Einzelbild lesbar (Wächter #3, ≥ 2,5:1) |
