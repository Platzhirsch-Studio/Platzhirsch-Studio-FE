# Katalog-Audit Marken N–R (Stand 26.10.2026)

**Umfang:** Next125, Paola Lenti, Papadatos, Poliform, Pomax, Qeeboo, Quasar, Rimadesio.
**Datenquelle:** öffentliche Gast-Endpunkte unter `backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.*`, also dieselben Aufrufe wie `src/lib/api/*.js`:
- `marken.api.marken_data`
- `produkte_new.api.get_all_kategorien` und `get_produkte_by_kategorie` für alle 31 Kategorien (zusammen 1.765 Produkte, deckt sich mit `get_produkte_paths`)
- `get_produkte_by_marke_api` als Gegenprobe
- `get_produkt_by_path_field_api` für alle 293 Produkte

**Was zusätzlich geprüft wurde:**
- Bildmaße aller 3.648 einzelnen Bilddateien, ausgelesen per Range-Request aus dem Datei-Header
- alle 95 Download-Links per HEAD-Request
- 8 gerenderte Produktseiten auf `localhost:3000` (DE, EN, FR)
- 2 Markenseiten
- Stichproben auf den Herstellerseiten (next125.com, quasarholland.com, poliform.it) und per Websuche

Skripte und Rohdaten liegen im Scratch-Ordner der Sitzung, nicht im Repo.

**Schwellen im Audit:**
- „klein“ heißt: längste Kante unter 1.200 px.
- „kurz“ heißt: DE-Beschreibung unter 250 Zeichen (ohne HTML).
- „Übersetzung fehlt“ heißt: Feld leer oder identisch mit DE.

---

## 1. Kennzahlen je Marke

| Kennzahl | Next125 | Paola Lenti | Papadatos | Poliform | Pomax | Qeeboo | Quasar | Rimadesio |
|---|---|---|---|---|---|---|---|---|
| Aktive Produkte | 13 | 100 | **0** | 103 | **0** | **0** | 14 | 63 |
| ohne Bild | **13 (100 %)** | 0 | – | 3 | – | – | **13 (93 %)** | 2 |
| nur 1 Bild | 0 | 0 | – | 4 | – | – | 0 | 0 |
| Bilder gesamt (Ø je Produkt) | 0 | 1.108 (11,1) | – | 1.680 (16,3) | – | – | 4 (0,3) | 1.289 (20,5) |
| Bilder < 1.200 px | – | 180 (16 %) | – | **1.216 (72 %)** | – | – | 3 von 4 | **776 (60 %)** |
| erstes Bild (Karte/OG) < 1.200 px | – | **100** (97× 720×524) | – | **96** | – | – | 1 | 27 |
| Produkte, bei denen alle Bilder < 1.200 px sind | – | 0 | – | 9 | – | – | 1 | 2 |
| Bild-Links 404 | – | 0 | – | 0 | – | – | 0 | **7 Links in 6 Produkten** |
| Beschreibung fehlt / kurz | 0 / 0 | 0 / 0 | – | 0 / 0 | – | – | 0 / 0 | 0 / 0 |
| „Mehr-Beschreibung“ fehlt | 0 | 0 | – | 3 | – | – | 0 | 1 |
| identische Langtexte (Gruppen) | 1 (3× „Fronten: Holzfront.“) | 1 (Sciara) | – | 0 | – | – | 3 (Varianten-Paare) | 2 (Sinua, 5× Rialto) |
| Übersetzung EN/FR/IT fehlt (Beschreibung) | 0 | 0 | – | 0 | – | – | 0 | 0 |
| Mehr-Beschreibung EN/FR/IT fehlt | 0 | 0 | – | 2/3/3 | – | – | 0 | 1/1/1 |
| Meta-Description DE–IT (70–160 Zeichen) | ok | ok | – | ok | – | – | ok | ok |
| Designer leer | 13 (bei Küchen n. a.) | 0 | – | **21** | – | – | 3 | 5 |
| Designer falsch | – | 1 abgekürzt | – | 1 (Mad Queen) | – | – | – | – |
| strukturierte Maße | **0** | **0** | – | **0** | – | – | **0** | 0 (61× nur „siehe PDF“) |
| strukturiertes Material | 13 (englische Werte) | **0** | – | 3 | – | – | **0** | 2 |
| Produkte mit Download | 0 | **0** | – | 53, davon **nur 5 produktspezifisch** | – | – | 0 | 42, davon 26 produktspezifisch |
| Download-Links kaputt | – | – | – | 0 | – | – | – | 0 |
| exakte Namens-Dubletten | 0 | 0 | – | 0 | – | – | 0 | 0 |
| Beinahe-Dubletten (Bildsätze geteilt) | – | keine | – | Ernest (3), Westside Sofa/Soft, Curve (3) | – | – | – | Cover (4), Self (6), Rialto (7), Zenit (3) |
| falsche Kategorie / Typ | 1 (Planungsbeispiel als Produkt) | 0 sicher | – | 1 (Bristol: Pfad `dining-chairs-`) | – | – | 0 | **1 (Graphis light unter „Leuchten“)** |

**Zu den Übersetzungen:** Sie sind durchgehend gut gepflegt. Die Suche nach deutschen Wörtern im EN-Text ergab nur einen echten Treffer: `LED-Beleuchtung` in *Abacus living* (EN, FR und IT). Die übrigen Treffer waren „die-cast“ und damit Fehlalarme.

**Zu den Markenstammdaten aller acht Marken:**
- `desing_approach_*`, `dealers_title_*` und `dealers_description_*` sind nur auf DE gepflegt, für EN, FR und IT sind sie leer. Der Feldname ist im Backoffice tatsächlich `desing` geschrieben.
- Bei Papadatos steht als Gründungsjahr **1990**, die Beschreibung sagt aber **„seit 1965“**.

---

## 2. Befunde je Marke (kurz)

**Next125 (13)**
- Kein einziges Produktbild, kein Bannerbild. Die Seiten rendern mit Fallback-OG-Bild (`/Images/Home/aboutHome.jpg`) und `index, follow`. Das sind Thin-Content-Seiten.
- Die Langtexte sind teils nur ein Satz („Fronten: Holzfront.“ bei nx640, nx660 und nx670).
- *The modern kitchen in a period property* ist ein Planungsbeispiel und kein Modell.
- Abgleich mit [next125.com/en/kitchen/collection](https://www.next125.com/en/kitchen/collection): Alle 13 Modellnummern sind aktuell, nx115 ist als „New“ markiert. Es fehlt **nx904 | nx914**, das im Katalog nur im Planungsbeispiel vorkommt.
- Die Materialwerte sind englisch („Lacquer“, „Wood“, „Grey“).

**Quasar (14)**
- 13 von 14 Produkten haben kein Bild. Nur *Fold tablelamp* hat 4 Bilder, davon 3 kleiner als 1.200 px. Der Dateiname enthält ein Leerzeichen (`Fold tablelamp-1.jpg`), der Link liefert trotzdem 200.
- Keine Maße, kein Material, keine Datenblätter.
- Die Varianten-Paare (Adamas, Alistair, Julia) haben identische Langtexte.
- Herstellerabgleich (Stichprobe): Cosmos Globe, Cosmos Square, Fold und Grid stehen auf Seite 1 der Quasar-Kollektion. Julia, Mira, Crystal Galaxy und Alistair finden sich auf quasarholland.com bzw. in Quasar-Broschüren, die Julia-Broschüre ist allerdings von 2017. Ob alle Modelle noch aktuell sind, sollte das Backoffice mit der aktuellen Preisliste abgleichen [nicht abschließend verifiziert].

**Paola Lenti (100)**
- Texte, Übersetzungen und Designer sind sehr gut gepflegt.
- Das erste Bild ist aber bei allen 100 Produkten ein Vorschaubild mit 720×524 px (3× noch kleiner). Es dient als Karte und OG-Bild. Jedes Produkt hat weitere Bilder mit 1.250 bis 2.000 px.
- Keine strukturierten Maße und Materialien, die Materialien stehen nur im Fließtext. Kein einziger Download (Datenblatt, 3D, Katalog).
- Die Kategorie „Loungemöbel & Daybeds“ sammelt Outdoor-Sessel und -Sofas. Das ist konsistent, aber für Suchende unscharf, siehe SEO.

**Poliform (103)**
- 3 Produkte ohne Bild: Mad Queen, Dorsoduro, Bristol. 4 Produkte mit nur 1 Bild: Alfred, Attimo, Victoria, Shore.
- 72 % der Bilder sind kleiner als 1.200 px (meist 938×1080 oder 960×960).
- 21 Produkte ohne Designer, darunter alle 9 Küchen, die Systeme, die Schränke und Blade.
- *Mad Queen*: Im Designer-Feld steht „Jean-Marie Massaud“, der Text nennt Studio Marcel Wanders.
- **Downloads**: `poliform-curve-chair-doc-01.pdf` (11,5 MB) hängt an **32 Produkten** (Betten, Tische, Stühle, Sideboards), `poliform-alea-doc-01.pdf` an 7 Küchen. Der Dateiname deutet auf das Curve-Chair-Dokument hin. Der Inhalt wurde nicht geprüft, er kann auch ein Gesamtkatalog sein. Als produktbezogener „Katalog“ ist die Datei aber irreführend.
- *Dorsoduro* (Bett, Carlo Colombo): Die Websuche findet kein Poliform-Modell dieses Namens. Existenz bzw. Name prüfen, im Zweifel deaktivieren.
- *Bristol* liegt unter dem Pfad `dining-chairs-bristol`, ist aber ein Sofa in der Kategorie Sofas. Laut Poliform-Katalog 2025 ist Bristol weiter im Programm.

**Rimadesio (63)**
- Texte, Übersetzungen und Downloads sind am besten von allen fünf Marken gepflegt. 42 Produkte haben ein Datenblatt, alle 95 PDF-Links im N–R-Katalog antworten mit 200.
- **7 Bild-Links liefern 404.** Es sind alles `modulor-*`- bzw. `maxi-13`-Dateien, also offenbar falsch zugeordnete Bilder. Betroffen sind Rialto Comodini, Self bold, Self Plan, Self Plan Schreibtischversion, Long Island Consolle und Cover.
- *Graphis light* ist laut eigenem Text ein Schiebetürsystem für begehbare Schränke, steht aber unter **Leuchten**.
- Die Produktnamen enthalten Backoffice-Zusätze, die so in der H1 aller Sprachen erscheinen: „Rialto (Rialto 3)“, „Zenit (Coffee Tables)“, „Sinua (Stühle)“, „Rialto (TV-Schränke)“.
- 5 Produkte ohne Designer. Die Teppiche Kanji, Kita und Miglio sind laut Rimadesio-Pressetext eine Kooperation mit Studio Juma (Carpets Collection 2024/25). Tray Pouf und Cover Day 2 haben ebenfalls keinen Designer.
- Bei Abacus living ist der DE-Langtext eine wörtliche Übersetzung aus dem Italienischen („Tagessystem“ = *zona giorno*).
- Velaris fehlt im Katalog. Der SEO-Plan nennt das Modell als Suchbegriff.

**Papadatos, Pomax, Qeeboo**
- Die Marken sind „Aktiv“, haben aber `es_gibt_produkte = 0` und tatsächlich 0 Produkte. Die Markenseiten laufen also ohne Produkte.

**Markenübergreifend, rechtlich relevant**
- `dealers_description_de` lautet bei allen acht Marken „Platzhirsch Studio ist Ihr (offizieller) … Händler in Vorarlberg“.
- Bei Poliform, Rimadesio, Paola Lenti und Quasar steht ausdrücklich **„offizieller“**.
- Der Text wird auf den Markenseiten gerendert, geprüft auf `/de/ueber-uns/marken/poliform` und `/rimadesio`.
- Das widerspricht 23-masterkonzept.md und 25-seo-schlachtplan.md: Ein Händlerstatus ist nur bei ClassiCon belegt, ansonsten besteht UWG- bzw. Abmahnrisiko.

---

## 3. Die 30 wichtigsten Korrekturen für das Backoffice-Team

| # | Produkt / Bereich | Problem | Fix |
|---|---|---|---|
| 1 | Marken Poliform, Rimadesio, Paola Lenti, Quasar (`dealers_description_de`) | „Ihr offizieller … Händler“ ohne belegten Vertrag, wird gerendert | Neutral formulieren, z. B. „… in unserer Ausstellung in Lochau erleben“, ohne „offiziell/Händler“ |
| 2 | Marken Next125, Pomax, Papadatos, Qeeboo (`dealers_description_de`) | „Ihr … Händler“ | Ebenso neutral formulieren, bis ein Vertrag vorliegt |
| 3 | Next125, alle 13 Produkte | 0 Bilder, Fallback-OG-Bild, indexiert | Pressebilder von next125 einpflegen (Freigabe klären). Bis dahin auf „Entwurf“ setzen |
| 4 | Quasar, 13 Produkte (alle außer Fold tablelamp) | 0 Bilder | Bilder aus Quasar-Mediathek einpflegen oder deaktivieren |
| 5 | Poliform: `poliform-curve-chair-doc-01.pdf` an 32 Produkten | gleiches Dokument an Betten, Tischen, Stühlen und Sideboards | Je Produkt das passende Datenblatt hochladen. Falls Gesamtkatalog: als „Katalog Poliform“ beschriften, nicht als Produkt-Download |
| 6 | Poliform: `poliform-alea-doc-01.pdf` an 7 Küchen (Artex, Artex Pro, My Planet, Phoenix, Shape, Twelve, Alea Pro) | Alea-Dokument an anderen Küchen | Passende Küchenkataloge zuordnen |
| 7 | Paola Lenti, alle 100 Produkte | erstes Bild nur 720×524 px (Karte und OG) | Reihenfolge ändern: ein Bild ≥ 1.200 px an Position 1, oder `-01` in voller Auflösung ersetzen |
| 8 | Rimadesio: Rialto Comodini, Self bold, Self Plan, Self Plan Schreibtischversion, Long Island Consolle, Cover | 7 Bild-Links 404 (`modulor-*`, `maxi-13`) | Einträge aus der Galerie entfernen, die Dateien gehören offenbar nicht zu diesen Produkten |
| 9 | Rimadesio *Graphis light* | Kategorie „Leuchten“, ist aber ein Schiebetürsystem | Kategorie auf Kleiderschränke bzw. Türen umstellen, Pfad anpassen und 301-Weiterleitung einrichten |
| 10 | Poliform *Mad Queen* | Designer-Feld „Jean-Marie Massaud“, laut Text Marcel Wanders | Designer korrigieren (Mad Chaise Longue gleich mitprüfen). 0 Bilder ergänzen |
| 11 | Poliform *Dorsoduro* | kein Bild, Modell beim Hersteller nicht auffindbar | Mit Poliform-Preisliste abgleichen, ggf. deaktivieren |
| 12 | Poliform *Bristol* | 0 Bilder. Pfad `dining-chairs-bristol` bei einem Sofa | Bilder ergänzen, Pfad auf `sofas-couches-bristol` mit 301 |
| 13 | Poliform: Alfred, Attimo, Victoria, Shore | nur 1 Bild, 938×1080 | Galerie mit Bildern ≥ 1.600 px ergänzen |
| 14 | Poliform, 96 Produkte | erstes Bild < 1.200 px, 72 % aller Bilder klein | Bilder in Originalauflösung (≥ 2.000 px Langkante) neu hochladen, mit den Top-SEO-Modellen beginnen (Abschnitt 4) |
| 15 | Rimadesio Zenit (Couchtisch), Random | 0 Bilder | Bilder ergänzen |
| 16 | Poliform, 21 Produkte ohne Designer (u. a. alle Küchen, Code, Lexington, Wall System, Senzafine, Ubik, Blade, Shore) | Designer leer | Laut Poliform-Datenblatt ergänzen. Bei Hausentwürfen den Herstellerwortlaut übernehmen |
| 17 | Rimadesio Kanji, Kita, Miglio | Designer leer | „Studio Juma für Rimadesio“ (laut Rimadesio-Presse) eintragen. Tray Pouf und Cover Day 2 ebenfalls ergänzen |
| 18 | Rimadesio: Rialto (Rialto 3/4/5), Rialto (Rialto Comodini), Rialto (Rialto Consolle), Rialto (TV-Schränke), Zenit (Coffee Tables), Zenit (Bücherregale), Sinua (Stühle), Cover (Cover Day 2) | interne Zusätze im Produktnamen, sichtbar in der H1 aller Sprachen | Sprechende, sprachneutrale Namen, z. B. „Rialto Sideboard 3“, „Rialto Konsole“, „Zenit Couchtisch“ |
| 19 | Rimadesio Rialto (7 Einträge), Cover (4), Self (6) | Beinahe-Dubletten mit bis zu 38 identischen Bildern und gleichem Langtext | Bildsätze je Variante bereinigen, Langtexte je Variante schreiben. Varianten ohne eigenen Nutzen zusammenlegen |
| 20 | Alle 5 Marken mit Produkten | 0 strukturierte Maße (Rimadesio: nur „siehe PDF“) | Mindestens die Hauptmaße (B × T × H) in `additional_information.dimensions` eintragen, bei Paola Lenti und Poliform zuerst |
| 21 | Paola Lenti, alle 100 Produkte | Material- und Farbfelder leer, kein Download | Material aus dem Fließtext in Felder übernehmen, Datenblätter oder Kataloge von Paola Lenti anhängen |
| 22 | Quasar, alle 14 Produkte | keine Maße, kein Material, kein PDF | Aus Quasar-Datenblättern ergänzen |
| 23 | Next125 nx640, nx660, nx670 | Langtext nur „Fronten: Holzfront.“ (identisch) | Je Modell eigenständige Front-Beschreibung (Holzart, Oberfläche) schreiben |
| 24 | Next125 *The modern kitchen in a period property* | Planungsbeispiel als Produkt, kein Designer, kein Bild | Als Referenz oder Planungsbeispiel führen, nicht als Produkt, oder deaktivieren |
| 25 | Next125 nx904 | nx914 | Modell fehlt (beim Hersteller in der Kollektion) | Anlegen, falls im Sortiment |
| 26 | Next125, Materialfelder | englische Werte („Lacquer“, „Wood“, „Grey“) auf DE-Seiten | Lokalisierte Werte oder Übersetzungstabelle |
| 27 | Quasar Adamas, Alistair, Julia (Varianten-Paare); PL Sciara Side Table/Console; Rimadesio Sinua | identische Langtexte | Je Variante 1–2 Sätze zu Maßen, Montage und Einsatz ergänzen |
| 28 | Rimadesio *Abacus living* | „LED-Beleuchtung“ in EN, FR und IT; DE-Langtext maschinell („Tagessystem“) | Übersetzen bzw. DE-Text redigieren |
| 29 | Poliform Mad Queen, Dorsoduro (EN/FR/IT), Bristol (FR/IT); Rimadesio Zenit-Couchtisch | Mehr-Beschreibung fehlt | Ergänzen |
| 30 | Marken Papadatos, Pomax, Qeeboo | aktiv, aber 0 Produkte. Papadatos: Gründungsjahr 1990 vs. „seit 1965“ im Text | Produkte anlegen oder Marke auf „inaktiv“ setzen. Gründungsjahr klären. EN/FR/IT für `desing_approach`/`dealers_*` bei allen Marken nachziehen |

**Zusätzlich für das Web-Team (nicht Backoffice):** Produkte ohne Bild sollten `noindex` bekommen, solange keine Bilder gepflegt sind. Das betrifft heute 31 Seiten in N–R, mal 4 Sprachen.

---

## 4. SEO-Priorität (Suchpotenzial)

Das ist eine Einschätzung. Suchvolumina wurden nicht abgefragt, die Reihenfolge folgt den Modellsuchen aus 25-seo-schlachtplan.md: Kaufbereite suchen nach Modellnamen. Zuerst die Datenqualität der Modelle mit hohem Markenbekanntheitsgrad und regionalem Fokus (Italienisches Wohnen, Küche, Outdoor am See) verbessern.

| Prio | Marke | Modelle | Warum | Datenlücke, die zuerst zu schließen ist |
|---|---|---|---|---|
| A | Poliform | Mondrian Sofa, Westside Sofa, Saint-Germain, Bristol, Ventura, Senzafine Wardrobe, Ubik, Phoenix / Artex / Alea (Küchen) | Kernmarke mit hohem Modellsuchvolumen; „Poliform Küche“ im SEO-Plan | Bildauflösung, Designer bei Küchen und Schränken, richtige PDFs, Maße. Bristol: Bilder. Hinweis: Der SEO-Plan nennt „Poliform Ventura Kleiderschrank“, im Katalog ist Ventura ein Esszimmerstuhl, Begriff prüfen |
| A | Rimadesio | Self, Cover, Abacus living, Zenit, Rialto, (fehlend) **Velaris** | Laut Masterkonzept ist in der Region kein Rimadesio-Händler gelistet, Modellsuchen sind also kaum besetzt | 404-Bilder, Namensbereinigung, Velaris anlegen |
| A | Paola Lenti | Welcome, Sabi, Frame, Cove, Portofino, Orbitry, Afra, Teppiche (Wadi, Ayla) | Outdoor am Bodensee, Leitmarke Outdoor laut Masterkonzept | erstes Bild in hoher Auflösung, Maße und Materialien, Datenblätter |
| B | Next125 | nx670, nx510, nx950/nx960 (Keramik), nx115 (neu) | Küchen-Einstiegslinie AT. Ohne Bilder derzeit nicht rankingfähig | Bilder, längere Front-Texte |
| B | Quasar | Cosmos Globe, Fold, Julia | Nischige Designleuchten mit wenig Wettbewerb im DACH-Raum | Bilder, Maße |
| C | Papadatos, Pomax, Qeeboo | – | ohne Produkte kein Produkt-SEO | erst entscheiden: Sortiment anlegen oder Marke ausblenden |

---

## 5. Methodische Grenzen

- Der Herstellerabgleich auf auslaufende Modelle ist eine Stichprobe. Geprüft wurden alle Next125-Modelle, Quasar teilweise, bei Poliform Bristol und Dorsoduro. Ein vollständiger Abgleich braucht die aktuellen Händlerpreislisten.
- Bildmaße stammen aus den Datei-Headern, die visuelle Qualität (Unschärfe, Wasserzeichen) wurde nicht bewertet.
- Der Inhalt der mehrfach verwendeten Poliform-PDFs wurde nicht geöffnet. Bewertet wurde nur die Zuordnung, nach Dateiname und Mehrfachverwendung.
