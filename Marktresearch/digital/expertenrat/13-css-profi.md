# 13 – Expertenrat: CSS-Profi (modernes CSS 2026)

**Rolle:** CSS-Spezialist · **Stand:** 26.10.2026 · **Bezug:** `digital/01`, `02`, `12`, `13`, `14`, `23-masterkonzept.md` (Abschnitt 4), Code in `src/app/globals.css`, `src/components/Preview/{galerie,buehne}/*.module.css`, `package.json`
**Kurzfassung:** Gegen Höttges, reiter, Dolce Vita, Fretz und Gamma gewinnt der Neuauftritt nicht mit mehr Effekten, sondern damit, dass die Plattform-CSS die Arbeit macht. Bisher wird das dort mit jQuery, Swiper, GSAP und AOS gelöst (siehe `digital/13`, Tabelle Wettbewerb). Das Ergebnis ist eine Website, die wie ein Editorial wirkt und trotzdem ohne zusätzliches JS auskommt. Sie hält LCP ≤ 2,0 s, INP ≤ 150 ms und CLS ≤ 0,05.

---

## 0. Ausgangslage im Code (geprüft)

| Befund | Stelle | Bewertung |
|---|---|---|
| `browserslist.production`: `chrome >= 90`, `safari >= 15`, `ios >= 15`, `firefox >= 90` | `package.json` | **Widerspruch.** Laut eigener Doku (`node_modules/next/dist/docs/03-architecture/supported-browsers.md`, `upgrading/version-16.md`) unterstützt Next.js 16 nur **Chrome/Edge 111+, Firefox 111+ und Safari 16.4+**. Tailwind 4 setzt **Chrome 111, Safari 16.4 und Firefox 128** voraus ([Tailwind Compatibility](https://tailwindcss.com/docs/compatibility)). Safari 15 bekommt schon heute keine funktionierende Seite: `@layer`, `@property` und `color-mix()` in den Tailwind-Utilities greifen dort nicht vollständig. Die browserslist-Angabe verspricht also eine Unterstützung, die es nicht gibt. |
| Tokens im `@theme` als Hex (`--color-gold #d1b250`, `--color-ink #30373e` …), Gold 2,05:1 auf Weiß | `globals.css` Z. 12–23 | Gute Basis. Laut `digital/01` sind aber noch rund 290 Hex-Literale pro Farbe im Code verstreut, die Token-Disziplin ist also schwach. |
| `.reveal` per `animation-timeline: view()` in `@supports`, nur `transform`, `prefers-reduced-motion` | `globals.css` Z. 85–97 | Richtig gebaut und das Muster für alles Weitere |
| Fokusring `#d1b250` auf Weiß | `globals.css` Z. 128–131 | 1,94:1 auf `paper`. **Verstößt gegen WCAG 2.4.13 / 1.4.11** (`digital/13`) |
| Prototyp „Galerie“: eigene Tokens auf `.root`, `clamp()`-Typo-Skala, `text-wrap: balance/pretty`, `100svh`, Popover-Menü mit `@starting-style`, Reveals mit `@supports (animation-timeline)`, Reduced Motion | `galerie.module.css` | Modern und sauber. Es fehlen Container Queries, `@layer`, OKLCH, Subgrid und View Transitions. Gezählt sind **171 `px`-Werte**, die Abstände sind also nicht fluid. Das Ausblenden der Live-Shell über `body:has([data-galerie]) > div.fixed.inset-x-0.bottom-0` hängt an Utility-Klassen und bricht bei der nächsten Klassenänderung. |
| Prototyp „Bühne“: `clamp()` fast durchgehend in `rem`, 4× `@supports (animation-timeline)`, Reduced Motion, Lenis nur bei `pointer: fine` | `buehne.module.css`, `SmoothScroll.js` | Bei Typo und Fluidität stark. Lenis widerspricht `digital/02` (dort ausdrücklich „bewusst nicht“) und belastet das INP. Container Queries, `@layer` und OKLCH fehlen. |
| Prototyp „Dreiländereck“ | `src/components/Preview/dreilaendereck/` (nur `content.js`, `data.js`, `fonts.js`, `Logo.js`), keine Route | Noch nicht bewertbar |

---

## 1. Die wichtigsten Erkenntnisse für dieses Projekt

1. **Die Browser-Basis ist faktisch „Baseline 2023“, die Konfiguration muss das ehrlich sagen.** Next 16 und Tailwind 4 setzen gemeinsam **Chrome/Edge 111, Safari 16.4 und Firefox 128** voraus (Quellen siehe 0). Damit sind ohne Fallback nutzbar: Cascade Layers, `:has()`, Container Size Queries, `oklch()`, `color-mix()`, `@property`, Subgrid, `clamp()`, logische Eigenschaften, `svh/dvh` und Nesting. Nur als Progressive Enhancement gehören dazu: Scroll-driven Animations, View Transitions, `text-wrap: pretty`, `@starting-style`, Anchor Positioning, `interpolate-size` und `field-sizing`. [Tailwind Compatibility](https://tailwindcss.com/docs/compatibility), [MDN Baseline](https://developer.mozilla.org/en-US/docs/Glossary/Baseline/Compatibility)

2. **Scroll-driven Animations laufen inzwischen in Chrome/Edge (seit 115) und Safari 26, in Firefox stable sind sie noch hinter einem Flag.** Damit erreicht man rund 90 % der DACH-Zielgruppe ohne JS und ohne Arbeit auf dem Main-Thread. Firefox zeigt den Inhalt einfach statisch, was für die Seite unkritisch ist. Das trägt die Linie aus `digital/02`: kein GSAP-ScrollTrigger und keine Lenis-Scrub-Effekte. Quellen: [Chrome for Developers: Scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations), [Mozilla Connect zum Flag-Status](https://connect.mozilla.org/t5/ideas/implement-css-scroll-driven-animations-animation-timeline/idc-p/119842), [buildmvpfast (2026, Sekundärquelle)](https://www.buildmvpfast.com/blog/css-scroll-driven-animations-replace-js-2026)

3. **Same-document View Transitions sind seit Firefox 144 (Oktober 2025) „Baseline newly available“, also auch in Chrome 125+ und Safari 18+.** Reacts `<ViewTransition>` im App Router baut darauf auf. Der Morph von der Katalog-Karte zum Produktbild funktioniert damit in allen drei Engines, und das ohne zusätzliche Bibliothek. [web.dev, 16.10.2025](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available), Next-Doku `01-app/02-guides/view-transitions.md`

4. **OKLCH ist der richtige Farbraum für eine Materialpalette.** Er ist wahrnehmungsgleich: Gleiche L-Werte wirken gleich hell. Hover-, Linien- und Flächenvarianten lassen sich mit `color-mix(in oklch, …)` oder Relative Color Syntax aus **einem** Token ableiten, statt 290 Hex-Literale zu pflegen. Das Hausgold `#d1b250` liegt bei `oklch(77.2% 0.122 91.7)`, das kontrastsichere `#7a5f17` bei `oklch(50% 0.093 86.8)`. Für den Kontrast zählt die L-Achse: Ab rund L ≤ 52 % ist auf `paper` AA für kleinen Text erreicht (eigene Messung: 5,69:1). [Evil Martians: OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl), [CSS Color 4 (W3C)](https://www.w3.org/TR/css-color-4/#ok-lab)

5. **Container Queries statt Viewport-Breakpoints für Bausteine.** Eine Produktkarte steht im Katalog (4 Spalten), in „Ähnliche Produkte“ (Slider), im Merkzettel (Liste) und auf der Markenseite (Hero-Feature). Mit `@container` reagiert sie auf ihren Platz und nicht auf den Bildschirm. Laut `digital/01` steht dieselbe Karte heute in sieben Varianten im Code. Tailwind 4 bringt `@container` und `@sm:`/`@lg:` ohne Plugin mit. [MDN: Container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries), [Tailwind: Container queries](https://tailwindcss.com/docs/responsive-design#container-queries)

6. **Fluid Typography mit `clamp()` nur in `rem`-Kombination, sonst ist WCAG 1.4.4 gefährdet.** Reines `vw` in `clamp(…, 6vw, …)` skaliert beim Browser-Zoom nicht mit. Die Formel `clamp(min-rem, calc(a-rem + b-vw), max-rem)` mit `max ≤ 2,5 × min` hält 200 % Zoom stand. Der Prototyp „Galerie“ (`clamp(48px, 8.4vw, 132px)`) ist davon betroffen. [Adrian Roselli: Responsive Type and Zoom](https://adrianroselli.com/2019/12/responsive-type-and-zoom.html), [Utopia.fyi](https://utopia.fyi/type/calculator/)

7. **Cascade Layers sind die einzige saubere Antwort auf die Mischung aus Tailwind-Utilities, Modul-CSS und Fremd-CSS** (slick-theme, Embla, Lenis, Consent-Banner). Tailwind 4 legt `theme`, `base`, `components` und `utilities` selbst als `@layer` an. Eigenes CSS ohne Layer steht automatisch über **allen** Layern. Deshalb gewinnt heute das `!important` im Prototyp. Eine Layer-Ordnung beendet die Spezifitätskriege. [MDN: @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer), [Tailwind v4: Adding custom styles](https://tailwindcss.com/docs/adding-custom-styles)

8. **`text-wrap: balance` für Headlines und `pretty` für Fließtext sind risikolose Typo-Gewinne.** Bei deutschen Komposita wie „Designermöbel-Ausstellung“ verhindert `balance` einzelne Wörter in der letzten Zeile. `pretty` vermeidet Hurenkinder im Absatz. Ohne Support bricht der Text normal um, ein Fallback ist nicht nötig. Dazu kommt `hyphens: auto` mit korrektem `lang` (de, en, fr, it), das für schmale Mobil-Spalten im Deutschen Pflicht ist. [Chrome: CSS text-wrap: balance](https://developer.chrome.com/docs/css-ui/css-text-wrap-balance), [WebKit: Better typography with text-wrap pretty](https://webkit.org/blog/16547/better-typography-with-text-wrap-pretty/)

9. **`@property` macht Tokens animierbar und typsicher.** Ein registriertes `--reveal-progress: <number>` oder `--hairline: <length-percentage>` lässt sich per Transition oder Scroll-Timeline animieren, etwa für die Goldlinie, die unter einer Headline wächst, oder einen Verlauf über einem Foto. Normale Custom Properties springen nur. Baseline seit Juli 2024 mit Firefox 128. [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property), [web.dev: @property Baseline](https://web.dev/blog/at-property-baseline)

10. **Ohne Barrierefreiheit kein Premium.** `prefers-reduced-motion`, `prefers-contrast`, `forced-colors` und `:focus-visible` mit 3:1 werden mit dem Shop ab dem BaFG/BFSG (seit 28.06.2025, `digital/14` F10) faktisch Pflicht. In CSS ist das billig, nachträglich teuer. [W3C WCAG 2.2, 2.4.13 Focus Appearance](https://www.w3.org/TR/WCAG22/#focus-appearance), [MDN: forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)

---

## 2. Konkrete Vorgaben für den Neuauftritt (messbar, umsetzbar)

### 2.1 Browser-Ziel und Build

- **V1 – browserslist korrigieren** (Änderung in `package.json` erst nach Freigabe, `src/` bleibt unberührt):
  ```json
  "production": ["chrome >= 111", "edge >= 111", "firefox >= 128", "safari >= 16.4", "ios_saf >= 16.4", "and_chr >= 111"]
  ```
  Begründung: Diese Werte decken sich mit Next 16 und Tailwind 4. Ältere Browser bekommen ohnehin keine korrekte Seite. Die Liste ist eine ehrliche Dokumentation und keine neue Einschränkung.
- **V2 – Fallback-Klassen:** Jedes Feature aus der Liste „Progressive Enhancement“ (1.1) steht **in einem `@supports`-Block oder ist von sich aus ignorierbar** (`text-wrap`, `view-transition-name`). Die Regel dafür: Ohne das Feature ist der Inhalt **sichtbar, lesbar und bedienbar**. Prüfung: Die Seite in Firefox stable sowie in Safari 16.4 (BrowserStack) durchklicken.
- **V3 – Kein CSS-in-JS, keine Runtime-Styles.** Tailwind-Utilities plus maximal ein CSS-Modul je Komponente. Budget: **CSS ≤ 35 kB gzip pro Seite** (Tailwind 4 liegt typisch bei 10–20 kB), kritisches CSS inline durch Next.

### 2.2 Cascade Layers (Reihenfolge verbindlich)

```css
/* globals.css – ganz oben, vor @import "tailwindcss" */
@layer reset, vendor, theme, base, components, brand, utilities, overrides;
@import "tailwindcss";
@import "embla.css" layer(vendor);      /* Embla, ggf. Consent-Banner */
```
- `vendor`: Fremd-CSS, darf nie gewinnen.
- `components`: Bausteine (`.card`, `.overline`, `.hairline`, `.btn`).
- `brand`: Markenwelten (Minotti-, Poliform-Seite) und Prototyp-Themes.
- `utilities`: Tailwind gewinnt immer gegen Bausteine, damit `mt-8` auf einer Karte wirkt.
- `overrides`: nur für Fokus, `forced-colors` und Druck.
- **Regel:** **0× `!important`** außerhalb von `overrides` und Reduced Motion. Messung: `grep -c "!important"` pro Datei.
- CSS-Module der Prototypen (`.root`) gehören beim Übernehmen in `@layer brand`.

### 2.3 Tokens in `@theme` (Tailwind 4), OKLCH mit Hex-Herkunft

```css
@theme {
  /* Fläche */
  --color-paper:  oklch(98% 0.006 85);    /* #faf8f4 – Standard-Hintergrund */
  --color-bone:   oklch(97.1% 0.006 85);  /* #f7f5f1 */
  --color-stone:  oklch(93.2% 0.010 82);  /* #ece8e1 – ruhige Bänder */
  --color-walnut: oklch(32.6% 0.025 51);  /* #3f3129 – ein dunkler Abschnitt/Seite */
  --color-night:  oklch(16% 0.003 68);    /* #0e0d0c – Bühne/Lightbox */
  /* Text */
  --color-ink:      oklch(33.3% 0.016 248); /* #30373e – 11,4:1 auf paper */
  --color-ink-soft: oklch(43.8% 0.014 72);  /* #57514a – 7,0:1 */
  /* Akzent */
  --color-gold:      oklch(77.2% 0.122 92); /* #d1b250 – NUR auf dunkel (6,1:1 auf walnut) oder als Fläche ≥ 3:1-Grenze */
  --color-gold-text: oklch(50% 0.093 87);   /* #7a5f17 – 5,7:1 auf paper, 4,95:1 auf stone */
  /* Linien aus einem Token abgeleitet */
  --color-line:   color-mix(in oklch, var(--color-ink) 14%, transparent);
  --color-line-strong: color-mix(in oklch, var(--color-ink) 28%, transparent);

  /* Schrift */
  --font-display: var(--font-bodoni), "Bodoni Moda", Didot, Georgia, serif;
  --font-sans: var(--font-montserrat), "Montserrat", Helvetica, Arial, sans-serif;

  /* Fluide Typo-Skala (Utopia, 360→1440 px, Basis 17→19 px, Ratio 1.2→1.333) */
  --text-step--1: clamp(0.88rem, 0.86rem + 0.10vw, 0.94rem);
  --text-step-0:  clamp(1.06rem, 1.02rem + 0.19vw, 1.19rem);
  --text-step-1:  clamp(1.28rem, 1.18rem + 0.42vw, 1.58rem);
  --text-step-2:  clamp(1.53rem, 1.36rem + 0.76vw, 2.11rem);
  --text-step-3:  clamp(1.84rem, 1.54rem + 1.30vw, 2.81rem);
  --text-step-4:  clamp(2.20rem, 1.72rem + 2.10vw, 3.75rem);
  --text-step-5:  clamp(2.64rem, 1.88rem + 3.30vw, 5.00rem); /* Hero, max ≈ 1,9 × min → zoomfest */

  /* Fluide Abstände */
  --spacing-section: clamp(4rem, 2.9rem + 4.9vw, 9rem);    /* 64 → 144 px */
  --spacing-gutter:  clamp(1rem, 0.5rem + 2.2vw, 2.5rem);  /* 16 → 40 px; Mobil = 16 px */

  /* Motion (aus digital/02, 3.2) */
  --ease-quiet: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-quiet-inout: cubic-bezier(0.65, 0, 0.35, 1);
  --duration-micro: 160ms; --duration-ui: 280ms; --duration-enter: 600ms;
  --duration-morph: 450ms; --duration-slow: 1600ms;

  /* Formen: Atelier statt SaaS (digital/01: 136× rounded-*) */
  --radius-*: initial;          /* Tailwind-Radien zurücksetzen */
  --radius-hair: 2px;           /* einzig erlaubter Radius für Buttons/Inputs */
  --shadow-*: initial;          /* keine Schatten-Utilities; Tiefe über Fläche und Linie */
}
```
**Messbare Regeln:**
- **0 Hex-Literale** in `src/components/**` und in neuem Code (Lint-Regel, z. B. `stylelint color-no-hex` für CSS und ein Grep-Check auf `\[#` in JSX im CI).
- Jede Text-/Flächenkombination ist in einer Kontrast-Tabelle im Styleguide dokumentiert: Text **≥ 4,5:1**, große Schrift (≥ 24 px bzw. 18,66 px fett) und UI-Grenzen **≥ 3:1**.
- `--color-gold` erscheint **nie** als Textfarbe auf `paper`, `bone` oder `stone` (1,94:1).
- Die Hex-Werte bleiben als Kommentar stehen, damit Druck, Logo und Beschilderung dieselben Farben nutzen. sRGB-Gamut wird nicht verlassen: Chroma ≤ 0,13, damit kein P3-Clipping die Gold-Varianten verschiebt.

### 2.4 Fokus, Kontrast, Systemeinstellungen

```css
@layer overrides {
  :where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
    outline: 2px solid var(--color-gold-text);  /* 5,7:1 auf paper */
    outline-offset: 3px;
  }
  .surface-dark :focus-visible { outline-color: var(--color-gold); } /* 6,1:1 auf walnut */
  @media (forced-colors: active) {
    :focus-visible { outline-color: Highlight; }
    .btn { border: 1px solid ButtonText; }
  }
  @media (prefers-contrast: more) {
    :root { --color-line: color-mix(in oklch, var(--color-ink) 45%, transparent); }
  }
}
```
- Zielgröße für Bedienelemente: **≥ 44 × 44 px** (WCAG 2.5.8 verlangt 24 px; 44 px ist die Komfortgrenze), umsetzbar über `min-block-size: 2.75rem` oder `::after`-Hitbox.
- `scroll-padding-top` ist an die Header-Höhe gekoppelt (`--header` als Token statt der heutigen 6rem/12rem-Brüche).

### 2.5 Layout: Container Queries, Subgrid, logische Eigenschaften

- **Jeder wiederverwendbare Baustein** (Produktkarte, Markenkachel, Projekt-Teaser, Zitat, Termin-CTA) hat `container-type: inline-size` auf seinem Wrapper und **keine** Viewport-Media-Queries im Inneren. Viewport-Queries sind nur für Seitenlayout und Header erlaubt.
  ```css
  .card-wrap { container: card / inline-size; }
  @container card (inline-size >= 26rem) { .card { grid-template-columns: 3fr 2fr; } }  /* Hero-Variante */
  @container card (inline-size < 15rem)  { .card__meta { display: none; } }          /* Merkzettel-Liste */
  ```
  In Tailwind: `@container` am Wrapper, `@md:grid-cols-[3fr_2fr]` an der Karte.
- **Subgrid für Katalog- und Markenraster:** Karten in einer Reihe richten Bild, Marke, Titel, Maß und Preis/„Preis auf Anfrage“ an **denselben Linien** aus, auch wenn ein Titel zweizeilig ist. Das sieht nach Katalog-Druck aus, während die Konkurrenz mit Swiper-Karten unterschiedlicher Höhe arbeitet.
  ```css
  .catalog { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr)); gap: 3rem var(--spacing-gutter); }
  .card { display: grid; grid-row: span 5; grid-template-rows: subgrid; row-gap: 0.5rem; }
  ```
- **Editorial-Raster:** 12 Spalten mit benannten Linien `[full-start] [content-start] … [content-end] [full-end]`, Inhalt maximal **72rem**, Fließtext maximal **66ch** (`max-inline-size: 66ch`). Bilder können über `grid-column: full` randlos laufen.
- **Logische Eigenschaften** überall: `margin-inline`, `padding-block`, `inset-inline-end`, `inline-size`, `block-size`, `border-block-end`. Physische `left`/`right`/`width` sind in neuem Code verboten (Lint). Das kostet nichts und macht später eine RTL- oder vertikale Typo-Variante möglich, etwa für ein japanisches Zitat auf einer Designer-Seite.
- **Viewport-Höhen:** Für Heros `min-block-size: 100svh` (nie `100vh`, das springt in iOS Safari), `dvh` nur für Overlays und Lightbox.
- **Feste Seitenverhältnisse** für jedes Medium (`aspect-ratio: 4/5` Produkt, `3/2` Projekt, `16/9` Video): CLS ≤ 0,05.

### 2.6 `:has()` – Zustand ohne JS

Erlaubte Einsätze (konkret für diese Website):
- `.card:has(img + img):hover` → Zweitbild-Crossfade nur, wenn es ein Zweitbild gibt (`digital/02` F1).
- `.field:has(:user-invalid)` → Fehlerzustand mit Rahmen und Text **erst nach der Eingabe** (`:user-invalid`, Baseline 2023), keine roten Felder beim Laden.
- `form:has(input[name="projektart"][value="kueche"]:checked) .kueche-felder { display: grid; }` → im Beratungsformular erscheinen Küchenfelder, ohne dass der Schritt automatisch weiterspringt (heute ein WCAG-3.2.2-Problem, `digital/13`).
- `html:has(dialog[open], [popover]:popover-open) { overflow: clip; }` → Scroll-Lock für Lightbox und Menü ohne JS-Klasse.
- `.filters:has(input:checked) .filters__reset { visibility: visible; }`

**Verboten:** `:has()` auf `body` mit Utility-Klassen-Ketten wie heute im Galerie-Prototyp (`body:has([data-galerie]) > div.fixed.inset-x-0.bottom-0`). Stattdessen setzt das Layout Daten-Attribute (`data-shell="preview"`). Außerdem kein `:has()` mit Selektoren, die tiefer als zwei Ebenen in großen Listen suchen (Performance bei 1.765 Produkten im DOM).

### 2.7 Motion in CSS

- **Scroll-driven:** ausschließlich `transform`, `opacity` (nicht auf Text unter dem Fold, siehe `.reveal`-Kommentar), `clip-path` und `filter` sparsam; immer in `@supports (animation-timeline: view())` **und** `@media (prefers-reduced-motion: no-preference)`.
  ```css
  @media (prefers-reduced-motion: no-preference) {
    @supports (animation-timeline: view()) {
      .mask-reveal { animation: mask linear both; animation-timeline: view(); animation-range: entry 10% cover 35%; }
      @keyframes mask { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0); } }
    }
  }
  ```
  Bei der Maske ist das Bild vorher **sichtbar** (der Fallback ist kein Clip). Nie auf dem LCP-Bild.
- **View Transitions:** `<ViewTransition>` aus React; CSS-Seite:
  ```css
  ::view-transition { pointer-events: none; }
  ::view-transition-group(*) { animation-duration: var(--duration-morph); animation-timing-function: var(--ease-quiet-inout); }
  ::view-transition-old(root) { animation-duration: 150ms; }
  ::view-transition-new(root) { animation-duration: 250ms; }
  @media (prefers-reduced-motion: reduce) { ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; } }
  ```
  `view-transition-name` nur auf **max. 1 geteiltes Element + Header** pro Navigation (ein Name pro Produkt-Slug, keine Namen auf 48 Karten gleichzeitig).
- **`@starting-style` + `transition-behavior: allow-discrete`** für Popover, Dialog und Toasts (Galerie macht es richtig). Ohne Support erscheinen die Elemente sofort.
- **`@property`** nur für 2–4 registrierte Werte: `--hairline-scale <number>`, `--veil <percentage>` (Bildverlauf), `--progress <number>`; alle mit `inherits: false`.
- Zeiten aus Tokens, **keine Literal-ms** in Komponenten. Hover ≤ 160 ms, UI 280 ms, Eintritt 600 ms, Austritt 150–200 ms.
- **Kein Lenis im Produktivauftritt** (gegen den Bühne-Prototyp, im Einklang mit `digital/02`). `scroll-behavior: smooth` nur unter `prefers-reduced-motion: no-preference` und nur für Anker.

### 2.8 Typografie

- `h1–h3, .display { text-wrap: balance; }` (Chrome/Safari/Firefox stabil) · `p, li, figcaption { text-wrap: pretty; }`.
- `:lang(de) p { hyphens: auto; hyphenate-limit-chars: 7 3 3; }` – nur im Fließtext, nie in Headlines oder Markennamen (`.brand { hyphens: manual; }`).
- `font-variant-numeric: tabular-nums lining-nums` für Maße, Preise und Öffnungszeiten (`digital/01`). `font-feature-settings` nur dort, wo `font-variant-*` es nicht kann.
- Bodoni Moda: Display erst ab **≥ 1,75rem** (die feinen Haarlinien brechen darunter auf Windows ohne Hinting). Für Text bleibt Montserrat oder die künftige Grotesk.
- **Zeilenlänge 55–75 Zeichen** (`max-inline-size: 66ch`), Zeilenhöhe 1,6 für Text und 1,05–1,15 für Display.
- `text-box: trim-both cap alphabetic` als Enhancement für optisch exakte Abstände bei Overlines und Buttons (Chrome 133+, Safari 18.2+). Ohne Support bleibt der alte Weißraum.
- Fluid nur mit `rem + vw` (siehe Skala 2.3). Prüfung: 200 % Browser-Zoom auf 1280 px ohne Überlappung oder horizontalen Scroll (WCAG 1.4.4/1.4.10).

### 2.9 Prüfbare Leistungswerte (aus `digital/02` und `13`)

| Wert | Ziel |
|---|---|
| LCP mobil (p75) | ≤ 2,0 s |
| INP (p75) | ≤ 150 ms |
| CLS | ≤ 0,05 |
| CSS gzip je Seite | ≤ 35 kB |
| Selektor-Spezifität | max. (0,2,1) außerhalb `overrides`, keine IDs |
| `!important` | 0 außer `overrides`/Reduced Motion |
| Hex-Literale in Komponenten | 0 |
| `will-change` dauerhaft | 0 (nur per `:hover`/Animation zeitweise) |

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen

1. **Ein „Material-Theme“ pro Marke mit einer einzigen Variable.** Jede Markenseite setzt `--brand-hue` und `--brand-chroma`, und die Seite leitet daraus Flächen und Linien ab. Bei Minotti sind das warme Bronze und Grau, bei Rimadesio kühles Glas, bei Paola Lenti gedeckte Farben. Beispiele: `--surface: oklch(96% calc(var(--brand-chroma) * .2) var(--brand-hue))`, Linien per `color-mix(in oklch, …)`. Das ergibt **eine** Komponente und viele Markenwelten. Höttges und reiter zeigen dagegen jede Marke im selben Template (`digital/01`: „Keine Markenwelt“).

2. **„Stoffmuster-Wechsel“ mit `@property` und View Transitions.** Wer auf einer Sofa-Seite Bezug oder Farbe wählt, sieht das Bild per `document.startViewTransition` überblenden, und `--veil` legt kurz einen Materialschimmer darüber. Das sind 0 kB Bibliothek. Kein Wettbewerber in der Region hat einen Variantenwechsel mit Übergang.

3. **Katalog wie ein gedrucktes Lookbook.** Durch Subgrid stehen Bild, Marke, Titel, Maß und Preis auf derselben Grundlinie, dazu `text-wrap: balance` und Tabellenziffern. Das wirkt wie ein gesetzter Minotti-Katalog, Fretz und Gamma zeigen springende Swiper-Karten.

4. **Scroll-Kapitel „Vom Steinblock zur Küche“ für die Binni-Küchenlinie.** Mit `animation-timeline: view()` legt eine `clip-path`-Maske beim Scrollen das Steinbild frei: Rohblock → Platte → Kante → Küche, in vier Bildern ohne Video und ohne JS. Ein sticky Kapitelmarker in der Seitenleiste zeigt den Fortschritt über `scroll()`. Mit Reduced Motion erscheinen die vier Bilder untereinander. Das erzählt Handwerk und Leistbarkeit (`12-content-storytelling`) schneller als jeder Imagefilm.

5. **Dreiländer-Umschalter ohne Seitenwechsel.** Der Wechsel € und CHF sowie AT, DE, CH und FL läuft über ein `:has(input[value=chf]:checked)`, das Preis- und Hinweiszeilen umschaltet, etwa „CHF inkl. 8,1 % MWST, verzollt“ (Masterkonzept 4.2, Alleinstellung 5). Er ist sofort ohne Hydration bedienbar, und das Ergebnis wird serverseitig gespeichert. Keine Platzhalter-Preise und keine versteckten Kosten: Alle Zuschläge stehen in derselben Zeile.

6. **Café-Öffnungszeiten als lebender Akzent.** Ein serverseitig gerendertes Attribut `data-open="true"` färbt über `:has()` eine feine Linie im Header und zeigt „Café jetzt geöffnet · bis 18:00“. Das ist eine echte Information und keine Knappheitsbotschaft. Es macht die Alleinstellung „Gastgeberort“ (4.2, #1) täglich sichtbar.

7. **Container-Query-Karten, die überall perfekt sitzen.** Dieselbe Projektkarte füllt im Ratgeber die halbe Breite, steht in der Seitenleiste als Mini-Karte und auf der Startseite als großes Feature, ohne zusätzliche Komponente. Die Wettbewerber haben dafür drei Templates und sehen auf Tablets kaputt aus (reiter CLS 0,501).

8. **Echte Seitenübergänge, schneller als die Konkurrenz ohne Übergang.** Beim Wechsel vom Katalog zum Produkt gleitet das Bild an seinen Platz (450 ms), der Header bleibt stehen. In der Region macht das niemand (`digital/02`, Fazit regional). Weil es nativ ist, bleibt die Seite bei LCP ≤ 2 s, während Fretz 19,8 s braucht.

9. **Dunkelmodus als „Abendausstellung“.** `prefers-color-scheme: dark` und ein Schalter `[data-theme]` stellen die Walnut- und Night-Palette mit Gold als Akzent dar. Er ist nicht invertiert, sondern als Abendlicht im Showroom gestaltet, mit `light-dark()` für einzelne Tokens. Für Architekten, die abends am iPad recherchieren, ist das ein Komfortgewinn. Keiner der Wettbewerber bietet ihn.

10. **Druck-Stylesheet für Merkliste und Angebot.** `@media print` liefert einen sauberen A4-Ausdruck mit Logo, Produktbildern, Maßen, Preisen, QR-Code zur Online-Merkliste und Showroom-Adresse, mit `break-inside: avoid` pro Produkt. Bauherren drucken Auswahllisten für das Gespräch mit Partner oder Architekt aus. Das ist ein kleines Detail mit Luxus-Wirkung.

---

## 4. Was man auf keinen Fall tun darf

1. **Kein Inhalt mit `opacity: 0` als Ausgangszustand**, der erst über JS oder eine nicht unterstützte Timeline sichtbar wird. Ohne Support bliebe die Seite in Firefox leer, und Lighthouse meldet Kontrastfehler (das Problem des heutigen `FadeInView`).
2. **Kein Scroll-Hijacking und kein Smooth-Scroll-JS** (Lenis, Locomotive) im Produktivauftritt. Keine `scroll-snap: mandatory` auf langen Seiten. Kein horizontales Scrollen, das das vertikale Scrollen ersetzt.
3. **Keine Animation von `width`, `height`, `top`, `left`, `margin` oder `font-size`.** Kein `transition: all`. Kein dauerhaftes `will-change`.
4. **Kein reines `vw` in Schriftgrößen**, kein `max` > 2,5 × `min` in `clamp()`, keine Schrift unter **16 px** für Fließtext und keine unter **14 px** überhaupt.
5. **Kein Gold `#d1b250` als Text auf hellem Grund**, keine Platzhalter als Ersatz für Labels, kein `outline: none` ohne gleichwertigen Ersatz.
6. **Kein `!important` als Konfliktlösung**, keine Overrides per Utility-Klassen-Ketten (`div.fixed.inset-x-0`), keine IDs in Selektoren.
7. **Keine Dark Patterns über CSS:** Kein „Ablehnen“ im Consent-Banner in Grau mit 2:1 neben einem goldenen „Akzeptieren“. Beide Knöpfe brauchen gleiche Größe, gleichen Kontrast und gleiches Gewicht (`digital/14`; DSA Art. 25; EDPB-Leitlinien 03/2022 zu Deceptive Design Patterns). Keine per CSS versteckten Kosten- oder Widerrufshinweise (`display:none`, Mini-Schrift, Kontrast < 4,5:1). Keine pulsierenden „Nur noch 2 da“-Badges oder Countdown-Animationen.
8. **Keine Markenbehauptungen über Gestaltung:** Herstellerlogos nicht in „offizieller Händler“-Siegel-Optik setzen (Masterkonzept Widerspruch 1: Formulierung „Minotti-Ausstellung in Lochau“).
9. **Keine `100vh`-Heros auf Mobilgeräten**, keine Medien ohne `aspect-ratio` und keine Webfont ohne `size-adjust`-Fallback (`next/font` `adjustFontFallback`).
10. **Keine neuen CSS-Frameworks oder UI-Kits** (Bootstrap, DaisyUI, slick-theme). Kein zweites Farbsystem neben `@theme`. Keine Features ohne `@supports`-Fallback, die nur in Chrome laufen (Anchor Positioning, `scroll-state()`-Queries, `interpolate-size`), für Kernfunktionen wie Menü, Filter oder Formular.

---

## 5. Prüf-Checkliste für die drei Prototypen

**Skala je Kriterium:** 0 = fehlt / falsch · 1 = ansatzweise · 2 = solide · 3 = vorbildlich (übernehmbar). **Gewicht** in Klammern; Höchstwert = Summe (Gewicht × 3).

| # | Kriterium | Prüfmethode | Gewicht |
|---|---|---|---|
| 1 | **Browser-Fallback:** Seite in Firefox stable und Safari 16.4 vollständig sichtbar und bedienbar, kein leerer Bereich | BrowserStack bzw. Firefox mit `layout.css.scroll-driven-animations.enabled=false` | ×3 |
| 2 | **Reduced Motion:** Mit `prefers-reduced-motion: reduce` gibt es keine Bewegung, kein Smooth Scroll und keine View-Transition-Animation, Rückmeldungen ≤ 150 ms bleiben | DevTools → Rendering → Emulate | ×3 |
| 3 | **Kontrast und Fokus:** Text ≥ 4,5:1, Fokusring ≥ 3:1 und auf jedem interaktiven Element sichtbar, Gold nie als kleiner Text auf hellem Grund | axe DevTools + Tab-Durchlauf | ×3 |
| 4 | **Zoom und Reflow:** 200 % Zoom bei 1280 px und 320 px Breite ohne horizontalen Scroll, ohne Überlappung, ohne abgeschnittenen Text | Browser-Zoom, Viewport 320 px | ×2 |
| 5 | **Tokens:** Alle Farben, Abstände und Zeiten kommen aus Variablen, 0 Hex-Literale außerhalb der Token-Definition, Farben in OKLCH mit Hex-Kommentar | `grep -nE "#[0-9a-fA-F]{3,6}"` im Modul | ×2 |
| 6 | **Fluide Typo:** `clamp()` in `rem + vw`, max/min ≤ 2,5, Skala mit ≤ 7 Stufen, `text-wrap: balance/pretty`, `hyphens` im Fließtext | Code-Review + Vergleich 360/1440 px | ×2 |
| 7 | **Container Queries:** Karten und Teaser reagieren auf ihren Container, keine Viewport-Queries in Bausteinen | Code-Review; Karte in schmale und breite Spalte setzen | ×2 |
| 8 | **Raster und Subgrid:** Kartenreihen auf gemeinsamer Grundlinie, Fließtext ≤ 66ch, randlose Bilder über benannte Linien | Overlay-Grid in DevTools | ×1 |
| 9 | **Cascade Layers und Spezifität:** Eigenes CSS in Layern, 0 `!important` (außer Overrides/Reduced Motion), keine Utility-Klassen-Ketten oder IDs als Selektor | `grep -c "!important"`, Selektor-Review | ×2 |
| 10 | **Motion-Technik:** Nur `transform`, `opacity` und `clip-path`, Scroll-Effekte über `animation-timeline` in `@supports`, kein Lenis/GSAP, Zeiten aus Tokens | Performance-Panel: keine Long Tasks beim Scrollen | ×2 |
| 11 | **View Transitions:** Shared-Element-Morph Katalog → Produkt ≤ 450 ms, Header verankert, `pointer-events: none`, ohne Support kein Fehler | Klickpfad in Chrome, Safari 18, Firefox 144+ | ×1 |
| 12 | **Layout-Stabilität und Viewport:** `aspect-ratio` auf allen Medien, `svh` statt `vh`, CLS ≤ 0,05 | Lighthouse mobil, 3 Läufe Median | ×2 |
| 13 | **Logische Eigenschaften:** `inline`/`block` statt `left`/`right`/`width`, mindestens 90 % der Box-Eigenschaften logisch | Grep `margin-left\|padding-right\|width:` | ×1 |
| 14 | **Zustände ohne JS:** `:has()`, `:user-invalid`, Popover/Dialog mit `@starting-style`. Menü, Filter und Lightbox funktionieren vor der Hydration | JS deaktivieren, Seite bedienen | ×1 |
| 15 | **Systemeinstellungen:** `forced-colors` (Windows-Kontrastmodus) bedienbar, `prefers-contrast: more` stärkt Linien, Druckansicht der Merkliste brauchbar | Windows-Kontrastdesign, Druckvorschau | ×1 |
| 16 | **Faire Gestaltung:** Kein Dark Pattern über CSS, gleichwertige Consent-Knöpfe, Preise und Zuschläge in gleicher Größe und gleichem Kontrast | Sichtprüfung gegen Abschnitt 4.7 | ×3 |
| 17 | **CSS-Gewicht:** ≤ 35 kB gzip pro Seite, keine ungenutzten Fremd-Stylesheets | DevTools Coverage + Network | ×1 |

**Höchstwert:** Die Gewichte summieren sich auf 32, also 96 Punkte. **Bewertung:** ≥ 80 bedeutet übernehmbar · 60–79 übernehmbar nach Nacharbeit · < 60 nur als Ideenquelle.
**K.-o.-Kriterien** (unabhängig von der Summe): Kriterium 1, 2, 3 oder 16 mit 0 Punkten.

**Vorab-Einschätzung nach Code-Lektüre** (ohne Browser-Test, als Startwert für die Prüfer):
- **Galerie:** Bei 1, 2, 6 und 14 stark (Popover mit `@starting-style`, `text-wrap`, `@supports`). Schwach bei 4 und 6 (`px`/`vw`-Clamps, 171 px-Werte), bei 7, 8 und 9 (`!important`, `body:has(…div.fixed.inset-x-0…)`) und bei 5 (Hex statt OKLCH). Erwartung: rund 55–65.
- **Bühne:** Stark bei 6 (rem-Clamps), 2 und 10 (Scroll-Timelines in `@supports`). Schwach bei 10 (Lenis), 9 (`!important`, `:global(body):has(.root)`) und 7/8 (keine Container Queries oder Subgrid). Erwartung: rund 55–65.
- **Dreiländereck:** noch keine Route und kein CSS, bitte nach Fertigstellung bewerten.

Gemeinsame Nacharbeit für den Sieger: Die Tokens wandern nach `@theme` (2.3), das CSS kommt in Layer (2.2), Bausteine bekommen Container Queries und Subgrid, die Typo wird auf `rem`-Clamps umgestellt und Lenis wird entfernt.

---

### Quellen
- Tailwind CSS: [Compatibility](https://tailwindcss.com/docs/compatibility), [Theme variables (@theme)](https://tailwindcss.com/docs/theme), [Container queries](https://tailwindcss.com/docs/responsive-design#container-queries)
- Next.js 16 lokal: `node_modules/next/dist/docs/03-architecture/supported-browsers.md`, `01-app/02-guides/upgrading/version-16.md`, `01-app/02-guides/view-transitions.md`
- web.dev: [Same-document view transitions Baseline (16.10.2025)](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available), [New to the web platform in October 2025](https://web.dev/blog/web-platform-10-2025)
- Chrome for Developers: [Scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations), [text-wrap: balance](https://developer.chrome.com/docs/css-ui/css-text-wrap-balance)
- Mozilla: [Connect – Flag-Status Scroll-driven Animations](https://connect.mozilla.org/t5/ideas/implement-css-scroll-driven-animations-animation-timeline/idc-p/119842); MDN: [@layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer), [@property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property), [Container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries), [forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)
- Sekundär: [buildmvpfast – Scroll-driven animations cross-browser (2026)](https://www.buildmvpfast.com/blog/css-scroll-driven-animations-replace-js-2026)
- WebKit: [text-wrap: pretty](https://webkit.org/blog/16547/better-typography-with-text-wrap-pretty/)
- W3C: [CSS Color 4 – OKLab/OKLCH](https://www.w3.org/TR/css-color-4/#ok-lab), [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- Evil Martians: [OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) · Adrian Roselli: [Responsive Type and Zoom](https://adrianroselli.com/2019/12/responsive-type-and-zoom.html) · [Utopia Type Calculator](https://utopia.fyi/type/calculator/)
- EDPB Guidelines 03/2022 on Deceptive Design Patterns; DSA (VO 2022/2065) Art. 25
- Kontrastwerte: eigene Berechnung (WCAG-Formel, relative Luminanz) am 26.10.2026; OKLCH-Werte aus den Hex-Tokens umgerechnet (Björn-Ottosson-Matrix).
