# Katalog-Audit Marken S–Z

**Stand:** 26.10.2026. **Datenbasis:** öffentliche Backoffice-Endpunkte (`produkte_new.api.get_produkte_by_marke_api`, `get_produkt_by_path_field_api` in DE/EN/FR/IT, `marken.api.marken_data`). Geprüft wurden alle 274 aktiven Produkte, 1.050 Bilddateien (Pixelmaße über Range-Request ausgelesen) und alle 23 PDF-Dateien hinter 105 Download-Links (HTTP-HEAD). Dazu kamen 8 Stichproben gerenderter Seiten auf `localhost:3000` und ein Abgleich mit den Herstellerseiten von Umbrosa, Tuuci, Sifas, Schüller und Solpuri.

**Methodische Grenzen:** Suchvolumina wurden nicht erhoben, die SEO-Priorität ist deshalb eine Einschätzung. Die Treca-Website war nicht abrufbar (Redirect-Schleife), Treca wurde daher nicht mit dem Hersteller abgeglichen. Ob die Texte vom Hersteller kopiert sind, wurde nicht systematisch geprüft. Nach dem Code-Kommentar in `src/lib/shop/shopProducts.js` gilt: `beschreibung` ist der umgeschriebene Text, `mehr_beschreibung` der Originaltext des Herstellers.

---

## 1. Kennzahlen je Marke

| Marke | Produkte | ohne Bild | nur 1 Bild | Produkte mit Bildern < 1200 px (Bilder gesamt) | Beschreibung fehlt / < 150 Zeichen / doppelt | EN/FR/IT fehlt | Designer fehlt | Maße im Datensatz | **Maße-Tab sichtbar** | Gewicht | PDF-Links (kaputt) | Auffälligkeiten |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Schueller (Schüller) | 29 | 0 | 0 | 0 (0/201) | 0 / 0 / 0 | 0 / 0 / 0 | 29 (bei Küchen ok) | 0 | 0 | 0 | 0 | 2 Bannerbilder 404 (Varese, Vicenza), „Cameo - kitchen“, „Pantry“ ist kein Küchenmodell |
| Sifas | 59 | 0 | 5 | 10 (10/207) | 0 / 0 / 0 | 0 / 0 / 0 | 59 | 59 | **0** | 53 (27 in lbs/in) | 0 | Einheiten-Chaos, unplausible Maße, englische Namen |
| Solpuri | 59 | 0 | **24** | 0 (0/187) | 0 / 0 / 0 | 0 / 0 / 0 | 1 | 55 | **0** | 30 | 105 Links, 0 kaputt | 3 generische Pflege-PDFs an 55 Produkten |
| Tom Dixon | **0** | – | – | – | – | – | – | – | – | – | – | Marke steht auf `es_gibt_produkte = 1`, hat aber 0 Produkte |
| Tonon | **0** | – | – | – | – | – | – | – | – | – | – | 0 Produkte |
| Trapa | **0** | – | – | – | – | – | – | – | – | – | – | 0 Produkte (Böden/Treppen) |
| Treca (Tréca) | 96 | 0 | 2 | **53 (65/396)** | 0 / 0 / 0 | 0 / 0 / 0 | 96 | 95 (Freitext) | 85 ohne Zeichnung | 0 | 0 | 50×50-px-Fremdbild an 40 Produkten, 80 von 96 in „beds“ |
| Tuuci | 15 | 0 | 0 | **15 (52/74)** | 0 / 0 / 0 | 0 / 0 / 0 | 15 | 15 | **0** | 0 | 15 Links, 0 kaputt | **keine Sonnenschirme**, nur 2 Möbelserien |
| Umbrosa | 16 | **1** (Eclipsum, auch ohne Banner) | 0 | 7 (18/173) | 0 / 0 / 0 | 0 / 0 / 0 | 3 | **0** | 0 | 0 | 0 | keine Schirmgrößen, ältere Modelle neben UX/PX |
| **Summe** | **274** | 1 | 31 | 85 | 0 | 0 | 203 | 224 | 85 | 83 | 0 von 23 Dateien | |

**Was gut ist:** Alle 274 Produkte haben eine Beschreibung von mindestens 380 Zeichen. Es gibt keine identischen Beschreibungen, und EN, FR und IT sind vollständig gepflegt; in den FR/IT/EN-Feldern wurde kein deutscher Resttext gefunden. Alle Meta-Descriptions sind 70–165 Zeichen lang. Alle 23 PDF-Dateien liefern HTTP 200 als `application/pdf`. Die 8 Stichproben-Seiten liefern alle HTTP 200 mit passendem Title und H1.

### Wichtigster Systembefund: Maße werden fast nie angezeigt

Die Produktseite zeigt den Tab „Maße“ nur an, wenn `additional_information.dimensions` dem Format `Bezeichnung: Zahl cm` entspricht. Das liegt an `parseDimensions` in `src/components/ShopCatalog/dimensionDiagram.js`. Die Maßzeichnung erscheint nur bei den englischen Schlüsseln `width`, `height` oder `diameter`. Das Ergebnis:

- **Sifas, Solpuri und Tuuci (133 Produkte):** Das Format „52 x 61 x 112 cm“ wird nicht erkannt. Die Maße stehen im Backoffice, auf der Seite gibt es aber **keinen Maße-Tab**. Teilweise stehen die Maße nur im Fließtext.
- **Treca (85 Produkte):** Die Werte werden als Liste angezeigt („HÖHE 113 cm“), aber ohne Zeichnung. Teile wie „Breite = Nennmaße + 40 cm“ fallen weg.
- **Gewicht** wird unverändert ausgegeben, also auf der deutschen Seite z. B. „41.4 lbs“ (Sifas Basket 2 seater sofa).

Das muss **Entwicklung und Backoffice gemeinsam** lösen: Der Parser muss „B × T × H cm“ verstehen, und das Backoffice muss ein einheitliches metrisches Format pflegen. Dieser Audit ändert keinen Code.

---

## 2. Befunde je Marke

**Schüller (29):** Bilder, Texte und Übersetzungen sind vollständig. Strukturierte Felder (Material, Front, Arbeitsplatte) gibt es nicht, diese Angaben stehen nur im Text. `bannerbild` von **Varese** (`/files/Varese-1.jpg`) und **Vicenza** (`/files/Vicenza-1.jpg`) liefert 404. Der Produktname „Cameo - kitchen“ ist ein Import-Rest. Laut schueller.de ist „Pantry“ ein eigener Produktbereich und kein Küchenmodell. Schüller nennt „Biella Satin“ als „Arosa Satin, Pore“ und „Countryhouse Finca“ als „Finca Satin, Pore“. Auf schueller.de stehen außerdem Modelle, die im Katalog fehlen: Sora, Prato, Avola (Smartglas) und Matera Night Green. Alle 29 vorhandenen Modelle sind auf der Herstellerseite noch gelistet.

**Sifas (59):** Alle 14 Kollektionen von sifas.com sind vorhanden. Die Maße sind in schlechtem Zustand:
- 27 Produkte haben Zoll/lbs-Angaben auf der deutschen Seite.
- Mehrere Werte sind cm-Zahlen mit der Einheit „in“: Komfy 2/3 seater (Rope/Teak) „170 × 85 × 84 in“, Kalife Corner module „90 × 90 × 78 in“.
- Einige Werte mischen Einheiten: Basket Bar stool „56 × 56 × 39.8 in“, Hips Bar table „27.6 × 56 × 41.7 in“, Coco Resin armchair „59 × 25 × 77 in“, Coco Teak armchair „23.2 × 24.4 × 83 in“.
- Unplausibel sind Kross 2 seater „128 x 221 x 231 cm“ und Kross 3 seater „483 x 221 x 231 cm“.
- Oskar Bench und Oskar Coffee table haben identisch „361 x 190 x 114 cm“, offensichtlich kopiert.
- Die drei Komfy Side tables 75×75 haben drei verschiedene Höhen (54 cm, 21.3 in, 27.5 in).

Die Namen sind englisch, einer mit Tippfehler („Kross Ajustable chaise lounge“), und einige tragen das Präfix „Additionals“. Bei allen 59 Produkten fehlt der Designer; sifas.com nennt auf der Startseite keine Designer, sie müssen aus den Produktblättern kommen. Die Korol-Tische und die Fishman-Lampen haben je ein Bild mit 545 px, die Kross-Sofas je eins mit 630×430 px. Die 4 Nabab-Produkte und Komfy Side table Classic haben nur 1 Bild.

**Solpuri (59):** Die Designer sind gut gepflegt (fehlt nur bei MILANO BISTRO). 24 Produkte haben **nur 1 Bild**: alle BOOM-, BOXX- und PLATEAU-Arrangements. Bei diesen Arrangements und bei CARO Corner Module XL fehlen Gewicht und Höhe, BOOM hat gar keine Maße. Die Download-Links funktionieren, die Zuordnung ist aber irreführend:
- `…basket-dining-chair…-doc-02.pdf` hängt an 27 Produkten. Laut PDF-Metadaten ist es der „Pflegehinweis Aluminium“.
- `…aton-sunshade-rectangular-doc-02.pdf` (18×) ist der „Pflegehinweis Teak“.
- `…bari-bar-table-hpl-doc-02.pdf` (10×) ist der „Pflegehinweis Edelstahl“.

Die Pflegehinweise stehen im Feld `katalog` und tragen den Dateinamen eines anderen Produkts. Bei BOXX und PLATEAU ist der Pflegehinweis das einzige Dokument. Ob der Pflegehinweis jeweils zum Material passt (z. B. Teak-Pflege an PLATEAU), muss das Team prüfen. JAZZ footstool hat kein PDF. Die Solpuri-Startseite stellt die Kollektion **CHILL** (German Design Award) heraus, die im Katalog fehlt.

**Treca (96):** Texte und Übersetzungen sind vollständig.
- **Dieselbe 50×50-px-Datei `/files/kopfteil-alezane-04.webp` hängt an 40 Produkten** (alle 26 Kopfteile und 14 Matratzen), oft an Position 2–7 der Galerie. Wahrscheinlich ist das ein Import-Fehler.
- Weitere kleine Bilder mit 615–750 px gibt es bei den Bettfüßen und bei Bett Adonis. Kofferecke hat ein Bild mit 135×76 px.
- 80 von 96 Produkten liegen in der Kategorie „beds“: 26 Kopfteile, 17 Matratzen, 13 Liegesysteme, 12 Füße, 9 Untermatratzen, 3 Betten. Wer nach Betten sucht, sieht also mehrheitlich Bettfüße und Matratzen.
- Fehler in den Maßen: „Matratzenauflage Riviera – Höhe: 32 cm“ widerspricht „Riviera – Höhe: 7 cm“ im Liegesystem Belle Vue. Füße Colette hat 15 und 17 cm im selben Feld, Füße Angèle doppelt 17 cm. Kopfteil Alezane enthält das Fragment „maße + 24 cm“. Matratze Platinum Essentiel hat gar keine Maße.
- Namensfehler: „UntermatratzeTrecaflex Fixe“ (Leerzeichen fehlt), „Hocker coco“ (Kleinschreibung).
- Gewicht ist nie gepflegt, Designer bei Treca nicht relevant.

**Tuuci (15):** Der Katalog enthält nur die Möbelserien Bleau (13) und Brickell (2). **Sonnenschirme, Tuucis Kernsortiment, fehlen ganz.** Tuuci.com führt Parasol Collections, Shade Sculpture, Shade Blade, Pergolas und Cabanas sowie „Marine“ als Einsatzbereich. Eine eigene Marine-Produktlinie wird auf der Startseite nicht genannt. 52 der 74 Bilder sind 600–1000 px groß, alle Banner bis auf eins unter 1200 px. Alle 13 Bleau-Produkte verlinken dasselbe Kollektions-PDF, das ist inhaltlich korrekt („Bleau Collection Product Overview“). Bei allen 15 Produkten fehlen Gewicht und Designer.

**Umbrosa (16):** **Eclipsum hat kein einziges Bild und kein Banner.** Die Seite rendert trotzdem mit HTTP 200, also eine indexierbare Seite ohne Produktbild. Bei allen 16 Schirmen fehlen Maße und Gewicht, obwohl die Schirmgröße (z. B. 3 × 3 m, Ø 3 m) das wichtigste Kaufkriterium ist. Die einzige Materialangabe ist englisch („Metal“, Eclipsum). „Umbrosa Bases“ (Schirmfüße) steht als Produkt in „parasols“. Neben den aktuellen UX/PX-Versionen führt der Katalog „Eclipsum“, „Nata“ und „Paraflex“ ohne Zusatz. Die deutsche Umbrosa-Startseite listet nur Aurelis, Versa PX und Nata UX. Die Salone-Seiten von Umbrosa beschreiben Eclipsum UX als verstärkte Weiterentwicklung. Ob „Eclipsum“ und „Nata“ ohne Zusatz noch geliefert werden, muss mit Umbrosa geklärt werden. Bei Eclipsum, Nata und Umbrosa Bases fehlt der Designer; die Hersteller-Seiten nennen für Eclipsum UX „Bundl / Umbrosa Design Team“.

**Tom Dixon, Tonon, Trapa:** Diese Marken haben 0 Produkte. Die Markenseiten `/de/ueber-uns/marken/…` liefern HTTP 200 und verlinken kein einziges Produkt. Tom Dixon steht im Backoffice trotzdem auf `es_gibt_produkte = 1`. Laut `01-bestandsanalyse.md` wird Tom Dixon als Top-Marke beworben.

---

## 3. Die 30 wichtigsten Korrekturen für das Backoffice-Team

| # | Produkt / Marke | Problem | Fix |
|---|---|---|---|
| 1 | Umbrosa **Eclipsum** | 0 Bilder, kein Banner, Seite ist trotzdem live | Bilder nachladen oder auf inaktiv setzen, falls es durch Eclipsum UX ersetzt wurde |
| 2 | Treca, 40 Produkte (alle Kopfteile, 14 Matratzen) | Fremdbild `kopfteil-alezane-04.webp` mit 50×50 px in der Galerie | Bildzeile aus allen 40 Galerien entfernen |
| 3 | **Tuuci** | Keine Sonnenschirme im Katalog | Die Schirm-Kollektionen anlegen, die Platzhirsch tatsächlich führt (Händlerstatus intern klären) |
| 4 | Tom Dixon | 0 Produkte, `es_gibt_produkte = 1` | Kernsortiment anlegen (Leuchten) oder Flag auf 0 setzen |
| 5 | Sifas, 27 Produkte | Maße/Gewicht in in/lbs auf der DE-Seite | Alles in cm/kg umrechnen und neu erfassen |
| 6 | Sifas Komfy 2/3 seater (Rope, Teak), Kalife Corner module | cm-Werte als „in“ gespeichert | Einheit auf cm korrigieren |
| 7 | Sifas Basket Bar stool, Hips Bar table, Coco Resin/Teak armchair | Einheiten gemischt (z. B. „27.6 × 56 × 41.7 in“) | Mit dem Sifas-Datenblatt neu erfassen |
| 8 | Sifas Kross 2/3 seater | Maße unplausibel (231 cm hoch, 483 cm breit) | Mit dem Datenblatt korrigieren |
| 9 | Sifas Oskar Bench / Oskar Coffee table | Gleiche Maße 361×190×114 cm (kopiert) | Echte Maße je Produkt eintragen |
| 10 | Sifas Komfy Side table 75×75 (3 Varianten) | Drei verschiedene Höhen in zwei Einheiten | Vereinheitlichen und prüfen |
| 11 | Alle mit Maßen (Sifas, Solpuri, Tuuci = 133) | Maße-Tab erscheint nicht (Format) | Einheitliches Format festlegen, z. B. „Breite: 52 cm · Tiefe: 61 cm · Höhe: 112 cm“, **und** Parser durch die Entwicklung anpassen |
| 12 | Umbrosa, alle 16 | Keine Schirmgrößen, Gewichte oder Fußgewichte | Größen (Ø / Seitenlänge), Mastmaterial, Fußgewicht eintragen |
| 13 | Schüller **Varese**, **Vicenza** | `bannerbild` liefert 404 | Banner neu hochladen oder auf ein Galeriebild setzen |
| 14 | Solpuri BOXX (9) und PLATEAU (12) | Nur 1 Bild | Ambiente- und Detailbilder ergänzen (mind. 3) |
| 15 | Solpuri BOOM A/B/C | 1 Bild, keine Maße | Bilder und Maße ergänzen |
| 16 | Solpuri, 55 Produkte | Pflegehinweis (Alu/Teak/Edelstahl) unter fremdem Dateinamen im Feld „Katalog“ | Umbenennen („solpuri-pflegehinweis-aluminium.pdf“), Zuordnung zum Material prüfen, echte Datenblätter ergänzen |
| 17 | Solpuri JAZZ footstool | Kein PDF, anders als die übrigen JAZZ-Produkte | Datenblatt der Kollektion verlinken |
| 18 | Solpuri MILANO BISTRO | Designer fehlt | Laut Hersteller nachtragen |
| 19 | Solpuri | Kollektion CHILL (German Design Award) fehlt | Aufnehmen, sofern Teil des Sortiments |
| 20 | Tuuci, 15 Produkte | 52 von 74 Bildern 600–1000 px | Hochauflösende Bilder aus dem Tuuci-Pressebereich holen (≥ 1600 px) |
| 21 | Treca, Kategorie „beds“ | 80 Produkte gemischt (Füße, Kopfteile, Matratzen) | Unterkategorien Matratzen, Kopfteile, Bettfüße, Boxspring/Untermatratzen anlegen |
| 22 | Treca Matratzenauflage Riviera | Höhe 32 cm (an anderer Stelle 7 cm) | Korrigieren |
| 23 | Treca Füße Colette / Angèle, Kopfteil Alezane, Matratze Platinum Essentiel | Widersprüchliche, doppelte, fragmentierte oder fehlende Maße | Bereinigen |
| 24 | Treca „UntermatratzeTrecaflex Fixe“, „Hocker coco“ | Tippfehler im Namen | „Untermatratze Trecaflex Fixe“, „Hocker Coco“ |
| 25 | Treca Kofferecke, Füße New Square, Bett Adonis | Bilder 135–750 px | Ersetzen |
| 26 | Schüller „Cameo - kitchen“ | Import-Rest im Namen | „Cameo“ |
| 27 | Schüller „Pantry“, „Biella Satin“, „Countryhouse Finca“ | Weicht von der Benennung beim Hersteller ab; Pantry ist kein Küchenmodell | Namen an schueller.de angleichen, Pantry als Ausstattung führen |
| 28 | Schüller | Aktuelle Modelle Sora, Prato, Avola, Matera Night Green fehlen | Ergänzen |
| 29 | Umbrosa Eclipsum / Nata / Paraflex (ohne UX) | Möglicherweise Vorgängermodelle neben UX/PX | Lieferbarkeit bei Umbrosa klären, sonst deaktivieren oder weiterleiten |
| 30 | Umbrosa Bases, Material „Metal“ | Zubehör in „parasols“, englisches Materialfeld | Kategorie „Zubehör“, Material „Metall“; Designer bei Eclipsum/Nata nachtragen |

Kleinere Punkte: Sifas „Ajustable“ → „Adjustable“ und das Präfix „Additionals“ aus den Namen entfernen. Bei Sifas fehlen alle Designer. Treca hat bei keinem Produkt ein Gewicht.

---

## 4. SEO-Priorität (Einschätzung, ohne Suchvolumendaten)

| Priorität | Produkte | Warum | Was zuerst tun |
|---|---|---|---|
| **A** | **Umbrosa Paraflex, Versa UX/PX, Infina, Spectra, Nano UX, Icarus UX** | Ampel- und Mittelmastschirme werden mit Marke und Modell gesucht („Umbrosa Paraflex Preis“) und passen zur Outdoor-Saison Feb–Jun (06-online-randprodukte) | Größen und Maße (#12), Eclipsum-Fix (#1) |
| **A** | **Tuuci Sonnenschirme** (nicht vorhanden) | Hotel- und Villen-Zielgruppe, Contract-Türöffner (05-kuechen-contract-projekte); heute gibt es keine Landingpage | Schirm-Produkte anlegen (#3) |
| **A** | **Treca Matratzen** (Impérial-, Platinum-, Paris-Linie) und **Kopfteile** | Laut 03-konkurrenz-oesterreich ist Platzhirsch der einzige Treca-Händler in Vorarlberg; Matratzen werden oft per Modellname gesucht | Fremdbild entfernen (#2), Unterkategorie „Matratzen“ (#21) |
| B | **Schüller Matera, Elba, Nova, Cameo, Varese** | Küchensuche mit „Schüller + Modell“ ist regional relevant (Küchenhebel A, 05-kuechen); die Landingpage `/de/kuechen-vorarlberg` nennt Schüller laut 01-bestandsanalyse nicht | 404-Banner (#13), fehlende Modelle (#28) |
| B | **Solpuri BOXX, PLATEAU, JAZZ, LOOP** | Modulare Outdoor-Lounges; Arrangement-Seiten mit nur 1 Bild konvertieren und ranken schwach | Bilder (#14), Maße-Anzeige (#11) |
| C | **Sifas Kross, Komfy, Oxford, Riviera** | Weniger bekannte Marke, Long-Tail; falsche Maße schaden eher, als dass sie nützen | Zuerst Maße korrigieren (#5–#10) |
| C | Treca Füße, Kofferecke, Untermatratzen | Zubehör ohne eigenes Suchinteresse | Unterkategorie, kein eigener SEO-Aufwand |

**Quellen:** Backoffice-API (s. o.); umbrosa.be/de; tuuci.com; sifas.com; schueller.de/en; solpuri.com/en; Salone-Milano-Produktseiten von Umbrosa (lb.salonemilano.it/en/prodotti/umbrosa/eclipsum-ux, …/nata-ux, …/px-collection). Die Rohdaten und Skripte dazu liegen im Scratch-Ordner der Session und sind nicht Teil des Repos.
