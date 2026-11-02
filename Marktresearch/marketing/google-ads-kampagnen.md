# Google-Ads-Suchkampagnen: Marke × Region (importfertiger Entwurf)

**Stand:** 26.10.2026 · **Status: Entwurf.** Es ist nichts angelegt und nichts hochgeladen. Alle Kampagnen stehen in den CSV-Dateien auf `Paused`.
**Grundlage:** `Marktresearch/digital/10-performance-marketing.md` (Abschnitte 3.2, 4a.1–4a.3, 4a.7), `23-masterkonzept.md`, `26-binni-kooperation.md`, `src/lib/analytics.js`, Öffnungszeiten und Adresse aus `src/messages/de.json` (Footer), Zielseiten am 26.10.2026 gegen `localhost:3000` geprüft (alle HTTP 200).
**Kennzeichnung:** [belegt] = im Code, auf der Website oder in der Google-Hilfe geprüft · [Schätzung] · [prüfen] = vor dem Start klären. Das ist keine Rechtsberatung.

---

## 1. Kurzfassung

| Kennzahl | Wert |
|---|---|
| Kampagnen | 11: 1 × eigene Marke, je 3 für AT, DE-Süd und CH-Ost (Wohnen, Küche, Outdoor), 1 × FL (alle Themen) |
| Anzeigengruppen | 45 (11 Themen-Vorlagen × Regionen + Marke) |
| Keywords | 1.536 Zeilen (Phrase + Exact), CH/FL in Schweizer Schreibweise |
| Negative Keywords | 840 Zeilen: Kontoliste (46 Begriffe) auf jeder Kampagne plus eigene Negatives je Anzeigengruppe |
| Responsive Suchanzeigen | 90 (2 je Anzeigengruppe), jede mit **15 Headlines ≤ 30 und 4 Beschreibungen ≤ 90 Zeichen**. Der Generator hat alle Längen geprüft und bricht bei Überlänge ab |
| Assets | 66 Sitelinks, 77 Callouts, 22 Snippets, 11 Anruf-Assets |
| Budget | Stufe 1/2/3: **1.650 / 3.250 / 5.300 € pro Monat** für diese Suchkampagnen. Das ist der Search-Anteil (S1–S3) an 3/8/15 T€ Gesamtmedia aus Bericht 10, 4a.7 |
| Conversion | Primär `generate_lead` (je nach Formular 300/200/120 €), sekundär `contact_click` |

**Zwei Bedingungen vor dem Start:** Gate 0 aus dem Masterkonzept (Liquidität) und das funktionierende Tracking (Abschnitt 2). CH-Ost und FL bleiben pausiert, bis der Ablauf für Schweiz und Liechtenstein steht (Verzollung, MWST, CHF-Preis; Bericht 10, 4a.1 Zone C).

---

## 2. Voraussetzungen (technisch und organisatorisch)

| # | Voraussetzung | Stand | Wer |
|---|---|---|---|
| 1 | Google-Ads-Konto im Firmenbesitz, zweite Admin-Person, Abrechnung | fehlt | Inhaber |
| 2 | GA4 `G-1YCM6K57YG` mit Google Ads verknüpfen. Key Events `generate_lead` und `contact_click` in GA4 markieren und importieren | Events existieren im Code [belegt] | Web |
| 3 | **Fehler aus Bericht 10, F1 beheben:** `gtag.js` lädt heute nur mit Statistik-Einwilligung. Wer nur Marketing erlaubt, wird nicht gemessen. Außerdem fehlt ein Google-Ads-Tag `AW-…` | offen | Web |
| 4 | `transaction_id` (= `lead_ref`) an `generate_lead` hängen, sonst zählen Doppelklicks doppelt (Bericht 10, F2/F5) | offen | Web |
| 5 | Zielseiten: Für die Binni-Linie gibt es noch **keine eigene Seite**. Bis dahin zeigt die Anzeigengruppe auf `/de/kuechen-vorarlberg`, die die Linie aber noch nicht nennt. Diese Anzeigengruppe erst mit eigener Landingpage aktivieren (z. B. `/de/lp/designkueche-stein`, geplant in 26, Abschnitt 6) | blockiert | Web + Inhaber |
| 6 | Unternehmensprofil (Google Business Profile) mit Google Ads verknüpfen, damit das Standort-Asset erscheint | prüfen | Inhaber |
| 7 | 2 Wochen „stummes Tracking“ vor dem Start (GA4 DebugView, Diagnose in Google Ads) | – | Web |
| 8 | Anzeigentexte vom Inhaber freigeben lassen (Liste in Abschnitt 12.2) | – | Inhaber |

---

## 3. Markenrecht und Google-Richtlinie

### 3.1 Was Googles Marken-Richtlinie sagt [belegt: support.google.com/adspolicy/answer/6118, abgerufen 26.10.2026]
- **Keywords:** Google schränkt Marken als Keywords nicht ein. Im EWR/EFTA prüft Google laut älteren Fassungen der Richtlinie nach einer Beschwerde, ob Keyword und Anzeige zusammen über die Herkunft der Ware täuschen [Sekundärquelle, prüfen].
- **Anzeigentext:** Eine Einschränkung ist möglich, wenn der Markeninhaber Beschwerde einreicht. Ohne Beschränkung erlaubt sind:
  - **Wiederverkäufer:** Die Zielseite muss klar eine **Kaufmöglichkeit** zeigen, mit kommerziellen Angaben **wie Preisen**. Anzeige und Seite müssen klar machen, dass der Werbende Wiederverkäufer ist.
  - **Informationsseiten:** Die Zielseite informiert hauptsächlich über die Markenprodukte.
  - **Beschreibende Nutzung** im üblichen Wortsinn.
- Bei einem Verstoß gibt es keine sofortige Sperre. Google warnt mindestens 7 Tage vorher.

### 3.2 Was daraus für Platzhirsch folgt
1. **Herstellermarken als Keyword: ja.** Die Anzeigen enthalten den Markennamen nur beschreibend („Minotti-Sofas live erleben“, „Minotti in Lochau erleben“, „Poliform-Küche planen“). Absender ist in jeder Anzeige **Platzhirsch** (eigene Headline und Unternehmensname-Asset).
2. **Risiko Wiederverkäufer-Ausnahme:** Platzhirsch zeigt **keine Preise** (Produkt-JSON-LD ohne `Offer`, Bericht 10, 1.1). Die Marken-Seiten `/de/ueber-uns/marken/{marke}` fallen deshalb eher unter die **Ausnahme für Informationsseiten**. Reicht Minotti oder Poliform eine Beschwerde ein, kann Google den Markennamen im Anzeigentext sperren. Dann laufen die Anzeigen ohne Markennamen weiter: Jede RSA hat mindestens 6 Headlines ohne Herstellermarke. Ein Anfrage- oder Merkliste-Button auf den Markenseiten stärkt die Einordnung als Kaufmöglichkeit [prüfen].
3. **Verbotene Formulierungen** (der Generator prüft sie automatisch): offiziell, autorisiert, (Vertrags-)Händler, Store, Flagship, exklusiv, Nr. 1, größte/beste, Garantie, günstig, Rabatt, Ausrufezeichen. Auch die Selbstbeschreibung „größte Minotti-Ausstellung Westösterreichs“ aus früheren Unterlagen ist **nicht** in den Anzeigen. Das ist eine Superlativ-Behauptung, für die es keinen Beleg gibt.
4. **Wettbewerber-Namen** (Höttges, reiter design, Dolce Vita, Hutle, Fretz, Gamma …) sind **nicht** als Keywords gebucht (Bericht 10, 4a.3). Große Möbelketten stehen nur als **Negative Keywords** in der Liste. Das ist keine Markennutzung, sondern ein Ausschluss.
5. **Modellnamen** (Minotti Lawrence, Hamilton, Connery, Torii, Freeman, Yang; Poliform Senzafine, Ubik; Rimadesio Abacus, Velaris; Umbrosa Paraflex, Icarus) nur buchen, wenn das Modell **im Showroom steht oder bestellbar ist**. Sonst passt die Anzeige nicht zur Seite [prüfen mit Sortiment].
6. **Vor großem Budget auf Minotti/Poliform** mit dem jeweiligen Agenten abstimmen. Eine Markenbeschwerde würde das laufende Status-Gespräch belasten (00, Abschnitt 4).
7. **Binni:** Die Herkunft steht offen in den Anzeigen („Gefertigt im Kosovo“, „Manufakturpartner Binni“). Nichts deutet auf „Made in Italy“ hin (26, Abschnitt 3).

---

## 4. Kontostruktur

| Kampagne | Anzeigengruppen | Zielseiten |
|---|---|---|
| `PH-S1-Eigene-Marke` (alle Regionen) | Platzhirsch-Marke | `/de` |
| `PH-S2-{Region}-Wohnen` | Minotti · Poliform-Wohnen · Rimadesio · Treca · Designermoebel-Region | `/de/ueber-uns/marken/{minotti, poliform, rimadesio, treca}`, Regionsseite |
| `PH-S2-{Region}-Kueche` | Kueche-Poliform-Varenna · Kueche-next125-Schueller · **Designkueche-Steinplatte (Binni-Linie)** · Kuechenstudio-Region | `/de/ueber-uns/marken/{poliform, next125}`, `/de/kuechen-vorarlberg` |
| `PH-S2-{Region}-Outdoor` | Outdoor-Tuuci-Umbrosa · Outdoor-Moebel-Lenti-Gloster-Heatsail | `/de/produkte/parasols`, `/de/produkte/lounge-furniture-daybeds` |
| `PH-S2-FL-Liechtenstein-Alle` | alle 11 Themen in einer Kampagne (kleines Volumen) | wie oben, Regionsseite `/de/designermoebel-liechtenstein` |

{Region} = `AT-Vorarlberg-Arlberg`, `DE-Sued-Bodensee-Allgaeu`, `CH-Ost`. Vier getrennte Regionen geben je Land eine eigene Budgetsteuerung, eigene Texte (CH/FL: „ss“, „Offerte“) und saubere Auswertung nach Land.

**Logik der Anzeigengruppen:** Marken-Anzeigengruppen fangen Suchen nach Herstellern ab. Die Regions-Anzeigengruppen („designermöbel bregenz“, „küchenstudio lindau“) schließen die Herstellernamen als Negative aus, damit jede Suche in der passenden Gruppe mit der passenden Anzeige landet.

**Zwei RSAs je Anzeigengruppe:**
- **RSA A „Produkt“:** Marke/Produkt live erleben, Showroom, Café.
- **RSA B „Planung/Service“:** Planung, Termin, Ort.
- Beide enthalten 3 Regions-Headlines und den Absender „Platzhirsch“.
- Nichts ist angepinnt. Wenn Google den Markennamen zu selten zeigt, „Platzhirsch Home Living“ auf Position 2 anpinnen.

**Später (nicht in diesen Dateien):**
- S4 Ratgeber („was kostet ein minotti sofa“), ab Stufe 2, Ziele aus `Marktresearch/content/ratgeber/`.
- PMax, Demand Gen.
- Eigene Kampagne „Designküche mit Stein“ mit Preis-Assets, sobald die Binni-Preisliste steht.

---

## 5. Conversion-Ziele und Gebote

### 5.1 Conversion-Aktionen (aus `src/lib/analytics.js` [belegt])

| Conversion-Aktion in Google Ads | Quelle (GA4-Event) | Formular / Parameter | Einstellung | Wert |
|---|---|---|---|---|
| Lead – Beratung/Termin | `generate_lead` | `form=beratung` (`BeratungClient.js`) | **Primär** | 300 € |
| Lead – Produktanfrage | `generate_lead` | `form=produkt_anfrage` (`AnfrageFormProduct.js`) | **Primär** | 200 € |
| Lead – Kontakt | `generate_lead` | `form=kontakt` (`kontakt.js`) | **Primär** | 120 € |
| Kontakt-Klick Telefon/WhatsApp/E-Mail | `contact_click` | `method=phone/whatsapp/email` (`client-layout.js`) | Sekundär (nur Beobachtung) | 40 € |
| Anruf über Anruf-Asset | Google-Anrufweiterleitung, ≥ 60 s | – | Primär, sobald aktiv | 120 € |
| Newsletter | `sign_up` (`method=newsletter`) | `newsletter.js` | sekundär oder nicht importieren | 10 € |

Die Werte sind Startwerte aus Bericht 10, 3.2 [Schätzung]. Nach 90 Tagen ersetzt man sie durch echte Zahlen oder den Offline-Import.

**Umsetzung in GA4:** GA4 importiert nach Eventnamen. Damit die drei Formulare **getrennte Werte** bekommen, legt man in GA4 per „Ereignis erstellen“ drei abgeleitete Events an: `lead_beratung`, `lead_produkt`, `lead_kontakt`, jeweils mit Bedingung `event_name = generate_lead` und `form = …`. Diese drei werden als Key Event markiert und importiert. Das Original `generate_lead` bleibt in GA4 als Gesamtzahl. Der Newsletter sendet ein eigenes Event `sign_up` [belegt, `newsletter.js:48`] und zählt damit nicht als Lead.

### 5.2 Gebote
- Start: **Conversions maximieren** ohne Ziel-CPA, mit Tagesbudget als Deckel.
- **Ziel-CPA** erst ab ca. 30 Conversions pro Monat und Kampagne. Bei diesem Volumen eher je Region zusammengefasst über ein Portfolio.
- **Ziel-ROAS** erst mit Offline-Import (`qualified_lead`, `purchase`, Bericht 10, F4).
- Eigene Marke: Conversions maximieren mit kleinem Budget. Auktionsdaten monatlich prüfen.
- Netzwerke: **nur Google-Suche**. Suchnetzwerk-Partner und Display aus.
- Ziel-KPIs Stufe 1 (Bericht 10, 3.3): CPL ≤ 90 €, Kosten pro qualifiziertem Lead ≤ 250 € [Schätzung].

---

## 6. Regionen

### 6.1 Orte für regionale Keywords (in `gen-ads.js` gepflegt)

| Region | Orte in Keywords („designermöbel {ort}“, „küchenstudio {ort}“ …) | Marke + Ort („minotti {ort}“) | Regionsseite |
|---|---|---|---|
| AT | vorarlberg, bregenz, dornbirn, feldkirch, bludenz, lustenau, lech | vorarlberg, bregenz, dornbirn | `/de/designermoebel-bregenz` |
| DE-Süd | lindau, friedrichshafen, ravensburg, konstanz, kempten, allgäu, wangen | lindau, bodensee, allgäu | `/de/designermoebel-lindau` |
| CH-Ost | st gallen, rheintal, appenzell, thurgau, rorschach, chur, ostschweiz | st gallen, ostschweiz, schweiz | `/de/designermoebel-st-gallen` |
| FL | liechtenstein, vaduz, schaan | liechtenstein | `/de/designermoebel-liechtenstein` |

Neue Regionsseiten anderer Agenten (Feldkirch, Konstanz, Kempten, Rheintal, Ravensburg, Appenzell, Arlberg) werden später als Ziel-URLs eingesetzt. Dafür eigene Regions-Anzeigengruppen je Ort, sobald die Seiten live sind. Live geprüft sind heute bereits `designermoebel-konstanz`, `-kempten`, `-rheintal` und `-liechtenstein` (HTTP 200 im Dev-Server).

### 6.2 Regions-Headlines (je RSA 3 von 15)

| AT | DE-Süd | CH-Ost | FL |
|---|---|---|---|
| Showroom in Lochau (18) | Lochau, direkt bei Lindau (25) | Für die Ostschweiz (18) | Für Liechtenstein (17) |
| Für Vorarlberg und Arlberg (26) | Für Lindau, Allgäu, Bodensee (28) | Am Bodensee bei Bregenz (23) | Am Bodensee bei Bregenz (23) |
| Planung in ganz Vorarlberg (26) | Kurz über die Grenze (20) | Offerte persönlich besprechen (29) | Offerte persönlich besprechen (29) |

Beschreibung 4 nennt die Region („… Für Kunden aus Vorarlberg und vom Arlberg.“ / „… aus Lindau und dem Allgäu.“ / „… aus der Ostschweiz.“ / „… aus Liechtenstein.“). In CH und FL ersetzt der Generator „ß“ durch „ss“ (zum Beispiel „Landstrasse 9“).

Bewusst **nicht** in den CH/FL-Texten: „steuerfrei“, „Lieferung in die Schweiz“, „Festpreis in CHF“, „verzollt“. Diese Aussagen kommen erst dazu, wenn der Ablauf mit Steuerberater und Spediteur steht (23, Abschnitt 4.2; Bericht 18). Sonst wäre das irreführend.

### 6.3 Geo-Targeting (`02-standorte.csv`)

| Kampagne | Standorte | Option |
|---|---|---|
| AT | Vorarlberg; Bezirk Landeck (St. Anton am Arlberg); Bezirk Reutte (Außerfern) | **Präsenz**: „Personen in oder regelmäßig in den Zielgebieten“ |
| DE-Süd | Lindau, Landkreis Lindau (Bodensee), Bodenseekreis, Landkreise Ravensburg und Konstanz, Kempten, Landkreis Oberallgäu | Präsenz |
| CH-Ost | Kantone St. Gallen, Appenzell AR, Appenzell AI, Thurgau; Chur | Präsenz |
| FL | Liechtenstein | Präsenz |
| Eigene Marke | alle oben genannten | Präsenz |

Die Standortnamen sind englisch geschrieben, wie Google Ads Editor sie sucht. **Im Editor beim Import abgleichen** [prüfen]. Gibt es einen Landkreis nicht als eigenes Ziel, nimmt man stattdessen die Städte oder einen Umkreis um Lochau (z. B. 60 km, dann aber AT/CH/FL per Ausschluss sauber trennen). Sprache: Deutsch (und Englisch, falls Zweitwohnsitz-Kundschaft in Stufe 3).

---

## 7. Zeitplanung

| Element | Zeitplan | Begründung |
|---|---|---|
| Anzeigen (alle Kampagnen) | Mo–Fr 06–23 Uhr, Sa 07–23 Uhr, So 08–23 Uhr | Einrichtungsentscheidungen fallen abends und am Wochenende. Sonntag bleibt an, obwohl der Showroom zu ist, weil Termin und Formular online laufen. Nachts aus (wenig Kaufabsicht, Fehlklicks) |
| Gebotsanpassung nach Zeit | keine | Smart Bidding ignoriert manuelle Zeitanpassungen |
| Anruf-Asset | Di–Fr 10–18, Sa 10–14 Uhr | Öffnungszeiten laut Website [belegt]. Bei längeren Samstagszeiten (Test ab KW 46, 23) anpassen |
| Outdoor-Kampagnen | **Feb–Mai** mit voller Stufe, Jun–Aug halbes Budget, Sep–Jan pausiert. Ausnahme: Anzeigengruppe Tuuci/Umbrosa für Hotels und Gastronomie läuft im **Januar** (Frühbucher, 23) | Saison laut Bericht 10, 4a.7 |
| Küche | Jan–März und Sep–Okt +20 % zu Lasten Wohnen | Kaufsaison Küche |
| Weihnachten (15.12.–6.1.) | Wohnen und Küche −50 % | wenig Planungsabsicht |

In Stufe 1 steht Outdoor bei 0 €. Von Februar bis Mai werden je 150 € aus Wohnen nach Outdoor verschoben (AT und DE).

---

## 8. Budget-Stufen

Monatsbudget netto in €. Die Tagesbudgets (Monat ÷ 30,4) stehen in `01-kampagnen.csv` (Spalten Budget Stufe1/2/3). Beim Import die Spalte der aktiven Stufe in „Budget“ umbenennen.

| Kampagne | Stufe 1 (3 T€ gesamt) | Stufe 2 (8 T€) | Stufe 3 (15 T€) |
|---|---|---|---|
| S1 Eigene Marke | 150 | 250 | 300 |
| AT Wohnen | 400 | 550 | 850 |
| AT Küche | 300 | 450 | 700 |
| AT Outdoor (saisonal) | 0 | 200 | 350 |
| DE-Süd Wohnen | 450 | 650 | 950 |
| DE-Süd Küche | 350 | 500 | 750 |
| DE-Süd Outdoor (saisonal) | 0 | 200 | 350 |
| CH-Ost Wohnen | 0 (pausiert) | 200 | 450 |
| CH-Ost Küche | 0 (pausiert) | 150 | 300 |
| CH-Ost Outdoor | 0 | 0 | 150 |
| FL alle | 0 (pausiert) | 100 | 150 |
| **Summe Search Marke+Region** | **1.650** | **3.250** | **5.300** |
| Rest der Gesamtstufe (Meta, Pinterest, PMax, Ratgeber-Search, LinkedIn …) | 1.350 | 4.750 | 9.700 |

Diese Summen entsprechen S1 + S2 + S3 aus Bericht 10, 4a.7. Hier sind sie neu verteilt: Marke mal Region statt Marke und Region getrennt.

**Wenn CH/FL in Stufe 2 noch blockiert ist:** Die 450 € gehen an DE-Süd Wohnen (+250) und DE-Süd Küche (+200).

**Stufenwechsel** nur, wenn die Vorstufe zwei Monate in Folge die Kosten pro qualifiziertem Lead einhält (Bericht 10, 3.3). Die Binni-Anzeigengruppe teilt sich zunächst das Küchenbudget. Mit eigener Landingpage und Preisliste wird sie eine eigene Kampagne (Vorschlag Stufe 2: 300 € aus AT/DE Küche).

---

## 9. Assets (Erweiterungen)

### 9.1 Sitelinks (`07-sitelinks.csv`, Text ≤ 25, Beschreibung ≤ 35 Zeichen)

| Sitelink | Beschreibung 1 | Beschreibung 2 | URL |
|---|---|---|---|
| Termin vereinbaren | Beratung im Showroom Lochau | Online anfragen | `/de/beratung` |
| Unsere Marken | Minotti, Poliform, Rimadesio | Flos, ClassiCon, Paola Lenti | `/de/ueber-uns/marken` |
| Küchenplanung | Poliform, next125, Schüller | Planung im Showroom | `/de/kuechen-vorarlberg` |
| Outdoor und Terrasse | Tuuci, Umbrosa, Paola Lenti | Für Garten, Hotel, Restaurant | `/de/produkte/parasols` |
| Anfahrt und Kontakt | Landstraße 9, 6911 Lochau | Showroom mit Café | `/de/kontakt` |
| Regional: AT „Designermöbel Bregenz“ · DE „Showroom für Lindau“ · CH „Für St. Gallen“ · FL „Für Liechtenstein“ | je Region | | Regionsseite |

### 9.2 Callouts (≤ 25)
Showroom mit Café · Persönliche Planung · Termin online anfragen · Wohnen, Küche, Outdoor · Beratung ohne Zeitdruck · Termin nach Vereinbarung · regional: „Am Bodensee in Lochau“ (AT/DE), „Kunden aus der Ostschweiz“, „Kunden aus Liechtenstein“.

### 9.3 Snippets, Anruf, Standort, Name
- **Snippet „Marken“:** Minotti, Poliform, Rimadesio, Flos, ClassiCon, Paola Lenti, Tom Dixon, Tuuci.
- **Snippet „Sortiment“:** Sofas, Küchen, Schränke, Betten, Leuchten, Outdoor-Möbel.
- **Anruf:** +43 5574 46255 [belegt, `tel:`-Link auf der Website], Di–Fr 10–18, Sa 10–14.
- **Standort:** aus dem Unternehmensprofil.
- **Unternehmensname:** „Platzhirsch Home Living“. **Logo/Bilder:** nur eigene Showroom-Fotos, keine Herstellerbilder ohne Freigabe (Bericht 10, 5.2).
- **Kein Preis-Asset** (es gibt keine veröffentlichten Preise). **Kein Angebots-Asset.**

---

## 10. Negative Keywords

**Kontoliste (`11-negativliste-konto.csv`, 46 Begriffe, Phrase; im Editor als gemeinsame Liste anlegen oder wie in `05-…` auf jede Kampagne):**
gebraucht, gebrauchte, second hand, ebay, willhaben, kleinanzeigen, ricardo, tutti, anibis, ikea, xxxlutz, möbelix, kika, leiner, höffner, segmüller, pfister, conforama, jysk, günstig, billig, replica, replik, nachbau, dupe, fake, kopie, imitat, job, jobs, stellenangebot(e), karriere, ausbildung, lehre, praktikum, gehalt, pdf, kostenlos, gratis, lieferant werden, wikipedia, logo, aktie, lebenslauf, designer biografie.

**Eigene Marke** (Gattungswort „Platzhirsch“): bier, brauerei, jagd, hirsch kaufen, geweih, tracht, lederhose, spiel, film, bedeutung, gasthaus, gasthof, pension, app, wien, münchen, berlin, hamburg.

**Je Anzeigengruppe (Auszug, vollständig in Anhang B):**
- **Minotti:** „minotti cucine“. Das ist ein eigenständiger italienischer Küchenhersteller, keine Verbindung zur Möbelmarke Minotti.
- **Varenna:** Ort am Comer See (hotel, urlaub, fähre, villa …).
- **Gloster:** Flugzeughersteller (meteor, gladiator, flugzeug).
- **next125:** 125ccm, motorrad, roller, ersatzteile.
- **Steinplatte:** Heimwerker- und Pflegeanfragen (selber machen, reinigen, fleck, zuschnitt, steinmetz).
- **Outdoor:** Baumärkte und Diskonter.
- **Kreuz-Negatives:** In den Regions-Gruppen sind die Herstellermarken ausgeschlossen, in der Steinplatten-Gruppe die Küchenmarken.

**Nicht ausgeschlossen:** „outlet“ und „sale“. Diese Suchen können zum Atelierverkauf passen. Nach 4 Wochen anhand des Suchbegriff-Berichts entscheiden.

**Pflege:** Den Bericht der Suchbegriffe in den ersten 8 Wochen wöchentlich prüfen, danach monatlich.

---

## 11. CSV-Dateien und Import in Google Ads Editor

Ordner: `Marktresearch/marketing/ads-csv/` · UTF-8 mit BOM, Komma-getrennt, englische Spaltennamen wie im Editor.

| Datei | Inhalt | Zeilen |
|---|---|---|
| `01-kampagnen.csv` | Typ Search, Netzwerk Google-Suche, Tagesbudget je Stufe, Gebotsstrategie, Status Paused, Sprache, Präsenz, Zeitplan, Angabe „EU political ads“ | 11 |
| `02-standorte.csv` | Standortziele je Kampagne | 62 |
| `03-anzeigengruppen.csv` | Anzeigengruppen | 45 |
| `04-keywords.csv` | Keywords mit Typ `Phrase`/`Exact` | 1.536 |
| `05-negative-keywords.csv` | Kampagnen-Negatives (Ad Group leer) und Anzeigengruppen-Negatives | 840 |
| `06-anzeigen-rsa.csv` | 90 RSAs: Headline 1–15, Description 1–4, Path 1/2, Final URL | 90 |
| `07-sitelinks.csv` / `08-callouts.csv` / `09-snippets.csv` / `10-anruf-assets.csv` | Assets je Kampagne | 66 / 77 / 22 / 11 |
| `11-negativliste-konto.csv` | gemeinsame Ausschlussliste | 46 |
| `generator/gen-ads.js` | Erzeugt alle CSVs neu und prüft Zeichenlängen und verbotene Wörter. Aufruf: `node gen-ads.js <Zielordner> <anhang.md>` | – |

**Import-Reihenfolge im Editor:** „Konto → Importieren → Aus Datei“ in dieser Reihenfolge:
1. 01 (vorher die Spalte der aktiven Budget-Stufe in `Budget` umbenennen, die anderen beiden und die Info-Spalte löschen)
2. 02
3. 03
4. 04
5. 05
6. 06
7. 07–10

Danach im Editor die Vorschau prüfen und **erst nach Freigabe** hochladen.

**Im Editor prüfen** [prüfen]:
- Werden Kampagnen-Negatives mit leerer Ad-Group-Spalte als Kampagnenebene erkannt? Sonst den Typ `Campaign Negative Phrase` verwenden.
- Werden die Snippet-Werte mit `;` als Liste gelesen?
- Wird das Zeitplan-Format `(Monday[06:00-23:00]);…` übernommen? Sonst den Zeitplan einmal in einer Kampagne anlegen und per Kopieren/Einfügen übertragen.
- Werden die Standortnamen gefunden?

---

## 12. Offene Punkte

### 12.1 Blocker
1. Gate 0 (Liquidität) und Tracking-Fundament (Abschnitt 2, Punkte 2–4).
2. CH/FL-Ablauf (Zoll, MWST, CHF): Bis dahin bleiben `CH-Ost` und `FL` pausiert.
3. Landingpage Binni-Linie: Bis dahin bleibt die Anzeigengruppe `Designkueche-Steinplatte` pausiert. Zusätzlich das Sortiment klären (Steinarten, Muster im Showroom, Lieferzeit), dazu Name der Linie und Bildrechte (26, Abschnitt 5.1).
4. Abstimmung mit dem Minotti- bzw. Poliform-Agenten vor größerem Budget auf Markennamen.

### 12.2 Aussagen, die der Inhaber vor dem Start bestätigen muss
| Aussage in Anzeigen | Wo | Status |
|---|---|---|
| „Stoffe und Leder vor Ort“ | Minotti RSA A | Muster im Showroom? |
| „Steinmuster vor Ort“, „Steinarten vergleichen“, „Marmor, Keramik oder Quarz“ | Binni | erst mit Ausstellungsküche/Mustern (26, 5.1 Punkt 9) |
| „Gefertigt im Kosovo“, „Manufakturpartner Binni“ | Binni | erst nach Vertrag mit Binni. Darf der Name genannt werden? |
| „Raumplanung inklusive“ | mehrere | Ist Planung kostenfrei? Sonst streichen |
| „Termine auch außerhalb der Öffnungszeiten nach Vereinbarung“ | Beschreibungen | laut Footer [belegt] |
| Modellnamen (Lawrence, Senzafine, Velaris …) | Keywords | im Sortiment? |
| „Treca“, „Heatsail“, „Gloster“ | Keywords/Anzeigen | Marke weiter im Sortiment? Gloster laut 23 nicht ausbauen. Eher kleines Gebot |
| „Kurz über die Grenze“ (DE) | Region DE | Lage ok, keine Minutenangabe |

### 12.3 Nach dem Start
- Suchbegriffe prüfen und Negatives ergänzen.
- Nach 4–6 Wochen schwache Headlines (Asset-Bewertung „Niedrig“) ersetzen.
- Ab Stufe 2 Microsoft Ads per Import (Bericht 10).
- Offline-Import mit `qualified_lead`/`purchase` (Bericht 10, F4), dann Ziel-ROAS.
- Auktionsdaten auf Wettbewerber prüfen, die auf „Platzhirsch“ bieten.

---
## Anhang A – Anzeigentexte je Anzeigengruppe (Vorlage AT, mit Zeichenzahl)

Die Regionen DE, CH und FL tauschen nur die drei Regions-Headlines (Abschnitt 6.2) und den Regionsnamen in Beschreibung 4; CH und FL schreiben „ss“ statt „ß“. Alle Varianten stehen vollständig in `06-anzeigen-rsa.csv`.

### Minotti

Ziel-URL: `/de/ueber-uns/marken/minotti` (AT) · Pfad: `/Minotti/Showroom`

| # | RSA A – Produkt | RSA B – Planung/Service |
|---|---|---|
| H1 | Minotti-Sofas live erleben (26) | Wohnen mit Minotti planen (25) |
| H2 | Minotti in Lochau erleben (25) | Minotti und mehr im Showroom (28) |
| H3 | Minotti probesitzen (19) | Ihr Wohnzimmer mit Minotti (26) |
| H4 | Minotti-Ausstellung Lochau (26) | Minotti-Sofa in Ruhe wählen (27) |
| H5 | Sofas, Sessel und Tische (24) | Raumplanung inklusive (21) |
| H6 | Stoffe und Leder vor Ort (24) | Sofa, Teppich, Licht planen (27) |
| H7 | Italienisches Design am See (27) | Einrichten am Bodensee (22) |
| H8 | Showroom in Lochau (18) | Showroom in Lochau (18) |
| H9 | Für Vorarlberg und Arlberg (26) | Für Vorarlberg und Arlberg (26) |
| H10 | Planung in ganz Vorarlberg (26) | Planung in ganz Vorarlberg (26) |
| H11 | Platzhirsch Home Living (23) | Platzhirsch Lochau (18) |
| H12 | Showroom mit Café (17) | Termin online anfragen (22) |
| H13 | Persönliche Planung (19) | Wohnen, Küche, Outdoor (22) |
| H14 | Jetzt Termin vereinbaren (24) | Termin nach Vereinbarung (24) |
| H15 | Beratung ohne Zeitdruck (23) | Landstraße 9 in Lochau (22) |
| D1 | Minotti-Sofas und -Sessel im Showroom in Lochau erleben. Mit Café, ohne Zeitdruck. (82) | Minotti, Poliform, Flos und mehr: im Showroom kombinieren und mit uns planen. (77) |
| D2 | Wir planen Ihr Wohnzimmer mit Minotti persönlich, vom Grundriss bis zum Bezugsstoff. (84) | Probesitzen statt bestellen: Minotti-Modelle live sehen und Bezüge vergleichen. (79) |
| D3 | Termin online anfragen und in Ruhe vergleichen. Landstraße 9, 6911 Lochau am Bodensee. (86) | Showroom mit Café in Lochau. Termine auch außerhalb der Öffnungszeiten nach Vereinbarung. (89) |
| D4 | Wohnen, Küche, Outdoor aus einer Hand. Für Kunden aus Vorarlberg und vom Arlberg. (81) | Einrichtungsstudio am Bodensee für Kundinnen und Kunden aus Vorarlberg und vom Arlberg. (87) |

### Poliform-Wohnen

Ziel-URL: `/de/ueber-uns/marken/poliform` (AT) · Pfad: `/Poliform/Wohnen`

| # | RSA A – Produkt | RSA B – Planung/Service |
|---|---|---|
| H1 | Poliform live erleben (21) | Wohnen mit Poliform planen (26) |
| H2 | Poliform-Schränke ansehen (25) | Poliform und mehr im Showroom (29) |
| H3 | Poliform in Lochau erleben (26) | Schranksysteme planen (21) |
| H4 | Kleiderschrank nach Maß (23) | Ankleide nach Maß planen (24) |
| H5 | Begehbare Schränke planen (25) | Raumplanung inklusive (21) |
| H6 | Betten, Sofas und Schränke (26) | Schlafzimmer mit Poliform (25) |
| H7 | Italienisches Design am See (27) | Einrichten am Bodensee (22) |
| H8 | Showroom in Lochau (18) | Showroom in Lochau (18) |
| H9 | Für Vorarlberg und Arlberg (26) | Für Vorarlberg und Arlberg (26) |
| H10 | Planung in ganz Vorarlberg (26) | Planung in ganz Vorarlberg (26) |
| H11 | Platzhirsch Home Living (23) | Platzhirsch Lochau (18) |
| H12 | Showroom mit Café (17) | Termin online anfragen (22) |
| H13 | Persönliche Planung (19) | Wohnen, Küche, Outdoor (22) |
| H14 | Jetzt Termin vereinbaren (24) | Termin nach Vereinbarung (24) |
| H15 | Beratung ohne Zeitdruck (23) | Landstraße 9 in Lochau (22) |
| D1 | Poliform-Schränke, Betten und Sofas im Showroom in Lochau erleben und planen lassen. (84) | Poliform, Minotti, Rimadesio und mehr: im Showroom vergleichen und mit uns planen. (82) |
| D2 | Begehbarer Kleiderschrank oder Wohnwand: Wir planen Poliform passend zu Ihrem Raum. (83) | Wir messen, planen und begleiten Ihr Projekt persönlich. Termin online anfragen. (80) |
| D3 | Termin online anfragen und in Ruhe vergleichen. Landstraße 9, 6911 Lochau am Bodensee. (86) | Showroom mit Café in Lochau. Termine auch außerhalb der Öffnungszeiten nach Vereinbarung. (89) |
| D4 | Wohnen, Küche, Outdoor aus einer Hand. Für Kunden aus Vorarlberg und vom Arlberg. (81) | Einrichtungsstudio am Bodensee für Kundinnen und Kunden aus Vorarlberg und vom Arlberg. (87) |

### Rimadesio

Ziel-URL: `/de/ueber-uns/marken/rimadesio` (AT) · Pfad: `/Rimadesio/Showroom`

| # | RSA A – Produkt | RSA B – Planung/Service |
|---|---|---|
| H1 | Rimadesio live erleben (22) | Mit Rimadesio planen (20) |
| H2 | Rimadesio in Lochau ansehen (27) | Rimadesio im Showroom (21) |
| H3 | Schiebetüren aus Glas (21) | Schiebetüren planen lassen (26) |
| H4 | Glas und Aluminium (18) | Ankleide nach Maß planen (24) |
| H5 | Schränke und Regale (19) | Raumplanung inklusive (21) |
| H6 | Raumteiler nach Maß (19) | Regale und Raumteiler (21) |
| H7 | Italienisches Design am See (27) | Einrichten am Bodensee (22) |
| H8 | Showroom in Lochau (18) | Showroom in Lochau (18) |
| H9 | Für Vorarlberg und Arlberg (26) | Für Vorarlberg und Arlberg (26) |
| H10 | Planung in ganz Vorarlberg (26) | Planung in ganz Vorarlberg (26) |
| H11 | Platzhirsch Home Living (23) | Platzhirsch Lochau (18) |
| H12 | Showroom mit Café (17) | Termin online anfragen (22) |
| H13 | Persönliche Planung (19) | Wohnen, Küche, Outdoor (22) |
| H14 | Jetzt Termin vereinbaren (24) | Termin nach Vereinbarung (24) |
| H15 | Beratung ohne Zeitdruck (23) | Landstraße 9 in Lochau (22) |
| D1 | Rimadesio-Schiebetüren, Schränke und Regale im Showroom in Lochau ansehen und planen. (85) | Rimadesio, Poliform, Minotti und mehr: im Showroom vergleichen und mit uns planen. (82) |
| D2 | Glas, Aluminium, Maßarbeit: Wir planen Rimadesio passend zu Grundriss und Raumhöhe. (83) | Wir messen, planen und begleiten Ihr Projekt persönlich. Termin online anfragen. (80) |
| D3 | Termin online anfragen und in Ruhe vergleichen. Landstraße 9, 6911 Lochau am Bodensee. (86) | Showroom mit Café in Lochau. Termine auch außerhalb der Öffnungszeiten nach Vereinbarung. (89) |
| D4 | Wohnen, Küche, Outdoor aus einer Hand. Für Kunden aus Vorarlberg und vom Arlberg. (81) | Einrichtungsstudio am Bodensee für Kundinnen und Kunden aus Vorarlberg und vom Arlberg. (87) |

### Treca

Ziel-URL: `/de/ueber-uns/marken/treca` (AT) · Pfad: `/Treca/Betten`

| # | RSA A – Produkt | RSA B – Planung/Service |
|---|---|---|
| H1 | Treca-Betten probeliegen (24) | Treca im Showroom (17) |
| H2 | Treca in Lochau erleben (23) | Treca-Matratze probeliegen (26) |
| H3 | Matratzen in Ruhe testen (24) | Schlafzimmer komplett planen (28) |
| H4 | Betten aus Paris (16) | Bett, Stoff und Kopfteil (24) |
| H5 | Bett und Matratze wählen (24) | Raumplanung inklusive (21) |
| H6 | Schlafzimmer planen (19) | Probeliegen nach Termin (23) |
| H7 | Beratung zum Liegegefühl (24) | Einrichten am Bodensee (22) |
| H8 | Showroom in Lochau (18) | Showroom in Lochau (18) |
| H9 | Für Vorarlberg und Arlberg (26) | Für Vorarlberg und Arlberg (26) |
| H10 | Planung in ganz Vorarlberg (26) | Planung in ganz Vorarlberg (26) |
| H11 | Platzhirsch Home Living (23) | Platzhirsch Lochau (18) |
| H12 | Showroom mit Café (17) | Termin online anfragen (22) |
| H13 | Persönliche Planung (19) | Wohnen, Küche, Outdoor (22) |
| H14 | Jetzt Termin vereinbaren (24) | Termin nach Vereinbarung (24) |
| H15 | Beratung ohne Zeitdruck (23) | Landstraße 9 in Lochau (22) |
| D1 | Treca-Betten und Matratzen im Showroom in Lochau probeliegen und in Ruhe vergleichen. (85) | Schlafzimmer komplett planen: Bett, Schrank, Licht und Textilien aus einer Hand. (80) |
| D2 | Härtegrad, Bezug, Kopfteil: Wir beraten Sie persönlich zum passenden Treca-Bett. (80) | Probeliegen mit Termin: Wir nehmen uns Zeit. Termin online anfragen. (68) |
| D3 | Termin online anfragen und in Ruhe vergleichen. Landstraße 9, 6911 Lochau am Bodensee. (86) | Showroom mit Café in Lochau. Termine auch außerhalb der Öffnungszeiten nach Vereinbarung. (89) |
| D4 | Wohnen, Küche, Outdoor aus einer Hand. Für Kunden aus Vorarlberg und vom Arlberg. (81) | Einrichtungsstudio am Bodensee für Kundinnen und Kunden aus Vorarlberg und vom Arlberg. (87) |

### Designermoebel-Region

Ziel-URL: `/de/designermoebel-bregenz` (AT) · Pfad: `/Designmoebel/Showroom`

| # | RSA A – Produkt | RSA B – Planung/Service |
|---|---|---|
| H1 | Designermöbel am Bodensee (25) | Ihr Einrichtungsstudio (22) |
| H2 | Italienisches Design am See (27) | Wohnen, Licht und Textil (24) |
| H3 | Sofas, Schränke, Leuchten (25) | Design live erleben (19) |
| H4 | Minotti, Poliform und mehr (26) | Möbel in Ruhe ansehen (21) |
| H5 | Einrichtung aus einer Hand (26) | Einrichten am Bodensee (22) |
| H6 | Ausstellung in Lochau (21) | Flos, ClassiCon, Tom Dixon (26) |
| H7 | Raumplanung inklusive (21) | Persönlich beraten lassen (25) |
| H8 | Showroom in Lochau (18) | Showroom in Lochau (18) |
| H9 | Für Vorarlberg und Arlberg (26) | Für Vorarlberg und Arlberg (26) |
| H10 | Planung in ganz Vorarlberg (26) | Planung in ganz Vorarlberg (26) |
| H11 | Platzhirsch Home Living (23) | Platzhirsch Lochau (18) |
| H12 | Showroom mit Café (17) | Termin online anfragen (22) |
| H13 | Persönliche Planung (19) | Wohnen, Küche, Outdoor (22) |
| H14 | Jetzt Termin vereinbaren (24) | Termin nach Vereinbarung (24) |
| H15 | Beratung ohne Zeitdruck (23) | Landstraße 9 in Lochau (22) |
| D1 | Designermöbel von Minotti, Poliform, Rimadesio und mehr im Showroom in Lochau. (78) | Sofas, Leuchten, Schränke und Outdoor: im Showroom mit Café vergleichen und planen. (83) |
| D2 | Wir planen Wohnräume persönlich: Möbel, Licht, Teppiche und Textilien aus einer Hand. (85) | Vom ersten Gespräch bis zum fertigen Raum: Termin online anfragen und vorbeikommen. (83) |
| D3 | Termin online anfragen und in Ruhe vergleichen. Landstraße 9, 6911 Lochau am Bodensee. (86) | Showroom mit Café in Lochau. Termine auch außerhalb der Öffnungszeiten nach Vereinbarung. (89) |
| D4 | Wohnen, Küche, Outdoor aus einer Hand. Für Kunden aus Vorarlberg und vom Arlberg. (81) | Einrichtungsstudio am Bodensee für Kundinnen und Kunden aus Vorarlberg und vom Arlberg. (87) |

### Kueche-Poliform-Varenna

Ziel-URL: `/de/ueber-uns/marken/poliform` (AT) · Pfad: `/Kueche/Poliform`

| # | RSA A – Produkt | RSA B – Planung/Service |
|---|---|---|
| H1 | Poliform-Küchen erleben (23) | Ihre Küche mit Poliform (23) |
| H2 | Varenna-Küchen ansehen (22) | Varenna im Showroom (19) |
| H3 | Poliform-Küche planen (21) | Küche und Wohnraum planen (25) |
| H4 | Küche und Wohnen vereint (24) | Planung in Ruhe (15) |
| H5 | Italienische Designküche (24) | Küche, Esstisch, Licht (22) |
| H6 | Küchenplanung im Showroom (25) | Grundriss mitbringen (20) |
| H7 | Geräte und Stein beraten (24) | Küche am Bodensee planen (24) |
| H8 | Showroom in Lochau (18) | Showroom in Lochau (18) |
| H9 | Für Vorarlberg und Arlberg (26) | Für Vorarlberg und Arlberg (26) |
| H10 | Planung in ganz Vorarlberg (26) | Planung in ganz Vorarlberg (26) |
| H11 | Platzhirsch Home Living (23) | Platzhirsch Lochau (18) |
| H12 | Showroom mit Café (17) | Termin online anfragen (22) |
| H13 | Persönliche Planung (19) | Wohnen, Küche, Outdoor (22) |
| H14 | Jetzt Termin vereinbaren (24) | Termin nach Vereinbarung (24) |
| H15 | Beratung ohne Zeitdruck (23) | Landstraße 9 in Lochau (22) |
| D1 | Poliform- und Varenna-Küchen im Showroom in Lochau erleben und persönlich planen. (81) | Grundriss mitbringen: Wir planen Ihre Poliform-Küche mit Geräten und Arbeitsplatte. (83) |
| D2 | Wir planen Küche und Wohnraum zusammen, damit Fronten, Tisch und Licht zusammenpassen. (86) | Küchenplanung mit Termin: Wir nehmen uns Zeit für Ihr Projekt. Jetzt anfragen. (78) |
| D3 | Termin online anfragen und in Ruhe vergleichen. Landstraße 9, 6911 Lochau am Bodensee. (86) | Showroom mit Café in Lochau. Termine auch außerhalb der Öffnungszeiten nach Vereinbarung. (89) |
| D4 | Wohnen, Küche, Outdoor aus einer Hand. Für Kunden aus Vorarlberg und vom Arlberg. (81) | Einrichtungsstudio am Bodensee für Kundinnen und Kunden aus Vorarlberg und vom Arlberg. (87) |

### Kueche-next125-Schueller

Ziel-URL: `/de/ueber-uns/marken/next125` (AT) · Pfad: `/Kueche/next125`

| # | RSA A – Produkt | RSA B – Planung/Service |
|---|---|---|
| H1 | next125-Küchen ansehen (22) | Ihre Küche mit next125 (22) |
| H2 | Schüller-Küchen planen (22) | Schüller im Showroom (20) |
| H3 | next125 in Lochau erleben (25) | Küche und Wohnraum planen (25) |
| H4 | Moderne Küche planen (20) | Planung in Ruhe (15) |
| H5 | Küchenplanung im Showroom (25) | Küche, Esstisch, Licht (22) |
| H6 | Geräte und Stein beraten (24) | Küche am Bodensee planen (24) |
| H7 | Grundriss mitbringen (20) | Fronten live vergleichen (24) |
| H8 | Showroom in Lochau (18) | Showroom in Lochau (18) |
| H9 | Für Vorarlberg und Arlberg (26) | Für Vorarlberg und Arlberg (26) |
| H10 | Planung in ganz Vorarlberg (26) | Planung in ganz Vorarlberg (26) |
| H11 | Platzhirsch Home Living (23) | Platzhirsch Lochau (18) |
| H12 | Showroom mit Café (17) | Termin online anfragen (22) |
| H13 | Persönliche Planung (19) | Wohnen, Küche, Outdoor (22) |
| H14 | Jetzt Termin vereinbaren (24) | Termin nach Vereinbarung (24) |
| H15 | Beratung ohne Zeitdruck (23) | Landstraße 9 in Lochau (22) |
| D1 | next125- und Schüller-Küchen im Showroom in Lochau ansehen und persönlich planen. (81) | Grundriss mitbringen: Wir planen Ihre Küche mit Geräten, Licht und Arbeitsplatte. (81) |
| D2 | Fronten, Arbeitsplatte, Geräte: Wir planen Ihre Küche passend zu Raum und Alltag. (81) | Küchenplanung mit Termin: Wir nehmen uns Zeit für Ihr Projekt. Jetzt anfragen. (78) |
| D3 | Termin online anfragen und in Ruhe vergleichen. Landstraße 9, 6911 Lochau am Bodensee. (86) | Showroom mit Café in Lochau. Termine auch außerhalb der Öffnungszeiten nach Vereinbarung. (89) |
| D4 | Wohnen, Küche, Outdoor aus einer Hand. Für Kunden aus Vorarlberg und vom Arlberg. (81) | Einrichtungsstudio am Bodensee für Kundinnen und Kunden aus Vorarlberg und vom Arlberg. (87) |

### Designkueche-Steinplatte

Ziel-URL: `/de/kuechen-vorarlberg` (AT) · Pfad: `/Kueche/Steinplatte`

| # | RSA A – Produkt | RSA B – Planung/Service |
|---|---|---|
| H1 | Designküche mit Steinplatte (27) | Stein-Küche in Ruhe planen (26) |
| H2 | Echte Steinarbeitsplatte (24) | Manufakturpartner Binni (23) |
| H3 | Marmor, Keramik oder Quarz (26) | Arbeitsplatte aus Stein (23) |
| H4 | Küche mit Stein planen (22) | Küche samt Steinplatte (22) |
| H5 | Steinmuster vor Ort (19) | Grundriss mitbringen (20) |
| H6 | Gefertigt im Kosovo (19) | Küche am Bodensee planen (24) |
| H7 | Planung im Showroom (19) | Steinarten vergleichen (22) |
| H8 | Showroom in Lochau (18) | Showroom in Lochau (18) |
| H9 | Für Vorarlberg und Arlberg (26) | Für Vorarlberg und Arlberg (26) |
| H10 | Planung in ganz Vorarlberg (26) | Planung in ganz Vorarlberg (26) |
| H11 | Platzhirsch Home Living (23) | Platzhirsch Lochau (18) |
| H12 | Showroom mit Café (17) | Termin online anfragen (22) |
| H13 | Persönliche Planung (19) | Wohnen, Küche, Outdoor (22) |
| H14 | Jetzt Termin vereinbaren (24) | Termin nach Vereinbarung (24) |
| H15 | Beratung ohne Zeitdruck (23) | Landstraße 9 in Lochau (22) |
| D1 | Designküchen mit echter Steinarbeitsplatte, geplant in Lochau und gefertigt im Kosovo. (86) | Gefertigt von unserem Manufakturpartner Binni im Kosovo, geplant von Platzhirsch. (81) |
| D2 | Marmor, Keramik oder Quarz: Wir zeigen Ihnen die Unterschiede an echten Mustern. (80) | Grundriss mitbringen: Wir planen Ihre Küche mit Stein, Geräten und Licht. (73) |
| D3 | Termin online anfragen und in Ruhe vergleichen. Landstraße 9, 6911 Lochau am Bodensee. (86) | Showroom mit Café in Lochau. Termine auch außerhalb der Öffnungszeiten nach Vereinbarung. (89) |
| D4 | Wohnen, Küche, Outdoor aus einer Hand. Für Kunden aus Vorarlberg und vom Arlberg. (81) | Einrichtungsstudio am Bodensee für Kundinnen und Kunden aus Vorarlberg und vom Arlberg. (87) |

### Kuechenstudio-Region

Ziel-URL: `/de/kuechen-vorarlberg` (AT) · Pfad: `/Kueche/Planung`

| # | RSA A – Produkt | RSA B – Planung/Service |
|---|---|---|
| H1 | Küchenstudio am Bodensee (24) | Ihre neue Küche planen (22) |
| H2 | Küchenplanung in Lochau (23) | Küchen live vergleichen (23) |
| H3 | Poliform, next125, Schüller (27) | Küche, Esstisch, Licht (22) |
| H4 | Designküche planen (18) | Planung in Ruhe (15) |
| H5 | Küche und Wohnen vereint (24) | Fronten und Steinmuster (23) |
| H6 | Geräte und Stein beraten (24) | Küche am Bodensee planen (24) |
| H7 | Grundriss mitbringen (20) | Küche mit Steinplatte (21) |
| H8 | Showroom in Lochau (18) | Showroom in Lochau (18) |
| H9 | Für Vorarlberg und Arlberg (26) | Für Vorarlberg und Arlberg (26) |
| H10 | Planung in ganz Vorarlberg (26) | Planung in ganz Vorarlberg (26) |
| H11 | Platzhirsch Home Living (23) | Platzhirsch Lochau (18) |
| H12 | Showroom mit Café (17) | Termin online anfragen (22) |
| H13 | Persönliche Planung (19) | Wohnen, Küche, Outdoor (22) |
| H14 | Jetzt Termin vereinbaren (24) | Termin nach Vereinbarung (24) |
| H15 | Beratung ohne Zeitdruck (23) | Landstraße 9 in Lochau (22) |
| D1 | Küchen von Poliform, next125 und Schüller im Showroom in Lochau ansehen und planen. (83) | Grundriss mitbringen: Wir zeichnen Ihre Küche und besprechen Geräte und Stein. (78) |
| D2 | Wir planen Küche und Wohnraum zusammen: Fronten, Arbeitsplatte, Geräte und Licht. (81) | Küchenplanung mit Termin: Wir nehmen uns Zeit für Ihr Projekt. Jetzt anfragen. (78) |
| D3 | Termin online anfragen und in Ruhe vergleichen. Landstraße 9, 6911 Lochau am Bodensee. (86) | Showroom mit Café in Lochau. Termine auch außerhalb der Öffnungszeiten nach Vereinbarung. (89) |
| D4 | Wohnen, Küche, Outdoor aus einer Hand. Für Kunden aus Vorarlberg und vom Arlberg. (81) | Einrichtungsstudio am Bodensee für Kundinnen und Kunden aus Vorarlberg und vom Arlberg. (87) |

### Outdoor-Tuuci-Umbrosa

Ziel-URL: `/de/produkte/parasols` (AT) · Pfad: `/Outdoor/Sonnenschirme`

| # | RSA A – Produkt | RSA B – Planung/Service |
|---|---|---|
| H1 | Tuuci-Sonnenschirme ansehen (27) | Großschirme für Terrassen (25) |
| H2 | Umbrosa-Schirme erleben (23) | Sonnenschutz planen lassen (26) |
| H3 | Design-Sonnenschirme (20) | Tuuci und Umbrosa vergleichen (29) |
| H4 | Schirme für Hotel und Terrasse (30) | Für Garten und Gastronomie (26) |
| H5 | Terrasse am See planen (22) | Planung für Hotelterrassen (26) |
| H6 | Outdoor im Showroom (19) | Outdoor am Bodensee (19) |
| H7 | Beratung für Gastronomie (24) | Lounge, Schirm, Heizung (23) |
| H8 | Showroom in Lochau (18) | Showroom in Lochau (18) |
| H9 | Für Vorarlberg und Arlberg (26) | Für Vorarlberg und Arlberg (26) |
| H10 | Planung in ganz Vorarlberg (26) | Planung in ganz Vorarlberg (26) |
| H11 | Platzhirsch Home Living (23) | Platzhirsch Lochau (18) |
| H12 | Showroom mit Café (17) | Termin online anfragen (22) |
| H13 | Persönliche Planung (19) | Wohnen, Küche, Outdoor (22) |
| H14 | Jetzt Termin vereinbaren (24) | Termin nach Vereinbarung (24) |
| H15 | Beratung ohne Zeitdruck (23) | Landstraße 9 in Lochau (22) |
| D1 | Sonnenschirme von Tuuci und Umbrosa im Showroom in Lochau ansehen und beraten lassen. (85) | Hotel oder Restaurant? Wir planen Schirme, Lounge und Heizung für Ihre Terrasse. (80) |
| D2 | Für Garten, Terrasse und Gastronomie: Wir planen Sonnenschutz passend zum Ort. (78) | Outdoor mit Tuuci, Umbrosa, Paola Lenti und Heatsail: Termin online anfragen. (77) |
| D3 | Termin online anfragen und in Ruhe vergleichen. Landstraße 9, 6911 Lochau am Bodensee. (86) | Showroom mit Café in Lochau. Termine auch außerhalb der Öffnungszeiten nach Vereinbarung. (89) |
| D4 | Wohnen, Küche, Outdoor aus einer Hand. Für Kunden aus Vorarlberg und vom Arlberg. (81) | Einrichtungsstudio am Bodensee für Kundinnen und Kunden aus Vorarlberg und vom Arlberg. (87) |

### Outdoor-Moebel-Lenti-Gloster-Heatsail

Ziel-URL: `/de/produkte/lounge-furniture-daybeds` (AT) · Pfad: `/Outdoor/Lounge`

| # | RSA A – Produkt | RSA B – Planung/Service |
|---|---|---|
| H1 | Outdoor-Lounges erleben (23) | Ihre Terrasse planen lassen (27) |
| H2 | Paola Lenti live ansehen (24) | Lounge, Schirm, Heizung (23) |
| H3 | Gloster-Gartenmöbel (19) | Für Garten und Gastronomie (26) |
| H4 | Heatsail für die Terrasse (25) | Planung für Hotelterrassen (26) |
| H5 | Design-Gartenmöbel (18) | Outdoor am Bodensee (19) |
| H6 | Terrasse am See planen (22) | Stoffe für draußen ansehen (26) |
| H7 | Outdoor im Showroom (19) | Outdoor in Ruhe planen (22) |
| H8 | Showroom in Lochau (18) | Showroom in Lochau (18) |
| H9 | Für Vorarlberg und Arlberg (26) | Für Vorarlberg und Arlberg (26) |
| H10 | Planung in ganz Vorarlberg (26) | Planung in ganz Vorarlberg (26) |
| H11 | Platzhirsch Home Living (23) | Platzhirsch Lochau (18) |
| H12 | Showroom mit Café (17) | Termin online anfragen (22) |
| H13 | Persönliche Planung (19) | Wohnen, Küche, Outdoor (22) |
| H14 | Jetzt Termin vereinbaren (24) | Termin nach Vereinbarung (24) |
| H15 | Beratung ohne Zeitdruck (23) | Landstraße 9 in Lochau (22) |
| D1 | Outdoor-Möbel von Paola Lenti, Gloster und Heatsail im Showroom in Lochau erleben. (82) | Hotel oder Restaurant? Wir planen Lounge, Schirme und Heizung für Ihre Terrasse. (80) |
| D2 | Lounge, Esstisch, Sonnenschirm, Heizung: Wir planen Ihre Terrasse als Ganzes. (77) | Outdoor mit Paola Lenti, Gloster, Tuuci und Heatsail: Termin online anfragen. (77) |
| D3 | Termin online anfragen und in Ruhe vergleichen. Landstraße 9, 6911 Lochau am Bodensee. (86) | Showroom mit Café in Lochau. Termine auch außerhalb der Öffnungszeiten nach Vereinbarung. (89) |
| D4 | Wohnen, Küche, Outdoor aus einer Hand. Für Kunden aus Vorarlberg und vom Arlberg. (81) | Einrichtungsstudio am Bodensee für Kundinnen und Kunden aus Vorarlberg und vom Arlberg. (87) |

## Anhang B – Keywords je Anzeigengruppe (Vorlage AT)

P = Phrase ("…"), E = Exact ([…]). Regionale Keywords werden pro Region mit den Orten aus Abschnitt 6.1 erzeugt.

| Anzeigengruppe | Keywords | Regional (Muster) | AG-Negatives (Phrase) |
|---|---|---|---|
| Minotti | minotti (P+E), minotti sofa (P+E), minotti möbel (P+E), minotti couch (P+E), minotti sessel (P+E), minotti kaufen (P+E), minotti ausstellung (P+E), minotti sofa preis (P), minotti lawrence (P), minotti hamilton (P), minotti connery (P), minotti torii (P), minotti freeman (P), minotti yang (P) | minotti {CITY} | minotti cucine, cucine, küche, outdoor |
| Poliform-Wohnen | poliform (P+E), poliform möbel (P+E), poliform schrank (P+E), poliform kleiderschrank (P+E), poliform begehbarer kleiderschrank (P+E), poliform bett (P+E), poliform sofa (P+E), poliform senzafine (P), poliform ubik (P), poliform kaufen (P+E) | poliform {CITY} | küche, kitchen, varenna |
| Rimadesio | rimadesio (P+E), rimadesio schrank (P+E), rimadesio schiebetüren (P+E), rimadesio schiebetür (P+E), rimadesio regal (P+E), rimadesio kleiderschrank (P+E), rimadesio begehbarer kleiderschrank (P), rimadesio abacus (P), rimadesio velaris (P), rimadesio möbel (P+E) | rimadesio {CITY} | – |
| Treca | treca paris (P+E), treca matratze (P+E), treca bett (P+E), treca boxspringbett (P+E), treca interiors (P+E), treca matratzen (P+E) | treca {CITY} | – |
| Designermoebel-Region | – | designermöbel {CITY}, designmöbel {CITY}, einrichtungshaus {CITY}, designer sofa {CITY}, italienische möbel {CITY}, einrichtungsberatung {CITY}, interior design {CITY} | minotti, poliform, rimadesio, treca, küche, outdoor, garten |
| Kueche-Poliform-Varenna | poliform küche (P+E), poliform küchen (P+E), varenna küche (P+E), varenna poliform (P+E), poliform varenna küche (P+E), poliform kitchen (P), poliform küche preis (P) | poliform küche {CITY} | comer see, lago di como, hotel, urlaub, ferienwohnung, fähre, villa, wetter |
| Kueche-next125-Schueller | next125 (P+E), next125 küche (P+E), next125 küchen (P+E), next 125 küche (P+E), schüller küche (P+E), schüller küchen (P+E), next125 kaufen (P), schüller küche kaufen (P) | next125 {CITY} | ersatzteile, griffe, aufbauanleitung, montageanleitung, 125ccm, motorrad, roller |
| Designkueche-Steinplatte | küche mit steinarbeitsplatte (P+E), küche mit steinplatte (P+E), küche mit marmorarbeitsplatte (P+E), küche mit marmor arbeitsplatte (P), küche mit keramikarbeitsplatte (P+E), küche mit keramik arbeitsplatte (P), küche mit naturstein arbeitsplatte (P+E), küche mit granitarbeitsplatte (P), designküche mit stein (P+E), designküche preis (P), moderne küche mit steinarbeitsplatte (P) | designküche {CITY}, küche mit stein {CITY} | selber machen, diy, reinigen, pflege, fleck, kratzer, zuschnitt, restposten, reste, nachträglich, nur arbeitsplatte, steinmetz, erfahrungen nachteile, ikea, nobilia, poliform, next125, schüller |
| Kuechenstudio-Region | – | küchenstudio {CITY}, küchenplanung {CITY}, designküche {CITY}, küche kaufen {CITY}, küchenbauer {CITY}, einbauküche {CITY} | ikea, nobilia, gebrauchte küche, küchenzeile, miniküche, single küche, poliform, next125, schüller |
| Outdoor-Tuuci-Umbrosa | tuuci (P+E), tuuci sonnenschirm (P+E), tuuci schirm (P+E), umbrosa (P+E), umbrosa sonnenschirm (P+E), umbrosa paraflex (P+E), umbrosa icarus (P), design sonnenschirm (P+E), sonnenschirm gastronomie (P+E), großschirm gastronomie (P), sonnenschirm hotel terrasse (P) | – | ersatzteile, bezug ersatz, ständer gebraucht, obi, hornbach, aldi, lidl, tchibo, dehner, hagebau |
| Outdoor-Moebel-Lenti-Gloster-Heatsail | paola lenti (P+E), paola lenti outdoor (P+E), paola lenti lounge (P+E), gloster gartenmöbel (P+E), gloster outdoor möbel (P+E), gloster teak (P), heatsail (P+E), heatsail heizstrahler (P+E), design gartenmöbel (P+E), outdoor loungemöbel design (P) | gartenmöbel {CITY}, outdoor möbel {CITY}, loungemöbel {CITY} | gloster meteor, gloster gladiator, flugzeug, gloucester, obi, hornbach, aldi, lidl, tchibo, dehner, hagebau, polyrattan, gebraucht |
Quellen: Google Ads Marken-Richtlinie https://support.google.com/adspolicy/answer/6118 (abgerufen 26.10.2026); EWR-Praxis (Sekundärquellen): https://www.brandverity.com/blog/google-ads-trademark-rules-101, https://cassels.com/insights/revisions-to-google-ads-trademark-policy-to-take-effect-on-july-24/
