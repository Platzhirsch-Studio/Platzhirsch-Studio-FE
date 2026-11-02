# Expertenrat gesamt – Performance-Ingenieur (perf-prod)

**Stand:** 28.10.2026, 01:52–03:30 Uhr · Branch `feature/neuauftritt` (Arbeitskopie inkl. uncommitteter Änderungen der Bauteams, gespiegelt nach `C:/Users/admin.local/Documents/platzhirsch-prodtest`)
**Build:** `SERVER=https://backoffice.platzhirsch.studio npx next build` → Next.js 16.3.8 (Turbopack), Kompilierung 50 s, 7.806 statische Seiten in 6,1 min, Exit 0. Server: `next start -p 3100`, nach den Messungen beendet.
**Messung:** Lighthouse 12.8.2, `--only-categories=performance`, je Route 3 Läufe mobil (Moto-G-Profil, simuliert 4x CPU / Slow 4G) und 3 Läufe desktop (`--preset=desktop`), **Median**. Zusätzlich eine beobachtete Messung (kein Simulieren) mit Playwright-Chromium: 412 px, DPR 1,75, 4x CPU, 1,6 Mbit/s, 150 ms RTT. Immer nur 1 Browser gleichzeitig. Formulare nicht berührt.
**Belege:** `qa-screenshots/expertenrat-gesamt/perf-prod/` (54 Lighthouse-JSON, `lighthouse-median.md`, `build.log`, Messskripte `jsbytes.mjs`, `rsc.mjs`, `lh-sum.mjs`, `lh-img.mjs`, `vitals-probe.mjs`).

> **Wichtiger Messvorbehalt:** Der Rechner war während der Messung stark ausgelastet (3 Workflows mit vielen Agenten, Dev-Server auf :3000). Der Lighthouse-`benchmarkIndex` schwankte zwischen **527 und 1.323** (ein unbelasteter Desktop liegt bei ca. 1.500–2.500). Lighthouse rechnet die gemessenen Main-Thread-Zeiten hoch. Darum sind **TBT und die „Render Delay“-Anteile des mobilen LCP zu pessimistisch**, die Streuung ist groß (z. B. TBT /de: 199 / 519 / 1.809 ms). Netzwerkseitige Aussagen (Bytes, Requests, Prioritäten, Preloads) sind davon nicht betroffen. Vor dem Livegang einmal auf einer ruhigen Maschine oder in CI (LHCI) nachmessen, siehe Maßnahme P1-1.

## Note: **7 / 10**

Desktop ist auf Spitzenniveau (Score 98–99, LCP 0,9–1,1 s, CLS 0). CLS ist auf allen 18 Profilen exakt 0, und das Fundament stimmt: statische Shells, AVIF, sauberes LCP-Preload, kein Drittanbieter-JS vor Consent, three.js und model-viewer liegen nicht im Initial-Bundle. Mobil verfehlt jede gemessene Route das Bibel-Ziel **LCP ≤ 2,0 s** im Lighthouse-Labor (Median 2,5–5,3 s). In der beobachteten Messung erreichen 6 von 9 Routen das Ziel (1,6–1,8 s), die Labs-Planer und Yacht nicht (2,0–2,5 s). Ursachen sind die Grundlast an JS (≈ 195–283 KB gzip je Route, Budget 150–230 KB), 3 statt 2 Webfonts (134 KB statt ≤ 90 KB) und sehr schweres HTML/RSC (bis 929 KB roh auf Yacht).

Zum Vergleich (Lighthouse mobil, Lauf vom 26.10.2026 aus demselben Scratchpad, Startseiten der Wettbewerber): fretz.de Score 37 / LCP 24,2 s, hoettges.at 51 / 15,7 s, reiter.design 45 / 4,7 s (CLS 0,50). **Platzhirsch /de: Score 70 / LCP 4,7 s / CLS 0.** Damit liegt Platzhirsch schon jetzt vor allen drei.

## Messergebnisse

### Lighthouse mobil (Median aus 3 Läufen)

| Route | Score | FCP | **LCP** (Läufe) | TBT* | CLS | SI | Transfer | Req. | LCP-Element |
|---|---|---|---|---|---|---|---|---|---|
| /de | 70 | 1,72 s | **4,68 s** (5,2/4,7/4,4) | 519 ms | 0 | 2,4 s | 628 KB | 41 | Hero-IMG aboutHome (AVIF 1080w q50, 17,7 KB) |
| /de/produkte | 83 | 1,59 s | **2,49 s** (2,5/2,3/4,3) | 316 ms | 0 | 2,8 s | 754 KB | 45 | Lead-Text `<p class="text-lead">` |
| /de/produkte/sofas-couches | 79 | 1,39 s | **4,29 s** (3,1/4,3/5,0) | 277 ms | 0 | 3,2 s | 725 KB | 49 | Kachel-IMG Minotti Twiggy |
| /de/produkte/sofas-couches/sofas-andersen | 80 | 1,70 s | **4,11 s** (4,7/4,1/4,0) | 236 ms | 0 | 1,9 s | 647 KB | 48 | Produkt-IMG Andersen 750w (19,7 KB) |
| /de/kontakt | 84 | 1,52 s | **3,84 s** (2,2/3,8/4,2) | 587 ms | 0 | 1,8 s | 598 KB | 39 | Raumbild room-1600 |
| /de/ueber-uns/marken/minotti | 65 | 1,68 s | **4,29 s** (4,6/4,3/4,0) | 726 ms | 0 | 2,6 s | 665 KB | 46 | Raumansicht outdoor-dark-white-sofas |
| /de/labs/kuechenplaner | 71 | 1,42 s | **4,11 s** (4,4/2,6/4,1) | 1.021 ms | 0 | 4,7 s | 598 KB | 38 | Lead-Text (Render Delay 3,9 s) |
| /de/labs/sofaplaner | 62 | 1,46 s | **3,79 s** (3,8/3,2/4,1) | 1.559 ms | 0 | 2,6 s | 599 KB | 38 | Lead-Text (Render Delay 3,3 s) |
| /de/yacht-interior | 74 | 2,31 s | **5,31 s** (2,6/6,4/5,3) | 766 ms | 0 | 3,1 s | 1.026 KB | 62 | Lead-Text im dunklen Hero |

*TBT dient als INP-Proxy und ist wegen der Rechnerlast überhöht (siehe Vorbehalt).

### Lighthouse desktop (Median aus 3 Läufen)

| Route | Score | FCP | **LCP** | TBT | CLS | Transfer |
|---|---|---|---|---|---|---|
| /de | 99 | 0,41 s | **0,90 s** | 12 ms | 0 | 645 KB |
| /de/produkte | 99 | 0,40 s | **0,94 s** | 14 ms | 0 | 695 KB |
| /de/produkte/sofas-couches | 98 | 0,40 s | **1,11 s** | 18 ms | 0 | 751 KB |
| /de/produkte/sofas-couches/sofas-andersen | 99 | 0,48 s | **0,96 s** | 9 ms | 0 | 684 KB |
| /de/kontakt | 99 | 0,46 s | **0,90 s** | 7 ms | 0 | 595 KB |
| /de/ueber-uns/marken/minotti | 99 | 0,39 s | **0,90 s** | 33 ms | 0 | 865 KB |
| /de/labs/kuechenplaner | 99 | 0,37 s | **1,00 s** | 21 ms | 0 | 619 KB |
| /de/labs/sofaplaner | 99 | 0,40 s | **0,88 s** | 26 ms | 0 | 620 KB |
| /de/yacht-interior | 98 | 0,51 s | **0,90 s** | 17 ms | 0 | **2.209 KB** |

### Beobachtet (Playwright, 4x CPU, 1,6 Mbit/s, ein Lauf, warmer Bild-Cache)

| Route | LCP | CLS | Long Tasks | Σ Blockzeit | DCL | Load | Konsolenfehler |
|---|---|---|---|---|---|---|---|
| /de | 1,84 s | 0 | 8 | 612 ms | 1,28 s | 3,25 s | 0 |
| /de/produkte | 1,64 s | 0 | 4 | 368 ms | 1,16 s | 2,77 s | 0 |
| Kategorie Sofas | 1,67 s | 0 | 5 | 668 ms | 1,24 s | 3,02 s | 0 |
| Produkt Andersen | 1,82 s | 0 | 5 | 741 ms | 1,12 s | 3,09 s | 0 |
| /de/kontakt | 1,70 s | 0 | 5 | 589 ms | 1,16 s | 3,01 s | 0 |
| Marke Minotti | 1,74 s | 0 | 6 | 921 ms | 1,16 s | 2,82 s | 0 |
| Küchenplaner | **2,52 s** | 0 | 8 | **2.294 ms** | 1,09 s | 3,36 s | 0 |
| Sofaplaner | 1,98 s | 0 | 7 | 590 ms | 1,20 s | 2,92 s | 0 |
| Yacht-Interior | **2,14 s** | 0 | 4 | 833 ms | **2,55 s** | 3,92 s | 0 |

Auf Content-Seiten liegt das echte LCP knapp unter 2,0 s, ohne Puffer. Lighthouse simuliert höher, weil alle Bytes vor dem LCP um 1,6 Mbit/s konkurrieren (≈ 450–600 KB: HTML + CSS + JS + 3 Fonts). Die Hebel sind deshalb **Bytes vor dem LCP** und **Main-Thread beim Hydratisieren**.

### JS je Route (Initial-HTML, alle `<script src>`; gzip, ohne `noModule`-Polyfill 39 KB)

Next 16 gibt in der Build-Ausgabe keine First-Load-Größen mehr aus. Gemessen wurde darum am ausgelieferten HTML (`jsbytes.mjs`).

| Route | Scripts | JS gzip | Budget Bibel | Δ | CSS gzip | HTML roh / gzip | davon RSC-Inline |
|---|---|---|---|---|---|---|---|
| /de | 18 | **197 KB** | 150 | **+31 %** | 30 KB | 442 / 72 KB | 256 KB |
| /de/produkte | 17 | 195 KB | 170 | +15 % | 30 KB | 412 / 60 KB | 244 KB |
| Kategorie Sofas | 18 | 203 KB | 170 | +19 % | 30 KB | 414 / 61 KB | 214 KB |
| Produkt Andersen | 18 | 200 KB | 170 | +18 % | 30 KB | 334 / 59 KB | 199 KB |
| /de/kontakt | 19 | 209 KB | 170 | +23 % | 30 KB | 291 / 52 KB | 176 KB |
| Marke Minotti | 17 | 195 KB | 170 | +15 % | 30 KB | 405 / 61 KB | 243 KB |
| Küchenplaner | 21 | **283 KB** | 230 | **+23 %** | 31 KB | 310 / 56 KB | 160 KB |
| Sofaplaner | 21 | 267 KB | 230 | +16 % | 37 KB | 403 / 67 KB | 226 KB |
| Yacht-Interior | 20 | 220 KB | 170 | +29 % | 31 KB | **929 / 138 KB** | **459 KB** |

### Größte Chunks

| Chunk | roh | gzip | Inhalt | wo |
|---|---|---|---|---|
| `365vv5l67micx.js` | 724 KB | – | three.js (WebGLRenderer) | nur nachgeladen (Planer/Yacht-3D) ✓ |
| `0_2gkru1bkmhl.js` | 488 KB | – | `@google/model-viewer` | nur nachgeladen (AR) ✓ |
| `2_-tvnqpgv783.js` | 394 KB | – | Planer-3D-Szene (Box3/Vector3) | nur nachgeladen ✓ |
| `1jtu_0ffs4pz4.js` | 235 KB | **73 KB** | react-dom | jede Seite |
| `1tc6vn12nuh1c.js` | 200 KB | – | @react-three/fiber | nachgeladen ✓ |
| `2yq0-fi25kgm-.js` | 157 KB | **43 KB** | Next-App-Router-Runtime | jede Seite |
| `0cz1d0mv5g_q7.js` | 113 KB | 39 KB | Polyfills, `noModule` (moderne Browser laden ihn nicht) | jede Seite |
| `0_atuu8he7df-.js` | 41 KB | 12 KB | IntlMessageFormat (next-intl Client) | jede Seite |
| `10c4wx6is_yds.js` | 111 KB | **31 KB** | zod (387 Treffer) | Küchen- und Sofaplaner initial |
| `2bysgfqa63w7q.js` | 96 KB | 30 KB | Küchenplaner-UI | Küchenplaner initial |
| `3mpye2pvu65db.js` | 100 KB | 30 KB | Sofaplaner-UI | Sofaplaner initial |
| `1_6pfst6l-71m.css` | 168 KB | ≈ 30 KB | globales CSS (render-blocking) | jede Seite |

Die Grundlast liegt bei ≈ 140 KB gzip (react-dom 73 + Router 43 + Intl 12 + Turbopack-Runtime 4 + 1dt08 9) auf jeder Seite, bevor eigener Code kommt. Das Startseiten-Budget von 150 KB lässt dann nur ≈ 10 KB für App-Code. Heute sind es ≈ 57 KB.

## Top-5-Stärken

1. **CLS = 0,000 auf allen 9 Routen × 2 Profilen × 3 Läufen.** `aspect-ratio`/`fill`, Font-Fallbacks und Slots sitzen sauber. Bibel-Ziel ≤ 0,05 deutlich übertroffen, Wettbewerber reiter.design 0,50.
2. **Desktop Score 98–99, LCP 0,88–1,11 s, TBT ≤ 33 ms.** Das ist Spitzenklasse für einen Katalog mit 7.000 Produktseiten.
3. **Bildpipeline vorbildlich.** AVIF/WebP, `minimumCacheTTL` 30 Tage, Art-Direction-Preload auf der Startseite (`media`-getrennt, `fetchPriority=high`). Hero mobil 9,6 KB (750w) bzw. 17,7 KB (1080w), weit unter dem Budget von 120 KB. `lcp-discovery-insight` = bestanden.
4. **Statische Shells mit ISR** (`x-nextjs-cache: HIT`, `s-maxage=3600, stale-while-revalidate`). TTFB lokal 13–55 ms, kein Backoffice-Call im Request-Pfad. Konsolenfehler 0, kein Drittanbieter-JS vor Consent.
5. **Schwere 3D/AR-Pakete sauber abgetrennt.** three.js (724 KB), model-viewer (488 KB) und R3F (200 KB) liegen nicht im Initial-Bundle. Das Team hat bereits nachweislich auf TBT optimiert (Mega-Menü als HTML-String, `pickClientMessages`, schmaler zod-Zugang, LazyMotion mit async Features).

## Befunde

| Prio | Seite/Datei | Befund | Beleg | Maßnahme | Aufwand | Wirkung |
|---|---|---|---|---|---|---|
| **P1** | alle mobil, v. a. `/de`, Kategorie, Produkt, Marke | **Mobil-LCP über Bibel-Ziel 2,0 s und über der Grenze 2,5 s** (Labor-Median 3,8–4,7 s). Beobachtet 1,64–1,84 s, also ohne jeden Puffer. Ursache: ≈ 450–600 KB konkurrieren vor dem LCP um die Leitung. | `lighthouse-median.md`, LCP-Phasen /de: TTFB 560 · Load Time 4.426 ms für ein 17,7-KB-Bild | Bytes vor dem LCP senken: Fonts (P1-3), JS (P1-2), HTML/RSC (P1-4). Danach auf ruhiger Maschine bzw. in CI mit `@lhci/cli` (3 Läufe, Median) nachmessen. Ziel: Labor-LCP mobil ≤ 2,5 s, beobachtet ≤ 1,5 s | M | **Hoch:** CWV „gut“ ist ein Ranking-Signal (Seitenerfahrung) und senkt die Absprungrate mobil. Mobil ist > 60 % des Traffics |
| **P1** | Layout / alle Routen | **Initial-JS 195–209 KB gzip auf Content-Seiten** (Budget Start 150, Produkt 170). Die CI-Schranke `tools/ci/bundle-budget.mjs --budget-kb=190` ist schon lockerer als die Bibel und wird trotzdem gerissen | `jsbytes.mjs`-Tabelle oben, `.github/workflows/ci.yml:129` | (a) App-Chunks im Layout prüfen: Merkliste, Suche, Cookie-Banner, Ruhe-Ansicht (`2xk1mm`, `15622`, `2x5oj`, `3lbmz`, ≈ 37 KB) per `next/dynamic` bzw. erst bei Interaktion laden. (b) `IntlMessageFormat` (12 KB) nur laden, wo Client-ICU-Plurale wirklich gebraucht werden, sonst Strings auf dem Server vorformatieren. (c) Budget je Routentyp in die CI übernehmen (150/170/230 statt pauschal 190) | M | Mittel–hoch: −30–45 KB → −150–300 ms LCP/TBT mobil |
| **P1** | `src/components/Reusable/fonts.js` | **3 Webfonts statt 2 werden früh geladen: 47 + 31 + 55 KB = 134 KB** (Budget ≤ 2 Dateien, ≤ 90 KB). Bodoni *Italic* (`10a4c8eca0b9ce81…woff2`, 55 KB) hat zwar `preload:false`, wird aber auf jeder Seite mit Priorität **VeryHigh** vor dem LCP geholt, weil oberhalb der Falz kursiv gesetzt wird | LH network-requests /de: Font 3 bei 495 ms, VeryHigh; `@font-face` in `3thsc-m1okvn3.css` | Kursive Bodoni oberhalb der Falz entfernen (Bibel: „Bodoni Kursiv wird nicht vorgeladen“), sonst `font-synthesis` bzw. `font-style: oblique` der Upright-Datei nutzen. Alternativ das Italic-Subset auf die tatsächlich genutzten Glyphen kürzen | S | Mittel: −55 KB vor LCP ≈ −0,3 s Labor-LCP mobil auf allen Seiten |
| **P1** | `/de/yacht-interior` (in Arbeit) | **HTML 929 KB roh / 138 KB gzip, davon 459 KB RSC-Inline**, 100 `<img>`, **11 Bild-Preloads** (Werfthalle-Thumbs 64 px mit `loading="eager"`, Navetta-Karussell `priority={i<2}`, Kacheln). Mobil LCP 5,3 s, DCL beobachtet 2,55 s, Transfer desktop 2,2 MB | `jsbytes.mjs`, `curl … | grep preload`, `src/components/Yacht/Werfthalle.js:124,171`, `NavettaCarousel.js:33` | Nur das Hero-Bild bekommt `preload`. Alle Thumbs/Karussellbilder `loading="lazy"` (in Next 16 erzeugt `eager` ein Preload-Hint). Werfthalle und Konzeptwelten als Client-Insel mit JSON-Fetch erst bei Sichtkontakt statt komplett im RSC. Ziel HTML ≤ 60 KB gzip | M | Mittel: Yacht ist Premium-Lead-Seite (hoher Auftragswert), mobil 5 s LCP kostet Leads |
| **P1** | Küchenplaner, Sofaplaner | **JS 283 / 267 KB gzip** (Budget Konfigurator 230). zod (31 KB gzip) liegt trotz `Labs/zod.js` im Initial-Bundle. Beobachtete Blockzeit Küchenplaner **2,3 s**. Lead-Text als LCP mit Render Delay 3,3–3,9 s (Labor) | Chunk `10c4wx6is_yds.js` (387× „zod“), vitals-probe | Clientseitige Validierung auf `zod/mini` umstellen (≈ 4–6 KB) oder Schemas nur serverseitig in der Route nutzen. Planer-UI (`2bysgfqa`, 30 KB) hinter einen Startbildschirm verlagern, sodass die Initialisierung erst nach `requestIdleCallback` bzw. auf Klick läuft. Long Tasks > 200 ms mit Performance-Profil zerlegen | M | Mittel: Planer sind Lead-Magneten, INP < 200 ms ist dort entscheidend |
| **P2** | Layout (`LoaderWrapper.js`, `clientMessages.js`) | **RSC-Inline-Payload 176–256 KB je Content-Seite.** Allein 37,5 KB `messages` für den Client-Provider, 33 KB Mega-Menü-HTML als String (zusätzlich zum gerenderten HTML, also doppelt), Logo-SVG-Pfad (5 KB) **3–4× pro Seite** im Payload | `rsc.mjs` (Zeilen `13:` 37.513 Zeichen, `1d:T2092`, 3× `T1414,M10.45 0Q13.39…`) | (a) Deny-List in `clientMessages.js` zur Allow-List je Client-Insel umbauen (Navbar, Footer, Cookies, Merkliste), Ziel ≤ 10 KB. (b) Logo als `<use href="#logo">`-Sprite bzw. eine einzige `<svg>`-Definition. (c) Mega-Menü-HTML als statisches Fragment ausliefern statt als Prop-String (sonst doppelt in HTML + Flight) | M | Mittel: −60–90 KB roh/Seite, weniger Parse- und Hydrationszeit (TBT/INP) |
| **P2** | Startseiten-Hero über Prefetch | **Das Startseiten-Hero-Bild (`aboutHome.jpg`, 17,7 KB, Priorität High) wird auf jeder anderen Seite mitgeladen.** Der Link-Prefetch auf `/de` überträgt die Preload-Hints der Startseite | LH network-requests Produkt Andersen (519 ms) und Minotti (1.348 ms), nicht im HTML enthalten | Logo/Home-Links `prefetch={false}` oder den Hero ohne `preload` und nur per `fetchPriority="high"` am `<img>` setzen | S | Klein: −18 KB Konkurrenz pro Seitenaufruf, bei Produktseiten nahe am LCP |
| **P2** | globales CSS `1_6pfst6l-71m.css` | **168 KB roh / ≈ 30 KB gzip render-blocking** plus zweites CSS. Lighthouse schätzt 200–540 ms Ersparnis | `render-blocking-insight` | Tailwind-`@source` auf `src/` begrenzen, Preview-/Labs-/Portal-Styles in Routen-CSS verschieben, Critical CSS ist bei Next nicht nötig | S–M | Klein–mittel: FCP/LCP mobil |
| **P2** | `src/components/Freigaben/data.server.js:44` | **Turbopack-Warnung:** dynamisches `fs.readFileSync(path.join(ROOT, rel))` → die Datei-Verfolgung nimmt **das ganze Projekt** auf. In `preview/freigaben/page.js.nft.json` stehen 2.776 Dateien, darunter **269 Dateien aus `Marktresearch/`** (interne Strategie), `tests/`, `tools/`, `build.log` und `_tmp_try.mjs` | `build.log` Zeile 441 ff., nft-Analyse | Pfad statisch eingrenzen (`path.join(process.cwd(), "src/content", rel)`) oder `/*turbopackIgnore: true*/`. Die Route ist zwar per `FREIGABE_PREVIEW` gesperrt, interne Dokumente gehören trotzdem nicht ins Server-Artefakt | S | Kein Ranking-Effekt. Hygiene, Deploy-Größe, Vertraulichkeit |
| **P2** | Build / ISR | **7.806 Seiten mit `revalidate` 1 h.** Das Backoffice antwortet im Build 412× „slow“ (2,0–2,6 s je Call). Stündliche Revalidierung von ≈ 7.000 Produktseiten erzeugt Dauerlast auf dem produktiven Backoffice | `build.log` (412× `"outcome":"slow"`) | Produktseiten auf 24 h + On-Demand-Revalidate (`/revalidate/produkte` existiert bereits) umstellen. `layout_keywords` und `get_all_kategorien` je Build einmal cachen (`'use cache'`), statt sie pro Seite neu zu holen | S | Mittel: stabile TTFB unter Last, weniger Ausfallrisiko |
| **P2** | `package.json` | `lenis` steht weiter in den Abhängigkeiten (Bibel: „wird entfernt“), Nutzung nur in `Preview/buehne/SmoothScroll.js`. `framer-motion` **und** `motion` sind beide installiert | `package.json:48–51` | `lenis` entfernen, sobald `preview/buehne` ausgemustert ist. Nur ein Motion-Paket behalten | S | Klein (Pflege), kein Bundle-Effekt heute |
| **P3** | `react-dom`-Chunk | Lighthouse meldet „legacy JavaScript“ 13–14 KB im react-dom-Chunk | `legacy-javascript-insight` | `browserslist` auf moderne Ziele setzen (Safari ≥ 16, Chrome ≥ 111) | S | Klein: −14 KB |
| **P3** | Mess-Infrastruktur | `@lhci/cli` und `size-limit` sind nicht installiert (Bibel §13). Die CI misst nur das Gesamt-Bundle. Felddaten laufen über `src/context/WebVitals.js` (nur nach Consent) | `package.json`, `ci.yml` | LHCI mit den 9 Routen dieses Gutachtens als Gate (mobil, 3 Läufe, Median, `assert` LCP ≤ 2,5 s / CLS ≤ 0,05). Nach dem Livegang CrUX und Search-Console-CWV monatlich prüfen | S | Indirekt: verhindert Regressionen |
| **P3** | INP | Ein echter INP-Wert ist im Labor nicht messbar. Das Antippen des Menüs ergab kein Event > 16 ms. Die Blockzeit nach dem Laden (590–920 ms, Küchenplaner 2,3 s beobachtet bei 4x CPU) ist das Risiko für die erste Interaktion | vitals-probe | Nach dem Livegang INP aus `web-vitals` (p75) auswerten. Im Labor die Planer-Interaktionen (Modul ziehen, Material wählen) mit Performance-Panel profilieren | S | – |

Keine echten **P0-Blocker** aus Performance-Sicht: Der Build läuft fehlerfrei, keine Seite bricht, CLS 0, Desktop exzellent. Das mobile LCP-Ziel der Bibel wird aber vor dem Livegang nicht erreicht. Falls die Bibel-Budgets als harte Livegang-Bedingung gelten (E1, „CI bricht ab“), sind P1-1 bis P1-3 dazu zu zählen.

## Quick-Wins (jeweils ≤ ½ Tag)

1. **Bodoni Italic oberhalb der Falz entfernen** oder per `font-synthesis` ersetzen → −55 KB vor dem LCP auf allen Seiten.
2. **Yacht: `loading="eager"` von Werfthalle-Thumbs und Karussell entfernen**, nur Hero mit `preload` → 11 → 1 Bild-Preload.
3. **`prefetch={false}` für Logo/Home-Link** bzw. Hero-`preload` nur auf `/` → kein Startseiten-Bild auf Unterseiten.
4. **`data.server.js` Pfad statisch eingrenzen** → `Marktresearch/` raus aus dem Server-Artefakt.
5. **Produkt-ISR auf 24 h + On-Demand** und Layout-Daten cachen → Backoffice-Last runter.
6. **zod im Browser auf `zod/mini`** → −25 KB auf beiden Planern.
7. **`@lhci/cli` in die CI** mit den 9 Routen dieses Gutachtens als Regressions-Gate.
