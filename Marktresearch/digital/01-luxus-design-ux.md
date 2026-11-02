# 01 – Luxus-Design & UX: Bauplan „exklusiv, ruhig, editorial“

**Stand:** 26.10.2026 · Rolle: Design-Direktion Luxus & UX · Grundlage: Code-Audit `src/` (nur gelesen, nichts geändert), Next.js-16-Doku in `node_modules/next/dist/docs/`, Berichte 00, 20, 23 (Abschn. 1, 4, 9, 10), 25, Benchmark-Abrufe (hoettges.at, minotti.com) sowie Fachwissen zu RH, Aesop, Bottega Veneta, Poliform, Conran Shop, AmbienteDirect und Connox.
**Leitsatz:** Die Website soll sich anfühlen wie der Showroom mit Café: großzügig, warm, gastgebend und sachkundig. Sie soll nicht wirken wie ein Möbelportal mit 1.765 Kacheln.

> Spielregeln aus 23/25 gelten auch für das Design: **keine Händler-Behauptungen** bei Minotti/Poliform (kein „offizieller Partner“, keine Markenlogos als Siegel), **Bildrechte vor Bildgröße** und **Pflegeaufwand ≈ 0** für ein Team aus ca. 5 Personen. Jedes Modul muss sich aus vorhandenen Daten (Backoffice, `src/lib/content`, `src/messages`) speisen oder einmalig redaktionell gesetzt werden.

---

## 1. Ist-Zustand im Code

### 1.1 Designsystem (Tokens, Typografie, Bewegung)
| Bereich | Befund | Datei |
|---|---|---|
| Farb-Tokens | Gute Basis: `gold #d1b250`, `gold-text #7a5f17` (kontrastsicher), `ink #30373e`, `stone #ece8e1`, `bone #f7f5f1`, `walnut`, `night`, `ink-deep` im `@theme` | `src/app/globals.css` |
| Token-Disziplin | **Schwach.** `#30373e` steht noch **291-mal**, `#d1b250` **296-mal** als Hex-Literal im Code statt `text-ink`/`bg-gold`. Ein Farbwechsel kostet heute hunderte Edits | quer durch `src/components/**` |
| Typografie | Bodoni Moda (Display, `opsz`-Achse) und Montserrat (UI/Text) über `next/font`, selbst gehostet | `src/app/[locale]/layout.js` |
| Typo-Anwendung | `font-display` nur **31-mal** genutzt. Viele Abschnittstitel sind noch Montserrat `text-lg uppercase` (z. B. `WhyChooseUsSectionHome.js:38`, `ProuductSectionHome.js:28`), daneben **123× `uppercase`**. Es gibt also zwei typografische Stimmen gleichzeitig | Home-, Shop- und Marken-Komponenten |
| Formensprache | **136× `rounded-lg/xl/2xl/full`** und **61 Schatten** (z. B. Markenseite `rounded-xl shadow-lg`, Produktkarten `rounded-lg border shadow`). Daneben stehen eckige `rounded-[3px]`-Buttons. Das wirkt eher „SaaS/Shop“ als „Atelier“ | `markenitems.js`, `[product]/page.js`, `shopCatalog.js` |
| Akzente | Goldbalken `h-1 w-20 rounded-full bg-[#d1b250]` unter Titeln (Markenseite). Ein typisches Template-Muster, das bei Luxusmarken nicht vorkommt | `MarkenItems/markenitems.js:62, 194` |
| Bewegung | Vorbildlich zurückhaltend: `hero-reveal`, `hero-zoom`, scroll-getriebenes `.reveal` (CSS `animation-timeline`), Marquee, alles mit `prefers-reduced-motion` | `globals.css` |
| Fokus/Barrierefreiheit | Globales `:focus-visible` in Gold, Skip-Ziel `<main id="main">` | `globals.css`, `client-layout.js` |

### 1.2 Seitentypen
| Seitentyp | Ist | Bewertung |
|---|---|---|
| **Startseite** `src/app/[locale]/page.js` | Reihenfolge: Hero → BrandWall (Marquee + Logo-Raster) → CategoryTiles (editoriales Raster) → About → TrendingProducts (8 neueste Minotti) → WhyChooseUs → SeoIntro (FAQ) → RegionLinks → Blog → ShowroomCta | Solide SEO-Dramaturgie, aber **zehn Abschnitte ohne Rhythmus**: Alle haben dasselbe Gewicht, es gibt keinen ruhigen „Atemraum“. Der Showroom (das stärkste Argument: Café, 800 m², Samstag) kommt erst ganz unten. Menschen, Referenzprojekte und Bewertungen fehlen |
| **Hero** `components/Home/Hero.js` | Vollflächiges Minotti-Foto, H1 in Bodoni, 2 CTAs (Gold + Outline), 3 Häkchen-Trust-Punkte, Markenzeile | Technisch gut (Server-Komponente, ein H1). Gestalterisch zu voll: Eyebrow, H1, Lead, 2 Buttons, 3 Häkchen und 7 Marken sind **sechs Ebenen über dem Falz**. Die Häkchen-Liste wirkt nach Discounter. **Das Bild ist ein Herstellerfoto (Minotti)** → Bildrechte-Risiko an prominentester Stelle. `priority` ist in Next 16 **deprecated** (`image.md`: „use `preload`“ bzw. `fetchPriority="high"`), 30 Fundstellen im Code |
| **Navigation** `components/Navbar/navbar.js` (1.239 Zeilen, Client) | 3 Ebenen Desktop: dunkle Topbar (Kontakt/Social) → weiße Zeile mit Logo, Suche (Pille), Merkliste, Sprache mit Flaggen → Menüzeile in Versalien. Mega-Menü „Produkte“ mit 6 Gruppen und 2 Bildkacheln. Mobil: Drawer von rechts mit Akkordeons | Header **ca. 190 px hoch** (siehe `scroll-padding-top: 12rem`). Bei Luxusmarken sind es 64–80 px. Flaggen als Sprachsymbol (fachlich falsch: Sprache ≠ Land). „Marken“, der stärkste Suchcluster, steckt **unter „Über uns“** versteckt. Gold-Hover überall. Monolithische Client-Komponente, schwer wartbar |
| **Markenübersicht** `components/MarkenClient/Marken.js` | Raster der Marken | ok, aber ohne Haltung (alle Marken gleich groß) |
| **Markenseite** `components/MarkenItems/markenitems.js` | Hero 600/800 px mit Verlauf, Story mit Goldbalken und Zitat-Box, Slider (react-slick) mit `rounded-xl shadow-lg`, Kollektionskarten `h-[280px] rounded-lg`, Karten mit `rounded-2xl` | Inhalt gut, Form generisch. Keine „Markenwelt“: Jede Marke sieht gleich aus, es gibt keine Materialien, keinen Designer-Fokus, kein „im Showroom zu sehen“ |
| **Kategorie/Katalog** `components/ShopCatalog/shopCatalog.js` | Filter-Sidebar 272 px als Karte mit Schatten, Mobile-Filter als Drawer von links, Chips, Ergebniszahl | Funktional stark. Gestalterisch wie ein Marktplatz (Connox-Muster), nicht wie ein Atelier. Karten mit Rahmen und Schatten, Bilder in unterschiedlichen Formaten |
| **Produktseite** `src/app/[locale]/produkte/[category]/[product]/page.js` | 2 Spalten: Galerie (react-slick, `productGallery.js`, 431 Zeilen) + Info (Marke in Gold-Versalien, H1 Bodoni, Designer, Tags, `ProductActions` mit Merkliste/Anfrage, Bullets mit Häkchen), Tabs (`productInfoTabs.js`), Maßzeichnung (`dimensionDiagram.js`), Kollektions-Slider, ähnliche Produkte | Guter Kern (Maßzeichnung ist ein Plus). Es fehlen Preisrahmen, „im Showroom zu sehen“, Lieferzeit, Materialmuster, Ansprechperson mit Gesicht und ein ruhiger Kaufpfad. Der Hintergrund-Verlauf `from-gray-100 via-gray-50` wirkt technisch |
| **Merkliste/Anfrage** `components/CartPage/CartPage.js`, `context/CartContext.js` | Merkliste mündet in `AnfrageFormProduct` | Richtiges Modell für Luxus („Auswahl“, nicht „Warenkorb“). Sprache und Gestaltung sind noch zu sehr Shop |
| **Mobile** | `MobileCtaBar.js`: feste Leiste „Anrufen | Termin“ ab 640 px Scroll | Gut und konversionsstark. Kollidiert aber mit dem Cookie-Banner und dem Mobile-Filter. Hero `min-h-150` ok |
| **Footer** `components/Reusable/Footer.js` | `bg-ink-deep`, 194 Zeilen | Funktional. Kein Newsletter-Versprechen, kein Showroom-Bild |
| **Bibliotheken** `package.json` | `react-slick` 0.31 + `slick-carousel` (5 Dateien, inkl. Theme-CSS), `react-icons` (2 Dateien), `react-share` (1 Datei), `lucide-react` | slick ist alt, nicht barrierearm und lädt CSS global. `react-icons` und `react-share` sind für jeweils 1–2 Stellen unnötig |

### 1.3 Stärken, auf denen wir aufbauen
- Server-Komponenten auf der Startseite, ein H1, JSON-LD, 4 Sprachen, `next/image` mit AVIF/WebP, Motion mit `reduced-motion`, Token-Ansatz in `@theme`. **Die Technik ist besser als bei jedem regionalen Wettbewerber.** Das Design muss jetzt nachziehen.

---

## 2. Benchmark

### 2.1 Was die Besten weltweit machen
| Vorbild | Muster | Für Platzhirsch übernehmen |
|---|---|---|
| **Minotti** (minotti.com) | Mega-Menü getrennt nach **Indoor / Outdoor** mit Vorschaubildern; „Be Inspired“ filtert Projekte nach Typologie (Residential, Hotel, Yachting); Download-Bereich mit Profilen (Architekt, Presse, Händler); Bildbedingungen untersagen Veränderung und freie Weiterverwendung | Indoor/Outdoor-Achse im Menü, **Projekte nach Typologie** (Privat, Hotel, Ferienhaus, Büro), Architekten-Bereich. **Minotti-Bilder nur nach schriftlicher Freigabe** |
| **Poliform** | Ganze Räume statt Einzelprodukte („Wohnen / Schlafen / Küche“), sehr helle Hintergründe, Groteskschrift, viel Weißraum, ruhige Videos | Raum-zuerst-Navigation („Wohnen, Küche, Schlafen, Outdoor, Licht“) |
| **RH** (Galleries) | Der Showroom ist das Produkt: „Gallery“-Seiten mit Café/Restaurant, Interior-Design-Service prominent, große Serifentitel, fast monochrome Fotos, keine Rabattsprache | **Showroom + Café als Hauptdarsteller**, „Interior Design Service“ als eigener Navigationspunkt |
| **Aesop** | Jeder Laden hat eine eigene Seite mit Architekturgeschichte; Text vor Bild; warme Off-White-Töne; kleine, präzise Typografie; Beratung im Laden als Ritual | Showroom-Seite als Geschichte (Architektur, Café, Team). Warme Papier-Hintergründe statt Reinweiß |
| **Bottega Veneta** | Radikale Reduktion: Logo, wenige Wörter, Vollbildfotos, Produkt als Skulptur, keine Badges, keine Sterne | Mut zur Leere. Max. ein Satz pro Bild |
| **The Conran Shop** | Editorial-Shop: Kuratierte Geschichten („The Edit“), Produkte innerhalb von Artikeln kaufbar, Designerportraits | **„Die Auswahl“** als kuratierte Edit-Seiten (z. B. „Wohnen am See“), die Produkte verlinken |
| **AmbienteDirect / Connox** | Große Kataloge mit Preisen, Filtern, Lieferzeit, Beratungshotline, Bewertungen | Filtertiefe, Lieferzeit-Angabe, „Persönliche Beratung“-Box. Gestalterisch **nicht** übernehmen (Marktplatz-Optik) |

### 2.2 Was die regionalen Wettbewerber (nicht) haben
| Wettbewerber | Befund (eigener Abruf 26.10.2026 bzw. Bericht 20) |
|---|---|
| **Höttges** (hoettges.at) | 5 Menüpunkte (Planung, Projekte, Brands, Team, Kontakt), Erstberatungs-Kachel „2h Interior Design“, gute Projekt-/Moodboard-Sprache. **„Termin“-Knopf öffnet nur eine E-Mail**, kein Kalender, keine Produkte, keine Preise. Markenlogos als Vertrauenssignal |
| **reiter design** | 400+ Marken laut Falstaff, 4.500 m². Website war beim Abruf nicht erreichbar (DNS-Fehler). Kein Shop mit Preisen, kein Online-Termin (Bericht 20) |
| **Dolce Vita Feldkirch** | Keine Website gefunden (20) |
| **Hutle, Fretz, Gamma** | Gamma und Fretz haben einen Online-Termin, Gamma zeigt nur Rabatte. **Keiner zeigt Bewertungen auf der Website** (20) |
| **Gesamtbild** | Niemand in der Region hat: Produktseiten auf Modellebene, Online-Kalender **und** editoriales Design, Referenzprojekte nach Typologie, Bewertungen, mehrsprachig |

**Folgerung:** Höttges gewinnt heute im Gefühl (Planung, Persönlichkeit), Platzhirsch in der Masse (Katalog). Das Zielbild verbindet beides: **Höttges-Haltung mit Platzhirsch-Katalogtiefe.**

---

## 3. Konzept / Zielbild „exklusiv, ruhig, editorial“

### 3.1 Drei Prinzipien
1. **Gastgeber, nicht Händler.** Die erste Botschaft heißt „Willkommen im Haus“ und nicht „36 Marken“. Café, Showroom, Menschen und Projekte stehen vorn, die Marken sind der Beweis.
2. **Ein Gedanke pro Bildschirm.** Jede Sektion hat ein Bild, einen Titel, höchstens zwei Sätze und eine Handlung. Die Dichte entsteht durch Tiefe (Unterseiten), nicht durch Fülle.
3. **Material statt Dekor.** Keine Goldbalken, Schatten, Pillen oder Häkchen. Die Struktur entsteht durch Raster, feine Haarlinien (1 px, 12 % Ink), Papiertöne und Typografie.

### 3.2 Designsystem 2.0

**Farbe** (Erweiterung der vorhandenen Tokens in `globals.css`, keine neue Palette):
| Token | Wert | Rolle |
|---|---|---|
| `--color-paper` (neu) | `#faf8f4` | Standard-Seitenhintergrund (warm, statt `#ffffff`) |
| `--color-bone` | `#f7f5f1` | Sekundärflächen |
| `--color-stone` | `#ece8e1` | ruhige Bänder (Kategorien, Showroom) |
| `--color-ink` | `#30373e` | Text, Linien (12 %/24 % Alpha) |
| `--color-walnut` | `#3f3129` | einziger dunkler Abschnitt pro Seite (Showroom/Footer) |
| `--color-gold` | `#d1b250` | **nur noch** als Mikroakzent: aktiver Menüpunkt, Fokusring, Merklisten-Zähler. Keine Flächenbuttons mehr |
| `--color-gold-text` | `#7a5f17` | kleine Akzenttexte auf Hell |
| Primärbutton (neu) | Ink-Fläche, Paper-Text, `rounded-none` | ersetzt Gold-Button |

Regel: maximal **eine** dunkle Fläche pro Seite, Gold unter 2 % der Fläche.

**Typografie:**
- Display: **Bodoni Moda bleibt** (OFL, schon geladen), aber **nur ab 32 px**, mit `opsz` und in Gewicht 400–500. Die Haarstriche brechen darunter auf Bildschirmen weg.
- Text/UI: **Montserrat ersetzen** durch eine ruhige Grotesk mit normaler Laufweite. Montserrat ist breit und geometrisch und wirkt in Versalien laut. Vorschlag: **Instrument Sans** (Google Fonts, OFL 1.1, variabel, ca. 25–35 kB woff2 latin+latin-ext über `next/font`) oder **Hanken Grotesk** (OFL). Beide 2 Wochen im A/B-Test gegen Montserrat an der Startseite prüfen.
- Skala (fluid, `clamp`): Display XL 56–96 px / Display L 40–64 / Display M 32–44 / Titel 22–26 / Text 17–18 px (Zeilenhöhe 1,6, max. 68 Zeichen) / Klein 14 / Overline 12 px mit Sperrung 0,14 em. **Versalien nur für Overlines.**
- Zahlen: `font-variant-numeric: tabular-nums` für Maße und Preise.

**Raster und Weißraum:**
- 12 Spalten, Container 1440 px, Ränder 24 px mobil / 48 px Tablet / 80 px Desktop.
- Vertikaler Rhythmus mit 8-px-Basis. Sektionsabstand 96 px mobil, **160–200 px Desktop** (heute 80–112 px).
- Asymmetrie als Prinzip: Text in Spalten 2–6, Bild in 7–12 bzw. versetzt. Keine zentrierten Überschriften mit Goldstrich.

**Formen:** `rounded-none` für Bilder, Karten und Buttons (Minotti, Poliform und BV sind eckig). Haarlinien statt Schatten. Ausnahme: Merklisten-Zähler und Avatare.

**Bildsprache:**
- **Eigene Fotografie zuerst**: Showroom, Café, Vignetten, Team bei der Arbeit, Referenzhäuser am See, Materialdetails (Leder, Bouclé, Eiche) in ruhigem Seitenlicht, warm, leicht entsättigt.
- Formate fest: 4:5 (Produkt, Hochkant), 3:2 (Raum), 16:9 bzw. 21:9 (Hero). Kein Mischmasch.
- Menschen nur beiläufig (Hände, Rücken, Café-Szenen). Keine Stockfotos (`images.unsplash.com` steht noch in `next.config`!).
- Herstellerbilder nur mit dokumentierter Freigabe, mit Quellenvermerk in der Bilddatenbank.
- Lokale Hardware (NVIDIA): **eigene** Fotos per Real-ESRGAN (BSD-3) hochrechnen, per `rembg` (MIT) freistellen und per Batch-Skript in AVIF/WebP-Derivate umwandeln. **Keine KI-generierten Raumbilder als echte Referenzen ausgeben** (UWG).

**Bewegung:** Die vorhandene CSS-Motion bleibt. Neu: **Seitenübergänge mit Reacts `<ViewTransition>`**, das laut `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` im App Router ohne Konfiguration funktioniert. Damit wird z. B. das Produktbild in der Liste zum Galeriebild der Produktseite. `<Link transitionTypes>` (ab 16.2, `link.md`) liefert die Richtung. **0 kB zusätzlich**, ohne Unterstützung im Browser bleibt alles statisch. **Kein** Smooth-Scroll-Hijacking (Lenis o. Ä.) und keine Parallax-Bibliotheken.

**Stimme (Text):** Sie statt Du, kurze Sätze, keine Superlative („größte“, „beste“), keine Rabattsprache außer im Atelierverkauf. Marken werden „geführt“ bzw. „gezeigt“ und nie „offiziell vertreten“ (Ausnahme: ClassiCon, belegt).

### 3.3 Informationsarchitektur (neu)
```
Wohnen   Küche   Outdoor   Marken   Projekte   Das Haus      [Suche] [Auswahl ♡ 3] [DE]  ( Termin )
                                                  └ Showroom & Café · Interior Design · Team · Journal · Kontakt
```
- **Raum zuerst** (Wohnen, Küche, Outdoor; Schlafen und Licht unter Wohnen): So denken Kunden, und es entspricht Poliform/RH.
- **Marken** wird Hauptpunkt (heute unter „Über uns“), weil hier die stärkste Suchnachfrage liegt (25, H1).
- **Projekte** (neu) als Beweis statt Behauptung (Höttges hat das, wir brauchen es).
- **Termin** als einziger gefüllter Knopf im Header.
- Sprachumschalter ohne Flaggen: „DE · EN · FR · IT“.

---

## 4. Konkrete Features

> Aufwand: **S** ≤ 3 PT, **M** 4–10 PT, **L** > 10 PT (1 Entwickler). Bundle-Größen sind min+gzip und gerundet (Stand der genannten Version laut Bundlephobia/Paketangabe; vor Einbau mit `next build` und Analyzer gegenprüfen).

### F1 – Designsystem-Fundament: Tokens, Typo, Formen (Refactoring)
- **Nutzen:** Er ist die Voraussetzung für alles Weitere. Einheitlicher Auftritt hebt Vertrauen und Verweildauer. Saubere Tokens machen künftige Änderungen 1-Zeilen-Edits. Ranking: indirekt (CLS/LCP stabil, Engagement).
- **Aufwand:** M (Tokens S; Ersetzen der ~590 Hex-Literale und 136 Rundungen per Codemod und Sichtprüfung M).
- **Abhängigkeiten:** keine.
- **Dateien:** `src/app/globals.css` (Tokens `paper`, Skala via `@theme`, Utilities `.overline`, `.hairline`, Typo-Klassen), `src/app/[locale]/layout.js` (Fontwechsel), alle Komponenten mit `#30373e`/`#d1b250`. Neu: `src/components/ui/Button.js`, `ui/Section.js`, `ui/Overline.js`, `ui/Hairline.js`. Neu: interne Seite `src/app/[locale]/styleguide/page.js` (`noindex`) als lebendes Designhandbuch für das Team, statt Storybook.
- **Bibliotheken:** `clsx` 2.1.1 (MIT, ca. 0,3 kB) für Klassen-Varianten. Keine UI-Bibliothek.
- **Nebenbei:** `priority` → `preload` bzw. `fetchPriority="high"` (Next-16-Deprecation, 30 Stellen).

### F2 – Neuer Header und Mega-Menü „Raum zuerst“
- **Nutzen:** Der Header schrumpft von ca. 190 auf 72 px, damit gewinnt die mobile Ansicht 20–30 % sichtbare Fläche. „Marken“ und „Termin“ werden mit einem Klick erreichbar. Interne Verlinkung der Raum- und Markenseiten stärkt deren Ranking. Ein sauberes Menü als Server-Komponente reduziert JavaScript.
- **Aufwand:** M–L (navbar.js mit 1.239 Zeilen in Server-Gerüst + kleine Client-Inseln zerlegen).
- **Abhängigkeiten:** keine. Menüdaten aus `src/messages/*.json` (`ProductsMenu.groups`) und `fetchKategorienWithCounts`.
- **Dateien:** ersetzt `src/components/Navbar/navbar.js` durch `Navbar/Header.js` (Server), `Navbar/MegaMenu.js`, `Navbar/MobileMenu.js`, `Navbar/SearchDialog.js`, `Navbar/LocaleSwitch.js` (Client-Inseln). `client-layout.js`, `globals.css` (`scroll-padding-top` auf 5rem).
- **Wireframe Desktop:**
```
┌───────────────────────────────────────────────────────────────────────────────┐
│ PLATZHIRSCH          Wohnen  Küche  Outdoor  Marken  Projekte  Das Haus   ⌕  ♡3  DE  [ Termin ] │  72 px, paper, Haarlinie unten
└───────────────────────────────────────────────────────────────────────────────┘
 Hover „Wohnen“ → Panel volle Breite, paper, 1 Haarlinie:
 ┌─────────────┬─────────────┬─────────────┬───────────────────────────────┐
 │ SITZEN      │ ESSEN       │ SCHLAFEN    │ [Bild 4:5 Showroom-Vignette]   │
 │ Sofas  (212)│ Esstische   │ Betten      │  Neu im Showroom               │
 │ Sessel      │ Stühle      │ Kleiderschr.│  Minotti Lawrence →            │
 │ Daybeds     │ Sideboards  │ Nachttische │                               │
 │ LICHT       │ TEPPICHE    │             │ [Bild] Interior Design →       │
 └─────────────┴─────────────┴─────────────┴───────────────────────────────┘
 Hover „Marken“ → 3 Spalten Markennamen in Bodoni alphabetisch, rechts 1 Bild, „Alle 36 Marken →“
```
- **Mobil:** 56 px Leiste: Logo links, rechts ⌕ ♡ ☰. Menü als **Vollbild-Overlay** von unten (nicht Drawer rechts) mit großen Bodoni-Einträgen (32 px), Ebenen schieben horizontal, unten fixiert „Termin buchen“ und „Anrufen“.
- **Bibliotheken:** Native **Popover API** + `<dialog>` (0 kB, ab Safari 17 / Chrome 114; für ältere Safari-Versionen aus `browserslist` (safari ≥ 15) einfacher Fallback mit Zustand). Alternative bei Bedarf: `@radix-ui/react-navigation-menu` 1.2.x (MIT, ca. 12 kB) für vollständige Tastatursteuerung.

### F3 – Startseite: neue Dramaturgie
- **Nutzen:** Der Showroom und die Menschen rücken nach oben. Das ist das stärkste Konversionsargument (23, 4.2 Nr. 1) und das, was kein Wettbewerber digital zeigt. Interne Links auf Marken, Räume und Regionen bleiben vollständig erhalten (SEO). Ziel: Termin-Klicks von der Startseite +30 % (mit `src/lib/analytics.js` messbar).
- **Aufwand:** M.
- **Abhängigkeiten:** **eigene Fotos** (Showroom, Café, Team, 2–3 Projekte), keine Backoffice-Felder nötig. Statische Inhalte zunächst in `src/lib/content/home.js`, später ins Backoffice.
- **Dateien:** `src/app/[locale]/page.js`, `components/Home/Hero.js`, `BrandWall.js`, `CategoryTiles.js`, `ShowroomCta.js`, `SeoIntro.js`; neu `Home/HouseIntro.js`, `Home/ProjectsTeaser.js`, `Home/EditStrip.js`, `Home/Voices.js`. Entfallen bzw. verschmolzen: `WhyChooseUsSectionHome`, `ProuductSectionHome` (wird zu EditStrip), `about.js` (react-slick raus).
- **Wireframe (Desktop / Mobil gestapelt):**
```
1  HERO (100svh, eigenes Showroom-Foto 21:9 bzw. 4:5 mobil)
   Overline: LOCHAU · BODENSEE
   H1 (Bodoni XL, 2 Zeilen): „Italienisches Wohnen am Bodensee.“
   1 Satz Lead · [ Termin im Showroom ]  Showroom & Café entdecken →
   (keine Häkchen, keine Markenzeile, kein Verlauf über das ganze Bild – nur unten 30 %)

2  ATEMRAUM – HAUS-INTRO (paper, 200 px Luft)
   links Spalten 2–6: Overline DAS HAUS · Bodoni L „800 m², ein Café und Zeit für Ihr Projekt.“ · 2 Sätze · Öffnungszeiten inkl. Samstag
   rechts 7–12: Café-Foto 4:5, versetzt nach unten

3  RÄUME (stone-Band) – Wohnen · Küche · Schlafen · Outdoor
   4 hohe Bilder 3:4 nebeneinander (mobil: horizontal wischbar, Snap), Bodoni M darunter, Anzahl Produkte klein

4  MARKEN – typografisch statt Logos
   Bodoni-Namensliste in 3 Spalten (Minotti, Poliform, Rimadesio … 12), Hover zeigt rechts ein Bild
   Unterzeile klein: „36 Marken im Haus“ · Alle Marken →   (Marquee kann bleiben, ruhiger: 80 s)

5  PROJEKTE – 1 großes Projekt 16:9 + 2 kleine; Ort, Typologie, „Küche + Wohnen + Outdoor“
   → Projekte ansehen

6  DIE AUSWAHL (Edit) – „Diesen Herbst im Showroom“: 4 Produkte 4:5, kein Rahmen,
   Marke (Overline) / Name (Bodoni) / „im Showroom“  – kuratiert, nicht „neueste Minotti“

7  STIMMEN – 1 Kundenzitat groß in Bodoni, Name/Ort, ★ 4,9 aus N Google-Bewertungen (nur echt, nur wenn ≥ 20)

8  BERATUNG – walnut-Fläche (einzige dunkle): Gesicht der Beraterin, „Interior Design ab dem ersten Termin“
   [ Termin wählen ]  Anrufen · WhatsApp

9  JOURNAL + REGIONEN (paper) – 3 Artikel, darunter Haarlinie und Regionen als Textlinks in einer Zeile
10 FAQ (SeoIntro, Akkordeon, zurückhaltend) → Footer
```
- **Bibliotheken:** keine. Wisch-Leisten per CSS `scroll-snap`, 0 kB.

### F4 – Markenwelten (Template mit Charakter je Marke)
- **Nutzen:** Markenseiten sind der Haupt-Landeplatz für „Minotti Vorarlberg“ & Co. (25, H1). Eine Seite, die tiefer ist als die der Vertragshändler (Kollektionen, Designer, Materialien, „im Showroom“), hält Besucher und erzeugt Termine – ganz ohne Händler-Behauptung.
- **Aufwand:** M (Template) + S je Marke für Feinschliff (Akzentbild, Zitat).
- **Abhängigkeiten:** Bildrechte je Marke (Minotti-Bildbedingungen: keine Veränderung); optionale Backoffice-Felder `akzentfarbe`, `showroom_highlights` (bis dahin aus `src/lib/marken/*` bzw. `lib/content/brands.js`).
- **Dateien:** `components/MarkenItems/markenitems.js`, `collectionDetail.js`, `components/MarkenClient/Marken.js`, `src/app/[locale]/ueber-uns/marken/[title]/page.js` und `[collection]/page.js`; neu `MarkenItems/BrandHero.js`, `BrandFacts.js`, `ShowroomHighlights.js`.
- **Wireframe:**
```
HERO 80svh: Bild der Marke (freigegeben) · Overline ITALIEN · SEIT 1948 · H1 „Minotti“ (Bodoni XL)
            1 Satz Haltung · [ Minotti im Showroom erleben ]   Kollektionen ↓
FAKTEN-ZEILE (Haarlinien, 4 Spalten): Herkunft · Gründung · Designer (z. B. Rodolfo Dordoni) · bei uns zu sehen: 14 Stücke
STORY: Spalten 2–7 Text (max. 3 Absätze), 8–12 Detailfoto Material; Zitat Bodoni M ohne Box, ohne Goldbalken
KOLLEKTIONEN: Raster 3 Spalten, Bilder 4:5, Name Bodoni, Anzahl Varianten · Filter-Chips Indoor/Outdoor
IM SHOWROOM: 3–6 eigene Fotos der Ausstellungsstücke + „Ausstellungsstück, sofort verfügbar“ (wenn Flag)
BERATUNG: Ansprechperson mit Foto „Ihre Ansprechpartnerin für Minotti“ · [ Termin ]
FAQ zur Marke (Preisrahmen, Lieferzeit, Schweiz) → FAQPage-JSON-LD
Rechtlich unten klein: „Platzhirsch zeigt und plant mit Möbeln von Minotti.“ (kein „offizieller Händler“)
```
- **Markenübersicht:** alphabetische Bodoni-Liste mit Länderkürzel und Kategorie, rechts schwebendes Vorschaubild beim Hover. Mobil: Liste mit Miniatur 1:1. Kein Logo-Raster mehr (Logos sind Markenzeichen der Hersteller; als „Siegel“ heikel).
- **Bibliotheken:** Ersatz `react-slick` → **`embla-carousel-react` 8.6.x** (MIT, ca. 7 kB inkl. Kern, ohne globales CSS, barrierearm steuerbar) **oder** reines CSS-Scroll-Snap (0 kB). Empfehlung: Scroll-Snap überall, Embla nur in der Produktgalerie.

### F5 – Produktseite „Atelier“
- **Nutzen:** Hier entscheidet sich die Long-Tail-Strategie (25, H1). Zusammen mit dem Bauplan der Preis-/SEO-Rolle bringt sie bessere Konversion: klare Handlung, Vertrauen (Mensch, Showroom), Materialien. Bild-Morphing aus der Liste erhöht die wahrgenommene Qualität.
- **Aufwand:** M (Layout) + S (ViewTransition) + M (Galerie mit Zoom).
- **Abhängigkeiten:** Preisrahmen, Ausstellungs-Flag, Lieferzeit = **Backoffice-Felder (blockiert)**. Das Layout reserviert die Plätze und blendet sie aus, solange die Felder leer sind. Material-/Bezugsbilder nur mit Bildrechten.
- **Dateien:** `src/app/[locale]/produkte/[category]/[product]/page.js`, `components/ShopCatalog/productGallery.js` (react-slick raus), `productActions.js`, `productInfoTabs.js` (Tabs → ruhige Akkordeons/Abschnitte), `dimensionDiagram.js`, `collectionSlider.js`, `wishlistHeart.js`; neu `ShopCatalog/ProductFacts.js`, `ShopCatalog/AdvisorCard.js`.
- **Wireframe Desktop:**
```
Breadcrumb (klein, ink/60)
┌──────────────────────────────── 7 Spalten ─────────┬──────── 5 Spalten (sticky) ─────────┐
│ Galerie: 1 großes Bild 4:5, darunter 2er-Raster    │ MINOTTI (Overline, Link zur Marke)  │
│ weiterer Bilder, Klick → Vollbild-Lightbox mit Zoom │ H1 „Lawrence“ (Bodoni L)           │
│ (kein Slider mit Pfeilen)                          │ Design Rodolfo Dordoni              │
│                                                    │ ─────────────────────────────────── │
│                                                    │ Preis auf Anfrage | ab € … (Feld)   │
│                                                    │ ● Im Showroom Lochau zu sehen (Flag)│
│                                                    │ Lieferzeit ca. 10–14 Wochen (Feld)  │
│                                                    │ [ Beratung zu diesem Stück ]  (Ink) │
│                                                    │ ♡ Zur Auswahl hinzufügen  (Text)    │
│                                                    │ ─────────────────────────────────── │
│                                                    │ [Foto] Anna M., Interior Design     │
│                                                    │ „Ich zeige Ihnen Bezüge und Maße.“  │
│                                                    │ Anrufen · WhatsApp                  │
└────────────────────────────────────────────────────┴─────────────────────────────────────┘
ABSCHNITTE (statt Tabs, alles crawlbar): Beschreibung · Maße (Zeichnung, tabular) · Materialien
  & Bezüge (Musterfelder) · Lieferung AT/DE/CH/FL · Pflege · Downloads
AUS DER KOLLEKTION (Scroll-Snap 4:5) · ÄHNLICH (4 Stück) · Journal-Artikel zum Thema
```
- **Mobil:** Galerie als Vollbreite-Wischleiste mit Zähler „1/6“, darunter Titel. Die feste Leiste unten wird **kontextuell**: „♡ | Beratung zu Lawrence“ statt der allgemeinen MobileCtaBar.
- **Bibliotheken:** **`yet-another-react-lightbox` 3.2x** (MIT, ca. 12 kB Kern + Zoom-Plugin ca. 3 kB, nur bei Klick per `next/dynamic` laden) **oder** `photoswipe` 5.4.4 (MIT, ca. 14 kB, dynamisch). React `<ViewTransition>` für das Morphing (0 kB).

### F6 – Katalog „Galerie statt Marktplatz“
- **Nutzen:** Längere Sitzungen, mehr Produktaufrufe pro Besuch, mehr Merklisten-Einträge. Filterseiten bleiben crawlbar (SEO unverändert).
- **Aufwand:** M.
- **Abhängigkeiten:** keine (Layout). Für Facetten „im Showroom“ und „Preisrahmen“ sind Backoffice-Felder nötig.
- **Dateien:** `components/ShopCatalog/shopCatalog.js`, `shopCategoryGrid.js`, `src/app/[locale]/produkte/page.js`, `[category]/page.js`.
- **Wireframe:** Kategorie-Kopf mit Bodoni-Titel + 2 Sätzen + 1 Raumfoto 21:9. Darunter **horizontale Filterleiste** (Marke, Designer, Material, Farbe; Dropdown-Panels) statt Sidebar-Karte, rechts Sortierung und Zähler. Raster 3 Spalten Desktop / 2 mobil, **einheitlich 4:5**, Bild auf `bone` freigestellt, ohne Rahmen und Schatten. Unter dem Bild Overline Marke, Name in Text 17 px, Herz erst beim Hover (mobil immer). Nach jeder 12. Kachel ein **redaktionelles Element** (Raumbild über 2 Spalten, „So wirkt Lawrence im Raum“ oder Beratungshinweis). Mobile Filter als **Bottom-Sheet**.
- **Bibliotheken:** `vaul` 1.1.2 (MIT, ca. 5 kB + Radix Dialog ca. 6 kB) für das Bottom-Sheet **oder** natives `<dialog>` + CSS (0 kB, empfohlen).

### F7 – Projekte (Referenzen) als neue Inhaltsart
- **Nutzen:** Der stärkste Hebel gegen Höttges (die ihre Projekte zeigen) und für Hotel-/Bauträger-Leads (23, Abschn. 8). Seiten, die Architekten gern verlinken (25, H7), und Bildmaterial, das **uns gehört**.
- **Aufwand:** M (Template + Übersicht mit Typologie-Filter), redaktionell 1 Projekt pro Monat.
- **Abhängigkeiten:** eigene Fotos, Einverständnis der Kunden (Ort ggf. anonymisieren). Zunächst als MDX/JS-Dateien im Repo, später Backoffice-Doctype „Projekt“.
- **Dateien neu:** `src/app/[locale]/projekte/page.js`, `projekte/[slug]/page.js`, `src/lib/content/projects/*.js`, `components/Projects/*`; Sitemap `src/app/sitemap-static.xml`.
- **Wireframe Projekt:** Vollbild-Hero → Fakten-Zeile (Ort, Typologie, Fläche, Leistungen: Küche, Wohnen, Outdoor, Zeitraum) → abwechselnd Bild-Paare und kurze Textblöcke („Die Aufgabe“, „Die Lösung“) → „Im Projekt verwendet“ (verlinkte Produkte!) → Zitat Bauherr → [ Ihr Projekt besprechen ].
- **Bibliotheken:** keine. Optional `@next/mdx` (passend zur installierten Next-Version, MIT) für redaktionelle Projekte als Dateien.

### F8 – Showroom-&-Café-Seite + Termin-Erlebnis
- **Nutzen:** Das ist die Alleinstellung Nr. 1 (23, 4.2). Die Seite zeigt das Haus wie Aesop/RH es mit ihren Läden tun und schließt mit einem echten Kalender. Den hat nur Höttges nicht, Gamma und Fretz schon. Lokale Suchen („Designermöbel Bodensee Samstag“) profitieren mit `LocalBusiness`-JSON-LD inkl. `openingHoursSpecification`.
- **Aufwand:** S (Seite) + M (Kalender-Einbindung).
- **Abhängigkeiten:** Kalender-Werkzeug (Entscheidung Inhaber, Datenschutz/Consent), eigene Fotos.
- **Dateien:** `src/app/[locale]/ueber-uns/platzhirsch/page.js` (→ neu „Das Haus“), `components/UberUns/austellung.js` (react-slick raus), `components/BeratungClient/BeratungClient.js` (Ablauf in 3 Schritten: Anliegen → Termin → Kontakt, mit Fortschrittsanzeige).
- **Bibliotheken:** `@calcom/embed-react` 1.5.x (MIT; nur bei Klick laden, Consent beachten) mit Cal.com Cloud **oder** ein Buchungslink. Abstimmung mit dem Bauplan der Conversion-Rolle.

### F9 – Merkliste als „Ihre Auswahl“ (Sprache & Gestaltung)
- **Nutzen:** Höhere Abschlussquote der Anfrage. Luxuskunden „stellen zusammen“, sie „kaufen“ nicht in den Warenkorb.
- **Aufwand:** S.
- **Abhängigkeiten:** keine.
- **Dateien:** `components/CartPage/CartPage.js`, `components/AnfrageFormProduct/AnfrageFormProduct.js`, `src/app/[locale]/merkliste/page.js`, `src/messages/*.json`.
- **Wireframe:** Titel „Ihre Auswahl (3)“ · Liste mit Bild 4:5, Marke, Name, Notizfeld „Bezug/Farbe?“ · rechts „Auswahl im Showroom ansehen“ (Termin mit vorausgefüllter Auswahl) oder „Als PDF mitnehmen“ · Formular nur 4 Felder + Rückrufwunsch.
- **Bibliotheken:** PDF serverseitig über eine Route mit `@react-pdf/renderer` 4.x (MIT, nur Server, 0 kB Client). Optional, später.

### F10 – Performance- & Qualitätsgeländer
- **Nutzen:** Core Web Vitals sind Rankingfaktor. Luxus-Ästhetik darf nicht langsamer machen. Schutz vor Rückschritten bei einem kleinen Team.
- **Aufwand:** S–M.
- **Abhängigkeiten:** keine.
- **Inhalt:** `react-slick` + `slick-carousel`, `react-icons`, `react-share` entfernen (durch Scroll-Snap/Embla, `lucide-react`, Web Share API ersetzen). Hero-Bild ≤ 180 kB AVIF. `images.unsplash.com` aus `next.config.js` entfernen, sobald keine Stockbilder mehr genutzt werden. Visuelle Regressionstests und Barrierefreiheitsprüfung.
- **Bibliotheken (nur Dev):** `@playwright/test` 1.5x (Apache-2.0) für Screenshots von 6 Kernseiten × 3 Breiten; `@axe-core/playwright` 4.x (MPL-2.0) für A11y; `@next/bundle-analyzer` (MIT).

---

## 5. Risiken

| Risiko | Art | Gegenmaßnahme |
|---|---|---|
| **Herstellerbilder ohne Freigabe** (Hero ist heute Minotti, Markenseiten, 1.765 Produktbilder) | Recht (Urheberrecht; Minotti-Bedingungen verbieten Veränderung) | Bildregister (Quelle, Freigabe, Datum) anlegen. Hero, Haus und Projekte mit **eigenen Fotos**. Herstellerbilder nicht beschneiden oder einfärben (kein Duotone/Zoom-Crop ohne Erlaubnis). Freigaben mit den Listungsanfragen (25, H7) einholen |
| Händler-Anmutung durch Logos/Formulierungen | Recht (UWG) | Typografische Markennamen statt Logowand, Formel „zeigt und plant mit“, Ausnahme ClassiCon belegt |
| Bewertungen/Zitate erfunden oder geschönt | Recht (UWG, Omnibus-RL) | Modul „Stimmen“ erst ab ≥ 20 echten Google-Bewertungen, Quelle nennen |
| KI-Bilder als echte Räume | Recht/Vertrauen | Nur zur internen Planung. Kennzeichnen, falls öffentlich |
| Großzügiger Weißraum = mehr Scrollen, weniger Produkte im Blick | Konversion | Katalog bleibt dicht (2–3 Spalten), Weißraum vor allem auf Start-, Marken- und Projektseiten; mit Analytics prüfen |
| Bodoni bei kleinen Größen schlecht lesbar | UX | Bodoni erst ab 32 px, Text in Grotesk |
| Fontwechsel / große Bilder verschlechtern LCP/CLS | Performance | `next/font` mit `adjustFontFallback`, `sizes` korrekt, Hero `fetchPriority="high"`, Budget: LCP < 2,0 s mobil, JS pro Seite < 120 kB |
| View Transitions in Safari abweichend | Technik | Progressive Enhancement, Doku-Hinweis beachtet, ohne Unterstützung wird nicht animiert |
| Navbar-Umbau bricht Sprach-Routing (`routeTranslationMap`, `languageHref`) | Technik | Routing-Logik unverändert in `LocaleSwitch.js` übernehmen, Playwright-Test aller 4 Sprachen |
| Pflegeaufwand (Projekte, Edit, Showroom-Highlights) | Pflege | Jedes redaktionelle Modul hat einen automatischen Fallback (z. B. Edit = neueste Produkte mit Showroom-Flag, sonst ausblenden). Feste Taktung: 1 Projekt/Monat, 1 Edit/Quartal |
| Popover API fehlt in Safari 15/16 (laut `browserslist` unterstützt) | Technik | JS-Fallback mit Zustand oder Radix |

---

## 6. Priorisierte Reihenfolge

### Sofort baubar (ohne Backoffice-Zugang)
| # | Schritt | Aufwand | Blockiert durch |
|---|---|---|---|
| 1 | **F1 Designsystem-Fundament** inkl. `priority`→`preload`, Styleguide-Seite | M | – |
| 2 | **F2 Header + Mega-Menü** (Marken als Hauptpunkt, Termin-Knopf, 72 px) | M–L | – |
| 3 | **F3 Startseite** neue Dramaturgie (Inhalte zunächst in `src/lib/content`) | M | eigene Fotos (Fotoshooting Showroom/Café/Team – **1 Tag, sofort beauftragen**) |
| 4 | **F9 „Ihre Auswahl“** | S | – |
| 5 | **F5 Produktseite – Layout** mit Platzhaltern (ausgeblendet), Galerie + Lightbox, ViewTransition | M | – (Felder später) |
| 6 | **F6 Katalog-Galerie** (ohne neue Facetten) | M | – |
| 7 | **F4 Markenwelten – Template** | M | Bildrechte je Marke für neue Motive (bestehende Motive weiter nutzen) |
| 8 | **F10 Geländer** (Bibliotheken raus, Playwright/axe) | S–M | – |
| 9 | **F7 Projekte** (als Dateien im Repo) | M | Fotos + Kundeneinverständnis |
| 10 | **F8 Haus-Seite** (Seite sofort, Kalender nach Entscheidung) | S + M | Kalenderwahl/Consent |

### Blockiert / später
| Feature-Teil | Blocker |
|---|---|
| Preisrahmen, „im Showroom“, Lieferzeit auf Produkt- und Katalogseiten, Facetten dafür | Backoffice-Felder (kein Schreibzugang) |
| Projekte, Edit und Showroom-Highlights pflegbar im CMS | Backoffice-Doctypes |
| Neue Markenmotive, Materialmuster, Hero-Bilder der Marken | Bildfreigaben der Hersteller |
| Modul „Stimmen“ mit Sternen | ≥ 20 echte Google-Bewertungen (23, Abschn. 9) |
| Online-Kalender | Entscheidung Werkzeug, Datenschutzprüfung |

### Bibliotheks-Übersicht
| Paket | Version | Lizenz | Größe (gz, ca.) | Zweck | Status |
|---|---|---|---|---|---|
| React `<ViewTransition>` | in Next 16 enthalten | MIT | 0 kB | Seitenübergänge, Bild-Morphing | empfohlen |
| CSS Scroll-Snap / Popover API / `<dialog>` | nativ | – | 0 kB | Slider, Menü, Sheets | empfohlen |
| `embla-carousel-react` | 8.6.x | MIT | ~7 kB | Produktgalerie | empfohlen |
| `yet-another-react-lightbox` (+ Zoom) | 3.2x | MIT | ~12 + 3 kB, dynamisch | Vollbild-Zoom | empfohlen (alternativ `photoswipe` 5.4.4, MIT, ~14 kB) |
| `clsx` | 2.1.1 | MIT | ~0,3 kB | Varianten | empfohlen |
| Instrument Sans / Hanken Grotesk | Google Fonts via `next/font` | OFL 1.1 | ~25–35 kB Font | Text-Schrift | A/B-Test |
| `@calcom/embed-react` | 1.5.x | MIT | ~5 kB Loader, dynamisch | Termin | nach Entscheidung |
| `@radix-ui/react-navigation-menu` | 1.2.x | MIT | ~12 kB | Fallback Mega-Menü | optional |
| `vaul` | 1.1.2 | MIT | ~5 kB + Radix | Bottom-Sheet | optional |
| `@react-pdf/renderer` | 4.x | MIT | nur Server | Auswahl als PDF | später |
| `@playwright/test`, `@axe-core/playwright`, `@next/bundle-analyzer` | 1.5x / 4.x / passend zu Next | Apache-2.0 / MPL-2.0 / MIT | nur Dev | Qualität | empfohlen |
| **Entfernen:** `react-slick`, `slick-carousel`, `react-icons`, `react-share` | – | – | spart ~25–40 kB | – | – |
| **Nicht verwenden:** `lenis`, GSAP-ScrollTrigger, `framer-motion`/`motion` (~30+ kB) | – | – | – | Scroll-Hijacking, Gewicht, A11y | – |

**Lokale GPU (NVIDIA), nur für eigene Fotos:** Real-ESRGAN (BSD-3-Clause) zum Hochrechnen, `rembg` (MIT) zum Freistellen, `sharp` (Apache-2.0, ist in Next enthalten) für das Batch-Skript nach AVIF/WebP. ComfyUI (GPL-3.0) höchstens intern für Moodboards, nie als Referenzbild.

---
*Hinweis: Versionsangaben und Bundle-Größen sind Richtwerte und vor dem Einbau mit `npm view <paket> version` und dem Bundle-Analyzer zu prüfen. reiter-design.at war beim Abruf am 26.10.2026 nicht erreichbar, rh.com blockierte den Abruf (403). Die Bewertung stützt sich dort auf Bericht 20 und Fachkenntnis.*
