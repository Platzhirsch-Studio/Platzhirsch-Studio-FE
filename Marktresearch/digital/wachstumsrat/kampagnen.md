# Wachstumsrat: Kampagnen (Marktkommunikation, digitale Werbetexter, Grafiker)

**Kürzel:** kampagnen · **Stand:** 28.10.2026 · **Status:** Entwurf zur Freigabe durch den Inhaber. Kein Text geht ohne Freigabe live (Regel V8 aus `marketing/meta-pinterest-kampagnen.md`).

**Grundlage, gelesen:** `23-masterkonzept.md` (Abschnitt 1, 4, 5.1, 8.4, 9), `digital/teamleiter/inhaber-entscheidungen.md`, `digital/wachstumsrat/00-inhaber-usp-handzeichnung.md` (Kern-USP, verbindlich), `digital/expertenrat/00-design-bibel.md` (§1 Stimme, §4 Farbe), `recht/03-uwg-werbe-audit.md` (§8, §9), `26-binni-kooperation.md`, `29-geschaeftsfeld-yacht-interior.md`, `30-geschaeftsfeld-outdoor-gartenplanung.md`, `marketing/google-ads-kampagnen.md`, `marketing/meta-pinterest-kampagnen.md`, `marketing/email-flows.md` und alle Dateien unter `marketing/ads-csv/`. Code nur gelesen (`src/app/[locale]/*`, `src/i18n/config.js`, `src/components/ui/Leitsatz.js`).

**Neue Lieferung neben dieser Datei:** `Marktresearch/digital/wachstumsrat/kampagnen-rsa-neu.csv`. Das sind 12 Responsive Search Ads (6 Felder × AT/DE und CH/FL) im Spaltenformat von `06-anzeigen-rsa.csv`, alle auf `Paused`. Die Zeichenlängen sind per Skript geprüft (Headlines ≤ 30, Descriptions ≤ 90, Pfade ≤ 15). Die CH/FL-Fassung ersetzt „ß“ durch „ss“.

**Textregeln, die überall gelten** (aus UWG-Audit §9 und Design-Bibel §1):
- „Händler“ oder „Vertragshändler“ steht **nur bei ClassiCon und Ezarri**. Für alle anderen Marken heißt es „in unserer Ausstellung“, „probesitzen“ oder „planen mit“. Das gilt auch für Minotti.
- Keine Superlative, kein „Nr. 1“, „größte“, „exklusiv“, „Luxus“ oder „Traum“. Kein Ausrufezeichen, immer Sie-Form.
- Keine Pauschal-Umweltwörter. Auch die Herstellerangabe „100 % recyceltes Glas“ von Ezarri ([ezarri.com](https://www.ezarri.com/en/), abgerufen 28.10.2026) kommt **nicht** in Anzeigen. Sie darf höchstens auf der Ezarri-Seite stehen, mit Quelle und Datum, und vorher muss das Zertifikat geprüft sein (Green-Claims-Regel R-G2).
- Lieferung und Montage gibt es „auf Wunsch“. Für DE, CH und FL steht „auf Anfrage“. „Anzahlung abgesichert“, „0 % Finanzierung“ und „CHF-Festpreis“ kommen erst, wenn es ein Angebot dazu gibt.
- Outdoor: Platzhirsch **koordiniert** die Gewerke. Garten und Bau übernehmen befugte Partner. Die Wörter „Bauleitung“, „Generalunternehmer“ und „Gartenbau von uns“ sind tabu (Bericht 30, GewO).
- Yacht: Platzhirsch kümmert sich um lose Ausstattung und Oberflächen. Polster und Einbauten fertigen befugte Partner, Eingriffe in die Technik macht die Werft (Bericht 29).
- Handzeichnung, Modell und Rendering zeigen wir **nur mit echtem Material von Harald Menghin**. KI-Skizzen oder nachgestellte Modellfotos sind verboten (USP-Datei, Regeln).

---

## 1. Urteil zum Ist-Stand

**Note: 5 von 10** für die bestehende Kampagnenkommunikation (Ads-CSV, Meta-Konzept, E-Mail-Flows).

**Was gut ist:** Rechtlich wurde sauber gearbeitet: kein Händlerversprechen bei Minotti, Binni-Herkunft offen genannt, Längen vom Generator geprüft, Negativlisten vorhanden, CH-Schreibweise berücksichtigt. Der Ton ist ruhig und konkret. Die Kontostruktur „Marke × Region“ ist sinnvoll aufgebaut.

**Warum trotzdem nur 5:**
1. **Der Kern-USP fehlt.** Die Handzeichnung, das Modell und das Rendering von Harald Menghin kommen in keiner der 90 RSAs vor. Die Anzeigen verkaufen Marken und „Showroom mit Café“. Damit sagt Platzhirsch dasselbe wie Höttges, reiter und Gamma und konkurriert dort, wo andere den Händlerstatus haben.
2. **Drei von sechs Geschäftsfeldern haben keine Kampagne:** Yacht, Ezarri/Pool und Hotel/Contract. Ausgerechnet Hotel ist laut Masterkonzept 8.4 mit 2,0 bis 6,6 Mio. € Pipeline-Bedarf der größte Hebel [Schätzung aus 22].
3. **Die Adresse ist falsch.** In `06-anzeigen-rsa.csv` steht 45-mal „Landstraße 9“, in `07-sitelinks.csv` 7-mal und im Generator `gen-ads.js` 5-mal. Laut Inhaber-Entscheidung 2 gilt „Landstraße 11“. Dieselbe falsche Adresse steht auch in der Pflicht-Fußzeile A von `email-flows.md`.
4. **Es gibt keine Leitidee.** „Nehmen Sie Platz.“ wird auf der Website gelebt (Leitsatz-Komponente, Adventsabend, Yacht-Motto „Nehmen Sie Platz – an Bord.“), taucht aber in keiner Anzeige auf. Ads, Social und Print sprechen deshalb nicht mit einer Stimme.
5. **Ungeprüfte Versprechen:** „Raumplanung inklusive“ steht 21-mal in den RSAs, ohne Inhaber-Bestätigung (offen laut `google-ads-kampagnen.md` 12.2).
6. **Die Assets passen nicht zur Kampagne.** In den Küchen- und Outdoor-Kampagnen nennt das Snippet „Marken“ Minotti, Poliform und Flos, und „Sortiment“ nennt Sofas und Betten. Das senkt die Anzeigenrelevanz.
7. **Das Meta-Konzept ist veraltet.** Die Verbotsliste in §0.2 verbietet „Vertragshändler“ pauschal. Für Ezarri und ClassiCon ist das seit der Inhaber-Entscheidung 7 erlaubt und soll auch genutzt werden.

**Befund aus dem Code:** Für die Hotel-Kampagne gibt es **keine Zielseite**. Unter `src/app/[locale]/` existiert keine Hotel- oder Contract-Route. Eine Route `ezarri` fand sich im geprüften Stand ebenfalls nicht, weil sie noch im Bau ist. Es gibt keine `de-ch`-Locale (`src/i18n/config.js`: de, en, fr, it). CH-Anzeigen laufen deshalb auf `/de/…` mit UTM `geo=ch`. Ein verlässlicher Live-Check auf localhost:3000/4545 war nicht möglich, weil der Dev-Server beim Prüfzeitpunkt verzögert bzw. mit Fehlercodes antwortete. Darum wurde nur der Code gelesen.

---

## 2. Befunde und Chancen

| # | Chance | Warum sie Umsatz bringt |
|---|---|---|
| C1 | **Den USP zum Kampagnenkern machen: „Von Hand gezeichnet.“** | Er ist das einzige Merkmal, das kein Wettbewerber in der Tabelle 4.3 kopieren kann, ohne einen zeichnenden Designer zu haben. So wird aus „Marke kaufen“ ein „Planer beauftragen“, was größere Tickets ermöglicht (G4 Komplettobjekte: 250–350 T€, Schätzung aus 23/5.1). |
| C2 | **Ein Satz für alle Felder:** „Nehmen Sie Platz.“ mit Ortszusatz je Feld | Er ist wiedererkennbar und nach Design-Bibel für 3 Jahre festgelegt. Jedes Feld zahlt so auf dieselbe Marke ein, statt eigene Teilmarken aufzubauen. Das ist billiger, weil es keine eigenen Kampagnen-Designs braucht. |
| C3 | **Ezarri als einziges Feld mit erlaubter Händler-Aussage in der Suche** | „Ezarri Händler“ und „Glasmosaik Pool“ sind Suchanfragen, bei denen der Händlerstatus die Klickrate trägt. Wettbewerbsdruck in der Region ist nicht erhoben [prüfen im Keyword-Planer]. |
| C4 | **Hotel als B2B-Feld mit Direktansprache statt Mediabudget** | Die 10 A-Leads aus 8.4 sind namentlich bekannt. Ein Brief mit Handzeichnung der eigenen Lobby schlägt jede Anzeige. Die Kosten liegen fast nur in der Arbeitszeit von Harald. |
| C5 | **Die Saisonlogik nutzen:** Winter ist Planungszeit für Outdoor, Pool und Boot | Gerade Yacht-Winterlager, Poolbau-Planung und Outdoor-Frühbucher fallen in Nov–Mär, also in die Zeit, in der der Möbel-Showroom ruhiger ist. Das glättet die Auslastung. |
| C6 | **Cross-Selling über das „Ein Projekt“-Prinzip** | Pool → Terrasse → Outdoor-Möbel → Wohnzimmer. Jede Kampagne verweist auf das Nachbarfeld, und jede Landingpage hat eine Linkzeile „Gehört dazu“. |
| C7 | **Kostenarme Kanäle zuerst** | Google-Unternehmensprofil, organisches Instagram und Pinterest, Newsletter an den Bestand, LinkedIn-Profil von Harald, Brief an Hotels und Architekten. Bezahlte Kanäle erst nach Gate 0 und mit Tracking (23/1). |

---

## 3. Fertige Bausteine

### 3.1 Leitidee und Claim-System

**Leitidee:** *Platzhirsch ist Gastgeber. Wer Platz nimmt, wird gesehen, gezeichnet und ehrlich geplant, bis er im fertigen Raum sitzt.*

Der laute Name wird zur Einladung, und der Prozess liefert den Beweis.

| Ebene | Text | Einsatz |
|---|---|---|
| **Leitsatz** (fix, 3 Jahre) | **Nehmen Sie Platz.** | Schluss jeder Anzeige, jedes Plakats und jeder Mail. Höchstens 1× pro Fläche, in Bodoni kursiv |
| **Beweiszeile** (fix) | **Von Hand gezeichnet. Fotorealistisch geplant.** | Unter dem Leitsatz oder als Headline. *Empfehlung statt „Digital perfektioniert.“, weil „perfektioniert“ eine nicht belegbare Wertung ist (UWG §9 R-A1). „Fotorealistisch geplant“ beschreibt nur, was tatsächlich passiert.* |
| **Prozesszeile** (lang) | Zuhören. Zeichnen. Modell bauen. Rendern. Einrichten. | Print, Plakat, Reels-Text |
| **Ortszeile** | Lochau am Bodensee · Österreich, Deutschland, Schweiz, Liechtenstein | Absender |

**Feld-Claims** (Leitsatz + Ort):

| Feld | Claim | Unterzeile |
|---|---|---|
| Möbel und Interior | **Nehmen Sie Platz. Auf dem Sofa, das zu Ihrem Raum passt.** | Probesitzen in Lochau, gezeichnet von Harald Menghin. |
| Küche | **Nehmen Sie Platz. Am eigenen Tisch.** | Küche und Wohnraum als ein Plan, erst von Hand, dann in 3D. |
| Outdoor | **Nehmen Sie Platz. Draußen.** | Möbel, Schatten und Licht als ein Konzept. Die Gewerke koordinieren wir. |
| Yacht und Boot | **Nehmen Sie Platz. An Bord.** | Deck, Cockpit und Kajüte, geplant im Winterlager. |
| Ezarri, Pool und Wellness | **Nehmen Sie Platz. Am Beckenrand.** | Glasmosaik von Ezarri, geplant von Ihrem Ezarri-Vertragshändler am Bodensee. |
| Hotel und Gastronomie | **Ihre Gäste nehmen Platz.** | Lobby, Zimmer, Restaurant und Terrasse als ein Projekt. |
| Architekten (B2B) | **Ihr Entwurf nimmt Platz.** | Wir ergänzen Ihre Planung mit Möbeln, Licht und Küche, ohne Ihre Handschrift zu ersetzen. |

**Wortliste (Gastgeber-Ton):** Platz nehmen, Gast, Tisch, Espresso, zeichnen, Skizze, Modell, Licht vom See, in Ruhe, vor Ort, ein Ansprechpartner.
**Nie:** Luxus, exklusiv, Traum, Premium-Händler, offiziell (außer ClassiCon, Ezarri), Deal, Rabatt-Countdown.

### 3.2 Kampagnenarchitektur

**Dach:** „Nehmen Sie Platz.“ als Neustart-Kampagne zum Livegang des Neuauftritts. Darunter laufen 6 Feldkampagnen und 1 B2B-Strang, alle mit derselben Bildsprache (Seelicht, Horizontlinie, Handzeichnung als drittes Signaturelement).

| Phase | Zeitraum [Vorschlag] | Inhalt | Kanäle | Voraussetzung |
|---|---|---|---|---|
| **0 – Ohne Budget** | ab Livegang | Neustart „Nehmen Sie Platz.“: Website, Google-Profil (Posts, Fotos), Instagram und Pinterest organisch, Newsletter 1, LinkedIn-Profil von Harald, Briefe an die 10 Hotel-A-Leads | eigene Kanäle | Website live, echtes Zeichenmaterial von Harald |
| **1 – Winter-Planung** | Nov 2026 – Feb 2027 | Adventsabend (existiert), Yacht-Winterlager, Outdoor-Frühbucher 2027, Pool-Planung Ezarri, Hotel (Eröffnungen Ostern 2027) | + Google Search Stufe 1, Meta Lead Ads ohne Pixel | Gate 0, Tracking `generate_lead` |
| **2 – Bauherren** | Feb – Mai 2027 | Küche und Interior für Neubau und Umbau, Pool, Outdoor-Saison | + Meta mit Pixel nach Consent, Pinterest | Consent-Erweiterung V2/V3 |
| **3 – Saison** | Mai – Sep 2027 | Outdoor, Yacht an Deck, Café-Events, Hotel-Referenz | + Plakat Lochau/Lindau/Bregenz, Hafen-Aushänge | Referenzen mit schriftlicher Einwilligung |

**Kanäle je Feld** (● Hauptkanal, ○ Nebenkanal):

| Feld | Google Search | Meta/IG | Pinterest | LinkedIn | Newsletter | Print/Plakat | Direkt/Brief |
|---|---|---|---|---|---|---|---|
| Möbel/Interior | ● | ● | ● | ○ | ● | ○ | – |
| Küche | ● | ● | ● | ○ | ● | ○ | ○ (Bauträger) |
| Outdoor | ● | ● | ● | ○ | ● | ● (Saison) | ○ (Hotels) |
| Yacht | ○ | ● | ○ | – | ○ | ● (Häfen, Werften) | ● (Werften, Clubs) |
| Ezarri/Pool | ● | ● | ● | ○ (Architekten) | ○ | ○ | ● (Poolbauer) |
| Hotel | ○ | – | – | ● | – | ○ (Fachmesse) | ● |

**Budget-Vorschlag für die neuen Felder** [Schätzung, zusätzlich zu Stufe 1 aus `google-ads-kampagnen.md` mit 1.650 €/Monat]: Ezarri/Pool Search 250 €, Yacht Search 100 € plus Meta 150 €, Hotel Search 150 € plus LinkedIn-Test 500 € für 6 Wochen. Zusammen sind das etwa 1.150 € pro Monat, und alles startet erst nach Gate 0. Die Kosten pro Klick für diese Begriffe sind nicht erhoben. Vor dem Start mit dem Keyword-Planer prüfen.

**Messung:** UTM-Konvention aus `email-flows.md` 0.6 mit `utm_campaign=neustart-<feld>`, Lead-Herkunft als Pflichtfeld im Backoffice (23/8.6). KPI je Feld: qualifizierte Anfragen, Termine und Auftragseingang, nicht Klicks.

### 3.3 Google Ads: Responsive Search Ads (15 Headlines, 4 Descriptions je Feld)

**Pinning:** H1 (Feld-Headline) auf Position 1 pinnen und den Leitsatz bzw. die Feld-Claim-Headline auf Position 2. Alles andere bleibt ungepinnt, damit Google kombinieren kann. Bei Ezarri H1 „Ezarri-Vertragshändler“ auf Position 1.

**Bedingungen vor Freigabe** (in den Tabellen nicht markiert, weil Anzeigen keine Klammern vertragen):
- „Auch samstags geöffnet“: nur solange die Samstagsöffnung besteht (heute 10–14 Uhr).
- „Aufmaß bei Ihnen vor Ort“, „Beratung direkt an Bord“: Inhaber bestätigt das Angebot.
- „Fronten und Stein vergleichen“, „Muster im Showroom ansehen“: Muster sind tatsächlich im Showroom.
- „Mosaik selbst konfigurieren“: Der Ezarri-Konfigurator ist live.
- „Mit Werft und Sattler“, „Mit Tischler-Partnern“, „Garten mit Partner-Gärtnern“: mindestens ein schriftlicher Partner-Rahmenvertrag liegt vor.
- „Paola Lenti und Tuuci erleben“: Die Stücke stehen in der Ausstellung.
- „Termin mit Harald Menghin“, „Von Hand gezeichnet“: Harald übernimmt die Termine tatsächlich, und es gibt echtes Material auf der Zielseite.
- „Für Boote von 8 bis 20 m“: stammt aus Bericht 29 und muss vom Inhaber als Angebotsrahmen bestätigt werden.
- „Kostenaufstellung je Bereich, als Grundlage für Ihre Bank und Förderanträge“: Es wird keine Förderzusage gemacht. Vor dem Start mit dem Steuerberater abstimmen, ob der ÖHT-Bezug auf der Landingpage stehen darf.
- Hotel-Zielseite `/de/hotel-einrichtung` existiert noch nicht (P0 unten). Bis sie live ist, bleibt die Kampagne pausiert.

#### Möbel und Interior

Ziel-URL: `https://platzhirsch.studio/de/interior-design-vorarlberg` · Pfad: `/Wohnen/Planung`

| # | Headline | Zeichen |
|---|---|---|
| H1 | Designmöbel am Bodensee | 23 |
| H2 | Nehmen Sie Platz. | 17 |
| H3 | Minotti-Sofas probesitzen | 25 |
| H4 | Showroom mit Café in Lochau | 27 |
| H5 | Von Hand gezeichnet | 19 |
| H6 | Ihr Raum, von Hand skizziert | 28 |
| H7 | Fotorealistisch vorab sehen | 27 |
| H8 | Termin online wählen | 20 |
| H9 | Auch samstags geöffnet | 22 |
| H10 | Italienisches Wohnen | 20 |
| H11 | Offizieller ClassiCon-Händler | 29 |
| H12 | Wohnen, Küche, Outdoor | 22 |
| H13 | Planung bis zum Einzug | 22 |
| H14 | Für AT, DE, CH und FL | 21 |
| H15 | Platzhirsch Home Living | 23 |

| # | Description | Zeichen |
|---|---|---|
| D1 | Showroom mit Café in Lochau: Sofas probesitzen, Stoffe fühlen, in Ruhe planen. | 78 |
| D2 | Harald Menghin zeichnet Ihr Raumkonzept von Hand. Danach folgen 3D-Plan und Rendering. | 86 |
| D3 | Minotti, Poliform, Rimadesio und mehr in unserer Ausstellung. Termin online wählen. | 83 |
| D4 | Landstraße 11, 6911 Lochau. Für Kundinnen und Kunden aus AT, DE, CH und FL. | 75 |

#### Küche

Ziel-URL: `https://platzhirsch.studio/de/kuechen-vorarlberg` · Pfad: `/Kueche/Planung`

| # | Headline | Zeichen |
|---|---|---|
| H1 | Küchenplanung am Bodensee | 25 |
| H2 | Küche planen in Lochau | 22 |
| H3 | Platz nehmen am eigenen Tisch | 29 |
| H4 | Poliform und Varenna planen | 27 |
| H5 | Küche und Wohnen als Projekt | 28 |
| H6 | Von Hand gezeichnet | 19 |
| H7 | Ihre Küche als Rendering | 24 |
| H8 | Küchen im Showroom ansehen | 26 |
| H9 | Fronten und Stein vergleichen | 29 |
| H10 | Termin online wählen | 20 |
| H11 | Für Neubau und Umbau | 20 |
| H12 | Montage auf Wunsch | 18 |
| H13 | Küchenstudio mit Café | 21 |
| H14 | Aufmaß bei Ihnen vor Ort | 24 |
| H15 | Für AT, DE, CH und FL | 21 |

| # | Description | Zeichen |
|---|---|---|
| D1 | Wir planen Ihre Küche zusammen mit dem Wohnraum. Erst von Hand, dann in 3D. | 75 |
| D2 | Poliform, Varenna und next125 im Showroom in Lochau ansehen und vergleichen. | 76 |
| D3 | Fotorealistisches Rendering vor der Bestellung. So sehen Sie Ihre Küche vorab. | 78 |
| D4 | Termin online wählen. Espresso im Café inklusive, Beratung ohne Zeitdruck. | 74 |

#### Outdoor

Ziel-URL: `https://platzhirsch.studio/de/outdoor-gartenplanung` · Pfad: `/Outdoor/Terrasse`

| # | Headline | Zeichen |
|---|---|---|
| H1 | Outdoor-Möbel am Bodensee | 25 |
| H2 | Terrasse neu gestalten | 22 |
| H3 | Nehmen Sie Platz. Draußen. | 26 |
| H4 | Schirme, Licht und Möbel | 24 |
| H5 | Paola Lenti und Tuuci erleben | 29 |
| H6 | Gewerke koordiniert | 19 |
| H7 | Ein Ansprechpartner | 19 |
| H8 | Garten mit Partner-Gärtnern | 27 |
| H9 | Outdoor-Konzept von Hand | 24 |
| H10 | Beschattung für Seeterrassen | 28 |
| H11 | Rooftop und Terrasse | 20 |
| H12 | Jetzt für Saison 2027 planen | 28 |
| H13 | Termin online wählen | 20 |
| H14 | Showroom mit Café in Lochau | 27 |
| H15 | Montage auf Wunsch | 18 |

| # | Description | Zeichen |
|---|---|---|
| D1 | Möbel, Schirme und Licht als ein Konzept. Garten und Bau durch befugte Partnerbetriebe. | 87 |
| D2 | Wir koordinieren die Termine der Gewerke. Sie haben einen Ansprechpartner. | 74 |
| D3 | Outdoor-Kollektionen im Showroom in Lochau probesitzen. Termin online wählen. | 77 |
| D4 | Von Hand skizziert, in 3D geplant: Ihre Terrasse als Rendering vor der Bestellung. | 82 |

#### Yacht und Boot

Ziel-URL: `https://platzhirsch.studio/de/yacht-interior` · Pfad: `/Yacht/Interior`

| # | Headline | Zeichen |
|---|---|---|
| H1 | Yacht-Interior am Bodensee | 26 |
| H2 | Nehmen Sie Platz. An Bord. | 26 |
| H3 | Deck und Cockpit einrichten | 27 |
| H4 | Kajüte neu gestalten | 20 |
| H5 | Interior-Refresh im Winter | 26 |
| H6 | Für Boote von 8 bis 20 m | 24 |
| H7 | Mit Werft und Sattler | 21 |
| H8 | Designmöbel für Ihr Boot | 24 |
| H9 | Outdoor-Stoffe für das Deck | 27 |
| H10 | Bootshaus einrichten | 20 |
| H11 | Von Hand gezeichnet | 19 |
| H12 | Rendering vor der Bestellung | 28 |
| H13 | Termin im Showroom Lochau | 25 |
| H14 | Beratung direkt an Bord | 23 |
| H15 | Platzhirsch Home Living | 23 |

| # | Description | Zeichen |
|---|---|---|
| D1 | Deck, Cockpit und Kajüte: Möbel, Polster, Licht und Textilien als ein Konzept. | 78 |
| D2 | Wir planen die Ausstattung, befugte Partnerbetriebe fertigen Polster und Einbauten. | 83 |
| D3 | Winterlager nutzen: jetzt planen und zur neuen Saison ausstatten. | 65 |
| D4 | Showroom mit Café in Lochau am Bodensee. Termin online wählen oder an Bord treffen. | 83 |

#### Ezarri, Pool und Wellness

Ziel-URL: `https://platzhirsch.studio/de/ezarri` · Pfad: `/Ezarri/Pool`

| # | Headline | Zeichen |
|---|---|---|
| H1 | Ezarri-Vertragshändler | 22 |
| H2 | Ezarri Glasmosaik am Bodensee | 29 |
| H3 | Glasmosaik für Ihren Pool | 25 |
| H4 | Nehmen Sie Platz. Am Pool. | 26 |
| H5 | Pool, Bad und Wellness | 22 |
| H6 | Mosaik selbst konfigurieren | 27 |
| H7 | Muster im Showroom ansehen | 26 |
| H8 | Farbverläufe und Muster | 23 |
| H9 | Eigene Motive als Mosaik | 24 |
| H10 | Planung mit Ihrem Poolbauer | 27 |
| H11 | Für Neubau und Sanierung | 24 |
| H12 | Pool, Garten und Terrasse | 25 |
| H13 | Termin online wählen | 20 |
| H14 | Von Hand gezeichnet | 19 |
| H15 | Showroom mit Café in Lochau | 27 |

| # | Description | Zeichen |
|---|---|---|
| D1 | Als Ezarri-Vertragshändler planen wir Glasmosaik für Pool, Bad und Wellness. | 76 |
| D2 | Farben, Formate und Muster im Showroom in Lochau vergleichen. Termin online wählen. | 83 |
| D3 | Wir stimmen das Mosaik mit Ihrem Poolbauer ab und planen Terrasse und Möbel mit. | 80 |
| D4 | Vom Farbverlauf bis zum eigenen Motiv: Ihr Becken als Rendering vor der Bestellung. | 83 |

#### Hotel und Gastronomie

Ziel-URL: `https://platzhirsch.studio/de/hotel-einrichtung` · Pfad: `/Hotel/Contract`

| # | Headline | Zeichen |
|---|---|---|
| H1 | Hotels komplett einrichten | 26 |
| H2 | Hoteleinrichtung am Bodensee | 28 |
| H3 | Ihre Gäste nehmen Platz. | 24 |
| H4 | Lobby, Bar und Zimmer | 21 |
| H5 | Suiten und Restaurant | 21 |
| H6 | Terrasse und Rooftop | 20 |
| H7 | Contract-Einrichtung | 20 |
| H8 | Ein Ansprechpartner | 19 |
| H9 | Mit Tischler-Partnern | 21 |
| H10 | Kostenaufstellung je Bereich | 28 |
| H11 | Zeitplan bis zur Eröffnung | 26 |
| H12 | Von Hand gezeichnet | 19 |
| H13 | Rendering vor der Bestellung | 28 |
| H14 | Für AT, DE, CH und FL | 21 |
| H15 | Termin mit Harald Menghin | 25 |

| # | Description | Zeichen |
|---|---|---|
| D1 | Lobby, Bar, Zimmer und Terrasse als ein Projekt, mit einem Ansprechpartner. | 75 |
| D2 | Lose Möbel von Designmarken, Einbauten durch Tischler-Partner, Outdoor und Licht dazu. | 86 |
| D3 | Kostenaufstellung je Bereich, als Grundlage für Ihre Bank und Förderanträge. | 76 |
| D4 | Erst von Hand gezeichnet, dann gerendert: Ihr Haus sehen, bevor bestellt wird. | 78 |


**Keyword-Kerne für die neuen Felder** (Phrase/Exact, Regionsorte wie in `gen-ads.js`):
- **Yacht:** boot innenausstattung bodensee, yacht interior, bootspolster neu (nur mit Sattler-Partner), cockpit polster, bootshaus einrichten, deck möbel boot. Negativ: gebraucht, kaufen boot, charter, mieten, ersatzteile, persenning reparatur.
- **Ezarri/Pool:** ezarri, ezarri mosaik, ezarri händler, glasmosaik pool, poolmosaik, mosaik schwimmbad, mosaikfliesen bad, glasmosaik dusche. Negativ: diy, selber machen, aufblasbar, intex, folie, günstig, bauhaus, obi, hornbach.
- **Hotel:** hoteleinrichtung, hotel einrichten, hotelmöbel, contract einrichtung, ff&e, gastronomie einrichtung, restaurant einrichten, hotelzimmer einrichtung. Negativ: gebraucht, insolvenz, versteigerung, job, stellenangebot, ausbildung, buchen, zimmer frei.
- **Interior/Handzeichnung** (in der Möbel-Kampagne): interior designer vorarlberg, einrichtungsplanung, raumkonzept, einrichtungsberatung, innenarchitektur bodensee (Achtung: Den Titel „Innenarchitekt“ führt Harald nicht. Das Wort steht deshalb nur als Keyword, nie im Anzeigentext [prüfen: Berufsrecht AT/DE]).

### 3.4 Verbesserungen an `Marktresearch/marketing/ads-csv/`

| # | Datei | Änderung | Grund |
|---|---|---|---|
| A1 | `06-anzeigen-rsa.csv`, `07-sitelinks.csv`, `generator/gen-ads.js` | „Landstraße 9“ → „Landstraße 11“ (45 + 7 + 5 Stellen), in CH-Kampagnen „Landstrasse 11“. Danach neu generieren | Inhaber-Entscheidung 2 |
| A2 | `06-anzeigen-rsa.csv` | „Raumplanung inklusive“ (21×) ersetzen durch „Von Hand gezeichnet“ bzw. „Ihr Raum, von Hand skizziert“ | Unbestätigtes Versprechen raus, USP rein |
| A3 | `06-anzeigen-rsa.csv` | In jede RSA 2 der 15 Headlines tauschen gegen „Nehmen Sie Platz.“ und „Fotorealistisch vorab sehen“. Ersatz für die schwächsten, sich wiederholenden Headlines (z. B. „Termin nach Vereinbarung“ neben „Termin online anfragen“) | Leitidee und USP in jeder Auktion |
| A4 | `09-snippets.csv` | Snippets je Kampagne: Küche „Marken: Poliform; Varenna; next125“ und „Sortiment: Küchen; Arbeitsplatten; Geräte; Esstische“. Outdoor „Marken: Paola Lenti; Tuuci; Umbrosa“ und „Sortiment: Lounge; Schirme; Leuchten; Esstische“ | Relevanz der Assets |
| A5 | `08-callouts.csv` | Neue Callouts (≤ 25 Zeichen): „Von Hand gezeichnet“ (19), „Rendering vor Bestellung“ (24), „Ein Ansprechpartner“ (19), „Auch samstags“ (13), bei Wohnen „ClassiCon-Händler“ (17) | USP, belegte Händler-Aussage |
| A6 | `01-kampagnen.csv` / `03-anzeigengruppen.csv` | Neue Kampagnen `PH-N-Yacht`, `PH-N-Ezarri`, `PH-N-Hotel` aus `kampagnen-rsa-neu.csv` übernehmen. In `gen-ads.js` als Themen-Vorlagen anlegen, damit die Längenprüfung greift | Fehlende Felder |
| A7 | `03-anzeigengruppen.csv` | Anzeigengruppe `Interior-Designer-Region` mit der RSA „Möbel und Interior“ in jeder Wohnen-Kampagne | Suchanfragen ohne Marke („Interior Designer Vorarlberg“) |
| A8 | `07-sitelinks.csv` | Sitelinks „Unsere Arbeitsweise“ (→ Seite Handzeichnung, sobald live), „Termin wählen“, „Projekte“ | Prozess sichtbar machen |
| A9 | `marketing/meta-pinterest-kampagnen.md` §0.2 | Verbotsliste ergänzen: „Ausnahmen: ClassiCon und Ezarri (Vertragshändler, Beleg in den Firmenakten, Inhaber-Entscheidung 7)“ | Widerspruch zur Inhaber-Entscheidung |
| A10 | `marketing/email-flows.md` 0.2 | Fußzeile A: Landstraße 11 | wie A1 |

### 3.5 Meta und Instagram: 5 Varianten je Feld

Format: **Primärtext** (Ziel ≤ 125 Zeichen, damit nichts abgeschnitten wird) · **Headline** (≤ 40) · **CTA-Knopf** · **Motiv** (Kennung aus dem Bildbriefing 3.10). Lead-Formular-Fragen wie in `meta-pinterest-kampagnen.md` §5. Jede Variante endet visuell mit „Nehmen Sie Platz.“ auf dem Bild oder in der letzten Karussellkarte.

#### Möbel und Interior
| # | Primärtext | Headline | CTA | Motiv |
|---|---|---|---|---|
| M1 | Bevor wir ein Sofa vorschlagen, zeichnen wir Ihren Raum. Von Hand, mit Licht, Wegen und Blick. | Von Hand gezeichnet. | Termin buchen | B-HZ1 |
| M2 | Ein Espresso, ein Sofa, eine Stunde Zeit. Probesitzen in Lochau, auch samstags. | Nehmen Sie Platz. | Termin buchen | B-CA1 |
| M3 | Skizze, Modell, Rendering, fertiger Raum. So entsteht ein Wohnzimmer bei Platzhirsch. (Karussell, 4 Karten) | Erst sehen, dann bestellen. | Mehr dazu | B-KE1 |
| M4 | Minotti, Poliform, Rimadesio und ClassiCon in einer Ausstellung am Bodensee. Wir planen damit Ihren Raum. | Probesitzen in Lochau. | Termin buchen | B-SR1 |
| M5 | Sie haben einen Grundriss? Laden Sie ihn hoch. Harald Menghin skizziert eine erste Idee für Ihren Raum. | Ihr Grundriss, unsere Skizze. | Mehr dazu | B-HZ2 |

*M5 nur, wenn der Inhaber die Skizze auf Upload als Angebot freigibt (Kapazität, ggf. Honorar). Ziel ist `/de/upload`.*

#### Küche
| # | Primärtext | Headline | CTA | Motiv |
|---|---|---|---|---|
| K1 | Eine Küche plant man nicht aus dem Katalog. Wir zeichnen sie mit Ihrem Wohnraum zusammen. | Nehmen Sie Platz. Am eigenen Tisch. | Termin buchen | B-KU1 |
| K2 | Fronten, Stein, Griff, Licht: alles einmal in die Hand nehmen, bevor Sie sich entscheiden. | Material zum Anfassen. | Termin buchen | B-KU2 |
| K3 | Sie sehen Ihre Küche fotorealistisch, bevor etwas bestellt ist. Änderungen kosten dann nur einen Strich. | Rendering vor der Bestellung. | Mehr dazu | B-KE2 |
| K4 | Neubau 2027? Wer jetzt die Küche plant, hat bei der Elektro- und Wasserplanung schon die Maße. | Jetzt planen, später kochen. | Termin buchen | B-KU3 |
| K5 | Online starten mit dem Küchenplaner. Danach zeichnet Harald Menghin Ihr Konzept von Hand. | Vom Planer zur Skizze. | Jetzt starten | B-HZ3 |

*Binni-Linie (eigene Kampagne, erst nach Vertrag, Name und Preisliste):* „Küche mit Steinplatte, gefertigt von unserem Manufakturpartner Binni in Kosovo. Geplant in Lochau.“ Headline: „Stein. Klar geplant.“ Den Preis zeigen wir nur als konkrete Beispielkonfiguration (R-P6). Binni nie zusammen mit Minotti oder Poliform in einem Motiv (R-H5).

#### Outdoor
| # | Primärtext | Headline | CTA | Motiv |
|---|---|---|---|---|
| O1 | Terrasse, Schatten, Licht und Möbel als ein Konzept. Garten und Bau übernehmen unsere Partnerbetriebe. | Nehmen Sie Platz. Draußen. | Termin buchen | B-OU1 |
| O2 | Der Winter ist die beste Zeit, um den Sommer zu planen. Jetzt für die Saison 2027 Termin wählen. | Saison 2027 planen. | Termin buchen | B-OU2 |
| O3 | Sie haben einen Ansprechpartner. Wir stimmen Gärtner, Elektriker und Lieferung miteinander ab. | Ein Ansprechpartner. | Mehr dazu | B-OU3 |
| O4 | Von der Skizze auf Papier zum Rendering Ihrer Terrasse. So sehen Sie den Abendschatten vorab. | Ihr Garten, gezeichnet. | Mehr dazu | B-KE3 |
| O5 | Paola Lenti, Tuuci und mehr: probesitzen im Showroom am See, mit Espresso im Café. | Draußen probesitzen. | Termin buchen | B-OU4 |

*O2: „beste Zeit“ ist eine Wertung über die Jahreszeit und keine Alleinstellung über das Unternehmen. Bei Zweifel ersetzen durch „Im Winter planen, im Sommer draußen sitzen.“*

#### Yacht und Boot
| # | Primärtext | Headline | CTA | Motiv |
|---|---|---|---|---|
| Y1 | Ihr Boot steht im Winterlager? Dann ist jetzt Zeit für Kajüte, Cockpit und Deck. | Nehmen Sie Platz. An Bord. | Nachricht senden | B-YA1 |
| Y2 | Polster, Stoffe, Licht und Möbel als ein Konzept. Befugte Partnerbetriebe fertigen Polster und Einbauten. | Interior für Boote. | Mehr dazu | B-YA2 |
| Y3 | Wir kommen an Bord, messen auf und zeichnen. Danach sehen Sie Ihr Cockpit als Rendering. | Erst gezeichnet, dann an Bord. | Termin buchen | B-YA3 |
| Y4 | Das Bootshaus am See gehört dazu: Möbel, Licht und Textilien, passend zum Boot. | Bootshaus und Boot. | Mehr dazu | B-YA4 |
| Y5 | Outdoor-Stoffe, die Sonne und Wasser gewohnt sind, im Showroom in Lochau zum Anfassen. | Stoffe für das Deck. | Termin buchen | B-YA5 |

*Zielgruppe: Geo-Radius um die Häfen Lochau, Bregenz, Hard, Fußach, Lindau, Kressbronn, Interessen Segeln/Motorboot. Kennzahlen zur Bootsdichte in Bericht 29 (60.591 Boote am See, Stand 31.12.2023).*

#### Ezarri, Pool und Wellness
| # | Primärtext | Headline | CTA | Motiv |
|---|---|---|---|---|
| E1 | Glasmosaik von Ezarri für Pool, Bad und Wellness, geplant von Ihrem Ezarri-Vertragshändler am Bodensee. | Nehmen Sie Platz. Am Beckenrand. | Mehr dazu | B-EZ1 |
| E2 | Farbverlauf, Muster oder Ihr eigenes Motiv: Stellen Sie Ihr Mosaik online zusammen, wir planen weiter. | Ihr Mosaik, Ihr Muster. | Jetzt starten | B-EZ2 |
| E3 | Wir stimmen das Mosaik mit Ihrem Poolbauer ab und planen Terrasse und Liegen gleich mit. | Pool und Terrasse als ein Plan. | Termin buchen | B-EZ3 |
| E4 | Die Wasserfarbe entsteht durch das Mosaik. Vergleichen Sie die Töne im Showroom bei Tageslicht. | Die Farbe des Wassers. | Termin buchen | B-EZ4 |
| E5 | Auch für Dusche, Spa und Hamam: Glasmosaik von Ezarri, in Lochau geplant. | Mosaik für Bad und Spa. | Mehr dazu | B-EZ5 |

*E2 erst mit live geschaltetem Konfigurator. E4 setzt ausgestellte Muster voraus. Bildmaterial von ezarri.com nur im Rahmen der schriftlichen Freigabe und mit Quellenangabe (Inhaber-Entscheidung 7). Ob die Freigabe auch Werbung auf Meta abdeckt, schriftlich klären.*

#### Hotel und Gastronomie
Meta ist für Hotels kein Hauptkanal. Die 5 Varianten sind für Retargeting von Besuchern der Hotelseite und für eine Custom Audience aus Hotelier-Kontakten mit Einwilligung gedacht.

| # | Primärtext | Headline | CTA | Motiv |
|---|---|---|---|---|
| H1 | Lobby, Bar, Zimmer und Terrasse als ein Projekt. Mit einem Ansprechpartner bis zur Eröffnung. | Ihre Gäste nehmen Platz. | Mehr dazu | B-HO1 |
| H2 | Vor jeder Bestellung zeichnen wir Ihr Haus von Hand und zeigen es fotorealistisch. | Ihr Hotel, bevor es fertig ist. | Mehr dazu | B-HO2 |
| H3 | Lose Möbel, Einbauten mit Tischler-Partnern, Outdoor und Licht: eine Planung, ein Zeitplan. | Ein Plan für das ganze Haus. | Termin buchen | B-HO3 |
| H4 | Kostenaufstellung je Bereich, damit Ihre Bank und Ihre Förderstelle mit Zahlen arbeiten können. | Klar gerechnet. | Mehr dazu | B-HO4 |
| H5 | Probeliegen statt Katalog: Zimmer-Musterraum im Showroom in Lochau. | Erst probewohnen. | Termin buchen | B-HO5 |

*H5 nur, wenn ein Musterzimmer tatsächlich aufgebaut ist. Das ist ein Vorschlag (P2), kein Ist-Stand.*

### 3.6 LinkedIn (Architekten, Hotels)

Format: Sponsored Content, Einzelbild oder Dokument-Anzeige. Intro-Text unter ca. 150 Zeichen sichtbar, Headline unter 70 Zeichen ([b2linked.com](https://b2linked.com/blog-page/linkedin-ads-character-limits-the-guide-every-advertiser-needs), [zenabm.com](https://zenabm.com/blog/linkedin-sponsored-post-specs.md), Drittquellen, vor dem Start in der Campaign-Manager-Hilfe prüfen). **Organisch zuerst:** Die Beiträge erscheinen als Posts im Profil von Harald Menghin. Erst wenn ein Beitrag dort trägt, wird er beworben.

**Achtung TKG:** Kalte Werbe-E-Mails an Firmen sind in AT verboten, auch B2B (`email-flows.md` 0.1). LinkedIn-Anzeigen und persönliche Nachrichten auf konkrete Projekte sind der Weg. Eine Massen-InMail gilt nach Datenschutz/UWG als Werbung [prüfen Anwalt].

#### Architekten (Zielgruppe: Berufsbezeichnung Architekt/Innenarchitekt, Region Vorarlberg, Bodenseekreis, Lindau, St. Gallen, FL)
| # | Intro | Headline | CTA |
|---|---|---|---|
| LA1 | Ihr Entwurf steht. Wir ergänzen Möbel, Licht und Küche so, dass Ihre Handschrift bleibt. | Ihr Entwurf nimmt Platz. | Mehr erfahren |
| LA2 | Wir zeichnen von Hand, bauen Raummodelle und rendern fotorealistisch, passend zu Ihren Plänen. | Skizze, Modell, Rendering. Für Ihr Projekt. | Mehr erfahren |
| LA3 | Bemusterung mit Ihrem Bauherrn im Showroom mit Café: Stoffe, Stein und Mosaik an einem Tisch. | Bemusterung in Lochau. | Termin anfragen |
| LA4 | Glasmosaik von Ezarri für Pool, Bad und Spa. Muster und Planungsdaten für Ihr Büro auf Anfrage. | Ezarri für Ihr Projekt. | Muster anfragen |

*Konditionen für Architekten nach `marketing/architekten-programm.md`. Keine Provisionen öffentlich nennen.*

#### Hotels (Zielgruppe: Inhaber/GF/Direktion in Hotellerie und Gastronomie, gleiche Regionen plus Arlberg und Montafon; Matched Audience mit den Firmen der A-Leads aus 23/8.4)
| # | Intro | Headline | CTA |
|---|---|---|---|
| LH1 | Ihre Gäste nehmen Platz, und wir sorgen dafür, dass es der richtige ist. Lobby bis Terrasse als ein Projekt. | Hotels komplett einrichten, am Bodensee geplant. | Mehr erfahren |
| LH2 | Eröffnung zu Ostern? Dann braucht die Möbelbestellung jetzt einen Zeitplan. Wir rechnen ihn mit Ihnen rückwärts. | Zeitplan bis zur Eröffnung. | Gespräch anfragen |
| LH3 | Kostenaufstellung je Bereich als Grundlage für Ihre Bank und Förderanträge. Planung vor dem Auftrag. | Klar gerechnet, bevor bestellt wird. | Mehr erfahren |
| LH4 | Rooftop, Seeterrasse, Spa: Outdoor-Möbel, Schatten und Glasmosaik von Ezarri aus einer Planung. | Draußen, am Wasser, für Gäste. | Mehr erfahren |

**Dokument-Anzeige „Hotel-Mappe“** (6 Seiten, PDF): 1 Titel „Ihre Gäste nehmen Platz.“, 2 Prozess in 7 Schritten (aus der USP-Datei), 3 Leistungsumfang (lose Möbel, Einbauten mit Partnern, Outdoor, Licht, Textilien, Mosaik), 4 Beispiel-Zeitplan rückwärts ab Eröffnung, 5 Kostenaufstellung je Bereich (Muster ohne Zahlen), 6 Kontakt und Termin. Keine Referenzen ohne schriftliche Zustimmung (R-B2).

**Brief an die 10 Hotel-A-Leads** (Post, persönlich unterschrieben, Beilage: Handskizze A4 eines öffentlichen Bereichs des jeweiligen Hauses nach öffentlich zugänglichen Fotos, klar als „erste Idee, ohne Auftrag“ bezeichnet):
> Sehr geehrte/r [Name],
>
> Ihr Haus [Hotel] eröffnet [Zeitpunkt laut 23/8.4]. Ich habe mir erlaubt, eine erste Idee für [Bereich, z. B. Ihre Seeterrasse] von Hand zu skizzieren. Sie liegt diesem Brief bei.
>
> So arbeiten wir: Wir hören zu, zeichnen von Hand, bauen bei Bedarf ein Modell und zeigen Ihnen den Raum fotorealistisch, bevor etwas bestellt wird. Möbel, Licht, Outdoor und Einbauten mit unseren Tischler-Partnern planen wir als ein Projekt, mit einem Zeitplan bis zu Ihrer Eröffnung.
>
> Ich rufe Sie in der nächsten Woche an und frage, ob ein Gespräch passt, bei Ihnen vor Ort oder bei einem Espresso in Lochau.
>
> Nehmen Sie Platz.
>
> Harald Menghin · Platzhirsch Home Living · Landstraße 11 · 6911 Lochau

*Prüfen: Ob die Skizze nach Fotos des Hauses urheberrechtlich unbedenklich ist (eigene Zeichnung nach Fotos ist in der Regel unkritisch, Fotos selbst nicht beilegen) [prüfen Anwalt]. Der Anruf an Unternehmen ist in AT zulässig, soweit kein Widerspruch besteht. Für DE gilt § 7 Abs. 2 Nr. 1 UWG, Anruf bei Unternehmern nur bei mutmaßlicher Einwilligung [prüfen].*

### 3.7 Drei Newsletter (fertig)

Versand nur an Empfänger mit Double-Opt-in (Fußzeile A aus `email-flows.md`, Adresse korrigiert auf Landstraße 11). Versandzeit Di–Do 18:00 Uhr (0.5). UTM `utm_source=newsletter&utm_campaign=neustart-<nr>`.

#### Newsletter 1 – Neustart „Nehmen Sie Platz.“
- **Betreff:** Nehmen Sie Platz.
- **Vorschauzeile:** Unsere neue Website, und warum bei uns jeder Raum mit einem Bleistift beginnt.
- **Text:**
  > Guten Tag [Vorname Nachname],
  >
  > unsere Website ist neu. Was gleich bleibt: Bei uns beginnt jeder Raum mit einem Gespräch und einem Bleistift.
  >
  > **So arbeiten wir.** Wir lernen Sie kennen, im Café in Lochau oder bei Ihnen zuhause. Wenn Ihr Projekt es braucht, auch einen oder zwei Tage vor Ort, um Licht, Räume und Gewohnheiten zu verstehen. Dann zeichnet Harald Menghin Ihr Konzept von Hand. Bei größeren Projekten bauen wir ein Modell, das man anfassen und umstellen kann. Erst danach planen wir in 3D und zeigen Ihnen den Raum fotorealistisch, bevor etwas bestellt wird.
  >
  > **Was neu ist.** Online können Sie jetzt einen Termin wählen, Ihren Grundriss hochladen und Ihren Stil finden. Neu sind auch unsere Seiten für Outdoor, Boote und Glasmosaik von Ezarri.
  >
  > [Knopf: Termin wählen]
  >
  > Wir freuen uns auf Sie.
  > Ihr Team von Platzhirsch Home Living
- **Bild:** B-HZ1 (Hand mit Bleistift auf Grundriss, Seelicht).

#### Newsletter 2 – Der Winter ist Planungszeit (Outdoor, Pool, Boot)
- **Betreff:** Im Winter planen, im Sommer Platz nehmen.
- **Vorschauzeile:** Terrasse, Pool und Boot: was jetzt entschieden werden sollte.
- **Text:**
  > Guten Tag [Vorname Nachname],
  >
  > draußen ist es grau. Für alles, was im Sommer draußen stattfindet, ist das die richtige Zeit.
  >
  > **Terrasse und Garten.** Möbel, Schatten und Licht planen wir als ein Konzept. Den Garten und den Bau übernehmen befugte Partnerbetriebe, die Termine stimmen wir für Sie ab. [Link: Outdoor planen]
  >
  > **Pool und Bad.** Als Ezarri-Vertragshändler planen wir Glasmosaik für Pool, Bad und Wellness und stimmen uns mit Ihrem Poolbauer ab. [Link: Glasmosaik von Ezarri]
  >
  > **Boot.** Steht Ihr Boot im Winterlager? Dann können wir jetzt Kajüte, Cockpit und Deck neu denken, mit befugten Partnern für Polster und Einbauten. [Link: Interior für Boote]
  >
  > [Knopf: Termin wählen]
  >
  > Nehmen Sie Platz.
  > Ihr Team von Platzhirsch Home Living
- **Bild:** B-OU2 (Terrasse im Winterlicht, Skizze als Overlay).
- **Segmentierung:** Interessen „Outdoor“, „Pool“, „Boot“ aus dem Präferenzzentrum. Ohne Interesse alle drei Blöcke, sonst nur die passenden.

#### Newsletter 3 – Küche und Wohnraum als ein Plan
- **Betreff:** Am eigenen Tisch.
- **Vorschauzeile:** Warum wir Küche und Wohnraum immer zusammen zeichnen.
- **Text:**
  > Guten Tag [Vorname Nachname],
  >
  > in den meisten Häusern ist die Küche der Raum, in dem man Platz nimmt. Deshalb zeichnen wir sie nie allein, sondern mit dem Esstisch, dem Sofa und dem Licht, das am Abend dazugehört.
  >
  > **Drei Fragen, die wir am Anfang stellen:** Wer kocht? Wer sitzt dabei? Wo fällt das Licht um 19 Uhr hin?
  >
  > Im Showroom in Lochau stehen Küchen von Poliform, Varenna und next125. Fronten, Stein und Griffe können Sie in die Hand nehmen. Online starten Sie mit dem Küchenplaner, danach zeichnet Harald Menghin Ihr Konzept von Hand.
  >
  > [Knopf: Küchenplaner starten] [Link: Termin wählen]
  >
  > Nehmen Sie Platz.
  > Ihr Team von Platzhirsch Home Living
- **Bild:** B-KU1 (Esstisch an der Küche, Abendlicht, Handskizze daneben).
- *„Fronten, Stein und Griffe in die Hand nehmen“ nur, wenn Muster ausliegen.*

### 3.8 Plakat und Print (Headlines)

Gestaltung: Paper-Grund, eine Headline in Bodoni, darunter „Nehmen Sie Platz.“ (nur wenn die Headline nicht selbst der Leitsatz ist), Horizontlinie, Logo, Adresse. Kein Markenlogo der Hersteller.

| # | Feld | Headline | Ort/Medium |
|---|---|---|---|
| P1 | Dach | **Nehmen Sie Platz.** | Großfläche Lochau/Bregenz, Schaufenster |
| P2 | Dach | **Jeder Raum beginnt mit einem Bleistift.** | City-Light Bregenz, Lindau |
| P3 | Dach | **Erst gezeichnet. Dann eingerichtet.** | Anzeige Regionalmagazin |
| P4 | Dach | **Fünf Minuten über die Grenze. Ein Espresso. Ein Sofa.** | Lindau, Plakat [Fahrzeit vorher prüfen, Platzhalter `[FAHRZEIT-LINDAU]`] |
| P5 | Möbel | **Probesitzen erlaubt. Ausdrücklich.** | Schaufenster, Café-Tischaufsteller |
| P6 | Möbel | **Ihr Sofa sollte zu Ihrem Licht passen.** | Anzeige |
| P7 | Küche | **Am eigenen Tisch.** | Bauherren-Messe, Anzeige |
| P8 | Küche | **Die Küche zeichnen wir mit dem Wohnzimmer.** | Bauherren-Messe |
| P9 | Outdoor | **Draußen ist auch ein Raum.** | Großfläche Frühjahr |
| P10 | Outdoor | **Im Winter planen. Im Sommer sitzen.** | Plakat Jan/Feb |
| P11 | Yacht | **Nehmen Sie Platz. An Bord.** | Aushang Häfen, Werften, Yachtclubs [Erlaubnis Hafenbetreiber] |
| P12 | Yacht | **Das Winterlager ist die Werkstatt für den Sommer.** | Werft-Aushang |
| P13 | Ezarri | **Die Farbe des Wassers wählen Sie.** | Anzeige Bau- und Poolmagazin |
| P14 | Ezarri | **Glasmosaik von Ezarri. Am Bodensee geplant.** | Bauherren-Messe |
| P15 | Hotel | **Ihre Gäste nehmen Platz.** | Fachmesse, Hotel-Mappe Titel |
| P16 | Hotel | **Vor der Eröffnung von Hand gezeichnet.** | Fachanzeige |
| P17 | Architekten | **Ihr Entwurf nimmt Platz.** | Architekturforum, Mailing per Post |
| P18 | Café | **Kaffee mit Aussicht auf Ihr nächstes Wohnzimmer.** | Café-Tafel, Tischaufsteller |

**Absenderblock:** Platzhirsch Home Living · Landstraße 11 · 6911 Lochau am Bodensee · platzhirsch.studio · [Öffnungszeiten]. Für CH-Medien „Landstrasse 11“.

### 3.9 Pinterest und Google-Profil (Kurzfassung)
- **Pinterest:** Für jedes Feld ein Board „Nehmen Sie Platz – [Feld]“. Pin-Titel nach dem Muster „[Raum] am Bodensee, von Hand gezeichnet“. Die 30 Pin-Titel aus `meta-pinterest-kampagnen.md` 4.3 bleiben bestehen, jeder bekommt das Suffix „· Platzhirsch, Lochau“.
- **Google-Profil-Posts:** 1 Post pro Woche im Wechsel der Felder, Text = Meta-Primärtext der Variante 1 des Felds, Knopf „Termin“.

### 3.10 Bildbriefing für Grafiker und Fotograf

**Allgemeine Vorgaben** (Design-Bibel §4, Fotografie-Bericht 19):
- Mindestens 85 % neutrale Töne (Paper `#faf8f4`, Stone, Ink), höchstens eine dunkle Fläche (Walnut), Messing höchstens 2 %. Kräftige Farbe kommt nur aus Produkt, Wasser oder Mosaik.
- **Seelicht:** natürliches Licht, wenn möglich mit Blick oder Reflex vom See. Die gleiche Vignette in vier Tageslichtern (Morgen, Mittag, Abend, Winter).
- **Horizontlinie:** 1 px, Ink 24 %, als wiederkehrendes Gestaltungselement auf jedem Motiv.
- **Handzeichnung als drittes Signaturelement:** Echte Skizzen von Harald (Scan 600 dpi, Bleistift oder Fineliner) liegen als Ebene über oder neben dem Foto. **Keine KI-Skizzen, keine nachgestellten Zeichnungen von Dritten.**
- **Menschen:** Hände, Rücken, Menschen beim Platznehmen. Keine Models in Posen. Kunden nur mit schriftlicher Einwilligung (R-B2).
- **Herstellerbilder** nur mit schriftlicher Freigabe (Inhaber-Entscheidung, offen). Ezarri: freigegebene Inhalte mit Quellenangabe „Bild: Ezarri“.
- **Renderings** als „Visualisierung“ kennzeichnen, wenn sie neben Fotos stehen (R-B2).
- **Formate:** Meta 1080×1350 (4:5) und 1080×1920 (9:16), Pinterest 1000×1500, LinkedIn 1200×627 und Dokument 1080×1350, Google Demand Gen 1200×1200 und 1200×628, Plakat 18/1 und A0 hoch. Text auf Bildern höchstens 20 % der Fläche, Safe Zones für Stories oben und unten je 250 px frei lassen.

| Kennung | Motiv | Bildaufbau | Text auf dem Bild | Quelle |
|---|---|---|---|---|
| B-HZ1 | Hand mit Bleistift auf Grundriss, Morgenlicht | Draufsicht, Grundriss füllt 2/3, Kaffeetasse am Rand | „Von Hand gezeichnet.“ | Shooting im Atelier |
| B-HZ2 | Kundengrundriss (anonymisiert) mit Skizze darüber | Split: links Plan, rechts Skizze | „Ihr Grundriss, unsere Skizze.“ | Projektarchiv, anonymisiert |
| B-HZ3 | Tablet mit Küchenplaner neben Skizzenblock | Schräg von oben, Tisch aus Holz | „Vom Planer zur Skizze.“ | Shooting + Screenshot |
| B-KE1/2/3 | **Vorher-Nachher-Kette:** Skizze → Modell → Rendering → Foto vom fertigen Raum (gleicher Blickwinkel) | Karussell mit 4 Karten bzw. Plakat in 4 Feldern | „Zuhören. Zeichnen. Modell. Rendern. Einrichten.“ | **ein** echtes Projekt mit Einwilligung (Inhaber liefert) |
| B-CA1 | Café-Tisch mit Espresso, Sofa im Hintergrund unscharf | Augenhöhe Sitzender, Seelicht | „Nehmen Sie Platz.“ | Showroom |
| B-SR1 | Ausstellungsvignette Wohnen, Mensch setzt sich | Weitwinkel 35 mm, Horizontlinie auf Sitzhöhe | „Probesitzen in Lochau.“ | Showroom |
| B-KU1 | Esstisch an der Küche, Abendlicht, zwei Gläser | Frontal, Tisch im Vordergrund | „Am eigenen Tisch.“ | Showroom-Küche |
| B-KU2 | Makro: Hand auf Steinkante und Front | Streiflicht, Detail 1:1 | „Material zum Anfassen.“ | Muster im Showroom |
| B-KU3 | Rohbau mit Lichtfall, Skizze der Küche als Overlay | Overlay 60 % Deckkraft | „Jetzt planen, später kochen.“ | Kundenbaustelle mit Einwilligung |
| B-OU1 | Seeterrasse mit Lounge und Schirm, Abend | Weit, See im Hintergrund | „Nehmen Sie Platz. Draußen.“ | Referenz oder Showroom-Outdoor |
| B-OU2 | Leere Terrasse im Winterlicht, Skizze der Möblierung als Overlay | wie B-KU3 | „Im Winter planen. Im Sommer sitzen.“ | eigenes Foto |
| B-OU3 | Tisch mit Plan, drei Hände (Gärtner, Elektriker, Platzhirsch) | Draufsicht | „Ein Ansprechpartner.“ | Shooting mit Partnern (Einwilligung) |
| B-OU4 | Outdoor-Möbel im Showroom, Person mit Kaffee | Augenhöhe | „Draußen probesitzen.“ | Showroom |
| B-YA1 | Boot im Winterlager unter Plane, Skizze der Kajüte als Overlay | Halle, kühles Licht | „Nehmen Sie Platz. An Bord.“ | Werft (Erlaubnis), eigenes Foto |
| B-YA2 | Cockpit mit neuen Polstern und Kissen, See | Von oben/achtern | „Interior für Boote.“ | erst nach erstem Projekt. Bis dahin Rendering, gekennzeichnet |
| B-YA3 | Hand mit Maßband an Bord, Skizzenblock | Detail | „Erst gezeichnet, dann an Bord.“ | Shooting |
| B-YA4 | Bootshaus am Steg, Abend | Weit | „Bootshaus und Boot.“ | Referenz mit Einwilligung |
| B-YA5 | Makro Outdoor-Stoff mit Wassertropfen | Streiflicht | „Stoffe für das Deck.“ | Muster |
| B-EZ1 | Pool mit Ezarri-Mosaik, Liege am Rand, Seelicht | Augenhöhe Beckenrand | „Nehmen Sie Platz. Am Beckenrand.“ | Ezarri-Freigabe („Bild: Ezarri“) |
| B-EZ2 | Konfigurator-Screenshot neben Mosaikmuster | Split | „Ihr Mosaik, Ihr Muster.“ | Screenshot nach Livegang |
| B-EZ3 | Pool und Terrasse von oben, Skizze der Terrasse | Drohne oder Rendering (gekennzeichnet) | „Pool und Terrasse als ein Plan.“ | Rendering |
| B-EZ4 | Drei Mosaikmuster in Wasserschale bei Tageslicht | Draufsicht, Makro | „Die Farbe des Wassers.“ | Muster im Showroom |
| B-EZ5 | Dusche/Spa mit Mosaik, Dampf | Detail | „Mosaik für Bad und Spa.“ | Ezarri-Freigabe |
| B-HO1 | Hotel-Lobby, Gast nimmt Platz, Tageslicht | Weit, Mensch klein | „Ihre Gäste nehmen Platz.“ | erst Referenz mit Freigabe. Bis dahin Handskizze einer Lobby |
| B-HO2 | Skizze einer Lobby neben Rendering derselben Ansicht | Split | „Ihr Hotel, bevor es fertig ist.“ | eigenes Material |
| B-HO3 | Zeitplan-Grafik rückwärts ab Eröffnung | Typografisch, Horizontlinie als Zeitachse | „Ein Plan für das ganze Haus.“ | Grafik |
| B-HO4 | Kostenaufstellung als Grafik (ohne echte Zahlen) | Typografisch | „Klar gerechnet.“ | Grafik |
| B-HO5 | Musterzimmer im Showroom | Augenhöhe, Bett und Sessel | „Erst probewohnen.“ | nur wenn gebaut |

**Shooting-Plan mit wenig Kapital** [Schätzung]: 1 Tag Showroom und Atelier (Harald beim Zeichnen, Café, Vignetten, Makros), 1 halber Tag Werft/Hafen. Das deckt etwa 70 % der Motive ab. Alles andere entsteht aus freigegebenem Ezarri-Material, Renderings und Grafik.

---

## 4. Maßnahmen

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| **P0** | Adresse in Ads-CSV, Generator und E-Mail-Fußzeile auf „Landstraße 11“ korrigieren, „Raumplanung inklusive“ ersetzen (A1, A2, A10) | S | 0 € | Indirekt: verhindert falsche Anfahrten und UWG-Risiko. Voraussetzung für jeden Start | Code-Team (Generator), Marketing |
| **P0** | Echtes USP-Material liefern: 10 Skizzen-Scans, 3 Modellfotos, 1 vollständige Vorher-Nachher-Kette, Porträt beim Zeichnen | M | 0–1.500 € (Fotograf 1 Tag) [Schätzung] | Hoch: Ohne dieses Material ist die ganze Kampagne nicht zulässig (USP-Regeln). Mit ihm unterscheidet sich jede Anzeige vom Wettbewerb | Inhaber |
| **P0** | Zielseite `/de/hotel-einrichtung` bauen (Prozess, Leistungsumfang, Zeitplan, Kostenaufstellung, Kontakt), Hotel-Mappe als PDF | M | intern | Hoch: Pipeline 2,0–6,6 Mio. € Bedarf aus 23/8.4. Schon **ein** Hotelauftrag (100–200 T€ Ø-Ticket, 23/5.1) [Schätzung] übersteigt das Jahres-Mediabudget | Code-Team, Inhaber (Texte freigeben) |
| **P0** | Briefe mit Handskizze an die 10 Hotel-A-Leads, Anruf eine Woche später | M | ca. 50 € Porto/Druck, 2–3 Tage Zeichenzeit | Sehr hoch: Bei 1–2 Gesprächen und einem Auftrag sind das 100–200 T€ [Schätzung]. Termindruck wegen Ostern 2027 | Inhaber (Harald) |
| **P1** | Neue Kampagnen Ezarri, Yacht und Hotel aus `kampagnen-rsa-neu.csv` in den Generator übernehmen und nach Gate 0 starten | S | ca. 500 €/Monat Media [Schätzung] | Mittel: Ezarri ist das einzige Suchfeld mit erlaubter Händler-Aussage neben ClassiCon. Pool- und Badprojekte haben Projektcharakter mit Cross-Selling zu Outdoor | Code-Team (Generator), Marketing |
| **P1** | Neustart-Kampagne Phase 0: Newsletter 1, Google-Profil-Posts, 12 Instagram-Posts „Nehmen Sie Platz.“ aus den Motiven B-HZ/B-KE/B-CA | M | 0 € Media | Mittel: Reaktiviert den Bestand. Bestandskunden sind laut Masterkonzept Teil der 150–350 T€ Zusatz-Auftragseingang in 90 Tagen [Schätzung 23/1] | Marketing, Inhaber (Freigabe) |
| **P1** | Leitsatz und USP-Headlines in alle bestehenden 90 RSAs und Callouts einbauen (A3, A5), Snippets je Kampagne trennen (A4) | S | 0 € | Mittel: bessere Anzeigenrelevanz und Klickrate. Effekt nicht bezifferbar, nach 4–6 Wochen über die Asset-Bewertung messen | Code-Team (Generator) |
| **P1** | Meta Lead Ads ohne Pixel (Outdoor O1/O2, Yacht Y1, Ezarri E1/E3) im Winter, mit Lead-Formular | S | 300–600 €/Monat [Schätzung] | Mittel: Winterplanung füllt die ruhige Showroom-Zeit. Outdoor-Projekte 50–150 T€ Möbelanteil (Bericht 30) [Schätzung] | Marketing |
| **P1** | Meta-Verbotsliste um ClassiCon und Ezarri ergänzen (A9) | S | 0 € | Gering, verhindert widersprüchliche Freigaben | Marketing |
| **P2** | LinkedIn: Harald postet 2× im Monat organisch (Skizzen, Prozess), Test-Budget für LA1–LA4 und LH1–LH4 | M | 500 € für 6 Wochen [Schätzung] | Mittel: Architekten sind Multiplikatoren (Programm in `architekten-programm.md`), Hotel-Entscheider sind schwer anders erreichbar | Inhaber, Marketing |
| **P2** | Plakatwelle Lochau/Bregenz/Lindau (P1, P2, P4) zum Saisonstart | M | 1.500–4.000 € pro Welle [Schätzung, Angebote einholen] | Mittel: Bekanntheit am Nordufer, Ziel aus 23/4.2 Nr. 2. Erst nach Gate 0 | Inhaber |
| **P2** | Hafen- und Werft-Aushänge (P11, P12), Partnergespräch mit 1–2 Werften und einem Sattler | S | ca. 100 € Druck | Gering bis mittel: Yacht-Potenzial 0,1–0,35 Mio. € p. a. ab Jahr 2 (Bericht 29) [Schätzung] | Inhaber |
| **P2** | Newsletter 2 und 3 versenden, Präferenzzentrum mit Interessen Outdoor/Pool/Boot/Küche | S | 0 € | Mittel: Cross-Selling im Bestand | Marketing, Code-Team (Präferenzfelder) |
| **P2** | Binni-Kampagne vorbereiten (Name, Preisbeispiel, Bilder), Start erst nach Vertrag | M | – | Hoch, aber bedingt: 70–150 T€/Monat bei M36 laut 26 [Schätzung] | Inhaber |
| **P3** | Musterzimmer „Hotel“ im Showroom (für H5) | L | offen | Unklar, erst bei mehr als 2 Hotelprojekten in der Pipeline sinnvoll | Inhaber |
| **P3** | Demand-Gen- und YouTube-Kurzfilm „Vom Strich zum Raum“ (60 s, Zeitraffer Skizze → Rendering → Foto) | M | 1.000–3.000 € Produktion [Schätzung] | Mittel bis hoch für die Bekanntheit, erst mit fertigem Referenzprojekt | Marketing, Partner (Film) |
