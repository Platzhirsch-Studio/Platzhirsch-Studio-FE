# Paket „Katalog und Produktseiten“

Stand: 26.10.2026 · Branch `feature/neuauftritt` (nicht committet) · Grundlage: Design-Bibel §6, §9, §10, §11, Jury-Urteil §3.1 bis §3.4, Fundament-Bausteine `@/components/ui`.

## 1. Geprüfte URLs

Die Beispiel-URLs aus dem Auftrag gibt es so nicht. `/de/produkte/sofas` liefert 404, `/de/produkte/sofas/sofas-lawrence` leitet mit 308 weiter. Gültig sind:

- `/de/produkte` (Hub, 31 Kategorien)
- `/de/produkte/sofas-couches` (Kategorie)
- `/de/produkte/sofas-couches/sofas-lawrence` (Produkt)
- `/de/merkliste` („Ihre Auswahl“)

Die übersetzten Pfade (`/en/products/…`, `/fr/produits/…`, `/it/prodotti/…`) sind unverändert.

## 2. Was sich geändert hat

### Hub `/produkte`
- Neuer Seitenkopf `CatalogHeader`: Breadcrumbs (ohne zweites JSON-LD), Overline „Katalog“, H1 in Bodoni (`display-l`) und Lead. Der Lead ist derselbe Satz wie die Meta-Description.
- Kategorien als ruhige Galerie mit 3:2-Raumbild. Der Name steht **unter** dem Bild statt darauf, es gibt keine Verläufe und kein Gold.
- Höchstens 3 Spalten. Nur das erste Bild wird vorgeladen (`preload`, nicht `priority`).
- Sprungnavigation als schlichte Textlinks mit 44-px-Zielen.

### Kategorie `/produkte/[category]` (`shopCatalog.js`)
- Galerie mit 1 Spalte (Telefon), 2 (ab `sm`) bzw. 3 Spalten (ab `lg`).
- Neue Kachel `CatalogTile`: Herstellerbild 3:2 unbeschnitten (die Herstellerbilder sind fast alle Raumaufnahmen im Querformat; 4:5 ließ zwei Drittel der Fläche leer) (`object-contain`, `mix-blend-multiply` auf Bone), Marke als Overline, Name als Link über die ganze Kachel, Meta „Design …“. Das Herz ist ein 44-px-Quadrat ohne Radius.
- Raumbild über die volle Breite: nach 6 Kacheln auf dem Telefon, nach 9 auf dem Desktop (Bibel §6). Es zeigt drei wechselnde, belegbare Sätze und den Link „Termin wählen“.
- Filter:
  - Leiste mit bis zu 4 Gruppen (Desktop) und „Alle Filter (n)“.
  - Alle Filter liegen in einem `<dialog>` mit `showModal()`: Fokusfalle, Escape und inerte Seite. Auf dem Desktop ist es ein Seitenpanel, auf dem Telefon Vollbild.
  - Gruppen als `<details>` mit `<fieldset>`/`<legend>` und echten Checkboxen (`accent-ink`, Zeilen ≥ 44 px).
  - Fußleiste „Alle löschen“ und „38 Stücke anzeigen“.
  - Aktive Filter als entfernbare Chips. Die Ergebniszahl wird mit `aria-live` angesagt.
  - Neue Reihenfolge: Marke, Typ, Material, Farbe, Designer, Indoor/Outdoor.
- „Mehr Produkte anzeigen“ lädt weiter in Schritten von 24, der Fokus springt auf die erste neue Kachel.
- Leere Kategorie: „Wir finden es für Sie.“ mit dem Primärknopf „Beratung anfragen“.

### Produktseite „Atelier“ (`[product]/page.js`)
- **Erster Bildschirm:** Galerie in Spalte 7/12, rechts in Spalte 5/12 (sticky) folgende Elemente:
  - Overline „Marke · Kategorie“ (beides Links), H1 Modell, „Design …“.
  - **Ein** Primärknopf „In Lochau ansehen – Termin wählen“ mit Übergabe `?produkt=`, dazu sekundär „Merken“.
  - Hinweis zum Probesitzen und Telefonlink.
  - Faktenliste `dl`: Preis auf Anfrage, In Lochau, Lieferung, Maße (springt zu `#masse`), Herkunft der Marke.
  - Ansprechperson.
- **Galerie** (`productGallery.js`, Embla statt react-slick, Bühne 3:2 wie im Dreiländereck):
  - Erstes Bild im Server-HTML und vorgeladen.
  - Inaktive Slides sind `inert`. Der Bildzähler wird mit `aria-live` angesagt, Pfeiltasten funktionieren, Thumbnails haben `aria-current`.
  - Lightbox als `<dialog>` auf Paper mit Scroll-Snap (Wischen nativ).
  - Zoom auf 200 % als Scroll-Container, so funktioniert das Schwenken nativ per Touch, Rad und Tastatur.
  - Bei reduzierter Bewegung springen die Bilder ohne Animation.
- **Detailabschnitte** (`productInfoTabs.js` → `ProductDetailSections`): Die Tabs sind ersetzt durch Server-Abschnitte mit H2, die alle sichtbar sind, dazu „Auf dieser Seite“ als Sprungmarken. Es gibt diese Abschnitte:
  - Über das Stück
  - Material und Ausführung (mit Hinweis auf die Muster im Studio)
  - Maße: Zeichnung in Ink statt Messing, `dl` mit Zahlen in Tabellenziffern
  - Downloads: PDFs aus `pdf_produkte` über `/cmx`, ohne Login. Der Abschnitt erscheint nur, wenn Daten vorhanden sind.
- **„Gebaut, um zu bleiben“** (`builtToStay.js`) auf Stone mit Nachbezug, Ersatzteilen und Pflege. Die Formulierung sagt nur zu, was das Studio selbst tut (beim Hersteller anfragen, Pflegehinweise weitergeben).
- **Verwandte Produkte:** Kacheln wie im Katalog.
- **Kollektionen:** Embla-Reihe mit 3:2-Karten ohne Autoplay. Die alte dunkle Indexfläche mit 5-s-Autoplay ist entfallen.
- **Marke und Designer:** Server-Komponente. Das Designer-„Porträt“ (eigentlich Raumfotos) ist entfernt, die Bio steht mit `lang="en"`, weil sie nur auf Englisch vorliegt.
- **Schluss:** `CTABand` mit Leitsatz „Nehmen Sie Platz.“ (einmal pro Seite), dazu „Termin wählen“ und „Zurück zu …“.
- **Keine dunkle Fläche** auf der Produktseite, kein Messing auf hellem Grund, keine Radien.

### „Ihre Auswahl“ (`CartPage.js`)
- Die Darstellung ist neu, die Logik bleibt wie bisher: entfernen, alles löschen, Formular `AnfrageFormProduct` mit `cartItems`.
- H2 „Ihre Auswahl“ und Hinweis „nur in diesem Browser gespeichert“ (stimmt, weil die Auswahl in `localStorage` liegt).
- Kacheln 3:2 wie im Katalog. Der Entfernen-Knopf ist 44 px groß und hat einen Namen.
- Ein Primärknopf „Auswahl besprechen – Anfrage senden“.

## 3. SEO

Unverändert sind:
- `generateMetadata`, Canonical, hreflang und `robots` (leere Kategorien bleiben `noindex`)
- `generateStaticParams`
- Legacy-308 und die Weiterleitung bei falscher Kategorie
- JSON-LD (`Product`, `CollectionPage` + `ItemList`, `BreadcrumbList`)

Verbessert hat sich:
- Alle Produkttexte (Material, Maße, Downloads) stehen jetzt sichtbar im HTML statt in versteckten Tabs.
- Die Überschriften sind sauber gegliedert (H1 → H2 → H3).
- Die Breadcrumbs sind ein `nav` mit `aria-current`.

## 4. Dateien

- `src/components/ShopCatalog/`:
  - `shopCatalog.js` (neu geschrieben)
  - `shopCategoryGrid.js`
  - `productGallery.js` (Embla + Lightbox)
  - `productActions.js`
  - `productInfoTabs.js` (jetzt `ProductDetailSections`)
  - `brandDesignerShowcase.js`
  - `collectionSlider.js`
  - `dimensionDiagram.js` (Farben)
  - `wishlistHeart.js` (nur das Aussehen; die API bleibt, weil Startseite, Kollektion und Labs sie nutzen)
  - **neu:** `catalogTile.js`, `catalogHeader.js`, `builtToStay.js`, `copy.js` (Fallback-Texte + `withFallback()`)
- `src/app/[locale]/produkte/page.js`, `[category]/page.js`, `[category]/[product]/page.js`
- `src/components/CartPage/CartPage.js`
- Textvorschlag: `Marktresearch/digital/redesign/messages-katalog.json` (DE/EN/FR/IT, ICU geprüft, gleiche Schlüssel in allen Sprachen)

Neue Schlüssel stehen unter `shop.catalog.*`, `shop.atelier.*` und `cart.selection.*`. Bestehende Schlüssel bleiben. Bis zur Integration liefert `copy.js` die Texte. Danach kann das `FALLBACK`-Objekt dort gelöscht werden; `withFallback()` greift dann direkt auf `t` zu.

## 5. react-slick

In diesem Paket ist react-slick vollständig abgelöst. Es kommt noch in `Home/about.js`, `MarkenItems/markenitems.js` und `UberUns/austellung.js` vor (fremde Pakete). Erst wenn auch diese umgestellt sind, kann das npm-Paket `react-slick` + `slick-carousel` entfernt werden.

## 6. Offene Punkte

1. **Inhaber bestätigen:**
   - die drei Sätze in „Gebaut, um zu bleiben“
   - „Lieferung und Montage in Österreich; DE/CH/FL auf Anfrage“
   - den Satz „Ob das Stück ausgestellt ist, klären wir vor Ihrem Besuch.“
2. **Fehlende Backoffice-Felder** (Bibel P5): Preisrahmen, Lieferspanne, Status „Im Showroom Lochau“ und Herstellungsland pro Produkt. Sobald sie existieren, kommen sie in die Faktenliste und als `Badge` auf die Kachel.
3. **Ansprechperson:** Name und Foto fehlen, bis dahin steht nur der Text.
4. **`pdf_produkte`:** Die Feldstruktur ist nicht dokumentiert. Die Auswertung ist defensiv (jedes Feld, das auf `.pdf` endet). Mit echten Daten prüfen.
5. **Filterzustand in der URL** (Bibel §9): noch nicht umgesetzt. `?marke=` wird weiterhin gelesen.
6. **Kopfabstand:** `--ph-page-top` / `--ph-page-top-lg` (Standard 2rem / 3rem unter dem neuen, mitlaufenden Header).
7. **Maße:** `parseDimensions` erkennt nur englische Labels („Width: 242 cm“). Andere Formate erscheinen als Rohtext.
8. **Designer-Bios** liegen nur auf Englisch vor (`staticShopProducts.js`), Übersetzung nötig.
9. **Muster anfordern** (Bibel §10, sekundäre Aktion): bewusst weggelassen, weil es den Prozess noch nicht gibt.

## 7. Benötigte Bilder

- **Raumbilder für die Katalog-Pausen:** eigene Showroom-Fotos, 21:9 und 3:2, je Raum (Wohnen, Essen, Schlafen, Outdoor). Bis dahin dienen die vorhandenen `/Images`-Raumfotos als Platzhalter (Jury: teils Fremdorte).
- **Pro Top-Produkt** (Bibel P6): mindestens 3 Materialnahaufnahmen (1:1) und 1 Maßstab-Bild mit Person.
- **Kategoriebilder im CMS** (Produkte Kategorie → `image`), damit der Hub keine Ersatzbilder braucht.

## Runde 3 (R3-produkt, 26.10.2026)

- **Doppeltes Raumbild (Abnahme R3):** Jedes Raumbild erscheint je Ansicht höchstens einmal (`interludeImages[ordinal]`), weitere Pausen sind Textbänder.
- **`/de/produkte/sofas` (Abnahme R8):** permanente Weiterleitung (308, `permanentRedirect`) auf `/de/produkte/sofas-couches`, in allen Sprachen. Eindeutig, weil der Katalog nur eine Sofa-Kategorie führt; Alias-Liste `src/lib/shop/categoryAliases.js`, Weiterleitung nur, wenn das Ziel existiert. Ein echter 301 wäre nur über `next.config.js` `redirects()` möglich (anderer Besitzer); 308 ist für Suchmaschinen gleichwertig.
- **Backoffice-Doppel (QM R3-produkt P2-1):** `buildShopProducts()` blendet Einträge mit gleicher Marke, gleichem Namen und gleichem Hauptbild aus (`src/lib/shop/dedupe.js`). Der erste Eintrag bleibt. Ohne Bild wird nichts zusammengelegt. Sofas & Couches hat dadurch 98 statt 105 Stücke. Die Datensätze im Backoffice selbst bereinigt R7.

## Runde 4 (R4-produkt, 26.10.2026)

- **Kategorie-Aliase:** Eindeutige Wortteile leiten per `permanentRedirect` (308) in `produkte/[category]/page.js` weiter, nicht über `next.config.js`: `sofas`, `couches` → `sofas-couches`, `armchairs` → `armchairs-stools`, `sideboards`, `chests` → `sideboards-chests`, `chaise-longues` → `chaise-longues-daybeds`, `lounge-furniture` → `lounge-furniture-daybeds`, `loungers` → `sun-loungers`. Mehrdeutige Teile (`stools`, `daybeds`, `tables`, `chairs`) bleiben 404. Ein Unit-Test prüft die Eindeutigkeit gegen die 31 Live-Kategorien.
- **Rohdaten ohne Superlative:** Die Quelltexte in `src/lib/data` (`brandVanEgmond.js`, `treca.js`, `next125.js`, `staticShopProducts.js`) sind neutral umgeschrieben, zum Beispiel ohne „unique“, „perfect“, „finest“, „leading“, „ultimate“ oder „the only one“. `check:claims` meldet statisch 0 Funde (vorher 30). Der Render-Filter aus `src/lib/legal` bleibt. Wenn der Generator neu läuft, kommen die Funde zurück.

## Runde 5 (R5-produkt, 26.10.2026)

- Eine Kachel ohne Bild zeigt kein Fremdfoto mehr (vorher `fallback-banner.jpg`, ein Outdoor-Sessel), sondern eine neutrale Fläche im 3:2-Kasten. Darauf stehen eine Messinglinie und der Hinweis „Für dieses Stück liegt noch kein Foto vor“ (4 Sprachen, `noPhotoLabel`: zuerst Messages `shop.atelier.noPhoto`, sonst `src/lib/shop/noPhoto.js`). Die Wortmarke steht bewusst nicht auf der Kachel: Ihr 13-KB-Pfad würde sonst im Client-Bundle und im HTML jeder Kachel landen.
- Betroffen sind auch die Kacheln „Das könnte Ihnen gefallen“ auf der Produktseite.
