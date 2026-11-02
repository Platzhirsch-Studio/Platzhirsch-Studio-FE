# SEO-Audit Bestandsseiten (lokaler Crawl)

Stand: 26.10.2026 · Quelle: Crawl von `http://localhost:3000` (Dev-Server, Stand des Arbeitsverzeichnisses). Startliste aus `sitemap.xml` mit den Teil-Sitemaps static, marken, news und produkte. Die Sitemap-URLs zeigen auf platzhirsch.studio und wurden auf localhost umgeschrieben. Dazu kommen intern verlinkte `/de`-Seiten.
Werkzeug: eigenes Node-Skript (fetch + cheerio, 4 parallele Abrufe). Es liegt im Scratchpad, nicht im Repo.

## 1. Umfang und Kennzahlen

| Kennzahl | Wert |
|---|---|
| Gecrawlte URLs | 324 (273 DE, 51 EN/FR/IT) |
| Davon in der Sitemap | alle; über interne Links kamen keine zusätzlichen indexierbaren DE-Seiten hinzu |
| Sitemap gesamt | 7.677 URLs (static 53, marken 336, news 124, produkte 7.164) |
| Stichprobe Produkte | 104 von 1.760 DE-Produktdetailseiten (jede 16.), dazu alle 31 DE-Kategorien |
| Status 200 im 1. Durchlauf | 314 |
| Fehler im 1. Durchlauf | 9× 500 und 1× 404. Beim Nachtest lieferten alle 200, außer `/de/ueber-uns/presse`: Die Seite gab mit Standard-User-Agent erneut 500 zurück, mit dem User-Agent des Googlebot 200. Live liefert sie 200. |
| Fehlender `<title>` im 1. Durchlauf | 28 Seiten. Beim Nachtest war der Titel überall vorhanden: Der Dev-Server war überlastet, die Seiten sind in Ordnung. |
| Meta Description fehlt | 0 |
| H1 fehlt / mehrfach | 0 / 0 |
| Canonical fehlt / zeigt auf eine fremde URL | 0 / 0 |
| `lang`-Attribut passt nicht zur Sprache | 0 |
| noindex | 4 (Newsletter, Impressum, Datenschutz, Merkliste); das ist so gewollt |
| Bilder ohne alt-Attribut | 0. 770 Bilder haben `alt=""`, meist Flaggen und Galerie-Thumbnails. |
| Median ausgehender interner Links pro Seite | 69 (Mega-Menü und Footer) |

**Wortzahl im Hauptinhalt (`<main>` ohne nav, header und footer), Median je Seitentyp:**

| Seitentyp | n | Median | Min | Max | Ladezeit Dev (Median) |
|---|---|---|---|---|---|
| Startseiten und statische Seiten | 44 | 189 | 13 | 4.502 | 2,7 s |
| Landingpages (Region/Thema) | 9 | 466 | 417 | 624 | 1,6 s |
| Markenseiten | 41 | 281 | 241 | 388 | 3,2 s |
| Kollektionsseiten (`/marken/<marke>/<kollektion>`) | 54 | **60** | 28 | 169 | 6,6 s |
| News-Artikel | 31 | 233 | 170 | 430 | 4,2 s |
| Produktkategorien | 31 | **80** | 24 | 138 | 6,0 s |
| Produktdetailseiten (Stichprobe) | 104 | 187 | 74 | 886 | 8,3 s |

Die Ladezeiten stammen vom Dev-Server unter Last durch parallele Agenten. Sie sind nur als relative Werte brauchbar.

**JSON-LD je Seitentyp:**

| Seitentyp | Typen |
|---|---|
| Alle Seiten | Organization/FurnitureStore, WebSite |
| Startseiten | zusätzlich WebPage, auf 4 Seiten FAQPage |
| Landingpages | WebPage, FAQPage |
| Kontakt | ContactPage |
| Kategorien | CollectionPage mit ItemList und eingebetteter BreadcrumbList |
| Markenseiten | AboutPage (keine BreadcrumbList, kein Brand/ItemList) |
| **Kollektionsseiten** | **nur die globalen Typen, sonst nichts** |
| News | NewsArticle, BreadcrumbList |
| Produkte | Product, BreadcrumbList |

**hreflang:** Alle mehrsprachigen Seitentypen haben einen vollständigen Satz: de, de-AT, de-CH, en, fr, fr-CH, fr-FR, it, it-CH, it-IT und x-default. Die 9 Landingpages gibt es nur auf Deutsch, sie haben kein hreflang. Das ist vertretbar.

## 2. Probleme nach Priorität

### Priorität A (hohe Wirkung)

1. **Produktseiten sind intern verwaist.** Eine Kategorie rendert im HTML nur die ersten 24 Produkte. Alles Weitere lädt erst per Klick nach, über clientseitiges `visibleCount`. Die Kategorie Sofas zählt zum Beispiel 105 Produkte, im HTML sind 24 verlinkt. In der Stichprobe hatten 60 von 104 Produktseiten keinen einzigen eingehenden internen Link aus den gecrawlten Seiten. Google findet sie nur über die Sitemap und über die ItemList im JSON-LD, und JSON-LD zählt nicht als Link. Auf diesen Seiten ruht Hebel H1 aus dem Schlachtplan, die Long-Tail-Produktseiten.
   *Dateien:* `src/components/ShopCatalog/shopCatalog.js` (Zeile 72 `PRODUCTS_PER_PAGE = 24`, Zeilen 276–280) und `src/app/[locale]/produkte/[category]/page.js`.
   *Maßnahme:* Crawlbare Paginierung über Pfade wie `/produkte/sofas-couches/seite/2` oder alle Produktlinks als echte `<a>` im HTML, die nur optisch eingeklappt sind. Query-Parameter scheiden aus, denn `robots.js` sperrt für `*` alle URLs mit `?`. Für den Googlebot gilt diese Sperre nicht, für Bing und andere Crawler schon. Zusätzlich sollten Markenseiten auf ihre Produkte verlinken. In der Stichprobe hatten die Markenseiten 0 Links auf Produktdetailseiten.

2. **Kollektionsseiten sind Thin Content ohne Struktur.** Die 54 Kollektionsseiten haben im Median 60 Wörter, im Minimum 28, zum Beispiel `alonpi-heritage`, `tuuci-brickell`, `umbrosa-nata` und `heatsail-beem`. JSON-LD gibt es dort nur in Form der globalen Typen, und die Titel wiederholen sich, etwa „101 Copenhagen Brutus Dining Chair Kollektion – 101 Copenhagen | Platzhirsch Home Living“ mit 88 Zeichen.
   *Dateien:* `src/lib/marken/collectionPage.js` (Titelbau Zeile 114, Description Zeile 129) und `src/app/[locale]/ueber-uns/marken/[title]/[collection]/page.js` (kein `JsonLd`).
   *Maßnahme:* CollectionPage, ItemList und BreadcrumbList ergänzen. Den Markennamen nicht doppelt in den Titel setzen. Pro Kollektion 120–200 Wörter eigener Text, nur mit belegten Fakten aus dem Herstellermaterial. Bis dahin Kollektionen mit weniger als 50 Wörtern und ohne Produkte auf `noindex, follow` setzen oder in die Markenseite einbinden.

3. **Kategorieseiten sind dünn.** Die 31 Kategorien haben im Median 80 Wörter. Die schwächsten sind `desk-chairs` (24), `tv-low-units` (32), `display-cabinets` (35), `wardrobes` (41), `heaters` (47) und `bar-stools` (59). Gerade diese Seiten sollen aber auf Suchen wie „Designer Sofas Vorarlberg“ ranken.
   *Datei:* `src/lib/seo/shopSeoCopy.js`.
   *Maßnahme:* Unter dem Raster 150–300 Wörter Beratungstext ergänzen, dazu die verfügbaren Marken mit Links und 3–4 FAQ.

4. **Die neuen Regionsseiten fehlen in Sitemap und Verlinkung.** Folgende Seiten liefern lokal bereits 200 mit `index, follow`, stehen aber weder in `LANDING_PAGES` noch in `sitemap-static.xml` und sind deshalb auch nicht im Footer verlinkt: `designermoebel-appenzell`, `-arlberg`, `-feldkirch`, `-kempten`, `-konstanz`, `-liechtenstein`, `-ravensburg`, `-rheintal` und `/de/yacht-interior`. Laut Git-Status sind sie noch in Arbeit. Vor dem Go-live müssen sie in `src/lib/content/landingPages.js` eingetragen werden, denn darüber laufen Sitemap und Footer.

5. **`/de/ueber-uns/presse` liefert sporadisch 500.** Lokal kam die 500 zweimal mit Standard-User-Agent, live zuletzt 200. Die Seite ist über das Menü von allen 273 DE-Seiten verlinkt. Die Datenquelle der Seite sollte geprüft und gegen Fehler abgesichert werden (Fallback statt Fehlerseite). Datei: `src/app/[locale]/ueber-uns/presse/page.js`.

### Priorität B (mittlere Wirkung)

6. **Titel zu lang.** 107 von 314 Titeln haben mehr als 60 Zeichen, 36 mehr als 70. Ursache ist meist das Suffix „ | Platzhirsch Home Living“ mit 26 Zeichen.
   - Kategorien doppeln Begriffe, zum Beispiel „Design Chaiselongues & Daybeds in Vorarlberg – Chaiselongues & Daybeds | Platzhirsch Home Living“ mit 96 Zeichen und `lounge-furniture-daybeds` ebenfalls mit 96. Muster in `src/lib/seo/shopSeoCopy.js` Zeilen 84–85: Den zweiten Teil weglassen, wenn er das Keyword nur wiederholt.
   - Produkte, die aus Variantennamen gebaut werden, etwa „Modular Sofa Lounge Club - Ottoman (Modular Sofa Lounge Club Ottoman Cm0406) – Eichholtz | …“ mit 114 Zeichen. Datei: `src/app/[locale]/produkte/[category]/[product]/page.js` (`productMetaTitle`, ab Zeile 142). Den Klammerzusatz entfernen, wenn er den Namen wiederholt.
   - News-Titel liegen bei 61–65 Zeichen. Die Startseiten EN mit 76, FR mit 73 und DE mit 62 Zeichen lassen sich kürzen.
7. **Meta Descriptions zu lang.** 18 Descriptions haben mehr als 160 Zeichen, zum Beispiel `/de/produkte` (172), `/de/designermoebel-bregenz` (173), `lounge-furniture-daybeds` (176) und `chaise-longues-daybeds` (174). Dateien: `shopSeoCopy.js` und `src/lib/content/landingPages.js` bzw. die jeweilige `page.js`.
8. **Doppelter Titel.** „Contact | Platzhirsch Home Living“ steht sowohl auf `/en/contact` als auch auf `/fr/contact`. Die FR-Version sollte „Contactez-nous | …“ heißen. Quelle: Metadata von `src/app/[locale]/kontakt/page.js` bzw. `messages/fr.json`.
9. **Wichtige Conversion-Seiten sind dünn.** Betroffen sind `/de/beratung` mit 89 Wörtern (EN 96, FR und IT 108), `/de/kontakt` mit 178, `/de/ueber-uns/team` mit 154 und `/de/ueber-uns/partner` mit 123. Gerade die Beratungsseite sollte erklären, was die Beratung umfasst, wie sie abläuft und welche Marken dazugehören, ergänzt um FAQ.
10. **Markenseiten ohne Breadcrumb- und Brand-Schema.** Sie nutzen nur AboutPage. BreadcrumbList ergänzen und `about` mit `@type: Brand` auszeichnen. Dateien: `src/app/[locale]/ueber-uns/marken/[title]/page.js` und `src/lib/seo/brandSchema.js`.

### Priorität C (Feinschliff)

11. Galerie-Thumbnails auf Produktseiten haben `alt=""` (539 Stück auf 104 Seiten). Das ist zulässig, weil das Hauptbild einen Alt-Text trägt. Für die Google-Bildersuche wären Alt-Texte wie „Twiggy Sofa – Ansicht 2“ besser. Datei: `src/components/ShopCatalog/productGallery.js` (Zeilen 334, 348 und 421).
12. Die News-Artikel unter `/en`, `/fr` und `/it` tragen deutsche Slugs, zum Beispiel `/en/news/classicon-moebeldesign-von-klassiker-bis-moderne`. Das funktioniert, nur bringen die Slugs in diesen Sprachen keine Keywords.
13. Sitewide verlinkt das Mega-Menü bzw. der Footer auf jeder Seite die 10 Marken Minotti, Poliform, Rimadesio, Flos, Paola Lenti, Tom Dixon, ClassiCon, Tréca, Eichholtz und Gloster sowie alle 31 Kategorien und 9 Landingpages. Damit bekommen diese Seiten je 273 Links. Die übrigen 26 Marken, darunter Agape, Antoniolupi, Bombyxx, Bullfrog, Emu, Frost, Lambert, Papadatos, Pomax, Qeeboo und Trapa, haben nur genau einen eingehenden Link, nämlich von der Markenübersicht.

## 3. Thin Content (unter 250 Wörtern Hauptinhalt, ohne Produkte)

| Gruppe | Seiten (Wortzahl) | Empfehlung |
|---|---|---|
| Kollektionen unter 60 Wörtern | alonpi-heritage (28), livintwist-convivio (32), tuuci-brickell (32), umbrosa-nata/eclipsum/icarus/versa (33–34), heatsail-beem/disc/dome/glow (34–35), livintwist-apsaras (36), solpuri-breeze/butler/club/boom/charlie/aton/bari/caro (53–56), sifas-kwadra (56), sifas-nabab (58), sifas-hips/kross (59) | Ausbauen oder `noindex, follow` setzen |
| Kollektionen 60–170 Wörter | übrige Sifas-, Solpuri- und 101-Copenhagen-Kollektionen, livintwist-belvedere (129) | Ausbauen, Produkte verlinken |
| Kategorien | desk-chairs (24), tv-low-units (32), display-cabinets (35), wardrobes (41), heaters (47), bar-stools (59), chaise-longues-daybeds (64), side-tables (68), kitchen (69), kitchen-accessories (69), sun-loungers (74), decor/sideboards-chests (75), `/de/produkte` (77) sowie alle anderen unter 140 | Beratungstext, Marken-Links, FAQ |
| Statische Seiten | beratung (89), partner (123), team (154), kontakt (178), karriere (193) | Beratungsseite zuerst |
| News | alle 31 zwischen 170 und 430 Wörtern, z. B. lagerabverkauf (170), minotti-exklusives-moebeldesign-fuer-draussen (172), salone-del-mobile-2024-outdoor (182) | Zeitlose Artikel zu Ratgebern ausbauen, veraltete wie Öffnungszeiten 2023/24 oder Broschüre 2022 auf noindex setzen bzw. zusammenführen |
| Markenseiten | quasar (241), tonon (243), bombyxx (247); alle übrigen 250–390 | Markengeschichte, Kollektionen und Produkte verlinken |
| Produkte | 10 von 104 haben unter 120 Wörter (Minimum 74) | Fällt bei Produktseiten weniger ins Gewicht |

## 4. Interne Verlinkung: Vorschläge

**Ausgangslage:** Die Landingpages haben je 417–624 Wörter, sind sitewide verlinkt und tragen FAQPage-Schema. Sie verlinken die 31 Kategorien, die 10 Footer-Marken und die anderen Landingpages, aber keinen News- oder Ratgeber-Artikel. Die Markenseiten verlinken weder News noch Produkte. Von 31 News-Artikeln enthalten nur vier einen Link auf eine Marke außerhalb der 10 Footer-Marken (Solpuri, Heatsail, Schüller). Der Artikel „Solpuri – für die Sonnenseite des Lebens“ verlinkt die Solpuri-Seite nicht, „Quasar – auffallend innovatives Lichtdesign“ die Quasar-Seite nicht. Ratgeberseiten gibt es noch keine (Hebel H5, Sprint 2–3).

**Konkrete Linkvorschläge:**

| Von (stark) | Nach | Ankertext-Idee |
|---|---|---|
| `/de` (Startseite, 2.325 Wörter, Linkziel aller Seiten) | die 8 neuen Regionsseiten, sobald fertig, in einem Block „Für Ihre Region“; die künftigen Ratgeber; Agape, Antoniolupi und Brand van Egmond in einem Block „Bad & Licht“ | „Designermöbel in Feldkirch“, „Ratgeber Küchenplanung“ |
| `/de/kuechen-vorarlberg` (624 Wörter) | `/de/ueber-uns/marken/next125`, `…/poliform`, `…/frost`, `…/schueller`; News `kuechenkonzepte-mit-mcr-bora-next125-und-frost` und `poliform-cucine-designkuechen-nach-mass`; Ratgeber „Was kostet eine Designküche“ | „next125-Küchen“, „Poliform Küchen nach Maß“ |
| `/de/wohnzimmer-einrichten-vorarlberg` | Kategorien sofas-couches, coffee-tables, rugs; News `minotti-flos-alonpi-fuer-ihr-wohnzimmer` und `poliform-day-…`; Marken alonpi, baobab, tonon | „Teppiche von Alonpi“ |
| `/de/moebel-bodensee` und `/de/designermoebel-lindau`, `-friedrichshafen` | Outdoor-Marken solpuri, tuuci, umbrosa, heatsail, sifas; News `garten-als-erweiterung-des-wohnraums` und `sommer-inspiration-fuer-ihren-aussenbereich`; `/de/yacht-interior`, sobald live | „Outdoor-Möbel für die Terrasse am See“ |
| `/de/designermoebel-st-gallen` (und Liechtenstein, Appenzell, Rheintal) | Ratgeber „Möbel aus Österreich in die Schweiz einführen“ (Mehrwertsteuer, Zoll), sobald vorhanden; Beratung | „Einfuhr in die Schweiz – so geht’s“ |
| `/de/interior-design-vorarlberg` | `/de/beratung`, `/de/ueber-uns/team`, Markenübersicht, Ratgeber „Ablauf einer Einrichtungsplanung“ | „Ablauf unserer Einrichtungsberatung“ |
| Footer-Marken (minotti, poliform, flos, paola-lenti, rimadesio, classicon, treca: je 273 Links) | den passenden News-Artikel, z. B. minotti zu den 4 Minotti-Artikeln, flos zu `flos-ausdrucksstarke-leuchten-designs`, rimadesio zu `rimadesio-design-aus-glas-und-aluminium`, treca zu `treca-paris-minotti-poliform-schlafkomfort`; außerdem die Top-Produkte der Marke und die passende Landingpage, etwa poliform zu kuechen-vorarlberg | „Aktuelles zu Minotti“, „Minotti-Sofas ansehen“ |
| News-Artikel (31) | jeweils Kontext-Link im Fließtext auf die besprochene Marke, mindestens eine passende Kategorie und eine Landingpage. Zuerst: solpuri-…, quasar-…, paola-lenti-… (2×), poliform-… (3×), kuechenkonzepte-… zu next125 und frost, treca-… | Markenname als Anker |
| `/de/ueber-uns/marken` (Übersicht) | Kollektionen und Produkte statt nur Markenkacheln; die Marken mit nur einem eingehenden Link (agape, antoniolupi, bombyxx, bullfrog, emu, frost, lambert, papadatos, pomax, qeeboo, trapa) zusätzlich aus passenden Kategorien verlinken, etwa emu und pomax aus garden-chairs, qeeboo aus decor, lambert aus small-furniture | „Gartenstühle von Emu“ |
| Kategorien | Abschnitt „Marken in dieser Kategorie“ mit Links auf die Markenseiten sowie 1–2 Ratgeber, etwa sofas-couches zu „Sofa-Ratgeber: Bezug, Sitztiefe, Pflege“ | |
| Produktseiten (verlinken die Marke schon) | Link auf die Kollektionsseite und die passende Landingpage | „Mehr aus der Kollektion Twiggy“ |

## 5. Methodik und Grenzen

- Bei den Produktdetailseiten wurde nur eine Stichprobe von 104 aus 1.760 gecrawlt. Kategorien, Marken, Kollektionen, News und statische Seiten auf Deutsch sind vollständig erfasst, EN/FR/IT nur stichprobenartig.
- Gezählt wurde der Text in `<main>` ohne nav, header, footer, script und svg. Text, der erst clientseitig nachgeladen wird, ist nicht enthalten. Für Google gilt dasselbe, solange er nicht im Server-HTML steht.
- „Eingehende Links“ zählt nur Links unter den 314 gecrawlten Seiten. Produktseiten außerhalb der Stichprobe können weitere Links liefern.
- Statuscodes stammen vom Dev-Server, auf dem viele Agenten parallel arbeiten. Die 500er und die fehlenden Titel im ersten Durchlauf waren bis auf `/de/ueber-uns/presse` nicht reproduzierbar.
