# Wachstumsrat: Produktpräsentation und Showroom-Verkauf

**Kürzel:** praesentation · **Stand:** 28.10.2026 · **Gremium:** Produktpräsentations- und Verkaufsexperten (Showroom-Verkauf, Luxus-Retail)
**Grundlage:** Code-Stand `feature/neuauftritt` (nur gelesen): `src/app/[locale]/produkte/[category]/[product]/page.js`, `src/messages/de.json` (Block `shop.atelier`), `src/components/Booking/config.js`, `src/app/[locale]/beratung/page.js`, `src/lib/productCopy/*`. Dazu `Marktresearch/23-masterkonzept.md`, `digital/redesign/produkte.md`, `digital/expertenrat/02-verkaufspsychologie-beratung.md`, `recht/03-uwg-werbe-audit.md`, `digital/features/sofaplaner-minotti-modelle.md` und `teamleiter/inhaber-entscheidungen.md`.
**Einschränkung:** Der Dev-Server lief während der Prüfung nicht (Port 3000 nicht erreichbar, Port 4545 ist der Agenten-Monitor). Es gibt deshalb keine Screenshots. Das Urteil stützt sich auf Code, Texte und die QA-Protokolle der Runden 1 bis 5.
**Regeln:** Händler-Aussagen nur bei ClassiCon und Ezarri. Keine Superlative. Schätzungen sind als **[Schätzung]** gekennzeichnet, offene Fakten als **[prüfen]**.

---

## 1 Urteil zum Ist-Stand

| Bereich | Note | Kurzbegründung |
|---|---|---|
| Produktseite: Grundgerüst | **7,5/10** | Saubere Reihenfolge: Titel, Bühne, Primärknopf, „Auf einen Blick“, Material, Maße als Tabelle, Downloads, Designer und Marke, Schluss-Band. Ehrliche Datenlogik: Es wird nichts geraten, es gibt kein Fremdfoto, geprüfte Texte werden per Hash freigegeben. Der Primärknopf „In Lochau ansehen – Termin wählen“ ist richtig gesetzt. |
| Produktseite: verkaufende Wirkung | **5/10** | Die Seite beschreibt das Stück, sie verkauft es aber noch nicht. Es fehlen: Sitzgefühl in Worten, Raumbezug (Wie groß wirkt das Stück in einem echten Wohnzimmer?), Material zum Anfassen (Muster bestellen), ein Hinweis, ob das Stück ausgestellt ist, Platzhirsch-Stimme und -Projekt, Video, Verbindung zu Sofaplaner und AR-Viewer und ein Preisrahmen. |
| Verbindung Online zu Showroom | **4/10** | Die Botschaft stimmt („Sehen, sitzen, entscheiden“, „Wir bereiten das Stück vor“). Der Prozess dahinter fehlt aber. `BOOKING_PROVIDER` steht standardmäßig auf `"none"`, die Online-Terminwahl wird also **nicht angezeigt**. „Termin wählen“ führt deshalb in ein Formular. Es gibt keine Reservierung zum Probesitzen, keinen Ausstellungsstatus je Stück, keinen Café-Tisch und keine Übergabe der „Auswahl“ an den Verkauf. |
| Café und Events als Verkaufsbühne | **5/10** | Das Café wird oft genannt („Bei uns sitzen Sie zuerst“). Seiten für Adventsabend und Atelierverkauf gibt es. Auf der Produktseite und im Terminablauf kommt das Café aber nicht vor. |
| Leitfaden für Verkaufsgespräche | **6/10** (als Dokument) | `expertenrat/02` enthält einen guten allgemeinen 60-Minuten-Leitfaden. Es fehlt ein Leitfaden, der **vom Web-Signal ausgeht** (Welches Stück? Welcher Einstieg? Was liegt bereit?), und es fehlt die Übergabe ins CRM bzw. Portal. |
| **Gesamt** | **5,5/10** | Technisch gutes Fundament, aber verkäuferisch erst halb fertig. Die größten Hebel brauchen wenig Code und viel Disziplin im Studio. |

---

## 2 Befunde und Chancen

### 2.1 Was ein Luxus-Showroom verkauft und die Website noch nicht zeigt

Im Showroom verkauft der Verkäufer ein Sofa in dieser Reihenfolge: **Hinsetzen** (Körper), **Anfassen** (Bezug, Naht, Daune), **Größe im Raum** (Abschreiten, Grundriss), **Geschichte** (Designer, Manufaktur), **Möglichkeiten** (Elemente, Bezüge), **Sicherheit** (Lieferzeit, Service, Preisrahmen). Auf der Website fehlen heute die ersten drei Punkte fast ganz.

| # | Befund | Beleg | Chance |
|---|---|---|---|
| B1 | **Die Bildfolge folgt dem Hersteller, nicht dem Verkaufsgespräch.** Die Bühne zeigt die Backoffice-Bilder in Herstellerreihenfolge, meist Raumbilder im Querformat (`produkte.md` P2-5). Detailbilder (Naht, Fuß, Kissenquerschnitt) und Maßstabsbilder fehlen oder liegen zufällig. | `ProductGallery images={product.images}` ohne Rollen | **Bildrollen** im Backoffice (Feld `bildrolle`: hero, raum, detail, material, massstab, showroom). Die Bühne sortiert nach einer festen Dramaturgie (Template 3.1, A2). Baymard: In den Tests zu Möbeln schauen die meisten Teilnehmenden zuerst auf die Bilder und erwarten mindestens ein Bild im Raum. |
| B2 | **Kein Ausstellungsstatus.** Die Zeile „In Lochau“ sagt bei jedem Stück: „Ob das Stück ausgestellt ist, klären wir vor Ihrem Besuch.“ Das stimmt, verschenkt aber das stärkste Argument eines Showrooms. | `de.json` `atelier.showroomValue` | Backoffice-Feld `ausstellung` mit drei Werten: **ausgestellt** (mit Bezug/Farbe), **Bezugsmuster vorrätig**, **nicht ausgestellt**. Damit wird „Zum Probesitzen reservieren“ möglich. Echte Knappheit ist erlaubt: „Ausstellungsstück, einmal vorhanden“ (`expertenrat/02` 2.9). |
| B3 | **Die Online-Terminwahl ist abgeschaltet.** `BOOKING_PROVIDER="none"` → Auf /beratung erscheint nur das Formular. „Termin wählen“ ist damit ein leeres Versprechen. | `src/components/Booking/config.js` | Den Schalter auf `link` stellen, sobald ein Buchungsdienst steht (S, ein Tag). Dazu feste Terminarten (Prozess 3.2). |
| B4 | **Material ist nur Text.** „Bezüge, Oberflächen und Farben zeigen wir Ihnen im Studio an Mustern.“ Es gibt keinen Weg, Muster vorab zu bekommen. | `atelier.materialFallback` | **Musterversand (3 Muster, kostenlos)** oder **Muster liegen beim Termin bereit**. Ein Muster ist ein physischer Anker im Haus des Kunden und der beste Grund für einen zweiten Kontakt. |
| B5 | **Kein Raumbezug zum Maß.** Die Maßtabelle ist gut, aber Zahlen wie 207 × 112 cm sagen Laien wenig. | `dimensions.js` | **Maßstabsgrafik** (Silhouette neben Person mit 1,75 m, Draufsicht auf einem 4 × 5 m Wohnzimmer), Knopf „In Ihrem Raum ansehen“ (AR-Viewer, falls ein Modell da ist), „Grundriss schicken: Wir prüfen die Maße“ (Handy-Upload). |
| B6 | **Sofaplaner und AR-Viewer sind nicht mit der Produktseite verbunden.** In `produkte/` und `ShopCatalog/` gibt es keinen Link auf den Sofaplaner oder den AR-Viewer. Der Sofaplaner kennt 60 Minotti-Familien. | grep ohne Treffer | Bei modularen Minotti-Sofas: Sekundärknopf **„Eigene Kombination planen“** → Sofaplaner, vorbelegt mit dem Modell. Der Sofaplaner gibt die Kombination an Termin und Auswahl weiter. |
| B7 | **Die Platzhirsch-Stimme fehlt.** Unter „Über das Stück“ steht zuerst der Herstellertext (gefiltert), geprüfte eigene Texte gibt es nur für die 10 Stücke der Startliste. Es fehlt der Satz eines Menschen aus dem Studio: „Worauf ich bei diesem Sofa achte.“ | `productCopy/startList.js` | Block **„Aus dem Studio“**: 2 bis 3 Sätze mit Namen und Foto (Template A5). Das ist der USP „Designs, die leben“ (Inhaber-Entscheidung 8) auf Stückebene. |
| B8 | **Preis „Auf Anfrage“ ohne Rahmen.** Für Luxuskunden ist das üblich. Für Erstkäufer im Bereich 10 bis 30 T€ ist es aber die größte Hürde, überhaupt anzufragen. Die Inhaber-Entscheidung sagt: Preise sind noch nicht entschieden. | `atelier.priceValue` | Vorläufig: **„Preisbeispiel auf Anfrage innerhalb eines Werktags“** plus eine Preisspanne je Ratgeber-Kategorie, sobald der Inhaber sie freigibt. Bis dahin kein Code. |
| B9 | **Kein Video, kein 360°.** Für Minotti gibt es Herstellervideos, die Nutzungsrechte sind aber ungeklärt (`recht/bildrechte.csv`). | – | **Eigenes 20-Sekunden-Video aus dem Showroom** je ausgestelltem Stück (Handy, Gimbal, Tageslicht: Hinsetzen, Kissen drücken, Naht). Das sind eigene Rechte, null Lizenzrisiko, und es belegt die Ausstellung. 360° erst später (P3). |
| B10 | **„Ihre Auswahl“ endet bei der Merkliste.** Es gibt keinen Knopf „Auswahl im Showroom vorbereiten lassen“ mit Übergabe an das Team. | `merkliste/page.js`, `produkte.md` „Offen“ | Die Auswahl ist das **Briefing für den Verkauf**. Sie geht mit dem Termin mit (Prozess 3.2, Schritt 3). |
| B11 | **Downloads verlinken Minotti-CAD über `/cmx`.** Minotti schreibt auf der Produktseite, die CAD-Dateien seien „for interior design use only“. | minotti.com/en/lawrence | Für Architekten in Ordnung. Rechtlich prüfen, ob die Herstellerdateien neu gehostet werden dürfen. Sicherer ist ein Link auf die Herstellerseite (an UWG- und Bildrechte-Gremium). |
| B12 | **Die Produktseite verweist nicht auf das Café.** Der stärkste emotionale Grund für einen Besuch („Espresso, dann probesitzen“) taucht dort nicht auf. | `atelier.closingText` | Ein Satz im Schluss-Band und in der Terminbestätigung: „Ihr Tisch im Café ist reserviert.“ |

### 2.2 Externe Hinweise (mit Quellen)
- **Bilder zuerst:** In den Baymard-Tests zu Möbeln und Wohnaccessoires sehen sich die meisten Teilnehmenden zuerst die Bilder an, in der Liste und auf der Produktseite, und sie erwarten mindestens ein Raumbild ([Baymard, Furniture & Home Decor UX Research](https://baymard.com/research-articles/furniture-and-home-decor-ux-research)).
- **Bildmenge:** Laut einer Salsify-Umfrage, die ein Anbieter zitiert, erwarten Kunden 5 bis 8 Bilder pro Produkt: verschiedene Winkel, Details und Raumszenen ([Roomvo-Blog](https://get.roomvo.com/blog-post-how-to-create-a-product-page-that-sells-with-five-great-examples/)). Das ist eine Anbieterquelle, nur als Richtwert zu verstehen.
- **Vorbereitete Termine verkaufen besser als spontane Besuche:** Der Möbelhändler La Maison Convertible berichtet von 40 % Abschlussquote nach Terminen im Laden und von einem um 28 % höheren Warenkorb ([Booxi-Fallstudie](https://www.booxi.com/resources/how-la-maison-convertible-boosts-in-store-sales-while-growing-online-traffic)). Ein Küchenstudio meldet höhere Abschlussquoten nach dem Wechsel auf „nur mit Termin“, nennt aber keine Zahlen ([kbbfocus](https://kbbfocus.com/news/908-showroom-sees-rise-in-conversion-rates-from-appointments-only-system)). Beide Quellen sind Fallstudien von Anbietern bzw. Fachpresse und keine kontrollierten Studien. Eine unabhängige Studie zu Terminquoten in Möbel-Showrooms wurde **nicht gefunden**.
- **Merkliste plus Termin:** Laut einem Fachartikel meldet der Uhrenhändler Tourneau eine sechsmal höhere Abschlussquote, seit Kunden online einen Termin buchen und eine Merkliste anlegen können, die das Personal im Laden sieht. Eine Vergleichsbasis fehlt ([Total Retail](https://www.mytotalretail.com/article/turning-customers-into-clients-the-power-relationship-selling-retail)). Das bestätigt das Prinzip „Ihre Auswahl wartet auf Sie“ aus `expertenrat/02`, aber keine konkrete Zahl.
- **Herstellerfakten Lawrence:** Herstellerseite [minotti.com/en/lawrence](https://www.minotti.com/en/lawrence), abgerufen am 28.10.2026. Daraus stammen alle Fakten im Beispiel unten.

---

## 3 Fertige Bausteine

### 3.1 Template der idealen Produktseite (Polstermöbel, Premium-Marke)

**Prinzip:** Die Seite läuft wie ein Showroom-Rundgang: **sehen → spüren → einordnen → verstehen → möglich machen → sicher sein → hinfahren.** Jeder Block beantwortet genau eine Kundenfrage. Pflichtblöcke sind mit ● markiert, Blöcke, die nur bei vorhandenen Daten erscheinen, mit ○. Fehlen die Daten, entfällt der Block ohne Platzhalter, nach der bestehenden Regel „nichts raten“.

| # | Block | Kundenfrage | Inhalt / Regel | Datenquelle | Status heute |
|---|---|---|---|---|---|
| A1 ● | **Kopf** | Was ist das? | Overline Marke · Kategorie, H1 Modellname, „Design {Designer}“, Leitzeile (1 Satz, geprüft) | Backoffice + `productCopy` | vorhanden |
| A2 ● | **Bühne mit Dramaturgie** | Wie sieht es aus? | Feste Bildfolge nach Rolle: 1 Hero (ganzes Stück, ruhiger Hintergrund) → 2 Raum (bewohnt) → 3 Detail Naht/Kissen → 4 Detail Fuß/Gestell → 5 Material nah → 6 Seite/Profil (Sitzhöhe sichtbar) → 7 **Showroom Lochau** (eigenes Foto, falls ausgestellt) → 8 Video 20 s (eigenes). Höchstens 10 Bilder. Ohne Rollenfeld bleibt die Herstellerreihenfolge. | neues Feld `bildrolle`, eigene Fotos | Bühne vorhanden, Rollen fehlen |
| A3 ● | **Status-Zeile Lochau** | Kann ich es sehen? | Eines von drei Badges direkt unter dem Titel: „**Ausgestellt in Lochau** · Bezug {Stoff}“ / „Bezugsmuster in Lochau“ / „Wir bestellen Muster für Ihren Termin“. Stand mit Datum („geprüft am 21.10.“). Kein „nur noch“-Druck außer bei echten Einzelstücken. | neues Feld `ausstellung` + `ausstellung_geprueft_am` | fehlt (heute pauschaler Satz) |
| A4 ● | **Handlung** | Was mache ich jetzt? | Primär: „**In Lochau probesitzen – Termin wählen**“. Bei Status „ausgestellt“ zusätzlich: „**Zum Probesitzen reservieren**“ (hält das Stück 7 Tage frei, keine Zahlung). Sekundär: „Eigene Kombination planen“ (Sofaplaner, nur modulare Modelle), „In Ihrem Raum ansehen“ (AR, nur mit Modell), „3 Stoffmuster anfordern“. Leise: Merken · Anrufen · WhatsApp. | Booking, Sofaplaner, AR-Viewer | Primärknopf vorhanden, Rest fehlt |
| A5 ● | **Aus dem Studio** | Was sagt jemand, der es kennt? | 2 bis 3 Sätze in Ich-Form, mit Name, Rolle und Porträt: worauf man achten sollte, für wen es passt, für wen eher nicht. Nur geprüft (Hash-Freigabe). Ehrlichkeit verkauft: „eher nicht, wenn …“. | neu: `productCopy.studioNote` | fehlt |
| A6 ● | **So sitzt es sich** | Wie fühlt es sich an? | Sitzcharakter in 3 Skalen mit Worten statt Punkten: Sitzhärte (weich – mittel – fest), Sitztiefe (aufrecht – lümmeln), Rückenhöhe. Dazu der Satz „Am besten selbst probieren“. **Nur ausfüllen, wenn das Team das Stück selbst probegesessen hat**, sonst entfällt der Block. | neu, Team-Eingabe | fehlt |
| A7 ● | **Material und Ausführung** | Woraus ist es, was kann ich wählen? | Aufbau von innen nach außen (Gestell → Federung → Polster → Kissen → Bezug → Fuß). Je Bauteil ein Akkordeon. Darüber 3 bis 6 Muster-Kacheln „im Studio vorrätig“ und der Knopf „3 Muster anfordern“. Pflegehinweis in 1 Zeile (abziehbar ja/nein). | Backoffice + Musterbibliothek | Akkordeon vorhanden, Muster fehlen |
| A8 ● | **Maße und Raum** | Passt es zu mir? | Maßtabelle (vorhanden) + **Maßstabsgrafik** (Draufsicht des Elements in einem 4 × 5 m Raum mit 90 cm Laufweg, Seitenansicht neben einer Person mit 1,75 m) + Faustregel-Box („Vor dem Sofa mindestens 40 bis 45 cm bis zum Couchtisch, Laufwege 80 bis 90 cm“ [prüfen: Team bestätigt die Werte]) + „Grundriss schicken, wir prüfen das Maß“ (Handy-Upload). | `dimensions.js` + Grafik-Komponente | Tabelle vorhanden |
| A9 ○ | **Kombinationen** | Welche Formen gibt es? | Bei modularen Modellen 3 bis 4 Beispielkombinationen als Strichzeichnung mit Gesamtmaß, jeweils mit dem Link „Diese Kombination im Sofaplaner öffnen“. | Sofaplaner-Katalog | fehlt |
| A10 ● | **Geschichte** | Warum ist es besonders? | Designer (Porträt, 2 Sätze, 1 Zitat nur mit Quelle) und Manufaktur (Ort, Gründungsjahr). Vorhanden als `BrandDesignerShowcase`, bisher aber zu weit unten. Gehört **vor** „Mehr von {Marke}“. | vorhanden | Reihenfolge ändern |
| A11 ○ | **Im Projekt** | Wie sieht es bei echten Kunden aus? | 1 Referenzprojekt von Platzhirsch mit diesem Stück oder dieser Marke, mit eigenem Foto und Region („Penthouse in Lindau“). **Nur echt und mit Einwilligung.** | `/projekte` | fehlt |
| A12 ● | **Sicherheit** | Was passiert nach dem Kauf? | 5 Schritte „So läuft Ihr Kauf“: Termin → Planung und Angebot (fester Preis in EUR oder CHF) → Bestellung mit Wochenplan → Statusmeldungen → Lieferung und Montage auf Wunsch. Dazu „Gebaut, um zu bleiben“ (vorhanden). Lieferzeit-Spanne erst, wenn das Backoffice-Feld gepflegt ist. | vorhanden + neu | teilweise |
| A13 ● | **Fakten, Downloads, FAQ** | Details für Planer | Vorhanden: Fakten laut Hersteller mit Quelle, Downloads, FAQ als JSON-LD. Für Architekten: „Planungsdaten anfragen“. | vorhanden | vorhanden |
| A14 ● | **Hinfahren** | Lohnt sich der Weg? | Schluss-Band: Foto Showroom und Café, „Espresso, dann probesitzen“, Öffnungszeiten, Fahrzeit ab Lindau, Bregenz und St. Gallen [prüfen: Fahrzeiten messen], Parken, Primärknopf. | vorhanden + Ergänzung | Band vorhanden |
| A15 ○ | **Mehr von {Marke} / Dazu passt** | Was noch? | Zuerst **„Dazu passt“** (Couchtisch, Leuchte, Teppich aus dem Sortiment, kuratiert, höchstens 3), danach „Mehr von {Marke}“. Cross-Selling im Raum statt im Markenregal. | neu: Feld `passt_zu` | nur „Mehr von“ |

**Mobile Reihenfolge (oberhalb des Cookie-Banners auf dem iPhone 15 Pro):** A1 → A2 → **A3 Status-Zeile** → A4 Primärknopf. A3 ist eine Zeile mit höchstens 40 Zeichen und darf den Primärknopf nicht unter den Banner schieben. Auf kurzen Telefonen entfällt der Datumszusatz.

**Sticky-Leiste (mobil, nach dem Scrollen über A4):** „Probesitzen · Termin“ | Herz | Telefon. Es bleibt die bestehende `MobileCtaBar`, nur mit Produktkontext.

**Tracking (für das A/B- und Analytics-Gremium):** `view_item`, `select_content` (Bildrolle), `sample_request`, `reserve_showroom_piece`, `open_configurator`, `open_ar`, `generate_lead` mit `form: termin|reservierung|muster|rueckruf` und `item_id`.

#### Beispieltext: Minotti Lawrence

*Alle technischen Angaben stammen von [minotti.com/en/lawrence](https://www.minotti.com/en/lawrence) (abgerufen am 28.10.2026). Die Platzhirsch-Sätze sind Entwürfe für die Hash-Freigabe. Was mit [Team] markiert ist, muss das Studio selbst ausfüllen. Es gibt keine Händleraussage. Der Satz zum Ausstellungsstück erscheint nur, wenn das Feld `ausstellung` gesetzt ist.*

> **A1**
> MINOTTI · SOFAS & COUCHES
> # Lawrence
> Design Rodolfo Dordoni
> Ein modulares Sofa mit tiefer Daune und schmalem Metallrahmen, ruhig genug für große Räume, weich genug für lange Abende.
>
> **A3** ● Ausgestellt in Lochau · Bezug [Team: Stoffname, Farbe] · geprüft am [Datum]
> *(Alternative ohne Ausstellung:)* Bezugsmuster in Lochau – wir legen sie zu Ihrem Termin bereit.
>
> **A4**
> [ In Lochau probesitzen – Termin wählen ]
> [ Zum Probesitzen reservieren ] – Wir halten das Stück 7 Tage für Ihren Besuch frei. Unverbindlich und ohne Zahlung.
> Eigene Kombination planen · 3 Stoffmuster anfordern · Merken · Anrufen
>
> **A5 – Aus dem Studio**
> „Lawrence ist ein Sofa für Menschen, die wirklich darauf leben. Die Sitzkissen sind mit Daune gefüllt und haben einen Kern aus Memory-Schaum. Man sinkt ein, aber nicht durch. Wenn Sie lieber aufrecht sitzen, probieren Sie es mit Lendenkissen, das zeigen wir Ihnen gern.“
> – [Team: Vorname Nachname], Einrichtungsberatung, Platzhirsch Lochau
>
> **A6 – So sitzt es sich** *(nur nach eigenem Probesitzen ausfüllen)*
> Sitzgefühl: weich ◻ mittel ◻ fest ◻ [Team]
> Haltung: eher aufrecht ◻ entspannt ◻ zum Hineinlümmeln ◻ [Team]
> Zwei Armlehnen-Höhen zur Wahl: niedrig oder hoch. Am besten probieren Sie beide.
>
> **A7 – Material und Ausführung** (von innen nach außen)
> - **Gestell:** Massivholz mit elastischen Gurten mit hohem Kautschukanteil.
> - **Sitz:** Polyurethanschaum in unterschiedlicher Dichte, leicht konkav geformt.
> - **Sitzkissen:** wendbar, Gänsedaune (Assopiuma-zertifiziert, Gold Label) um einen Kern aus Schaum mit Memory-Schaum-Mantel.
> - **Rücken- und Lendenkissen:** Gänsedaune, Rückenkissen mit stützendem Einsatz, Lendenkissen mit Memory-Schaum-Kern.
> - **Rahmen und Fuß:** umlaufender Metallrahmen in poliertem Schwarznickel, Sockel in Metall mattschwarz lackiert, Füße verstellbar.
> - **Bezug:** Die Bezüge der Sitz- und Rückenkissen sind in allen Ausführungen abziehbar, in Stoff und in Leder. Stoffbezüge des Korpus lassen sich nach dem Lösen des Metallrahmens abnehmen. Der Lederbezug des Korpus ist nicht abziehbar.
> - **Armlehnen:** mit Schnellkupplung abnehmbar.
>
> *Im Studio vorrätig:* [Team: 3 bis 6 Musterkacheln mit Name] · [ 3 Muster kostenlos anfordern ]
>
> **A8 – Maße und Raum**
> | Element | Maße laut Hersteller |
> |---|---|
> | Element mit 1 Armlehne (niedrig) | 207 × 112 cm, H 82 cm |
> | Mittelelement | 180 × 112 cm, H 82 cm |
> | Chaiselongue | 168 × 168 cm, H 82 cm |
> | Ecksofa | 319 × 112 cm |
> | Hocker (Clan) | 168 × 112 cm, H 40 cm |
>
> *Der Hersteller nennt hier keine Achsen. Wir nehmen an, dass 112 cm die Tiefe ist, und prüfen das vor dem Angebot. Sitzhöhe und Sitztiefe gibt der Hersteller hier nicht an. Wir messen sie am Ausstellungsstück [Team].*
> [Grafik: Draufsicht Ecksofa 319 cm in einem Wohnzimmer 4,5 × 5,5 m mit Laufweg]
> Mit 112 cm Tiefe braucht Lawrence Platz. Schicken Sie uns ein Foto oder einen Grundriss Ihres Raums, wir prüfen die Maße und schlagen eine passende Kombination vor. [ Grundriss schicken ]
>
> **A9 – Kombinationen**
> Lawrence besteht aus Elementen mit einer Armlehne, Mittelelementen, Ecksofa, Chaiselongue und Hocker. Minotti zeigt sechs Beispiel-Anordnungen in seinen Unterlagen. [ Eigene Kombination im Sofaplaner planen ]
>
> **A10 – Geschichte**
> Rodolfo Dordoni [2 Sätze Designer-Bio, aus `designerInfo`] · Minotti, Meda (Brianza), Familienunternehmen [Gründungsjahr aus `brandInfo`].
>
> **A12 – So läuft Ihr Kauf**
> 1 Probesitzen in Lochau → 2 Planung mit Ihrem Grundriss und Angebot mit festem Preis in Euro oder Franken → 3 Bestellung mit Wochenplan bis zur Lieferung → 4 Nachrichten bei Fertigung, Versand und Montage → 5 Lieferung und Montage auf Wunsch.
>
> **A14 – Hinfahren**
> **Erst ein Espresso, dann Probesitzen.**
> Showroom und Café liegen in Lochau unter einem Dach, an der Landstraße 11. Wenn Sie einen Termin wählen, steht Lawrence frei, die Muster liegen bereit und Ihr Tisch im Café ist reserviert.
> Di–Fr 10–18 Uhr · Sa 10–14 Uhr · Parkplätze am Haus [prüfen]
> [ Termin wählen ]

**Verboten in diesem Template** (aus `recht/03`): „Minotti-Händler“, „offiziell“, „exklusiv“, „größte Ausstellung“, Herstellerzitate ohne Quelle, Herstellervideos ohne Freigabe, Lieferzusagen ohne gepflegtes Feld, Preise, solange der Inhaber sie nicht freigibt.

---

### 3.2 Prozess von online zum Showroom („Ihre Auswahl wartet auf Sie“)

**Ziel:** Aus jedem Web-Signal wird ein **vorbereiteter** Besuch. Die Vorbereitung ist das Produkt: Der Kunde sieht schon beim Ankommen, dass jemand für ihn gearbeitet hat.

#### Terminarten (fest, mit Dauer)

| Terminart | Dauer | Für wen | Vorbereitung durch das Studio |
|---|---|---|---|
| **Probesitzen** | 30 min | ein Stück, klarer Wunsch | Stück frei, Muster zum Wunschbezug, Maße notiert |
| **Wohnraumberatung** | 60 min | mehrere Stücke, ein Raum | Auswahl aufgebaut, Grundriss ausgedruckt, Skizze vorbereitet (USP Handzeichnung) |
| **Projektgespräch** | 90 min | Haus, Neubau, Küche plus Wohnen, Yacht, Hotel | Grundriss bzw. Pläne gelesen, Referenzmappe, ggf. Binni- oder Ezarri-Muster |
| **Material-Session für Planer** | 45 min | Architekten und Innenarchitekten | Musterbibliothek, CAD-Liste, Kontaktkarte für den Objektbereich |
| **Video-Beratung** | 30 min | CH, Ferne, Zweitmeinung | Bildschirm-Mappe, Muster per Post vorab |

Uhrzeiten sind sichtbar, die nächsten 3 freien Termine stehen zuerst (`expertenrat/02` 2.3). Pflichtfelder: Name, E-Mail **oder** Telefon, Terminart und Uhrzeit.

#### Ablauf in 9 Schritten

| # | Wann | Was passiert | Wer / System | Text für den Kunden (Kern) |
|---|---|---|---|---|
| 1 | Auf der Website | Der Kunde merkt Stücke, reserviert ein Ausstellungsstück, fordert Muster an oder plant im Sofaplaner. | Website | – |
| 2 | Buchung | Der Kunde wählt Terminart und Uhrzeit. Die **Auswahl, die Sofaplaner-Kombination und Uploads gehen automatisch mit.** Optional: „Kommen Sie zu zweit?“, „Bringen Sie Kinder oder einen Hund mit?“ (Café-Planung). | Booking + CRM (`expertenrat/02`, `11-crm`) | „Danke, {Vorname}. Am {Tag}, {Uhrzeit} ist alles für Sie vorbereitet: {Stückliste}.“ |
| 3 | Innerhalb von 2 h (Öffnungszeit) | Persönliche Bestätigung **mit Namen der Ansprechperson und Foto**. Rückfrage zu 1 Punkt (z. B. Raummaß oder Wunschfarbe). | Verkauf | „Ich bin {Name} und freue mich auf Sie. Eine Frage vorab: …“ |
| 4 | T − 48 h | Erinnerung mit „Das haben wir vorbereitet“. Möglichkeit zum Umbuchen. | CRM automatisch | „Lawrence steht für Sie frei, drei Muster in Grau- und Sandtönen liegen bereit. Passt der Termin noch?“ |
| 5 | T − 3 h | Anfahrt, Parken, Café-Tisch | CRM automatisch | „Ihr Tisch im Café ist reserviert. Parken direkt am Haus.“ |
| 6 | T − 15 min | **Bühne aufbauen:** Stück frei räumen, Muster auf dem Tisch, Tischkarte mit Namen, Grundriss ausgedruckt, Skizzenblock bereit, Kaffee angeboten. | Verkauf (Checkliste unten) | – |
| 7 | Termin | Gespräch nach Leitfaden 3.3 | Verkauf | – |
| 8 | Am selben Tag bis 18 Uhr | Persönliche E-Mail mit 3 bis 5 Fotos der Stücke **im Showroom**, den besprochenen Maßen und dem nächsten Schritt mit Datum. Kunde im Portal anlegen (falls aktiv). | Verkauf + Portal | „Wie besprochen schicke ich Ihnen bis Mittwoch zwei Varianten.“ |
| 9 | Nachfassen | Angebot nur mit Erklärtermin. Nachfassen +3/+7/+14 nach `expertenrat/02` 2.8. Ohne Termin: Café-Einladung zum nächsten Event. | Verkauf + CRM | – |

#### Reservierung zum Probesitzen (Regeln)
- Nur bei Status „ausgestellt“. Das Stück wird **7 Tage** für einen Termin frei gehalten. Ohne Zahlung, ohne Bindung, mit verpflichtender Terminwahl im gleichen Schritt.
- Ist ein Ausstellungsstück **verkäuflich** (Atelierverkauf), gilt: Wer zuerst reserviert, kauft zuerst. Das steht offen in der Bestätigung. Echte Einzelstück-Knappheit ist erlaubt, Countdown-Timer sind es nicht.
- Kommt der Kunde nicht, wird die Reservierung freundlich aufgehoben und ein neuer Termin angeboten (No-Show-Regel `expertenrat/02` 2.3).
- **Systemvoraussetzung:** Feld `ausstellung` je Produkt plus eine einfache Reservierungsliste (CRM oder Portal-Termine). Ein Lagersystem ist nicht nötig. Wöchentlicher Abgleich am Dienstagmorgen (15 min, eine verantwortliche Person).

#### Café als Erlebnis (ohne Zusatzkapital)
1. **Café-Tisch gehört zu jedem Termin.** Kostet einen Espresso und macht den Besuch zum Ausflug, gerade für Gäste aus der Schweiz und aus Deutschland.
2. **Muster-Bar im Café:** ein Regal mit 30 bis 50 Stoff-, Leder- und Steinmustern (inkl. Ezarri und Binni), frei zugänglich. Wer spontan kommt, kommt so ins Gespräch.
3. **„Samstag im Studio“** (monatlich, 10 bis 14 Uhr): ein Thema pro Termin (Lawrence und Daune, Ezarri-Mosaik am Pool, Steinküche Binni, Bootsinterieur), 15 Minuten Kurzvortrag, danach Probesitzen. Teilnehmerzahl begrenzt durch die echten Café-Plätze. Anmeldung über die Event-Seite (Muster `adventsabend`).
4. **Abend für Architekten** (quartalsweise): Material-Session plus Apéro. Das ist der Kanal zu Hotel- und Objektprojekten (Contract).
5. **Übergabe-Ritual nach dem Kauf:** Pflegekarte mit Stoffname, Kaffeebohnen aus dem Café, QR-Karte für die Bewertung (ohne Review-Gating).

#### Checkliste „Bühne aufbauen“ (15 Minuten, ausdrucken)
- [ ] Auswahl und Notizen des Kunden gelesen (CRM / Portal)
- [ ] Stück(e) frei geräumt, Kissen aufgeschüttelt, Licht an
- [ ] Muster zum Wunschbezug + 2 Alternativen (heller/dunkler) auf dem Beistelltisch
- [ ] Maßband, Grundriss-Ausdruck, Skizzenblock, Bleistift
- [ ] Tischkarte mit Namen, Café-Tisch reserviert
- [ ] Bei Sofaplaner-Kombination: Ausdruck der Kombination mit Gesamtmaß
- [ ] Ein passendes Referenzfoto (gleiche Region oder gleicher Raumtyp), falls vorhanden

---

### 3.3 Verkaufsgespräch-Leitfaden für Leads aus der Website

*Ergänzt den allgemeinen 60-Minuten-Leitfaden in `expertenrat/02` 2.6. Der Unterschied: Der Einstieg hängt davon ab, **was der Kunde online getan hat.** Das Web-Signal ist ein Geschenk, das man im Gespräch zurückgibt, nicht etwas, mit dem man ihn überrascht.*

#### Grundregeln
1. **Das Signal offen nennen, nicht heimlich nutzen.** „Sie hatten sich Lawrence angesehen, deshalb steht er schon für Sie bereit.“ Nie: „Ich habe gesehen, dass Sie zwölfmal auf der Seite waren.“ (Datenschutz, Vertrauen.)
2. **Zuerst sitzen, dann reden.** Die ersten 5 Minuten gehören dem Körper: Kaffee, hinsetzen, nachfühlen lassen. Das Gespräch beginnt erst danach.
3. **Fragen vor Präsentation.** Mindestens die Hälfte der Zeit hört der Verkäufer zu.
4. **Die Handskizze ist der Wendepunkt.** Ab Minute 20 bis 30 nimmt der Berater den Bleistift und zeichnet den Raum des Kunden mit dem Stück. Das ist der USP des Inhabers, sichtbar und zum Mitnehmen.
5. **Jedes Gespräch endet mit einem Datum**, nicht mit „Melden Sie sich“.

#### Einstieg je Web-Signal

| Signal (aus CRM/Booking) | Was bereitliegt | Einstiegssatz | Leitfrage | Nächster Schritt |
|---|---|---|---|---|
| **Ein Stück gemerkt / Probesitzen gebucht** | Stück, 3 Muster | „Lawrence steht schon für Sie bereit. Setzen Sie sich ruhig, ich hole uns einen Kaffee.“ | „Wo wird er stehen, und wer sitzt am meisten darauf?“ | Maße im Raum prüfen → Angebot mit 2 Bezügen |
| **Mehrere Stücke, ein Raum** | Auswahl als Gruppe arrangiert | „Ich habe Ihre Auswahl so zusammengestellt, wie sie in einem Raum wirken könnte. Was gefällt Ihnen, wenn Sie es so sehen?“ | „Was soll der Raum können, das er heute nicht kann?“ | Handskizze → Wohnraumkonzept mit Termin |
| **Sofaplaner-Kombination** | Ausdruck der Kombination, Maßband | „Sie haben sich eine Kombination mit 3,20 m zusammengestellt. Lassen Sie uns das einmal abschreiten.“ | „Liegen Sie gern, oder sitzen Sie eher aufrecht?“ | Kombination anpassen → Angebot |
| **Grundriss / Fotos hochgeladen** | Grundriss mit erster Skizze | „Ich habe mir Ihren Grundriss angesehen und eine erste Idee gezeichnet. Darf ich sie Ihnen zeigen?“ | „Was hat Sie am Raum bisher gestört?“ | Vor-Ort-Termin (1 bis 2 h, USP) |
| **Muster angefordert** | dieselben Muster + 2 Nachbarn | „Haben die Muster bei Ihnen zu Hause zum Licht gepasst?“ | „Wie ist das Licht im Raum, eher Morgen- oder Abendsonne?“ | Bezugsentscheidung → Angebot |
| **Ausstellungsstück reserviert** | Stück mit Zustandsprotokoll | „Das ist das Stück, das Sie reserviert haben. Schauen Sie es sich in Ruhe an, auch die Details.“ | „Brauchen Sie es zu einem bestimmten Termin?“ | Kauf heute möglich, Lieferung abstimmen |
| **CH-Kunde / Dreiländer-Rechner** | Rechenbeispiel in CHF | „Ich zeige Ihnen gleich, wie Verzollung und Mehrwertsteuer bei Ihnen ablaufen, ganz konkret.“ | „Ist die Lieferadresse in der Schweiz oder hier?“ | Offerte in CHF mit Video-Erklärtermin |
| **Architekt / Planer** | Musterbibliothek, CAD-Liste | „Was brauchen Sie für Ihr Projekt am dringendsten: Muster, Daten oder einen Termin mit Ihrem Bauherrn?“ | „In welcher Phase ist das Projekt, und wer entscheidet?“ | Termin zu dritt mit dem Bauherrn |
| **Hotel / Gastro (Contract)** | Referenzmappe Objekt, Partnerliste | „Erzählen Sie mir von Ihrem Haus und Ihren Gästen.“ | „Bis wann muss eröffnet werden, und wie viele Zimmer betrifft es?“ | Projektgespräch 90 min vor Ort im Hotel |
| **Yacht / Pool / Outdoor** | Bootsplan bzw. Ezarri-Muster | „Zeigen Sie mir, wo Sie an Bord bzw. am Pool die meiste Zeit verbringen.“ | „Welche Bedingungen gibt es: Salzwasser, Sonne, Feuchtigkeit?“ | Vor-Ort-Termin + Gewerke-Koordination |

#### Ablauf (60 min Wohnraumberatung)

| Min | Phase | Inhalt | Ergebnis |
|---|---|---|---|
| 0–5 | Ankommen | Kaffee, Tischkarte, Stück probesitzen lassen, **nicht** erklären | Entspannung, Körpererfahrung |
| 5–20 | Verstehen | Raum, Menschen, Gewohnheiten, Zeitrahmen, Mitentscheider, Budgetkorridor („Haben Sie einen Rahmen im Kopf, damit ich passende Ausführungen zeige?“) | 5 Notizen im CRM |
| 20–35 | Zeichnen | Handskizze des Raums mit dem Stück, Maße markieren, Laufwege | Skizze, die der Kunde mitnimmt |
| 35–50 | Spüren und wählen | Muster am Stück, 2 Bezüge in die engere Wahl, Ergänzungen („Dazu passt“) nur, wenn sie ein Problem lösen (Licht, Ablage, Akustik) | Entscheidung über Bezug und Kombination |
| 50–60 | Vereinbaren | Zusammenfassung in 3 Sätzen, konkretes Datum für Varianten bzw. Angebot, Erklärtermin direkt buchen | Termin im Kalender |

#### Einwände, die online entstehen

| Einwand | Antwort (Kern) |
|---|---|
| „Online habe ich es billiger gesehen.“ | „Gut, dass Sie vergleichen. Lassen Sie uns schauen, ob es dieselbe Ausführung ist, mit Bezug, Lieferung, Montage und Zoll. Ich rechne es Ihnen gern Zeile für Zeile auf.“ Kein Rabatt im ersten Gespräch. |
| „Auf der Website stand kein Preis.“ | „Weil er wirklich von Ihrer Kombination und dem Bezug abhängt. Ich nenne Ihnen jetzt eine Spanne für zwei Varianten und schicke das Angebot bis {Tag}.“ |
| „Ich wollte nur schauen.“ | „Dafür ist der Showroom da. Bleiben Sie, solange Sie möchten. Darf ich Ihnen die Muster mitgeben?“ (Mitgabe = Rückkehrgrund) |
| „Mein Partner muss es auch sehen.“ | „Dann reservieren wir das Stück und Sie kommen am Samstag zu zweit. Soll ich 10:30 oder 11:30 vormerken?“ |
| „Die Lieferzeit ist zu lang.“ | Wochenplan rückwärts vom Einzugstermin. Alternative: Ausstellungsstück oder Ausführung mit kürzerer Lieferzeit [nur mit belegter Lieferzeit]. |

#### Übergabe ins System (nach jedem Termin, 5 min)
Pflichtfelder im CRM: Terminart · gezeigte Stücke · Bezug in der engeren Wahl · Raummaß · Mitentscheider · Zeitrahmen · Budgetkorridor (Spanne) · **nächster Schritt mit Datum** · Quelle (Web-Signal). Ohne den nächsten Schritt mit Datum gilt der Termin intern als nicht abgeschlossen.

---

## 4 Maßnahmen

*Die Umsatzeffekte sind **Schätzungen** des Gremiums. Grundlage ist der geschätzte heutige Möbelumsatz von ca. 110 T€ pro Monat (`23-masterkonzept` Tab. 2.1, selbst eine Schätzung). Eine Abschlussquote, eine Terminzahl oder einen Durchschnittsbon gibt es im Repo nicht. Wo ein Bon angenommen wird, steht **[Annahme]**. Ziel ist eine Rangfolge der Hebel, keine Prognose.*

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| **P0** | **Online-Terminwahl einschalten** (Buchungsdienst wählen, `BOOKING_PROVIDER=link`, 5 Terminarten, die nächsten 3 freien Uhrzeiten zuerst) | S | 0–30 €/Monat (Buchungsdienst) [Schätzung] | **Hoch.** „Termin wählen“ ist heute ein Formular. Vorbereitete Termine schließen nach den Fallstudien in 2.2 deutlich häufiger ab als spontane Besuche. Schon 2 bis 4 zusätzliche Abschlüsse pro Monat mit 8–15 T€ [Annahme Bon Wohnraum] ergeben ca. 16–60 T€ pro Monat [Schätzung]. | Inhaber (Dienst, Kalender), Code-Team (Schalter) |
| **P0** | **Prozess „Ihre Auswahl wartet auf Sie“** einführen: Auswahl, Sofaplaner und Uploads gehen mit dem Termin mit, persönliche Bestätigung innerhalb von 2 h, Erinnerungen T−48 h und T−3 h, Checkliste „Bühne aufbauen“ | M | 0 € (Zeit) + CRM-Automatik | **Hoch.** Senkt No-Shows und erhöht die Abschlussquote je Termin. Kein Kapital nötig, die Wirkung entsteht im Studio. | Inhaber/Verkauf, Code-Team (Übergabe) |
| **P0** | **Ausstellungsstatus je Produkt** (Feld `ausstellung` + Datum, Status-Zeile A3, wöchentliche Pflege) | S–M | 0 € | **Mittel bis hoch.** Macht den Showroom online sichtbar. Ausgestellte Stücke sind der stärkste Grund, nach Lochau zu fahren. Ohne Status bleibt „Probesitzen“ ein Versprechen ohne Beleg. | Code-Team (Feld + Anzeige), Inhaber (Inventarliste) |
| **P1** | **Reservierung zum Probesitzen** (7 Tage, ohne Zahlung, gekoppelt an Terminwahl) | M | 0 € | **Mittel.** Eine Mikro-Zusage mit hoher Kaufabsicht. Bei Ausstellungsstücken aus dem Atelierverkauf auch direkter Abverkauf und damit Liquidität. | Code-Team, Verkauf |
| **P1** | **Musterversand „3 Muster kostenlos“** | S | Porto + Muster: ca. 5–15 € pro Versand [Schätzung] | **Mittel.** Ein Muster bringt das Stück physisch ins Haus des Kunden und ist ein sicherer zweiter Kontakt. Wirkt vor allem bei CH- und DE-Kunden mit weiter Anfahrt. | Inhaber (Musterbestand beim Hersteller anfragen), Code-Team (Formular, 3 Felder) |
| **P1** | **Eigene Showroom-Fotos und 20-s-Videos** der ausgestellten Stücke (Bildrolle „showroom“, Video im Schluss der Bühne) | M | 0–500 € (Gimbal, Licht) [Schätzung] | **Mittel.** Eigene Bilder ohne Lizenzrisiko belegen die Ausstellung und unterscheiden die Seite vom Hersteller-Katalog. Nebenbei auch Material für SEO, Google-Profil und Social Media. | Inhaber/Team, Code-Team (Bildrollen) |
| **P1** | **Block „Aus dem Studio“ + „So sitzt es sich“** für die 20 meistgezeigten Stücke (Hash-Freigabe) | M | 0 € (Zeit: ca. 15 min pro Stück) | **Mittel.** Menschliche Stimme und Sitzgefühl sind die Lücke zwischen Website und Showroom. Diese Texte kann die Konkurrenz nicht kopieren. | Team (Text), Code-Team (Block) |
| **P1** | **Sofaplaner und AR-Viewer mit der Produktseite verbinden** (modulare Minotti-Modelle: „Eigene Kombination planen“, vorbelegt) | S | 0 € | **Mittel.** Ein vorhandenes Werkzeug ohne Zugang von der Produktseite ist verschenkt. Eine Kombination mit Gesamtmaß ist ein sehr gutes Lead-Briefing. | Code-Team |
| **P1** | **Leitfaden 3.3 + CRM-Pflichtfelder** einführen, 1 Schulung (2 h), danach monatlich ein Gespräch nachbesprechen | S | 0 € | **Mittel bis hoch.** Der Leitfaden kostet nichts und verbessert jeden einzelnen Termin. Der Pflicht-„nächste Schritt mit Datum“ verhindert, dass Leads einschlafen. | Inhaber/Verkauf |
| **P2** | **Maßstabsgrafik und Faustregeln** im Block „Maße und Raum“ (automatisch aus den beschrifteten Maßen) | M | 0 € | **Niedrig bis mittel.** Nimmt Laien die Angst vor Fehlkäufen und führt zum Grundriss-Upload. | Code-Team |
| **P2** | **„Dazu passt“** (Feld `passt_zu`, höchstens 3 kuratierte Stücke vor „Mehr von {Marke}“) | S–M | 0 € | **Mittel für den Bon.** Cross-Selling im Raum (Tisch, Leuchte, Teppich) statt im Markenregal. Annahme: +5 bis 10 % Bon bei Wohnraumaufträgen [Schätzung]. | Team (Kuratierung), Code-Team |
| **P2** | **„Samstag im Studio“** monatlich + **Abend für Architekten** quartalsweise | S | 100–300 € pro Event (Café-Ware) [Schätzung] | **Mittel, verzögert.** Bringt Leute ins Haus, die online noch nicht entschieden sind. Architekten-Abende speisen den Contract-Kanal (Hotels). | Inhaber, Code-Team (Event-Seite nach Muster `adventsabend`) |
| **P2** | **Bildrollen** im Backoffice + feste Bühnen-Dramaturgie (A2) | M | 0 € | **Niedrig bis mittel.** Bessere Bildfolge, vor allem Details und Seitenansicht. | Code-Team, Datenpflege |
| **P2** | **„So läuft Ihr Kauf“** in 5 Schritten auf jeder Produktseite | S | 0 € | **Niedrig bis mittel.** Baut Unsicherheit vor dem ersten Kontakt ab. | Code-Team, Inhaber (Freigabe der Aussagen) |
| **P3** | **CAD- und Herstellerdateien rechtlich prüfen** (eigenes Hosting über `/cmx` oder Link auf die Herstellerseite) | S | Anwalt (im Rechtspaket) | Risiko senken, kein Umsatzeffekt | Recht-Gremium, Inhaber |
| **P3** | **Preisrahmen** je Kategorie (z. B. „Modulsofas dieser Marke typischerweise ab … [Inhaber]“) | S | 0 € | **Mittel**, aber nur nach Entscheidung des Inhabers. Senkt die Hürde für Erstkäufer. | Inhaber entscheidet |
| **P3** | **360°/3D** für 10 Kernstücke (wenn Herstellermodelle und Rechte vorliegen) | L | 2–10 T€ [Schätzung] | **Niedrig** im Verhältnis zu den Kosten. Erst, wenn P0/P1 laufen. | Partner, Code-Team |

---

## 5 Top 5 (Kurzfassung)

1. **Online-Terminwahl einschalten** (P0, S): „Termin wählen“ braucht echte Uhrzeiten statt eines Formulars. Ein vorbereiteter Termin ist laut Fallstudien der stärkste Abschlusshebel [Schätzung: +16–60 T€ pro Monat].
2. **„Ihre Auswahl wartet auf Sie“** (P0, M): Merkliste, Sofaplaner und Grundriss gehen mit dem Termin mit, Stück und Muster liegen bereit, der Café-Tisch ist reserviert. Kostet nichts und erhöht die Abschlussquote je Termin.
3. **Ausstellungsstatus und Reservierung zum Probesitzen** (P0/P1): Online zeigen, was in Lochau steht, und es 7 Tage frei halten. Das schafft echte Knappheit bei Ausstellungsstücken und bringt Liquidität über den Atelierverkauf.
4. **Leitfaden mit Einstieg je Web-Signal und Handskizze ab Minute 20** (P1, S): Ohne Kapital wird jeder Termin besser, und jeder endet mit einem Datum.
5. **Eigene Showroom-Videos, „Aus dem Studio“ und Musterversand** (P1, M): Eigene Inhalte verkaufen Sitzgefühl und Material und unterscheiden die Seite vom Herstellerkatalog.

## Quellen
- Baymard Institute, Furniture & Home Decor UX Research: https://baymard.com/research-articles/furniture-and-home-decor-ux-research
- Roomvo (zitiert Salsify/Baymard, Anbieterquelle): https://get.roomvo.com/blog-post-how-to-create-a-product-page-that-sells-with-five-great-examples/
- Booxi, Fallstudie La Maison Convertible (Anbieterquelle): https://www.booxi.com/resources/how-la-maison-convertible-boosts-in-store-sales-while-growing-online-traffic
- kbbfocus, Showroom „nur mit Termin“: https://kbbfocus.com/news/908-showroom-sees-rise-in-conversion-rates-from-appointments-only-system
- Total Retail, Relationship Selling (Tourneau): https://www.mytotalretail.com/article/turning-customers-into-clients-the-power-relationship-selling-retail
- Minotti, Lawrence (Herstellerfakten, abgerufen am 28.10.2026): https://www.minotti.com/en/lawrence
