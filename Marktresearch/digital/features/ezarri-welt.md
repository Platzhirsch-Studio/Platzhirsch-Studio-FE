# Ezarri-Welt & Sortiment (Team A)

Stand: 28.10.2026 · Branch `feature/neuauftritt` (nichts committet) · Grundlage: `ezarri-konzept.md` §2, §3, §5, §6, §7.1

## Ergebnis

Unter `/de/ezarri` gibt es jetzt die ganze Ezarri-Welt mit allen Mosaiken und Projektbildern. Sie hängt komplett am Schalter `EZARRI_PUBLIC` in `src/lib/ezarri/config.js`, der heute auf `false` steht.

| Seite | Pfad | Inhalt |
|---|---|---|
| Startseite | `/ezarri` | Hero „Wasserlinie“ (21:9 / 4:5 per `<picture>`), Weiche mit 5 Einsatz-Kacheln, 6 Wasserwirkungen mit Signature „Lichtnetz“ (CSS), Kollektionen als Schriftliste, Konfigurator-Teaser (Bild, kein WebGL), Technik, Markenkopf, Gastgeber-Band (die eine Walnut-Fläche) mit Leitsatz |
| Einsatz-Welten | `/ezarri/pool`, `/wellness`, `/bad`, `/kueche`, `/fassade` | Was bei diesem Einsatz zählt, 9 ausgewählte Mosaike, Link „Alle n Mosaike“, 6 Projektbilder, Brücke zu Outdoor, Küche oder Interior. Fassade zeigt Datenblatt-Fakten, weil Ezarri keine Fassadenbilder hat |
| Wasserwirkung | `/ezarri/wasser` | 6 Wasserfarben mit Bild, Erklärung, Mosaiken, Tabelle „Mosaike / Projektbilder je Wasserfarbe“ |
| Kollektionen | `/ezarri/kollektionen` + 21 × `/[kollektion]` | Kopf mit Datenblatt-Fakten und Format-Tabelle, Raster aller Referenzen (Mosaike, Safe-Steps, Corner, Cove getrennt), nach 9 Kacheln ein Vollbreiten-Bild, Datenblatt-PDF, „Im Konfigurator öffnen“. Die 7 Custom-Linien verlinken die Werkzeuge von Team C, Patterns zeigt alle 20 Muster |
| Mosaik-Übersicht | `/ezarri/mosaike` | alle Filter: Suche, Einsatz, Wasserwirkung, Farbfamilie, Format; unter „Weitere Filter“ Kollektion, Linie, Art, Oberfläche, Farbwähler (ΔE ≤ 28, sortiert nach Nähe), rutschhemmend, Corner/Cove. Trefferzahl je Option, aktive Filter als Chips, „Weitere 24 laden“ als echter `?seite=`-Link, leere Treffer mit „Ähnliche Farbe finden“ (ΔE 40) und „Wir suchen es für Sie“ |
| Mosaik-Detail | `/ezarri/mosaike/[referenz]`, alle 402 per `generateStaticParams` | Nahaufnahme und Anwendungsbilder mit Credit, Ausführungen (Format, Safe, Corner/Cove), „Preis auf Anfrage“, Musteranfrage, Konfigurator (`?m=` + `?k=` nach Vertrag §7.4), Rechner, Merken, Vergleichen, Fakten-`dl` mit ehrlichen Lücken, Maßzeichnung (SVG), Verpackung je Format, Datenblatt, Video-Link, Ähnliche und aus derselben Kollektion, JSON-LD Product ohne `offers` |
| Vergleich | `/ezarri/mosaike/vergleich?ids=…` | bis 4 Mosaike, 12 Zeilen, Unterschiede mit Symbol und Text, „Nur Unterschiede“ (CSS `:has()`), „Muster aller anfragen“, „Diese Mischung im Konfigurator“, wenn alle mischbar sind. Immer noindex |
| Galerie | `/ezarri/galerie` | 1010 Einträge mit 24 pro Seite, Filter Einsatz, Wasserfarbe, Kollektion, Farbe, Format, Safe, Corner/Cove (GET-Formular, mit JS sofort), Lightbox `<dialog>` mit Pfeiltasten, Fokus zurück, Videos als Link zu YouTube |
| Technik | `/ezarri/technik` + `jointpoint`, `verlegung`, `pflege`, `fragen`, `downloads` | eigene SVG-Grafik zu JointPoint, Verlegung für 5 Beckentypen per RadioCard (ohne JS über `:has()`), 8 Pflegethemen, 18 Fragen (FAQPage), 21 PDFs |
| Kurzform | `/ezarri/mosaik` | leitet mit 308 auf `/ezarri/mosaike` um, Filter bleiben erhalten |

`layout.js` liefert die lokale Navigation für alle Ezarri-Seiten, auch die von Team B und C. Mobil ist sie eine Scroll-Leiste, ab `lg` klebt sie unter dem Header. Außerdem sperrt `layout.js` alle anderen Sprachen per `notFound()`.

## Schalter `EZARRI_PUBLIC`

| | `false` (heute) | `true` |
|---|---|---|
| robots | alle Seiten `noindex, nofollow` | `index, follow`. Filter-URLs, Galerie ab Seite 2, Vergleich und Safe/Corner/Cove bleiben `noindex, follow` |
| canonical | ohne Query; Galerie `?seite=n` auf sich selbst; Safe/Corner/Cove zeigen auf das Basis-Mosaik | gleich |
| hreflang | nur `de`, `de-AT`, `de-CH`, `x-default` (`ezarriLanguages()`), kein Verweis auf 404-Sprachen | gleich |
| Sitemap | `getEzarriEntries()` liefert `[]` | 311 Einträge: 16 feste Seiten, 14 Produktkollektionen und 281 Basis-Mosaike, `lastmod` = `DATA_STAND` |
| Händler-Aussage | neutrale Zeile „Glasmosaik von Ezarri – Beratung und Muster in Lochau“ | siehe nächster Abschnitt |

**Sitemap-Hook** (Teamleiter, §7.5): `getEzarriEntries()` aus `src/lib/ezarri/data.js` (server-only) gibt `{path, locale:"de", lastmod}` zurück. Daraus wird eine eigene `sitemap-ezarri.xml` in `src/lib/seo/sitemapEntries.js` / `src/app/sitemap.xml/route.js`. Wenn der Schalter aus ist, bleibt die Liste leer, die Einbindung kann also schon jetzt erfolgen.

## Händler-Aussage: anders als im Konzept

Das Konzept sah die Konstante `DEALER_CLAIM` in `copy.js` vor. Das hätte gleich zwei Prüfungen rot gemacht: die ESLint-Regel `no-restricted-syntax` (Händler-Wörter im Code) und `npm run check:claims`.

Deshalb steht in `copy.js` kein Händler-Satz. `dealerClaim()` liest den Satz aus dem Claim-Register (`src/lib/legal/claims.js`), und zwar nur dann, wenn beides zutrifft:
- `EZARRI_PUBLIC` ist `true`,
- `isVerifiedDealerBrand("ezarri")` ist wahr.

Damit erzwingt der Code die Reihenfolge, die das Konzept in §1.3 verlangt: erst der Eintrag im Register, dann die Aussage auf der Seite. Vorschlag für den Register-Eintrag (Teamleiter):

```js
{ id: "ezarri-dealer", brandSlug: "ezarri", brandName: "Ezarri", claim: "dealer",
  text: "Platzhirsch Home Living ist Ezarri-Vertragshändler für Vorarlberg, den Bodensee und die Schweiz.",
  evidenceUrl: "<Ezarri-Händlersuche, sobald gelistet>", verifiedAt: "…",
  note: "Händlervertrag, Firmenakten, Inhaber 28.10.2026" }
```

## Rechte, Quellen, Gestaltung

- **Bilder:** Jedes Ezarri-Bild hat eine Credit-Zeile „Bild: Ezarri, ezarri.com“. Sie steht als `figcaption` am Bild oder als Sammel-Credit direkt unter dem Raster. Die Bilder bleiben unverändert und werden nur per `object-fit` zugeschnitten. Ein Ezarri-Logo gibt es nicht, weil keine Logo-Datei im Material liegt; der Name steht in Instrument Sans.
- **Daten und PDFs:** Tabellen tragen „Daten: Ezarri, ezarri.com, Stand 28.10.2026“, PDFs „Datenblatt: Ezarri“. Zu jedem PDF gibt es einen Link „Original bei Ezarri“.
- **PDFs:** 21 öffentliche PDFs von Ezarri liegen unter `public/ezarri/pdf/` (14 MB): 18 Datenblätter, ISO 9001, ISO 14021 und die Garantie. Kopiert wurden sie aus `Herstellermaterial/Ezarri/pdf/`, die Quell-URLs stehen in `00-pdf-index.csv`. Für Custom Mix gab es in `collections.json` kein Datenblatt-Feld; `data.js` ergänzt dafür `FT2023_CUSTOM_MIX2.pdf`.
- **Texte:** Alle Texte sind eigene Texte in `copy.js`. Fakten von Ezarri stehen als „laut Ezarri“ da. Die Schritte der Verlegung stammen aus ezarri.com/de/verlegung und den 4 Unterseiten je Beckentyp (Abruf 28.10.2026).
  - Ezarri widerspricht sich bei der Zahnkelle: Die Verlegeanleitung nennt 6 mm, die FAQ nennen 3 mm. Beides steht offen auf der Seite.
  - Die Pflegeartikel sind bei Ezarri nicht frei lesbar, deshalb fassen die Texte nur allgemeine Regeln zusammen, mit Quellenhinweis.
- **Keine Preise, keine erfundenen Projekte.** Die Galerie heißt „Projekte mit Ezarri-Mosaik“, und die Auswahl je Einsatz-Welt ist ausdrücklich eine Datenauswahl: zuerst Mosaike mit Projektbildern und Wasserwirkung, je Kollektion eines. Eine Beraterin als Kuratorin wird nicht behauptet.
- **Gestaltung:**
  - Nur Tokens der Bibel, der Akzent `see` nur für Wasser-Bezüge.
  - Keine Radien und keine Schatten, außer bei Vergleichsleiste und Dialog.
  - Eine Walnut-Fläche nur auf der Startseite.
  - Das „Lichtnetz“ läuft 2 × 2,4 s und steht dann still. Bei reduced motion und „Ruhige Ansicht“ steht es von Anfang an still (WCAG 2.2.2).

## Merken und Vergleichen

- **Merken:** nutzt die bestehende Merkliste (`useWishlistToggle` aus `ShopCatalog/wishlistHeart`). Der Eintrag sieht so aus: `{id:"ezarri-<id>", category:"Ezarri", href:"/ezarri/mosaike/<id>"}`.
  - **Integrationspunkt:** `wishlistImageSrc()` in `src/context/CartContext.js` kennt nur `/cmx`, `/cms` und `/Images`. Deshalb wird das Bild leer gespeichert, sonst würde die Merkliste `/cms/ezarri/…` laden und ein kaputtes Bild zeigen. Wenn `/ezarri/` in die Regex aufgenommen wird, kann `toEzarriWishlistItem()` (`Katalog/CardActions.js`) `image: "<web>-600.webp"` setzen.
- **Vergleichen:** Die Liste liegt nur im Browser (`localStorage "ezarri-vergleich"`, höchstens 4 Einträge). Die Vergleichsseite liest die IDs aus der URL, deshalb lässt sich ein Vergleich als Link teilen.

## Dateien

- **Seiten:** `src/app/[locale]/ezarri/` mit `layout.js`, `page.js`, `pool|wellness|bad|kueche|fassade/page.js`, `wasser/`, `kollektionen/`, `kollektionen/[kollektion]/`, `mosaike/`, `mosaike/[referenz]/`, `mosaike/vergleich/`, `mosaik/` (Umleitung), `galerie/`, `technik/**`
- **Welt:** `src/components/Ezarri/Welt/`
  - `LocalNav.js` (Insel)
  - `EzImage.js`
  - `Sections.js` (Hero, Kachel, Wasserstreifen)
  - `EinsatzWelt.js`
  - `parts.js` (PageHead, FactList, CreditNote, LinkRow, SectionHead, Schluss)
  - `meta.js` (`ezarriMetadata`, `ezarriLanguages`)
  - `schema.js` (Brand, Product ohne Preis, CollectionPage, ImageGallery, FAQPage, Article, Breadcrumb)
  - `ezarri.module.css`
- **Katalog:** `src/components/Ezarri/Katalog/`
  - `FilterIsland.js`
  - `MosaicCard.js`
  - `CardActions.js`
  - `compareStore.js`
  - `CompareBar.js`
  - `GalleryGrid.js`
  - `GalleryFilters.js`
  - `SheetDrawing.js`
  - `konfigLink.js` (`?k=` über `encodeState` von Team B)
  - `constants.js`
- **Lib:**
  - `src/lib/ezarri/copy.js` ist neu.
  - `src/lib/ezarri/data.js` ist ergänzt um `getBaseReference`, `getVariantGroups`, `getReferenceCards`, `getCollectionFacts/Formats`, `getDownloads`, `getDatasheet`, `localPdf`, `pickReferences`, `countReferences`, `getGalleryImages`, `getGalleryCollections`, `countGallery`, `isServiceCollection` und `getEzarriEntries`.
- **Öffentliche Dateien:** `public/ezarri/pdf/*.pdf` (21)
- **Tests:**
  - `tests/unit/ezarri-welt.test.mjs` (14 Tests)
  - `tests/e2e/ezarri-welt.spec.js` (Desktop)
  - `tests/e2e/ezarri-welt-iphone.spec.js` (iPhone 15 Pro, WebKit, über `test.use`)
  - `tests/e2e/ezarri-welt-pixel.spec.js` (Pixel 7, Chromium); gemeinsame Handy-Abläufe in `tests/e2e/ezarri-welt-mobile.js`
- **Texte für en/fr/it:** 61 Schlüssel `ezarri.a.*` in `ezarri-messages-vorschlag.json`
- **Neue npm-Pakete:** keine

## QM Runde 1: Nachbesserung (28.10.2026)

Bericht: `qa-screenshots/ezarri/welt/feedback-1.md` (Note 7/10). Prüfung danach: `qa-screenshots/ezarri/welt/fix1/` (shoot.mjs auf 4 Geräten, Sheet- und Vergleichsleisten-Ablauf, Playwright-Ergebnisse).

| Punkt | Lösung |
|---|---|
| P1-1 Vergleich mobil verdeckt | Ursache war die Termin-Leiste (`MobileCtaBar`), nicht nur die Cookie-Leiste. `CompareBar` trägt die Klasse `.compareBar`; eine CSS-Regel in `ezarri.module.css` blendet `#site-footer ~ nav.fixed` aus, solange die Leiste steht (gleiches Muster wie beim Küchenplaner). Zusätzlich `html[data-ez-compare="1"]` als Haken für eine saubere Lösung in `MobileCtaBar` (Teamleiter). E2E auf iPhone und Pixel: `elementFromPoint` trifft „Vergleich ansehen“, Klick führt zu `/vergleich?ids=…`. |
| P1-2 Kachelbilder | Fest kuratiert in `copy.WELTEN[].bild` (Galerie-ID + Alt-Text nach Bildinhalt): Pool Terrazzo Teal 50, Wellness Carrara Gold (Dampfbad), Bad Lace 25, Küche Perla Hexa, Fassade Mondstein Hexa (ganz verkleidete Wand; Ezarri hat kein Fassadenfoto, der Text sagt das). `getGalleryImages` schließt Produktaufnahmen (`dsc…`, `cam…`, `mos-…`, `…detalle`) aus und dedupliziert über ein `exclude`-Set je Seite (Hero, Kacheln, Wasser, Teaser). |
| P1-3 Einsatz-Zahlen | Zwei Begriffe: **Eignung** (`data.getEignung`: Datenblatt Cladding/Paving/Pools & Wellness; Wand schließt Bad- und Küchenwand ein; „Wand innen“ entfällt neben „Wand innen und außen“) und **Projektbild** (`data.getProjektEinsaetze`, Karte `projekte`, URL `?bild=`). Einsatz-Chips, die fast alles treffen, sind durch einen Hinweis ersetzt. Kacheln: „n Mosaike geeignet · m mit Projektbild“; Welten: „Alle n geeigneten Mosaike“ + „m davon mit Ezarri-Projektbild“. |
| P2-1 erste Karte | Ab md Filter in der linken Spalte, unter md Suche + „Filter (n)“ → Bottom-Sheet (`<dialog>`, `showModal`, „n Mosaike anzeigen“, Fokus zurück auf den Knopf). Ohne JS: `<details>` mit GET-Formular. Lead der Seite mobil ausgeblendet. Test `firstCard.top < innerHeight` auf iPhone, Pixel, Desktop. |
| P2-2 Sortierung | `katalogState.sortCards`: „Empfohlen“ (benannte Mosaike mit Bild zuerst, nach Projektbildern und Wasserwirkung, je Kollektion abwechselnd, reine Codes zuletzt), „Name A–Z“, „Kollektion“, „Farbe hell → dunkel“; `?sort=`. |
| P2-3/P2-4 Format | Karte trägt das Format der Referenz selbst (`ownFormatIds`), Hexa = 7. Karte, Vergleich und Detailseite zeigen „50 mm“ für Basalt 50; Verpackung im eigenen Format (`getOwnPackaging`). Familien-Zusammenfassung („Basalt 25 · 50“ als eine Karte) bewusst nicht umgesetzt, siehe offene Punkte. |
| P2-5 Zahl 402 | Ohne Art-Filter und ohne Suche nur Basis-Mosaike (281) mit Zeile „121 Safe-Steps und Formstücke unter ‚Art‘“ und Knopf „Auch Safe-Steps und Formstücke zeigen“. Übersicht: „281 Mosaike in 17 Kollektionen, dazu Safe-Steps und Formstücke“. 17 statt der im Bericht genannten 14: 17 Mosaike liegen in den fertigen Motiv-Linien (Standard Pixel/Printed, Fading Out). Unit-Test prüft die Zahlen gegen `getSortimentStats()`. |
| P2-6 Vergleich mobil | Unter sm: klebender Bildkopf (64-px-Bilder mit Name) und je Merkmal eine Zeile mit „gleich/unterschiedlich“ und den Werten nebeneinander; „Nur Unterschiede“ wirkt auf beide Ansichten. |
| P2-7 Lokale Navigation | „Muster anfragen“ als Knopf erst ab xl, darunter letzter Punkt der Scroll-Leiste; kein negativer Rand mehr über dem Knopf; Scroll-Hinweis per `mask-image`. Test bei 834 und 1024 px. |
| P2-8 Übersicht mobil | Hero-Bild unter lg vor der H1 (Reihenfolge per CSS `order`, DOM bleibt Text → Bild). |
| P3-2 | Galerie-Bildunterschrift in den Welten nur noch „Mosaik: …“, Credit gesammelt darunter. |
| P3-5 | JSON-LD der Mosaik-Übersicht auf 24 Einträge begrenzt. |

Neue Dateien: `src/components/Ezarri/Katalog/katalogState.js` (rein: `?bild`, `?sort`, Standard-Art, Sortierung). `facets.js` blieb unverändert (Teams B/C lesen es); `?bild` und `?sort` laufen über `katalogState`.

**Nicht in Team A (an den Teamleiter):** P2-9 Hauptmenü-Eintrag an `ezarriInNavigation()` binden und den Kommentar „schriftlich erlaubt“ in `src/lib/features.js` korrigieren; P2-10 `"ezarri"` in `GERMAN_ONLY_FIRST_SEGMENTS`; P2-11 `/ezarri/` in `wishlistImageSrc()`. Optional: `MobileCtaBar` selbst auf `html[data-ez-compare]` reagieren lassen und die CSS-Regel dann entfernen.

**Offen (P3):** Familien-Karten (P2-4 Empfehlung), Kollektionsraster nach Vielfachem der Spalten (P3-1), Konfigurator-Poster (P3-3, Team B), Kerning der Display-Schrift (P3-4, Design), Datenblatt-Hinweis bei Hexa (P3-6), Rutschklassen `corner-dune` (P3-7), `aria-pressed` des Merken-Knopfs (P3-8; E2E sieht „Gemerkt“ mit `aria-pressed="true"`), Galerie-Override-Liste (P3-10). LCP im Produktions-Build nachmessen (kein `npm run build` im Repo erlaubt).

Bekannt, nicht von Team A: `tests/unit/ezarri-konfigurator.test.mjs` „katalog: alle 402 Referenzen“ ist rot (457 statt 402), weil Team B in `konfigurator/katalog.js` gerade Safe-Varianten ergänzt.

## QM Runde 2: Nachbesserung (28.10.2026)

Bericht: `qa-screenshots/ezarri/welt/feedback-2.md` (Note 8/10, kein P1). Prüfung danach: `qa-screenshots/ezarri/welt/fix2/` (shoot.mjs auf 4 Geräten für Übersicht, Galerie, Galerie Küche, Mosaike, Daikiri).

| Punkt | Lösung |
|---|---|
| P2-1 Karte | Faktenzeile mit Mosaikfarbe (`farben[0]`): „25 mm · glänzend · Rosa“. Darunter sichtbar „Im Wasser: Grün“ (Label in `text-soft`, Wert in `see`). Ohne Wasserwirkung keine Zeile; die Aktionen stehen per `mt-auto` unten, damit die Karten gleich hoch wirken. |
| P2-2 Rezepte | Neue Datei `src/lib/ezarri/kombinationen.json`: 57 Rezepte (Cocktail, Mix, Gold, Fosfo, Iridescent) aus Ezarris Produktseiten, Block „Übersicht · Kombination“, abgerufen am 28.10.2026, mit `quelle` je Eintrag. Bei 25022-B ist die Produktseite unvollständig (nur 50 %), dort gilt das Rezept aus Ezarris Konfigurator (`basis: "konfigurator"`, so angezeigt). Einzelfarben ohne eigene Ezarri-Seite (Kilauea, Teide, Etna, Sajama, Stromboli, Vesubio, 2560-B) haben `ref: null` und keinen Link. Lese-API `data.getKombination()`. Die Produktseiten weichen bei einigen Iridescent/Fosfo-Rezepten von Ezarris Konfigurator-Daten ab; gezeigt wird die Produktseite. Detailseite: Abschnitt „Mischung laut Ezarri“ (Komponente `Katalog/Kombination.js`) mit Balken in den Farben der Einzelmosaike (Konfigurator-Hex, sonst gemessene Farbe aus `konfigurator/measured-colors.json`, sonst Farbfamilie; unbekannt = schraffiert), Liste mit Links und Prozent, Quelle mit Stand. Knopf „Diese Mischung im Konfigurator“: Sind alle Einzelfarben im Konfigurator einzeln mischbar (40 von 57), startet er mit dem Rezept als Mischung (`konfigLink.konfiguratorHref` nimmt jetzt optional `anteil` je Eintrag, Vertrag §7.4 Nr. 1 unverändert: `?k=`). Sonst „Fertige Mischung im Konfigurator“ (`?m=` + `?k=` mit der fertigen Mischung). Dazu „Muster der Einzelfarben anfragen“ (`ref=` Mischung + Einzelfarben, max. 6). Faktenzeile „Mischbar“ bei fertigen Mischungen: „Im Konfigurator nur als fertige Mischung wählbar“; zusätzlich Zeile „Mischung“ mit dem Rezept. Abstimmung mit Team B: Es werden nur bestehende Parameter genutzt. |
| P2-3 Kollektionszahl | Eine Zählweise: **Kollektion** = Kollektion mit eigenen Mosaiken (17), **Sonderanfertigung** = Custom Mix, Custom Printed, Custom Pixel, Patterns (4). `data.getSortimentStats()` leitet beides aus `getCollections()` ab (`isMadeToOrder`). `HUB.lead/description/kollektionen.title` und `KOLLEKTIONEN.description` sind jetzt Funktionen der Zahlen. Übersicht: „17 Kollektionen und 4 Sonderanfertigungen“, Spalte „Individuell · 3 + 4 Sonderanfertigungen“, Zeile „Sonderanfertigung“ statt „Dienstleistung“. E2E: alle „n Kollektionen“ auf `/de/ezarri` haben dieselbe Zahl. |
| P2-4 Galerie | Gleiche Bedienung wie `/mosaike`: gemeinsame Bausteine `Katalog/FilterSheet.js` (`Chip`, `ChipGroup`, `FilterSheet`), auch von `FilterIsland` benutzt. Desktop eine kompakte Zeile (Einsatz, Wasserfarbe), Rest unter „Weitere Filter“; mobil „Filter (n)“ → Bottom-Sheet mit „n Bilder anzeigen“. Jeder Chip wirkt sofort (`useOptimistic` + `router.replace`, URL-State), mit Trefferzahlen (`data.galleryFacetCounts`); „Filter anwenden“ nur ohne JS. Kopf auf H1 + eine Zeile gekürzt, Trefferzahl neben dem Filterknopf: erstes Bild auf iPhone, Pixel und Desktop im ersten Bildschirm (E2E `top < innerHeight`). Videos getrennt: `getGallery(…, { medien: "foto" })` liefert nur Fotos (997), Projektbilder vor Produktaufnahmen; Ezarris 13 Produktvideos stehen in einem eigenen Abschnitt „Produktvideos von Ezarri“ (Link „Videos (n)“ oben), zählen nicht als Projektbilder und fallen bei jedem Einsatz-Filter weg (`getGalleryVideos`). Küche: 31 Fotos, 0 Videos. Bildunterschrift unter der Kachel nur „Mosaik: Washes 25 →“, Credit einmal unter dem Raster, in der Lightbox „Mosaik: … · Bild: Ezarri, ezarri.com“. |
| P2-5 Hero mobil | Eigene 4:5-Fassung aus dem Original (1600 × 1067, nur mittiger Zuschnitt, nicht hochskaliert): `…-pool-ezarri-1-m480/-m853.{avif,webp}` (m853.avif 67 KB). `HeroImage` liefert unter 768 px `srcset 480w, 853w` mit `sizes="100vw"` statt der 600er-Querformatdatei (vorher etwa 3,5-fach, jetzt höchstens 1,4-fach skaliert). LCP im Produktions-Build weiter offen. |
| P3-1 Wasserlinie | `HeroImage` nimmt `linie={mobil, desktop}` (Wasserkante je Bild, hier 63 % / 70 %); ohne Angabe steht die Linie unter dem Bild. |
| P3-3 Fuge | Label „Fugenempfehlung“, Lücke „laut Ezarri nicht angegeben“ (keine Dopplung). |
| P3-4 Format | Ausführungen-Chips „25 mm“ mit schmalem Leerzeichen. |

Tests: `tests/unit/ezarri-welt.test.mjs` +5 (Daikiri-/Mojito-Rezept, alle Rezepte = 100 %, Konfigurator-Übergabe mit Anteilen, Zählweise 17 + 4, Galerie ohne Videos, Hero-Dateien), 19/19 grün; `ezarri-basis` 10/10 (`getGallery` ohne `medien` unverändert 1010). E2E `ezarri-welt.spec.js` +4, `ezarri-welt-mobile.js` +1 Galerie-Ablauf (iPhone, Pixel), Lauf mit `PW_WORKERS=1`: alle grün.

**Weiter beim Teamleiter (nicht in Team-A-Dateien):** P2-9 Hauptmenü an `ezarriInNavigation()` (`src/lib/features.js`, Kommentar „schriftlich erlaubt“ korrigieren), P2-10 `"ezarri"` in `GERMAN_ONLY_FIRST_SEGMENTS` (`src/components/Navbar/shellNav.js`), P2-11 Merkliste ohne Bild (`wishlistImageSrc()`).

**Offen (P3):** P3-2 Fassade-Kachel-Hinweis, P3-5 Sortier-Select als `ui`-Select, P3-6 Vergleichsleiste iPhone, P3-7 Concierge-Knopf (Team Concierge), P3-8 Seitengewicht `/mosaike`, Rest aus Runde 1.

## Offene Punkte

1. **Teamleiter:**
   - `"ezarri"` in `GERMAN_ONLY_FIRST_SEGMENTS` (`shellNav.js`) eintragen, damit der Sprachumschalter nicht auf `/en/ezarri` (404) zeigt. Der Test `r6-shell-perf` bleibt auch ohne den Eintrag grün, weil die Seite `ezarriLocaleEnabled()` nutzt statt `locale !== "de"`.
   - Claim-Register-Eintrag für Ezarri (siehe oben)
   - `sitemap-ezarri.xml`
   - Bild-Regex in `wishlistImageSrc()`
   - Menü- und Footer-Einträge bei `true`
2. **Videos:** „youtube“ steht noch nicht im Dienste-Register, und die CSP erlaubt kein `frame-src`. Deshalb verlinken die Videos nach außen und werden nicht über eine Fassade eingebettet. Sobald beides freigegeben ist, kann die Galerie `YouTubeFacade` nutzen.
3. **Inhaber:**
   - Ansprechperson für Ezarri und der „Satz der Beraterin“ fehlen; der Bereich bleibt leer.
   - Gibt es Muster im Showroom? Heute steht „Muster bestellen wir für Ihren Termin“.
   - Logo-Datei
   - Kataloge
   - Lieferweg in die Schweiz
4. **Konfigurator:** `/ezarri/konfigurator` von Team B existierte beim Test noch nicht. Die Links (`?m=`, `?k=`, `?serie=`) folgen dem Vertrag.
5. **Speicherplatz:** `public/ezarri` belegt etwa 550 MB, dazu kommen 14 MB PDFs. Das Hosting-Limit muss vor dem Deploy geklärt sein.
