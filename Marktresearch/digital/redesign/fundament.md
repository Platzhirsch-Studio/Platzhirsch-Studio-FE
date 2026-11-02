# Paket „Fundament“ – Tokens, Schriften, Motion-Fix, UI-Bausteine, Logo

**Stand:** 26.10.2026 · **Branch:** feature/neuauftritt · **Grundlage:** Design-Bibel `expertenrat/00-design-bibel.md` (§3–§9, §13, §17). Ein Jury-Urteil (`qa-screenshots/jury/00-jury-urteil.md`) gab es zum Zeitpunkt noch nicht. Die Logo-Seiten der Prototypen habe ich nur gelesen.

## 1. Geänderte und neue Dateien

| Datei | Änderung |
|---|---|
| `src/app/globals.css` | komplett neu: Tokens als `@theme static` (3 Ebenen), responsive Abstände/Z-Skala in `:root`, Base-Layer, Motion-Fix, Fokusring, Komponentenklassen `.ph-*` |
| `src/app/[locale]/layout.js` | nur die Schriften und die `<html>`-Klassen: Bodoni Moda (latin, opsz), Bodoni Kursiv (nicht vorgeladen), Instrument Sans (latin), Montserrat als Altlast (`preload: false`) |
| `src/components/Reusable/FadeInView.js` | reines CSS, Server-tauglich, keine JS-Sperre für Inhalte mehr |
| `src/components/ui/*` (neu) | 19 Bausteine + `index.js` |
| `src/components/Brand/*` (neu) | `Logo.js` (Logo, Monogram, Wordmark), `brandPaths.js` (Konturen), `index.js` |
| `Marktresearch/digital/redesign/messages-fundament.json` | Textvorschlag `ui.leitsatz`, `ui.breadcrumbs` (DE/EN/FR/IT) |

Für die Sichtprüfung lief kurz eine Prüfseite `src/app/[locale]/zz-fundament-check/` (noindex). Sie ist **wieder gelöscht**. Es gibt keine neue Route.

## 2. Ursache und Lösung: Scroll-Reveal lief in Chrome nicht

- **Ursache:** Tailwind 4 und Next 16 schicken das CSS durch Lightning CSS. Mit modernen Browserzielen (im Dev `last 1 chrome version`, nach dem geplanten Browserslist-Update auch in Produktion) wird `animation: reveal linear both; animation-timeline: view();` zur Kurzschreibweise `animation: linear both reveal view();` zusammengezogen. Chrome akzeptiert keine Timeline in der Kurzschreibweise `animation`, verwirft deshalb die ganze Deklaration, und `.reveal` bewegt sich nie. Nachgewiesen im ausgelieferten Chunk `src_app_globals_*.css` und mit `lightningcss.transform` (Ziel Chrome 140 wird zusammengezogen, Chrome 90 nicht).
- **Lösung:** `--ph-timeline: view(); animation-timeline: var(--ph-timeline);`. Einen `var()`-Wert kann der Minifier nicht auswerten, darum bleibt die Langform erhalten, und zwar **nach** der Kurzschreibweise. Das ist in Dev und minifiziert geprüft. In Chrome gemessen: `animationTimeline = view()` auf `/de`.
- Zusätzlich gekapselt in `@supports (animation-timeline: view())` und `@media (prefers-reduced-motion: no-preference)`. Der Schalter „Ruhige Ansicht“ (`html[data-motion="reduced"]`) ist schon vorgesehen.
- Bewegt wird nur `transform`, höchstens 24 px (§8.2). Die Deckkraft bleibt bei 1, also gibt es keinen Kontrastverlust für axe und Crawler.
- **Bitte nicht** zu `animation-timeline: view()` „vereinfachen“.

## 3. Tokens

### Farben (Utilities: `bg-*`, `text-*`, `border-*` …)

| Ebene 1 (roh) | Wert | Ebene 2 (Rolle, in Komponenten verwenden) | zeigt auf |
|---|---|---|---|
| `paper` | #faf8f4 | `surface` | paper (Seitengrund, Body) |
| `bone` | #f7f5f1 | `surface-raised` | bone (Produktkachel, Karte) |
| `stone` | #ece8e1 | `surface-band` | stone |
| `linen` | #e6e1d8 | `surface-inverse` | walnut (**1× pro Seite**) |
| `stone-deep` | #d8d2c8 | `text` | ink |
| `pebble` | #8a8174 | `text-soft` | ink-soft |
| `ink-soft` | #5c636a | `text-accent` | brass-700 |
| `ink` | #30373e | `text-inverse` / `text-inverse-soft` | paper / stone-deep |
| `ink-deep` | #1f252b | `accent-on-dark` | brass-400 |
| `walnut` | #3f3129 | `line` / `line-strong` | Ink 12 % / 24 % |
| `see` | #4f6b68 | `line-inverse` | Paper 18 % (auf Walnut) |
| `brass-400` | #d1b250 (nie auf Hell) | `line-control` | pebble |
| `brass-500` | #9a7a2a | `action` / `action-hover` | ink / ink-deep |
| `brass-700` | #7a5f17 | `focus` / `focus-on-dark` | ink / brass-400 |
| `error` · `success` · `notice` | #9b2c2c · #2f6b4a · #8a5a00 | | |

Die Utility für die Textfarbe heißt dann z. B. `text-text`, `text-text-soft`, `bg-surface-band`, `border-line`.
**Altnamen bleiben bestehen** (die alte Seite nutzt sie): `gold` (= brass-400), `gold-text` (= brass-700), `ink`, `ink-deep`, `stone`, `bone`, `walnut`, `night`. Neuer Code nutzt nur die Rollen.

### Typografie (eine Klasse setzt Größe, Zeilenhöhe, Laufweite und Gewicht)

| Utility | Größe | Schrift (Klasse dazu) |
|---|---|---|
| `text-display-xl` | 48–96 px | `font-display` (Bodoni 400, nur Hero, 1× pro Seite) |
| `text-display-l` | 40–64 px | `font-display` (H1 Unterseiten) |
| `text-display-m` | 32–44 px | `font-display` (H2, 500) |
| `text-title` | 22–26 px | Instrument 500 (H3) |
| `text-lead` | 20–22 px | Instrument 400 |
| `text-body` | 18 px | Instrument 400 |
| `text-ui` | 16 px | Instrument 500 (Knöpfe, Navigation, Felder) |
| `text-small` | 14 px | Meta, Fehlertext |
| `text-overline` | 12 px, +0,14 em | dazu `uppercase`, nur hier Versalien |

Familien: `font-sans` = Instrument Sans (Body-Standard), `font-display` = Bodoni Moda, `font-display-italic` = Bodoni Kursiv (Leitsatz, Zitate). `tabular` setzt tabellarische Ziffern. Überschriften laufen automatisch mit `text-wrap: balance`, Absätze mit `pretty`. Die Zeilenbreite begrenzt `max-w-measure` (68ch).

### Raster, Abstände, Ebenen

- `px-gutter` (20 / 48 / 80 px), `gap-grid` (16 / 24 / 32 px), `mt-stack-s` (8 / 8 / 12 px), `mt-stack-m` (24 / 32 / 40 px), `py-section` (96 / 128 / 176 px), `h-header` (56 / 72 px). Breakpoints: 768 und 1280 px.
- `max-w-page` 1440 px, `max-w-text` 720 px, `max-w-measure` 68ch.
- `rounded-pill` nur für Zähler und Avatare, sonst gibt es keine Radien. `shadow-overlay` nur für Mega-Menü, Modal, Sheet und Toast.
- Z-Skala als CSS-Variablen: `z-(--z-header)`, ebenso `--z-sticky` 20, `--z-cta-bar` 45, `--z-menu` 50, `--z-overlay` 60 und `--z-toast` 70.

### Motion

- `ease-quiet`, `ease-quiet-inout`, `ease-exit`, `ease-drift`, `ease-pop` (nur Herz und Zähler).
- Dauern über `duration-(--duration-micro)`. Verfügbar sind `--duration-ack` 50, `-micro` 160, `-swap` 240, `-ui` 280, `-morph` 400, `-enter` 600, `-exit` 180 und `-slow` 1200 ms, außerdem `--stagger-step` 60 und `--stagger-max` 240.
- Klassen: `.reveal` / `.ph-reveal` (Scroll-Reveal), `.ph-horizon__line` (Linie zeichnet sich). Die Altklassen `.hero-reveal`, `.hero-zoom` und `.marquee` bleiben bis zum Umbau, auf neuen Seiten gilt: kein Hero-Zoom (W12).

### Fokus

Ring 2 px Ink, 2 px Abstand und ein Paper-Halo, sichtbar auf jedem Grund. Innerhalb von `[data-surface="inverse"]`, `.bg-walnut`, `.bg-ink`, `.bg-ink-deep` und `.bg-night` wechselt er auf Messing.

## 4. Bausteine – `import { … } from "@/components/ui"`

Alle Bausteine sind Server-tauglich (kein `"use client"`, nicht async). Sie lassen sich aus Server- und Client-Komponenten importieren. Interne Links laufen über `@/i18n/navigation` (Pfad **ohne** Locale), externe Links, `tel:`, `mailto:` und `#` bleiben `<a>`.

| Baustein | Props |
|---|---|
| `Container` | `as`, `size`: `page` \| `text` \| `full` |
| `Section` | `as="section"`, `tone`: `surface` \| `raised` \| `band` \| `inverse` (setzt `data-surface`, Messinglinie oben, **1× pro Seite**), `spacing`: `default` \| `compact` \| `none`, `contained`: `true` \| `"text"` \| `false`, `labelledBy`, `containerClassName` |
| `Heading` | `level` 1–4, `size`: `display-xl` \| `display-l` \| `display-m` \| `title` \| `subtitle` (Standard je Level: L / M / title / subtitle), `tone`: `text` \| `inverse`, `id` |
| `Eyebrow` | `as="p"`, `tone`: `accent` \| `soft` \| `inverse` \| `inverse-soft` |
| `Lead` | `tone`: `text` \| `soft` \| `inverse` |
| `Button` | `variant`: `primary` \| `secondary` \| `ghost` \| `link`, `href` (dann Link), `onDark`, `arrow`, `fullWidth`, `type`, sonst Attribute für `button` oder `a`. Höhe 48 / 52 px, höchstens **1 primary pro Ansicht** |
| `LinkArrow` | `href`, `tone`: `text` \| `accent` \| `inverse`; Ziel 44 px |
| `Horizon` / `Hairline` | `tone`: `light` \| `dark`. Horizon ist dekorativ, 1× pro Seite, die Platzierung (ca. 38 %) macht der Abschnitt |
| `Card` | `href`, `title`, `eyebrow`, `text`, `image {src, alt}`, `ratio`, `sizes`, `headingLevel` (3), `footer`. Die ganze Karte ist klickbar über `::after` |
| `ProductCard` | `href`, `image {src, alt}`, `hoverImage {src}` (nur auf Geräten mit Hover), `brand`, `name`, `meta`, `badge`, `sizes`, `preload`, `headingLevel` (3). Bild 4:5 auf Bone |
| `Badge` | `tone`: `neutral` \| `band` \| `inverse`. Nur Fakten aus dem Backoffice |
| `Grid` | `as`, `cols`: 1 \| 2 \| 3 \| 4 \| 12 (mobil zuerst, Lücke `gap-grid`) |
| `Media` | `src`, `alt`, `ratio`: `21/9` \| `4/5` \| `3/2` \| `1/1` \| `9/16`, `sizes` (**immer die echte Breite**), `preload` (nur LCP; `priority` ist in Next 16 veraltet), `quality`, `fit`, `imgClassName`, `children` (Overlay) |
| `Accordion` / `AccordionItem` | `items [{id, title, content, open}]` oder Kinder, `name` (exklusiv), `headingLevel`. Natives `<details>` |
| `Breadcrumbs` | `items [{label, href?}]` (letzter Eintrag = aktuelle Seite), `schema` (BreadcrumbList JSON-LD, **nur wenn die Seite selbst keine ausgibt**), `tone` |
| `CTABand` | `eyebrow`, `title`, `text`, `primary {href, label}`, `secondary`, `leitsatz`, `tone`: `band` \| `raised` \| `inverse`, `id` |
| `Leitsatz` | `size`: `m` \| `l` \| `xl`, `tone`, `align`, `as="p"`, `children` (überschreibt). Text aus `ui.leitsatz` mit Fallback je Sprache |
| `SmartLink`, `cx` | Hilfen |

`FadeInView` (`@/components/Reusable/FadeInView`) behält die alte API (`as`, `direction` top/bottom/up/left/right/none, `distance` ≤ 24, `delay` → Staffelung, `duration` → Länge der Strecke, `scale`). `threshold` und `once` werden ignoriert.

## 5. Logo – `import { Logo, Monogram, Wordmark } from "@/components/Brand"`

- `Logo` mit `variant`: `horizontal` (Header) \| `stacked` \| `wordmark` \| `monogram`, dazu `tagline` (Zusatzzeile, unter 160 px Breite weglassen), `tone`: `ink` \| `paper` \| `brass` (**nur auf Dunkel**) \| `current`, `className` (Höhe setzen, z. B. `h-7 w-auto`), `title`, `decorative`.
- `Monogram` mit `size` (px Höhe), `favicon` (ohne Augsprosse, kräftigerer Strich für 16–24 px), `tone`.
- `Wordmark` mit `className` (mobil `h-5`) und `tone`.
- Konzept „Stangen“: P und H teilen sich die Stämme, die oben als Geweihstangen mit je 2 Enden (Stange und Augsprosse) weiterwachsen. Raster 48 × 60 (12 × 15), Sprossen in 30°.
- Die Wortmarke ist **als Kontur gezeichnet**: aus Bodoni Moda 500, opsz 96, +180/1000 em. Die Zusatzzeile stammt aus Instrument Sans 500, +140/1000 em, auf 28 % der Versalhöhe. Beide Schriften stehen unter SIL OFL. Die Haarstriche sind per 0,7er Kontur verstärkt.
- Alle Teile nutzen `currentColor`, `role="img"` und `aria-label="Platzhirsch Home Living"`.

## 6. Schriften

- Vorgeladen werden nur Bodoni Moda (latin, opsz) und Instrument Sans (latin), also 2 Dateien. latin-ext bleibt über `unicode-range` erreichbar.
- Bodoni Kursiv lädt erst, wenn ein Leitsatz oder Zitat gerendert wird.
- Montserrat ist nicht mehr Body-Schrift. Die Familie bleibt mit `preload: false` registriert, weil die Labs-Module `var(--font-montserrat)` lesen. Auf normalen Seiten wird sie nicht geladen (geprüft: `document.fonts` auf `/de` enthält nur Bodoni und Instrument). `src/app/not-found.js` lädt Montserrat selbst.

## 7. Prüfung

- `/de`, `/de/produkte` und `/de/kontakt` liefern 200, ebenso `/de/ueber-uns/karriere` (dort ist FadeInView im Einsatz).
- Screenshots liegen in `qa-screenshots/neuauftritt/fundament/`. Es gibt keinen horizontalen Überlauf, auch nicht bei 375 px in Chromium.
- In zwei Android-Läufen kam es zu einem Timeout bei `networkidle`, weil der Dev-Server parallel neu kompilierte. Ersatzweise liegen Aufnahmen mit 375 px (`*--android-375-full.png`) bei.
- Auf `/de/kontakt` meldet die Konsole einen React-Fehler, der von `Kontakt` kommt (fremdes Paket, nicht geändert).
- ESLint für alle eigenen Dateien: 0 Fehler, 0 Warnungen.

## 8. Sichtbare Folgen für die alte Seite (bewusst)

- Fließtext und UI in Instrument Sans statt Montserrat.
- Seitengrund Paper `#faf8f4` statt Weiß, Grundtextfarbe Ink statt `#171717`.
- Fokusring Ink mit Halo statt Gold (Gold auf Hell hatte nur 1,94:1).

## 9. Offene Punkte für Integration und Teams

1. `messages-fundament.json` in `src/messages/*.json` übernehmen (Paket „Recht & Texte“). Bis dahin greifen die Fallbacks.
2. Tailwind-Standardradien und -schatten auf `initial` setzen (§6), **erst nach** dem Umbau aller Bereiche, weil die alte Seite `rounded-*` und `shadow-*` nutzt.
3. `scroll-padding-top` auf 88 px umstellen, wenn der neue Header (56 / 72 px) live ist.
4. Montserrat entfernen, sobald Labs keine Variable `--font-montserrat` mehr nutzt. Den Noscript-Style `[data-fade-in]` in `layout.js` entfernen (FadeInView setzt das Attribut nicht mehr).
5. Browserslist in `package.json` auf Chrome/Edge 111, Safari 16.4, Firefox 128 heben (§13). Der Reveal-Fix ist dafür schon robust.
6. Logo: Markenrecherche (EUIPO, DPMA, ÖPA, Swissreg, FL) und Reinzeichnung durch einen Schriftgestalter, dann Fünf-Sekunden-Test (§3). Favicon und OG-Logo (`/Images/Navbar/Logo.png` im JSON-LD) erst danach tauschen.
7. Hinweis: Bodoni zeigt bei 32–44 px (`display-m`) mit `opsz` auto sehr feine Haarstriche. Beim Umbau ist zu prüfen, ob H2 auf hellem Grund ruhig genug wirkt, sonst gilt dort `font-variation-settings: "opsz" 28`.
8. Gemäß §9 gehören künftige Client-Inseln nach `components/islands/`, zusammengesetzte Bausteine nach `components/patterns/`.

## 10. Benötigte Bilder

Keine für dieses Paket. Die Bausteine nutzen einen `linen`-Platzhalter, bis echte Bilder vorliegen (Shotliste §7).
