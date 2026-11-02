# Wachstumsrat: Up- und Cross-Selling (Kürzel `cross-upsell`)

**Gremium:** Up- und Cross-Selling, Empfehlungssysteme, Angebotsgestaltung · **Stand:** 28.10.2026 · **Status:** Gutachten, am Code wurde nichts geändert, kein Formular abgeschickt.

**Grundlagen:** 23 (Masterkonzept, G8 Add-ons, G10 Service, Margenprogramm), **wachstum/10-cross-upselling.md** (Komplettierungs-Matrix, Datenmodell, Recht, Angebotsvorlage – gilt weiter, dieses Gutachten baut darauf auf und ersetzt es nicht), wachstum/11-pricing.md (Honorarstufen, Rabattmatrix), wachstum/14 (Aftersales, Pflege-Pass), 10 (Zubehör, Kerzen), 30 (Outdoor), digital/features/ezarri-analyse.md, wachstumsrat/hotel-contract.md, inhaber-entscheidungen.md (Nr. 3, 7, 8, 9).
Code (nur gelesen): `src/app/[locale]/produkte/[category]/[product]/page.js`, `src/lib/api/fetchAllProdukte.js`, `src/lib/shop/shopProducts.js`, `src/lib/marken/collectionPage.js`, `src/components/CartPage/CartPage.js`, `src/components/ShopCatalog/builtToStay.js`, `src/components/Labs/Sofaplaner/*`, `src/components/Labs/Kuechenplaner/*`, `src/app/[locale]/portal/pass/*`, `src/lib/commerce/priceRules.js`, `src/lib/analytics.js`, `tests/unit/r4-produkt.test.mjs` (Liste der 31 Live-Kategorien), `src/messages/de.json`.
Live geprüft: `localhost:3000/de/produkte` (Katalog-Hub, Zählungen) und `/de/produkte/rugs` (24 Teppiche). Die Screenshots über `tools/qa/shoot.mjs` sind wegen Überlast des Dev-Servers durch parallele Workflows abgebrochen (Timeout 120 s, `qa-screenshots/wachstumsrat/cross-upsell/report.json`). Die Befunde zum Seitenaufbau stammen daher aus dem Code.

**Regeln für alle Texte unten:** Händler-Aussagen nur für **ClassiCon** und **Ezarri**. Keine Superlative, keine Preise auf der Website, solange der Inhaber Preise nicht freigegeben hat (Ausnahmen: Atelierverkauf mit `priceRules.js`, Binni nach Freigabe). Lieferung und Montage heißen „auf Wunsch“ bzw. „auf Anfrage“ (Entscheidung Nr. 3). **[Schätzung]** steht für eine eigene Herleitung, **[Faustregel]** für eine übliche Planungsregel, die der Planer im Einzelfall prüft, **[prüfen]** für etwas, das vor der Veröffentlichung belegt werden muss.

---

## 1. Urteil zum Ist-Stand

| Bereich | Note (1–10) | Begründung |
|---|---|---|
| Cross-Selling auf der Produktseite | **2** | Der einzige Empfehlungsblock „Das könnte Ihnen auch gefallen“ ruft `related_products` mit **gleicher Marke und gleicher Kategorie** ab, `limit = 3` (`fetchAllProdukte.js` Z. 121). Zum Minotti-Sofa erscheinen also drei andere Minotti-Sofas. Das sind Alternativen, keine Ergänzungen. Der Kollektions-Slider darunter zeigt Kollektionen der Marke und nicht die Couchtische oder Sessel derselben Familie. |
| Service-Upsell | **3** | „Ein Stück für viele Jahre“ (`BuiltToStay`) erzählt von Bezügen, Ersatzteilen und Pflege. Man kann aber nichts davon wählen oder merken. Lieferung und Montage stehen nur als Faktzeile da. Der Text `atelier.deliveryValue` („Lieferung und Montage in Österreich …“) weicht zudem von der Inhaber-Formel „auf Wunsch“ ab [prüfen, Texte-Team]. |
| Planungsleistung als Upsell | **3** | Es gibt „Planungsdaten anfragen“ und „Beratung anfragen“, aber keine sichtbare Stufung (Raumkonzept → Handzeichnung + Modell → Gesamtplanung). Die Stufen sind in wachstum/11 §9.2 ausgearbeitet, aber nirgends auf der Seite. Der Kern-USP (Handzeichnung, Mini-Modell, Tage vor Ort, Entscheidung Nr. 8) ist das stärkste Upsell-Argument und wird heute nicht als Stufe angeboten. |
| Merkliste („Ihre Auswahl“) | **3** | Gute Anfrage-Strecke (Anfrage oder Showroom-Termin, R4). Es fehlt der Hinweis „Für Ihren Raum fehlt noch …“, und es fehlt „ganze Kollektion/ganzen Look merken“ (die Kollektionskarten merken schon alle Stücke, das Prinzip ist im Code vorhanden). |
| Planer (Sofa, Küche, Stil-Finder) | **3** | Die Planer enden mit Merkliste oder Anfrage. Dabei kennen sie Maße und Stil des Kunden. Daraus ließen sich Teppichgröße, Couchtisch, Barhocker-Zahl und Pendelleuchten ableiten. Das passiert heute nicht. |
| Katalog als Datenbasis | **7** | Es gibt genug Ergänzungsware: Leuchten (Gruppe „Licht“ 334), Wohnaccessoires 165, Deko 54, Teppiche 24, Kerzen 24, Spiegel, Bettwäsche, Sonnenschirme, Heizstrahler 12 (Hub-Zählung vom 28.10.). Die Felder `marken`, `kategories`, `sub_kategorie`, `colorKeys`, `materialKeys`, `indoor_and_outdoor` und die Kollektionen je Marke sind vorhanden. Damit reicht es für eine regelbasierte Logik ohne neue Backoffice-Felder. |
| **Gesamt** | **3/10** | Das Sortiment ist da, die Logik fehlt. Mit den Bausteinen aus Abschnitt 3 sind ohne Backoffice-Umbau **7/10 in 2–3 Wochen** Code-Arbeit erreichbar [Schätzung]. |

---

## 2. Befunde und Chancen

1. **Die Ergänzungsware liegt schon im Katalog.** Die Regeltabelle in wachstum/10 §4.4 nutzt Schlüssel, die es nicht gibt („floor lamps“, „hanging lamps“, „stools“, „bookcases“). Die echten 31 Slugs (Testliste `r4-produkt.test.mjs`) kennen **eine** Leuchten-Kategorie `lamps`. Steh-, Pendel- und Tischleuchte trennt nur `sub_kategorie` [prüfen: welche Werte dort gepflegt sind]. Die Regeltabelle in 3.1 ist deshalb auf die echten Slugs umgestellt.
2. **Substitute und Ergänzungen sind zwei verschiedene Module.** Wer ein Sofa ansieht, braucht beides: „Ähnliche Modelle“ (vergleichen) und „Komplettieren Sie den Raum“ (zusammenstellen). Heute gibt es nur das erste, und es trägt den Titel des zweiten.
3. **Online gibt es keine Preise. Das Ziel ist deshalb eine größere Merkliste, nicht ein größerer Warenkorb.** Messbar wird das über *Positionen und Kategorien je Anfrage*. Eine Anfrage mit Sofa, Teppich und Leuchte wird im Showroom zum Angebot mit Optionsblock (wachstum/10 §5). Dort entsteht der Umsatz.
4. **Die Planer sind die stärksten Upsell-Orte.** Sie kennen Maße. Eine Empfehlung wie „Für Ihre Sofagruppe (312 × 196 cm) passt ein Teppich ab ca. 300 × 250 cm“ ist Beratung und kein Verkaufsdruck. Das kann kein Online-Händler der Region so [prüfen per Wettbewerbsscan, Gremium Konkurrenzanalyse].
5. **Brücken zwischen den Geschäftsfeldern sind der größte Hebel für den Auftragswert.** Wer ein Outdoor-Sofa merkt, bekommt Pool (Ezarri, Vertragshändler) und Outdoor-Konzept angeboten. Bei Küche sind es Ess-Ecke, Barhocker und Licht, beim Bett Bettwäsche und der Ankleide-Schrank. Wer ein Hotel anfragt, bekommt alles. Die Website verlinkt die Felder heute nur über das Menü.
6. **Die Planungsleistung ist das Premium-Produkt.** Eine Stufe „Konzept mit Handzeichnung und Mini-Modell“ verkauft den USP und filtert Unentschlossene. Durch die Anrechnung wird sie zum Abschlussverstärker (wachstum/11 §9).
7. **Nach dem Kauf beginnt der Wiederkauf.** Der Portal-Produktpass (`/portal/pass`) kennt jedes gekaufte Stück mit Material. Das ist der richtige Ort für Pflege-Nachkauf, Outdoor-Hüllen im Oktober und „Passt zu Ihrem Sofa“ (nur Katalogdaten, Bestandskunde, siehe Recht 3.8).
8. **Ezarri hat ein eingebautes Zubehör-Upsell.** Schon Ezarris eigenes Angebotsformular fragt nach Kleber und Fuge, Corner & Cove sowie Werkzeug (ezarri-analyse.md §1.3). Ezarri empfiehlt Kleber mindestens C2TE und Epoxid-Fugen der Klasse RG [Quelle Q2]. Unser Konfigurator kann daraus einen Materialrechner mit Zubehörliste machen.

---

## 3. Fertige Bausteine

### 3.1 Empfehlungsregeln: Kategorie → Ergänzungen (auf die 31 Live-Slugs)

Rollen: **E** = Ergänzung (Cross-Sell), **U** = Aufwertung (Upsell), **S** = Service, **P** = Planungsleistung, **B** = Brücke in ein anderes Geschäftsfeld. Die Ziffer ist die Priorität (1 = zuerst). Pro Zielkategorie erscheint höchstens **eine** Karte.

| Quelle (Slug) | Ergänzungen E (Prio) | Service S | Planung P / Brücke B | Begründung auf der Karte (DE, max. 60 Zeichen) |
|---|---|---|---|---|
| `sofas-couches` | coffee-tables (1), rugs (2), lamps [sub: Steh-/Leseleuchte] (3), side-tables (4), armchairs-stools (5), decor [Kissen/Plaids, falls gepflegt] (6) | Lieferung & Montage, Pflege Stoff/Leder | P: Raumkonzept · B: Sofaplaner (bei Minotti-Modell im Planer) | Couchtisch: „In Höhe und Linie zur Sitzgruppe“ · Teppich: „Hält die Sitzgruppe zusammen“ · Leuchte: „Licht zum Lesen, von seitlich hinten“ |
| `chaise-longues-daybeds` | lamps (1), side-tables (2), rugs (3), decor (4) | Lieferung | P: Raumkonzept | „Ein Leseplatz braucht Licht und Ablage“ |
| `armchairs-stools` | lamps (1), side-tables (2), armchairs-stools [Hocker, gleiche Kollektion] (3), rugs (4) | Pflege Stoff/Leder | – | „Hocker aus derselben Familie“ |
| `coffee-tables` | sofas-couches [gleiche Kollektion] (1), rugs (2), decor (3), candles (4) | Pflege Holz/Stein/Glas | P: Raumkonzept | „Teppich in Größe der Sitzgruppe“ |
| `side-tables` | lamps [Tischleuchte] (1), armchairs-stools (2), candles (3) | – | – | „Tischleuchte für die Ablage“ |
| `dining-tables` | dining-chairs (1), lamps [Pendel] (2), sideboards-chests (3), rugs (4), candles (5) | Montage, Pflege Holz/Stein | P: Raumkonzept · B: Küchenplanung | Stühle: „Passend zur Tischhöhe“ · Pendel: „Licht über dem Tisch“ |
| `dining-chairs` | dining-tables (1), lamps [Pendel] (2), rugs (3) | Pflege Stoff/Leder | – | „Der Tisch zu Ihren Stühlen“ |
| `bar-stools` | kitchen (1, B), lamps [Pendel] (2), kitchen-accessories (3) | – | B: Küchenplaner | „Licht über der Insel“ |
| `desk-chairs` | lamps [Tischleuchte] (1), shelves (2), rugs (3) | – | – | „Arbeitslicht ohne Blendung“ |
| `sideboards-chests` | mirrors (1), lamps [Tischleuchte] (2), decor (3), candles (4) | Montage, Wandbefestigung | – | „Spiegel oder Leuchte darüber“ |
| `tv-low-units` | shelves (1), lamps (2), rugs (3), sofas-couches (4) | Montage, Wandbefestigung | P: Raumkonzept | „Regal in derselben Linie“ |
| `shelves` | lamps (1), decor (2), candles (3), desk-chairs (4) | Montage, Wandbefestigung | – | „Objekte, die das Regal tragen“ |
| `display-cabinets` | lamps (1), decor (2), mirrors (3) | Montage | – | „Licht für die Vitrine“ |
| `small-furniture` | decor (1), candles (2), mirrors (3) | – | – | – |
| `wardrobes` | beds (1), mirrors (2), night-tables (3), bedwear (4) | Aufmaß, Montage | P: Raumkonzept Schlafen | „Spiegel für die Ankleide“ |
| `beds` | night-tables (1), lamps [Wand-/Tischleuchte] (2), bedwear (3), rugs (4), wardrobes (5) | Lieferung, Montage, Altbett-Abholung [prüfen: Angebot] | P: Raumkonzept Schlafen | Nachttisch: „In der Höhe der Matratze“ · Bettwäsche: „Für die neue Matratzengröße“ |
| `night-tables` | lamps (1), beds (2), candles (3) | – | – | „Leseleuchte am Bett“ |
| `bedwear` | beds (1), candles (2), decor (3) | – | – | – |
| `lamps` | Kontext Unterkategorie: Pendel → dining-tables (1); Steh → sofas-couches/armchairs-stools (1); Tisch → side-tables/night-tables (1). Dazu decor (2) | Elektro-Anschluss über Partner [prüfen] | P: Lichtplanung im Raumkonzept | „Wo diese Leuchte wirkt“ |
| `rugs` | sofas-couches (1), coffee-tables (2), dining-tables (3) | Teppichpflege/Reinigung [prüfen: Partner] | P: Raumkonzept (Größe nach Plan) | „Wir legen den Teppich zur Probe aus“ [prüfen: Leihgabe-Regel] |
| `mirrors` | sideboards-chests (1), lamps (2), decor (3) | Montage, Wandbefestigung | – | – |
| `decor` | candles (1), side-tables (2), shelves (3) | Geschenkverpackung, Gutschein | – | – |
| `candles` | decor (1), side-tables (2) | Gutschein, Firmengeschenk (10) | – | „Passt zu …“ nur nach Duftfamilie [prüfen: Feld] |
| `kitchen` | bar-stools (1), lamps [Pendel] (2), dining-tables (3), dining-chairs (4), kitchen-accessories (5) | Aufmaß, Montage, Elektro/Sanitär über Partner | **P: Küchenplanung (Binni oder Premium)** · B: Ezarri Rückwand [prüfen: Eignung und Freigabe Ezarri] | Barhocker: „Ca. 60 cm Breite je Sitzplatz an der Insel“ [Faustregel] |
| `kitchen-accessories` | kitchen (1, B), candles (2), decor (3) | – | B: Küchenplaner | – |
| `garden-tables` | garden-chairs (1), parasols (2), heaters (3), lounge-furniture-daybeds (4) | Hüllen, Wintereinlagerung, Frühjahrs-Aufbau (30) | **P: Outdoor-Konzept · B: Ezarri Pool** | Schirm: „Schatten für den Essplatz“ |
| `garden-chairs` | garden-tables (1), parasols (2), heaters (3) | Hüllen, Einlagerung | P: Outdoor-Konzept | – |
| `lounge-furniture-daybeds` | parasols (1), heaters (2), garden-tables [niedrig] (3), sun-loungers (4) | Hüllen, Einlagerung | **P: Outdoor-Konzept · B: Ezarri Pool** | Heizstrahler: „Verlängert die Abende im Frühling und Herbst“ |
| `sun-loungers` | parasols (1), garden-tables [Beistell] (2), lounge-furniture-daybeds (3) | Hüllen, Einlagerung | **B: Ezarri Pool** · P: Outdoor-Konzept | „Liegen am Pool: Mosaik von Ezarri“ |
| `parasols` | lounge-furniture-daybeds (1), garden-tables (2), heaters (3) | Montage Sockel, Einlagerung | P: Outdoor-Konzept | – |
| `heaters` | lounge-furniture-daybeds (1), garden-tables (2), parasols (3) | **Elektroanschluss durch befugten Partner** (Pflicht-Hinweis, wachstum/10 §3.4) | P: Outdoor-Konzept | – |

**Feste Regeln für alle Quellen:**
- `indoor_and_outdoor` muss passen. Outdoor-Quellen zeigen nur Outdoor-Ziele, außer `decor` und `candles`, wenn sie als outdoor markiert sind.
- Nie dieselbe Kategorie wie die Quelle, mit zwei Ausnahmen: `armchairs-stools` → Hocker derselben Kollektion, `lamps` nach Unterkategorie.
- Höchstens 4 Produktkarten, dazu 1 Servicekarte und 1 Planungskarte. Eine Brücken-Karte ersetzt die Planungskarte, wenn sie in der Tabelle steht.
- Ausgeschlossen sind Produkte ohne Foto (`NoPhoto`), inaktive Produkte, Produkte mit offenen Bildrechten und Hersteller-Texte mit Händler-Aussage (der Filter `manufacturerText` greift ohnehin).

### 3.2 Empfehlungslogik: Spezifikation (Phase 1, regelbasiert, ohne Personendaten)

**Ort:** neues Modul `src/lib/shop/complements.js` (server-only) und Regel-Konfiguration `src/lib/shop/complementRules.js` (Tabelle 3.1 als Datenobjekt, nach dem Muster von `categoryAliases.js` mit Unit-Test gegen `LIVE_CATEGORIES`). Später wandern die Regeln in den Doctype „Ergänzungsregel“ (wachstum/10 §4.2). Die Konfigurationsdatei bleibt als Fallback.

**Eingabe:** Produkt-Detail (`marken`, `kategories`, `sub_kategorie`, `colorKeys`, `materialKeys`, `indoor_and_outdoor`, `path_field`), die Kollektionen der Marke (`loadProductsByCollection` – ist auf der Produktseite schon geladen, kein Zusatz-Request).

**Ablauf je Zielkategorie (in Prioritätsreihenfolge, Abbruch bei 4 Karten):**

```
kandidaten = produkte(zielkategorie)            // fetchProdukteByKategorie, ISR 3600 s, Tag "products"
           ∪ kollektionsprodukte ∩ zielkategorie // bereits geladen
filter: aktiv, bild, indoorOutdoor passt, nicht aktuelles Produkt, sub_kategorie passt (falls Regel sie verlangt)
score(k) = 50 · gleicheKollektion
         + 25 · gleicheMarke
         + 10 · |colorKeys ∩| / max(1, |colorKeys Quelle|)
         + 10 · |materialKeys ∩| / max(1, |materialKeys Quelle|)
         +  5 · handkuratiert(passt_zu)          // Phase 1b, Feld im Backoffice
         – 30 · (Marke schon in einer anderen Karte)   // Vielfalt: nicht 4× dieselbe Fremdmarke
wähle argmax(score); bei Gleichstand: stabiler Hash(path_field Quelle + Kandidat)
  → dieselbe Seite zeigt immer dieselben Karten (Cache, SEO, kein Flackern)
```

**Leistung:** Pro Produktseite fallen bis zu 4 zusätzliche Kategorie-Abrufe an. Sie werden je Kategorie gecacht und von allen Produktseiten geteilt. Für die erste Ausbaustufe reicht das. Wenn die Seitenzeiten leiden (R6-perf-Budget), ist die Alternative ein nächtlich erzeugter Index `complements-index.json` (Quelle → 6 Pfade) beim Build, nach dem Muster `arviewer/catalog-index.json`.

**Fallback:** Ohne Kandidaten für die Regel folgt die nächste Regel. Bleiben weniger als 2 Karten übrig, entfällt der Block. Er wird dann nicht mit Alternativen aufgefüllt.

**Ausgabe:** `{ items: [{ product, ruleId, reason_de/en/fr/it }], service: ServiceCard, planning: PlanningCard | BridgeCard }`.

**Phase 2 (ab ca. 300 Anfragen mit Merkliste, [Schätzung] Q2–Q3 2027): Co-Occurrence.** Aus abgeschickten Merklisten-Anfragen (Backoffice, nicht aus Surfverhalten) wird „Kategorie A wird mit Produkt B zusammen angefragt“ gezählt. Das ist Item-to-Item-Filtering nach Linden/Smith/York (Amazon 2003) [Q3]. Es läuft als Score-Bonus `+ 15 · lift(A,B)` mit Mindestunterstützung 5. Der Datenschutzjurist muss vorher bestätigen, dass die aggregierte Auswertung von Anfragedaten durch Art. 6 Abs. 1 lit. f DSGVO gedeckt ist [anwaltlich prüfen]. Es gibt keine Profile und kein Tracking-Cookie.

**Phase 3 (ML) erst bei mehreren tausend Anfragen [Schätzung].** Darunter ist ein Modell schlechter als die Regeln und nicht erklärbar. Bis dahin gilt: Regeln plus Co-Occurrence plus Planer-Wissen.

### 3.3 UI-Platzierungen (mit fertigen Texten, DE)

| # | Ort | Platzierung | Inhalt | Texte |
|---|---|---|---|---|
| U1 | **Produktseite** | Neue Sektion **direkt nach** `#produktdetails`/Quellenhinweis und **vor** `BuiltToStay`, gleiche Rasterbreite wie „related“. Mobil: horizontaler Scroll-Streifen mit 1,2 sichtbaren Karten | 4 Produktkarten (Bild, Marke, Name, Begründung, Herz) + Servicekarte + Planungs-/Brückenkarte. Button „Alle merken“ legt die 4 Stücke plus das Hauptprodukt in die Merkliste | Overline: „Für Ihren Raum“ · H2: „Komplettieren Sie den Raum“ · Lead: „Was in unserer Ausstellung neben {name} steht. Jedes Stück einzeln, nichts ist vorausgewählt.“ · Button: „Alle {count} Stücke merken“ |
| U2 | Produktseite | Bestehender Block „Das könnte Ihnen auch gefallen“ | Inhalt bleibt (gleiche Marke). **Umbenennen** in ehrliche Alternativen, Limit von 3 auf 6 | Overline: „Mehr von {brand}“ (wie heute) · H2 neu: „Ähnliche Modelle“ |
| U3 | Produktseite, rechte Spalte unter den Fakten | Kompakte Zeile über dem Berater-Hinweis | Service als wählbarer Anfrage-Zusatz: Checkboxen **ohne Vorauswahl** im Beratungs-Link (`?zusatz=montage,pflege`) | Label: „Zu Ihrer Anfrage, auf Wunsch:“ ☐ „Lieferung und Montage“ ☐ „Pflegeset passend zum Material“ ☐ „Planung für Ihren Raum“ · Hinweis: „Wir nennen Ihnen die Kosten im Angebot.“ |
| U4 | **Merkliste** | Unter der Liste, über dem Anfrage-Button | Pro fehlender Ziel-Kategorie eine Zeile (höchstens 3), berechnet aus den Regeln der gemerkten Quellen | H3: „Für Ihren Raum fehlt vielleicht noch“ · Zeile: „Kein Teppich in Ihrer Auswahl, passend zu {produkt}“ → Link zur gefilterten Kategorie · Schluss: „Oder wir stellen es für Sie zusammen: Raumkonzept anfragen“ |
| U5 | Merkliste, Anfrageformular | Feld „Interesse an“ (Mehrfachauswahl, leer) | Planungsstufe 1–4 (3.5) + Service | „Ich interessiere mich auch für:“ ☐ Raumkonzept ☐ Konzept mit Handzeichnung und Modell ☐ Lieferung und Montage ☐ Pflege |
| U6 | **Kategorieseite** | Eine redaktionelle Kachel nach der 2. Reihe (Desktop: Position 7, mobil: Position 5), nur bei Quellen mit Regel | Bild einer echten Ausstellungs-Vignette (nur eigenes Foto, Entscheidung Nr. 8: kein KI-Bild) + Link zur Zielkategorie | Sofas: „Der Teppich macht die Sitzgruppe. 24 Teppiche ansehen“ · Esstische: „Licht über dem Tisch: Pendelleuchten“ · Outdoor: „Schatten, Wärme, Pool: Ihre Terrasse als Ganzes planen“ |
| U7 | **Markenseite / Kollektionsseite** | Nach dem Produktraster | Kollektion als Raum: alle Kategorien der Kollektion als „Familie“ | H2: „Die {kollektion}-Familie“ · Lead: „Sofa, Tisch und Sessel aus einer Linie.“ · Button: „Ganze Familie merken“ (Funktion existiert schon für Kollektionskarten) |
| U8 | **Sofaplaner, Ergebnis** | Neuer Kasten in `ResultPanel` vor der Merkliste | Teppich-Mindestgröße aus der Plan-Hüllfläche: Breite + 2 × 20 cm, Tiefe + 40 cm, mindestens so, dass die Vorderfüße auf dem Teppich stehen [Faustregel]. Dazu Couchtisch ca. ½–⅔ der Sofalänge, ca. 40–45 cm Abstand [Faustregel] und 3 Teppiche, die das erfüllen (Maße aus `dimensions.js`) | H3: „Zu Ihrem Plan passt“ · Text: „Ihre Sitzgruppe misst {b} × {t} cm. Ein Teppich ab etwa {tb} × {tt} cm hält sie zusammen. Die genaue Größe legen wir im Plan fest.“ |
| U9 | **Küchenplaner, Ergebnis** | Neuer Abschnitt nach der Stückliste (`BomTable`) | Barhocker-Zahl = ⌊Insel-Sitzseite / 60 cm⌋ [Faustregel], Pendelleuchten 2–3 je nach Insellänge [Faustregel], Ess-Ecke, Küchenzubehör. Dazu Geräte- und Steinstufe als **Fragen** an die Planung, nicht als Preis | H3: „Rund um Ihre Küche“ · „An Ihrer Insel ({l} cm) haben {n} Barhocker Platz.“ · „Gerätestufe und Steinplatte besprechen wir mit Ihnen in der Planung.“ |
| U10 | **Stil-Finder, Ergebnis/Moodboard** | Unter dem Moodboard | Je Profil 1 Leitprodukt + 3 Ergänzungen nach Regeltabelle, gefiltert nach den Farben und Materialien des Profils | „Ihr Stil, als Raum gedacht“ · Button: „Diesen Look merken“ |
| U11 | **KI-Concierge** | `ProductCards` | Concierge nutzt `complements()` als Werkzeug: Auf die Frage „Was passt zu …?“ antwortet er mit Regelbegründung, nicht frei erfunden | Systemregel: „Ergänzungen nur aus complements(); Begründung aus der Regel; keine Preise, keine Lieferzusagen.“ |
| U12 | **Portal-Produktpass** | Je Stück in `/portal/pass/[id]` | Pflege-Nachkauf nach Material, saisonal (Outdoor-Hüllen ab Oktober, Frühjahrs-Aufbau ab März), „Passt zu Ihrem {produkt}“ (2 Karten) | „Pflege für {material}“ · „Für den Winter: Hüllen und Einlagerung“ · „Passt zu Ihrem {produkt}“. **Das Wort „Garantie“ nur mit echten Garantiebedingungen** (wachstum/10 §8) |
| U13 | **Ezarri-Konfigurator** | Ergebnis/Angebot | Materialrechner: m² × (1 + Verschnitt) [Verschnitt-Wert von Ezarri/Verleger, prüfen], dazu automatisch die Zubehörliste: Kleber (mind. C2TE), Epoxid-Fuge RG in gewählter Fugenfarbe, Corner & Cove für Treppen und Kanten, Werkzeug [Q2]. Alles einzeln abwählbar, **nichts vorausgewählt** außer der Anzeige. Dazu Verlegepartner und Poolumgebung (Liegen, Schirm) | H3: „Was Sie für die Verlegung brauchen“ · „Ezarri empfiehlt für Glasmosaik Kleber der Klasse C2TE und Epoxid-Fugen. Wir stellen die Mengen für Ihre Fläche zusammen.“ · Brücke: „Rund um den Pool: Liegen, Schatten, Licht“ |
| U14 | **Outdoor-Landingpage** | Nach den Paketen | Konzeptstufen (3.5) + Brücke Ezarri + Service-Abo (30) | „Von der Terrasse bis zum Pool: ein Konzept, wir koordinieren die Gewerke.“ (**Koordination, keine Bauleitung**) |
| U15 | **Yacht-Interior / Hotel-Contract** | Vor dem Anfrage-Formular | Leistungsumfang als Stufen statt als Produkte (3.5 Y/H) | „Was wir für Ihr Projekt übernehmen“ |
| U16 | **Atelierverkauf** (Preise erlaubt) | Detailseite | „Dazu im Showroom“: 2 Ergänzungen **aus dem Atelierverkauf** mit Preis, sonst aus dem Katalog ohne Preis | Preise nur über `priceRules.js` (kein „statt“, kein Paketrabatt ohne Grundlage) |

**Gestaltung (Design-Bibel):** Ruhige Karten im Stil `CatalogTile`, keine Badges wie „Bestseller“ oder „Beliebt“, keine Countdowns, kein Pop-up und kein Overlay beim Hinzufügen. Die Begründungszeile steht in `text-small text-text-soft` unter dem Namen. Die Servicekarte zeigt ein Linien-Icon statt eines Fotos. Die Planungskarte zeigt ein **echtes** Foto einer Handzeichnung oder eines Mini-Modells von Harald Menghin (Entscheidung Nr. 8). Solange es kein echtes Foto gibt, bleibt die Karte eine reine Typo-Karte.

**Texte der Service- und Planungskarten (DE, fertig):**
- Service „Lieferung und Montage“: „Auf Wunsch liefern und montieren wir. Die Kosten nennen wir Ihnen im Angebot.“
- Service „Pflege“: „Das passende Pflegeset für {material} und eine Einweisung bei der Übergabe, auf Wunsch.“
- Service „Outdoor über den Winter“: „Hüllen oder Einlagerung mit Abholung, auf Anfrage.“
- Planung „Raumkonzept“: „Wir zeichnen Ihren Raum von Hand, bevor wir ihn in 3D planen. Erst dann wählen wir die Stücke.“ → Link `/beratung?leistung=raumkonzept&produkt=…`
- Brücke „Ezarri“: „Glasmosaik für Pool, Bad und Wellness. Platzhirsch ist Vertragshändler von Ezarri.“ (Händler-Aussage erlaubt, Entscheidung Nr. 7)
- Brücke „Küche“: „Die Küche zur Insel: Küchenplaner ausprobieren oder Planung im Showroom.“
- Brücke „Outdoor“: „Terrasse, Garten und Pool als ein Konzept. Wir koordinieren die Gewerke.“

### 3.4 Bundles („Looks“)

Regel für alle Bundles: Online gibt es keinen Bundle-Preis und keinen „statt“-Preis. Ein Bundle ist eine **merkbare Zusammenstellung** und im Showroom ein Angebot mit einzeln wählbaren Positionen (wachstum/10 §5.4, §8). Ein Paketvorteil ist nur als echte Leistung erlaubt, z. B. „Lieferung in einer Fahrt“, nie als Rabattprozent.

| # | Bundle | Inhalt (Regel) | Wo | Upsell-Pfad |
|---|---|---|---|---|
| B1 | **Sitzgruppe** | Sofa + Couchtisch (gleiche Kollektion) + Teppich (Größe nach U8) + Stehleuchte | Produktseite Sofa, Sofaplaner | → Raumkonzept |
| B2 | **Lesesitz** | Sessel + Hocker (gleiche Kollektion) + Leseleuchte + Beistelltisch | Produktseite Sessel | → Pflege |
| B3 | **Essplatz** | Esstisch + 4–8 Stühle (Anzahl nach Tischlänge, ca. 60 cm je Platz [Faustregel]) + Pendel + Sideboard | Produktseite Esstisch | → Küchenplanung |
| B4 | **Inselküche** | Küche + Barhocker (n nach U9) + Pendel + Küchenzubehör | Küchenplaner | → Küchenplanung Premium, Binni-Stufen (sobald Preise freigegeben) |
| B5 | **Schlafzimmer** | Bett + 2 Nachttische + 2 Leuchten + Bettwäsche + Teppich | Produktseite Bett | → Ankleide/Kleiderschrank, Raumkonzept Schlafen |
| B6 | **Terrasse bereit** | Lounge + Schirm + Heizstrahler + Hüllen + 1. Einlagerung | Outdoor-Kategorien, Outdoor-Landingpage | → Outdoor-Konzept |
| B7 | **Pool & Terrasse** | Ezarri-Mosaik (Konfiguration) + Zubehörliste + Sonnenliegen + Schirm | Ezarri-Konfigurator, `sun-loungers` | → Outdoor-Konzept Garten/Seegrundstück |
| B8 | **Bad & Wellness** | Ezarri-Mosaik für Dusche/Bad + Spiegel + Leuchte + Accessoires | Ezarri-Bereich (Bad), `mirrors` | → Interior Design Gesamtprojekt |
| B9 | **Ankommen** (Geschenk, Makler/Bauträger) | Kerze + Deko + Gutschein für Raumkonzept | `candles`, `decor`, Gutscheine | → Raumkonzept (Gutschein wird Lead) |
| B10 | **Ferienwohnung bezugsfertig** | Raum-Looks Wohnen, Essen, Schlafen + Textilien + Küche (Binni) | Arlberg-/Regionsseiten, Hotel-Contract | → Turnkey-Koordination |
| B11 | **Hotelzimmer / Suite** | Bett, Nachttische, Leuchten, Lounge-Sessel, Teppich, Bad mit Ezarri | Hotel-Contract-Seite | → Musterzimmer, FF&E-Liste (hotel-contract.md) |
| B12 | **Yacht-Salon** | Lounge, Couchtisch, Teppich, Leuchten (yacht-taugliche Ausführung [prüfen je Hersteller]) | Yacht-Interior | → Yacht-Konzept (3.5 Y) |

**Umsetzung:** Bundles sind Konfigurationen in `complementRules.js` (`bundles: [{ id, sourceCategory, slots: [category, sub?, count rule] }]`). Sie werden mit derselben Score-Funktion gefüllt. Showroom-Looks (QR an der Vignette, Masterkonzept-Sofortmaßnahme) sind **handkuratierte** Bundles mit fixen `path_field`s.

### 3.5 Upsell-Stufen der Planungsleistung

Die Preise sind ein **Vorschlag aus wachstum/11 §9.2 und 30** und **noch nicht entschieden**. Auf der Website erscheinen bis zur Freigabe nur Umfang und Anrechnungsprinzip, keine Beträge. Die Planungspauschale in den AGB (recht/01 §2.3) ist mit denselben Stufen zu füllen.

| Stufe | Name (Website) | Umfang | Vorschlag Preis [Schätzung, Inhaber entscheidet] | Anrechnung | Einstieg auf der Website |
|---|---|---|---|---|---|
| 0 | **Erstgespräch** | 45–60 Min im Showroom, im Café oder per Video | kostenlos | – | Jede Produktseite („Beratung anfragen“) |
| 1 | **Raum-Check** | Fotos und Maße per Handy-Upload, Rückmeldung mit Möbelvorschlag und 2 Varianten | 149 € | voll ab Auftrag 3.000 € | Merkliste, Planer-Ergebnisse, Upload |
| 2 | **Raumkonzept** | 1 Raum, Aufmaß vor Ort (Zone 1–2), **Handskizze**, 2D-Plan, Material- und Lichtvorschlag, Angebot mit Optionsblock | 390 € | voll ab Auftrag 5.000 € | Produktseite (Planungskarte), U4, U5 |
| 3 | **Konzept mit Modell** (USP-Stufe) | wie 2, dazu **Mini-Modell** und **fotorealistisches Rendering**, bis zu 1 Tag beim Kunden (Licht, Klima, Abläufe) | Vorschlag 900–1.500 € je Raum [Schätzung, Herleitung: Stufe 2 plus Modellbau 4–8 h und Rendering, Stundensatz 120 € netto aus wachstum/11] | voll ab Auftrag 15.000 € | Interior-Design-Seite, Prozessseite, Sofaplaner (große Gruppen) |
| 4 | **Gesamtplanung** | mehrere Räume, Licht, Textil, Bemusterung, Abstimmung mit Architekt, bei Bedarf 1–2 Tage vor Ort | 60–90 €/m² oder 8–12 % des Projektwerts, mind. 2.500 € | 50 % ab Auftrag 50.000 € netto | Interior Design, Hotel, Ferienimmobilien |
| 5 | **Koordination** | Terminplan und Abstimmung der Gewerke (Tischler, Elektro, Garten, Verleger), Übergabe. **Koordination, keine Bauleitung**, keine Haftungsübernahme für Fremdgewerke [anwaltlich prüfen] | nach Angebot, 8–10 % des Projektwerts | keine | Outdoor, Hotel, Second Home |
| K1/K2 | **Küchenplanung Binni / Premium** | Aufmaß, 3D, Überarbeitungen; Premium mit Lichtplan und Gerätekonzept (Gut–Besser–Best, wachstum/10 §5.2) | 490 € / 890 € | voll beim Kauf | Küchenplaner, Küchen-Landingpage |
| O1–O3 | **Outdoor-Konzept Terrasse / Garten / Seegrundstück-Hotel** | Aufmaß, Drohnenfoto, Moodboard, 3D, Licht, Beschattung, Budgetrahmen für alle Gewerke (30) | 1.500 / 3.500 / 6.500 € | voll ab 15 / 35 / 65 T€ Möbelauftrag | Outdoor-Landingpage, Outdoor-Produktseiten |
| Y | **Yacht-Konzept** | Bestandsaufnahme an Bord, Handskizze, Material für Salzluft und UV [prüfen je Hersteller], Koordination mit der Werft | nach Angebot | Inhaber legt fest | Yacht-Interior |
| H | **Hotel-Konzept + Musterzimmer** | Konzept, Moodboard, FF&E-Liste, Musterzimmer (hotel-contract.md) | 2–5 T€ je Haus [Schätzung aus hotel-contract.md] | bei Auftrag | Hotel-Contract |

**Leiter-Logik (wann welche Stufe angeboten wird):**
- Merkliste mit 1 Stück → Stufe 0. Merkliste mit 3 und mehr Stücken oder 2 Kategorien → Stufe 2. Merkliste mit 2 Räumen (Wohnen + Schlafen) → Stufe 4.
- Sofaplaner mit Hüllfläche über ca. 8 m² oder Ecklösung → Stufe 3 („Ihre Gruppe als Modell sehen“).
- Outdoor-Kategorie + Ezarri → O2/O3. Hotel-, Yacht- oder Gastro-Kontext (Seite oder Formularfeld) → H bzw. Y.
- Im Formular steht die Stufe als **Interesse**, nicht als Kauf (U5). Die verbindliche Vereinbarung erfolgt schriftlich vorab (wachstum/11 §9.2, FAGG [anwaltlich prüfen]).

**Fertiger Website-Text „Leistungsstufen“ (DE):**
> **So planen wir mit Ihnen**
> Am Anfang steht ein Gespräch, kostenlos und ohne Verpflichtung. Wenn Sie mehr wollen, zeichnen wir Ihren Raum von Hand, bauen ihn als kleines Modell und zeigen ihn Ihnen danach in 3D. Harald Menghin nimmt sich dafür Zeit, bei Bedarf einen oder zwei Tage bei Ihnen vor Ort.
> **Gespräch** · **Raum-Check** · **Raumkonzept** · **Konzept mit Modell** · **Gesamtplanung** · **Koordination**
> Eine vereinbarte Planung rechnen wir an, wenn Sie bei uns kaufen. Umfang und Kosten besprechen wir vorher schriftlich mit Ihnen.

### 3.6 Messung und Tests

- **Events** über `trackEvent` (nur mit Statistik-Einwilligung, `hasStatisticsConsent`): `view_item_list` mit `item_list_name: "komplettieren" | "aehnlich" | "planer_ergaenzung" | "merkliste_fehlt" | "ezarri_zubehoer"`, dazu `select_item`, `add_to_wishlist` (vorhanden: `trackWishlist`) mit `item_list_name` und `rule_id`, `select_promotion` für Planungs- und Brückenkarten.
- **Server-Kennzahl ohne Cookie:** Kategorien und Positionen je abgeschickter Anfrage (aus dem Formular-Payload, im Backoffice). Das ist die wichtigste KPI, sie gilt auch für Besucher ohne Einwilligung.
- **KPIs:** Ø Positionen je Merklisten-Anfrage (Ausgangswert jetzt messen), Anteil Anfragen mit mehr als einer Kategorie, Anteil Anfragen mit Planungsinteresse ab Stufe 2, Annahmequote je Option im Angebot (Showroom), Anrechnungsquote Planungshonorar (wachstum/11: Ziel 50–60 %).
- **A/B-Tests (nach 4 Wochen Ausgangsmessung):** T1 Position U1 vor vs. nach `BuiltToStay`, T2 Begründungszeile ein/aus, T3 „Alle merken“ ein/aus, T4 Planungskarte mit Handzeichnungsfoto vs. Typo-Karte. Ausspielung serverseitig per Zufalls-Bucket ohne Cookie oder per Zeitfenster-Wechsel (A/B-Gremium, Datenschutzjurist).

### 3.7 Showroom-Anschluss

Jede Online-Ergänzung erscheint im Backoffice mit `rule_id` am Anfrage-Datensatz. Der Berater sieht „Kunde hat Teppich-Empfehlung gemerkt“ und baut daraus den Optionsblock C im Angebot (wachstum/10 §5.1). Die laminierte Komplettierungskarte (wachstum/10 §6.2) wird **aus `complementRules.js` gedruckt**. So gibt es eine einzige Regelquelle für online und Showroom.

### 3.8 Recht (Kurzfassung, Details wachstum/10 §8 – Entwurf, anwaltlich prüfen)

- Keine Voreinstellung bei Zusatzleistungen (AT § 6c KSchG, DE § 312a Abs. 3 BGB). Alle Checkboxen in U3, U5 und U13 sind leer.
- Katalog-Empfehlungen ohne Personendaten brauchen keine Einwilligung. Messung nur mit Einwilligung (AT § 165 Abs. 3 TKG 2021).
- Nachkauf-E-Mails aus dem Produktpass nur mit Bestandskunden-Ausnahme und Widerspruchsmöglichkeit (AT § 174 Abs. 4 TKG 2021, DE § 7 Abs. 3 UWG). Im Portal selbst (eingeloggt, eigener Bereich) ist es Information zum eigenen Kauf.
- Keine Knappheits- oder Beliebtheits-Badges ohne echte Grundlage (UWG). Keine Händler-Aussagen außer ClassiCon und Ezarri, auch nicht in Begründungstexten („passt zu Ihrem Minotti-Sofa“ ist eine Produktaussage und erlaubt, „Minotti-Händler“ ist es nicht).

---

## 4. Maßnahmen

Basis für die Umsatzeffekte: wachstum/10 §7.2 rechnet mit einem Komplettierungssystem [Schätzung] **+13 % Auftragswert Wohnen, +10 % Küche, +20 % Outdoor**, im Szenario M12 also **≈ 24 T€ Umsatz pro Monat**, ≈ 8–11 T€ Rohertrag. Davon gehen nach meiner Schätzung **30–40 % auf die Website-Bausteine zurück** (Merkliste mit mehr Kategorien führt zu größerem Angebot), der Rest auf Angebotsvorlage und Schulung. Die Planungsstufen bringen laut wachstum/11 §9.3 **50–70 T€ Honorare p. a.** Alle Werte sind Schätzungen ohne Ausgangsdaten. Gate: Ausgangswerte messen (M1).

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| P0 | **M1 Ausgangswerte:** Positionen und Kategorien je Anfrage (server-seitig aus Formular-Payload) und Ø Auftragswert, Anteil Ergänzungen/Service 2025–26 | S | 0 € (1 Tag) | indirekt: ohne Basis kein Nachweis, keine Steuerung | Code-Team (Payload-Feld), Inhaber (Buchhaltung) |
| P0 | **M2 „Komplettieren Sie den Raum“ (U1) + Regeln 3.1 + Logik 3.2** in `complements.js`/`complementRules.js`, Unit-Test gegen die 31 Slugs | M | 4–6 PT intern | ≈ 4–6 T€ Umsatz pro Monat ab M6 [Schätzung: 30–40 % von ~16 T€ Wohnen-Komplettierung]. Größte Reichweite, weil jede Produktseite betroffen ist | Code-Team |
| P0 | **M3 Planungskarte + Leistungsstufen-Text (3.5)** auf Produktseite, Merkliste und Interior-Seite, ohne Preise bis zur Freigabe | S | 1–2 PT | Honorare 50–70 T€ p. a. (wachstum/11) plus höhere Abschlussquote durch Anrechnung; verkauft den USP Handzeichnung/Modell | Code-Team (Seite), Inhaber (Stufen und Preise entscheiden, echte Fotos von Skizzen und Modellen) |
| P1 | **M4 Merkliste „fehlt vielleicht noch“ (U4) + Interesse-Felder (U5)** | S | 1–2 PT | mehr Kategorien je Anfrage, damit wird der Optionsblock im Angebot konkret; [Schätzung] +0,3 Kategorien je Anfrage | Code-Team |
| P1 | **M5 Umbenennung „Ähnliche Modelle“ (U2), Limit 6** | S | < 0,5 PT | gering direkt, macht aber U1 erst verständlich | Code-Team |
| P1 | **M6 Sofaplaner-Ergänzung (U8) Teppich und Couchtisch nach Maß** | M | 2–3 PT | Teppich-Annahmequote (wachstum/10: Ziel 20 % × 4 T€) über Beratungsqualität; zugleich Einstieg in Stufe 3 | Code-Team, Planer prüft Faustregeln |
| P1 | **M7 Küchenplaner-Ergänzung (U9)** Barhocker, Pendel, Ess-Ecke, Gerätestufe als Frage | M | 2–3 PT | Küche +10 % Auftragswert (wachstum/10), online ein Teil davon; Binni-Pakete mit Preis erst nach Freigabe | Code-Team |
| P1 | **M8 Ezarri-Zubehörliste und Mengenrechner (U13) + Brücke Pool/Outdoor (B7)** | M | 2–4 PT im laufenden Ezarri-Projekt | Zubehör (Kleber, Fuge, Formteile) ist Pflichtbedarf jedes Mosaikauftrags, die Annahmequote ist hoch [Schätzung]; die Brücke Outdoor → Pool hebt die Tickets in den Bereich von 30–120 T€ (30) | Code-Team (Ezarri-Workflow), Partner Ezarri (Zubehör-Sortiment und Preise), Inhaber |
| P1 | **M9 Service-Checkboxen (U3) und Service-Preisliste** | S | 1 PT Code + 1 Tag Inhaber | Lieferung/Montage als eigene Position: ≈ 36 T€ p. a. heute nicht weiterverrechnet (wachstum/11) | Code-Team, Inhaber (Preisliste, Rechtstermin) |
| P2 | **M10 Kollektion als Familie (U7) und Kategorie-Kachel (U6)** | S | 1–2 PT | mehr Kollektionskäufe (Höhe/Linie passt); gering bis mittel | Code-Team, Inhaber (eigene Vignetten-Fotos) |
| P2 | **M11 Produktpass-Nachkauf (U12)** Pflege, Hüllen Oktober, Frühjahrs-Aufbau | M | 2–3 PT | Wiederkauf und Service-Abo Outdoor (30: Basic 690 €, Plus 1.490 € [Schätzung]); kleiner Umsatz, hohe Marge | Code-Team (Portal), Inhaber (Pflege-Lieferant, wachstum/14) |
| P2 | **M12 Bundles/Looks B1–B12 als merkbare Sets + QR-Looks im Showroom** | M | 2–3 PT + Fotos | erhöht Positionen je Anfrage; Showroom-QR verbindet Besuch und Merkliste | Code-Team, Verkauf (Looks kuratieren) |
| P2 | **M13 Concierge nutzt `complements()` (U11)** | S | 1 PT | konsistente Antworten, kein Erfinden; gering direkt | Code-Team |
| P2 | **M14 Messung und A/B-Tests (3.6)** | S | 1–2 PT | Optimierung der Platzierung; typischer Effekt einzelner Tests klein, aber kumulativ | Code-Team, A/B-Gremium, Datenschutzjurist |
| P3 | **M15 Doctype „Ergänzungsregel“, Feld `passt_zu`, „Service-Artikel“** (wachstum/10 §4.2), Regeln aus der Datei übernehmen | M | 3–5 PT Frappe | Pflege ohne Entwickler; Handkuration der Top-50-Produkte | Partner (Frappe-Entwickler), Verkauf |
| P3 | **M16 Co-Occurrence aus Anfragen (Phase 2)** | M | 2–3 PT nach ca. 300 Anfragen | Empfehlungen lernen aus echten Zusammenstellungen; Effekt erst ab Q2–Q3 2027 | Code-Team, Datenschutzjurist |
| P3 | **M17 Atelierverkauf „Dazu im Showroom“ (U16)** | S | 1 PT | kleine Tickets, schneller Abverkauf von Ausstellungsware | Code-Team |

---

## 5. Was der Inhaber entscheiden oder liefern muss

1. Planungsstufen und Preise (3.5) sowie die Anrechnungsregeln. Bis dahin zeigt die Website nur den Umfang.
2. Echte Fotos: Handskizzen, Mini-Modelle, Ausstellungs-Vignetten (für Planungskarte und U6). Keine KI-Bilder.
3. Service-Preisliste (Montage, Lieferung, Pflegeset, Hüllen, Einlagerung) und Pflege-Lieferant.
4. Ezarri: Zubehör-Sortiment über Ezarri oder Verleger-Partner, Verschnitt-Werte, Bestätigung, für welche Einsatzorte (z. B. Küchenrückwand) Ezarri das Mosaik freigibt [prüfen].
5. `sub_kategorie` bei Leuchten pflegen (Pendel, Steh, Tisch, Wand). Ohne diese Pflege greifen die Regeln für Esstisch, Sofa und Bett nur grob.

---

## Quellen

- [Q1] Baymard Institute, Cross-Sell-Benchmark (u. a. IKEA, Neiman Marcus): https://baymard.com/checkout-usability/benchmark/step-type/cross-sell/12503-ikea ; https://baymard.com/checkout-usability/benchmark/step-type/cross-sell/8600-neiman-marcus-step-1 (Befund zu aggressiven, wegzuklickenden Cross-Sells siehe wachstum/10, S5)
- [Q2] Ezarri, Verlegeanleitung (Kleber mind. C2TE, Epoxid-Fugen RG, Gummispachtel, Reinigung): https://www.ezarri.com/de/how-to-install-Ezarri-mosaics ; Ezarri, vertriebene Materialien (Kleber, Fugen): https://ezarri.com/en/materials ; Eckstücke für Treppen (Zen 50 mm, Katalogauszug): https://pdf.archiexpo.com/pdf/ezarri-mosaico/ezarri-50-mm-mosaics/10861-429511.html
- [Q3] Linden, Smith, York: „Amazon.com Recommendations: Item-to-Item Collaborative Filtering“, IEEE Internet Computing 7(1), 2003, doi:10.1109/MIC.2003.1167344
- Benchmarks zum Auftragswert, Recht und Psychologie (McKinsey, Salesforce, Arhaus, Simonson 1989, Shah/Kumar 2012, KSchG, BGB, TKG): siehe Quellenliste in `Marktresearch/wachstum/10-cross-upselling.md`.
- Planungs-Faustregeln (Teppichgröße, Couchtisch-Abstand, Sitzbreite 60 cm, Pendelzahl) sind übliche Einrichtungsregeln ohne Einzelquelle. Der Planer bestätigt sie vor der Veröffentlichung im Planer-Text [prüfen].
- Interne Quellen: 10, 23, 30, wachstum/10, 11, 14, digital/features/ezarri-analyse.md, wachstumsrat/hotel-contract.md, digital/teamleiter/inhaber-entscheidungen.md; Code wie im Kopf genannt.
