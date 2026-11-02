# 17 – SEO-Wettbewerbsanalyse: 10 regionale Wettbewerber, technisch und inhaltlich

**Stand:** 26.10.2026 · Rolle: Suchmaschinen-Experte Wettbewerbsanalyse
**Methode:** Live-Abruf am 26.10.2026 per HTTP (curl, Browser-User-Agent) für Startseite, `robots.txt`, alle Sitemaps und Stichproben von Marken-, Sale- und Produktseiten. Ausgewertet wurden Title, Meta-Description, `<html lang>`, hreflang, JSON-LD/Microdata, HTML-Größe, Antwortzeit, Gewicht der Startseite und Wortzahl. Ergänzt um die SISTRIX-Daten aus `docs/seo-ux/02-implementation-report.md` und Bericht 01.
**Baut auf:** 25 (SEO-Schlachtplan), digital/08 Abschnitt 2.1 (erster Benchmark). Wo dieser Bericht von 08 abweicht, ist er aktueller und genauer. Die Abweichungen stehen in Abschnitt 6.

> **Grenzen der Messung.** Echte Ranking-Positionen in AT/DE/CH konnten nicht gemessen werden. Die verfügbare Websuche liefert nur US-Ergebnisse, die PageSpeed-API war ausgelastet (HTTP 429). „Welche Keywords besetzen sie“ ist deshalb aus der **On-Page-Ausrichtung** abgeleitet (Title, URL, H1, Inhalt) und aus den SISTRIX-Befunden in Bericht 01. Das Seitengewicht ist eine **Untergrenze**: HTML plus bis zu 80 im HTML verlinkte Skripte, Stylesheets und Bilder, ohne Videos und ohne per JavaScript nachgeladene Bilder. Für Positionen braucht es SISTRIX- oder Search-Console-Daten (Abschnitt 7).

---

## 1. Domains: drei Korrekturen vorab

| Vorgabe | Tatsächlich | Bedeutung |
|---|---|---|
| reiter-design.at | löst nicht auf. Aktuelle Domain: **reiter.design** | – |
| hutle.at | keine Antwort (Timeout). Aktuell: **hutle.com** | – |
| thoeny.li | Das ist die **Papeterie Thöny Vaduz** (Bürobedarf), ein anderes Unternehmen. Der Möbelanbieter ist **moebelthoeny.li** | Wer „Thöny Liechtenstein“ sucht, findet zwei Firmen. Der Möbel-Thöny hat damit eine Namenskonkurrenz |
| designkueche.at / Dolce Vita | **designkueche.at** (Webflow) ist die Website von Dolcevita Möbelhandels GesmbH | – |
| gamma-wohnen.ch | Aktuell **gamma.ch** | – |

---

## 2. Übersicht: technische und inhaltliche Kennzahlen

| Wettbewerber | CMS | URLs in der Sitemap | davon Produkt-/Sale-Seiten | Sprachen / hreflang | Strukturierte Daten | HTML Startseite | Gewicht Startseite (Untergrenze) | Preise online |
|---|---|---|---|---|---|---|---|---|
| **Höttges** hoettges.at | WordPress 7.1 + Elementor, Yoast | **9** | 0 | DE / keins | Yoast-Standard (WebSite, Organization, Breadcrumb) | 93 KB | **3,6 MB** | nein |
| **reiter design** reiter.design | WordPress 7.1 + Elementor, Yoast | 167 (21 Seiten, 106 Beiträge, 36 Projekte) | Sale-Übersicht Indoor/Outdoor, keine Einzelseiten | DE / keins | Yoast-Standard | 178 KB | 2,0 MB, Unterseiten 2,2–2,7 s Antwortzeit | nein (auch im Sale nicht maschinenlesbar) |
| **Dolcevita / designküche** designkueche.at | Webflow | 30 (9 Seiten, 14 Projekte, 7 Jobs) | 0 | **`lang="en"` bei deutschem Text** / keins | **keine** | 28 KB | 2,0 MB | nein |
| **Hutle** hutle.com | Baukasten (data-currency USD) | 25 | Abverkauf-Seite | DE / keins | LocalBusiness + Öffnungszeiten | 40 KB | 1,4 MB | **ja**, Abverkauf (z. B. EUR 6.300,00) |
| **Fretz** fretz.de | Concrete CMS | **650** (584 Sale, je DE+EN) | 292 Sale-Artikel | **DE + EN** / keins | **keine** | 70 KB | **3,4 MB** | **ja**, Sale (z. B. Minotti Horizonte Sofa, 20.050 € statt 25.060 €) |
| **Gamma** gamma.ch | WordPress 6.2.2 (veraltet), Yoast | 319 (185 Blog, 85 Marken, 11 Wohnwelten, 7 Referenzen) | 0 | DE-CH / keins | Yoast-Standard | 63 KB | **0,6 MB** (schlankste) | nein |
| **Thöny** moebelthoeny.li | eigene JS-App (Symfony-Build) | 100 (Projekte, Eigenkollektion, News) | ca. 15 Eigenprodukte | DE-AT / keins | **keine** | **4 KB, ohne Inhalt** | 1,0 MB | nein |
| **wohngefühl** wohngefuehl.ch | WordPress 7.1 + Elementor, Yoast | 40 (6 Seiten, 24 Portfolio) | 0 | DE-CH / keins | WebSite, Place | 59 KB | 1,3 MB, Antwortzeit **2,3–2,9 s** | nein |
| **Seipp** seipp.com | **Shopware** | **7.977** | Tausende Produkte, davon 47 Minotti-URLs | DE-DE / keins | **Microdata Product + Offer + price** | **592 KB** | **> 30 MB** (Bildergalerien) | **ja**, Shop (z. B. Minotti Esstisch Fynn 9.220 €) |
| **M-Studio Reiter** m-studio.at | WordPress + Elementor, Yoast | **542** (186 Beiträge, 113 Portfolio, 63 Seiten, 150 Kategorie/Tag) | Abverkauf-Beiträge, Accessoires-Shop | DE (+1 HU-Seite) / keins | LocalBusiness + **Article** + Organization | 383 KB | 1,5 MB | teilweise (Abverkauf) |
| *Zum Vergleich:* **Platzhirsch** platzhirsch.studio | Next.js 16 | **7.677** (4 × 1.791 Produkte, 4 × 84 Marken, 124 News, 53 statisch) | 1.791 je Sprache | **DE, EN, FR, IT + de-AT/de-CH/fr-CH/it-CH/x-default** | Product, Brand, BreadcrumbList, LocalBusiness-Daten, FAQ | 371 KB | – | **nein** (kein `offers`) |

**Kernaussage:** Kein einziger Wettbewerber setzt hreflang ein. Nur Fretz hat eine zweite Sprache (EN). Nur Seipp hat maschinenlesbare Produktpreise. Nur M-Studio betreibt eine echte Ratgeber-Maschine. Die drei unmittelbaren Vorarlberger Gegner (Höttges, Dolcevita, Hutle) haben zusammen **64 URLs**, also weniger, als Platzhirsch allein an Minotti-Sofas hat.

---

## 3. Steckbriefe

### 3.1 Höttges (Dornbirn, Wien) – der gefährlichste, aber online der dünnste

- **Umfang:** 9 URLs: Start, News, Projekte, Brands, Kontakt, Team, Planung, Impressum, Datenschutz. Keine Markenseiten, keine Produkte, keine Ratgeber. Die News-Seite hat 151 Wörter.
- **Markenseite** `/brands/`: Title „Designmöbel: Minotti, Poliform, B&B Italia und viele mehr – Höttges Interior Design | Dornbirn und Wien“ (über 100 Zeichen, wird in Google abgeschnitten). Description: „höttges ist **Partner von** Minotti, Poliform, B&B Italia, Vitra, Wittmann …“. Rund 850 Wörter, alle Marken auf einer URL.
- **Startseite:** Title „Höttges Interior Design | Dornbirn und Wien“, Description mit „Minotti, Poliform, B&B Italia … Jetzt Erstberatung buchen“. **Keine H1.**
- **Technik:** schwer (3,6 MB Startseite bei nur 23 Bildern), keine LocalBusiness-Daten, also keine Öffnungszeiten und keine Adresse als strukturierte Daten.
- **Stark:** Vertragsstatus. Höttges ist in den Händlerverzeichnissen von Minotti und Poliform (Premium Dealer) gelistet (Bericht 04). Das bringt den stärksten Link der Branche und den Verweis im Store-Locator. Dazu kommen Markenbekanntheit und der Standort Wien.
- **Schwach:** Es gibt keine Seite, die für „Minotti Sofa“, „Poliform Küche“ oder ein Modell ranken kann. Ohne Content lebt Höttges von der Brand-Suche („höttges“) und vom Locator.
- **Besetzte Keywords (On-Page):** „interior design dornbirn“, „interior design wien“, „designmöbel dornbirn“, „einrichtungsplanung innenarchitektur“, Markennamen nur als Sammelseite.

### 3.2 reiter design (Weiler, Innsbruck) – Magazin, aber ohne Produkte

- **Umfang:** 167 URLs. Davon sind 106 Beiträge, 92 davon von 2025, meist Marken- und Designer-Porträts („tom-dixon“, „fritz-hansen“, „walter-knoll“) und Aktionen („summerdeal-des-monats-juli“). Dazu 36 Projekte, ein USM-Konfigurator und Sale Indoor/Outdoor.
- **Titles schwach:** Startseite nur „reiter design gmbh“, ohne Keyword. Die Marken-Seite heißt „Marken bei reiter design gmbh“, ihre Description wurde vom Magazin übernommen. Die Sale-Seite heißt „Indoor – Reiter Möbel“.
- **Technik:** 2,0 MB, Unterseiten mit 2,2–2,7 s Serverantwort. Das ist der langsamste Server im Feld.
- **Stark:** Breite mit ca. 400 Marken, Outdoor-Kompetenz (Dedon, Gloster, Fermob, Cane-line), Designer-Storys, ein gedrucktes Magazin, ein Konfigurator (USM).
- **Schwach:** Keine Produktseiten, im Sale keine strukturierten Preise, schwache Titles, keine Kauf-Ratgeber.
- **Besetzte Keywords:** Marken- und Designernamen (Herkner, Bernardo Bader, Marte.Marte), Outdoor-Marken, „usm konfigurator“.

### 3.3 Dolcevita / designküche (Feldkirch) – online praktisch unsichtbar

- **Umfang:** 30 URLs, davon 14 Projektseiten („villa-in-st-gallen“, „villa-im-appenzell“, „penthouse-graubunden“, „villa-in-buchs“) und 7 Stellenanzeigen.
- **Title:** „Designkueche – Interior Design since 1984“. Die Unterseiten heißen nur „Designkueche – Interior Design“ und haben keine Description.
- **Technik:** Webflow, **`<html lang="en"` bei deutschem Inhalt**. Das ist ein klares Signal an Google, dass die Seite englisch ist. Keine strukturierten Daten, keine Markennamen in den Titles. Das H1 enthält den Text „Scroll down“.
- **Stark:** Poliform- und Minotti-Listung im Locator (Bericht 04) sowie echte Projekte in der Ostschweiz (St. Gallen, Appenzell, Buchs). Dolcevita hat also CH-Kunden.
- **Schwach:** fast alles. Es gibt keine Markenseite, obwohl Dolcevita offiziell Poliform führt.
- **Besetzte Keywords:** praktisch keine außer dem Firmennamen „designküche feldkirch“.

### 3.4 Hutle (Dornbirn) – sauber lokal, sonst dünn

- **Umfang:** 25 URLs, mit lokalen Seiten: „Innenarchitektur in Vorarlberg“, „Erstklassige Innenarchitektur in Bregenz“, „Tischlerei in der Nähe von Feldkirch“.
- **Markenseite** `/einrichten/marken`: Title „Luxusmöbel-Marken bei Hutle in Dornbirn“, Description „Desalto, GUBI, interlübke, prandina, Walter Knoll, Wiener Werkstätte …“. Der Text ist nur in Bildern hinterlegt (**19 Wörter** im HTML).
- **Abverkauf** mit echten Preisen (EUR 6.300,00, 7.419,00, 1.339,00), aber ohne Product-Daten.
- **Technik:** LocalBusiness-JSON-LD mit Öffnungszeiten. Leicht (1,4 MB) und schnell (0,1–0,2 s).
- **Stark:** lokale Keyword-Ausrichtung für Vorarlberg, Bregenz und Feldkirch, Tischlerei und Maßanfertigung.
- **Schwach:** keine Topmarken (Minotti, Poliform), Texte in Bildern, keine Produkte.
- **Besetzte Keywords:** „innenarchitektur vorarlberg“, „innenarchitektur bregenz“, „tischlerei dornbirn/feldkirch“, „luxusmöbel dornbirn“, „abverkauf luxusmöbel“.

### 3.5 Fretz (Konstanz) – stärkster Sale, zweisprachig

- **Umfang:** 650 URLs. Davon sind 584 Sale-Seiten (292 Artikel, je DE und EN), dazu Showroom-Seiten pro Marke (`/de/showroom/minotti`, `/de/showroom/poliform`) und 9 Wohnwelten.
- **Markenseiten:** „Minotti Designermöbel erleben | Italienisches Wohndesign bei FRETZ“ mit Description „… im FRETZ Showroom in Konstanz …“, 361 Wörter. Die Poliform-Seite ist gleich aufgebaut (372 Wörter). Das sind gute, regionale Titles.
- **Sale-Seiten:** z. B. „Minotti Horizonte Sofa :: Einrichtungshaus Fretz – Sale“ mit Preis 20.050 € statt 25.060 €. Auch Minotti Suitcase, Bellagio, Calder, Aston Cord und Poliform Stanford Bridge sind dabei. **Diese Seiten ranken potenziell für „Minotti [Modell]“, haben aber kein Product-Schema und deshalb kein Preis-Snippet.**
- **Technik:** keine strukturierten Daten, Startseite **ohne H1**, 3,4 MB, 30 Skripte. EN-Version ohne hreflang.
- **Stark:** eigener Minotti-Showroom und Poliform-Studio, Premium Dealer, über 100 Jahre Geschichte, großer Sale mit Preisen.
- **Schwach:** kein Schema, kein hreflang, keine Ratgeber, Sale-Texte vermutlich aus Herstellerdaten (nicht geprüft).
- **Besetzte Keywords:** „minotti konstanz“, „poliform konstanz“, „designermöbel konstanz“, Minotti-/Poliform-Modellnamen + „sale“.
- **Korrektur zu 08:** Die in 08 gemeldete 404 der Sale-URLs trifft heute nicht mehr zu. Die Stichprobe lieferte HTTP 200 mit Preis.

### 3.6 Gamma (Wil SG) – Marken-Breite mit Mini-Seiten

- **Umfang:** 319 URLs: 85 Markenseiten, 185 Blogbeiträge (konstant rund 30 pro Jahr seit 2021), 11 Wohnwelten, 7 Referenzen, FAQ, Termin, Premium-Service.
- **Markenseiten** `/blog/marke/minotti/`: Title „**Minotti – Gamma**“, **keine Description, 89 Wörter**. Für Rimadesio, Flos und Paola Lenti gilt dasselbe Muster. Daneben gibt es Blog-Porträts („minotti-italienisches-meisterhandwerk-in-perfektion“).
- **Startseite:** Title „**Startseite – Gamma**“, keine Description, keine H1. **WordPress 6.2.2** (Stand 2023, veraltet).
- **Stark:** stärkster Anbieter in der Ostschweiz (Minotti, B&B, Cassina, Molteni, Rimadesio, Flexform seit 2026), Events (Schloss Hauptwil), Aktionen, schlanke Seite (0,6 MB).
- **Schwach:** keine Keywords in den Titles, kein Ort (Wil/St. Gallen) im Title, keine Produkte, keine Preise, keine Kauf-Ratgeber.
- **Besetzte Keywords:** Markenname + „Gamma“, Aktionsbegriffe („new year sale“, „sofa wochen“). Bei „designermöbel st. gallen“ ist Gamma On-Page **nicht** ausgerichtet.

### 3.7 Thöny (Schaan FL) – für Google fast leer

- **Umfang:** 100 URLs in der Sitemap (Projekte bis Lugano, Davos und Zürich, Eigenkollektion „Centenario Sofa“, „Panhead Bett“, eine News „minotti-studio“).
- **Technik:** **Jede URL liefert dasselbe 4-KB-HTML** mit Title „THÖNY – Design auf höchstem Niveau“, derselben Description und 6 Wörtern Inhalt. Der Inhalt kommt erst per JavaScript. Google kann das rendern, aber mit Verzögerung. **Alle 100 Seiten haben identische Titles**, das wertet Google als Duplikate. KI-Crawler (GPTBot, PerplexityBot) sehen gar keinen Inhalt.
- **Stark:** über 100 Jahre, „erste Adresse in Liechtenstein“, Minotti im Locator, Objektgeschäft (Banken, Hotels, Gastro), Eigenkollektion.
- **Schwach:** Technik. Dazu kommt die Namenskonkurrenz mit der Papeterie Thöny auf thoeny.li.
- **Besetzte Keywords:** nur der Markenname „thöny“ (geteilt mit der Papeterie).

### 3.8 wohngefühl by Odermatt (Kreuzlingen TG) – Innenarchitektur-Boutique

- **Umfang:** 40 URLs (6 Seiten, 24 Portfolio, 10 Portfolio-Kategorien).
- **Title:** „Wohngefühl by Odermatt | Innenarchitektur Kreuzlingen“, gut lokal ausgerichtet. Die Brands-Seite heißt „Marken & Partner“, 400 Wörter, ohne Schema.
- **Technik:** 2,3–2,9 s Antwortzeit, 54 Skripte, keine LocalBusiness-Daten (nur Place).
- **Stark:** lokal klar und persönlich, Minotti-Showroom bei Kocherhans.
- **Schwach:** klein, langsam, keine Markenseiten im Einzelnen.
- **Besetzte Keywords:** „innenarchitektur kreuzlingen“, „einrichtung styling thurgau“.

### 3.9 Seipp (Waldshut-Tiengen DE) – der einzige echte Shop

- **Umfang:** **7.977 URLs**, ein Shopware-Shop mit Vitra (496), Cane-line (359), USM (250), Dedon, Muuto, Montana, Thonet, Cassina, Flos (85), ClassiCon (85) und Minotti (47, auch Sale/„MarahSale“).
- **Produktseite** z. B. „Esstisch Fynn | Minotti“ mit Microdata `Product` + `offers` + `price` 9.220, Herstellertext, Maße und rund 1.000 Wörter.
- **Technik:** sehr schwer: 592 KB HTML, über 30 MB Bilder auf der Startseite (Untergrenze), 80 Skripte. Kein hreflang, nur de-DE.
- **Stark:** Preise, Shop, Produkttiefe, Rich-Snippet-fähig. Seipp rankt laut SISTRIX bereits für „minotti“ in AT (Bericht 01).
- **Schwach:** Lage (112 km, Hochrhein), keine Bodensee-/Ostschweiz-Inhalte, kein CH-Service sichtbar (nicht geprüft), Ladegewicht.
- **Besetzte Keywords:** „[Marke] [Produkt] kaufen“, „[Marke] [Produkt] preis“ in DE. Das ist der direkte Gegner für Platzhirschs Long-Tail.

### 3.10 M-Studio Reiter (Altenmarkt im Pongau) – die Content-Maschine

- **Umfang:** 542 URLs. Beiträge pro Jahr: 2023: 6, 2024: 32, 2025: 30, **2026: 69** (der jüngste am 19.10.2026). Typische Themen: „minotti-sofa-qualitaet“, „poliform-kueche-planen“, „poliform-schranksystem-qualitaet“, „minotti-moebel-im-alltagstest“, „was-kosten-massgefertigte-badmoebel“, „leitfaden-fuer-moeblierungsbudgets“, „wohntrends-2026“, „interior-design-trends-2027“.
- **Markenseiten mit Händlerversprechen:** „**Offizieller Minotti Handelspartner in Österreich – Premium Service**“ mit Description „offizielle Handelspreise | direkte Lieferung ab Minotti Werk“. Ebenso für Poliform und Rimadesio. Dazu kommen ältere Kollektionsseiten (2020/2022), Portfolio- und Tag-Archive pro Marke und eine ungarische Seite („minotti-premium-forgalmazo-magyarorszag“).
- **Technik:** Article-Schema auf Beiträgen, LocalBusiness mit Geo. 1,5 MB.
- **Stark:** Frequenz, Kauf-Fragen, Markenbezug, Article-Schema. M-Studio rankt laut SISTRIX auf Platz 1 der Liste für „minotti“ (AT) (Bericht 01).
- **Schwach:** Lage (Pongau, ca. 350 km), viele dünne Tag-/Kategorie-Archive (150 URLs), veraltete Kollektionsseiten von 2020, keine Produkte mit Preisen, keine Mehrsprachigkeit.
- **Besetzte Keywords:** „minotti österreich“, „poliform händler österreich“, „rimadesio österreich“, „minotti sofa qualität“, „poliform küche planen“, „innenarchitektur salzburg“.
- **Folgerung:** M-Studio zeigt, dass Ratgeber zu Marke × Kauffrage in AT funktionieren. Platzhirsch muss das besser machen, mit echten Daten (Maße, Lieferzeit, Preise, CH-Service) statt allgemeinem Text.

---

## 4. Stärken und Schwächen im Feld

| Disziplin | Wer ist stark | Lücke für Platzhirsch |
|---|---|---|
| Händler-Vertrauen (Locator-Link) | Höttges, Dolcevita, Fretz, Gamma, Thöny, wohngefühl, M-Studio | Nicht aufholbar ohne Vertrag. Ausgleich über Inhalt, Bewertungen und andere Marken-Locatoren (Bericht 16) |
| Modell-/Produktseiten | Seipp (Shop), Fretz (nur Sale) | **Platzhirsch hat 1.791 Produkte je Sprache.** Es fehlen Preis, `offers` und Keyword im Title |
| Preise maschinenlesbar | nur Seipp | Outlet mit `Product`+`Offer` wäre in Vorarlberg/Ostschweiz einmalig |
| Ratgeber / Kauf-Fragen | M-Studio (69 Beiträge 2026) | Bodensee-/CH-spezifische Fragen beantwortet niemand |
| Mehrsprachigkeit | Fretz (EN ohne hreflang) | **Nur Platzhirsch hat hreflang und de-CH.** Bei EN-, FR- und IT-Suchen am Bodensee gibt es keine Konkurrenz |
| Lokale Seiten | Hutle (Vbg., Bregenz, Feldkirch), wohngefühl (Kreuzlingen) | Lindau, Liechtenstein, St. Gallen, Rheintal CH und Allgäu besetzt On-Page niemand |
| Technik/Tempo | Gamma (0,6 MB), Hutle | Höttges, Fretz und Seipp sind schwer; reiter und wohngefühl sind langsam; Thöny ist leer |
| Saubere Titles | Fretz, Hutle, wohngefühl | Gamma („Startseite – Gamma“), reiter („reiter design gmbh“) und Dolcevita sind ohne Keywords |
| Projekte/Referenzen | Thöny, M-Studio, reiter, Dolcevita | Platzhirsch hat keine Referenzseiten (Bericht 01). Das ist die größte inhaltliche Lücke |

---

## 5. Eigene Baustellen, die der Analyse im Weg stehen (live geprüft)

1. **Live-Title der Minotti-Markenseite ist noch „Minotti Händler Vorarlberg | Platzhirsch Home Living“.** Die Korrektur ohne Händler-Behauptung („Minotti Vorarlberg & Bodensee – Ausstellung Lochau | Platzhirsch“) liegt in `src/app/[locale]/ueber-uns/marken/[title]/page.js`, ist aber **nicht committet und nicht live**. Solange steht online eine Händler-Behauptung ohne Vertrag ([anwaltlich prüfen], UWG, siehe 25 und digital/14). Das ist der dringendste Punkt dieses Berichts.
2. **Produkt-Titles ohne Kategorie:** „Lawrence – Minotti | Platzhirsch Home Living“. Gesucht wird „Minotti Lawrence Sofa“. Muster empfohlen: „Minotti Lawrence Sofa – Maße, Varianten, Ausstellung | Platzhirsch“.
3. **Kein `offers` im Product-Schema.** Ohne Preis gibt es kein Preis-Snippet und keinen kostenlosen Shopping-Eintrag. Seipp hat das.
4. **Unterschied zu M-Studio:** M-Studio verwendet „Offizieller Handelspartner“ und „offizielle Handelspreise“. Das darf Platzhirsch **nicht** kopieren, auch nicht als Reaktion.

---

## 6. Abweichungen gegenüber digital/08 (Abschnitt 2.1)

| Punkt | 08 | Dieser Bericht |
|---|---|---|
| Fretz Sale-URLs | „Seite nicht gefunden“, Sitemap verwaist | Stichprobe HTTP 200 mit Preis (20.050 €). Sale ist aktiv |
| Fretz Sprachen | hreflang 0 | stimmt, aber es gibt eine **EN-Version** aller Seiten |
| Gamma | 85 Markenseiten, 7 Referenzen | dazu 185 Blogbeiträge. Die Markenseiten haben nur 89 Wörter |
| Thöny | Single-Page | 100 URLs, aber alle mit identischem leerem HTML (Client-Rendering) |
| M-Studio | 113 Portfolio, 186 Posts | dazu **„Offizieller Handelspartner“-Landingpages** für Minotti, Poliform und Rimadesio sowie 69 Beiträge 2026 |
| Seipp | Shop mit Preisen | 7.977 URLs, Microdata `Product`/`Offer`, über 30 MB Startseite |
| Dolcevita | keine Meta-Description | dazu `lang="en"` auf deutscher Seite |

---

## 7. Die 30 Keywords, bei denen Platzhirsch am schnellsten vorbeiziehen kann

**Auswahlregel:** (a) Keiner der zehn Wettbewerber hat eine passende, eigene Seite oder die Seite ist schwach, (b) Platzhirsch hat den Inhalt schon oder kann ihn aus dem Backoffice erzeugen, (c) die Suche ist kaufnah, (d) **keine Händler-Behauptung nötig**. Begriffe wie „Minotti Händler“ oder „autorisierter Poliform Händler“ werden bewusst **nicht** angegriffen, solange es keinen Vertrag gibt.

**Volumen:** Werte mit „SISTRIX“ stammen aus Bericht 01 bzw. `docs/seo-ux/02-implementation-report.md` (Klicks/Monat). Alle anderen Werte sind offen und müssen mit Keyword Planner oder SISTRIX geprüft werden. Es wurden **keine Zahlen geschätzt**, weil es keine belastbare Herleitung gibt. Die Reihenfolge innerhalb der Gruppen richtet sich nach erwarteter Geschwindigkeit.

**Tempo-Stufen:** **S** = Seite existiert, nur Title, Text oder Schema anpassen (Wochen). **M** = neue Seite oder Hub aus vorhandenen Daten (1–3 Monate). **L** = braucht Lieferung vom Inhaber (Preise, Fotos, Referenzen).

### A. Modell- und Kollektionssuchen (kein regionaler Wettbewerber außer Seipp und Fretz-Sale)

| # | Keyword | Wer besetzt On-Page | Ziel-URL Platzhirsch | Tempo | Volumen |
|---|---|---|---|---|---|
| 1 | minotti lawrence sofa | niemand regional (nur minotti.com) | Produkt + Kollektions-Hub Lawrence (4 Produkte vorhanden) | S/M | offen |
| 2 | minotti torii | niemand regional | Hub Torii (8 Produkte vorhanden) | M | offen |
| 3 | minotti horizonte sofa | Fretz Sale (ohne Schema) | Hub Horizonte (3 Produkte) | M | offen |
| 4 | minotti connery | niemand regional | Hub Connery (2 Produkte) | M | offen |
| 5 | minotti roger sofa | niemand regional | Hub Roger (5 Produkte) | M | offen |
| 6 | minotti tape sofa | niemand regional | Hub Tape (3 Produkte) | M | offen |
| 7 | poliform senzafine kleiderschrank | niemand regional, M-Studio allgemein („schranksystem“) | Produkt Senzafine (3 Produkte) | S | offen |
| 8 | poliform ventura | niemand regional | Produkt Ventura | S | offen |

### B. Marke × Kategorie (Höttges und Gamma haben dafür keine Seite)

| # | Keyword | Wer besetzt On-Page | Ziel-URL | Tempo | Volumen |
|---|---|---|---|---|---|
| 9 | minotti sofa | M-Studio (Beitrag „Minotti Sofa Qualität“), Seipp | neu: `/marken/minotti/sofas` | M | **DE 450 (SISTRIX)** |
| 10 | minotti outdoor | Seipp (Produkte), Fretz Sale | `/marken/minotti/outdoor` | M | offen |
| 11 | poliform küche | M-Studio („poliform küche planen“), Dolcevita ohne Seite | `/marken/poliform/kuechen` (nur mit nachweisbarem Bezugsweg, [vom Unternehmen auszufüllen]) | M | offen |
| 12 | poliform begehbarer kleiderschrank | niemand regional | `/marken/poliform/kleiderschraenke` (11 Schränke im Katalog) | M | offen |
| 13 | paola lenti outdoor | Gamma (89-Wörter-Seite), reiter (Marke gelistet) | Markenseite Paola Lenti + Outdoor-Abschnitt | S | offen |
| 14 | flos pendelleuchte | Seipp (85 Flos-URLs) | `/marken/flos/pendelleuchten` (330 Leuchten im Katalog) | M | offen |
| 15 | treca bett | niemand regional | Markenseite Treca + Kategorie Betten (122 Betten) | S | offen |
| 16 | tuuci sonnenschirm | Gamma (Blogbeitrag) | Kategorie Sonnenschirme (23 Produkte) + Marke Tuuci | S | offen |

### C. Marke × Region ohne Händler-Behauptung („Ausstellung“, „ansehen“, „Lieferung“)

| # | Keyword | Wer besetzt On-Page | Ziel-URL | Tempo | Volumen |
|---|---|---|---|---|---|
| 17 | minotti bodensee | niemand (Fretz: „Konstanz“) | Minotti-Markenseite, Regionsabschnitt | S | offen |
| 18 | minotti lindau | niemand. Kein Minotti-Anbieter am deutschen Nordufer (Bericht 04) | Minotti-Markenseite + Lindau-Seite verlinkt | S | offen |
| 19 | minotti st. gallen | Gamma nicht ausgerichtet („Minotti – Gamma“) | Minotti-Markenseite, CH-Abschnitt mit Verzollung | S | offen |
| 20 | poliform ostschweiz / poliform st. gallen | niemand (kein Poliform-Händler in SG/FL laut Bericht 04) | Poliform-Markenseite, CH-Abschnitt | S | offen |
| 21 | rimadesio vorarlberg | niemand (reiter nennt Rimadesio nur in der Liste) | Rimadesio-Markenseite | S | offen |

### D. Kauf- und Preisfragen (Ratgeber, M-Studio ist der einzige Gegner, ohne Bodensee/CH-Bezug)

| # | Keyword | Wer besetzt On-Page | Ziel-URL | Tempo | Volumen |
|---|---|---|---|---|---|
| 22 | minotti sofa preis | Seipp (Einzelpreise), Fretz Sale | Ratgeber „Was kostet ein Minotti-Sofa?“ mit Preisspannen (Freigabe der Preisangaben klären, [vom Unternehmen auszufüllen]) | L | offen |
| 23 | was kostet eine designerküche | M-Studio (Badmöbel, Budgets), keiner für Küche | Ratgeber Küchenpreise, next125/Schüller + neue Linie mit Steinplatten (Bericht 26) | M/L | offen |
| 24 | möbel aus österreich in die schweiz einführen mwst | niemand der zehn | Ratgeber CH-Import (Grundlage Bericht 18) + CHF-Rechner | M | offen |
| 25 | lieferzeit italienische designermöbel | niemand der zehn | Ratgeber Lieferzeiten (Minotti, Poliform, Rimadesio) | M | offen |
| 26 | minotti outlet / minotti ausstellungsstück | Fretz (Sale), Seipp (MarahSale), M-Studio (Abverkauf) – alle ohne Offer-Schema außer Seipp | Outlet mit `Product`+`Offer`, echten Preisen und Zustand | L | offen |

### E. Region und Sprache (On-Page unbesetzt)

| # | Keyword | Wer besetzt On-Page | Ziel-URL | Tempo | Volumen |
|---|---|---|---|---|---|
| 27 | designermöbel lindau | niemand der zehn (nächster: Fretz Konstanz) | `/designermoebel-lindau` (vorhanden) | S | offen (Cluster „designermöbel“ DE 1.550, SISTRIX) |
| 28 | designermöbel liechtenstein | Thöny nicht lesbar (leeres HTML) | `/designermoebel-liechtenstein` (in Arbeit) | S | offen |
| 29 | designermöbel st. gallen | Gamma nicht ausgerichtet, Dolcevita nur Projekte | `/designermoebel-st-gallen` (vorhanden) | S | offen (Cluster „designermöbel“ CH 300, SISTRIX) |
| 30 | designer furniture lake constance (EN) | niemand (Fretz EN ohne hreflang, ohne Bodensee im Title) | EN-Startseite / EN-Markenseiten | S | offen, klein, aber ohne Konkurrenz |

**Bewusst nicht in der Liste:**
- „minotti“ und „poliform“ allein (AT 500 / 350, SISTRIX). Diese Begriffe sind von minotti.com, M-Studio, Seipp und Händlern mit Locator-Link besetzt. Platzhirsch gewinnt sie über die Long-Tail-Seiten oben mit, aber nicht schnell.
- „designermöbel“ (DE 1.550, SISTRIX). Den Begriff besetzen Connox, AmbienteDirect und Kare national. Er ist nur über die Region erreichbar (Nr. 27–29).
- „küchenstudio vorarlberg“ / „küche bregenz“. Hier konkurrieren viele lokale Küchenstudios außerhalb dieser zehn. Volumen 20 (SISTRIX) ist zu klein für schnellen Ertrag.
- Alles mit „Händler“, „autorisiert“, „offiziell“ zu Minotti und Poliform.

---

## 8. Empfohlene Reihenfolge (umsetzbar mit 5 Personen)

| Woche | Maßnahme | Keywords |
|---|---|---|
| 1 | Brand-Title-Korrektur committen und live schalten (Händler-Behauptung entfernen) | Risiko, Voraussetzung für 17–21 |
| 1–2 | Produkt-Title-Muster „Marke Modell Kategorie“, Regionsabschnitte auf Minotti-, Poliform- und Rimadesio-Seite | 1, 7, 8, 17–21 |
| 2–6 | 6 Minotti-Kollektions-Hubs (Lawrence, Torii, Horizonte, Connery, Roger, Tape), 4 Marke × Kategorie-Seiten | 1–6, 9–16 |
| 4–8 | Ratgeber CH-Import und Lieferzeiten (keine Freigabe nötig) | 24, 25 |
| sobald Daten da | Outlet mit Preisen und `Offer`-Schema, Ratgeber Preise | 22, 23, 26 |
| laufend | 2 Ratgeber/Monat mit echten Daten statt der Masse von M-Studio, Rank-Tracking der 30 Begriffe in AT/DE/CH | alle |

**Messen:** Search Console (Abfragen nach Land filtern), SISTRIX oder vergleichbares Tool mit Standort AT/DE/CH, monatlich Positionen der 30 Begriffe für Platzhirsch und die zehn Domains. Erst damit wird aus der On-Page-Ableitung in Abschnitt 7 eine belastbare Rangliste.

---

## 9. Was der Inhaber entscheiden oder liefern muss

1. **Freigabe zum Deploy** der Brand-Title-Korrektur (heute live: „Minotti Händler Vorarlberg“).
2. **Preise:** Darf Platzhirsch „ab“-Preise für Minotti und Poliform zeigen? Mit den Herstellern klären. Welche Ausstellungsstücke kommen mit Preis und Zustand ins Outlet? [vom Unternehmen auszufüllen]
3. **Poliform-Küchen:** Gibt es einen belegbaren Bezugsweg? Ohne ihn bleibt Keyword 11 auf Möbel beschränkt. [vom Unternehmen auszufüllen]
4. **5–10 Referenzprojekte** mit Fotos und Kundenfreigabe (Ort, Marken, Umfang). Das ist die größte Inhaltslücke gegenüber Thöny, M-Studio, reiter und Dolcevita.
5. **SISTRIX- oder Search-Console-Zugang** für echte Positionen und Volumen der 30 Begriffe.
6. **Einheitliche Adresse** (Landstraße 9 oder 11) für Local SEO.

---

## Quellen (abgerufen 26.10.2026)

- Höttges: https://hoettges.at/ · https://hoettges.at/sitemap_index.xml · https://hoettges.at/brands/
- reiter design: https://reiter.design/ · https://reiter.design/sitemap_index.xml · https://reiter.design/marken/ · https://reiter.design/sale/indoor/
- Dolcevita / designküche: https://www.designkueche.at/ · https://www.designkueche.at/sitemap.xml
- Hutle: https://www.hutle.com/ · https://www.hutle.com/sitemap.xml · https://www.hutle.com/einrichten/marken · https://www.hutle.com/aktuelles/abverkauf
- Fretz: https://www.fretz.de/de · https://www.fretz.de/sitemap.xml · https://www.fretz.de/de/showroom/minotti · https://www.fretz.de/de/sale/sofa/minotti-horizonte-sofa
- Gamma: https://www.gamma.ch/ · https://www.gamma.ch/sitemap_index.xml · https://www.gamma.ch/blog/marke/minotti/
- Thöny: https://moebelthoeny.li/ · https://moebelthoeny.li/sitemap.xml · (Papeterie) https://www.thoeny.li/startseite.html
- wohngefühl: https://wohngefuehl.ch/ · https://wohngefuehl.ch/sitemap_index.xml · https://wohngefuehl.ch/brands/
- Seipp: https://seipp.com/ · https://seipp.com/sitemap.xml · https://seipp.com/Minotti/Esstisch-Fynn/215828
- M-Studio Reiter: https://www.m-studio.at/ · https://www.m-studio.at/sitemap_index.xml · https://www.m-studio.at/moebelstudio/minotti-premium-haendler-oesterreich/ · https://www.m-studio.at/news/minotti-sofa-qualitaet/
- Platzhirsch: https://platzhirsch.studio/sitemap.xml · https://platzhirsch.studio/de/ueber-uns/marken/minotti · https://platzhirsch.studio/de/produkte/sofas-couches/sofas-lawrence
- Intern: Marktresearch/01, 04, 16, 18, 25, 26, digital/08; docs/seo-ux/02-implementation-report.md (SISTRIX-Werte)
