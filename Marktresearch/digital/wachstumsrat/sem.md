# Wachstumsrat SEM: Google Ads, Microsoft Ads, Meta, Pinterest

**Stand:** 28.10.2026 · **Gremium:** SEM-, Google-Ads- und Digital-Marketing-Experten · **Kürzel:** `sem`
**Grundlage:** `marketing/google-ads-kampagnen.md` und `marketing/ads-csv/**` (Entwurf vom 26.10.), `digital/10-performance-marketing.md`, `marketing/meta-pinterest-kampagnen.md`, `23-masterkonzept.md`, `29`, `30`, `digital/teamleiter/inhaber-entscheidungen.md`. Code nur gelesen: `src/lib/attribution.js`, `src/lib/forms/leadPayload.js`, `src/components/Cookies/googleTag.js`, `src/lib/legal/services.js`, `src/lib/analytics.js` und die Aufrufe von `trackLead`.
**Kennzeichnung:** [belegt] = im Code, in den Unterlagen oder in der verlinkten Quelle geprüft · [Schätzung] = eigene Herleitung · [prüfen] = vor dem Start klären. Das ist keine Rechtsberatung.
**Hinweis:** Der Dev-Server `localhost:3000` gab am 28.10. während der parallelen Bau-Workflows HTTP 500 oder Timeouts zurück (`/de`, `/de/outdoor-gartenplanung`, `/de/ezarri`). Die Zielseiten habe ich deshalb nur im Code geprüft und keine Screenshots gemacht.

---

## 1. Urteil zum Ist-Stand

| Bereich | Note (1–10) | Kurzbegründung |
|---|---|---|
| Tracking-Fundament im Code | **7** | Consent Mode v2 und eine getrennte Ads-Einwilligung sind umgesetzt. Ein Ads-Tag lädt auch ohne GA4 (`googleTag.js`). Klick-IDs `gclid/gbraid/wbraid/fbclid/msclkid` und UTM werden nur mit Einwilligung gespeichert (`attribution.js`, 90 Tage). `lead_ref` geht als `transaction_id` an `generate_lead` [belegt]. Es fehlen: die Ads-ID (`NEXT_PUBLIC_GOOGLE_ADS_ID` ist leer), Werte und Segmente an den Leads, Enhanced Conversions und ein Rückkanal aus dem Backoffice. |
| Kontoentwurf Google Search (26.10.) | **6** | Handwerklich gut: 11 Kampagnen, 1.536 Keywords, 840 Negatives, Längen- und Wortprüfung im Generator. Aber: **falsche Hausnummer in 48 Zeilen**, und **die neuen Geschäftsfelder fehlen ganz**: ClassiCon (Händler-Aussage erlaubt), Ezarri/Pool, Hotel/Contract, Yacht, Outdoor-Gartenkoordination. |
| PMax, Demand Gen, YouTube, Microsoft | **3** | Nur als Zeilen in einer Tabelle. Keine Asset-Gruppen, keine Signale, keine Brand-Ausschlüsse, keine Feed-Entscheidung. |
| Meta / Pinterest | **5** | Texte und Formulare stehen. Das Meta-Pixel ist im Banner „nicht eingesetzt“ [belegt, `services.js`]. Website-Retargeting ist deshalb heute nicht möglich, Lead Ads (Sofortformulare) aber schon. |
| Offline-Conversions (Showroom-Termin → Auftrag) | **2** | Konzept F4 in Bericht 10 vorhanden. Das Backoffice hat aber **keine Felder** für Klick-ID, `lead_ref` und Status. Die Herkunft landet nur als Textblock im Freitextfeld [belegt, `leadPayload.js`]. Ohne diese Felder lernt kein Algorithmus, welcher Lead gekauft hat. |
| **Gesamt (startbereit?)** | **5 / nein** | Mit einer Woche Arbeit am Fundament (Abschnitt 4, P0) kommt das Konto auf eine 7 und kann mit kleinem Budget starten. |

---

## 2. Befunde und Chancen

### 2.1 Blocker (vor jedem Euro Media beheben)
1. **Hausnummer:** Im Generator `ads-csv/generator/gen-ads.js` steht „Landstraße 9“ (Z. 62, 64, 228, 261, 263). Daraus kommen 44 Zeilen in `06-anzeigen-rsa.csv` und 4 in `07-sitelinks.csv`. Laut Inhaber-Entscheidung Nr. 2 gilt **Landstraße 11**. In CH/FL wird daraus „Landstrasse 11“. Danach den Generator neu laufen lassen. Fehlerhafte Adressen in Anzeigen verstoßen gegen Googles Richtlinie zu irreführenden Angaben und senken das Vertrauen.
2. **Keine Ads-Conversion-ID:** `GOOGLE_TAG_IDS.ads` liest `NEXT_PUBLIC_GOOGLE_ADS_ID`. Der Wert ist nicht gesetzt [belegt]. Ohne ihn gibt es weder Conversion-Tag noch Enhanced Conversions noch Remarketing-Listen.
3. **`kuechenplaner`-Lead ohne `transaction_id`:** `src/components/Labs/Kuechenplaner/ResultPanel.js:256` ruft `trackLead("kuechenplaner")` ohne `lead_ref` auf. Alle anderen Formulare übergeben ihn [belegt]. Das führt zu Doppelzählungen, und der Lead ist offline nicht zuordenbar.
4. **Keine Segmente am Lead:** `/de/beratung` fragt nur „Neubau/Renovierung/Anderes“ und den Objekttyp ab [belegt, `de.json` MultiStepForm]. Yacht, Outdoor und künftig Ezarri und Hotel führen alle auf dasselbe `form=beratung`. Damit kann Smart Bidding einen Hotel-Lead (Bedarf 100–200 T€, `23`, G6) nicht von einer Sofa-Anfrage unterscheiden.
5. **Backoffice ohne Rückkanal:** Es gibt keine Felder `lead_ref`, `gclid/gbraid/wbraid`, `msclkid`, `fbclid`, keinen Status und keinen Auftragswert. Ohne sie ist kein Offline-Import möglich (Abschnitt 3.6).
6. **Gate 0** (Liquidität, `23`, Abschnitt 1 und 9) bleibt Vorbedingung für bezahlte Reichweite. Die Stufe „Klein“ unten ist so gebaut, dass sie nach Gate 0 sofort und ohne Fixkosten starten kann.

### 2.2 Chancen, die der Entwurf noch nicht nutzt
| # | Chance | Warum sie zählt |
|---|---|---|
| C1 | **ClassiCon und Ezarri mit Händler-Aussage** | Nur bei diesen beiden Marken ist „Vertragshändler“ erlaubt (Inhaber-Entscheidung 7, Auftrag). Googles Marken-Richtlinie lässt Wiederverkäufern den Markennamen im Anzeigentext. Mit einer **Markenfreigabe durch den Hersteller** (Formular „Trademark authorization“) ist der Name auch nach einer Beschwerde Dritter abgesichert [belegt: support.google.com/adspolicy/answer/6118; Formular prüfen]. Für Minotti, Poliform usw. bleibt es bei der rein beschreibenden Nutzung. |
| C2 | **Werbekostenzuschuss (Co-op/MDF) von Ezarri und ClassiCon** | Viele Hersteller zahlen Händlern einen Anteil am lokalen Mediabudget. Ob Ezarri und ClassiCon das tun, ist unbekannt [prüfen]. Für die angespannte Liquidität ist das der billigste Weg zu mehr Budget. Inhaber fragt beim nächsten Gespräch nach, Vorlage in 3.8. |
| C3 | **Pool/Glasmosaik als B2B-Nische** | Suchbegriffe wie „glasmosaik pool“ oder „poolfliesen mosaik“ werden fast nur von Bauherren, Poolbauern und Planern gesucht. Im Dreiländereck ist keine regionale Werbung von Ezarri-Händlern bekannt [Schätzung, im Transparency Center prüfen]. Das Gebot ist voraussichtlich niedrig, der Auftrag groß (ein privater Pool mit Mosaik liegt im fünfstelligen Bereich [Schätzung]). |
| C4 | **Hotel/Contract auf Search und LinkedIn-Targeting in Microsoft Ads** | Hoteliers suchen „hoteleinrichtung“ oder „objekteinrichtung“. Microsoft Ads kann zusätzlich nach LinkedIn-Merkmalen (Branche Hospitality, Funktion, Firma) eingrenzen, zu Search-CPCs [Funktion seit 2017 bekannt; Verfügbarkeit für AT/CH prüfen]. Die 10 A-Leads aus `22` lassen sich per Customer Match/Firmenliste gezielt ansprechen. |
| C5 | **Enhanced Conversions for Leads + Data Manager** | Google empfiehlt Enhanced Conversions for Leads statt eines reinen GCLID-Imports. Seit 15.06.2026 laufen Offline-Uploads über die **Data Manager API**, die Google Ads API blockiert sie [belegt: support.google.com/google-ads/answer/15713840, /2998031, /14274408]. Für Platzhirsch reicht der **manuelle oder Google-Sheets-Upload im Data Manager**. Das kostet keine Entwicklung am Backoffice-API, nur eine wöchentliche Liste. |
| C6 | **Meta Lead Ads ohne Pixel** | Sofortformulare laufen ohne Website-Tag. Die „Conversion Leads“-Optimierung nutzt CRM-Status, die über die Conversions API zurückgemeldet werden. Laut Meta funktioniert das nur mit Lead Ads, mit einer Lead-Stufe innerhalb von 28 Tagen und 1–40 % Quote [belegt: developers.facebook.com, Conversion Leads Integration]. So startet Meta, bevor Pixel und Banner-Eintrag fertig sind. |
| C7 | **AI Max for Search nur für generische Kampagnen** | AI Max erweitert Suchanfragen und Ziel-URLs. Über Marken-Steuerungen lassen sich Marken einschließen oder ausschließen [belegt: support.google.com/google-ads/answer/15910187]. Auf Hersteller-Marken-Kampagnen wäre das riskant, denn es entstünden automatisch Anzeigentexte mit Markennamen. Auf „Hoteleinrichtung“ oder „Pool Mosaik“ ist es eine sinnvolle Testoption ab Stufe Mittel. |

---

## 3. Fertige Bausteine

### 3.1 Kontostruktur (alle Kanäle)

Namensregel: `PH-{Kanal}{Nr}-{Land}-{Segment}`. Kanal-Kürzel: S = Search, P = PMax, D = Demand Gen, Y = YouTube, B = Microsoft, M = Meta, I = Pinterest.

| Kampagne | Typ | Geo | Anzeigengruppen / Asset-Gruppen | Zielseite | Gebot (Start → Ziel) | Ab Stufe | Status heute |
|---|---|---|---|---|---|---|---|
| `PH-S1-ALL-Marke` | Search | AT, DE-Süd, CH-Ost, FL | Platzhirsch Marke · Platzhirsch Café | `/de`, `/de/kontakt` | Max. Conversions, 5 €/Tag Deckel | Klein | Entwurf vorhanden |
| `PH-S2-{AT\|DE}-Wohnen` | Search | je Land | Minotti · Poliform · Rimadesio · **ClassiCon (neu)** · Designermöbel-Region | Markenseiten, Regionsseiten | Max. Conv. → tCPA Portfolio | Klein | vorhanden, **ClassiCon ergänzen** |
| `PH-S2-{AT\|DE}-Kueche` | Search | je Land | Poliform/Varenna · next125/Schüller · Designküche-Stein (Binni) · Küchenstudio-Region | `/de/kuechen-vorarlberg`, Binni-LP | Max. Conv. → tCPA | Klein | vorhanden, Binni pausiert |
| `PH-S3-ALL-Ezarri-Pool` **(neu)** | Search | AT, DE-Süd, CH-Ost, FL, + DE-BW/BY Radius 150 km | Ezarri Marke · Glasmosaik Pool · Mosaik Bad/Wellness · Poolbauer/Planer (B2B) | `/de/ezarri` und Unterseiten | Max. Conv. | Klein (ab Livegang Ezarri) | **fehlt** |
| `PH-S4-ALL-Hotel-Contract` **(neu)** | Search | AT, DE-Süd, CH-Ost, FL | Hoteleinrichtung · Gastronomie/Restaurant · Outdoor Gastro/Hotel (Tuuci, Paola Lenti) · Objekteinrichtung/FF&E | **neue LP `/de/hotel-einrichtung`** (fehlt, `23` Website Punkt 6) | Max. Conv., hoher Lead-Wert | Mittel (ab LP) | **fehlt** |
| `PH-S5-{AT\|DE}-Outdoor` | Search | AT, DE-Süd | Outdoor-Möbel Marken · Sonnenschirme · **Gartenplanung koordiniert (neu)** | `/de/produkte/parasols`, `/de/outdoor-gartenplanung` | Max. Conv., saisonal Feb–Mai | Klein (saisonal) | vorhanden, Garten fehlt. **LP noindex bis Rechtsprüfung (`30`, Abschnitt 8)**, deshalb die Garten-Gruppe erst danach aktivieren |
| `PH-S6-ALL-Yacht` **(neu)** | Search | Bodensee-Radius 40 km um Lochau (AT/DE/CH) | Yacht Interior · Bootspolster/Stoffe · Bootshaus einrichten | `/de/yacht-interior` | Max. Klicks mit CPC-Limit 2,50 € → Max. Conv. | Mittel, Saison März–Juni | **fehlt**. LP ist bis zur Navetta-42-Bildfreigabe noindex und nur Labs-intern (Inhaber 27.10.), deshalb **gesperrt** |
| `PH-S7-{CH\|FL}-Alle` | Search | CH-Ost, FL | wie AT, CH-Schreibweise | Regionsseiten, `/de/einkaufen-aus-der-schweiz` | Max. Conv. | Mittel | vorhanden, pausiert bis CH-Ablauf |
| `PH-S8-ALL-Ratgeber` | Search | alle | Preisfragen, „was kostet…“ | Ratgeber | Max. Klicks, CPC-Limit 1,20 € | Mittel | nur Idee. **Erst Ratgeber ohne [prüfen]-Stellen freigeben** |
| `PH-P1-ALL-Leads` | PMax ohne Feed | AT, DE-Süd (CH/FL später) | AG1 Italienisch Wohnen · AG2 Küche · AG3 Pool/Ezarri · AG4 Hotel/Outdoor | Marken-/Segmentseiten, **Final-URL-Erweiterung aus**, nur gelistete URLs | tCPA ab 30 Conv./Monat, später tROAS mit Offline-Werten | Mittel, erst wenn Offline-Import (3.6) läuft | – |
| `PH-P2-AT-Atelier` | PMax mit Feed | 60 km um Lochau | Ausstellungsstücke mit Preis | `/de/atelierverkauf` | tROAS | Groß, nur wenn Feed zulässig | **[prüfen]**: Shopping verlangt Kaufmöglichkeit oder Local Inventory. Eine reine Reservierung reicht eventuell nicht |
| `PH-D1-ALL-DemandGen` | Demand Gen | AT, DE-Süd, Zone D (München, Stuttgart, Zürich) | Video/Karussell: Showroom, Pool, Küche | LP je Thema | Max. Conv. | Groß | Video fehlt |
| `PH-Y1-ALL-Reichweite` | YouTube (Video Reach) | Zone A+B | 15-s- und 6-s-Spots Showroom/Café | `/de` | tCPM | Groß | Video fehlt |
| `PH-B*` (Microsoft) | Search-Import | wie Google | Import S1, S2, S3, S4 (Kopie), plus **LinkedIn-Profil-Targeting** bei S4 Hotel | wie Google | Enhanced CPC → Max. Conv. | Mittel | – |
| `PH-M1-ALL-LeadAds` | Meta Lead Ads (Sofortformular, „Mehr Details“) | Zone A+B (C nach CH-Ablauf) | Showroom-Termin · Küche · Pool/Ezarri · Hotel (Zielgruppe Gastgewerbe) | Sofortformular | Conversion Leads (mit CRM-Rückmeldung) | Klein | Formulare in `meta-pinterest-kampagnen.md` 5.x |
| `PH-M2-ALL-Retargeting` | Meta Traffic/Leads | Besucher 30/90/180 Tage | Merkliste ohne Anfrage, Video 50 % | LP | Max. Leads | Mittel, **erst mit Pixel + Banner + DSE** | blockiert |
| `PH-I1-ALL-Consideration` | Pinterest | AT, DE, CH (FL [prüfen]) | Küche · Pool · Outdoor · Wohnzimmer | Ratgeber/LP | oCPM Klicks → Conversions | Mittel | AT und CH sind als Werbeländer gelistet [belegt: help.pinterest.com/en/node/821] |

**Shared Library (einmal im Konto):**
- Ausschlussliste „PH-Konto-Negativ“ (bestehend, 46 Begriffe), dazu **Kontoebene-Negatives** (wirken auch auf PMax Search/Shopping; Grenze 1.000 [belegt: support.google.com/google-ads/answer/13607727]).
- **Marken-Ausschlussliste „Platzhirsch“** für PMax und AI Max, damit PMax keine eigenen Markensuchen aus S1 abschöpft.
- **Placement-Ausschlüsse** für Demand Gen/PMax: Apps der Kategorie Spiele, Kinder-Kanäle (YouTube „made for kids“), Parked Domains.
- Zielgruppen: „Website-Besucher 180 T“, „Lead-Einreicher 540 T“ (Ausschluss in Akquise-Kampagnen), „Kunden“ (Customer Match, **nur mit Einwilligung und `ad_user_data`**), „Architekten/Planer“ (Liste aus `22`, Firmen-Targeting nur LinkedIn/Microsoft).

### 3.2 Geo-Targeting (verbindlich)

| Zone | Google/Microsoft | Meta/Pinterest | Option |
|---|---|---|---|
| AT | Vorarlberg, Bezirk Landeck (Arlberg), Bezirk Reutte | Vorarlberg + 25 km um Lech/St. Anton | „Präsenz“ |
| DE-Süd | Lkr. Lindau, Bodenseekreis, Lkr. Ravensburg, Lkr. Konstanz, Kempten, Oberallgäu | gleich | Präsenz |
| CH-Ost | SG, AR, AI, TG, Chur/Region Plessur (Graubünden-Nord) | gleich | Präsenz, **pausiert bis CH-Ablauf** (MWST/Zoll, `18`) |
| FL | Land Liechtenstein | Liechtenstein [Meta prüfen] | Präsenz |
| Ezarri-Radius | **zusätzlich** 150 km um Lochau, aber nur für `PH-S3` Gruppe „Poolbauer/Planer“ | – | Präsenz. Grund: Poolbauer und Planer arbeiten überregional, ein B2B-Kunde reicht für viele Pools |
| Zone D Zweitwohnsitz | – | München, Stuttgart, Zürich + Interesse Ferienimmobilie | „Interesse“ nur in Demand Gen/Meta |
| Ausschluss überall | Wien, Berlin, Hamburg (Gattungswort „Platzhirsch“), und alle Gebiete außerhalb der Liste | – | – |

### 3.3 Gebotsstrategie (Regelwerk)

| Phase | Bedingung | Strategie | Regel |
|---|---|---|---|
| 0 „Stummes Tracking“ | 14 Tage vor Start | – | Tag-Diagnose grün, Testlead in DebugView, `transaction_id` dedupliziert |
| 1 Lernen | < 15 Conv./30 T je Kampagne | **Max. Conversions** ohne Ziel, Tagesbudget als Deckel. Hotel/Yacht: Max. Klicks mit CPC-Limit, bis 5 Leads da sind | Gebotsstrategie 14 Tage nicht anfassen |
| 2 Steuern | ≥ 30 Conv./30 T im **Portfolio** (AT+DE Wohnen+Küche zusammen) | **Ziel-CPA im Portfolio** = tatsächlicher CPA der letzten 30 Tage × 1,1 | Änderungen höchstens ±15 % pro Woche |
| 3 Wert | Offline-Import liefert ≥ 15 `qualified_lead`/Monat | **Max. Conversion-Wert**, dann **tROAS** (Start = Ist-ROAS × 0,9) mit Primärziel `qualified_lead` + `purchase` | Formular-Leads werden dann **sekundär** |
| Immer | – | Eigene Marke getrennt, nie in PMax. Suchnetzwerk-Partner und Display in Search aus | Monatlich Auktionsdaten auf Gebote fremder Händler auf „Platzhirsch“ prüfen |

**Lead-Werte je Segment** (ersetzen 300/200/120 € aus dem Entwurf, [Schätzung], nach 90 Tagen durch echte Werte ersetzen):

| Segment (`segment`-Parameter) | Lead-Wert | Herleitung |
|---|---|---|
| `hotel` (Hotel/Gastro/Contract) | 1.000 € | Bedarf 100–200 T€ je Projekt (`23`, G6), sehr niedrige Abschlussquote, deshalb vorsichtig |
| `kueche` | 450 € | Küchen haben höhere Auftragswerte als Einzelmöbel [Schätzung] |
| `ezarri_b2b` (Poolbauer/Planer) | 600 € | Wiederkehrender Kunde |
| `ezarri_privat` (Pool/Bad) | 350 € | – |
| `wohnen` (Beratung/Termin) | 300 € | wie Bericht 10 |
| `outdoor_garten` | 300 € | Ø 8–12 T€ (`30`) |
| `yacht` | 300 € | Nische, unklarer Auftragswert (`29`) |
| `produkt_anfrage` | 200 € | wie Bericht 10 |
| `kontakt` | 120 € | wie Bericht 10 |
| Anruf ≥ 60 s | 150 € | – |
| `kuechenplaner` (Labs) | 150 € | Selbstplaner, frühe Phase |
| `atelier_reservierung` | echter Reservierungswert (Preis × 0,3) | Preis steht auf der Seite [belegt] |
| `gutschein`, `adventsabend`, `sign_up` | sekundär, nicht für Gebote | – |

### 3.4 Budgetplan in 3 Stufen (Monat, netto Media, ohne Produktion)

Gegenüber Bericht 10 (3/8/15 T€) ist **„Klein“ auf 2.000 € gesenkt**. Grund: die Finanzlage. Das neue Geld geht in die Segmente mit dem höchsten Auftragswert pro Lead (Küche, Ezarri, Hotel). „Mittel“ und „Groß“ entsprechen etwa der Größenordnung aus Bericht 10.

| Kampagne | Klein (2.000 €) | Mittel (6.000 €) | Groß (14.000 €) |
|---|---|---|---|
| S1 Marke | 120 | 200 | 300 |
| S2 AT+DE Wohnen (inkl. ClassiCon) | 550 | 1.100 | 2.000 |
| S2 AT+DE Küche (inkl. Binni) | 450 | 1.000 | 1.800 |
| S3 Ezarri/Pool | 300 | 600 | 1.000 |
| S4 Hotel/Contract | 0 (keine LP) | 500 | 1.000 |
| S5 Outdoor (Feb–Mai; sonst in Wohnen) | (150 aus Wohnen) | 300 | 600 |
| S6 Yacht (März–Juni) | 0 | 150 | 300 |
| S7 CH/FL | 0 | 400 | 1.000 |
| S8 Ratgeber | 0 | 150 | 400 |
| P1 PMax Leads | 0 | 600 | 2.000 |
| P2 PMax Atelier | 0 | 0 | 300 |
| D1/Y1 Demand Gen, YouTube | 0 | 0 | 1.300 |
| Microsoft Ads | 0 | 200 | 400 |
| M1 Meta Lead Ads | 500 | 600 | 900 |
| M2 Meta Retargeting | 0 | 200 | 500 |
| I1 Pinterest | 80 (Test) | 0–200 | 600 |
| Puffer/Tests | 0 | 0 | 400 |
| **Summe** | **2.000** | **6.000** (± 200 Pinterest) | **14.000** |

**Stufenwechsel:** nur, wenn zwei Monate in Folge (a) die Kosten pro qualifiziertem Lead ≤ 250 € liegen [Schätzung, Bericht 10, 3.3], (b) mindestens 1 Auftrag aus Paid im Backoffice belegt ist und (c) die Liquiditätsplanung die nächste Stufe deckt. **Abbruchregel:** Liegen nach 60 Tagen die Kosten pro qualifiziertem Lead über 400 €, wird die jeweilige Kampagne pausiert.

**Kosten außerhalb der Media** [Schätzung]: Einrichtung intern 3–5 Tage Code-Team (Abschnitt 4). Betrieb 3–5 h pro Woche durch den Inhaber oder eine Kraft. Keine Agentur-Dauerbetreuung in Stufe Klein.

### 3.5 Brand-Schutz und Markenrecht (Regelwerk für Texte)

| Fall | Keyword | Name im Anzeigentext | Erlaubte Formulierung | Verboten |
|---|---|---|---|---|
| **Platzhirsch** (eigene Marke) | ja, Exact + Phrase | ja | „Platzhirsch Home Living“ | – |
| **ClassiCon** | ja | ja | „ClassiCon-Vertragshändler in Lochau“, „ClassiCon im Showroom erleben“ | „offizieller Store“, „exklusiv“ |
| **Ezarri** | ja | ja | „Ezarri-Vertragshändler am Bodensee“, „Ezarri Glasmosaik bemustern“ | „Ezarri Österreich“ als Absender, „einziger Händler“ |
| **Minotti, Poliform, Rimadesio, Paola Lenti, Tuuci …** | ja | nur beschreibend | „Minotti-Sofas in Lochau erleben“, „Poliform-Küche planen lassen“ | Händler, Vertragshändler, autorisiert, offiziell, Store, Flagship, Nr. 1, größte |
| **Binni** | ja | erst nach Vertrag mit Binni und Freigabe | „Steinküchen von Binni“ | „Made in Italy“ |
| **Wettbewerber** (Höttges, reiter, Dolce Vita …) | **nein** | nein | – | – |
| **Custom Line / Navetta / Werften** | **nein** | nein | – | Keine Werft- oder Bootsmarken buchen, solange die Bildfreigabe fehlt (`yacht-minotti-navetta42-bilder.md`) |

**Rechtliche Leitplanke:** Nach dem EuGH (Google France, C-236/08 bis C-238/08, 23.03.2010; Interflora, C-323/09, 22.09.2011) ist die Buchung fremder Marken als Keyword zulässig, solange ein normal informierter Nutzer erkennt, dass die Anzeige nicht vom Markeninhaber stammt [belegt: curia.europa.eu]. Daraus folgt: Absender „Platzhirsch“ in jeder Anzeige (Unternehmensname-Asset plus eine Headline), keine Verbindung zum Hersteller andeuten, außer bei ClassiCon und Ezarri.

**Schritte zum Schutz:**
1. ClassiCon und Ezarri um eine **Markenfreigabe für das Google-Ads-Konto** bitten (Google „Trademark authorization“). Ist der Name bei Google geschützt, kann der Hersteller das Konto freischalten.
2. **S1 Marke** läuft immer, auch in Stufe Klein. Negative gegen das Gattungswort („platzhirsch bier“, „jagd“ usw., Entwurf Abschnitt 10).
3. Monatlich das **Ads Transparency Center** (adstransparency.google.com) nach Anzeigen fremder Händler auf „Platzhirsch“ durchsuchen. Bei Missbrauch des Namens im Anzeigentext eine Markenbeschwerde einreichen. Voraussetzung ist eine eingetragene Marke [prüfen: ist „Platzhirsch Home Living“ beim ÖPA/EUIPO eingetragen?].
4. KI-Bilder (Yacht-Renderings) in Anzeigen nur mit Kennzeichnung „KI-generierte Visualisierung“ (Art. 50 KI-VO, wie auf der Seite).

### 3.6 Remarketing mit Consent und Offline-Conversions aus Showroom-Terminen

**Consent-Regeln (Konto-Einstellungen):**
- Consent Mode v2 **Basic** beibehalten: Tags laden erst nach Einwilligung (heutige Umsetzung [belegt]). Ohne Einwilligung keine Modellierung. Der Verzicht auf Advanced ist eine bewusst vorsichtige Wahl im DACH-Raum.
- Remarketing-Listen und Customer Match nur für Nutzer mit `ad_personalization=granted` bzw. `ad_user_data=granted`. Das stellt Google technisch sicher, wenn die Signale korrekt ankommen. Prüfung in der Tag-Diagnose „Consent-Status“.
- Customer-Match-Listen nur aus Kontakten, die einer werblichen Nutzung zugestimmt haben (Newsletter-Double-Opt-in oder ausdrückliches Häkchen im Formular). **Datenschutzerklärung und Banner ergänzen** (Recht `02`, Abschnitt „Google Ads“, und Meta-Abschnitt, sobald aktiv).
- Meta-Pixel und Pinterest-Tag erst mit eigenem Banner-Eintrag (`services.js` → `status: "aktiv"`) und eigenem DSE-Abschnitt. Bis dahin **nur** Lead Ads und Pinterest ohne Tag.

**Offline-Conversion-Kette (Zielbild, wenig Kapital):**

| Stufe | Backoffice-Status (neu) | Conversion-Aktion Google | Meta CRM-Event | Wert | Upload |
|---|---|---|---|---|---|
| 1 | Lead eingegangen | `lead_{segment}` (Web-Tag, Primär bis Phase 3) | `Lead` | Segment-Wert 3.3 | automatisch |
| 2 | **Qualifiziert** (Budget und Zeitraum passen, echter Bedarf) | `qualified_lead` | `QualifiedLead` | 600 € | wöchentlich |
| 3 | **Showroom-Termin wahrgenommen** | `showroom_visit` | `ShowroomVisit` | 900 € | wöchentlich |
| 4 | Angebot verschickt | `proposal_sent` | `Proposal` | 1.500 € | wöchentlich |
| 5 | Auftrag | `purchase` | `Purchase` | echter Netto-Auftragswert | wöchentlich |
| – | Kein Bedarf / Spam | (Anpassung „Rücknahme“) | `Disqualified` | 0 | wöchentlich |

**Technik in drei Schritten:**
1. **Backoffice-Felder** (Frappe, durch das Code-Team bzw. den Backoffice-Betreuer): `lead_ref` (UUID), `gclid`, `gbraid`, `wbraid`, `msclkid`, `fbclid`, `meta_lead_id`, `status` (Auswahl Stufe 1–5/Rücknahme), `status_datum`, `auftragswert_netto`, `segment`, `consent_ads` (ja/nein). Die Routen in `src/lib/forms/forward.js` schicken `lead_ref` und die Klick-IDs heute **nicht** weiter [belegt, Kommentar in `leadPayload.js`]. Künftig gehen sie als eigene Felder mit, **nur wenn `consent_ads` = ja**.
2. **Web-Tag Enhanced Conversions:** beim Absenden E-Mail und Telefon (normalisiert, SHA-256 durch gtag) als `user_data` an das Ads-Conversion-Event, nur mit `ad_user_data=granted`. Das ist die Voraussetzung, damit Uploads später auch **ohne GCLID** zuordenbar sind.
3. **Wöchentlicher Upload** jeden Montag: Ein Export aus dem Backoffice (CSV oder Google Sheet) mit den Spalten `Google Click ID | GBRAID | WBRAID | Email (gehasht) | Phone (gehasht) | Conversion Name | Conversion Time | Conversion Value | Currency | Order ID (=lead_ref)` geht in den **Data Manager** von Google Ads (geplanter Sheets-Upload). Microsoft Ads: Offline-Import mit `msclkid` (CSV). Meta: CRM-Events über die Conversions API mit `lead_id`, für den Anfang über eine Partner-Integration oder einen kleinen Route Handler [prüfen: Ablösung der alten Offline Conversions API].
   Fristen: Google-Uploads bis 90 Tage nach dem Klick, Enhanced Conversions for Leads bis 63 Tage [laut Sekundärquelle relevantaudience.com, bei Google prüfen]. Ein Showroom-Termin liegt meist innerhalb dieser Fenster, ein Auftrag nach 2–6 Monaten oft nicht. Deshalb ist **`showroom_visit` der wichtigste Offline-Wert für die Gebote**, `purchase` dient vor allem der Auswertung.

**Showroom-Termine ohne Online-Klick** (Laufkundschaft, Café): Am Empfang wird gefragt „Wie sind Sie auf uns aufmerksam geworden?“. Die Antwortliste lautet *Google-Suche · Google-Anzeige · Instagram/Facebook · Pinterest · Empfehlung · Architekt · Vorbeigefahren/Café · Messe/Event · Sonstiges*. Die Antwort kommt ins Backoffice-Feld `herkunft_selbstauskunft`. Wer eine E-Mail hinterlässt und einwilligt, wird über die gehashte E-Mail als `showroom_visit` hochgeladen (Enhanced Conversions for Leads ordnet zu, wenn die Person vorher geklickt hat).

### 3.7 Keyword-Sets für die neuen Segmente

Match-Typen: **[E]** = Exact, **„P“** = Phrase. Broad Match nur später in AI-Max-Tests. Sprache Deutsch. In CH/FL wird „ß“ zu „ss“ (Generator).

**S2 – Ergänzung ClassiCon (AG `ClassiCon`)**
| Keyword | Typ |
|---|---|
| classicon | [E] |
| classicon händler | „P“ |
| classicon vorarlberg / bregenz / lindau / bodensee / st gallen | „P“ |
| classicon bibendum · classicon e1027 · classicon adjustable table · classicon day bed | „P“ (nur Modelle, die im Sortiment sind) [prüfen] |
| eileen gray tisch · eileen gray beistelltisch | „P“ |
| classicon kaufen | „P“ |

**S3 – Ezarri / Pool**
| AG | Keywords |
|---|---|
| Ezarri Marke | [E] ezarri · „P“ ezarri mosaik · „P“ ezarri glasmosaik · „P“ ezarri händler · „P“ ezarri österreich · „P“ ezarri schweiz · „P“ ezarri pool · „P“ ezarri fliesen |
| Glasmosaik Pool | „P“ glasmosaik pool · „P“ pool mosaik · „P“ poolmosaik · „P“ poolfliesen mosaik · „P“ mosaikfliesen schwimmbad · „P“ schwimmbad mosaik · „P“ pool fliesen glas · „P“ pool auskleiden mosaik · „P“ infinity pool mosaik · „P“ pool fliesen vorarlberg · „P“ pool mosaik bodensee |
| Mosaik Bad/Wellness | „P“ glasmosaik bad · „P“ mosaik dusche · „P“ mosaik wellness · „P“ mosaik spa · „P“ dampfbad mosaik · „P“ glasmosaik fliesen kaufen · „P“ mosaik badezimmer vorarlberg |
| Poolbauer/Planer (B2B) | „P“ glasmosaik großhandel · „P“ poolbau mosaik lieferant · „P“ mosaik für poolbauer · „P“ glasmosaik objekt · „P“ glasmosaik hotel · „P“ mosaik muster bestellen · „P“ glasmosaik technisches datenblatt |

**S4 – Hotel / Contract**
| AG | Keywords |
|---|---|
| Hoteleinrichtung | „P“ hoteleinrichtung · „P“ hotel einrichten · „P“ hotelmöbel · „P“ hotelzimmer einrichtung · „P“ hotel lobby möbel · „P“ hotelausstattung möbel · „P“ hoteleinrichtung vorarlberg / bodensee / tirol / ostschweiz / liechtenstein · „P“ hotel renovierung einrichtung |
| Gastronomie | „P“ restaurant einrichtung · „P“ gastronomie möbel design · „P“ bar einrichtung · „P“ café einrichtung · „P“ restaurant einrichten lassen · „P“ gastro stühle design |
| Outdoor Hotel/Gastro | „P“ sonnenschirme gastronomie · „P“ gastro sonnenschirm · „P“ hotel terrasse möbel · „P“ outdoor möbel hotel · „P“ rooftop möbel · „P“ tuuci gastronomie · „P“ paola lenti hotel |
| Objekt/FF&E | „P“ objekteinrichtung · „P“ objektmöbel · „P“ contract möbel · „P“ ff&e · „P“ objekteinrichter · „P“ möbel für apartments · „P“ ferienwohnung einrichten lassen · „P“ chalet einrichten |

**S5 – Ergänzung Outdoor-Garten (AG `Gartenplanung-koordiniert`, erst nach Rechtsprüfung `30`)**
„P“ gartenplanung vorarlberg · „P“ gartengestaltung bodensee · „P“ terrasse planen lassen · „P“ outdoor küche planen · „P“ gartenmöbel planung · „P“ pool und garten planung · „P“ garten mit pool gestalten. **Anzeigentext ohne „Bauleitung“, „Generalunternehmer“ oder „schlüsselfertig“** (`30`, § 32 GewO).

**S6 – Yacht (erst nach Bildfreigabe/Indexierung)**
„P“ yacht interior · „P“ yacht interior bodensee · „P“ boot innenausstattung · „P“ bootspolster · „P“ bootspolster bodensee · „P“ bootspolster nach maß · „P“ cockpit polster boot · „P“ boot stoffe outdoor · „P“ bootshaus einrichten · „P“ motorboot einrichtung · „P“ segelyacht interior.

### 3.8 Negative Keywords (neu, ergänzend zur Kontoliste)

| Liste / Ebene | Begriffe (Phrase) |
|---|---|
| **Konto, ergänzen** | diy, selber bauen, anleitung, youtube, tutorial, bilder, wallpaper, zeichnung, lego, minecraft, sims, 3d modell download, revit, sketchup, cad download, dwg, mieten, leasing privat, kredit, ausschreibung öffentlich, stellenanzeige, ausbildung innenarchitekt, studium |
| **S3 Ezarri/Pool** | aufstellpool, intex, bestway, aufblasbar, planschbecken, poolfolie, pvc, stahlwandpool, whirlpool kaufen, poolchemie, chlor, poolroboter, poolpumpe, freibad, hallenbad, eintritt, öffnungszeiten, therme, schwimmkurs, mosaik basteln, mosaiksteine bastel, mosaik kinder, mosaik vorlage, ezarri wikipedia, fugenmasse baumarkt, hornbach, obi, bauhaus, hagebau |
| **S4 Hotel/Contract** | hotel buchen, zimmer frei, übernachtung, booking, angebot, wellnesshotel, last minute, hotel jobs, hotelfachschule, rezeption job, gastro bedarf, großküche, gastronomie geräte, kühlschrank, gastro gebraucht, gastro auflösung, insolvenz, hotelbewertung, hotel test, hotelmöbel gebraucht, ikea business |
| **S5 Garten** | gartenarbeit, rasen mähen, heckenschnitt, gärtner stundenlohn, gartencenter, pflanzen kaufen, kleingarten, schrebergarten, baumschule, gartenhaus bausatz, hochbeet |
| **S6 Yacht** | boot kaufen, gebrauchtboot, bootsbörse, charter, bootsverleih, bootsvermietung, liegeplatz, bootsführerschein, segelschein, ersatzteile, motor, antifouling, bootstrailer, schlauchboot, kajak, sup, yacht mieten, superyacht kaufen, yacht job |
| **S2 ClassiCon** | classicon outlet replica, eileen gray replica, e1027 nachbau, e1027 villa (Ortssuche), eileen gray film, eileen gray biografie |
| **Kreuz-Negative** | In S4 Hotel „pool“ ausschließen, wenn Ezarri läuft (dann leitet S3 Hotel-Pool-Suchen). In S2 Region „hotel“ ausschließen |

### 3.9 Messplan

**A) Conversion-Aktionen im Google-Ads-Konto**

| Aktion | Quelle | Kategorie | Primär? | Zählung | Wert | Fenster |
|---|---|---|---|---|---|---|
| `lead_{segment}` (eine Aktion je Segment aus 3.3) | Ads-Tag `AW-…` beim Absenden, mit `transaction_id=lead_ref`, `value`, `currency=EUR`, Enhanced Conversions | Lead einreichen | **ja bis Phase 3**, danach sekundär | Eine | Tabelle 3.3 | 90 T Klick, 1 T View |
| Anruf ≥ 60 s (Anruf-Asset + Website-Weiterleitungsnummer) | Google | Telefonanruf | ja | Eine | 150 € | 30 T |
| `contact_click` (Telefon/WhatsApp/E-Mail) | GA4-Import | Kontakt | nein | Eine | 40 € | 30 T |
| `qualified_lead` | Data-Manager-Upload | Qualifizierter Lead | ab Phase 3 ja | Eine | 600 € | 90 T |
| `showroom_visit` | Upload | Termin | ab Phase 3 ja | Eine | 900 € | 90 T |
| `proposal_sent` | Upload | Konvertierter Lead | nein (Beobachtung) | Eine | 1.500 € | 90 T |
| `purchase` | Upload | Kauf | ja ab ≥ 5/Monat | Eine | echt | 90 T |
| `view_3d`, `ar_start`, `kuechenplaner_3d`, `add_to_wishlist`, `file_download` | GA4-Import | Seitenaufruf / Sonstiges | nein | – | 0 | – (nur als Zielgruppen und Signale) |

**B) Ereignis-Spezifikation (Code-Team)**

```js
// beim erfolgreichen Absenden, nach API-Antwort, nur wenn window.gtag existiert
trackLead("beratung", {
  transaction_id: result.leadRef,  // Pflicht, auch bei kuechenplaner (heute fehlend)
  segment: "kueche",               // wohnen|kueche|hotel|ezarri_privat|ezarri_b2b|outdoor_garten|yacht|produkt|kontakt
  value: 450,                      // aus Tabelle 3.3 (Konstante in src/lib/analytics.js)
  currency: "EUR",
});
// zusätzlich (nur bei ad_user_data=granted) vor dem Event:
gtag("set", "user_data", { email: normalisiert, phone_number: "+43…" });
// Ads-Conversion je Segment: gtag("event","conversion",{send_to:"AW-…/<label_segment>", value, currency, transaction_id})
```
- **Segment im Formular:** `/de/beratung` bekommt einen ersten Schritt „Worum geht es?“ mit den Optionen *Wohnen · Küche · Pool & Mosaik (Ezarri) · Outdoor & Garten · Boot & Yacht · Hotel & Gastronomie · Anderes*. Übergabe per `?thema=`-Parameter von jeder Landingpage (Yacht, Outdoor, Ezarri, Hotel), damit der Schritt vorausgefüllt ist. Optional ein Schritt „Zeitraum“ (< 3 / 3–12 / > 12 Monate) zur Qualifizierung. Die Antworten fließen in `segment` und in den Herkunftsblock.
- **Final-URL-Vorlage (Konto-Ebene):** `{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={_kampagne}&utm_content={creative}&utm_term={keyword}`, Auto-Tagging an. Microsoft: `utm_source=bing`. Meta: `utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}`. Pinterest: `utm_source=pinterest&utm_medium=paid_social`. `attribution.js` liest das alles schon [belegt].

**C) KPIs und Berichts-Rhythmus**

| KPI | Ziel Stufe Klein [Schätzung] | Quelle | Rhythmus |
|---|---|---|---|
| Leads gesamt (Paid) | 15–25/Monat | Ads + Backoffice | wöchentlich |
| Qualifizierte Leads | 6–10/Monat | Backoffice | wöchentlich |
| Kosten pro qualifiziertem Lead | ≤ 250 € | Ads/Backoffice | wöchentlich |
| Showroom-Termine aus Paid | 4–7/Monat | Backoffice | wöchentlich |
| Anteil Leads mit Klick-ID oder Selbstauskunft | ≥ 70 % | Backoffice | monatlich |
| Impression-Anteil eigene Marke | ≥ 90 % | Ads | monatlich |
| Aufträge und Umsatz aus Paid (6-Monats-Fenster) | ROAS ≥ 8 | Backoffice | monatlich |
| Consent-Rate Marketing | messen, kein Ziel | Banner-Statistik (aggregiert) | monatlich |

**D) Wochenroutine (60 Minuten, Inhaber oder Assistenz)**
Montag: (1) Backoffice-Status der Leads aktualisieren, (2) Upload-Sheet prüfen (läuft automatisch), (3) Suchbegriffe ansehen und Negatives ergänzen, (4) Budget-Ampel prüfen: Kosten pro qualifiziertem Lead der letzten 4 Wochen.

**E) Vorlage Inhaber-Anfrage an Ezarri und ClassiCon (Co-op und Markenfreigabe)**
> Betreff: Lokale Suchwerbung für [Ezarri/ClassiCon] am Bodensee – Markenfreigabe und Werbekostenzuschuss
> Guten Tag, wir starten im [Monat] lokale Suchanzeigen für [Ezarri/ClassiCon] in Vorarlberg, am deutschen Bodenseeufer, in der Ostschweiz und in Liechtenstein. Die Anzeigen nennen uns als Vertragshändler und führen auf unsere [Ezarri/ClassiCon]-Seiten. Wir bitten um zwei Dinge: (1) eine Freigabe zur Nutzung Ihrer Marke in Google Ads für unser Konto [Kunden-ID], falls Ihre Marke bei Google geschützt ist, und (2) Informationen, ob Sie Händler mit einem Werbekostenzuschuss oder mit Bild- und Videomaterial für Anzeigen unterstützen. Wir senden Ihnen gern quartalsweise einen Bericht über Reichweite und Anfragen. Freundliche Grüße, Platzhirsch Home Living, Landstraße 11, 6911 Lochau

**F) Fertige Anzeigentexte für die neuen Gruppen** (RSA-Auszug; vollständig über den Generator ergänzen, Längen in Klammern)

*Ezarri (S3):* H: Ezarri-Vertragshändler (21) · Ezarri Glasmosaik bemustern (27) · Glasmosaik für Ihren Pool (25) · Mosaik für Pool und Bad (23) · Muster im Showroom Lochau (26) · Platzhirsch Home Living (23) · Planung mit Ihrem Poolbauer (27) · Für Vorarlberg und Bodensee (27) · Farben und Muster vergleichen (28).
D: „Ezarri-Glasmosaik für Pool, Bad und Wellness. Muster im Showroom in Lochau ansehen.“ (82) · „Für Bauherren, Poolbauer und Planer: Farben, Formate und Muster persönlich besprechen.“ (85)

*ClassiCon (S2):* H: ClassiCon-Vertragshändler (24) · ClassiCon in Lochau erleben (26) · Eileen Gray im Showroom (23) · Platzhirsch Home Living (23) · Beratung mit Café am See (24).
D: „ClassiCon-Klassiker im Showroom am Bodensee ansehen und persönlich beraten lassen.“ (81)

*Hotel/Contract (S4):* H: Hotels komplett einrichten (26) · Lobby, Zimmer, Terrasse (23) · Einrichtung für Gastgeber (25) · Planung mit Tischler-Partnern (29) · Platzhirsch Home Living (23) · Outdoor für Hotel und Gastro (28) · Projekt persönlich besprechen (28).
D: „Lobby, Bar, Zimmer und Terrasse aus einer Hand geplant, mit Partnern aus der Region.“ (83) · „Für Hotels und Gastronomie am Bodensee, in Vorarlberg, Liechtenstein und der Ostschweiz.“ (87) [„aus einer Hand“ und „mit Partnern“ vom Inhaber bestätigen lassen]

---

## 4. Maßnahmen

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| P0 | „Landstraße 9“ → „11“ im Generator, CSVs neu erzeugen | S | 0 € | indirekt: verhindert Ablehnungen und falsche Anfahrt | Code-Team |
| P0 | Google-Ads-Konto im Firmenbesitz anlegen, `NEXT_PUBLIC_GOOGLE_ADS_ID` setzen, Conversion-Labels je Segment anlegen | S | 0 € | Grundvoraussetzung für jeden Paid-Umsatz | Inhaber + Code-Team |
| P0 | `segment`, `value`, `currency` an alle `trackLead`-Aufrufe; `transaction_id` beim Küchenplaner nachrüsten | S | 0 € | Smart Bidding bietet für Hotel und Küche richtig. [Schätzung] 15–30 % mehr qualifizierte Leads bei gleichem Budget | Code-Team |
| P0 | Themen-Schritt „Worum geht es?“ in `/de/beratung` + `?thema=` von allen Landingpages | S–M | 0 € | Lead-Qualität messbar, schnellere Rückrufe nach Segment | Code-Team |
| P0 | Backoffice-Felder (`lead_ref`, Klick-IDs, Status, Wert, Segment, Consent) + Weitergabe in `forward.js` nur mit Ads-Consent | M | 0–1.500 € (Frappe-Betreuer) | Ohne diese Felder kein Offline-Lernen. Der größte Hebel für die Kosten pro Auftrag [Schätzung: −20–40 % CPA nach 3 Monaten, typischer Effekt von Value-Based Bidding, nicht für Platzhirsch belegt] | Code-Team + Backoffice-Partner |
| P1 | Enhanced Conversions (user_data) + Data-Manager-Upload per Google Sheet, wöchentlich | S | 0 € | Showroom-Termine werden Gebotssignal | Code-Team + Inhaber (Routine) |
| P1 | Kampagne S3 Ezarri/Pool anlegen (Keywords, Negatives, RSAs aus 3.7, 3.8, 3.9 F), Start mit Livegang `/de/ezarri` | S | 300 €/Monat Media | Neue Nische, Händler-Aussage erlaubt. [Schätzung] 1 B2B-Kunde (Poolbauer) kann mehrere Pools pro Jahr bringen | Code-Team (Generator) + Inhaber |
| P1 | ClassiCon-Anzeigengruppe mit „Vertragshändler“ | S | in S2-Budget | Einzige Möbelmarke mit erlaubter Händler-Aussage, das steigert die Klickrate [Schätzung] | Code-Team |
| P1 | Markenfreigabe und Co-op-Anfrage an Ezarri und ClassiCon (Vorlage 3.9 E) | S | 0 € | Zusätzliches Media-Budget ohne eigenes Kapital, falls bewilligt | Inhaber |
| P1 | Meta Lead Ads M1 (ohne Pixel) mit 4 Formularen, CRM-Status per Conversions API | M | 500 €/Monat | Schnellster zweiter Kanal ohne Banner-Änderung | Inhaber + Code-Team (Route Handler) |
| P1 | Empfangs-Frage „Wie aufmerksam geworden?“ + Feld im Backoffice | S | 0 € | Misst auch Laufkundschaft und Café, dadurch sauberere Budgetverteilung | Inhaber |
| P2 | Landingpage `/de/hotel-einrichtung` (ÖHT-fähig planen, Tischler-Allianz, Outdoor), danach S4 + LinkedIn-Profil-Targeting in Microsoft | M | 500 €/Monat Media | Hotel-A-Leads mit 0,5–1,3 Mio. € Bedarf (`23`). [Schätzung] schon 1 Auftrag/Jahr deckt das Jahresbudget mehrfach. Hotels < 20 % des Umsatzes halten (`23`) | Code-Team + Inhaber |
| P2 | PMax P1 ohne Feed mit Marken-Ausschluss, Final-URL-Erweiterung aus, erst nach 30 Conv./Monat | M | 600 €/Monat | Zusätzliche Reichweite (YouTube, Discover, Gmail) mit Lernsignal | Code-Team / Inhaber |
| P2 | Microsoft-Ads-Import S1–S4 | S | 200 €/Monat | Ältere, kaufkräftige Desktop-Nutzer, meist niedrigere CPCs [Schätzung] | Inhaber |
| P2 | Meta-Pixel + Pinterest-Tag mit Banner-Eintrag und DSE-Abschnitt, dann Retargeting M2 | M | 200 €/Monat | Rückholung von Merkliste-Besuchern | Code-Team + Anwalt |
| P2 | S7 CH/FL aktivieren, sobald der CH-Ablauf steht | S | 400 €/Monat | Kaufkräftigster Teilmarkt, wartet auf MWST/Zoll | Inhaber + Steuerberater |
| P3 | S6 Yacht nach Bildfreigabe und `index: true` | S | 150 €/Monat (saisonal) | Kleine Nische, Imagewirkung | Inhaber |
| P3 | Outdoor-Garten-Gruppe nach Rechtsprüfung `30` | S | saisonal | Ø 8–12 T€ je Auftrag (`30`) | Inhaber + Anwalt |
| P3 | Demand Gen / YouTube mit eigenem Showroom-Video (lokale GPU-Produktion, KI-Kennzeichnung) | L | 1.300 €/Monat + Produktion | Bekanntheit Zone A, B und D. Erst ab Stufe Groß sinnvoll | Partner (Video) + Inhaber |
| P3 | PMax/Shopping-Feed für Atelierverkauf, nach Prüfung der Merchant-Center-Voraussetzungen | M | 300 €/Monat | Abverkauf von Ausstellungsstücken, Liquidität | Code-Team |

---

## Quellen (Web, abgerufen 28.10.2026)
- Google, Marken-Richtlinie: https://support.google.com/adspolicy/answer/6118
- Google, Enhanced Conversions for Leads: https://support.google.com/google-ads/answer/15713840
- Google, Offline-Conversion-Import (Data Manager, Umstellung ab 15.06.2026): https://support.google.com/google-ads/answer/2998031 · https://support.google.com/google-ads/answer/14274408
- Google, Kontoebene-Negatives und Brand Suitability in PMax: https://support.google.com/google-ads/answer/13607727 · Neuerungen PMax: https://support.google.com/google-ads/answer/13311048
- Google, AI Max for Search (Marken-Steuerung, URL-Erweiterung): https://support.google.com/google-ads/answer/15910187
- Sekundärquelle Fristen GCLID 90 T / ECL 63 T: https://www.relevantaudience.com/google-ads-en/google-ads-offline-conversion-import-guide/ [prüfen]
- EuGH Google France C-236/08 bis C-238/08 und Interflora C-323/09: https://curia.europa.eu/jcms/jcms/P_79551/cs · https://cms.law/en/gbr/legal-updates/interflora-stems-marks-and-spencer-keyword-advertising
- Meta, Conversion Leads Integration (CRM): https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration
- Pinterest, Länder für Werbekonten: https://help.pinterest.com/en/node/821
- Microsoft Audience Network, Märkte inkl. AT/CH (Stand 2021, aktuell prüfen): https://advertise.bingads.microsoft.com/en-gb/blog/post/november-2021/reach-new-audiences-with-the-microsoft-audience-network
- Consent Mode v2 (Sekundärquelle): https://www.cardinalpath.com/blog/navigating-changes-to-google-consent-mode
