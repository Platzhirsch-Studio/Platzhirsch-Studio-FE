# Meta- und Pinterest-Kampagnen: Konzept und fertige Anzeigentexte

**Stand:** 26.10.2026 · **Status: ENTWURF, nichts davon ist gebucht, veröffentlicht oder eingerichtet.**
**Grundlage:** digital/10 (Performance Marketing, v. a. 4a.1, 4a.4, 4a.5, 4a.7, 4a.8, 5.2), digital/12 (Markenstimme „Der Gastgeber“, Glossar, Fotostil „Seelicht“, Content-Kalender), 00, 23 (Abschn. 5, 9, 100-Tage-Plan), 26 (Binni).
**Kennzeichnung:** [belegt] = in den Berichten oder per Abruf geprüft · [Schätzung] = eigene Herleitung · [prüfen] = vor Livegang klären · `[PLATZHALTER]` = Wert, den das Team eintragen muss. Keine Rechtsberatung.

---

## 0. Spielregeln vor jeder Anzeige

### 0.1 Vorbedingungen (ohne diese keine bezahlte Ausspielung)

| # | Vorbedingung | Quelle | Status |
|---|---|---|---|
| V1 | **Gate 0** (Fortbestehensprognose, Liquiditätsplan) erfüllt, Budget freigegeben | 23/1, 10/Vorbedingung | offen |
| V2 | Consent-Banner um **Meta Pixel** und **Pinterest Tag** erweitert (heute enthält die Kategorie „Marketing“ nur Google Ads) | 10/F1 [belegt im Code: `src/components/Cookies/cookiecomponent.js`] | offen |
| V3 | Pixel, Tag und **CAPI laden bzw. senden nur nach Marketing-Einwilligung**. Ohne Consent: kein Pixel, kein Server-Event, keine gehashten Daten | 10/F3 | offen |
| V4 | Joint-Controller-Addendum Meta akzeptiert, Pinterest-AVV/Terms geprüft, Datenschutzerklärung um beide Dienste ergänzt, Verzeichnis der Verarbeitungstätigkeiten aktualisiert | 10/5.2 | offen |
| V5 | Business-Konten im **Firmenbesitz** (nicht Agentur), zweite Admin-Person, Passwort-Manager | 10/5.3 | offen (Konten werden nicht von uns angelegt) |
| V6 | Zielseiten live (siehe je Anzeige) | 10/F6 | teilweise |
| V7 | **Eigene Fotos/Videos** aus dem Showroom; Herstellerbilder nur mit schriftlicher Freigabe | 10/5.2, 12/C6 | offen |
| V8 | Inhaber gibt jeden Anzeigentext frei (Freigabeliste unten) | 10/5.2 | offen |

**Was ohne Pixel trotzdem geht (datenschutzfreundlich):** Meta Lead Ads (Formular läuft auf Meta, Daten kommen per Download/Webhook), Engagement-Zielgruppen aus Instagram/Facebook (Profil-Interaktion, Video-Views), Pinterest organisch. Damit kann Stufe 1 auch starten, wenn V2/V3 noch nicht live sind. Website-Retargeting und Website-Conversions erst nach V2/V3.

### 0.2 Verbotene und erlaubte Formulierungen (verbindlich, aus 12/3.1 und 10/4a.3)

| Verboten | Erlaubt |
|---|---|
| „offizieller / autorisierter Händler“, „Vertragshändler“, „Minotti-Händler“, „Minotti Store“, „offizieller Partner“ | „Minotti-Ausstellung in Lochau“, „Minotti im Showroom erleben“, „wir beraten zu Minotti“ |
| „Nr. 1“, „größte …“, „bester …“, „einzigartig“, „Traum…“ | konkrete Fakten: Ort, Öffnungszeiten, Ablauf, Materialien |
| erfundene Rabatte, Streichpreise ohne Referenzpreis (Omnibus: niedrigster Preis der letzten 30 Tage) | echte Preise der Ausstellungsstücke, inkl. MWST, aus der Inventurliste |
| „Made in Italy“ für die Binni-Linie, Herkunft verschleiern | „gefertigt von unserem Manufakturpartner Binni im Kosovo“ |
| „Anzahlung abgesichert“, „0 %-Finanzierung“, „CHF-Festpreis inkl. Verzollung“, solange es kein Angebot dazu gibt | Wege A/B für CH/FL (Selbstabholung mit Tax-Free, Lieferung ohne Einbau), sobald die CH/FL-Seite live ist |
| Kundenstimmen, Referenzen, Projektfotos ohne schriftliche Einwilligung | eigene Showroom-Aufnahmen, Team, Café |
| Wettbewerbernamen im Text oder als Keyword/Interesse | – |
| „Dolce Vita“ als Stimmungswort (Wettbewerbername) | „italienisch wohnen“ |

**Anrede immer „Sie“**, ruhig, keine Ausrufezeichen, ein Gedanke pro Satz. Schweiz-Varianten (de-CH): kein „ß“, „Offerte“, „Schreiner“, „MWST“.

### 0.3 Platzhalter, die vor dem Livegang zu füllen sind

| Platzhalter | Bedeutung | Quelle/Verantwortung |
|---|---|---|
| `[ÖFFNUNGSZEITEN]` | Heute Samstag 10–14 Uhr [belegt, 23]. Test Samstag bis 17, Donnerstag bis 20 Uhr ab KW 46 ist **geplant**, nicht bestätigt | Inhaber |
| `[ADVENTSABEND]` | Do 26.11.2026, Uhrzeit, Anmeldung, Plätze | Inhaber |
| `[GUTSCHEIN-URL]` | Gutschein-Shop (geplant KW 45) | Web |
| `[ATELIER-STÜCK]`, `[PREIS]`, `[MASSE]` | echte Ausstellungsstücke mit Endpreis inkl. MWST | Verkauf, Inventur KW 46 |
| `[BINNI-AB-PREIS]` | Preisbeispiel einer konkreten Küchenplanung, erst nach Preisliste von Binni | Inhaber (26/5.1) |
| `[FRÜHBUCHER-KONDITION]` | was Frühbucher konkret bekommen (Termin, Lieferfenster, ggf. Konditionen) | Inhaber |
| `[FAHRZEIT-LINDAU]` | „5 Minuten von Lindau“ steht in 23/10; mit Routenplaner verifizieren (Lochau – Lindau Insel) | Web [prüfen] |

---

## 1. Zielgruppen

### 1.1 Geo-Zonen (aus 10/4a.1, für Meta und Pinterest übernommen)

| Zone | Gebiet | Meta-Einstellung | Pinterest-Einstellung | Wann aktiv |
|---|---|---|---|---|
| **A – Kern AT** | Vorarlberg komplett, Arlberg (Lech, Zürs, St. Anton), Außerfern | Standorte „Personen, die dort leben oder sich kürzlich dort aufgehalten haben“; Radius 60 km um Lochau für Showroom/Café/Advent | Region Vorarlberg; Tirol nur Arlberg-Bezug über Keywords | ab Stufe 1 |
| **B – Nordufer DE** | LK Lindau, Bodenseekreis, LK Ravensburg, Westallgäu, Kempten/Oberallgäu, Konstanz | PLZ-/Städteauswahl, Radius 15–25 km je Stadt | Bundesland Baden-Württemberg/Bayern zu grob → Metro/PLZ-Targeting, sofern verfügbar [prüfen], sonst Keyword-Targeting | ab Stufe 1 |
| **C – CH/FL** | Liechtenstein, SG, AR/AI, TG, Graubünden-Nord | Länder CH (Kantone) und LI | Schweiz direkt buchbar [belegt: help.pinterest.com]; **Liechtenstein in Pinterest-Liste nicht gefunden** [prüfen] | Akquise **erst, wenn CH/FL-Seite (Wege A/B) live ist**; bis dahin nur Retargeting |
| **D – Ferienimmobilien** | Wohnsitz München, Stuttgart, Zürich + Interesse Ferienhaus/Arlberg/Bregenzerwald | Städte München, Stuttgart, Zürich + Interessen (1.2) | Keywords „Chalet einrichten“, „Ferienwohnung einrichten“ | ab Stufe 2 |

Ausschlüsse: eigene Mitarbeitende (Custom Audience aus Teamliste nur mit Einwilligung, sonst weglassen), Jobsuchende (keine Job-Interessen), Standorte außerhalb der Zonen.

### 1.2 Interessen und Signale (Meta)

Meta hat in den letzten Jahren viele Detail-Interessen zusammengelegt und Ausschlüsse eingeschränkt; die Liste ist als **Signal für Advantage+-Zielgruppen** gedacht, nicht als harte Eingrenzung [prüfen im Werbeanzeigenmanager].

| Cluster | Interessen/Verhalten (Beispiele) | Einsatz |
|---|---|---|
| **Interior Premium** | Interior Design, Innenarchitektur, Architectural Digest, Elle Decoration, Möbeldesign, Salone del Mobile, Designklassiker | Showroom, Minotti-Ausstellung, Retargeting-Ergänzung |
| **Wohneigentum/Bauen** | Hausbau, Renovierung, Immobilien, Eigentumswohnung, Architektur | Küchen (Binni, next125), Planung |
| **Küche & Kochen** | Kochen, Gourmet, Weinkultur, Küchendesign | Binni-Küchen, „Platzhirsch Tafel“ |
| **Outdoor/Garten/See** | Gartengestaltung, Terrasse, Segeln, Bodensee, Hotellerie | Outdoor-Frühbucher |
| **Ferienimmobilien** | Ferienwohnung, Chalet, Skifahren (Arlberg), Luxusreisen | Zone D |
| **Geschenke/Lokal** | Café, Brunch, Lindau/Bregenz-Interessen, Weihnachtsmärkte | Advent, Gutscheine, Café |
| **B2B (Hotel/Gastro)** | Hotellerie, Gastronomie-Management, Berufsbezeichnungen Hotel/Restaurant | Outdoor-Frühbucher Hotels; ergänzend LinkedIn (10/4a.6) |

**Alter:** nicht hart filtern (10/4a.4: „Altersfilter 30+ nur über Signale“). Ausnahme Gutscheine/Café: offen ab 25.
**Sonderkategorie:** keine (Möbel, keine Kredit-/Immobilienanzeige). **Achtung:** Sobald Finanzierung beworben wird, ist die Sonderkategorie „Finanzprodukte“ zu prüfen [prüfen].

### 1.3 Custom Audiences und Retargeting

| Zielgruppe | Quelle | Rechtsgrundlage / Bedingung | Laufzeit |
|---|---|---|---|
| R1 Website-Besucher 30/90/180 Tage | Meta Pixel | **nur Besucher mit Marketing-Consent** | 30/90/180 |
| R2 Produktseiten-Besucher je Marke (Minotti, Poliform, Outdoor, Küchen) | Pixel `ViewContent` mit `item_brand` (10/F5) | Consent | 90 |
| R3 „Ihre Auswahl“ gemerkt, nicht angefragt | Pixel `AddToWishlist` (10/F5) | Consent | 60 |
| R4 Lead-Formular geöffnet, nicht gesendet | Meta Lead Ads (Formular-Öffner) | Meta-eigene Daten | 90 |
| R5 Instagram-/Facebook-Interaktion | Profil, Beiträge, Nachrichten | Meta-eigene Daten, **kein Website-Consent nötig** | 365 |
| R6 Video-Viewer 50 % / 95 % | Reels der Serien aus 12/C5 | Meta-eigene Daten | 180 |
| R7 Kundenliste (Bestandskunden) | Backoffice-Export | **nur Kunden mit Werbe-Einwilligung**, gehasht über Meta-Upload; Liste vorher bereinigen (Löschfristen) | Aktualisierung monatlich |
| R8 Newsletter-Abonnenten | Newsletter-Tool | Double-Opt-in vorhanden [prüfen, 12/C7] | monatlich |

**Ausschlüsse in Akquise-Kampagnen:** Leads der letzten 30 Tage (R4 gesendet), Kundenliste R7 (außer bei Advent/Gutschein).

### 1.4 Lookalikes

| Lookalike | Seed | Größe | Einsatz | Stufe |
|---|---|---|---|---|
| LAL-1 | R7 Kundenliste (nur Consent-Kunden; Seed ≥ 100 Personen nötig [prüfen, Meta-Minimum]) | 1 % AT + DE (Zonen A/B) | Showroom, Küchen | ab 2 |
| LAL-2 | qualifizierte Leads aus Lead-Ledger (10/F4B) | 1–3 % | Lead Ads | ab 2 (nach ≥ 100 Leads) |
| LAL-3 | R6 Video-Viewer 95 % | 1–2 % | Reichweite Café/Showroom | ab 1 |
| LAL-CH | R7 gefiltert auf CH/FL-Kunden | 1 % CH | Schweiz-Service | erst mit Zone C |

Hinweis: Bei Advantage+-Zielgruppe wirken Lookalikes nur noch als Vorschlag. Ein Test „Original-Zielgruppe mit LAL“ gegen „Advantage+“ läuft je 14 Tage mit gleichem Budget.

### 1.5 Pinterest-Zielgruppen

- **Keyword-Targeting** (Pinterest ist eine Suchmaschine): Keywordlisten je Kampagne (Abschnitt 4.3).
- **Interessen:** Home Decor, Architecture, Design, Gardening/Outdoor, Food & Drink (für Café/Tafel).
- **Actalikes** (Pinterest-Lookalike) auf Pin-Engager und Tag-Besucher (nur Consent).
- **Retargeting:** Website-Besucher über Pinterest Tag (nur Consent), Engager mit Pins.
- Geo: AT (Vorarlberg/Tirol), DE (Süden), CH; LI [prüfen].

---

## 2. Kampagnenstruktur Meta

| Kampagne | Ziel (Meta-Objective) | Anzeigen (Abschn. 3) | Zielgruppe | Zone | Zeitraum | Stufe |
|---|---|---|---|---|---|---|
| **K1 Advent & Gutscheine** | Umsatz (Website, Gutscheinkauf) bzw. Traffic, solange Pixel fehlt; Event-Anmeldung für Adventsabend | A1, A2 | Radius 40 km + R5/R7 | A, B | 02.11.–23.12.2026 | anlassbezogen |
| **K2 Ausstellungsstücke** | Leads (Lead Ads „Stück reservieren“) + Katalog, sobald Feed (10/F7a) | A3, A4 | Interior Premium + R1–R3 + R7 | A, B (C nur Selbstabholung) | ab Atelier-Seite live (Jan 2027, Newsletter-Vorlauf 07.01.) | 1 |
| **K3 Binni-Küchen** | Leads (Lead Ads „Küchenplanung“) | A5, A6 | Wohneigentum/Bauen, Küche & Kochen, LAL-1 | A, B; C erst mit CH-Küchenprozess | **erst nach Preisliste, Musterküche, Bildrechten** (Pilot Q1 2027) | 1–2 |
| **K4 Outdoor-Frühbucher 2027** | Leads | A7, A8 | Outdoor/See, Hotel/Gastro, R2 Outdoor | A, B; Arlberg | Dez 2026 – Apr 2027 (Hotels Jan) | 1 |
| **K5 Showroom & Café** | Reichweite/Besuche, Video-Views (für R6) + Lead Ads „Termin“ (= M1 aus 10) | A9, A10 | Radius 60 km, Interior Premium, LAL-3 | A, B | dauerhaft | 1 |
| **K6 Schweiz-Service** | Leads + Traffic auf CH/FL-Seite | A11, A12 | CH/FL, LAL-CH, R1 aus CH | C | **erst nach CH/FL-Seite + Steuerberater-Check** | 1 (Retargeting) / 2 (Akquise) |
| **K7 Retargeting übergreifend** | Leads | beste A3/A9/A10-Varianten | R1–R6 | A–C | dauerhaft | 1 |

**Platzierungen:** Advantage+-Platzierungen, aber Audience Network ausschließen (Fehlklicks). Reels und Stories mit 9:16-Assets, Feed mit 4:5.
**Optimierung:** Lead Ads mit „Mehr Details“ (höhere Hürde); **Conversion Leads Optimization**, sobald der Lead-Status zurückgemeldet wird (10/F4), und zwar nur für Leads mit Consent.
**Sprache:** DE; de-CH-Fassungen für Zone C; EN-Variante nur Zone D (Zürich, Expats) ab Stufe 2.

---

## 3. Die 12 Anzeigen-Varianten (Meta: Instagram/Facebook)

Formatangaben: Primärtext ≤ 125 Zeichen sichtbar (danach „Mehr“), Headline ≤ 40 Zeichen, Beschreibung optional. Alle Bilder im Fotostil „Seelicht“ (12/C6): Tageslicht, warm-neutral, viel Luft, keine Logos in der ersten Sekunde, eingebrannte Untertitel.

### Thema 1: Advent und Gutscheine

**A1 – Adventsabend (Event)**
- **Primärtext:** Am Donnerstag, 26. November, ist bei uns im Café Advent. Kerzen, Glühwein, Gespräche über Stoffe und Licht. Wir freuen uns, wenn Sie vorbeikommen. `[UHRZEIT]`, Landstraße 9, Lochau. Um Anmeldung wird gebeten.
- **Headline:** Adventsabend im Showroom-Café
- **Beschreibung:** Do 26.11. · Lochau am Bodensee
- **CTA:** „Mehr dazu“ (Event-Anmeldung) bzw. „Registrieren“
- **Bild-/Video-Idee:** 15-s-Reel „Im Café“: Kerze wird angezündet, Hand stellt eine Tasse auf den Holztisch, im Hintergrund unscharf eine Sofalandschaft, Abendlicht durchs Fenster. Letztes Bild: Datum als Textzeile.
- **Ziel/Zielgruppe:** Radius 25 km + R5 + R7 · Laufzeit 09.–25.11.
- **Prüfen:** Uhrzeit, Kapazität, ob öffentlich oder nur auf Einladung (23 nennt Bestandskunden, Makler, Architekten). Wenn nur geladen: Anzeige nur an R7/R5.

**A2 – Gutschein**
- **Primärtext:** Ein Gutschein von Platzhirsch passt zu Menschen, die schon alles haben, außer dem einen Stück, das sie noch suchen. Einlösbar im Showroom in Lochau, für Möbel, Leuchten, Accessoires und den Espresso danach. Als PDF sofort oder schön verpackt zum Abholen.
- **Headline:** Geschenkgutschein für Design
- **Beschreibung:** Wunschbetrag · PDF oder Abholung
- **CTA:** „Jetzt kaufen“ (Link `[GUTSCHEIN-URL]`)
- **Bild-/Video-Idee:** Karussell mit 3 Karten: (1) Gutscheinkarte auf Minotti-Stoffmuster, (2) Geschenkbox mit Kerze und Glas (Sortiment aus Bericht 10), (3) Café-Tisch mit verpacktem Gutschein. Format 4:5.
- **Prüfen:** Gilt der Gutschein auch im Café? (Café gehört zur Bestands-GmbH, 23/5.5 → Abrechnung klären, sonst „Café“ streichen.) Gültigkeit: wenn unbefristet ausgegeben, darf „ohne Ablaufdatum“ ergänzt werden (in AT 30 Jahre einlösbar, Bericht 10) [Steuerberater/Anwalt prüfen].

### Thema 2: Ausstellungsstücke

**A3 – Einzelstück mit Preis (Katalog/Einzelbild)**
- **Primärtext:** `[ATELIER-STÜCK]` aus unserer Ausstellung, `[MASSE]`, `[ZUSTAND, z. B. „ein Jahr im Showroom, gepflegt“]`. Sofort verfügbar, Lieferung und Aufbau durch unser Team möglich. Einmal vorhanden, deshalb gilt: wer zuerst reserviert.
- **Headline:** `[MARKE MODELL]` – `[PREIS]` €
- **Beschreibung:** Ausstellungsstück · sofort verfügbar
- **CTA:** „Mehr dazu“ (Lead Ad „Reservieren“) bzw. „Jetzt kaufen“ auf die Atelier-Seite
- **Bild-/Video-Idee:** Eigenes Foto des Stücks im Showroom, Totale + Detail (Naht/Stoff) als 2er-Karussell. Reel „Ein Stück, eine Minute“: Hand über den Bezug, Sitzprobe, ein Satz Beratung.
- **Pflicht:** Preis als Endpreis inkl. MWST. Kein Streichpreis, außer mit echtem Referenzpreis (Omnibus-Regel). Markenname nur sachlich; Foto eigenes (Erschöpfung) [anwaltlich prüfen, 10/5.2].

**A4 – Atelierverkauf allgemein**
- **Primärtext:** Wir machen Platz für die neue Kollektion. Einige Ausstellungsstücke von Minotti, Poliform, Flos und anderen Marken suchen ein neues Zuhause, jedes mit Preis und Zustandsbeschreibung. Ansehen und probesitzen in Lochau, `[ÖFFNUNGSZEITEN]`.
- **Headline:** Ausstellungsstücke mit Preis
- **Beschreibung:** Probesitzen in Lochau
- **CTA:** „Mehr ansehen“ (Atelier-Seite)
- **Bild-/Video-Idee:** Karussell 5–8 Karten, je ein Stück mit Preis als dezentes Text-Overlay unten (Schrift im Website-Stil), Abschlusskarte „Alle Stücke ansehen“. Später dynamisch aus dem Meta-Katalog (10/F7a).
- **Prüfen:** Welche Marken tatsächlich im Atelierverkauf sind; nur nennen, was in der Liste steht. Wort „Ausstellungsstück“, nicht „B-Ware“/„Abverkauf“ (12/Glossar). Rechtsträger/Erlös laut 23/5.5 klären.

### Thema 3: Binni-Küchen (neue, leistbare Linie mit Stein)

**A5 – Positionierung**
- **Primärtext:** Eine Küche mit echter Steinarbeitsplatte muss kein Luxusprojekt sein. Unsere neue Küchenlinie fertigt unser Manufakturpartner Binni im Kosovo, geplant und montiert wird sie von uns in Lochau. Mit klarem Preis von Anfang an.
- **Headline:** Küche mit Stein, ehrlich kalkuliert
- **Beschreibung:** Planung in Lochau · Preis vorab
- **CTA:** „Angebot anfordern“ (Lead Ad „Küchenplanung“)
- **Bild-/Video-Idee:** Reel 20 s: Nahaufnahme Steinkante, Hand fährt über die Arbeitsplatte, Wasser perlt ab; Schnitt zur Totale der Musterküche im Showroom; Textzeilen: „Steinarbeitsplatte“ – „Planung in Lochau“ – „Gefertigt von Binni, Kosovo“.
- **Voraussetzung:** Musterküche steht im Showroom, Bildrechte von Binni, Name der Linie markenrechtlich geprüft (26/3). **Kein Livegang vor der Preisliste.**

**A6 – Preisbeispiel**
- **Primärtext:** So sieht ein Beispiel aus: `[KÜCHENBESCHREIBUNG, z. B. „Zeile 3,60 m mit Insel, Fronten matt, Arbeitsplatte Quarz“]` ab `[BINNI-AB-PREIS]` € inkl. MWST, Planung und Montage, ohne Geräte. Geräte planen wir mit Ihnen dazu. Wie Ihre Küche aussehen könnte, zeigen wir Ihnen im Showroom.
- **Headline:** Steinküche ab `[BINNI-AB-PREIS]` €
- **Beschreibung:** Beispielplanung · inkl. Montage
- **CTA:** „Termin buchen“ bzw. „Angebot anfordern“
- **Bild-/Video-Idee:** Einzelbild 4:5 der Beispielküche, darunter dezente Leiste mit 3 Fakten (Maß, Stein, Preis). Alternative: Karussell „Drei Steine, eine Küche“ (Marmor, Quarz, Keramik) – nur wenn die Steinarten bei Binni bestätigt sind (26/5.1 Punkt 3).
- **Pflicht:** Preis muss einem real kalkulierten Angebot entsprechen und erreichbar sein (PAngV/PrAG). Lieferzeit erst nennen, wenn von Binni bestätigt.

### Thema 4: Outdoor-Frühbucher 2027

**A7 – Privat (Terrasse am See)**
- **Primärtext:** Wer im Mai draußen sitzen will, plant jetzt. Wir zeigen Ihnen Outdoor-Möbel und Sonnenschirme von Tuuci, Umbrosa, Gloster, Paola Lenti und Heatsail, planen Terrasse oder Garten mit Ihnen und sichern Ihnen einen Liefertermin für die Saison 2027. `[FRÜHBUCHER-KONDITION]`
- **Headline:** Outdoor 2027: jetzt planen
- **Beschreibung:** Liefertermin für die Saison sichern
- **CTA:** „Termin buchen“ (Lead Ad „Outdoor-Planung“)
- **Bild-/Video-Idee:** Reel „Unterwegs“: Sonnenschirm wird an einer Terrasse mit Seeblick aufgespannt (eigenes Projekt nur mit Kundenfreigabe, sonst Außenbereich Showroom), Zeitraffer Wolken/See. Einzelbild 4:5: Lounge-Ecke im Winterlicht mit Text „Im Mai fertig“.
- **Prüfen:** Welche Outdoor-Marken aktuell bestellbar sind; Lieferzeiten je Marke; ob ein Frühbuchervorteil existiert (sonst Satz streichen, kein erfundener Rabatt).

**A8 – Hotels und Gastronomie**
- **Primärtext:** Für Hotels und Gastronomie am Arlberg, im Bregenzerwald und am See: Wir planen Terrasse, Lounge und Beschattung für die Sommersaison 2027 und lagern Ihre Outdoor-Möbel auf Wunsch über den Winter ein. Bestellungen im Januar sichern Liefertermine vor Saisonbeginn `[prüfen]`.
- **Headline:** Hotelterrasse für Sommer 2027
- **Beschreibung:** Planung, Lieferung, Wintereinlagerung
- **CTA:** „Angebot anfordern“
- **Bild-/Video-Idee:** Karussell: (1) Beschattung über einer Terrasse, (2) Detail Stoff/Gestell, (3) Montage-Crew, (4) „Wintereinlagerung“ – eingepackte Möbel im Lager. Nur eigene Fotos.
- **Zielgruppe:** Hotel/Gastro-Berufe + Interessen, Zone A (inkl. Arlberg); ergänzend LinkedIn (10/4a.6) und Direktmailing an die Hotel-Liste (23, KW 51/KW 1).
- **Prüfen:** Wintereinlagerung als Service definiert und bepreist (23/5 Nr. 7); keine Hotelnamen als Referenz ohne Freigabe.

### Thema 5: Showroom und Café

**A9 – Kaffee, dann Sofa**
- **Primärtext:** Bei uns sitzen Sie im Café, nicht im Lager. Kommen Sie auf einen Espresso nach Lochau, wir legen die Stoffe schon bereit. Minotti, Poliform, Rimadesio, Flos und mehr im Showroom erleben, `[FAHRZEIT-LINDAU]` von Lindau.
- **Headline:** Showroom mit Café in Lochau
- **Beschreibung:** `[ÖFFNUNGSZEITEN]`
- **CTA:** „Termin buchen“ (Lead Ad „Showroom-Termin“) bzw. „Route planen“ für Reichweitenvariante
- **Bild-/Video-Idee:** 15/30-s-Reel „Kaffee, dann Sofa“ (10/4a.8): Ankunft, Espresso, Probesitzen, Stoffwahl. Ohne Ton verständlich, Untertitel.
- **Hinweis:** Claim „Bei uns sitzen Sie im Café, nicht im Lager“ stammt aus 23/4.1 und ist Testclaim (12/3.1).

**A10 – Minotti-Ausstellung**
- **Primärtext:** Ein Sofa sollte man nicht nach Foto kaufen. In unserer Minotti-Ausstellung in Lochau können Sie Sitztiefe, Bezüge und Kombinationen in Ruhe vergleichen, mit Beratung und auf Wunsch mit Planung für den ganzen Raum.
- **Headline:** Minotti-Sofas live erleben
- **Beschreibung:** Beratung nach Termin
- **CTA:** „Termin buchen“
- **Bild-/Video-Idee:** Karussell „Ein Raum, drei Stimmungen“ (10/4a.8): dieselbe Sofagruppe mit drei Stoff-/Farbkombinationen, eigene Aufnahmen. Reel: „Lawrence gibt es auch 10 cm tiefer“-Format (12/C5) – nur mit vom Team geprüften Maßangaben.
- **Prüfen:** Markenbeschwerde-Risiko: Budget auf Minotti-Themen klein halten und mit dem Minotti-Agenten abstimmen (10/4a.3). Kein Minotti-Kampagnenbild.

### Thema 6: Schweiz-Service

**A11 – Einkaufen aus der Schweiz und Liechtenstein (de-CH)**
- **Primärtext:** Sie wohnen in der Schweiz oder in Liechtenstein und möchten in Lochau einkaufen? Wir erklären Ihnen, wie es geht: Selbstabholung mit Ausfuhrbeleg oder Lieferung bis zur Grenze, Verzollung über einen Spediteur. Mit Beispielrechnung, ohne Kleingedrucktes.
- **Headline:** Einkaufen in Lochau, wohnen in der Schweiz
- **Beschreibung:** Ablauf, MWST und Zoll erklärt
- **CTA:** „Mehr dazu“ (CH/FL-Seite)
- **Bild-/Video-Idee:** Reel „Unterwegs“: Lieferwagen, Zoll Lustenau/Au (nur öffentliche Außenaufnahme, ohne Personen/Kennzeichen), Übergabe in einer Wohnung. Grafik-Karte: drei Schritte (Auswählen – Ausfuhr – Verzollen).
- **Voraussetzung:** CH/FL-Seite mit Wegen A/B live (23, KW 48), Ablauf vom Steuerberater/Zollspediteur bestätigt. **Keine** Ersparnis-Prozentzahl in der Anzeige, solange die Beispielrechnung (23/6: 7,5–9 %) nicht geprüft ist. Kein „CHF-Festpreis inkl. Verzollung und Montage“ vor Gate 2 (ca. Q2 2027).

**A12 – Ein Ansprechpartner, drei Länder (de-CH)**
- **Primärtext:** Ein Ansprechpartner. Drei Länder. Ein Zuhause. Wir planen Wohnen, Küche und Outdoor für Häuser in Liechtenstein, im Rheintal und rund um St. Gallen, mit Offerte, Lieferung und Montage aus einer Hand. `[Montage nur, wenn CH-Ablauf steht]`
- **Headline:** Planung für Ihr Zuhause in CH und FL
- **Beschreibung:** Offerte nach Beratung in Lochau
- **CTA:** „Angebot anfordern“ (Lead Ad mit Land-Abfrage)
- **Bild-/Video-Idee:** Einzelbild 4:5: Blick aus dem Showroom Richtung See/Grenzregion, Text-Overlay „Lochau · Rheintal · Liechtenstein“. Karussell: Planungsmappe, Stoffmuster, Montage-Crew.
- **Voraussetzung:** Für Liechtenstein Montage zuerst (keine Wartefrist für Monteure, 00/6). Schweiz: Meldepflicht 8 Tage, feste CH-Montagetage (23/6) → Formulierung „Montage an festen Terminen“ statt „jederzeit“.

### 3.1 Testplan je Anzeige
- Je Anzeige mindestens 2 Bildvarianten (Bild vs. Reel), 2 Primärtexte (kurz vs. lang); Headline-Test nur bei A9/A10.
- Bewertung nach 14 Tagen oder 2.000 Impressions je Variante (früher: nur bei offensichtlichem Ausfall).
- Kreativ-Wechsel: 4–6 neue Motive pro Monat und Kanal (10/5.3).

---

## 4. Pinterest-Strategie

### 4.1 Rolle von Pinterest
Pinterest ist für Interior ein Such- und Ideenkanal mit langer Lebensdauer der Pins. **Stufe 1: organisch, 0 € Media** (Business-Konto, Website-Verifizierung, Rich Pins über das vorhandene JSON-LD/Open Graph, 10/4a.5). **Ab Stufe 2: Paid** (Consideration auf Ratgeber, Conversion `lead`, Katalog sobald Feed). Ziel-URLs bevorzugt Ratgeber (Marktresearch/content/ratgeber, Freigabe offen) und Regionsseiten, nicht nur Produktseiten.

### 4.2 Boards (12)

| # | Board | Beschreibung (Board-Text, keywordnah) | Inhalte |
|---|---|---|---|
| B1 | Italienisch wohnen am Bodensee | Wohnzimmer-Ideen mit italienischem Design aus unserem Showroom in Lochau am Bodensee | Showroom-Vignetten, Sofas, Licht |
| B2 | Minotti Wohnzimmer Ideen | Minotti-Sofas, Sessel und Kombinationen, fotografiert in der Minotti-Ausstellung in Lochau | eigene Fotos, A10-Motive |
| B3 | Küche mit Steinarbeitsplatte | Küchenideen mit Marmor, Quarz und Keramik, Planung in Vorarlberg | Binni-Linie (nach Freigabe), next125, Materialdetails |
| B4 | Designküche italienisch | Poliform/Varenna-Küchen und Wohnküchen mit Kochinsel | Poliform-Küche im Showroom |
| B5 | Outdoor am See | Terrasse, Garten und Seeufer: Outdoor-Möbel und Sonnenschirme für den Bodensee | Tuuci, Umbrosa, Gloster, Paola Lenti, Heatsail |
| B6 | Hotelterrasse und Lounge | Outdoor- und Lounge-Ideen für Hotels und Gastronomie in den Alpen | Objekt-Motive (mit Freigabe) |
| B7 | Begehbarer Kleiderschrank und Schlafzimmer | Kleiderschränke, Betten und Systeme von Poliform, Rimadesio und Treca | Night-Bereich |
| B8 | Licht planen | Leuchten und Lichtplanung mit Flos und Tom Dixon für Wohnräume | Leuchten-Details |
| B9 | Chalet und Ferienwohnung einrichten | Ideen für Ferienwohnungen am Arlberg und im Bregenzerwald | Zone D, Second-Home |
| B10 | Ausstellungsstücke mit Preis | Ausgewählte Ausstellungsstücke aus Lochau, sofort verfügbar | A3/A4-Motive, kurzlebig |
| B11 | Geschenke und Gutscheine für Design | Geschenkideen, Kerzen, Düfte und Gutscheine aus dem Showroom | Advent |
| B12 | Café und Showroom Lochau | Ein Besuch bei Platzhirsch: Café, Espresso und Möbel in Lochau | Atmosphäre |

### 4.3 30 Pin-Titel und -Beschreibungen

Format: 2:3 Hochformat (1000×1500), Text-Overlay max. 6 Wörter, Titel ≤ 100 Zeichen, Beschreibung ≤ 500 Zeichen, die ersten 50 Zeichen tragen das Hauptkeyword. **Keywords** sind Vorschläge, Volumen vor Start im Pinterest Trends-Tool prüfen [prüfen].

| # | Board | Pin-Titel | Beschreibung | Keywords | Ziel-URL |
|---|---|---|---|---|---|
| 1 | B1 | Wohnzimmer italienisch einrichten: Ideen vom Bodensee | Ruhige Farben, tiefe Sofas, viel Licht: So sieht italienisches Wohnen in unserem Showroom in Lochau aus. Die Stücke können Sie vor Ort probesitzen. | wohnzimmer italienisch, wohnzimmer ideen modern, designermöbel | Wohnzimmer-Landingpage |
| 2 | B1 | Sofa mit Sessel kombinieren: 3 Beispiele | Drei Kombinationen aus Sofa, Sessel und Couchtisch, fotografiert in Lochau. Mit Hinweisen zu Abständen und Proportionen. | sofa kombinieren, wohnzimmer gestalten, sessel zum sofa | Ratgeber Wohnzimmer planen (12/4a Nr. 15) |
| 3 | B1 | Couchtischhöhe richtig wählen | Die Maße, die wir in der Beratung am häufigsten nennen: Couchtischhöhe, Abstand zum Sofa, Teppichgröße. | couchtisch höhe, wohnzimmer maße, sofa abstand | Ratgeber Nr. 15 |
| 4 | B2 | Minotti Sofa im Wohnzimmer: Ideen aus der Ausstellung | Minotti-Sofas in verschiedenen Bezügen und Tiefen, fotografiert in unserer Minotti-Ausstellung in Lochau am Bodensee. | minotti sofa, minotti wohnzimmer, designer sofa | Minotti-Markenseite |
| 5 | B2 | Was kostet ein Minotti-Sofa? | Preisrahmen, Faktoren wie Größe, Bezug und Lieferzeit, ehrlich erklärt aus unserer Beratung. | minotti sofa preis, minotti kosten, designer sofa preis | Ratgeber Nr. 1 (nach Freigabe) |
| 6 | B2 | Sofa-Bezug wählen: Leder, Bouclé oder Leinen? | Was hält mit Kindern und Hund? Unsere Erfahrungen mit Bezugsstoffen und Pflege. | sofa bezug, bouclé sofa, ledersofa pflege | Ratgeber Nr. 11 |
| 7 | B3 | Küche mit Steinarbeitsplatte: leistbar geplant | Unsere neue Küchenlinie mit Steinarbeitsplatte, gefertigt von unserem Manufakturpartner Binni im Kosovo, geplant in Lochau. | küche steinarbeitsplatte, küche marmor, küche quarz | Binni-Landingpage (erst nach Freigabe) |
| 8 | B3 | Marmor, Quarz oder Keramik: welche Arbeitsplatte? | Vor- und Nachteile der drei Materialien im Küchenalltag: Flecken, Hitze, Kratzer, Pflege. | arbeitsplatte marmor, quarz arbeitsplatte, keramik arbeitsplatte | Ratgeber Marmor/Keramik/Quarz (nach Freigabe) |
| 9 | B3 | Helle Küche mit Steininsel | Eine Kücheninsel mit Stein als Mittelpunkt der Wohnküche: Maße, Abstände, Licht. | kücheninsel, küche mit insel, wohnküche ideen | Ratgeber Nr. 19 |
| 10 | B3 | Küche planen in Vorarlberg: so läuft es ab | Vom ersten Aufmaß bis zur Montage: die Schritte einer Küchenplanung bei uns in Lochau. | küche planen, küchenplanung vorarlberg, küchenstudio | kuechen-vorarlberg |
| 11 | B4 | Italienische Designküche mit Kochinsel | Poliform/Varenna-Küche im Showroom Lochau: Fronten, Griffe, Arbeitsplatte im Detail. | designküche italienisch, poliform küche, varenna küche | Poliform-Markenseite |
| 12 | B4 | Was kostet eine Poliform-Küche? | Preisrahmen von der Planung bis zur Montage, aus unseren Angeboten zusammengefasst. | poliform küche preis, designküche kosten | Ratgeber Nr. 4 (nach Freigabe) |
| 13 | B4 | Wohnküche mit Esstisch: Ideen | Küche und Essplatz als ein Raum: Abstände, Leuchten über dem Tisch, Stühle. | wohnküche, essbereich ideen, küche mit esstisch | Küchen-Seite |
| 14 | B5 | Outdoor-Möbel am See: welches Material hält? | Feuchtigkeit, Föhn und Sonne: Materialien für Terrasse und Seeufer am Bodensee im Vergleich. | outdoor möbel wetterfest, gartenmöbel material, terrasse see | Ratgeber Nr. 12 |
| 15 | B5 | Sonnenschirm für die Terrasse: Größe und Windlast | Wie groß, welches Fundament, wie viel Wind? Hinweise zu Tuuci und Umbrosa aus der Planung. | sonnenschirm terrasse, großer sonnenschirm, ampelschirm | Ratgeber Nr. 13 |
| 16 | B5 | Terrasse am Bodensee einrichten | Lounge, Esstisch und Beschattung für eine Terrasse mit Seeblick: Ideen aus unseren Planungen. | terrasse gestalten, lounge terrasse, outdoor lounge | moebel-bodensee |
| 17 | B5 | Outdoor-Möbel richtig einwintern | So überstehen Polster, Gestelle und Schirme den Winter, und was unser Einlagerungsservice übernimmt. | gartenmöbel einwintern, outdoor möbel winter | Ratgeber Nr. 14 |
| 18 | B5 | Outdoor 2027: jetzt planen, im Mai draußen sitzen | Wer im Winter plant, bekommt seinen Liefertermin für die Saison. Ideen für Terrasse und Garten. | gartenmöbel 2027, terrasse planen, outdoor trends | Outdoor-LP (10/F6) |
| 19 | B6 | Hotelterrasse gestalten: Lounge und Beschattung | Outdoor-Ideen für Hotels und Gastronomie in den Alpen und am See, mit Planung und Wintereinlagerung. | hotelterrasse, gastronomie terrasse, hotel lounge | LP outdoor-hotel |
| 20 | B7 | Begehbaren Kleiderschrank planen | Maße, Licht und Systeme: so planen wir begehbare Kleiderschränke mit Poliform und Rimadesio. | begehbarer kleiderschrank, ankleidezimmer ideen | Ratgeber Nr. 16 |
| 21 | B7 | Glas und Aluminium im Wohnraum: Rimadesio | Wo Glastüren und Regalsysteme passen und wo nicht, erklärt an Beispielen aus dem Showroom. | rimadesio, glasschiebetür, regalsystem glas | Ratgeber Nr. 17 |
| 22 | B7 | Bett und Matratze: Treca erklärt | Federkern, Härtegrade, Probeliegen: was ein Treca-Bett ausmacht. | treca bett, boxspringbett design, matratze federkern | Ratgeber Nr. 26 |
| 23 | B8 | Licht planen im Wohnzimmer: drei Ebenen | Grundlicht, Akzent und Leseleuchte, am Beispiel eines Wohnraums in Lochau mit Leuchten von Flos. | licht planen, wohnzimmer beleuchtung, flos leuchte | Ratgeber Nr. 18 |
| 24 | B8 | Pendelleuchte über dem Esstisch: Höhe und Größe | Wie hoch, wie groß, wie viele: Faustregeln für Leuchten über dem Tisch. | pendelleuchte esstisch, lampe esstisch höhe | Leuchten-Kategorie |
| 25 | B9 | Ferienwohnung am Arlberg bezugsfertig einrichten | Ablauf, Zeitplan und was wir übernehmen, wenn Sie Ihre Ferienwohnung nicht selbst einrichten möchten. | ferienwohnung einrichten, chalet einrichten, arlberg | Ratgeber Nr. 21 |
| 26 | B9 | Chalet modern einrichten: Holz trifft italienisches Design | Ideen für Chalets im Bregenzerwald und am Arlberg mit warmen Materialien und klaren Formen. | chalet modern, alpen chic, chalet wohnzimmer | Regionsseite Arlberg (in Arbeit) |
| 27 | B10 | Ausstellungsstück kaufen: worauf achten? | Was ein Showroom-Stück ist, wie wir den Zustand beschreiben und was Sie beim Kauf beachten sollten. | ausstellungsstück kaufen, designermöbel ausstellungsstück | Ratgeber Nr. 6 / Atelier-Seite |
| 28 | B11 | Geschenkgutschein für Design-Liebhaber | Ein Gutschein für Möbel, Leuchten und Accessoires aus unserem Showroom in Lochau, als PDF oder verpackt. | geschenkgutschein design, geschenk einrichtung | Gutschein-Shop |
| 29 | B11 | Firmengeschenke mit Stil | Ideen für Unternehmen in Vorarlberg, Liechtenstein und der Ostschweiz: Kerzen, Düfte, Geschenkboxen. | firmengeschenke, kundengeschenke weihnachten | Firmengeschenk-Seite (Ratgeber Nr. 8) |
| 30 | B12 | Café und Showroom in Lochau am Bodensee | Erst ein Espresso, dann die Stoffe: ein Besuch in unserem Showroom mit Café, `[FAHRZEIT-LINDAU]` von Lindau. | showroom bodensee, café lochau, möbel lindau | Startseite / Kontakt |

**Regeln:** Ratgeber-Pins (Nr. 2, 3, 5, 6, 8, 9, 12, 14, 15, 17, 20–25, 27, 29) erst veröffentlichen, wenn der Artikel freigegeben und live ist. Pins mit Markennamen nur mit eigenen Fotos. Pin-Bilder nie KI-generiert als echte Räume (12/C6, AI Act).

### 4.4 Rhythmus
- Stufe 1: 3–5 neue Pins pro Woche, Mischung 60 % Ratgeber/Ideen, 30 % Showroom/Produkt, 10 % Saison (Advent, Outdoor).
- Saisonvorlauf: Pinterest-Nutzer planen früh. Outdoor-Pins ab Januar, Advent-/Gutschein-Pins ab Anfang November.
- Paid ab Stufe 2: die 5 Pins mit den meisten organischen Saves bewerben.

---

## 5. Lead-Formular-Fragen (Meta Instant Forms, Pinterest Lead Ads)

Formulartyp: **„Mehr Details“** (Bestätigungsschritt), damit nur Ernsthafte absenden. Vorausgefüllt: Name, E-Mail, Telefon (optional), Land.

### 5.1 Grundformular „Showroom-Termin / Planung“ (K3, K4, K5, K6)

| # | Frage | Antwortoptionen | Zweck |
|---|---|---|---|
| 1 | Worum geht es? | Wohnen (Sofa, Esszimmer, Schlafzimmer) · Küche · Outdoor · Ganzes Haus/Wohnung · Hotel/Gastronomie | Routing an Berater |
| 2 | Wann möchten Sie umsetzen? | in den nächsten 3 Monaten · 3–12 Monate · später als 12 Monate · nur informieren | Qualifizierung |
| 3 | Welcher Budgetrahmen ist geplant? | unter 10.000 € · 10.000–30.000 € · 30.000–100.000 € · über 100.000 € · noch offen | Qualifizierung (10/4a.4) |
| 4 | Wo befindet sich das Objekt? | Vorarlberg/Tirol · Deutschland · Schweiz · Liechtenstein · anderes | Zone, CH/FL-Ablauf |
| 5 | PLZ des Objekts | Freitext (kurz) | Fahrtzeit, Montageplanung |
| 6 | Wie möchten Sie weitermachen? | Termin im Showroom · Rückruf · Planung per Video zuerst | Kontaktweg |
| 7 | Bevorzugter Zeitraum für den Termin | Werktag vormittags · Werktag nachmittags · Samstag | Terminplanung |

### 5.2 Zusatzfragen je Kampagne

| Kampagne | Zusatzfrage | Optionen |
|---|---|---|
| K2 Ausstellungsstück | Welches Stück interessiert Sie? | Liste der aktuellen Stücke (max. 10, wöchentlich aktualisieren) · anderes |
| K2 | Lieferung oder Abholung? | Lieferung mit Aufbau · Selbstabholung |
| K3 Binni-Küche | Gibt es schon einen Grundriss? | ja, mit Maßen · ja, ohne Maße · nein, Aufmaß gewünscht |
| K3 | Neubau oder Umbau? | Neubau · Sanierung/Austausch · Ferienwohnung |
| K4 Outdoor | Privat oder Betrieb? | privat · Hotel · Gastronomie · Wohnanlage |
| K4 | Wintereinlagerung interessant? | ja · nein · weiß noch nicht |
| K6 Schweiz | Welcher Ablauf passt? | Ich hole selbst ab · Lieferung bis zur Grenze/Verzollung durch Spediteur · weiß noch nicht |

### 5.3 Pflichttexte im Formular
- **Datenschutzhinweis** mit Link auf `/de/datenschutz` (Pflichtfeld bei Meta), mit Nennung von Meta als gemeinsam Verantwortlichem für die Formularerhebung [Text durch Datenschutzberater].
- **Optionale, nicht vorangekreuzte Checkbox:** „Ich möchte den Newsletter ‚Post aus Lochau‘ erhalten. Abmeldung jederzeit.“ → anschließend Double-Opt-in-Mail (12/C7). Ohne Haken keine Werbe-Mails.
- **Danke-Seite:** „Danke. Wir melden uns innerhalb von `[ANTWORTZEIT, z. B. einem Werktag]`.“ Button „Route nach Lochau“.
- **Datenfluss:** Download oder Webhook → `src/app/api/meta-leads/route.js` (geplant, 10/4a.4) → Backoffice/Lead-Ledger mit Herkunft `meta_leadad_[kampagne]`. Löschfrist im Ledger 24 Monate (10/5.2). Leads innerhalb von 24 h bearbeiten.

---

## 6. Budget

Grundlage sind die Stufen aus 10/4a.7 (Monat, netto Media, ohne Produktion). Meta-Anteil: Stufe 1 = 1.000 € (M1 700 + M3 300), Stufe 2 = 1.900 €, Stufe 3 = 3.100 €. Pinterest: 150 / 300 / 700 €.

### 6.1 Aufteilung Meta nach Kampagne (Monat)

| Kampagne | Stufe 1 (1.000 €) | Stufe 2 (1.900 €) | Stufe 3 (3.100 €) | Bemerkung |
|---|---|---|---|---|
| K5 Showroom & Café (inkl. Lead Ads Termin) | 350 | 500 | 750 | Basis, ganzjährig |
| K2 Ausstellungsstücke | 200 | 250 | 300 | solange Stücke da sind |
| K3 Binni-Küchen | 0 (bis Freigabe) → 200 | 450 | 800 | Schwerpunkt Jan–März, Sep–Okt |
| K4 Outdoor-Frühbucher | 150 (Dez–Apr) | 250 | 400 | Feb–Mai aus K5 aufstocken |
| K6 Schweiz-Service | 0 (nur Retargeting in K7) | 250 | 500 | Akquise erst mit Zone C |
| K7 Retargeting | 300 | 200 | 350 | ab Pixel-Consent |
| **Summe** | **1.000** | **1.900** | **3.100** | |

**Anlassbudget Advent/Gutscheine (K1), einmalig Nov–Dez 2026:** 300–600 € gesamt [Schätzung], davon 150–250 € für den Adventsabend (09.–25.11.) und der Rest für Gutscheine (01.–22.12.). **Nur wenn Gate 0 vorher freigibt**; sonst organisch über Instagram, Newsletter (05.11., 03.12.) und Google-Profil. Rechnet man den Mediastart laut 10/6.1 frühestens ab KW 49/2026, entfällt der Adventsabend-Teil.

### 6.2 Pinterest

| | Stufe 1 | Stufe 2 | Stufe 3 |
|---|---|---|---|
| Organisch | Pin-Produktion intern | weiter | weiter |
| Paid | 150 € Test (Outdoor-Pins Feb–Apr) | 300 € (Consideration Ratgeber + Outdoor) | 700 € (+ Katalog, sobald Feed) |

### 6.3 Produktionsaufwand [Schätzung]
- 1 Shooting-Tag pro Monat im Showroom (10/5.3) liefert Material für Meta und Pinterest: ca. 20 Fotos + 4 Reels.
- Intern 3–4 h/Woche für Meta/Pinterest (Anzeigen, Leads, Pins).
- Externe Produktion 500–1.500 €/Monat laut 10/4a.7, gemeinsam mit Google.

---

## 7. KPIs und Steuerung

### 7.1 Zielwerte [Schätzung, nach 90 Tagen durch echte Werte ersetzen]

| KPI | Meta Stufe 1 | Meta Stufe 2 | Pinterest | Anmerkung |
|---|---|---|---|---|
| Leads (alle Formulare) | 10–15/Monat | 22–35/Monat | 2–5/Monat ab Paid | abgeleitet aus 10/3.3 (Meta ≈ 1/3 des Budgets) |
| **CPL (alle Leads)** | ≤ 90 € | ≤ 100 € | ≤ 90 € | 10/3.3 |
| Anteil qualifizierter Leads | ≥ 40 % | ≥ 40 % | ≥ 30 % | Kriterien: Zeitraum ≤ 12 Mon., Budget ≥ 10 T€, Zone A–C |
| **Kosten je qualifiziertem Lead** | ≤ 250 € | ≤ 280 € | – | Stufenwechsel nur nach 2 Monaten im Ziel (10/3.3) |
| Showroom-Termine aus Meta | 3–5/Monat | 7–11/Monat | – | Herkunftsfeld im Backoffice |
| Event-Anmeldungen Adventsabend | `[ZIEL nach Kapazität]` | – | – | |
| Gutscheinumsatz aus Paid | messbar erst mit Pixel + `purchase` | – | – | sonst Gutscheincode `META24` / `PIN24` zur Zuordnung [prüfen, ob Shop Codes kann] |
| Ausstellungsstücke reserviert aus Paid | Anzahl und Umsatz je Monat | | | |
| CTR Link (Feed) | ≥ 0,8 % | ≥ 1,0 % | Outbound-CTR ≥ 0,5 % | Kreativ-Qualität |
| Video-Hold 3 s / ThruPlay | ≥ 25 % / ≥ 10 % | | | für R6 |
| Frequenz (Akquise) | ≤ 3 in 7 Tagen | | | sonst Motiv wechseln |
| Event-Match-Quality (CAPI) | ≥ 6 | ≥ 6 | – | 10/4a.4 |
| Pinterest Saves / Outbound Clicks | – | – | Saves +20 %/Monat, 100+ Outbound-Klicks/Monat organisch ab M3 | |
| Instagram-Follower | 3.000 bis M12 | | | 23/9 (heute 772 [belegt, 23]) |
| **Auftragsumsatz / Media (6 Monate)** | ≥ 10 | ≥ 9 | – | 10/3.3, Verzögerung 2–6 Monate |

### 7.2 Steuerung
- **Wöchentlich (15 min):** Leads, Kosten je Lead, Status im Lead-Ledger nachtragen (10/F4B).
- **Monatlich:** Kosten je qualifiziertem Lead je Kampagne, Kreativ-Wechsel, Budget-Umschichtung zwischen K2–K6.
- **Abbruchregeln:** Kampagne pausieren, wenn nach 4 Wochen Kosten je qualifiziertem Lead > 2× Ziel. Anzeige pausieren bei Frequenz > 4 oder CTR < 0,4 %.
- **Auswertung nach Land:** getrennt AT/DE/CH/FL, um den Effekt des Schweiz-Service zu messen.

---

## 8. Zeitplan (Vorschlag)

| Zeitraum | Meta | Pinterest | Abhängigkeit |
|---|---|---|---|
| KW 44–45 (bis 08.11.) | Konten durch Inhaber, Consent-Erweiterung beauftragen, Shooting 1 (Café, Advent, Gutschein) | Business-Konto, Verifizierung, Boards B1, B11, B12 anlegen (durch Team) | V2–V5 |
| KW 45–47 | A1 (nur organisch oder Engagement-Zielgruppen), A2 nach Gutschein-Shop | Pins 28–30 | Gutschein-Shop KW 45 |
| KW 48–51 | A2 Gutscheine, A9 Café; Outdoor-Hotel-Vorbereitung A8 | Pins 1–4, 14, 17 | Gate 0 für Media |
| Jan 2027 | A3/A4 Atelier, A8 Hotels, A7 privat; A10 | Pins 5, 6, 11–13, 27, 18–19 | Atelier-Seite, Inventur |
| Feb–Mär 2027 | A5/A6 Binni (wenn Musterküche + Preise), A7 Hauptphase, A11 (wenn CH-Seite geprüft) | Pins 7–10, 15–16, 20–26; Paid-Test Outdoor | Binni-Freigaben, Steuerberater |
| Apr 2027 | A12 nach Gate 2, Auswertung Stufe 1 | Paid Stufe 2 nach Auswertung | KPIs Stufe 1 |

---

## 9. Freigabe-Checkliste je Anzeige (vor Livegang abhaken)

- [ ] Keine Händler-/Partner-Behauptung, keine Superlative, kein „Nr. 1“
- [ ] Alle Fakten (Datum, Öffnungszeiten, Preise, Maße, Marken, Fahrzeit) gegen die Quelle geprüft
- [ ] Preis = Endpreis inkl. MWST, real erhältlich; kein Streichpreis ohne 30-Tage-Referenz
- [ ] Bild/Video eigenes Material oder schriftliche Freigabe; Personen mit Einwilligung
- [ ] Binni: Herkunft „Kosovo“ genannt, kein Italien-Bezug
- [ ] Schweiz: nur Wege, die schon angeboten werden; de-CH-Schreibweise
- [ ] Zielseite live, mobil geprüft, Formular funktioniert
- [ ] Pixel/CAPI nur nach Consent (im Browser mit abgelehntem Banner getestet)
- [ ] Lead-Formular: Datenschutzlink, Newsletter-Checkbox nicht vorangekreuzt
- [ ] UTM-Parameter gesetzt (`utm_source=meta|pinterest`, `utm_medium=paid_social`, `utm_campaign=k1_advent` usw.)
- [ ] Freigabe durch Inhaber (Name, Datum)

---

## 10. Offene Punkte

1. **Gate 0 und Mediastart:** Laut 10/6.1 frühestens KW 49/2026 bzw. Q1 2027. Advent (A1) kann daher realistisch nur organisch laufen.
2. **Consent-Erweiterung** für Meta Pixel und Pinterest Tag fehlt im Code (10/F1). Bis dahin nur Lead Ads und Engagement-Zielgruppen.
3. **Öffnungszeiten:** Samstag 10–14 (Ist) oder 10–17 (Test geplant)? Steht in A4, A9, Pin 30.
4. **Gutschein:** im Café einlösbar (Rechtsträger)? Befristet oder unbefristet?
5. **Atelierverkauf:** Inventurliste mit Preisen, Rechtsträger des Erlöses (23/5.5).
6. **Binni:** Preisliste, Musterküche, Bildrechte, Lieferzeit, Steinarten, Name der Linie. Vorher keine Anzeige.
7. **Outdoor:** welche Frühbucher-Kondition es gibt; Wintereinlagerung definiert und bepreist; Lieferzeiten je Marke.
8. **Schweiz/FL:** CH/FL-Seite und Beispielrechnung vom Steuerberater bestätigen; Pinterest-Ausspielung in Liechtenstein klären.
9. **Minotti:** Budget auf Minotti-Themen vorher mit dem Minotti-Agenten abstimmen (Markenbeschwerde-Risiko).
10. **Fahrzeit Lindau** („5 Minuten“) mit Routenplaner verifizieren.
11. **Newsletter-Double-Opt-in** im Backoffice prüfen (12/C7), bevor die Lead-Formular-Checkbox genutzt wird.
12. **Lead-Rücklauf:** Route `src/app/api/meta-leads/route.js` und Lead-Ledger (10/F4B) sind noch nicht gebaut.

---

## Quellen
- Interne Berichte: `Marktresearch/digital/10-performance-marketing.md`, `Marktresearch/digital/12-content-storytelling.md`, `Marktresearch/23-masterkonzept.md`, `Marktresearch/26-binni-kooperation.md`, `Marktresearch/10-zubehoer-kerzen-duefte-geschenke.md`, `Marktresearch/00-uebersicht.md`
- Pinterest Business Hilfe, Länder mit direkter Werbekonto-Einrichtung (Österreich, Schweiz, Deutschland gelistet; Liechtenstein nicht gefunden): [help.pinterest.com](https://help.pinterest.com/en/node/821), abgerufen per Websuche am 26.10.2026
