# Katalog-Audit Marken G–M (Gloster, Heatsail, Lambert, Livintwist, Minotti)

Stand: 26.10.2026. Datenquelle: öffentliche Gast-Endpunkte des Backoffice (`produkte_new.api.get_produkte_by_marke_api`, `get_produkt_by_path_field_api`, `marken.api.marken_data`, `get_produkte_paths`), alle 508 Produkte vollständig ausgelesen. Für alle 3.461 Produktbilder wurden die Pixelmaße aus dem Dateikopf gelesen. Stichprobe von 8 gerenderten Seiten auf `localhost:3000/de/produkte/…`. Abgleich mit den Herstellerseiten minotti.com (Sitemap und 20 Modellseiten), heatsail.com (Sitemap und Produktseiten) und einer Webrecherche zu Livintwist.

Skripte und Rohdaten liegen im Scratch-Ordner der Sitzung (`auditGM/`), nicht im Repo.

## 1. Kennzahlen je Marke

| Kennzahl | Gloster | Heatsail | Lambert | Livintwist | Minotti |
|---|---|---|---|---|---|
| Aktive Produkte im Katalog | **0** | 12 | **0** | 9 | 487 |
| Markenseite online (index) | ja | ja | ja | ja | ja |
| ohne Bild | – | 0 | – | 0 | **4** |
| nur 1 Bild | – | **10** | – | 1 | 1 |
| alle Bilder < 1200 px (größtes Bild) | – | **10** (300–690 px) | – | 1 (1024 px) | 0 |
| Hauptbild (1. Bild) < 1200 px | – | 12 | – | 6 | 7 |
| Galeriebilder < 1200 px gesamt | – | 22 von 36 | – | 31 von 46 | 1.248 von 4.248 (29 %) |
| ohne Kurzbeschreibung | – | 0 | – | 0 | 0 |
| Kurzbeschreibung < 400 Zeichen | – | 0 | – | 1 | 0 (Median 700) |
| ohne Langbeschreibung | – | 0 | – | 1 | 0 |
| Langbeschreibung wortgleich mit Hersteller | – | nicht geprüft | – | nicht geprüft | ja, Stichprobe: 20–57 % der Sätze |
| Übersetzung EN/FR/IT fehlt (Produkt) | – | 0 | – | 0 | 0 |
| Meta-Description fehlt / zu lang | – | 0 | – | 0 | 0 |
| ohne Designer | – | 10 | – | 0 | **460 (94 %)** |
| ohne Maße | – | 2 | – | 2 | **485 (99,6 %)** |
| ohne Material | – | 12 | – | 9 | **485** |
| ohne Downloads (PDF/2D/3D) | – | 12 | – | 9 | 487 |
| ohne Kollektion | – | 2 | – | 0 | 487 |
| Indoor/Outdoor-Flag | – | alle Outdoor | – | alle Outdoor | **alle Indoor** |
| Platzhalter-Namen „(Tables 2)“, „(Variant)“ | – | 0 | – | 0 | **84** |
| Seiten mit identischem Titel | – | 0 | – | 0 | **85 Seiten in 36 Gruppen** |
| Produkte mit identischem Bildsatz | – | 0 | – | 0 | **95 Produkte in 43 Gruppen** |
| eindeutig falsche Kategorie | – | 1–2 (Leaf, ggf. Twig) | – | 0 | **ca. 30** |
| URL-Präfix passt nicht zur Kategorie | – | 0 | – | 0 | ca. 110 (+46 mit „produkt-“) |
| Alt-Texte innerhalb des Produkts identisch | – | 2 | – | 8 | 482 |

**Was gut ist:** Alle 508 Produkte haben eine eigene deutsche Kurzbeschreibung mit 380 bis 900 Zeichen und eine Langbeschreibung. EN, FR und IT sind vollständig übersetzt, keine Übersetzung ist eine Kopie des deutschen Textes. Jedes Produkt hat eine Meta-Description mit 70 bis 160 Zeichen. Alle 3.461 Bild-URLs sind erreichbar, alle Bilder liegen als WebP vor. Die gerenderten Seiten liefern HTTP 200, einen Canonical-Tag, `index, follow` und Product-JSON-LD.

**Download-Links:** In keinem der 508 Produkte ist ein Download hinterlegt (`pdf_produkte` ist überall leer). Deshalb gibt es keine kaputten Links, aber auch keine Datenblätter, CAD-Dateien oder Pflegeanleitungen.

### Markenebene (Marken-Datensatz)

Bei allen fünf Marken fehlen `desing_approach_*`, `dealers_title_*` und `dealers_description_*` auf EN, FR und IT. Die Texte der Handwerks-Kacheln (`craft_disciplines`) gibt es nur auf Deutsch.

**Rechtsrisiko:** Der Text `dealers_description_de` lautet bei Minotti und Gloster „Ihr **offizieller** … Händler in Vorarlberg“, bei den anderen Marken „Ihr … Händler“. Das widerspricht der Regel im SEO-Schlachtplan (25, Zeile 80): keine Händler-Behauptung ohne Vertrag. Das Backoffice-Team sollte diese Texte neutral fassen.

## 2. Befunde je Marke

### Gloster und Lambert: keine Produkte
Beide Marken stehen auf `es_gibt_produkte = 0`. Die Endpunkte nach Marke und die Suche liefern für beide nichts. Die Markenseiten `/de/ueber-uns/marken/gloster` und `/lambert` sind trotzdem online und indexierbar. Dort werden Teak, Dansk-Stuhl und Bodega-Gläser beworben, aber kein einziges Produkt verlinkt. Das ergibt dünnen Inhalt und eine Sackgasse für Besucher.
- Gloster ist für Outdoor am See stark: Suchen nach Teak-Gartenmöbeln, Gloster-Loungemöbeln und Dining-Sets. Empfehlung: 15–30 Kernprodukte anlegen. Falls Gloster nicht aktiv geführt wird, die Markenseite auf `noindex` setzen oder auf eine Outdoor-Übersicht verweisen.
- Bei Lambert genauso: entweder eine kuratierte Auswahl mit 10–20 Stück wie Leuchten, Glas und Tablette anlegen oder die Seite zurückstellen.

### Heatsail (12 Produkte)
- **Bilder sind das Hauptproblem.** 10 von 12 Produkten haben nur ein Bild, und dieses ist 300 bis 690 px breit. Glow 3.5 hat ein Bild mit 300 × 385 px und 3,9 KB. Auf Retina-Displays und im Google-Bildindex ist das unbrauchbar. Twig und Leaf haben je 13 Bilder bis 1920 px.
- **Falsche Kategorie:** Leaf ist laut Hersteller „a sculptural expression of shade“, also eine Beschattung und kein Heizstrahler. Die Kategorie `heaters` ist falsch, richtig wäre `parasols` oder Beschattung. Auch Twig (klappbar, Schutzhülle) sollte gegen die Herstellerseite geprüft werden. Bei Leaf steht unter Maße „Schattenfläche bis 4,6 x 3,6 m“.
- **Verdächtige Maße:** Dome Freestanding und Disc Freestanding haben exakt dieselben Werte (235 × 228 × 100 cm, 150 kg). Vermutlich wurden sie kopiert, das sollte gegen das technische Datenblatt geprüft werden. Bei Beem Kabel und Beem Stang sind die Maße ebenfalls identisch, was plausibel sein kann.
- **Designer:** Für Disc ist Piet Boon hinterlegt, das bestätigt heatsail.com. Bei den übrigen 10 Produkten fehlt der Designer. Nur nachtragen, was der Hersteller angibt.
- **Fehlende Angaben:** Material, Leistung in Watt, Spannung und Schutzart fehlen überall. Für Heizstrahler sind das kaufentscheidende Angaben, die Seite hat dafür sogar Labels wie „Leistung“ und „Reichweite“. Auf der Herstellerseite stehen zum Beispiel für Disc FS maximal 3.100 W Heizleistung und 120 W Licht, für Dome 3.220 W.
- **Abgleich mit dem Sortiment:** Alle 12 Modelle sind auf heatsail.com aktuell. Im Katalog fehlen die Varianten Disc Wallbracket und Dome Wallbracket (Dome Bowbracket ist vorhanden), Beem Kabel Mist, Beem Stang Mist und die Misting-Linie (Kühlung).

### Livintwist (9 Produkte)
- Die Daten sind solide. Alle Produkte haben einen Designer (Matteo Ragni, Jinghua Zeng – Studio Tunne) und 3 bis 9 Bilder.
- Bei 6 von 9 Produkten ist das erste Bild kleiner als 1200 px (853–1120 px), größere Bilder gibt es weiter hinten in der Galerie. Fix: das größte Bild an die erste Stelle setzen. Die Belvedere Chaise Longue hat höchstens 1024 px.
- Das Belvedere 3 Seater Sofa Full Weaving hat nur 1 Bild, keine Maße und keine Langbeschreibung.
- Die Maße der Belvedere Chaise Longue fehlen. Beim Belvedere Canopy stehen sie in mm, bei allen anderen in cm. Bitte einheitlich in cm angeben.
- Material ist bei keinem Produkt gepflegt (Aluminium, Seilgeflecht, Outdoor-Stoff).
- Abgleich: Belvedere ist eine 2025 in Mailand vorgestellte Kollektion, Apsaras stammt von 2024. „Convivio Coffee Table“ ließ sich online nicht als Livintwist-Modell bestätigen. Bitte gegen die Preisliste prüfen.

### Minotti (487 Produkte)
1. **Platzhalter-Namen und doppelte Titel.** 84 Produkte heißen wie „Coupé (Tables)“, „Tape (Tables 2)“, „Superquadra (Variant)“ oder „Jacques (Armchairs 3)“. Die Website entfernt den Klammerzusatz (`cleanProductName`). Dadurch tragen 85 Seiten in 36 Gruppen exakt denselben Titel und dieselbe H1, zum Beispiel 5 Seiten „Superquadra – Minotti“ (Schrank, Schrank, Beistelltisch, Esstisch, Sitzbank) oder 4 Seiten „Torii“. Der Zusatz ist außerdem oft sachlich falsch: „Coupé (Tables)“ ist laut eigener Beschreibung ein Sofa, „Fynn (Tables 3)“ ist ein Sessel, „Sally (Tables)“ ist ein Pouf.
   Fix: aussagekräftige Namen nach dem Schema „Modell + Typ“ vergeben, etwa „Superquadra Esstisch“, „Superquadra Sitzbank“, „Fynn Bank“, „Fynn Sessel“ oder „Sally Pouf“.
2. **Identische Bildsätze.** 95 Produkte in 43 Gruppen zeigen exakt dieselben Bilder. Beispiele: Cross-Kissen und Cross-Teppich, Torii-Couchtisch und Torii-Sofa, Superquadra in 5 Produkten, Lido-Sessel, -Beistelltisch und -Sofa. Kunden sehen beim Couchtisch ein Sofa.
   Fix: Jedem Produkt eigene Bilder des richtigen Typs zuordnen, Familienbilder höchstens als Zusatzbild.
3. **Falsche Kategorien.** Etwa 30 Fälle sind eindeutig, weil die eigene Beschreibung einen anderen Typ nennt (Liste siehe Abschnitt 3).
4. **Designer fehlt bei 460 Produkten.** Nur 27 Produkte haben einen Designer, zum Beispiel Rodolfo Dordoni, Marcio Kogan, Christophe Delcourt, Oki Sato (nendo), Hannes Peer oder Giampiero Tagliaferri. Der Designer steht auf jeder Modellseite von minotti.com. Suchen wie „Rodolfo Dordoni Sofa“ sind ein eigener Suchkanal, und das JSON-LD gibt den Designer bereits aus, wenn er gepflegt ist.
5. **Maße und Material fehlen bei 485 Produkten.** Nur Torii und Yang haben diese Angaben (auf Englisch: „Width: 78 cm“, „Leather“). Auf der Seite gibt es einen Tab „Maße“ und „Material & Pflege“, der leer bleibt.
6. **Alles ist auf Indoor gestellt.** Minotti hat laut Sitemap rund 50 Outdoor-Familien, darunter Lido Cord Outdoor, Torii Nest Outdoor, Bellagio Outdoor, Aston Cord Outdoor, Alison Iroko und Quadrado. Im Katalog ist keine einzige davon als Outdoor geführt. Die Outdoor-Varianten fehlen im Katalog ganz, nur „Aston Cord Indoor“ und „Prince Cord Indoor“ verweisen darauf. Für einen Standort am Bodensee ist das eine große Lücke.
7. **Langbeschreibung teilweise wortgleich mit minotti.com.** Stichprobe Aeron, Hamilton, Connery, Goodman, Linha, Sendai und Horizonte Bed: 20 bis 57 % der Sätze in `mehr_beschreibung` stimmen wörtlich mit minotti.com/de überein. Das ist Duplicate Content gegenüber der Herstellerseite und möglicherweise auch ein Urheberrechtsthema. Die Kurzbeschreibung ist dagegen eigenständig formuliert.
   Fix: Bei den 50 Top-Produkten die Langbeschreibung umschreiben, beim Rest sie kürzen oder in technische Fakten umwandeln.
8. **4 Produkte ohne Bild:** Owens (Sessel), Bag Light „Stool“, Avon „Throw“ und Leintücher. Auf der Seite erscheint dann nur das allgemeine Platzhirsch-Bild als og:image.
9. **Kleine Hauptbilder:** Die 5 Superquadra-Produkte (800 px), Solid „Saddle-Hide“ (750 px) und Wisp Shade (800 px). In der Galerie gibt es jeweils Bilder mit 1600 px, die an die erste Stelle gehören.
10. **Alt-Texte:** Bei 482 Produkten haben alle Bilder denselben Alt-Text („Minotti Aeron“). Besser wäre eine Variante je Bild, etwa Ansicht, Detail oder Material.
11. **Kollektion leer** bei allen 487 Produkten, obwohl die Familien eindeutig sind (Andersen mit 14 Produkten, Yves mit 9, Aston mit 7).
12. **URL-Slugs:** Rund 110 Slugs widersprechen der Kategorie, zum Beispiel `/produkte/beds/sofas-brasilia-bed` oder `/produkte/sofas-couches/tables-coupe-tables`. Weitere 46 heißen nur `produkt-…`. Das ist eher unschön als kritisch. Bitte nur zusammen mit 301-Weiterleitungen ändern, also niedrige Priorität.
13. **Mögliche Dubletten:** „Yves“ und „Yves Sofà“ sind beide als Sofa geführt. „Albert & Ile“ und „Lelong“ gibt es je zweimal mit identischem Beschreibungsanfang und identischen Bildern. Beide Fälle bitte prüfen und gegebenenfalls zusammenführen.
14. **Alte oder auslaufende Modelle:** In der Stichprobe von 20 Familien (Hamilton, Andersen, Freeman Tailor, Yang, Lawson, Jacques, Russell, Goodman, Sendai, Orion, Blake-Soft, Tatlin, West, Saki, Pattie, Winston, Andrée u. a.) haben alle eine aktuelle Seite auf minotti.com. Von 240 Katalog-Familien fehlen nur 5 in der Minotti-Sitemap: Andrée (Umlaut-Slug, vorhanden), Blake-Soft (Seite vorhanden), „Laken aus Baumwollsatin“, „Leintücher“ und „Tatlin-Cover“. Die drei Letzteren sind Textil-Zubehör mit deutschen Eigennamen und sollten gegen die Preisliste geprüft werden. Es wurden keine eindeutig ausgelaufenen Modelle gefunden.

## 3. Die 30 wichtigsten Korrekturen für das Backoffice-Team

| # | Produkt (path_field) | Problem | Fix |
|---|---|---|---|
| 1 | Marke Gloster | 0 Produkte, Markenseite indexiert | Kernsortiment anlegen (Teak-Lounge, Dining, Dansk) oder Markenseite auf noindex |
| 2 | Marke Lambert | 0 Produkte, Markenseite indexiert | Auswahl anlegen oder Seite zurückstellen |
| 3 | Marken Minotti und Gloster, `dealers_description_de` | „offizieller Händler“ ohne Vertrag | neutral formulieren: „Minotti bei Platzhirsch – Beratung und Planung“ |
| 4 | Alle 84 Minotti-Produkte mit Klammer-Namen | 85 Seiten mit identischem Titel und H1 | Namen „Modell + Typ“ vergeben (z. B. „Fynn Bank“) |
| 5 | `cabinets-superquadra-cabinets`, `-cabinets-2`, `side-tables-superquadra-side-tables`, `tables-superquadra-tables`, `produkt-superquadra-variant` | 5× gleicher Titel, gleiche Bilder, 800-px-Hauptbild | eigene Namen, eigene Bilder, 1600-px-Bild an Position 1 |
| 6 | `tables-superquadra-tables` | Esstisch in `coffee-tables` | Kategorie `dining-tables` |
| 7 | `produkt-superquadra-variant` | Sitzbank in `sofas-couches` | `armchairs-stools`, Name „Superquadra Sitzbank“ |
| 8 | `mirrors-wisp-shade` | Teppich in `mirrors`, Hauptbild 800 px | Kategorie `rugs`, großes Bild nach vorn |
| 9 | `sofas-torii-sofas` | Couchtisch in `sofas-couches`, zeigt Sofa-Bilder | `coffee-tables`, „Torii Couchtisch“, eigene Bilder |
| 10 | `sofas-torii-sofas-2` | Drehsessel in `sofas-couches` | `armchairs-stools`, „Torii Drehsessel“ |
| 11 | `sofas-andersen-quilt`, `sofas-andersen-line-quilt`, `tables-andersen-slim-103-quilt`, `tables-andersen-slim-90-quilt`, `sofas-freeman-duvet` | Sofas in `bedwear` (Bettwäsche) | `sofas-couches` |
| 12 | `beds-larry-bedspread`, `beds-libra-bedspread`, `throw-yves-throw` | Tagesdecken und Plaid in `beds` | `bedwear` bzw. `decor` |
| 13 | `tables-side-tables` („Side (Tables)“) | Zeitschriftenständer in `sofas-couches` | `decor` bzw. `small-furniture`, „Side Zeitschriftenständer“ |
| 14 | `produkt-side-variant` | Beistelltisch in `sofas-couches` | `side-tables`, „Side Beistelltisch“ |
| 15 | `produkt-mattia-variant` (+ `-2`, `-3`) | Beistelltisch in `armchairs-stools`, 3× gleicher Titel und gleiche Bilder | Kategorie je Typ korrigieren, eigene Namen und Bilder |
| 16 | `produkt-johns`, `beds-johns-low` | Bücherregal in `coffee-tables` bzw. `beds` | `shelves` bzw. `sideboards-chests` |
| 17 | `side-tables-wedge`, `tables-kirk-wood` | Couchtisch in `dining-tables` | `coffee-tables` |
| 18 | `side-tables-oliver` | Beistelltisch in `dining-tables` | `side-tables` |
| 19 | `tables-saki-table` | Esstisch in `coffee-tables` | `dining-tables` |
| 20 | `produkt-jensen`, `produkt-shelley`, `sofas-lilliam` | Sessel in `sofas-couches` bzw. `dining-chairs` | `armchairs-stools` |
| 21 | `armchairs-vivienne-armchairs`, `produkt-freeman-lounge` | Sofa in `armchairs-stools` | `sofas-couches` |
| 22 | `produkt-kyle` (Beistelltisch), `produkt-case` (Sessel) | in `decor` | `side-tables` bzw. `armchairs-stools` |
| 23 | `cushion-cross-cushion` / `rugs-cross-rugs` | Kissen und Teppich mit identischen Bildern | richtige Bilder je Produkt |
| 24 | `armchairs-owens`, `stools-bag-light-stool`, `throw-avon-throw`, `beds-leintucher` | kein Bild | Bilder ergänzen oder Produkt deaktivieren |
| 25 | Alle Minotti-Produkte (460) | Designer fehlt | Designer laut minotti.com nachtragen, zuerst die Top-50 |
| 26 | Alle Minotti-Produkte (485) | Maße und Material fehlen | Hauptmaße (B × T × H, Sitzhöhe) und Materialgruppe auf Deutsch pflegen, zuerst die Top-50 |
| 27 | Minotti, 50 Top-Produkte | Langbeschreibung teils wortgleich mit minotti.com | eigene Texte (Beratung, Kombination, Material, Pflege) |
| 28 | Minotti Outdoor | 0 Outdoor-Produkte, alle Indoor | Outdoor-Familien anlegen (Lido Cord, Torii Nest, Bellagio, Aston Cord, Quadrado …) mit Flag `Outdoor` |
| 29 | `heaters-*` (10 Produkte, z. B. `heaters-glow-3-5` 300 px) | nur 1 Bild mit 300–690 px | Pressebilder ≥ 2000 px, 3–6 Ansichten; Leistung, Spannung und IP ergänzen |
| 30 | `heaters-leaf` (ggf. `heaters-twig`) und `heaters-dome-freestanding`/`heaters-disc-freestanding` | Beschattung als Heizstrahler kategorisiert; identische Maße und Gewichte | Kategorie Beschattung; Maße gegen das technische Datenblatt prüfen |

Außerhalb der Top 30, aber schnell erledigt: Livintwist-Hauptbilder tauschen (6 Produkte), Maße für Belvedere Chaise Longue und 3-Seater ergänzen, Canopy-Maße in cm angeben, „Convivio“ prüfen. Dazu kommen die Minotti-Kollektionsfelder und die Übersetzungen von `dealers_*`, `desing_approach_*` und `craft_disciplines` auf Markenebene für EN, FR und IT.

## 4. SEO-Priorität: welche Produkte Suchpotenzial haben

Es wurde kein Tool für Suchvolumen eingesetzt. Die Einstufung beruht auf der Modell-Suchlogik aus dem SEO-Schlachtplan (25: „Minotti Lawrence Sofa“, „Minotti Connery Preis“), auf der Bekanntheit der Modelle und auf dem Datenzustand. Hier ist der Hebel am größten, wenn die Daten zuerst gepflegt werden.

**Priorität A: Minotti-Sofas und -Sessel mit hoher Modellbekanntheit.** Bilder sind meist gut (16–20), es fehlen aber Designer und Maße, und bei einigen gibt es Titel-Dubletten.

| Modell | Katalogstatus | Was zuerst |
|---|---|---|
| Lawrence (+ Clan, Bed) | 20 Bilder, kein Designer, keine Maße | Designer, Maße, eigener Text (im Plan als Beispiel genannt) |
| Connery | 20 Bilder, kein Designer | wie oben, „Preis auf Anfrage“-Hinweis |
| Hamilton | 20 Bilder, Designer vorhanden | Maße, eigener Text statt Herstellertext |
| Andersen-Familie (14 Produkte) | 2–3 Bilder je Produkt, 4 Sofas in Bettwäsche | Kategorien (#11), mehr Bilder, Kollektion |
| Freeman / Freeman Tailor | 11–16 Bilder | Designer, Maße, Kategorie „Lounge“ (#21) |
| Torii, Torii Bold | 4 Seiten „Torii“, 3 Seiten „Torii Bold“, gleiche Bilder | Namen, Bilder, Kategorie (#9, #10) |
| West, Yang, Goodman, Tape, Horizonte | Titel-Dubletten (West, Tape, Horizonte) | Namen und Kategorien |
| Daiki, Lawson, Jacques, Sendai, Twiggy | Titel-Dubletten | Namen nach Typ |

**Priorität B: Minotti-Esstische und Couchtische** (Linha, Bellagio, Superquadra, Fynn, Wedge, Saki). Hier gibt es viele Fehlkategorien, dabei sind Suchen nach Esstischen sehr kaufnah.

**Priorität C: Outdoor am Bodensee.** Das Potenzial ist groß, aber im Katalog ist kaum etwas vorhanden. Minotti Outdoor fehlt ganz, Gloster hat 0 Produkte. Heatsail-Heizstrahler sind stark für die Herbst- und Wintersaison auf Terrassen (Suchen nach Terrassenheizstrahler und Infrarot-Heizstrahler, siehe Marken-Keywords im Backoffice), haben im Moment aber Briefmarken-Bilder und keine technischen Daten. Wenn Heatsail Dome, Disc und Beem bis zur Wintersaison nachgepflegt sind, ist das der schnellste Gewinn.

**Priorität D:** Livintwist (Nischenmarke, Daten weitgehend in Ordnung) sowie Minotti-Textilien und -Accessoires (Throws, Kissen, Lazy Susan). Wenig Suchvolumen, aber für die interne Verlinkung nützlich.

## 5. Methodik und Grenzen

- Kategorien wurden automatisch geprüft, indem das erste Typ-Stichwort der eigenen DE-Beschreibung mit der Kategorie verglichen wurde. Treffer wurden manuell gesichtet, Fehlalarme wie „Polsterbett … des Sitzprogramms“ wurden verworfen.
- „Wortgleich mit Hersteller“: Für 11 Modelle wurden die Sätze von `mehr_beschreibung` mit dem Text von minotti.com/de/<modell> verglichen. Bei 7 Modellen wurde die Seite gefunden, dort waren 20–57 % der Sätze wortgleich. Bei Yang, Freeman und West hat der Slug vermutlich nicht gepasst, diese Werte sind daher nicht aussagekräftig.
- Die Bildgrößen wurden aus dem WebP-Header gelesen und nicht visuell geprüft. Ob ein Bild inhaltlich zum Produkt passt, wurde nur dort beurteilt, wo identische Bildsätze bei verschiedenen Produkttypen auftreten.
- Der Abgleich mit dem Herstellersortiment ist eine Stichprobe. Eine 404-Prüfung auf minotti.com funktioniert (unbekannte Slugs liefern 404), die Sitemap enthält aber auch ältere Seiten.
- Quellen: minotti.com/en/sitemap.xml und Modellseiten, heatsail.com/sitemap.xml mit Seiten zu Leaf, Disc FS und Dome FS, [Fuorisalone 2025 – Livintwist Belvedere](https://fuorisalone.it/en/2025/events/5666/Livintwist-Belvedere-Collection), [Design Shanghai – Apsaras](https://www.designshanghai.com/new-product-2024/apsaras-rocking-chair-by-zeng-jinghua).
