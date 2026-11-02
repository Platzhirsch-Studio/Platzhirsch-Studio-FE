# 02 – Animation & Motion: Bauplan „Ruhige Exklusivität“

**Stand:** 26.10.2026 · Rolle: Motion-Designer / Creative Developer
**Geltungsbereich:** www.platzhirsch.studio (Next.js 16.3.4, React 19.2.7, Tailwind 4, next-intl, de/en/fr/it)
**Grundsatz:** Bewegung soll wie ein gutes Möbelstück wirken. Sie ist ruhig, präzise und ohne Effekthascherei. Jede Animation muss eine Aufgabe haben: Sie zeigt Kontinuität, Hierarchie oder Rückmeldung. Animationen, die Ranking (Core Web Vitals), Barrierefreiheit oder Pflegeaufwand kosten, werden nicht gebaut.

> Rahmenbedingungen aus dem Masterkonzept (23) und dem SEO-Schlachtplan (25), die das Motion-Konzept direkt betreffen:
> - **Keine Händler-Behauptungen.** Das gilt auch für Animationen: keine animierten Badges wie „Offizieller Minotti-Partner“. Belegt ist nur ClassiCon.
> - **Bildrechte.** Herstellerbilder und -videos (z. B. Minotti-Kampagnen auf Vimeo) dürfen nicht ohne Freigabe in großem Stil verwendet werden. Video-Hero und Scroll-Storytelling bauen deshalb auf **eigenem** Material aus Showroom, Café und Kundenprojekten auf.
> - **Kleines Team (~5 Personen).** Animationen werden einmal als Code-Bausteine gebaut und laufen dann ohne Pflege. Es gibt keine Timeline-Tools, die jemand bedienen muss, und keine Sonderanimationen pro Seite.
> - **„Nicht jetzt“ laut Masterkonzept 9:** eigener 3D/AR-Konfigurator. Dieser Plan enthält deshalb kein WebGL/Three.js.

---

## 1. Ist-Zustand im Code

### 1.1 Was schon gut ist (beibehalten)

| Baustein | Datei | Bewertung |
|---|---|---|
| Hero ohne Karussell, LCP-Bild mit `priority`, einmalige Eintrittsanimation `.hero-reveal` (700 ms) und `.hero-zoom` (Scale 1.06 → 1, 1600 ms), reine CSS-Animationen | `src/components/Home/Hero.js`, `src/app/globals.css` (Abschnitt „Motion“, ca. Z. 50–126) | **Sehr gut.** Server Component, kein JS. Die Animationen betreffen nur `transform` und `opacity` des Textblocks, das LCP-Bild ist sofort im ersten Paint. |
| `.reveal`: CSS Scroll-Driven Animation (`animation-timeline: view()`, `animation-range: entry 0% entry 40%`), nur `transform`, bewusst ohne `opacity` (Kontrast-Audits) | `src/app/globals.css` | **Richtige Technik.** Läuft ohne JS und außerhalb des Main-Threads. Ohne Browser-Unterstützung wird der Inhalt einfach angezeigt. Bisher nur an ca. 8 Stellen eingesetzt. |
| `.marquee` (Markenband, 48 s, pausiert bei Hover und Fokus) | `src/app/globals.css`, `src/components/Home/BrandWall.js` | Gut. Für WCAG 2.2.2 fehlt ein sichtbarer Pause-Knopf (Hover hilft Touch-Nutzern nicht). Siehe F8. |
| Globale `prefers-reduced-motion`-Regel für alle CSS-Animationen | `src/app/globals.css` | Gut, muss aber auf alle neuen Bausteine ausgeweitet werden. |
| `<noscript>`-Regel, die `[data-fade-in]` sichtbar erzwingt | `src/app/[locale]/layout.js` (ca. Z. 225) | Notlösung für Crawler. Mit F1 überflüssig. |
| `overflow-x-clip` auf `<main>` gegen horizontales Scrollen durch Eintrittsanimationen | `src/app/[locale]/client-layout.js` | Gut, beibehalten. |
| Produktkarte: `group-hover:scale-105` (500 ms), Schatten bei Hover | `src/components/ShopCatalog/shopCatalog.js` (ca. Z. 450–460) | Brauchbar, aber generisch. Hover wirkt nur auf das Bild, eine Fokus-Variante für die Tastatur fehlt. |
| Eigene Lightbox mit `role="dialog"`, `aria-modal`, Escape-Taste und Zoom | `src/components/ShopCatalog/productGallery.js` (431 Zeilen) | Funktional, baut aber auf react-slick auf (3 Slider-Instanzen). Kein Pinch-Zoom und keine Wischgeste zum Schließen. |

### 1.2 Was bremst oder veraltet ist

| Problem | Datei(en) | Auswirkung |
|---|---|---|
| **`FadeInView`**: Client Component mit eigenem `IntersectionObserver` **pro Instanz**, `useState`, Inline-Style `opacity: 0` und `will-change` dauerhaft gesetzt, 1,2-s-Fallback-Timer | `src/components/Reusable/FadeInView.js`; **78 Einsätze in 18 Dateien** (u. a. `AnfrageFormProduct.js` 16×, `jobdetailsclient.js` 10×, `about.js` 7×, `newsitem.js` 7×, `BeratungClient.js` 5×, `kontakt.js` 5×) | (1) Erzwingt `"use client"` in Komponenten, die sonst Server Components sein könnten, und vergrößert so den JS-Bundle. (2) `opacity: 0` vor der Hydration: Inhalte sind bis zum JS-Start unsichtbar. Das kann LCP verschlechtern, wenn ein Banner (`newsItemBanner.js`) LCP-Element ist. (3) Dauerhaftes `will-change` auf ~78 Elementen erzeugt unnötige Compositing-Layer (GPU-Speicher, vor allem auf dem Handy). (4) Formulare (`AnfrageFormProduct`, `kontakt`) blenden Felder ein. Das wirkt verspielt, wo Vertrauen zählt. |
| **react-slick 0.31.0 + slick-carousel 1.8.1** (nur das CSS wird genutzt; das Paket ist ein jQuery-Plugin, aktuell 2.0.0) | `src/components/ShopCatalog/productGallery.js`, `src/components/MarkenItems/markenitems.js`, `src/components/UberUns/austellung.js` | ca. **15,4 kB gzip** JS (bundlephobia) plus Abhängigkeiten (`json2mq`, `enquire.js`, `lodash.debounce`, `resize-observer-polyfill`) plus 2 CSS-Dateien (`slick.css`, `slick-theme.css` inkl. Webfont für die Pfeile). Das Projekt wird kaum noch gepflegt. Bekannte Schwächen: Barrierefreiheit (geklonte Slides im Fokusbaum), React-19-Warnungen, kein natives Scroll-Snap. |
| Keine Seitenübergänge | – | Harte Schnitte zwischen Katalog und Produkt. Genau dort wäre Kontinuität ein Premium-Signal. |
| Kein Video im ganzen Projekt | `public/` enthält keine `.mp4`/`.webm`-Dateien. `next.config.js` hat aber schon Cache- und Range-Header für Videos. | Die Infrastruktur steht, es fehlt nur das Material. |
| Keine Motion-Tokens | `globals.css` hartkodiert `700ms`, `1600ms`, `cubic-bezier(0.22,1,0.36,1)`. `FadeInView` nutzt `cubic-bezier(0.4,0,0.2,1)`. Komponenten nutzen `duration-200/300/500`. | Drei verschiedene Easing-Kurven. Eine einheitliche Motion-Sprache fehlt. |
| Keine Messung der Web Vitals im Feld | `src/lib/analytics.js` hat `trackEvent`/`trackLead`, aber kein LCP/INP/CLS | Ohne Messung ist das Motion-Budget unkontrollierbar. |

### 1.3 Technische Prüfung Next 16 (aus `node_modules/next/dist/docs/`)

- **View Transitions** (`01-app/02-guides/view-transitions.md`): Laut Doku funktionieren sie „im App Router ohne Konfiguration“, ein Flag `experimental.viewTransition` ist nicht nötig. `import { ViewTransition } from 'react'`. Der App Router bündelt einen React-Canary, `react@canary` muss nicht installiert werden. Navigationen sind Transitions, deshalb feuert `<ViewTransition>` automatisch.
  - Shared-Element-Morph über `name` (z. B. `product-<slug>`). Die Doku empfiehlt `share="morph"` zusammen mit `default="none"`, sonst blenden alle benannten Elemente bei jeder Transition über.
  - **Der Morph spielt nur, wenn die Zielseite im selben Commit rendert** (also vorgeladen bzw. gecacht ist). Fällt die Seite in ein Suspense-Fallback, gibt es keinen Morph, nur die Enter-Animation. → Die Produktseiten müssen per `<Link>`-Prefetch vorgeladen werden.
  - `<Link transitionTypes={['nav-forward']}>` (`03-api-reference/02-components/link.md`) für Richtungsanimationen. **Prüfpunkt:** Der Link aus `next-intl` (`src/i18n/navigation.js`, `createNavigation`) muss das Prop an `next/link` durchreichen. Vor dem Bau mit einem Test-Link verifizieren.
  - Wrapper gehören in jede `page.js`, nicht ins Layout (Layouts bleiben bestehen, Enter/Exit feuert dort nie).
  - Header mit `viewTransitionName: 'site-header'` verankern (Doku: „Anchoring the header“). `::view-transition { pointer-events: none; }` hält die Seite während der Animation klickbar.
  - Reduced Motion: Für alle `::view-transition-*` die Dauer auf 0 setzen (Rezept in der Doku).
  - Browser: Chromium 125+ und aktuelle Safari- und Firefox-Versionen (laut Doku). Ohne Unterstützung funktioniert die Seite normal, nur ohne Übergang.

---

## 2. Benchmark

Methode: Quelltext der Startseiten am 26.10.2026 per HTTP abgerufen und nach Bibliothekssignaturen durchsucht. Das ist eine Momentaufnahme ohne JS-Rendering. rh.com, ambientedirect.com und reiter.de blocken automatisierte Abrufe (403 bzw. Akamai). Dort stützt sich die Einschätzung auf bekannte Muster und ist entsprechend markiert.

### 2.1 Regional (die Wettbewerber, die Platzhirsch schlagen muss)

| Wettbewerber | Technik (im Quelltext gefunden) | Motion-Eindruck | Was fehlt |
|---|---|---|---|
| **Höttges** (hoettges.at, Dornbirn/Wien) | WordPress + **Elementor** (560 Treffer), **Swiper** | Standard-Elementor-Effekte, Bildreihen, Popups für die Terminbuchung | Keine Seitenübergänge, kein Produktkatalog mit Detailseiten, keine Galerie-Erzählung. Elementor bringt viel JS/CSS mit (typisch schwache CWV). |
| **Fretz** (fretz.de) | **GSAP + ScrollTrigger + Lenis** (Smooth Scroll), **Locomotive**-Reste, **AOS** (`data-aos`), `<video>` | **Der ambitionierteste Regionalauftritt:** Video, Scroll-Effekte, Smooth Scrolling | Drei Animationssysteme parallel (GSAP, AOS, Locomotive/Lenis) sind teuer für INP und die Akkulaufzeit. Lenis übernimmt das native Scrollen. |
| **Gamma** (gamma.ch) | WordPress, **GSAP + ScrollTrigger**, **Flickity** (GPL-3/kommerziell) | Scroll-Animationen, Karussells | Kein Katalog mit Produkttiefe |
| **teo jakob** (teojakob.ch) | WordPress, **Barba.js** (Seitenübergänge), **Swiper** | Seitenübergänge per Barba (Single-Page-Hijack) | Barba ist im WordPress-Umfeld fragil (Skripte und Analytics nach jedem Seitenwechsel). |
| **Hutle** (hutle.com, Dornbirn) | Einfaches CMS, YouTube-Embeds | Kaum Motion | Alles |
| **Dolce Vita** (dolcevita.at) | Die Domain führt zu einer Eis-Manufaktur (Elementor, Swiper, Barba), nicht zum Möbelhaus. Die Feldkircher Möbel-Domain war nicht auffindbar. | – | **Prüfen:** Möbelhaus-URL im Team klären (Bericht 20). |
| **reiter design** | reiter.de liefert 403 an automatisierte Abrufe. reiter-design.at existiert nicht, reiter.at ist ein Fleischhersteller. | [nicht verifiziert] | Manuell im Browser prüfen |

**Fazit regional:** Niemand in der Region nutzt **echte Seitenübergänge mit Shared-Element-Morph**, niemand hat einen **Produktkatalog mit Galerie-Lightbox auf diesem Niveau**, und die Einzigen mit ambitionierter Motion (Fretz, Gamma) bezahlen dafür mit schwerem JS (GSAP + Lenis + AOS bzw. Flickity). **Die Lücke ist also nicht „mehr Animation“, sondern „Premium-Motion, die schneller ist als die der anderen“.** Mit nativen Browser-APIs (View Transitions, Scroll-Driven Animations) bekommt Platzhirsch den Fretz-Effekt mit einem Bruchteil des JS.

### 2.2 International (was die Besten machen)

| Vorbild | Technik (gefunden) | Was wir übernehmen | Was wir nicht übernehmen |
|---|---|---|---|
| **Minotti** (minotti.com) | Eigenes Frontend, **Vimeo/YouTube**-Kampagnenvideos, **Fancybox**, Kampagnenbilder als Hero mit Scroll-Pfeil | Großformatige Kampagnenbilder, viel Weißraum, ruhige Typografie, Video nur als Stimmung | Vimeo-Embeds (Drittanbieter-Cookies, ~500 kB+ Player). Wir hosten selbst. |
| **Poliform** (poliform.it) | WordPress, **Swiper**, YouTube | Editoriale „Kapitel“ pro Kollektion | – |
| **The Conran Shop** (conranshop.co.uk) | **Shopify**, `<video>` im Hero, Swiper | Kurze, stumme Loop-Videos als Atmosphäre und Produktkarten mit Zweitbild bei Hover | – |
| **Connox** (connox.at) | Shopify, **PhotoSwipe**, Swiper | Lightbox mit Pinch-Zoom und Wischen, Zweitbild bei Hover auf Karten | Rabatt-/Badge-Animationen (wirken nicht premium) |
| **RH** (rh.com) [nicht abrufbar, aus bekannten Mustern] | – | Großformatige Bilder mit Fade-Wechsel, sehr langsame Easing-Kurven, schwarze Lightbox, Schrift im Hintergrund | Endlose Mega-Galerien, extrem schwere Seiten |
| **AmbienteDirect** [Akamai-Schutz] | – | Schnelle Filter-Rückmeldung, Merkliste-Mikrointeraktion | Shop-Hektik |

**Muster der Besten:** (1) Bilder dominieren, Bewegung ist langsam (400–900 ms, ausrollende Easing-Kurve). (2) Video läuft als stummer Loop ohne Player-Chrome. (3) Hover zeigt ein **zweites Bild** statt eines Zooms. (4) Die Lightbox ist schwarz, mit Wischen, Pinch-Zoom und einem Zähler. (5) Typografie wird beim Scrollen kaum animiert, höchstens Masken-Reveals für Headlines in editorialen Kapiteln.

---

## 3. Konzept / Zielbild: „Ruhige Exklusivität“

### 3.1 Motion-Prinzipien

1. **Langsam rein, schnell raus.** Eintritt 500–800 ms, Austritt 150–200 ms (deckt sich mit der Asymmetrie aus der Next-Doku).
2. **Eine Kurve für alles.** `--ease-out-quiet: cubic-bezier(0.22, 1, 0.36, 1)` (wird bereits im Hero genutzt). Für Morphs: `--ease-in-out-quiet: cubic-bezier(0.65, 0, 0.35, 1)`.
3. **Kleine Wege.** Translate 12–32 px, Scale maximal 1.03–1.06. Exklusiv wirkt, was sich *wenig* bewegt.
4. **Inhalt ist nie versteckt.** Keine `opacity: 0` vor der Hydration, keine Inhalte hinter JS. Scroll-Reveals nutzen nur `transform` oder `clip-path` und werden per `@supports` als Verbesserung aufgesetzt.
5. **Nur Compositor-Eigenschaften:** `transform`, `opacity`, `clip-path`, `filter` (sparsam). Niemals `width/height/top/left` animieren (CLS).
6. **CSS zuerst, JS nur bei Bedarf.** Native APIs (View Transitions, Scroll-Driven Animations, `@starting-style`, `transition-behavior: allow-discrete`) vor Bibliotheken. Eine JS-Bibliothek kommt nur dort zum Einsatz, wo Gesten nötig sind (Karussell, Lightbox), und wird lazy geladen.
7. **Reduced Motion heißt nicht „keine Rückmeldung“.** Bei `prefers-reduced-motion: reduce` entfallen Bewegung, Parallax, Autoplay-Video und Slides. Kurze Crossfades (≤ 150 ms) und Farbwechsel als Rückmeldung bleiben.

### 3.2 Motion-Tokens (neu in `src/app/globals.css`, als Tailwind-4-`@theme`)

```css
@theme {
  --ease-quiet: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-quiet-inout: cubic-bezier(0.65, 0, 0.35, 1);
  --duration-micro: 160ms;   /* Hover, Fokus, Herz */
  --duration-ui: 280ms;      /* Menüs, Chips, Overlays */
  --duration-enter: 600ms;   /* Reveals */
  --duration-morph: 450ms;   /* View Transitions */
  --duration-slow: 1600ms;   /* Hero-Zoom */
}
```

Tailwind 4 erzeugt daraus Klassen wie `ease-quiet` und `duration-ui`. Die Varianten `motion-safe:`/`motion-reduce:` sind in Tailwind 4 eingebaut.

### 3.3 Core-Web-Vitals-Budget (verbindlich für jedes Feature)

| Kennzahl | Google „gut“ | **Platzhirsch-Ziel (p75, Handy)** | Motion-Regel |
|---|---|---|---|
| LCP | ≤ 2,5 s | **≤ 2,0 s** | Das LCP-Element (Hero-Bild bzw. Video-Poster) wird nie animiert eingeblendet und nie durch JS verzögert. Video startet erst nach `load`. |
| INP | ≤ 200 ms | **≤ 150 ms** | Keine Scroll-Listener auf dem Main-Thread (kein Lenis, kein ScrollTrigger-Scrub). Keine Animation blockiert Klick-Handler. View Transitions ≤ 450 ms. |
| CLS | ≤ 0,1 | **≤ 0,05** | Nur `transform`/`opacity`. Feste `aspect-ratio` für Video, Galerie und Karten. |
| JS für Motion, Initial-Route | – | **≤ 10 kB gzip** | Native APIs kosten 0 kB. Embla (~7 kB) nur auf Seiten mit Karussell, Lightbox nur per `next/dynamic` beim ersten Klick. |
| Hero-Video | – | **≤ 2,5 MB (Desktop) / ≤ 1,2 MB (Handy)**, 8–12 s Loop | Siehe F5 |
| Gleichzeitige Compositing-Layer | – | `will-change` nur während einer Animation | Nicht mehr dauerhaft auf 78 Elementen wie heute in `FadeInView` |

Messung: Feld-Daten über `web-vitals` 6.2.3 (Apache-2.0, ~2 kB gzip) an GA4 über das vorhandene `trackEvent` in `src/lib/analytics.js` (nur nach Consent, siehe Consent Mode v2 in `src/components/Cookies`). Labor-Daten über `@lhci/cli` 0.15.1 (Apache-2.0, nur Dev-Dependency) mit Budgets in CI oder lokal vor jedem Deploy.

### 3.4 Bibliotheksvergleich (Versionen und Lizenzen per `npm view`, Größen von bundlephobia, 26.10.2026)

| Option | Version | Lizenz | Größe (gzip) | Einsatz bei Platzhirsch | Urteil |
|---|---|---|---|---|---|
| **CSS Scroll-Driven Animations** (`animation-timeline: view()/scroll()`) | nativ | – | **0 kB** | Reveals, Bild-Masken, Parallax, Scroll-Storytelling, Lesefortschritt | **Standard.** Läuft außerhalb des Main-Threads. Unterstützt in Chrome/Edge 115+ und Safari 26+. Firefox: Stand 26.10.2026 nicht verifiziert, vermutlich weiter nicht standardmäßig aktiv. Ohne Unterstützung bleibt der Inhalt statisch sichtbar, das ist für dieses Konzept unkritisch. |
| **View Transitions** (React `<ViewTransition>` in Next 16) | nativ / React-Canary im App Router | – | **0 kB zusätzlich** | Katalog → Produkt-Morph, Crossfade zwischen Seiten, Filterwechsel | **Standard** (siehe 1.3) |
| **Motion** (ehem. framer-motion), `motion/react` | 14.6.0 | MIT | Vollpaket ~57 kB laut bundlephobia. Mit `LazyMotion` + `m` + `domAnimation` laut Motion-Doku ca. 15 kB, `m`-Komponente ~5 kB [Herstellerangabe] | Nur falls Gesten-/Layout-Animationen nötig werden, die CSS nicht kann (z. B. Drag-to-dismiss in eigener Lightbox, `layout`-Animation der Merkliste) | **Optional, nicht für den Start.** Gute React-Integration, aber für unsere Fälle reichen CSS und View Transitions. Falls doch nötig: nur `LazyMotion` mit `strict`. |
| **GSAP** (+ ScrollTrigger, SplitText, Flip) | 3.15.0, `@gsap/react` 2.1.2 | „Standard No Charge License“ (seit der Webflow-Übernahme **kostenlos inkl. aller früheren Club-Plugins, auch kommerziell**). Verboten sind nur no-code Animations-Builder, die mit Webflow konkurrieren, sowie Reverse Engineering. Für eine Händler-Website unkritisch. | Core ~27 kB, plus ScrollTrigger und SplitText | Komplexe Timelines | **Nicht empfohlen.** Lizenz ist kein Hindernis, aber Größe, Imperativ-Stil und Pflegeaufwand passen nicht zu einem 5-Personen-Team. Keine OSI-Lizenz, also Lizenzänderungen durch Webflow möglich. Was Fretz mit GSAP macht, schaffen wir nativ. |
| **Lenis** (Smooth Scroll) | 1.3.27 | MIT | ~5,5 kB | – | **Bewusst nicht.** Übernimmt das native Scrollen (rAF-Loop auf dem Main-Thread). Stört `scroll-restoration` (in `client-layout.js` ausdrücklich nativ belassen), Anker-Sprünge, `position: sticky`, Tastatur- und Screenreader-Nutzung und erhöht das INP-Risiko. Unser Differenzierungsmerkmal ist Geschwindigkeit. |
| **Embla Carousel** (`embla-carousel-react`) | 8.6.0 (v9 erst `9.0.0-rc04` → **8.6.0 nehmen**) | MIT | ~7,3 kB | Ersatz für react-slick in Produktgalerie, Markenseite, Ausstellung | **Empfohlen.** Headless (Tailwind-Styling bleibt bei uns), natives Scroll-Gefühl, keine geklonten Slides, Plugins: `embla-carousel-fade` 8.6.0 und `embla-carousel-autoplay` 8.6.0 (beide MIT). |
| react-slick + slick-carousel | 0.31.0 / CSS aus 1.8.1 | MIT | ~15,4 kB + Deps + 2 CSS | – | **Ablösen** (F4) |
| **yet-another-react-lightbox** | 3.32.2 | MIT | ~12 kB (Kern), Zoom-/Thumbnail-Plugins separat | Produkt- und Projektgalerie | **Empfohlen**, per `next/dynamic` erst beim ersten Klick geladen. Pinch-Zoom, Wischen, Tastatur, Fokusfalle und `next/image`-Integration laut Doku. |
| PhotoSwipe | 5.4.4 | MIT | ~17 kB | Alternative zur Lightbox | Gut (Connox nutzt es), aber vanilla-JS, letztes Release 05/2024. YARL passt besser zu React 19. |
| Natives CSS Scroll-Snap | nativ | – | 0 kB | Einfache Bildreihen (Ausstellung, „Weitere Produkte“, Mobile-Swipe) | **Empfohlen** für alles ohne Thumbnails oder Autoplay |
| `web-vitals` | 6.2.3 | Apache-2.0 | ~2 kB | Feld-Messung | **Empfohlen** |
| Video-Player (`media-chrome` 4.19.4 / `@mux/mux-player-react` 3.14.1) | – | MIT | 30–100+ kB | – | **Nicht nötig.** Ein stummes `<video>` mit eigenem Pause-Knopf reicht. Mux wäre ein zusätzlicher kostenpflichtiger Dienst. |

**Gesamtbilanz:** Nach F1–F4 sinkt das Motion-JS von heute ~15 kB (Slick) plus `FadeInView` in 18 Client-Komponenten auf ~7 kB (Embla, nur wo nötig) plus 12 kB Lightbox (nur nach Klick). Gleichzeitig kommen Seitenübergänge, Scroll-Storytelling und Video hinzu.

---

## 4. Konkrete Features

Legende Aufwand: **S** ≤ 2 Tage · **M** 3–7 Tage · **L** > 7 Tage (eine Entwickler-Person).

### F1 – Motion-Fundament: Tokens + `FadeInView` → CSS-`Reveal`
- **Was:** Motion-Tokens (3.2) in `globals.css`. `FadeInView` wird zu einer **Server-kompatiblen** Komponente ohne `"use client"`, ohne Observer und ohne Inline-`opacity`: Sie rendert nur `<Tag className="reveal reveal--{direction}">`. Die Bewegung kommt aus CSS (`animation-timeline: view()`). Die bestehende API (`direction`, `delay`, `distance`) bleibt über CSS-Variablen erhalten (`style={{'--reveal-distance': '30px', '--reveal-delay': ...}}`). So müssen die 78 Aufrufstellen nicht angefasst werden. In Formularen (`AnfrageFormProduct.js`, `kontakt.js`, `BeratungClient.js`) Reveals für Felder **entfernen**, nur der Abschnitt darf sich setzen. `will-change` entfällt. Die `<noscript>`-Regel in `layout.js` wird überflüssig und kann bleiben oder entfernt werden.
- **Nutzen Umsatz/Ranking:** Kleinerer JS-Bundle, Inhalte sofort sichtbar (LCP auf News- und Karriere-Seiten, Crawlbarkeit ohne Notlösung), ruhigere Formulare (Vertrauen → Anfragen). Basis für alle weiteren Features.
- **Aufwand:** **S** (1–2 Tage inkl. Sichtprüfung der 18 Dateien)
- **Abhängigkeiten:** keine
- **Dateien:** `src/components/Reusable/FadeInView.js` (umbauen), `src/app/globals.css`, optional `src/app/[locale]/layout.js` (noscript), Formular-Komponenten (Reveals entfernen)
- **Bibliotheken:** keine

### F2 – Produktkarten: Zweitbild-Hover + Mikrointeraktionen
- **Was:** Auf Katalogkarten (`shopCatalog.js`), Kategorie-Kacheln (`shopCategoryGrid.js`), „Weitere aus der Kollektion“ (`collectionSlider.js`) und Markenseiten:
  - Hover/Fokus: Das Zweitbild (`images[1]`) blendet in 400 ms über (`opacity`), das Erstbild skaliert minimal auf 1.03. Gibt es kein Zweitbild, bleibt nur die Skalierung. Das Zweitbild wird erst bei `pointerenter` geladen (`loading="lazy"` + `fetchPriority="low"`), damit der Katalog nicht doppelt so viel lädt.
  - Unterhalb des Bilds: Markenname in Gold, der Titel bekommt eine Unterstreichung, die von links wächst (`scale-x` auf Pseudo-Element, 280 ms).
  - Dieselben Zustände für `:focus-visible` auf dem Karten-Link (Tastatur).
  - Touch-Geräte (`@media (hover: none)`): kein Hover-Effekt, stattdessen eine Wisch-Punktleiste, falls mehrere Bilder vorhanden sind (CSS Scroll-Snap, 0 kB).
  - **Merkliste-Herz** (`wishlistHeart.js`): Beim Hinzufügen kurzes „Pop“ (Scale 1 → 1.2 → 1, 300 ms) und Füllung von unten (`clip-path`). Der Zähler im Header (`navbar.js`) zählt mit kleinem Bump hoch. `aria-live="polite"` meldet „Zur Merkliste hinzugefügt“. Den Event `add_to_wishlist` gibt es bereits in `lib/analytics.js`.
- **Nutzen:** Mehr Klicks auf Produktdetailseiten (mehr Seiten pro Sitzung = positives Nutzersignal), mehr Merkliste-Einträge → mehr Anfragen. Hebt sich sichtbar von Höttges und Hutle ab (die keine Produktkarten haben).
- **Aufwand:** **S–M** (2–3 Tage)
- **Abhängigkeiten:** Für das Zweitbild braucht es ein zweites Bild pro Produkt. Im statischen Katalog ist `images[]` teilweise vorhanden (`staticShopProducts.js`). Beim Backoffice ist zu prüfen, ob die Galerie-Bilder in der Listen-API (`src/lib/api`) mitkommen. Wenn nicht: zuerst nur dort, wo es vorhanden ist. Bildrechte wie beim Erstbild.
- **Dateien:** `src/components/ShopCatalog/shopCatalog.js`, `shopCategoryGrid.js`, `collectionSlider.js`, `wishlistHeart.js`, `src/components/Navbar/navbar.js`, `globals.css`. Neu: `src/components/ShopCatalog/ProductCardMedia.js` (gemeinsamer Bildbaustein für alle Karten).
- **Bibliotheken:** keine

### F3 – Seitenübergänge: Shared-Element-Morph Katalog → Produkt (View Transitions)
- **Was:**
  1. **Morph:** Das Kartenbild im Katalog und das Hauptbild der Produktseite erhalten `<ViewTransition name={"product-" + slug} share="morph" default="none">`. Klick → das Bild gleitet von der Karte an seinen Platz in der Galerie (450 ms, `--ease-quiet-inout`, Blur-Keyframe gegen Interpolationsartefakte laut Doku).
  2. **Seiten-Crossfade:** Alle übrigen Navigationen bekommen einen kurzen Fade (Austritt 150 ms, Eintritt 250 ms, 8 px nach oben), keine Slides (Slides sind der stärkste Auslöser für Bewegungsempfindlichkeit).
  3. **Richtung** nur in klaren Hierarchien: Breadcrumb „← Zurück zu Sofas“ mit `transitionTypes={['nav-back']}`, Produktkarte mit `['nav-forward']`.
  4. **Header verankern** (`viewTransitionName: 'site-header'` in `navbar.js`, die mobile CTA-Leiste ebenso).
  5. `::view-transition { pointer-events: none; }` und Reduced-Motion-Regel aus der Doku.
  6. Analog für Marken-Übersicht → Markenseite (Logo/Bild-Morph) und News-Liste → Artikel.
- **Nutzen:** Das stärkste „Premium-App“-Signal, das kein regionaler Wettbewerber hat (Barba bei teo jakob ist nur ein Seitenfade). Gefühlte Ladezeit sinkt, das Durchklicken durch den Katalog steigt. SEO-neutral, denn das HTML bleibt identisch.
- **Aufwand:** **M** (3–5 Tage, davon 1 Tag für Prefetch, Safari-Test und Edge-Cases)
- **Abhängigkeiten:** keine externen. Technische Prüfpunkte: (a) `next-intl`-`Link` reicht `transitionTypes` durch. (b) Produktseiten (`src/app/[locale]/produkte/[category]/[product]/page.js`) müssen ohne Suspense-Fallback rendern, sonst entfällt der Morph (siehe 1.3). (c) Mit F4 abstimmen: Das Galerie-Hauptbild muss beim ersten Render ein stabiles `<Image>` sein und nicht innerhalb eines noch nicht initialisierten Karussells liegen.
- **Dateien:** `src/components/ShopCatalog/shopCatalog.js`, `ProductCardMedia.js` (aus F2), `src/components/ShopCatalog/productGallery.js`, alle `page.js` unter `src/app/[locale]/produkte/**`, `src/app/[locale]/ueber-uns/marken/**`, `src/app/[locale]/news/**`, `src/components/Navbar/navbar.js`, `src/components/Reusable/MobileCtaBar.js`, `globals.css`. Neu: `src/components/Motion/PageTransition.js` (Wrapper mit `enter`/`exit`-Map, um ihn in jeder `page.js` einzubinden).
- **Bibliotheken:** keine (React `ViewTransition` aus dem App-Router-React)

### F4 – Galerie & Lightbox neu: Embla + yet-another-react-lightbox, Slick entfernen
- **Was:**
  - **Produktgalerie** (`productGallery.js`): Embla (Hauptbild, Fade-Plugin oder Slide) plus synchronisierte Thumbnail-Leiste (zweite Embla-Instanz, offizielles „Thumbnails“-Beispiel). Das erste Bild wird als normales `next/image` serverseitig gerendert (LCP und Morph-Ziel aus F3). Embla übernimmt erst nach der Hydration.
  - **Lightbox:** yet-another-react-lightbox 3.32.2 mit Plugins `Zoom`, `Thumbnails`, `Counter`, per `next/dynamic(() => import(...), { ssr: false })` erst beim ersten Klick geladen. Schwarzer Hintergrund (`--color-night`), Bildwechsel per Crossfade 300 ms, Wischen nach unten schließt die Lightbox. Fokusfalle und Escape laut Bibliothek. Der Fokus springt beim Schließen zum auslösenden Bild zurück.
  - **Markenseite** (`markenitems.js`) und **Ausstellung** (`austellung.js`): Embla, wo Pfeile oder Autoplay gewollt sind. Einfache Reihen auf **natives CSS Scroll-Snap** umstellen (0 kB). Autoplay nur mit Pause-Knopf und nie bei Reduced Motion (WCAG 2.2.2).
  - Danach `react-slick` und `slick-carousel` aus `package.json` entfernen, inklusive der beiden CSS-Imports.
- **Nutzen:** Galerie ist auf Produktseiten der zentrale Kaufauslöser im Premium-Segment (Materialdetails, Stoffe). Pinch-Zoom auf dem Handy, ~8 kB weniger JS, bessere Barrierefreiheit (keine geklonten Slides). Weniger Pflege, weil eine Karussell-Technik für alles genutzt wird.
- **Aufwand:** **M** (4–6 Tage für alle drei Stellen)
- **Abhängigkeiten:** keine für den Umbau. Mehr Galeriebilder pro Produkt hängen am Backoffice (Galerie-Feld) und an den Bildrechten.
- **Dateien:** `src/components/ShopCatalog/productGallery.js` (neu schreiben, Zoom-Logik entfällt), `src/components/MarkenItems/markenitems.js`, `src/components/UberUns/austellung.js`, `package.json`. Neu: `src/components/Gallery/Carousel.js` (Embla-Wrapper mit Pfeilen, Punkten und `aria-roledescription="carousel"`), `src/components/Gallery/Lightbox.js` (dynamischer YARL-Wrapper).
- **Bibliotheken:** `embla-carousel-react@8.6.0` (MIT, ~7,3 kB), optional `embla-carousel-fade@8.6.0`, `embla-carousel-autoplay@8.6.0` (MIT, je < 2 kB), `yet-another-react-lightbox@3.32.2` (MIT, ~12 kB, lazy)

### F5 – Video-Hero „Ein Abend im Showroom“
- **Was:** Optional auf Startseite und Marken- oder Stadt-Landingpages: ein **stummer Loop von 8–12 s** aus eigenem Material (Café-Licht, Hand über Minotti-Stoff, Rimadesio-Glastür gleitet, Outdoor-Schirm am See). Technik:
  - Poster-Bild = das heutige Hero-Bild, mit `priority` als LCP. Die Bild-Logik in `Hero.js` bleibt unverändert, das `<video>` liegt **darüber** und wird erst nach `window.load` + `requestIdleCallback` mit `src` versehen. Kein Laden bei `prefers-reduced-motion`, `navigator.connection.saveData` oder `effectiveType` 2g/3g.
  - `<video muted playsinline loop preload="none" poster=... aria-hidden="true">`, eigener Pause/Play-Knopf unten rechts (WCAG 2.2.2, Pflicht bei Autoplay > 5 s). Pausiert bei `visibilitychange` und außerhalb des Viewports (ein `IntersectionObserver`).
  - Formate: **AV1 (WebM/MP4)** mit **H.264-MP4**-Fallback, 1920×1080 bzw. 1280×720 für Desktop, Hochformat 720×1280 für Handys über `<source media="(orientation: portrait)">`. Kein Ton, keine Untertitel nötig (rein dekorativ). Die Botschaft steht im HTML-Text.
  - **Lokale Produktion auf dem vorhandenen Windows-PC mit NVIDIA-GPU:** `ffmpeg` mit NVENC (`-c:v av1_nvenc` ab RTX 40xx, sonst `hevc_nvenc`/`h264_nvenc` plus AV1 in Software mit `libsvtav1`). Ein Skript `scripts/encode-hero.ps1` (außerhalb von `src/`) erzeugt alle Varianten und das Poster in einem Schritt. Das macht den Pflegeaufwand trivial: neues Video in den Ordner legen, Skript laufen lassen.
  - Hosting in `public/video/`. Cache- und Range-Header sind in `next.config.js` schon gesetzt. Kein Vimeo/YouTube (Datenschutz, Consent, Player-Gewicht).
- **Nutzen:** Atmosphäre und „Gastgeberort“ (Alleinstellung 1 aus dem Masterkonzept) emotional belegen, also genau das, was kein Händler kopieren kann. Längere Verweildauer, Fretz-Niveau ohne Fretz-Gewicht. Das Material ist auch für Instagram-Reels nutzbar.
- **Aufwand:** **M** (Code 1–2 Tage, Dreh und Schnitt 1–2 Tage)
- **Abhängigkeiten:** **Eigenes Videomaterial** (Dreh im Showroom), **Bildrechte**: keine Hersteller-Kampagnenvideos ohne schriftliche Freigabe. Zu klären ist auch, ob Produkte im eigenen Showroom-Video markenrechtlich unkritisch sind (in der Regel ja, wenn keine Händler-Behauptung im Bild steht). Erkennbare Personen nur mit Einwilligung (DSGVO). Kein Backoffice nötig.
- **Dateien:** `src/components/Home/Hero.js` (Poster bleibt), neu: `src/components/Motion/AmbientVideo.js` (Client-Insel, ~1 kB), `public/video/hero-*.{webm,mp4,jpg}`, `scripts/encode-hero.ps1`, `globals.css`
- **Bibliotheken:** keine (natives `<video>`). Werkzeug lokal: `ffmpeg` (LGPL/GPL-Build, nur lokal, kein Code im Bundle)

### F6 – Scroll-Storytelling „Vom Plan zum Zuhause“ (Projekt-/Referenzseiten, Stadt-Landingpages)
- **Was:** Ein wiederverwendbares Kapitel-Muster für 3–5 Schritte (z. B. „Erstgespräch im Café → Planung → Lieferung in die Schweiz inkl. Verzollung → Montage → bezugsfertig“). Desktop: links eine **sticky** Bildfläche, rechts scrollende Textschritte. Bildwechsel per Crossfade mit `clip-path`-Maske (`inset(100% 0 0 0)` → `inset(0)`), gesteuert über **CSS Scroll-Driven Animations** (`view-timeline` pro Textschritt, `timeline-scope` am Container). Handy: einfache Abfolge Bild, Text, Bild, Text ohne Sticky, mit `.reveal`.
  - **Alle Texte und Bilder liegen als normales, crawlbares HTML vor** (Google sieht den Inhalt ohne Scrollen). Das Muster ist rein präsentativ.
  - Fortschrittsanzeige (dünne Goldlinie, `animation-timeline: scroll()`), nur dekorativ (`aria-hidden`).
  - Reduced Motion / kein Support: alle Bilder untereinander, statisch.
  - Einsatz: Stadt-Landingpages (`src/app/[locale]/designermoebel-*`), die geplante Schweiz-Seite (Ablauf Verzollung/CHF, SEO-Schlachtplan H6), Hotel-/ÖHT-Seite, später Referenzprojekte.
- **Nutzen:** Erklärt die Alleinstellungen (Dreiländer-Festpreis, ein Ansprechpartner, abgesicherte Anzahlung) erzählerisch statt als Bullet-Liste. Mehr Verweildauer und mehr Text-Tiefe auf Landingpages reduzieren das Doorway-Risiko (Regel in 25). Höhere Anfragequote auf den Seiten mit Projektcharakter.
- **Aufwand:** **M** für den Baustein, je Seite danach **S** (nur Inhalte)
- **Abhängigkeiten:** **eigene Projektfotos** mit Kunden-Einwilligung (Bildrechte, DSGVO). Vorher Platzhalter aus dem eigenen Showroom. Texte aus dem Content-Team. Kein Backoffice nötig (Inhalte in `src/lib/content/*` wie die bestehenden Stadtseiten).
- **Dateien:** neu: `src/components/Motion/StoryChapters.js` (Server Component, nur Markup und Klassen), CSS in `globals.css` (Abschnitt „Story“). Einbindung in `src/app/[locale]/designermoebel-*/page.js` und neue Landingpages.
- **Bibliotheken:** keine

### F7 – Editoriale Bild-Reveals und Platzhalter
- **Was:** Für große editoriale Bilder unterhalb der Falz (Über-uns, Ausstellung, Markenseiten, Ratgeber):
  - **Masken-Reveal:** `clip-path: inset(0 0 12% 0)` → `inset(0)` plus Bild-Scale 1.06 → 1 beim Eintritt, CSS `view()`-Timeline. Niemals beim LCP-Bild.
  - **Leichtes Parallax** (max. 6 % Versatz) für Vollbreiten-Banner (`animation-timeline: view()` mit `translate`), nur `motion-safe`.
  - **Platzhalter statt Weißblitz:** Farbfläche in der Dominanzfarbe hinter jedem `next/image` (bei lokalen Bildern `placeholder="blur"` automatisch per Import). Für Backoffice-Bilder eine neutrale Leinen-Farbe (`--color-linen`) als Hintergrund. Später, wenn möglich, Dominanzfarbe aus dem Backoffice.
  - **Headline-Reveals** nur in editorialen Kapiteln: Zeilenmaske über CSS (`clip-path` auf `<span>` pro Zeile, Zeilen manuell gesetzt). Keine SplitText-Bibliothek (Screenreader und Übersetzungen in 4 Sprachen brechen anders).
- **Nutzen:** Hochwertiger Gesamteindruck („Magazin statt Katalog“). Kein Weißblitz beim Laden wirkt schneller. Kein Ranking-Risiko, weil reines CSS.
- **Aufwand:** **S**
- **Abhängigkeiten:** keine (Dominanzfarbe aus dem Backoffice wäre ein späteres Plus)
- **Dateien:** `globals.css`, `src/components/UberUns/austellung.js`, `src/components/MarkenItems/*`, `src/components/Home/about.js`, `src/components/NewsItem/newsItemBanner.js` (nur wenn es nicht das LCP-Element ist)
- **Bibliotheken:** keine

### F8 – Mikrointeraktionen in Navigation, Formularen und CTAs (Conversion-Pfade)
- **Was:**
  - **Mega-Menü/Dropdowns** (`navbar.js`): Ein- und Ausblenden per `@starting-style` + `transition-behavior: allow-discrete` (natives CSS für `display`-Übergänge, 0 kB), 280 ms, mit Bildvorschau beim Hover über einer Kategorie (Bild per `loading="lazy"`).
  - **CTA-Buttons** („Beratungstermin“, gold): Hintergrund-Füllung von links (`background-size` bzw. Pseudo-Element mit `scale-x`), Pfeil-Icon 4 px nach rechts. Gleiches Verhalten bei `:focus-visible`.
  - **Formular-Rückmeldung** (`AnfrageFormProduct.js`, `kontakt.js`, `BeratungClient.js`, `newsletter.js`): Senden-Knopf wird zum Spinner und dann zum Häkchen (SVG-`stroke-dashoffset`, 400 ms). Danach erscheint die Erfolgsmeldung mit `role="status"`. Fehler: dezentes Schütteln (2 × 4 px, nur `motion-safe`), sonst Rahmenfarbe. Das deckt sich mit den neuen Conversion-Events (`trackLead`) und macht die Conversion für den Nutzer spürbar.
  - **Mehrstufige Anfrage** (Merkliste → Anfrage, `CartPage.js`): Fortschrittsleiste der Schritte mit Crossfade zwischen den Schritten über `<ViewTransition key={step}>` (laut Doku „Step 4: Crossfade within the same route“, ausgelöst durch `startTransition`).
  - **Markenband** (`BrandWall.js`): sichtbarer Pause-Knopf (WCAG 2.2.2), unter Reduced Motion statisches Raster.
  - **Mobile CTA-Leiste** (`MobileCtaBar.js`): blendet beim Herunterscrollen aus und beim Hochscrollen ein. Das geht auch rein CSS (`animation-timeline: scroll()` reicht hier nicht für Richtung), deshalb als einfacher, passiver Scroll-Listener mit `requestAnimationFrame`-Throttle, alternativ immer sichtbar lassen. **Empfehlung: sichtbar lassen**, eine Conversion-Leiste versteckt man nicht.
- **Nutzen:** Direkte Wirkung auf Anfragen und Termine (Rückmeldung = weniger Doppel- und Abbruch-Einsendungen). Höhere Wahrnehmung von Qualität im Moment der Entscheidung.
- **Aufwand:** **S–M** (3 Tage)
- **Abhängigkeiten:** keine
- **Dateien:** `src/components/Navbar/navbar.js`, `src/components/AnfrageFormProduct/AnfrageFormProduct.js`, `src/components/Kontakt/kontakt.js`, `src/components/BeratungClient/BeratungClient.js`, `src/components/Newsletter/newsletter.js`, `src/components/CartPage/CartPage.js`, `src/components/Home/BrandWall.js`, `globals.css`. Neu: `src/components/Motion/SubmitButton.js`
- **Bibliotheken:** keine

### F9 – Motion-Qualitätssicherung: Web-Vitals-Messung + Budget-Check
- **Was:** `web-vitals` (`onLCP`, `onINP`, `onCLS` mit `attribution`-Build) sendet nach Consent an GA4 über `trackEvent("web_vitals", …)` in `src/lib/analytics.js`, mit `page_type` (home/produkt/marke/stadt). Ein GA4-Explorations-Bericht „p75 je Seitentyp“. Lokal bzw. vor Deploys `lhci autorun` mit Budget-Datei (LCP ≤ 2,0 s, CLS ≤ 0,05, TBT ≤ 150 ms, JS-Initial ≤ 170 kB gzip auf 5 Referenz-URLs). Ergänzend der Bundle-Analyzer laut Next-Doku (`02-guides/package-bundling.md`).
- **Nutzen:** Sichert, dass Motion nie das Ranking kostet. Beweist der Geschäftsführung, dass „schneller als Fretz und Höttges“ stimmt (Vergleich über CrUX/PageSpeed der Wettbewerber-URLs).
- **Aufwand:** **S**
- **Abhängigkeiten:** Consent Mode v2 (vorhanden), GA4 (vorhanden)
- **Dateien:** `src/lib/analytics.js`, neu: `src/components/Analytics/WebVitals.js` (Client-Insel in `client-layout.js`), `lighthouserc.json`, `budget.json` (Projektwurzel)
- **Bibliotheken:** `web-vitals@6.2.3` (Apache-2.0, ~2 kB), dev: `@lhci/cli@0.15.1` (Apache-2.0)

### F10 (später) – „Shop the Room“-Hotspots auf Raumbildern
- **Was:** Pulsierende Hotspots (CSS, `motion-safe`) auf Showroom-/Projektbildern. Bei Klick öffnet sich eine Produktkarte als Popover (natives `popover`-Attribut + Anchor Positioning mit Fallback) mit Link zur Produktseite und Merkliste-Herz. Ergänzt die QR-Idee „Shop the Room“ aus dem Masterkonzept (Kap. 9).
- **Nutzen:** Verbindet Inspiration und Katalog. Ein Klick vom Raumbild zur Anfrage.
- **Aufwand:** **M**
- **Abhängigkeiten:** Hotspot-Koordinaten pflegen. Ohne Backoffice-Feld geht das als JSON in `src/lib/content`, später besser als Backoffice-Feld (sonst Pflegeaufwand im Code). Eigene Raumfotos (Bildrechte).
- **Dateien:** neu: `src/components/Motion/ShopTheRoom.js`, Inhalte in `src/lib/content/rooms.js`
- **Bibliotheken:** keine

### Bewusst nicht im Plan
- **Lenis/Smooth Scroll, Custom Cursor, Preloader/Intro-Screen, Scroll-Hijacking, WebGL-Distortion-Effekte, 3D-Konfigurator:** Sie kosten INP, Barrierefreiheit und Pflege und wirken eher nach Agentur-Showreel als nach Einrichtungshaus. Das 3D-Thema ist im Masterkonzept ausdrücklich auf „Nicht jetzt“ gesetzt.
- **Animierte Preis-, Rabatt- oder Countdown-Elemente:** im Premium-Segment schädlich für die Marke. Außerdem fehlt das Preisfeld im Backoffice.

---

## 5. Risiken

| Bereich | Risiko | Gegenmaßnahme |
|---|---|---|
| **Performance – LCP** | Video oder Reveal verzögert das LCP-Element | LCP-Bild nie animiert einblenden (heute korrekt: `.hero-zoom` startet bei `scale(1.06)` mit voller Deckkraft). Video erst nach `load`. Budget-Check (F9). |
| **Performance – INP** | Zu viele gleichzeitige Animationen, JS-Scroll-Listener | Nur CSS-Timelines (Compositor). Keine Scroll-Bibliothek. View Transitions ≤ 450 ms und `pointer-events: none` auf dem Overlay. |
| **Performance – Handy/Akku** | Autoplay-Video und Marquee laufen außerhalb des Viewports | `IntersectionObserver` pausiert das Video. CSS-Animationen außerhalb des Viewports drosselt der Browser. `content-visibility: auto` für lange Sektionen. |
| **View Transitions – Browser** | Safari zeigt Morphs teils abweichend (laut Next-Doku). Firefox-Unterstützung jünger. | Progressive Enhancement: Die Seite funktioniert ohne. Test auf iOS Safari (wichtig wegen Schweizer Zielgruppe mit hohem iPhone-Anteil) vor dem Rollout. |
| **View Transitions – Next-Canary** | `<ViewTransition>` stammt aus dem React-Canary im App Router. Die API kann sich mit Next-Updates ändern. | Alles in einem Wrapper (`src/components/Motion/PageTransition.js`) kapseln, damit ein Update nur eine Datei betrifft. Changelog bei jedem `next`-Upgrade prüfen. |
| **Barrierefreiheit / Recht** | Autoplay > 5 s ohne Pause verstößt gegen WCAG 2.2.2. Bewegung kann vestibuläre Beschwerden auslösen. Seit 28.06.2025 gilt in AT das **Barrierefreiheitsgesetz (BaFG)** für Online-Handel. Kleinstunternehmen (< 10 MA **und** ≤ 2 Mio. € Umsatz/Bilanz) sind bei Dienstleistungen ausgenommen, Platzhirsch liegt beim Umsatz vermutlich darüber [prüfen] | Pause-Knöpfe (F5, F8), konsequentes `prefers-reduced-motion`, keine Slides als Seitenübergang, Fokus-Management in der Lightbox. Prüfung mit axe DevTools und Tastatur pro Feature. |
| **Recht – Bildrechte** | Hersteller-Kampagnenbilder/-videos in Hero, Story oder Hover-Zweitbild ohne Freigabe | Video und Story nur aus eigenem Material. Für Zweitbilder gelten dieselben Freigaben wie für die Katalogbilder (Thema aus 25). Freigaben schriftlich bei Minotti, Poliform, Rimadesio und Flos anfragen. |
| **Recht – Händler-Behauptung** | Animierte Badges oder Video-Texteinblendungen wie „Ihr Minotti-Händler“ | Redaktionsregel aus 25 gilt auch für Motion-Texte und Videos. Nur „ClassiCon-Händler“ ist belegt. |
| **Recht – Datenschutz** | YouTube/Vimeo-Embeds setzen Cookies vor dem Consent | Videos selbst hosten. Externe Embeds nur nach Consent (Zwei-Klick-Lösung). |
| **Pflege** | Seiten-spezifische Sonderanimationen veralten, niemand im Team kann sie anpassen | Nur die Bausteine aus diesem Plan (`Reveal`, `Carousel`, `Lightbox`, `StoryChapters`, `AmbientVideo`, `PageTransition`, `SubmitButton`). Inhalte wechseln ohne Code-Änderung. Video-Austausch per Skript. |
| **Pflege – Abhängigkeiten** | Drittbibliotheken veralten (wie react-slick) | Nur zwei neue Laufzeit-Bibliotheken (Embla, YARL), beide MIT, aktiv gepflegt (Releases 2026). Embla bleibt auf 8.6.0, bis v9 stabil ist. |

---

## 6. Priorisierte Reihenfolge

### 6.1 Sofort baubar, ohne Backoffice-Zugang (alles nur Frontend)

| Rang | Feature | Aufwand | Warum jetzt |
|---|---|---|---|
| 1 | **F1** Motion-Fundament / `FadeInView` → CSS | S | Grundlage für alles, sofort messbarer Performance-Gewinn |
| 2 | **F9** Web-Vitals-Messung + Budgets | S | Erst messen, dann animieren. Liefert den Vorher-Wert. |
| 3 | **F4** Embla + Lightbox, Slick entfernen | M | Produktseiten sind laut SEO-Plan (H1) die Long-Tail-Maschine, die Galerie ist ihr Herz |
| 4 | **F3** View Transitions Katalog → Produkt | M | Größter sichtbarer Vorsprung vor allen Wettbewerbern, null Bundle-Kosten |
| 5 | **F2** Produktkarten-Hover + Merkliste-Mikrointeraktion | S–M | Zweitbild dort, wo `images[]` schon existiert. Herz und Zähler sofort. |
| 6 | **F8** Mikrointeraktionen Formulare, CTAs, Menü | S–M | Direkt auf die Conversion-Pfade, passt zu den neuen `trackLead`-Events |
| 7 | **F7** Editoriale Bild-Reveals, Platzhalter | S | Reines CSS, schnelle Wirkung |
| 8 | **F6** Baustein Scroll-Storytelling (mit Showroom-Platzhalterbildern) | M | Der Baustein lässt sich jetzt bauen. Echte Projektbilder folgen. |

Geschätzt **ca. 4–5 Entwicklerwochen** für Rang 1–8.

### 6.2 Teilweise blockiert (Inhalte/Rechte, nicht Backoffice)

| Feature | Blocker | Wer löst es |
|---|---|---|
| **F5** Video-Hero | Eigener Videodreh im Showroom, Einwilligung gefilmter Personen, Klärung, dass keine Hersteller-Kampagnenvideos verwendet werden | Inhaber/Marketing (1 Drehtag). Encoding lokal auf der NVIDIA-GPU. |
| **F6** Inhalte für Storytelling | Projektfotos mit Kunden-Einwilligung, Texte zum Ablauf CH-Lieferung/Verzollung | Team/Vertrieb |
| Hersteller-Bilder in Hero, Story oder Lightbox | Schriftliche Bildfreigaben der Marken | Inhaber (läuft parallel zu den Listungsgesprächen) |

### 6.3 Blockiert durch das Backoffice (Frappe, kein Schreibzugang)

| Feature | Benötigtes Feld/Endpunkt |
|---|---|
| F2 vollständig (Zweitbild für alle 1.765 Produkte) | Galerie-Bilder in der Listen-API (`/api/method/platzhirsch…`) oder zumindest ein Feld `hover_image`. Prüfen, ob es heute schon mitkommt. |
| F4 vollständig (5–10 Bilder pro Produkt) | Galerie-Feld pro Produkt (ggf. vorhanden, aber dünn befüllt) |
| F7 Dominanzfarb-Platzhalter für Backoffice-Bilder | Feld `dominant_color` oder `blurhash` pro Bild (alternativ zur Build-Zeit berechnen, das kostet aber Build-Zeit bei 1.765 Produkten) |
| F10 Shop-the-Room | Hotspot-Koordinaten je Raumbild (bis dahin JSON im Code) |
| Animierte Ausstellungsstück-/Verfügbarkeits-Badges | Ausstellungs-Flag und Lieferzeit (SEO-Plan Sprint 2–3) |

**Empfohlener Start diese Woche:** F1 + F9 (zusammen ~3 Tage), danach F4 → F3 als zusammenhängender Produktseiten-Sprint. Parallel organisiert der Inhaber einen Drehtag im Showroom für F5.

---

### Quellen
- Next.js 16.3.4 Doku lokal: `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`, `.../03-api-reference/02-components/link.md` (`transitionTypes`)
- Versionen und Lizenzen: `npm view` am 26.10.2026; Größen: bundlephobia.com API am 26.10.2026
- GSAP-Lizenz: [Webflow: GSAP becomes free](https://webflow.com/blog/gsap-becomes-free), [GSAP Standard License](https://gsap.com/community/standard-license/), [Lizenztext (ScanCode LicenseDB)](https://scancode-licensedb.aboutcode.org/gsap-standard-no-charge-2025.html)
- Wettbewerber-Quelltexte (HTTP-Abruf 26.10.2026): hoettges.at, fretz.de, gamma.ch, teojakob.ch, hutle.com, minotti.com, poliform.it, conranshop.co.uk, connox.at. Nicht abrufbar: rh.com, ambientedirect.com (Inhalt nicht auswertbar), reiter.de (403).
