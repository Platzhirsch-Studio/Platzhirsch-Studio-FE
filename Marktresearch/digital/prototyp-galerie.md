# Prototyp „Galerie“ – ruhig, editorial, museal

**Stand:** 26.10.2026 · Status: klickbarer Design-Prototyp, nicht indexiert (`robots: noindex, nofollow`), nur `/de`
**Leitplanken:** 01-luxus-design-ux.md (Designsystem 2.0, Prinzipien „Gastgeber, nicht Händler“, „Ein Gedanke pro Bildschirm“, „Material statt Dekor“) und 02-animation-motion.md (CSS zuerst, nur `transform`/`clip-path`, Reduced Motion, Budget).

## URLs (Dev-Server)
| Screen | URL |
|---|---|
| Startseite | http://localhost:3000/de/preview/galerie |
| Markenseite Minotti | http://localhost:3000/de/preview/galerie/marken/minotti |
| Produktseite (Beispiel Minotti Lawrence) | http://localhost:3000/de/preview/galerie/produkt/sofas-lawrence |
| Jedes andere aktive Minotti-Produkt | `/de/preview/galerie/produkt/<path_field>` (z. B. `sofas-dylan`, `tables-connery`) |

`/en|fr|it/preview/galerie` → 404. Nicht-Minotti- oder unbekannte Produkte → 404.

## Designidee
Die Website als **Galerie**: Man betritt einen hellen, stillen Raum. Große Bilder hängen wie Werke an der Wand, Text steht daneben wie ein Saaltext. Kein Gold, keine Schatten, keine Rundungen, keine Häkchenlisten. Struktur entsteht nur durch Raster, Haarlinien (1 px, 14 % Ink), Papiertöne und Typografie. Pro Seite gibt es genau **eine dunkle Fläche** (Walnuss): Showroom & Café auf der Startseite bzw. „Minotti bei uns erleben“ auf der Markenseite, dazu der Footer.

Referenzen: Aesop (warmes Papier, Saaltext-Ton), The Row (Reduktion), Minotti.com (große Kampagnenbilder, Weißraum), Kinfolk (Serifen-Kursive als Stimme).

## Logo / Wortmarke „Der Platz“
Inline-SVG in `src/components/Preview/galerie/Logo.js`, durchgängig `currentColor` (funktioniert hell und dunkel).
- **Bildzeichen:** ein feines Quadrat, der „Platz“, ein Raum, den man betritt. Darin ein abstraktes Geweih aus zwei Haarlinien, die aus einem Punkt aufsteigen, je zwei Sprossen. Es ersetzt den goldenen Hirschkopf durch etwas Leiseres, das trotzdem „Hirsch“ sagt.
- **Wortmarke:** PLATZHIRSCH in weit gesperrten Garamond-Versalien. Optionale Unterzeile „HOME LIVING · LOCHAU AM BODENSEE“ in der Grotesk.
- Varianten: `full` mit Unterzeile (Footer), `full` ohne Unterzeile (Header), `mark` (Favicon, Social-Avatar, Stempel).
- Offen: Für den Livegang die Wortmarke in Pfade umwandeln (heute SVG-`<text>` mit Webfont) und das Zeichen in 16/32 px optisch nachzeichnen.

## Farben
| Token | Wert | Rolle | Kontrast |
|---|---|---|---|
| `--paper` | `#f5f2ec` | Seitenhintergrund | – |
| `--stone` | `#ebe5da` | ruhige Bänder (Marken, Handwerk, Termin) | – |
| `--ink` | `#1d1b18` | Text, Primärbutton | ca. 16:1 auf paper |
| `--ink-soft` | `#57514a` | Nebentext, Overlines | ca. 7:1 auf paper |
| `--line` | `rgb(29 27 24 / .14)` | Haarlinien | dekorativ |
| `--walnut` | `#2b2420` | einzige dunkle Fläche, Footer | – |
| `--on-walnut` / `-soft` | `#efe9df` / `#c3b9aa` | Text auf walnut | ca. 13:1 / 8:1 |
| `--bronze` | `#7a5a35` | nur Fokusring | ca. 5,5:1 |

Text auf dem Hero-Bild liegt über einem Verlauf (unten 62 % Schwarz) und ist weiß bzw. 86–92 % weiß.

## Typografie
- **Display:** Cormorant Garamond 300/400/500 + Kursiv (OFL, `next/font/google`, selbst gehostet). Nur ab 28 px. Die Kursive ist die „zweite Stimme“ in Headlines („Wohnen, *in Ruhe* ausgewählt.“).
- **Text/UI:** Instrument Sans (OFL, variabel), die in 01 empfohlene Alternative zu Montserrat. 17 px, Zeilenhöhe 1,6, max. ca. 38 em.
- **Skala (fluid):** Display 48–132 px · H1 44–104 · H2 36–72 · H3 28–36 · Zitat 30–56 · Overline 12 px, Sperrung 0,18 em. Versalien nur für Overlines, Navigation und Buttons.
- Maße, Öffnungszeiten: `tabular-nums`.
- Beide Fonts werden nur auf den Preview-Seiten geladen (in `fonts.js`, nicht im Root-Layout).

## Raster & Weißraum
Container 1440 px, Ränder 24/48/80 px. Sektionsabstand 112 / 160 / 200 px. 12-Spalten-Asymmetrie: Text in Spalten 2–6, Bild 8–12, Bilder versetzt (Raumkarten 0/120/48 px, Produktraster jede zweite Karte 64 px tiefer). Bildformate fest: 21:9 (Marken-Hero), 4:5 (Produkt, Termin), 3:4 (Räume), 3:2 (Showroom).

## Screens
**Startseite**
1. Header 64–72 px, sticky, Papier mit Blur und Haarlinie: Logo · Wohnen, Marken, Das Haus, Service · [Termin]. Mobil: „Menü“ öffnet ein Vollbild-Overlay mit großen Serifen-Einträgen (native Popover API).
2. Hero (100svh minus Header): ein Bild, Overline „Lochau · Bodensee“, H1 „Wohnen, *in Ruhe* ausgewählt.“, ein Satz, [Termin im Showroom], „Das Haus entdecken“.
3. Atemraum: ein Satz Haltung als großes Zitat („Gastgeber, nicht Möbelmarkt“).
4. Markenwelt: typografische Liste (Minotti → Markenseite des Prototyps, die anderen → bestehende Markenseiten), daneben ein sticky 4:5-Bild. Keine Logos als Siegel.
5. Räume: Wohnen / Küche / Outdoor, drei hohe Bilder versetzt; mobil horizontal wischbar (Scroll-Snap).
6. Showroom & Café (walnut): Bild, „Rund 800 m², *ein Café* und Zeit.“, Öffnungszeiten als Tabelle, Adresse, Route.
7. Dreiländer-Service: AT · DE · CH · FL als vier Spalten mit großen Länderkürzeln.
8. Termin-CTA: Bild + „Ein Termin, *eine Tasse Kaffee,* Ihr Projekt.“, Button, Telefon, E-Mail.
9. Footer (walnut): großes Logo, Besuch, Öffnungszeiten, Kontakt, Impressum/Datenschutz.

**Markenseite Minotti** (Daten live aus dem Backoffice: `getMarkenByName`, `fetchProdukteNewByMarke`)
Brotkrumen → Overline „Italien · seit 1948“, H1 „Minotti“ in Display-Größe, Lead „Minotti bei uns erleben …“, CTA → 21:9-Bild → Faktenzeile (Herkunft, Gegründet, Gründer, Anzahl Stücke im Katalog, live gezählt: 483) → Markengeschichte (CMS-Text, Absätze mit Platzhirsch-/Händler-Bezug werden automatisch verworfen) + Detailbild versetzt + Design-Haltung als Kursiv-Zitat → „Vier Disziplinen“ (Handwerk aus dem CMS-Feld `craft_disciplines`) → „Ausgewählte Stücke“ (8, versetztes Raster) → Reihen Sofas / Sessel / Esstische / Betten (Scroll-Snap) → „Minotti *bei uns erleben*“ (walnut) → Markenhinweis.

**Produktseite** (Daten live über `fetchProduktNewByPathField` + `toShopProductDetail`)
Links eine editoriale Bildstrecke (1 großes 4:5-Bild, darunter 2er-Paare, max. 7 Bilder), rechts eine sticky Info-Spalte: Marke (Link), H1, Kategorie, Einleitung, „Preis: Auf Anfrage“, [Beratung zu diesem Stück] (übergibt `?produkt=`), Anrufen, Showroom-Hinweis ohne Behauptung („Ob Lawrence gerade in unserer Ausstellung steht, sagen wir Ihnen gern …“). Darunter Details (Text + Datenblatt) und „Weitere Sofas von Minotti“.

## Animationen (alles CSS, 0 kB Motion-JS)
| Effekt | Technik | Dauer/Kurve |
|---|---|---|
| Hero-Bild „setzt sich“ | `scale(1.06 → 1)`, **volle Deckkraft ab dem ersten Paint** (LCP unberührt) | 2400 ms, `cubic-bezier(.22,1,.36,1)` |
| Hero-Headline Zeile für Zeile | `clip-path` + `translateY`, 140 ms versetzt | 1100 ms |
| Hero-Lead/Buttons | `translateY` + Opacity .35 → 1 | 900 ms, 420 ms verzögert |
| Langsame Bild-Reveals beim Scrollen | `clip-path: inset(18% 0 0 0) → 0` am Rahmen, Bild `scale(1.1 → 1)`; `animation-timeline: view()` | an Scroll gekoppelt (entry 0 % → cover 40–55 %) |
| Text-Reveals | `translateY(28px)` + Opacity .35 → 1, `view()`-Timeline | entry 0–70 % |
| Hover | Bild `scale(1.03)` über 1200 ms, Markenname rückt 10 px ein und wird kursiv, Unterstrich-Linien | 280 ms |
| Mobil-Menü | Popover mit `@starting-style` + `allow-discrete` | 280 ms |

Regeln: Scroll-Reveals nur unter `@supports (animation-timeline: view())` **und** `prefers-reduced-motion: no-preference`. Ohne Unterstützung oder mit Reduced Motion ist alles sofort und statisch sichtbar. Kein Inhalt startet bei `opacity: 0`. Kein Lenis, kein Motion/GSAP (laut 02 bewusst ausgeschlossen, obwohl installiert).

## Verwendete Bibliotheken
- `next/image` (AVIF/WebP, `sizes`, Lazy Loading; LCP-Bild mit `preload` + `fetchPriority="high"`, da `priority` in Next 16 deprecated ist)
- `next/font/google`: Cormorant Garamond, Instrument Sans
- `next/link`
- Native Web-APIs: Popover API, CSS Scroll-Driven Animations, CSS Scroll-Snap, `@starting-style`, `:has()`
- **Nicht verwendet:** motion, lenis, embla (Galerie und Reihen kommen mit Scroll-Snap aus), react-icons, lucide

Einzige Client-Komponente: `MobileMenu.js` (schließt das Popover nach Klick auf einen Anker, wenige hundert Bytes). Alles andere sind Server Components.

## Performance-Messung (curl gegen den Dev-Server, 26.10.2026)
| Seite | HTML roh | HTML gzip | `<img>` gesamt / davon lazy |
|---|---|---|---|
| Startseite | 196 kB | 43,6 kB | 14 / 12 |
| Markenseite Minotti | 339 kB | 53,2 kB | 66 / 64 |
| Produktseite Lawrence | 202 kB | 45,3 kB | 22 / 20 |

- LCP-Bild Startseite (`aboutHome.jpg` über `/_next/image`, AVIF): 22 kB bei 828 px, **93 kB bei 1920 px** (Budget aus 01: ≤ 180 kB). Produkt-LCP (Lawrence-01, 1200 px, AVIF): 46 kB.
- Ein großer Teil des HTML ist das RSC-Payload der bestehenden Seitenhülle (alle `messages` von next-intl und der Navbar), nicht des Prototyps.
- JS: Der Dev-Server liefert unminifizierte Bundles (23 Skripte, ca. 7,2 MB roh). **Das ist kein aussagekräftiger Wert.** Der Prototyp selbst fügt nur `MobileMenu` hinzu. Eine echte Messung (gzip-JS, LCP, CLS) braucht `next build` + Lighthouse. Das war in diesem Auftrag ausdrücklich nicht erlaubt.

## Technische Hinweise
- **Seitenhülle:** `src/app/[locale]/layout.js` → `client-layout.js` rendert für jede Route Navbar, Footer, MobileCtaBar und Cookie-Banner. Weil diese Dateien nicht geändert werden durften, blendet `galerie.module.css` die Hülle per `body:has([data-galerie]) > header/footer/…` aus. Das wirkt nur, solange der Prototyp im DOM ist. Der Cookie-Banner bleibt bewusst sichtbar. Folge: Das JS der alten Navbar wird trotzdem geladen, und der Prototyp liegt technisch im `<main>` der Hülle (der eigene Footer steht damit innerhalb von `main`). Für den Livegang muss die Hülle als Route-Group-Layout neu geschnitten werden.
- Die Middleware `src/proxy.js` blockiert `/de/preview/galerie` nicht (HTTP 200). `/en/preview/galerie` → 404 (`notFound()` im Layout und in jeder Seite).
- Keine Änderungen an `globals.css`, `src/lib/api` oder bestehenden Komponenten.

## Inhalte & Rechtliches
- Keine Händler-Behauptung. Verwendet werden nur: „Minotti bei uns erleben“, „Minotti in der Ausstellung in Lochau erleben“, „führen wir in der Ausstellung“. Der CMS-Text `dealers_description_de` („offizieller Minotti Händler“) wird **nicht** genutzt und sollte im Backoffice korrigiert werden.
- Fakten nur aus Live-Site und Backoffice: Adresse, Telefon, Öffnungszeiten (Di–Fr 10–18, Sa 10–14, Mo Ruhetag), Minotti 1948 / Meda / Alberto Minotti, Handwerkstexte, Produktbeschreibungen.
- „Rund 800 m²“ stammt aus dem Masterkonzept (23: „ca. 800 m² innen und außen, dazu das Café“). **Vor Livegang bestätigen.**
- Dreiländer-Service ist bewusst vorsichtig formuliert (AT: Lieferung und Montage; DE/CH/FL: „klären wir individuell“). Der CHF-Festpreis aus dem Masterkonzept ist noch kein Angebot und wird nicht versprochen.
- Keine Preise, Referenzen, Bewertungen oder Auszeichnungen.

## Offene Punkte
1. **Bildrechte:** Fast alle Bilder sind Hersteller- bzw. Bestandsbilder (Minotti-Bilder aus dem Backoffice, Bestandsbilder in `public/Images`). Für den Neuauftritt braucht es eigene Fotografie von Showroom, Café, Team und Materialdetails, besonders für Hero und Showroom-Sektion.
2. Echtes Café-Foto fehlt. Die Sektion „Showroom & Café“ zeigt heute nur die Ausstellung.
3. Wortmarke in Pfade umwandeln, Favicon-Variante zeichnen, Logo mit dem Inhaber abstimmen.
4. Termin-Buttons führen auf die bestehende `/de/beratung`. Ein Online-Kalender (Bauplan 05) fehlt noch.
5. Produktseite: Maße/Material sind im Backoffice bei Minotti leer (`additional_information = []`), das Datenblatt zeigt deshalb nur Marke/Kategorie/Preis. Felder „im Showroom“, Lieferzeit und Preisrahmen fehlen im Backoffice.
6. Lightbox mit Zoom (yet-another-react-lightbox, lazy) für die Produktbilder ist noch nicht gebaut.
7. View Transitions (Karte → Produktbild) laut 02/F2 sind nicht umgesetzt.
8. Performance mit `next build` + Lighthouse messen (LCP ≤ 2,0 s, CLS ≤ 0,05, JS ≤ 120 kB).
9. Mobile wurde per Headless-Chrome nur ab 500 px Fensterbreite geprüft (Mindestbreite von Headless Chrome). Bei 390 px auf einem echten Gerät nachtesten.
10. Firefox: Scroll-Driven Animations dort voraussichtlich inaktiv. Die Inhalte bleiben statisch sichtbar, das ist beabsichtigt.

## Dateien
- `src/app/[locale]/preview/galerie/layout.js` (Hülle, Locale-Check, noindex)
- `src/app/[locale]/preview/galerie/page.js` (Startseite)
- `src/app/[locale]/preview/galerie/marken/minotti/page.js`
- `src/app/[locale]/preview/galerie/produkt/[slug]/page.js`
- `src/components/Preview/galerie/` – `Shell.js`, `MobileMenu.js`, `Logo.js`, `fonts.js`, `content.js`, `catalog.js`, `galerie.module.css`
