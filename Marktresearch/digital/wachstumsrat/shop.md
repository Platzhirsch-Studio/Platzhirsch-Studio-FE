# Wachstumsrat: Onlineshop-Experten (Designmöbel-E-Commerce)

**Kürzel:** shop · **Stand:** 28.10.2026 · **Geprüft:** http://localhost:3000/de/produkte/**, /de/merkliste, /de/atelierverkauf, /de/gutscheine, /de/einkaufen-aus-der-schweiz, Code (nur gelesen) unter `src/lib/shop`, `src/lib/commerce`, `src/components/ShopCatalog`, `src/components/CartPage`.
**Grundlagen:** 23-masterkonzept (maßgeblich), 10-zubehoer, 11-shop-sortiment, digital/07-ecommerce-architektur, teamleiter/inhaber-entscheidungen.md, recht/**.
**Screenshots:** Für `qa-screenshots/wachstumsrat/shop/` gestartet (Kategorie Kerzen, Produktseite Baobab Aurum, Merkliste). Der Dev-Server antwortete sehr langsam, deshalb ist der Ordner eventuell unvollständig. Die Befunde stützen sich auf das per curl geholte HTML [live].
**Kennzeichnung:** [Code] = im Repo geprüft · [live] = auf localhost:3000 geprüft · [Q] = Quelle am Ende · [Schätzung] = eigene Herleitung, keine belegte Zahl · [Inhaber] = braucht eine Entscheidung des Inhabers · [prüfen] = Anwalt/Steuerberater.

**Leitplanken, die dieses Gremium beachtet:**
- Laut Inhaber-Entscheidungen sind **Preise** und **echte Zahlungen online** noch nicht freigegeben. Online-Zahlungen kommen erst nach dem Insolvenzrechtler. Stufe 1 kommt deshalb ganz ohne Online-Zahlung aus.
- Händler-Aussagen („Vertragshändler“, „autorisiert“) gibt es nur für **ClassiCon** und **Ezarri**. Bei allen anderen Marken heißt es „in der Ausstellung“ bzw. „planen wir mit Ihnen“.
- Keine Streichpreise, keine Prozentrabatte, keine Knappheitsformeln. So erzwingt es bereits `src/lib/commerce/priceRules.js`.

---

## 1. Urteil zum Ist-Stand

| Bereich | Note | Kurzbegründung |
|---|---|---|
| Katalog als Schaufenster (Bild, Filter, Maßzeichnung, Merkliste, Design) | **7/10** | Hochwertig, ruhig und schnell erfassbar. Die Filter stehen in der URL (zurück-taugliche Filterzustände), dazu kommen Maßzeichnung, Downloads und Herz-Merkliste [Code]. Auf diesem Niveau ist das in der Region Spitze. |
| Katalog als Verkaufsinstrument | **3/10** | Es gibt keinen Preis, keine Verfügbarkeit, keine Lieferzeit, kein „sofort mitnehmen“ und keine Sortierung. Alle 1.765 Produkte führen in denselben Beratungstermin, egal ob es um eine Kerze für 60 € oder ein Sofa für 25.000 € geht. |
| Shop (Kaufen, Bezahlen, Versand) | **1/10** | Es gibt keinen Checkout und kein Zahlungsmodul. Atelierverkauf und Gutscheine sind fertig gebaut, liefern aber **404** (Schalter `ATELIER_MODE`/`VOUCHER_MODE` = off) [live, Code]. Das ist so gewollt, verschenkt aber die beiden schnellsten Liquiditätshebel. |
| **Gesamt Shop-Reife** | **3/10** | Das Fundament ist stark: Datenmodell, Preisregeln, CSV-Quelle für Ausstellungsstücke, Gutscheinlogik und CH-Seite. Die kaufmännische Schicht fehlt fast ganz. |

**Die eine Aussage:** Der Katalog verkauft heute Termine, keine Produkte. Für 90 % des Umsatzes (Sofa, Küche, Projekt) ist das richtig. Für Einstiegsprodukte, Ausstellungsstücke und Gutscheine ist es falsch, und gerade dort liegen Liquidität, Neukunden und Wiederkauf.

---

## 2. Befunde und Chancen

### 2.1 Befunde (Ist)

| # | Befund | Beleg | Wirkung |
|---|---|---|---|
| B1 | **Eine Textschablone für alle Produkte.** Die Baobab-Kerze Aurum zeigt „In Lochau ansehen – Termin wählen“, „Probesitzen, Bezüge vergleichen und die Maße für Ihren Raum klären“ und „Preis: Auf Anfrage – abhängig von Ausführung und Bezug“. | [live] `/de/produkte/candles/candles-scented-candle-les-exclusives-aurum`, Schlüssel `atelier.priceValue` in `src/messages/de.json` | Unglaubwürdig: Eine Kerze hat keinen Bezug. Wer eine Kerze kaufen will, bricht ab. Gleiches gilt für Bettwäsche, Deko, Spiegel, Heizstrahler und Küchenzubehör. |
| B2 | **Englische Produktnamen und Slugs auf DE.** Beispiele: „Scented Candle Les Exclusives Aurum“, URL `/de/produkte/candles/…`, Kategorien `side-tables`, `bedwear`, `heaters`. | [live] Kategorienliste `/de/produkte` (30 Kategorien) | Schwächer bei deutschen Suchen („Duftkerze Baobab kaufen“). Wirkt auf DE/AT-Kunden wie importiert. Die Umstellung braucht 301-Weiterleitungen (SEO-Team abstimmen). |
| B3 | **Kein Preis, keine `offers` im Product-JSON-LD.** | [Code] Produktseite, Kommentar „no offers/price“ | Keine kostenlosen Google-Shopping-Einträge, keine Preis-Snippets, kein Merchant Center. Damit fehlt das einzige Shopping-Feld, das in der Region niemand besetzt (07, 25). |
| B4 | **Filter ohne Kaufkriterien.** Vorhanden sind Marke, Kategorie, Typ, Material, Farbe, Designer, Bereich. Es fehlen „in Lochau ausgestellt“, „sofort verfügbar“, Preisband und Sortierung. | [Code] `FILTER_GROUPS` in `shopCatalog.js` | Der stärkste lokale Vorteil (anfassen und mitnehmen) ist nicht filterbar. |
| B5 | **Lieferaussage pauschal.** Sie lautet „Lieferung und Montage in Österreich. DE, CH, FL auf Anfrage.“ Eine Lieferzeit fehlt, auch als Spanne. | [live] | Laut Inhaber-Entscheidung 3 bewusst so. Für Paketware braucht es aber eine eigene, konkrete Aussage (Pflichtangabe im Fernabsatz). |
| B6 | **Merkliste = Anfrage.** Sie speichert in localStorage und mündet in `AnfrageFormProduct`. Es gibt weder Summe noch Trennung „kaufbar/anfragen“. | [Code] `CartPage.js` | Gut für Projekte. Für Kleinteile fehlt der Kaufabschluss. |
| B7 | **Atelierverkauf ist fertig, aber aus.** Er hat eine CSV-Quelle (Google-Sheet-Tab ohne EK), ein zod-Schema, Status verfügbar/reserviert/verkauft, Reservierungs-API und Preispflichtzusätze. | [Code] `src/lib/commerce/atelierSource.js`, `priceRules.js`; [live] 404 | Laut 23 bringt das **100–300 T€ Liquidität in 3–6 Monaten** [Schätzung aus 23]. Es fehlt nur die Inventur (Inhaber) und der Schalter. |
| B8 | **Gutscheine sind fertig, aber an die Rechtsfreigabe gekoppelt.** `voucherMode()` bleibt „off“, bis `TERMS_STATUS = freigegeben`. | [Code] `mode.js` | Richtig abgesichert. Damit Advent 2026 noch klappt, braucht es die Kanzlei-Freigabe sofort. 1. Advent ist der 29.11.2026 (10). |
| B9 | **Sortiment mit Online-Potenzial ist schon im Backoffice:** 24 Baobab, 62 × 101 Copenhagen, 150 × Eichholtz, 144 × Flos, 23 × Alonpi, 12 × Heatsail, 16 × Umbrosa. Tom Dixon und Qeeboo sind angelegt, haben aber 0 Produkte. | 11, Abschnitt 1.2 (Zählung 26.10.) | Es braucht keine neuen Marken für Stufe 1, nur Preise, Freigaben und Logistikdaten. |
| B10 | **Seite „Einkaufen aus der Schweiz“ ist live (200).** | [live] | Gute Basis für den CH-Vorteil (rund 10 % unter dem AT-Brutto bei DDP-Lieferung [Schätzung, 11 Abschn. 4.2]). Ein Kaufweg in CHF fehlt noch. |

### 2.2 Chancen

1. **Drei Produkttypen statt einer Schablone.** **Konfigurationsware** (Sofa, Küche, Bett, Tisch nach Maß) bleibt „Preis auf Anfrage + Termin“. **Lagerware/Einstiegsprodukte** bekommt Preis, Verfügbarkeit und „reservieren & abholen“, später „kaufen“. **Einzelstücke** (Ausstellung, Circle) bekommen Preis, Zustand, Foto und „reservieren“. Das ist die wichtigste Einzelmaßnahme, technisch klein (ein Feld `produkt_typ` und drei Textsätze), mit großer Wirkung auf die Glaubwürdigkeit.
2. **„In Lochau ausgestellt“ als Filter und Badge.** Kein Pure Player (Connox, AmbienteDirect) kann das bieten. Es macht den Showroom online sichtbar und erzeugt Termine mit konkretem Anlass.
3. **Ausstellungsstücke dreifach verwerten:** eigener Atelierverkauf, dazu Marktplätze für Reichweite und dann Circle (Kommission, Inzahlungnahme, siehe 23 Nr. 3).
4. **Einstiegsprodukte als Lead-Kanal mit positivem Deckungsbeitrag.** Jeder Kerzen- oder Gutscheinkäufer ist ein Kontakt mit Adresse und Einwilligung, der später Sofa oder Küche kauft (10, Kurzfazit 1).
5. **Hotel/Contract als B2B-Shop-Kunde.** Kerzen, Akkuleuchten, Bettwäsche, Heizstrahler und Schirme werden in Hotels in Mengen gekauft und nachgekauft. Ein Trade-Konto mit Staffelpreisen ist ein Wiederkauf-Motor neben dem FF&E-Projekt.
6. **Ezarri-Musterbox als Einstiegsprodukt.** Platzhirsch ist Vertragshändler. Eine kostenpflichtige Musterbox (Betrag beim Kauf gutgeschrieben) qualifiziert Pool- und Bad-Leads besser als ein Gratis-Formular [Preis: Inhaber].

### 2.3 Marktplätze und Fremdmodelle

| Modell | Bewertung | Empfehlung |
|---|---|---|
| **AmbienteDirect / Connox** (Pure Player mit Preis, Lieferzeit, Rabatt unter UVP) | Preisvergleich bei Leuchten verloren (Flos −15 %, Louis Poulsen PH 5 −27 % laut 11 [Q-11/S6,S7]). Lieferzeit-Anzeigen werden dort laut Kundenstimmen teils als zu optimistisch erlebt [Q4, Einzelstimme]. | **Datenqualität übernehmen, Preiskampf nicht.** Übernehmen: Variante, Lieferzeit als ehrliche Spanne, Pflegehinweise, Versandklasse. Nicht übernehmen: Rabatte. Leuchten zur UVP, dafür mit Lichtberatung, Montage, Abholung und CHF-Lieferung. |
| **Pamono** (Galerien, Händler; Ausstellungsstücke, Vintage, Klassiker) | Nur professionelle Verkäufer. Die Provision ist nicht öffentlich, eine belastbare Quelle dafür fand dieses Gremium nicht [Q3]. 11 nennt 5–30 % (nicht verifiziert). | **Ja, für Ausstellungsstücke ab ca. 1.500 €.** Konditionen direkt anfragen. Vorher in den Händlerverträgen prüfen, ob der Verkauf über Plattformen erlaubt ist (Plattformverbote sind nach Vertikal-GVO zulässig, 11 [S2,S3]). |
| **1stDibs** | Abo plus Provision (11 [S27]). Publikum für hochpreisige Einzelstücke. | **Optional, nur für Stücke über 5.000 €** und erst nach einem Pamono-Test. |
| **Deesup** (Mailand; Ex-Display und Pre-loved, Logistik in Europa) | Käufer verhandeln bis −30 % [Q5]. Die Provision ist nicht öffentlich. Italienisches Publikum für Minotti und Poliform. | **Ja, Test mit 3–5 Stücken.** Die Verhandlungsspanne von vornherein in den Mindestpreis einrechnen. |
| **Amazon, Otto, Kaufland** | Bei Premiummarken droht Markenschaden, und Plattformverbote der Hersteller sind zulässig (11). | **Nein.** |
| **Google Merchant Center** (kostenlose Einträge, später Shopping-Anzeigen) | Braucht Preis, Verfügbarkeit, GTIN/Marke und Versandkosten. | **Ja, ab Stufe 1b** für Ausstellungsstücke und Einstiegsprodukte. |

---

## 3. FERTIGE Bausteine

### 3.1 Shop-Strategie in drei Stufen

**Grundsatz:** Jede Stufe zahlt die nächste. Stufe 1 braucht kein neues Kapital, keine Online-Zahlung und keine neue Marke. Stufe 2 startet erst nach der Freigabe durch den Insolvenzrechtler bzw. in der neuen Handels-GmbH (23, Gate 0). Stufe 3 setzt Backoffice-Felder und Circle voraus.

#### Stufe 1: „Zeigen, reservieren, abholen“ (ab sofort bis ca. Ende Januar 2027)

| Ziel | Liquidität aus Ausstellungsstücken, Advent-Umsatz mit Gutscheinen und Einstiegsprodukten, ehrliche Produktseiten |
|---|---|
| Kaufweg | **Reservierungsanfrage**, keine Bestellung. Der Kunde reserviert online (bestehender Weg über `/api/atelier_reservierung` bzw. `anfrage_produkt`). Platzhirsch bestätigt per Telefon oder E-Mail. Bezahlt wird **im Showroom** (Karte/bar) oder per Rechnung bei Abholung bzw. Lieferung. Online kommt kein Vertrag zustande. So bleibt es im Rahmen der Inhaber-Entscheidung „keine echten Zahlungen online“. |
| Sortiment | (a) Ausstellungsstücke: Atelierverkauf an, Start mit allen inventarisierten Stücken. (b) Gutscheine: nach Freigabe der Gutscheinbedingungen im Modus „anfrage“. (c) Einstiegsprodukte: Liste 3.2, Stufe-1-Spalte, rund 40–80 SKUs aus dem vorhandenen Backoffice-Bestand. |
| Preise | Ausstellungsstücke mit Preis (Regeln aus `priceRules.js`: inkl. USt, „zzgl. Lieferung nach Aufwand“, „Standort: Showroom Lochau“, keine Streichpreise). Einstiegsprodukte mit Preis **nur nach Freigabe [Inhaber]**. Bis dahin „Im Showroom erhältlich, Preis im Showroom“ statt „abhängig von Ausführung und Bezug“. |
| Seiten-Änderungen | Produkttyp-Schablonen (3.3), Badge und Filter „In Lochau ausgestellt“ (Feld `im_showroom`), Atelier-Teaser auf `/de/produkte` und auf Markenseiten, DE-Produktnamen für Einstiegsprodukte. |
| Marktplätze | Pamono und Deesup: Händlerkonto anlegen, 3–5 Ausstellungsstücke als Test (Inhaber, ohne Code). |
| Kosten | 0–3 T€ (Fotos mit eigenem Gerät, Code-Team intern) [Schätzung] |
| Umsatzerwartung | Ausstellungsstücke: 100–300 T€ Liquidität in 3–6 Monaten (aus 23, [Schätzung]). Gutscheine: 5–20 T€ bis Weihnachten (07, [Schätzung]). Einstiegsprodukte im Showroom mit Online-Anstoß: 10–30 T€ bis Jahresende [Schätzung; 10 nennt 35–55 T€ inkl. Gutscheinen und Firmengeschenken]. |
| Ausstiegskriterium | Mindestens 30 Reservierungen bzw. Anfragen über Einstiegsprodukte und Atelier. Inventur abgeschlossen. Insolvenzrechtler hat zu Online-Zahlungen Stellung genommen. |

#### Stufe 2: „Paketware online kaufen“ (ca. Februar bis Juni 2027, nach Rechtsfreigabe)

| Ziel | Echter Online-Verkauf von 150–250 paketfähigen SKUs nach AT und DE, Gutscheine mit Sofortzahlung, Anzahlungen per Zahlungslink |
|---|---|
| Technik | Schlanker eigener Checkout auf **Stripe Checkout** (gehostete Seite; Karte, Apple/Google Pay, EPS, Klarna, PayPal, TWINT). Empfehlung aus 07, Abschnitt Kurzfassung 2: kein zweites Shopsystem. **Hybrid-Merkliste:** Positionen getrennt in „Jetzt kaufen“ (Paketware mit Preis) und „Anfragen“ (alles andere). |
| Sortiment | Liste 3.2, Spalte Stufe 2. Rund 40 % Kerzen, Duft und Textil, 30 % Leuchten zur UVP, 20 % Outdoor-Zubehör (saisonal), 10 % Einzelstücke (Verteilung aus 11, [Schätzung]). |
| Versand | Drei Versandklassen: **P** Paket (Post/DHL), **S** Sperrgut/Spedition, **M** Lieferung mit Montage (Kunde vereinbart Termin). Abholung in Lochau kostenlos. Versandkosten pauschal je Klasse, die Beträge legt der Inhaber nach Angeboten fest [Inhaber]. |
| Recht (vor Start) | AGB und Widerrufsbelehrung (Entwurf in `recht/01-agb-entwurf.md`, anwaltliche Freigabe nötig), Seite „Versand und Zahlung“, Preisangaben mit 30-Tage-Regel bei jeder Ermäßigung (§ 9a PrAG [Q2]; vorerst gibt es keine Ermäßigungen). **Barrierefreiheit:** Das BaFG gilt für Online-Shops, die Kleinstunternehmen-Ausnahme nur unter 10 Beschäftigten **und** höchstens 2 Mio. € Umsatz oder Bilanzsumme [Q1]. Ob Platzhirsch samt Café darunter fällt, ist [prüfen]. Vorsorglich gilt WCAG 2.1 AA (EN 301 549). **Produktsicherheit (GPSR, VO (EU) 2023/988):** Online-Angebote brauchen Herstellername und -anschrift, Produktkennung und Warnhinweise. Duftkerzen tragen oft CLP-Allergenhinweise [prüfen]. |
| Marketing | Merchant-Center-Feed (Einstiegsprodukte, Ausstellungsstücke), GA4-E-Commerce-Events, Newsletter-Flow „Danke für Ihren Kauf“ → „Pflege und Nachfüller“ → Einladung zum Abend im Showroom. |
| Kosten | Code 3–8 T€ extern bzw. intern, Anwalt 1,5–4 T€, Warenbestand 10–25 T€ EK nur mit Zahlungsziel (Faire/Ankorstore oder bestehende Konten) [alle Schätzung]. Zahlungsgebühren rund 1,5–3 % je nach Zahlart [Schätzung, Stripe-Preisliste prüfen]. |
| Umsatzerwartung | 80–250 T€ im ersten Jahr für den Online-Teil von Paketware und Gutscheinen [Schätzung; Spanne aus 10 (80–135 T€) und 11 (0,23 Mio. € nur Kerzen/Accessoires bei 1.500 Bestellungen à 150 €)]. |
| Ausstiegskriterium | Mindestens 100 Online-Bestellungen. Retourenquote und Bruch gemessen. Backoffice-Felder aus 3.4 sind live. |

#### Stufe 3: „Beraten kaufen, überall im Dreiländereck“ (ab ca. Juli 2027)

| Baustein | Inhalt |
|---|---|
| **„Preis ab“ für Konfigurationsware** | Nur wo der Hersteller es erlaubt [Inhaber/Hersteller]. Beispiele: Minotti-Beistelltische, ClassiCon-Kleinmöbel. Text: „ab 2.490 € in der abgebildeten Ausführung, inkl. USt“. Das Sofaplaner-Ergebnis erzeugt einen Richtpreis mit Gültigkeit und einen Termin-Link. |
| **CH/FL-Kaufweg** | Preise in CHF netto plus 8,1 % MWST, verzollt geliefert (DDP), TWINT. Setzt Unterstellungserklärung bei der ESTV und einen Steuervertreter voraus (11, 4.3) [prüfen]. |
| **Platzhirsch Circle** | Inzahlungnahme und Kommission von Kundenstücken mit Produktpass (Pflegehistorie, Herkunft). Verkauf über Atelier, Pamono und Deesup. Ohne Rückkaufgarantie in der Bilanz (23, Nr. 3). |
| **Trade-Konto** | Für Architekten, Hotels, Gastronomie und Yachtausbauer: Staffelpreise auf Paketware, Sammelrechnung, Projektordner im Portal (`/de/portal`), Nachkauf per Klick (Kerzen, Bettwäsche, Akkuleuchten). |
| **Abo und Nachkauf** | Duft-Nachfüller, Kerzen-Abo für Hotel-Lobbys, Pflegesets 6 und 12 Monate nach der Lieferung (aus 10). |
| **Anzahlung online** | 30–50 % per Zahlungslink. Nur mit abgesicherter Anzahlung (23, Nr. 1) [prüfen]. |
| Umsatzerwartung | Shop gesamt inkl. Einzelstücke 0,5–1,0 Mio. € p. a. im Jahr 2 (11, Abschn. 9, [Schätzung]). Der Masterplan setzt konservativ 0,1–0,2 Mio. € an (23, Zeile 12). **Planungsgrundlage ist der konservative Wert.** Der größere Hebel bleibt indirekt: Leads für Sofa, Küche und Projekt. |

### 3.2 Sortimentsliste „Einstiegsprodukte“

Preise sind Marktpreise aus 11 und 10 mit der dort genannten Quelle, keine Platzhirsch-Preise. Der endgültige VK ist **[Inhaber]**. „BO“ = schon im Backoffice. Stufe 1 = reservieren und im Showroom kaufen, Stufe 2 = online kaufbar. Händler-Aussage nur bei ClassiCon und Ezarri.

| # | Produkt / Gruppe | Marke | Marktpreis (Quelle) | Status | Stufe | Rolle im Sortiment | Versandklasse |
|---|---|---|---|---|---|---|---|
| E1 | Geschenkgutschein Wert (frei wählbar, ab 50 €) | Platzhirsch | frei | gebaut, aus | 1 (Anfrage) → 2 | Advent, Neukunden, Vorauszahlung | digital/PDF |
| E2 | Erlebnisgutschein „Abend im Showroom“ (Café plus Beratung) | Platzhirsch | [Inhaber] | NEU | 1 → 2 | Brücke zum Termin | digital |
| E3 | Duftkerze Les Exclusives Aurum (9 cm) | Baobab Collection | 59,99 € (Breuninger, 11 S37) | BO | 1 | Einstieg, Mitbringsel | P |
| E4 | Duftkerze Feathers MAX16 | Baobab Collection | 131,99 € (11 S37) | BO | 1 | Geschenk mittel | P |
| E5 | Großformat 24 cm | Baobab Collection | 244,99 € (11 S37) | BO | 1 | Signature, Hotel-Lobby | P (bruchsicher) |
| E6 | Nachfüller und Diffusoren | Baobab Collection | Preis prüfen | BO erweitern | 2 | Wiederkauf, Abo | P |
| E7 | Deko-Objekte, Vasen, Schalen | 101 Copenhagen | Preis prüfen | BO (20 Deko) | 1 | Japandi-Einstieg | P |
| E8 | Bettwäsche, Plaids (Kaschmir) | Alonpi | Preis prüfen | BO (20) | 1 | Geschenk, Hotel-Set | P |
| E9 | Topper, Bettwäsche | Tréca Paris | Preis prüfen | BO (9) | 1 | Nachkauf nach Bettenkauf | P/S |
| E10 | Bellhop Battery (Akkuleuchte) | Flos | UVP 300 € (11 S8) | BO | 1 → 2 | Terrasse, Hotel, Geschenk; zur UVP | P |
| E11 | Mini Glo-Ball Wand | Flos | ca. 140 € Marktpreis (11 S9) | BO | 2 | günstiger Leuchten-Einstieg | P |
| E12 | IC Lights T1 Low | Flos | ca. 548 € RRP (11 S32) | BO | 2 | Ikone, Cross-Sell zum Sofa | P |
| E13 | Melt Portable / Tom Dixon Scent | Tom Dixon | Melt Large 1.308 € (11 S36) | LEER, einpflegen | 2 | Akku, Duft | P |
| E14 | Heizstrahler | Heatsail | Preis prüfen | BO (12) | 1 (saisonal März–Mai, Sep–Nov) | Outdoor-Einstieg, Gastro | S |
| E15 | Schirmzubehör (Sockel, Hülle, Licht) | Umbrosa | Preis prüfen | BO erweitern | 2 | Nachkauf ohne Preisvergleich | P/S |
| E16 | Spiegel und Accessoires | Eichholtz | Preis prüfen | BO (8 Spiegel) | 2 | Lager beim Hersteller | S |
| E17 | Bell Side Table | **ClassiCon** (Vertragshändler) | 2.490 € (AmbienteDirect, 11 S46) | BO | 1 → 2 | Ikone, Einstieg in die Möbelwelt | S |
| E18 | Spiegel, Deko, Teppiche (Auswahl) | **ClassiCon** | Preis prüfen | BO | 2 (Teppiche: M) | Kleinmöbel mit Händler-Sicherheit | S |
| E19 | Ezarri-Musterbox (Mosaik-Muster nach Wahl, Betrag bei Auftrag gutgeschrieben) | **Ezarri** (Vertragshändler) | [Inhaber] | NEU | 1 | qualifiziert Pool-, Bad- und Wellness-Leads | P |
| E20 | Pflegeset Leder/Holz/Outdoor | Hersteller-Pflegelinien [Lieferant prüfen] | Preis prüfen | NEU | 1 (bei Übergabe) → 2 | Nachkauf-Automatik | P |
| E21 | Tischfeuer Spin 120 und Nachfülldosen | höfats | UVP 139 €, Dose ab ca. 19 € (11 S40) | NEU (Händlerkonto) | 2 | Terrasse, Nachkauf | P |
| E22 | Kerzen und Kerzenhalter | Ester & Erik | Preis prüfen (Faire, 11 S14) | NEU | 1 (über Faire, Zahlungsziel) | Tischdeko, Farbe | P |
| E23 | Regionale Linie: Riedel, Gmundner Keramik, Werkraum Bregenzerwald | diverse | Preis prüfen (10, Q9–Q13) | NEU | 2 | „Österreich-Luxus“, Firmengeschenke | P |
| E24 | Firmengeschenk-Box (Kerze + Textil + Karte) | Zusammenstellung | [Inhaber] | NEU | 1 (B2B-Anfrage) | Q4-B2B, siehe `marketing/firmengeschenke-advent-2026.md` | P |
| E25 | Planungsdaten-Paket (CAD, Zeichnung) zu einem Produkt | Platzhirsch | heute kostenlos über `planningRequest` | gebaut | 1 | Architekten-Lead | digital |

**Nicht** ins Einstiegssortiment gehören Leuchten-Bestseller mit hohem Online-Rabatt ohne Montagebedarf (z. B. PH 5), Diptyque (Douglas-Preisvergleich, 10) und Amazon-Ware.

### 3.3 Produktseiten-Texte nach Produkttyp (direkt einsetzbar, ersetzt die eine Schablone)

**Typ K: Konfigurationsware** (Sofas, Betten, Küchen, Tische nach Maß; Standard für Minotti, Poliform, Rimadesio usw.)
- Primärknopf: „In Lochau ansehen – Termin wählen“ (bleibt)
- Unterzeile: „Probesitzen, Bezüge vergleichen und die Maße für Ihren Raum klären – nach Termin, ohne Eile.“ (bleibt, nur noch bei Polstermöbeln. Für Tische/Küchen: „Oberflächen vergleichen und die Maße für Ihren Raum klären – nach Termin, ohne Eile.“)
- Preis: „Auf Anfrage – abhängig von Ausführung und Bezug“ (Bezug nur bei Polster. Sonst: „Auf Anfrage – abhängig von Ausführung und Maß“)
- Lieferung: Text laut Inhaber-Entscheidung 3 (bleibt)

**Typ L: Lagerware / Einstiegsprodukt** (Kerzen, Deko, Textil, Akkuleuchten, Heizer, Zubehör)
- Primärknopf Stufe 1: „Reservieren und in Lochau abholen“, Stufe 2: „In den Warenkorb“
- Sekundär: „Merken“, „Anrufen“
- Preis (nach Freigabe): „59,99 € inkl. USt“ + Zeile „zzgl. Versand – Abholung in Lochau kostenlos“. Vor der Freigabe: „Im Showroom erhältlich – Preis nennen wir Ihnen gern“.
- Verfügbarkeit (aus Feld `verfuegbarkeit`): „In Lochau vorrätig“ / „Bestellbar, Lieferzeit ca. 1–2 Wochen“ / „Derzeit nicht vorrätig – wir sagen Ihnen Bescheid“
- Hinweisblock: „Passt zu“ mit 2–3 Möbeln aus derselben Welt (Cross-Sell zum Termin)

**Typ E: Einzelstück** (Ausstellungsstück, Circle)
- Primärknopf: „Stück reservieren“ (bestehende Atelier-Reservierung)
- Preis: Betrag inkl. USt + „zzgl. Lieferung nach Aufwand“ + „Standort: Showroom Lochau“ (aus `priceRules.js`)
- Zustand: aus dem Feld `zustand`, ohne „wie neu/neuwertig“ (verbotene Wörter laut priceRules)
- Badge: „Einzelstück“

### 3.4 Anforderungen ans Backoffice (Frappe, Doctype „Produkte New“ und neue Doctypes)

**A. Neue Felder am Produkt** (Pflicht = für Typ L/E nötig, bevor ein Preis erscheint)

| Feld | Typ | Pflicht | Zweck |
|---|---|---|---|
| `produkt_typ` | Select K / L / E | ja, alle | steuert Textschablone, Knopf und Preislogik (3.3) |
| `shop_freigabe` | Check | L/E | ohne Haken kein Preis, kein Kaufknopf |
| `hersteller_online_freigabe` | Check + Datum + Notiz | L/E | Nachweis, dass der Händlervertrag Online-Preis bzw. Online-Verkauf erlaubt |
| `preis_eur_brutto` | Currency | L/E | VK inkl. 20 % USt (AT) |
| `preis_chf` | Currency | Stufe 3 | CH-Preis netto + MWST |
| `preis_ab` | Check | K (Stufe 3) | „ab“-Darstellung |
| `uvp_eur`, `uvp_stand`, `uvp_quelle` | Currency, Date, Data | optional | UVP nur mit Beleg (priceRules) |
| `verfuegbarkeit` | Select: vorraetig_lochau / im_showroom_ausgestellt / bestellbar / nicht_lieferbar | L/E | Filter, Badge, `offers.availability` |
| `bestand` | Int | L | Stückzahl Kleinlager Lochau |
| `lieferzeit_min_tage`, `lieferzeit_max_tage` | Int | L | Spanne statt Versprechen |
| `versandklasse` | Select P / S / M / nur_abholung | L/E | Versandkosten und Checkout |
| `gewicht_kg`, `paketmasse_cm` | Float, Data | L | Versandlabel |
| `gtin` (EAN), `mpn` | Data | L | Merchant Center |
| `hs_code`, `ursprungsland` | Data | L (Stufe 3) | CH-DDP-Zoll |
| `gpsr_hersteller_name`, `gpsr_hersteller_adresse`, `gpsr_hersteller_email`, `gpsr_eu_verantwortlicher` | Data/Text | L/E | Pflichtangaben im Online-Angebot (GPSR) [prüfen] |
| `sicherheitshinweise` | Text (DE/EN/FR/IT) | L wo nötig | z. B. Kerzen-Warnhinweise und Allergene (CLP) [prüfen] |
| `im_showroom` | Check | alle | Filter „In Lochau ausgestellt“ |
| `produkt_name_de` + `path_field_de` | Data | Typ L zuerst | deutsche Namen und Slugs (B2). Alte Slugs als `alias_slugs` für 301 |
| `bildrecht_status` | Select: frei / hersteller_freigabe / eigenes_foto / gesperrt | alle | Bilder ohne Freigabe nicht ausspielen |
| `cross_sell` | Table → Produkte New | L | „Passt zu“ |

**B. Preis-Historie** (neuer Doctype `Preis Historie`: Produkt, Preis, gültig ab, Kanal). Sie ist Voraussetzung für jede spätere Ermäßigungsangabe nach § 9a PrAG (niedrigster Preis der letzten 30 Tage im selben Kanal [Q2]). Ohne Historie gibt es keine Ermäßigungsangabe (so bereits in priceRules).

**C. Neue Doctypes / Workflows**

| Doctype | Felder (Kern) | Ablauf |
|---|---|---|
| `Atelier Stueck` (löst das Google Sheet ab) | wie CSV-Spalten in `atelierSource.js` + EK (intern), Ausstellungsbeginn, Mindestpreis Marktplatz, Kanal (eigen/Pamono/Deesup/1stDibs) | verfügbar → reserviert (48 h) → verkauft. Ein Webhook entfernt das Stück **auf allen Kanälen** (Doppelverkauf verhindern) |
| `Reservierung` | Produkt/Stück, Kunde, Kanal, Ablaufzeit, Status | automatische Freigabe nach 48 h, E-Mail an Verkauf |
| `Gutschein` | Code, Wert, Restwert, Ausgabedatum, Bezahlstatus, ohne Ablaufdatum | Einlösung im Showroom und später online, Restwert-Abfrage |
| `Bestellung` (Stufe 2) | Positionen, Versandklasse, Land, Steuer, Zahlungsstatus (aus Stripe-Webhook), Versandnummer | bezahlt → kommissioniert → versandt/abgeholt. Widerruf mit Frist |
| `Trade Konto` (Stufe 3) | Firma, UID, Staffel, Ansprechpartner, Projekte | Freigabe durch Verkauf |

**D. Rollen und Pflege**
- Rolle „Shop-Pflege“: darf Preise, Bestand und Freigaben setzen. Jede Preisänderung schreibt automatisch in die Preis-Historie.
- Pflicht-Prüfliste vor `shop_freigabe`: Preis, Verfügbarkeit, Versandklasse, Gewicht, GPSR-Felder, Bildrecht und DE-Name sind gesetzt. Fehlt etwas, verweigert das Backoffice den Haken.
- Revalidierung: Webhook vom Backoffice an die bestehenden `src/app/revalidate/*`-Routen bei Preis-, Bestands- und Statuswechsel.
- Lesbarkeit für die Website: Die neuen Felder kommen in die Gast-Endpunkte (`get_produkte_by_kategorie`, Detail per `path_field`). Der EK bleibt intern und erscheint **nie** in einem Gast-Endpunkt.

**E. Website-Seite (Code-Team, nach den Backoffice-Feldern)**
- `toShopProduct()` / `toShopProductDetail()` um die Felder erweitern. Preis nur bei `shop_freigabe`.
- JSON-LD `offers` (price, priceCurrency, availability, shippingDetails) nur bei Typ L/E mit Preis.
- Filter `im_showroom` und `verfuegbarkeit`, Sortierung „Neu im Showroom“, ab Stufe 2 Preisband.
- Merchant-Feed als Route Handler im Muster der bestehenden `sitemap-*.xml`.

---

## 4. Maßnahmen-Tabelle

Umsatzeffekte sind **Schätzungen** und mit der Herleitung angegeben.

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| **P0** | Inventur der Ausstellungsstücke, Preise nach Preisregel festlegen, `ATELIER_MODE=anfrage` setzen, Atelier im Menü und auf `/de/produkte` verlinken | M | 0–1 T€ (Fotos) | 100–300 T€ Liquidität in 3–6 Monaten (23, Zeilen 27/434). Die Seite ist gebaut, es fehlt nur die Ware. | Inhaber (Inventur, Preise), Code-Team (Schalter, Verlinkung) |
| **P0** | Gutscheinbedingungen anwaltlich freigeben, danach `VOUCHER_MODE=anfrage` (Bezahlung im Showroom oder per Überweisung nach Bestätigung, [prüfen]) | S | 0,5–1,5 T€ Anwalt | 5–20 T€ bis Weihnachten (07). Vorauszahlung = Liquidität. | Inhaber + Kanzlei, Code-Team |
| **P0** | Textschablone nach Produkttyp (3.3): Kerze, Deko und Textil nicht mehr mit „Bezug“ und „Probesitzen“ | S | intern | Glaubwürdigkeit. Hebt die Anfragequote bei Kleinteilen (heute praktisch 0, weil der Weg nicht passt). Nicht bezifferbar. | Code-Team |
| **P1** | Feld `im_showroom` + Badge und Filter „In Lochau ausgestellt“ | S–M | intern + Pflege ca. 2 Tage | Mehr Termine mit konkretem Anlass. USP gegen Pure Player. [Schätzung: +10–20 % Terminanfragen aus dem Katalog, testen] | Inhaber (Pflege), Code-Team |
| **P1** | Preisfreigabe für 40–80 Einstiegsprodukte (Liste 3.2, Stufe 1) und „Reservieren und abholen“ | M | 10–15 T€ Ware nur mit Zahlungsziel | 10–30 T€ bis Jahresende, jeder Käufer wird Kontakt [Schätzung, 10] | Inhaber [Entscheidung Preise], Code-Team |
| **P1** | Pamono- und Deesup-Händlerkonto, 3–5 Stücke testen (vorher Händlerverträge auf Plattformklauseln prüfen) | S | Provision nur bei Verkauf | Reichweite für Stücke, die lokal nicht weggehen. 2–5 Verkäufe in 3 Monaten [Schätzung] | Inhaber |
| **P1** | Ezarri-Musterbox als bezahlbares Einstiegsprodukt (Gutschrift bei Auftrag) | S | Muster vom Hersteller [prüfen] | Bessere Pool- und Bad-Leads. Bei 2 Aufträgen pro Quartal über die Box: hohe fünfstellige Projektwerte [Schätzung] | Inhaber, Ezarri-Team |
| **P1** | Backoffice-Felder Block A + Preis-Historie (3.4) | M | 2–5 T€ Frappe-Entwicklung [Schätzung] | Voraussetzung für Stufe 2 und Google Shopping | Partner (Frappe), Inhaber |
| **P2** | DE-Produktnamen und -Slugs für Typ L mit 301-Weiterleitungen (mit SEO-Gremium abstimmen) | M | intern | Sichtbarkeit bei „… kaufen“-Suchen in AT/DE [nicht bezifferbar] | Code-Team, Inhaber (Pflege) |
| **P2** | Stufe 2: Stripe Checkout für Paketware, Hybrid-Merkliste, Versandklassen, AGB/Widerruf/Versandseite, GPSR-Angaben | L | 3–8 T€ + 1,5–4 T€ Anwalt | 80–250 T€ p. a. Online-Umsatz [Schätzung, 10/11] | Code-Team, Kanzlei, Inhaber (erst nach Insolvenzrechtler) |
| **P2** | JSON-LD `offers` + Merchant-Center-Feed (Einstiegsprodukte, Ausstellungsstücke) | M | intern | Kostenlose Shopping-Einträge, ein Feld ohne regionale Konkurrenz (07, 25) | Code-Team |
| **P2** | Barrierefreiheit vor Start Stufe 2: Klärung BaFG-Anwendbarkeit, Check nach WCAG 2.1 AA für Warenkorb und Checkout | M | 1–3 T€ Prüfung | Risikominderung (Abmahnung, Behörde) | Kanzlei, Code-Team |
| **P3** | Trade-Konto für Hotels, Gastro, Architekten mit Staffelpreisen und Nachkauf | L | 3–6 T€ | Wiederkauf aus Contract-Projekten [Schätzung: 20–60 T€ p. a. pro aktivem Hotelkunden mit Kerzen/Textil] | Code-Team, Verkauf |
| **P3** | CH-Kaufweg (CHF, DDP, TWINT) | L | Steuervertreter + 2–5 T€ | Rund 10 % Preisvorteil für CH-Kunden (11, 4.2) | Steuerberater, Code-Team |
| **P3** | Circle: Kommission und Inzahlungnahme mit Produktpass | L | Pilot mit 20 Stücken | 0,2–0,6 Mio. € p. a. plus Neukäufe (23 Nr. 3, [Schätzung]) | Inhaber, Code-Team |
| **P3** | Duft-Abo und Pflege-Nachkauf-Mails (6/12 Monate) | M | intern | Wiederkauf, Customer Lifetime Value [nicht bezifferbar] | CRM-Team |

---

## Quellen (neu recherchiert am 28.10.2026)

- [Q1] WKO – Barrierefreiheitsgesetz im E-Commerce (FAQ): https://www.wko.at/internetrecht/barrierefreiheitsgesetz-im-e-commerce-faq ; WKO OÖ – Neue Regeln zur Barrierefreiheit: https://www.wko.at/ooe/news/neue-regeln-zur-barrierefreiheit ; USP – BaFG: https://www.usp.gv.at/themen/betrieb-und-umwelt/nachhaltigkeit/BaFG.html
- [Q2] WKO – Änderungen in § 9a Preisauszeichnungsgesetz: https://www.wko.at/handel/elektro-einrichtungsfachhandel/aenderungen-in-9a-preisauszeichnungsgesetz ; WKO NÖ – E-Commerce-Rechtsfrage (EuGH C-330/23): https://www.wko.at/noe/e-commerce/e-commerce-rechtsfrage-9
- [Q3] Pamono-Provision: keine öffentliche Quelle gefunden (Suche 28.10.2026). Händlerquellen: https://startups.one.gob.es/companies/pamono . Affiliate-Satz (keine Händlerprovision): https://flexoffers.com/?p=81547
- [Q4] Trusted Shops – AmbienteDirect-Bewertungen (Lieferzeit-Kritik, Einzelstimmen): https://www.trustedshops.de/bewertung/info_XA5B024F0C56B218E78F5A2B7B1DE0BD5.html
- [Q5] Preqin – Deesup-Profil (Ex-Display, Logistik, Verhandlung bis −30 %): https://www.preqin.com/data/profile/asset/deesup/455515
- Alle mit „11 S…“ und „10 Q…“ markierten Preise: Quellenlisten in `Marktresearch/11-shop-sortiment-hersteller.md` und `Marktresearch/10-zubehoer-kerzen-duefte-geschenke.md`.
- GPSR (VO (EU) 2023/988, gilt seit 13.12.2024) und CLP-Hinweise für Duftkerzen: aus eigener Kenntnis, **nicht neu recherchiert** [prüfen].
