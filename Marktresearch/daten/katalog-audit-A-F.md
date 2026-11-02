# Katalog-Audit Marken A–F

Stand: 26.10.2026. Datenquelle: öffentliche Backoffice-Endpunkte (`produkte_new.api.get_produkte_by_marke_api`, `get_produkt_by_path_field_api`, `marken.api.marken_data`), alle 685 Detaildatensätze vollständig ausgewertet. Bildgrößen: die ersten 4 Galeriebilder je Produkt gemessen (2.202 Bilder, per Range-Request). PDF-Links: alle 394 eindeutigen Links per HEAD geprüft. Gerenderte Seiten: Stichprobe auf `localhost:3000/de/produkte/...`. Herstellerabgleich: nur Stichprobe, siehe Abschnitt 5.

Skripte und Rohdaten (nicht im Repo): `C:/Users/ADMIN~1.LOC/AppData/Local/Temp/claude/c--Users-admin-local-Documents-Platzhirsch-Studio-Website/f00742a5-4fc2-4c4d-b173-992fcd1fcbe7/scratchpad/auditAF/` (`details.json`, `imgs.json`, `pdfs.json`, `issues.json`).

## 1. Kernergebnisse

1. **Brand van Egmond: alle 111 Produkte ohne ein einziges Bild.** Die Seiten werden trotzdem mit `index, follow` ausgeliefert. Als og:image erscheint ein Platzhalter (`/Images/Home/aboutHome.jpg`). Damit sind das 111 indexierte Seiten mit dünnem Inhalt, und die Marke ist im Shop praktisch unsichtbar.
2. **Sechs aktive Marken haben 0 Produkte:** Agape, Antoniolupi, Bombyxx, Bullfrog, EMU und Frost (alle `status = Aktiv`, `es_gibt_produkte = 0`). Auch die Suche findet nichts.
3. **Dubletten:** Flos hat 5 Paare mit identischem `path_field`. Sie entstehen durch „/“ und „-“ im Namen, z. B. `2097-18` und `2097/18`. Damit liefert dieselbe URL zwei konkurrierende Datensätze. Eichholtz (11) und ClassiCon (5) haben Varianten-Dubletten mit doppeltem Slug, z. B. `coffee-table-lerici-coffee-table-lerici-120657`.
4. **Alt-Datensätze mit falschem Präfix:** 65 Produkte haben das Slug-Präfix `chandeliers-`, obwohl ihre Kategorie `lamps` ist (61 BvE, 4 Flos). Die 4 Flos-Datensätze (Aim, Arrangements, Randoo, Taraxacum) haben **weder Bilder noch Maße**, und es sind ausgerechnet Toprodukte.
5. **Texte:** Alle 685 Produkte haben DE/EN/FR/IT-Beschreibungen und Meta-Descriptions (keine Lücke gefunden). Probleme gibt es trotzdem:
   - Bei 113 Produkten ist die Beschreibung mit einer anderen identisch, meist Farb- oder Größenvarianten.
   - Bei 22 Eichholtz-Produkten ist es erkennbar kopierter Herstellertext in Ich-Form („Wir präsentieren den The Met x Eichholtz …“, „Nach dem Erfolg unseres Beale Dining Chair …“).
   - Bei 77 Eichholtz-Produkten fehlen die technischen Daten (`mehr_beschreibung`) in EN/FR/IT.
   - In 77 DE-Datenblättern stehen englische Werte (z. B. „Material: Steel“): Eichholtz 29, BvE 24, Flos 24.
6. **Bilder:** Abgesehen von BvE sind die Bilder gut. 97 % der gemessenen Bilder haben ≥ 1200 px (Längsseite). Nur 2 Hauptbilder sind zu klein: Flos Clara mit 500×500 und ClassiCon Cypris Mirror 60×180 mit 800×400. 55 Galeriebilder sind < 1200 px, vor allem Flos-Galeriebilder mit 1024×768.
7. **PDF-Downloads:** alle 394 Links liefern HTTP 200 und `application/pdf`, kein kaputter Link. Allerdings haben nur 352 von 685 Produkten überhaupt ein Datenblatt. Ohne PDF sind: 101 Copenhagen (62/62), BvE (111/111), Alonpi, Baobab und Flos (110/139).

## 2. Kennzahlen je Marke

Legende: *Kopie* = Beschreibung wortgleich mit anderem Produkt; *gl. Bild* = gleiches Hauptbild wie ein anderes Produkt; *Übers. TD* = technische Daten EN/FR/IT fehlen. Beschreibungstexte DE/EN/FR/IT sind bei allen Marken zu 100 % vorhanden. Kein Produkt hat eine Beschreibung unter 250 Zeichen.

| Marke | Produkte | ohne Bild | 1 Bild | Hauptbild < 1200 px | Kopie | gl. Bild | Übers. TD | ohne Designer | ohne Maße | ohne Material | ohne PDF | Dubletten | Kategorien |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 101 Copenhagen | 62 | 0 | 1 | 0 | 39 | 0 | 0 | 1 | 3 | 2 | 62 | 0 (aber 50+ Farbvarianten als Einzelprodukte) | decor 20, lamps 20, dining-chairs 6, … |
| Agape | 0 | – | – | – | – | – | – | – | – | – | – | – | – |
| Alonpi | 23 | 0 | 0 | 0 | 0 | 0 | 0 | 23* | 0 | 20 (Material steht als „Zusammensetzung“) | 23 | „Region“ doppelt (bedwear + decor) | bedwear 20, decor 3 |
| Antoniolupi | 0 | – | – | – | – | – | – | – | – | – | – | – | – |
| Baobab | 24 | 0 | 0 | 0 | 0 | 0 | 0 | 24* | 0 | 13 | 24 | 0 | candles 24 |
| Bombyxx | 0 | – | – | – | – | – | – | – | – | – | – | – | – |
| Brand van Egmond | 111 | **111** | – | – | 0 | – | 0 | 0 | 0 | 0 | 111 | 0 (61 mit Alt-Präfix `chandeliers-`) | lamps 111 |
| Bullfrog | 0 | – | – | – | – | – | – | – | – | – | – | – | – |
| ClassiCon | 126 | 1 | 1 | 1 | 39 | 17 | 1 | 6 | 10 | 2 | 2 | 5 Varianten-Dubletten | 15 Kategorien |
| Desalto | 50 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 1 | Indoor/Outdoor-Paare mit gleichem Bild | 13 Kategorien |
| Eichholtz | 150 | 0 | 2 | 0 | 22 | 2 | **77** | 150* | 0 | 0 | 0 | 11 Varianten-Dubletten | 15 Kategorien |
| EMU | 0 | – | – | – | – | – | – | – | – | – | – | – | – |
| Flos | 139 (144 Listeneinträge) | 4 | 0 | 1 | 13 | 0 | 2 | 3 | 18 | 24 | 110 | **5 Pfad-Dubletten** | lamps 139 (18 Outdoor) |
| Frost | 0 | – | – | – | – | – | – | – | – | – | – | – | – |
| **Summe** | **685** | **116** | 4 | 2 | 113 | 23 | 80 | 207 | 31 | 61 | 333 | – | – |

\* Bei Eichholtz (Inhouse-Design), Baobab (Kerzen) und Alonpi (Textilien) ist ein fehlender Designer vertretbar. Besser wäre ein einheitlicher Eintrag wie „Eichholtz Design Studio“, statt das Feld leer zu lassen. Der Eintrag muss beim Hersteller verifiziert werden.

Die Spalten *ohne Maße* und *ohne Material* basieren auf einer Heuristik: Feld `additional_information` oder Schlüsselwörter in `mehr_beschreibung`.

## 3. Die 30 wichtigsten Korrekturen für das Backoffice-Team

| # | Produkt / Bereich | Problem | Fix |
|---|---|---|---|
| 1 | Brand van Egmond, alle 111 Produkte | Kein Bild in `bild_anhangen`, kein `bannerbild`; Seiten indexiert mit Platzhalter-og:image | Pressebilder von BvE anfordern und je Produkt mindestens 3 Bilder ≥ 2000 px hochladen. Bis dahin auf `Inaktiv` setzen oder noindex setzen lassen. |
| 2 | Flos `chandeliers-aim` | Kein Bild, keine Maße, Alt-Präfix | Bilder und technische Daten ergänzen, Slug auf `lamps-aim` setzen, 301 vom alten Slug |
| 3 | Flos `chandeliers-taraxacum` | Kein Bild, Alt-Präfix (Toprodukt) | Wie #2, Slug `lamps-taraxacum` |
| 4 | Flos `chandeliers-arrangements` | Kein Bild, keine Maße; Beschreibung identisch mit `lamps-arrangements-2/3-elements` und `-drop-down` | Datensatz deaktivieren oder als Familienseite mit eigenem Text ausbauen |
| 5 | Flos `chandeliers-randoo` | Kein Bild, keine Maße | Bilder und Maße ergänzen, Slug korrigieren |
| 6 | Flos `2097-18` / `2097/18` | Zwei Datensätze, gleicher `path_field` `lamps-2097-18` | Jüngeren Datensatz (`2097/18`) löschen; in Produktnamen kein „/“ verwenden |
| 7 | Flos `2097-30`, `2097-50 (frosted bulbs)` | Wie #6 | Wie #6 |
| 8 | Flos `IC C-W1 Outdoor` / `IC C/W1 Outdoor` | Wie #6 | Wie #6 |
| 9 | Flos `Captain Flint Outdoor … Brass Finish-Grey Lava` / `…/Grey Lava` | Wie #6; die Varianten haben unterschiedlich viele Bilder (5 vs. 3) | Datensatz mit 5 Bildern behalten |
| 10 | Brand van Egmond, 61 Slugs `chandeliers-*` | Präfix passt nicht zur Kategorie `lamps` (Seiten laufen trotzdem unter `/produkte/lamps/chandeliers-…`) | Slugs vereinheitlichen, aber nur zusammen mit Redirects; sonst so lassen und künftig konsistent anlegen |
| 11 | Eichholtz Modular Sofa Lounge Club (Corner S right ×3, Middle ×4, Ottoman ×2+) | 9 Datensätze für 3 Module; Slugs mit doppeltem Namen und Artikelnummer (`…-cm0404`); Texte identisch | Pro Modul ein Produkt, Farb- und Artikelvarianten als Variantenfeld |
| 12 | Eichholtz Coffee Table Lerici / Side Table Lerici / Side Table Albany / Bar Stool Josephine / Floor Lamp Massimo / Table Lamp Cologne S | Je 2 Datensätze, einer mit Slug `…-<name>-<artnr>` | Dublette zusammenführen und 301 setzen |
| 13 | Eichholtz, 22 Produkte (z. B. `chair-bleecker`, `chair-elisha`, `console-table-waverly`, `bar-stool-beale`) | Kopierter Herstellertext in Ich-Form („Wir präsentieren …“, „unseres …“); Duplicate-Content-Risiko gegenüber eichholtz.com und anderen Händlern | Eigene Texte aus Studio-Sicht schreiben (Raumwirkung, Kombination, Beratung in Lochau) |
| 14 | Eichholtz, 77 Produkte | `mehr_beschreibung` nur DE; EN/FR/IT leer | Technische Daten übersetzen (meist reine Labels und Maße, gut automatisierbar) |
| 15 | Eichholtz, BvE und Flos, 77 DE-Datenblätter | Englische Werte im DE-Feld (z. B. „Material: Steel, brass“) | Werte ins Deutsche übersetzen |
| 16 | Eichholtz, 150 Produkte | Feld `designer` leer | Einheitlichen Eintrag setzen, nach Herstellerangabe (z. B. „Eichholtz Design Studio“, falls bestätigt) |
| 17 | Eichholtz Bed Set Mavone 160×200 / 180×200 | Gleicher Text und gleiches Hauptbild | Zu einem Produkt mit Größenvarianten zusammenführen |
| 18 | ClassiCon Bow Coffee Table No. 1–6 (+ No. 3 Marble) | Paarweise identische Texte, 3 Produkte mit gleichem Hauptbild | Je Nummer Maße und Proportion im Text nennen und eigenes Hauptbild verwenden, oder alles zu einer Familienseite zusammenführen |
| 19 | ClassiCon Aristo Chair / Aristo Armchair | Gleiches Hauptbild | Je Modell ein eigenes Freisteller-Bild |
| 20 | ClassiCon `soft-stone-armchair` | Kein Bild, keine technischen Daten | Bilder und Datenblatt ergänzen |
| 21 | ClassiCon `cypris-mirror-cypris-mirror-60x180` / `-70x70`, `bell-…-2`, `bell-side-table-black`, `occasional-table-square` | Varianten-Dubletten mit doppeltem Slug; Cypris 60×180: Hauptbild nur 800×400, keine Maße | In die Hauptprodukte integrieren und ein Hauptbild ≥ 2000 px einsetzen |
| 22 | ClassiCon, 10 Produkte ohne Maße (u. a. Double X Table, Lantern Light Floor Medium/Tall, Plissée Floor Lamp, Pli Side Table Low) | Keine Maße in `additional_information` oder Datenblatt | Maße aus dem Herstellerdatenblatt übernehmen (PDFs liegen bereits vor) |
| 23 | ClassiCon Bowl, Vase, Shia Vase, Soft Stone Sofa, Triton Bar/Counter Stool | Designer fehlt | Designer nach Herstellerseite ergänzen |
| 24 | ClassiCon `garden-tables-pallas-table` | Indoor-Tisch (Outdoor-Version optional) liegt nur unter Gartentische, Flag „Outdoor“ | Kategorie `dining-tables` und Flag Indoor/Outdoor setzen |
| 25 | Flos `lamps-clara` | Hauptbild 500×500, keine Maße | Hochauflösendes Bild und Maße ergänzen |
| 26 | Flos, 18 Produkte ohne Maße (u. a. My Disc/Dome/Sphere/Lines, In Vitro Suspension/Unplugged, String Light Cone/Sphere, Mayday Outdoor, Emi Floor) | Keine Maße | Aus den Flos-Datenblättern übernehmen; zusätzlich PDF-Datenblätter verlinken (110 von 139 Flos-Produkten ohne PDF) |
| 27 | Flos, ca. 45 Galeriebilder mit 1024×768 (u. a. Arco, Snoopy, Taccia Small, Toio LED, IC Lights) | Unter 1200 px, unscharf auf Retina und im Zoom | Durch Bilder ≥ 2000 px ersetzen |
| 28 | 101 Copenhagen, Baburu Bowl (14 Datensätze), Drop Chandelier (20), Brutus (6), Toe (4) | Jede Farbe ein eigenes Produkt mit identischem Text; 39 Textkopien | Pro Modell ein Produkt mit Farbvarianten, oder je Variante echte Unterschiede beschreiben |
| 29 | 101 Copenhagen `101-copenhagen-brand-book`, `ceiling-plate-white-for-drop-chandelier`, `gallery-balls-set-of-3` | Katalog und Zubehör als Produkt; kein Designer, keine Maße, nur 1 Bild | Brand Book deaktivieren (kein Verkaufsprodukt); Zubehör beim Drop Chandelier als Option führen |
| 30 | Agape, Antoniolupi, Bombyxx, Bullfrog, EMU, Frost | Aktive Marken ohne ein einziges Produkt | Kernkollektion einpflegen (Agape/Antoniolupi: 10–20 Bad-Ikonen; EMU: Outdoor-Bestseller) oder Markenseite bewusst als reine Markenseite führen |

Weitere kleinere Punkte:
- Alonpi „Region“ liegt doppelt vor (`bedwear-region`, `decor-region`).
- Desalto Helsinki 15 und Koki Wire: die Indoor- und Outdoor-Datensätze haben dasselbe Hauptbild.
- Eichholtz „Side table Hensley“ liegt in `night-tables`.
- Eichholtz 2× nur 1 Bild: Dining Chair Tampa, Swivel Chair Brice.

## 4. SEO-Priorität (Suchpotenzial)

Die Einschätzung beruht auf Markenbekanntheit und Klassikerstatus. Es wurden keine Suchvolumina gemessen; vor der Umsetzung mit Search Console oder einem Keyword-Tool verifizieren.

**Priorität A** (bekannte Designklassiker; hohe Markensuche und „kaufen“-Suchen; Seiten müssen perfekt sein):
- **Flos:** Arco, Taraxacum (aktuell ohne Bild!), Aim (ohne Bild!), IC Lights (S1/T1/F1/C-W1), Snoopy, Taccia, Toio, Parentesi, Bellhop, Glo-Ball, 2097 (Dubletten bereinigen), Splügen Bräu, Skygarden, String Light.
- **ClassiCon:** Adjustable Table E1027, Bibendum Armchair (inkl. Limited Edition), Day Bed, Bell Side/Coffee Table, Non Conformist, Lota Sofa (Eileen-Gray-Klassiker mit dauerhaftem Suchinteresse).
- **101 Copenhagen:** Drop Chandelier, Brutus Dining Chair, Toe Armchair, Baburu Bowl; erst nach dem Zusammenführen der Farbvarianten, sonst konkurrieren 14–20 fast gleiche Seiten.

**Priorität B** (Nischen mit kaufkräftiger Suche, wenig lokale Konkurrenz):
- Brand van Egmond Hollywood, Flower Power, Kelp und Delphinium Chandelier. Potenzial ist da, aber ohne Bilder wertlos; zuerst Korrektur #1.
- Desalto Clay, Koki, Helsinki, Liko Glass.
- Eichholtz-Bestseller (Sofas, Esstische, Leuchten); nur mit eigenen statt kopierten Texten.

**Priorität C:** Baobab-Kerzen, Alonpi-Textilien (eher Geschenk- und Markensuche).

## 5. Herstellerabgleich (Stichprobe, auslaufende Modelle)

Die Stichprobe ist **ohne eindeutiges Ergebnis**. Die Aussagen beruhen auf Händler- und Herstellerseiten, nicht auf offiziellen Auslaufmeldungen:
- **Flos Rosy Angelis:** Flos führt das Produkt weiter mit Ersatzteilen (flos.com, professional.flos.com). Miliashop zeigt „Last items in stock“. Status beim Flos-Vertrieb klären.
- **Flos Ray Floor 2:** Ein UK-Händler hat die Ray Table 2023 archiviert, Architonic markiert eine Ray-Variante als „discontinued“. Die F2 ist bei Händlern weiter gelistet. Status beim Flos-Vertrieb klären.
- **Flos Pochette Up-Down LED:** weiter gelistet (professional.flos.com).
- **Flos Mini Button:** kein Nachweis gefunden. Status prüfen.
- **ClassiCon Notos, Orcus, Pegasus Home Desk:** werden weiter im Handel angeboten (1stdibs-Händlershop von ClassiCon). Die ClassiCon-Website war per Direktaufruf nicht prüfbar (404 auf geratene URLs).

Empfehlung: Den Flos- und den Eichholtz-Vertrieb einmal jährlich um die aktuelle Auslaufliste bitten. Eichholtz wechselt erfahrungsgemäß oft Modelle, und Artikelnummern wie 120657 machen den Abgleich einfach.

Quellen: [flos.com Rosy Angelis](https://flos.com/en/wo/rosy-angelis-grey-incandescent/FU616020.html), [miliashop Rosy Angelis](https://miliashop.com/en/floor-lamps/585-rosy-angelis-floor-lamp-flos.html), [lightingstyles Ray](https://www.lightingstyles.co.uk/ray-table-lamp-by-flos), [Architonic Ray S](https://www.architonic.com/en/product/flos-ray-s/1208288), [professional.flos.com Pochette](https://professional.flos.com/en-US/us/product/pochette-up-down-led-fu970557), [1stdibs ClassiCon Notos](https://www.1stdibs.com/furniture/tables/desks-writing-tables/classicon-notos-standing-desk-maple-chrome-thomas-kuhl-andreas-krob/id-f_13851361)

## 6. Methodische Hinweise

- „Übersetzung fehlt“ heißt: das Feld ist leer, wortgleich mit DE oder überwiegend deutsch (Stoppwort-Heuristik). Bei den Beschreibungen gab es 0 Treffer. Ob die Übersetzungen inhaltlich gut sind, wurde nicht geprüft.
- „Kopie“ heißt: die ersten 200 Zeichen der DE-Beschreibung stimmen mit einem anderen Produkt überein.
- Bildgröße: längste Seite der ersten 4 Galeriebilder.
- Gerenderte Stichprobe (localhost):
  - `lamps-arthur-ceiling-lamp-round` (BvE): 200, indexierbar, og:image als Platzhalter.
  - `lamps-2097-18` und `decor-baburu-bowl-big-birch`: 200, korrektes og:image, Product- und BreadcrumbList-JSON-LD vorhanden.
  - Antwortzeiten im Dev-Modus 3–14 s.
