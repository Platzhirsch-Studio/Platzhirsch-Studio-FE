# 07 – UI-Design-System „Platzhirsch Atelier“ (Tailwind 4)

Expertenrat, Rolle: UI-Designer (Design-Systeme). Stand 26.10.2026.
Grundlage: `digital/01` (Designsystem 2.0), `digital/02` (Motion-Tokens), `digital/12` (Markenstimme), `digital/13` (Budgets, WCAG 2.2), `digital/14` (Preis- und Händlerrecht), `23-masterkonzept.md` Abschnitt 4. Ist-Code: `src/app/globals.css` (`@theme` mit gold, gold-text, ink, stone, bone, walnut, night, ink-deep). Alle Kontrastwerte unten wurden mit der WCAG-Formel nachgerechnet (Node-Skript, 26.10.2026).

Prototypen-Stand beim Schreiben: `src/app/[locale]/preview/` gibt es noch nicht. In `src/components/Preview/galerie/` liegen `Logo.js` (Bildmarke „Der Platz“: Quadrat-Haarlinie mit abstraktem Geweih, `currentColor`), `content.js` und `fonts.js` (eigene Variablen `--gal-font-serif`/`--gal-font-sans`). Die Checkliste in Abschnitt 5 ist so gebaut, dass sie ohne Vorwissen auf alle drei Prototypen passt.

---

## 1. Die wichtigsten Erkenntnisse für dieses Projekt

1. **Der erste Eindruck entsteht in rund 50 ms und hängt an der visuellen Ordnung.** Lindgaard et al. zeigten, dass Probanden die visuelle Anmutung einer Website nach 50 ms fast genauso beurteilen wie nach 500 ms. Reinecke et al. fanden, dass geringe visuelle Komplexität und hohe „Prototypikalität“ den ersten Eindruck am stärksten verbessern. Für Platzhirsch heißt das: wenige Tokens, wenige Komponentenvarianten, konsequent eingesetzt. Ein Design-System wirkt hier direkt auf das Vertrauen und nicht nur auf die Pflege.
   Quellen: Lindgaard, Fernandes, Dudek, Brown: „Attention web designers: You have 50 milliseconds to make a good first impression!“, *Behaviour & Information Technology* 25(2), 2006. Reinecke et al.: „Predicting users’ first impressions of website aesthetics…“, CHI 2013.

2. **Token-Disziplin ist heute das größte Problem im Code, nicht die Palette.** `digital/01` zählt 291 Hex-Literale `#30373e`, 296 Literale `#d1b250`, 136 Rundungen und 61 Schatten. Die Palette ist gut, sie wird nur nicht über Tokens genutzt. Der Neuauftritt braucht drei Token-Ebenen (Rohwert → Rolle → Komponente) und ein Lint-Verbot für Hex-Literale.
   Quelle: Design Tokens Community Group, *Design Tokens Format Module 2025.10* (erste stabile Fassung, 28.10.2025), https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/

3. **Tailwind 4 ist „CSS-first“: Tokens stehen in `@theme` und sind zugleich CSS-Variablen und Utilities.** Aus `--color-paper` werden `bg-paper` und `var(--color-paper)`, aus `--ease-quiet` wird `ease-quiet`. Eine `tailwind.config.js` braucht es nicht. Damit ist `globals.css` die einzige Quelle der Wahrheit, für Design wie Code.
   Quelle: Tailwind CSS v4, „Theme variables“, https://tailwindcss.com/docs/theme

4. **Gold `#d1b250` hat auf hellem Grund nur 1,94:1 Kontrast** (auf `#faf8f4`). Für Text (4,5:1), Fokusringe und Feldränder (3:1) ist es auf Hell unbrauchbar. Auf Walnut erreicht es 6,06:1 und auf Ink 5,85:1. Gold ist also eine Farbe für dunkle Flächen und für Mikroakzente. Für Akzenttext auf Hell gibt es `gold-text #7a5f17` (5,69:1).
   Quelle: WCAG 2.2, SC 1.4.3, 1.4.11, 2.4.7, https://www.w3.org/TR/WCAG22/; eigene Nachrechnung.

5. **Horizontale Filterleisten funktionieren nur bei wenigen Filtertypen.** Baymard fand, dass horizontale Leisten bei passenden Sortimenten die Seitenleiste übertreffen können, bei mehr als 6–8 Filtertypen aber versagen, weil die Werte nicht sichtbar sind. 45 % der Nutzer wollen mehrere Werte desselben Filters wählen. 32 % der Shops zeigen gewählte Filter nicht an. Für Platzhirsch passt die horizontale Leiste mit 4–5 Filtern (Marke, Designer, Material, Farbe, „im Showroom“), Mehrfachauswahl und einer Zeile mit gewählten Filtern.
   Quelle: Baymard Institute, „Horizontal Filtering and Sorting Design“, https://baymard.com/blog/horizontal-filtering-sorting-design

6. **Mega-Menüs funktionieren, wenn sie zweidimensional gruppiert sind und ruhig reagieren.** NN/g empfiehlt große Panels ohne Scrollen, gruppiert nach mittlerer Detailtiefe, mit kurzen Begriffen, die mit dem Schlüsselwort beginnen, und mit Bildern dort, wo sie die Wahl erleichtern. Beim Hover soll man 0,5 s warten, dann in unter 0,1 s öffnen. Schließen soll das Menü erst, wenn der Zeiger 0,5 s außerhalb ist. Diagonale Wege zum Panel dürfen das Menü nicht schließen. Genau das passt zu „Raum zuerst“ (Wohnen, Küche, Outdoor).
   Quelle: Nielsen Norman Group, „Mega Menus Work Well for Site Navigation“, https://www.nngroup.com/articles/mega-menus-work-well/

7. **Die Formensprache der Marken ist eckig, ruhig und arbeitet mit Haarlinien.** Minotti, Poliform und Bottega Veneta nutzen keine Rundungen, Schatten oder Pillen (Benchmark in `digital/01`, 2.1). Das heutige `rounded-xl shadow-lg` wirkt wie ein SaaS-Shop. Eckig plus Haarlinie plus Papierton grenzt sofort von den regionalen Wettbewerbern ab (Höttges, reiter design: Standard-Templates).
   Quelle: `digital/01`, Abschnitt 1.1 und 2.1.

8. **WCAG 2.2 bringt neue Pflichten genau für die Komponenten dieses Systems.** 2.4.11 (Fokus nicht vom fixierten Header oder der CTA-Leiste verdeckt), 2.5.8 (Zielgröße mindestens 24 × 24 px), 3.3.2 (sichtbare Labels; heute 20 Labels für 32 Felder), 3.2.2 (kein automatischer Schrittwechsel; heute 500 ms im Beratungsformular). In Österreich gilt seit 28.06.2025 das BaFG, sobald Kasse, Gutscheinkauf oder Online-Termin mit Vertragsschluss kommen.
   Quelle: W3C, WCAG 2.2; `digital/13`, Abschnitt 1.3.

9. **Native Bausteine reichen für fast alle Komponenten und kosten 0 kB.** `<dialog>` (Modal, Bottom-Sheet), die Popover API (Mega-Menü, Filter-Panels, Toasts), `@starting-style` und `transition-behavior: allow-discrete` (Ein- und Ausblenden), View Transitions (Bild-Morph Liste → Produkt). Das JS-Budget aus `digital/13` (≤ 170 KB pro Route, Feature ≤ 10 KB) lässt keine UI-Bibliothek zu. Embla (~7 kB) nur, wo Gesten nötig sind.
   Quellen: WAI-ARIA APG, „Disclosure Navigation Menu“ und „Dialog (Modal)“, https://www.w3.org/WAI/ARIA/apg/patterns/; MDN `<dialog>`, Popover API; `digital/02`, 3.3.

10. **Preise, Händlerstatus und Zustände sind rechtlich geladene UI-Elemente.** Ein „ab“-Preis muss für eine real bestellbare Ausführung gelten. Streichpreise brauchen den 30-Tage-Tiefstpreis (AT § 9a PrAG, DE § 11 PAngV). „Offizieller Händler“ ist nur für ClassiCon belegt. Deshalb ist die Preis-Komponente (`PriceTag`) Teil des Design-Systems, mit fest eingebauten Pflichtzusätzen statt Freitext.
   Quelle: `digital/14`, F2 und F4.

---

## 2. Konkrete Vorgaben: Tokens und Komponenten

### 2.1 Token-Architektur (drei Ebenen)

| Ebene | Benennung | Beispiel | Wer darf es benutzen |
|---|---|---|---|
| 1 Rohwert (Palette) | `--color-<material>` | `--color-walnut: #3f3129` | nur Ebene 2, nie Komponenten |
| 2 Rolle (semantisch) | `--color-<rolle>` | `--color-surface-inverse: var(--color-walnut)` | Komponenten und Seiten |
| 3 Komponente | `--<komponente>-<eigenschaft>` | `--btn-primary-bg: var(--color-action)` | nur die Komponente selbst |

Regeln:
- In `src/components/**` sind Hex-Literale, `rgb()` und beliebige Werte wie `bg-[#…]`, `rounded-[…]` oder `shadow-[…]` verboten. Durchsetzung über ESLint `no-restricted-syntax` mit einem Regex auf `/#[0-9a-fA-F]{3,8}\b/` und `\[#` in `className`. Ziel: 0 Treffer, heute rund 590.
- Tailwind-Standardfarben (`gray-500`, `blue-600` …) werden mit `--color-*: initial;` in `@theme` abgeschaltet. So stehen nur noch Hausfarben zur Wahl.
- Tokens im DTCG-Format zusätzlich als `tokens/platzhirsch.tokens.json` pflegen (für Figma/Penpot über Tokens Studio). `globals.css` wird daraus generiert oder von Hand synchron gehalten. Für ein Team mit 5 Personen reicht die Handpflege. Der Lint-Check ist die Absicherung.

### 2.2 Farb-Tokens

**Ebene 1, Palette (Rohwerte):**

| Token | Hex | Herkunft |
|---|---|---|
| `--color-paper` | `#faf8f4` | neu (`digital/01`), Seitengrund |
| `--color-bone` | `#f7f5f1` | vorhanden |
| `--color-stone` | `#ece8e1` | vorhanden |
| `--color-stone-deep` | `#d8d2c8` | neu, Haarlinien auf Walnut, Musterfeld-Rahmen |
| `--color-ink` | `#30373e` | vorhanden |
| `--color-ink-deep` | `#1f252b` | vorhanden |
| `--color-ink-soft` | `#5c636a` | neu, Sekundärtext |
| `--color-ink-mute` | `#8f8a82` | neu, Feldränder und Icons (nicht für Text) |
| `--color-walnut` | `#3f3129` | vorhanden |
| `--color-gold` | `#d1b250` | vorhanden, nur auf Dunkel |
| `--color-gold-text` | `#7a5f17` | vorhanden, Akzenttext auf Hell |
| `--color-night` | `#0f1624` | vorhanden, nur Video- und Bild-Overlays |
| `--color-signal-error` | `#9b2c24` | neu, Ziegelrot statt Alarmrot |
| `--color-signal-success` | `#2f6b4a` | neu, Tannengrün |
| `--color-signal-notice` | `#8a5a00` | neu, Ocker |

**Ebene 2, Rollen (mit gemessenem Kontrast):**

| Rolle | Wert | Kontrast auf Grund | Erlaubt für |
|---|---|---|---|
| `surface` | paper `#faf8f4` | – | Seitengrund (statt `#ffffff`) |
| `surface-raised` | bone `#f7f5f1` | – | Produktbild-Grund, Karten |
| `surface-band` | stone `#ece8e1` | – | ruhige Bänder, Musterfeld-Hintergründe |
| `surface-inverse` | walnut `#3f3129` | – | **höchstens 1 Fläche pro Seite** (Showroom/Café oder Footer) |
| `text` | ink `#30373e` | 11,37:1 auf paper · 9,87:1 auf stone | Fließtext, Titel |
| `text-strong` | ink-deep `#1f252b` | 14,58:1 | H1 auf Bildflächen-Overlays |
| `text-soft` | ink-soft `#5c636a` | 5,74:1 auf paper · 4,99:1 auf stone | Meta, Designername, Breadcrumb |
| `text-accent` | gold-text `#7a5f17` | 5,69:1 auf paper · 4,95:1 auf stone | Overline „Neu im Showroom“, aktiver Link |
| `text-inverse` | paper | 11,77:1 auf walnut | Text auf Walnut |
| `text-inverse-soft` | stone-deep `#d8d2c8` | 8,30:1 auf walnut | Meta auf Walnut |
| `accent-on-dark` | gold `#d1b250` | 6,06:1 auf walnut · 5,85:1 auf ink | Akzentlinie, Zähler, Fokus auf Dunkel |
| `line` | ink mit 12 % Alpha | dekorativ, keine Pflicht | Haarlinien, Trenner |
| `line-strong` | ink mit 24 % Alpha | dekorativ | Kachel-Hover, Tabellenkopf |
| `line-control` | ink-mute `#8f8a82` | 3,23:1 auf paper | **Feldränder, Checkbox-Rahmen** (SC 1.4.11 verlangt 3:1) |
| `action` | ink `#30373e` | Text paper 11,37:1 | Primärbutton-Fläche |
| `action-hover` | ink-deep `#1f252b` | – | Primärbutton Hover |
| `focus` | ink `#30373e` auf Hell / gold auf Dunkel | ≥ 5,8:1 | Fokusring 2 px + 2 px Abstand |
| `error` / `success` / `notice` | s. o. | 7,12 / 5,96 / 5,59 auf paper | Text, Rand und Icon der Zustände, nie als Fläche |

Flächenregel: Gold unter 2 % der sichtbaren Fläche, nie als Buttonfläche auf Hell, nie als Text auf Hell. Signalfarben erscheinen nur mit Icon und Text (nie Farbe allein, SC 1.4.1).

**Dunkelmodus:** bewusst **nicht** als System-Umschaltung. Ein Möbel-Showroom zeigt Stoffe und Hölzer, und deren Farbwahrnehmung soll nicht vom Betriebssystem abhängen. Die Walnut-Fläche ist der „dunkle Raum“ der Seite. `color-scheme: light` setzen, damit Formular-Elemente nicht dunkel werden.

### 2.3 Typografie-Tokens

Schriften: Display bleibt Bodoni Moda (OFL, `opsz`-Achse, Gewicht 400–500, **nur ab 32 px**). Für Text und UI wird Montserrat ersetzt, Vorschlag Instrument Sans oder Hanken Grotesk (beide OFL, variabel), A/B-Test laut `digital/01`. Das Galerie-Prototyp nutzt bereits eine Garamond-Variante als Serif. Die Entscheidung Bodoni oder Garamond fällt nach dem Prototypvergleich (Checkliste, Kriterium T2), danach gibt es genau **eine** Serif.

| Token (`--text-*`) | Größe (clamp, 360 → 1440 px) | Zeilenhöhe | Laufweite | Schrift / Gewicht | Einsatz |
|---|---|---|---|---|---|
| `display-xl` | `clamp(3.5rem, 2.33rem + 5.19vw, 6rem)` = 56–96 px | 1,02 | −0,01 em | Serif 400 | Hero, eine Zeile pro Seite |
| `display-l` | `clamp(2.5rem, 1.94rem + 2.5vw, 4rem)` = 40–64 px | 1,05 | −0,005 em | Serif 400 | H1 Unterseiten |
| `display-m` | `clamp(2rem, 1.72rem + 1.25vw, 2.75rem)` = 32–44 px | 1,1 | 0 | Serif 500 | H2 Sektionen |
| `title` | `clamp(1.375rem, 1.31rem + 0.28vw, 1.625rem)` = 22–26 px | 1,25 | 0 | Sans 500 | H3, Kartentitel groß |
| `body-l` | 1,125 rem = 18 px | 1,6 | 0 | Sans 400 | Einleitung, Lead |
| `body` | 1,0625 rem = 17 px | 1,6 | 0 | Sans 400 | Fließtext, max. 68 Zeichen (`max-w-[68ch]` als Token `--measure`) |
| `ui` | 0,9375 rem = 15 px | 1,4 | 0,005 em | Sans 500 | Buttons, Navigation, Felder |
| `small` | 0,875 rem = 14 px | 1,45 | 0,01 em | Sans 400 | Meta, Hinweise, Fehlertexte |
| `overline` | 0,75 rem = 12 px | 1,3 | **0,14 em**, Versalien | Sans 500 | Markenname über Produkt, Sektionsmarke |

Regeln: Versalien nur für `overline` (heute 123× `uppercase`). `font-variant-numeric: tabular-nums` für Maße, Preise und Lieferzeiten. Felder mindestens 16 px Schrift, sonst zoomt iOS Safari beim Fokus. Überschriften mit `text-wrap: balance`, Fließtext mit `text-wrap: pretty`. Silbentrennung `hyphens: auto` mit `lang` je Locale (lange deutsche Komposita wie „Wohnzimmereinrichtung“ auf 360 px).

### 2.4 Abstände, Raster, Container

8-px-Basis, Tailwind-4-Standard `--spacing: 0.25rem` bleibt (dadurch sind `p-2` = 8 px usw. gültig). Zusätzlich semantische Abstände:

| Token | Mobil | Tablet (≥ 768) | Desktop (≥ 1280) | Einsatz |
|---|---|---|---|---|
| `--space-gutter` | 16 px (Rand) | 48 px | 80 px | Seitenrand. Mobil 16 px statt 24 px, damit Produktbilder breiter werden |
| `--space-grid-gap` | 16 px | 24 px | 32 px | Rasterabstand Kacheln |
| `--space-stack-s` | 8 px | 8 px | 12 px | Overline → Titel |
| `--space-stack-m` | 24 px | 32 px | 40 px | Titel → Text → Handlung |
| `--space-section` | 96 px | 128 px | 176 px | Abstand zwischen Sektionen (`digital/01`: 160–200 px Desktop) |
| `--container` | 100 % | 100 % | 1440 px | maximaler Inhaltsbereich |
| `--container-text` | – | – | 720 px | Journal, Ratgeber |

Raster: 4 Spalten mobil, 8 Tablet, 12 Desktop. Asymmetrie als Standard (Text Spalten 2–6, Bild 7–12). Zentrierte Überschriften nur im Hero.

### 2.5 Radien, Linien, Schatten, Ebenen

| Token | Wert | Einsatz |
|---|---|---|
| `--radius-none` | 0 | **Standard für alles**: Bilder, Karten, Buttons, Felder, Modals |
| `--radius-pill` | 9999 px | nur Zähler-Badge (Auswahl ♡ 3) und Avatare |
| `--border-hair` | 1 px solid `line` | Trenner, Karten-Hover, Header-Unterkante |
| `--border-control` | 1 px solid `line-control` | Felder, Checkbox, Radio |
| `--border-focus` | 2 px solid `focus`, `outline-offset: 2px` | jeder fokussierbare Baustein |
| `--shadow-none` | none | Standard |
| `--shadow-overlay` | `0 24px 48px -12px rgb(31 37 43 / 0.18)` | **einziger Schatten**: Mega-Menü-Panel, Modal, Toast, Bottom-Sheet (schwebt über Inhalt) |
| `--backdrop` | `rgb(31 37 43 / 0.48)` + `backdrop-filter: blur(2px)` | hinter Modal und Sheet |

Z-Ebenen (feste Skala statt `z-[9999]`): `--z-base 0`, `--z-sticky 20` (Produkt-Infospalte), `--z-header 40`, `--z-cta-bar 45`, `--z-menu 50`, `--z-overlay 60` (Modal/Sheet), `--z-toast 70`.

### 2.6 Motion-Tokens (aus `digital/02` übernommen, verbindlich)

`--ease-quiet: cubic-bezier(0.22, 1, 0.36, 1)`, `--ease-quiet-inout: cubic-bezier(0.65, 0, 0.35, 1)`, `--duration-micro: 160ms` (Hover, Fokus, Herz), `--duration-ui: 280ms` (Menüs, Chips, Panels), `--duration-enter: 600ms` (Reveals), `--duration-morph: 450ms` (View Transitions), `--duration-exit: 180ms` (Ausblenden), `--duration-slow: 1600ms` (Hero-Zoom). Wege 12–32 px, Scale höchstens 1,03 (Bild-Hover) bis 1,06 (Hero). Unter `prefers-reduced-motion: reduce` gibt es nur Crossfades bis 150 ms.

`lenis` steht in `package.json`, wird aber **nicht** global eingesetzt (`digital/02`, `digital/13`: kein Scroll-Hijacking, INP-Budget ≤ 150 ms). `motion@12` nur in lazy geladenen Client-Inseln mit Gesten (z. B. Lightbox-Zoom), nie für Reveals, die CSS kann.

### 2.7 Tailwind-4-Umsetzung (Ausschnitt für `globals.css`)

```css
@import "tailwindcss";

@theme {
  --color-*: initial;                 /* Tailwind-Standardfarben aus */
  --color-paper: #faf8f4;  --color-bone: #f7f5f1;  --color-stone: #ece8e1;
  --color-stone-deep: #d8d2c8;
  --color-ink: #30373e;    --color-ink-deep: #1f252b;
  --color-ink-soft: #5c636a; --color-ink-mute: #8f8a82;
  --color-walnut: #3f3129; --color-night: #0f1624;
  --color-gold: #d1b250;   --color-gold-text: #7a5f17;
  --color-error: #9b2c24;  --color-success: #2f6b4a; --color-notice: #8a5a00;
  --color-line: rgb(48 55 62 / 0.12);
  --color-line-strong: rgb(48 55 62 / 0.24);
  --color-white: #ffffff;  --color-transparent: transparent; --color-current: currentColor;

  --font-display: var(--font-serif), Georgia, serif;
  --font-sans: var(--font-ui), Helvetica, Arial, sans-serif;

  --text-display-xl: clamp(3.5rem, 2.33rem + 5.19vw, 6rem);
  --text-display-xl--line-height: 1.02;
  --text-display-l: clamp(2.5rem, 1.94rem + 2.5vw, 4rem);
  --text-display-l--line-height: 1.05;
  --text-display-m: clamp(2rem, 1.72rem + 1.25vw, 2.75rem);
  --text-display-m--line-height: 1.1;
  --text-title: clamp(1.375rem, 1.31rem + 0.28vw, 1.625rem);
  --text-title--line-height: 1.25;
  --text-body: 1.0625rem;  --text-body--line-height: 1.6;
  --text-ui: 0.9375rem;    --text-ui--line-height: 1.4;
  --text-small: 0.875rem;  --text-small--line-height: 1.45;
  --text-overline: 0.75rem; --text-overline--letter-spacing: 0.14em;

  --radius-*: initial;     --radius-pill: 9999px;   /* rounded-* sonst nicht verfügbar */
  --shadow-*: initial;     --shadow-overlay: 0 24px 48px -12px rgb(31 37 43 / 0.18);

  --ease-quiet: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-quiet-inout: cubic-bezier(0.65, 0, 0.35, 1);
  --breakpoint-xs: 22.5rem;   /* 360 px */
}

@utility overline { font-size: var(--text-overline); letter-spacing: 0.14em; text-transform: uppercase; font-weight: 500; }
@utility hairline { border-color: var(--color-line); border-width: 0 0 1px; }
@utility tabular  { font-variant-numeric: tabular-nums; }

:root { color-scheme: light; }
body { background: var(--color-paper); color: var(--color-ink); }
:focus-visible { outline: 2px solid var(--color-ink); outline-offset: 2px; }
.surface-inverse :focus-visible { outline-color: var(--color-gold); }
```

Wirkung: Mit `--radius-*: initial` und `--shadow-*: initial` existieren `rounded-xl` und `shadow-lg` schlicht nicht mehr. Der Build verhindert den Rückfall in den alten Stil. Varianten in React per `clsx` (0,3 kB). Keine UI-Bibliothek, kein `cva`.

### 2.8 Komponentenliste mit Varianten und Zuständen

Ablage: `src/components/ui/*` (Primitive) und `src/components/patterns/*` (zusammengesetzte Bausteine). Jede Komponente hat einen Eintrag auf der internen Seite `/[locale]/styleguide` (`noindex`) mit allen Varianten und Zuständen. Pflichtzustände für jedes interaktive Element: **ruhend, Hover, Fokus sichtbar, aktiv/gedrückt, deaktiviert, lädt, Fehler** (wo zutreffend).

#### A. Button (`ui/Button.js`)

| Variante | Aussehen | Einsatz | Pro Ansicht |
|---|---|---|---|
| `primary` | Fläche ink, Text paper, 0 px Radius, Höhe 48 px (mobil) / 52 px (Desktop), Innenabstand 24/32 px, Text `ui` 500 | „Termin vereinbaren“, „Beratung zu diesem Stück“, „Anfrage senden“ | **höchstens 1** |
| `secondary` | Rand 1 px ink, Text ink, transparent | „Anrufen“, „Zur Auswahl hinzufügen“ | 1–2 |
| `quiet` (Textlink-Button) | Text ink, Unterstreichung 1 px mit 4 px Abstand, Pfeil → | „Alle 36 Marken →“, „Mehr zum Showroom →“ | beliebig |
| `on-dark` | Rand 1 px gold, Text paper; Hover Fläche gold, Text walnut (6,06:1) | Termin-CTA in der Walnut-Fläche | 1 |
| `icon` | 44 × 44 px Trefferfläche, Icon 20 px, `aria-label` Pflicht | Suche, Auswahl ♡, Menü, Schließen | – |

Zustände: Hover = Fläche ink-deep, Füllung von links per `scale-x` in 280 ms `ease-quiet`, Pfeil 4 px nach rechts. Fokus = Ring 2 px + 2 px Abstand. Aktiv = `translateY(1px)`. Deaktiviert = 40 % Deckkraft plus `aria-disabled`. Fokussierbar bleibt der Knopf nur, wenn ein Hinweis erklärt, warum er deaktiviert ist. Sonst wird der Fehler erst nach dem Absenden gezeigt. „Lädt“ = Text bleibt, Spinner 16 px rechts, `aria-busy="true"`, Breite fix (kein Springen). „Erledigt“ = Häkchen per `stroke-dashoffset` in 400 ms, danach Meldung mit `role="status"`.
Mindestgröße der Trefferfläche: 44 × 44 px (über WCAG 2.5.8 mit 24 px hinaus, weil die Zielgruppe 45+ ist und oft am Tablet sitzt).

#### B. Link

`link-inline` (im Fließtext: ink, Unterstreichung 1 px, `text-underline-offset: 0.2em`, Hover Unterstreichung 2 px), `link-nav` (keine Unterstreichung, aktiver Zustand mit 1 px Linie in gold-text unter dem Wort plus `aria-current="page"`), `link-overline` (Markenname über Produkttitel, führt zur Markenseite).

#### C. Overline, Hairline, Section

`Overline` (12 px, 0,14 em, Versalien, Varianten `soft` / `accent`), `Hairline` (1 px `line`, Varianten `full` / `inset`), `Section` (Varianten `paper` / `band` (stone) / `inverse` (walnut, Lint-Warnung bei zweitem Vorkommen pro Seite), Prop `spacing="section|compact"`).

#### D. Karten

| Variante | Aufbau | Seitenverhältnis |
|---|---|---|
| `card-editorial` | Bild, Overline, Titel `title`, max. 2 Sätze, `quiet`-Link. Ohne Rahmen | 3:2 oder 4:5 |
| `card-project` (Referenz) | Bild 3:2, Overline Ort („Lindau · Seevilla“), Titel, Fakten-Zeile (m², Marken, Dauer) in `small tabular` | 3:2 |
| `card-brand` | Markenname typografisch in Serif `display-m` (kein Logo als Siegel, `digital/14` F2), darunter Herkunft „Meda, Italien · seit 1948“, ein Raumbild | 4:5 |
| `card-person` (Berater) | Foto 1:1 mit `rounded-pill`, Name, Rolle, ein Satz in Ich-Form, „Anrufen · WhatsApp“ | 1:1 |
| `card-event` | Datum groß in Serif (`26.11.`), Titel, Ort, `secondary`-Button „Platz reservieren“ | – |

Karten haben **keinen** Schatten und keinen Rahmen. Der Hover zeigt eine Haarlinie unter dem Titel und skaliert das Bild auf 1,03 in 600 ms. Die ganze Karte ist ein Link (`::after`-Overlay), Sekundärlinks liegen mit `relative z-10` darüber.

#### E. Produktkachel (`patterns/ProductTile.js`)

- Bild 4:5, freigestellt auf `surface-raised`, `object-contain` mit 8 % Innenrand, `sizes="(min-width:1280px) 30vw, (min-width:768px) 45vw, 50vw"`. Zweitbild (Raumansicht) beim Hover mit Crossfade 280 ms (nur Pointer-Geräte, `@media (hover:hover)`).
- Darunter: Overline Marke (`text-soft`), Name `body` 500, Designer `small text-soft`, optional Preis-Zeile über `PriceTag` und Status-Badge.
- Auswahl-Herz: 44 × 44 px oben rechts, auf Touch immer sichtbar, Desktop beim Hover oder Fokus der Kachel. Zustände `aus` (Kontur) / `an` (gefüllt ink) mit `aria-pressed`. Rückmeldung: Toast „Zur Auswahl hinzugefügt“ plus Zähler im Header, der 1× in 160 ms auf 1,15 skaliert.
- Status-Badges (Text, eckig, 1 px Rahmen, `small`): „Im Showroom Lochau“, „Ausstellungsstück“, „Neu“. **Nur aus Backoffice-Feldern**, nie aus festem Code. Kein „Nur noch 1“, kein „Beliebt“.
- Varianten: `default` (Katalog), `compact` (Mega-Menü, „Ähnlich“, 3:4 klein), `feature` (über 2 Spalten, Raumbild 3:2, nach jeder 12. Kachel als redaktionelles Element).
- `view-transition-name: product-<slug>` am Bild, damit es zum Galeriebild der Produktseite morpht (450 ms).
- Skeleton: Fläche bone im exakten Seitenverhältnis, kein Puls-Schimmer (ruhiger, und CLS = 0).

#### F. Preis (`patterns/PriceTag.js`)

Varianten: `on-request` („Preis auf Anfrage“, dann **kein** `Offer`-Schema), `from` („ab 8.940 €“ + Pflichtzeile mit Ausführung: „3-Sitzer, 238 cm, Stoff Kat. A, inkl. MwSt., zzgl. Lieferung“), `fixed` (Outlet/Accessoire), `reduced` (nur mit 30-Tage-Tiefstpreis aus dem Backoffice, sonst wirft die Komponente einen Build-Fehler), `chf` („ca. CHF …, Kostenschätzung inkl. 8,1 % MWST“). Ziffern `tabular`, Währungszeichen nach Locale (`Intl.NumberFormat`). Kein Rot für Preise.

#### G. Galerie und Lightbox

- Produktseite Desktop: 1 Hauptbild 4:5 (Spalten 1–7), darunter ein 2er-Raster weiterer Bilder. Kein Slider mit Pfeilen.
- Mobil: Wischleiste mit CSS Scroll-Snap (`scroll-snap-type: x mandatory`, 0 kB), Zähler „1 / 6“ in `small tabular` statt Punkten (die Punkte von Slick haben heute 20 px und fallen durch 2.5.8).
- Embla nur für Karussells mit Endlos-Schleife oder Ziehen per Maus (Kollektion, Projekte), Pfeile 44 × 44 px, sichtbarer Pause-Knopf bei Autoplay (WCAG 2.2.2). Standard ist **kein** Autoplay.
- Lightbox: natives `<dialog>` im Vollbild auf paper (nicht schwarz, damit das Bild in Hausfarbe bleibt), Pinch-Zoom und Doppeltipp, Esc und Wischen nach unten schließen, Fokus kehrt zum auslösenden Bild zurück. Zoom-Bibliothek (`yet-another-react-lightbox` oder PhotoSwipe) erst beim ersten Klick per `next/dynamic` laden.
- Musterfelder (Stoffe, Hölzer, Steinplatten der Binni-Küchenlinie): Raster aus 64 × 64 px Feldern (mobil 56 px), eckig, 1 px Rahmen stone-deep. Auswahl = 2 px Rahmen ink plus Name darunter. Echte Materialfotos, keine Farbflächen.

#### H. Navigation und Mega-Menü

- Header: 72 px Desktop, 56 px mobil, Fläche paper, Haarlinie unten. Beim Scrollen nach unten bleibt der Header kompakt (64 px) und wird nicht ausgeblendet. `scroll-padding-top: 5rem` und `scroll-padding-bottom` für die CTA-Leiste (SC 2.4.11).
- Hauptpunkte: Wohnen · Küche · Outdoor · Marken · Projekte · Das Haus. Rechts ⌕, Auswahl ♡ mit Zähler, „DE · EN · FR · IT“ ohne Flaggen, `primary`-Button „Termin“ als einzige gefüllte Fläche.
- Mega-Menü als **Disclosure-Navigation** (APG-Muster: `button[aria-expanded]` + Panel, keine `role="menu"`, die würde Screenreader-Nutzer in einen Anwendungsmodus zwingen). Öffnen per Klick oder Enter und per Hover nach 300 ms Verweilen (NN/g empfiehlt bis zu 500 ms; 300 ms ist der Kompromiss für geübte Nutzer). Schließen nach 400 ms außerhalb, mit Toleranzdreieck für diagonale Wege, sofort bei Esc (Fokus zurück auf den Auslöser).
- Panel: volle Breite, paper, `shadow-overlay`, 3–4 Textspalten (Gruppen in `overline`, Einträge `ui`, Zähler `small text-soft tabular`) plus 1 Bildspalte 4:5 mit „Neu im Showroom“. Einblenden über `@starting-style` mit Opacity und 8 px Weg in 280 ms. Panel-Inhalt ist Server-HTML (crawlbar).
- Marken-Panel: Markennamen in Serif, alphabetisch in 3 Spalten, rechts 1 Bild, unten „Alle Marken →“.
- Mobil: Vollbild-Overlay als `<dialog>`, Einträge in Serif 32 px, Ebenen schieben horizontal (280 ms), „Zurück“ oben links. Unten fixiert: `primary` „Termin vereinbaren“ + `secondary` „Anrufen“.
- Breadcrumb: `small text-soft`, Trefferhöhe 24 px mindestens (heute ~16 px).
- Mobile CTA-Leiste: immer sichtbar (`digital/02` F8), 64 px, kontextuell („♡ | Beratung zu Lawrence“ auf Produktseiten).

#### I. Filter und Sortierung (Katalog)

- Desktop: horizontale Leiste unter dem Kategorie-Kopf mit höchstens 5 Filtern: Marke, Designer, Material, Farbe, „Im Showroom“ (sobald Backoffice-Feld vorhanden). Rechts Sortierung (`<select>` gestylt) und Ergebniszähler „212 Stücke“ mit `aria-live="polite"`.
- Filter-Chip (Auslöser): 40 px hoch, Rand 1 px `line-control`, Text `ui`, Pfeil. Aktiv mit Zahl: „Marke · 2“, Fläche ink, Text paper.
- Filter-Panel per Popover, Checkboxen 20 × 20 px eckig in einer 44 px hohen Zeile, **Mehrfachauswahl**, Anzahl je Wert, Suchfeld ab 12 Werten (Marken), „Anwenden“ ist nicht nötig, die Liste aktualisiert sich nach 300 ms (Desktop).
- Zeile „Gewählte Filter“ unter der Leiste: entfernbare Chips („Minotti ×“) plus „Alle zurücksetzen“.
- Mobil: Knopf „Filtern · 3“ öffnet Bottom-Sheet (`<dialog>`, 90 vh, Ziehgriff 32 × 4 px), Akkordeons je Filter. Unten fixiert: „212 Stücke anzeigen“ (`primary`) und „Zurücksetzen“. Hier wird erst beim Antippen angewendet, damit nichts hinter dem Sheet springt.
- Filter-URLs bleiben teilbar und crawlbar (Query-Parameter, `canonical` auf die unfilterte Kategorie).
- Leerer Zustand: „Mit dieser Auswahl haben wir gerade nichts im Katalog. Im Showroom zeigen wir Ihnen gern Alternativen.“ + „Filter zurücksetzen“ + „Termin vereinbaren“.

#### J. Formulare

- Sichtbares Label **über** dem Feld (`small` 500, ink). Kein Label nur als Platzhalter (SC 3.3.2, heute 20 Labels für 32 Felder).
- Feld: 52 px hoch, Schrift 16 px, Rand 1 px `line-control` (3,23:1), Hintergrund white oder paper, 0 px Radius. Fokus: Rand 2 px ink. Fehler: Rand 2 px error, Icon und Text darunter, `aria-invalid="true"`, `aria-describedby` auf die Fehlermeldung. Erfolg wird nicht pro Feld angezeigt.
- Pflichtfelder: Kennzeichnung „optional“ an den wenigen freiwilligen Feldern statt Sternchen an allen. Höchstens 5 Felder in der Erstanfrage (Name, E-Mail oder Telefon, Nachricht, Wohnort/Land, Einwilligung).
- Validierung beim Verlassen des Feldes und beim Absenden, nie während des Tippens. Nach dem Absenden mit Fehlern: Fehlerübersicht oben mit Ankerlinks, Fokus springt dorthin.
- Varianten: `TextField`, `TextArea` (min. 4 Zeilen, Zeichenzähler erst ab 80 % der Höchstlänge), `Select`, `Checkbox`, `Radio-Karten` (Beratungsart: Showroom / Video / Vor Ort, 1 px Rahmen, gewählt 2 px ink), `DateSlot` (Terminwahl: Wochentag + Uhrzeit als Raster aus 44 px Knöpfen, belegte Termine ausgegraut mit Text „belegt“, nie „nur noch 2 frei“), `Consent-Checkbox` (nicht vorausgewählt, Datenschutzlink im Label).
- Mehrstufige Formulare: Schrittanzeige „Schritt 2 von 3 · Ihr Projekt“, Wechsel nur per Knopf (kein automatischer Sprung, SC 3.2.2), Zurück ohne Datenverlust, Crossfade über `<ViewTransition>`.
- Honeypot und Rate-Limit statt CAPTCHA (keine Hürde für ältere Kunden, kein Drittland-Dienst).

#### K. Modal und Bottom-Sheet

- Natives `<dialog>` mit `showModal()`: Fokusfalle, Esc und `inert` am Rest der Seite gibt es gratis. Titel als `h2`, `aria-labelledby`.
- Größen: `s` 480 px (Bestätigung), `m` 720 px (Merkliste-Anfrage, Video-Termin), `full` (Lightbox, mobiles Menü). Mobil wird jedes `s`/`m`-Modal zum Bottom-Sheet.
- Schließen-Knopf oben rechts 44 × 44 px, plus Klick auf den Hintergrund (außer bei Formularen mit Eingaben: dann Rückfrage „Eingaben verwerfen?“ mit „Weiter ausfüllen“ als Standard).
- Einblenden: Opacity + 16 px Weg in 280 ms, Ausblenden 180 ms. Hintergrund `--backdrop`.
- Verboten: Modal beim Seitenaufruf, Exit-Intent-Popups, Newsletter-Overlay. Newsletter steht inline im Footer und am Ende von Journal-Artikeln.

#### L. Toast und Inline-Meldungen

- Toast (Popover `manual`, Position unten links Desktop / über der CTA-Leiste mobil): Fläche ink, Text paper, max. 360 px, 1 Satz + optional 1 Aktion („Auswahl ansehen“, „Rückgängig“). Dauer 5 s, bei Aktion 8 s, pausiert bei Hover und Fokus, Schließen-Knopf. `role="status"` (nie `alert` für Erfolg). Höchstens 1 Toast zugleich.
- Einsatz nur für Rückmeldungen auf eine eigene Handlung (Auswahl, Link kopiert, Termin vorgemerkt). **Wichtige Bestätigungen** (Anfrage gesendet, Termin gebucht) erscheinen **inline** auf der Seite mit Zusammenfassung und nächstem Schritt („Wir melden uns bis morgen 12 Uhr. Ihr Ansprechpartner: …“), nicht als flüchtiger Toast.
- Inline-Meldung (`Notice`): Varianten `info` (ink), `success`, `error`, `notice` mit 2 px Linie links in der Signalfarbe, Icon und Text, Hintergrund paper. Keine farbigen Flächen.

#### M. Weitere Bausteine

`Accordion` (statt Tabs auf Produktseiten; `<details>`/`<summary>`, alles im HTML crawlbar, Plus wird Minus in 160 ms), `Tabs` (nur wo Inhalte wirklich parallel sind, z. B. Maße cm/inch), `Badge` (s. Produktkachel), `Counter` (Auswahl-Zähler, `rounded-pill`, 18 px, ink auf Hell, gold auf Dunkel), `Avatar`, `Quote` (Kundenstimme: Serif `title`, Name und Ort, nur echte, freigegebene Stimmen), `FactList` (Maße, Lieferzeit, Herkunft als Definitionsliste `dl`, `tabular`), `Map-Fassade` (statisches Bild mit Knopf „Karte laden“, Google Maps erst nach Klick und Consent), `Video-Fassade` (Poster + Play 64 px, kein Autoplay mit Ton), `SkipLink` (erstes Element, sichtbar bei Fokus), `LocaleSwitch`, `Pagination` („Weitere 24 Stücke laden“ plus echte `?page=`-Links für Crawler).

### 2.9 Messbare Abnahmewerte für das System

| Kennzahl | Ziel |
|---|---|
| Hex-Literale und Arbitrary Values in `src/components/**` | 0 |
| Anzahl Farb-Tokens Ebene 1 | ≤ 16 |
| Button-Varianten | 5, Größen 2 |
| Primärbuttons pro Ansicht | ≤ 1 |
| Walnut-Flächen pro Seite | ≤ 1 |
| Goldanteil an der sichtbaren Fläche (Screenshot-Pixelzählung) | < 2 % |
| Kontrast Text / Bedienelemente | ≥ 4,5:1 / ≥ 3:1, axe 0 Fehler |
| Trefferflächen | ≥ 44 × 44 px (mind. 24 px laut 2.5.8) |
| Zusätzliches JS durch UI-System (Initial-Route) | ≤ 10 KB gzip |
| CLS durch Komponenten | 0 (feste `aspect-ratio` überall) |
| Styleguide-Abdeckung | 100 % der Komponenten mit allen Zuständen |

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen

1. **„Material-Tokens“ statt Farbcodes.** Die Palette heißt nach dem, was im Showroom steht: Paper, Bone, Stone (Kalkstein), Walnut, Ink, Gold. Die gleichen Namen tauchen in der Musterbibliothek auf. Website, Drucksachen, Beschilderung im Café und Steinplatten-Muster der Küchenlinie sprechen eine Sprache. Kein Wettbewerber in der Region hat ein dokumentiertes System. Höttges, reiter design und Gamma arbeiten mit Theme-Standards.
2. **Ein lebendiger Styleguide unter `/styleguide`.** Er dient intern dem Team und extern (als PDF-Export) den Architekten als „Hausstil“, auf den sie verweisen können. Das passt zum Architekten-Programm aus dem Masterkonzept.
3. **Das Bild morpht von der Kachel ins Produkt** (View Transitions, 450 ms, 0 kB). Auf allen regionalen Seiten lädt die Produktseite hart neu.
4. **Die „Ihre Auswahl“-Leiste als Moodboard.** Gewählte Stücke erscheinen als 4:5-Raster mit Musterfeldern. Aus der Auswahl entsteht mit einem Knopf eine Anfrage, die schon Maße und Ausführungen enthält. Der Berater sieht beim Termin genau dieses Board.
5. **Berater-Karte direkt neben dem Produkt.** Gesicht, Name, ein Satz („Ich zeige Ihnen die Bezüge im Showroom.“), Anrufen und WhatsApp. Das ist der Gastgeber-Gedanke aus `digital/12` als Komponente.
6. **Dreiländer-Preiszeile.** `PriceTag` zeigt EUR und auf Wunsch CHF (als gekennzeichnete Kostenschätzung inkl. 8,1 % MWST und Verzollung). Diese Alleinstellung Nr. 5 aus dem Masterkonzept kann kein Wettbewerber im Premium-Segment.
7. **Musterfelder mit echten Materialfotos** für Stoffe, Leder, Hölzer und die Steinplatten der Küchenlinie, in 64-px-Raster, mit Zoom auf 1:1-Struktur. Die Konkurrenz zeigt Farbkreise oder nichts.
8. **Termin-Slots als ruhiges Raster** im System-Look (eckig, Haarlinien, Tageszeit „Vormittag im Café“). Damit wird die Buchung Teil des Markenerlebnisses statt eines eingebetteten Fremd-Widgets.
9. **Ein dunkler Raum pro Seite.** Die einzige Walnut-Fläche trägt immer den Gastgeber-Moment (Café, Abendveranstaltung, Showroom bei Nacht). Die Regel macht den Rhythmus jeder Seite wiedererkennbar.

---

## 4. Was man auf keinen Fall tun darf

- **Dark Patterns** (in der EU unzulässig, u. a. DSA Art. 25, UGP-Richtlinie Anhang I, UWG): kein Countdown, kein „Nur noch 1 verfügbar“ ohne echten Bestand, kein „12 Personen sehen sich das gerade an“, keine vorausgewählten Einwilligungen, kein Confirmshaming („Nein danke, ich mag keine schönen Möbel“), kein schwerer Abmeldeweg, keine versteckten Liefer- oder Montagekosten, keine gefälschten Streichpreise.
- **Keine Händler-Behauptungen in der UI:** keine Badges „Offizieller Partner“, „Authorized Dealer“, keine Herstellerlogos als Siegel. Ausnahme ClassiCon, nur mit Beleg-Link (`digital/14` F2).
- **Gold als Text oder Buttonfläche auf Hell** (1,94:1). Gold-Fokusring auf Hell (heute 2,05:1).
- **Rundungen, Schatten auf Karten, Pillen-Buttons, Goldbalken unter Titeln.** Sie sind im Theme abgeschaltet und sollen es bleiben.
- **Mehr als eine Serif, mehr als eine Sans.** Kein Mischen von Bodoni und Garamond auf derselben Seite.
- **Versalien in Fließtext, Buttons oder Navigation.**
- **Platzhalter statt Labels**, automatischer Schrittwechsel, Validierung während des Tippens, CAPTCHA-Rätsel.
- **Modals beim Laden**, Exit-Intent, Newsletter-Overlay, Chat-Bubble, die Inhalte verdeckt.
- **Autoplay-Karussells ohne Pause**, Slick-Punkte, Pfeile unter 44 px.
- **Globales Smooth-Scrolling mit Lenis**, Scroll-Hijacking, Parallax-Bibliotheken, `opacity: 0` vor der Hydration.
- **Tailwind-Standardfarben, Arbitrary Values (`bg-[#…]`) oder `z-[9999]`** in Komponenten.
- **UI-Bibliotheken** (MUI, Chakra, shadcn mit eigenem Look) – sie bringen fremde Formensprache und sprengen das JS-Budget.
- **KI-generierte Raumbilder als echte Referenz** ausgeben (UWG), Stockfotos von Unsplash.
- **Superlative in UI-Texten** („Nr. 1“, „größte Ausstellung“), solange kein dokumentierter Beleg vorliegt.

---

## 5. Prüf-Checkliste für die drei Prototypen (`galerie`, `buehne`, `dreilaendereck`)

Skala je Kriterium: **0** = fehlt oder verstößt · **1** = in Ansätzen, mehrere Abweichungen · **2** = überwiegend erfüllt, einzelne Abweichungen · **3** = vollständig und konsequent erfüllt.
Gewichtung: Kriterien mit ★ zählen doppelt. Höchstpunktzahl: 22 Kriterien, davon 8 doppelt = 30 × 3 = **90 Punkte**.
K.-o.-Kriterien (führen unabhängig von der Summe zur Nacharbeit): ein Dark Pattern, eine Händler-Behauptung ohne Beleg, Kontrastfehler im Fließtext, nicht per Tastatur bedienbare Navigation.

Prüfmethode: Code lesen (`src/app/[locale]/preview/<name>`, `src/components/Preview/<name>`), `curl http://localhost:3000/de/preview/<name>` für das HTML, Browser bei 360 / 768 / 1440 px, axe DevTools, Lighthouse mobil, Tastatur-Durchgang.

| # | Bereich | Kriterium | Prüfung | Punkte (0–3) |
|---|---|---|---|---|
| T1 ★ | Tokens | Alle Farben, Radien, Schatten, Abstände über `@theme`-Tokens, keine Hex-Literale/Arbitrary Values in Komponenten | `grep -E "#[0-9a-fA-F]{3,6}|\[#" ` im Prototyp-Ordner | |
| T2 | Typografie | Genau 1 Serif ab 32 px und 1 Sans; Skala entspricht 2.3; Versalien nur in Overlines | Code + Sichtprüfung 360/1440 px | |
| T3 | Typografie | Fließtext 17–18 px, Zeilenhöhe ≥ 1,5, ≤ 75 Zeichen pro Zeile, `tabular-nums` bei Zahlen | DevTools, Zeichen zählen | |
| T4 ★ | Farbe | Kontrast: Text ≥ 4,5:1, Bedienelemente/Fokus ≥ 3:1; kein Gold auf Hell als Text | axe 0 Fehler, Stichprobe 10 Paare | |
| T5 | Farbe | ≤ 1 Walnut-Fläche pro Seite, Gold < 2 % Fläche, Signalfarben nur mit Icon + Text | Screenshot, Sichtprüfung | |
| T6 | Form | 0 px Radius auf Bildern, Karten, Buttons; Schatten nur auf schwebenden Ebenen; Haarlinien statt Rahmen | Code + Sichtprüfung | |
| T7 | Raster | Raster 4/8/12, Ränder 16/48/80 px, Sektionsabstand ≥ 96 / 176 px, keine horizontale Scrollleiste bei 360 px | DevTools-Overlay | |
| K1 ★ | Buttons | 5 Varianten oder weniger, ≤ 1 Primärbutton pro Ansicht, alle 7 Zustände vorhanden, Trefferfläche ≥ 44 px | Tastatur + Hover + Styleguide | |
| K2 ★ | Produktkachel | 4:5 einheitlich, Overline Marke, Herz 44 px mit `aria-pressed`, Badges nur aus Daten, Zweitbild nur bei `hover:hover` | Katalogansicht | |
| K3 | Preis | Preisanzeige mit Pflichtzusätzen (inkl. MwSt., Ausführung bei „ab“), „Preis auf Anfrage“ ohne `Offer` | HTML + JSON-LD prüfen | |
| K4 | Galerie | Kein Slider-Zwang auf Desktop, Scroll-Snap mobil mit Zähler, Lightbox per `<dialog>`, lazy geladen, Fokus kehrt zurück | Netzwerk-Tab, Tastatur | |
| K5 ★ | Navigation | Disclosure-Muster mit `aria-expanded`, Hover-Verzögerung ~300 ms, Esc schließt, Toleranz für Diagonale, Panel ohne Scrollen | Tastatur, Screenreader (NVDA) | |
| K6 | Navigation mobil | Vollbild-Overlay, Einträge ≥ 24 px Serif, Termin + Anrufen fix unten, Fokusfalle | 360 px, Tastatur | |
| K7 | Filter | ≤ 5 Filter horizontal, Mehrfachauswahl, Zeile „gewählte Filter“, Zähler mit `aria-live`, Bottom-Sheet mobil, leerer Zustand mit Ausweg | Katalog 360/1440 px | |
| K8 ★ | Formulare | Sichtbare Labels, Felder 16 px+, Fehler mit `aria-invalid` + `aria-describedby`, kein automatischer Schrittwechsel, ≤ 5 Felder Erstanfrage | Absenden leer + fehlerhaft | |
| K9 | Modal | Natives `<dialog>` oder gleichwertig, Fokusfalle, Esc, kein Modal beim Laden | Tastatur | |
| K10 | Toast/Meldung | `role="status"`, ≥ 5 s, pausiert bei Hover, wichtige Bestätigungen inline mit nächstem Schritt | Auswahl + Anfrage auslösen | |
| M1 | Motion | Nur Tokens aus 2.6, nur `transform`/`opacity`, Reduced Motion wirkt, kein globales Lenis | Code + Emulation `prefers-reduced-motion` | |
| P1 ★ | Performance | LCP ≤ 2,5 s (Lab, mobil), CLS ≤ 0,05, zusätzliches JS durch UI ≤ 10 KB | Lighthouse mobil, Bundle-Analyzer | |
| R1 ★ | Recht/Ethik | Keine Dark Patterns, keine Händler-Claims, keine Superlative, keine Fake-Knappheit | Textprüfung, Claims-Liste `digital/14` | |
| B1 | Marke | Wirkt eigenständig und editorial („Atelier, nicht Shop“), erkennbar anders als Höttges, reiter, Gamma, Fretz | Blindtest: 5 Personen, 5-Sekunden-Test, Zuordnung „Premium / Standard“ | |
| B2 | Konsistenz | Gleiche Funktion sieht überall gleich aus (Button, Link, Kachel, Abstand) | 3 Seitentypen vergleichen | |

**Auswertung:** ≥ 75 Punkte = als Basis für das System geeignet · 55–74 = geeignet nach Nacharbeit der Kriterien mit 0–1 Punkt · < 55 oder ein K.-o.-Kriterium = nur einzelne Ideen übernehmen. Weil die drei Prototypen unterschiedliche Konzepte zeigen, ist auch ein Mischergebnis erlaubt. Dann werden Tokens und Komponenten des Siegers übernommen, starke Einzelideen der anderen werden als Varianten in den Styleguide aufgenommen.

---

## Quellen

- Lindgaard, G., Fernandes, G., Dudek, C., Brown, J. (2006): Attention web designers: You have 50 milliseconds to make a good first impression! *Behaviour & Information Technology* 25(2), 115–126.
- Reinecke, K. et al. (2013): Predicting users’ first impressions of website aesthetics with a quantification of perceived visual complexity and colorfulness. *CHI 2013*.
- W3C Design Tokens Community Group: Design Tokens Format Module 2025.10, https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/ und https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/
- Tailwind CSS v4 Dokumentation, Theme variables, https://tailwindcss.com/docs/theme
- W3C: Web Content Accessibility Guidelines (WCAG) 2.2, https://www.w3.org/TR/WCAG22/
- W3C WAI-ARIA Authoring Practices Guide, Patterns (Disclosure Navigation, Dialog), https://www.w3.org/WAI/ARIA/apg/patterns/
- Baymard Institute: Horizontal Filtering and Sorting Design, https://baymard.com/blog/horizontal-filtering-sorting-design
- Nielsen Norman Group: Mega Menus Work Well for Site Navigation, https://www.nngroup.com/articles/mega-menus-work-well/
- Projektintern: `Marktresearch/digital/01`, `02`, `12`, `13`, `14`; `Marktresearch/23-masterkonzept.md` Abschnitt 4.
