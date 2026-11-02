# 11 – Online-Shop-Sortiment & Hersteller-Sourcing

**Platzhirsch Home Living, Lochau (Vorarlberg)** · Stand: 26.10.2026 · Rolle: E-Commerce-Sortimentsmanagement

> **Lesehinweis:** Preise stammen aus den angegebenen Händler- oder Herstellerseiten (Abruf über die Websuche am 26.10.2026; Händlerpreise ändern sich laufend). Alles, was mit **[Schätzung]** markiert ist, habe ich hergeleitet. Händler-Einkaufskonditionen (EK, Rabattstaffeln) sind bei keinem der Hersteller öffentlich. Die Margenspalten sind deshalb Schätzungen und gehören mit den echten Preislisten abgeglichen. **[offen]** heißt: nicht belegt, beim Hersteller zu klären.
> Hinweis zur Recherche: Das Suchbudget dieser Sitzung war am Ende aufgebraucht. Einige Preise (z. B. Umbrosa, Heatsail, Eichholtz, Brand van Egmond) konnte ich deshalb nicht mehr nachschlagen. Sie sind als „Preis prüfen“ markiert und nicht geschätzt.

---

## 0. Kernaussagen

1. **Der Shop kann heute nichts verkaufen.** Der Code bildet 1.765 Produkte aus 36 Marken ab (live aus `backoffice.platzhirsch.studio` gezählt). Es gibt aber **kein Preisfeld, keinen Lagerbestand, kein Versandfeld und keinen Checkout**. Der „Warenkorb“ ist eine Merkliste, die in ein Anfrageformular mündet (`CartPage.js` → `AnfrageFormProduct`).
2. **Im Backoffice liegt schon ein verkaufsfähiges Kernsortiment:** 144 Flos-Leuchten, 111 Brand van Egmond, 24 Baobab-Kerzen, 62 × 101 Copenhagen, 150 × Eichholtz, 16 Umbrosa-Schirme, 12 Heatsail-Heizstrahler, 37 Bettwäsche-Artikel (Alonpi, Treca, Minotti). Was fehlt, sind Preise, Freigaben und Logistikdaten, keine neuen Marken.
3. **Bei Bestsellern wie Flos und Louis Poulsen ist der Preiskampf online verloren.** Connox gibt auf Flos Coordinates 15 % unter UVP, auf die Louis-Poulsen-PH-5 rund 27 %. Flos betreibt zudem einen **eigenen Online-Store für DE** (gratis Versand ab 200 €). Leuchten deshalb im Shop nur **zur UVP** listen, mit Zusatznutzen (Lichtberatung, Montage, Abholung, CH-Lieferung verzollt) und nicht über den Preis.
4. **Die Marge liegt dort, wo Preise nicht vergleichbar sind:** Duftkerzen und Accessoires von Nischenmarken, Outdoor-Zubehör (Schirmsockel, Hüllen, Heizer), Ausstellungsstücke (Einzelstücke), Gutscheine, Bettwäsche (Alonpi, Treca) und hochpreisige Leuchten mit Montagebedarf (Brand van Egmond).
5. **Der größte echte Wettbewerbsvorteil ist die Schweiz.** Bei einem Verkauf in die Schweiz entfallen die 20 % österreichische USt, dafür kommen 8,1 % Schweizer MWST dazu. Für Schweizer Kunden ist die Ware so rund **10 % günstiger als der österreichische Bruttopreis** [Schätzung, Rechnung in Abschnitt 4]. Schweizer Onlineshops lagen in einer Erhebung der Konsumentenorganisation FRC im Schnitt rund ein Drittel über deutschen und französischen [S17]. Mit **Unterstellungserklärung** bei der ESTV und einem Steuervertreter kann Platzhirsch **verzollt (DDP) in CHF** liefern, auch mit Montage. Das bietet in der Region kein Premium-Händler an (siehe 04, Abschnitt 6).
6. **Marktplätze nur für Einzelstücke:** Ausstellungsstücke über Pamono, 1stDibs, Vinterior oder Deesup. Neuware von Premiummarken gehört nicht auf Amazon: Plattformverbote sind nach der Vertikal-GVO zulässig, und der Markenwert leidet.
7. **Sortimentslücke gegenüber der Region:** Skandinavische Leuchten und Möbel (Louis Poulsen, &Tradition, Menu, Carl Hansen, Vibia, Gubi) führen bereits reiter design (Weiler), Bihler, PWB und Staehlin (03, 04). Platzhirsch sollte sich dort mit **italienisch-französischem Luxus-Lifestyle** abgrenzen: Kerzen (Trudon, Baobab-Großformate), Fornasetti, Feuer- und Outdoor-Objekte (Feuerring, höfats) und Akkuleuchten für Terrasse und Hotel.

---

## 1. Ist-Stand: Was der Shop heute kann

### 1.1 Code-Befund

| Bereich | Befund | Datei |
|---|---|---|
| Produktdaten | `toShopProduct()` mappt nur `id, name, brand, categoryKey, indoorOutdoor, image, url_slug, designer, subCategoryKeys, colorKeys, materialKeys`. **Kein Preis, keine Verfügbarkeit, keine Lieferzeit, kein Gewicht oder Versandmaß.** | `src/lib/shop/shopProducts.js` |
| Datenquelle | Frappe-Doctype „Produkte New“, Gast-Endpunkte (`get_produkte_by_kategorie`, `get_produkte_by_marke_api`), Revalidierung 1 h | `src/lib/api/fetchAllProdukte.js`, `src/lib/apiBaseUrl.js` |
| Katalog-UI | Kategorie-Raster, Filter (Farbe, Material, Unterkategorie), Galerie, Maßzeichnung, Info-Tabs, Merkliste-Herz | `src/components/ShopCatalog/*` |
| Suche | Navbar-Suche über `/api/shop-search` | `src/app/api/shop-search/route.js` |
| Warenkorb | „Merkliste“ (CartContext/localStorage) → Button „Anfrage senden“ → `AnfrageFormProduct`. **Kein Checkout, keine Zahlung**, keine Payment-Library in `package.json` (bestätigt 06) | `src/components/CartPage/CartPage.js` |
| Rechtliches für Shop | AGB/Widerruf/Versandseiten für Fernabsatz sind nicht vorhanden [offen, nicht im Detail geprüft] | – |

### 1.2 Sortiment im Backoffice (live gezählt, 26.10.2026)

36 aktive Marken, **1.765 Produkte**. Nach Online-Eignung sortiert:

| Marke | Produkte | Schwerpunkt (Kategorien laut Backoffice) | Online-Eignung |
|---|---|---|---|
| Flos | 144 | nur Leuchten | hoch, aber Preisdruck (Abschnitt 2) |
| Brand van Egmond | 111 | nur Leuchten (Kronleuchter) | mittel: hochpreisig, Montage, wenig Preisvergleich |
| Eichholtz | 150 | Leuchten 30, Möbel, Spiegel 8 | hoch (Lagerware beim Hersteller) |
| 101 Copenhagen | 62 | Deko 20, Leuchten 20, Küchenaccessoires 4 | hoch |
| Baobab | 24 | Kerzen | **sehr hoch** |
| Alonpi | 23 | Bettwäsche 20, Deko 3 | hoch |
| Quasar | 14 | Leuchten | mittel |
| Umbrosa | 16 | Sonnenschirme | mittel bis hoch (Speditionsware) |
| Heatsail | 12 | Heizstrahler | hoch (saisonal) |
| Treca | 96 | Betten 80, Bettwäsche 9 | Betten nein, Topper und Bettwäsche ja |
| ClassiCon | 126 | Beistelltische 28, Teppiche 14, Spiegel 7, Leuchten 10 | Kleinmöbel ja |
| Minotti | 487 | Beistelltische 85, Teppiche 34, Deko 24, Sofas 62 | Deko und Beistelltische „Preis ab“, Sofas nur Anfrage |
| Paola Lenti, Solpuri, Sifas, Tuuci, Desalto, Livintwist | 100 / 59 / 59 / 15 / 50 / 9 | Outdoor-Lounge, Gartentische | nur Anfrage oder Ausstellungsstücke |
| Poliform, Rimadesio, Next125, Schüller | 103 / 63 / 13 / 29 | Möbel, Küchen | nur Anfrage |
| **0 Produkte:** Tom Dixon, Gloster, Qeeboo, Trapa, Tonon, Bullfrog, Bombyxx, EMU, Pomax, Frost, Lambert, Papadatos, antoniolupi, Agape | 0 | – | Tom Dixon und Qeeboo sind **sofort shopfähig**, sobald sie gepflegt sind |

**Sofortmaßnahme:** Tom Dixon (Accessoires, Melt-Akkuleuchten) und Qeeboo einpflegen. Beide stehen als Marken auf der Website, sind aber leer (siehe 01).

---

## 2. Was Hersteller erlauben: selektiver Vertrieb, Online, Preise

| Regel | Inhalt | Folge für Platzhirsch |
|---|---|---|
| **Eigener Onlineshop** | Ein Totalverbot des Online-Verkaufs ist eine Kernbeschränkung. Qualitätsauflagen (Darstellung, Beratung, stationäres Geschäft) sind zulässig [S1][S2]. | Ein eigener Shop auf platzhirsch.studio ist auch bei selektiv vertreibenden Marken grundsätzlich zulässig. Die **Händlerverträge** auf Auflagen prüfen. |
| **Plattformverbote** | Nach Vertikal-GVO 2022/720 und den Leitlinien für alle Produkttypen zulässig, solange der Händler das Internet wirksam nutzen kann [S2]. EuGH *Coty*: Amazon-Verbot für Luxusware zulässig [S3]. | Amazon und Co. für Neuware der Premiummarken vergessen. Marktplätze nur für Einzelstücke, nach Rücksprache. |
| **Preisbindung** | Preisbindung der zweiten Hand bleibt verboten, ebenso Mindestwerbepreise (MAP). Erlaubt sind UVP und Preis-Monitoring durch den Hersteller [S2]. | Platzhirsch setzt seine Preise selbst. Faktisch erwarten die Marken aber UVP-Treue. Rabattschlachten schaden dem Verhältnis zu Minotti und Poliform. |
| **Doppelpreissysteme** | Nach den neuen Leitlinien darf ein Hersteller für online verkaufte Ware einen anderen Großhandelspreis verlangen. Die Quellen sind hier nicht einheitlich [S2]. | Beim Einkauf fragen, ob Online-Konditionen abweichen. |
| **Verkauf an Nicht-Vertragshändler** | In selektiven Systemen verboten [S1]. | Ware nur direkt beim Hersteller oder bei der autorisierten Landesvertretung kaufen. **Achtung:** Großhandelsplattformen wie Qogita (listet Trudon [S24]) können außerhalb des selektiven Systems liegen [offen]. |
| **Hersteller als Online-Konkurrent** | Flos betreibt einen „Offiziellen Flos Online-Store“ für DE mit Warenkorb, Klarna-Ratenzahlung und Gratis-Versand ab 200 € [S4]. Vitra betreibt eigene Onlineshops (z. B. CH: Vitra International AG) [S5]. | Bei Flos gibt es keinen Online-Preisvorteil. Platzhirsch gewinnt über Beratung, Montage, Abholung und CH-Lieferung. |

**Preisdruck in Zahlen (Leuchten):**

| Produkt | UVP | Bester gefundener Händlerpreis | Abschlag |
|---|---|---|---|
| Flos Coordinates Pendel | 3.060 € | 2.601 € (Connox AT) [S6] | −15 % |
| Louis Poulsen PH 5 | 1.000–1.020 € | 744,80 € (Connox DE) [S7] | −27 % |
| Flos Bellhop Battery | 300 € | 239,99 € (Connox) [S8] | −20 % |
| Flos Snoopy | 1.250 € | 1.062,50 € (Connox) [S9] | −15 % |
| Marset FollowMe | 209 € | 167 € (Connox) [S10] | −20 % |

[Schätzung] Ist der Händler-EK für Designleuchten rund 50 % unter UVP („Keystone“, in den USA als üblich beschrieben [S11]), bleiben bei −20 % Endpreis nur rund 37 % Rohertrag vor Versand, Retouren und Zahlungsgebühren. Bei −27 % sind es rund 32 %. **Empfehlung: Leuchten zur UVP verkaufen**. Statt Rabatt gibt es Zusatznutzen wie Lichtplanung, Montage in Vbg., Lindau und CH-Rheintal sowie 30 Tage Testen im Showroom.

---

## 3. Fulfillment: Lager, Streckengeschäft, Dropshipping

| Modell | Geeignet für | Belege / Stand |
|---|---|---|
| **Eigenes Kleinlager Lochau** (Kerzen, Akkuleuchten, Accessoires, Bettwäsche) | Schnelldreher bis 30 kg | Mindestmengen sind gering und kapitalschonend. Das ist das Kernmodell für einen Shop mit 150–250 SKUs [Schätzung]. |
| **Streckengeschäft / Hersteller-Direktversand** | Leuchten, Kleinmöbel, Schirme | Ein öffentliches **Dropshipping-Programm** habe ich bei keiner der Marken gefunden. Eichholtz arbeitet als B2B-Großhändler mit eigenen Angaben nach 95 % Lagerverfügbarkeit, Trade-Account über region3@eichholtz.com [S12]. Ob Eichholtz an Endkunden versendet, ist [offen]. |
| **Spedition mit Montage** | Möbel, große Schirme (Umbrosa, Tuuci), Heizer, Kronleuchter | Eigene Montage-Crew als Unterschied zu Pure-Playern, gerade für CH. |
| **Großhandelsplattformen** | Kerzen und Lifestyle von Nischenmarken | Faire (in DE, AT, IT, FR und weiteren EU-Ländern aktiv, 60 Tage Zahlungsziel [S13]) listet z. B. Ester & Erik [S14]. Qogita listet Trudon [S24]. Vor dem Kauf die Autorisierung prüfen. |

---

## 4. Schweiz-Export: MWST, Zoll, DDP

### 4.1 Rechtslage (Kurzfassung)

| Punkt | Inhalt | Quelle |
|---|---|---|
| Zoll | Die Schweiz hat die **Industriezölle zum 1.1.2024 abgeschafft** (Zolltarif-Kapitel 25–97). Möbel und Leuchten (Kap. 94) sind damit zollfrei. Die Zollanmeldung bleibt Pflicht. | [S15] |
| Einfuhrsteuer | **8,1 %** Normalsatz | [S16] |
| Ausfuhr aus AT | Steuerfreie Ausfuhrlieferung mit Netto-Rechnung, Hinweis auf § 6 Abs. 1 UStG und **Ausfuhrnachweis** | [S18] |
| Kleinsendungen | Keine Einfuhrsteuer, wenn die Steuer unter CHF 5 liegt. Ab CHF 100.000 Jahresumsatz mit solchen Kleinsendungen wird der Versandhändler in der Schweiz MWST-pflichtig (Steuervertreter nötig). | [S19] |
| Importieren im eigenen Namen (DDP) | Wer selbst importieren will (DDP), muss sich **unabhängig vom Umsatz mit einer Unterstellungserklärung** der MWST-Pflicht unterstellen. Möbel, die nur zusammengesetzt werden, gelten als Nebenleistung. **Anpassungsarbeiten vor Ort** (z. B. Einbauschrank, Küche) sind Werklieferungen in der Schweiz und ab CHF 100.000 Umsatz steuerpflichtig. | [S20][S21] |
| Geoblocking CH | Seit 1.1.2022 dürfen Schweizer Kunden nicht ohne Zustimmung auf einen anderen Shop umgeleitet werden (Art. 3a UWG). Es gibt aber keine Lieferpflicht in die Schweiz. | [S22] |
| Liechtenstein | Liegt im Schweizer Zoll- und MWST-Gebiet (aus eigener Kenntnis, Zollvertrag; nicht recherchiert). DHL nimmt Liechtenstein von PDDP-CH ausdrücklich aus [S23]. | [S23] |

### 4.2 Rechenbeispiel [Schätzung, eigene Rechnung]

| | AT-Kunde | CH-Kunde (DDP über Platzhirsch) |
|---|---|---|
| Netto-Verkaufspreis | 1.000 € | 1.000 € |
| Steuer | +20 % AT-USt = 200 € | +8,1 % CH-MWST = 81 € |
| Endpreis | **1.200 €** | **1.081 €** (≈ CHF-Preis zum Tageskurs) |

Ein Schweizer Kunde zahlt in Lochau also rund **10 % weniger** als ein Österreicher. Dazu kommt das allgemeine Preisgefälle: Schweizer Onlineshops lagen in der FRC-Erhebung im Schnitt ein Drittel über deutschen und französischen [S17]. Bei Minotti und Poliform gelten Gebietsschutz und Händlerverträge [offen].

### 4.3 Empfehlung

1. **Für Möbel, Küchen und Projekte (Spedition):** Unterstellungserklärung bei der ESTV plus Schweizer Steuervertreter (z. B. Spediteur oder Treuhand in St. Gallen). Platzhirsch importiert selbst, stellt eine CHF-Rechnung mit 8,1 % MWST aus, zieht die Einfuhrsteuer als Vorsteuer ab und montiert. Für Küchen ist das ohnehin nötig (Werklieferung). Werbebotschaft: **„Verzollt, in CHF, mit Montage – ohne Zollformular für Sie.“**
2. **Für Pakete (Kerzen, Akkuleuchten):** DHL Paket International mit PDDP (2 € pro Sendung, die Abgaben werden im Checkout erhoben und über eine „Qualified Party“ abgerechnet) [S23]. Das setzt einen DHL-Geschäftskundenvertrag in DE voraus, über Lindau naheliegend [offen]. Alternativ das PDDP-Produkt der Österreichischen Post („Customs Clearance PDDP in third country“), ob es für CH gilt, ist [offen].
3. **Im Showroom:** Tax-Free für Schweizer Selbstabholer (Ausfuhr im Reiseverkehr; siehe 14, Quelle 40) aktiv bewerben.
4. **Shop-Technik:** Länderweiche im Checkout (AT/DE brutto inkl. 20 % bzw. 19 % (OSS), CH netto + 8,1 %), Preisanzeige in CHF und TWINT als Zahlart (TWINT-Hinweis aus eigener Kenntnis).

---

## 5. Marktplätze

| Plattform | Eignung | Konditionen (belegt) | Empfehlung |
|---|---|---|---|
| **Pamono** (Teil von Chairish) | Ausstellungsstücke, Vintage, Designklassiker | Nur professionelle Verkäufer (Galerien, Shops, Hersteller) [S25]. Provision nicht öffentlich, genannt werden 5–30 % (nicht verifiziert) [S26]. | **Ja**, für Minotti- und ClassiCon-Ausstellungsstücke. Provision bei Pamono direkt anfragen. |
| **1stDibs** | Hochpreisige Einzelstücke | Abo plus Provision, zwei Modelle [S27]. Dritte nennen 12–15 % bis 15–30 % plus ca. 3 % Transaktionsgebühr (nicht verifiziert) [S28]. | Optional, für Stücke über 5.000 € |
| **Vinterior** | Vintage, Ex-Ausstellung | Profi: **17 % bis £2.500, 10 % auf den Anteil darüber**, plus 2–3 % Zahlungsgebühr [S29] | Gut für mittlere Stücke |
| **Deesup** (Mailand) | Pre-loved und Ex-Display-Designmöbel, auch Hersteller-Überbestände | Logistik in Europa übernimmt Deesup. Käufer verhandeln bis −30 % [S30]. Provision [offen]. | **Ja**, starkes Italien-Publikum für Minotti und Poliform |
| **Amazon Luxury Stores** | – | Fashion und Beauty, Home nicht belegt [S31] | **Nein** (Plattformverbote, Markenschaden) |
| **Google Shopping / Preisvergleich** | Kerzen, Accessoires | – | Ja, aber erst wenn Preise im Shop gepflegt sind |

---

## 6. Top-50 Produkte und Produktgruppen für den Shop

Spalten: **Preis** = UVP oder Marktpreis inkl. MwSt. mit Quelle. **Rohertrag** = [Schätzung] in % vom Netto-VK zum UVP-Preis; Basis: üblicher Händler-EK 45–55 % unter UVP bei Designmarken [S11], bei Nischen-Lifestyle eher höher. **Status:** BO = im Backoffice vorhanden, NEU = neue Marke, LEER = Marke angelegt, aber 0 Produkte.

### A. Akku- und Designleuchten (Hotel, Terrasse, Geschenk)

| # | Produkt | Hersteller | Preis | Rohertrag [Schätzung] | Begründung | Status |
|---|---|---|---|---|---|---|
| 1 | Bellhop Battery | Flos | UVP 300 €; 253 € Designville [S8] | 40–45 % zu UVP | Akkuleuchte, Geschenk, Outdoor-Abend, paketfähig | BO |
| 2 | IC Lights T1 Low | Flos | RRP 547,81 € (lights.ie) [S32] | 40–45 % | Ikone, Paket, Cross-Sell zum Sofa | BO |
| 3 | Glo-Ball Pendel / T1 | Flos | UVP 500 € / 505 € [S9] | 40 % | Klassiker, Projekte | BO |
| 4 | Mini Glo-Ball Wand | Flos | 140,25 € (Connox) [S9] | 35–40 % | Einstiegspreis, Bad und Flur | BO |
| 5 | Snoopy | Flos | UVP 1.250 € [S9] | 40 % | Prestigeobjekt, Geschenk | BO |
| 6 | Taccia Small | Flos | ca. 1.000–1.060 € (Connox) [S9] | 40 % | Castiglioni-Klassiker | BO |
| 7 | Coordinates | Flos | UVP 3.060 € [S6] | 35–40 % | Esstisch und Küche, mit Montage | BO |
| 8 | Panthella 160 Portable V3 | Louis Poulsen | UVP 200 € [S33] | 40 % | Akku-Bestseller (Marke regional schon bei reiter) | NEU |
| 9 | Panthella 250 Portable V3 | Louis Poulsen | UVP 365 € [S33] | 40 % | wie oben | NEU |
| 10 | PH 5 | Louis Poulsen | UVP 1.000–1.020 € [S7] | ≤ 30 % bei Marktpreis | Nur mit Lichtplanung; online −27 % | NEU (niedrige Priorität) |
| 11 | FollowMe | Marset | UVP 209 € [S10] | 40–45 % | Outdoor-tauglicher Akku, Gastro und Hotel | NEU |
| 12 | Cestita Batería | Santa & Cole | £735 (UK) [S34]; EUR-Preis prüfen | 40–45 % | Miguel-Milà-Klassiker, kaum am Bodensee | NEU |
| 13 | Flowerpot VP9 | &Tradition | ab 186,99 € (Preisvergleich) [S35] | 35 % | Bestseller, aber regional verbreitet | NEU (optional) |
| 14 | Melt Portable | Tom Dixon | Large: 1.308 € Listenpreis (FDS) [S36] | 40–45 % | Marke angelegt, sofort pflegen | LEER |
| 15 | Kronleuchter-Kollektionen (z. B. Pendel, Wandleuchten) | Brand van Egmond | Preis prüfen | 45–50 % | Handarbeit, kaum Preisvergleich, Montage | BO |
| 16 | Designleuchten | Quasar | Preis prüfen | 45 % | Statement-Leuchten für Projekte | BO |
| 17 | Leuchten (Tisch, Pendel) | 101 Copenhagen | Preis prüfen | 45–50 % | Japandi-Look, wenig online-transparent | BO |
| 18 | Leuchten (Tisch, Steh) | Eichholtz | Preis prüfen | 45–50 % | Lager beim Hersteller [S12] | BO |

### B. Kerzen, Duft, Feuer

| # | Produkt | Hersteller | Preis | Rohertrag [Schätzung] | Begründung | Status |
|---|---|---|---|---|---|---|
| 19 | Duftkerze Aurum (9 cm) | Baobab Collection | 59,99 € (Breuninger) [S37] | 50 % | Einstieg, Geschenk, Q4 | BO |
| 20 | Duftkerze Vony Kopelika (Glas) | Baobab Collection | ab 116,99 € [S37] | 50 % | Mittelklasse-Geschenk | BO |
| 21 | Feathers MAX16 | Baobab Collection | 131,99 € [S37] | 50 % | Größeres Format, Hingucker | BO |
| 22 | Großformat 24 cm (z. B. Encre de Chine) | Baobab Collection | 244,99 € [S37] | 50 % | Signature-Objekt für Showroom und Hotel-Lobby | BO |
| 23 | Duft-Nachfüller und Diffusoren | Baobab Collection | Preis prüfen | 50–55 % | Wiederkauf, Abo-Fähigkeit | BO/erweitern |
| 24 | Duftkerze 270 g | Trudon | ca. 100–120 € (Marktpreise) [S38] | 45–50 % | Älteste Kerzenmanufaktur, Pariser Luxus, passt zu Treca Paris | NEU |
| 25 | Duftkerze 190 g | Diptyque | 65 € (AT) / CHF 83 (CH) [S39] | 40–45 % | Bekannteste Luxuskerze; Vertrieb selektiv [offen] | NEU (schwierig) |
| 26 | Kerzen und Kerzenhalter | Ester & Erik | Preis prüfen; Faire-Listung [S14] | 50 % | Dänische Manufaktur, farbige Stab- und Stumpenkerzen, ideal für Tischdeko | NEU |
| 27 | Spin 120 Tischfeuer + Nachfülldosen | höfats | UVP 139 €; Dose ab 19,42 € [S40] | 40–45 % | Allgäuer Marke (Kempten), Terrasse, Nachkauf | NEU |
| 28 | Feuerringe (Grill und Skulptur) | Feuerring (CH) | kein öffentlicher Preis [S41] | 35–40 % | Schweizer Ikone, Statusobjekt für CH-Kunden | NEU |
| 29 | Grill BBQ 100/200/300 | Röshults (SE) | älterer US-Preis $2.660 (200er) [S42]; EUR prüfen | 35–40 % | Design-Outdoorküche, passt zu Paola Lenti und Tuuci | NEU |

### C. Accessoires und Wohnobjekte

| # | Produkt | Hersteller | Preis | Rohertrag [Schätzung] | Begründung | Status |
|---|---|---|---|---|---|---|
| 30 | Ikebana Vase S / L | Fritz Hansen | UVP 119 € / 219 € [S43] | 40–45 % | Jaime-Hayón-Geschenk, Paket | NEU |
| 31 | Treteimer 13/14/15 | Vipp | ab 265 / 285 / 355 € [S44] | 40 % | Design-Küchenzubehör, Cross-Sell zu Küchenprojekten | NEU |
| 32 | Deko-Objekte, Vasen, Schalen | 101 Copenhagen | Preis prüfen | 50 % | 20 Deko-Artikel im BO | BO |
| 33 | Spiegel und Accessoires | Eichholtz | Preis prüfen | 45–50 % | 8 Spiegel, Lager beim Hersteller | BO |
| 34 | Decor-Objekte und Küchenaccessoires | Minotti | Preis prüfen | [offen] | 24 Deko, 4 Küchenaccessoires; Online-Freigabe klären | BO |
| 35 | Spiegel, Deko, Teppiche | ClassiCon | Preis prüfen | 40–45 % | 7 Spiegel, 6 Deko, 14 Teppiche | BO |
| 36 | Teller, Vasen, Kissen | Fornasetti | Preis prüfen | 45–50 % | Mailänder Ikone, seit 2025 Mehrheitseigner Oakley Capital, Vertrieb über Distributoren [S45] | NEU |
| 37 | Leuchten- und Wohnobjekte | Qeeboo | Preis prüfen | 45 % | Marke angelegt, verspielter Luxus | LEER |
| 38 | Bettwäsche, Plaids | Alonpi (IT) | Preis prüfen | 50 % | 20 Bettwäsche-Artikel im BO; Kaschmir, Geschenk | BO |
| 39 | Topper, Bettwäsche | Treca Paris | Preis prüfen | 40–45 % | Nachkauf nach Bettenkauf, in Vbg. exklusiv (03) | BO |
| 40 | Geschenkgutscheine (Wert und Erlebnis) | Platzhirsch | frei | ≈ Marge der Einlösung, plus Liquidität | Q4-Umsatz, Neukunden (06) | NEU (Eigenprodukt) |

### D. Kleinmöbel und Outdoor-Zubehör

| # | Produkt | Hersteller | Preis | Rohertrag [Schätzung] | Begründung | Status |
|---|---|---|---|---|---|---|
| 41 | Bell Side Table (Messing/Stahl) | ClassiCon | 2.490 € (AmbienteDirect) [S46] | 40 % | Herkner-Ikone, paketfähig, Geschenk | BO |
| 42 | Beistelltische (Auswahl) | Minotti | „Preis ab“, Preis prüfen | [offen] | 85 Beistelltische im BO; Einstieg in die Marke | BO |
| 43 | Beistell- und Couchtische | Desalto | Preis prüfen | 40 % | 50 Produkte im BO, auch Outdoor | BO |
| 44 | Luxembourg Stuhl / 4er-Set | Fermob | 270 € / 4er UVP 1.076 € [S47] | 35–40 % | Farbig, stapelbar, Balkon und Gastro | NEU |
| 45 | Sonnenschirme Paraflex, Ezpeleta, Eclipsum | Umbrosa | Preis prüfen | 40 % | 16 Modelle im BO; mit Sockel, Hülle, Montage | BO |
| 46 | Schirmzubehör (Sockel, Hüllen, Beleuchtung) | Umbrosa / Tuuci | Preis prüfen | 45–50 % | Nachkauf, kein Preisvergleich | BO/erweitern |
| 47 | Heizstrahler | Heatsail | Preis prüfen | 40 % | 12 Modelle, saisonal (Sep.–Nov., März–Mai) | BO |
| 48 | Outdoor-Kissen, Hocker, Pouf | Solpuri / Sifas / Paola Lenti | Preis prüfen | 40–45 % | Ergänzung zu Lounge-Projekten | BO |

### E. Ausstellungsstücke und Abverkauf

| # | Produkt | Hersteller | Preis | Rohertrag [Schätzung] | Begründung | Status |
|---|---|---|---|---|---|---|
| 49 | Ausstellungsstücke Sofa, Tisch, Sessel | Minotti, Poliform, Rimadesio, ClassiCon | Eigenpreis (−20 bis −40 %) | 15–30 % | Einzelstücke, kein Preisvergleich, SEO „Minotti Ausstellungsstück“; zusätzlich Pamono und Deesup | BO (Flag fehlt) |
| 50 | Ausstellungsleuchten | Flos, Brand van Egmond | Eigenpreis | 20–30 % | Platz für neue Kollektionen | BO (Flag fehlt) |

**Sortimentsregel [Schätzung]:** Zum Start 150–250 SKUs. Davon rund 40 % Kerzen, Accessoires und Bettwäsche (Marge), 30 % Leuchten (Reichweite, zur UVP), 20 % Outdoor-Zubehör (saisonal) und 10 % Ausstellungsstücke (Dringlichkeit).

---

## 7. Neue Hersteller zum Ansprechen

Priorität: **A** = sofort, passt zur Positionierung, kaum regionale Konkurrenz · **B** = sinnvoll, aber regional schon vertreten · **C** = Prüfauftrag.

| Prio | Hersteller | Warum | Ansprechweg | Regionale Konkurrenz (aus 03/04) |
|---|---|---|---|---|
| A | **Audo Copenhagen** (ex Menu + By Lassen) | Accessoires, Leuchten, Kleinmöbel. **Gehört zur Flos B&B Italia Group** [S48] | Über den **bestehenden Flos-Gebietsvertreter** anfragen, das ist der kürzeste Weg | Menu bei reiter design (03) |
| A | **Trudon** | Pariser Luxuskerzen, passend zu Treca Paris; selektiver Vertrieb [S24] | trudon.com, Kontakt „Wholesale/Stockist“; **nicht** über Qogita kaufen, wenn die Autorisierung fehlt | nicht gefunden |
| A | **Santa & Cole** | Spanische Leuchtenklassiker (Cestita Batería) [S34] | santacole.com, Bereich Distribution/Kontakt; DACH-Agentur erfragen | nicht gefunden |
| A | **Marset** | Akku- und Outdoorleuchten (FollowMe) für Hotel und Terrasse [S10] | marset.com, „Where to buy / Contact“, DACH-Agentur | nicht gefunden |
| A | **Feuerring** (CH) | Schweizer Statusobjekt, ideal für das CH-Geschäft [S41] | feuerring.ch, Händleranfrage; smow führt die Marke bereits [S41] | smow (Konstanz) |
| A | **höfats** (Kempten) | Feuerobjekte und Grills, Nachkaufartikel [S40] | Ausstellerprofil auf der Messe Ambiente Frankfurt [S49]; hoefats.com Händlerkontakt | einrichten-design (online) |
| A | **Ester & Erik** | Dänische Kerzen, Tischdeko, geringe Mindestmengen [S14] | Faire-Brand-Seite [S14] oder direkt beim Hersteller | nicht gefunden |
| A | **Fornasetti** | Ikonische Accessoires, starkes Geschenk-Segment [S45] | fornasetti.com Kontakt; Vertrieb über Distributoren in IT und im Ausland [S45] | nicht gefunden |
| B | **Louis Poulsen** | Akkuleuchten Panthella, PH-Serie [S7][S33] | Händlerlocator auf louispoulsen.com, Area Sales Manager DACH [S50] | reiter design, Staehlin |
| B | **Fritz Hansen** | Ikebana und Accessoires [S43] | fritzhansen.com, Retail-Kontakt | M-Studio Reiter (03) |
| B | **Vipp** | Küchen- und Badaccessoires, Cross-Sell zu Küchen [S44] | vipp.com, Retailer-Anfrage | nicht gefunden |
| B | **Fermob** | Bunte Outdoor-Stühle für Balkon und Gastro [S47] | fermob.com, Händler werden, AT-Agentur | nicht gefunden |
| B | **Röshults** | Design-Grills [S42] | roshults.com, Dealer-Kontakt | nicht gefunden |
| B | **Eichholtz (ausbauen)** | Trade-Account, Endkunden-Direktversand klären [S12] | region3@eichholtz.com [S12] | – |
| C | **Diptyque** | Bekannteste Luxuskerze, aber eigene Boutiquen und Parfümerien [S39] | diptyqueparis.com, Corporate/Wholesale | Parfümerien |
| C | **&Tradition** | Flowerpot VP9 [S35] | andtradition.com | reiter design |
| – | **Tom Dixon, Qeeboo, Gloster (bestehend)** | Marken angelegt, 0 Produkte (01) | Daten beim bestehenden Kontakt anfordern | – |

**Messen für Erstgespräche** (Termine aus eigener Kenntnis, bitte prüfen): Ambiente Frankfurt (Februar, Kerzen, Accessoires, höfats), Maison&Objet Paris (Januar und September, Trudon, Fornasetti, Baobab), Salone del Mobile / Euroluce Mailand (April, Leuchten, Marset, Santa & Cole, Flos-Gruppe).

**Anfrage-Vorlage (Kernargumente):** Showroom mit Minotti, Poliform, Rimadesio und Flos im Dreiländereck · Kundschaft aus AT, DE (Lindau, Allgäu), CH (St. Gallen, Rheintal) und FL · Shop mit UVP-Treue und ohne Plattformverkauf · Objektgeschäft (Hotels, Bauträger, 05) · gewünscht: Preisliste, Händlerrabatt, Mindestbestellwert, Online-Freigabe, Gebietsschutz, Bildrechte, Direktversand.

---

## 8. Umsetzung im Code (Vorschlag)

1. **Frappe-Doctype „Produkte New“ erweitern:** `shop_freigabe` (Bool), `preis_uvp_eur`, `preis_chf`, `lagerbestand`, `lieferzeit_tage`, `versandklasse` (Paket / Sperrgut / Spedition mit Montage), `gewicht_kg`, `ausstellungsstueck` (Bool) plus `abverkaufspreis`, `hs_code` (für DDP), `ursprungsland`.
2. **`toShopProduct()` erweitern** (`src/lib/shop/shopProducts.js`) und Preise nur bei `shop_freigabe` zeigen. Alle anderen Produkte behalten „Anfrage“.
3. **Hybrid-Warenkorb:** In `CartPage.js` die Positionen trennen in „Sofort kaufen“ (freigegeben, Checkout) und „Anfrage“ (bestehender Weg über `AnfrageFormProduct`).
4. **Checkout:** Stripe oder ein Payment-Provider mit Klarna, Kreditkarte, EPS (AT) und TWINT (CH) [Zahlarten aus eigener Kenntnis]. Ländersteuer AT/DE (OSS)/CH. Versandregeln je Versandklasse.
5. **Pflichtseiten:** AGB, Widerrufsbelehrung, Versand und Zahlung, Preisangaben nach Preisauszeichnungsrecht (Rabatte mit dem niedrigsten Preis der letzten 30 Tage, siehe IHK [S51]).
6. **Outlet-Kategorie** `/produkte/ausstellungsstuecke` mit Reservierung gegen Anzahlung (06, Maßnahme 5).

---

## 9. Umsatzpotenzial des Shops [Schätzung]

| Baustein | Annahme | Umsatz/Jahr |
|---|---|---|
| Kerzen, Accessoires, Bettwäsche | 1.500 Bestellungen × 150 € | 0,23 Mio € |
| Leuchten (zur UVP, mit Beratung) | 300 × 600 € | 0,18 Mio € |
| Outdoor-Zubehör, Heizer, Feuer | 150 × 900 € | 0,14 Mio € |
| Ausstellungsstücke (Shop + Marktplätze) | 40 × 5.000 € | 0,20 Mio € |
| Gutscheine | Q4-Schwerpunkt | 0,05–0,1 Mio € |
| **Summe Jahr 1–2** | | **≈ 0,8 Mio € (Spanne 0,5–1,0 Mio €)** |

Das ist eine Größenordnung von **rund 5–8 % des 1-Mio-€/Monat-Ziels**. Das deckt sich mit 06 (Shop als Verstärker, nicht als Treiber). Der eigentliche Hebel ist der **CH-DDP-Service mit Montage** für Möbel und Küchen, der weit über den Shop hinaus wirkt. Bei Rohertrag ~40 % ergibt der Shop rund 0,3 Mio € Deckungsbeitrag vor Personal (eine Teilzeitstelle Shop und Versand) und Marketing.

---

## Quellen

- [S1] IT-Recht Kanzlei – Selektive Vertriebssysteme: https://www.it-recht-kanzlei.de/Thema/selektive-vertriebssysteme.html ; MTR Legal Wiki: https://www.mtrlegal.com/wiki/selektive-vertriebssysteme/
- [S2] CMS – Die 10 wichtigsten Themen des neuen EU-Vertriebskartellrechts: https://cms.law/de/aut/legal-updates/die-10-wichtigsten-themen-des-neuen-eu-vertriebskartellrechts-vertikal-gvo-vertikal-leitlinien ; Heuking: https://www.heuking.de/de/news-events/newsletter-fachbeitraege/artikel/neue-vertikal-gvo-und-leitlinien-was-bleibt-was-aendert-sich.html ; Taylor Wessing: https://www.taylorwessing.com/de/insights-and-events/insights/2022/06/die-neue-vertikal-gvo
- [S3] Betriebs-Berater zu Coty: https://betriebs-berater.ruw.de/wirtschaftsrecht/nachrichten/Auf-den-Vertrieb-von-Luxuswaren-gerichtete-selektive-Vertriebssysteme-fallen-nicht-generell-unter-das-Kartellverbot--33295
- [S4] Flos Online-Store DE: https://flos.com/de/de/
- [S5] Vitra Impressum (Onlineshop CH): https://vitra.com/en-ch/imprint
- [S6] Connox AT – Flos Coordinates: https://www.connox.at/products/flos-coordinates-led-pendelleuchte
- [S7] Connox DE / AmbienteDirect – Louis Poulsen PH 5: https://www.connox.de/collections/louis-poulsen-pendelleuchten ; https://www.ambientedirect.com/louis-poulsen/ph-5-pendelleuchte_pid_532_1218.html
- [S8] Designville – Bellhop Battery: https://www.designville.eu/bellhop-battery-table-lamp-white ; Connox: https://connox.com/categories/lighting/table-lamps/flos-bellhop-led-table-lamp.html
- [S9] Connox – Snoopy / Glo-Ball: https://www.connox.de/products/flos-snoopy-tischleuchte ; https://www.connox.de/products/flos-glo-ball-wand-und-deckenleuchte ; AmbienteDirect Flos Tischleuchten: https://www.ambientedirect.com/hersteller/flos/tischleuchten
- [S10] Connox – Marset FollowMe: https://connox.com/categories/lighting/table-lamps/marset-followme-outdoor-battery-led-table-lamp.html
- [S11] Core77 – typical retail markup furniture/lighting: https://boards.core77.com/t/typical-retail-markup-for-furniture-lighting/27695 ; eightx – Home goods pricing: https://eightx.co/blog/home-goods-brand-pricing-strategy
- [S12] BIID – Eichholtz BV (Trade Account): https://biid.org.uk/users/eichholtz-bv
- [S13] Retail TouchPoints – Faire Europe: https://www.retailtouchpoints.com/news/wholesale-marketplace-faire-expands-into-europe/79505/
- [S14] Faire – Ester & Erik: https://www.faire.com/brand/b_45gakqukkz
- [S15] IHK Karlsruhe – Aufhebung der Industriezölle: https://www.ihk.de/karlsruhe/fachthemen/international/aktuelles/schweiz-aufhebung-der-industriezoelle-5914196 ; Forvis Mazars: https://www.forvismazars.com/ch/de/services/steuern/mehrwertsteuern/aufhebung-der-industriezoelle
- [S16] Vischer/IHK – Die Mehrwertsteuer der Schweiz (8,1 %): https://www.vischer.com/fileadmin/uploads/vischer/Documents/Publications_Presentations/29.06.2021_Nadia_Tarolli_Schmidt_Eric_Fl%C3%BCckiger_IHK_Die_Mehrwertsteuer_der_Schweiz.pdf
- [S17] FRC-Erhebung und IKEA-Beispiel, zitiert in: SRF – Hochpreisinsel Schweiz: https://www.srf.ch/news/schweiz/hochpreisinsel-der-schweiz-zuschlag-ist-oft-nicht-gerechtfertigt ; swissinfo: https://www.swissinfo.ch/ger/business/grenzueberschreitendes-einkaufen_was-tun-wenn-die-schweizer-preise-zum-heulen-sind/43393436 (welcher der beiden Artikel die FRC-Zahl enthält, ist nicht eindeutig zugeordnet; Erhebungsjahr älter)
- [S18] WKO Exporthandbuch – Warenlieferungen Schweiz: https://www.wko.at/aussenwirtschaft/exporthandbuch/warenlieferungen-schweiz
- [S19] ESTV – Versandhandel und Plattformbesteuerung: https://www.estv.admin.ch/de/mwst-versandhandel-und-plattformbesteuerung
- [S20] IHK – Schweizer Mehrwertsteuer (Merkblatt 2025/2026): https://www.ihk.de/blueprint/servlet/resource/blob/6952624/415a2f67fa31d7190d93fe7b892baaee/een-mwst-merkblatt-2026-neu-data.pdf
- [S21] WEKA – Montagelieferung in die Schweiz: https://www.weka.ch/themen/finanzen-controlling/mehrwertsteuer/mwst-international/article/montagelieferung-korrekte-versteuerung-von-lieferungen-in-die-schweiz/
- [S22] CMS – Relative Marktmacht und Geoblocking CH: https://cms.law/de/che/legal-updates/Die-Schweiz-fuehrt-das-Konzept-der-relativen-Marktmacht-ein-und-beschraenkt-Geoblocking2
- [S23] DHL – Postal Delivered Duty Paid: https://www.dhl.de/de/geschaeftskunden/paket/leistungen-und-services/internationaler-versand/paket-international/postal-delivered-duty-paid.html ; Österreichische Post – Parcel International PDDP: https://assets.post.at/en/g/c/parcel-international-pddp
- [S24] Qogita – Trudon: https://www.qogita.com/brands/trudon/
- [S25] Pamono Hilfe: https://www.pamono.eu/help ; Kontakt: https://www.pamono.com/contact/
- [S26] Ronati Marketplace Guide 2021: https://www.coastalcommunities.co.uk/content_uploads/_wp-content_uploads_2022_03_Ronati-Marketplace-Guide-2020-38.pdf ; Trustpilot: https://www.trustpilot.com/review/www.pamono.com
- [S27] 1stDibs Support – Monthly Fee: https://support.1stdibs.com/hc/en-us/articles/17416136155291-What-Is-the-Monthly-Fee-for-1stDibs
- [S28] Monde Singulier – 1stDibs vs: https://www.monde-singulier.com/en/stories/1stdibs-vs-monde-singulier ; estimonia: https://estimonia.com/directory/1stdibs
- [S29] Vinterior – Commission: https://sellersupport.vinterior.co/en/articles/543350-vinterior-commission ; https://help.vinterior.co/en/articles/534105-how-can-i-sell-as-a-professional-dealer-on-vinterior
- [S30] Deesup Magazine: https://magazine.deesup.com/en/where-to-sell-ex-display-furniture-online/ ; Preqin: https://www.preqin.com/data/profile/asset/deesup/455515
- [S31] RetailDetail – Amazon Luxury Stores Europe: https://www.retaildetail.eu/en/news/fashion/amazon-brings-luxury-stores-europe
- [S32] lights.ie – Flos IC T1 Low: https://www.lights.ie/p/flos-ic-t1-low-designer-table-lamp-brass-plated-3510295.html ; Royal Design: https://royaldesign.com/eu/ic-lights-t1-table-lamp-low
- [S33] AmbienteDirect – Panthella 250 Portable V3: https://www.ambientedirect.com/louis-poulsen/panthella-250-portable-v3-akku-led-tischleuchte_pid_6_1387517.html ; Panthella 160 V3: https://www.ambientedirect.com/en/louis-poulsen/panthella-160-portable-v3-led-table-lamp-with-battery_pid_1383351.html
- [S34] Lampmasters – Cestita Batería: https://lampmasters.co.uk/p/cestita-bateria-portable-table-lamp-wood-white-opal-glass-santa-cole-70019832.html ; Datenblatt: https://www.santacole.com/recursos/productos/downloads/pdf_espec_tecnicas/SC_CestitaBateria_data_sheet_v5.pdf
- [S35] Preissuchmaschine – Flowerpot VP9: https://www.preissuchmaschine.de/preisvergleich/tradition-flowerpot-vp9-tischleuchte-500000900112.html
- [S36] Finnish Design Shop – Melt Portable Large: https://www.finnishdesignshop.com/en-ch/product/melt-portable-lamp-large-silver-black
- [S37] Breuninger – Baobab Collection: https://www.breuninger.com/at/marken/baobab-collection/
- [S38] eBay-Listings Trudon 270 g (Marktpreise, keine UVP): https://www.ebay.de/itm/186911598084
- [S39] Kaufland AT – Diptyque Baies 190 g: https://www.kaufland.at/product/351853026/ ; 24S CH: https://www.24s.com/en-ch/baies-candle-190-g-diptyque_DIPW3779
- [S40] Dealdoktor – höfats Fire Friday: https://www.dealdoktor.de/hoefats-fire-friday ; Preissuchmaschine: https://www.preissuchmaschine.de/preisvergleich/hoefats-spin-erhoehung-1200-standerhoehung-500000297029.html
- [S41] Architonic – Feuerring: https://www.architonic.com/en/b/feuerring/3104677 ; smow – Feuerring: https://www.smow.com/feuerring
- [S42] Gardenista – Röshults: https://gardenista.com/posts/the-worlds-most-elegant-outdoor-grill ; Stylepark: https://www.stylepark.com/de/roeshults/bbq-grill-200gas
- [S43] AmbienteDirect – Fritz Hansen Ikebana: https://www.ambientedirect.com/en/brands/fritz-hansen/fritz-hansen-ikebana
- [S44] AmbienteDirect – Vipp Bin: https://www.ambientedirect.com/en/brands/vipp/vipp-bin ; Connox: https://www.connox.at/products/vipp-14-treteimer
- [S45] Oakley Capital – Fornasetti: https://www.oakleycapital.com/our-companies/fornasetti
- [S46] AmbienteDirect – ClassiCon Bell Side Table: https://www.ambientedirect.com/classicon/bell-side-table-beistelltisch-messing_pid_14778_169859.html
- [S47] AmbienteDirect – Fermob Luxembourg: https://www.ambientedirect.com/fermob/luxembourg-gartenstuhl-stapelbar_pid_635_2834.html ; 4er-Set: https://www.ambientedirect.com/en/fermob/luxembourg-garden-chair-set-of-4_pid_1372967.html
- [S48] Finnish Design Shop – Audo Copenhagen (Teil der Flos B&B Italia Group): https://www.finnishdesignshop.com/en-lu/manufacturer/audo-copenhagen
- [S49] Messe Frankfurt Ambiente – höfats GmbH: https://conzoom-solutions.messefrankfurt.com/frankfurt/en/market-directory.detail.html/AMBIENTE/hoefats-gmbh.html
- [S50] Jobbank – Louis Poulsen Area Sales Manager: https://jobbank.dk/job/3114231/louis-poulsen-as/area-sales-manager-residential-in-italy/
- [S51] IHK Bremen – Preisauszeichnung und Rabattkennzeichnung: https://www.ihk.de/bremen-bremerhaven/branchen/handel/preisauszeichnung-rabattkennzeichnung-einzelhandel-6112334
- Backoffice-Zählung: `platzhirsch_studio...produkte_new.api.get_produkte_by_marke_api` und `marken.api.marken_data` auf backoffice.platzhirsch.studio, abgerufen 26.10.2026
