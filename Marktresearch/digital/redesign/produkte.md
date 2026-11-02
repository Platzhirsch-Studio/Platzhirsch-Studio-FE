# Paket „Katalog und Produktseiten“ – Runde 2 (QA-Fixes)

Stand: 26.10.2026 · Branch `feature/neuauftritt` (nicht committet) · Grundlage: `qa-screenshots/neuauftritt/produkte/feedback.md` (Note 7/10). Die Beschreibung des Umbaus aus Runde 1 steht in `katalog.md`.

## Behoben

### P1
- **P1-1 Zustand in der URL.** Filter und Ladeschritt stehen jetzt in der Query, z. B. `?marke=minotti&typ=modulsofa&seite=2`. Die Werte sind Slugs, mehrere Werte werden mit Komma getrennt. Die Parameter heißen `marke`, `kategorie`, `typ`, `material`, `farbe`, `designer`, `bereich` und `seite`.
  - Geschrieben wird die URL per `history.replaceState`. Next 16 gleicht das mit `useSearchParams` ab, ohne Refetch und ohne Scrollsprung (Doku: linking-and-navigating, „Native History API“). Der Effekt entspricht `router.replace(…, {scroll:false})`, nur ohne RSC-Anfrage.
  - Gelesen wird die URL in `shopCatalogFromUrl.js`, und zwar einmal beim Mounten.
  - „Mehr Produkte anzeigen“ ist ein echter Link `…?seite=n+1`. Ein normaler Klick lädt die Kacheln an Ort und Stelle nach, Strg- oder Mittelklick öffnet den Link in einem neuen Tab.
  - Der Canonical zeigt bei gefilterten URLs weiter auf die ungefilterte Kategorie (geprüft mit `?marke=minotti&seite=2`). Die Robots-Angabe `index, follow` ist unverändert.
  - Abnahme (WebKit iPhone und Chromium 1440): Minotti, Mehr laden, „Ruffle“ öffnen, zurück. Danach steht dieselbe URL da, 48 Kacheln sind geladen, `scrollY` ist gleich und die Kachel ist im Bild.
- **P1-2 Produktseite.** Das neue Modul `descriptionBlocks.js` teilt den CMS-Text auf:
  - Sichtbar bleiben höchstens 2 Absätze bzw. 90 Wörter. Der Rest liegt in `<details>` („Ganze Beschreibung lesen“) und bleibt damit im Server-HTML.
  - Der technische Teil beginnt ab der CMS-Überschrift oder ab den „**Label:**“-Absätzen. Er steht jetzt unter „Material und Ausführung“: als H3 „Ausführungen“ und darunter ein Akkordeon je Bauteil (Gestell, Kissen, Abziehbarkeit …).
  - CMS-`h4` wird zu `h3` (Stil `title`, Abstand `stack-m`).
  - Abnahme: Bei 393 × 852 erscheint „Gebaut, um zu bleiben“ nach 4,6 Bildschirmen (Ziel ≤ 6).

### P2
- **P2-1 Zoom.** Das bereits geladene Lightbox-Bild (gleiche `src`/`sizes`/`quality`) liegt als Platzhalter unter der Zoom-Version. Die Zoom-Version lädt `eager` mit `fetchPriority="high"` und `quality={75}`. Die Allowlist in `next.config` erlaubt nur 50/75/90/100, Werte von 80 bis 85 würden umgerechnet. Die Zoomfläche ist auf höchstens 1920 × 1280 px begrenzt, dadurch wird das Bild nicht mehr gestreckt. Die Lightbox-Slides neben dem aktuellen Bild laden `eager`.
- **P2-2 Primärknopf.** Er steht jetzt in voller Spaltenbreite auf einer eigenen Zeile. Bei 1440 px ist er einzeilig und 52 px hoch. „Merken“ und „Anrufen“ stehen darunter als leise Textknöpfe.
- **P2-3 „Sofas & Couches“.** Die eigentliche Ursache war, dass in `[product]/page.js` die Destrukturierung von `Promise.all` vertauscht war: `marken` bekam die Kategorien, `kategorien` die Marken. Die Korrektur behebt Breadcrumb, Overline, Zurück-Link und den Eintrag `BreadcrumbList` im JSON-LD. **Nebeneffekt:** Der Abschnitt „Marke und Designer“ und die Zeile „Herkunft der Marke“ erscheinen jetzt erstmals, sie waren vorher immer leer.
- **P2-4 Merken.**
  - Der Textknopf hat kein `aria-label` mehr. Er nutzt den sichtbaren Text („Merken“/„Gemerkt“) und `aria-pressed`.
  - Das Herz heißt jetzt „Merken: {Marke Name}“ mit `aria-pressed` (`wishlistHeart.js`, die API bleibt kompatibel).
- **P2-5 Kachel.**
  - Das Foto füllt das 3:2-Feld randlos (`object-cover`). Die Herstellerbilder sind Querformat-Raumbilder, die breiter als 3:2 sind.
  - Das Herz sitzt bündig in der Ecke (`corner`).
  - Die erste Kachelreihe lädt `eager` (P3-4).
- **P2-6 Mobiler Katalog.**
  - Der Lead ist kurz: „Von Minotti, Eichholtz, Poliform. Ansehen und vergleichen nach Termin in Lochau.“
  - Der Kopf ist mobil enger.
  - Der vollständige SEO-Satz steht unter dem Raster als „Über diese Kategorie“ (H2).
  - Auf dem iPhone liegt die erste Kachel bei y = 395 px (Ziel ≤ 560).
  - Hub: Der Lead ist mobil in Body-Größe gesetzt.
- **P2-7 Raumbilder.** Es gibt nur noch das eigene Bild der Kategorie (CMS-Bild oder das zugeordnete Raumfoto). Weitere Pausen erscheinen als ruhiges Textband ohne fremdes Bild.
- **P2-8 Fokus.** Filter und Lightbox merken sich den Auslöser und rufen beim `close` explizit `focus()` auf. In WebKit geprüft: Der Fokus landet auf „Alle Filter“ bzw. auf „Bild 1 vergrößert ansehen“.

### P3
- (1) Die Checkboxen haben `appearance:none`, sind 20 px groß, haben einen 1-px-Rahmen und einen SVG-Haken. Sie sind eckig.
- (2) Der Galeriezähler ist nur noch in einer Live-Region gleichzeitig.
- (3) Inaktive Lightbox-Slides waren schon `inert`.
- (4) Die erste Kachelreihe lädt `eager`.
- (5) Der Leitsatz „Nehmen Sie Platz.“ ist jetzt die H2 im Schluss-Band, „Sehen, sitzen, entscheiden.“ steht darunter als Lead in Instrument.
- (10) Die Overline „Beschreibung des Herstellers“ steht direkt über dem Herstellertext.

## Dateien
- `src/components/ShopCatalog/`:
  - `shopCatalog.js`
  - `shopCatalogFromUrl.js`
  - `catalogTile.js`
  - `catalogHeader.js`
  - `wishlistHeart.js`
  - `productActions.js`
  - `productGallery.js`
  - `productInfoTabs.js`
  - `copy.js`
  - **neu:** `descriptionBlocks.js`
- `src/app/[locale]/produkte/[category]/page.js` (`basePath`, Lead, „Über diese Kategorie“, Raumbilder)
- `src/app/[locale]/produkte/[category]/[product]/page.js` (Fetch-Reihenfolge, Labels, Schluss-Band)
- `Marktresearch/digital/redesign/messages-katalog.json`: neu erzeugt aus `FALLBACK`, die Schlüssel sind in allen 4 Sprachen gleich. Neue Schlüssel:
  - `shop.catalog.saveItem`
  - `shop.catalog.aboutCategory`
  - `shop.catalog.categoryLead`
  - `shop.catalog.pageNav`
  - `shop.atelier.manufacturerText`
  - `shop.atelier.readMore`
  - `shop.atelier.readLess`
- `CartPage.js` ist unverändert.

## Offen
- **Integration (P2-4):** `merkliste/page.js` gehört nicht zu diesem Paket. Die dunkle Vollbild-Hero mit der H1 „Merkliste“ verdrängt mobil die Auswahl. Außerdem sollte ein einheitlicher Begriff gelten: Knopf „Merken“, Seite und H1 „Ihre Auswahl“.
- **P3-6:** Doppelte Kacheln (Torii, Side, Tape, Yves) und Tische in der Kategorie Sofas. Das ist Datenpflege im Backoffice.
- **P3-7:** Für Lawrence fehlt der Maße-Abschnitt (kein Feld `dimensionsRaw`). Ansprechperson, Preisrahmen und Lieferspanne fehlen ebenfalls, das sind Datenlücken.
- **P3-8:** „Designer Sofas“ soll „Designer-Sofas“ heißen (`shopSeoCopy.js`, Paket „Recht & Texte“).
- **P3-9:** Die Leistungsversprechen muss der Inhaber bestätigen.
- **P3-11:** Eine 301 von `/de/produkte/sofas` auf `sofas-couches` fehlt (Redirect-Pflege, nicht in diesem Paket).
- **P3-12:** Die Produktliste steht wegen des `Suspense`-Fallbacks weiter zweimal im RSC-Payload (rund 500 KB). Lösen ließe sich das nur, wenn die Seite dynamisch würde. Das widerspricht dem statischen Prerender, deshalb ist es nicht umgesetzt.
- **P3-13:** Hydration-Warnungen kamen in den Läufen nicht vor (`report.json`: 0 Konsolenfehler).
- **Bekannte Einschränkung:** Der Katalog liest die Query nur beim Mounten. Ein Link mit anderem `?marke=` auf dieselbe, bereits offene Kategorie setzt den Filter nicht neu.

## Benötigte Bilder
Unverändert gegenüber `katalog.md` §7, vor allem eigene Showroom-Raumbilder je Kategorie für die Katalog-Pausen. Bis dahin hat jede Kategorie höchstens ein Raumbild.

## Prüfung
- `node tools/qa/shoot.mjs …/produkte/fix …`: alle Seiten 200, 0 Konsolenfehler, 0 fehlgeschlagene Requests. Die Auftrags-URL `/de/produkte/sofas/sofas-lawrence` leitet per 308 auf `sofas-couches` weiter.
- Interaktionen: `qa-screenshots/neuauftritt/produkte/fix/interaktion/` (iPhone WebKit und Desktop Chromium).
- ESLint auf `src/components/ShopCatalog` und `src/app/[locale]/produkte`: ohne Befund.

## Runde 3 (R3-produkt, 26.10.2026)

- **Geprüfte Produkttexte** (`src/lib/productCopy`) sind in `produkte/[category]/[product]/page.js` verdrahtet: Lead unter der H1 (`<p>`), eigene Absätze im Block „Über das Stück“ vor dem Herstellertext, Block „Fakten laut Hersteller“ mit Quellen-Link je Zeile, Block „Häufige Fragen“ als `<details>` plus `FAQPage` im JSON-LD-Graph (gleiche Bedingung `showFaq`). Freigegebenes Meta ersetzt Title/Description; Canonical/hreflang bleiben auf der Live-URL.
- **Freigabe per Text-Hash** (`approvals.js`, Werkzeug `approve.mjs`): ganzer Eintrag oder je Feld/FAQ-Antwort. `approved: true` ohne passenden Hash zeigt nichts. Geänderter Text wird unsichtbar, bis er neu freigegeben ist. Nur `de`; EN/FR/IT bekommen nie deutschen Text.
- **Dev-Vorschau:** `?produkttext=vorschau` (nur `NODE_ENV !== "production"`, nur `de`) zeigt den Entwurf mit Hinweis, ohne Meta- und JSON-LD-Wirkung.
- **Herstellertexte** laufen beim Rendern durch `src/lib/shop/manufacturerText.js` (Regeln aus `src/lib/legal`): Superlativ-, Händler- (ClassiCon ausgenommen), Verfügbarkeits-, Liefer- und Preissätze fallen weg. Gilt für CMS-Beschreibung, CMS-Meta, Marken-Bio und alle Zugriffe auf `staticShopProducts.js` / `importedProducts/*`.
- **Bühne:** Bild randlos (ohne `p-3`), Vergrößern-Knopf in der Steuerzeile statt im Bild (Abnahme R1).
- **Startliste Freigabe (QM P2-2):** `node src/lib/productCopy/approve.mjs --startliste` gibt 10 Stücke mit Vorschau-Link und Freigabebefehl aus (`startList.js`: 4 × ClassiCon, Flos Arco, 5 × Minotti). Die Auswahl folgt nachvollziehbaren Kriterien und nicht der Besucherzahl, weil es keine Statistik gibt.
- **Zoom (QM P3-1/P3-2):** Die Lightbox zeigt sofort das gecachte Bühnenbild als Platzhalter. Das Bühnenbild ist kein Tab-Stopp mehr (`tabIndex=-1`). Nach dem Schließen kehrt der Fokus zum Vergrößern-Knopf in der Steuerzeile zurück.

## Runde 4 (R4-produkt, 26.10.2026)

- **Produktkopf mobil (Abnahme R2):** Die Overline (Marke · Kategorie), die H1 und der Designer stehen jetzt über der Bühne. Danach folgen die Galerie und direkt der Primärknopf. DOM-Reihenfolge = Lesereihenfolge. Ab `lg` sitzt der Titel in Zeile 1 der rechten Spalte, die Aktionen stehen sticky in Zeile 2. Auf Handys entfällt der Thumbnail-Streifen (Zähler, Pfeile und Wischen bleiben).
- **Maße als Tabelle:** `src/lib/shop/dimensions.js` liest nur beschriftete Werte (ca. 20 Backoffice-Formate wie „W. 242 | D. 98 | H. 74 cm“, „Ø 40 | H. 60 cm“, „Breite (mm): 450“, Bauteile „Kopfteil X – Höhe: 100 cm“, Größen „S: … / L: …“). Unbeschriftete („220 x 98 x 74 cm“), abgeschnittene oder halb lesbare Angaben bleiben Rohtext, denn es wird nichts geraten. Die Tabelle ist ein `<table>` mit `th scope="row"`, eine Gruppenzeile je Bauteil oder Größe und einer sr-only-Caption.
- **JSON-LD:** `width`/`height`/`depth` als `QuantitativeValue` (`unitCode` CMT). Das gilt nur, wenn der Wert ohne Gruppe genau einmal vorkommt. `weight` (KGM) kommt aus der Maßangabe oder aus dem Gewichtsfeld. Kein `offers`, keine Preise.
- **Downloads:** Die Spalten `2d`/`3d`/`katalog` aus `pdf_produkte` (520 von 1 765 Stücken) werden nur über `/cmx` verlinkt. Beschriftung: „Produktdatenblatt“ bzw. „Katalog: <Dateiname>“. Ein Klick löst `trackEvent("file_download")` aus (`downloadList.js`). Der Block „Downloads“ erscheint jetzt immer, mit dem Sekundärknopf **„Planungsdaten anfragen“**. Er führt zum Beratungsformular mit vorausgefülltem Betreff („Anfrage zu: Marke Modell – Planungsdaten (Zeichnungen, CAD)“).
- **Brotkrume:** Home › Produkte › Kategorie › **Marke Kategorie** › Stück. Die Marken-Stufe nutzt `brandCategoryHref` aus `src/lib/marken` und erscheint nur, wenn die Marke-×-Kategorie-Seite indexierbar ist (mindestens 3 Stücke, keine Kollision, nicht auf der Audit-Liste). Sie steht sichtbar und im BreadcrumbList-JSON-LD.
- **Bühnenbild** q=75 statt 90.
- **IT-Fallbacksatz:** „Ti offriamo consulenza su questo pezzo …“.

## R4 QM-Fix (26.10.2026)

- Telefon (< sm): Die Brotkrume ist einzeilig (Eltern-Stufe › Stück), die volle Brotkrume steht ab sm und im JSON-LD. Die Bühne bleibt 3:2, höchstens 28svh. Der Primärknopf steht so auf dem iPhone 15 Pro auch beim Erstbesuch über dem Cookie-Banner.
- Bei Maßen ohne Achsen („67 x 51 cm“) bleibt der Rohtext stehen. Dazu kommt der Hinweis `atelier.dimensionsUnlabelled`. Es wird keine Zuordnung zu B/T/H erfunden.
- Downloads: Der sr-Zusatz lautet nur „öffnet in neuem Tab“. Bei Katalogen wird das Wort „katalog“ aus dem Dateinamen entfernt.

## Runde 5 (R5-produkt, 26.10.2026)

- **Kein Fremdfoto (P1):** Produkte ohne Backoffice-Bild (152 aktive Stücke: Brand van Egmond 111, Next125 13, Quasar 13, Minotti 4, Flos 4, Poliform 3, Rimadesio 2, ClassiCon 1, Umbrosa 1) zeigen auf der Bühne eine neutrale Fläche (`bg-linen`, 3:2 wie die Galerie, auf Telefonen max. 28svh): Wortmarke, Messinglinie, Hinweis „Für dieses Stück liegt noch kein Foto vor“ als echter Text (`ShopCatalog/noPhoto.js`). OG-Bild: `/{locale}/produkte/kein-foto.png` (1200 × 630, typografisch, statisch). JSON-LD: `image` entfällt. Keine Hersteller-Bild-URLs.
- **Timeout ≠ 404 (P2):** `fetchProduktNewByPathField` → `src/lib/api/produktDetail.js`. Nicht gefunden (`{}`, leere message, 404) → `null` → `notFound()`. Timeout, Netzfehler, 5xx, andere 4xx und kaputtes JSON werfen `BackofficeError` → `error.js`, HTTP 500, kein Cache.
- **Brotkrume:** Die Stufe „Marke Kategorie“ kommt aus `getIndexableBrandCategoryHref` (`src/lib/marken/brandCategoryLoader`, nur Import).
- **iPhone SE:** Auf kurzen Telefonen (< sm, Höhe ≤ 600 px) entfällt die einzeilige Brotkrume (sie bleibt im JSON-LD, die Links zu Marke und Kategorie stehen in der Overline), und die Bühne ist auf 18svh begrenzt. Gemessen bei 375 × 568: Der Knopf endet bei 353–386 px, das Banner beginnt bei ≥ 423 px.
- **Galerie (TBT):** Die Bühne nutzt natives Scroll-Snap statt Embla. Die Lightbox ist ein eigener Chunk (`productLightbox.js`), der bei Hover/Fokus vorgeladen und erst beim Öffnen gemountet wird. Die Thumbnails erscheinen ab sm nach `requestIdleCallback`, der Platz ist reserviert, es gibt also kein CLS.
