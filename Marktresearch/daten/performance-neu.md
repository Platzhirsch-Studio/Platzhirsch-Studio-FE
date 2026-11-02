# Performance-Audit: neue Labs-, Preview-, Geschäftsfeld- und Regionsseiten

**Stand:** 26.10.2026 · **Messumgebung:** Dev-Server `http://localhost:3000` (Next.js 16, Turbopack-Dev, **unminifiziert, mit React-Dev-Build und Next-Devtools**), Playwright-Chromium 1248, Gerät „Pixel 7“. Je Seite 2 Aufrufe (Kaltlauf + Messlauf, gewertet wird der zweite), danach 4.000 px Scrollen und 1,5 s Warten, damit Lazy-Bilder mitgezählt werden.
**Budget-Grundlage:** `Marktresearch/digital/13-performance-a11y-engineering.md`, Abschnitt Performance-Budget: JS initial je Route ≤ 170 KB gzip (Fehler > 190 KB), HTML inkl. RSC ≤ 50 KB gzip (Warnung > 60 KB), ein Feature zusätzlich im Initial-Bundle ≤ 10 KB gzip, 3D/Konfigurator **nie im Initial-Bundle, erst nach Klick auf eine Fassade**, zod **nur Server, 0 KB Client**, LCP ≤ 2,5 s (Labor).
**Messskript:** `Marktresearch/daten/performance-neu-messskript.mjs` (Aufruf: `node performance-neu-messskript.mjs out.json de/labs/stilfinder …`, nutzt Playwright aus `node_modules` des Projekts).

## Wie die Zahlen zu lesen sind

- **Absolute JS-Werte sind im Dev-Modus rund 6× zu hoch** (Startseite `/de`: 1.494 KB gzip im Dev gegen ca. 238 KB gzip live laut digital/13). Der Dev-Sockel (React-Dev-Build, Next-Devtools 250 KB gz, `react-icons/fa` komplett 451 KB gz, weil Dev nicht tree-shaked) ist auf allen Seiten gleich. Aussagekräftig ist deshalb das **Delta gegenüber dem Sockel** (Regionsseiten: 1.482 KB gz in 25 JS-Dateien). Ein Delta > 0 heißt: dieser Code kommt auch im Live-Build zusätzlich ins Initial-Bundle der Route (dort kleiner, weil minifiziert).
- **Ladezeiten sind nur grob**: Der Dev-Server wurde parallel von vielen Agenten genutzt und kompiliert bei Bedarf. TTFB schwankte bei gleichem Code zwischen 0,5 s und 19 s (Startseite: 1,6 s im ersten, 3,4 s im zweiten Durchgang). Unterschiede unter Faktor 3 sind Rauschen. LCP/TTFB-Budgets lassen sich erst mit Produktions-Build (Lighthouse) prüfen.
- „Übertragen“ = tatsächlich übertragene Bytes (Dev liefert gzip). „JS gz“ = jede JS-Antwort nachträglich mit gzip-6 gepackt (vergleichbar mit der Budget-Spalte „gzip“).

## Status der Seiten

| Seite | HTTP | Status |
|---|---|---|
| `/de/preview/galerie`, `/buehne`, `/dreilaendereck` | 200 | gemessen |
| `/de/labs/kuechenplaner`, `ar-viewer`, `sofaplaner`, `stilfinder`, `dreilaender`, `concierge` | 200 | gemessen (im ersten Rundgang noch 404, im zweiten Rundgang fertig) |
| `/de/portal` | 307 → `/de/portal/login?next=%2Fde%2Fportal` | Login-Seite gemessen |
| `/de/yacht-interior`, `/de/outdoor-gartenplanung` | 200 | gemessen (im ersten Rundgang noch 404) |
| `designermoebel-appenzell`, `-arlberg`, `-feldkirch`, `-kempten`, `-konstanz`, `-liechtenstein`, `-ravensburg`, `-rheintal` (neu) | 200 | gemessen |
| `designermoebel-bregenz`, `-lindau`, `-st-gallen` (bestehend) | 200 | Vergleichswerte |
| `/de/labs/upload-demo` | – | existiert im Code, nicht beauftragt, nicht gemessen |
| **noch nicht gebaut** | – | keine: alle beauftragten Routen lieferten im zweiten Rundgang 200 bzw. 307 |

## Messwerte

KB = KiB. „JS-Delta“ = JS gz minus Sockel der Regionsseiten (1.482 KB).

| Seite | Requests | Übertragen | JS gz | **JS-Delta** | HTML gz | CSS | Fonts (Dateien) | Bilder (Anz.) | TTFB | LCP | Load | Budget |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `/de` (Referenz) | 62 | 2.219 KB | 1.494 | +12 | **70** | 24 | 199 (5) | 430 (28) | 1,6 s | 2,8 s | 6,6 s | HTML > 60 (bekannt, B5) |
| **Labs** | | | | | | | | | | | | |
| `labs/kuechenplaner` | **66** | **3.674 KB** | **2.410** | **+928** | 35 | 25 | 199 (5) | **1.002 (20)** | 0,9 s | 1,2 s | 4,1 s | **ROT: 3D im Initial-Bundle** |
| `labs/dreilaender` | 44 | 2.164 KB | 1.852 | **+370** | 41 | 26 | 237 (6) | 5 (2) | 0,5 s | 1,3 s | 5,1 s | **ROT: zod + motion** |
| `labs/sofaplaner` | 42 | 1.980 KB | 1.707 | **+225** | 38 | 28 | 199 (5) | 5 (2) | 3,9 s | 8,7 s | 25,6 s | **ROT: zod im Client** |
| `labs/stilfinder` | 40 | 1.966 KB | 1.643 | **+161** | 32 | 25 | 199 (5) | 65 (5) | 2,3 s | 2,6 s | 18,7 s | **ROT: motion/framer-motion** |
| `labs/concierge` | 38 | 1.760 KB | 1.493 | +11 | 33 | 28 | 199 (5) | 5 (2) | 3,0 s | 3,3 s | 8,1 s | grün (Grenzfall 10 KB) |
| `labs/ar-viewer` | 40 | 1.786 KB | 1.493 | +11 | 37 | 25 | 199 (5) | 30 (5) | 2,8 s | 3,6 s | 14,6 s | grün (model-viewer lädt nicht initial) |
| `portal` → Login | 37 | 1.748 KB | 1.483 | +1 | 33 | 25 | 199 (5) | 5 (2) | 4,3 s | 4,7 s | 22,7 s | grün |
| **Previews** | | | | | | | | | | | | |
| `preview/galerie` | 47 | 2.107 KB | 1.483 | +1 | 42 | 30 | **380 (11)** | 169 (6) | 14,4 s* | 18,5 s* | 37,9 s* | **GELB: Schriften zusätzlich** |
| `preview/buehne` | 46 | 2.135 KB | 1.481 | ±0 | 44 | 29 | 211 (6) | 367 (9) | 4,4 s | 6,7 s | 18,6 s | grün |
| `preview/dreilaendereck` | 62 | 2.337 KB | 1.479 | ±0 | **53** | 31 | **460 (9)** | 312 (7) | 19,3 s* | 21,9 s* | 60,3 s* | **GELB: Schriften, HTML > 50** |
| **Neue Geschäftsfelder** | | | | | | | | | | | | |
| `yacht-interior` | 43 | 1.966 KB | 1.482 | ±0 | **51** | 25 | 199 (5) | 205 (4) | 1,7 s | 2,3 s | 9,7 s | GELB: HTML > 50 |
| `outdoor-gartenplanung` | 36 | 1.843 KB | 1.482 | ±0 | **54** | 25 | 199 (5) | 80 (2) | 4,8 s | 6,8 s | 14,0 s | GELB: HTML > 50 |
| **Neue Regionsseiten** | | | | | | | | | | | | |
| `designermoebel-appenzell` | 44 | 2.102 KB | 1.482 | ±0 | 43 | 25 | 199 (5) | 350 (10) | 17,3 s* | 25,9 s* | 37,0 s* | grün |
| `designermoebel-arlberg` | 41 | 1.988 KB | 1.482 | ±0 | 41 | 25 | 199 (5) | 238 (7) | 3,4 s | 5,7 s | 26,8 s | grün |
| `designermoebel-feldkirch` | 40 | 1.890 KB | 1.482 | ±0 | 41 | 25 | 171 (4) | 168 (7) | 3,9 s | 5,1 s | 11,8 s | grün |
| `designermoebel-kempten` | 43 | 2.015 KB | 1.482 | ±0 | 41 | 25 | 199 (5) | 265 (9) | 4,1 s | 6,1 s | 13,4 s | grün |
| `designermoebel-konstanz` | 42 | 2.021 KB | 1.482 | ±0 | 41 | 25 | 199 (5) | 270 (8) | 2,9 s | 10,0 s | 30,7 s | grün |
| `designermoebel-liechtenstein` | 43 | 2.037 KB | 1.482 | ±0 | 42 | 25 | 199 (5) | 286 (9) | 6,1 s | 11,1 s | 30,8 s | grün |
| `designermoebel-ravensburg` | 42 | 1.966 KB | 1.482 | ±0 | 41 | 25 | 199 (5) | 216 (8) | 1,6 s | 1,9 s | 8,1 s | grün |
| `designermoebel-rheintal` | 39 | 1.897 KB | 1.482 | ±0 | 44 | 25 | 171 (4) | 172 (6) | 1,0 s | 1,3 s | 4,3 s | grün |
| `designermoebel-bregenz` (alt) | 38 | 1.885 KB | 1.482 | ±0 | 39 | 25 | 171 (4) | 164 (5) | 4,4 s | 5,0 s | 12,1 s | Referenz |
| `designermoebel-lindau` (alt) | 44 | 2.142 KB | 1.482 | ±0 | 40 | 25 | 199 (5) | 392 (10) | 1,8 s | 2,7 s | 11,5 s | Referenz |
| `designermoebel-st-gallen` (alt) | 44 | 1.939 KB | 1.482 | ±0 | 40 | 25 | 199 (5) | 190 (9) | 3,6 s | 4,6 s | 8,7 s | Referenz |

\* Zeitwerte durch Server-Last verzerrt (siehe oben), nicht als Seitenproblem werten.

## Befunde

### Budget gesprengt (ROT)

1. **Küchenplaner lädt three.js und React Three Fiber sofort.** `src/components/Labs/Kuechenplaner/Viewer.js` lädt `Scene3D` zwar per `next/dynamic({ ssr: false })`, setzt `want3D` aber per `IntersectionObserver` (rootMargin 200 px) automatisch, und die Standardansicht ist `"3d"`. Da der Planer oben auf der Seite steht, lädt das 3D-Paket bei jedem Aufruf: im Dev `three.core` 304 KB gz, `@react-three/fiber` 172 KB gz, `three.module` 131 KB gz, dazu `zod` 113 KB gz. Insgesamt +928 KB gz, 12 JS-Dateien mehr, außerdem 1 MB Bilder (20 Stück). Das verstößt gegen Leitplanke 1 aus digital/13 („nie im Initial-Bundle, erst nach Klick auf eine Fassade“). Wie viel davon im Produktions-Build bleibt, muss `next build` mit Bundle-Analyse zeigen. Allein three.js liegt dort weit über dem Feature-Budget von 10 KB. Gut: `saveData` und fehlendes WebGL werden beachtet, und es gibt eine 2D-Ansicht.
2. **zod im Client-Bundle** von Küchenplaner, Sofaplaner und Dreiländer-Rechner (`Kuechenplaner/planState.js`, `ResultPanel.js`, `Sofaplaner/model.js`, `ResultPanel.js`, `Dreilaender/calc.js`, `pricing.js` importieren `zod`): im Dev `zod/v4/core` 113 KB + Locales 48 KB gz. digital/13 sieht zod ausdrücklich „nur Server, 0 KB Client“ vor.
3. **motion / framer-motion im Initial-Bundle** von Stilfinder (+161 KB gz Dev, ein Chunk aus `motion-dom` und `framer-motion`) und Dreiländer (`motion-dom` 103 KB gz Dev). Für Einblendungen und Zahlen-Animationen reichen CSS-Transitions bzw. ein kleiner `requestAnimationFrame`-Zähler.
4. **Sofaplaner**: +225 KB gz Dev, fast vollständig zod. Die 3D-Vorschau (`Preview3D`) lädt im Messlauf nicht initial, das ist gut.

### Grenzfälle (GELB)

5. **Previews „Galerie“ und „Dreiländereck“ laden eigene Schriften zusätzlich** zu Montserrat/Bodoni aus dem globalen Layout: Galerie 11 Font-Dateien / 380 KB (Cormorant Garamond in 3 Schnitten × 2 Stilen + Instrument Sans, je latin + latin-ext), Dreiländereck 9 Dateien / 460 KB (Fraunces mit SOFT- und opsz-Achse). Basis sind 5 Dateien / 199 KB. „Bühne“ macht es richtig: nur Instrument Sans zusätzlich, Bodoni wird wiederverwendet. Bei Übernahme eines Designs die alten Schriften entfernen statt neue hinzuzufügen, Fraunces-Achsen und Cormorant-Schnitte reduzieren.
6. **Previews und Labs tragen das komplette globale Chrome mit** (Navbar, Footer, `NextIntlClientProvider` mit allen Messages, aus `src/app/[locale]/client-layout.js`). JS-Delta ±0 heißt: Sie bringen keinen eigenen Ballast, sparen aber auch nichts. Die Previews rendern zusätzlich ihre eigene `Shell`, also zwei Navigationsebenen im DOM.
7. **HTML/RSC-Payload über 50 KB gz** bei `outdoor-gartenplanung` (54), `preview/dreilaendereck` (53) und `yacht-interior` (51). Noch unter der Warngrenze von 60, aber nah dran. Die Startseite liegt mit 70 KB schon darüber (bekannt, B5 in digital/13).
8. **Concierge (+11 KB) und AR-Viewer (+11 KB)** liegen auf der 10-KB-Grenze für ein Feature. Der AR-Viewer lädt `@google/model-viewer` erst bei Bedarf, das ist vorbildlich.

### Unkritisch (GRÜN)

- Alle **8 neuen Regionsseiten** liegen genau auf dem Sockel der bestehenden Regionsseiten: gleiches JS, HTML 41–44 KB gz, Bilder 168–350 KB (Appenzell mit 10 Bildern / 350 KB am schwersten, die alte Lindau-Seite hat 392 KB). Aus Performance-Sicht kein Handlungsbedarf.
- **Portal-Login**: +1 KB, schlank.

### Konsolenfehler

| Fehler | Seiten | Einordnung |
|---|---|---|
| „Can't perform a React state update on a component that hasn't mounted yet …“ | `/de`, `preview/galerie`, `preview/dreilaendereck`, `designermoebel-appenzell`, `-arlberg`, `yacht-interior` (sporadisch, teils nur im Kaltlauf) | **global**: tritt auch auf der Startseite auf, kommt also aus dem gemeinsamen Layout (Navbar/LoaderWrapper/Consent), nicht aus den neuen Seiten. Ein `setState` im Render oder vor dem Mount. Im Dev sichtbar, im Prod still, aber ein echter Bug |
| `SyntaxError: Unexpected end of input` | `preview/dreilaendereck` (Messlauf), `designermoebel-appenzell` (Kaltlauf) | vermutlich abgeschnittene Dev-Chunks während paralleler Kompilierung; nicht reproduzierbar, im Prod-Build nachprüfen |
| `net::ERR_ABORTED …?_rsc=…` | `/de`, `preview/dreilaendereck`, `yacht-interior`, `designermoebel-st-gallen` | abgebrochene Link-Prefetches beim Schließen der Seite; harmlos |
| URL-Wechsel nach dem Laden | `labs/kuechenplaner` | schreibt den Planzustand als Base64 in `?k=` (ca. 500 Zeichen) per `replaceState`. Gewollt (Teilen-Link), aber Canonical/noindex beachten |

Labs (`kuechenplaner`, `ar-viewer`, `sofaplaner`, `stilfinder`, `dreilaender`, `concierge`) und Portal-Login: **keine Konsolenfehler** im Messlauf.

## Maßnahmen (priorisiert)

1. **Küchenplaner: echte Fassade statt automatischem Laden.** Standardansicht 2D oder ein Standbild (server-gerendertes `next/image`) mit Knopf „3D ansehen“. `setWant3D(true)` nur im Klick-Handler, optional bei `onPointerEnter`/`onFocus` vorladen. Ziel: JS-Delta der Route ≤ 10 KB gz.
2. **zod aus dem Client entfernen.** Schemas nur in Route-Handlern oder Server-Actions prüfen, im Client einfache Typprüfungen. Betrifft Küchenplaner, Sofaplaner und Dreiländer.
3. **motion durch CSS ersetzen** (Stilfinder, Dreiländer) oder per `LazyMotion` + `m`-Komponenten erst nach Interaktion nachladen.
4. **Bundle-Budget-Tor einführen, bevor Labs live gehen** (digital/13: `size-limit` je Einstiegspunkt): `next build` + Analyse für `/de/labs/*` und `/de/portal`, CI-Fehler bei > 190 KB gz bzw. Feature-Delta > 10 KB. Diese Dev-Messung ersetzt das nicht.
5. **Globalen React-Fehler „state update … hasn't mounted“ beheben** (gemeinsames Layout). Bei Übernahme eines Preview-Designs **Schriften ersetzen statt hinzufügen** (Galerie/Dreiländereck: höchstens 2 Familien, 4–5 Dateien, weniger Achsen/Schnitte). Seiten mit HTML > 50 KB gz (Outdoor, Yacht) beim Umbau auf Server Components mit `setRequestLocale` (B1/B5) mitnehmen.

## Grenzen dieser Messung

- Kein Produktions-Build (Regel: kein Build während paralleler Arbeit). JS- und Ladezeit-Aussagen sind relativ. Produktionswerte müssen per `next build` + Lighthouse nachgemessen werden.
- Gemessen wird nur der erste Aufruf mit Scrollen, ohne Interaktion. Was erst nach Klick lädt (z. B. AR-Modelle, Sofaplaner-3D, Concierge-Antworten, QR-Upload), ist nicht enthalten. Das entspricht dem Budget.
- Portal hinter Login: nur die Login-Seite gemessen, nicht Dashboard oder Renderings.
