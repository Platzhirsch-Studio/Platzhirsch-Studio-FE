# Prototyp „Bühne“: filmischer Neuauftritt

Stand: 26.10.2026 · Status: klickbarer Design-Prototyp, nur `de`, `noindex, nofollow`

| Screen | URL (Dev-Server) |
|---|---|
| Startseite | http://localhost:3000/de/preview/buehne |
| Markenseite Minotti | http://localhost:3000/de/preview/buehne/marken/minotti |
| Produktseite (echtes Minotti-Produkt „Lawrence“) | http://localhost:3000/de/preview/buehne/produkt/sofas-lawrence |
| Logo und Erscheinungsbild | http://localhost:3000/de/preview/buehne/logo |

Jedes Minotti-Produkt aus dem Katalog lässt sich unter `/de/preview/buehne/produkt/<path_field>` öffnen, z. B. `sofas-andersen`. Andere Marken, unbekannte Slugs und die Locales `en`/`fr`/`it` liefern 404.

---

## 1. Designidee

**Der Showroom als Bühne.** Die Website verhält sich wie ein Abend im Haus: Das Licht geht aus (dunkle Grundfläche), der Vorhang öffnet sich (Vollbild-Hero mit langsamem Bildzoom), und man geht Raum für Raum durch das Haus. Wohnen, Küche, Schlafen und Outdoor sind gestapelte Vollbild-Kapitel, die beim Scrollen übereinander gleiten. Gold kommt nur als Licht vor, also für Akzente, Fokus und den Haupt-CTA, nie als Fläche hinter Text.

Referenzen und was übernommen wurde:
- **RH Galleries:** Räume statt Produkte, großformatige Raumbilder, ruhige Serif-Headlines.
- **Apple-Produktseiten:** scroll-gekoppelte Kapitel (sticky), ein Gedanke pro Bildschirm.
- **Bottega Veneta:** große Typografie, sehr wenige UI-Elemente, kein Dekor.

Leitplanken aus 01 und 02 sind eingehalten. Inhalte sind ohne JavaScript sichtbar, es gibt keinen Preloader und keinen Custom Cursor, animiert werden nur `transform`, `opacity` und `clip-path`. Bei Reduced Motion ist alles statisch.

## 2. Farben

| Token | Hex | Einsatz | Kontrast auf Nacht |
|---|---|---|---|
| Nacht `--bu-night` | `#0E0D0C` | Grundfläche | – |
| Kohle `--bu-coal` | `#171513` | Zweitfläche (Showroom, Footer) | – |
| Knochen `--bu-bone` | `#EFE9DF` | Text, Logo | ca. 16:1 |
| Stein `--bu-mute` | `#B9AE9F` | Sekundärtext | ca. 9,3:1 |
| Gold `--bu-gold` | `#D1B250` | Akzent, Bildmarke, Fokusring, Primär-Button | ca. 9,6:1 |

Der Gold-Button hat Nacht-Text auf Gold (ca. 9,6:1). Auf Bildern liegen Verläufe von 35 bis 95 % Nacht, damit der Text über jedem Motiv lesbar bleibt.

## 3. Typografie

- **Display: Bodoni Moda** (OFL, Variable mit `opsz`). Die Schrift ist bereits im Locale-Layout geladen und wird über `--font-bodoni` wiederverwendet, es entsteht kein zweiter Download. Größen: Mega `clamp(3rem, min(10.5vw, 13svh), 10.5rem)`, H1 bis 6,5rem, H2 bis 4,5rem. Die Kursive trägt die emotionale zweite Zeile („für Ihr Zuhause.“).
- **Text: Instrument Sans** (OFL, über `next/font` selbst gehostet). Das ist der Montserrat-Ersatz aus Bauplan 01/F1. Fließtext 17 px, Overlines 12 px in Versalien mit 0,28em Laufweite und in Gold.

## 4. Logo-Konzept „Die Krone auf dem Punkt“

Inline-SVG in `src/components/Preview/buehne/Logo.js`:
- **Bildmarke:** ein Geweih aus einer feinen Linie (der Hirsch), das auf einer goldenen Raute ruht (der Platz, also das Haus in Lochau). Es funktioniert als Favicon, als Prägung und in einer Farbe.
- **Wortmarke:** PLATZHIRSCH in Bodoni mit 0,26–0,3em Laufweite, darunter HOME LIVING · LOCHAU in der Grotesk.
- Varianten: liegend (Header), gestapelt (Footer, Beschilderung), hell, dunkel und Gold einfarbig (Seite `/logo`).
- **Hinweis:** Die Wortmarke ist im Prototyp `<text>` mit Webfont. Für die Produktion muss ein Gestalter sie in Pfade umwandeln und feinjustieren (Kerning, die Laufweite am Ende bei zentriertem Satz).

## 5. Screens und Inhalte

**Startseite**
1. Vollbild-Hero (Raumbild, `preload` als LCP, einmaliger Zoom 1,08 → 1 in 4,8 s), Headline „Bühne frei für Ihr Zuhause.“, CTA „Termin vereinbaren“.
2. Statement „Das Haus“: Möbel im Raum zeigen, mit Licht, Stoffen und einem Kaffee.
3. Markenwelt: drei Markenkarten (Minotti → Prototyp-Markenseite, Poliform und Rimadesio → bestehende Markenseiten) und eine typografische Liste aller Marken aus dem Schema („führen wir in der Ausstellung“).
4. Räume: vier gestapelte Sticky-Kapitel Wohnen → Küche → Schlafen → Outdoor mit Kapitelindex, Bild-Zoom und Text-Reveal. Die Links führen zu bestehenden Seiten.
5. Showroom & Café: zwei Bilder mit Parallax und Masken-Reveal. Fakten: ca. 800 m² mit Café, Adresse, Öffnungszeiten, Lage zwischen Bregenz und Lindau, Routen-Link.
6. Dreiländer-Service: AT, DE, CH und FL als große Ländercodes, mit einem sichtbaren Prototyp-Hinweis.
7. Termin-CTA mit Bild-Parallax, „Beratung anfragen“ (→ `/de/beratung`) und Telefon.
8. Footer: gestapeltes Logo, Besuch, Kontakt, Prototyp-Navigation und eine große Wortmarke als Wasserzeichen.

**Markenseite Minotti:** Hero (orionMinoti.jpg), Markentext (Familienunternehmen aus Meda, seit 1948), Live-Zahlen aus dem Backoffice (zur Prüfung: 487 Produkte in 18 Kategorien) als Chips und eine kuratierte Auswahl: 01 Sofas (Lawrence und Andersen zuerst), 02 Sessel, 03 Couchtische, 04 Essen. Varianten desselben Modells werden zusammengefasst. Die Karten verlinken auf Prototyp-Produktseiten. Am Ende steht der CTA „Ein Sofa wählt man im Sitzen.“. Wortlaut durchgehend „Minotti-Ausstellung in Lochau“ / „Minotti bei uns erleben“, **ohne Händlerbehauptung**.

**Produktseite:** Embla-Galerie (bis 10 Bilder, Thumbnails, Pfeiltasten, Zähler mit `aria-live`, erstes Bild SSR und `preload`), dazu eine Info-Spalte (sticky ab Desktop) mit Marke und Kategorie, Name, Beschreibung aus dem CMS (erster Absatz, Rest unter „Mehr lesen“) und Spezifikationen, soweit im CMS vorhanden. CTA „In Lochau ansehen – Termin anfragen“, Telefon, ein Hinweis ohne Preis, ein Link zur aktuellen Katalogseite und „Mehr von Minotti“ (related_products).

**Datenquellen (nur lesend, nichts verändert):** `fetchProdukteNewByMarke`, `fetchProduktNewByPathField`, `fetchRelatedProdukteNew` (src/lib/api/fetchAllProdukte.js), `toShopProductDetail` (src/lib/shop/shopProducts.js), `cleanProductName` (src/lib/content/brands.js). Produktbilder kommen über `/cmx/…`, Raumbilder aus `public/Images`.

## 6. Animationen

| Effekt | Technik | Reduced Motion |
|---|---|---|
| Hero-Zoom 1,08 → 1, einmalig, 4,8 s (< 5 s, WCAG 2.2.2) | CSS-Keyframes, nur `transform`, Bild sofort voll sichtbar | aus |
| Hero-Text: Aufstieg und Masken-Reveal, gestaffelt 0/150/300 ms | CSS-Keyframes `transform` und `clip-path` | aus |
| Hero-Parallax und Ausblenden des Hero-Texts beim Scrollen | `animation-timeline: view()` | aus |
| Header wird beim Scrollen dunkel | `animation-timeline: scroll(root)` | bleibt Verlauf |
| Raum-Kapitel: gestapelte Sticky-Panels, Bild-Zoom 1,18 → 1, Text-Reveal | `position: sticky` und `view()` | Sticky bleibt, Zoom aus |
| Bild-Masken-Reveal (`clip-path`) und Parallax ±6 % | `view()` | aus |
| Smooth Scrolling | Lenis 1.3.27, dynamisch nachgeladen, `autoRaf`, `lerp 0.11`, `anchors` | **nicht geladen**; auch nicht auf Touch-Geräten |
| Galerie-Slide | Embla (`duration 28`) | `duration 0` (Sprung) |
| Hover: Bild-Scale, Linien-Unterstreichung | CSS-Transitions | ca. 0 ms |

**Wichtiger technischer Befund:** Lightning CSS (der CSS-Compiler von Next 16) fasst `animation` und `animation-timeline` in **eine** `animation`-Kurzschreibweise zusammen (`animation: linear both name view()`). Chrome 156 verwirft diese Deklaration komplett, dann läuft **keine** Scroll-Animation. Im Prototyp ist das gelöst, indem `animation-timeline`/`animation-range` in einer eigenen Regel (`.x:nth-child(n)`) stehen. Mit Playwright und Chrome geprüft: `animationTimeline: view()` ist aktiv.
→ **Dasselbe Problem betrifft die bestehende `.reveal`-Klasse in `src/app/globals.css`.** Auf `/de` liefert `getComputedStyle(.reveal).animationName` den Wert `none`. Die Scroll-Reveals der Live-Seite laufen also derzeit nicht. Sie sind nicht kaputt, weil der Inhalt sichtbar bleibt, aber wirkungslos. Die Korrektur gehört in `globals.css` (nicht Teil dieses Auftrags).

**Abweichung von Bauplan 02:** Dort ist Lenis ausdrücklich „bewusst nicht“ vorgesehen (INP, Barrierefreiheit). Der Auftrag für diesen Prototyp verlangt es. Kompromiss: Lenis lädt nur auf Geräten mit feinem Zeiger, ohne Reduced Motion, per `requestIdleCallback` und dynamischem Import, und es scrollt das native Fenster. Sticky, `view()`-Timelines, Anker und die Tastatur funktionieren weiter. Empfehlung für die Produktion: A/B-Test mit INP-Messung (F9 aus 02). Ohne messbaren Nutzen fällt Lenis wieder weg; die Bühne wirkt auch ohne.

## 7. Bibliotheken

| Bibliothek | Version | Einsatz | Lizenz |
|---|---|---|---|
| Lenis | 1.3.27 | Smooth Scroll (nur Desktop, siehe oben) | MIT |
| embla-carousel-react | 8.x | Produktgalerie | MIT |
| lucide-react | vorhanden | Icons | ISC |
| next/font (Instrument Sans, Bodoni Moda) | Next 16 | selbst gehostete Fonts | OFL 1.1 |
| CSS Scroll-Driven Animations | nativ | alle Scroll-Effekte | – |

`motion@12` wird bewusst **nicht** genutzt: Alles Nötige läuft mit CSS auf dem Compositor-Thread, das spart JS.

## 8. Performance-Messung

Gemessen am 26.10.2026 gegen den **Dev-Server** (`next dev`, unminifiziert, kein Produktions-Build). HTML per `curl`, Transfer, LCP und CLS mit Playwright und Chrome 156 bei 1440×900.

| Seite | HTTP | HTML roh | HTML gzip | Bilder (Erstaufruf) | LCP (lokal) | CLS |
|---|---|---|---|---|---|---|
| /de/preview/buehne | 200 | 211 kB | 46 kB | 216 kB | 1,06–1,76 s (Hero-Bild) | 0,000 |
| /de/preview/buehne/marken/minotti | 200 | 233 kB | 46 kB | 115 kB | 0,61 s (Hero-Bild) | 0,000 |
| /de/preview/buehne/produkt/sofas-lawrence | 200 | 213 kB | 46 kB | 115 kB | 0,52 s (Galeriebild 1) | 0,000 |
| /de/preview/buehne/logo | 200 | 165 kB | 39 kB | – | – | – |

- Ein großer Teil des HTML (ca. 30 kB gzip) ist das next-intl-Nachrichtenobjekt des globalen Layouts und betrifft jede Seite der Website, nicht nur den Prototyp.
- **Fonts:** Die Website lädt bereits ca. 170 kB (Montserrat und Bodoni, latin und latin-ext). Der Prototyp fügt Instrument Sans hinzu (ca. 40 kB). Wenn Instrument Sans Montserrat ersetzt, sinkt das Gesamtgewicht.
- **JS:** Im Dev-Modus sind es ca. 1,5 MB unminifiziert, das ist nicht aussagekräftig. Eigener Client-Code: `SmoothScroll` (Lenis ca. 5,5 kB gzip, erst bei Leerlauf) und `Gallery` (Embla ca. 7 kB gzip, nur Produktseite). Alles andere sind Server Components.
- Bilder laufen über `next/image` (AVIF/WebP, `sizes` gesetzt). Nur das LCP-Bild hat `preload`, alle anderen laden lazy.
- **Offen:** Messung im Produktions-Build (`next build && next start`) mit Lighthouse/LHCI gegen das Budget aus 02 (LCP ≤ 2,0 s mobil, CLS ≤ 0,05, INP ≤ 150 ms, JS initial ≤ 170 kB gzip). Laut Auftrag wurde kein Build ausgeführt.

## 9. Barrierefreiheit

- Ein H1 pro Seite, Sektionen mit `aria-labelledby`, Brotkrumen-Navigation und `aria-current`.
- Alt-Texte beschreiben das Motiv. Dekorative Hintergründe (CTA) haben `alt=""`.
- Fokusring in Gold (2 px, Offset 3 px). Mobiles Menü als natives `<details>`, funktioniert ohne JS. Zielgrößen ≥ 44–48 px.
- Galerie: Region `aria-roledescription="Karussell"`, Pfeiltasten, beschriftete Buttons, Zähler mit `aria-live`.
- `prefers-reduced-motion: reduce` schaltet alle Animationen und Lenis ab (mit Playwright geprüft).

## 10. Technische Umsetzung

- Dateien: `src/app/[locale]/preview/buehne/**` (layout, page, marken/minotti, produkt/[slug], logo) und `src/components/Preview/buehne/**` (Shell, Logo, Gallery, ProductCard, SmoothScroll, content, catalog, fonts, buehne.module.css).
- Das Layout prüft die Locale und setzt `robots: noindex, nofollow`. Jede Seite setzt es zusätzlich selbst.
- Navbar, Footer und mobile CTA-Leiste der Live-Seite werden per CSS (`body:has(.root) > header|footer|div.fixed.inset-x-0.bottom-0 { display: none }`) ausgeblendet, solange eine Bühne-Seite offen ist. `client-layout.js` und `globals.css` bleiben unverändert. Der Cookie-Banner bleibt sichtbar.
- Die Middleware `src/proxy.js` blockiert die Route nicht: `/de/preview/buehne` liefert 200, `/en|fr|it/preview/buehne` liefern 404.

## 11. Offene Punkte

1. **Video-Hero:** In `public/` gibt es kein Showroom-Video. Der Hero ist für ein `<video>` über dem Poster-Bild vorbereitet (Logik nach 02/F5: erst nach `load`, nicht bei Reduced Motion oder Save-Data, mit Pause-Knopf). Benötigt wird ein Clip von 8–15 s, z. B. ein Abend im Showroom, kodiert mit NVENC AV1 und H.264 auf der RTX 4060.
2. **Schlafen-Kapitel:** Es gibt kein eigenes Schlafzimmer-Bildmaterial, verwendet wird `Home/bannerImage-1.jpg` (1200 px breit, im Vollbild etwas weich). Benötigt wird ein Raumbild mit mindestens 2400 px oder ein Upscaling über die GPU-Pipeline.
3. **Dreiländer-Service:** Die Texte sind bewusst vorsichtig formuliert und mit einem Prototyp-Hinweis versehen. Festpreis in CHF, Verzollung und Montage je Land müssen vor dem Livegang bestätigt werden (Masterkonzept 23, Recherche 18).
4. **Showroom-Fakten:** „ca. 800 m² mit Café“ stammt aus der Recherche (01/23) und muss vom Inhaber bestätigt werden. Öffnungszeiten wie im Schema der Website (Sa 10–14 Uhr; im Masterkonzept ist Sa bis 17 Uhr geplant).
5. **Bildrechte:** Die Raumbilder in `public/Images` sind großteils Herstellermaterial (z. B. `orionMinoti.jpg`). Die Nutzung im Neuauftritt muss mit den Herstellern geklärt werden. Besser sind eigene Showroom-Fotos.
6. **Logo:** Die Wortmarke muss in Pfade umgewandelt und feinjustiert werden. Danach sind Favicon, Social-Avatar und Beschilderung abzuleiten.
7. **`.reveal` in globals.css** ist in Chrome wirkungslos (siehe Abschnitt 6). Korrektur durch den Verantwortlichen für `globals.css`.
8. **Lenis:** Ein A/B-Test mit INP-Feldmessung entscheidet über den Einsatz in der Produktion (Konflikt mit 02).
9. **Designer-Angaben:** Das Feld `designer` ist bei Lawrence im CMS leer. Die Zeile „Design: …“ erscheint, sobald es gepflegt ist.
10. **Produktions-Messung** mit LHCI (siehe Abschnitt 8).
